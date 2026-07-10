/**
 * Google reviews carousel — "What Our Customers Are Saying"
 *
 * Builds a rotating testimonial band from window.PAGoogleReviews (static data).
 * Safe DOM only; respects prefers-reduced-motion.
 */
(function () {
  'use strict';

  var ROTATE_MS = 7000;

  window.PABuildGoogleReviews = function (options) {
    options = options || {};
    var data = window.PAGoogleReviews;
    if (!data || !data.reviews || !data.reviews.length) return null;
    if (document.getElementById(options.id || 'pa2-reviews')) return document.getElementById(options.id || 'pa2-reviews');

    var section = document.createElement('section');
    section.className = 'pa2-reviews pa-reveal-section';
    section.id = options.id || 'pa2-reviews';
    section.setAttribute('aria-labelledby', 'pa2-reviews-title');

    var inner = document.createElement('div');
    inner.className = 'pa2-reviews__inner';

    var head = document.createElement('div');
    head.className = 'pa2-reviews__head';

    var eyebrow = document.createElement('p');
    eyebrow.className = 'pa2-reviews__eyebrow';
    eyebrow.textContent = 'Google reviews';
    head.appendChild(eyebrow);

    var title = document.createElement('h2');
    title.className = 'pa2-reviews__title';
    title.id = 'pa2-reviews-title';
    title.textContent = 'What Our Customers Are Saying';
    head.appendChild(title);

    var summary = document.createElement('p');
    summary.className = 'pa2-reviews__summary';
    summary.setAttribute('aria-label', 'Google rating summary');
    var stars = document.createElement('span');
    stars.className = 'pa2-reviews__summary-stars';
    stars.setAttribute('aria-hidden', 'true');
    stars.textContent = starString(data._meta && data._meta.rating);
    var summaryText = document.createElement('span');
    summaryText.className = 'pa2-reviews__summary-text';
    var shown = data.reviews.length;
    var count = (data._meta && data._meta.count) || shown;
    var rating = (data._meta && data._meta.rating) || 5;
    summaryText.textContent = rating.toFixed(1) + ' \u00b7 ' + count + ' Google reviews';
    summary.appendChild(stars);
    summary.appendChild(summaryText);
    head.appendChild(summary);
    if (count > shown) {
      var feat = document.createElement('p');
      feat.className = 'pa2-reviews__featured-note';
      feat.textContent = 'Featuring ' + shown + ' client stories below';
      head.appendChild(feat);
    }

    inner.appendChild(head);

    var stage = document.createElement('div');
    stage.className = 'pa2-reviews__stage';
    stage.setAttribute('role', 'region');
    stage.setAttribute('aria-live', 'polite');
    stage.setAttribute('aria-label', 'Customer reviews');

    var track = document.createElement('div');
    track.className = 'pa2-reviews__track';

    data.reviews.forEach(function (review, index) {
      track.appendChild(buildSlide(review, index, data.reviews.length));
    });

    stage.appendChild(track);
    inner.appendChild(stage);

    var controls = document.createElement('div');
    controls.className = 'pa2-reviews__controls';

    var prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'pa2-reviews__nav pa2-reviews__nav--prev';
    prev.setAttribute('aria-label', 'Previous review');
    prev.textContent = '\u2039';
    controls.appendChild(prev);

    var dots = document.createElement('div');
    dots.className = 'pa2-reviews__dots';
    dots.setAttribute('role', 'tablist');
    dots.setAttribute('aria-label', 'Choose review');
    data.reviews.forEach(function (review, index) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'pa2-reviews__dot' + (index === 0 ? ' is-active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Review ' + (index + 1) + ' of ' + data.reviews.length + ' by ' + review.author);
      dot.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      dots.appendChild(dot);
    });
    controls.appendChild(dots);

    var next = document.createElement('button');
    next.type = 'button';
    next.className = 'pa2-reviews__nav pa2-reviews__nav--next';
    next.setAttribute('aria-label', 'Next review');
    next.textContent = '\u203a';
    controls.appendChild(next);

    inner.appendChild(controls);

    var foot = document.createElement('p');
    foot.className = 'pa2-reviews__foot';
    var link = document.createElement('a');
    link.className = 'pa2-reviews__link';
    link.href = (data._meta && data._meta.profileUrl) || 'https://www.google.com/search?q=Pennsylvania+Media+Arts+LLC+Reviews';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Read all reviews on Google';
    foot.appendChild(link);
    inner.appendChild(foot);

    section.appendChild(inner);
    initCarousel(section, data.reviews.length);
    return section;
  };

  function buildSlide(review, index, total) {
    var slide = document.createElement('blockquote');
    slide.className = 'pa2-reviews__slide' + (index === 0 ? ' is-active' : '');
    slide.setAttribute('data-index', String(index));
    slide.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');

    var stars = document.createElement('div');
    stars.className = 'pa2-reviews__stars animate fade-up stagger';
    stars.setAttribute('aria-label', review.rating + ' out of 5 stars');
    var starCount = Math.max(0, Math.min(5, Math.round(Number(review.rating) || 5)));
    for (var si = 0; si < starCount; si += 1) {
      var starSpan = document.createElement('span');
      starSpan.className = 'pa2-reviews__star animate fade-up';
      starSpan.setAttribute('aria-hidden', 'true');
      starSpan.textContent = '\u2605';
      starSpan.style.setProperty('--anim-i', String(si));
      stars.appendChild(starSpan);
    }
    slide.appendChild(stars);

    var quote = document.createElement('p');
    quote.className = 'pa2-reviews__quote animate fade-up';
    quote.textContent = review.text;
    slide.appendChild(quote);

    var meta = document.createElement('footer');
    meta.className = 'pa2-reviews__meta';

    var author = document.createElement('cite');
    author.className = 'pa2-reviews__author animate scale-in';
    author.textContent = review.author;
    meta.appendChild(author);

    if (review.context) {
      var context = document.createElement('span');
      context.className = 'pa2-reviews__context';
      context.textContent = review.context;
      meta.appendChild(context);
    }

    if (review.relativeTime) {
      var time = document.createElement('span');
      time.className = 'pa2-reviews__time';
      time.textContent = review.relativeTime;
      meta.appendChild(time);
    }

    slide.appendChild(meta);
    slide.setAttribute('aria-label', 'Review ' + (index + 1) + ' of ' + total);
    return slide;
  }

  function starString(rating) {
    var n = Math.max(0, Math.min(5, Math.round(Number(rating) || 5)));
    return '\u2605'.repeat(n) + '\u2606'.repeat(5 - n);
  }

  function initCarousel(root, total) {
    if (total < 2) return;

    var index = 0;
    var slides = root.querySelectorAll('.pa2-reviews__slide');
    var dots = root.querySelectorAll('.pa2-reviews__dot');
    var prev = root.querySelector('.pa2-reviews__nav--prev');
    var next = root.querySelector('.pa2-reviews__nav--next');
    var timer = null;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function show(nextIndex) {
      index = (nextIndex + total) % total;
      slides.forEach(function (slide, i) {
        var active = i === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
      dots.forEach(function (dot, i) {
        var active = i === index;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    function start() {
      if (reduced || timer) return;
      timer = window.setInterval(function () {
        show(index + 1);
      }, ROTATE_MS);
    }

    function stop() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    if (prev) {
      prev.addEventListener('click', function () {
        stop();
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        stop();
        show(index + 1);
        start();
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        stop();
        show(i);
        start();
      });
    });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);

    if (!reduced) start();
    requestAnimationFrame(function () { root.classList.add('is-ready'); });
  }
})();
