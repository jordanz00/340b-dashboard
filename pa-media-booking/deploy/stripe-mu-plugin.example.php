<?php
/**
 * Copy to: wp-content/mu-plugins/pa-booking-stripe-keys.php
 * GoDaddy → File Manager → wp-content/mu-plugins/ (create folder if missing)
 *
 * Replace placeholders with keys from Stripe → Developers → API keys.
 * Never commit this file with real keys.
 */
if (!defined('ABSPATH')) {
    exit;
}

define('PA_BOOKING_STRIPE_PK', 'pk_test_YOUR_PUBLISHABLE_KEY');
define('PA_BOOKING_STRIPE_SK', 'sk_test_YOUR_SECRET_KEY');
