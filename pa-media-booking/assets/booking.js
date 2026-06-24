(function () {
  'use strict';

  var root = document.getElementById('pa-booking-app');
  if (!root || typeof PABooking === 'undefined') return;

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
  };

  var MAX_BOOKING_DAYS = 14;
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var STEPS = ['Schedule', 'Details', 'Pay'];
  var STEPS_REQUEST = ['Schedule', 'Request'];
  var STEP_HINTS = [
    '',
    'Enter your contact info and pay the deposit to hold your date.',
  ];
  var STEP_HINTS_REQUEST = [
    '',
    'Enter your contact info so we can confirm your request.',
  ];

  var RECOMMENDED_SERVICE = 'Photo + Video Bundle';

  function activeSteps() {
    return state.stripeReady ? ['Schedule', 'Details & deposit'] : ['Schedule', 'Your details'];
  }

  function activeStepHints() {
    if (state.stripeReady) {
      return STEP_HINTS;
    }
    return STEP_HINTS_REQUEST;
  }

  function readDetailsFromForm() {
    state.name = (document.getElementById('pa-name') || {}).value || '';
    state.email = (document.getElementById('pa-email') || {}).value || '';
    state.phone = (document.getElementById('pa-phone') || {}).value || '';
    state.eventType = state.eventType || (document.querySelector('.pa-event-pill.is-selected') || {}).getAttribute('data-value') || '';
    state.venue = (document.getElementById('pa-venue') || {}).value || '';
    state.organization = (document.getElementById('pa-organization') || {}).value || '';
    state.notes = (document.getElementById('pa-notes') || {}).value || '';
    state.guestCount = (document.getElementById('pa-guest-count') || {}).value || '';
    state.timelineNotes = (document.getElementById('pa-timeline-notes') || {}).value || '';
    state.venueAccess = (document.getElementById('pa-venue-access') || {}).value || '';
    state.deliverablesNotes = (document.getElementById('pa-deliverables-notes') || {}).value || '';
    var termsEl = document.getElementById('pa-terms-agree');
    if (termsEl) {
      state.termsAccepted = termsEl.checked;
    }
  }

  function validateDetailsForm() {
    readDetailsFromForm();
    if (state.name.trim().length < 2) {
      return { field: 'pa-name', message: 'Enter your full name.' };
    }
    if (!isValidEmail(state.email)) {
      return { field: 'pa-email', message: 'Enter a valid email address.' };
    }
    if (state.phone.replace(/\D/g, '').length < 7) {
      return { field: 'pa-phone', message: 'Enter a phone number we can reach you at.' };
    }
    if (!state.eventType) {
      return { field: 'error', message: 'Select an event type.' };
    }
    if (state.eventType === 'Corporate' && state.organization.trim().length < 2) {
      return { field: 'pa-organization', message: 'Enter your organization name.' };
    }
    if (state.venue.trim().length < 2) {
      return { field: 'pa-venue', message: 'Enter the venue or city.' };
    }
    if (state.stripeReady && !state.termsAccepted) {
      return { field: 'pa-terms-agree', message: 'Please agree to the booking policies to continue.' };
    }
    return null;
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
    toast.className = 'pa-toast' + (type === 'success' ? ' is-success' : '') + (type === 'error' ? ' is-error' : '');
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

  function setFieldError(fieldId, message) {
    state.fieldErrors[fieldId] = message;
    state.focusTarget = fieldId;
    showToast(message, 'error');
  }

  function saveLastBooking() {
    try {
      sessionStorage.setItem('pa_last_booking', JSON.stringify({
        dates: state.selectedDates.slice(),
        service: state.service,
        time: state.timeWindow,
        venue: state.venue,
        name: state.name,
      }));
    } catch (e) { /* ignore */ }
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
    sk.className = 'pa-booking-skeleton';
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

  function buildLiveRecapBar() {
    var bar = document.createElement('aside');
    var ready = !!(state.service && state.selectedDates.length && state.timeWindow);
    bar.className = 'pa-recap-bar pa-recap-bar--sticky' + (ready ? ' is-complete' : ' is-placeholder');
    bar.setAttribute('aria-label', 'Your selections so far');

    var kicker = document.createElement('span');
    kicker.className = 'pa-recap-bar-kicker';
    kicker.textContent = ready ? 'Your booking' : 'Selections';
    bar.appendChild(kicker);

    var dateEl = document.createElement('p');
    dateEl.className = 'pa-recap-bar-date';
    if (!state.service) {
      dateEl.textContent = 'Choose a service to get started';
    } else if (!state.selectedDates.length) {
      dateEl.textContent = state.service + ' — pick a date';
    } else if (!state.timeWindow) {
      dateEl.textContent = formatDatesSummary();
    } else {
      dateEl.textContent = formatDatesSummary();
    }
    bar.appendChild(dateEl);

    var meta = document.createElement('p');
    meta.className = 'pa-recap-bar-meta';
    if (ready) {
      meta.textContent = state.service + ' · ' + shortTimeWindow(state.timeWindow);
    } else if (state.service && state.selectedDates.length) {
      meta.textContent = state.service + ' — choose a time window';
    } else {
      meta.textContent = 'Service, date, and time appear here as you go';
    }
    bar.appendChild(meta);

    if (state.stripeReady && state.selectedDates.length) {
      var dep = document.createElement('span');
      dep.className = 'pa-recap-bar-deposit';
      dep.textContent = formatMoney(getDepositTotal()) + ' deposit holds your date';
      bar.appendChild(dep);
    }
    if (ready) {
      var nextHint = document.createElement('p');
      nextHint.className = 'pa-recap-bar-next';
      nextHint.textContent = 'Ready — tap Continue for contact details';
      bar.appendChild(nextHint);
      var editRow = document.createElement('div');
      editRow.className = 'pa-recap-bar-actions';
      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'pa-recap-bar-edit';
      editBtn.textContent = 'Edit selections';
      editBtn.addEventListener('click', function () {
        scrollToScheduleTarget('pa-section-service');
      });
      editRow.appendChild(editBtn);
      bar.appendChild(editRow);
    }
    return bar;
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
    var returned = params.get('deposit') === 'done';
    var awaiting = false;
    try {
      awaiting = sessionStorage.getItem('pa_deposit_opened') === '1';
    } catch (e) { /* ignore */ }
    if (!returned && !awaiting) {
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
    if (d.venue) state.venue = d.venue;
    if (d.organization) state.organization = d.organization;
    if (d.notes) state.notes = d.notes;
    if (d.guestCount) state.guestCount = d.guestCount;
    if (d.termsAccepted) state.termsAccepted = !!d.termsAccepted;
    if (d.selectedAddons) state.selectedAddons = d.selectedAddons;
    if (d.timelineNotes) state.timelineNotes = d.timelineNotes;
    if (d.venueAccess) state.venueAccess = d.venueAccess;
    if (d.deliverablesNotes) state.deliverablesNotes = d.deliverablesNotes;
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
      state.step = 1;
    }
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
  window.addEventListener('pageshow', function () {
    if (checkPaymentReturn()) {
      return;
    }
  });

  function initStickyBar() {
    var sticky = document.querySelector('.pa-booking-sticky');
    var bookRoot = document.querySelector('.pa-booking-root');
    var app = document.getElementById('pa-booking-app');
    if (!sticky || !app) return;

    function syncSticky() {
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
    if (bookRoot) {
      bookRoot.classList.toggle('is-funnel-active', state.step > 0 || !state.loading);
    }
    if (sticky && state.step > 0) {
      sticky.hidden = true;
    }
  }

  if (window.location.hash === '#pa-booking-app' || window.location.hash === '#pa-book') {
    setTimeout(scrollToPanel, 300);
  }

  document.querySelectorAll('a[href="#pa-booking-app"]').forEach(function (link) {
    link.addEventListener('click', function () {
      setTimeout(scrollToPanel, 80);
    });
  });

  function init() {
    var params = new URLSearchParams(window.location.search);
    restoreDraft();
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
      render();
    }).catch(function () {
      state.error = 'Could not load calendar. Refresh the page.';
      state.loading = false;
      render();
    });
  }

  function refreshSession() {
    return fetch(PABooking.restUrl + 'session', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
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
      })
      .catch(function () { /* availability fetch still sets payment flags */ });
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

  function appendStepStage(stepEl) {
    var stage = document.createElement('div');
    stage.className = 'pa-step-stage';
    if (stepDirection === 'fwd') {
      stage.classList.add('pa-step-stage--fwd');
    } else if (stepDirection === 'back') {
      stage.classList.add('pa-step-stage--back');
    } else if (stepDirection === 'static') {
      stage.classList.add('pa-step-stage--static');
    }
    stage.setAttribute('data-step', String(state.step));
    stage.appendChild(stepEl);
    root.appendChild(stage);
    root.classList.add('pa-app-ready');
    runStepAnimations();
    return stage;
  }

  function render() {
    while (root.firstChild) root.removeChild(root.firstChild);
    root.setAttribute('aria-busy', state.loading ? 'true' : 'false');

    if (state.loading) {
      root.appendChild(buildSkeletonLoader());
      return;
    }

    updateFunnelChrome();

    var chrome = document.createElement('div');
    chrome.className = 'pa-booking-chrome';
    if (state.step === 0) {
      chrome.appendChild(buildFastBanner());
    }
    chrome.appendChild(buildProgress());
    if (state.step === 1) {
      var hint = activeStepHints()[state.step];
      if (hint) {
        chrome.appendChild(buildStepIntro(hint));
      }
    }
    root.appendChild(chrome);

    if (state.error) {
      var err = appendEl('p', 'pa-error', state.error);
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

    var focusId = 'pa-step-focus-' + state.step;
    var scrollTarget = state.focusTarget;
    if (state.step === 0) appendStepStage(buildScheduleStep());
    if (state.step === 1) appendStepStage(buildDetailsStep());

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
      var secEl = document.getElementById(scrollTarget);
      if (secEl && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        requestAnimationFrame(function () {
          secEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }
    }
    state.focusTarget = '';

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced && window.matchMedia('(max-width: 900px)').matches && state.step > 0) {
      scrollToPanel();
    }
  }

  function scrollToPanel() {
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
    wrap.className = 'pa-booking-actions' + (stickyOnMobile ? ' pa-booking-actions--sticky' : '');
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
      ? ['Pay deposit & submit', 'Personal confirmation within 1 business day', 'Pre-production call before your event']
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
      '<span class="pa-fast-banner-lead">Takes about 2 minutes</span>' +
      '<span class="pa-fast-banner-pill">' + (state.stripeReady ? 'Date \u2192 Details \u2192 Deposit' : 'Date \u2192 Details') + '</span>' +
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
    wrap.className = 'pa-stepper' + (steps.length === 2 ? ' pa-stepper-two' : '');
    wrap.setAttribute('aria-label', 'Step ' + (state.step + 1) + ' of ' + steps.length + ': ' + steps[state.step]);

    steps.forEach(function (label, i) {
      var item;
      if (i < state.step) {
        item = document.createElement('button');
        item.type = 'button';
        item.addEventListener('click', function () {
          state.step = i;
          state.error = '';
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
    meter.appendChild(fill);
    wrap.appendChild(meter);

    return wrap;
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

  function appendScheduleFlowClasses(el, index) {
    var flowIndex = getScheduleFlowIndex();
    el.classList.remove('is-flow-done', 'is-flow-current', 'is-flow-upcoming');
    if (index < flowIndex || (flowIndex === 3 && index < 3)) {
      el.classList.add('is-flow-done');
    } else if (index === flowIndex) {
      el.classList.add('is-flow-current');
    } else {
      el.classList.add('is-flow-upcoming');
    }
  }

  function scrollToScheduleTarget(targetId) {
    var target = document.getElementById(targetId);
    if (!target) {
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      target.scrollIntoView({ block: 'nearest' });
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function buildServicePicker() {
    var section = document.createElement('section');
    section.className = 'pa-booking-section-inner';
    section.setAttribute('aria-labelledby', 'pa-service-heading');

    var head = document.createElement('h3');
    head.id = 'pa-service-heading';
    head.className = 'pa-section-title';
    head.textContent = 'Package';
    section.appendChild(head);

    var pricingNote = document.createElement('p');
    pricingNote.className = 'pa-section-hint pa-package-pricing-note';
    pricingNote.textContent = 'Package pricing is customized to your event — you\u2019ll receive a written quote within one business day.';
    section.appendChild(pricingNote);

    if (state.service && !state.serviceExpanded) {
      var row = document.createElement('div');
      row.className = 'pa-service-selected';
      var name = document.createElement('strong');
      name.className = 'pa-selected-value';
      name.textContent = state.service;
      row.appendChild(name);
      var change = document.createElement('button');
      change.type = 'button';
      change.className = 'pa-text-btn';
      change.textContent = 'Change';
      change.addEventListener('click', function () {
        state.serviceExpanded = true;
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
    state.services.forEach(function (svc, i) {
      var pkg = getServicePackage(svc);
      var btn = document.createElement('button');
      btn.type = 'button';
      var isRecommended = svc === RECOMMENDED_SERVICE;
      btn.className = 'pa-service-option pa-service-package pa-service-package--simple pa-choice pa-stagger-item' +
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
      nameEl.textContent = svc;
      body.appendChild(nameEl);

      var blurb = document.createElement('span');
      blurb.className = 'pa-service-option-detail';
      blurb.textContent = pkg.tagline || serviceBlurb(svc);
      body.appendChild(blurb);

      btn.appendChild(body);

      btn.addEventListener('click', function () {
        if (state.service === svc) return;
        state.service = svc;
        state.serviceExpanded = false;
        state.selectedAddons = {};
        state.error = '';
        state.focusTarget = 'pa-section-date';
        prefetchMonth(shiftMonthKey(state.month, 1));
        render();
      });
      list.appendChild(btn);
    });
    section.appendChild(list);
    return section;
  }

  function buildScheduleStep() {
    var wrap = document.createElement('div');
    wrap.className = 'pa-step pa-step-schedule';
    wrap.id = 'pa-step-focus-0';

    var sheet = document.createElement('div');
    sheet.className = 'pa-booking-sheet';
    sheet.appendChild(buildScheduleTrust());
    sheet.appendChild(buildScheduleChecklist());

    var serviceSection = document.createElement('div');
    serviceSection.id = 'pa-section-service';
    serviceSection.className = 'pa-booking-section pa-glass-section pa-glass-section--service';
    appendScheduleFlowClasses(serviceSection, 0);
    serviceSection.appendChild(buildServicePicker());
    sheet.appendChild(serviceSection);

    var dateSection = document.createElement('div');
    dateSection.id = 'pa-section-date';
    dateSection.className = 'pa-booking-section pa-glass-section pa-glass-section--schedule' +
      (state.service ? ' is-unlocked' : ' is-disabled');
    appendScheduleFlowClasses(dateSection, 1);

    var dateHead = document.createElement('h3');
    dateHead.className = 'pa-section-title';
    dateHead.textContent = 'Date';
    dateSection.appendChild(dateHead);

    if (state.service) {
      var dateHint = document.createElement('p');
      dateHint.className = 'pa-panel-hint pa-date-hint';
      dateHint.textContent = 'Tap an open date on the calendar. Multi-day events? Select each day you need.';
      dateSection.appendChild(dateHint);
    }

    if (!state.service) {
      var locked = document.createElement('p');
      locked.className = 'pa-panel-hint';
      locked.textContent = 'Choose a service above first.';
      dateSection.appendChild(locked);
    } else {
      dateSection.appendChild(buildCalendar());
      dateSection.appendChild(buildCalLegend());
      dateSection.appendChild(buildCalendarFooter());
      if (state.stripeReady && state.selectedDates.length) {
        dateSection.appendChild(buildDepositPreviewStrip());
      }
      if (state.selectedDates.length) {
        dateSection.appendChild(buildSelectedDatesChips());
        var timeSection = document.createElement('div');
        timeSection.id = 'pa-section-time';
        timeSection.className = 'pa-time-section pa-glass-section pa-glass-section--time';
        appendScheduleFlowClasses(timeSection, 2);
        var timeHead = document.createElement('h3');
        timeHead.className = 'pa-section-title';
        timeHead.textContent = 'Time';
        timeSection.appendChild(timeHead);
        var timeHint = document.createElement('p');
        timeHint.className = 'pa-panel-hint pa-time-hint';
        timeHint.textContent = 'Select the window that best matches your event schedule.';
        timeSection.appendChild(timeHint);
        timeSection.appendChild(buildTimeWindows());
        dateSection.appendChild(timeSection);
      }
    }
    sheet.appendChild(dateSection);
    wrap.appendChild(sheet);
    wrap.appendChild(buildLiveRecapBar());

    var ready = canAdvanceFromSchedule();
    var next = document.createElement('button');
    next.type = 'button';
    next.className = 'pa-submit pa-btn pa-schedule-continue' + (ready ? ' is-ready' : ' is-disabled');
    next.textContent = ready ? 'Continue' : 'Complete the steps above';
    next.disabled = !ready;
    next.setAttribute('aria-disabled', ready ? 'false' : 'true');
    next.addEventListener('click', function () {
      if (!state.service) {
        state.error = 'Select a service.';
        state.focusTarget = 'error';
        render();
        return;
      }
      if (!state.selectedDates.length) {
        state.error = 'Select at least one date.';
        state.focusTarget = 'error';
        render();
        return;
      }
      if (!state.timeWindow) {
        state.error = 'Select a time.';
        state.focusTarget = 'error';
        render();
        return;
      }
      state.error = '';
      state.focusTarget = 'step';
      state.step = 1;
      render();
    });
    appendBookingAction(wrap, next, true, buildContinueFootnote(ready));

    return wrap;
  }

  function buildScheduleProgress() {
    var flowIndex = getScheduleFlowIndex();
    var steps = scheduleFlowSteps();
    var allDone = flowIndex === 3;

    var nav = document.createElement('nav');
    nav.className = 'pa-flow-progress';
    nav.setAttribute('aria-label', 'Schedule progress');

    var track = document.createElement('ol');
    track.className = 'pa-flow-progress-track';

    steps.forEach(function (step, i) {
      var isDone = step.done;
      var isActive = !allDone && i === flowIndex;
      var isUpcoming = !isDone && !isActive;

      var item = document.createElement('li');
      item.className = 'pa-flow-progress-item' +
        (isDone ? ' is-done' : '') +
        (isActive ? ' is-active' : '') +
        (isUpcoming ? ' is-upcoming' : '') +
        (allDone && i === 2 ? ' is-active is-complete' : '');
      if (isActive || (allDone && i === 2)) {
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

      var status = document.createElement('span');
      status.className = 'pa-flow-progress-status';
      if (isActive) {
        status.textContent = 'Now';
      } else if (isDone) {
        status.textContent = 'Done';
      } else {
        status.textContent = 'Next';
      }

      stepBtn.appendChild(icon);
      stepBtn.appendChild(label);
      stepBtn.appendChild(status);
      item.appendChild(stepBtn);
      track.appendChild(item);

      if (isDone || isActive || i <= flowIndex) {
        stepBtn.addEventListener('click', function (targetId) {
          return function () {
            scrollToScheduleTarget(targetId);
          };
        }(step.target));
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
    var note = document.createElement('span');
    note.className = 'pa-cal-meta-note';
    note.textContent = 'Live availability';
    strip.appendChild(note);
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
    foot.textContent = 'All times are Eastern (Pennsylvania). Need help? Email ' + ((window.PASite && PASite.notifyEmail) || 'jordan@pamedia.art') + '.';
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
    grid.className = 'pa-time-grid';
    grid.setAttribute('role', 'radiogroup');
    grid.setAttribute('aria-label', 'Time windows');
    TIME_WINDOWS.forEach(function (tw, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pa-time-card pa-choice pa-stagger-item' + (state.timeWindow === tw ? ' is-selected' : '');
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
        render();
      });
      grid.appendChild(btn);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function buildCalendar() {
    var wrap = document.createElement('div');
    wrap.className = 'pa-cal pa-cal-premium pa-cal-pro';
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

    var animIndex = 0;
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
        if (animIndex < 6) {
          btn.classList.add('pa-cal-day-animate');
          btn.style.animationDelay = (animIndex * 0.02) + 's';
          animIndex += 1;
        }
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

  function buildTermsAgreement() {
    if (!state.stripeReady) {
      return null;
    }
    var wrap = document.createElement('div');
    wrap.className = 'pa-terms-agreement' + (state.fieldErrors['pa-terms-agree'] ? ' has-error' : '');

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
      render();
    });

    var text = document.createElement('span');
    text.className = 'pa-terms-agreement-text';
    text.appendChild(document.createTextNode('I agree to the '));
    var policyLink = document.createElement('a');
    policyLink.href = '#pa-booking-policies';
    policyLink.className = 'pa-terms-link';
    policyLink.textContent = 'deposit, cancellation, and travel policies';
    text.appendChild(policyLink);
    text.appendChild(document.createTextNode(' and authorize the deposit payment. '));
    var privacy = (PABooking && PABooking.legal && PABooking.legal.privacyUrl) ? PABooking.legal.privacyUrl : '/privacy-policy/';
    var terms = (PABooking && PABooking.legal && PABooking.legal.termsUrl) ? PABooking.legal.termsUrl : '/terms-of-service/';
    var privacyLink = document.createElement('a');
    privacyLink.href = privacy;
    privacyLink.className = 'pa-terms-link';
    privacyLink.target = '_blank';
    privacyLink.rel = 'noopener noreferrer';
    privacyLink.textContent = 'Privacy';
    text.appendChild(privacyLink);
    text.appendChild(document.createTextNode(' · '));
    var termsLink = document.createElement('a');
    termsLink.href = terms;
    termsLink.className = 'pa-terms-link';
    termsLink.target = '_blank';
    termsLink.rel = 'noopener noreferrer';
    termsLink.textContent = 'Terms';
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
      notes: state.notes,
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

  function buildDetailsStep() {
    var wrap = document.createElement('div');
    wrap.className = 'pa-step' + (state.stripeReady ? ' pa-step-details-pay' : '');
    wrap.id = 'pa-step-focus-' + state.step;

    wrap.appendChild(buildBookingRecap());

    var toolbar = document.createElement('div');
    toolbar.className = 'pa-step-toolbar';
    var back = document.createElement('button');
    back.type = 'button';
    back.className = 'pa-back';
    back.textContent = '\u2190 Edit schedule';
    back.addEventListener('click', function () {
      state.step = 0;
      state.error = '';
      render();
    });
    toolbar.appendChild(back);
    wrap.appendChild(toolbar);

    wrap.appendChild(buildWhatHappensNext());

    var form = document.createElement('div');
    form.className = 'pa-form pa-form-sheet pa-form-grouped';
    form.setAttribute('aria-label', 'Contact details');

    form.appendChild(buildFormGroup(
      'Contact',
      'How we reach you with confirmation and your receipt.',
      [
        inputField('Full name', 'name', 'text', state.name, true, 'name', 'Jane Smith', 'Used on your booking confirmation.'),
        inputField('Email', 'email', 'email', state.email, true, 'email', 'you@example.com', 'We send your receipt and next steps here.'),
        inputField('Phone', 'phone', 'tel', state.phone, true, 'tel', '(717) 555-0100', 'For day-of coordination if needed.'),
      ]
    ));

    var eventFields = [
      buildEventTypePills(),
      inputField('Venue or city', 'venue', 'text', state.venue, true, 'address-level2', 'Harrisburg, PA or venue name', 'Where your event takes place.'),
      inputField('Expected guests', 'guest-count', 'text', state.guestCount, false, 'off', 'e.g. 150', 'Helps us plan crew size and gear.'),
    ];
    var orgField = inputField('Organization', 'organization', 'text', state.organization, state.eventType === 'Corporate', 'organization', 'Company name', 'Required for corporate events.');
    if (state.eventType !== 'Corporate') {
      orgField.classList.add('is-hidden');
    }
    eventFields.push(orgField);
    form.appendChild(buildFormGroup(
      'Event details',
      'Tell us about your event so we can prepare the right crew and gear.',
      eventFields
    ));

    var addonsSection = buildAddonsSection();
    if (addonsSection) {
      form.appendChild(addonsSection);
    }

    form.appendChild(buildFormGroup(
      'Production brief',
      'Share timeline and access details — like a HoneyBook questionnaire.',
      [
        textareaField('Event timeline', 'timeline-notes', state.timelineNotes, 'Ceremony 4pm, reception 6pm, first dance 8pm…', 'Key moments and schedule.'),
        textareaField('Venue access & load-in', 'venue-access', state.venueAccess, 'Loading dock, elevator, power locations…', 'Helps us plan gear and arrival time.'),
        textareaField('Deliverables & creative direction', 'deliverables-notes', state.deliverablesNotes, 'Highlight reel length, must-have shots, audio needs…', 'What success looks like for you.'),
      ]
    ));

    form.appendChild(buildFormGroup(
      'Notes',
      'Anything else we should know before your pre-production call.',
      [textareaField('Special requests', 'notes', state.notes, 'Additional context not covered above…', 'Optional — up to 500 characters.')]
    ));

    wrap.appendChild(form);

    var scheduleCard = buildPaymentScheduleCard();
    if (scheduleCard) {
      wrap.appendChild(scheduleCard);
    }

    if (state.stripeReady) {
      wrap.appendChild(buildTermsAgreement());
      wrap.appendChild(buildCheckoutPanel(false, true));
      wireDetailsPayButton(wrap);
    } else {
      var next = document.createElement('button');
      next.type = 'button';
      next.className = 'pa-submit pa-btn';
      next.disabled = state.submitting;
      next.textContent = state.submitting ? 'Sending request\u2026' : 'Submit request';
      next.addEventListener('click', function () {
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
        clearFieldErrors();
        state.error = '';
        submitBooking();
      });
      var footnote = document.createElement('p');
      footnote.className = 'pa-continue-footnote';
      footnote.textContent = 'No spam — just your booking confirmation and next steps.';
      appendBookingAction(wrap, next, true, footnote);
    }
    return wrap;
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

  function buildEventTypePills() {
    var wrap = document.createElement('fieldset');
    wrap.className = 'pa-event-wrap';
    var legend = document.createElement('legend');
    legend.className = 'pa-field-label';
    legend.textContent = 'Event type';
    wrap.appendChild(legend);
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
    var recap = document.createElement('aside');
    recap.className = 'pa-booking-recap pa-booking-recap-premium pa-booking-recap-invoice';
    recap.setAttribute('aria-label', 'Booking summary');

    var head = document.createElement('div');
    head.className = 'pa-booking-recap-head';
    var kicker = document.createElement('span');
    kicker.className = 'pa-booking-recap-kicker';
    kicker.textContent = 'Booking summary';
    head.appendChild(kicker);
    if (state.stripeReady && state.selectedDates.length) {
      var badge = document.createElement('span');
      badge.className = 'pa-booking-recap-badge';
      badge.textContent = formatMoney(getDepositTotal()) + ' deposit';
      head.appendChild(badge);
    }
    var edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'pa-recap-edit';
    edit.textContent = 'Edit schedule';
    edit.addEventListener('click', function () {
      state.step = 0;
      state.error = '';
      render();
    });
    head.appendChild(edit);
    recap.appendChild(head);

    var lines = document.createElement('div');
    lines.className = 'pa-recap-invoice-lines';

    function addLine(label, value, scrollTarget) {
      if (!value) return;
      var row = document.createElement('div');
      row.className = 'pa-recap-invoice-line';
      var labelEl = document.createElement('span');
      labelEl.className = 'pa-recap-invoice-label';
      labelEl.textContent = label;
      var valueEl = document.createElement('span');
      valueEl.className = 'pa-recap-invoice-value';
      valueEl.textContent = value;
      row.appendChild(labelEl);
      row.appendChild(valueEl);
      if (scrollTarget) {
        var editLine = document.createElement('button');
        editLine.type = 'button';
        editLine.className = 'pa-recap-line-edit';
        editLine.textContent = 'Edit';
        editLine.setAttribute('aria-label', 'Edit ' + label.toLowerCase());
        editLine.addEventListener('click', function (targetId) {
          return function () {
            state.step = 0;
            state.error = '';
            state.focusTarget = targetId === 'pa-section-service' ? '' : targetId;
            render();
            requestAnimationFrame(function () {
              scrollToScheduleTarget(targetId);
            });
          };
        }(scrollTarget));
        row.appendChild(editLine);
      }
      lines.appendChild(row);
    }

    addLine('Package', state.service, 'pa-section-service');
    getAddonsForService().forEach(function (addon) {
      if (state.selectedAddons[addon.id]) {
        addLine('Add-on', addon.label, null);
      }
    });
    addLine('Date', formatDatesSummary(), 'pa-section-date');
    addLine('Time', state.timeWindow ? shortTimeWindow(state.timeWindow) : '', 'pa-section-time');

    recap.appendChild(lines);

    if (state.stripeReady && state.selectedDates.length) {
      var quoteNote = document.createElement('p');
      quoteNote.className = 'pa-recap-invoice-note pa-recap-quote-note';
      quoteNote.textContent = 'Package total determined after review — deposit applies toward your final quote.';
      recap.appendChild(quoteNote);

      var totalRow = document.createElement('div');
      totalRow.className = 'pa-recap-invoice-total';
      var totalLabel = document.createElement('span');
      totalLabel.className = 'pa-recap-invoice-total-label';
      totalLabel.textContent = 'Deposit due today';
      var totalValue = document.createElement('span');
      totalValue.className = 'pa-recap-invoice-total-value';
      totalValue.textContent = formatMoney(getDepositTotal());
      totalRow.appendChild(totalLabel);
      totalRow.appendChild(totalValue);
      recap.appendChild(totalRow);
      var totalNote = document.createElement('p');
      totalNote.className = 'pa-recap-invoice-note';
      totalNote.textContent = getDayCount() === 1
        ? 'Holds your date — applied toward your custom package quote.'
        : formatMoney(state.depositPerDay) + ' per day \u00d7 ' + getDayCount() + ' days. Applied toward your final quote.';
      recap.appendChild(totalNote);
    }

    return recap;
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
    wrap.className = 'pa-step pa-step-pay';
    wrap.id = 'pa-step-focus-2';

    var toolbar = document.createElement('div');
    toolbar.className = 'pa-step-toolbar';
    var back = document.createElement('button');
    back.type = 'button';
    back.className = 'pa-back';
    back.textContent = '← Edit details';
    back.addEventListener('click', function () { state.step = 1; state.error = ''; render(); });
    toolbar.appendChild(back);
    wrap.appendChild(toolbar);

    if (state.stripeReady) {
      wrap.appendChild(buildCheckoutPanel(true));
    } else {
      wrap.appendChild(buildSummaryBar());
      var submit = document.createElement('button');
      submit.type = 'button';
      submit.className = 'pa-submit pa-btn';
      submit.textContent = 'Submit request';
      submit.disabled = state.submitting;
      submit.addEventListener('click', submitBooking);
      appendBookingAction(wrap, submit);
    }

    return wrap;
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

  function buildCheckoutPanel(includeContact, compact) {
    if (compact) {
      return buildSecureDepositPanel();
    }
    return buildFullCheckoutPanel(includeContact);
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
      ? 'You\u2019ll complete payment on GoDaddy\u2019s encrypted checkout page, then return here for confirmation.'
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

  function buildPaySubmitButton(payErr, vault) {
    var submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'pa-submit pa-pay-btn pa-btn pa-checkout-btn' + (vault ? ' pa-vault-pay-btn' : '');
    submit.disabled = state.submitting || !!payErr;
    if (state.submitting) {
      submit.textContent = 'Opening secure checkout\u2026';
    } else if (vault) {
      submit.textContent = 'Continue to secure payment \u2014 ' + formatMoney(getDepositTotal());
    } else {
      submit.textContent = 'Pay ' + formatMoney(getDepositTotal()) + ' deposit';
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
    submit.textContent = state.submitting
      ? 'Opening secure checkout\u2026'
      : (state.paymentProvider === 'paylink'
        ? 'Pay ' + formatMoney(getDepositTotal()) + ' now'
        : 'Pay ' + formatMoney(getDepositTotal()));
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
    if (state.step !== 1 || state.submitting) return null;

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

  function submitBooking() {
    if (state.submitting) return;
    state.submitting = true;
    state.error = '';
    render();

    fetch(PABooking.restUrl + 'request', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': PABooking.nonce },
      body: JSON.stringify(buildBookingPayload()),
    })
      .then(parseApiResponse)
      .then(function (res) {
        if (!res.ok) {
          var msg = (res.body && res.body.message) || 'Request failed.';
          if (/cookie check failed/i.test(msg)) {
            return refreshSession().then(function () {
              return fetch(PABooking.restUrl + 'request', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': PABooking.nonce },
                body: JSON.stringify(buildBookingPayload()),
              }).then(parseApiResponse);
            });
          }
          throw new Error(msg);
        }
        if (res.body.checkout_url) {
          state.error = '';
          saveLastBooking();
          try {
            sessionStorage.setItem('pa_deposit_opened', '1');
            if (res.body.success_url) {
              sessionStorage.setItem('pa_checkout_success_url', res.body.success_url);
            }
            if (res.body.booking_id) {
              sessionStorage.setItem('pa_pending_booking_id', String(res.body.booking_id));
            }
            saveDraft();
          } catch (e) { /* ignore */ }
          window.location.href = res.body.checkout_url;
          return;
        }
        if (res.body.success_url) {
          saveLastBooking();
          clearBookingSession();
          window.location.href = res.body.success_url;
          return;
        }
        state.submitting = false;
        renderSuccess();
      })
      .catch(function (err) {
        state.submitting = false;
        state.error = err.message || 'Something went wrong.';
        showToast(state.error, 'error');
        render();
      });
  }

  function renderSuccess() {
    saveLastBooking();
    while (root.firstChild) root.removeChild(root.firstChild);
    var box = document.createElement('div');
    box.className = 'pa-done pa-done-premium';

    var icon = document.createElement('div');
    icon.className = 'pa-done-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '\u2713';
    box.appendChild(icon);

    var eyebrow = document.createElement('p');
    eyebrow.className = 'pa-done-eyebrow';
    eyebrow.textContent = 'Request submitted';
    box.appendChild(eyebrow);

    var title = document.createElement('h3');
    title.textContent = 'You\u2019re on our calendar queue';
    box.appendChild(title);

    var lead = document.createElement('p');
    lead.className = 'pa-done-lead';
    var svcPart = state.service ? state.service + ' on ' : '';
    lead.textContent = 'We received your request for ' + svcPart + formatDatesSummary() + '. A personal confirmation arrives within one business day.';
    box.appendChild(lead);

    var timeline = document.createElement('ol');
    timeline.className = 'pa-done-timeline';
    timeline.innerHTML =
      '<li class="is-complete"><strong>Today</strong><span>Request submitted — dates noted</span></li>' +
      '<li class="is-active"><strong>Within one business day</strong><span>Personal confirmation email with next steps</span></li>' +
      '<li><strong>Before your event</strong><span>Pre-production call, contract, and final balance</span></li>';
    box.appendChild(timeline);

    var trust = document.createElement('div');
    trust.className = 'pa-done-trust';
    trust.setAttribute('role', 'list');
    trust.setAttribute('aria-label', 'What to expect');
    ['No spam', 'Human review', 'PA-based crew'].forEach(function (text) {
      var span = document.createElement('span');
      span.setAttribute('role', 'listitem');
      span.textContent = text;
      trust.appendChild(span);
    });
    box.appendChild(trust);

    var actions = document.createElement('div');
    actions.className = 'pa-done-actions';
    var icsBtn = document.createElement('button');
    icsBtn.type = 'button';
    icsBtn.className = 'pa-ics-btn pa-ics-btn--primary';
    icsBtn.textContent = 'Add to calendar';
    icsBtn.addEventListener('click', downloadIcsFile);
    actions.appendChild(icsBtn);
    box.appendChild(actions);

    root.appendChild(box);
    showToast('Booking request sent', 'success');
    scrollToPanel();
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
    if (required) input.required = true;
    if (autocomplete) input.setAttribute('autocomplete', autocomplete);
    if (type === 'tel') input.setAttribute('inputmode', 'tel');
    if (placeholder) input.placeholder = placeholder;
    if (state.fieldErrors[fieldId]) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', fieldId + '-error' + (help ? ' ' + fieldId + '-help' : ''));
    } else if (help) {
      input.setAttribute('aria-describedby', fieldId + '-help');
    }
    input.addEventListener('input', function () {
      if (state.fieldErrors[fieldId]) {
        delete state.fieldErrors[fieldId];
        wrap.classList.remove('has-error');
        input.removeAttribute('aria-invalid');
        var errEl = document.getElementById(fieldId + '-error');
        if (errEl && errEl.parentNode) errEl.parentNode.removeChild(errEl);
      }
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
      if (state.selectedDates.length === 1 && !state.timeWindow) {
        state.focusTarget = 'pa-section-time';
      }
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
