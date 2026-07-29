(function () {
  'use strict';

  if (typeof PABooking === 'undefined') return;

  var successRoot = document.getElementById('pa-booking-success');
  if (successRoot) {
    initSuccessPageReturn();
    window.addEventListener('pageshow', initSuccessPageReturn);
    return;
  }

  var root = document.getElementById('pa-booking-app');
  if (!root) return;

  var PAY_CTA_LABEL = 'Reserve My Date';
  var PAY_CTA_LOADING = 'Opening secure deposit\u2026';
  var REQUEST_CTA_LABEL = 'Request my date';
  var REQUEST_CTA_LOADING = 'Sending request\u2026';

  var state = {
    step: 0,
    month: monthKey(new Date()),
    unavailable: [],
    services: [],
    deposit: parseFloat(root.getAttribute('data-deposit') || '0', 10),
    depositPerDay: parseFloat(root.getAttribute('data-deposit') || '0', 10),
    stripeReady: false,
    stripeMode: '',
    paymentProvider: 'none',
    service: '',
    selectedDates: [],
    timeWindow: '',
    name: '',
    email: '',
    phone: '',
    eventType: '',
    venue: '',
    organization: '',
    serviceExpanded: false,
    schedulePanelOverride: null,
    focusTarget: '',
    error: '',
    depositCompleted: false,
    depositOpened: false,
    paylinkUrl: '',
    notes: '',
    guestCount: '',
    termsAccepted: false,
    selectedAddons: {},
    addonsCatalog: [],
    timelineNotes: '',
    venueAccess: '',
    deliverablesNotes: '',
    submitting: false,
    calDirection: 0,
    loading: true,
    fieldErrors: {},
    welcomeOpen: true,
  };

  var MAX_BOOKING_DAYS = 14;
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var STEPS = ['Service', 'Event', 'Review'];
  var STEPS_REQUEST = ['Service', 'Event', 'Review'];
  var STEP_HINTS = [
    '',
    'Tell us about your event.',
    '',
  ];
  var STEP_HINTS_REQUEST = [
    '',
    'Tell us about your event.',
    '',
  ];

  var RECOMMENDED_SERVICE = 'Photo + Video Bundle';

  function paGa4Event(name, params) {
    params = params || {};
    if (window.PAGA4 && typeof window.PAGA4.event === 'function') {
      window.PAGA4.event(name, params);
    }
    if (window.PATracking && typeof window.PATracking.conversion === 'function') {
      if (name === 'booking_submit') {
        window.PATracking.conversion('booking_submit', params);
      } else if (name === 'deposit_complete') {
        window.PATracking.conversion('deposit', params);
      }
    }
  }

  function getUtmAttributionNote() {
    var parts = [];
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) {
      try {
        var v = sessionStorage.getItem('pa_' + k);
        if (v) {
          parts.push(k.replace('utm_', '') + '=' + v);
        }
      } catch (e) { /* ignore */ }
    });
    return parts.length ? 'Attribution: ' + parts.join(', ') : '';
  }

  /** Presentation labels for API service names (only services in state.services are shown). */
  var SERVICE_V4_LABELS = {
    'Event Photography': 'Photography',
    'Video Production': 'Videography',
    'DJ Services': 'DJ',
    'Live Audio / PA': 'Live Audio',
    'Photo + Video Bundle': 'Multiple Services',
  };

  function activeSteps() {
    return state.stripeReady ? STEPS : STEPS_REQUEST;
  }

  function activeStepHints() {
    return state.stripeReady ? STEP_HINTS : STEP_HINTS_REQUEST;
  }

  function getServiceDisplayLabel(apiName) {
    return SERVICE_V4_LABELS[apiName] || apiName;
  }

  function isPhotoVideoService() {
    return state.service === 'Event Photography' ||
      state.service === 'Video Production' ||
      state.service === 'Photo + Video Bundle';
  }

  function eventNotesPlaceholder() {
    if (state.service === 'DJ Services') {
      return 'Reception timeline, must-play songs, announcements\u2026';
    }
    if (state.service === 'Live Audio / PA') {
      return 'Venue layout, power access, mic needs, performance type\u2026';
    }
    return 'Guest count, timeline, or special requests\u2026';
  }

  function isDesktopViewport() {
    return typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(min-width: 900px)').matches;
  }

  function shouldShowStickySummary() {
    return !state.welcomeOpen && isDesktopViewport();
  }

  function dismissWelcome() {
    state.welcomeOpen = false;
    state.focusTarget = 'step';
    paGa4Event('booking_start', { entry: 'welcome_button' });
    try {
      sessionStorage.setItem('pa_welcome_dismissed', '1');
    } catch (e) { /* ignore */ }
    render();
  }

  function readDetailsFromForm() {
    // Only the essential fields remain in the simplified flow. Read each only
    // if present so a re-render never clobbers state with empty values.
    var nameEl = document.getElementById('pa-name');
    if (nameEl) state.name = nameEl.value || '';
    var emailEl = document.getElementById('pa-email');
    if (emailEl) state.email = emailEl.value || '';
    var phoneEl = document.getElementById('pa-phone');
    if (phoneEl) state.phone = phoneEl.value || '';
    var notesEl = document.getElementById('pa-notes');
    if (notesEl) state.notes = notesEl.value || '';
    var extraEl = document.getElementById('pa-extra-notes');
    if (extraEl) state.timelineNotes = extraEl.value || '';
    var venueEl = document.getElementById('pa-venue');
    if (venueEl) state.venue = venueEl.value || '';
    var termsEl = document.getElementById('pa-terms-agree');
    if (termsEl) {
      state.termsAccepted = termsEl.checked;
    }
  }

  function validateContactForm() {
    readDetailsFromForm();
    if (state.name.trim().length < 2) {
      return { field: 'pa-name', message: 'Please enter your name.' };
    }
    if (!isValidEmail(state.email)) {
      return { field: 'pa-email', message: 'Please enter a valid email address.' };
    }
    if (state.phone.replace(/\D/g, '').length < 7) {
      return { field: 'pa-phone', message: 'Please enter your phone number.' };
    }
    if (state.venue.trim().length < 2) {
      return { field: 'pa-venue', message: 'Please enter the venue name.' };
    }
    return null;
  }

  function validateDetailsForm() {
    var contactErr = validateContactForm();
    if (contactErr) {
      return contactErr;
    }
    if (state.stripeReady && !state.termsAccepted) {
      return { field: 'pa-terms-agree', message: 'Please agree to the booking policies to continue.' };
    }
    return null;
  }

  function validateSingleField(fieldId) {
    readDetailsFromForm();
    switch (fieldId) {
      case 'pa-name':
        if (state.name.trim().length < 2) return 'Please enter your name.';
        break;
      case 'pa-email':
        if (!isValidEmail(state.email)) return 'Please enter a valid email address.';
        break;
      case 'pa-phone':
        if (state.phone.replace(/\D/g, '').length < 7) return 'Please enter your phone number.';
        break;
      case 'pa-venue':
        if (state.venue.trim().length < 2) return 'Please enter the venue name.';
        break;
      default:
        break;
    }
    return '';
  }

  function updateFieldErrorUI(wrap, fieldId, message) {
    if (!wrap) return;
    wrap.classList.toggle('has-error', !!message);
    var input = document.getElementById(fieldId);
    if (input) {
      if (message) {
        input.setAttribute('aria-invalid', 'true');
        input.classList.add('pa-input-error');
      } else {
        input.removeAttribute('aria-invalid');
        input.classList.remove('pa-input-error');
      }
    }
    var errEl = document.getElementById(fieldId + '-error');
    if (message) {
      state.fieldErrors[fieldId] = message;
      if (!errEl) {
        errEl = document.createElement('p');
        errEl.id = fieldId + '-error';
        errEl.className = 'pa-field-error-msg';
        wrap.appendChild(errEl);
      }
      errEl.textContent = message;
    } else {
      delete state.fieldErrors[fieldId];
      if (errEl && errEl.parentNode) errEl.parentNode.removeChild(errEl);
    }
  }

  function validatePaylinkReady() {
    if (state.paymentProvider !== 'paylink') {
      return '';
    }
    var days = getDayCount();
    var tiers = (PABooking && PABooking.paylinkTiers) ? PABooking.paylinkTiers : {};
    if (days > 1 && !tiers[String(days)]) {
      var notify = (PABooking && PABooking.notifyEmail) ? PABooking.notifyEmail : '';
      if (days > 5) {
        return 'For productions longer than 5 days, email' + (notify ? ' ' + notify : ' us') + ' for a custom deposit link — or book in 5-day blocks.';
      }
      return 'For multi-day events, contact us for a custom deposit link — or book one day at a time.';
    }
    if (!getPaylinkUrl()) {
      return 'Payment is not configured yet. Email us to complete your booking.';
    }
    return '';
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function ensureToastStack() {
    var stack = document.getElementById('pa-toast-stack');
    if (stack) return stack;
    stack = document.createElement('div');
    stack.id = 'pa-toast-stack';
    stack.className = 'pa-toast-stack';
    stack.setAttribute('aria-live', 'polite');
    stack.setAttribute('aria-relevant', 'additions');
    document.body.appendChild(stack);
    return stack;
  }

  function showToast(message, type) {
    if (!message) return;
    var stack = ensureToastStack();
    var toast = document.createElement('div');
    toast.className = 'pa-toast' +
      (type === 'success' ? ' is-success' : '') +
      (type === 'error' ? ' is-error' : '') +
      (type === 'info' ? ' is-info' : '');
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    stack.appendChild(toast);
    window.setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3200);
  }

  function clearFieldErrors() {
    state.fieldErrors = {};
  }

  function setFieldError(fieldId, message, quiet) {
    state.fieldErrors[fieldId] = message;
    if (!quiet) {
      state.focusTarget = fieldId;
      showToast(message, 'error');
    }
  }

  function saveLastBooking() {
    try {
      sessionStorage.setItem('pa_last_booking', JSON.stringify({
        dates: state.selectedDates.slice(),
        service: state.service,
        time: state.timeWindow,
        venue: state.venue,
        name: state.name,
        email: state.email,
      }));
    } catch (e) { /* ignore */ }
  }

  /**
   * After GoDaddy Pay Link, customers land on deposit_return_url (?pa_requested=1&deposit=done).
   * Redirect to the signed success URL (or confirm via API) so deposit emails fire.
   */
  function initSuccessPageReturn() {
    var params = new URLSearchParams(window.location.search);
    if (!params.get('pa_requested')) {
      return;
    }
    if (params.get('deposit') !== 'done') {
      return;
    }
    var depositUsd = (window.PAGA4 && window.PAGA4.depositUsd) || '150';
    paGa4Event('deposit_complete', {
      page_path: window.location.pathname,
      value: parseFloat(depositUsd),
      currency: 'USD',
      engagement_type: 'deposit_return'
    });
    if (params.get('pa_booking') && params.get('pa_token')) {
      clearPaymentSession();
      return;
    }

    function redirectToSignedSuccess(url) {
      if (!url) return false;
      try {
        var signed = new URL(url, window.location.origin);
        signed.searchParams.set('deposit', 'done');
        url = signed.toString();
      } catch (e) { /* use url as-is */ }
      try {
        sessionStorage.removeItem('pa_deposit_opened');
        sessionStorage.removeItem('pa_checkout_success_url');
        sessionStorage.removeItem('pa_pending_booking_id');
      } catch (e) { /* ignore */ }
      window.location.replace(url);
      return true;
    }

    var storedSuccessUrl = '';
    try {
      storedSuccessUrl = sessionStorage.getItem('pa_checkout_success_url') || '';
    } catch (e) { /* ignore */ }
    if (redirectToSignedSuccess(storedSuccessUrl)) {
      return;
    }

    var bookingId = 0;
    var email = '';
    try {
      bookingId = parseInt(sessionStorage.getItem('pa_pending_booking_id') || '0', 10);
      var raw = sessionStorage.getItem('pa_last_booking') || sessionStorage.getItem('pa_booking_draft');
      if (raw) {
        var parsed = JSON.parse(raw);
        email = parsed && parsed.email ? String(parsed.email).trim() : '';
      }
    } catch (e) { /* ignore */ }

    if (bookingId < 1 || !email) {
      return;
    }

    fetch(PABooking.restUrl + 'confirm-deposit', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': PABooking.nonce,
      },
      body: JSON.stringify({ booking_id: bookingId, email: email, deposit: 'done' }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.success_url && redirectToSignedSuccess(data.success_url)) {
          return;
        }
        if (data && data.ok && (data.status === 'pending_approval' || data.already)) {
          window.location.reload();
        }
      })
      .catch(function () { /* server may still process on next visit */ });
  }

  function downloadIcsFile() {
    if (!state.selectedDates.length) return;
    var iso = state.selectedDates[0];
    var parts = iso.split('-');
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10) - 1;
    var d = parseInt(parts[2], 10);
    var hours = icsHoursFromTimeWindow(state.timeWindow);
    var start = new Date(y, m, d, hours.startH, hours.startM, 0);
    var end = new Date(y, m, d, hours.endH, hours.endM, 0);
    function fmt(dt) {
      return dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }
    var ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//PA Media Arts//Booking//EN\r\n'
      + 'BEGIN:VEVENT\r\nUID:' + iso + '@pamedia.art\r\n'
      + 'DTSTAMP:' + fmt(new Date()) + '\r\n'
      + 'DTSTART:' + fmt(start) + '\r\n'
      + 'DTEND:' + fmt(end) + '\r\n'
      + 'SUMMARY:' + (state.service || 'PA Media Arts booking') + '\r\n'
      + 'DESCRIPTION:' + (state.timeWindow || '') + '\r\n'
      + 'LOCATION:' + (state.venue || 'Pennsylvania') + '\r\n'
      + 'END:VEVENT\r\nEND:VCALENDAR';
    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pa-media-booking.ics';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function buildSkeletonLoader() {
    var sk = document.createElement('div');
    sk.className = 'pa-booking-skeleton pa-booking-skeleton-v40';
    sk.setAttribute('role', 'status');
    sk.setAttribute('aria-live', 'polite');
    sk.setAttribute('aria-label', 'Loading availability');
    var title = document.createElement('div');
    title.className = 'pa-skeleton-line pa-skeleton-line--title';
    sk.appendChild(title);
    var short = document.createElement('div');
    short.className = 'pa-skeleton-line pa-skeleton-line--short';
    sk.appendChild(short);
    var cal = document.createElement('div');
    cal.className = 'pa-skeleton-cal';
    for (var i = 0; i < 14; i++) {
      var cell = document.createElement('div');
      cell.className = 'pa-skeleton-cal-cell';
      cell.setAttribute('aria-hidden', 'true');
      cal.appendChild(cell);
    }
    sk.appendChild(cal);
    return sk;
  }

  function buildEmptyState(message) {
    var el = document.createElement('p');
    el.className = 'pa-empty-state pa-empty-state-v40';
    el.textContent = message;
    return el;
  }

  function buildConfidencePanel() {
    var panel = document.createElement('div');
    panel.className = 'pa-confidence-panel';
    panel.setAttribute('role', 'note');
    panel.setAttribute('aria-label', 'Booking confidence');
    [
      'Deposit holds your date',
      'Applied to final balance',
      'Book in ~2 minutes',
      'Secure checkout',
    ].forEach(function (text) {
      var item = document.createElement('span');
      item.className = 'pa-confidence-item';
      item.textContent = text;
      panel.appendChild(item);
    });
    return panel;
  }

  function buildWelcomeScreen() {
    var wrap = document.createElement('div');
    wrap.className = 'pa-welcome pa-step';
    wrap.id = 'pa-step-focus-welcome';
    wrap.setAttribute('tabindex', '-1');

    var inner = document.createElement('div');
    inner.className = 'pa-welcome-inner';

    var title = document.createElement('h2');
    title.className = 'pa-welcome-title';
    title.textContent = 'Hold your date';
    inner.appendChild(title);

    var lead = document.createElement('p');
    lead.className = 'pa-welcome-lead';
    var depUsd = (window.PASite && PASite.depositUsd) ? PASite.depositUsd : '150';
    lead.textContent = 'Choose your service and date, then pay a $' + depUsd + ' deposit to reserve your calendar spot. Takes about two minutes.';
    inner.appendChild(lead);

    var start = document.createElement('button');
    start.type = 'button';
    start.className = 'pa-submit pa-btn is-ready pa-welcome-start';
    start.textContent = 'Start booking';
    start.addEventListener('click', dismissWelcome);
    inner.appendChild(start);

    inner.appendChild(buildConfidencePanel());
    wrap.appendChild(inner);
    return wrap;
  }

  function buildStickySummary() {
    var panel = document.createElement('aside');
    panel.className = 'pa-sticky-summary pa-sticky-summary-v40';
    panel.setAttribute('aria-label', 'Booking summary');

    var title = document.createElement('h3');
    title.className = 'pa-sticky-summary-title';
    title.textContent = 'Your booking';
    panel.appendChild(title);

    var list = document.createElement('dl');
    list.className = 'pa-sticky-summary-list';

    function row(label, value) {
      if (!value) return;
      var dt = document.createElement('dt');
      dt.textContent = label;
      var dd = document.createElement('dd');
      dd.textContent = value;
      list.appendChild(dt);
      list.appendChild(dd);
    }

    row('Service', state.service ? getServiceDisplayLabel(state.service) : '');
    row('Date', state.selectedDates.length ? formatDatesSummary() : '');
    row('Location', state.venue);
    row('Time', state.timeWindow ? shortTimeWindow(state.timeWindow) : '');
    if (state.eventType) {
      row('Event type', state.eventType);
    }
    if (state.stripeReady && state.service && state.selectedDates.length) {
      row('Deposit Today', formatMoney(getDepositTotal()));
    }

    if (!list.children.length) {
      var empty = document.createElement('p');
      empty.className = 'pa-sticky-summary-empty';
      empty.textContent = 'Select a service to begin.';
      panel.appendChild(empty);
    } else {
      panel.appendChild(list);
    }

    return panel;
  }

  function buildLiveRecapBar() {
    return buildStickySummary();
  }

  function getPaylinkUrl() {
    var days = getDayCount();
    var tiers = (PABooking && PABooking.paylinkTiers) ? PABooking.paylinkTiers : {};
    if (tiers[String(days)]) {
      return tiers[String(days)];
    }
    return state.paylinkUrl || PABooking.paylinkUrl || '';
  }

  function getDepositReturnUrl() {
    return (PABooking && PABooking.depositReturnUrl)
      ? PABooking.depositReturnUrl
      : (window.location.pathname + '?deposit=done');
  }

  function clearPaymentSession() {
    try {
      sessionStorage.removeItem('pa_booking_draft');
      sessionStorage.removeItem('pa_deposit_opened');
      sessionStorage.removeItem('pa_checkout_success_url');
      sessionStorage.removeItem('pa_pending_booking_id');
    } catch (e) { /* ignore */ }
  }

  function checkPaymentReturn(params) {
    params = params || new URLSearchParams(window.location.search);
    if (params.get('deposit') !== 'done') {
      return false;
    }

    var successUrl = '';
    try {
      successUrl = sessionStorage.getItem('pa_checkout_success_url') || '';
    } catch (e) { /* ignore */ }
    if (!successUrl && PABooking && PABooking.depositReturnUrl) {
      successUrl = PABooking.depositReturnUrl;
    }
    clearPaymentSession();

    if (successUrl) {
      try {
        var signed = new URL(successUrl, window.location.origin);
        signed.searchParams.set('deposit', 'done');
        successUrl = signed.toString();
      } catch (e) { /* use as-is */ }
      window.location.replace(successUrl);
      return true;
    }
    return false;
  }

  function saveDraft() {
    try {
      sessionStorage.setItem(
        'pa_booking_draft',
        JSON.stringify({
          service: state.service,
          selectedDates: state.selectedDates,
          timeWindow: state.timeWindow,
          month: state.month,
          name: state.name,
          email: state.email,
          phone: state.phone,
          eventType: state.eventType,
          venue: state.venue,
          organization: state.organization,
          notes: state.notes,
          guestCount: state.guestCount,
          termsAccepted: state.termsAccepted,
          selectedAddons: state.selectedAddons,
          timelineNotes: state.timelineNotes,
          venueAccess: state.venueAccess,
          deliverablesNotes: state.deliverablesNotes,
          welcomeOpen: state.welcomeOpen,
        })
      );
    } catch (e) { /* ignore */ }
  }

  function resetScheduleState() {
    state.service = '';
    state.selectedDates = [];
    state.timeWindow = '';
    state.serviceExpanded = false;
  }

  function shouldRestoreBookingDraft() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'cancelled') return true;
    try {
      if (sessionStorage.getItem('pa_deposit_opened') === '1') return true;
    } catch (e) { /* ignore */ }
    return false;
  }

  function clearBookingSession() {
    clearPaymentSession();
  }

  function applyDraftFields(d) {
    if (d.service) state.service = d.service;
    if (d.selectedDates && d.selectedDates.length) state.selectedDates = d.selectedDates;
    if (d.timeWindow) state.timeWindow = d.timeWindow;
    if (d.month) state.month = d.month;
    if (d.name) state.name = d.name;
    if (d.email) state.email = d.email;
    if (d.phone) state.phone = d.phone;
    if (d.eventType) state.eventType = d.eventType;
    if (d.venue) {
      state.venue = sanitizeVenueValue(d.venue);
    }
    if (d.organization) state.organization = d.organization;
    if (d.notes) state.notes = d.notes;
    if (d.guestCount) state.guestCount = d.guestCount;
    if (d.termsAccepted) state.termsAccepted = !!d.termsAccepted;
    if (d.selectedAddons) state.selectedAddons = d.selectedAddons;
    if (d.timelineNotes) state.timelineNotes = d.timelineNotes;
    if (d.venueAccess) state.venueAccess = d.venueAccess;
    if (d.deliverablesNotes) state.deliverablesNotes = d.deliverablesNotes;
    if (d.welcomeOpen === false) state.welcomeOpen = false;
  }

  function applyBookingEntryParams(params) {
    if (!params) {
      return;
    }
    if (params.get('start') === '1' || params.get('service')) {
      state.welcomeOpen = false;
    }
    if (params.get('start') === '1') {
      paGa4Event('booking_start', { entry: 'url_param' });
    }
    if (/^\/book\/?$/i.test(window.location.pathname || '')) {
      state.welcomeOpen = false;
    }
  }

  /** Collapse "+", "/", punctuation so "Photo  Video Bundle" still matches catalog. */
  function normalizeServiceKey(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/\+/g, ' ')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function applyServiceFromUrl(params) {
    if (!params) {
      return;
    }
    var serviceParam = params.get('service');
    if (!serviceParam || !state.services || !state.services.length) {
      return;
    }
    try {
      serviceParam = decodeURIComponent(serviceParam.replace(/\+/g, ' '));
    } catch (e) { /* use raw */ }
    serviceParam = String(serviceParam).trim();
    var match = '';
    var i;
    var candidate;
    var lower = serviceParam.toLowerCase();
    var normalized = normalizeServiceKey(serviceParam);
    for (i = 0; i < state.services.length; i += 1) {
      candidate = String(state.services[i] || '');
      if (candidate === serviceParam || candidate.toLowerCase() === lower) {
        match = candidate;
        break;
      }
    }
    if (!match && normalized) {
      for (i = 0; i < state.services.length; i += 1) {
        candidate = String(state.services[i] || '');
        if (normalizeServiceKey(candidate) === normalized) {
          match = candidate;
          break;
        }
      }
    }
    if (!match) {
      for (i = 0; i < state.services.length; i += 1) {
        candidate = String(state.services[i] || '');
        if (candidate.toLowerCase().indexOf(lower) !== -1 || lower.indexOf(candidate.toLowerCase()) !== -1) {
          match = candidate;
          break;
        }
      }
    }
    if (!match) {
      return;
    }
    state.service = match;
    state.welcomeOpen = false;
  }

  function restoreDraft() {
    if (!shouldRestoreBookingDraft()) {
      clearBookingSession();
      resetScheduleState();
      state.depositOpened = false;
      return;
    }

    try {
      var raw = sessionStorage.getItem('pa_booking_draft');
      if (raw) {
        applyDraftFields(JSON.parse(raw));
      }
    } catch (e) { /* ignore */ }
    state.depositOpened = sessionStorage.getItem('pa_deposit_opened') === '1';
    if (state.depositOpened && state.name) {
      state.step = 2;
      state.welcomeOpen = false;
    } else if (state.service || state.name || state.selectedDates.length) {
      state.welcomeOpen = false;
    }
    try {
      if (sessionStorage.getItem('pa_welcome_dismissed') === '1') {
        state.welcomeOpen = false;
      }
    } catch (e) { /* ignore */ }
  }

  var monthCache = {};
  var minLeadHours = (typeof PABooking.minLeadHours === 'number') ? PABooking.minLeadHours : 48;
  var EVENT_TYPES = ['Wedding', 'Corporate', 'Private party', 'Concert / Live', 'Other'];
  var TIME_WINDOWS = [
    'Full day (9am – 11pm)',
    'Morning (9am – 1pm)',
    'Afternoon (1pm – 5pm)',
    'Evening (5pm – 11pm)',
  ];
  var SERVICE_BLURBS = {
    'Event Photography': 'On-site coverage for weddings, parties, and events',
    'Video Production': 'Cinematic filming and event highlight reels',
    'Live Audio / PA': 'Sound reinforcement and live event audio',
    'DJ Services': 'Music, MC, and dance-floor energy',
    'Photo + Video Bundle': 'Photo and video team — one booking',
  };

  init();
  initStickyBar();
  initBookingPageFocus();
  initViewportGuard();

  function ensureStepAnnouncer() {
    var el = document.getElementById('pa-step-announcer');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'pa-step-announcer';
    el.className = 'pa-sr-only';
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    var host = root.parentNode || document.body;
    host.insertBefore(el, root);
    return el;
  }

  function announceStep() {
    var steps = activeSteps();
    var hints = activeStepHints();
    var el = ensureStepAnnouncer();
    var remaining = steps.length - state.step - 1;
    var suffix = remaining > 0
      ? remaining + ' step' + (remaining > 1 ? 's' : '') + ' remaining. '
      : 'Final step. ';
    el.textContent = suffix + 'Step ' + (state.step + 1) + ' of ' + steps.length + ': ' + steps[state.step] + '. ' + (hints[state.step] || '');
  }

  /**
   * Keeps the booking shell sized to the visible viewport when the mobile
   * keyboard opens — prevents page jump and clipped inputs.
   */
  function initViewportGuard() {
    if (!window.visualViewport) return;
    var bookRoot = document.querySelector('.pa-booking-root');

    function syncViewport() {
      if (!bookRoot || !document.body.classList.contains('pa-booking-page') || !document.body.classList.contains('is-booking-funnel')) {
        document.documentElement.style.removeProperty('--pa-vv-height');
        if (bookRoot) bookRoot.classList.remove('is-keyboard-open');
        if (root) root.classList.remove('is-keyboard-open');
        return;
      }
      var vv = window.visualViewport;
      var keyboardOpen = vv.height < window.innerHeight * 0.82;
      document.documentElement.style.setProperty('--pa-vv-height', Math.round(vv.height) + 'px');
      bookRoot.classList.toggle('is-keyboard-open', keyboardOpen);
      if (root) root.classList.toggle('is-keyboard-open', keyboardOpen);
    }

    window.visualViewport.addEventListener('resize', syncViewport);
    window.visualViewport.addEventListener('scroll', syncViewport);
    syncViewport();
  }

  function resetStepScroll() {
    var scroll = root.querySelector('.pa-step-scroll');
    if (scroll) {
      scroll.scrollTop = 0;
    }
  }

  function initBookingPageFocus() {
    if (!document.body.classList.contains('pa-booking-page')) {
      return;
    }
    if (document.body.classList.contains('is-booking-funnel')) {
      return;
    }
    var target = document.getElementById('pa-book') || document.getElementById('pa-booking-app');
    if (!target) {
      return;
    }
    window.requestAnimationFrame(function () {
      try {
        target.scrollIntoView({ block: 'start', behavior: 'smooth' });
      } catch (e) {
        target.scrollIntoView(true);
      }
    });
  }

  var draftSaveTimer = null;
  function scheduleDraftSave() {
    if (draftSaveTimer) {
      window.clearTimeout(draftSaveTimer);
    }
    draftSaveTimer = window.setTimeout(function () {
      draftSaveTimer = null;
      saveDraft();
    }, 280);
  }
  window.addEventListener('pageshow', function () {
    if (checkPaymentReturn()) {
      return;
    }
  });

  function isDedicatedBookingSurface() {
    if (document.body.classList.contains('pa-booking-page')) {
      return true;
    }
    var bookRoot = document.querySelector('.pa-booking-root');
    if (!bookRoot || bookRoot.classList.contains('pa-booking-root--home-embed')) {
      return false;
    }
    return bookRoot.classList.contains('pa-booking-root--wizard');
  }

  function initStickyBar() {
    var sticky = document.querySelector('.pa-booking-sticky');
    var bookRoot = document.querySelector('.pa-booking-root');
    var app = document.getElementById('pa-booking-app');
    if (!sticky || !app) return;
    if (bookRoot && bookRoot.classList.contains('pa-booking-root--home-embed')) {
      sticky.hidden = true;
      return;
    }

    function syncSticky() {
      if (bookRoot && bookRoot.classList.contains('is-single-screen')) {
        sticky.hidden = true;
        return;
      }
      var inFunnel = app.contains(document.activeElement) || state.step > 0;
      var appRect = app.getBoundingClientRect();
      var appVisible = appRect.top < window.innerHeight * 0.85 && appRect.bottom > 80;
      var hide = inFunnel || appVisible || state.step > 0;
      sticky.hidden = hide;
      if (bookRoot) {
        bookRoot.classList.toggle('is-funnel-active', hide || state.step > 0);
      }
    }

    if (!('IntersectionObserver' in window)) {
      syncSticky();
      return;
    }
    var observer = new IntersectionObserver(function () {
      syncSticky();
    }, { threshold: [0, 0.15, 0.5] });
    observer.observe(app);
    app.addEventListener('focusin', syncSticky);
    window.addEventListener('scroll', syncSticky, { passive: true });
    syncSticky();
  }

  function updateFunnelChrome() {
    var sticky = document.querySelector('.pa-booking-sticky');
    var bookRoot = document.querySelector('.pa-booking-root');
    var dedicated = isDedicatedBookingSurface();
    var inFunnel = dedicated && !state.loading;
    var funnelSurface = dedicated;
    if (bookRoot) {
      bookRoot.classList.toggle('is-funnel-active', inFunnel);
      bookRoot.classList.toggle('is-single-screen', inFunnel);
    }
    if (root) {
      root.classList.toggle('is-single-screen', inFunnel);
    }
    if (document.body.classList.contains('pa-booking-page')) {
      document.documentElement.classList.toggle('is-booking-funnel', funnelSurface);
      document.body.classList.toggle('is-booking-funnel', funnelSurface);
    } else {
      document.documentElement.classList.remove('is-booking-funnel');
      document.body.classList.remove('is-booking-funnel');
    }
    if (sticky) {
      sticky.hidden = dedicated || state.step > 0 || state.welcomeOpen;
    }
  }

  if (window.location.hash === '#pa-booking-app' || window.location.hash === '#pa-book') {
    setTimeout(function () {
      if (!document.body.classList.contains('is-booking-funnel')) {
        scrollToPanel();
      }
    }, 300);
  }

  if (window.location.hash === '#pa-booking-policies') {
    setTimeout(openBookingPoliciesDialog, 400);
  }

  document.addEventListener('click', function (e) {
    var link = e.target && e.target.closest ? e.target.closest('a[href="#pa-booking-policies"]') : null;
    if (!link || link.classList.contains('pa-terms-link')) {
      return;
    }
    e.preventDefault();
    openBookingPoliciesDialog();
  });

  document.querySelectorAll('a[href="#pa-booking-app"]').forEach(function (link) {
    link.addEventListener('click', function () {
      setTimeout(function () {
        if (!document.body.classList.contains('is-booking-funnel')) {
          scrollToPanel();
        }
      }, 80);
    });
  });

  // Re-render the schedule when the viewport crosses the phone breakpoint so
  // the layout swaps between the single-panel wizard (mobile) and the
  // side-by-side overview (desktop) without a manual reload.
  (function watchScheduleBreakpoint() {
    var wasMobile = isMobileViewport();
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(function () {
        resizeTimer = null;
        var nowMobile = isMobileViewport();
        if (nowMobile !== wasMobile) {
          wasMobile = nowMobile;
          if (root && document.body.classList.contains('is-booking-funnel')) {
            clearSchedulePanelOverride();
            render();
          }
        }
      }, 200);
    }, { passive: true });
  })();

  function init() {
    var params = new URLSearchParams(window.location.search);
    restoreDraft();
    applyBookingEntryParams(params);
    if (params.get('checkout') === 'cancelled') {
      state.error = 'Payment wasn\u2019t completed \u2014 your date isn\u2019t held yet. Pick your date and try again when ready.';
      if (window.history.replaceState) {
        window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      }
    }
    refreshSession().then(function () {
      if (params.get('checkout') !== 'cancelled' && checkPaymentReturn(params)) {
        return;
      }
      return fetchMonth(state.month);
    }).then(function () {
      prefetchMonth(shiftMonthKey(state.month, 1));
      applyServiceFromUrl(params);
      render();
    }).catch(function () {
      state.error = 'Could not load calendar. Refresh the page.';
      state.loading = false;
      render();
    });
  }

  function refreshSession(strict) {
    var url = PABooking.restUrl + 'session?_=' + String(Date.now());
    return fetch(url, {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
      .then(function (r) {
        if (!r.ok) {
          throw new Error('Session refresh failed');
        }
        return r.json();
      })
      .then(function (data) {
        if (data && data.nonce) {
          PABooking.nonce = data.nonce;
        }
        if (data && typeof data.payments_ready === 'boolean') {
          state.stripeReady = data.payments_ready;
        }
        if (data && data.payment_provider) {
          state.paymentProvider = data.payment_provider;
        }
        if (data && data.paylink_url) {
          state.paylinkUrl = data.paylink_url;
        }
        if (strict && !PABooking.nonce) {
          throw new Error('Session expired. Refresh and try again.');
        }
      })
      .catch(function (err) {
        if (strict) {
          throw err;
        }
      });
  }

  function monthKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function shiftMonthKey(key, delta) {
    var p = key.split('-');
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1 + delta, 1);
    return monthKey(d);
  }

  function fetchMonth(month) {
    if (monthCache[month]) {
      if (month === state.month) {
        state.unavailable = monthCache[month];
        state.loading = false;
      }
      return Promise.resolve(monthCache[month]);
    }
    if (month === state.month) {
      state.loading = true;
      state.error = '';
    }
    return fetch(PABooking.restUrl + 'availability?month=' + encodeURIComponent(month), {
      credentials: 'same-origin',
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        monthCache[month] = data.unavailable || [];
        if (month === state.month) {
          state.unavailable = monthCache[month];
          state.services = data.services || [];
          state.depositPerDay = data.deposit_per_day_usd || data.deposit_usd || state.depositPerDay;
          state.deposit = state.depositPerDay;
          state.stripeReady = !!data.stripe_ready;
          state.paymentProvider = data.payment_provider || (data.stripe_ready ? 'stripe' : 'none');
          state.stripeMode = data.stripe_mode || '';
          if (data.paylink_url) {
            state.paylinkUrl = data.paylink_url;
          }
          if (typeof data.min_lead_hours === 'number') {
            minLeadHours = data.min_lead_hours;
          }
          if (data.service_packages && typeof PABooking !== 'undefined') {
            PABooking.servicePackages = data.service_packages;
          }
          if (data.addons) {
            state.addonsCatalog = data.addons;
          } else if (PABooking && PABooking.addons) {
            state.addonsCatalog = PABooking.addons;
          }
          state.loading = false;
        }
        return monthCache[month];
      });
  }

  function prefetchMonth(month) {
    if (!monthCache[month]) fetchMonth(month);
  }

  function runStepAnimations() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var items = root.querySelectorAll('.pa-stagger-item');
    items.forEach(function (el, i) {
      el.style.animationDelay = (i * 0.045) + 's';
    });
  }

  // Tracks the last major step we rendered so we can animate forward/back
  // transitions directionally (like a native app), not just a generic fade.
  var lastRenderedStep = -1;
  var stepDirection = '';

  function appendStepStage(stepEl, parent) {
    parent = parent || root;
    var stage = document.createElement('div');
    stage.className = 'pa-step-stage';
    if (stepDirection === 'fwd') {
      stage.classList.add('pa-step-stage--fwd');
    } else if (stepDirection === 'back') {
      stage.classList.add('pa-step-stage--back');
    } else if (stepDirection === 'init') {
      stage.classList.add('pa-step-stage--init');
    } else if (stepDirection === 'static') {
      stage.classList.add('pa-step-stage--static');
    }
    stage.setAttribute('data-step', String(state.step));
    stage.appendChild(stepEl);
    parent.appendChild(stage);
    root.classList.add('pa-app-ready');
    runStepAnimations();
    return stage;
  }

  function render() {
    // CRITICAL: preserve any in-progress contact input before we rebuild the
    // DOM. Tapping a control (add-on, terms, etc.) triggers a full re-render;
    // without this, the rebuilt inputs reset to stale state and the customer's
    // typed name / email / phone get erased (the mobile data-loss bug).
    if (document.getElementById('pa-name')) {
      readDetailsFromForm();
    }
    while (root.firstChild) root.removeChild(root.firstChild);
    root.setAttribute('aria-busy', state.loading ? 'true' : 'false');
    root.classList.toggle('is-welcome', !!state.welcomeOpen);

    if (state.loading) {
      root.appendChild(buildSkeletonLoader());
      return;
    }

    updateFunnelChrome();

    if (state.welcomeOpen) {
      var welcome = buildWelcomeScreen();
      root.appendChild(welcome);
      if (state.focusTarget === 'step') {
        welcome.focus({ preventScroll: true });
        state.focusTarget = '';
      }
      return;
    }

    var chrome = document.createElement('div');
    chrome.className = 'pa-booking-chrome';
    chrome.appendChild(buildProgress());
    var stepContext = buildStepContext();
    if (stepContext) {
      chrome.appendChild(stepContext);
    }
    root.appendChild(chrome);

    if (state.error) {
      var err = appendEl('p', 'pa-error pa-error-v40', state.error);
      err.setAttribute('role', 'alert');
      err.setAttribute('aria-live', 'assertive');
      err.id = 'pa-booking-error';
      root.setAttribute('aria-describedby', 'pa-booking-error');
    } else {
      root.removeAttribute('aria-describedby');
    }

    // Decide transition direction. First load fades up; moving to a higher
    // step slides forward; a lower step slides back. Same-step re-renders
    // (selecting a service or date) are "static" so the whole panel does not
    // re-animate on every click — only the newly revealed section moves.
    if (lastRenderedStep === -1) {
      stepDirection = 'init';
    } else if (state.step === lastRenderedStep) {
      stepDirection = 'static';
    } else {
      stepDirection = state.step > lastRenderedStep ? 'fwd' : 'back';
    }
    lastRenderedStep = state.step;
    if (stepDirection !== 'static') {
      paGa4Event('booking_step', { step_index: state.step, step_name: activeSteps()[state.step] || '', direction: stepDirection });
    }
    root.setAttribute('data-dir', stepDirection);
    setTimeout(function() { if (root) root.removeAttribute('data-dir'); }, 180);

    var focusId = 'pa-step-focus-' + state.step;
    var scrollTarget = state.focusTarget;

    var layout = document.createElement('div');
    layout.className = 'pa-wizard-layout';
    var main = document.createElement('div');
    main.className = 'pa-wizard-main';
    layout.appendChild(main);

    if (state.step === 0) appendStepStage(buildScheduleStep(), main);
    if (state.step === 1) appendStepStage(buildDetailsStep(), main);
    if (state.step === 2) appendStepStage(buildConfirmStep(), main);

    if (shouldShowStickySummary()) {
      layout.appendChild(buildStickySummary());
    }

    root.appendChild(layout);

    var focusEl = document.getElementById(focusId);
    if (state.focusTarget === 'step' && focusEl) {
      focusEl.setAttribute('tabindex', '-1');
      focusEl.focus({ preventScroll: true });
    } else if (state.focusTarget === 'error') {
      var errEl = document.getElementById('pa-booking-error');
      if (errEl) errEl.focus({ preventScroll: true });
    } else if (state.focusTarget && state.focusTarget.indexOf('pa-') === 0) {
      var fieldEl = document.getElementById(state.focusTarget);
      if (fieldEl) {
        if (fieldEl.tagName === 'INPUT' || fieldEl.tagName === 'TEXTAREA' || fieldEl.tagName === 'SELECT') {
          fieldEl.focus({ preventScroll: true });
          if (fieldEl.type !== 'checkbox') {
            fieldEl.classList.add('pa-input-error');
          }
        }
      }
    }
    if (scrollTarget === 'pa-section-date' || scrollTarget === 'pa-section-time') {
      /* Single-screen wizard: panel swap only — never scroll the page. */
    }
    state.focusTarget = '';

    if (stepDirection === 'fwd' || stepDirection === 'back' || stepDirection === 'init') {
      announceStep();
      requestAnimationFrame(resetStepScroll);
    }

    /* No scrollToPanel — booking stays in one viewport. */
  }

  function scrollToPanel() {
    if (document.body.classList.contains('is-booking-funnel')) {
      return;
    }
    var anchor = document.getElementById('pa-booking-app');
    if (!anchor) return;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (window.matchMedia('(max-width: 900px)').matches) {
      anchor.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function appendEl(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text) el.textContent = text;
    root.appendChild(el);
    return el;
  }

  function appendBookingAction(parent, btn, stickyOnMobile, footnote) {
    var wrap = document.createElement('div');
    wrap.className = 'pa-booking-actions pa-booking-actions--primary' +
      (stickyOnMobile ? ' pa-booking-actions--sticky' : '');
    wrap.appendChild(btn);
    if (footnote) {
      wrap.appendChild(footnote);
    }
    parent.appendChild(wrap);
    return wrap;
  }

  function buildContinueFootnote(ready) {
    var p = document.createElement('p');
    p.className = 'pa-continue-footnote';
    if (!ready) {
      p.textContent = 'Pick your service, date, and time to unlock the next step.';
    } else if (state.stripeReady) {
      p.textContent = 'Next: contact details, then a secure deposit to hold your date.';
    } else {
      p.textContent = 'Next: contact details only — no payment required yet.';
    }
    return p;
  }

  function buildScheduleChecklist() {
    var flowIndex = getScheduleFlowIndex();
    var nav = document.createElement('nav');
    nav.className = 'pa-schedule-checklist';
    nav.setAttribute('aria-label', 'Schedule progress');
    var items = [
      { label: 'Service', done: !!state.service, target: 'pa-section-service', index: 0 },
      { label: 'Date', done: state.selectedDates.length > 0, target: 'pa-section-date', index: 1 },
      { label: 'Time', done: !!state.timeWindow, target: 'pa-section-time', index: 2 },
    ];
    items.forEach(function (item) {
      var isCurrent = flowIndex === item.index || (flowIndex === 3 && item.index === 2 && item.done);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pa-schedule-checklist-item' +
        (item.done ? ' is-done' : '') +
        (isCurrent ? ' is-current' : '');
      btn.disabled = !item.done && flowIndex < item.index;
      btn.setAttribute('aria-current', isCurrent ? 'step' : 'false');
      var icon = document.createElement('span');
      icon.className = 'pa-schedule-checklist-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = item.done ? '\u2713' : String(item.index + 1);
      var label = document.createElement('span');
      label.className = 'pa-schedule-checklist-label';
      label.textContent = item.label;
      btn.appendChild(icon);
      btn.appendChild(label);
      if (item.done || isCurrent) {
        btn.addEventListener('click', function (targetId) {
          return function () {
            scrollToScheduleTarget(targetId);
          };
        }(item.target));
      }
      nav.appendChild(btn);
    });
    return nav;
  }

  function buildWhatHappensNext() {
    var box = document.createElement('div');
    box.className = 'pa-whats-next';
    var title = document.createElement('p');
    title.className = 'pa-whats-next-title';
    title.textContent = 'What happens next';
    box.appendChild(title);
    var list = document.createElement('ol');
    list.className = 'pa-whats-next-list';
    var steps = state.stripeReady
      ? ['Reserve your date', 'Personal confirmation within 1 business day', 'Pre-production call before your event']
      : ['Submit your request', 'Personal confirmation within 1 business day', 'Deposit & final details by email'];
    steps.forEach(function (text, i) {
      var li = document.createElement('li');
      li.className = i === 0 ? 'is-active' : '';
      li.textContent = text;
      list.appendChild(li);
    });
    box.appendChild(list);
    return box;
  }

  function parseTimeWindow(tw) {
    var idx = tw.indexOf(' (');
    if (idx === -1) {
      return { title: tw, range: '' };
    }
    return {
      title: tw.slice(0, idx),
      range: tw.slice(idx + 2).replace(/\)$/, ''),
    };
  }

  function buildFastBanner() {
    var el = document.createElement('div');
    el.className = 'pa-fast-banner';
    el.innerHTML =
      '<span class="pa-fast-banner-lead">Takes about 3 minutes</span>' +
      '<span class="pa-fast-banner-pill">Service \u2192 Event \u2192 Reserve</span>' +
      (state.stripeReady ? '<span class="pa-fast-banner-pill">Secure checkout</span>' : '<span class="pa-fast-banner-pill">No payment now</span>');
    return el;
  }

  function buildSectionLabel(text) {
    var el = document.createElement('p');
    el.className = 'pa-section-label';
    el.textContent = text;
    return el;
  }

  function markChoice(btn, selected) {
    btn.classList.toggle('is-selected', selected);
    btn.classList.add('pa-choice');
    if (btn.getAttribute('role') !== 'radio') {
      btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
    }
  }

  function markRadio(btn, selected) {
    btn.classList.toggle('is-selected', selected);
    btn.classList.add('pa-choice');
    btn.setAttribute('aria-checked', selected ? 'true' : 'false');
  }

  function buildProgress() {
    var steps = activeSteps();
    var wrap = document.createElement('nav');
    wrap.className = 'pa-stepper pa-stepper--minimal pa-stepper-v40' + (steps.length === 2 ? ' pa-stepper-two' : ' pa-stepper-three');
    wrap.setAttribute('aria-label', 'Step ' + (state.step + 1) + ' of ' + steps.length + ': ' + steps[state.step]);

    steps.forEach(function (label, i) {
      var item;
      if (i < state.step) {
        item = document.createElement('button');
        item.type = 'button';
        item.addEventListener('click', function () {
          state.step = i;
          state.error = '';
          if (i === 0) {
            clearSchedulePanelOverride();
          }
          state.focusTarget = 'step';
          render();
        });
      } else {
        item = document.createElement('span');
      }
      item.className = 'pa-stepper-item' + (i === state.step ? ' is-active' : '') + (i < state.step ? ' is-done is-clickable' : '');
      if (i === state.step) {
        item.setAttribute('aria-current', 'step');
      }
      if (i < state.step) {
        item.setAttribute('aria-label', 'Go back to ' + label);
      }
      var num = document.createElement('span');
      num.className = 'pa-stepper-num';
      num.textContent = i < state.step ? '\u2713' : String(i + 1);
      if (i < state.step) {
        num.setAttribute('aria-hidden', 'true');
      }
      var lbl = document.createElement('span');
      lbl.className = 'pa-stepper-label';
      lbl.textContent = label;
      item.appendChild(num);
      item.appendChild(lbl);
      wrap.appendChild(item);
    });

    var meter = document.createElement('div');
    meter.className = 'pa-stepper-meter';
    meter.setAttribute('aria-hidden', 'true');
    var fill = document.createElement('span');
    fill.className = 'pa-stepper-meter-fill';
    fill.style.width = String(((state.step + 1) / steps.length) * 100) + '%';
    fill.setAttribute('data-progress', String(state.step + 1));
    meter.appendChild(fill);
    wrap.appendChild(meter);

    return wrap;
  }

  function buildStepContext() {
    var hints = activeStepHints();

    // Stepper already shows Service · Event · Review — avoid duplicate H2 titles.
    var titleText = state.step === 1 ? (hints[1] || '') : '';
    if (!titleText) {
      return null;
    }

    var header = document.createElement('header');
    header.className = 'pa-wizard-context pa-wizard-context-v40';

    var title = document.createElement('h2');
    title.className = 'pa-wizard-context-title';
    title.id = 'pa-wizard-step-title';
    title.textContent = titleText;
    header.appendChild(title);
    return header;
  }

  function buildStepBackToolbar(backLabel, ariaLabel, onBack) {
    var toolbar = document.createElement('div');
    toolbar.className = 'pa-step-toolbar pa-step-toolbar--back-only';
    var back = document.createElement('button');
    back.type = 'button';
    back.className = 'pa-wizard-back';
    back.setAttribute('aria-label', ariaLabel || ('Back to ' + backLabel));
    var chevron = document.createElement('span');
    chevron.className = 'pa-wizard-back-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '\u2039';
    var label = document.createElement('span');
    label.className = 'pa-wizard-back-label';
    label.textContent = backLabel;
    back.appendChild(chevron);
    back.appendChild(label);
    back.addEventListener('click', onBack);
    toolbar.appendChild(back);
    return toolbar;
  }

  function buildScheduleIntro() {
    var wrap = document.createElement('div');
    wrap.className = 'pa-step-intro pa-step-intro--schedule';

    var eyebrow = document.createElement('p');
    eyebrow.className = 'pa-step-intro-eyebrow';
    eyebrow.textContent = 'Step 1 · Schedule';

    var title = document.createElement('h3');
    title.className = 'pa-step-intro-title';
    title.textContent = 'Service, date & time';

    var lead = document.createElement('p');
    lead.className = 'pa-step-intro-lead';
    lead.textContent =
      'Select your coverage type, choose an available date on the calendar, then pick the time window that fits your event.';

    wrap.appendChild(eyebrow);
    wrap.appendChild(title);
    wrap.appendChild(lead);
    return wrap;
  }

  function buildStepIntro(text) {
    var wrap = document.createElement('p');
    wrap.className = 'pa-step-hint';
    wrap.textContent = text;
    return wrap;
  }

  function serviceBlurb(name) {
    var pkg = getServicePackage(name);
    return pkg.tagline || SERVICE_BLURBS[name] || 'Professional event coverage';
  }

  function getServicePackage(name) {
    var pkgs = (typeof PABooking !== 'undefined' && PABooking.servicePackages) ? PABooking.servicePackages : {};
    if (pkgs[name]) {
      return pkgs[name];
    }
    return {
      tagline: SERVICE_BLURBS[name] || 'Professional event coverage',
      duration: '',
      ideal: '',
      starting_price_cents: 0,
      includes: [],
    };
  }

  function canAdvanceFromSchedule() {
    return state.service && state.selectedDates.length > 0 && state.timeWindow;
  }

  function getScheduleFlowIndex() {
    if (!state.service) {
      return 0;
    }
    if (!state.selectedDates.length) {
      return 1;
    }
    if (!state.timeWindow) {
      return 2;
    }
    return 3;
  }

  /** Which schedule sub-panel is visible in single-screen wizard mode. */
  function getVisibleSchedulePanel() {
    if (typeof state.schedulePanelOverride === 'number') {
      return state.schedulePanelOverride;
    }
    var flow = getScheduleFlowIndex();
    return flow >= 3 ? 2 : flow;
  }

  function clearSchedulePanelOverride() {
    state.schedulePanelOverride = null;
  }

  function scheduleFlowSteps() {
    return [
      {
        id: 'service',
        label: 'Service',
        target: 'pa-section-service',
        done: !!state.service,
      },
      {
        id: 'date',
        label: state.selectedDates.length > 1 ? 'Dates' : 'Date',
        target: 'pa-section-date',
        done: state.selectedDates.length > 0,
      },
      {
        id: 'time',
        label: 'Time',
        target: 'pa-section-time',
        done: !!state.timeWindow,
      },
    ];
  }

  /** True on phone-width screens (matches the CSS single-screen breakpoint). */
  function isMobileViewport() {
    return typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(max-width: 767px)').matches;
  }

  /**
   * Decide whether the schedule step renders one sub-panel at a time
   * (Service -> Date -> Time) instead of the side-by-side overview.
   *
   * WHY: Booking should feel like a single-screen wizard on every device —
   * one focused step that fills the booking area, advanced with a Next button.
   * The old side-by-side desktop layout left the Date/Time columns empty and
   * disabled until a service was picked, which read as content "squashed" to
   * the left. So we always use the single-panel flow now (phone, tablet, desktop).
   */
  function useSchedulePanels() {
    return true;
  }

  function appendScheduleFlowClasses(el, index) {
    el.classList.remove('is-flow-done', 'is-flow-current', 'is-flow-upcoming', 'is-flow-hidden', 'is-flow-visible');
    if (!useSchedulePanels()) {
      el.classList.add('is-flow-visible');
      return;
    }
    var panel = getVisibleSchedulePanel();
    if (index === panel) {
      el.classList.add('is-flow-current');
    } else if (index < panel) {
      el.classList.add('is-flow-done');
    } else {
      el.classList.add('is-flow-upcoming');
    }
  }

  function scrollToScheduleTarget(targetId) {
    var map = { 'pa-section-service': 0, 'pa-section-date': 1, 'pa-section-time': 2 };
    if (map[targetId] !== undefined) {
      state.schedulePanelOverride = map[targetId];
      render();
    }
  }

  function buildServicePicker() {
    var section = document.createElement('section');
    section.className = 'pa-booking-section-inner pa-schedule-col';
    section.setAttribute('aria-labelledby', 'pa-service-heading');

    var heading = document.createElement('h3');
    heading.id = 'pa-service-heading';
    heading.className = 'pa-schedule-col-title pa-section-title';
    heading.textContent = 'What can we help you with?';
    if (!useSchedulePanels()) {
      section.appendChild(heading);
    }

    if (state.service && !state.serviceExpanded) {
      var row = document.createElement('div');
      row.className = 'pa-service-selected pa-service-selected--compact';
      var name = document.createElement('strong');
      name.className = 'pa-selected-value';
      name.textContent = getServiceDisplayLabel(state.service);
      row.appendChild(name);
      var pkgSelected = getServicePackage(state.service);
      if (pkgSelected && pkgSelected.starting_price_cents > 0) {
        var price = document.createElement('span');
        price.className = 'pa-service-selected-price';
        price.textContent = 'From ' + formatMoney(pkgSelected.starting_price_cents / 100);
        row.appendChild(price);
      }
      var change = document.createElement('button');
      change.type = 'button';
      change.className = 'pa-text-btn';
      change.textContent = 'Change';
      change.addEventListener('click', function () {
        state.serviceExpanded = true;
        state.schedulePanelOverride = 0;
        render();
      });
      row.appendChild(change);
      section.appendChild(row);
      return section;
    }

    var list = document.createElement('div');
    list.className = 'pa-service-list pa-service-list--simple';
    list.setAttribute('role', 'radiogroup');
    list.setAttribute('aria-label', 'Services');
    state.services.forEach(function (svc) {
      if (!SERVICE_V4_LABELS[svc]) {
        return;
      }
      var pkg = getServicePackage(svc);
      var btn = document.createElement('button');
      btn.type = 'button';
      var isRecommended = svc === RECOMMENDED_SERVICE;
      btn.className = 'pa-service-option pa-service-package pa-service-package--simple pa-choice' +
        (state.service === svc ? ' is-selected' : '') +
        (isRecommended ? ' is-recommended' : '');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', state.service === svc ? 'true' : 'false');

      var body = document.createElement('span');
      body.className = 'pa-service-option-body';

      if (isRecommended) {
        var recBadge = document.createElement('span');
        recBadge.className = 'pa-service-recommended';
        recBadge.textContent = 'Most popular';
        body.appendChild(recBadge);
      }

      var nameEl = document.createElement('span');
      nameEl.className = 'pa-service-option-name';
      nameEl.textContent = getServiceDisplayLabel(svc);
      body.appendChild(nameEl);

      var blurb = document.createElement('span');
      blurb.className = 'pa-service-option-detail';
      blurb.textContent = pkg.tagline || serviceBlurb(svc);
      body.appendChild(blurb);

      if (pkg && pkg.starting_price_cents > 0) {
        var priceEl = document.createElement('span');
        priceEl.className = 'pa-service-option-price';
        priceEl.textContent = 'From ' + formatMoney(pkg.starting_price_cents / 100);
        body.appendChild(priceEl);
      }

      btn.appendChild(body);

      if (state.service === svc) {
        var check = document.createElement('span');
        check.className = 'pa-service-option-check';
        check.setAttribute('aria-hidden', 'true');
        check.textContent = '\u2713';
        btn.appendChild(check);
      }

      btn.addEventListener('click', function () {
        if (state.service === svc) return;
        state.service = svc;
        state.serviceExpanded = false;
        state.selectedAddons = {};
        state.error = '';
        clearSchedulePanelOverride();
        prefetchMonth(shiftMonthKey(state.month, 1));
        render();
      });
      list.appendChild(btn);
    });
    section.appendChild(list);
    return section;
  }

  function goToSchedulePanel(panelIndex) {
    state.schedulePanelOverride = panelIndex;
    if (panelIndex === 0) {
      state.serviceExpanded = false;
    }
    state.error = '';
    render();
  }

  function buildWizardPanelNav(opts) {
    opts = opts || {};
    var bar = document.createElement('div');
    bar.className = 'pa-wizard-panel-nav';

    if (opts.showBack && typeof opts.onBack === 'function') {
      var back = document.createElement('button');
      back.type = 'button';
      back.className = 'pa-wizard-back';
      back.setAttribute('aria-label', 'Back to ' + (opts.backLabel || 'previous step'));
      var chevron = document.createElement('span');
      chevron.className = 'pa-wizard-back-chevron';
      chevron.setAttribute('aria-hidden', 'true');
      chevron.textContent = '\u2039';
      var backLabel = document.createElement('span');
      backLabel.className = 'pa-wizard-back-label';
      backLabel.textContent = opts.backLabel || 'Back';
      back.appendChild(chevron);
      back.appendChild(backLabel);
      back.addEventListener('click', opts.onBack);
      bar.appendChild(back);
    }

    var title = document.createElement('h3');
    title.className = 'pa-wizard-panel-title pa-section-title';
    if (opts.titleId) {
      title.id = opts.titleId;
    }
    title.textContent = opts.title || '';
    bar.appendChild(title);

    if (opts.hint) {
      var hint = document.createElement('p');
      hint.className = 'pa-panel-hint pa-wizard-panel-hint';
      hint.textContent = opts.hint;
      bar.appendChild(hint);
    }

    return bar;
  }

  function decorateSchedulePanelNav(section, panelIndex) {
    if (getVisibleSchedulePanel() !== panelIndex) {
      return;
    }
    var titles = ['What can we help you with?', 'When is your event?', 'Time'];
    var backLabels = [null, 'Service', 'Date'];
    var title = titles[panelIndex];
    if (panelIndex === 1 && state.selectedDates.length > 1) {
      title = 'Dates';
    }
    section.insertBefore(buildWizardPanelNav({
      title: title,
      titleId: panelIndex === 0 ? 'pa-service-heading' : '',
      showBack: panelIndex > 0,
      backLabel: backLabels[panelIndex],
      hint: '',
      onBack: panelIndex > 0 ? function () {
        goToSchedulePanel(panelIndex - 1);
      } : null,
    }), section.firstChild);
  }

  function buildWizardSummaryBar() {
    var row = document.createElement('div');
    row.className = 'pa-wizard-summary-bar pa-wizard-summary-bar--compact';
    row.setAttribute('aria-label', 'Your selections');

    var text = document.createElement('p');
    text.className = 'pa-wizard-summary';
    var parts = [
      state.service,
      state.selectedDates.map(formatDisplayDate).join(', '),
      state.timeWindow,
    ].filter(Boolean);
    text.textContent = parts.join(' \u00b7 ');
    row.appendChild(text);

    var edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'pa-wizard-summary-edit';
    edit.textContent = 'Edit schedule';
    edit.addEventListener('click', function () {
      state.step = 0;
      goToSchedulePanel(1);
    });
    row.appendChild(edit);

    return row;
  }

  function buildSchedulePanelNext(label, panelIndex) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pa-submit pa-btn pa-schedule-panel-next';
    btn.textContent = label;
    btn.addEventListener('click', function () {
      goToSchedulePanel(panelIndex);
    });
    return btn;
  }

  function buildPricingSummary() {
    var panel = document.createElement('aside');
    panel.className = 'pa-pricing-summary pa-pricing-summary--sticky';
    panel.setAttribute('aria-label', 'Pricing summary');

    var pkg = state.service ? getServicePackage(state.service) : null;
    var head = document.createElement('div');
    head.className = 'pa-pricing-summary-head';

    var label = document.createElement('span');
    label.className = 'pa-pricing-summary-label';
    label.textContent = state.service ? getServiceDisplayLabel(state.service) : 'Select a service';
    head.appendChild(label);

    if (!state.service) {
      panel.appendChild(head);
      var placeholder = document.createElement('p');
      placeholder.className = 'pa-pricing-summary-note pa-pricing-summary-note--placeholder';
      placeholder.textContent = 'Pricing updates as you choose your coverage.';
      panel.appendChild(placeholder);
    } else {
      if (pkg && pkg.starting_price_cents > 0) {
        var from = document.createElement('span');
        from.className = 'pa-pricing-summary-from';
        from.textContent = 'From ' + formatMoney(pkg.starting_price_cents / 100);
        head.appendChild(from);
      }
      panel.appendChild(head);
    }

    if (state.stripeReady && state.depositPerDay > 0 && state.service) {
      var deposit = document.createElement('div');
      deposit.className = 'pa-pricing-summary-deposit';
      var depLabel = document.createElement('span');
      depLabel.className = 'pa-pricing-summary-deposit-label';
      depLabel.textContent = 'Deposit';
      var depAmt = document.createElement('strong');
      depAmt.className = 'pa-pricing-summary-deposit-amount';
      depAmt.textContent = formatMoney(getDepositTotal());
      deposit.appendChild(depLabel);
      deposit.appendChild(depAmt);
      panel.appendChild(deposit);

      var note = document.createElement('p');
      note.className = 'pa-pricing-summary-note';
      note.textContent = getDayCount() > 1
        ? formatMoney(state.depositPerDay) + ' per day \u00b7 Applied toward your final project balance.'
        : 'Applied toward your final project balance.';
      panel.appendChild(note);
    }

    return panel;
  }

  function buildScheduleContinueAction() {
    var ready = canAdvanceFromSchedule();
    var actions = document.createElement('div');
    actions.className = 'pa-booking-actions pa-booking-actions--sticky pa-step-continue';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pa-submit pa-btn' + (ready ? ' is-ready' : '');
    btn.disabled = !ready;
    btn.setAttribute('aria-describedby', 'pa-schedule-continue-hint');
    btn.textContent = 'Continue';
    btn.addEventListener('click', function () {
      if (!canAdvanceFromSchedule()) {
        if (!state.service) {
          showToast('Please choose a service.', 'error');
        } else if (!state.selectedDates.length) {
          showToast('Please select an event date.', 'error');
        } else if (!state.timeWindow) {
          showToast('Please select a time window.', 'error');
        }
        return;
      }
      state.step = 1;
      state.error = '';
      state.focusTarget = 'step';
      render();
    });
    actions.appendChild(btn);

    var hint = document.createElement('p');
    hint.className = 'pa-continue-footnote';
    hint.id = 'pa-schedule-continue-hint';
    hint.textContent = ready
      ? 'Next: event details.'
      : 'Select service, date, and time to continue.';
    actions.appendChild(hint);

    return actions;
  }

  function buildScheduleStep() {
    var wrap = document.createElement('div');
    wrap.className = 'pa-step pa-step-schedule pa-schedule-v40';
    wrap.id = 'pa-step-focus-0';

    var scroll = document.createElement('div');
    scroll.className = 'pa-step-scroll';

    var sheet = document.createElement('div');
    sheet.className = 'pa-booking-sheet pa-booking-sheet--wizard pa-schedule-grid-v25 pa-schedule-sheet-v25';

    var serviceSection = document.createElement('div');
    serviceSection.id = 'pa-section-service';
    serviceSection.className = 'pa-booking-section pa-glass-section pa-glass-section--service pa-schedule-col';
    appendScheduleFlowClasses(serviceSection, 0);
    serviceSection.appendChild(buildServicePicker());
    if (useSchedulePanels()) {
      decorateSchedulePanelNav(serviceSection, 0);
    }
    sheet.appendChild(serviceSection);

    var dateSection = document.createElement('div');
    dateSection.id = 'pa-section-date';
    dateSection.className = 'pa-booking-section pa-glass-section pa-glass-section--schedule pa-schedule-col' +
      (state.service ? ' is-unlocked' : ' is-disabled');
    appendScheduleFlowClasses(dateSection, 1);

    if (!state.service) {
      dateSection.appendChild(buildEmptyState('Select a service to begin.'));
    } else {
      dateSection.appendChild(buildCalendar());
      dateSection.appendChild(buildCalLegend());
      if (state.selectedDates.length) {
        dateSection.appendChild(buildSelectedDatesChips());
      }
      if (state.selectedDates.length && useSchedulePanels() && getVisibleSchedulePanel() === 1) {
        dateSection.appendChild(buildSchedulePanelNext('Continue', 2));
      }
    }
    if (useSchedulePanels()) {
      decorateSchedulePanelNav(dateSection, 1);
    }
    sheet.appendChild(dateSection);

    var timeSection = document.createElement('div');
    timeSection.id = 'pa-section-time';
    timeSection.className = 'pa-time-section pa-glass-section pa-glass-section--time pa-schedule-col' +
      (state.service && state.selectedDates.length ? ' is-unlocked' : ' is-disabled');
    appendScheduleFlowClasses(timeSection, 2);

    if (!state.service) {
      timeSection.appendChild(buildEmptyState('Select a service to begin.'));
    } else if (!state.selectedDates.length) {
      timeSection.appendChild(buildEmptyState('Choose the day you\u2019d like us to reserve.'));
    } else {
      timeSection.appendChild(buildTimeWindows());
    }
    if (useSchedulePanels()) {
      decorateSchedulePanelNav(timeSection, 2);
    }
    sheet.appendChild(timeSection);

    scroll.appendChild(sheet);
    wrap.appendChild(scroll);

    var dock = document.createElement('div');
    dock.className = 'pa-schedule-footer-dock';
    dock.appendChild(buildPricingSummary());
    var continueWrap = buildScheduleContinueAction();
    continueWrap.classList.add('pa-schedule-footer-cta');
    dock.appendChild(continueWrap);
    wrap.appendChild(dock);

    return wrap;
  }

  function buildScheduleProgress() {
    if (!useSchedulePanels()) {
      var skip = document.createElement('div');
      skip.className = 'pa-flow-progress pa-flow-progress--hidden';
      skip.setAttribute('aria-hidden', 'true');
      return skip;
    }
    var flowIndex = getScheduleFlowIndex();
    var panel = getVisibleSchedulePanel();
    var steps = scheduleFlowSteps();
    var allDone = flowIndex === 3;

    var nav = document.createElement('nav');
    nav.className = 'pa-flow-progress pa-flow-progress--sub';
    nav.setAttribute('aria-label', 'Schedule progress');

    var track = document.createElement('ol');
    track.className = 'pa-flow-progress-track';

    steps.forEach(function (step, i) {
      var isDone = step.done;
      var isActive = i === panel;
      var isUpcoming = !isDone && !isActive;

      var item = document.createElement('li');
      item.className = 'pa-flow-progress-item' +
        (isDone ? ' is-done' : '') +
        (isActive ? ' is-active' : '') +
        (isUpcoming ? ' is-upcoming' : '') +
        (allDone && i === 2 ? ' is-complete' : '');
      if (isActive) {
        item.setAttribute('aria-current', 'step');
      }

      var stepBtn = document.createElement('button');
      stepBtn.type = 'button';
      stepBtn.className = 'pa-flow-progress-step';
      stepBtn.disabled = i > flowIndex && !isDone;
      stepBtn.setAttribute('aria-label', (isActive ? 'Current step: ' : '') + step.label);

      var icon = document.createElement('span');
      icon.className = 'pa-flow-progress-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = isDone ? '\u2713' : String(i + 1);

      var label = document.createElement('span');
      label.className = 'pa-flow-progress-label';
      label.textContent = step.label;

      stepBtn.appendChild(icon);
      stepBtn.appendChild(label);
      item.appendChild(stepBtn);
      track.appendChild(item);

      if (isDone || i <= flowIndex) {
        stepBtn.addEventListener('click', function (targetIndex) {
          return function () {
            goToSchedulePanel(targetIndex);
          };
        }(i));
      }
    });

    nav.appendChild(track);

    var fill = document.createElement('div');
    fill.className = 'pa-flow-progress-meter';
    fill.setAttribute('aria-hidden', 'true');
    var fillBar = document.createElement('span');
    fillBar.className = 'pa-flow-progress-meter-fill';
    var completed = steps.filter(function (s) { return s.done; }).length;
    fillBar.style.width = String((completed / steps.length) * 100) + '%';
    fill.appendChild(fillBar);
    nav.appendChild(fill);

    return nav;
  }

  function buildPickedBar(label, value) {
    var bar = document.createElement('div');
    bar.className = 'pa-picked-bar';
    bar.innerHTML =
      '<span class="pa-picked-label">Selected ' + escapeHtml(label) + '</span>' +
      '<span class="pa-picked-value">' + escapeHtml(value) + '</span>';
    return bar;
  }

  function buildSelectedDatesChips() {
    var wrap = document.createElement('div');
    wrap.className = 'pa-date-chips-wrap';
    var chips = document.createElement('div');
    chips.className = 'pa-date-chips';
    state.selectedDates.forEach(function (iso) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'pa-date-chip pa-date-chip-removable';
      chip.setAttribute('aria-label', 'Remove ' + formatDisplayDate(iso));
      chip.innerHTML = '<span>' + escapeHtml(formatDisplayDate(iso)) + '</span><span class="pa-date-chip-x" aria-hidden="true">\u00d7</span>';
      chip.addEventListener('click', function () {
        toggleSelectedDate(iso);
        render();
      });
      chips.appendChild(chip);
    });
    if (state.timeWindow) {
      var timeChip = document.createElement('span');
      timeChip.className = 'pa-date-chip pa-date-chip-time';
      timeChip.textContent = shortTimeWindow(state.timeWindow);
      chips.appendChild(timeChip);
    }
    wrap.appendChild(chips);
    return wrap;
  }

  function buildScheduleTrust() {
    var el = document.createElement('p');
    el.className = 'pa-schedule-trust';
    el.setAttribute('role', 'note');
    var items = ['Pennsylvania-based team', 'Confirmation within one business day'];
    if (state.stripeReady) {
      items.push('Secure deposit at checkout');
    }
    el.innerHTML = items.map(function (text) {
      return '<span class="pa-schedule-trust-item">' + escapeHtml(text) + '</span>';
    }).join('<span class="pa-schedule-trust-dot" aria-hidden="true">\u00b7</span>');
    return el;
  }

  function analyzeMonthAvailability(y, m) {
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var minBook = new Date();
    minBook.setHours(minBook.getHours() + minLeadHours);
    minBook.setHours(0, 0, 0, 0);
    var openCount = 0;
    var monthPrefix = y + '-' + String(m + 1).padStart(2, '0');
    for (var day = 1; day <= daysInMonth; day++) {
      var dateObj = new Date(y, m, day);
      var iso = monthPrefix + '-' + String(day).padStart(2, '0');
      var isPast = dateObj < today;
      var isLead = !isPast && dateObj < minBook;
      var isBooked = state.unavailable.indexOf(iso) !== -1;
      if (!isPast && !isLead && !isBooked) {
        openCount += 1;
      }
    }
    return openCount;
  }

  function calendarSubtitleText(openCount) {
    if (state.selectedDates.length) {
      return state.selectedDates.length + ' date' + (state.selectedDates.length > 1 ? 's' : '') + ' selected';
    }
    if (openCount === 0) {
      return 'No open dates this month';
    }
    if (openCount === 1) {
      return '1 open date';
    }
    return openCount + ' open dates';
  }

  function buildCalendarMetaStrip(openCount) {
    var strip = document.createElement('div');
    strip.className = 'pa-cal-meta';
    var badge = document.createElement('span');
    badge.className = 'pa-cal-availability-badge' + (openCount === 0 ? ' is-empty' : '');
    badge.textContent = openCount === 0 ? 'Fully booked' : (openCount === 1 ? '1 open date' : openCount + ' open dates');
    strip.appendChild(badge);
    if (state.month > monthKey(new Date())) {
      var todayBtn = document.createElement('button');
      todayBtn.type = 'button';
      todayBtn.className = 'pa-cal-today-btn';
      todayBtn.textContent = 'Today';
      todayBtn.addEventListener('click', function () {
        state.month = monthKey(new Date());
        fetchMonth(state.month).then(function () {
          render();
        });
      });
      strip.appendChild(todayBtn);
    }
    return strip;
  }

  function buildCalendarFooter() {
    var foot = document.createElement('p');
    foot.className = 'pa-cal-timezone';
    var email = (window.PASite && PASite.notifyEmail) || 'jordan@pamedia.art';
    foot.appendChild(document.createTextNode('All times are Eastern (Pennsylvania). Questions? Email '));
    var mail = document.createElement('a');
    mail.href = 'mailto:' + email;
    mail.textContent = email;
    foot.appendChild(mail);
    foot.appendChild(document.createTextNode('.'));
    return foot;
  }

  function buildCalLegend() {
    var leadH = (typeof PABooking !== 'undefined' && PABooking.minLeadHours) ? PABooking.minLeadHours : 48;
    var leadLabel = leadH >= 48 ? Math.round(leadH / 24) + '-day lead' : leadH + 'hr lead';
    var legend = document.createElement('div');
    legend.className = 'pa-cal-legend';
    legend.setAttribute('role', 'list');
    legend.setAttribute('aria-label', 'Calendar key');
    legend.innerHTML =
      '<span class="pa-cal-legend-item" role="listitem"><span class="pa-cal-legend-swatch is-open" aria-hidden="true"></span>Available</span>' +
      '<span class="pa-cal-legend-item" role="listitem"><span class="pa-cal-legend-swatch is-booked" aria-hidden="true"></span>Booked</span>' +
      '<span class="pa-cal-legend-item" role="listitem"><span class="pa-cal-legend-swatch is-past" aria-hidden="true"></span>Unavailable</span>' +
      '<span class="pa-cal-legend-item pa-cal-legend-item--lead" role="listitem"><span class="pa-cal-legend-swatch is-lead" aria-hidden="true"></span>' + escapeHtml(leadLabel) + ' required</span>';
    return legend;
  }

  function buildDepositPreviewStrip() {
    var strip = document.createElement('div');
    strip.className = 'pa-deposit-preview';
    strip.setAttribute('role', 'status');
    strip.setAttribute('aria-live', 'polite');
    var total = getDepositTotal();
    if (getDayCount() === 1) {
      strip.textContent = 'Deposit due at checkout: ' + formatMoney(total) + ' (1 day)';
    } else {
      strip.textContent = 'Deposit due at checkout: ' + formatMoney(total) + ' (' + formatMoney(state.depositPerDay) + ' \u00d7 ' + getDayCount() + ' days)';
    }
    return strip;
  }

  function buildTimeWindows() {
    var wrap = document.createElement('div');
    wrap.className = 'pa-time-wrap';
    var grid = document.createElement('div');
    grid.className = 'pa-time-grid pa-time-grid-v40';
    grid.setAttribute('role', 'radiogroup');
    grid.setAttribute('aria-label', 'Time windows');
    TIME_WINDOWS.forEach(function (tw, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pa-time-card pa-choice' + (state.timeWindow === tw ? ' is-selected' : '');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', state.timeWindow === tw ? 'true' : 'false');
      var parts = parseTimeWindow(tw);
      btn.innerHTML =
        '<span class="pa-time-title">' + escapeHtml(parts.title) + '</span>' +
        (parts.range ? '<span class="pa-time-range">' + escapeHtml(parts.range) + '</span>' : '');
      markRadio(btn, state.timeWindow === tw);
      btn.addEventListener('click', function () {
        state.timeWindow = tw;
        state.error = '';
        clearSchedulePanelOverride();
        render();
      });
      grid.appendChild(btn);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function buildCalendar() {
    var wrap = document.createElement('div');
    wrap.className = 'pa-cal pa-cal-premium pa-cal-pro pa-cal-v40';
    wrap.setAttribute('data-month', state.month);
    var parts = state.month.split('-');
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10) - 1;
    var openCount = analyzeMonthAvailability(y, m);
    var slideClass = state.calDirection > 0 ? 'fwd' : (state.calDirection < 0 ? 'back' : '');

    var shell = document.createElement('div');
    shell.className = 'pa-cal-shell';

    shell.appendChild(buildCalendarMetaStrip(openCount));

    var header = document.createElement('div');
    header.className = 'pa-cal-header';

    var prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'pa-cal-nav-btn';
    prev.innerHTML = '<span aria-hidden="true">&#8249;</span>';
    prev.setAttribute('aria-label', 'Previous month');
    prev.disabled = state.month <= monthKey(new Date());
    prev.addEventListener('click', function () { shiftMonth(-1); });

    var titleWrap = document.createElement('div');
    titleWrap.className = 'pa-cal-title-wrap';
    var title = document.createElement('h4');
    title.className = 'pa-cal-title';
    title.id = 'pa-cal-month-label';
    title.textContent = MONTHS[m] + ' ' + parts[0];
    titleWrap.appendChild(title);
    var sub = document.createElement('p');
    sub.className = 'pa-cal-subtitle';
    sub.textContent = calendarSubtitleText(openCount);
    titleWrap.appendChild(sub);

    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'pa-cal-nav-btn';
    nextBtn.innerHTML = '<span aria-hidden="true">&#8250;</span>';
    nextBtn.setAttribute('aria-label', 'Next month');
    nextBtn.addEventListener('click', function () { shiftMonth(1); });

    header.appendChild(prev);
    header.appendChild(titleWrap);
    header.appendChild(nextBtn);
    shell.appendChild(header);

    var gridWrap = document.createElement('div');
    gridWrap.className = 'pa-cal-grid-wrap' + (slideClass ? ' pa-cal-grid-wrap--' + slideClass : '');

    var grid = document.createElement('div');
    grid.className = 'pa-cal-grid';
    grid.setAttribute('role', 'grid');
    grid.setAttribute('aria-labelledby', 'pa-cal-month-label');
    DOW.forEach(function (d) {
      var el = document.createElement('div');
      el.className = 'pa-cal-dow';
      el.setAttribute('role', 'columnheader');
      el.textContent = d;
      grid.appendChild(el);
    });

    var startDow = new Date(y, m, 1).getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var minBook = new Date();
    minBook.setHours(minBook.getHours() + minLeadHours);
    minBook.setHours(0, 0, 0, 0);

    for (var i = 0; i < startDow; i++) {
      var blank = document.createElement('div');
      blank.className = 'pa-cal-day is-empty';
      blank.setAttribute('aria-hidden', 'true');
      grid.appendChild(blank);
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var dateObj = new Date(y, m, day);
      var iso = state.month + '-' + String(day).padStart(2, '0');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pa-cal-day';
      btn.setAttribute('role', 'gridcell');
      btn.textContent = String(day);
      var label = formatDisplayDate(iso);
      var dow = dateObj.getDay();
      if (dow === 0 || dow === 6) {
        btn.classList.add('is-weekend');
      }
      var isToday = dateObj.getTime() === today.getTime();
      if (isToday) {
        btn.classList.add('is-today');
      }
      var isPast = dateObj < today;
      var isLead = !isPast && dateObj < minBook;
      var isBooked = state.unavailable.indexOf(iso) !== -1;
      if (isPast || isLead || isBooked) {
        btn.classList.add(isPast || isLead ? 'is-past' : 'is-unavailable');
        btn.disabled = true;
        if (isBooked) {
          btn.setAttribute('aria-label', label + ' — booked');
        } else if (isLead) {
          btn.setAttribute('aria-label', label + ' — requires ' + minLeadHours + ' hours notice');
        } else {
          btn.setAttribute('aria-label', label + ' — unavailable');
        }
      } else {
        btn.classList.add('is-available');
        btn.setAttribute('aria-label', label + ' — available');
        btn.addEventListener('click', (function (d) {
          return function () {
            toggleSelectedDate(d);
            render();
          };
        })(iso));
      }
      if (state.selectedDates.indexOf(iso) !== -1) {
        btn.classList.add('is-selected', 'pa-choice');
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('aria-label', label + ' — selected');
      }
      grid.appendChild(btn);
    }
    gridWrap.appendChild(grid);
    if (openCount === 0) {
      var empty = document.createElement('div');
      empty.className = 'pa-cal-empty';
      var emptyTitle = document.createElement('p');
      emptyTitle.className = 'pa-cal-empty-title';
      emptyTitle.textContent = 'This month is full';
      empty.appendChild(emptyTitle);
      var emptyLead = document.createElement('p');
      emptyLead.className = 'pa-cal-empty-lead';
      emptyLead.textContent = 'Every date is booked or outside our booking window. Check the next month.';
      empty.appendChild(emptyLead);
      var emptyBtn = document.createElement('button');
      emptyBtn.type = 'button';
      emptyBtn.className = 'pa-cal-empty-btn';
      emptyBtn.textContent = 'Next month';
      emptyBtn.addEventListener('click', function () { shiftMonth(1); });
      empty.appendChild(emptyBtn);
      gridWrap.appendChild(empty);
    }
    shell.appendChild(gridWrap);
    wrap.appendChild(shell);
    return wrap;
  }

  function buildPaymentScheduleCard() {
    if (!state.stripeReady || !state.selectedDates.length) {
      return null;
    }
    var card = document.createElement('div');
    card.className = 'pa-payment-schedule';
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', 'Payment schedule');

    var title = document.createElement('p');
    title.className = 'pa-payment-schedule-title';
    title.textContent = 'Payment schedule';
    card.appendChild(title);

    var list = document.createElement('ul');
    list.className = 'pa-payment-schedule-list';

    var today = document.createElement('li');
    today.className = 'is-due';
    var todayWhen = document.createElement('span');
    todayWhen.className = 'pa-pay-when';
    todayWhen.textContent = 'Today';
    var todayWhat = document.createElement('span');
    todayWhat.className = 'pa-pay-what';
    var todayStrong = document.createElement('strong');
    todayStrong.textContent = formatMoney(getDepositTotal());
    todayWhat.appendChild(todayStrong);
    todayWhat.appendChild(document.createTextNode(' deposit — holds your date'));
    today.appendChild(todayWhen);
    today.appendChild(todayWhat);
    list.appendChild(today);

    var later = document.createElement('li');
    var laterWhen = document.createElement('span');
    laterWhen.className = 'pa-pay-when';
    laterWhen.textContent = 'Before event';
    var laterWhat = document.createElement('span');
    laterWhat.className = 'pa-pay-what';
    laterWhat.textContent = 'Remaining balance per your written quote';
    later.appendChild(laterWhen);
    later.appendChild(laterWhat);
    list.appendChild(later);

    card.appendChild(list);

    var note = document.createElement('p');
    note.className = 'pa-payment-schedule-note';
    note.textContent = 'Deposit applies toward your final invoice. Full package pricing confirmed within one business day.';
    card.appendChild(note);

    return card;
  }

  var policiesDialogEl = null;

  /**
   * Booking policies live in hidden page supplement; show them in an accessible dialog.
   */
  function ensureBookingPoliciesDialog() {
    if (policiesDialogEl) {
      return policiesDialogEl;
    }

    var dialog = document.createElement('dialog');
    dialog.className = 'pa-policies-dialog';
    dialog.id = 'pa-booking-policies-dialog';
    dialog.setAttribute('aria-labelledby', 'pa-booking-policies-dialog-title');

    var panel = document.createElement('div');
    panel.className = 'pa-policies-dialog__panel';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'pa-policies-dialog__close';
    closeBtn.setAttribute('aria-label', 'Close booking policies');
    closeBtn.textContent = 'Close';

    var title = document.createElement('h2');
    title.id = 'pa-booking-policies-dialog-title';
    title.className = 'pa-policies-dialog__title';
    title.textContent = 'Booking policies';

    var grid = document.createElement('div');
    grid.className = 'pa-policies-dialog__grid';

    var policies = (PABooking && PABooking.policies) ? PABooking.policies : {};
    [
      { key: 'deposit', label: 'Deposit' },
      { key: 'cancel', label: 'Cancellation' },
      { key: 'travel', label: 'Travel' },
    ].forEach(function (item) {
      var copy = policies[item.key];
      if (!copy) {
        return;
      }
      var card = document.createElement('div');
      card.className = 'pa-policy-card';
      var heading = document.createElement('h3');
      heading.textContent = item.label;
      var body = document.createElement('p');
      body.textContent = copy;
      card.appendChild(heading);
      card.appendChild(body);
      grid.appendChild(card);
    });

    if (!grid.childNodes.length) {
      var fallback = document.createElement('p');
      fallback.className = 'pa-policies-dialog__empty';
      fallback.textContent = 'Policy details are confirmed in your booking email.';
      grid.appendChild(fallback);
    }

    var legal = document.createElement('p');
    legal.className = 'pa-policies-dialog__legal';
    var privacyUrl = (PABooking && PABooking.legal && PABooking.legal.privacyUrl)
      ? PABooking.legal.privacyUrl
      : '/privacy-policy/';
    var termsUrl = (PABooking && PABooking.legal && PABooking.legal.termsUrl)
      ? PABooking.legal.termsUrl
      : '/terms-of-service/';
    var privacyA = document.createElement('a');
    privacyA.href = privacyUrl;
    privacyA.target = '_blank';
    privacyA.rel = 'noopener noreferrer';
    privacyA.textContent = 'Privacy Policy';
    var termsA = document.createElement('a');
    termsA.href = termsUrl;
    termsA.target = '_blank';
    termsA.rel = 'noopener noreferrer';
    termsA.textContent = 'Terms of Service';
    legal.appendChild(privacyA);
    legal.appendChild(document.createTextNode(' · '));
    legal.appendChild(termsA);

    closeBtn.addEventListener('click', function () {
      dialog.close();
    });
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) {
        dialog.close();
      }
    });

    panel.appendChild(closeBtn);
    panel.appendChild(title);
    panel.appendChild(grid);
    panel.appendChild(legal);
    dialog.appendChild(panel);
    document.body.appendChild(dialog);
    policiesDialogEl = dialog;
    return dialog;
  }

  function openBookingPoliciesDialog() {
    var dialog = ensureBookingPoliciesDialog();
    if (typeof dialog.showModal === 'function') {
      try {
        dialog.showModal();
        return;
      } catch (err) {
        /* fall through for legacy browsers */
      }
    }
    dialog.setAttribute('open', 'open');
  }

  function stopTermsLinkBubble(e) {
    e.stopPropagation();
  }

  function buildTermsAgreement() {
    if (!state.stripeReady) {
      return null;
    }
    var wrap = document.createElement('div');
    wrap.className = 'pa-terms-agreement pa-terms-agreement-v40' + (state.fieldErrors['pa-terms-agree'] ? ' has-error' : '');

    var label = document.createElement('label');
    label.className = 'pa-terms-agreement-label';
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = 'pa-terms-agree';
    cb.className = 'pa-terms-checkbox';
    cb.checked = !!state.termsAccepted;
    if (state.fieldErrors['pa-terms-agree']) {
      cb.setAttribute('aria-invalid', 'true');
    }
    cb.addEventListener('change', function () {
      state.termsAccepted = cb.checked;
      delete state.fieldErrors['pa-terms-agree'];
      wrap.classList.toggle('has-error', false);
      cb.removeAttribute('aria-invalid');
      var errEl = document.getElementById('pa-terms-agree-error');
      if (errEl && errEl.parentNode) errEl.parentNode.removeChild(errEl);
    });

    var text = document.createElement('span');
    text.className = 'pa-terms-agreement-text';
    text.appendChild(document.createTextNode('I agree to the '));
    var policyLink = document.createElement('a');
    policyLink.href = '#pa-booking-policies';
    policyLink.className = 'pa-terms-link';
    policyLink.textContent = 'booking policies';
    policyLink.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openBookingPoliciesDialog();
    });
    text.appendChild(policyLink);
    text.appendChild(document.createTextNode(' and authorize my deposit. '));
    var privacy = (PABooking && PABooking.legal && PABooking.legal.privacyUrl) ? PABooking.legal.privacyUrl : '/privacy-policy/';
    var terms = (PABooking && PABooking.legal && PABooking.legal.termsUrl) ? PABooking.legal.termsUrl : '/terms-of-service/';
    var privacyLink = document.createElement('a');
    privacyLink.href = privacy;
    privacyLink.className = 'pa-terms-link';
    privacyLink.target = '_blank';
    privacyLink.rel = 'noopener noreferrer';
    privacyLink.textContent = 'Privacy';
    privacyLink.addEventListener('click', stopTermsLinkBubble);
    text.appendChild(privacyLink);
    text.appendChild(document.createTextNode(' · '));
    var termsLink = document.createElement('a');
    termsLink.href = terms;
    termsLink.className = 'pa-terms-link';
    termsLink.target = '_blank';
    termsLink.rel = 'noopener noreferrer';
    termsLink.textContent = 'Terms';
    termsLink.addEventListener('click', stopTermsLinkBubble);
    text.appendChild(termsLink);

    label.appendChild(cb);
    label.appendChild(text);
    wrap.appendChild(label);

    if (state.fieldErrors['pa-terms-agree']) {
      var err = document.createElement('p');
      err.className = 'pa-field-error-msg';
      err.id = 'pa-terms-agree-error';
      err.textContent = state.fieldErrors['pa-terms-agree'];
      wrap.appendChild(err);
    }
    return wrap;
  }

  function getSelectedAddonIds() {
    return Object.keys(state.selectedAddons).filter(function (id) {
      return state.selectedAddons[id];
    });
  }

  function getAddonsForService() {
    var catalog = state.addonsCatalog.length
      ? state.addonsCatalog
      : ((PABooking && PABooking.addons) ? PABooking.addons : []);
    if (!state.service) {
      return catalog;
    }
    return catalog.filter(function (addon) {
      if (!addon.services || !addon.services.length) {
        return true;
      }
      return addon.services.indexOf(state.service) !== -1;
    });
  }

  function getPackageBaseCents() {
    var pkg = getServicePackage(state.service);
    var perDay = pkg.starting_price_cents || 0;
    if (!perDay) {
      return 0;
    }
    return perDay * getDayCount();
  }

  function getAddonsTotalCents() {
    var total = 0;
    getAddonsForService().forEach(function (addon) {
      if (state.selectedAddons[addon.id]) {
        total += addon.price_cents || 0;
      }
    });
    return total;
  }

  function getEstimateTotalCents() {
    return getPackageBaseCents() + getAddonsTotalCents();
  }

  function getBalanceDueCents() {
    var estimate = getEstimateTotalCents();
    if (!estimate) {
      return 0;
    }
    return Math.max(0, estimate - Math.round(getDepositTotal() * 100));
  }

  function icsHoursFromTimeWindow(tw) {
    if (!tw || tw.indexOf('Full day') === 0) {
      return { startH: 9, startM: 0, endH: 23, endM: 0 };
    }
    if (tw.indexOf('Morning') === 0) {
      return { startH: 9, startM: 0, endH: 13, endM: 0 };
    }
    if (tw.indexOf('Afternoon') === 0) {
      return { startH: 13, startM: 0, endH: 17, endM: 0 };
    }
    if (tw.indexOf('Evening') === 0) {
      return { startH: 17, startM: 0, endH: 23, endM: 0 };
    }
    return { startH: 9, startM: 0, endH: 17, endM: 0 };
  }

  function buildBookingPayload() {
    var notes = state.notes || '';
    var utm = getUtmAttributionNote();
    if (utm) {
      notes = notes ? notes + '\n' + utm : utm;
    }
    return {
      event_dates: state.selectedDates,
      service: state.service,
      name: state.name,
      email: state.email,
      phone: state.phone,
      event_type: state.eventType,
      time_window: state.timeWindow,
      venue: state.venue,
      organization: state.organization,
      notes: notes,
      guest_count: state.guestCount,
      terms_accepted: state.termsAccepted,
      addons: getSelectedAddonIds(),
      timeline_notes: state.timelineNotes,
      venue_access: state.venueAccess,
      deliverables_notes: state.deliverablesNotes,
      estimate_cents: 0,
    };
  }

  function buildAddonsSection() {
    var addons = getAddonsForService();
    if (!addons.length) {
      return null;
    }
    var section = document.createElement('fieldset');
    section.className = 'pa-form-group pa-addons-group';
    var legend = document.createElement('legend');
    legend.className = 'pa-form-group-title';
    legend.textContent = 'Add-ons';
    section.appendChild(legend);
    var hint = document.createElement('p');
    hint.className = 'pa-form-group-hint';
    hint.textContent = 'Optional upgrades — final quote confirmed in writing after booking.';
    section.appendChild(hint);
    var list = document.createElement('div');
    list.className = 'pa-addons-list';
    addons.forEach(function (addon) {
      var label = document.createElement('label');
      label.className = 'pa-addon-option';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'pa-addon-checkbox';
      cb.value = addon.id;
      cb.checked = !!state.selectedAddons[addon.id];
      cb.addEventListener('change', function () {
        if (cb.checked) {
          state.selectedAddons[addon.id] = true;
        } else {
          delete state.selectedAddons[addon.id];
        }
        render();
      });
      var body = document.createElement('span');
      body.className = 'pa-addon-body';
      var top = document.createElement('span');
      top.className = 'pa-addon-top';
      var name = document.createElement('span');
      name.className = 'pa-addon-name';
      name.textContent = addon.label;
      top.appendChild(name);
      body.appendChild(top);
      if (addon.description) {
        var desc = document.createElement('span');
        desc.className = 'pa-addon-desc';
        desc.textContent = addon.description;
        body.appendChild(desc);
      }
      label.appendChild(cb);
      label.appendChild(body);
      list.appendChild(label);
    });
    section.appendChild(list);
    return section;
  }

  /** Strip legacy sample venue copy (never show Hilton Harrisburg). */
  function sanitizeVenueValue(value) {
    var v = String(value || '').trim();
    if (!v) {
      return '';
    }
    if (/^hilton\s+harrisburg$/i.test(v)) {
      return '';
    }
    return v;
  }

  function buildDetailsStep() {
    var wrap = document.createElement('div');
    wrap.className = 'pa-step pa-step-details';
    wrap.id = 'pa-step-focus-' + state.step;

    var scroll = document.createElement('div');
    scroll.className = 'pa-step-scroll';

    scroll.appendChild(buildStepBackToolbar('Schedule', 'Back to service and date', function () {
      state.step = 0;
      goToSchedulePanel(2);
    }));

    var form = document.createElement('div');
    form.className =
      'pa-form pa-form-sheet pa-form-sheet--grouped pa-form-wizard pa-form-sheet--flat pa-form-v40 pa-details-form';
    form.setAttribute('aria-label', 'Contact and event details');

    /* Single clear stack: type → venue → contact → notes (no jumbled two-column). */
    var stack = document.createElement('div');
    stack.className = 'pa-form-wizard-columns pa-form-wizard-columns--stack';

    var col = document.createElement('div');
    col.className = 'pa-form-wizard-col pa-form-wizard-col--primary';

    state.venue = sanitizeVenueValue(state.venue);

    if (isPhotoVideoService()) {
      var typeGroup = buildFormGroup('Event type', 'What kind of event is this?', [
        buildEventTypePills({ hideLegend: true }),
      ]);
      typeGroup.classList.add('pa-form-group--wizard', 'pa-form-group--event-type');
      col.appendChild(typeGroup);
    }

    var venueGroup = buildFormGroup('Venue', '', [
      inputField(
        'Venue name',
        'venue',
        'text',
        state.venue,
        true,
        'organization',
        'Venue name',
        ''
      ),
    ]);
    venueGroup.classList.add('pa-form-group--wizard', 'pa-form-group--location');
    col.appendChild(venueGroup);

    var contactGroup = buildFormGroup('Contact', 'How we reach you about this booking.', [
      inputField('Full name', 'name', 'text', state.name, true, 'name', 'Your full name', ''),
      inputField('Email', 'email', 'email', state.email, true, 'email', 'you@example.com', ''),
      inputField('Phone', 'phone', 'tel', state.phone, true, 'tel', '(717) 555-0100', ''),
    ]);
    contactGroup.classList.add('pa-form-group--wizard', 'pa-form-group--contact');
    col.appendChild(contactGroup);

    var eventWrap = textareaField(
      'About the event',
      'notes',
      state.notes,
      eventNotesPlaceholder(),
      ''
    );
    var eventTa = eventWrap.querySelector('textarea');
    if (eventTa) {
      eventTa.rows = 3;
      eventTa.placeholder = eventNotesPlaceholder();
      wireTextareaBlur(eventWrap, 'pa-notes');
    }
    var extraWrap = textareaField(
      'Additional notes (optional)',
      'extra-notes',
      state.timelineNotes,
      'Accessibility, parking, second shooter…',
      ''
    );
    var extraTa = extraWrap.querySelector('textarea');
    if (extraTa) {
      extraTa.rows = 2;
      wireTextareaBlur(extraWrap, 'pa-extra-notes');
    }
    var detailsGroup = buildFormGroup('Details', 'Guest count, timeline, or anything we should know.', [
      eventWrap,
      extraWrap,
    ]);
    detailsGroup.classList.add('pa-form-group--wizard', 'pa-form-group--event-details');
    col.appendChild(detailsGroup);

    stack.appendChild(col);
    form.appendChild(stack);
    scroll.appendChild(form);
    wrap.appendChild(scroll);

    var next = document.createElement('button');
    next.type = 'button';
    next.className = 'pa-submit pa-btn is-ready';
    next.textContent = 'Continue to review';
    next.addEventListener('click', function () {
      var validation = validateContactForm();
      if (validation) {
        if (validation.field === 'error') {
          state.error = validation.message;
          state.focusTarget = 'error';
          showToast(validation.message, 'error');
        } else {
          clearFieldErrors();
          setFieldError(validation.field, validation.message, true);
        }
        render();
        return;
      }
      clearFieldErrors();
      state.error = '';
      state.step = 2;
      state.focusTarget = 'step';
      render();
    });
    var footnote = document.createElement('p');
    footnote.className = 'pa-continue-footnote';
    footnote.textContent = 'Next: review your booking.';
    appendBookingAction(wrap, next, true, footnote);

    return wrap;
  }

  function wireTextareaBlur(wrap, fieldId) {
    var ta = wrap.querySelector('textarea');
    if (!ta) return;
    ta.addEventListener('input', function () {
      scheduleDraftSave();
      if (state.fieldErrors[fieldId]) {
        delete state.fieldErrors[fieldId];
        wrap.classList.remove('has-error');
        ta.removeAttribute('aria-invalid');
        var errEl = document.getElementById(fieldId + '-error');
        if (errEl && errEl.parentNode) errEl.parentNode.removeChild(errEl);
      }
    });
  }

  function wireDetailsPayButton(wrap) {
    var btn = wrap.querySelector('.pa-checkout-btn');
    if (!btn) return;
    var fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);
    fresh.addEventListener('click', function () {
      if (state.submitting) return;
      var validation = validateDetailsForm();
      if (validation) {
        if (validation.field === 'error') {
          state.error = validation.message;
          state.focusTarget = 'error';
          showToast(validation.message, 'error');
        } else {
          clearFieldErrors();
          setFieldError(validation.field, validation.message);
        }
        render();
        return;
      }
      var payErr = validatePaylinkReady();
      if (payErr) {
        state.error = payErr;
        state.focusTarget = 'error';
        showToast(payErr, 'error');
        render();
        return;
      }
      clearFieldErrors();
      state.error = '';
      saveDraft();
      submitBooking();
    });
  }

  function buildEventTypePills(opts) {
    opts = opts || {};
    var wrap = document.createElement('fieldset');
    wrap.className = 'pa-event-wrap pa-event-wrap-v40';
    if (!opts.hideLegend) {
      var legend = document.createElement('legend');
      legend.className = 'pa-field-label';
      legend.textContent = 'Event type';
      wrap.appendChild(legend);
    }
    var grid = document.createElement('div');
    grid.className = 'pa-event-grid';
    grid.setAttribute('role', 'radiogroup');
    grid.setAttribute('aria-label', 'Event type');
    EVENT_TYPES.forEach(function (type) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pa-event-pill pa-choice' + (state.eventType === type ? ' is-selected' : '');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', state.eventType === type ? 'true' : 'false');
      btn.setAttribute('data-value', type);
      btn.textContent = type;
      markRadio(btn, state.eventType === type);
      btn.addEventListener('click', function () {
        state.eventType = type;
        state.error = '';
        render();
      });
      grid.appendChild(btn);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function buildBookingRecap() {
    readDetailsFromForm();
    var recap = document.createElement('aside');
    recap.className = 'pa-booking-recap pa-review-summary pa-review-summary-v40';
    recap.setAttribute('aria-label', 'Booking summary');

    var title = document.createElement('h3');
    title.className = 'pa-review-summary-title';
    title.textContent = 'Booking summary';
    recap.appendChild(title);

    var list = document.createElement('div');
    list.className = 'pa-review-summary-list';

    function addRow(label, value, editStep, scrollTarget) {
      if (!value) return;
      var row = document.createElement('div');
      row.className = 'pa-review-summary-row';
      var dt = document.createElement('dt');
      dt.className = 'pa-review-summary-label';
      dt.textContent = label;
      var dd = document.createElement('dd');
      dd.className = 'pa-review-summary-value';
      dd.textContent = value;
      row.appendChild(dt);
      row.appendChild(dd);
      if (typeof editStep === 'number') {
        var editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'pa-review-summary-edit';
        editBtn.textContent = 'Edit';
        editBtn.setAttribute('aria-label', 'Edit ' + label.toLowerCase());
        editBtn.addEventListener('click', function (step, targetId) {
          return function () {
            state.step = step;
            state.error = '';
            if (step === 0) {
              state.focusTarget = targetId === 'pa-section-service' ? '' : (targetId || '');
            } else {
              state.focusTarget = 'step';
            }
            render();
            if (step === 0 && targetId) {
              requestAnimationFrame(function () {
                scrollToScheduleTarget(targetId);
              });
            }
          };
        }(editStep, scrollTarget || ''));
        row.appendChild(editBtn);
      }
      list.appendChild(row);
    }

    addRow('Service', state.service ? getServiceDisplayLabel(state.service) : '', 0, 'pa-section-service');
    if (state.eventType) {
      addRow('Event type', state.eventType, 1);
    }
    addRow(
      state.selectedDates.length > 1 ? 'Dates' : 'Date',
      formatDatesSummary(),
      0,
      'pa-section-date'
    );
    addRow('Location', state.venue, 1);
    addRow('Time', state.timeWindow ? shortTimeWindow(state.timeWindow) : '', 0, 'pa-section-time');
    if (state.stripeReady && state.depositPerDay > 0) {
      var depRow = document.createElement('div');
      depRow.className = 'pa-review-summary-row pa-review-summary-row--deposit';
      var depDt = document.createElement('dt');
      depDt.className = 'pa-review-summary-label';
      depDt.textContent = 'Deposit Today';
      var depDd = document.createElement('dd');
      depDd.className = 'pa-review-summary-value pa-review-summary-deposit';
      depDd.textContent = formatMoney(getDepositTotal());
      depRow.appendChild(depDt);
      depRow.appendChild(depDd);
      list.appendChild(depRow);
    }

    recap.appendChild(list);
    return recap;
  }

  function buildDepositTrust() {
    var list = document.createElement('ul');
    list.className = 'pa-deposit-trust-list';
    [
      'Your requested date is reserved once your deposit is received.',
      'Your deposit is applied toward your final balance.',
      'You\u2019ll receive a customized proposal and estimate after we review your booking.',
    ].forEach(function (text) {
      var item = document.createElement('li');
      item.className = 'pa-deposit-trust-item';
      item.textContent = text;
      list.appendChild(item);
    });
    return list;
  }

  function buildSummaryBar() {
    return buildBookingRecap();
  }

  function shortTimeWindow(tw) {
    if (!tw) return '';
    if (tw.indexOf('Full day') === 0) return 'Full day';
    if (tw.indexOf('Morning') === 0) return 'Morning';
    if (tw.indexOf('Afternoon') === 0) return 'Afternoon';
    if (tw.indexOf('Evening') === 0) return 'Evening';
    return tw;
  }

  function buildConfirmStep() {
    var wrap = document.createElement('div');
    wrap.className = 'pa-step pa-step-review pa-step-pay pa-step-review-final pa-step-review-v40';
    wrap.id = 'pa-step-focus-2';

    var scroll = document.createElement('div');
    scroll.className = 'pa-step-scroll pa-step-scroll--review';

    scroll.appendChild(buildStepBackToolbar('Details', 'Back to event details', function () {
      state.step = 1;
      state.error = '';
      state.focusTarget = 'step';
      render();
    }));

    scroll.appendChild(buildBookingRecap());
    scroll.appendChild(buildBalanceExplainer());

    if (state.stripeReady) {
      var checkout = document.createElement('div');
      checkout.className = 'pa-review-checkout';
      var terms = buildTermsAgreement();
      if (terms) {
        checkout.appendChild(terms);
      }
      scroll.appendChild(checkout);
    }

    wrap.appendChild(scroll);

    if (state.stripeReady) {
      var payErr = validatePaylinkReady();
      var submit = buildPaySubmitButton(payErr, false, PAY_CTA_LABEL);
      submit.classList.add('is-ready');
      appendBookingAction(wrap, submit, true);
      wireConfirmPayButton(wrap);
    } else {
      var submitReq = document.createElement('button');
      submitReq.type = 'button';
      submitReq.className = 'pa-submit pa-btn is-ready';
      submitReq.disabled = state.submitting;
      submitReq.textContent = state.submitting ? REQUEST_CTA_LOADING : REQUEST_CTA_LABEL;
      submitReq.addEventListener('click', function () {
        var validation = validateContactForm();
        if (validation) {
          state.step = 1;
          setFieldError(validation.field, validation.message);
          render();
          return;
        }
        clearFieldErrors();
        state.error = '';
        submitBooking();
      });
      appendBookingAction(wrap, submitReq, true);
    }

    return wrap;
  }

  function buildContactRecap() {
    readDetailsFromForm();
    var section = document.createElement('section');
    section.className = 'pa-contact-recap pa-glass-section';
    section.setAttribute('aria-label', 'Your event information');

    var head = document.createElement('div');
    head.className = 'pa-contact-recap-head';
    var kicker = document.createElement('span');
    kicker.className = 'pa-contact-recap-kicker';
    kicker.textContent = 'Event information';
    head.appendChild(kicker);
    var edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'pa-recap-edit';
    edit.textContent = 'Edit';
    edit.addEventListener('click', function () {
      state.step = 1;
      state.error = '';
      state.focusTarget = 'step';
      render();
    });
    head.appendChild(edit);
    section.appendChild(head);

    var dl = document.createElement('dl');
    dl.className = 'pa-contact-recap-lines';
    function line(label, value) {
      if (!value) return;
      var dt = document.createElement('dt');
      dt.textContent = label;
      var dd = document.createElement('dd');
      dd.textContent = value;
      dl.appendChild(dt);
      dl.appendChild(dd);
    }
    line('Name', state.name);
    line('Email', state.email);
    line('Phone', state.phone);
    line('Location', state.venue);
    line('Event details', state.notes);
    if (state.timelineNotes) {
      line('Additional notes', state.timelineNotes);
    }
    section.appendChild(dl);
    return section;
  }

  function buildBalanceExplainer() {
    if (!state.stripeReady) {
      return document.createDocumentFragment();
    }
    var box = document.createElement('section');
    box.className = 'pa-deposit-section pa-deposit-section--compact';
    box.setAttribute('role', 'note');
    box.setAttribute('aria-label', 'Deposit');

    var explain = document.createElement('p');
    explain.className = 'pa-deposit-section-lead';
    explain.textContent = 'Your deposit reserves your requested date and will be applied toward your final balance.';
    box.appendChild(explain);

    var depositRow = document.createElement('div');
    depositRow.className = 'pa-deposit-section-amount-row';
    var amountLabel = document.createElement('span');
    amountLabel.className = 'pa-deposit-section-amount-label';
    amountLabel.textContent = 'Deposit Today';
    var amountValue = document.createElement('strong');
    amountValue.className = 'pa-deposit-section-amount';
    amountValue.textContent = formatMoney(getDepositTotal());
    depositRow.appendChild(amountLabel);
    depositRow.appendChild(amountValue);
    box.appendChild(depositRow);

    return box;
  }

  function wireConfirmPayButton(wrap) {
    var btn = wrap.querySelector('.pa-checkout-btn');
    if (!btn) return;
    var fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);
    fresh.addEventListener('click', function () {
      if (state.submitting) return;
      var validation = validateDetailsForm();
      if (validation) {
        if (validation.field === 'pa-terms-agree' || validation.field.indexOf('pa-') === 0) {
          if (validation.field !== 'pa-terms-agree') {
            state.step = 1;
          }
          clearFieldErrors();
          setFieldError(validation.field, validation.message);
        } else {
          state.error = validation.message;
          state.focusTarget = 'error';
          showToast(validation.message, 'error');
        }
        render();
        return;
      }
      var payErr = validatePaylinkReady();
      if (payErr) {
        state.error = payErr;
        state.focusTarget = 'error';
        showToast(payErr, 'error');
        render();
        return;
      }
      clearFieldErrors();
      state.error = '';
      saveDraft();
      submitBooking();
    });
  }

  function appendCheckoutLine(dl, label, value) {
    if (!value) {
      return;
    }
    var dt = document.createElement('dt');
    dt.textContent = label;
    var dd = document.createElement('dd');
    dd.textContent = value;
    dl.appendChild(dt);
    dl.appendChild(dd);
  }

  function checkoutProcessorName() {
    if (state.paymentProvider === 'paylink') {
      return 'GoDaddy Payments';
    }
    if (state.paymentProvider === 'stripe') {
      return 'Stripe';
    }
    return 'our payment partner';
  }

  function buildCheckoutPanel(includeContact, compact, minimal) {
    if (minimal) {
      return buildInlineDepositBar();
    }
    if (compact) {
      return buildSecureDepositPanel();
    }
    return buildFullCheckoutPanel(includeContact);
  }

  function buildInlineDepositBar() {
    var panel = document.createElement('div');
    panel.className = 'pa-deposit-inline';
    panel.setAttribute('aria-label', 'Deposit payment');

    var payErr = validatePaylinkReady();
    var row = document.createElement('div');
    row.className = 'pa-deposit-inline-row';

    var copy = document.createElement('div');
    copy.className = 'pa-deposit-inline-copy';
    var label = document.createElement('span');
    label.className = 'pa-deposit-inline-label';
    label.textContent = 'Deposit today';
    var amount = document.createElement('strong');
    amount.className = 'pa-deposit-inline-amount';
    amount.textContent = formatMoney(getDepositTotal());
    copy.appendChild(label);
    copy.appendChild(amount);
    row.appendChild(copy);

    var submit = buildPaySubmitButton(payErr, false);
    submit.classList.add('pa-deposit-inline-btn');
    row.appendChild(submit);
    panel.appendChild(row);

    if (payErr) {
      var warn = document.createElement('p');
      warn.className = 'pa-pay-warn';
      warn.setAttribute('role', 'alert');
      warn.textContent = payErr;
      panel.appendChild(warn);
    }

    var fine = document.createElement('p');
    fine.className = 'pa-deposit-inline-fine';
    fine.textContent = 'Secure checkout via ' + checkoutProcessorName() + '.';
    panel.appendChild(fine);

    return panel;
  }

  function vaultLockSvg() {
    return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M7 11V8a5 5 0 0110 0v3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<rect x="5" y="11" width="14" height="10" rx="2.5" stroke="currentColor" stroke-width="1.75"/>' +
      '<circle cx="12" cy="15.5" r="1.25" fill="currentColor"/>' +
      '<path d="M12 16.75v2" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '</svg>';
  }

  function vaultShieldSvg() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M12 2L4 6v6c0 5.25 3.4 10.15 8 11.35 4.6-1.2 8-6.1 8-11.35V6l-8-4z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>' +
      '</svg>';
  }

  function buildSecureDepositPanel() {
    var panel = document.createElement('div');
    panel.className = 'pa-checkout pa-checkout-vault is-compact';
    panel.setAttribute('aria-label', 'Secure deposit payment');

    var processor = checkoutProcessorName();
    var amount = formatMoney(getDepositTotal());
    var depositNote = getDayCount() === 1
      ? 'Holds your date on our calendar. Applied toward your final balance.'
      : formatMoney(state.depositPerDay) + '/day \u00d7 ' + getDayCount() + ' days \u00b7 applied to final balance';

    var header = document.createElement('header');
    header.className = 'pa-vault-header';
    header.innerHTML =
      '<div class="pa-vault-header-top">' +
        '<div class="pa-vault-lock">' + vaultLockSvg() + '</div>' +
        '<div class="pa-vault-header-copy">' +
          '<p class="pa-vault-eyebrow">Protected checkout</p>' +
          '<h3 class="pa-vault-title">Secure deposit payment</h3>' +
        '</div>' +
      '</div>' +
      '<div class="pa-vault-badges">' +
        '<span class="pa-vault-badge">' + vaultShieldSvg() + '256-bit SSL encryption</span>' +
        '<span class="pa-vault-badge pa-vault-badge--processor">Processed by ' + escapeHtml(processor) + '</span>' +
      '</div>';
    panel.appendChild(header);

    var body = document.createElement('div');
    body.className = 'pa-vault-body';

    var amountBlock = document.createElement('div');
    amountBlock.className = 'pa-vault-amount-block';
    amountBlock.innerHTML =
      '<span class="pa-vault-amount-label">Deposit due today</span>' +
      '<span class="pa-vault-amount">' + escapeHtml(amount) + '</span>' +
      '<p class="pa-vault-amount-note">' + escapeHtml(depositNote) + '</p>';
    body.appendChild(amountBlock);

    var divider = document.createElement('div');
    divider.className = 'pa-vault-divider';
    divider.setAttribute('aria-hidden', 'true');
    body.appendChild(divider);

    var payzone = document.createElement('div');
    payzone.className = 'pa-vault-payzone';

    var cards = document.createElement('div');
    cards.className = 'pa-vault-cards';
    cards.setAttribute('aria-label', 'Accepted payment methods');
  var cardBrands = state.paymentProvider === 'paylink'
      ? ['Visa', 'Mastercard', 'Amex', 'Debit']
      : ['Apple Pay', 'Google Pay', 'Visa', 'Mastercard'];
    cardBrands.forEach(function (brand) {
      var span = document.createElement('span');
      span.className = 'pa-vault-card';
      span.textContent = brand;
      cards.appendChild(span);
    });
    payzone.appendChild(cards);

    var redirect = document.createElement('p');
    redirect.className = 'pa-vault-redirect';
    redirect.textContent = state.paymentProvider === 'paylink'
      ? 'GoDaddy opens in a new tab. Complete payment there — we verify deposits in GoDaddy Payments and confirm by email within one business day.'
      : 'You\u2019ll complete payment on Stripe\u2019s secure checkout page, then return here for confirmation.';
    payzone.appendChild(redirect);

    var payErr = validatePaylinkReady();
    if (payErr) {
      var warn = document.createElement('p');
      warn.className = 'pa-pay-warn';
      warn.setAttribute('role', 'alert');
      warn.textContent = payErr;
      payzone.appendChild(warn);
    }

    var submit = buildPaySubmitButton(payErr, true);
    appendBookingAction(payzone, submit);

    var trust = document.createElement('div');
    trust.className = 'pa-vault-trust';
    trust.setAttribute('role', 'list');
    [
      ['Encrypted checkout', 'Bank-grade TLS protects your connection'],
      ['We never store cards', 'Payment details stay with ' + processor],
      ['Fast confirmation', 'We confirm within one business day'],
    ].forEach(function (pair) {
      var item = document.createElement('div');
      item.className = 'pa-vault-trust-item';
      item.setAttribute('role', 'listitem');
      item.innerHTML =
        '<span class="pa-vault-trust-icon" aria-hidden="true">\u2713</span>' +
        '<span class="pa-vault-trust-copy">' +
          '<strong>' + escapeHtml(pair[0]) + '</strong>' +
          '<span>' + escapeHtml(pair[1]) + '</span>' +
        '</span>';
      trust.appendChild(item);
    });
    payzone.appendChild(trust);
    body.appendChild(payzone);
    panel.appendChild(body);

    var footer = document.createElement('footer');
    footer.className = 'pa-vault-footer';
    footer.textContent = 'By continuing, you authorize a one-time deposit charge via ' + processor + '.';
    panel.appendChild(footer);

    return panel;
  }

  function buildFullCheckoutPanel(includeContact) {
    var panel = document.createElement('div');
    panel.className = 'pa-checkout';

    var secure = document.createElement('div');
    secure.className = 'pa-checkout-secure';
    secure.setAttribute('role', 'status');
    secure.innerHTML =
      '<div class="pa-checkout-secure-icon" aria-hidden="true">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M12 2L4 6v6c0 5.25 3.4 10.15 8 11.35 4.6-1.2 8-6.1 8-11.35V6l-8-4z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>' +
      '<path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg></div>' +
      '<div class="pa-checkout-secure-copy">' +
      '<strong class="pa-checkout-secure-title">Secure deposit</strong>' +
      '<span class="pa-checkout-secure-sub">256-bit SSL \u00b7 ' + escapeHtml(checkoutProcessorName()) + '</span>' +
      '</div>';
    panel.appendChild(secure);

    var body = document.createElement('div');
    body.className = 'pa-checkout-body';

    var order = document.createElement('div');
    order.className = 'pa-checkout-order pa-checkout-invoice';
    var orderTitle = document.createElement('h3');
    orderTitle.className = 'pa-checkout-order-title';
    orderTitle.textContent = 'Invoice summary';
    order.appendChild(orderTitle);

    var dl = document.createElement('dl');
    dl.className = 'pa-checkout-lines pa-checkout-invoice-lines';
    appendCheckoutLine(dl, 'Package', state.service);
    appendCheckoutLine(dl, 'Date', formatDatesSummary());
    appendCheckoutLine(dl, 'Time', shortTimeWindow(state.timeWindow) || state.timeWindow);
    if (includeContact && state.name) {
      appendCheckoutLine(dl, 'Contact', state.name);
      appendCheckoutLine(dl, 'Email', state.email);
      appendCheckoutLine(dl, 'Venue', state.venue);
    }
    order.appendChild(dl);

    var total = document.createElement('div');
    total.className = 'pa-checkout-total';
    var totalLabel = document.createElement('span');
    totalLabel.className = 'pa-checkout-total-label';
    totalLabel.textContent = 'Deposit due today';
    var totalAmount = document.createElement('span');
    totalAmount.className = 'pa-checkout-total-amount';
    totalAmount.textContent = formatMoney(getDepositTotal());
    total.appendChild(totalLabel);
    total.appendChild(totalAmount);
    order.appendChild(total);

    var fine = document.createElement('p');
    fine.className = 'pa-checkout-fine';
    fine.textContent = getDayCount() === 1
      ? 'Holds your date on our calendar. Applied toward your final event balance.'
      : formatMoney(state.depositPerDay) + ' per day \u00d7 ' + getDayCount() + ' days. Applied toward your final event balance.';
    order.appendChild(fine);
    body.appendChild(order);

    var action = document.createElement('div');
    action.className = 'pa-checkout-action';

    var amountHero = document.createElement('div');
    amountHero.className = 'pa-checkout-amount-hero';
    amountHero.innerHTML =
      '<span class="pa-checkout-amount-label">Due today</span>' +
      '<span class="pa-checkout-amount-value">' + escapeHtml(formatMoney(getDepositTotal())) + '</span>';
    action.appendChild(amountHero);

    var methods = document.createElement('p');
    methods.className = 'pa-checkout-methods';
    methods.textContent = state.paymentProvider === 'paylink'
      ? 'Visa \u00b7 Mastercard \u00b7 Amex \u00b7 Debit'
      : 'Apple Pay \u00b7 Google Pay \u00b7 Visa \u00b7 Mastercard';
    action.appendChild(methods);

    var redirect = document.createElement('p');
    redirect.className = 'pa-checkout-redirect';
    redirect.textContent = checkoutHint();
    action.appendChild(redirect);

    var payErr = validatePaylinkReady();
    if (payErr) {
      var warn = document.createElement('p');
      warn.className = 'pa-pay-warn';
      warn.setAttribute('role', 'alert');
      warn.textContent = payErr;
      action.appendChild(warn);
    }

    var submit = buildPaySubmitButton(payErr, false);
    appendBookingAction(action, submit);

    var trust = document.createElement('ul');
    trust.className = 'pa-checkout-trust';
    trust.innerHTML =
      '<li>Encrypted checkout</li>' +
      '<li>Card details never stored on our site</li>' +
      '<li>Confirmed within 1 business day</li>';
    action.appendChild(trust);

    var legal = document.createElement('p');
    legal.className = 'pa-checkout-legal';
    legal.textContent = 'By paying, you authorize a deposit via ' + checkoutProcessorName() + '.';
    action.appendChild(legal);

    body.appendChild(action);
    panel.appendChild(body);
    return panel;
  }

  function buildPaySubmitButton(payErr, vault, labelOverride) {
    var submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'pa-submit pa-pay-btn pa-btn pa-checkout-btn' + (vault ? ' pa-vault-pay-btn' : '');
    submit.disabled = state.submitting || !!payErr;
    if (state.submitting) {
      submit.textContent = PAY_CTA_LOADING;
    } else if (labelOverride) {
      submit.textContent = labelOverride;
    } else {
      submit.textContent = PAY_CTA_LABEL;
    }
    submit.addEventListener('click', function () {
      if (state.paymentProvider === 'paylink') {
        var err = validatePaylinkReady();
        if (err) {
          state.error = err;
          state.focusTarget = 'error';
          render();
          return;
        }
      }
      submitBooking();
    });
    return submit;
  }

  function buildPaySummary() {
    var dl = document.createElement('dl');
    dl.className = 'pa-pay-summary';
    var dateVal = getDayCount() > 1
      ? state.selectedDates.map(formatDisplayDate).join(', ')
      : formatDatesSummary();
    var rows = [
      ['Service', state.service],
      ['Date', dateVal],
      ['Time', state.timeWindow],
      ['Event', state.eventType],
      ['Name', state.name],
      ['Email', state.email],
      ['Phone', state.phone],
      ['Venue', state.venue],
    ];
    if (state.organization) {
      rows.push(['Organization', state.organization]);
    }
    rows.forEach(function (row) {
      var dt = document.createElement('dt');
      dt.textContent = row[0];
      var dd = document.createElement('dd');
      dd.textContent = row[1] || '—';
      dl.appendChild(dt);
      dl.appendChild(dd);
    });
    return dl;
  }

  function checkoutHint() {
    if (state.paymentProvider === 'paylink') {
      return 'You\u2019ll pay on GoDaddy\u2019s secure checkout page. After payment, you\u2019ll land on your confirmation screen — nothing else to do.';
    }
    return 'You\u2019ll complete payment on a secure Stripe checkout page, then return to your confirmation.';
  }

  function buildPrivacyNote() {
    var note = document.createElement('p');
    note.className = 'pa-privacy-note';
    if (state.paymentProvider === 'paylink') {
      note.textContent = 'We use your contact info only to confirm your booking. Payment is processed securely by GoDaddy Payments \u2014 we never store card numbers.';
    } else {
      note.textContent = 'We use your contact info only to confirm your booking. Payment is processed by Stripe \u2014 we never store card numbers.';
    }
    return note;
  }

  function buildTrustStrip() {
    var strip = document.createElement('div');
    strip.className = 'pa-trust-strip';
    strip.setAttribute('role', 'note');
    var lead = document.createElement('p');
    lead.className = 'pa-trust-lead';
    lead.textContent = state.paymentProvider === 'paylink'
      ? 'Secure checkout with GoDaddy Payments'
      : 'Secure checkout with Stripe';
    strip.appendChild(lead);
    var sub = document.createElement('p');
    sub.className = 'pa-trust-sub';
    sub.textContent = state.paymentProvider === 'paylink'
      ? 'Pay with card on our secure payment page to hold your date.'
      : 'Pay with Apple Pay, Google Pay, or card. You\u2019ll return here after payment.';
    strip.appendChild(sub);
    if (state.paymentProvider === 'stripe' && state.stripeMode === 'test' && PABooking.showStripeTestBanner) {
      var warn = document.createElement('p');
      warn.className = 'pa-trust-warn';
      warn.textContent = 'Test mode — no real charge. Contact us if you expected live checkout.';
      strip.appendChild(warn);
    }
    return strip;
  }

  function buildPayCard(hideMobilePayBtn) {
    var card = document.createElement('div');
    card.className = 'pa-pay-card';

    var label = document.createElement('p');
    label.className = 'pa-pay-label';
    label.textContent = 'Deposit';
    card.appendChild(label);

    var amount = document.createElement('div');
    amount.className = 'pa-pay-amount';
    amount.textContent = formatMoney(getDepositTotal());
    card.appendChild(amount);

    var breakdown = document.createElement('div');
    breakdown.className = 'pa-pay-breakdown';
    breakdown.textContent = getDayCount() === 1
      ? '1 day · applied to your total'
      : getDayCount() + ' days · ' + formatMoney(state.depositPerDay) + '/day';
    card.appendChild(breakdown);

    var methods = document.createElement('div');
    methods.className = 'pa-pay-methods';
    methods.textContent = state.paymentProvider === 'paylink' ? 'Card' : 'Apple Pay · Google Pay · Card';
    card.appendChild(methods);

    var payErr = validatePaylinkReady();
    if (payErr) {
      var warn = document.createElement('p');
      warn.className = 'pa-pay-warn';
      warn.setAttribute('role', 'status');
      warn.textContent = payErr;
      card.appendChild(warn);
    }

    var submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'pa-submit pa-pay-btn pa-btn';
    submit.disabled = state.submitting || !!payErr;
    submit.textContent = state.submitting ? PAY_CTA_LOADING : PAY_CTA_LABEL;
    submit.addEventListener('click', function () {
      if (state.paymentProvider === 'paylink') {
        var err = validatePaylinkReady();
        if (err) {
          state.error = err;
          state.focusTarget = 'error';
          render();
          return;
        }
      }
      submitBooking();
    });
    appendBookingAction(card, submit);

    var note = document.createElement('p');
    note.className = 'pa-pay-note';
    note.textContent = 'Confirmation within one business day.';
    card.appendChild(note);

    return card;
  }

  function buildDepositInfoStrip(mode) {
    var strip = document.createElement('div');
    strip.className = 'pa-deposit-strip';
    if (mode === 'per_day') {
      strip.innerHTML =
        '<span class="pa-deposit-strip-label">Deposit to hold your date</span>' +
        '<span class="pa-deposit-strip-amount">' + formatMoney(state.depositPerDay) + '/day</span>' +
        '<span class="pa-deposit-strip-note">Pay securely at checkout via GoDaddy Payments</span>';
    } else {
      strip.innerHTML =
        '<span class="pa-deposit-strip-label">Your deposit</span>' +
        '<span class="pa-deposit-strip-amount">' + formatMoney(getDepositTotal()) + '</span>' +
        '<span class="pa-deposit-strip-note">' + (getDayCount() === 1 ? '1 day selected' : getDayCount() + ' days selected') + ' · applied to event total</span>';
    }
    return strip;
  }

  function buildDepositBar() {
    if (!state.stripeReady || state.depositPerDay <= 0) return null;
    if (state.step !== 2 || state.submitting) return null;

    var bar = document.createElement('div');
    bar.className = 'pa-deposit-bar pa-deposit-bar-sticky';
    bar.setAttribute('aria-live', 'polite');

    var amt = document.createElement('span');
    amt.className = 'pa-deposit-bar-amount';
    amt.textContent = formatMoney(getDepositTotal());
    bar.appendChild(amt);

    var quick = document.createElement('button');
    quick.type = 'button';
    quick.className = 'pa-deposit-bar-pay';
    quick.textContent = 'Pay now';
    quick.addEventListener('click', submitBooking);
    bar.appendChild(quick);

    return bar;
  }

  function parseApiResponse(response) {
    return response.text().then(function (text) {
      var trimmed = (text || '').trim();
      if (trimmed.charAt(0) === '{' || trimmed.charAt(0) === '[') {
        try {
          return { ok: response.ok, status: response.status, body: JSON.parse(trimmed) };
        } catch (e) {
          throw new Error('Server sent an invalid response. Refresh the page and try again.');
        }
      }
      if (response.status >= 500) {
        throw new Error('Payment server is busy. Wait a moment, refresh, and try again.');
      }
      throw new Error('Could not reach the booking server. Refresh the page and try again.');
    });
  }

  // POST the booking with a hard timeout so the button can never hang forever on
  // "Opening secure checkout…". If the server stalls, we abort and show an error.
  function postBookingRequest() {
    var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (controller) controller.abort();
    }, 30000);
    var opts = {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': PABooking.nonce },
      body: JSON.stringify(buildBookingPayload()),
    };
    if (controller) opts.signal = controller.signal;
    return fetch(PABooking.restUrl + 'request', opts).then(
      function (r) { clearTimeout(timer); return r; },
      function (e) { clearTimeout(timer); throw e; }
    );
  }

  function completeCheckout(body) {
    if (body.checkout_url) {
      state.error = '';
      saveLastBooking();
      var checkoutUrl = body.checkout_url;
      var successUrl = body.success_url || '';
      var bookingId = body.booking_id || 0;

      try {
        if (bookingId) {
          sessionStorage.setItem('pa_pending_booking_id', String(bookingId));
        }
        if (successUrl) {
          sessionStorage.setItem('pa_checkout_success_url', successUrl);
        }
        if (checkoutUrl) {
          sessionStorage.setItem('pa_paylink_checkout_url', checkoutUrl);
        }
      } catch (storageErr) { /* ignore */ }

      state.submitting = false;

      if (state.paymentProvider === 'paylink') {
        var opened = false;
        try {
          var checkoutWin = window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
          opened = !!(checkoutWin && !checkoutWin.closed);
        } catch (openErr) { /* ignore */ }

        if (successUrl) {
          if (!opened) {
            try {
              sessionStorage.setItem('pa_paylink_popup_blocked', '1');
            } catch (blockedErr) { /* ignore */ }
          }
          window.location.assign(successUrl);
          return;
        }
        if (opened) {
          showToast('Checkout opened in a new tab. Complete your deposit there.', 'info');
          render();
          return;
        }
        window.location.assign(checkoutUrl);
        return;
      }

      window.location.assign(checkoutUrl);
      return;
    }

    if (body.success_url) {
      saveLastBooking();
      clearBookingSession();
      window.location.assign(body.success_url);
      return;
    }

    state.submitting = false;
    renderSuccess();
  }

  function submitBooking() {
    if (state.submitting) return;
    state.submitting = true;
    state.error = '';
    render();

    var safetyTimer = setTimeout(function () {
      if (!state.submitting) {
        return;
      }
      state.submitting = false;
      state.error = 'Checkout is taking longer than expected. Refresh and try again — you have not been charged unless payment already opened in another tab.';
      showToast(state.error, 'error');
      render();
    }, 32000);

    function attemptRequest(cookieRetried) {
      return postBookingRequest()
        .then(parseApiResponse)
        .then(function (res) {
          if (!res.ok) {
            var msg = (res.body && res.body.message) || 'Request failed.';
            if (!cookieRetried && (/cookie check failed/i.test(msg) || /session expired/i.test(msg) || /invalid_nonce/i.test(String(res.body && res.body.code)))) {
              return refreshSession(true).then(function () {
                return attemptRequest(true);
              });
            }
            throw new Error(msg);
          }
          clearTimeout(safetyTimer);
          paGa4Event('booking_submit', {
            service: state.service,
            days: getDayCount(),
            value: parseFloat((window.PAGA4 && window.PAGA4.depositUsd) || '150'),
            currency: 'USD'
          });
          completeCheckout(res.body);
        });
    }

    refreshSession(true)
      .then(function () {
        return attemptRequest(false);
      })
      .catch(function (err) {
      clearTimeout(safetyTimer);
      state.submitting = false;
      if (err && err.name === 'AbortError') {
        state.error = 'The checkout took too long to open. Check your connection and try again — you have not been charged.';
      } else {
        state.error = err.message || 'Something went wrong.';
      }
      showToast(state.error, 'error');
      render();
    });
  }

  function renderSuccess() {
    saveLastBooking();
    while (root.firstChild) root.removeChild(root.firstChild);
    root.classList.add('is-success-inline');
    var box = document.createElement('div');
    box.className = 'pa-done pa-done-v40';

    var icon = document.createElement('div');
    icon.className = 'pa-done-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '\u2713';
    box.appendChild(icon);

    var eyebrow = document.createElement('p');
    eyebrow.className = 'pa-done-eyebrow';
    eyebrow.textContent = state.stripeReady ? 'Date reserved' : 'Request received';
    box.appendChild(eyebrow);

    var title = document.createElement('h3');
    title.className = 'pa-done-title';
    title.textContent = state.stripeReady
      ? 'You\u2019re on the calendar'
      : 'We received your booking';
    box.appendChild(title);

    var lead = document.createElement('p');
    lead.className = 'pa-done-lead';
    var svcLabel = state.service ? getServiceDisplayLabel(state.service) + ' \u00b7 ' : '';
    lead.textContent = state.stripeReady
      ? svcLabel + formatDatesSummary() + '. Watch for a confirmation email within one business day.'
      : svcLabel + formatDatesSummary() + '. We\u2019ll follow up within one business day.';
    box.appendChild(lead);

    var timeline = document.createElement('ol');
    timeline.className = 'pa-done-timeline pa-done-timeline-v40';
    timeline.innerHTML = state.stripeReady
      ? '<li class="is-complete"><strong>Today</strong><span>Deposit received — your date is reserved</span></li>'
        + '<li class="is-active"><strong>Within one business day</strong><span>Personal confirmation with next steps</span></li>'
        + '<li><strong>Before your event</strong><span>Pre-production call and final balance</span></li>'
      : '<li class="is-complete"><strong>Today</strong><span>Booking request received</span></li>'
        + '<li class="is-active"><strong>Within one business day</strong><span>Personal confirmation email</span></li>'
        + '<li><strong>Before your event</strong><span>Pre-production call and final balance</span></li>';
    box.appendChild(timeline);

    var actions = document.createElement('div');
    actions.className = 'pa-done-actions';
    var icsBtn = document.createElement('button');
    icsBtn.type = 'button';
    icsBtn.className = 'pa-submit pa-btn is-ready pa-ics-btn';
    icsBtn.textContent = 'Add to calendar';
    icsBtn.addEventListener('click', downloadIcsFile);
    actions.appendChild(icsBtn);
    box.appendChild(actions);

    root.appendChild(box);
    showToast(state.stripeReady ? 'Date reserved' : 'Booking request sent', 'success');
  }

  function buildFormGroup(title, hint, fields) {
    var group = document.createElement('fieldset');
    group.className = 'pa-form-group';
    var legend = document.createElement('legend');
    legend.className = 'pa-form-group-title';
    legend.textContent = title;
    group.appendChild(legend);
    if (hint) {
      var hintEl = document.createElement('p');
      hintEl.className = 'pa-form-group-hint';
      hintEl.textContent = hint;
      group.appendChild(hintEl);
    }
    var body = document.createElement('div');
    body.className = 'pa-form-group-body';
    fields.forEach(function (field) {
      body.appendChild(field);
    });
    group.appendChild(body);
    return group;
  }

  function selectField(label, id, options, value, required) {
    var frag = document.createDocumentFragment();
    var lab = document.createElement('label');
    lab.setAttribute('for', 'pa-' + id);
    lab.textContent = label;
    var sel = document.createElement('select');
    sel.id = 'pa-' + id;
    sel.className = 'pa-input';
    if (required) sel.required = true;
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select…';
    sel.appendChild(placeholder);
    options.forEach(function (opt) {
      var o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      if (value === opt) o.selected = true;
      sel.appendChild(o);
    });
    frag.appendChild(lab);
    frag.appendChild(sel);
    return frag;
  }

  function inputField(label, id, type, value, required, autocomplete, placeholder, help) {
    var fieldId = 'pa-' + id;
    var wrap = document.createElement('div');
    wrap.className = 'pa-field';
    if (state.fieldErrors[fieldId]) {
      wrap.classList.add('has-error');
    }
    var lab = document.createElement('label');
    lab.className = 'pa-field-label';
    lab.setAttribute('for', fieldId);
    lab.textContent = label;
    if (required) {
      var star = document.createElement('span');
      star.className = 'pa-field-required';
      star.textContent = ' *';
      star.setAttribute('aria-hidden', 'true');
      lab.appendChild(star);
    }
    var input = document.createElement('input');
    input.id = fieldId;
    input.type = type;
    input.value = value || '';
    input.className = 'pa-input pa-text-input';
    if (required) {
      input.required = true;
      input.setAttribute('aria-required', 'true');
    }
    if (autocomplete) input.setAttribute('autocomplete', autocomplete);
    if (type === 'tel') input.setAttribute('inputmode', 'tel');
    if (placeholder) input.placeholder = placeholder;
    if (id === 'venue') {
      input.value = sanitizeVenueValue(input.value);
      input.placeholder = 'Venue name';
      input.setAttribute('autocomplete', 'organization');
    }
    if (state.fieldErrors[fieldId]) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', fieldId + '-error' + (help ? ' ' + fieldId + '-help' : ''));
    } else if (help) {
      input.setAttribute('aria-describedby', fieldId + '-help');
    }
    input.addEventListener('input', function () {
      scheduleDraftSave();
      if (state.fieldErrors[fieldId]) {
        delete state.fieldErrors[fieldId];
        wrap.classList.remove('has-error');
        input.removeAttribute('aria-invalid');
        input.classList.remove('pa-input-error');
        var errEl = document.getElementById(fieldId + '-error');
        if (errEl && errEl.parentNode) errEl.parentNode.removeChild(errEl);
      }
    });
    input.addEventListener('blur', function () {
      if (!input.value.trim() && !required) return;
      var msg = validateSingleField(fieldId);
      updateFieldErrorUI(wrap, fieldId, msg);
      wrap.classList.toggle('is-valid', !msg && input.value.trim().length > 0);
    });
    wrap.appendChild(lab);
    wrap.appendChild(input);
    if (help) {
      var helpEl = document.createElement('p');
      helpEl.id = fieldId + '-help';
      helpEl.className = 'pa-field-help';
      helpEl.textContent = help;
      wrap.appendChild(helpEl);
    }
    if (state.fieldErrors[fieldId]) {
      var errMsg = document.createElement('p');
      errMsg.id = fieldId + '-error';
      errMsg.className = 'pa-field-error-msg';
      errMsg.textContent = state.fieldErrors[fieldId];
      wrap.appendChild(errMsg);
    }
    return wrap;
  }

  function textareaField(label, id, value, placeholder, help) {
    var fieldId = 'pa-' + id;
    var wrap = document.createElement('div');
    wrap.className = 'pa-field';
    var lab = document.createElement('label');
    lab.className = 'pa-field-label';
    lab.setAttribute('for', fieldId);
    lab.textContent = label;
    var ta = document.createElement('textarea');
    ta.id = fieldId;
    ta.className = 'pa-input pa-text-input';
    ta.maxLength = 500;
    ta.value = value || '';
    if (placeholder) ta.placeholder = placeholder;
    ta.addEventListener('input', scheduleDraftSave);
    if (help) {
      ta.setAttribute('aria-describedby', fieldId + '-help');
      var helpEl = document.createElement('p');
      helpEl.id = fieldId + '-help';
      helpEl.className = 'pa-field-help';
      helpEl.textContent = help;
      wrap.appendChild(lab);
      wrap.appendChild(ta);
      wrap.appendChild(helpEl);
      return wrap;
    }
    wrap.appendChild(lab);
    wrap.appendChild(ta);
    return wrap;
  }

  function shiftMonth(delta) {
    state.calDirection = delta > 0 ? 1 : -1;
    state.month = shiftMonthKey(state.month, delta);
    fetchMonth(state.month).then(function () {
      prefetchMonth(shiftMonthKey(state.month, delta > 0 ? 1 : -1));
      render();
      state.calDirection = 0;
    });
  }

  function toggleSelectedDate(iso) {
    var idx = state.selectedDates.indexOf(iso);
    if (idx === -1) {
      if (state.selectedDates.length >= MAX_BOOKING_DAYS) {
        state.error = 'You can select up to ' + MAX_BOOKING_DAYS + ' days. Contact us for longer events.';
        state.focusTarget = 'error';
        showToast(state.error, 'error');
        return;
      }
      state.selectedDates.push(iso);
      state.selectedDates.sort();
      state.error = '';
    } else {
      state.selectedDates.splice(idx, 1);
    }
  }

  function getDayCount() {
    return Math.max(1, state.selectedDates.length);
  }

  function getDepositTotal() {
    return state.depositPerDay * getDayCount();
  }

  function formatDatesSummary() {
    if (!state.selectedDates.length) return '';
    if (state.selectedDates.length === 1) {
      return formatDisplayDate(state.selectedDates[0]);
    }
    return formatDisplayDate(state.selectedDates[0]) + ' – ' + formatDisplayDate(state.selectedDates[state.selectedDates.length - 1]) + ' (' + state.selectedDates.length + ' days)';
  }

  function formatMoney(n) {
    return '$' + Number(n).toFixed(2);
  }

  function formatDepositPreview() {
    var total = getDepositTotal();
    if (getDayCount() === 1) {
      return formatMoney(total) + ' deposit (1 day)';
    }
    return formatMoney(state.depositPerDay) + '/day × ' + getDayCount() + ' days = ' + formatMoney(total);
  }

  function formatDisplayDate(iso) {
    var p = iso.split('-');
    return MONTHS[parseInt(p[1], 10) - 1] + ' ' + parseInt(p[2], 10) + ', ' + p[0];
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
