/* ============================================================================
   redesign.js — tương tác bổ sung cho lớp giao diện mới
   Chỉ thêm hành vi cho những phần vốn là <div> tĩnh (3 bước lộ trình),
   không sửa logic, không đổi dữ liệu của ứng dụng.
   ========================================================================= */
(function () {
  'use strict';

  var DEST = [
    { test: /khám phá|đọc bài|nghe hội thoại/i, go: 'lessons' },
    { test: /luyện tập|thẻ từ|trắc nghiệm/i, go: 'practice' },
    { test: /ghi nhớ|ôn sai|srs|ôn tập/i, go: 'srs' }
  ];

  function navigate(name) {
    if (window.HSKStudio && typeof window.HSKStudio.navigate === 'function') {
      window.HSKStudio.navigate(name);
      return true;
    }
    var trigger =
      document.querySelector('[data-studio-go="' + name + '"]') ||
      document.querySelector('.side-nav [data-studio-go="' + name + '"]') ||
      document.querySelector('.bottom-nav [data-studio-go="' + name + '"]');
    if (!trigger) return false;
    trigger.click();
    return true;
  }

  function resolveTarget(step, index) {
    var title = (step.querySelector('strong') || {}).textContent || '';
    var sub = (step.querySelector('small') || {}).textContent || '';
    var haystack = title + ' ' + sub;
    for (var i = 0; i < DEST.length; i++) {
      if (DEST[i].test.test(haystack)) return DEST[i].go;
    }
    return ['lessons', 'practice', 'srs'][index] || 'lessons';
  }

  function enhance() {
    var steps = document.querySelectorAll('.pathway .path-step');
    if (!steps.length) return;

    Array.prototype.forEach.call(steps, function (step, index) {
      if (step.dataset.rdEnhanced === '1') return;
      step.dataset.rdEnhanced = '1';

      var title = (step.querySelector('strong') || {}).textContent || '';
      var target = resolveTarget(step, index);

      step.setAttribute('role', 'button');
      step.setAttribute('tabindex', '0');
      step.setAttribute('aria-label', (title || 'Bước ' + (index + 1)) + ' — mở mục tương ứng');

      step.addEventListener('click', function (e) {
        e.preventDefault();
        navigate(target);
      });

      step.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          navigate(target);
        }
      });
    });
  }

  function boot() {
    enhance();
    var host = document.getElementById('studioHome');
    if (host && 'MutationObserver' in window) {
      var pending = false;
      new MutationObserver(function () {
        if (pending) return;
        pending = true;
        requestAnimationFrame(function () {
          pending = false;
          enhance();
        });
      }).observe(host, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
