<?php
/**
 * Geo-service landing pages for Central PA SEO (human-approved copy).
 *
 * WHO THIS IS FOR: Organic search visitors with service + location intent.
 * WHAT IT DOES: Creates WP pages + shortcode-rendered content with FAQ and book CTA.
 * HOW IT CONNECTS: PA_Booking_Page_Setup::run(), PA_Booking_SEO meta/schema.
 */

if (!defined('ABSPATH')) {
    exit;
}

class PA_Booking_Landing_Pages {

    /**
     * Landing page definitions.
     *
     * @return array<string, array{title:string,slug:string,service:string,h1:string,lead:string,body:string[],faq:array<int,array{q:string,a:string}>,meta_title:string,meta_description:string}>
     */
    public static function definitions() {
        return array(
            'wedding-photo-video-central-pa' => array(
                'title'            => 'Wedding Photo & Video — Central PA',
                'slug'             => 'services/wedding-photo-video-central-pa',
                'service'          => 'Photo + Video Bundle',
                'h1'               => 'Wedding photography & videography in Central PA',
                'lead'             => 'One coordinated team for Harrisburg, York, Lancaster, and surrounding counties — book online with a secure deposit.',
                'body'             => array(
                    'Pennsylvania Media Arts delivers wedding photography and cinematic video with a single timeline and one point of contact. We cover ceremonies, receptions, and key moments with story-driven stills and edited highlight films.',
                    'Based in New Cumberland, we regularly serve couples across the Harrisburg–York–Lancaster corridor. Pre-event planning calls, online gallery delivery, and licensed music mixes (where applicable) are included in our wedding packages.',
                ),
                'faq' => array(
                    array('q' => 'Do you travel for weddings outside Harrisburg?', 'a' => 'Yes — Central PA is included in our standard travel area. Mileage beyond may apply and is quoted before final payment.'),
                    array('q' => 'Can we book photo and video together?', 'a' => 'Yes. Our Photo + Video Bundle coordinates both crews on the same schedule with matched editing style.'),
                ),
                'meta_title'       => 'Wedding Photographer & Videographer Central PA | PA Media Arts',
                'meta_description' => 'Wedding photography and videography in Harrisburg, York, and Lancaster. One Central PA team — book online with a secure deposit.',
            ),
            'corporate-event-production-harrisburg' => array(
                'title'            => 'Corporate Event Production — Harrisburg',
                'slug'             => 'services/corporate-event-production-harrisburg',
                'service'          => 'Video Production',
                'h1'               => 'Corporate event photo & video in Harrisburg',
                'lead'             => 'Conferences, galas, and brand launches — professional capture and live sound for Central Pennsylvania venues.',
                'body'             => array(
                    'From keynote presentations to evening receptions, Pennsylvania Media Arts provides event photography, multi-camera video, and live audio reinforcement for corporate clients across the capital region.',
                    'We work with venues throughout Harrisburg, Carlisle, and Hershey — delivering edited highlight reels, full documentation, and secure file delivery for your marketing and internal teams.',
                ),
                'faq' => array(
                    array('q' => 'Do you provide live sound for corporate events?', 'a' => 'Yes. Our Live Audio / PA service includes wireless mics, monitoring, and an on-site engineer.'),
                    array('q' => 'How far in advance should we book?', 'a' => 'We recommend booking as soon as your date is set. Online booking requires at least 48 hours notice for new dates.'),
                ),
                'meta_title'       => 'Corporate Event Photographer Harrisburg | PA Media Arts',
                'meta_description' => 'Corporate event photography, video, and live production in Harrisburg and Central PA. Book Pennsylvania Media Arts online.',
            ),
            'dj-live-audio-central-pa' => array(
                'title'            => 'DJ & Live Audio — Central PA',
                'slug'             => 'services/dj-live-audio-central-pa',
                'service'          => 'DJ Services',
                'h1'               => 'DJ & live sound services in Central PA',
                'lead'             => 'Wedding DJs, MC services, and full PA reinforcement for venues across Pennsylvania.',
                'body'             => array(
                    'Pennsylvania Media Arts provides professional DJ services with custom playlist planning, MC announcements, and dance-floor energy — plus live sound reinforcement for concerts, ceremonies, and corporate presentations.',
                    'We tailor PA systems to your venue size, provide wireless microphones, and handle setup and strike so you can focus on your guests.',
                ),
                'faq' => array(
                    array('q' => 'Can you DJ and run sound for the same event?', 'a' => 'Yes. Many clients book DJ Services alongside Live Audio / PA for full coverage.'),
                    array('q' => 'What areas do you serve?', 'a' => 'Central Pennsylvania including Harrisburg, York, Lancaster, Carlisle, and Hershey.'),
                ),
                'meta_title'       => 'Wedding DJ & Live Sound Central PA | PA Media Arts',
                'meta_description' => 'DJ services and live sound reinforcement for weddings and events in Central Pennsylvania. Book online with PA Media Arts.',
            ),
            'event-videographer-harrisburg' => array(
                'title'            => 'Event Videographer — Harrisburg',
                'slug'             => 'services/event-videographer-harrisburg',
                'service'          => 'Video Production',
                'h1'               => 'Event videographer in Harrisburg & Central PA',
                'lead'             => 'Multi-camera event video for weddings, concerts, galas, and brand stories — one team from capture through final edit.',
                'body'             => array(
                    'Pennsylvania Media Arts produces cinematic event video across the Harrisburg capital region and Central Pennsylvania. We plan shots around your run-of-show, capture keynote and performance moments, and deliver edited highlights your team can share.',
                    'From nonprofit galas to live music and corporate announcements, you get a single producer coordinating cameras, audio sync, and delivery timelines.',
                ),
                'faq' => array(
                    array('q' => 'Do you film concerts and live music?', 'a' => 'Yes. We regularly cover concerts and festivals across Central PA with multi-camera packages and live-sound coordination.'),
                    array('q' => 'How do we book a videographer?', 'a' => 'Choose Video Production online, pick your date, and secure your slot with a deposit. We confirm details within one business day.'),
                ),
                'meta_title'       => 'Event Videographer Harrisburg PA | PA Media Arts',
                'meta_description' => 'Professional event videography in Harrisburg and Central PA. Weddings, concerts, and corporate video — book Pennsylvania Media Arts online.',
            ),
            'concert-videography-pennsylvania' => array(
                'title'            => 'Concert Videography — Pennsylvania',
                'slug'             => 'services/concert-videography-pennsylvania',
                'service'          => 'Video Production',
                'h1'               => 'Concert & live music videography in Pennsylvania',
                'lead'             => 'Multi-camera concert capture with experienced live-sound coordination — trusted by artists and venues across Central PA.',
                'body'             => array(
                    'Pennsylvania Media Arts specializes in live music video: multi-camera angles, board feed when available, and highlight edits built for social and artist reels. Nominated for Best Videography at the 2026 Central Pennsylvania Music Awards.',
                    'We understand load-in windows, low-light stages, and fast turnarounds — so your performance looks as strong on screen as it did in the room.',
                ),
                'faq' => array(
                    array('q' => 'Can you combine concert video with photography?', 'a' => 'Yes. Book Photo + Video Bundle or add Event Photography to your video package for full coverage.'),
                    array('q' => 'Do you travel outside Central PA?', 'a' => 'Central PA is included in standard travel. Farther dates are quoted before you pay the balance.'),
                ),
                'meta_title'       => 'Concert Videography Pennsylvania | PA Media Arts',
                'meta_description' => 'Concert and live music videography across Pennsylvania. Multi-camera production from Pennsylvania Media Arts — book online.',
            ),
        );
    }

    /**
     * @param string $slug Post name (last segment).
     */
    public static function is_landing_slug($slug) {
        foreach (self::definitions() as $def) {
            $parts = explode('/', trim($def['slug'], '/'));
            $leaf = end($parts);
            if ($leaf === $slug) {
                return true;
            }
        }
        return false;
    }

    /**
     * Full landing definition for the current singular page.
     *
     * @return array<string, mixed>|null
     */
    public static function definition_for_current_page() {
        if (!is_singular('page')) {
            return null;
        }
        $post = get_queried_object();
        if (!$post instanceof WP_Post) {
            return null;
        }
        foreach (self::definitions() as $def) {
            $parts = explode('/', trim($def['slug'], '/'));
            $leaf = end($parts);
            if ($post->post_name === $leaf) {
                return $def;
            }
        }
        return null;
    }

    /**
     * Public URLs for geo landing pages (internal linking).
     *
     * @return array<int, array{label:string,url:string}>
     */
    public static function public_links() {
        $out = array();
        foreach (self::definitions() as $def) {
            $page = get_page_by_path($def['slug']);
            if (!$page || $page->post_status !== 'publish') {
                continue;
            }
            $out[] = array(
                'label' => $def['h1'],
                'url'   => get_permalink($page),
            );
        }
        return $out;
    }

    /**
     * Meta for current landing page.
     *
     * @return array{title:string,description:string,og_alt:string,robots:string}|null
     */
    public static function meta_for_current_page() {
        if (!is_singular('page')) {
            return null;
        }
        $post = get_queried_object();
        if (!$post instanceof WP_Post) {
            return null;
        }
        foreach (self::definitions() as $def) {
            $parts = explode('/', trim($def['slug'], '/'));
            $leaf = end($parts);
            if ($post->post_name === $leaf) {
                return array(
                    'title'       => $def['meta_title'],
                    'description' => $def['meta_description'],
                    'og_alt'      => $def['h1'],
                    'robots'      => 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
                );
            }
        }
        return null;
    }

    /**
     * Create landing pages on plugin setup.
     */
    public static function ensure_all() {
        foreach (self::definitions() as $key => $def) {
            self::ensure_page($key, $def);
        }
    }

    /**
     * @param string $key
     * @param array<string, mixed> $def
     */
    private static function ensure_page($key, $def) {
        $parts = explode('/', trim($def['slug'], '/'));
        $leaf = end($parts);
        $parent_path = count($parts) > 1 ? $parts[0] : '';
        $parent_id = 0;
        if ($parent_path !== '') {
            $parent = get_page_by_path($parent_path);
            if (!$parent) {
                $parent_id = wp_insert_post(
                    array(
                        'post_title'  => ucfirst($parent_path),
                        'post_name'   => $parent_path,
                        'post_status' => 'publish',
                        'post_type'   => 'page',
                        'post_content' => '',
                    ),
                    true
                );
                if (is_wp_error($parent_id)) {
                    $parent_id = 0;
                }
            } else {
                $parent_id = (int) $parent->ID;
            }
        }

        $existing = get_page_by_path($def['slug']);
        $content = '<!-- wp:shortcode -->' . "\n[pa_geo_landing key=\"" . esc_attr($key) . "\"]\n" . '<!-- /wp:shortcode -->';

        if ($existing) {
            if ($existing->post_status !== 'publish') {
                wp_update_post(array('ID' => $existing->ID, 'post_status' => 'publish'));
            }
            if (strpos($existing->post_content, '[pa_geo_landing') === false) {
                wp_update_post(array('ID' => $existing->ID, 'post_content' => $content));
            }
            return (int) $existing->ID;
        }

        $page_id = wp_insert_post(
            array(
                'post_title'   => $def['title'],
                'post_name'    => $leaf,
                'post_parent'  => $parent_id,
                'post_status'  => 'publish',
                'post_type'    => 'page',
                'post_content' => $content,
            ),
            true
        );
        return is_wp_error($page_id) ? 0 : (int) $page_id;
    }

    /**
     * Register shortcode.
     */
    public static function register_shortcode() {
        add_shortcode('pa_geo_landing', array(__CLASS__, 'render_shortcode'));
    }

    /**
     * @param array<string, string> $atts
     * @return string
     */
    public static function render_shortcode($atts) {
        $atts = shortcode_atts(array('key' => ''), $atts, 'pa_geo_landing');
        $defs = self::definitions();
        $key = sanitize_key($atts['key']);
        if ($key === '' || !isset($defs[$key])) {
            return '';
        }
        $def = $defs[$key];
        $book = add_query_arg(
            array('start' => '1', 'service' => rawurlencode($def['service'])),
            PA_Booking_Frontend::book_url()
        );

        ob_start();
        ?>
        <article class="pa-geo-landing alignwide" aria-labelledby="pa-geo-landing-title">
            <header class="pa-geo-landing__hero">
                <p class="pa-geo-landing__eyebrow">Pennsylvania Media Arts · Central PA</p>
                <h1 id="pa-geo-landing-title" class="pa-geo-landing__title"><?php echo esc_html($def['h1']); ?></h1>
                <p class="pa-geo-landing__lead"><?php echo esc_html($def['lead']); ?></p>
            </header>
            <div class="pa-geo-landing__body">
                <?php foreach ($def['body'] as $para) : ?>
                    <p><?php echo esc_html($para); ?></p>
                <?php endforeach; ?>
            </div>
            <section class="pa-geo-landing__faq" aria-labelledby="pa-geo-faq-title">
                <h2 id="pa-geo-faq-title">Frequently asked questions</h2>
                <dl class="pa-geo-landing__faq-list">
                    <?php foreach ($def['faq'] as $item) : ?>
                        <dt><?php echo esc_html($item['q']); ?></dt>
                        <dd><?php echo esc_html($item['a']); ?></dd>
                    <?php endforeach; ?>
                </dl>
            </section>
            <p class="pa-geo-landing__cta-wrap">
                <a class="pa-geo-landing__cta pa2-hero__btn pa2-hero__btn--primary" href="<?php echo esc_url($book); ?>">Book this service</a>
            </p>
        </article>
        <?php
        return (string) ob_get_clean();
    }
}
