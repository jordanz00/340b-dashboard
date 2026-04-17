/**
 * HAP Regulatory Advocacy 2026 — mobile app shell (swipe + tabs).
 *
 * WHO THIS IS FOR: Policymakers and members opening the brief on a phone.
 * WHAT IT DOES: Renders a five-segment, Apple-style shell from window.HAP_REGULATORY_ADVOCACY_2026 (facts.js),
 *   with horizontal swipe between segments and a frosted tab bar.
 * HOW IT CONNECTS: facts.js (data), map-lookups.js (state names / FIPS), vendor D3/topojson/US atlas (map).
 *
 * POWER BI MAPPING: none (static advocacy brief).
 *
 * See SECURE-FORCE.md — UI uses createElement + textContent only for dynamic copy.
 */
(function () {
  'use strict';

  var TABS = ['overview', 'stats', 'priorities', 'benchmark', 'receipts'];
  var TAB_META = [
    { id: 'overview', label: 'Start' },
    { id: 'stats', label: 'Data' },
    { id: 'priorities', label: 'Asks' },
    { id: 'benchmark', label: 'Map' },
    { id: 'receipts', label: 'More' }
  ];

  var currentTab = 'overview';
  var previousTab = null;
  var touchStartX = 0;
  var touchStartY = 0;
  var touchStartTime = 0;
  var isSwiping = false;
  var mapDrawn = false;
  var statsBanWired = false;

  var dom = {};

  function setText(el, text) {
    if (el && text != null) el.textContent = text;
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function formatIntDisplay(n) {
    if (typeof n !== 'number' || !window.Intl) return String(n);
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  }

  function runBanCountUp(el, spec, finalDisplay) {
    if (!el || !spec || spec.mode === 'none') {
      setText(el, finalDisplay);
      el.setAttribute('data-ban-state', 'done');
      return;
    }
    if (prefersReducedMotion()) {
      setText(el, finalDisplay);
      el.setAttribute('data-ban-state', 'done');
      return;
    }
    var end = typeof spec.end === 'number' ? spec.end : 0;
    var prefix = spec.prefix || '';
    var suffix = spec.suffix || '';
    var duration = end > 200000 ? 2400 : end > 5000 ? 1900 : 1200;
    var startTs = null;
    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }
    function frame(ts) {
      if (startTs === null) startTs = ts;
      var p = Math.min(1, (ts - startTs) / duration);
      var eased = easeOutCubic(p);
      var current = Math.round(end * eased);
      var mid =
        end > 999 ? prefix + formatIntDisplay(current) + suffix : prefix + String(current) + suffix;
      setText(el, mid);
      if (p < 1) {
        window.requestAnimationFrame(frame);
      } else {
        setText(el, finalDisplay);
        el.setAttribute('data-ban-state', 'done');
      }
    }
    setText(el, prefix + '0' + (spec.mode === 'int' && end > 0 ? suffix : ''));
    el.setAttribute('data-ban-state', 'running');
    window.requestAnimationFrame(frame);
  }

  function getRegAdvSourcesById() {
    var data = window.HAP_REGULATORY_ADVOCACY_2026;
    var by = {};
    if (!data || !data.sources) return by;
    data.sources.forEach(function (s) {
      by[s.id] = s;
    });
    return by;
  }

  function createDeckIconSvg(kind, sizeClass) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', sizeClass || 'hap-mob-data-ic');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var k = kind || 'facilities';
    if (k === 'build') k = 'facilities';
    if (k === 'badge') k = 'workforce';
    if (k === 'surgery') k = 'policydoc';

    function path(d) {
      var p = document.createElementNS(ns, 'path');
      p.setAttribute('fill', 'currentColor');
      p.setAttribute('d', d);
      svg.appendChild(p);
    }

    if (k === 'facilities') {
      path('M10 20v-6h4v6h5v-10h3L12 3 2 10h3v10z');
    } else if (k === 'workforce') {
      path(
        'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z'
      );
    } else if (k === 'policydoc') {
      path(
        'M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm0 1.4L18.6 8H14V3.4zM8 12h8v2H8v-2zm0 4h8v2H8v-2z'
      );
    } else {
      path('M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5v5h5v2h-5v5h-2v-5H6v-2h5V7h2z');
    }
    return svg;
  }

  function createDataIconSvg(kind, className) {
    var k = (kind || 'neutral').toString();
    if (k === 'build') k = 'facilities';
    if (k === 'badge') k = 'workforce';
    if (k === 'surgery') k = 'medical';
    if (k === 'facilities' || k === 'workforce' || k === 'policydoc') {
      return createDeckIconSvg(k, className || 'hap-mob-data-ic');
    }

    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', className || 'hap-mob-data-ic');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');

    function path(d) {
      var p = document.createElementNS(ns, 'path');
      p.setAttribute('fill', 'currentColor');
      p.setAttribute('d', d);
      svg.appendChild(p);
    }

    if (k === 'dollar' || k === 'economy') {
      path(
        'M11.8 10.9c-1.8-.5-2.3-.9-2.3-1.6 0-.8.8-1.3 2-1.3 1.2 0 2 .5 2.3 1.2l2-.4c-.5-1.6-2-2.7-4.3-2.8V4h-2v2.1c-2.3.2-4 1.5-4 3.6 0 2.3 1.8 3.4 4.5 4 1.8.4 2.2 1 2.2 1.6 0 .5-.4 1.2-2 1.2-1.4 0-2.3-.6-2.7-1.5l-2.1.4c.6 1.9 2.3 3 4.8 3.1V20h2v-2c2.3-.3 4.1-1.6 4.1-3.9 0-2.6-2.2-3.6-4.8-4.1z'
      );
    } else if (k === 'jobs' || k === 'briefcase') {
      path(
        'M20 6h-3V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2zm-9-2h2v2h-2V4zM4 8h16v3H4V8zm0 5h16v6H4v-6z'
      );
    } else if (k === 'trendDown' || k === 'trend-down') {
      path('M16 18h6v-2h-2.59l-5.3-5.3-4 4L3 8.41 4.41 7l5.3 5.3L14 8l8 8H16v2z');
    } else if (k === 'trendUp' || k === 'trend-up') {
      path('M16 6l8 8h-6v2H8v-2h2.59l-5.3-5.3L4 15.59 2.59 14 8 8.41 13 13.59 18 9l6 6V6h-2z');
    } else if (k === 'hospital') {
      path(
        'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2zm-1 14h-4v-4h-4v4H6V5h12v12zm-6-9h2v2h-2V8zm0 3h2v2h-2v-2z'
      );
    } else if (k === 'calendar') {
      path(
        'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z'
      );
    } else if (k === 'pie') {
      path(
        'M11 2.05V13h10.95c-.5-5.05-4.54-9.09-9.6-9.95zM13.83 2.05C17.45 2.56 20.5 5.71 21 9.33h-7.11V2.05zm-1.66 0.02C8.04 2.55 4.55 6.04 4.07 10.17 3.59 14.3 5.71 18.3 9.33 20.5c3.62 2.2 8.16 1.75 11.25-1.09L13 11 13 2.07c-.41-.01-.82-.01-1.24 0z'
      );
    } else if (k === 'checkDouble') {
      path('M18 7l-8 8-4-4-1.41 1.41L10 18l9.59-9.59L18 7zm-1.41-1.41L10 14.17l-2.59-2.58L6 13l4 4 8.59-8.59L16.59 5.59z');
    } else if (k === 'community') {
      path(
        'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
      );
    } else if (k === 'scale') {
      path('M12 3c-.55 0-1 .45-1 1v1H6V4c0-.55-.45-1-1-1s-1 .45-1 1v4c0 1.66 1.34 3 3 3s3-1.34 3-3V4c0-.55-.45-1-1-1zm-2 7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm10-6c-.55 0-1 .45-1 1v1h-5V4c0-.55-.45-1-1-1s-1 .45-1 1v4c0 1.66 1.34 3 3 3s3-1.34 3-3V4c0-.55-.45-1-1-1zm-1 7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM12 13c-2.21 0-4 1.79-4 4v3h8v-3c0-2.21-1.79-4-4-4z');
    } else if (k === 'clipboard') {
      path(
        'M19 3h-4.18C14.4 1.84 13.3 1 12 1S9.6 1.84 9.18 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 16H5V5h2v1h10V5h2v14z'
      );
    } else if (k === 'invoice') {
      path(
        'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-9-8h2v2H9v-2zm0 4h6v2H9v-2zm0-8h6v2H9V8z'
      );
    } else if (k === 'medical') {
      path(
        'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z'
      );
    } else {
      path('M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5v5h5v2h-5v5h-2v-5H6v-2h5V7h2z');
    }
    return svg;
  }

  function createStatBandIconSvg(kind, className, bandId) {
    var k = (kind || 'neutral').toString();
    if (k === 'economy') k = 'dollar';
    var kindClass = k.replace(/[^a-z0-9-]/gi, '') || 'neutral';

    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', (className || 'hap-mob-stat-ic') + ' hap-mob-stat-ic--' + kindClass);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    if (bandId) svg.setAttribute('data-stat-band-id', bandId);

    function strokeShape(el) {
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', 'currentColor');
      el.setAttribute('stroke-width', '1.62');
      el.setAttribute('stroke-linecap', 'round');
      el.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(el);
    }
    function addPath(d) {
      var p = document.createElementNS(ns, 'path');
      p.setAttribute('d', d);
      strokeShape(p);
    }
    function addCircle(cx, cy, r) {
      var c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', String(cx));
      c.setAttribute('cy', String(cy));
      c.setAttribute('r', String(r));
      strokeShape(c);
    }
    function addRect(x, y, w, h, rx) {
      var r = document.createElementNS(ns, 'rect');
      r.setAttribute('x', String(x));
      r.setAttribute('y', String(y));
      r.setAttribute('width', String(w));
      r.setAttribute('height', String(h));
      if (rx != null) r.setAttribute('rx', String(rx));
      strokeShape(r);
    }
    function addPolyline(points) {
      var pl = document.createElementNS(ns, 'polyline');
      pl.setAttribute('points', points);
      strokeShape(pl);
    }

    if (k === 'dollar') {
      addPath('M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6');
    } else if (k === 'jobs' || k === 'briefcase') {
      addPath('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2');
      addCircle(9, 7, 4);
      addPath('M22 21v-2a4 4 0 0 0-3-3.87');
      addPath('M16 3.13a4 4 0 0 1 0 7.75');
    } else if (k === 'trendDown' || k === 'trend-down') {
      addPolyline('22 17 13.5 8.5 8.5 13.5 2 7');
      addPolyline('16 17 22 17 22 23');
    } else if (k === 'pie') {
      addPath('M21.21 15.89A10 10 0 1 1 8 2.83');
      addPath('M22 12A10 10 0 0 0 12 2v10z');
    } else if (k === 'hospital') {
      addPath('M6 22V10l6-3.5 6 3.5v12H6z');
      addPath('M10 22v-5h4v5');
      addPath('M10 14h4');
      addPath('M10 10h4');
    } else if (k === 'calendar') {
      addPath('M8 2v4');
      addPath('M16 2v4');
      addRect(3, 5, 18, 17, 2);
      addPath('M3 11h18');
    } else {
      addCircle(12, 12, 9);
      addPath('M8 12h8');
    }
    return svg;
  }

  function statBandAccentClass(id) {
    if (id === 'sb-econ') return 'hap-mob-stat-item--finance';
    if (id === 'sb-jobs') return 'hap-mob-stat-item--jobs';
    if (id === 'sb-red') return 'hap-mob-stat-item--risk';
    if (id === 'sb-phc4') return 'hap-mob-stat-item--policy';
    if (id === 'sb-members') return 'hap-mob-stat-item--members';
    if (id === 'sb-1982') return 'hap-mob-stat-item--code';
    return '';
  }

  function heroSubShort(sub) {
    if (!sub) return '';
    var parts = sub.split('\n\n');
    var first = (parts[0] || '').trim();
    if (first.length > 320) return first.slice(0, 317) + '…';
    return first;
  }

  function topicKpiClass(topic, sentiment) {
    var t = topic || 'access';
    if (t === 'finance') return 'hap-mob-kpi--finance';
    if (t === 'risk') return 'hap-mob-kpi--risk';
    return 'hap-mob-kpi--access';
  }

  function renderMobStatBand(container, items, sourceById) {
    if (!container) return;
    while (container.firstChild) container.removeChild(container.firstChild);
    items.forEach(function (k) {
      var src = sourceById[k.sourceId];
      var wrap = document.createElement('div');
      wrap.className = 'hap-mob-stat-item ' + statBandAccentClass(k.id);

      var icWrap = document.createElement('div');
      icWrap.className = 'hap-mob-stat-icon-wrap';
      icWrap.appendChild(createStatBandIconSvg(k.iconKind, 'hap-mob-stat-ic', k.id));

      var value = document.createElement('div');
      value.className = 'hap-mob-stat-value';
      value.id = 'mob-' + k.id + '-value';
      if (k.ban && k.ban.mode === 'none') {
        setText(value, k.value);
        value.setAttribute('data-ban-state', 'done');
      } else if (k.ban && k.ban.mode === 'int') {
        setText(value, (k.ban.prefix || '') + '0' + (k.ban.end > 0 ? k.ban.suffix || '' : ''));
        value.setAttribute('data-ban-state', 'pending');
      } else {
        setText(value, k.value);
        value.setAttribute('data-ban-state', 'done');
      }

      var label = document.createElement('div');
      label.className = 'hap-mob-stat-label';
      setText(label, k.label);

      var sn = document.createElement('div');
      sn.className = 'hap-mob-stat-source';
      if (src && src.url) {
        var a = document.createElement('a');
        a.href = src.url;
        a.rel = 'noopener noreferrer';
        setText(a, k.sourceNote || 'Source');
        sn.appendChild(a);
      } else {
        setText(sn, k.sourceNote || (src ? src.publisher : 'Source'));
      }

      wrap.appendChild(icWrap);
      wrap.appendChild(value);
      wrap.appendChild(label);
      if (k.caption) {
        var cap = document.createElement('p');
        cap.className = 'hap-mob-stat-caption';
        setText(cap, k.caption);
        wrap.appendChild(cap);
      }
      wrap.appendChild(sn);
      container.appendChild(wrap);

      wrap._hapBanEl = value;
      wrap._hapBanSpec = k.ban;
      wrap._hapBanFinal = k.value;
    });
  }

  function attachMobBanObservers() {
    var nodes = document.querySelectorAll('.hap-mob-stat-item');
    if (!nodes.length) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var card = entry.target;
          io.unobserve(card);
          var el = card._hapBanEl;
          var spec = card._hapBanSpec;
          var fin = card._hapBanFinal;
          if (!el || el.getAttribute('data-ban-state') === 'done' || el.getAttribute('data-ban-state') === 'running')
            return;
          runBanCountUp(el, spec, fin);
        });
      },
      { root: null, threshold: 0.28, rootMargin: '0px 0px -8% 0px' }
    );
    Array.prototype.forEach.call(nodes, function (c) {
      io.observe(c);
    });
  }

  function renderSources(container, sources) {
    if (!container) return;
    while (container.firstChild) container.removeChild(container.firstChild);
    sources.forEach(function (s) {
      var details = document.createElement('details');
      details.className = 'hap-mob-src';
      if (s.id) details.id = 'mob-src-' + s.id;
      var summary = document.createElement('summary');
      setText(summary, s.shortTitle || s.publisher || 'Source');
      var body = document.createElement('div');
      body.className = 'hap-mob-src-body';
      if (s.accessedNote) {
        var p = document.createElement('p');
        setText(p, s.accessedNote);
        body.appendChild(p);
      }
      if (s.url) {
        var a = document.createElement('a');
        a.href = s.url;
        a.rel = 'noopener noreferrer';
        setText(a, s.url);
        body.appendChild(a);
      }
      details.appendChild(summary);
      details.appendChild(body);
      container.appendChild(details);
    });
  }

  /* —— US map (mobile container ids) —— */
  function fipsIdToAbbrReg(id) {
    var tbl = window.HAP_REG_MAP_FIPS_TO_ABBR;
    if (!tbl) return '';
    var n = parseInt(String(id), 10);
    if (isNaN(n)) return '';
    return tbl[n] || '';
  }

  function buildJcRecognizedSet(data) {
    var set = {};
    var names = window.HAP_REG_MAP_STATE_NAMES;
    var list = data && data.jcAmbulatoryRecognizedAbbr ? data.jcAmbulatoryRecognizedAbbr : [];
    list.forEach(function (x) {
      var u = String(x || '')
        .toUpperCase()
        .trim();
      if (u.length !== 2 || !names || !names[u]) return;
      set[u] = true;
    });
    return set;
  }

  function countJcVerifiedAbbrs(data) {
    return Object.keys(buildJcRecognizedSet(data || {})).length;
  }

  function hideMobMapTooltip() {
    var tip = document.getElementById('hap-mob-map-tooltip');
    if (!tip) return;
    tip.classList.remove('is-on');
    while (tip.firstChild) tip.removeChild(tip.firstChild);
  }

  function showMobMapTooltip(abbr, clientX, clientY, rec) {
    var names = window.HAP_REG_MAP_STATE_NAMES;
    var tip = document.getElementById('hap-mob-map-tooltip');
    var wrap = document.getElementById('hap-mob-map-stage-wrap');
    if (!tip || !wrap || !names) return;
    hideMobMapTooltip();
    var nm = document.createElement('div');
    nm.className = 'hap-mob-map-tooltip-name';
    setText(nm, names[abbr] || abbr);
    var st = document.createElement('div');
    st.className = 'hap-mob-map-tooltip-sub';
    setText(
      st,
      rec[abbr]
        ? 'On this dashboard’s compiled TJC ambulatory list.'
        : 'Not on this compiled list—verify with TJC and the state.'
    );
    tip.appendChild(nm);
    tip.appendChild(st);
    window.requestAnimationFrame(function () {
      var wr = wrap.getBoundingClientRect();
      var left = clientX - wr.left + 8;
      var top = clientY - wr.top + 8;
      var maxL = Math.max(6, wrap.clientWidth - (tip.offsetWidth || 200) - 8);
      var maxT = Math.max(6, wrap.clientHeight - (tip.offsetHeight || 72) - 8);
      tip.style.left = Math.min(Math.max(6, left), maxL) + 'px';
      tip.style.top = Math.min(Math.max(6, top), maxT) + 'px';
      tip.classList.add('is-on');
    });
  }

  function updateMobMapSelection(abbr, rec, names) {
    var panel = document.getElementById('hap-mob-map-selection');
    if (!panel) return;
    while (panel.firstChild) panel.removeChild(panel.firstChild);
    if (!abbr) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    var nm = (names && names[abbr]) || abbr;
    var title = document.createElement('div');
    title.className = 'hap-mob-map-selection-title';
    setText(title, nm);
    var st = document.createElement('div');
    st.className = 'hap-mob-map-selection-status';
    var inList = rec && rec[abbr];
    setText(
      st,
      inList
        ? 'In the teal footprint for this dashboard: named on The Joint Commission’s Ambulatory State & Payer page under the Anthem, Highmark, or Centene blocks (compiled list).'
        : 'Outside this dashboard’s compiled list. Other recognition paths may still apply—verify with TJC and the state.'
    );
    var links = document.createElement('div');
    links.className = 'hap-mob-map-selection-links';
    var by = getRegAdvSourcesById();
    var tjc = by['jc-ahc-state-payer'];
    if (tjc && tjc.url) {
      var a = document.createElement('a');
      a.href = tjc.url;
      a.rel = 'noopener noreferrer';
      setText(a, 'TJC — State & Payer page');
      links.appendChild(a);
    }
    var a2 = document.createElement('a');
    a2.href = '#mob-src-jc-ambulatory-compiled-21';
    setText(a2, 'How this list was built');
    links.appendChild(a2);
    panel.appendChild(title);
    panel.appendChild(st);
    panel.appendChild(links);
  }

  function updateMobMapLegend() {
    var leg = document.getElementById('hap-mob-map-legend');
    if (!leg) return;
    var data = window.HAP_REGULATORY_ADVOCACY_2026;
    var n = countJcVerifiedAbbrs(data);
    while (leg.firstChild) leg.removeChild(leg.firstChild);
    var row = document.createElement('div');
    row.className = 'hap-mob-map-legend-row';
    function swatch(cls) {
      var s = document.createElement('span');
      s.className = 'hap-mob-map-legend-swatch ' + cls;
      s.setAttribute('aria-hidden', 'true');
      return s;
    }
    var item1 = document.createElement('div');
    item1.className = 'hap-mob-map-legend-item';
    item1.appendChild(swatch('hap-mob-map-legend-swatch--teal'));
    var t1 = document.createElement('span');
    setText(t1, 'Teal — ' + String(n) + ' states (compiled TJC payer blocks)');
    item1.appendChild(t1);
    var item2 = document.createElement('div');
    item2.className = 'hap-mob-map-legend-item';
    item2.appendChild(swatch('hap-mob-map-legend-swatch--muted'));
    var t2 = document.createElement('span');
    setText(t2, 'Gray — not on this list for this view');
    item2.appendChild(t2);
    row.appendChild(item1);
    row.appendChild(item2);
    leg.appendChild(row);
  }

  function drawMobRegulatoryMap() {
    var container = document.getElementById('hap-mob-map-stage');
    if (!container) return;
    if (typeof d3 === 'undefined' || typeof topojson === 'undefined') return;
    var usData = window.US_ATLAS_STATES_10M;
    if (!usData || !usData.objects || !usData.objects.states) return;
    var data = window.HAP_REGULATORY_ADVOCACY_2026;
    var rec = buildJcRecognizedSet(data || {});
    var names = window.HAP_REG_MAP_STATE_NAMES;
    if (!names) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    var width = container.clientWidth;
    if (!width || width < 48) {
      width = Math.max(280, Math.min(720, (window.innerWidth || 400) - 36));
    }
    var height = Math.round(width * 0.72);

    var svg = d3
      .select(container)
      .append('svg')
      .attr('class', 'hap-mob-map-svg')
      .attr('viewBox', '0 0 ' + width + ' ' + height)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', 'auto');

    var statesFc = topojson.feature(usData, usData.objects.states);
    var projection = d3.geoAlbersUsa().fitSize([width - 10, height - 10], statesFc);
    var path = d3.geoPath().projection(projection);
    var states = statesFc.features;

    var fillRecognized = '#2d7d72';
    var fillOther = '#c8cec9';

    function fillForAbbr(abbr) {
      if (!abbr) return fillOther;
      return rec[abbr] ? fillRecognized : fillOther;
    }

    function selectAbbr(abbr, pathSel) {
      hideMobMapTooltip();
      if (window._hapMobMapSelectedAbbr === abbr) {
        window._hapMobMapSelectedAbbr = null;
      } else {
        window._hapMobMapSelectedAbbr = abbr;
      }
      pathSel.classed('is-selected', function (d2) {
        return fipsIdToAbbrReg(d2.id) === window._hapMobMapSelectedAbbr;
      });
      updateMobMapSelection(window._hapMobMapSelectedAbbr, rec, names);
    }

    var pathSel = svg
      .selectAll('path.hap-mob-map-state')
      .data(states)
      .enter()
      .append('path')
      .attr('class', 'hap-mob-map-state')
      .attr('data-state', function (d) {
        return fipsIdToAbbrReg(d.id);
      })
      .attr('d', path)
      .attr('fill', function (d) {
        return fillForAbbr(fipsIdToAbbrReg(d.id));
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 0.65)
      .attr('vector-effect', 'non-scaling-stroke')
      .attr('tabindex', '0')
      .attr('role', 'button')
      .attr('aria-label', function (d) {
        var a = fipsIdToAbbrReg(d.id);
        var nm = names[a] || a || 'State';
        return nm + (a && rec[a] ? ', in teal footprint' : ', not in teal footprint');
      })
      .on('click', function (event, d) {
        event.preventDefault();
        event.stopPropagation();
        var abbr = fipsIdToAbbrReg(d.id);
        if (!abbr) return;
        selectAbbr(abbr, svg.selectAll('path.hap-mob-map-state'));
      })
      .on('mouseenter', function (event, d) {
        var abbr = fipsIdToAbbrReg(d.id);
        if (abbr) showMobMapTooltip(abbr, event.clientX, event.clientY, rec);
      })
      .on('mousemove', function (event, d) {
        var abbr = fipsIdToAbbrReg(d.id);
        if (abbr) showMobMapTooltip(abbr, event.clientX, event.clientY, rec);
      })
      .on('mouseleave', hideMobMapTooltip)
      .on('touchstart', function (event, d) {
        var t = event.touches && event.touches[0];
        if (!t) return;
        var abbr = fipsIdToAbbrReg(d.id);
        if (abbr) showMobMapTooltip(abbr, t.clientX, t.clientY, rec);
      }, { passive: true })
      .on('focus', function (event, d) {
        var abbr = fipsIdToAbbrReg(d.id);
        if (!abbr) return;
        var r = this.getBoundingClientRect();
        showMobMapTooltip(abbr, r.left + r.width / 2, r.top + r.height / 2, rec);
      })
      .on('blur', hideMobMapTooltip)
      .on('keydown', function (event, d) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          var abbrK = fipsIdToAbbrReg(d.id);
          if (!abbrK) return;
          selectAbbr(abbrK, svg.selectAll('path.hap-mob-map-state'));
          return;
        }
        if (event.key !== 'Escape') return;
        hideMobMapTooltip();
        if (window._hapMobMapSelectedAbbr) {
          window._hapMobMapSelectedAbbr = null;
          svg.selectAll('path.hap-mob-map-state').classed('is-selected', false);
          updateMobMapSelection(null, rec, names);
        }
      });

    if (prefersReducedMotion()) {
      pathSel.style('opacity', 1);
    } else {
      pathSel
        .style('opacity', 0)
        .transition()
        .delay(function (d, i) {
          return Math.min(i * 6, 700);
        })
        .duration(280)
        .style('opacity', 1);
    }

    var pinned = window._hapMobMapSelectedAbbr;
    if (pinned) {
      pathSel.classed('is-selected', function (d2) {
        return fipsIdToAbbrReg(d2.id) === pinned;
      });
      updateMobMapSelection(pinned, rec, names);
    } else {
      updateMobMapSelection(null, rec, names);
    }

    svg
      .append('path')
      .datum(topojson.mesh(usData, usData.objects.states, function (a, b) {
        return a !== b;
      }))
      .attr('class', 'hap-reg-map-mesh')
      .attr('fill', 'none')
      .attr('pointer-events', 'none')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 0.55)
      .attr('stroke-linejoin', 'round')
      .attr('d', path);

    mapDrawn = true;
  }

  function scheduleMobMapRedraw() {
    if (window._hapMobMapRedrawTimer) clearTimeout(window._hapMobMapRedrawTimer);
    window._hapMobMapRedrawTimer = setTimeout(function () {
      drawMobRegulatoryMap();
    }, 120);
  }

  function initMobRegulatoryMap() {
    updateMobMapLegend();
    drawMobRegulatoryMap();
    var wrap = document.getElementById('hap-mob-map-stage-wrap');
    if (wrap && typeof ResizeObserver !== 'undefined') {
      if (window._hapMobMapRO) {
        try {
          window._hapMobMapRO.disconnect();
        } catch (e0) {
          /* ignore */
        }
      }
      window._hapMobMapRO = new ResizeObserver(scheduleMobMapRedraw);
      window._hapMobMapRO.observe(wrap);
    }
    if (!window._hapMobMapResizeWired) {
      window._hapMobMapResizeWired = true;
      window.addEventListener('resize', scheduleMobMapRedraw);
    }
  }

  function onMobMapEscape(e) {
    if (e.key !== 'Escape') return;
    if (!window._hapMobMapSelectedAbbr) return;
    window._hapMobMapSelectedAbbr = null;
    var stage = document.getElementById('hap-mob-map-stage');
    if (stage && typeof d3 !== 'undefined') {
      d3.select(stage).selectAll('path.hap-mob-map-state').classed('is-selected', false);
    }
    hideMobMapTooltip();
    updateMobMapSelection(null, {}, window.HAP_REG_MAP_STATE_NAMES || {});
  }

  function tabIconSvg(which) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(ns, 'path');
    if (which === 'overview') {
      p.setAttribute('d', 'M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z');
    } else if (which === 'stats') {
      p.setAttribute('d', 'M5 19h2v-8H5zm6 0h2V5h-2zm6 0h2v-5h-2z');
    } else if (which === 'priorities') {
      p.setAttribute('d', 'M7 3h10v2H7zm0 6h10v2H7zm0 6h10v2H7zm0 6h10v2H7z');
    } else if (which === 'benchmark') {
      p.setAttribute(
        'd',
        'M12 2C8 2 5 5 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-4-3-7-7-7m0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5'
      );
    } else {
      p.setAttribute('d', 'M6 3h12v18H6zm2 2v14h8V5zm2 2h4v2h-4zm0 4h4v2h-4zm0 4h2v2h-2z');
    }
    svg.appendChild(p);
    return svg;
  }

  function buildTabBar() {
    var bar = dom.tabBar;
    while (bar.firstChild) bar.removeChild(bar.firstChild);
    TAB_META.forEach(function (meta) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hap-mob-tab' + (meta.id === currentTab ? ' is-active' : '');
      btn.setAttribute('data-tab', meta.id);
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', meta.id === currentTab ? 'true' : 'false');
      btn.setAttribute('aria-label', meta.label);
      btn.appendChild(tabIconSvg(meta.id));
      var lab = document.createElement('span');
      setText(lab, meta.label);
      btn.appendChild(lab);
      bar.appendChild(btn);
    });
  }

  function buildPanels(data) {
    var content = dom.content;
    while (content.firstChild) content.removeChild(content.firstChild);
    var sourceById = getRegAdvSourcesById();

    TAB_META.forEach(function (meta, idx) {
      var panel = document.createElement('section');
      panel.className = 'hap-mob-panel' + (idx === 0 ? ' is-active' : '');
      panel.setAttribute('data-tab', meta.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-hidden', idx === 0 ? 'false' : 'true');

      var scroll = document.createElement('div');
      scroll.className = 'hap-mob-scroll';

      if (meta.id === 'overview') {
        var lc = data.letterContext || {};
        scroll.appendChild(elOverview(data, lc, sourceById));
      } else if (meta.id === 'stats') {
        scroll.appendChild(elStats(data, sourceById));
      } else if (meta.id === 'priorities') {
        scroll.appendChild(elPriorities(data));
      } else if (meta.id === 'benchmark') {
        scroll.appendChild(elBenchmark(data, sourceById));
      } else {
        scroll.appendChild(elReceipts(data, sourceById));
      }

      panel.appendChild(scroll);
      content.appendChild(panel);
    });

    dom.panels = content.querySelectorAll('.hap-mob-panel');
    dom.tabBtns = dom.tabBar.querySelectorAll('.hap-mob-tab');
  }

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  function elOverview(data, lc) {
    var frag = document.createDocumentFragment();
    var wrap = el('div', '');
    var eyebrow = el('p', 'hap-mob-eyebrow');
    setText(eyebrow, 'April 16, 2026 · DOH letter');
    var date = el('p', 'hap-mob-hero-date');
    setText(date, (lc.dateDisplay || '') + ' · Pennsylvania hospitals');
    var h1 = el('h1', 'hap-mob-h1');
    setText(h1, (data.hero && data.hero.headline) || 'Regulatory advocacy');
    var lead = el('p', 'hap-mob-lead');
    setText(lead, heroSubShort(data.hero && data.hero.sub));

    var aag = el('div', 'hap-mob-aag');
    (data.atAGlance || []).forEach(function (it) {
      var card = el('div', 'hap-mob-aag-card hap-mob-anim');
      var icw = el('div', 'hap-mob-aag-ic-wrap');
      icw.appendChild(createDataIconSvg(it.iconKind, 'hap-mob-aag-ic'));
      var txt = el('div', '');
      var t = el('div', 'hap-mob-aag-title');
      setText(t, it.title || '');
      var ln = el('div', 'hap-mob-aag-line');
      setText(ln, it.line || '');
      txt.appendChild(t);
      txt.appendChild(ln);
      card.appendChild(icw);
      card.appendChild(txt);
      aag.appendChild(card);
    });

    var kpiGrid = el('div', 'hap-mob-kpi-grid');
    (data.heroKpis || []).forEach(function (k) {
      var card = el('article', 'hap-mob-kpi hap-mob-anim ' + topicKpiClass(k.topic, k.sentiment));
      var val = el('div', 'hap-mob-kpi-value');
      setText(val, k.value || '');
      var lab = el('div', 'hap-mob-kpi-label');
      setText(lab, k.label || '');
      var g = el('p', 'hap-mob-kpi-glance');
      setText(g, k.glance || '');
      var src = sourceById[k.sourceId];
      var sn = el('div', 'hap-mob-kpi-src');
      if (src && src.url) {
        var a = document.createElement('a');
        a.href = src.url;
        a.rel = 'noopener noreferrer';
        setText(a, 'Open source');
        sn.appendChild(a);
      }
      card.appendChild(val);
      card.appendChild(lab);
      card.appendChild(g);
      if (sn.firstChild) card.appendChild(sn);
      kpiGrid.appendChild(card);
    });

    wrap.appendChild(eyebrow);
    wrap.appendChild(date);
    wrap.appendChild(h1);
    wrap.appendChild(lead);
    wrap.appendChild(aag);
    wrap.appendChild(kpiGrid);
    frag.appendChild(wrap);
    return frag;
  }

  function elStats(data, sourceById) {
    var wrap = el('div', '');
    var h = el('h2', 'hap-mob-section-title');
    setText(h, 'Pennsylvania context');
    var lead = el('p', 'hap-mob-section-lead');
    setText(
      lead,
      'Public figures from HAP releases, PHC4, Pa. Code, and membership—each card links out. Not the three letter “asks”; those are on Asks.'
    );
    var list = el('div', 'hap-mob-stat-list');
    renderMobStatBand(list, data.statBand || [], sourceById);
    wrap.appendChild(h);
    wrap.appendChild(lead);
    wrap.appendChild(list);
    return wrap;
  }

  function elPriorities(data) {
    var wrap = el('div', '');
    var h = el('h2', 'hap-mob-section-title');
    setText(h, 'Three requests');
    var lead = el('p', 'hap-mob-section-lead');
    setText(lead, 'What HAP asked DOH to fix this year—in plain language.');
    wrap.appendChild(h);
    wrap.appendChild(lead);
    (data.priorities || []).forEach(function (pr) {
      var card = el('article', 'hap-mob-priority hap-mob-anim');
      var top = el('div', 'hap-mob-priority-top');
      var badge = el('div', 'hap-mob-priority-badge');
      setText(badge, (pr.eyebrow || '') + ' · ' + (pr.badge || ''));
      var title = el('h3', 'hap-mob-priority-h');
      setText(title, pr.title || '');
      top.appendChild(badge);
      top.appendChild(title);
      var ask = el('p', 'hap-mob-priority-ask');
      setText(ask, pr.deckPlainAsk || pr.tagline || '');
      var rec = el('div', 'hap-mob-priority-rec');
      var rl = el('div', 'hap-mob-priority-rec-label');
      setText(rl, pr.recLabel || 'What HAP wants DOH to do');
      var rt = el('div', 'hap-mob-priority-rec-text');
      setText(rt, pr.recommendation || '');
      rec.appendChild(rl);
      rec.appendChild(rt);
      card.appendChild(top);
      card.appendChild(ask);
      card.appendChild(rec);
      if (pr.callout && pr.callout.text) {
        var co = el('div', 'hap-mob-callout');
        var strong = document.createElement('strong');
        setText(strong, pr.callout.label || 'Why it matters');
        co.appendChild(strong);
        co.appendChild(document.createTextNode(pr.callout.text));
        card.appendChild(co);
      }
      wrap.appendChild(card);
    });
    return wrap;
  }

  function elBenchmark(data, sourceById) {
    var wrap = el('div', '');
    var h = el('h2', 'hap-mob-section-title');
    setText(h, 'PA vs US · Map');
    var lead = el('p', 'hap-mob-section-lead');
    setText(lead, 'State rules compared to Medicare-style practice, then the national snapshot.');
    wrap.appendChild(h);
    wrap.appendChild(lead);

    (data.compareRows || []).forEach(function (row) {
      var card = el('div', 'hap-mob-compare-card hap-mob-anim');
      var issue = el('div', 'hap-mob-compare-issue');
      issue.appendChild(createDataIconSvg(row.issueIcon, 'hap-mob-compare-ic'));
      var it = el('span', '');
      setText(it, row.issue || '');
      issue.appendChild(it);
      card.appendChild(issue);
      ['pa', 'federal', 'hap'].forEach(function (key) {
        var lab = key === 'pa' ? 'Pennsylvania' : key === 'federal' ? 'Federal / national' : 'HAP ask';
        var r = el('div', 'hap-mob-compare-row');
        var k = el('div', 'hap-mob-compare-k');
        setText(k, lab);
        var v = document.createElement('div');
        setText(v, row[key] || '');
        r.appendChild(k);
        r.appendChild(v);
        card.appendChild(r);
      });
      wrap.appendChild(card);
    });

    var sc = data.statesCallout || {};
    var hero = el('div', 'hap-mob-map-hero hap-mob-anim');
    var big = el('div', 'hap-mob-map-hero-num');
    setText(big, sc.big || '');
    var bl = el('div', 'hap-mob-map-hero-label');
    setText(bl, sc.lead || '');
    var body = el('p', 'hap-mob-map-hero-body');
    setText(body, sc.body || '');
    hero.appendChild(big);
    hero.appendChild(bl);
    hero.appendChild(body);
    if (sc.sourceId && sourceById[sc.sourceId] && sourceById[sc.sourceId].url) {
      var a = document.createElement('a');
      a.href = sourceById[sc.sourceId].url;
      a.rel = 'noopener noreferrer';
      a.style.cssText = 'display:inline-block;margin-top:10px;font-weight:600;color:var(--hap-brand-primary,#0072bc);';
      setText(a, 'Methodology (TJC)');
      hero.appendChild(a);
    }
    wrap.appendChild(hero);

    var mapBox = el('div', 'hap-mob-map-wrap hap-mob-anim');
    var tip = el('div', 'hap-mob-map-tooltip');
    tip.id = 'hap-mob-map-tooltip';
    tip.setAttribute('role', 'status');
    var sw = el('div', 'hap-mob-map-stage-wrap');
    sw.id = 'hap-mob-map-stage-wrap';
    var stage = el('div', '');
    stage.id = 'hap-mob-map-stage';
    sw.appendChild(stage);
    var leg = el('div', 'hap-mob-map-legend');
    leg.id = 'hap-mob-map-legend';
    var sel = el('div', 'hap-mob-map-selection');
    sel.id = 'hap-mob-map-selection';
    sel.hidden = true;
    mapBox.appendChild(tip);
    mapBox.appendChild(sw);
    mapBox.appendChild(leg);
    mapBox.appendChild(sel);
    wrap.appendChild(mapBox);

    return wrap;
  }

  function elReceipts(data, sourceById) {
    var wrap = el('div', '');
    var h = el('h2', 'hap-mob-section-title');
    setText(h, 'Letter · Facts · Sources');
    wrap.appendChild(h);

    (data.letterQuotes || []).forEach(function (q) {
      var box = el('blockquote', 'hap-mob-quote hap-mob-anim');
      var p = el('p', '');
      setText(p, q.text || '');
      box.appendChild(p);
      wrap.appendChild(box);
    });

    var ih = el('h3', 'hap-mob-section-title');
    ih.style.fontSize = '17px';
    ih.style.marginTop = '8px';
    setText(ih, 'Verified anchors');
    wrap.appendChild(ih);

    (data.impactTiles || []).forEach(function (t) {
      var row = el('div', 'hap-mob-impact-row hap-mob-anim');
      var allowedDots = { brand: 1, policy: 1, access: 1, finance: 1 };
      var topicDot = allowedDots[t.iconTopic] ? t.iconTopic : 'policy';
      var dot = el('span', 'hap-mob-impact-dot hap-mob-impact-dot--' + topicDot);
      var txt = el('div', '');
      var title = el('div', 'hap-mob-impact-title');
      setText(title, t.title || '');
      var body = el('div', 'hap-mob-impact-body');
      setText(body, t.body || '');
      var src = sourceById[t.sourceId];
      if (src && src.url) {
        var a = document.createElement('a');
        a.href = src.url;
        a.rel = 'noopener noreferrer';
        a.style.cssText = 'display:block;margin-top:6px;font-weight:600;font-size:12px;color:var(--hap-brand-primary,#0072bc);';
        setText(a, 'Source');
        body.appendChild(a);
      }
      txt.appendChild(title);
      txt.appendChild(body);
      row.appendChild(dot);
      row.appendChild(txt);
      wrap.appendChild(row);
    });

    var sh = el('h3', 'hap-mob-section-title');
    sh.style.fontSize = '17px';
    sh.style.marginTop = '12px';
    setText(sh, 'Sources');
    wrap.appendChild(sh);
    var srcList = el('div', '');
    renderSources(srcList, data.sources || []);
    wrap.appendChild(srcList);

    return wrap;
  }

  function switchTab(tab) {
    if (tab === currentTab) return;
    var tabIndex = TABS.indexOf(tab);
    var currentIndex = TABS.indexOf(currentTab);
    if (tabIndex === -1) return;

    previousTab = currentTab;
    currentTab = tab;
    var goingForward = tabIndex > currentIndex;
    var exitClass = goingForward ? 'is-exit-left' : 'is-exit-right';

    dom.tabBtns.forEach(function (btn) {
      var on = btn.getAttribute('data-tab') === tab;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    dom.panels.forEach(function (panel) {
      var panelTab = panel.getAttribute('data-tab');
      if (panelTab === tab) {
        panel.classList.remove('is-exit-left', 'is-exit-right');
        panel.classList.add('is-active');
        panel.setAttribute('aria-hidden', 'false');
        var sc = panel.querySelector('.hap-mob-scroll');
        if (sc) sc.scrollTop = 0;
      } else if (panelTab === previousTab) {
        panel.classList.remove('is-active');
        panel.classList.add(exitClass);
        panel.setAttribute('aria-hidden', 'true');
      } else {
        panel.classList.remove('is-active', 'is-exit-left', 'is-exit-right');
        panel.setAttribute('aria-hidden', 'true');
      }
    });

    triggerPanelAnim(tab);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(6);
      } catch (e1) {
        /* ignore */
      }
    }

    if (tab === 'benchmark' && !mapDrawn) {
      window.requestAnimationFrame(function () {
        window.setTimeout(initMobRegulatoryMap, 80);
      });
    } else if (tab === 'benchmark' && mapDrawn) {
      scheduleMobMapRedraw();
    }

    if (tab === 'stats' && !statsBanWired) {
      statsBanWired = true;
      attachMobBanObservers();
    }
  }

  function triggerPanelAnim(tab) {
    var panel = dom.content.querySelector('.hap-mob-panel[data-tab="' + tab + '"]');
    if (!panel) return;
    var items = panel.querySelectorAll('.hap-mob-anim');
    items.forEach(function (el) {
      el.classList.remove('is-visible');
    });
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        items.forEach(function (el, i) {
          el.style.transitionDelay = prefersReducedMotion() ? '0ms' : i * 40 + 'ms';
          el.classList.add('is-visible');
        });
      });
    });
  }

  function initTabs() {
    dom.tabBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.hap-mob-tab');
      if (!btn) return;
      var t = btn.getAttribute('data-tab');
      if (t && t !== currentTab) switchTab(t);
    });
  }

  function initSwipe() {
    dom.content.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.content.addEventListener('touchmove', onTouchMove, { passive: true });
    dom.content.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  function onTouchStart(e) {
    var touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    isSwiping = false;
  }

  function onTouchMove(e) {
    var touch = e.touches[0];
    var dx = touch.clientX - touchStartX;
    var dy = touch.clientY - touchStartY;
    if (!isSwiping && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.45) {
      isSwiping = true;
    }
  }

  function onTouchEnd(e) {
    if (!isSwiping) return;
    var touch = e.changedTouches[0];
    var dx = touch.clientX - touchStartX;
    var t1 = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    var dt = Math.max(1, t1 - touchStartTime);
    var velocity = Math.abs(dx) / dt;
    var minSwipe = 44;
    var fastSwipe = velocity > 0.42 && Math.abs(dx) > 24;
    if (Math.abs(dx) < minSwipe && !fastSwipe) {
      isSwiping = false;
      return;
    }
    var idx = TABS.indexOf(currentTab);
    if (dx < 0 && idx < TABS.length - 1) {
      switchTab(TABS[idx + 1]);
    } else if (dx > 0 && idx > 0) {
      switchTab(TABS[idx - 1]);
    }
    isSwiping = false;
  }

  function initShare() {
    var btn = document.getElementById('hap-mob-btn-share');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var url = window.location.href;
      var title = 'HAP Regulatory Advocacy 2026';
      var text = 'Pennsylvania hospital regulatory brief — April 16, 2026 DOH letter context.';
      if (navigator.share) {
        navigator.share({ title: title, text: text, url: url }).catch(function () {});
      } else {
        try {
          window.prompt('Copy link', url);
        } catch (e2) {
          /* ignore */
        }
      }
    });
  }

  function cacheDom() {
    dom.content = document.getElementById('hap-mob-content');
    dom.tabBar = document.getElementById('hap-mob-tab-bar');
  }

  function init() {
    var data = window.HAP_REGULATORY_ADVOCACY_2026;
    if (!data) return;
    cacheDom();
    if (!dom.content || !dom.tabBar) return;

    buildTabBar();
    buildPanels(data);
    cacheDom();
    dom.panels = dom.content.querySelectorAll('.hap-mob-panel');
    dom.tabBtns = dom.tabBar.querySelectorAll('.hap-mob-tab');

    initTabs();
    initSwipe();
    initShare();
    document.addEventListener('keydown', onMobMapEscape);

    window.requestAnimationFrame(function () {
      triggerPanelAnim('overview');
    });

    var hint = document.getElementById('hap-mob-swipe-hint');
    if (hint && !prefersReducedMotion()) {
      window.setTimeout(function () {
        hint.style.opacity = '0';
        hint.style.transition = 'opacity 0.6s ease';
      }, 4200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
