<?php
/**
 * Plugin Name: PA Booking — cache flush on deploy
 * Description: Purges GoDaddy full-page cache when PA Media Booking is deployed (fixes stale mobile HTML).
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

const PA_BOOKING_DEPLOY_KEY = 'pa-deploy-flush-2026';

/**
 * Load cache helper from the main plugin when present.
 */
function pa_booking_cache_flush_boot() {
    $helper = WP_PLUGIN_DIR . '/pa-media-booking.disabled/includes/class-cache.php';
    if (!is_readable($helper)) {
        $helper = WP_PLUGIN_DIR . '/pa-media-booking/includes/class-cache.php';
    }
    if (is_readable($helper)) {
        require_once $helper;
    }
}

add_action('init', function () {
    pa_booking_cache_flush_boot();
    if (!class_exists('PA_Booking_Cache')) {
        return;
    }
    $current = defined('PA_BOOKING_VERSION') ? PA_BOOKING_VERSION : '';
    $seen = (string) get_option('pa_booking_deployed_version', '');
    if ($current === '' || ($seen !== '' && version_compare($seen, $current, '>='))) {
        return;
    }
    PA_Booking_Cache::maybe_flush_after_deploy();
}, 20);

add_action('rest_api_init', function () {
    register_rest_route(
        'pa-booking/v1',
        '/purge-cache',
        array(
            'methods'             => array('POST', 'GET'),
            'permission_callback' => function ($request) {
                $key = $request->get_header('x-pa-deploy-key');
                if ($key === PA_BOOKING_DEPLOY_KEY) {
                    return true;
                }
                $param = $request->get_param('key');
                return is_string($param) && hash_equals(PA_BOOKING_DEPLOY_KEY, $param);
            },
            'callback'            => function () {
                pa_booking_cache_flush_boot();
                if (!class_exists('PA_Booking_Cache')) {
                    return new WP_REST_Response(
                        array('ok' => false, 'error' => 'cache helper missing'),
                        500
                    );
                }
                $flush = PA_Booking_Cache::flush_hosting_cache();
                $ver = defined('PA_BOOKING_VERSION') ? PA_BOOKING_VERSION : 'unknown';
                update_option('pa_booking_deployed_version', $ver, false);
                update_option('pa_booking_deployed_at', time(), false);
                return rest_ensure_response(
                    array_merge(
                        $flush,
                        array(
                            'version' => $ver,
                            'time'    => gmdate('c'),
                        )
                    )
                );
            },
        )
    );
});
