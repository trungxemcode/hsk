import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseMuseCredential, normalizeMuseTutorReply, museAiGenerate, runMuseNoiseChat,
  MuseCipherState, museBuildApplicationRequest, museBuildServiceFrame, museBuildServiceRequest,
  museBuildTransportFrames, museParseNoiseTransportFrame, museParseServiceFrame, museParseProtoFields,
  museEncodeVarint, museDecodeVarint, MUSE_DEFAULT_MODELS
} from './muse-ai.mjs';
import {PERSONAL_PROVIDER_IDS} from './ai-provider-choice.mjs';

const cat=(...a)=>{const o=new Uint8Array(a.reduce((n,x)=>n+x.length,0));let i=0;for(const x of a){o.set(x,i);i+=x.length;}return o;};
const tag=(f,w)=>museEncodeVarint((f<<3)|w);
const vf=(f,v)=>cat(tag(f,0),museEncodeVarint(v));
const bf=(f,b)=>{const d=b instanceof Uint8Array?b:new TextEncoder().encode(b);return cat(tag(f,2),museEncodeVarint(d.length),d);};

test('credential parser recognises cookie, storage_state, session and bearer forms',()=>{
  assert.equal(parseMuseCredential('hatch_sess=abc; other=1').kind,'hatch-cookie');
  assert.equal(parseMuseCredential('Bearer sk-meta-123').kind,'bearer');
  assert.equal(parseMuseCredential(JSON.stringify({cookies:[{name:'hatch_sess',value:'x',domain:'muse.ai'}]})).cookieHeader,'hatch_sess=x');
  assert.equal(parseMuseCredential(JSON.stringify({vm_id:'v',auth_token:'a',notary_token:'n',ws_url:'wss://x'})).kind,'hatch-session');
  const auto=parseMuseCredential('rawtokenvalue123');
  assert.equal(auto.kind,'auto');assert.equal(auto.cookieHeader,'hatch_sess=rawtokenvalue123');
  assert.throws(()=>parseMuseCredential(''));
  assert.ok(PERSONAL_PROVIDER_IDS.includes('muse-cookie'));
  assert.deepEqual(MUSE_DEFAULT_MODELS,['muse-spark-fast','muse-spark','muse-spark-thinking']);
});

test('protobuf envelope round-trips varints, transport chunks and service frames',()=>{
  for(const n of [0,1,127,128,300,2**40])assert.equal(Number(museDecodeVarint(museEncodeVarint(n)).value),n);
  const ar=museBuildApplicationRequest('POST','/chat/stream',new TextEncoder().encode('{"a":1}'),[['content-type','application/json']]);
  const fields=museParseProtoFields(ar);
  assert.equal(new TextDecoder().decode(fields.find(f=>f.fieldNumber===2).value),'/chat/stream');
  const big=new Uint8Array(100*1024).fill(7);
  const frames=museBuildTransportFrames(5n,museBuildServiceRequest(0,museBuildServiceFrame(3n,big)));
  assert.equal(frames.length,3);
  const t=museParseNoiseTransportFrame(frames[1]);
  assert.equal(Number(t.chunk_id),5);assert.equal(t.chunk_index,1);assert.equal(t.total_chunks,3);
  const resp=museParseServiceFrame(cat(vf(1,9),bf(3,cat(vf(1,200),bf(3,'{"ok":true}'),vf(4,1)))));
  assert.equal(Number(resp.stream_id),9);assert.equal(resp.response.status,200);assert.equal(resp.response.end_body,true);
});

test('normalizeMuseTutorReply unwraps JSON, escape tags and nested answer objects',()=>{
  const r=normalizeMuseTutorReply('<escape>{"answer":{"status":"answered","content":"你好 nghĩa là xin chào"},"nodeLabel":"Chào hỏi"}</escape>');
  assert.equal(r.answer,'你好 nghĩa là xin chào');assert.equal(r.nodeLabel,'Chào hỏi');
  assert.equal(normalizeMuseTutorReply('Trả lời thuần văn bản').answer,'Trả lời thuần văn bản');
  assert.equal(normalizeMuseTutorReply('   '),null);
});

test('bearer token calls api.meta.ai chat completions and wraps tutor JSON',async()=>{
  const calls=[];
  const res=await museAiGenerate({provider:'muse-cookie',model:'muse-spark-thinking',apiKey:'Bearer meta-key'},
    {systemInstruction:{parts:[{text:'SYS'}]},contents:[{role:'user',parts:[{text:'Hỏi 了'}]}]},
    async(url,init)=>{calls.push({url,init});return Response.json({choices:[{message:{content:'{"answer":"了 chỉ sự hoàn thành"}'}}]});});
  assert.equal(calls[0].url,'https://api.meta.ai/v1/chat/completions');
  assert.equal(calls[0].init.headers.Authorization,'Bearer meta-key');
  assert.equal(JSON.parse(calls[0].init.body).model,'muse-spark');
  const out=JSON.parse((await res.json()).candidates[0].content.parts[0].text);
  assert.equal(out.answer,'了 chỉ sự hoàn thành');
});

test('expired muse.ai cookie returns 401 without leaking the token',async()=>{
  const res=await museAiGenerate({model:'muse-spark',apiKey:'hatch_sess=expired-secret'},
    {systemInstruction:{parts:[{text:'S'}]},contents:[{role:'user',parts:[{text:'hi'}]}]},
    async url=>url.endsWith('/lease-vm')?new Response('no',{status:401}):new Response('',{status:302}));
  assert.equal(res.status,401);
  assert.ok(!JSON.stringify(await res.json()).includes('expired-secret'));
});

// Simulated Hatch responder: real Noise XX (X25519/AES-GCM/SHA-256) on the responder side.
async function makeHatchServer(replyText){
  const enc=new TextEncoder();
  const sha=async d=>new Uint8Array(await crypto.subtle.digest('SHA-256',d));
  const hmac=async(k,d)=>new Uint8Array(await crypto.subtle.sign('HMAC',await crypto.subtle.importKey('raw',k,{name:'HMAC',hash:'SHA-256'},false,['sign']),d));
  const hkdf=async(ck,ikm)=>{const t=await hmac(ck,ikm),o1=await hmac(t,new Uint8Array([1]));return [o1,await hmac(t,cat(o1,new Uint8Array([2])))];};
  const kp=async()=>{const k=await crypto.subtle.generateKey({name:'X25519'},true,['deriveBits']);return {priv:k.privateKey,pub:new Uint8Array(await crypto.subtle.exportKey('raw',k.publicKey))};};
  const dh=async(priv,pub)=>new Uint8Array(await crypto.subtle.deriveBits({name:'X25519',public:await crypto.subtle.importKey('raw',pub,{name:'X25519'},false,[])},priv,256));
  const name=enc.encode('Noise_XX_25519_AESGCM_SHA256');
  let h=new Uint8Array(32);h.set(name);let ck=h.slice(),cipher=null;
  const mixHash=async d=>{h=await sha(cat(h,d));};
  const mixKey=async ikm=>{const [a,b]=await hkdf(ck,ikm);ck=a;cipher=new MuseCipherState(b);};
  const eah=async pt=>{const o=cipher?await cipher.encrypt(h,pt):pt;await mixHash(o);return o;};
  const dah=async ct=>{const p=cipher?await cipher.decrypt(h,ct):ct;await mixHash(ct);return p;};
  await mixHash(new Uint8Array(0));
  const s=await kp();let e,re,send,recv,phase=0,kicked=false;
  const listeners={message:[],close:[],error:[]};
  const emit=data=>setTimeout(()=>listeners.message.forEach(fn=>fn({data})),0);
  const sendFrame=async(sid,frameBytes)=>{const sr=bf(1,cat(vf(1,sid),frameBytes));const tx=cat(vf(1,1000+sid),vf(2,0),vf(3,1),bf(4,sr));emit(await send.encrypt(new Uint8Array(0),tx));};
  let chain=Promise.resolve();
  return {
    addEventListener(t,fn){listeners[t]?.push(fn);},
    close(){},
    send(data){const run=()=>handle(data);chain=chain.then(run,run);},
  };
  async function handle(data){
    {
      const msg=new Uint8Array(data);
      if(phase===0){re=msg.slice(0,32);await mixHash(re);await dah(msg.slice(32));e=await kp();await mixHash(e.pub);await mixKey(await dh(e.priv,re));const encS=await eah(s.pub);await mixKey(await dh(s.priv,re));const pl=await eah(new Uint8Array(70));phase=1;emit(cat(e.pub,encS,pl));return;}
      if(phase===1){const rs=await dah(msg.slice(0,48));await mixKey(await dh(e.priv,rs));await dah(msg.slice(48));const [k1,k2]=await hkdf(ck,new Uint8Array(0));recv=new MuseCipherState(k1);send=new MuseCipherState(k2);phase=2;return;}
      const pt=await recv.decrypt(new Uint8Array(0),msg);
      if(!kicked&&pt.length===0){kicked=true;return;}
      const t=museParseNoiseTransportFrame(pt);
      const sfFields=museParseProtoFields(museParseProtoFields(t.payload).find(f=>f.fieldNumber===2).value);
      const sid=Number(sfFields.find(f=>f.fieldNumber===1).value);
      const ar=museParseProtoFields(sfFields.find(f=>f.fieldNumber===2).value);
      const path=new TextDecoder().decode(ar.find(f=>f.fieldNumber===2).value);
      if(path==='/chat/subscribe'){await sendFrame(sid,bf(3,vf(1,200)));return;}
      if(path==='/chat/stream'){
        await sendFrame(sid,bf(3,cat(vf(1,200),bf(3,'{"message_id":"m1"}'),vf(4,1))));
        const now=Date.now()+5;
        for(const part of [replyText.slice(0,10),replyText.slice(10)])await sendFrame(2,bf(4,bf(1,JSON.stringify({event:'delta.text_append',payload:{text:part},ts_ms:now}))));
        await sendFrame(2,bf(4,bf(1,JSON.stringify({event:'delta.message_done',payload:{},ts_ms:now}))));
        return;
      }
      await sendFrame(sid,bf(3,cat(vf(1,200),bf(3,'{}'),vf(4,1))));
    }
  }
}

test('runMuseNoiseChat completes a real Noise XX handshake and collects streamed deltas',async()=>{
  const reply='{"answer":"Muse trả lời về 你好 và 您好"}';
  const server=await makeHatchServer(reply);
  const text=await runMuseNoiseChat({ws_url:'wss://hatch.metaaivm.com/v1/noise?x=1'},'Xin chào',{wsFactory:async()=>server,timeoutMs:8000});
  assert.equal(text,reply);
  assert.equal(normalizeMuseTutorReply(text).answer,'Muse trả lời về 你好 và 您好');
});

test('Hatch refreshes gateway tokens once after a WebSocket rejection and sends the prompt once',async()=>{
  const server=await makeHatchServer('{"answer":"你好"}');
  const upgrades=[];
  let leases=0,accepted=0;
  const res=await museAiGenerate({apiKey:'hatch_sess=test-reconnect'},
    {contents:[{role:'user',parts:[{text:'Xin chào'}]}]}, async (url,init)=>{
      const request=new URL(url);
      switch(request.pathname){
        case '/api/hatch/lease-vm':
          leases++;
          return Response.json({gatewayUrl:'wss://test.metaaivm.com',vmName:'test-vm'});
        case '/api/hatch/vm/wake': return Response.json({});
        case '/api/hatch/token': return Response.json({token:'test-token-'+leases});
        case '/api/hatch/noise-notary-token': return Response.json({notaryToken:'test-notary-'+leases});
      }
      assert.equal(init.headers.Upgrade,'websocket');
      assert.equal(init.redirect,'manual');
      upgrades.push(request.searchParams);
      if(upgrades.length===1)return new Response(null,{status:403});
      return {webSocket:{...server,accept(){accepted++;}}};
    });
  assert.equal(res.status,200);
  assert.equal(JSON.parse((await res.json()).candidates[0].content.parts[0].text).answer,'你好');
  assert.equal(leases,2);
  assert.equal(accepted,1);
  assert.deepEqual(upgrades.map(q=>q.get('auth_token')),['test-token-1','test-token-2']);
  assert.notEqual(upgrades[0].get('request_id'),upgrades[1].get('request_id'));
});

test('WebSocket rejection reports the HTTP status without the session URL or tokens',async()=>{
  const session={vm_id:'v',auth_token:'test-auth',notary_token:'test-notary',
    ws_url:'wss://hatch.metaaivm.com/v1/noise?auth_token=test-auth'};
  let requests=0;
  const res=await museAiGenerate({apiKey:JSON.stringify(session)}, {},async()=>{
    requests++;
    return new Response('test-auth',{status:403});
  });
  assert.equal(res.status,502);
  assert.deepEqual(await res.json(),{error:'Muse AI từ chối mở WebSocket (HTTP 403).'});
  assert.equal(requests,1);
});
