import test from 'node:test';
import assert from 'node:assert/strict';
import podcastCore from '../src/modules/podcast/podcast-core.js';
import { createHandler as createBundledHandler } from './translator-worker-bundled.mjs';

const origin = 'https://trungxemcode.github.io';
const env = { GEMINI_API_KEY: 'test-gemini-secret', FIREBASE_API_KEY: 'test-firebase-secret' };
const project = 'hsk-flashcards-44631';
const now = Date.now();
const claims = { aud: project, iss: `https://securetoken.google.com/${project}`, sub: 'podcast-tester', exp: Math.floor(now / 1000) + 3600 };
const token = `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;

test('HSKPodcastCore extracts YouTube IDs across standard URL formats', () => {
  assert.equal(podcastCore.extractYoutubeId('https://www.youtube.com/watch?v=S_0mP1hQ7qY&t=12s'), 'S_0mP1hQ7qY');
  assert.equal(podcastCore.extractYoutubeId('https://youtu.be/M7lc1UVf-VE?si=abc'), 'M7lc1UVf-VE');
  assert.equal(podcastCore.extractYoutubeId('https://www.youtube.com/shorts/aqz-KE-bpKQ'), 'aqz-KE-bpKQ');
  assert.equal(podcastCore.extractYoutubeId('LXb3EKWsInQ'), 'LXb3EKWsInQ');
  assert.equal(podcastCore.extractYoutubeId('not-a-valid-url'), '');
});

test('HSKPodcastCore starter episodes cover HSK 1-6 with synced 4-layer cues from the 2 YouTube channels', () => {
  assert.equal(podcastCore.STARTER_EPISODES.length, 8);
  assert.equal(podcastCore.DEFAULT_CHANNELS.length, 2);
  assert.equal(podcastCore.extractYoutubeChannelKey('@LearnChineseThroughPodcast')?.channelId, 'UCI8Liuxdz6UPv5rgMskfwPg');
  assert.equal(podcastCore.extractYoutubeChannelKey('https://www.youtube.com/@BaoBaoMandarin')?.channelId, 'UCYHKAec4JjyR_DC2obXv1Yg');
  assert.equal(podcastCore.inferHskLevelFromTitle('HSK 1–3 | 会 VS 要 VS 能').levelGroup, 'hsk1-2');
  assert.equal(podcastCore.inferHskLevelFromTitle('HSK 3–5 | 中国短剧有什么好看的？').levelGroup, 'hsk4');
  assert.equal(podcastCore.toSimplifiedChinese('歡迎來到寶寶中文，請問這家餐廳怎麼走？'), '欢迎来到宝宝中文，请问这家餐厅怎么走？');

  for (const ep of podcastCore.STARTER_EPISODES) {
    assert.ok(ep.cues.length >= 5);
    assert.ok(ep.channelHandle === '@BaoBaoMandarin' || ep.channelHandle === '@LearnChineseThroughPodcast');
    for (const cue of ep.cues) {
      assert.ok(cue.end > cue.start);
      assert.ok(cue.zh.length > 0 && cue.pinyin.length > 0 && cue.vi.length > 0 && cue.en.length > 0);
    }
  }
});

test('HSKPodcastCore parses SRT, VTT, LRC, YouTube transcript and JSON subtitles', () => {
  const srt = `1
00:00:01,500 --> 00:00:04,000
Hello world!

2
00:00:04,500 --> 00:00:08,200
How are you doing today?`;
  const srtCues = podcastCore.parseSubtitleText(srt);
  assert.equal(srtCues.length, 2);
  assert.equal(srtCues[0].start, 1.5);
  assert.equal(srtCues[0].end, 4);
  assert.equal(srtCues[1].en, 'How are you doing today?');

  const vtt = `WEBVTT
Kind: captions
Language: en

00:02.000 --> 00:05.500
<i>Welcome</i> to Mandarin Lab`;
  const vttCues = podcastCore.parseSubtitleText(vtt);
  assert.equal(vttCues.length, 1);
  assert.equal(vttCues[0].en, 'Welcome to Mandarin Lab');

  const lrc = `[00:03.20] First line\n[00:08.50] Second line`;
  const lrcCues = podcastCore.parseSubtitleText(lrc);
  assert.equal(lrcCues.length, 2);
  assert.equal(lrcCues[0].end, 8.5);

  const ytTranscript = `0:05\nGood morning friends\n0:12\nLet us practice listening`;
  const ytCues = podcastCore.parseSubtitleText(ytTranscript);
  assert.equal(ytCues.length, 2);
  assert.equal(ytCues[0].start, 5);
  assert.equal(ytCues[1].start, 12);
});

test('HSKPodcastCore segments Chinese tokens, locates active cues, and enriches offline cues', () => {
  const dict = [
    { han: '早饭', pin: 'zǎofàn', mean: 'bữa sáng', hsk: 2 },
    { han: '咖啡', pin: 'kāfēi', mean: 'cà phê', hsk: 2 },
    { han: '早上好', pin: 'zǎoshang hǎo', mean: 'chào buổi sáng', hsk: 1 }
  ];
  const tokens = podcastCore.segmentChineseLine('早上好！喝咖啡吃早饭。', dict);
  const hanWords = tokens.filter((t) => t.isHan).map((t) => t.text);
  assert.ok(hanWords.includes('早上好'));
  assert.ok(hanWords.includes('咖啡'));
  assert.ok(hanWords.includes('早饭'));

  const cues = podcastCore.STARTER_EPISODES[0].cues;
  assert.equal(podcastCore.findActiveCueIndex(cues, 0), 0);
  assert.equal(podcastCore.findActiveCueIndex(cues, 14), 1);
  assert.equal(podcastCore.findActiveCueIndex(cues, 18), 2);
  assert.equal(podcastCore.findActiveCueIndex(cues, 999), -1);

  const local = podcastCore.enrichCuesLocal([{ start: 0, end: 4, en: 'Drink coffee for breakfast' }], { wordsList: dict });
  assert.match(local[0].vi, /Drink coffee/);
});

for (const [label, makeHandler] of [
  ['translator-worker-bundled.mjs', createBundledHandler]
]) {
  test(`${label} handles podcast-subtitles pasted English SRT without requiring Han chars`, async () => {
    const geminiCalls = [];
    const handler = makeHandler(async (url, req) => {
      if (String(url).includes('identitytoolkit.googleapis.com')) {
        return Response.json({ users: [{ localId: 'podcast-tester' }] });
      }
      geminiCalls.push(JSON.parse(req.body));
      return Response.json({
        modelVersion: 'gemini-test',
        candidates: [{
          finishReason: 'STOP',
          content: {
            parts: [{
              text: JSON.stringify({
                titleVi: 'Thói quen buổi sáng',
                summaryVi: 'Dịch từ phụ đề tiếng Anh.',
                cues: [{
                  start: 0,
                  end: 4.5,
                  zh: '大家早上好，今天聊早起。',
                  pinyin: 'Dàjiā zǎoshang hǎo, jīntiān liáo zǎoqǐ.',
                  vi: 'Chào buổi sáng mọi người, hôm nay nói về việc dậy sớm.',
                  en: 'Good morning everyone, today we talk about waking up early.'
                }]
              })
            }]
          }
        }]
      });
    }, () => now);

    const res = await handler(
      new Request('https://worker.test/lesson-ask', {
        method: 'POST',
        headers: { Origin: origin, Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          hsk: 3,
          question: '0-4.5 | Good morning everyone, today we talk about waking up early.',
          history: [],
          lesson: {
            id: 'podcast-demo',
            title: 'Morning Podcast',
            words: [],
            content: { mode: 'podcast-subtitles', youtubeId: 'S_0mP1hQ7qY', sourceType: 'pasted-transcript' }
          }
        })
      }),
      env
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.sourceType, 'pasted-transcript');
    assert.equal(data.podcastSubtitles.cues[0].zh, '大家早上好，今天聊早起。');
    assert.equal(data.podcastSubtitles.cues[0].vi, 'Chào buổi sáng mọi người, hôm nay nói về việc dậy sớm.');
    assert.equal(geminiCalls.length, 1);

    const tooLong = await handler(
      new Request('https://worker.test/lesson-ask', {
        method: 'POST',
        headers: { Origin: origin, Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          hsk: 3,
          question: 'a'.repeat(12001),
          history: [],
          lesson: { id: 'podcast-demo', title: 'Long', words: [], content: { mode: 'podcast-subtitles' } }
        })
      }),
      env
    );
    assert.equal(tooLong.status, 400);
  });

  test(`${label} auto-fetches YouTube CC and returns YOUTUBE_CC_UNAVAILABLE when none exist`, async () => {
    const noCcHandler = makeHandler(async (url) => {
      if (String(url).includes('identitytoolkit.googleapis.com')) {
        return Response.json({ users: [{ localId: 'podcast-tester' }] });
      }
      if (String(url).includes('youtube.com/watch')) {
        return new Response('<html><title>Hardsub Only Video</title></html>', { status: 200 });
      }
      if (String(url).includes('youtube.com/api/timedtext')) {
        return new Response('<transcript_list></transcript_list>', { status: 200 });
      }
      throw new Error(`Unexpected call to ${url}`);
    }, () => now);

    const noCcRes = await noCcHandler(
      new Request('https://worker.test/lesson-ask', {
        method: 'POST',
        headers: { Origin: origin, Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          hsk: 3,
          question: 'YOUTUBE_AUTO_CC:M7lc1UVf-VE',
          history: [],
          lesson: { id: 'podcast-yt', title: 'Hardsub Only', words: [], content: { mode: 'podcast-subtitles', youtubeId: 'M7lc1UVf-VE', sourceType: 'youtube-url' } }
        })
      }),
      env
    );
    assert.equal(noCcRes.status, 422);
    const noCcData = await noCcRes.json();
    assert.equal(noCcData.code, 'YOUTUBE_CC_UNAVAILABLE');

    let geminiSawCc = '';
    const withCcHandler = makeHandler(async (url, req) => {
      const s = String(url);
      if (s.includes('identitytoolkit.googleapis.com')) {
        return Response.json({ users: [{ localId: 'podcast-tester' }] });
      }
      if (s.includes('youtube.com/watch')) {
        const tracks = [{ languageCode: 'en', baseUrl: 'https://www.youtube.com/api/timedtext?v=M7lc1UVf-VE&lang=en' }];
        return new Response(`<html>"captionTracks":${JSON.stringify(tracks)},</html>`, { status: 200 });
      }
      if (s.includes('youtube.com/api/timedtext')) {
        return Response.json({ events: [{ tStartMs: 2500, dDurationMs: 3000, segs: [{ utf8: 'Welcome to our podcast' }] }] });
      }
      const parsedBody = JSON.parse(req.body);
      geminiSawCc = parsedBody.contents[0].parts[0].text;
      return Response.json({
        candidates: [{
          finishReason: 'STOP',
          content: {
            parts: [{
              text: JSON.stringify({
                titleVi: 'Podcast YouTube',
                summaryVi: 'Tự động lấy CC.',
                cues: [{ start: 2.5, end: 5.5, zh: '欢迎收听我们的播客。', pinyin: 'Huānyíng shōutīng wǒmen de bōkè.', vi: 'Chào mừng đến với podcast của chúng tôi.', en: 'Welcome to our podcast' }]
              })
            }]
          }
        }]
      });
    }, () => now);

    const withCcRes = await withCcHandler(
      new Request('https://worker.test/lesson-ask', {
        method: 'POST',
        headers: { Origin: origin, Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          hsk: 3,
          question: 'YOUTUBE_AUTO_CC:M7lc1UVf-VE',
          history: [],
          lesson: { id: 'podcast-yt', title: 'With CC', words: [], content: { mode: 'podcast-subtitles', youtubeId: 'M7lc1UVf-VE', sourceType: 'youtube-url' } }
        })
      }),
      env
    );
    assert.equal(withCcRes.status, 200);
    const withCcData = await withCcRes.json();
    assert.equal(withCcData.sourceType, 'youtube-cc');
    assert.match(geminiSawCc, /Welcome to our podcast/);
  });

  test(`${label} serves public GET /podcast-feed and GET /podcast-captions for the 2 YouTube channels`, async () => {
    const mockHandler = makeHandler(async (url) => {
      const s = String(url);
      if (s.includes('channel_id=UCI8Liuxdz6UPv5rgMskfwPg')) {
        return new Response(`
          <feed>
            <entry><yt:videoId>aYrCe-KTmTg</yt:videoId><title>HSK 2 - 4 | Natural Greetings</title><published>2026-11-10T10:00:00+00:00</published></entry>
            <entry><yt:videoId>live1234567</yt:videoId><title>[LIVE] 24/7 Practice Stream</title><published>2026-11-11T10:00:00+00:00</published></entry>
          </feed>
        `, { status: 200 });
      }
      if (s.includes('channel_id=UCYHKAec4JjyR_DC2obXv1Yg')) {
        return new Response(`
          <feed>
            <entry><yt:videoId>hhkIZ3gOIcs</yt:videoId><title>HSK 1–3 | 会 VS 要 VS 能</title><published>2026-11-12T10:00:00+00:00</published></entry>
          </feed>
        `, { status: 200 });
      }
      if (s.includes('youtubei/v1/player')) {
        return Response.json({
          videoDetails: { title: 'HSK 1–3 | 会 VS 要 VS 能', author: 'BaoBao Mandarin', lengthSeconds: '1162' },
          captions: {
            playerCaptionsTracklistRenderer: {
              captionTracks: [
                { languageCode: 'zh-HK', baseUrl: 'https://www.youtube.com/api/timedtext?v=hhkIZ3gOIcs&lang=zh-HK' },
                { languageCode: 'zh-TW', baseUrl: 'https://www.youtube.com/api/timedtext?v=hhkIZ3gOIcs&lang=zh-TW' },
                { languageCode: 'vi', baseUrl: 'https://www.youtube.com/api/timedtext?v=hhkIZ3gOIcs&lang=vi' }
              ]
            }
          }
        });
      }
      if (s.includes('lang=zh-TW')) {
        return new Response('<timedtext format="3"><body><p t="6900" d="5800">寶貝們，大家好！</p><p t="12700" d="4100">我是小明。</p></body></timedtext>', { status: 200 });
      }
      if (s.includes('lang=vi')) {
        return new Response('<timedtext format="3"><body><p t="6900" d="5800">Xin chào các Bảo Bối!</p><p t="12700" d="4100">Mình là Tiểu Minh.</p></body></timedtext>', { status: 200 });
      }
      throw new Error(`Unexpected URL ${s}`);
    }, () => now);

    const feedRes = await mockHandler(
      new Request('https://worker.test/podcast-feed?channel=all', { method: 'GET', headers: { Origin: origin } }),
      env
    );
    assert.equal(feedRes.status, 200);
    const feedData = await feedRes.json();
    assert.equal(feedData.ok, true);
    assert.equal(feedData.episodes.length, 2);
    assert.equal(feedData.episodes[0].youtubeId, 'hhkIZ3gOIcs');
    assert.equal(feedData.episodes[1].youtubeId, 'aYrCe-KTmTg');

    const capRes = await mockHandler(
      new Request('https://worker.test/podcast-captions?v=hhkIZ3gOIcs', { method: 'GET', headers: { Origin: origin } }),
      env
    );
    assert.equal(capRes.status, 200);
    const capData = await capRes.json();
    assert.equal(capData.ok, true);
    assert.equal(capData.languages.zh, 'zh-TW');
    assert.equal(capData.languages.vi, 'vi');
    assert.equal(capData.cues.length, 2);
    assert.equal(capData.cues[0].zh, '寶貝們，大家好！');
    assert.equal(capData.cues[0].vi, 'Xin chào các Bảo Bối!');
  });
}
