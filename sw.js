/**
 * Service Worker — HAP 340B Mobile PWA
 *
 * WHO THIS IS FOR: Deployers who want "Add to Home Screen" to load quickly and work offline after the first visit.
 * WHAT IT DOES: Caches the mobile app shell on install; serves cached same-origin assets when the network is slow or unavailable.
 * WHAT IT DOES NOT DO: Replace a data warehouse — dynamic KPIs still come from state-data.js / DataLayer when the page runs.
 *
 * HOW TO TEST: Serve the site over HTTPS (or localhost), open 340b-mobile.html, reload twice, then toggle offline in DevTools.
 * BUMP CACHE_NAME when you change precached files so clients get fresh copies.
 */
/* global self, caches */

var CACHE_NAME = "hap-340b-mobile-shell-v1";

/** Minimal shell — expand cautiously (large GeoJSON bundles slow first install). */
var PRECACHE_URLS = [
  "340b-mobile.html",
  "340b-mobile.css",
  "hap-design-tokens.css",
  "340b-mobile.js",
  "manifest.json",
  "state-data.js"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      var base = self.registration.scope;
      return Promise.all(
        PRECACHE_URLS.map(function (path) {
          var url = new URL(path, base).href;
          return cache.add(url).catch(function () {
            return null;
          });
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") {
    return;
  }
  var reqUrl;
  try {
    reqUrl = new URL(event.request.url);
  } catch (e) {
    return;
  }
  if (reqUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) {
        return cached;
      }
      return fetch(event.request)
        .then(function (response) {
          if (response && response.status === 200 && response.type === "basic") {
            var copy = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, copy);
            });
          }
          return response;
        })
        .catch(function () {
          return caches.match("340b-mobile.html");
        });
    })
  );
});
