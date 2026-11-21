'use strict';

let loading;

async function loadRecognizer(cacheName, config) {
  const cache = await caches.open(cacheName);
  const { assets } = config;
  const allowed = new Set(Object.values(assets).map(asset => asset.url));
  const fetchBlob = self.fetch.bind(self);
  const modelBase = `https://huggingface.co/${config.model}/resolve/${config.revision}/`;
  self.fetch = async (input, options) => {
    const requested = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    if (requested.protocol === 'blob:') return fetchBlob(input, options);
    if (allowed.has(requested.href)) {
      return (await cache.match(requested.href)) || new Response(null, { status: 404 });
    }
    // Optional model files are probed by the runtime. Never fetch missing files from the network.
    if (requested.href.startsWith(modelBase)) return new Response(null, { status: 404 });
    throw Error('Unrecognized recognition asset');
  };

  async function blobUrl(asset) {
    const response = await cache.match(asset.url);
    if (!response) throw Error('Missing recognition asset');
    return URL.createObjectURL(await response.blob());
  }

  const urls = [];
  for (const asset of [assets.runtime, assets.module, assets.wasm, assets.normalizer]) urls.push(await blobUrl(asset));
  const [runtime, mjs, wasm, normalizer] = urls;
  const { env, pipeline } = await import(runtime);
  const { Converter } = await import(normalizer);
  const toSimplifiedChinese = Converter({ from: 't', to: 'cn' });
  env.allowLocalModels = false;
  env.useBrowserCache = false;
  env.backends.onnx.wasm.numThreads = 1;
  env.backends.onnx.wasm.proxy = false;
  env.backends.onnx.wasm.wasmPaths = { mjs, wasm };
  const recognizer = await pipeline('automatic-speech-recognition', config.model, {
    revision: config.revision,
    device: 'wasm',
    dtype: 'q8'
  });
  const decodeText = async audio => {
    const out = await recognizer(audio, {
      language: 'zh',
      task: 'transcribe',
      do_sample: false,
      condition_on_prev_tokens: false,
      max_new_tokens: 64
    });
    return typeof out?.text === 'string' ? toSimplifiedChinese(out.text.trim()) : '';
  };
  return async samples => {
    const padSamples = 5600; // 350ms silence padding at 16kHz reduces STFT boundary distortion on short words.
    const padded = new Float32Array(samples.length + padSamples * 2);
    padded.set(samples, padSamples);
    let transcript = await decodeText(padded);
    if (!/\p{Script=Han}/u.test(transcript) && samples.length >= 1600 && samples.length <= 48000) {
      // Short 1-2 syllable clips can hit Whisper's early <|endoftext|> bias against 29s of zero-padding;
      // repeat once with a 180ms pause so decoder cross-attention locks onto Mandarin articulation.
      const gap = 2880;
      const doubled = new Float32Array(padSamples + samples.length + gap + samples.length + padSamples);
      doubled.set(samples, padSamples);
      doubled.set(samples, padSamples + samples.length + gap);
      const retry = await decodeText(doubled);
      if (/\p{Script=Han}/u.test(retry)) {
        const chars = Array.from(retry).filter(c => /\p{Script=Han}/u.test(c));
        const half = Math.ceil(chars.length / 2);
        const firstHalf = chars.slice(0, half).join('');
        const secondHalf = chars.slice(half).join('');
        transcript = firstHalf && secondHalf && firstHalf === secondHalf ? firstHalf : retry;
      }
    }
    return transcript;
  };
}

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
