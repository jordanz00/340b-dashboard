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

    /** @var bool */
    private static $site_icon_emitted = false;

    public function __construct() {
        add_shortcode('pa_booking', array($this, 'render_booking'));
        add_shortcode('pa_booking_success', array($this, 'render_success'));
        add_filter('body_class', array($this, 'body_class'));
        add_filter('pre_render_block', array($this, 'note_template_part'), 5, 2);
        add_filter('render_block', array($this, 'filter_site_logo_block'), 12, 2);
        add_filter('render_block', array($this, 'filter_home_hero_cover'), 11, 2);
        add_filter('render_block', array($this, 'filter_heavy_gallery_images'), 20, 2);
        add_action('wp_enqueue_scripts', array($this, 'maybe_assets'), 100);
        add_action('init', array($this, 'maybe_ensure_work_page'), 20);
        add_action('wp_head', array($this, 'inject_viewport_meta_safe'), 0);
        add_action('wp_head', array($this, 'inject_mobile_chrome_meta_safe'), 2);
        add_action('wp_head', array($this, 'inject_logo_critical_css_safe'), 4);
        add_action('wp_head', array($this, 'inject_home_hero_preload_safe'), 3);
        add_action('wp_head', array($this, 'inject_site_icon_safe'), 5);
        add_action('wp_head', array($this, 'remove_wp_site_icon'), 0);
        add_filter('wp_resource_hints', array($this, 'resource_hints'), 10, 2);
        add_action('template_redirect', array($this, 'handle_success_query'));
        add_action('template_redirect', array($this, 'redirect_status_page'), 2);
        add_action('template_redirect', array($this, 'nocache_booking_page'), 3);
    }

    /**
     * Safe wp_head wrappers — never truncate document if a head hook fatals.
     */
    public function inject_viewport_meta_safe() {
        PA_Booking_Render_Safety::run_head(array($this, 'inject_viewport_meta'), 'viewport_meta');
    }

    public function inject_mobile_chrome_meta_safe() {
        PA_Booking_Render_Safety::run_head(array($this, 'inject_mobile_chrome_meta'), 'mobile_chrome_meta');
    }

    public function inject_logo_critical_css_safe() {
        PA_Booking_Render_Safety::run_head(array($this, 'inject_logo_critical_css'), 'logo_critical_css');
    }

    public function inject_home_hero_preload_safe() {
        PA_Booking_Render_Safety::run_head(array($this, 'inject_home_hero_preload'), 'home_hero_preload');
    }

    public function inject_site_icon_safe() {
        PA_Booking_Render_Safety::run_head(array($this, 'inject_site_icon'), 'site_icon');
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
     * YouTube hints only on pages that show the featured video facade.
     */
    public function resource_hints($hints, $relation_type) {
        if ($relation_type === 'preconnect' && (is_front_page() || is_page('work'))) {
            $hints[] = 'https://www.youtube-nocookie.com';
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
     * Per-page Open Graph photos (Media Library assets already on pamedia.art).
     *
     * @param string $page_key home|services|work|about|contact|book|''
     * @return string
     */
    public static function interior_og_image_url($page_key) {
        $uploads = trailingslashit(content_url('uploads'));
        $map = array(
            'work'     => $uploads . '2025/04/crop-0-0-2560-1440-0-D5515840-199E-4336-830B-1654190C2600-scaled.jpg',
            'about'    => $uploads . '2025/04/crop-0-0-2560-1440-0-D5515840-199E-4336-830B-1654190C2600-scaled.jpg',
            'services' => self::home_hero_image()['url'],
            'contact'  => self::home_hero_image()['url'],
            'book'     => self::home_hero_image()['url'],
        );
        if (isset($map[$page_key])) {
            return esc_url_raw($map[$page_key]);
        }
        return esc_url_raw(self::og_image_url());
    }

    /**
     * Build one homepage hero still entry (plugin-local JPEG + 1280w srcset).
     *
     * @param string $id       Stable id for session anti-repeat.
     * @param string $stem     Filename stem under assets/media (no extension).
     * @param string $position CSS background-position.
     * @param string $alt      Accessible alt text (factual description only).
     * @return array{id:string,url:string,url_full:string,url_mobile:string,srcset:string,position:string,alt:string}|null
     */
    public static function home_hero_still($id, $stem, $position, $alt) {
        $rel = 'assets/media/' . $stem . '.jpg';
        $rel_m = 'assets/media/' . $stem . '-1280.jpg';
        if (!is_readable(PA_BOOKING_PATH . $rel)) {
            return null;
        }
        $base = trailingslashit(PA_BOOKING_URL . 'assets/media');
        $ver = self::asset_version($rel);
        $ver_m = is_readable(PA_BOOKING_PATH . $rel_m) ? self::asset_version($rel_m) : $ver;
        $url = esc_url_raw($base . $stem . '.jpg?v=' . rawurlencode($ver));
        $url_m = is_readable(PA_BOOKING_PATH . $rel_m)
            ? esc_url_raw($base . $stem . '-1280.jpg?v=' . rawurlencode($ver_m))
            : $url;
        // Keep width descriptors OUT of esc_url() — it otherwise encodes " 2048w" into a bad URL.
        $srcset_parts = array();
        if ($url_m !== $url) {
            $srcset_parts[] = esc_url($url_m) . ' 1280w';
        }
        $srcset_parts[] = esc_url($url) . ' 2048w';

        return array(
            'id'         => $id,
            'url'        => $url,
            'url_full'   => $url,
            'url_mobile' => $url_m,
            'srcset'     => implode(', ', $srcset_parts),
            'position'   => $position,
            'alt'        => $alt,
        );
    }

    /**
     * Homepage hero pool — one randomized drone still per visit (LCP-friendly preload).
     *
     * Curated from LaCie Mavic Mini Harrisburg / April 8 / May 13 stills + cinema keyframe.
     *
     * @return array<int, array{id:string,url:string,url_full?:string,url_mobile?:string,srcset:string,position:string,alt:string}>
     */
    public static function home_hero_images() {
        $defs = array(
            array(
                'harrisburg-sunset',
                'hero-drone-harrisburg-sunset',
                '50% 38%',
                'Aerial drone photograph of the Harrisburg, Pennsylvania skyline at sunset',
            ),
            array(
                'harrisburg-panorama',
                'hero-drone-harrisburg-panorama',
                '50% 40%',
                'Aerial panorama of Harrisburg bridges and the Susquehanna River at golden hour',
            ),
            array(
                'harrisburg-arches',
                'hero-drone-harrisburg-arches',
                '42% 48%',
                'Aerial view along a stone-arch bridge toward the Harrisburg skyline at sunset',
            ),
            array(
                'harrisburg-bridges',
                'hero-drone-harrisburg-bridges',
                '50% 42%',
                'Aerial photograph of Harrisburg river bridges crossing the Susquehanna',
            ),
            array(
                'harrisburg-river',
                'hero-drone-harrisburg-river',
                '50% 42%',
                'Aerial drone photograph of the Susquehanna River and Harrisburg bridges on a clear day',
            ),
            array(
                'susquehanna-boat',
                'hero-drone-susquehanna-boat',
                '50% 45%',
                'Aerial drone photograph of the Susquehanna River toward Harrisburg with a boat and bridge',
            ),
            array(
                'bridge',
                'hero-drone-bridge',
                '55% 45%',
                'Aerial drone photograph of an arched Susquehanna River bridge at sunset',
            ),
            array(
                'dual-span',
                'hero-drone-dual-span',
                '50% 42%',
                'Aerial drone photograph of a dual-span bridge across open water in Pennsylvania',
            ),
            array(
                'harrisburg-blue-hour',
                'hero-drone-harrisburg-blue-hour',
                '48% 40%',
                'Aerial twilight photograph of Harrisburg bridges and city lights along the river',
            ),
            array(
                'april-golden',
                'hero-drone-april-golden',
                '50% 40%',
                'Aerial golden-hour view of Harrisburg bridges spanning the Susquehanna River',
            ),
            array(
                'cinema-sunset',
                'hero-drone-cinema-sunset',
                '50% 45%',
                'Cinematic aerial still of Susquehanna River bridges silhouetted at sunset',
            ),
            array(
                'harrisburg-winter',
                'hero-drone-harrisburg-winter',
                '50% 38%',
                'Aerial winter view of Harrisburg and Susquehanna River bridges in warm evening light',
            ),
        );

        $pool = array();
        foreach ($defs as $def) {
            $entry = self::home_hero_still($def[0], $def[1], $def[2], $def[3]);
            if ($entry) {
                $pool[] = $entry;
            }
        }
        return $pool;
    }

    /**
     * Homepage hero — default still from the drone pool (SSR / fallback).
     * Client rotates via homeHeroImages + early preload picker so caches do not freeze one shot.
     *
     * @return array{id?:string,url:string,srcset:string,position:string,alt:string}
     */
    public static function home_hero_image() {
        $pool = self::home_hero_images();
        return $pool[0];
    }

    /**
     * Preload a randomly chosen homepage hero (per visit) for LCP.
     */
    public function inject_home_hero_preload() {
        if (is_admin() || !is_front_page()) {
            return;
        }
        $pool = self::home_hero_images();
        if (!$pool) {
            return;
        }
        $json = wp_json_encode(array_values($pool));
        if (!$json) {
            return;
        }
        echo '<script id="pa-home-hero-preload">(function(){try{'
            . 'var pool=' . $json . ';'
            . 'if(!pool||!pool.length)return;'
            . 'var last="";'
            . 'try{last=sessionStorage.getItem("paHomeHeroId")||"";}catch(e){}'
            . 'var choices=pool;'
            . 'if(pool.length>1&&last){var f=pool.filter(function(h){return h&&h.id!==last;});if(f.length)choices=f;}'
            . 'var hero=choices[Math.floor(Math.random()*choices.length)];'
            . 'try{sessionStorage.setItem("paHomeHeroId",hero.id||"");}catch(e){}'
            . 'window.__PA_HOME_HERO__=hero;'
            . 'var href=hero.url_mobile||hero.url;'
            . 'var link=document.createElement("link");'
            . 'link.rel="preload";link.as="image";link.href=href;link.fetchPriority="high";'
            . 'if(hero.srcset){link.setAttribute("imagesrcset",hero.srcset);link.setAttribute("imagesizes","100vw");}'
            . 'document.head.appendChild(link);'
            . '}catch(e){}})();</script>' . "\n";
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
            $classes[] = 'pa-booking-funnel-page';
            $classes[] = 'is-booking-funnel';
            $classes[] = 'pa-interior-compact-nav';
            $classes[] = 'pa-premium-nav';
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
        if (is_page('start')) {
            $classes[] = 'pa-ad-landing-page';
            $classes[] = 'pa-interior-compact-nav';
            $classes[] = 'pa-marketing-nav';
            $classes[] = 'pa-premium-nav';
        }
        if (is_page('service-areas')) {
            $classes[] = 'pa-seo-hub-page';
            $classes[] = 'pa-interior-compact-nav';
            $classes[] = 'pa-marketing-nav';
            $classes[] = 'pa-premium-nav';
        }
        if (is_page('quote-thank-you')) {
            $classes[] = 'pa-quote-thankyou-page';
            $classes[] = 'pa-interior-compact-nav';
            $classes[] = 'pa-marketing-nav';
            $classes[] = 'pa-premium-nav';
        }
        if (is_singular('page')) {
            $post = get_queried_object();
            if ($post instanceof WP_Post && PA_Booking_Landing_Pages::is_landing_slug($post->post_name)) {
                $classes[] = 'pa-geo-landing-page';
                $classes[] = 'pa-interior-compact-nav';
                $classes[] = 'pa-marketing-nav';
                $classes[] = 'pa-home-header-pro';
                $classes[] = 'pa-premium-nav';
            }
        }
        if (is_page('service-areas')) {
            $classes[] = 'pa-home-header-pro';
        }
        if (is_page(array('work', 'services', 'about', 'contact'))) {
            $classes[] = 'pa-interior-compact-nav';
            $classes[] = 'pa-marketing-nav';
            $classes[] = 'pa-home-header-pro';
            $classes[] = 'pa-premium-nav';
        }
        if (is_page('contact')) {
            $classes[] = 'pa-contact-page';
        }
        if (is_front_page()) {
            $classes[] = 'pa-home-header-pro';
            $classes[] = 'pa-premium-nav';
            $classes[] = 'pa-home-chrome-above-hero';
            $classes[] = 'pa-home-shell-relocated';
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
            . 'document.documentElement.classList.add("pa-js",r?"pa-scroll-static":"pa-scroll-motion");})();'
            . '</script>' . "\n";
        /* Soft canvas so theme unstyled text never flashes on a bare white page. */
        echo '<style id="pa-paint-boot">'
            . 'html.pa-js,html.pa-js body{background-color:#f5f5f7}'
            . 'html.pa-js body.home{background-color:#0b0b0c}'
            . '</style>' . "\n";

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
                . '{opacity:0;transform:translate3d(0,28px,0) scale(0.97)}'
                . '</style>' . "\n";
        }

        if (is_front_page()) {
            $hero = self::home_hero_image();
            $hero_mobile = esc_url(!empty($hero['url_mobile']) ? $hero['url_mobile'] : $hero['url']);
            $hero_desktop = esc_url($hero['url']);
            // Separate mobile/desktop backgrounds so we do not force the 2560w -scaled file on phones.
            echo '<style id="pa-home-hero-critical">'
                . 'body.home .pa-home-hero.wp-block-cover.alignfull,'
                . 'body.home .pa2-hero.pa-home-hero,'
                . 'body.home .pa-glass-hero-wrap .pa-home-hero'
                . '{background-image:url("' . $hero_mobile . '")!important;background-size:cover!important;'
                . 'background-position:' . esc_attr($hero['position']) . '!important;background-repeat:no-repeat!important;'
                . 'min-height:clamp(22rem,62vh,40rem)!important}'
                . '@media (min-width:769px){'
                . 'body.home .pa-home-hero.wp-block-cover.alignfull,'
                . 'body.home .pa2-hero.pa-home-hero,'
                . 'body.home .pa-glass-hero-wrap .pa-home-hero'
                . '{background-image:url("' . $hero_desktop . '")!important}}'
                . 'body.home .pa-home-hero .wp-block-cover__image-background,'
                . 'body.home .pa2-hero .wp-block-cover__image-background'
                . '{object-position:' . esc_attr($hero['position']) . '!important}'
                . '</style>' . "\n";
            /* Clip raw theme blocks before site.js — stops plain-text FOUC (Booking/Services/About). */
            echo '<style id="pa-home-layout-critical">'
                . 'body.home main.wp-block-group{padding-top:0!important;padding-bottom:clamp(1rem,3vw,2rem)!important}'
                /* FOUC guard — crawlable SSR nav + raw theme header stay in DOM but never flash as plain text */
                . 'body.home .pa-ssr-conversion{position:absolute!important;width:1px!important;height:1px!important;'
                . 'padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;'
                . 'white-space:nowrap!important;border:0!important;pointer-events:none!important}'
                . 'body.home.pa-home-chrome-above-hero:not(.pa-home-ready) header.wp-block-template-part:not(.pa-home-header-chrome-moved),'
                . 'body.home.pa-home-chrome-above-hero:not(.pa-home-ready) header.pa-site-header:not(.pa-home-header-chrome-moved)'
                . '{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;'
                . 'overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important;'
                . 'pointer-events:none!important;visibility:hidden!important}'
                . 'body.home main .entry-content>.wp-block-gallery,'
                . 'body.home main .wp-block-post-content>.wp-block-gallery,'
                . 'body.home main .entry-content>.wp-block-group.alignfull.has-background'
                . ':not(.pa-glass-hero-wrap):not(.pa2-services):not(.pa2-portfolio):not(.pa2-cta)'
                . ':not(.pa2-reviews):not(.pa-home-closing):not(:has(.pa-home-hero)):not(:has(.pa2-hero)),'
                . 'body.home main .wp-block-post-content>.wp-block-group.alignfull.has-background'
                . ':not(.pa-glass-hero-wrap):not(.pa2-services):not(.pa2-portfolio):not(.pa2-cta)'
                . ':not(.pa2-reviews):not(.pa-home-closing):not(:has(.pa-home-hero)):not(:has(.pa2-hero)),'
                . 'body.home main .entry-content>.wp-block-columns,'
                . 'body.home main .wp-block-post-content>.wp-block-columns{'
                . 'position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;'
                . 'overflow:hidden!important;opacity:0!important;pointer-events:none!important;'
                . 'margin:0!important;padding:0!important;clip:rect(0,0,0,0)!important;border:0!important}'
                . 'body.pa-glass-site footer.wp-block-template-part:not(:has(.pa-site-footer-pro)) .wp-block-columns{'
                . 'position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;'
                . 'overflow:hidden!important;opacity:0!important;pointer-events:none!important;'
                . 'margin:0!important;padding:0!important;clip:rect(0,0,0,0)!important}'
                . '</style>' . "\n";
            echo '<script id="pa-home-fouc-boot">'
                . '(function(){try{'
                . 'document.documentElement.classList.add("pa-js","pa-home-fouc-guard");'
                . 'function hidePreChrome(){'
                . 'var s=document.querySelector(".pa-ssr-conversion");'
                . 'if(s){s.setAttribute("aria-hidden","true");}'
                . 'var h=document.querySelector("header.wp-block-template-part:not(.pa-home-header-chrome-moved),header.pa-site-header:not(.pa-home-header-chrome-moved)");'
                . 'if(h&&!document.body.classList.contains("pa-home-ready")){h.setAttribute("aria-hidden","true");}'
                . '}'
                . 'function hideLegacy(){var main=document.querySelector("main .entry-content,main .wp-block-post-content");'
                . 'if(!main)return;var titles=["Services Offered","Recent Work","Booking","About"];'
                . 'main.querySelectorAll("h1,h2,h3,h4,.wp-block-heading").forEach(function(h){'
                . 'var t=(h.textContent||"").replace(/\\s+/g," ").trim();'
                . 'if(titles.indexOf(t)===-1)return;'
                . 'var b=h.closest(".wp-block-column,.wp-block-columns,.wp-block-group");'
                . 'if(!b||b.querySelector(".pa-home-hero,.pa2-hero,.pa2-services,.pa2-portfolio"))return;'
                . 'b.setAttribute("hidden","");b.setAttribute("aria-hidden","true");'
                . 'b.classList.add("pa-theme-legacy-hidden");});}'
                . 'if(document.body){hideLegacy();hidePreChrome();}else{document.addEventListener("DOMContentLoaded",function(){hideLegacy();hidePreChrome();});}'
                . 'setTimeout(function(){if(document.body&&!document.body.classList.contains("pa-home-ready")){'
                . 'document.body.classList.add("pa-home-ready");}},3500);'
                . '}catch(e){}})();'
                . '</script>' . "\n";
            echo '<style id="pa-home-chrome-logo-critical">'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome{padding-top:0!important;margin-top:0!important}'
                . 'body.home.pa-home-chrome-above-hero main .entry-content,body.home.pa-home-chrome-above-hero main .wp-block-post-content{padding-top:0!important;margin-top:0!important}'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome .pa-brand-lockup,'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome .wp-block-site-logo,'
                . 'body.home.pa-home-chrome-above-hero header.pa-site-header .pa-brand-lockup,'
                . 'body.home.pa-home-chrome-above-hero header.pa-site-header .wp-block-site-logo'
                . '{width:auto!important;max-width:100%!important;padding:0!important;background:transparent!important;box-shadow:none!important}'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome .wp-block-site-logo a,'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome .pa-brand-logo-wrap a,'
                . 'body.home.pa-home-chrome-above-hero header.pa-site-header .wp-block-site-logo a,'
                . 'body.home.pa-home-chrome-above-hero header.pa-site-header .pa-brand-logo-wrap a'
                . '{display:inline-block!important;width:auto!important;max-width:min(520px,88vw)!important;'
                . 'margin:0 auto!important;line-height:0!important;overflow:hidden!important;border-radius:16px!important;box-shadow:none!important}'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome .wp-block-site-logo img,'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome img.custom-logo,'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome img.pa-brand-logo-lockup,'
                . 'body.home.pa-home-chrome-above-hero header.pa-site-header .wp-block-site-logo img,'
                . 'body.home.pa-home-chrome-above-hero header.pa-site-header img.custom-logo,'
                . 'body.home.pa-home-chrome-above-hero header.pa-site-header img.pa-brand-logo-lockup'
                . '{display:block!important;width:clamp(269px,44.8vw,384px)!important;max-width:min(384px,88vw)!important;'
                . 'height:auto!important;max-height:none!important;border-radius:16px!important;'
                . 'box-shadow:0 8px 22px rgba(0,0,0,.14)!important;object-fit:contain!important}'
                /* Home nav — pill buttons on first paint (header + post-hero chrome) */
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome .wp-block-navigation__container,'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome .wp-block-navigation__responsive-container-content,'
                . 'body.home.pa-home-chrome-above-hero header.pa-site-header .wp-block-navigation__container,'
                . 'body.home.pa-home-chrome-above-hero header.pa-site-header .wp-block-navigation__responsive-container-content'
                . '{display:inline-flex!important;flex-wrap:wrap!important;align-items:center!important;'
                . 'justify-content:center!important;gap:.75rem!important;padding:0!important;background:transparent!important;'
                . 'border:none!important;box-shadow:none!important}'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome .wp-block-navigation-item__content,'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome .pa-site-nav-pill,'
                . 'body.home.pa-home-chrome-above-hero header.pa-site-header .wp-block-navigation-item__content,'
                . 'body.home.pa-home-chrome-above-hero header.pa-site-header .pa-site-nav-pill'
                . '{display:inline-flex!important;align-items:center!important;justify-content:center!important;'
                . 'box-sizing:border-box!important;min-height:42px!important;padding:.5rem 1.15rem!important;'
                . 'border-radius:9999px!important;font-size:.875rem!important;font-weight:600!important;'
                . 'letter-spacing:.01em!important;text-transform:none!important;text-decoration:none!important;'
                . 'color:#1d1d1f!important;-webkit-text-fill-color:#1d1d1f!important;'
                . 'background:rgba(255,255,255,.72)!important;border:1px solid rgba(0,0,0,.1)!important;'
                . 'box-shadow:0 8px 22px rgba(15,23,42,.08),inset 0 1px 0 rgba(255,255,255,1)!important}'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome .current-menu-item .wp-block-navigation-item__content,'
                . 'body.home.pa-home-chrome-above-hero header.pa-site-header .current-menu-item .wp-block-navigation-item__content'
                . '{color:#005bb5!important;-webkit-text-fill-color:#005bb5!important;'
                . 'background:rgba(0,113,227,.14)!important;border:1px solid rgba(0,113,227,.38)!important}'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome .pa-nav-book .wp-block-navigation-item__content,'
                . 'body.home.pa-home-chrome-above-hero header.pa-site-header .pa-nav-book .wp-block-navigation-item__content'
                . '{color:#fff!important;-webkit-text-fill-color:#fff!important;'
                . 'background:#0071e3!important;border:1px solid rgba(255,255,255,.38)!important;'
                . 'box-shadow:0 12px 32px rgba(0,113,227,.42)!important;padding-left:1.5rem!important;padding-right:1.5rem!important}'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome .wp-block-navigation-item__label,'
                . 'body.home.pa-home-chrome-above-hero header.pa-site-header .wp-block-navigation-item__label'
                . '{background:transparent!important;border:none!important;box-shadow:none!important;color:inherit!important}'
                . '@media(max-width:782px){body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome{padding-top:env(safe-area-inset-top,0)!important}'
                . 'body.home.pa-home-chrome-above-hero .pa-home-post-hero-chrome .pa-nav-book{flex:1 1 100%!important;width:100%!important;display:flex!important;justify-content:center!important;margin-top:.15rem!important}}'
                . '</style>' . "\n";
        }

        echo '<style id="pa-header-nav-critical">'
            . 'body.pa-glass-site header .pa-nav-floating-pills,body.pa-glass-site header .pa-nav-dock,'
            . 'body.pa-glass-site.home header .pa-site-nav-pill-row,body.pa-glass-site.home header .wp-block-navigation__container'
            . '{display:inline-flex!important;flex-wrap:wrap;align-items:center;justify-content:center;'
            . 'gap:1rem!important;padding:0!important;background:transparent!important;border:none!important;'
            . 'box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}'
            /* Interior pages keep compact pills; home chrome uses full rounded pills in pa-home-chrome-logo-critical + home.css */
            . 'body.pa-glass-site.home header .pa-nav-floating-pills .wp-block-navigation-item__content,'
            . 'body.pa-glass-site.home header .pa-nav-dock .wp-block-navigation-item__content,'
            . 'body.pa-glass-site.home header .pa-site-nav-pill,'
            . 'body.pa-glass-site.home .pa-home-post-hero-chrome .wp-block-navigation-item__content'
            . '{border-radius:9999px!important;min-height:42px;padding:.5rem 1.15rem!important;'
            . 'font-size:.875rem!important;font-weight:600!important;letter-spacing:.01em!important;text-transform:none!important}'
            . 'body.pa-glass-site.home .pa-home-post-hero-chrome .wp-block-navigation-item:not(.pa-nav-book):not(.current-menu-item) .wp-block-navigation-item__content,'
            . 'body.pa-glass-site.home header .wp-block-navigation-item:not(.pa-nav-book):not(.current-menu-item) .wp-block-navigation-item__content'
            . '{color:#1d1d1f!important;background:rgba(255,255,255,.72)!important;'
            . 'border:1px solid rgba(0,0,0,.1)!important;border-radius:9999px!important}'
            . 'body.pa-glass-site.home .pa-home-post-hero-chrome .current-menu-item:not(.pa-nav-book) .wp-block-navigation-item__content,'
            . 'body.pa-glass-site.home header .current-menu-item:not(.pa-nav-book) .wp-block-navigation-item__content'
            . '{color:#005bb5!important;background:rgba(0,113,227,.14)!important;border:1px solid rgba(0,113,227,.28)!important;border-radius:9999px!important}'
            . 'body.pa-glass-site.home .pa-home-post-hero-chrome .pa-nav-book .wp-block-navigation-item__content,'
            . 'body.pa-glass-site.home header .pa-nav-book .wp-block-navigation-item__content'
            . '{color:#fff!important;background:#0071e3!important;border-radius:9999px!important;border:1px solid rgba(255,255,255,.38)!important}'
            . 'body.pa-glass-site:not(.home) header .pa-nav-floating-pills .wp-block-navigation-item__content,'
            . 'body.pa-glass-site:not(.home) header .pa-nav-dock .wp-block-navigation-item__content,'
            . 'body.pa-glass-site:not(.home) header .pa-site-nav-pill'
            . '{border-radius:10px!important;min-height:44px;padding:.65rem 1.25rem!important;'
            . 'font-size:.9375rem!important;font-weight:600!important;letter-spacing:.01em!important;text-transform:none!important}'
            . 'body.pa-glass-site.pa-marketing-nav:not(.home) header .wp-block-navigation-item:not(.pa-nav-book):not(.current-menu-item) .wp-block-navigation-item__content'
            . '{color:#1d1d1f!important;background:rgba(255,255,255,.72)!important;'
            . 'border:1px solid rgba(0,0,0,.1)!important;border-radius:10px!important}'
            . 'body.pa-glass-site.pa-marketing-nav:not(.home) header .current-menu-item:not(.pa-nav-book) .wp-block-navigation-item__content'
            . '{color:#005bb5!important;background:rgba(0,113,227,.1)!important;border:1px solid rgba(0,113,227,.28)!important;border-radius:10px!important}'
            . 'body.pa-glass-site:not(.home) header .pa-nav-book .wp-block-navigation-item__content'
            . '{color:#fff!important;background:#0071e3!important;border-radius:10px!important;border:1px solid #0071e3!important}'
            . 'body.pa-glass-site header .wp-block-navigation-item__label'
            . '{background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important}'
            . '</style>' . "\n";

        if (is_page('book')) {
            echo '<style id="pa-booking-header-critical">'
                . 'html.is-booking-funnel,body.pa-booking-page.is-booking-funnel{overflow-x:hidden!important}'
                . 'body.pa-booking-page header.pa-site-header,'
                . 'body.pa-booking-page header.wp-block-template-part.pa-site-header{'
                . 'position:relative!important;margin:0!important;padding:0 clamp(0.65rem,2.5vw,1rem)!important;'
                . 'background:transparent!important;border:none!important;box-shadow:none!important}'
                . 'body.pa-booking-page header .wp-block-cover.alignfull,'
                . 'body.pa-booking-page header .pa-glass-hero-wrap,'
                . 'body.pa-booking-page header .pa-home-hero,'
                . 'body.pa-booking-page header .pa-interior-header-clutter{'
                . 'display:none!important;height:0!important;max-height:0!important;overflow:hidden!important;'
                . 'margin:0!important;padding:0!important;visibility:hidden!important}'
                . 'body.pa-booking-page header .alignfull.has-foreground-color:has(.wp-block-navigation){'
                . 'background:transparent!important;border:none!important;box-shadow:none!important;'
                . 'padding-top:0.35rem!important;padding-bottom:0.35rem!important}'
                . 'body.pa-booking-page header .wp-block-site-logo img.pa-brand-logo-lockup,'
                . 'body.pa-booking-page header img.custom-logo.pa-brand-logo-lockup{'
                . 'width:auto!important;height:clamp(48px,9vw,72px)!important;max-height:72px!important;'
                . 'max-width:min(42vw,220px)!important;object-fit:contain!important}'
                . 'body.pa-booking-page main.wp-block-group,body.pa-booking-page .entry-content{'
                . 'padding-top:0.25rem!important;padding-bottom:0.75rem!important}'
                . 'body.pa-booking-page header [data-coblocks-animation]{'
                . 'animation:none!important;opacity:1!important;transform:none!important}'
                . 'body.pa-booking-page .pa-booking-trust-rail{display:flex!important}'
                . '</style>' . "\n";
            echo '<script id="pa-booking-funnel-boot">'
                . 'document.documentElement.classList.add("is-booking-funnel");'
                . '</script>' . "\n";
        }

        self::echo_site_icon_tags();
    }

    /**
     * Block-theme viewport with safe-area support (replaces core tag).
     */
    public function inject_viewport_meta() {
        if (is_admin()) {
            return;
        }
        remove_action('wp_head', '_block_template_viewport_meta_tag', 0);
        echo '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">' . "\n";
    }

    /**
     * iOS Safari chrome color — matches HAP blue primary CTA.
     */
    public function inject_mobile_chrome_meta() {
        if (is_admin()) {
            return;
        }
        echo '<meta name="theme-color" content="#0071e3">' . "\n";
        echo '<meta name="apple-mobile-web-app-status-bar-style" content="default">' . "\n";
    }

    /**
     * Favicon link tags shared by wp_head hooks.
     */
    public static function echo_site_icon_tags() {
        if (self::$site_icon_emitted) {
            return;
        }
        self::$site_icon_emitted = true;
        $icon = esc_url(self::logo_icon_url());
        echo '<link rel="icon" href="' . $icon . '" sizes="any">' . "\n";
        echo '<link rel="apple-touch-icon" href="' . $icon . '">' . "\n";
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
     * Rewrite oversized bare gallery uploads to compressed JPEG intermediates before first paint.
     * Prevents browsers from starting a 30MB+ PNG download from raw block HTML.
     *
     * @param string $block_content Rendered block HTML.
     * @param array  $block         Block payload.
     * @return string
     */
    public function filter_heavy_gallery_images($block_content, $block) {
        if (is_admin() || !is_string($block_content) || $block_content === '') {
            return $block_content;
        }
        if (empty($block['blockName']) || !in_array($block['blockName'], array('core/image', 'core/gallery', 'core/cover'), true)) {
            return $block_content;
        }

        $replacements = array(
            // 31 MB bare PNG → grid JPEG (created by bin/optimize-live-photos.py).
            '/wp-content/uploads/2025/12/IMG_5847.png' => '/wp-content/uploads/2025/12/IMG_5847-683x1024.jpg',
            '/wp-content/uploads/2025/12/IMG_5960-683x1024.png' => '/wp-content/uploads/2025/12/IMG_5960-683x1024.jpg',
            '/wp-content/uploads/2025/11/A44D6A70-5E01-43FC-8EA8-C1D8430C6D55-683x1024.png' => '/wp-content/uploads/2025/11/A44D6A70-5E01-43FC-8EA8-C1D8430C6D55-683x1024.jpg',
            '/wp-content/uploads/2025/11/BC3EB512-5789-4061-90E4-476ADBA6F177-753x1024.png' => '/wp-content/uploads/2025/11/BC3EB512-5789-4061-90E4-476ADBA6F177-683x1024.jpg',
        );

        foreach ($replacements as $from => $to) {
            if (strpos($block_content, $from) !== false) {
                $block_content = str_replace($from, $to, $block_content);
            }
        }

        return $block_content;
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
     * About page — /about/.
     */
    public static function about_url() {
        $page = get_page_by_path('about');
        if ($page && $page->post_status === 'publish') {
            return get_permalink($page);
        }
        return home_url('/about/');
    }

    /**
     * Contact page — /contact/ (distinct from book funnel contactUrl).
     */
    public static function contact_page_url() {
        $page = get_page_by_path('contact');
        if ($page && $page->post_status === 'publish') {
            return get_permalink($page);
        }
        return home_url('/contact/');
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
        self::echo_site_icon_tags();
    }

    public function maybe_assets() {
        if (!is_admin()) {
            wp_enqueue_style('pa2-tokens', PA_BOOKING_URL . 'assets/pa2-tokens.css', array(), self::asset_version('assets/pa2-tokens.css'));
            wp_enqueue_style('pa2-components', PA_BOOKING_URL . 'assets/pa2-components.css', array('pa2-tokens'), self::asset_version('assets/pa2-components.css'));
            $site_css_deps = array('pa2-tokens', 'pa2-components');
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
                wp_enqueue_style('pa-seo-hub', PA_BOOKING_URL . 'assets/seo-hub.css', array('pa-home'), self::asset_version('assets/seo-hub.css'));
                wp_enqueue_script('pa-home', PA_BOOKING_URL . 'assets/home.js', array('pa-site', 'pa-google-reviews', 'pa-service-icons'), self::asset_version('assets/home.js'), true);
            }
            if (is_page('service-areas')) {
                wp_enqueue_style('pa-seo-hub', PA_BOOKING_URL . 'assets/seo-hub.css', array('pa-site-mobile'), self::asset_version('assets/seo-hub.css'));
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
            if (is_page('contact')) {
                wp_enqueue_style('pa-inquiry', PA_BOOKING_URL . 'assets/inquiry.css', array('pa-site-mobile'), self::asset_version('assets/inquiry.css'));
                $glass_site_deps[] = 'pa-inquiry';
            }
            if (is_singular('page')) {
                $geo_post = get_queried_object();
                if ($geo_post instanceof WP_Post && PA_Booking_Landing_Pages::is_landing_slug($geo_post->post_name)) {
                    wp_enqueue_style('pa-geo-landing', PA_BOOKING_URL . 'assets/geo-landing.css', array('pa-site-mobile'), self::asset_version('assets/geo-landing.css'));
                    $glass_site_deps[] = 'pa-geo-landing';
                }
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
                'assetsBase' => esc_url_raw(PA_BOOKING_URL . 'assets/'),
                'siteName' => $s['artist_name'] ?? 'Pennsylvania Media Arts LLC',
                'homeUrl'  => esc_url_raw(home_url('/')),
                'bookUrl'  => esc_url_raw(self::book_url()),
                'workUrl'  => esc_url_raw(self::work_url()),
                'aboutUrl' => esc_url_raw(self::about_url()),
                'contactPageUrl' => esc_url_raw(self::contact_page_url()),
                'tagline'  => $s['tagline'] ?: 'Photography, video & live production · Pennsylvania.',
                'aboutParagraphs' => PA_Booking::about_paragraphs($s),
                'footerWork' => PA_Booking::footer_work_items(),
                'footerRecognition' => PA_Booking::footer_recognition(),
                'footerServiceLabels' => PA_Booking::footer_service_labels(),
                'notifyEmail' => sanitize_email($s['notify_email'] ?? 'jordan@pamedia.art'),
                'contactUrl' => esc_url_raw(add_query_arg('start', '1', self::book_url())),
                'startUrl' => esc_url_raw(PA_Booking_Funnel::start_url()),
                'serviceAreasUrl' => esc_url_raw(PA_Booking_SEO_Hub::hub_url()),
                'phone' => sanitize_text_field($s['phone'] ?? ''),
                'phoneTel' => self::phone_tel_href($s['phone'] ?? ''),
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
                'isContactPage' => is_page('contact'),
                'geoLandingLinks' => PA_Booking_Landing_Pages::public_links(),
                'geoLandingGroups' => PA_Booking_Landing_Pages::grouped_public_links(),
                'youtubeChannelUrl' => 'https://www.youtube.com/@PAMediaArts',
                'youtubeBookUrl'    => esc_url_raw(
                    add_query_arg(
                        array(
                            'start'       => '1',
                            'utm_source'  => 'youtube',
                            'utm_medium'  => 'video',
                        ),
                        self::book_url()
                    )
                ),
                'youtubeVideos' => (is_front_page() || is_page('work'))
                    ? PA_Booking_YouTube::featured_video_ids()
                    : array(),
                'youtubeBlockedVideos' => PA_Booking_YouTube::blocked_video_ids(),
                /* Local reels first in the home cinema strip (MP4 + poster in assets/media/). */
                'featuredLocalVideos' => (is_front_page() || is_page('work'))
                    ? array(
                        array(
                            'id'     => 'linkedin-reel',
                            'src'    => PA_BOOKING_URL . 'assets/media/linkedin-reel.mp4',
                            'poster' => PA_BOOKING_URL . 'assets/media/linkedin-reel-poster.jpg',
                            'title'  => 'Corporate Event',
                        ),
                        array(
                            'id'        => 'community-engagement',
                            'src'       => PA_BOOKING_URL . 'assets/media/community-engagement.mp4',
                            'poster'    => PA_BOOKING_URL . 'assets/media/community-engagement-poster.jpg',
                            'title'     => 'Community Engagement',
                            'youtubeId' => 'vLgDQyhEkUY',
                        ),
                        array(
                            'id'        => 'business-profile',
                            'src'       => PA_BOOKING_URL . 'assets/media/business-profile.mp4',
                            'poster'    => PA_BOOKING_URL . 'assets/media/business-profile-poster.jpg',
                            'title'     => 'Business Profile',
                            'youtubeId' => 'clhVBCiPmUQ',
                        ),
                    )
                    : array(),
                'portfolioGalleryAlts' => PA_Booking_SEO_Maintenance::portfolio_gallery_alts(),
            );
            if (is_front_page()) {
                $site_config['homeHeroImage'] = self::home_hero_image();
                $site_config['homeHeroImages'] = self::home_hero_images();
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
        wp_enqueue_style('pa-growth', PA_BOOKING_URL . 'assets/growth.css', array('pa-booking'), self::asset_version('assets/growth.css'));
        wp_enqueue_script('pa-growth', PA_BOOKING_URL . 'assets/growth.js', array('pa-booking'), self::asset_version('assets/growth.js'), true);
        wp_localize_script('pa-growth', 'PAGrowth', PA_Booking_Growth::public_signals());
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
        if (is_front_page() || is_page(array('services', 'work', 'about', 'contact', 'start', 'service-areas'))) {
            return true;
        }
        if (is_singular('page')) {
            $post = get_queried_object();
            if (
                $post instanceof WP_Post &&
                class_exists('PA_Booking_Landing_Pages') &&
                PA_Booking_Landing_Pages::is_landing_slug($post->post_name)
            ) {
                return true;
            }
        }
        return false;
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

    /**
     * tel: href from stored phone (digits only).
     *
     * @param string $phone
     * @return string
     */
    public static function phone_tel_href($phone) {
        $digits = preg_replace('/\D/', '', (string) $phone);
        if (strlen($digits) === 10) {
            return 'tel:+1' . $digits;
        }
        if (strlen($digits) === 11 && $digits[0] === '1') {
            return 'tel:+' . $digits;
        }
        return '';
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
            <?php
            $help_email = sanitize_email($s['notify_email'] ?? 'jordan@pamedia.art');
            if ($help_email) :
                ?>
            <p class="pa-booking-help-email">Questions before you book? Email <a href="mailto:<?php echo esc_attr($help_email); ?>"><?php echo esc_html($help_email); ?></a></p>
            <?php endif; ?>

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
