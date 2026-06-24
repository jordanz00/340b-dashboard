/**
 * ONE-STEP LIVE DEPLOY — paste in wp-admin Plugin Editor while booking.js is open.
 * F12 → Console → paste → Enter. Then Flush Cache.
 */
(async function paDeployBookingPatch() {
  const PLUGIN = 'pa-media-booking.disabled';
  const file = PLUGIN + '/assets/booking.js';
  const editorUrl =
    '/wp-admin/plugin-editor.php?file=' +
    encodeURIComponent(file) +
    '&plugin=' +
    encodeURIComponent(PLUGIN + '/pa-media-booking.php');
  const ta = document.getElementById('newcontent');
  if (!ta) {
    alert('Open pa-media-booking.disabled → assets → booking.js in Plugin Editor, then run this again.');
    return;
  }
  let c = ta.value;
  if (!c.includes('buildPayFirstStep')) {
    alert('This does not look like booking.js');
    return;
  }
  if (c.includes('checkDepositReturn') && !c.includes('I\u2019ve completed payment')) {
    console.log('Already patched.');
    return;
  }

  if (!c.includes('depositReturnMessage')) {
    c = c.replace(
      'depositOpened: false,\n    paylinkUrl',
      "depositOpened: false,\n    depositReturnMessage: '',\n    paylinkUrl"
    );
  }

  c = c.replace(
    "    'Pay your deposit on GoDaddy Payments — then return here to continue.',",
    "    'Pay your deposit on GoDaddy Payments, then return to this page to finish.',"
  );

  if (!c.includes('function getDepositReturnUrl')) {
    c = c.replace(
      '  function getPaylinkUrl() {\n    return state.paylinkUrl || PABooking.paylinkUrl || \'\';\n  }\n',
      "  function getPaylinkUrl() {\n    return state.paylinkUrl || PABooking.paylinkUrl || '';\n  }\n\n  function getDepositReturnUrl() {\n    return (PABooking && PABooking.depositReturnUrl)\n      ? PABooking.depositReturnUrl\n      : (window.location.pathname + '?deposit=done');\n  }\n\n  function isPaylinkReferrer(referrer) {\n    return /paylinks\\.godaddy\\.com|poynt\\.godaddy\\.com/i.test(referrer || '');\n  }\n\n  function completeDepositReturn(cleanUrl) {\n    markDepositCompleted();\n    state.step = 2;\n    state.depositReturnMessage = 'Deposit received \\u2014 add your details below to send your request.';\n    state.focusTarget = 'step';\n    state.error = '';\n    try {\n      sessionStorage.removeItem('pa_deposit_opened');\n    } catch (e) { /* ignore */ }\n    state.depositOpened = false;\n    if (cleanUrl && window.history.replaceState) {\n      window.history.replaceState({}, '', window.location.pathname + window.location.hash);\n    }\n  }\n\n  function checkDepositReturn(params) {\n    if (state.depositCompleted) {\n      return false;\n    }\n    params = params || new URLSearchParams(window.location.search);\n    if (params.get('deposit') === 'done') {\n      completeDepositReturn(true);\n      return true;\n    }\n    if (!usesPayFirst()) {\n      return false;\n    }\n    var awaiting = false;\n    try {\n      awaiting = sessionStorage.getItem('pa_deposit_opened') === '1';\n    } catch (e) { /* ignore */ }\n    if (awaiting) {\n      completeDepositReturn(true);\n      return true;\n    }\n    return false;\n  }\n"
    );
  }

  if (!c.includes("addEventListener('pageshow'")) {
    c = c.replace(
      '  init();\n  initStickyBar();\n',
      "  init();\n  initStickyBar();\n  window.addEventListener('pageshow', function () {\n    if (checkDepositReturn()) {\n      render();\n    }\n  });\n"
    );
  }

  c = c.replace(
    /    if \(params\.get\('deposit'\) === 'done'\) \{[\s\S]*?    \}\n    restoreDraft\(\);/,
    '    restoreDraft();'
  );

  c = c.replace(
    /    refreshSession\(\)\.then\(function \(\) \{\n      return fetchMonth\(state\.month\);/,
    "    refreshSession().then(function () {\n      if (params.get('checkout') !== 'cancelled') {\n        checkDepositReturn(params);\n      }\n      return fetchMonth(state.month);"
  );

  c = c.replace(
    /    if \(state\.depositOpened \|\| state\.depositCompleted\) \{[\s\S]*?      wrap\.appendChild\(continueBtn\);\n    \}\n\n    var note = document\.createElement\('p'\);\n    note\.className = 'pa-pay-note';\n    note\.textContent = 'After paying, return here[\s\S]*?;\n    wrap\.appendChild\(note\);/,
    "    var note = document.createElement('p');\n    note.className = 'pa-pay-note';\n    note.textContent = 'After payment, return to this page (browser Back or the Book menu link) \\u2014 your details form opens automatically.';\n    wrap.appendChild(note);"
  );

  if (!c.includes('pa-deposit-success-banner')) {
    c = c.replace(
      '    wrap.appendChild(buildSummaryBar());\n\n    var title = document.createElement(\'h3\');\n    title.className = \'pa-step-title\';\n    title.textContent = usesPayFirst() ? \'Your details\'',
      "    wrap.appendChild(buildSummaryBar());\n\n    if (state.depositReturnMessage) {\n      var success = document.createElement('p');\n      success.className = 'pa-deposit-success-banner';\n      success.setAttribute('role', 'status');\n      success.textContent = state.depositReturnMessage;\n      wrap.appendChild(success);\n      state.depositReturnMessage = '';\n    }\n\n    var title = document.createElement('h3');\n    title.className = 'pa-step-title';\n    title.textContent = usesPayFirst() ? 'Your details'"
    );
  }

  const html = await (await fetch(editorUrl, { credentials: 'include' })).text();
  const m =
    html.match(/name=["']nonce["'][^>]*value=["']([^"']+)["']/) ||
    html.match(/value=["']([^"']+)["'][^>]*name=["']nonce["']/);
  if (!m) {
    alert('Session expired — refresh wp-admin, reopen booking.js, paste this again.');
    return;
  }
  const body = new URLSearchParams({
    nonce: m[1],
    action: 'update',
    file,
    newcontent: c,
    submit: 'Update File',
  });
  const res = await fetch('/wp-admin/plugin-editor.php', { method: 'POST', credentials: 'include', body });
  const text = await res.text();
  if (text.includes('File edited successfully')) {
    console.log('SUCCESS — GoDaddy Quick Links → Flush Cache, then test /book/');
    alert('booking.js updated! Flush cache (GoDaddy Quick Links), then test /book/');
  } else {
    console.error('Save failed — log in again and retry.');
    alert('Save failed. Refresh wp-admin and try again.');
  }
})();
