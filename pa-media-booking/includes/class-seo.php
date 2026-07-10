<?php
/**
 * SEO module — per-page meta, Open Graph, Twitter, JSON-LD, index hygiene.
 *
 * WHO THIS IS FOR: Marketing pages on pamedia.art when no dedicated SEO plugin is active.
 * WHAT IT DOES: Titles, descriptions, canonical, robots, structured data, GA4 hook.
 * HOW IT CONNECTS: Booted from class-pa-booking.php; defers to Yoast/Rank Math/AIOSEO/TSF when present.
 */

if (!defined('ABSPATH')) {
    exit;
}

class PA_Booking_SEO {

    /** @var bool */
    private static $booted = false;

    /**
     * Register hooks once.
     */
    public static function init() {
        if (self::$booted) {
            return;
        }
        self::$booted = true;

        add_action('wp_head', array(__CLASS__, 'inject_head'), 1);
        add_filter('document_title_parts', array(__CLASS__, 'filter_title_parts'), 20);
        add_filter('pre_get_document_title', array(__CLASS__, 'filter_document_title'), 99);
        add_filter('wp_robots', array(__CLASS__, 'filter_wp_robots'), 99);
        add_filter('robots_txt', array(__CLASS__, 'append_sitemap_to_robots'), 10, 2);
        add_filter('wp_sitemaps_posts_query_args', array(__CLASS__, 'sitemap_hygiene'), 10, 2);
        add_action('wp_head', array(__CLASS__, 'remove_theme_canonical'), 0);
        add_action('wp_body_open', array(__CLASS__, 'inject_skip_link'), 1);
        add_filter('render_block', array(__CLASS__, 'mark_main_landmark'), 5, 2);
        add_action('wp_enqueue_scripts', array(__CLASS__, 'enqueue_ga4'), 5);
    }

    /**
     * Prevent duplicate canonical link from core/theme when we output our own.
     */
    public static function remove_theme_canonical() {
        if (is_admin() || self::seo_plugin_active()) {
            return;
        }
        remove_action('wp_head', 'rel_canonical');
        // Block themes and some SEO-adjacent themes register canonical via this hook.
        remove_action('wp_head', 'rel_canonical', 10);
    }

    /**
     * Single document title string (avoids theme appending site tagline).
     *
     * @param string $title
     * @return string
     */
    public static function filter_document_title($title) {
        if (is_admin() || self::seo_plugin_active()) {
            return $title;
        }
        $meta = self::meta_for_request();
        return !empty($meta['title']) ? $meta['title'] : $title;
    }

    /**
     * Suppress WP core robots meta when we emit a full robots tag in inject_head().
     *
     * @param array<string, bool|string> $robots
     * @return array<string, bool|string>
     */
    public static function filter_wp_robots($robots) {
        if (is_admin() || self::seo_plugin_active()) {
            return $robots;
        }
        if (is_singular('page')) {
            $post = get_queried_object();
            if ($post instanceof WP_Post && self::is_junk_index_slug($post->post_name)) {
                return array(
                    'noindex' => true,
                    'follow'  => true,
                );
            }
        }
        if (self::page_key() !== '') {
            return array();
        }
        if (isset($_GET['pa_requested']) || isset($_GET['deposit']) || isset($_GET['session_id'])) {
            return array(
                'noindex'  => true,
                'follow'   => true,
            );
        }
        return $robots;
    }

    /**
     * @param string $output
     * @param bool   $public
     * @return string
     */
    public static function append_sitemap_to_robots($output, $public) {
        if (!$public || self::seo_plugin_active()) {
            return $output;
        }
        $sitemap = home_url('/wp-sitemap.xml');
        if (strpos($output, $sitemap) !== false) {
            return $output;
        }
        return trim($output) . "\nSitemap: " . $sitemap . "\n";
    }

    /**
     * True when a dedicated SEO plugin manages meta tags.
     */
    public static function seo_plugin_active() {
        return defined('WPSEO_VERSION')
            || defined('RANK_MATH_VERSION')
            || defined('AIOSEO_VERSION')
            || class_exists('The_SEO_Framework\\Load');
    }

    /**
     * Current marketing page key for meta/schema.
     *
     * @return string home|services|work|about|book|booking-confirmed|landing|''
     */
    public static function page_key() {
        if (is_front_page() || is_home()) {
            return 'home';
        }
        if (is_page('services')) {
            return 'services';
        }
        if (is_page('work')) {
            return 'work';
        }
        if (is_page('about')) {
            return 'about';
        }
        if (is_page('book') || PA_Booking_Frontend::page_has_shortcode_static('pa_booking')) {
            return 'book';
        }
        if (is_page('booking-confirmed') || PA_Booking_Frontend::page_has_shortcode_static('pa_booking_success')) {
            return 'booking-confirmed';
        }
        if (is_singular('page')) {
            $post = get_queried_object();
            if ($post instanceof WP_Post && PA_Booking_Landing_Pages::is_landing_slug($post->post_name)) {
                return 'landing';
            }
        }
        return '';
    }

    /**
     * SME-approved per-page SEO strings.
     *
     * @return array<string, array{title:string,description:string,og_alt?:string}>
     */
    public static function meta_map() {
        return array(
            'home' => array(
                'title'       => 'Event Photographer & Videographer Central PA | PA Media Arts',
                'description' => 'Pennsylvania Media Arts — professional photography, video, and live production across Central PA. Book online in minutes with secure deposits. Nominated for Best Videography at the 2026 Central Pennsylvania Music Awards.',
                'og_alt'      => 'Aerial photograph of the Harrisburg, Pennsylvania skyline at sunset',
            ),
            'services' => array(
                'title'       => 'Photography, Video, DJ & Live Audio Services | Central PA',
                'description' => 'Event photography, videography, DJ, and live sound for weddings and corporate events in Harrisburg, York, Lancaster, and Central Pennsylvania. One team, online booking.',
                'og_alt'      => 'Pennsylvania Media Arts event production services',
            ),
            'work' => array(
                'title'       => 'Portfolio — Event Photo & Video | Central Pennsylvania',
                'description' => 'Event photography and video portfolio from Pennsylvania Media Arts — concerts, weddings, and brand stories across Central PA.',
                'og_alt'      => 'Pennsylvania Media Arts event photography and video portfolio',
            ),
            'about' => array(
                'title'       => 'About PA Media Arts | Central PA Event Production',
                'description' => 'Meet Pennsylvania Media Arts — 15+ years producing photography, video, and live audio across Central Pennsylvania. Based in New Cumberland, PA.',
                'og_alt'      => 'Pennsylvania Media Arts team and story',
            ),
            'book' => array(
                'title'       => 'Book Online — Secure Deposit | PA Media Arts',
                'description' => 'Reserve your date with Pennsylvania Media Arts. Choose your service, date, and time, then secure your booking with a deposit paid securely through GoDaddy Payments or Stripe.',
                'og_alt'      => 'Book Pennsylvania Media Arts online',
            ),
            'booking-confirmed' => array(
                'title'       => 'Booking Received | PA Media Arts',
                'description' => 'Thank you — your booking request with Pennsylvania Media Arts was received. We confirm within one business day.',
                'og_alt'      => 'Pennsylvania Media Arts booking confirmation',
            ),
        );
    }

    /**
     * Meta for the current request.
     *
     * @return array{title:string,description:string,og_alt:string,robots:string}
     */
    public static function meta_for_request() {
        $key = self::page_key();
        $map = self::meta_map();
        $s = PA_Booking::get_settings();

        if ($key === 'landing') {
            $landing = PA_Booking_Landing_Pages::meta_for_current_page();
            if ($landing) {
                return $landing;
            }
        }

        if ($key && isset($map[$key])) {
            $meta = $map[$key];
            $robots = ($key === 'booking-confirmed') ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
            return array(
                'title'       => $meta['title'],
                'description' => $meta['description'],
                'og_alt'      => $meta['og_alt'] ?? 'Pennsylvania Media Arts',
                'robots'      => $robots,
            );
        }

        $deposit = number_format(($s['deposit_cents'] ?? 15000) / 100, 0);
        $excerpt = is_singular() ? wp_strip_all_tags(get_the_excerpt()) : '';
        return array(
            'title'       => wp_get_document_title(),
            'description' => $excerpt ? wp_trim_words($excerpt, 32, '…') : 'Pennsylvania Media Arts — professional photography, video, and live production across Central Pennsylvania. Book online with secure deposits.',
            'og_alt'      => 'Pennsylvania Media Arts',
            'robots'      => 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        );
    }

    /**
     * @param array<string, string> $parts
     * @return array<string, string>
     */
    public static function filter_title_parts($parts) {
        if (is_admin() || self::seo_plugin_active()) {
            return $parts;
        }
        $meta = self::meta_for_request();
        if (!empty($meta['title'])) {
            $parts['title'] = $meta['title'];
            $parts['site'] = '';
        }
        return $parts;
    }

    /**
     * Output meta tags and JSON-LD (skipped when external SEO plugin is active).
     */
    public static function inject_head() {
        if (is_admin() || self::seo_plugin_active()) {
            return;
        }

        $meta = self::meta_for_request();
        $url = esc_url(self::canonical_url());
        $image = esc_url(self::og_image_for_request());
        $title = $meta['title'];
        $description = $meta['description'];
        $site_name = 'Pennsylvania Media Arts';
        $key = self::page_key();
        if (is_singular('page')) {
            $post = get_queried_object();
            if ($post instanceof WP_Post && self::is_junk_index_slug($post->post_name)) {
                $meta['robots'] = 'noindex, follow';
            }
        }

        echo "\n<!-- PA Media Arts SEO -->\n";
        echo '<meta name="description" content="' . esc_attr($description) . '">' . "\n";
        echo '<meta name="robots" content="' . esc_attr($meta['robots']) . '">' . "\n";
        echo '<link rel="canonical" href="' . $url . '">' . "\n";

        echo '<meta property="og:type" content="' . (is_singular() && !is_front_page() ? 'article' : 'website') . '">' . "\n";
        echo '<meta property="og:site_name" content="' . esc_attr($site_name) . '">' . "\n";
        echo '<meta property="og:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta property="og:description" content="' . esc_attr($description) . '">' . "\n";
        echo '<meta property="og:url" content="' . $url . '">' . "\n";
        echo '<meta property="og:image" content="' . $image . '">' . "\n";
        echo '<meta property="og:image:alt" content="' . esc_attr($meta['og_alt']) . '">' . "\n";
        echo '<meta property="og:locale" content="en_US">' . "\n";
        if ($key === 'home') {
            echo '<meta property="og:image:width" content="2560">' . "\n";
            echo '<meta property="og:image:height" content="1440">' . "\n";
        }

        echo '<meta name="geo.region" content="US-PA">' . "\n";
        echo '<meta name="geo.placename" content="Central Pennsylvania">' . "\n";

        echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr($title) . '">' . "\n";
        echo '<meta name="twitter:description" content="' . esc_attr($description) . '">' . "\n";
        echo '<meta name="twitter:image" content="' . $image . '">' . "\n";
        echo '<meta name="twitter:image:alt" content="' . esc_attr($meta['og_alt']) . '">' . "\n";

        foreach (self::json_ld_blocks() as $block) {
            echo '<script type="application/ld+json">'
                . wp_json_encode($block, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
                . '</script>' . "\n";
        }
        echo "<!-- /PA Media Arts SEO -->\n";
    }

    /**
     * Canonical URL with tracking params stripped on thin/success URLs.
     */
    public static function canonical_url() {
        if (is_front_page()) {
            return esc_url(home_url('/'));
        }
        if (is_singular()) {
            $perma = get_permalink();
            if ($perma) {
                $strip = array(
                    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
                    'gclid', 'fbclid', 'msclkid',
                    'pa_requested', 'pa_booking', 'deposit', 'session_id', 'start',
                );
                return esc_url(remove_query_arg($strip, $perma));
            }
        }
        return esc_url(home_url(add_query_arg(array())));
    }

    /**
     * @return string
     */
    private static function og_image_for_request() {
        $key = self::page_key();
        if ($key === 'home') {
            $hero = PA_Booking_Frontend::home_hero_image();
            return $hero['url'];
        }
        return PA_Booking_Frontend::og_image_url();
    }

    /**
     * Structured data blocks for the current page.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function json_ld_blocks() {
        $key = self::page_key();
        $blocks = array();

        if ($key === 'home') {
            $blocks[] = self::business_jsonld();
            $blocks[] = self::website_jsonld();
        }
        if ($key === 'services' || $key === 'landing') {
            $blocks[] = self::services_itemlist_jsonld();
        }
        if ($key === 'book') {
            $blocks[] = self::faq_jsonld();
        }
        if ($key === 'work') {
            $video = self::featured_video_jsonld();
            if ($video) {
                $blocks[] = $video;
            }
        }
        if ($key === 'landing') {
            $landing_faq = self::landing_faq_jsonld();
            if ($landing_faq) {
                $blocks[] = $landing_faq;
            }
        }
        if ($key !== '' && $key !== 'home') {
            $webpage = self::webpage_jsonld($key);
            if ($webpage) {
                $blocks[] = $webpage;
            }
            $crumbs = self::breadcrumb_jsonld($key);
            if ($crumbs) {
                $blocks[] = $crumbs;
            }
        }

        return $blocks;
    }

    /**
     * @return array<string, mixed>|null
     */
    private static function webpage_jsonld($key) {
        $meta = self::meta_for_request();
        $data = array(
            '@context'    => 'https://schema.org',
            '@type'       => 'WebPage',
            '@id'         => self::canonical_url() . '#webpage',
            'url'         => self::canonical_url(),
            'name'        => $meta['title'],
            'description' => $meta['description'],
            'isPartOf'    => array('@id' => home_url('/#website')),
            'about'       => array('@id' => home_url('/#business')),
        );
        if ($key === 'book') {
            $data['potentialAction'] = array(
                '@type'  => 'ReserveAction',
                'target' => PA_Booking_Frontend::book_url() . '?start=1',
                'name'   => 'Book online with secure deposit',
            );
        }
        return $data;
    }

    /**
     * @return array<string, mixed>|null
     */
    private static function breadcrumb_jsonld($key) {
        $map = array(
            'services' => array(
                array('name' => 'Home', 'url' => home_url('/')),
                array('name' => 'Services', 'url' => home_url('/services/')),
            ),
            'work' => array(
                array('name' => 'Home', 'url' => home_url('/')),
                array('name' => 'Work', 'url' => home_url('/work/')),
            ),
            'about' => array(
                array('name' => 'Home', 'url' => home_url('/')),
                array('name' => 'About', 'url' => home_url('/about/')),
            ),
            'book' => array(
                array('name' => 'Home', 'url' => home_url('/')),
                array('name' => 'Book', 'url' => home_url('/book/')),
            ),
            'landing' => array(
                array('name' => 'Home', 'url' => home_url('/')),
                array('name' => 'Services', 'url' => home_url('/services/')),
            ),
        );
        if (!isset($map[$key])) {
            return null;
        }
        $items = $map[$key];
        if ($key === 'landing') {
            $def = PA_Booking_Landing_Pages::definition_for_current_page();
            if ($def) {
                $items[] = array(
                    'name' => $def['h1'],
                    'url'  => get_permalink(),
                );
            }
        }
        $list = array();
        $pos = 1;
        foreach ($items as $item) {
            $list[] = array(
                '@type'    => 'ListItem',
                'position' => $pos++,
                'name'     => $item['name'],
                'item'     => $item['url'],
            );
        }
        return array(
            '@context'        => 'https://schema.org',
            '@type'           => 'BreadcrumbList',
            'itemListElement' => $list,
        );
    }

    /**
     * @return array<string, mixed>|null
     */
    private static function landing_faq_jsonld() {
        $def = PA_Booking_Landing_Pages::definition_for_current_page();
        if (!$def || empty($def['faq'])) {
            return null;
        }
        $entities = array();
        foreach ($def['faq'] as $item) {
            $entities[] = array(
                '@type'          => 'Question',
                'name'           => $item['q'],
                'acceptedAnswer' => array(
                    '@type' => 'Answer',
                    'text'  => $item['a'],
                ),
            );
        }
        return array(
            '@context'   => 'https://schema.org',
            '@type'      => 'FAQPage',
            'mainEntity' => $entities,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private static function business_jsonld() {
        $s = PA_Booking::get_settings();
        $image = esc_url(PA_Booking_Frontend::og_image_url());
        $services = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', (string) ($s['services'] ?? '')))));
        $offers = array();
        foreach ($services as $service) {
            $offers[] = array(
                '@type' => 'Offer',
                'itemOffered' => array('@type' => 'Service', 'name' => $service),
            );
        }

        $cities = array('Harrisburg', 'York', 'Lancaster', 'Carlisle', 'Hershey', 'New Cumberland');
        $area_served = array();
        foreach ($cities as $city) {
            $area_served[] = array(
                '@type' => 'City',
                'name'  => $city,
                'containedInPlace' => array(
                    '@type' => 'State',
                    'name'  => 'Pennsylvania',
                ),
            );
        }

        $data = array(
            '@context' => 'https://schema.org',
            '@type'    => array('LocalBusiness', 'ProfessionalService'),
            '@id'      => home_url('/#business'),
            'name'     => 'Pennsylvania Media Arts LLC',
            'alternateName' => 'Pennsylvania Media Arts',
            'url'      => home_url('/'),
            'image'    => $image,
            'logo'     => esc_url(PA_Booking_Frontend::logo_url()),
            'email'    => sanitize_email($s['notify_email'] ?? 'jordan@pamedia.art'),
            'description' => 'Professional event photography, video production, live audio, and DJ services across Central Pennsylvania.',
            'address'  => array(
                '@type'           => 'PostalAddress',
                'addressLocality' => 'New Cumberland',
                'addressRegion'   => 'PA',
                'postalCode'      => '17070',
                'addressCountry'  => 'US',
            ),
            'geo' => array(
                '@type'     => 'GeoCoordinates',
                'latitude'  => 40.2273,
                'longitude' => -76.8844,
            ),
            'areaServed' => $area_served,
            'knowsAbout' => array('Event Photography', 'Video Production', 'Live Audio', 'DJ Services', 'Drone Photography'),
            'sameAs'     => array('https://www.youtube.com/@PAMediaArts'),
            'award'      => 'Nominated — Best Videography, 2026 Central Pennsylvania Music Awards (Central Pennsylvania Music Hall of Fame)',
            'priceRange' => '$$',
            'aggregateRating' => self::aggregate_rating_jsonld(),
            'review'     => self::review_entities_jsonld(),
        );
        if ($offers) {
            $data['makesOffer'] = $offers;
        }
        $phone = trim((string) ($s['phone'] ?? ''));
        if ($phone !== '') {
            $data['telephone'] = $phone;
        }
        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    private static function website_jsonld() {
        return array(
            '@context' => 'https://schema.org',
            '@type'    => 'WebSite',
            '@id'      => home_url('/#website'),
            'url'      => home_url('/'),
            'name'     => 'Pennsylvania Media Arts',
            'publisher' => array('@id' => home_url('/#business')),
            'potentialAction' => array(
                '@type'  => 'SearchAction',
                'target' => home_url('/?s={search_term_string}'),
                'query-input' => 'required name=search_term_string',
            ),
        );
    }

    /**
     * Mirrors on-page Google reviews carousel (google-reviews-data.js).
     *
     * @return array<string, mixed>
     */
    private static function aggregate_rating_jsonld() {
        return array(
            '@type'       => 'AggregateRating',
            'ratingValue' => '5',
            'bestRating'  => '5',
            'worstRating' => '1',
            'ratingCount' => '4',
            'reviewCount' => '4',
        );
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function review_entities_jsonld() {
        $reviews = array(
            array('author' => 'Matt Drozynski', 'text' => 'Jordan has been an amazing help running sound for our band! We get compliments like "this is the best you have ever sounded!" when he is behind the mixing board!'),
            array('author' => 'Olivia Basar', 'text' => 'I had a wonderful experience working with PA Media Arts on a video for my music. The owner Jordan recorded the video and audio and also did all of the post production mixing and editing with an extremely fast turn around time.'),
            array('author' => 'Jac Conner', 'text' => 'Very kind and well organized, efficient and proficient worker. Beyond happy with how both video and audio came out. Jordan is stellar!!'),
            array('author' => 'Northern Gloom', 'text' => 'PA Media Arts, aka Jordan Zabady, is my favorite Audio and Visual company in Pennsylvania. Jordan treats his clients extremely well and gives everyone involved a sense of ease.'),
        );
        $out = array();
        foreach ($reviews as $r) {
            $out[] = array(
                '@type'        => 'Review',
                'author'       => array('@type' => 'Person', 'name' => $r['author']),
                'reviewRating' => array('@type' => 'Rating', 'ratingValue' => '5', 'bestRating' => '5'),
                'reviewBody'   => $r['text'],
            );
        }
        return $out;
    }

    /**
     * @return array<string, mixed>
     */
    private static function services_itemlist_jsonld() {
        $s = PA_Booking::get_settings();
        $names = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', (string) ($s['services'] ?? '')))));
        $items = array();
        $pos = 1;
        foreach ($names as $name) {
            $pkg = PA_Booking_Service_Catalog::package_for($name);
            $item = array(
                '@type'       => 'Service',
                'name'        => $name,
                'description' => $pkg['tagline'] ?? '',
                'provider'    => array('@id' => home_url('/#business')),
                'areaServed'  => 'Central Pennsylvania',
            );
            if (!empty($pkg['starting_price_cents'])) {
                $item['offers'] = array(
                    '@type'         => 'Offer',
                    'priceCurrency' => 'USD',
                    'price'         => number_format($pkg['starting_price_cents'] / 100, 0, '.', ''),
                    'description'   => 'Starting price — final quote confirmed in writing',
                );
            }
            $items[] = array(
                '@type'    => 'ListItem',
                'position' => $pos++,
                'item'     => $item,
            );
        }
        return array(
            '@context'        => 'https://schema.org',
            '@type'           => 'ItemList',
            'name'            => 'Pennsylvania Media Arts Services',
            'itemListElement' => $items,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private static function faq_jsonld() {
        $entities = array();
        foreach (PA_Booking_Service_Catalog::faq_items() as $item) {
            $entities[] = array(
                '@type'          => 'Question',
                'name'           => $item['q'],
                'acceptedAnswer' => array(
                    '@type' => 'Answer',
                    'text'  => $item['a'],
                ),
            );
        }
        return array(
            '@context'   => 'https://schema.org',
            '@type'      => 'FAQPage',
            'mainEntity' => $entities,
        );
    }

    /**
     * @return array<string, mixed>|null
     */
    private static function featured_video_jsonld() {
        $ids = PA_Booking_YouTube::featured_video_ids();
        if (empty($ids[0])) {
            return null;
        }
        $id = $ids[0];
        return array(
            '@context'     => 'https://schema.org',
            '@type'        => 'VideoObject',
            'name'         => 'Pennsylvania Media Arts — featured event video',
            'description'  => 'Event videography portfolio from Pennsylvania Media Arts across Central Pennsylvania.',
            'thumbnailUrl' => 'https://i.ytimg.com/vi/' . rawurlencode($id) . '/hqdefault.jpg',
            'uploadDate'   => '2025-01-01',
            'contentUrl'   => 'https://www.youtube.com/watch?v=' . rawurlencode($id),
            'embedUrl'     => 'https://www.youtube.com/embed/' . rawurlencode($id),
            'publisher'    => array('@id' => home_url('/#business')),
        );
    }

    /**
     * Skip link for keyboard users (WCAG 2.4.1).
     */
    public static function inject_skip_link() {
        if (is_admin()) {
            return;
        }
        echo '<a class="pa-skip-link" href="#main-content">Skip to main content</a>' . "\n";
    }

    /**
     * Add id="main-content" to the theme main element when possible.
     *
     * @param string $block_content
     * @param array<string, mixed> $block
     * @return string
     */
    public static function mark_main_landmark($block_content, $block) {
        if (is_admin() || empty($block['blockName'])) {
            return $block_content;
        }
        if ($block['blockName'] !== 'core/post-content' && $block['blockName'] !== 'core/group') {
            return $block_content;
        }
        if (strpos($block_content, 'id="main-content"') !== false) {
            return $block_content;
        }
        if ($block['blockName'] === 'core/post-content') {
            return preg_replace(
                '/<main(\s[^>]*)?>/i',
                '<main id="main-content" tabindex="-1"$1>',
                $block_content,
                1
            ) ?: $block_content;
        }
        return $block_content;
    }

    /**
     * Duplicate WP pages (book-2, work-99, etc.) — noindex and exclude from sitemap.
     *
     * @param string $slug post_name
     */
    public static function is_junk_index_slug($slug) {
        $slug = (string) $slug;
        if ($slug === '') {
            return false;
        }
        if (preg_match('/^(book|work|privacy-policy)-\d+$/', $slug)) {
            return true;
        }
        if (preg_match('/^booking-status(-\d+)?$/', $slug)) {
            return true;
        }
        return false;
    }

    /**
     * IDs of auto-generated duplicate pages that harm crawl budget.
     *
     * @return array<int, int>
     */
    public static function junk_page_ids() {
        static $cache = null;
        if ($cache !== null) {
            return $cache;
        }
        global $wpdb;
        $rows = $wpdb->get_col(
            "SELECT ID FROM {$wpdb->posts}
            WHERE post_type = 'page' AND post_status = 'publish'
            AND (
                post_name REGEXP '^(book|work|privacy-policy)-[0-9]+$'
                OR post_name REGEXP '^booking-status(-[0-9]+)?$'
            )"
        );
        $cache = array_values(array_map('intval', $rows ?: array()));
        return $cache;
    }

    /**
     * Exclude thin confirmation + junk duplicate pages from XML sitemap.
     *
     * @param array<string, mixed> $args
     * @param string $post_type
     * @return array<string, mixed>
     */
    public static function sitemap_hygiene($args, $post_type) {
        if ($post_type !== 'page') {
            return $args;
        }
        if (!isset($args['post__not_in']) || !is_array($args['post__not_in'])) {
            $args['post__not_in'] = array();
        }
        $page = get_page_by_path('booking-confirmed');
        if ($page) {
            $args['post__not_in'][] = (int) $page->ID;
        }
        foreach (self::junk_page_ids() as $id) {
            $args['post__not_in'][] = $id;
        }
        return $args;
    }

    /**
     * @deprecated Use sitemap_hygiene()
     */
    public static function sitemap_exclude_confirmation($args, $post_type) {
        return self::sitemap_hygiene($args, $post_type);
    }

    /**
     * GA4 gtag when Measurement ID is configured in settings.
     */
    public static function enqueue_ga4() {
        if (is_admin()) {
            return;
        }
        $s = PA_Booking::get_settings();
        $mid = isset($s['ga4_measurement_id']) ? trim((string) $s['ga4_measurement_id']) : '';
        if ($mid === '' || !preg_match('/^G-[A-Z0-9]+$/i', $mid)) {
            return;
        }
        wp_enqueue_script(
            'pa-ga4',
            'https://www.googletagmanager.com/gtag/js?id=' . rawurlencode($mid),
            array(),
            null,
            false
        );
        wp_script_add_data('pa-ga4', 'async', true);
        wp_add_inline_script(
            'pa-ga4',
            "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}"
            . "gtag('js',new Date());gtag('config','" . esc_js($mid) . "',{send_page_view:true});"
            . "window.PAGA4={measurementId:'" . esc_js($mid) . "',event:function(n,p){gtag('event',n,p||{});}};",
            'after'
        );
    }
}
