<?php
/*
 * Plugin Name: PA Block Dates 2026 (one-shot)
 * Description: Applies Jordan's unavailable dates for summer/fall 2026.
 *              Runs exactly once on first WordPress init, then marks itself done.
 *              Safe to leave in place — subsequent requests are instant no-ops.
 */
add_action('init', function () {
    if (get_option('pa_block_dates_2026_v2_done')) {
        return;
    }

    $dates = [
        // June
        '2026-06-24',
        '2026-06-26',
        '2026-06-27',
        '2026-06-28',
        // July
        '2026-07-03',
        '2026-07-04',
        '2026-07-05',
        '2026-07-06',
        '2026-07-10',
        '2026-07-17',
        '2026-07-25',
        '2026-07-26',
        '2026-07-30',
        '2026-07-31',
        // August
        '2026-08-01',
        '2026-08-02',
        '2026-08-08',
        '2026-08-09',
        '2026-08-10',
        '2026-08-11',
        '2026-08-12',
        '2026-08-13',
        '2026-08-14',
        '2026-08-15',
        '2026-08-30',
    ];

    $existing = get_option('pa_booking_blocked_dates', []);
    $merged   = array_values(array_unique(array_merge((array) $existing, $dates)));
    sort($merged);
    update_option('pa_booking_blocked_dates', $merged);
    update_option('pa_block_dates_2026_v2_done', true);

    error_log('[PAMA] pa-block-dates-2026: blocked ' . count($dates) . ' dates. Total now: ' . count($merged) . '.');
}, 5);
