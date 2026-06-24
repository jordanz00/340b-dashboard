<?php
/**
 * Plugin Name: PA Media Booking
 * Description: Custom calendar booking for independent artists — availability, deposits, GoDaddy Pay Link / Stripe, admin approval.
 * Version: 2.35.8
 * Author: Pennsylvania Media Arts LLC
 * Text Domain: pa-media-booking
 */

if (!defined('ABSPATH')) {
    exit;
}

define('PA_BOOKING_VERSION', '2.35.8');
define('PA_BOOKING_PATH', plugin_dir_path(__FILE__));
define('PA_BOOKING_URL', plugin_dir_url(__FILE__));

/**
 * Live booking.js was missing the state object closing brace (JS syntax error → eternal "Loading…").
 */
function pa_booking_js_needs_patch($js = null) {
    if ($js === null) {
        $path = PA_BOOKING_PATH . 'assets/booking.js';
        if (!is_readable($path)) {
            return false;
        }
        $js = file_get_contents($path);
    }
    return is_string($js) && strpos($js, "paylinkUrl: '',\n\n  var MONTHS =") !== false;
}

function pa_booking_patch_booking_js($js) {
    return str_replace(
        "    paylinkUrl: '',\n\n  var MONTHS =",
        "    paylinkUrl: '',\n    notes: '',\n  };\n\n  var MONTHS =",
        $js
    );
}

function pa_booking_get_booking_js() {
    $path = PA_BOOKING_PATH . 'assets/booking.js';
    if (!is_readable($path)) {
        return '';
    }
    $js = file_get_contents($path);
    return pa_booking_js_needs_patch($js) ? pa_booking_patch_booking_js($js) : $js;
}

function pa_booking_maybe_fix_booking_js_file() {
    $path = PA_BOOKING_PATH . 'assets/booking.js';
    if (!is_readable($path) || !is_writable($path)) {
        return;
    }
    $js = file_get_contents($path);
    if (!pa_booking_js_needs_patch($js)) {
        return;
    }
    file_put_contents($path, pa_booking_patch_booking_js($js));
}

add_action('plugins_loaded', 'pa_booking_maybe_fix_booking_js_file', 1);

add_action('rest_api_init', function () {
    register_rest_route(
        'pa-booking/v1',
        '/booking-script',
        array(
            'methods'             => 'GET',
            'permission_callback' => '__return_true',
            'callback'            => function () {
                return new WP_REST_Response(array('ok' => true), 200);
            },
        )
    );
}, 15);

add_filter('rest_pre_serve_request', function ($served, $result, $request, $server) {
    if ($request->get_route() !== '/pa-booking/v1/booking-script') {
        return $served;
    }
    $js = pa_booking_get_booking_js();
    if ($js === '') {
        status_header(404);
        echo '/* booking.js not found */';
        return true;
    }
    header('Content-Type: application/javascript; charset=UTF-8');
    header('Cache-Control: public, max-age=300');
    echo $js;
    return true;
}, 10, 4);

add_filter('script_loader_src', function ($src, $handle) {
    if ($handle !== 'pa-booking') {
        return $src;
    }
    $path = PA_BOOKING_PATH . 'assets/booking.js';
    if (!is_readable($path)) {
        return $src;
    }
    $js = file_get_contents($path);
    if (!pa_booking_js_needs_patch($js)) {
        return $src;
    }
    return add_query_arg('v', PA_BOOKING_VERSION, rest_url('pa-booking/v1/booking-script'));
}, 10, 2);

function pa_booking_boot() {
    require_once PA_BOOKING_PATH . 'includes/class-pa-booking.php';
    PA_Booking::instance();
}

add_action('plugins_loaded', 'pa_booking_boot');

add_action('plugins_loaded', 'pa_booking_maybe_upgrade', 5);

/**
 * One-time settings migration per release.
 */
function pa_booking_maybe_upgrade() {
    $stored = get_option('pa_booking_db_version', '0');
    if (version_compare($stored, PA_BOOKING_VERSION, '>=')) {
        return;
    }
    if (version_compare($stored, '2.8.0', '<')) {
        $s = get_option('pa_booking_settings', array());
        if (is_array($s)) {
            $s['deposit_payments_enabled'] = false;
            update_option('pa_booking_settings', $s);
        }
    }
    if (version_compare($stored, '2.8.3', '<')) {
        require_once PA_BOOKING_PATH . 'includes/class-legal-pages.php';
        PA_Booking_Legal_Pages::ensure_all();
        update_option('pa_booking_legal_pages_ready', 1);
    }
    if (version_compare($stored, '2.9.0', '<')) {
        $payments_file = PA_BOOKING_PATH . 'includes/class-payments.php';
        if (is_readable($payments_file)) {
            require_once $payments_file;
            $s = get_option('pa_booking_settings', array());
            if (is_array($s)) {
                if (empty($s['paylink_url'])) {
                    $s['paylink_url'] = PA_Booking_Payments::DEFAULT_PAYLINK;
                }
                $s['deposit_payments_enabled'] = true;
                update_option('pa_booking_settings', $s);
            }
            delete_option('pa_booking_needs_stripe');
        }
    }
    if (version_compare($stored, '2.35.0', '<')) {
        require_once PA_BOOKING_PATH . 'includes/class-setup.php';
        PA_Booking_Setup::ensure_status_page_public();
        flush_rewrite_rules();
    }
    update_option('pa_booking_db_version', PA_BOOKING_VERSION);
}

register_activation_hook(
    __FILE__,
    function () {
        require_once PA_BOOKING_PATH . 'includes/class-pa-booking.php';
        PA_Booking::on_activate();
    }
);
