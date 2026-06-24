<?php
/**
 * Core plugin bootstrap.
 */

if (!defined('ABSPATH')) {
    exit;
}

require_once PA_BOOKING_PATH . 'includes/class-emails.php';
require_once PA_BOOKING_PATH . 'includes/class-service-catalog.php';
require_once PA_BOOKING_PATH . 'includes/class-legal-pages.php';
require_once PA_BOOKING_PATH . 'includes/class-admin.php';
require_once PA_BOOKING_PATH . 'includes/class-frontend.php';
require_once PA_BOOKING_PATH . 'includes/class-youtube.php';
require_once PA_BOOKING_PATH . 'includes/class-rest.php';
require_once PA_BOOKING_PATH . 'includes/class-stripe.php';
$pa_payments_file = PA_BOOKING_PATH . 'includes/class-payments.php';
if (is_readable($pa_payments_file)) {
    require_once $pa_payments_file;
} elseif (!class_exists('PA_Booking_Payments', false)) {
    class PA_Booking_Payments {
        const DEFAULT_PAYLINK = 'https://b094a6f2-7079-462c-92ee-3f8571bf9abe.paylinks.godaddy.com/0a5295d9-cecb-425f-b4db-ecf';

        public static function provider() {
            return 'none';
        }

        public static function paylink_configured() {
            return false;
        }

        public static function paylink_url() {
            return '';
        }

        public static function checkout_for_booking($booking_id) {
            return new WP_Error('no_payment', 'Payments not configured.', array('status' => 502));
        }
    }
}

class PA_Booking {
    const CPT = 'pa_booking';
    const OPTION_BLOCKED = 'pa_booking_blocked_dates';
    const OPTION_SETTINGS = 'pa_booking_settings';

    /** @var PA_Booking|null */
    private static $instance = null;

    public static function instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('init', array($this, 'register_cpt'));
        add_action('init', array($this, 'register_page_rewrites'), 11);
        add_action('init', array('PA_Booking_Setup', 'boot_public_pages'), 20);
        add_action('template_redirect', array('PA_Booking_Setup', 'rescue_book_404'), 1);
        add_action('admin_notices', array('PA_Booking_Setup', 'admin_notice'));
        new PA_Booking_Admin();
        new PA_Booking_Frontend();
        new PA_Booking_REST();
    }

    /**
     * Explicit rewrite rules so /book/ resolves even if permalinks were stale.
     */
    public function register_page_rewrites() {
        add_rewrite_rule('^book/?$', 'index.php?pagename=book', 'top');
        add_rewrite_rule('^booking-confirmed/?$', 'index.php?pagename=booking-confirmed', 'top');
        add_rewrite_rule('^booking-status/?$', 'index.php?pagename=booking-status', 'top');
    }

    public static function on_activate() {
        $tmp = new self();
        $tmp->register_cpt();
        PA_Booking_Setup::run();
    }

    public function register_cpt() {
        register_post_type(
            self::CPT,
            array(
                'labels' => array(
                    'name'          => 'Booking Requests',
                    'singular_name' => 'Booking Request',
                ),
                'public'       => false,
                'show_ui'      => false,
                'supports'     => array('title'),
                'capability_type' => 'post',
            )
        );
    }

    public static function get_settings() {
        $defaults = array(
            'artist_name'    => 'Pennsylvania Media Arts LLC',
            'tagline'        => 'Event photography, video, and live production across Pennsylvania.',
            'phone'          => '',
            'travel_area'    => 'Central PA and surrounding counties',
            'notify_email'   => 'jordan@pamedia.art',
            'deposit_cents'  => 15000,
            'stripe_pk'      => '',
            'stripe_sk'      => '',
            'success_page'   => 0,
            'services'       => "Event Photography\nVideo Production\nLive Audio / PA\nDJ Services\nPhoto + Video Bundle",
            'min_lead_hours' => 48,
            'policy_deposit' => 'Your deposit holds your date on the calendar and applies toward your final balance.',
            'policy_cancel'  => 'If we cannot accommodate your request, your deposit is refunded. Cancellations within 14 days of your event may forfeit the deposit — we will confirm in writing.',
            'policy_travel'  => 'Travel outside Central PA may include a mileage fee — we will quote before you pay the remaining balance.',
            'about_paragraphs' => array(),
            'deposit_payments_enabled' => true,
            'paylink_url'            => PA_Booking_Payments::DEFAULT_PAYLINK,
            'paylink_tier_urls'      => array(),
        );
        $saved = get_option(self::OPTION_SETTINGS, array());
        if (!is_array($saved)) {
            $saved = array();
        }
        $merged = array_merge($defaults, $saved);
        $legacy_taglines = array(
            'Independent photo, video & live production · Central Pennsylvania',
            'Event photography, video, and live production across Central Pennsylvania.',
        );
        if (empty($merged['tagline']) || in_array($merged['tagline'], $legacy_taglines, true)) {
            $merged['tagline'] = $defaults['tagline'];
        }
        $stored_phone_digits = preg_replace('/\D/', '', (string) ($merged['phone'] ?? ''));
        if ($stored_phone_digits === '8148539451') {
            $merged['phone'] = '';
            if (!empty($saved['phone'])) {
                $saved['phone'] = '';
                update_option(self::OPTION_SETTINGS, array_merge($defaults, $saved, array('phone' => '')));
            }
        }
        if (defined('PA_BOOKING_STRIPE_PK') && PA_BOOKING_STRIPE_PK) {
            $merged['stripe_pk'] = PA_BOOKING_STRIPE_PK;
        }
        if (defined('PA_BOOKING_STRIPE_SK') && PA_BOOKING_STRIPE_SK) {
            $merged['stripe_sk'] = PA_BOOKING_STRIPE_SK;
        }
        return $merged;
    }

    /**
     * Footer / About copy shown on the public site.
     */
    public static function about_paragraphs($settings = null) {
        if ($settings === null) {
            $settings = self::get_settings();
        }
        $custom = $settings['about_paragraphs'] ?? array();
        if (is_array($custom)) {
            $custom = array_values(array_filter(array_map(function ($line) {
                return trim(wp_strip_all_tags((string) $line));
            }, $custom)));
            if ($custom) {
                return $custom;
            }
        }

        return array(
            'For more than 15 years, Pennsylvania Media Arts has produced live events and creative work across Central Pennsylvania — from corporate gatherings and concerts to weddings and brand campaigns.',
            'We unite photography, video, live sound, and design under one team — delivering work that looks polished, sounds professional, and leaves a lasting impression. Clear communication, reliable execution, and quality you can count on.',
            'Nominated for Best Videography at the 2026 Central Pennsylvania Music Awards (CPMAs), hosted by the Central Pennsylvania Music Hall of Fame.',
        );
    }

    /**
     * Whether customers pay a deposit at checkout (GoDaddy Pay Link or Stripe).
     */
    public static function accepts_deposit_payments() {
        return PA_Booking_Payments::provider() !== 'none';
    }

    public static function get_blocked_dates() {
        $dates = get_option(self::OPTION_BLOCKED, array());
        return is_array($dates) ? array_values(array_unique(array_map('sanitize_text_field', $dates))) : array();
    }

    public static function set_blocked_dates($dates) {
        $clean = array();
        foreach ((array) $dates as $d) {
            $d = sanitize_text_field($d);
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $d)) {
                $clean[] = $d;
            }
        }
        update_option(self::OPTION_BLOCKED, array_values(array_unique($clean)));
    }

    /**
     * Sanitize and validate a list of Y-m-d date strings.
     *
     * @param mixed $dates Raw date list from request or meta.
     * @return string[]
     */
    public static function sanitize_date_list($dates) {
        $clean = array();
        foreach ((array) $dates as $d) {
            $d = sanitize_text_field((string) $d);
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $d)) {
                $clean[] = $d;
            }
        }
        $clean = array_values(array_unique($clean));
        sort($clean);
        return $clean;
    }

    /**
     * All event dates stored on a booking (multi-day aware).
     *
     * @param int $booking_id Booking post ID.
     * @return string[]
     */
    public static function get_booking_event_dates($booking_id) {
        $json = get_post_meta($booking_id, 'event_dates', true);
        if (is_string($json) && $json !== '') {
            $decoded = json_decode($json, true);
            if (is_array($decoded)) {
                $dates = self::sanitize_date_list($decoded);
                if ($dates) {
                    return $dates;
                }
            }
        }
        $single = get_post_meta($booking_id, 'event_date', true);
        return $single ? array(sanitize_text_field($single)) : array();
    }

    /**
     * Deposit total in cents for a number of booked days.
     *
     * @param int $day_count Number of selected days (minimum 1).
     * @return int
     */
    public static function calculate_deposit_cents($day_count) {
        $settings = self::get_settings();
        $days = max(1, (int) $day_count);
        return max(50, (int) $settings['deposit_cents'] * $days);
    }

    /**
     * Human-readable date list for emails and Stripe.
     *
     * @param string[] $dates ISO date strings.
     * @return string
     */
    public static function format_dates_label($dates) {
        $dates = self::sanitize_date_list($dates);
        if (!$dates) {
            return '';
        }
        if (count($dates) === 1) {
            return $dates[0];
        }
        return $dates[0] . ' – ' . $dates[ count($dates) - 1 ] . ' (' . count($dates) . ' days)';
    }

    /**
     * Whether every date in the list is still bookable.
     *
     * @param mixed $dates Date strings.
     * @return bool
     */
    public static function are_dates_available($dates) {
        $list = self::sanitize_date_list($dates);
        if (!$list) {
            return false;
        }
        foreach ($list as $date) {
            if (!self::is_date_available($date)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Dates that hold the public calendar (customer cannot select).
     * Only manually blocked dates and admin-approved bookings count.
     *
     * @return string[]
     */
    public static function get_customer_unavailable_dates() {
        return array_values(array_unique(array_merge(
            self::get_blocked_dates(),
            self::get_confirmed_booked_dates()
        )));
    }

    /**
     * Event dates from bookings you have approved (confirmed gigs).
     *
     * @return string[]
     */
    public static function get_confirmed_booked_dates() {
        $q = new WP_Query(
            array(
                'post_type'      => self::CPT,
                'post_status'    => 'publish',
                'posts_per_page' => -1,
                'fields'         => 'ids',
                'meta_query'     => array(
                    array(
                        'key'     => 'status',
                        'value'   => 'approved',
                        'compare' => '=',
                    ),
                ),
            )
        );
        $dates = array();
        foreach ($q->posts as $id) {
            foreach (self::get_booking_event_dates($id) as $date) {
                $dates[] = $date;
            }
        }
        return array_values(array_unique($dates));
    }

    /**
     * @deprecated Use get_confirmed_booked_dates() for calendar holds.
     * @return string[]
     */
    public static function get_booked_dates() {
        return self::get_confirmed_booked_dates();
    }

    public static function is_date_available($date) {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return false;
        }
        if (in_array($date, self::get_blocked_dates(), true)) {
            return false;
        }
        if (in_array($date, self::get_confirmed_booked_dates(), true)) {
            return false;
        }
        $today = gmdate('Y-m-d');
        if ($date < $today) {
            return false;
        }
        $settings = self::get_settings();
        $hours = max(0, (int) ($settings['min_lead_hours'] ?? 48));
        if ($hours > 0) {
            $cutoff = gmdate('Y-m-d', time() + ($hours * HOUR_IN_SECONDS));
            if ($date < $cutoff) {
                return false;
            }
        }
        return true;
    }

    /**
     * Count bookings awaiting artist approval.
     */
    public static function count_pending_approval() {
        $q = new WP_Query(
            array(
                'post_type'      => self::CPT,
                'post_status'    => 'publish',
                'posts_per_page' => 1,
                'fields'         => 'ids',
                'meta_query'     => array(
                    array(
                        'key'     => 'status',
                        'value'   => 'pending_approval',
                        'compare' => '=',
                    ),
                ),
            )
        );
        return (int) $q->found_posts;
    }

    /**
     * Sum deposit cents collected on paid bookings.
     */
    public static function sum_deposits_collected() {
        $total = 0;
        $posts = get_posts(
            array(
                'post_type'      => self::CPT,
                'post_status'    => 'publish',
                'posts_per_page' => -1,
                'fields'         => 'ids',
                'meta_query'     => array(
                    array(
                        'key'     => 'status',
                        'value'   => array('pending_approval', 'approved'),
                        'compare' => 'IN',
                    ),
                ),
            )
        );
        foreach ($posts as $id) {
            $cents = (int) get_post_meta($id, 'deposit_cents', true);
            if ($cents >= 50) {
                $total += $cents;
            }
        }
        return $total;
    }

    /**
     * HMAC token for success-page deposit confirmation (Pay Link return).
     */
    public static function booking_confirm_token($booking_id, $email) {
        $payload = (string) (int) $booking_id . '|' . strtolower(trim((string) $email));
        return hash_hmac('sha256', $payload, wp_salt('pa_booking_confirm'));
    }

    /**
     * Mark GoDaddy Pay Link deposit as reported when client returns from checkout.
     *
     * @return bool True if deposit was newly recorded.
     */
    public static function report_paylink_deposit($booking_id) {
        $booking_id = (int) $booking_id;
        if ($booking_id < 1) {
            return false;
        }
        $status = get_post_meta($booking_id, 'status', true);
        $provider = get_post_meta($booking_id, 'payment_provider', true);
        if ($status === 'approved' || $status === 'pending_approval') {
            return true;
        }
        if ($provider !== 'paylink' || $status !== 'pending_payment') {
            return false;
        }
        update_post_meta($booking_id, 'status', 'pending_approval');
        update_post_meta($booking_id, 'deposit_reported_at', gmdate('c'));
        PA_Booking_Emails::customer_deposit_received($booking_id);
        PA_Booking_REST::notify_admin_deposit_paid($booking_id);
        return true;
    }

    /**
     * Success page URL with signed booking reference.
     */
    public static function booking_success_url($booking_id, $email) {
        $success_id = (int) (self::get_settings()['success_page'] ?? 0);
        $base = $success_id ? get_permalink($success_id) : home_url('/booking-confirmed/');
        return add_query_arg(
            array(
                'pa_requested' => '1',
                'pa_booking'   => (int) $booking_id,
                'pa_token'     => self::booking_confirm_token($booking_id, $email),
            ),
            $base
        );
    }
}
