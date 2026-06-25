(function () {
  'use strict';

  if (
    !document.body.classList.contains('wp-theme-gutenify-photography') &&
    !document.body.classList.contains('pa-glass-site')
  ) {
    return;
  }

  var LOGO_SIZE = 84;
  var HEADER_LOGO_SIZE = 148;

  ensureViewportFit();

  applySiteLogo();
  initBrandLogos();
  watchBrandLogos();
  removeContactNavLinks();
  addNavBookLink();
  polishHeaderNav();
  rebuildSiteFooter();
  enhanceSocialLinks();
  polishFooter();
  injectLegalFooter();
  polishFooterNav();
  applyGlassLayout();
  removeBookingStatusLinks();

  if (document.body.classList.contains('home')) {
    buildHomeHero();
    injectYoutubeFeature();
    labelPortfolioSection();
    buildPortfolioShowcase();
    hideDuplicateBookingColumn();
    markSectionAnchors();
    injectServicesGrid();
    reorderHomeSections();
  } else if (isBookingPage()) {
    document.body.classList.add('pa-booking-page');
  } else if (isServicesPage()) {
    buildServicesPage();
  } else if (isAboutPage()) {
    buildAboutPage();
  }

  initGalleryLightbox();

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
      applyLogosInScope(header, 'dark');
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
        patchLogoImage(img, 'dark');
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
      return;
    }
    var content = vp.getAttribute('content') || '';
    if (content.indexOf('viewport-fit') === -1) {
      vp.setAttribute('content', content + ', viewport-fit=cover');
    }
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

  function removeBookingStatusLinks() {
    document.querySelectorAll('.pa-booking-status-link').forEach(function (el) {
      el.remove();
    });
  }

  function labelPortfolioSection() {
    var gallery = document.querySelector('.entry-content .wp-block-gallery.alignfull');
    if (!gallery || document.getElementById('pa-portfolio-label')) {
      return;
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
    gallery.parentNode.insertBefore(label, gallery);
  }

  /**
   * Merge WordPress gallery blocks into one uniform portrait grid.
   * Safe DOM only — tiles share the same vertical aspect ratio.
   */
  function buildPortfolioShowcase() {
    if (document.getElementById('pa-portfolio') || document.querySelector('.pa-portfolio-showcase')) {
      return;
    }
    var galleries = document.querySelectorAll('.entry-content .wp-block-gallery.alignfull');
    if (!galleries.length) {
      return;
    }

    var label = document.getElementById('pa-portfolio-label');
    var showcase = document.createElement('section');
    showcase.className = 'pa-portfolio-showcase';
    showcase.setAttribute('aria-label', 'Portfolio gallery');

    var hint = document.createElement('p');
    hint.className = 'pa-portfolio-hint';
    hint.textContent = 'Click any photo to view full size — arrow keys browse the gallery.';

    var grid = document.createElement('div');
    grid.className = 'pa-portfolio-grid pa-portfolio-grid--portrait';
    grid.setAttribute('role', 'list');

    var tileIndex = 0;
    Array.prototype.forEach.call(galleries, function (gallery) {
      gallery.querySelectorAll('.wp-block-image').forEach(function (figure) {
        var img = figure.querySelector('img');
        figure.classList.remove('aligncenter', 'alignleft', 'alignright');
        figure.classList.add('pa-portfolio-tile');
        figure.setAttribute('role', 'listitem');
        figure.style.setProperty('--pa-tile-i', String(tileIndex));

        if (img && !figure.querySelector('.pa-portfolio-tile-overlay')) {
          var overlay = document.createElement('div');
          overlay.className = 'pa-portfolio-tile-overlay';
          var view = document.createElement('span');
          view.className = 'pa-portfolio-tile-view';
          view.textContent = 'View';
          overlay.appendChild(view);
          var alt = (img.getAttribute('alt') || '').trim();
          if (alt) {
            var cap = document.createElement('span');
            cap.className = 'pa-portfolio-tile-caption';
            cap.textContent = alt;
            overlay.appendChild(cap);
          }
          figure.appendChild(overlay);
        }

        grid.appendChild(figure);
        tileIndex += 1;
      });
      if (gallery.parentNode) {
        gallery.parentNode.removeChild(gallery);
      }
    });

    if (!tileIndex) {
      return;
    }

    showcase.id = 'pa-portfolio';
    showcase.classList.add('pa-portfolio-showcase');
    showcase.appendChild(hint);
    showcase.appendChild(grid);

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
  }

  function observePortfolioTiles(grid) {
    var tiles = grid.querySelectorAll('.pa-portfolio-tile');
    if (!tiles.length) {
      return;
    }
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(tiles, function (tile) {
        tile.classList.add('is-visible');
      });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    Array.prototype.forEach.call(tiles, function (tile) {
      observer.observe(tile);
    });
  }

  function bookingUrl() {
    if (window.PASite && PASite.bookUrl) {
      return PASite.bookUrl;
    }
    return document.body.classList.contains('home') ? '/#pa-booking-app' : '/book/';
  }

  function isBookingPage() {
    return document.body.classList.contains('pa-booking-page') ||
      (window.PASite && PASite.isBookingPage);
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
      var wrap = document.createElement('div');
      wrap.className = 'pa-footer-social';
      wrap.appendChild(social);
      var cta = footerPro.querySelector('.pa-footer-cta-strip');
      if (cta) {
        footerPro.insertBefore(wrap, cta);
      } else {
        footerPro.appendChild(wrap);
      }
      if (oldShell && !oldShell.contains(footerPro)) {
        oldShell.classList.add('pa-footer-social-source');
      }
    }
  }

  function polishFooter() {
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
    var pool = ids.filter(function (id) {
      return id !== prev;
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

    var booking = document.querySelector('.entry-content .pa-booking-root');
    var gallery = document.querySelector('.entry-content .wp-block-gallery.alignfull');
    var portfolioLabel = document.getElementById('pa-portfolio-label');
    var anchor = portfolioLabel || gallery || null;

    if (booking && booking.parentNode) {
      if (anchor && anchor.parentNode === booking.parentNode) {
        booking.parentNode.insertBefore(section, anchor);
      } else if (booking.nextSibling) {
        booking.parentNode.insertBefore(section, booking.nextSibling);
      } else {
        booking.parentNode.appendChild(section);
      }
      return;
    }

    var main = document.querySelector('main .entry-content');
    if (main) {
      main.insertBefore(section, main.firstChild);
    }
  }

  function rebuildSiteFooter() {
    var footer = document.querySelector('footer.wp-block-template-part');
    if (!footer || footer.querySelector('.pa-site-footer-pro')) {
      return;
    }

    var columns = footer.querySelector('.wp-block-columns.alignwide');
    if (!columns) {
      return;
    }

    var data = extractFooterColumnData(columns);
    columns.classList.add('pa-footer-legacy');
    columns.setAttribute('aria-hidden', 'true');

    var wrap = footer.querySelector(':scope > .wp-block-group');
    if (!wrap) {
      return;
    }

    var pro = document.createElement('div');
    pro.className = 'pa-site-footer-pro';

    if (!isBookingPage()) {
      pro.appendChild(buildFooterInfoGrid(data));
    }

    pro.appendChild(buildFooterCtaStrip());
    wrap.insertBefore(pro, columns);
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
      return PASite.aboutParagraphs.map(normalizeAboutParagraph).filter(Boolean);
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
    var recognition = {
      lines: [
        '2026 CPMA — Best Videography Nominee',
        'Central Pennsylvania Music Awards · Central Pennsylvania Music Hall of Fame',
      ],
      href: 'https://cpmhof.com/2026-winners',
      award: true,
    };
    var exists = data.work.some(function (item) {
      var title = (item.lines && item.lines[0]) || '';
      return title.indexOf('CPMA') !== -1 || title.indexOf('Central Pennsylvania Music Awards') !== -1;
    });
    if (!exists) {
      data.work.unshift(recognition);
    }
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

  function buildFooterInfoGrid(data) {
    var grid = document.createElement('div');
    grid.className = 'pa-footer-info';

    grid.appendChild(buildFooterPanel(
      'Services',
      'pa-footer-services',
      function (body) {
        var list = document.createElement('ul');
        list.className = 'pa-footer-service-list';
        data.services.slice(0, 8).forEach(function (name) {
          var li = document.createElement('li');
          li.textContent = name;
          list.appendChild(li);
        });
        body.appendChild(list);
      }
    ));

    grid.appendChild(buildFooterPanel(
      'About',
      'pa-footer-about',
      function (body) {
        data.aboutParagraphs.forEach(function (text) {
          var p = document.createElement('p');
          p.textContent = text;
          body.appendChild(p);
        });
      }
    ));

    grid.appendChild(buildFooterPanel(
      'Portfolio',
      'pa-footer-work',
      function (body) {
        var list = document.createElement('ul');
        list.className = 'pa-footer-work-list';
        var items = data.work.length ? data.work.slice(0, 8) : [
          { lines: ['Portfolio gallery above'], href: '#pa-portfolio' },
        ];
        items.forEach(function (item) {
          var li = document.createElement('li');
          if (item.award) {
            li.className = 'pa-footer-work-award';
          }
          var lines = item.lines || (item.label ? [item.label] : []);
          if (item.href) {
            var a = document.createElement('a');
            a.href = item.href;
            appendWorkLines(a, lines);
            a.target = item.href.indexOf('http') === 0 ? '_blank' : '_self';
            if (a.target === '_blank') {
              a.rel = 'noopener noreferrer';
            }
            li.appendChild(a);
          } else {
            appendWorkLines(li, lines);
          }
          list.appendChild(li);
        });
        body.appendChild(list);
      }
    ));

    return grid;
  }

  function buildFooterPanel(title, id, fill) {
    var panel = document.createElement('section');
    panel.className = 'pa-footer-panel';
    if (id) {
      panel.id = id;
    }

    var h = document.createElement('h3');
    h.textContent = title;
    panel.appendChild(h);

    var body = document.createElement('div');
    body.className = 'pa-footer-panel-body';
    fill(body);
    panel.appendChild(body);

    return panel;
  }

  function buildFooterCtaStrip() {
    var strip = document.createElement('div');
    strip.className = 'pa-footer-cta-strip';

    if (!isBookingPage()) {
      var cta = document.createElement('a');
      cta.className = 'pa-footer-book-cta wp-element-button';
      cta.href = bookingUrl();
      cta.textContent = 'Book now';
      strip.appendChild(cta);
    }

    var note = document.createElement('p');
    note.className = 'pa-footer-booking-note pa-footer-booking-note--hidden';
    note.setAttribute('aria-hidden', 'true');
    strip.appendChild(note);

    return strip;
  }

  function replaceFooterBookingColumn() {
    /* Replaced by rebuildSiteFooter — kept as no-op for cached script compatibility. */
  }

  function injectLegalFooter() {
    var footer = document.querySelector('footer.wp-block-template-part');
    if (!footer || footer.querySelector('.pa-legal-footer')) {
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
    var email = (window.PASite && PASite.notifyEmail) || 'jordan@pamedia.art';

    appendLegalLink(links, 'Privacy', privacyHref);
    links.appendChild(document.createTextNode(' · '));
    appendLegalLink(links, 'Terms', termsHref);
    legal.appendChild(links);

    var emailLine = document.createElement('p');
    emailLine.className = 'pa-legal-email';
    var mail = document.createElement('a');
    mail.href = 'mailto:' + email;
    mail.textContent = email;
    emailLine.appendChild(mail);
    legal.appendChild(emailLine);

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
      { label: 'Services', href: homeUrl.replace(/\/?$/, '/') + 'services/' },
    ];
  }

  function isCurrentNavLink(href) {
    try {
      var target = new URL(href, window.location.origin).pathname.replace(/\/$/, '') || '/';
      var current = window.location.pathname.replace(/\/$/, '') || '/';
      if (target === '/book' || href.indexOf('/book') !== -1) {
        return current === '/book' || document.body.classList.contains('pa-booking-page');
      }
      if (target === '/' && (current === '/' || current === '/book')) {
        return current === '/';
      }
      return target === current;
    } catch (e) {
      return false;
    }
  }

  function polishHeaderNav() {
    var headerNav =
      document.querySelector('header.pa-site-header .wp-block-navigation') ||
      document.querySelector('header.wp-block-template-part .wp-block-navigation');
    if (!headerNav || headerNav.classList.contains('pa-site-header-nav-ready')) {
      return;
    }
    headerNav.classList.add('pa-site-header-nav-ready');

    var list = headerNav.querySelector('ul, .wp-block-navigation__container');
    if (list) {
      list.classList.add('pa-site-nav-pill-row');
    }

    headerNav.querySelectorAll('.wp-block-navigation-item__content').forEach(function (a) {
      a.classList.add('pa-site-nav-pill');
      if (isCurrentNavLink(a.href)) {
        a.classList.add('is-current');
        a.setAttribute('aria-current', 'page');
      }
    });
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
  }

  function applyGlassLayout() {
    var cover = document.querySelector('.wp-block-cover.alignfull');
    if (cover && !cover.closest('.pa-glass-hero-wrap')) {
      var wrap = document.createElement('div');
      wrap.className = 'pa-glass-hero-wrap';
      cover.parentNode.insertBefore(wrap, cover);
      wrap.appendChild(cover);
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

  function hideDuplicateBookingColumn() {
    document.querySelectorAll('.entry-content .wp-block-heading').forEach(function (h) {
      if (h.textContent.trim() !== 'Booking') {
        return;
      }
      var col = h.closest('.wp-block-column');
      if (col) {
        col.classList.add('pa-hide-duplicate-booking');
        col.setAttribute('aria-hidden', 'true');
        return;
      }
      var group = h.closest('.wp-block-group');
      if (group) {
        group.classList.add('pa-hide-duplicate-booking');
        group.setAttribute('aria-hidden', 'true');
      }
    });
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
    card.className = 'pa-services-card pa-services-card--' + svc.id + ' is-visible' +
      (svc.recommended ? ' is-recommended' : '');
    card.setAttribute('role', 'listitem');
    card.style.setProperty('--pa-service-i', String(index));

    var head = document.createElement('div');
    head.className = 'pa-services-card-head';

    if (svc.recommended) {
      var rec = document.createElement('span');
      rec.className = 'pa-services-card-recommended';
      rec.textContent = 'Most popular';
      head.appendChild(rec);
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
    services.forEach(function (name) {
      var link = document.createElement('a');
      link.href = '#pa-booking-app';
      link.textContent = name;
      grid.appendChild(link);
    });
    servicesHeading.parentNode.insertBefore(grid, servicesHeading.nextSibling);

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
    showcase.className = 'pa-about-showcase';
    showcase.id = 'pa-about';
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
  }

  function buildAboutHero() {
    var hero = document.createElement('div');
    hero.className = 'pa-about-hero';

    var eyebrow = document.createElement('p');
    eyebrow.className = 'pa-about-eyebrow';
    eyebrow.textContent = 'Pennsylvania Media Arts LLC';
    hero.appendChild(eyebrow);

    var name = document.createElement('h1');
    name.className = 'pa-about-name';
    name.textContent = 'Jordan Zabady';
    hero.appendChild(name);

    var role = document.createElement('p');
    role.className = 'pa-about-role';
    role.textContent = 'Founder & CEO';
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
    card.className = 'pa-about-story';

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
    row.className = 'pa-about-stats';
    row.setAttribute('role', 'list');

    var stats = [
      {
        value: '15+',
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
      item.className = 'pa-about-stat';
      item.setAttribute('role', 'listitem');

      var val = document.createElement('span');
      val.className = 'pa-about-stat-value';
      val.textContent = s.value;
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
    section.className = 'pa-about-expertise';

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
    cta.className = 'pa-about-cta';

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
   */
  function initGalleryLightbox() {
    var tileSelector =
      '.pa-portfolio-showcase .pa-portfolio-tile, ' +
      '.entry-content .wp-block-gallery.alignfull .wp-block-image';
    var tiles = [];
    document.querySelectorAll(tileSelector).forEach(function (figure) {
      if (figure.getAttribute('data-pa-lightbox-bound') === '1') {
        return;
      }
      var img = figure.querySelector('img');
      if (!img) {
        return;
      }
      var full = getFullImageUrl(img);
      if (!isAllowedImageUrl(full)) {
        return;
      }
      var tile = { figure: figure, full: full, alt: img.getAttribute('alt') || '' };
      var tileIndex = tiles.length;
      tiles.push(tile);

      figure.classList.add('pa-gallery-tile');
      figure.setAttribute('role', 'button');
      figure.setAttribute('tabindex', '0');
      figure.setAttribute('aria-label', getImageLabel(img));
      figure.setAttribute('data-pa-lightbox-bound', '1');

      figure.addEventListener('click', function (e) {
        e.preventDefault();
        openLightbox(tiles, tileIndex);
      });
      figure.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(tiles, tileIndex);
        }
      });
    });

    if (!tiles.length) {
      return;
    }

    var overlay = document.getElementById('pa-gallery-lightbox');
    var lightImg;
    var caption;
    var counter;
    var prevBtn;
    var nextBtn;
    var closeBtn;
    var state = { items: tiles, index: 0, lastFocus: null };

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

      var stage = document.createElement('div');
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

      panel.appendChild(closeBtn);
      panel.appendChild(prevBtn);
      panel.appendChild(nextBtn);
      panel.appendChild(stage);
      panel.appendChild(caption);
      panel.appendChild(counter);
      overlay.appendChild(backdrop);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);

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
      state.items = tiles;
    }

    function openLightbox(items, index) {
      state.items = items;
      state.index = Math.max(0, Math.min(index, items.length - 1));
      state.lastFocus = document.activeElement;
      overlay.hidden = false;
      document.body.classList.add('pa-gallery-lightbox-open');
      renderLightboxSlide();
      if (closeBtn && closeBtn.focus) {
        closeBtn.focus();
      }
    }

    function closeLightbox() {
      overlay.hidden = true;
      document.body.classList.remove('pa-gallery-lightbox-open');
      if (lightImg) {
        lightImg.classList.remove('is-loaded');
        lightImg.removeAttribute('src');
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
    }

    window.PAGalleryLightbox = { open: openLightbox, close: closeLightbox };
  }

  function getFullImageUrl(img) {
    var srcset = img.getAttribute('srcset');
    if (srcset) {
      var best = '';
      var bestW = 0;
      srcset.split(',').forEach(function (part) {
        var bits = part.trim().split(/\s+/);
        var url = bits[0];
        var w = parseInt(bits[1], 10) || 0;
        if (w >= bestW) {
          bestW = w;
          best = url;
        }
      });
      if (best) {
        return best;
      }
    }
    return img.currentSrc || img.src || '';
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
})();
