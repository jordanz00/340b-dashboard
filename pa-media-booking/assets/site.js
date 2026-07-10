(function () {
  'use strict';

  if (
    !document.body.classList.contains('wp-theme-gutenify-photography') &&
    !document.body.classList.contains('pa-glass-site')
  ) {
    return;
  }

  var LOGO_SIZE = 84;
  var HEADER_LOGO_SIZE = 740;

  // Portfolio config — declared here, ABOVE the init calls below, so the
  // portfolio builders (which run during the synchronous bootstrap) never
  // read an unassigned value. A `var` assignment is not hoisted, so leaving
  // this lower in the file caused a "Cannot read properties of undefined
  // (reading 'forEach')" crash that aborted bootstrap before the gallery
  // could render.
  var PORTFOLIO_INITIAL_VISIBLE = 12;
  /** Home shows the full gallery; interior pages collapse with "View all". */
  var PORTFOLIO_HOME_VISIBLE = 9999;
  var PORTFOLIO_EAGER_TILES = 4;
  var portfolioImageObserver = null;
  var PORTFOLIO_CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'video', label: 'Video', match: /video|film|cinematic|reel|videography|brand film/i },
    { id: 'motion', label: 'Motion', match: /motion|animation|graphics|after effects/i },
    { id: 'branding', label: 'Branding', match: /brand|logo|identity|rebrand/i },
    { id: 'web', label: 'Web Design', match: /web|website|digital presence|landing page/i },
    { id: 'campaign', label: 'Campaigns', match: /campaign|commercial|advertising|marketing/i },
    { id: 'photo', label: 'Photography', match: /portrait|headshot|photo|engagement|still/i },
    { id: 'wedding', label: 'Weddings', match: /wedding|bride|groom|ceremony|reception/i },
    { id: 'live', label: 'Live events', match: /concert|festival|live|stage|performance|dj|audio/i },
    { id: 'corporate', label: 'Corporate', match: /corporate|business|conference/i },
  ];
  var YT_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
  var YT_HREF_RE = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/;
  var videoLightbox = null; // cached overlay element + controls
  var rebindGalleryLightbox = null;
  var galleryFocusTrapRelease = null;
  var videoFocusTrapRelease = null;

  /**
   * Fire GA4 custom events when Measurement ID is configured (class-seo.php).
   *
   * @param {string} name
   * @param {Object} [params]
   */
  function paGa4Event(name, params) {
    if (window.PAGA4 && typeof window.PAGA4.event === 'function') {
      window.PAGA4.event(name, params || {});
    }
  }

  /**
   * Trap keyboard focus inside a modal overlay; ESC calls onClose.
   *
   * @param {HTMLElement} container
   * @param {{onClose?: function}} options
   * @returns {function} release trap
   */
  function paA11yFocusTrap(container, options) {
    options = options || {};
    var selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function focusables() {
      return Array.prototype.slice.call(container.querySelectorAll(selector)).filter(function (el) {
        return !el.hidden && !el.disabled && el.getAttribute('aria-hidden') !== 'true';
      });
    }

    function onKeyDown(e) {
      if (e.key === 'Escape' && options.onClose) {
        e.preventDefault();
        options.onClose(e);
        return;
      }
      if (e.key !== 'Tab') {
        return;
      }
      var nodes = focusables();
      if (!nodes.length) {
        return;
      }
      var first = nodes[0];
      var last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    container.addEventListener('keydown', onKeyDown);
    return function release() {
      container.removeEventListener('keydown', onKeyDown);
    };
  }

  function ensureMainLandmark() {
    var main = document.getElementById('main-content') || document.querySelector('main');
    if (!main) {
      return;
    }
    if (!main.id) {
      main.id = 'main-content';
    }
    if (!main.hasAttribute('tabindex')) {
      main.setAttribute('tabindex', '-1');
    }
  }

  function initNavAriaCurrent() {
    var path = (window.location.pathname || '/').replace(/\/$/, '') || '/';
    document.querySelectorAll(
      'header .wp-block-navigation-item__content, header .pa-site-nav-pill, header .pa-nav-book a'
    ).forEach(function (link) {
      var href = link.getAttribute('href') || '';
      if (!href || href.charAt(0) !== '/') {
        return;
      }
      var linkPath = href.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
      var isCurrent = linkPath === path;
      if (isCurrent) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function initBookCtaAnalytics() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest(
        '.pa-nav-book a, .pa-nav-book-btn, .pa2-hero__btn--primary, .pa-services-book-btn, ' +
        '.pa2-svc-card__btn--primary, .pa2-work-cta__btn, .pa-about-cta-btn, .pa-geo-landing__cta, ' +
        '.pa2-services__cta, .pa-home-closing-btn-primary'
      );
      if (!t) {
        return;
      }
      var href = t.getAttribute('href') || '';
      if (href.indexOf('/book') === -1) {
        return;
      }
      paGa4Event('book_cta_click', { link_url: href, page_path: window.location.pathname });
    }, true);
  }

  function captureUtmParams() {
    try {
      var qs = new URLSearchParams(window.location.search);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) {
        var v = qs.get(k);
        if (v) {
          sessionStorage.setItem('pa_' + k, v.slice(0, 120));
        }
      });
    } catch (err) {
      /* sessionStorage unavailable */
    }
  }

  function wirePortfolioFilterKeyboard(filters) {
    var tabs = filters.querySelectorAll('[role="tab"]');
    filters.addEventListener('keydown', function (e) {
      var idx = -1;
      tabs.forEach(function (tab, i) {
        if (tab === document.activeElement) {
          idx = i;
        }
      });
      if (idx < 0) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        var next = e.key === 'ArrowRight' ? idx + 1 : idx - 1;
        if (next < 0) {
          next = tabs.length - 1;
        }
        if (next >= tabs.length) {
          next = 0;
        }
        tabs[next].focus();
        tabs[next].click();
      }
    });
  }

  /** True when a footer script tag is present (may not have executed yet). */
  function hasQueuedScript(srcPart) {
    return !!document.querySelector('script[src*="' + srcPart + '"]');
  }

  ensureViewportFit();

  applySiteLogo();
  initBrandLogos();
  watchBrandLogos();
  removeContactNavLinks();
  addNavBookLink();
  addNavPortfolioLink();
  polishHeaderNav();
  rebuildSiteFooter();
  enhanceSocialLinks();
  polishFooter();
  suppressLegacyThemeBlocks();
  injectLegalFooter();
  polishFooterNav();
  applyGlassLayout();
  removeBookingStatusLinks();
  normalizeBookLinks();
  redirectLegacyBookAnchors();
  initSectionHashNav();
  ensureMainLandmark();
  initNavAriaCurrent();
  initBookCtaAnalytics();
  captureUtmParams();

  if (document.body.classList.contains('home')) {
    relocateHomeShellFromHeader();
    var homeShellQueued = hasQueuedScript('home.js');
    if (!homeShellQueued) {
      buildHomeHero();
      injectServicesGrid();
      buildHomeClosingBand();
    }
    removeVideoPortfolioGrid();
    injectYoutubeFeature();
    schedulePortfolioShowcase();
    schedulePhotoPortfolioShowcase();
    hideDuplicateBookingColumn();
    markSectionAnchors();
    reorderHomeSections();
    removeBlockedYoutubeContent();
    polishHomeHeader();
    finalizeHomeExperience();
  } else if (isBookingPage()) {
    document.body.classList.add('pa-booking-page');
    polishBookingPage();
  } else if (isServicesPage()) {
    compactInteriorPageHeader();
    if (!hasQueuedScript('services.js')) {
      buildServicesPage();
    }
  } else if (isAboutPage()) {
    compactInteriorPageHeader();
    buildAboutPage();
  } else if (isWorkPage()) {
    compactInteriorPageHeader();
    buildWorkPage();
  }

  initGalleryLightbox();
  if (window.PAAnimations && typeof window.PAAnimations.refresh === 'function') {
    window.PAAnimations.refresh();
  }
  initMobileBookBar();
  initBookLinkPrefetch();
  window.PAForceRevealHomeClosing = forceRevealHomeClosing;
  window.PAForceRevealHomeExperience = forceRevealHomeExperience;
  window.PARelocateHomeShellFromHeader = relocateHomeShellFromHeader;
  window.PARelocateHomeChromeBelowHero = relocateHomeChromeAboveHero;
  window.PAFinalizeHomeExperience = finalizeHomeExperience;
  window.PAPolishHomeHeader = polishHomeHeader;
  window.PACompactInteriorPageHeader = compactInteriorPageHeader;
  window.PAPolishMarketingHeaderNav = polishMarketingHeaderNav;
  window.PAForceRevealServicesPage = forceRevealServicesPage;
  window.PASuppressLegacyThemeBlocks = suppressLegacyThemeBlocks;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', suppressLegacyThemeBlocks);
  } else {
    window.setTimeout(suppressLegacyThemeBlocks, 0);
  }

  function applyBrandLogo(container, size) {
    var logoWrap = container.querySelector('.wp-block-site-logo');
    if (!logoWrap) {
      return;
    }
    logoWrap.classList.add('pa-brand-logo-wrap');
    var logoLink = logoWrap.querySelector('a');
    if (logoLink) {
      logoLink.setAttribute('aria-label', PASite.siteName || 'Home');
    }
  }

  function brandLogoUrl(variant) {
    if (variant === 'white' && window.PASite && PASite.logoWhiteUrl) {
      return PASite.logoWhiteUrl;
    }
    if (window.PASite && PASite.logoDarkUrl) {
      return PASite.logoDarkUrl;
    }
    return pluginAsset(variant === 'white' ? 'pa-logo-white.png' : 'pa-logo-dark.png');
  }

  function isFooterScope(node) {
    return !!(node && node.closest('footer'));
  }

  function patchLogoImage(img, variant) {
    if (!img) {
      return;
    }
    var url = brandLogoUrl(variant);
    if (!url) {
      return;
    }
    img.src = url;
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.removeAttribute('data-src');
    img.removeAttribute('data-srcset');
    img.removeAttribute('width');
    img.removeAttribute('height');
    img.loading = 'eager';
    img.decoding = 'sync';
    img.classList.add('pa-brand-logo');
    img.classList.remove('pa-brand-logo-lockup', 'pa-brand-logo-lockup-white');
    if (variant === 'white') {
      img.classList.add('pa-brand-logo-lockup-white');
      img.alt = '';
    } else {
      img.classList.add('pa-brand-logo-lockup');
      img.alt = (window.PASite && PASite.siteName) || 'Pennsylvania Media Arts';
    }
    var wrap = img.closest('.wp-block-site-logo');
    if (wrap) {
      wrap.classList.add('pa-brand-logo-wrap');
      if (variant === 'white') {
        wrap.classList.add('pa-brand-logo-wrap-lockup');
      }
    }
  }

  function applyLogosInScope(scope, variant) {
    if (!scope) {
      return;
    }
    scope.querySelectorAll('.wp-block-site-logo img, .wp-block-site-logo picture img, img.custom-logo, a.custom-logo-link img').forEach(function (img) {
      patchLogoImage(img, variant);
    });
    scope.querySelectorAll('.wp-block-site-logo picture source').forEach(function (source) {
      source.remove();
    });
  }

  function initBrandLogos() {
    if (!window.PASite) {
      return;
    }

    var header = document.querySelector('header.pa-site-header, header.wp-block-template-part');
    if (header) {
      var headerLogoVariant = 'dark';
      if (document.body.classList.contains('home') && !document.body.classList.contains('pa-home-chrome-above-hero')) {
        headerLogoVariant = 'white';
      }
      applyLogosInScope(header, headerLogoVariant);
      document.querySelectorAll('.wp-block-navigation__responsive-container').forEach(function (overlay) {
        applyLogosInScope(overlay, 'dark');
      });
      var wordmark = header.querySelector('.pa-brand-wordmark, .wp-block-site-title');
      if (wordmark) {
        wordmark.classList.add('pa-brand-hidden');
      }
      var tagline = header.querySelector('.pa-brand-tagline');
      if (tagline) {
        tagline.classList.add('pa-brand-hidden');
      }
      header.classList.add('pa-brand-lockup-mode');
    }

    var footer = document.querySelector('footer.pa-site-footer, footer.wp-block-template-part');
    if (footer) {
      applyLogosInScope(footer, 'white');
    }

    document.querySelectorAll(
      'header .wp-block-site-logo img, .wp-block-navigation__responsive-container .wp-block-site-logo img, header img.custom-logo, .wp-block-navigation__responsive-container img.custom-logo'
    ).forEach(function (img) {
      if (!isFooterScope(img)) {
        var variant = 'dark';
        if (document.body.classList.contains('home') && !document.body.classList.contains('pa-home-chrome-above-hero')) {
          variant = 'white';
        }
        patchLogoImage(img, variant);
      }
    });

    document.documentElement.classList.add('pa-brand-ready');
  }

  function watchBrandLogos() {
    if (!window.MutationObserver) {
      return;
    }
    var queued = false;
    function scheduleLogoRefresh() {
      if (queued) {
        return;
      }
      queued = true;
      window.requestAnimationFrame(function () {
        queued = false;
        initBrandLogos();
      });
    }

    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === 'childList' && m.addedNodes.length) {
          scheduleLogoRefresh();
          return;
        }
        if (m.type === 'attributes' && m.target && m.target.tagName === 'IMG' && (m.attributeName === 'src' || m.attributeName === 'srcset')) {
          scheduleLogoRefresh();
          return;
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'srcset'],
    });

    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) {
        return;
      }
      if (t.closest('.wp-block-navigation__responsive-container-open, .wp-block-navigation__responsive-container-close')) {
        window.setTimeout(scheduleLogoRefresh, 60);
      }
    });

    window.addEventListener('pageshow', scheduleLogoRefresh);
    document.addEventListener('DOMContentLoaded', initBrandLogos);
  }

  function ensureViewportFit() {
    var vp = document.querySelector('meta[name="viewport"]');
    if (!vp) {
      vp = document.createElement('meta');
      vp.setAttribute('name', 'viewport');
      document.head.appendChild(vp);
    }
    var content = vp.getAttribute('content') || '';
    var parts = content
      .split(',')
      .map(function (part) {
        return part.trim();
      })
      .filter(Boolean);
    var hasWidth = parts.some(function (part) {
      return part.indexOf('width=') === 0;
    });
    var hasFit = parts.some(function (part) {
      return part.indexOf('viewport-fit') !== -1;
    });
    if (!hasWidth) {
      parts.unshift('width=device-width, initial-scale=1');
    }
    if (!hasFit) {
      parts.push('viewport-fit=cover');
    }
    vp.setAttribute('content', parts.join(', '));
  }

  function applySiteLogo() {
    var header = document.querySelector('header.wp-block-template-part');
    if (header) {
      header.classList.add('pa-site-header');
    }

    var footer = document.querySelector('footer.wp-block-template-part');
    if (footer) {
      footer.classList.add('pa-site-footer');
    }

    if (!window.PASite || !PASite.logoUrl) {
      return;
    }

    if (header) {
      applyBrandLogo(header, HEADER_LOGO_SIZE);
      var title = header.querySelector('.wp-block-site-title');
      if (title) {
        title.classList.add('pa-brand-wordmark');
        var titleLink = title.querySelector('a');
        if (titleLink) {
          titleLink.textContent = PASite.siteName || 'Pennsylvania Media Arts LLC';
        }
        var taglineText = PASite.tagline || 'Photography, video & live production · Pennsylvania';
        var tagline = header.querySelector('.pa-brand-tagline');
        if (!tagline) {
          tagline = document.createElement('p');
          tagline.className = 'pa-brand-tagline';
          title.parentNode.appendChild(tagline);
        }
        tagline.textContent = taglineText;
        if (isBookingPage()) {
          tagline.classList.add('pa-brand-tagline-compact');
        }
      }
      var logoWrap = header.querySelector('.wp-block-site-logo');
      var lockup = logoWrap && logoWrap.closest('.wp-block-group');
      if (lockup) {
        lockup.classList.add('pa-brand-lockup');
      }
    }

    if (footer) {
      applyBrandLogo(footer);
    }
  }

  /**
   * Resolve a file in the plugin's /assets/ folder by reading the URL of the
   * already-loaded site.js script. Avoids hard-coding the WordPress path.
   */
  function pluginAsset(name) {
    var script =
      document.currentScript ||
      document.querySelector('script[src*="/assets/site.js"]');
    if (!script) {
      return null;
    }
    var src = (script.getAttribute('src') || '').split('?')[0];
    if (src.indexOf('site.js') === -1) {
      return null;
    }
    var url = src.replace(/site\.js$/, name);
    // Append the plugin version so updated images (e.g. the logo) bust the cache.
    var ver = window.PASite && PASite.assetVersion;
    return ver ? url + '?v=' + encodeURIComponent(ver) : url;
  }

  function isContactHref(href) {
    if (!href) {
      return false;
    }
    try {
      var path = new URL(href, window.location.origin).pathname.replace(/\/$/, '').toLowerCase();
      return path === '/contact' || path.endsWith('/contact');
    } catch (e) {
      return /\/contact\/?$/i.test(href);
    }
  }

  function isContactNavLabel(label) {
    return (label || '').replace(/\s+/g, ' ').trim().toLowerCase() === 'contact';
  }

  /**
   * Remove Contact from header/footer nav — booking is the only pre-deposit path.
   */
  function removeContactNavLinks() {
    document.querySelectorAll('.wp-block-navigation a.wp-block-navigation-item__content').forEach(function (a) {
      var label = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (!isContactNavLabel(label) && !isContactHref(a.href)) {
        return;
      }
      var item = a.closest('.wp-block-navigation-item, li');
      if (item && item.parentNode) {
        item.parentNode.removeChild(item);
      }
    });
  }

  function addNavBookLink() {
    var nav = document.querySelector('.wp-block-navigation ul');
    if (!nav || nav.querySelector('.pa-nav-book')) {
      return;
    }
    var li = document.createElement('li');
    li.className = 'wp-block-navigation-item pa-nav-book';
    var a = document.createElement('a');
    a.className = 'wp-block-navigation-item__content';
    a.href = bookingUrl();
    var label = document.createElement('span');
    label.className = 'wp-block-navigation-item__label';
    label.textContent = 'Book';
    a.appendChild(label);
    li.appendChild(a);
    nav.appendChild(li);
  }

  /**
   * Header nav — Work link (home scrolls to portfolio; other pages go to /work/).
   */
  function workPageUrl() {
    return (window.PASite && PASite.workUrl) ? PASite.workUrl : '/work/';
  }

  function addNavPortfolioLink() {
    var nav = document.querySelector('header .wp-block-navigation ul');
    if (!nav) {
      return;
    }
    var workHref = document.body.classList.contains('home') ? '#pa-portfolio' : workPageUrl();
    var existing = nav.querySelector('.pa-nav-portfolio');
    if (existing) {
      var existingLink = existing.querySelector('a');
      if (existingLink) {
        existingLink.href = workHref;
      }
      return;
    }
    var li = document.createElement('li');
    li.className = 'wp-block-navigation-item pa-nav-portfolio';
    var a = document.createElement('a');
    a.className = 'wp-block-navigation-item__content';
    a.href = workHref;
    var label = document.createElement('span');
    label.className = 'wp-block-navigation-item__label';
    label.textContent = 'Work';
    a.appendChild(label);
    li.appendChild(a);
    var bookItem = nav.querySelector('.pa-nav-book');
    if (bookItem && bookItem.parentNode) {
      bookItem.parentNode.insertBefore(li, bookItem);
    } else {
      nav.appendChild(li);
    }
  }

  function inferPortfolioCategory(alt) {
    var text = (alt || '').trim();
    if (!text) {
      return 'uncategorized';
    }
    for (var i = 1; i < PORTFOLIO_CATEGORIES.length; i++) {
      if (PORTFOLIO_CATEGORIES[i].match.test(text)) {
        return PORTFOLIO_CATEGORIES[i].id;
      }
    }
    return 'uncategorized';
  }

  function portfolioCategoryLabel(catId) {
    if (window.PAPortfolio && typeof PAPortfolio.categoryLabel === 'function') {
      return PAPortfolio.categoryLabel(catId);
    }
    for (var c = 0; c < PORTFOLIO_CATEGORIES.length; c++) {
      if (PORTFOLIO_CATEGORIES[c].id === catId) {
        return PORTFOLIO_CATEGORIES[c].label;
      }
    }
    return 'Work';
  }

  /**
   * Parse gallery alt into title + creative statement.
   * Convention: "Title — Short creative statement"
   *
   * @param {string} alt
   * @returns {{title: string, statement: string}}
   */
  function parsePortfolioAlt(alt) {
    var text = (alt || '').trim();
    var title = text || 'View project';
    var statement = '';
    var dash = text.indexOf(' — ');
    if (dash === -1) {
      dash = text.indexOf(' - ');
    }
    if (dash !== -1) {
      title = text.slice(0, dash).trim();
      statement = text.slice(dash + 3).trim();
    } else if (text.indexOf('|') !== -1) {
      var parts = text.split('|');
      title = parts[0].trim();
      statement = parts.slice(1).join('|').trim();
    }
    return { title: title, statement: statement };
  }

  /**
   * Premium tile overlay: category, title, statement, view pill.
   *
   * @param {HTMLElement} figure
   * @param {string} alt
   * @param {string} categoryId
   */
  function appendPortfolioTileOverlay(figure, alt, categoryId) {
    if (document.body.classList.contains('home') || document.body.classList.contains('pa-work-page')) {
      return;
    }
    var overlay = figure.querySelector('.pa-portfolio-tile-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'pa-portfolio-tile-overlay';
      figure.appendChild(overlay);
    }
    while (overlay.firstChild) {
      overlay.removeChild(overlay.firstChild);
    }
    var parsed = parsePortfolioAlt(alt);
    var catEl = document.createElement('span');
    catEl.className = 'pa-portfolio-tile-category';
    catEl.textContent = portfolioCategoryLabel(categoryId);
    overlay.appendChild(catEl);
    var titleEl = document.createElement('span');
    titleEl.className = 'pa-portfolio-tile-title';
    titleEl.textContent = parsed.title;
    overlay.appendChild(titleEl);
    if (parsed.statement) {
      var stmt = document.createElement('span');
      stmt.className = 'pa-portfolio-tile-statement';
      stmt.textContent = parsed.statement;
      overlay.appendChild(stmt);
    }
    var view = document.createElement('span');
    view.className = 'pa-portfolio-tile-view';
    view.textContent = 'View';
    view.setAttribute('aria-hidden', 'true');
    overlay.appendChild(view);
  }

  function refreshPortfolioExperience(root) {
    if (window.PAPortfolio && typeof PAPortfolio.refresh === 'function') {
      PAPortfolio.refresh(root || document);
    }
  }

  /** Collapse threshold — home shows all photos; /work/ uses expand. */
  function portfolioCollapseLimit() {
    return document.body.classList.contains('home') ? PORTFOLIO_HOME_VISIBLE : PORTFOLIO_INITIAL_VISIBLE;
  }

  /**
   * "View all" for collapsed grids (work page). Home skips collapse so this is not shown there.
   *
   * @param {HTMLElement} grid
   * @param {number} tileCount
   * @param {HTMLElement} parent
   * @returns {HTMLElement|null}
   */
  function attachPortfolioExpandButton(grid, tileCount, parent) {
    if (tileCount <= portfolioCollapseLimit()) {
      return null;
    }
    var expandWrap = document.createElement('div');
    expandWrap.className = 'pa-portfolio-expand-wrap';
    var expandBtn = document.createElement('button');
    expandBtn.type = 'button';
    expandBtn.className = 'pa-portfolio-expand';
    expandBtn.textContent = 'View all ' + tileCount + ' photos';
    expandBtn.addEventListener('click', function () {
      grid.classList.add('is-expanded');
      var expanded = grid.querySelectorAll('.pa-portfolio-tile.is-collapsed');
      expanded.forEach(function (tile, i) {
        tile.classList.remove('is-collapsed');
        tile.style.setProperty('--pa-tile-i', String(i));
        var img = tile.querySelector('img');
        if (!img) {
          return;
        }
        if (img.dataset.paDeferred === '1') {
          optimizePortfolioTileImage(img, i);
        } else if (img.dataset.paTileQueued === '1') {
          loadQueuedPortfolioTileImage(img, i);
        }
      });
      revealPortfolioTiles(expanded);
      refreshScrollReveal(parent || grid.closest('.pa-portfolio-showcase, #pa-portfolio, #pa-photo-portfolio') || grid);
      expandBtn.hidden = true;
    });
    expandWrap.appendChild(expandBtn);
    return expandWrap;
  }

  function ensurePortfolioImageObserver() {
    if (portfolioImageObserver || !('IntersectionObserver' in window)) {
      return;
    }
    portfolioImageObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }
        var img = entry.target;
        var idx = parseInt(img.dataset.paTileIndex || '0', 10);
        loadQueuedPortfolioTileImage(img, idx);
        portfolioImageObserver.unobserve(img);
      });
    }, { rootMargin: '480px 0px', threshold: 0.01 });
  }

  /** Defer network for below-fold home tiles until they approach the viewport. */
  function queuePortfolioTileImage(img, tileIndex) {
    if (!img || img.dataset.paOptimized === '1' || img.dataset.paTileQueued === '1') {
      return;
    }
    img.dataset.paTileQueued = '1';
    img.dataset.paTileIndex = String(tileIndex);
    reservePortfolioImageDimensions(img);
    img.decoding = 'async';
    img.loading = 'lazy';
    var tile = img.closest('.pa-portfolio-tile');
    if (tile) {
      tile.classList.add('is-pa-img-pending');
    }
    if (img.src && !img.dataset.paQueuedSrc) {
      img.dataset.paQueuedSrc = img.src;
      var srcset = img.getAttribute('srcset');
      if (srcset) {
        img.dataset.paQueuedSrcset = srcset;
      }
      img.removeAttribute('src');
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
    }
    ensurePortfolioImageObserver();
    if (portfolioImageObserver) {
      portfolioImageObserver.observe(img);
      return;
    }
    loadQueuedPortfolioTileImage(img, tileIndex);
  }

  function loadQueuedPortfolioTileImage(img, tileIndex) {
    if (!img || img.dataset.paOptimized === '1') {
      return;
    }
    delete img.dataset.paTileQueued;
    if (!img.src && img.dataset.paQueuedSrc) {
      img.src = img.dataset.paQueuedSrc;
      if (img.dataset.paQueuedSrcset) {
        img.setAttribute('srcset', img.dataset.paQueuedSrcset);
      }
    }
    optimizePortfolioTileImage(img, tileIndex);
  }

  /** Route tile images through collapse defer or immediate optimize (browser lazy-load). */
  function preparePortfolioTileImage(img, tileIndex) {
    if (!img) {
      return;
    }
    if (tileIndex >= portfolioCollapseLimit()) {
      deferPortfolioTileImage(img);
      return;
    }
    optimizePortfolioTileImage(img, tileIndex);
  }

  function removeBookingStatusLinks() {
    document.querySelectorAll('.pa-booking-status-link').forEach(function (el) {
      el.remove();
    });
  }

  /** WordPress gallery blocks that hold portfolio photos on the home page. */
  function findPortfolioGalleries() {
    return document.querySelectorAll(
      '.entry-content .wp-block-gallery.alignfull, .entry-content figure.wp-block-gallery.has-nested-images'
    );
  }

  /**
   * Collect image figures from a gallery — handles nested blocks and late CoBlocks hydration.
   */
  function collectGalleryFigures(gallery) {
    var figures = [];
    var seen = [];

    function pushFigure(figure) {
      if (!figure || seen.indexOf(figure) !== -1) {
        return;
      }
      if (!figure.querySelector('img')) {
        return;
      }
      seen.push(figure);
      figures.push(figure);
    }

    gallery.querySelectorAll(':scope > figure.wp-block-image, :scope > .wp-block-image').forEach(pushFigure);
    if (!figures.length) {
      gallery.querySelectorAll(':scope figure.wp-block-image').forEach(pushFigure);
    }
    if (!figures.length) {
      gallery.querySelectorAll('img').forEach(function (img) {
        pushFigure(img.closest('figure') || img.parentElement);
      });
    }
    return figures;
  }

  function ensurePortfolioLabel(beforeNode) {
    if (document.getElementById('pa-portfolio-label') || !beforeNode || !beforeNode.parentNode) {
      return document.getElementById('pa-portfolio-label');
    }
    var label = document.createElement('div');
    label.id = 'pa-portfolio-label';
    label.className = 'pa-section-head pa-portfolio-head';
    document.body.classList.add('pa-has-portfolio-head');
    var eyebrow = document.createElement('p');
    eyebrow.className = 'pa-section-eyebrow';
    eyebrow.textContent = 'Selected work';
    var h2 = document.createElement('h2');
    h2.className = 'pa-section-title';
    h2.textContent = 'Portfolio';
    label.appendChild(eyebrow);
    label.appendChild(h2);
    var lead = document.createElement('p');
    lead.className = 'pa-section-lead pa-portfolio-lead';
    lead.textContent = 'Pennsylvania weddings, concerts, and brand stories — tap any image for full-screen viewing.';
    label.appendChild(lead);
    beforeNode.parentNode.insertBefore(label, beforeNode);
    return label;
  }

  /** Remove orphan portfolio heading left when a prior build stripped galleries with zero tiles. */
  function resetBrokenPortfolioHead() {
    var label = document.getElementById('pa-portfolio-label');
    if (!label || document.getElementById('pa-portfolio')) {
      return;
    }
    if (findPortfolioGalleries().length) {
      return;
    }
    label.remove();
    document.body.classList.remove('pa-has-portfolio-head');
  }

  /** Remove legacy video tile grid and editorial portfolio on home (photo grid replaces both). */
  function removeVideoPortfolioGrid() {
    var videoShowcase = document.querySelector(
      '#pa-portfolio.pa-portfolio-showcase--video, .pa-portfolio-showcase--video'
    );
    if (videoShowcase && videoShowcase.parentNode) {
      videoShowcase.parentNode.removeChild(videoShowcase);
    }
    if (document.body.classList.contains('home')) {
      var editorial = document.getElementById('pa-portfolio');
      if (editorial && editorial.classList.contains('pa-portfolio-showcase') &&
          !editorial.classList.contains('pa-portfolio-showcase--photos') &&
          editorial.parentNode) {
        editorial.parentNode.removeChild(editorial);
      }
    }
    var label = document.getElementById('pa-portfolio-label');
    if (label && !document.getElementById('pa-photo-portfolio') &&
        !document.querySelector('.pa-portfolio-showcase')) {
      label.parentNode.removeChild(label);
    }
    if (!document.querySelector('.pa-portfolio-showcase')) {
      document.body.classList.remove('pa-has-portfolio-showcase', 'pa-has-portfolio-head');
    }
  }

  /** Retry portfolio build until gallery images hydrate; fall back to styled WP galleries. */
  function schedulePortfolioShowcase() {
    if (document.getElementById('pa-photo-portfolio')) {
      return;
    }
    if (document.getElementById('pa-portfolio') || document.querySelector('.pa-portfolio-showcase')) {
      schedulePhotoPortfolioShowcase();
      return;
    }

    // Home and /work/ use the uniform photo grid — not the editorial filter grid.
    if (document.body.classList.contains('home') || document.body.classList.contains('pa-work-page')) {
      resetBrokenPortfolioHead();
      if (!document.body.classList.contains('pa-work-page') && !findPortfolioGalleries().length) {
        polishFallbackGalleries();
      }
      if (document.body.classList.contains('pa-work-page')) {
        schedulePhotoPortfolioShowcase();
      }
      return;
    }

    resetBrokenPortfolioHead();

    var tries = 0;
    var maxTries = 60;
    var observer = null;
    var stopTimer = null;

    function finish(success) {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (stopTimer) {
        clearTimeout(stopTimer);
        stopTimer = null;
      }
      if (!success) {
        polishFallbackGalleries();
      }
    }

    function attempt() {
      if (buildPortfolioShowcase()) {
        finish(true);
        return;
      }
      tries += 1;
      if (tries >= maxTries) {
        finish(false);
        return;
      }
      requestAnimationFrame(attempt);
    }

    attempt();

    var main = document.querySelector('main .entry-content, main .wp-block-post-content');
    if (main && 'MutationObserver' in window) {
      observer = new MutationObserver(function () {
        if (buildPortfolioShowcase()) {
          finish(true);
        }
      });
      observer.observe(main, { childList: true, subtree: true });
      stopTimer = setTimeout(function () {
        finish(buildPortfolioShowcase());
      }, 8000);
    }
  }

  /** Style native WP galleries when the merged showcase cannot be built. */
  function polishFallbackGalleries() {
    var galleries = findPortfolioGalleries();
    if (!galleries.length) {
      return;
    }
    document.body.classList.add('pa-portfolio-fallback');
    ensurePortfolioLabel(galleries[0]);
    Array.prototype.forEach.call(galleries, function (gallery) {
      gallery.classList.add('pa-portfolio-fallback-gallery');
      gallery.querySelectorAll('img').forEach(function (img, i) {
        optimizePortfolioTileImage(img, i);
      });
    });
    if (typeof rebindGalleryLightbox === 'function') {
      rebindGalleryLightbox();
    }
    refreshScrollReveal();
  }

  /* ============================================================ *
   * Video portfolio — professional gallery built from the
   * @PAMediaArts YouTube reel. Each tile is a high-resolution
   * thumbnail; tapping plays the film full-screen in a lightbox.
   * This is the live portfolio source when no WordPress photo
   * galleries are present on the page.
   * ============================================================ */

  /** Blocked YouTube ids from PASite (deleted / private clips). */
  function getBlockedYoutubeIds() {
    var ids = (window.PASite && PASite.youtubeBlockedVideos) ? PASite.youtubeBlockedVideos : [];
    if (!Array.isArray(ids)) {
      return [];
    }
    var clean = [];
    ids.forEach(function (id) {
      if (typeof id === 'string' && YT_ID_RE.test(id) && clean.indexOf(id) === -1) {
        clean.push(id);
      }
    });
    return clean;
  }

  function parseYoutubeIdFromHref(href) {
    if (!href) {
      return '';
    }
    var match = String(href).match(YT_HREF_RE);
    return match ? match[1] : '';
  }

  function isBlockedYoutubeId(id) {
    if (!id || !YT_ID_RE.test(id)) {
      return false;
    }
    return getBlockedYoutubeIds().indexOf(id) !== -1;
  }

  /** Remove theme/editor links and embeds for deleted YouTube clips. */
  function removeBlockedYoutubeContent() {
    var blocked = getBlockedYoutubeIds();
    if (!blocked.length) {
      return;
    }
    var blockedMap = {};
    blocked.forEach(function (id) {
      blockedMap[id] = true;
    });

    document.querySelectorAll('iframe[src*="youtube"]').forEach(function (iframe) {
      var id = parseYoutubeIdFromHref(iframe.src);
      if (!id || !blockedMap[id]) {
        return;
      }
      var host = iframe.closest(
        '.wp-block-embed, .wp-block-embed__wrapper, #pa-youtube-feature, .pa-youtube-player'
      );
      if (host) {
        var section = host.closest('#pa-youtube-feature') || host;
        section.remove();
        return;
      }
      iframe.remove();
    });

    document.querySelectorAll('a[href*="youtu"]').forEach(function (link) {
      var id = parseYoutubeIdFromHref(link.href);
      if (!id || !blockedMap[id]) {
        return;
      }
      var paragraph = link.closest('p');
      if (paragraph && paragraph.parentNode && paragraph.querySelectorAll('a[href*="youtu"]').length === 1) {
        paragraph.remove();
        return;
      }
      if (!link.parentNode) {
        return;
      }
      var text = document.createElement('span');
      text.textContent = (link.textContent || '').replace(/\s+/g, ' ').trim();
      link.parentNode.replaceChild(text, link);
    });
  }

  /** Build a YouTube still-frame URL for a validated video id. */
  function youtubeThumbUrl(id, quality) {
    return 'https://i.ytimg.com/vi/' + id + '/' + quality + '.jpg';
  }

  /** Validated, de-duplicated list of portfolio video ids from PASite. */
  function getPortfolioVideoIds() {
    var ids = (window.PASite && PASite.youtubeVideos) ? PASite.youtubeVideos : [];
    if (!Array.isArray(ids)) {
      return [];
    }
    var clean = [];
    ids.forEach(function (id) {
      if (typeof id === 'string' && YT_ID_RE.test(id) &&
          clean.indexOf(id) === -1 && !isBlockedYoutubeId(id)) {
        clean.push(id);
      }
    });
    return clean;
  }

  function buildVideoPortfolioHead() {
    var head = document.createElement('div');
    head.id = 'pa-portfolio-label';
    head.className = 'pa-section-head pa-portfolio-head';
    var eyebrow = document.createElement('p');
    eyebrow.className = 'pa-section-eyebrow';
    eyebrow.textContent = 'Selected work';
    var title = document.createElement('h2');
    title.className = 'pa-section-title';
    title.textContent = 'Portfolio';
    var lead = document.createElement('p');
    lead.className = 'pa-section-lead pa-portfolio-lead';
    lead.textContent = 'Concerts, weddings, and brand films across Pennsylvania — tap any clip to watch full-screen.';
    head.appendChild(eyebrow);
    head.appendChild(title);
    head.appendChild(lead);
    document.body.classList.add('pa-has-portfolio-head');
    return head;
  }

  /**
   * One portfolio tile: a thumbnail with a play affordance.
   * Falls back from the maxres frame to hq when maxres is missing.
   */
  function buildVideoPortfolioTile(id, index) {
    var tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'pa-video-tile';
    tile.style.setProperty('--pa-tile-i', index);
    tile.setAttribute('data-video-id', id);
    tile.setAttribute('aria-label', 'Play portfolio video ' + (index + 1));

    var img = document.createElement('img');
    img.className = 'pa-video-tile-img';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = '';
    img.src = youtubeThumbUrl(id, 'maxresdefault');
    img.addEventListener('error', function onErr() {
      img.removeEventListener('error', onErr);
      img.src = youtubeThumbUrl(id, 'hqdefault');
    });
    tile.appendChild(img);

    var play = document.createElement('span');
    play.className = 'pa-video-tile-play';
    play.setAttribute('aria-hidden', 'true');
    var tri = document.createElement('span');
    tri.className = 'pa-video-tile-play-icon';
    play.appendChild(tri);
    tile.appendChild(play);

    var overlay = document.createElement('span');
    overlay.className = 'pa-video-tile-overlay';
    var chip = document.createElement('span');
    chip.className = 'pa-video-tile-view';
    chip.textContent = 'Watch';
    overlay.appendChild(chip);
    tile.appendChild(overlay);

    tile.addEventListener('click', function () {
      openVideoLightbox(index);
    });
    return tile;
  }

  /** Insert the showcase where the portfolio belongs in the page flow. */
  function placeVideoShowcase(showcase) {
    var label = document.getElementById('pa-portfolio-label');
    if (label && label.parentNode && label !== showcase) {
      label.parentNode.insertBefore(showcase, label);
      label.parentNode.removeChild(label);
      return true;
    }
    var booking = document.querySelector('.entry-content .pa-booking-root') ||
      document.querySelector('.pa-booking-root');
    if (booking && booking.parentNode) {
      if (booking.nextSibling) {
        booking.parentNode.insertBefore(showcase, booking.nextSibling);
      } else {
        booking.parentNode.appendChild(showcase);
      }
      return true;
    }
    var main = document.querySelector('main .entry-content') || document.querySelector('main');
    if (main) {
      main.appendChild(showcase);
      return true;
    }
    return false;
  }

  /**
   * Build the full video portfolio showcase.
   * Retired: home page uses a single embedded featured video instead of a tile grid.
   *
   * @returns {boolean} always false
   */
  function buildVideoPortfolio() {
    return false;
  }

  /** Mount the single featured embed after the home hero or inside /work/ shell. */
  function placeFeaturedVideoSection(section) {
    var workShell = document.getElementById('pa2-work');
    if (document.body.classList.contains('pa-work-page') && workShell) {
      var workHero = workShell.querySelector('.pa2-work-hero');
      if (workHero && workHero.nextSibling) {
        workShell.insertBefore(section, workHero.nextSibling);
      } else if (workHero) {
        workShell.appendChild(section);
      } else {
        workShell.insertBefore(section, workShell.firstChild);
      }
      return true;
    }
    var hero = document.querySelector('.pa-glass-hero-wrap') ||
      document.querySelector('.wp-block-cover.pa-home-hero') ||
      document.querySelector('.wp-block-cover.alignfull');
    if (hero && hero.parentNode) {
      if (hero.nextSibling) {
        hero.parentNode.insertBefore(section, hero.nextSibling);
      } else {
        hero.parentNode.appendChild(section);
      }
      return true;
    }
    var main = document.querySelector('main .entry-content, main .wp-block-post-content');
    if (main) {
      main.insertBefore(section, main.firstChild);
      return true;
    }
    return false;
  }

  /** Lazily create the shared full-screen video lightbox overlay. */
  function ensureVideoLightbox() {
    if (videoLightbox) {
      return videoLightbox;
    }
    var overlay = document.createElement('div');
    overlay.id = 'pa-video-lightbox';
    overlay.className = 'pa-video-lightbox';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Video player');

    var backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'pa-video-lightbox-backdrop';
    backdrop.setAttribute('aria-label', 'Close video');
    backdrop.addEventListener('click', closeVideoLightbox);

    var panel = document.createElement('div');
    panel.className = 'pa-video-lightbox-panel';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'pa-video-lightbox-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', closeVideoLightbox);

    var prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'pa-video-lightbox-nav pa-video-lightbox-prev';
    prevBtn.setAttribute('aria-label', 'Previous video');
    prevBtn.textContent = '\u2039';
    prevBtn.addEventListener('click', function () {
      stepVideoLightbox(-1);
    });

    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'pa-video-lightbox-nav pa-video-lightbox-next';
    nextBtn.setAttribute('aria-label', 'Next video');
    nextBtn.textContent = '\u203a';
    nextBtn.addEventListener('click', function () {
      stepVideoLightbox(1);
    });

    var stage = document.createElement('div');
    stage.className = 'pa-video-lightbox-stage';
    var frame = document.createElement('iframe');
    frame.className = 'pa-video-lightbox-iframe';
    frame.title = 'Pennsylvania Media Arts portfolio video';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    stage.appendChild(frame);

    var counter = document.createElement('p');
    counter.className = 'pa-video-lightbox-counter';

    panel.appendChild(closeBtn);
    panel.appendChild(prevBtn);
    panel.appendChild(nextBtn);
    panel.appendChild(stage);
    panel.appendChild(counter);
    overlay.appendChild(backdrop);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    videoLightbox = {
      overlay: overlay,
      frame: frame,
      counter: counter,
      index: 0,
      ids: [],
      lastFocus: null,
    };

    document.addEventListener('keydown', function (e) {
      if (overlay.hidden) {
        return;
      }
      if (e.key === 'Escape') {
        closeVideoLightbox();
      } else if (e.key === 'ArrowLeft') {
        stepVideoLightbox(-1);
      } else if (e.key === 'ArrowRight') {
        stepVideoLightbox(1);
      }
    });

    return videoLightbox;
  }

  function renderVideoLightbox() {
    var lb = videoLightbox;
    if (!lb || !lb.ids.length) {
      return;
    }
    var id = lb.ids[lb.index];
    if (!YT_ID_RE.test(id)) {
      return;
    }
    lb.frame.src = 'https://www.youtube-nocookie.com/embed/' + id +
      '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
    lb.counter.textContent = (lb.index + 1) + ' / ' + lb.ids.length;
  }

  function stepVideoLightbox(delta) {
    var lb = videoLightbox;
    if (!lb || !lb.ids.length) {
      return;
    }
    lb.index = (lb.index + delta + lb.ids.length) % lb.ids.length;
    renderVideoLightbox();
  }

  function openVideoLightbox(index) {
    var lb = ensureVideoLightbox();
    lb.ids = getPortfolioVideoIds();
    if (!lb.ids.length) {
      return;
    }
    lb.index = Math.max(0, Math.min(index, lb.ids.length - 1));
    lb.lastFocus = document.activeElement;
    lb.overlay.hidden = false;
    document.body.classList.add('pa-video-lightbox-open');
    renderVideoLightbox();
    if (videoFocusTrapRelease) {
      videoFocusTrapRelease();
    }
    videoFocusTrapRelease = paA11yFocusTrap(lb.overlay, { onClose: closeVideoLightbox });
    var closeBtn = lb.overlay.querySelector('.pa-video-lightbox-close');
    if (closeBtn && closeBtn.focus) {
      closeBtn.focus();
    }
  }

  function closeVideoLightbox() {
    var lb = videoLightbox;
    if (!lb || lb.overlay.hidden) {
      return;
    }
    if (videoFocusTrapRelease) {
      videoFocusTrapRelease();
      videoFocusTrapRelease = null;
    }
    lb.frame.src = ''; // stop playback
    lb.overlay.hidden = true;
    document.body.classList.remove('pa-video-lightbox-open');
    if (lb.lastFocus && typeof lb.lastFocus.focus === 'function') {
      lb.lastFocus.focus();
    }
  }

  /**
   * Merge WordPress gallery blocks into one professional portfolio grid with
   * category filters, featured layout, and expand-to-view-all.
   *
   * @returns {boolean} true when showcase was created
   */
  function buildPortfolioShowcase() {
    if (document.body.classList.contains('home')) {
      return false;
    }
    if (document.getElementById('pa-portfolio') || document.querySelector('.pa-portfolio-showcase')) {
      return true;
    }
    var galleries = findPortfolioGalleries();
    if (!galleries.length) {
      return false;
    }

    var showcase = document.createElement('section');
    showcase.className = 'pa-portfolio-showcase';
    showcase.setAttribute('aria-label', 'Portfolio gallery');

    var toolbar = document.createElement('div');
    toolbar.className = 'pa-portfolio-toolbar';

    var hint = document.createElement('p');
    hint.className = 'pa-portfolio-hint';
    hint.textContent = 'Tap to enlarge \u00b7 Swipe or use arrow keys in the viewer';

    var grid = document.createElement('div');
    grid.className = 'pa-portfolio-grid pa-portfolio-grid--editorial';
    grid.setAttribute('role', 'list');

    var categoryCounts = { all: 0 };
    var tileIndex = 0;
    var galleriesToRemove = [];

    Array.prototype.forEach.call(galleries, function (gallery) {
      var figures = collectGalleryFigures(gallery);
      if (!figures.length) {
        return;
      }
      galleriesToRemove.push(gallery);

      figures.forEach(function (figure) {
        var img = figure.querySelector('img');
        var alt = img ? (img.getAttribute('alt') || '').trim() : '';
        var isCollapsed = tileIndex >= portfolioCollapseLimit();
        if (img) {
          reservePortfolioImageDimensions(img);
          preparePortfolioTileImage(img, tileIndex);
        }
        figure.classList.remove('aligncenter', 'alignleft', 'alignright');
        figure.classList.add('pa-portfolio-tile', 'reveal-image');
        figure.setAttribute('role', 'listitem');
        figure.style.setProperty('--pa-tile-i', String(tileIndex));

        if (tileIndex === 0) {
          figure.classList.add('pa-portfolio-tile--featured');
        }
        if (isCollapsed) {
          figure.classList.add('is-collapsed');
        }
        var category = inferPortfolioCategory(alt);
        figure.setAttribute('data-pa-category', category);
        categoryCounts.all += 1;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;

        if (img) {
          appendPortfolioTileOverlay(figure, alt, category);
        }

        grid.appendChild(figure);
        tileIndex += 1;
      });
    });

    if (!tileIndex) {
      return false;
    }

    var anchorGallery = galleriesToRemove[0];
    var label = document.getElementById('pa-portfolio-label') || ensurePortfolioLabel(anchorGallery);

    galleriesToRemove.forEach(function (gallery) {
      if (gallery.parentNode) {
        gallery.parentNode.removeChild(gallery);
      }
    });

    toolbar.appendChild(buildPortfolioFilters(grid, categoryCounts));

    showcase.id = 'pa-portfolio';
    showcase.classList.add('pa-portfolio-showcase');
    showcase.appendChild(toolbar);
    showcase.appendChild(hint);
    showcase.appendChild(grid);

    var expandWrap = attachPortfolioExpandButton(grid, tileIndex, showcase);
    if (expandWrap) {
      showcase.appendChild(expandWrap);
    }

    if (label && label.parentNode) {
      label.parentNode.insertBefore(showcase, label.nextSibling);
    } else {
      var main = document.querySelector('main .entry-content, main .wp-block-post-content');
      if (main) {
        main.appendChild(showcase);
      }
    }

    observePortfolioTiles(grid);
    document.body.classList.add('pa-has-portfolio-showcase');
    document.body.classList.remove('pa-portfolio-fallback');
    if (window.location.hash === '#pa-portfolio') {
      requestAnimationFrame(function () {
        scrollToSectionHash('#pa-portfolio', 'auto');
      });
    }
    if (typeof rebindGalleryLightbox === 'function') {
      rebindGalleryLightbox();
    }
    refreshPortfolioExperience(showcase);
    requestAnimationFrame(function () {
      healPortfolioGridImages(showcase);
    });
    return true;
  }

  /**
   * Merge all WordPress photo galleries into one uniform 4-column grid.
   * Prevents ragged rows (e.g. 11 images in a 4-wide block leaving a hole in row 3).
   *
   * @returns {boolean}
   */
  function buildPhotoPortfolioShowcase() {
    if (document.getElementById('pa-photo-portfolio')) {
      return true;
    }
    if (document.body.classList.contains('home')) {
      removeVideoPortfolioGrid();
    }
    var galleries = findPortfolioGalleries();
    if (!galleries.length) {
      return false;
    }

    var grid = document.createElement('div');
    grid.className = 'pa-portfolio-grid pa-photo-grid';
    grid.setAttribute('role', 'list');

    var tileIndex = 0;
    var galleriesToRemove = [];

    Array.prototype.forEach.call(galleries, function (gallery) {
      var figures = collectGalleryFigures(gallery);
      if (!figures.length) {
        return;
      }
      galleriesToRemove.push(gallery);

      figures.forEach(function (figure) {
        var img = figure.querySelector('img');
        var isCollapsed = tileIndex >= portfolioCollapseLimit();
        if (img) {
          reservePortfolioImageDimensions(img);
          preparePortfolioTileImage(img, tileIndex);
        }
        figure.classList.remove(
          'aligncenter', 'alignleft', 'alignright',
          'pa-portfolio-tile--featured', 'is-collapsed', 'is-filtered-out'
        );
        figure.classList.add('pa-portfolio-tile', 'reveal-image');
        figure.setAttribute('role', 'listitem');
        figure.style.setProperty('--pa-tile-i', String(tileIndex));
        if (tileIndex === 0 && !document.body.classList.contains('pa-work-page')) {
          figure.classList.add('pa-portfolio-tile--featured');
        }
        if (isCollapsed) {
          figure.classList.add('is-collapsed');
        }

        var altText = img ? (img.getAttribute('alt') || '').trim() : '';
        var tileCategory = inferPortfolioCategory(altText);
        figure.setAttribute('data-pa-category', tileCategory);
        if (img) {
          appendPortfolioTileOverlay(figure, altText, tileCategory);
        }

        grid.appendChild(figure);
        tileIndex += 1;
      });
    });

    if (!tileIndex) {
      return false;
    }

    galleriesToRemove.forEach(function (gallery) {
      if (gallery.parentNode) {
        gallery.parentNode.removeChild(gallery);
      }
    });

    var showcase = document.createElement('section');
    showcase.id = 'pa-photo-portfolio';
    showcase.className = 'pa-portfolio-showcase pa-portfolio-showcase--photos';
    showcase.setAttribute('aria-label', 'Photography gallery');

    if (!document.body.classList.contains('pa-work-page')) {
      var head = document.createElement('div');
      head.className = 'pa-section-head pa-photo-portfolio-head';
      head.id = 'pa-photo-portfolio-label';
      var eyebrow = document.createElement('p');
      eyebrow.className = 'pa-section-eyebrow';
      eyebrow.textContent = 'Photography';
      var title = document.createElement('h2');
      title.className = 'pa-section-title';
      title.textContent = 'Gallery';
      var lead = document.createElement('p');
      lead.className = 'pa-section-lead pa-photo-portfolio-lead';
      lead.textContent = 'Recent events and sessions across Pennsylvania — tap any image to enlarge.';
      head.appendChild(eyebrow);
      head.appendChild(title);
      head.appendChild(lead);
      showcase.appendChild(head);
    }
    showcase.appendChild(grid);

    var photoExpand = attachPortfolioExpandButton(grid, tileIndex, showcase);
    if (photoExpand) {
      showcase.appendChild(photoExpand);
    }

    if (!placePhotoShowcase(showcase)) {
      return false;
    }

    observePortfolioTiles(grid);
    document.body.classList.add('pa-has-photo-portfolio');
    if (document.body.classList.contains('home')) {
      finalizeHomeExperience();
    }
    if (typeof rebindGalleryLightbox === 'function') {
      rebindGalleryLightbox();
    }
    refreshPortfolioExperience(showcase);
    requestAnimationFrame(function () {
      healPortfolioGridImages(showcase);
    });
    return true;
  }

  /** Mount the merged photo grid after the featured video embed. */
  function placePhotoShowcase(showcase) {
    var workShell = document.getElementById('pa2-work');
    if (document.body.classList.contains('pa-work-page') && workShell) {
      workShell.appendChild(showcase);
      return true;
    }
    var anchor = document.getElementById('pa-youtube-feature') ||
      document.querySelector('.entry-content .wp-block-gallery.alignfull');
    if (anchor && anchor.parentNode) {
      if (anchor.nextSibling) {
        anchor.parentNode.insertBefore(showcase, anchor.nextSibling);
      } else {
        anchor.parentNode.appendChild(showcase);
      }
      return true;
    }
    var main = document.querySelector('main .entry-content, main .wp-block-post-content');
    if (main) {
      main.appendChild(showcase);
      return true;
    }
    return false;
  }

  /** Wait for CoBlocks / WP gallery hydration, then merge into one grid. */
  function schedulePhotoPortfolioShowcase() {
    if (document.getElementById('pa-photo-portfolio')) {
      return;
    }
    if (buildPhotoPortfolioShowcase()) {
      return;
    }

    var tries = 0;
    var maxTries = 60;
    var observer = null;
    var stopTimer = null;

    function finish() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (stopTimer) {
        clearTimeout(stopTimer);
        stopTimer = null;
      }
    }

    function attempt() {
      if (buildPhotoPortfolioShowcase()) {
        finish();
        return;
      }
      tries += 1;
      if (tries >= maxTries) {
        finish();
        return;
      }
      requestAnimationFrame(attempt);
    }

    attempt();

    var main = document.querySelector('main .entry-content, main .wp-block-post-content');
    if (main && 'MutationObserver' in window) {
      observer = new MutationObserver(function () {
        if (buildPhotoPortfolioShowcase()) {
          finish();
        }
      });
      observer.observe(main, { childList: true, subtree: true });
      stopTimer = setTimeout(function () {
        buildPhotoPortfolioShowcase();
        finish();
      }, 8000);
    }
  }

  function buildPortfolioFilters(grid, categoryCounts) {
    var filters = document.createElement('div');
    filters.className = 'pa-portfolio-filters';
    filters.setAttribute('role', 'tablist');
    filters.setAttribute('aria-label', 'Filter portfolio');

    PORTFOLIO_CATEGORIES.forEach(function (cat) {
      if (cat.id !== 'all' && !categoryCounts[cat.id]) {
        return;
      }
      var count = cat.id === 'all' ? categoryCounts.all : categoryCounts[cat.id];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pa-portfolio-filter' + (cat.id === 'all' ? ' is-active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('data-filter', cat.id);
      btn.setAttribute('aria-selected', cat.id === 'all' ? 'true' : 'false');
      btn.textContent = cat.label;
      if (count && cat.id !== 'all') {
        var badge = document.createElement('span');
        badge.className = 'pa-portfolio-filter-count';
        badge.textContent = String(count);
        badge.setAttribute('aria-hidden', 'true');
        btn.appendChild(badge);
      }
      btn.addEventListener('click', function () {
        applyPortfolioFilter(grid, filters, cat.id);
      });
      filters.appendChild(btn);
    });

    wirePortfolioFilterKeyboard(filters);
    return filters;
  }

  function applyPortfolioFilter(grid, filters, catId) {
    grid.setAttribute('data-active-filter', catId);
    filters.querySelectorAll('.pa-portfolio-filter').forEach(function (btn) {
      var active = btn.getAttribute('data-filter') === catId;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    grid.querySelectorAll('.pa-portfolio-tile').forEach(function (tile) {
      var tileCat = tile.getAttribute('data-pa-category') || 'uncategorized';
      var match = catId === 'all' || tileCat === catId;
      tile.classList.toggle('is-filtered-out', !match);
      if (match) {
        revealPortfolioTile(tile);
      }
    });
  }

  function motionReduced() {
    if (window.PAAnimations && typeof window.PAAnimations.prefersReducedMotion === 'function') {
      return window.PAAnimations.prefersReducedMotion();
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function revealInView(el, staggerIndex) {
    if (window.PAAnimations && typeof window.PAAnimations.reveal === 'function') {
      window.PAAnimations.reveal(el, staggerIndex);
      return;
    }
    if (!el) {
      return;
    }
    el.classList.add('is-revealed', 'is-visible', 'is-animated');
  }

  function revealPortfolioTile(tile) {
    if (!tile || tile.classList.contains('is-visible')) {
      return;
    }
    if (motionReduced()) {
      tile.classList.add('is-visible', 'is-revealed');
      return;
    }
    void tile.offsetWidth;
    requestAnimationFrame(function () {
      tile.classList.add('is-visible', 'is-revealed');
    });
  }

  function revealPortfolioTiles(tiles) {
    Array.prototype.forEach.call(tiles, function (tile) {
      if (!tile.classList.contains('is-collapsed') && !tile.classList.contains('is-filtered-out')) {
        revealPortfolioTile(tile);
      }
    });
  }

  /** Portfolio grids defer to section-level scroll reveal (parent .pa2-portfolio). */
  function initPortfolioGridReveal(grid) {
    if (!grid) {
      return;
    }
    refreshScrollReveal(grid.closest('.pa2-portfolio, .pa-portfolio-showcase') || grid);
  }

  /** Re-bind scroll reveal for content injected after first paint. */
  function refreshScrollReveal(root) {
    if (window.PAAnimations && typeof window.PAAnimations.refresh === 'function') {
      window.PAAnimations.refresh(root);
    }
  }

  function observePortfolioTiles(grid) {
    initPortfolioGridReveal(grid);
  }

  function bookingUrl() {
    if (window.PASite && PASite.bookUrl) {
      return PASite.bookUrl;
    }
    return '/book/';
  }

  /** Canonical /book/ URL with funnel params (skip welcome, optional service preselect). */
  function bookLinkUrl(serviceApi) {
    var base = bookingUrl();
    var sep = base.indexOf('?') >= 0 ? '&' : '?';
    var url = base + sep + 'start=1';
    if (serviceApi) {
      url += '&service=' + encodeURIComponent(serviceApi);
    }
    return url;
  }
  window.PABookLinkUrl = bookLinkUrl;

  /**
   * Prefetch /book/ on first CTA hover or focus (marketing pages only).
   */
  function initBookLinkPrefetch() {
    if (isBookingPage()) {
      return;
    }
    var prefetched = false;
    function prefetchBook() {
      if (prefetched) {
        return;
      }
      prefetched = true;
      var href = bookLinkUrl();
      if (!href) {
        return;
      }
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      link.as = 'document';
      document.head.appendChild(link);
    }
    document.querySelectorAll(
      'a[href*="/book"], a[href="#pa-booking-app"], a[href="#pa-book"]'
    ).forEach(function (anchor) {
      anchor.addEventListener('mouseenter', prefetchBook, { once: true, passive: true });
      anchor.addEventListener('focus', prefetchBook, { once: true });
    });
  }

  function initMobileBookBar() {
    if (isBookingPage() || document.getElementById('pa-mobile-book-bar')) {
      return;
    }
    if (window.matchMedia && window.matchMedia('(min-width: 900px)').matches) {
      return;
    }
    document.body.classList.add('pa-has-mobile-book-bar');
    var bar = document.createElement('div');
    bar.id = 'pa-mobile-book-bar';
    bar.className = 'pa-mobile-book-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Quick booking');
    var link = document.createElement('a');
    link.href = bookLinkUrl();
    link.className = 'pa-mobile-book-bar__btn';
    link.textContent = 'Book now';
    bar.appendChild(link);
    document.body.appendChild(bar);
  }

  /**
   * Every "Book" CTA site-wide should open the same /book/ wizard.
   */
  function normalizeBookLinks() {
    var canonical = bookLinkUrl();
    document.querySelectorAll(
      'a[href="#pa-booking-app"], a[href="#pa-book"], a[href*="#pa-booking-app"]'
    ).forEach(function (a) {
      if (a.getAttribute('data-pa-book-canonical') === '1') {
        return;
      }
      a.setAttribute('href', canonical);
      a.setAttribute('data-pa-book-canonical', '1');
    });
    document.querySelectorAll('a[href]').forEach(function (a) {
      if (a.getAttribute('data-pa-book-canonical') === '1') {
        return;
      }
      var href = a.getAttribute('href') || '';
      if (href.indexOf('start=') !== -1) {
        return;
      }
      if (!/\/book\/?(?:\?|#|$)/i.test(href)) {
        return;
      }
      a.setAttribute('href', bookLinkUrl());
      a.setAttribute('data-pa-book-canonical', '1');
    });
  }

  /** Old home-page #pa-booking-app links → canonical /book/ wizard. */
  function redirectLegacyBookAnchors() {
    var hash = window.location.hash || '';
    if (hash === '#pa-booking-app' || hash === '#pa-book') {
      window.location.replace(bookingUrl());
    }
  }

  /**
   * Scroll to in-page section anchors. #pa-portfolio is injected by JS after load,
   * so native hash navigation alone never reaches the gallery.
   */
  function ensurePortfolioSection() {
    if (document.getElementById('pa-youtube-feature') ||
        document.getElementById('pa-photo-portfolio') ||
        document.getElementById('pa-portfolio') ||
        document.querySelector('.pa-portfolio-showcase')) {
      return true;
    }
    injectYoutubeFeature();
    if (document.body.classList.contains('home')) {
      return buildPhotoPortfolioShowcase();
    }
    return buildPhotoPortfolioShowcase() || buildPortfolioShowcase();
  }

  function sectionHashFromHref(href) {
    if (!href || href.indexOf('#') === -1) {
      return '';
    }
    return href.slice(href.indexOf('#'));
  }

  function inPageHashLinkTargetsHome(href) {
    if (!document.body.classList.contains('home')) {
      return false;
    }
    try {
      var url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) {
        return false;
      }
      var path = url.pathname.replace(/\/$/, '') || '/';
      return path === '/' || path === '';
    } catch (e) {
      return false;
    }
  }

  function forceRevealElement(el) {
    if (!el) {
      return;
    }
    if (window.PAAnimations && typeof window.PAAnimations.reveal === 'function') {
      window.PAAnimations.reveal(el);
    }
    var section = el.closest('.pa-reveal-section');
    if (section) {
      section.classList.add('is-inview');
    }
    el.classList.add('is-revealed', 'is-visible', 'is-animated');
    el.querySelectorAll(
      '.pa2-reviews__head, .pa2-reviews__stage, .pa2-reviews__foot, ' +
      '.pa2-cta__inner, .pa-home-closing-inner, .pa-scroll-reveal, ' +
      '.pa-footer-panel, .pa-footer-cta-strip, .pa-footer-social, .pa-legal-footer'
    ).forEach(function (child) {
      child.classList.add('is-revealed', 'is-visible');
    });
  }

  /** Home closing band + footer: always visible (sticky header used to hide them). */
  function forceRevealHomeClosing(root) {
    var scope = root || document;
    scope.querySelectorAll(
      '#pa2-reviews, #pa-home-closing, .pa-site-footer-pro, footer.wp-block-template-part'
    ).forEach(forceRevealElement);
    scope.querySelectorAll(
      '.pa2-reviews__head, .pa2-reviews__stage, .pa2-reviews__foot, .pa2-cta__inner, ' +
      '.pa-footer-glass__panel, .pa-footer-glass__hero, .pa-footer-glass__actions, .pa-footer-panel, .pa-footer-cta-strip, .pa-footer-social, .pa-legal-footer'
    ).forEach(function (el) {
      el.classList.add('is-revealed', 'is-visible');
    });
  }

  /** @deprecated Scroll reveal handles section entrance; refreshes observers only. */
  function forceRevealHomeExperience(root) {
    refreshScrollReveal(root);
  }

  /** Home: transparent shell, logo + floating nav rail (no white rectangle). */
  function polishHomeHeader() {
    if (!document.body.classList.contains('home')) {
      return;
    }
    applyMarketingHeaderNavClasses();
    document.body.classList.add('pa-home-header-pro');
  }

  /**
   * Work / Services / About — same floating pill nav as home (chrome-above-hero look).
   */
  function polishMarketingHeaderNav() {
    if (
      document.body.classList.contains('home') ||
      isBookingPage()
    ) {
      return false;
    }
    if (
      !document.body.classList.contains('pa-work-page') &&
      !document.body.classList.contains('pa-services-page') &&
      !document.body.classList.contains('pa-about-page') &&
      !isWorkPage() &&
      !isServicesPage() &&
      !isAboutPage()
    ) {
      return false;
    }
    applyMarketingHeaderNavClasses();
    document.body.classList.add('pa-marketing-nav', 'pa-home-header-pro');
    triggerPremiumHeaderNav();
    return true;
  }

  /** Shared nav shell classes for home + interior marketing pages. */
  function applyMarketingHeaderNavClasses() {
    var shell = document.querySelector(
      '.pa-home-post-hero-chrome .alignfull.has-foreground-color:has(.wp-block-navigation), ' +
      '.pa-home-post-hero-chrome .wp-block-group.alignfull.has-foreground-color:has(.wp-block-navigation), ' +
      'header.pa-site-header .alignfull.has-foreground-color:has(.wp-block-navigation), ' +
      'header.wp-block-template-part .alignfull.has-foreground-color:has(.wp-block-navigation), ' +
      'header.pa-site-header > .wp-block-group > .alignfull.has-foreground-color:has(.wp-block-navigation), ' +
      'header.wp-block-template-part > .wp-block-group > .alignfull.has-foreground-color:has(.wp-block-navigation)'
    );
    if (shell) {
      shell.classList.add('pa-home-header-shell');
    }
    var nav = document.querySelector(
      '.pa-home-post-hero-chrome .wp-block-navigation, ' +
      'header.pa-site-header .wp-block-navigation, header.wp-block-template-part .wp-block-navigation'
    );
    if (nav) {
      nav.classList.add('pa-home-header-nav');
      nav.classList.remove('has-background', 'has-foreground-background-color');
    }
    var navList = document.querySelector(
      '.pa-home-post-hero-chrome .wp-block-navigation__container, ' +
      'header.pa-site-header .wp-block-navigation__container, header.wp-block-template-part .wp-block-navigation__container'
    );
    if (navList) {
      navList.classList.remove('has-background', 'has-foreground-background-color');
    }
  }

  var homeFinalizeTimer = null;

  /** One pass after DOM settles: relocate shell, reveal content, mark ready. */
  function finalizeHomeExperience() {
    if (!document.body.classList.contains('home')) {
      return;
    }
    if (homeFinalizeTimer) {
      clearTimeout(homeFinalizeTimer);
    }
    homeFinalizeTimer = window.setTimeout(function () {
      homeFinalizeTimer = null;
      relocateHomeShellFromHeader();
      relocateHomeChromeAboveHero();
      polishHomeHeader();
      triggerPremiumHeaderNav();
      refreshScrollReveal();
      document.body.classList.add('pa-home-ready');
    }, 32);
  }

  /**
   * Services / Work / About — theme puts a cover block in the header; hide it and
   * use a compact sticky nav bar so content is not buried under a 600px header.
   */
  function compactInteriorPageHeader() {
    if (document.body.classList.contains('home') || isBookingPage()) {
      return false;
    }
    var header = document.querySelector('header.pa-site-header, header.wp-block-template-part');
    if (!header) {
      return false;
    }

    header.querySelectorAll(
      '.pa-glass-hero-wrap, .wp-block-cover.alignfull, .wp-block-cover, .pa-home-hero'
    ).forEach(function (el) {
      el.classList.add('pa-interior-header-clutter');
      el.setAttribute('aria-hidden', 'true');
      el.hidden = true;
    });

    document.body.classList.add('pa-interior-compact-nav');
    polishMarketingHeaderNav();
    return true;
  }

  /** @deprecated Scroll reveal handles service cards; refreshes observers only. */
  function forceRevealServicesPage(root) {
    refreshScrollReveal(root);
  }

  function isHomeHeaderBrandBlock(el) {
    if (!el) {
      return false;
    }
    return el.classList.contains('pa-brand-lockup') ||
      el.classList.contains('wp-block-site-logo') ||
      !!el.querySelector('.wp-block-site-logo, .pa-brand-lockup');
  }

  function isHomeHeroBlock(el) {
    if (!el) {
      return false;
    }
    return el.classList.contains('pa-glass-hero-wrap') ||
      el.classList.contains('pa2-hero') ||
      el.classList.contains('pa-home-hero') ||
      !!el.querySelector('.pa-glass-hero-wrap, .pa2-hero, .wp-block-cover.pa-home-hero');
  }

  /**
   * Gutenify nests hero, services, and portfolio inside the header template.
   * Move selling sections into main; keep a compact nav-only header.
   *
   * @returns {boolean} true when content already relocated or move succeeded
   */
  function relocateHomeShellFromHeader() {
    if (!document.body.classList.contains('home')) {
      return false;
    }
    var main = document.querySelector('main .entry-content, main .wp-block-post-content');
    var header = document.querySelector('header.pa-site-header, header.wp-block-template-part');
    if (!main || !header) {
      return false;
    }

    var headerGroup = header.querySelector(':scope > .wp-block-group');
    if (!headerGroup) {
      return document.body.classList.contains('pa-home-shell-relocated');
    }

    var navRow = headerGroup.querySelector(
      ':scope > .alignfull.has-foreground-color, :scope > .wp-block-group.alignfull.has-foreground-color'
    );
    if (!navRow) {
      var nav = headerGroup.querySelector('.wp-block-navigation');
      if (nav) {
        navRow = nav.closest('.alignfull, .wp-block-group.alignfull, .wp-block-group');
      }
    }

    var heroBlocks = [];
    var contentBlocks = [];
    var mainHasHero = !!main.querySelector('.pa-glass-hero-wrap, .pa2-hero, .wp-block-cover.pa-home-hero');
    var closingAnchor = main.querySelector('#pa2-reviews, #pa-home-closing');

    Array.prototype.forEach.call(headerGroup.children, function (child) {
      if (child === navRow) {
        return;
      }
      if (navRow && (child === navRow || child.contains(navRow))) {
        return;
      }
      if (
        child.tagName === 'P' &&
        !child.textContent.trim() &&
        !child.querySelector('img, a, iframe, button, video, .wp-block-cover, .pa-glass-hero-wrap')
      ) {
        return;
      }
      if (isHomeHeaderBrandBlock(child)) {
        return;
      }
      if (isHomeHeroBlock(child)) {
        if (!mainHasHero) {
          heroBlocks.push(child);
        }
        return;
      }
      contentBlocks.push(child);
    });

    if (!heroBlocks.length && !contentBlocks.length) {
      return document.body.classList.contains('pa-home-shell-relocated');
    }

    heroBlocks.forEach(function (node) {
      main.insertBefore(node, main.firstElementChild);
    });

    contentBlocks.forEach(function (node) {
      if (closingAnchor && closingAnchor.parentNode === main) {
        main.insertBefore(node, closingAnchor);
      } else {
        main.appendChild(node);
      }
    });

    document.body.classList.add('pa-home-shell-relocated');
    return true;
  }

  /**
   * Place logo + nav in a solid band above the homepage hero (logo → nav → drone).
   *
   * @returns {boolean}
   */
  function relocateHomeChromeAboveHero() {
    if (!document.body.classList.contains('home')) {
      return false;
    }

    var main = document.querySelector('main .entry-content, main .wp-block-post-content');
    var header = document.querySelector('header.pa-site-header, header.wp-block-template-part');
    if (!main || !header) {
      return false;
    }

    var hero = main.querySelector('.pa-glass-hero-wrap, .wp-block-cover.pa-home-hero, .pa2-hero');
    if (!hero) {
      return false;
    }

    var headerGroup = header.querySelector(':scope > .wp-block-group');
    if (!headerGroup) {
      return false;
    }

    var brandBlock = null;
    Array.prototype.forEach.call(headerGroup.children, function (child) {
      if (!brandBlock && isHomeHeaderBrandBlock(child)) {
        brandBlock = child;
      }
    });

    var navRow = headerGroup.querySelector(
      ':scope > .alignfull.has-foreground-color:has(.wp-block-navigation), ' +
      ':scope > .wp-block-group.alignfull.has-foreground-color:has(.wp-block-navigation)'
    );
    if (!navRow) {
      var nav = headerGroup.querySelector('.wp-block-navigation');
      if (nav) {
        navRow = nav.closest('.alignfull, .wp-block-group.alignfull, .wp-block-group');
      }
    }

    var chrome = main.querySelector('.pa-home-post-hero-chrome');
    if (!chrome && !brandBlock && !navRow) {
      return document.body.classList.contains('pa-home-chrome-above-hero');
    }

    if (!chrome) {
      chrome = document.createElement('section');
      chrome.className = 'pa-home-post-hero-chrome';
      chrome.setAttribute('aria-label', 'Site branding and navigation');
    }

    var staleEyebrow = chrome.querySelector('.pa-home-chrome-eyebrow');
    if (staleEyebrow) {
      staleEyebrow.remove();
    }

    if (brandBlock && brandBlock.parentNode !== chrome) {
      chrome.appendChild(brandBlock);
    }
    if (navRow && navRow.parentNode !== chrome) {
      chrome.appendChild(navRow);
    }
    if (brandBlock && navRow && brandBlock.parentNode === chrome && navRow.parentNode === chrome) {
      if (brandBlock.compareDocumentPosition(navRow) & Node.DOCUMENT_POSITION_PRECEDING) {
        chrome.insertBefore(brandBlock, navRow);
      }
    }

    if (chrome.parentNode !== main) {
      main.insertBefore(chrome, hero);
    } else if (main.firstElementChild !== chrome) {
      main.insertBefore(chrome, hero);
    }
    if (hero.previousElementSibling !== chrome) {
      main.insertBefore(hero, chrome.nextElementSibling);
    }

    header.classList.add('pa-home-header-chrome-moved');
    document.body.classList.remove('pa-home-chrome-below-hero');
    document.body.classList.add('pa-home-chrome-above-hero');
    applyLogosInScope(chrome, 'dark');
    scaleHomeChromeLogo(chrome);
    triggerPremiumHeaderNav();
    return true;
  }

  /**
   * WordPress often keeps width="160" on the site logo img — force the art to fill
   * the chrome link box so increasing the container also scales the mark.
   *
   * @param {Element} chrome
   */
  function scaleHomeChromeLogo(chrome) {
    if (!chrome) {
      return;
    }
    chrome.querySelectorAll('.wp-block-site-logo img, img.custom-logo').forEach(function (img) {
      img.removeAttribute('width');
      img.removeAttribute('height');
      img.style.removeProperty('width');
      img.style.removeProperty('max-width');
      img.style.removeProperty('height');
      img.style.maxHeight = 'none';
    });
  }

  /** @deprecated Use relocateHomeChromeAboveHero */
  function relocateHomeChromeBelowHero() {
    return relocateHomeChromeAboveHero();
  }

  function scrollToSectionHash(hash, behavior) {
    if (!hash || hash.charAt(0) !== '#') {
      return false;
    }
    var id = hash.slice(1);
    var el = document.getElementById(id);
    if (!el && id === 'pa-portfolio') {
      el = document.getElementById('pa-photo-portfolio') ||
        document.getElementById('pa-youtube-feature') ||
        document.getElementById('pa-photo-portfolio-label') ||
        document.getElementById('pa-portfolio-label');
    }
    if (!el) {
      return false;
    }
    if (id === 'pa-home-closing' || id === 'pa2-reviews') {
      var reviews = document.getElementById('pa2-reviews');
      if (reviews) {
        forceRevealElement(reviews);
      }
      forceRevealElement(el);
    } else {
      forceRevealElement(el);
    }
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({
      behavior: reduced ? 'auto' : (behavior || 'smooth'),
      block: 'start',
    });
    if (!el.hasAttribute('tabindex')) {
      el.setAttribute('tabindex', '-1');
    }
    el.focus({ preventScroll: true });
    return true;
  }

  function initSectionHashNav() {
    function handleHash() {
      var hash = window.location.hash;
      if (!hash || hash.length < 2) {
        return;
      }
      if (hash === '#pa-portfolio') {
        ensurePortfolioSection();
      }
      scrollToSectionHash(hash);
    }

    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href*="#pa-portfolio"], a[href*="#pa-about"]');
      if (!link) {
        return;
      }
      var href = link.getAttribute('href') || '';
      var hash = sectionHashFromHref(href);
      if (hash !== '#pa-portfolio' && hash !== '#pa-about') {
        return;
      }
      if (!inPageHashLinkTargetsHome(href)) {
        return;
      }
      e.preventDefault();
      if (hash === '#pa-portfolio') {
        ensurePortfolioSection();
      }
      if (window.location.hash !== hash) {
        history.pushState(null, '', hash);
      }
      scrollToSectionHash(hash, 'smooth');
    });

    window.addEventListener('hashchange', handleHash);

    if (document.body.classList.contains('home') && window.location.hash) {
      requestAnimationFrame(function () {
        requestAnimationFrame(handleHash);
      });
    }
  }

  function isBookingPage() {
    return document.body.classList.contains('pa-booking-page') ||
      (window.PASite && PASite.isBookingPage);
  }

  /**
   * /book/ — wizard only; hide duplicate page-builder intro and static supplement.
   */
  function hideBookPageClutter(el) {
    if (!el) {
      return;
    }
    el.hidden = true;
    el.setAttribute('aria-hidden', 'true');
    el.classList.add('pa-book-page-dupe-hidden');
  }

  function polishBookingPage() {
    var root = document.querySelector('.pa-booking-root');
    if (!root) {
      return;
    }

    document.body.classList.add('pa-booking-funnel-page');

    var hero = root.querySelector('.pa-booking-hero');
    var supplement = root.querySelector('.pa-booking-supplement');
    hideBookPageClutter(hero);
    if (supplement) {
      supplement.hidden = false;
      supplement.removeAttribute('aria-hidden');
      supplement.classList.remove('pa-book-page-dupe-hidden');
    }

    document.querySelectorAll(
      '.wp-block-post-title, main .entry-header, .pa-booking-sticky'
    ).forEach(hideBookPageClutter);

    var main = root.closest('.entry-content, .wp-block-post-content');
    if (!main) {
      return;
    }

    var sticky = main.querySelector(':scope > .pa-booking-sticky');
    hideBookPageClutter(sticky);

    Array.prototype.slice.call(main.children).forEach(function (el) {
      if (el === root || el.contains(root) || root.contains(el)) {
        return;
      }
      if (el.classList.contains('pa-booking-sticky')) {
        hideBookPageClutter(el);
        return;
      }

      var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) {
        return;
      }

      var isDupeIntro = /reserve your production date|online booking|choose your package.*deposit|start your booking|book your session/i.test(text);
      var isPolicyBlock = /\b(faq|frequently asked|cancellation|refund policy|deposit policy|terms of service)\b/i.test(text);
      var isLegacyHeading = el.matches('.wp-block-heading, h1, h2, h3') &&
        /^(book(ing)?|reserve|schedule|get started)$/i.test(text);

      if (isDupeIntro || isPolicyBlock || isLegacyHeading) {
        hideBookPageClutter(el);
      }
    });

    suppressLegacyThemeBlocks();
  }

  function isAboutPage() {
    if (window.PASite && PASite.isAboutPage) {
      return true;
    }
    return /^\/about\/?$/.test(window.location.pathname);
  }

  function isServicesPage() {
    if (document.body.classList.contains('pa-services-page')) {
      return true;
    }
    if (window.PASite && PASite.isServicesPage) {
      return true;
    }
    return /^\/services\/?$/.test(window.location.pathname);
  }

  function isWorkPage() {
    if (document.body.classList.contains('pa-work-page')) {
      return true;
    }
    if (window.PASite && PASite.isWorkPage) {
      return true;
    }
    return /^\/work\/?$/.test(window.location.pathname || '');
  }

  /**
   * /work/ — hero + merged photo gallery and featured video (light portfolio page).
   */
  function buildWorkPage() {
    if (document.getElementById('pa2-work')) {
      return;
    }
    var main = document.querySelector('main .entry-content, main .wp-block-post-content');
    if (!main) {
      return;
    }

    document.querySelectorAll('.wp-block-post-title, main .entry-header').forEach(function (node) {
      node.classList.add('pa2-work-legacy-hidden');
      node.setAttribute('aria-hidden', 'true');
      node.hidden = true;
    });

    var shell = document.createElement('div');
    shell.id = 'pa2-work';
    shell.className = 'pa2-work-page pa-reveal-section';
    shell.setAttribute('data-pa-atmosphere', 'bright');
    main.insertBefore(shell, main.firstChild);

    var hero = document.createElement('header');
    hero.className = 'pa2-work-hero pa-reveal-item';
    hero.setAttribute('aria-labelledby', 'pa2-work-hero-title');
    var workEyebrow = document.createElement('p');
    workEyebrow.className = 'pa2-work-hero__eyebrow';
    workEyebrow.textContent = 'Portfolio';
    hero.appendChild(workEyebrow);
    var workTitle = document.createElement('h1');
    workTitle.className = 'pa2-work-hero__title';
    workTitle.id = 'pa2-work-hero-title';
    workTitle.textContent = 'Event photography & video portfolio';
    hero.appendChild(workTitle);
    var workLead = document.createElement('p');
    workLead.className = 'pa2-work-hero__lead';
    workLead.textContent =
      'Central Pennsylvania events — concerts, weddings, and brand stories from Harrisburg to Lancaster.';
    hero.appendChild(workLead);
    shell.appendChild(hero);

    var inner = document.createElement('div');
    inner.className = 'pa2-work__inner';
    shell.appendChild(inner);

    injectYoutubeFeature();
    schedulePhotoPortfolioShowcase();
    hideWorkPageLegacy(main, shell);
    removeWorkFeaturedBands();
    suppressLegacyThemeBlocks();

    document.body.classList.add('pa2-work-ready');
    refreshScrollReveal(shell);
    requestAnimationFrame(function () {
      shell.classList.add('is-ready');
      refreshPortfolioExperience(shell);
    });
  }

  function hideWorkPageLegacy(main, shell) {
    Array.prototype.forEach.call(main.children, function (child) {
      if (child === shell) {
        return;
      }
      if (child.id === 'pa-photo-portfolio' || child.id === 'pa-youtube-feature') {
        return;
      }
      if (child.classList.contains('pa-photo-portfolio') || child.classList.contains('pa-youtube-feature')) {
        return;
      }
      child.classList.add('pa2-work-legacy-hidden');
      child.setAttribute('aria-hidden', 'true');
      child.hidden = true;
    });
  }

  /** Remove duplicate featured-project bands injected before the gallery. */
  function removeWorkFeaturedBands() {
    if (!document.body.classList.contains('pa-work-page')) {
      return;
    }
    document.querySelectorAll('.pa-portfolio-featured').forEach(function (band) {
      if (band.parentNode) {
        band.parentNode.removeChild(band);
      }
    });
  }

  function enhanceSocialLinks() {
    var channelUrl = (window.PASite && PASite.youtubeChannelUrl) || 'https://www.youtube.com/@PAMediaArts';
    var lists = document.querySelectorAll('.wp-block-social-links');

    lists.forEach(function (ul) {
      ul.classList.add('pa-site-social');
      if (!ul.querySelector('.wp-social-link-youtube')) {
        ul.appendChild(buildYoutubeSocialLink(channelUrl));
      }
    });

    var footerPro = document.querySelector('.pa-site-footer-pro');
    var social = document.querySelector('footer .wp-block-social-links');
    if (footerPro && social && !footerPro.contains(social)) {
      var oldShell = social.closest('.wp-block-group');
      var slot = footerPro.querySelector('.pa-footer-glass__social-slot');
      var wrap = document.createElement('div');
      wrap.className = 'pa-footer-social';
      wrap.appendChild(social);
      if (slot) {
        slot.appendChild(wrap);
      } else {
        wrap.className = 'pa-footer-social animate fade-up stagger';
        var actions = footerPro.querySelector('.pa-footer-glass__actions, .pa-footer-cta-strip');
        if (actions) {
          actions.insertBefore(wrap, actions.firstChild);
        } else {
          footerPro.appendChild(wrap);
        }
      }
      if (oldShell && !oldShell.contains(footerPro)) {
        oldShell.classList.add('pa-footer-social-source');
      }
    }
  }

  function polishFooter() {
    var footer = document.querySelector('footer.wp-block-template-part');

    document.querySelectorAll('footer .wp-block-site-logo').forEach(function (logo) {
      if (logo.closest('.pa-brand-lockup')) {
        return;
      }
      var group = logo.closest('.wp-block-group');
      if (group) {
        group.classList.add('pa-hide-theme-footer-logo');
      }
    });

    document.querySelectorAll('footer .pa-footer-social-source').forEach(function (el) {
      el.classList.add('pa-footer-clutter-hidden');
    });

    document.querySelectorAll('footer .wp-block-group').forEach(function (group) {
      if (group.classList.contains('pa-hide-theme-footer-logo') ||
          group.classList.contains('pa-footer-clutter-hidden') ||
          group.classList.contains('pa-footer-legacy') ||
          group.querySelector('.pa-site-footer-pro') ||
          group.querySelector('.pa-legal-footer')) {
        return;
      }
      var text = group.textContent.replace(/\s+/g, '').toLowerCase();
      if (!text || text === 'pennsylvaniamediaartsllc') {
        group.classList.add('pa-footer-clutter-hidden');
      }
    });

    var legal = footer && footer.querySelector('.pa-legal-footer');
    if (legal) {
      placeFooterBrandInLegal(footer, legal);
    }
  }

  function buildYoutubeSocialLink(href) {
    var li = document.createElement('li');
    li.className = 'wp-social-link wp-social-link-youtube wp-block-social-link';
    var a = document.createElement('a');
    a.className = 'wp-block-social-link-anchor';
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M21.8 8.001a2.5 2.5 0 0 0-1.76-1.77C18.36 6 12 6 12 6s-6.36 0-8.04.231A2.5 2.5 0 0 0 2.2 8.001 26.3 26.3 0 0 0 2 12a26.3 26.3 0 0 0 .2 3.999 2.5 2.5 0 0 0 1.76 1.77C5.64 18 12 18 12 18s6.36 0 8.04-.231a2.5 2.5 0 0 0 1.76-1.77A26.3 26.3 0 0 0 22 12a26.3 26.3 0 0 0-.2-3.999zM10 15.5v-7l6 3.5-6 3.5z"></path>' +
      '</svg>' +
      '<span class="wp-block-social-link-label screen-reader-text">YouTube</span>';
    li.appendChild(a);
    return li;
  }

  function pickRotatingVideoId(ids) {
    if (!ids || !ids.length) {
      return '';
    }
    if (ids.length === 1) {
      return ids[0];
    }
    var prev = '';
    try {
      prev = sessionStorage.getItem('pa_yt_last') || '';
    } catch (e) { /* ignore */ }
    if (isBlockedYoutubeId(prev)) {
      prev = '';
      try {
        sessionStorage.removeItem('pa_yt_last');
      } catch (ePrev) { /* ignore */ }
    }
    var pool = ids.filter(function (id) {
      return id !== prev && !isBlockedYoutubeId(id);
    });
    if (!pool.length) {
      pool = ids.slice();
    }
    var pick = pool[Math.floor(Math.random() * pool.length)];
    try {
      sessionStorage.setItem('pa_yt_last', pick);
    } catch (e2) { /* ignore */ }
    return pick;
  }

  function injectYoutubeFeature() {
    if (document.getElementById('pa-youtube-feature')) {
      return;
    }
    var ids = (window.PASite && PASite.youtubeVideos) ? PASite.youtubeVideos : [];
    var videoId = pickRotatingVideoId(ids);
    if (!videoId) {
      return;
    }

    var channelUrl = (window.PASite && PASite.youtubeChannelUrl) || 'https://www.youtube.com/@PAMediaArts';
    var section = document.createElement('section');
    section.id = 'pa-youtube-feature';
    section.className = 'pa-youtube-feature pa-glass-card';
    section.setAttribute('aria-label', 'Featured video');

    var head = document.createElement('div');
    head.className = 'pa-youtube-head';
    var title = document.createElement('h2');
    title.textContent = 'Featured';
    var link = document.createElement('a');
    link.href = channelUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'YouTube';
    head.appendChild(title);
    head.appendChild(link);
    section.appendChild(head);

    var player = document.createElement('div');
    player.className = 'pa-youtube-player';
    var iframe = document.createElement('iframe');
    iframe.className = 'pa-youtube-iframe';
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(videoId) +
      '?rel=0&modestbranding=1&playsinline=1';
    iframe.title = 'Pennsylvania Media Arts featured video';
    iframe.loading = 'lazy';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    player.appendChild(iframe);
    section.appendChild(player);

    if (placeFeaturedVideoSection(section)) {
      refreshScrollReveal(section);
    }
  }

  function mountGoogleReviewsBand() {
    if (
      document.body.classList.contains('home') ||
      isBookingPage() ||
      !document.querySelector('script[src*="google-reviews.js"]')
    ) {
      return;
    }
    if (document.getElementById('pa2-reviews')) {
      return;
    }
    if (typeof window.PABuildGoogleReviews !== 'function') {
      return;
    }
    var section = window.PABuildGoogleReviews();
    if (!section) {
      return;
    }
    var footer = document.querySelector('footer.wp-block-template-part, footer.pa-site-footer');
    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(section, footer);
      requestAnimationFrame(function () { section.classList.add('is-ready'); });
    }
  }

  function rebuildSiteFooter() {
    var footer = document.querySelector('footer.wp-block-template-part');
    if (!footer) {
      return;
    }

    footer.querySelectorAll('.wp-block-columns').forEach(function (columns) {
      if (columns.closest('.pa-site-footer-pro')) {
        return;
      }
      columns.classList.add('pa-footer-legacy');
      columns.setAttribute('aria-hidden', 'true');
      columns.hidden = true;
    });

    if (footer.querySelector('.pa-site-footer-pro')) {
      var existing = footer.querySelector('.pa-site-footer-pro');
      if (existing && existing.classList.contains('pa-footer-glass')) {
        return;
      }
      if (existing) {
        existing.remove();
      }
    }

    var columns = footer.querySelector('.wp-block-columns');
    if (!columns) {
      return;
    }

    var data = extractFooterColumnData(columns);

    var wrap = footer.querySelector(':scope > .wp-block-group');
    if (!wrap) {
      return;
    }

    var pro = document.createElement('div');
    pro.className = 'pa-site-footer-pro pa-footer-glass';

    if (!isBookingPage()) {
      pro.appendChild(buildFooterGlassHero());
      pro.appendChild(buildFooterInfoGrid(data));
    }

    pro.appendChild(buildFooterActionBar());
    wrap.insertBefore(pro, columns);
    refreshScrollReveal(pro);
  }

  /**
   * Footer brand badge — PAMA logo in the legal strip, just above the LLC line.
   */
  function buildFooterBrand() {
    var wrap = document.createElement('div');
    wrap.className = 'pa-footer-brand';
    var src = (window.PASite &&
      (PASite.logoWhiteUrl || PASite.logoDarkUrl || PASite.logoUrl)) || '';
    if (!src) {
      return wrap;
    }
    var link = document.createElement('a');
    link.className = 'pa-footer-brand-link';
    link.href = (window.PASite && PASite.homeUrl) || '/';
    link.setAttribute('aria-label', (window.PASite && PASite.siteName) ||
      'Pennsylvania Media Arts');
    var img = document.createElement('img');
    img.className = 'pa-footer-brand-logo';
    img.src = src;
    img.alt = (window.PASite && PASite.siteName) || 'Pennsylvania Media Arts';
    img.decoding = 'async';
    img.loading = 'lazy';
    link.appendChild(img);
    wrap.appendChild(link);
    return wrap;
  }

  /** Pin the footer logo directly above the legal entity name (LLC line). */
  function placeFooterBrandInLegal(footer, legal) {
    if (!footer || !legal) {
      return;
    }
    var brand = footer.querySelector('.pa-footer-brand');
    if (!brand) {
      brand = buildFooterBrand();
    }
    var entity = legal.querySelector('.pa-legal-entity');
    if (entity && brand.nextElementSibling !== entity) {
      legal.insertBefore(brand, entity);
      return;
    }
    if (!entity && legal.firstElementChild !== brand) {
      legal.insertBefore(brand, legal.firstChild);
    }
  }

  function linesFromElement(el) {
    if (!el) {
      return [];
    }
    var raw = (el.innerText || el.textContent || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\r\n/g, '\n');
    return raw.split('\n').map(function (line) {
      return line.replace(/\s+/g, ' ').trim();
    }).filter(Boolean);
  }

  function extractWorkItemsFromParagraph(p) {
    var items = [];
    var links = p.querySelectorAll('a[href]');
    if (links.length) {
      links.forEach(function (link) {
        if (isBlockedYoutubeId(parseYoutubeIdFromHref(link.href))) {
          return;
        }
        var lines = linesFromElement(link);
        if (lines.length) {
          items.push({ lines: lines, href: link.href });
        }
      });
      return items;
    }
    var lines = linesFromElement(p);
    if (lines.length) {
      items.push({ lines: lines, href: '' });
    }
    return items;
  }

  function appendWorkLines(parent, lines) {
    if (!lines || !lines.length) {
      return;
    }
    var title = document.createElement('span');
    title.className = 'pa-footer-work-title';
    title.textContent = lines[0];
    parent.appendChild(title);
    if (lines.length > 1) {
      var detail = document.createElement('span');
      detail.className = 'pa-footer-work-detail';
      detail.textContent = lines.slice(1).join(' · ');
      parent.appendChild(detail);
    }
  }

  function normalizeAboutParagraph(text) {
    return String(text || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/([.!?])([A-Za-z])/g, '$1 $2')
      .trim();
  }

  function dedupeAboutParagraphs(paragraphs) {
    var seen = {};
    var out = [];
    (paragraphs || []).forEach(function (text) {
      var clean = normalizeAboutParagraph(text);
      if (!clean) {
        return;
      }
      var key = clean.toLowerCase();
      if (seen[key]) {
        return;
      }
      seen[key] = true;
      out.push(clean);
    });
    return out;
  }

  function resolveAboutParagraphs(extracted) {
    if (window.PASite && PASite.aboutParagraphs && PASite.aboutParagraphs.length) {
      return PASite.aboutParagraphs.map(normalizeAboutParagraph).filter(Boolean).slice(0, 2);
    }
    var deduped = dedupeAboutParagraphs(extracted);
    if (deduped.length) {
      return deduped;
    }
    return [
      normalizeAboutParagraph((window.PASite && PASite.tagline) ||
        'Photography, video & live production across Pennsylvania.'),
    ];
  }

  function getBookableServices() {
    if (window.PASite && PASite.services && PASite.services.length) {
      return PASite.services.slice();
    }
    return [
      'Event Photography',
      'Video Production',
      'Live Audio / PA',
      'DJ Services',
      'Photo + Video Bundle',
    ];
  }

  function ensureRecognitionItems(data) {
    return data;
  }

  function extractFooterColumnData(columns) {
    var data = {
      services: [],
      aboutParagraphs: [],
      work: [],
    };

    columns.querySelectorAll('.wp-block-column').forEach(function (col) {
      var heading = col.querySelector('.wp-block-heading');
      if (!heading) {
        return;
      }
      var title = heading.textContent.trim();

      // Services list is canonical (see below) — the legacy "Services Offered"
      // theme column is intentionally ignored so the footer stays in sync with booking.

      if (title === 'About') {
        col.querySelectorAll('p').forEach(function (p) {
          var text = p.textContent.replace(/\s+/g, ' ').trim();
          if (text) {
            data.aboutParagraphs.push(text);
          }
        });
      }

      if (title === 'Recent Work') {
        col.querySelectorAll('p').forEach(function (p) {
          extractWorkItemsFromParagraph(p).forEach(function (item) {
            data.work.push(item);
          });
        });
      }
    });

    // Canonical service list from WP settings (PASite.services) — stays in sync with booking.
    data.services = getBookableServices();

    if (!data.aboutParagraphs.length) {
      data.aboutParagraphs = [
        (window.PASite && PASite.tagline) ||
          'Photography, video & live production across Pennsylvania.',
      ];
    }

    data.aboutParagraphs = resolveAboutParagraphs(data.aboutParagraphs);
    ensureRecognitionItems(data);

    return data;
  }

  function buildFooterGlassHero() {
    var hero = document.createElement('div');
    hero.className = 'pa-footer-glass__hero animate fade-up';

    var eyebrow = document.createElement('p');
    eyebrow.className = 'pa-footer-glass__eyebrow';
    eyebrow.textContent = (window.PASite && PASite.siteName) || 'Pennsylvania Media Arts';
    hero.appendChild(eyebrow);

    var lead = document.createElement('p');
    lead.className = 'pa-footer-glass__lead';
    lead.textContent = (window.PASite && PASite.tagline) ||
      'Photography, video & live production · Central Pennsylvania';
    hero.appendChild(lead);

    return hero;
  }

  function getFooterServiceLabel(name) {
    var labels = (window.PASite && PASite.footerServiceLabels) || {};
    return labels[name] || name;
  }

  function getFooterWorkItems() {
    if (window.PASite && PASite.footerWork && PASite.footerWork.length) {
      return PASite.footerWork.slice(0, 5);
    }
    return [];
  }

  function getFooterRecognition() {
    if (window.PASite && PASite.footerRecognition) {
      return PASite.footerRecognition;
    }
    return {
      title: '2026 CPMA · Best Videography Nominee',
      detail: 'Central Pennsylvania Music Awards',
      href: 'https://cpmhof.com/2026-winners',
    };
  }

  function serviceBookingHref(serviceName) {
    var base = bookingUrl();
    var sep = base.indexOf('?') === -1 ? '?' : '&';
    return base + sep + 'service=' + encodeURIComponent(serviceName);
  }

  function buildFooterInfoGrid(data) {
    var grid = document.createElement('div');
    grid.className = 'pa-footer-glass__grid stagger';

    grid.appendChild(buildFooterGlassPanel(
      'Services',
      'pa-footer-services',
      function (body) {
        var list = document.createElement('ul');
        list.className = 'pa-footer-service-chips';
        data.services.slice(0, 6).forEach(function (name) {
          var li = document.createElement('li');
          var a = document.createElement('a');
          a.className = 'pa-footer-service-chip';
          a.href = serviceBookingHref(name);
          a.textContent = getFooterServiceLabel(name);
          li.appendChild(a);
          list.appendChild(li);
        });
        body.appendChild(list);
        var all = document.createElement('a');
        all.className = 'pa-footer-glass__link';
        all.href = ((window.PASite && PASite.homeUrl) || '/').replace(/\/?$/, '/') + 'services/';
        all.textContent = 'All services';
        body.appendChild(all);
      }
    ));

    var geoLinks = (window.PASite && PASite.geoLandingLinks) || [];
    if (geoLinks.length) {
      grid.appendChild(buildFooterGlassPanel(
        'Central PA',
        'pa-footer-geo',
        function (body) {
          var list = document.createElement('ul');
          list.className = 'pa-footer-geo-links';
          geoLinks.forEach(function (item) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.className = 'pa-footer-glass__link';
            a.href = item.url;
            a.textContent = item.label;
            li.appendChild(a);
            list.appendChild(li);
          });
          body.appendChild(list);
        }
      ));
    }

    grid.appendChild(buildFooterGlassPanel(
      'About',
      'pa-footer-about',
      function (body) {
        var paragraphs = data.aboutParagraphs.slice(0, 2);
        paragraphs.forEach(function (text) {
          var p = document.createElement('p');
          p.textContent = text;
          body.appendChild(p);
        });
        var badge = getFooterRecognition();
        var badgeEl = document.createElement('a');
        badgeEl.className = 'pa-footer-glass__badge';
        badgeEl.href = badge.href || '#';
        if (badge.href && badge.href.indexOf('http') === 0) {
          badgeEl.target = '_blank';
          badgeEl.rel = 'noopener noreferrer';
        }
        var badgeTitle = document.createElement('span');
        badgeTitle.className = 'pa-footer-glass__badge-title';
        badgeTitle.textContent = badge.title || '';
        badgeEl.appendChild(badgeTitle);
        if (badge.detail) {
          var badgeDetail = document.createElement('span');
          badgeDetail.className = 'pa-footer-glass__badge-detail';
          badgeDetail.textContent = badge.detail;
          badgeEl.appendChild(badgeDetail);
        }
        body.appendChild(badgeEl);
      }
    ));

    grid.appendChild(buildFooterGlassPanel(
      'Selected work',
      'pa-footer-work',
      function (body) {
        var list = document.createElement('ul');
        list.className = 'pa-footer-work-compact';
        var items = getFooterWorkItems();
        if (!items.length) {
          items = data.work.slice(0, 4).map(function (item) {
            return {
              title: (item.lines && item.lines[0]) || 'Project',
              detail: (item.lines && item.lines.slice(1).join(' · ')) || '',
              href: item.href || workPageUrl(),
            };
          });
        }
        items.forEach(function (item) {
          var li = document.createElement('li');
          var row = document.createElement('a');
          row.className = 'pa-footer-work-row';
          row.href = item.href || workPageUrl();
          if (row.href.indexOf('http') === 0) {
            row.target = '_blank';
            row.rel = 'noopener noreferrer';
          }
          var title = document.createElement('span');
          title.className = 'pa-footer-work-row__title';
          title.textContent = item.title || '';
          row.appendChild(title);
          if (item.detail) {
            var detail = document.createElement('span');
            detail.className = 'pa-footer-work-row__detail';
            detail.textContent = item.detail;
            row.appendChild(detail);
          }
          li.appendChild(row);
          list.appendChild(li);
        });
        body.appendChild(list);
        var viewAll = document.createElement('a');
        viewAll.className = 'pa-footer-glass__link';
        viewAll.href = workPageUrl();
        viewAll.textContent = 'View all work';
        body.appendChild(viewAll);
      }
    ));

    return grid;
  }

  function buildFooterGlassPanel(title, id, fill) {
    var panel = document.createElement('section');
    panel.className = 'pa-footer-glass__panel animate fade-up';
    if (id) {
      panel.id = id;
    }

    var h = document.createElement('h3');
    h.className = 'pa-footer-glass__heading';
    h.textContent = title;
    panel.appendChild(h);

    var body = document.createElement('div');
    body.className = 'pa-footer-glass__body';
    fill(body);
    panel.appendChild(body);

    return panel;
  }

  function buildFooterActionBar() {
    var bar = document.createElement('div');
    bar.className = 'pa-footer-glass__actions animate fade-up';

    var socialSlot = document.createElement('div');
    socialSlot.className = 'pa-footer-glass__social-slot';
    bar.appendChild(socialSlot);

    if (!isBookingPage()) {
      var cta = document.createElement('a');
      cta.className = 'pa-footer-book-cta wp-element-button';
      cta.href = bookingUrl();
      cta.textContent = 'Book now';
      bar.appendChild(cta);
    }

    return bar;
  }

  /** @deprecated use buildFooterActionBar — kept for cached scripts */
  function buildFooterCtaStrip() {
    return buildFooterActionBar();
  }

  /** @deprecated use buildFooterGlassPanel */
  function buildFooterPanel(title, id, fill) {
    return buildFooterGlassPanel(title, id, fill);
  }

  function replaceFooterBookingColumn() {
    /* Replaced by rebuildSiteFooter — kept as no-op for cached script compatibility. */
  }

  function injectLegalFooter() {
    var footer = document.querySelector('footer.wp-block-template-part');
    if (!footer) {
      return;
    }

    var existingLegal = footer.querySelector('.pa-legal-footer');
    if (existingLegal) {
      existingLegal.querySelectorAll('.pa-legal-email').forEach(function (el) {
        el.remove();
      });
      placeFooterBrandInLegal(footer, existingLegal);
      return;
    }

    var wrap = footer.querySelector(':scope > .wp-block-group');
    if (!wrap) {
      return;
    }

    var legal = document.createElement('div');
    legal.className = 'pa-legal-footer';

    var entity = document.createElement('p');
    entity.className = 'pa-legal-entity';
    entity.textContent = (window.PASite && PASite.legalName) || 'Pennsylvania Media Arts LLC';
    legal.appendChild(entity);

    var location = document.createElement('p');
    location.className = 'pa-legal-location';
    location.textContent = (window.PASite && PASite.businessLocation) || 'New Cumberland, Pennsylvania';
    legal.appendChild(location);

    var links = document.createElement('p');
    links.className = 'pa-legal-links';
    var privacyHref = (window.PASite && PASite.privacyUrl) || '/privacy-policy/';
    var termsHref = (window.PASite && PASite.termsUrl) || '/terms-of-service/';

    appendLegalLink(links, 'Privacy', privacyHref);
    links.appendChild(document.createTextNode(' · '));
    appendLegalLink(links, 'Terms', termsHref);
    legal.appendChild(links);

    placeFooterBrandInLegal(footer, legal);

    wrap.appendChild(legal);
  }

  function appendLegalLink(parent, label, href) {
    var a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    parent.appendChild(a);
  }

  function getFooterNavLinks() {
    var links = [];
    document.querySelectorAll('footer .wp-block-navigation a.wp-block-navigation-item__content').forEach(function (a) {
      var label = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (!label || !a.href || isContactNavLabel(label) || isContactHref(a.href)) {
        return;
      }
      links.push({ label: label, href: a.href });
    });
    if (links.length) {
      return links;
    }
    var homeUrl = (window.PASite && PASite.homeUrl) || '/';
    return [
      { label: 'Home', href: homeUrl },
      { label: 'Work', href: workPageUrl() },
      { label: 'Services', href: homeUrl.replace(/\/?$/, '/') + 'services/' },
    ];
  }

  function isCurrentNavLink(href) {
    try {
      var url = new URL(href, window.location.href);
      var hash = url.hash || '';
      var target = url.pathname.replace(/\/$/, '') || '/';
      var current = window.location.pathname.replace(/\/$/, '') || '/';
      if (hash === '#pa-portfolio' || hash === '#pa-about') {
        return window.location.hash === hash;
      }
      if (target === '/work' || href.indexOf('/work') !== -1) {
        return current === '/work' || document.body.classList.contains('pa-work-page');
      }
      if (target === '/book' || href.indexOf('/book') !== -1) {
        return current === '/book' || document.body.classList.contains('pa-booking-page');
      }
      if (target === '/' && (current === '/' || current === '/book')) {
        return current === '/' && !window.location.hash;
      }
      return target === current;
    } catch (e) {
      return false;
    }
  }

  function findHeaderNavigation() {
    return (
      document.querySelector('.pa-home-post-hero-chrome .wp-block-navigation') ||
      document.querySelector('header.pa-site-header .wp-block-navigation') ||
      document.querySelector('header.wp-block-template-part .wp-block-navigation')
    );
  }

  function ensureFloatingNavClasses() {
    var nav = findHeaderNavigation();
    if (!nav) {
      return;
    }
    var list = nav.querySelector('ul, .wp-block-navigation__container');
    if (list) {
      list.classList.add('pa-site-nav-pill-row', 'pa-nav-dock', 'pa-nav-floating-pills', 'pa-premium-header-nav');
    }
    nav.classList.add('pa-premium-header-nav');
    document.body.classList.add('pa-premium-nav');
  }

  function triggerPremiumHeaderNav() {
    ensureFloatingNavClasses();
    if (window.PAHeaderNav && typeof window.PAHeaderNav.enhance === 'function') {
      window.PAHeaderNav.enhance(findHeaderNavigation());
    }
  }

  function polishHeaderNav() {
    var headerNav = findHeaderNavigation();
    if (!headerNav || headerNav.classList.contains('pa-site-header-nav-ready')) {
      triggerPremiumHeaderNav();
      return;
    }
    headerNav.classList.add('pa-site-header-nav-ready');

    var list = headerNav.querySelector('ul, .wp-block-navigation__container');
    if (list) {
      list.classList.add('pa-site-nav-pill-row', 'pa-nav-dock', 'pa-nav-floating-pills', 'pa-premium-header-nav');
    }
    document.body.classList.add('pa-premium-nav');
    headerNav.classList.add('pa-premium-header-nav');

    headerNav.querySelectorAll('.wp-block-navigation-item__content').forEach(function (a) {
      a.classList.add('pa-site-nav-pill');
      if (isCurrentNavLink(a.href)) {
        a.classList.add('is-current');
        a.setAttribute('aria-current', 'page');
      }
    });

    triggerPremiumHeaderNav();
  }

  function polishFooterNav() {
    var footer = document.querySelector('footer.wp-block-template-part');
    if (!footer || footer.querySelector('.pa-site-bottom-nav')) {
      return;
    }

    document.querySelectorAll('footer .wp-block-navigation').forEach(function (nav) {
      nav.classList.add('pa-footer-nav-legacy');
      var parent = nav.closest('.wp-block-group');
      if (parent && parent.querySelector('.wp-block-navigation') && !parent.querySelector('.pa-site-footer-pro')) {
        parent.classList.add('pa-footer-clutter-hidden');
      }
    });

    var links = getFooterNavLinks();
    var nav = document.createElement('nav');
    nav.className = 'pa-site-bottom-nav';
    nav.setAttribute('aria-label', 'Site navigation');

    var list = document.createElement('div');
    list.className = 'pa-site-bottom-nav-links';

    links.forEach(function (item) {
      var a = document.createElement('a');
      a.href = item.href;
      a.className = 'pa-site-bottom-nav-link pa-site-nav-pill';
      a.textContent = item.label;
      if (isCurrentNavLink(item.href)) {
        a.classList.add('is-current');
        a.setAttribute('aria-current', 'page');
      }
      list.appendChild(a);
    });

    nav.appendChild(list);

    var wrap = footer.querySelector(':scope > .wp-block-group');
    if (wrap) {
      wrap.appendChild(nav);
    } else {
      footer.appendChild(nav);
    }
  }

  /**
   * Turn the homepage skyline cover into a cinematic, full-bleed hero with a
   * headline, lead, primary/secondary CTAs and the CPMA award badge. Uses only
   * safe DOM APIs (createElement/textContent) with static, verified copy.
   */
  function buildHomeHero() {
    var cover = document.querySelector('.wp-block-cover.alignfull');
    if (!cover || cover.classList.contains('pa-home-hero')) {
      return;
    }
    cover.classList.add('pa-home-hero');

    var inner = cover.querySelector('.wp-block-cover__inner-container');
    var host = inner || cover;

    var content = document.createElement('div');
    content.className = 'pa-hero-content';

    var eyebrow = document.createElement('p');
    eyebrow.className = 'pa-hero-eyebrow';
    eyebrow.textContent = 'Multimedia production \u00b7 Central Pennsylvania';
    content.appendChild(eyebrow);

    var h1 = document.createElement('h1');
    h1.className = 'pa-hero-title';
    h1.textContent = 'Photography, video & live production for Pennsylvania events.';
    content.appendChild(h1);

    var lead = document.createElement('p');
    lead.className = 'pa-hero-lead';
    lead.textContent =
      'One team for sound, visuals, and design \u2014 capturing concerts, weddings, and brand stories across Central PA for over 15 years.';
    content.appendChild(lead);

    var actions = document.createElement('div');
    actions.className = 'pa-hero-actions';

    var primary = document.createElement('a');
    primary.className = 'pa-hero-btn pa-hero-btn-primary';
    primary.href = bookingUrl();
    primary.textContent = 'Book your date';
    actions.appendChild(primary);

    var secondary = document.createElement('a');
    secondary.className = 'pa-hero-btn pa-hero-btn-secondary';
    secondary.href = '#pa-portfolio';
    secondary.textContent = 'View our work';
    actions.appendChild(secondary);

    content.appendChild(actions);

    var badge = document.createElement('a');
    badge.className = 'pa-hero-badge';
    badge.href = 'https://cpmhof.com/2026-winners';
    badge.target = '_blank';
    badge.rel = 'noopener';
    var star = document.createElement('span');
    star.className = 'pa-hero-badge-star';
    star.setAttribute('aria-hidden', 'true');
    star.textContent = '\u2605';
    badge.appendChild(star);
    var badgeText = document.createElement('span');
    badgeText.className = 'pa-hero-badge-text';
    badgeText.textContent = '2026 CPMA \u2014 Best Videography Nominee';
    badge.appendChild(badgeText);
    content.appendChild(badge);

    host.appendChild(content);
    document.body.classList.add('pa-has-home-hero');
    Array.prototype.forEach.call(content.children, function (el, i) {
      el.classList.add('pa-scroll-reveal', 'pa-scroll-reveal--hero');
      el.style.setProperty('--pa-reveal-i', String(i));
      revealInView(el, i);
    });
  }

  function applyGlassLayout() {
    if (document.body.classList.contains('home')) {
      var cover = document.querySelector('.wp-block-cover.alignfull');
      if (cover) {
        cover.classList.add('pa-home-hero');
      }
      if (cover && !cover.closest('.pa-glass-hero-wrap')) {
        var wrap = document.createElement('div');
        wrap.className = 'pa-glass-hero-wrap';
        cover.parentNode.insertBefore(wrap, cover);
        wrap.appendChild(cover);
      }
    } else if (!isBookingPage()) {
      compactInteriorPageHeader();
    }

    document.body.classList.add('pa-ios-ui');

    var booking = document.querySelector('.pa-booking-root');
    if (booking) {
      booking.classList.add('pa-ios-glass');
    }

    glassifyContentSections();
  }

  /** Wrap major page sections in frosted glass panels (all pages). */
  function glassifyContentSections() {
    var main = document.querySelector('main .entry-content, main .wp-block-post-content');
    if (!main) {
      return;
    }

    main.querySelectorAll(
      ':scope > .wp-block-group, :scope > .wp-block-columns, :scope > .wp-block-gallery, :scope > .wp-block-image'
    ).forEach(function (el) {
      if (el.classList.contains('pa-glass-card') || el.closest('.pa-booking-root')) {
        return;
      }
      if (el.matches('.wp-block-heading')) {
        return;
      }
      el.classList.add('pa-glass-card');
    });

    var pageTitle = document.querySelector('main .wp-block-post-title, main h1.wp-block-heading');
    if (pageTitle && !pageTitle.closest('.pa-glass-card')) {
      pageTitle.classList.add('pa-glass-page-title');
    }
  }

  function suppressLegacyThemeBlocks() {
    var protectedSel = '.pa-site-footer-pro, .pa2-hero, .pa2-services, .pa2-reviews, .pa2-cta, #pa-portfolio, #pa2-work, .pa2-work-page, #pa-youtube-feature, .pa-services-showcase, .pa-about-showcase, .pa-booking-root';
    var legacyTitles = ['Services Offered', 'Recent Work', 'Booking', 'About'];

    function hideByHeading(root) {
      if (!root) {
        return;
      }
      root.querySelectorAll('h1, h2, h3, h4, .wp-block-heading').forEach(function (heading) {
        var title = heading.textContent.replace(/\s+/g, ' ').trim();
        if (legacyTitles.indexOf(title) === -1) {
          return;
        }
        if (heading.closest(protectedSel)) {
          return;
        }
        var block = heading.closest('.wp-block-column, .wp-block-columns, .wp-block-group');
        if (!block || block.closest(protectedSel)) {
          return;
        }
        block.classList.add('pa-theme-legacy-hidden');
        block.setAttribute('aria-hidden', 'true');
        block.hidden = true;
      });
    }

    var footer = document.querySelector('footer.wp-block-template-part, footer.pa-site-footer');
    if (footer) {
      footer.querySelectorAll('.wp-block-columns').forEach(function (columns) {
        if (columns.closest('.pa-site-footer-pro')) {
          return;
        }
        columns.classList.add('pa-footer-legacy', 'pa-theme-legacy-hidden');
        columns.setAttribute('aria-hidden', 'true');
        columns.hidden = true;
      });
      hideByHeading(footer);
    }

    hideByHeading(document.querySelector('main'));
  }

  function hideDuplicateBookingColumn() {
    suppressLegacyThemeBlocks();
  }

  /**
   * Replace the plain WordPress services copy with a structured showcase:
   * hero intro, three service cards, and a direct book CTA (no "contact for rates").
   */
  function buildServicesPage() {
    if (document.getElementById('pa-services') || document.querySelector('.pa-services-showcase')) {
      return;
    }
    var main = document.querySelector('main .entry-content, main .wp-block-post-content');
    if (!main) {
      return;
    }

    var services = getServicesPageData();
    if (!services.length) {
      return;
    }

    var showcase = document.createElement('section');
    showcase.className = 'pa-services-showcase';
    showcase.id = 'pa-services';
    showcase.setAttribute('aria-labelledby', 'pa-services-title');

    var hero = document.createElement('header');
    hero.className = 'pa-services-hero';

    var eyebrow = document.createElement('p');
    eyebrow.className = 'pa-services-eyebrow';
    eyebrow.textContent = 'Pennsylvania Media Arts';
    hero.appendChild(eyebrow);

    var title = document.createElement('h1');
    title.className = 'pa-services-title';
    title.id = 'pa-services-title';
    title.textContent = 'Live audio, video & photography production';
    hero.appendChild(title);

    var lead = document.createElement('p');
    lead.className = 'pa-services-lead';
    lead.textContent =
      'We capture, mix, and deliver professional multimedia for concerts, venues, brands, and creators across Central Pennsylvania — one team from load-in to final deliverables.';
    hero.appendChild(lead);

    var pillars = document.createElement('div');
    pillars.className = 'pa-services-pillars';
    pillars.setAttribute('aria-label', 'Core services');
    ['Live audio', 'Video production', 'Photography'].forEach(function (label) {
      var pill = document.createElement('span');
      pill.className = 'pa-services-pillar';
      pill.textContent = label;
      pillars.appendChild(pill);
    });
    hero.appendChild(pillars);

    showcase.appendChild(hero);

    var offerings = document.createElement('div');
    offerings.className = 'pa-services-offerings';

    var offeringsHead = document.createElement('header');
    offeringsHead.className = 'pa-services-offerings-head';

    var offeringsEyebrow = document.createElement('p');
    offeringsEyebrow.className = 'pa-services-offerings-eyebrow';
    offeringsEyebrow.textContent = 'What we offer';
    offeringsHead.appendChild(offeringsEyebrow);

    var offeringsLead = document.createElement('p');
    offeringsLead.className = 'pa-services-offerings-lead';
    offeringsLead.textContent =
      'Live audio production, photography, and video — scoped clearly and ready to book online.';
    offeringsHead.appendChild(offeringsLead);

    offerings.appendChild(offeringsHead);

    var grid = document.createElement('div');
    grid.className = 'pa-services-cards';
    grid.setAttribute('role', 'list');

    services.forEach(function (svc, index) {
      grid.appendChild(buildServiceCard(svc, index));
    });
    offerings.appendChild(grid);
    showcase.appendChild(offerings);

    var proof = document.createElement('div');
    proof.className = 'pa-services-proof';
    var proofText = document.createElement('p');
    proofText.className = 'pa-services-proof-text';
    proofText.textContent =
      '15+ years producing live events and creative work in Central PA · 2026 CPMA Best Videography Nominee';
    proof.appendChild(proofText);
    showcase.appendChild(proof);

    var book = document.createElement('div');
    book.className = 'pa-services-book';

    var bookTitle = document.createElement('h2');
    bookTitle.className = 'pa-services-book-title';
    bookTitle.textContent = 'Ready to book?';
    book.appendChild(bookTitle);

    var bookLead = document.createElement('p');
    bookLead.className = 'pa-services-book-lead';
    bookLead.textContent =
      'Choose your services and date online. Secure your slot with a deposit — no email back-and-forth.';
    book.appendChild(bookLead);

    var bookBtn = document.createElement('a');
    bookBtn.className = 'pa-services-book-btn wp-element-button';
    bookBtn.href = bookingUrl();
    bookBtn.textContent = 'Book your date';
    book.appendChild(bookBtn);

    showcase.appendChild(book);
    main.insertBefore(showcase, main.firstChild);

    Array.prototype.forEach.call(main.children, function (child) {
      if (child === showcase) {
        return;
      }
      child.classList.add('pa-services-legacy-hidden');
      child.setAttribute('aria-hidden', 'true');
    });

    document.body.classList.add('pa-has-services-showcase');
    refreshScrollReveal(showcase);
  }

  function getServicesPageData() {
    var bookable = getBookableServices();
    var catalog = {
      'Event Photography': {
        id: 'photo',
        mark: 'Photo',
        title: 'Event Photography',
        tagline: 'Story-driven stills for weddings, galas, and live events.',
        summary: 'Disciplined framing and clean color for artists, businesses, and live events. Still imagery that matches your brand and reads professionally in print and online.',
        includes: ['Edited high-resolution gallery delivery', 'Online sharing link for guests', 'Pre-event planning call'],
        idealFor: ['Weddings', 'Corporate events', 'Private parties', 'Live events'],
      },
      'Video Production': {
        id: 'video',
        mark: 'Video',
        title: 'Video Production',
        tagline: 'Cinematic capture and in-house editing — from stage to final cut.',
        summary: 'Performance coverage, multicam shoots, and post-production for artists, businesses, and creators. One team shoots and edits so your story stays cohesive.',
        includes: ['Live performance and multicam coverage', 'Edited highlight reel', 'In-house edit, color, and delivery'],
        idealFor: ['Artists', 'Businesses', 'Concerts', 'Event highlights'],
      },
      'Live Audio / PA': {
        id: 'audio',
        mark: 'Audio',
        title: 'Live Audio Production',
        tagline: 'End-to-end sound reinforcement — designed, mixed, and struck with care.',
        summary: 'Full PA and live sound for concerts, showcases, open mics, and public events. We handle system design through teardown so artists and audiences hear the show as intended.',
        includes: ['FOH and monitor mixing', 'System design, load-in, and strike', 'Digital consoles and wireless coordination'],
        idealFor: ['Concerts', 'Venues', 'Ceremonies', 'Corporate events'],
      },
      'DJ Services': {
        id: 'dj',
        mark: 'DJ',
        title: 'DJ Services',
        tagline: 'Music programming, MC announcements, and dance-floor energy.',
        summary: 'Professional DJ and sound system for weddings, private parties, and school events. Custom playlist planning and MC for key announcements.',
        includes: ['Professional DJ & sound system', 'MC for key announcements', 'Custom playlist planning'],
        idealFor: ['Weddings', 'Private parties', 'School events'],
      },
      'Photo + Video Bundle': {
        id: 'bundle',
        mark: 'Bundle',
        title: 'Photo + Video Bundle',
        tagline: 'Coordinated photo and video team — one booking, one timeline.',
        summary: 'Photography and video crew on the same schedule with matched editing style. Single point of contact for weddings, large celebrations, and brand launches.',
        includes: ['Photo + video crew on the same schedule', 'Matched editing style', 'Single point of contact'],
        idealFor: ['Weddings', 'Large celebrations', 'Brand launches'],
        recommended: true,
      },
    };

    return bookable.map(function (name, index) {
      var entry = catalog[name];
      if (entry) {
        return entry;
      }
      return {
        id: 'svc-' + index,
        mark: String(index + 1),
        title: name,
        tagline: 'Professional event coverage across Pennsylvania.',
        summary: 'Dedicated PA Media Arts crew with pre-production planning and deliverables per your quote.',
        includes: ['Dedicated PA Media Arts crew', 'Pre-production planning', 'Deliverables per your quote'],
        idealFor: ['Events throughout Central PA'],
      };
    });
  }

  function buildServiceCard(svc, index) {
    var card = document.createElement('article');
    card.className = 'pa-services-card pa-services-card--' + svc.id +
      (svc.recommended ? ' is-recommended' : '');
    card.setAttribute('role', 'listitem');
    card.style.setProperty('--pa-service-i', String(index));

    var head = document.createElement('div');
    head.className = 'pa-services-card-head';

    if (svc.recommended) {
      var rec = document.createElement('span');
      rec.className = 'pa-services-card-recommended';
      rec.textContent = 'Most popular';
      card.appendChild(rec);
    }

    var mark = document.createElement('span');
    mark.className = 'pa-services-card-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = svc.mark || String(index + 1);
    head.appendChild(mark);

    var headText = document.createElement('div');
    headText.className = 'pa-services-card-head-text';

    var indexLabel = document.createElement('span');
    indexLabel.className = 'pa-services-card-index';
    indexLabel.textContent = String(index + 1).padStart(2, '0');
    headText.appendChild(indexLabel);

    var h2 = document.createElement('h2');
    h2.className = 'pa-services-card-title';
    h2.textContent = svc.title;
    headText.appendChild(h2);

    var tagline = document.createElement('p');
    tagline.className = 'pa-services-card-tagline';
    tagline.textContent = svc.tagline;
    headText.appendChild(tagline);

    head.appendChild(headText);
    card.appendChild(head);

    var summary = document.createElement('p');
    summary.className = 'pa-services-card-summary';
    summary.textContent = svc.summary;
    card.appendChild(summary);

    var body = document.createElement('div');
    body.className = 'pa-services-card-body';

    if (svc.includes && svc.includes.length) {
      var includesBlock = document.createElement('div');
      includesBlock.className = 'pa-services-card-includes';

      var includesLabel = document.createElement('h3');
      includesLabel.className = 'pa-services-card-label';
      includesLabel.textContent = 'What\u2019s included';
      includesBlock.appendChild(includesLabel);

      var list = document.createElement('ul');
      list.className = 'pa-services-card-list';
      svc.includes.forEach(function (line) {
        var li = document.createElement('li');
        li.textContent = line;
        list.appendChild(li);
      });
      includesBlock.appendChild(list);
      body.appendChild(includesBlock);
    }

    if (svc.idealFor && svc.idealFor.length) {
      var idealBlock = document.createElement('div');
      idealBlock.className = 'pa-services-card-ideal';

      var idealLabel = document.createElement('h3');
      idealLabel.className = 'pa-services-card-label';
      idealLabel.textContent = 'Ideal for';
      idealBlock.appendChild(idealLabel);

      var tags = document.createElement('div');
      tags.className = 'pa-services-card-tags';
      tags.setAttribute('role', 'list');
      svc.idealFor.forEach(function (label) {
        var tag = document.createElement('span');
        tag.className = 'pa-services-card-tag';
        tag.setAttribute('role', 'listitem');
        tag.textContent = label;
        tags.appendChild(tag);
      });
      idealBlock.appendChild(tags);
      body.appendChild(idealBlock);
    }

    card.appendChild(body);
    return card;
  }

  function injectServicesGrid() {
    var servicesHeading = null;
    document.querySelectorAll('.entry-content .wp-block-heading').forEach(function (h) {
      if (h.textContent.trim() === 'Services Offered') {
        servicesHeading = h;
      }
    });
    if (!servicesHeading || document.querySelector('.pa-services-grid')) {
      return;
    }
    var services = getBookableServices();
    var grid = document.createElement('div');
    grid.className = 'pa-services-grid';
    grid.setAttribute('aria-label', 'Services');
    services.forEach(function (name, index) {
      var link = document.createElement('a');
      link.href = bookingUrl();
      link.textContent = name;
      link.style.setProperty('--pa-reveal-i', String(index));
      grid.appendChild(link);
    });
    servicesHeading.parentNode.insertBefore(grid, servicesHeading.nextSibling);
    refreshScrollReveal(grid);

    var sibling = grid.nextElementSibling;
    while (sibling) {
      if (sibling.classList && sibling.classList.contains('wp-block-heading')) {
        break;
      }
      sibling.style.display = 'none';
      sibling = sibling.nextElementSibling;
    }
  }

  /**
   * Reorder the homepage so it sells before it asks: featured work and
   * portfolio lead, the booking form moves to the bottom, and stray empty
   * paragraphs left by the page builder are removed.
   */
  function reorderHomeSections() {
    relocateHomeShellFromHeader();
    var main = document.querySelector('main .entry-content, main .wp-block-post-content');
    if (!main) {
      return;
    }
    Array.prototype.slice.call(main.children).forEach(function (el) {
      if (
        el.tagName === 'P' &&
        !el.textContent.trim() &&
        !el.querySelector('img, a, iframe, button')
      ) {
        main.removeChild(el);
      }
    });
    var booking = main.querySelector(':scope > .pa-booking-root');
    var sticky = main.querySelector(':scope > .pa-booking-sticky');
    if (booking) {
      main.appendChild(booking);
    }
    if (sticky) {
      main.appendChild(sticky);
    }
    relocateHomeChromeBelowHero();
  }

  /**
   * Homepage bottom: intentional closing band + hide embedded wizard (use /book/).
   */
  function buildHomeClosingBand() {
    if (document.getElementById('pa-home-closing')) {
      return;
    }
    var main = document.querySelector('main .entry-content, main .wp-block-post-content');
    if (!main) {
      return;
    }

    var booking = main.querySelector(':scope > .pa-booking-root');
    var sticky = main.querySelector(':scope > .pa-booking-sticky');
    if (booking) {
      booking.classList.add('pa-booking-root--home-embed');
      booking.setAttribute('aria-hidden', 'true');
    }
    if (sticky) {
      sticky.hidden = true;
      sticky.setAttribute('aria-hidden', 'true');
    }

    var band = document.createElement('section');
    band.className = 'pa-home-closing';
    band.id = 'pa-home-closing';
    band.setAttribute('aria-labelledby', 'pa-home-closing-title');

    var inner = document.createElement('div');
    inner.className = 'pa-home-closing-inner';

    var eyebrow = document.createElement('p');
    eyebrow.className = 'pa-home-closing-eyebrow';
    eyebrow.textContent = 'Pennsylvania Media Arts';
    inner.appendChild(eyebrow);

    var title = document.createElement('h2');
    title.className = 'pa-home-closing-title';
    title.id = 'pa-home-closing-title';
    title.textContent = 'Ready to book your session?';
    inner.appendChild(title);

    var lead = document.createElement('p');
    lead.className = 'pa-home-closing-lead';
    lead.textContent =
      'Choose your package, date, and time — then secure your date with a quick deposit on our booking page.';
    inner.appendChild(lead);

    var actions = document.createElement('div');
    actions.className = 'pa-home-closing-actions';

    var book = document.createElement('a');
    book.className = 'pa-home-closing-btn pa-home-closing-btn-primary wp-element-button';
    book.href = bookingUrl();
    book.textContent = 'Start booking';
    actions.appendChild(book);

    var work = document.createElement('a');
    work.className = 'pa-home-closing-btn pa-home-closing-btn-secondary';
    work.href = '#pa-portfolio';
    work.textContent = 'View work';
    actions.appendChild(work);

    inner.appendChild(actions);

    var nav = document.createElement('nav');
    nav.className = 'pa-home-closing-nav';
    nav.setAttribute('aria-label', 'Explore');

    [
      { href: '/services/', label: 'Services' },
      { href: '#pa-about', label: 'About' },
      { href: (window.PASite && PASite.youtubeChannelUrl) || 'https://www.youtube.com/@PAMediaArts', label: 'YouTube', external: true },
    ].forEach(function (item) {
      var link = document.createElement('a');
      link.className = 'pa-home-closing-nav-link';
      link.href = item.href;
      link.textContent = item.label;
      if (item.external) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      nav.appendChild(link);
    });
    inner.appendChild(nav);

    band.appendChild(inner);

    if (booking) {
      main.insertBefore(band, booking);
    } else {
      main.appendChild(band);
    }

    document.body.classList.add('pa-has-home-closing');
    refreshScrollReveal(band);
  }

  function markSectionAnchors() {
    var map = {
      'pa-footer-services': 'pa-services',
      'pa-footer-about': 'pa-about',
      'pa-footer-work': 'pa-work',
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.id = map[id];
      }
    });
  }

  // ---------------------------------------------------------------------------
  // About page — Jordan Zabady, Founder & CEO
  // Builds a structured founder profile page using the same glass-card
  // design system as the services page.
  // Requires a WordPress page with slug "about".
  // ---------------------------------------------------------------------------

  /**
   * Entry point. Builds and injects the about-page showcase.
   * Hides legacy WP content so only the structured version is visible.
   */
  function buildAboutPage() {
    if (document.querySelector('.pa-about-showcase')) {
      return;
    }
    var main = document.querySelector('main .entry-content, main .wp-block-post-content');
    if (!main) {
      return;
    }

    var showcase = document.createElement('section');
    showcase.className = 'pa-about-showcase pa-reveal-section';
    showcase.id = 'pa-about';
    showcase.setAttribute('data-pa-atmosphere', 'warm');
    showcase.setAttribute('aria-label', 'About Jordan Zabady, Founder & CEO');

    showcase.appendChild(buildAboutHero());
    showcase.appendChild(buildAboutStory());
    showcase.appendChild(buildAboutStats());
    showcase.appendChild(buildAboutExpertise());
    showcase.appendChild(buildAboutCta());

    main.insertBefore(showcase, main.firstChild);

    Array.prototype.forEach.call(main.children, function (child) {
      if (child === showcase) {
        return;
      }
      child.classList.add('pa-about-legacy-hidden');
      child.setAttribute('aria-hidden', 'true');
    });

    document.body.classList.add('pa-has-about-showcase');
    refreshScrollReveal(showcase);
  }

  function buildAboutHero() {
    var hero = document.createElement('div');
    hero.className = 'pa-about-hero animate fade-up';

    var eyebrow = document.createElement('p');
    eyebrow.className = 'pa-about-eyebrow';
    eyebrow.textContent = 'Pennsylvania Media Arts LLC';
    hero.appendChild(eyebrow);

    var name = document.createElement('h1');
    name.className = 'pa-about-name';
    name.textContent = 'About Pennsylvania Media Arts';
    hero.appendChild(name);

    var role = document.createElement('p');
    role.className = 'pa-about-role';
    role.textContent = 'Founded by Jordan Zabady · Central PA event production';
    hero.appendChild(role);

    var lead = document.createElement('p');
    lead.className = 'pa-about-lead';
    lead.textContent =
      '15+ years producing live events and creative media across Central Pennsylvania — ' +
      'photography, video, and live sound under one roof, delivered by one team.';
    hero.appendChild(lead);

    var meta = document.createElement('p');
    meta.className = 'pa-about-meta';
    meta.textContent = 'New Cumberland, Pennsylvania  ·  jordan@pamedia.art';
    hero.appendChild(meta);

    return hero;
  }

  function buildAboutStory() {
    var card = document.createElement('div');
    card.className = 'pa-about-story animate fade-left';

    var eyebrow = document.createElement('p');
    eyebrow.className = 'pa-about-section-eyebrow';
    eyebrow.textContent = 'The Work';
    card.appendChild(eyebrow);

    var paras = [
      'Jordan Zabady founded Pennsylvania Media Arts on a single principle: one team, one standard, no handoffs. ' +
      'Every project — from a 500-person concert to a solo artist\'s press shoot — gets the same ' +
      'disciplined attention from load-in to final deliverable.',
      'With more than 15 years behind the board and behind the camera, Jordan brings a deep technical ' +
      'foundation in live sound reinforcement, a precise eye for still photography, and a narrative ' +
      'instinct for video that carries from the shoot floor into the edit suite.',
      'Nominated for Best Videography at the 2026 Central Pennsylvania Music Awards — hosted by the ' +
      'Central Pennsylvania Music Hall of Fame — Jordan and the PA Media Arts team serve artists, ' +
      'venues, businesses, and creators who demand professional results and reliable execution.',
    ];

    paras.forEach(function (text) {
      var p = document.createElement('p');
      p.className = 'pa-about-story-p';
      p.textContent = text;
      card.appendChild(p);
    });

    return card;
  }

  function buildAboutStats() {
    var row = document.createElement('div');
    row.className = 'pa-about-stats animate fade-up stagger';
    row.setAttribute('role', 'list');

    var stats = [
      {
        value: '15',
        suffix: '+',
        label: 'Years of Experience',
        note: 'Live events & creative media in Central PA',
      },
      {
        value: 'CPMA',
        label: '2026 Nominee',
        note: 'Best Videography · Central PA Music Awards',
      },
      {
        value: '3',
        label: 'Core Disciplines',
        note: 'Audio · Photography · Video — one team',
      },
    ];

    stats.forEach(function (s) {
      var item = document.createElement('div');
      item.className = 'pa-about-stat animate fade-up';
      item.setAttribute('role', 'listitem');

      var val = document.createElement('span');
      val.className = 'pa-about-stat-value';
      if (/^\d+$/.test(String(s.value))) {
        val.setAttribute('data-counter', String(s.value));
        if (s.suffix) {
          val.setAttribute('data-counter-suffix', s.suffix);
        }
      } else {
        val.textContent = s.value;
      }
      item.appendChild(val);

      var lbl = document.createElement('span');
      lbl.className = 'pa-about-stat-label';
      lbl.textContent = s.label;
      item.appendChild(lbl);

      var note = document.createElement('span');
      note.className = 'pa-about-stat-note';
      note.textContent = s.note;
      item.appendChild(note);

      row.appendChild(item);
    });

    return row;
  }

  function buildAboutExpertise() {
    var section = document.createElement('div');
    section.className = 'pa-about-expertise animate fade-right';

    var eyebrow = document.createElement('p');
    eyebrow.className = 'pa-about-section-eyebrow';
    eyebrow.textContent = 'Expertise';
    section.appendChild(eyebrow);

    var grid = document.createElement('div');
    grid.className = 'pa-about-expertise-grid';

    var disciplines = [
      {
        mark: '01',
        label: 'Live Audio',
        title: 'Sound Engineering',
        desc: 'FOH and monitor mixing, system design, digital consoles, wireless coordination, and full PA for concerts, venues, and public events.',
      },
      {
        mark: '02',
        label: 'Photography',
        title: 'Still Imaging',
        desc: 'Event and concert coverage, artist promos, brand and portrait sessions — clean color and disciplined framing for web and print.',
      },
      {
        mark: '03',
        label: 'Video',
        title: 'Production & Post',
        desc: 'Live performance capture, multicam, music videos, reels, and in-house editing — one team from the shoot floor to final cut.',
      },
    ];

    disciplines.forEach(function (d) {
      var card = document.createElement('div');
      card.className = 'pa-about-discipline';

      var head = document.createElement('div');
      head.className = 'pa-about-discipline-head';

      var mark = document.createElement('span');
      mark.className = 'pa-about-discipline-mark';
      mark.textContent = d.mark;
      head.appendChild(mark);

      var lbl = document.createElement('span');
      lbl.className = 'pa-about-discipline-label';
      lbl.textContent = d.label;
      head.appendChild(lbl);

      card.appendChild(head);

      var title = document.createElement('h3');
      title.className = 'pa-about-discipline-title';
      title.textContent = d.title;
      card.appendChild(title);

      var desc = document.createElement('p');
      desc.className = 'pa-about-discipline-desc';
      desc.textContent = d.desc;
      card.appendChild(desc);

      grid.appendChild(card);
    });

    section.appendChild(grid);
    return section;
  }

  function buildAboutCta() {
    var cta = document.createElement('div');
    cta.className = 'pa-about-cta animate fade-up';

    var title = document.createElement('h2');
    title.className = 'pa-about-cta-title';
    title.textContent = 'Work with Jordan';
    cta.appendChild(title);

    var lead = document.createElement('p');
    lead.className = 'pa-about-cta-lead';
    lead.textContent =
      'Book online — deposit secures your date, confirmed within one business day.';
    cta.appendChild(lead);

    var btn = document.createElement('a');
    btn.className = 'pa-about-cta-btn wp-element-button';
    btn.href = bookingUrl();
    btn.textContent = 'Book your date';
    cta.appendChild(btn);

    return cta;
  }

  /**
   * Click-to-enlarge lightbox for WordPress portfolio galleries.
   * Supports swipe on mobile, thumbnail strip, and filtered tile sets.
   */
  function initGalleryLightbox() {
    var tileSelector =
      '.pa-portfolio-showcase .pa-portfolio-tile, ' +
      '.entry-content .wp-block-gallery.alignfull .wp-block-image';

    function collectLightboxItems() {
      var items = [];
      document.querySelectorAll(tileSelector).forEach(function (figure) {
        if (figure.classList.contains('is-filtered-out') || figure.classList.contains('is-collapsed')) {
          return;
        }
        var img = figure.querySelector('img');
        if (!img) {
          return;
        }
        var full = img.dataset.paFullSrc || getFullImageUrl(img);
        if (!isAllowedImageUrl(full)) {
          return;
        }
        items.push({
          figure: figure,
          full: full,
          thumb: img.currentSrc || img.src || full,
          alt: img.getAttribute('alt') || '',
        });
      });
      return items;
    }

    function bindTile(figure) {
      if (figure.getAttribute('data-pa-lightbox-bound') === '1') {
        return;
      }
      var img = figure.querySelector('img');
      if (!img) {
        return;
      }
      optimizePortfolioTileImage(img, parseInt(figure.style.getPropertyValue('--pa-tile-i') || '0', 10));
      var full = img.dataset.paFullSrc || getFullImageUrl(img);
      if (!isAllowedImageUrl(full)) {
        return;
      }

      figure.classList.add('pa-gallery-tile');
      figure.setAttribute('role', 'button');
      figure.setAttribute('tabindex', '0');
      figure.setAttribute('aria-label', getImageLabel(img));
      figure.setAttribute('data-pa-lightbox-bound', '1');

      figure.addEventListener('click', function (e) {
        e.preventDefault();
        var items = collectLightboxItems();
        var idx = -1;
        for (var i = 0; i < items.length; i++) {
          if (items[i].figure === figure) {
            idx = i;
            break;
          }
        }
        if (idx < 0) {
          return;
        }
        openLightbox(items, idx);
      });
      figure.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          figure.click();
        }
      });
    }

    document.querySelectorAll(tileSelector).forEach(bindTile);
    rebindGalleryLightbox = function () {
      document.querySelectorAll(tileSelector).forEach(bindTile);
    };

    if (!document.querySelector(tileSelector)) {
      return;
    }

    var overlay = document.getElementById('pa-gallery-lightbox');
    var lightImg;
    var caption;
    var counter;
    var prevBtn;
    var nextBtn;
    var closeBtn;
    var strip;
    var stage;
    var state = { items: [], index: 0, lastFocus: null, touchStartX: 0 };

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pa-gallery-lightbox';
      overlay.className = 'pa-gallery-lightbox';
      overlay.hidden = true;
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Image preview');

      var backdrop = document.createElement('button');
      backdrop.type = 'button';
      backdrop.className = 'pa-gallery-lightbox-backdrop';
      backdrop.setAttribute('aria-label', 'Close preview');
      backdrop.addEventListener('click', closeLightbox);

      var panel = document.createElement('div');
      panel.className = 'pa-gallery-lightbox-panel';

      closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'pa-gallery-lightbox-close';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.textContent = '\u00d7';
      closeBtn.addEventListener('click', closeLightbox);

      prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'pa-gallery-lightbox-nav pa-gallery-lightbox-prev';
      prevBtn.setAttribute('aria-label', 'Previous image');
      prevBtn.textContent = '\u2039';
      prevBtn.addEventListener('click', function () { stepLightbox(-1); });

      nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'pa-gallery-lightbox-nav pa-gallery-lightbox-next';
      nextBtn.setAttribute('aria-label', 'Next image');
      nextBtn.textContent = '\u203a';
      nextBtn.addEventListener('click', function () { stepLightbox(1); });

      stage = document.createElement('div');
      stage.className = 'pa-gallery-lightbox-stage';

      lightImg = document.createElement('img');
      lightImg.className = 'pa-gallery-lightbox-img';
      lightImg.alt = '';
      stage.appendChild(lightImg);

      caption = document.createElement('p');
      caption.className = 'pa-gallery-lightbox-caption';

      counter = document.createElement('p');
      counter.className = 'pa-gallery-lightbox-counter';
      counter.setAttribute('aria-live', 'polite');

      strip = document.createElement('div');
      strip.className = 'pa-gallery-lightbox-strip';
      strip.setAttribute('role', 'tablist');
      strip.setAttribute('aria-label', 'Gallery thumbnails');

      panel.appendChild(closeBtn);
      panel.appendChild(prevBtn);
      panel.appendChild(nextBtn);
      panel.appendChild(stage);
      panel.appendChild(caption);
      panel.appendChild(counter);
      panel.appendChild(strip);
      overlay.appendChild(backdrop);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      stage.addEventListener('touchstart', function (e) {
        if (e.changedTouches && e.changedTouches[0]) {
          state.touchStartX = e.changedTouches[0].clientX;
        }
      }, { passive: true });

      stage.addEventListener('touchend', function (e) {
        if (!e.changedTouches || !e.changedTouches[0]) {
          return;
        }
        var dx = e.changedTouches[0].clientX - state.touchStartX;
        if (Math.abs(dx) < 48) {
          return;
        }
        stepLightbox(dx < 0 ? 1 : -1);
      }, { passive: true });

      overlay.addEventListener('keydown', function (e) {
        if (overlay.hidden) {
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          closeLightbox();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          stepLightbox(-1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          stepLightbox(1);
        }
      });
    } else {
      lightImg = overlay.querySelector('.pa-gallery-lightbox-img');
      caption = overlay.querySelector('.pa-gallery-lightbox-caption');
      counter = overlay.querySelector('.pa-gallery-lightbox-counter');
      prevBtn = overlay.querySelector('.pa-gallery-lightbox-prev');
      nextBtn = overlay.querySelector('.pa-gallery-lightbox-next');
      closeBtn = overlay.querySelector('.pa-gallery-lightbox-close');
      strip = overlay.querySelector('.pa-gallery-lightbox-strip');
      stage = overlay.querySelector('.pa-gallery-lightbox-stage');
    }

    function openLightbox(items, index) {
      state.items = items;
      state.index = Math.max(0, Math.min(index, items.length - 1));
      state.lastFocus = document.activeElement;
      overlay.hidden = false;
      document.body.classList.add('pa-gallery-lightbox-open');
      renderLightboxSlide();
      if (galleryFocusTrapRelease) {
        galleryFocusTrapRelease();
      }
      galleryFocusTrapRelease = paA11yFocusTrap(overlay, { onClose: closeLightbox });
      if (closeBtn && closeBtn.focus) {
        closeBtn.focus();
      }
    }

    function closeLightbox() {
      overlay.hidden = true;
      document.body.classList.remove('pa-gallery-lightbox-open');
      if (galleryFocusTrapRelease) {
        galleryFocusTrapRelease();
        galleryFocusTrapRelease = null;
      }
      if (lightImg) {
        lightImg.classList.remove('is-loaded');
        lightImg.removeAttribute('src');
      }
      if (strip) {
        while (strip.firstChild) {
          strip.removeChild(strip.firstChild);
        }
      }
      if (state.lastFocus && state.lastFocus.focus) {
        state.lastFocus.focus();
      }
    }

    function stepLightbox(delta) {
      if (!state.items.length) {
        return;
      }
      state.index = (state.index + delta + state.items.length) % state.items.length;
      renderLightboxSlide();
    }

    function preloadAdjacentSlides() {
      if (!state.items.length) {
        return;
      }
      [-1, 1].forEach(function (offset) {
        var item = state.items[(state.index + offset + state.items.length) % state.items.length];
        if (!item) {
          return;
        }
        var pre = new Image();
        pre.src = item.full;
      });
    }

    function renderLightboxStrip() {
      if (!strip) {
        return;
      }
      while (strip.firstChild) {
        strip.removeChild(strip.firstChild);
      }
      if (state.items.length < 2) {
        strip.hidden = true;
        return;
      }
      strip.hidden = false;
      state.items.forEach(function (item, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pa-gallery-lightbox-thumb' + (i === state.index ? ' is-active' : '');
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-label', item.alt || ('Image ' + (i + 1)));
        btn.setAttribute('aria-selected', i === state.index ? 'true' : 'false');
        var thumbImg = document.createElement('img');
        thumbImg.src = item.thumb;
        thumbImg.alt = '';
        thumbImg.loading = 'lazy';
        btn.appendChild(thumbImg);
        btn.addEventListener('click', function () {
          state.index = i;
          renderLightboxSlide();
        });
        strip.appendChild(btn);
      });
      var activeThumb = strip.querySelector('.pa-gallery-lightbox-thumb.is-active');
      if (activeThumb && activeThumb.scrollIntoView) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }

    function renderLightboxSlide() {
      var item = state.items[state.index];
      if (!item || !lightImg) {
        return;
      }
      lightImg.classList.remove('is-loaded');
      lightImg.onload = function () {
        lightImg.classList.add('is-loaded');
      };
      lightImg.src = item.full;
      lightImg.alt = item.alt;
      if (caption) {
        caption.textContent = item.alt;
        caption.hidden = !item.alt;
      }
      if (counter) {
        counter.textContent = (state.index + 1) + ' / ' + state.items.length;
      }
      var showNav = state.items.length > 1;
      if (prevBtn) {
        prevBtn.hidden = !showNav;
      }
      if (nextBtn) {
        nextBtn.hidden = !showNav;
      }
      renderLightboxStrip();
      preloadAdjacentSlides();
    }

    window.PAGalleryLightbox = { open: openLightbox, close: closeLightbox, refresh: bindTile };
  }

  /**
   * Strip WordPress intermediate size suffixes (-300x200) to reach the original upload.
   * Keeps "-scaled" filenames intact — those are often the full-width asset in modern WP.
   */
  function upgradeWordPressImageUrl(url) {
    if (!url || typeof url !== 'string') {
      return url;
    }
    return url.replace(
      /-(\d+)x(\d+)(?=\.(jpe?g|png|gif|webp)(\?|#|$))/i,
      ''
    );
  }

  function parseWpDimensions(url) {
    if (!url) {
      return { w: 0, h: 0 };
    }
    var m = url.match(/-(\d+)x(\d+)(?=\.(jpe?g|png|gif|webp)(\?|#|$))/i);
    if (!m) {
      return { w: 0, h: 0 };
    }
    return { w: parseInt(m[1], 10) || 0, h: parseInt(m[2], 10) || 0 };
  }

  function parseSrcsetEntries(srcset) {
    if (!srcset) {
      return [];
    }
    return srcset.split(',').map(function (part) {
      var bits = part.trim().split(/\s+/);
      var url = bits[0];
      var width = 0;
      if (bits[1] && /w$/i.test(bits[1])) {
        width = parseInt(bits[1], 10) || 0;
      } else if (bits[1] && /x$/i.test(bits[1])) {
        width = parseInt(bits[1], 10) || 0;
      }
      if (!width) {
        width = parseWpDimensions(url).w;
      }
      return { url: url, width: width };
    }).filter(function (entry) {
      return !!entry.url;
    }).sort(function (a, b) {
      return a.width - b.width;
    });
  }

  function pickFromSrcset(srcset, targetWidth) {
    var entries = parseSrcsetEntries(srcset);
    if (!entries.length) {
      return '';
    }
    var pick = entries[entries.length - 1];
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].width >= targetWidth) {
        pick = entries[i];
        break;
      }
      pick = entries[i];
    }
    return pick.url;
  }

  function getTargetTileWidth() {
    var vw = window.innerWidth || document.documentElement.clientWidth || 1024;
    var cols = vw >= 1200 ? 4 : vw >= 1024 ? 3 : 2;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    return Math.min(900, Math.ceil(((vw - 48) / cols) * dpr));
  }

  function deriveWordPressThumbUrl(url, targetWidth) {
    if (!url) {
      return '';
    }
    var match = url.match(/^(.+?)(-(\d+)x(\d+))?(-scaled)?(\.(jpe?g|png|gif|webp))((\?|#).*)?$/i);
    if (!match) {
      return url;
    }
    var base = match[1];
    var ext = match[6];
    var suffix = match[8] || '';
    var origW = parseInt(match[3], 10) || 0;
    var origH = parseInt(match[4], 10) || 0;

    if (!origW || !origH) {
      return url;
    }

    var widths = [480, 640, 768, 1024, 1536];
    var pick = widths[0];
    for (var i = 0; i < widths.length; i++) {
      if (widths[i] >= targetWidth) {
        pick = widths[i];
        break;
      }
      pick = widths[i];
    }

    if (pick >= origW) {
      return url;
    }

    var height = Math.max(1, Math.round(origH * pick / origW));
    return base + '-' + pick + 'x' + height + ext + suffix;
  }

  /**
   * Never serve full-resolution uploads in the grid — always pick a WP intermediate size.
   *
   * @param {string} url
   * @param {number} [targetWidth]
   * @returns {string}
   */
  function ensureGridThumbSrc(url, targetWidth) {
    if (!url) {
      return '';
    }
    var target = targetWidth || getTargetTileWidth();
    var dim = parseWpDimensions(url);
    if (!dim.w || !dim.h) {
      return url;
    }
    if (dim.w <= Math.round(target * 1.35)) {
      return url;
    }
    var derived = deriveWordPressThumbUrl(url, target);
    if (derived && derived !== url && isAllowedImageUrl(derived)) {
      return derived;
    }
    return url;
  }

  function backupPortfolioImageSources(img) {
    if (!img) {
      return;
    }
    var fallback = img.currentSrc || img.src ||
      img.dataset.paQueuedSrc || img.dataset.paDeferredSrc || '';
    if (fallback && !img.dataset.paFallbackSrc) {
      img.dataset.paFallbackSrc = fallback;
    }
    var srcset = img.getAttribute('srcset');
    if (srcset && !img.dataset.paSrcsetBackup) {
      img.dataset.paSrcsetBackup = srcset;
    }
    var sizes = img.getAttribute('sizes');
    if (sizes && !img.dataset.paSizesBackup) {
      img.dataset.paSizesBackup = sizes;
    }
  }

  function applyPortfolioImageFallback(img) {
    if (!img) {
      return false;
    }
    var candidates = [];
    var seen = {};

    function pushCandidate(url) {
      if (!url || seen[url]) {
        return;
      }
      seen[url] = true;
      candidates.push(url);
    }

    pushCandidate(img.dataset.paFallbackSrc);
    var backupSet = img.dataset.paSrcsetBackup;
    if (backupSet) {
      var entries = parseSrcsetEntries(backupSet);
      for (var i = entries.length - 1; i >= 0; i--) {
        pushCandidate(entries[i].url);
      }
    }
    pushCandidate(img.dataset.paQueuedSrc);
    pushCandidate(img.dataset.paDeferredSrc);

    for (var j = 0; j < candidates.length; j++) {
      if (img.src !== candidates[j]) {
        img.src = candidates[j];
        return true;
      }
    }

    if (backupSet) {
      img.setAttribute('srcset', backupSet);
      if (img.dataset.paSizesBackup) {
        img.setAttribute('sizes', img.dataset.paSizesBackup);
      }
      return true;
    }
    return false;
  }

  function gridSrcFromSrcset(img, target) {
    var srcset = img.getAttribute('srcset') || img.dataset.paSrcsetBackup || '';
    if (!srcset) {
      return '';
    }
    return pickFromSrcset(srcset, target);
  }

  function pickGridImageUrl(img) {
    if (!img) {
      return '';
    }
    var target = getTargetTileWidth();
    var current = img.currentSrc || img.src || '';
    var srcset = img.getAttribute('srcset');
    var fromSet = pickFromSrcset(srcset, target);
    if (fromSet) {
      return fromSet;
    }
    var dim = parseWpDimensions(current);
    if (dim.w && dim.w <= target * 1.2) {
      return current;
    }
    if (dim.w && dim.w > target) {
      return deriveWordPressThumbUrl(current, target);
    }
    if (/-scaled\.(jpe?g|webp|png)/i.test(current)) {
      return deriveWordPressThumbUrl(upgradeWordPressImageUrl(current), target);
    }
    if (!dim.w) {
      var guessed = deriveWordPressThumbUrl(current, target);
      if (guessed && guessed !== current) {
        return guessed;
      }
    }
    return current;
  }

  /**
   * Reserve width/height on portfolio imgs to reduce CLS (tile uses aspect-ratio 3/4).
   */
  function reservePortfolioImageDimensions(img) {
    if (!img) {
      return;
    }
    if (!img.hasAttribute('width')) {
      img.setAttribute('width', '480');
    }
    if (!img.hasAttribute('height')) {
      img.setAttribute('height', '640');
    }
  }

  /**
   * Collapsed gallery tiles: defer network until user expands the grid.
   */
  function deferPortfolioTileImage(img) {
    if (!img || img.dataset.paDeferred === '1') {
      return;
    }
    img.dataset.paDeferred = '1';
    img.decoding = 'async';
    img.loading = 'lazy';
    var tile = img.closest('.pa-portfolio-tile');
    if (tile) {
      tile.classList.add('is-pa-img-pending', 'is-pa-img-deferred');
    }
    if (img.src && !img.dataset.paDeferredSrc) {
      img.dataset.paDeferredSrc = img.src;
      img.removeAttribute('src');
    }
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
  }

  /**
   * Grid tiles: fast optimized thumb in the tile; full resolution only in lightbox.
   */
  function optimizePortfolioTileImage(img, tileIndex) {
    if (!img || img.dataset.paOptimized === '1') {
      return;
    }
    img.dataset.paOptimized = '1';
    if (img.dataset.paDeferred === '1') {
      delete img.dataset.paDeferred;
      if (!img.src && img.dataset.paDeferredSrc) {
        img.src = img.dataset.paDeferredSrc;
      }
    }
    if (!img.src && img.dataset.paQueuedSrc) {
      img.src = img.dataset.paQueuedSrc;
      if (img.dataset.paQueuedSrcset) {
        img.setAttribute('srcset', img.dataset.paQueuedSrcset);
      }
    }

    backupPortfolioImageSources(img);

    var full = upgradeWordPressImageUrl(getFullImageUrl(img));
    if (full && isAllowedImageUrl(full)) {
      img.dataset.paFullSrc = full;
    }

    var tile = img.closest('.pa-portfolio-tile');
    if (tile) {
      tile.classList.add('is-pa-img-pending');
    }

    reservePortfolioImageDimensions(img);
    img.decoding = 'async';

    var alt = (img.getAttribute('alt') || '').trim();
    if (!alt || /^image$/i.test(alt)) {
      var fig = img.closest('figure');
      var cap = fig && fig.querySelector('figcaption');
      var captionText = cap ? cap.textContent.trim() : '';
      img.setAttribute('alt', captionText || 'Event photography from Pennsylvania Media Arts portfolio');
    }

    var target = getTargetTileWidth();
    var fallback = img.dataset.paFallbackSrc || currentSrcSafe(img);
    var gridSrc = gridSrcFromSrcset(img, target) || pickGridImageUrl(img);
    var fromSrcset = !!(gridSrc && img.dataset.paSrcsetBackup &&
      parseSrcsetEntries(img.dataset.paSrcsetBackup).some(function (entry) {
        return entry.url === gridSrc;
      }));

    if (!fromSrcset) {
      gridSrc = ensureGridThumbSrc(gridSrc || fallback, target);
    }

    if (!gridSrc) {
      gridSrc = fallback;
    }

    if (gridSrc && gridSrc !== img.src) {
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.src = gridSrc;
    } else if (fallback && !img.src) {
      img.src = fallback;
      gridSrc = fallback;
    }

    var eagerCount = PORTFOLIO_EAGER_TILES;
    var index = typeof tileIndex === 'number' && !isNaN(tileIndex) ? tileIndex : 0;
    var thumbSrc = img.src || gridSrc || fallback;
    var isBareOriginal = thumbSrc && thumbSrc === fallback && !parseWpDimensions(thumbSrc).w;
    if (index < eagerCount && !isBareOriginal) {
      img.loading = 'eager';
      if (index < 2 && 'fetchPriority' in img) {
        img.fetchPriority = 'high';
      }
    } else {
      img.loading = 'lazy';
      img.removeAttribute('fetchpriority');
    }

    function markReady() {
      img.classList.add('is-pa-img-loaded');
      if (tile) {
        tile.classList.remove('is-pa-img-pending');
        tile.classList.add('is-pa-img-ready');
      }
    }

    function onImgError() {
      if (applyPortfolioImageFallback(img)) {
        img.addEventListener('load', markReady, { once: true });
        img.addEventListener('error', function onRetryError() {
          markReady();
        }, { once: true });
        return;
      }
      markReady();
    }

    if (!img.complete || img.naturalWidth === 0) {
      img.addEventListener('load', markReady, { once: true });
      img.addEventListener('error', onImgError, { once: true });
    } else {
      markReady();
    }
  }

  function healPortfolioGridImages(root) {
    var scope = root && root.nodeType === 1 ? root : document;
    scope.querySelectorAll('.pa-portfolio-tile img').forEach(function (img) {
      var tile = img.closest('.pa-portfolio-tile');
      var index = tile
        ? parseInt(tile.style.getPropertyValue('--pa-tile-i') || '0', 10)
        : 0;
      var missingSrc = !img.getAttribute('src') && !img.currentSrc;
      var broken = img.complete && img.naturalWidth === 0 && (img.src || img.currentSrc);
      if (!missingSrc && !broken) {
        return;
      }
      delete img.dataset.paOptimized;
      delete img.dataset.paTileQueued;
      if (tile && tile.classList.contains('is-collapsed')) {
        deferPortfolioTileImage(img);
        return;
      }
      optimizePortfolioTileImage(img, index);
    });
  }

  function currentSrcSafe(img) {
    return img.currentSrc || img.src || '';
  }

  function getFullImageUrl(img) {
    if (!img) {
      return '';
    }
    if (img.dataset.paFullSrc) {
      return img.dataset.paFullSrc;
    }

    var url = '';

    var link = img.closest('a');
    if (link && link.href && /\.(jpe?g|png|gif|webp)(\?|#|$)/i.test(link.href)) {
      url = link.href;
    }

    if (!url) {
      var dataFull = img.getAttribute('data-full-url') ||
        img.getAttribute('data-large-image') ||
        img.getAttribute('data-orig-file');
      if (dataFull) {
        url = dataFull;
      }
    }

    if (!url) {
      var srcset = img.getAttribute('srcset');
      if (srcset) {
        var best = '';
        var bestW = 0;
        srcset.split(',').forEach(function (part) {
          var bits = part.trim().split(/\s+/);
          var candidate = bits[0];
          var w = parseInt(bits[1], 10) || 0;
          if (w >= bestW) {
            bestW = w;
            best = candidate;
          }
        });
        if (best) {
          url = best;
        }
      }
    }

    if (!url) {
      url = img.currentSrc || img.src || '';
    }

    return upgradeWordPressImageUrl(url);
  }

  function isAllowedImageUrl(url) {
    try {
      var u = new URL(url, window.location.origin);
      return u.protocol === 'https:' && u.hostname === window.location.hostname;
    } catch (err) {
      return false;
    }
  }

  function getImageLabel(img) {
    var alt = (img.getAttribute('alt') || '').trim();
    return alt ? 'View larger: ' + alt : 'View larger image';
  }

  window.PAImage = {
    pickFromSrcset: pickFromSrcset,
    pickGridImageUrl: pickGridImageUrl,
    optimizeTile: optimizePortfolioTileImage,
  };
})();
