(() => {
  'use strict';

  const workerUrl = new URL('./sentence-onnx-worker.js', document.currentScript.src);
  const modelSize = 103137607;
  const backgroundGrace = 20000;

  window.HSKSentenceElectraTrial = function({panel, draft, onSuggestions}) {
    const pick = panel.querySelector('.sentence-electra-pick');
    const input = panel.querySelector('.sentence-electra-file');
    const run = panel.querySelector('.sentence-electra-run');
    const stop = panel.querySelector('.sentence-electra-stop');
    const status = panel.querySelector('.sentence-electra-status');

    let file = null;
    let worker = null;
    let ready = false;
    let timeout;
    let backgroundTimer;
    let snapshot = null;
    let revision = 0;

    function closeWorker() {
      clearTimeout(timeout);
      worker?.terminate();
      worker = null;
      ready = false;
      run.disabled = false;
    }

    function setSelectedFile(selected) {
      file = selected;
      pick.disabled = Boolean(file);
      run.hidden = !file;
      stop.hidden = !file;
    }

    function pause() {
      if (!worker) return;
      const wasRunning = run.disabled;
      closeWorker();
      if (wasRunning || snapshot !== draft.value) {
        status.textContent = 'Gói model vẫn được chọn. Bấm Kiểm tra bài này để tiếp tục.';
      }
    }

    function request(data, limit) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        closeWorker();
        status.textContent = 'Model xử lý quá lâu. Hãy thử đoạn ngắn hơn rồi bấm Kiểm tra bài này.';
      }, limit);
      worker.postMessage(data);
    }

    function runDetection() {
      if (!/\p{Script=Han}/u.test(draft.value)) {
        run.disabled = false;
        status.textContent = 'Nhập đoạn tiếng Trung cần thử.';
        return;
      }
      const text = draft.value;
      run.disabled = true;
      status.textContent = 'Đang kiểm tra bài này trên thiết bị…';
      request({type: 'detect', text, revision}, 45000);
    }

    function check() {
      if (!file || run.disabled) return;
      if (!/\p{Script=Han}/u.test(draft.value)) {
        status.textContent = 'Nhập đoạn tiếng Trung cần thử.';
        return;
      }
      if (ready) {
        runDetection();
        return;
      }
      let active;
      try {
        active = new Worker(workerUrl);
      } catch {
        status.textContent = 'Thiết bị chưa mở được model thử nghiệm.';
        return;
      }
      worker = active;
      run.disabled = true;
      status.textContent = 'Đang nạp model 103 MB…';
      active.onerror = () => {
        if (worker !== active) return;
        closeWorker();
        status.textContent = 'Không chạy được model 103 MB trên thiết bị này.';
      };
      active.onmessage = ({data}) => {
        if (worker !== active) return;
        clearTimeout(timeout);
        if (data.type === 'error') {
          const wasReady = ready;
          closeWorker();
          if (!wasReady) setSelectedFile(null);
          status.textContent = wasReady
            ? 'Model chưa kiểm tra xong. Hãy thử lại với đoạn ngắn hơn.'
            : 'Không nạp được model 103 MB. Hãy chọn lại đúng gói đã tải.';
          return;
        }
        if (data.type === 'detector-ready') {
          ready = true;
          runDetection();
        }
        if (data.type === 'detector-result') {
          run.disabled = false;
          if (data.revision !== revision) {
            status.textContent = 'Văn bản đã đổi. Bấm Kiểm tra bài này để xét bản mới.';
            return;
          }
          snapshot = draft.value;
          onSuggestions(data.suggestions);
          const result = data.suggestions.length
            ? data.suggestions.length + ' vị trí nghi vấn'
            : 'Chưa thấy vị trí nghi vấn';
          status.textContent = 'Model 103 MB · ' + result + ' · ' + data.elapsed + ' ms';
        }
      };
      request({type: 'load-detector', file}, 90000);
    }

    pick.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      const selected = input.files[0];
      input.value = '';
      if (!selected) return;
      if (selected.size !== modelSize) {
        status.textContent = 'Hãy chọn gói HSK_ELECTRA_INT8_Experimental.hskmodel.';
        return;
      }
      setSelectedFile(selected);
      check();
    });
    run.addEventListener('click', check);
    stop.addEventListener('click', () => {
      clearTimeout(backgroundTimer);
      closeWorker();
      setSelectedFile(null);
      snapshot = null;
      revision++;
      onSuggestions([]);
      status.textContent = 'Đã dừng model 103 MB.';
    });
    document.addEventListener('visibilitychange', () => {
      clearTimeout(backgroundTimer);
      if (document.hidden) backgroundTimer = setTimeout(pause, backgroundGrace);
    });
    window.addEventListener('pagehide', pause);

    return {
      invalidate() {
        if (!file || snapshot === draft.value && !run.disabled) return;
        revision++;
        snapshot = null;
        onSuggestions([]);
        if (!run.disabled) status.textContent = 'Bài đã đổi. Bấm Kiểm tra bài này để phân tích.';
      },
      pause
    };
  };
})();
