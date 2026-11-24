(function () {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  var started = false;
  function warmOfflineCache() {
    if (started) return;
    started = true;
    try {
      navigator.serviceWorker.getRegistration('./').then(function (reg) {
        var activeUrl = reg && (reg.active || reg.waiting || reg.installing) ? (reg.active || reg.waiting || reg.installing).scriptURL : '';
        var needsRegister = !reg || !activeUrl || !new URL(activeUrl, location.href).pathname.endsWith('/OneSignalSDKWorker.js') || reg.updateViaCache !== 'none';
        if (needsRegister) {
          return navigator.serviceWorker.register('./OneSignalSDKWorker.js', { scope: './', updateViaCache: 'none' });
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
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(warmOfflineCache, { timeout: 2500 });
    } else {
      setTimeout(warmOfflineCache, 600);
    }
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
