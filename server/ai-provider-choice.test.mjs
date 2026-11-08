import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeAiProviderChoice,aiProviderChoiceError,describeAiProviders} from './ai-provider-choice.mjs';

test('normalizeAiProviderChoice defaults to auto and rejects unknown values',()=>{
  assert.equal(normalizeAiProviderChoice(undefined),'auto');
  assert.equal(normalizeAiProviderChoice(''),'auto');
  for(const v of ['auto','system-gemini','system-chatgpt','personal'])assert.equal(normalizeAiProviderChoice(v),v);
  for(const v of ['claude','x',1,{},[]])assert.equal(normalizeAiProviderChoice(v),null);
});

test('aiProviderChoiceError blocks unavailable providers only',()=>{
  assert.equal(aiProviderChoiceError('auto'),null);
  assert.match(aiProviderChoiceError('personal',{}),/API riêng/);
  assert.equal(aiProviderChoiceError('personal',{personalEnabled:true}),null);
  assert.match(aiProviderChoiceError('system-chatgpt',{}),/ChatGPT/);
  assert.equal(aiProviderChoiceError('system-chatgpt',{sharedCookieReady:true}),null);
  assert.match(aiProviderChoiceError('system-gemini',{}),/Gemini/);
  assert.equal(aiProviderChoiceError('system-gemini',{geminiReady:true}),null);
});

test('describeAiProviders exposes availability without secrets',()=>{
  const out=describeAiProviders({geminiReady:true,sharedCookieReady:false,personal:{configured:true,enabled:true,provider:'claude',model:'claude-x',apiKey:'secret-key'}});
  assert.deepEqual(out,{system:{gemini:{available:true},chatgpt:{available:false}},personal:{configured:true,enabled:true,provider:'claude',model:'claude-x'}});
  assert.ok(!JSON.stringify(out).includes('secret'));
  assert.deepEqual(describeAiProviders().personal,{configured:false,enabled:false,provider:null,model:null});
  assert.equal(describeAiProviders({personal:{configured:true,enabled:true,provider:'evil'}}).personal.provider,null);
});
