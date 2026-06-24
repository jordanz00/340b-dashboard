<?php
/**
 * PA Booking runtime setup (mu-plugin).
 * wp-content/mu-plugins/pa-booking-setup.php
 */
if (!defined('ABSPATH')) {
    exit;
}

add_action(
    'init',
    function () {
        $settings = get_option('pa_booking_settings', array());
        if (!is_array($settings)) {
            $settings = array();
        }
        if (empty($settings['notify_email'])) {
            $settings['notify_email'] = 'jordan@pamedia.art';
        }
        $success = get_page_by_path('booking-confirmed');
        if ($success && empty($settings['success_page'])) {
            $settings['success_page'] = (int) $success->ID;
        }
        update_option('pa_booking_settings', $settings);

        if (!get_option('pa_booking_rewrite_flush_192')) {
            flush_rewrite_rules(false);
            delete_option('pa_booking_rewrite_ver');
            update_option('pa_booking_rewrite_flush_192', 1);
        }
    },
    99
);
