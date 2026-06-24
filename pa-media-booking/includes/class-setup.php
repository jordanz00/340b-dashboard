<?php
/**
 * One-time setup: success page, homepage shortcode, defaults.
 */

if (!defined('ABSPATH')) {
    exit;
}

class PA_Booking_Setup {
    public static function run() {
        self::ensure_success_page();
        self::ensure_status_page();
        self::ensure_home_shortcode();
        self::ensure_defaults();
        flush_rewrite_rules();
    }

    private static function ensure_success_page() {
        $settings = PA_Booking::get_settings();
        if (!empty($settings['success_page']) && get_post((int) $settings['success_page'])) {
            return;
        }

        $existing = get_page_by_path('booking-confirmed');
        if ($existing) {
            $page_id = $existing->ID;
        } else {
            $page_id = wp_insert_post(
                array(
                    'post_title'   => 'Booking Confirmed',
                    'post_name'    => 'booking-confirmed',
                    'post_status'  => 'publish',
                    'post_type'    => 'page',
                    'post_content' => "<!-- wp:shortcode -->\n[pa_booking_success]\n<!-- /wp:shortcode -->",
                ),
                true
            );
            if (is_wp_error($page_id)) {
                return;
            }
        }

        $settings = PA_Booking::get_settings();
        $settings['success_page'] = (int) $page_id;
        update_option(PA_Booking::OPTION_SETTINGS, $settings);
    }

    private static function ensure_status_page() {
        $existing = get_page_by_path('booking-status');
        if ($existing) {
            return;
        }
        self::create_status_page();
    }

    /**
     * Public hook for version upgrades.
     */
    public static function ensure_status_page_public() {
        self::ensure_status_page();
    }

    private static function create_status_page() {
        wp_insert_post(
            array(
                'post_title'   => 'Booking Status',
                'post_name'    => 'booking-status',
                'post_status'  => 'publish',
                'post_type'    => 'page',
                'post_content' => "<!-- wp:shortcode -->\n[pa_booking_status]\n<!-- /wp:shortcode -->",
            ),
            true
        );
    }

    private static function ensure_home_shortcode() {
        $front_id = (int) get_option('page_on_front');
        if (!$front_id) {
            return;
        }

        $post = get_post($front_id);
        if (!$post || strpos($post->post_content, '[pa_booking]') !== false) {
            return;
        }

        $block = "<!-- wp:shortcode -->\n[pa_booking]\n<!-- /wp:shortcode -->\n\n";
        wp_update_post(
            array(
                'ID'           => $front_id,
                'post_content' => $block . $post->post_content,
            )
        );
    }

    private static function ensure_defaults() {
        $settings = PA_Booking::get_settings();
        if (empty($settings['notify_email'])) {
            $settings['notify_email'] = 'jordan@pamedia.art';
        }
        update_option(PA_Booking::OPTION_SETTINGS, $settings);
        update_option('pa_booking_needs_stripe', '1');
    }

    public static function stripe_configured() {
        return PA_Booking_Stripe::is_configured();
    }

    public static function admin_notice() {
        if (!current_user_can('manage_options') || !get_option('pa_booking_needs_stripe')) {
            return;
        }
        if (self::stripe_configured()) {
            delete_option('pa_booking_needs_stripe');
            return;
        }
        $url = admin_url('admin.php?page=pa-booking-settings');
        echo '<div class="notice notice-warning"><p><strong>PA Booking:</strong> Paste your Stripe API keys to go live. <a href="' . esc_url($url) . '">Open Settings →</a></p></div>';
    }
}
