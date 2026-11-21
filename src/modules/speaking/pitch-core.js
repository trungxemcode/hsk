/* Tone pitch contour (YIN + Chao 5-level normalization), tone sandhi, and 16kHz WAV encoding.
   Pure module (works in browser via window.HSKPitchCore and in Node via module.exports). */
(function (root) {
  'use strict';

  const TONE_MARKS = {
    'ā': ['a', 1], 'á': ['a', 2], 'ǎ': ['a', 3], 'à': ['a', 4],
    'ē': ['e', 1], 'é': ['e', 2], 'ě': ['e', 3], 'è': ['e', 4],
    'ī': ['i', 1], 'í': ['i', 2], 'ǐ': ['i', 3], 'ì': ['i', 4],
    'ō': ['o', 1], 'ó': ['o', 2], 'ǒ': ['o', 3], 'ò': ['o', 4],
    'ū': ['u', 1], 'ú': ['u', 2], 'ǔ': ['u', 3], 'ù': ['u', 4],
    'ǖ': ['ü', 1], 'ǘ': ['ü', 2], 'ǚ': ['ü', 3], 'ǜ': ['ü', 4]
  };

  const TONE_NAMES = {
    1: 'Thanh 1 (55 · ngang cao)',
    2: 'Thanh 2 (35 · đi lên)',
    3: 'Thanh 3 (214 · trầm xuống rồi lên)',
    4: 'Thanh 4 (51 · hạ mạnh xuống)',
    5: 'Thanh nhẹ'
  };

  const TONE_SHORT = {
    1: 'Thanh 1',
    2: 'Thanh 2',
    3: 'Thanh 3',
    4: 'Thanh 4',
    5: 'Thanh nhẹ'
  };

  const HOMOPHONE_GROUPS = {
    ai: '爱哀挨矮唉', ba: '八吧把爸罢霸', bai: '百白摆败', ban: '班半办般版板', bang: '帮旁棒榜绑',
    bao: '包报抱饱宝保', bei: '杯北被备倍背悲', ben: '本奔笨', bi: '比笔必闭币鼻', bian: '边便变遍编辩',
    biao: '表标', bie: '别憋', bing: '冰并病兵', bo: '播伯波博', bu: '不步部布补捕',
    cai: '菜才猜采财', can: '参餐残惨', cao: '草操', ce: '厕测策', cha: '茶查差插',
    chan: '产', chang: '长常场唱厂肠', chao: '超吵炒朝', che: '车彻', chen: '衬沉陈尘',
    cheng: '成城程乘承称诚', chi: '吃迟持尺池', chong: '重虫充冲', chou: '抽愁臭', chu: '出初除处楚础',
    chuan: '穿船传串', chuang: '窗床创', chui: '吹垂', chun: '春纯唇', ci: '次词此辞磁',
    cong: '从聪匆', cu: '粗促醋', cun: '村存寸', cuo: '错措',
    da: '大打达答搭', dai: '带代待袋戴呆', dan: '但单蛋担淡弹', dang: '当党档', dao: '到道倒岛导刀',
    de: '的得地德', deng: '等灯登', di: '弟地第低底递帝', dian: '点电店典垫', diao: '掉吊调钓',
    ding: '定订顶盯', dong: '东冬懂动洞', dou: '都豆斗抖', du: '读都度毒独堵', duan: '短段断端',
    dui: '对队兑', dun: '顿蹲盾', duo: '多朵躲夺',
    e: '饿额恶鹅', en: '嗯恩', er: '二儿耳而尔',
    fa: '发法罚乏', fan: '饭反翻烦范犯', fang: '房放方防访仿', fei: '飞非费肥肺废', fen: '分份粉奋愤',
    feng: '风封丰疯峰', fu: '服福父夫付复负副富附',
    gai: '该改概盖', gan: '干感敢赶甘', gang: '刚钢港岗', gao: '高告搞膏', ge: '个哥各歌割格革',
    gei: '给', gen: '跟根', geng: '更耕', gong: '工公功共供宫', gou: '狗够购构沟',
    gu: '故古顾固骨股鼓', gua: '瓜挂刮', guai: '怪乖', guan: '关观管馆惯冠', guang: '光广逛',
    gui: '贵归规鬼柜', guo: '国果过锅',
    hai: '还海孩害', han: '汉寒汗喊含', hang: '行航', hao: '好号毫豪', he: '和喝河合盒何核贺',
    hei: '黑', hen: '很恨狠', heng: '横衡', hong: '红洪虹宏', hou: '后候厚猴喉',
    hu: '湖护户互呼乎忽胡', hua: '花画话化划滑', huai: '坏怀', huan: '欢还换环缓', huang: '黄慌皇谎晃',
    hui: '会回灰汇毁悔', hun: '婚混魂', huo: '火活或货获伙',
    ji: '几机鸡记计己纪技际既及极集急寄激', jia: '家加假价架驾嫁', jian: '见件间建健渐简检减肩',
    jiang: '讲江将奖降酱', jiao: '叫教交校觉角脚娇', jie: '姐借接街结节解界届戒', jin: '进近今金斤紧禁仅尽',
    jing: '京经精静净镜景竟惊警', jiu: '九酒久旧救就究', ju: '句居具举局拒聚俱据', juan: '卷捐', jue: '觉决绝', jun: '军均君',
    ka: '卡咖', kai: '开', kan: '看刊砍', kang: '康抗', kao: '考烤靠',
    ke: '可课客刻科渴克颗', ken: '肯', kong: '空恐控', kou: '口扣', ku: '哭苦裤库酷',
    kua: '夸跨', kuai: '快块筷', kuan: '宽款', kuang: '况矿框', kui: '亏愧', kun: '困昆', kuo: '扩阔',
    la: '啦拉辣蜡', lai: '来赖', lan: '蓝篮懒烂拦', lang: '浪狼朗廊', lao: '老劳牢',
    le: '了乐', lei: '累类泪雷', leng: '冷', li: '里理礼李离力立历丽利例励', lian: '连脸练联恋怜',
    liang: '两亮凉量辆粮良', liao: '聊料了', lie: '列烈猎', lin: '邻林临淋', ling: '零领另灵令龄',
    liu: '六流留刘柳', long: '龙笼隆', lou: '楼漏露', lu: '路录陆露绿旅律', luan: '乱卵', lue: '略', lun: '轮论', luo: '落罗螺',
    ma: '吗妈马骂麻', mai: '买卖麦迈', man: '慢满漫蛮', mang: '忙盲茫', mao: '猫毛帽貌冒贸',
    mei: '没每妹美煤眉', men: '们门闷', meng: '梦猛蒙', mi: '米密迷秘蜜', mian: '面棉免勉',
    miao: '秒苗描妙', mie: '灭', min: '民敏', ming: '明名命鸣', mo: '末摸磨模莫默', mou: '某', mu: '母目木幕慕墓',
    na: '那哪拿纳', nai: '奶耐', nan: '男南难', nao: '脑闹恼', ne: '呢', nei: '内', nen: '嫩', neng: '能',
    ni: '你呢泥拟逆', nian: '年念粘', niang: '娘酿', niao: '鸟尿', nie: '捏', nin: '您', ning: '宁凝', niu: '牛扭纽',
    nong: '农浓弄', nu: '努怒女', nuan: '暖', nue: '虐', nuo: '诺挪',
    ou: '偶欧', pa: '怕爬帕', pai: '拍排派牌', pan: '盘盼判攀', pang: '旁胖', pao: '跑泡炮抛',
    pei: '陪配赔佩', pen: '盆喷', peng: '朋碰捧棚', pi: '皮批啤疲脾匹', pian: '片篇偏骗', piao: '票漂飘',
    pie: '撇', pin: '品拼贫频', ping: '平瓶评凭苹', po: '破坡迫泼', pu: '普铺葡朴',
    qi: '起期七气汽企器奇骑齐弃妻', qia: '卡洽', qian: '千前钱铅浅欠签迁', qiang: '强墙抢枪', qiao: '桥敲悄巧瞧',
    qie: '切且茄', qin: '亲琴勤侵', qing: '请青清情晴轻庆倾', qiong: '穷', qiu: '秋球求',
    qu: '去取区趣曲趋', quan: '全劝权圈泉', que: '缺却确雀', qun: '群裙',
    ran: '然燃染', rang: '让', rao: '绕扰', re: '热惹', ren: '人认任忍刃', reng: '扔仍', ri: '日', rong: '容荣融',
    rou: '肉柔', ru: '如入乳', ruan: '软', rui: '瑞锐', run: '润', ruo: '若弱',
    sa: '撒洒', sai: '赛塞', san: '三散伞', sang: '嗓丧', sao: '扫嫂', se: '色', sen: '森', seng: '僧',
    sha: '沙杀傻纱', shai: '晒筛', shan: '山衫善闪扇', shang: '上商伤尚赏', shao: '少烧稍勺',
    she: '谁设社舍蛇射', shen: '什身深神审申伸慎', sheng: '生声省胜剩升圣', shi: '是事市室试识世十时实使始师诗石食史拾',
    shou: '手收受首瘦寿兽', shu: '书数树熟属输舒叔鼠', shua: '刷耍', shuai: '摔甩帅', shuan: '栓', shuang: '双爽',
    shui: '水谁睡税', shun: '顺', shuo: '说硕', si: '四死思司丝似私斯撕', song: '送松宋', sou: '搜',
    su: '诉速素苏俗', suan: '算酸', sui: '岁虽随碎', sun: '孙损', suo: '所锁缩',
    ta: '他她它塌踏塔', tai: '太台态抬', tan: '谈弹叹探贪摊', tang: '糖汤躺趟堂', tao: '套逃桃讨淘',
    te: '特', teng: '疼腾', ti: '题体踢提替梯', tian: '天田甜填添', tiao: '条跳挑调', tie: '铁贴',
    ting: '听停厅挺', tong: '同通痛统桶铜', tou: '头偷投透', tu: '图土突兔涂吐', tuan: '团', tui: '腿推退', tun: '吞', tuo: '脱拖托妥',
    wa: '瓦挖哇', wai: '外歪', wan: '晚完玩万碗弯', wang: '忘望王往网亡', wei: '为位未味围维伟委微危',
    wen: '问文闻温稳吻', weng: '翁', wo: '我握卧', wu: '五无物屋午舞误务恶',
    xi: '西洗习喜系细戏吸息希惜', xia: '下夏吓瞎', xian: '先现线显险县鲜限献', xiang: '想向像象乡香响享箱相',
    xiao: '小笑校消效晓销', xie: '写些谢鞋血斜协', xin: '新心信辛欣', xing: '星行兴形醒性姓幸型',
    xiong: '兄胸雄熊', xiu: '休修羞秀', xu: '需许续须序虚', xuan: '选宣旋', xue: '学雪血', xun: '寻训迅',
    ya: '牙压呀鸭押', yan: '眼言演研严验盐烟颜厌', yang: '样羊洋阳养扬', yao: '要药摇咬腰邀',
    ye: '也业夜叶爷野', yi: '一以已意医衣椅移议异易亿疑义艺', yin: '因音阴银引印', ying: '英应影迎硬营赢',
    yong: '用永拥勇', you: '有又由游友右邮油优幼', yu: '鱼雨语与于育预遇域余', yuan: '远元园员原愿院圆源',
    yue: '月越约乐阅', yun: '云运允韵',
    za: '杂砸', zai: '在再载', zan: '咱暂赞', zang: '脏葬', zao: '早造糟', ze: '责则择', zen: '怎',
    zeng: '增赠', zha: '扎炸', zhai: '摘窄债', zhan: '站占战展粘', zhang: '张长丈帐涨障', zhao: '找照着招朝',
    zhe: '这着者折', zhen: '真针阵震镇珍', zheng: '正整争政证挣', zhi: '只知之直指纸止支值质制治志至致',
    zhong: '中重种钟终忠', zhou: '周州粥洲', zhu: '住主助注猪竹祝著筑', zhua: '抓', zhuan: '专转传赚',
    zhuang: '装壮状撞', zhui: '追', zhun: '准', zhuo: '桌捉', zi: '字子自资紫', zong: '总宗', zou: '走', zu: '足组祖租阻',
    zuan: '钻', zui: '最嘴醉罪', zun: '尊遵', zuo: '做作坐座左昨'
  };

  let dynamicPinyinMap = null;

  function buildPinyinLookup() {
    if (dynamicPinyinMap) return dynamicPinyinMap;
    const map = new Map();
    const add = (han, basePy) => {
      if (!han || !basePy) return;
      let set = map.get(han);
      if (!set) { set = new Set(); map.set(han, set); }
      set.add(basePy);
    };
    for (const [py, chars] of Object.entries(HOMOPHONE_GROUPS)) {
      for (const ch of Array.from(chars)) add(ch, py);
    }
    if (Array.isArray(root.words)) {
      for (const w of root.words) {
        if (!w?.han || !w?.pin) continue;
        const hans = Array.from(w.han).filter(c => /\p{Script=Han}/u.test(c));
        const tokens = String(w.pin).split(/[\s\-·,/]+/).filter(Boolean);
        if (hans.length === 1 && tokens.length === 1) {
          add(hans[0], tonelessPinyin(tokens[0]));
        }
      }
    }
    dynamicPinyinMap = map;
    return map;
  }

  function tonelessPinyin(pin) {
    return String(pin || '').toLowerCase().normalize('NFD').replace(/u\u0308|u:/g, 'v')
      .replace(/[^a-z]/g, '');
  }

  function stripSpeakerPrefix(text) {
    return String(text || '').replace(/^\s*[A-Za-z0-9\u4e00-\u9fff]{1,6}\s*[:：]\s*/, '').trim();
  }

  function extractToneFromSyllable(raw) {
    const s = String(raw || '').normalize('NFC').trim();
    if (!s) return 5;
    for (const ch of s) {
      const lower = ch.toLowerCase();
      if (TONE_MARKS[lower]) return TONE_MARKS[lower][1];
    }
    const digit = s.match(/([1-5])[^1-5]*$/);
    if (digit) return Number(digit[1]);
    return 5;
  }

  function splitConcatPinyin(value, expectedCount = 0) {
    if (root.HSKGuidedCore?.formatPinyin) {
      const formatted = root.HSKGuidedCore.formatPinyin(value, '');
      const tokens = formatted.split(/[\s\-·,，。!?！？;；:：'’]+/).filter(t => /[a-zü]/i.test(t));
      if (!expectedCount || tokens.length === expectedCount) return tokens;
    }
    const source = String(value || '').normalize('NFC').trim();
    const rough = source.split(/[\s\-·,，。!?！？;；:：'’/]+/).filter(Boolean);
    const out = [];
    const valid = piece => {
      const tones = piece.match(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ1-5]/gi) || [];
      if (tones.length > 1) return false;
      const base = piece.toLowerCase().replace(/[1-5]/g, '').replace(/[āáǎà]/g, 'a').replace(/[ēéěè]/g, 'e')
        .replace(/[īíǐì]/g, 'i').replace(/[ōóǒò]/g, 'o').replace(/[ūúǔù]/g, 'u').replace(/[ǖǘǚǜü]/g, 'v');
      return /^(?:(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcswy])?(?:a|o|e|ai|ei|ao|ou|an|en|ang|eng|ong|i|ia|ie|iao|iu|ian|in|iang|ing|iong|u|ua|ue|uo|uai|ui|uan|un|uang|ueng|v|ve|van|vn)|er|ng)$/.test(base);
    };
    for (const token of rough) {
      if (!/[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/i.test(token)) continue;
      const clean = token.replace(/[^a-zA-ZāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüÜ1-5]/g, '');
      if (!clean) continue;
      if (valid(clean)) {
        out.push(clean);
        continue;
      }
      const chars = Array.from(clean);
      const memo = new Map();
      const solve = idx => {
        if (idx === chars.length) return [];
        if (memo.has(idx)) return memo.get(idx);
        let best = null;
        for (let end = Math.min(chars.length, idx + 7); end > idx; end--) {
          const part = chars.slice(idx, end).join('');
          if (!valid(part)) continue;
          const tail = solve(end);
          if (tail && (!best || tail.length + 1 < best.length)) best = [part, ...tail];
        }
        memo.set(idx, best);
        return best;
      };
      const split = solve(0);
      if (split?.length) out.push(...split);
      else out.push(clean);
    }
    return out;
  }

  /**
   * Parses Chinese characters, pinyin syllables and applies Mandarin tone sandhi rules.
   */
  function parseSyllables(text, pinyin = '') {
    const cleanText = stripSpeakerPrefix(text);
    const hanChars = Array.from(cleanText).filter(c => /\p{Script=Han}/u.test(c));
    const pinTokens = splitConcatPinyin(pinyin, hanChars.length);
    const syllables = hanChars.map((han, idx) => {
      const pin = pinTokens[idx] || '';
      const baseTone = pin ? extractToneFromSyllable(pin) : 5;
      const optionalNeutral = hanChars.length === 3 && idx === 1 && (han === '不' || han === '没');
      return {
        index: idx,
        han,
        pinyin: pin,
        baseTone,
        spokenTone: baseTone,
        optionalNeutral,
        sandhiNote: '',
        isFinal: idx === hanChars.length - 1
      };
    });

    for (let i = 0; i < syllables.length - 1; i++) {
      const cur = syllables[i];
      const next = syllables[i + 1];
      if (cur.han === '一' && cur.baseTone !== 5) {
        if (next.baseTone === 4) {
          cur.spokenTone = 2;
          cur.sandhiNote = 'Biến điệu 一 trước Thanh 4 → đọc thành Thanh 2 (yí)';
        } else if (next.baseTone >= 1 && next.baseTone <= 3) {
          cur.spokenTone = 4;
          cur.sandhiNote = 'Biến điệu 一 trước Thanh 1/2/3 → đọc thành Thanh 4 (yì)';
        }
      } else if (cur.han === '不' && next.baseTone === 4) {
        cur.spokenTone = 2;
        cur.sandhiNote = 'Biến điệu 不 trước Thanh 4 → đọc thành Thanh 2 (bú)';
      } else if (cur.baseTone === 3 && next.baseTone === 3) {
        cur.spokenTone = 2;
        cur.sandhiNote = 'Biến điệu hai Thanh 3 liền nhau → âm trước đọc như Thanh 2';
      }
    }
    return syllables;
  }

  function percentile(sorted, p) {
    if (!sorted.length) return 0;
    const pos = Math.max(0, Math.min(sorted.length - 1, p * (sorted.length - 1)));
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
  }

  function medianFilter(values, width = 3) {
    const half = Math.floor(width / 2);
    return values.map((_, i) => {
      if (values[i] <= 0) return 0;
      const win = [];
      for (let k = Math.max(0, i - half); k <= Math.min(values.length - 1, i + half); k++) {
        if (values[k] > 0) win.push(values[k]);
      }
      if (!win.length) return values[i];
      win.sort((a, b) => a - b);
      return win[Math.floor(win.length / 2)];
    });
  }

  function preprocessForPitch(samples, sampleRate = 16000) {
    const n = samples.length;
    const out = new Float32Array(n);
    if (!n) return out;

    let mean = 0;
    for (let i = 0; i < n; i++) mean += samples[i];
    mean /= n;

    // 1st-order high-pass (~70 Hz) suppresses fan/AC rumble and 50/60 Hz hum.
    const dt = 1 / sampleRate;
    const rcHp = 1 / (2 * Math.PI * 70);
    const alphaHp = rcHp / (rcHp + dt);
    let prevX = 0;
    let prevY = 0;
    for (let i = 0; i < n; i++) {
      const x = samples[i] - mean;
      prevY = alphaHp * (prevY + x - prevX);
      prevX = x;
      out[i] = prevY;
    }

    // Zero-phase (forward + backward) low-pass (~950 Hz) boosts voice SNR in noisy rooms.
    const rcLp = 1 / (2 * Math.PI * 950);
    const alphaLp = dt / (rcLp + dt);
    let lp = out[0];
    for (let i = 1; i < n; i++) {
      lp += alphaLp * (out[i] - lp);
      out[i] = lp;
    }
    lp = out[n - 1];
    for (let i = n - 2; i >= 0; i--) {
      lp += alphaLp * (out[i] - lp);
      out[i] = lp;
    }
    return out;
  }

  function bridgeSingleFrameGaps(rawFrames) {
    for (let i = 1; i < rawFrames.length - 1; i++) {
      if (rawFrames[i].f0 > 0) continue;
      const prev = rawFrames[i - 1].f0;
      const next = rawFrames[i + 1].f0;
      if (prev > 0 && next > 0 && Math.abs(prev - next) / Math.max(prev, next) <= 0.28) {
        rawFrames[i].f0 = (prev + next) / 2;
        rawFrames[i].clarity = Math.min(rawFrames[i - 1].clarity || 0.7, rawFrames[i + 1].clarity || 0.7);
      }
    }
  }

  /**
   * Fast real-time harmonic clarity score (0..1) for noise-resistant VAD in Web Audio capture.
   */
  function quickVoicedClarity(samples, sampleRate = 16000) {
    if (!samples || samples.length < 320) return 0;
    const step = sampleRate >= 32000 ? 2 : 1;
    const effRate = sampleRate / step;
    const downLen = Math.min(800, Math.floor(samples.length / step));
    const slice = new Float32Array(downLen);
    let mean = 0;
    for (let i = 0; i < downLen; i++) {
      slice[i] = samples[i * step];
      mean += slice[i];
    }
    mean /= downLen;
    // Simple 70Hz HP + ~950Hz LP on small VAD slice
    const dt = 1 / effRate;
    const aHp = (1 / (2 * Math.PI * 70)) / (1 / (2 * Math.PI * 70) + dt);
    const aLp = dt / (1 / (2 * Math.PI * 950) + dt);
    let px = 0; let py = 0; let lp = 0;
    for (let i = 0; i < downLen; i++) {
      const x = slice[i] - mean;
      py = aHp * (py + x - px);
      px = x;
      lp += aLp * (py - lp);
      slice[i] = lp;
    }
    const tauMin = Math.max(2, Math.floor(effRate / 450));
    const tauMax = Math.min(downLen - 32, Math.ceil(effRate / 66));
    if (tauMax <= tauMin) return 0;

    let best = 0;
    let crossedZero = false;
    const lagStep = effRate > 18000 ? 2 : 1;
    for (let tau = 2; tau <= tauMax; tau += lagStep) {
      let acf = 0; let div = 0;
      const limit = downLen - tau;
      for (let j = 0; j < limit; j++) {
        const a = slice[j]; const b = slice[j + tau];
        acf += a * b;
        div += a * a + b * b;
      }
      const val = div > 0 ? (2 * acf) / div : 0;
      if (!crossedZero) {
        if (val <= 0) crossedZero = true;
      } else if (tau >= tauMin && val > best) {
        best = val;
      }
    }
    return Math.max(0, Math.min(1, best));
  }

  /**
   * Extracts F0 pitch track + Clarity using filtered MPM (McLeod Pitch Method / NSDF + Key Maximum Picking)
   * with adaptive ambient noise-floor gating, normalized to the Chao 5-level scale [1..5].
   */
  function extractPitchTrack(samples, sampleRate = 16000, opts = {}) {
    if (!samples || !samples.length || !sampleRate) return [];
    const minHz = opts.minHz || 66;
    const maxHz = opts.maxHz || 450;
    const clarityThreshold = opts.clarityThreshold || 0.62;
    const kCutoff = opts.cutoff || 0.85;
    const hopSize = Math.max(32, Math.round(sampleRate * (opts.hopSec || 0.01)));
    const tauMin = Math.max(2, Math.floor(sampleRate / maxHz));
    const tauMax = Math.ceil(sampleRate / minHz);
    const winSize = Math.max(Math.round(sampleRate * (opts.winSec || 0.044)), tauMax * 2 + 4);

    if (samples.length < winSize) return [];

    const cleanSamples = preprocessForPitch(samples, sampleRate);
    const rawFrames = [];
    let maxRms = 0;
    const allRms = [];

    for (let start = 0; start + winSize <= cleanSamples.length; start += hopSize) {
      let sq = 0;
      for (let i = 0; i < winSize; i++) {
        const s = cleanSamples[start + i];
        sq += s * s;
      }
      const rms = Math.sqrt(sq / winSize);
      if (rms > maxRms) maxRms = rms;
      allRms.push(rms);
      rawFrames.push({
        start,
        timeMs: Math.round(((start + winSize / 2) / sampleRate) * 1000),
        rms,
        f0: 0,
        clarity: 0
      });
    }

    const sortedRms = allRms.slice().sort((a, b) => a - b);
    const ambientFloor = percentile(sortedRms, 0.18);
    const rmsFloor = Math.max(
      opts.minRms || 0.00035,
      maxRms * (opts.rmsRatio || 0.06),
      ambientFloor * 1.32 + Math.max(0, maxRms - ambientFloor) * 0.10
    );
    const nsdf = new Float64Array(tauMax + 2);

    for (const frame of rawFrames) {
      if (frame.rms < rmsFloor) continue;
      const s0 = frame.start;
      for (let tau = 0; tau <= tauMax; tau++) {
        let acf = 0;
        let div = 0;
        const limit = winSize - tau;
        for (let j = 0; j < limit; j++) {
          const a = cleanSamples[s0 + j];
          const b = cleanSamples[s0 + j + tau];
          acf += a * b;
          div += a * a + b * b;
        }
        nsdf[tau] = div > 0 ? (2 * acf) / div : 0;
      }

      // Collect positive arch maxima after the first negative zero-crossing (McLeod Pitch Method).
      const keyMaxima = [];
      let crossedZero = false;
      let curPeakTau = -1;
      let curPeakVal = -Infinity;

      for (let tau = 1; tau <= tauMax; tau++) {
        const val = nsdf[tau];
        if (!crossedZero) {
          if (val <= 0) crossedZero = true;
          continue;
        }
        if (val > 0) {
          if (val > curPeakVal) {
            curPeakVal = val;
            curPeakTau = tau;
          }
        } else if (curPeakTau > 0) {
          if (curPeakTau >= tauMin) keyMaxima.push({ tau: curPeakTau, val: curPeakVal });
          curPeakTau = -1;
          curPeakVal = -Infinity;
        }
      }
      if (curPeakTau >= tauMin) {
        keyMaxima.push({ tau: curPeakTau, val: curPeakVal });
      }

      if (!keyMaxima.length) continue;

      let globalMax = 0;
      for (const m of keyMaxima) {
        if (m.val > globalMax) globalMax = m.val;
      }
      frame.clarity = Number(Math.max(0, Math.min(1, globalMax)).toFixed(3));
      if (globalMax < clarityThreshold) continue;

      const picked = keyMaxima.find(m => m.val >= globalMax * kCutoff && m.val >= clarityThreshold);
      if (!picked) continue;

      let betterTau = picked.tau;
      if (picked.tau > 1 && picked.tau < tauMax) {
        const a = nsdf[picked.tau - 1];
        const b = nsdf[picked.tau];
        const c = nsdf[picked.tau + 1];
        const denom = 2 * (a - 2 * b + c);
        if (Math.abs(denom) > 1e-9) {
          const delta = (a - c) / denom;
          if (Math.abs(delta) < 1) betterTau += delta;
        }
      }
      const f0 = sampleRate / betterTau;
      if (f0 >= minHz && f0 <= maxHz) frame.f0 = f0;
    }

    const filteredF0 = medianFilter(rawFrames.map(f => f.f0), 3);
    for (let i = 0; i < rawFrames.length; i++) {
      rawFrames[i].f0 = filteredF0[i];
    }
    bridgeSingleFrameGaps(rawFrames);

    const voicedSt = [];
    for (let i = 0; i < rawFrames.length; i++) {
      if (rawFrames[i].f0 > 0) {
        const st = 12 * Math.log2(rawFrames[i].f0 / 100);
        rawFrames[i].semitone = st;
        voicedSt.push(st);
      } else {
        rawFrames[i].semitone = 0;
      }
    }

    const sortedSt = voicedSt.slice().sort((a, b) => a - b);
    const p05 = percentile(sortedSt, 0.05);
    const p50 = percentile(sortedSt, 0.5);
    const p95 = percentile(sortedSt, 0.95);
    const rawSpan = p95 - p05;
    const effectiveSpan = Math.max(2.4, rawSpan);

    for (const frame of rawFrames) {
      if (frame.f0 > 0) {
        let chao;
        if (rawSpan < 1.2) {
          // Steady pitch remains cleanly legible instead of amplifying micro-jitter across 1..5.
          chao = 3.8 + ((frame.semitone - p50) / 3.2) * 2.4;
        } else {
          chao = 1.2 + ((frame.semitone - p05) / effectiveSpan) * 3.6;
        }
        frame.chao = Math.max(1, Math.min(5, chao));
      } else {
        frame.chao = 0;
      }
    }
    return rawFrames;
  }

  /**
   * Computes normalized Dynamic Time Warping (DTW) distance between two pitch sequences.
   */
  function dtwDistance(seqA, seqB, band = 4) {
    const a = Array.isArray(seqA) ? seqA : [];
    const b = Array.isArray(seqB) ? seqB : [];
    const n = a.length;
    const m = b.length;
    if (!n || !m) return Infinity;

    const w = Math.max(band, Math.abs(n - m));
    const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(Infinity));
    const steps = Array.from({ length: n + 1 }, () => Array(m + 1).fill(1));
    dp[0][0] = 0;
    steps[0][0] = 0;

    for (let i = 1; i <= n; i++) {
      const jStart = Math.max(1, i - w);
      const jEnd = Math.min(m, i + w);
      for (let j = jStart; j <= jEnd; j++) {
        const cost = Math.abs(a[i - 1] - b[j - 1]);
        let bestPrev = dp[i - 1][j - 1];
        let bestSteps = steps[i - 1][j - 1];
        if (dp[i - 1][j] < bestPrev) {
          bestPrev = dp[i - 1][j];
          bestSteps = steps[i - 1][j];
        }
        if (dp[i][j - 1] < bestPrev) {
          bestPrev = dp[i][j - 1];
          bestSteps = steps[i][j - 1];
        }
        dp[i][j] = cost + bestPrev;
        steps[i][j] = bestSteps + 1;
      }
    }
    return dp[n][m] / Math.max(1, steps[n][m]);
  }

  /**
   * Canonical Chao 5-level pitch contour templates [1..5].
   */
  function targetContour(tone, points = 12, isFinal = true, halfThird = false) {
    const out = [];
    for (let i = 0; i < points; i++) {
      const t = points === 1 ? 0 : i / (points - 1);
      let y = 3.0;
      if (tone === 1) {
        y = 4.4;
      } else if (tone === 2) {
        y = 2.4 + 2.2 * Math.pow(t, 1.15);
      } else if (tone === 3) {
        if (isFinal && !halfThird) {
          // 214 contour: dip to 1.2 around t=0.45 then rise toward 3.5
          y = t <= 0.45
            ? 2.4 - 1.2 * (t / 0.45)
            : 1.2 + 2.3 * Math.pow((t - 0.45) / 0.55, 1.15);
        } else {
          // Half-third (21): fall gently like a Vietnamese dấu huyền without trailing rebound
          y = 2.6 - 1.4 * Math.sin((t * Math.PI) / 2);
        }
      } else if (tone === 4) {
        y = 4.7 - 3.4 * Math.pow(t, 0.95);
      } else {
        y = 2.8 - 0.8 * t;
      }
      out.push(Number(y.toFixed(2)));
    }
    return out;
  }

  function resampleArray(values, count) {
    if (!values.length) return Array(count).fill(3);
    if (values.length === 1) return Array(count).fill(values[0]);
    const out = [];
    for (let i = 0; i < count; i++) {
      const pos = (i / (count - 1)) * (values.length - 1);
      const lo = Math.floor(pos);
      const hi = Math.min(values.length - 1, lo + 1);
      const frac = pos - lo;
      out.push(values[lo] * (1 - frac) + values[hi] * frac);
    }
    return out;
  }

  function trimUnvoicedEdges(frames) {
    const list = frames.slice();
    let start = 0;
    let end = list.length - 1;
    while (start <= end && list[start].f0 <= 0) start++;
    while (end >= start && list[end].f0 <= 0) end--;
    return start <= end ? list.slice(start, end + 1) : [];
  }

  function findSyllableRanges(track, expectedCount, maxRms = 0) {
    if (!expectedCount || !track.length) return [];
    const peakTrackRms = maxRms || Math.max(0.001, ...track.map(f => f.rms || 0));

    // Collect vocal islands with relaxed floor for soft neutral / middle unstressed syllables,
    // while keeping noise bursts (very low clarity or whisper) out.
    const islands = [];
    let idx = 0;
    while (idx < track.length) {
      const f = track[idx];
      if (!(f.f0 > 0 && (f.clarity || 0) >= 0.58 && (f.rms || 0) >= peakTrackRms * 0.08)) {
        idx++;
        continue;
      }
      const start = idx;
      let rmsSum = 0;
      let rmsMax = 0;
      let claritySum = 0;
      let voicedCount = 0;
      let gapAllowance = 0;
      let lastValid = idx;
      while (idx < track.length) {
        const cur = track[idx];
        if (cur.f0 > 0 && (cur.clarity || 0) >= 0.56 && (cur.rms || 0) >= peakTrackRms * 0.07) {
          rmsSum += cur.rms || 0;
          if ((cur.rms || 0) > rmsMax) rmsMax = cur.rms || 0;
          claritySum += cur.clarity || 0;
          voicedCount++;
          lastValid = idx;
          gapAllowance = 0;
          idx++;
        } else if (gapAllowance < 1 && idx + 1 < track.length && track[idx + 1].f0 > 0 && (track[idx + 1].clarity || 0) >= 0.58) {
          gapAllowance++;
          idx++;
        } else {
          break;
        }
      }
      if (voicedCount >= 2 && rmsMax >= peakTrackRms * 0.09 && claritySum / voicedCount >= 0.58) {
        islands.push({
          start,
          end: lastValid + 1,
          voicedCount,
          rmsSum,
          rmsMax,
          claritySum,
          meanRms: rmsSum / voicedCount,
          meanClarity: claritySum / voicedCount,
          mass: rmsSum
        });
      }
    }

    if (!islands.length) return Array.from({ length: expectedCount }, () => [0, 0]);
    if (expectedCount === 1) {
      const strongest = islands.slice().sort((a, b) => b.mass - a.mass)[0];
      return [[strongest.start, strongest.end]];
    }

    // Consolidate over-segmented islands: drop tiny breath blips first, then merge nearest neighbors.
    while (islands.length > expectedCount) {
      let blipIdx = -1;
      let blipMass = Infinity;
      for (let k = 0; k < islands.length; k++) {
        const isl = islands[k];
        if (isl.voicedCount <= 2 && isl.meanClarity < 0.65 && isl.rmsMax < peakTrackRms * 0.18 && isl.mass < blipMass) {
          blipMass = isl.mass;
          blipIdx = k;
        }
      }
      if (blipIdx >= 0) {
        islands.splice(blipIdx, 1);
        continue;
      }

      let bestMergeIdx = 0;
      let bestGap = Infinity;
      for (let k = 0; k < islands.length - 1; k++) {
        const gap = islands[k + 1].start - islands[k].end;
        if (gap < bestGap) {
          bestGap = gap;
          bestMergeIdx = k;
        }
      }
      const left = islands[bestMergeIdx];
      const right = islands[bestMergeIdx + 1];
      const voicedCount = left.voicedCount + right.voicedCount;
      const rmsSum = left.rmsSum + right.rmsSum;
      const claritySum = left.claritySum + right.claritySum;
      islands.splice(bestMergeIdx, 2, {
        start: left.start,
        end: right.end,
        voicedCount,
        rmsSum,
        rmsMax: Math.max(left.rmsMax, right.rmsMax),
        claritySum,
        meanRms: rmsSum / voicedCount,
        meanClarity: claritySum / voicedCount,
        mass: rmsSum
      });
    }

    if (islands.length === expectedCount) {
      return islands.map(isl => [isl.start, isl.end]);
    }

    // Check if the user only spoke one brief syllable (plus silence or trailing unvoiced wheeze/laugh).
    const lastIsl = islands[islands.length - 1];
    let trailingNoisy = 0;
    for (let i = lastIsl.end; i < track.length; i++) {
      const tf = track[i];
      if ((tf.rms || 0) >= Math.max(0.004, peakTrackRms * 0.025) && (!(tf.f0 > 0) || (tf.clarity || 0) < 0.58)) {
        trailingNoisy++;
      }
    }
    const tooShortSingle = islands.length === 1 && (
      islands[0].voicedCount < Math.min(28, expectedCount * 14)
      || (islands[0].voicedCount < 32 && trailingNoisy >= 12)
    );
    if (tooShortSingle) {
      const out = [[islands[0].start, islands[0].end]];
      while (out.length < expectedCount) out.push([0, 0]);
      return out;
    }

    // Keep solitary islands strict (140ms/syllable) so one drawn-out word is never chopped into fake syllables;
    // when multiple spoken islands already exist, first recover missing soft/unstressed syllables sitting in gaps
    // between islands, then allow tighter coarticulated splits (50ms/syllable).
    const minPerSyl = islands.length === 1 ? 14 : 5;
    const alloc = islands.map(() => 1);
    const insertedGapAfter = new Array(Math.max(0, islands.length - 1)).fill(null);
    let remaining = expectedCount - islands.length;

    if (remaining > 0 && islands.length >= 2) {
      const gapCandidates = [];
      for (let k = 0; k < islands.length - 1; k++) {
        const gStart = islands[k].end;
        const gEnd = islands[k + 1].start;
        const gLen = gEnd - gStart;
        if (gLen < 4) continue;
        let active = 0;
        let energySum = 0;
        let maxGapRms = 0;
        for (let g = gStart; g < gEnd; g++) {
          const r = track[g].rms || 0;
          energySum += r;
          if (r > maxGapRms) maxGapRms = r;
          if (r >= peakTrackRms * 0.08 || (track[g].f0 || 0) > 0) active++;
        }
        if ((gLen >= 6 && maxGapRms >= peakTrackRms * 0.05) || active >= 2) {
          gapCandidates.push({ afterIdx: k, start: gStart, end: gEnd, score: energySum + gLen * 0.01 });
        }
      }
      gapCandidates.sort((a, b) => b.score - a.score);
      for (const cand of gapCandidates) {
        if (remaining <= 0) break;
        insertedGapAfter[cand.afterIdx] = [cand.start, cand.end];
        remaining--;
      }
    }

    while (remaining > 0) {
      let bestIslIdx = -1;
      let bestPerSylLen = 0;
      for (let k = 0; k < islands.length; k++) {
        const nextCount = alloc[k] + 1;
        const perSyl = islands[k].voicedCount / nextCount;
        if (perSyl >= minPerSyl && perSyl > bestPerSylLen) {
          bestPerSylLen = perSyl;
          bestIslIdx = k;
        }
      }
      if (bestIslIdx < 0) break;
      alloc[bestIslIdx]++;
      remaining--;
    }

    // Second pass for genuine multi-island utterances whose soft syllables need 3-4 frames each.
    if (remaining > 0 && islands.length >= 2) {
      while (remaining > 0) {
        let bestIslIdx = -1;
        let bestPerSylLen = 0;
        for (let k = 0; k < islands.length; k++) {
          const nextCount = alloc[k] + 1;
          const perSyl = (islands[k].end - islands[k].start) / nextCount;
          if (perSyl >= 3 && perSyl > bestPerSylLen) {
            bestPerSylLen = perSyl;
            bestIslIdx = k;
          }
        }
        if (bestIslIdx < 0) break;
        alloc[bestIslIdx]++;
        remaining--;
      }
    }

    const ranges = [];
    for (let k = 0; k < islands.length; k++) {
      const isl = islands[k];
      const count = alloc[k];
      if (count === 1) {
        ranges.push([isl.start, isl.end]);
      } else {
        const span = isl.end - isl.start;
        const minSeg = Math.max(2, Math.floor(span / (count * 2.4)));
        let prev = isl.start;
        for (let s = 1; s < count; s++) {
          const ideal = Math.round(isl.start + (s * span) / count);
          const searchHalf = Math.max(2, Math.floor(span / (count * 3)));
          const lo = Math.max(prev + minSeg, ideal - searchHalf);
          const hi = Math.min(isl.end - (count - s) * minSeg, ideal + searchHalf);
          let bestSplit = -1;
          if (lo <= hi) {
            let bestMetric = Infinity;
            for (let j = lo; j <= hi; j++) {
              if (islands.length === 1) {
                // A sustained vowel needs an acoustic boundary before it can count as two syllables.
                const before = track[Math.max(prev, j - 5)];
                const after = track[Math.min(isl.end - 1, j + 5)];
                const hasDip = track[j].rms <= Math.min(before.rms, after.rms) * 0.65;
                const pitchReset = track[j - 1].f0 > 0 && track[j].f0 > 0
                  && Math.abs(track[j].semitone - track[j - 1].semitone) >= 2.5;
                if (!hasDip && !pitchReset) continue;
              }
              const metric = (track[j].rms || 0) + Math.abs(j - ideal) * 0.0005;
              if (metric < bestMetric) {
                bestMetric = metric;
                bestSplit = j;
              }
            }
          }
          if (bestSplit < 0) {
            if (islands.length === 1) break;
            bestSplit = Math.max(prev + 1, Math.min(isl.end - 1, ideal));
          }
          ranges.push([prev, bestSplit]);
          prev = bestSplit;
        }
        ranges.push([prev, isl.end]);
      }
      if (insertedGapAfter[k]) {
        ranges.push(insertedGapAfter[k]);
      }
    }

    while (ranges.length < expectedCount) {
      ranges.push([0, 0]);
    }
    return ranges;
  }

  function linearSlope(vals) {
    const n = vals.length;
    if (n < 2) return 0;
    let sx = 0; let sy = 0; let sxy = 0; let sx2 = 0;
    for (let i = 0; i < n; i++) {
      sx += i; sy += vals[i]; sxy += i * vals[i]; sx2 += i * i;
    }
    const denom = n * sx2 - sx * sx;
    return denom ? (n * sxy - sx * sy) / denom : 0;
  }

  function analyzeToneSegment(voicedFrames, spokenTone, isFinal, optionalNeutral = false, peakSyllableRms = 0) {
    const minFrames = (spokenTone === 5 || optionalNeutral) ? 2 : 3;
    if (voicedFrames.length < minFrames) {
      return {
        detectedTone: 0,
        score: 0,
        userContour: [],
        target: targetContour(spokenTone, 12, isFinal),
        feedbackVi: voicedFrames.length ? 'Âm tiết quá ngắn hoặc lẫn tạp âm.' : 'Chưa phát âm rõ âm tiết này.'
      };
    }

    const meanClarity = voicedFrames.reduce((s, f) => s + (f.clarity || 0), 0) / voicedFrames.length;
    const segMeanRms = voicedFrames.reduce((s, f) => s + (f.rms || 0), 0) / voicedFrames.length;
    let jitterSum = 0;
    for (let i = 1; i < voicedFrames.length; i++) {
      jitterSum += Math.abs(voicedFrames[i].semitone - voicedFrames[i - 1].semitone);
    }
    const jitterSt = voicedFrames.length > 1 ? jitterSum / (voicedFrames.length - 1) : 0;
    const minRelRms = (spokenTone === 5 || optionalNeutral) ? 0.08 : 0.11;

    if (
      meanClarity < 0.58
      || jitterSt > 1.55
      || (peakSyllableRms > 0 && segMeanRms < peakSyllableRms * minRelRms)
    ) {
      const chaoNoise = resampleArray(voicedFrames.map(f => f.chao), 12).map(v => Number(v.toFixed(2)));
      return {
        detectedTone: 0,
        score: Math.min(35, Math.round(meanClarity * 42)),
        userContour: chaoNoise,
        target: targetContour(spokenTone, 12, isFinal),
        feedbackVi: 'Tín hiệu yếu, rung hoặc là tạp âm (chưa thành âm rõ ràng).'
      };
    }

    const stResampled = resampleArray(voicedFrames.map(f => f.semitone), 12);
    const chaoResampled = resampleArray(voicedFrames.map(f => f.chao), 12).map(v => Number(v.toFixed(2)));

    const startAvg = (stResampled[0] + stResampled[1] + stResampled[2]) / 3;
    const endAvg = (stResampled[9] + stResampled[10] + stResampled[11]) / 3;
    const totalDeltaSt = linearSlope(stResampled) * 11;
    let minSt = Infinity; let maxSt = -Infinity; let minIdx = 0;
    for (let i = 0; i < stResampled.length; i++) {
      if (stResampled[i] < minSt) { minSt = stResampled[i]; minIdx = i; }
      if (stResampled[i] > maxSt) maxSt = stResampled[i];
    }
    const rangeSt = maxSt - minSt;
    const earlyPeakSt = Math.max(...stResampled.slice(0, 6));
    const dropFromPeakSt = earlyPeakSt - endAvg;
    const tailReboundSt = endAvg - minSt;
    const dipFromEnds = Math.min(startAvg, endAvg) - minSt;

    let detectedTone;
    let usedHalfThird = !isFinal;

    if (dipFromEnds >= 1.5 && minIdx >= 2 && minIdx <= 9 && tailReboundSt >= 1.3 && dropFromPeakSt < 2.0) {
      detectedTone = 3;
    } else if (totalDeltaSt >= 1.6 && endAvg - startAvg >= 1.25) {
      detectedTone = 2;
    } else if ((dropFromPeakSt >= 0.95 || totalDeltaSt <= -0.9) && tailReboundSt < 1.15) {
      // Falling contour (includes natural Tone 4 / huyền drop without trailing rebound).
      if (spokenTone === 3 && dropFromPeakSt >= 0.85) {
        detectedTone = 3;
        usedHalfThird = true;
      } else {
        detectedTone = 4;
      }
    } else if (rangeSt <= 1.35 && Math.abs(totalDeltaSt) <= 0.85 && dropFromPeakSt < 0.95) {
      detectedTone = 1;
    } else if (totalDeltaSt < -0.75 || dropFromPeakSt >= 0.85) {
      detectedTone = spokenTone === 3 && tailReboundSt < 1.2 ? 3 : 4;
      if (detectedTone === 3) usedHalfThird = true;
    } else if (totalDeltaSt > 0.9) {
      detectedTone = 2;
    } else {
      detectedTone = 1;
    }

    const target = targetContour(spokenTone, 12, isFinal, usedHalfThird);
    const userMean = chaoResampled.reduce((s, v) => s + v, 0) / 12;
    const userCentered = chaoResampled.map(v => v - userMean);

    // Multi-template DTW shape comparison combining shape (70%) + absolute height alignment (30%).
    const candidates = [target];
    if (spokenTone === 4) {
      // Also allow gentle dấu huyền (4 -> 2) fall template
      candidates.push(Array.from({ length: 12 }, (_, i) => 4.2 - 2.3 * (i / 11)));
    }
    let minDtw = Infinity;
    for (const tmpl of candidates) {
      const tmplMean = tmpl.reduce((s, v) => s + v, 0) / tmpl.length;
      const shapeDtw = dtwDistance(userCentered, tmpl.map(v => v - tmplMean), 4);
      const absDtw = dtwDistance(chaoResampled, tmpl, 4);
      const combined = shapeDtw * 0.7 + absDtw * 0.3;
      if (combined < minDtw) minDtw = combined;
    }
    let shapeScore = Math.round(Math.max(25, Math.min(100, 100 - minDtw * 30)));

    // Prevent low gravelly flat noise from mimicking high flat Tone 1 (55).
    if (spokenTone === 1 && detectedTone === 1 && userMean < 2.35 && totalDeltaSt <= 0) {
      detectedTone = 0;
      shapeScore = Math.min(48, shapeScore);
    }

    if (spokenTone === 5 || (optionalNeutral && (detectedTone === spokenTone || rangeSt <= 4.2))) {
      detectedTone = spokenTone === 5 ? 5 : detectedTone;
      const minNeutralScore = optionalNeutral ? 82 : 76;
      shapeScore = Math.max(minNeutralScore, Math.min(97, Math.round(92 - Math.max(0, rangeSt - 4) * 4)));
    } else if (detectedTone === spokenTone) {
      shapeScore = Math.max(78, Math.min(99, shapeScore));
    } else {
      shapeScore = Math.min(62, shapeScore);
    }

    let feedbackVi;
    if (detectedTone === 0) {
      feedbackVi = 'Cao độ quá thấp hoặc chưa rõ · cần giữ cao và phẳng cho Thanh 1';
    } else if (spokenTone === 5) {
      feedbackVi = 'Thanh nhẹ · đọc ngắn và nhẹ';
    } else if (optionalNeutral && detectedTone !== spokenTone) {
      feedbackVi = 'Đọc lướt nhẹ tự nhiên (hoặc giữ nguyên thanh)';
    } else if (detectedTone === spokenTone) {
      if (spokenTone === 3 && usedHalfThird) {
        feedbackVi = 'Chuẩn Thanh 3 (đọc nửa dấu 21 tự nhiên)';
      } else {
        feedbackVi = `Chuẩn ${TONE_SHORT[spokenTone]}`;
      }
    } else if (spokenTone === 1) {
      feedbackVi = `Đang bị nghiêng thành ${TONE_SHORT[detectedTone]} · cần giữ cao và phẳng ngang`;
    } else if (spokenTone === 2) {
      feedbackVi = `Đang giống ${TONE_SHORT[detectedTone]} · cần vuốt cao độ đi lên ở cuối`;
    } else if (spokenTone === 3) {
      feedbackVi = isFinal
        ? `Đang giống ${TONE_SHORT[detectedTone]} · cần hạ trầm xuống đáy (hoặc nửa dấu như dấu huyền)`
        : `Đang giống ${TONE_SHORT[detectedTone]} · cần hạ giọng xuống vùng trầm`;
    } else {
      feedbackVi = `Đang giống ${TONE_SHORT[detectedTone]} · cần hạ dứt khoát từ trên xuống (như dấu huyền)`;
    }

    return {
      detectedTone,
      score: shapeScore,
      userContour: chaoResampled,
      target,
      feedbackVi
    };
  }

  function computeCharMatch(targetText, transcript, parsedSyllables = []) {
    const expected = parsedSyllables.length ? parsedSyllables : parseSyllables(targetText);
    const heard = Array.from(String(transcript || '')).filter(c => /\p{Script=Han}/u.test(c));
    if (!expected.length || !heard.length) return null;

    const pyMap = buildPinyinLookup();
    const targetReadings = expected.map(({ han, pinyin }) => {
      const reading = tonelessPinyin(pinyin);
      return reading ? [reading] : Array.from(pyMap.get(han) || []);
    });
    const heardReadings = heard.map(han => pyMap.get(han));
    const gapCost = 10;
    const wrongCharCost = 11;
    const pairCost = (i, j) => {
      if (expected[i].han === heard[j]) return 0;
      if (targetReadings[i].some(reading => heardReadings[j]?.has(reading))) return 1;
      return wrongCharCost;
    };

    // Minimum-edit alignment consumes each recognized character once and preserves spoken order.
    const costs = Array.from({ length: expected.length + 1 }, () => new Uint32Array(heard.length + 1));
    for (let i = expected.length; i >= 0; i--) {
      for (let j = heard.length; j >= 0; j--) {
        if (i === expected.length) costs[i][j] = (heard.length - j) * gapCost;
        else if (j === heard.length) costs[i][j] = (expected.length - i) * gapCost;
        else costs[i][j] = Math.min(
          pairCost(i, j) + costs[i + 1][j + 1],
          gapCost + costs[i + 1][j],
          gapCost + costs[i][j + 1]
        );
      }
    }

    let hits = 0;
    const perChar = expected.map(() => false);
    const heardIndices = expected.map(() => -1);
    let i = 0;
    let j = 0;
    while (i < expected.length && j < heard.length) {
      const cost = pairCost(i, j);
      if (costs[i][j] === cost + costs[i + 1][j + 1]) {
        heardIndices[i] = j;
        perChar[i] = cost < wrongCharCost;
        if (perChar[i]) hits += cost === 0 ? 1 : 0.9;
        i++;
        j++;
      } else if (costs[i][j] === gapCost + costs[i + 1][j]) {
        i++;
      } else {
        j++;
      }
    }
    return {
      expectedCount: expected.length,
      heardCount: heard.length,
      heardText: heard.join(''),
      matchRatio: Math.round((hits / Math.max(expected.length, heard.length)) * 100),
      perChar,
      heardIndices
    };
  }

  /**
   * Segments audio into expected syllables and scores Mandarin tones + optional ASR transcript.
   */
  function segmentAndScore({ samples, sampleRate = 16000, text = '', pinyin = '', transcript = '' } = {}) {
    const parsed = parseSyllables(text, pinyin);
    const track = sampleRate > 16000 && samples?.length
      ? extractPitchTrack(resample16k(samples, sampleRate), 16000)
      : extractPitchTrack(samples, sampleRate);
    const voicedFrames = track.filter(f => f.f0 > 0);
    const charMatch = computeCharMatch(text, transcript, parsed);

    if (!parsed.length) {
      return {
        hasVoice: voicedFrames.length >= 4,
        overallScore: 0,
        toneScore: 0,
        syllables: [],
        pitchTrack: track,
        charMatch,
        summaryVi: 'Chưa có văn bản chữ Hán để đối chiếu.'
      };
    }

    if (voicedFrames.length < 4) {
      return {
        hasVoice: false,
        overallScore: 0,
        toneScore: 0,
        syllables: parsed.map((s, idx) => ({
          ...s,
          detectedTone: 0,
          score: 0,
          pronunciationVerified: false,
          userContour: [],
          target: targetContour(s.spokenTone, 12, s.isFinal),
          charMatched: charMatch ? Boolean(charMatch.perChar[idx]) : null,
          feedbackVi: 'Chưa thu được giọng rõ ràng.'
        })),
        pitchTrack: track,
        charMatch,
        summaryVi: charMatch ? 'Đã nhận diện được chữ. Tín hiệu cao độ chưa đủ để chấm thanh điệu.' : 'Chưa đủ tín hiệu giọng nói để chấm.'
      };
    }

    const peakTrackRms = Math.max(0.001, ...track.map(f => f.rms || 0));
    const ranges = findSyllableRanges(track, charMatch?.heardCount ?? parsed.length, peakTrackRms);
    const heardChars = Array.from(charMatch?.heardText || '');
    const segData = parsed.map((meta, idx) => {
      const heardIndex = charMatch?.heardIndices[idx] ?? idx;
      const [lo, hi] = ranges[heardIndex] || [0, 0];
      const segFrames = hi > lo ? track.slice(lo, hi) : [];
      const voiced = trimUnvoicedEdges(segFrames).filter(f => f.f0 > 0);
      const voicedCount = voiced.length;
      const segMeanRms = voicedCount ? voiced.reduce((s, f) => s + (f.rms || 0), 0) / voicedCount : 0;
      const segMeanClarity = voicedCount ? voiced.reduce((s, f) => s + (f.clarity || 0), 0) / voicedCount : 0;
      return { meta, segFrames, voiced, voicedCount, segMeanRms, segMeanClarity };
    });
    const peakSyllableRms = Math.max(0, ...segData.map(d => d.segMeanRms));

    const rawAnalyses = segData.map(d =>
      analyzeToneSegment(d.voiced, d.meta.spokenTone, d.meta.isFinal, d.meta.optionalNeutral, peakSyllableRms)
    );
    const isStrongSpoken = segData.map((d, idx) => {
      const a = rawAnalyses[idx];
      const isSoftTone = d.meta.spokenTone === 5 || d.meta.optionalNeutral;
      const minF = isSoftTone ? 3 : 4;
      const minC = isSoftTone ? 0.64 : 0.62;
      const minRms = isSoftTone ? 0.10 : 0.14;
      return d.voicedCount >= minF
        && d.segMeanClarity >= minC
        && (peakSyllableRms <= 0 || d.segMeanRms >= peakSyllableRms * minRms)
        && a.score >= 60;
    });
    const isStrongAnchor = segData.map((d, idx) =>
      isStrongSpoken[idx] && d.voicedCount >= 4 && d.segMeanClarity >= 0.62
    );

    const syllables = segData.map((d, idx) => {
      const { meta, segFrames, voicedCount, segMeanRms, segMeanClarity } = d;
      const analysis = rawAnalyses[idx];
      let score = analysis.score;
      let detectedTone = analysis.detectedTone;
      let feedbackVi = analysis.feedbackVi;
      const charMatched = charMatch ? Boolean(charMatch.perChar[idx]) : null;
      let pronunciationVerified = detectedTone > 0 ? charMatched : false;

      const hasSpokenBefore = idx > 0 && isStrongAnchor.slice(0, idx).some(Boolean);
      const hasSpokenAfter = idx < parsed.length - 1 && isStrongAnchor.slice(idx + 1).some(Boolean);
      const sandwichedUnstressed = Boolean(
        hasSpokenBefore
        && hasSpokenAfter
        && (meta.optionalNeutral || meta.spokenTone === 5)
      );
      const hasSoftSyllableEnergy = sandwichedUnstressed && segFrames.slice(2, -2).some((frame, k, inner) =>
        frame.rms >= peakSyllableRms * 0.15
        && inner[k + 1]?.rms >= peakSyllableRms * 0.15
        && inner[k + 2]?.rms >= peakSyllableRms * 0.15
      );

      if (sandwichedUnstressed && (detectedTone > 0 || hasSoftSyllableEnergy) && charMatched !== false && score < 82) {
        score = 84;
        detectedTone = meta.spokenTone === 5 ? 5 : meta.spokenTone;
        pronunciationVerified = charMatched;
        feedbackVi = 'Đọc lướt nhẹ tự nhiên giữa câu';
      } else if (idx > 0 && !hasSpokenAfter) {
        // Guard trailing syllables that collapse into wheeze/laugh or silence after an earlier word.
        const isSoftTone = meta.spokenTone === 5 || meta.optionalNeutral;
        const tailMinF = isSoftTone ? 3 : 4;
        const tailMinC = isSoftTone ? 0.64 : 0.62;
        const tailMinRms = isSoftTone ? 0.10 : 0.14;
        const weakOrNoisyTail = (
          voicedCount < tailMinF
          || segMeanClarity < tailMinC
          || (peakSyllableRms > 0 && segMeanRms < peakSyllableRms * tailMinRms)
          || score < 50
        );
        if (weakOrNoisyTail) {
          pronunciationVerified = false;
          score = Math.min(score, 35);
          feedbackVi = voicedCount
            ? 'Âm cuối quá nhỏ hoặc lẫn tiếng cười/tạp âm.'
            : 'Chưa phát âm rõ âm tiết này.';
        }
      }

      const heardChar = heardChars[charMatch?.heardIndices[idx]] || '';
      if (charMatched === false) {
        feedbackVi = heardChar
          ? `Máy nhận diện “${heardChar}”. Hãy đọc lại âm của chữ “${meta.han}”.`
          : `Máy chưa nhận ra chữ “${meta.han}”. Hãy đọc đủ cả cụm.`;
      }

      return {
        ...meta,
        startMs: segFrames[0]?.timeMs || 0,
        endMs: segFrames[segFrames.length - 1]?.timeMs || 0,
        ...analysis,
        detectedTone,
        score,
        feedbackVi,
        pronunciationVerified,
        charMatched
      };
    });

    const toneScore = syllables.length
      ? Math.round(syllables.reduce((sum, s) => sum + s.score, 0) / syllables.length)
      : 0;
    const verified = syllables.filter(s => s.pronunciationVerified === true);
    const incomplete = verified.length < syllables.length || charMatch?.heardCount > syllables.length;
    const verifiedToneScore = verified.reduce((sum, s) => sum + s.score, 0) / syllables.length;
    const overallScore = charMatch
      ? Math.min(incomplete ? 69 : 100, Math.round(verifiedToneScore * 0.7 + charMatch.matchRatio * 0.3))
      : toneScore;
    const wrongCount = syllables.filter(s =>
      s.pronunciationVerified === false
      || s.score < 65
      || (s.spokenTone !== 5 && !s.optionalNeutral && s.detectedTone !== s.spokenTone)
    ).length;

    let summaryVi;
    if (!charMatch) {
      summaryVi = 'Chỉ chấm thanh điệu vì chưa có kết quả nhận diện chữ.';
    } else if (verified.length < syllables.length) {
      summaryVi = `Xác nhận được ${verified.length}/${syllables.length} chữ. Xem lại những chữ được đánh dấu bên dưới.`;
    } else if (charMatch.heardCount > syllables.length) {
      summaryVi = 'Máy nghe thêm chữ ngoài cụm mẫu. Hãy đọc lại đúng cụm.';
    } else if (wrongCount === 0 && overallScore >= 80) {
      summaryVi = `Tuyệt vời! Bạn đọc chuẩn cả ${syllables.length} âm tiết (${overallScore}%).`;
    } else if (wrongCount === 0) {
      summaryVi = `Thanh điệu đi đúng hướng (${overallScore}%), có thể mở rộng độ cao/thấp thêm một chút để rõ nét hơn.`;
    } else {
      summaryVi = `Đúng ${syllables.length - wrongCount}/${syllables.length} thanh điệu (${overallScore}%). Xem lại các chữ đánh dấu cam bên dưới.`;
    }

    return {
      hasVoice: true,
      overallScore,
      toneScore,
      syllables,
      pitchTrack: track,
      charMatch,
      summaryVi
    };
  }

  function resample16k(samples, sampleRate) {
    if (sampleRate === 16000) return samples;
    const ratio = sampleRate / 16000;
    const result = new Float32Array(Math.max(1, Math.round(samples.length / ratio)));
    for (let i = 0; i < result.length; i++) {
      const start = i * ratio;
      const end = Math.min(samples.length, start + ratio);
      let sum = 0;
      for (let j = Math.floor(start); j < end; j++) {
        sum += samples[j] * (Math.min(j + 1, end) - Math.max(j, start));
      }
      result[i] = sum / (end - start);
    }
    return result;
  }

  /** Trims edge silence and writes a 16kHz mono PCM16 WAV. */
  function encodeWav16k(samples, inputSampleRate = 16000) {
    const targetRate = 16000;
    const input = samples instanceof Float32Array ? samples : new Float32Array(samples || 0);
    let peak = 0;
    for (const sample of input) peak = Math.max(peak, Math.abs(sample));
    if (!peak) {
      const empty = new Uint8Array(44);
      writeWavHeader(empty, 0, targetRate);
      return empty;
    }

    // Trim silence with 120ms safety padding.
    let first = 0;
    let last = input.length - 1;
    const gate = Math.min(0.008, peak * 0.15);
    while (first < last && Math.abs(input[first]) < gate) first++;
    while (last > first && Math.abs(input[last]) < gate) last--;
    const pad = Math.round(inputSampleRate * 0.12);
    first = Math.max(0, first - pad);
    last = Math.min(input.length - 1, last + pad);
    const trimmed = input.subarray(first, last + 1);

    const pcm16k = resample16k(trimmed, inputSampleRate);

    const dataBytes = pcm16k.length * 2;
    const out = new Uint8Array(44 + dataBytes);
    writeWavHeader(out, dataBytes, targetRate);
    const view = new DataView(out.buffer);
    for (let i = 0; i < pcm16k.length; i++) {
      const clamped = Math.max(-1, Math.min(1, pcm16k[i]));
      view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    }
    return out;
  }

  function writeWavHeader(bytes, dataLength, sampleRate) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const str = (offset, text) => {
      for (let i = 0; i < text.length; i++) bytes[offset + i] = text.charCodeAt(i);
    };
    str(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    str(8, 'WAVE');
    str(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    str(36, 'data');
    view.setUint32(40, dataLength, true);
  }

  const api = {
    TONE_NAMES,
    TONE_SHORT,
    parseSyllables,
    extractPitchTrack,
    quickVoicedClarity,
    computeCharMatch,
    targetContour,
    dtwDistance,
    segmentAndScore,
    encodeWav16k
  };

  root.HSKPitchCore = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window === 'object' ? window : globalThis);
