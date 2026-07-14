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
    if (url.indexOf('utm_source=') === -1) {
      url += '&utm_source=home&utm_medium=cta';
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
      '.pa2-services__eyebrow, .pa2-services__title, .pa2-services__lead'
    ).forEach(function (el) {
      el.classList.add('is-animated', 'is-revealed', 'is-visible');
    });
  }

  function homeBaseUrl() {
    return (window.PASite && PASite.homeUrl)
      ? PASite.homeUrl.replace(/\/?$/, '/')
      : '/';
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
  document.addEventListener('pa-youtube-feature-ready', function () {
    buildHomePortfolio();
  });

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
      'Pennsylvania Media Arts \u00b7 Multimedia production';
    var titleText = textFrom(hero, '.pa-hero-title, .pa2-hero__title, h1') ||
      'Cinematic wedding films, professional event production, and creative media for Pennsylvania';
    var leadText = textFrom(hero, '.pa-hero-lead, .pa2-hero__lead') ||
      'A premium production company for couples, businesses, and organizations \u2014 cinema, photography, premium live sound, and post under one team. Check availability and hold your date with a secure deposit.';

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
    var primary = el('a', 'pa2-hero__btn pa2-hero__btn--primary animate fade-up', 'Check Availability');
    primary.href = bookLink();
    var workUrl = (window.PASite && PASite.workUrl) ? PASite.workUrl : '/work/';
    var secondary = el('a', 'pa2-hero__btn pa2-hero__btn--secondary animate fade-up', 'View Portfolio');
    secondary.href = workUrl;
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
    var stale = document.getElementById('pa2-services');
    if (stale && !stale.classList.contains('pa2-services--cinema')) {
      if (stale.parentNode) stale.parentNode.removeChild(stale);
    }
    if (document.getElementById('pa2-services')) return;

    if (typeof window.PARelocateHomeShellFromHeader === 'function') {
      window.PARelocateHomeShellFromHeader();
    }
    if (typeof window.PARelocateHomeChromeBelowHero === 'function') {
      window.PARelocateHomeChromeBelowHero();
    }

    var base = homeBaseUrl();
    var workUrl = (window.PASite && PASite.workUrl) ? PASite.workUrl : '/work/';
    var weddingStill = pluginAsset('media/lane-weddings.jpg');
    var eventsStill = pluginAsset('media/events-corporate-01.jpg');
    var eventsStillAlt = pluginAsset('media/events-corporate-02.jpg');
    // Media cards — Events uses corporate event stills; Weddings keeps wedding still.
    var featureCards = [
      {
        id: 'weddings',
        label: 'Weddings',
        href: base + 'services/wedding-films-pennsylvania/',
        bookApi: 'Photo + Video Bundle',
        image: weddingStill,
        focusFilm: 1
      },
      {
        id: 'events',
        label: 'Events',
        href: base + 'services/live-event-production-pennsylvania/',
        bookApi: 'Video Production',
        image: eventsStill || eventsStillAlt,
        focusFilm: 0
      },
      {
        id: 'audio',
        label: 'Premium sound',
        href: base + 'services/audio-production-pennsylvania/',
        bookApi: 'Live Audio / PA',
        image: eventsStillAlt || '',
        focusFilm: 2
      }
    ];

    var section = document.createElement('section');
    section.className = 'pa2-services pa2-services--cinema pa2-services--cinema-glass pa-reveal-section section-reveal';
    section.id = 'pa2-services';
    section.setAttribute('data-pa-atmosphere', 'bright');
    section.setAttribute('aria-labelledby', 'pa2-services-title');

    var wrap = document.createElement('div');
    wrap.className = 'pa2-services__inner pa2-cinema';

    var head = document.createElement('header');
    head.className = 'pa2-cinema__head';
    head.appendChild(el('p', 'pa2-cinema__eyebrow', 'Selected work'));
    var title = el('h2', 'pa2-cinema__title', 'Recent films and photography.');
    title.id = 'pa2-services-title';
    head.appendChild(title);
    head.appendChild(el('p', 'pa2-cinema__lead',
      'Recent films and stills from Pennsylvania productions.'));
    wrap.appendChild(head);

    var stage = document.createElement('div');
    stage.className = 'pa2-cinema__stage';

    var player = document.createElement('div');
    player.className = 'pa2-cinema__player';
    player.id = 'pa2-cinema-player';
    stage.appendChild(player);

    var strip = document.createElement('div');
    strip.className = 'pa2-cinema__strip';
    strip.setAttribute('role', 'listbox');
    strip.setAttribute('aria-label', 'Featured films');
    stage.appendChild(strip);
    wrap.appendChild(stage);

    var lanePanels = document.createElement('div');
    lanePanels.className = 'pa2-cinema__lane-panels';

    var films = getFeaturedFilms();
    var state = { filmId: films[0] ? films[0].id : '', playing: false };

    function ytThumb(id, quality) {
      quality = quality || 'maxresdefault';
      return 'https://i.ytimg.com/vi/' + id + '/' + quality + '.jpg';
    }

    function filmPosterUrl(film) {
      if (!film) return '';
      if (film.poster) return film.poster;
      if (film.type === 'youtube') return ytThumb(film.id);
      return '';
    }

    function syncStripActive(id) {
      Array.prototype.forEach.call(strip.querySelectorAll('.pa2-cinema__thumb'), function (btn) {
        var on = btn.getAttribute('data-film-id') === id;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }

    function setPoster(film, titleText) {
      if (!film) return;
      state.filmId = film.id;
      state.playing = false;
      while (player.firstChild) player.removeChild(player.firstChild);
      var posterBtn = document.createElement('button');
      posterBtn.type = 'button';
      posterBtn.className = 'pa2-cinema__poster';
      posterBtn.setAttribute('aria-label', 'Play ' + (titleText || film.title || 'featured film'));
      var posterImg = document.createElement('img');
      posterImg.className = 'pa2-cinema__poster-img';
      posterImg.alt = '';
      posterImg.decoding = 'async';
      posterImg.src = filmPosterUrl(film);
      if (film.type === 'youtube') {
        posterImg.onerror = function () {
          if (posterImg.src.indexOf('maxresdefault') !== -1) {
            posterImg.src = ytThumb(film.id, 'hqdefault');
          }
        };
      }
      posterBtn.appendChild(posterImg);
      var playMark = document.createElement('span');
      playMark.className = 'pa2-cinema__play';
      playMark.setAttribute('aria-hidden', 'true');
      posterBtn.appendChild(playMark);
      var caption = el('div', 'pa2-cinema__caption', '');
      caption.appendChild(el('span', 'pa2-cinema__caption-kicker', 'Play film'));
      caption.appendChild(el('span', 'pa2-cinema__caption-title', titleText || film.title || 'Featured film'));
      posterBtn.appendChild(caption);
      posterBtn.addEventListener('click', function () { playFilm(film); });
      player.appendChild(posterBtn);
      syncStripActive(film.id);
    }

    function playFilm(film) {
      if (!film) return;
      state.playing = true;
      state.filmId = film.id;
      while (player.firstChild) player.removeChild(player.firstChild);
      if (film.type === 'local' && film.src) {
        var video = document.createElement('video');
        video.className = 'pa2-cinema__video';
        video.setAttribute('controls', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('preload', 'metadata');
        video.setAttribute('aria-label', film.title || 'Pennsylvania Media Arts featured film');
        if (film.poster) video.setAttribute('poster', film.poster);
        video.src = film.src;
        player.appendChild(video);
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () { /* user gesture already satisfied; controls remain */ });
        }
      } else {
        var frame = document.createElement('iframe');
        frame.className = 'pa2-cinema__iframe';
        frame.title = 'Pennsylvania Media Arts featured film';
        frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        frame.allowFullscreen = true;
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(film.id) +
          '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
        player.appendChild(frame);
      }
      syncStripActive(film.id);
    }

    function buildStrip() {
      while (strip.firstChild) strip.removeChild(strip.firstChild);
      if (!films.length) {
        strip.hidden = true;
        return;
      }
      strip.hidden = false;
      films.forEach(function (film, i) {
        var thumb = document.createElement('button');
        thumb.type = 'button';
        thumb.className = 'pa2-cinema__thumb' + (i === 0 ? ' is-active' : '');
        thumb.setAttribute('role', 'option');
        thumb.setAttribute('data-film-id', film.id);
        thumb.setAttribute('aria-label', 'Show film ' + (i + 1) + (film.title ? ': ' + film.title : ''));
        thumb.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        var img = document.createElement('img');
        img.alt = '';
        img.loading = i === 0 ? 'eager' : 'lazy';
        img.decoding = 'async';
        img.src = film.type === 'youtube' ? ytThumb(film.id, 'hqdefault') : (film.poster || filmPosterUrl(film));
        thumb.appendChild(img);
        thumb.addEventListener('click', function () {
          setPoster(film, film.title || 'Selected film');
        });
        strip.appendChild(thumb);
      });
      setPoster(films[0], films[0].title || 'Selected film');
    }

    featureCards.forEach(function (card, i) {
      var panel = document.createElement('article');
      panel.className = 'pa2-cinema__panel' + (i === 0 ? ' is-active' : '');
      panel.setAttribute('data-lane', card.id);

      var media = document.createElement('div');
      media.className = 'pa2-cinema__panel-media';
      var focus = films[card.focusFilm] || films[0];
      var bg = card.image || filmPosterUrl(focus);
      if (bg) {
        media.style.backgroundImage = 'url("' + bg.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '")';
        var mediaImg = document.createElement('img');
        mediaImg.src = bg;
        mediaImg.alt = '';
        mediaImg.setAttribute('aria-hidden', 'true');
        mediaImg.loading = 'eager';
        mediaImg.decoding = 'async';
        if (i < 2 && 'fetchPriority' in mediaImg) {
          mediaImg.fetchPriority = 'high';
        }
        function markMediaReady() {
          media.classList.add('is-loaded');
          mediaImg.classList.add('is-pa-img-loaded');
          panel.classList.add('is-media-ready');
        }
        if (mediaImg.complete && mediaImg.naturalWidth > 0) {
          markMediaReady();
        } else {
          mediaImg.addEventListener('load', markMediaReady, { once: true });
          mediaImg.addEventListener('error', markMediaReady, { once: true });
        }
        media.appendChild(mediaImg);
      } else {
        media.classList.add('is-loaded');
        panel.classList.add('is-media-ready');
      }
      panel.appendChild(media);

      var body = document.createElement('div');
      body.className = 'pa2-cinema__panel-body';
      body.appendChild(el('h3', 'pa2-cinema__panel-title', card.label));

      var actions = document.createElement('div');
      actions.className = 'pa2-cinema__panel-actions';
      var explore = el('a', 'pa2-cinema__panel-link', 'Explore');
      explore.href = card.href;
      var book = el('a', 'pa2-cinema__panel-book', 'Check availability');
      book.href = bookLink(card.bookApi);
      actions.appendChild(explore);
      actions.appendChild(book);
      body.appendChild(actions);
      panel.appendChild(body);

      panel.addEventListener('click', function (ev) {
        if (ev.target.closest('a')) return;
        var focusFilm = films[card.focusFilm] || films[0];
        if (focusFilm) setPoster(focusFilm, card.label);
        Array.prototype.forEach.call(lanePanels.querySelectorAll('.pa2-cinema__panel'), function (p) {
          p.classList.toggle('is-active', p === panel);
        });
      });

      lanePanels.appendChild(panel);
    });
    wrap.appendChild(lanePanels);

    var foot = document.createElement('div');
    foot.className = 'pa2-cinema__foot';
    var viewWork = el('a', 'pa2-cinema__cta pa2-cinema__cta--ghost', 'Full portfolio');
    viewWork.href = workUrl;
    var bookPrimary = el('a', 'pa2-cinema__cta pa2-cinema__cta--primary', 'Check availability');
    bookPrimary.href = bookLink();
    foot.appendChild(viewWork);
    foot.appendChild(bookPrimary);
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

    buildStrip();
    window.PAHomeCinema = true;
    stripDuplicateFeaturedVideo();

    /* Paint hidden first, then fade/slide in on the next frames. */
    section.classList.add('is-ready');
    if (typeof window.PARelocateHomeShellFromHeader === 'function') {
      window.PARelocateHomeShellFromHeader();
    }
    if (typeof window.PARepositionHomeSections === 'function') {
      window.PARepositionHomeSections();
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        section.classList.add('is-inview');
        refreshHomeScrollReveal(section);
        if (typeof window.PAFinalizeHomeExperience === 'function') {
          window.PAFinalizeHomeExperience();
        }
      });
    });
    return;
  }

  function stripDuplicateFeaturedVideo() {
    var dup = document.getElementById('pa-youtube-feature');
    if (dup && dup.parentNode) {
      dup.parentNode.removeChild(dup);
    }
  }

  function pluginAsset(relPath) {
    var base = (window.PASite && PASite.assetsBase) ? String(PASite.assetsBase) : '';
    if (!base) {
      var homeScript = document.querySelector('script[src*="/assets/home.js"]');
      if (homeScript && homeScript.src) {
        base = homeScript.src.replace(/assets\/home\.js(\?.*)?$/i, 'assets/');
      }
    }
    if (!base) return '';
    var ver = (window.PASite && PASite.assetVersion) ? String(PASite.assetVersion) : '';
    var url = base.replace(/\/?$/, '/') + String(relPath || '').replace(/^\//, '');
    return ver ? (url + (url.indexOf('?') === -1 ? '?' : '&') + 'v=' + encodeURIComponent(ver)) : url;
  }

  function getHomeVideoIds() {
    var ids = (window.PASite && PASite.youtubeVideos) ? PASite.youtubeVideos : [];
    var blocked = (window.PASite && PASite.youtubeBlockedVideos) ? PASite.youtubeBlockedVideos : [];
    var out = [];
    if (!Array.isArray(ids)) return out;
    ids.forEach(function (id) {
      if (typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id) &&
          blocked.indexOf(id) === -1 && out.indexOf(id) === -1) {
        out.push(id);
      }
    });
    if (!out.length) {
      out = ['10tkFTq_q9k', 'o_XqjsIw6wQ', 'md_W_73txMI', '-hqlCiFmr0U'];
    }
    return out;
  }

  /**
   * Home cinema playlist: local reels first, then YouTube featured IDs.
   *
   * @returns {Array<{type:string,id:string,src?:string,poster?:string,title?:string}>}
   */
  function getFeaturedFilms() {
    var films = [];
    var seen = {};
    var locals = (window.PASite && PASite.featuredLocalVideos) ? PASite.featuredLocalVideos : [];
    if (Array.isArray(locals)) {
      locals.forEach(function (item, i) {
        if (!item || typeof item !== 'object') return;
        var src = item.src ? String(item.src) : '';
        if (!src) return;
        var id = item.id ? String(item.id) : ('local-' + i);
        if (seen[id]) return;
        seen[id] = true;
        films.push({
          type: 'local',
          id: id,
          src: src,
          poster: item.poster ? String(item.poster) : '',
          title: item.title ? String(item.title) : 'Featured film'
        });
      });
    }
    getHomeVideoIds().forEach(function (ytId) {
      if (seen[ytId]) return;
      seen[ytId] = true;
      films.push({
        type: 'youtube',
        id: ytId,
        title: 'Selected film'
      });
    });
    return films.slice(0, 4);
  }

  function getHomePhotoUrls() {
    var urls = [];
    var hero = window.PASite && PASite.homeHeroImage && PASite.homeHeroImage.url;
    if (hero) urls.push(hero);
    document.querySelectorAll(
      '#pa-portfolio img, #pa-photo-portfolio img, .pa-portfolio-tile img, .wp-block-gallery img, .pa-photo-grid img'
    ).forEach(function (img) {
      var src = img.currentSrc || img.src;
      if (src && urls.indexOf(src) === -1 && src.indexOf('data:') !== 0) {
        urls.push(src);
      }
    });
    return urls;
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
    eyebrow.textContent = 'Still photography';
    var title = document.createElement('h2');
    title.className = 'pa2-portfolio__title';
    title.id = 'pa2-portfolio-title';
    title.textContent = 'Frame by frame';
    var lead = document.createElement('p');
    lead.className = 'pa2-portfolio__lead';
    lead.textContent =
      'Selected stills from weddings, concerts, and brand work across Pennsylvania. Tap any image to open full size.';
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
    var showcase = document.getElementById('pa-photo-portfolio') ||
      document.getElementById('pa-portfolio') ||
      document.querySelector('.pa-portfolio-showcase');
    var video = document.getElementById('pa-youtube-feature');

    if (document.querySelector('.pa2-portfolio--enhanced')) {
      if (video && typeof window.PAAbsorbYoutubeIntoPortfolio === 'function') {
        window.PAAbsorbYoutubeIntoPortfolio(video);
      } else if (video && showcase && !showcase.contains(video)) {
        var grid = showcase.querySelector('.pa-portfolio-grid, .pa-photo-grid');
        var featEl = showcase.querySelector('.pa2-portfolio__featured');
        if (!featEl) {
          featEl = document.createElement('div');
          featEl.className = 'pa2-portfolio__featured';
          showcase.insertBefore(featEl, grid || showcase.firstChild);
        }
        featEl.appendChild(video);
        if (typeof window.PARevealYoutubeFeature === 'function') {
          window.PARevealYoutubeFeature(video);
        }
        refreshHomeScrollReveal(showcase);
      } else if (video && typeof window.PARevealYoutubeFeature === 'function') {
        window.PARevealYoutubeFeature(video);
      }
      return true;
    }

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
    eyebrow.textContent = 'Still photography';
    var title = document.createElement('h2');
    title.className = 'pa2-portfolio__title';
    title.id = 'pa2-portfolio-title';
    title.textContent = 'Frame by frame';
    var lead = document.createElement('p');
    lead.className = 'pa2-portfolio__lead';
    lead.textContent =
      'Selected stills from weddings, concerts, and brand work across Pennsylvania. Tap any image to open full size.';
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

  function revealHomeCtaContent(band) {
    if (!band) {
      return;
    }
    band.classList.add('is-inview', 'is-ready');
    var inner = band.querySelector('.pa2-cta__inner');
    if (!inner) {
      return;
    }
    inner.classList.add('is-revealed', 'is-visible', 'is-animated', 'pa-reveal-item');
    inner.querySelectorAll(
      '.pa2-cta__eyebrow, .pa2-cta__title, .pa2-cta__lead, .pa2-cta__actions, ' +
      '.pa2-cta__btn, .pa2-cta__trust, .pa2-cta__trust-item, .animate, .pa-reveal-item'
    ).forEach(function (el) {
      el.classList.add('is-animated', 'is-revealed', 'is-visible');
    });
  }

  function buildHomeBookingCta() {
    var band = document.getElementById('pa-home-closing');
    var existing = document.querySelector('.pa2-cta--enhanced');
    if (existing && existing.querySelector('.pa2-cta__btn--primary')) {
      revealHomeCtaContent(existing);
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
    band.setAttribute('aria-labelledby', 'pa2-cta-title');
    while (band.firstChild) band.removeChild(band.firstChild);

    var parallaxBg = document.createElement('div');
    parallaxBg.className = 'pa2-cta__parallax-bg';
    parallaxBg.setAttribute('aria-hidden', 'true');
    parallaxBg.setAttribute('data-parallax', '0.15');
    band.appendChild(parallaxBg);

    var inner = document.createElement('div');
    inner.className = 'pa2-cta__inner pa-reveal-item';
    inner.style.setProperty('--pa-reveal-i', '0');
    inner.style.setProperty('--anim-i', '0');

    var eyebrow = document.createElement('p');
    eyebrow.className = 'pa2-cta__eyebrow pa-reveal-item';
    eyebrow.style.setProperty('--pa-reveal-i', '0');
    eyebrow.textContent = 'Pennsylvania Media Arts';
    inner.appendChild(eyebrow);

    var title = document.createElement('h2');
    title.className = 'pa2-cta__title pa-reveal-item';
    title.style.setProperty('--pa-reveal-i', '1');
    title.id = 'pa2-cta-title';
    title.textContent = 'Let\u2019s reserve your date';
    inner.appendChild(title);

    var lead = document.createElement('p');
    lead.className = 'pa2-cta__lead pa-reveal-item';
    lead.style.setProperty('--pa-reveal-i', '2');
    var depositUsd = (window.PASite && PASite.depositUsd) ? PASite.depositUsd : '150';
    lead.textContent = 'Most bookings take about two minutes — choose your service, pick a date, and secure your spot with a $' + depositUsd + ' deposit.';
    inner.appendChild(lead);

    var actions = document.createElement('div');
    actions.className = 'pa2-cta__actions pa-reveal-item';
    actions.style.setProperty('--pa-reveal-i', '3');
    var primary = document.createElement('a');
    primary.className = 'pa2-cta__btn pa2-cta__btn--primary';
    primary.href = bookLink();
    primary.textContent = 'Hold your date';
    var workUrl = (window.PASite && PASite.workUrl) ? PASite.workUrl : '/work/';
    var secondary = document.createElement('a');
    secondary.className = 'pa2-cta__btn pa2-cta__btn--secondary';
    secondary.href = workUrl;
    secondary.textContent = 'View our work';
    actions.appendChild(primary);
    actions.appendChild(secondary);
    inner.appendChild(actions);

    var trust = document.createElement('ul');
    trust.className = 'pa2-cta__trust pa-reveal-item';
    trust.style.setProperty('--pa-reveal-i', '4');
    trust.setAttribute('aria-label', 'Booking reassurance');
    [
      'Live availability',
      'Deposit holds your date',
      'Proposal after booking',
      '~2 min to book'
    ].forEach(function (item, i) {
      var li = document.createElement('li');
      li.className = 'pa2-cta__trust-item';
      li.style.setProperty('--pa-reveal-i', String(5 + i));
      li.textContent = item;
      trust.appendChild(li);
    });
    inner.appendChild(trust);

    band.appendChild(inner);
    revealHomeCtaContent(band);
    requestAnimationFrame(function () { band.classList.add('is-ready'); });
    refreshHomeScrollReveal(band);
    return true;
  }
})();
