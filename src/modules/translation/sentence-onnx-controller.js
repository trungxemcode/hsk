/* Opt-in lifecycle for the on-device grammar model. */
(() => {
  'use strict';
  const workerUrl = new URL('./sentence-onnx-worker.js', document.currentScript.src);
  const delay = 1200;

  window.HSKSentenceOnnx = function ({toggle, status, onSuggestions}) {
    let enabled = false;
    let worker = null;
    let timer;
    let timeout;
    let revision = 0;
    let busy = false;
    let queued = null;
    let latest = '';

    function stop() {
      clearTimeout(timer);
      clearTimeout(timeout);
      worker?.terminate();
      worker = null;
      busy = false;
      queued = null;
    }

    function update() {
      toggle.setAttribute('aria-pressed', String(enabled));
      toggle.textContent = enabled ? 'Tắt kiểm tra tại máy' : 'Bật kiểm tra tại máy';
    }

    function fail() {
      stop();
      enabled = false;
      update();
      status.textContent = 'Không mở được model. Bộ kiểm tra cơ bản vẫn hoạt động.';
    }

    function send(job) {
      busy = true;
      timeout = setTimeout(fail, job.type === 'load' ? 45000 : 5000);
      worker.postMessage(job);
    }

    function ensureWorker() {
      if (worker) return true;
      try {
        worker = new Worker(workerUrl);
        worker.onmessage = ({data}) => {
          clearTimeout(timeout);
          busy = false;
          if (data.type === 'error') return fail();
          if (data.type === 'ready') status.textContent = 'Đã bật kiểm tra theo ngữ cảnh tại máy.';
          if (data.type === 'result' && data.revision === revision) {
            onSuggestions(data.suggestions);
            status.textContent = 'Đã xét các mẫu lỗi được hỗ trợ tại máy. Bài phức tạp nên kiểm tra thêm bằng AI.';
          }
          const next = queued;
          queued = null;
          if (next?.revision === revision) send(next);
        };
        worker.onerror = fail;
        return true;
      } catch {
        fail();
        return false;
      }
    }

    function check(text, composing = false) {
      latest = text;
      revision += 1;
      clearTimeout(timer);
      queued = null;
      onSuggestions([]);
      if (!enabled || composing || !/\p{Script=Han}/u.test(text) || document.hidden) return;
      const job = {type: 'check', text, revision};
      timer = setTimeout(() => {
        if (!ensureWorker()) return;
        if (busy) queued = job;
        else send(job);
      }, delay);
    }

    toggle.addEventListener('click', () => {
      enabled = !enabled;
      update();
      if (!enabled) {
        stop();
        onSuggestions([]);
        status.textContent = 'Kiểm tra theo ngữ cảnh tại máy đã tắt.';
        return;
      }
      status.textContent = 'Đang mở model. Lần đầu cần tải khoảng 3 MB.';
      if (!ensureWorker()) return;
      send({type: 'load'});
      check(latest);
    });

    return {
      check,
      pause() {
        revision += 1;
        stop();
        if (enabled) status.textContent = 'Kiểm tra tại máy tạm dừng.';
      }
    };
  };
})();
