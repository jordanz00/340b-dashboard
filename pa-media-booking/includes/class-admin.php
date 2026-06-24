<?php
/**
 * WP Admin: settings, block dates, approve bookings.
 */

if (!defined('ABSPATH')) {
    exit;
}

class PA_Booking_Admin {
    public function __construct() {
        add_action('admin_menu', array($this, 'menu'));
        add_action('admin_menu', array($this, 'menu_badge'), 999);
        add_action('admin_init', array($this, 'handle_actions'));
        add_action('admin_enqueue_scripts', array($this, 'assets'));
        add_action('add_meta_boxes', array($this, 'register_meta_boxes'));
    }

    public function register_meta_boxes() {
        add_meta_box(
            'pa_booking_details',
            'Booking details',
            array($this, 'render_booking_meta_box'),
            PA_Booking::CPT,
            'normal',
            'high'
        );
    }

    public function render_booking_meta_box($post) {
        $id = (int) $post->ID;
        $fields = array(
            'Status'        => get_post_meta($id, 'status', true),
            'Service'       => get_post_meta($id, 'service', true),
            'Dates'         => PA_Booking::format_dates_label(PA_Booking::get_booking_event_dates($id)),
            'Time'          => get_post_meta($id, 'time_window', true),
            'Event type'    => get_post_meta($id, 'event_type', true),
            'Venue'         => get_post_meta($id, 'venue', true),
            'Client'        => get_post_meta($id, 'customer_name', true),
            'Email'         => get_post_meta($id, 'customer_email', true),
            'Phone'         => get_post_meta($id, 'customer_phone', true),
            'Guests'        => get_post_meta($id, 'guest_count', true),
            'Deposit'       => '$' . number_format(((int) get_post_meta($id, 'deposit_cents', true)) / 100, 2),
            'Estimate'      => get_post_meta($id, 'estimate_cents', true) ? '$' . number_format(((int) get_post_meta($id, 'estimate_cents', true)) / 100, 2) : '',
            'Timeline'      => get_post_meta($id, 'timeline_notes', true),
            'Venue access'  => get_post_meta($id, 'venue_access', true),
            'Deliverables'  => get_post_meta($id, 'deliverables_notes', true),
            'Notes'         => get_post_meta($id, 'notes', true),
        );
        echo '<table class="widefat striped"><tbody>';
        foreach ($fields as $label => $value) {
            if ($value === '' || $value === null) {
                continue;
            }
            echo '<tr><th style="width:140px;">' . esc_html($label) . '</th><td>' . esc_html((string) $value) . '</td></tr>';
        }
        $addons_raw = get_post_meta($id, 'booking_addons', true);
        if ($addons_raw) {
            $addons = json_decode($addons_raw, true);
            if (is_array($addons) && $addons) {
                $lines = array();
                foreach ($addons as $addon) {
                    if (!empty($addon['label'])) {
                        $lines[] = $addon['label'];
                    }
                }
                if ($lines) {
                    echo '<tr><th>Add-ons</th><td>' . esc_html(implode(', ', $lines)) . '</td></tr>';
                }
            }
        }
        echo '</tbody></table>';
    }

    public function menu_badge() {
        global $menu;
        $count = PA_Booking::count_pending_approval();
        if (!$count) {
            return;
        }
        foreach ($menu as $key => $item) {
            if (isset($item[2]) && $item[2] === 'pa-booking') {
                $menu[ $key ][0] .= ' <span class="awaiting-mod count-' . (int) $count . '"><span class="pending-count">' . (int) $count . '</span></span>';
                break;
            }
        }
    }

    public function menu() {
        add_menu_page(
            'PA Booking',
            'PA Booking',
            'manage_options',
            'pa-booking',
            array($this, 'render_dashboard'),
            'dashicons-calendar-alt',
            26
        );
        add_submenu_page('pa-booking', 'Settings', 'Settings', 'manage_options', 'pa-booking-settings', array($this, 'render_settings'));
        add_submenu_page('pa-booking', 'Block Dates', 'Block Dates', 'manage_options', 'pa-booking-dates', array($this, 'render_dates'));
    }

    public function assets($hook) {
        if (strpos($hook, 'pa-booking') === false) {
            return;
        }
        wp_enqueue_style('pa-booking-admin', PA_BOOKING_URL . 'assets/admin.css', array(), PA_BOOKING_VERSION);
    }

    public function handle_actions() {
        if (!current_user_can('manage_options')) {
            return;
        }

        if (isset($_POST['pa_booking_settings_nonce']) && wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['pa_booking_settings_nonce'])), 'pa_booking_settings')) {
            $deposit = isset($_POST['deposit_dollars']) ? floatval($_POST['deposit_dollars']) : 150;
            $settings = array(
                'artist_name'   => sanitize_text_field(wp_unslash($_POST['artist_name'] ?? '')),
                'tagline'       => sanitize_text_field(wp_unslash($_POST['tagline'] ?? '')),
                'phone'         => sanitize_text_field(wp_unslash($_POST['phone'] ?? '')),
                'travel_area'   => sanitize_text_field(wp_unslash($_POST['travel_area'] ?? '')),
                'policy_deposit'=> sanitize_textarea_field(wp_unslash($_POST['policy_deposit'] ?? '')),
                'policy_cancel' => sanitize_textarea_field(wp_unslash($_POST['policy_cancel'] ?? '')),
                'policy_travel' => sanitize_textarea_field(wp_unslash($_POST['policy_travel'] ?? '')),
                'notify_email'  => sanitize_email(wp_unslash($_POST['notify_email'] ?? 'jordan@pamedia.art')),
                'deposit_cents' => max(50, (int) round($deposit * 100)),
                'min_lead_hours' => max(0, absint($_POST['min_lead_hours'] ?? 48)),
                'stripe_pk'     => sanitize_text_field(wp_unslash($_POST['stripe_pk'] ?? '')),
                'stripe_sk'     => sanitize_text_field(wp_unslash($_POST['stripe_sk'] ?? '')),
                'success_page'  => absint($_POST['success_page'] ?? 0),
                'services'      => sanitize_textarea_field(wp_unslash($_POST['services'] ?? '')),
                'deposit_payments_enabled' => !empty($_POST['deposit_payments_enabled']),
                'paylink_url'              => esc_url_raw(trim(wp_unslash($_POST['paylink_url'] ?? ''))),
            );
            $tier_urls = array();
            for ($tier_days = 2; $tier_days <= 5; $tier_days++) {
                $field = 'paylink_tier_' . $tier_days;
                if (!empty($_POST[$field])) {
                    $tier_urls[(string) $tier_days] = esc_url_raw(trim(wp_unslash($_POST[$field])));
                }
            }
            $settings['paylink_tier_urls'] = $tier_urls;
            if (!PA_Booking_Stripe::keys_valid($settings['stripe_pk'], $settings['stripe_sk'])) {
                if ($settings['stripe_pk'] !== '' || $settings['stripe_sk'] !== '') {
                    add_settings_error('pa_booking', 'stripe_keys', 'Stripe keys must be a matching pair: pk_live_ with sk_live_, or pk_test_ with sk_test_.', 'error');
                    return;
                }
            }
            update_option(PA_Booking::OPTION_SETTINGS, array_merge(PA_Booking::get_settings(), $settings));
            if (PA_Booking_Stripe::is_configured()) {
                delete_option('pa_booking_needs_stripe');
            }
            add_settings_error('pa_booking', 'saved', 'Settings saved.', 'updated');
        }

        if (isset($_POST['pa_booking_block_nonce']) && wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['pa_booking_block_nonce'])), 'pa_booking_block')) {
            $add = sanitize_text_field(wp_unslash($_POST['block_date'] ?? ''));
            $dates = PA_Booking::get_blocked_dates();
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $add)) {
                $dates[] = $add;
                PA_Booking::set_blocked_dates($dates);
            }
        }

        if (isset($_GET['pa_quick_block']) && isset($_GET['_wpnonce']) && wp_verify_nonce(sanitize_text_field(wp_unslash($_GET['_wpnonce'])), 'pa_quick_block_' . sanitize_text_field(wp_unslash($_GET['pa_quick_block'])))) {
            $add = sanitize_text_field(wp_unslash($_GET['pa_quick_block']));
            $month = isset($_GET['cal_month']) ? sanitize_text_field(wp_unslash($_GET['cal_month'])) : gmdate('Y-m');
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $add)) {
                $dates = PA_Booking::get_blocked_dates();
                if (!in_array($add, $dates, true)) {
                    $dates[] = $add;
                    PA_Booking::set_blocked_dates($dates);
                }
            }
            wp_safe_redirect(admin_url('admin.php?page=pa-booking-dates&cal_month=' . rawurlencode($month)));
            exit;
        }

        if (isset($_GET['pa_unblock']) && isset($_GET['_wpnonce']) && wp_verify_nonce(sanitize_text_field(wp_unslash($_GET['_wpnonce'])), 'pa_unblock_' . sanitize_text_field(wp_unslash($_GET['pa_unblock'])))) {
            $remove = sanitize_text_field(wp_unslash($_GET['pa_unblock']));
            $dates = array_diff(PA_Booking::get_blocked_dates(), array($remove));
            PA_Booking::set_blocked_dates($dates);
            wp_safe_redirect(admin_url('admin.php?page=pa-booking-dates&cal_month=' . rawurlencode(isset($_GET['cal_month']) ? sanitize_text_field(wp_unslash($_GET['cal_month'])) : gmdate('Y-m'))));
            exit;
        }

        if (isset($_GET['pa_export']) && $_GET['pa_export'] === 'csv' && isset($_GET['_wpnonce']) && wp_verify_nonce(sanitize_text_field(wp_unslash($_GET['_wpnonce'])), 'pa_booking_export')) {
            $this->export_csv();
            exit;
        }

        if (isset($_GET['pa_booking_action'], $_GET['booking_id'], $_GET['_wpnonce']) && wp_verify_nonce(sanitize_text_field(wp_unslash($_GET['_wpnonce'])), 'pa_booking_status')) {
            $id = absint($_GET['booking_id']);
            $action = sanitize_text_field(wp_unslash($_GET['pa_booking_action']));
            if ($id && in_array($action, array('approve', 'reject'), true)) {
                $status = $action === 'approve' ? 'approved' : 'rejected';
                update_post_meta($id, 'status', $status);
                $this->notify_customer_status($id, $status);
            }
            wp_safe_redirect(admin_url('admin.php?page=pa-booking'));
            exit;
        }
    }

    private function notify_customer_status($booking_id, $status) {
        PA_Booking_Emails::customer_status_update($booking_id, $status);
    }

    private function export_csv() {
        $bookings = get_posts(
            array(
                'post_type'      => PA_Booking::CPT,
                'post_status'    => 'publish',
                'posts_per_page' => -1,
                'orderby'        => 'date',
                'order'          => 'DESC',
            )
        );
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=pa-bookings-' . gmdate('Y-m-d') . '.csv');
        $out = fopen('php://output', 'w');
        fputcsv(
            $out,
            array('Submitted', 'Status', 'Dates', 'Service', 'Event type', 'Venue', 'Time', 'Client', 'Email', 'Phone', 'Deposit', 'Notes')
        );
        foreach ($bookings as $b) {
            $deposit = (int) get_post_meta($b->ID, 'deposit_cents', true);
            fputcsv(
                $out,
                array(
                    get_the_date('Y-m-d H:i', $b),
                    get_post_meta($b->ID, 'status', true),
                    PA_Booking::format_dates_label(PA_Booking::get_booking_event_dates($b->ID)),
                    get_post_meta($b->ID, 'service', true),
                    get_post_meta($b->ID, 'event_type', true),
                    get_post_meta($b->ID, 'venue', true),
                    get_post_meta($b->ID, 'time_window', true),
                    get_post_meta($b->ID, 'customer_name', true),
                    get_post_meta($b->ID, 'customer_email', true),
                    get_post_meta($b->ID, 'customer_phone', true),
                    $deposit >= 50 ? number_format($deposit / 100, 2) : '',
                    get_post_meta($b->ID, 'notes', true),
                )
            );
        }
        fclose($out);
    }

    public function render_dashboard() {
        $bookings = get_posts(
            array(
                'post_type'      => PA_Booking::CPT,
                'post_status'    => 'publish',
                'posts_per_page' => 50,
                'orderby'        => 'date',
                'order'          => 'DESC',
            )
        );
        settings_errors('pa_booking');
        $pending = PA_Booking::count_pending_approval();
        $approved = count(
            get_posts(
                array(
                    'post_type'      => PA_Booking::CPT,
                    'post_status'    => 'publish',
                    'posts_per_page' => -1,
                    'fields'         => 'ids',
                    'meta_query'     => array(
                        array('key' => 'status', 'value' => 'approved', 'compare' => '='),
                    ),
                )
            )
        );
        $deposits = PA_Booking::sum_deposits_collected();
        $export_url = wp_nonce_url(admin_url('admin.php?page=pa-booking&pa_export=csv'), 'pa_booking_export');
        echo '<div class="wrap pa-booking-admin"><h1>Booking Requests</h1>';
        echo '<div class="pa-dash-stats">';
        echo '<div class="pa-stat"><span class="pa-stat-num">' . (int) $pending . '</span><span class="pa-stat-label">Awaiting approval</span></div>';
        echo '<div class="pa-stat"><span class="pa-stat-num">' . (int) $approved . '</span><span class="pa-stat-label">Confirmed gigs</span></div>';
        echo '<div class="pa-stat"><span class="pa-stat-num">$' . esc_html(number_format($deposits / 100, 0)) . '</span><span class="pa-stat-label">Deposits collected</span></div>';
        echo '</div>';
        echo '<p class="pa-dash-actions"><a class="button" href="' . esc_url(admin_url('admin.php?page=pa-booking-dates')) . '">Calendar &amp; block dates</a> ';
        echo '<a class="button" href="' . esc_url($export_url) . '">Export CSV</a></p>';
        echo '<p>Deposit-paid requests appear as <strong>pending approval</strong>. Approve after you verify the gig — only then does the date grey out on the public calendar.</p>';
        if (!$bookings) {
            echo '<p>No requests yet.</p></div>';
            return;
        }
        echo '<table class="widefat striped"><thead><tr><th>Date</th><th>Time</th><th>Service</th><th>Event</th><th>Client</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
        foreach ($bookings as $b) {
            $dates_label = esc_html(PA_Booking::format_dates_label(PA_Booking::get_booking_event_dates($b->ID)));
            $deposit_cents = (int) get_post_meta($b->ID, 'deposit_cents', true);
            $deposit_display = $deposit_cents >= 50 ? '$' . number_format($deposit_cents / 100, 2) : '—';
            $time_window = esc_html(get_post_meta($b->ID, 'time_window', true));
            $service = esc_html(get_post_meta($b->ID, 'service', true));
            $event_type = esc_html(get_post_meta($b->ID, 'event_type', true));
            $venue = esc_html(get_post_meta($b->ID, 'venue', true));
            $name = esc_html(get_post_meta($b->ID, 'customer_name', true));
            $email = esc_html(get_post_meta($b->ID, 'customer_email', true));
            $phone = esc_html(get_post_meta($b->ID, 'customer_phone', true));
            $status = esc_html(get_post_meta($b->ID, 'status', true));
            $nonce = wp_create_nonce('pa_booking_status');
            echo '<tr>';
            echo '<td>' . $dates_label . '<br><small>Deposit: ' . esc_html($deposit_display) . '</small></td><td>' . ($time_window ?: '—') . '</td><td>' . $service . '</td>';
            echo '<td>' . $event_type . ($venue ? '<br><small>' . $venue . '</small>' : '') . '</td>';
            echo '<td>' . $name . '<br><a href="mailto:' . esc_attr($email) . '">' . $email . '</a><br>' . $phone . '</td>';
            echo '<td><span class="pa-status pa-status-' . esc_attr($status) . '">' . $status . '</span></td>';
            echo '<td>';
            if ($status === 'pending_approval') {
                echo '<a class="button button-primary" href="' . esc_url(admin_url('admin.php?page=pa-booking&pa_booking_action=approve&booking_id=' . $b->ID . '&_wpnonce=' . $nonce)) . '">Approve</a> ';
                echo '<a class="button" href="' . esc_url(admin_url('admin.php?page=pa-booking&pa_booking_action=reject&booking_id=' . $b->ID . '&_wpnonce=' . $nonce)) . '">Reject</a>';
            } else {
                echo '—';
            }
            echo '</td></tr>';
        }
        echo '</tbody></table></div>';
    }

    public function render_settings() {
        $s = PA_Booking::get_settings();
        $stripe_mode = PA_Booking_Stripe::mode();
        $payment_provider = PA_Booking_Payments::provider();
        settings_errors('pa_booking');
        ?>
        <div class="wrap pa-booking-admin">
            <h1>PA Booking Settings</h1>
            <?php if ($payment_provider === 'paylink') : ?>
            <div class="notice notice-success inline" style="padding:12px 16px;margin:1em 0;">
                <p><strong>GoDaddy Pay Link active.</strong> Customers enter their details first, then pay the deposit on GoDaddy as the final step. If they return to your site after paying, they are sent to the confirmation page.</p>
            </div>
            <div class="notice notice-warning inline" style="padding:12px 16px;margin:1em 0;">
                <p><strong>Prefill $<?php echo esc_html(number_format($s['deposit_cents'] / 100, 2)); ?> at checkout:</strong> GoDaddy → <strong>Payments → Online Pay Links</strong> → edit your link → turn <strong>off</strong> “Allow customer to set a price” → enter <strong>$<?php echo esc_html(number_format($s['deposit_cents'] / 100, 2)); ?></strong> as a fixed price → Save. GoDaddy does not let our site pass the amount in the URL — the price is set on the link itself.</p>
                <p class="description">Optional: set the pay link thank-you / return URL to <code><?php echo esc_html(PA_Booking_Payments::deposit_return_url()); ?></code> so customers land on your confirmation page after payment.</p>
            </div>
            <?php elseif (!PA_Booking_Stripe::is_configured() && !PA_Booking_Payments::paylink_configured()) : ?>
            <div class="notice notice-info inline" style="padding:12px 16px;margin:1em 0;">
                <p><strong>Almost done.</strong> Open <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener">Stripe → Developers → API keys</a> (turn off Test mode for live), copy both keys, paste below, and save.</p>
            </div>
            <?php elseif ($stripe_mode === 'test') : ?>
            <div class="notice notice-warning inline" style="padding:12px 16px;margin:1em 0;">
                <p><strong>Test mode.</strong> Checkout shows “sandbox” and cards are not charged. Replace keys with <code>pk_live_</code> / <code>sk_live_</code> to accept real deposits on pamedia.art.</p>
            </div>
            <?php elseif ($stripe_mode === 'live') : ?>
            <div class="notice notice-success inline" style="padding:12px 16px;margin:1em 0;">
                <p><strong>Live payments enabled.</strong> Deposits go to your Stripe account. Customers pay via secure Stripe Checkout (card, Apple Pay, Google Pay).</p>
            </div>
            <?php endif; ?>
            <form method="post">
                <?php wp_nonce_field('pa_booking_settings', 'pa_booking_settings_nonce'); ?>
                <table class="form-table">
                    <tr><th colspan="2"><h2 style="margin:1.5em 0 0;">Your brand</h2></th></tr>
                    <tr><th>Artist / business name</th><td><input type="text" name="artist_name" value="<?php echo esc_attr($s['artist_name'] ?? ''); ?>" class="regular-text"></td></tr>
                    <tr><th>Tagline</th><td><input type="text" name="tagline" value="<?php echo esc_attr($s['tagline'] ?? ''); ?>" class="large-text"></td></tr>
                    <tr><th>Phone</th><td><input type="text" name="phone" value="<?php echo esc_attr($s['phone'] ?? ''); ?>" class="regular-text"></td></tr>
                    <tr><th>Travel area</th><td><input type="text" name="travel_area" value="<?php echo esc_attr($s['travel_area'] ?? ''); ?>" class="large-text"></td></tr>
                    <tr><th colspan="2"><h2 style="margin:1.5em 0 0;">Booking &amp; payments</h2></th></tr>
                    <tr><th>Notification email</th><td><input type="email" name="notify_email" value="<?php echo esc_attr($s['notify_email']); ?>" class="regular-text" required></td></tr>
                    <tr><th>Deposit per day (USD)</th><td><input type="number" step="0.01" min="0.50" name="deposit_dollars" value="<?php echo esc_attr(number_format($s['deposit_cents'] / 100, 2, '.', '')); ?>"> <p class="description">Per-day retainer when deposit payments are enabled.</p></td></tr>
                    <tr><th>Accept deposit payments</th><td><label><input type="checkbox" name="deposit_payments_enabled" value="1" <?php checked(!empty($s['deposit_payments_enabled'])); ?>> Charge deposits at checkout</label><p class="description">Uses your <strong>GoDaddy Pay Link</strong> when set (recommended). Stripe is optional fallback if Pay Link is empty.</p></td></tr>
                    <tr><th>GoDaddy Pay Link URL</th><td><input type="url" name="paylink_url" value="<?php echo esc_attr($s['paylink_url'] ?? ''); ?>" class="large-text" placeholder="https://….paylinks.godaddy.com/…"><p class="description"><strong>1-day deposit link</strong> — set a <em>fixed</em> price of $<?php echo esc_html(number_format($s['deposit_cents'] / 100, 2)); ?> in GoDaddy (not “customer sets price”). Customers pay this after entering their booking details.</p></td></tr>
                    <?php
                    $tier_urls = isset($s['paylink_tier_urls']) && is_array($s['paylink_tier_urls']) ? $s['paylink_tier_urls'] : array();
                    $per_day = number_format($s['deposit_cents'] / 100, 2, '.', '');
                    for ($tier_days = 2; $tier_days <= 5; $tier_days++) :
                        $tier_total = number_format(($s['deposit_cents'] / 100) * $tier_days, 2, '.', '');
                        ?>
                    <tr><th><?php echo esc_html((string) $tier_days); ?>-day pay link <span class="description">(optional)</span></th><td><input type="url" name="paylink_tier_<?php echo esc_attr((string) $tier_days); ?>" value="<?php echo esc_attr($tier_urls[(string) $tier_days] ?? ''); ?>" class="large-text" placeholder="https://….paylinks.godaddy.com/…"><p class="description">Separate GoDaddy link with fixed price <strong>$<?php echo esc_html($tier_total); ?></strong> ($<?php echo esc_html($per_day); ?>/day × <?php echo esc_html((string) $tier_days); ?>). Leave blank to use the 1-day link.</p></td></tr>
                    <?php endfor; ?>
                    <tr><th>Minimum notice (hours)</th><td><input type="number" min="0" max="336" name="min_lead_hours" value="<?php echo esc_attr((int) ($s['min_lead_hours'] ?? 48)); ?>"> <p class="description">Customers cannot book dates sooner than this (default 48 hours).</p></td></tr>
                    <tr><th>Stripe publishable key</th><td><input type="text" name="stripe_pk" value="<?php echo esc_attr($s['stripe_pk']); ?>" class="large-text" placeholder="pk_live_... or pk_test_..." autocomplete="off"><?php if ($stripe_mode) : ?> <p class="description">Mode: <strong><?php echo esc_html(strtoupper($stripe_mode)); ?></strong><?php echo defined('PA_BOOKING_STRIPE_PK') ? ' (locked by mu-plugin)' : ''; ?></p><?php endif; ?></td></tr>
                    <tr><th>Stripe secret key</th><td><input type="password" name="stripe_sk" value="<?php echo esc_attr($s['stripe_sk']); ?>" class="large-text" placeholder="sk_live_... or sk_test_..." autocomplete="new-password"><?php if (defined('PA_BOOKING_STRIPE_SK')) : ?><p class="description">Secret key is set via <code>wp-content/mu-plugins/pa-booking-stripe-keys.php</code> on the server (recommended).</p><?php endif; ?></td></tr>
                    <tr><th>Success page</th><td><?php
                        wp_dropdown_pages(
                            array(
                                'name'              => 'success_page',
                                'selected'          => (int) $s['success_page'],
                                'show_option_none'  => '— Home (default) —',
                                'option_none_value' => '0',
                            )
                        );
                        ?><p class="description">After deposit payment. Add shortcode <code>[pa_booking_success]</code> to that page.</p></td></tr>
                    <tr><th>Services (one per line)</th><td><textarea name="services" rows="6" class="large-text"><?php echo esc_textarea($s['services']); ?></textarea></td></tr>
                    <tr><th colspan="2"><h2 style="margin:1.5em 0 0;">Client-facing policies</h2><p class="description">Shown on your booking page — edit to match how you work.</p></th></tr>
                    <tr><th>Deposit policy</th><td><textarea name="policy_deposit" rows="2" class="large-text"><?php echo esc_textarea($s['policy_deposit'] ?? ''); ?></textarea></td></tr>
                    <tr><th>Cancellation policy</th><td><textarea name="policy_cancel" rows="2" class="large-text"><?php echo esc_textarea($s['policy_cancel'] ?? ''); ?></textarea></td></tr>
                    <tr><th>Travel policy</th><td><textarea name="policy_travel" rows="2" class="large-text"><?php echo esc_textarea($s['policy_travel'] ?? ''); ?></textarea></td></tr>
                </table>
                <?php submit_button('Save settings'); ?>
            </form>
            <hr>
            <h2>Stripe setup</h2>
            <ol>
                <li>Complete business verification at <a href="https://dashboard.stripe.com" target="_blank" rel="noopener">stripe.com</a>.</li>
                <li>Developers → API keys → turn <strong>Test mode OFF</strong> → copy <code>pk_live_</code> and <code>sk_live_</code>.</li>
                <li>Paste keys here or deploy <code>mu-plugins/pa-booking-stripe-keys.php</code> (never commit keys to git).</li>
                <li>Run one real $1 test booking, then refund in Stripe if desired.</li>
            </ol>
        </div>
        <?php
    }

    public function render_dates() {
        $blocked = PA_Booking::get_blocked_dates();
        sort($blocked);
        $confirmed = PA_Booking::get_confirmed_booked_dates();
        $pending = $this->get_dates_by_status('pending_approval');
        $checkout = $this->get_dates_by_status('pending_payment');
        $month = isset($_GET['cal_month']) ? sanitize_text_field(wp_unslash($_GET['cal_month'])) : gmdate('Y-m');
        if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
            $month = gmdate('Y-m');
        }
        ?>
        <div class="wrap pa-booking-admin">
            <h1>Block Dates &amp; Calendar</h1>
            <p><strong>Public calendar:</strong> customers only see dates you <strong>block manually</strong> or <strong>approve</strong> as confirmed. Pending requests and abandoned checkouts do <em>not</em> grey out dates.</p>

            <?php $this->render_admin_calendar($month, $blocked, $confirmed, $pending, $checkout); ?>

            <hr style="margin:2em 0;">
            <h2>Block a date manually</h2>
            <p class="description">Use this for vacations, personal time, or holds not tied to a booking request. You can also click any open day on the calendar above.</p>
            <form method="post" style="margin:1em 0;">
                <?php wp_nonce_field('pa_booking_block', 'pa_booking_block_nonce'); ?>
                <input type="date" name="block_date" required>
                <?php submit_button('Block this date', 'secondary', 'submit', false); ?>
            </form>
            <ul>
                <?php
                if (!$blocked) {
                    echo '<li>No blocked dates.</li>';
                }
                foreach ($blocked as $d) {
                    $url = wp_nonce_url(admin_url('admin.php?page=pa-booking-dates&pa_unblock=' . $d), 'pa_unblock_' . $d);
                    echo '<li>' . esc_html($d) . ' <a href="' . esc_url($url) . '">Unblock</a></li>';
                }
                ?>
            </ul>
        </div>
        <?php
    }

    private function get_dates_by_status($status) {
        $dates = array();
        $posts = get_posts(
            array(
                'post_type'      => PA_Booking::CPT,
                'post_status'    => 'publish',
                'posts_per_page' => -1,
                'fields'         => 'ids',
                'meta_query'     => array(
                    array(
                        'key'     => 'status',
                        'value'   => $status,
                        'compare' => '=',
                    ),
                ),
            )
        );
        foreach ($posts as $id) {
            foreach (PA_Booking::get_booking_event_dates($id) as $d) {
                $dates[] = $d;
            }
        }
        return array_values(array_unique($dates));
    }

    private function render_admin_calendar($month, $blocked, $confirmed, $pending, $checkout) {
        $parts = explode('-', $month);
        $y = (int) $parts[0];
        $m = (int) $parts[1] - 1;
        $prev = gmdate('Y-m', gmmktime(0, 0, 0, $m, 1, $y) - DAY_IN_SECONDS);
        $next = gmdate('Y-m', gmmktime(0, 0, 0, $m + 2, 1, $y));
        $month_names = array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');
        $start_dow = (int) gmdate('w', gmmktime(0, 0, 0, $m + 1, 1, $y));
        $days_in_month = (int) gmdate('t', gmmktime(0, 0, 0, $m + 1, 1, $y));
        ?>
        <div class="pa-admin-cal">
            <div class="pa-admin-cal-header">
                <h2><?php echo esc_html($month_names[$m] . ' ' . $y); ?></h2>
                <div class="pa-admin-cal-nav">
                    <a class="button" href="<?php echo esc_url(admin_url('admin.php?page=pa-booking-dates&cal_month=' . $prev)); ?>">‹ Prev</a>
                    <a class="button" href="<?php echo esc_url(admin_url('admin.php?page=pa-booking-dates&cal_month=' . $next)); ?>">Next ›</a>
                </div>
            </div>
            <div class="pa-admin-cal-legend">
                <span class="pa-legend-blocked">Blocked (manual)</span>
                <span class="pa-legend-booked">Confirmed (approved)</span>
                <span class="pa-legend-pending">Awaiting your approval</span>
                <span class="pa-legend-checkout">Checkout started</span>
            </div>
            <div class="pa-admin-cal-grid">
                <?php
                $dow = array('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');
                foreach ($dow as $label) {
                    echo '<div class="pa-admin-cal-dow">' . esc_html($label) . '</div>';
                }
                for ($i = 0; $i < $start_dow; $i++) {
                    echo '<div class="pa-admin-cal-day is-empty"></div>';
                }
                for ($day = 1; $day <= $days_in_month; $day++) {
                    $iso = sprintf('%04d-%02d-%02d', $y, $m + 1, $day);
                    $classes = array('pa-admin-cal-day');
                    $title = $iso;
                    $is_blocked = in_array($iso, $blocked, true);
                    if ($is_blocked) {
                        $classes[] = 'is-blocked';
                        $title .= ' — blocked manually';
                    } elseif (in_array($iso, $confirmed, true)) {
                        $classes[] = 'is-booked';
                        $title .= ' — confirmed booking';
                    } elseif (in_array($iso, $pending, true)) {
                        $classes[] = 'is-pending';
                        $title .= ' — awaiting approval (public calendar still open)';
                    } elseif (in_array($iso, $checkout, true)) {
                        $classes[] = 'is-checkout';
                        $title .= ' — checkout started (not held)';
                    }
                    echo '<div class="' . esc_attr(implode(' ', $classes)) . '" title="' . esc_attr($title) . '">';
                    echo '<span class="pa-admin-cal-day-num">' . esc_html((string) $day) . '</span>';
                    if (!$is_blocked && !in_array($iso, $confirmed, true)) {
                        $block_url = wp_nonce_url(
                            admin_url('admin.php?page=pa-booking-dates&cal_month=' . rawurlencode($month) . '&pa_quick_block=' . rawurlencode($iso)),
                            'pa_quick_block_' . $iso
                        );
                        echo '<a class="pa-admin-cal-block-link" href="' . esc_url($block_url) . '">Block</a>';
                    } elseif ($is_blocked) {
                        $unblock_url = wp_nonce_url(
                            admin_url('admin.php?page=pa-booking-dates&cal_month=' . rawurlencode($month) . '&pa_unblock=' . rawurlencode($iso)),
                            'pa_unblock_' . $iso
                        );
                        echo '<a class="pa-admin-cal-unblock-link" href="' . esc_url($unblock_url) . '">Unblock</a>';
                    }
                    echo '</div>';
                }
                ?>
            </div>
        </div>
        <?php
    }
}

/**
 * One-time setup: success page, homepage shortcode, defaults.
 */
class PA_Booking_Setup {
    public static function run() {
        self::ensure_success_page();
        self::ensure_book_page();
        PA_Booking_Legal_Pages::ensure_all();
        self::ensure_home_shortcode();
        self::ensure_defaults();
        flush_rewrite_rules();
    }

    public static function ensure_book_page() {
        $existing = get_page_by_path('book');
        if ($existing) {
            if ($existing->post_status !== 'publish') {
                wp_update_post(
                    array(
                        'ID'          => $existing->ID,
                        'post_status' => 'publish',
                    )
                );
            }
            if (strpos($existing->post_content, '[pa_booking]') === false) {
                wp_update_post(
                    array(
                        'ID'           => $existing->ID,
                        'post_content' => "<!-- wp:shortcode -->\n[pa_booking]\n<!-- /wp:shortcode -->",
                    )
                );
            }
            return (int) $existing->ID;
        }
        $page_id = wp_insert_post(
            array(
                'post_title'   => 'Book',
                'post_name'    => 'book',
                'post_status'  => 'publish',
                'post_type'    => 'page',
                'post_content' => "<!-- wp:shortcode -->\n[pa_booking]\n<!-- /wp:shortcode -->",
            ),
            true
        );
        return is_wp_error($page_id) ? 0 : (int) $page_id;
    }

    /**
     * Safe runtime setup: book page + rewrite flush (no wp_insert_post on plugins_loaded).
     */
    public static function boot_public_pages() {
        // Never run heavy rewrite flushes during REST/AJAX — keeps checkout POST fast.
        if ((defined('REST_REQUEST') && REST_REQUEST) || wp_doing_ajax()) {
            return;
        }

        $book_id = self::ensure_book_page();
        $stored = (int) get_option('pa_booking_book_page_id', 0);
        if ($book_id && $book_id !== $stored) {
            update_option('pa_booking_book_page_id', $book_id);
        }

        if (!get_option('pa_booking_legal_pages_ready')) {
            PA_Booking_Legal_Pages::ensure_all();
            update_option('pa_booking_legal_pages_ready', 1);
        }
    }

    /**
     * If /book/ 404s at origin (stale rules), serve the Book page anyway.
     */
    public static function rescue_book_404() {
        if (!is_404()) {
            return;
        }
        $uri = isset($_SERVER['REQUEST_URI']) ? sanitize_text_field(wp_unslash($_SERVER['REQUEST_URI'])) : '';
        $path = trim((string) parse_url($uri, PHP_URL_PATH), '/');
        if ($path !== 'book') {
            return;
        }
        $page = get_page_by_path('book', OBJECT, 'page');
        if (!$page || $page->post_status !== 'publish') {
            return;
        }

        global $wp_query, $post;
        $post = $page;
        setup_postdata($post);
        $wp_query->post = $post;
        $wp_query->posts = array($post);
        $wp_query->post_count = 1;
        $wp_query->queried_object = $page;
        $wp_query->queried_object_id = (int) $page->ID;
        $wp_query->is_page = true;
        $wp_query->is_singular = true;
        $wp_query->is_single = false;
        $wp_query->is_404 = false;
        status_header(200);
        nocache_headers();
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
