/**
 * HAP Regulatory Advocacy 2026 — safe DOM rendering + scroll interactions.
 * Expects window.HAP_REGULATORY_ADVOCACY_2026 from facts.js.
 */
(function () {
  'use strict';

  function setText(el, text) {
    if (!el) return;
    el.textContent = text;
  }

  function setMultilineText(el, lines) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
    if (lines == null) return;
    if (typeof lines === 'string') {
      el.appendChild(document.createTextNode(lines));
      return;
    }
    lines.forEach(function (line, i) {
      if (i) el.appendChild(document.createElement('br'));
      el.appendChild(document.createTextNode(line));
    });
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

  /**
   * Small icons for priority deck cards and large wrap for article headers.
   * kinds: facilities (buildings), workforce (people), policydoc (rules file); legacy build/badge/surgery map to those.
   */
  function createDeckIconSvg(kind, sizeClass) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', sizeClass || 'hap-reg-deck-ic');
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

  /**
   * Icons for KPIs, stat band, glossary, compare table, and “at a glance” — static paths only (safe DOM).
   * Reuses deck icons for facilities / workforce / policydoc.
   */
  function createDataIconSvg(kind, className) {
    var k = (kind || 'neutral').toString();
    if (k === 'build') k = 'facilities';
    if (k === 'badge') k = 'workforce';
    if (k === 'surgery') k = 'medical';
    if (k === 'facilities' || k === 'workforce' || k === 'policydoc') {
      return createDeckIconSvg(k, className || 'hap-reg-data-ic');
    }

    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', className || 'hap-reg-data-ic');
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
    } else if (k === 'shield') {
      path(
        'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v5h-2V7zm0 7h2v2h-2v-2z'
      );
    } else if (k === 'blueprint') {
      path('M22 9V7h-2V5H2v14h18v-2h2v-2h2v-6h-2zm0 8H4V7h16v10h2v2zm-8-6h-2v2h2v-2zm2 4h-6v2h6v-2zm-6-8h6v2H10V9zm8 0h2v2h-2V9zm0 4h2v2h-2v-2z');
    } else if (k === 'stethoscope') {
      path(
        'M19 8h-2c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-6.08c3.39-.49 6-3.39 6-6.92zm-7-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm7 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z'
      );
    } else if (k === 'medical') {
      path(
        'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z'
      );
    } else if (k === 'chart') {
      path('M5 19h2v-6H5v6zm6 0h2v-9h-2v9zm6 0h2v-3h-2v3z');
    } else if (k === 'scroll') {
      path(
        'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2zm0 18H6V4h12v16zM8 8h8v2H8V8zm0 4h8v2H8v-4zm0 4h5v2H8v-2z'
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
    } else if (k === 'givingLove') {
      path(
        'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
      );
    } else if (k === 'marketDown') {
      var axis = document.createElementNS(ns, 'path');
      axis.setAttribute('d', 'M3 19.5h18');
      axis.setAttribute('fill', 'none');
      axis.setAttribute('stroke', 'currentColor');
      axis.setAttribute('stroke-width', '1.1');
      axis.setAttribute('stroke-linecap', 'round');
      axis.setAttribute('opacity', '0.3');
      svg.appendChild(axis);
      var trend = document.createElementNS(ns, 'path');
      trend.setAttribute('d', 'M3 6L8 9l5 2l5 3l3 3');
      trend.setAttribute('fill', 'none');
      trend.setAttribute('stroke', 'currentColor');
      trend.setAttribute('stroke-width', '2.35');
      trend.setAttribute('stroke-linecap', 'round');
      trend.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(trend);
      return svg;
    } else if (k === 'lawBook') {
      path(
        'M18 2H8a2 2 0 0 0-2 2v16h12V4a2 2 0 0 0-2-2zm-1 16H9V4h8v14zM11 7h4v1.5h-4V7zm0 3h4v1.5h-4V10zm0 3h3v1.5h-3V13zM4 4h2v16H4V4z'
      );
    } else if (k === 'renewal') {
      path(
        'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z'
      );
      path('M17 3v3h3M18.5 4.5L21 2M18.5 4.5L16 2');
    } else if (k === 'hapMark') {
      path(
        'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z'
      );
    } else {
      path('M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5v5h5v2h-5v5h-2v-5H6v-2h5V7h2z');
    }
    return svg;
  }

  /**
   * Stat-band only: rounded-stroke “system” icons + unique data attr for glass styling.
   * Paths are simplified Lucide-style geometry (MIT-compatible); static attributes only.
   */
  function createStatBandIconSvg(kind, className, bandId) {
    var k = (kind || 'neutral').toString();
    if (k === 'economy') k = 'dollar';
    var kindClass = k.replace(/[^a-z0-9-]/gi, '') || 'neutral';

    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', (className || 'hap-reg-stat-ic') + ' hap-reg-stat-ic--' + kindClass);
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

  function topicClasses(topic, sentiment) {
    var t = topic || 'neutral';
    var s = sentiment || 'neutral';
    return 'hap-reg-topic-' + t + ' hap-reg-sentiment-' + s;
  }

  /**
   * Visual accent for executive stat cards (maps to dashboard.css modifiers).
   * @param {string} id — statBand row id (e.g. sb-econ)
   * @returns {string} CSS class suffix
   */
  function statBandAccentClass(id) {
    if (id === 'sb-econ') return 'hap-reg-stat-item--finance';
    if (id === 'sb-jobs') return 'hap-reg-stat-item--jobs';
    if (id === 'sb-red') return 'hap-reg-stat-item--danger';
    if (id === 'sb-phc4') return 'hap-reg-stat-item--policy';
    if (id === 'sb-members') return 'hap-reg-stat-item--members';
    if (id === 'sb-1982') return 'hap-reg-stat-item--code';
    return 'hap-reg-stat-item--default';
  }

  function renderStatBand(container, items, sourceById) {
    if (!container) return;
    while (container.firstChild) container.removeChild(container.firstChild);
    items.forEach(function (k) {
      var src = sourceById[k.sourceId];
      var wrap = document.createElement('div');
      wrap.className = 'hap-reg-stat-item ' + statBandAccentClass(k.id);

      var icWrap = document.createElement('div');
      var icKind = (k.iconKind || 'neutral').toString().replace(/[^a-z0-9-]/gi, '') || 'neutral';
      icWrap.className = 'hap-reg-stat-icon-wrap hap-reg-stat-icon-wrap--' + icKind;
      icWrap.setAttribute('aria-hidden', 'true');
      icWrap.appendChild(createStatBandIconSvg(k.iconKind || 'neutral', 'hap-reg-stat-ic', k.id));

      var value = document.createElement('div');
      value.className = 'hap-reg-stat-value hap-reg-ban-target';
      value.id = k.id + '-value';
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
      label.className = 'hap-reg-stat-label';
      setText(label, k.label);

      var sn = document.createElement('div');
      sn.className = 'hap-reg-stat-source';
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
        cap.className = 'hap-reg-stat-caption';
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

  function attachBanObservers() {
    var nodes = document.querySelectorAll('.hap-reg-stat-item');
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
          if (!el || el.getAttribute('data-ban-state') === 'done' || el.getAttribute('data-ban-state') === 'running') return;
          runBanCountUp(el, spec, fin);
        });
      },
      { root: null, threshold: 0.32, rootMargin: '0px 0px -8% 0px' }
    );
    Array.prototype.forEach.call(nodes, function (c) {
      io.observe(c);
    });
  }

  function initHero() {
    var data = window.HAP_REGULATORY_ADVOCACY_2026;
    if (!data || !data.hero) return;
    setText(document.getElementById('overview-title'), data.hero.headline);
    var row = document.getElementById('js-hero-ctas');
    if (!row) return;
    while (row.firstChild) row.removeChild(row.firstChild);
    data.hero.ctas.forEach(function (c, i) {
      var a = document.createElement('a');
      a.href = c.href;
      a.className = 'hap-reg-pill';
      var num = document.createElement('span');
      num.className = 'hap-reg-pill-num';
      num.setAttribute('aria-hidden', 'true');
      setText(num, String(i + 1));
      var lab = document.createElement('span');
      lab.className = 'hap-reg-pill-label';
      setText(lab, c.label);
      a.appendChild(num);
      if (c.pillIcon) {
        var pic = document.createElement('span');
        pic.className = 'hap-reg-pill-icon';
        pic.setAttribute('aria-hidden', 'true');
        pic.appendChild(createDataIconSvg(c.pillIcon, 'hap-reg-pill-ic'));
        a.appendChild(pic);
      }
      a.appendChild(lab);
      a.setAttribute('aria-label', 'Jump to priority: ' + c.label);
      row.appendChild(a);
    });
  }

  function renderAtAGlance(container, items) {
    if (!container || !items || !items.length) return;
    while (container.firstChild) container.removeChild(container.firstChild);
    var head = document.createElement('p');
    head.className = 'hap-reg-aag-kicker';
    setText(head, 'At a glance — three letter themes for DOH');
    container.appendChild(head);
    var grid = document.createElement('div');
    grid.className = 'hap-reg-aag-grid';
    items.forEach(function (it) {
      var cell = document.createElement('div');
      cell.className = 'hap-reg-aag-cell';
      var ic = document.createElement('div');
      ic.className = 'hap-reg-aag-icon-wrap';
      ic.setAttribute('aria-hidden', 'true');
      ic.appendChild(createDataIconSvg(it.iconKind || 'neutral', 'hap-reg-aag-ic'));
      var text = document.createElement('div');
      text.className = 'hap-reg-aag-text';
      var t = document.createElement('span');
      t.className = 'hap-reg-aag-title';
      setText(t, it.title);
      var line = document.createElement('p');
      line.className = 'hap-reg-aag-line';
      setText(line, it.line);
      text.appendChild(t);
      text.appendChild(line);
      cell.appendChild(ic);
      cell.appendChild(text);
      grid.appendChild(cell);
    });
    container.appendChild(grid);
  }

  function renderPriorityDeck(container, priorities) {
    if (!container) return;
    while (container.firstChild) container.removeChild(container.firstChild);
    priorities.forEach(function (p) {
      var topic = p.topic || 'policy';
      var a = document.createElement('a');
      a.className = 'hap-reg-deck-card hap-reg-topic-' + topic + ' hap-reg-hover-lift';
      a.href = '#' + p.id;
      var ariaParts = [
        (p.cardNum || p.deckKicker || 'Priority') + ': ' + (p.deckTitle || ''),
        p.deckPlainAsk || p.deckLine || ''
      ];
      a.setAttribute('aria-label', ariaParts.join('. ') + ' Opens the full brief with sources below.');

      var topRow = document.createElement('div');
      topRow.className = 'hap-reg-deck-top';
      var numEl = document.createElement('span');
      numEl.className = 'hap-reg-deck-num';
      numEl.setAttribute('aria-hidden', 'true');
      setText(numEl, p.cardNum || '0');
      var icWrap = document.createElement('span');
      icWrap.className = 'hap-reg-deck-ic-wrap';
      icWrap.setAttribute('aria-hidden', 'true');
      icWrap.appendChild(createDeckIconSvg(p.deckIcon || 'workforce'));
      topRow.appendChild(numEl);
      topRow.appendChild(icWrap);

      var ban = document.createElement('div');
      ban.className = 'hap-reg-deck-ban';
      var banStrong = document.createElement('span');
      banStrong.className = 'hap-reg-deck-ban-strong';
      setText(banStrong, p.deckBan);
      ban.appendChild(banStrong);
      if (p.deckHandleSub) {
        var sub = document.createElement('p');
        sub.className = 'hap-reg-deck-handle-sub';
        setText(sub, p.deckHandleSub);
        ban.appendChild(sub);
      }
      var t = document.createElement('div');
      t.className = 'hap-reg-deck-title';
      setText(t, p.deckTitle);
      a.appendChild(topRow);
      a.appendChild(ban);
      a.appendChild(t);
      if (p.deckPlainAsk) {
        var plain = document.createElement('p');
        plain.className = 'hap-reg-deck-plain';
        setText(plain, p.deckPlainAsk);
        a.appendChild(plain);
      }
      var line = document.createElement('div');
      line.className = 'hap-reg-deck-line';
      setText(line, p.deckLine);
      var go = document.createElement('span');
      go.className = 'hap-reg-deck-go';
      setText(go, 'Open brief + sources');
      a.appendChild(line);
      a.appendChild(go);
      container.appendChild(a);
    });
  }

  /**
   * Fade/slide priority brief cards into view once (respects prefers-reduced-motion).
   *
   * @param {HTMLElement|null} root — #js-priority-articles
   */
  function wirePriorityBriefReveal(root) {
    if (!root) return;
    var cards = root.querySelectorAll('.hap-reg-pc-showcase');
    function reveal(el) {
      el.classList.add('is-revealed');
    }
    if (!cards.length) return;
    if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
      cards.forEach(reveal);
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.07, rootMargin: '0px 0px -6% 0px' }
    );
    cards.forEach(function (c) {
      io.observe(c);
    });
  }

  /**
   * Priority brief cards: badge + title, lede (deckPlainAsk), optional context (tagline),
   * friction block, outcome strip, evidence tiles, then disclosure for letter + full ask.
   */
  function renderPriorityArticles(container, priorities, sourceById) {
    if (!container) return;
    while (container.firstChild) container.removeChild(container.firstChild);
    priorities.forEach(function (p) {
      var topic = p.topic || 'policy';
      var art = document.createElement('article');
      art.className =
        'hap-reg-priority-card hap-reg-pc-showcase hap-reg-pc-article hap-reg-topic-' + topic;
      art.setAttribute('aria-labelledby', p.id + '-title');

      var head = document.createElement('div');
      head.className = 'hap-reg-pc-head';
      head.id = p.id;
      var num = document.createElement('div');
      num.className = 'hap-reg-pc-number';
      num.setAttribute('aria-hidden', 'true');
      setText(num, p.cardNum);
      var iconWrap = document.createElement('div');
      iconWrap.className = 'hap-reg-pc-icon-wrap hap-reg-pc-icon-wrap--' + topic;
      iconWrap.setAttribute('aria-hidden', 'true');
      iconWrap.appendChild(createDeckIconSvg(p.deckIcon || 'workforce', 'hap-reg-pc-ic'));
      var headMain = document.createElement('div');
      headMain.className = 'hap-reg-pc-head-main';
      var badge = document.createElement('span');
      badge.className = 'hap-reg-pc-badge hap-reg-pc-badge--' + (p.badgeTone || 'blue');
      setText(badge, p.badge);
      var h3 = document.createElement('h3');
      h3.className = 'hap-reg-pc-h3';
      h3.id = p.id + '-title';
      setText(h3, p.title);
      var ledeText = (p.deckPlainAsk && String(p.deckPlainAsk).trim()) || (p.tagline && String(p.tagline).trim()) || '';
      var lede = document.createElement('p');
      lede.className = 'hap-reg-pc-lede';
      setText(lede, ledeText);
      headMain.appendChild(badge);
      headMain.appendChild(h3);
      headMain.appendChild(lede);
      var tagT = p.tagline ? String(p.tagline).trim() : '';
      if (tagT && tagT !== String(ledeText).trim()) {
        var ctx = document.createElement('p');
        ctx.className = 'hap-reg-pc-context';
        setText(ctx, tagT);
        headMain.appendChild(ctx);
      }
      head.appendChild(num);
      head.appendChild(iconWrap);
      head.appendChild(headMain);

      var core = document.createElement('div');
      core.className = 'hap-reg-pc-showcase-core';

      if (p.priorityStrip) {
        var prob = document.createElement('div');
        prob.className = 'hap-reg-pc-friction hap-reg-pc-problem hap-reg-pc-problem--' + topic;
        var plab = document.createElement('span');
        plab.className = 'hap-reg-pc-problem-label';
        setText(plab, p.stripLabel || 'Context');
        var ptxt = document.createElement('p');
        ptxt.className = 'hap-reg-pc-problem-text';
        setText(ptxt, p.priorityStrip);
        prob.appendChild(plab);
        prob.appendChild(ptxt);
        core.appendChild(prob);
      }

      if (p.deckLine) {
        var out = document.createElement('div');
        out.className = 'hap-reg-pc-outcome hap-reg-pc-outcome--' + topic;
        var oLab = document.createElement('span');
        oLab.className = 'hap-reg-pc-outcome-label';
        setText(oLab, 'Outcome');
        var oTxt = document.createElement('p');
        oTxt.className = 'hap-reg-pc-outcome-text';
        setText(oTxt, p.deckLine);
        out.appendChild(oLab);
        out.appendChild(oTxt);
        core.appendChild(out);
      }

      if (p.miniFacts && p.miniFacts.length) {
        var proof = document.createElement('div');
        proof.className = 'hap-reg-pc-proof hap-reg-pc-proof--showcase';
        var proofLab = document.createElement('div');
        proofLab.className = 'hap-reg-pc-proof-label';
        setText(proofLab, p.factsBandLabel || 'Evidence');
        proof.appendChild(proofLab);
        var facts = document.createElement('div');
        facts.className = 'hap-reg-pc-facts hap-reg-pc-facts--showcase';
        p.miniFacts.forEach(function (f) {
          var src = sourceById[f.sourceId];
          var box = document.createElement('div');
          box.className = 'hap-reg-fact-box hap-reg-fact-box--showcase';
          var fv = document.createElement('div');
          fv.className = 'hap-reg-fact-val';
          if (String(f.value).length > 6) fv.classList.add('hap-reg-fact-val--sm');
          setText(fv, f.value + (f.unit ? ' ' + f.unit : ''));
          var fl = document.createElement('div');
          fl.className = 'hap-reg-fact-label';
          setText(fl, f.label);
          var fs = document.createElement('div');
          fs.className = 'hap-reg-fact-src';
          setText(fs, f.linkLabel || (src ? src.shortTitle : 'Source'));
          box.appendChild(fv);
          box.appendChild(fl);
          box.appendChild(fs);
          facts.appendChild(box);
        });
        proof.appendChild(facts);
        core.appendChild(proof);
      }

      var det = document.createElement('details');
      det.className = 'hap-reg-pc-details';
      var sum = document.createElement('summary');
      sum.className = 'hap-reg-pc-details-sum';
      setText(sum, 'Letter excerpt · full ask · sources');
      det.appendChild(sum);

      var inner = document.createElement('div');
      inner.className = 'hap-reg-pc-details-body';

      (p.paragraphs || []).forEach(function (para) {
        var pr = document.createElement('p');
        pr.className = 'hap-reg-pc-prose';
        setText(pr, para);
        inner.appendChild(pr);
      });

      if (p.letterExcerpt) {
        var lbox = document.createElement('blockquote');
        lbox.className = 'hap-reg-pc-letter-box hap-reg-pc-letter-box--' + topic;
        var lq = document.createElement('p');
        lq.className = 'hap-reg-pc-letter-quote';
        setText(lq, p.letterExcerpt);
        var lcite = document.createElement('cite');
        lcite.className = 'hap-reg-pc-letter-cite';
        setText(lcite, 'HAP to DOH · April 16, 2026 (excerpt)');
        lbox.appendChild(lq);
        lbox.appendChild(lcite);
        inner.appendChild(lbox);
      }

      var rec = document.createElement('div');
      rec.className = 'hap-reg-pc-rec hap-reg-pc-rec--full hap-reg-pc-rec--' + topic;
      var rl = document.createElement('div');
      rl.className = 'hap-reg-pc-rec-label';
      setText(rl, p.recLabel || 'HAP request to DOH');
      var rp = document.createElement('p');
      rp.className = 'hap-reg-pc-rec-text';
      setText(rp, p.recommendation);
      rec.appendChild(rl);
      rec.appendChild(rp);
      inner.appendChild(rec);

      if (p.callout) {
        var aside = document.createElement('aside');
        aside.className = 'hap-reg-callout hap-reg-callout--' + (p.callout.tone || 'neutral');
        var ch = document.createElement('h4');
        ch.className = 'hap-reg-callout-title';
        setText(ch, p.callout.label);
        var cp = document.createElement('p');
        setText(cp, p.callout.text);
        aside.appendChild(ch);
        aside.appendChild(cp);
        var csrc = p.callout.sourceId ? sourceById[p.callout.sourceId] : null;
        if (csrc && csrc.url) {
          var a = document.createElement('a');
          a.href = csrc.url;
          a.rel = 'noopener noreferrer';
          a.className = 'hap-reg-cite-link';
          setText(a, 'Source: ' + csrc.shortTitle);
          aside.appendChild(a);
        }
        inner.appendChild(aside);
      }

      det.appendChild(inner);
      core.appendChild(det);

      art.appendChild(head);
      art.appendChild(core);
      container.appendChild(art);
    });
    wirePriorityBriefReveal(container);
  }

  /**
   * Build a compare table header cell with optional topic icon (safe DOM).
   *
   * @param {string} label
   * @param {string|null} iconKind — createDataIconSvg kind, or null
   * @param {string} thClass — extra class on th
   * @returns {HTMLTableCellElement}
   */
  function makeCompareTh(label, iconKind, thClass) {
    var th = document.createElement('th');
    th.className = 'hap-reg-compare-th ' + (thClass || '');
    var inner = document.createElement('div');
    inner.className = 'hap-reg-compare-th-inner';
    if (iconKind) {
      var icw = document.createElement('span');
      icw.className = 'hap-reg-compare-th-ic-wrap';
      icw.setAttribute('aria-hidden', 'true');
      icw.appendChild(createDataIconSvg(iconKind, 'hap-reg-compare-th-ic'));
      inner.appendChild(icw);
    }
    var lab = document.createElement('span');
    lab.className = 'hap-reg-compare-th-label';
    setText(lab, label);
    inner.appendChild(lab);
    th.appendChild(inner);
    return th;
  }

  function renderCompareSection(container, rows) {
    if (!container) return;
    while (container.firstChild) container.removeChild(container.firstChild);
    var wrap = document.createElement('div');
    wrap.className = 'hap-reg-compare-scroll';
    var table = document.createElement('table');
    table.className = 'hap-reg-compare-table';
    table.setAttribute('aria-label', 'Pennsylvania compared to Medicare and US patterns, with HAP asks');
    var thead = document.createElement('thead');
    var hr = document.createElement('tr');
    hr.appendChild(makeCompareTh('Topic', 'scale', 'hap-reg-compare-th--issue'));
    hr.appendChild(makeCompareTh('Pennsylvania', 'shield', 'hap-reg-compare-th--pa'));
    hr.appendChild(makeCompareTh('Medicare / US', 'scroll', 'hap-reg-compare-th--fed'));
    hr.appendChild(makeCompareTh('HAP ask', 'checkDouble', 'hap-reg-compare-th--hap'));
    thead.appendChild(hr);
    var tb = document.createElement('tbody');
    rows.forEach(function (r) {
      var tr = document.createElement('tr');
      var cells = [r.issue, r.pa, r.federal, r.hap];
      cells.forEach(function (cell, idx) {
        var td = document.createElement('td');
        if (idx === 0) {
          td.className = 'hap-reg-compare-issue';
          var issueWrap = document.createElement('span');
          issueWrap.className = 'hap-reg-compare-issue-inner';
          if (r.issueIcon) {
            var iw = document.createElement('span');
            iw.className = 'hap-reg-compare-issue-ic-wrap';
            iw.setAttribute('aria-hidden', 'true');
            iw.appendChild(createDataIconSvg(r.issueIcon, 'hap-reg-compare-issue-ic'));
            issueWrap.appendChild(iw);
          }
          var issueTxt = document.createElement('span');
          issueTxt.className = 'hap-reg-compare-issue-text';
          setText(issueTxt, cell);
          issueWrap.appendChild(issueTxt);
          td.appendChild(issueWrap);
        } else if (idx === 1) {
          td.className = 'hap-reg-compare-pa';
          var sp = document.createElement('span');
          sp.className = 'hap-reg-compare-cell';
          sp.appendChild(document.createTextNode(cell));
          td.appendChild(sp);
        } else if (idx === 2) {
          td.className = 'hap-reg-compare-fed';
          var sp2 = document.createElement('span');
          sp2.className = 'hap-reg-compare-cell';
          sp2.appendChild(document.createTextNode(cell));
          td.appendChild(sp2);
        } else {
          td.className = 'hap-reg-compare-hap';
          var sp3 = document.createElement('span');
          sp3.className = 'hap-reg-compare-cell';
          sp3.appendChild(document.createTextNode(cell));
          td.appendChild(sp3);
        }
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    table.appendChild(thead);
    table.appendChild(tb);
    wrap.appendChild(table);
    container.appendChild(wrap);
  }

  function renderStatesNote(el, block, sourceById) {
    if (!el || !block) return;
    while (el.firstChild) el.removeChild(el.firstChild);
    var big = document.createElement('div');
    big.className = 'hap-reg-states-big';
    big.setAttribute('aria-hidden', 'true');
    setText(big, block.big);
    var col = document.createElement('div');
    var lead = document.createElement('p');
    lead.className = 'hap-reg-states-lead';
    var strong = document.createElement('strong');
    setText(strong, block.lead);
    lead.appendChild(strong);
    var body = document.createElement('p');
    setText(body, block.body);
    col.appendChild(lead);
    col.appendChild(body);
    var citeBlock = document.createElement('div');
    citeBlock.className = 'hap-reg-states-cite-block';
    var src = sourceById[block.sourceId];
    if (src && src.url) {
      var cite = document.createElement('p');
      cite.className = 'hap-reg-states-cite';
      var a = document.createElement('a');
      a.href = src.url;
      a.rel = 'noopener noreferrer';
      setText(a, src.shortTitle);
      cite.appendChild(document.createTextNode('Primary: '));
      cite.appendChild(a);
      citeBlock.appendChild(cite);
    }
    var act = block.act60SourceId ? sourceById[block.act60SourceId] : null;
    if (act && act.url) {
      var cite2 = document.createElement('p');
      cite2.className = 'hap-reg-states-cite';
      var a2 = document.createElement('a');
      a2.href = act.url;
      a2.rel = 'noopener noreferrer';
      setText(a2, act.shortTitle);
      cite2.appendChild(document.createTextNode('Act 60 (2013) reference: '));
      cite2.appendChild(a2);
      citeBlock.appendChild(cite2);
    }
    var letter = block.letterSourceId ? sourceById[block.letterSourceId] : null;
    if (letter) {
      var cite3 = document.createElement('p');
      cite3.className = 'hap-reg-states-cite';
      if (letter.url) {
        var a3 = document.createElement('a');
        a3.href = letter.url;
        a3.rel = 'noopener noreferrer';
        setText(a3, letter.shortTitle);
        cite3.appendChild(a3);
      } else {
        setText(cite3, letter.shortTitle + ' — ' + (letter.accessedNote || ''));
      }
      citeBlock.appendChild(cite3);
    }
    col.appendChild(citeBlock);
    el.appendChild(big);
    el.appendChild(col);
  }

  function renderHeroKpis(container, items, sourceById) {
    if (!container || !items || !items.length) return;
    while (container.firstChild) container.removeChild(container.firstChild);
    items.forEach(function (k) {
      var topic = k.topic || 'access';
      var sent = k.sentiment || 'neutral';
      var card = document.createElement('div');
      card.className =
        'hap-reg-hero-kpi hap-reg-topic-' + topic + ' hap-reg-sentiment-' + sent + ' hap-reg-hover-lift';
      if (topic === 'risk' && sent === 'negative') {
        card.classList.add('hap-reg-hero-kpi--operating-loss');
      }
      if (k.id === 'hk-turn') {
        card.classList.add('hap-reg-hero-kpi--workforce-positive');
      }
      var top = document.createElement('div');
      top.className = 'hap-reg-hero-kpi-top';
      var icWrap = document.createElement('div');
      icWrap.className = 'hap-reg-hero-kpi-icon-wrap';
      icWrap.setAttribute('aria-hidden', 'true');
      icWrap.appendChild(createDataIconSvg(k.iconKind || 'neutral', 'hap-reg-hero-kpi-ic'));
      var glance = document.createElement('p');
      glance.className = 'hap-reg-hero-kpi-glance';
      setText(glance, k.glance || k.label);
      top.appendChild(icWrap);
      top.appendChild(glance);
      var val = document.createElement('div');
      val.className = 'hap-reg-hero-kpi-value';
      setText(val, k.value);
      var lab = document.createElement('div');
      lab.className = 'hap-reg-hero-kpi-label';
      setText(lab, k.label);
      var sub = document.createElement('div');
      sub.className = 'hap-reg-hero-kpi-sub';
      setText(sub, k.sub);
      var src = sourceById[k.sourceId];
      var foot = document.createElement('div');
      foot.className = 'hap-reg-hero-kpi-foot';
      if (src && src.url) {
        var a = document.createElement('a');
        a.href = src.url;
        a.rel = 'noopener noreferrer';
        setText(a, 'Source: ' + (src.publisher || 'Source'));
        foot.appendChild(a);
      } else if (src) {
        setText(foot, src.shortTitle || '');
      }
      card.appendChild(top);
      card.appendChild(val);
      card.appendChild(lab);
      card.appendChild(sub);
      card.appendChild(foot);
      container.appendChild(card);
    });
  }

  function renderGlossary(container, terms) {
    if (!container || !terms || !terms.length) return;
    while (container.firstChild) container.removeChild(container.firstChild);
    var wrap = document.createElement('div');
    wrap.className = 'hap-reg-glossary';
    wrap.setAttribute('role', 'region');
    var h = document.createElement('div');
    h.className = 'hap-reg-glossary-title';
    h.id = 'hap-reg-glossary-heading';
    wrap.setAttribute('aria-labelledby', 'hap-reg-glossary-heading');
    setText(h, 'Glossary');
    wrap.appendChild(h);
    var dl = document.createElement('dl');
    dl.className = 'hap-reg-glossary-dl';
    terms.forEach(function (t) {
      var dt = document.createElement('dt');
      dt.className = 'hap-reg-glossary-dt';
      if (t.iconKind) {
        var iw = document.createElement('span');
        iw.className = 'hap-reg-glossary-dt-ic';
        iw.setAttribute('aria-hidden', 'true');
        iw.appendChild(createDataIconSvg(t.iconKind, 'hap-reg-glossary-ic'));
        dt.appendChild(iw);
      }
      var termSpan = document.createElement('span');
      termSpan.className = 'hap-reg-glossary-term-text';
      setText(termSpan, t.term);
      dt.appendChild(termSpan);
      var dd = document.createElement('dd');
      setText(dd, t.text);
      dl.appendChild(dt);
      dl.appendChild(dd);
    });
    wrap.appendChild(dl);
    container.appendChild(wrap);
  }

  /**
   * Primary stat line for impact showcase cards (from facts.js metric fields; no invented numbers).
   * @param {{ valueDisplay?: string, valueNumeric?: number, valueUnit?: string }} t
   * @returns {string}
   */
  function formatImpactPrimaryStat(t) {
    if (!t) return '';
    if (t.valueDisplay) return String(t.valueDisplay);
    if (typeof t.valueNumeric !== 'number') return '';
    var u = t.valueUnit || '';
    if (u === 'USD_BILLIONS') return '$' + t.valueNumeric + 'B';
    if (u === 'PERCENT') return t.valueNumeric + '%';
    if (u === 'COUNT') return t.valueNumeric >= 200 ? t.valueNumeric + '+' : String(t.valueNumeric);
    return String(t.valueNumeric);
  }

  /**
   * Renders interactive filter chips + showcase cards for Verified anchors (safe DOM only).
   *
   * @param {HTMLElement|null} keyEl — toolbar container (cleared and rebuilt)
   * @param {HTMLElement|null} gridEl — card list container
   * @param {Array<object>} tiles — impactTiles from facts.js
   * @param {Record<string, object>} sourceById — sources by id
   */
  function renderImpactAnchors(keyEl, gridEl, tiles, sourceById) {
    if (!gridEl || !tiles || !tiles.length) return;
    while (gridEl.firstChild) gridEl.removeChild(gridEl.firstChild);
    if (keyEl) {
      while (keyEl.firstChild) keyEl.removeChild(keyEl.firstChild);
    }

    var live = document.getElementById('js-impact-filter-live');
    var cards = [];

    function announceFilter(active, visibleCount) {
      if (!live) return;
      var label =
        active === 'all'
          ? 'Showing all ' + visibleCount + ' verified anchors.'
          : 'Showing ' + visibleCount + ' cards in this category.';
      setText(live, label);
    }

    function applyFilter(topic) {
      var n = 0;
      cards.forEach(function (rec) {
        var show = topic === 'all' || rec.topic === topic;
        rec.card.classList.toggle('hap-reg-impact-card--hidden', !show);
        if (show) n += 1;
      });
      announceFilter(topic, n);
    }

    if (keyEl) {
      var tb = document.createElement('div');
      tb.className = 'hap-reg-impact-toolbar';
      var lab = document.createElement('span');
      lab.className = 'hap-reg-impact-toolbar-label';
      setText(lab, 'Show');
      tb.appendChild(lab);

      var chips = [
        { id: 'all', topic: 'all', label: 'All', iconKind: 'chart', hint: 'Every verified anchor' },
        { id: 'brand', topic: 'brand', label: 'Bright spot', iconKind: 'givingLove', hint: 'HAP headline materials' },
        { id: 'policy', topic: 'policy', label: 'Policy / data', iconKind: 'lawBook', hint: 'Statute, report, or rule' },
        { id: 'finance', topic: 'finance', label: 'Efficiency & dollars', iconKind: 'renewal', hint: 'Fees, cycles, fiscal detail' }
      ];

      var group = document.createElement('div');
      group.className = 'hap-reg-impact-chip-group';
      group.setAttribute('role', 'tablist');
      group.setAttribute('aria-label', 'Filter verified anchors by category');

      chips.forEach(function (c, idx) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hap-reg-impact-chip' + (idx === 0 ? ' is-active' : '');
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
        btn.setAttribute('data-impact-filter', c.topic);
        btn.setAttribute('title', c.hint);
        var icw = document.createElement('span');
        icw.className = 'hap-reg-impact-chip-ic';
        icw.setAttribute('aria-hidden', 'true');
        icw.appendChild(createDataIconSvg(c.iconKind, 'hap-reg-impact-chip-svg'));
        var tx = document.createElement('span');
        tx.className = 'hap-reg-impact-chip-text';
        setText(tx, c.label);
        btn.appendChild(icw);
        btn.appendChild(tx);
        btn.addEventListener('click', function () {
          group.querySelectorAll('.hap-reg-impact-chip').forEach(function (b) {
            b.classList.remove('is-active');
            b.setAttribute('aria-selected', 'false');
          });
          btn.classList.add('is-active');
          btn.setAttribute('aria-selected', 'true');
          applyFilter(c.topic);
        });
        group.appendChild(btn);
      });
      tb.appendChild(group);
      keyEl.appendChild(tb);
    }

    tiles.forEach(function (t) {
      var topic = t.iconTopic || 'access';
      if (topic !== 'brand' && topic !== 'policy' && topic !== 'access' && topic !== 'finance') {
        topic = 'policy';
      }

      var card = document.createElement('article');
      card.className = 'hap-reg-impact-card hap-reg-topic-' + topic + ' hap-reg-hover-lift';
      if (t.impactStatTone === 'negative') {
        card.classList.add('hap-reg-impact-card--danger');
      }
      card.setAttribute('role', 'listitem');
      card.setAttribute('data-impact-topic', topic);

      var inner = document.createElement('div');
      inner.className = 'hap-reg-impact-card-inner';

      var art = document.createElement('div');
      art.className = 'hap-reg-impact-card-art';
      var statStr = formatImpactPrimaryStat(t);
      if (statStr) {
        var statEl = document.createElement('div');
        statEl.className = 'hap-reg-impact-stat';
        if (t.impactStatTone === 'negative') {
          statEl.classList.add('hap-reg-impact-stat--danger');
        }
        statEl.setAttribute('aria-hidden', 'true');
        setText(statEl, statStr);
        art.appendChild(statEl);
      }
      var icBox = document.createElement('div');
      icBox.className = 'hap-reg-impact-ic-wrap hap-reg-topic-' + topic;
      if (t.impactStatTone === 'negative') {
        icBox.className += ' hap-reg-impact-ic-wrap--danger';
      }
      icBox.setAttribute('aria-hidden', 'true');
      icBox.appendChild(createDataIconSvg(t.rowIcon || 'chart', 'hap-reg-impact-ic'));
      art.appendChild(icBox);

      var body = document.createElement('div');
      body.className = 'hap-reg-impact-card-body';
      var badge = document.createElement('span');
      badge.className = 'hap-reg-impact-badge';
      setText(badge, t.dotLabel || 'Fact');
      var h3 = document.createElement('h3');
      h3.className = 'hap-reg-impact-card-title';
      setText(h3, t.title || '');
      var p = document.createElement('p');
      p.className = 'hap-reg-impact-card-desc';
      setText(p, t.body || '');
      body.appendChild(badge);
      body.appendChild(h3);
      body.appendChild(p);

      if (t.supplementalMetrics && t.supplementalMetrics.length) {
        var chipsRow = document.createElement('div');
        chipsRow.className = 'hap-reg-impact-metric-chips';
        t.supplementalMetrics.forEach(function (sm) {
          var ch = document.createElement('span');
          ch.className = 'hap-reg-impact-metric-chip';
          if (t.impactStatTone === 'negative') {
            ch.classList.add('hap-reg-impact-metric-chip--danger');
          }
          var line = '';
          if (typeof sm.valueNumeric === 'number' && sm.valueUnit === 'PERCENT') {
            line = sm.valueNumeric + '%';
          } else if (sm.valueDisplay) {
            line = String(sm.valueDisplay);
          } else if (typeof sm.valueNumeric === 'number') {
            line = String(sm.valueNumeric);
          }
          if (sm.chipLabel) {
            line = line ? line + ' · ' + sm.chipLabel : sm.chipLabel;
          }
          setText(ch, line || 'Related metric');
          if (sm.metricKey) {
            ch.setAttribute('title', sm.metricKey);
          }
          chipsRow.appendChild(ch);
        });
        body.appendChild(chipsRow);
      }

      inner.appendChild(art);
      inner.appendChild(body);
      card.appendChild(inner);
      gridEl.appendChild(card);
      cards.push({ card: card, topic: topic });
    });

    applyFilter('all');
  }

  function renderLetter(el, quotes, meta, sourceById) {
    if (!el) return;
    meta = meta || {};
    while (el.firstChild) el.removeChild(el.firstChild);
    var letterSrc = sourceById && sourceById['hap-letter-2026'] ? sourceById['hap-letter-2026'] : null;

    var sheet = document.createElement('div');
    sheet.className = 'hap-reg-letter-sheet';

    var headRow = document.createElement('div');
    headRow.className = 'hap-reg-letter-head-row';
    var head = document.createElement('div');
    head.className = 'hap-reg-letter-head';
    setText(head, meta.letterhead || 'The Hospital and Healthsystem Association of Pennsylvania (HAP)');
    var dateEl = document.createElement('div');
    dateEl.className = 'hap-reg-letter-date';
    setText(dateEl, meta.dateDisplay);
    headRow.appendChild(head);
    headRow.appendChild(dateEl);
    sheet.appendChild(headRow);

    var routing = document.createElement('div');
    routing.className = 'hap-reg-letter-routing';
    var toRow = document.createElement('div');
    toRow.className = 'hap-reg-letter-routing-row';
    var toLab = document.createElement('span');
    toLab.className = 'hap-reg-letter-routing-label';
    setText(toLab, 'To');
    var toVal = document.createElement('span');
    toVal.className = 'hap-reg-letter-routing-value';
    if (meta.recipientLines && meta.recipientLines.length) {
      setMultilineText(toVal, meta.recipientLines);
    } else {
      setText(toVal, meta.recipient || '');
    }
    toRow.appendChild(toLab);
    toRow.appendChild(toVal);
    var fromRow = document.createElement('div');
    fromRow.className = 'hap-reg-letter-routing-row';
    var fromLab = document.createElement('span');
    fromLab.className = 'hap-reg-letter-routing-label';
    setText(fromLab, 'From');
    var fromVal = document.createElement('span');
    fromVal.className = 'hap-reg-letter-routing-value';
    setText(fromVal, meta.sender || '');
    fromRow.appendChild(fromLab);
    fromRow.appendChild(fromVal);
    routing.appendChild(toRow);
    routing.appendChild(fromRow);
    sheet.appendChild(routing);

    if (meta.subject) {
      var reRow = document.createElement('div');
      reRow.className = 'hap-reg-letter-re';
      var reLab = document.createElement('span');
      reLab.className = 'hap-reg-letter-re-label';
      setText(reLab, 'Re:');
      var reVal = document.createElement('span');
      reVal.className = 'hap-reg-letter-re-value';
      setText(reVal, meta.subject);
      reRow.appendChild(reLab);
      reRow.appendChild(reVal);
      sheet.appendChild(reRow);
    }

    if (meta.note) {
      var noteP = document.createElement('p');
      noteP.className = 'hap-reg-letter-context-note';
      setText(noteP, meta.note);
      sheet.appendChild(noteP);
    }

    if (meta.salutation) {
      var sal = document.createElement('p');
      sal.className = 'hap-reg-letter-salutation';
      setText(sal, meta.salutation);
      sheet.appendChild(sal);
    }

    if (quotes && quotes.length) {
      var quotesVip = document.createElement('div');
      quotesVip.className = 'hap-reg-letter-quotes-vip';

      var primary = document.createElement('div');
      primary.className = 'hap-reg-letter-pullquote';
      var kicker = document.createElement('p');
      kicker.className = 'hap-reg-letter-pullquote-kicker';
      setText(kicker, 'What HAP is asking first');
      primary.appendChild(kicker);
      var bqMain = document.createElement('blockquote');
      bqMain.className = 'hap-reg-letter-quote-main';
      setText(bqMain, '\u201c' + quotes[0].text + '\u201d');
      primary.appendChild(bqMain);
      var byline = document.createElement('footer');
      byline.className = 'hap-reg-letter-quote-byline';
      var citeEl = document.createElement('cite');
      setText(citeEl, 'Nicole Stallings');
      byline.appendChild(citeEl);
      byline.appendChild(
        document.createTextNode(
          ', President & Chief Executive Officer, ' +
            (meta.signatureOrgLine || 'The Hospital and Healthsystem Association of Pennsylvania')
        )
      );
      primary.appendChild(byline);
      quotesVip.appendChild(primary);

      if (quotes.length > 1) {
        var support = document.createElement('div');
        support.className = 'hap-reg-letter-support';
        var supLab = document.createElement('p');
        supLab.className = 'hap-reg-letter-support-label';
        setText(supLab, 'Why smarter rules help patients');
        support.appendChild(supLab);
        var bqSup = document.createElement('blockquote');
        bqSup.className = 'hap-reg-letter-quote-support';
        setText(bqSup, '\u201c' + quotes[1].text + '\u201d');
        support.appendChild(bqSup);
        quotesVip.appendChild(support);
      }

      sheet.appendChild(quotesVip);
      var sigRule = document.createElement('div');
      sigRule.className = 'hap-reg-letter-sig-rule';
      sigRule.setAttribute('aria-hidden', 'true');
      sheet.appendChild(sigRule);
    }

    var close = document.createElement('p');
    close.className = 'hap-reg-letter-closing';
    setText(close, 'Sincerely,');
    sheet.appendChild(close);

    var sig = document.createElement('div');
    sig.className = 'hap-reg-letter-sig';
    var n = document.createElement('div');
    n.className = 'hap-reg-sig-name';
    setText(n, 'Nicole Stallings');
    var t = document.createElement('div');
    t.className = 'hap-reg-sig-title';
    setText(t, 'President & Chief Executive Officer');
    var orgLine = document.createElement('div');
    orgLine.className = 'hap-reg-sig-title hap-reg-sig-title--org';
    setText(orgLine, meta.signatureOrgLine || 'The Hospital and Healthsystem Association of Pennsylvania');
    sig.appendChild(n);
    sig.appendChild(t);
    sig.appendChild(orgLine);
    sheet.appendChild(sig);

    var foot = document.createElement('p');
    foot.className = 'hap-reg-letter-foot';
    setText(
      foot,
      'Correspondence to The Honorable Dr. Debra Bogen, Secretary of Health, Pennsylvania Department of Health — ' +
        meta.dateDisplay +
        '.'
    );
    sheet.appendChild(foot);

    el.appendChild(sheet);

    var cta = document.createElement('div');
    cta.className = 'hap-reg-letter-cta';
    if (letterSrc && letterSrc.url) {
      var fullA = document.createElement('a');
      fullA.className = 'hap-reg-letter-full-link';
      fullA.href = letterSrc.url;
      fullA.rel = 'noopener noreferrer';
      setText(fullA, 'Read the full letter');
      cta.appendChild(fullA);
      var hint = document.createElement('p');
      hint.className = 'hap-reg-letter-cta-hint';
      setText(hint, 'Opens the posted correspondence on the publisher site.');
      cta.appendChild(hint);
    } else {
      var srcA = document.createElement('a');
      srcA.className = 'hap-reg-letter-full-link hap-reg-letter-full-link--secondary';
      srcA.href = '#hap-reg-source-hap-letter-2026';
      setText(srcA, 'Letter source & citation');
      cta.appendChild(srcA);
      var hint2 = document.createElement('p');
      hint2.className = 'hap-reg-letter-cta-hint';
      setText(
        hint2,
        'Jumps to the Sources entry for this letter. When HAP publishes a public URL, add it to facts.js (source id hap-letter-2026) and a primary “Read the full letter” button will appear here.'
      );
      cta.appendChild(hint2);
    }
    el.appendChild(cta);
  }

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

  function getRegAdvSourcesById() {
    var data = window.HAP_REGULATORY_ADVOCACY_2026;
    var by = {};
    if (!data || !data.sources) return by;
    data.sources.forEach(function (s) {
      by[s.id] = s;
    });
    return by;
  }

  function updateMapSelectionPanel(abbr, rec, names) {
    var panel = document.getElementById('hap-reg-map-selection');
    if (!panel) return;
    while (panel.firstChild) panel.removeChild(panel.firstChild);
    if (!abbr) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    var nm = (names && names[abbr]) || abbr;
    var title = document.createElement('div');
    title.className = 'hap-reg-map-selection-title';
    setText(title, nm);
    var st = document.createElement('div');
    st.className = 'hap-reg-map-selection-status';
    var inList = rec && rec[abbr];
    setText(
      st,
      inList
        ? 'In the teal footprint for this dashboard: named on The Joint Commission’s Ambulatory State & Payer page under the Anthem, Highmark, or Centene blocks (compiled list).'
        : 'Outside this dashboard’s compiled list. Other recognition or contracting paths may still apply—verify with TJC and the state.'
    );
    var links = document.createElement('div');
    links.className = 'hap-reg-map-selection-links';
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
    a2.href = '#hap-reg-source-jc-ambulatory-compiled-21';
    setText(a2, 'How this list was built (Sources)');
    links.appendChild(a2);
    panel.appendChild(title);
    panel.appendChild(st);
    panel.appendChild(links);
  }

  function onRegMapEscapeKey(e) {
    if (e.key !== 'Escape') return;
    if (!window._hapRegMapSelectedAbbr) return;
    window._hapRegMapSelectedAbbr = null;
    var stage = document.getElementById('hap-reg-map-stage');
    if (stage && typeof d3 !== 'undefined') {
      d3.select(stage).selectAll('path.hap-reg-map-state').classed('is-selected', false);
    }
    updateMapSelectionPanel(null, {}, window.HAP_REG_MAP_STATE_NAMES || {});
  }

  function updateMapLegendFromData() {
    var leg = document.getElementById('hap-reg-map-legend');
    if (!leg) return;
    var data = window.HAP_REGULATORY_ADVOCACY_2026;
    var n = countJcVerifiedAbbrs(data);
    leg.hidden = false;
    while (leg.firstChild) leg.removeChild(leg.firstChild);
    if (!n) {
      var empty = document.createElement('p');
      empty.className = 'hap-reg-map-legend-empty';
      setText(empty, 'No states highlighted. Add USPS codes to jcAmbulatoryRecognizedAbbr in facts.js, or open Sources.');
      leg.appendChild(empty);
      return;
    }
    var row = document.createElement('div');
    row.className = 'hap-reg-map-legend-row';
    function swatch(extra) {
      var s = document.createElement('span');
      s.className = 'hap-reg-map-legend-swatch ' + (extra || '');
      s.setAttribute('aria-hidden', 'true');
      return s;
    }
    var item1 = document.createElement('div');
    item1.className = 'hap-reg-map-legend-item';
    item1.appendChild(swatch('hap-reg-map-legend-swatch--teal'));
    var t1 = document.createElement('span');
    t1.className = 'hap-reg-map-legend-text';
    setText(t1, 'Teal — ' + String(n) + ' states in compiled footprint (TJC payer blocks)');
    item1.appendChild(t1);
    var item2 = document.createElement('div');
    item2.className = 'hap-reg-map-legend-item';
    item2.appendChild(swatch('hap-reg-map-legend-swatch--muted'));
    var t2 = document.createElement('span');
    t2.className = 'hap-reg-map-legend-text';
    setText(t2, 'Gray — outside this list for this view');
    item2.appendChild(t2);
    row.appendChild(item1);
    row.appendChild(item2);
    leg.appendChild(row);
  }

  function hideRegMapTooltip() {
    var tip = document.getElementById('hap-reg-map-tooltip');
    if (!tip) return;
    tip.hidden = true;
    tip.classList.remove('hap-reg-map-tooltip--visible');
    while (tip.firstChild) tip.removeChild(tip.firstChild);
  }

  function showRegMapTooltip(abbr, clientX, clientY, rec) {
    var names = window.HAP_REG_MAP_STATE_NAMES;
    var tip = document.getElementById('hap-reg-map-tooltip');
    var wrap = document.querySelector('.hap-reg-map-stage-wrap');
    if (!tip || !wrap || !names) return;
    hideRegMapTooltip();
    var nm = document.createElement('div');
    nm.className = 'hap-reg-map-tooltip-name';
    setText(nm, names[abbr] || abbr);
    var st = document.createElement('div');
    st.className = 'hap-reg-map-tooltip-status';
    setText(
      st,
      rec[abbr]
        ? 'In this dashboard’s teal footprint (TJC Ambulatory State & Payer lists). Click the map to pin details below.'
        : 'Not in this compiled list. Recognition may still apply—check TJC and the state.'
    );
    tip.appendChild(nm);
    tip.appendChild(st);
    tip.hidden = false;
    tip.classList.add('hap-reg-map-tooltip--visible');
    window.requestAnimationFrame(function () {
      var wr = wrap.getBoundingClientRect();
      var left = clientX - wr.left + 10;
      var top = clientY - wr.top + 10;
      var maxL = Math.max(8, wrap.clientWidth - (tip.offsetWidth || 200) - 10);
      var maxT = Math.max(8, wrap.clientHeight - (tip.offsetHeight || 72) - 10);
      tip.style.left = Math.min(Math.max(6, left), maxL) + 'px';
      tip.style.top = Math.min(Math.max(6, top), maxT) + 'px';
    });
  }

  var _hapRegMapResizeBound = false;

  function scheduleRegulatoryMapRedraw() {
    if (window._hapRegMapRedrawTimer) clearTimeout(window._hapRegMapRedrawTimer);
    window._hapRegMapRedrawTimer = setTimeout(function () {
      drawRegulatoryUsMap();
    }, 140);
  }

  function drawRegulatoryUsMap() {
    var container = document.getElementById('hap-reg-map-stage');
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
      width = Math.max(320, Math.min(820, (window.innerWidth || 960) - 40));
    }
    var height = Math.round(width * 0.775);

    var svg = d3
      .select(container)
      .append('svg')
      .attr('class', 'hap-reg-map-svg')
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

    var pathSel = svg
      .selectAll('path.hap-reg-map-state')
      .data(states)
      .enter()
      .append('path')
      .attr('class', 'hap-reg-map-state')
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
        hideRegMapTooltip();
        if (window._hapRegMapSelectedAbbr === abbr) {
          window._hapRegMapSelectedAbbr = null;
        } else {
          window._hapRegMapSelectedAbbr = abbr;
        }
        svg.selectAll('path.hap-reg-map-state').classed('is-selected', function (d2) {
          return fipsIdToAbbrReg(d2.id) === window._hapRegMapSelectedAbbr;
        });
        updateMapSelectionPanel(window._hapRegMapSelectedAbbr, rec, names);
      })
      .on('mouseenter', function (event, d) {
        var abbr = fipsIdToAbbrReg(d.id);
        if (abbr) showRegMapTooltip(abbr, event.clientX, event.clientY, rec);
      })
      .on('mousemove', function (event, d) {
        var abbr = fipsIdToAbbrReg(d.id);
        if (abbr) showRegMapTooltip(abbr, event.clientX, event.clientY, rec);
      })
      .on('mouseleave', function () {
        hideRegMapTooltip();
      })
      .on('focus', function (event, d) {
        var abbr = fipsIdToAbbrReg(d.id);
        if (!abbr) return;
        var r = this.getBoundingClientRect();
        showRegMapTooltip(abbr, r.left + r.width / 2, r.top + r.height / 2, rec);
      })
      .on('blur', function () {
        hideRegMapTooltip();
      })
      .on('keydown', function (event, d) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          var abbrK = fipsIdToAbbrReg(d.id);
          if (!abbrK) return;
          hideRegMapTooltip();
          if (window._hapRegMapSelectedAbbr === abbrK) {
            window._hapRegMapSelectedAbbr = null;
          } else {
            window._hapRegMapSelectedAbbr = abbrK;
          }
          svg.selectAll('path.hap-reg-map-state').classed('is-selected', function (d2) {
            return fipsIdToAbbrReg(d2.id) === window._hapRegMapSelectedAbbr;
          });
          updateMapSelectionPanel(window._hapRegMapSelectedAbbr, rec, names);
          return;
        }
        if (event.key !== 'Escape') return;
        hideRegMapTooltip();
        if (window._hapRegMapSelectedAbbr) {
          window._hapRegMapSelectedAbbr = null;
          svg.selectAll('path.hap-reg-map-state').classed('is-selected', false);
          updateMapSelectionPanel(null, rec, names);
        }
      });

    var easeOut = typeof d3.easeCubicOut === 'function' ? d3.easeCubicOut : null;
    if (prefersReducedMotion()) {
      pathSel.style('opacity', 1);
    } else {
      var tStates = pathSel.style('opacity', 0).transition();
      tStates.ease(
        easeOut ||
          function (t) {
            return 1 - Math.pow(1 - t, 3);
          }
      );
      tStates
        .delay(function (d, i) {
          return Math.min(i * 5, 780);
        })
        .duration(380)
        .style('opacity', 1);
    }

    var pinned = window._hapRegMapSelectedAbbr;
    if (pinned) {
      pathSel.classed('is-selected', function (d2) {
        return fipsIdToAbbrReg(d2.id) === pinned;
      });
      updateMapSelectionPanel(pinned, rec, names);
    } else {
      updateMapSelectionPanel(null, rec, names);
    }

    var meshSel = svg
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
    if (prefersReducedMotion()) {
      meshSel.style('opacity', 0.94);
    } else {
      var easeM = typeof d3.easeCubicOut === 'function' ? d3.easeCubicOut : null;
      meshSel
        .style('opacity', 0)
        .transition()
        .delay(160)
        .duration(420)
        .ease(
          easeM ||
            function (t) {
              return 1 - Math.pow(1 - t, 3);
            }
        )
        .style('opacity', 0.94);
    }
  }

  function initRegulatoryUsMap() {
    updateMapLegendFromData();
    drawRegulatoryUsMap();
    if (!window._hapRegMapEscWired) {
      window._hapRegMapEscWired = true;
      document.addEventListener('keydown', onRegMapEscapeKey);
    }
    var wrap = document.querySelector('.hap-reg-map-stage-wrap');
    if (wrap && typeof ResizeObserver !== 'undefined') {
      if (window._hapRegMapRO) {
        try {
          window._hapRegMapRO.disconnect();
        } catch (e1) {
          /* ignore */
        }
      }
      window._hapRegMapRO = new ResizeObserver(function () {
        scheduleRegulatoryMapRedraw();
      });
      window._hapRegMapRO.observe(wrap);
    }
    if (!_hapRegMapResizeBound) {
      _hapRegMapResizeBound = true;
      window.addEventListener('resize', scheduleRegulatoryMapRedraw);
    }
  }

  function sourceLinkLabel(url) {
    if (!url) return 'Open link';
    try {
      var u = new URL(url);
      var host = u.hostname.replace(/^www\./, '');
      var path = u.pathname;
      if (path.length > 1 && path.length > 28) path = path.slice(0, 26) + '…';
      return host + (path && path !== '/' ? path : '');
    } catch (e) {
      return 'Open link';
    }
  }

  function renderSources(container, sources) {
    if (!container) return;
    while (container.firstChild) container.removeChild(container.firstChild);
    sources.forEach(function (s) {
      var details = document.createElement('details');
      details.className = 'hap-reg-source-details';
      if (s.id) details.id = 'hap-reg-source-' + s.id;
      var summary = document.createElement('summary');
      summary.className = 'hap-reg-source-summary';
      setText(summary, s.shortTitle);
      details.appendChild(summary);
      var body = document.createElement('div');
      body.className = 'hap-reg-source-body';
      var pub = document.createElement('div');
      pub.className = 'hap-reg-source-publisher';
      setText(pub, s.publisher);
      var note = document.createElement('div');
      note.className = 'hap-reg-source-note';
      setText(note, s.accessedNote);
      body.appendChild(pub);
      body.appendChild(note);
      if (s.url) {
        var a = document.createElement('a');
        a.href = s.url;
        a.rel = 'noopener noreferrer';
        a.className = 'hap-reg-source-url';
        a.setAttribute('title', s.url);
        setText(a, sourceLinkLabel(s.url));
        body.appendChild(a);
      } else {
        var noUrl = document.createElement('div');
        noUrl.className = 'hap-reg-source-missing-url';
        setText(noUrl, 'URL not assigned.');
        body.appendChild(noUrl);
      }
      details.appendChild(body);
      container.appendChild(details);
    });
  }

  /**
   * Highlights the nav item for the section most in view. Maps hash targets that sit inside
   * a larger section (e.g. #priorities-deck → #priorities) so the bar stays accurate while reading briefs.
   */
  /**
   * When the national map band scrolls into view, add a class for CSS polish (shadow lift).
   * Map paths already animate in drawRegulatoryUsMap; this keeps layout stable (no opacity tricks on copy).
   */
  function wireStatesBandInView() {
    var sec = document.getElementById('states');
    if (!sec || !sec.classList.contains('hap-reg-states-wrap--band')) return;
    function mark() {
      sec.classList.add('is-inview');
    }
    if (typeof IntersectionObserver === 'undefined') {
      mark();
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            mark();
            io.disconnect();
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
    );
    io.observe(sec);
  }

  function wireNavSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.hap-reg-nav [href^="#"]'));
    var spyTargetByHash = { 'priorities-deck': 'priorities' };
    var linkBySpyId = {};
    links.forEach(function (a) {
      var hash = (a.getAttribute('href') || '').replace(/^#/, '');
      if (!hash) return;
      var spyId = spyTargetByHash[hash] || hash;
      linkBySpyId[spyId] = a;
    });
    var spyIds = Object.keys(linkBySpyId);
    var sections = spyIds
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);
    if (!sections.length) return;
    var io = new IntersectionObserver(
      function (entries) {
        var candidates = entries.filter(function (e) {
          return e.isIntersecting && e.intersectionRatio > 0.08;
        });
        if (!candidates.length) return;
        candidates.sort(function (a, b) {
          return b.intersectionRatio - a.intersectionRatio;
        });
        var bestId = candidates[0].target.id;
        var link = linkBySpyId[bestId];
        if (!link) return;
        links.forEach(function (l) {
          l.classList.remove('is-active');
          l.removeAttribute('aria-current');
        });
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      },
      { root: null, threshold: [0.1, 0.2, 0.35], rootMargin: '-110px 0px -52% 0px' }
    );
    sections.forEach(function (sec) {
      io.observe(sec);
    });
  }

  function init() {
    var data = window.HAP_REGULATORY_ADVOCACY_2026;
    if (!data) return;
    var sourceById = {};
    data.sources.forEach(function (s) {
      sourceById[s.id] = s;
    });
    var lc = data.letterContext || {};

    initHero();
    renderAtAGlance(document.getElementById('js-at-a-glance'), data.atAGlance || []);
    renderHeroKpis(document.getElementById('js-hero-kpis'), data.heroKpis || [], sourceById);
    renderGlossary(document.getElementById('js-glossary'), data.glossary || []);

    setText(document.getElementById('js-letter-date'), lc.dateDisplay || '');
    var recEl = document.getElementById('js-letter-recipient');
    if (recEl && lc.recipientLines && lc.recipientLines.length) {
      setMultilineText(recEl, lc.recipientLines);
    } else if (recEl) {
      setText(recEl, lc.recipient || '');
    }
    setText(document.getElementById('js-letter-sender'), lc.sender || '');
    setText(document.getElementById('js-letter-note'), lc.note || '');

    renderStatBand(document.getElementById('js-stat-band'), data.statBand, sourceById);
    renderPriorityDeck(document.getElementById('js-priority-deck'), data.priorities);
    renderPriorityArticles(document.getElementById('js-priority-articles'), data.priorities, sourceById);
    renderCompareSection(document.getElementById('js-compare-table'), data.compareRows);
    renderStatesNote(document.getElementById('js-states-note'), data.statesCallout, sourceById);
    renderImpactAnchors(
      document.getElementById('js-impact-key'),
      document.getElementById('js-impact-grid'),
      data.impactTiles,
      sourceById
    );
    renderSources(document.getElementById('js-sources'), data.sources);
    renderLetter(
      document.getElementById('js-letter-quotes'),
      data.letterQuotes,
      lc,
      sourceById
    );

    window.setTimeout(function () {
      initRegulatoryUsMap();
    }, 0);

    wireStatesBandInView();
    attachBanObservers();
    wireNavSpy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
