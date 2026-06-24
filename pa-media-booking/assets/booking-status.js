(function () {
  'use strict';

  var root = document.getElementById('pa-status-app');
  var form = document.getElementById('pa-status-form');
  if (!root || !form || typeof PAStatus === 'undefined') {
    return;
  }

  var resultEl = document.getElementById('pa-status-result');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var id = (document.getElementById('pa-status-id') || {}).value || '';
    var email = (document.getElementById('pa-status-email') || {}).value || '';
    id = id.replace(/\D/g, '');
    if (!id || !email) {
      showError('Enter your booking ID and email.');
      return;
    }

    resultEl.hidden = true;
    resultEl.className = 'pa-status-result';
    var btn = form.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Looking up…';
    }

    fetch(
      PAStatus.restUrl + 'status?booking_id=' + encodeURIComponent(id) + '&email=' + encodeURIComponent(email),
      { credentials: 'same-origin' }
    )
      .then(function (r) {
        return r.json().then(function (body) {
          return { ok: r.ok, body: body };
        });
      })
      .then(function (res) {
        if (!res.ok) {
          throw new Error((res.body && res.body.message) || 'Could not find that booking.');
        }
        showResult(res.body);
      })
      .catch(function (err) {
        showError(err.message || 'Something went wrong. Try again.');
      })
      .finally(function () {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Look up status';
        }
      });
  });

  function showError(msg) {
    resultEl.hidden = false;
    resultEl.className = 'pa-status-result pa-status-result--error';
    while (resultEl.firstChild) {
      resultEl.removeChild(resultEl.firstChild);
    }
    var p = document.createElement('p');
    p.textContent = msg;
    resultEl.appendChild(p);
  }

  function showResult(data) {
    resultEl.hidden = false;
    resultEl.className = 'pa-status-result pa-status-result--ok';
    while (resultEl.firstChild) {
      resultEl.removeChild(resultEl.firstChild);
    }

    var badge = document.createElement('p');
    badge.className = 'pa-status-badge';
    badge.textContent = data.status_label || data.status;
    resultEl.appendChild(badge);

    var dl = document.createElement('dl');
    dl.className = 'pa-status-dl';
    addRow(dl, 'Booking ID', String(data.booking_id));
    addRow(dl, 'Package', data.service);
    addRow(dl, 'Date', data.dates_label);
    if (data.time_window) {
      addRow(dl, 'Time', data.time_window);
    }
    if (data.venue) {
      addRow(dl, 'Venue', data.venue);
    }
    if (data.deposit_usd) {
      addRow(dl, 'Deposit', '$' + Number(data.deposit_usd).toFixed(2));
    }
    resultEl.appendChild(dl);

    var help = document.createElement('p');
    help.className = 'pa-status-help';
    help.textContent = 'Questions? Reply to your confirmation email or book again if you need a different date.';
    resultEl.appendChild(help);

    var book = document.createElement('a');
    book.className = 'pa-booking-cta pa-booking-cta-secondary';
    book.href = PAStatus.bookUrl || '/book/';
    book.textContent = 'Book another date';
    resultEl.appendChild(book);
  }

  function addRow(dl, label, value) {
    if (!value) return;
    var dt = document.createElement('dt');
    dt.textContent = label;
    var dd = document.createElement('dd');
    dd.textContent = value;
    dl.appendChild(dt);
    dl.appendChild(dd);
  }
})();
