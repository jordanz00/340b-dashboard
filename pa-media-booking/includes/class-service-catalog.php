<?php
/**
 * Service package metadata for the booking funnel (Studio Ninja / HoneyBook-style brochures).
 *
 * WHO THIS IS FOR: Photographers, videographers, live audio, and DJ bookings.
 * WHAT IT DOES: Supplies duration, deliverables, and ideal-use copy per service line.
 * HOW IT CONNECTS: REST availability + PABooking localize → booking.js service cards.
 */

if (!defined('ABSPATH')) {
    exit;
}

class PA_Booking_Service_Catalog {

    /**
     * Canonical package definitions keyed by exact service name from settings.
     *
     * @return array<string, array{tagline:string,duration:string,ideal:string,includes:string[]}>
     */
    public static function definitions() {
        return array(
            'Event Photography' => array(
                'tagline'  => 'Story-driven stills for weddings, galas, and live events.',
                'duration' => 'Typical coverage: 4–8 hours on event day',
                'ideal'    => 'Weddings · corporate events · private parties',
                'starting_price_cents' => 120000,
                'includes' => array(
                    'Edited high-resolution gallery delivery',
                    'Online sharing link for guests',
                    'Pre-event planning call',
                ),
            ),
            'Video Production' => array(
                'tagline'  => 'Cinematic highlight films and full event documentation.',
                'duration' => 'Typical coverage: 4–10 hours · delivery in 2–4 weeks',
                'ideal'    => 'Concerts · brand events · milestone celebrations',
                'starting_price_cents' => 180000,
                'includes' => array(
                    'Professional multi-camera capture',
                    'Edited highlight reel',
                    'Licensed music mix (where applicable)',
                ),
            ),
            'Live Audio / PA' => array(
                'tagline'  => 'Sound reinforcement, mics, and mix for venues of any size.',
                'duration' => 'Typical coverage: full event window + setup/strike',
                'ideal'    => 'Concerts · ceremonies · corporate presentations',
                'starting_price_cents' => 150000,
                'includes' => array(
                    'PA system tailored to your venue',
                    'Wireless mics & monitoring',
                    'On-site audio engineer',
                ),
            ),
            'DJ Services' => array(
                'tagline'  => 'Music programming, MC announcements, and dance-floor energy.',
                'duration' => 'Typical coverage: 4–6 hours performance time',
                'ideal'    => 'Weddings · private parties · school events',
                'starting_price_cents' => 100000,
                'includes' => array(
                    'Professional DJ & sound system',
                    'MC for key announcements',
                    'Custom playlist planning',
                ),
            ),
            'Photo + Video Bundle' => array(
                'tagline'  => 'Coordinated photo and video team — one booking, one timeline.',
                'duration' => 'Typical coverage: 6–10 hours · unified delivery',
                'ideal'    => 'Weddings · large celebrations · brand launches',
                'starting_price_cents' => 280000,
                'includes' => array(
                    'Photography + video crew on the same schedule',
                    'Matched editing style across both mediums',
                    'Single point of contact for your event',
                ),
            ),
        );
    }

    /**
     * Package for one service name, with safe fallbacks for custom admin entries.
     *
     * @param string $name Service label from settings.
     * @return array{tagline:string,duration:string,ideal:string,includes:string[]}
     */
    public static function package_for($name) {
        $defs = self::definitions();
        if (isset($defs[$name])) {
            return $defs[$name];
        }
        return array(
            'tagline'  => 'Professional event coverage across Pennsylvania.',
            'duration' => 'Coverage length confirmed during booking',
            'ideal'    => 'Events throughout Central PA',
            'starting_price_cents' => 0,
            'includes' => array(
                'Dedicated PA Media Arts crew',
                'Pre-production planning',
                'Deliverables per your quote',
            ),
        );
    }

    /**
     * Packages for all configured services (API + frontend).
     *
     * @param string[] $service_names
     * @return array<string, array>
     */
    public static function packages_for_services(array $service_names) {
        $out = array();
        foreach ($service_names as $name) {
            $name = trim((string) $name);
            if ($name === '') {
                continue;
            }
            $out[$name] = self::package_for($name);
        }
        return $out;
    }

    /**
     * Optional add-ons (HoneyBook-style line items). Final quote confirmed in writing.
     *
     * @return array<int, array{id:string,label:string,description:string,price_cents:int,services:string[]}>
     */
    public static function addons() {
        return array(
            array(
                'id'           => 'second_operator',
                'label'        => 'Second shooter / operator',
                'description'  => 'Additional crew member for coverage redundancy',
                'price_cents'  => 35000,
                'services'     => array('Event Photography', 'Video Production', 'Photo + Video Bundle'),
            ),
            array(
                'id'           => 'extra_hour',
                'label'        => 'Extra hour of coverage',
                'description'  => 'Extend your time window on event day',
                'price_cents'  => 15000,
                'services'     => array(),
            ),
            array(
                'id'           => 'drone',
                'label'        => 'Aerial / drone coverage',
                'description'  => 'Where permitted by venue and weather',
                'price_cents'  => 25000,
                'services'     => array('Event Photography', 'Video Production', 'Photo + Video Bundle'),
            ),
            array(
                'id'           => 'rush_edit',
                'label'        => 'Rush delivery (2 weeks)',
                'description'  => 'Priority post-production turnaround',
                'price_cents'  => 30000,
                'services'     => array('Video Production', 'Photo + Video Bundle'),
            ),
            array(
                'id'           => 'raw_archive',
                'label'        => 'Raw footage / file archive',
                'description'  => 'Unedited source files delivered via secure link',
                'price_cents'  => 20000,
                'services'     => array('Video Production', 'Photo + Video Bundle'),
            ),
        );
    }

    /**
     * Add-ons available for a given service name.
     *
     * @param string $service_name
     * @return array<int, array>
     */
    public static function addons_for_service($service_name) {
        $out = array();
        foreach (self::addons() as $addon) {
            $allowed = $addon['services'];
            if (empty($allowed) || in_array($service_name, $allowed, true)) {
                $out[] = $addon;
            }
        }
        return $out;
    }

    /**
     * FAQ copy modeled on HoneyBook / Studio Ninja client portals.
     *
     * @return array<int, array{q:string,a:string}>
     */
    public static function faq_items() {
        $s = PA_Booking::get_settings();
        $deposit = number_format($s['deposit_cents'] / 100, 0);
        return array(
            array(
                'q' => 'What does the deposit do?',
                'a' => ($s['policy_deposit'] ?? '') ?: ('Your $' . $deposit . ' deposit holds your date and applies toward your balance.'),
            ),
            array(
                'q' => 'When is the remaining balance due?',
                'a' => 'Before your event date — we confirm the schedule in writing after booking.',
            ),
            array(
                'q' => 'How fast will I hear back?',
                'a' => 'Within one business day by email with next steps.',
            ),
            array(
                'q' => 'Can I book multiple days?',
                'a' => 'Yes. Select up to 14 days online; contact us for longer productions.',
            ),
            array(
                'q' => 'Do you travel outside Central PA?',
                'a' => ($s['policy_travel'] ?? '') ?: 'Central PA is included. Travel beyond may include a mileage fee, quoted in advance.',
            ),
            array(
                'q' => 'What if I need to cancel?',
                'a' => ($s['policy_cancel'] ?? '') ?: 'Contact us as soon as possible. Refund terms are confirmed in writing.',
            ),
        );
    }

    /**
     * Post-booking prep guide (Dubsado questionnaire / HoneyBook onboarding style).
     *
     * @return array<int, array{title:string,body:string}>
     */
    public static function prep_steps() {
        return array(
            array(
                'title' => 'Confirmation email',
                'body'  => 'Personal confirmation within one business day.',
            ),
            array(
                'title' => 'Pre-production call',
                'body'  => 'Short call for timeline, venue access, and deliverables.',
            ),
            array(
                'title' => 'Final balance & contract',
                'body'  => 'Written quote and payment schedule before your event.',
            ),
            array(
                'title' => 'Event day',
                'body'  => 'Crew arrives on schedule — you focus on the event.',
            ),
        );
    }
}
