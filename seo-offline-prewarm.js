(function () {
  var isPagesDev = /\.pages\.dev$/i.test(location.hostname);
  var CLEAN_SKIP = /(?:\/|^)(?:app-hoc-hsk|admin|index|[\w-]+-notice)\.html$/i;

  function rewriteLinksForCleanUrls() {
    if (!isPagesDev) return;
    var anchors = document.querySelectorAll('a[href]');
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      var raw = a.getAttribute('href');
      if (!raw || raw.charAt(0) === '#' || /^(?:mailto:|tel:|javascript:)/i.test(raw)) continue;
      try {
        var u = new URL(raw, location.href);
        if (u.origin !== location.origin || !u.pathname.endsWith('.html') || CLEAN_SKIP.test(u.pathname)) continue;
        u.pathname = u.pathname.slice(0, -5);
        a.setAttribute('href', u.pathname + u.search + u.hash);
      } catch (_) {}
    }
  }

  function bindNavDropdowns() {
    var menus = document.querySelectorAll('details.nav-dropdown, details.mobile-nav-menu');
    if (!menus.length) return;
    for (var i = 0; i < menus.length; i++) {
      menus[i].addEventListener('toggle', function () {
        if (!this.open) return;
        for (var j = 0; j < menus.length; j++) {
          if (menus[j] !== this && menus[j].open) menus[j].open = false;
        }
      });
    }
    document.addEventListener('click', function (e) {
      var picked = e.target && e.target.closest && e.target.closest('.nav-dropdown-menu a, .mobile-nav-panel a');
      for (var k = 0; k < menus.length; k++) {
        if (menus[k].open && (picked || !menus[k].contains(e.target))) menus[k].open = false;
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      for (var k = 0; k < menus.length; k++) {
        if (menus[k].open) {
          menus[k].open = false;
          var sum = menus[k].querySelector('summary');
          if (sum && sum.focus) sum.focus();
        }
      }
    });
  }

  function enableInstantNavigation() {
    rewriteLinksForCleanUrls();
    bindNavDropdowns();
    var hasSpecRules = false;
    try {
      hasSpecRules = Boolean(window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules'));
      if (hasSpecRules) {
        var spec = document.createElement('script');
        spec.type = 'speculationrules';
        spec.textContent = JSON.stringify({
          prerender: [
            {
              where: {
                and: [
                  { href_matches: '/*' },
                  { not: { href_matches: '/app-hoc-hsk*' } },
                  { not: { href_matches: '/admin*' } },
                  { not: { selector_matches: '[target="_blank"]' } }
                ]
              },
              eagerness: 'moderate'
            }
          ]
        });
        document.head.appendChild(spec);
      }
    } catch (_) {
      hasSpecRules = false;
    }

    if (!hasSpecRules) {
      var prefetched = Object.create(null);
      var prefetchCount = 0;
      var prefetchAnchor = function (target) {
        if (prefetchCount >= 12 || !target || !target.closest) return;
        var a = target.closest('a[href]');
        if (!a || a.target === '_blank') return;
        try {
          var u = new URL(a.href, location.href);
          if (u.origin !== location.origin || u.href === location.href || CLEAN_SKIP.test(u.pathname)) return;
          var key = u.origin + u.pathname + u.search;
          if (prefetched[key]) return;
          prefetched[key] = true;
          prefetchCount++;
          var link = document.createElement('link');
          link.rel = 'prefetch';
          link.as = 'document';
          link.href = key;
          document.head.appendChild(link);
        } catch (_) {}
      };
      document.addEventListener('pointerenter', function (e) { prefetchAnchor(e.target); }, { passive: true, capture: true });
      document.addEventListener('touchstart', function (e) { prefetchAnchor(e.target); }, { passive: true, capture: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableInstantNavigation, { once: true });
  } else {
    enableInstantNavigation();
  }

  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  var scriptEl = document.currentScript;
  var baseScopeUrl = (scriptEl && scriptEl.src) ? new URL('./', scriptEl.src).href : new URL('./', location.href).href;
  var workerUrl = new URL('OneSignalSDKWorker.js', baseScopeUrl).href;
  var started = false;

  function warmOfflineCache() {
    if (started) return;
    started = true;
    try {
      navigator.serviceWorker.getRegistration(baseScopeUrl).then(function (reg) {
        var activeUrl = reg && (reg.active || reg.waiting || reg.installing) ? (reg.active || reg.waiting || reg.installing).scriptURL : '';
        var needsRegister = !reg || !activeUrl || !new URL(activeUrl, location.href).pathname.endsWith('/OneSignalSDKWorker.js') || reg.updateViaCache !== 'none';
        if (needsRegister) {
          return navigator.serviceWorker.register(workerUrl, { scope: baseScopeUrl, updateViaCache: 'none' });
        }
        return reg;
      }).then(function () {
        if (navigator.storage && navigator.storage.persist) {
          navigator.storage.persist().catch(function () {});
        }
      }).catch(function () {
        started = false;
      });
    } catch (_) {
      started = false;
    }
  }

  function scheduleWarm() {
    setTimeout(function () {
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(warmOfflineCache, { timeout: 2000 });
      } else {
        warmOfflineCache();
      }
    }, 4500);
  }

  if (document.readyState === 'complete') scheduleWarm();
  else window.addEventListener('load', scheduleWarm, { once: true });
  window.addEventListener('online', function () {
    if (!navigator.serviceWorker.controller) {
      started = false;
      warmOfflineCache();
    }
  });
})();
