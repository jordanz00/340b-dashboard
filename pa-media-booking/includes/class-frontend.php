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
        add_filter('render_block', array($this, 'filter_home_hero_cover'), 11, 2);
        add_action('wp_enqueue_scripts', array($this, 'maybe_assets'), 100);
        add_action('init', array($this, 'maybe_ensure_work_page'), 20);
        add_action('wp_head', array($this, 'inject_logo_critical_css'), 4);
        add_action('wp_head', array($this, 'inject_home_hero_preload'), 3);
        add_action('wp_head', array($this, 'inject_site_icon'), 5);
        add_action('wp_head', array($this, 'remove_wp_site_icon'), 0);
        add_filter('wp_resource_hints', array($this, 'resource_hints'), 10, 2);
        add_action('template_redirect', array($this, 'handle_success_query'));
        add_action('template_redirect', array($this, 'redirect_contact_page'), 1);
        add_action('template_redirect', array($this, 'redirect_status_page'), 2);
        add_action('template_redirect', array($this, 'nocache_booking_page'), 3);
    }

    /**
     * /book/ must not be full-page cached — embedded security tokens go stale.
     */
    public function nocache_booking_page() {
        if (is_admin()) {
            return;
        }
        if (is_page('book') || $this->page_has_shortcode('pa_booking')) {
            nocache_headers();
        }
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
     * Best available share image: full square PAMA mark (favicon asset).
     */
    public static function og_image_url() {
        return self::logo_url();
    }

    /**
     * Homepage hero — Harrisburg drone skyline (Media Library wp-image-198).
     * Used only on the front page; interior pages keep compact nav without this photo.
     *
     * @return array{url:string,srcset:string,position:string,alt:string}
     */
    public static function home_hero_image() {
        $base = trailingslashit(content_url('uploads/2025/12'));
        $name = 'DJI_0423-HDR';
        $srcset_parts = array();
        foreach (array('-scaled.jpg 2560w', '-2048x1152.jpg 2048w', '-1536x864.jpg 1536w', '-1024x576.jpg 1024w', '-768x432.jpg 768w') as $suffix) {
            $srcset_parts[] = esc_url($base . $name . $suffix);
        }

        return array(
            'url'      => esc_url_raw($base . $name . '-scaled.jpg'),
            'srcset'   => implode(', ', $srcset_parts),
            'position' => '50% 38%',
            'alt'      => 'Aerial drone photograph of the Harrisburg, Pennsylvania skyline at sunset',
        );
    }

    /**
     * Preload the homepage hero image for faster LCP on pamedia.art front page only.
     */
    public function inject_home_hero_preload() {
        if (is_admin() || !is_front_page()) {
            return;
        }
        $hero = self::home_hero_image();
        echo '<link rel="preload" as="image" href="' . esc_url($hero['url']) . '"';
        if (!empty($hero['srcset'])) {
            echo ' imagesrcset="' . esc_attr($hero['srcset']) . '" imagesizes="100vw"';
        }
        echo ' fetchpriority="high">' . "\n";
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
     * Public shortcode check for SEO module (no instance required).
     *
     * @param string $tag Shortcode tag.
     */
    public static function page_has_shortcode_static($tag) {
        if (!is_singular()) {
            return false;
        }
        $post = get_post();
        return $post && has_shortcode($post->post_content, $tag);
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
        if ($this->is_marketing_page()) {
            $classes[] = 'pa-marketing-env';
        }
        if (is_page('book')) {
            $classes[] = 'pa-booking-page';
        }
        if (is_page('services')) {
            $classes[] = 'pa-services-page';
        }
        if (is_page('work')) {
            $classes[] = 'pa-work-page';
        }
        if (is_page('about')) {
            $classes[] = 'pa-about-page';
        }
        if (is_singular('page')) {
            $post = get_queried_object();
            if ($post instanceof WP_Post && PA_Booking_Landing_Pages::is_landing_slug($post->post_name)) {
                $classes[] = 'pa-geo-landing-page';
                $classes[] = 'pa-marketing-nav';
            }
        }
        if (is_page(array('work', 'services', 'about'))) {
            $classes[] = 'pa-interior-compact-nav';
            $classes[] = 'pa-marketing-nav';
            $classes[] = 'pa-home-header-pro';
            $classes[] = 'pa-premium-nav';
        }
        return $classes;
    }

    /**
     * Create /work/ on first request if upgrade/cache delayed page creation.
     */
    public function maybe_ensure_work_page() {
        if (is_admin() || get_option('pa_work_page_ready')) {
            return;
        }
        if (get_page_by_path('work')) {
            update_option('pa_work_page_ready', 1, false);
        }
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
     * Plugin-hosted PAMA brand mark — transparent PNG from pa-media-arts-logo_AI.ai.
     * Run bin/process-pama-logo.py after updating the vector source.
     */
    public static function logo_url() {
        return add_query_arg('v', self::logo_cache_buster('pa-logo.png'), PA_BOOKING_URL . 'assets/pa-logo.png');
    }

    /**
     * Favicon / apple-touch-icon — inverted mark to match header CSS invert.
     */
    public static function logo_icon_url() {
        return add_query_arg('v', self::logo_cache_buster('pa-logo-inverted.png'), PA_BOOKING_URL . 'assets/pa-logo-inverted.png');
    }

    public static function logo_dark_url() {
        return add_query_arg('v', self::logo_cache_buster('pa-logo-dark.png'), PA_BOOKING_URL . 'assets/pa-logo-dark.png');
    }

    public static function logo_white_url() {
        // Same as-is mark on dark footer surfaces (no transparency / recolor pass).
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
            . 'var isHome=document.body.classList.contains("home");'
            . 'var h=document.querySelector("header.pa-site-header,header.wp-block-template-part,header");'
            . 'if(h){patch(h,isHome?white:dark,isHome?"pa-brand-logo-lockup-white":"pa-brand-logo-lockup");}'
            . 'document.querySelectorAll(".wp-block-navigation__responsive-container").forEach(function(o){patch(o,dark,"pa-brand-logo-lockup");});'
            . 'var f=document.querySelector("footer.pa-site-footer,footer.wp-block-template-part,footer");'
            . 'if(f){patch(f,white,"pa-brand-logo-lockup-white");}'
            . 'document.documentElement.classList.add("pa-brand-ready");}'
            . 'if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",run);}else{run();}'
            . 'document.addEventListener("click",function(e){var t=e.target;if(t&&t.closest&&t.closest(".wp-block-navigation__responsive-container-open,.wp-block-navigation__responsive-container-close")){setTimeout(run,50);}});'
            . 'window.addEventListener("pageshow",run);'
            . '})();'
            . '</script>' . "\n";

        echo '<script id="pa-scroll-motion-boot">'
            . '(function(){var r=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;'
            . 'document.documentElement.classList.add(r?"pa-scroll-static":"pa-scroll-motion");})();'
            . '</script>' . "\n";

        if ($this->is_marketing_page()) {
            echo '<style id="pa-reveal-critical">'
                . 'html.pa-scroll-motion .pa-reveal-section:not(.is-inview) .pa-reveal-item,'
                . 'html.pa-scroll-motion .animate:not(.is-animated):not(.is-revealed):not(.pa-reveal-item),'
                . 'html.pa-scroll-motion .pa2-services:not(.is-inview) .pa2-services__eyebrow,'
                . 'html.pa-scroll-motion .pa2-services:not(.is-inview) .pa2-services__title,'
                . 'html.pa-scroll-motion .pa2-services:not(.is-inview) .pa2-services__lead,'
                . 'html.pa-scroll-motion .pa2-services:not(.is-inview) .pa2-services__card,'
                . 'html.pa-scroll-motion .pa2-services:not(.is-inview) .pa2-services__foot,'
                . 'html.pa-scroll-motion .pa2-portfolio:not(.is-inview) .pa2-portfolio__head,'
                . 'html.pa-scroll-motion .pa2-portfolio:not(.is-inview) .pa-portfolio-tile,'
                . 'html.pa-scroll-motion #pa2-reviews:not(.is-inview) .pa2-reviews__head,'
                . 'html.pa-scroll-motion #pa2-reviews:not(.is-inview) .pa2-reviews__stage,'
                . 'html.pa-scroll-motion .pa2-cta:not(.is-inview) .pa2-cta__inner'
                . '{opacity:0;transform:translate3d(0,20px,0) scale(0.98)}'
                . '</style>' . "\n";
        }

        if (is_front_page()) {
            $hero = self::home_hero_image();
            $hero_url = esc_url($hero['url']);
            echo '<style id="pa-home-hero-critical">'
                . 'body.home .pa-home-hero.wp-block-cover.alignfull,'
                . 'body.home .pa2-hero.pa-home-hero,'
                . 'body.home .pa-glass-hero-wrap .pa-home-hero'
                . '{background-image:url("' . $hero_url . '")!important;background-size:cover!important;'
                . 'background-position:' . esc_attr($hero['position']) . '!important;background-repeat:no-repeat!important}'
                . 'body.home .pa-home-hero .wp-block-cover__image-background,'
                . 'body.home .pa2-hero .wp-block-cover__image-background'
                . '{object-position:' . esc_attr($hero['position']) . '!important}'
                . '</style>' . "\n";
            echo '<style id="pa-home-chrome-logo-critical">'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome .pa-brand-lockup,'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome .wp-block-site-logo'
                . '{width:auto!important;max-width:100%!important;padding:0!important;background:transparent!important;box-shadow:none!important}'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome .wp-block-site-logo a,'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome .pa-brand-logo-wrap a'
                . '{display:inline-block!important;width:auto!important;max-width:min(720px,96vw)!important;'
                . 'margin:0 auto!important;line-height:0!important;overflow:hidden!important;border-radius:16px!important}'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome .wp-block-site-logo img,'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome img.custom-logo,'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome img.pa-brand-logo-lockup'
                . '{display:block!important;width:auto!important;max-width:min(720px,96vw)!important;'
                . 'height:clamp(140px,22vw,320px)!important;max-height:none!important;box-shadow:none!important}'
                . '</style>' . "\n";
        }

        echo '<style id="pa-header-nav-critical">'
            . 'body.pa-glass-site header .pa-nav-floating-pills,body.pa-glass-site header .pa-nav-dock,'
            . 'body.pa-glass-site.home header .pa-site-nav-pill-row,body.pa-glass-site.home header .wp-block-navigation__container'
            . '{display:inline-flex!important;flex-wrap:wrap;align-items:center;justify-content:center;'
            . 'gap:1rem!important;padding:0!important;background:transparent!important;border:none!important;'
            . 'box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}'
            . 'body.pa-glass-site header .pa-nav-floating-pills .wp-block-navigation-item__content,'
            . 'body.pa-glass-site header .pa-nav-dock .wp-block-navigation-item__content,'
            . 'body.pa-glass-site header .pa-site-nav-pill'
            . '{border-radius:9999px!important;min-height:46px;padding:.625rem 1.35rem!important;'
            . 'font-size:.8125rem!important;font-weight:600!important;letter-spacing:.02em!important;text-transform:none!important}'
            . 'body.pa-glass-site.home header .wp-block-navigation-item:not(.pa-nav-book) .wp-block-navigation-item__content'
            . '{color:rgba(255,255,255,.96)!important;background:rgba(255,255,255,.14)!important;'
            . 'border:1.5px solid rgba(255,255,255,.38)!important}'
            . 'body.pa-glass-site.home header .is-current,body.pa-glass-site.home header .current-menu-item .wp-block-navigation-item__content'
            . '{color:#1d1d1f!important;background:rgba(255,255,255,.97)!important;border-color:#fff!important}'
            . 'body.pa-glass-site header .pa-nav-book .wp-block-navigation-item__content'
            . '{color:#fff!important;background:#0071e3!important;border-radius:9999px!important}'
            . 'body.pa-glass-site.pa-marketing-nav:not(.home) header .wp-block-navigation-item:not(.pa-nav-book):not(.current-menu-item) .wp-block-navigation-item__content'
            . '{color:#1d1d1f!important;background:rgba(255,255,255,.52)!important;'
            . 'border:1px solid rgba(255,255,255,.82)!important;border-radius:9999px!important}'
            . 'body.pa-glass-site.pa-marketing-nav:not(.home) header .current-menu-item:not(.pa-nav-book) .wp-block-navigation-item__content'
            . '{color:#fff!important;background:rgba(29,29,31,.84)!important;border-radius:9999px!important}'
            . '</style>' . "\n";
    }

    /**
     * Swap the theme cover image for the Harrisburg drone hero on the homepage only.
     *
     * @param string $block_content Rendered block HTML.
     * @param array  $block         Block payload.
     * @return string
     */
    public function filter_home_hero_cover($block_content, $block) {
        if (is_admin() || !is_front_page()) {
            return $block_content;
        }
        if (empty($block['blockName']) || $block['blockName'] !== 'core/cover') {
            return $block_content;
        }
        if (strpos($block_content, 'wp-block-cover__image-background') === false) {
            return $block_content;
        }

        static $hero_cover_done = false;
        if ($hero_cover_done) {
            return $block_content;
        }
        $hero_cover_done = true;

        $hero = self::home_hero_image();
        $url = esc_url($hero['url']);
        $srcset = esc_attr($hero['srcset']);
        $alt = esc_attr($hero['alt']);

        $updated = preg_replace(
            '/(<img[^>]*class="[^"]*wp-block-cover__image-background[^"]*"[^>]*\s)src="[^"]*"/i',
            '$1src="' . $url . '"',
            $block_content,
            1
        );
        if (!is_string($updated) || $updated === $block_content) {
            return $block_content;
        }

        if (preg_match('/<img[^>]*class="[^"]*wp-block-cover__image-background[^"]*"[^>]*\ssrcset="/i', $updated)) {
            $updated = preg_replace(
                '/(<img[^>]*class="[^"]*wp-block-cover__image-background[^"]*"[^>]*\s)srcset="[^"]*"/i',
                '$1srcset="' . $srcset . '"',
                $updated,
                1
            );
        } else {
            $updated = preg_replace(
                '/(<img[^>]*class="[^"]*wp-block-cover__image-background[^"]*"[^>]*\s)src="' . preg_quote($url, '/') . '"/i',
                '$0 srcset="' . $srcset . '" sizes="100vw"',
                $updated,
                1
            );
        }

        $updated = preg_replace(
            '/(<img[^>]*class="[^"]*wp-block-cover__image-background[^"]*"[^>]*\s)alt="[^"]*"/i',
            '$1alt="' . $alt . '"',
            $updated,
            1
        );

        if (strpos($updated, 'alt="' . $alt . '"') === false) {
            $updated = preg_replace(
                '/(<img[^>]*class="[^"]*wp-block-cover__image-background[^"]*")/i',
                '$1 alt="' . $alt . '"',
                $updated,
                1
            );
        }

        if (strpos($updated, 'pa-home-hero') === false) {
            $updated = preg_replace(
                '/class="wp-block-cover([^"]*)"/i',
                'class="wp-block-cover$1 pa-home-hero"',
                $updated,
                1
            );
        }

        return $updated;
    }

    /**
     * Canonical URL for the online booking funnel (/book/ or home anchor).
     */
    /**
     * Canonical booking funnel — always the dedicated /book/ page.
     */
    public static function book_url() {
        $page = get_page_by_path('book');
        if ($page && $page->post_status === 'publish') {
            return get_permalink($page);
        }
        return home_url('/book/');
    }

    /**
     * Canonical portfolio page — /work/.
     */
    public static function work_url() {
        $page = get_page_by_path('work');
        if ($page && $page->post_status === 'publish') {
            return get_permalink($page);
        }
        return home_url('/work/');
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
        $icon = esc_url(self::logo_icon_url());
        echo '<link rel="icon" href="' . $icon . '" sizes="any">' . "\n";
        echo '<link rel="apple-touch-icon" href="' . $icon . '">' . "\n";
    }

    public function maybe_assets() {
        if (!is_admin()) {
            wp_enqueue_style('pa2-tokens', PA_BOOKING_URL . 'assets/pa2-tokens.css', array(), self::asset_version('assets/pa2-tokens.css'));
            $site_css_deps = array('pa2-tokens');
            $site_js_deps = array();
            if ($this->is_marketing_page()) {
                wp_enqueue_style(
                    'pa-animations',
                    PA_BOOKING_URL . 'assets/animations.css',
                    array('pa2-tokens'),
                    self::asset_version('assets/animations.css')
                );
                wp_enqueue_script(
                    'pa-animations',
                    PA_BOOKING_URL . 'assets/animations.js',
                    array(),
                    self::asset_version('assets/animations.js'),
                    true
                );
                wp_enqueue_style(
                    'pa-environment',
                    PA_BOOKING_URL . 'assets/environment.css',
                    array('pa-animations'),
                    self::asset_version('assets/environment.css')
                );
                wp_enqueue_script(
                    'pa-environment',
                    PA_BOOKING_URL . 'assets/environment.js',
                    array('pa-animations'),
                    self::asset_version('assets/environment.js'),
                    true
                );
                $site_css_deps[] = 'pa-animations';
                $site_css_deps[] = 'pa-environment';
                $site_js_deps[] = 'pa-animations';
                $site_js_deps[] = 'pa-environment';
                wp_enqueue_style(
                    'pa-portfolio',
                    PA_BOOKING_URL . 'assets/portfolio.css',
                    array('pa-environment'),
                    self::asset_version('assets/portfolio.css')
                );
                wp_enqueue_script(
                    'pa-portfolio',
                    PA_BOOKING_URL . 'assets/portfolio.js',
                    array(),
                    self::asset_version('assets/portfolio.js'),
                    true
                );
                $site_css_deps[] = 'pa-portfolio';
                $site_js_deps[] = 'pa-portfolio';
            }
            wp_enqueue_style('pa-site', PA_BOOKING_URL . 'assets/site.css', $site_css_deps, self::asset_version('assets/site.css'));
            wp_enqueue_style('pa-glass', PA_BOOKING_URL . 'assets/glass.css', array('pa-site'), self::asset_version('assets/glass.css'));
            wp_enqueue_style('pa-site-ive', PA_BOOKING_URL . 'assets/site-ive.css', array('pa-glass'), self::asset_version('assets/site-ive.css'));
            wp_enqueue_style('pa-site-mobile', PA_BOOKING_URL . 'assets/site-mobile.css', array('pa-site-ive'), self::asset_version('assets/site-mobile.css'));
            $site_script_deps = array();
            if (is_front_page()) {
                wp_enqueue_style('pa-google-reviews', PA_BOOKING_URL . 'assets/google-reviews.css', array('pa-site-mobile'), self::asset_version('assets/google-reviews.css'));
                wp_enqueue_script('pa-google-reviews-data', PA_BOOKING_URL . 'assets/google-reviews-data.js', array(), self::asset_version('assets/google-reviews-data.js'), true);
                wp_enqueue_script('pa-google-reviews', PA_BOOKING_URL . 'assets/google-reviews.js', array('pa-google-reviews-data'), self::asset_version('assets/google-reviews.js'), true);
                $site_script_deps[] = 'pa-google-reviews';
            }
            wp_enqueue_script('pa-site', PA_BOOKING_URL . 'assets/site.js', array_merge($site_js_deps, $site_script_deps), self::asset_version('assets/site.js'), true);
            if (is_front_page() || is_page('services')) {
                wp_enqueue_script('pa-service-icons', PA_BOOKING_URL . 'assets/service-icons.js', array(), self::asset_version('assets/service-icons.js'), true);
            }
            if (is_front_page() || is_page('services')) {
                wp_enqueue_style('pa-service-icons', PA_BOOKING_URL . 'assets/service-icons.css', array('pa-site-mobile'), self::asset_version('assets/service-icons.css'));
            }
            if (is_page('services')) {
                wp_enqueue_style('pa-services', PA_BOOKING_URL . 'assets/services.css', array('pa-site-mobile', 'pa-service-icons'), self::asset_version('assets/services.css'));
                wp_enqueue_script('pa-services', PA_BOOKING_URL . 'assets/services.js', array('pa-site', 'pa-service-icons'), self::asset_version('assets/services.js'), true);
            }
            if (is_page('work')) {
                wp_enqueue_style('pa-work', PA_BOOKING_URL . 'assets/work.css', array('pa-site-mobile'), self::asset_version('assets/work.css'));
                wp_enqueue_script('pa-work', PA_BOOKING_URL . 'assets/work.js', array('pa-site', 'pa-portfolio'), self::asset_version('assets/work.js'), true);
            }
            if (is_front_page()) {
                wp_enqueue_style('pa-home', PA_BOOKING_URL . 'assets/home.css', array('pa-site-mobile', 'pa-service-icons'), self::asset_version('assets/home.css'));
                wp_enqueue_script('pa-home', PA_BOOKING_URL . 'assets/home.js', array('pa-site', 'pa-google-reviews', 'pa-service-icons'), self::asset_version('assets/home.js'), true);
            }
            $glass_site_deps = array('pa-site-mobile');
            if (is_front_page()) {
                $glass_site_deps[] = 'pa-home';
                $glass_site_deps[] = 'pa-google-reviews';
            }
            if (is_page('services')) {
                $glass_site_deps[] = 'pa-services';
            }
            if (is_page('work')) {
                $glass_site_deps[] = 'pa-work';
            }
            wp_enqueue_style('pa-glass-site', PA_BOOKING_URL . 'assets/glass-site.css', $glass_site_deps, self::asset_version('assets/glass-site.css'));
            wp_enqueue_style('pa-header-nav', PA_BOOKING_URL . 'assets/header-nav.css', array('pa-glass-site'), self::asset_version('assets/header-nav.css'));
            wp_enqueue_script('pa-header-nav', PA_BOOKING_URL . 'assets/header-nav.js', array('pa-site'), self::asset_version('assets/header-nav.js'), true);
            $s = PA_Booking::get_settings();
            $site_service_lines = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', (string) ($s['services'] ?? '')))));
            $site_config = array(
                'logoUrl'  => esc_url_raw(self::logo_url()),
                'logoDarkUrl' => esc_url_raw(self::logo_dark_url()),
                'logoWhiteUrl' => esc_url_raw(self::logo_white_url()),
                'assetVersion' => PA_BOOKING_VERSION,
                'siteName' => $s['artist_name'] ?? 'Pennsylvania Media Arts LLC',
                'homeUrl'  => esc_url_raw(home_url('/')),
                'bookUrl'  => esc_url_raw(self::book_url()),
                'workUrl'  => esc_url_raw(self::work_url()),
                'tagline'  => $s['tagline'] ?: 'Photography, video & live production · Pennsylvania.',
                'aboutParagraphs' => PA_Booking::about_paragraphs($s),
                'footerWork' => PA_Booking::footer_work_items(),
                'footerRecognition' => PA_Booking::footer_recognition(),
                'footerServiceLabels' => PA_Booking::footer_service_labels(),
                'notifyEmail' => sanitize_email($s['notify_email'] ?? 'jordan@pamedia.art'),
                'paymentsEnabled' => PA_Booking::accepts_deposit_payments(),
                'depositUsd' => number_format(($s['deposit_cents'] ?? 15000) / 100, 0),
                'services' => $site_service_lines,
                'legalName' => 'Pennsylvania Media Arts LLC',
                'businessLocation' => 'New Cumberland, Pennsylvania',
                'privacyUrl' => esc_url_raw(home_url('/privacy-policy/')),
                'termsUrl' => esc_url_raw(home_url('/terms-of-service/')),
                'isBookingPage' => is_page('book'),
                'isServicesPage' => is_page('services'),
                'isWorkPage' => is_page('work'),
                'isAboutPage' => is_page('about'),
                'geoLandingLinks' => PA_Booking_Landing_Pages::public_links(),
                'youtubeChannelUrl' => 'https://www.youtube.com/@PAMediaArts',
                'youtubeVideos' => PA_Booking_YouTube::featured_video_ids(),
                'youtubeBlockedVideos' => PA_Booking_YouTube::blocked_video_ids(),
            );
            if (is_front_page()) {
                $site_config['homeHeroImage'] = self::home_hero_image();
            }
            wp_localize_script(
                'pa-site',
                'PASite',
                $site_config
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

    /** Marketing surfaces that load premium scroll animations. */
    private function is_marketing_page() {
        return is_front_page() || is_page(array('services', 'work', 'about'));
    }

    private function should_load_booking_assets() {
        if (is_page('book')) {
            return true;
        }
        if (is_front_page()) {
            return false;
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
        wp_safe_redirect(self::book_url(), 301);
        exit;
    }

    public function redirect_contact_page() {
        if (is_admin() || wp_doing_ajax()) {
            return;
        }
        if (!is_page('contact')) {
            return;
        }
        wp_safe_redirect(self::book_url(), 301);
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
        <div id="pa-book" class="pa-booking-root pa-booking-v4 pa-booking-premium pa-booking-root--wizard alignwide" aria-label="Book <?php echo $artist; ?>">
            <div class="pa-booking-trust-rail" role="list" aria-label="Booking reassurance">
                <span class="pa-credential-item" role="listitem">
                    <span class="pa-credential-icon" aria-hidden="true">✓</span>
                    Confirmation within one business day
                </span>
                <?php if ($payments) : ?>
                <span class="pa-credential-item" role="listitem">
                    <span class="pa-credential-icon pa-credential-icon--lock" aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 10V8a6 6 0 1 1 12 0v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="4" y="10" width="16" height="11" rx="2.5" fill="currentColor"/></svg>
                    </span>
                    Secure $<?php echo esc_html(number_format($s['deposit_cents'] / 100, 0)); ?> deposit checkout
                </span>
                <?php endif; ?>
                <span class="pa-credential-item" role="listitem">
                    <span class="pa-credential-icon" aria-hidden="true">★</span>
                    5.0 · 4 Google reviews
                </span>
            </div>

            <header class="pa-booking-hero" hidden aria-hidden="true">
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
                    <strong>deposit</strong> — applied toward your final balance.
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
                <li><strong>Service</strong><span class="pa-how-step-detail">Choose coverage and an open date on the live calendar</span></li>
                <li><strong>Event</strong><span class="pa-how-step-detail">Contact info, location, and event details</span></li>
                <li><strong>Review</strong><span class="pa-how-step-detail"><?php echo $payments ? 'Confirm details and pay deposit to hold your date' : 'Review and submit your request'; ?></span></li>
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
        $deposit_done = isset($_GET['deposit']) && sanitize_text_field(wp_unslash($_GET['deposit'])) === 'done';
        $paid = false;
        $token_valid = false;
        $awaiting_paylink = false;
        $paylink_checkout = '';
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
            if (hash_equals($expected, $token)) {
                $token_valid = true;
                $paid = PA_Booking::booking_deposit_confirmed($booking_id);
                if (!$paid) {
                    $provider = get_post_meta($booking_id, 'payment_provider', true);
                    $status = get_post_meta($booking_id, 'status', true);
                    if ($provider === 'paylink' && $status === 'pending_payment') {
                        $awaiting_paylink = true;
                        $deposit_cents = (int) get_post_meta($booking_id, 'deposit_cents', true);
                        if ($deposit_cents < 50) {
                            $deposit_cents = PA_Booking::calculate_deposit_cents(
                                count(PA_Booking::get_booking_event_dates($booking_id))
                            );
                        }
                        $paylink_checkout = PA_Booking_Payments::paylink_url_for_deposit_cents($deposit_cents);
                    }
                }
            }
        } elseif ($requested && $deposit_done && $booking_id && !$token) {
            /* Generic return without signed booking — never auto-confirm. */
            $paid = false;
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
            <?php elseif ($awaiting_paylink) : ?>
                <div class="pa-success-icon" aria-hidden="true">→</div>
                <p class="pa-success-eyebrow">One more step</p>
                <h2>Complete your deposit</h2>
                <p class="pa-success-lead">Your booking details are saved. Pay the deposit in GoDaddy’s secure checkout — we verify every payment in GoDaddy Payments and email you within one business day once your date is held.</p>
                <div id="pa-paylink-popup-hint" class="pa-paylink-popup-hint" hidden>
                    <p>Your browser blocked the checkout window. Use the button below to open secure checkout.</p>
                </div>
                <ol class="pa-success-steps pa-success-timeline">
                    <li class="is-complete"><strong>Today</strong><span>Booking request received</span></li>
                    <li class="is-active"><strong>Now</strong><span>Pay your deposit in secure checkout</span></li>
                    <li><strong>Within one business day</strong><span>Personal confirmation after we verify payment in GoDaddy</span></li>
                </ol>
                <div class="pa-done-actions">
                    <?php if ($paylink_checkout) : ?>
                    <a class="pa-booking-cta pa-booking-cta-primary wp-element-button" id="pa-paylink-checkout-btn" href="<?php echo esc_url($paylink_checkout); ?>" target="_blank" rel="noopener noreferrer">Open secure checkout</a>
                    <?php endif; ?>
                    <a class="pa-booking-cta pa-booking-cta-secondary" href="<?php echo esc_url(home_url('/')); ?>">Back to site</a>
                </div>
            <?php elseif ($requested) : ?>
                <div class="pa-success-icon" aria-hidden="true">✓</div>
                <p class="pa-success-eyebrow">Request submitted</p>
                <h2>We received your booking</h2>
                <p class="pa-success-lead">Thank you — we personally review every request. Expect a confirmation from <?php echo $artist; ?> within one business day.</p>
                <ol class="pa-success-steps pa-success-timeline">
                    <li class="is-complete"><strong>Today</strong><span>Booking request received</span></li>
                    <li class="is-active"><strong>Within one business day</strong><span>Personal confirmation with next steps and package details</span></li>
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
        <script>
        (function () {
          var hint = document.getElementById('pa-paylink-popup-hint');
          if (!hint) return;
          try {
            if (sessionStorage.getItem('pa_paylink_popup_blocked') === '1') {
              hint.hidden = false;
              sessionStorage.removeItem('pa_paylink_popup_blocked');
              var storedUrl = sessionStorage.getItem('pa_paylink_checkout_url');
              if (storedUrl) {
                var btn = document.getElementById('pa-paylink-checkout-btn');
                if (btn) {
                  btn.href = storedUrl;
                }
                sessionStorage.removeItem('pa_paylink_checkout_url');
              }
            }
          } catch (e) { /* ignore */ }
        })();
        </script>
        <?php
        return ob_get_clean();
    }
}
