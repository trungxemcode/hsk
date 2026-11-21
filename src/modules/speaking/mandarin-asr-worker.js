'use strict';

let loading;

// Exact k2-fsa sherpa-onnx byte-level BPE mapping for bytes 127..255 (from sherpa-onnx/csrc/bbpe.cc).
const HIGH_BBPE = 'ĠġĢģĤĥĦħĨĩĪīĬĭĮįİıĴĵĶķĸĹĺĻļĽľŁłŃńŅņŇňŊŋŌōŎŏŐőŒœŔŕŖŗŘřŚśŜŝŞşŠšŢţŤťŦŧŨũŪūŬŭŮůŰűŲųŴŵŶŷŸŹźŻżŽžƀƁƂƃƄƅƆƇƈƉƊƋƌƍƎƏƐƑƒƓƔƕƖƗƘƙƚƛƜƝƞƟƠơƢƣƤƥƦ';

function createBbpeMap() {
  const map = new Map();
  for (let b = 0; b < 32; b++) map.set(String.fromCodePoint(256 + b), b);
  for (let b = 32; b <= 126; b++) map.set(String.fromCodePoint(b), b);
  for (let i = 0; i < HIGH_BBPE.length; i++) map.set(HIGH_BBPE[i], 127 + i);
  return map;
}

function createKaldiFbank() {
  const SR = 16000;
  const WIN = 400; // 25ms
  const SHIFT = 160; // 10ms
  const NFFT = 512;
  const NBINS = 80;

  const povey = new Float32Array(WIN);
  for (let i = 0; i < WIN; i++) {
    povey[i] = Math.pow(0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (WIN - 1)), 0.85);
  }

  const hzToMel = hz => 1127 * Math.log(1 + hz / 700);
  const lowMel = hzToMel(20);
  const highMel = hzToMel(7600); // sherpa-onnx default high_freq = -400 -> 8000 - 400
  const melStep = (highMel - lowMel) / (NBINS + 1);
  const fftBinWidth = SR / NFFT;
  const melFilters = [];
  for (let m = 0; m < NBINS; m++) {
    const left = lowMel + m * melStep;
    const center = lowMel + (m + 1) * melStep;
    const right = lowMel + (m + 2) * melStep;
    const entries = [];
    for (let k = 0; k <= NFFT / 2; k++) {
      const mel = hzToMel(k * fftBinWidth);
      let w = 0;
      if (mel > left && mel < center) w = (mel - left) / (center - left);
      else if (mel >= center && mel < right) w = (right - mel) / (right - center);
      if (w > 0) entries.push([k, w]);
    }
    melFilters.push(entries);
  }

  const bitRev = new Uint16Array(NFFT);
  for (let i = 0; i < NFFT; i++) {
    let x = i;
    let r = 0;
    for (let b = 0; b < 9; b++) {
      r = (r << 1) | (x & 1);
      x >>= 1;
    }
    bitRev[i] = r;
  }
  const cosTable = new Float32Array(NFFT / 2);
  const sinTable = new Float32Array(NFFT / 2);
  for (let i = 0; i < NFFT / 2; i++) {
    const a = (-2 * Math.PI * i) / NFFT;
    cosTable[i] = Math.cos(a);
    sinTable[i] = Math.sin(a);
  }

  function fft512(re, im) {
    for (let i = 0; i < NFFT; i++) {
      const j = bitRev[i];
      if (j > i) {
        let t = re[i]; re[i] = re[j]; re[j] = t;
        t = im[i]; im[i] = im[j]; im[j] = t;
      }
    }
    for (let size = 2; size <= NFFT; size <<= 1) {
      const half = size >> 1;
      const step = NFFT / size;
      for (let i = 0; i < NFFT; i += size) {
        for (let j = 0; j < half; j++) {
          const wr = cosTable[j * step];
          const wi = sinTable[j * step];
          const k = i + j;
          const l = k + half;
          const tr = wr * re[l] - wi * im[l];
          const ti = wr * im[l] + wi * re[l];
          re[l] = re[k] - tr;
          im[l] = im[k] - ti;
          re[k] += tr;
          im[k] += ti;
        }
      }
    }
  }

  return samples => {
    const n = samples.length;
    const numFrames = Math.max(1, Math.floor((n + SHIFT / 2) / SHIFT));
    const feats = new Float32Array(numFrames * NBINS);
    const frame = new Float32Array(WIN);
    const re = new Float32Array(NFFT);
    const im = new Float32Array(NFFT);
    const pow = new Float32Array(NFFT / 2 + 1);
    const getSample = idx => {
      if (idx < 0) return samples[Math.min(n - 1, -idx)];
      if (idx >= n) return samples[Math.max(0, 2 * n - 1 - idx)];
      return samples[idx];
    };

    for (let f = 0; f < numFrames; f++) {
      const start = f * SHIFT + Math.floor(SHIFT / 2) - Math.floor(WIN / 2);
      let mean = 0;
      for (let i = 0; i < WIN; i++) {
        const v = getSample(start + i);
        frame[i] = v;
        mean += v;
      }
      mean /= WIN;
      for (let i = 0; i < WIN; i++) frame[i] -= mean;
      for (let i = WIN - 1; i >= 1; i--) frame[i] -= 0.97 * frame[i - 1];
      frame[0] -= 0.97 * frame[0];

      re.fill(0);
      im.fill(0);
      for (let i = 0; i < WIN; i++) re[i] = frame[i] * povey[i];
      fft512(re, im);

      for (let k = 0; k <= NFFT / 2; k++) pow[k] = re[k] * re[k] + im[k] * im[k];
      const base = f * NBINS;
      for (let m = 0; m < NBINS; m++) {
        let energy = 0;
        const filter = melFilters[m];
        for (let j = 0; j < filter.length; j++) energy += pow[filter[j][0]] * filter[j][1];
        feats[base + m] = Math.log(Math.max(energy, 1.1920929e-7));
      }
    }
    return { feats, numFrames, featDim: NBINS };
  };
}

function decodeCtcTokens(ids, tokens, bbpeMap, utf8) {
  const bytes = [];
  for (let i = 0; i < ids.length; i++) {
    const tok = tokens[ids[i]] || '';
    if (!tok || tok.startsWith('<')) continue;
    for (const ch of tok) {
      if (ch === '▁') continue;
      const b = bbpeMap.get(ch);
      if (b !== undefined) bytes.push(b);
    }
  }
  return utf8.decode(new Uint8Array(bytes)).trim();
}

async function loadRecognizer(cacheName, config) {
  const cache = await caches.open(cacheName);
  const { assets } = config;
  const allowed = new Set(Object.values(assets).map(asset => asset.url));
  const fetchBlob = self.fetch.bind(self);
  self.fetch = async (input, options) => {
    const requested = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    if (requested.protocol === 'blob:') return fetchBlob(input, options);
    if (allowed.has(requested.href)) {
      return (await cache.match(requested.href)) || new Response(null, { status: 404 });
    }
    throw Error('Unrecognized recognition asset');
  };

  async function matchAsset(asset) {
    const response = asset?.url ? await cache.match(asset.url) : null;
    if (!response) throw Error('Missing recognition asset');
    return response;
  }

  async function blobUrl(asset) {
    const response = await matchAsset(asset);
    return URL.createObjectURL(await response.blob());
  }

  const [runtimeUrl, mjsUrl, wasmUrl] = await Promise.all([
    blobUrl(assets.runtime),
    blobUrl(assets.module),
    blobUrl(assets.wasm)
  ]);
  const [modelRes, tokensRes] = await Promise.all([
    matchAsset(assets.model),
    matchAsset(assets.tokens)
  ]);

  const ort = await import(runtimeUrl);
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.proxy = false;
  ort.env.wasm.wasmPaths = { mjs: mjsUrl, wasm: wasmUrl };

  const tokensText = await tokensRes.text();
  const tokens = tokensText.trim().split('\n').map(line => line.trim().split(/\s+/)[0] || '');
  let modelBytes = new Uint8Array(await modelRes.arrayBuffer());
  const session = await ort.InferenceSession.create(modelBytes, {
    executionProviders: ['wasm'],
    logSeverityLevel: 3
  });
  modelBytes = null;

  const computeFbank = createKaldiFbank();
  const bbpeMap = createBbpeMap();
  const utf8 = new TextDecoder('utf-8', { fatal: false });

  return async samples => {
    if (!samples || !samples.length) return '';
    const padSamples = 4800; // 300ms silence padding at 16kHz gives clean onset/offset context for short words.
    const padded = new Float32Array(samples.length + padSamples * 2);
    padded.set(samples, padSamples);
    const { feats, numFrames, featDim } = computeFbank(padded);
    const x = new ort.Tensor('float32', feats, [1, numFrames, featDim]);
    const xLens = new ort.Tensor('int64', BigInt64Array.from([BigInt(numFrames)]), [1]);
    let out = null;
    try {
      out = await session.run({ x, x_lens: xLens });
      const logits = out.log_probs.data;
      const outLen = Number(out.log_probs_len.data[0]);
      const vocab = out.log_probs.dims[2];
      const ids = [];
      let prev = -1;
      for (let t = 0; t < outLen; t++) {
        let best = 0;
        let bestVal = -Infinity;
        const off = t * vocab;
        for (let v = 0; v < vocab; v++) {
          const score = logits[off + v];
          if (score > bestVal) {
            bestVal = score;
            best = v;
          }
        }
        if (best !== prev && best !== 0 && best !== 1 && best !== 2) ids.push(best);
        prev = best;
      }
      return decodeCtcTokens(ids, tokens, bbpeMap, utf8);
    } finally {
      try { x.dispose?.(); } catch {}
      try { xLens.dispose?.(); } catch {}
      try { out?.log_probs?.dispose?.(); } catch {}
      try { out?.log_probs_len?.dispose?.(); } catch {}
    }
  };
}

if (typeof self !== 'undefined') {
  self.onmessage = async ({ data: { cacheName, config, samples } }) => {
    try {
      if (!loading) {
        loading = loadRecognizer(cacheName, config).catch(err => {
          loading = null;
          throw err;
        });
      }
      const recognizer = await loading;
      self.postMessage({ transcript: await recognizer(samples) });
    } catch {
      self.postMessage({ error: true });
    }
  };
}
