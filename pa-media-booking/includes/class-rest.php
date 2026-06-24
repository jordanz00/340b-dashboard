<?php
/**
 * REST API for calendar availability and booking requests.
 */

if (!defined('ABSPATH')) {
    exit;
}

class PA_Booking_REST {
    const NONCE_ACTION = 'pa_booking_request';

    public function __construct() {
        add_action('rest_api_init', array($this, 'routes'));
        add_filter('rest_authentication_errors', array($this, 'fix_logged_in_cookie_nonce'), 101);
    }

    /**
     * Logged-in WP users (e.g. admin testing /book/) hit "Cookie check failed" when
     * a cached page serves a stale wp_rest nonce. Accept our booking nonce instead.
     */
    public function fix_logged_in_cookie_nonce($result) {
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
        if (wp_verify_nonce($nonce, self::NONCE_ACTION) || wp_verify_nonce($nonce, 'wp_rest')) {
            return null;
        }
        return $result;
    }

    public function routes() {
        register_rest_route(
            'pa-booking/v1',
            '/availability',
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'availability'),
                'permission_callback' => '__return_true',
            )
        );

        register_rest_route(
            'pa-booking/v1',
            '/session',
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'session'),
                'permission_callback' => '__return_true',
            )
        );

        register_rest_route(
            'pa-booking/v1',
            '/request',
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'create_request'),
                'permission_callback' => '__return_true',
            )
        );

        register_rest_route(
            'pa-booking/v1',
            '/confirm-deposit',
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'confirm_deposit'),
                'permission_callback' => '__return_true',
            )
        );
    }

    public function session() {
        return rest_ensure_response(
            array(
                'nonce'            => wp_create_nonce(self::NONCE_ACTION),
                'payments_ready'   => PA_Booking::accepts_deposit_payments(),
                'payment_provider' => PA_Booking_Payments::provider(),
                'paylink_url'      => PA_Booking_Payments::paylink_configured() ? PA_Booking_Payments::paylink_url() : '',
            )
        );
    }

    public function availability(WP_REST_Request $request) {
        $month = sanitize_text_field($request->get_param('month') ?? '');
        if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
            $month = gmdate('Y-m');
        }

        $blocked = PA_Booking::get_blocked_dates();
        $booked = PA_Booking::get_confirmed_booked_dates();
        $unavailable = array_values(array_unique(array_merge($blocked, $booked)));

        $filtered = array();
        foreach ($unavailable as $d) {
            if (strpos($d, $month) === 0) {
                $filtered[] = $d;
            }
        }

        $settings = PA_Booking::get_settings();
        $services = array_filter(array_map('trim', explode("\n", $settings['services'])));

        return rest_ensure_response(
            array(
                'month'          => $month,
                'unavailable'    => $filtered,
                'deposit_usd'    => round($settings['deposit_cents'] / 100, 2),
                'deposit_per_day_usd' => round($settings['deposit_cents'] / 100, 2),
                'services'       => array_values($services),
                'service_packages' => PA_Booking_Service_Catalog::packages_for_services(array_values($services)),
                'addons'         => PA_Booking_Service_Catalog::addons(),
                'stripe_ready'      => PA_Booking::accepts_deposit_payments(),
                'payment_provider'  => PA_Booking_Payments::provider(),
                'paylink_url'       => PA_Booking_Payments::paylink_configured() ? PA_Booking_Payments::paylink_url() : '',
                'stripe_mode'       => PA_Booking_Stripe::mode(),
                'min_lead_hours' => max(0, (int) ($settings['min_lead_hours'] ?? 48)),
            )
        );
    }

    public function create_request(WP_REST_Request $request) {
        $nonce = sanitize_text_field($request->get_header('X-WP-Nonce') ?: '');
        if (!wp_verify_nonce($nonce, self::NONCE_ACTION) && !wp_verify_nonce($nonce, 'wp_rest')) {
            return new WP_Error('invalid_nonce', 'Session expired. Refresh and try again.', array('status' => 403));
        }

        $rate_key = 'pa_booking_req_' . md5(sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'] ?? 'unknown')));
        $hits = (int) get_transient($rate_key);
        if ($hits >= 8) {
            return new WP_Error('rate_limited', 'Too many booking attempts. Please wait a few minutes and try again.', array('status' => 429));
        }
        set_transient($rate_key, $hits + 1, 15 * MINUTE_IN_SECONDS);

        $date = sanitize_text_field($request->get_param('event_date') ?? '');
        $dates_raw = $request->get_param('event_dates');
        if (is_array($dates_raw)) {
            $event_dates = PA_Booking::sanitize_date_list($dates_raw);
        } elseif ($date) {
            $event_dates = PA_Booking::sanitize_date_list(array($date));
        } else {
            $event_dates = array();
        }

        $service = sanitize_text_field($request->get_param('service') ?? '');
        $name = sanitize_text_field($request->get_param('name') ?? '');
        $email = sanitize_email($request->get_param('email') ?? '');
        $phone = sanitize_text_field($request->get_param('phone') ?? '');
        $notes = sanitize_textarea_field($request->get_param('notes') ?? '');
        $event_type = sanitize_text_field($request->get_param('event_type') ?? '');
        $venue = sanitize_text_field($request->get_param('venue') ?? '');
        $organization = sanitize_text_field($request->get_param('organization') ?? '');
        $time_window = sanitize_text_field($request->get_param('time_window') ?? '');

        $allowed_types = array('Wedding', 'Corporate', 'Private party', 'Concert / Live', 'Other');
        $allowed_windows = array('Full day (9am – 11pm)', 'Morning (9am – 1pm)', 'Afternoon (1pm – 5pm)', 'Evening (5pm – 11pm)');

        $settings = PA_Booking::get_settings();
        $allowed = array_filter(array_map('trim', explode("\n", $settings['services'])));

        if (!$event_dates) {
            return new WP_Error('invalid_date', 'Please choose at least one date.', array('status' => 400));
        }

        if (!PA_Booking::are_dates_available($event_dates)) {
            return new WP_Error('date_unavailable', 'One or more selected dates are no longer available. Refresh and try again.', array('status' => 400));
        }
        if (!$service || !in_array($service, $allowed, true)) {
            return new WP_Error('invalid_service', 'Please choose a valid service.', array('status' => 400));
        }
        if (strlen($name) < 2 || strlen($name) > 120) {
            return new WP_Error('invalid_name', 'Please enter your name.', array('status' => 400));
        }
        if (!is_email($email)) {
            return new WP_Error('invalid_email', 'Please enter a valid email.', array('status' => 400));
        }
        if (strlen($phone) < 7 || strlen($phone) > 30) {
            return new WP_Error('invalid_phone', 'Please enter a phone number so we can reach you.', array('status' => 400));
        }
        if (!$event_type || !in_array($event_type, $allowed_types, true)) {
            return new WP_Error('invalid_event_type', 'Please choose an event type.', array('status' => 400));
        }
        if (!$time_window || !in_array($time_window, $allowed_windows, true)) {
            return new WP_Error('invalid_time_window', 'Please choose a time window.', array('status' => 400));
        }
        if (strlen($venue) < 2) {
            return new WP_Error('invalid_venue', 'Please enter the venue or city for your event.', array('status' => 400));
        }
        if (strlen($venue) > 200) {
            return new WP_Error('invalid_venue', 'Venue name is too long.', array('status' => 400));
        }
        if ($event_type === 'Corporate' && strlen($organization) < 2) {
            return new WP_Error('invalid_organization', 'Please enter your organization name.', array('status' => 400));
        }
        if (strlen($organization) > 200) {
            return new WP_Error('invalid_organization', 'Organization name is too long.', array('status' => 400));
        }
        if (strlen($notes) > 500) {
            return new WP_Error('invalid_notes', 'Notes must be 500 characters or less.', array('status' => 400));
        }

        $guest_count = sanitize_text_field($request->get_param('guest_count') ?? '');
        if (strlen($guest_count) > 80) {
            return new WP_Error('invalid_guest_count', 'Guest count note is too long.', array('status' => 400));
        }

        $terms_accepted = (bool) $request->get_param('terms_accepted');
        if (PA_Booking::accepts_deposit_payments() && !$terms_accepted) {
            return new WP_Error('terms_required', 'Please agree to the booking policies before continuing.', array('status' => 400));
        }

        $day_count = count($event_dates);
        $deposit_cents = PA_Booking::calculate_deposit_cents($day_count);
        $dates_label = PA_Booking::format_dates_label($event_dates);

        $booking_id = self::insert_booking_post($name . ' — ' . $dates_label);

        if (is_wp_error($booking_id)) {
            return $booking_id;
        }

        update_post_meta($booking_id, 'event_dates', wp_json_encode($event_dates));
        update_post_meta($booking_id, 'event_date', $event_dates[0]);
        update_post_meta($booking_id, 'day_count', $day_count);
        update_post_meta($booking_id, 'deposit_cents', $deposit_cents);
        update_post_meta($booking_id, 'service', $service);
        update_post_meta($booking_id, 'customer_name', $name);
        update_post_meta($booking_id, 'customer_email', $email);
        update_post_meta($booking_id, 'customer_phone', $phone);
        update_post_meta($booking_id, 'notes', $notes);
        update_post_meta($booking_id, 'event_type', $event_type);
        update_post_meta($booking_id, 'venue', $venue);
        if ($organization) {
            update_post_meta($booking_id, 'organization', $organization);
        }
        update_post_meta($booking_id, 'time_window', $time_window);
        if ($guest_count) {
            update_post_meta($booking_id, 'guest_count', $guest_count);
        }
        if ($terms_accepted) {
            update_post_meta($booking_id, 'terms_accepted_at', gmdate('c'));
        }

        $addons = $request->get_param('addons');
        if (is_array($addons)) {
            $sanitized_addons = self::sanitize_addons($addons, $service);
            if (!empty($sanitized_addons)) {
                update_post_meta($booking_id, 'booking_addons', wp_json_encode($sanitized_addons));
            }
        }

        $timeline_notes = sanitize_textarea_field($request->get_param('timeline_notes') ?? '');
        if (strlen($timeline_notes) > 500) {
            return new WP_Error('invalid_timeline', 'Timeline notes must be 500 characters or less.', array('status' => 400));
        }
        if ($timeline_notes) {
            update_post_meta($booking_id, 'timeline_notes', $timeline_notes);
        }

        $venue_access = sanitize_textarea_field($request->get_param('venue_access') ?? '');
        if (strlen($venue_access) > 500) {
            return new WP_Error('invalid_venue_access', 'Venue access notes must be 500 characters or less.', array('status' => 400));
        }
        if ($venue_access) {
            update_post_meta($booking_id, 'venue_access', $venue_access);
        }

        $deliverables_notes = sanitize_textarea_field($request->get_param('deliverables_notes') ?? '');
        if (strlen($deliverables_notes) > 500) {
            return new WP_Error('invalid_deliverables', 'Deliverables notes must be 500 characters or less.', array('status' => 400));
        }
        if ($deliverables_notes) {
            update_post_meta($booking_id, 'deliverables_notes', $deliverables_notes);
        }

        $estimate_cents = (int) $request->get_param('estimate_cents');
        if ($estimate_cents > 0) {
            update_post_meta($booking_id, 'estimate_cents', $estimate_cents);
        }

        if (!PA_Booking::accepts_deposit_payments()) {
            update_post_meta($booking_id, 'status', 'pending_approval');
            self::notify_admin_request($booking_id, false);
            PA_Booking_Emails::customer_request_received($booking_id, false);
            return rest_ensure_response(
                array(
                    'success_url' => add_query_arg('pa_requested', '1', get_permalink((int) PA_Booking::get_settings()['success_page']) ?: home_url('/booking-confirmed/')),
                    'booking_id'  => $booking_id,
                )
            );
        }

        $provider = PA_Booking_Payments::provider();

        update_post_meta($booking_id, 'status', 'pending_payment');

        $checkout = PA_Booking_Payments::checkout_for_booking($booking_id);
        if (is_wp_error($checkout)) {
            update_post_meta($booking_id, 'status', 'payment_failed');
            return $checkout;
        }

        update_post_meta($booking_id, 'payment_provider', $checkout['provider']);
        if (!empty($checkout['session_id'])) {
            update_post_meta($booking_id, 'stripe_session_id', $checkout['session_id']);
        }

        if ($checkout['provider'] === 'paylink') {
            self::notify_admin_request($booking_id, false, true);
            PA_Booking_Emails::customer_request_received($booking_id, true);
        }

        $success_url = PA_Booking::booking_success_url($booking_id, $email);

        return rest_ensure_response(
            array(
                'checkout_url'     => $checkout['url'],
                'booking_id'       => $booking_id,
                'payment_provider' => $checkout['provider'],
                'success_url'      => $success_url,
            )
        );
    }

    /**
     * Allow anonymous visitors to create booking posts via REST.
     *
     * @param string $title Post title.
     * @return int|WP_Error
     */
    private static function insert_booking_post($title) {
        $grant = static function ($allcaps) {
            $allcaps['edit_posts'] = true;
            $allcaps['publish_posts'] = true;
            return $allcaps;
        };
        add_filter('user_has_cap', $grant, 10, 1);

        $booking_id = wp_insert_post(
            array(
                'post_type'   => PA_Booking::CPT,
                'post_status' => 'publish',
                'post_title'  => $title,
            ),
            true
        );

        remove_filter('user_has_cap', $grant, 10);

        if (is_wp_error($booking_id)) {
            return new WP_Error('save_failed', 'Could not save request.', array('status' => 500));
        }
        if (!$booking_id) {
            return new WP_Error('save_failed', 'Could not save request.', array('status' => 500));
        }

        return (int) $booking_id;
    }

    private static function notify_admin_request($booking_id, $deposit_paid, $awaiting_paylink = false) {
        $s = PA_Booking::get_settings();
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
        $subject = $deposit_paid
            ? 'New booking request (deposit paid) — ' . $dates_label
            : ($awaiting_paylink
                ? 'New booking — client sent to GoDaddy pay link — ' . $dates_label
                : 'New booking request — ' . $dates_label);
        $body = $deposit_paid
            ? "Deposit paid.\n\n"
            : ($awaiting_paylink
                ? "Client was redirected to your GoDaddy Pay Link. Confirm payment in GoDaddy before approving.\n\n"
                : "Deposit not yet collected — confirm with client.\n\n");
        $body .= "Dates: {$dates_label}\nTime: {$time_window}\nService: {$service}\nEvent: {$event_type}\n";
        $body .= "Deposit: \${$deposit}\n";
        if ($venue) {
            $body .= "Venue: {$venue}\n";
        }
        $body .= "\nClient: {$name}\nEmail: {$email}\nPhone: {$phone}\n\nNotes:\n{$notes}\n\n";
        $body .= admin_url('admin.php?page=pa-booking');
        PA_Booking_Emails::send($s['notify_email'], $subject, $body);
    }

    /**
     * Validate add-on IDs against catalog for the selected service.
     *
     * @param array  $addon_ids
     * @param string $service
     * @return array<int, array{id:string,label:string,price_cents:int}>
     */
    private static function sanitize_addons($addon_ids, $service) {
        $allowed = PA_Booking_Service_Catalog::addons_for_service($service);
        $by_id = array();
        foreach ($allowed as $addon) {
            $by_id[$addon['id']] = $addon;
        }
        $out = array();
        foreach ($addon_ids as $raw_id) {
            $id = sanitize_key($raw_id);
            if ($id && isset($by_id[$id])) {
                $out[] = array(
                    'id'          => $id,
                    'label'       => $by_id[$id]['label'],
                    'price_cents' => (int) $by_id[$id]['price_cents'],
                );
            }
        }
        return $out;
    }

    /**
     * Client reports GoDaddy Pay Link deposit after redirect (no webhook available).
     */
    public function confirm_deposit(WP_REST_Request $request) {
        $nonce = sanitize_text_field($request->get_header('X-WP-Nonce') ?: '');
        if (!wp_verify_nonce($nonce, self::NONCE_ACTION) && !wp_verify_nonce($nonce, 'wp_rest')) {
            return new WP_Error('invalid_nonce', 'Session expired. Refresh and try again.', array('status' => 403));
        }

        $booking_id = (int) $request->get_param('booking_id');
        $email = sanitize_email($request->get_param('email') ?? '');
        if ($booking_id < 1 || !is_email($email)) {
            return new WP_Error('invalid_request', 'Invalid booking confirmation.', array('status' => 400));
        }

        $post = get_post($booking_id);
        if (!$post || $post->post_type !== PA_Booking::CPT) {
            return new WP_Error('not_found', 'Booking not found.', array('status' => 404));
        }

        $stored_email = get_post_meta($booking_id, 'customer_email', true);
        if (strcasecmp($stored_email, $email) !== 0) {
            return new WP_Error('forbidden', 'Email does not match this booking.', array('status' => 403));
        }

        $status = get_post_meta($booking_id, 'status', true);
        $provider = get_post_meta($booking_id, 'payment_provider', true);

        if ($status === 'approved' || $status === 'deposit_paid') {
            return rest_ensure_response(array('ok' => true, 'status' => $status, 'already' => true));
        }

        if ($provider !== 'paylink' || $status !== 'pending_payment') {
            return rest_ensure_response(array('ok' => true, 'status' => $status, 'skipped' => true));
        }

        if (!PA_Booking::report_paylink_deposit($booking_id)) {
            return rest_ensure_response(array('ok' => true, 'status' => $status, 'skipped' => true));
        }

        return rest_ensure_response(array('ok' => true, 'status' => 'pending_approval'));
    }

    /**
     * Admin alert when Pay Link deposit is reported (public for PA_Booking::report_paylink_deposit).
     */
    public static function notify_admin_deposit_paid($booking_id) {
        self::notify_admin_request($booking_id, true);
    }
}
