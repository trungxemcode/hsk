/* global HSKSentenceOnnxCore, ort */
'use strict';

importScripts('./sentence-onnx-core.js');

const vendor = new URL('../../../vendor/sentence-onnx/', self.location.href);
const packageCache = 'hsk-sentence-onnx-v1';
const packageFiles = {
  'ort.wasm.min.js': {type: 'text/javascript', sha256: '65e09376df69107e881b5c34d2d37aed333a366b6d941073ec518168e269b87d'},
  'ort-wasm-simd-threaded.mjs': {type: 'text/javascript', sha256: '3a4846dbad8a38a7a0911b81d82d28f0ee2f90f2004e16ed50a3ded018ef511a'},
  'ort-wasm-simd-threaded.wasm.gz': {type: 'application/octet-stream', sha256: '9cf52e49ca52218f91775fd6b5135e93cfba0feca0bac66703d54b85788f2d11'},
  'grammar-lite-v1.onnx': {type: 'application/octet-stream', sha256: 'c448779fa83ec062da768c01eead9b4a932c7aac4ffefb28270249a16f313010'}
};

let sessionPromise;
let busy = false;

async function loadPackage() {
  const cache = await self.caches?.open(packageCache).catch(() => null);
  const files = {};
  for (const [name, {type, sha256}] of Object.entries(packageFiles)) {
    const url = new URL(name, vendor);
    let response = await cache?.match(url).catch(() => null);
    const cached = Boolean(response);
    if (!response) response = await fetch(url);
    if (!response.ok) throw new Error('Model asset unavailable');
    const bytes = await response.arrayBuffer();
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
    const actual = Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
    if (actual !== sha256) throw new Error('Model asset integrity check failed');
    files[name] = new Blob([bytes], {type});
    if (!cached) await cache?.put(url, new Response(files[name])).catch(() => {});
  }
  return files;
}

async function createSession() {
  try {
    const files = await loadPackage();
    const script = URL.createObjectURL(files['ort.wasm.min.js']);
    const module = URL.createObjectURL(files['ort-wasm-simd-threaded.mjs']);
    try {
      importScripts(script);
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.wasmPaths = {mjs: module};
      const binary = files['ort-wasm-simd-threaded.wasm.gz'].stream()
        .pipeThrough(new DecompressionStream('gzip'));
      ort.env.wasm.wasmBinary = await new Response(binary).arrayBuffer();
      const model = await files['grammar-lite-v1.onnx'].arrayBuffer();
      return await ort.InferenceSession.create(model, {executionProviders: ['wasm']});
    } finally {
      URL.revokeObjectURL(script);
      URL.revokeObjectURL(module);
    }
  } catch (error) {
    await self.caches?.delete(packageCache).catch(() => {});
    throw error;
  }
}

self.onmessage = async ({data}) => {
  if (busy || !data || !['load', 'check'].includes(data.type)) return;
  busy = true;
  try {
    const session = await (sessionPromise ??= createSession());
    if (data.type === 'load') {
      self.postMessage({type: 'ready'});
      return;
    }
    const text = typeof data.text === 'string' ? data.text.slice(0, 500) : '';
    const core = HSKSentenceOnnxCore;
    const edits = core.candidates(text);
    let suggestions = [];
    if (edits.length) {
      const features = new Float32Array(edits.length * core.width);
      edits.forEach((edit, index) => core.features(text, edit, features, index * core.width));
      const outputs = await session.run({features: new ort.Tensor('float32', features, [edits.length, core.width])});
      try {
        suggestions = edits.filter((_, index) => outputs.accept.data[index] >= 0.85);
      } finally {
        outputs.accept.dispose();
      }
    }
    self.postMessage({type: 'result', revision: data.revision, suggestions});
  } catch {
    self.postMessage({type: 'error'});
  } finally {
    busy = false;
  }
};
