(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.HSKPodcastCore = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const STARTER_EPISODES = [
    {
      id: 'ep-morning-coffee',
      youtubeId: 'S_0mP1hQ7qY',
      level: 'HSK 1–2',
      levelGroup: 'hsk1-2',
      title: 'Morning Coffee & Daily Routine',
      titleVi: 'Cà phê sáng & thói quen mỗi ngày (Podcast nhập môn)',
      channel: 'Slow Chinese Café',
      durationSec: 36,
      durationLabel: '0:36',
      topic: 'Đời sống hằng ngày',
      note: 'Tập mẫu minh họa video có phụ đề tiếng Anh đốt cứng ở đáy khung hình — bật lớp che phụ đề để chỉ luyện nghe và đọc Hán · Pinyin · Tiếng Việt.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cues: [
        {
          start: 0,
          end: 6,
          en: 'Good morning everyone, welcome back to our slow podcast.',
          zh: '大家好，早上好，欢迎来到今天的慢速播客。',
          pinyin: 'Dàjiā hǎo, zǎoshang hǎo, huānyíng láidào jīntiān de mànsù bōkè.',
          vi: 'Chào mọi người, chào buổi sáng, chào mừng đến với podcast tốc độ chậm hôm nay.'
        },
        {
          start: 6,
          end: 12,
          en: 'Every morning I wake up at seven and drink a cup of hot coffee.',
          zh: '每天早上我七点起床，然后喝一杯热咖啡。',
          pinyin: 'Měitiān zǎoshang wǒ qī diǎn qǐchuáng, ránhòu hē yì bēi rè kāfēi.',
          vi: 'Mỗi sáng tôi thức dậy lúc bảy giờ, sau đó uống một tách cà phê nóng.'
        },
        {
          start: 12,
          end: 18,
          en: 'Sometimes I listen to Chinese news while eating breakfast.',
          zh: '有时候我一边吃早饭，一边听中文新闻。',
          pinyin: 'Yǒu shíhou wǒ yìbiān chī zǎofàn, yìbiān tīng Zhōngwén xīnwén.',
          vi: 'Đôi khi tôi vừa ăn sáng vừa nghe tin tức tiếng Trung.'
        },
        {
          start: 18,
          end: 24,
          en: 'Today the weather is very sunny and warm outside.',
          zh: '今天外面的天气很晴朗，也很暖和。',
          pinyin: 'Jīntiān wàimiàn de tiānqì hěn qínglǎng, yě hěn nuǎnhuo.',
          vi: 'Hôm nay thời tiết bên ngoài rất nắng đẹp và ấm áp.'
        },
        {
          start: 24,
          end: 30,
          en: 'What do you usually do before going to work or school?',
          zh: '你上班或者上学以前通常做什么？',
          pinyin: 'Nǐ shàngbān huòzhě shàngxué yǐqián tōngcháng zuò shénme?',
          vi: 'Trước khi đi làm hoặc đi học bạn thường làm gì?'
        },
        {
          start: 30,
          end: 36,
          en: 'Leave a short comment in Chinese and practice with me.',
          zh: '欢迎用中文留言，和我一起练习口语。',
          pinyin: 'Huānyíng yòng Zhōngwén liúyán, hé wǒ yìqǐ liànxí kǒuyǔ.',
          vi: 'Hãy để lại bình luận bằng tiếng Trung và luyện nói cùng mình nhé.'
        }
      ]
    },
    {
      id: 'ep-weekend-travel',
      youtubeId: 'M7lc1UVf-VE',
      level: 'HSK 3',
      levelGroup: 'hsk3',
      title: 'Weekend Train Trip Dialogue',
      titleVi: 'Chuyến tàu cuối tuần & cách hỏi đường',
      channel: 'Mandarin Journey',
      durationSec: 40,
      durationLabel: '0:40',
      topic: 'Du lịch & giao tiếp',
      note: 'Hội thoại tốc độ vừa với các mẫu câu di chuyển, đặt vé tàu và rủ bạn bè đi dạo cuối tuần.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cues: [
        {
          start: 0,
          end: 7,
          en: 'This weekend I plan to take the high-speed train to Hangzhou.',
          zh: '这个周末我打算坐高铁去杭州玩几天。',
          pinyin: 'Zhège zhōumò wǒ dǎsuàn zuò gāotiě qù Hángzhōu wán jǐ tiān.',
          vi: 'Cuối tuần này tôi định đi tàu cao tốc tới Hàng Châu chơi vài ngày.'
        },
        {
          start: 7,
          end: 14,
          en: 'Did you already book your ticket and reserve a quiet hotel?',
          zh: '你已经买好车票，订好安静的酒店了吗？',
          pinyin: 'Nǐ yǐjīng mǎihǎo chēpiào, dìnghǎo ānjìng de jiǔdiàn le ma?',
          vi: 'Bạn đã mua vé tàu và đặt khách sạn yên tĩnh chưa?'
        },
        {
          start: 14,
          end: 21,
          en: 'Yes, the hotel is very close to the subway station and West Lake.',
          zh: '买好了，酒店离地铁站和西湖都非常近。',
          pinyin: 'Mǎihǎo le, jiǔdiàn lí dìtiězhàn hé Xīhú dōu fēicháng jìn.',
          vi: 'Mua xong rồi, khách sạn rất gần ga tàu điện ngầm và Tây Hồ.'
        },
        {
          start: 21,
          end: 28,
          en: 'Remember to bring an umbrella because it might rain in the afternoon.',
          zh: '记得带一把雨伞，因为下午可能会下雨。',
          pinyin: 'Jìde dài yì bǎ yǔsǎn, yīnwèi xiàwǔ kěnéng huì xiàyǔ.',
          vi: 'Nhớ mang theo một chiếc ô vì buổi chiều có thể sẽ mưa.'
        },
        {
          start: 28,
          end: 40,
          en: 'No problem, let us meet at the east entrance at eight tomorrow morning.',
          zh: '没问题，我们明天早上八点在东门见面吧。',
          pinyin: 'Méi wèntí, wǒmen míngtiān zǎoshang bā diǎn zài dōngmén jiànmiàn ba.',
          vi: 'Không vấn đề gì, sáng mai tám giờ chúng ta gặp nhau ở cổng đông nhé.'
        }
      ]
    },
    {
      id: 'ep-digital-focus',
      youtubeId: 'aqz-KE-bpKQ',
      level: 'HSK 4',
      levelGroup: 'hsk4',
      title: 'How to Stay Focused Without Social Media',
      titleVi: 'Giữ sự tập trung trong thời đại mạng xã hội',
      channel: 'Mindful Talk Studio',
      durationSec: 42,
      durationLabel: '0:42',
      topic: 'Thói quen & công việc',
      note: 'Luyện nghe câu ghép biểu đạt nguyên nhân — kết quả và từ vựng chủ đề công việc, thói quen số.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 24,
      cues: [
        {
          start: 0,
          end: 8,
          en: 'Have you noticed how easily short videos steal our attention?',
          zh: '你有没有发现，短视频很容易分散我们的注意力？',
          pinyin: 'Nǐ yǒu méiyǒu fāxiàn, duǎn shìpín hěn róngyì fēnsàn wǒmen de zhùyìlì?',
          vi: 'Bạn có nhận ra rằng video ngắn rất dễ làm phân tán sự chú ý của chúng ta không?'
        },
        {
          start: 8,
          end: 16,
          en: 'When we check messages every few minutes, deep thinking becomes hard.',
          zh: '如果每隔几分钟就看一次手机，就很难进行深入思考。',
          pinyin: 'Rúguǒ měi gé jǐ fēnzhōng jiù kàn yí cì shǒujī, jiù hěn nán jìnxíng shēnrù sīkǎo.',
          vi: 'Nếu cứ cách vài phút lại xem điện thoại một lần thì rất khó suy nghĩ sâu.'
        },
        {
          start: 16,
          end: 25,
          en: 'One simple habit is turning off non-urgent notifications before studying.',
          zh: '一个简单的方法是在学习前关掉不必要的通知提醒。',
          pinyin: 'Yí gè jiǎndān de fāngfǎ shì zài xuéxí qián guāndiào bú bìyào de tōngzhī tíxǐng.',
          vi: 'Một cách đơn giản là tắt các thông báo không cần thiết trước khi học.'
        },
        {
          start: 25,
          end: 34,
          en: 'Even twenty-five minutes of quiet focus can double your efficiency.',
          zh: '哪怕只专注二十五分钟，你的学习效率也会提高很多。',
          pinyin: 'Nǎpà zhǐ zhuānzhù èrshíwǔ fēnzhōng, nǐ de xuéxí xiàolǜ yě huì tígāo hěn duō.',
          vi: 'Dù chỉ tập trung hai mươi lăm phút, hiệu suất học tập của bạn cũng sẽ tăng lên rất nhiều.'
        },
        {
          start: 34,
          end: 42,
          en: 'Try putting your phone in another room tonight and feel the difference.',
          zh: '今晚试着把手机放在另一个房间，感受一下变化吧。',
          pinyin: 'Jīnwǎn shìzhe bǎ shǒujī fàng zài lìng yí gè fángjiān, gǎnshòu yíxià biànhuà ba.',
          vi: 'Tối nay hãy thử để điện thoại sang phòng khác và cảm nhận sự khác biệt nhé.'
        }
      ]
    },
    {
      id: 'ep-ai-culture-talk',
      youtubeId: 'LXb3EKWsInQ',
      level: 'HSK 5–6',
      levelGroup: 'hsk5-6',
      title: 'Lifelong Learning & Cultural Curiosity',
      titleVi: 'Học tập suốt đời & tư duy đa văn hóa',
      channel: 'Deep Listening Lab',
      durationSec: 44,
      durationLabel: '0:44',
      topic: 'Văn hóa & tư duy',
      note: 'Podcast nâng cao về cách tiếp thu ngôn ngữ tự nhiên qua ngữ cảnh thay vì học vẹt danh sách từ rời rạc.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 24,
      cues: [
        {
          start: 0,
          end: 9,
          en: 'Real fluency rarely comes from memorizing isolated vocabulary lists.',
          zh: '真正的流利表达很少来自死记硬背孤立的单词表。',
          pinyin: 'Zhēnzhèng de liúlì biǎodá hěn shǎo láizì sǐjì-yìngbèi gūlì de dāncíbiǎo.',
          vi: 'Sự trôi chảy thực sự hiếm khi đến từ việc học vẹt những bảng từ vựng rời rạc.'
        },
        {
          start: 9,
          end: 18,
          en: 'When you hear an idea in an authentic story, the emotion anchors the phrase.',
          zh: '当你在真实的故事里听到一个观点时，情感会帮你记住这个表达。',
          pinyin: 'Dāng nǐ zài zhēnshí de gùshi lǐ tīngdào yí gè guāndiǎn shí, qínggǎn huì bāng nǐ jìzhù zhège biǎodá.',
          vi: 'Khi bạn nghe một quan điểm trong câu chuyện chân thực, cảm xúc sẽ giúp bạn ghi nhớ cách diễn đạt đó.'
        },
        {
          start: 18,
          end: 27,
          en: 'Covering familiar native subtitles forces your ears to notice rhythm and tone.',
          zh: '遮住熟悉的母语字幕，能迫使耳朵去捕捉语音节奏和声调变化。',
          pinyin: 'Zhēzhù shúxī de mǔyǔ zìmù, néng pòshǐ ěrduo qù bǔzhuō yǔyīn jiézòu hé shēngdiào biànhuà.',
          vi: 'Che đi phụ đề quen thuộc giúp buộc đôi tai phải nắm bắt nhịp điệu ngữ âm và biến đổi thanh điệu.'
        },
        {
          start: 27,
          end: 36,
          en: 'Pause whenever a sentence catches your curiosity and imitate the speaker aloud.',
          zh: '每当遇到令你好奇的句子，就暂停一下，大声模仿说话者的语气。',
          pinyin: 'Měidāng yùdào lìng nǐ hàoqí de jùzi, jiù zàntíng yíxià, dàshēng mófǎng shuōhuàzhě de yǔqì.',
          vi: 'Mỗi khi gặp câu khiến bạn tò mò, hãy tạm dừng một chút và bắt chước to ngữ khí của người nói.'
        },
        {
          start: 36,
          end: 44,
          en: 'Over time, listening transforms from translation work into direct understanding.',
          zh: '久而久之，听力就会从脑海里的翻译变成一种直接的理解。',
          pinyin: 'Jiǔ’érjiǔzhī, tīnglì jiù huì cóng nǎohǎi lǐ de fānyì biànchéng yì zhǒng zhíjiē de lǐjiě.',
          vi: 'Lâu dần, việc nghe hiểu sẽ chuyển từ quá trình dịch nhẩm trong đầu thành sự thấu hiểu trực tiếp.'
        }
      ]
    }
  ];

  const HAN_REGEX = /\p{Script=Han}/u;

  function extractYoutubeId(input) {
    const raw = String(input || '').trim();
    if (!raw) return '';
    if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
    try {
      const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      const u = new URL(normalized);
      const host = u.hostname.replace(/^www\./i, '').toLowerCase();
      if (host === 'youtu.be') {
        const seg = u.pathname.split('/').filter(Boolean)[0] || '';
        return /^[a-zA-Z0-9_-]{11}$/.test(seg) ? seg : '';
      }
      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com' || host === 'youtube-nocookie.com') {
        const v = u.searchParams.get('v') || '';
        if (/^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts.length >= 2 && ['embed', 'shorts', 'live', 'v'].includes(parts[0])) {
          const candidate = parts[1];
          return /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : '';
        }
      }
    } catch (_) {}
    const m = raw.match(/(?:v=|\/(?:embed|shorts|live|v)\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : '';
  }

  function roundSec(val) {
    const n = Number(val);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.round(n * 100) / 100;
  }

  function parseTimestampToSec(token) {
    const clean = String(token || '').trim().replace(',', '.').replace(/[\[\]]/g, '');
    if (!clean) return NaN;
    if (/^\d+(?:\.\d+)?$/.test(clean)) return Number(clean);
    const parts = clean.split(':');
    if (parts.length === 2) {
      const m = Number(parts[0]);
      const s = Number(parts[1]);
      if (Number.isFinite(m) && Number.isFinite(s)) return m * 60 + s;
    } else if (parts.length === 3) {
      const h = Number(parts[0]);
      const m = Number(parts[1]);
      const s = Number(parts[2]);
      if (Number.isFinite(h) && Number.isFinite(m) && Number.isFinite(s)) return h * 3600 + m * 60 + s;
    }
    return NaN;
  }

  function formatTimestamp(seconds) {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function cleanSubtitleLineText(str) {
    return String(str || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function assignFieldsFromText(cue, lineText) {
    const clean = cleanSubtitleLineText(lineText);
    if (!clean) return cue;
    if (clean.includes('|')) {
      const parts = clean.split('|').map((s) => s.trim()).filter(Boolean);
      for (const p of parts) {
        if (!cue.zh && HAN_REGEX.test(p)) cue.zh = p;
        else if (!cue.pinyin && /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(p)) cue.pinyin = p;
        else if (!cue.vi && /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i.test(p)) cue.vi = p;
        else if (!cue.en) cue.en = p;
        else if (!cue.vi) cue.vi = p;
      }
      return cue;
    }
    if (HAN_REGEX.test(clean)) {
      cue.zh = cue.zh ? `${cue.zh} ${clean}` : clean;
    } else if (/[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i.test(clean)) {
      cue.vi = cue.vi ? `${cue.vi} ${clean}` : clean;
    } else {
      cue.en = cue.en ? `${cue.en} ${clean}` : clean;
    }
    return cue;
  }

  function normalizePodcastCues(rawCues) {
    if (!Array.isArray(rawCues)) return [];
    const items = [];
    for (let i = 0; i < rawCues.length; i += 1) {
      const c = rawCues[i];
      if (!c || typeof c !== 'object') continue;
      let start = Number(c.start);
      if (!Number.isFinite(start) || start < 0) start = i * 4;
      let end = Number(c.end);
      if (!Number.isFinite(end) || end <= start) end = NaN;
      const zh = cleanSubtitleLineText(c.zh || c.han || (HAN_REGEX.test(c.text || '') ? c.text : ''));
      const pinyin = cleanSubtitleLineText(c.pinyin || c.pin || '');
      const vi = cleanSubtitleLineText(c.vi || c.vietnamese || c.meaning || '');
      let en = cleanSubtitleLineText(c.en || c.english || '');
      if (!zh && !vi && !en && c.text) en = cleanSubtitleLineText(c.text);
      if (!zh && !vi && !en) continue;
      items.push({
        start: roundSec(start),
        end: Number.isFinite(end) ? roundSec(end) : NaN,
        zh,
        pinyin,
        vi,
        en
      });
    }
    items.sort((a, b) => a.start - b.start);
    for (let i = 0; i < items.length; i += 1) {
      const cur = items[i];
      const next = items[i + 1];
      if (!Number.isFinite(cur.end) || cur.end <= cur.start) {
        if (next && next.start > cur.start) {
          cur.end = roundSec(Math.min(next.start, cur.start + 6));
        } else {
          cur.end = roundSec(cur.start + 4);
        }
      }
      if (cur.end <= cur.start) cur.end = roundSec(cur.start + 0.5);
    }
    return items;
  }

  function parseSubtitleText(rawInput) {
    const raw = String(rawInput || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
    if (!raw) return [];

    // 1. JSON array or { cues: [...] }
    if (raw.startsWith('[') || raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.cues) ? parsed.cues : null);
        if (list) return normalizePodcastCues(list);
      } catch (_) {}
    }

    // 2. SRT or WebVTT timing blocks
    const timeArrowRe = /^(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}\s*-->\s*(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}(?:\s+.*)?$/;
    const lines = raw.split('\n');
    if (lines.some((line) => timeArrowRe.test(line.trim()))) {
      const cues = [];
      let cur = null;
      for (let i = 0; i < lines.length; i += 1) {
        const t = lines[i].trim();
        if (!t) {
          if (cur) {
            cues.push(cur);
            cur = null;
          }
          continue;
        }
        if (t === 'WEBVTT' || /^NOTE\b/i.test(t) || /^STYLE\b/i.test(t) || /^Kind:/i.test(t) || /^Language:/i.test(t)) {
          continue;
        }
        if (/^\d+$/.test(t) && i + 1 < lines.length && timeArrowRe.test(lines[i + 1].trim())) {
          continue;
        }
        if (timeArrowRe.test(t)) {
          if (cur) cues.push(cur);
          const [left, rightWithPos] = t.split('-->');
          const right = (rightWithPos || '').trim().split(/\s+/)[0];
          const start = parseTimestampToSec(left);
          const end = parseTimestampToSec(right);
          cur = {
            start: Number.isFinite(start) ? start : cues.length * 4,
            end: Number.isFinite(end) ? end : NaN,
            zh: '',
            pinyin: '',
            vi: '',
            en: ''
          };
          continue;
        }
        if (cur) {
          assignFieldsFromText(cur, t);
        }
      }
      if (cur) cues.push(cur);
      return normalizePodcastCues(cues);
    }

    // 3. LRC lines: [mm:ss.xx] text
    const lrcRe = /^\[(\d{1,3}:\d{2}(?:[.:]\d{1,3})?)\]\s*(.+)$/;
    if (lines.some((line) => lrcRe.test(line.trim()))) {
      const cues = [];
      for (const rawLine of lines) {
        const m = rawLine.trim().match(lrcRe);
        if (!m) continue;
        const start = parseTimestampToSec(m[1]);
        if (!Number.isFinite(start)) continue;
        const cue = { start, end: NaN, zh: '', pinyin: '', vi: '', en: '' };
        assignFieldsFromText(cue, m[2]);
        cues.push(cue);
      }
      return normalizePodcastCues(cues);
    }

    // 4. YouTube transcript style: standalone timestamp line "0:05" / "1:02:05" or inline "0:05 Some text"
    const standaloneTsRe = /^(\d{1,2}:)?\d{1,2}:\d{2}$/;
    const inlineTsRe = /^((?:\d{1,2}:)?\d{1,2}:\d{2})\s+(?:\|\s*)?(.+)$/;
    const hasTsLines = lines.some((l) => standaloneTsRe.test(l.trim()) || inlineTsRe.test(l.trim()));
    if (hasTsLines) {
      const cues = [];
      let cur = null;
      for (const rawLine of lines) {
        const t = rawLine.trim();
        if (!t) continue;
        if (standaloneTsRe.test(t)) {
          if (cur && (cur.zh || cur.vi || cur.en)) cues.push(cur);
          cur = { start: parseTimestampToSec(t), end: NaN, zh: '', pinyin: '', vi: '', en: '' };
          continue;
        }
        const mInline = t.match(inlineTsRe);
        if (mInline) {
          if (cur && (cur.zh || cur.vi || cur.en)) cues.push(cur);
          cur = { start: parseTimestampToSec(mInline[1]), end: NaN, zh: '', pinyin: '', vi: '', en: '' };
          assignFieldsFromText(cur, mInline[2]);
          continue;
        }
        if (cur) {
          assignFieldsFromText(cur, t);
        }
      }
      if (cur && (cur.zh || cur.vi || cur.en)) cues.push(cur);
      return normalizePodcastCues(cues);
    }

    // 5. Piped lines or plain lines fallback (increment by 4s per line)
    const fallbackCues = [];
    for (let i = 0; i < lines.length; i += 1) {
      const t = lines[i].trim();
      if (!t) continue;
      const start = fallbackCues.length * 4;
      const cue = { start, end: start + 4, zh: '', pinyin: '', vi: '', en: '' };
      const rangePipe = t.match(/^(\d{1,2}:\d{2}(?:\.\d+)?)\s*[-–]\s*(\d{1,2}:\d{2}(?:\.\d+)?)\s*\|\s*(.+)$/);
      if (rangePipe) {
        cue.start = parseTimestampToSec(rangePipe[1]);
        cue.end = parseTimestampToSec(rangePipe[2]);
        assignFieldsFromText(cue, rangePipe[3]);
      } else {
        assignFieldsFromText(cue, t);
      }
      fallbackCues.push(cue);
    }
    return normalizePodcastCues(fallbackCues);
  }

  const dictIndexCache = new WeakMap();

  function buildDictionaryIndex(wordsList) {
    const list = Array.isArray(wordsList) ? wordsList : (Array.isArray(root?.words) ? root.words : []);
    if (!list.length) return { map: new Map(), maxLen: 1 };
    const cached = dictIndexCache.get(list);
    if (cached && cached.size === list.length) return cached.index;
    const map = new Map();
    let maxLen = 1;
    for (let i = 0; i < list.length; i += 1) {
      const item = list[i];
      const han = item && typeof item.han === 'string' ? item.han.trim() : '';
      if (!han) continue;
      if (!map.has(han)) {
        map.set(han, {
          han,
          pin: item.pin || item.pinyin || '',
          mean: item.mean || item.vi || '',
          hsk: item.hsk || item.level || ''
        });
      }
      if (han.length > maxLen) maxLen = Math.min(han.length, 6);
    }
    const index = { map, maxLen };
    dictIndexCache.set(list, { size: list.length, index });
    return index;
  }

  function segmentChineseLine(text, wordsList) {
    const str = String(text || '');
    if (!str) return [];
    const { map, maxLen } = buildDictionaryIndex(wordsList);
    const tokens = [];
    let i = 0;
    let nonHanBuf = '';

    function flushNonHan() {
      if (nonHanBuf) {
        tokens.push({ text: nonHanBuf, isHan: false, entry: null });
        nonHanBuf = '';
      }
    }

    while (i < str.length) {
      const ch = str[i];
      if (!HAN_REGEX.test(ch)) {
        nonHanBuf += ch;
        i += 1;
        continue;
      }
      flushNonHan();
      let matched = null;
      const upper = Math.min(maxLen, str.length - i);
      for (let len = upper; len >= 1; len -= 1) {
        const sub = str.slice(i, i + len);
        if (map.has(sub)) {
          matched = { text: sub, entry: map.get(sub) };
          break;
        }
      }
      if (matched) {
        tokens.push({ text: matched.text, isHan: true, entry: matched.entry });
        i += matched.text.length;
      } else {
        tokens.push({ text: ch, isHan: true, entry: null });
        i += 1;
      }
    }
    flushNonHan();
    return tokens;
  }

  function enrichCuesLocal(cues, options) {
    const opts = options || {};
    const wordsList = opts.wordsList || root?.words;
    const pinyinFn = typeof opts.pinyinFn === 'function'
      ? opts.pinyinFn
      : (typeof root?.pinyinPro?.pinyin === 'function'
        ? (txt) => root.pinyinPro.pinyin(txt, { toneType: 'symbol' })
        : null);

    const normalized = normalizePodcastCues(cues);
    return normalized.map((cue) => {
      const next = {
        start: cue.start,
        end: cue.end,
        zh: cue.zh || '',
        pinyin: cue.pinyin || '',
        vi: cue.vi || '',
        en: cue.en || ''
      };
      if (next.zh && (!next.pinyin || !next.vi)) {
        const tokens = segmentChineseLine(next.zh, wordsList);
        if (!next.pinyin && pinyinFn) {
          try {
            next.pinyin = cleanSubtitleLineText(pinyinFn(next.zh));
          } catch (_) {}
        }
        if (!next.pinyin) {
          const pinParts = tokens
            .filter((t) => t.isHan)
            .map((t) => t.entry?.pin || t.text)
            .filter(Boolean);
          if (pinParts.length) next.pinyin = pinParts.join(' ');
        }
        if (!next.vi) {
          const glossParts = tokens
            .filter((t) => t.isHan && t.entry?.mean)
            .map((t) => t.entry.mean.split(/[;,/]/)[0].trim())
            .filter(Boolean);
          if (glossParts.length) {
            next.vi = glossParts.join(' · ');
          } else if (next.en) {
            next.vi = `[Gợi ý EN] ${next.en}`;
          }
        }
      } else if (!next.vi && next.en) {
        next.vi = `[Chưa dịch AI · EN] ${next.en}`;
      }
      return next;
    });
  }

  function findActiveCueIndex(cues, currentSec) {
    if (!Array.isArray(cues) || !cues.length) return -1;
    const t = Number(currentSec);
    if (!Number.isFinite(t) || t < 0) return -1;
    for (let i = 0; i < cues.length; i += 1) {
      const c = cues[i];
      if (!c) continue;
      if (t >= c.start && t < c.end) return i;
    }
    return -1;
  }

  return {
    STARTER_EPISODES,
    extractYoutubeId,
    parseTimestampToSec,
    formatTimestamp,
    parseSubtitleText,
    normalizePodcastCues,
    enrichCuesLocal,
    findActiveCueIndex,
    segmentChineseLine
  };
});
