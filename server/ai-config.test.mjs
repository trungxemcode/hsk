import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);
const { validateTranslationConfig, loadTranslationConfig } = require('../src/utils/ai-config.js');

test('validateTranslationConfig accepts enabled https endpoint and rejects disabled or insecure configs', () => {
  const valid = { enabled: true, endpoint: 'https://worker.example/translate' };
  assert.deepEqual(validateTranslationConfig(valid), valid);
  assert.equal(validateTranslationConfig({ enabled: false, endpoint: 'https://worker.example/translate' }), null);
  assert.equal(validateTranslationConfig({ enabled: true, endpoint: 'http://worker.example/translate' }), null);
  assert.equal(validateTranslationConfig({ enabled: true, endpoint: 'javascript:alert(1)' }), null);
  assert.equal(validateTranslationConfig({ enabled: true, endpoint: 'not-a-url' }), null);
  assert.equal(validateTranslationConfig({ enabled: true, endpoint: 123 }), null);
  assert.equal(validateTranslationConfig({ enabled: true }), null);
  assert.equal(validateTranslationConfig(null), null);
});

test('loadTranslationConfig fetches ./translation-config.json with no-store and optional signal', async () => {
  const calls = [];
  const controller = new AbortController();
  const payload = { enabled: true, endpoint: 'https://ai.example/translate' };
  const result = await loadTranslationConfig({
    signal: controller.signal,
    fetchFn: async (url, init) => {
      calls.push({ url, init });
      return { ok: true, json: async () => payload };
    }
  });
  assert.deepEqual(result, payload);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, './translation-config.json');
  assert.equal(calls[0].init.cache, 'no-store');
  assert.equal(calls[0].init.signal, controller.signal);

  const callsNoSignal = [];
  const minimalMockResult = await loadTranslationConfig({
    fetchFn: async (url, init) => {
      callsNoSignal.push({ url, init });
      return { json: async () => payload };
    }
  });
  assert.deepEqual(minimalMockResult, payload);
  assert.deepEqual(callsNoSignal[0].init, { cache: 'no-store' });
});

test('loadTranslationConfig fails closed on HTTP error, network error, bad JSON, or invalid endpoint', async () => {
  assert.equal(await loadTranslationConfig({
    fetchFn: async () => ({ ok: false, json: async () => ({ enabled: true, endpoint: 'https://ai.example/translate' }) })
  }), null);
  assert.equal(await loadTranslationConfig({
    fetchFn: async () => { throw new Error('network down'); }
  }), null);
  assert.equal(await loadTranslationConfig({
    fetchFn: async () => ({ ok: true, json: async () => { throw new SyntaxError('bad json'); } })
  }), null);
  assert.equal(await loadTranslationConfig({
    fetchFn: async () => ({ ok: true, json: async () => ({ enabled: true, endpoint: 'http://insecure.example/translate' }) })
  }), null);
  assert.equal(await loadTranslationConfig({
    fetchFn: async () => ({ ok: true, json: async () => ({ enabled: false, endpoint: 'https://ai.example/translate' }) })
  }), null);
});

test('loadTranslationConfig binds default global fetch to window/globalThis and loads before module callers in index.html', async () => {
  const calls = [];
  const context = vm.createContext({ URL });
  const vmGlobal = vm.runInContext('this', context);
  context.window = vmGlobal;
  context.fetch = function (url, init) {
    assert.equal(this, vmGlobal);
    calls.push({ url, init });
    return Promise.resolve({
      ok: true,
      json: async () => ({ enabled: true, endpoint: 'https://vm.example/translate' })
    });
  };
  vm.runInContext(fs.readFileSync(new URL('src/utils/ai-config.js', root), 'utf8'), context);
  const loaded = await context.HSKAIConfig.loadTranslationConfig();
  assert.deepEqual(loaded, { enabled: true, endpoint: 'https://vm.example/translate' });
  assert.equal(calls.length, 1);

  const html = fs.readFileSync(new URL('index.html', root), 'utf8');
  const helperIdx = html.indexOf('./src/utils/ai-config.js');
  assert.ok(helperIdx > 0);
  for (const caller of [
    './src/modules/ai-coach/ai-qa.js',
    './src/modules/ai-coach/ai-teacher.js',
    './src/modules/handwriting/handwriting.js',
    './src/modules/notebook/notebook-factory.js',
    './src/modules/reading/real-reading.js',
    './loader.js'
  ]) {
    const callerIdx = html.indexOf(caller);
    assert.ok(callerIdx > helperIdx, `${caller} must load after ai-config.js`);
  }
});
