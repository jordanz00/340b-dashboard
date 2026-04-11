'use strict';
/**
 * Optional recording brand: opening title card + corner logo (PNG/JPEG/WebP) on #c-rec composite.
 * No network upload — image stays in memory until tab closes.
 */
(function () {
  var img = new Image();
  img.decoding = 'async';

  window.NX = window.NX || {};
  NX.RecBrand = {
    openingCard: false,
    logoCorner: false,
    logoImage: img,
    clearLogo: function () {
      img.src = '';
      img.removeAttribute('src');
      NX.RecBrand.logoCorner = false;
    },
    syncFromDom: function () {
      var oc = document.getElementById('nx-rec-open-card');
      var lg = document.getElementById('nx-rec-logo-enable');
      NX.RecBrand.openingCard = !!(oc && oc.checked);
      NX.RecBrand.logoCorner = !!(lg && lg.checked && img.complete && img.naturalWidth > 0);
    }
  };

  function wire() {
    var oc = document.getElementById('nx-rec-open-card');
    var lg = document.getElementById('nx-rec-logo-enable');
    var fi = document.getElementById('nx-rec-logo-file');
    if (oc) {
      oc.addEventListener('change', function () {
        NX.RecBrand.openingCard = !!oc.checked;
      });
    }
    if (lg && fi) {
      fi.addEventListener('change', function () {
        var f = fi.files && fi.files[0];
        if (!f) {
          NX.RecBrand.clearLogo();
          return;
        }
        var ok = /^image\/(png|jpeg|jpg|webp)$/i.test(f.type);
        if (!ok) {
          if (typeof console !== 'undefined' && console.warn) console.warn('NEXUS: logo file type not allowed', f.type);
          fi.value = '';
          return;
        }
        if (f.size > 2 * 1024 * 1024) {
          if (typeof console !== 'undefined' && console.warn) console.warn('NEXUS: logo file too large (max 2MB)');
          fi.value = '';
          return;
        }
        var url = URL.createObjectURL(f);
        img.onload = function () {
          try { URL.revokeObjectURL(url); } catch (e) { /* ignore */ }
          NX.RecBrand.logoCorner = !!(lg.checked && img.naturalWidth > 0);
        };
        img.onerror = function () {
          try { URL.revokeObjectURL(url); } catch (e2) { /* ignore */ }
          NX.RecBrand.clearLogo();
        };
        img.src = url;
      });
      lg.addEventListener('change', function () {
        if (!lg.checked) {
          NX.RecBrand.logoCorner = false;
        } else if (img.complete && img.naturalWidth) {
          NX.RecBrand.logoCorner = true;
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
