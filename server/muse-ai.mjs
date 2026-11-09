// Tích hợp Muse AI (muse.ai Hatch Web Token/Cookie, meta.ai ecto1 token, và api.meta.ai Bearer Token).
// Hỗ trợ đầy đủ giao thức Noise_XX_25519_AESGCM_SHA256 qua WebCrypto + Protobuf framing trên Cloudflare Worker & Node.js.

const MUSE_BASE_URL = 'https://muse.ai';
const MUSE_LB_HOST = 'hatch.metaaivm.com';
const MUSE_NOISE_WS_PATH = '/v1/noise';
const MUSE_APP_ID = 'hatch-web';
const MUSE_NOISE_PROTOCOL = 'Noise_XX_25519_AESGCM_SHA256';
const MUSE_API_COMPLETIONS_URL = 'https://api.meta.ai/v1/chat/completions';
const MUSE_CAPABILITIES = [
  'chat_cancel',
  'delta_stream',
  'custom_reactions',
  'custom_reactions_facebook_thumbs_up_v1'
];
export const MUSE_DEFAULT_MODELS = [
  'muse-spark-fast',
  'muse-spark',
  'muse-spark-thinking'
];

const museSessionCache = new Map();

function museConcat(...arrays) {
  const total = arrays.reduce((sum, a) => sum + a.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.byteLength;
  }
  return out;
}

// --- Minimal Protobuf Wire Encoder / Decoder for Hatch Noise Envelopes ---
export function museEncodeVarint(value) {
  let v = BigInt(value);
  if (v < 0n) v = BigInt.asUintN(64, v);
  const bytes = [];
  while (v >= 0x80n) {
    bytes.push(Number((v & 0x7fn) | 0x80n));
    v >>= 7n;
  }
  bytes.push(Number(v));
  return new Uint8Array(bytes);
}

export function museDecodeVarint(bytes, offset = 0) {
  let result = 0n;
  let shift = 0n;
  let pos = offset;
  while (pos < bytes.length) {
    const b = bytes[pos++];
    result |= BigInt(b & 0x7f) << shift;
    if ((b & 0x80) === 0) return { value: result, offset: pos };
    shift += 7n;
    if (shift > 70n) throw new Error('Protobuf varint overflow');
  }
  throw new Error('Truncated protobuf varint');
}

function museProtoTag(fieldNumber, wireType) {
  return museEncodeVarint((fieldNumber << 3) | wireType);
}

function museProtoVarintField(fieldNumber, value) {
  if (value === undefined || value === null) return new Uint8Array(0);
  return museConcat(museProtoTag(fieldNumber, 0), museEncodeVarint(value));
}

function museProtoBytesField(fieldNumber, bytes) {
  if (!bytes || bytes.byteLength === 0) return new Uint8Array(0);
  const data = bytes instanceof Uint8Array ? bytes : new TextEncoder().encode(String(bytes));
  return museConcat(museProtoTag(fieldNumber, 2), museEncodeVarint(data.byteLength), data);
}

export function museParseProtoFields(bytes) {
  const fields = [];
  let offset = 0;
  while (offset < bytes.byteLength) {
    const tag = museDecodeVarint(bytes, offset);
    offset = tag.offset;
    const fieldNumber = Number(tag.value >> 3n);
    const wireType = Number(tag.value & 0x07n);
    if (wireType === 0) {
      const v = museDecodeVarint(bytes, offset);
      offset = v.offset;
      fields.push({ fieldNumber, wireType, value: v.value });
    } else if (wireType === 1) {
      fields.push({ fieldNumber, wireType, value: bytes.slice(offset, offset + 8) });
      offset += 8;
    } else if (wireType === 2) {
      const len = museDecodeVarint(bytes, offset);
      offset = len.offset;
      const end = offset + Number(len.value);
      fields.push({ fieldNumber, wireType, value: bytes.slice(offset, end) });
      offset = end;
    } else if (wireType === 5) {
      fields.push({ fieldNumber, wireType, value: bytes.slice(offset, offset + 4) });
      offset += 4;
    } else {
      throw new Error(`Unsupported protobuf wire type: ${wireType}`);
    }
  }
  return fields;
}

export function museBuildApplicationRequest(verb, path, bodyBytes, headers = []) {
  const parts = [];
  if (verb) parts.push(museProtoBytesField(1, verb));
  if (path) parts.push(museProtoBytesField(2, path));
  for (const [key, value] of headers) {
    const hdr = museConcat(museProtoBytesField(1, key), museProtoBytesField(2, value));
    parts.push(museProtoBytesField(3, hdr));
  }
  if (bodyBytes && bodyBytes.byteLength > 0) parts.push(museProtoBytesField(4, bodyBytes));
  parts.push(museProtoVarintField(5, 1)); // end_body = true
  return museConcat(...parts);
}

export function museBuildServiceFrame(streamId, appRequestBytes) {
  return museConcat(
    museProtoVarintField(1, streamId),
    museProtoBytesField(2, appRequestBytes)
  );
}

export function museBuildServiceRequest(service, serviceFrameBytes) {
  const parts = [];
  if (service) parts.push(museProtoVarintField(1, service));
  parts.push(museProtoBytesField(2, serviceFrameBytes));
  return museConcat(...parts);
}

export function museBuildTransportFrames(chunkId, serviceRequestBytes, maxChunk = 48 * 1024) {
  const total = serviceRequestBytes.byteLength === 0 ? 1 : Math.ceil(serviceRequestBytes.byteLength / maxChunk);
  const frames = [];
  for (let i = 0; i < total; i++) {
    const slice = serviceRequestBytes.slice(i * maxChunk, (i + 1) * maxChunk);
    frames.push(museConcat(
      museProtoVarintField(1, chunkId),
      museProtoVarintField(2, i),
      museProtoVarintField(3, total),
      museProtoBytesField(4, slice)
    ));
  }
  return frames;
}

export function museParseNoiseTransportFrame(bytes) {
  const out = { chunk_id: 0n, chunk_index: 0, total_chunks: 1, payload: new Uint8Array(0) };
  for (const f of museParseProtoFields(bytes)) {
    if (f.fieldNumber === 1 && f.wireType === 0) out.chunk_id = f.value;
    else if (f.fieldNumber === 2 && f.wireType === 0) out.chunk_index = Number(f.value);
    else if (f.fieldNumber === 3 && f.wireType === 0) out.total_chunks = Number(f.value);
    else if (f.fieldNumber === 4 && f.wireType === 2) out.payload = f.value;
  }
  return out;
}

export function museParseServiceResponse(bytes) {
  for (const f of museParseProtoFields(bytes)) {
    if (f.fieldNumber === 1 && f.wireType === 2) return { payload: f.value };
  }
  return { payload: new Uint8Array(0) };
}

export function museParseServiceFrame(bytes) {
  const out = { stream_id: 0n, response: null, body_chunk: null, reset: null };
  for (const f of museParseProtoFields(bytes)) {
    if (f.fieldNumber === 1 && f.wireType === 0) out.stream_id = f.value;
    else if (f.fieldNumber === 3 && f.wireType === 2) {
      const resp = { status: 0, body: new Uint8Array(0), end_body: false };
      for (const rf of museParseProtoFields(f.value)) {
        if (rf.fieldNumber === 1 && rf.wireType === 0) resp.status = Number(rf.value);
        else if (rf.fieldNumber === 3 && rf.wireType === 2) resp.body = rf.value;
        else if (rf.fieldNumber === 4 && rf.wireType === 0) resp.end_body = rf.value !== 0n;
      }
      out.response = resp;
    } else if (f.fieldNumber === 4 && f.wireType === 2) {
      const bc = { data: new Uint8Array(0), end_body: false };
      for (const bf of museParseProtoFields(f.value)) {
        if (bf.fieldNumber === 1 && bf.wireType === 2) bc.data = bf.value;
        else if (bf.fieldNumber === 2 && bf.wireType === 0) bc.end_body = bf.value !== 0n;
      }
      out.body_chunk = bc;
    } else if (f.fieldNumber === 5 && f.wireType === 2) {
      const rst = { code: 0, reason: '' };
      for (const xf of museParseProtoFields(f.value)) {
        if (xf.fieldNumber === 1 && xf.wireType === 0) rst.code = Number(xf.value);
        else if (xf.fieldNumber === 2 && xf.wireType === 2) rst.reason = new TextDecoder().decode(xf.value);
      }
      out.reset = rst;
    }
  }
  return out;
}

// --- WebCrypto Noise_XX_25519_AESGCM_SHA256 ---
export function museNoiseNonce(n) {
  const out = new Uint8Array(12);
  const view = new DataView(out.buffer);
  const big = BigInt(n);
  view.setUint32(4, Number((big >> 32n) & 0xffffffffn), false);
  view.setUint32(8, Number(big & 0xffffffffn), false);
  return out;
}

async function museSha256(data) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data));
}

async function museHmacSha256(keyBytes, dataBytes) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, dataBytes));
}

async function museHkdf2(ck, ikm) {
  const tempKey = await museHmacSha256(ck, ikm);
  const o1 = await museHmacSha256(tempKey, new Uint8Array([1]));
  const o2 = await museHmacSha256(tempKey, museConcat(o1, new Uint8Array([2])));
  return [o1, o2];
}

export class MuseCipherState {
  constructor(keyBytes) {
    this.keyBytes = keyBytes;
    this.nonce = 0n;
    this._cryptoKeyPromise = null;
  }
  _getKey() {
    if (!this._cryptoKeyPromise) {
      this._cryptoKeyPromise = crypto.subtle.importKey('raw', this.keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    }
    return this._cryptoKeyPromise;
  }
  async encrypt(ad, pt) {
    const key = await this._getKey();
    const iv = museNoiseNonce(this.nonce++);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: ad }, key, pt);
    return new Uint8Array(ct);
  }
  async decrypt(ad, ct) {
    const key = await this._getKey();
    const iv = museNoiseNonce(this.nonce++);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: ad }, key, ct);
    return new Uint8Array(pt);
  }
}

async function museGenerateX25519KeyPair() {
  const kp = await crypto.subtle.generateKey({ name: 'X25519' }, true, ['deriveBits']);
  const pub = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  return { privateKey: kp.privateKey, pub };
}

async function museX25519Dh(privateKey, remotePubBytes) {
  const remotePub = await crypto.subtle.importKey('raw', remotePubBytes, { name: 'X25519' }, false, []);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'X25519', public: remotePub }, privateKey, 256));
}

export class MuseNoiseXxHandshake {
  constructor() {
    this.h = new Uint8Array(32);
    this.ck = new Uint8Array(32);
    this.cipher = null;
    this.s = null;
    this.e = null;
    this.re = null;
    this.rs = null;
  }
  async init(prologue = new Uint8Array(0)) {
    const nameBytes = new TextEncoder().encode(MUSE_NOISE_PROTOCOL);
    if (nameBytes.byteLength <= 32) {
      this.h = new Uint8Array(32);
      this.h.set(nameBytes);
    } else {
      this.h = await museSha256(nameBytes);
    }
    this.ck = this.h.slice();
    await this.mixHash(prologue);
    this.s = await museGenerateX25519KeyPair();
  }
  async mixHash(data) {
    this.h = await museSha256(museConcat(this.h, data));
  }
  async mixKey(ikm) {
    const [ck, k] = await museHkdf2(this.ck, ikm);
    this.ck = ck;
    this.cipher = new MuseCipherState(k);
  }
  async encryptAndHash(pt) {
    const out = this.cipher ? await this.cipher.encrypt(this.h, pt) : pt;
    await this.mixHash(out);
    return out;
  }
  async decryptAndHash(ct) {
    const pt = this.cipher ? await this.cipher.decrypt(this.h, ct) : ct;
    await this.mixHash(ct);
    return pt;
  }
  async writeMessage1(payload) {
    this.e = await museGenerateX25519KeyPair();
    await this.mixHash(this.e.pub);
    const enc = await this.encryptAndHash(payload);
    return museConcat(this.e.pub, enc);
  }
  async readMessage2(msg) {
    if (msg.byteLength < 96) throw new Error('Muse Noise message2 too short');
    this.re = msg.slice(0, 32);
    await this.mixHash(this.re);
    await this.mixKey(await museX25519Dh(this.e.privateKey, this.re)); // ee
    this.rs = await this.decryptAndHash(msg.slice(32, 80)); // s
    await this.mixKey(await museX25519Dh(this.e.privateKey, this.rs)); // es
    return this.decryptAndHash(msg.slice(80));
  }
  async writeMessage3(payload = new Uint8Array(0)) {
    const encS = await this.encryptAndHash(this.s.pub);
    await this.mixKey(await museX25519Dh(this.s.privateKey, this.re)); // se
    const encPayload = await this.encryptAndHash(payload);
    const [k1, k2] = await museHkdf2(this.ck, new Uint8Array(0));
    return {
      bytes: museConcat(encS, encPayload),
      send: new MuseCipherState(k1),
      recv: new MuseCipherState(k2)
    };
  }
}

// --- Credential Parsing & Bootstrap ---
export function parseMuseCredential(rawInput) {
  const trimmed = String(rawInput || '').trim();
  if (!trimmed) throw new Error('Muse AI token/cookie is empty');

  // 1. JSON session.json or storage_state.json
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj.vm_id && obj.auth_token && obj.notary_token) {
        return { kind: 'hatch-session', session: obj };
      }
      if (Array.isArray(obj.cookies)) {
        const pairs = obj.cookies
          .filter(c => c && typeof c.name === 'string' && typeof c.value === 'string')
          .map(c => `${c.name}=${c.value}`);
        if (pairs.length) return { kind: 'hatch-cookie', cookieHeader: pairs.join('; ') };
      }
      if (typeof obj.hatch_sess === 'string') {
        return { kind: 'hatch-cookie', cookieHeader: `hatch_sess=${obj.hatch_sess}` };
      }
      if (typeof obj.apiKey === 'string' || typeof obj.token === 'string') {
        return { kind: 'bearer', token: String(obj.apiKey || obj.token).replace(/^Bearer\s+/i, '').trim() };
      }
    } catch {}
  }

  // 2. Bearer token for api.meta.ai (or explicit Bearer prefix)
  if (/^Bearer\s+/i.test(trimmed)) {
    return { kind: 'bearer', token: trimmed.replace(/^Bearer\s+/i, '').trim() };
  }

  // 3. Cookie header containing hatch_sess= or other cookie pairs
  if (/\bhatch_sess\s*=/.test(trimmed)) {
    const cookieHeader = trimmed.replace(/^Cookie:\s*/i, '').replace(/\|/g, '; ');
    return { kind: 'hatch-cookie', cookieHeader };
  }

  // 4. Pipe-separated or semicolon-separated cookie header
  if (trimmed.includes('=') && (trimmed.includes(';') || trimmed.includes('|'))) {
    const normalized = trimmed.replace(/^Cookie:\s*/i, '').replace(/\|/g, '; ');
    if (!/\bhatch_sess\s*=/.test(normalized)) {
      return { kind: 'hatch-cookie', cookieHeader: `hatch_sess=${normalized}` };
    }
    return { kind: 'hatch-cookie', cookieHeader: normalized };
  }

  // 5. Default: support both hatch_sess cookie value and Bearer token fallback
  return {
    kind: 'auto',
    raw: trimmed,
    cookieHeader: `hatch_sess=${trimmed}`,
    token: trimmed
  };
}

const MUSE_BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
  'Origin': MUSE_BASE_URL,
  'Referer': `${MUSE_BASE_URL}/`,
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"'
};

export async function bootstrapMuseHatchSession(cookieHeader, { fetchFn = fetch, signal, now = () => Date.now() } = {}) {
  const cacheKey = cookieHeader.slice(0, 96) + ':' + cookieHeader.length;
  const cached = museSessionCache.get(cacheKey);
  if (cached && now() - cached.at < 20 * 60 * 1000) return cached.session;

  const postMuse = async (path, body) => {
    const resp = await fetchFn(`${MUSE_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        ...MUSE_BROWSER_HEADERS,
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify(body),
      signal,
      redirect: 'manual'
    });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      const err = new Error(`Muse AI bootstrap ${path} failed (${resp.status}): ${errText.slice(0, 160)}`);
      err.status = resp.status;
      throw err;
    }
    return resp.json();
  };

  let vmId = '';
  let gatewayUrl = '';

  try {
    const lease = await postMuse('/api/hatch/lease-vm', { vmType: 'standard' });
    if (typeof lease?.gatewayUrl === 'string' && typeof lease?.vmName === 'string') {
      gatewayUrl = lease.gatewayUrl;
      vmId = lease.vmName;
    }
  } catch (err) {
    if (err?.status === 401) throw err;
  }

  if (!vmId || !gatewayUrl) {
    const htmlResp = await fetchFn(`${MUSE_BASE_URL}/`, {
      method: 'GET',
      headers: { ...MUSE_BROWSER_HEADERS, 'Cookie': cookieHeader },
      signal,
      redirect: 'manual'
    });
    if (htmlResp.status === 401 || htmlResp.status === 403 || (htmlResp.status >= 300 && htmlResp.status < 400)) {
      const err = new Error('Token/cookie Muse AI đã hết hạn hoặc không hợp lệ.');
      err.status = 401;
      throw err;
    }
    const html = await htmlResp.text().catch(() => '');
    const m = html.match(/activeGatewayUrl"\s*:\s*"(wss:\/\/([a-f0-9-]{36})\.metaaivm\.com\/?)"/i);
    if (!m) {
      const err = new Error('Không tìm thấy phiên Muse AI hợp lệ từ token/cookie này.');
      err.status = 401;
      throw err;
    }
    gatewayUrl = m[1];
    vmId = m[2];
  }

  await postMuse('/api/hatch/vm/wake', { vm_id: vmId, retry_count: 0 });
  const tokenResp = await postMuse('/api/hatch/token', { vmAddress: gatewayUrl, vmName: vmId });
  const authToken = typeof tokenResp?.token === 'string' ? tokenResp.token.trim() : '';
  if (!authToken) throw new Error('Muse AI không trả về auth_token');

  const notaryResp = await postMuse('/api/hatch/noise-notary-token', { vmName: vmId });
  const notaryToken = typeof notaryResp?.notaryToken === 'string' ? notaryResp.notaryToken.trim() : '';
  if (!notaryToken) throw new Error('Muse AI không trả về notaryToken');

  const requestId = crypto.randomUUID();
  const q = new URLSearchParams({
    vm_id: vmId,
    auth_token: authToken,
    notary_token: notaryToken,
    app_id: MUSE_APP_ID,
    request_id: requestId
  });
  const wsUrl = `wss://${MUSE_LB_HOST}${MUSE_NOISE_WS_PATH}?${q.toString()}`;
  const session = { vm_id: vmId, gateway_url: gatewayUrl, auth_token: authToken, notary_token: notaryToken, request_id: requestId, ws_url: wsUrl };
  museSessionCache.set(cacheKey, { at: now(), session });
  return session;
}

function museToBytes(data) {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  if (typeof data === 'string') return new TextEncoder().encode(data);
  return new Uint8Array(0);
}

async function openMuseWebSocket(wsUrl, { fetchFn = fetch, wsFactory, signal } = {}) {
  if (typeof wsFactory === 'function') {
    return wsFactory(wsUrl, { signal });
  }
  // Try Cloudflare Worker WebSocket upgrade first if fetchFn supports Upgrade: websocket
  try {
    const httpUrl = wsUrl.replace(/^wss:/i, 'https:').replace(/^ws:/i, 'http:');
    const upgradeResp = await fetchFn(httpUrl, {
      headers: {
        ...MUSE_BROWSER_HEADERS,
        'Upgrade': 'websocket',
        'Connection': 'Upgrade'
      },
      signal
    });
    if (upgradeResp?.webSocket) {
      const ws = upgradeResp.webSocket;
      if (typeof ws.accept === 'function') ws.accept();
      return ws;
    }
  } catch {}

  if (typeof globalThis.WebSocket === 'function') {
    return await new Promise((resolve, reject) => {
      const ws = new globalThis.WebSocket(wsUrl);
      if (typeof ws.accept === 'function') {
        try { ws.accept(); } catch {}
      }
      ws.binaryType = 'arraybuffer';
      if (ws.readyState === 1) {
        return resolve(ws);
      }
      const onOpen = () => { cleanup(); resolve(ws); };
      const onErr = () => { cleanup(); reject(new Error('Không thể kết nối WebSocket tới Muse AI')); };
      const cleanup = () => {
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('error', onErr);
      };
      ws.addEventListener('open', onOpen);
      ws.addEventListener('error', onErr);
    });
  }
  throw new Error('Môi trường hiện tại không hỗ trợ kết nối WebSocket tới Muse AI.');
}

export async function runMuseNoiseChat(session, userText, { fetchFn = fetch, wsFactory, signal, timeoutMs = 85000 } = {}) {
  const ws = await openMuseWebSocket(session.ws_url, { fetchFn, wsFactory, signal });
  const queue = [];
  let closed = false;
  let notify = null;

  const pushMsg = (ev) => {
    const bytes = museToBytes(ev?.data ?? ev);
    if (bytes.byteLength > 0) {
      queue.push(bytes);
      if (notify) { const fn = notify; notify = null; fn(); }
    }
  };
  const markClosed = () => {
    closed = true;
    if (notify) { const fn = notify; notify = null; fn(); }
  };

  ws.addEventListener('message', pushMsg);
  ws.addEventListener('close', markClosed);
  ws.addEventListener('error', markClosed);

  const recvRaw = async (waitMs = 8000) => {
    if (queue.length > 0) return queue.shift();
    if (closed) return null;
    await new Promise(resolve => {
      const timer = setTimeout(() => {
        if (notify === done) notify = null;
        resolve();
      }, waitMs);
      const done = () => { clearTimeout(timer); resolve(); };
      notify = done;
    });
    if (queue.length > 0) return queue.shift();
    return null;
  };

  try {
    const hs = new MuseNoiseXxHandshake();
    await hs.init();
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const msg1Payload = museConcat(new Uint8Array([0x0a, 0x20]), nonce);
    const msg1 = await hs.writeMessage1(msg1Payload);
    ws.send(msg1);

    const msg2 = await recvRaw(10000);
    if (!msg2) throw new Error('Muse AI không phản hồi bước bắt tay Noise (msg2)');
    await hs.readMessage2(msg2);

    const { bytes: msg3, send: csSend, recv: csRecv } = await hs.writeMessage3(new Uint8Array(0));
    ws.send(msg3);

    // Kick frame (empty plaintext AEAD tag)
    ws.send(await csSend.encrypt(new Uint8Array(0), new Uint8Array(0)));

    let streamSeq = 0n;
    let chunkSeq = 0n;
    const assemblies = new Map();
    const streamBodies = new Map();
    const respondedStreams = new Set();

    const sendRequest = async (verb, path, bodyObj) => {
      streamSeq += 1n;
      chunkSeq += 1n;
      const sid = streamSeq;
      const cid = chunkSeq;
      const bodyBytes = bodyObj !== undefined ? new TextEncoder().encode(JSON.stringify(bodyObj)) : new Uint8Array(0);
      const hdrs = [];
      if (bodyBytes.byteLength > 0) hdrs.push(['content-type', 'application/json']);
      hdrs.push(['accept-language', 'vi-VN,en-US']);
      const ar = museBuildApplicationRequest(verb, path, bodyBytes, hdrs);
      const sf = museBuildServiceFrame(sid, ar);
      const sr = museBuildServiceRequest(0, sf);
      const frames = museBuildTransportFrames(cid, sr);
      for (const frame of frames) {
        ws.send(await csSend.encrypt(new Uint8Array(0), frame));
      }
      return sid;
    };

    const recvFrameEvent = async (waitMs = 1500) => {
      const raw = await recvRaw(waitMs);
      if (!raw) return closed ? 'closed' : null;
      let pt;
      try {
        pt = await csRecv.decrypt(new Uint8Array(0), raw);
      } catch {
        return null;
      }
      if (!pt || pt.byteLength === 0) return null;
      let tx;
      try {
        tx = museParseNoiseTransportFrame(pt);
      } catch {
        return null;
      }
      const chunkId = Number(tx.chunk_id);
      let asm = assemblies.get(chunkId);
      if (!asm) {
        asm = { chunks: new Map(), total: Math.max(1, tx.total_chunks) };
        assemblies.set(chunkId, asm);
      }
      asm.chunks.set(tx.chunk_index, tx.payload);
      if (asm.chunks.size < asm.total) return null;
      const ordered = [];
      for (let i = 0; i < asm.total; i++) ordered.push(asm.chunks.get(i) || new Uint8Array(0));
      assemblies.delete(chunkId);
      const full = museConcat(...ordered);

      const sr = museParseServiceResponse(full);
      const sf = museParseServiceFrame(sr.payload);
      const sid = sf.stream_id;

      if (sf.reset) {
        streamBodies.delete(sid);
        return { kind: 'reset', streamId: sid, code: sf.reset.code, reason: sf.reset.reason };
      }
      if (sf.response) {
        let b = streamBodies.get(sid);
        if (!b) { b = { status: sf.response.status, parts: [] }; streamBodies.set(sid, b); }
        if (sf.response.body?.byteLength) b.parts.push(sf.response.body);
        respondedStreams.add(sid);
        if (sf.response.end_body) {
          const combined = museConcat(...b.parts);
          streamBodies.delete(sid);
          const parsed = combined.byteLength ? JSON.parse(new TextDecoder().decode(combined)) : {};
          return { kind: 'complete', streamId: sid, status: b.status, body: parsed };
        }
        return null;
      }
      if (sf.body_chunk) {
        const data = sf.body_chunk.data;
        if (data?.byteLength) {
          try {
            const obj = JSON.parse(new TextDecoder().decode(data));
            if (obj && typeof obj === 'object' && !Array.isArray(obj) && 'event' in obj) {
              return { kind: 'event', streamId: sid, obj };
            }
          } catch {}
          let b = streamBodies.get(sid);
          if (!b) { b = { status: 200, parts: [] }; streamBodies.set(sid, b); }
          b.parts.push(data);
        }
        if (sf.body_chunk.end_body) {
          const b = streamBodies.get(sid) || { status: 200, parts: [] };
          streamBodies.delete(sid);
          const combined = museConcat(...b.parts);
          const parsed = combined.byteLength ? JSON.parse(new TextDecoder().decode(combined)) : {};
          return { kind: 'complete', streamId: sid, status: b.status, body: parsed };
        }
      }
      return null;
    };

    const clientId = crypto.randomUUID();
    await sendRequest('POST', '/api/nodes/register', {
      node_id: clientId,
      display_name: 'hsk-tutor',
      platform: 'web',
      commands_v2: { ping: { description: 'Connection liveness check' } }
    });
    await sendRequest('POST', '/client/register-capabilities', {
      client_id: clientId,
      platform: 'web',
      display_name: 'hsk-tutor',
      version: '1.0.0',
      capabilities: {
        data_sources: {},
        device_commands: {},
        hatch_app_commands: {},
        rendering: {
          supported_presentations: ['text_with_button', 'generic_list'],
          supported_inline_presentations: ['option'],
          supported_text_entities: []
        }
      }
    });

    const subSid = await sendRequest('POST', '/chat/subscribe', {
      after_stream_seq: 0,
      after_chat_event_seq: 0,
      capabilities: MUSE_CAPABILITIES
    });

    const sendSid = await sendRequest('POST', '/chat/stream', {
      message: userText,
      node_id: clientId,
      capabilities: MUSE_CAPABILITIES,
      timezone: 'Asia/Ho_Chi_Minh'
    });
    const sendStartMs = Date.now();
    const textParts = [];
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const ev = await recvFrameEvent(1200);
      if (ev === 'closed') break;
      if (!ev) continue;

      if (ev.kind === 'event') {
        const obj = ev.obj || {};
        const eventName = String(obj.event || '');
        const payload = obj.payload || obj;

        if (
          eventName === 'delta.text_append' ||
          eventName === 'chat.delta' ||
          eventName === 'text_append' ||
          eventName.includes('delta') ||
          eventName.includes('append') ||
          eventName.includes('text')
        ) {
          const delta = payload.text ?? payload.delta ?? payload.content ?? (typeof payload.string === 'string' ? payload.string : '');
          if (typeof delta === 'string' && delta) textParts.push(delta);
        } else if (
          eventName === 'delta.message_done' ||
          eventName === 'chat.done' ||
          eventName.includes('done') ||
          eventName.includes('finish') ||
          payload.done === true
        ) {
          if (textParts.length === 0) {
            const messages = payload?.transcript?.messages || payload?.messages || [];
            for (const m of messages) {
              for (const c of m?.content || []) {
                if (c?.type === 'text' && typeof c.text === 'string') textParts.push(c.text);
              }
              if (typeof m?.text === 'string' && m.text.trim()) textParts.push(m.text.trim());
            }
          }
          break;
        } else if (eventName === 'message.assistant' || eventName.includes('assistant')) {
          const t = payload.display_text ?? payload.content ?? payload.text ?? '';
          if (typeof t === 'string' && t.trim()) {
            if (textParts.length === 0) textParts.push(t.trim());
          }
          break;
        }
      } else if (ev.kind === 'complete') {
        const body = ev.body || {};
        if (textParts.length === 0) {
          const possibleText = body.text ?? body.response ?? body.content ?? body.message ?? body.display_text ?? body?.choices?.[0]?.message?.content;
          if (typeof possibleText === 'string' && possibleText.trim()) {
            textParts.push(possibleText.trim());
          } else if (Array.isArray(body.messages)) {
            for (const m of body.messages) {
              const t = typeof m?.content === 'string' ? m.content : Array.isArray(m?.content) ? m.content.map(c => c?.text || '').join('') : (m?.text || '');
              if (t.trim()) textParts.push(t.trim());
            }
          }
        }
        if (textParts.length > 0) break;
      } else if (ev.kind === 'reset') {
        if (textParts.length > 0) break;
      }
    }

    let result = textParts.join('').trim();
    if (!result) {
      for (const [sid, b] of streamBodies.entries()) {
        if (b.parts?.length) {
          const combined = new TextDecoder().decode(museConcat(...b.parts)).trim();
          if (combined) {
            try {
              const obj = JSON.parse(combined);
              const t = obj.text || obj.response || obj.content || obj.message;
              if (typeof t === 'string' && t.trim()) { result = t.trim(); break; }
            } catch {
              result = combined;
              break;
            }
          }
        }
      }
    }
    return result;
  } finally {
    try { ws.close(); } catch {}
  }
}

export function normalizeMuseTutorReply(rawText, questionText = '') {
  const cleaned = String(rawText || '').replace(/<\/?escape>/gi, '').trim();
  if (!cleaned) return null;
  const candidates = [cleaned];
  const fenced = cleaned.match(/(?:^|\n)\s*```(?:json)?[ \t]*\r?\n([\s\S]*?)```/i);
  if (fenced) candidates.unshift(fenced[1].trim());
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(cleaned.slice(firstBrace, lastBrace + 1));
  }
  for (const item of candidates) {
    try {
      const data = JSON.parse(item);
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        if (data.error === 'OUT_OF_SCOPE') return data;
        if (data.answer && typeof data.answer === 'object' && !Array.isArray(data.answer)) {
          const nested = data.answer.content || data.answer.text || data.answer.answer || data.answer.reply || '';
          if (typeof nested === 'string' && nested.trim()) data.answer = nested.trim();
        }
        if (typeof data.answer === 'string' && data.answer.trim()) {
          return {
            primaryNodeKey: String(data.primaryNodeKey || 'topic:muse-tutor').slice(0, 120),
            nodeLabel: String(data.nodeLabel || questionText || 'Hỏi đáp tiếng Trung').slice(0, 160),
            coreRuleSummary: String(data.coreRuleSummary || data.nodeLabel || 'Giải thích trực tiếp từ gia sư AI.').slice(0, 300),
            answer: data.answer.trim().slice(0, 5000),
            explanationStrategyUsed: String(data.explanationStrategyUsed || 'direct_explanation').slice(0, 120),
            optionalMicroCheck: data.optionalMicroCheck && typeof data.optionalMicroCheck === 'object' ? data.optionalMicroCheck : null,
            suggestedQuestions: Array.isArray(data.suggestedQuestions) ? data.suggestedQuestions : [],
            memoryCandidates: Array.isArray(data.memoryCandidates) ? data.memoryCandidates : []
          };
        }
      }
    } catch {}
  }
  return {
    primaryNodeKey: 'topic:muse-tutor',
    nodeLabel: String(questionText || 'Hỏi đáp tiếng Trung').slice(0, 160),
    coreRuleSummary: 'Giải thích trực tiếp từ gia sư AI.',
    answer: cleaned.slice(0, 5000),
    explanationStrategyUsed: 'direct_explanation',
    optionalMicroCheck: null,
    suggestedQuestions: [],
    memoryCandidates: []
  };
}

function buildMuseFlattenedPrompt(requestBody, model) {
  const systemText = (requestBody?.systemInstruction?.parts || [])
    .map(p => p?.text || '')
    .filter(Boolean)
    .join('\n')
    .trim();
  const turns = (requestBody?.contents || []).map(msg => {
    const role = msg?.role === 'model' ? 'Gia sư AI' : 'Học viên';
    const text = (msg?.parts || []).map(p => p?.text || '').join('\n').trim();
    return text ? `${role}: ${text}` : '';
  }).filter(Boolean);
  const modeHint = model === 'muse-spark-thinking'
    ? '[Chế độ suy luận sâu Muse Spark: phân tích kỹ từng điểm ngữ pháp/từ vựng trước khi trả lời]\n'
    : model === 'muse-spark-fast'
    ? '[Chế độ phản hồi nhanh Muse Spark]\n'
    : '';
  return [modeHint + systemText, ...turns].filter(Boolean).join('\n\n');
}

export async function probeMuseAiAccount(rawCredential, { fetchFn = fetch, signal, now = () => Date.now() } = {}) {
  try {
    const cred = parseMuseCredential(rawCredential);
    if (cred.kind === 'bearer') {
      const res = await fetchFn('https://api.meta.ai/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${cred.token}` },
        signal,
        redirect: 'manual'
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        const ids = (data?.data || []).map(m => m?.id).filter(id => typeof id === 'string').slice(0, 8);
        if (ids.length) return { models: ids };
      }
      return { models: MUSE_DEFAULT_MODELS };
    }
    if (cred.kind === 'hatch-session') {
      return { models: MUSE_DEFAULT_MODELS };
    }
    await bootstrapMuseHatchSession(cred.cookieHeader, { fetchFn, signal, now });
    return { models: MUSE_DEFAULT_MODELS };
  } catch {
    return { models: MUSE_DEFAULT_MODELS };
  }
}

export async function museAiGenerate(config, requestBody, fetchFn = fetch, signal, options = {}) {
  const { apiKey, model = 'muse-spark' } = config || {};
  const cred = parseMuseCredential(apiKey);
  const contents = Array.isArray(requestBody?.contents) ? requestBody.contents : [];
  const lastUser = [...contents].reverse().find(c => c?.role === 'user');
  const questionText = (lastUser?.parts || []).map(p => p?.text || '').join('\n').slice(0, 160);

  // 1. Direct Bearer token call to api.meta.ai (or when auto falls back to Bearer)
  const tryBearerCall = async (token) => {
    const system = (requestBody?.systemInstruction?.parts || []).map(p => p?.text || '').join('\n');
    const messages = [
      ...(system ? [{ role: 'system', content: system }] : []),
      ...contents.map(m => ({
        role: m?.role === 'model' ? 'assistant' : 'user',
        content: (m?.parts || []).map(p => p?.text || '').join('\n')
      }))
    ];
    const apiModel = model === 'muse-spark-fast' || model === 'muse-spark-thinking' ? 'muse-spark' : (model || 'muse-spark');
    const response = await fetchFn(MUSE_API_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ model: apiModel, messages, stream: false }),
      signal,
      redirect: 'manual'
    });
    if (response.status >= 300 && response.status < 400) return new Response(null, { status: 502 });
    if (!response.ok) return response;
    const payload = await response.json().catch(() => null);
    const rawReply = payload?.choices?.[0]?.message?.content;
    if (typeof rawReply !== 'string' || !rawReply.trim()) return new Response(null, { status: 502 });
    const normalized = normalizeMuseTutorReply(rawReply, questionText);
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(normalized) }] } }] });
  };

  if (cred.kind === 'bearer') {
    return tryBearerCall(cred.token);
  }

  // 2. Muse.ai Hatch Web Session / Cookie over Noise_XX_25519_AESGCM_SHA256
  try {
    const session = cred.kind === 'hatch-session'
      ? cred.session
      : await bootstrapMuseHatchSession(cred.cookieHeader, { fetchFn, signal, now: options.now });
    const prompt = buildMuseFlattenedPrompt(requestBody, model);
    const replyText = await runMuseNoiseChat(session, prompt, { fetchFn, wsFactory: options.wsFactory, signal, timeoutMs: 85000 });
    if (!replyText) return new Response(JSON.stringify({ error: 'Muse AI không trả về nội dung.' }), { status: 502 });
    const normalized = normalizeMuseTutorReply(replyText, questionText);
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(normalized) }] } }] });
  } catch (err) {
    if (cred.cookieHeader) {
      const cacheKey = cred.cookieHeader.slice(0, 96) + ':' + cred.cookieHeader.length;
      museSessionCache.delete(cacheKey);
    }
    // If credential was 'auto' (could be an api.meta.ai Bearer token without prefix), try Bearer endpoint before failing
    if (cred.kind === 'auto' && !cred.raw.includes('=')) {
      try {
        const bearerResp = await tryBearerCall(cred.token);
        if (bearerResp.ok) return bearerResp;
      } catch {}
    }
    const status = err?.status === 401 || err?.status === 403 ? 401 : 502;
    return Response.json({ error: err?.message || 'Muse AI không phản hồi.' }, { status });
  }
}
