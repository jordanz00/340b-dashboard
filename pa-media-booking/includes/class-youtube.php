<?php
/**
 * Featured YouTube videos from @PAMediaArts (cached server-side).
 */

if (!defined('ABSPATH')) {
    exit;
}

class PA_Booking_YouTube {
    const CHANNEL_URL = 'https://www.youtube.com/@PAMediaArts';
    const CHANNEL_PAGE = 'https://www.youtube.com/@PAMediaArts/videos';
    const CACHE_KEY = 'pa_youtube_video_ids';
    const CACHE_TTL = 43200; // 12 hours

    /**
     * Curated fallbacks from Pennsylvania Media Arts channel / site portfolio.
     *
     * @var string[]
     */
    const FALLBACK_IDS = array(
        'md_W_73txMI',
        'ifsUtm6mUpQ',
        'NA22pe5_vW0',
        '-hqlCiFmr0U',
        'Lf0pox83HSQ',
        'Z48SEVigxnA',
        'wm18oKctCVY',
    );

    /**
     * @return string[]
     */
    public static function featured_video_ids() {
        $cached = get_transient(self::CACHE_KEY);
        if (is_array($cached) && count($cached) >= 3) {
            return self::sanitize_ids($cached);
        }

        $fetched = self::fetch_channel_video_ids();
        $ids = self::sanitize_ids(array_merge($fetched, self::FALLBACK_IDS));
        $ids = array_values(array_unique($ids));
        $ids = array_slice($ids, 0, 15);

        if (count($ids) < 3) {
            $ids = self::sanitize_ids(self::FALLBACK_IDS);
        }

        set_transient(self::CACHE_KEY, $ids, self::CACHE_TTL);
        return $ids;
    }

    /**
     * @return string[]
     */
    private static function fetch_channel_video_ids() {
        $response = wp_remote_get(
            self::CHANNEL_PAGE,
            array(
                'timeout' => 15,
                'redirection' => 3,
                'user-agent' => 'Mozilla/5.0 (compatible; PAMediaBooking/1.0; +' . home_url('/') . ')',
            )
        );

        if (is_wp_error($response)) {
            return array();
        }

        $code = (int) wp_remote_retrieve_response_code($response);
        if ($code < 200 || $code >= 300) {
            return array();
        }

        $body = wp_remote_retrieve_body($response);
        if (!is_string($body) || $body === '') {
            return array();
        }

        $ids = array();
        if (preg_match_all('/"videoId":"([a-zA-Z0-9_-]{11})"/', $body, $matches) && !empty($matches[1])) {
            $ids = $matches[1];
        }

        return self::sanitize_ids($ids);
    }

    /**
     * @param mixed $ids
     * @return string[]
     */
    private static function sanitize_ids($ids) {
        if (!is_array($ids)) {
            return array();
        }
        $clean = array();
        foreach ($ids as $id) {
            $id = sanitize_text_field((string) $id);
            if (preg_match('/^[a-zA-Z0-9_-]{11}$/', $id)) {
                $clean[] = $id;
            }
        }
        return $clean;
    }
}
