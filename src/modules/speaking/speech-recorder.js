/* Shared Web Audio microphone recorder (PCM Float32 + 16kHz mono WAV + optional browser SpeechRecognition)
   with IndexedDB local cache and clean Playwright mock provider support. */
(function (root) {
  'use strict';

  const DB_NAME = 'hsk-speaking-v1';
  const STORE_NAME = 'recordings';
  const MAX_RECORDINGS = 25;

  let activeSession = null;
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
        tx.oncomplete = () => { db.close(); resolve(true); };
        tx.onerror = () => { db.close(); resolve(false); };
      } catch {
        db.close();
        resolve(false);
      }
    });
  }

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

  function buildResult(pcm, sampleRate, durationMs, transcript, recognitionSupported) {
    const core = root.HSKPitchCore;
    const wavBytes = core ? core.encodeWav16k(pcm, sampleRate) : new Uint8Array(44);
    const wavBlob = new Blob([wavBytes], { type: 'audio/wav' });
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

    let stream;
    try {
      stream = await root.navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1
        }
      });
    } catch (err) {
      throw friendlyMicError(err);
    }

    const ctx = new AC();
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(2048, 1, 1);
    const silentGain = ctx.createGain();
    silentGain.gain.value = 0;

    const chunks = [];
    let totalSamples = 0;
    const startedAt = Date.now();
    let stopped = false;

    // Parallel browser ASR (Mandarin) when available; audio pitch evaluation stays 100% independent.
    const Recog = root.SpeechRecognition || root.webkitSpeechRecognition;
    let recognition = null;
    let finalTranscript = '';
    let interimTranscript = '';
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
          interimTranscript = intr;
          onTranscript((finalTranscript + interimTranscript).trim(), false);
        };
        recognition.onerror = () => {};
        recognition.start();
      } catch {
        recognition = null;
      }
    }

    processor.onaudioprocess = event => {
      if (stopped) return;
      const input = event.inputBuffer.getChannelData(0);
      const copy = new Float32Array(input.length);
      copy.set(input);
      chunks.push(copy);
      totalSamples += copy.length;
      let sq = 0;
      for (let i = 0; i < copy.length; i++) sq += copy[i] * copy[i];
      const rms = Math.sqrt(sq / copy.length);
      onLevel(rms, Date.now() - startedAt);
    };

    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(ctx.destination);

    let maxTimer = setTimeout(() => {
      session.stop().then(res => { if (res) onAutoStop(res); }).catch(() => {});
    }, maxMs);

    function teardownAudio() {
      clearTimeout(maxTimer);
      try { processor.disconnect(); } catch {}
      try { source.disconnect(); } catch {}
      try { silentGain.disconnect(); } catch {}
      try { stream.getTracks().forEach(t => t.stop()); } catch {}
      try { ctx.close().catch(() => {}); } catch {}
    }

    const session = {
      async stop() {
        if (stopped) return null;
        stopped = true;
        if (activeSession === session) activeSession = null;
        const durationMs = Date.now() - startedAt;
        const sampleRate = ctx.sampleRate || 16000;
        teardownAudio();

        if (recognition) {
          await new Promise(resolve => {
            let settled = false;
            const finish = () => { if (!settled) { settled = true; resolve(); } };
            const t = setTimeout(finish, 450);
            recognition.onend = () => { clearTimeout(t); finish(); };
            try { recognition.stop(); } catch { clearTimeout(t); finish(); }
          });
        }

        const pcm = concatFloat32(chunks, totalSamples);
        const transcript = (finalTranscript + interimTranscript).trim();
        if (transcript) onTranscript(transcript, true);
        return buildResult(pcm, sampleRate, durationMs, transcript, Boolean(Recog));
      },
      async cancel() {
        if (stopped) return;
        stopped = true;
        if (activeSession === session) activeSession = null;
        teardownAudio();
        try { recognition?.abort?.(); } catch {}
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
    stopActive: () => activeSession?.cancel?.()
  };

  root.HSKRecorder = api;
  root.addEventListener?.('pagehide', () => { activeSession?.cancel?.(); });
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window === 'object' ? window : globalThis);
