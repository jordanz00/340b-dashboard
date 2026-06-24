<?php
/**
 * GoDaddy / CDN cache helpers — flush after deploy so mobile HTML updates.
 */

if (!defined('ABSPATH')) {
    exit;
}

class PA_Booking_Cache {
    /**
     * Best-effort full-page + object cache purge on GoDaddy MWP.
     *
     * @return array{methods: string[], ok: bool}
     */
    public static function flush_hosting_cache() {
        $methods = array();

        $bumped = self::bump_public_page_timestamps();
        if ($bumped > 0) {
            $methods[] = 'bump_page_modified:' . $bumped;
        }

        if (function_exists('wp_cache_flush')) {
            wp_cache_flush();
            $methods[] = 'wp_cache_flush';
        }

        if (function_exists('rocket_clean_domain')) {
            rocket_clean_domain();
            $methods[] = 'rocket_clean_domain';
        }

        if (has_action('gd_flush_cache')) {
            do_action('gd_flush_cache');
            $methods[] = 'gd_flush_cache';
        }

        if (has_action('wpaas_flush_cache')) {
            do_action('wpaas_flush_cache');
            $methods[] = 'wpaas_flush_cache';
        }

        if (function_exists('wpaas_cache_flush')) {
            wpaas_cache_flush();
            $methods[] = 'wpaas_cache_flush';
        }

        if (class_exists('WPaaS\\Cache') && method_exists('WPaaS\\Cache', 'ban')) {
            try {
                \WPaaS\Cache::ban();
                $methods[] = 'WPaaS\\Cache::ban';
            } catch (Exception $e) { // phpcs:ignore
                // Host may not expose this API on all plans.
            }
        }

        if (defined('WP_CLI') && WP_CLI && class_exists('WP_CLI')) {
            try {
                WP_CLI::runcommand('wpaas cache flush');
                $methods[] = 'wp wpaas cache flush';
            } catch (Exception $e) { // phpcs:ignore
                // CLI not available in web context.
            }
        }

        if (function_exists('opcache_reset')) {
            opcache_reset();
            $methods[] = 'opcache_reset';
        }

        return array(
            'ok'      => count($methods) > 0,
            'methods' => $methods,
        );
    }

    /**
     * GoDaddy full-page cache keys include post_modified — bump public pages to force MISS.
     *
     * @return int Number of posts touched.
     */
    public static function bump_public_page_timestamps() {
        if (!did_action('init')) {
            return 0;
        }

        $ids = array();
        $front = (int) get_option('page_on_front');
        if ($front > 0) {
            $ids[] = $front;
        }
        foreach (array('book', 'services', 'about', 'booking-status') as $slug) {
            $page = get_page_by_path($slug);
            if ($page && $page->post_status === 'publish') {
                $ids[] = (int) $page->ID;
            }
        }
        $ids = array_values(array_unique(array_filter($ids)));
        if ($ids === array()) {
            return 0;
        }

        global $wpdb;
        $now = current_time('mysql');
        $now_gmt = current_time('mysql', true);
        $count = 0;
        foreach ($ids as $id) {
            $rows = $wpdb->update(
                $wpdb->posts,
                array(
                    'post_modified'     => $now,
                    'post_modified_gmt' => $now_gmt,
                ),
                array('ID' => $id),
                array('%s', '%s'),
                array('%d')
            );
            if ($rows !== false) {
                $count++;
                clean_post_cache($id);
            }
        }
        return $count;
    }

    /**
     * Record deploy version and purge when plugin files change.
     */
    public static function maybe_flush_after_deploy() {
        $current = defined('PA_BOOKING_VERSION') ? PA_BOOKING_VERSION : '';
        if ($current === '') {
            return array('skipped' => true);
        }

        $seen = (string) get_option('pa_booking_deployed_version', '');
        if ($seen !== '' && version_compare($seen, $current, '>=')) {
            return array('skipped' => true, 'seen' => $seen);
        }

        update_option('pa_booking_deployed_version', $current, false);
        update_option('pa_booking_deployed_at', time(), false);
        $result = self::flush_hosting_cache();

        return array_merge($result, array('version' => $current, 'previous' => $seen));
    }
}
