import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeAiProviderChoice,aiProviderChoiceError,describeAiProviders} from './ai-provider-choice.mjs';
import {extractChatGptPlanType,probeChatGptCookieAccount} from './chatgpt-cookie.mjs';

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
  const plusOut=describeAiProviders({geminiReady:true,sharedCookieReady:true,personal:{configured:true,enabled:true,provider:'chatgpt-cookie',model:'gpt-6',planType:'plus',models:['gpt-6-instant','gpt-6','gpt-6-thinking','gpt-5-6']}});
  assert.equal(plusOut.personal.planType,'plus');
  assert.deepEqual(plusOut.personal.models,['gpt-6-instant','gpt-6','gpt-6-thinking','gpt-5-6']);
});

test('extractChatGptPlanType and probeChatGptCookieAccount detect Plus vs Free and models',async()=>{
  const plusJwtPayload=Buffer.from(JSON.stringify({'https://api.openai.com/auth':{chatgpt_plan_type:'plus'}})).toString('base64url');
  assert.equal(extractChatGptPlanType({accessToken:`eyJ.${plusJwtPayload}.sig`}),'plus');
  assert.equal(extractChatGptPlanType({account:{planType:'plus'}}),'plus');
  assert.equal(extractChatGptPlanType({account:{planType:'free'}}),'free');
  const probed=await probeChatGptCookieAccount('plus-cookie-token-test',{
    fetchFn:async url=>{
      if(url==='https://chatgpt.com/api/auth/session'){
        return Response.json({accessToken:`eyJ.${plusJwtPayload}.sig`,account:{planType:'plus'}});
      }
      if(url==='https://chatgpt.com/backend-api/models'){
        return Response.json({models:[{slug:'gpt-5-6'},{slug:'gpt-6'},{slug:'gpt-6-instant'},{slug:'gpt-6-thinking'},{slug:'internal-wm'}]});
      }
      throw Error('Unexpected probe URL: '+url);
    }
  });
  assert.equal(probed.planType,'plus');
  assert.deepEqual(probed.models,['gpt-6-instant','gpt-6','gpt-6-thinking','gpt-5-6']);
});
