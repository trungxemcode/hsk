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

  const DEFAULT_CHANNELS = [
    {
      id: 'learn-chinese-through-podcast',
      handle: '@LearnChineseThroughPodcast',
      channelId: 'UCI8Liuxdz6UPv5rgMskfwPg',
      name: 'Learn Chinese Through Podcast',
      url: 'https://www.youtube.com/@LearnChineseThroughPodcast',
      feedUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCI8Liuxdz6UPv5rgMskfwPg',
      description: 'Podcast luyện nghe HSK 2–4 theo chủ đề đời sống, văn hóa, ẩm thực & thành ngữ (có sẵn phụ đề Trung + Việt).'
    },
    {
      id: 'baobao-mandarin',
      handle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      name: 'BaoBao Mandarin',
      url: 'https://www.youtube.com/@BaoBaoMandarin',
      feedUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCYHKAec4JjyR_DC2obXv1Yg',
      description: 'Podcast tiếng Trung tự nhiên HSK 1–6 từ cơ bản đến nâng cao (có sẵn phụ đề Trung + Việt).'
    }
  ];

  const STARTER_EPISODES = [
    {
      id: 'ep-bb-hsk12-hui-yao-neng',
      youtubeId: 'hhkIZ3gOIcs',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1–3 | 会 VS 要 VS 能 | Stop Confusing 会，要，能',
      titleVi: 'Phân biệt 会 · 要 · 能 trong tiếng Trung giao tiếp (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 1162,
      durationLabel: '19:22',
      topic: 'Ngữ pháp & khẩu ngữ',
      note: 'Tập thật từ kênh BaoBao Mandarin (@BaoBaoMandarin) — chọn tập để tự động nạp trọn bộ phụ đề song ngữ Trung · Việt từ YouTube.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cues: [
        {
          start: 0,
          end: 12.7,
          en: 'Hi everyone, welcome to BaoBao Mandarin! I am XiaoYue.',
          zh: '宝贝们，大家好～欢迎来到 BaoBao Mandarin！我是小月！',
          pinyin: 'Bǎobèi men, dàjiā hǎo ~ huānyíng láidào BaoBao Mandarin! Wǒ shì Xiǎoyuè!',
          vi: 'Xin chào các Bảo Bối! Chào mừng đến với BaoBao Mandarin! Mình là Tiểu Nguyệt!'
        },
        {
          start: 12.7,
          end: 16.8,
          en: 'Hello everyone... I am XiaoMing...',
          zh: '大家好……我是小明……',
          pinyin: 'Dàjiā hǎo…… wǒ shì Xiǎomíng……',
          vi: 'Chào mọi người... Mình là Tiểu Minh...'
        },
        {
          start: 16.8,
          end: 23.8,
          en: 'Hey XiaoMing, what is wrong today? You look like you have a bit of a headache?',
          zh: '欸，小明，你今天怎么了？看起来好像有点头疼哦？',
          pinyin: 'Ēi, Xiǎomíng, nǐ jīntiān zěnme le? Kàn qǐlái hǎoxiàng yǒudiǎn tóuténg ó?',
          vi: 'Ê, Tiểu Minh, hôm nay bạn sao vậy? Trông như đang bị đau đầu ấy.'
        },
        {
          start: 23.8,
          end: 30.2,
          en: 'It really hurts! Learning Chinese is so hard — the more I study, the more confused I get!',
          zh: '头疼是真的！哎，学中文太难了！越学越糊涂！',
          pinyin: 'Tóuténg shì zhēn de! Āi, xué Zhōngwén tài nán le! Yuè xué yuè hútu!',
          vi: 'Đau đầu thật đó! Ôi, tiếng Trung khó quá — càng học càng thấy rối!'
        },
        {
          start: 30.2,
          end: 36.1,
          en: 'I thought I was improving, but it feels like I was fooling myself...',
          zh: '我以为自己在进步，结果……好像是自己骗自己……',
          pinyin: 'Wǒ yǐwéi zìjǐ zài jìnbù, jiéguǒ…… hǎoxiàng shì zìjǐ piàn zìjǐ……',
          vi: 'Mình cứ tưởng là đang tiến bộ, nhưng... có cảm giác như chỉ đang tự lừa mình thôi...'
        },
        {
          start: 36.1,
          end: 45.7,
          en: 'What happened? Tell me what you do not understand — I can help you!',
          zh: '哎哟，怎么了嘛？哪里学不懂就说出来呗！我来帮你！',
          pinyin: 'Āiyō, zěnme le ma? Nǎlǐ xué bù dǒng jiù shuō chūlái bei! Wǒ lái bāng nǐ!',
          vi: 'Ôi, sao vậy? Chỗ nào không hiểu thì cứ nói ra đi! Để mình giúp bạn!'
        }
      ]
    },
    {
      id: 'ep-lctp-hsk12-greetings',
      youtubeId: 'aYrCe-KTmTg',
      level: 'HSK 2–4',
      levelGroup: 'hsk1-2',
      title: 'HSK 2 - 4 | Stop Saying Ni Hao Ma: Natural Chinese Greetings for Daily Life',
      titleVi: 'Đừng chỉ nói “你好吗”: Cách chào hỏi tự nhiên của người Trung Quốc',
      channel: 'Learn Chinese Through Podcast',
      channelName: 'Learn Chinese Through Podcast',
      channelHandle: '@LearnChineseThroughPodcast',
      channelId: 'UCI8Liuxdz6UPv5rgMskfwPg',
      channelUrl: 'https://www.youtube.com/@LearnChineseThroughPodcast',
      durationSec: 1096,
      durationLabel: '18:16',
      topic: 'Giao tiếp đời sống',
      note: 'Tập thật từ kênh @LearnChineseThroughPodcast (Hạo Văn & Vũ Đồng) — chọn tập để tự động nạp trọn bộ phụ đề Trung · Việt.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cues: [
        {
          start: 0,
          end: 6.7,
          en: 'This morning,',
          zh: '今天早上，',
          pinyin: 'Jīntiān zǎoshang,',
          vi: 'Sáng nay,'
        },
        {
          start: 6.7,
          end: 9.4,
          en: 'I ran into a colleague in the company elevator.',
          zh: '我在公司电梯里遇到一位同事。',
          pinyin: 'Wǒ zài gōngsī diàntī lǐ yùdào yí wèi tóngshì.',
          vi: 'tôi gặp một đồng nghiệp trong thang máy công ty.'
        },
        {
          start: 9.4,
          end: 12.4,
          en: 'I said first, "Hello, how are you?"',
          zh: '我先说：“你好，你好吗？”',
          pinyin: 'Wǒ xiān shuō: “Nǐ hǎo, nǐ hǎo ma?”',
          vi: 'Tôi nói trước: "Chào, bạn khỏe không?"'
        },
        {
          start: 12.4,
          end: 13.8,
          en: 'He looked at me,',
          zh: '他看着我，',
          pinyin: 'Tā kànzhe wǒ,',
          vi: 'Anh ấy nhìn tôi,'
        },
        {
          start: 13.8,
          end: 18,
          en: 'paused for a moment, and said, "I... am pretty good."',
          zh: '停了一下，说：“我……挺好的。”',
          pinyin: 'tíng le yíxià, shuō: “Wǒ…… tǐng hǎo de.”',
          vi: 'im lặng một lúc rồi nói: "Tôi... tôi khỏe."'
        },
        {
          start: 18,
          end: 21.3,
          en: 'And then you both just stared at the elevator door?',
          zh: '然后呢？你们就一起看着电梯门？',
          pinyin: 'Ránhòu ne? Nǐmen jiù yìqǐ kànzhe diàntī mén?',
          vi: 'Và sau đó cả hai người chỉ nhìn chằm chằm vào cửa thang máy à?'
        }
      ]
    },
    {
      id: 'ep-lctp-hsk3-yanerdaoling',
      youtubeId: 'CqNO2psWIyU',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2 - 4 | 掩耳盗铃: Can We Fool Ourselves? | Chinese Listening Practice',
      titleVi: 'Thành ngữ 掩耳盗铃 (Bịt tai trộm chuông) & Tâm lý tự đánh lừa mình',
      channel: 'Learn Chinese Through Podcast',
      channelName: 'Learn Chinese Through Podcast',
      channelHandle: '@LearnChineseThroughPodcast',
      channelId: 'UCI8Liuxdz6UPv5rgMskfwPg',
      channelUrl: 'https://www.youtube.com/@LearnChineseThroughPodcast',
      durationSec: 1082,
      durationLabel: '18:02',
      topic: 'Thành ngữ & câu chuyện',
      note: 'Tập thật từ kênh @LearnChineseThroughPodcast — có đầy đủ phụ đề tiếng Trung Giản thể + tiếng Việt đồng bộ theo từng giây.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cues: [
        {
          start: 0,
          end: 11.4,
          en: 'This morning, as soon as the alarm rang,',
          zh: '今天早上“闹钟”一响，',
          pinyin: 'Jīntiān zǎoshang “nàozhōng” yì xiǎng,',
          vi: 'Sáng nay, vừa chuông báo thức reo,'
        },
        {
          start: 11.4,
          end: 13.1,
          en: 'I reached out and turned it off,',
          zh: '我伸手把它关了，',
          pinyin: 'wǒ shēnshǒu bǎ tā guān le,',
          vi: 'tôi đã với tay tắt nó đi,'
        },
        {
          start: 13.1,
          end: 15.8,
          en: 'and told myself: "Lie down a bit longer,',
          zh: '还对自己说：“再躺一会儿，',
          pinyin: 'hái duì zìjǐ shuō: “Zài tǎng yíhuìr,',
          vi: 'còn tự nhủ: "Nằm thêm chút nữa,'
        },
        {
          start: 15.8,
          end: 18.8,
          en: 'I still have plenty of time."',
          zh: '我还有很多时间。”',
          pinyin: 'wǒ hái yǒu hěn duō shíjiān.”',
          vi: 'mình vẫn còn nhiều thời gian."'
        },
        {
          start: 18.8,
          end: 21.7,
          en: 'When I checked the time, I immediately sat right up.',
          zh: '结果一看时间，我马上坐了起来。',
          pinyin: 'Jiéguǒ yí kàn shíjiān, wǒ mǎshàng zuò le qǐlái.',
          vi: 'Nhưng khi nhìn giờ, tôi lập tức ngồi dậy.'
        },
        {
          start: 21.7,
          end: 26,
          en: 'Even though I knew I should get up, I chose to look away.',
          zh: '明明知道该起床了，却假装没看见。',
          pinyin: 'Míngmíng zhīdào gāi qǐchuáng le, què jiǎzhuāng méi kànjiàn.',
          vi: 'Rõ ràng biết phải dậy rồi, nhưng lại giả vờ như không thấy.'
        }
      ]
    },
    {
      id: 'ep-bb-hsk3-five-habits',
      youtubeId: 'qTKcybgpT8M',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2–4 | 学中文不那么难！| 5 Habits Made Chinese Easy!',
      titleVi: '5 thói quen giúp học tiếng Trung dễ dàng hơn (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 983,
      durationLabel: '16:23',
      topic: 'Phương pháp học tập',
      note: 'Tiểu Nguyệt & Tiểu Minh chia sẻ 5 thói quen thực tế giúp nghe nói tiếng Trung tự nhiên mỗi ngày.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cues: [
        {
          start: 0,
          end: 8.6,
          en: 'Hello everyone, dear Baobeis!',
          zh: '大家好，亲爱的宝贝们，',
          pinyin: 'Dàjiā hǎo, qīn’ài de bǎobèi men,',
          vi: 'Xin chào các Bảo Bối thân yêu!'
        },
        {
          start: 8.6,
          end: 10.3,
          en: 'Welcome back to BaoBao Mandarin,',
          zh: '欢迎回到宝宝中文，',
          pinyin: 'huānyíng huídào Bǎobǎo Zhōngwén,',
          vi: 'Chào mừng trở lại BaoBao Mandarin!'
        },
        {
          start: 10.3,
          end: 13.8,
          en: 'I am XiaoYue. Hi everyone, I am XiaoMing.',
          zh: '我是小月。宝贝们好，我是小明。',
          pinyin: 'Wǒ shì Xiǎoyuè. Bǎobèi men hǎo, wǒ shì Xiǎomíng.',
          vi: 'Mình là Tiểu Nguyệt. Chào các Bảo Bối, mình là Tiểu Minh.'
        },
        {
          start: 13.8,
          end: 17.7,
          en: 'Hey XiaoYue, I have been waiting for today’s topic for a long time!',
          zh: '哎小月，今天这个话题我等了好久了。',
          pinyin: 'Āi Xiǎoyuè, jīntiān zhège huàtí wǒ děng le hǎojiǔ le.',
          vi: 'Này Tiểu Nguyệt, mình đã chờ chủ đề hôm nay lâu lắm rồi.'
        },
        {
          start: 17.7,
          end: 22.5,
          en: 'Haha I know, because this is the question everyone asks the most.',
          zh: '哈哈我知道我知道，因为这是大家问得最多的问题。',
          pinyin: 'Hāhā wǒ zhīdào wǒ zhīdào, yīnwèi zhè shì dàjiā wèn de zuìduō de wèntí.',
          vi: 'Haha mình biết! Vì đây là câu hỏi mọi người hỏi nhiều nhất.'
        }
      ]
    },
    {
      id: 'ep-lctp-hsk3-white-snake',
      youtubeId: 'huEhDinrgQQ',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2 - 4 | White Snake Legend: The Story Behind West Lake',
      titleVi: 'Truyền thuyết Bạch Xà (白蛇传): Câu chuyện phía sau Tây Hồ',
      channel: 'Learn Chinese Through Podcast',
      channelName: 'Learn Chinese Through Podcast',
      channelHandle: '@LearnChineseThroughPodcast',
      channelId: 'UCI8Liuxdz6UPv5rgMskfwPg',
      channelUrl: 'https://www.youtube.com/@LearnChineseThroughPodcast',
      durationSec: 1061,
      durationLabel: '17:41',
      topic: 'Văn hóa & truyền thuyết',
      note: 'Câu chuyện Bạch Tố Trinh & Hứa Tiên bên Tây Hồ Hàng Châu, từ vựng mượt mà cho trình độ HSK 3–4.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 24,
      cues: [
        {
          start: 0,
          end: 10.8,
          en: 'I was just strolling by West Lake,',
          zh: '我刚才在西湖边散步，',
          pinyin: 'Wǒ gāngcái zài Xīhú biān sànbù,',
          vi: 'Tôi vừa đi dạo bên Tây Hồ thì'
        },
        {
          start: 10.8,
          end: 14.5,
          en: 'and saw a white umbrella leaning next to a bench.',
          zh: '看到一把白伞靠在长椅旁边。',
          pinyin: 'kàndào yì bǎ bái sǎn kào zài chángyǐ pángbiān.',
          vi: 'thấy một chiếc ô trắng dựa vào cạnh ghế đá.'
        },
        {
          start: 14.5,
          end: 18,
          en: 'When the wind blew, the umbrella swayed gently,',
          zh: '风一吹，伞轻轻动了一下，',
          pinyin: 'Fēng yì chuī, sǎn qīngqīng dòng le yíxià,',
          vi: 'Gió thổi nhẹ, chiếc ô khẽ đung đưa,'
        },
        {
          start: 18,
          end: 21.4,
          en: 'and I immediately thought of Bai Suzhen and Xu Xian.',
          zh: '我马上想起了白素贞和许仙。',
          pinyin: 'wǒ mǎshàng xiǎngqǐ le Bái Sùzhēn hé Xǔ Xiān.',
          vi: 'tôi lập tức nghĩ đến Bạch Tố Trinh và Hứa Tiên.'
        },
        {
          start: 21.4,
          end: 24.9,
          en: 'Just a white umbrella reminded you of them?',
          zh: '一把白伞就让你想到他们了？',
          pinyin: 'Yì bǎ bái sǎn jiù ràng nǐ xiǎngdào tāmen le?',
          vi: 'Chỉ một chiếc ô trắng thôi đã làm anh nhớ đến họ sao?'
        },
        {
          start: 24.9,
          end: 31.9,
          en: 'Every time I see West Lake’s water and bridges, it feels like stepping into a story.',
          zh: '我每次看到西湖的水和桥，也会觉得像是走进了一个故事里。',
          pinyin: 'Wǒ měicì kàndào Xīhú de shuǐ hé qiáo, yě huì juéde xiàngshì zǒujìn le yí gè gùshi lǐ.',
          vi: 'Mỗi lần nhìn thấy mặt nước và những cây cầu ở Tây Hồ, tôi đều cảm thấy như bước vào một câu chuyện.'
        }
      ]
    },
    {
      id: 'ep-lctp-hsk4-eight-cuisines',
      youtubeId: 'xivjMEMEAvE',
      level: 'HSK 2–4',
      levelGroup: 'hsk4',
      title: 'HSK 2 - 4 | Chinese Eight Great Cuisines: Beijing Flavor to Sichuan Spice',
      titleVi: 'Bát đại thái hệ (八大菜系): Từ hương vị Bắc Kinh đến vị cay Tứ Xuyên',
      channel: 'Learn Chinese Through Podcast',
      channelName: 'Learn Chinese Through Podcast',
      channelHandle: '@LearnChineseThroughPodcast',
      channelId: 'UCI8Liuxdz6UPv5rgMskfwPg',
      channelUrl: 'https://www.youtube.com/@LearnChineseThroughPodcast',
      durationSec: 1152,
      durationLabel: '19:12',
      topic: 'Ẩm thực Trung Hoa',
      note: 'Học từ vựng miêu tả hương vị, lẩu Tứ Xuyên và bản đồ 8 trường phái ẩm thực lớn của Trung Quốc.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 24,
      cues: [
        {
          start: 0,
          end: 10.1,
          en: 'I had just finished brewing tea,',
          zh: '我刚泡好茶，',
          pinyin: 'Wǒ gāng pàohǎo chá,',
          vi: 'Tôi vừa pha xong trà'
        },
        {
          start: 10.1,
          end: 11.9,
          en: 'when Yutong sent me a message,',
          zh: '雨桐就发来消息，',
          pinyin: 'Yǔtóng jiù fālái xiāoxi,',
          vi: 'thì Vũ Đồng nhắn tin đến,'
        },
        {
          start: 11.9,
          end: 16.2,
          en: 'saying she kept drinking tea while eating Sichuan hotpot.',
          zh: '说她吃四川火锅吃到一直喝茶。',
          pinyin: 'shuō tā chī Sìchuān huǒguō chīdào yìzhí hē chá.',
          vi: 'bảo cô ấy ăn lẩu Tứ Xuyên cay đến mức phải uống trà liên tục.'
        },
        {
          start: 16.2,
          end: 18.8,
          en: 'How are you doing over there now?',
          zh: '你那边现在还好吗？',
          pinyin: 'Nǐ nàbiān xiànzài hái hǎo ma?',
          vi: 'Cậu bên đó giờ thế nào rồi?'
        },
        {
          start: 18.8,
          end: 21.5,
          en: 'I just got hit so hard by the spice,',
          zh: '我刚才真的被辣到了，',
          pinyin: 'Wǒ gāngcái zhēnde bèi là dào le,',
          vi: 'Tớ vừa bị cay tê người luôn,'
        },
        {
          start: 21.5,
          end: 26,
          en: 'my mouth was spicy and numb, and I had to drink several cups of tea to recover.',
          zh: '嘴里又辣又麻，喝了好几杯茶才慢慢缓过来。',
          pinyin: 'zuǐ lǐ yòu là yòu má, hē le hǎojǐ bēi chá cái mànmàn huǎn guòlái.',
          vi: 'miệng vừa cay vừa tê, phải uống mấy chén trà mới từ từ dịu lại được.'
        }
      ]
    },
    {
      id: 'ep-bb-hsk4-short-drama',
      youtubeId: 'MupmlHHMU7k',
      level: 'HSK 3–5',
      levelGroup: 'hsk4',
      title: 'HSK 3–5 | 中国短剧有什么好看的？| Why Everyone Loves Chinese Short Drama?!',
      titleVi: 'Vì sao phim ngắn Trung Quốc (短剧) gây nghiện? (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 989,
      durationLabel: '16:29',
      topic: 'Giải trí & xã hội',
      note: 'Hội thoại tốc độ tự nhiên HSK 3–5 bàn về trào lưu xem phim ngắn 1–2 phút và văn hóa giải trí hiện đại.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 24,
      cues: [
        {
          start: 0,
          end: 8.1,
          en: 'Hello, hello, dear Baobeis!',
          zh: '哈啰哈啰，亲爱的宝贝们！',
          pinyin: 'Hāluō hāluō, qīn’ài de bǎobèi men!',
          vi: 'Xin chào, xin chào các Bảo Bối thân yêu!'
        },
        {
          start: 8.1,
          end: 10.7,
          en: 'Welcome to BaoBao Mandarin, I am XiaoMing.',
          zh: '欢迎来到宝宝中文，我是小明。',
          pinyin: 'Huānyíng láidào Bǎobǎo Zhōngwén, wǒ shì Xiǎomíng.',
          vi: 'Chào mừng đến với BaoBao Mandarin. Mình là Tiểu Minh.'
        },
        {
          start: 10.7,
          end: 16.9,
          en: 'Hi everyone... sorry, I am XiaoYue.',
          zh: '宝贝们好……不好意思，我是小月。',
          pinyin: 'Bǎobèi men hǎo…… bù hǎoyìsi, wǒ shì Xiǎoyuè.',
          vi: 'Xin chào mọi người... Xin lỗi nhé, mình là Tiểu Nguyệt.'
        },
        {
          start: 16.9,
          end: 20.1,
          en: 'XiaoYue, why do you look so tired today?',
          zh: '小月，你今天怎么看起来没精神？',
          pinyin: 'Xiǎoyuè, nǐ jīntiān zěnme kàn qǐlái méi jīngshén?',
          vi: 'Tiểu Nguyệt, sao hôm nay trông cậu mệt mỏi thiếu sức sống thế?'
        },
        {
          start: 20.1,
          end: 23.3,
          en: 'Your eyes are even red — did you not sleep well last night?',
          zh: '眼睛还红红的，是不是昨晚没睡好？',
          pinyin: 'Yǎnjīng hái hónghóng de, shì bu shì zuówǎn méi shuì hǎo?',
          vi: 'Mắt cậu còn hơi đỏ nữa, tối qua ngủ không ngon à?'
        }
      ]
    },
    {
      id: 'ep-bb-hsk56-overtime-996',
      youtubeId: 'i8emBnSpS3I',
      level: 'HSK 5–6',
      levelGroup: 'hsk5-6',
      title: 'HSK 3+ | 中国加班文化 | Working 72 Hours a Week?! China’s 996 Work Culture',
      titleVi: 'Văn hóa tăng ca 996 ở Trung Quốc: Làm việc 72 giờ/tuần? (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 880,
      durationLabel: '14:40',
      topic: 'Công sở & xã hội hiện đại',
      note: 'Tập nâng cao có sẵn đủ 3 lớp Trung · Việt · Anh trên YouTube, phân tích áp lực công việc và văn hóa 996.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 24,
      cues: [
        {
          start: 0,
          end: 8.3,
          en: 'Hello, hello, everyone!',
          zh: '哈喽哈喽大家好，',
          pinyin: 'Hālóu hālóu dàjiā hǎo,',
          vi: 'Xin chào, xin chào mọi người!'
        },
        {
          start: 8.3,
          end: 10.1,
          en: 'Welcome to BaoBao Mandarin.',
          zh: '欢迎来到宝宝中文，',
          pinyin: 'Huānyíng láidào Bǎobǎo Zhōngwén,',
          vi: 'Chào mừng đến với BaoBao Mandarin.'
        },
        {
          start: 10.1,
          end: 12.9,
          en: 'I’m XiaoYue. Hi everyone, I’m XiaoMing.',
          zh: '我是小月。大家好我是小明。',
          pinyin: 'Wǒ shì Xiǎoyuè. Dàjiā hǎo wǒ shì Xiǎomíng.',
          vi: 'Mình là Tiểu Nguyệt. Chào mọi người, mình là Tiểu Minh.'
        },
        {
          start: 13,
          end: 16.5,
          en: 'Our Baobeis, today’s topic',
          zh: '各位宝贝们，今天我们要聊的话题，',
          pinyin: 'Gèwèi bǎobèi men, jīntiān wǒmen yào liáo de huàtí,',
          vi: 'Các Bảo Bối ơi, chủ đề hôm nay chúng ta bàn'
        },
        {
          start: 16.5,
          end: 19.5,
          en: 'is one I find really interesting — China’s 996 overtime work culture.',
          zh: '我觉得真的挺有意思的——中国的加班文化。',
          pinyin: 'wǒ juéde zhēnde tǐng yǒu yìsi de — Zhōngguó de jiābān wénhuà.',
          vi: 'mình thấy thật sự rất thú vị — văn hóa tăng ca ở Trung Quốc.'
        }
      ]
    }
  ];

  const HAN_REGEX = /\p{Script=Han}/u;

  const TRAD_TO_SIMP_PAIRS = [
    '萬万', '與与', '專专', '業业', '東东', '絲丝', '兩两', '嚴严', '喪丧', '個个',
    '臨临', '為为', '麗丽', '舉举', '義义', '烏乌', '樂乐', '喬乔', '習习', '鄉乡',
    '書书', '買买', '亂乱', '爭争', '亞亚', '親亲', '億亿', '僅仅', '後后', '臺台',
    '從从', '侖仑', '倉仓', '儀仪', '們们', '價价', '眾众', '優优', '會会', '傳传',
    '傷伤', '倫伦', '偽伪', '體体', '餘余', '來来', '側侧', '偵侦', '備备', '傢家',
    '兒儿', '內内', '冊册', '寫写', '軍军', '農农', '準准', '涼凉', '幾几', '凱凯',
    '別别', '刪删', '則则', '剛刚', '創创', '劉刘', '劍剑', '劇剧', '勸劝', '辦办',
    '動动', '務务', '勝胜', '勞劳', '勢势', '區区', '醫医', '華华', '協协', '單单',
    '賣卖', '衛卫', '廠厂', '廳厅', '歷历', '厲厉', '壓压', '厭厌', '參参', '雙双',
    '發发', '變变', '葉叶', '號号', '嗎吗', '聽听', '啟启', '吳吴', '員员', '響响',
    '問问', '囉啰', '園园', '圍围', '圖图', '團团', '國国', '圓圆', '場场', '塊块',
    '壞坏', '報报', '壽寿', '夠够', '夢梦', '頭头', '奪夺', '獎奖', '媽妈', '嬰婴',
    '學学', '實实', '寬宽', '寶宝', '對对', '導导', '將将', '尋寻', '層层', '屬属',
    '歲岁', '島岛', '嶺岭', '師师', '帶带', '幫帮', '幹干', '廣广', '張张', '強强',
    '彈弹', '歸归', '當当', '錄录', '復复', '憶忆', '懷怀', '態态', '總总', '戀恋',
    '惡恶', '愛爱', '慣惯', '應应', '懶懒', '戰战', '戲戏', '戶户', '擔担', '換换',
    '據据', '擺摆', '擴扩', '攝摄', '數数', '敵敌', '斷断', '於于', '無无', '時时',
    '暫暂', '暢畅', '機机', '條条', '極极', '標标', '樓楼', '樣样', '樹树', '檢检',
    '權权', '歡欢', '氣气', '沒没', '溫温', '漢汉', '點点', '燒烧', '營营', '獨独',
    '現现', '環环', '產产', '電电', '畫画', '畢毕', '識识', '確确', '視视', '禮礼',
    '離离', '種种', '稱称', '積积', '穩稳', '窮穷', '競竞', '筆笔', '簡简', '節节',
    '範范', '籃篮', '類类', '緊紧', '紅红', '約约', '級级', '細细', '終终', '組组',
    '經经', '結结', '給给', '統统', '網网', '線线', '績绩', '繼继', '續续', '聯联',
    '職职', '腦脑', '臉脸', '藝艺', '藍蓝', '藥药', '蘇苏', '處处', '裝装', '裡里',
    '裏里', '補补', '見见', '觀观', '規规', '覺觉', '覽览', '訂订', '計计', '討讨',
    '訓训', '記记', '設设', '許许', '訴诉', '詞词', '試试', '詩诗', '話话', '該该',
    '詳详', '語语', '誤误', '說说', '誰谁', '課课', '調调', '談谈', '請请', '論论',
    '警警', '譯译', '議议', '護护', '讀读', '讓让', '貝贝', '負负', '財财', '貨货',
    '貧贫', '責责', '費费', '貼贴', '貴贵', '資资', '賽赛', '贊赞', '贏赢', '超超',
    '車车', '軌轨', '軟软', '較较', '載载', '輕轻', '輝辉', '輸输', '轉转', '辭辞',
    '這这', '進进', '連连', '過过', '達达', '遠远', '適适', '選选', '還还', '郵邮',
    '釋释', '針针', '銀银', '錯错', '錢钱', '鎮镇', '鏡镜', '長长', '門门', '開开',
    '間间', '關关', '陰阴', '陽阳', '際际', '隨随', '險险', '隱隐', '難难', '雲云',
    '靈灵', '靜静', '頁页', '頂顶', '順顺', '須须', '領领', '題题', '顏颜', '願愿',
    '風风', '飛飞', '飯饭', '飲饮', '飾饰', '飽饱', '館馆', '馬马', '騎骑', '騙骗',
    '騷骚', '驗验', '體体', '髮发', '鬧闹', '魚鱼', '鮮鲜', '鳥鸟', '雞鸡', '麥麦',
    '麵面', '黃黄', '齊齐', '齒齿', '龍龙', '龜龟', '麼么', '噹当', '唄呗', '欸诶'
  ];

  const TRAD_TO_SIMP_MAP = new Map();
  for (let idx = 0; idx < TRAD_TO_SIMP_PAIRS.length; idx += 1) {
    const pair = TRAD_TO_SIMP_PAIRS[idx];
    if (pair.length === 2 && pair[0] !== pair[1]) {
      TRAD_TO_SIMP_MAP.set(pair[0], pair[1]);
    }
  }

  function toSimplifiedChinese(text) {
    const str = String(text || '');
    if (!str) return '';
    let out = '';
    for (let i = 0; i < str.length; i += 1) {
      const ch = str[i];
      out += TRAD_TO_SIMP_MAP.get(ch) || ch;
    }
    return out;
  }

  function extractYoutubeChannelKey(input) {
    const raw = String(input || '').trim();
    if (!raw) return null;
    const lower = raw.toLowerCase();
    for (let i = 0; i < DEFAULT_CHANNELS.length; i += 1) {
      const ch = DEFAULT_CHANNELS[i];
      if (
        lower === ch.id
        || lower === ch.handle.toLowerCase()
        || lower === ch.channelId.toLowerCase()
        || lower.includes(ch.handle.toLowerCase())
        || lower.includes(ch.channelId.toLowerCase())
        || lower.includes(ch.handle.slice(1).toLowerCase())
      ) {
        return ch;
      }
    }
    return null;
  }

  function inferHskLevelFromTitle(title) {
    const text = String(title || '');
    const m = text.match(/HSK\s*([1-6])(?:\s*[-–~]\s*([1-6]))?/i);
    if (m) {
      const lo = Number(m[1]);
      const hi = m[2] ? Number(m[2]) : lo;
      if (lo === 1 && hi <= 3) return { level: hi === 3 ? 'HSK 1–3' : 'HSK 1–2', levelGroup: 'hsk1-2' };
      if (lo <= 2 && hi <= 4) return { level: 'HSK 2–4', levelGroup: 'hsk3' };
      if (lo === 3 && hi >= 5) return { level: 'HSK 3–5', levelGroup: 'hsk4' };
      if (lo >= 5 || hi >= 6) return { level: 'HSK 5–6', levelGroup: 'hsk5-6' };
      if (lo === 4) return { level: 'HSK 4', levelGroup: 'hsk4' };
      if (lo === 3) return { level: 'HSK 3+', levelGroup: 'hsk3' };
      return { level: `HSK ${lo}`, levelGroup: lo <= 2 ? 'hsk1-2' : (lo === 3 ? 'hsk3' : (lo === 4 ? 'hsk4' : 'hsk5-6')) };
    }
    return { level: 'HSK 2–4', levelGroup: 'hsk3' };
  }

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
      const zhText = opts.simplify ? toSimplifiedChinese(cue.zh || '') : (cue.zh || '');
      const next = {
        start: cue.start,
        end: cue.end,
        zh: zhText,
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
    DEFAULT_CHANNELS,
    STARTER_EPISODES,
    extractYoutubeId,
    extractYoutubeChannelKey,
    inferHskLevelFromTitle,
    toSimplifiedChinese,
    parseTimestampToSec,
    formatTimestamp,
    parseSubtitleText,
    normalizePodcastCues,
    enrichCuesLocal,
    findActiveCueIndex,
    segmentChineseLine
  };
});
