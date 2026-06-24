<?php
/**
 * Branded email copy for PA Media Arts booking notifications.
 * Plain text + HTML multipart for customer-facing messages.
 */

if (!defined('ABSPATH')) {
    exit;
}

class PA_Booking_Emails {
    public static function artist_name() {
        $s = PA_Booking::get_settings();
        return !empty($s['artist_name']) ? $s['artist_name'] : 'Pennsylvania Media Arts LLC';
    }

    public static function notify_email() {
        $s = PA_Booking::get_settings();
        return !empty($s['notify_email']) ? $s['notify_email'] : 'jordan@pamedia.art';
    }

    public static function signature() {
        $name = self::artist_name();
        $email = self::notify_email();
        return "\n\n— {$name}\n{$email}\nhttps://pamedia.art";
    }

    /**
     * Plain-text only (admin notifications).
     */
    public static function send($to, $subject, $body) {
        if (!is_email($to)) {
            return false;
        }
        wp_mail($to, $subject, rtrim($body) . self::signature());
        return true;
    }

    /**
     * Multipart plain + HTML for customers.
     *
     * @param string $html_inner Safe HTML for the email body (no html/head tags).
     */
    public static function send_branded($to, $subject, $plain_body, $html_inner) {
        if (!is_email($to)) {
            return false;
        }

        $plain = rtrim($plain_body) . self::signature();
        $html  = self::wrap_html($html_inner);
        $boundary = 'pa_' . wp_generate_password(16, false);

        $headers = array(
            'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
        );

        $message  = "--{$boundary}\r\n";
        $message .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
        $message .= $plain . "\r\n\r\n";
        $message .= "--{$boundary}\r\n";
        $message .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";
        $message .= $html . "\r\n\r\n";
        $message .= "--{$boundary}--";

        wp_mail($to, $subject, $message, $headers);
        return true;
    }

    /**
     * Wrap inner content in a minimal branded HTML shell.
     */
    public static function wrap_html($inner) {
        $name = esc_html(self::artist_name());
        $year = gmdate('Y');
        return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
            . '<body style="margin:0;padding:0;background:#f4f4f2;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;">'
            . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:32px 16px;">'
            . '<tr><td align="center">'
            . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e8e8e6;overflow:hidden;">'
            . '<tr><td style="padding:28px 28px 8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#525252;">' . $name . '</td></tr>'
            . '<tr><td style="padding:8px 28px 28px;font-size:16px;line-height:1.6;color:#0f0f0f;">' . $inner . '</td></tr>'
            . '<tr><td style="padding:16px 28px;background:#fafaf9;border-top:1px solid #ececea;font-size:12px;color:#737373;line-height:1.5;">'
            . esc_html(self::notify_email()) . ' · <a href="https://pamedia.art" style="color:#525252;">pamedia.art</a><br>© ' . $year . ' Pennsylvania Media Arts LLC'
            . '</td></tr></table></td></tr></table></body></html>';
    }

    /**
     * Customer: booking request received (before or after payment redirect).
     */
    public static function customer_request_received($booking_id, $awaiting_payment = false) {
        $email = get_post_meta($booking_id, 'customer_email', true);
        if (!is_email($email)) {
            return false;
        }

        $name          = get_post_meta($booking_id, 'customer_name', true);
        $service       = get_post_meta($booking_id, 'service', true);
        $time_window   = get_post_meta($booking_id, 'time_window', true);
        $venue         = get_post_meta($booking_id, 'venue', true);
        $event_dates   = PA_Booking::get_booking_event_dates($booking_id);
        $dates_label   = PA_Booking::format_dates_label($event_dates);
        $artist        = self::artist_name();

        $subject = $artist . ' — We received your booking request';

        $plain  = "Hi {$name},\n\n";
        $plain .= $awaiting_payment
            ? "Thank you. We received your booking details for {$dates_label}.\n"
            : "Thank you. Your booking request for {$dates_label} is in our queue.\n";
        $plain .= "\nService: {$service}\n";
        if ($time_window) {
            $plain .= "Time: {$time_window}\n";
        }
        if ($venue) {
            $plain .= "Location: {$venue}\n";
        }
        $plain .= "\nWhat happens next:\n";
        $plain .= "1. Today — Request received\n";
        $plain .= "2. Within one business day — Personal confirmation from {$artist}\n";
        $plain .= "3. Before your event — Pre-production call and final details\n";

        $html  = '<p style="margin:0 0 16px;">Hi <strong>' . esc_html($name) . '</strong>,</p>';
        $html .= '<p style="margin:0 0 20px;">Thank you. We received your booking'
            . ($awaiting_payment ? ' details' : ' request')
            . ' for <strong>' . esc_html($dates_label) . '</strong>.</p>';
        $html .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#f7f7f5;border-radius:12px;border:1px solid #ececea;">'
            . '<tr><td style="padding:16px 18px;font-size:15px;line-height:1.55;">'
            . '<strong style="display:block;margin-bottom:6px;">' . esc_html($service) . '</strong>'
            . esc_html($dates_label)
            . ($time_window ? '<br><span style="color:#525252;">' . esc_html($time_window) . '</span>' : '')
            . ($venue ? '<br><span style="color:#525252;">' . esc_html($venue) . '</span>' : '')
            . '</td></tr></table>';
        $html .= '<p style="margin:0 0 8px;font-weight:700;">What happens next</p>';
        $html .= '<ol style="margin:0;padding-left:20px;color:#525252;line-height:1.6;">'
            . '<li><strong style="color:#0f0f0f;">Today</strong> — Request received</li>'
            . '<li><strong style="color:#0f0f0f;">Within one business day</strong> — Confirmation from ' . esc_html($artist) . '</li>'
            . '<li><strong style="color:#0f0f0f;">Before your event</strong> — Pre-production and final details</li>'
            . '</ol>';

        return self::send_branded($email, $subject, $plain, $html);
    }

    /**
     * Customer: deposit confirmed.
     */
    public static function customer_deposit_received($booking_id) {
        $email = get_post_meta($booking_id, 'customer_email', true);
        if (!is_email($email)) {
            return false;
        }

        $name        = get_post_meta($booking_id, 'customer_name', true);
        $service     = get_post_meta($booking_id, 'service', true);
        $time_window = get_post_meta($booking_id, 'time_window', true);
        $venue       = get_post_meta($booking_id, 'venue', true);
        $event_dates = PA_Booking::get_booking_event_dates($booking_id);
        $dates_label = PA_Booking::format_dates_label($event_dates);
        $artist      = self::artist_name();
        $deposit_cents = (int) get_post_meta($booking_id, 'deposit_cents', true);
        if ($deposit_cents < 50) {
            $deposit_cents = PA_Booking::calculate_deposit_cents(count($event_dates));
        }
        $deposit = number_format($deposit_cents / 100, 2);

        $subject = $artist . ' — Deposit received for ' . $dates_label;

        $plain  = "Hi {$name},\n\n";
        $plain .= "Your \${$deposit} deposit for {$service} on {$dates_label} is confirmed. Your date is reserved while we finalize details.\n\n";
        if ($time_window) {
            $plain .= "Time: {$time_window}\n";
        }
        if ($venue) {
            $plain .= "Location: {$venue}\n";
        }
        $plain .= "\nWhat happens next:\n";
        $plain .= "1. Today — Deposit confirmed, dates reserved\n";
        $plain .= "2. Within one business day — Personal confirmation from {$artist}\n";
        $plain .= "3. Before your event — Pre-production call and remaining balance\n";

        $html  = '<p style="margin:0 0 16px;">Hi <strong>' . esc_html($name) . '</strong>,</p>';
        $html .= '<p style="margin:0 0 20px;">Your <strong>$' . esc_html($deposit) . ' deposit</strong> is confirmed. '
            . '<strong>' . esc_html($dates_label) . '</strong> is reserved while we finalize details.</p>';
        $html .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">'
            . '<tr><td style="padding:16px 18px;font-size:15px;line-height:1.55;">'
            . '<strong style="display:block;margin-bottom:6px;color:#166534;">Deposit received</strong>'
            . esc_html($service) . ' · ' . esc_html($dates_label)
            . '</td></tr></table>';
        $html .= '<p style="margin:0 0 8px;font-weight:700;">What happens next</p>';
        $html .= '<ol style="margin:0;padding-left:20px;color:#525252;line-height:1.6;">'
            . '<li><strong style="color:#0f0f0f;">Today</strong> — Deposit confirmed</li>'
            . '<li><strong style="color:#0f0f0f;">Within one business day</strong> — Confirmation from ' . esc_html($artist) . '</li>'
            . '<li><strong style="color:#0f0f0f;">Before your event</strong> — Pre-production and balance details</li>'
            . '</ol>';

        return self::send_branded($email, $subject, $plain, $html);
    }

    /**
     * Customer: booking approved or rejected (branded HTML).
     */
    public static function customer_status_update($booking_id, $status) {
        $email = get_post_meta($booking_id, 'customer_email', true);
        if (!is_email($email)) {
            return false;
        }

        $name        = get_post_meta($booking_id, 'customer_name', true);
        $service     = get_post_meta($booking_id, 'service', true);
        $dates_label = PA_Booking::format_dates_label(PA_Booking::get_booking_event_dates($booking_id));
        $artist      = self::artist_name();
        $approved    = $status === 'approved';

        $subject = $approved
            ? $artist . ' — Your date is confirmed'
            : $artist . ' — Booking update';

        if ($approved) {
            $plain = "Hi {$name},\n\nGreat news — your booking for {$service} on {$dates_label} is confirmed.\n\n"
                . "What happens next:\n1. We'll reach out within one business day with production details.\n"
                . "2. Remaining balance is due before your event.\n3. Reply anytime with questions or changes.\n";
            $html  = '<p style="margin:0 0 16px;">Hi <strong>' . esc_html($name) . '</strong>,</p>';
            $html .= '<p style="margin:0 0 20px;">Great news — your <strong>' . esc_html($service) . '</strong> booking on '
                . '<strong>' . esc_html($dates_label) . '</strong> is <strong>confirmed</strong>.</p>';
            $html .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">'
                . '<tr><td style="padding:16px 18px;font-size:15px;">'
                . '<strong style="color:#166534;">Confirmed</strong><br>' . esc_html($dates_label) . ' · ' . esc_html($service)
                . '</td></tr></table>';
            $html .= '<p style="margin:0;font-size:15px;line-height:1.6;color:#525252;">We will follow up within one business day with production details and balance information.</p>';
        } else {
            $plain = "Hi {$name},\n\nThank you for your interest. We are unable to accommodate {$service} on {$dates_label}.\n\n"
                . "If a deposit was collected, we will refund it per our booking policy.\n";
            $html  = '<p style="margin:0 0 16px;">Hi <strong>' . esc_html($name) . '</strong>,</p>';
            $html .= '<p style="margin:0 0 16px;">Thank you for your interest in working together. We are unable to accommodate '
                . '<strong>' . esc_html($service) . '</strong> on <strong>' . esc_html($dates_label) . '</strong>.</p>';
            $html .= '<p style="margin:0;font-size:15px;line-height:1.6;color:#525252;">If a deposit was collected, we will refund it per our booking policy. Reply to this email with any questions.</p>';
        }

        return self::send_branded($email, $subject, $plain, $html);
    }
}
