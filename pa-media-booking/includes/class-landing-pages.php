<?php
/**
 * Geo-service landing pages for Central PA SEO (human-approved copy).
 *
 * WHO THIS IS FOR: Organic search visitors with service + location intent.
 * WHAT IT DOES: Creates WP pages + shortcode-rendered content with FAQ and book CTA.
 * HOW IT CONNECTS: PA_Booking_Page_Setup::run(), PA_Booking_SEO meta/schema.
 */

if (!defined('ABSPATH')) {
    exit;
}

class PA_Booking_Landing_Pages {

    /**
     * Landing page definitions.
     *
     * @return array<string, array{title:string,slug:string,service:string,h1:string,lead:string,body:string[],faq:array<int,array{q:string,a:string}>,meta_title:string,meta_description:string}>
     */
    public static function definitions() {
        return array(
            'wedding-films-pennsylvania' => array(
                'title'            => 'Wedding Films Pennsylvania',
                'slug'             => 'services/wedding-films-pennsylvania',
                'service'          => 'Video Production',
                'city_group'       => 'Division hubs',
                'eyebrow'          => 'Wedding Films',
                'hero_image'       => 'media/lane-weddings.jpg',
                'hero_image_alt'   => 'Wedding film still from a Pennsylvania Media Arts production',
                'hub_children'     => array(
                    'harrisburg-wedding-videographer',
                    'wedding-videographer-york-pa',
                    'lancaster-wedding-photo-video',
                    'wedding-photographer-harrisburg',
                    'carlisle-wedding-photographer',
                    'wedding-dj-harrisburg-pa',
                    'wedding-dj-york-pa',
                    'premium-live-sound-central-pa',
                ),
                'h1'               => 'Wedding films for Pennsylvania couples',
                'lead'             => 'Cinematic films, photography, and photo + video collections — clear packages, one booking flow, and coverage rooted in Central PA.',
                'body'             => array(
                    'Your wedding day deserves more than a camera in the corner. We plan ceremony, speeches, dancing, and family moments into a film and photo set that still feels true years later.',
                    'Choose a Photo + Video Collection, Wedding Films, Wedding Photography, or Ceremony Audio — options matched to the day you are actually having, not a vague “full production” label.',
                    'Harrisburg, York, Lancaster, Carlisle, and nearby venues are our home market. Statewide travel is available when dates and logistics line up.',
                ),
                'offers'           => array(
                    array(
                        'label'   => 'Photo + Video Collection',
                        'blurb'   => 'Film and stills coordinated as one package — ceremony through reception.',
                        'service' => 'Photo + Video Bundle',
                        'featured'=> true,
                    ),
                    array(
                        'label'   => 'Wedding Films',
                        'blurb'   => 'Multi-camera films with pro audio for vows, speeches, and reception energy.',
                        'service' => 'Video Production',
                    ),
                    array(
                        'label'   => 'Wedding Photography',
                        'blurb'   => 'Editorial stills from getting ready through the last dance.',
                        'service' => 'Event Photography',
                    ),
                    array(
                        'label'   => 'Ceremony Audio',
                        'blurb'   => 'Clear vows and speeches — reinforcement and capture when you need it.',
                        'service' => 'Live Audio / PA',
                    ),
                ),
                'faq' => array(
                    array('q' => 'What wedding packages do you offer?', 'a' => 'Book Photo + Video Bundle for coordinated coverage, or book Video Production or Event Photography on their own. Ceremony audio is available via Live Audio / PA.'),
                    array('q' => 'How do we hold a Saturday?', 'a' => 'Check availability online, complete your deposit, and we confirm within one business day.'),
                ),
                'meta_title'       => 'Wedding Videographer Pennsylvania | Films & Photo',
                'meta_description' => 'Pennsylvania wedding videographer & photographer — Central PA films, photo + video collections, and ceremony audio. Check dates and hold yours online.',
            ),
            'commercial-video-pennsylvania' => array(
                'title'            => 'Commercial Video Production Pennsylvania',
                'slug'             => 'services/commercial-video-pennsylvania',
                'service'          => 'Video Production',
                'city_group'       => 'Division hubs',
                'eyebrow'          => 'Business Films',
                'hub_children'     => array(
                    'corporate-video-production-harrisburg',
                    'corporate-event-production-harrisburg',
                    'nonprofit-event-video-central-pa',
                    'event-videographer-harrisburg',
                    'event-photographer-harrisburg-pa',
                    'premium-live-sound-central-pa',
                ),
                'h1'               => 'Commercial video for Pennsylvania brands',
                'lead'             => 'Brand films, training and recruiting video, event coverage, and premium live sound for Central PA businesses.',
                'body'             => array(
                    'Pennsylvania Media Arts produces corporate and commercial media: multi-camera event coverage, brand stories, and photography with professional audio when your program needs it.',
                    'Monthly content retainers are available by custom proposal — note your goals when you book Video Production or email jordan@pamedia.art.',
                ),
                'offers'           => array(
                    array(
                        'label'   => 'Brand & Event Video',
                        'blurb'   => 'Recruiting, launches, and recaps with polished delivery.',
                        'service' => 'Video Production',
                        'featured'=> true,
                    ),
                    array(
                        'label'   => 'Business Photography',
                        'blurb'   => 'Leadership, events, and brand moments on a clear timeline.',
                        'service' => 'Event Photography',
                    ),
                    array(
                        'label'   => 'Premium Live Sound',
                        'blurb'   => 'Speech-first PA for keynotes, panels, and galas — attachable to video.',
                        'service' => 'Live Audio / PA',
                    ),
                ),
                'faq' => array(
                    array('q' => 'Do you work with marketing teams?', 'a' => 'Yes. We coordinate run-of-show, branding guidelines, and delivery formats your team can publish.'),
                    array('q' => 'Can you cover multi-day conferences?', 'a' => 'Yes. Quote your agenda and we plan crew, audio, and deliverables around your schedule.'),
                    array('q' => 'Do you provide live sound for corporate programs?', 'a' => 'Yes. Book Live Audio / PA alone or with Video Production for keynotes and stages that cannot fail.'),
                ),
                'meta_title'       => 'Commercial Video Production Pennsylvania | PA Media Arts',
                'meta_description' => 'Corporate video, photography, and premium live sound in Harrisburg and Central PA. Check dates and book Pennsylvania Media Arts online.',
            ),
            'live-event-production-pennsylvania' => array(
                'title'            => 'Live Event Production Pennsylvania',
                'slug'             => 'services/live-event-production-pennsylvania',
                'service'          => 'Video Production',
                'city_group'       => 'Division hubs',
                'eyebrow'          => 'Event Production',
                'hub_children'     => array(
                    'concert-videography-pennsylvania',
                    'hershey-event-videographer',
                    'corporate-event-production-harrisburg',
                    'live-sound-company-york-pa',
                    'dj-live-audio-central-pa',
                    'nonprofit-event-video-central-pa',
                ),
                'h1'               => 'Live event production across Pennsylvania',
                'lead'             => 'Conferences, concerts, galas, and festivals — video, live sound, DJ, and photography from one production team.',
                'body'             => array(
                    'Many crews specialize in only camera or only sound. Pennsylvania Media Arts sells complete event media production: synchronized video and professional audio, plus DJ and photography when your timeline needs it.',
                    'Explore location and genre pages below, then book the catalog service that matches your event.',
                ),
                'offers'           => array(
                    array(
                        'label'   => 'Event Videography',
                        'blurb'   => 'Multi-camera coverage with synced audio.',
                        'service' => 'Video Production',
                        'featured'=> true,
                    ),
                    array(
                        'label'   => 'Live Sound',
                        'blurb'   => 'PA and engineering on site for programs that matter.',
                        'service' => 'Live Audio / PA',
                    ),
                    array(
                        'label'   => 'DJ & MC',
                        'blurb'   => 'Reception and party programming with clear cues.',
                        'service' => 'DJ Services',
                    ),
                    array(
                        'label'   => 'Event Photography',
                        'blurb'   => 'Documentary coverage for guests and brands.',
                        'service' => 'Event Photography',
                    ),
                ),
                'faq' => array(
                    array('q' => 'What does “complete event production” include?', 'a' => 'Depending on booking: multi-camera video, live PA / capture, DJ/MC, and stills — coordinated on one timeline.'),
                    array('q' => 'Do you work concerts and corporate shows?', 'a' => 'Yes. We regularly cover live music and professional programs across Central PA.'),
                ),
                'meta_title'       => 'Live Event Production Pennsylvania | PA Media Arts',
                'meta_description' => 'Complete event production in Pennsylvania — multi-camera video, live sound, DJ, and photography. Check availability and hold your date online.',
            ),
            'audio-production-pennsylvania' => array(
                'title'            => 'Premium Live Sound Pennsylvania',
                'slug'             => 'services/audio-production-pennsylvania',
                'service'          => 'Live Audio / PA',
                'city_group'       => 'Division hubs',
                'eyebrow'          => 'Premium Live Sound',
                'hub_children'     => array(
                    'premium-live-sound-central-pa',
                    'live-sound-company-york-pa',
                    'dj-live-audio-central-pa',
                    'wedding-dj-harrisburg-pa',
                    'wedding-dj-york-pa',
                    'concert-videography-pennsylvania',
                ),
                'h1'               => 'Premium live sound for Pennsylvania events',
                'lead'             => 'Engineered reinforcement for keynotes, vows, worship, and stages — clear speech, controlled rooms, and clean capture when you need a recording.',
                'body'             => array(
                    'When speeches and performances matter, premium live sound is not an optional add-on. Pennsylvania Media Arts engineers reinforcement so vows, keynotes, and stages stay intelligible — then pairs cleanly with video when you want both.',
                    'Book Live Audio / PA for conferences, ceremonies, concerts, and galas. Add DJ Services when the night needs a programmed dance floor. Dates hold with a secure online deposit.',
                ),
                'offers'           => array(
                    array(
                        'label'   => 'Premium Live Audio / PA',
                        'blurb'   => 'Speech-first reinforcement and capture for rooms that cannot fail.',
                        'service' => 'Live Audio / PA',
                        'featured'=> true,
                    ),
                    array(
                        'label'   => 'DJ + Live Sound',
                        'blurb'   => 'Ceremony PA and reception programming on one timeline.',
                        'service' => 'DJ Services',
                    ),
                    array(
                        'label'   => 'Event Video + Audio',
                        'blurb'   => 'Synchronized multi-camera film with professional sound.',
                        'service' => 'Video Production',
                    ),
                ),
                'faq' => array(
                    array('q' => 'Who is premium live sound for?', 'a' => 'Corporate conferences, worship and outdoor ceremonies, concerts, and galas where speech intelligibility and mix control are non-negotiable.'),
                    array('q' => 'Can you reinforce and record the same event?', 'a' => 'Yes. Tell us your room and program when you book — we plan microphones, PA, and any recording needs together.'),
                    array('q' => 'Do you DJ and run PA together?', 'a' => 'Often. Many clients book DJ Services with Live Audio / PA for ceremony and reception coverage.'),
                ),
                'meta_title'       => 'Premium Live Sound Pennsylvania | PA & Ceremony Audio',
                'meta_description' => 'Premium live sound in Central PA — keynotes, vows, worship, and stages. Book Live Audio / PA online with a secure deposit.',
            ),
            'premium-live-sound-central-pa' => array(
                'title'            => 'Premium Live Sound — Central PA',
                'slug'             => 'services/premium-live-sound-central-pa',
                'service'          => 'Live Audio / PA',
                'city_group'       => 'Division hubs',
                'chip_label'       => 'Premium Live Sound',
                'eyebrow'          => 'Premium Live Sound',
                'h1'               => 'Premium live sound for Central PA venues',
                'lead'             => 'Engineered PA for conferences, worship, outdoor ceremonies, and stages across Harrisburg, York, Lancaster, Carlisle, and Hershey.',
                'body'             => array(
                    'Higher-stakes events pay for control: clear speech at the podium, stable wireless for hosts, and a mix that protects performers and guests. That is the job of premium live sound — not a generic “speaker rental.”',
                    'Pennsylvania Media Arts books Live Audio / PA from the same calendar as photo and video, so you can add capture or DJ without juggling three vendors. Hold the date online with a deposit; we confirm within one business day.',
                ),
                'offers'           => array(
                    array(
                        'label'   => 'Book Live Audio / PA',
                        'blurb'   => 'Reinforcement engineered for your room and run-of-show.',
                        'service' => 'Live Audio / PA',
                        'featured'=> true,
                    ),
                    array(
                        'label'   => 'Add Event Video',
                        'blurb'   => 'Multi-camera documentation synced to the audio plan.',
                        'service' => 'Video Production',
                    ),
                ),
                'faq' => array(
                    array('q' => 'Why book premium sound instead of venue house systems?', 'a' => 'House systems vary. We plan microphones, coverage, and operator attention around your program — especially when keynotes or vows cannot be missed.'),
                    array('q' => 'How do we hold a date?', 'a' => 'Check availability online, complete the secure deposit, and we confirm within one business day.'),
                ),
                'meta_title'       => 'Premium Live Sound Central PA | Event & Ceremony PA',
                'meta_description' => 'Premium live sound for Central PA conferences, worship, ceremonies, and stages. Book Live Audio / PA with a secure deposit.',
            ),
            'corporate-event-production-harrisburg' => array(
                'title'            => 'Corporate Event Production — Harrisburg',
                'slug'             => 'services/corporate-event-production-harrisburg',
                'service'          => 'Video Production',
                'h1'               => 'Corporate event photo & video in Harrisburg',
                'lead'             => 'Conferences, galas, and brand launches — professional capture and live sound for Central Pennsylvania venues.',
                'body'             => array(
                    'From keynote presentations to evening receptions, Pennsylvania Media Arts provides event photography, multi-camera video, and live audio reinforcement for corporate clients across the capital region.',
                    'We work with venues throughout Harrisburg, Carlisle, and Hershey — delivering edited highlight reels, full documentation, and secure file delivery for your marketing and internal teams.',
                ),
                'offers'           => array(
                    array(
                        'label'   => 'Event Video',
                        'blurb'   => 'Multi-camera coverage for conferences, galas, and brand moments.',
                        'service' => 'Video Production',
                        'featured'=> true,
                    ),
                    array(
                        'label'   => 'Event Photography',
                        'blurb'   => 'Leadership, stage, and reception stills on one timeline.',
                        'service' => 'Event Photography',
                    ),
                    array(
                        'label'   => 'Premium Live Sound',
                        'blurb'   => 'Clear keynotes and panels — reinforcement engineered for the room.',
                        'service' => 'Live Audio / PA',
                    ),
                ),
                'faq' => array(
                    array('q' => 'Do you provide live sound for corporate events?', 'a' => 'Yes. Our Live Audio / PA service includes wireless mics, monitoring, and an on-site engineer.'),
                    array('q' => 'How far in advance should we book?', 'a' => 'We recommend booking as soon as your date is set. Online booking requires at least 48 hours notice for new dates.'),
                ),
                'meta_title'       => 'Corporate Event Video & Sound Harrisburg | PA Media Arts',
                'meta_description' => 'Corporate event video, photography, and premium live sound in Harrisburg and Central PA. Book Pennsylvania Media Arts online.',
            ),
            'dj-live-audio-central-pa' => array(
                'title'            => 'DJ & Live Audio — Central PA',
                'slug'             => 'services/dj-live-audio-central-pa',
                'service'          => 'DJ Services',
                'h1'               => 'DJ & live sound services in Central PA',
                'lead'             => 'Wedding DJs, MC services, and full PA reinforcement for venues across Pennsylvania.',
                'body'             => array(
                    'Pennsylvania Media Arts provides professional DJ services with custom playlist planning, MC announcements, and dance-floor energy — plus live sound reinforcement for concerts, ceremonies, and corporate presentations.',
                    'We tailor PA systems to your venue size, provide wireless microphones, and handle setup and strike so you can focus on your guests.',
                ),
                'faq' => array(
                    array('q' => 'Can you DJ and run sound for the same event?', 'a' => 'Yes. Many clients book DJ Services alongside Live Audio / PA for full coverage.'),
                    array('q' => 'What areas do you serve?', 'a' => 'Central Pennsylvania including Harrisburg, York, Lancaster, Carlisle, and Hershey.'),
                ),
                'meta_title'       => 'Wedding DJ & Live Sound Central PA | PA Media Arts',
                'meta_description' => 'DJ services and live sound reinforcement for weddings and events in Central Pennsylvania. Book online with PA Media Arts.',
            ),
            'event-videographer-harrisburg' => array(
                'title'            => 'Event Videographer — Harrisburg',
                'slug'             => 'services/event-videographer-harrisburg',
                'service'          => 'Video Production',
                'h1'               => 'Event videographer in Harrisburg & Central PA',
                'lead'             => 'Multi-camera event video for weddings, concerts, galas, and brand stories — one team from capture through final edit.',
                'body'             => array(
                    'Pennsylvania Media Arts produces cinematic event video across the Harrisburg capital region and Central Pennsylvania. We plan shots around your run-of-show, capture keynote and performance moments, and deliver edited highlights your team can share.',
                    'From nonprofit galas to live music and corporate announcements, you get a single producer coordinating cameras, audio sync, and delivery timelines.',
                ),
                'faq' => array(
                    array('q' => 'Do you film concerts and live music?', 'a' => 'Yes. We regularly cover concerts and festivals across Central PA with multi-camera packages and live-sound coordination.'),
                    array('q' => 'How do we book a videographer?', 'a' => 'Choose Video Production online, pick your date, and secure your slot with a deposit. We confirm details within one business day.'),
                ),
                'meta_title'       => 'Event Videographer Harrisburg PA | PA Media Arts',
                'meta_description' => 'Professional event videography in Harrisburg and Central PA. Weddings, concerts, and corporate video — book Pennsylvania Media Arts online.',
            ),
            'concert-videography-pennsylvania' => array(
                'title'            => 'Concert Videography — Pennsylvania',
                'slug'             => 'services/concert-videography-pennsylvania',
                'service'          => 'Video Production',
                'h1'               => 'Concert & live music videography in Pennsylvania',
                'lead'             => 'Multi-camera concert capture with experienced live-sound coordination — trusted by artists and venues across Central PA.',
                'body'             => array(
                    'Pennsylvania Media Arts specializes in live music video: multi-camera angles, board feed when available, and highlight edits built for social and artist reels. Nominated for Best Videography at the 2026 Central Pennsylvania Music Awards.',
                    'We understand load-in windows, low-light stages, and fast turnarounds — so your performance looks as strong on screen as it did in the room.',
                ),
                'faq' => array(
                    array('q' => 'Can you combine concert video with photography?', 'a' => 'Yes. Book Photo + Video Bundle or add Event Photography to your video package for full coverage.'),
                    array('q' => 'Do you travel outside Central PA?', 'a' => 'Central PA is included in standard travel. Farther dates are quoted before you pay the balance.'),
                ),
                'meta_title'       => 'Concert Videography Pennsylvania | PA Media Arts',
                'meta_description' => 'Concert and live music videography across Pennsylvania. Multi-camera production from Pennsylvania Media Arts — book online.',
            ),
            'wedding-photographer-harrisburg' => array(
                'title'            => 'Wedding Photographer Harrisburg PA',
                'slug'             => 'services/wedding-photographer-harrisburg',
                'service'          => 'Event Photography',
                'h1'               => 'Wedding photographer in Harrisburg & Central PA',
                'lead'             => 'Story-driven wedding photography with fast online booking — ceremonies, receptions, and portraits across the capital region.',
                'body'             => array(
                    'Pennsylvania Media Arts photographs weddings throughout Harrisburg, Carlisle, Hershey, York, and Lancaster with a documentary-meets-cinematic style. We plan key moments with you ahead of time and deliver an online gallery for sharing with family.',
                    'Need video too? Add our Photo + Video Bundle for one coordinated team on your wedding day.',
                ),
                'faq' => array(
                    array('q' => 'How do I check your availability?', 'a' => 'Book online with a secure deposit at pamedia.art/book — your date is held once checkout completes.'),
                    array('q' => 'Do you travel to venues outside Harrisburg?', 'a' => 'Yes. Central Pennsylvania is included in standard travel.'),
                ),
                'meta_title'       => 'Wedding Photographer Harrisburg PA | PA Media Arts',
                'meta_description' => 'Wedding photographer serving Harrisburg, York, Lancaster, and Central PA. Book Pennsylvania Media Arts online with a secure deposit.',
            ),
            'nonprofit-event-video-central-pa' => array(
                'title'            => 'Nonprofit Event Video — Central PA',
                'slug'             => 'services/nonprofit-event-video-central-pa',
                'service'          => 'Video Production',
                'h1'               => 'Nonprofit & gala event video in Central PA',
                'lead'             => 'Fundraisers, galas, and community events — professional video that helps donors and stakeholders see your impact.',
                'body'             => array(
                    'Pennsylvania Media Arts produces highlight films and documentation for nonprofits across Harrisburg and Central Pennsylvania. We capture speeches, performances, and audience energy with discreet multi-camera coverage.',
                    'We work with your run-of-show, deliver files for social and annual reports, and can pair video with event photography on the same booking.',
                ),
                'faq' => array(
                    array('q' => 'Can you film indoor galas with low light?', 'a' => 'Yes. We use professional low-light cameras and on-site audio when needed.'),
                    array('q' => 'Do you offer nonprofit pricing?', 'a' => 'Contact us with your date and scope — we quote every project individually.'),
                ),
                'meta_title'       => 'Nonprofit Event Videographer Central PA | PA Media Arts',
                'meta_description' => 'Nonprofit and gala event videography in Harrisburg and Central PA. Request a quote or book Pennsylvania Media Arts online.',
            ),
            'live-sound-company-york-pa' => array(
                'title'            => 'Live Sound Company — York PA',
                'slug'             => 'services/live-sound-company-york-pa',
                'service'          => 'Live Audio / PA',
                'h1'               => 'Live sound & PA company serving York & Central PA',
                'lead'             => 'Wireless mics, PA reinforcement, and on-site audio engineers for weddings, concerts, and corporate events.',
                'body'             => array(
                    'Pennsylvania Media Arts provides professional live sound across York, Harrisburg, Lancaster, and Central Pennsylvania. We size PA systems to your venue, run line checks, and manage wireless microphones for ceremonies, speeches, and performances.',
                    'Pair Live Audio / PA with DJ Services or Video Production for one coordinated production team on event day.',
                ),
                'faq' => array(
                    array('q' => 'Do you provide sound for outdoor events?', 'a' => 'Yes. We bring appropriate PA coverage and power planning for outdoor ceremonies and festivals.'),
                    array('q' => 'Can you work with our venue\'s in-house system?', 'a' => 'Often yes — contact us with venue details and we will confirm scope before you book.'),
                ),
                'meta_title'       => 'Live Sound Company York PA | PA Media Arts',
                'meta_description' => 'Live sound and PA services in York, Harrisburg, and Central PA. Book Pennsylvania Media Arts for weddings, concerts, and corporate events.',
            ),
            'event-photographer-lancaster-pa' => array(
                'title'            => 'Event Photographer — Lancaster PA',
                'slug'             => 'services/event-photographer-lancaster-pa',
                'service'          => 'Event Photography',
                'h1'               => 'Event photographer in Lancaster & Central PA',
                'lead'             => 'Weddings, galas, and brand events — documentary-style photography with fast online gallery delivery.',
                'body'             => array(
                    'Pennsylvania Media Arts covers events throughout Lancaster County and the wider Central PA region. We capture candid moments, formal portraits, and key program highlights with a consistent, editorial look.',
                    'Need video on the same day? Book our Photo + Video Bundle for coordinated coverage and one producer contact.',
                ),
                'faq' => array(
                    array('q' => 'How soon do we receive photos?', 'a' => 'Timeline depends on package scope — we confirm delivery dates in your proposal after booking.'),
                    array('q' => 'Do you photograph corporate events in Lancaster?', 'a' => 'Yes. We regularly cover conferences, fundraisers, and brand activations across the region.'),
                ),
                'meta_title'       => 'Event Photographer Lancaster PA | PA Media Arts',
                'meta_description' => 'Event and wedding photography in Lancaster and Central PA. Request a quote or book Pennsylvania Media Arts online.',
            ),
            'wedding-videographer-york-pa' => array(
                'title'            => 'Wedding Videographer — York PA',
                'slug'             => 'services/wedding-videographer-york-pa',
                'service'          => 'Video Production',
                'h1'               => 'Wedding videographer in York & Central PA',
                'lead'             => 'Cinematic wedding films with thoughtful audio — ceremonies, receptions, and highlight edits you will share for years.',
                'body'             => array(
                    'Pennsylvania Media Arts produces wedding video across York, Harrisburg, Lancaster, and surrounding counties. We plan coverage around your timeline, capture vows and reception energy, and deliver edited films matched to your style.',
                    'Book video alone or add Event Photography / Photo + Video Bundle for complete wedding-day coverage.',
                ),
                'faq' => array(
                    array('q' => 'Can we book photo and video together?', 'a' => 'Yes — our Photo + Video Bundle coordinates both teams with one schedule and producer.'),
                    array('q' => 'How do we check your wedding date?', 'a' => 'Book online with a deposit or send a quote request — we confirm within one business day.'),
                ),
                'meta_title'       => 'Wedding Videographer York PA | PA Media Arts',
                'meta_description' => 'Wedding videography in York, Harrisburg, and Central PA. Book Pennsylvania Media Arts online or request a custom quote.',
            ),
            'wedding-dj-harrisburg-pa' => array(
                'title'            => 'Wedding DJ Harrisburg PA',
                'slug'             => 'services/wedding-dj-harrisburg-pa',
                'service'          => 'DJ Services',
                'city_group'       => 'Harrisburg area',
                'h1'               => 'Wedding DJ in Harrisburg & the capital region',
                'lead'             => 'Professional wedding DJ and MC services with custom playlists, wireless mics, and dance-floor energy across Central PA.',
                'body'             => array(
                    'Pennsylvania Media Arts DJs weddings throughout Harrisburg, Carlisle, Hershey, and surrounding venues. We plan your must-play list, handle introductions and timeline cues, and keep guests on the floor.',
                    'Need ceremony sound or reception PA? Pair DJ Services with Live Audio / PA for one production team on your wedding day.',
                ),
                'faq' => array(
                    array('q' => 'Do you MC weddings?', 'a' => 'Yes. We handle introductions, timeline announcements, and work with your planner or venue coordinator.'),
                    array('q' => 'Can you DJ and provide live sound?', 'a' => 'Yes — many couples book DJ Services plus Live Audio / PA for ceremonies and receptions.'),
                ),
                'meta_title'       => 'Wedding DJ Harrisburg PA | PA Media Arts',
                'meta_description' => 'Wedding DJ and MC services in Harrisburg, Carlisle, and Central PA. Book Pennsylvania Media Arts online with a secure deposit.',
            ),
            'event-photographer-harrisburg-pa' => array(
                'title'            => 'Event Photographer Harrisburg PA',
                'slug'             => 'services/event-photographer-harrisburg-pa',
                'service'          => 'Event Photography',
                'city_group'       => 'Harrisburg area',
                'h1'               => 'Event photographer in Harrisburg, PA',
                'lead'             => 'Weddings, galas, and corporate events — documentary-style photography with online gallery delivery.',
                'body'             => array(
                    'Pennsylvania Media Arts photographs events across the Harrisburg capital region: ceremonies, receptions, keynote sessions, and brand activations. We capture candid moments and formal portraits with a consistent editorial look.',
                    'Based in New Cumberland, we know Central PA venues and deliver galleries your team and guests can share quickly.',
                ),
                'faq' => array(
                    array('q' => 'Do you shoot corporate events in Harrisburg?', 'a' => 'Yes. We cover conferences, fundraisers, and executive announcements throughout the capital region.'),
                    array('q' => 'How do we book a photographer?', 'a' => 'Choose Event Photography online or send a quote request — we confirm within one business day.'),
                ),
                'meta_title'       => 'Event Photographer Harrisburg PA | PA Media Arts',
                'meta_description' => 'Event and wedding photography in Harrisburg and Central PA. Book Pennsylvania Media Arts online with a secure deposit.',
            ),
            'corporate-video-production-harrisburg' => array(
                'title'            => 'Corporate Video Production Harrisburg',
                'slug'             => 'services/corporate-video-production-harrisburg',
                'service'          => 'Video Production',
                'city_group'       => 'Harrisburg area',
                'h1'               => 'Corporate video production in Harrisburg',
                'lead'             => 'Conference video, brand stories, and executive messaging — multi-camera production for Central PA businesses.',
                'body'             => array(
                    'Pennsylvania Media Arts produces corporate video for Harrisburg-area companies: keynote capture, panel discussions, product launches, and recap films for marketing and internal comms.',
                    'We coordinate with your AV team, deliver edited highlights and full documentation, and can add Live Audio / PA when your venue needs reinforcement.',
                ),
                'faq' => array(
                    array('q' => 'Do you film multi-day conferences?', 'a' => 'Yes. Quote your run-of-show and dates — we plan crew and deliverables around your schedule.'),
                    array('q' => 'Can you add photography?', 'a' => 'Yes. Book Event Photography alongside video for complete event coverage.'),
                ),
                'meta_title'       => 'Corporate Video Production Harrisburg PA | PA Media Arts',
                'meta_description' => 'Corporate video production in Harrisburg and Central PA. Conferences, brand films, and event recap video from Pennsylvania Media Arts.',
            ),
            'harrisburg-wedding-videographer' => array(
                'title'            => 'Harrisburg Wedding Videographer',
                'slug'             => 'services/harrisburg-wedding-videographer',
                'service'          => 'Video Production',
                'city_group'       => 'Harrisburg area',
                'h1'               => 'Harrisburg wedding videographer',
                'lead'             => 'Cinematic wedding films for ceremonies and receptions across the capital region — one producer from planning through final edit.',
                'body'             => array(
                    'Pennsylvania Media Arts is a Harrisburg-area wedding videographer trusted by couples across Dauphin, Cumberland, and Perry counties. We capture vows, speeches, and reception energy with multi-camera coverage and thoughtful audio.',
                    'Add Event Photography or book our Photo + Video Bundle for coordinated wedding-day coverage with one timeline.',
                ),
                'faq' => array(
                    array('q' => 'What is included in wedding video?', 'a' => 'Scope is confirmed in your proposal after booking — typically highlight film plus ceremony/reception coverage based on hours booked.'),
                    array('q' => 'How far in advance should we book?', 'a' => 'Popular Saturdays fill early. Book online with a deposit to hold your date.'),
                ),
                'meta_title'       => 'Harrisburg Wedding Videographer | PA Media Arts',
                'meta_description' => 'Harrisburg wedding videography for ceremonies and receptions. Book Pennsylvania Media Arts online or get a custom quote.',
            ),
            'carlisle-wedding-photographer' => array(
                'title'            => 'Carlisle Wedding Photographer',
                'slug'             => 'services/carlisle-wedding-photographer',
                'service'          => 'Event Photography',
                'city_group'       => 'Harrisburg area',
                'h1'               => 'Carlisle wedding photographer',
                'lead'             => 'Wedding and event photography in Carlisle and Cumberland County — story-driven stills with fast gallery delivery.',
                'body'             => array(
                    'Pennsylvania Media Arts photographs weddings and events throughout Carlisle, Boiling Springs, and Cumberland County. We plan key moments with you and deliver an online gallery for family and friends.',
                    'Serving the wider Harrisburg–Carlisle corridor, we travel to your venue with professional gear and a calm, organized approach on wedding day.',
                ),
                'faq' => array(
                    array('q' => 'Do you travel to Carlisle venues?', 'a' => 'Yes. Carlisle and Cumberland County are within our standard Central PA travel area.'),
                    array('q' => 'Can we add wedding video?', 'a' => 'Yes — book Photo + Video Bundle or add Video Production to your photography package.'),
                ),
                'meta_title'       => 'Carlisle Wedding Photographer | PA Media Arts',
                'meta_description' => 'Wedding photographer serving Carlisle and Cumberland County PA. Book Pennsylvania Media Arts online.',
            ),
            'hershey-event-videographer' => array(
                'title'            => 'Hershey Event Videographer',
                'slug'             => 'services/hershey-event-videographer',
                'service'          => 'Video Production',
                'city_group'       => 'Harrisburg area',
                'h1'               => 'Event videographer in Hershey, PA',
                'lead'             => 'Corporate events, galas, and celebrations in Hershey and Dauphin County — multi-camera video with professional audio.',
                'body'             => array(
                    'Pennsylvania Media Arts films events in Hershey, Hummelstown, and across Dauphin County. From hotel ballrooms to outdoor venues, we capture program highlights and deliver edited films for marketing and archives.',
                    'We regularly work Hershey-area corporate clients and private events — one team for video, and optional photography or live sound on the same booking.',
                ),
                'faq' => array(
                    array('q' => 'Do you film at Hershey lodge and hotel venues?', 'a' => 'Yes. We are experienced with large hotel ballrooms and coordinate with venue AV when needed.'),
                    array('q' => 'How do we get a quote?', 'a' => 'Send your date and venue through our quote form or book online if your package is set.'),
                ),
                'meta_title'       => 'Hershey Event Videographer | PA Media Arts',
                'meta_description' => 'Event and corporate videography in Hershey and Dauphin County PA. Pennsylvania Media Arts — book online.',
            ),
            'wedding-dj-york-pa' => array(
                'title'            => 'Wedding DJ York PA',
                'slug'             => 'services/wedding-dj-york-pa',
                'service'          => 'DJ Services',
                'city_group'       => 'York & Lancaster',
                'h1'               => 'Wedding DJ in York, PA',
                'lead'             => 'Wedding DJ and MC for York County venues — custom music, wireless mics, and a packed dance floor.',
                'body'             => array(
                    'Pennsylvania Media Arts provides wedding DJ services across York, Red Lion, Dallastown, and York County. We build your playlist, manage timeline cues, and keep energy high from first dance to last song.',
                    'Pair with Live Audio / PA for outdoor ceremonies or venues that need full sound reinforcement.',
                ),
                'faq' => array(
                    array('q' => 'Do you travel to York County?', 'a' => 'Yes. York and Lancaster counties are core service areas for Pennsylvania Media Arts.'),
                    array('q' => 'Can you DJ and photograph our wedding?', 'a' => 'We recommend booking DJ Services with our Photo + Video team for coordinated coverage.'),
                ),
                'meta_title'       => 'Wedding DJ York PA | PA Media Arts',
                'meta_description' => 'Wedding DJ services in York PA and York County. Book Pennsylvania Media Arts online with a secure deposit.',
            ),
            'drone-aerial-photography-central-pa' => array(
                'title'            => 'Drone & Aerial Photography — Central PA',
                'slug'             => 'services/drone-aerial-photography-central-pa',
                'service'          => 'Event Photography',
                'city_group'       => 'Central PA & statewide',
                'h1'               => 'Drone & aerial photography in Central PA',
                'lead'             => 'FAA-compliant aerial photo and video for weddings, real estate, events, and brand stories across Pennsylvania.',
                'body'             => array(
                    'Pennsylvania Media Arts adds cinematic aerial perspectives to weddings, corporate events, and marketing projects throughout Harrisburg, York, Lancaster, and Central PA. Drone coverage is added to photography or video packages where airspace and venue rules allow.',
                    'We handle pre-flight planning and deliver edited aerial stills or video matched to your overall project style.',
                ),
                'faq' => array(
                    array('q' => 'Can you fly drones at my venue?', 'a' => 'We check FAA airspace and venue policy before flight day. Some downtown or restricted areas may limit operations.'),
                    array('q' => 'Is drone included in every package?', 'a' => 'Drone is quoted as an add-on based on location, duration, and deliverables.'),
                ),
                'meta_title'       => 'Drone Photography Central PA | PA Media Arts',
                'meta_description' => 'Drone and aerial photography in Harrisburg, York, Lancaster, and Central PA. Add aerial coverage to your event package.',
            ),
            'lancaster-wedding-photo-video' => array(
                'title'            => 'Lancaster Wedding Photo & Video',
                'slug'             => 'services/lancaster-wedding-photo-video',
                'service'          => 'Photo + Video Bundle',
                'city_group'       => 'York & Lancaster',
                'h1'               => 'Lancaster wedding photography & videography',
                'lead'             => 'One coordinated photo and video team for Lancaster County weddings — book online with a secure deposit.',
                'body'             => array(
                    'Pennsylvania Media Arts covers Lancaster weddings with matched photography and cinematic video. One timeline, one producer contact, and deliverables designed to work together.',
                    'From barn venues to downtown Lancaster celebrations, we serve couples across Lancaster County and the wider Central PA region.',
                ),
                'faq' => array(
                    array('q' => 'Why book photo and video together?', 'a' => 'Coordinated teams avoid duplicate shots, share lighting plans, and deliver a consistent story in stills and film.'),
                    array('q' => 'Do you serve Lancaster barn venues?', 'a' => 'Yes. We regularly work rustic and farm venues throughout Lancaster County.'),
                ),
                'meta_title'       => 'Lancaster Wedding Photographer & Videographer | PA Media Arts',
                'meta_description' => 'Lancaster wedding photography and videography — one team. Book Pennsylvania Media Arts Photo + Video Bundle online.',
            ),
        );
    }

    /**
     * Infer SEO city group for internal linking when not set on a definition.
     *
     * @param array<string, mixed> $def
     * @return string
     */
    private static function city_group_for_definition($def) {
        if (!empty($def['city_group'])) {
            return (string) $def['city_group'];
        }
        $hay = strtolower(($def['h1'] ?? '') . ' ' . ($def['slug'] ?? '') . ' ' . ($def['meta_title'] ?? ''));
        if (preg_match('/\b(york|lancaster)\b/', $hay)) {
            return 'York & Lancaster';
        }
        if (preg_match('/\b(harrisburg|carlisle|hershey|new cumberland|cumberland|dauphin|capital)\b/', $hay)) {
            return 'Harrisburg area';
        }
        if (preg_match('/\b(pennsylvania|statewide|concert|central pa)\b/', $hay)) {
            return 'Central PA & statewide';
        }
        return 'Central PA & statewide';
    }

    /**
     * Grouped public URLs for hub page, homepage, and footer SEO mesh.
     *
     * @return array<string, array<int, array{label:string,url:string}>>
     */
    public static function grouped_public_links() {
        $groups = array(
            'Harrisburg area'        => array(),
            'York & Lancaster'       => array(),
            'Central PA & statewide' => array(),
        );
        foreach (self::definitions() as $def) {
            $page = get_page_by_path($def['slug']);
            if (!$page || $page->post_status !== 'publish') {
                continue;
            }
            $group = self::city_group_for_definition($def);
            if (!isset($groups[$group])) {
                $groups[$group] = array();
            }
            $groups[$group][] = array(
                'label' => $def['h1'],
                'url'   => get_permalink($page),
            );
        }
        return array_filter($groups, function ($links) {
            return !empty($links);
        });
    }

    /**
     * @param string $slug Post name (last segment).
     */
    public static function is_landing_slug($slug) {
        foreach (self::definitions() as $def) {
            $parts = explode('/', trim($def['slug'], '/'));
            $leaf = end($parts);
            if ($leaf === $slug) {
                return true;
            }
        }
        return false;
    }

    /**
     * Full landing definition for the current singular page.
     *
     * @return array<string, mixed>|null
     */
    public static function definition_for_current_page() {
        if (!is_singular('page')) {
            return null;
        }
        $post = get_queried_object();
        if (!$post instanceof WP_Post) {
            return null;
        }
        foreach (self::definitions() as $def) {
            $parts = explode('/', trim($def['slug'], '/'));
            $leaf = end($parts);
            if ($post->post_name === $leaf) {
                return $def;
            }
        }
        return null;
    }

    /**
     * Public URLs for geo landing pages (internal linking).
     *
     * @return array<int, array{label:string,url:string}>
     */
    public static function public_links() {
        $out = array();
        foreach (self::definitions() as $def) {
            $page = get_page_by_path($def['slug']);
            if (!$page || $page->post_status !== 'publish') {
                continue;
            }
            $out[] = array(
                'label' => $def['h1'],
                'url'   => get_permalink($page),
            );
        }
        return $out;
    }

    /**
     * Meta for current landing page.
     *
     * @return array{title:string,description:string,og_alt:string,robots:string}|null
     */
    public static function meta_for_current_page() {
        if (!is_singular('page')) {
            return null;
        }
        $post = get_queried_object();
        if (!$post instanceof WP_Post) {
            return null;
        }
        foreach (self::definitions() as $def) {
            $parts = explode('/', trim($def['slug'], '/'));
            $leaf = end($parts);
            if ($post->post_name === $leaf) {
                return array(
                    'title'       => $def['meta_title'],
                    'description' => $def['meta_description'],
                    'og_alt'      => $def['h1'],
                    'robots'      => 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
                );
            }
        }
        return null;
    }

    /**
     * Create landing pages on plugin setup.
     */
    public static function ensure_all() {
        foreach (self::definitions() as $key => $def) {
            self::ensure_page($key, $def);
        }
        if (get_option('pa_landing_retire_marker') !== PA_BOOKING_VERSION) {
            $existing = get_option('pa_retired_landing_slugs', array());
            if (!is_array($existing)) {
                $existing = array();
            }
            update_option(
                'pa_retired_landing_slugs',
                array_values(array_unique(array_merge($existing, array('wedding-photo-video-central-pa')))),
                false
            );
            add_action('shutdown', array(__CLASS__, 'retire_removed'), 0);
        }
    }

    /**
     * Unpublish geo landing pages removed from definitions (404 for visitors).
     */
    public static function retire_removed() {
        $active_keys = array_keys(self::definitions());
        $retired_slugs = array();
        $services_parent = get_page_by_path('services');
        if ($services_parent) {
            $children = get_posts(
                array(
                    'post_type'      => 'page',
                    'post_parent'    => (int) $services_parent->ID,
                    'posts_per_page' => -1,
                    'post_status'    => array('publish', 'private'),
                )
            );
            foreach ($children as $page) {
                if (!preg_match('/\[pa_geo_landing\s+key="([^"]+)"/', $page->post_content, $matches)) {
                    continue;
                }
                $key = sanitize_key($matches[1]);
                if (in_array($key, $active_keys, true)) {
                    continue;
                }
                $retired_slugs[] = $page->post_name;
                self::unpublish_landing_page((int) $page->ID);
            }
        }
        $legacy = get_page_by_path('services/wedding-photo-video-central-pa');
        if ($legacy && $legacy->post_status === 'publish') {
            $retired_slugs[] = $legacy->post_name;
            self::unpublish_landing_page((int) $legacy->ID);
        }
        if ($retired_slugs) {
            $existing = get_option('pa_retired_landing_slugs', array());
            if (!is_array($existing)) {
                $existing = array();
            }
            update_option('pa_retired_landing_slugs', array_values(array_unique(array_merge($existing, $retired_slugs))), false);
        }
        update_option('pa_landing_retire_marker', PA_BOOKING_VERSION, false);
    }

    /**
     * @param int $page_id
     */
    private static function unpublish_landing_page($page_id) {
        if ($page_id < 1) {
            return;
        }
        wp_update_post(
            array(
                'ID'          => $page_id,
                'post_status' => 'draft',
            )
        );
    }

    /**
     * @param string $key
     * @param array<string, mixed> $def
     */
    private static function ensure_page($key, $def) {
        $parts = explode('/', trim($def['slug'], '/'));
        $leaf = end($parts);
        $parent_path = count($parts) > 1 ? $parts[0] : '';
        $parent_id = 0;
        if ($parent_path !== '') {
            $parent = get_page_by_path($parent_path);
            if (!$parent) {
                $parent_id = wp_insert_post(
                    array(
                        'post_title'  => ucfirst($parent_path),
                        'post_name'   => $parent_path,
                        'post_status' => 'publish',
                        'post_type'   => 'page',
                        'post_content' => '',
                    ),
                    true
                );
                if (is_wp_error($parent_id)) {
                    $parent_id = 0;
                }
            } else {
                $parent_id = (int) $parent->ID;
            }
        }

        $existing = get_page_by_path($def['slug']);
        $content = '<!-- wp:shortcode -->' . "\n[pa_geo_landing key=\"" . esc_attr($key) . "\"]\n" . '<!-- /wp:shortcode -->';

        if ($existing) {
            if ($existing->post_status !== 'publish') {
                wp_update_post(array('ID' => $existing->ID, 'post_status' => 'publish'));
            }
            if (strpos($existing->post_content, '[pa_geo_landing') === false) {
                wp_update_post(array('ID' => $existing->ID, 'post_content' => $content));
            }
            return (int) $existing->ID;
        }

        $page_id = wp_insert_post(
            array(
                'post_title'   => $def['title'],
                'post_name'    => $leaf,
                'post_parent'  => $parent_id,
                'post_status'  => 'publish',
                'post_type'    => 'page',
                'post_content' => $content,
            ),
            true
        );
        return is_wp_error($page_id) ? 0 : (int) $page_id;
    }

    /**
     * City names for Service schema areaServed on a landing definition.
     *
     * @param array<string, mixed> $def
     * @return array<int, string>
     */
    public static function area_cities_for_definition($def) {
        $slug = (string) ($def['slug'] ?? '');
        if (strpos($slug, 'harrisburg') !== false || strpos($slug, 'hershey') !== false || strpos($slug, 'carlisle') !== false) {
            return array('Harrisburg', 'Carlisle', 'Hershey', 'Camp Hill', 'Mechanicsburg', 'New Cumberland');
        }
        if (strpos($slug, 'york') !== false) {
            return array('York', 'Lancaster', 'Hanover', 'Gettysburg');
        }
        if (strpos($slug, 'lancaster') !== false) {
            return array('Lancaster', 'York', 'Lititz', 'Ephrata');
        }
        if (strpos($slug, 'concert') !== false || strpos($slug, 'pennsylvania') !== false) {
            return array('Harrisburg', 'York', 'Lancaster', 'Carlisle', 'Hershey', 'State College', 'Reading');
        }
        return array('Harrisburg', 'York', 'Lancaster', 'Carlisle', 'Hershey', 'New Cumberland', 'Mechanicsburg');
    }

    /**
     * Short chip/label for related-link UI (avoid full SEO H1 strings).
     *
     * @param array<string, mixed> $def
     * @param string               $key
     * @return string
     */
    public static function chip_label_for_def($def, $key = '') {
        if (!empty($def['chip_label'])) {
            return (string) $def['chip_label'];
        }
        $title = (string) ($def['title'] ?? '');
        if ($title !== '' && strlen($title) <= 42) {
            return $title;
        }
        $h1 = (string) ($def['h1'] ?? '');
        if ($h1 === '') {
            $h1 = $title !== '' ? $title : (string) $key;
        }
        if (preg_match('/\b(Harrisburg|York|Lancaster|Carlisle|Hershey|Central PA)\b/i', $h1, $m)) {
            $city = $m[1];
            $lower = strtolower($h1 . ' ' . $key);
            if (strpos($lower, 'dj') !== false) {
                return $city . ' · DJ';
            }
            if (strpos($lower, 'photo') !== false && strpos($lower, 'video') === false && strpos($lower, 'film') === false) {
                return $city . ' · Photo';
            }
            if (strpos($lower, 'video') !== false || strpos($lower, 'film') !== false) {
                return $city . ' · Film';
            }
            return $city;
        }
        if (strlen($h1) > 48) {
            return wp_html_excerpt($h1, 46, '…');
        }
        return $h1;
    }

    /**
     * Related landing pages in the same market (internal linking, reduces orphan/thin signals).
     *
     * @param string $key
     * @param int    $limit
     * @return array<int, array{label:string,url:string}>
     */
    public static function related_links_for_key($key, $limit = 4) {
        $defs = self::definitions();
        if (!isset($defs[$key])) {
            return array();
        }
        $def = $defs[$key];
        if (!empty($def['hub_children']) && is_array($def['hub_children'])) {
            $out = array();
            foreach ($def['hub_children'] as $child_key) {
                $child_key = sanitize_key((string) $child_key);
                if ($child_key === '' || !isset($defs[$child_key])) {
                    continue;
                }
                $child = $defs[$child_key];
                $out[] = array(
                    'label' => self::chip_label_for_def($child, $child_key),
                    'url'   => home_url('/' . ltrim((string) $child['slug'], '/') . '/'),
                );
                if (count($out) >= 12) {
                    break;
                }
            }
            return $out;
        }
        $current = $defs[$key];
        $current_slug = (string) $current['slug'];
        $current_service = (string) ($current['service'] ?? '');
        $scored = array();

        foreach ($defs as $other_key => $def) {
            if ($other_key === $key) {
                continue;
            }
            $page = get_page_by_path($def['slug']);
            if (!$page || $page->post_status !== 'publish') {
                continue;
            }
            $score = 0;
            $other_slug = (string) $def['slug'];
            if ($current_service !== '' && ($def['service'] ?? '') === $current_service) {
                $score += 3;
            }
            foreach (array('harrisburg', 'york', 'lancaster', 'carlisle', 'hershey', 'central-pa', 'pennsylvania') as $token) {
                if (strpos($current_slug, $token) !== false && strpos($other_slug, $token) !== false) {
                    $score += 2;
                }
            }
            if ($score > 0) {
                $scored[] = array(
                    'score' => $score,
                    'label' => $def['h1'],
                    'url'   => get_permalink($page),
                );
            }
        }

        usort(
            $scored,
            function ($a, $b) {
                return $b['score'] <=> $a['score'];
            }
        );

        $out = array();
        foreach ($scored as $row) {
            $out[] = array(
                'label' => $row['label'],
                'url'   => $row['url'],
            );
            if (count($out) >= $limit) {
                break;
            }
        }
        return $out;
    }

    /**
     * FAQs shown on page (definition + universal booking FAQ).
     *
     * @param array<string, mixed> $def
     * @return array<int, array{q:string,a:string}>
     */
    public static function faq_for_display($def) {
        $faq = isset($def['faq']) && is_array($def['faq']) ? $def['faq'] : array();
        $book = add_query_arg('start', '1', PA_Booking_Frontend::book_url());
        $universal = array(
            array(
                'q' => 'How do I book and hold my date?',
                'a' => 'Choose your service at pamedia.art/book, select your date, and complete the secure deposit online. Your date is held once checkout completes.',
            ),
            array(
                'q' => 'What is included with a deposit?',
                'a' => 'Your deposit reserves your date on our calendar and applies toward your final balance. We confirm details within one business day.',
            ),
        );
        $seen = array();
        $out = array();
        foreach (array_merge($faq, $universal) as $item) {
            $q = isset($item['q']) ? (string) $item['q'] : '';
            if ($q === '' || isset($seen[$q])) {
                continue;
            }
            $seen[$q] = true;
            $out[] = array('q' => $q, 'a' => (string) ($item['a'] ?? ''));
        }
        return $out;
    }

    /**
     * Register shortcode.
     */
    public static function register_shortcode() {
        add_shortcode('pa_geo_landing', array(__CLASS__, 'render_shortcode'));
        add_action('template_redirect', array(__CLASS__, 'block_retired_landings'), 1);
    }

    /**
     * 404 for geo landing pages removed from definitions (even if WP page still exists).
     */
    public static function block_retired_landings() {
        if (!is_singular('page')) {
            return;
        }
        $post = get_queried_object();
        if (!$post instanceof WP_Post) {
            return;
        }
        $retired = get_option('pa_retired_landing_slugs', array());
        if (!is_array($retired)) {
            $retired = array();
        }
        if (in_array($post->post_name, $retired, true)) {
            wp_safe_redirect(home_url('/services/'), 301);
            exit;
        }
        if (!preg_match('/\[pa_geo_landing\s+key="([^"]+)"/', $post->post_content, $matches)) {
            return;
        }
        $key = sanitize_key($matches[1]);
        if (isset(self::definitions()[$key])) {
            return;
        }
        wp_safe_redirect(home_url('/services/'), 301);
        exit;
    }

    /**
     * Build a booking URL for a catalog service name.
     *
     * @param string $service Catalog API service string
     * @return string
     */
    public static function book_url_for_service($service) {
        return add_query_arg(
            array(
                'start'      => '1',
                'service'    => (string) $service,
                'utm_source' => 'geo_landing',
            ),
            PA_Booking_Frontend::book_url()
        );
    }

    /**
     * @param array<string, string> $atts
     * @return string
     */
    public static function render_shortcode($atts) {
        $atts = shortcode_atts(array('key' => ''), $atts, 'pa_geo_landing');
        $defs = self::definitions();
        $key = sanitize_key($atts['key']);
        if ($key === '' || !isset($defs[$key])) {
            return '';
        }
        $def = $defs[$key];
        $is_hub = !empty($def['hub_children']) && is_array($def['hub_children']);
        $book = self::book_url_for_service((string) ($def['service'] ?? ''));
        $work = PA_Booking_Frontend::work_url();
        $email = sanitize_email(PA_Booking::get_settings()['notify_email'] ?? 'jordan@pamedia.art');
        $hub = home_url('/services/');
        $related = self::related_links_for_key($key, 4);
        $services = home_url('/services/');
        $eyebrow = (string) ($def['eyebrow'] ?? '');
        if ($eyebrow === '') {
            $eyebrow = !empty($def['city_group']) && $def['city_group'] !== 'Division hubs'
                ? (string) $def['city_group']
                : 'Pennsylvania Media Arts';
        }
        $crumb_label = (string) ($def['title'] ?? $def['h1'] ?? 'Services');
        $offers = (!empty($def['offers']) && is_array($def['offers'])) ? $def['offers'] : array();
        $article_class = 'pa-geo-landing alignwide' . ($is_hub ? ' pa-geo-landing--hub' : ' pa-geo-landing--spoke');

        ob_start();
        ?>
        <article class="<?php echo esc_attr($article_class); ?>" aria-labelledby="pa-geo-landing-title">
            <nav class="pa-geo-landing__crumbs" aria-label="Breadcrumb">
                <ol>
                    <li><a href="<?php echo esc_url(home_url('/')); ?>">Home</a></li>
                    <li><a href="<?php echo esc_url($services); ?>">Services</a></li>
                    <li aria-current="page"><?php echo esc_html($crumb_label); ?></li>
                </ol>
            </nav>

            <header class="pa-geo-landing__hero">
                <p class="pa-geo-landing__eyebrow"><?php echo esc_html($eyebrow); ?></p>
                <h1 id="pa-geo-landing-title" class="pa-geo-landing__title"><?php echo esc_html($def['h1']); ?></h1>
                <p class="pa-geo-landing__lead"><?php echo esc_html($def['lead']); ?></p>
                <div class="pa-geo-landing__hero-actions">
                    <a class="pa-geo-landing__cta pa2-cta__btn pa2-cta__btn--primary" href="<?php echo esc_url($book); ?>">Check dates &amp; pricing</a>
                    <a class="pa-geo-landing__cta-secondary pa2-cta__btn pa2-cta__btn--secondary" href="<?php echo esc_url($work); ?>">View our work</a>
                </div>
                <?php
                $hero_image = (string) ($def['hero_image'] ?? '');
                if ($hero_image !== '') :
                    $hero_src = PA_BOOKING_URL . 'assets/' . ltrim($hero_image, '/');
                    $hero_webp = preg_replace('/\.(jpe?g|png)$/i', '.webp', $hero_src);
                    $hero_alt = (string) ($def['hero_image_alt'] ?? $def['h1']);
                    ?>
                    <figure class="pa-geo-landing__hero-media">
                        <picture>
                            <?php if (is_string($hero_webp) && $hero_webp !== $hero_src) : ?>
                                <source srcset="<?php echo esc_url($hero_webp); ?>" type="image/webp" />
                            <?php endif; ?>
                            <img src="<?php echo esc_url($hero_src); ?>" alt="<?php echo esc_attr($hero_alt); ?>" width="1600" height="900" loading="eager" decoding="async" fetchpriority="high" />
                        </picture>
                    </figure>
                <?php endif; ?>
            </header>

            <?php if ($offers) : ?>
                <section class="pa-geo-landing__offers" aria-labelledby="pa-geo-offers-title">
                    <div class="pa-geo-landing__section-head">
                        <h2 id="pa-geo-offers-title">Choose how you want to start</h2>
                        <p class="pa-geo-landing__section-lead">Each path opens the same booking calendar with the right package selected.</p>
                    </div>
                    <ul class="pa-geo-landing__offer-grid">
                        <?php foreach ($offers as $offer) :
                            $label = (string) ($offer['label'] ?? '');
                            $blurb = (string) ($offer['blurb'] ?? '');
                            $svc = (string) ($offer['service'] ?? ($def['service'] ?? ''));
                            if ($label === '' || $svc === '') {
                                continue;
                            }
                            $featured = !empty($offer['featured']);
                            $card_class = 'pa-geo-landing__offer' . ($featured ? ' is-featured' : '');
                            $offer_url = self::book_url_for_service($svc);
                            ?>
                            <li>
                                <a class="<?php echo esc_attr($card_class); ?>" href="<?php echo esc_url($offer_url); ?>">
                                    <?php if ($featured) : ?>
                                        <span class="pa-geo-landing__offer-badge">Recommended</span>
                                    <?php endif; ?>
                                    <span class="pa-geo-landing__offer-title"><?php echo esc_html($label); ?></span>
                                    <?php if ($blurb !== '') : ?>
                                        <span class="pa-geo-landing__offer-blurb"><?php echo esc_html($blurb); ?></span>
                                    <?php endif; ?>
                                    <span class="pa-geo-landing__offer-action">Book this package</span>
                                </a>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </section>
            <?php endif; ?>

            <div class="pa-geo-landing__panel pa-geo-landing__body">
                <?php foreach ($def['body'] as $para) : ?>
                    <p><?php echo esc_html($para); ?></p>
                <?php endforeach; ?>
            </div>

            <section class="pa-geo-landing__faq" aria-labelledby="pa-geo-faq-title">
                <div class="pa-geo-landing__section-head">
                    <h2 id="pa-geo-faq-title">Frequently asked questions</h2>
                </div>
                <div class="pa-geo-landing__faq-list">
                    <?php foreach (self::faq_for_display($def) as $item) : ?>
                        <details class="pa-geo-landing__faq-item">
                            <summary><?php echo esc_html($item['q']); ?></summary>
                            <p><?php echo esc_html($item['a']); ?></p>
                        </details>
                    <?php endforeach; ?>
                </div>
            </section>

            <div class="pa-geo-landing__cta-band">
                <p class="pa-geo-landing__cta-band-copy">Ready to hold a date? Check availability and secure your deposit online.</p>
                <div class="pa-geo-landing__cta-wrap">
                    <a class="pa-geo-landing__cta pa2-cta__btn pa2-cta__btn--primary" href="<?php echo esc_url($book); ?>">Book &amp; hold your date</a>
                    <a class="pa-geo-landing__cta-secondary pa2-cta__btn pa2-cta__btn--secondary" href="<?php echo esc_url($work); ?>">View our work</a>
                </div>
            </div>

            <?php if ($related) : ?>
                <section class="pa-geo-landing__related" aria-labelledby="pa-geo-related-title">
                    <div class="pa-geo-landing__section-head">
                        <h2 id="pa-geo-related-title"><?php echo $is_hub ? 'Browse by city &amp; specialty' : 'Related services in Central PA'; ?></h2>
                        <?php if ($is_hub) : ?>
                            <p class="pa-geo-landing__section-lead">Location pages for couples and planners comparing options nearby.</p>
                        <?php endif; ?>
                    </div>
                    <ul class="pa-geo-landing__related-list">
                        <?php foreach ($related as $link) : ?>
                            <li><a class="pa-geo-landing__chip" href="<?php echo esc_url($link['url']); ?>"><?php echo esc_html($link['label']); ?></a></li>
                        <?php endforeach; ?>
                    </ul>
                </section>
            <?php endif; ?>

            <p class="pa-geo-landing__links">
                <a href="<?php echo esc_url($hub); ?>">All services</a>
                · <a href="<?php echo esc_url($work); ?>">Portfolio</a>
                <?php if ($email) : ?>
                    · <a href="mailto:<?php echo esc_attr($email); ?>"><?php echo esc_html($email); ?></a>
                <?php endif; ?>
            </p>
        </article>
        <?php
        return (string) ob_get_clean();
    }
}
