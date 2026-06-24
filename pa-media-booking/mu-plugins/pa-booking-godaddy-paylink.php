<?php
/**
 * Plugin Name: PA Booking — GoDaddy Pay Link
 * Description: Enables GoDaddy Pay Link checkout (deposit before request) and fixes REST cookie errors.
 * Version: 1.1.0
 */

if (!defined('ABSPATH')) {
    exit;
}

const PA_BOOKING_GODADDY_PAYLINK = 'https://b094a6f2-7079-462c-92ee-3f8571bf9abe.paylinks.godaddy.com/0a5295d9-cecb-425f-b4db-ecf';

add_action('init', function () {
    $s = get_option('pa_booking_settings', array());
    if (!is_array($s)) {
        $s = array();
    }
    $s['deposit_payments_enabled'] = true;
    $s['paylink_url'] = PA_BOOKING_GODADDY_PAYLINK;
    update_option('pa_booking_settings', $s);
}, 5);

add_filter('rest_authentication_errors', function ($result) {
    if (empty($result) || !is_wp_error($result)) {
        return $result;
    }
    if ($result->get_error_code() !== 'rest_cookie_invalid_nonce') {
        return $result;
    }
    $uri = isset($_SERVER['REQUEST_URI']) ? sanitize_text_field(wp_unslash($_SERVER['REQUEST_URI'])) : '';
    if (strpos($uri, '/pa-booking/v1/') === false) {
        return $result;
    }
    $nonce = isset($_SERVER['HTTP_X_WP_NONCE'])
        ? sanitize_text_field(wp_unslash($_SERVER['HTTP_X_WP_NONCE']))
        : '';
    if (wp_verify_nonce($nonce, 'pa_booking_request') || wp_verify_nonce($nonce, 'wp_rest')) {
        return null;
    }
    return $result;
}, 101);

add_filter('rest_post_dispatch', function ($response, $server, $request) {
    if (!($response instanceof WP_REST_Response)) {
        return $response;
    }
    $route = $request->get_route();
    if ($route === '/pa-booking/v1/availability') {
        $data = $response->get_data();
        if (is_array($data)) {
            $data['stripe_ready'] = true;
            $data['payment_provider'] = 'paylink';
            $data['paylink_url'] = PA_BOOKING_GODADDY_PAYLINK;
            $data['stripe_mode'] = '';
            $response->set_data($data);
        }
        return $response;
    }
    return $response;
}, 10, 3);

add_action('rest_api_init', function () {
    register_rest_route(
        'pa-booking/v1',
        '/session',
        array(
            'methods'             => 'GET',
            'permission_callback' => '__return_true',
            'callback'            => function () {
                return rest_ensure_response(
                    array(
                        'nonce'             => wp_create_nonce('pa_booking_request'),
                        'payments_ready'    => true,
                        'payment_provider'  => 'paylink',
                        'paylink_url'       => PA_BOOKING_GODADDY_PAYLINK,
                    )
                );
            },
        )
    );
}, 20);
