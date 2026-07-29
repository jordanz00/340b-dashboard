/**
 * Header nav interactions — pill hover/press, page transitions, staggered reveal.
 * Visual styling lives in header-nav.css; dock classes are also set from site.js.
 */
(function () {
  'use strict';

  if (
    !document.body.classList.contains('wp-theme-gutenify-photography') &&
    !document.body.classList.contains('pa-glass-site')
  ) {
    return;
  }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PAGE_TX_KEY = 'pa-page-transition';
  var PAGE_EXIT_MS = 460;
  var PAGE_ENTER_MS = 640;

  function findHeaderNav() {
    return (
      document.querySelector('.pa-home-post-hero-chrome .wp-block-navigation') ||
      document.querySelector('header.pa-site-header .wp-block-navigation') ||
      document.querySelector('header.wp-block-template-part .wp-block-navigation')
    );
  }

  function getDockList(nav) {
    return (
      nav.querySelector('ul.wp-block-navigation__container') ||
      nav.querySelector('.wp-block-navigation__container') ||
      nav.querySelector('ul')
    );
  }

  function getNavLinks(dock) {
    return Array.from(dock.querySelectorAll('.wp-block-navigation-item .wp-block-navigation-item__content'));
  }

  /**
   * True when the browser can run cross-document View Transitions without our overlay.
   *
   * @returns {boolean}
   */
  function supportsViewTransitionNavigation() {
    return typeof CSS !== 'undefined' &&
      CSS.supports('view-transition-name: test') &&
      typeof document.startViewTransition === 'function';
  }

  /**
   * @param {string} href
   * @returns {boolean}
   */
  function isInternalNavHref(href) {
    if (!href) {
      return false;
    }
    try {
      var next = new URL(href, window.location.href);
      if (next.origin !== window.location.origin) {
        return false;
      }
      if (next.protocol !== 'http:' && next.protocol !== 'https:') {
        return false;
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Same path + query with only a hash change (handled elsewhere on the home page).
   *
   * @param {URL} next
   * @returns {boolean}
   */
  function isSameDocumentHashOnly(next) {
    return next.pathname === window.location.pathname &&
      next.search === window.location.search &&
      next.hash.length > 1;
  }

  /**
   * @returns {HTMLElement}
   */
  function ensureTransitionLayer() {
    var layer = document.getElementById('pa-page-transition');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'pa-page-transition';
      layer.className = 'pa-page-transition';
      layer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(layer);
    }
    return layer;
  }

  /**
   * Fade the current page out before a full navigation.
   *
   * @param {Function} done
   */
  function runPageExit(done) {
    if (reducedMotion || supportsViewTransitionNavigation()) {
      done();
      return;
    }
    document.body.classList.add('pa-page-exiting');
    ensureTransitionLayer().classList.add('is-active');
    window.setTimeout(done, PAGE_EXIT_MS);
  }

  /**
   * Fade the new page in after navigation completes.
   */
  function runPageEnter() {
    if (document.body.classList.contains('pa-booking-page')) {
      try {
        sessionStorage.removeItem(PAGE_TX_KEY);
      } catch (storageErr) {
        /* sessionStorage may be unavailable */
      }
      return;
    }
    if (reducedMotion || supportsViewTransitionNavigation()) {
      return;
    }
    if (sessionStorage.getItem(PAGE_TX_KEY) !== '1') {
      return;
    }
    sessionStorage.removeItem(PAGE_TX_KEY);

    document.body.classList.add('pa-page-entering');
    window.requestAnimationFrame(function () {
      document.body.classList.add('pa-page-entered');
    });
    window.setTimeout(function () {
      document.body.classList.remove('pa-page-entering', 'pa-page-entered', 'pa-page-exiting');
      var layer = document.getElementById('pa-page-transition');
      if (layer) {
        layer.classList.remove('is-active');
      }
    }, PAGE_ENTER_MS);
  }

  /**
   * Attach hover / focus / press classes so CSS can animate pills consistently.
   *
   * @param {HTMLAnchorElement} link
   * @param {{ hoverClass: string, pressedClass: string }} classes
   */
  function bindPillInteractions(link, classes) {
    if (!link || link.dataset.paNavBound === '1') {
      return;
    }

    link.dataset.paNavBound = '1';
    link.classList.add('pa-site-nav-pill');

    link.addEventListener('mouseenter', function () {
      link.classList.add(classes.hoverClass);
    });
    link.addEventListener('mouseleave', function () {
      link.classList.remove(classes.hoverClass, classes.pressedClass);
    });
    link.addEventListener('focus', function () {
      link.classList.add(classes.hoverClass);
    });
    link.addEventListener('blur', function () {
      link.classList.remove(classes.hoverClass, classes.pressedClass);
    });
    link.addEventListener('mousedown', function () {
      link.classList.add(classes.pressedClass);
    });
    link.addEventListener('mouseup', function () {
      link.classList.remove(classes.pressedClass);
    });
    link.addEventListener('touchstart', function () {
      link.classList.add(classes.pressedClass);
    }, { passive: true });
    link.addEventListener('touchend', function () {
      link.classList.remove(classes.pressedClass);
    });
    link.addEventListener('touchcancel', function () {
      link.classList.remove(classes.pressedClass);
    });
  }

  /**
   * Intercept same-origin header nav clicks for a polished page transition.
   *
   * @param {Element} navEl
   */
  function bindPageTransitions(navEl) {
    if (!navEl || reducedMotion || supportsViewTransitionNavigation()) {
      return;
    }

    getNavLinks(getDockList(navEl) || navEl).forEach(function (link) {
      if (link.dataset.paPageTx === '1') {
        return;
      }
      link.dataset.paPageTx = '1';

      link.addEventListener('click', function (event) {
        if (event.defaultPrevented) {
          return;
        }
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }
        if (!isInternalNavHref(link.href)) {
          return;
        }

        var next = new URL(link.href, window.location.href);
        if (isSameDocumentHashOnly(next)) {
          return;
        }
        if (next.pathname === window.location.pathname && next.search === window.location.search) {
          return;
        }

        var bookPath = next.pathname.replace(/\/$/, '') || '/';
        if (bookPath === '/book') {
          event.preventDefault();
          window.location.assign(link.href);
          return;
        }

        event.preventDefault();
        link.classList.add('pa-nav-link--departing');

        runPageExit(function () {
          try {
            sessionStorage.setItem(PAGE_TX_KEY, '1');
          } catch (storageErr) {
            /* sessionStorage may be unavailable in private mode */
          }
          window.location.assign(link.href);
        });
      });
    });
  }

  function enhanceNav(navEl) {
    if (!navEl) {
      return;
    }

    var dock = getDockList(navEl);
    if (!dock) {
      return;
    }

    if (!dock.classList.contains('pa-nav-dock-ready')) {
      dock.classList.add('pa-nav-dock', 'pa-nav-floating-pills', 'pa-site-nav-pill-row', 'pa-nav-dock-ready', 'pa-premium-header-nav');
      dock.classList.remove('has-background', 'has-foreground-background-color');
      navEl.classList.add('pa-premium-header-nav');
      navEl.classList.remove('has-background', 'has-foreground-background-color');
      document.body.classList.add('pa-premium-nav');

      if (document.body.classList.contains('pa-booking-page') || reducedMotion) {
        dock.classList.add('pa-nav-dock--revealed');
      } else {
        window.setTimeout(function () {
          dock.classList.add('pa-nav-dock--revealed');
        }, 60);
      }
    }

    var bookItem = dock.querySelector('.pa-nav-book');
    if (bookItem) {
      var bookLink = bookItem.querySelector('.wp-block-navigation-item__content');
      if (bookLink) {
        bookLink.classList.add('pa-nav-book-btn');
        bindPillInteractions(bookLink, {
          hoverClass: 'pa-nav-book--hover',
          pressedClass: 'pa-nav-book--pressed',
        });
      }
    }

    getNavLinks(dock).forEach(function (a) {
      if (a.closest('.pa-nav-book')) {
        return;
      }
      a.classList.add('pa-nav-link');
      bindPillInteractions(a, {
        hoverClass: 'pa-nav-link--hover',
        pressedClass: 'pa-nav-link--pressed',
      });
    });

    bindPageTransitions(navEl);
  }

  function init() {
    enhanceNav(findHeaderNav());
    runPageEnter();
  }

  window.PAHeaderNav = {
    enhance: enhanceNav,
    refresh: init,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
      document.body.classList.remove('pa-page-exiting', 'pa-page-entering', 'pa-page-entered');
      var layer = document.getElementById('pa-page-transition');
      if (layer) {
        layer.classList.remove('is-active');
      }
    }
  });
})();
