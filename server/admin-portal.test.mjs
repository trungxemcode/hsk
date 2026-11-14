import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { OWNER_UID, OWNER_EMAIL, accountRoleControl } from './account-roles.mjs';
import { createHandler } from './translator-worker-bundled.mjs';

const require = createRequire(import.meta.url);
const Core = require('../src/modules/admin/admin-portal-core.js');

function storage() {
  const m = new Map();
  return {
    m,
    get: async (k) => m.get(k),
    put: async (k, v) => m.set(k, v),
    list: async ({ prefix, limit, startAfter }) =>
      new Map(
        [...m]
          .filter(([k]) => k.startsWith(prefix) && (!startAfter || k > startAfter))
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(0, limit)
      )
  };
}

function store() {
  const s = storage();
  s.transaction = async (fn) => fn(s);
  return s;
}

function binding(s) {
  return {
    idFromName: (n) => n,
    get: () => ({
      fetch: async (u, o) =>
        JSON.parse(o.body).action.startsWith('roles-')
          ? accountRoleControl(s, JSON.parse(o.body))
          : Response.json({ allowed: true })
    })
  };
}

function token(uid) {
  const project = 'hsk-flashcards-44631';
  return (
    'h.' +
    Buffer.from(
      JSON.stringify({
        aud: project,
        iss: 'https://securetoken.google.com/' + project,
        sub: uid,
        exp: Math.floor(Date.now() / 1000) + 3600
      })
    ).toString('base64url') +
    '.s'
  );
}

function req(path, { method = 'POST', uid = '', body } = {}) {
  const headers = { Origin: 'https://trungxemcode.github.io' };
  if (uid) headers.Authorization = 'Bearer ' + token(uid);
  const init = { method, headers };
  if (method !== 'GET' && body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return new Request('https://worker.test' + path, init);
}

test('AdminPortalCore validates URLs, normalizes manifest and checks 3-tier access', () => {
  assert.equal(Core.validateHttpsUrl('https://drive.google.com/file/d/abc').valid, true);
  assert.equal(Core.validateHttpsUrl('http://example.com').valid, false);
  assert.equal(Core.validateHttpsUrl('javascript:alert(1)').valid, false);
  assert.equal(Core.validateHttpsUrl('./drive-exam-data.json.gz', { allowRelative: true }).valid, true);

  const raw = {
    version: 2,
    endpoints: {
      examManifestUrl: 'javascript:evil()',
      driveExamDataUrl: 'https://cdn.example.com/drive.json.gz',
      musicCloudEndpoint: 'https://music.example.workers.dev'
    },
    features: { 'music-play': 'vip', podcast: 'hidden' },
    exams: [
      { id: 'ex-1', level: 4, title: 'Đề VIP', provider: 'drive', url: 'https://drive.google.com/1', access: 'vip' },
      { id: 'ex-1', level: 4, title: 'Trùng ID', provider: 'drive', url: 'https://drive.google.com/2', access: 'public' }
    ],
    music: [
      { title: 'Bad', url: 'http://insecure.example.com/a.mp3', access: 'public' },
      { title: 'Good', artist: 'Singer', level: 2, url: 'https://youtu.be/dQw4w9WgXcQ', access: 'vip' }
    ],
    podcasts: [
      { title: 'Ep 1', level: 3, youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', subtitleText: '0:00 Hi', access: 'public' }
    ],
    documents: [
      { title: 'PDF', level: 5, kind: 'pdf', url: 'https://example.com/hsk5.pdf', access: 'hidden' }
    ]
  };

  const normalized = Core.normalizeManifest(raw);
  assert.equal(normalized.endpoints.examManifestUrl, '');
  assert.equal(normalized.endpoints.driveExamDataUrl, 'https://cdn.example.com/drive.json.gz');
  assert.equal(normalized.endpoints.musicCloudEndpoint, 'https://music.example.workers.dev');
  assert.equal(normalized.exams.length, 1);
  assert.equal(normalized.music.length, 1);
  assert.equal(normalized.podcasts.length, 1);
  assert.equal(normalized.documents[0].access, 'hidden');

  // Alias 'music' maps to 'music-play'
  assert.equal(Core.getFeatureAccess(normalized, 'music'), 'vip');
  assert.equal(Core.getFeatureAccess(normalized, 'podcast'), 'hidden');

  // Regular vs VIP vs Admin permissions
  assert.deepEqual(Core.canLearnerAccess('public', 'regular'), { allowed: true, reason: 'ok', access: 'public' });
  assert.deepEqual(Core.canLearnerAccess('vip', 'regular'), { allowed: false, reason: 'vip-required', access: 'vip' });
  assert.deepEqual(Core.canLearnerAccess('vip', 'vip'), { allowed: true, reason: 'ok', access: 'vip' });
  assert.deepEqual(Core.canLearnerAccess('vip', 'admin'), { allowed: true, reason: 'ok', access: 'vip' });
  assert.deepEqual(Core.canLearnerAccess('hidden', 'vip'), { allowed: false, reason: 'hidden', access: 'hidden' });
});

test('accountRoleControl persists admin resource manifest only for OWNER_UID', async () => {
  const s = store();
  const empty = await (await accountRoleControl(s, { action: 'roles-resources-get', actor: 'public' })).json();
  assert.equal(empty.manifest, null);

  const forbidden = await accountRoleControl(s, {
    action: 'roles-resources-set',
    actor: 'not-admin',
    manifest: Core.createDefaultManifest()
  });
  assert.equal(forbidden.status, 403);

  const badUrl = Core.createDefaultManifest();
  badUrl.documents.push({ id: 'd1', title: 'Bad', level: 1, kind: 'pdf', url: 'http://bad.test/a.pdf', access: 'public' });
  const badRes = await accountRoleControl(s, { action: 'roles-resources-set', actor: OWNER_UID, manifest: badUrl });
  assert.equal(badRes.status, 400);

  const okManifest = Core.createDefaultManifest();
  okManifest.documents.push({ id: 'd1', title: 'HSK 1 PDF', level: 1, kind: 'pdf', url: 'https://example.com/hsk1.pdf', access: 'vip' });
  const saved = await accountRoleControl(s, { action: 'roles-resources-set', actor: OWNER_UID, manifest: okManifest }, 1700000000000);
  assert.equal(saved.status, 200);
  const savedJson = await saved.json();
  assert.equal(savedJson.manifest.updatedAt, 1700000000000);
  assert.equal(savedJson.manifest.updatedBy, OWNER_EMAIL);

  const loaded = await (await accountRoleControl(s, { action: 'roles-resources-get', actor: 'public' })).json();
  assert.equal(loaded.manifest.documents[0].title, 'HSK 1 PDF');
});

test('bundled Worker /resources-manifest and /admin/resources enforce auth and round-trip manifest', async () => {
  const s = store();
  const env = { AI_ACCOUNT_ROLES_ENABLED: 'true', FIREBASE_API_KEY: 'fake', AI_CONTROL: binding(s) };
  let authUid = 'learner-1';
  const handler = createHandler(async (u) => {
    if (String(u).includes('identitytoolkit')) {
      return Response.json({ users: [{ localId: authUid, email: authUid + '@test.invalid' }] });
    }
    return Response.json({});
  });

  // Public GET works unauthenticated
  const pub0 = await handler(req('/resources-manifest', { method: 'GET' }), env);
  assert.equal(pub0.status, 200);
  assert.equal((await pub0.json()).manifest, null);

  // Unauthenticated /admin/resources -> 401
  const noAuth = await handler(req('/admin/resources', { body: { manifest: Core.createDefaultManifest() } }), env);
  assert.equal(noAuth.status, 401);

  // Non-owner authenticated -> 403
  const nonAdmin = await handler(req('/admin/resources', { uid: 'learner-1', body: { manifest: Core.createDefaultManifest() } }), env);
  assert.equal(nonAdmin.status, 403);

  // Owner authenticated with invalid URL -> 400
  authUid = OWNER_UID;
  const bad = Core.createDefaultManifest();
  bad.music.push({ id: 'm1', title: 'Bad', url: 'javascript:alert(1)', access: 'public' });
  const badPublish = await handler(req('/admin/resources', { uid: OWNER_UID, body: { manifest: bad } }), env);
  assert.equal(badPublish.status, 400);

  // Owner authenticated with valid manifest -> 200 and visible on GET + POST /resources-manifest
  const good = Core.createDefaultManifest();
  good.features['sentence-editor'] = 'vip';
  good.podcasts.push({ id: 'p1', title: 'Podcast HSK 3', level: 3, youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ', access: 'vip' });
  const okPublish = await handler(req('/admin/resources', { uid: OWNER_UID, body: { manifest: good } }), env);
  assert.equal(okPublish.status, 200);

  const pub1 = await handler(req('/resources-manifest', { method: 'GET' }), env);
  assert.equal(pub1.status, 200);
  const pub1Json = await pub1.json();
  assert.equal(pub1Json.manifest.features['sentence-editor'], 'vip');
  assert.equal(pub1Json.manifest.podcasts.length, 9);
  assert.ok(pub1Json.manifest.podcasts.some((p) => p.title === 'Podcast HSK 3'));
});

test('AdminPortalCore preserves channel metadata and Worker allows >500 batch-imported podcasts up to 1500', async () => {
  const s = store();
  const env = { AI_ACCOUNT_ROLES_ENABLED: 'true', FIREBASE_API_KEY: 'fake', AI_CONTROL: binding(s) };
  const handler = createHandler(async (u) => {
    if (String(u).includes('identitytoolkit')) {
      return Response.json({ users: [{ localId: OWNER_UID, email: OWNER_EMAIL }] });
    }
    return Response.json({});
  });

  const many = Core.createDefaultManifest();
  many.podcasts = Array.from({ length: 620 }, (_, i) => ({
    id: `yt-batch-${i}`,
    title: `HSK 4 Tập ${i + 1}`,
    level: 4,
    youtubeUrl: `https://www.youtube.com/watch?v=vid${String(i).padStart(8, '0')}`,
    subtitleText: '',
    access: 'public',
    channel: 'Kênh Mẫu',
    channelHandle: '@KenhMau',
    durationLabel: '12:30',
    note: 'Kênh @KenhMau · 12:30'
  }));

  const normalized = Core.normalizeManifest(many);
  assert.equal(normalized.podcasts.length, 620);
  assert.equal(normalized.podcasts[0].channelHandle, '@KenhMau');
  assert.equal(normalized.podcasts[0].durationLabel, '12:30');

  const okBatch = await handler(req('/admin/resources', { uid: OWNER_UID, body: { manifest: normalized } }), env);
  assert.equal(okBatch.status, 200);

  const loaded = await (await handler(req('/resources-manifest', { method: 'GET' }), env)).json();
  assert.equal(loaded.manifest.podcasts.length, 620);

  // Over the 1500 limit still fails closed with 400
  const tooMany = Core.createDefaultManifest();
  tooMany.podcasts = Array.from({ length: 1501 }, (_, i) => ({
    id: `yt-over-${i}`,
    title: `Tập ${i}`,
    level: 3,
    youtubeUrl: `https://www.youtube.com/watch?v=ovr${String(i).padStart(8, '0')}`,
    access: 'public'
  }));
  const rejected = await handler(req('/admin/resources', { uid: OWNER_UID, body: { manifest: tooMany } }), env);
  assert.equal(rejected.status, 400);
});
