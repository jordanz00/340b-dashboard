<?php
/**
 * Stripe Checkout — pay deposit, no booking SaaS fee.
 */

if (!defined('ABSPATH')) {
    exit;
}

class PA_Booking_Stripe {
    public static function is_configured() {
        $s = PA_Booking::get_settings();
        return self::keys_valid($s['stripe_pk'] ?? '', $s['stripe_sk'] ?? '') && ($s['deposit_cents'] ?? 0) >= 50;
    }

    /**
     * @return 'live'|'test'|''
     */
    public static function mode() {
        $s = PA_Booking::get_settings();
        $pk = $s['stripe_pk'] ?? '';
        if (strpos($pk, 'pk_live_') === 0) {
            return 'live';
        }
        if (strpos($pk, 'pk_test_') === 0) {
            return 'test';
        }
        return '';
    }

    /**
     * Ensure publishable + secret keys match and use valid Stripe prefixes.
     */
    public static function keys_valid($pk, $sk) {
        $pk = trim((string) $pk);
        $sk = trim((string) $sk);
        if ($pk === '' || $sk === '') {
            return false;
        }
        $live = strpos($pk, 'pk_live_') === 0 && strpos($sk, 'sk_live_') === 0;
        $test = strpos($pk, 'pk_test_') === 0 && strpos($sk, 'sk_test_') === 0;
        return $live || $test;
    }

    public static function cancel_url() {
        $book = get_page_by_path('book');
        $base = ($book && $book->post_status === 'publish') ? get_permalink($book) : home_url('/book/');
        return add_query_arg('checkout', 'cancelled', $base);
    }

    public static function success_url() {
        $s = PA_Booking::get_settings();
        $page_id = (int) $s['success_page'];
        if ($page_id > 0) {
            $url = get_permalink($page_id);
            if ($url) {
                return add_query_arg('session_id', '{CHECKOUT_SESSION_ID}', $url);
            }
        }
        return add_query_arg('pa_booking_success', '1', home_url('/'));
    }

    /**
     * @return array{session_id:string,url:string}|WP_Error
     */
    public static function create_checkout_session($booking_id) {
        $s = PA_Booking::get_settings();
        $event_dates = PA_Booking::get_booking_event_dates($booking_id);
        $dates_label = PA_Booking::format_dates_label($event_dates);
        $service = get_post_meta($booking_id, 'service', true);
        $deposit_cents = (int) get_post_meta($booking_id, 'deposit_cents', true);
        if ($deposit_cents < 50) {
            $deposit_cents = PA_Booking::calculate_deposit_cents(count($event_dates));
        }

        $body = array(
            'mode'                                   => 'payment',
            'success_url'                            => self::success_url(),
            'cancel_url'                             => self::cancel_url(),
            'client_reference_id'                    => (string) $booking_id,
            'customer_email'                         => get_post_meta($booking_id, 'customer_email', true),
            'payment_method_types[0]'                => 'card',
            'payment_method_types[1]'                => 'link',
            'submit_type'                            => 'book',
            'custom_text[submit][message]'           => 'Deposit secures your date and applies to your event total.',
            'custom_text[after_submit][message]'     => 'PA Media Arts will confirm within one business day.',
            'phone_number_collection[enabled]'       => 'true',
            'billing_address_collection'             => 'auto',
            'line_items[0][quantity]'                => 1,
            'line_items[0][price_data][currency]'    => 'usd',
            'line_items[0][price_data][unit_amount]' => $deposit_cents,
            'line_items[0][price_data][product_data][name]' => 'Booking deposit — ' . $service,
            'line_items[0][price_data][product_data][description]' => $dates_label,
            'metadata[booking_id]'                   => (string) $booking_id,
        );

        $response = wp_remote_post(
            'https://api.stripe.com/v1/checkout/sessions',
            array(
                'timeout' => 12,
                'headers' => array(
                    'Authorization' => 'Bearer ' . $s['stripe_sk'],
                ),
                'body'    => $body,
            )
        );

        if (is_wp_error($response)) {
            return new WP_Error('stripe_error', 'Payment service unavailable. Try again shortly.', array('status' => 502));
        }

        $code = wp_remote_retrieve_response_code($response);
        $raw = json_decode(wp_remote_retrieve_body($response), true);

        if ($code < 200 || $code >= 300 || empty($raw['id']) || empty($raw['url'])) {
            $msg = isset($raw['error']['message']) ? $raw['error']['message'] : 'Payment could not be started.';
            return new WP_Error('stripe_error', $msg, array('status' => 502));
        }

        return array(
            'session_id' => $raw['id'],
            'url'        => $raw['url'],
        );
    }

    /**
     * Verify session after redirect and mark booking paid.
     *
     * @return true|WP_Error
     */
    public static function complete_session($session_id) {
        $session_id = sanitize_text_field($session_id);
        if (!preg_match('/^cs_/', $session_id)) {
            return new WP_Error('invalid_session', 'Invalid payment session.');
        }

        $s = PA_Booking::get_settings();
        $response = wp_remote_get(
            'https://api.stripe.com/v1/checkout/sessions/' . rawurlencode($session_id),
            array(
                'timeout' => 20,
                'headers' => array(
                    'Authorization' => 'Bearer ' . $s['stripe_sk'],
                ),
            )
        );

        if (is_wp_error($response)) {
            return $response;
        }

        $raw = json_decode(wp_remote_retrieve_body($response), true);
        if (empty($raw['payment_status']) || $raw['payment_status'] !== 'paid') {
            return new WP_Error('not_paid', 'Payment not completed.');
        }

        $booking_id = 0;
        if (!empty($raw['metadata']['booking_id'])) {
            $booking_id = absint($raw['metadata']['booking_id']);
        } elseif (!empty($raw['client_reference_id'])) {
            $booking_id = absint($raw['client_reference_id']);
        }

        if (!$booking_id) {
            return new WP_Error('no_booking', 'Booking not found.');
        }

        $status = get_post_meta($booking_id, 'status', true);
        if ($status === 'pending_approval' || $status === 'approved') {
            return true;
        }

        update_post_meta($booking_id, 'status', 'pending_approval');
        update_post_meta($booking_id, 'stripe_session_id', $session_id);
        if (!empty($raw['payment_intent'])) {
            update_post_meta($booking_id, 'stripe_payment_intent', sanitize_text_field($raw['payment_intent']));
        }
        update_post_meta($booking_id, 'deposit_paid_at', gmdate('c'));

        self::notify_admin($booking_id);
        self::notify_customer_paid($booking_id);

        return true;
    }

    private static function notify_customer_paid($booking_id) {
        $email = get_post_meta($booking_id, 'customer_email', true);
        if (!is_email($email)) {
            return;
        }
        PA_Booking_Emails::customer_deposit_received($booking_id);
    }

    private static function notify_admin($booking_id) {
        $s = PA_Booking::get_settings();
        $to = $s['notify_email'];
        $event_dates = PA_Booking::get_booking_event_dates($booking_id);
        $dates_label = PA_Booking::format_dates_label($event_dates);
        $service = get_post_meta($booking_id, 'service', true);
        $name = get_post_meta($booking_id, 'customer_name', true);
        $email = get_post_meta($booking_id, 'customer_email', true);
        $phone = get_post_meta($booking_id, 'customer_phone', true);
        $notes = get_post_meta($booking_id, 'notes', true);
        $event_type = get_post_meta($booking_id, 'event_type', true);
        $venue = get_post_meta($booking_id, 'venue', true);
        $time_window = get_post_meta($booking_id, 'time_window', true);
        $deposit_cents = (int) get_post_meta($booking_id, 'deposit_cents', true);
        if ($deposit_cents < 50) {
            $deposit_cents = PA_Booking::calculate_deposit_cents(count($event_dates));
        }
        $deposit = number_format($deposit_cents / 100, 2);

        $subject = 'New gig request (deposit paid) — ' . $dates_label;
        $body = "Deposit paid — approve or reject in WP Admin.\n\n";
        $body .= "Dates: {$dates_label}\nTime: {$time_window}\nService: {$service}\nEvent: {$event_type}\n";
        if ($venue) {
            $body .= "Venue: {$venue}\n";
        }
        $body .= "Deposit: \${$deposit}\n\n";
        $body .= "Client: {$name}\nEmail: {$email}\nPhone: {$phone}\n\nNotes:\n{$notes}\n\n";
        $body .= admin_url('admin.php?page=pa-booking');
        PA_Booking_Emails::send($to, $subject, $body);
    }
}
