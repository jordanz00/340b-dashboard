<?php
/**
 * Shortcodes and frontend assets.
 */

if (!defined('ABSPATH')) {
    exit;
}

class PA_Booking_Frontend {
    /** @var string ''|'header'|'footer' — set while rendering template parts */
    private static $template_part_slug = '';

    public function __construct() {
        add_shortcode('pa_booking', array($this, 'render_booking'));
        add_shortcode('pa_booking_success', array($this, 'render_success'));
        add_filter('body_class', array($this, 'body_class'));
        add_filter('pre_render_block', array($this, 'note_template_part'), 5, 2);
        add_filter('render_block', array($this, 'filter_site_logo_block'), 12, 2);
        add_action('wp_enqueue_scripts', array($this, 'maybe_assets'), 100);
        add_action('wp_head', array($this, 'inject_logo_critical_css'), 4);
        add_action('wp_head', array($this, 'inject_site_icon'), 5);
        add_action('wp_head', array($this, 'remove_wp_site_icon'), 0);
        add_action('wp_head', array($this, 'inject_seo'), 1);
        add_filter('wp_resource_hints', array($this, 'resource_hints'), 10, 2);
        add_action('template_redirect', array($this, 'handle_success_query'));
        add_action('template_redirect', array($this, 'redirect_contact_page'), 1);
        add_action('template_redirect', array($this, 'redirect_status_page'), 2);
    }

    /**
     * Speed up first paint of embedded media and payment scripts.
     */
    public function resource_hints($hints, $relation_type) {
        if ($relation_type === 'preconnect') {
            $hints[] = 'https://www.youtube.com';
            $hints[] = 'https://i.ytimg.com';
        }
        if ($relation_type === 'dns-prefetch') {
            $hints[] = '//js.stripe.com';
            $hints[] = '//paylinks.godaddy.com';
        }
        return $hints;
    }

    /**
     * True when a dedicated SEO plugin is active, so we never duplicate meta tags.
     */
    private function seo_plugin_active() {
        return defined('WPSEO_VERSION')        // Yoast
            || defined('RANK_MATH_VERSION')    // Rank Math
            || defined('AIOSEO_VERSION')       // All in One SEO
            || class_exists('The_SEO_Framework\\Load');
    }

    /**
     * Best available share image: full square PAMA mark (favicon asset).
     */
    public static function og_image_url() {
        return self::logo_url();
    }

    /**
     * Enqueue version string: plugin version + asset filemtime (bust CDN after deploy).
     *
     * @param string $relative Path under plugin root (e.g. assets/site.js).
     * @return string
     */
    public static function asset_version($relative) {
        $path = PA_BOOKING_PATH . ltrim($relative, '/');
        $mtime = is_readable($path) ? (string) filemtime($path) : '0';
        return PA_BOOKING_VERSION . '.' . $mtime;
    }

    /**
     * Inject SEO meta: description, Open Graph, Twitter cards, and LocalBusiness JSON-LD.
     * Skipped when a dedicated SEO plugin already manages these tags.
     */
    public function inject_seo() {
        if (is_admin() || $this->seo_plugin_active()) {
            return;
        }

        $s = PA_Booking::get_settings();
        $name = $s['artist_name'] ?? 'Pennsylvania Media Arts LLC';
        $site_name = 'Pennsylvania Media Arts';
        $image = esc_url(self::og_image_url());
        $url = esc_url(home_url('/'));
        if (is_singular() && !is_front_page()) {
            $perma = get_permalink();
            if ($perma) {
                $url = esc_url($perma);
            }
        }

        $description = $this->seo_description($s);
        $title = wp_get_document_title();

        echo "\n<!-- PA Media Arts SEO -->\n";
        echo '<meta name="description" content="' . esc_attr($description) . '">' . "\n";
        echo '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">' . "\n";

        // Open Graph
        echo '<meta property="og:type" content="' . (is_singular() && !is_front_page() ? 'article' : 'website') . '">' . "\n";
        echo '<meta property="og:site_name" content="' . esc_attr($site_name) . '">' . "\n";
        echo '<meta property="og:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta property="og:description" content="' . esc_attr($description) . '">' . "\n";
        echo '<meta property="og:url" content="' . $url . '">' . "\n";
        echo '<meta property="og:image" content="' . $image . '">' . "\n";
        echo '<meta property="og:locale" content="en_US">' . "\n";

        // Twitter
        echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta name="twitter:description" content="' . esc_attr($description) . '">' . "\n";
        echo '<meta name="twitter:image" content="' . $image . '">' . "\n";

        if (is_front_page()) {
            echo $this->business_jsonld($s, $image);
        }
        echo "<!-- /PA Media Arts SEO -->\n";
    }

    /**
     * Context-aware meta description.
     */
    private function seo_description($s) {
        $deposit = number_format(($s['deposit_cents'] ?? 15000) / 100, 0);
        if (is_front_page() || is_home()) {
            return 'Pennsylvania Media Arts — professional photography, video, and live production across Central PA. Book online in minutes with secure deposits via GoDaddy Payments & Stripe. Nominated for Best Videography at the 2026 Central Pennsylvania Music Awards.';
        }
        if (is_page('book') || $this->page_has_shortcode('pa_booking')) {
            return 'Reserve your date with Pennsylvania Media Arts. Choose your service, date, and time, then secure your booking with a $' . $deposit . ' deposit paid securely through GoDaddy Payments or Stripe. Confirmed within one business day.';
        }
        $excerpt = is_singular() ? wp_strip_all_tags(get_the_excerpt()) : '';
        if ($excerpt) {
            return wp_trim_words($excerpt, 32, '…');
        }
        return 'Pennsylvania Media Arts — professional photography, video, and live production across Central Pennsylvania. Book online with secure deposits.';
    }

    /**
     * LocalBusiness / ProfessionalService structured data for rich results.
     */
    private function business_jsonld($s, $image) {
        $services = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', (string) ($s['services'] ?? '')))));
        $offers = array();
        foreach ($services as $service) {
            $offers[] = array(
                '@type' => 'Offer',
                'itemOffered' => array('@type' => 'Service', 'name' => $service),
            );
        }

        $data = array(
            '@context' => 'https://schema.org',
            '@type' => array('LocalBusiness', 'ProfessionalService'),
            '@id' => home_url('/#business'),
            'name' => 'Pennsylvania Media Arts LLC',
            'alternateName' => 'Pennsylvania Media Arts',
            'url' => home_url('/'),
            'image' => $image,
            'logo' => esc_url(self::logo_url()),
            'email' => sanitize_email($s['notify_email'] ?? 'jordan@pamedia.art'),
            'description' => 'Professional event photography, video production, live audio, and DJ services across Central Pennsylvania. Custom online booking with secure deposits.',
            'address' => array(
                '@type' => 'PostalAddress',
                'addressLocality' => 'New Cumberland',
                'addressRegion' => 'PA',
                'postalCode' => '17070',
                'addressCountry' => 'US',
            ),
            'areaServed' => array(
                '@type' => 'AdministrativeArea',
                'name' => 'Central Pennsylvania',
            ),
            'knowsAbout' => array('Event Photography', 'Video Production', 'Live Audio', 'DJ Services', 'Drone Photography'),
            'sameAs' => array('https://www.youtube.com/@PAMediaArts'),
            'award' => 'Nominated — Best Videography, 2026 Central Pennsylvania Music Awards (Central Pennsylvania Music Hall of Fame)',
            'priceRange' => '$$',
        );
        if ($offers) {
            $data['makesOffer'] = $offers;
        }

        return '<script type="application/ld+json">'
            . wp_json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
            . '</script>' . "\n";
    }

    /**
     * Liquid-glass design system — works with Gutenify theme or standalone.
     */
    public function body_class($classes) {
        if (is_admin()) {
            return $classes;
        }
        $classes[] = 'pa-glass-site';
        $classes[] = 'pa-ios-ui';
        if (is_page('book')) {
            $classes[] = 'pa-booking-page';
        }
        if (is_page('services')) {
            $classes[] = 'pa-services-page';
        }
        return $classes;
    }

    /**
     * Cache-bust query for plugin-hosted brand marks (version + file mtime).
     *
     * @param string $filename Basename under assets/ (e.g. pa-logo-dark.png).
     * @return string
     */
    private static function logo_cache_buster($filename) {
        $path = PA_BOOKING_PATH . 'assets/' . $filename;
        $mtime = is_readable($path) ? (string) filemtime($path) : '0';
        return PA_BOOKING_VERSION . '.' . $mtime;
    }

    /**
     * Plugin-hosted PAMA brand mark (square icon + header/footer lockups).
     * Source: assets/pama-brand-source.png — run bin/process-pama-logo.py to regenerate.
     */
    public static function logo_url() {
        return add_query_arg('v', self::logo_cache_buster('pa-logo.png'), PA_BOOKING_URL . 'assets/pa-logo.png');
    }

    public static function logo_dark_url() {
        return add_query_arg('v', self::logo_cache_buster('pa-logo-dark.png'), PA_BOOKING_URL . 'assets/pa-logo-dark.png');
    }

    public static function logo_white_url() {
        return add_query_arg('v', self::logo_cache_buster('pa-logo-white.png'), PA_BOOKING_URL . 'assets/pa-logo-white.png');
    }

    /**
     * Track header vs footer template parts so site-logo blocks get the right mark.
     *
     * @param string|null $pre_render
     * @param array       $parsed_block
     * @return string|null
     */
    public function note_template_part($pre_render, $parsed_block) {
        if (($parsed_block['blockName'] ?? '') === 'core/template-part') {
            $slug = $parsed_block['attrs']['slug'] ?? '';
            self::$template_part_slug = in_array($slug, array('header', 'footer'), true) ? $slug : '';
        }
        return $pre_render;
    }

    /**
     * Server-side logo swap — works before JS (fixes mobile flash / missing lockup).
     *
     * @param string $block_content
     * @param array  $block
     * @return string
     */
    public function filter_site_logo_block($block_content, $block) {
        if (($block['blockName'] ?? '') !== 'core/site-logo' || $block_content === '') {
            return $block_content;
        }

        $variant = (self::$template_part_slug === 'footer') ? 'white' : 'dark';
        $url = $variant === 'white' ? self::logo_white_url() : self::logo_dark_url();
        $lockup = $variant === 'white' ? 'pa-brand-logo-lockup-white' : 'pa-brand-logo-lockup';
        $alt = $variant === 'white' ? '' : (PA_Booking::get_settings()['artist_name'] ?? 'Pennsylvania Media Arts');

        // Strip responsive <picture> wrappers so mobile cannot load theme srcset/WebP.
        $block_content = preg_replace('/<picture[^>]*>/i', '', $block_content);
        $block_content = preg_replace('/<\/picture>/i', '', $block_content);
        $block_content = preg_replace('/<source[^>]*\/?>/i', '', $block_content);

        if (class_exists('WP_HTML_Tag_Processor')) {
            $processor = new WP_HTML_Tag_Processor($block_content);
            $patched = false;
            while ($processor->next_tag('img')) {
                $processor->set_attribute('src', $url);
                $processor->remove_attribute('srcset');
                $processor->remove_attribute('sizes');
                $processor->remove_attribute('data-src');
                $processor->remove_attribute('data-srcset');
                $processor->remove_attribute('width');
                $processor->remove_attribute('height');
                $existing = (string) $processor->get_attribute('class');
                $processor->set_attribute(
                    'class',
                    trim($existing . ' pa-brand-logo ' . $lockup)
                );
                $processor->set_attribute('loading', 'eager');
                $processor->set_attribute('decoding', 'sync');
                if ($alt !== '') {
                    $processor->set_attribute('alt', $alt);
                }
                $patched = true;
            }
            if ($patched) {
                $updated = $processor->get_updated_html();
                if ($updated !== '') {
                    return $updated;
                }
            }
        }

        $replaced = preg_replace(
            '/<img([^>]*)\bsrc="[^"]*"/i',
            '<img$1 src="' . esc_url($url) . '"',
            $block_content
        );
        if (is_string($replaced) && $replaced !== $block_content) {
            $replaced = preg_replace(
                '/\bclass="([^"]*)"/i',
                'class="$1 pa-brand-logo ' . esc_attr($lockup) . '"',
                $replaced
            );
            $replaced = preg_replace('/\s(srcset|sizes|data-src|data-srcset|width|height)="[^"]*"/i', '', $replaced);
            return $replaced;
        }
        return $block_content;
    }

    /**
     * Hide theme custom-logo flash before site.js runs (mobile first paint).
     */
    public function inject_logo_critical_css() {
        if (is_admin()) {
            return;
        }
        echo '<style id="pa-brand-logo-critical">'
            . 'header .wp-block-site-logo img:not(.pa-brand-logo-lockup):not(.pa-brand-logo-lockup-white),'
            . 'header img.custom-logo:not(.pa-brand-logo-lockup):not(.pa-brand-logo-lockup-white),'
            . '.wp-block-navigation__responsive-container .wp-block-site-logo img:not(.pa-brand-logo-lockup),'
            . '.wp-block-navigation__responsive-container img.custom-logo:not(.pa-brand-logo-lockup)'
            . '{visibility:hidden;max-height:1px;overflow:hidden}'
            . '</style>' . "\n";

        $dark = esc_js(self::logo_dark_url());
        $white = esc_js(self::logo_white_url());
        echo '<script id="pa-brand-logo-inline">'
            . '(function(){'
            . 'var dark="' . $dark . '",white="' . $white . '";'
            . 'function patch(scope,url,cls){if(!scope||!url)return;'
            . 'scope.querySelectorAll(".wp-block-site-logo img,img.custom-logo").forEach(function(img){'
            . 'img.src=url;img.removeAttribute("srcset");img.removeAttribute("sizes");'
            . 'img.classList.add("pa-brand-logo",cls);});}'
            . 'function run(){'
            . 'var h=document.querySelector("header.pa-site-header,header.wp-block-template-part,header");'
            . 'if(h){patch(h,dark,"pa-brand-logo-lockup");}'
            . 'document.querySelectorAll(".wp-block-navigation__responsive-container").forEach(function(o){patch(o,dark,"pa-brand-logo-lockup");});'
            . 'var f=document.querySelector("footer.pa-site-footer,footer.wp-block-template-part,footer");'
            . 'if(f){patch(f,white,"pa-brand-logo-lockup-white");}'
            . 'document.documentElement.classList.add("pa-brand-ready");}'
            . 'if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",run);}else{run();}'
            . 'document.addEventListener("click",function(e){var t=e.target;if(t&&t.closest&&t.closest(".wp-block-navigation__responsive-container-open,.wp-block-navigation__responsive-container-close")){setTimeout(run,50);}});'
            . 'window.addEventListener("pageshow",run);'
            . '})();'
            . '</script>' . "\n";
    }

    /**
     * Canonical URL for the online booking funnel (/book/ or home anchor).
     */
    public static function book_url() {
        if (is_front_page()) {
            return home_url('/#pa-booking-app');
        }
        $page = get_page_by_path('book');
        if ($page && $page->post_status === 'publish') {
            return get_permalink($page);
        }
        return home_url('/book/');
    }

    /**
     * Replace WordPress custom site icon with the PA Media Arts logo.
     */
    public function remove_wp_site_icon() {
        if (is_admin()) {
            return;
        }
        remove_action('wp_head', 'wp_site_icon', 99);
    }

    /**
     * Favicon + home-screen icon using the PA Media Arts logo.
     */
    public function inject_site_icon() {
        if (is_admin()) {
            return;
        }
        $logo = esc_url(self::logo_url());
        $dark = esc_url(self::logo_dark_url());
        echo '<link rel="icon" href="' . $logo . '" sizes="any">' . "\n";
        echo '<link rel="apple-touch-icon" href="' . $logo . '">' . "\n";
        echo '<link rel="preload" as="image" href="' . $dark . '">' . "\n";
    }

    public function maybe_assets() {
        if (!is_admin()) {
            wp_enqueue_style('pa-site', PA_BOOKING_URL . 'assets/site.css', array(), self::asset_version('assets/site.css'));
            wp_enqueue_style('pa-glass', PA_BOOKING_URL . 'assets/glass.css', array('pa-site'), self::asset_version('assets/glass.css'));
            wp_enqueue_style('pa-site-ive', PA_BOOKING_URL . 'assets/site-ive.css', array('pa-glass'), self::asset_version('assets/site-ive.css'));
            wp_enqueue_script('pa-site', PA_BOOKING_URL . 'assets/site.js', array(), self::asset_version('assets/site.js'), true);
            $s = PA_Booking::get_settings();
            $site_service_lines = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', (string) ($s['services'] ?? '')))));
            wp_localize_script(
                'pa-site',
                'PASite',
                array(
                    'logoUrl'  => esc_url_raw(self::logo_url()),
                    'logoDarkUrl' => esc_url_raw(self::logo_dark_url()),
                    'logoWhiteUrl' => esc_url_raw(self::logo_white_url()),
                    'assetVersion' => PA_BOOKING_VERSION,
                    'siteName' => $s['artist_name'] ?? 'Pennsylvania Media Arts LLC',
                    'homeUrl'  => esc_url_raw(home_url('/')),
                    'bookUrl'  => esc_url_raw(self::book_url()),
                    'tagline'  => $s['tagline'] ?: 'Photography, video & live production · Pennsylvania.',
                    'aboutParagraphs' => PA_Booking::about_paragraphs($s),
                    'notifyEmail' => sanitize_email($s['notify_email'] ?? 'jordan@pamedia.art'),
                    'paymentsEnabled' => PA_Booking::accepts_deposit_payments(),
                    'services' => $site_service_lines,
                    'legalName' => 'Pennsylvania Media Arts LLC',
                    'businessLocation' => 'New Cumberland, Pennsylvania',
                    'privacyUrl' => esc_url_raw(home_url('/privacy-policy/')),
                    'termsUrl' => esc_url_raw(home_url('/terms-of-service/')),
                    'isBookingPage' => is_page('book'),
                    'isServicesPage' => is_page('services'),
                    'isAboutPage' => is_page('about'),
                    'youtubeChannelUrl' => 'https://www.youtube.com/@PAMediaArts',
                    'youtubeVideos' => PA_Booking_YouTube::featured_video_ids(),
                )
            );
        }
        if (!$this->should_load_booking_assets()) {
            return;
        }
        $s = PA_Booking::get_settings();
        wp_enqueue_style('pa-booking', PA_BOOKING_URL . 'assets/booking.css', array('pa-glass'), self::asset_version('assets/booking.css'));
        wp_enqueue_style('pa-booking-tokens', PA_BOOKING_URL . 'assets/booking-tokens.css', array('pa-booking'), self::asset_version('assets/booking-tokens.css'));
        wp_enqueue_style('pa-booking-v4', PA_BOOKING_URL . 'assets/booking-v4.css', array('pa-booking-tokens'), self::asset_version('assets/booking-v4.css'));
        wp_enqueue_style('pa-booking-experience', PA_BOOKING_URL . 'assets/booking-experience.css', array('pa-booking-v4'), self::asset_version('assets/booking-experience.css'));
        wp_enqueue_style('pa-booking-saas', PA_BOOKING_URL . 'assets/booking-saas.css', array('pa-booking-experience'), self::asset_version('assets/booking-saas.css'));
        wp_enqueue_style('pa-booking-pro', PA_BOOKING_URL . 'assets/booking-pro.css', array('pa-booking-saas'), self::asset_version('assets/booking-pro.css'));
        wp_enqueue_style('pa-booking-ive', PA_BOOKING_URL . 'assets/booking-ive.css', array('pa-booking-pro'), self::asset_version('assets/booking-ive.css'));
        wp_enqueue_script('pa-booking', PA_BOOKING_URL . 'assets/booking.js', array(), self::asset_version('assets/booking.js'), true);
        $service_lines = array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', (string) ($s['services'] ?? ''))));
        wp_localize_script(
            'pa-booking',
            'PABooking',
            array(
                'restUrl'      => esc_url_raw(rest_url('pa-booking/v1/')),
                'nonce'        => wp_create_nonce('pa_booking_request'),
                'minLeadHours' => (int) ($s['min_lead_hours'] ?? 48),
                'policies'     => array(
                    'deposit' => $s['policy_deposit'] ?? '',
                    'cancel'  => $s['policy_cancel'] ?? '',
                    'travel'  => $s['policy_travel'] ?? '',
                ),
                'servicePackages' => PA_Booking_Service_Catalog::packages_for_services(array_values($service_lines)),
                'addons'          => PA_Booking_Service_Catalog::addons(),
                'notifyEmail'     => sanitize_email($s['notify_email'] ?? 'jordan@pamedia.art'),
                'legal' => array(
                    'privacyUrl' => esc_url_raw(home_url('/privacy-policy/')),
                    'termsUrl'   => esc_url_raw(home_url('/terms-of-service/')),
                ),
                'depositCents' => (int) ($s['deposit_cents'] ?? 15000),
                'showStripeTestBanner' => current_user_can('manage_options'),
                'travelArea' => $s['travel_area'] ?? 'Central Pennsylvania',
                'paylinkUrl'        => PA_Booking_Payments::paylink_configured() ? PA_Booking_Payments::paylink_url() : '',
                'paylinkTiers'      => PA_Booking_Payments::paylink_configured() ? PA_Booking_Payments::paylink_tier_urls() : array(),
                'depositReturnUrl'  => PA_Booking_Payments::paylink_configured() ? PA_Booking_Payments::deposit_return_url() : '',
            )
        );
    }

    private function should_load_booking_assets() {
        if (is_front_page() || is_page('book')) {
            return true;
        }
        return $this->page_has_shortcode('pa_booking') || $this->page_has_shortcode('pa_booking_success');
    }

    private function page_has_shortcode($tag) {
        if (!is_singular()) {
            return false;
        }
        $post = get_post();
        return $post && has_shortcode($post->post_content, $tag);
    }

    public function handle_success_query() {
        if (isset($_GET['pa_booking_success']) && isset($_GET['session_id'])) {
            PA_Booking_Stripe::complete_session(sanitize_text_field(wp_unslash($_GET['session_id'])));
        }
    }

    /**
     * Contact page is retired — send visitors straight to booking.
     */
    public function redirect_status_page() {
        if (is_admin() || wp_doing_ajax()) {
            return;
        }
        if (!is_page('booking-status')) {
            return;
        }
        wp_safe_redirect(home_url('/#pa-booking-app'), 301);
        exit;
    }

    public function redirect_contact_page() {
        if (is_admin() || wp_doing_ajax()) {
            return;
        }
        if (!is_page('contact')) {
            return;
        }
        wp_safe_redirect(home_url('/#pa-booking-app'), 301);
        exit;
    }

    public function render_booking() {
        $s = PA_Booking::get_settings();
        $deposit = number_format($s['deposit_cents'] / 100, 2);
        $payments = PA_Booking::accepts_deposit_payments();
        $artist = esc_html($s['artist_name'] ?? 'Pennsylvania Media Arts LLC');
        $tagline = esc_html($s['tagline'] ?? '');
        ob_start();
        ?>
        <div id="pa-book" class="pa-booking-root pa-booking-v4 pa-booking-premium alignwide" aria-label="Book <?php echo $artist; ?>">
            <header class="pa-booking-hero">
                <p class="pa-booking-eyebrow">Pennsylvania Media Arts · Online booking</p>
                <h2 class="pa-booking-title">Reserve your production date</h2>
                <p class="pa-booking-lead pa-booking-lead--hero">
                    <?php if ($tagline) : ?>
                        <?php echo $tagline; ?>
                    <?php else : ?>
                        Professional photography, video, live audio, and DJ coverage across Central Pennsylvania.
                    <?php endif; ?>
                </p>
                <div class="pa-booking-credential-strip" role="list" aria-label="Credentials">
                    <span class="pa-credential-item" role="listitem">
                        <span class="pa-credential-icon" aria-hidden="true">✓</span>
                        Confirmation within one business day
                    </span>
                    <?php if ($payments) : ?>
                    <span class="pa-credential-item" role="listitem">
                        <span class="pa-credential-icon pa-credential-icon--lock" aria-hidden="true">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 10V8a6 6 0 1 1 12 0v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="4" y="10" width="16" height="11" rx="2.5" fill="currentColor"/></svg>
                        </span>
                        Secure deposit checkout
                    </span>
                    <?php endif; ?>
                </div>
                <?php if ($payments) : ?>
                <p class="pa-booking-value-prop">
                    Choose your package, pick an open date, and secure your slot with a
                    <strong>$<?php echo esc_html($deposit); ?> deposit</strong> — applied toward your final balance.
                </p>
                <?php else : ?>
                <p class="pa-booking-value-prop">Choose your package and an open date — we confirm by email within one business day.</p>
                <?php endif; ?>
            </header>

            <div id="pa-booking-app" class="pa-booking-app" data-deposit="<?php echo esc_attr($deposit); ?>">
                <p class="pa-booking-loading">Loading…</p>
            </div>

            <div class="pa-booking-supplement">
            <ol class="pa-how-it-works" aria-label="How booking works">
                <li><strong>Choose package</strong><span class="pa-how-step-detail">Photo, video, audio, or DJ</span></li>
                <li><strong>Pick a date</strong><span class="pa-how-step-detail">Live calendar · deposit holds your slot</span></li>
                <li><strong>Confirm</strong><span class="pa-how-step-detail"><?php echo $payments ? 'Policies & deposit' : 'Submit for confirmation'; ?></span></li>
            </ol>

            <section class="pa-booking-faq" aria-labelledby="pa-booking-faq-title">
                <h3 id="pa-booking-faq-title" class="pa-booking-faq-title">Frequently asked questions</h3>
                <div class="pa-booking-faq-list">
                    <?php foreach (PA_Booking_Service_Catalog::faq_items() as $item) : ?>
                    <div class="pa-faq-item">
                        <p class="pa-faq-q"><?php echo esc_html($item['q']); ?></p>
                        <p class="pa-faq-a"><?php echo esc_html($item['a']); ?></p>
                    </div>
                    <?php endforeach; ?>
                </div>
            </section>

            <section class="pa-booking-prep" aria-labelledby="pa-booking-prep-title">
                <h3 id="pa-booking-prep-title" class="pa-booking-prep-title">What to expect after you book</h3>
                <ol class="pa-booking-prep-steps">
                    <?php foreach (PA_Booking_Service_Catalog::prep_steps() as $step) : ?>
                    <li>
                        <strong><?php echo esc_html($step['title']); ?></strong>
                        <span><?php echo esc_html($step['body']); ?></span>
                    </li>
                    <?php endforeach; ?>
                </ol>
            </section>

            <section class="pa-booking-policies" id="pa-booking-policies" aria-labelledby="pa-booking-policies-title">
                <h3 id="pa-booking-policies-title" class="pa-policies-title">Policies</h3>
                <div class="pa-policies-grid">
                    <div class="pa-policy-card">
                        <h4>Deposit</h4>
                        <p><?php echo esc_html($s['policy_deposit'] ?? ''); ?></p>
                    </div>
                    <div class="pa-policy-card">
                        <h4>Cancellation</h4>
                        <p><?php echo esc_html($s['policy_cancel'] ?? ''); ?></p>
                    </div>
                    <div class="pa-policy-card">
                        <h4>Travel</h4>
                        <p><?php echo esc_html($s['policy_travel'] ?? ''); ?></p>
                    </div>
                </div>
            </section>
            </div>
        </div>

        <div class="pa-booking-sticky" aria-label="Quick book" hidden>
            <a class="pa-booking-cta pa-booking-cta-primary wp-element-button" href="#pa-booking-app">Continue</a>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_success() {
        $s = PA_Booking::get_settings();
        $artist = esc_html($s['artist_name'] ?? 'Pennsylvania Media Arts LLC');
        $email = esc_html($s['notify_email'] ?? 'jordan@pamedia.art');
        $requested = isset($_GET['pa_requested']);
        $paid = false;
        $booking_id = isset($_GET['pa_booking']) ? (int) $_GET['pa_booking'] : 0;
        $token = isset($_GET['pa_token']) ? sanitize_text_field(wp_unslash($_GET['pa_token'])) : '';

        if (isset($_GET['session_id'])) {
            $result = PA_Booking_Stripe::complete_session(sanitize_text_field(wp_unslash($_GET['session_id'])));
            if (!is_wp_error($result)) {
                $paid = true;
            }
        }

        if ($requested && $booking_id && $token) {
            $customer_email = get_post_meta($booking_id, 'customer_email', true);
            $expected = PA_Booking::booking_confirm_token($booking_id, $customer_email);
            if (hash_equals($expected, $token) && PA_Booking::report_paylink_deposit($booking_id)) {
                $paid = true;
            } elseif (hash_equals($expected, $token)) {
                $status = get_post_meta($booking_id, 'status', true);
                $paid = in_array($status, array('pending_approval', 'approved'), true);
            }
        }
        ob_start();
        ?>
        <div class="pa-booking-root pa-booking-v4 pa-booking-success pa-booking-success-premium" id="pa-booking-success">
            <?php if ($paid) : ?>
                <div class="pa-success-icon" aria-hidden="true">✓</div>
                <p class="pa-success-eyebrow">Deposit confirmed</p>
                <h2>You're on the calendar</h2>
                <p class="pa-success-lead">Thank you — your date is held while we review the details. A personal confirmation from <?php echo $artist; ?> arrives within one business day.</p>
                <ol class="pa-success-steps pa-success-timeline">
                    <li class="is-complete"><strong>Today</strong><span>Deposit received — your dates are reserved on our calendar</span></li>
                    <li class="is-active"><strong>Within one business day</strong><span>Personal confirmation email with package summary and next steps</span></li>
                    <li><strong>Before your event</strong><span>Pre-production call, contract, and remaining balance</span></li>
                </ol>
                <div class="pa-success-trust" role="list" aria-label="What to expect">
                    <span role="listitem">Encrypted checkout</span>
                    <span role="listitem">Receipt by email</span>
                    <span role="listitem">PA-based crew</span>
                </div>
                <div class="pa-done-actions">
                    <button type="button" class="pa-ics-btn pa-ics-btn--primary" id="pa-success-ics-btn">Add to calendar</button>
                    <a class="pa-booking-cta pa-booking-cta-secondary" href="<?php echo esc_url(home_url('/')); ?>">Back to site</a>
                </div>
            <?php elseif ($requested) : ?>
                <div class="pa-success-icon" aria-hidden="true">✓</div>
                <p class="pa-success-eyebrow">Request submitted</p>
                <h2>We received your booking</h2>
                <p class="pa-success-lead">Thank you — we personally review every request. Expect a confirmation from <?php echo $artist; ?> within one business day.</p>
                <ol class="pa-success-steps pa-success-timeline">
                    <li class="is-complete"><strong>Today</strong><span>Booking request received</span></li>
                    <li class="is-active"><strong>Within one business day</strong><span>Personal confirmation with deposit link and package details</span></li>
                    <li><strong>Before your event</strong><span>Pre-production call and final balance</span></li>
                </ol>
                <div class="pa-success-trust" role="list" aria-label="What to expect">
                    <span role="listitem">No spam</span>
                    <span role="listitem">Human review</span>
                    <span role="listitem">PA-based crew</span>
                </div>
                <div class="pa-done-actions">
                    <button type="button" class="pa-ics-btn pa-ics-btn--primary" id="pa-success-ics-btn">Add to calendar</button>
                    <a class="pa-booking-cta pa-booking-cta-secondary" href="<?php echo esc_url(home_url('/')); ?>">Back to site</a>
                </div>
            <?php else : ?>
                <h2>Processing your payment…</h2>
                <p class="pa-success-lead">If you completed checkout, check your email for confirmation. Need help? Email <a href="mailto:<?php echo esc_attr($email); ?>"><?php echo $email; ?></a>.</p>
            <?php endif; ?>
            <p class="pa-success-contact"><a href="mailto:<?php echo esc_attr($email); ?>"><?php echo $email; ?></a></p>
            <p class="pa-success-timezone-note" style="font-size:0.875rem;color:#737373;margin-top:1rem;">All times shown are Eastern Time (Pennsylvania).</p>
        </div>
        <script>
        (function () {
          var btn = document.getElementById('pa-success-ics-btn');
          if (!btn) return;
          var raw;
          try { raw = sessionStorage.getItem('pa_last_booking'); } catch (e) { return; }
          if (!raw) { btn.style.display = 'none'; return; }
          var data;
          try { data = JSON.parse(raw); } catch (e) { btn.style.display = 'none'; return; }
          if (!data || !data.dates || !data.dates.length) { btn.style.display = 'none'; return; }
          btn.addEventListener('click', function () {
            var iso = data.dates[0];
            var parts = iso.split('-');
            var y = parseInt(parts[0], 10);
            var m = parseInt(parts[1], 10) - 1;
            var d = parseInt(parts[2], 10);
            var start = new Date(y, m, d, 9, 0, 0);
            var end = new Date(y, m, d, 17, 0, 0);
            function fmt(dt) {
              return dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            }
            var ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//PA Media Arts//Booking//EN\r\n'
              + 'BEGIN:VEVENT\r\nUID:' + iso + '@pamedia.art\r\n'
              + 'DTSTAMP:' + fmt(new Date()) + '\r\n'
              + 'DTSTART:' + fmt(start) + '\r\n'
              + 'DTEND:' + fmt(end) + '\r\n'
              + 'SUMMARY:' + (data.service || 'PA Media Arts booking') + '\r\n'
              + 'DESCRIPTION:' + (data.time || '') + '\r\n'
              + 'LOCATION:' + (data.venue || 'Pennsylvania') + '\r\n'
              + 'END:VEVENT\r\nEND:VCALENDAR';
            var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'pa-media-booking.ics';
            a.click();
            URL.revokeObjectURL(a.href);
          });
        })();
        </script>
        <?php
        return ob_get_clean();
    }
}
