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
  return async samples => {
    const { text } = await recognizer(samples, {
      language: 'zh', task: 'transcribe', do_sample: false, max_new_tokens: 64
    });
    return typeof text === 'string' ? toSimplifiedChinese(text.trim()) : '';
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
