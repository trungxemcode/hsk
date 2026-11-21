/* Shared Web Audio microphone recorder (PCM Float32 + 16kHz mono WAV + optional browser SpeechRecognition)
   with IndexedDB local cache and clean Playwright mock provider support. */
(function (root) {
  'use strict';

  const DB_NAME = 'hsk-speaking-v1';
  const STORE_NAME = 'recordings';
  const MAX_RECORDINGS = 25;

  let activeSession = null;
  let openingMicrophone = false;
  let mockProvider = null;

  function openDb() {
    if (!root.indexedDB) return Promise.resolve(null);
    return new Promise(resolve => {
      try {
        const req = root.indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async function saveRecording(record) {
    const db = await openDb();
    if (!db || !record || !record.text) return null;
    const item = {
      id: record.id || `${record.text}::${Date.now()}`,
      text: String(record.text),
      pinyin: String(record.pinyin || ''),
      overallScore: Number(record.overallScore || 0),
      transcript: String(record.transcript || ''),
      durationMs: Number(record.durationMs || 0),
      wavBlob: record.wavBlob || null,
      updatedAt: Date.now()
    };
    return new Promise(resolve => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(item);
        const allReq = store.getAll();
        allReq.onsuccess = () => {
          const list = Array.isArray(allReq.result) ? allReq.result : [];
          if (list.length > MAX_RECORDINGS) {
            list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
            for (const stale of list.slice(MAX_RECORDINGS)) {
              store.delete(stale.id);
            }
          }
        };
        tx.oncomplete = () => { db.close(); resolve(item); };
        tx.onerror = () => { db.close(); resolve(null); };
      } catch {
        db.close();
        resolve(null);
      }
    });
  }

  async function listRecordings(text = '') {
    const db = await openDb();
    if (!db) return [];
    return new Promise(resolve => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => {
          const rows = Array.isArray(req.result) ? req.result : [];
          const filtered = text ? rows.filter(r => r.text === text) : rows;
          filtered.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          db.close();
          resolve(filtered);
        };
        req.onerror = () => { db.close(); resolve([]); };
      } catch {
        db.close();
        resolve([]);
      }
    });
  }

  async function clearRecordings() {
    const db = await openDb();
    if (!db) return false;
    return new Promise(resolve => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => {
          db.close();
          root.dispatchEvent?.(new CustomEvent('hsk-speaking-pack-changed'));
          resolve(true);
        };
        tx.onerror = () => { db.close(); resolve(false); };
      } catch {
        db.close();
        resolve(false);
      }
    });
  }

  async function usage() {
    const db = await openDb();
    if (!db) return 0;
    return new Promise(resolve => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => {
          const rows = Array.isArray(req.result) ? req.result : [];
          const total = rows.reduce((n, r) => n + (r.wavBlob?.size || 0), 0);
          db.close();
          resolve(total);
        };
        req.onerror = () => { db.close(); resolve(0); };
      } catch {
        db.close();
        resolve(0);
      }
    });
  }

  const OFFLINE_ASR_CACHE = 'hsk-speaking-asr-offline-v1';
  const ALLOWED_ASSET_HOSTS = ['huggingface.co', 'cdn.jsdelivr.net'];
  let packAbort = null;

  function emitPackChanged(detail = {}) {
    try { root.dispatchEvent?.(new CustomEvent('hsk-speaking-pack-changed', { detail })); } catch {}
  }

  function createOfflinePackManager() {
    async function downloaded() {
      if (!root.caches) return { installed: false, bytes: 0, busy: Boolean(packAbort) };
      try {
        const has = await root.caches.has(OFFLINE_ASR_CACHE);
        if (!has) return { installed: false, bytes: 0, busy: Boolean(packAbort) };
        const cache = await root.caches.open(OFFLINE_ASR_CACHE);
        const keys = await cache.keys();
        let bytes = 0;
        for (const req of keys) {
          const res = await cache.match(req);
          if (!res || res.type === 'opaque') continue;
          const cl = Number(res.headers.get('Content-Length'));
          if (Number.isFinite(cl) && cl > 0) bytes += cl;
          else bytes += (await res.arrayBuffer()).byteLength;
        }
        return { installed: keys.length > 0 && bytes > 0, bytes, busy: Boolean(packAbort) };
      } catch {
        return { installed: false, bytes: 0, busy: Boolean(packAbort) };
      }
    }

    function cancelInstall() {
      if (packAbort) {
        packAbort.abort();
        packAbort = null;
        emitPackChanged({ installing: false });
      }
    }

    async function install(onProgress = () => {}) {
      if (!root.caches || !root.crypto?.subtle) {
        throw Error('Trình duyệt chưa hỗ trợ kho lưu trữ gói ngoại tuyến.');
      }
      cancelInstall();
      const controller = new AbortController();
      packAbort = controller;
      emitPackChanged({ installing: true });

      try {
        const cfgRes = await fetch('./speaking-asr-config.json', { cache: 'no-store', signal: controller.signal });
        if (!cfgRes.ok) throw Error('Không tải được cấu hình gói nhận diện offline.');
        const cfg = await cfgRes.json();
        const assets = Object.entries(cfg.assets || {});
        if (!assets.length) throw Error('Cấu hình gói nhận diện trống.');

        const cache = await root.caches.open(OFFLINE_ASR_CACHE);
        const total = assets.reduce((sum, [, a]) => sum + Number(a?.bytes || 0), 0);
        let loaded = 0;
        onProgress({ phase: 'download', loaded: 0, total });

        for (const [name, asset] of assets) {
          if (controller.signal.aborted) throw new DOMException('Đã hủy.', 'AbortError');
          if (!asset || typeof asset.url !== 'string' || !/^[a-f0-9]{64}$/.test(asset.sha256) || !Number.isSafeInteger(asset.bytes) || asset.bytes <= 0 || asset.bytes > 80 * 1024 * 1024) {
            throw Error('Cấu hình tệp nhận diện không hợp lệ.');
          }
          const parsed = new URL(asset.url, root.location?.href || 'https://example.com');
          if (parsed.protocol !== 'https:' || !ALLOWED_ASSET_HOSTS.includes(parsed.hostname)) {
            throw Error('Nguồn tải gói nhận diện không nằm trong danh sách cho phép.');
          }

          let cachedBytes = null;
          const hit = await cache.match(asset.url);
          if (hit && hit.type !== 'opaque') {
            const buf = await hit.arrayBuffer();
            const digest = Array.from(new Uint8Array(await root.crypto.subtle.digest('SHA-256', buf)), b => b.toString(16).padStart(2, '0')).join('');
            if (buf.byteLength === asset.bytes && digest === asset.sha256) cachedBytes = buf;
            else await cache.delete(asset.url);
          }

          if (!cachedBytes) {
            const res = await fetch(asset.url, { cache: 'no-store', signal: controller.signal });
            if (!res.ok || res.type === 'opaque') throw Error(`Không tải được thành phần ${name}.`);
            const buf = await res.arrayBuffer();
            if (buf.byteLength !== asset.bytes) throw Error(`Dung lượng thành phần ${name} không khớp.`);
            const digest = Array.from(new Uint8Array(await root.crypto.subtle.digest('SHA-256', buf)), b => b.toString(16).padStart(2, '0')).join('');
            if (digest !== asset.sha256) throw Error(`Mã kiểm tra SHA-256 thành phần ${name} không khớp.`);
            await cache.put(asset.url, new Response(buf, { headers: { 'Content-Type': asset.type || 'application/octet-stream', 'Content-Length': String(buf.byteLength) } }));
          }

          loaded += asset.bytes;
          onProgress({ phase: 'download', loaded, total, name });
        }

        const status = await downloaded();
        onProgress({ phase: 'done', loaded: total, total });
        emitPackChanged({ installed: status.installed, bytes: status.bytes });
        return status;
      } finally {
        if (packAbort === controller) packAbort = null;
        emitPackChanged();
      }
    }

    async function remove() {
      cancelInstall();
      if (!root.caches) return { installed: false, bytes: 0 };
      try {
        await root.caches.delete(OFFLINE_ASR_CACHE);
      } catch {}
      emitPackChanged({ installed: false, bytes: 0 });
      return { installed: false, bytes: 0 };
    }

    return {
      CACHE_NAME: OFFLINE_ASR_CACHE,
      get busy() { return Boolean(packAbort); },
      downloaded,
      install,
      cancelInstall,
      remove
    };
  }

  const offlinePack = createOfflinePackManager();
  root.HSKSpeakingOfflinePack = offlinePack;
  root.addEventListener?.('hsk-storage-cleaned', event => {
    const pkgs = event?.detail?.packages;
    if (Array.isArray(pkgs) && (pkgs.includes(OFFLINE_ASR_CACHE) || pkgs.includes('speaking-recordings'))) {
      emitPackChanged();
    }
  });

  function silenceOtherAudio() {
    try { root.HSKSpeech?.stop?.(); } catch {}
    try {
      for (const el of document.querySelectorAll('audio')) {
        if (!el.paused) el.pause();
      }
    } catch {}
  }

  function friendlyMicError(err) {
    const name = err?.name || '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return Error('Bạn chưa cấp quyền Micro. Hãy cho phép quyền Micro trong cài đặt trình duyệt rồi thử lại.');
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return Error('Không tìm thấy thiết bị Micro trên máy này.');
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return Error('Micro đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng kia rồi thử lại.');
    }
    return Error(err?.message || 'Không khởi động được Micro trên trình duyệt này.');
  }

  function concatFloat32(chunks, totalLen) {
    const merged = new Float32Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    return merged;
  }

  function buildResult(pcm, sampleRate, durationMs, transcript, recognitionSupported, backupBlob = null) {
    const core = root.HSKPitchCore;
    const wavBytes = core ? core.encodeWav16k(pcm, sampleRate) : new Uint8Array(44);
    const wavBlob = backupBlob || new Blob([wavBytes], { type: 'audio/wav' });
    return {
      pcm,
      sampleRate,
      wavBytes,
      wavBlob,
      durationMs,
      transcript: String(transcript || '').trim(),
      recognitionSupported: Boolean(recognitionSupported)
    };
  }

  function createBackupCapture(stream) {
    if (!root.MediaRecorder) return null;
    try {
      const recorder = new root.MediaRecorder(stream);
      const chunks = [];
      const finished = new Promise(resolve => {
        recorder.ondataavailable = event => { if (event.data?.size) chunks.push(event.data); };
        recorder.onstop = () => resolve(chunks.length ? new Blob(chunks, { type: recorder.mimeType || chunks[0].type }) : null);
      });
      recorder.start();
      return {
        stop() {
          try { if (recorder.state !== 'inactive') recorder.stop(); } catch { return Promise.resolve(null); }
          return new Promise(resolve => {
            const timeout = setTimeout(() => resolve(null), 1200);
            finished.then(blob => { clearTimeout(timeout); resolve(blob); });
          });
        }
      };
    } catch {
      return null;
    }
  }

  function isSupported() {
    if (mockProvider) return true;
    const AC = root.AudioContext || root.webkitAudioContext;
    return Boolean(root.navigator?.mediaDevices?.getUserMedia && AC);
  }

  function isRecognitionSupported() {
    if (mockProvider) return true;
    return Boolean(root.SpeechRecognition || root.webkitSpeechRecognition);
  }

  function setMockProvider(fn) {
    mockProvider = typeof fn === 'function' ? fn : null;
  }

  async function start(opts = {}) {
    if (openingMicrophone) throw Error('Micro đang khởi động. Hãy đợi rồi thử lại.');
    openingMicrophone = true;
    try {
      return await startCapture(opts);
    } finally {
      openingMicrophone = false;
    }
  }

  async function startCapture(opts) {
    if (activeSession) {
      await activeSession.cancel().catch(() => {});
    }
    silenceOtherAudio();

    const maxMs = Math.max(2500, Math.min(180000, Number(opts.maxMs) || 15000));
    const onLevel = typeof opts.onLevel === 'function' ? opts.onLevel : () => {};
    const onTranscript = typeof opts.onTranscript === 'function' ? opts.onTranscript : () => {};
    const onAutoStop = typeof opts.onAutoStop === 'function' ? opts.onAutoStop : () => {};

    if (mockProvider) {
      let stopped = false;
      let startAt = Date.now();
      let timer = setTimeout(() => session.stop().then(onAutoStop).catch(() => {}), maxMs);
      let ticker = setInterval(() => {
        if (!stopped) onLevel(0.28 + Math.random() * 0.2, Date.now() - startAt);
      }, 90);
      const mockData = await Promise.resolve(mockProvider(opts));
      const session = {
        async stop() {
          if (stopped) return null;
          stopped = true;
          clearTimeout(timer);
          clearInterval(ticker);
          if (activeSession === session) activeSession = null;
          const sr = mockData?.sampleRate || 16000;
          const pcm = mockData?.pcm instanceof Float32Array ? mockData.pcm : new Float32Array(mockData?.pcm || 0);
          const transcript = String(mockData?.transcript || '');
          if (transcript) onTranscript(transcript, true);
          const dur = mockData?.durationMs || Math.round((pcm.length / sr) * 1000);
          return buildResult(pcm, sr, dur, transcript, mockData?.recognitionSupported ?? true);
        },
        async cancel() {
          if (stopped) return;
          stopped = true;
          clearTimeout(timer);
          clearInterval(ticker);
          if (activeSession === session) activeSession = null;
        }
      };
      activeSession = session;
      return session;
    }

    const AC = root.AudioContext || root.webkitAudioContext;
    if (!root.navigator?.mediaDevices?.getUserMedia || !AC) {
      throw Error('Trình duyệt hiện chưa hỗ trợ thu âm qua Web Audio API.');
    }

    const ctx = new AC();
    const audioSession = root.navigator.audioSession;
    const previousAudioType = audioSession?.type;
    try { if (audioSession) audioSession.type = 'play-and-record'; } catch {}
    if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
      void ctx.resume().catch(() => {});
    }
    const releaseContext = () => {
      try { ctx.close().catch(() => {}); } catch {}
      try { if (audioSession?.type === 'play-and-record') audioSession.type = previousAudioType; } catch {}
    };
    let stream;
    try {
      stream = await root.navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      });
    } catch (err) {
      releaseContext();
      throw friendlyMicError(err);
    }

    const backup = createBackupCapture(stream);
    let source;
    let processor;
    let silentGain;
    try {
      source = ctx.createMediaStreamSource(stream);
      processor = ctx.createScriptProcessor(2048, 1, 1);
      silentGain = ctx.createGain();
      silentGain.gain.value = 0;
      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(ctx.destination);
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') void ctx.resume().catch(() => {});
    } catch (err) {
      if (!backup) {
        stream.getTracks().forEach(track => track.stop());
        releaseContext();
        throw friendlyMicError(err);
      }
    }

    const chunks = [];
    let totalSamples = 0;
    const startedAt = Date.now();
    let stopped = false;
    const autoSilenceMs = opts.autoSilenceMs === 0 ? 0 : Math.max(650, Number(opts.autoSilenceMs) || 950);
    let noiseFloor = 0.001;
    let peakRms = 0;
    let capturePeakRms = 0;
    let hasSpoken = false;
    let lastSpeechAt = 0;
    let autoStopped = false;

    // Parallel browser ASR (Mandarin) when available; audio pitch evaluation stays 100% independent.
    const Recog = root.SpeechRecognition || root.webkitSpeechRecognition;
    let recognition = null;
    let recognitionEnded = false;
    let resolveRecognitionStop;
    let finalTranscript = '';
    if (Recog) {
      try {
        recognition = new Recog();
        recognition.lang = opts.lang || 'zh-CN';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.onresult = event => {
          let fin = '';
          let intr = '';
          for (let i = 0; i < event.results.length; i++) {
            const res = event.results[i];
            const txt = res[0]?.transcript || '';
            if (res.isFinal) fin += txt;
            else intr += txt;
          }
          finalTranscript = fin;
          onTranscript((fin + intr).trim(), false);
        };
        recognition.onend = () => {
          recognitionEnded = true;
          resolveRecognitionStop?.();
        };
        recognition.start();
      } catch {
        recognition = null;
      }
    }

    if (processor) processor.onaudioprocess = event => {
      if (stopped) return;
      const input = event.inputBuffer.getChannelData(0);
      const copy = new Float32Array(input.length);
      copy.set(input);
      chunks.push(copy);
      totalSamples += copy.length;
      let sq = 0;
      for (let i = 0; i < copy.length; i++) sq += copy[i] * copy[i];
      const rms = Math.sqrt(sq / copy.length);
      capturePeakRms = Math.max(capturePeakRms, rms);
      const now = Date.now();
      const elapsed = now - startedAt;

      const core = root.HSKPitchCore;
      const clarity = core?.quickVoicedClarity ? core.quickVoicedClarity(copy, ctx.sampleRate || 16000) : 1;
      if (clarity < 0.45) {
        noiseFloor = Math.min(0.08, noiseFloor * 0.75 + rms * 0.25);
      }
      if (clarity >= 0.54 && rms > peakRms) peakRms = rms;

      const gate = Math.max(0.0018, noiseFloor * 1.6, peakRms * 0.16);
      const isVoicedFrame = rms >= gate && clarity >= 0.56;
      if (isVoicedFrame) {
        hasSpoken = true;
        lastSpeechAt = now;
      }
      onLevel(isVoicedFrame ? rms : Math.min(rms * 0.35, noiseFloor), elapsed);
      if (autoSilenceMs > 0 && !autoStopped && hasSpoken && elapsed >= 1500 && now - lastSpeechAt >= autoSilenceMs) {
        autoStopped = true;
        session.stop().then(res => { if (res) onAutoStop(res); }).catch(() => {});
      }
    };

    const maxTimer = setTimeout(() => {
      session.stop().then(res => { if (res) onAutoStop(res); }).catch(() => {});
    }, maxMs);

    function teardownAudio() {
      clearTimeout(maxTimer);
      try { processor?.disconnect(); } catch {}
      try { source?.disconnect(); } catch {}
      try { silentGain?.disconnect(); } catch {}
      try { stream.getTracks().forEach(t => t.stop()); } catch {}
      releaseContext();
    }

    let resolveTeardown;
    const teardownDone = new Promise(resolve => { resolveTeardown = resolve; });
    const session = {
      async stop() {
        if (stopped) return null;
        stopped = true;
        clearTimeout(maxTimer);
        const durationMs = Date.now() - startedAt;
        let sampleRate = ctx.sampleRate || 16000;
        const pcmDurationMs = totalSamples / sampleRate * 1000;
        const needsBackup = capturePeakRms < 0.0008 || pcmDurationMs < durationMs * 0.7;
        const backupResult = backup?.stop();
        let pcm = concatFloat32(chunks, totalSamples);
        let backupBlob = null;

        const finalizeTranscript = recognition && !recognitionEnded
          ? new Promise(resolve => {
            const timeout = setTimeout(() => {
              resolveRecognitionStop?.();
              try { recognition.abort(); } catch {}
            }, 1800);
            resolveRecognitionStop = () => {
              clearTimeout(timeout);
              resolveRecognitionStop = undefined;
              resolve();
            };
            try { recognition.stop(); } catch { resolveRecognitionStop?.(); }
          }) : null;
        try {
          if (needsBackup) {
            backupBlob = await backupResult;
            if (backupBlob) {
              try {
                const decoded = await ctx.decodeAudioData(await backupBlob.arrayBuffer());
                pcm = decoded.getChannelData(0);
                sampleRate = decoded.sampleRate;
                backupBlob = null;
              } catch {}
            }
          }
          await finalizeTranscript;
          const transcript = finalTranscript.trim();
          if (transcript) onTranscript(transcript, true);
          return buildResult(pcm, sampleRate, durationMs, transcript, Boolean(recognition), backupBlob);
        } finally {
          if (recognition) recognition.onresult = null;
          teardownAudio();
          if (activeSession === session) activeSession = null;
          resolveTeardown();
        }
      },
      async cancel() {
        if (stopped) return teardownDone;
        stopped = true;
        if (activeSession === session) activeSession = null;
        void backup?.stop();
        teardownAudio();
        try { recognition?.abort?.(); } catch {}
        resolveTeardown();
      }
    };

    activeSession = session;
    return session;
  }

  const api = {
    isSupported,
    isRecognitionSupported,
    start,
    setMockProvider,
    saveRecording,
    listRecordings,
    clearRecordings,
    usage,
    offlinePack,
    stopActive: () => activeSession?.cancel?.()
  };

  root.HSKRecorder = api;
  root.addEventListener?.('pagehide', () => { activeSession?.cancel?.(); });
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window === 'object' ? window : globalThis);
