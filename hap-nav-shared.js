/**
 * hap-nav-shared.js — lightweight scroll-active highlighting for static dashboards
 * used by 340b-BASIC.html (no 340b.js). Keeps hash-only nav links in sync with scroll position.
 */
(function () {
  "use strict";

  function updateNavCurrent(activeId) {
    var navLinks = document.querySelectorAll(".dashboard-nav a[href^='#'], .hap-sidebar-nav a[href^='#']");
    if (!navLinks || !navLinks.length) return;
    var policySections = ["oversight", "pa-impact", "community-benefit", "access", "pa-safeguards", "policy-milestones"];
    navLinks.forEach(function (link) {
      var href = link.getAttribute("href") || "";
      var hash = href.indexOf("#") === 0 ? href.slice(1) : "";
      var isActive =
        hash === activeId ||
        (activeId === "section-overview" && (hash === "what-is-340b" || hash === "section-overview")) ||
        (activeId === "overview" && hash === "overview") ||
        (href === "#policy" && policySections.indexOf(activeId) >= 0);
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function initNavHighlight() {
    var sectionIds = [
      "section-overview",
      "overview",
      "state-laws",
      "legal-trends",
      "methodology-section",
      "key-metrics",
      "community-benefit",
      "pa-impact-mode",
      "policy-impact-simulator",
      "policy-milestones",
      "access",
      "pa-safeguards"
    ];
    var sections = sectionIds.map(function (id) {
      return document.getElementById(id);
    }).filter(Boolean);

    if (!sections.length) {
      updateNavCurrent("section-overview");
      return;
    }

    var cachedNavHeaderOffset = 96;
    function refreshNavHeaderOffset() {
      var h = document.querySelector(".dashboard-header");
      cachedNavHeaderOffset = h ? Math.round(h.getBoundingClientRect().height) + 12 : 96;
    }

    var sectionDocumentTops = [];
    function refreshSectionAnchors() {
      var sy = window.pageYOffset || document.documentElement.scrollTop || 0;
      sectionDocumentTops = sections.map(function (el) {
        return el.getBoundingClientRect().top + sy;
      });
    }

    function tickNavFromScroll() {
      if (!sectionDocumentTops.length) {
        refreshSectionAnchors();
      }
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var band = cachedNavHeaderOffset + 8;
      var activeId = sections[0].id;
      for (var i = sections.length - 1; i >= 0; i--) {
        if (sectionDocumentTops[i] <= y + band) {
          activeId = sections[i].id;
          break;
        }
      }
      updateNavCurrent(activeId);
    }

    var scrollTicking = false;
    function onScrollOptimized() {
      if (!scrollTicking) {
        window.requestAnimationFrame(function () {
          tickNavFromScroll();
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }

    function afterLayoutRefresh() {
      refreshNavHeaderOffset();
      refreshSectionAnchors();
      tickNavFromScroll();
    }

    refreshNavHeaderOffset();
    refreshSectionAnchors();

    var resizeNavTimer = null;
    window.addEventListener("scroll", onScrollOptimized, { passive: true });
    window.addEventListener("resize", function () {
      if (resizeNavTimer) window.clearTimeout(resizeNavTimer);
      resizeNavTimer = window.setTimeout(afterLayoutRefresh, 100);
    });
    window.addEventListener("load", afterLayoutRefresh);
    window.addEventListener("hashchange", function () {
      window.requestAnimationFrame(afterLayoutRefresh);
    });
    tickNavFromScroll();
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(afterLayoutRefresh);
    });

    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(function () {
        afterLayoutRefresh();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNavHighlight);
  } else {
    initNavHighlight();
  }
})();
