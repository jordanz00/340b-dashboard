/**
 * HAP Regulatory Advocacy 2026 — content + verified sources.
 * Brand colors: HAP Corporate Branding Guidelines (April 2025 PDF) via branding-hap-2025.css
 * Do not add statistics without a primary public citation (or explicit HAP-letter attribution for quotes).
 *
 * Power BI / semantic layer: quantified rows include metricKey, valueNumeric, valueUnit (and optional
 * valueDisplay, supplementalMetrics) aligned with powerbi/metric-registry.json (dashboardScope REG_ADVOCACY_2026).
 * RegAdvocacyDataLayer (reg-advocacy-data-layer.js) flattens these for Gold-shaped exports.
 */
(function () {
  'use strict';

  var DATA = {
    hero: {
      headline:
        'Three near-term opportunities to reduce regulatory burden for Pennsylvania hospitals',
      ctas: [
        { label: 'Construction & plan review', href: '#construction', pillIcon: 'facilities' },
        { label: 'Credential across a system', href: '#credentialing', pillIcon: 'workforce' },
        { label: 'Surgery centers: one survey path', href: '#asf', pillIcon: 'policydoc' }
      ]
    },
    /** Five-second scan: plain-language themes from the letter—respectful, partnership tone with DOH. */
    atAGlance: [
      {
        iconKind: 'facilities',
        title: 'Buildings',
        line:
          'Invite clearer, written guidance on routine maintenance vs. full plan review—and a predictable way for DSI and DAAC to coordinate so hospitals hear one consistent story.'
      },
      {
        iconKind: 'workforce',
        title: 'People',
        line:
          'Where Medicare and state rules already allow it, explore options so related hospitals can use one shared credentialing path—less duplicate paperwork for physicians, same focus on patient safety.'
      },
      {
        iconKind: 'policydoc',
        title: 'Surveys',
        line:
          'Consider whether strong national accreditation could reduce redundant on-site surveys for outpatient surgery centers when Pennsylvania law permits a practical, patient-safe approach.'
      }
    ],
    /** At-a-glance PA hospital context — figures verified on cited pages (not from the April 2026 letter). */
    heroKpis: [
      {
        id: 'hk-econ',
        value: '$195.4B',
        glance: 'Hospitals are a huge slice of Pennsylvania’s economy.',
        iconKind: 'dollar',
        label: 'Money hospitals add to Pennsylvania’s economy',
        sub:
          'HAP’s April 2025 statewide release reports this total from FY 2024 hospital fiscal-year data—direct hospital activity plus estimated ripple effects on suppliers and communities (same figure and methodology summarized on HAP’s Community Impact materials).',
        topic: 'finance',
        sentiment: 'positive',
        sourceId: 'hap-economic-fy2024',
        metricKey: 'REG_ADV_PA_HOSPITAL_ECONOMIC_CONTRIBUTION_USD_BILLIONS',
        valueNumeric: 195.4,
        valueUnit: 'USD_BILLIONS'
      },
      {
        id: 'hk-phc4',
        value: '51%',
        glance: 'More than half of general hospitals lost money on operations in one state count.',
        iconKind: 'trendDown',
        label: 'General hospitals lost money on day-to-day operations',
        sub: 'PHC4 (Pennsylvania Health Care Cost Containment Council), FY 2023: share of Pennsylvania general acute-care hospitals that lost money on operations. Different report and year than HAP’s FY 2024 “in the red” count in the blue band.',
        topic: 'risk',
        sentiment: 'negative',
        sourceId: 'phc4-fy23-margin',
        metricKey: 'REG_ADV_PHC4_GAC_NEGATIVE_OPERATING_MARGIN_PCT',
        valueNumeric: 51,
        valueUnit: 'PERCENT'
      },
      {
        id: 'hk-turn',
        value: '19%',
        glance: 'Turnover dipped when hospitals invested in pay, training, and schedules.',
        iconKind: 'trendUp',
        label: 'Hospitals cut care-team turnover',
        sub:
          '2024 vs. prior year — hospitals in a joint survey (HAP, LeadingAge PA, PHCA) reported about one-fifth less turnover after steps like pay, training, and scheduling flexibility. PHCA’s April 2, 2025 summary cites the survey fielded November 2024–January 2025.',
        topic: 'access',
        sentiment: 'positive',
        sourceId: 'phca-workforce-2025',
        metricKey: 'REG_ADV_PA_WORKFORCE_TURNOVER_REDUCTION_PCT',
        valueNumeric: 19,
        valueUnit: 'PERCENT'
      }
    ],
    glossary: [
      {
        term: 'HAP',
        iconKind: 'hapMark',
        text: 'The Hospital and Healthsystem Association of Pennsylvania—the group that speaks for Pennsylvania hospitals and sent the April 16, 2026 letter to DOH.'
      },
      {
        term: 'DOH',
        iconKind: 'shield',
        text: 'Pennsylvania Department of Health—the state office that licenses hospitals and outpatient surgery centers (ASFs) and checks that rules are followed.'
      },
      {
        term: 'DSI',
        iconKind: 'blueprint',
        text: 'Division of Safety Inspection—DOH staff who check building and fire-safety plans when a project needs that review.'
      },
      {
        term: 'DAAC',
        iconKind: 'stethoscope',
        text: 'Division of Acute and Ambulatory Care—DOH staff who handle on-site hospital licensing visits and related licensing topics.'
      },
      {
        term: 'ASF / ASC',
        iconKind: 'surgery',
        text: 'Ambulatory surgical facility (ASF) is Pennsylvania’s licensed name for many outpatient surgery centers. ASC is the common Medicare term for the same type of site.'
      },
      {
        term: 'PHC4',
        iconKind: 'chart',
        text: 'Pennsylvania Health Care Cost Containment Council — independent state agency that publishes hospital financial reports (including operating margins).'
      },
      {
        term: 'Pa. Code',
        iconKind: 'scroll',
        text: 'Pennsylvania Code — the official publication of Pennsylvania’s regulations. “28 Pa. Code” is the chapter that covers health care facility rules.'
      },
      {
        term: '“Deemed status” (plain English)',
        iconKind: 'checkDouble',
        text: 'When a trusted national survey can stand in for part of a state survey, so a good facility is not checked twice the same way when the law allows.'
      }
    ],
    letterContext: {
      dateDisplay: 'April 16, 2026',
      letterhead: 'The Hospital and Healthsystem Association of Pennsylvania (HAP)',
      recipient:
        'The Honorable Dr. Debra Bogen, Secretary of Health, Pennsylvania Department of Health, Health and Welfare Building, 625 Forster Street, 8th Floor West, Harrisburg, PA 17120',
      recipientLines: [
        'The Honorable Dr. Debra Bogen',
        'Secretary of Health',
        'Pennsylvania Department of Health',
        'Health and Welfare Building',
        '625 Forster Street, 8th Floor West',
        'Harrisburg, PA 17120'
      ],
      sender: 'Nicole Stallings, President & CEO, The Hospital and Healthsystem Association of Pennsylvania',
      signatureOrgLine: 'The Hospital and Healthsystem Association of Pennsylvania',
      subject: 'Three near-term opportunities to reduce regulatory burden (April 16, 2026 letter)',
      salutation: 'Dear Secretary Bogen:',
      note:
        'Letter summary: HAP thanks DOH for past collaboration, notes full hospital licensure modernization may not arrive until about 2029, and asks for three practical steps this year—clearer construction and plan-review coordination (DSI and DAAC), streamlined credentialing across hospital systems, and a sensible path for outpatient surgery center surveys when strong accreditation already exists.'
    },
    letterQuotes: [
      {
        text:
          'Given the implications of this timeline, we are requesting consideration of immediate opportunities to remove regulatory burdens that stand in the way of quality care. HAP and the hospital community have identified three priorities, (detailed in the attached) that will eliminate administrative requirements that increase costs while yielding little to no impact on patient safety. We believe these three issues can be resolved this year.'
      },
      {
        text:
          'Pennsylvania is home to some of the nation’s leaders in health care innovation. Improvements to the regulatory landscape would enable hospitals to reallocate resources currently tied to managing outdated systems to efforts aimed at leveraging cutting edge technologies, improving patient care, and better utilizing our health care workforce.'
      }
    ],
    /** Executive KPI strip — public citations only. Not the April 2026 letter’s three regulatory “asks.” */
    statBand: [
      {
        id: 'sb-econ',
        iconKind: 'dollar',
        value: '$195.4B',
        label: 'Total contribution to state and local economies',
        caption:
          'Hospital spending plus estimated ripple effects across suppliers and communities. HAP’s statewide model uses FY 2024 hospital fiscal data, published in its April 2025 public release.',
        sourceNote: 'Open HAP economic release',
        sourceId: 'hap-economic-fy2024',
        ban: { mode: 'none' },
        metricKey: 'REG_ADV_PA_HOSPITAL_ECONOMIC_CONTRIBUTION_USD_BILLIONS',
        valueNumeric: 195.4,
        valueUnit: 'USD_BILLIONS'
      },
      {
        id: 'sb-jobs',
        iconKind: 'jobs',
        value: '785,715',
        label: 'Jobs tied to hospitals statewide',
        caption: 'Roughly one in eight Pennsylvania jobs—same HAP FY 2024 analysis and April 2025 release as the figure above.',
        sourceNote: 'Open same HAP release',
        sourceId: 'hap-economic-fy2024',
        ban: { mode: 'int', end: 785715, suffix: '', prefix: '' },
        metricKey: 'REG_ADV_PA_HOSPITAL_JOBS_FROM_HAP_MODEL',
        valueNumeric: 785715,
        valueUnit: 'COUNT'
      },
      {
        id: 'sb-red',
        iconKind: 'trendDown',
        value: '37%',
        label: 'Acute hospitals “in the red” on day-to-day operations',
        caption:
          'HAP’s FY 2024 acute-care hospital tally (April 2025 release). This is not the same definition or year as PHC4’s operating-margin share in the next card.',
        sourceNote: 'Open HAP release',
        sourceId: 'hap-economic-fy2024',
        ban: { mode: 'int', end: 37, suffix: '%', prefix: '' },
        metricKey: 'REG_ADV_PA_ACUTE_HOSPITALS_OPERATING_IN_RED_PCT',
        valueNumeric: 37,
        valueUnit: 'PERCENT'
      },
      {
        id: 'sb-phc4',
        iconKind: 'pie',
        value: '51%',
        label: 'PHC4: negative operating margin (general acute care)',
        caption:
          'Pennsylvania Health Care Cost Containment Council, FY 2023 (Volume One). Different agency, metric, and year than HAP’s 37% “in the red” count.',
        sourceNote: 'Open PHC4 FY 2023 release',
        sourceId: 'phc4-fy23-margin',
        ban: { mode: 'int', end: 51, suffix: '%', prefix: '' },
        metricKey: 'REG_ADV_PHC4_GAC_NEGATIVE_OPERATING_MARGIN_PCT',
        valueNumeric: 51,
        valueUnit: 'PERCENT'
      },
      {
        id: 'sb-members',
        iconKind: 'hospital',
        value: '235+',
        label: 'HAP member hospitals and health systems',
        caption:
          'Public membership scale for the association. The April 16, 2026 letter to DOH cites 235 hospitals in that membership context.',
        sourceNote: 'Open HAP membership page',
        sourceId: 'hap-membership',
        ban: { mode: 'int', end: 235, suffix: '+', prefix: '' },
        metricKey: 'REG_ADV_HAP_MEMBER_HOSPITALS_MIN_COUNT',
        valueNumeric: 235,
        valueUnit: 'COUNT',
        valueDisplay: '235+'
      },
      {
        id: 'sb-1982',
        iconKind: 'calendar',
        value: '1982',
        label: 'Pa. Code anchor (hospital regulations)',
        caption:
          '28 Pa. Code § 101.56 includes a December 1982 adoption note in the authority section—context for how long some rules have been on the books; read the Code for the operative text.',
        sourceNote: 'Open Pa. Code § 101.56',
        sourceId: 'pa-code-101-56',
        ban: { mode: 'int', end: 1982, suffix: '', prefix: '' },
        metricKey: 'REG_ADV_PA_CODE_HOSPITAL_REG_ANCHOR_YEAR',
        valueNumeric: 1982,
        valueUnit: 'YEAR'
      }
    ],
    compareRows: [
      {
        issueIcon: 'calendar',
        issue: 'Doctor re-checks',
        pa: 'PA: re-approve doctors on staff at least every 2 years.',
        federal: 'Medicare / accreditors: often up to 3 years when state law allows.',
        hap: 'HAP: match the longer cycle when it is still safe for patients.'
      },
      {
        issueIcon: 'workforce',
        issue: 'One credentialing path',
        pa: 'PA: each licensed hospital may repeat paperwork—even under one owner.',
        federal: 'Medicare: one shared process for related hospitals when state and local rules allow.',
        hap: 'HAP: tell PA clearly how systems may centralize credentialing.'
      },
      {
        issueIcon: 'surgery',
        issue: 'Surgery center visits',
        pa: 'PA: ASFs renew yearly with a yearly DOH on-site visit.',
        federal: 'Medicare: outpatient surgery centers on a multi-year check rhythm.',
        hap: 'HAP: let strong accreditation count for part of state renewal when law allows.'
      },
      {
        issueIcon: 'policydoc',
        issue: 'Survey “double duty”',
        pa: 'PA: Act 60 cut some duplicate hospital surveys; ASFs stay on a stricter track.',
        federal: 'Other states: many cite accreditors in rules; lists change—verify each state.',
        hap: 'HAP: policy or law so ASFs get the same flex when it is safe.'
      },
      {
        issueIcon: 'blueprint',
        issue: 'Building plan reviews',
        pa: 'PA: DSI (plans / fire) and DAAC (licensing)—when full plans are needed can feel fuzzy.',
        federal: 'US: building and fire codes still apply; question is when full architect plans are required.',
        hap: 'HAP: written rules plus DSI–DAAC coordination so sites are not ping-ponged.'
      }
    ],
    /**
     * Twenty-one-state compiled footprint (USPS) for the national map — not one static TJC row.
     * Built by deduplicating state names explicitly printed on The Joint Commission Ambulatory
     * “State & Payer Recognitions” page for three pathways: Anthem (IngenioRX) medical groups (14),
     * Highmark ambulatory contracting/credentialing (4), and Centene PCMH incentive states (17).
     * Recognition mixes licensure substitution, credentialing, contracting, and payer rules;
     * exact membership shifts if payer-only rows are excluded. TJC treats these lists as informational.
     * Methodology and list finalized for this dashboard: April 16, 2026 (HAP regulatory advocacy context).
     * @see https://www.jointcommission.org/en-us/accreditation/ambulatory-health-care/state-payer-recognitions
     * @see https://www.jointcommission.org/en-us/about-us/why-choose-us/state-recognitions
     */
    jcAmbulatoryRecognizedAbbr: [
      'AZ',
      'CA',
      'CO',
      'CT',
      'DE',
      'GA',
      'IL',
      'IN',
      'IA',
      'KY',
      'LA',
      'ME',
      'MD',
      'MS',
      'MO',
      'NE',
      'NV',
      'NH',
      'NM',
      'NY',
      'OH'
    ],
    statesCallout: {
      lead: 'Across the country',
      big: '21',
      body:
        'HAP’s letter notes other states already lean on The Joint Commission’s ambulatory program to cut duplicate surveys. This map shows 21 states on one transparent compiled list from TJC’s public payer blocks—it is a snapshot for context, not a substitute for checking each state yourself.',
      sourceId: 'jc-ambulatory-compiled-21',
      act60SourceId: 'pa-act-60',
      metricKey: 'REG_ADV_JC_AMBULATORY_COMPILED_STATE_COUNT',
      valueNumeric: 21,
      valueUnit: 'COUNT'
    },
    impactTiles: [
      {
        iconTopic: 'brand',
        rowIcon: 'community',
        dotLabel: 'Bright spot',
        title: '$10.8B in community benefit',
        body: 'HAP’s April 2025 public release on FY 2024 hospital data reports hospitals invested nearly $10.8 billion in strengthening community health (charity care, training, research, and more).',
        sourceId: 'hap-economic-fy2024',
        metricKey: 'REG_ADV_PA_HOSPITAL_COMMUNITY_BENEFIT_USD_BILLIONS',
        valueNumeric: 10.8,
        valueUnit: 'USD_BILLIONS'
      },
      {
        iconTopic: 'policy',
        rowIcon: 'scale',
        dotLabel: 'Cited report',
        title: 'Fewer than half with sustainable margins',
        body: 'HAP’s April 2025 release summarizing FY 2024 acute-care hospital finances: fewer than half operated with margins necessary for long-term stability; 37% operated in the red; 39% faced multi-year losses.',
        sourceId: 'hap-economic-fy2024',
        metricKey: 'REG_ADV_PA_ACUTE_HOSPITALS_OPERATING_IN_RED_PCT',
        valueNumeric: 37,
        valueUnit: 'PERCENT',
        supplementalMetrics: [
          {
            metricKey: 'REG_ADV_PA_ACUTE_HOSPITALS_MULTI_YEAR_LOSS_PCT',
            valueNumeric: 39,
            valueUnit: 'PERCENT',
            chipLabel: 'multi-year losses (same HAP FY24 release)',
            sourceId: 'hap-economic-fy2024'
          }
        ]
      },
      {
        iconTopic: 'policy',
        rowIcon: 'pie',
        dotLabel: 'PHC4 data',
        title: '51% negative operating margin (GAC, FY23)',
        body: 'PHC4 Volume One (FY 2023): 51% of Pennsylvania’s general acute care hospitals posted a negative operating margin—distinct metric and year from HAP’s FY 2024 acute-care figures.',
        sourceId: 'phc4-fy23-margin',
        metricKey: 'REG_ADV_PHC4_GAC_NEGATIVE_OPERATING_MARGIN_PCT',
        valueNumeric: 51,
        valueUnit: 'PERCENT'
      },
      {
        iconTopic: 'access',
        rowIcon: 'hospital',
        dotLabel: 'Membership',
        title: '235+ hospital & health system members',
        body: 'HAP’s public membership description reflects statewide representation for advocacy and technical support.',
        sourceId: 'hap-membership',
        metricKey: 'REG_ADV_HAP_MEMBER_HOSPITALS_MIN_COUNT',
        valueNumeric: 235,
        valueUnit: 'COUNT',
        valueDisplay: '235+'
      },
      {
        iconTopic: 'policy',
        rowIcon: 'clipboard',
        dotLabel: 'Pa. Code',
        title: 'Two-year limit on physician reapproval',
        body: 'Pennsylvania regulations say hospitals must formally re-approve physicians on the medical staff at least every two years—more often than many national accreditor defaults, which adds committee burden.',
        sourceId: 'pa-code-107-5'
      },
      {
        iconTopic: 'finance',
        rowIcon: 'invoice',
        dotLabel: 'Licensing cycle',
        title: 'Outpatient surgery centers: yearly paperwork',
        body: 'Ambulatory surgical facilities file a renewal every year, pay a published state fee, and must be ready for an annual licensing visit under Pennsylvania’s rules.',
        sourceId: 'pa-code-551-34'
      }
    ],
    priorities: [
      {
        id: 'construction',
        deckIcon: 'facilities',
        topic: 'access',
        cardNum: '01',
        badge: 'Facilities',
        badgeTone: 'teal',
        stripLabel: 'Friction',
        factsBandLabel: 'Evidence',
        recLabel: 'HAP request to DOH',
        title: 'One playbook for DSI and DAAC',
        tagline:
          'Safety inspection and acute/ambulatory licensing are separate DOH lanes—without written thresholds and a single coordination path, hospitals get routed twice for the same project.',
        priorityStrip:
          'Minor work can still trigger full plan packages when criteria are unclear—adding cost and slowing beds, equipment, and renovation timelines.',
        letterExcerpt:
          'Pennsylvania is home to some of the nation’s leaders in health care innovation.',
        paragraphs: [
          'HAP’s April 16, 2026 letter asks DOH for clear written rules and a real DSI–DAAC path so building and licensing reviews line up and projects do not stall.'
        ],
        miniFacts: [
          {
            value: 'Two',
            unit: 'divisions',
            label: 'DSI: plans and fire safety. DAAC: licensing and on-site inspections. One patient-safety story should not require two incompatible answers.',
            linkLabel: 'HAP letter',
            sourceId: 'hap-letter-2026'
          },
          {
            value: 'Ch. 151/153',
            unit: 'Pa. Code',
            label: 'Hospital construction and safety are already in the Code—HAP is asking for operational guidance that matches how facilities actually maintain buildings.',
            linkLabel: 'Pa. Code TOC',
            sourceId: 'pa-code-151-toc'
          },
          {
            value: 'Guidance',
            unit: 'first',
            label: 'Written criteria and coordination before new legislation—same safety expectations, less ambiguity.',
            linkLabel: 'HAP letter',
            sourceId: 'hap-letter-2026'
          }
        ],
        recommendation:
          'Publish a short rubric (when full DSI review is required, when maintenance is enough, who owns each question) plus a formal DSI–DAAC coordination path so hospitals are not the go-between.',
        eyebrow: 'Priority 1',
        deckTitle: 'Construction & facility projects',
        deckKicker: 'Priority 1',
        deckBan: 'Plan review · Licensing',
        deckHandleSub:
          'DSI (Division of Safety Inspection): plans and fire-safety review. DAAC (Division of Acute & Ambulatory Care): licensing and on-site inspections.',
        deckPlainAsk:
          'Publish written criteria for when full plan review is required versus routine maintenance, and define how DSI and DAAC coordinate so hospitals are not passed between two DOH teams.',
        deckLine: 'Clearer rules and one coordinated path reduce delays to care.',
        summary: '',
        bullets: [],
        callout: {
          label: 'Why it matters',
          text: 'When buildings wait, new beds and equipment wait too—and that is real care delayed.',
          tone: 'negative'
        }
      },
      {
        id: 'credentialing',
        deckIcon: 'workforce',
        topic: 'policy',
        cardNum: '02',
        badge: 'Credentialing',
        badgeTone: 'blue',
        stripLabel: 'Friction',
        factsBandLabel: 'Evidence',
        recLabel: 'HAP request to DOH',
        title: 'One medical-staff process across a system',
        tagline:
          'Related hospitals under common control still repeat credentialing packets site-by-site even when Medicare contemplates a unified path where state law permits.',
        priorityStrip:
          'Pennsylvania’s two-year physician reappointment floor can be tighter than common federal and accreditor cadence—multiplying committee work without a proportional safety gain.',
        letterExcerpt:
          'Improvements to the regulatory landscape would enable hospitals to reallocate resources currently tied to managing outdated systems to efforts aimed at leveraging cutting edge technologies, improving patient care, and better utilizing our health care workforce.',
        paragraphs: [
          'Pennsylvania must re-approve doctors on staff at least every two years—often faster than the three-year path Medicare and many accreditors use. HAP’s April 16, 2026 letter asks DOH for policy or a simple exception so one system can run one credentialing process when it is still safe.'
        ],
        miniFacts: [
          {
            value: '2 years',
            unit: 'minimum',
            label: 'Pa. Code § 107.5: hospitals must reappoint physicians to the medical staff at least every two years.',
            linkLabel: '§ 107.5',
            sourceId: 'pa-code-107-5'
          },
          {
            value: '42 CFR',
            unit: '§ 482.22',
            label: 'Medicare: optional unified or integrated medical staff for related hospitals when state and local requirements allow.',
            linkLabel: 'e-CFR',
            sourceId: 'cfr-482-22'
          },
          {
            value: '≈3 years',
            unit: 'typical',
            label: 'Many accreditors use longer re-privileging cycles where regulation permits; Pennsylvania remains the backstop when its law is stricter.',
            linkLabel: 'Joint Commission FAQ',
            sourceId: 'jc-ms-faq'
          }
        ],
        recommendation:
          'Issue policy, guidance, or a structured exception so systems can centralize credentialing and use the longer federal reappointment cycle when Pennsylvania is the stricter layer but safety still fits.',
        eyebrow: 'Priority 2',
        deckTitle: 'Medical staff across a system',
        deckKicker: 'Priority 2',
        deckBan: 'System credentialing',
        deckHandleSub:
          'One credentialing process for related hospitals under common control when Medicare and Pennsylvania law permit.',
        deckPlainAsk:
          'Issue policy or a structured exception so a health system may centralize medical-staff credentialing and, where appropriate for patient safety, align Pennsylvania’s two-year reappointment minimum with longer federal and accreditor cycles.',
        deckLine: 'Fewer redundant files; standards for privileging stay intact.',
        summary: '',
        bullets: [],
        callout: {
          label: 'Federal anchor',
          text: 'Medicare describes an optional shared medical staff for related hospitals when state and local law allow.',
          sourceId: 'cfr-482-22',
          tone: 'positive'
        }
      },
      {
        id: 'asf',
        deckIcon: 'policydoc',
        topic: 'finance',
        cardNum: '03',
        badge: 'Outpatient ASFs',
        badgeTone: 'orange',
        stripLabel: 'Friction',
        factsBandLabel: 'Evidence',
        recLabel: 'HAP request to DOH',
        title: 'ASF surveys aligned with accreditation',
        tagline:
          'National accreditation already demonstrates quality; an automatic full DOH on-site survey every year can duplicate that work when statute and patient safety allow a blended approach.',
        priorityStrip:
          'Act 60 gave hospitals more flexibility in 2013; ASFs still operate on an annual renewal and visit cadence that can outpace how peer states use deemed-status concepts.',
        letterExcerpt:
          'The financial and administrative burden of the outdated hospital licensure regulations continues to impede the ability of hospitals to efficiently deliver care.',
        paragraphs: [
          'Other states lean on The Joint Commission’s ambulatory program so DOH does not repeat the same visit. HAP’s April 16, 2026 letter asks DOH for a clear policy—or a legislative path—so accreditation can count for part of ASF renewal when law allows.'
        ],
        miniFacts: [
          {
            value: 'Act 60',
            unit: '2013',
            label: 'Pennsylvania already used accreditation-aware flex for hospitals in limited contexts; ASFs have not received the same design space.',
            linkLabel: 'Act 60',
            sourceId: 'pa-act-60'
          },
          {
            value: 'Annual',
            unit: 'cadence',
            label: 'Pa. Code still ties ASF renewal to yearly paperwork and a yearly on-site DOH visit.',
            linkLabel: '§ 551.53',
            sourceId: 'pa-code-551-53'
          },
          {
            value: '$250',
            unit: 'fee',
            label: 'Published ASF renewal filing fee (context for annual administrative load).',
            linkLabel: '§ 551.34',
            sourceId: 'pa-code-551-34'
          }
        ],
        recommendation:
          'Issue policy—or support a bill—so deemed status can cover the right parts of ASF renewal surveys when law allows (the letter’s third recommendation).',
        eyebrow: 'Priority 3',
        deckTitle: 'Ambulatory surgery centers',
        deckKicker: 'Priority 3',
        deckBan: 'ASF renewal · Surveys',
        deckHandleSub: 'Ambulatory surgical facilities (ASFs): Pennsylvania-licensed outpatient surgery centers.',
        deckPlainAsk:
          'Where national accreditation demonstrates quality, avoid an automatic duplicate DOH on-site survey each year—through policy or legislation comparable to hospital deemed-status flex when state law allows.',
        deckLine: 'Let accreditation inform renewal; align state surveys with demonstrated risk.',
        summary: '',
        bullets: [],
        callout: {
          label: 'Pa. Code anchor',
          text: 'ASF rules still describe annual renewals and an annual on-site DOH visit.',
          sourceId: 'pa-code-551-53',
          tone: 'neutral'
        }
      }
    ],
    sources: [
      {
        id: 'hap-economic-fy2024',
        shortTitle: 'HAP — Economic & community benefit news release (FY 2024 data; April 2025)',
        publisher: 'The Hospital and Healthsystem Association of Pennsylvania',
        url: 'https://www.haponline.org/News/Media/News-Releases/pennsylvanians-see-billions-in-economic-community-benefits-from-hospitals-in-their-communities-1',
        accessedNote:
          'HAP’s public release describes analysis of fiscal year (FY) 2024 hospital data (not FY 2025). Figures quoted there include $195.4B economic contribution; 785,715 jobs; $62.8B wages; $10.8B community benefit; 37% in the red; 39% multi-year losses; fewer than half with sustainable margins. Deep analysis landing: About PA Hospitals → Community Impact.'
      },
      {
        id: 'hap-community-impact',
        shortTitle: 'HAP — Community Impact (FY 2024 data; analysis landing)',
        publisher: 'The Hospital and Healthsystem Association of Pennsylvania',
        url: 'https://www.haponline.org/About-PA-Hospitals/Community-Impact',
        accessedNote: 'Companion landing page linked from HAP’s April 2025 news release on FY 2024 hospital economic and community benefit figures.'
      },
      {
        id: 'phc4-fy23-margin',
        shortTitle: 'PHC4 — Financial Analysis Fiscal Year 2023 (news release)',
        publisher: 'Pennsylvania Health Care Cost Containment Council',
        url: 'https://phc4.org/news-and-press-releases/financial-analysis-fiscal-year-2023',
        accessedNote: 'States 51% of Pennsylvania GAC hospitals posted a negative operating margin in FY23 (Volume One).'
      },
      {
        id: 'phca-workforce-2025',
        shortTitle: 'PHCA — Workforce survey press release (April 2025; 2024 hospital turnover finding)',
        publisher: 'Pennsylvania Health Care Association',
        url: 'https://phca.org/news-post/health-care-workforce-shortages-strain-access-to-care/',
        accessedNote:
          'Dated April 2, 2025. States the survey was conducted November 2024 through January 2025 by HAP, LeadingAge PA, and PHCA, and that hospitals reduced care team turnover by 19 percent in 2024. Workforce Survey 2025 PDF is linked from that page.'
      },
      {
        id: 'hap-membership',
        shortTitle: 'HAP — Membership in HAP',
        publisher: 'The Hospital and Healthsystem Association of Pennsylvania',
        url: 'https://www.haponline.org/About-HAP/Membership-in-HAP',
        accessedNote: 'Public membership description (hospital/health system member scale).'
      },
      {
        id: 'hap-letter-2026',
        shortTitle: 'HAP — April 16, 2026 regulatory priorities letter (correspondence)',
        publisher: 'The Hospital and Healthsystem Association of Pennsylvania',
        url: '',
        accessedNote:
          'Letter excerpts and narrative on this dashboard track the April 16, 2026 HAP letter to Secretary Bogen (construction DSI/DAAC, system credentialing, ASF deemed status). Add a public URL here when posted.'
      },
      {
        id: 'pa-code-101-56',
        shortTitle: '28 Pa. Code § 101.56',
        publisher: 'Pennsylvania Code & Bulletin',
        url: 'https://www.pacodeandbulletin.gov/Display/pacode?file=/secure/pacode/data/028/chapter101/s101.56.html&d=reduce',
        accessedNote: 'Authority section notes adoption December 3, 1982, effective December 4, 1982.'
      },
      {
        id: 'pa-code-107-5',
        shortTitle: '28 Pa. Code § 107.5 — Membership appointment and reappointment',
        publisher: 'Pennsylvania Code & Bulletin',
        url: 'https://www.pacodeandbulletin.gov/Display/pacode?file=/secure/pacode/data/028/chapter107/s107.5.html&d=reduce',
        accessedNote: 'Subsection (c): reappointment at intervals no longer than every 2 years.'
      },
      {
        id: 'pa-act-60',
        shortTitle: 'Act 60 of 2013 (Session Law)',
        publisher: 'Pennsylvania General Assembly (PAlegis)',
        url: 'https://www.palegis.us/statutes/unconsolidated/law-information?sessYr=2013&sessInd=0&actNum=0060',
        accessedNote: 'Unconsolidated statute information page for 2013 Act 60.'
      },
      {
        id: 'pa-code-551-34',
        shortTitle: '28 Pa. Code § 551.34 — Licensure process (ASF)',
        publisher: 'Pennsylvania Code & Bulletin',
        url: 'https://www.pacodeandbulletin.gov/Display/pacode?file=/secure/pacode/data/028/chapter551/s551.34.html&d=reduce',
        accessedNote: 'Annual renewal applications; $250 fee with application or renewal.'
      },
      {
        id: 'pa-code-551-53',
        shortTitle: '28 Pa. Code § 551.53 — Presurvey preparation (ASF)',
        publisher: 'Pennsylvania Code & Bulletin',
        url: 'https://www.pacodeandbulletin.gov/Display/pacode?file=/secure/pacode/data/028/chapter551/s551.53.html&d=reduce',
        accessedNote: 'Preparation prior to an annual survey site visit by the Department.'
      },
      {
        id: 'pa-code-151-toc',
        shortTitle: '28 Pa. Code Chapter 151 (TOC)',
        publisher: 'Pennsylvania Code & Bulletin',
        url: 'https://www.pacodeandbulletin.gov/Display/pacode?file=/secure/pacode/data/028/chapter151/chap151toc.html&d=reduce',
        accessedNote: 'Fire, Safety, and Disaster Services (hospital regulations).'
      },
      {
        id: 'cfr-482-22',
        shortTitle: '42 CFR § 482.22 — Medical staff',
        publisher: 'Legal Information Institute (e-CFR mirror)',
        url: 'https://www.law.cornell.edu/cfr/text/42/482.22',
        accessedNote: 'Optional unified and integrated medical staff: (b)(4), subject to state/local law.'
      },
      {
        id: 'jc-ms-faq',
        shortTitle: 'Joint Commission — Reappointment / re-privileging FAQ',
        publisher: 'The Joint Commission',
        url: 'https://www.jointcommission.org/standards/standard-faqs/hospital-and-hospital-clinics/medical-staff-ms/000001439/',
        accessedNote: 'Discusses timing defaults and law/regulation as a shorter limiter.'
      },
      {
        id: 'jc-ahc-state-payer',
        shortTitle: 'Joint Commission — State & Payer Recognitions (Ambulatory Health Care)',
        publisher: 'The Joint Commission',
        url: 'https://www.jointcommission.org/en-us/accreditation/ambulatory-health-care/state-payer-recognitions',
        accessedNote:
          'Primary page title: State & Payer Recognitions for Ambulatory Health Care Accreditation. Public text names states in payer/program blocks (e.g., Anthem IngenioRX, Highmark, Centene) and summarizes state-based recognition without a single enumerated “21 states” table.'
      },
      {
        id: 'jc-ambulatory-compiled-21',
        shortTitle: 'HAP dashboard — 21-state ambulatory footprint (compiled methodology)',
        publisher: 'The Hospital and Healthsystem Association of Pennsylvania (dashboard methodology note)',
        url: 'https://www.jointcommission.org/en-us/accreditation/ambulatory-health-care/state-payer-recognitions',
        accessedNote:
          'April 16, 2026: jcAmbulatoryRecognizedAbbr lists the deduplicated union of state names on the TJC Ambulatory State and Payer page for (1) Anthem/IngenioRX medical-group recognition — CA, CO, CT, GA, IN, KY, ME, MO, NV, NH, NY, OH, VA, WI; (2) Highmark ambulatory — DE, NY, PA, WV; (3) Centene PCMH incentives — AZ, CA, IL, IN, IA, LA, MD, MS, MO, NE, NH, NM, OH, OR, SC, TX, WA. Deduplicated list used on map: AZ, CA, CO, CT, DE, GA, IL, IN, IA, KY, LA, ME, MD, MS, MO, NE, NV, NH, NM, NY, OH (21). TJC states these materials are informational, not definitive regulatory authority; verify each jurisdiction.'
      },
      {
        id: 'jc-state-recognitions-hub',
        shortTitle: 'Joint Commission — State recognitions (searchable database)',
        publisher: 'The Joint Commission',
        url: 'https://www.jointcommission.org/en-us/about-us/why-choose-us/state-recognitions',
        accessedNote:
          'April 2026: authoritative place to filter by Joint Commission program (e.g., Ambulatory Health Care) and “Type of recognition” (e.g., licensure). Public server-rendered copies checked here do not expose the full filtered result set to automated pagination; use an in-browser export / manual copy for jcAmbulatoryRecognizedAbbr. Page title: State Recognitions.'
      },
      {
        id: 'cms-asc',
        shortTitle: 'CMS — Ambulatory Surgical Centers',
        publisher: 'Centers for Medicare & Medicaid Services',
        url: 'https://www.cms.gov/medicare/health-safety-standards/certification-compliance/ambulatory-surgery-centers',
        accessedNote: 'Federal ASC certification overview and Appendix L reference.'
      },
      {
        id: 'pa-doh-asf',
        shortTitle: 'Pennsylvania DOH — Ambulatory Surgical Facilities',
        publisher: 'Commonwealth of Pennsylvania',
        url: 'https://www.health.pa.gov/topics/facilities/ambulatory/Pages/Ambulatory%20Surgical%20Facilities.aspx',
        accessedNote: 'Agency program page and contacts.'
      },
      {
        id: 'pa-sec-health',
        shortTitle: 'Secretary of Health — Dr. Debra L. Bogen',
        publisher: 'Commonwealth of Pennsylvania',
        url: 'https://www.pa.gov/governor/meet-governor-shapiro-s-cabinet/dr--debra-l--bogen.html',
        accessedNote: 'Cabinet biography (public).'
      },
      {
        id: 'hap-branding-pdf',
        shortTitle: 'HAP Corporate Branding Guidelines (April 2025)',
        publisher: 'The Hospital and Healthsystem Association of Pennsylvania',
        url: '',
        accessedNote:
          'Internal PDF palette: #0072bc, #fbb040, #8ed8f8, #3a8b7f, #6d8b8c, #d3d9d4, #231f20 — implemented in branding-hap-2025.css.'
      }
    ]
  };

  window.HAP_REGULATORY_ADVOCACY_2026 = DATA;
})();
