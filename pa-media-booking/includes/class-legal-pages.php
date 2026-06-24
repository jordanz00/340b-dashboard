<?php
/**
 * Auto-publish Privacy Policy and Terms of Service pages.
 */

if (!defined('ABSPATH')) {
    exit;
}

class PA_Booking_Legal_Pages {
    /**
     * @return array<string, array{title: string, slug: string, content: string}>
     */
    public static function definitions() {
        return array(
            'privacy-policy' => array(
                'title'   => 'Privacy Policy',
                'slug'    => 'privacy-policy',
                'content' => self::privacy_content(),
            ),
            'terms-of-service' => array(
                'title'   => 'Terms of Service',
                'slug'    => 'terms-of-service',
                'content' => self::terms_content(),
            ),
        );
    }

    public static function ensure_all() {
        foreach (self::definitions() as $def) {
            self::ensure_page($def['title'], $def['slug'], $def['content']);
        }
    }

    private static function ensure_page($title, $slug, $content) {
        $existing = get_page_by_path($slug);
        if ($existing) {
            if ($existing->post_status !== 'publish') {
                wp_update_post(
                    array(
                        'ID'          => $existing->ID,
                        'post_status' => 'publish',
                    )
                );
            }
            return (int) $existing->ID;
        }

        $page_id = wp_insert_post(
            array(
                'post_title'   => $title,
                'post_name'    => $slug,
                'post_status'  => 'publish',
                'post_type'    => 'page',
                'post_content' => $content,
            ),
            true
        );

        return is_wp_error($page_id) ? 0 : (int) $page_id;
    }

    private static function privacy_content() {
        return <<<'HTML'
<!-- wp:heading -->
<h2 class="wp-block-heading">Privacy Policy</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Pennsylvania Media Arts LLC</strong> (“we,” “us,” “our”) operates <a href="https://pamedia.art">pamedia.art</a> and provides event photography, video production, live audio, and DJ services in Pennsylvania.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Effective date:</strong> June 18, 2026</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Information we collect</h3>
<!-- /wp:heading -->

<!-- wp:list -->
<ul>
<li><strong>Booking inquiries:</strong> name, email, phone, event date, venue, service type, and notes you submit through our booking form.</li>
<li><strong>Payments:</strong> deposit payments are processed by GoDaddy Payments or Stripe. We do not store full card numbers on our servers.</li>
<li><strong>Website usage:</strong> standard server logs and cookies from our hosting provider and WordPress (e.g. session, security).</li>
</ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">How we use information</h3>
<!-- /wp:heading -->

<!-- wp:list -->
<ul>
<li>Respond to booking requests and provide contracted services</li>
<li>Send confirmations, scheduling updates, and invoices</li>
<li>Process deposits and balances through our payment processor</li>
<li>Improve our website and client experience</li>
</ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Sharing</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>We do not sell your personal information. We share data only with service providers needed to run the business (e.g. Stripe for payments, email/hosting providers) and when required by law.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Retention</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>We retain booking and payment records as needed for contracts, taxes, and legal obligations.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Your choices</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>You may request access, correction, or deletion of personal information by emailing <a href="mailto:jordan@pamedia.art">jordan@pamedia.art</a>. We may retain certain records where required for tax or legal purposes.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Contact</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Pennsylvania Media Arts LLC</strong><br>New Cumberland, PA 17070<br><a href="mailto:jordan@pamedia.art">jordan@pamedia.art</a></p>
<!-- /wp:paragraph -->
HTML;
    }

    private static function terms_content() {
        return <<<'HTML'
<!-- wp:heading -->
<h2 class="wp-block-heading">Terms of Service</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>These Terms govern bookings and services provided by <strong>Pennsylvania Media Arts LLC</strong> (“Company,” “we,” “us”) through <a href="https://pamedia.art">pamedia.art</a> and related communications.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Effective date:</strong> June 18, 2026</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Services</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>We provide multimedia production services including event photography, videography, live audio/PA, and DJ services. Scope, deliverables, and timeline are defined in your written proposal, contract, or booking confirmation.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Bookings &amp; deposits</h3>
<!-- /wp:heading -->

<!-- wp:list -->
<ul>
<li>Submitting a booking request does not guarantee availability until we confirm in writing.</li>
<li>A deposit may be required to hold your date. Deposits apply toward your final balance unless stated otherwise.</li>
<li>Deposits are processed through GoDaddy Payments or Stripe. By paying, you agree to these Terms and our cancellation policy shown at checkout.</li>
</ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Cancellation</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>If we cannot accommodate your request, your deposit will be refunded. Cancellations within 14 days of your event may forfeit the deposit unless we agree otherwise in writing. Rescheduling is subject to availability.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Client responsibilities</h3>
<!-- /wp:heading -->

<!-- wp:list -->
<ul>
<li>Provide accurate event details, access, and reasonable cooperation on site</li>
<li>Secure any venue permits, performance rights, or releases required for your event</li>
<li>Pay remaining balance per your invoice terms</li>
</ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Intellectual property</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Unless your contract states otherwise, we retain copyright in raw and finished creative work until full payment is received. Upon full payment, you receive the usage rights described in your contract (typically personal/event use). Commercial or broadcast use may require a separate license.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Limitation of liability</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Our liability is limited to the fees paid for the specific service giving rise to the claim, except where prohibited by law. We are not liable for indirect, incidental, or consequential damages. We carry reasonable insurance for production work; certificates available upon request for venues.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Governing law</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>These Terms are governed by the laws of the Commonwealth of Pennsylvania. Disputes shall be resolved in courts located in Pennsylvania.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Contact</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Pennsylvania Media Arts LLC</strong><br>New Cumberland, PA 17070<br><a href="mailto:jordan@pamedia.art">jordan@pamedia.art</a><br><a href="https://pamedia.art/book/">Book online</a></p>
<!-- /wp:paragraph -->
HTML;
    }
}
