<?php
/**
 * Deposit checkout — GoDaddy Pay Link (preferred) or Stripe fallback.
 */

if (!defined('ABSPATH')) {
    exit;
}

class PA_Booking_Payments {
    const DEFAULT_PAYLINK = 'https://b094a6f2-7079-462c-92ee-3f8571bf9abe.paylinks.godaddy.com/0a5295d9-cecb-425f-b4db-ecf';

    /**
     * @return 'none'|'paylink'|'stripe'
     */
    public static function provider() {
        $s = PA_Booking::get_settings();
        if (empty($s['deposit_payments_enabled'])) {
            return 'none';
        }
        if (self::paylink_configured()) {
            return 'paylink';
        }
        if (PA_Booking_Stripe::is_configured()) {
            return 'stripe';
        }
        return 'none';
    }

    public static function paylink_configured() {
        $url = trim((string) (PA_Booking::get_settings()['paylink_url'] ?? ''));
        return $url !== '' && (bool) wp_http_validate_url($url);
    }

    public static function paylink_url() {
        return esc_url_raw(trim((string) (PA_Booking::get_settings()['paylink_url'] ?? '')));
    }

    /**
     * Pay link URLs keyed by day count (1 = default link).
     * Each GoDaddy link must use a fixed price matching deposit_per_day × days.
     *
     * @return array<string, string>
     */
    public static function paylink_tier_urls() {
        $s = PA_Booking::get_settings();
        $tiers = array();
        $default = self::paylink_url();
        if ($default !== '') {
            $tiers['1'] = $default;
        }
        $extra = isset($s['paylink_tier_urls']) && is_array($s['paylink_tier_urls'])
            ? $s['paylink_tier_urls']
            : array();
        foreach ($extra as $days => $url) {
            $days = (string) max(2, (int) $days);
            $url = esc_url_raw(trim((string) $url));
            if ($url !== '' && wp_http_validate_url($url)) {
                $tiers[$days] = $url;
            }
        }
        return $tiers;
    }

    /**
     * Pick the GoDaddy Pay Link for a deposit total (fixed-price links only).
     */
    public static function paylink_url_for_days($day_count) {
        $days = max(1, (int) $day_count);
        $tiers = self::paylink_tier_urls();
        if (isset($tiers[(string) $days])) {
            return $tiers[(string) $days];
        }
        return self::paylink_url();
    }

    public static function paylink_url_for_deposit_cents($deposit_cents) {
        $per_day = max(50, (int) (PA_Booking::get_settings()['deposit_cents'] ?? 15000));
        $days = max(1, (int) round($deposit_cents / $per_day));
        return self::paylink_url_for_days($days);
    }

    /**
     * Where GoDaddy Pay Link should send customers after a successful deposit.
     */
    public static function deposit_return_url() {
        $success_id = (int) (PA_Booking::get_settings()['success_page'] ?? 0);
        $success = $success_id ? get_permalink($success_id) : home_url('/booking-confirmed/');
        return add_query_arg('pa_requested', '1', $success);
    }

    /**
     * @return array{url:string,session_id:string,provider:string}|WP_Error
     */
    public static function checkout_for_booking($booking_id) {
        $provider = self::provider();
        if ($provider === 'paylink') {
            $dates = PA_Booking::get_booking_event_dates($booking_id);
            $deposit_cents = (int) get_post_meta($booking_id, 'deposit_cents', true);
            if ($deposit_cents < 50) {
                $deposit_cents = PA_Booking::calculate_deposit_cents(count($dates));
            }
            return array(
                'url'        => self::paylink_url_for_deposit_cents($deposit_cents),
                'session_id' => '',
                'provider'   => 'paylink',
            );
        }
        if ($provider === 'stripe') {
            $checkout = PA_Booking_Stripe::create_checkout_session($booking_id);
            if (is_wp_error($checkout)) {
                return $checkout;
            }
            return array_merge($checkout, array('provider' => 'stripe'));
        }
        return new WP_Error('no_payment', 'Payments not configured.', array('status' => 502));
    }
}
