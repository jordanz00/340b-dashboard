/** Services page — concise grid (enqueue after site.js on body.pa-services-page) */
(function () {
  'use strict';

  if (!isServicesPage()) return;
  if (document.getElementById('pa2-services-page')) return;

  buildServicesPage();

  function isServicesPage() {
    if (document.body.classList.contains('pa-services-page')) return true;
    if (window.PASite && PASite.isServicesPage) return true;
    return /^\/services\/?$/.test(window.location.pathname || '');
  }

  function bookUrl() {
    return (window.PASite && PASite.bookUrl) ? PASite.bookUrl : '/book/';
  }

  function workPageUrl() {
    return (window.PASite && PASite.workUrl) ? PASite.workUrl : '/work/';
  }

  function getApiServices() {
    if (window.PASite && PASite.services && PASite.services.length) {
      return PASite.services.slice();
    }
    return [
      'Event Photography',
      'Video Production',
      'Live Audio / PA',
      'DJ Services',
      'Photo + Video Bundle'
    ];
  }

  function getCatalog() {
    return {
      'Event Photography': {
        id: 'photo',
        label: 'Photography',
        tagline: 'Story-driven stills for weddings, galas, and live events.'
      },
      'Video Production': {
        id: 'video',
        label: 'Videography',
        tagline: 'Cinematic capture and in-house editing.'
      },
      'Live Audio / PA': {
        id: 'audio',
        label: 'Live Audio',
        tagline: 'Full PA and live sound from load-in to strike.'
      },
      'DJ Services': {
        id: 'dj',
        label: 'DJ',
        tagline: 'Music programming, MC, and dance-floor energy.'
      },
      'Photo + Video Bundle': {
        id: 'bundle',
        label: 'Photo + Video',
        tagline: 'One team, one timeline — coordinated photo and video.',
        recommended: true
      }
    };
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  /**
   * Stroke icons for the services grid (local SVG, no CDN).
   *
   * @param {string} type — photo | video | dj | audio | bundle
   * @returns {HTMLElement}
   */
  function createServiceIcon(type) {
    if (window.PAServiceIcons && typeof window.PAServiceIcons.create === 'function') {
      return window.PAServiceIcons.create(type, 'pa2-svc-card__icon');
    }
    var wrap = document.createElement('span');
    wrap.className = 'pa2-svc-card__icon pa2-svc-card__icon--' + type;
    wrap.setAttribute('aria-hidden', 'true');
    return wrap;
  }

  function bookLink(serviceApi) {
    if (typeof window.PABookLinkUrl === 'function') {
      return window.PABookLinkUrl(serviceApi);
    }
    var base = bookUrl();
    var url = base + (base.indexOf('?') >= 0 ? '&' : '?') + 'start=1';
    if (serviceApi) {
      url += '&service=' + encodeURIComponent(serviceApi);
    }
    return url;
  }

  function buildServiceCard(svc, index) {
    var card = el('a', 'pa2-svc-card pa2-svc-card--' + svc.id + (svc.recommended ? ' is-featured' : ''));
    card.href = bookLink(svc.api);
    card.setAttribute('role', 'listitem');
    card.style.setProperty('--pa2-svc-i', String(index));

    var iconWrap = el('div', 'pa2-svc-card__icon-wrap');
    if (svc.recommended) {
      iconWrap.appendChild(el('span', 'pa2-svc-card__badge', 'Most popular'));
    }
    iconWrap.appendChild(createServiceIcon(svc.id));
    card.appendChild(iconWrap);
    card.appendChild(el('h2', 'pa2-svc-card__title', svc.label));
    card.appendChild(el('p', 'pa2-svc-card__tagline', svc.tagline));
    card.appendChild(el('span', 'pa2-svc-card__action', 'Book this service'));

    return card;
  }

  function buildServicesPage() {
    var main = document.querySelector('main .entry-content, main .wp-block-post-content');
    if (!main) return;

    var oldShowcase = document.getElementById('pa-services') ||
      document.querySelector('.pa-services-showcase');
    if (oldShowcase) oldShowcase.remove();

    document.querySelectorAll('.wp-block-post-title, main .entry-header').forEach(function (node) {
      node.classList.add('pa2-services-legacy-hidden');
      node.setAttribute('aria-hidden', 'true');
      node.hidden = true;
    });

    var catalog = getCatalog();
    var services = getApiServices().map(function (apiName, index) {
      var entry = catalog[apiName];
      if (entry) {
        entry.apiName = apiName;
        return entry;
      }
      return {
        id: 'svc-' + index,
        apiName: apiName,
        label: apiName,
        tagline: 'Professional coverage across Central Pennsylvania.'
      };
    });

    if (!services.length) return;

    var page = el('div', 'pa2-services-page pa-reveal-section');
    page.id = 'pa2-services-page';
    page.setAttribute('data-pa-atmosphere', 'contrast');

    var hero = el('header', 'pa2-svc-hero');
    hero.setAttribute('aria-labelledby', 'pa2-svc-hero-title');
    hero.appendChild(el('p', 'pa2-svc-hero__eyebrow', 'Pennsylvania Media Arts'));
    hero.appendChild(el('h1', 'pa2-svc-hero__title', 'Photography, video, DJ & live audio services'));
    hero.lastChild.id = 'pa2-svc-hero-title';
    hero.appendChild(el('p', 'pa2-svc-hero__lead',
      'Wedding and event production across Harrisburg, York, Lancaster, and Central Pennsylvania — one team, online booking.'));
    page.appendChild(hero);

    var section = el('section', 'pa2-svc-grid-section');
    section.setAttribute('aria-label', 'Services');

    var grid = el('div', 'pa2-svc-grid');
    grid.setAttribute('role', 'list');
    services.forEach(function (svc, i) {
      grid.appendChild(buildServiceCard(svc, i));
    });
    section.appendChild(grid);
    page.appendChild(section);

    var geoLinks = (window.PASite && PASite.geoLandingLinks) || [];
    if (geoLinks.length) {
      var geoSec = el('section', 'pa2-svc-geo');
      geoSec.setAttribute('aria-label', 'Central PA service areas');
      geoSec.appendChild(el('h2', 'pa2-svc-geo__title', 'Popular in Central PA'));
      var geoNav = el('nav', 'pa2-svc-geo__links');
      geoLinks.forEach(function (item) {
        var link = el('a', 'pa2-svc-geo__link', item.label);
        link.href = item.url;
        geoNav.appendChild(link);
      });
      geoSec.appendChild(geoNav);
      page.appendChild(geoSec);
    }

    var foot = el('footer', 'pa2-svc-foot');
    foot.appendChild(el('p', 'pa2-svc-foot__proof',
      '15+ years in Central PA \u00b7 2026 CPMA Best Videography Nominee'));
    var actions = el('div', 'pa2-svc-foot__actions');
    var book = el('a', 'pa2-svc-foot__btn pa2-svc-foot__btn--primary', 'Start Booking');
    book.href = bookLink();
    var work = el('a', 'pa2-svc-foot__btn pa2-svc-foot__btn--ghost', 'View portfolio');
    work.href = workPageUrl();
    actions.appendChild(book);
    actions.appendChild(work);
    foot.appendChild(actions);
    page.appendChild(foot);

    main.insertBefore(page, main.firstChild);

    Array.prototype.forEach.call(main.children, function (child) {
      if (child === page) return;
      child.classList.add('pa2-services-legacy-hidden');
      child.setAttribute('aria-hidden', 'true');
      child.hidden = true;
    });

    document.body.classList.add('pa2-services-ready');
    if (typeof window.PASuppressLegacyThemeBlocks === 'function') {
      window.PASuppressLegacyThemeBlocks();
    }
    requestAnimationFrame(function () {
      page.classList.add('is-ready');
    });
    if (typeof window.PACompactInteriorPageHeader === 'function') {
      window.PACompactInteriorPageHeader();
    }
    if (typeof window.PARefreshScrollReveal === 'function') {
      window.PARefreshScrollReveal(page);
    }
  }
})();
