/** Homepage 2.0 — hero, services, portfolio, booking CTA (enqueue after site.js on body.home) */
(function () {
  'use strict';
  if (!document.body.classList.contains('home')) return;

  var bookUrl = (window.PASite && PASite.bookUrl) ? PASite.bookUrl : '/book/';

  function bookLink(serviceApi) {
    if (typeof window.PABookLinkUrl === 'function') {
      return window.PABookLinkUrl(serviceApi);
    }
    var url = bookUrl + (bookUrl.indexOf('?') >= 0 ? '&' : '?') + 'start=1';
    if (serviceApi) {
      url += '&service=' + encodeURIComponent(serviceApi);
    }
    return url;
  }
  var servicesUrl = (window.PASite && PASite.homeUrl)
    ? PASite.homeUrl.replace(/\/?$/, '/') + 'services/'
    : '/services/';

  function revealServicesHead(section) {
    if (!section) {
      return;
    }
    section.classList.add('is-inview');
    section.querySelectorAll(
      '.pa2-services__title, .pa2-services__lead'
    ).forEach(function (el) {
      el.classList.add('is-animated', 'is-revealed', 'is-visible');
    });
  }

  function refreshHomeScrollReveal(root) {
    if (typeof window.PARefreshScrollReveal === 'function') {
      window.PARefreshScrollReveal(root || document);
    }
    if (typeof window.PAEnvironment !== 'undefined' && PAEnvironment.refresh) {
      PAEnvironment.refresh();
    }
  }

  buildHomeHero();
  document.addEventListener('DOMContentLoaded', buildHomeHero);
  window.addEventListener('pageshow', buildHomeHero);
  buildHomeServices();
  whenPortfolioReady(buildHomePortfolio);
  whenClosingReady(buildHomeClosingStack);

  /**
   * Bottom-of-page sections: Reviews → Booking CTA.
   */
  function buildHomeClosingStack() {
    var staleWhy = document.getElementById('pa2-why');
    if (staleWhy && staleWhy.parentNode) {
      staleWhy.parentNode.removeChild(staleWhy);
    }
    if (typeof window.PARelocateHomeShellFromHeader === 'function') {
      window.PARelocateHomeShellFromHeader();
    }
    buildHomeReviews();
    var ok = buildHomeBookingCta();
    if (typeof window.PAFinalizeHomeExperience === 'function') {
      window.PAFinalizeHomeExperience();
    } else if (typeof window.PAForceRevealHomeClosing === 'function') {
      window.PAForceRevealHomeClosing();
    }
    if (window.PASuppressLegacyThemeBlocks) {
      window.PASuppressLegacyThemeBlocks();
    }
    return ok;
  }

  function buildHomeHero() {
    var hero = document.querySelector('.pa-home-hero, .pa2-hero, .pa-glass-hero-wrap .wp-block-cover.alignfull');
    if (!hero) return;
    if (hero.getAttribute('data-pa2-hero') === '1') {
      applyHomeHeroBackground(hero, resolveHomeHeroImage(hero.querySelector('img, .wp-block-cover__image-background')));
      applyHomeHeroAnimations(hero);
      refreshHomeScrollReveal(hero);
      return;
    }
    hero.classList.add('pa-home-hero');

    var bg = hero.querySelector('img, .wp-block-cover__image-background');
    applyHomeHeroBackground(hero, resolveHomeHeroImage(bg));

    var eyebrowText = textFrom(hero, '.pa-hero-eyebrow, .pa2-hero__eyebrow') ||
      'Multimedia production \u00b7 Central Pennsylvania';
    var titleText = textFrom(hero, '.pa-hero-title, .pa2-hero__title, h1') ||
      'Event photographer & videographer for Central PA';
    var leadText = textFrom(hero, '.pa-hero-lead, .pa2-hero__lead') ||
      'Wedding and corporate event production in Harrisburg, York, and Lancaster \u2014 photography, video, DJ, and live sound. Book online with a secure deposit.';

    hero.classList.add('pa2-hero');
    hero.setAttribute('data-pa2-hero', '1');

    hero.querySelectorAll(
      '.pa-hero-content, .pa-hero-badge, .pa2-hero__inner, .pa-hero-eyebrow, .pa-hero-title, .pa-hero-lead, .pa-hero-actions, .pa2-hero__eyebrow, .pa2-hero__title, .pa2-hero__lead, .pa2-hero__actions, .pa2-hero__trust, .pa2-hero__badge'
    ).forEach(function (node) {
      node.remove();
    });

    var host = hero.querySelector('.wp-block-cover__inner-container') || hero;
    Array.prototype.slice.call(host.childNodes).forEach(function (node) {
      if (node.nodeType === 1 && node.tagName === 'IMG') return;
      if (node.nodeType === 1) node.remove();
      else if (node.nodeType === 3 && !node.textContent.trim()) node.remove();
    });

    var inner = document.createElement('div');
    inner.className = 'pa2-hero__inner';

    inner.appendChild(el('p', 'pa2-hero__eyebrow animate fade-up', eyebrowText));
    var title = el('h1', 'pa2-hero__title animate reveal-text reveal-text--line', titleText);
    inner.appendChild(title);
    var lead = el('p', 'pa2-hero__lead animate fade-up', leadText);
    lead.setAttribute('data-delay', '150');
    inner.appendChild(lead);

    var row = el('div', 'pa2-hero__actions animate fade-up stagger');
    var primary = el('a', 'pa2-hero__btn pa2-hero__btn--primary animate fade-up', 'Start Booking');
    primary.href = bookLink();
    var secondary = el('a', 'pa2-hero__btn pa2-hero__btn--secondary animate fade-up', 'View work');
    secondary.href = '#pa-portfolio';
    row.appendChild(primary);
    row.appendChild(secondary);
    inner.appendChild(row);

    var badge = el('a', 'pa2-hero__badge animate fade-up', '');
    badge.href = 'https://cpmhof.com/2026-winners';
    badge.target = '_blank';
    badge.rel = 'noopener';
    var star = el('span', 'pa2-hero__badge-star', '\u2605');
    star.setAttribute('aria-hidden', 'true');
    badge.appendChild(star);
    badge.appendChild(el('span', 'pa2-hero__badge-text', '2026 CPMA \u2014 Best Videography Nominee'));
    inner.appendChild(badge);

    var ambient = el('div', 'pa2-hero__ambient', '');
    ambient.setAttribute('aria-hidden', 'true');
    host.appendChild(ambient);
    host.appendChild(inner);
    hero.classList.add('parallax');
    hero.setAttribute('data-parallax', '0.2');
    applyHomeHeroAnimations(hero);
    requestAnimationFrame(function () { hero.classList.add('is-ready'); });
    refreshHomeScrollReveal(hero);
  }

  function applyHomeHeroAnimations(hero) {
    if (!hero) return;
    var bgImg = hero.querySelector('img, .wp-block-cover__image-background');
    if (bgImg) {
      bgImg.classList.add('animate', 'scale-in');
    }
  }

  /**
   * Prefer the Harrisburg drone hero from PASite (homepage only); fall back to theme cover img.
   */
  function resolveHomeHeroImage(bg) {
    var siteHero = window.PASite && PASite.homeHeroImage;
    if (siteHero && siteHero.url) {
      return {
        url: siteHero.url,
        srcset: siteHero.srcset || '',
        position: siteHero.position || '50% 38%',
        alt: siteHero.alt || '',
      };
    }
    if (!bg || !bg.src) {
      return null;
    }
    var targetW = Math.min(1600, Math.ceil((window.innerWidth || 1280) * Math.min(window.devicePixelRatio || 1, 2)));
    var heroUrl = bg.currentSrc || bg.src;
    if (window.PAImage && typeof PAImage.pickFromSrcset === 'function') {
      heroUrl = PAImage.pickFromSrcset(bg.getAttribute('srcset'), targetW) || heroUrl;
    }
    return {
      url: heroUrl,
      srcset: bg.getAttribute('srcset') || '',
      position: '50% 42%',
      alt: bg.getAttribute('alt') || '',
    };
  }

  function applyHomeHeroBackground(hero, meta) {
    if (!meta || !meta.url) {
      return;
    }
    var targetW = Math.min(1600, Math.ceil((window.innerWidth || 1280) * Math.min(window.devicePixelRatio || 1, 2)));
    var heroUrl = meta.url;
    if (meta.srcset && window.PAImage && typeof PAImage.pickFromSrcset === 'function') {
      heroUrl = PAImage.pickFromSrcset(meta.srcset, targetW) || heroUrl;
    }
    hero.style.backgroundImage = 'url("' + heroUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '")';
    hero.style.backgroundSize = 'cover';
    hero.style.backgroundPosition = meta.position || '50% 38%';
    hero.style.backgroundRepeat = 'no-repeat';

    var bgImg = hero.querySelector('img, .wp-block-cover__image-background');
    if (bgImg) {
      bgImg.src = heroUrl;
      if (meta.srcset) {
        bgImg.setAttribute('srcset', meta.srcset);
      }
      if (meta.alt) {
        bgImg.alt = meta.alt;
      }
      bgImg.loading = 'eager';
      if ('fetchPriority' in bgImg) {
        bgImg.fetchPriority = 'high';
      }
    }
  }

  function textFrom(root, selector) {
    var node = root.querySelector(selector);
    return node ? node.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function homeMain() {
    return document.querySelector('main .entry-content, main .wp-block-post-content');
  }

  /** Insert a section in main scroll order (before portfolio, reviews, or closing band). */
  function insertHomeSection(section, beforeSelector) {
    var main = homeMain();
    if (!main) return false;

    if (beforeSelector === 'portfolio' && insertAfterHero(section)) {
      return true;
    }

    if (beforeSelector === 'closing') {
      var portfolio = document.getElementById('pa-portfolio') ||
        document.getElementById('pa-photo-portfolio') ||
        document.querySelector('.pa-portfolio-showcase');
      if (portfolio && insertAfterElement(section, portfolio)) {
        return true;
      }
    }

    var beforeEl = null;
    if (beforeSelector === 'portfolio') {
      beforeEl = document.getElementById('pa-photo-portfolio') ||
        document.getElementById('pa-portfolio') ||
        document.querySelector('.pa-portfolio-showcase, .pa-portfolio-fallback-gallery, #pa-youtube-feature');
    } else if (beforeSelector === 'closing') {
      beforeEl = document.getElementById('pa2-reviews') ||
        document.getElementById('pa-home-closing');
    }

    if (beforeEl) {
      var anchor = beforeEl;
      while (anchor.parentNode && anchor.parentNode !== main) {
        anchor = anchor.parentNode;
      }
      if (anchor.parentNode === main) {
        main.insertBefore(section, anchor);
        return true;
      }
      beforeEl.parentNode.insertBefore(section, beforeEl);
      return true;
    }

    if (beforeSelector === 'portfolio' && insertAfterHero(section)) {
      return true;
    }

    main.appendChild(section);
    return true;
  }

  function insertAfterElement(section, target) {
    var main = homeMain();
    if (!main || !target) return false;
    var anchor = target;
    while (anchor.parentNode && anchor.parentNode !== main) {
      anchor = anchor.parentNode;
    }
    if (anchor.parentNode !== main) return false;
    anchor.insertAdjacentElement('afterend', section);
    return true;
  }

  function insertAfterHero(section) {
    var main = homeMain();
    if (!main) return false;
    var hero = main.querySelector('.pa-home-hero, .pa2-hero, .wp-block-cover.pa-home-hero, .pa-glass-hero-wrap') ||
      document.querySelector('main .pa-glass-hero-wrap, main .pa2-hero, .pa-glass-hero-wrap .pa2-hero');
    if (!hero) return false;
    return insertAfterElement(section, hero);
  }

  function buildHomeServices() {
    if (document.getElementById('pa2-services')) return;

    var catalog = [
      { id: 'photo', label: 'Photography', api: 'Event Photography', tagline: 'Story-driven stills for weddings and live events.' },
      { id: 'video', label: 'Videography', api: 'Video Production', tagline: 'Cinematic capture and in-house editing.' },
      { id: 'dj', label: 'DJ', api: 'DJ Services', tagline: 'Music programming, MC, and dance-floor energy.' },
      { id: 'audio', label: 'Live Audio', api: 'Live Audio / PA', tagline: 'Full PA and live sound from load-in to strike.' },
      { id: 'bundle', label: 'Multiple Services', api: 'Photo + Video Bundle', tagline: 'Coordinated photo and video — one booking.', featured: true }
    ];
    var apiList = (window.PASite && PASite.services && PASite.services.length)
      ? PASite.services
      : catalog.map(function (s) { return s.api; });
    var items = catalog.filter(function (s) { return apiList.indexOf(s.api) !== -1; });
    if (!items.length) return;

    var section = document.createElement('section');
    section.className = 'pa2-services pa2-services--dynamic pa-reveal-section section-reveal';
    section.id = 'pa2-services';
    section.setAttribute('data-pa-atmosphere', 'contrast');
    section.setAttribute('aria-labelledby', 'pa2-services-title');

    var wrap = document.createElement('div');
    wrap.className = 'pa2-services__inner';

    var head = document.createElement('header');
    head.className = 'pa2-services__head';

    var title = document.createElement('h2');
    title.className = 'pa2-services__title pa-reveal-item';
    title.style.setProperty('--pa-reveal-i', '0');
    title.style.setProperty('--anim-i', '0');
    title.id = 'pa2-services-title';
    title.textContent = 'Services';
    head.appendChild(title);

    var lead = document.createElement('p');
    lead.className = 'pa2-services__lead pa-reveal-item';
    lead.style.setProperty('--pa-reveal-i', '1');
    lead.style.setProperty('--anim-i', '1');
    lead.textContent = 'Photography, video, DJ, and live production for Pennsylvania events.';
    head.appendChild(lead);
    wrap.appendChild(head);

    var grid = document.createElement('div');
    grid.className = 'pa2-services__grid pa2-services__grid--rows';
    grid.setAttribute('role', 'list');
    items.forEach(function (svc, i) {
      var card = document.createElement('a');
      card.className = 'pa2-services__card pa2-services__card--' + svc.id +
        (svc.featured ? ' is-featured' : '');
      card.href = bookLink(svc.api);
      card.setAttribute('role', 'listitem');
      card.style.setProperty('--pa2-svc-i', String(i));
      card.style.setProperty('--pa-reveal-i', String(i + 2));
      card.style.setProperty('--anim-i', String(i + 2));
      card.classList.add('pa-reveal-item');

      var inner = document.createElement('div');
      inner.className = 'pa2-services__card-inner';

      var iconWrap = document.createElement('div');
      iconWrap.className = 'pa2-services__icon-wrap';
      if (svc.featured) {
        var badge = document.createElement('span');
        badge.className = 'pa2-services__badge';
        badge.textContent = 'Most popular';
        iconWrap.appendChild(badge);
      }
      var ring = document.createElement('div');
      ring.className = 'pa2-services__icon-ring pa2-services__icon-ring--' + svc.id;
      ring.appendChild(createServiceIcon(svc.id));
      iconWrap.appendChild(ring);
      inner.appendChild(iconWrap);

      var body = document.createElement('div');
      body.className = 'pa2-services__card-body';
      var h3 = document.createElement('h3');
      h3.className = 'pa2-services__card-title';
      h3.textContent = svc.label;
      var tag = document.createElement('p');
      tag.className = 'pa2-services__card-tagline';
      tag.textContent = svc.tagline;
      body.appendChild(h3);
      body.appendChild(tag);
      inner.appendChild(body);
      card.appendChild(inner);

      grid.appendChild(card);
    });
    wrap.appendChild(grid);

    var foot = document.createElement('div');
    foot.className = 'pa2-services__foot pa-reveal-item';
    foot.style.setProperty('--pa-reveal-i', String(items.length + 2));
    foot.style.setProperty('--anim-i', String(items.length + 2));
    var explore = document.createElement('a');
    explore.className = 'pa2-services__cta';
    explore.href = servicesUrl;
    explore.textContent = 'Explore all services';
    foot.appendChild(explore);
    wrap.appendChild(foot);

    section.appendChild(wrap);

    document.querySelectorAll('.entry-content .wp-block-heading').forEach(function (h) {
      if (h.textContent.trim() === 'Services Offered') {
        h.hidden = true;
        h.setAttribute('aria-hidden', 'true');
      }
    });
    document.querySelectorAll('.pa-services-grid').forEach(function (legacyGrid) {
      legacyGrid.remove();
    });

    if (!insertHomeSection(section, 'portfolio')) {
      return;
    }

    if (typeof window.PARelocateHomeShellFromHeader === 'function') {
      window.PARelocateHomeShellFromHeader();
    }

    requestAnimationFrame(function () {
      section.classList.add('is-ready');
      revealServicesHead(section);
    });
    refreshHomeScrollReveal(section);
    if (typeof window.PAFinalizeHomeExperience === 'function') {
      window.PAFinalizeHomeExperience();
    }
  }

  /**
   * Large stroke icons for the home services grid (local SVG, no CDN).
   *
   * @param {string} type — photo | video | dj | audio | bundle
   * @returns {HTMLElement}
   */
  function createServiceIcon(type) {
    if (window.PAServiceIcons && typeof window.PAServiceIcons.create === 'function') {
      return window.PAServiceIcons.create(type, 'pa2-services__icon');
    }
    var wrap = document.createElement('span');
    wrap.className = 'pa2-services__icon pa2-services__icon--' + type;
    wrap.setAttribute('aria-hidden', 'true');
    return wrap;
  }

  function whenPortfolioReady(fn) {
    var tries = 0;
    function attempt() {
      if (fn()) return;
      tries += 1;
      if (tries < 80) requestAnimationFrame(attempt);
    }
    attempt();
    var main = document.querySelector('main .entry-content, main .wp-block-post-content');
    if (main && window.MutationObserver) {
      var obs = new MutationObserver(function () { if (fn()) obs.disconnect(); });
      obs.observe(main, { childList: true, subtree: true });
      setTimeout(function () { fn(); obs.disconnect(); }, 8000);
    }
  }

  function upgradePortfolioHead(host, afterEl) {
    var old = host.querySelector('.pa-photo-portfolio-head, .pa-portfolio-head, .pa-section-head, .pa2-portfolio__head');
    var head = document.createElement('div');
    head.className = 'pa2-portfolio__head';
    var eyebrow = document.createElement('p');
    eyebrow.className = 'pa2-portfolio__eyebrow';
    eyebrow.textContent = 'Photography';
    var title = document.createElement('h2');
    title.className = 'pa2-portfolio__title';
    title.id = 'pa2-portfolio-title';
    title.textContent = 'Gallery';
    var lead = document.createElement('p');
    lead.className = 'pa2-portfolio__lead';
    lead.textContent =
      'Recent events and sessions across Pennsylvania. Tap any image to view full size.';
    head.appendChild(eyebrow);
    head.appendChild(title);
    head.appendChild(lead);
    if (old) old.remove();
    if (afterEl && afterEl.parentNode) {
      afterEl.insertAdjacentElement('afterend', head);
    } else {
      host.insertBefore(head, host.firstChild);
    }
    host.setAttribute('aria-labelledby', 'pa2-portfolio-title');
  }

  function buildHomePortfolio() {
    if (document.querySelector('.pa2-portfolio--enhanced')) return true;

    var showcase = document.getElementById('pa-photo-portfolio') ||
      document.getElementById('pa-portfolio') ||
      document.querySelector('.pa-portfolio-showcase');
    var video = document.getElementById('pa-youtube-feature');
    var fallbackLabel = document.getElementById('pa-portfolio-label');
    var fallbackGrid = document.querySelector('.pa-portfolio-fallback-gallery');

    if (!showcase && !fallbackGrid && !video) return false;

    if (showcase) {
      showcase.classList.add('pa2-portfolio', 'pa2-portfolio--enhanced', 'pa-reveal-section');
      showcase.id = 'pa-portfolio';
      showcase.setAttribute('data-pa-atmosphere', 'bright');
      var grid = showcase.querySelector('.pa-portfolio-grid');
      var featEl = showcase.querySelector('.pa2-portfolio__featured');
      if (video && !showcase.contains(video)) {
        featEl = document.createElement('div');
        featEl.className = 'pa2-portfolio__featured';
        featEl.appendChild(video);
        showcase.insertBefore(featEl, grid || null);
      } else if (video) {
        featEl = featEl || (video.closest && video.closest('.pa2-portfolio__featured')) || video.parentElement;
      }
      upgradePortfolioHead(showcase, featEl || null);
      if (fallbackLabel) fallbackLabel.hidden = true;
      if (!showcase.querySelector('.pa2-portfolio__inner')) {
        var wrap = document.createElement('div');
        wrap.className = 'pa2-portfolio__inner';
        while (showcase.firstChild) wrap.appendChild(showcase.firstChild);
        showcase.appendChild(wrap);
      }
      requestAnimationFrame(function () { showcase.classList.add('is-ready'); });
      refreshHomeScrollReveal(showcase);
      if (typeof window.PAFinalizeHomeExperience === 'function') {
        window.PAFinalizeHomeExperience();
      }
      return true;
    }

    var section = document.createElement('section');
    section.className = 'pa2-portfolio pa2-portfolio--enhanced pa2-portfolio--fallback pa-reveal-section';
    section.id = 'pa-portfolio';
    section.setAttribute('data-pa-atmosphere', 'bright');
    section.setAttribute('aria-labelledby', 'pa2-portfolio-title');
    var inner = document.createElement('div');
    inner.className = 'pa2-portfolio__inner';
    var head = document.createElement('div');
    head.className = 'pa2-portfolio__head';
    var eyebrow = document.createElement('p');
    eyebrow.className = 'pa2-portfolio__eyebrow';
    eyebrow.textContent = 'Photography';
    var title = document.createElement('h2');
    title.className = 'pa2-portfolio__title';
    title.id = 'pa2-portfolio-title';
    title.textContent = 'Gallery';
    var lead = document.createElement('p');
    lead.className = 'pa2-portfolio__lead';
    lead.textContent =
      'Recent events and sessions across Pennsylvania. Tap any image to view full size.';
    head.appendChild(eyebrow);
    head.appendChild(title);
    head.appendChild(lead);
    if (video) {
      var featWrap = document.createElement('div');
      featWrap.className = 'pa2-portfolio__featured';
      featWrap.appendChild(video);
      inner.appendChild(featWrap);
      inner.appendChild(head);
    } else {
      inner.appendChild(head);
    }
    if (fallbackGrid) {
      fallbackGrid.classList.add('pa2-portfolio__grid');
      inner.appendChild(fallbackGrid);
    }
    if (fallbackLabel) fallbackLabel.hidden = true;
    section.appendChild(inner);
    var host = (fallbackLabel || fallbackGrid || video).parentNode;
    host.insertBefore(section, fallbackLabel || fallbackGrid || video);
    requestAnimationFrame(function () { section.classList.add('is-ready'); });
    refreshHomeScrollReveal(section);
    if (typeof window.PAFinalizeHomeExperience === 'function') {
      window.PAFinalizeHomeExperience();
    }
    return true;
  }

  function whenClosingReady(fn) {
    var tries = 0;
    function attempt() {
      if (fn()) return;
      tries += 1;
      if (tries < 40) requestAnimationFrame(attempt);
    }
    attempt();
    var main = document.querySelector('main .entry-content, main .wp-block-post-content');
    if (main && window.MutationObserver) {
      var obs = new MutationObserver(function () { if (fn()) obs.disconnect(); });
      obs.observe(main, { childList: true, subtree: true });
      setTimeout(function () { fn(); obs.disconnect(); }, 4000);
    }
  }

  function buildHomeReviews() {
    if (document.getElementById('pa2-reviews')) return true;
    if (typeof window.PABuildGoogleReviews !== 'function') return false;

    var section = window.PABuildGoogleReviews();
    if (!section) return false;
    section.setAttribute('data-pa-atmosphere', 'neutral');

    var closing = document.getElementById('pa-home-closing');
    var main = document.querySelector('main .entry-content, main .wp-block-post-content');
    if (closing && closing.parentNode) {
      closing.parentNode.insertBefore(section, closing);
    } else if (main) {
      main.appendChild(section);
    } else {
      return false;
    }

    requestAnimationFrame(function () { section.classList.add('is-ready'); });
    refreshHomeScrollReveal(section);
    return true;
  }

  function buildHomeBookingCta() {
    var band = document.getElementById('pa-home-closing');
    var existing = document.querySelector('.pa2-cta--enhanced');
    if (existing && existing.querySelector('.pa2-cta__btn--primary')) {
      return true;
    }

    var main = document.querySelector('main .entry-content, main .wp-block-post-content');
    if (!band && main) {
      band = document.createElement('section');
      band.id = 'pa-home-closing';
      main.appendChild(band);
    }
    if (!band) return false;

    var booking = main && main.querySelector(':scope > .pa-booking-root');
    if (booking) {
      booking.classList.add('pa-booking-root--home-embed');
      booking.setAttribute('aria-hidden', 'true');
    }

    band.className = 'pa-home-closing pa2-cta pa2-cta--enhanced pa-reveal-section section-reveal';
    band.setAttribute('data-pa-atmosphere', 'calm');
    band.setAttribute('data-parallax', '0.15');
    band.classList.add('parallax');
    band.setAttribute('aria-labelledby', 'pa2-cta-title');
    while (band.firstChild) band.removeChild(band.firstChild);

    var parallaxBg = document.createElement('div');
    parallaxBg.className = 'pa2-cta__parallax-bg';
    parallaxBg.setAttribute('aria-hidden', 'true');
    parallaxBg.setAttribute('data-parallax', '0.15');
    band.appendChild(parallaxBg);

    var inner = document.createElement('div');
    inner.className = 'pa2-cta__inner';

    var eyebrow = document.createElement('p');
    eyebrow.className = 'pa2-cta__eyebrow';
    eyebrow.textContent = 'Pennsylvania Media Arts';
    inner.appendChild(eyebrow);

    var title = document.createElement('h2');
    title.className = 'pa2-cta__title';
    title.id = 'pa2-cta-title';
    title.textContent = 'Let\u2019s reserve your date';
    inner.appendChild(title);

    var lead = document.createElement('p');
    lead.className = 'pa2-cta__lead';
    var depositUsd = (window.PASite && PASite.depositUsd) ? PASite.depositUsd : '150';
    lead.textContent = 'Most bookings take about two minutes — choose your service, pick a date, and secure your spot with a $' + depositUsd + ' deposit.';
    inner.appendChild(lead);

    var actions = document.createElement('div');
    actions.className = 'pa2-cta__actions';
    var primary = document.createElement('a');
    primary.className = 'pa2-cta__btn pa2-cta__btn--primary';
    primary.href = bookLink();
    primary.textContent = 'Book now';
    var secondary = document.createElement('a');
    secondary.className = 'pa2-cta__btn pa2-cta__btn--secondary';
    secondary.href = '#pa-portfolio';
    secondary.textContent = 'View work';
    actions.appendChild(primary);
    actions.appendChild(secondary);
    inner.appendChild(actions);

    var trust = document.createElement('ul');
    trust.className = 'pa2-cta__trust';
    trust.setAttribute('aria-label', 'Booking reassurance');
    [
      'Live availability',
      'Secure deposit',
      'Proposal after booking',
      '~2 min booking'
    ].forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'pa2-cta__trust-item';
      li.textContent = item;
      trust.appendChild(li);
    });
    inner.appendChild(trust);

    band.appendChild(inner);
    band.classList.add('is-inview', 'is-ready');
    inner.classList.add('is-revealed', 'is-visible', 'is-animated');
    requestAnimationFrame(function () { band.classList.add('is-ready'); });
    refreshHomeScrollReveal(band);
    return true;
  }
})();
