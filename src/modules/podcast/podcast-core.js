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
    },
    {
      id: 'chinese-daily-podcast',
      handle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      name: 'Chinese Daily Podcast',
      url: 'https://www.youtube.com/@ChineseDailyPodcast',
      feedUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCyYT-HdG1FXua6_vwyXNqhg',
      description: 'Podcast tâm sự & suy ngẫm tiếng Trung hàng ngày (có tập kèm trọn bộ script 4 lớp Hán · Pinyin · Việt · Anh).'
    },
    {
      id: 'panda-studio',
      handle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      name: 'Panda Studio',
      url: 'https://www.youtube.com/@PandaStudio24',
      feedUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCnXr9o-f4MXHdgq_QN3QFiw',
      description: 'Luyện đọc tiếng Trung HSK 3 theo chủ đề đời sống (có sẵn trọn bộ script 4 lớp Hán · Pinyin · Việt · Anh).'
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
      note: 'Tập thật từ kênh BaoBao Mandarin (@BaoBaoMandarin) — đã nạp sẵn trọn bộ 147 câu phụ đề song ngữ Trung · Pinyin · Việt (19:22).',
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
        },
        {
          start: 45.7,
          end: 50,
          en: 'Oh, right! Great! Here’s the thing, XiaoYue… When I first started learning Chinese,',
          zh: '哦，对！太好了！是这样的，小月……我刚开始学中文的时候，',
          pinyin: 'Ó, duì! Tài hǎo le! Shì zhèyàng de, Xiǎoyuè… Wǒ gāng kāishǐ xué Zhōngwén de shíhou,',
          vi: 'Ồ, đúng rồi! Hay quá! Chuyện là thế này, Tiểu Nguyệt… Hồi tôi mới bắt đầu học tiếng Trung,'
        },
        {
          start: 50,
          end: 63,
          en: '“会” means knowing how to do something, as in “我会游泳” — “I can swim.” “要” means wanting something, as in “我要一杯咖啡” — “I want a cup of coffee.” It seemed pretty simple back then.',
          zh: '“会”是“懂得怎么做某件事”的意思，比如“我会游泳”。“要”是“想要”的意思，比如“我要一杯咖啡”。那时候我觉得挺简单的。',
          pinyin: '“Huì” shì “dǒngde zěnme zuò mǒu jiàn shì” de yìsi, bǐrú “wǒ huì yóuyǒng”. “Yào” shì “xiǎng yào” de yìsi, bǐrú “wǒ yào yì bēi kāfēi”. Nà shíhou wǒ juéde tǐng jiǎndān de.',
          vi: '“会” nghĩa là biết làm một việc gì đó, ví dụ “我会游泳” — “Tôi biết bơi”. “要” nghĩa là muốn, ví dụ “我要一杯咖啡” — “Tôi muốn một cốc cà phê”. Lúc đó tôi thấy khá đơn giản.'
        },
        {
          start: 63,
          end: 69,
          en: 'But later… I found that “会” can also describe things that will happen in the future.',
          zh: '可是后来……我发现“会”也可以用来说将来会发生的事情。',
          pinyin: 'Kěshì hòulái… Wǒ fāxiàn “huì” yě kěyǐ yòng lái shuō jiānglái huì fāshēng de shìqing.',
          vi: 'Nhưng sau đó… tôi phát hiện “会” còn có thể dùng để nói về những việc sẽ xảy ra trong tương lai.'
        },
        {
          start: 69,
          end: 79,
          en: 'And “要” can also mean “need to” or “must.” Then there’s “能,” which can mean being able to do something or something being possible!',
          zh: '而且，“要”还可以表示“需要”或者“必须”。还有“能”，可以表示“能够”或者“有可能”！',
          pinyin: 'Érqiě, “yào” hái kěyǐ biǎoshì “xūyào” huòzhě “bìxū”. Hái yǒu “néng”, kěyǐ biǎoshì “nénggòu” huòzhě “yǒu kěnéng”!',
          vi: 'Rồi “要” còn có thể mang nghĩa là “cần” hoặc “phải”. Lại còn có “能” nữa, có thể mang nghĩa là “làm được” hoặc “có thể xảy ra”!'
        },
        {
          start: 79,
          end: 85,
          en: 'Oh my gosh, how many ways are there to say “can” in Chinese?! I’m really confused!',
          zh: '天哪，中文里到底有多少种说“can”的方法啊？！我真的搞糊涂了！',
          pinyin: 'Tiān na, Zhōngwén lǐ dàodǐ yǒu duōshao zhǒng shuō “can” de fāngfǎ a?! Wǒ zhēn de gǎo hútu le!',
          vi: 'Trời ơi, rốt cuộc tiếng Trung có bao nhiêu cách nói “có thể” vậy?! Tôi rối thật rồi!'
        },
        {
          start: 85,
          end: 96,
          en: 'XiaoMing, take it easy! I understand how you feel. This really is one of the biggest headaches for Chinese learners.',
          zh: '小明，冷静一点！我理解你的感受。其实，这确实是学中文的人最头疼的问题之一。',
          pinyin: 'Xiǎomíng, lěngjìng yìdiǎn! Wǒ lǐjiě nǐ de gǎnshòu. Qíshí, zhè quèshí shì xué Zhōngwén de rén zuì tóuténg de wèntí zhī yī.',
          vi: 'Tiểu Minh, bình tĩnh nào! Tôi hiểu cảm giác của cậu. Thật ra, đây đúng là một trong những vấn đề khiến người học tiếng Trung đau đầu nhất.'
        },
        {
          start: 96,
          end: 104,
          en: 'You’re not alone. Lots of people get confused at this point! Really? So it’s normal to mix them up like this?',
          zh: '不止你一个人，很多人学到这里都会搞混！真的吗？所以，这样搞混很正常吗？',
          pinyin: 'Bù zhǐ nǐ yí ge rén, hěn duō rén xué dào zhèli dōu huì gǎohùn! Zhēn de ma? Suǒyǐ, zhèyàng gǎohùn hěn zhèngcháng ma?',
          vi: 'Không chỉ mình cậu đâu, rất nhiều người học đến phần này cũng bị nhầm! Thật à? Vậy nhầm lẫn như thế là bình thường sao?'
        },
        {
          start: 104,
          end: 111,
          en: 'Absolutely normal! Today, we’ll clear up these three words once and for all.',
          zh: '当然正常！今天我们就把这三个词彻底讲清楚。',
          pinyin: 'Dāngrán zhèngcháng! Jīntiān wǒmen jiù bǎ zhè sān ge cí chèdǐ jiǎng qīngchu.',
          vi: 'Hoàn toàn bình thường! Hôm nay chúng ta sẽ làm rõ ba từ này một lần cho thật hiểu.'
        },
        {
          start: 111,
          end: 118,
          en: 'I promise, by the end of this video, you won’t mix up “会,” “要,” and “能” anymore!',
          zh: '我保证，看完这个视频，你就不会再把“会”“要”和“能”搞混了！',
          pinyin: 'Wǒ bǎozhèng, kàn wán zhè ge shìpín, nǐ jiù bú huì zài bǎ “huì” “yào” hé “néng” gǎohùn le!',
          vi: 'Tôi đảm bảo, xem xong video này, cậu sẽ không còn nhầm “会”, “要” và “能” nữa!'
        },
        {
          start: 118,
          end: 128,
          en: 'If these three words have confused you too, join XiaoMing and get them clear once and for all. Watch until the end!',
          zh: '如果你也被这三个词搞糊涂过，就跟小明一起把它们彻底弄清楚吧！一定要看到最后哦！',
          pinyin: 'Rúguǒ nǐ yě bèi zhè sān ge cí gǎo hútu guo, jiù gēn Xiǎomíng yìqǐ bǎ tāmen chèdǐ nòng qīngchu ba! Yídìng yào kàn dào zuìhòu o!',
          vi: 'Nếu bạn cũng từng bị ba từ này làm cho bối rối, hãy cùng Tiểu Minh tìm hiểu cho thật rõ nhé! Nhớ xem đến cuối đấy!'
        },
        {
          start: 128,
          end: 133,
          en: 'If you’re learning Chinese through natural conversations like this,',
          zh: '如果你也在通过这样自然的对话学中文，',
          pinyin: 'Rúguǒ nǐ yě zài tōngguò zhèyàng zìrán de duìhuà xué Zhōngwén,',
          vi: 'Nếu bạn cũng đang học tiếng Trung qua những cuộc trò chuyện tự nhiên như thế này,'
        },
        {
          start: 133,
          end: 140,
          en: 'Remember to subscribe to or follow BaoBao Mandarin so you don’t miss our future content!',
          zh: '记得订阅或关注 BaoBao Mandarin，别错过我们以后的内容哦！',
          pinyin: 'Jìde dìngyuè huò guānzhù BaoBao Mandarin, bié cuòguò wǒmen yǐhòu de nèiróng o!',
          vi: 'Nhớ đăng ký hoặc theo dõi BaoBao Mandarin để không bỏ lỡ những nội dung tiếp theo nhé!'
        },
        {
          start: 140,
          end: 149,
          en: 'All right, let’s get started! First, a quick quiz to see how much you already understand.',
          zh: '好，那我们开始吧！先来做个小测验，看看你现在了解多少。',
          pinyin: 'Hǎo, nà wǒmen kāishǐ ba! Xiān lái zuò ge xiǎo cèyàn, kànkan nǐ xiànzài liǎojiě duōshao.',
          vi: 'Được rồi, bắt đầu nhé! Trước tiên, làm một bài kiểm tra nhanh để xem hiện giờ cậu hiểu được bao nhiêu.'
        },
        {
          start: 149,
          end: 152,
          en: 'Uh… okay, I’ll give it a try.',
          zh: '呃……好吧，我试试。',
          pinyin: 'È… Hǎo ba, wǒ shìshi.',
          vi: 'Ờ… được thôi, tôi thử xem.'
        },
        {
          start: 152,
          end: 165,
          en: 'Look at these three sentences. Do they mean the same thing?',
          zh: '看看这三个句子，它们的意思一样吗？',
          pinyin: 'Kànkan zhè sān ge jùzi, tāmen de yìsi yíyàng ma?',
          vi: 'Hãy nhìn ba câu này. Chúng có nghĩa giống nhau không?'
        },
        {
          start: 165,
          end: 171,
          en: 'Hmm… they all seem to mean “I’ll go tomorrow”… but they’re not quite the same, right?',
          zh: '嗯……好像都是“我明天去”的意思……但又不太一样，对吧？',
          pinyin: 'Ǹg… Hǎoxiàng dōu shì “wǒ míngtiān qù” de yìsi… Dàn yòu bú tài yíyàng, duì ba?',
          vi: 'Ừm… hình như đều có nghĩa là “Ngày mai tôi sẽ đi”… nhưng lại không hoàn toàn giống nhau, đúng không?'
        },
        {
          start: 171,
          end: 177,
          en: 'Right, they’re different! All three sentences use the same verb, “去,” meaning “go.”',
          zh: '对，不一样！这三个句子用的都是同一个动词“去”。',
          pinyin: 'Duì, bù yíyàng! Zhè sān ge jùzi yòng de dōu shì tóng yí ge dòngcí “qù”.',
          vi: 'Đúng, không giống nhau! Cả ba câu đều dùng cùng một động từ “去”, nghĩa là “đi”.'
        },
        {
          start: 177,
          end: 183,
          en: 'But choosing “会,” “要,” or “能” changes the meaning of the whole sentence.',
          zh: '但是，用“会”“要”还是“能”，整个句子的意思就变了。',
          pinyin: 'Dànshì, yòng “huì” “yào” háishi “néng”, zhěng ge jùzi de yìsi jiù biàn le.',
          vi: 'Nhưng dùng “会”, “要” hay “能” thì ý nghĩa của cả câu sẽ thay đổi.'
        },
        {
          start: 183,
          end: 194,
          en: 'Here’s what they mean: “我明天会去” means “I think I’ll go tomorrow.”',
          zh: '其实，它们的意思是这样的：“我明天会去”，表示我觉得自己明天会去。',
          pinyin: 'Qíshí, tāmen de yìsi shì zhèyàng de: “Wǒ míngtiān huì qù”, biǎoshì wǒ juéde zìjǐ míngtiān huì qù.',
          vi: 'Thật ra, ý nghĩa là thế này: “我明天会去” nghĩa là tôi nghĩ ngày mai mình sẽ đi.'
        },
        {
          start: 194,
          end: 201,
          en: '“我明天要去” means “I plan to go tomorrow,” or “I have to go tomorrow.”',
          zh: '“我明天要去”，表示我计划明天去，或者我明天必须去。',
          pinyin: '“Wǒ míngtiān yào qù”, biǎoshì wǒ jìhuà míngtiān qù, huòzhě wǒ míngtiān bìxū qù.',
          vi: '“我明天要去” nghĩa là tôi dự định đi vào ngày mai, hoặc ngày mai tôi phải đi.'
        },
        {
          start: 201,
          end: 211,
          en: '“我明天能去” means “I can go tomorrow if circumstances allow.”',
          zh: '“我明天能去”，表示条件允许的话，我明天可以去。',
          pinyin: '“Wǒ míngtiān néng qù”, biǎoshì tiáojiàn yǔnxǔ de huà, wǒ míngtiān kěyǐ qù.',
          vi: '“我明天能去” nghĩa là nếu điều kiện cho phép thì ngày mai tôi có thể đi.'
        },
        {
          start: 211,
          end: 217,
          en: 'They really are different… But why? What exactly is the difference?',
          zh: '真的不一样啊……可是为什么呢？到底差在哪儿？',
          pinyin: 'Zhēn de bù yíyàng a… Kěshì wèishénme ne? Dàodǐ chà zài nǎr?',
          vi: 'Đúng là khác nhau thật… Nhưng tại sao vậy? Cụ thể khác nhau ở đâu?'
        },
        {
          start: 217,
          end: 226,
          en: 'That’s what today’s episode is all about! Let’s begin with “会” and “要,”',
          zh: '这就是我们今天这期节目的主题！开始吧，我们先聊聊“会”和“要”，',
          pinyin: 'Zhè jiù shì wǒmen jīntiān zhè qī jiémù de zhǔtí! Kāishǐ ba, wǒmen xiān liáoliao “huì” hé “yào”,',
          vi: 'Đó chính là chủ đề của tập hôm nay! Bắt đầu nhé. Trước tiên, chúng ta sẽ nói về “会” và “要”,'
        },
        {
          start: 226,
          end: 234,
          en: 'because both are often used to talk about the future, and this is where learners get confused most often.',
          zh: '因为它们都经常用来谈论将来的事情，这也是大家最容易搞混的地方。',
          pinyin: 'Yīnwèi tāmen dōu jīngcháng yòng lái tánlùn jiānglái de shìqing, zhè yě shì dàjiā zuì róngyì gǎohùn de dìfang.',
          vi: 'Vì cả hai đều thường được dùng để nói về tương lai, và đây cũng là phần người học dễ nhầm lẫn nhất.'
        },
        {
          start: 234,
          end: 245,
          en: 'So, XiaoMing, “你会游泳吗？” — “Can you swim?” “会啊！我会游泳！” — “Yes! I can swim!” Great! What does “会” mean in this sentence?',
          zh: '那，小明，你会游泳吗？会啊！我会游泳！很好！那这句话里的“会”是什么意思呢？',
          pinyin: 'Nà, Xiǎomíng, nǐ huì yóuyǒng ma? Huì a! Wǒ huì yóuyǒng! Hěn hǎo! Nà zhè jù huà lǐ de “huì” shì shénme yìsi ne?',
          vi: 'Vậy Tiểu Minh, “你会游泳吗？” — “Cậu biết bơi không?” “会啊！我会游泳！” — “Biết chứ! Tôi biết bơi!” Tốt lắm! Vậy “会” trong câu này có nghĩa là gì?'
        },
        {
          start: 245,
          end: 250,
          en: '“会” means knowing how to do something—a skill you’ve learned.',
          zh: '“会”表示知道怎么做一件事，也就是学会了一种技能。',
          pinyin: '“Huì” biǎoshì zhīdào zěnme zuò yí jiàn shì, yě jiù shì xuéhuì le yì zhǒng jìnéng.',
          vi: '“会” nghĩa là biết cách làm một việc gì đó, tức là đã học được một kỹ năng.'
        },
        {
          start: 250,
          end: 265,
          en: 'Exactly! That’s the most basic, core meaning of “会”: knowing how to do something, meaning you’ve acquired a skill through learning.',
          zh: '对！这就是“会”最基本、最核心的意思：会做某件事，也就是说，通过学习掌握了一种技能。',
          pinyin: 'Duì! Zhè jiù shì “huì” zuì jīběn, zuì héxīn de yìsi: huì zuò mǒu jiàn shì, yě jiù shì shuō, tōngguò xuéxí zhǎngwò le yì zhǒng jìnéng.',
          vi: 'Đúng rồi! Đây là nghĩa cơ bản và cốt lõi nhất của “会”: biết làm một việc gì đó, tức là đã có được một kỹ năng nhờ học tập.'
        },
        {
          start: 265,
          end: 271,
          en: 'These are all skills. You learned and practiced them, so now you know how to do them.',
          zh: '这些都是技能。你学过，也练习过，所以现在就会做了。',
          pinyin: 'Zhèxiē dōu shì jìnéng. Nǐ xué guo, yě liànxí guo, suǒyǐ xiànzài jiù huì zuò le.',
          vi: 'Tất cả những điều này đều là kỹ năng. Cậu đã học, đã luyện tập, nên giờ cậu biết làm rồi.'
        },
        {
          start: 271,
          end: 276,
          en: 'I know this one! It\'s the 会 we learned when we first started studying Chinese.',
          zh: '这个我知道！就是我们刚开始学中文时学的那个“会”。',
          pinyin: 'Zhège wǒ zhīdào! Jiù shì wǒmen gāng kāishǐ xué Zhōngwén shí xué de nàge “huì”.',
          vi: 'Cái này mình biết! Chính là chữ “会” mà chúng ta đã học từ lúc mới bắt đầu học tiếng Trung.'
        },
        {
          start: 276,
          end: 283,
          en: 'Exactly! But 会 has another meaning, and this is where many people start getting confused.',
          zh: '没错！不过，“会”还有另一个意思，很多人就是从这里开始搞混的。',
          pinyin: 'Méi cuò! Búguò, “huì” hái yǒu lìng yí ge yìsi, hěn duō rén jiù shì cóng zhèlǐ kāishǐ gǎohùn de.',
          vi: 'Đúng rồi! Nhưng “会” còn có một nghĩa khác, và nhiều người bắt đầu nhầm lẫn từ đây.'
        },
        {
          start: 283,
          end: 290,
          en: 'Let me ask you something. XiaoMing, have you checked the weather forecast? What\'s the weather like tomorrow?',
          zh: '我来问你一个问题。小明，你看天气预报了吗？明天天气怎么样？',
          pinyin: 'Wǒ lái wèn nǐ yí ge wèntí. Xiǎomíng, nǐ kàn tiānqì yùbào le ma? Míngtiān tiānqì zěnmeyàng?',
          vi: 'Mình hỏi bạn một câu nhé. Tiểu Minh, bạn xem dự báo thời tiết chưa? Ngày mai thời tiết thế nào?'
        },
        {
          start: 290,
          end: 297,
          en: 'It will rain tomorrow. Exactly! You just used 会.',
          zh: '明天会下雨。没错！你刚才就用了“会”。',
          pinyin: 'Míngtiān huì xià yǔ. Méi cuò! Nǐ gāngcái jiù yòng le “huì”.',
          vi: 'Ngày mai trời sẽ mưa. Đúng rồi! Bạn vừa dùng “会” đấy.'
        },
        {
          start: 297,
          end: 302,
          en: 'But notice that 会 here doesn\'t mean having learned a skill.',
          zh: '不过要注意，这里的“会”不是表示学会了某种技能。',
          pinyin: 'Búguò yào zhùyì, zhèlǐ de “huì” bú shì biǎoshì xuéhuì le mǒu zhǒng jìnéng.',
          vi: 'Nhưng chú ý nhé, “会” ở đây không diễn tả việc đã học được một kỹ năng nào đó.'
        },
        {
          start: 302,
          end: 308,
          en: 'Does the weather have the skill of making it rain? That sounds strange, doesn\'t it?',
          zh: '难道天气还有“会下雨”这个技能吗？是不是很奇怪？',
          pinyin: 'Nándào tiānqì hái yǒu “huì xià yǔ” zhège jìnéng ma? Shì bu shì hěn qíguài?',
          vi: 'Chẳng lẽ thời tiết cũng có kỹ năng “biết làm mưa” sao? Nghe lạ lắm đúng không?'
        },
        {
          start: 308,
          end: 314,
          en: 'Haha, “the weather has the skill of making it rain”... That does sound strange.',
          zh: '哈哈，“天气有会下雨的技能”……是挺奇怪的。',
          pinyin: 'Hāhā, “tiānqì yǒu huì xià yǔ de jìnéng”... Shì tǐng qíguài de.',
          vi: 'Ha ha, “thời tiết có kỹ năng làm mưa”… Đúng là nghe lạ thật.'
        },
        {
          start: 314,
          end: 319,
          en: 'In this sentence, 会 expresses a prediction.',
          zh: '在这个句子里，“会”表示的是预测。',
          pinyin: 'Zài zhège jùzi lǐ, “huì” biǎoshì de shì yùcè.',
          vi: 'Trong câu này, “会” diễn tả sự dự đoán.'
        },
        {
          start: 319,
          end: 325,
          en: 'Maybe you checked the weather forecast or saw dark clouds.',
          zh: '你可能看了天气预报，或者看到了乌云。',
          pinyin: 'Nǐ kěnéng kàn le tiānqì yùbào, huòzhě kàn dào le wūyún.',
          vi: 'Có thể bạn đã xem dự báo thời tiết, hoặc nhìn thấy mây đen.'
        },
        {
          start: 325,
          end: 332,
          en: 'You believe it will rain tomorrow. You\'re making a prediction.',
          zh: '你相信明天会下雨，你是在做一个预测。',
          pinyin: 'Nǐ xiāngxìn míngtiān huì xià yǔ, nǐ shì zài zuò yí ge yùcè.',
          vi: 'Bạn tin rằng ngày mai trời sẽ mưa. Bạn đang đưa ra một dự đoán.'
        },
        {
          start: 332,
          end: 342,
          en: 'Listen to a few more sentences: “He\'ll come.” He hasn\'t arrived yet, but I believe he\'ll come.',
          zh: '再来听几个句子：“他会来的。”就是说，他现在还没到，但是我相信他会来。',
          pinyin: 'Zài lái tīng jǐ ge jùzi: “Tā huì lái de.” Jiù shì shuō, tā xiànzài hái méi dào, dànshì wǒ xiāngxìn tā huì lái.',
          vi: 'Nghe thêm vài câu nhé: “Anh ấy sẽ đến.” Nghĩa là hiện giờ anh ấy chưa tới, nhưng mình tin anh ấy sẽ đến.'
        },
        {
          start: 342,
          end: 349,
          en: '“He won\'t forget.” I\'ve already told him, and I believe he won\'t forget.',
          zh: '“他不会忘记的。”我已经告诉他了，我相信他不会忘记。',
          pinyin: '“Tā bú huì wàngjì de.” Wǒ yǐjīng gàosu tā le, wǒ xiāngxìn tā bú huì wàngjì.',
          vi: '“Anh ấy sẽ không quên đâu.” Mình đã nói với anh ấy rồi, và mình tin anh ấy sẽ không quên.'
        },
        {
          start: 349,
          end: 357,
          en: '“You\'ll understand later.” You don\'t understand now, but you will later.',
          zh: '“以后你会明白的。”你现在还不明白，但是以后会明白。',
          pinyin: '“Yǐhòu nǐ huì míngbai de.” Nǐ xiànzài hái bù míngbai, dànshì yǐhòu huì míngbai.',
          vi: '“Sau này bạn sẽ hiểu.” Bây giờ bạn chưa hiểu, nhưng sau này bạn sẽ hiểu.'
        },
        {
          start: 357,
          end: 366,
          en: 'These sentences aren\'t about skills. The speaker believes or predicts that something will happen.',
          zh: '这些句子说的都不是技能，而是说话的人相信或者预测某件事会发生。',
          pinyin: 'Zhèxiē jùzi shuō de dōu bú shì jìnéng, ér shì shuōhuà de rén xiāngxìn huòzhě yùcè mǒu jiàn shì huì fāshēng.',
          vi: 'Những câu này đều không nói về kỹ năng, mà diễn tả việc người nói tin hoặc dự đoán rằng một việc sẽ xảy ra.'
        },
        {
          start: 366,
          end: 373,
          en: 'Oh! So in all these sentences, the speaker predicts or believes that something will happen!',
          zh: '哦！所以这些句子都是说话的人在预测，或者相信某件事会发生！',
          pinyin: 'Ò! Suǒyǐ zhèxiē jùzi dōu shì shuōhuà de rén zài yùcè, huòzhě xiāngxìn mǒu jiàn shì huì fāshēng!',
          vi: 'À! Vậy trong tất cả những câu này, người nói đều đang dự đoán hoặc tin rằng một việc sẽ xảy ra!'
        },
        {
          start: 373,
          end: 384,
          en: 'Exactly! Now let\'s move on to 要. If you\'ve already decided to go to Beijing tomorrow, how would you say it?',
          zh: '完全正确！接下来我们说“要”。如果你已经决定明天去北京，你会怎么说？',
          pinyin: 'Wánquán zhèngquè! Jiē xiàlái wǒmen shuō “yào”. Rúguǒ nǐ yǐjīng juédìng míngtiān qù Běijīng, nǐ huì zěnme shuō?',
          vi: 'Chính xác! Tiếp theo, chúng ta nói về “要”. Nếu bạn đã quyết định ngày mai đi Bắc Kinh, bạn sẽ nói thế nào?'
        },
        {
          start: 384,
          end: 393,
          en: 'I\'m going to Beijing! Right! 要 here expresses an existing plan or intention rather than a prediction.',
          zh: '我要去北京！对！这里的“要”不是预测，而是表示你已经有了计划或者打算。',
          pinyin: 'Wǒ yào qù Běijīng! Duì! Zhèlǐ de “yào” bú shì yùcè, ér shì biǎoshì nǐ yǐjīng yǒu le jìhuà huòzhě dǎsuàn.',
          vi: 'Mình sẽ đi Bắc Kinh! Đúng rồi! “要” ở đây không diễn tả dự đoán, mà cho biết bạn đã có kế hoạch hoặc ý định.'
        },
        {
          start: 393,
          end: 406,
          en: 'It\'s something you\'ve already decided. Compare these two sentences: “他明天会来。” This means, “I think he\'ll come tomorrow.”',
          zh: '这是你已经决定好的事。来比较一下这两个句子：“他明天会来。”意思是，我觉得他明天会来。',
          pinyin: 'Zhè shì nǐ yǐjīng juédìng hǎo de shì. Lái bǐjiào yíxià zhè liǎng ge jùzi: “Tā míngtiān huì lái.” Yìsi shì, wǒ juéde tā míngtiān huì lái.',
          vi: 'Đó là việc bạn đã quyết định rồi. Hãy so sánh hai câu này: “他明天会来。” Nghĩa là: “Mình nghĩ ngày mai anh ấy sẽ đến.”'
        },
        {
          start: 406,
          end: 411,
          en: '“他明天要来。” This means he plans to come tomorrow.',
          zh: '“他明天要来。”意思是，这是他的计划。',
          pinyin: '“Tā míngtiān yào lái.” Yìsi shì, zhè shì tā de jìhuà.',
          vi: '“他明天要来。” Nghĩa là anh ấy đã có kế hoạch đến vào ngày mai.'
        },
        {
          start: 411,
          end: 417,
          en: 'Oh! When I use 会, I\'m making a prediction—saying that I think something will happen.',
          zh: '哦！用“会”的时候，我是在预测，就是说我觉得这件事会发生。',
          pinyin: 'Ò! Yòng “huì” de shíhou, wǒ shì zài yùcè, jiù shì shuō wǒ juéde zhè jiàn shì huì fāshēng.',
          vi: 'À! Khi dùng “会”, mình đang dự đoán, tức là nói rằng mình nghĩ việc đó sẽ xảy ra.'
        },
        {
          start: 417,
          end: 422,
          en: 'With 要, there\'s already a concrete plan, so it\'s more definite!',
          zh: '用“要”的话，就说明已经有了具体的计划，所以更确定！',
          pinyin: 'Yòng “yào” de huà, jiù shuōmíng yǐjīng yǒu le jùtǐ de jìhuà, suǒyǐ gèng quèdìng!',
          vi: 'Còn dùng “要” thì có nghĩa là đã có kế hoạch cụ thể, nên chắc chắn hơn!'
        },
        {
          start: 422,
          end: 433,
          en: 'Right! So remember: 会 expresses a prediction. The speaker predicts or believes that something will happen.',
          zh: '对！所以记住：“会”表示预测，说话的人预测或者相信某件事会发生。',
          pinyin: 'Duì! Suǒyǐ jìzhù: “Huì” biǎoshì yùcè, shuōhuà de rén yùcè huòzhě xiāngxìn mǒu jiàn shì huì fāshēng.',
          vi: 'Đúng rồi! Vì vậy hãy nhớ: “会” diễn tả dự đoán. Người nói dự đoán hoặc tin rằng một việc sẽ xảy ra.'
        },
        {
          start: 433,
          end: 441,
          en: '要 expresses an intention or plan. The speaker intends to do something or already has a plan.',
          zh: '“要”表示打算或者计划，就是说，说话的人打算做某件事，或者已经有了计划。',
          pinyin: '“Yào” biǎoshì dǎsuàn huòzhě jìhuà, jiù shì shuō, shuōhuà de rén dǎsuàn zuò mǒu jiàn shì, huòzhě yǐjīng yǒu le jìhuà.',
          vi: '“要” diễn tả ý định hoặc kế hoạch. Người nói có ý định làm một việc, hoặc đã có kế hoạch.'
        },
        {
          start: 441,
          end: 449,
          en: 'Okay! I have a question. XiaoMing, and all you BaoBei watching, try answering too!',
          zh: '好！我有个问题。小明，还有正在看的宝贝们，大家都来回答一下吧！',
          pinyin: 'Hǎo! Wǒ yǒu ge wèntí. Xiǎomíng, hái yǒu zhèngzài kàn de bǎobèimen, dàjiā dōu lái huídá yíxià ba!',
          vi: 'Được rồi! Mình có một câu hỏi. Tiểu Minh và các bảo bối đang xem, mọi người cùng thử trả lời nhé!'
        },
        {
          start: 449,
          end: 455,
          en: 'You think you\'ll probably go to the party tonight, but you\'re not one hundred percent sure.',
          zh: '你觉得自己今晚可能会去参加派对，但是还不能百分之百确定。',
          pinyin: 'Nǐ juéde zìjǐ jīnwǎn kěnéng huì qù cānjiā pàiduì, dànshì hái bù néng bǎi fēn zhī bǎi quèdìng.',
          vi: 'Bạn nghĩ tối nay mình có thể sẽ đi dự tiệc, nhưng vẫn chưa chắc chắn một trăm phần trăm.'
        },
        {
          start: 455,
          end: 461,
          en: 'You just think you might go. How would you say it?',
          zh: '你只是觉得自己可能会去。你会怎么说呢？',
          pinyin: 'Nǐ zhǐ shì juéde zìjǐ kěnéng huì qù. Nǐ huì zěnme shuō ne?',
          vi: 'Bạn chỉ nghĩ là mình có thể sẽ đi thôi. Bạn sẽ nói thế nào?'
        },
        {
          start: 461,
          end: 466,
          en: 'Um... I\'m still not sure. I just feel like I might go...',
          zh: '呃……我还不确定，只是觉得自己可能会去……',
          pinyin: 'È... Wǒ hái bú quèdìng, zhǐ shì juéde zìjǐ kěnéng huì qù...',
          vi: 'Ừm… Mình vẫn chưa chắc, chỉ cảm thấy là có thể mình sẽ đi…'
        },
        {
          start: 466,
          end: 480,
          en: 'That\'s a prediction... So: “I\'ll go to the party tonight!” Right, use 会 because you\'re making a prediction. You think you\'ll go, but you haven\'t decided yet.',
          zh: '这是预测……那就说：“我今晚会去派对！”对，要用“会”，因为你是在预测。你觉得自己会去，但还没有决定。',
          pinyin: 'Zhè shì yùcè... Nà jiù shuō: “Wǒ jīnwǎn huì qù pàiduì!” Duì, yào yòng “huì”, yīnwèi nǐ shì zài yùcè. Nǐ juéde zìjǐ huì qù, dàn hái méiyǒu juédìng.',
          vi: 'Đây là dự đoán… Vậy thì nói: “Tối nay mình sẽ đi dự tiệc!” Đúng rồi, dùng “会” vì bạn đang dự đoán. Bạn nghĩ mình sẽ đi, nhưng vẫn chưa quyết định.'
        },
        {
          start: 480,
          end: 487,
          en: 'You use 要 when you\'ve already bought the tickets and made plans with your friends.',
          zh: '买好了票，也跟朋友约好了，这种时候才用“要”。',
          pinyin: 'Mǎi hǎo le piào, yě gēn péngyou yuē hǎo le, zhè zhǒng shíhou cái yòng “yào”.',
          vi: 'Đã mua vé, cũng đã hẹn với bạn bè rồi thì mới dùng “要”.'
        },
        {
          start: 487,
          end: 497,
          en: 'Did you get it right? Tell us in the comments! Wait, XiaoYue! There\'s still something I don\'t understand!',
          zh: '你答对了吗？在评论区告诉我们吧！等一下，小月！我还有一个地方没弄明白！',
          pinyin: 'Nǐ dá duì le ma? Zài pínglùnqū gàosu wǒmen ba! Děng yíxià, Xiǎoyuè! Wǒ hái yǒu yí ge dìfang méi nòng míngbai!',
          vi: 'Bạn trả lời đúng chưa? Hãy cho chúng mình biết trong phần bình luận nhé! Khoan đã, Tiểu Nguyệt! Tớ vẫn còn một chỗ chưa hiểu!'
        },
        {
          start: 497,
          end: 500,
          en: 'Wasn\'t the first meaning we learned for 要 “want”?',
          zh: '我们最早学的“要”，不是“想要”的意思吗？',
          pinyin: 'Wǒmen zuì zǎo xué de “yào”, bú shì “xiǎng yào” de yìsi ma?',
          vi: 'Nghĩa đầu tiên của “要” mà chúng ta học chẳng phải là “muốn” sao?'
        },
        {
          start: 500,
          end: 508,
          en: 'For example, “I want coffee” or “I\'d like a cup of coffee.” But you just said 要 can also express an intention or a plan…',
          zh: '比如，“我要咖啡”或者“我想要一杯咖啡”。可是你刚才说，“要”也可以表示“打算”或者“计划”……',
          pinyin: 'Bǐrú, “wǒ yào kāfēi” huòzhě “wǒ xiǎng yào yì bēi kāfēi”. Kěshì nǐ gāngcái shuō, “yào” yě kěyǐ biǎoshì “dǎsuàn” huòzhě “jìhuà”……',
          vi: 'Ví dụ: “Tôi muốn cà phê” hoặc “Tôi muốn một cốc cà phê”. Nhưng lúc nãy cậu nói “要” cũng có thể diễn tả dự định hoặc kế hoạch…'
        },
        {
          start: 508,
          end: 516,
          en: 'So what does 要 actually mean?! Good question! It actually has more than one meaning.',
          zh: '那“要”到底是什么意思啊？！问得好！其实，“要”不只有一个意思。',
          pinyin: 'Nà “yào” dàodǐ shì shénme yìsi a?! Wèn de hǎo! Qíshí, “yào” bù zhǐ yǒu yí ge yìsi.',
          vi: 'Vậy rốt cuộc “要” có nghĩa là gì?! Câu hỏi hay đấy! Thật ra, “要” có nhiều hơn một nghĩa.'
        },
        {
          start: 516,
          end: 522,
          en: 'It can express different meanings depending on the context. Let\'s look at them one by one.',
          zh: '根据语境，它可以表达不同的意思。我们一个一个来看。',
          pinyin: 'Gēnjù yǔjìng, tā kěyǐ biǎodá bùtóng de yìsi. Wǒmen yí ge yí ge lái kàn.',
          vi: 'Tùy ngữ cảnh, nó có thể diễn đạt những nghĩa khác nhau. Chúng ta cùng xem từng nghĩa nhé.'
        },
        {
          start: 522,
          end: 531,
          en: 'The first meaning is “want.” “I want a cup of coffee.” “I want this.” Here, it simply expresses wanting something.',
          zh: '第一个意思是“想要”。“我要一杯咖啡。”“我要这个。”这里就是简单地表示“想要”。',
          pinyin: 'Dì yī ge yìsi shì “xiǎng yào”. “Wǒ yào yì bēi kāfēi.” “Wǒ yào zhège.” Zhèlǐ jiù shì jiǎndān de biǎoshì “xiǎng yào”.',
          vi: 'Nghĩa thứ nhất là “muốn”. “Tôi muốn một cốc cà phê.” “Tôi muốn cái này.” Ở đây, nó đơn giản chỉ diễn tả mong muốn.'
        },
        {
          start: 531,
          end: 536,
          en: 'It means you want to have something, and it\'s usually followed by a noun.',
          zh: '表示你想得到某个东西，后面一般跟名词。',
          pinyin: 'Biǎoshì nǐ xiǎng dédào mǒu ge dōngxi, hòumiàn yìbān gēn míngcí.',
          vi: 'Nó diễn tả việc bạn muốn có thứ gì đó, và phía sau thường là một danh từ.'
        },
        {
          start: 536,
          end: 545,
          en: 'The second meaning is an intention or a plan. “I\'m going to Beijing tomorrow” means “I plan to go to Beijing tomorrow.”',
          zh: '第二个意思是“打算”或者“计划”。“我明天要去北京。”也就是“我打算明天去北京。”',
          pinyin: 'Dì èr ge yìsi shì “dǎsuàn” huòzhě “jìhuà”. “Wǒ míngtiān yào qù Běijīng.” Yě jiù shì “wǒ dǎsuàn míngtiān qù Běijīng.”',
          vi: 'Nghĩa thứ hai là dự định hoặc kế hoạch. “Ngày mai tôi sẽ đi Bắc Kinh”, tức là “Tôi dự định ngày mai đi Bắc Kinh”.'
        },
        {
          start: 545,
          end: 551,
          en: 'You have a plan or an intention, and you\'ve already decided to do it.',
          zh: '就是说，你有一个计划或者打算，已经决定要去做了。',
          pinyin: 'Jiù shì shuō, nǐ yǒu yí ge jìhuà huòzhě dǎsuàn, yǐjīng juédìng yào qù zuò le.',
          vi: 'Tức là bạn có kế hoạch hoặc dự định, và đã quyết định sẽ làm việc đó rồi.'
        },
        {
          start: 551,
          end: 560,
          en: 'The third meaning is “need to” or “must.” Hey, XiaoMing, have you been staying up until around 2 a.m. every night lately?',
          zh: '第三个意思是“需要”或者“必须”。哎，小明，你最近是不是每天都到凌晨两点左右才睡觉啊？',
          pinyin: 'Dì sān ge yìsi shì “xūyào” huòzhě “bìxū”. Āi, Xiǎomíng, nǐ zuìjìn shì bu shì měitiān dōu dào língchén liǎng diǎn zuǒyòu cái shuìjiào a?',
          vi: 'Nghĩa thứ ba là “cần” hoặc “phải”. Này, Tiểu Minh, dạo này có phải ngày nào cậu cũng đến khoảng hai giờ sáng mới đi ngủ không?'
        },
        {
          start: 560,
          end: 569,
          en: 'Um… just a little late… Then you need to go to bed earlier. Huh? Do you mean “I want to go to bed earlier”?',
          zh: '嗯……就一点点啦……那你要早点睡。啊？你是说“我想早点睡”吗？',
          pinyin: 'Ǹg……jiù yìdiǎndiǎn la……Nà nǐ yào zǎodiǎn shuì. Á? Nǐ shì shuō “wǒ xiǎng zǎodiǎn shuì” ma?',
          vi: 'Ừm… chỉ hơi muộn một chút thôi mà… Vậy thì cậu cần ngủ sớm hơn. Hả? Ý cậu là “Tớ muốn ngủ sớm hơn” à?'
        },
        {
          start: 569,
          end: 578,
          en: 'It doesn\'t mean “want”! Here, it means you need to go to bed earlier. It\'s a necessity, not my personal wish.',
          zh: '不是“想要”！这里的意思是，你需要早点睡。这是一种需要，不是我的愿望。',
          pinyin: 'Bú shì “xiǎng yào”! Zhèlǐ de yìsi shì, nǐ xūyào zǎodiǎn shuì. Zhè shì yì zhǒng xūyào, bú shì wǒ de yuànwàng.',
          vi: 'Không phải là “muốn”! Ở đây có nghĩa là cậu cần ngủ sớm hơn. Đây là một nhu cầu, chứ không phải mong muốn của tớ.'
        },
        {
          start: 578,
          end: 585,
          en: 'Oh! So 要 here is closer to “need to” or “should,” rather than “want”!',
          zh: '哦！所以这里的“要”更接近“需要”或者“应该”，不是“想要”！',
          pinyin: 'Ò! Suǒyǐ zhèlǐ de “yào” gèng jiējìn “xūyào” huòzhě “yīnggāi”, bú shì “xiǎng yào”!',
          vi: 'À! Vậy “要” ở đây gần với nghĩa “cần” hoặc “nên” hơn, chứ không phải “muốn”!'
        },
        {
          start: 585,
          end: 595,
          en: 'Right! Let’s look at a few more sentences: Learning Chinese requires lots of practice.',
          zh: '对！再看看几个句子：学中文要多练习。——学中文需要多练习。',
          pinyin: 'Duì! Zài kànkan jǐ ge jùzi: xué Zhōngwén yào duō liànxí. —— Xué Zhōngwén xūyào duō liànxí.',
          vi: 'Đúng rồi! Hãy xem thêm vài câu: Học tiếng Trung thì cần luyện tập nhiều.'
        },
        {
          start: 595,
          end: 602,
          en: 'I have to go to work tomorrow.',
          zh: '明天我要上班。——明天我得去上班。',
          pinyin: 'Míngtiān wǒ yào shàngbān. —— Míngtiān wǒ děi qù shàngbān.',
          vi: 'Ngày mai tôi phải đi làm.'
        },
        {
          start: 602,
          end: 608,
          en: 'You need to bring your keys when you go out.',
          zh: '出门要带钥匙。——出门的时候需要带钥匙。',
          pinyin: 'Chūmén yào dài yàoshi. —— Chūmén de shíhou xūyào dài yàoshi.',
          vi: 'Ra ngoài thì cần mang theo chìa khóa.'
        },
        {
          start: 608,
          end: 617,
          en: 'In these sentences, no one is saying they want to do those things. They are talking about things that need to or must be done.',
          zh: '这些句子里，没有人在说自己“想做”那些事情。说的是需要做或者必须做的事情。',
          pinyin: 'Zhèxiē jùzi lǐ, méiyǒu rén shì zài shuō zìjǐ “xiǎng zuò” nàxiē shìqing. Shuō de shì xūyào zuò huòzhě bìxū zuò de shìqing.',
          vi: 'Trong những câu này, không ai nói rằng mình “muốn làm” những việc đó. Ý ở đây là những việc cần làm hoặc bắt buộc phải làm.'
        },
        {
          start: 617,
          end: 626,
          en: 'Oh! So you can’t just remember 要 as “want” and use it that way in every sentence, right? You have to consider the whole sentence and the context!',
          zh: '哦！也就是说，不能只把“要”记成“想要”，然后每个句子都这样用，对吧？要看整句话和语境！',
          pinyin: 'Ó! Yě jiùshì shuō, bù néng zhǐ bǎ “yào” jì chéng “xiǎngyào”, ránhòu měi ge jùzi dōu zhèyàng yòng, duì ba? Yào kàn zhěng jù huà hé yǔjìng!',
          vi: 'Ồ! Vậy tức là không thể chỉ nhớ 要 là “muốn” rồi dùng như vậy trong mọi câu, đúng không? Phải xem cả câu và ngữ cảnh!'
        },
        {
          start: 626,
          end: 631,
          en: 'Exactly! That’s how you should think when learning Chinese.',
          zh: '没错！学中文的时候，就要这样想。',
          pinyin: 'Méi cuò! Xué Zhōngwén de shíhou, jiù yào zhèyàng xiǎng.',
          vi: 'Đúng vậy! Khi học tiếng Trung, bạn cần suy nghĩ như thế.'
        },
        {
          start: 631,
          end: 637,
          en: 'Ask yourself: Is the speaker expressing a desire, an intention, or a need?',
          zh: '问问自己：说话的人是在表达愿望、意图，还是需求？',
          pinyin: 'Wènwen zìjǐ: shuōhuà de rén shì zài biǎodá yuànwàng, yìtú, háishi xūqiú?',
          vi: 'Hãy tự hỏi: người nói đang diễn đạt mong muốn, ý định hay nhu cầu?'
        },
        {
          start: 637,
          end: 647,
          en: 'The meaning of 要 changes depending on the context. Oh, if 要 sometimes means “need,” then…',
          zh: '“要”的意思会根据语境变化。哦，“要”有时候是“需要”的意思，那……',
          pinyin: '“Yào” de yìsi huì gēnjù yǔjìng biànhuà. Ó, “yào” yǒu shíhou shì “xūyào” de yìsi, nà……',
          vi: 'Nghĩa của 要 thay đổi tùy theo ngữ cảnh. À, nếu đôi khi 要 có nghĩa là “cần”, vậy thì…'
        },
        {
          start: 647,
          end: 655,
          en: 'Does “不用做” mean 不要做? No! This is a very common mistake.',
          zh: '“不用做”是“不要做”吗？不对！这是一个非常常见的错误。',
          pinyin: '“Búyòng zuò” shì “búyào zuò” ma? Bú duì! Zhè shì yí ge fēicháng chángjiàn de cuòwù.',
          vi: '“Không cần làm” có phải là 不要做 không? Không đúng! Đây là một lỗi rất thường gặp.'
        },
        {
          start: 655,
          end: 660,
          en: '不要 and 不用 look similar, but their meanings are very different.',
          zh: '不要和不用看起来很像，但是意思差很多。',
          pinyin: 'Búyào hé búyòng kàn qǐlái hěn xiàng, dànshì yìsi chà hěn duō.',
          vi: '不要 và 不用 trông có vẻ giống nhau, nhưng nghĩa rất khác.'
        },
        {
          start: 660,
          end: 667,
          en: 'Don’t come tomorrow.',
          zh: '你明天不要来。→“明天别来。”',
          pinyin: 'Nǐ míngtiān búyào lái. → “Míngtiān bié lái.”',
          vi: 'Ngày mai bạn đừng đến.'
        },
        {
          start: 667,
          end: 679,
          en: 'You don’t need to come tomorrow. Oh! One means “don’t come,” while the other means “you don’t need to come.”',
          zh: '你明天不用来。→“明天可以不来／明天没必要来。”哦！一个是“不要来”，另一个是“不用来”。',
          pinyin: 'Nǐ míngtiān búyòng lái. → “Míngtiān kěyǐ bù lái / míngtiān méi bìyào lái.” Ó! Yí ge shì “búyào lái”, lìng yí ge shì “búyòng lái”.',
          vi: 'Ngày mai bạn không cần đến. À! Một câu có nghĩa là “đừng đến”, còn câu kia có nghĩa là “không cần đến”.'
        },
        {
          start: 679,
          end: 687,
          en: 'They’re completely different! Exactly! If you mean 不用来 but mistakenly say 不要来,',
          zh: 'Hoàn toàn khác nhau! Đúng vậy! Nếu bạn muốn nói“不用来”mà lại nói nhầm thành“不来”,',
          pinyin: 'Wánquán bù yíyàng! Duì! Rúguǒ nǐ xiǎng shuō “búyòng lái”, què wù shuō chéng “búyào lái”,',
          vi: 'Hoàn toàn khác nhau! Đúng vậy! Nếu bạn muốn nói “不用来” nhưng lại nói nhầm thành “不要来”,'
        },
        {
          start: 687,
          end: 692,
          en: 'The listener may think you’re telling them not to come. It’s easy to cause a misunderstanding.',
          zh: '听的人可能会以为你是在阻止他来，很容易产生误解。',
          pinyin: 'Tīng de rén kěnéng huì yǐwéi nǐ shì zài zǔzhǐ tā lái, hěn róngyì chǎnshēng wùjiě.',
          vi: 'Người nghe có thể nghĩ rằng bạn đang ngăn họ đến. Rất dễ gây hiểu lầm.'
        },
        {
          start: 692,
          end: 706,
          en: 'So remember: “不要 + verb” means “don\'t do it”; “不用 + verb” means “don\'t need to do it.” Don\'t mix them up!',
          zh: '所以记住：“不要 + V”就是“别做”，“不用 + V”就是“不需要做”。这两个别弄混了！',
          pinyin: 'Suǒyǐ jìzhù: “bú yào + V” jiùshì “bié zuò”, “bú yòng + V” jiùshì “bù xūyào zuò”. Zhè liǎng ge bié nònghùn le!',
          vi: 'Vì vậy, hãy nhớ: “不要 + động từ” nghĩa là “đừng làm”; “不用 + động từ” nghĩa là “không cần làm”. Đừng nhầm hai cách này nhé!'
        },
        {
          start: 706,
          end: 713,
          en: 'Huh? Why has the sky gotten so dark? Will it rain tomorrow?',
          zh: '咦？天怎么变得这么黑了？明天会下雨？',
          pinyin: 'Yí? Tiān zěnme biàn de zhème hēi le? Míngtiān huì xià yǔ?',
          vi: 'Ủa? Sao trời lại tối sầm thế này? Ngày mai trời sẽ mưa à?'
        },
        {
          start: 713,
          end: 721,
          en: 'Not tomorrow! Look, the sky has gone dark and the clouds are hanging low. It\'s about to rain.',
          zh: '不是明天！你看，天都黑了，云也压得很低，马上就要下雨了。',
          pinyin: 'Bú shì míngtiān! Nǐ kàn, tiān dōu hēi le, yún yě yā de hěn dī, mǎshàng jiù yào xià yǔ le.',
          vi: 'Không phải ngày mai đâu! Nhìn kìa, trời tối sầm rồi, mây cũng sà xuống thấp, trời sắp mưa rồi.'
        },
        {
          start: 721,
          end: 729,
          en: 'Here, we don\'t say “It will rain tomorrow.” We say “It\'s about to rain!”',
          zh: '这时候不说“明天会下雨”，要说“要下雨了！”',
          pinyin: 'Zhè shíhou bù shuō “míngtiān huì xià yǔ”, yào shuō “yào xià yǔ le!”',
          vi: 'Lúc này không nói “Ngày mai trời sẽ mưa”, mà nói “Trời sắp mưa rồi!”'
        },
        {
          start: 729,
          end: 735,
          en: 'Oh! “It\'s about to rain!” means very soon, not tomorrow!',
          zh: '哦！“要下雨了！”说的是马上，不是明天！',
          pinyin: 'Ò! “Yào xià yǔ le!” shuō de shì mǎshàng, bú shì míngtiān!',
          vi: 'À! “Trời sắp mưa rồi!” là sắp xảy ra ngay bây giờ, chứ không phải ngày mai!'
        },
        {
          start: 735,
          end: 746,
          en: 'Right! Notice the difference: “It will rain tomorrow” is a prediction about tomorrow\'s weather.',
          zh: '对！注意这个区别：“明天会下雨”是对明天天气的预测。',
          pinyin: 'Duì! Zhùyì zhège qūbié: “míngtiān huì xià yǔ” shì duì míngtiān tiānqì de yùcè.',
          vi: 'Đúng rồi! Chú ý sự khác biệt này nhé: “Ngày mai trời sẽ mưa” là dự đoán về thời tiết ngày mai.'
        },
        {
          start: 746,
          end: 754,
          en: '“It\'s about to rain!” means rain is coming very soon, almost immediately.',
          zh: '“要下雨了！”就是说马上就要下雨了，几乎立刻就会发生。',
          pinyin: '“Yào xià yǔ le!” jiùshì shuō mǎshàng jiù yào xià yǔ le, jīhū lìkè jiù huì fāshēng.',
          vi: '“Trời sắp mưa rồi!” nghĩa là mưa sắp đến, gần như ngay lập tức.'
        },
        {
          start: 754,
          end: 761,
          en: 'Using “要…了” means something is about to happen very soon.',
          zh: '用“要…了”，就是在说一件事很快就要发生了。',
          pinyin: 'Yòng “yào…le”, jiùshì zài shuō yí jiàn shì hěn kuài jiù yào fāshēng le.',
          vi: 'Dùng “要…了” là nói rằng một việc sắp xảy ra trong thời gian rất gần.'
        },
        {
          start: 761,
          end: 770,
          en: 'The moment is very close; it\'s about to happen. Here are a few more examples: Hurry, the train is about to leave!',
          zh: '已经快到那个时候了，马上就要发生了。再举几个例子：快点儿，火车要开了！',
          pinyin: 'Yǐjīng kuài dào nàge shíhou le, mǎshàng jiù yào fāshēng le. Zài jǔ jǐ ge lìzi: Kuài diǎnr, huǒchē yào kāi le!',
          vi: 'Đã gần đến lúc rồi, sắp xảy ra ngay thôi. Thêm vài ví dụ nhé: Nhanh lên, tàu sắp chạy rồi!'
        },
        {
          start: 770,
          end: 779,
          en: 'The movie is about to start. Why aren\'t you here yet? It\'s already ten. I\'m going to be late!',
          zh: '电影要开始了，你怎么还没到？都十点了，我要迟到了！',
          pinyin: 'Diànyǐng yào kāishǐ le, nǐ zěnme hái méi dào? Dōu shí diǎn le, wǒ yào chídào le!',
          vi: 'Phim sắp bắt đầu rồi, sao bạn vẫn chưa đến? Đã mười giờ rồi, mình sắp muộn mất!'
        },
        {
          start: 779,
          end: 787,
          en: 'Oh! Here, “了” marks a change: something is about to happen!',
          zh: '哦！这里的“了”表示一种变化，就是有事情快要发生了！',
          pinyin: 'Ò! Zhèlǐ de “le” biǎoshì yì zhǒng biànhuà, jiùshì yǒu shìqing kuài yào fāshēng le!',
          vi: 'À! “了” ở đây biểu thị một sự thay đổi, tức là có chuyện sắp xảy ra!'
        },
        {
          start: 787,
          end: 797,
          en: 'Right! To recap: “会” expresses a prediction. The speaker thinks something may happen later.',
          zh: '对！总结一下：“会”表示预测，就是说话的人觉得以后可能会发生某件事。',
          pinyin: 'Duì! Zǒngjié yíxià: “huì” biǎoshì yùcè, jiùshì shuōhuà de rén juéde yǐhòu kěnéng huì fāshēng mǒu jiàn shì.',
          vi: 'Đúng rồi! Tóm lại nhé: “会” biểu thị sự dự đoán, tức là người nói nghĩ rằng một việc có thể xảy ra sau này.'
        },
        {
          start: 797,
          end: 806,
          en: '“要…了” means something is about to happen very soon.',
          zh: '“要…了”表示一件事很快就要发生了。',
          pinyin: '“Yào…le” biǎoshì yí jiàn shì hěn kuài jiù yào fāshēng le.',
          vi: '“要…了” biểu thị một việc sắp xảy ra trong thời gian rất gần.'
        },
        {
          start: 806,
          end: 817,
          en: 'These two uses are completely different! I understand the difference between “会” and “要” better now. It doesn\'t seem so hard anymore!',
          zh: '这两种用法完全不一样！现在我更清楚“会”和“要”的区别了，感觉也没那么难了！',
          pinyin: 'Zhè liǎng zhǒng yòngfǎ wánquán bù yíyàng! Xiànzài wǒ gèng qīngchu “huì” hé “yào” de qūbié le, gǎnjué yě méi nàme nán le!',
          vi: 'Hai cách dùng này khác hẳn nhau! Giờ mình hiểu rõ hơn sự khác nhau giữa “会” và “要” rồi, thấy cũng không khó lắm!'
        },
        {
          start: 817,
          end: 824,
          en: 'Great! Then let me ask: “Do you know how to swim?” “I know how to swim!”',
          zh: '好！那我问你：“你会游泳吗？”“我会游泳！”',
          pinyin: 'Hǎo! Nà wǒ wèn nǐ: “Nǐ huì yóuyǒng ma?” “Wǒ huì yóuyǒng!”',
          vi: 'Tốt lắm! Vậy mình hỏi nhé: “Bạn biết bơi không?” “Mình biết bơi!”'
        },
        {
          start: 824,
          end: 832,
          en: 'Okay. But if you hurt your leg today, say you sprained your ankle—“Can you still swim?”',
          zh: '好。可是，如果你今天腿受伤了，比如扭伤了脚踝——“你还能游泳吗？”',
          pinyin: 'Hǎo. Kěshì, rúguǒ nǐ jīntiān tuǐ shòushāng le, bǐrú niǔshāng le jiǎohuái——“Nǐ hái néng yóuyǒng ma?”',
          vi: 'Được rồi. Nhưng nếu hôm nay chân bạn bị thương, chẳng hạn bị trẹo cổ chân thì sao? “Bạn còn có thể bơi được không?”'
        },
        {
          start: 832,
          end: 840,
          en: 'Then… should I say, “I don’t know how to swim”? No, that’s not right! Huh? But I can’t swim!',
          zh: '那……我该说“我不会游泳”吗？不对，这样说不对！啊？可是我不能游泳啊！',
          pinyin: 'Nà…… wǒ gāi shuō “Wǒ bú huì yóuyǒng” ma? Bú duì, zhèyàng shuō bú duì! Á? Kěshì wǒ bù néng yóuyǒng a!',
          vi: 'Vậy… mình nên nói “Mình không biết bơi” à? Không, nói thế không đúng! Hả? Nhưng mình không thể bơi được mà!'
        },
        {
          start: 840,
          end: 848,
          en: 'You know how to swim—the skill hasn’t disappeared! Hurting your leg doesn’t mean you’ve forgotten how to swim.',
          zh: '你会游泳，这个技能并没有消失！腿受伤了，不代表你忘了怎么游泳。',
          pinyin: 'Nǐ huì yóuyǒng, zhège jìnéng bìng méiyǒu xiāoshī! Tuǐ shòushāng le, bú dàibiǎo nǐ wàng le zěnme yóuyǒng.',
          vi: 'Bạn vẫn biết bơi, kỹ năng đó đâu có mất đi! Chân bị thương không có nghĩa là bạn đã quên cách bơi.'
        },
        {
          start: 848,
          end: 856,
          en: 'But your physical condition today doesn’t allow you to swim. Those are two different things.',
          zh: '可是，你今天的身体状况不允许你游泳。这是两回事。',
          pinyin: 'Kěshì, nǐ jīntiān de shēntǐ zhuàngkuàng bù yǔnxǔ nǐ yóuyǒng. Zhè shì liǎng huí shì.',
          vi: 'Nhưng tình trạng cơ thể hôm nay không cho phép bạn bơi. Đây là hai chuyện khác nhau.'
        },
        {
          start: 856,
          end: 863,
          en: 'That’s why Chinese has both “会” and “能”!',
          zh: '所以，中文里才有“会”和“能”这两个词呀！',
          pinyin: 'Suǒyǐ, Zhōngwén lǐ cái yǒu “huì” hé “néng” zhè liǎng ge cí ya!',
          vi: 'Vì thế tiếng Trung mới có cả hai từ “会” và “能” đấy!'
        },
        {
          start: 863,
          end: 869,
          en: 'Let’s revisit that example: “I know how to swim.” This is a skill you’ve learned.',
          zh: '我们再看一下刚才的例子：“我会游泳。”这是你学会的一项技能。',
          pinyin: 'Wǒmen zài kàn yíxià gāngcái de lìzi: “Wǒ huì yóuyǒng.” Zhè shì nǐ xuéhuì de yí xiàng jìnéng.',
          vi: 'Cùng xem lại ví dụ vừa rồi nhé: “Mình biết bơi.” Đây là một kỹ năng bạn đã học được.'
        },
        {
          start: 869,
          end: 880,
          en: 'But you hurt your leg today: “I can’t swim today.” It’s because your physical condition doesn’t allow it, not because you’ve forgotten how.',
          zh: '但是，你今天腿受伤了：“我今天不能游泳。”不是因为你忘了怎么游泳，而是因为身体状况不允许。',
          pinyin: 'Dànshì, nǐ jīntiān tuǐ shòushāng le: “Wǒ jīntiān bù néng yóuyǒng.” Bú shì yīnwèi nǐ wàng le zěnme yóuyǒng, ér shì yīnwèi shēntǐ zhuàngkuàng bù yǔnxǔ.',
          vi: 'Nhưng hôm nay chân bạn bị thương: “Hôm nay mình không thể bơi.” Không phải vì bạn quên cách bơi, mà vì tình trạng cơ thể không cho phép.'
        },
        {
          start: 880,
          end: 887,
          en: 'Put the two sentences together: “I know how to swim, but I can’t swim today.”',
          zh: '把这两句话放在一起就是：“我会游泳，但是我今天不能游泳。”',
          pinyin: 'Bǎ zhè liǎng jù huà fàng zài yìqǐ jiù shì: “Wǒ huì yóuyǒng, dànshì wǒ jīntiān bù néng yóuyǒng.”',
          vi: 'Ghép hai câu lại sẽ là: “Mình biết bơi, nhưng hôm nay mình không thể bơi.”'
        },
        {
          start: 887,
          end: 896,
          en: 'Oh! I still know how to swim! The skill hasn’t disappeared; my physical condition just prevents me from swimming today!',
          zh: '哦！我还是会游泳！这个技能没有消失，只是今天的身体状况不允许我游泳！',
          pinyin: 'Ò! Wǒ háishi huì yóuyǒng! Zhège jìnéng méiyǒu xiāoshī, zhǐshì jīntiān de shēntǐ zhuàngkuàng bù yǔnxǔ wǒ yóuyǒng!',
          vi: 'Ồ! Mình vẫn biết bơi! Kỹ năng đó không mất đi, chỉ là tình trạng cơ thể hôm nay không cho phép mình bơi thôi!'
        },
        {
          start: 896,
          end: 899,
          en: 'So that’s why these two words are different!',
          zh: '所以这两个词才不一样啊！',
          pinyin: 'Suǒyǐ zhè liǎng ge cí cái bù yíyàng a!',
          vi: 'Thì ra đó là lý do hai từ này khác nhau!'
        },
        {
          start: 899,
          end: 905,
          en: 'Exactly! The key is that “会” asks: Do you know how to do this?',
          zh: '完全正确！重点是，“会”问的是：你知道怎么做这件事吗？',
          pinyin: 'Wánquán zhèngquè! Zhòngdiǎn shì, “huì” wèn de shì: Nǐ zhīdào zěnme zuò zhè jiàn shì ma?',
          vi: 'Chính xác! Điểm mấu chốt là, “会” hỏi: Bạn có biết cách làm việc này không?'
        },
        {
          start: 905,
          end: 911,
          en: '“能” asks: Can you do this under these circumstances?',
          zh: '“能”问的是：在这种情况下，你能做这件事吗？',
          pinyin: '“Néng” wèn de shì: Zài zhè zhǒng qíngkuàng xià, nǐ néng zuò zhè jiàn shì ma?',
          vi: 'Còn “能” hỏi: Trong hoàn cảnh này, bạn có thể làm việc đó được không?'
        },
        {
          start: 911,
          end: 922,
          en: 'Let’s look at another example, with driving: “I know how to drive.” “I’ve had alcohol, so I can’t drive now.”',
          zh: '我们再看一个开车的例子：“我会开车。”“我喝了酒，现在不能开车。”',
          pinyin: 'Wǒmen zài kàn yí ge kāichē de lìzi: “Wǒ huì kāichē.” “Wǒ hē le jiǔ, xiànzài bù néng kāichē.”',
          vi: 'Cùng xem thêm một ví dụ về lái xe nhé: “Mình biết lái xe.” “Mình đã uống rượu nên bây giờ không thể lái xe.”'
        },
        {
          start: 922,
          end: 932,
          en: '“会开车” is a learned skill, so we use 会. Whether you can drive right now depends on the situation, so we use 能.',
          zh: '“会开车”是技能，用的是“会”。现在能不能开车，要看情况，用的是“能”。',
          pinyin: '“Huì kāichē” shì jìnéng, yòng de shì “huì”. Xiànzài néng bu néng kāichē, yào kàn qíngkuàng, yòng de shì “néng”.',
          vi: '“会开车” (biết lái xe) là kỹ năng, nên dùng “会”. Còn ngay lúc này có lái xe được hay không thì tùy tình huống, nên dùng “能”.'
        },
        {
          start: 932,
          end: 941,
          en: 'Exactly! Okay, question two! You\'re sick, so you can\'t go to the meeting today.',
          zh: '完全正确！好，第二题！你生病了，今天没办法去开会。',
          pinyin: 'Wánquán zhèngquè! Hǎo, dì èr tí! Nǐ shēngbìng le, jīntiān méi bànfǎ qù kāihuì.',
          vi: 'Chính xác! Được rồi, câu thứ hai! Bạn bị ốm nên hôm nay không thể đi họp.'
        },
        {
          start: 941,
          end: 948,
          en: 'Hmm… Being sick means your physical condition doesn\'t allow it, so you can\'t go…',
          zh: '嗯……生病了，是身体条件不允许，所以没办法去……',
          pinyin: 'Ǹg…… Shēngbìng le, shì shēntǐ tiáojiàn bù yǔnxǔ, suǒyǐ méi bànfǎ qù……',
          vi: 'Ừm… Bị ốm tức là điều kiện sức khỏe không cho phép, nên không thể đi được…'
        },
        {
          start: 948,
          end: 955,
          en: 'Being sick doesn\'t make you forget how to go to a meeting. It just prevents you from going. So the answer is…',
          zh: '生病不是让你忘了怎么去开会，只是让你去不了。所以答案是……',
          pinyin: 'Shēngbìng bú shì ràng nǐ wàng le zěnme qù kāihuì, zhǐshì ràng nǐ qù bu liǎo. Suǒyǐ dá\'àn shì……',
          vi: 'Bị ốm không làm bạn quên cách đi họp, mà chỉ khiến bạn không đi được. Vậy đáp án là…'
        },
        {
          start: 955,
          end: 963,
          en: '“我今天不能去开会了！” — I can\'t go to the meeting today! Great! 能 expresses whether the situation or conditions allow it.',
          zh: '我今天不能去开会了！太棒了！“能”表示情况或者条件是否允许。',
          pinyin: 'Wǒ jīntiān bù néng qù kāihuì le! Tài bàng le! “Néng” biǎoshì qíngkuàng huòzhě tiáojiàn shìfǒu yǔnxǔ.',
          vi: '“我今天不能去开会了！” — Hôm nay tôi không thể đi họp được rồi! Giỏi lắm! “能” nói về việc tình huống hoặc điều kiện có cho phép hay không.'
        },
        {
          start: 963,
          end: 968,
          en: 'If you use 不会, it sounds like you\'re predicting that you won\'t go,',
          zh: '如果用“不会”，听起来就像是在预测自己不会去，',
          pinyin: 'Rúguǒ yòng “bú huì”, tīng qǐlái jiù xiàng shì zài yùcè zìjǐ bú huì qù,',
          vi: 'Nếu dùng “不会”, nghe sẽ giống như bạn đang dự đoán rằng mình sẽ không đi,'
        },
        {
          start: 968,
          end: 975,
          en: 'Sometimes it could even sound like you don\'t know how to go to a meeting. Strange, right?',
          zh: '有时候甚至会让人以为你不知道怎么去开会。很奇怪，对吧？',
          pinyin: 'Yǒu shíhou shènzhì huì ràng rén yǐwéi nǐ bù zhīdào zěnme qù kāihuì. Hěn qíguài, duì ba?',
          vi: 'Đôi khi còn khiến người ta tưởng rằng bạn không biết cách đi họp. Nghe kỳ lạ nhỉ?'
        },
        {
          start: 975,
          end: 983,
          en: 'Haha, yes, it really is strange! Is it clear now? Okay! Let\'s do a quick quiz!',
          zh: '哈哈，对啊，真的很奇怪！现在清楚了吗？好！我们来做个快速小测验吧！',
          pinyin: 'Hāhā, duì a, zhēn de hěn qíguài! Xiànzài qīngchu le ma? Hǎo! Wǒmen lái zuò ge kuàisù xiǎo cèyàn ba!',
          vi: 'Ha ha, đúng vậy, thật sự rất kỳ lạ! Giờ đã rõ chưa? Được rồi! Cùng làm một bài trắc nghiệm nhanh nhé!'
        },
        {
          start: 983,
          end: 991,
          en: 'The questions will appear on the screen. Let\'s see how much you\'ve learned! Ready?',
          zh: '题目会出现在屏幕上。看看你学会了多少！准备好了吗？',
          pinyin: 'Tímù huì chūxiàn zài píngmù shàng. Kànkan nǐ xuéhuì le duōshao! Zhǔnbèi hǎo le ma?',
          vi: 'Các câu hỏi sẽ xuất hiện trên màn hình. Cùng xem bạn đã học được bao nhiêu nhé! Sẵn sàng chưa?'
        },
        {
          start: 991,
          end: 1001,
          en: 'Ready! Great job, XiaoMing! You got them all right! Hehe, of course! Teacher XiaoYue taught me well!',
          zh: '准备好了！太棒了，小明！全都答对了！嘿嘿，那当然！都是小月老师教得好！',
          pinyin: 'Zhǔnbèi hǎo le! Tài bàng le, Xiǎomíng! Quán dōu dá duì le! Hēihēi, nà dāngrán! Dōu shì Xiǎoyuè lǎoshī jiāo de hǎo!',
          vi: 'Sẵn sàng rồi! Giỏi lắm, Tiểu Minh! Trả lời đúng hết rồi! Hì hì, tất nhiên rồi! Đều nhờ cô Tiểu Nguyệt dạy hay đấy!'
        },
        {
          start: 1001,
          end: 1008,
          en: 'What about our BaoBei viewers? How many questions did you get right? Tell us in the comments below!',
          zh: '屏幕前的宝贝们呢？你们答对了几道题？在下面的评论区告诉我们吧！',
          pinyin: 'Píngmù qián de bǎobèimen ne? Nǐmen dá duì le jǐ dào tí? Zài xiàmiàn de pínglùnqū gàosu wǒmen ba!',
          vi: 'Còn các bảo bối đang xem thì sao? Các bạn trả lời đúng mấy câu? Hãy cho chúng mình biết ở phần bình luận bên dưới nhé!'
        },
        {
          start: 1008,
          end: 1016,
          en: 'Okay, we\'re almost at the end! XiaoMing, it\'s your turn to summarize what we learned today. Give it a try!',
          zh: '好啦，我们快结束了！小明，轮到你来总结今天学的内容了。试试看吧！',
          pinyin: 'Hǎo la, wǒmen kuài jiéshù le! Xiǎomíng, lúndào nǐ lái zǒngjié jīntiān xué de nèiróng le. Shìshi kàn ba!',
          vi: 'Được rồi, chúng ta sắp kết thúc rồi! Tiểu Minh, đến lượt bạn tóm tắt nội dung đã học hôm nay. Thử xem nào!'
        },
        {
          start: 1016,
          end: 1019,
          en: 'Okay! 会 has two main uses.',
          zh: '好！“会”主要有两种用法。',
          pinyin: 'Hǎo! “Huì” zhǔyào yǒu liǎng zhǒng yòngfǎ.',
          vi: 'Được rồi! “会” có hai cách dùng chính.'
        },
        {
          start: 1019,
          end: 1026,
          en: 'First, a learned skill. For example, “我会游泳” means “I can swim.”',
          zh: '第一，表示技能，也就是你学会的东西，比如“我会游泳”。',
          pinyin: 'Dì yī, biǎoshì jìnéng, yě jiùshì nǐ xuéhuì de dōngxi, bǐrú “wǒ huì yóuyǒng”.',
          vi: 'Thứ nhất, diễn tả kỹ năng, tức là những gì bạn đã học được. Ví dụ: “我会游泳” nghĩa là “Tôi biết bơi”.'
        },
        {
          start: 1026,
          end: 1036,
          en: 'Second, it expresses predictions, as in 明天会下雨: “It will rain tomorrow.” 要 has more uses.',
          zh: '第二，表示预测。比如“明天会下雨”。“要”的用法就比较多了。',
          pinyin: 'Dì èr, biǎoshì yùcè. Bǐrú “míngtiān huì xià yǔ”. “Yào” de yòngfǎ jiù bǐjiào duō le.',
          vi: 'Thứ hai là diễn tả dự đoán. Ví dụ, “明天会下雨” nghĩa là “Ngày mai trời sẽ mưa”. Còn “要” thì có nhiều cách dùng hơn.'
        },
        {
          start: 1036,
          end: 1042,
          en: 'It can express a desire, an intention or plan, or a need or obligation.',
          zh: '可以表示想要、打算，或者需要、必须。',
          pinyin: 'Kěyǐ biǎoshì xiǎng yào, dǎsuàn, huòzhě xūyào, bìxū.',
          vi: 'Có thể diễn tả mong muốn, dự định, hoặc ý cần làm, phải làm.'
        },
        {
          start: 1042,
          end: 1048,
          en: 'Also, 要…了 means something is about to happen.',
          zh: '还有，“要……了”表示一件事很快就要发生了。',
          pinyin: 'Hái yǒu, “yào…le” biǎoshì yí jiàn shì hěn kuài jiù yào fāshēng le.',
          vi: 'Ngoài ra, “要……了” diễn tả một việc sắp xảy ra.'
        },
        {
          start: 1048,
          end: 1055,
          en: 'This is important! 不要 means “don\'t do it”; 不用 means “there\'s no need to do it.”',
          zh: '这一点很重要！“不要”是“别做”的意思，“不用”是“不需要做”的意思。',
          pinyin: 'Zhè yì diǎn hěn zhòngyào! “Bú yào” shì “bié zuò” de yìsi, “bú yòng” shì “bù xūyào zuò” de yìsi.',
          vi: 'Điểm này rất quan trọng! “不要” nghĩa là “đừng làm”, còn “不用” nghĩa là “không cần làm”.'
        },
        {
          start: 1055,
          end: 1064,
          en: 'Don\'t mix these two up! 能 concerns conditions and circumstances. Can you do it in this situation?',
          zh: '这两个可别搞混了！“能”说的是条件和情况。在这种情况下，你能做吗？',
          pinyin: 'Zhè liǎng ge kě bié gǎohùn le! “Néng” shuō de shì tiáojiàn hé qíngkuàng. Zài zhè zhǒng qíngkuàng xià, nǐ néng zuò ma?',
          vi: 'Đừng nhầm hai từ này nhé! “能” nói về điều kiện và hoàn cảnh. Trong hoàn cảnh này, bạn có làm được không?'
        },
        {
          start: 1064,
          end: 1073,
          en: 'It\'s about whether the conditions allow it, rather than skill. Great! My teaching paid off!',
          zh: '不是看技能，而是看条件允不允许。太好了！我总算没白教你！',
          pinyin: 'Bú shì kàn jìnéng, ér shì kàn tiáojiàn yǔn bu yǔnxǔ. Tài hǎo le! Wǒ zǒngsuàn méi bái jiāo nǐ!',
          vi: 'Không xét kỹ năng, mà xét xem điều kiện có cho phép hay không. Tuyệt quá! Mình dạy bạn quả là không uổng công!'
        },
        {
          start: 1073,
          end: 1088,
          en: 'One more thing—the most important point today: don\'t simply memorize 会 as “can,” 要 as “want,” and 能 as “can.”',
          zh: '还有一点，也是今天这期节目最重要的一点：不要直接记成“会”就是“can”，“要”就是“want”，“能”就是“can”。',
          pinyin: 'Hái yǒu yì diǎn, yě shì jīntiān zhè qī jiémù zuì zhòngyào de yì diǎn: bú yào zhíjiē jì chéng “huì” jiù shì “can”, “yào” jiù shì “want”, “néng” jiù shì “can”.',
          vi: 'Còn một điểm nữa, cũng là điều quan trọng nhất trong tập hôm nay: đừng học máy móc rằng “会” là “can” (biết/có thể), “要” là “want” (muốn), còn “能” là “can” (có thể).'
        },
        {
          start: 1088,
          end: 1098,
          en: 'Instead, ask yourself: what is the speaker really trying to express? Exactly! Learning Chinese isn\'t translating word for word from your native language.',
          zh: '而是要问问自己：说话的人到底想表达什么？没错！学中文不是把母语一个词一个词地直接翻译过来。',
          pinyin: 'Ér shì yào wènwen zìjǐ: shuōhuà de rén dàodǐ xiǎng biǎodá shénme? Méi cuò! Xué Zhōngwén bú shì bǎ mǔyǔ yí ge cí yí ge cí de zhíjiē fānyì guòlái.',
          vi: 'Thay vào đó, hãy tự hỏi: người nói thực sự muốn diễn đạt điều gì? Đúng vậy! Học tiếng Trung không phải là dịch trực tiếp từng từ từ tiếng mẹ đẻ sang.'
        },
        {
          start: 1098,
          end: 1108,
          en: 'You need to understand what the speaker really means. So, do you all know how to use 会, 要, and 能 now?',
          zh: '要理解说话的人真正想表达的意思。好，今天讲的“会”“要”和“能”，大家都知道怎么用了吗？',
          pinyin: 'Yào lǐjiě shuōhuà de rén zhēnzhèng xiǎng biǎodá de yìsi. Hǎo, jīntiān jiǎng de “huì”, “yào” hé “néng”, dàjiā dōu zhīdào zěnme yòng le ma?',
          vi: 'Bạn cần hiểu ý mà người nói thực sự muốn truyền đạt. Rồi, với “会”, “要” và “能” đã học hôm nay, mọi người đã biết cách dùng chưa?'
        },
        {
          start: 1108,
          end: 1116,
          en: 'XiaoMing gets it now—how about you? If you\'re still unsure, click the link in the description.',
          zh: '小明明白了，你们呢？如果还不太确定，就点一下简介里的链接吧。',
          pinyin: 'Xiǎomíng míngbai le, nǐmen ne? Rúguǒ hái bú tài quèdìng, jiù diǎn yíxià jiǎnjiè lǐ de liànjiē ba.',
          vi: 'Tiểu Minh hiểu rồi, còn các bạn thì sao? Nếu vẫn chưa chắc lắm, hãy nhấn vào liên kết trong phần mô tả nhé.'
        },
        {
          start: 1116,
          end: 1125,
          en: 'We\'ll include a summary of today\'s lesson and some extra exercises for you to try! If you found today\'s video helpful,',
          zh: '我们会放上今天的内容总结和一些额外练习，大家可以自己试着做一做！如果你觉得今天的视频有帮助，',
          pinyin: 'Wǒmen huì fàng shàng jīntiān de nèiróng zǒngjié hé yìxiē éwài liànxí, dàjiā kěyǐ zìjǐ shìzhe zuò yi zuò! Rúguǒ nǐ juéde jīntiān de shìpín yǒu bāngzhù,',
          vi: 'Bọn mình sẽ đăng phần tóm tắt bài học hôm nay cùng một số bài tập bổ sung để các bạn tự làm thử nhé! Nếu thấy video hôm nay hữu ích,'
        },
        {
          start: 1125,
          end: 1132,
          en: 'Remember to like, subscribe to, or follow BaoBao Mandarin so you don\'t miss the next episode!',
          zh: '记得点赞、订阅或者关注 BaoBao Mandarin，这样就不会错过下一期节目啦！',
          pinyin: 'Jìde diǎnzàn, dìngyuè huòzhě guānzhù BaoBao Mandarin, zhèyàng jiù bú huì cuòguò xià yì qī jiémù la!',
          vi: 'Nhớ nhấn thích, đăng ký hoặc theo dõi BaoBao Mandarin để không bỏ lỡ tập tiếp theo nhé!'
        },
        {
          start: 1132,
          end: 1139,
          en: 'All right, BaoBei, that\'s all for today. If there\'s a Chinese word that gets more confusing the more you study it,',
          zh: '好啦，宝贝们，今天就到这里。如果有哪个中文词让你越学越糊涂，',
          pinyin: 'Hǎo la, bǎobèimen, jīntiān jiù dào zhèlǐ. Rúguǒ yǒu nǎ ge Zhōngwén cí ràng nǐ yuè xué yuè hútu,',
          vi: 'Được rồi, các BaoBei ơi, hôm nay đến đây thôi nhé. Nếu có từ tiếng Trung nào khiến bạn càng học càng thấy rối,'
        },
        {
          start: 1139,
          end: 1145,
          en: 'Tell us in the comments! Who knows? It could be the topic of our next episode!',
          zh: '就在评论区告诉我们吧！谁知道呢？也许这就会成为下一期节目的话题！',
          pinyin: 'Jiù zài pínglùnqū gàosu wǒmen ba! Shéi zhīdào ne? Yěxǔ zhè jiù huì chéngwéi xià yì qī jiémù de huàtí!',
          vi: 'Hãy cho bọn mình biết ở phần bình luận nhé! Biết đâu đó sẽ là chủ đề của tập tiếp theo!'
        },
        {
          start: 1145,
          end: 1162,
          en: 'See you next time! Bye-bye, BaoBei!',
          zh: '下次见！拜拜，宝贝们！',
          pinyin: 'Xià cì jiàn! Bàibài, bǎobèi men!',
          vi: 'Hẹn gặp lại lần sau! Bye bye, các BaoBei nhé!'
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
      note: 'Tập thật từ kênh @LearnChineseThroughPodcast (Hạo Văn & Vũ Đồng) — trọn bộ 519 câu script 4 lớp Giản thể · Pinyin · Việt · Anh đồng bộ theo từng giây.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/aYrCe-KTmTg.json',
      cuesCount: 519,
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
      note: 'Tập thật từ kênh @LearnChineseThroughPodcast — trọn bộ 433 câu script 4 lớp Giản thể · Pinyin · Việt · Anh đồng bộ theo từng giây.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/CqNO2psWIyU.json',
      cuesCount: 433,
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
      note: 'Tiểu Nguyệt & Tiểu Minh chia sẻ 5 thói quen giúp nghe nói tự nhiên — trọn bộ 435 câu script 4 lớp Giản thể · Pinyin · Việt · Anh.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/qTKcybgpT8M.json',
      cuesCount: 435,
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
      durationSec: 1062,
      durationLabel: '17:42',
      topic: 'Văn hóa & truyền thuyết',
      note: 'Câu chuyện Bạch Tố Trinh & Hứa Tiên bên Tây Hồ Hàng Châu — trọn bộ 411 câu script 4 lớp Giản thể · Pinyin · Việt · Anh đồng bộ.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 24,
      cuesUrl: 'content/podcast/cues/huEhDinrgQQ.json',
      cuesCount: 411,
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
      durationSec: 1153,
      durationLabel: '19:13',
      topic: 'Ẩm thực Trung Hoa',
      note: 'Học từ vựng miêu tả hương vị, lẩu Tứ Xuyên và bản đồ 8 trường phái ẩm thực lớn — trọn bộ 461 câu script 4 lớp Giản thể · Pinyin · Việt · Anh đồng bộ.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 24,
      cuesUrl: 'content/podcast/cues/xivjMEMEAvE.json',
      cuesCount: 461,
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
      note: 'Hội thoại tốc độ tự nhiên HSK 3–5 về trào lưu phim ngắn — trọn bộ 383 câu script 4 lớp Giản thể · Pinyin · Việt · Anh.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 24,
      cuesUrl: 'content/podcast/cues/MupmlHHMU7k.json',
      cuesCount: 383,
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
      durationSec: 881,
      durationLabel: '14:41',
      topic: 'Công sở & xã hội hiện đại',
      note: 'Tập nâng cao phân tích văn hóa làm việc 996 — trọn bộ 382 câu script 4 lớp Giản thể · Pinyin · Việt · Anh.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 24,
      cuesUrl: 'content/podcast/cues/i8emBnSpS3I.json',
      cuesCount: 382,
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

  const LIBRARY_EPISODES = [
    {
      id: 'ep-ps-2_xoyu_kg6e',
      youtubeId: '2_xoyU_kG6E',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Các thủ đô trên thế giới || LUYỆN ĐỌC TIẾNG TRUNG - HSK 3',
      titleVi: 'Các thủ đô trên thế giới',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 187,
      durationLabel: '3:07',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 10 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/2_xoyU_kG6E.json',
      cuesCount: 10,
      cues: [
        {
          start: 24.31,
          end: 26.41,
          en: 'London is the capital of the UK.',
          zh: '伦敦是英国的首都',
          pinyin: 'Lúndūn shì yīngguó de shǒudū',
          vi: 'Luân Đôn là thủ đô của nước Anh.'
        },
        {
          start: 29.57,
          end: 31.79,
          en: 'Beijing is the capital of China.',
          zh: '北京是中国的首都',
          pinyin: 'Běijīng shì zhōngguó de shǒudū',
          vi: 'Bắc Kinh là thủ đô của Trung Quốc.'
        },
        {
          start: 34.65,
          end: 36.85,
          en: 'Paris is the capital of France.',
          zh: '巴黎是法国的首都',
          pinyin: 'Bālí shì fǎguó de shǒudū',
          vi: 'Paris là thủ đô của nước Pháp.'
        },
        {
          start: 39.75,
          end: 47.16,
          en: 'Rome is the capital of Italy. Seoul is the capital of Korea.',
          zh: '罗马是意大利的首都首尔是韩国的首都',
          pinyin: 'Luómǎ shì yìdàlì de shǒudū shǒuěr shì hánguó de shǒudū',
          vi: 'Roma là thủ đô của Ý. Xơ-un là thủ đô của Hàn Quốc.'
        },
        {
          start: 50.58,
          end: 52.76,
          en: 'Tokyo is the capital of Japan.',
          zh: '东京是日本的首都',
          pinyin: 'Dōngjīng shì rìběn de shǒudū',
          vi: 'Tokyo là thủ đô của Nhật Bản.'
        },
        {
          start: 55.68,
          end: 64.6,
          en: 'Hanoi is the capital of Vietnam. I have been to London, and I have also been to Beijing and Paris.',
          zh: '河内是越南的首都我去过伦敦，也去过北京和巴黎。',
          pinyin: 'Hénèi shì yuènán de shǒudū wǒ qùguò lúndūn, yě qùguò běijīng hé bālí.',
          vi: 'Hà Nội là thủ đô của Việt Nam. Tôi đã đến Luân Đôn, cũng đã đến Bắc Kinh và Paris.'
        },
        {
          start: 67.68,
          end: 72.46,
          en: 'I have never been to Rome, Seoul, Tokyo or Hanoi.',
          zh: '我没有去过罗马、首尔、东京、河内。',
          pinyin: 'Wǒ méiyǒu qùguò luómǎ, shǒuěr, dōngjīng, hénèi.',
          vi: 'Tôi chưa đến Roma, Xơ-un, Tokyo, Hà Nội.'
        },
        {
          start: 107.7,
          end: 109.84,
          en: 'Rome is the capital of Italy.',
          zh: '罗马是意大利的首都。',
          pinyin: 'Luómǎ shì yìdàlì de shǒudū.',
          vi: 'Roma là thủ đô của nước Ý.'
        },
        {
          start: 122.93,
          end: 125.63,
          en: 'Hanoi is the capital of Vietnam.',
          zh: '河内是越南的首都。',
          pinyin: 'Hénèi shì yuènán de shǒudū.',
          vi: 'Hà Nội là thủ đô của Việt Nam.'
        },
        {
          start: 128.76,
          end: 132.46,
          en: 'I have been to London, and I have also been to Beijing and Paris.',
          zh: '我去过伦敦，也去过北京和巴黎。',
          pinyin: 'Wǒ qùguò lúndūn, yě qùguò běijīng hé bālí.',
          vi: 'Tôi đã đến Luân Đôn, cũng đã đến Bắc Kinh và Paris.'
        }
      ]
    },
    {
      id: 'ep-ps-v24yq-munss',
      youtubeId: 'v24Yq-muNss',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Dì của tôi || LUYỆN ĐỌC TIẾNG TRUNG - HSK 3',
      titleVi: 'Dì của tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 212,
      durationLabel: '3:32',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 12 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/v24Yq-muNss.json',
      cuesCount: 12,
      cues: [
        {
          start: 20.35,
          end: 37.01,
          en: 'To begin: my aunt is a Chinese teacher working in Korea. She is very lovely, with big eyes,',
          zh: '开始，我的阿姨是一名中文老师，在韩国工作，她很可爱，长着大眼睛。',
          pinyin: 'Kāishǐ, wǒ de āyí shì yīmíng zhōngwén lǎoshī, zài hánguó gōngzuò, tā hěn kěài, zhǎng zhe dà yǎnjīng.',
          vi: 'Bắt đầu. Dì tôi là giáo viên tiếng Trung, làm việc ở Hàn Quốc, dì rất đáng yêu, có đôi mắt to.'
        },
        {
          start: 39.82,
          end: 52.62,
          en: 'a high nose, a small mouth and long hair. She has many hobbies, such as painting, listening to music,',
          zh: '高鼻子、小嘴巴和长头发，她有很多爱好，比如画画、听音乐、',
          pinyin: 'Gāobízi, xiǎo zuǐbā hé zhǎng tóufà, tā yǒu hěnduō àihào, bǐrú huàhuà, tīng yīnyuè,',
          vi: 'mũi cao, miệng nhỏ và tóc dài. Dì có nhiều sở thích, ví dụ như vẽ tranh, nghe nhạc,'
        },
        {
          start: 53.06,
          end: 57.64,
          en: 'and doing sports, to keep fit.',
          zh: '做运动，为了锻炼身体。',
          pinyin: 'Zuò yùndòng, wèile duànliànshēntǐ.',
          vi: 'tập thể thao, để rèn luyện sức khỏe.'
        },
        {
          start: 60.28,
          end: 63.54,
          en: 'Every morning she runs in the park.',
          zh: '每个早上，她都会在公园里跑步。',
          pinyin: 'Měigè zǎoshàng, tā dōu huì zài gōngyuán lǐ pǎobù.',
          vi: 'Mỗi sáng, dì đều chạy bộ trong công viên.'
        },
        {
          start: 66.32,
          end: 67.96,
          en: 'I love my aunt very much,',
          zh: '我很爱我的阿姨，',
          pinyin: 'Wǒ hěn ài wǒ de āyí,',
          vi: 'Tôi rất yêu dì tôi,'
        },
        {
          start: 70.83,
          end: 73.21,
          en: 'and on weekends we often go out together.',
          zh: '周末我们经常一起出去玩。',
          pinyin: 'Zhōumò wǒmen jīngcháng yìqǐ chūqùwán.',
          vi: 'cuối tuần chúng tôi thường cùng nhau đi chơi.'
        },
        {
          start: 92.66,
          end: 95.44,
          en: 'My aunt is a Chinese teacher.',
          zh: '我的阿姨是一名中文老师。',
          pinyin: 'Wǒ de āyí shì yīmíng zhōngwén lǎoshī.',
          vi: 'Dì tôi là giáo viên tiếng Trung.'
        },
        {
          start: 98.44,
          end: 111.19,
          en: 'She works in Korea. She is very lovely, with big eyes, a high nose, a small mouth and long hair.',
          zh: '在韩国工作，她很可爱，长着大眼睛，高鼻子，小嘴巴和长头发。',
          pinyin: 'Zài hánguó gōngzuò, tā hěn kěài, zhǎng zhe dà yǎnjīng, gāobízi, xiǎo zuǐbā hé zhǎng tóufà.',
          vi: 'Dì làm việc ở Hàn Quốc, dì rất đáng yêu, có đôi mắt to, mũi cao, miệng nhỏ và tóc dài.'
        },
        {
          start: 114.15,
          end: 115.57,
          en: 'She has many hobbies.',
          zh: '她有很多爱好。',
          pinyin: 'Tā yǒu hěnduō àihào.',
          vi: 'Dì có nhiều sở thích.'
        },
        {
          start: 118.38,
          end: 121.58,
          en: 'For example painting, listening to music, and doing sports.',
          zh: '比如画画，听音乐，做运动。',
          pinyin: 'Bǐrú huàhuà, tīng yīnyuè, zuò yùndòng.',
          vi: 'Ví dụ như vẽ tranh, nghe nhạc, tập thể thao.'
        },
        {
          start: 124.04,
          end: 131.94,
          en: 'To keep fit, every morning she runs in the park.',
          zh: '为了锻炼身体，每个早上，她都会在公园里跑步。',
          pinyin: 'Wèile duànliànshēntǐ, měigè zǎoshàng, tā dōu huì zài gōngyuán lǐ pǎobù.',
          vi: 'Để rèn luyện sức khỏe, mỗi sáng, dì đều chạy bộ trong công viên.'
        },
        {
          start: 134.71,
          end: 141.9,
          en: 'I love my aunt very much, and on weekends we often go out together.',
          zh: '我很爱我的阿姨，周末我们经常一起出去玩。',
          pinyin: 'Wǒ hěn ài wǒ de āyí, zhōumò wǒmen jīngcháng yìqǐ chūqùwán.',
          vi: 'Tôi rất yêu dì tôi, cuối tuần chúng tôi thường cùng nhau đi chơi.'
        }
      ]
    },
    {
      id: 'ep-ps-jzu6f5dk5ge',
      youtubeId: 'Jzu6F5dk5gE',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Lớp học bơi || LUYỆN ĐỌC TIẾNG TRUNG - HSK 3',
      titleVi: 'Lớp học bơi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 279,
      durationLabel: '4:39',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 9 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Jzu6F5dk5gE.json',
      cuesCount: 9,
      cues: [
        {
          start: 24.56,
          end: 27.88,
          en: 'To begin: Xiao Ming\'s mother wanted her son to learn to swim.',
          zh: '开始，小明的妈妈想让儿子学会游泳',
          pinyin: 'Kāishǐ, xiǎo míng de māmā xiǎng ràng érzi xuéhuì yóuyǒng',
          vi: 'Bắt đầu. Mẹ của Tiểu Minh muốn con trai biết bơi.'
        },
        {
          start: 61.41,
          end: 71.14,
          en: 'On the first day of class, after two hours of practice, Xiao Ming said to the swimming teacher,',
          zh: '上课第一天练习了两个小时后，小明就对游泳老师说，',
          pinyin: 'Shàngkè dìyītiān liànxí le liǎnggè xiǎoshí hòu, xiǎo míng jiù duì yóuyǒng lǎoshī shuō,',
          vi: 'Buổi học đầu tiên, sau khi luyện tập hai tiếng, Tiểu Minh liền nói với thầy dạy bơi:'
        },
        {
          start: 75.21,
          end: 82.78,
          en: '"Teacher, let\'s just practise until here this morning. Why?"',
          zh: '老师，上午就练习到这儿吧，为什么呢？',
          pinyin: 'Lǎoshī, shàngwǔ jiù liànxí dào zhèr ba, wèishénme ne?',
          vi: 'Thầy ơi, buổi sáng mình tập đến đây thôi nhé. Vì sao ạ?'
        },
        {
          start: 83.26,
          end: 90.19,
          en: 'The teacher asked. Xiao Ming said, embarrassed,',
          zh: '老师问，小明不好意思的说，',
          pinyin: 'Lǎoshī wèn, xiǎo míng bùhǎoyìsī de shuō,',
          vi: 'Thầy hỏi. Tiểu Minh ngượng ngùng nói:'
        },
        {
          start: 94.78,
          end: 102.48,
          en: '"The water in the pool tastes awful — I\'m almost full from drinking it."',
          zh: '池子里的水太难喝了，我都快喝饱了。',
          pinyin: 'Chízi lǐ de shuǐ tài nán hē le, wǒ dōu kuài hē bǎo le.',
          vi: 'Nước trong bể khó uống quá, con sắp uống no rồi.'
        },
        {
          start: 131.88,
          end: 148.2,
          en: 'So she signed him up for a swimming class. His mother said: Xiao Ming, I\'ve signed you up for a swimming class, so now you can play in the water.',
          zh: '就给他报了游泳班。妈妈说小明我给你报了游泳班这样你可以玩水了',
          pinyin: 'Jiù gěi tā bào le yóuyǒng bān. Māmā shuō xiǎo míng wǒ gěi nǐ bào le yóuyǒng bān zhèyàng nǐ kěyǐ wánshuǐ le',
          vi: 'Thế là bà đăng ký cho cậu một lớp học bơi. Mẹ nói: Tiểu Minh, mẹ đăng ký lớp học bơi cho con rồi, thế là con được chơi với nước.'
        },
        {
          start: 151.82,
          end: 164.64,
          en: 'Xiao Ming likes playing in the water, so he was very happy. On the first day of class, after two hours of practice,',
          zh: '小明喜欢玩水所以很高兴上课第一天练习了两个小时后',
          pinyin: 'Xiǎo míng xǐhuān wánshuǐ suǒyǐ hěn gāoxìng shàngkè dìyītiān liànxí le liǎnggè xiǎoshí hòu',
          vi: 'Tiểu Minh thích chơi với nước nên rất vui. Buổi học đầu tiên, sau khi luyện tập hai tiếng,'
        },
        {
          start: 168.04,
          end: 183.84,
          en: 'Xiao Ming said to the swimming teacher: "Teacher, let\'s just practise until here this morning. Why?" the teacher asked.',
          zh: '小明就对游泳老师说老师上午就练到这儿吧为什么呢老师问',
          pinyin: 'Xiǎo míng jiù duì yóuyǒng lǎoshī shuō lǎoshī shàngwǔ jiù liàn dào zhèr ba wèishénme ne lǎoshī wèn',
          vi: 'Tiểu Minh liền nói với thầy dạy bơi: thầy ơi, buổi sáng mình tập đến đây thôi nhé. Vì sao ạ? Thầy hỏi.'
        },
        {
          start: 187.04,
          end: 189.74,
          en: 'Xiao Ming said, embarrassed,',
          zh: '小明不好意思地说',
          pinyin: 'Xiǎo míng bùhǎoyìsī dì shuō',
          vi: 'Tiểu Minh ngượng ngùng nói:'
        }
      ]
    },
    {
      id: 'ep-ps-yiqv3xo5jdm',
      youtubeId: 'YiQV3XO5JdM',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Mua sắm trực tuyến || LUYỆN ĐỌC TIẾNG TRUNG - HSK 3',
      titleVi: 'Mua sắm trực tuyến',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 278,
      durationLabel: '4:38',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 10 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/YiQV3XO5JdM.json',
      cuesCount: 10,
      cues: [
        {
          start: 37.86,
          end: 43.26,
          en: 'For example on Taobao, JD, Meituan and so on.',
          zh: '比如说在淘宝网、京东网，美团网等等。',
          pinyin: 'Bǐrúshuō zài táobǎowǎng, jīngdōng wǎng, měi tuán wǎng děngděng.',
          vi: 'Ví dụ như trên Taobao, JD, Meituan và nhiều trang khác.'
        },
        {
          start: 55.58,
          end: 64.77,
          en: 'You can not only buy food online, but also buy clothes to wear online,',
          zh: '你不仅可以在网上买吃的东西，也可以在网上买穿的衣服，',
          pinyin: 'Nǐ bùjǐn kěyǐ zài wǎngshàng mǎi chī de dōngxī, yě kěyǐ zài wǎngshàng mǎi chuān de yīfú,',
          vi: 'Bạn không những có thể mua đồ ăn trên mạng, mà còn có thể mua quần áo mặc trên mạng,'
        },
        {
          start: 69.05,
          end: 78.53,
          en: 'and also things for use online, such as phones, computers, furniture and so on.',
          zh: '还可以在网上用的东西比如手机、电脑、家具等等。',
          pinyin: 'Hái kěyǐ zài wǎngshàng yòng de dōngxī bǐrú shǒujī, diànnǎo, jiājù děngděng.',
          vi: 'còn có thể mua đồ dùng trên mạng, ví dụ như điện thoại, máy tính, đồ nội thất và nhiều thứ khác.'
        },
        {
          start: 82.55,
          end: 90.86,
          en: 'Online shopping is increasingly popular, and what\'s online is hugely varied,',
          zh: '网上购物越来越受到人们的欢迎，网上的东西多种多样，',
          pinyin: 'Wǎngshàng gòuwù yuèláiyuè shòudào rénmen de huānyíng, wǎngshàng de dōngxī duōzhǒngduōyàng,',
          vi: 'Mua sắm trực tuyến ngày càng được mọi người ưa chuộng, đồ trên mạng đa dạng phong phú,'
        },
        {
          start: 94.39,
          end: 104.33,
          en: 'you don\'t have to go out — you can buy from home. As long as you have a phone and a network, you can shop.',
          zh: '你不用出门，留在家里就可以买。只要你有手机和网络，就可以购买。',
          pinyin: 'Nǐ bùyòng chūmén, liúzài jiālǐ jiù kěyǐ mǎi. Zhǐyào nǐ yǒu shǒujī hé wǎngluò, jiù kěyǐ gòumǎi.',
          vi: 'bạn không cần ra khỏi nhà, ở nhà là có thể mua. Chỉ cần có điện thoại và mạng là có thể mua hàng.'
        },
        {
          start: 143.73,
          end: 146.19,
          en: 'JD, Meituan and so on.',
          zh: '京东网，美团网等等。',
          pinyin: 'Jīngdōng wǎng, měi tuán wǎng děngděng.',
          vi: 'JD, Meituan và nhiều trang khác.'
        },
        {
          start: 178.06,
          end: 182.16,
          en: 'For example phones, computers, furniture and so on.',
          zh: '比如手机、电脑、家具等等。',
          pinyin: 'Bǐrú shǒujī, diànnǎo, jiājù děngděng.',
          vi: 'Ví dụ như điện thoại, máy tính, đồ nội thất và nhiều thứ khác.'
        },
        {
          start: 186.2,
          end: 189.56,
          en: 'Online shopping is increasingly popular.',
          zh: '网上购物越来越受到人们的欢迎。',
          pinyin: 'Wǎngshàng gòuwù yuèláiyuè shòudào rénmen de huānyíng.',
          vi: 'Mua sắm trực tuyến ngày càng được mọi người ưa chuộng.'
        },
        {
          start: 193.66,
          end: 195.46,
          en: 'What\'s online is hugely varied.',
          zh: '网上面的东西多种多样。',
          pinyin: 'Wǎng shàngmiàn de dōngxī duōzhǒngduōyàng.',
          vi: 'Đồ trên mạng đa dạng phong phú.'
        },
        {
          start: 199,
          end: 201.9,
          en: 'You don\'t have to go out — you can buy from home.',
          zh: '你不用出门，留在家里就可以买。',
          pinyin: 'Nǐ bùyòng chūmén, liúzài jiālǐ jiù kěyǐ mǎi.',
          vi: 'Bạn không cần ra khỏi nhà, ở nhà là có thể mua.'
        }
      ]
    },
    {
      id: 'ep-ps-220spiohh6o',
      youtubeId: '220SPiohH6o',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Nuôi thú cưng || LUYỆN ĐỌC TIẾNG TRUNG - HSK 3',
      titleVi: 'Nuôi thú cưng',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 194,
      durationLabel: '3:14',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 8 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/220SPiohH6o.json',
      cuesCount: 8,
      cues: [
        {
          start: 23.79,
          end: 28.23,
          en: 'To begin: more and more families now keep small pets.',
          zh: '开始，现在越来越多的家庭会养小宠物了。',
          pinyin: 'Kāishǐ, xiànzài yuèláiyuè duō de jiātíng huì yǎng xiǎo chǒngwù le.',
          vi: 'Bắt đầu. Bây giờ ngày càng nhiều gia đình nuôi thú cưng nhỏ.'
        },
        {
          start: 30.99,
          end: 33.45,
          en: 'For example, kittens and puppies.',
          zh: '比如，小猫、小狗。',
          pinyin: 'Bǐrú, xiǎomāo, xiǎogǒu.',
          vi: 'Ví dụ như mèo con, chó con.'
        },
        {
          start: 36,
          end: 38.7,
          en: 'They have become a member of the family.',
          zh: '它们成为了一位家庭成员。',
          pinyin: 'Tāmen chéngwéi le yīwèi jiātíngchéngyuán.',
          vi: 'Chúng đã trở thành một thành viên trong gia đình.'
        },
        {
          start: 41.38,
          end: 43.62,
          en: 'They bring joy to the family.',
          zh: '给家里人带来了欢乐。',
          pinyin: 'Gěi jiālǐrén dàilái le huānlè.',
          vi: 'Mang lại niềm vui cho người trong nhà.'
        },
        {
          start: 52.31,
          end: 59.94,
          en: 'Every day the little pets wander around the house at ease, eating and sleeping.',
          zh: '小宠物们每天在家里悠闲地走着，吃饭睡觉。',
          pinyin: 'Xiǎo chǒngwù men měitiān zài jiālǐ yōuxiándì zǒu zhe, chīfàn shuìjiào.',
          vi: 'Mỗi ngày thú cưng nhỏ thong thả đi lại trong nhà, ăn rồi ngủ.'
        },
        {
          start: 62.36,
          end: 69.52,
          en: 'They seem to understand what people say, and they are especially clever.',
          zh: '他们好像能够听懂人类说话一样，特别的聪明。',
          pinyin: 'Tāmen hǎoxiàng nénggòu tīngdǒng rénlèi shuōhuà yīyàng, tèbié de cōngmíng.',
          vi: 'Chúng cứ như thể hiểu được người nói vậy, đặc biệt thông minh.'
        },
        {
          start: 108.3,
          end: 114.39,
          en: 'They can also grow up together with the children in the family.',
          zh: '还能够陪伴家里的小孩子一起长大。',
          pinyin: 'Hái nénggòu péibàn jiālǐ de xiǎoháizi yìqǐ zhǎngdà.',
          vi: 'Còn có thể cùng lớn lên với trẻ nhỏ trong nhà.'
        },
        {
          start: 117.11,
          end: 124.62,
          en: 'Every day the little pets wander around the house at ease, eating and sleeping.',
          zh: '小宠物们每天在家里悠闲地走着，吃饭睡觉。',
          pinyin: 'Xiǎo chǒngwù men měitiān zài jiālǐ yōuxiándì zǒu zhe, chīfàn shuìjiào.',
          vi: 'Mỗi ngày thú cưng nhỏ thong thả đi lại trong nhà, ăn rồi ngủ.'
        }
      ]
    },
    {
      id: 'ep-ps-oo5gvxtfohi',
      youtubeId: 'oo5GvxtFohI',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Nói về người bạn thân || LUYỆN ĐỌC TIẾNG TRUNG - HSK 3',
      titleVi: 'Nói về người bạn thân',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 211,
      durationLabel: '3:31',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 11 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/oo5GvxtFohI.json',
      cuesCount: 11,
      cues: [
        {
          start: 19.92,
          end: 26.82,
          en: 'To begin: my good friend is a girl.',
          zh: '开始，我的好朋友是一个女孩。',
          pinyin: 'Kāishǐ, wǒ de hǎo péngyǒu shì yígè nǚhái.',
          vi: 'Bắt đầu. Bạn thân của tôi là một cô gái.'
        },
        {
          start: 29.87,
          end: 32.47,
          en: 'She isn\'t tall, and she looks very cute.',
          zh: '她个子不高，长得很可爱。',
          pinyin: 'Tā gèzi bù gāo, zhǎng dé hěn kěài.',
          vi: 'Cô ấy không cao, trông rất đáng yêu.'
        },
        {
          start: 35.6,
          end: 38.46,
          en: 'She is not only clever but also conscientious.',
          zh: '她不但聪明，而且认真。',
          pinyin: 'Tā bùdàn cōngmíng, érqiě rènzhēn.',
          vi: 'Cô ấy không những thông minh mà còn nghiêm túc.'
        },
        {
          start: 41.32,
          end: 43.54,
          en: 'She likes to study at the library.',
          zh: '她喜欢去图书馆学习。',
          pinyin: 'Tā xǐhuān qù túshūguǎn xuéxí.',
          vi: 'Cô ấy thích đến thư viện học bài.'
        },
        {
          start: 46.46,
          end: 49.38,
          en: 'So she does well in every exam.',
          zh: '所以每次考试成绩都很好。',
          pinyin: 'Suǒyǐ měicì kǎoshìchéngjì dōu hěn hǎo.',
          vi: 'Nên lần nào thi cũng đạt kết quả tốt.'
        },
        {
          start: 53.42,
          end: 56.56,
          en: 'She is very warm-hearted and always cares about other people.',
          zh: '她很热情，总是关心别人。',
          pinyin: 'Tā hěn rèqíng, zǒngshì guānxīn biérén.',
          vi: 'Cô ấy rất nhiệt tình, luôn quan tâm đến người khác.'
        },
        {
          start: 58.77,
          end: 66.79,
          en: 'If someone has a problem, she will definitely help them solve it.',
          zh: '如果别人有困难，她一定会帮助别人解决问题。',
          pinyin: 'Rúguǒ biérén yǒu kùnnán, tā yídìng huì bāngzhù biérén jiějuéwèntí.',
          vi: 'Nếu người khác gặp khó khăn, cô ấy nhất định sẽ giúp họ giải quyết vấn đề.'
        },
        {
          start: 69.76,
          end: 76.82,
          en: 'She has many hobbies, such as playing football and hiking.',
          zh: '她有很多爱好，比如踢足球、爬山。',
          pinyin: 'Tā yǒu hěnduō àihào, bǐrú tīzúqiú, páshān.',
          vi: 'Cô ấy có nhiều sở thích, ví dụ như đá bóng, leo núi.'
        },
        {
          start: 95.97,
          end: 98.63,
          en: 'My good friend is a girl.',
          zh: '我的好朋友是一个女孩。',
          pinyin: 'Wǒ de hǎo péngyǒu shì yígè nǚhái.',
          vi: 'Bạn thân của tôi là một cô gái.'
        },
        {
          start: 113.74,
          end: 125.96,
          en: 'She likes to study at the library. So she does well in every exam. She is very warm-hearted,',
          zh: '她喜欢去图书馆学习。所以每次考试成绩都很好，她很热情，',
          pinyin: 'Tā xǐhuān qù túshūguǎn xuéxí. Suǒyǐ měicì kǎoshìchéngjì dōu hěn hǎo, tā hěn rèqíng,',
          vi: 'Cô ấy thích đến thư viện học bài. Nên lần nào thi cũng đạt kết quả tốt. Cô ấy rất nhiệt tình,'
        },
        {
          start: 126.52,
          end: 128.1,
          en: 'and always care about other people.',
          zh: '总是关心别人。',
          pinyin: 'Zǒngshì guānxīn biérén.',
          vi: 'luôn quan tâm đến người khác.'
        }
      ]
    },
    {
      id: 'ep-ps--7vhw8hy7e0',
      youtubeId: '-7vHw8HY7e0',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Nói về thời tiết xấu || LUYỆN ĐỌC TIẾNG TRUNG - HSK 3',
      titleVi: 'Nói về thời tiết xấu',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 205,
      durationLabel: '3:25',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 9 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/-7vHw8HY7e0.json',
      cuesCount: 9,
      cues: [
        {
          start: 21.22,
          end: 36.7,
          en: 'To begin: the weather today is really bad. A typhoon has hit the whole Guangzhou area, and it has been raining heavily outside the whole time.',
          zh: '开始，今天的天气特别不好，台风袭击了整个广州地区，外面一直在下大雨。',
          pinyin: 'Kāishǐ, jīntiān de tiānqì tèbié bùhǎo, táifēng xíjī le zhěnggè guǎngzhōudìqū, wàimiàn yìzhí zài xià dàyǔ.',
          vi: 'Bắt đầu. Hôm nay thời tiết rất xấu, bão đã quét qua toàn bộ khu vực Quảng Châu, bên ngoài mưa to suốt.'
        },
        {
          start: 39.43,
          end: 50.84,
          en: 'There isn\'t a single pedestrian on the street. The strong wind is howling and has blown down big trees,',
          zh: '街上没有任何一个行人，大风呼呼地刮着，把大树吹倒了，',
          pinyin: 'Jiēshàng méiyǒu rènhé yígè xíngrén, dàfēng hūhūdì guā zhe, bǎ dàshù chuīdào le,',
          vi: 'Trên phố không có một người đi đường nào, gió lớn thổi ào ào, quật đổ cả cây to,'
        },
        {
          start: 53.48,
          end: 64.94,
          en: 'blowing things everywhere. Besides that, I feel really cold, and I hope the typhoon passes soon.',
          zh: '把物品吹得到处都是。而且，我感觉特别冷，希望台风早点过去。',
          pinyin: 'Bǎ wùpǐn chuī dédào chù dōu shì. Érqiě, wǒ gǎnjué tèbié lěng, xīwàng táifēng zǎodiǎn guòqù.',
          vi: 'thổi đồ đạc bay khắp nơi. Hơn nữa, tôi thấy rất lạnh, mong bão sớm qua đi.'
        },
        {
          start: 67.69,
          end: 69.79,
          en: 'That way I can go out and play.',
          zh: '这样我就可以出去玩了。',
          pinyin: 'Zhèyàng wǒ jiù kěyǐ chūqùwán le.',
          vi: 'Như vậy thì tôi mới có thể ra ngoài chơi.'
        },
        {
          start: 88.16,
          end: 95.87,
          en: 'The weather today is really bad. A typhoon has hit the whole Guangzhou area.',
          zh: '今天的天气特别不好，台风袭击了整个广州地区。',
          pinyin: 'Jīntiān de tiānqì tèbié bùhǎo, táifēng xíjī le zhěnggè guǎngzhōudìqū.',
          vi: 'Hôm nay thời tiết rất xấu, bão đã quét qua toàn bộ khu vực Quảng Châu.'
        },
        {
          start: 98.68,
          end: 105.78,
          en: 'It has been raining heavily outside the whole time, and there isn\'t a single pedestrian on the street.',
          zh: '外面一直在下大雨，街上没有任何一个行人。',
          pinyin: 'Wàimiàn yìzhí zài xià dàyǔ, jiēshàng méiyǒu rènhé yígè xíngrén.',
          vi: 'Bên ngoài mưa to suốt, trên phố không có một người đi đường nào.'
        },
        {
          start: 108.68,
          end: 119.53,
          en: 'The strong wind is howling and has blown down big trees. It has blown things everywhere.',
          zh: '大风呼呼地刮着，把大树吹倒了。把物品吹得到处都是。',
          pinyin: 'Dàfēng hūhūdì guā zhe, bǎ dàshù chuīdào le. Bǎ wùpǐn chuī dédào chù dōu shì.',
          vi: 'Gió lớn thổi ào ào, quật đổ cả cây to. Thổi đồ đạc bay khắp nơi.'
        },
        {
          start: 121.98,
          end: 128.71,
          en: 'Besides that, I feel really cold. I hope the typhoon passes soon.',
          zh: '而且，我感觉特别冷。希望台风早点过去。',
          pinyin: 'Érqiě, wǒ gǎnjué tèbié lěng. Xīwàng táifēng zǎodiǎn guòqù.',
          vi: 'Hơn nữa, tôi thấy rất lạnh. Mong bão sớm qua đi.'
        },
        {
          start: 131.6,
          end: 133.74,
          en: 'That way I can go out and play.',
          zh: '这样我就可以出去玩啦。',
          pinyin: 'Zhèyàng wǒ jiù kěyǐ chūqùwán la.',
          vi: 'Như vậy thì tôi mới có thể ra ngoài chơi.'
        }
      ]
    },
    {
      id: 'ep-ps-pnrgjomv2bq',
      youtubeId: 'PnrgJoMV2bQ',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Tôi và bạn gái || LUYỆN ĐỌC TIẾNG TRUNG - HSK 3',
      titleVi: 'Tôi và bạn gái',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 191,
      durationLabel: '3:11',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 10 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/PnrgJoMV2bQ.json',
      cuesCount: 10,
      cues: [
        {
          start: 20.04,
          end: 27.98,
          en: 'To begin: this morning I went to the airport to pick up my girlfriend.',
          zh: '开始，今天早上，我去机场接我的女朋友。',
          pinyin: 'Kāishǐ, jīntiān zǎoshàng, wǒ qù jīchǎng jiē wǒ de nǚpéngyǒu.',
          vi: 'Bắt đầu. Sáng nay tôi ra sân bay đón bạn gái.'
        },
        {
          start: 30.65,
          end: 36.77,
          en: 'But her flight was delayed, and I waited for her for two hours.',
          zh: '但是她的航班晚点了，我等了她两个小时。',
          pinyin: 'Dànshì tā de hángbān wǎndiǎn le, wǒ děng le tā liǎnggè xiǎoshí.',
          vi: 'Nhưng chuyến bay của cô ấy bị hoãn, tôi đã đợi cô ấy hai tiếng.'
        },
        {
          start: 39.62,
          end: 42.72,
          en: 'Around noon she caught a cold and felt unwell.',
          zh: '中午的时候，她感冒了，不舒服。',
          pinyin: 'Zhōngwǔ de shíhòu, tā gǎnmào le, bù shūfú.',
          vi: 'Đến trưa, cô ấy bị cảm, thấy không khỏe.'
        },
        {
          start: 45.48,
          end: 53.31,
          en: 'So we went to the supermarket to buy fresh vegetables and cooked at home ourselves.',
          zh: '所以我们去超市买新鲜的菜，回家自己煮饭。',
          pinyin: 'Suǒyǐ wǒmen qù chāoshì mǎi xīnxiān de cài, huíjiā zìjǐ zhǔfàn.',
          vi: 'Nên chúng tôi đi siêu thị mua rau tươi, về nhà tự nấu cơm.'
        },
        {
          start: 56.16,
          end: 63.28,
          en: 'In the evening she felt a bit better, so we played games and listened to music together.',
          zh: '晚上她感觉好点了，我们就一起打游戏和听音乐。',
          pinyin: 'Wǎnshàng tā gǎnjué hǎo diǎn le, wǒmen jiù yìqǐ dǎyóuxì hé tīng yīnyuè.',
          vi: 'Đến tối cô ấy thấy đỡ hơn, chúng tôi cùng chơi game và nghe nhạc.'
        },
        {
          start: 66.01,
          end: 67.83,
          en: 'Our day was so happy.',
          zh: '我们的一天太快乐了。',
          pinyin: 'Wǒmen de yītiān tài kuàilè le.',
          vi: 'Một ngày của chúng tôi thật là vui.'
        },
        {
          start: 86.96,
          end: 90.42,
          en: 'This morning I went to the airport to pick up my girlfriend,',
          zh: '今天早上我去机场接我的女朋友，',
          pinyin: 'Jīntiān zǎoshàng wǒ qù jīchǎng jiē wǒ de nǚpéngyǒu,',
          vi: 'Sáng nay tôi ra sân bay đón bạn gái,'
        },
        {
          start: 93.09,
          end: 94.83,
          en: 'but her flight was delayed.',
          zh: '但是她的航班晚点了。',
          pinyin: 'Dànshì tā de hángbān wǎndiǎn le.',
          vi: 'nhưng chuyến bay của cô ấy bị hoãn.'
        },
        {
          start: 97.77,
          end: 105.57,
          en: 'I waited for her for two hours. Around noon she caught a cold and felt unwell.',
          zh: '我等了她两个小时，中午的时候她感冒了，不舒服。',
          pinyin: 'Wǒ děng le tā liǎnggè xiǎoshí, zhōngwǔ de shíhòu tā gǎnmào le, bù shūfú.',
          vi: 'Tôi đợi cô ấy hai tiếng. Đến trưa cô ấy bị cảm, thấy không khỏe.'
        },
        {
          start: 118.45,
          end: 125.78,
          en: 'In the evening she felt a bit better. We played games and listened to music together.',
          zh: '晚上，她感觉好点了。我们就一起打游戏和听音乐。',
          pinyin: 'Wǎnshàng, tā gǎnjué hǎo diǎn le. Wǒmen jiù yìqǐ dǎyóuxì hé tīng yīnyuè.',
          vi: 'Đến tối, cô ấy thấy đỡ hơn. Chúng tôi cùng chơi game và nghe nhạc.'
        }
      ]
    },
    {
      id: 'ep-ps-ezcv22csdsw',
      youtubeId: 'ezcv22csdsw',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Đi làm công || LUYỆN ĐỌC TIẾNG TRUNG - HSK 3',
      titleVi: 'Đi làm công',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 209,
      durationLabel: '3:29',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 14 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/ezcv22csdsw.json',
      cuesCount: 14,
      cues: [
        {
          start: 23.66,
          end: 31.32,
          en: 'After school I go to work part-time at a restaurant as a waiter.',
          zh: '放学以后我会去餐厅打工当一名服务员',
          pinyin: 'Fàngxué yǐhòu wǒhuì qù cāntīng dǎgōng dāng yīmíng fúwùyuán',
          vi: 'Sau giờ tan học tôi sẽ đến nhà hàng làm thêm, làm nhân viên phục vụ.'
        },
        {
          start: 34.45,
          end: 36.19,
          en: 'When I work part-time at the restaurant,',
          zh: '在餐厅打工的时候',
          pinyin: 'Zài cāntīng dǎgōng de shíhòu',
          vi: 'Khi làm thêm ở nhà hàng,'
        },
        {
          start: 39.21,
          end: 42.01,
          en: 'the things I need to do include carrying plates,',
          zh: '我需要做的事情有端盘子',
          pinyin: 'Wǒ xūyào zuò de shìqíng yǒu duānpánzi',
          vi: 'những việc tôi cần làm có bưng bát đĩa,'
        },
        {
          start: 44.28,
          end: 46.34,
          en: 'pouring beer for the guests,',
          zh: '给客人倒啤酒',
          pinyin: 'Gěi kèrén dào píjiǔ',
          vi: 'rót bia cho khách,'
        },
        {
          start: 49.9,
          end: 52.48,
          en: 'and cleaning up after the shift ends.',
          zh: '和在下班以后打扫卫生',
          pinyin: 'Hé zài xiàbān yǐhòu dǎsǎowèishēng',
          vi: 'và dọn dẹp vệ sinh sau khi tan ca.'
        },
        {
          start: 55.39,
          end: 56.73,
          en: 'Besides earning money,',
          zh: '除了能赚钱',
          pinyin: 'Chúle néng zhuànqián',
          vi: 'Ngoài việc kiếm được tiền,'
        },
        {
          start: 59.46,
          end: 61.86,
          en: 'I can also eat dinner at the restaurant.',
          zh: '我还可以在餐厅吃晚餐',
          pinyin: 'Wǒ hái kěyǐ zài cāntīng chī wǎncān',
          vi: 'tôi còn có thể ăn tối ở nhà hàng.'
        },
        {
          start: 64.04,
          end: 71.28,
          en: 'The manager thought I worked very well and decided to give me a raise.',
          zh: '经理觉得我工作得很好，决定给我加工资。',
          pinyin: 'Jīnglǐ juéde wǒ gōngzuò dé hěn hǎo, juédìng gěi wǒ jiāgōngzī.',
          vi: 'Quản lý thấy tôi làm việc rất tốt, quyết định tăng lương cho tôi.'
        },
        {
          start: 73.98,
          end: 76.4,
          en: 'One hundred and fifty yuan a week.',
          zh: '每个星期给我一百五十块。',
          pinyin: 'Měigè xīngqī gěi wǒ yìbǎiwǔshíkuài.',
          vi: 'Mỗi tuần trả tôi một trăm năm mươi tệ.'
        },
        {
          start: 106.25,
          end: 113.53,
          en: 'When I work part-time at the restaurant, the things I need to do include carrying plates.',
          zh: '在餐厅打工的时候，我需要做的事情有端盘子。',
          pinyin: 'Zài cāntīng dǎgōng de shíhòu, wǒ xūyào zuò de shìqíng yǒu duānpánzi.',
          vi: 'Khi làm thêm ở nhà hàng, việc tôi cần làm có bưng bát đĩa.'
        },
        {
          start: 116.53,
          end: 123.52,
          en: 'Pouring beer for the guests, and cleaning up after the shift ends.',
          zh: '给客人倒啤酒，和在下班以后打扫卫生。',
          pinyin: 'Gěi kèrén dào píjiǔ, hé zài xiàbān yǐhòu dǎsǎowèishēng.',
          vi: 'Rót bia cho khách, và dọn dẹp vệ sinh sau khi tan ca.'
        },
        {
          start: 123.52,
          end: 133.57,
          en: 'Besides earning money, I can also eat dinner at the restaurant.',
          zh: '除了能赚钱，我还可以在餐厅吃晚餐。',
          pinyin: 'Chúle néng zhuànqián, wǒ hái kěyǐ zài cāntīng chī wǎncān.',
          vi: 'Ngoài việc kiếm được tiền, tôi còn có thể ăn tối ở nhà hàng.'
        },
        {
          start: 136.48,
          end: 138.46,
          en: 'The manager thought I worked very well.',
          zh: '经理觉得我工作得很好。',
          pinyin: 'Jīnglǐ juéde wǒ gōngzuò dé hěn hǎo.',
          vi: 'Quản lý thấy tôi làm việc rất tốt.'
        },
        {
          start: 142.33,
          end: 143.91,
          en: 'And decided to give me a raise.',
          zh: '决定给我加工资。',
          pinyin: 'Juédìng gěi wǒ jiāgōngzī.',
          vi: 'Quyết định tăng lương cho tôi.'
        }
      ]
    },
    {
      id: 'ep-ps-dnpkczmdjci',
      youtubeId: 'DnPkczMdJCI',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Đồng hồ báo thức || LUYỆN ĐỌC TIẾNG TRUNG - HSK 3',
      titleVi: 'Đồng hồ báo thức',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 266,
      durationLabel: '4:26',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 14 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/DnPkczMdJCI.json',
      cuesCount: 14,
      cues: [
        {
          start: 24.06,
          end: 34.69,
          en: 'The next morning, I bought a small alarm clock to wake me up.',
          zh: '第二天早上，我买了一个小闹钟，叫我起床。',
          pinyin: 'Dìèrtiān zǎoshàng, wǒ mǎi le yígè xiǎo nàozhōng, jiào wǒ qǐchuáng.',
          vi: 'Sáng hôm sau, tôi mua một chiếc đồng hồ báo thức nhỏ để gọi tôi dậy.'
        },
        {
          start: 39.12,
          end: 41.88,
          en: 'Thanks to it, I slept very well that night.',
          zh: '因为有它，这一晚我睡得很好。',
          pinyin: 'Yīnwèi yǒu tā, zhè yī wǎn wǒ shuì dé hěn hǎo.',
          vi: 'Nhờ có nó, đêm đó tôi ngủ rất ngon.'
        },
        {
          start: 46.25,
          end: 53.44,
          en: 'The next day, it was already 7:40 when I got up in the morning.',
          zh: '第二天，早上我起来的时候已经七点四十了。',
          pinyin: 'Dìèrtiān, zǎoshàng wǒ qǐlái de shíhòu yǐjīng qīdiǎn sìshí le.',
          vi: 'Hôm sau, lúc tôi dậy thì đã bảy giờ bốn mươi rồi.'
        },
        {
          start: 57.57,
          end: 59.45,
          en: 'I found that the alarm clock had not gone off.',
          zh: '我发现闹钟没有响。',
          pinyin: 'Wǒ fāxiàn nàozhōng méiyǒu xiǎng.',
          vi: 'Tôi phát hiện đồng hồ báo thức không reo.'
        },
        {
          start: 64.13,
          end: 73.11,
          en: 'It takes me at least forty minutes to get to the office. In the end I was still late.',
          zh: '我到公司，最快也要四十分钟。最后还是迟到了。',
          pinyin: 'Wǒ dào gōngsī, zuìkuài yě yào sìshífēnzhōng. Zuìhòu háishì chídào le.',
          vi: 'Tôi đến công ty, nhanh nhất cũng phải bốn mươi phút. Cuối cùng vẫn bị muộn.'
        },
        {
          start: 77.1,
          end: 80.54,
          en: 'After work, I had just got home when the alarm clock went off.',
          zh: '下班以后，刚到家，闹钟就响了。',
          pinyin: 'Xiàbān yǐhòu, gāng dào jiā, nàozhōng jiù xiǎng le.',
          vi: 'Tan ca xong, tôi vừa về đến nhà thì đồng hồ báo thức reo.'
        },
        {
          start: 84.87,
          end: 93.59,
          en: 'Time\'s up, time\'s up. I looked at my watch: exactly six o\'clock.',
          zh: '时间到了，时间到了。我看表，正好六点。',
          pinyin: 'Shíjiān dào le, shíjiān dào le. Wǒ kàn biǎo, zhènghǎo liùdiǎn.',
          vi: 'Đến giờ rồi, đến giờ rồi. Tôi xem đồng hồ, đúng sáu giờ.'
        },
        {
          start: 97.87,
          end: 100.67,
          en: 'It turned out I had set the time for six in the evening,',
          zh: '原来我把时间定在了下午六点，',
          pinyin: 'Yuánlái wǒ bǎ shíjiān dìng zài le xiàwǔ liùdiǎn,',
          vi: 'Thì ra tôi đã đặt giờ vào sáu giờ chiều,'
        },
        {
          start: 124.76,
          end: 128.5,
          en: 'There\'s a meeting at eight tomorrow morning, and I can\'t be late.',
          zh: '明天早上八点要开会，我不能迟到。',
          pinyin: 'Míngtiān zǎoshàng bādiǎn yào kāihuì, wǒ bùnéng chídào.',
          vi: 'Sáng mai tám giờ phải họp, tôi không thể đến muộn.'
        },
        {
          start: 132.79,
          end: 135.49,
          en: 'I bought a small alarm clock to wake me up.',
          zh: '我买了一个小闹钟，叫我起床。',
          pinyin: 'Wǒ mǎi le yígè xiǎo nàozhōng, jiào wǒ qǐchuáng.',
          vi: 'Tôi mua một chiếc đồng hồ báo thức nhỏ để gọi tôi dậy.'
        },
        {
          start: 157.95,
          end: 159.79,
          en: 'I found that the alarm clock had not gone off.',
          zh: '我发现闹钟没有响。',
          pinyin: 'Wǒ fāxiàn nàozhōng méiyǒu xiǎng.',
          vi: 'Tôi phát hiện đồng hồ báo thức không reo.'
        },
        {
          start: 165.01,
          end: 168.01,
          en: 'It takes me at least forty minutes to get to the office.',
          zh: '我到公司最快也要四十分钟。',
          pinyin: 'Wǒ dào gōngsī zuìkuài yě yào sìshífēnzhōng.',
          vi: 'Tôi đến công ty nhanh nhất cũng phải bốn mươi phút.'
        },
        {
          start: 172.31,
          end: 173.89,
          en: 'In the end I was still late.',
          zh: '最后还是迟到了。',
          pinyin: 'Zuìhòu háishì chídào le.',
          vi: 'Cuối cùng vẫn bị muộn.'
        },
        {
          start: 178,
          end: 181.32,
          en: 'After work, I had just got home when the alarm clock went off.',
          zh: '下班以后，刚到家，闹钟就响了。',
          pinyin: 'Xiàbān yǐhòu, gāng dào jiā, nàozhōng jiù xiǎng le.',
          vi: 'Tan ca xong, tôi vừa về đến nhà thì đồng hồ báo thức reo.'
        }
      ]
    },
    {
      id: 'ep-ps-jwsv_-hynt4',
      youtubeId: 'jwsV_-hYnt4',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '【LUYỆN ĐỌC TIẾNG TRUNG HSK3】去寺庙 - Đi chùa',
      titleVi: 'Đi chùa',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 168,
      durationLabel: '2:48',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 9 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/jwsV_-hYnt4.json',
      cuesCount: 9,
      cues: [
        {
          start: 17.28,
          end: 22.9,
          en: 'On the weekend my friend and I went to visit an ancient temple.',
          zh: '周末我和朋友去参观了一座古老的寺庙。',
          pinyin: 'Zhōumò wǒ hé péngyǒu qù cānguān le yīzuò gǔlǎo de sìmiào.',
          vi: 'Cuối tuần tôi và bạn bè đi tham quan một ngôi chùa cổ.'
        },
        {
          start: 26.81,
          end: 31.27,
          en: 'The temple is on the mountain; you have to climb many steps to get there.',
          zh: '寺庙在山上，要走很多台阶才能到。',
          pinyin: 'Sìmiào zài shānshàng, yào zǒu hěnduō táijiē cáinéng dào.',
          vi: 'Chùa ở trên núi, phải đi qua rất nhiều bậc thang mới đến.'
        },
        {
          start: 34.94,
          end: 38.38,
          en: 'Inside the temple it is very quiet, and there are many big trees.',
          zh: '寺院里很安静，有很多大树。',
          pinyin: 'Sìyuàn lǐ hěn ānjìng, yǒu hěnduō dàshù.',
          vi: 'Trong chùa rất yên tĩnh, có nhiều cây to.'
        },
        {
          start: 41.87,
          end: 47.57,
          en: 'I saw a very large Buddha statue, and some people were making wishes there.',
          zh: '我看到了一座很大的佛像，有些人在那里许愿。',
          pinyin: 'Wǒ kàndào le yīzuò hěndà de fóxiàng, yǒuxiē rén zài nàlǐ xǔyuàn.',
          vi: 'Tôi thấy một bức tượng Phật rất lớn, có vài người đang cầu nguyện ở đó.'
        },
        {
          start: 51.31,
          end: 62.08,
          en: 'Next to the temple there is a small shop selling lots of souvenirs; I bought a red bracelet,',
          zh: '寺院旁边有一个小店，卖很多纪念品，我买了一条红色的手绳，',
          pinyin: 'Sìyuàn pángbiān yǒu yígè xiǎodiàn, mài hěnduō jìniànpǐn, wǒ mǎi le yītiáo hóngsè de shǒu shéng,',
          vi: 'Cạnh chùa có một cửa hàng nhỏ bán nhiều đồ lưu niệm, tôi mua một chiếc vòng tay đỏ,'
        },
        {
          start: 62.58,
          end: 64.86,
          en: 'which they say brings good luck.',
          zh: '听说可以带来好运。',
          pinyin: 'Tīngshuō kěyǐ dàilái hǎoyùn.',
          vi: 'nghe nói có thể mang lại may mắn.'
        },
        {
          start: 126.78,
          end: 131.14,
          en: 'The temple is on the mountain; you have to climb many steps to get there.',
          zh: '寺庙在山上，要走很多台阶才能到。',
          pinyin: 'Sìmiào zài shānshàng, yào zǒu hěnduō táijiē cáinéng dào.',
          vi: 'Chùa ở trên núi, phải đi qua rất nhiều bậc thang mới đến.'
        },
        {
          start: 142.8,
          end: 147.4,
          en: 'Next to the temple there is a small shop selling lots of souvenirs.',
          zh: '寺庙旁边有一个小店，卖很多纪念品。',
          pinyin: 'Sìmiào pángbiān yǒu yígè xiǎodiàn, mài hěnduō jìniànpǐn.',
          vi: 'Cạnh chùa có một cửa hàng nhỏ bán nhiều đồ lưu niệm.'
        },
        {
          start: 148.16,
          end: 153.56,
          en: 'I bought a red bracelet, which they say brings good luck.',
          zh: '我买了一条红色的手绳，听说可以带来好运。',
          pinyin: 'Wǒ mǎi le yītiáo hóngsè de shǒu shéng, tīngshuō kěyǐ dàilái hǎoyùn.',
          vi: 'Tôi mua một chiếc vòng tay đỏ, nghe nói có thể mang lại may mắn.'
        }
      ]
    },
    {
      id: 'ep-ps-i4byr6b7eak',
      youtubeId: 'i4byr6B7Eak',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '【LUYỆN ĐỌC TIẾNG TRUNG HSK3】去洗衣店 - Đi tiệm giặt là',
      titleVi: 'Đi tiệm giặt là',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 167,
      durationLabel: '2:47',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 12 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/i4byr6B7Eak.json',
      cuesCount: 12,
      cues: [
        {
          start: 15.06,
          end: 19.66,
          en: 'I have a white shirt.',
          zh: '我有一件白色的衬衫',
          pinyin: 'Wǒ yǒu yījiàn báisè de chènshān',
          vi: 'Tôi có một chiếc áo sơ mi trắng.'
        },
        {
          start: 23.16,
          end: 25.68,
          en: 'Last week, while drinking coffee,',
          zh: '上个星期喝咖啡的时候',
          pinyin: 'Shànggèxīngqī hēkāfēi de shíhòu',
          vi: 'Tuần trước, lúc uống cà phê,'
        },
        {
          start: 28.56,
          end: 30.92,
          en: 'I accidentally got it dirty.',
          zh: '我不小心把它弄脏了',
          pinyin: 'Wǒ bù xiǎoxīn bǎ tā nòngzāngle',
          vi: 'tôi không cẩn thận làm bẩn nó.'
        },
        {
          start: 33.32,
          end: 38.24,
          en: 'I washed it at home several times, but it never came clean.',
          zh: '我在家里洗了好几次但是都没洗干净',
          pinyin: 'Wǒ zài jiālǐ xǐ le hǎo jǐcì dànshì dōu méixǐ gānjìng',
          vi: 'Tôi giặt ở nhà mấy lần nhưng đều không sạch.'
        },
        {
          start: 40.7,
          end: 44.24,
          en: 'So this morning I went to the laundry.',
          zh: '所以今天早上我去了洗衣店。',
          pinyin: 'Suǒyǐ jīntiān zǎoshàng wǒ qù le xǐyīdiàn.',
          vi: 'Nên sáng nay tôi đã đến tiệm giặt là.'
        },
        {
          start: 47.44,
          end: 52.2,
          en: 'The laundry staff had a look and said he had a way to get it clean.',
          zh: '洗衣店的员工看了一下，说他有办法洗干净。',
          pinyin: 'Xǐyīdiàn de yuángōng kàn le yīxià, shuō tā yǒu bànfǎ xǐ gānjìng.',
          vi: 'Nhân viên tiệm giặt xem qua rồi nói anh ấy có cách giặt sạch.'
        },
        {
          start: 55.64,
          end: 61.4,
          en: 'He told me it costs thirty yuan to wash one item, and he also gave me a slip of paper.',
          zh: '他告诉我，洗一件衣服要三十块钱，还给我一张纸。',
          pinyin: 'Tā gàosù wǒ, xǐ yījiàn yīfú yào sānshíkuài qián, huángěi wǒ yīzhāng zhǐ.',
          vi: 'Anh ấy nói với tôi, giặt một bộ quần áo là ba mươi tệ, và còn đưa tôi một tờ giấy.'
        },
        {
          start: 65.12,
          end: 68.24,
          en: 'It said on it: come pick up the clothes on Friday.',
          zh: '上面写着，星期五来拿衣服。',
          pinyin: 'Shàngmiàn xiě zhe, xīngqīwǔ lái ná yīfú.',
          vi: 'Trên đó viết: thứ Sáu đến lấy đồ.'
        },
        {
          start: 119.47,
          end: 127.48,
          en: 'I have a white shirt. Last week, while drinking coffee, I accidentally got it dirty.',
          zh: '我有一件白色的衬衫。上个星期喝咖啡的时候，我不小心把它弄脏了。',
          pinyin: 'Wǒ yǒu yījiàn báisè de chènshān. Shànggèxīngqī hēkāfēi de shíhòu, wǒ bù xiǎoxīn bǎ tā nòngzāngle.',
          vi: 'Tôi có một chiếc áo sơ mi trắng. Tuần trước, lúc uống cà phê, tôi không cẩn thận làm bẩn nó.'
        },
        {
          start: 128.27,
          end: 132.71,
          en: 'I washed it at home several times, but it never came clean.',
          zh: '我在家里洗了好几次，但是都没洗干净。',
          pinyin: 'Wǒ zài jiālǐ xǐ le hǎo jǐcì, dànshì dōu méixǐ gānjìng.',
          vi: 'Tôi giặt ở nhà mấy lần, nhưng đều không sạch.'
        },
        {
          start: 133.44,
          end: 142.23,
          en: 'So this morning I went to the laundry. The staff had a look and said he had a way to get it clean.',
          zh: '所以今天早上我去了洗衣店。洗衣店的员工看了一下，说他有办法洗干净。',
          pinyin: 'Suǒyǐ jīntiān zǎoshàng wǒ qù le xǐyīdiàn. Xǐyīdiàn de yuángōng kàn le yīxià, shuō tā yǒu bànfǎ xǐ gānjìng.',
          vi: 'Nên sáng nay tôi đã đến tiệm giặt là. Nhân viên tiệm xem qua rồi nói anh ấy có cách giặt sạch.'
        },
        {
          start: 142.23,
          end: 152.6,
          en: 'He told me it costs thirty yuan to wash one item, and gave me a slip of paper that said to come pick it up on Friday.',
          zh: '他告诉我，洗一件衣服要三十块钱，还给我一张纸，上面写着星期五来拿衣服。',
          pinyin: 'Tā gàosù wǒ, xǐ yījiàn yīfú yào sānshíkuài qián, huángěi wǒ yīzhāng zhǐ, shàngmiàn xiě zhe xīngqīwǔ lái ná yīfú.',
          vi: 'Anh ấy nói giặt một bộ quần áo là ba mươi tệ, và đưa tôi một tờ giấy, trên đó viết thứ Sáu đến lấy đồ.'
        }
      ]
    },
    {
      id: 'ep-ps-ols4rakp7ro',
      youtubeId: 'oLs4RakP7ro',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '【LUYỆN ĐỌC TIẾNG TRUNG HSK3】朋友聚会 - Tụ tập bạn bè',
      titleVi: 'Tụ tập bạn bè',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 145,
      durationLabel: '2:25',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 9 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/oLs4RakP7ro.json',
      cuesCount: 9,
      cues: [
        {
          start: 15.3,
          end: 23.04,
          en: 'Yesterday I met up with a few good friends at a café.',
          zh: '昨天，我和几个好朋友在一家咖啡馆聚会',
          pinyin: 'Zuótiān, wǒ hé jǐgè hǎo péngyǒu zài yījiā kāfēiguǎn jùhuì',
          vi: 'Hôm qua, tôi và mấy người bạn thân gặp nhau ở một quán cà phê.'
        },
        {
          start: 27,
          end: 32.26,
          en: 'We chatted together and shared how our lives and work have been lately.',
          zh: '我们一起聊天，分享最近的生活和工作',
          pinyin: 'Wǒmen yìqǐ liáotiān, fēnxiǎng zuìjìn de shēnghuó hé gōngzuò',
          vi: 'Chúng tôi cùng trò chuyện, chia sẻ về cuộc sống và công việc gần đây.'
        },
        {
          start: 36.56,
          end: 38.9,
          en: 'Some of them are getting ready to marry.',
          zh: '有的人准备结婚了',
          pinyin: 'Yǒu de rén zhǔnbèi jiéhūn le',
          vi: 'Có người đang chuẩn bị kết hôn.'
        },
        {
          start: 42.16,
          end: 45.28,
          en: 'Some of them have found new jobs.',
          zh: '有的人找到了新工作。',
          pinyin: 'Yǒu de rén zhǎodào le xīn gōngzuò.',
          vi: 'Có người đã tìm được việc mới.'
        },
        {
          start: 49.28,
          end: 54.88,
          en: 'Hearing that everyone\'s life is going well, I felt very happy.',
          zh: '听到大家的生活都挺好的，我感到非常高兴。',
          pinyin: 'Tīngdào dàjiā de shēnghuó dōu tǐng hǎo de, wǒ gǎndào fēichánggāoxìng.',
          vi: 'Nghe thấy cuộc sống của mọi người đều khá tốt, tôi thấy rất vui.'
        },
        {
          start: 103.41,
          end: 111.6,
          en: 'Yesterday I met up with a few good friends at a café.',
          zh: '昨天，我和几个好朋友在一家咖啡馆聚会。',
          pinyin: 'Zuótiān, wǒ hé jǐgè hǎo péngyǒu zài yījiā kāfēiguǎn jùhuì.',
          vi: 'Hôm qua, tôi và mấy người bạn thân gặp nhau ở một quán cà phê.'
        },
        {
          start: 112.32,
          end: 117.52,
          en: 'We chatted together and shared how our lives and work have been lately.',
          zh: '我们一起聊天，分享最近的生活和工作。',
          pinyin: 'Wǒmen yìqǐ liáotiān, fēnxiǎng zuìjìn de shēnghuó hé gōngzuò.',
          vi: 'Chúng tôi cùng trò chuyện, chia sẻ về cuộc sống và công việc gần đây.'
        },
        {
          start: 118.4,
          end: 123.56,
          en: 'Some are getting ready to marry, and some have found new jobs.',
          zh: '有的人准备结婚了，有的人找到了新工作。',
          pinyin: 'Yǒu de rén zhǔnbèi jiéhūn le, yǒu de rén zhǎodào le xīn gōngzuò.',
          vi: 'Có người đang chuẩn bị kết hôn, có người đã tìm được việc mới.'
        },
        {
          start: 123.56,
          end: 129.85,
          en: 'Hearing that everyone\'s life is going well, I felt very happy.',
          zh: '听到大家的生活都挺好的，我感到非常高兴。',
          pinyin: 'Tīngdào dàjiā de shēnghuó dōu tǐng hǎo de, wǒ gǎndào fēichánggāoxìng.',
          vi: 'Nghe thấy cuộc sống của mọi người đều khá tốt, tôi thấy rất vui.'
        }
      ]
    },
    {
      id: 'ep-ps-unrhyexwiwe',
      youtubeId: 'UnRHYEXWIWE',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '【LUYỆN ĐỌC TIẾNG TRUNG HSK3】点外卖 - Đặt đồ ăn ngoài',
      titleVi: 'Đặt đồ ăn ngoài',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 154,
      durationLabel: '2:34',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 8 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/UnRHYEXWIWE.json',
      cuesCount: 8,
      cues: [
        {
          start: 15.2,
          end: 20.03,
          en: 'Tonight I don\'t want to cook.',
          zh: '今天晚上我不想做饭。',
          pinyin: 'Jīntiān wǎnshàng wǒ bùxiǎng zuòfàn.',
          vi: 'Tối nay tôi không muốn nấu ăn.'
        },
        {
          start: 23.33,
          end: 26.25,
          en: 'So I used my phone to order a takeout meal.',
          zh: '所以，我用手机点了一份外卖。',
          pinyin: 'Suǒyǐ, wǒ yòng shǒujī diǎn le yīfèn wàimài.',
          vi: 'Nên tôi dùng điện thoại đặt một phần đồ ăn giao tận nơi.'
        },
        {
          start: 29.95,
          end: 35.27,
          en: 'I chose a chicken rice and a milk tea. Thirty yuan in total.',
          zh: '我选了一份鸡肉饭和一杯奶茶。一共三十块钱。',
          pinyin: 'Wǒ xuǎn le yīfèn jīròufàn hé yībēi nǎichá. Yīgòng sānshíkuài qián.',
          vi: 'Tôi chọn một phần cơm gà và một cốc trà sữa. Tổng cộng ba mươi tệ.'
        },
        {
          start: 38.99,
          end: 49.8,
          en: 'The delivery person came very quickly — it arrived in half an hour. The rice was tasty and the milk tea was good too.',
          zh: '送外卖的人来得很快。半个小时就到了，饭很好吃，奶茶也很好喝。',
          pinyin: 'Sòng wàimài de rén láide hěnkuài. Bàngè xiǎoshí jiù dào le, fàn hěn hǎochī, nǎichá yě hěn hǎohē.',
          vi: 'Người giao hàng đến rất nhanh. Nửa tiếng là tới, cơm rất ngon, trà sữa cũng rất ngon.'
        },
        {
          start: 53.85,
          end: 56.73,
          en: 'I think ordering takeout is really very convenient.',
          zh: '我觉得点外卖真的非常方便。',
          pinyin: 'Wǒ juéde diǎn wàimài zhēnde fēicháng fāngbiàn.',
          vi: 'Tôi thấy đặt đồ ăn giao tận nơi thật sự rất tiện.'
        },
        {
          start: 114.41,
          end: 123.51,
          en: 'Tonight I didn\'t want to cook, so I used my phone to order a takeaway meal. I chose a chicken rice and a',
          zh: '今天晚上我不想做饭所以我用手机点了一份外卖我选了一份鸡肉饭和一杯',
          pinyin: 'Jīntiān wǎnshàng wǒ bùxiǎng zuòfàn suǒyǐ wǒ yòng shǒujī diǎn le yīfèn wàimài wǒ xuǎn le yīfèn jīròufàn hé yībēi',
          vi: 'Tối nay tôi không muốn nấu ăn, nên tôi dùng điện thoại đặt một phần đồ ăn giao tận nơi. Tôi chọn một phần cơm gà và một'
        },
        {
          start: 123.51,
          end: 132.47,
          en: 'milk tea, thirty yuan in total. The delivery person came very quickly — it arrived in half an hour, the rice was tasty,',
          zh: '奶茶一共三十块钱送外卖的人来得很快半个小时就到了饭很好吃，',
          pinyin: 'Nǎichá yīgòng sānshíkuài qián sòng wàimài de rén láide hěnkuài bàngè xiǎoshí jiù dào le fàn hěn hǎochī,',
          vi: 'cốc trà sữa, tổng cộng ba mươi tệ. Người giao hàng đến rất nhanh, nửa tiếng là tới, cơm rất ngon,'
        },
        {
          start: 132.89,
          end: 137.93,
          en: 'and the milk tea was good too. I think ordering takeout is really very convenient.',
          zh: '奶茶也很好喝。我觉得点外卖真的非常方便。',
          pinyin: 'Nǎichá yě hěn hǎohē. Wǒ juéde diǎn wàimài zhēnde fēicháng fāngbiàn.',
          vi: 'trà sữa cũng rất ngon. Tôi thấy đặt đồ ăn giao tận nơi thật sự rất tiện.'
        }
      ]
    },
    {
      id: 'ep-ps-t4xs_6knnpq',
      youtubeId: 't4xs_6knnpQ',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '【LUYỆN ĐỌC TIẾNG TRUNG HSK3】讲故事 - Kể chuyện',
      titleVi: 'Kể chuyện',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 156,
      durationLabel: '2:36',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 8 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/t4xs_6knnpQ.json',
      cuesCount: 8,
      cues: [
        {
          start: 15.24,
          end: 21.1,
          en: 'I have a daughter who is nine this year.',
          zh: '我有一个女儿，今年九岁了。',
          pinyin: 'Wǒ yǒu yígè nǚr, jīnnián jiǔsuì le.',
          vi: 'Tôi có một cô con gái, năm nay chín tuổi.'
        },
        {
          start: 24.2,
          end: 26.28,
          en: 'She really likes listening to stories.',
          zh: '她很喜欢听故事。',
          pinyin: 'Tā hěn xǐhuān tīng gùshì.',
          vi: 'Cô bé rất thích nghe kể chuyện.'
        },
        {
          start: 29.16,
          end: 34.8,
          en: 'So every night before bed, I tell her a story.',
          zh: '所以每天晚上睡觉前，我都会给她讲故事。',
          pinyin: 'Suǒyǐ měitiānwǎnshàng shuìjiào qián, wǒ dōu huì gěi tā jiǎnggùshì.',
          vi: 'Nên mỗi tối trước khi ngủ, tôi đều kể chuyện cho cô bé.'
        },
        {
          start: 37.71,
          end: 49.39,
          en: 'I often pick a few very interesting stories, such as The Little Prince and Snow White.',
          zh: '我常常选几个很有趣的故事，比如小王子、白雪公主。',
          pinyin: 'Wǒ chángcháng xuǎn jǐgè hěn yǒuqù de gùshì, bǐrú xiǎowángzǐ, báixuěgōngzhǔ.',
          vi: 'Tôi thường chọn vài câu chuyện rất thú vị, ví dụ như Hoàng tử bé, Bạch Tuyết.'
        },
        {
          start: 53.34,
          end: 60.02,
          en: 'After each story she is always very happy, and then she falls asleep quietly.',
          zh: '每次听完故事，她总是很开心，然后安静地睡觉。',
          pinyin: 'Měicì tīng wán gùshì, tā zǒngshì hěn kāixīn, ránhòu ānjìng dì shuìjiào.',
          vi: 'Lần nào nghe xong, cô bé cũng rất vui, rồi ngủ yên.'
        },
        {
          start: 109.1,
          end: 122.74,
          en: 'I have a daughter who is nine this year. She really likes listening to stories, so every night before bed I',
          zh: '我有一个女儿，今年九岁了，她很喜欢听故事，所以每天晚上睡觉前我都会给她',
          pinyin: 'Wǒ yǒu yígè nǚr, jīnnián jiǔsuì le, tā hěn xǐhuān tīng gùshì, suǒyǐ měitiānwǎnshàng shuìjiào qián wǒ dōu huì gěi tā',
          vi: 'Tôi có một cô con gái, năm nay chín tuổi, cô bé rất thích nghe kể chuyện, nên mỗi tối trước khi ngủ tôi đều'
        },
        {
          start: 122.74,
          end: 133.16,
          en: 'tell her a story. I often pick a few very interesting stories, such as The Little Prince and Snow White.',
          zh: '讲故事。我常常选几个很有趣的故事，比如小王子、白雪公主。',
          pinyin: 'Jiǎnggùshì. Wǒ chángcháng xuǎn jǐgè hěn yǒuqù de gùshì, bǐrú xiǎowángzǐ, báixuěgōngzhǔ.',
          vi: 'kể chuyện cho cô bé. Tôi thường chọn vài câu chuyện rất thú vị, ví dụ như Hoàng tử bé, Bạch Tuyết.'
        },
        {
          start: 134.29,
          end: 140.89,
          en: 'After each story she is always very happy, and then she falls asleep quietly.',
          zh: '每次听完故事，她总是很开心，然后安静地睡觉。',
          pinyin: 'Měicì tīng wán gùshì, tā zǒngshì hěn kāixīn, ránhòu ānjìng dì shuìjiào.',
          vi: 'Lần nào nghe xong, cô bé cũng rất vui, rồi ngủ yên.'
        }
      ]
    },
    {
      id: 'ep-ps-q-sbgg7ujvy',
      youtubeId: 'Q-sbgg7UJvY',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '【LUYỆN ĐỌC TIẾNG TRUNG HSK3】好消息 - Tin vui',
      titleVi: 'Tin vui',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 152,
      durationLabel: '2:32',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 10 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Q-sbgg7UJvY.json',
      cuesCount: 10,
      cues: [
        {
          start: 17.76,
          end: 20,
          en: 'Today the manager told me some good news.',
          zh: '今天经理告诉我一个好消息。',
          pinyin: 'Jīn tiān jīng lǐ gào sù wǒ yí gè hǎo xiāo xī。',
          vi: 'Hôm nay giám đốc báo cho tôi một tin tốt.'
        },
        {
          start: 23.52,
          end: 26.7,
          en: 'Next month the company is going to send me to Beijing to work for six months.',
          zh: '下个月公司要派我去北京工作半年。',
          pinyin: 'Xià gè yuè gōng sī yào pài wǒ qù běi jīng gōng zuò bàn nián。',
          vi: 'Tháng sau công ty sẽ cử tôi đến Bắc Kinh làm việc nửa năm.'
        },
        {
          start: 30.28,
          end: 32.62,
          en: 'When I heard this news, I was very happy.',
          zh: '听到这个消息，我非常开心。',
          pinyin: 'Tīng dào zhè ge xiāo xī， wǒ fēi cháng kāi xīn。',
          vi: 'Nghe được tin này, tôi rất vui.'
        }
      ]
    },
    {
      id: 'ep-ps-mugsqh1amrq',
      youtubeId: 'mUgSQh1amrQ',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: '【LUYỆN ĐỌC TIẾNG TRUNG HSK2】请假 - Xin nghỉ',
      titleVi: 'Xin nghỉ',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 155,
      durationLabel: '2:35',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 15 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/mUgSQh1amrQ.json',
      cuesCount: 15,
      cues: [
        {
          start: 17.66,
          end: 25.48,
          en: 'When I got up this morning, I felt unwell.',
          zh: '今天早上起床的时候,我觉得身体不舒服。',
          pinyin: 'Jīn tiān zǎo shàng qǐ chuáng de shí hòu, wǒ jué de shēn tǐ bù shū fú。',
          vi: 'Sáng nay khi ngủ dậy, tôi thấy trong người không được khỏe.'
        },
        {
          start: 28.02,
          end: 32.84,
          en: 'I was a bit dizzy and couldn\'t go to work.',
          zh: '头有点晕,不能去上班。',
          pinyin: 'Tóu yǒu diǎn yūn, bù néng qù shàng bān。',
          vi: 'Đầu hơi choáng váng, không thể đi làm được.'
        },
        {
          start: 35.66,
          end: 42.18,
          en: 'I called my boss and asked for a day off.',
          zh: '我给老板打了一个电话,请了一天假。',
          pinyin: 'Wǒ gěi lǎo bǎn dǎ le yí gè diàn huà, qǐng le yì tiān jiǎ。',
          vi: 'Tôi đã gọi điện cho sếp xin nghỉ một ngày.'
        }
      ]
    },
    {
      id: 'ep-ps-xlss21i229o',
      youtubeId: 'XLss21i229o',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: '【LUYỆN ĐỌC TIẾNG TRUNG HSK2】租房子 - Thuê nhà',
      titleVi: 'Thuê nhà',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 161,
      durationLabel: '2:41',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 10 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/XLss21i229o.json',
      cuesCount: 10,
      cues: [
        {
          start: 15.2,
          end: 21.3,
          en: 'I want to rent a house near the company.',
          zh: '我想在公司附近租一个房子。',
          pinyin: 'Wǒ xiǎng zài gōng sī fù jìn zū yí gè fáng zi。',
          vi: 'Tôi muốn thuê một căn nhà gần công ty.'
        },
        {
          start: 24.5,
          end: 26.24,
          en: 'The house doesn\'t need to be very big.',
          zh: '房子不用很大。',
          pinyin: 'Fáng zi bú yòng hěn dà。',
          vi: 'Căn nhà không cần phải lớn.'
        },
        {
          start: 26.72,
          end: 29.64,
          en: 'But it must be clean and quiet.',
          zh: '但一定要干净和安静。',
          pinyin: 'Dàn yí dìng yào gān jìng hé ān jìng。',
          vi: 'Nhưng nhất định phải sạch sẽ và yên tĩnh.'
        }
      ]
    },
    {
      id: 'ep-ps-td0ldj74thk',
      youtubeId: 'td0lDj74THk',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: '【LUYỆN ĐỌC TIẾNG TRUNG HSK2】坐地铁 - Đi tàu điện ngầm',
      titleVi: 'Đi tàu điện ngầm',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 146,
      durationLabel: '2:26',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 13 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/td0lDj74THk.json',
      cuesCount: 13,
      cues: [
        {
          start: 14.42,
          end: 22.42,
          en: 'Now many people take the subway to go to work or school.',
          zh: '现在很多人坐地铁去上班或者上学',
          pinyin: 'Xiàn zài hěn duō rén zuò dì tiě qù shàng bān huò zhě shàng xué',
          vi: 'Bây giờ rất nhiều người đi tàu điện ngầm để đi làm hoặc đi học.'
        },
        {
          start: 26.72,
          end: 28.62,
          en: 'The subway station is not far from my home.',
          zh: '地铁站离我家不远',
          pinyin: 'Dì tiě zhàn lí wǒ jiā bù yuǎn',
          vi: 'Ga tàu điện ngầm cách nhà tôi không xa.'
        },
        {
          start: 32.34,
          end: 35.8,
          en: 'So I take the subway to work every day.',
          zh: '所以我每天都坐地铁去上班',
          pinyin: 'Suǒ yǐ wǒ měi tiān dōu zuò dì tiě qù shàng bān',
          vi: 'Vì vậy ngày nào tôi cũng đi tàu điện ngầm để đi làm.'
        }
      ]
    },
    {
      id: 'ep-ps-jippbnupmow',
      youtubeId: 'JIpPbnuPMow',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: '【LUYỆN ĐỌC TIẾNG TRUNG HSK2】去银行 - Đi ngân hàng',
      titleVi: 'Đi ngân hàng',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 146,
      durationLabel: '2:26',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 15 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/JIpPbnuPMow.json',
      cuesCount: 15,
      cues: [
        {
          start: 18.8,
          end: 19.76,
          en: 'I went to the bank.',
          zh: '我去银行',
          pinyin: 'Wǒ qù yín háng',
          vi: 'Tôi đi ngân hàng.'
        },
        {
          start: 19.84,
          end: 21.32,
          en: 'withdrew some money.',
          zh: '取了一些钱',
          pinyin: 'Qǔ le yì xiē qián',
          vi: 'rút một ít tiền.'
        },
        {
          start: 25.6,
          end: 27.52,
          en: 'because this month\'s salary',
          zh: '因为这个月的工资',
          pinyin: 'Yīn wèi zhè ge yuè de gōng zī',
          vi: 'vì tiền lương tháng này'
        }
      ]
    },
    {
      id: 'ep-ps-u1t_bx9c5zq',
      youtubeId: 'U1T_BX9C5zQ',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: '【LUYỆN ĐỌC TIẾNG TRUNG HSK2】越南妇女节 - Ngày Phụ nữ Việt Nam',
      titleVi: 'Ngày Phụ nữ Việt Nam',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 155,
      durationLabel: '2:35',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 15 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/U1T_BX9C5zQ.json',
      cuesCount: 15,
      cues: [
        {
          start: 17.28,
          end: 21.88,
          en: 'Today is October 20, and it is also Vietnamese Women\'s Day.',
          zh: '今天是月日，也是越南妇女节',
          pinyin: 'Jīn tiān shì yuè rì， yě shì yuè nán fù nǚ jié',
          vi: 'Hôm nay là ngày 20 tháng 10, cũng là Ngày Phụ nữ Việt Nam.'
        },
        {
          start: 25.98,
          end: 31.48,
          en: 'After work, I went to the store and bought a beautiful dress for my wife.',
          zh: '下班以后，我去商店给妻子买了一条漂亮的裙子',
          pinyin: 'Xià bān yǐ hòu， wǒ qù shāng diàn gěi qī zǐ mǎi le yì tiáo piào liang de qún zǐ',
          vi: 'Sau khi tan làm, tôi đến cửa hàng mua cho vợ một chiếc váy rất đẹp.'
        },
        {
          start: 35.68,
          end: 38.52,
          en: 'I also bought a book for my daughter.',
          zh: '我还给女儿买了一本书',
          pinyin: 'Wǒ hái gěi nǚ ér mǎi le yì běn shū',
          vi: 'Tôi cũng mua cho con gái một quyển sách.'
        }
      ]
    },
    {
      id: 'ep-ps-boqzgbweaoe',
      youtubeId: 'bOqZgbwEaOE',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: '【LUYỆN ĐỌC TIẾNG TRUNG HSK2】开会 - Họp',
      titleVi: 'Họp',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 156,
      durationLabel: '2:36',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 17 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/bOqZgbwEaOE.json',
      cuesCount: 17,
      cues: [
        {
          start: 16.9,
          end: 19.44,
          en: 'I have a meeting this afternoon.',
          zh: '今天下午我要开会',
          pinyin: 'Jīn tiān xià wǔ wǒ yào kāi huì',
          vi: 'Chiều nay tôi phải họp.'
        },
        {
          start: 23.58,
          end: 27.8,
          en: 'This meeting is very important, so I can\'t be late.',
          zh: '这个会议很重要，所以我不能迟到',
          pinyin: 'Zhè ge huì yì hěn zhòng yào， suǒ yǐ wǒ bù néng chí dào',
          vi: 'Cuộc họp này rất quan trọng, nên tôi không thể đến muộn.'
        },
        {
          start: 32.38,
          end: 36.52,
          en: 'The meeting starts at 3:30 p.m. in the conference room on the fourth floor.',
          zh: '会议下午三点半开始，在四楼的会议室。',
          pinyin: 'Huì yì xià wǔ sān diǎn bàn kāi shǐ， zài sì lóu de huì yì shì。',
          vi: 'Cuộc họp bắt đầu lúc ba giờ rưỡi chiều, ở phòng họp tầng bốn.'
        }
      ]
    },
    {
      id: 'ep-ps-andr2hizlsm',
      youtubeId: 'Andr2hizLSM',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: '【LUYỆN ĐỌC TIẾNG TRUNG HSK2】关心父母 - Quan tâm cha mẹ',
      titleVi: 'Quan tâm cha mẹ',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 156,
      durationLabel: '2:36',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 19 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Andr2hizLSM.json',
      cuesCount: 19,
      cues: [
        {
          start: 16.92,
          end: 20.02,
          en: 'I rest at home every weekend.',
          zh: '我每个周末都在家休息。',
          pinyin: 'Wǒ měi gè zhōu mò dōu zài jiā xiū xi。',
          vi: 'Mỗi cuối tuần tôi đều nghỉ ngơi ở nhà.'
        },
        {
          start: 24.36,
          end: 25.28,
          en: 'At this time,',
          zh: '这个时候，',
          pinyin: 'Zhè ge shí hòu，',
          vi: 'Lúc này,'
        },
        {
          start: 25.66,
          end: 27.72,
          en: 'I always call my parents.',
          zh: '我都会给父母打电话。',
          pinyin: 'Wǒ dōu huì gěi fù mǔ dǎ diàn huà。',
          vi: 'Tôi đều gọi điện cho bố mẹ.'
        }
      ]
    },
    {
      id: 'ep-ps-ivhnb4d26fw',
      youtubeId: 'IVhnb4d26Fw',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: '【LUYỆN ĐỌC TIẾNG TRUNG HSK2】上网 - Lên mạng',
      titleVi: 'Lên mạng',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 154,
      durationLabel: '2:34',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 18 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/IVhnb4d26Fw.json',
      cuesCount: 18,
      cues: [
        {
          start: 11.26,
          end: 21.04,
          en: 'Xiaohong goes online at home every day after work.',
          zh: '小红每天下班后都会在家上网',
          pinyin: 'Xiǎo hóng měi tiān xià bān hòu dōu huì zài jiā shàng wǎng',
          vi: 'Tiểu Hồng sau khi tan làm mỗi ngày đều lên mạng ở nhà.'
        },
        {
          start: 24.5,
          end: 27.28,
          en: 'She likes to go online to chat with friends.',
          zh: '她喜欢上网跟朋友聊天',
          pinyin: 'Tā xǐ huan shàng wǎng gēn péng yǒu liáo tiān',
          vi: 'Cô ấy thích lên mạng trò chuyện với bạn bè.'
        },
        {
          start: 27.96,
          end: 28.5,
          en: 'Listen to music.',
          zh: '听音乐',
          pinyin: 'Tīng yīn yuè',
          vi: 'Nghe nhạc.'
        }
      ]
    },
    {
      id: 'ep-ps-z42yqpoit6k',
      youtubeId: 'Z42YqpoIT6k',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: '【LUYỆN ĐỌC TIẾNG TRUNG HSK2】看牙医 - Khám nha sĩ',
      titleVi: 'Khám nha sĩ',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 160,
      durationLabel: '2:40',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 15 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Z42YqpoIT6k.json',
      cuesCount: 15,
      cues: [
        {
          start: 18.9,
          end: 21.26,
          en: 'My tooth has been hurting for three days.',
          zh: '我的牙疼了三天。',
          pinyin: 'Wǒ de yá téng le sān tiān。',
          vi: 'Tôi bị đau răng đã ba ngày rồi.'
        },
        {
          start: 24.62,
          end: 27.94,
          en: 'It hurts more when I eat or drink cold water.',
          zh: '吃东西喝冷水的时候更疼。',
          pinyin: 'Chī dōng xī hē lěng shuǐ de shí hòu gèng téng。',
          vi: 'Khi ăn hoặc uống nước lạnh thì đau hơn.'
        },
        {
          start: 31.38,
          end: 36.62,
          en: 'This morning I went to the hospital to see the dentist.',
          zh: '今天早上我去医院看了牙医。',
          pinyin: 'Jīn tiān zǎo shàng wǒ qù yī yuàn kàn le yá yī。',
          vi: 'Sáng nay tôi đến bệnh viện khám nha sĩ.'
        }
      ]
    },
    {
      id: 'ep-ps-b9tqaqiij3o',
      youtubeId: 'B9tQaqIIj3o',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: '【LUYỆN ĐỌC TIẾNG TRUNG HSK2】理发 - Cắt tóc',
      titleVi: 'Cắt tóc',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 136,
      durationLabel: '2:16',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 11 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/B9tQaqIIj3o.json',
      cuesCount: 11,
      cues: [
        {
          start: 18.74,
          end: 20.88,
          en: 'My hair is too long.',
          zh: '我的头发太长了。',
          pinyin: 'Wǒ de tóu fa tài cháng le。',
          vi: 'Tóc của tôi dài quá.'
        },
        {
          start: 24.12,
          end: 26.12,
          en: 'Today I go to the barbershop.',
          zh: '今天去理发店。',
          pinyin: 'Jīn tiān qù lǐ fā diàn。',
          vi: 'Hôm nay tôi đến tiệm cắt tóc.'
        },
        {
          start: 26.78,
          end: 27.7,
          en: 'Cut it a bit shorter.',
          zh: '剪短了一点。',
          pinyin: 'Jiǎn duǎn le yì diǎn。',
          vi: 'Đã cắt ngắn lại một chút.'
        }
      ]
    },
    {
      id: 'ep-ps-bonz-aqa3jg',
      youtubeId: 'boNZ-Aqa3Jg',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Miêu tả con trai - LUYỆN ĐỌC TIẾNG TRUNG HSK 3',
      titleVi: 'Miêu tả con trai',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 170,
      durationLabel: '2:50',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 16 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/boNZ-Aqa3Jg.json',
      cuesCount: 16,
      cues: [
        {
          start: 13.96,
          end: 19.82,
          en: 'My son is a fifth-grade elementary school student.',
          zh: '我的儿子是小学五年级的学生',
          pinyin: 'Wǒ de ér zi shì xiǎo xué wǔ nián jí de xué shēng',
          vi: 'Con trai tôi là học sinh lớp năm tiểu học.'
        },
        {
          start: 22.5,
          end: 25.44,
          en: 'He is much taller than most children his age.',
          zh: '他的个子比一般小朋友高得多',
          pinyin: 'Tā de gè zi bǐ yì bān xiǎo péng yǒu gāo dé duō',
          vi: 'Nó cao hơn hẳn các bạn nhỏ cùng tuổi.'
        },
        {
          start: 27.8,
          end: 30.02,
          en: 'and his skin is fairer than most kids.',
          zh: '也比一般小朋友长得白',
          pinyin: 'Yě bǐ yì bān xiǎo péng yǒu cháng dé bái',
          vi: 'và da cũng trắng hơn các bạn nhỏ khác.'
        }
      ]
    },
    {
      id: 'ep-ps-enw9iuaayt4',
      youtubeId: 'Enw9IuaaYT4',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Miêu tả mẹ - LUYỆN ĐỌC TIẾNG TRUNG HSK 3',
      titleVi: 'Miêu tả mẹ',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 192,
      durationLabel: '3:12',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 15 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Enw9IuaaYT4.json',
      cuesCount: 15,
      cues: [
        {
          start: 9.46,
          end: 19.04,
          en: 'My mother is about 1.65 meters tall.',
          zh: '我的妈妈一米六五左右',
          pinyin: 'Wǒ de mā ma yì mǐ liù wǔ zuǒ yòu',
          vi: 'Mẹ tôi cao khoảng 1m65.'
        },
        {
          start: 22.14,
          end: 23.46,
          en: 'She is neither fat nor thin.',
          zh: '不胖也不瘦',
          pinyin: 'Bú pàng yě bú shòu',
          vi: 'không béo cũng không gầy.'
        },
        {
          start: 27.1,
          end: 29.32,
          en: 'She has a pair of big eyes.',
          zh: '她长着一双大大的眼睛',
          pinyin: 'Tā cháng zhe yì shuāng dà dà de yǎn jīng',
          vi: 'Mẹ tôi có một đôi mắt to.'
        }
      ]
    },
    {
      id: 'ep-ps-rwofxvj-17w',
      youtubeId: 'rwoFXvj-17w',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Cách học tiếng Trung - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Cách học tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 215,
      durationLabel: '3:35',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 13 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/rwoFXvj-17w.json',
      cuesCount: 13,
      cues: [
        {
          start: 19.86,
          end: 22.64,
          en: 'Chinese is very important for my work.',
          zh: '汉语对我工作很重要。',
          pinyin: 'Hàn yǔ duì wǒ gōng zuò hěn zhòng yào。',
          vi: 'Tiếng Trung rất quan trọng đối với công việc của tôi.'
        },
        {
          start: 24.9,
          end: 27.78,
          en: 'So, I am now studying Chinese very hard.',
          zh: '所以，我现在很努力学习汉语。',
          pinyin: 'Suǒ yǐ， wǒ xiàn zài hěn nǔ lì xué xí hàn yǔ。',
          vi: 'Vì vậy, bây giờ tôi đang rất chăm chỉ học tiếng Trung.'
        },
        {
          start: 30.04,
          end: 32.76,
          en: 'How can we learn Chinese well?',
          zh: '我们怎样才能学好汉语呢？',
          pinyin: 'Wǒ men zěn yàng cái néng xué hǎo hàn yǔ ne？',
          vi: 'Làm thế nào chúng ta có thể học tốt tiếng Trung?'
        }
      ]
    },
    {
      id: 'ep-ps-_7ud0likfes',
      youtubeId: '_7uD0lIkfes',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Các loại màu sắc - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Các loại màu sắc',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 221,
      durationLabel: '3:41',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 14 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/_7uD0lIkfes.json',
      cuesCount: 14,
      cues: [
        {
          start: 0.78,
          end: 21.5,
          en: 'Every day when going out',
          zh: '每天出门的时候',
          pinyin: 'Měi tiān chū mén de shí hòu',
          vi: 'Mỗi ngày khi ra khỏi nhà'
        },
        {
          start: 23.7,
          end: 26.8,
          en: 'Everyone will see all kinds of colors',
          zh: '大家会看到各种各样的颜色',
          pinyin: 'Dà jiā huì kàn dào gè zhǒng gè yàng de yán sè',
          vi: 'Mọi người sẽ thấy đủ loại màu sắc'
        },
        {
          start: 29.5,
          end: 31.64,
          en: 'Green big trees and small grass',
          zh: '绿色的大树和小草',
          pinyin: 'Lǜ sè de dà shù hé xiǎo cǎo',
          vi: 'Cây to xanh và cỏ non xanh'
        }
      ]
    },
    {
      id: 'ep-ps-y8mrvmflv9o',
      youtubeId: 'y8MrvMfLV9o',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Tại sao tôi học tiếng Trung - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Tại sao tôi học tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 240,
      durationLabel: '4:00',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 21 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/y8MrvMfLV9o.json',
      cuesCount: 21,
      cues: [
        {
          start: 3.92,
          end: 5.6,
          en: 'Read: Why do I learn Chinese?',
          zh: '读：为什么我学中文？',
          pinyin: 'Dú： wèi shén me wǒ xué zhōng wén？',
          vi: 'Đọc: Tại sao tôi học tiếng Trung?'
        },
        {
          start: 19.82,
          end: 24.94,
          en: 'Chinese girls are very pretty, so I want to learn Chinese.',
          zh: '中国的女孩很漂亮，所以我要学汉语。',
          pinyin: 'Zhōng guó de nǚ hái hěn piào liang， suǒ yǐ wǒ yào xué hàn yǔ。',
          vi: 'Các cô gái Trung Quốc rất xinh, nên tôi muốn học tiếng Trung.'
        },
        {
          start: 27.44,
          end: 29.52,
          en: 'I found a Chinese language school.',
          zh: '我找了一个汉语学校。',
          pinyin: 'Wǒ zhǎo le yí gè hàn yǔ xué xiào。',
          vi: 'Tôi tìm được một trường dạy tiếng Trung.'
        }
      ]
    },
    {
      id: 'ep-ps-mpp3c20ob0u',
      youtubeId: 'mpP3C20OB0U',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Tâm trạng tốt và xấu - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Tâm trạng tốt và xấu',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 199,
      durationLabel: '3:19',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 17 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/mpP3C20OB0U.json',
      cuesCount: 17,
      cues: [
        {
          start: 19.84,
          end: 22,
          en: 'Have you noticed a problem?',
          zh: '你们有没有发现一个问题？',
          pinyin: 'Nǐ men yǒu méi yǒu fā xiàn yí gè wèn tí？',
          vi: 'Các bạn có nhận ra một vấn đề không?'
        },
        {
          start: 24.48,
          end: 26.78,
          en: 'That is, every time you are in a good mood,',
          zh: '那就是，每次你心情好',
          pinyin: 'Nà jiù shì， měi cì nǐ xīn qíng hǎo',
          vi: 'Đó là, mỗi khi tâm trạng bạn tốt'
        },
        {
          start: 28.6,
          end: 31.08,
          en: 'when you are happy, you are always smiling.',
          zh: '你开心的时候就总是笑着',
          pinyin: 'Nǐ kāi xīn de shí hòu jiù zǒng shì xiào zhe',
          vi: 'khi bạn vui vẻ thì bạn luôn mỉm cười'
        }
      ]
    },
    {
      id: 'ep-ps-sw_p4v5_gkm',
      youtubeId: 'sW_P4v5_GkM',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Câu chuyện ăn bánh ngọt - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Câu chuyện ăn bánh ngọt',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 214,
      durationLabel: '3:34',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 16 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/sW_P4v5_GkM.json',
      cuesCount: 16,
      cues: [
        {
          start: 19.86,
          end: 22.04,
          en: 'Mom bought two pieces of cake.',
          zh: '妈妈买了两块蛋糕。',
          pinyin: 'Mā ma mǎi le liǎng kuài dàn gāo。',
          vi: 'Mẹ mua hai miếng bánh ngọt.'
        },
        {
          start: 24.3,
          end: 25.82,
          en: 'She said to the older brother and younger sister:',
          zh: '对哥哥和妹妹说：',
          pinyin: 'Duì gē ge hé mèi mei shuō：',
          vi: 'Mẹ nói với anh trai và em gái:'
        },
        {
          start: 28.08,
          end: 30.76,
          en: '“You two can each have one piece of cake.”',
          zh: '“你们两个人每人吃一块蛋糕。”',
          pinyin: '“ nǐ men liǎng gè rén měi rén chī yí kuài dàn gāo。”',
          vi: '“Hai người mỗi người ăn một miếng bánh ngọt.”'
        }
      ]
    },
    {
      id: 'ep-ps-eqom9jtskea',
      youtubeId: 'eQOM9JTsKeA',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Câu chuyện leo núi - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Câu chuyện leo núi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 229,
      durationLabel: '3:49',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 17 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/eQOM9JTsKeA.json',
      cuesCount: 17,
      cues: [
        {
          start: 20.74,
          end: 23.78,
          en: 'On Saturday, Dad took his little son hiking.',
          zh: '星期六，爸爸带着小儿子爬山。',
          pinyin: 'Xīng qī liù， bà ba dài zhe xiǎo ér zi pá shān。',
          vi: 'Thứ Bảy, bố dẫn cậu con trai nhỏ đi leo núi.'
        },
        {
          start: 26.88,
          end: 30.24,
          en: 'It took them three hours to climb to the top of the mountain.',
          zh: '他们花了三个小时爬到了山顶。',
          pinyin: 'Tā men huā le sān gè xiǎo shí pá dào le shān dǐng。',
          vi: 'Họ mất ba tiếng đồng hồ để leo lên đến đỉnh núi.'
        },
        {
          start: 33.56,
          end: 35.62,
          en: 'The scenery at the top of the mountain was very beautiful.',
          zh: '山顶的风景很美。',
          pinyin: 'Shān dǐng de fēng jǐng hěn měi。',
          vi: 'Phong cảnh trên đỉnh núi rất đẹp.'
        }
      ]
    },
    {
      id: 'ep-ps-9or7geir-ta',
      youtubeId: '9oR7gEIr-TA',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Ngày cuối tuần của tôi - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Cuối tuần của tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 216,
      durationLabel: '3:36',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 17 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/9oR7gEIr-TA.json',
      cuesCount: 17,
      cues: [
        {
          start: 4.04,
          end: 5.16,
          en: 'My weekend.',
          zh: '我的周末。',
          pinyin: 'Wǒ de zhōu mò。',
          vi: 'Cuối tuần của tôi.'
        },
        {
          start: 20.96,
          end: 22.26,
          en: 'Tomorrow is the weekend.',
          zh: '明天是周末了。',
          pinyin: 'Míng tiān shì zhōu mò liǎo。',
          vi: 'Ngày mai là cuối tuần rồi.'
        },
        {
          start: 24.42,
          end: 26,
          en: 'Do you have any plans?',
          zh: '你有什么打算吗？',
          pinyin: 'Nǐ yǒu shén me dǎ suàn ma？',
          vi: 'Bạn có dự định gì không?'
        }
      ]
    },
    {
      id: 'ep-ps-nhkkfknw7gq',
      youtubeId: 'NHKKFKnW7gQ',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Đi làm muộn - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Đi làm muộn',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 214,
      durationLabel: '3:34',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 18 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/NHKKFKnW7gQ.json',
      cuesCount: 18,
      cues: [
        {
          start: 21.34,
          end: 23.32,
          en: 'I work in a small company.',
          zh: '我在一个小公司里工作。',
          pinyin: 'Wǒ zài yí gè xiǎo gōng sī lǐ gōng zuò。',
          vi: 'Tôi làm việc trong một công ty nhỏ.'
        },
        {
          start: 25.98,
          end: 27.48,
          en: 'I quite like this job.',
          zh: '我挺喜欢这个工作。',
          pinyin: 'Wǒ tǐng xǐ huan zhè ge gōng zuò。',
          vi: 'Tôi khá thích công việc này.'
        },
        {
          start: 29.74,
          end: 32.84,
          en: 'But I have a problem: I\'m often late.',
          zh: '但是我有一个问题，我经常迟到。',
          pinyin: 'Dàn shì wǒ yǒu yí gè wèn tí， wǒ jīng cháng chí dào。',
          vi: 'Nhưng tôi có một vấn đề là tôi thường đi muộn.'
        }
      ]
    },
    {
      id: 'ep-ps-dhc5srr2sxi',
      youtubeId: 'dhC5sRr2sXI',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Làm khách - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Làm khách',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 218,
      durationLabel: '3:38',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 15 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/dhC5sRr2sXI.json',
      cuesCount: 15,
      cues: [
        {
          start: 21.84,
          end: 25.46,
          en: 'If you plan to visit a Chinese friend\'s home,',
          zh: '如果你打算去中国朋友家里做客，',
          pinyin: 'Rú guǒ nǐ dǎ suàn qù zhōng guó péng yǒu jiā lǐ zuò kè，',
          vi: 'Nếu bạn định đến nhà người bạn Trung Quốc làm khách,'
        },
        {
          start: 26.92,
          end: 29.16,
          en: 'then you should know',
          zh: '那么，你应该了解',
          pinyin: 'Nà me， nǐ yīng gāi liǎo jiě',
          vi: 'thì bạn nên biết'
        },
        {
          start: 29.88,
          end: 31.82,
          en: 'how to address your friend\'s family members',
          zh: '怎么称呼朋友的家人',
          pinyin: 'Zěn me chēng hu péng yǒu de jiā rén',
          vi: 'cách xưng hô với người nhà của người bạn'
        }
      ]
    },
    {
      id: 'ep-ps-mv12iylc5g4',
      youtubeId: 'mv12IyLC5G4',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Sở thích của tôi - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Sở thích của tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 255,
      durationLabel: '4:15',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 16 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/mv12IyLC5G4.json',
      cuesCount: 16,
      cues: [
        {
          start: 21.9,
          end: 24.52,
          en: 'Everyone has their own hobbies.',
          zh: '每个人都有自己的爱好。',
          pinyin: 'Měi gè rén dōu yǒu zì jǐ de ài hào。',
          vi: 'Mỗi người đều có sở thích riêng của mình.'
        },
        {
          start: 28,
          end: 29.68,
          en: 'What is your hobby?',
          zh: '你的爱好是什么呢？',
          pinyin: 'Nǐ de ài hào shì shén me ne？',
          vi: 'Sở thích của bạn là gì?'
        },
        {
          start: 33.34,
          end: 36.74,
          en: 'My hobby is drawing.',
          zh: '我的爱好是画画。',
          pinyin: 'Wǒ de ài hào shì huà huà。',
          vi: 'Sở thích của tôi là vẽ tranh.'
        }
      ]
    },
    {
      id: 'ep-ps-tuxgfv1nclo',
      youtubeId: 'TuxGfv1nClo',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Nhà mới của tôi - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Nhà mới của tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 228,
      durationLabel: '3:48',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 13 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/TuxGfv1nClo.json',
      cuesCount: 13,
      cues: [
        {
          start: 21.74,
          end: 23.54,
          en: 'I work in a big city,',
          zh: '我在大城市工作，',
          pinyin: 'Wǒ zài dài chéng shì gōng zuò，',
          vi: 'Tôi làm việc ở thành phố lớn,'
        },
        {
          start: 26.38,
          end: 27.9,
          en: 'rented a house for ten years.',
          zh: '租了十年的房子。',
          pinyin: 'Zū le shí nián de fáng zi。',
          vi: 'đã thuê nhà mười năm.'
        },
        {
          start: 31.2,
          end: 33.46,
          en: 'Now we have finally bought a house.',
          zh: '现在我们终于买了房子。',
          pinyin: 'Xiàn zài wǒ men zhōng yú mǎi le fáng zi。',
          vi: 'Bây giờ chúng tôi cuối cùng cũng đã mua được một căn nhà.'
        }
      ]
    },
    {
      id: 'ep-ps-tlhcinzrokm',
      youtubeId: 'tlHcInzROkM',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Quê hương tôi - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Quê hương tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 227,
      durationLabel: '3:47',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 20 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/tlHcInzROkM.json',
      cuesCount: 20,
      cues: [
        {
          start: 21.86,
          end: 24.32,
          en: 'My hometown is in the south of China.',
          zh: '我的家乡在中国的南方。',
          pinyin: 'Wǒ de jiā xiāng zài zhōng guó de nán fāng。',
          vi: 'Quê hương của tôi ở miền nam Trung Quốc.'
        },
        {
          start: 27.84,
          end: 30.32,
          en: 'My hometown is a small village,',
          zh: '我的家乡是一个小农村，',
          pinyin: 'Wǒ de jiā xiāng shì yí gè xiǎo nóng cūn，',
          vi: 'Quê hương tôi là một ngôi làng nhỏ,'
        },
        {
          start: 33.58,
          end: 36.14,
          en: 'because there are many peach blossom trees in the village,',
          zh: '因为村里有很多桃花树，',
          pinyin: 'Yīn wèi cūn lǐ yǒu hěn duō táo huā shù，',
          vi: 'vì trong làng có rất nhiều cây đào,'
        }
      ]
    },
    {
      id: 'ep-ps-ekpuqbfkq0u',
      youtubeId: 'EkPuqbFkQ0U',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Tôi thích mùa đông - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Tôi thích mùa đông',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 267,
      durationLabel: '4:27',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 16 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/EkPuqbFkQ0U.json',
      cuesCount: 16,
      cues: [
        {
          start: 4,
          end: 5.18,
          en: 'Hello everyone, I like winter.',
          zh: '大家好，我喜欢冬季',
          pinyin: 'Dà jiā hǎo， wǒ xǐ huan dōng jì',
          vi: 'Xin chào mọi người, tôi thích mùa đông.'
        },
        {
          start: 21.86,
          end: 23.28,
          en: 'A year has four seasons.',
          zh: '一年有四季',
          pinyin: 'Yì nián yǒu sì jì',
          vi: 'Một năm có bốn mùa.'
        },
        {
          start: 26.34,
          end: 28.84,
          en: 'Which season do I like?',
          zh: '哪个季节是我喜欢的呢？',
          pinyin: 'Nǎ gè jì jié shì wǒ xǐ huan de ne？',
          vi: 'Mùa nào là mùa tôi thích nhỉ?'
        }
      ]
    },
    {
      id: 'ep-ps-djzevmogopi',
      youtubeId: 'DjZevMOgopI',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đi chơi Tết Trung Thu - LUYỆN ĐỌC TIẾNG TRUNG HSK 1',
      titleVi: 'Đi chơi Tết Trung Thu',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 241,
      durationLabel: '4:01',
      topic: 'Luyện đọc HSK 1',
      note: 'Trọn bộ 35 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/DjZevMOgopI.json',
      cuesCount: 35,
      cues: [
        {
          start: 10.24,
          end: 22.22,
          en: 'Mid-Autumn Festival arrived, Xiaomei and her boyfriend went to the city center.',
          zh: '中秋节到了，小美和男朋友去了城市中心',
          pinyin: 'Zhōng qiū jié dào le， xiǎo měi hé nán péng yǒu qù le chéng shì zhōng xīn',
          vi: 'Tết Trung Thu đến rồi, Tiểu Mỹ và bạn trai đi đến trung tâm thành phố.'
        },
        {
          start: 27.9,
          end: 30.34,
          en: 'Xiaomei bought a painting.',
          zh: '小美买了一幅画',
          pinyin: 'Xiǎo měi mǎi le yì fú huà',
          vi: 'Tiểu Mỹ mua một bức tranh.'
        },
        {
          start: 35.94,
          end: 39.08,
          en: 'Her boyfriend bought a lantern.',
          zh: '她的男朋友买了一个灯笼',
          pinyin: 'Tā de nán péng yǒu mǎi le yí gè dēng long',
          vi: 'Bạn trai của cô ấy mua một chiếc lồng đèn.'
        }
      ]
    },
    {
      id: 'ep-ps-tnomeqaiinw',
      youtubeId: 'TnOMeQAiiNw',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Giới thiệu về công việc của bản thân  - LUYỆN ĐỌC TIẾNG TRUNG HSK 1',
      titleVi: 'Giới thiệu về công việc của bản thân',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 218,
      durationLabel: '3:38',
      topic: 'Luyện đọc HSK 1',
      note: 'Trọn bộ 30 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/TnOMeQAiiNw.json',
      cuesCount: 30,
      cues: [
        {
          start: 17.86,
          end: 19.7,
          en: 'I am a client manager.',
          zh: '我是一名客户经理。',
          pinyin: 'Wǒ shì yì míng kè hù jīng lǐ。',
          vi: 'Tôi là một quản lý khách hàng.'
        },
        {
          start: 24.56,
          end: 26.98,
          en: 'From Monday to Friday, I am very busy.',
          zh: '从周一到周五，我都很忙。',
          pinyin: 'Cóng zhōu yī dào zhōu wǔ， wǒ dōu hěn máng。',
          vi: 'Từ thứ Hai đến thứ Sáu, tôi đều rất bận.'
        },
        {
          start: 32.52,
          end: 35.86,
          en: 'Every day I go to work at 8 a.m. and get off work at 5 p.m.',
          zh: '我每天早上八点上班，下午五点下班。',
          pinyin: 'Wǒ měi tiān zǎo shàng bā diǎn shàng bān， xià wǔ wǔ diǎn xià bān。',
          vi: 'Hằng ngày tôi đi làm lúc tám giờ sáng, tan làm lúc năm giờ chiều.'
        }
      ]
    },
    {
      id: 'ep-ps-macxxgjuf4a',
      youtubeId: 'MACXxgJUf4A',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Nói về kế hoạch cuối tuần - LUYỆN ĐỌC TIẾNG TRUNG HSK 1',
      titleVi: 'Nói về kế hoạch cuối tuần',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 180,
      durationLabel: '3:00',
      topic: 'Luyện đọc HSK 1',
      note: 'Trọn bộ 18 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/MACXxgJUf4A.json',
      cuesCount: 18,
      cues: [
        {
          start: 12.86,
          end: 19.74,
          en: 'I don\'t have class this Sunday.',
          zh: '这个星期日我没有课。',
          pinyin: 'Zhè ge xīng qī rì wǒ méi yǒu kè。',
          vi: 'Chủ nhật này tôi không có tiết học.'
        },
        {
          start: 24.42,
          end: 27.34,
          en: 'I plan to read books in the library in the morning.',
          zh: '我打算上午在图书馆看书。',
          pinyin: 'Wǒ dǎ suàn shàng wǔ zài tú shū guǎn kàn shū。',
          vi: 'Tôi định buổi sáng đọc sách ở thư viện.'
        },
        {
          start: 31.96,
          end: 34.36,
          en: 'At noon I eat at the school cafeteria.',
          zh: '中午在学校食堂吃饭。',
          pinyin: 'Zhōng wǔ zài xué xiào shí táng chī fàn。',
          vi: 'Buổi trưa tôi ăn cơm ở căng tin trường.'
        }
      ]
    },
    {
      id: 'ep-ps-wlpnv8i2bos',
      youtubeId: 'WLPnV8I2bOs',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Miêu tả phòng ngủ - LUYỆN ĐỌC TIẾNG TRUNG HSK 1',
      titleVi: 'Miêu tả phòng ngủ',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 255,
      durationLabel: '4:15',
      topic: 'Luyện đọc HSK 1',
      note: 'Trọn bộ 23 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/WLPnV8I2bOs.json',
      cuesCount: 23,
      cues: [
        {
          start: 25.72,
          end: 29.38,
          en: 'There is a beautiful bed in my bedroom,',
          zh: '我的卧室里有一张漂亮的床，',
          pinyin: 'Wǒ de wò shì lǐ yǒu yì zhāng piào liang de chuáng，',
          vi: 'Trong phòng ngủ của tôi có một chiếc giường đẹp,'
        },
        {
          start: 35.06,
          end: 37.04,
          en: 'and a big chair.',
          zh: '以及一把大椅子。',
          pinyin: 'Yǐ jí yì bǎ dà yǐ zi。',
          vi: 'và một chiếc ghế lớn.'
        },
        {
          start: 43.8,
          end: 47.08,
          en: 'There is a toy bear on my bed.',
          zh: '我的床上有一只玩具熊。',
          pinyin: 'Wǒ de chuáng shàng yǒu yì zhī wán jù xióng。',
          vi: 'Trên giường của tôi có một con gấu bông.'
        }
      ]
    },
    {
      id: 'ep-ps-_0oikkskfwy',
      youtubeId: '_0OIKKsKfWY',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Bài kiểm tra TIẾNG TRUNG || LUYỆN ĐỌC TIẾNG TRUNG - HSK 1',
      titleVi: 'Bài kiểm tra',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 184,
      durationLabel: '3:04',
      topic: 'Luyện đọc HSK 1',
      note: 'Trọn bộ 26 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/_0OIKKsKfWY.json',
      cuesCount: 26,
      cues: [
        {
          start: 7.56,
          end: 21.62,
          en: 'I have a Chinese test every month.',
          zh: '我每个月都有一次汉语考试。',
          pinyin: 'Wǒ měi gè yuè dōu yǒu yí cì hàn yǔ kǎo shì。',
          vi: 'Hằng tháng tôi đều có một bài kiểm tra tiếng Trung.'
        },
        {
          start: 26.82,
          end: 30.84,
          en: 'When the exam is near, my good friend will help me prepare for it.',
          zh: '快考试的时候，我的好朋友会帮我准备考试。',
          pinyin: 'Kuài kǎo shì de shí hòu， wǒ de hǎo péng yǒu huì bāng wǒ zhǔn bèi kǎo shì。',
          vi: 'Khi sắp thi, người bạn tốt của tôi sẽ giúp tôi chuẩn bị cho kỳ thi.'
        },
        {
          start: 36.94,
          end: 39.66,
          en: 'Now my Chinese is getting better and better.',
          zh: '现在我的汉语越来越好了。',
          pinyin: 'Xiàn zài wǒ de hàn yǔ yuè lái yuè hǎo le。',
          vi: 'Bây giờ tiếng Trung của tôi ngày càng tốt hơn.'
        }
      ]
    },
    {
      id: 'ep-ps-gets_w1ecbc',
      youtubeId: 'geTs_W1ECbc',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Tết Trung Thu || LUYỆN ĐỌC TIẾNG TRUNG - HSK 3',
      titleVi: 'Tết Trung Thu',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 319,
      durationLabel: '5:19',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 28 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/geTs_W1ECbc.json',
      cuesCount: 28,
      cues: [
        {
          start: 25.08,
          end: 27.46,
          en: 'Today is the Mid-Autumn Festival, the 15th day of the eighth lunar month.',
          zh: '今天是八月十五中秋节。',
          pinyin: 'Jīn tiān shì bā yuè shí wǔ zhōng qiū jié。',
          vi: 'Hôm nay là ngày rằm tháng Tám, Tết Trung Thu.'
        },
        {
          start: 31.8,
          end: 34.28,
          en: 'In the evening, many guests came to our house.',
          zh: '晚上我们家来了很多客人。',
          pinyin: 'Wǎn shàng wǒ men jiā lái le hěn duō kè rén。',
          vi: 'Buổi tối nhà chúng tôi có rất nhiều khách đến.'
        },
        {
          start: 38.44,
          end: 40.14,
          en: 'Some of them brought mooncakes.',
          zh: '他们有的拿了月饼。',
          pinyin: 'Tā men yǒu de ná le yuè bǐng。',
          vi: 'Có người mang bánh trung thu.'
        }
      ]
    },
    {
      id: 'ep-ps-kgenaojuwos',
      youtubeId: 'kGENaOJUWos',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Đi du lịch Trung Quốc || LUYỆN ĐỌC TIẾNG TRUNG - HSK 2',
      titleVi: 'Đi du lịch Trung Quốc',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 303,
      durationLabel: '5:03',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 29 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/kGENaOJUWos.json',
      cuesCount: 29,
      cues: [
        {
          start: 24.76,
          end: 26.46,
          en: 'Do you want to travel to China?',
          zh: '你想去中国旅游吗？',
          pinyin: 'Nǐ xiǎng qù zhōng guó lǚ yóu ma？',
          vi: 'Bạn có muốn đi du lịch Trung Quốc không?'
        },
        {
          start: 31.02,
          end: 32.8,
          en: 'When do you think is the best time to go?',
          zh: '你觉得什么时候去最好？',
          pinyin: 'Nǐ jué de shén me shí hòu qù zuì hǎo？',
          vi: 'Bạn nghĩ đi lúc nào là tốt nhất?'
        },
        {
          start: 37.8,
          end: 39.3,
          en: 'This question is a little difficult,',
          zh: '这个问题有点难，',
          pinyin: 'Zhè ge wèn tí yǒu diǎn nán，',
          vi: 'Câu hỏi này hơi khó,'
        }
      ]
    },
    {
      id: 'ep-ps-u7kn6wo8iz0',
      youtubeId: 'u7Kn6Wo8iZ0',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Ông chủ mới || LUYỆN ĐỌC TIẾNG TRUNG - HSK 3',
      titleVi: 'Ông chủ mới',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 278,
      durationLabel: '4:38',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 25 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/u7Kn6Wo8iZ0.json',
      cuesCount: 25,
      cues: [
        {
          start: 24.38,
          end: 26.44,
          en: 'A new boss came to our company.',
          zh: '我们公司来了一个新老板。',
          pinyin: 'Wǒ men gōng sī lái le yí gè xīn lǎo bǎn。',
          vi: 'Công ty chúng tôi có một ông chủ mới đến.'
        },
        {
          start: 30.18,
          end: 32.72,
          en: 'Everyone heard that he had very high standards,',
          zh: '大家听说他有很高的要求，',
          pinyin: 'Dà jiā tīng shuō tā yǒu hěn gāo de yāo qiú，',
          vi: 'Mọi người nghe nói ông ấy có yêu cầu rất cao,'
        },
        {
          start: 32.76,
          end: 39.16,
          en: 'but no one knew what he would do on his first day.',
          zh: '但是不知道他第一天会做什么。',
          pinyin: 'Dàn shì bù zhī dào tā dì yī tiān huì zuò shén me。',
          vi: 'nhưng không biết ngày đầu tiên ông ấy sẽ làm gì.'
        }
      ]
    },
    {
      id: 'ep-ps-g5xvj8avway',
      youtubeId: 'G5XVJ8aVWAY',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Căn nhà mới || LUYỆN ĐỌC TIẾNG TRUNG - HSK 3',
      titleVi: 'Căn nhà mới',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 325,
      durationLabel: '5:25',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 29 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/G5XVJ8aVWAY.json',
      cuesCount: 29,
      cues: [
        {
          start: 25.7,
          end: 29.22,
          en: 'Last year, my family and I bought a new house.',
          zh: '去年，我和家人买了一套新房子。',
          pinyin: 'Qù nián， wǒ hé jiā rén mǎi le yí tào xīn fáng zi。',
          vi: 'Năm ngoái, tôi và gia đình đã mua một căn nhà mới.'
        },
        {
          start: 33.46,
          end: 35.88,
          en: 'This year we moved in.',
          zh: '今年我们搬进来了。',
          pinyin: 'Jīn nián wǒ men bān jìn lái le。',
          vi: 'Năm nay chúng tôi đã chuyển vào ở.'
        },
        {
          start: 40.14,
          end: 42.9,
          en: 'To the west of the new house there is a clean river.',
          zh: '新家西边有一条干净的河。',
          pinyin: 'Xīn jiā xī biān yǒu yì tiáo gān jìng de hé。',
          vi: 'Phía tây căn nhà mới có một con sông sạch.'
        }
      ]
    },
    {
      id: 'ep-ps-vv83izdlmru',
      youtubeId: 'vV83iZDLMRU',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Học ở Trung Quốc || LUYỆN ĐỌC TIẾNG TRUNG - HSK 3',
      titleVi: 'Học ở Trung Quốc',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 294,
      durationLabel: '4:54',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 24 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/vV83iZDLMRU.json',
      cuesCount: 24,
      cues: [
        {
          start: 32.82,
          end: 36.4,
          en: 'Now I have been studying in China for 11 months.',
          zh: '现在我在中国已经学习个月了。',
          pinyin: 'Xiàn zài wǒ zài zhōng guó yǐ jīng xué xí gè yuè le。',
          vi: 'Hiện tại tôi đã học ở Trung Quốc được 11 tháng.'
        },
        {
          start: 40.88,
          end: 43.98,
          en: 'I will soon finish studying in China.',
          zh: '我很快会结束在中国的学习。',
          pinyin: 'Wǒ hěn kuài huì jié shù zài zhōng guó de xué xí。',
          vi: 'Tôi sắp kết thúc việc học ở Trung Quốc.'
        },
        {
          start: 48.18,
          end: 50.5,
          en: 'I am going back to my country next month.',
          zh: '下个月我就要回国了。',
          pinyin: 'Xià gè yuè wǒ jiù yào huí guó le。',
          vi: 'Tháng sau tôi sẽ về nước.'
        }
      ]
    },
    {
      id: 'ep-ps-ijuxvffgxze',
      youtubeId: 'IjuXvfFgXZE',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Lớp học của tôi || LUYỆN ĐỌC TIẾNG TRUNG - HSK 3',
      titleVi: 'Lớp học của tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 201,
      durationLabel: '3:21',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 16 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/IjuXvfFgXZE.json',
      cuesCount: 16,
      cues: [
        {
          start: 24.96,
          end: 28.2,
          en: 'Do you want to know what my classroom looks like?',
          zh: '你想知道我的教室是什么样子的吗？',
          pinyin: 'Nǐ xiǎng zhī dào wǒ de jiào shì shì shén me yàng zi de ma？',
          vi: 'Bạn có muốn biết lớp học của tôi trông như thế nào không?'
        },
        {
          start: 31.52,
          end: 33,
          en: 'It is very spacious and bright.',
          zh: '它很宽敞明亮。',
          pinyin: 'Tā hěn kuān chǎng míng liàng。',
          vi: 'Nó rất rộng rãi và sáng sủa.'
        },
        {
          start: 36.24,
          end: 39.04,
          en: 'There are thirty desks and thirty chairs in the classroom.',
          zh: '教室里有三十张桌子和三十把椅子。',
          pinyin: 'Jiào shì lǐ yǒu sān shí zhāng zhuō zi hé sān shí bǎ yǐ zi。',
          vi: 'Trong lớp học có ba mươi cái bàn và ba mươi cái ghế.'
        }
      ]
    },
    {
      id: 'ep-ps-3ibhc8jjxzy',
      youtubeId: '3iBHC8jjXZY',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Giới thiệu về Quế Lâm || LUYỆN ĐỌC TIẾNG TRUNG - HSK 3',
      titleVi: 'Giới thiệu về Quế Lâm',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 205,
      durationLabel: '3:25',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 15 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/3iBHC8jjXZY.json',
      cuesCount: 15,
      cues: [
        {
          start: 23.98,
          end: 27.46,
          en: 'Guilin is a famous tourist city in China.',
          zh: '桂林是中国一个有名的旅游城市。',
          pinyin: 'Guì lín shì zhōng guó yí gè yǒu míng de lǚ yóu chéng shì。',
          vi: 'Quế Lâm là một thành phố du lịch nổi tiếng của Trung Quốc.'
        },
        {
          start: 30.68,
          end: 33.24,
          en: 'It belongs to the Guangxi Zhuang Autonomous Region,',
          zh: '它属于广西壮族自治区，',
          pinyin: 'Tā shǔ yú guǎng xī zhuàng zú zì zhì qū，',
          vi: 'Nó thuộc Khu tự trị dân tộc Choang Quảng Tây,'
        },
        {
          start: 36.46,
          end: 37.94,
          en: 'in the south of China.',
          zh: '在中国的南方。',
          pinyin: 'Zài zhōng guó de nán fāng。',
          vi: 'nằm ở phía nam Trung Quốc.'
        }
      ]
    },
    {
      id: 'ep-ps-wey_cffoo7u',
      youtubeId: 'wey_cffoo7U',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Giới thiệu về Nam Kinh || LUYỆN ĐỌC TIẾNG TRUNG - HSK 3',
      titleVi: 'Giới thiệu về Nam Kinh',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 198,
      durationLabel: '3:18',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 20 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/wey_cffoo7U.json',
      cuesCount: 20,
      cues: [
        {
          start: 23.86,
          end: 25.64,
          en: 'Nanjing is in Jiangsu Province, China.',
          zh: '南京在中国的江苏省',
          pinyin: 'Nán jīng zài zhōng guó de jiāng sū shěng',
          vi: 'Nam Kinh nằm ở tỉnh Giang Tô, Trung Quốc.'
        },
        {
          start: 29.02,
          end: 30.88,
          en: 'It is a city with a long history.',
          zh: '是一座历史悠久的城市',
          pinyin: 'Shì yí zuò lì shǐ yōu jiǔ de chéng shì',
          vi: 'Là một thành phố có lịch sử lâu đời.'
        },
        {
          start: 34.16,
          end: 35.14,
          en: 'Because in ancient times,',
          zh: '因为在古时候',
          pinyin: 'Yīn wèi zài gǔ shí hòu',
          vi: 'Bởi vì vào thời cổ đại,'
        }
      ]
    },
    {
      id: 'ep-ps-xooy_nrtxgq',
      youtubeId: 'XOoy_nRtXGQ',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Tôi không thích mùa đông || LUYỆN ĐỌC TIẾNG TRUNG - HSK 2',
      titleVi: 'Tôi không thích mùa đông',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 151,
      durationLabel: '2:31',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 16 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/XOoy_nRtXGQ.json',
      cuesCount: 16,
      cues: [
        {
          start: 21.82,
          end: 24.4,
          en: 'The season I like least is winter.',
          zh: '我最不喜欢的季节是冬天。',
          pinyin: 'Wǒ zuì bù xǐ huan de jì jié shì dōng tiān。',
          vi: 'Mùa tôi không thích nhất là mùa đông.'
        },
        {
          start: 27.32,
          end: 28.8,
          en: 'Because in winter,',
          zh: '因为冬天的时候，',
          pinyin: 'Yīn wèi dōng tiān de shí hòu，',
          vi: 'Vì vào mùa đông,'
        },
        {
          start: 31.58,
          end: 33.58,
          en: 'I always get colds and fevers,',
          zh: '我总是会感冒、发烧，',
          pinyin: 'Wǒ zǒng shì huì gǎn mào、 fā shāo，',
          vi: 'tôi hay bị cảm, sốt,'
        }
      ]
    },
    {
      id: 'ep-ps-zta-ndv39ee',
      youtubeId: 'ztA-NDv39EE',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Tôi là đầu bếp || LUYỆN ĐỌC TIẾNG TRUNG - HSK 2',
      titleVi: 'Tôi là đầu bếp',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 153,
      durationLabel: '2:33',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 16 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/ztA-NDv39EE.json',
      cuesCount: 16,
      cues: [
        {
          start: 21.88,
          end: 22.86,
          en: 'I am a chef.',
          zh: '我是一位厨师。',
          pinyin: 'Wǒ shì yí wèi chú shī。',
          vi: 'Tôi là đầu bếp.'
        },
        {
          start: 26.6,
          end: 28.38,
          en: 'So, I really like food.',
          zh: '所以，我很喜欢食物。',
          pinyin: 'Suǒ yǐ， wǒ hěn xǐ huan shí wù。',
          vi: 'Vì vậy, tôi rất thích đồ ăn.'
        },
        {
          start: 31.68,
          end: 34.14,
          en: 'Let me tell you what food I like to make.',
          zh: '让我告诉你我喜欢做的食物是什么。',
          pinyin: 'Ràng wǒ gào sù nǐ wǒ xǐ huan zuò de shí wù shì shén me。',
          vi: 'Để tôi nói cho bạn biết món tôi thích làm là gì.'
        }
      ]
    },
    {
      id: 'ep-ps-3rj5eh6xluk',
      youtubeId: '3rJ5EH6XlUk',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Thời gian trôi qua thật nhanh || LUYỆN ĐỌC TIẾNG TRUNG - HSK 2',
      titleVi: 'Thời gian trôi qua thật nhanh',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 160,
      durationLabel: '2:40',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 18 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/3rJ5EH6XlUk.json',
      cuesCount: 18,
      cues: [
        {
          start: 17.02,
          end: 23.66,
          en: 'Time passes so fast.',
          zh: '时间过得好快啊。',
          pinyin: 'Shí jiān guò dé hǎo kuài a。',
          vi: 'Thời gian trôi qua thật nhanh nhỉ.'
        },
        {
          start: 26.82,
          end: 28.14,
          en: 'Another week has passed.',
          zh: '一周又过去了。',
          pinyin: 'Yì zhōu yòu guò qù le。',
          vi: 'Một tuần nữa lại trôi qua rồi.'
        },
        {
          start: 31.3,
          end: 32.64,
          en: 'A week has seven days.',
          zh: '一周有七天。',
          pinyin: 'Yì zhōu yǒu qī tiān。',
          vi: 'Một tuần có bảy ngày.'
        }
      ]
    },
    {
      id: 'ep-ps-sxng3bjfdig',
      youtubeId: 'SxNG3bJfDig',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn mua trái cây || LUYỆN ĐỌC TIẾNG TRUNG - HSK 2',
      titleVi: 'Mua trái cây',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 171,
      durationLabel: '2:51',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 18 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/SxNG3bJfDig.json',
      cuesCount: 18,
      cues: [
        {
          start: 31.84,
          end: 34.08,
          en: 'Mom and I are shopping at the supermarket.',
          zh: '妈妈和我在超市购物。',
          pinyin: 'Mā ma hé wǒ zài chāo shì gòu wù。',
          vi: 'Mẹ và tôi đi mua sắm ở siêu thị.'
        },
        {
          start: 37.22,
          end: 38.96,
          en: 'We bought a lot of fruit.',
          zh: '我们买了很多水果。',
          pinyin: 'Wǒ men mǎi le hěn duō shuǐ guǒ。',
          vi: 'Chúng tôi đã mua rất nhiều trái cây.'
        },
        {
          start: 42.12,
          end: 44.38,
          en: 'I like to eat bananas and grapes.',
          zh: '我喜欢吃香蕉和葡萄。',
          pinyin: 'Wǒ xǐ huan chī xiāng jiāo hé pú táo。',
          vi: 'Tôi thích ăn chuối và nho.'
        }
      ]
    },
    {
      id: 'ep-ps-bu1goaum0o8',
      youtubeId: 'BU1goAuM0o8',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn hạnh phúc là gì || LUYỆN ĐỌC TIẾNG TRUNG - HSK 2',
      titleVi: 'Hạnh phúc là gì?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 231,
      durationLabel: '3:51',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 26 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/BU1goAuM0o8.json',
      cuesCount: 26,
      cues: [
        {
          start: 21.84,
          end: 23.44,
          en: 'Xiao Ming loves reading books.',
          zh: '小明非常爱看书。',
          pinyin: 'Xiǎo míng fēi cháng ài kàn shū。',
          vi: 'Minh rất thích đọc sách.'
        },
        {
          start: 26.54,
          end: 27.94,
          en: 'He also loves using his head.',
          zh: '也非常爱动脑筋。',
          pinyin: 'Yě fēi cháng ài dòng nǎo jīn。',
          vi: 'Cậu ấy cũng rất thích động não.'
        },
        {
          start: 31.26,
          end: 34.04,
          en: 'That day, holding a book, Xiao Ming muttered:',
          zh: '这天，小明捧着一本书嘀咕：',
          pinyin: 'Zhè tiān， xiǎo míng pěng zhe yì běn shū dí gū：',
          vi: 'Hôm ấy, Minh ôm một cuốn sách và lẩm bẩm:'
        }
      ]
    },
    {
      id: 'ep-ps-d2xbrckagyi',
      youtubeId: 'd2XbRCKaGyI',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn học sinh Trung Quốc || LUYỆN ĐỌC TIẾNG TRUNG - HSK 2',
      titleVi: 'Học sinh Trung Quốc',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 163,
      durationLabel: '2:43',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 15 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/d2XbRCKaGyI.json',
      cuesCount: 15,
      cues: [
        {
          start: 30.38,
          end: 31.74,
          en: 'Children start primary school at six years old.',
          zh: '六岁读小学',
          pinyin: 'Liù suì dú xiǎo xué',
          vi: 'Trẻ em vào học tiểu học lúc sáu tuổi.'
        },
        {
          start: 34.48,
          end: 35.86,
          en: 'Primary school lasts six years.',
          zh: '小学有六年',
          pinyin: 'Xiǎo xué yǒu liù nián',
          vi: 'Tiểu học có sáu năm.'
        },
        {
          start: 38.64,
          end: 40.36,
          en: 'At twelve, they start junior high school.',
          zh: '他们十二岁读初中',
          pinyin: 'Tā men shí èr suì dú chū zhōng',
          vi: 'Mười hai tuổi, các em vào học trung học cơ sở.'
        }
      ]
    },
    {
      id: 'ep-ps-wan9wdmwlv0',
      youtubeId: 'wan9wdMwlv0',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Phía bắc và nam của Trung Quốc || LUYỆN ĐỌC TIẾNG TRUNG - HSK 2',
      titleVi: 'Miền Bắc và miền Nam Trung Quốc',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 146,
      durationLabel: '2:26',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 14 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/wan9wdMwlv0.json',
      cuesCount: 14,
      cues: [
        {
          start: 21.88,
          end: 23.98,
          en: 'Using the Qinling Mountains and the Huai River as the dividing line.',
          zh: '以秦岭、淮河为线。',
          pinyin: 'Yǐ qín lǐng、 huái hé wèi xiàn。',
          vi: 'Lấy Tần Lĩnh và Hoài Hà làm ranh giới.'
        },
        {
          start: 26.76,
          end: 29.32,
          en: 'To the north of this line is northern China.',
          zh: '这条线的北方是中国的北方。',
          pinyin: 'Zhè tiáo xiàn de běi fāng shì zhōng guó de běi fāng。',
          vi: 'Phía bắc của đường ranh giới này là miền Bắc Trung Quốc.'
        },
        {
          start: 32.24,
          end: 34.96,
          en: 'To the south of this line is southern China.',
          zh: '这条线的南方是中国的南方。',
          pinyin: 'Zhè tiáo xiàn de nán fāng shì zhōng guó de nán fāng。',
          vi: 'Phía nam của đường ranh giới này là miền Nam Trung Quốc.'
        }
      ]
    },
    {
      id: 'ep-ps-0rhndeetxva',
      youtubeId: '0RhndeEtXVA',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Tới Trung Quốc chơi nào || LUYỆN ĐỌC TIẾNG TRUNG - HSK 2',
      titleVi: 'Đi Trung Quốc chơi nào',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 163,
      durationLabel: '2:43',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 18 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/0RhndeEtXVA.json',
      cuesCount: 18,
      cues: [
        {
          start: 30.36,
          end: 31.56,
          en: 'You can go to Harbin',
          zh: '可以去哈尔滨',
          pinyin: 'Kě yǐ qù hā ěr bīn',
          vi: 'Có thể đi Cáp Nhĩ Tân'
        },
        {
          start: 34.6,
          end: 36.46,
          en: 'It is in the far north of China',
          zh: '它在中国的最北边',
          pinyin: 'Tā zài zhōng guó de zuì běi biān',
          vi: 'Nó nằm ở cực bắc Trung Quốc'
        },
        {
          start: 39.34,
          end: 40.68,
          en: 'It snows in winter',
          zh: '冬天会下雪',
          pinyin: 'Dōng tiān huì xià xuě',
          vi: 'Mùa đông sẽ có tuyết rơi'
        }
      ]
    },
    {
      id: 'ep-ps-i9bbkrtgv9o',
      youtubeId: 'i9bbKrtgV9o',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện đọc TIẾNG TRUNG : Giới thiệu về bố tôi',
      titleVi: 'Giới thiệu về bố tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 235,
      durationLabel: '3:55',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 24 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/i9bbKrtgV9o.json',
      cuesCount: 24,
      cues: [
        {
          start: 23.44,
          end: 25.88,
          en: 'My father\'s name is Du Mengxiong.',
          zh: '我父亲叫杜孟雄。',
          pinyin: 'Wǒ fù qīn jiào dù mèng xióng。',
          vi: 'Bố tôi tên là Đỗ Mạnh Hùng.'
        },
        {
          start: 27,
          end: 31.42,
          en: 'He is over fifty years old this year and lives in Lam Dong Province.',
          zh: '今年五十多岁，住在林同省。',
          pinyin: 'Jīn nián wǔ shí duō suì， zhù zài lín tóng shěng。',
          vi: 'Năm nay ông ấy hơn năm mươi tuổi, sống ở tỉnh Lâm Đồng.'
        },
        {
          start: 33.54,
          end: 36.26,
          en: 'My father\'s hobby is music.',
          zh: '我父亲的爱好是音乐。',
          pinyin: 'Wǒ fù qīn de ài hào shì yīn yuè。',
          vi: 'Sở thích của bố tôi là âm nhạc.'
        }
      ]
    },
    {
      id: 'ep-ps-zbfku0pudbc',
      youtubeId: 'ZbfkU0PuDBc',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện đọc TIẾNG TRUNG : Đoạn văn giới thiệu bản thân khi đi xin việc',
      titleVi: 'Giới thiệu bản thân khi xin việc',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 230,
      durationLabel: '3:50',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 46 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/ZbfkU0PuDBc.json',
      cuesCount: 46,
      cues: [
        {
          start: 11.56,
          end: 13.22,
          en: 'When you study a Chinese language course.',
          zh: '当你学习中文课程时',
          pinyin: 'Dāng nǐ xué xí zhōng wén kè chéng shí',
          vi: 'Khi bạn học khóa học tiếng Trung.'
        },
        {
          start: 21.72,
          end: 22.94,
          en: 'I am Li Qianqian.',
          zh: '我是李千千',
          pinyin: 'Wǒ shì lǐ qiān qiān',
          vi: 'Tôi là Lý Thiên Thiên.'
        },
        {
          start: 24.34,
          end: 26.62,
          en: 'I graduated from the University of Commerce.',
          zh: '毕业于商贸大学',
          pinyin: 'Bì yè yú shāng mào dà xué',
          vi: 'Tôi tốt nghiệp Đại học Thương mại.'
        }
      ]
    },
    {
      id: 'ep-ps-dgtiznqqqyg',
      youtubeId: 'dgtIZnqQqYg',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện đọc TIẾNG TRUNG : Một ngày của tôi',
      titleVi: 'Một ngày của tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 237,
      durationLabel: '3:57',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 32 câu luyện đọc với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/dgtIZnqQqYg.json',
      cuesCount: 32,
      cues: [
        {
          start: 15.82,
          end: 21.8,
          en: 'Every morning, I get up at 5:30, brush my teeth, and wash my face.',
          zh: '每天早上，我五点半起床，刷牙、洗脸。',
          pinyin: 'Měi tiān zǎo shàng， wǒ wǔ diǎn bàn qǐ chuáng， shuā yá、 xǐ liǎn。',
          vi: 'Mỗi sáng, tôi dậy lúc 5:30, đánh răng, rửa mặt.'
        },
        {
          start: 22.26,
          end: 25.9,
          en: 'I usually eat breakfast at 6:30 in the morning.',
          zh: '我通常在早上六点半吃早餐。',
          pinyin: 'Wǒ tōng cháng zài zǎo shàng liù diǎn bàn chī zǎo cān。',
          vi: 'Tôi thường ăn sáng lúc 6:30 sáng.'
        },
        {
          start: 26,
          end: 29,
          en: 'I ride a motorbike to work.',
          zh: '我骑摩托车上班。',
          pinyin: 'Wǒ qí mó tuō chē shàng bān。',
          vi: 'Tôi đi làm bằng xe máy.'
        }
      ]
    },
    {
      id: 'ep-ps--6kalm7ft7q',
      youtubeId: '-6kaLm7Ft7Q',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: '【HSK 1-3】我的初恋 - Tình đầu của tôi | Chinese Podcast',
      titleVi: 'Mối tình đầu của tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 286,
      durationLabel: '4:46',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 71 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/-6kaLm7Ft7Q.json',
      cuesCount: 71,
      cues: [
        {
          start: 0.34,
          end: 4.68,
          en: 'Today the weather is very cold; it\'s lightly snowing in Chengdu.',
          zh: '今天天气很冷，成都下着小雪。',
          pinyin: 'Jīn tiān tiān qì hěn lěng， chéng dū xià zhe xiǎo xuě。',
          vi: 'Hôm nay trời rất lạnh, ở Thành Đô đang có tuyết nhẹ rơi.'
        },
        {
          start: 6.04,
          end: 9.62,
          en: 'This kind of winter reminds me of my first love story.',
          zh: '这样的冬天让我想起了我的初恋故事。',
          pinyin: 'Zhè yàng de dōng tiān ràng wǒ xiǎng qǐ le wǒ de chū liàn gù shì。',
          vi: 'Mùa đông như thế này khiến tôi nhớ lại câu chuyện mối tình đầu của mình.'
        },
        {
          start: 10.8,
          end: 13.58,
          en: 'It is a warm and special memory.',
          zh: '那是一个温暖又特别的回忆。',
          pinyin: 'Nà shì yí gè wēn nuǎn yòu tè bié de huí yì。',
          vi: 'Đó là một kỷ niệm ấm áp và đặc biệt.'
        }
      ]
    },
    {
      id: 'ep-ps--8hjrm0stz4',
      youtubeId: '-8HJRm0STz4',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn giới thiệu về bức ảnh bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Đoạn văn giới thiệu về bức ảnh',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 214,
      durationLabel: '3:34',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 18 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/-8HJRm0STz4.json',
      cuesCount: 18,
      cues: [
        {
          start: 18.12,
          end: 23.68,
          en: 'This photo was taken when we were traveling in Japan.',
          zh: '这张照片是我们在日本旅行时拍的。',
          pinyin: 'Zhè zhāng zhào piàn shì wǒ men zài rì běn lǚ xíng shí pāi de。',
          vi: 'Bức ảnh này được chụp khi chúng tôi đi du lịch ở Nhật Bản.'
        },
        {
          start: 29.6,
          end: 34.22,
          en: 'In the photo are my dad, mom, younger sister, and me.',
          zh: '照片上有爸爸、妈妈、妹妹和我。',
          pinyin: 'Zhào piàn shàng yǒu bà ba、 mā ma、 mèi mei hé wǒ。',
          vi: 'Trong ảnh có bố, mẹ, em gái và tôi.'
        },
        {
          start: 40.56,
          end: 42.44,
          en: 'I look like my dad.',
          zh: '我长得像爸爸。',
          pinyin: 'Wǒ cháng dé xiàng bà ba。',
          vi: 'Tôi trông giống bố.'
        }
      ]
    },
    {
      id: 'ep-ps--cec8kn_e5m',
      youtubeId: '-cec8kn_E5M',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện đọc TIẾNG TRUNG : Đoạn văn giới thiệu bản thân',
      titleVi: 'Luyện đọc đoạn văn giới thiệu bản thân',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 213,
      durationLabel: '3:33',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 46 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/-cec8kn_E5M.json',
      cuesCount: 46,
      cues: [
        {
          start: 20.02,
          end: 22.88,
          en: 'My surname is Chen, and my name is Chen Yuying.',
          zh: '我姓陈，我叫陈玉英',
          pinyin: 'Wǒ xìng chén， wǒ jiào chén yù yīng',
          vi: 'Tôi họ Trần, tôi tên là Trần Ngọc Anh.'
        },
        {
          start: 23.68,
          end: 27.6,
          en: 'I am Vietnamese, and I was born in Haiphong City.',
          zh: '我是越南人，我出生在海防市',
          pinyin: 'Wǒ shì yuè nán rén， wǒ chū shēng zài hǎi fáng shì',
          vi: 'Tôi là người Việt Nam, tôi sinh ra ở thành phố Hải Phòng.'
        },
        {
          start: 28.42,
          end: 30.28,
          en: 'I am 24 years old.',
          zh: '我今年岁',
          pinyin: 'Wǒ jīn nián suì',
          vi: 'Năm nay tôi 24 tuổi.'
        }
      ]
    },
    {
      id: 'ep-ps--srmiwh9uk4',
      youtubeId: '-srMiWh9Uk4',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Điều gì quan trọng nhất - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Điều gì quan trọng nhất',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 227,
      durationLabel: '3:47',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 18 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/-srMiWh9Uk4.json',
      cuesCount: 18,
      cues: [
        {
          start: 4.02,
          end: 5.42,
          en: 'Reading, what is the most important thing?',
          zh: '读书，什么是最重要的？',
          pinyin: 'Dú shū， shén me shì zuì zhòng yào de？',
          vi: 'Đọc sách, điều gì quan trọng nhất?'
        },
        {
          start: 20.06,
          end: 22.36,
          en: 'For you, what is most important?',
          zh: '对你来说，什么最重要？',
          pinyin: 'Duì nǐ lái shuō， shén me zuì zhòng yào？',
          vi: 'Đối với bạn, điều gì quan trọng nhất?'
        },
        {
          start: 25.56,
          end: 27.92,
          en: 'Some people think work is most important.',
          zh: '有人认为，工作最重要。',
          pinyin: 'Yǒu rén rèn wéi， gōng zuò zuì zhòng yào。',
          vi: 'Có người cho rằng công việc là quan trọng nhất.'
        }
      ]
    },
    {
      id: 'ep-ps-02rlvxxhtc0',
      youtubeId: '02rLvXxHtC0',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Khi nào bạn trả tôi tiền',
      titleVi: 'Khi nào bạn trả tôi tiền?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 77,
      durationLabel: '1:17',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 20 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/02rLvXxHtC0.json',
      cuesCount: 20,
      cues: [
        {
          start: 0.46,
          end: 3.04,
          en: 'When will you pay me back?',
          zh: '你什么时候还我钱？',
          pinyin: 'Nǐ shén me shí hòu hái wǒ qián？',
          vi: 'Khi nào bạn trả tôi tiền?'
        },
        {
          start: 4.7,
          end: 11.5,
          en: 'Last month, you borrowed 250 yuan from me.',
          zh: '上个月，你从我这里借了两百五十块钱。',
          pinyin: 'Shàng gè yuè， nǐ cóng wǒ zhè lǐ jiè le liǎng bǎi wǔ shí kuài qián。',
          vi: 'Tháng trước, bạn vay tôi 250 tệ.'
        },
        {
          start: 14.16,
          end: 19.22,
          en: 'Really? I don\'t remember. Are you sure?',
          zh: '真的吗？我不记得了。你肯定吗？',
          pinyin: 'Zhēn de ma？ wǒ bú jì de le。 nǐ kěn dìng ma？',
          vi: 'Thật à? Tôi không nhớ. Bạn có chắc không?'
        }
      ]
    },
    {
      id: 'ep-ps-04nmm257ipq',
      youtubeId: '04Nmm257IPQ',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Mua vé tàu hoả',
      titleVi: 'Mua vé tàu hoả',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 110,
      durationLabel: '1:50',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 21 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/04Nmm257IPQ.json',
      cuesCount: 21,
      cues: [
        {
          start: 4.56,
          end: 7.76,
          en: 'Wang Gang, I need to ask your advice about something.',
          zh: '王刚，有个事情需要请教你。',
          pinyin: 'Wáng gāng， yǒu gè shì qíng xū yào qǐng jiào nǐ。',
          vi: 'Vương Cương, có một việc tôi cần hỏi anh.'
        },
        {
          start: 12.86,
          end: 18,
          en: 'The company needs me to go on a business trip to Shanghai, but I don\'t know how to buy train tickets.',
          zh: '公司需要出差去上海，可是我不知道怎么买火车票。',
          pinyin: 'Gōng sī xū yào chū chāi qù shàng hǎi， kě shì wǒ bù zhī dào zěn me mǎi huǒ chē piào。',
          vi: 'Công ty cần cử tôi đi công tác Thượng Hải, nhưng tôi không biết mua vé tàu hoả thế nào.'
        },
        {
          start: 18.94,
          end: 21.66,
          en: 'I haven\'t taken a train in China yet.',
          zh: '在中国我还没有坐过火车。',
          pinyin: 'Zài zhōng guó wǒ hái méi yǒu zuò guò huǒ chē。',
          vi: 'Ở Trung Quốc, tôi chưa từng đi tàu hoả.'
        }
      ]
    },
    {
      id: 'ep-ps-05ybuuaoiw0',
      youtubeId: '05yBuuAoiw0',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '10 hội thoại đời sống chủ đề mua sắm LUYỆN NGHE TIẾNG TRUNG THỤ ĐỘNG',
      titleVi: '10 hội thoại tiếng Trung chủ đề mua sắm',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 521,
      durationLabel: '8:41',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 149 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/05yBuuAoiw0.json',
      cuesCount: 149,
      cues: [
        {
          start: 0.86,
          end: 2.82,
          en: 'How much is a jin of grapes?',
          zh: '葡萄多少钱一斤?',
          pinyin: 'Pú táo duō shǎo qián yì jīn?',
          vi: 'Nho bao nhiêu tiền một cân?'
        },
        {
          start: 18.5,
          end: 22.18,
          en: 'I\'ll take a jin of bananas and two jin of grapes.',
          zh: '来一斤香蕉,两斤葡萄吧',
          pinyin: 'Lái yì jīn xiāng jiāo, liǎng jīn pú táo ba',
          vi: 'Lấy một cân chuối và hai cân nho.'
        },
        {
          start: 22.9,
          end: 23.42,
          en: 'Okay.',
          zh: '好的',
          pinyin: 'Hǎo de',
          vi: 'Được ạ.'
        }
      ]
    },
    {
      id: 'ep-ps-0v-ce5g3ukc',
      youtubeId: '0V-ce5G3UKc',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '100 câu giao tiếp TIẾNG TRUNG cho người đi làm【TIẾNG TRUNG CHO NGƯỜI ĐI LÀM - BÀI 1】',
      titleVi: '100 câu giao tiếp tiếng Trung cho người đi làm',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 1404,
      durationLabel: '23:24',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 251 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/0V-ce5G3UKc.json',
      cuesCount: 251,
      cues: [
        {
          start: 2.22,
          end: 4.8,
          en: 'Every day on the program we learn 100 Chinese sentences.',
          zh: '我们每天在节目中学习个中文句子。',
          pinyin: 'Wǒ men měi tiān zài jié mù zhōng xué xí gè zhōng wén jù zi。',
          vi: 'Mỗi ngày trong chương trình, chúng ta học 100 câu tiếng Trung.'
        },
        {
          start: 4.84,
          end: 7.42,
          en: 'Each sentence will be read 5 times.',
          zh: '每个句子会读5次。',
          pinyin: 'Měi gè jù zi huì dú 5 cì。',
          vi: 'Mỗi câu sẽ được đọc 5 lần.'
        },
        {
          start: 7.88,
          end: 9.04,
          en: 'Including 2 Chinese sentences.',
          zh: '包括2个中文句子。',
          pinyin: 'Bāo kuò 2 gè zhōng wén jù zi。',
          vi: 'Bao gồm 2 câu tiếng Trung.'
        }
      ]
    },
    {
      id: 'ep-ps-0ix7necyz08',
      youtubeId: '0iX7nEcYz08',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Bạn bao nhiêu tuổi rồi ?',
      titleVi: 'Bạn bao nhiêu tuổi rồi?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 43,
      durationLabel: '0:43',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 6 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/0iX7nEcYz08.json',
      cuesCount: 6,
      cues: [
        {
          start: 9.34,
          end: 11.26,
          en: 'How old do you think I am?',
          zh: '你觉得我多大了',
          pinyin: 'Nǐ jué de wǒ duō dà le',
          vi: 'Bạn nghĩ tôi bao nhiêu tuổi?'
        },
        {
          start: 19.94,
          end: 20.62,
          en: 'how old',
          zh: '多大',
          pinyin: 'Duō dà',
          vi: 'bao nhiêu tuổi'
        },
        {
          start: 23.98,
          end: 24.38,
          en: 'to think; to feel',
          zh: '觉得',
          pinyin: 'Jué de',
          vi: 'nghĩ; cảm thấy'
        }
      ]
    },
    {
      id: 'ep-ps-0ticljv1vog',
      youtubeId: '0ticLJv1VOg',
      level: 'HSK 4+',
      levelGroup: 'hsk4',
      title: '【HSK 4-6】中国人为什么喜欢买黄金 - Tại sao người Trung Quốc thích mua vàng | Chinese Podcast',
      titleVi: 'Vì sao người Trung Quốc thích mua vàng',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 225,
      durationLabel: '3:45',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 63 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/0ticLJv1VOg.json',
      cuesCount: 63,
      cues: [
        {
          start: 5.52,
          end: 7.76,
          en: 'Recently, have you all been following the news?',
          zh: '最近，大家有没有关注新闻？',
          pinyin: 'Zuì jìn， dà jiā yǒu méi yǒu guān zhù xīn wén？',
          vi: 'Gần đây, mọi người có theo dõi tin tức không?'
        },
        {
          start: 8.92,
          end: 11.3,
          en: 'The price of gold is getting higher and higher.',
          zh: '黄金的价格越来越高了。',
          pinyin: 'Huáng jīn de jià gé yuè lái yuè gāo le。',
          vi: 'Giá vàng ngày càng cao.'
        },
        {
          start: 13.24,
          end: 14.58,
          en: 'But in shopping malls in China,',
          zh: '但是，在中国的商场里，',
          pinyin: 'Dàn shì， zài zhōng guó de shāng chǎng lǐ，',
          vi: 'Nhưng trong các trung tâm thương mại ở Trung Quốc,'
        }
      ]
    },
    {
      id: 'ep-ps-1e5doyasa9u',
      youtubeId: '1E5DoYaSa9U',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe TIẾNG TRUNG thụ động【VIDEO #4】Đi ăn và đi uống',
      titleVi: 'Đi ăn và đi uống',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 291,
      durationLabel: '4:51',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 42 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/1E5DoYaSa9U.json',
      cuesCount: 42,
      cues: [
        {
          start: 20.42,
          end: 21.14,
          en: 'Please sit here.',
          zh: '这边坐。',
          pinyin: 'Zhè biān zuò。',
          vi: 'Mời ngồi bên này.'
        },
        {
          start: 24.88,
          end: 25.3,
          en: 'Okay.',
          zh: '好的。',
          pinyin: 'Hǎo de。',
          vi: 'Vâng.'
        },
        {
          start: 29.06,
          end: 29.76,
          en: 'What would you like to drink?',
          zh: '你们喝什么？',
          pinyin: 'Nǐ men hē shén me？',
          vi: 'Các bạn uống gì?'
        }
      ]
    },
    {
      id: 'ep-ps-1myk8xmp9n4',
      youtubeId: '1mYK8xMp9n4',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Tôi muốn mua trà sữa trân châu',
      titleVi: 'Tôi muốn mua trà sữa trân châu',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 67,
      durationLabel: '1:07',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 5 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/1mYK8xMp9n4.json',
      cuesCount: 5,
      cues: [
        {
          start: 0.56,
          end: 6.98,
          en: 'I\'ll have a pearl milk tea.',
          zh: '我一杯珍珠奶茶',
          pinyin: 'Wǒ yì bēi zhēn zhū nǎi chá',
          vi: 'Cho tôi một ly trà sữa trân châu.'
        },
        {
          start: 9.18,
          end: 11.18,
          en: 'Would you like a medium or a large?',
          zh: '你要中杯或是大杯',
          pinyin: 'Nǐ yào zhōng bēi huò shì dà bēi',
          vi: 'Bạn muốn ly vừa hay ly lớn?'
        },
        {
          start: 20.36,
          end: 21.98,
          en: 'Half sugar, less ice.',
          zh: '半糖,少冰',
          pinyin: 'Bàn táng, shǎo bīng',
          vi: 'Nửa đường, ít đá.'
        }
      ]
    },
    {
      id: 'ep-ps-1npzoy6dur4',
      youtubeId: '1npzoy6Dur4',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn bố mẹ không ở nhà bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Đoạn văn: Bố mẹ không ở nhà',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 164,
      durationLabel: '2:44',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 22 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/1npzoy6Dur4.json',
      cuesCount: 22,
      cues: [
        {
          start: 3.44,
          end: 5.48,
          en: 'Mom and Dad are not at home.',
          zh: '爸爸妈妈不在家',
          pinyin: 'Bà ba mā ma bú zài jiā',
          vi: 'Bố mẹ không ở nhà.'
        },
        {
          start: 8.02,
          end: 22.3,
          en: 'Today, Mom and Dad are not at home.',
          zh: '今天爸爸妈妈不在家',
          pinyin: 'Jīn tiān bà ba mā ma bú zài jiā',
          vi: 'Hôm nay bố mẹ không ở nhà.'
        },
        {
          start: 23.32,
          end: 26.62,
          en: 'My younger brother, younger sister, and I are at home.',
          zh: '我和弟弟妹妹在家',
          pinyin: 'Wǒ hé dì di mèi mei zài jiā',
          vi: 'Tôi và em trai, em gái ở nhà.'
        }
      ]
    },
    {
      id: 'ep-ps-21mul9wxvjs',
      youtubeId: '21Mul9WxVJs',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Gọi xe taxi',
      titleVi: 'Hội thoại ngắn tiếng Trung: Gọi xe taxi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 113,
      durationLabel: '1:53',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 16 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/21Mul9WxVJs.json',
      cuesCount: 16,
      cues: [
        {
          start: 30,
          end: 39.14,
          en: 'I\'m not sure. Otherwise, let\'s take another road — then we can get there in about 20 minutes.',
          zh: '不清楚，要不我们换一条路走吧，这样大概分钟就能到了。',
          pinyin: 'Bù qīng chǔ， yào bù wǒ men huàn yì tiáo lù zǒu ba， zhè yàng dà gài fēn zhōng jiù néng dào le。',
          vi: 'Không rõ nữa, hay là chúng ta đi đường khác đi, vậy khoảng 20 phút là đến.'
        },
        {
          start: 41.82,
          end: 42.44,
          en: 'Great!',
          zh: '太好了！',
          pinyin: 'Tài hǎo le！',
          vi: 'Tuyệt quá!'
        },
        {
          start: 45.3,
          end: 50.34,
          en: 'Please fasten your seatbelt. I\'m going to turn now. Would you like to listen to the radio?',
          zh: '请您系好安全带，我要转弯了，您想听收音机吗？',
          pinyin: 'Qǐng nín xì hǎo ān quán dài， wǒ yào zhuǎn wān le， nín xiǎng tīng shōu yīn jī ma？',
          vi: 'Mời anh/chị thắt dây an toàn, tôi sắp rẽ đây, anh/chị có muốn nghe radio không?'
        }
      ]
    },
    {
      id: 'ep-ps-25u1iv4cwrq',
      youtubeId: '25U1iv4cWrQ',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG #6 : Chủ đề đi chơi, đi du lịch',
      titleVi: 'Luyện nghe hội thoại tiếng Trung: Chủ đề đi chơi, đi du lịch',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 107,
      durationLabel: '1:47',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 24 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/25U1iv4cWrQ.json',
      cuesCount: 24,
      cues: [
        {
          start: 2.66,
          end: 5.78,
          en: 'During winter and summer breaks, I often go.',
          zh: '寒假、暑假的时候，我经常去。',
          pinyin: 'Hán jià、 shǔ jià de shí hòu， wǒ jīng cháng qù。',
          vi: 'Vào dịp nghỉ đông và nghỉ hè, tôi thường hay đi.'
        },
        {
          start: 9.68,
          end: 12.42,
          en: 'I\'ve never been abroad.',
          zh: '外国我还没去过。',
          pinyin: 'Wài guó wǒ hái méi qù guò。',
          vi: 'Nước ngoài tôi vẫn chưa đi bao giờ.'
        },
        {
          start: 15.28,
          end: 18.1,
          en: 'I want to travel to Tianjin. What\'s the best way to get there?',
          zh: '我想去天津旅游，怎么去好？',
          pinyin: 'Wǒ xiǎng qù tiān jīn lǚ yóu， zěn me qù hǎo？',
          vi: 'Tôi muốn đi du lịch Thiên Tân, đi thế nào thì tốt?'
        }
      ]
    },
    {
      id: 'ep-ps-2dwmbtyinpu',
      youtubeId: '2DWMBTyinpU',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '100 câu TIẾNG TRUNG giao tiếp với sếp, đồng nghiệp【TIẾNG TRUNG CHO NGƯỜI ĐI LÀM - BÀI 3】',
      titleVi: 'Giao tiếp tiếng Trung với sếp và đồng nghiệp',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 2148,
      durationLabel: '35:48',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 272 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/2DWMBTyinpU.json',
      cuesCount: 272,
      cues: [
        {
          start: 23.2,
          end: 24.74,
          en: 'Good morning, Manager Wang.',
          zh: '王经理，早上好。',
          pinyin: 'Wáng jīng lǐ， zǎo shàng hǎo。',
          vi: 'Chào buổi sáng, giám đốc Vương.'
        },
        {
          start: 29.88,
          end: 31.7,
          en: 'Did you drive here today?',
          zh: '今天您开车来的吗？',
          pinyin: 'Jīn tiān nín kāi chē lái de ma？',
          vi: 'Hôm nay anh/chị lái ô tô đến à?'
        },
        {
          start: 33.32,
          end: 35.46,
          en: 'Did you drive here today?',
          zh: '今天您开车来的吗？',
          pinyin: 'Jīn tiān nín kāi chē lái de ma？',
          vi: 'Hôm nay anh/chị lái ô tô đến à?'
        }
      ]
    },
    {
      id: 'ep-ps-2kvuuraropk',
      youtubeId: '2KvuuraroPk',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Các mẫu câu giao tiếp khi đi chợ trong TIẾNG TRUNG',
      titleVi: 'Các mẫu câu giao tiếp khi đi chợ trong tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 540,
      durationLabel: '9:00',
      topic: 'Từ vựng & Mẫu câu HSK 3',
      note: 'Trọn bộ 117 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/2KvuuraroPk.json',
      cuesCount: 117,
      cues: [
        {
          start: 30,
          end: 31.84,
          en: 'market',
          zh: '市场',
          pinyin: 'Shì chǎng',
          vi: 'chợ'
        },
        {
          start: 37.66,
          end: 42.32,
          en: 'Where is the biggest market in this city?',
          zh: '这个城市最大的市场在哪里?',
          pinyin: 'Zhè ge chéng shì zuì dà de shì chǎng zài nǎ lǐ?',
          vi: 'Chợ lớn nhất của thành phố này ở đâu?'
        },
        {
          start: 48.34,
          end: 49.84,
          en: 'seafood market',
          zh: '海鲜市场',
          pinyin: 'Hǎi xiān shì chǎng',
          vi: 'chợ hải sản'
        }
      ]
    },
    {
      id: 'ep-ps-2xhhzefmqdw',
      youtubeId: '2XhhZEFMQDw',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'TIẾNG TRUNG GIAO TIẾP chủ đề phỏng vấn xin việc',
      titleVi: 'Phỏng vấn xin việc',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 595,
      durationLabel: '9:55',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 68 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/2XhhZEFMQDw.json',
      cuesCount: 68,
      cues: [
        {
          start: 30,
          end: 30.35,
          en: 'HR / personnel',
          zh: '人事',
          pinyin: 'Rén shì',
          vi: 'nhân sự'
        },
        {
          start: 32.24,
          end: 34.96,
          en: 'second',
          zh: '第二',
          pinyin: 'Dì èr',
          vi: 'thứ hai'
        },
        {
          start: 36.78,
          end: 37.4,
          en: 'apply (for a job)',
          zh: '应聘',
          pinyin: 'Yìng pìn',
          vi: 'ứng tuyển'
        }
      ]
    },
    {
      id: 'ep-ps-2mkgniiihi4',
      youtubeId: '2mKgniIiHi4',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG : Giao tiếp trò chuyện bạn bè | 朋友聊天',
      titleVi: 'Giao tiếp trò chuyện bạn bè',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 503,
      durationLabel: '8:23',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 173 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/2mKgniIiHi4.json',
      cuesCount: 173,
      cues: [
        {
          start: 19.5,
          end: 19.85,
          en: 'It\'s me.',
          zh: '是我。',
          pinyin: 'Shì wǒ。',
          vi: 'Là tôi.'
        },
        {
          start: 21.5,
          end: 22,
          en: 'Who is it?',
          zh: '是谁？',
          pinyin: 'Shì shuí？',
          vi: 'Ai vậy?'
        },
        {
          start: 23.5,
          end: 23.85,
          en: 'I\'m the police!',
          zh: '我是警察！',
          pinyin: 'Wǒ shì jǐng chá！',
          vi: 'Tôi là cảnh sát!'
        }
      ]
    },
    {
      id: 'ep-ps-3jpahn19h2a',
      youtubeId: '3JpaHN19h2A',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe TIẾNG TRUNG thụ động【VIDEO #2】Xin lỗi và cảm ơn',
      titleVi: 'Xin lỗi và cảm ơn',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 212,
      durationLabel: '3:32',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 26 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/3JpaHN19h2A.json',
      cuesCount: 26,
      cues: [
        {
          start: 3.72,
          end: 6.02,
          en: 'Video two: apologies and thanks.',
          zh: '视频第二，对不起和感谢。',
          pinyin: 'Shì pín dì èr， duì bù qǐ hé gǎn xiè。',
          vi: 'Video thứ hai: xin lỗi và cảm ơn.'
        },
        {
          start: 30,
          end: 35.46,
          en: 'Don\'t worry, take it slow.',
          zh: '你别着急，慢点。',
          pinyin: 'Nǐ bié zháo jí， màn diǎn。',
          vi: 'Đừng vội, từ từ.'
        },
        {
          start: 39.22,
          end: 40,
          en: 'See you in a little while.',
          zh: '一会儿见。',
          pinyin: 'Yí huì er jiàn。',
          vi: 'Hẹn gặp lại lát nữa.'
        }
      ]
    },
    {
      id: 'ep-ps-3csxciqdn1u',
      youtubeId: '3csxciQDn1U',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Tôi muốn mua rau',
      titleVi: 'Tôi muốn mua rau',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 160,
      durationLabel: '2:40',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 27 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/3csxciQDn1U.json',
      cuesCount: 27,
      cues: [
        {
          start: 32.16,
          end: 33.42,
          en: 'Please weigh it for me.',
          zh: '请帮我称一下',
          pinyin: 'Qǐng bāng wǒ chēng yí xià',
          vi: 'Nhờ bạn cân giúp một chút.'
        },
        {
          start: 35.5,
          end: 37.38,
          en: 'Two and a half jin, ten yuan.',
          zh: '两斤五两，十元。',
          pinyin: 'Liǎng jīn wǔ liǎng， shí yuán。',
          vi: 'Hai cân rưỡi, mười tệ.'
        },
        {
          start: 41.96,
          end: 44.04,
          en: 'Excuse me, do you have steak?',
          zh: '请问，有牛排吗？',
          pinyin: 'Qǐng wèn， yǒu niú pái ma？',
          vi: 'Cho hỏi, có bít tết bò không?'
        }
      ]
    },
    {
      id: 'ep-ps-3hqkllw5mho',
      youtubeId: '3hQKlLW5MHo',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Nhà bạn cách xa công ty không ?',
      titleVi: 'Hội thoại ngắn: Nhà bạn cách xa công ty không?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 52,
      durationLabel: '0:52',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 12 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/3hQKlLW5MHo.json',
      cuesCount: 12,
      cues: [
        {
          start: 0.6,
          end: 6.34,
          en: 'Is your home far from the company?',
          zh: '你家离公司远吗?',
          pinyin: 'Nǐ jiā lí gōng sī yuǎn ma?',
          vi: 'Nhà bạn cách công ty có xa không?'
        },
        {
          start: 8,
          end: 10.88,
          en: 'It takes over an hour by bus.',
          zh: '坐公共汽车要一个多小时呢',
          pinyin: 'Zuò gōng gòng qì chē yào yí gè duō xiǎo shí ne',
          vi: 'Đi xe buýt mất hơn một tiếng đấy.'
        },
        {
          start: 11.64,
          end: 13.6,
          en: 'Taking the bus is too slow.',
          zh: '坐公共汽车太慢了',
          pinyin: 'Zuò gōng gòng qì chē tài màn le',
          vi: 'Đi xe buýt thì quá chậm.'
        }
      ]
    },
    {
      id: 'ep-ps-3lvg7eetjja',
      youtubeId: '3lVG7eeTjJA',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '80 câu hỏi đáp TIẾNG TRUNG chủ đề tìm hiểu gia đình【LUYỆN NGHE TIẾNG TRUNG THỤ ĐỘNG】',
      titleVi: '80 câu hỏi đáp tiếng Trung chủ đề gia đình',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 1200,
      durationLabel: '20:00',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 183 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/3lVG7eeTjJA.json',
      cuesCount: 183,
      cues: [
        {
          start: 0.02,
          end: 8.18,
          en: 'Excuse me, how many people are in your family?',
          zh: '请问你家有几口人?',
          pinyin: 'Qǐng wèn nǐ jiā yǒu jǐ kǒu rén?',
          vi: 'Xin hỏi, nhà bạn có mấy người?'
        },
        {
          start: 13.14,
          end: 15.12,
          en: 'Excuse me, how many people are in your family?',
          zh: '请问你家有几口人?',
          pinyin: 'Qǐng wèn nǐ jiā yǒu jǐ kǒu rén?',
          vi: 'Xin hỏi, nhà bạn có mấy người?'
        },
        {
          start: 18.04,
          end: 19.76,
          en: 'My family has five people.',
          zh: '我家有五口人。',
          pinyin: 'Wǒ jiā yǒu wǔ kǒu rén。',
          vi: 'Nhà tôi có năm người.'
        }
      ]
    },
    {
      id: 'ep-ps-3rv-ftx5gie',
      youtubeId: '3rv-fTx5giE',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Nói về một ngày của tôi bằng TIẾNG TRUNG',
      titleVi: 'Nói về một ngày của tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 332,
      durationLabel: '5:32',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 74 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/3rv-fTx5giE.json',
      cuesCount: 74,
      cues: [
        {
          start: 30,
          end: 33.28,
          en: 'At six-thirty in the morning.',
          zh: '早上六点半',
          pinyin: 'Zǎo shàng liù diǎn bàn',
          vi: 'Sáu giờ rưỡi sáng.'
        },
        {
          start: 34.22,
          end: 38.88,
          en: 'I heard my roommate\'s voice calling me to get up.',
          zh: '我听到同屋的声音叫我起床',
          pinyin: 'Wǒ tīng dào tóng wū de shēng yīn jiào wǒ qǐ chuáng',
          vi: 'Tôi nghe tiếng bạn cùng phòng gọi tôi dậy.'
        },
        {
          start: 40.52,
          end: 41.8,
          en: 'Hurry up and get up!',
          zh: '快起床啊',
          pinyin: 'Kuài qǐ chuáng a',
          vi: 'Dậy nhanh lên!'
        }
      ]
    },
    {
      id: 'ep-ps-4k_rrgmqh_w',
      youtubeId: '4K_rRGMqh_w',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Tôi muốn mua bột sủi cảo',
      titleVi: 'Hội thoại ngắn tiếng Trung: Tôi muốn mua bột sủi cảo',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 106,
      durationLabel: '1:46',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 18 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/4K_rRGMqh_w.json',
      cuesCount: 18,
      cues: [
        {
          start: 5.14,
          end: 9.36,
          en: 'Hello, I\'d like to buy a bag of dumpling flour, but I can\'t find it. Why?',
          zh: '您好，我想买一袋饺子面粉，怎么找不到呢？',
          pinyin: 'Nín hǎo， wǒ xiǎng mǎi yí dài jiǎo zǐ miàn fěn， zěn me zhǎo bú dào ne？',
          vi: 'Xin chào, tôi muốn mua một túi bột sủi cảo, sao lại không tìm thấy nhỉ?'
        },
        {
          start: 12.16,
          end: 18.98,
          en: 'Hello, dumpling flour is in the rice, flour, and oil section. It should be at the bottom of the shelf. Could you take a look and see if you can find it?',
          zh: '您好，饺子粉在米面粮油区，应该在货架的底部，您看看能找到吗？',
          pinyin: 'Nín hǎo， jiǎo zǐ fěn zài mǐ miàn liáng yóu qū， yīng gāi zài huò jià de dǐ bù， nín kàn kàn néng zhǎo dào ma？',
          vi: 'Xin chào, bột sủi cảo ở khu gạo, mì, dầu ăn; chắc là nằm ở tầng dưới cùng của kệ hàng. Bạn xem có tìm thấy không?'
        },
        {
          start: 21.58,
          end: 26.32,
          en: 'No, I haven\'t. The sign says it\'s there, but I just can\'t find it.',
          zh: '没有呢，只是牌子上写着有，但是始终没有找到。',
          pinyin: 'Méi yǒu ne， zhǐ shì pái zi shàng xiě zhe yǒu， dàn shì shǐ zhōng méi yǒu zhǎo dào。',
          vi: 'Không có đâu, chỉ là trên bảng ghi là có, nhưng tôi vẫn không tìm thấy.'
        }
      ]
    },
    {
      id: 'ep-ps-4dgln4vbkwk',
      youtubeId: '4dGLn4vbKWk',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Địa chỉ nhà bạn ở đâu ?',
      titleVi: 'Hội thoại ngắn tiếng Trung: Địa chỉ nhà bạn ở đâu?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 58,
      durationLabel: '0:58',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 14 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/4dGLn4vbKWk.json',
      cuesCount: 14,
      cues: [
        {
          start: 0.46,
          end: 7.32,
          en: 'What is your home address?',
          zh: '你家里的地址是什么？',
          pinyin: 'Nǐ jiā lǐ de dì zhǐ shì shén me？',
          vi: 'Địa chỉ nhà bạn là gì?'
        },
        {
          start: 8.78,
          end: 14.64,
          en: 'My home address is No. 135 Nanjing Road.',
          zh: '我家里的地址是南京路号。',
          pinyin: 'Wǒ jiā lǐ de dì zhǐ shì nán jīng lù hào。',
          vi: 'Địa chỉ nhà tôi là số 135 đường Nam Kinh.'
        },
        {
          start: 19.36,
          end: 19.71,
          en: 'Yes, that\'s right.',
          zh: '是的。',
          pinyin: 'Shì de。',
          vi: 'Đúng vậy.'
        }
      ]
    },
    {
      id: 'ep-ps-4jjpd8vt3wi',
      youtubeId: '4jJPd8Vt3wI',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe TIẾNG TRUNG thụ động【VIDEO #5】Đi chơi ngắm cảnh',
      titleVi: 'Đi chơi ngắm cảnh',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 299,
      durationLabel: '4:59',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 43 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/4jJPd8Vt3wI.json',
      cuesCount: 43,
      cues: [
        {
          start: 0.22,
          end: 11.52,
          en: 'Excuse me, where is the restroom?',
          zh: '请问厕所在哪里？',
          pinyin: 'Qǐng wèn cè suǒ zài nǎ lǐ？',
          vi: 'Xin hỏi, nhà vệ sinh ở đâu?'
        },
        {
          start: 26.56,
          end: 30.64,
          en: 'Go straight ahead, then turn right.',
          zh: '一直往前走，然后右转。',
          pinyin: 'Yì zhí wǎng qián zǒu， rán hòu yòu zhuǎn。',
          vi: 'Đi thẳng về phía trước, sau đó rẽ phải.'
        },
        {
          start: 34.68,
          end: 36.08,
          en: 'Where is the post office?',
          zh: '邮局在哪里？',
          pinyin: 'Yóu jú zài nǎ lǐ？',
          vi: 'Bưu điện ở đâu?'
        }
      ]
    },
    {
      id: 'ep-ps-53tsj0fs31a',
      youtubeId: '53TSJ0Fs31A',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Mua giày mới',
      titleVi: 'Hội thoại ngắn tiếng Trung: Mua giày mới',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 140,
      durationLabel: '2:20',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 20 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/53TSJ0Fs31A.json',
      cuesCount: 20,
      cues: [
        {
          start: 5.58,
          end: 8.52,
          en: 'Welcome, how can I help you?',
          zh: '欢迎光临，有什么可以帮您的吗？',
          pinyin: 'Huān yíng guāng lín， yǒu shén me kě yǐ bāng nín de ma？',
          vi: 'Chào mừng quý khách, tôi có thể giúp gì cho bạn không?'
        },
        {
          start: 10.54,
          end: 11.48,
          en: 'I\'d like to just look around by myself first.',
          zh: '我想先自己看看。',
          pinyin: 'Wǒ xiǎng xiān zì jǐ kàn kàn。',
          vi: 'Tôi muốn tự mình xem trước đã.'
        },
        {
          start: 14.5,
          end: 17.7,
          en: 'Okay, if you need anything, just call me.',
          zh: '好的，如果有需要，请叫我。',
          pinyin: 'Hǎo de， rú guǒ yǒu xū yào， qǐng jiào wǒ。',
          vi: 'Được, nếu cần gì thì cứ gọi tôi nhé.'
        }
      ]
    },
    {
      id: 'ep-ps-5hv6f4acdp4',
      youtubeId: '5HV6f4AcDp4',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG #1 : Chào hỏi cơ bản',
      titleVi: 'Hội thoại chào hỏi cơ bản',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 110,
      durationLabel: '1:50',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 31 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/5HV6f4AcDp4.json',
      cuesCount: 31,
      cues: [
        {
          start: 0.44,
          end: 7.4,
          en: 'Let me introduce everyone. This is Mr. Li, and this is Miss Zhang.',
          zh: '我来介绍一下，这位是李先生，这位是张小姐。',
          pinyin: 'Wǒ lái jiè shào yí xià， zhè wèi shì lǐ xiān shēng， zhè wèi shì zhāng xiǎo jiě。',
          vi: 'Tôi xin giới thiệu một chút, đây là anh Lý, đây là chị Trương.'
        },
        {
          start: 15.26,
          end: 17.08,
          en: 'Your Chinese is really good.',
          zh: '你汉语说得真不错。',
          pinyin: 'Nǐ hàn yǔ shuō dé zhēn bú cuò。',
          vi: 'Bạn nói tiếng Trung thật giỏi.'
        },
        {
          start: 18.38,
          end: 20.44,
          en: 'Not at all, I still have a long way to go.',
          zh: '哪儿啊，还差得远呢！',
          pinyin: 'Nǎ ér a， hái chà dé yuǎn ne！',
          vi: 'Đâu có, còn kém xa lắm!'
        }
      ]
    },
    {
      id: 'ep-ps-5kd4du7pqww',
      youtubeId: '5KD4DU7PQWw',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Tôi thích chạy bộ - LUYỆN ĐỌC TIẾNG TRUNG HSK 3',
      titleVi: 'Tôi thích chạy bộ',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 211,
      durationLabel: '3:31',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 20 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/5KD4DU7PQWw.json',
      cuesCount: 20,
      cues: [
        {
          start: 5.76,
          end: 18.72,
          en: 'My favorite sport is running.',
          zh: '我最喜欢的运动是跑步',
          pinyin: 'Wǒ zuì xǐ huan de yùn dòng shì pǎo bù',
          vi: 'Môn thể thao tôi thích nhất là chạy bộ.'
        },
        {
          start: 20.54,
          end: 23.34,
          en: 'Running not only makes me healthy,',
          zh: '跑步不仅能让我健康',
          pinyin: 'Pǎo bù bù jǐn néng ràng wǒ jiàn kāng',
          vi: 'Chạy bộ không chỉ khiến tôi khỏe mạnh,'
        },
        {
          start: 24.98,
          end: 26.36,
          en: 'but also helps me relax.',
          zh: '还能让我放松',
          pinyin: 'Hái néng ràng wǒ fàng sōng',
          vi: 'mà còn giúp tôi thư giãn.'
        }
      ]
    },
    {
      id: 'ep-ps-5nzuwy7wrh4',
      youtubeId: '5NzuWY7wrh4',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Tôi muốn mua bao cao su',
      titleVi: 'Tôi muốn mua bao cao su',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 53,
      durationLabel: '0:53',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 7 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/5NzuWY7wrh4.json',
      cuesCount: 7,
      cues: [
        {
          start: 20.38,
          end: 22.88,
          en: 'give',
          zh: '给',
          pinyin: 'Gěi',
          vi: 'đưa cho'
        },
        {
          start: 27.44,
          end: 28.06,
          en: 'condom',
          zh: '避孕套',
          pinyin: 'Bì yùn tào',
          vi: 'bao cao su'
        },
        {
          start: 31.44,
          end: 31.8,
          en: 'want',
          zh: '要',
          pinyin: 'Yào',
          vi: 'muốn'
        }
      ]
    },
    {
      id: 'ep-ps-5syzzutyum4',
      youtubeId: '5SYZZuTYuM4',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Tôi muốn trả hàng',
      titleVi: 'Hội thoại ngắn tiếng Trung: Tôi muốn trả hàng',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 65,
      durationLabel: '1:05',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 13 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/5SYZZuTYuM4.json',
      cuesCount: 13,
      cues: [
        {
          start: 6.7,
          end: 8.72,
          en: 'Excuse me, is there any problem?',
          zh: '请问有什么问题吗?',
          pinyin: 'Qǐng wèn yǒu shén me wèn tí ma?',
          vi: 'Xin hỏi có vấn đề gì không?'
        },
        {
          start: 9.78,
          end: 14.46,
          en: 'I just bought this the day before yesterday, and it\'s already broken. See for yourself.',
          zh: '这个我前天刚买,已经坏了,你自己看',
          pinyin: 'Zhè ge wǒ qián tiān gāng mǎi, yǐ jīng huài le, nǐ zì jǐ kàn',
          vi: 'Cái này tôi mới mua hôm kia, đã hỏng rồi, anh tự xem đi.'
        },
        {
          start: 18.8,
          end: 20.54,
          en: 'Oh no, I forgot to bring it.',
          zh: '哎呀,忘带了',
          pinyin: 'Āi yā, wàng dài le',
          vi: 'Ôi, tôi quên mang theo rồi.'
        }
      ]
    },
    {
      id: 'ep-ps-5uhr3g2ni5c',
      youtubeId: '5UHR3g2nI5c',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Khám nha sĩ',
      titleVi: 'Hội thoại khám nha sĩ',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 109,
      durationLabel: '1:49',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 22 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/5UHR3g2nI5c.json',
      cuesCount: 22,
      cues: [
        {
          start: 0.86,
          end: 6.02,
          en: 'Hello, what\'s wrong with your tooth?',
          zh: '你好，请问你的牙怎么了？',
          pinyin: 'Nǐ hǎo， qǐng wèn nǐ de yá zěn me le？',
          vi: 'Chào bạn, răng của bạn bị làm sao vậy?'
        },
        {
          start: 19.8,
          end: 23.36,
          en: 'Okay, please sit in the chair first, and I\'ll do an examination.',
          zh: '好，你先坐到椅子上，我来检查一下。',
          pinyin: 'Hǎo， nǐ xiān zuò dào yǐ zi shàng， wǒ lái jiǎn chá yí xià。',
          vi: 'Được, bạn ngồi lên ghế trước, tôi kiểm tra một chút.'
        },
        {
          start: 24.46,
          end: 25.1,
          en: 'Open your mouth.',
          zh: '张开嘴。',
          pinyin: 'Zhāng kāi zuǐ。',
          vi: 'Há miệng ra.'
        }
      ]
    },
    {
      id: 'ep-ps-5yhdbd_0hkc',
      youtubeId: '5YHdBd_0Hkc',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: '50 đoạn đàm thoại LUYỆN NGHE TIẾNG TRUNG - HSK 2',
      titleVi: '50 đoạn hội thoại luyện nghe tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 923,
      durationLabel: '15:23',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 283 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/5YHdBd_0Hkc.json',
      cuesCount: 283,
      cues: [
        {
          start: 30.4,
          end: 33.76,
          en: 'Let\'s go play soccer together this afternoon.',
          zh: '下午我们一起去踢足球吧。',
          pinyin: 'Xià wǔ wǒ men yì qǐ qù tī zú qiú ba。',
          vi: 'Chiều nay chúng ta cùng đi đá bóng nhé.'
        },
        {
          start: 35.42,
          end: 35.88,
          en: 'Okay.',
          zh: '好啊。',
          pinyin: 'Hǎo a。',
          vi: 'Được thôi.'
        },
        {
          start: 38.88,
          end: 41.7,
          en: 'Should we buy some new chairs?',
          zh: '我们要不要买几个新的椅子？',
          pinyin: 'Wǒ men yào bu yào mǎi jǐ gè xīn de yǐ zi？',
          vi: 'Chúng ta có nên mua vài cái ghế mới không?'
        }
      ]
    },
    {
      id: 'ep-ps-5jmauhyibyk',
      youtubeId: '5jMAUHyIbyk',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe TIẾNG TRUNG thụ động【VIDEO #9】Mua sắm và thanh toán',
      titleVi: 'Mua sắm và thanh toán',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 256,
      durationLabel: '4:16',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 39 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/5jMAUHyIbyk.json',
      cuesCount: 39,
      cues: [
        {
          start: 30.94,
          end: 31.38,
          en: 'classifier for pens/long thin objects',
          zh: '支',
          pinyin: 'Zhī',
          vi: 'cây (lượng từ cho bút, vật dài)'
        },
        {
          start: 35.28,
          end: 36.44,
          en: 'ballpoint pen',
          zh: '圆珠笔',
          pinyin: 'Yuán zhū bǐ',
          vi: 'bút bi'
        },
        {
          start: 41.22,
          end: 41.96,
          en: 'red',
          zh: '红',
          pinyin: 'Hóng',
          vi: 'đỏ'
        }
      ]
    },
    {
      id: 'ep-ps-6uqtm31eh0m',
      youtubeId: '6UQtm31Eh0M',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Giới thiệu bản thân và trường đại học bằng TIẾNG TRUNG',
      titleVi: 'Giới thiệu bản thân và trường đại học bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 228,
      durationLabel: '3:48',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 54 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/6UQtm31Eh0M.json',
      cuesCount: 54,
      cues: [
        {
          start: 12.1,
          end: 14.98,
          en: 'Today I will introduce myself and my university.',
          zh: '今天我会介绍我自己和我的大学。',
          pinyin: 'Jīn tiān wǒ huì jiè shào wǒ zì jǐ hé wǒ de dà xué。',
          vi: 'Hôm nay tôi sẽ giới thiệu về bản thân và trường đại học của tôi.'
        },
        {
          start: 15.78,
          end: 20,
          en: 'I am Haiyan; \'Hai\' is the \'hai\' in \'dahai\' (ocean), and \'Yan\' is the \'yan\' in \'yanzi\' (swallow).',
          zh: '我是海燕，海是大海的海，燕是燕子的燕。',
          pinyin: 'Wǒ shì hǎi yàn， hǎi shì dà hǎi de hǎi， yàn shì yàn zi de yàn。',
          vi: 'Tôi là Hải Yến, Hải là biển cả, Yến là chim yến.'
        },
        {
          start: 20.06,
          end: 24.98,
          en: 'I am 19 this year, a second-year student in the Chinese Department at Hanoi University.',
          zh: '今年岁，是河内大学中文系二年级的学生。',
          pinyin: 'Jīn nián suì， shì hé nèi dà xué zhōng wén xì èr nián jí de xué shēng。',
          vi: 'Năm nay tôi 19 tuổi, là sinh viên năm hai khoa tiếng Trung của Đại học Hà Nội.'
        }
      ]
    },
    {
      id: 'ep-ps-6ygjswsoryw',
      youtubeId: '6YGJswSorYw',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: '【HSK 1-3】简单的生活 - Cuộc sống giản đơn | Chinese Podcast',
      titleVi: 'Cuộc sống giản đơn',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 300,
      durationLabel: '5:00',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 84 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/6YGJswSorYw.json',
      cuesCount: 84,
      cues: [
        {
          start: 7.52,
          end: 12.56,
          en: 'I am an office worker working in Vietnam, and I am 30 years old this year.',
          zh: '我是一个在越南工作的办公室职员,今年岁。',
          pinyin: 'Wǒ shì yí gè zài yuè nán gōng zuò de bàn gōng shì zhí yuán, jīn nián suì。',
          vi: 'Tôi là nhân viên văn phòng làm việc tại Việt Nam, năm nay 30 tuổi.'
        },
        {
          start: 13.92,
          end: 19.58,
          en: 'My life is very ordinary, but every day has happy and sad things.',
          zh: '我的生活很普通,但每天都有开心和难过的事情。',
          pinyin: 'Wǒ de shēng huó hěn pǔ tōng, dàn měi tiān dōu yǒu kāi xīn hé nán guò de shì qíng。',
          vi: 'Cuộc sống của tôi rất bình thường, nhưng mỗi ngày đều có những chuyện vui và buồn.'
        },
        {
          start: 21.8,
          end: 25.68,
          en: 'At 6 in the morning, my alarm clock rang, and I got up.',
          zh: '早上6点,我的闹钟响了,我起来了。',
          pinyin: 'Zǎo shàng 6 diǎn, wǒ de nào zhōng xiǎng le, wǒ qǐ lái le。',
          vi: 'Sáu giờ sáng, đồng hồ báo thức của tôi reo, tôi thức dậy.'
        }
      ]
    },
    {
      id: 'ep-ps-6xzn_os2tmy',
      youtubeId: '6xZN_Os2tMY',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '100 câu TIẾNG TRUNG giao tiếp tại hội chợ【TIẾNG TRUNG CHO NGƯỜI ĐI LÀM - BÀI 5】',
      titleVi: '100 câu tiếng Trung giao tiếp tại hội chợ',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 2042,
      durationLabel: '34:02',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 269 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/6xZN_Os2tMY.json',
      cuesCount: 269,
      cues: [
        {
          start: 20.48,
          end: 21.96,
          en: 'Good morning, madam.',
          zh: '早上好，女士。',
          pinyin: 'Zǎo shàng hǎo， nǚ shì。',
          vi: 'Chào buổi sáng, thưa bà.'
        },
        {
          start: 23.14,
          end: 24.64,
          en: 'Good morning, madam.',
          zh: '早上好，女士。',
          pinyin: 'Zǎo shàng hǎo， nǚ shì。',
          vi: 'Chào buổi sáng, thưa bà.'
        },
        {
          start: 25.98,
          end: 29.94,
          en: 'Good morning, madam.',
          zh: '早上好，女士。',
          pinyin: 'Zǎo shàng hǎo， nǚ shì。',
          vi: 'Chào buổi sáng, thưa bà.'
        }
      ]
    },
    {
      id: 'ep-ps-73ffofeq_mo',
      youtubeId: '73FfoFEq_mo',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Chuối bán thế nào ?',
      titleVi: 'Chuối bán thế nào?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 80,
      durationLabel: '1:20',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 11 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/73FfoFEq_mo.json',
      cuesCount: 11,
      cues: [
        {
          start: 16.68,
          end: 18.52,
          en: 'How much is a catty of grapes?',
          zh: '葡萄多少钱一斤?',
          pinyin: 'Pú táo duō shǎo qián yì jīn?',
          vi: 'Nho bao nhiêu tiền một cân?'
        },
        {
          start: 20.1,
          end: 21.06,
          en: 'Three fifty.',
          zh: '三块五',
          pinyin: 'Sān kuài wǔ',
          vi: 'Ba tệ rưỡi.'
        },
        {
          start: 21.82,
          end: 24.3,
          en: 'Then I want ten bananas.',
          zh: '那我要十根香蕉',
          pinyin: 'Nà wǒ yào shí gēn xiāng jiāo',
          vi: 'Vậy tôi muốn mười quả chuối.'
        }
      ]
    },
    {
      id: 'ep-ps-7gyffsie918',
      youtubeId: '7GYFFsie918',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn nói về chức năng của cơ thể bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Chức năng của cơ thể',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 265,
      durationLabel: '4:25',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 22 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/7GYFFsie918.json',
      cuesCount: 22,
      cues: [
        {
          start: 12.2,
          end: 19.92,
          en: 'Our bodies are very important.',
          zh: '我们的身体很重要',
          pinyin: 'Wǒ men de shēn tǐ hěn zhòng yào',
          vi: 'Cơ thể của chúng ta rất quan trọng.'
        },
        {
          start: 25.82,
          end: 27.06,
          en: 'We use our eyes to see.',
          zh: '我们用眼睛看',
          pinyin: 'Wǒ men yòng yǎn jīng kàn',
          vi: 'Chúng ta dùng mắt để nhìn.'
        },
        {
          start: 33.62,
          end: 34.84,
          en: 'We use our ears to hear.',
          zh: '我们用耳朵听',
          pinyin: 'Wǒ men yòng ěr duo tīng',
          vi: 'Chúng ta dùng tai để nghe.'
        }
      ]
    },
    {
      id: 'ep-ps-7iqcjqwmlu0',
      youtubeId: '7iQcjqwMlU0',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Nói về một lần đi nhà hàng bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Nói về một lần đi nhà hàng bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 254,
      durationLabel: '4:14',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 32 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/7iQcjqwMlU0.json',
      cuesCount: 32,
      cues: [
        {
          start: 0.3,
          end: 2.56,
          en: 'Practice reading Chinese and master HSK 1.',
          zh: '训练读中文，搞定。',
          pinyin: 'Xùn liàn dú zhōng wén， gǎo dìng。',
          vi: 'Luyện đọc tiếng Trung, chinh phục HSK 1.'
        },
        {
          start: 8.02,
          end: 9.92,
          en: 'Part 1: Listen to and read each sentence in the article.',
          zh: '部分一，听和读文章中的每句。',
          pinyin: 'Bù fen yī， tīng hé dú wén zhāng zhōng de měi jù。',
          vi: 'Phần 1: nghe và đọc từng câu trong bài.'
        },
        {
          start: 11.06,
          end: 13.34,
          en: 'Part 2: Study characters and culture; word formation is important.',
          zh: '部分二，学习文字和文化，构词重要。',
          pinyin: 'Bù fen èr， xué xí wén zì hé wén huà， gòu cí zhòng yào。',
          vi: 'Phần 2: học chữ và văn hóa; cấu tạo từ rất quan trọng.'
        }
      ]
    },
    {
      id: 'ep-ps-7tsk_khlaru',
      youtubeId: '7tSk_khlArU',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Đây là tổng giám đốc Trương',
      titleVi: 'Đây là tổng giám đốc Trương',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 71,
      durationLabel: '1:11',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 14 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/7tSk_khlArU.json',
      cuesCount: 14,
      cues: [
        {
          start: 0,
          end: 2.58,
          en: 'Short Chinese conversation: This is General Manager Zhang.',
          zh: '中文短会话：这是总经理张',
          pinyin: 'Zhōng wén duǎn huì huà： zhè shì zǒng jīng lǐ zhāng',
          vi: 'Hội thoại ngắn tiếng Trung: Đây là tổng giám đốc Trương.'
        },
        {
          start: 30,
          end: 30.36,
          en: 'first',
          zh: '先',
          pinyin: 'Xiān',
          vi: 'trước'
        },
        {
          start: 32.64,
          end: 33.34,
          en: 'everyone',
          zh: '大家',
          pinyin: 'Dà jiā',
          vi: 'mọi người'
        }
      ]
    },
    {
      id: 'ep-ps-7uigcpyrjnk',
      youtubeId: '7uigcPyrjNk',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Máy tính của tôi sập nguồn rồi',
      titleVi: 'Máy tính của tôi sập nguồn rồi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 96,
      durationLabel: '1:36',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 13 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/7uigcPyrjNk.json',
      cuesCount: 13,
      cues: [
        {
          start: 0.5,
          end: 3.44,
          en: 'Short Chinese conversation: My computer crashed.',
          zh: '中文短会话：我的电脑死机了。',
          pinyin: 'Zhōng wén duǎn huì huà： wǒ de diàn nǎo sǐ jī le。',
          vi: 'Hội thoại ngắn tiếng Trung: Máy tính của tôi bị treo rồi.'
        },
        {
          start: 4.44,
          end: 7.38,
          en: 'Oh no, my computer died.',
          zh: '糟糕，我的电脑死了。',
          pinyin: 'Zāo gāo， wǒ de diàn nǎo sǐ le。',
          vi: 'Chết rồi, máy tính của tôi chết rồi.'
        },
        {
          start: 11.58,
          end: 18.36,
          en: 'I don\'t know. I was typing documents the whole time, and the computer suddenly died.',
          zh: '不知道，我一直都在打文件，电脑突然就死了。',
          pinyin: 'Bù zhī dào， wǒ yì zhí dōu zài dǎ wén jiàn， diàn nǎo tū rán jiù sǐ le。',
          vi: 'Tôi không biết, tôi cứ đang gõ văn bản thì máy tính đột nhiên chết.'
        }
      ]
    },
    {
      id: 'ep-ps-83thdbdty7u',
      youtubeId: '83THdBdTy7U',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: '【HSK 1-3】简单的爱情 - Tình yêu bình dị | Chinese Podcast',
      titleVi: 'Tình yêu bình dị',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 292,
      durationLabel: '4:52',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 76 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/83THdBdTy7U.json',
      cuesCount: 76,
      cues: [
        {
          start: 4.68,
          end: 10.74,
          en: 'Today I want to share with everyone the love story of me and my girlfriend',
          zh: '今天我想和大家分享一下我和女朋友的爱情故事',
          pinyin: 'Jīn tiān wǒ xiǎng hé dà jiā fēn xiǎng yí xià wǒ hé nǚ péng yǒu de ài qíng gù shì',
          vi: 'Hôm nay tôi muốn chia sẻ với mọi người câu chuyện tình yêu của tôi và bạn gái'
        },
        {
          start: 12.18,
          end: 15.22,
          en: 'Our love is very simple, and also very ordinary',
          zh: '我们的爱情很简单,也很平凡',
          pinyin: 'Wǒ men de ài qíng hěn jiǎn dān, yě hěn píng fán',
          vi: 'Tình yêu của chúng tôi rất đơn giản, cũng rất bình thường'
        },
        {
          start: 16.16,
          end: 19.6,
          en: 'But it makes me feel very warm and happy',
          zh: '但却让我觉得很温暖和幸福',
          pinyin: 'Dàn què ràng wǒ jué de hěn wēn nuǎn huo xìng fú',
          vi: 'Nhưng lại khiến tôi cảm thấy rất ấm áp và hạnh phúc'
        }
      ]
    },
    {
      id: 'ep-ps-84rn22jlmre',
      youtubeId: '84rN22JlMrE',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn nói về kem ăn bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Đoạn văn tiếng Trung về kem',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 237,
      durationLabel: '3:57',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 20 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/84rN22JlMrE.json',
      cuesCount: 20,
      cues: [
        {
          start: 18.46,
          end: 20.9,
          en: 'Ice cream is a delicious snack.',
          zh: '冰淇淋是一种美味的小吃',
          pinyin: 'Bīng qí lín shì yì zhǒng měi wèi de xiǎo chī',
          vi: 'Kem là một món ăn vặt ngon.'
        },
        {
          start: 26.86,
          end: 29,
          en: 'Ice cream has many flavors.',
          zh: '冰淇淋有很多种口味',
          pinyin: 'Bīng qí lín yǒu hěn duō zhǒng kǒu wèi',
          vi: 'Kem có rất nhiều hương vị.'
        },
        {
          start: 34.78,
          end: 36.56,
          en: 'For example, chocolate ice cream.',
          zh: '比如巧克力冰淇淋',
          pinyin: 'Bǐ rú qiǎo kè lì bīng qí lín',
          vi: 'Ví dụ như kem sô-cô-la.'
        }
      ]
    },
    {
      id: 'ep-ps-a2e8ihlb01q',
      youtubeId: 'A2e8ihLb01Q',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '80 câu hỏi đáp TIẾNG TRUNG chủ đề làm quen bạn mới【LUYỆN NGHE TIẾNG TRUNG THỤ ĐỘNG】',
      titleVi: '80 câu hỏi đáp tiếng Trung: Làm quen bạn mới',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 1151,
      durationLabel: '19:11',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 178 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/A2e8ihLb01Q.json',
      cuesCount: 178,
      cues: [
        {
          start: 0,
          end: 4.2,
          en: 'Have a listen — 80 answers to help you get to know a new topic.',
          zh: '听一听，个答案，让你认识新的主题。',
          pinyin: 'Tīng yi tīng， gè dá àn， ràng nǐ rèn shi xīn de zhǔ tí。',
          vi: 'Cùng nghe nào, 80 câu trả lời giúp bạn làm quen với chủ đề mới.'
        },
        {
          start: 30,
          end: 30.82,
          en: 'Getting to know you',
          zh: '认识你',
          pinyin: 'Rèn shi nǐ',
          vi: 'Làm quen với bạn'
        },
        {
          start: 31.9,
          end: 34.14,
          en: 'May I ask, what should I call you?',
          zh: '请问，怎么称呼你？',
          pinyin: 'Qǐng wèn， zěn me chēng hu nǐ？',
          vi: 'Xin hỏi, tôi nên gọi bạn là gì?'
        }
      ]
    },
    {
      id: 'ep-ps-bapkujqfo5i',
      youtubeId: 'BApKUjQFO5I',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Tối nay chúng mình đi ăn đi',
      titleVi: 'Tối nay chúng mình đi ăn đi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 55,
      durationLabel: '0:55',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 16 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/BApKUjQFO5I.json',
      cuesCount: 16,
      cues: [
        {
          start: 6.18,
          end: 8.42,
          en: 'Let\'s eat together.',
          zh: '我们一起吃饭吧',
          pinyin: 'Wǒ men yì qǐ chī fàn ba',
          vi: 'Chúng mình cùng ăn cơm đi.'
        },
        {
          start: 14.18,
          end: 15.42,
          en: 'There\'s still more than a week to go.',
          zh: '还有一个多星期呢',
          pinyin: 'Hái yǒu yí gè duō xīng qī ne',
          vi: 'Còn hơn một tuần nữa mà.'
        },
        {
          start: 17.8,
          end: 19.04,
          en: 'I want to go to Beijing.',
          zh: '我要去北京',
          pinyin: 'Wǒ yào qù běi jīng',
          vi: 'Tôi muốn đi Bắc Kinh.'
        }
      ]
    },
    {
      id: 'ep-ps-bfpfnfyqywk',
      youtubeId: 'BFpfNFyQywk',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '[Pinyin & Vietsub] Chuyện cô gái Trung Quốc về quê đón Tết',
      titleVi: 'Chuyện cô gái Trung Quốc về quê đón Tết',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 637,
      durationLabel: '10:37',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 95 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/BFpfNFyQywk.json',
      cuesCount: 95,
      cues: [
        {
          start: 2.9,
          end: 6.34,
          en: 'Today is the most important day for Chinese people.',
          zh: '今天是中国人最重要的日子',
          pinyin: 'Jīn tiān shì zhōng guó rén zuì zhòng yào de rì zi',
          vi: 'Hôm nay là ngày quan trọng nhất của người Trung Quốc.'
        },
        {
          start: 12.76,
          end: 17,
          en: 'This is the world\'s largest migration.',
          zh: '这次是世界上最大规模的迁徙',
          pinyin: 'Zhè cì shì shì jiè shàng zuì dà guī mó de qiān xǐ',
          vi: 'Đây là cuộc di cư lớn nhất trên thế giới.'
        },
        {
          start: 17.14,
          end: 18.94,
          en: 'The annual Spring Festival.',
          zh: '一年一度的春节',
          pinyin: 'Yì nián yí dù de chūn jié',
          vi: 'Tết Nguyên Đán hằng năm.'
        }
      ]
    },
    {
      id: 'ep-ps-bb5_4bi02qk',
      youtubeId: 'Bb5_4Bi02qk',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Tôi muốn mua quần bò',
      titleVi: 'Tôi muốn mua quần bò',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 63,
      durationLabel: '1:03',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 14 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Bb5_4Bi02qk.json',
      cuesCount: 14,
      cues: [
        {
          start: 13.56,
          end: 15.56,
          en: 'Do you have anything in a darker color?',
          zh: '有没有颜色深一点的',
          pinyin: 'Yǒu méi yǒu yán sè shēn yì diǎn de',
          vi: 'Có màu đậm hơn một chút không?'
        },
        {
          start: 17.84,
          end: 18.19,
          en: 'This kind.',
          zh: '这种',
          pinyin: 'Zhè zhǒng',
          vi: 'Loại này.'
        },
        {
          start: 18.72,
          end: 20.26,
          en: 'This is too tight.',
          zh: '这个太紧了',
          pinyin: 'Zhè ge tài jǐn le',
          vi: 'Cái này chật quá.'
        }
      ]
    },
    {
      id: 'ep-ps-bpivy_gb9j4',
      youtubeId: 'BpiVY_GB9J4',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Sinh viên giới thiệu bản thân bằng TIẾNG TRUNG',
      titleVi: 'Sinh viên giới thiệu bản thân bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 310,
      durationLabel: '5:10',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 59 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/BpiVY_GB9J4.json',
      cuesCount: 59,
      cues: [
        {
          start: 25.98,
          end: 26.56,
          en: 'I am',
          zh: '我是',
          pinyin: 'Wǒ shì',
          vi: 'Tôi là'
        },
        {
          start: 26.56,
          end: 27.98,
          en: 'I\'m Chen Qingling',
          zh: '我是陈庆龄',
          pinyin: 'Wǒ shì chén qìng líng',
          vi: 'Tôi là Trần Khánh Linh'
        },
        {
          start: 28.8,
          end: 30.96,
          en: 'I\'m 21 years old this year',
          zh: '我今年岁',
          pinyin: 'Wǒ jīn nián suì',
          vi: 'Tôi năm nay 21 tuổi'
        }
      ]
    },
    {
      id: 'ep-ps-bz9aizviaeu',
      youtubeId: 'Bz9aIzvIAeU',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Tặng cậu một bó hoa hồng',
      titleVi: 'Tặng cậu một bó hoa hồng',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 106,
      durationLabel: '1:46',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 18 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Bz9aIzvIAeU.json',
      cuesCount: 18,
      cues: [
        {
          start: 0.8,
          end: 8.52,
          en: 'I\'m giving you a bouquet of roses, do you like it?',
          zh: '我送你一束玫瑰花,喜欢吗?',
          pinyin: 'Wǒ sòng nǐ yí shù méi guī huā, xǐ huan ma?',
          vi: 'Anh tặng em một bó hoa hồng, em thích không?'
        },
        {
          start: 14.82,
          end: 16.84,
          en: 'But you are more beautiful than the flower.',
          zh: '不过人比花更美啊',
          pinyin: 'Bú guò rén bǐ huā gèng měi a',
          vi: 'Nhưng em còn đẹp hơn hoa nữa.'
        },
        {
          start: 19.32,
          end: 21.14,
          en: 'You\'re flattering me so much I\'m embarrassed.',
          zh: '都让你夸得不好意思了',
          pinyin: 'Dōu ràng nǐ kuā dé bù hǎo yì si le',
          vi: 'Anh khen đến mức em ngại quá.'
        }
      ]
    },
    {
      id: 'ep-ps-d3lqj6saeui',
      youtubeId: 'D3lQJ6SAEuI',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: '【HSK 1-3】中国的茶文化 - Văn hoá trà tại Trung Quốc | Chinese Podcast',
      titleVi: 'Văn hóa trà tại Trung Quốc',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 276,
      durationLabel: '4:36',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 67 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/D3lQJ6SAEuI.json',
      cuesCount: 67,
      cues: [
        {
          start: 4.76,
          end: 7.8,
          en: 'How is everyone doing today? Are you in a good mood?',
          zh: '今天大家过得怎么样？心情好吗？',
          pinyin: 'Jīn tiān dà jiā guò dé zěn me yàng？ xīn qíng hǎo ma？',
          vi: 'Hôm nay mọi người thế nào? Tâm trạng có tốt không?'
        },
        {
          start: 8.94,
          end: 11.36,
          en: 'If you are unhappy or feel a little tired,',
          zh: '如果不开心或者觉得有点累，',
          pinyin: 'Rú guǒ bù kāi xīn huò zhě jué de yǒu diǎn lèi，',
          vi: 'Nếu không vui hoặc cảm thấy hơi mệt,'
        },
        {
          start: 12.4,
          end: 16.28,
          en: 'go pour yourself a cup of hot tea,',
          zh: '建议你现在去给自己倒一杯热茶，',
          pinyin: 'Jiàn yì nǐ xiàn zài qù gěi zì jǐ dǎo yì bēi rè chá，',
          vi: 'Hãy rót cho mình một tách trà nóng,'
        }
      ]
    },
    {
      id: 'ep-ps-dfweqpajpbm',
      youtubeId: 'DFWeQPAJPbM',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '【HSK3】10 câu chuyện ngắn luyện nghe TIẾNG TRUNG (PHẦN 1)',
      titleVi: '10 câu chuyện ngắn luyện nghe tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 841,
      durationLabel: '14:01',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 94 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/DFWeQPAJPbM.json',
      cuesCount: 94,
      cues: [
        {
          start: 5.44,
          end: 10.16,
          en: 'Whenever I don\'t know what to eat, I go eat hot pot.',
          zh: '每次不知道吃什么的时候，我就会去吃火锅。',
          pinyin: 'Měi cì bù zhī dào chī shén me de shí hòu， wǒ jiù huì qù chī huǒ guō。',
          vi: 'Mỗi khi không biết ăn gì, tôi sẽ đi ăn lẩu.'
        },
        {
          start: 13.86,
          end: 19.5,
          en: 'Hot pot is very delicious; I can choose my favorite flavors and foods.',
          zh: '火锅非常好吃，我可以选择自己喜欢的味道和食物。',
          pinyin: 'Huǒ guō fēi cháng hǎo chī， wǒ kě yǐ xuǎn zé zì jǐ xǐ huan de wèi dào hé shí wù。',
          vi: 'Lẩu rất ngon, tôi có thể chọn hương vị và món ăn mình thích.'
        },
        {
          start: 23.38,
          end: 28.76,
          en: 'Common hot pot soup bases include mala, clear broth, and tomato flavors.',
          zh: '常见的火锅汤底有麻辣、清汤和番茄口味。',
          pinyin: 'Cháng jiàn de huǒ guō tāng dǐ yǒu má là、 qīng tāng hé fān qié kǒu wèi。',
          vi: 'Các loại nước dùng lẩu phổ biến gồm vị mala, vị thanh và vị cà chua.'
        }
      ]
    },
    {
      id: 'ep-ps-dccmxffnxoi',
      youtubeId: 'DcCmXFFnxOI',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn miêu tả phòng học bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Đoạn văn miêu tả phòng học',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 212,
      durationLabel: '3:32',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 25 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/DcCmXFFnxOI.json',
      cuesCount: 25,
      cues: [
        {
          start: 17.78,
          end: 19.48,
          en: 'My home has a study room.',
          zh: '我家有一个书房',
          pinyin: 'Wǒ jiā yǒu yí gè shū fáng',
          vi: 'Nhà tôi có một phòng sách.'
        },
        {
          start: 25.2,
          end: 27.12,
          en: 'It is very small, but very clean.',
          zh: '它很小，但是很干净',
          pinyin: 'Tā hěn xiǎo， dàn shì hěn gān jìng',
          vi: 'Nó rất nhỏ, nhưng rất sạch sẽ.'
        },
        {
          start: 33.08,
          end: 35.04,
          en: 'There is a desk in the study room.',
          zh: '书房里有一个书桌',
          pinyin: 'Shū fáng lǐ yǒu yí gè shū zhuō',
          vi: 'Trong phòng sách có một cái bàn học.'
        }
      ]
    },
    {
      id: 'ep-ps-eokjmxhep0a',
      youtubeId: 'EOKJmxheP0A',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Quê bạn ở đâu ?',
      titleVi: 'Quê bạn ở đâu?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 44,
      durationLabel: '0:44',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 9 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/EOKJmxheP0A.json',
      cuesCount: 9,
      cues: [
        {
          start: 0.46,
          end: 7.24,
          en: 'Where is your hometown?',
          zh: '你的老家在哪里？',
          pinyin: 'Nǐ de lǎo jiā zài nǎ lǐ？',
          vi: 'Quê bạn ở đâu?'
        },
        {
          start: 8.58,
          end: 12.04,
          en: 'I came from the countryside, how about you?',
          zh: '我从乡下来，你呢？',
          pinyin: 'Wǒ cóng xiāng xià lái， nǐ ne？',
          vi: 'Tôi từ nông thôn đến, còn bạn?'
        },
        {
          start: 13.18,
          end: 15.72,
          en: 'My hometown is in Beijing.',
          zh: '我的老家在北京。',
          pinyin: 'Wǒ de lǎo jiā zài běi jīng。',
          vi: 'Quê tôi ở Bắc Kinh.'
        }
      ]
    },
    {
      id: 'ep-ps-etbcwido0k8',
      youtubeId: 'ETBCwIDO0K8',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: '【HSK1】10 câu chuyện ngắn luyện nghe TIẾNG TRUNG (PHẦN 1)',
      titleVi: '10 câu chuyện ngắn luyện nghe tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 645,
      durationLabel: '10:45',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 161 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/ETBCwIDO0K8.json',
      cuesCount: 161,
      cues: [
        {
          start: 10.74,
          end: 13.9,
          en: 'I am a student at Hanoi University, majoring in Chinese.',
          zh: '我是河内大学的学生，学习汉语专业。',
          pinyin: 'Wǒ shì hé nèi dà xué de xué shēng， xué xí hàn yǔ zhuān yè。',
          vi: 'Tôi là sinh viên trường Đại học Hà Nội, học chuyên ngành tiếng Trung.'
        },
        {
          start: 16.04,
          end: 19.32,
          en: 'There are three people in my family: my father, my mother, and me.',
          zh: '我家有三个人，爸爸、妈妈和我。',
          pinyin: 'Wǒ jiā yǒu sān gè rén， bà ba、 mā ma hé wǒ。',
          vi: 'Gia đình tôi có ba người: bố, mẹ và tôi.'
        },
        {
          start: 21.28,
          end: 23.6,
          en: 'My father is a doctor, and my mother is a teacher.',
          zh: '我爸爸是医生，妈妈是老师。',
          pinyin: 'Wǒ bà ba shì yī shēng， mā ma shì lǎo shī。',
          vi: 'Bố tôi là bác sĩ, mẹ tôi là giáo viên.'
        }
      ]
    },
    {
      id: 'ep-ps-forjmilpv2u',
      youtubeId: 'FORJmILpV2U',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG : Siêu thị ở đâu ? | 超市在哪里 ?',
      titleVi: 'Siêu thị ở đâu?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 295,
      durationLabel: '4:55',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 83 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/FORJmILpV2U.json',
      cuesCount: 83,
      cues: [
        {
          start: 17.04,
          end: 20.6,
          en: 'Okay.',
          zh: '好。',
          pinyin: 'Hǎo。',
          vi: 'Được.'
        },
        {
          start: 21.36,
          end: 21.71,
          en: 'I\'m going out.',
          zh: '我要出去。',
          pinyin: 'Wǒ yào chū qù。',
          vi: 'Tôi muốn đi ra ngoài.'
        },
        {
          start: 22.94,
          end: 23.7,
          en: 'Where do you want to go?',
          zh: '你要去哪里？',
          pinyin: 'Nǐ yào qù nǎ lǐ？',
          vi: 'Bạn muốn đi đâu?'
        }
      ]
    },
    {
      id: 'ep-ps-fjf8becbn-e',
      youtubeId: 'FjF8beCbN-E',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Nói về một ngày của bản thân bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Nói về một ngày của bản thân bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 238,
      durationLabel: '3:58',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 23 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/FjF8beCbN-E.json',
      cuesCount: 23,
      cues: [
        {
          start: 17.86,
          end: 20.7,
          en: 'I get up at six every morning.',
          zh: '我每天早上六点起床。',
          pinyin: 'Wǒ měi tiān zǎo shàng liù diǎn qǐ chuáng。',
          vi: 'Sáng nào tôi cũng dậy lúc 6 giờ.'
        },
        {
          start: 25.38,
          end: 29.28,
          en: 'I eat breakfast at six thirty every morning.',
          zh: '我每天早上六点半吃早饭。',
          pinyin: 'Wǒ měi tiān zǎo shàng liù diǎn bàn chī zǎo fàn。',
          vi: 'Sáng nào tôi cũng ăn sáng lúc 6 giờ rưỡi.'
        },
        {
          start: 33.64,
          end: 37.44,
          en: 'I take the school bus to school at seven every morning.',
          zh: '我每天早上七点坐校车上学。',
          pinyin: 'Wǒ měi tiān zǎo shàng qī diǎn zuò xiào chē shàng xué。',
          vi: 'Sáng nào tôi cũng đi học bằng xe buýt của trường lúc 7 giờ.'
        }
      ]
    },
    {
      id: 'ep-ps-fjp1untxyi8',
      youtubeId: 'Fjp1untxYI8',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '10 hội thoại đời sống chủ đề khách sạn LUYỆN NGHE TIẾNG TRUNG THỤ ĐỘNG',
      titleVi: '10 hội thoại đời sống chủ đề khách sạn',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 456,
      durationLabel: '7:36',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 130 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Fjp1untxYI8.json',
      cuesCount: 130,
      cues: [
        {
          start: 4.02,
          end: 4.86,
          en: 'I want a room.',
          zh: '我想要一个房间',
          pinyin: 'Wǒ xiǎng yào yí gè fáng jiān',
          vi: 'Tôi muốn một phòng.'
        },
        {
          start: 5.88,
          end: 9.32,
          en: 'May I ask, do you want a single room or a double room?',
          zh: '请问您要单人间还是双人间?',
          pinyin: 'Qǐng wèn nín yào dān rén jiān hái shì shuāng rén jiān?',
          vi: 'Xin hỏi quý khách muốn phòng đơn hay phòng đôi?'
        },
        {
          start: 17.72,
          end: 18.96,
          en: 'How many days are you staying?',
          zh: '您住几天?',
          pinyin: 'Nín zhù jǐ tiān?',
          vi: 'Quý khách ở mấy ngày ạ?'
        }
      ]
    },
    {
      id: 'ep-ps-g2eqt-hy6mo',
      youtubeId: 'G2EqT-hy6mo',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Nói về thói quen xấu - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Nói về thói quen xấu',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 161,
      durationLabel: '2:41',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 16 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/G2EqT-hy6mo.json',
      cuesCount: 16,
      cues: [
        {
          start: 20.76,
          end: 23.7,
          en: 'Speaking of my bad habits, there are a lot.',
          zh: '要说起我的坏习惯，那可多了。',
          pinyin: 'Yào shuō qǐ wǒ de huài xí guàn， nà kě duō le。',
          vi: 'Nhắc đến thói quen xấu của tôi thì nhiều lắm.'
        },
        {
          start: 25.82,
          end: 26.94,
          en: 'I always stay up late.',
          zh: '我总是熬夜。',
          pinyin: 'Wǒ zǒng shì áo yè。',
          vi: 'Tôi luôn thức khuya.'
        },
        {
          start: 26.98,
          end: 30.08,
          en: 'For example, playing computer games.',
          zh: '比如打电脑游戏。',
          pinyin: 'Bǐ rú dǎ diàn nǎo yóu xì。',
          vi: 'Ví dụ như chơi game trên máy tính.'
        }
      ]
    },
    {
      id: 'ep-ps-gca4e7cfaf0',
      youtubeId: 'GCa4E7cFAf0',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn nói về quả cam bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Đoạn văn về quả cam trong tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 212,
      durationLabel: '3:32',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 23 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/GCa4E7cFAf0.json',
      cuesCount: 23,
      cues: [
        {
          start: 18.22,
          end: 21.54,
          en: 'Oranges are orange-colored, round fruits.',
          zh: '橙子是橙色的、圆圆的水果',
          pinyin: 'Chéng zǐ shì chéng sè de、 yuán yuán de shuǐ guǒ',
          vi: 'Quả cam có màu cam, là loại quả tròn.'
        },
        {
          start: 27.02,
          end: 28.14,
          en: 'Some oranges are sweet.',
          zh: '有些橙子甜',
          pinyin: 'Yǒu xiē chéng zǐ tián',
          vi: 'Một số quả cam thì ngọt.'
        },
        {
          start: 29.04,
          end: 30.24,
          en: 'Some oranges are sour.',
          zh: '有些橙子酸',
          pinyin: 'Yǒu xiē chéng zǐ suān',
          vi: 'Một số quả cam thì chua.'
        }
      ]
    },
    {
      id: 'ep-ps-gijjzsut8pg',
      youtubeId: 'GiJJzSUT8Pg',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Nói về ngày sinh nhật của bản thân bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Nói về ngày sinh nhật của bản thân bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 273,
      durationLabel: '4:33',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 34 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/GiJJzSUT8Pg.json',
      cuesCount: 34,
      cues: [
        {
          start: 23.62,
          end: 24.24,
          en: 'Sunny',
          zh: '晴天',
          pinyin: 'Qíng tiān',
          vi: 'Trời nắng'
        },
        {
          start: 30.2,
          end: 33.08,
          en: 'Today is my tenth birthday.',
          zh: '今天是我十岁的生日。',
          pinyin: 'Jīn tiān shì wǒ shí suì de shēng rì。',
          vi: 'Hôm nay là sinh nhật mười tuổi của tôi.'
        },
        {
          start: 38.8,
          end: 44.06,
          en: 'When I got up in the morning, I saw a bowl of noodles on the table,',
          zh: '早上起床，我看到桌子上有一碗面条，',
          pinyin: 'Zǎo shàng qǐ chuáng， wǒ kàn dào zhuō zi shàng yǒu yì wǎn miàn tiáo，',
          vi: 'Buổi sáng ngủ dậy, tôi thấy trên bàn có một bát mì,'
        }
      ]
    },
    {
      id: 'ep-ps-gvdfvtossls',
      youtubeId: 'GvDfVTossLs',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Giới thiệu về nghề nghiệp của gia đình bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Giới thiệu về nghề nghiệp của gia đình bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 219,
      durationLabel: '3:39',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 25 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/GvDfVTossLs.json',
      cuesCount: 25,
      cues: [
        {
          start: 26.64,
          end: 30.7,
          en: 'This is my grandfather. He is currently a security guard.',
          zh: '这是我的爷爷，他目前是一名保安。',
          pinyin: 'Zhè shì wǒ de yé ye， tā mù qián shì yì míng bǎo ān。',
          vi: 'Đây là ông tôi. Hiện tại ông ấy làm bảo vệ.'
        },
        {
          start: 35.58,
          end: 37.42,
          en: 'He works at a supermarket.',
          zh: '他在超市工作。',
          pinyin: 'Tā zài chāo shì gōng zuò。',
          vi: 'Ông ấy làm việc ở siêu thị.'
        },
        {
          start: 42.96,
          end: 47.02,
          en: 'This is my dad. He is currently a coach driver.',
          zh: '这是我爸爸，他目前是客车司机。',
          pinyin: 'Zhè shì wǒ bà ba， tā mù qián shì kè chē sī jī。',
          vi: 'Đây là bố tôi. Hiện tại bố là tài xế xe khách.'
        }
      ]
    },
    {
      id: 'ep-ps-gyxfrb3233s',
      youtubeId: 'GyXFRB3233s',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Quán bar này thật tuyệt',
      titleVi: 'Quán bar này thật tuyệt',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 156,
      durationLabel: '2:36',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 29 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/GyXFRB3233s.json',
      cuesCount: 29,
      cues: [
        {
          start: 8.2,
          end: 10.94,
          en: 'A new bar opened in the city center.',
          zh: '市中心开了一家新酒吧',
          pinyin: 'Shì zhōng xīn kāi le yì jiā xīn jiǔ bā',
          vi: 'Một quán bar mới đã mở ở trung tâm thành phố.'
        },
        {
          start: 17.22,
          end: 19.14,
          en: 'Let\'s go check it out this weekend.',
          zh: '咱们周末去瞧瞧吧',
          pinyin: 'Zán men zhōu mò qù qiáo qiáo ba',
          vi: 'Cuối tuần chúng ta đi xem thử đi.'
        },
        {
          start: 22.28,
          end: 22.82,
          en: 'Okay!',
          zh: '好呀',
          pinyin: 'Hǎo ya',
          vi: 'Được thôi.'
        }
      ]
    },
    {
      id: 'ep-ps-htf-vsi08vo',
      youtubeId: 'HTF-VSi08vo',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '100 CÂU TIẾNG TRUNG PHỎNG VẤN XIN VIỆC【TIẾNG TRUNG CHO NGƯỜI ĐI LÀM】',
      titleVi: '100 câu tiếng Trung phỏng vấn xin việc',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 2265,
      durationLabel: '37:45',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 274 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/HTF-VSi08vo.json',
      cuesCount: 274,
      cues: [
        {
          start: 9.38,
          end: 11.04,
          en: 'Each word will be read 5 times.',
          zh: '每个词都会读5次。',
          pinyin: 'Měi gè cí dōu huì dú 5 cì。',
          vi: 'Mỗi từ sẽ được đọc 5 lần.'
        },
        {
          start: 11.52,
          end: 15.58,
          en: 'Including 2 times in Chinese, 1 time in Vietnamese, then 2 more times in Chinese.',
          zh: '包括2次中文、1次越南语，然后再继续2次中文。',
          pinyin: 'Bāo kuò 2 cì zhōng wén、1 cì yuè nán yǔ， rán hòu zài jì xù 2 cì zhōng wén。',
          vi: 'Bao gồm 2 lần đọc tiếng Trung, 1 lần đọc tiếng Việt, sau đó đọc tiếp 2 lần tiếng Trung.'
        },
        {
          start: 18.92,
          end: 20.96,
          en: 'Hello, I\'m here for an interview.',
          zh: '你好，我是来面试的。',
          pinyin: 'Nǐ hǎo， wǒ shì lái miàn shì de。',
          vi: 'Xin chào, tôi đến để phỏng vấn.'
        }
      ]
    },
    {
      id: 'ep-ps-izrszjmnxbc',
      youtubeId: 'IZrsZjmNxBc',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Năng lực quan trọng nhất - LUYỆN ĐỌC TIẾNG TRUNG HSK 3',
      titleVi: 'Năng lực quan trọng nhất',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 240,
      durationLabel: '4:00',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 21 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/IZrsZjmNxBc.json',
      cuesCount: 21,
      cues: [
        {
          start: 13.82,
          end: 18.14,
          en: 'A person\'s most important ability.',
          zh: '一个人最重要的能力',
          pinyin: 'Yí gè rén zuì zhòng yào de néng lì',
          vi: 'Năng lực quan trọng nhất của một người'
        },
        {
          start: 20.06,
          end: 21.54,
          en: 'It is not that you dress beautifully.',
          zh: '不是你打扮得漂亮',
          pinyin: 'Bú shì nǐ dǎ bàn dé piào liang',
          vi: 'không phải là bạn ăn mặc đẹp'
        },
        {
          start: 23.56,
          end: 25.52,
          en: 'Nor is it how good you are at making money.',
          zh: '也不是你赚钱多厉害',
          pinyin: 'Yě bú shì nǐ zhuàn qián duō lì hài',
          vi: 'cũng không phải là bạn kiếm tiền giỏi đến đâu'
        }
      ]
    },
    {
      id: 'ep-ps-ihuq7ff9hwq',
      youtubeId: 'IhUQ7ff9HwQ',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Mời bạn đi biển',
      titleVi: 'Mời bạn đi biển',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 170,
      durationLabel: '2:50',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 21 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/IhUQ7ff9HwQ.json',
      cuesCount: 21,
      cues: [
        {
          start: 2.46,
          end: 9.14,
          en: 'The weather has been really nice lately. How about we go to the beach?',
          zh: '最近天气很好，我们去海边玩怎么样？',
          pinyin: 'Zuì jìn tiān qì hěn hǎo， wǒ men qù hǎi biān wán zěn me yàng？',
          vi: 'Gần đây thời tiết rất đẹp, chúng ta đi biển chơi thì sao?'
        },
        {
          start: 12.74,
          end: 17.84,
          en: 'Great! I really want to go to the beach too. When do you want to go?',
          zh: '好啊！我也很想去海边，你想什么时候去？',
          pinyin: 'Hǎo a！ wǒ yě hěn xiǎng qù hǎi biān， nǐ xiǎng shén me shí hòu qù？',
          vi: 'Hay quá! Tôi cũng rất muốn đi biển, bạn muốn đi lúc nào?'
        },
        {
          start: 21.14,
          end: 25.02,
          en: 'How about this weekend? We can set off in the morning.',
          zh: '这个周末怎么样？我们可以在早上出发。',
          pinyin: 'Zhè ge zhōu mò zěn me yàng？ wǒ men kě yǐ zài zǎo shàng chū fā。',
          vi: 'Cuối tuần này thì sao? Chúng ta có thể xuất phát vào buổi sáng.'
        }
      ]
    },
    {
      id: 'ep-ps-ijpxk7i-5ka',
      youtubeId: 'IjpXk7i-5KA',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '45 hội thoại đời sống LUYỆN NGHE TIẾNG TRUNG THỤ ĐỘNG',
      titleVi: '45 hội thoại đời sống',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 1354,
      durationLabel: '22:34',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 390 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/IjpXk7i-5KA.json',
      cuesCount: 390,
      cues: [
        {
          start: 3.28,
          end: 5.9,
          en: 'My name is David, what\'s your name?',
          zh: '我叫大卫，你叫什么名字？',
          pinyin: 'Wǒ jiào dà wèi， nǐ jiào shén me míng zì？',
          vi: 'Tôi tên là David, bạn tên là gì?'
        },
        {
          start: 13.28,
          end: 16.22,
          en: 'He is Wang Li, he is Chinese.',
          zh: '他是王力，他是中国人。',
          pinyin: 'Tā shì wáng lì， tā shì zhōng guó rén。',
          vi: 'Anh ấy là Vương Lực, anh ấy là người Trung Quốc.'
        },
        {
          start: 17.46,
          end: 20.52,
          en: 'He is Mark, he is American.',
          zh: '他是马克，他是美国人。',
          pinyin: 'Tā shì mǎ kè， tā shì měi guó rén。',
          vi: 'Anh ấy là Mark, anh ấy là người Mỹ.'
        }
      ]
    },
    {
      id: 'ep-ps-iqgwurpdjba',
      youtubeId: 'IqgwURpdJBA',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Miêu tả bố - LUYỆN ĐỌC TIẾNG TRUNG HSK 3',
      titleVi: 'Miêu tả bố',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 216,
      durationLabel: '3:36',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 18 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/IqgwURpdJBA.json',
      cuesCount: 18,
      cues: [
        {
          start: 9.42,
          end: 20.12,
          en: 'My father is a production dispatcher in the factory.',
          zh: '我爸爸是工厂里的生产调度员',
          pinyin: 'Wǒ bà ba shì gōng chǎng lǐ de shēng chǎn diào dù yuán',
          vi: 'Bố tôi là điều phối viên sản xuất trong nhà máy.'
        },
        {
          start: 23.54,
          end: 24.56,
          en: 'in his thirties',
          zh: '三十多岁',
          pinyin: 'Sān shí duō suì',
          vi: 'hơn ba mươi tuổi'
        },
        {
          start: 27.72,
          end: 30.4,
          en: 'He is not very tall, but he is very thin.',
          zh: '他不太高，但长得很瘦',
          pinyin: 'Tā bú tài gāo， dàn cháng dé hěn shòu',
          vi: 'Bố tôi không cao lắm nhưng rất gầy.'
        }
      ]
    },
    {
      id: 'ep-ps-j3q1umwby9c',
      youtubeId: 'J3q1uMWby9c',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe TIẾNG TRUNG thụ động【VIDEO #11】Gọi điện thoại',
      titleVi: 'Gọi điện thoại',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 277,
      durationLabel: '4:37',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 45 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/J3q1uMWby9c.json',
      cuesCount: 45,
      cues: [
        {
          start: 30.44,
          end: 32.04,
          en: 'Where did you go yesterday?',
          zh: '昨天你去哪儿了？',
          pinyin: 'Zuó tiān nǐ qù nǎ ér le？',
          vi: 'Hôm qua bạn đi đâu vậy?'
        },
        {
          start: 34.08,
          end: 36.52,
          en: 'I looked for you all day but didn\'t find you.',
          zh: '我找了你一天，也没找到。',
          pinyin: 'Wǒ zhǎo le nǐ yì tiān， yě méi zhǎo dào。',
          vi: 'Tôi đã tìm bạn cả ngày mà không thấy.'
        },
        {
          start: 39.34,
          end: 40.74,
          en: 'I went to my friend\'s place.',
          zh: '我去朋友那儿了，',
          pinyin: 'Wǒ qù péng yǒu nà ér le，',
          vi: 'Tôi đến chỗ bạn tôi.'
        }
      ]
    },
    {
      id: 'ep-ps-ju74aumcfbu',
      youtubeId: 'JU74aUMCfbU',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Bạn có tiền lẻ không ?',
      titleVi: 'Hội thoại ngắn: Bạn có tiền lẻ không?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 53,
      durationLabel: '0:53',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 13 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/JU74aUMCfbU.json',
      cuesCount: 13,
      cues: [
        {
          start: 0.64,
          end: 7.3,
          en: 'How much is this box of chocolates?',
          zh: '这盒巧克力多少钱？',
          pinyin: 'Zhè hé qiǎo kè lì duō shǎo qián？',
          vi: 'Hộp sô-cô-la này bao nhiêu tiền?'
        },
        {
          start: 17.52,
          end: 19.82,
          en: 'Here it\'s 35 yuan.',
          zh: '这里是元',
          pinyin: 'Zhè lǐ shì yuán',
          vi: 'Ở đây là 35 tệ.'
        },
        {
          start: 21.56,
          end: 23,
          en: 'The words to memorize in this lesson are:',
          zh: '本课需要记住的生词是：',
          pinyin: 'Běn kè xū yào jì zhù de shēng cí shì：',
          vi: 'Từ vựng cần thuộc trong bài là:'
        }
      ]
    },
    {
      id: 'ep-ps-jfm3pqmdkzm',
      youtubeId: 'JfM3pqMDkzM',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Nói về đồng phục trường - LUYỆN ĐỌC TIẾNG TRUNG HSK 1',
      titleVi: 'Nói về đồng phục trường',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 190,
      durationLabel: '3:10',
      topic: 'Luyện đọc HSK 1',
      note: 'Trọn bộ 25 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/JfM3pqMDkzM.json',
      cuesCount: 25,
      cues: [
        {
          start: 0.4,
          end: 2.6,
          en: 'Practice reading Chinese HSK1',
          zh: '练习读中文',
          pinyin: 'Liàn xí dú zhōng wén',
          vi: 'Luyện đọc tiếng Trung HSK1'
        },
        {
          start: 14.5,
          end: 19.44,
          en: 'I am a high school student.',
          zh: '我是一名高中生。',
          pinyin: 'Wǒ shì yì míng gāo zhōng shēng。',
          vi: 'Tôi là một học sinh trung học phổ thông.'
        },
        {
          start: 24.3,
          end: 26.18,
          en: 'This is our school uniform.',
          zh: '这是我们学校的校服。',
          pinyin: 'Zhè shì wǒ men xué xiào de xiào fú。',
          vi: 'Đây là đồng phục của trường chúng tôi.'
        }
      ]
    },
    {
      id: 'ep-ps-kb7opwmh6g4',
      youtubeId: 'KB7OPWmh6G4',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG #2 : Tuổi tác, thời gian, thời tiết',
      titleVi: 'Tuổi Tác, Thời Gian, Thời Tiết',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 99,
      durationLabel: '1:39',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 34 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/KB7OPWmh6G4.json',
      cuesCount: 34,
      cues: [
        {
          start: 0.92,
          end: 2.52,
          en: 'Yamamoto, what\'s your Chinese zodiac sign?',
          zh: '山本，你是属什么的？',
          pinyin: 'Shān běn， nǐ shì shǔ shén me de？',
          vi: 'Yamamoto, bạn tuổi con gì?'
        },
        {
          start: 6.32,
          end: 8.12,
          en: 'Then you\'re thirty this year, right?',
          zh: '那你今年三十岁了吧？',
          pinyin: 'Nà nǐ jīn nián sān shí suì le ba？',
          vi: 'Vậy năm nay bạn 30 tuổi rồi nhỉ?'
        },
        {
          start: 12.14,
          end: 15.04,
          en: 'Because I was born in the Year of the Dragon, exactly five years younger than you.',
          zh: '因为我是属龙的，正好比你小五岁。',
          pinyin: 'Yīn wèi wǒ shì shǔ lóng de， zhèng hǎo bǐ nǐ xiǎo wǔ suì。',
          vi: 'Vì tôi tuổi con Rồng, nhỏ hơn bạn đúng 5 tuổi.'
        }
      ]
    },
    {
      id: 'ep-ps-kqlmvqdf0hu',
      youtubeId: 'KQlmVqdF0HU',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Nói về văn hoá uống trà bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Nói về văn hoá uống trà bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 210,
      durationLabel: '3:30',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 25 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/KQlmVqdF0HU.json',
      cuesCount: 25,
      cues: [
        {
          start: 33.8,
          end: 37.18,
          en: 'Some people like to drink tea in the afternoon or evening.',
          zh: '有的人喜欢下午或晚上喝。',
          pinyin: 'Yǒu de rén xǐ huan xià wǔ huò wǎn shàng hē。',
          vi: 'Có người thích uống trà vào buổi chiều hoặc buổi tối.'
        },
        {
          start: 42.36,
          end: 44.76,
          en: 'Some people like to go to a teahouse to drink tea.',
          zh: '有的人喜欢去茶楼喝。',
          pinyin: 'Yǒu de rén xǐ huan qù chá lóu hē。',
          vi: 'Có người thích đến quán trà uống trà.'
        },
        {
          start: 50.72,
          end: 52.84,
          en: 'Some people like to drink tea at home.',
          zh: '有的人喜欢在家喝。',
          pinyin: 'Yǒu de rén xǐ huan zài jiā hē。',
          vi: 'Có người thích uống trà ở nhà.'
        }
      ]
    },
    {
      id: 'ep-ps-ktyucs7uons',
      youtubeId: 'KTyucS7UONs',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Bắt xe bus',
      titleVi: 'Bắt xe buýt',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 137,
      durationLabel: '2:17',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 29 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/KTyucS7UONs.json',
      cuesCount: 29,
      cues: [
        {
          start: 5.6,
          end: 9.8,
          en: 'I heard you changed jobs. Where are you working now?',
          zh: '听说你换工作了，现在在哪上班呢？',
          pinyin: 'Tīng shuō nǐ huàn gōng zuò le， xiàn zài zài nǎ shàng bān ne？',
          vi: 'Nghe nói bạn đổi việc rồi, giờ làm ở đâu vậy?'
        },
        {
          start: 11.16,
          end: 14.32,
          en: 'At a software company near Rose Building.',
          zh: '在玫瑰大楼附近的一个软件公司。',
          pinyin: 'Zài méi guī dà lóu fù jìn de yí gè ruǎn jiàn gōng sī。',
          vi: 'Ở một công ty phần mềm gần tòa nhà Hoa Hồng.'
        },
        {
          start: 15.82,
          end: 21.5,
          en: 'Rose Building? That\'s quite far from your place. Is it convenient to take the bus?',
          zh: '玫瑰大楼？那离你这儿挺远的呀，坐公交方便吗？',
          pinyin: 'Méi guī dà lóu？ nà lí nǐ zhè ér tǐng yuǎn de ya， zuò gōng jiāo fāng biàn ma？',
          vi: 'Tòa nhà Hoa Hồng? Vậy thì xa chỗ bạn lắm, đi xe buýt có tiện không?'
        }
      ]
    },
    {
      id: 'ep-ps-kuvm65ctdck',
      youtubeId: 'KUvM65cTdck',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Nói về kỳ nghỉ của bản thân bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Nói về kỳ nghỉ của bản thân',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 251,
      durationLabel: '4:11',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 36 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/KUvM65cTdck.json',
      cuesCount: 36,
      cues: [
        {
          start: 33.08,
          end: 36.88,
          en: 'This summer, I want to travel to China with my family.',
          zh: '今年夏天我要跟家人去中国旅游。',
          pinyin: 'Jīn nián xià tiān wǒ yào gēn jiā rén qù zhōng guó lǚ yóu。',
          vi: 'Mùa hè năm nay, tôi muốn đi du lịch Trung Quốc cùng gia đình.'
        },
        {
          start: 37,
          end: 47.1,
          en: 'China has many fun places,',
          zh: '中国有很多好玩的地方，',
          pinyin: 'Zhōng guó yǒu hěn duō hǎo wán de dì fāng，',
          vi: 'Trung Quốc có rất nhiều nơi thú vị,'
        },
        {
          start: 52.06,
          end: 56.52,
          en: 'But what I want to do most is climb the Great Wall and see giant pandas.',
          zh: '可是我最想去爬长城看大熊猫。',
          pinyin: 'Kě shì wǒ zuì xiǎng qù pá cháng chéng kàn dà xióng māo。',
          vi: 'Nhưng điều tôi muốn làm nhất là leo Vạn Lý Trường Thành và xem gấu trúc.'
        }
      ]
    },
    {
      id: 'ep-ps-kba25frtd0i',
      youtubeId: 'KbA25fRtD0I',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Môn thể thao bạn thích nhất là gì ?',
      titleVi: 'Môn thể thao bạn thích nhất là gì?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 94,
      durationLabel: '1:34',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 19 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/KbA25fRtD0I.json',
      cuesCount: 19,
      cues: [
        {
          start: 0.7,
          end: 8.22,
          en: 'Xiaoqiang, what\'s your favorite sport?',
          zh: '小强，你最喜欢的运动是什么？',
          pinyin: 'Xiǎo qiáng， nǐ zuì xǐ huan de yùn dòng shì shén me？',
          vi: 'Tiểu Cường, môn thể thao cậu thích nhất là gì?'
        },
        {
          start: 10.84,
          end: 12.8,
          en: 'My favorite sport is table tennis.',
          zh: '我最喜欢的运动是乒乓球。',
          pinyin: 'Wǒ zuì xǐ huan de yùn dòng shì pīng pāng qiú。',
          vi: 'Môn thể thao tớ thích nhất là bóng bàn.'
        },
        {
          start: 12.8,
          end: 16.78,
          en: 'I think every Chinese person likes table tennis.',
          zh: '我想每一个中国人都喜欢乒乓球。',
          pinyin: 'Wǒ xiǎng měi yí gè zhōng guó rén dōu xǐ huan pīng pāng qiú。',
          vi: 'Tớ nghĩ mỗi người Trung Quốc đều thích bóng bàn.'
        }
      ]
    },
    {
      id: 'ep-ps-kdlq-m7_cuk',
      youtubeId: 'KdLQ-m7_cuk',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG #8 : Chủ đề chơi thể thao',
      titleVi: 'Hội thoại chủ đề chơi thể thao',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 105,
      durationLabel: '1:45',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 37 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/KdLQ-m7_cuk.json',
      cuesCount: 37,
      cues: [
        {
          start: 0.94,
          end: 2.14,
          en: 'Do you like sports?',
          zh: '你喜欢体育运动吗?',
          pinyin: 'Nǐ xǐ huan tǐ yù yùn dòng ma?',
          vi: 'Bạn có thích thể thao không?'
        },
        {
          start: 4.52,
          end: 5.4,
          en: 'Really? How well do you play?',
          zh: '是吗?你踢得怎么样?',
          pinyin: 'Shì ma? nǐ tī dé zěn me yàng?',
          vi: 'Thật à? Bạn đá bóng thế nào?'
        },
        {
          start: 9.2,
          end: 11.46,
          en: 'Do you like watching basketball?',
          zh: '你喜欢看篮球吗?',
          pinyin: 'Nǐ xǐ huan kàn lán qiú ma?',
          vi: 'Bạn có thích xem bóng rổ không?'
        }
      ]
    },
    {
      id: 'ep-ps-kuz7nwoiwau',
      youtubeId: 'Kuz7nWOIWAU',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '80 câu hỏi đáp TIẾNG TRUNG chủ đề thời tiết【LUYỆN NGHE TIẾNG TRUNG THỤ ĐỘNG】',
      titleVi: '80 câu hỏi đáp tiếng Trung chủ đề thời tiết',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 933,
      durationLabel: '15:33',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 147 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Kuz7nWOIWAU.json',
      cuesCount: 147,
      cues: [
        {
          start: 0,
          end: 3.54,
          en: 'Listen to the audio and try to answer 80 questions about the weather topic.',
          zh: '练习听声音，试着回答个关于天气主题的问题。',
          pinyin: 'Liàn xí tīng shēng yīn， shì zhe huí dá gè guān yú tiān qì zhǔ tí de wèn tí。',
          vi: 'Hãy luyện nghe và thử trả lời 80 câu hỏi về chủ đề thời tiết.'
        },
        {
          start: 31.46,
          end: 41.2,
          en: 'Yesterday the weather was not very good.',
          zh: '昨天天气不太好。',
          pinyin: 'Zuó tiān tiān qì bú tài hǎo。',
          vi: 'Hôm qua thời tiết không tốt lắm.'
        },
        {
          start: 42.5,
          end: 49.1,
          en: 'Will it rain today?',
          zh: '今天会下雨吗？',
          pinyin: 'Jīn tiān huì xià yǔ ma？',
          vi: 'Hôm nay trời có mưa không?'
        }
      ]
    },
    {
      id: 'ep-ps-kzaj-uvupwi',
      youtubeId: 'KzaJ-uvupwI',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Đây là danh thiếp của tôi',
      titleVi: 'Đây là danh thiếp của tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 67,
      durationLabel: '1:07',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 14 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/KzaJ-uvupwI.json',
      cuesCount: 14,
      cues: [
        {
          start: 1,
          end: 3.04,
          en: 'Conversation: This is my business card.',
          zh: '会话：这就是我的名片',
          pinyin: 'Huì huà： zhè jiù shì wǒ de míng piàn',
          vi: 'Hội thoại: Đây là danh thiếp của tôi.'
        },
        {
          start: 6.18,
          end: 7.62,
          en: 'I\'m very glad to meet you.',
          zh: '很高兴和您见面',
          pinyin: 'Hěn gāo xìng hé nín jiàn miàn',
          vi: 'Rất vui được gặp anh/chị.'
        },
        {
          start: 17.72,
          end: 19.06,
          en: 'Please take care of me in the future.',
          zh: '以后请多多关照',
          pinyin: 'Yǐ hòu qǐng duō duō guān zhào',
          vi: 'Mong sau này anh/chị giúp đỡ nhiều hơn.'
        }
      ]
    },
    {
      id: 'ep-ps-l2-gw8p9pde',
      youtubeId: 'L2-Gw8P9pDE',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '10 hội thoại chủ đề khám bệnh LUYỆN NGHE TIẾNG TRUNG THỤ ĐỘNG',
      titleVi: '10 hội thoại chủ đề khám bệnh',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 429,
      durationLabel: '7:09',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 118 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/L2-Gw8P9pDE.json',
      cuesCount: 118,
      cues: [
        {
          start: 0.22,
          end: 3.58,
          en: 'Mary, why haven\'t you gotten up yet?',
          zh: '玛丽，你怎么还不起床？',
          pinyin: 'Mǎ lì， nǐ zěn me hái bù qǐ chuáng？',
          vi: 'Mary, sao bạn vẫn chưa dậy?'
        },
        {
          start: 12.12,
          end: 14.04,
          en: 'Did you catch a cold?',
          zh: '你是不是感冒了？',
          pinyin: 'Nǐ shì bu shì gǎn mào le？',
          vi: 'Bạn bị cảm rồi à?'
        },
        {
          start: 15.38,
          end: 20.32,
          en: 'Maybe. It was cold yesterday, so I caught a bit of a chill.',
          zh: '可能是，昨天天冷，我有点着凉了。',
          pinyin: 'Kě néng shì， zuó tiān tiān lěng， wǒ yǒu diǎn zháo liáng le。',
          vi: 'Chắc vậy, hôm qua trời lạnh nên mình hơi bị lạnh.'
        }
      ]
    },
    {
      id: 'ep-ps-lpjywcisq14',
      youtubeId: 'LPJYwcisQ14',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: '【HSK 1-3】我的面试故事 - Câu chuyện phỏng vấn xin việc của tôi | Chinese Podcast',
      titleVi: 'Câu chuyện phỏng vấn xin việc của tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 338,
      durationLabel: '5:38',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 86 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/LPJYwcisQ14.json',
      cuesCount: 86,
      cues: [
        {
          start: 7.02,
          end: 12.14,
          en: 'I just graduated from the University of International Business and Economics, and my major was international trade.',
          zh: '我刚刚从对外经济贸易大学毕业,我的专业是国际贸易。',
          pinyin: 'Wǒ gāng gāng cóng duì wài jīng jì mào yì dà xué bì yè, wǒ de zhuān yè shì guó jì mào yì。',
          vi: 'Tôi vừa tốt nghiệp Đại học Kinh tế và Thương mại Quốc tế, chuyên ngành của tôi là thương mại quốc tế.'
        },
        {
          start: 13.42,
          end: 15.98,
          en: 'Currently, I live in Chaoyang District, Beijing.',
          zh: '目前,我住在北京朝阳区。',
          pinyin: 'Mù qián, wǒ zhù zài běi jīng cháo yáng qū。',
          vi: 'Hiện tại, tôi sống ở quận Triều Dương, Bắc Kinh.'
        },
        {
          start: 17.16,
          end: 21.26,
          en: 'In this highly competitive city, finding a good job is not easy.',
          zh: '在这个竞争激烈的城市,找一份好工作并不容易。',
          pinyin: 'Zài zhè ge jìng zhēng jī liè de chéng shì, zhǎo yí fèn hǎo gōng zuò bìng bù róng yì。',
          vi: 'Ở thành phố cạnh tranh khốc liệt này, tìm một công việc tốt không dễ dàng.'
        }
      ]
    },
    {
      id: 'ep-ps-ls3injc3m3i',
      youtubeId: 'LS3inJc3m3I',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Tôi muốn mua 2 thùng nước',
      titleVi: 'Tôi muốn mua hai thùng nước',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 70,
      durationLabel: '1:10',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 20 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/LS3inJc3m3I.json',
      cuesCount: 20,
      cues: [
        {
          start: 0,
          end: 2.66,
          en: 'Short conversational sentence: I want to buy two barrels of water.',
          zh: '会话短句：我想买两桶水。',
          pinyin: 'Huì huà duǎn jù： wǒ xiǎng mǎi liǎng tǒng shuǐ。',
          vi: 'Câu hội thoại ngắn: Tôi muốn mua hai thùng nước.'
        },
        {
          start: 4.62,
          end: 7.52,
          en: 'Hello, I\'d like two barrels of water.',
          zh: '喂，你好，我要两桶水。',
          pinyin: 'Wèi， nǐ hǎo， wǒ yào liǎng tǒng shuǐ。',
          vi: 'Alô, xin chào, cho tôi hai thùng nước.'
        },
        {
          start: 8.36,
          end: 12.12,
          en: 'Okay, ten yuan per barrel. What\'s your address?',
          zh: '好的，十块钱一桶，你的地址是什么？',
          pinyin: 'Hǎo de， shí kuài qián yì tǒng， nǐ de dì zhǐ shì shén me？',
          vi: 'Được, mười tệ một thùng, địa chỉ của bạn là gì?'
        }
      ]
    },
    {
      id: 'ep-ps-lugsecoj5x8',
      youtubeId: 'LUGsEcOj5x8',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG #9 : Chủ đề gửi hàng bưu kiện',
      titleVi: 'Gửi bưu kiện',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 142,
      durationLabel: '2:22',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 30 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/LUGsEcOj5x8.json',
      cuesCount: 30,
      cues: [
        {
          start: 2.06,
          end: 4.96,
          en: 'How many days does it take to send an express delivery from Beijing to Shanghai?',
          zh: '寄快递从北京到上海要几天？',
          pinyin: 'Jì kuài dì cóng běi jīng dào shàng hǎi yào jǐ tiān？',
          vi: 'Gửi chuyển phát nhanh từ Bắc Kinh đến Thượng Hải mất mấy ngày?'
        },
        {
          start: 9.06,
          end: 12.1,
          en: 'How much does it cost to send this letter by express delivery?',
          zh: '这封信寄快递要多少钱？',
          pinyin: 'Zhè fēng xìn jì kuài dì yào duō shǎo qián？',
          vi: 'Gửi chuyển phát nhanh bức thư này mất bao nhiêu tiền?'
        },
        {
          start: 22.94,
          end: 24.64,
          en: 'Hello, I want to send a package.',
          zh: '你好，我要寄一个包裹。',
          pinyin: 'Nǐ hǎo， wǒ yào jì yí gè bāo guǒ。',
          vi: 'Chào bạn, tôi muốn gửi một bưu kiện.'
        }
      ]
    },
    {
      id: 'ep-ps-luhfqajzmoe',
      youtubeId: 'LUhFQAJZmoE',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Còn mấy việc nữa chưa làm xong',
      titleVi: 'Còn mấy việc nữa chưa làm xong',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 67,
      durationLabel: '1:07',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 7 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/LUhFQAJZmoE.json',
      cuesCount: 7,
      cues: [
        {
          start: 7.7,
          end: 9.14,
          en: 'There is still some work unfinished.',
          zh: '还有一些工作没做完',
          pinyin: 'Hái yǒu yì xiē gōng zuò méi zuò wán',
          vi: 'Còn một số công việc chưa làm xong.'
        },
        {
          start: 9.7,
          end: 12.82,
          en: 'Oh, lately I\'ve been working overtime every day. You must be tired.',
          zh: '哦，最近天天加班，辛苦了',
          pinyin: 'Ò， zuì jìn tiān tiān jiā bān， xīn kǔ le',
          vi: 'Ồ, dạo này ngày nào cũng tăng ca, vất vả quá.'
        },
        {
          start: 45.32,
          end: 46.04,
          en: 'recently',
          zh: '最近',
          pinyin: 'Zuì jìn',
          vi: 'gần đây, dạo này'
        }
      ]
    },
    {
      id: 'ep-ps-la4xredg9re',
      youtubeId: 'La4XREdG9rE',
      level: 'HSK 4+',
      levelGroup: 'hsk4',
      title: '【HSK 4-6】第一天上学 - Ngày đầu tiên đi học | Chinese Podcast',
      titleVi: 'Ngày đầu tiên đi học',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 331,
      durationLabel: '5:31',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 95 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/La4XREdG9rE.json',
      cuesCount: 95,
      cues: [
        {
          start: 7.46,
          end: 15.68,
          en: 'This is a fresh and wonderful experience; I hope my story can bring everyone some inspiration and happiness.',
          zh: '这是一次既新鲜又美好的经历，希望我的故事能给大家带来一些启发和快乐。',
          pinyin: 'Zhè shì yí cì jì xīn xiān yòu měi hǎo de jīng lì， xī wàng wǒ de gù shì néng gěi dà jiā dài lái yì xiē qǐ fā hé kuài lè。',
          vi: 'Đây là một trải nghiệm vừa mới mẻ vừa tuyệt vời, hy vọng câu chuyện của tôi có thể mang lại cho mọi người một chút cảm hứng và niềm vui.'
        },
        {
          start: 17.48,
          end: 25.5,
          en: 'I am a girl from Vietnam. This year, I came to China for the first time to study abroad, starting a new life of study at Nanjing University.',
          zh: '我是一名来自越南的女生，今年第一次来到中国留学，在南京大学开始新的学习生活。',
          pinyin: 'Wǒ shì yì míng lái zì yuè nán de nǚ shēng， jīn nián dì yī cì lái dào zhōng guó liú xué， zài nán jīng dà xué kāi shǐ xīn de xué xí shēng huó。',
          vi: 'Tôi là một nữ sinh đến từ Việt Nam. Năm nay, lần đầu tiên tôi sang Trung Quốc du học, bắt đầu cuộc sống học tập mới tại Đại học Nam Kinh.'
        },
        {
          start: 26.56,
          end: 29.68,
          en: 'Nanjing University is one of China\'s top universities.',
          zh: '南京大学是中国顶尖的大学之一',
          pinyin: 'Nán jīng dà xué shì zhōng guó dǐng jiān de dà xué zhī yī',
          vi: 'Đại học Nam Kinh là một trong những trường đại học hàng đầu Trung Quốc.'
        }
      ]
    },
    {
      id: 'ep-ps-lub-sw22_xy',
      youtubeId: 'Lub-sW22_XY',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HỌC TIẾNG TRUNG BỒI 2021 : Chủ đề bạn đến nhà chơi || Giao tiếp thông dụng',
      titleVi: 'Bạn đến nhà chơi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 490,
      durationLabel: '8:10',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 93 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Lub-sW22_XY.json',
      cuesCount: 93,
      cues: [
        {
          start: 38.98,
          end: 43.06,
          en: 'Part 1: You will learn common expressions on the topic: You come to my house to hang out.',
          zh: '第一部分，你将学习常用语，主题是：你来家里玩。',
          pinyin: 'Dì yī bù fen， nǐ jiāng xué xí cháng yòng yǔ， zhǔ tí shì： nǐ lái jiā lǐ wán。',
          vi: 'Phần 1, bạn sẽ học những cách nói thông dụng theo chủ đề: Bạn đến nhà chơi.'
        },
        {
          start: 44.18,
          end: 46.62,
          en: 'First, to invite someone as a guest.',
          zh: '首先，请客。',
          pinyin: 'Shǒu xiān， qǐng kè。',
          vi: 'Trước hết, mời khách.'
        },
        {
          start: 50.58,
          end: 51.64,
          en: 'It means to invite/treat someone as a guest.',
          zh: '意思是请客。',
          pinyin: 'Yì sī shì qǐng kè。',
          vi: 'Nghĩa là mời khách / đãi khách.'
        }
      ]
    },
    {
      id: 'ep-ps-mkhfksfrube',
      youtubeId: 'MKhfkSFRubE',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Giới thiệu về người bạn Nhật Bản bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Giới thiệu về người bạn Nhật Bản bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 285,
      durationLabel: '4:45',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 36 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/MKhfkSFRubE.json',
      cuesCount: 36,
      cues: [
        {
          start: 27.18,
          end: 30.02,
          en: 'This is my husband, Daming.',
          zh: '这是我的爱人，大明。',
          pinyin: 'Zhè shì wǒ de ài rén， dà míng。',
          vi: 'Đây là chồng tôi, Đại Minh.'
        },
        {
          start: 35.64,
          end: 39,
          en: 'We both studied in Japan before.',
          zh: '我们以前都在日本学习。',
          pinyin: 'Wǒ men yǐ qián dōu zài rì běn xué xí。',
          vi: 'Trước đây chúng tôi đều học ở Nhật Bản.'
        },
        {
          start: 44.66,
          end: 48.5,
          en: 'We can speak Japanese and know many Japanese people.',
          zh: '我们会说日语，认识很多日本人。',
          pinyin: 'Wǒ men huì shuō rì yǔ， rèn shi hěn duō rì běn rén。',
          vi: 'Chúng tôi biết nói tiếng Nhật và quen biết nhiều người Nhật.'
        }
      ]
    },
    {
      id: 'ep-ps-mnmdm7oigm0',
      youtubeId: 'MNmdm7OiGM0',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Tỉ phú Mark Zuckerberg chúc Tết bằng TIẾNG TRUNG',
      titleVi: 'Tỉ phú Mark Zuckerberg chúc Tết bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 95,
      durationLabel: '1:35',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 26 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/MNmdm7OiGM0.json',
      cuesCount: 26,
      cues: [
        {
          start: 5.68,
          end: 10.5,
          en: 'Being able to celebrate the New Year with Max this year, Priscilla and I are very excited.',
          zh: '今年能和一起庆祝新年，我和普莉希拉非常兴奋。',
          pinyin: 'Jīn nián néng hé yì qǐ qìng zhù xīn nián， wǒ hé pǔ lì xī lā fēi cháng xīng fèn。',
          vi: 'Năm nay có thể cùng Max đón Tết, tôi và Priscilla rất phấn khích.'
        },
        {
          start: 11.52,
          end: 17.54,
          en: 'We hope you can also celebrate with your family and friends.',
          zh: '我们希望你也能够和你的家人朋友一起庆祝。',
          pinyin: 'Wǒ men xī wàng nǐ yě néng gòu hé nǐ de jiā rén péng yǒu yì qǐ qìng zhù。',
          vi: 'Chúng tôi hy vọng bạn cũng có thể cùng gia đình và bạn bè của bạn đón Tết.'
        },
        {
          start: 17.86,
          end: 20.5,
          en: 'For Facebook\'s annual Chinese New Year party,',
          zh: '为了的年度春节晚会，',
          pinyin: 'Wèi le de nián dù chūn jié wǎn huì，',
          vi: 'Cho bữa tiệc Tết thường niên của Facebook,'
        }
      ]
    },
    {
      id: 'ep-ps-mlc3d3nggxc',
      youtubeId: 'MlC3D3ngGXc',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Hôm nay tôi không thể đi làm',
      titleVi: 'Hội thoại ngắn tiếng Trung: Hôm nay tôi không thể đi làm',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 50,
      durationLabel: '0:50',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 9 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/MlC3D3ngGXc.json',
      cuesCount: 9,
      cues: [
        {
          start: 0.64,
          end: 9.3,
          en: 'Boss, I\'m sorry, I can\'t come to work today.',
          zh: '老板，对不起，我今天不能来上班了。',
          pinyin: 'Lǎo bǎn， duì bù qǐ， wǒ jīn tiān bù néng lái shàng bān le。',
          vi: 'Sếp ơi, xin lỗi, hôm nay tôi không thể đến đi làm được.'
        },
        {
          start: 10.62,
          end: 13.54,
          en: 'Why? Are you feeling unwell?',
          zh: '为什么？你不舒服吗？',
          pinyin: 'Wèi shén me？ nǐ bù shū fú ma？',
          vi: 'Tại sao? Bạn không khỏe à?'
        },
        {
          start: 18.24,
          end: 23.9,
          en: 'Okay, take good care of yourself. See you tomorrow.',
          zh: '好，那你好好照顾自己。明天见。',
          pinyin: 'Hǎo， nà nǐ hǎo hǎo zhào gù zì jǐ。 míng tiān jiàn。',
          vi: 'Được, vậy bạn hãy tự chăm sóc bản thân thật tốt nhé. Hẹn gặp lại ngày mai.'
        }
      ]
    },
    {
      id: 'ep-ps-mtmc3c5y1ts',
      youtubeId: 'MtmC3c5y1Ts',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG #5 : Chủ đề hỏi đường',
      titleVi: 'Luyện nghe hội thoại tiếng Trung: Chủ đề hỏi đường',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 124,
      durationLabel: '2:04',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 36 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/MtmC3c5y1Ts.json',
      cuesCount: 36,
      cues: [
        {
          start: 1.04,
          end: 3.28,
          en: 'Hello, is it far from here to the train station?',
          zh: '你好，这儿离火车站远吗？',
          pinyin: 'Nǐ hǎo， zhè ér lí huǒ chē zhàn yuǎn ma？',
          vi: 'Chào bạn, từ đây đến ga tàu hỏa có xa không?'
        },
        {
          start: 5.04,
          end: 7.42,
          en: 'Is that so? Can I go there by bus?',
          zh: '是吗？可以坐公交车去吗？',
          pinyin: 'Shì ma？ kě yǐ zuò gōng jiāo chē qù ma？',
          vi: 'Vậy à? Có thể đi xe buýt đến đó không?'
        },
        {
          start: 7.66,
          end: 10.3,
          en: 'It\'s more convenient to take the subway; the subway station is right ahead.',
          zh: '坐地铁去更方便，前面就是地铁站。',
          pinyin: 'Zuò dì tiě qù gèng fāng biàn， qián miàn jiù shì dì tiě zhàn。',
          vi: 'Đi tàu điện ngầm thì tiện hơn, phía trước chính là ga tàu điện ngầm.'
        }
      ]
    },
    {
      id: 'ep-ps-n3gpdord36a',
      youtubeId: 'N3GPDOrD36A',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Bạn về nhà bằng cách nào ?',
      titleVi: 'Bạn về nhà bằng cách nào?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 43,
      durationLabel: '0:43',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 5 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/N3GPDOrD36A.json',
      cuesCount: 5,
      cues: [
        {
          start: 21,
          end: 21.38,
          en: 'how',
          zh: '怎么',
          pinyin: 'Zěn me',
          vi: 'thế nào / bằng cách nào'
        },
        {
          start: 24.92,
          end: 25.74,
          en: 'go home',
          zh: '回家',
          pinyin: 'Huí jiā',
          vi: 'về nhà'
        },
        {
          start: 28.84,
          end: 29.24,
          en: 'by / to take',
          zh: '坐',
          pinyin: 'Zuò',
          vi: 'đi bằng / ngồi'
        }
      ]
    },
    {
      id: 'ep-ps-n8qtlbjdzbq',
      youtubeId: 'N8qTLbJdZbQ',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Bài đọc TIẾNG TRUNG : Tại sao mọi người nên học TIẾNG TRUNG',
      titleVi: 'Tại sao mọi người nên học tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 161,
      durationLabel: '2:41',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 39 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/N8qTLbJdZbQ.json',
      cuesCount: 39,
      cues: [
        {
          start: 4.8,
          end: 8.6,
          en: 'Recently, the British government allocated £10 million.',
          zh: '最近，英国政府拨款万英镑',
          pinyin: 'Zuì jìn， yīng guó zhèng fǔ bō kuǎn wàn yīng bàng',
          vi: 'Gần đây, chính phủ Anh đã cấp 10 triệu bảng Anh.'
        },
        {
          start: 9.48,
          end: 13.18,
          en: 'to support British schools in offering Chinese language teaching.',
          zh: '来支持英国学校开展中文教学',
          pinyin: 'Lái zhī chí yīng guó xué xiào kāi zhǎn zhōng wén jiào xué',
          vi: 'để hỗ trợ các trường học ở Anh triển khai giảng dạy tiếng Trung.'
        },
        {
          start: 14.64,
          end: 17.84,
          en: 'The government\'s goal is that by 2020,',
          zh: '政府的目标是到年',
          pinyin: 'Zhèng fǔ de mù biāo shì dào nián',
          vi: 'Mục tiêu của chính phủ là đến năm 2020,'
        }
      ]
    },
    {
      id: 'ep-ps-nvlswpnfswu',
      youtubeId: 'NVLswpNFswU',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Tôi muốn đặt phòng',
      titleVi: 'Tôi muốn đặt phòng',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 203,
      durationLabel: '3:23',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 34 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/NVLswpNFswU.json',
      cuesCount: 34,
      cues: [
        {
          start: 30,
          end: 30.56,
          en: 'What day will you be checking in?',
          zh: '您哪天入住？',
          pinyin: 'Nín nǎ tiān rù zhù？',
          vi: 'Quý khách nhận phòng ngày nào?'
        },
        {
          start: 32.72,
          end: 33.68,
          en: 'October 1st.',
          zh: '月日',
          pinyin: 'Yuè rì',
          vi: 'Ngày 1 tháng 10.'
        },
        {
          start: 35.64,
          end: 36.02,
          en: 'How many days are you staying?',
          zh: '住几天？',
          pinyin: 'Zhù jǐ tiān？',
          vi: 'Ở mấy ngày?'
        }
      ]
    },
    {
      id: 'ep-ps-nimvg4j5f9i',
      youtubeId: 'NiMvG4j5F9I',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Nói về thời tiết của Thượng Hải bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Nói về thời tiết Thượng Hải',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 292,
      durationLabel: '4:52',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 29 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/NiMvG4j5F9I.json',
      cuesCount: 29,
      cues: [
        {
          start: 30,
          end: 33.74,
          en: 'Spring, summer, autumn and winter.',
          zh: '春天、夏天、秋天和冬天。',
          pinyin: 'Chūn tiān、 xià tiān、 qiū tiān hé dōng tiān。',
          vi: 'Mùa xuân, mùa hè, mùa thu và mùa đông.'
        },
        {
          start: 39.22,
          end: 43.12,
          en: 'April and May are Shanghai\'s spring.',
          zh: '四月和五月是上海的春天。',
          pinyin: 'Sì yuè hé wǔ yuè shì shàng hǎi de chūn tiān。',
          vi: 'Tháng Tư và tháng Năm là mùa xuân của Thượng Hải.'
        },
        {
          start: 48.64,
          end: 52.04,
          en: 'The weather is very warm and it rarely rains.',
          zh: '天气很暖和，很少下雨。',
          pinyin: 'Tiān qì hěn nuǎn huo， hěn shǎo xià yǔ。',
          vi: 'Thời tiết rất ấm áp, hiếm khi mưa.'
        }
      ]
    },
    {
      id: 'ep-ps-nv11kwfhul0',
      youtubeId: 'Nv11KWfhUL0',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '10 hội thoại đời sống chủ đề ăn uống LUYỆN NGHE TIẾNG TRUNG THỤ ĐỘNG',
      titleVi: '10 hội thoại đời sống chủ đề ăn uống',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 503,
      durationLabel: '8:23',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 148 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Nv11KWfhUL0.json',
      cuesCount: 148,
      cues: [
        {
          start: 3.52,
          end: 9.92,
          en: 'Hello, I\'d like to reserve a table for tomorrow evening.',
          zh: '您好，我想预订明天晚上吃饭的位子。',
          pinyin: 'Nín hǎo， wǒ xiǎng yù dìng míng tiān wǎn shàng chī fàn de wèi zǐ。',
          vi: 'Xin chào, tôi muốn đặt bàn cho tối mai.'
        },
        {
          start: 11.04,
          end: 14.88,
          en: 'Sir, what time will you arrive?',
          zh: '先生，请问您几点到？',
          pinyin: 'Xiān shēng， qǐng wèn nín jǐ diǎn dào？',
          vi: 'Thưa ông, xin hỏi ông đến lúc mấy giờ?'
        },
        {
          start: 17.64,
          end: 19.5,
          en: 'How many people are there in total?',
          zh: '你们一共几位？',
          pinyin: 'Nǐ men yí gòng jǐ wèi？',
          vi: 'Các bạn tổng cộng mấy người?'
        }
      ]
    },
    {
      id: 'ep-ps-nwgjl5qdfhu',
      youtubeId: 'NwGjL5qDfhU',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Đăng ký vào khám bệnh',
      titleVi: 'Đăng ký khám bệnh',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 132,
      durationLabel: '2:12',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 24 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/NwGjL5qDfhU.json',
      cuesCount: 24,
      cues: [
        {
          start: 0.76,
          end: 9.88,
          en: 'Nurse: Good morning, which department do you need to register for?',
          zh: '护士：早上好，请问您需要挂哪个科室？',
          pinyin: 'Hù shì： zǎo shàng hǎo， qǐng wèn nín xū yào guà nǎ gè kē shì？',
          vi: 'Y tá: Chào buổi sáng, anh/chị cần đăng ký khám ở khoa nào ạ?'
        },
        {
          start: 16.48,
          end: 18.98,
          en: 'Then where do you feel unwell?',
          zh: '那请问您哪里不舒服？',
          pinyin: 'Nà qǐng wèn nín nǎ lǐ bù shū fú？',
          vi: 'Vậy anh/chị thấy khó chịu ở đâu ạ?'
        },
        {
          start: 21.4,
          end: 24.84,
          en: 'I have stomach pain, feel nauseous, and also want to vomit.',
          zh: '我胃疼，恶心，还想吐。',
          pinyin: 'Wǒ wèi téng， ě xīn， hái xiǎng tǔ。',
          vi: 'Tôi đau dạ dày, buồn nôn và còn muốn nôn nữa.'
        }
      ]
    },
    {
      id: 'ep-ps-o2fodsgmqgw',
      youtubeId: 'O2fODSGMQgw',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG #7 : Chủ đề đi khám bệnh',
      titleVi: 'Luyện nghe hội thoại tiếng Trung: Đi khám bệnh',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 145,
      durationLabel: '2:25',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 34 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/O2fODSGMQgw.json',
      cuesCount: 34,
      cues: [
        {
          start: 2.34,
          end: 5.46,
          en: 'Doctor, I have a stomachache; it hurts badly.',
          zh: '大夫，我肚子疼，疼得厉害。',
          pinyin: 'Dài fu， wǒ dù zǐ téng， téng dé lì hài。',
          vi: 'Bác sĩ, tôi đau bụng, đau dữ dội.'
        },
        {
          start: 6.18,
          end: 7.74,
          en: 'When did it start?',
          zh: '从什么时候开始的？',
          pinyin: 'Cóng shén me shí hòu kāi shǐ de？',
          vi: 'Bắt đầu từ khi nào ạ?'
        },
        {
          start: 16.58,
          end: 18.62,
          en: 'Okay, please get a lab test done.',
          zh: '好，请化验一下吧。',
          pinyin: 'Hǎo， qǐng huà yàn yí xià ba。',
          vi: 'Được rồi, bạn đi xét nghiệm một chút nhé.'
        }
      ]
    },
    {
      id: 'ep-ps-o8gib5hv7iw',
      youtubeId: 'O8GiB5hV7Iw',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Đây là thẻ khoá phòng',
      titleVi: 'Đây là thẻ khóa phòng',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 52,
      durationLabel: '0:52',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 6 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/O8GiB5hV7Iw.json',
      cuesCount: 6,
      cues: [
        {
          start: 0.3,
          end: 1.4,
          en: 'This is your room card.',
          zh: '这是您的房卡',
          pinyin: 'Zhè shì nín de fáng kǎ',
          vi: 'Đây là thẻ khóa phòng của ngài.'
        },
        {
          start: 31.84,
          end: 32.24,
          en: 'you (polite)',
          zh: '您',
          pinyin: 'Nín',
          vi: 'ngài (kính ngữ)'
        },
        {
          start: 35.08,
          end: 35.64,
          en: 'room card',
          zh: '房卡',
          pinyin: 'Fáng kǎ',
          vi: 'thẻ phòng'
        }
      ]
    },
    {
      id: 'ep-ps-oz87uejj8so',
      youtubeId: 'Oz87UEjJ8So',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Tôi muốn cắt tóc',
      titleVi: 'Tôi muốn cắt tóc',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 184,
      durationLabel: '3:04',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 30 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Oz87UEjJ8So.json',
      cuesCount: 30,
      cues: [
        {
          start: 0.64,
          end: 2.52,
          en: 'One-minute conversation: I\'d like a haircut.',
          zh: '会话一分钟：我想剪发。',
          pinyin: 'Huì huà yì fēn zhōng： wǒ xiǎng jiǎn fà。',
          vi: 'Hội thoại một phút: Tôi muốn cắt tóc.'
        },
        {
          start: 30,
          end: 33.84,
          en: '58 yuan, or 178 yuan for the manager to cut it. Which one would you like?',
          zh: '元，店长剪元，你要哪一种？',
          pinyin: 'Yuán， diàn cháng jiǎn yuán， nǐ yào nǎ yì zhǒng？',
          vi: '58 tệ, cắt với quản lý là 178 tệ, bạn muốn loại nào?'
        },
        {
          start: 36.44,
          end: 37.94,
          en: 'The 58 yuan one, thanks.',
          zh: '元的，谢谢。',
          pinyin: 'Yuán de， xiè xiè。',
          vi: 'Loại 58 tệ, cảm ơn.'
        }
      ]
    },
    {
      id: 'ep-ps-psbesruwjvy',
      youtubeId: 'PSbesRUwJVY',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe 30 hội thoại giao tiếp TIẾNG TRUNG | Chinese Conversations in Daily Life',
      titleVi: 'Luyện nghe 30 hội thoại giao tiếp tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 1352,
      durationLabel: '22:32',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 285 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/PSbesRUwJVY.json',
      cuesCount: 285,
      cues: [
        {
          start: 30.94,
          end: 31.6,
          en: 'Hello everyone.',
          zh: '你们好',
          pinyin: 'Nǐ men hǎo',
          vi: 'Xin chào các bạn.'
        },
        {
          start: 32.4,
          end: 33.08,
          en: 'Hello, teacher.',
          zh: '老师好',
          pinyin: 'Lǎo shī hǎo',
          vi: 'Chào thầy/cô ạ.'
        },
        {
          start: 51.94,
          end: 52.29,
          en: 'I\'m David.',
          zh: '我是大卫',
          pinyin: 'Wǒ shì dà wèi',
          vi: 'Tôi là David.'
        }
      ]
    },
    {
      id: 'ep-ps-pckmzx8rpkk',
      youtubeId: 'PckMzX8rPkk',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Đây là đại lý du lịch Tân Tân',
      titleVi: 'Đây là đại lý du lịch Tân Tân',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 102,
      durationLabel: '1:42',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 18 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/PckMzX8rPkk.json',
      cuesCount: 18,
      cues: [
        {
          start: 3.44,
          end: 10.24,
          en: 'Good morning, this is Xin Xin Travel Agency. How can I help you?',
          zh: '早上好，这里是新新旅行社，有什么需要帮助的吗？',
          pinyin: 'Zǎo shàng hǎo， zhè lǐ shì xīn xīn lǚ xíng shè， yǒu shén me xū yào bāng zhù de ma？',
          vi: 'Chào buổi sáng, đây là đại lý du lịch Tân Tân, có gì cần giúp đỡ không ạ?'
        },
        {
          start: 12.64,
          end: 17.92,
          en: 'Good morning, I\'d like to know if you have any tour routes to Beijing.',
          zh: '早上好，我想知道你们有去北京的旅行线路吗？',
          pinyin: 'Zǎo shàng hǎo， wǒ xiǎng zhī dào nǐ men yǒu qù běi jīng de lǚ xíng xiàn lù ma？',
          vi: 'Chào buổi sáng, tôi muốn biết các bạn có tuyến du lịch đến Bắc Kinh không ạ?'
        },
        {
          start: 20.04,
          end: 22.26,
          en: 'Of course, sir.',
          zh: '当然可以，先生。',
          pinyin: 'Dāng rán kě yǐ， xiān shēng。',
          vi: 'Tất nhiên là được, thưa ông.'
        }
      ]
    },
    {
      id: 'ep-ps-pnzpkbo0jnc',
      youtubeId: 'PnzpkBo0jnc',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG : Chủ đề đi chợ | 去市场',
      titleVi: 'Hội thoại tiếng Trung: Đi chợ',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 315,
      durationLabel: '5:15',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 87 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/PnzpkBo0jnc.json',
      cuesCount: 87,
      cues: [
        {
          start: 12.88,
          end: 18.48,
          en: 'Today I\'m standing at Shilin Market in the Shilin District of Taipei City.',
          zh: '今天我是站在台北市士林区的士林大市场。',
          pinyin: 'Jīn tiān wǒ shì zhàn zài tái běi shì shì lín qū dī shì lín dà shì chǎng。',
          vi: 'Hôm nay tôi đang đứng ở Chợ lớn Sĩ Lâm, quận Sĩ Lâm, thành phố Đài Bắc.'
        },
        {
          start: 19.02,
          end: 21.38,
          en: 'Then let\'s go see what good stuff is inside.',
          zh: '那我们去看看里面有什么好东西。',
          pinyin: 'Nà wǒ men qù kàn kàn lǐ miàn yǒu shén me hǎo dōng xī。',
          vi: 'Vậy chúng ta hãy vào xem bên trong có gì hay nhé.'
        },
        {
          start: 22.74,
          end: 26.86,
          en: 'This market is open from three in the morning.',
          zh: '这个市场是从早上三点开始。',
          pinyin: 'Zhè ge shì chǎng shì cóng zǎo shàng sān diǎn kāi shǐ。',
          vi: 'Chợ này mở cửa từ ba giờ sáng.'
        }
      ]
    },
    {
      id: 'ep-ps-psd5fh6jofu',
      youtubeId: 'Psd5fh6jOFU',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Gói đồ mang về',
      titleVi: 'Gói đồ mang về',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 45,
      durationLabel: '0:45',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 5 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Psd5fh6jOFU.json',
      cuesCount: 5,
      cues: [
        {
          start: 0.64,
          end: 7.6,
          en: 'Waiter, pack these up.',
          zh: '服务员，这些打包。',
          pinyin: 'Fú wù yuán， zhè xiē dǎ bāo。',
          vi: 'Phục vụ ơi, đóng gói những thứ này.'
        },
        {
          start: 18.76,
          end: 27.62,
          en: 'Waiter, pack these up.',
          zh: '服务员，这些打包。',
          pinyin: 'Fú wù yuán， zhè xiē dǎ bāo。',
          vi: 'Phục vụ ơi, đóng gói những thứ này.'
        },
        {
          start: 30.38,
          end: 30.76,
          en: 'Soup',
          zh: '汤',
          pinyin: 'Tāng',
          vi: 'Canh'
        }
      ]
    },
    {
      id: 'ep-ps-q22sxzsn-xs',
      youtubeId: 'Q22sxZsN-Xs',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Bạn muốn tự lấy hàng hay giao tận nơi ?',
      titleVi: 'Bạn muốn tự lấy hàng hay giao tận nơi?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 166,
      durationLabel: '2:46',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 21 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Q22sxZsN-Xs.json',
      cuesCount: 21,
      cues: [
        {
          start: 30,
          end: 30.35,
          en: 'takeout; delivery',
          zh: '外卖',
          pinyin: 'Wài mài',
          vi: 'đồ ăn mang đi / giao tận nơi'
        },
        {
          start: 34.4,
          end: 34.86,
          en: 'self-pickup',
          zh: '自取',
          pinyin: 'Zì qǔ',
          vi: 'tự lấy (đồ ăn)'
        },
        {
          start: 39.5,
          end: 39.88,
          en: 'food delivery',
          zh: '送餐',
          pinyin: 'Sòng cān',
          vi: 'giao đồ ăn'
        }
      ]
    },
    {
      id: 'ep-ps-q5lw6gd2wqi',
      youtubeId: 'Q5Lw6gD2WQI',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe TIẾNG TRUNG thụ động【VIDEO #16】Gặp chuyện không may',
      titleVi: 'Gặp chuyện không may',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 277,
      durationLabel: '4:37',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 48 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Q5Lw6gD2WQI.json',
      cuesCount: 48,
      cues: [
        {
          start: 30.64,
          end: 31.84,
          en: 'It\'s all bruised from the collision.',
          zh: '都被撞青了',
          pinyin: 'Dōu bèi zhuàng qīng le',
          vi: 'Đều bị va đập bầm tím cả rồi.'
        },
        {
          start: 32.36,
          end: 33.18,
          en: 'What bad luck.',
          zh: '真倒霉',
          pinyin: 'Zhēn dǎo méi',
          vi: 'Thật xui xẻo.'
        },
        {
          start: 35.88,
          end: 37.26,
          en: 'Later, when riding a bike.',
          zh: '以后骑车的时候',
          pinyin: 'Yǐ hòu qí chē de shí hòu',
          vi: 'Sau này khi đi xe đạp'
        }
      ]
    },
    {
      id: 'ep-ps-qf08oik6icy',
      youtubeId: 'QF08Oik6IcY',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Cho tôi 1 vé tàu cao tốc',
      titleVi: 'Cho tôi một vé tàu cao tốc',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 83,
      durationLabel: '1:23',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 19 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/QF08Oik6IcY.json',
      cuesCount: 19,
      cues: [
        {
          start: 0.54,
          end: 10.22,
          en: 'Hello, one high-speed train ticket from Shanghai to Beijing',
          zh: '你好，一张高铁票，上海到北京',
          pinyin: 'Nǐ hǎo， yì zhāng gāo tiě piào， shàng hǎi dào běi jīng',
          vi: 'Xin chào, một vé tàu cao tốc từ Thượng Hải đến Bắc Kinh'
        },
        {
          start: 19.92,
          end: 20.64,
          en: 'Give me your passport',
          zh: '给我护照',
          pinyin: 'Gěi wǒ hù zhào',
          vi: 'Đưa hộ chiếu cho tôi'
        },
        {
          start: 21.16,
          end: 21.51,
          en: 'Okay',
          zh: '好',
          pinyin: 'Hǎo',
          vi: 'Được'
        }
      ]
    },
    {
      id: 'ep-ps-ql2tubmppsc',
      youtubeId: 'QL2TUbmPpSc',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '200 câu hỏi đáp TIẾNG TRUNG cơ bản thông dụng【LUYỆN NGHE TIẾNG TRUNG THỤ ĐỘNG】',
      titleVi: '200 câu hỏi đáp tiếng Trung cơ bản thông dụng',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 2735,
      durationLabel: '45:35',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 440 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/QL2TUbmPpSc.json',
      cuesCount: 440,
      cues: [
        {
          start: 17.82,
          end: 23.72,
          en: 'Are you a teacher?',
          zh: '你是老师吗？',
          pinyin: 'Nǐ shì lǎo shī ma？',
          vi: 'Bạn là giáo viên à?'
        },
        {
          start: 24.38,
          end: 32.22,
          en: 'No, I\'m not a teacher.',
          zh: '不是，我不是老师。',
          pinyin: 'Bú shì， wǒ bú shì lǎo shī。',
          vi: 'Không, tôi không phải là giáo viên.'
        },
        {
          start: 36.84,
          end: 39.28,
          en: 'No, I\'m not a teacher.',
          zh: '不是，我不是老师。',
          pinyin: 'Bú shì， wǒ bú shì lǎo shī。',
          vi: 'Không, tôi không phải là giáo viên.'
        }
      ]
    },
    {
      id: 'ep-ps-qwlhcsamht0',
      youtubeId: 'QwlhcsAMhT0',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: '【HSK 1-3】一个下雨天 - Một ngày trời mưa | Chinese Podcast',
      titleVi: 'Một ngày trời mưa',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 282,
      durationLabel: '4:42',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 68 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/QwlhcsAMhT0.json',
      cuesCount: 68,
      cues: [
        {
          start: 6.24,
          end: 10.38,
          en: 'Have you ever had rainy days like this, when you don\'t know what to do?',
          zh: '你们有没有遇到过这样的雨天 不知道该做什么的时候',
          pinyin: 'Nǐ men yǒu méi yǒu yù dào guò zhè yàng de yǔ tiān bù zhī dào gāi zuò shén me de shí hòu',
          vi: 'Các bạn có bao giờ gặp những ngày mưa như thế này, lúc không biết nên làm gì không?'
        },
        {
          start: 11.46,
          end: 16.96,
          en: 'If you want to know what I usually do on rainy days, listen to my sharing.',
          zh: '如果你们想知道我在雨天通常做什么 就听我分享吧',
          pinyin: 'Rú guǒ nǐ men xiǎng zhī dào wǒ zài yǔ tiān tōng cháng zuò shén me jiù tīng wǒ fēn xiǎng ba',
          vi: 'Nếu các bạn muốn biết tôi thường làm gì trong ngày mưa, hãy nghe tôi chia sẻ nhé.'
        },
        {
          start: 18.74,
          end: 24.52,
          en: 'I live alone in Guangdong, in a small apartment, and outside it\'s raining heavily.',
          zh: '我一个人住在广东 一个小小的公寓里 外面下着很大的雨',
          pinyin: 'Wǒ yí gè rén zhù zài guǎng dōng yí gè xiǎo xiǎo de gōng yù lǐ wài miàn xià zhe hěn dà de yǔ',
          vi: 'Tôi sống một mình ở Quảng Đông, trong một căn hộ nhỏ, bên ngoài trời đang mưa rất to.'
        }
      ]
    },
    {
      id: 'ep-ps-qy5pkp9-bj4',
      youtubeId: 'Qy5Pkp9-bj4',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Mua vé tàu',
      titleVi: 'Mua vé tàu',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 48,
      durationLabel: '0:48',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 9 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Qy5Pkp9-bj4.json',
      cuesCount: 9,
      cues: [
        {
          start: 0.38,
          end: 9.64,
          en: 'Where can I buy a train ticket to Beijing?',
          zh: '哪里可以买去北京的火车票？',
          pinyin: 'Nǎ lǐ kě yǐ mǎi qù běi jīng de huǒ chē piào？',
          vi: 'Ở đâu có thể mua vé tàu đi Bắc Kinh?'
        },
        {
          start: 11.1,
          end: 14.46,
          en: 'You must go to the train station.',
          zh: '你必须去火车站。',
          pinyin: 'Nǐ bì xū qù huǒ chē zhàn。',
          vi: 'Bạn phải đến ga tàu hỏa.'
        },
        {
          start: 18.66,
          end: 19.68,
          en: 'It\'s hard to say.',
          zh: '很难说。',
          pinyin: 'Hěn nán shuō。',
          vi: 'Khó nói lắm.'
        }
      ]
    },
    {
      id: 'ep-ps-rte49f9ultg',
      youtubeId: 'RTE49f9uLtg',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: '【HSK 1-3】我们为什么要读书 - Tại sao chúng ta cần đọc sách | Chinese Podcast',
      titleVi: 'Tại sao chúng ta cần đọc sách',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 253,
      durationLabel: '4:13',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 61 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/RTE49f9uLtg.json',
      cuesCount: 61,
      cues: [
        {
          start: 5.98,
          end: 9.56,
          en: 'In today\'s era, phones and computers are very convenient,',
          zh: '在现在的时代，手机和电脑非常方便，',
          pinyin: 'Zài xiàn zài de shí dài， shǒu jī hé diàn nǎo fēi cháng fāng biàn，',
          vi: 'Trong thời đại hiện nay, điện thoại và máy tính rất tiện lợi,'
        },
        {
          start: 10.46,
          end: 13.18,
          en: 'we can watch short videos, we can play games,',
          zh: '我们可以看短视频，可以玩游戏，',
          pinyin: 'Wǒ men kě yǐ kàn duǎn shì pín， kě yǐ wán yóu xì，',
          vi: 'chúng ta có thể xem video ngắn, có thể chơi game,'
        },
        {
          start: 14.08,
          end: 18.2,
          en: 'so many people feel that reading books is boring and also slow.',
          zh: '所以很多人觉得读书很无聊，也很慢。',
          pinyin: 'Suǒ yǐ hěn duō rén jué de dú shū hěn wú liáo， yě hěn màn。',
          vi: 'vì vậy nhiều người cảm thấy đọc sách rất nhàm chán và cũng rất chậm.'
        }
      ]
    },
    {
      id: 'ep-ps-rlmzytjw-i0',
      youtubeId: 'RlmzyTJw-I0',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Công ty cậu khi nào nghỉ TẾT ?',
      titleVi: 'Công ty cậu khi nào nghỉ Tết?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 153,
      durationLabel: '2:33',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 23 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/RlmzyTJw-I0.json',
      cuesCount: 23,
      cues: [
        {
          start: 0.64,
          end: 3.02,
          en: 'When does your company have a holiday?',
          zh: '你公司什么时候放假？',
          pinyin: 'Nǐ gōng sī shén me shí hòu fàng jià？',
          vi: 'Công ty cậu khi nào nghỉ Tết?'
        },
        {
          start: 32.28,
          end: 34.28,
          en: 'Our company will be on holiday around the 20th.',
          zh: '我公司这个月号左右放假。',
          pinyin: 'Wǒ gōng sī zhè ge yuè hào zuǒ yòu fàng jià。',
          vi: 'Công ty tớ nghỉ Tết khoảng ngày 20 tháng này.'
        },
        {
          start: 36.58,
          end: 38.18,
          en: 'Does your company give a year-end bonus?',
          zh: '你公司发年终奖金吗？',
          pinyin: 'Nǐ gōng sī fā nián zhōng jiǎng jīn ma？',
          vi: 'Công ty cậu có thưởng cuối năm không?'
        }
      ]
    },
    {
      id: 'ep-ps-rvgbsl6q2za',
      youtubeId: 'RvgbSL6q2ZA',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '【HSK3】10 câu chuyện ngắn luyện nghe TIẾNG TRUNG (PHẦN 2)',
      titleVi: '10 câu chuyện ngắn luyện nghe tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 665,
      durationLabel: '11:05',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 149 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/RvgbSL6q2ZA.json',
      cuesCount: 149,
      cues: [
        {
          start: 0.6,
          end: 2.1,
          en: 'A pleasant shopping trip',
          zh: '一次愉快的购物',
          pinyin: 'Yí cì yú kuài de gòu wù',
          vi: 'Một lần mua sắm vui vẻ'
        },
        {
          start: 2.16,
          end: 8.8,
          en: 'This afternoon I went to the supermarket to buy things.',
          zh: '今天下午我去超市买东西了',
          pinyin: 'Jīn tiān xià wǔ wǒ qù chāo shì mǎi dōng xī le',
          vi: 'Chiều nay tôi đi siêu thị mua đồ.'
        },
        {
          start: 11.68,
          end: 14.58,
          en: 'As soon as I entered, I took a shopping cart.',
          zh: '一进门,我拿了一辆购物车',
          pinyin: 'Yí jìn mén, wǒ ná le yí liàng gòu wù chē',
          vi: 'Vừa vào cửa, tôi lấy một chiếc xe đẩy hàng.'
        }
      ]
    },
    {
      id: 'ep-ps-rwebh8ljnp8',
      youtubeId: 'RwEBH8LJNP8',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '80 câu hỏi đáp TIẾNG TRUNG chủ đề đến nhà bạn chơi【LUYỆN NGHE TIẾNG TRUNG THỤ ĐỘNG】',
      titleVi: 'Đến nhà bạn chơi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 1066,
      durationLabel: '17:46',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 220 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/RwEBH8LJNP8.json',
      cuesCount: 220,
      cues: [
        {
          start: 30,
          end: 35.82,
          en: 'Then come to my place on Sunday!',
          zh: '那星期天来我家玩吧。',
          pinyin: 'Nà xīng qī tiān lái wǒ jiā wán ba。',
          vi: 'Vậy chủ nhật đến nhà mình chơi nhé!'
        },
        {
          start: 37.34,
          end: 44.28,
          en: 'Sure, I haven\'t been to your place in a long time.',
          zh: '好啊，好久没去你家玩了。',
          pinyin: 'Hǎo a， hǎo jiǔ méi qù nǐ jiā wán le。',
          vi: 'Được thôi, lâu rồi mình chưa đến nhà bạn chơi.'
        },
        {
          start: 47.64,
          end: 55.86,
          en: 'Do you still remember my home address?',
          zh: '你还记得我家的地址吗？',
          pinyin: 'Nǐ hái jì de wǒ jiā de dì zhǐ ma？',
          vi: 'Bạn còn nhớ địa chỉ nhà mình không?'
        }
      ]
    },
    {
      id: 'ep-ps-s4zozjhakp0',
      youtubeId: 'S4ZOzjhakp0',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn giới thiệu về gấu trúc bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Đoạn văn giới thiệu về gấu trúc bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 204,
      durationLabel: '3:24',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 29 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/S4ZOzjhakp0.json',
      cuesCount: 29,
      cues: [
        {
          start: 13.86,
          end: 21.12,
          en: 'My favorite animal is the panda',
          zh: '我最喜欢的动物是熊猫',
          pinyin: 'Wǒ zuì xǐ huan de dòng wù shì xióng māo',
          vi: 'Con vật tôi thích nhất là gấu trúc'
        },
        {
          start: 25.26,
          end: 26.48,
          en: 'It is very smart',
          zh: '它非常聪明',
          pinyin: 'Tā fēi cháng cōng ming',
          vi: 'Nó rất thông minh'
        },
        {
          start: 30.94,
          end: 34.28,
          en: 'It has two black eyes.',
          zh: '它有两只黑眼睛。',
          pinyin: 'Tā yǒu liǎng zhī hēi yǎn jīng。',
          vi: 'Nó có hai mắt đen.'
        }
      ]
    },
    {
      id: 'ep-ps-smth062676o',
      youtubeId: 'SmTH062676o',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Nó nghĩa là bữa sáng',
      titleVi: 'Nó nghĩa là bữa sáng',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 79,
      durationLabel: '1:19',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 14 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/SmTH062676o.json',
      cuesCount: 14,
      cues: [
        {
          start: 0.78,
          end: 12.56,
          en: 'How can you tell?',
          zh: '你怎么看出来的',
          pinyin: 'Nǐ zěn me kàn chū lái de',
          vi: 'Làm sao bạn nhìn ra được?'
        },
        {
          start: 14.84,
          end: 16.66,
          en: 'When I was walking on the street',
          zh: '我在街上走的时候',
          pinyin: 'Wǒ zài jiē shàng zǒu de shí hòu',
          vi: 'Khi tôi đang đi trên phố'
        },
        {
          start: 17.26,
          end: 20.04,
          en: 'I could often see signs by the roadside',
          zh: '常常可以看到路旁的招牌',
          pinyin: 'Cháng cháng kě yǐ kàn dào lù páng de zhāo pái',
          vi: 'thường có thể thấy những tấm biển bên đường'
        }
      ]
    },
    {
      id: 'ep-ps-t5hinocl_vc',
      youtubeId: 'T5hInOCl_vc',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Đoạn văn ngắn TIẾNG TRUNG : Sau giờ làm bạn sẽ làm gì ?',
      titleVi: 'Sau giờ làm, bạn sẽ làm gì?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 135,
      durationLabel: '2:15',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 27 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/T5hInOCl_vc.json',
      cuesCount: 27,
      cues: [
        {
          start: 5.58,
          end: 8.5,
          en: 'After you get off work in the evening, what will you do?',
          zh: '晚上下班之后,你们会做什么事情呢?',
          pinyin: 'Wǎn shàng xià bān zhī hòu, nǐ men huì zuò shén me shì qíng ne?',
          vi: 'Buổi tối sau khi tan làm, các bạn sẽ làm gì?'
        },
        {
          start: 10.36,
          end: 12.8,
          en: 'After a tiring day, having finished your work,',
          zh: '劳累了一天,结束了自己的工作,',
          pinyin: 'Láo lèi le yì tiān, jié shù le zì jǐ de gōng zuò,',
          vi: 'Sau một ngày mệt mỏi, kết thúc công việc của mình,'
        },
        {
          start: 13.94,
          end: 17.82,
          en: 'Everyone will return to their own little home and enjoy temporary ease.',
          zh: '大家会回到自己的小家里,享受暂时的安逸。',
          pinyin: 'Dà jiā huì huí dào zì jǐ de xiǎo jiā lǐ, xiǎng shòu zàn shí de ān yì。',
          vi: 'Mọi người sẽ trở về ngôi nhà nhỏ của mình và tận hưởng sự an nhàn tạm thời.'
        }
      ]
    },
    {
      id: 'ep-ps-tdfpkrhdisy',
      youtubeId: 'TdfpkrHdISY',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Phục vụ, đưa tôi cái thìa',
      titleVi: 'Phục vụ, đưa tôi cái thìa',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 106,
      durationLabel: '1:46',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 28 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/TdfpkrHdISY.json',
      cuesCount: 28,
      cues: [
        {
          start: 0.44,
          end: 12.38,
          en: 'Waiter, give me a knife.',
          zh: '服务员，给我一把刀子。',
          pinyin: 'Fú wù yuán， gěi wǒ yì bǎ dāo zǐ。',
          vi: 'Phục vụ ơi, cho tôi một con dao.'
        },
        {
          start: 16.64,
          end: 19.08,
          en: 'Waiter, give me a knife.',
          zh: '服务员，给我一把刀子。',
          pinyin: 'Fú wù yuán， gěi wǒ yì bǎ dāo zǐ。',
          vi: 'Phục vụ ơi, cho tôi một con dao.'
        },
        {
          start: 19.8,
          end: 20.16,
          en: 'Alright.',
          zh: '好的。',
          pinyin: 'Hǎo de。',
          vi: 'Được ạ.'
        }
      ]
    },
    {
      id: 'ep-ps-tt3caupj5aw',
      youtubeId: 'Tt3CAUpj5Aw',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe TIẾNG TRUNG thụ động【VIDEO #3】Thời gian và số đếm',
      titleVi: 'Luyện nghe tiếng Trung thụ động: Thời gian và số đếm',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 337,
      durationLabel: '5:37',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 40 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Tt3CAUpj5Aw.json',
      cuesCount: 40,
      cues: [
        {
          start: 0,
          end: 1.34,
          en: 'Practice listening to Chinese.',
          zh: '训练听中文',
          pinyin: 'Xùn liàn tīng zhōng wén',
          vi: 'Luyện nghe tiếng Trung.'
        },
        {
          start: 3,
          end: 6,
          en: 'Video 3: Time and numbers.',
          zh: '视频3：时间和数量',
          pinyin: 'Shì pín 3： shí jiān hé shù liàng',
          vi: 'Video 3: Thời gian và số đếm.'
        },
        {
          start: 38.22,
          end: 39.7,
          en: 'What about 6 to 10?',
          zh: '到呢？',
          pinyin: 'Dào ne？',
          vi: 'Còn từ 6 đến 10 thì sao?'
        }
      ]
    },
    {
      id: 'ep-ps-u2olfmbbsjs',
      youtubeId: 'U2oLfmbbsjs',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Nói về một lần đi khám bệnh bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Nói về một lần đi khám bệnh bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 201,
      durationLabel: '3:21',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 38 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/U2oLfmbbsjs.json',
      cuesCount: 38,
      cues: [
        {
          start: 0.4,
          end: 2.6,
          en: 'Practice reading Chinese and master HSK1',
          zh: '训练读中文，搞定',
          pinyin: 'Xùn liàn dú zhōng wén， gǎo dìng',
          vi: 'Luyện đọc tiếng Trung, chinh phục HSK1'
        },
        {
          start: 7.48,
          end: 9.06,
          en: 'Part 1: Listen and read each sentence.',
          zh: '部分1：听和读每句话。',
          pinyin: 'Bù fen 1： tīng hé dú měi jù huà。',
          vi: 'Phần 1: nghe và đọc từng câu.'
        },
        {
          start: 10.52,
          end: 12.86,
          en: 'Part 2: Learn about culture and the importance of cultural construction.',
          zh: '部分2：学习文化和文化建构的重要性。',
          pinyin: 'Bù fen 2： xué xí wén huà hé wén huà jiàn gòu de zhòng yào xìng。',
          vi: 'Phần 2: học văn hóa và tầm quan trọng của việc xây dựng văn hóa.'
        }
      ]
    },
    {
      id: 'ep-ps-uqjriiuv9b8',
      youtubeId: 'UQjRiiuv9b8',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: '【HSK2】10 câu chuyện ngắn luyện nghe TIẾNG TRUNG (PHẦN 2)',
      titleVi: '10 câu chuyện ngắn luyện nghe tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 591,
      durationLabel: '9:51',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 82 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/UQjRiiuv9b8.json',
      cuesCount: 82,
      cues: [
        {
          start: 4.42,
          end: 6.04,
          en: 'Today is my birthday.',
          zh: '今天是我的生日。',
          pinyin: 'Jīn tiān shì wǒ de shēng rì。',
          vi: 'Hôm nay là sinh nhật của tôi.'
        },
        {
          start: 8.98,
          end: 11.86,
          en: 'The gift I gave myself was a pair of shoes.',
          zh: '我送给自己的礼物，是一双鞋。',
          pinyin: 'Wǒ sòng gěi zì jǐ de lǐ wù， shì yì shuāng xié。',
          vi: 'Món quà tôi tặng cho chính mình là một đôi giày.'
        },
        {
          start: 15.14,
          end: 18.52,
          en: 'These shoes are a bit expensive, but the color is very pretty.',
          zh: '这双鞋有点贵，但是颜色很好看。',
          pinyin: 'Zhè shuāng xié yǒu diǎn guì， dàn shì yán sè hěn hǎo kàn。',
          vi: 'Đôi giày này hơi đắt, nhưng màu sắc rất đẹp.'
        }
      ]
    },
    {
      id: 'ep-ps-uaxmap8nq0i',
      youtubeId: 'UaXmaP8NQ0I',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '100 câu TIẾNG TRUNG giao tiếp với đối tác, khách hàng【TIẾNG TRUNG CHO NGƯỜI ĐI LÀM - BÀI 4】',
      titleVi: '100 câu tiếng Trung giao tiếp với đối tác, khách hàng',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 2573,
      durationLabel: '42:53',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 326 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/UaXmaP8NQ0I.json',
      cuesCount: 326,
      cues: [
        {
          start: 20.62,
          end: 22.58,
          en: 'You are Mr. Wang from Shanghai, right?',
          zh: '您是从上海来的王先生吧？',
          pinyin: 'Nín shì cóng shàng hǎi lái de wáng xiān shēng ba？',
          vi: 'Ông là ông Vương đến từ Thượng Hải, phải không ạ?'
        },
        {
          start: 24.14,
          end: 26.58,
          en: 'You are Mr. Wang from Shanghai, right?',
          zh: '您是从上海来的王先生吧？',
          pinyin: 'Nín shì cóng shàng hǎi lái de wáng xiān shēng ba？',
          vi: 'Ông là ông Vương đến từ Thượng Hải, phải không ạ?'
        },
        {
          start: 27.78,
          end: 37.06,
          en: 'You are Mr. Wang from Shanghai, right?',
          zh: '您是从上海来的王先生吧？',
          pinyin: 'Nín shì cóng shàng hǎi lái de wáng xiān shēng ba？',
          vi: 'Ông là ông Vương đến từ Thượng Hải, phải không ạ?'
        }
      ]
    },
    {
      id: 'ep-ps-ul1mjr-ixfy',
      youtubeId: 'Ul1MjR-IXfY',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Bài đọc TIẾNG TRUNG : Thực phẩm tốt và không tốt cho sức khoẻ',
      titleVi: 'Thực phẩm tốt và không tốt cho sức khỏe',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 121,
      durationLabel: '2:01',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 27 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Ul1MjR-IXfY.json',
      cuesCount: 27,
      cues: [
        {
          start: 3.42,
          end: 8.5,
          en: 'Health is very important to anyone.',
          zh: '健康对任何人来说都是很重要的',
          pinyin: 'Jiàn kāng duì rèn hé rén lái shuō dōu shì hěn zhòng yào de',
          vi: 'Sức khỏe đối với bất kỳ ai đều rất quan trọng.'
        },
        {
          start: 9.92,
          end: 12.62,
          en: 'Especially children and elderly people.',
          zh: '尤其是孩子和老年人',
          pinyin: 'Yóu qí shì hái zi hé lǎo nián rén',
          vi: 'Đặc biệt là trẻ em và người già.'
        },
        {
          start: 14.5,
          end: 17.16,
          en: 'Therefore, when choosing food,',
          zh: '因此,在选择食物的时候',
          pinyin: 'Yīn cǐ, zài xuǎn zé shí wù de shí hòu',
          vi: 'Vì vậy, khi lựa chọn thực phẩm,'
        }
      ]
    },
    {
      id: 'ep-ps-uv0puqn4xn0',
      youtubeId: 'Uv0pUqn4Xn0',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe TIẾNG TRUNG thụ động【VIDEO #1】Chào hỏi và giới thiệu',
      titleVi: 'Chào hỏi và giới thiệu',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 253,
      durationLabel: '4:13',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 35 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Uv0pUqn4Xn0.json',
      cuesCount: 35,
      cues: [
        {
          start: 0,
          end: 10.56,
          en: 'Excuse me, is Lily at home?',
          zh: '请问，莉莉在家吗？',
          pinyin: 'Qǐng wèn， lì lì zài jiā ma？',
          vi: 'Cho hỏi, Lily có nhà không?'
        },
        {
          start: 23.74,
          end: 24.98,
          en: 'Hello, Jack.',
          zh: '你好，杰克。',
          pinyin: 'Nǐ hǎo， jié kè。',
          vi: 'Chào Jack.'
        },
        {
          start: 28.36,
          end: 30.14,
          en: 'Long time no see. How are you?',
          zh: '好久不见，你好吗？',
          pinyin: 'Hǎo jiǔ bú jiàn， nǐ hǎo ma？',
          vi: 'Lâu rồi không gặp, bạn khỏe không?'
        }
      ]
    },
    {
      id: 'ep-ps-v5z4p5l2bke',
      youtubeId: 'V5z4P5L2bKE',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Bạn làm việc ở đâu ?',
      titleVi: 'Bạn làm việc ở đâu?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 91,
      durationLabel: '1:31',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 11 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/V5z4P5L2bKE.json',
      cuesCount: 11,
      cues: [
        {
          start: 0.64,
          end: 2.72,
          en: 'Dialogue 1: Where do you work?',
          zh: '会话一：你工作在哪里？',
          pinyin: 'Huì huà yī： nǐ gōng zuò zài nǎ lǐ？',
          vi: 'Hội thoại 1: Bạn làm việc ở đâu?'
        },
        {
          start: 30.1,
          end: 35.6,
          en: 'Wow, a doctor! That\'s a great job. I really envy you.',
          zh: '哇，医生啊，好工作，真羡慕。',
          pinyin: 'Wā， yī shēng a， hǎo gōng zuò， zhēn xiàn mù。',
          vi: 'Chà, bác sĩ à, công việc tốt quá, thật ngưỡng mộ.'
        },
        {
          start: 38.22,
          end: 38.82,
          en: 'Thanks.',
          zh: '谢谢啊。',
          pinyin: 'Xiè xiè a。',
          vi: 'Cảm ơn nhé.'
        }
      ]
    },
    {
      id: 'ep-ps-w502chdirqa',
      youtubeId: 'W502cHdIrqA',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: '【HSK 1-3】真正的朋友 - Người bạn chân chính | Chinese Podcast',
      titleVi: 'Người bạn chân chính',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 252,
      durationLabel: '4:12',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 68 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/W502cHdIrqA.json',
      cuesCount: 68,
      cues: [
        {
          start: 0.18,
          end: 4.3,
          en: 'In the journey of life, we all encounter difficulties and challenges.',
          zh: '在生活的旅途中，我们都会遇到困难和挑战。',
          pinyin: 'Zài shēng huó de lǚ tú zhōng， wǒ men dōu huì yù dào kùn nán hé tiǎo zhàn。',
          vi: 'Trong hành trình cuộc sống, chúng ta đều gặp phải khó khăn và thử thách.'
        },
        {
          start: 5.66,
          end: 11.64,
          en: 'A true friend is someone who is still willing to support and help you when you are at your most difficult time.',
          zh: '真正的朋友是在你最困难的时候依然愿意支持和帮助你的人。',
          pinyin: 'Zhēn zhèng de péng yǒu shì zài nǐ zuì kùn nán de shí hòu yī rán yuàn yì zhī chí hé bāng zhù nǐ de rén。',
          vi: 'Một người bạn chân chính là người vẫn sẵn sàng ủng hộ và giúp đỡ bạn khi bạn khó khăn nhất.'
        },
        {
          start: 13.14,
          end: 17.46,
          en: 'Today, I want to share a story about true friends with everyone,',
          zh: '今天，我想和大家分享一个关于真正朋友的故事，',
          pinyin: 'Jīn tiān， wǒ xiǎng hé dà jiā fēn xiǎng yí gè guān yú zhēn zhèng péng yǒu de gù shì，',
          vi: 'Hôm nay, tôi muốn chia sẻ với các bạn một câu chuyện về người bạn chân chính,'
        }
      ]
    },
    {
      id: 'ep-ps-wkg4jniqy4g',
      youtubeId: 'WKG4jniqY4g',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe TIẾNG TRUNG thụ động【VIDEO #7】Giao thông và thời tiết',
      titleVi: 'Giao thông và thời tiết',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 306,
      durationLabel: '5:06',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 46 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/WKG4jniqY4g.json',
      cuesCount: 46,
      cues: [
        {
          start: 0,
          end: 11.62,
          en: 'Excuse me, how do I get to the Forbidden City?',
          zh: '请问，到故宫怎么走？',
          pinyin: 'Qǐng wèn， dào gù gōng zěn me zǒu？',
          vi: 'Xin hỏi, đến Cố Cung đi thế nào?'
        },
        {
          start: 15.6,
          end: 18.2,
          en: 'Take bus No. 1.',
          zh: '乘一路公共汽车',
          pinyin: 'Chéng yí lù gōng gòng qì chē',
          vi: 'Đi xe buýt số 1.'
        },
        {
          start: 22.46,
          end: 24.06,
          en: 'Where do I get off?',
          zh: '到哪儿下车？',
          pinyin: 'Dào nǎ ér xià chē？',
          vi: 'Xuống xe ở đâu?'
        }
      ]
    },
    {
      id: 'ep-ps-wu5xrrtjg84',
      youtubeId: 'Wu5XRRTjg84',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Đoạn văn ngắn TIẾNG TRUNG : Giới thiệu về TIKTOK',
      titleVi: 'Giới thiệu về TikTok',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 72,
      durationLabel: '1:12',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 11 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Wu5XRRTjg84.json',
      cuesCount: 11,
      cues: [
        {
          start: 30,
          end: 32.74,
          en: 'What is their life like?',
          zh: '他们的生活是怎么样的？',
          pinyin: 'Tā men de shēng huó shì zěn me yàng de？',
          vi: 'Cuộc sống của họ như thế nào?'
        },
        {
          start: 35.46,
          end: 36.8,
          en: 'Yes, we can learn about their lives through it.',
          zh: '对，我们可以通过它了解他们的生活。',
          pinyin: 'Duì， wǒ men kě yǐ tōng guò tā liǎo jiě tā men de shēng huó。',
          vi: 'Đúng vậy, chúng ta có thể tìm hiểu cuộc sống của họ thông qua nó.'
        },
        {
          start: 37.8,
          end: 38.66,
          en: 'young people',
          zh: '年轻人',
          pinyin: 'Nián qīng rén',
          vi: 'người trẻ'
        }
      ]
    },
    {
      id: 'ep-ps-xoa02-jezda',
      youtubeId: 'Xoa02-JEzDA',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Đây là phòng của ai ?',
      titleVi: 'Đây là phòng của ai?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 49,
      durationLabel: '0:49',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 12 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Xoa02-JEzDA.json',
      cuesCount: 12,
      cues: [
        {
          start: 7.94,
          end: 9.9,
          en: 'This is mine and my husband\'s.',
          zh: '这是我和我丈夫的',
          pinyin: 'Zhè shì wǒ hé wǒ zhàng fu de',
          vi: 'Đây là của tôi và chồng tôi.'
        },
        {
          start: 10.54,
          end: 13.7,
          en: 'The small room next door is my daughter\'s.',
          zh: '旁边那个小的房间是我女儿的',
          pinyin: 'Páng biān nà ge xiǎo de fáng jiān shì wǒ nǚ ér de',
          vi: 'Căn phòng nhỏ bên cạnh là của con gái tôi.'
        },
        {
          start: 14.76,
          end: 16.68,
          en: 'Your daughter\'s room is really beautiful.',
          zh: '你女儿的房间真漂亮',
          pinyin: 'Nǐ nǚ ér de fáng jiān zhēn piào liang',
          vi: 'Phòng của con gái bạn thật đẹp.'
        }
      ]
    },
    {
      id: 'ep-ps-yc3l3fk9ldm',
      youtubeId: 'YC3l3fK9LdM',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn nói về chiếc tủ lạnh bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Chiếc tủ lạnh nhà tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 224,
      durationLabel: '3:44',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 31 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/YC3l3fK9LdM.json',
      cuesCount: 31,
      cues: [
        {
          start: 18.22,
          end: 20.72,
          en: 'Our family has a very big refrigerator.',
          zh: '我们家有一个很大的冰箱',
          pinyin: 'Wǒ men jiā yǒu yí gè hěn dà de bīng xiāng',
          vi: 'Nhà chúng tôi có một chiếc tủ lạnh rất to.'
        },
        {
          start: 26.74,
          end: 27.44,
          en: 'In the refrigerator',
          zh: '冰箱里',
          pinyin: 'Bīng xiāng lǐ',
          vi: 'Trong tủ lạnh'
        },
        {
          start: 28.22,
          end: 29.26,
          en: 'There is a lot of food',
          zh: '有很多食物',
          pinyin: 'Yǒu hěn duō shí wù',
          vi: 'Có rất nhiều thức ăn'
        }
      ]
    },
    {
      id: 'ep-ps-yy7yv__xvfy',
      youtubeId: 'YY7yV__XVFY',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe TIẾNG TRUNG thụ động【VIDEO #6】Đi ngân hàng',
      titleVi: 'Đi ngân hàng',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 245,
      durationLabel: '4:05',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 29 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/YY7yV__XVFY.json',
      cuesCount: 29,
      cues: [
        {
          start: 32.16,
          end: 37,
          en: 'This is 650 yuan.',
          zh: '这是块。',
          pinyin: 'Zhè shì kuài。',
          vi: 'Đây là 650 tệ.'
        },
        {
          start: 38.76,
          end: 40.84,
          en: 'Please count it.',
          zh: '请数一下。',
          pinyin: 'Qǐng shù yí xià。',
          vi: 'Xin hãy đếm lại.'
        },
        {
          start: 43.8,
          end: 46.92,
          en: 'That\'s right, thank you.',
          zh: '没错，谢谢。',
          pinyin: 'Méi cuò， xiè xiè。',
          vi: 'Đúng rồi, cảm ơn.'
        }
      ]
    },
    {
      id: 'ep-ps-ziahst453e0',
      youtubeId: 'Ziahst453E0',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG #10 : Đi ăn nhà hàng',
      titleVi: 'Đi ăn nhà hàng',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 120,
      durationLabel: '2:00',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 50 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Ziahst453E0.json',
      cuesCount: 50,
      cues: [
        {
          start: 0.96,
          end: 4,
          en: 'Waiter, could you recommend a few dishes for us?',
          zh: '服务员,能给我们推荐几个菜吗?',
          pinyin: 'Fú wù yuán, néng gěi wǒ men tuī jiàn jǐ gè cài ma?',
          vi: 'Nhân viên ơi, anh/chị giới thiệu cho chúng tôi vài món được không?'
        },
        {
          start: 4.92,
          end: 6.8,
          en: 'What flavor of cuisine would you like?',
          zh: '您想吃什么风味的菜?',
          pinyin: 'Nín xiǎng chī shén me fēng wèi de cài?',
          vi: 'Quý khách muốn ăn món theo khẩu vị nào?'
        },
        {
          start: 7.66,
          end: 9.06,
          en: 'Are there any lighter dishes?',
          zh: '有清淡一点的菜吗?',
          pinyin: 'Yǒu qīng dàn yì diǎn de cài ma?',
          vi: 'Có món nào thanh đạm hơn không?'
        }
      ]
    },
    {
      id: 'ep-ps-zj4sdzjylry',
      youtubeId: 'Zj4sDZjylRY',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Giới thiệu về đất nước Trung Quốc bằng TIẾNG TRUNG',
      titleVi: 'Giới thiệu về đất nước Trung Quốc',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 260,
      durationLabel: '4:20',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 30 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/Zj4sDZjylRY.json',
      cuesCount: 30,
      cues: [
        {
          start: 30,
          end: 40.6,
          en: 'China is currently the most populous country in the world, with a population of 1.5 billion.',
          zh: '中国目前是世界上人口最多的国家，拥有亿人口。',
          pinyin: 'Zhōng guó mù qián shì shì jiè shàng rén kǒu zuì duō de guó jiā， yōng yǒu yì rén kǒu。',
          vi: 'Trung Quốc hiện là quốc gia đông dân nhất thế giới, với 1,5 tỷ dân.'
        },
        {
          start: 41.82,
          end: 47.64,
          en: 'China is also a country with a rich and diverse culture.',
          zh: '中国还是一个拥有丰富多元文化的国家。',
          pinyin: 'Zhōng guó hái shì yí gè yōng yǒu fēng fù duō yuán wén huà de guó jiā。',
          vi: 'Trung Quốc còn là một đất nước có nền văn hóa đa dạng và phong phú.'
        },
        {
          start: 49.16,
          end: 52.58,
          en: 'The Spring Festival is the biggest festival in China.',
          zh: '春节是中国最大的节日。',
          pinyin: 'Chūn jié shì zhōng guó zuì dà de jié rì。',
          vi: 'Tết Nguyên đán là ngày lễ lớn nhất ở Trung Quốc.'
        }
      ]
    },
    {
      id: 'ep-ps-_7sov1vtfk4',
      youtubeId: '_7SOv1Vtfk4',
      level: 'HSK 4+',
      levelGroup: 'hsk4',
      title: '【HSK 4-6】10 việc nhỏ mang lại lợi ích lớn cho cuộc đời - 人生高回报率的十件小事 | Chinese Podcast',
      titleVi: '10 việc nhỏ mang lại lợi ích lớn cho cuộc đời',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 332,
      durationLabel: '5:32',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 86 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/_7SOv1Vtfk4.json',
      cuesCount: 86,
      cues: [
        {
          start: 30,
          end: 31.62,
          en: 'Your body gets better and better.',
          zh: '身材越来越好',
          pinyin: 'Shēn cái yuè lái yuè hǎo',
          vi: 'Vóc dáng ngày càng đẹp hơn.'
        },
        {
          start: 31.94,
          end: 33.66,
          en: 'Your inner self also gets stronger.',
          zh: '内心也越来越强大',
          pinyin: 'Nèi xīn yě yuè lái yuè qiáng dà',
          vi: 'Nội tâm cũng ngày càng mạnh mẽ.'
        },
        {
          start: 34.7,
          end: 36.56,
          en: 'Exercise not only strengthens the body,',
          zh: '运动不仅能强身健体',
          pinyin: 'Yùn dòng bù jǐn néng qiáng shēn jiàn tǐ',
          vi: 'Tập thể dục không chỉ tăng cường sức khỏe,'
        }
      ]
    },
    {
      id: 'ep-ps-_vk-v9enppa',
      youtubeId: '_Vk-v9EnpPA',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn nói về quả dưa hấu bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Đoạn văn tiếng Trung về quả dưa hấu',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 180,
      durationLabel: '3:00',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 22 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/_Vk-v9EnpPA.json',
      cuesCount: 22,
      cues: [
        {
          start: 13.36,
          end: 21.16,
          en: 'My favorite fruit is watermelon',
          zh: '我最喜欢的水果是西瓜',
          pinyin: 'Wǒ zuì xǐ huan de shuǐ guǒ shì xī guā',
          vi: 'Trái cây tôi thích nhất là dưa hấu'
        },
        {
          start: 25.52,
          end: 27.16,
          en: 'Its outside is green',
          zh: '它的外面是绿色的',
          pinyin: 'Tā de wài miàn shì lǜ sè de',
          vi: 'Vỏ ngoài của nó màu xanh'
        },
        {
          start: 31.5,
          end: 35.56,
          en: 'The inside is red.',
          zh: '里面是红色的。',
          pinyin: 'Lǐ miàn shì hóng sè de。',
          vi: 'Bên trong màu đỏ.'
        }
      ]
    },
    {
      id: 'ep-ps-_en60dryn-s',
      youtubeId: '_en60dRYn-s',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Cậu biết nấu ăn không ?',
      titleVi: 'Hội thoại ngắn: Cậu biết nấu ăn không?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 55,
      durationLabel: '0:55',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 12 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/_en60dRYn-s.json',
      cuesCount: 12,
      cues: [
        {
          start: 0.02,
          end: 2.64,
          en: 'Short conversation: Do you know how to cook?',
          zh: '对话短文，你会煮饭吗？',
          pinyin: 'Duì huà duǎn wén， nǐ huì zhǔ fàn ma？',
          vi: 'Hội thoại ngắn: Cậu biết nấu ăn không?'
        },
        {
          start: 10.64,
          end: 16.76,
          en: 'I cook very well; my specialty is tomato scrambled eggs.',
          zh: '我做得很好，我的拿手菜是番茄炒蛋。',
          pinyin: 'Wǒ zuò dé hěn hǎo， wǒ de ná shǒu cài shì fān qié chǎo dàn。',
          vi: 'Tôi nấu rất giỏi, món tủ của tôi là trứng xào cà chua.'
        },
        {
          start: 18.26,
          end: 20.68,
          en: 'Then cook it for me next time.',
          zh: '那你下一次做给我吃。',
          pinyin: 'Nà nǐ xià yí cì zuò gěi wǒ chī。',
          vi: 'Vậy thì lần sau cậu nấu cho tôi ăn nhé.'
        }
      ]
    },
    {
      id: 'ep-ps-_hlwzk-yslw',
      youtubeId: '_hlwzk-YsLw',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Gợi ý cho tôi một địa điểm du lịch',
      titleVi: 'Gợi ý cho tôi một địa điểm du lịch',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 112,
      durationLabel: '1:52',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 15 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/_hlwzk-YsLw.json',
      cuesCount: 15,
      cues: [
        {
          start: 0.56,
          end: 3.48,
          en: 'Please recommend a travel destination for me',
          zh: '对话练习中：请给我推荐一个旅游的地方',
          pinyin: 'Duì huà liàn xí zhōng： qǐng gěi wǒ tuī jiàn yí gè lǚ yóu de dì fāng',
          vi: 'Hãy gợi ý cho tôi một địa điểm du lịch'
        },
        {
          start: 31.36,
          end: 37.16,
          en: 'Fragrant Hills, what a nice name! Is it because that mountain is very fragrant?',
          zh: '香山，这个名字可真好听，是因为那座山很香吗？',
          pinyin: 'Xiāng shān， zhè ge míng zì kě zhēn hǎo tīng， shì yīn wèi nà zuò shān hěn xiāng ma？',
          vi: 'Hương Sơn, cái tên này nghe hay thật, có phải vì ngọn núi đó rất thơm không?'
        },
        {
          start: 43.66,
          end: 48.98,
          en: 'In autumn, Fragrant Hills is especially beautiful, with leaves and plants of all colors.',
          zh: '秋天的香山，风景特别美，有各种颜色的树叶、植物',
          pinyin: 'Qiū tiān de xiāng shān， fēng jǐng tè bié měi， yǒu gè zhǒng yán sè de shù yè、 zhí wù',
          vi: 'Hương Sơn vào mùa thu phong cảnh rất đẹp, có lá cây và thực vật đủ màu sắc.'
        }
      ]
    },
    {
      id: 'ep-ps-_okgkfrv794',
      youtubeId: '_okgKFRV794',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Khí hậu ở Thượng Hải thế nào ?',
      titleVi: 'Khí hậu ở Thượng Hải thế nào?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 78,
      durationLabel: '1:18',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 24 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/_okgKFRV794.json',
      cuesCount: 24,
      cues: [
        {
          start: 0.44,
          end: 3.22,
          en: 'I know a little about the climate in Shanghai.',
          zh: '我对上海的气候有点了解。',
          pinyin: 'Wǒ duì shàng hǎi de qì hòu yǒu diǎn liǎo jiě。',
          vi: 'Tôi có hiểu biết một chút về khí hậu ở Thượng Hải.'
        },
        {
          start: 3.26,
          end: 7.44,
          en: 'What is the climate like in Shanghai?',
          zh: '上海的气候怎么样？',
          pinyin: 'Shàng hǎi de qì hòu zěn me yàng？',
          vi: 'Khí hậu ở Thượng Hải thế nào?'
        },
        {
          start: 8.38,
          end: 13.38,
          en: 'Not good. Summers are muggy and hot, winters are damp and cold.',
          zh: '不好，夏天又闷又热，冬天又湿又冷。',
          pinyin: 'Bù hǎo， xià tiān yòu mēn yòu rè， dōng tiān yòu shī yòu lěng。',
          vi: 'Không tốt. Mùa hè thì vừa oi bức vừa nóng, mùa đông thì vừa ẩm vừa lạnh.'
        }
      ]
    },
    {
      id: 'ep-ps-asndnvm2ika',
      youtubeId: 'aSNdNvM2IKA',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Nói về một lần đi ăn lẩu bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Nói về một lần đi ăn lẩu bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 240,
      durationLabel: '4:00',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 32 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/aSNdNvM2IKA.json',
      cuesCount: 32,
      cues: [
        {
          start: 7.98,
          end: 23.84,
          en: 'Xiaoming and I arrived at Chongqing Railway Station yesterday afternoon.',
          zh: '我和小明是昨天下午到重庆火车站的。',
          pinyin: 'Wǒ hé xiǎo míng shì zuó tiān xià wǔ dào chóng qìng huǒ chē zhàn de。',
          vi: 'Tôi và Tiểu Minh đến ga tàu Trùng Khánh lúc chiều hôm qua.'
        },
        {
          start: 29.04,
          end: 31.52,
          en: 'This is our first time in Chongqing.',
          zh: '这是我们第一次来重庆。',
          pinyin: 'Zhè shì wǒ men dì yī cì lái chóng qìng。',
          vi: 'Đây là lần đầu tiên chúng tôi đến Trùng Khánh.'
        },
        {
          start: 31.52,
          end: 31.87,
          en: 'This is our first time in Chongqing.',
          zh: '这是我们第一次来重庆。',
          pinyin: 'Zhè shì wǒ men dì yī cì lái chóng qìng。',
          vi: 'Đây là lần đầu tiên chúng tôi đến Trùng Khánh.'
        }
      ]
    },
    {
      id: 'ep-ps-acuwdjollwm',
      youtubeId: 'acuWdJOLLwM',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Nói về tính cách - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Nói về tính cách',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 209,
      durationLabel: '3:29',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 12 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/acuWdJOLLwM.json',
      cuesCount: 12,
      cues: [
        {
          start: 20.64,
          end: 22.56,
          en: 'What is your personality like?',
          zh: '你的性格是什么样的呢？',
          pinyin: 'Nǐ de xìng gé shì shén me yàng de ne？',
          vi: 'Tính cách của bạn là như thế nào?'
        },
        {
          start: 24.86,
          end: 28.36,
          en: 'I think personality can be divided into two broad categories.',
          zh: '我认为性格可以分为两大类',
          pinyin: 'Wǒ rèn wéi xìng gé kě yǐ fēn wéi liǎng dà lèi',
          vi: 'Tôi nghĩ tính cách có thể chia thành hai loại lớn.'
        },
        {
          start: 30.66,
          end: 32.5,
          en: 'Extroverted and introverted.',
          zh: '外向和内向的',
          pinyin: 'Wài xiàng hé nèi xiàng de',
          vi: 'Hướng ngoại và hướng nội.'
        }
      ]
    },
    {
      id: 'ep-ps-blscmqzf81o',
      youtubeId: 'bLSCmqzF81o',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn nói về quả bơ bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Đoạn văn về quả bơ bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 229,
      durationLabel: '3:49',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 20 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/bLSCmqzF81o.json',
      cuesCount: 20,
      cues: [
        {
          start: 18.16,
          end: 21.66,
          en: 'Avocado is my favorite fruit.',
          zh: '牛油果是我最喜欢的水果。',
          pinyin: 'Niú yóu guǒ shì wǒ zuì xǐ huan de shuǐ guǒ。',
          vi: 'Bơ là loại trái cây tôi thích nhất.'
        },
        {
          start: 27.3,
          end: 29.84,
          en: 'Its outside is green.',
          zh: '它的外面是绿色的。',
          pinyin: 'Tā de wài miàn shì lǜ sè de。',
          vi: 'Bên ngoài của nó màu xanh lá.'
        },
        {
          start: 35.3,
          end: 38.14,
          en: 'Its inside is yellow.',
          zh: '它的里面是黄色的。',
          pinyin: 'Tā de lǐ miàn shì huáng sè de。',
          vi: 'Bên trong của nó màu vàng.'
        }
      ]
    },
    {
      id: 'ep-ps-bi5wu3dds-m',
      youtubeId: 'bi5wu3dds-M',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Yêu bản thân - LUYỆN ĐỌC TIẾNG TRUNG HSK 3',
      titleVi: 'Yêu bản thân',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 257,
      durationLabel: '4:17',
      topic: 'Luyện đọc HSK 3',
      note: 'Trọn bộ 21 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/bi5wu3dds-M.json',
      cuesCount: 21,
      cues: [
        {
          start: 13.82,
          end: 18.56,
          en: 'Loving yourself is very important.',
          zh: '爱自己，非常重要',
          pinyin: 'Ài zì jǐ， fēi cháng zhòng yào',
          vi: 'Yêu bản thân là điều rất quan trọng.'
        },
        {
          start: 20.84,
          end: 23.98,
          en: 'First, we must have a healthy body.',
          zh: '首先，我们要有健康的身体',
          pinyin: 'Shǒu xiān， wǒ men yào yǒu jiàn kāng de shēn tǐ',
          vi: 'Trước hết, chúng ta cần có một cơ thể khỏe mạnh.'
        },
        {
          start: 25.94,
          end: 28.82,
          en: 'Exercise every day and eat healthy food.',
          zh: '每天运动，吃健康的食物',
          pinyin: 'Měi tiān yùn dòng， chī jiàn kāng de shí wù',
          vi: 'Tập thể dục mỗi ngày, ăn thực phẩm lành mạnh.'
        }
      ]
    },
    {
      id: 'ep-ps-btafjtxdav8',
      youtubeId: 'btAFjTxDAv8',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '45 đoạn đàm thoại LUYỆN NGHE TIẾNG TRUNG',
      titleVi: '45 đoạn hội thoại luyện nghe tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 791,
      durationLabel: '13:11',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 153 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/btAFjTxDAv8.json',
      cuesCount: 153,
      cues: [
        {
          start: 30,
          end: 32.5,
          en: 'It doesn\'t matter.',
          zh: '没关系。',
          pinyin: 'Méi guān xì。',
          vi: 'Không sao.'
        },
        {
          start: 38.94,
          end: 39.44,
          en: 'Thank you.',
          zh: '谢谢。',
          pinyin: 'Xiè xiè。',
          vi: 'Cảm ơn.'
        },
        {
          start: 41.06,
          end: 41.44,
          en: 'Don\'t mention it.',
          zh: '不谢。',
          pinyin: 'Bú xiè。',
          vi: 'Không có gì.'
        }
      ]
    },
    {
      id: 'ep-ps-c60vqnvbxac',
      youtubeId: 'c60VQnVBXac',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Sủi cảo thật ngon || LUYỆN ĐỌC TIẾNG TRUNG - HSK 2',
      titleVi: 'Sủi cảo thật ngon',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 146,
      durationLabel: '2:26',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 16 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/c60VQnVBXac.json',
      cuesCount: 16,
      cues: [
        {
          start: 21.74,
          end: 24.5,
          en: 'Jiaozi is the most important food in China.',
          zh: '饺子是中国最重要的食物。',
          pinyin: 'Jiǎo zǐ shì zhōng guó zuì zhòng yào de shí wù。',
          vi: 'Sủi cảo là món ăn quan trọng nhất của Trung Quốc.'
        },
        {
          start: 27.26,
          end: 29.34,
          en: 'Chinese people often eat jiaozi.',
          zh: '中国人常常吃饺子。',
          pinyin: 'Zhōng guó rén cháng cháng chī jiǎo zǐ。',
          vi: 'Người Trung Quốc thường ăn sủi cảo.'
        },
        {
          start: 32.22,
          end: 34.78,
          en: 'breakfast, lunch, or dinner',
          zh: '早饭、午饭或者晚饭',
          pinyin: 'Zǎo fàn、 wǔ fàn huò zhě wǎn fàn',
          vi: 'bữa sáng, bữa trưa hoặc bữa tối'
        }
      ]
    },
    {
      id: 'ep-ps-cndhof-4j70',
      youtubeId: 'cNDhoF-4j70',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Giới thiệu về gia đình bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Giới thiệu về gia đình bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 227,
      durationLabel: '3:47',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 38 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/cNDhoF-4j70.json',
      cuesCount: 38,
      cues: [
        {
          start: 27,
          end: 28.54,
          en: 'There are five people in my family.',
          zh: '我家有五口人。',
          pinyin: 'Wǒ jiā yǒu wǔ kǒu rén。',
          vi: 'Gia đình tôi có năm người.'
        },
        {
          start: 30.24,
          end: 33.48,
          en: 'Dad, mom, husband, daughter and me.',
          zh: '爸爸、妈妈、老公、女儿和我。',
          pinyin: 'Bà ba、 mā ma、 lǎo gōng、 nǚ ér hé wǒ。',
          vi: 'Bố, mẹ, chồng, con gái và tôi.'
        },
        {
          start: 37.82,
          end: 40.06,
          en: 'My dad is sixty years old this year.',
          zh: '我爸爸今年六十岁了。',
          pinyin: 'Wǒ bà ba jīn nián liù shí suì le。',
          vi: 'Bố tôi năm nay sáu mươi tuổi rồi.'
        }
      ]
    },
    {
      id: 'ep-ps-cuvh6yixnq0',
      youtubeId: 'cuVH6yixNQ0',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Nói về người bạn thân bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Nói về người bạn thân bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 257,
      durationLabel: '4:17',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 25 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/cuVH6yixNQ0.json',
      cuesCount: 25,
      cues: [
        {
          start: 18.1,
          end: 21.4,
          en: 'I have a good friend; his name is Chen Meiyue.',
          zh: '我有一个好友，他叫陈美月。',
          pinyin: 'Wǒ yǒu yí gè hǎo yǒu， tā jiào chén měi yuè。',
          vi: 'Tôi có một người bạn thân, anh ấy tên là Trần Mỹ Nguyệt.'
        },
        {
          start: 27.62,
          end: 32.78,
          en: 'He is Vietnamese, 25 years old this year, and now lives in Beijing.',
          zh: '他是越南人，今年岁，现在住在北京。',
          pinyin: 'Tā shì yuè nán rén， jīn nián suì， xiàn zài zhù zài běi jīng。',
          vi: 'Anh ấy là người Việt Nam, năm nay 25 tuổi, hiện đang sống ở Bắc Kinh.'
        },
        {
          start: 39.04,
          end: 44.46,
          en: 'He came to China last month and works at a Chinese company.',
          zh: '他是上个月来中国的，在一家中国公司工作。',
          pinyin: 'Tā shì shàng gè yuè lái zhōng guó de， zài yì jiā zhōng guó gōng sī gōng zuò。',
          vi: 'Anh ấy đến Trung Quốc tháng trước và làm việc tại một công ty Trung Quốc.'
        }
      ]
    },
    {
      id: 'ep-ps-d4npk62wr0y',
      youtubeId: 'd4NpK62wr0Y',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Bạn nghĩ tôi béo không ?',
      titleVi: 'Bạn nghĩ tôi béo không?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 87,
      durationLabel: '1:27',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 18 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/d4NpK62wr0Y.json',
      cuesCount: 18,
      cues: [
        {
          start: 5.34,
          end: 9.4,
          en: 'Xiaowang, the skirt I bought last month doesn\'t fit me anymore.',
          zh: '小王，我上个月新买的裙子又穿不下去了。',
          pinyin: 'Xiǎo wáng， wǒ shàng gè yuè xīn mǎi de qún zǐ yòu chuān bú xià qù le。',
          vi: 'Tiểu Vương, cái váy tôi mua tháng trước lại mặc không vừa nữa rồi.'
        },
        {
          start: 10.82,
          end: 15.38,
          en: 'Really? Then you need to control your weight a bit.',
          zh: '是吗？那你可要稍微控制下体重了。',
          pinyin: 'Shì ma？ nà nǐ kě yào shāo wēi kòng zhì xià tǐ zhòng le。',
          vi: 'Vậy à? Vậy thì cậu phải kiểm soát cân nặng một chút rồi.'
        },
        {
          start: 20.3,
          end: 23.28,
          en: 'I think you\'re a bit fatter than before.',
          zh: '我觉得，你是比之前胖了一些。',
          pinyin: 'Wǒ jué de， nǐ shì bǐ zhī qián pàng le yì xiē。',
          vi: 'Mình thấy cậu béo hơn trước một chút đấy.'
        }
      ]
    },
    {
      id: 'ep-ps-djfjouqzqi4',
      youtubeId: 'dJFJoUqZqI4',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn con trai tôi bị ốm bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Đoạn văn: Con trai tôi bị ốm',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 286,
      durationLabel: '4:46',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 31 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/dJFJoUqZqI4.json',
      cuesCount: 31,
      cues: [
        {
          start: 34.4,
          end: 36.5,
          en: 'Xiaoming came home after school.',
          zh: '小明放学回到家',
          pinyin: 'Xiǎo míng fàng xué huí dào jiā',
          vi: 'Tiểu Minh tan học về đến nhà.'
        },
        {
          start: 37.2,
          end: 38.56,
          en: 'then turned on the air conditioner.',
          zh: '就打开了空调',
          pinyin: 'Jiù dǎ kāi le kōng tiáo',
          vi: 'liền bật điều hòa.'
        },
        {
          start: 44.44,
          end: 46.42,
          en: 'and drank a lot of ice water.',
          zh: '还喝了很多冰水',
          pinyin: 'Hái hē le hěn duō bīng shuǐ',
          vi: 'còn uống nhiều nước đá.'
        }
      ]
    },
    {
      id: 'ep-ps-edqaoah721u',
      youtubeId: 'eDQaOah721U',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Chỗ chú có bán rau không ?',
      titleVi: 'Chỗ chú có bán rau không?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 64,
      durationLabel: '1:04',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 13 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/eDQaOah721U.json',
      cuesCount: 13,
      cues: [
        {
          start: 0.66,
          end: 7.06,
          en: 'Do you have vegetables here?',
          zh: '你这里有蔬菜吗',
          pinyin: 'Nǐ zhè lǐ yǒu shū cài ma',
          vi: 'Ở đây có bán rau không?'
        },
        {
          start: 17.92,
          end: 18.66,
          en: 'tomato',
          zh: '番茄',
          pinyin: 'Fān qié',
          vi: 'cà chua'
        },
        {
          start: 19.26,
          end: 20.2,
          en: 'and onion',
          zh: '和洋葱',
          pinyin: 'Hé yáng cōng',
          vi: 'và hành tây'
        }
      ]
    },
    {
      id: 'ep-ps-eg5iud4smnq',
      youtubeId: 'eG5iUD4sMNQ',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Tôi đang bận xem trận đấu bóng',
      titleVi: 'Tôi đang bận xem trận đấu bóng',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 112,
      durationLabel: '1:52',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 21 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/eG5iUD4sMNQ.json',
      cuesCount: 21,
      cues: [
        {
          start: 0.88,
          end: 3.34,
          en: 'Conversation 1: I\'m busy watching the ball game.',
          zh: '会话一：我正在忙着看球赛。',
          pinyin: 'Huì huà yī： wǒ zhèng zài máng zhe kàn qiú sài。',
          vi: 'Hội thoại 1: Tôi đang bận xem trận đấu bóng.'
        },
        {
          start: 6.34,
          end: 9.86,
          en: 'Hi, haven\'t seen you for days. I thought you had disappeared!',
          zh: '嗨，几天没见你，还以为你消失了呢？',
          pinyin: 'Hēi， jǐ tiān méi jiàn nǐ， hái yǐ wéi nǐ xiāo shī le ne？',
          vi: 'Chào, mấy hôm không gặp cậu, tớ cứ tưởng cậu biến mất rồi!'
        },
        {
          start: 12.28,
          end: 14.98,
          en: 'How could that be? I\'m busy watching the game.',
          zh: '怎么会呢？我忙着看球赛呢。',
          pinyin: 'Zěn me huì ne？ wǒ máng zhe kàn qiú sài ne。',
          vi: 'Sao có thể chứ? Tớ đang bận xem trận đấu bóng mà.'
        }
      ]
    },
    {
      id: 'ep-ps-eh3vw4mnsxa',
      youtubeId: 'eH3VW4mnsxA',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe TIẾNG TRUNG thụ động【VIDEO #17】Đi vắng',
      titleVi: 'Đi vắng',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 221,
      durationLabel: '3:41',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 35 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/eH3VW4mnsxA.json',
      cuesCount: 35,
      cues: [
        {
          start: 30,
          end: 37.76,
          en: 'It\'s okay, come on in.',
          zh: '没关系，快进屋来吧。',
          pinyin: 'Méi guān xì， kuài jìn wū lái ba。',
          vi: 'Không sao, mau vào nhà đi.'
        },
        {
          start: 41.14,
          end: 42.24,
          en: 'Then sorry to bother you.',
          zh: '那打扰你了。',
          pinyin: 'Nà dǎ rǎo nǐ le。',
          vi: 'Vậy thì phiền bạn rồi.'
        },
        {
          start: 42.3,
          end: 48.56,
          en: 'go out',
          zh: '出',
          pinyin: 'Chū',
          vi: 'ra ngoài / đi ra'
        }
      ]
    },
    {
      id: 'ep-ps-eiv9sm0j_s8',
      youtubeId: 'eIv9Sm0J_s8',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn nói về quả chuối bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Đoạn văn nói về quả chuối bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 223,
      durationLabel: '3:43',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 34 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/eIv9Sm0J_s8.json',
      cuesCount: 34,
      cues: [
        {
          start: 0.4,
          end: 2.66,
          en: 'Practice reading Chinese, master HSK 1.',
          zh: '训练读中文，搞定。',
          pinyin: 'Xùn liàn dú zhōng wén， gǎo dìng。',
          vi: 'Luyện đọc tiếng Trung, chinh phục HSK 1.'
        },
        {
          start: 7.54,
          end: 9.1,
          en: 'Part 1: Listen and read each sentence.',
          zh: '第一部分，听和读每个句子。',
          pinyin: 'Dì yī bù fen， tīng hé dú měi gè jù zi。',
          vi: 'Phần một: nghe và đọc từng câu.'
        },
        {
          start: 10.6,
          end: 12.28,
          en: 'Part 2: Learn vocabulary and grammar structures.',
          zh: '第二部分，学习词汇和语法结构。',
          pinyin: 'Dì èr bù fen， xué xí cí huì hé yǔ fǎ jié gòu。',
          vi: 'Phần hai: học từ vựng và cấu trúc ngữ pháp.'
        }
      ]
    },
    {
      id: 'ep-ps-erm97tygx2c',
      youtubeId: 'eRM97tygx2c',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Giới thiệu về nơi sống bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Giới thiệu về nơi sống',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 214,
      durationLabel: '3:34',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 24 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/eRM97tygx2c.json',
      cuesCount: 24,
      cues: [
        {
          start: 19.4,
          end: 22.9,
          en: 'There is a park in front of my house.',
          zh: '我家的前边有一个公园',
          pinyin: 'Wǒ jiā de qián biān yǒu yí gè gōng yuán',
          vi: 'Trước nhà tôi có một công viên.'
        },
        {
          start: 29.2,
          end: 33.24,
          en: 'This park is very big and also very beautiful.',
          zh: '这个公园很大，也很漂亮。',
          pinyin: 'Zhè ge gōng yuán hěn dà， yě hěn piào liang。',
          vi: 'Công viên này rất rộng và cũng rất đẹp.'
        },
        {
          start: 39.62,
          end: 45.16,
          en: 'When the weather is nice, I like to take my dog there.',
          zh: '天气好的时候，我喜欢带我的狗去那里。',
          pinyin: 'Tiān qì hǎo de shí hòu， wǒ xǐ huan dài wǒ de gǒu qù nà lǐ。',
          vi: 'Khi thời tiết đẹp, tôi thích dẫn chú chó của tôi đến đó.'
        }
      ]
    },
    {
      id: 'ep-ps-fuino0hgzzg',
      youtubeId: 'fuIno0Hgzzg',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: '【HSK 1-3】我的家庭 - Gia đình của tôi | Chinese Podcast',
      titleVi: 'Gia đình của tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 398,
      durationLabel: '6:38',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 77 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/fuIno0Hgzzg.json',
      cuesCount: 77,
      cues: [
        {
          start: 4,
          end: 7.24,
          en: 'Today, I want to take everyone to learn about my family.',
          zh: '今天我想带大家一起了解一下我的家庭。',
          pinyin: 'Jīn tiān wǒ xiǎng dài dà jiā yì qǐ liǎo jiě yí xià wǒ de jiā tíng。',
          vi: 'Hôm nay tôi muốn mời mọi người cùng tìm hiểu về gia đình của tôi.'
        },
        {
          start: 8.3,
          end: 11.62,
          en: 'Let\'s see what life is like in an ordinary Chinese family.',
          zh: '看看一个普通中国家庭的生活是怎样的，',
          pinyin: 'Kàn kàn yí gè pǔ tōng zhōng guó jiā tíng de shēng huó shì zěn yàng de，',
          vi: 'Xem cuộc sống của một gia đình Trung Quốc bình thường là như thế nào.'
        },
        {
          start: 12.52,
          end: 16,
          en: 'And learn some interesting Chinese vocabulary along the way.',
          zh: '顺便一起学一些有趣的中文词汇。',
          pinyin: 'Shùn biàn yì qǐ xué yì xiē yǒu qù de zhōng wén cí huì。',
          vi: 'Tiện thể cùng học một số từ vựng tiếng Trung thú vị.'
        }
      ]
    },
    {
      id: 'ep-ps-glbap2tdtgq',
      youtubeId: 'gLBAP2TDtgQ',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Giúp tôi chỉnh sửa Powerpoint',
      titleVi: 'Giúp tôi chỉnh sửa PowerPoint',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 125,
      durationLabel: '2:05',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 21 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/gLBAP2TDtgQ.json',
      cuesCount: 21,
      cues: [
        {
          start: 0.76,
          end: 3.64,
          en: 'Can you help me check the PPT?',
          zh: '帮我检查行吗？',
          pinyin: 'Bāng wǒ jiǎn chá xíng ma？',
          vi: 'Giúp tôi kiểm tra PPT được không?'
        },
        {
          start: 5.58,
          end: 7.68,
          en: 'Xiao Wang, can you do me a favor?',
          zh: '小王，你能帮我个忙吗？',
          pinyin: 'Xiǎo wáng， nǐ néng bāng wǒ gè máng ma？',
          vi: 'Tiểu Vương, cậu có thể giúp tôi một việc được không?'
        },
        {
          start: 10.34,
          end: 14.14,
          en: 'What is it? Let me see if I can help you.',
          zh: '什么忙？我看看自己能不能帮到你。',
          pinyin: 'Shén me máng？ wǒ kàn kàn zì jǐ néng bu néng bāng dào nǐ。',
          vi: 'Việc gì? Để tôi xem mình có thể giúp được cậu không.'
        }
      ]
    },
    {
      id: 'ep-ps-gqh_fmo5g3s',
      youtubeId: 'gQH_fMo5g3s',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe TIẾNG TRUNG thụ động【VIDEO #12】Hỏi đường',
      titleVi: 'Hỏi đường',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 274,
      durationLabel: '4:34',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 37 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/gQH_fMo5g3s.json',
      cuesCount: 37,
      cues: [
        {
          start: 32.96,
          end: 33.9,
          en: 'straight ahead',
          zh: '一直',
          pinyin: 'Yì zhí',
          vi: 'thẳng'
        },
        {
          start: 34.06,
          end: 38.82,
          en: 'toward',
          zh: '往',
          pinyin: 'Wǎng',
          vi: 'về phía'
        },
        {
          start: 42.08,
          end: 42.72,
          en: 'to; arrive at',
          zh: '到',
          pinyin: 'Dào',
          vi: 'đến'
        }
      ]
    },
    {
      id: 'ep-ps-gx-ikyh7ts4',
      youtubeId: 'gx-IkYH7ts4',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Bạn cùng phòng của tôi - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Bạn cùng phòng của tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 216,
      durationLabel: '3:36',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 19 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/gx-IkYH7ts4.json',
      cuesCount: 19,
      cues: [
        {
          start: 21.3,
          end: 23.7,
          en: 'My dorm room is a double room.',
          zh: '我的宿舍是一个双人间。',
          pinyin: 'Wǒ de sù shè shì yí gè shuāng rén jiān。',
          vi: 'Phòng ký túc xá của tôi là phòng hai người.'
        },
        {
          start: 25.94,
          end: 28.46,
          en: 'I have a roommate named Meiyue.',
          zh: '我有一个舍友，叫美月。',
          pinyin: 'Wǒ yǒu yí gè shè yǒu， jiào měi yuè。',
          vi: 'Tôi có một bạn cùng phòng, tên là Mỹ Nguyệt.'
        },
        {
          start: 30.62,
          end: 33.66,
          en: 'She is nineteen this year and comes from Tokyo, Japan.',
          zh: '她今年十九岁，从日本东京来。',
          pinyin: 'Tā jīn nián shí jiǔ suì， cóng rì běn dōng jīng lái。',
          vi: 'Cô ấy năm nay 19 tuổi, đến từ Tokyo, Nhật Bản.'
        }
      ]
    },
    {
      id: 'ep-ps-h2kociai6f8',
      youtubeId: 'h2kOCIai6F8',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: '【HSK2】10 câu chuyện ngắn luyện nghe TIẾNG TRUNG (PHẦN 1)',
      titleVi: '10 câu chuyện ngắn luyện nghe tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 511,
      durationLabel: '8:31',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 77 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/h2kOCIai6F8.json',
      cuesCount: 77,
      cues: [
        {
          start: 4.32,
          end: 6.36,
          en: 'Xiaoyue is a Vietnamese girl.',
          zh: '小月是一个越南女孩。',
          pinyin: 'Xiǎo yuè shì yí gè yuè nán nǚ hái。',
          vi: 'Tiểu Nguyệt là một cô gái Việt Nam.'
        },
        {
          start: 9.38,
          end: 11.38,
          en: 'She studies Chinese in Vietnam.',
          zh: '她在越南学习中文。',
          pinyin: 'Tā zài yuè nán xué xí zhōng wén。',
          vi: 'Cô ấy học tiếng Trung ở Việt Nam.'
        },
        {
          start: 14.22,
          end: 17.12,
          en: 'She has a Chinese-language teacher from China.',
          zh: '她有一个来自中国的中文老师。',
          pinyin: 'Tā yǒu yí gè lái zì zhōng guó de zhōng wén lǎo shī。',
          vi: 'Cô ấy có một giáo viên tiếng Trung đến từ Trung Quốc.'
        }
      ]
    },
    {
      id: 'ep-ps-h9xuwlhhyeq',
      youtubeId: 'h9XUWLhhyeQ',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Số này đọc thế nào ?',
      titleVi: 'Số này đọc thế nào?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 115,
      durationLabel: '1:55',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 21 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/h9XUWLhhyeQ.json',
      cuesCount: 21,
      cues: [
        {
          start: 0.02,
          end: 8.16,
          en: 'Teacher, how do you read this number?',
          zh: '老师,这个数字怎么说?',
          pinyin: 'Lǎo shī, zhè ge shù zì zěn me shuō?',
          vi: 'Thưa thầy/cô, số này đọc thế nào ạ?'
        },
        {
          start: 8.88,
          end: 11.92,
          en: 'Let me see, wow, so many zeros!',
          zh: '我看看,哇,这么多零!',
          pinyin: 'Wǒ kàn kàn, wā, zhè me duō líng!',
          vi: 'Để tôi xem nào, ồ, nhiều số 0 thế!'
        },
        {
          start: 12.88,
          end: 15.92,
          en: 'I know: ten, hundred, thousand, ten-thousand.',
          zh: '我知道,十百千万。',
          pinyin: 'Wǒ zhī dào, shí bǎi qiān wàn。',
          vi: 'Tôi biết: mười, trăm, nghìn, mười nghìn.'
        }
      ]
    },
    {
      id: 'ep-ps-hixerdipndo',
      youtubeId: 'hIxerDIPNdo',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Công việc mới - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Công việc mới',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 276,
      durationLabel: '4:36',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 19 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/hIxerDIPNdo.json',
      cuesCount: 19,
      cues: [
        {
          start: 21.82,
          end: 23.88,
          en: 'I just found a new job.',
          zh: '我刚找到一份新工作',
          pinyin: 'Wǒ gāng zhǎo dào yí fèn xīn gōng zuò',
          vi: 'Tôi vừa tìm được một công việc mới.'
        },
        {
          start: 26.32,
          end: 27.76,
          en: 'I am very satisfied.',
          zh: '我非常满意',
          pinyin: 'Wǒ fēi cháng mǎn yì',
          vi: 'Tôi rất hài lòng.'
        },
        {
          start: 30.14,
          end: 32.88,
          en: 'Because the boss and my colleagues treat me very well.',
          zh: '因为老板和同事们对我很好。',
          pinyin: 'Yīn wèi lǎo bǎn hé tóng shì men duì wǒ hěn hǎo。',
          vi: 'Vì sếp và các đồng nghiệp đối xử với tôi rất tốt.'
        }
      ]
    },
    {
      id: 'ep-ps-hjfkedzcne0',
      youtubeId: 'hJfKEDZCne0',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Chú chó nhà cậu thật dễ thương',
      titleVi: 'Chú chó nhà cậu thật dễ thương',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 91,
      durationLabel: '1:31',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 19 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/hJfKEDZCne0.json',
      cuesCount: 19,
      cues: [
        {
          start: 7.16,
          end: 8.64,
          en: 'Your dog is really cute.',
          zh: '你家狗狗真可爱',
          pinyin: 'Nǐ jiā gǒu gǒu zhēn kě ài',
          vi: 'Cún nhà cậu thật dễ thương.'
        },
        {
          start: 9.2,
          end: 10.26,
          en: 'What\'s its name?',
          zh: '它叫什么名字啊？',
          pinyin: 'Tā jiào shén me míng zì a？',
          vi: 'Nó tên là gì vậy?'
        },
        {
          start: 12.18,
          end: 14.24,
          en: 'Thanks for the compliment. His name is Henry.',
          zh: '谢谢夸奖，它叫亨利。',
          pinyin: 'Xiè xiè kuā jiǎng， tā jiào hēng lì。',
          vi: 'Cảm ơn cậu đã khen. Nó tên là Henry.'
        }
      ]
    },
    {
      id: 'ep-ps-hsv_gffk7yi',
      youtubeId: 'hSv_gfFk7YI',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG : Mua quần áo | 买衣服',
      titleVi: 'Hội thoại mua quần áo',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 399,
      durationLabel: '6:39',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 110 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/hSv_gfFk7YI.json',
      cuesCount: 110,
      cues: [
        {
          start: 30,
          end: 33.74,
          en: 'My friend said there\'s a great little clothing store nearby.',
          zh: '我朋友说附近有一家很好的小服饰店',
          pinyin: 'Wǒ péng yǒu shuō fù jìn yǒu yì jiā hěn hǎo de xiǎo fú shì diàn',
          vi: 'Bạn mình nói gần đây có một cửa hàng quần áo nhỏ rất tốt.'
        },
        {
          start: 34.84,
          end: 36.8,
          en: 'The stuff there is both stylish and cheap.',
          zh: '东西又流行又便宜',
          pinyin: 'Dōng xī yòu liú xíng yòu pián yi',
          vi: 'Đồ ở đó vừa thời trang vừa rẻ.'
        },
        {
          start: 38.16,
          end: 40,
          en: 'Let\'s go find it, okay?',
          zh: '我们去找一下好不好',
          pinyin: 'Wǒ men qù zhǎo yí xià hǎo bu hǎo',
          vi: 'Chúng mình đi tìm thử được không?'
        }
      ]
    },
    {
      id: 'ep-ps-hmz2tuymbza',
      youtubeId: 'hmZ2TuYmBzA',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe TIẾNG TRUNG thụ động【VIDEO #18】Mời đi chơi',
      titleVi: 'Mời đi chơi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 243,
      durationLabel: '4:03',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 40 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/hmZ2TuYmBzA.json',
      cuesCount: 40,
      cues: [
        {
          start: 30,
          end: 30.84,
          en: 'Surely you can understand.',
          zh: '肯定看得懂',
          pinyin: 'Kěn dìng kàn dé dǒng',
          vi: 'Chắc chắn xem hiểu.'
        },
        {
          start: 32.06,
          end: 33.58,
          en: 'Can Paul go or not?',
          zh: '保罗去得了去不了？',
          pinyin: 'Bǎo luó qù dé le qù bù liǎo？',
          vi: 'Paul có đi được không?'
        },
        {
          start: 36.28,
          end: 37.64,
          en: 'He probably can\'t go.',
          zh: '他恐怕去不了。',
          pinyin: 'Tā kǒng pà qù bù liǎo。',
          vi: 'Anh ấy có lẽ không đi được.'
        }
      ]
    },
    {
      id: 'ep-ps-ieeioflcjti',
      youtubeId: 'ieEIoFLcJtI',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG : Đi nhà hàng | 去餐厅',
      titleVi: 'Đi nhà hàng',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 236,
      durationLabel: '3:56',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 69 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/ieEIoFLcJtI.json',
      cuesCount: 69,
      cues: [
        {
          start: 18.44,
          end: 18.79,
          en: 'How many people?',
          zh: '几位',
          pinyin: 'Jǐ wèi',
          vi: 'Mấy người ạ?'
        },
        {
          start: 21.78,
          end: 22.13,
          en: 'Two.',
          zh: '两位',
          pinyin: 'Liǎng wèi',
          vi: 'Hai người.'
        },
        {
          start: 23.68,
          end: 24.58,
          en: 'Okay, this way, please.',
          zh: '好，这边请',
          pinyin: 'Hǎo， zhè biān qǐng',
          vi: 'Vâng, mời đi lối này.'
        }
      ]
    },
    {
      id: 'ep-ps-jdsuiag0ssw',
      youtubeId: 'jDsUIag0sSw',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: '【HSK1】10 câu chuyện ngắn luyện nghe TIẾNG TRUNG (PHẦN 4)',
      titleVi: '10 câu chuyện ngắn luyện nghe tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 421,
      durationLabel: '7:01',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 69 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/jDsUIag0sSw.json',
      cuesCount: 69,
      cues: [
        {
          start: 4.2,
          end: 8.52,
          en: 'At seven in the morning, Xiaoming was still dreaming when the alarm clock rang.',
          zh: '早上七点，小明还在梦中，闹钟响了',
          pinyin: 'Zǎo shàng qī diǎn， xiǎo míng hái zài mèng zhōng， nào zhōng xiǎng le',
          vi: 'Lúc bảy giờ sáng, Tiểu Minh vẫn còn đang mơ, đồng hồ báo thức reo.'
        },
        {
          start: 10.28,
          end: 13.3,
          en: 'Xiaoming got up and stretched.',
          zh: '小明起床了，他伸了一个懒腰',
          pinyin: 'Xiǎo míng qǐ chuáng le， tā shēn le yí gè lǎn yāo',
          vi: 'Tiểu Minh dậy, cậu ấy duỗi người một cái.'
        },
        {
          start: 15.06,
          end: 18.08,
          en: 'The weather is very good today; it\'s a sunny day.',
          zh: '今天天气很好，是个晴天',
          pinyin: 'Jīn tiān tiān qì hěn hǎo， shì gè qíng tiān',
          vi: 'Hôm nay thời tiết rất đẹp, là một ngày nắng.'
        }
      ]
    },
    {
      id: 'ep-ps-jtioioqgvug',
      youtubeId: 'jtioioqgvug',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG #4 : Đặt phòng và nhận phòng khách sạn',
      titleVi: 'Luyện nghe hội thoại tiếng Trung: Đặt và nhận phòng khách sạn',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 176,
      durationLabel: '2:56',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 47 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/jtioioqgvug.json',
      cuesCount: 47,
      cues: [
        {
          start: 0.42,
          end: 2.54,
          en: 'Excuse me, I\'d like to find a hotel.',
          zh: '麻烦你，我想找一家酒店。',
          pinyin: 'Má fán nǐ， wǒ xiǎng zhǎo yì jiā jiǔ diàn。',
          vi: 'Làm phiền bạn, tôi muốn tìm một khách sạn.'
        },
        {
          start: 7.2,
          end: 10.24,
          en: 'Here is a map of budget hotels. Take a look.',
          zh: '这里有一张经济型酒店位置图，你看看。',
          pinyin: 'Zhè lǐ yǒu yì zhāng jīng jì xíng jiǔ diàn wèi zhì tú， nǐ kàn kàn。',
          vi: 'Đây là bản đồ vị trí các khách sạn bình dân, bạn xem nhé.'
        },
        {
          start: 11.26,
          end: 15.74,
          en: 'I\'d like to book a hotel in this area.',
          zh: '我想在这一带订一家酒店。',
          pinyin: 'Wǒ xiǎng zài zhè yí dài dìng yì jiā jiǔ diàn。',
          vi: 'Tôi muốn đặt một khách sạn ở khu vực này.'
        }
      ]
    },
    {
      id: 'ep-ps-kl5hl2p8u0k',
      youtubeId: 'kL5hL2P8U0k',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG : Làm quen bạn mới | 新朋友',
      titleVi: 'Luyện nghe hội thoại tiếng Trung: Làm quen bạn mới',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 308,
      durationLabel: '5:08',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 64 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/kL5hL2P8U0k.json',
      cuesCount: 64,
      cues: [
        {
          start: 46.8,
          end: 47.26,
          en: 'Hello.',
          zh: '你好',
          pinyin: 'Nǐ hǎo',
          vi: 'Xin chào.'
        },
        {
          start: 49.36,
          end: 50.28,
          en: 'Is it yours?',
          zh: '是你的吗？',
          pinyin: 'Shì nǐ de ma？',
          vi: 'Của bạn à?'
        },
        {
          start: 50.58,
          end: 52.92,
          en: 'No, it isn\'t.',
          zh: '不是。',
          pinyin: 'Bú shì。',
          vi: 'Không phải.'
        }
      ]
    },
    {
      id: 'ep-ps-kij8gizdetm',
      youtubeId: 'kij8GizDeTM',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Để tôi trả tiền',
      titleVi: 'Hội thoại ngắn: Để tôi trả tiền',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 56,
      durationLabel: '0:56',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 10 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/kij8GizDeTM.json',
      cuesCount: 10,
      cues: [
        {
          start: 17.9,
          end: 19.04,
          en: 'You pay next time.',
          zh: '下次你付',
          pinyin: 'Xià cì nǐ fù',
          vi: 'Lần sau bạn trả nhé'
        },
        {
          start: 19.78,
          end: 20.42,
          en: 'Ouch!',
          zh: '哎呦',
          pinyin: 'Āi yōu',
          vi: 'Ối'
        },
        {
          start: 22.12,
          end: 25.36,
          en: 'Waiter/Waitress',
          zh: '服务员',
          pinyin: 'Fú wù yuán',
          vi: 'Người phục vụ'
        }
      ]
    },
    {
      id: 'ep-ps-koih4dpkq9e',
      youtubeId: 'koIh4DpkQ9E',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Tôi thích đọc sách - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Tôi thích đọc sách',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 241,
      durationLabel: '4:01',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 18 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/koIh4DpkQ9E.json',
      cuesCount: 18,
      cues: [
        {
          start: 0.78,
          end: 29.36,
          en: 'I love reading novels and comic books the most.',
          zh: '我最爱看小说和漫画书。',
          pinyin: 'Wǒ zuì ài kàn xiǎo shuō hé màn huà shū。',
          vi: 'Tôi thích đọc tiểu thuyết và truyện tranh nhất.'
        },
        {
          start: 32.4,
          end: 34.5,
          en: 'Before, I used to read quite a lot of books.',
          zh: '以前我看的书比较多。',
          pinyin: 'Yǐ qián wǒ kàn de shū bǐ jiào duō。',
          vi: 'Trước đây tôi đọc sách khá nhiều.'
        },
        {
          start: 37.44,
          end: 39.9,
          en: 'After I started working, I rarely read anymore.',
          zh: '工作之后我就很少看了。',
          pinyin: 'Gōng zuò zhī hòu wǒ jiù hěn shǎo kàn le。',
          vi: 'Sau khi đi làm, tôi hiếm khi đọc sách nữa.'
        }
      ]
    },
    {
      id: 'ep-ps-lexx84pvtuu',
      youtubeId: 'lEXX84PVtUU',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn nói về làm việc nhà bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Đoạn văn tiếng Trung về việc nhà',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 265,
      durationLabel: '4:25',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 23 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/lEXX84PVtUU.json',
      cuesCount: 23,
      cues: [
        {
          start: 18.18,
          end: 21.88,
          en: 'Sunday is the day we do housework.',
          zh: '星期天是我们做家务的日子',
          pinyin: 'Xīng qī tiān shì wǒ men zuò jiā wù de rì zi',
          vi: 'Chủ nhật là ngày chúng tôi làm việc nhà.'
        },
        {
          start: 28.52,
          end: 33.28,
          en: 'In the morning, my mom and younger sister are in charge of doing the laundry.',
          zh: '早上我妈妈和妹妹负责洗衣服',
          pinyin: 'Zǎo shàng wǒ mā ma hé mèi mei fù zé xǐ yī fu',
          vi: 'Buổi sáng, mẹ và em gái tôi phụ trách giặt quần áo.'
        },
        {
          start: 39.44,
          end: 41.46,
          en: 'I am in charge of mopping the floor.',
          zh: '我负责拖地',
          pinyin: 'Wǒ fù zé tuō dì',
          vi: 'Tôi phụ trách lau sàn nhà.'
        }
      ]
    },
    {
      id: 'ep-ps-lipbqs2nlrs',
      youtubeId: 'lIpbqs2nlRs',
      level: 'HSK 4+',
      levelGroup: 'hsk4',
      title: '【HSK 4-6】8 thói quen nhỏ vô cùng giá trị - 八个非常有价值的小习惯 | Chinese Podcast',
      titleVi: '8 thói quen nhỏ vô cùng giá trị',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 313,
      durationLabel: '5:13',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 74 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/lIpbqs2nlRs.json',
      cuesCount: 74,
      cues: [
        {
          start: 30,
          end: 36.58,
          en: 'Even just reducing one unnecessary step and eliminating one useless action is a kind of progress.',
          zh: '哪怕只是减少一个多余的步骤，删除一个无用的动作，都是一种进步。',
          pinyin: 'Nǎ pà zhǐ shì jiǎn shǎo yí gè duō yú de bù zhòu， shān chú yí gè wú yòng de dòng zuò， dōu shì yì zhǒng jìn bù。',
          vi: 'Ngay cả khi chỉ bớt đi một bước thừa, loại bỏ một hành động vô ích, cũng là một sự tiến bộ.'
        },
        {
          start: 38.04,
          end: 48.34,
          en: 'Optimize your workflow, mark priorities, and allocate the day\'s time quota with a clear purpose, so you can free up mental space to handle what truly matters.',
          zh: '把事情流程优化，标出主次，将一天的时间额度有的放矢地分配，才能腾出心思处理好真正重要的事情。',
          pinyin: 'Bǎ shì qíng liú chéng yōu huà， biāo chū zhǔ cì， jiāng yì tiān de shí jiān é dù yǒu dì fàng shǐ dì fēn pèi， cái néng téng chū xīn sī chǔ lǐ hǎo zhēn zhèng zhòng yào de shì qíng。',
          vi: 'Tối ưu hóa quy trình, phân rõ thứ tự chính phụ, phân bổ quỹ thời gian trong ngày một cách có mục tiêu, mới có thể dành tâm trí để xử lý tốt những việc thực sự quan trọng.'
        },
        {
          start: 51.54,
          end: 53.76,
          en: 'Think more about what it means to me.',
          zh: '多思考它对我意味着什么。',
          pinyin: 'Duō sī kǎo tā duì wǒ yì wèi zhe shén me。',
          vi: 'Hãy suy nghĩ nhiều hơn về việc nó có ý nghĩa gì với mình.'
        }
      ]
    },
    {
      id: 'ep-ps-lfh0uf-wzmy',
      youtubeId: 'lfH0Uf-wzMY',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn nói về món sủi cảo bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Đoạn văn về món sủi cảo',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 207,
      durationLabel: '3:27',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 21 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/lfH0Uf-wzMY.json',
      cuesCount: 21,
      cues: [
        {
          start: 13.72,
          end: 21.34,
          en: 'Dumplings are a traditional food of Chinese people.',
          zh: '饺子是中国人的传统美食。',
          pinyin: 'Jiǎo zǐ shì zhōng guó rén de chuán tǒng měi shí。',
          vi: 'Sủi cảo là món ăn truyền thống của người Trung Quốc.'
        },
        {
          start: 27.46,
          end: 29.8,
          en: 'There are meat-filled ones and vegetable-filled ones.',
          zh: '有肉馅的和菜馅的。',
          pinyin: 'Yǒu ròu xiàn de hé cài xiàn de。',
          vi: 'Có loại nhân thịt và loại nhân rau.'
        },
        {
          start: 36.28,
          end: 38.52,
          en: 'There are different ways to make dumplings.',
          zh: '饺子有不同的做法。',
          pinyin: 'Jiǎo zǐ yǒu bù tóng de zuò fǎ。',
          vi: 'Sủi cảo có nhiều cách làm khác nhau.'
        }
      ]
    },
    {
      id: 'ep-ps-lffzmkvm6ge',
      youtubeId: 'lffZmKvM6gE',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Giới thiệu về món ăn Trung Quốc bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Giới thiệu món ăn Trung Quốc',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 191,
      durationLabel: '3:11',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 19 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/lffZmKvM6gE.json',
      cuesCount: 19,
      cues: [
        {
          start: 7.5,
          end: 20.88,
          en: 'My whole family likes Chinese food.',
          zh: '我们全家人都喜欢吃中餐。',
          pinyin: 'Wǒ men quán jiā rén dōu xǐ huan chī zhōng cān。',
          vi: 'Cả nhà tôi đều thích ăn món Trung Quốc.'
        },
        {
          start: 26.32,
          end: 29.62,
          en: 'For breakfast we usually eat rice porridge or noodles.',
          zh: '早餐我们一般吃白粥或者面条。',
          pinyin: 'Zǎo cān wǒ men yì bān chī bái zhōu huò zhě miàn tiáo。',
          vi: 'Bữa sáng chúng tôi thường ăn cháo trắng hoặc mì.'
        },
        {
          start: 35.04,
          end: 38.28,
          en: 'For lunch we usually eat fried noodles or steamed buns.',
          zh: '午餐我们一般吃炒面或者包子。',
          pinyin: 'Wǔ cān wǒ men yì bān chī chǎo miàn huò zhě bāo zǐ。',
          vi: 'Bữa trưa chúng tôi thường ăn mì xào hoặc bánh bao.'
        }
      ]
    },
    {
      id: 'ep-ps-lhqehin3ipo',
      youtubeId: 'lhqEhin3iPo',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG : Sinh viên đại học | 大学生',
      titleVi: 'Sinh viên đại học',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 303,
      durationLabel: '5:03',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 102 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/lhqEhin3iPo.json',
      cuesCount: 102,
      cues: [
        {
          start: 18,
          end: 19.3,
          en: 'Hey, excuse me.',
          zh: '嘿 不好意思',
          pinyin: 'Hēi bù hǎo yì si',
          vi: 'Này, xin lỗi.'
        },
        {
          start: 20.34,
          end: 20.74,
          en: 'Do you have a pen?',
          zh: '你有笔吗',
          pinyin: 'Nǐ yǒu bǐ ma',
          vi: 'Bạn có bút không?'
        },
        {
          start: 21.6,
          end: 22.82,
          en: 'Wait a moment, let me check.',
          zh: '等一下 我看看',
          pinyin: 'Děng yí xià wǒ kàn kàn',
          vi: 'Chờ chút, để tôi xem.'
        }
      ]
    },
    {
      id: 'ep-ps-lxgvbehiuge',
      youtubeId: 'lxGVbEhiUgE',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Giới thiệu về bạn cùng phòng bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Giới thiệu về bạn cùng phòng bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 209,
      durationLabel: '3:29',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 33 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/lxGVbEhiUgE.json',
      cuesCount: 33,
      cues: [
        {
          start: 17.86,
          end: 20.32,
          en: 'My roommate is an American.',
          zh: '我的室友是一个美国人',
          pinyin: 'Wǒ de shì yǒu shì yí gè měi guó rén',
          vi: 'Bạn cùng phòng của tôi là người Mỹ.'
        },
        {
          start: 21.32,
          end: 23.24,
          en: 'He is 25 years old this year.',
          zh: '他今年岁',
          pinyin: 'Tā jīn nián suì',
          vi: 'Anh ấy năm nay 25 tuổi.'
        },
        {
          start: 28.5,
          end: 31.12,
          en: 'His birthday is August 15th.',
          zh: '他的生日是月号',
          pinyin: 'Tā de shēng rì shì yuè hào',
          vi: 'Sinh nhật của anh ấy là ngày 15 tháng 8.'
        }
      ]
    },
    {
      id: 'ep-ps-m0jdhlcpp54',
      youtubeId: 'm0JDHlcpP54',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Sinh viên đại học giới thiệu bản thân bằng TIẾNG TRUNG',
      titleVi: 'Sinh viên đại học giới thiệu bản thân bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 211,
      durationLabel: '3:31',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 35 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/m0JDHlcpP54.json',
      cuesCount: 35,
      cues: [
        {
          start: 30,
          end: 36.12,
          en: 'I\'m Vietnamese, I come from Lang Son.',
          zh: '我是越南人，我来自谅山。',
          pinyin: 'Wǒ shì yuè nán rén， wǒ lái zì liàng shān。',
          vi: 'Tôi là người Việt Nam, tôi đến từ Lạng Sơn.'
        },
        {
          start: 37.56,
          end: 44.14,
          en: 'There are four people in my family: dad, mom, younger brother, and me.',
          zh: '我家有四口人：爸爸、妈妈、弟弟和我。',
          pinyin: 'Wǒ jiā yǒu sì kǒu rén： bà ba、 mā ma、 dì di hé wǒ。',
          vi: 'Nhà tôi có bốn người: bố, mẹ, em trai và tôi.'
        },
        {
          start: 45.64,
          end: 50.9,
          en: 'My father is a worker, and his job is very hard.',
          zh: '我爸爸是一个工人，他的工作非常辛苦。',
          pinyin: 'Wǒ bà ba shì yí gè gōng rén， tā de gōng zuò fēi cháng xīn kǔ。',
          vi: 'Bố tôi là công nhân, công việc của ông ấy rất vất vả.'
        }
      ]
    },
    {
      id: 'ep-ps-mbsyocuipzq',
      youtubeId: 'mBsYoCuIpZQ',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG : Tham quan trường đại học | 参观大学',
      titleVi: 'Tham quan trường đại học',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 380,
      durationLabel: '6:20',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 84 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/mBsYoCuIpZQ.json',
      cuesCount: 84,
      cues: [
        {
          start: 12.04,
          end: 15.86,
          en: 'I\'m Nini, currently a senior at Chinese Culture University',
          zh: '我是妮妮，目前是文化大学的大四生',
          pinyin: 'Wǒ shì nī nī， mù qián shì wén huà dà xué de dà sì shēng',
          vi: 'Tôi là Nini, hiện đang là sinh viên năm cuối trường Đại học Văn Hóa'
        },
        {
          start: 16,
          end: 20.64,
          en: 'Right now I\'m standing on Huagang Road in Shilin District, Taipei',
          zh: '那我现在是站在台北市的士林区华冈路',
          pinyin: 'Nà wǒ xiàn zài shì zhàn zài tái běi shì dī shì lín qū huá gāng lù',
          vi: 'Hiện tôi đang đứng trên đường Hoa Cương, quận Sĩ Lâm, Đài Bắc'
        },
        {
          start: 21.12,
          end: 24.82,
          en: 'Today let\'s go take a look at my university',
          zh: '那我们今天去看一下我的大学喔',
          pinyin: 'Nà wǒ men jīn tiān qù kàn yí xià wǒ de dà xué wō',
          vi: 'Hôm nay chúng ta hãy đi xem trường đại học của tôi nhé'
        }
      ]
    },
    {
      id: 'ep-ps-nyxcgpnetcc',
      youtubeId: 'nYxcGPNETCc',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG : Phỏng vấn xin việc | 工作面试',
      titleVi: 'Phỏng vấn xin việc',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 439,
      durationLabel: '7:19',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 140 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/nYxcGPNETCc.json',
      cuesCount: 140,
      cues: [
        {
          start: 31.6,
          end: 32.36,
          en: 'Please have a seat for a moment.',
          zh: '请稍坐一下',
          pinyin: 'Qǐng shāo zuò yí xià',
          vi: 'Mời bạn ngồi một lát.'
        },
        {
          start: 41.6,
          end: 42.4,
          en: 'Have a cup of tea first.',
          zh: '先喝一杯茶',
          pinyin: 'Xiān hē yì bēi chá',
          vi: 'Uống một tách trà trước nhé.'
        },
        {
          start: 42.44,
          end: 43.2,
          en: 'Thank you.',
          zh: '谢谢',
          pinyin: 'Xiè xiè',
          vi: 'Cảm ơn.'
        }
      ]
    },
    {
      id: 'ep-ps-noxvp4dg1d8',
      youtubeId: 'noxVp4dG1d8',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '10 hội thoại đời sống làm quen kết bạn LUYỆN NGHE TIẾNG TRUNG THỤ ĐỘNG',
      titleVi: '10 hội thoại đời sống: làm quen kết bạn',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 318,
      durationLabel: '5:18',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 85 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/noxVp4dG1d8.json',
      cuesCount: 85,
      cues: [
        {
          start: 20.04,
          end: 21.76,
          en: 'What\'s your name?',
          zh: '你叫什么名字？',
          pinyin: 'Nǐ jiào shén me míng zì？',
          vi: 'Bạn tên là gì?'
        },
        {
          start: 22.76,
          end: 25.4,
          en: 'My name is Li Hao. What about you?',
          zh: '我叫李好，你叫什么？',
          pinyin: 'Wǒ jiào lǐ hǎo， nǐ jiào shén me？',
          vi: 'Tôi tên là Lý Hảo, còn bạn tên gì?'
        },
        {
          start: 27.36,
          end: 28.4,
          en: 'My name is Wang Ming.',
          zh: '我叫王明。',
          pinyin: 'Wǒ jiào wáng míng。',
          vi: 'Tôi tên là Vương Minh.'
        }
      ]
    },
    {
      id: 'ep-ps-o6ilprwo6w0',
      youtubeId: 'o6ilprwO6w0',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: '【HSK 1-3】我的新年计划 - Kế hoạch năm mới của tôi | Chinese Podcast',
      titleVi: 'Kế hoạch năm mới của tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 425,
      durationLabel: '7:05',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 119 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/o6ilprwO6w0.json',
      cuesCount: 119,
      cues: [
        {
          start: 3.46,
          end: 6.68,
          en: 'Today is the first week of 2026.',
          zh: '今天是年的第一个星期',
          pinyin: 'Jīn tiān shì nián de dì yī gè xīng qī',
          vi: 'Hôm nay là tuần đầu tiên của năm 2026.'
        },
        {
          start: 6.76,
          end: 8.82,
          en: 'Is everyone doing well?',
          zh: '大家都过得好吗?',
          pinyin: 'Dà jiā dōu guò dé hǎo ma?',
          vi: 'Mọi người đều ổn chứ?'
        },
        {
          start: 10.04,
          end: 12.72,
          en: 'I am now sitting in my apartment in Shanghai.',
          zh: '我现在正坐在上海的公寓里',
          pinyin: 'Wǒ xiàn zài zhèng zuò zài shàng hǎi de gōng yù lǐ',
          vi: 'Tôi đang ngồi trong căn hộ của mình ở Thượng Hải.'
        }
      ]
    },
    {
      id: 'ep-ps-o6v02qrfg7c',
      youtubeId: 'o6v02QrfG7c',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG : Chơi bóng rổ | 打篮球',
      titleVi: 'Chơi bóng rổ',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 378,
      durationLabel: '6:18',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 117 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/o6v02QrfG7c.json',
      cuesCount: 117,
      cues: [
        {
          start: 17,
          end: 19,
          en: 'Do you want to go sing?',
          zh: '唱歌要不要',
          pinyin: 'Chàng gē yào bu yào',
          vi: 'Đi hát không?'
        },
        {
          start: 19.3,
          end: 19.65,
          en: 'Sing?',
          zh: '唱歌',
          pinyin: 'Chàng gē',
          vi: 'Hát à?'
        },
        {
          start: 21.48,
          end: 21.83,
          en: 'It\'s just the two of us.',
          zh: '就我们两个',
          pinyin: 'Jiù wǒ men liǎng gè',
          vi: 'Chỉ có hai đứa mình thôi.'
        }
      ]
    },
    {
      id: 'ep-ps-oggdnulrym4',
      youtubeId: 'oGGDnULryM4',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn nói về quả xoài bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Đoạn văn về quả xoài',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 207,
      durationLabel: '3:27',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 20 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/oGGDnULryM4.json',
      cuesCount: 20,
      cues: [
        {
          start: 26.62,
          end: 30.32,
          en: 'Mangoes are yellow, orange, or green.',
          zh: '芒果是黄色、橙色或绿色的',
          pinyin: 'Máng guǒ shì huáng sè、 chéng sè huò lǜ sè de',
          vi: 'Quả xoài có màu vàng, cam hoặc xanh.'
        },
        {
          start: 36.24,
          end: 38.54,
          en: 'Mangoes are sweet and juicy.',
          zh: '芒果又甜又多汁',
          pinyin: 'Máng guǒ yòu tián yòu duō zhī',
          vi: 'Quả xoài vừa ngọt vừa mọng nước.'
        },
        {
          start: 44.3,
          end: 47.4,
          en: 'People can use mangoes to make ice cream.',
          zh: '人们可以用芒果制作冰淇淋',
          pinyin: 'Rén men kě yǐ yòng máng guǒ zhì zuò bīng qí lín',
          vi: 'Người ta có thể dùng xoài để làm kem.'
        }
      ]
    },
    {
      id: 'ep-ps-onlpbrowrxg',
      youtubeId: 'oNLPbROwrxg',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe TIẾNG TRUNG thụ động【VIDEO #14】Về nước',
      titleVi: 'Về nước',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 193,
      durationLabel: '3:13',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 33 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/oNLPbROwrxg.json',
      cuesCount: 33,
      cues: [
        {
          start: 30,
          end: 34.22,
          en: 'From Beijing to Paris,',
          zh: '从北京到巴黎，',
          pinyin: 'Cóng běi jīng dào bā lí，',
          vi: 'Từ Bắc Kinh đến Paris,'
        },
        {
          start: 35.72,
          end: 37.72,
          en: 'How long is the flight?',
          zh: '得坐多长时间的飞机？',
          pinyin: 'Dé zuò duō cháng shí jiān de fēi jī？',
          vi: 'Phải ngồi máy bay bao lâu?'
        },
        {
          start: 40.54,
          end: 41.56,
          en: 'It\'s not too long,',
          zh: '时间不太长，',
          pinyin: 'Shí jiān bú tài cháng，',
          vi: 'Thời gian không lâu lắm,'
        }
      ]
    },
    {
      id: 'ep-ps-pfoe13yaxey',
      youtubeId: 'pFoE13yaXeY',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Ở đây bán sim điện thoại không ?',
      titleVi: 'Ở đây bán sim điện thoại không?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 64,
      durationLabel: '1:04',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 17 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/pFoE13yaXeY.json',
      cuesCount: 17,
      cues: [
        {
          start: 0.44,
          end: 6.76,
          en: 'Do you sell SIM cards here?',
          zh: '这里有手机卡卖吗？',
          pinyin: 'Zhè lǐ yǒu shǒu jī kǎ mài ma？',
          vi: 'Ở đây có bán sim điện thoại không?'
        },
        {
          start: 8.18,
          end: 10.98,
          en: 'Do you want China Mobile or China Unicom?',
          zh: '你要移动的还是联通的？',
          pinyin: 'Nǐ yào yí dòng de hái shì lián tōng de？',
          vi: 'Bạn muốn mạng China Mobile hay China Unicom?'
        },
        {
          start: 20.3,
          end: 21.42,
          en: 'Can I choose a number?',
          zh: '可以选号码吗？',
          pinyin: 'Kě yǐ xuǎn hào mǎ ma？',
          vi: 'Có thể chọn số không?'
        }
      ]
    },
    {
      id: 'ep-ps-phk3fnkfcds',
      youtubeId: 'phK3FNkFCDs',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Mô tả đồ vật trên bàn bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Mô tả đồ vật trên bàn bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 199,
      durationLabel: '3:19',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 21 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/phK3FNkFCDs.json',
      cuesCount: 21,
      cues: [
        {
          start: 10.4,
          end: 20.56,
          en: 'My desk is blue.',
          zh: '我的桌子是蓝色的',
          pinyin: 'Wǒ de zhuō zi shì lán sè de',
          vi: 'Bàn của tôi màu xanh dương.'
        },
        {
          start: 21.42,
          end: 24.1,
          en: 'There are many things on the desk.',
          zh: '桌子上有很多东西',
          pinyin: 'Zhuō zi shàng yǒu hěn duō dōng xī',
          vi: 'Trên bàn có rất nhiều đồ vật.'
        },
        {
          start: 29.32,
          end: 31.4,
          en: 'There is a computer on the desk.',
          zh: '桌子上有一台电脑',
          pinyin: 'Zhuō zi shàng yǒu yì tái diàn nǎo',
          vi: 'Trên bàn có một chiếc máy tính.'
        }
      ]
    },
    {
      id: 'ep-ps-prah01dvkk0',
      youtubeId: 'prAh01DvKK0',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Tại sân bay',
      titleVi: 'Hội thoại tại sân bay',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 140,
      durationLabel: '2:20',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 22 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/prAh01DvKK0.json',
      cuesCount: 22,
      cues: [
        {
          start: 30,
          end: 31.02,
          en: 'Please put your suitcase on here.',
          zh: '请把行李箱放上来。',
          pinyin: 'Qǐng bǎ xíng li xiāng fàng shàng lái。',
          vi: 'Vui lòng đặt vali lên đây.'
        },
        {
          start: 33.28,
          end: 33.68,
          en: 'OK.',
          zh: '好的。',
          pinyin: 'Hǎo de。',
          vi: 'Vâng.'
        },
        {
          start: 35.7,
          end: 38.44,
          en: 'Excuse me, your luggage is overweight.',
          zh: '不好意思，你的行李超重了。',
          pinyin: 'Bù hǎo yì si， nǐ de xíng li chāo zhòng le。',
          vi: 'Xin lỗi, hành lý của bạn đã vượt quá trọng lượng.'
        }
      ]
    },
    {
      id: 'ep-ps-prb9kzzbrta',
      youtubeId: 'prb9KzzBrtA',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Tôi muốn mua cà phê Americano',
      titleVi: 'Tôi muốn mua cà phê Americano',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 120,
      durationLabel: '2:00',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 23 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/prb9KzzBrtA.json',
      cuesCount: 23,
      cues: [
        {
          start: 0.52,
          end: 3.44,
          en: 'I want to buy an Americano.',
          zh: '我想买美式咖啡。',
          pinyin: 'Wǒ xiǎng mǎi měi shì kā fēi。',
          vi: 'Tôi muốn mua cà phê Americano.'
        },
        {
          start: 7.22,
          end: 9.82,
          en: 'Excuse me, sir, what coffee would you like?',
          zh: '请问先生需要什么咖啡呢？',
          pinyin: 'Qǐng wèn xiān shēng xū yào shén me kā fēi ne？',
          vi: 'Xin hỏi quý khách cần loại cà phê nào ạ?'
        },
        {
          start: 11.78,
          end: 14.44,
          en: 'Um, what options are there?',
          zh: '嗯，请问有什么选择？',
          pinyin: 'Ǹg， qǐng wèn yǒu shén me xuǎn zé？',
          vi: 'Ừm, cho tôi hỏi có những lựa chọn nào ạ?'
        }
      ]
    },
    {
      id: 'ep-ps-q7kkqhfqkwu',
      youtubeId: 'q7kKqHFqKWU',
      level: 'HSK 4+',
      levelGroup: 'hsk4',
      title: '【HSK 4-6】Người trung niên thiếu nhất ba thứ này - 中年人最缺的是这三样东西 | Chinese Podcast',
      titleVi: 'Người trung niên thiếu nhất ba thứ này',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 621,
      durationLabel: '10:21',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 281 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/q7kKqHFqKWU.json',
      cuesCount: 281,
      cues: [
        {
          start: 1.56,
          end: 6.94,
          en: 'At middle age, you haven\'t saved enough money and your life is nearly worn out—does that hit home?',
          zh: '人到中年,钱没攒够,命快熬透,这话有没有戳到你的心?',
          pinyin: 'Rén dào zhōng nián, qián méi zǎn gòu, mìng kuài áo tòu, zhè huà yǒu méi yǒu chuō dào nǐ de xīn?',
          vi: 'Tuổi trung niên, tiền chưa dành dụm đủ, sức lực sắp cạn kiệt – câu này có chạm đúng tim bạn không?'
        },
        {
          start: 8.44,
          end: 15.32,
          en: 'At one in the morning, you\'re switching between meeting minutes and your child\'s homework. Your phone buzzes—now you have to book a doctor\'s appointment for your parents.',
          zh: '半夜一点,你会在会议纪要和孩子作业之间切换,手机一震,又得帮父母挂号。',
          pinyin: 'Bàn yè yì diǎn, nǐ huì zài huì yì jì yào hé hái zi zuò yè zhī jiān qiè huàn, shǒu jī yí zhèn, yòu dé bāng fù mǔ guà hào。',
          vi: 'Một giờ đêm, bạn vừa phải xử lý biên bản họp vừa trông bài vở của con; điện thoại rung lên, lại phải đặt khám bệnh cho bố mẹ.'
        },
        {
          start: 16.22,
          end: 24.16,
          en: 'Rubbing your sore, swollen eyes, you can\'t help sighing. Why is your salary higher than when you were young, yet you feel like life is squeezing you dry?',
          zh: '你揉着酸胀的眼睛,不禁叹气,为啥工资比年轻时高了,可怎么感觉自己快被生活榨干了?',
          pinyin: 'Nǐ róu zhe suān zhàng de yǎn jīng, bù jīn tàn qì, wèi shá gōng zī bǐ nián qīng shí gāo le, kě zěn me gǎn jué zì jǐ kuài bèi shēng huó zhà gān le?',
          vi: 'Bạn dụi đôi mắt mỏi nhừ, không khỏi thở dài: tiền lương đã cao hơn hồi trẻ, vậy mà sao mình cứ như sắp bị cuộc sống bóp cạn?'
        }
      ]
    },
    {
      id: 'ep-ps-qmr55_l8ywm',
      youtubeId: 'qMR55_l8YWM',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG : Đi ăn với bạn',
      titleVi: 'Đi ăn với bạn',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 416,
      durationLabel: '6:56',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 119 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/qMR55_l8YWM.json',
      cuesCount: 119,
      cues: [
        {
          start: 13.78,
          end: 14.98,
          en: 'Yeah, long time no see.',
          zh: '是啊，好久不见了。',
          pinyin: 'Shì a， hǎo jiǔ bú jiàn le。',
          vi: 'Ừ, lâu rồi không gặp.'
        },
        {
          start: 15,
          end: 18.96,
          en: 'You\'re much more handsome than the last time we met.',
          zh: '你比上次见面的时候帅多了。',
          pinyin: 'Nǐ bǐ shàng cì jiàn miàn de shí hòu shuài duō le。',
          vi: 'Bạn đẹp trai hơn nhiều so với lần gặp trước.'
        },
        {
          start: 21.28,
          end: 22.82,
          en: 'Oh, really? Thanks!',
          zh: '哦，是吗？谢谢啊！',
          pinyin: 'Ò， shì ma？ xiè xiè a！',
          vi: 'Ồ, thật à? Cảm ơn nhé!'
        }
      ]
    },
    {
      id: 'ep-ps-rhevez1kw4i',
      youtubeId: 'rhevEz1kw4I',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe hội thoại TIẾNG TRUNG #3 : Giờ giấc, rủ bạn đi chơi',
      titleVi: 'Giờ giấc, rủ bạn đi chơi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 174,
      durationLabel: '2:54',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 59 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/rhevEz1kw4I.json',
      cuesCount: 59,
      cues: [
        {
          start: 5.06,
          end: 6.38,
          en: 'It\'s already half past twelve.',
          zh: '已经十二点半了',
          pinyin: 'Yǐ jīng shí èr diǎn bàn le',
          vi: 'Đã mười hai giờ rưỡi rồi.'
        },
        {
          start: 7.14,
          end: 8.4,
          en: 'Then let\'s go have lunch.',
          zh: '那咱们去吃午饭吧',
          pinyin: 'Nà zán men qù chī wǔ fàn ba',
          vi: 'Vậy chúng ta đi ăn trưa đi.'
        },
        {
          start: 11.9,
          end: 13.8,
          en: 'What time did you leave home today?',
          zh: '你今天几点出门的？',
          pinyin: 'Nǐ jīn tiān jǐ diǎn chū mén de？',
          vi: 'Hôm nay bạn ra khỏi nhà lúc mấy giờ?'
        }
      ]
    },
    {
      id: 'ep-ps-rkz7gjj06gw',
      youtubeId: 'rkz7GJJ06Gw',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe TIẾNG TRUNG thụ động【VIDEO #8】Hỏi thăm bạn bè',
      titleVi: 'Hỏi thăm bạn bè',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 176,
      durationLabel: '2:56',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 27 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/rkz7GJJ06Gw.json',
      cuesCount: 27,
      cues: [
        {
          start: 30.66,
          end: 31.52,
          en: 'So-so.',
          zh: '马马虎虎',
          pinyin: 'Mǎ mǎ hǔ hǔ',
          vi: 'Tàm tạm.'
        },
        {
          start: 34.18,
          end: 36.8,
          en: 'Do your classmates study hard?',
          zh: '你们班同学学习努力吗？',
          pinyin: 'Nǐ men bān tóng xué xué xí nǔ lì ma？',
          vi: 'Các bạn cùng lớp của bạn học hành chăm chỉ không?'
        },
        {
          start: 39.64,
          end: 41.44,
          en: 'They study very hard.',
          zh: '他们学习非常努力。',
          pinyin: 'Tā men xué xí fēi cháng nǔ lì。',
          vi: 'Họ học hành rất chăm chỉ.'
        }
      ]
    },
    {
      id: 'ep-ps-sc4ony_xs7i',
      youtubeId: 'sc4OnY_xS7I',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '80 câu hỏi đáp TIẾNG TRUNG giao tiếp với đồng nghiệp【LUYỆN NGHE TIẾNG TRUNG THỤ ĐỘNG】',
      titleVi: '80 câu hỏi đáp tiếng Trung giao tiếp với đồng nghiệp',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 1054,
      durationLabel: '17:34',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 171 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/sc4OnY_xS7I.json',
      cuesCount: 171,
      cues: [
        {
          start: 30,
          end: 31.08,
          en: 'I rested for two days.',
          zh: '休息了两天',
          pinyin: 'Xiū xi le liǎng tiān',
          vi: 'Nghỉ hai ngày rồi.'
        },
        {
          start: 32.08,
          end: 40.72,
          en: 'You came really early today.',
          zh: '你今天来得真早',
          pinyin: 'Nǐ jīn tiān lái de zhēn zǎo',
          vi: 'Hôm nay bạn đến sớm thật đấy.'
        },
        {
          start: 42.28,
          end: 44.52,
          en: 'You came really early today.',
          zh: '你今天来得真早',
          pinyin: 'Nǐ jīn tiān lái de zhēn zǎo',
          vi: 'Hôm nay bạn đến sớm thật đấy.'
        }
      ]
    },
    {
      id: 'ep-ps-skgzryvrsnq',
      youtubeId: 'skGZRyVRsNQ',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Giới thiệu về tiền tệ của Trung Quốc bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Giới thiệu về tiền tệ Trung Quốc',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 184,
      durationLabel: '3:04',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 18 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/skGZRyVRsNQ.json',
      cuesCount: 18,
      cues: [
        {
          start: 0.4,
          end: 2.68,
          en: 'Practice reading Chinese and master HSK 1.',
          zh: '练习读中文，搞定。',
          pinyin: 'Liàn xí dú zhōng wén， gǎo dìng。',
          vi: 'Luyện đọc tiếng Trung, chinh phục HSK1.'
        },
        {
          start: 8.54,
          end: 10.02,
          en: 'Part one: listen to and read each sentence.',
          zh: '第一部分，听和读每句话。',
          pinyin: 'Dì yī bù fen， tīng hé dú měi jù huà。',
          vi: 'Phần một, nghe và đọc từng câu.'
        },
        {
          start: 11.64,
          end: 13.76,
          en: 'Part two: learn culture; cultural construction is important.',
          zh: '第二部分，学习文化，文化构筑重要。',
          pinyin: 'Dì èr bù fen， xué xí wén huà， wén huà gòu zhù zhòng yào。',
          vi: 'Phần hai: học văn hóa; việc xây dựng văn hóa rất quan trọng.'
        }
      ]
    },
    {
      id: 'ep-ps-slvwkxuegik',
      youtubeId: 'slVWkxUEgIk',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Đoạn văn ngắn TIẾNG TRUNG : Phòng học của tôi',
      titleVi: 'Phòng học của tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 108,
      durationLabel: '1:48',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 22 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/slVWkxUEgIk.json',
      cuesCount: 22,
      cues: [
        {
          start: 5.18,
          end: 8.54,
          en: 'Do you want to know what my classroom looks like?',
          zh: '你想知道我的教室是什么样子的吗?',
          pinyin: 'Nǐ xiǎng zhī dào wǒ de jiào shì shì shén me yàng zi de ma?',
          vi: 'Bạn có muốn biết phòng học của tôi trông như thế nào không?'
        },
        {
          start: 13.84,
          end: 17,
          en: 'There are thirty desks and chairs in the classroom.',
          zh: '教室里有三十个桌子和椅子。',
          pinyin: 'Jiào shì lǐ yǒu sān shí gè zhuō zi hé yǐ zi。',
          vi: 'Trong phòng học có ba mươi cái bàn và ghế.'
        },
        {
          start: 18.98,
          end: 22.12,
          en: 'On the wall there are two blackboards and three paintings.',
          zh: '墙上有两个黑板和三幅画。',
          pinyin: 'Qiáng shàng yǒu liǎng gè hēi bǎn hé sān fú huà。',
          vi: 'Trên tường có hai cái bảng đen và ba bức tranh.'
        }
      ]
    },
    {
      id: 'ep-ps-sohenlfjl64',
      youtubeId: 'soheNLFJl64',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Giới thiệu về cô giáo bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Cô giáo của tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 228,
      durationLabel: '3:48',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 25 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/soheNLFJl64.json',
      cuesCount: 25,
      cues: [
        {
          start: 18.28,
          end: 20.94,
          en: 'I have a very good teacher.',
          zh: '我有一个很好的老师。',
          pinyin: 'Wǒ yǒu yí gè hěn hǎo de lǎo shī。',
          vi: 'Tôi có một cô giáo rất tốt.'
        },
        {
          start: 26.52,
          end: 30.76,
          en: 'She is Chinese and is forty years old this year.',
          zh: '她是中国人，今年四十岁了。',
          pinyin: 'Tā shì zhōng guó rén， jīn nián sì shí suì le。',
          vi: 'Cô ấy là người Trung Quốc, năm nay bốn mươi tuổi.'
        },
        {
          start: 36.5,
          end: 38.96,
          en: 'She is my Chinese teacher.',
          zh: '她是我的汉语老师。',
          pinyin: 'Tā shì wǒ de hàn yǔ lǎo shī。',
          vi: 'Cô ấy là giáo viên tiếng Trung của tôi.'
        }
      ]
    },
    {
      id: 'ep-ps-t7y-p45dedy',
      youtubeId: 't7y-p45DEdY',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn nói về chiếc giường bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Đoạn văn nói về chiếc giường',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 213,
      durationLabel: '3:33',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 24 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/t7y-p45DEdY.json',
      cuesCount: 24,
      cues: [
        {
          start: 11,
          end: 21.06,
          en: 'My room has a bed.',
          zh: '我的房间有一张床。',
          pinyin: 'Wǒ de fáng jiān yǒu yì zhāng chuáng。',
          vi: 'Phòng của tôi có một chiếc giường.'
        },
        {
          start: 27.54,
          end: 29.92,
          en: 'My bed is both big and soft.',
          zh: '我的床又大又软。',
          pinyin: 'Wǒ de chuáng yòu dà yòu ruǎn。',
          vi: 'Giường của tôi vừa to vừa mềm.'
        },
        {
          start: 36.44,
          end: 40.7,
          en: 'There is a blanket and two pillows on the bed.',
          zh: '床上有一条毯子和两个枕头。',
          pinyin: 'Chuáng shàng yǒu yì tiáo tǎn zǐ hé liǎng gè zhěn tou。',
          vi: 'Trên giường có một chiếc chăn và hai chiếc gối.'
        }
      ]
    },
    {
      id: 'ep-ps-tunmyv-69ec',
      youtubeId: 'tUNmYv-69Ec',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe TIẾNG TRUNG thụ động【VIDEO #10】Giới thiệu sản phẩm',
      titleVi: 'Giới thiệu sản phẩm',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 260,
      durationLabel: '4:20',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 35 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/tUNmYv-69Ec.json',
      cuesCount: 35,
      cues: [
        {
          start: 31.58,
          end: 33.06,
          en: 'The style also looks pretty good.',
          zh: '样子也挺好看。',
          pinyin: 'Yàng zi yě tǐng hǎo kàn。',
          vi: 'Kiểu dáng cũng khá đẹp.'
        },
        {
          start: 60.58,
          end: 71.13,
          en: 'The brand is good, and the quality is also good.',
          zh: '牌子质量又好',
          pinyin: 'Pái zi zhì liàng yòu hǎo',
          vi: 'Thương hiệu tốt, chất lượng cũng tốt.'
        },
        {
          start: 75.63,
          end: 76.51,
          en: 'price',
          zh: '价钱',
          pinyin: 'Jià qián',
          vi: 'giá cả'
        }
      ]
    },
    {
      id: 'ep-ps-tynbw_u2dnk',
      youtubeId: 'tyNbW_u2DNk',
      level: 'HSK 4+',
      levelGroup: 'hsk4',
      title: '【HSK 4-6】第一天上班 - Ngày đầu tiên đi làm | Chinese Podcast',
      titleVi: 'Ngày đầu tiên đi làm',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 303,
      durationLabel: '5:03',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 81 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/tyNbW_u2DNk.json',
      cuesCount: 81,
      cues: [
        {
          start: 10.12,
          end: 17.34,
          en: 'I am 25 this year, just graduated from university, and now live in Hexi District, Tianjin.',
          zh: '我今年岁,刚从大学毕业,现在住在天津河西区。',
          pinyin: 'Wǒ jīn nián suì, gāng cóng dà xué bì yè, xiàn zài zhù zài tiān jīn hé xī qū。',
          vi: 'Tôi năm nay 25 tuổi, vừa tốt nghiệp đại học, hiện đang sống ở quận Hà Tây, Thiên Tân.'
        },
        {
          start: 19.12,
          end: 26.44,
          en: 'This year I was very lucky to find a job at a big company, with a monthly salary of 18,000 yuan.',
          zh: '今年我很幸运,找到了一份大公司的工作,月工资元。',
          pinyin: 'Jīn nián wǒ hěn xìng yùn, zhǎo dào le yí fèn dà gōng sī de gōng zuò, yuè gōng zī yuán。',
          vi: 'Năm nay tôi rất may mắn, tìm được một công việc ở công ty lớn, lương tháng 18.000 tệ.'
        },
        {
          start: 27.7,
          end: 28.5,
          en: 'Besides the salary',
          zh: '除了工资',
          pinyin: 'Chú le gōng zī',
          vi: 'Ngoài lương ra'
        }
      ]
    },
    {
      id: 'ep-ps-u6lyjisiyvm',
      youtubeId: 'u6lyjISIyVM',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Bạn cùng lớp của tôi - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Bạn cùng lớp của tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 239,
      durationLabel: '3:59',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 23 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/u6lyjISIyVM.json',
      cuesCount: 23,
      cues: [
        {
          start: 3.94,
          end: 5.38,
          en: 'Read: My classmate, my friend.',
          zh: '读：我的同学，我的朋友',
          pinyin: 'Dú： wǒ de tóng xué， wǒ de péng yǒu',
          vi: 'Đọc: Bạn cùng lớp, bạn của tôi.'
        },
        {
          start: 21.74,
          end: 23.94,
          en: 'Xiaoyun is my classmate.',
          zh: '小云是我的同学',
          pinyin: 'Xiǎo yún shì wǒ de tóng xué',
          vi: 'Tiểu Vân là bạn cùng lớp của tôi.'
        },
        {
          start: 28.1,
          end: 29.46,
          en: 'She is also my good friend.',
          zh: '也是我的好朋友',
          pinyin: 'Yě shì wǒ de hǎo péng yǒu',
          vi: 'Cũng là bạn tốt của tôi.'
        }
      ]
    },
    {
      id: 'ep-ps-uak0xgg1aje',
      youtubeId: 'uAK0XgG1ajE',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: '【HSK 1-3】难忘的中秋节 - Tết Trung Thu khó quên | Chinese Podcast',
      titleVi: 'Tết Trung Thu khó quên',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 305,
      durationLabel: '5:05',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 65 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/uAK0XgG1ajE.json',
      cuesCount: 65,
      cues: [
        {
          start: 9.96,
          end: 14.18,
          en: 'The Mid-Autumn Festival is a very important traditional festival for us Chinese.',
          zh: '中秋节是我们中国非常重要的传统节日。',
          pinyin: 'Zhōng qiū jié shì wǒ men zhōng guó fēi cháng zhòng yào de chuán tǒng jié rì。',
          vi: 'Tết Trung Thu là một ngày lễ truyền thống rất quan trọng của người Trung Quốc chúng tôi.'
        },
        {
          start: 15.04,
          end: 17.34,
          en: 'It is also one of my favorite festivals.',
          zh: '也是我最喜欢的节日之一。',
          pinyin: 'Yě shì wǒ zuì xǐ huan de jié rì zhī yī。',
          vi: 'Cũng là một trong những ngày lễ tôi thích nhất.'
        },
        {
          start: 18.6,
          end: 24,
          en: 'I hope my story can help everyone feel the warmth and happiness of the Mid-Autumn Festival.',
          zh: '希望我的故事能让大家感受到中秋节的温暖和快乐。',
          pinyin: 'Xī wàng wǒ de gù shì néng ràng dà jiā gǎn shòu dào zhōng qiū jié de wēn nuǎn huo kuài lè。',
          vi: 'Tôi hy vọng câu chuyện của mình có thể giúp mọi người cảm nhận được sự ấm áp và niềm vui của Tết Trung Thu.'
        }
      ]
    },
    {
      id: 'ep-ps-uqcul0kizys',
      youtubeId: 'uQCuL0Kizys',
      level: 'HSK 4+',
      levelGroup: 'hsk4',
      title: '【HSK 4-6】中国人为什么喜欢红色 - Tại sao người Trung Quốc thích màu đỏ | Chinese Podcast',
      titleVi: 'Vì sao người Trung Quốc thích màu đỏ?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 235,
      durationLabel: '3:55',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 59 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/uQCuL0Kizys.json',
      cuesCount: 59,
      cues: [
        {
          start: 5.64,
          end: 9.36,
          en: 'If you have been to China, or watched Chinese movies,',
          zh: '如果你去过中国，或者看过中国的电影，',
          pinyin: 'Rú guǒ nǐ qù guò zhōng guó， huò zhě kàn guò zhōng guó de diàn yǐng，',
          vi: 'Nếu bạn đã từng đến Trung Quốc, hoặc đã xem phim Trung Quốc,'
        },
        {
          start: 10.16,
          end: 12.98,
          en: 'you will definitely notice a very interesting phenomenon.',
          zh: '你一定会发现一个很有趣的现象，',
          pinyin: 'Nǐ yí dìng huì fā xiàn yí gè hěn yǒu qù de xiàn xiàng，',
          vi: 'bạn chắc chắn sẽ nhận ra một hiện tượng rất thú vị.'
        },
        {
          start: 13.66,
          end: 17.94,
          en: 'That is, Chinese people especially like the color red.',
          zh: '那就是中国人特别喜欢红色。',
          pinyin: 'Nà jiù shì zhōng guó rén tè bié xǐ huan hóng sè。',
          vi: 'Đó là người Trung Quốc đặc biệt thích màu đỏ.'
        }
      ]
    },
    {
      id: 'ep-ps-uxs_9u9beuc',
      youtubeId: 'uXS_9U9Beuc',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn nói về quả táo bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Đoạn văn tiếng Trung về quả táo',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 204,
      durationLabel: '3:24',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 16 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/uXS_9U9Beuc.json',
      cuesCount: 16,
      cues: [
        {
          start: 18.08,
          end: 21.68,
          en: 'Apples are a delicious, healthy fruit.',
          zh: '苹果是美味的、健康的水果。',
          pinyin: 'Píng guǒ shì měi wèi de、 jiàn kāng de shuǐ guǒ。',
          vi: 'Táo là một loại trái cây ngon và tốt cho sức khỏe.'
        },
        {
          start: 27.3,
          end: 31.84,
          en: 'They are red, green, or yellow.',
          zh: '它们是红色、绿色或黄色的。',
          pinyin: 'Tā men shì hóng sè、 lǜ sè huò huáng sè de。',
          vi: 'Chúng có màu đỏ, xanh lá cây hoặc vàng.'
        },
        {
          start: 37.42,
          end: 40.36,
          en: 'People use apples to make fruit juice.',
          zh: '人们用苹果制作果汁。',
          pinyin: 'Rén men yòng píng guǒ zhì zuò guǒ zhī。',
          vi: 'Người ta dùng táo để làm nước ép trái cây.'
        }
      ]
    },
    {
      id: 'ep-ps-uak-ykmzcim',
      youtubeId: 'uak-YkMzcIM',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Miêu tả lớp học - LUYỆN ĐỌC TIẾNG TRUNG HSK 1',
      titleVi: 'Miêu tả lớp học',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 244,
      durationLabel: '4:04',
      topic: 'Luyện đọc HSK 1',
      note: 'Trọn bộ 25 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/uak-YkMzcIM.json',
      cuesCount: 25,
      cues: [
        {
          start: 17.82,
          end: 20.38,
          en: 'I am a fourth-grade student.',
          zh: '我是四年级的学生。',
          pinyin: 'Wǒ shì sì nián jí de xué shēng。',
          vi: 'Tôi là học sinh lớp bốn.'
        },
        {
          start: 26.1,
          end: 27.98,
          en: 'This is our classroom.',
          zh: '这是我们班的教室。',
          pinyin: 'Zhè shì wǒ men bān de jiào shì。',
          vi: 'Đây là phòng học của lớp chúng tôi.'
        },
        {
          start: 33.48,
          end: 38.6,
          en: 'Inside there are altogether 30 desks and 30 chairs.',
          zh: '里面总共有张桌子和把椅子。',
          pinyin: 'Lǐ miàn zǒng gòng yǒu zhāng zhuō zi hé bǎ yǐ zi。',
          vi: 'Bên trong có tổng cộng 30 cái bàn và 30 cái ghế.'
        }
      ]
    },
    {
      id: 'ep-ps-uup4yg9nhfq',
      youtubeId: 'uuP4YG9NHFQ',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '100 câu giao tiếp TIẾNG TRUNG cho người đi làm【TIẾNG TRUNG CHO NGƯỜI ĐI LÀM - BÀI 6】',
      titleVi: '100 câu giao tiếp tiếng Trung cho người đi làm',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 1788,
      durationLabel: '29:48',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 259 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/uuP4YG9NHFQ.json',
      cuesCount: 259,
      cues: [
        {
          start: 2.46,
          end: 6.18,
          en: 'In the program, we learn 100 Chinese sentences every day for working people.',
          zh: '我们在节目中每天学习句中文，为工作人员准备。',
          pinyin: 'Wǒ men zài jié mù zhōng měi tiān xué xí jù zhōng wén， wèi gōng zuò rén yuán zhǔn bèi。',
          vi: 'Trong chương trình, mỗi ngày chúng ta học 100 câu tiếng Trung dành cho người đi làm.'
        },
        {
          start: 7.16,
          end: 8.74,
          en: 'This is lesson six.',
          zh: '这是第六课。',
          pinyin: 'Zhè shì dì liù kè。',
          vi: 'Đây là bài học thứ sáu.'
        },
        {
          start: 11.16,
          end: 12.44,
          en: 'Each lesson will be read 5 times.',
          zh: '每个课程会读5遍。',
          pinyin: 'Měi gè kè chéng huì dú 5 biàn。',
          vi: 'Mỗi bài học sẽ đọc 5 lần.'
        }
      ]
    },
    {
      id: 'ep-ps-uzsbukyx5ea',
      youtubeId: 'uzSbuKyX5EA',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe TIẾNG TRUNG thụ động【VIDEO #15】Đi nhà hàng',
      titleVi: 'Đi nhà hàng',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 316,
      durationLabel: '5:16',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 45 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/uzSbuKyX5EA.json',
      cuesCount: 45,
      cues: [
        {
          start: 31.4,
          end: 32.74,
          en: 'Is tomorrow noon okay?',
          zh: '明天中午好吗？',
          pinyin: 'Míng tiān zhōng wǔ hǎo ma？',
          vi: 'Trưa mai được không?'
        },
        {
          start: 36.1,
          end: 36.45,
          en: 'Okay!',
          zh: '好！',
          pinyin: 'Hǎo！',
          vi: 'Được!'
        },
        {
          start: 41.68,
          end: 42.38,
          en: 'I heard / it is said',
          zh: '听说',
          pinyin: 'Tīng shuō',
          vi: 'nghe nói'
        }
      ]
    },
    {
      id: 'ep-ps-v0wufgem32y',
      youtubeId: 'v0WUfgeM32Y',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Làm sao để học tốt tiếng Trung ?',
      titleVi: 'Hội thoại ngắn tiếng Trung: Làm sao để học tốt tiếng Trung?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 80,
      durationLabel: '1:20',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 10 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/v0WUfgeM32Y.json',
      cuesCount: 10,
      cues: [
        {
          start: 30,
          end: 38.12,
          en: 'How much time should I spend learning Chinese every day?',
          zh: '我每天应该花多长时间学习汉语',
          pinyin: 'Wǒ měi tiān yīng gāi huā duō cháng shí jiān xué xí hàn yǔ',
          vi: 'Mỗi ngày tôi nên dành bao nhiêu thời gian để học tiếng Trung?'
        },
        {
          start: 39.82,
          end: 42.22,
          en: 'About one or two hours is best.',
          zh: '大约一两个小时是最好的',
          pinyin: 'Dà yuē yì liǎng gè xiǎo shí shì zuì hǎo de',
          vi: 'Khoảng một đến hai tiếng là tốt nhất.'
        },
        {
          start: 45.42,
          end: 49.22,
          en: 'Brave',
          zh: '勇敢',
          pinyin: 'Yǒng gǎn',
          vi: 'Dũng cảm'
        }
      ]
    },
    {
      id: 'ep-ps-vaajcc319gm',
      youtubeId: 'vAaJcC319gM',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: '【HSK 1-3】我的小餐馆 - Nhà hàng nhỏ của tôi | Chinese Podcast',
      titleVi: 'Nhà hàng nhỏ của tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 270,
      durationLabel: '4:30',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 51 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/vAaJcC319gM.json',
      cuesCount: 51,
      cues: [
        {
          start: 6.16,
          end: 10.02,
          en: 'My friend and I came from Shanghai to Ho Chi Minh City,',
          zh: '我和我的朋友从上海来到胡志明市，',
          pinyin: 'Wǒ hé wǒ de péng yǒu cóng shàng hǎi lái dào hú zhì míng shì，',
          vi: 'Tôi và bạn tôi từ Thượng Hải đến Thành phố Hồ Chí Minh,'
        },
        {
          start: 10.62,
          end: 12.22,
          en: 'and opened a Chinese restaurant.',
          zh: '开了一家中国餐馆。',
          pinyin: 'Kāi le yì jiā zhōng guó cān guǎn。',
          vi: 'mở một nhà hàng Trung Quốc.'
        },
        {
          start: 13.56,
          end: 18.56,
          en: 'I hope my story can help you feel the power of dreams and hard work.',
          zh: '希望我的故事能让你们感受到梦想和努力的力量。',
          pinyin: 'Xī wàng wǒ de gù shì néng ràng nǐ men gǎn shòu dào mèng xiǎng hé nǔ lì de lì liàng。',
          vi: 'Hy vọng câu chuyện của tôi có thể giúp các bạn cảm nhận được sức mạnh của ước mơ và sự nỗ lực.'
        }
      ]
    },
    {
      id: 'ep-ps-va4m2i7d904',
      youtubeId: 'va4M2i7D904',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Bạn dạo này bận gì vậy ?',
      titleVi: 'Bạn dạo này bận gì vậy?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 107,
      durationLabel: '1:47',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 22 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/va4M2i7D904.json',
      cuesCount: 22,
      cues: [
        {
          start: 14.26,
          end: 17.46,
          en: 'I\'ve been buried in books these days.',
          zh: '这几天一直埋在书堆里呢',
          pinyin: 'Zhè jǐ tiān yì zhí mái zài shū duī lǐ ne',
          vi: 'Mấy hôm nay mình cứ vùi đầu vào đống sách.'
        },
        {
          start: 19.72,
          end: 21.14,
          en: 'You\'re really too hardworking.',
          zh: '你也太用功了吧',
          pinyin: 'Nǐ yě tài yòng gōng le ba',
          vi: 'Bạn cũng chăm chỉ quá đấy!'
        },
        {
          start: 22,
          end: 23.4,
          en: 'Go out for a walk this afternoon',
          zh: '下午出去散步',
          pinyin: 'Xià wǔ chū qù sàn bù',
          vi: 'Chiều nay ra ngoài đi dạo'
        }
      ]
    },
    {
      id: 'ep-ps-wdwy0gm-hbm',
      youtubeId: 'wDWY0GM-hbM',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: '100 câu giao tiếp TIẾNG TRUNG cho người đi làm【TIẾNG TRUNG CHO NGƯỜI ĐI LÀM - BÀI 2】',
      titleVi: '100 câu giao tiếp tiếng Trung cho người đi làm',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 1697,
      durationLabel: '28:17',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 279 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/wDWY0GM-hbM.json',
      cuesCount: 279,
      cues: [
        {
          start: 2.26,
          end: 5.18,
          en: 'In the program, we learn 100 Chinese sentences every day.',
          zh: '我们在节目中每天学习个中文句子。',
          pinyin: 'Wǒ men zài jié mù zhōng měi tiān xué xí gè zhōng wén jù zi。',
          vi: 'Trong chương trình này, mỗi ngày chúng ta học 100 câu tiếng Trung.'
        },
        {
          start: 5.2,
          end: 7.64,
          en: 'This is our second lesson.',
          zh: '这是我们的第二个课程。',
          pinyin: 'Zhè shì wǒ men de dì èr gè kè chéng。',
          vi: 'Đây là bài học thứ hai của chúng ta.'
        },
        {
          start: 9,
          end: 10.12,
          en: 'Each lesson will have 5 readings.',
          zh: '每个课程会有5次朗读。',
          pinyin: 'Měi gè kè chéng huì yǒu 5 cì lǎng dú。',
          vi: 'Mỗi bài học sẽ có 5 lần đọc.'
        }
      ]
    },
    {
      id: 'ep-ps-wj8vskebxvg',
      youtubeId: 'wj8vSkEbXvg',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Luyện nghe TIẾNG TRUNG HSK 1 - Trình độ sơ cấp | HSK Chinese Level 1',
      titleVi: 'Luyện nghe tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 559,
      durationLabel: '9:19',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 78 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/wj8vSkEbXvg.json',
      cuesCount: 78,
      cues: [
        {
          start: 19.06,
          end: 20.8,
          en: 'There are five questions in total.',
          zh: '一共五个题',
          pinyin: 'Yí gòng wǔ gè tí',
          vi: 'Tổng cộng có năm câu.'
        },
        {
          start: 21.56,
          end: 23.62,
          en: 'You will hear each question twice.',
          zh: '每题听两次',
          pinyin: 'Měi tí tīng liǎng cì',
          vi: 'Bạn sẽ nghe mỗi câu hai lần.'
        },
        {
          start: 24.9,
          end: 27.8,
          en: 'Now let\'s start the first question.',
          zh: '现在开始第一题',
          pinyin: 'Xiàn zài kāi shǐ dì yī tí',
          vi: 'Bây giờ bắt đầu câu thứ nhất.'
        }
      ]
    },
    {
      id: 'ep-ps-wqm8h6o1eiw',
      youtubeId: 'wqM8H6o1Eiw',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: '【HSK 1-3】让人更健康的好习惯 - Những thói quen giúp bạn khoẻ mạnh | Chinese Podcast',
      titleVi: 'Những thói quen giúp bạn khỏe mạnh hơn',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 251,
      durationLabel: '4:11',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 63 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/wqM8H6o1Eiw.json',
      cuesCount: 63,
      cues: [
        {
          start: 6.38,
          end: 11.02,
          en: 'Young people today are all very busy with work, and the pressure is also very big,',
          zh: '现在的年轻人工作都很忙，压力也很大，',
          pinyin: 'Xiàn zài de nián qīng rén gōng zuò dōu hěn máng， yā lì yě hěn dà，',
          vi: 'Giới trẻ ngày nay ai cũng bận rộn với công việc, áp lực cũng rất lớn,'
        },
        {
          start: 11.92,
          end: 16.34,
          en: 'So many people often get sick or feel physically unwell.',
          zh: '所以很多人经常生病或者觉得身体不舒服。',
          pinyin: 'Suǒ yǐ hěn duō rén jīng cháng shēng bìng huò zhě jué de shēn tǐ bù shū fú。',
          vi: 'Vì vậy nhiều người thường xuyên bị ốm hoặc cảm thấy cơ thể không được khỏe.'
        },
        {
          start: 17.36,
          end: 20.96,
          en: 'People often say that the body is the capital of the revolution.',
          zh: '大家常说，身体是革命的本钱。',
          pinyin: 'Dà jiā cháng shuō， shēn tǐ shì gé mìng de běn qián。',
          vi: 'Người ta thường nói, thân thể là vốn liếng của cách mạng.'
        }
      ]
    },
    {
      id: 'ep-ps-xowwcswhnue',
      youtubeId: 'xOwWcswhnuE',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Người bạn mới của tôi - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Người bạn mới của tôi',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 257,
      durationLabel: '4:17',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 23 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/xOwWcswhnuE.json',
      cuesCount: 23,
      cues: [
        {
          start: 21.86,
          end: 24.76,
          en: 'Today I met a new friend.',
          zh: '今天我认识了一个新朋友。',
          pinyin: 'Jīn tiān wǒ rèn shi le yí gè xīn péng yǒu。',
          vi: 'Hôm nay tôi quen một người bạn mới.'
        },
        {
          start: 28.28,
          end: 30.34,
          en: 'His name is Nguyen Van Son.',
          zh: '他的名字是阮文山。',
          pinyin: 'Tā de míng zì shì ruǎn wén shān。',
          vi: 'Tên cậu ấy là Nguyễn Văn Sơn.'
        },
        {
          start: 32.84,
          end: 33.8,
          en: 'He is seven years old this year.',
          zh: '今年七岁。',
          pinyin: 'Jīn nián qī suì。',
          vi: 'Năm nay cậu ấy bảy tuổi.'
        }
      ]
    },
    {
      id: 'ep-ps-xxhw2hj3byk',
      youtubeId: 'xXhw2HJ3bYk',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Tổng công ty ở đâu ?',
      titleVi: 'Tổng công ty ở đâu?',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 124,
      durationLabel: '2:04',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 28 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/xXhw2HJ3bYk.json',
      cuesCount: 28,
      cues: [
        {
          start: 0.78,
          end: 9.34,
          en: 'Xiao Wang, the company manager asked me to go to the head office for a meeting this afternoon.',
          zh: '小王，公司经理让我下午去总公司开会。',
          pinyin: 'Xiǎo wáng， gōng sī jīng lǐ ràng wǒ xià wǔ qù zǒng gōng sī kāi huì。',
          vi: 'Tiểu Vương, giám đốc công ty bảo tôi chiều nay đến tổng công ty họp.'
        },
        {
          start: 10.72,
          end: 15.84,
          en: 'But I haven\'t been here long, so I\'m not sure where the head office is.',
          zh: '但是，我刚来不久，还不清楚总公司位置在哪里。',
          pinyin: 'Dàn shì， wǒ gāng lái bù jiǔ， hái bù qīng chǔ zǒng gōng sī wèi zhì zài nǎ lǐ。',
          vi: 'Nhưng tôi mới đến chưa lâu, vẫn không rõ tổng công ty ở đâu.'
        },
        {
          start: 20.62,
          end: 21.86,
          en: 'Okay, no problem.',
          zh: '好，没问题。',
          pinyin: 'Hǎo， méi wèn tí。',
          vi: 'Được, không vấn đề gì.'
        }
      ]
    },
    {
      id: 'ep-ps-y5_buq4jxoc',
      youtubeId: 'y5_BUQ4jxOc',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn giới thiệu về chiếc xe đạp bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Đoạn văn giới thiệu về chiếc xe đạp',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 226,
      durationLabel: '3:46',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 29 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/y5_BUQ4jxOc.json',
      cuesCount: 29,
      cues: [
        {
          start: 8.38,
          end: 20.54,
          en: 'I have a bicycle.',
          zh: '我有一辆自行车。',
          pinyin: 'Wǒ yǒu yí liàng zì xíng chē。',
          vi: 'Tôi có một chiếc xe đạp.'
        },
        {
          start: 25.52,
          end: 28.1,
          en: 'It is black and blue, very nice-looking.',
          zh: '它是黑色和蓝色的，很好看。',
          pinyin: 'Tā shì hēi sè hé lán sè de， hěn hǎo kàn。',
          vi: 'Nó có màu đen và xanh dương, rất đẹp.'
        },
        {
          start: 33.58,
          end: 35.9,
          en: 'It is not very big; it has two wheels.',
          zh: '它不是很大，有两个轮子。',
          pinyin: 'Tā bú shì hěn dà， yǒu liǎng gè lún zǐ。',
          vi: 'Nó không lớn lắm, có hai bánh xe.'
        }
      ]
    },
    {
      id: 'ep-ps-y82s8w-9rq4',
      youtubeId: 'y82s8w-9rq4',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn nói về quả măng cụt bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Đoạn văn tiếng Trung về quả măng cụt',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 207,
      durationLabel: '3:27',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 32 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/y82s8w-9rq4.json',
      cuesCount: 32,
      cues: [
        {
          start: 7.54,
          end: 20.46,
          en: 'Mangosteen is a tropical fruit.',
          zh: '山竹是一种热带水果',
          pinyin: 'Shān zhú shì yì zhǒng rè dài shuǐ guǒ',
          vi: 'Măng cụt là một loại trái cây nhiệt đới.'
        },
        {
          start: 26.42,
          end: 27.74,
          en: 'It grows on trees.',
          zh: '生长在树上',
          pinyin: 'Shēng zhǎng zài shù shàng',
          vi: 'Nó mọc trên cây.'
        },
        {
          start: 33.62,
          end: 36.12,
          en: 'The outside of the mangosteen is purple.',
          zh: '山竹的外面是紫色的',
          pinyin: 'Shān zhú de wài miàn shì zǐ sè de',
          vi: 'Bên ngoài quả măng cụt màu tím.'
        }
      ]
    },
    {
      id: 'ep-ps-y9ilrsk0rpu',
      youtubeId: 'y9ilrsk0rPU',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: '【HSK1】10 câu chuyện ngắn luyện nghe TIẾNG TRUNG (PHẦN 5)',
      titleVi: '10 câu chuyện ngắn luyện nghe tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 291,
      durationLabel: '4:51',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 52 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/y9ilrsk0rPU.json',
      cuesCount: 52,
      cues: [
        {
          start: 7.5,
          end: 18.4,
          en: 'Summer is my favorite season, because I was born in summer, and summer vacation is very fun.',
          zh: '夏天是我最喜欢的季节，因为我生在夏天，而且夏天的暑假非常好玩。',
          pinyin: 'Xià tiān shì wǒ zuì xǐ huān de jì jié， yīn wèi wǒ shēng zài xià tiān， ér qiě xià tiān de shǔ jià fēi cháng hǎo wán。',
          vi: 'Mùa hè là mùa tôi thích nhất, vì tôi sinh ra vào mùa hè, và kỳ nghỉ hè rất vui.'
        },
        {
          start: 20.16,
          end: 22.84,
          en: 'In my country, summer is very long.',
          zh: '在我的国家，夏天很长。',
          pinyin: 'Zài wǒ de guó jiā， xià tiān hěn cháng。',
          vi: 'Ở nước tôi, mùa hè rất dài.'
        },
        {
          start: 24.66,
          end: 28.92,
          en: 'I am very lucky because my hometown is right by the sea.',
          zh: '我很幸运，因为我的家乡就在海边。',
          pinyin: 'Wǒ hěn xìng yùn， yīn wèi wǒ de jiā xiāng jiù zài hǎi biān。',
          vi: 'Tôi rất may mắn vì quê tôi ở ngay bờ biển.'
        }
      ]
    },
    {
      id: 'ep-ps-yuoxr472cjc',
      youtubeId: 'yUOXR472CJc',
      level: 'HSK 2+',
      levelGroup: 'hsk1-2',
      title: 'Ký túc xá - LUYỆN ĐỌC TIẾNG TRUNG HSK 2',
      titleVi: 'Ký túc xá',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 214,
      durationLabel: '3:34',
      topic: 'Luyện đọc HSK 2',
      note: 'Trọn bộ 20 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/yUOXR472CJc.json',
      cuesCount: 20,
      cues: [
        {
          start: 22.02,
          end: 24.34,
          en: 'Today I went to Shanghai University to register.',
          zh: '今天我去上海大学报到了。',
          pinyin: 'Jīn tiān wǒ qù shàng hǎi dà xué bào dào le。',
          vi: 'Hôm nay tôi đến Đại học Thượng Hải báo danh.'
        },
        {
          start: 26.44,
          end: 30.22,
          en: 'The teacher said the school has a dormitory, and I was very happy.',
          zh: '老师说学校有宿舍，我很高兴。',
          pinyin: 'Lǎo shī shuō xué xiào yǒu sù shè， wǒ hěn gāo xìng。',
          vi: 'Thầy giáo nói trường có ký túc xá, tôi rất vui.'
        },
        {
          start: 32.32,
          end: 34.2,
          en: 'Renting an apartment in Shanghai is very expensive.',
          zh: '在上海租房很贵。',
          pinyin: 'Zài shàng hǎi zū fáng hěn guì。',
          vi: 'Thuê nhà ở Thượng Hải rất đắt.'
        }
      ]
    },
    {
      id: 'ep-ps-yvnax7kaikc',
      youtubeId: 'yvNax7kaIKc',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe TIẾNG TRUNG thụ động【VIDEO #19】Kế hoạch du lịch',
      titleVi: 'Kế hoạch du lịch',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 282,
      durationLabel: '4:42',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 42 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/yvNax7kaIKc.json',
      cuesCount: 42,
      cues: [
        {
          start: 32.88,
          end: 35.5,
          en: 'I heard Xi\'an is even hotter than Beijing.',
          zh: '我听说西安比北京还热。',
          pinyin: 'Wǒ tīng shuō xī ān bǐ běi jīng hái rè。',
          vi: 'Tôi nghe nói Tây An còn nóng hơn Bắc Kinh.'
        },
        {
          start: 38,
          end: 40.98,
          en: 'Is Datong a little cooler than Beijing?',
          zh: '大同是不是比北京凉快一点？',
          pinyin: 'Dà tóng shì bu shì bǐ běi jīng liáng kuai yì diǎn？',
          vi: 'Đại Đồng có mát hơn Bắc Kinh một chút không?'
        },
        {
          start: 45.08,
          end: 46.32,
          en: 'Check the weather forecast.',
          zh: '看天气预报。',
          pinyin: 'Kàn tiān qì yù bào。',
          vi: 'Xem dự báo thời tiết.'
        }
      ]
    },
    {
      id: 'ep-ps-z35yfzrqvg0',
      youtubeId: 'z35YFZrQVg0',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: '【HSK 1-4】上班族的一天 - Một ngày của người đi làm | Chinese Podcast',
      titleVi: 'Một ngày của người đi làm',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 360,
      durationLabel: '6:00',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 94 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/z35YFZrQVg0.json',
      cuesCount: 94,
      cues: [
        {
          start: 3.5,
          end: 7.14,
          en: 'Today I want to share a story with everyone in Chinese.',
          zh: '今天我想用中文和大家分享一个故事，',
          pinyin: 'Jīn tiān wǒ xiǎng yòng zhōng wén hé dà jiā fēn xiǎng yí gè gù shì，',
          vi: 'Hôm nay tôi muốn dùng tiếng Trung chia sẻ với mọi người một câu chuyện,'
        },
        {
          start: 8.16,
          end: 12.6,
          en: 'About a day in the life of an office worker striving in a big city.',
          zh: '关于一名在大城市打拼的上班族的一天。',
          pinyin: 'Guān yú yì míng zài dài chéng shì dǎ pīn de shàng bān zú de yì tiān。',
          vi: 'Về một ngày của một người đi làm phấn đấu ở thành phố lớn.'
        },
        {
          start: 14.14,
          end: 18.68,
          en: 'At 6:30 in the morning, the alarm clock rang, and I got up on time.',
          zh: '早上六点半，闹钟响了，我准时起床。',
          pinyin: 'Zǎo shàng liù diǎn bàn， nào zhōng xiǎng le， wǒ zhǔn shí qǐ chuáng。',
          vi: 'Sáu giờ rưỡi sáng, đồng hồ báo thức reo, tôi dậy đúng giờ.'
        }
      ]
    },
    {
      id: 'ep-ps-zmvwjad1dbu',
      youtubeId: 'zMVwJaD1dbU',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Giới thiệu về thành phố Hải Phòng bằng TIẾNG TRUNG',
      titleVi: 'Giới thiệu về thành phố Hải Phòng bằng tiếng Trung',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 203,
      durationLabel: '3:23',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 38 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/zMVwJaD1dbU.json',
      cuesCount: 38,
      cues: [
        {
          start: 9.54,
          end: 13.8,
          en: 'Today I\'ll introduce my hometown to everyone.',
          zh: '今天给大家介绍一下我的家乡。',
          pinyin: 'Jīn tiān gěi dà jiā jiè shào yí xià wǒ de jiā xiāng。',
          vi: 'Hôm nay tôi giới thiệu với mọi người về quê hương của tôi.'
        },
        {
          start: 15.08,
          end: 16.92,
          en: 'My hometown is in Haiphong.',
          zh: '我的家乡在海防。',
          pinyin: 'Wǒ de jiā xiāng zài hǎi fáng。',
          vi: 'Quê hương tôi ở Hải Phòng.'
        },
        {
          start: 18.32,
          end: 22.58,
          en: 'Haiphong has mountains and water, and the scenery is very beautiful.',
          zh: '海防有山，有水，风景很美丽。',
          pinyin: 'Hǎi fáng yǒu shān， yǒu shuǐ， fēng jǐng hěn měi lì。',
          vi: 'Hải Phòng có núi, có nước, phong cảnh rất đẹp.'
        }
      ]
    },
    {
      id: 'ep-ps-zo4avzn0xkq',
      youtubeId: 'zO4AvZn0xkQ',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Hội thoại ngắn TIẾNG TRUNG : Hẹn gặp bác sĩ',
      titleVi: 'Hẹn gặp bác sĩ',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 93,
      durationLabel: '1:33',
      topic: 'Giao tiếp & Hội thoại',
      note: 'Trọn bộ 15 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/zO4AvZn0xkQ.json',
      cuesCount: 15,
      cues: [
        {
          start: 0.84,
          end: 2.74,
          en: 'Hello, I would like to make an appointment to see a doctor.',
          zh: '您好，我想预约见医生。',
          pinyin: 'Nín hǎo， wǒ xiǎng yù yuē jiàn yī shēng。',
          vi: 'Xin chào, tôi muốn đặt lịch gặp bác sĩ.'
        },
        {
          start: 30.56,
          end: 32.82,
          en: 'May I ask what time is convenient for you to come?',
          zh: '请问您什么时间方便过来？',
          pinyin: 'Qǐng wèn nín shén me shí jiān fāng biàn guò lái？',
          vi: 'Xin hỏi anh/chị tiện đến lúc nào?'
        },
        {
          start: 34.36,
          end: 36.2,
          en: 'Is 10 a.m. on Saturday okay?',
          zh: '周六上午十点可以吗？',
          pinyin: 'Zhōu liù shàng wǔ shí diǎn kě yǐ ma？',
          vi: 'Thứ Bảy lúc mười giờ sáng được không ạ?'
        }
      ]
    },
    {
      id: 'ep-ps-zrydizwc-bu',
      youtubeId: 'zRYdIZWC-BU',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: '【HSK 1-3】如何学好中文 - Làm thế nào để học tốt tiếng Trung | Chinese Podcast',
      titleVi: 'Cách học tiếng Trung hiệu quả',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 250,
      durationLabel: '4:10',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 51 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/zRYdIZWC-BU.json',
      cuesCount: 51,
      cues: [
        {
          start: 4.6,
          end: 7.62,
          en: 'I am your host, Xiaoming.',
          zh: '我是你们的主持人，小明。',
          pinyin: 'Wǒ shì nǐ men de zhǔ chí rén， xiǎo míng。',
          vi: 'Tôi là người dẫn chương trình của các bạn, Tiểu Minh.'
        },
        {
          start: 8.96,
          end: 12.32,
          en: 'Recently, I have received many letters from listeners.',
          zh: '最近，我收到了很多听众的来信。',
          pinyin: 'Zuì jìn， wǒ shōu dào le hěn duō tīng zhòng de lái xìn。',
          vi: 'Gần đây, tôi nhận được rất nhiều thư của thính giả.'
        },
        {
          start: 12.36,
          end: 15.12,
          en: 'Everyone is asking the same question.',
          zh: '大家都在问同一个问题。',
          pinyin: 'Dà jiā dōu zài wèn tóng yí gè wèn tí。',
          vi: 'Mọi người đều đang hỏi cùng một câu hỏi.'
        }
      ]
    },
    {
      id: 'ep-ps-zayf722opeq',
      youtubeId: 'zaYF722OPEQ',
      level: 'HSK 1+',
      levelGroup: 'hsk1-2',
      title: 'Đoạn văn nói về lợi ích của nước bằng TIẾNG TRUNG - HSK 1',
      titleVi: 'Đoạn văn về lợi ích của nước',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 215,
      durationLabel: '3:35',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 18 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/zaYF722OPEQ.json',
      cuesCount: 18,
      cues: [
        {
          start: 25.38,
          end: 27.44,
          en: 'We use water to cook.',
          zh: '我们用水做菜。',
          pinyin: 'Wǒ men yòng shuǐ zuò cài。',
          vi: 'Chúng ta dùng nước để nấu ăn.'
        },
        {
          start: 33.04,
          end: 35.48,
          en: 'We use water to take a bath.',
          zh: '我们用水洗澡。',
          pinyin: 'Wǒ men yòng shuǐ xǐ zǎo。',
          vi: 'Chúng ta dùng nước để tắm.'
        },
        {
          start: 40.36,
          end: 44.42,
          en: 'We use water to wash dishes.',
          zh: '我们用水洗碗。',
          pinyin: 'Wǒ men yòng shuǐ xǐ wǎn。',
          vi: 'Chúng ta dùng nước để rửa bát.'
        }
      ]
    },
    {
      id: 'ep-ps-zk4rmwvyjbe',
      youtubeId: 'zk4RmWVYjbE',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'Luyện nghe TIẾNG TRUNG thụ động【VIDEO #13】Chủ đề thể thao',
      titleVi: 'Luyện nghe tiếng Trung thụ động – Chủ đề thể thao',
      channel: 'Panda Studio',
      channelName: 'Panda Studio',
      channelHandle: '@PandaStudio24',
      channelId: 'UCnXr9o-f4MXHdgq_QN3QFiw',
      channelUrl: 'https://www.youtube.com/@PandaStudio24',
      durationSec: 181,
      durationLabel: '3:01',
      topic: 'Luyện nghe Panda Studio',
      note: 'Trọn bộ 36 câu với 4 lớp Hán · Pinyin · Việt · Anh.',
      cuesUrl: 'content/podcast/cues/zk4RmWVYjbE.json',
      cuesCount: 36,
      cues: [
        {
          start: 30,
          end: 36.16,
          en: 'can; know how to',
          zh: '会',
          pinyin: 'Huì',
          vi: 'biết; có thể'
        },
        {
          start: 39.24,
          end: 39.92,
          en: 'to swim; swimming',
          zh: '游泳',
          pinyin: 'Yóu yǒng',
          vi: 'bơi; bơi lội'
        },
        {
          start: 42.82,
          end: 43.17,
          en: 'particle (possessive/nominalizer)',
          zh: '的',
          pinyin: 'De',
          vi: 'trợ từ (của / danh từ hóa)'
        }
      ]
    },
    {
      id: 'ep-bb-hsk1-reflex-quiz',
      youtubeId: 'eJmpTntAZco',
      level: 'HSK 1',
      levelGroup: 'hsk1-2',
      title: 'HSK 1 快问快答！| HSK 1 Reflex Test: Can You Score 35/35? | Chinese Quiz',
      titleVi: 'HSK 1 Phản xạ nhanh: Bạn có đạt 35/35 câu không? (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 808,
      durationLabel: '13:28',
      topic: 'Kiểm tra phản xạ HSK 1',
      note: 'Trọn bộ 88 câu hỏi đáp phản xạ HSK 1 với 4 lớp Hán · Pinyin · Việt · Anh.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/eJmpTntAZco.json',
      cuesCount: 88,
      cues: [
        {
          start: 5.96,
          end: 7.68,
          en: 'Hello, dear friends!',
          zh: '大家好，亲爱的宝贝们！',
          pinyin: 'Dàjiā hǎo, qīn\'ài de bǎobèi men!',
          vi: 'Xin chào mọi người, các Bảo Bối thân mến!'
        },
        {
          start: 8.01,
          end: 11.36,
          en: 'Welcome back to BaoBao Mandarin. I\'m Xiaoyue! I\'m Xiaoming!',
          zh: '欢迎回到宝宝中文，我是小月！我是小明！',
          pinyin: 'Huānyíng huí dào Bǎobǎo Zhōngwén, wǒ shì Xiǎoyuè! Wǒ shì Xiǎomíng!',
          vi: 'Chào mừng các bạn quay lại với BaoBao Mandarin, mình là Tiểu Nguyệt! Mình là Tiểu Minh!'
        }
      ]
    },
    {
      id: 'ep-bb-hsk13-think-in-chinese',
      youtubeId: 'vmsC3SgWTPs',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1–3 | 怎么开始用中文思考？| How to Start Thinking in Chinese | Chinese Listening Podcast',
      titleVi: 'Làm sao bắt đầu tư duy trực tiếp bằng tiếng Trung? (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 1533,
      durationLabel: '25:33',
      topic: 'Tư duy ngôn ngữ',
      note: 'Trọn bộ 580 câu hội thoại HSK 1–3 hướng dẫn cách suy nghĩ bằng tiếng Trung (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/vmsC3SgWTPs.json',
      cuesCount: 580,
      cues: [
        {
          start: 7.1,
          end: 9.1,
          en: 'Welcome to BaoBao Mandarin, everyone.',
          zh: '欢迎大家来到 BaoBao Mandarin。',
          pinyin: 'Huānyíng dàjiā láidào BaoBao Mandarin.',
          vi: 'Chào mừng mọi người đến với BaoBao Mandarin.'
        },
        {
          start: 9.13,
          end: 10.3,
          en: 'I\'m Xiaoming.',
          zh: '我是小明。',
          pinyin: 'Wǒ shì Xiǎomíng.',
          vi: 'Mình là Tiểu Minh.'
        },
        {
          start: 10.73,
          end: 11.73,
          en: 'I\'m Xiaoyue.',
          zh: '我是小月。',
          pinyin: 'Wǒ shì Xiǎoyuè.',
          vi: 'Mình là Tiểu Nguyệt.'
        }
      ]
    },
    {
      id: 'ep-bb-hsk13-money-happiness',
      youtubeId: 'uPNoMz5-zY8',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1–3 | 你这么累，只是为了钱吗？| More Money = More Happiness? | Chinese Listening Podcast',
      titleVi: 'Bạn mệt mỏi thế này chỉ vì tiền thôi sao? Tiền và Hạnh phúc (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 1029,
      durationLabel: '17:09',
      topic: 'Đời sống & giá trị',
      note: 'Trọn bộ 245 câu hội thoại HSK 1–3 bàn về áp lực kiếm tiền và hạnh phúc (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/uPNoMz5-zY8.json',
      cuesCount: 245,
      cues: [
        {
          start: 6.87,
          end: 10.4,
          en: 'Hello, everyone! Welcome to BaoBao Mandarin! I\'m Xiaoyue.',
          zh: '大家好，欢迎来到 BaoBao Mandarin！我是小月。',
          pinyin: 'Dàjiā hǎo, huānyíng láidào BaoBao Mandarin! Wǒ shì Xiǎoyuè.',
          vi: 'Chào mọi người, chào mừng đến với BaoBao Mandarin! Mình là Tiểu Nguyệt.'
        },
        {
          start: 10.4,
          end: 12.83,
          en: 'I\'m Xiaoming! Here we are again today!',
          zh: '我是小明！今天又见面啦～',
          pinyin: 'Wǒ shì Xiǎomíng! Jīntiān yòu jiànmiàn la～',
          vi: 'Mình là Tiểu Minh! Hôm nay lại được gặp mọi người rồi～'
        }
      ]
    },
    {
      id: 'ep-bb-hsk3-self-intro',
      youtubeId: '30Jl7M3uLdQ',
      level: 'HSK 2+',
      levelGroup: 'hsk3',
      title: 'HSK 2+ | 自我介绍 | Tell Me About Yourself in Chinese | Chinese Listening Podcast',
      titleVi: 'Cách giới thiệu bản thân tự nhiên bằng tiếng Trung (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 983,
      durationLabel: '16:23',
      topic: 'Giao tiếp & công việc',
      note: 'Trọn bộ 270 câu hội thoại HSK 2+ thực hành giới thiệu bản thân khi gặp khách hàng (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/30Jl7M3uLdQ.json',
      cuesCount: 270,
      cues: [
        {
          start: 6.2,
          end: 10.2,
          en: 'No, no… it still sounds so strange…',
          zh: '不行不行…还是听起来很奇怪啊…',
          pinyin: 'Bù xíng bù xíng… háishi tīng qǐlái hěn qíguài a…',
          vi: 'Không được, không được… nghe vẫn kỳ quá…'
        },
        {
          start: 10.2,
          end: 13.47,
          en: 'What are you doing? Why have you repeated that sentence so many times?',
          zh: '你在干什么呢？一句话说了这么多遍？',
          pinyin: 'Nǐ zài gàn shénme ne? Yī jù huà shuō le zhème duō biàn?',
          vi: 'Bạn đang làm gì thế? Sao cứ nói đi nói lại một câu vậy?'
        }
      ]
    },
    {
      id: 'ep-bb-hsk3-remember-hanzi',
      youtubeId: 'Cy3leBZQOpY',
      level: 'HSK 2+',
      levelGroup: 'hsk3',
      title: 'HSK 2+ | 汉字没那么难！ | How to Easily Remember Chinese Characters | Chinese Listening Podcast',
      titleVi: 'Chữ Hán không khó thế đâu: Cách ghi nhớ chữ Hán hiệu quả (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 1131,
      durationLabel: '18:51',
      topic: 'Chữ Hán & mẹo nhớ',
      note: 'Trọn bộ 266 câu chia sẻ phương pháp học và nhớ chữ Hán lâu quên (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/Cy3leBZQOpY.json',
      cuesCount: 266,
      cues: [
        {
          start: 6.2,
          end: 8.03,
          en: 'How can we remember Chinese characters?',
          zh: '怎么才能记住汉字？',
          pinyin: 'Zěnme cái néng jìzhù Hànzì?',
          vi: 'Làm thế nào mới có thể nhớ được chữ Hán?'
        },
        {
          start: 8.03,
          end: 11.5,
          en: 'How many Chinese characters do you actually need to learn to get by?',
          zh: '到底要学多少汉字才够用？',
          pinyin: 'Dàodǐ yào xué duōshao Hànzì cái gòu yòng?',
          vi: 'Rốt cuộc phải học bao nhiêu chữ Hán mới đủ dùng?'
        }
      ]
    },
    {
      id: 'ep-bb-hsk3-chigua-culture',
      youtubeId: 'eBTWbtbOlPM',
      level: 'HSK 2+',
      levelGroup: 'hsk3',
      title: 'HSK 2+ | 什么是“吃瓜”？ | Chinese "Eating Melon" Culture | Chinese Listening Podcast',
      titleVi: 'Văn hóa “ăn dưa” (吃瓜) trên mạng xã hội Trung Quốc là gì? (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 953,
      durationLabel: '15:53',
      topic: 'Tiếng lóng & mạng xã hội',
      note: 'Trọn bộ 210 câu giải thích từ lóng 吃瓜 (hóng chuyện) rất phổ biến ở Trung Quốc (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/eBTWbtbOlPM.json',
      cuesCount: 210,
      cues: [
        {
          start: 6.7,
          end: 12.53,
          en: 'Hi everyone, my darlings! Another week has gone by, and we\'re meeting again!',
          zh: '大家好，宝贝们！又一个星期过去了，我们又见面了！',
          pinyin: 'Dàjiā hǎo, bǎobèimen! Yòu yí ge xīngqī guòqù le, wǒmen yòu jiànmiàn le!',
          vi: 'Xin chào các Bảo Bối! Lại một tuần nữa trôi qua, chúng ta lại gặp nhau rồi!'
        },
        {
          start: 12.53,
          end: 18.07,
          en: 'Hi everyone! I\'m Xiaoming. Something really interesting happened last week,',
          zh: '大家好！我是小明。上个星期有一件很有意思的事，',
          pinyin: 'Dàjiā hǎo! Wǒ shì Xiǎomíng. Shàng ge xīngqī yǒu yí jiàn hěn yǒu yìsi de shì,',
          vi: 'Chào mọi người! Mình là Tiểu Minh. Tuần trước có một chuyện rất thú vị,'
        }
      ]
    },
    {
      id: 'ep-bb-hsk3-procrastination',
      youtubeId: 'Y_qGrTUK2Js',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'If You\'re Ambitious But LAZY, Watch This! | 为什么总是拖延？| Chinese Listening Podcast',
      titleVi: 'Tại sao chúng ta luôn trì hoãn dù rất có tham vọng? (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 930,
      durationLabel: '15:30',
      topic: 'Tâm lý & thói quen',
      note: 'Trọn bộ 267 câu bàn về tâm lý trì hoãn khi học tiếng Trung và cách vượt qua (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/Y_qGrTUK2Js.json',
      cuesCount: 267,
      cues: [
        {
          start: 6.47,
          end: 9.7,
          en: 'At the start of this year, did you set lots of goals',
          zh: '今年年初，你是不是定了很多目标',
          pinyin: 'Jīnnián niánchū, nǐ shì bu shì dìng le hěn duō mùbiāo',
          vi: 'Đầu năm nay, có phải bạn đã đặt ra rất nhiều mục tiêu'
        },
        {
          start: 9.7,
          end: 11.97,
          en: 'and set off full of confidence?',
          zh: '充满信心地出发？',
          pinyin: 'Chōngmǎn xìnxīn de chūfā?',
          vi: 'và bắt đầu đầy tự tin không?'
        }
      ]
    },
    {
      id: 'ep-bb-hsk34-love-change',
      youtubeId: '_BjHpiON95A',
      level: 'HSK 3–4',
      levelGroup: 'hsk3',
      title: 'HSK 3–4 | 爱一个人会改变你吗？| Will Loving Someone Change You? | Chinese Listening Podcast',
      titleVi: 'Yêu một người có làm bạn thay đổi không? (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 1510,
      durationLabel: '25:10',
      topic: 'Tình cảm & trưởng thành',
      note: 'Trọn bộ 344 câu trò chuyện sâu sắc HSK 3–4 về tình yêu và sự thay đổi của bản thân (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/_BjHpiON95A.json',
      cuesCount: 344,
      cues: [
        {
          start: 6.87,
          end: 10.4,
          en: 'Hello everyone, welcome to BaoBao Mandarin. I’m A-Qing.',
          zh: '大家好，欢迎来到 BaoBao Mandarin。我是阿青。',
          pinyin: 'Dàjiā hǎo, huānyíng láidào BaoBao Mandarin. Wǒ shì Ā Qīng.',
          vi: 'Xin chào mọi người, chào mừng đến với BaoBao Mandarin. Mình là A-Qing.'
        },
        {
          start: 10.4,
          end: 12.47,
          en: 'Hello everyone, I’m Xiaohua!',
          zh: '大家好，我是小花！',
          pinyin: 'Dàjiā hǎo, wǒ shì Xiǎohuā!',
          vi: 'Xin chào mọi người, mình là Tiểu Hoa!'
        }
      ]
    },
    {
      id: 'ep-cdp-hsk34-quit-learning',
      youtubeId: 'UKUY_0HSRE8',
      level: 'HSK 3–4',
      levelGroup: 'hsk3',
      title: '为什么学中文越坚持越想放弃？ | Why You Want to Quit Learning Chinese | Chinese Daily Podcast',
      titleVi: 'Vì sao càng kiên trì học tiếng Trung càng dễ muốn bỏ cuộc? (Chinese Daily Podcast)',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1004,
      durationLabel: '16:44',
      topic: 'Động lực học tập',
      note: 'Tập mẫu từ kênh @ChineseDailyPodcast với trọn bộ 353 câu script 4 lớp Hán · Pinyin · Việt · Anh đồng bộ.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/UKUY_0HSRE8.json',
      cuesCount: 353,
      cues: [
        {
          start: 6.4,
          end: 8.19,
          en: 'Li Ming,',
          zh: '李明，',
          pinyin: 'Lǐ Míng,',
          vi: 'Lý Minh này,'
        },
        {
          start: 8.2,
          end: 11.46,
          en: 'Why do you think people are always like this? When I start something,',
          zh: '你说人为什么总是这样？一件事情',
          pinyin: 'Nǐ shuō rén wèishénme zǒngshì zhèyàng? Yī jiàn shìqing',
          vi: 'Cậu nghĩ vì sao con người lúc nào cũng thế nhỉ? Khi làm một việc gì đó,'
        },
        {
          start: 11.47,
          end: 14.79,
          en: 'at first, I feel like a genius,',
          zh: '刚开始的时候，我觉得自己像个天才，',
          pinyin: 'Gāng kāishǐ de shíhou, wǒ juéde zìjǐ xiàng ge tiāncái,',
          vi: 'lúc mới bắt đầu, mình thấy bản thân như một thiên tài,'
        }
      ]
    },
    {
      id: 'ep-bb-hsk24-ai-chinese',
      youtubeId: 'oLO78Z3mlww',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2–4 | AI这么厉害了，还要学中文吗？| AI Is Here, Should You Still Learn Chinese? | Chinese Listening Podcast',
      titleVi: 'AI giỏi vậy rồi, có cần học tiếng Trung nữa không? (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 698,
      durationLabel: '11:38',
      topic: 'Công nghệ & học tập',
      note: 'Trọn bộ 156 câu tranh luận gần gũi về AI và giá trị của việc tự học tiếng Trung (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/oLO78Z3mlww.json',
      cuesCount: 156,
      cues: [
        {
          start: 7.43,
          end: 9.87,
          en: 'Xiaoming, let me ask you a question.',
          zh: '小明，我问你一个问题吧。',
          pinyin: 'Xiǎo Míng, wǒ wèn nǐ yí ge wèntí ba.',
          vi: 'Này Tiểu Minh, mình hỏi bạn một câu nhé.'
        },
        {
          start: 9.87,
          end: 13.21,
          en: 'Last month, I needed to email a Chinese client,',
          zh: '上个月我需要给中国客户发一封邮件，',
          pinyin: 'Shàng ge yuè wǒ xūyào gěi Zhōngguó kèhù fā yì fēng yóujiàn,',
          vi: 'Tháng trước mình cần gửi email cho khách hàng Trung Quốc,'
        },
        {
          start: 13.22,
          end: 17.59,
          en: 'I didn\'t know how to write it, so I entered what I wanted to say into AI',
          zh: '我不会写，就把自己想说的话输入到AI里，',
          pinyin: 'Wǒ bú huì xiě, jiù bǎ zìjǐ xiǎng shuō de huà shūrù dào AI lǐ,',
          vi: 'mình không biết viết, cứ nhập những gì muốn nói vào AI'
        }
      ]
    },
    {
      id: 'ep-bb-hsk13-beach',
      youtubeId: 'AKMV7WoTq8U',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1–3 | 一起去海边吧！| Let\'s Go To The Beach!! | Chinese Listening Practice',
      titleVi: 'Cùng đi biển nào! (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 701,
      durationLabel: '11:41',
      topic: 'Du lịch & bạn bè',
      note: 'Trọn bộ 117 câu hội thoại HSK 1–3 về chuyến đi biển mùa hè cùng Tiểu Nguyệt, Tiểu Minh và Tiểu Hoa (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/AKMV7WoTq8U.json',
      cuesCount: 117,
      cues: [
        {
          start: 7.01,
          end: 16.47,
          en: 'Summer vacation is here! Today, Xiaoyue, Xiaoming, and Xiaohua are going to the beach together.',
          zh: '暑假到了！今天，小月、小明和小花要一起去海边。',
          pinyin: 'Shǔjià dào le! Jīntiān, Xiǎoyuè, Xiǎomíng hé Xiǎohuā yào yìqǐ qù hǎibiān.',
          vi: 'Kỳ nghỉ hè tới rồi! Hôm nay, Tiểu Nguyệt, Tiểu Minh và Tiểu Hoa sẽ cùng nhau đi biển.'
        },
        {
          start: 18.44,
          end: 27.1,
          en: 'Xiaoyue and Xiaoming have arrived at the bus stop, but Xiaohua still isn\'t here.',
          zh: '小月和小明已经到公交车站了，但是小花还没到。',
          pinyin: 'Xiǎoyuè hé Xiǎomíng yǐjīng dào gōngjiāo chēzhàn le, dànshì Xiǎohuā hái méi dào.',
          vi: 'Tiểu Nguyệt và Tiểu Minh đã đến trạm xe buýt, nhưng Tiểu Hoa vẫn chưa tới.'
        },
        {
          start: 28.87,
          end: 32.4,
          en: 'Xiaoming, what time is it now?',
          zh: '小明，现在几点了？',
          pinyin: 'Xiǎomíng, xiànzài jǐ diǎn le?',
          vi: 'Tiểu Minh, bây giờ mấy giờ rồi?'
        }
      ]
    },
    {
      id: 'ep-bb-hsk13-summer-vacation',
      youtubeId: 'kYWhcTKJiUA',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1–3 | 暑假怎么过？| How Should We Spend Summer Vacation? | Chinese Listening Podcast',
      titleVi: 'Nghỉ hè làm gì bây giờ? (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 964,
      durationLabel: '16:04',
      topic: 'Nghỉ hè & kế hoạch',
      note: 'Trọn bộ 203 câu hỏi đáp HSK 1–3 về kế hoạch nghỉ hè và thói quen hằng ngày (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/kYWhcTKJiUA.json',
      cuesCount: 203,
      cues: [
        {
          start: 6,
          end: 11,
          en: 'Hello everyone, welcome to BaoBao Mandarin. I\'m Xiaoming.',
          zh: '大家好，欢迎来到BaoBao Mandarin，我是小明。',
          pinyin: 'Dàjiā hǎo, huānyíng lái dào BaoBao Mandarin, wǒ shì Xiǎomíng.',
          vi: 'Xin chào mọi người, chào mừng các bạn đến với BaoBao Mandarin, mình là Tiểu Minh.'
        },
        {
          start: 11,
          end: 15,
          en: 'Hello everyone, I\'m Xiaoyue. I\'m so happy to see you all again~',
          zh: '大家好，我是小月，很高兴又见到大家~',
          pinyin: 'Dàjiā hǎo, wǒ shì Xiǎoyuè, hěn gāoxìng yòu jiàn dào dàjiā~',
          vi: 'Xin chào mọi người, mình là Tiểu Nguyệt, rất vui vì được gặp lại mọi người~'
        },
        {
          start: 15,
          end: 20,
          en: 'That\'s right, Xiaoyue, we\'re together again >v< You look very happy today.',
          zh: '没错，小月，我们又见面了 >v< 今天看起来很开心。',
          pinyin: 'Méi cuò, Xiǎoyuè, wǒmen yòu jiànmiàn le >v< Jīntiān kàn qǐlái hěn kāixīn.',
          vi: 'Đúng vậy, Tiểu Nguyệt, chúng ta lại gặp nhau rồi >v< Hôm nay trông cậu rất vui.'
        }
      ]
    },
    {
      id: 'ep-bb-hsk13-happy-birthday',
      youtubeId: 'im5yYaw240w',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1–3 | 小花，生日快乐！| Xiao Hua, Happy Birthday! | Chinese Listening Practice',
      titleVi: 'Tiểu Hoa, chúc mừng sinh nhật! (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 651,
      durationLabel: '10:51',
      topic: 'Sinh nhật & đời sống',
      note: 'Trọn bộ 106 câu câu chuyện sinh nhật 16 tuổi của Tiểu Hoa (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/im5yYaw240w.json',
      cuesCount: 106,
      cues: [
        {
          start: 6.84,
          end: 11.89,
          en: 'This morning, Xiao Hua got up very early.',
          zh: '今天早上，小花起得很早。',
          pinyin: 'Jīntiān zǎoshang, Xiǎohuā qǐ de hěn zǎo.',
          vi: 'Sáng nay, Tiểu Hoa dậy rất sớm.'
        },
        {
          start: 12.33,
          end: 19.07,
          en: 'She looked at the calendar on the table. Today was her birthday.',
          zh: '她看了看桌上的日历，今天是她的生日。',
          pinyin: 'Tā kàn le kàn zhuō shàng de rìlì, jīntiān shì tā de shēngrì.',
          vi: 'Cô bé nhìn tờ lịch trên bàn, hôm nay là sinh nhật của cô.'
        },
        {
          start: 20.46,
          end: 25,
          en: 'Today is my birthday. I’m sixteen already!!',
          zh: '今天是我的生日，我已经十六岁了！！',
          pinyin: 'Jīntiān shì wǒ de shēngrì, wǒ yǐjīng shíliù suì le!!',
          vi: 'Hôm nay là sinh nhật của mình, mình 16 tuổi rồi!!'
        }
      ]
    },
    {
      id: 'ep-bb-hsk23-chaotic-morning',
      youtubeId: 'XAdrKDfM3i4',
      level: 'HSK 2–3',
      levelGroup: 'hsk3',
      title: 'HSK 2–3 | 慌乱的早上 | A Chaotic Morning | Chinese Listening Practice',
      titleVi: 'Một buổi sáng luống cuống (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 395,
      durationLabel: '6:35',
      topic: 'Thói quen buổi sáng',
      note: 'Trọn bộ 62 câu kể chuyện buổi sáng dậy muộn của Tiểu Nguyệt, ngắn gọn dễ nghe cho HSK 2–3 (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/XAdrKDfM3i4.json',
      cuesCount: 62,
      cues: [
        {
          start: 7.28,
          end: 10.22,
          en: 'In the morning, sunlight shone into the room.',
          zh: '早上，阳光照进了房间。',
          pinyin: 'Zǎoshang, yángguāng zhào jìn le fángjiān.',
          vi: 'Buổi sáng, ánh nắng chiếu vào phòng.'
        },
        {
          start: 11.19,
          end: 17.45,
          en: 'Xiaoyue slowly opened her eyes and felt she had slept very comfortably.',
          zh: '小月慢慢睁开眼睛，觉得自己睡得特别舒服。',
          pinyin: 'Xiǎo Yuè mànmàn zhēngkāi yǎnjing, juéde zìjǐ shuì de tèbié shūfu.',
          vi: 'Tiểu Nguyệt từ từ mở mắt, cô ấy cảm thấy mình đã ngủ rất thoải mái.'
        },
        {
          start: 18.78,
          end: 22.82,
          en: 'Suddenly, she felt that something was not right.',
          zh: '突然，她觉得有点儿不对劲。',
          pinyin: 'Tūrán, tā juéde yǒudiǎnr bú duìjìn.',
          vi: 'Đột nhiên, cô ấy cảm thấy có chút không đúng.'
        }
      ]
    },
    {
      id: 'ep-bb-hsk12-boba-tea',
      youtubeId: 's3FOHOdUi9M',
      level: 'HSK 1–2',
      levelGroup: 'hsk1-2',
      title: 'HSK 1–2 | 星期天的奶茶 | Sunday\'s Boba Tea | Chinese Listening Practice',
      titleVi: 'Ly trà sữa ngày Chủ nhật (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 574,
      durationLabel: '9:34',
      topic: 'Đời sống & ẩm thực',
      note: 'Trọn bộ 84 câu chuyện HSK 1–2 dễ thương về ngày Chủ nhật nóng nực và ly trà sữa (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/s3FOHOdUi9M.json',
      cuesCount: 84,
      cues: [
        {
          start: 6.28,
          end: 11.07,
          en: 'Today is Sunday, and the weather is very hot.',
          zh: '今天是星期天，天气非常热。',
          pinyin: 'Jīntiān shì xīngqītiān, tiānqì fēicháng rè.',
          vi: 'Hôm nay là Chủ nhật, thời tiết vô cùng nóng.'
        },
        {
          start: 13.21,
          end: 17.89,
          en: 'Today is Sunday, and the weather is very hot.',
          zh: '今天是星期天，天气非常热。',
          pinyin: 'Jīntiān shì xīngqītiān, tiānqì fēicháng rè.',
          vi: 'Hôm nay là Chủ nhật, thời tiết vô cùng nóng.'
        },
        {
          start: 20.77,
          end: 28.1,
          en: 'Xiaoming is studying at home. He feels too hot and doesn\'t want to read anymore.',
          zh: '小明正在家里学习。他觉得太热了，不想再看书了。',
          pinyin: 'Xiǎo Míng zhèngzài jiā lǐ xuéxí. Tā juéde tài rè le, bù xiǎng zài kàn shū le.',
          vi: 'Tiểu Minh đang học bài ở nhà. Cậu ấy cảm thấy nóng quá, không muốn đọc sách nữa.'
        }
      ]
    },
    {
      id: 'ep-bb-hsk13-city-vs-countryside',
      youtubeId: '3FDJ_HCa6mg',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1–3 | 城市生活还是农村生活？| City Life VS Countryside Life? | Chinese Listening Podcast',
      titleVi: 'Sống ở thành phố hay nông thôn? (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 544,
      durationLabel: '9:04',
      topic: 'Thành thị & nông thôn',
      note: 'Trọn bộ 128 câu hội thoại HSK 1–3 so sánh cuộc sống thành phố và vùng quê yên bình (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/3FDJ_HCa6mg.json',
      cuesCount: 128,
      cues: [
        {
          start: 6.92,
          end: 10.47,
          en: 'Hello everyone, welcome to BaoBao Mandarin! I’m Xiaoyue.',
          zh: '大家好，欢迎来到BaoBao Mandarin！我是小月。',
          pinyin: 'Dàjiā hǎo, huānyíng láidào BaoBao Mandarin! Wǒ shì Xiǎoyuè.',
          vi: 'Chào mọi người, chào mừng đến với BaoBao Mandarin! Mình là Tiểu Nguyệt.'
        },
        {
          start: 10.75,
          end: 12.75,
          en: 'Hello everyone, I’m Xiaoming!',
          zh: '大家好，我是小明！',
          pinyin: 'Dàjiā hǎo, wǒ shì Xiǎomíng!',
          vi: 'Chào mọi người, mình là Tiểu Minh!'
        },
        {
          start: 13.47,
          end: 17.89,
          en: 'Xiaoming, you look really happy today. What’s going on?',
          zh: '小明，你今天看起来很开心，怎么了？',
          pinyin: 'Xiǎomíng, nǐ jīntiān kàn qǐlái hěn kāixīn, zěnme le?',
          vi: 'Tiểu Minh, hôm nay trông cậu vui lắm, có chuyện gì vậy?'
        }
      ]
    },
    {
      id: 'ep-bb-hsk24-cowherd-weaver-girl',
      youtubeId: 'QInUMEyKxdA',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '牛郎织女 | A Love Across the Milky Way | Chinese Folk Story for Bedtime',
      titleVi: 'Sự tích Ngưu Lang Chức Nữ (BaoBao Mandarin)',
      channel: 'BaoBao Mandarin',
      channelName: 'BaoBao Mandarin',
      channelHandle: '@BaoBaoMandarin',
      channelId: 'UCYHKAec4JjyR_DC2obXv1Yg',
      channelUrl: 'https://www.youtube.com/@BaoBaoMandarin',
      durationSec: 1360,
      durationLabel: '22:40',
      topic: 'Truyện dân gian',
      note: 'Trọn bộ 311 câu kể chuyện cổ tích Ngưu Lang Chức Nữ trước giờ đi ngủ (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/QInUMEyKxdA.json',
      cuesCount: 311,
      cues: [
        {
          start: 6.87,
          end: 10.8,
          en: 'Hello everyone, welcome to BaoBao Mandarin! I’m Xiǎoyuè.',
          zh: '大家好，欢迎来到 BaoBao Mandarin！我是小月。',
          pinyin: 'Dàjiā hǎo, huānyíng lái dào BaoBao Mandarin! Wǒ shì Xiǎoyuè.',
          vi: 'Xin chào mọi người, chào mừng đến với BaoBao Mandarin! Mình là Tiểu Nguyệt.'
        },
        {
          start: 10.8,
          end: 15.27,
          en: 'Hello everyone, I’m Xiǎomíng! It’s great to see you again.',
          zh: '大家好，我是小明！很高兴又见到大家。',
          pinyin: 'Dàjiā hǎo, wǒ shì Xiǎomíng! Hěn gāoxìng yòu jiàn dào dàjiā.',
          vi: 'Xin chào mọi người, mình là Tiểu Minh! Rất vui lại được gặp mọi người.'
        },
        {
          start: 15.27,
          end: 20.3,
          en: 'Starting today, BaoBao Mandarin is launching a new storytelling series.',
          zh: '从今天开始，BaoBao Mandarin要推出一个新的故事系列。',
          pinyin: 'Cóng jīntiān kāishǐ, BaoBao Mandarin yào tuīchū yí ge xīn de gùshi xìliè.',
          vi: 'Bắt đầu từ hôm nay, BaoBao Mandarin sẽ ra mắt một series kể chuyện mới.'
        }
      ]
    },
    {
      id: 'ep-lctp-hsk24-calm-bad-luck',
      youtubeId: 'OnXbndDA7I4',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2 - 4 | How Chinese People Stay Calm in Bad Luck (Worth Knowing) | Chinese Listening Practice',
      titleVi: 'Người Trung Quốc giữ bình tĩnh thế nào khi gặp chuyện xui rủi? (LCTP)',
      channel: 'Learn Chinese Through Podcast',
      channelName: 'Learn Chinese Through Podcast',
      channelHandle: '@LearnChineseThroughPodcast',
      channelId: 'UCI8Liuxdz6UPv5rgMskfwPg',
      channelUrl: 'https://www.youtube.com/@LearnChineseThroughPodcast',
      durationSec: 1489,
      durationLabel: '24:49',
      topic: 'Tư duy & văn hóa',
      note: 'Trọn bộ 678 câu đối thoại giữa Tử Hiên & Vũ Đồng về thái độ sống bình tĩnh (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/OnXbndDA7I4.json',
      cuesCount: 678,
      cues: [
        {
          start: 6.11,
          end: 6.71,
          en: 'Yutong,',
          zh: '雨桐，',
          pinyin: 'Yǔtóng,',
          vi: 'Vũ Đồng,'
        },
        {
          start: 6.71,
          end: 9.85,
          en: 'You look to be in a really good mood this morning,',
          zh: '今天早上你的心情看起来真不错，',
          pinyin: 'Jīntiān zǎoshang nǐ de xīnqíng kàn qǐlái zhēn búcuò,',
          vi: 'Sáng nay trông tâm trạng của cậu thật vui vẻ,'
        },
        {
          start: 9.87,
          end: 12.25,
          en: 'and you even smiled as you poured me hot tea.',
          zh: '还笑眯眯地给我倒热茶。',
          pinyin: 'Hái xiàomīmī de gěi wǒ dào rè chá.',
          vi: 'lại còn mỉm cười rót trà nóng cho tớ nữa.'
        }
      ]
    },
    {
      id: 'ep-lctp-hsk24-mapo-tofu',
      youtubeId: 'RjvcxwnO8EU',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2 - 4 | How Mapo Tofu Creates Seven Flavors | Learn Chinese Through Food',
      titleVi: 'Đậu phụ Ma Bà và 7 tầng hương vị (Learn Chinese Through Podcast)',
      channel: 'Learn Chinese Through Podcast',
      channelName: 'Learn Chinese Through Podcast',
      channelHandle: '@LearnChineseThroughPodcast',
      channelId: 'UCI8Liuxdz6UPv5rgMskfwPg',
      channelUrl: 'https://www.youtube.com/@LearnChineseThroughPodcast',
      durationSec: 727,
      durationLabel: '12:07',
      topic: 'Ẩm thực Tứ Xuyên',
      note: 'Trọn bộ 297 câu kể chuyện món Đậu phụ Ma Bà Tứ Xuyên, từ vựng vị giác & nấu ăn HSK 2–4 (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/RjvcxwnO8EU.json',
      cuesCount: 297,
      cues: [
        {
          start: 6.78,
          end: 9.67,
          en: 'Have you ever encountered this situation?',
          zh: '你有没有遇到过这种情况？',
          pinyin: 'nǐ yǒu méi yǒu yùdào guo zhè zhǒng qíngkuàng?',
          vi: 'Bạn đã bao giờ gặp tình huống này chưa?'
        },
        {
          start: 9.81,
          end: 12.27,
          en: 'A plate of tofu has just been brought to the table,',
          zh: '一盘豆腐刚端上桌，',
          pinyin: 'yì pán dòufu gāng duān shàng zhuō,',
          vi: 'Một đĩa đậu phụ vừa được bưng lên bàn,'
        },
        {
          start: 12.33,
          end: 13.65,
          en: 'glistening red,',
          zh: '红得发亮，',
          pinyin: 'hóng de fāliàng,',
          vi: 'đỏ bóng lên,'
        }
      ]
    },
    {
      id: 'ep-lctp-hsk24-ancient-wall-sunset',
      youtubeId: 'McIKMPc-QhY',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2 - 4 | Sunset on the Ancient Wall  | Learn Chinese Through a Beautiful City Walk',
      titleVi: 'Hoàng hôn trên tường thành cổ — City Walk học tiếng Trung (LCTP)',
      channel: 'Learn Chinese Through Podcast',
      channelName: 'Learn Chinese Through Podcast',
      channelHandle: '@LearnChineseThroughPodcast',
      channelId: 'UCI8Liuxdz6UPv5rgMskfwPg',
      channelUrl: 'https://www.youtube.com/@LearnChineseThroughPodcast',
      durationSec: 727,
      durationLabel: '12:07',
      topic: 'Du lịch & dạo phố',
      note: 'Trọn bộ 296 câu mô tả chuyến dạo bộ ngắm hoàng hôn trên tường thành cổ (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/McIKMPc-QhY.json',
      cuesCount: 296,
      cues: [
        {
          start: 6.27,
          end: 8.65,
          en: 'Have you ever seen a sunset like this?',
          zh: '你有没有看过这样的夕阳？',
          pinyin: 'Nǐ yǒu méiyǒu kàn guo zhèyàng de xīyáng?',
          vi: 'Bạn đã bao giờ ngắm hoàng hôn như thế này chưa?'
        },
        {
          start: 8.87,
          end: 11.41,
          en: 'The sun hasn\'t completely set yet,',
          zh: '太阳还没有完全落下，',
          pinyin: 'Tàiyáng hái méiyǒu wánquán luòxia,',
          vi: 'Mặt trời vẫn chưa hoàn toàn lặn xuống,'
        },
        {
          start: 11.47,
          end: 14.81,
          en: 'but the ancient city wall has already turned golden,',
          zh: '古老的城墙先变成了金色，',
          pinyin: 'Gǔlǎo de chéngqiáng xiān biàn chéng le jīnsè,',
          vi: 'nhưng những bức tường thành cổ đã chuyển sang màu vàng trước,'
        }
      ]
    },
    {
      id: 'ep-lctp-hsk24-truly-happy',
      youtubeId: 'RSgCb3MVgrw',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2 - 4 | What Makes a Person Truly Happy?  | Chinese Listening Practice',
      titleVi: 'Điều gì khiến một người thực sự hạnh phúc? (LCTP)',
      channel: 'Learn Chinese Through Podcast',
      channelName: 'Learn Chinese Through Podcast',
      channelHandle: '@LearnChineseThroughPodcast',
      channelId: 'UCI8Liuxdz6UPv5rgMskfwPg',
      channelUrl: 'https://www.youtube.com/@LearnChineseThroughPodcast',
      durationSec: 781,
      durationLabel: '13:01',
      topic: 'Hạnh phúc & nội tâm',
      note: 'Trọn bộ 338 câu chia sẻ nhẹ nhàng về niềm vui và hạnh phúc bền vững HSK 2–4 (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/RSgCb3MVgrw.json',
      cuesCount: 338,
      cues: [
        {
          start: 6.49,
          end: 8.29,
          en: 'Have you ever met someone like this…',
          zh: '你有没有见过这样的人……',
          pinyin: 'Nǐ yǒu méiyǒu jiàn guo zhèyàng de rén……',
          vi: 'Bạn đã từng gặp người như thế này chưa…'
        },
        {
          start: 8.29,
          end: 9.49,
          en: 'They are always smiling,',
          zh: '他总是笑，',
          pinyin: 'Tā zǒngshì xiào,',
          vi: 'Người đó lúc nào cũng cười,'
        },
        {
          start: 9.49,
          end: 11.79,
          en: 'and seem happy every day.',
          zh: '看起来每天都很开心。',
          pinyin: 'Kàn qǐlái měitiān dōu hěn kāixīn.',
          vi: 'trông như ngày nào cũng rất vui vẻ.'
        }
      ]
    },
    {
      id: 'ep-lctp-hsk12-exam-prep-p4',
      youtubeId: 'TiTXwdz45TQ',
      level: 'HSK 1–2',
      levelGroup: 'hsk1-2',
      title: 'HSK 1 - 2 Exam Preparation | Have you passed HSK 1 yet? - Come on over! P4',
      titleVi: 'Luyện nghe thi HSK 1–2 (Phần 4) — Tử Hiên & Vũ Đồng (LCTP)',
      channel: 'Learn Chinese Through Podcast',
      channelName: 'Learn Chinese Through Podcast',
      channelHandle: '@LearnChineseThroughPodcast',
      channelId: 'UCI8Liuxdz6UPv5rgMskfwPg',
      channelUrl: 'https://www.youtube.com/@LearnChineseThroughPodcast',
      durationSec: 437,
      durationLabel: '7:17',
      topic: 'Ôn thi HSK 1–2',
      note: 'Trọn bộ 164 câu luyện nghe mẫu câu thực chiến cho kỳ thi HSK 1–2 (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/TiTXwdz45TQ.json',
      cuesCount: 164,
      cues: [
        {
          start: 6.13,
          end: 7.48,
          en: 'Hello, I\'m Zixuan.',
          zh: '你好，我是子轩。',
          pinyin: 'Nǐ hǎo, wǒ shì Zǐxuān.',
          vi: 'Xin chào, tôi là Tử Hiên.'
        },
        {
          start: 8.29,
          end: 10.23,
          en: 'Today we listen to Chinese.',
          zh: '今天我们听汉语。',
          pinyin: 'Jīntiān wǒmen tīng Hànyǔ.',
          vi: 'Hôm nay chúng ta nghe tiếng Trung.'
        },
        {
          start: 10.69,
          end: 12.75,
          en: 'Hello, I\'m Yutong.',
          zh: '你好，我是雨桐。',
          pinyin: 'Nǐ hǎo, wǒ shì Yǔtóng.',
          vi: 'Xin chào, tôi là Vũ Đồng.'
        }
      ]
    },
    {
      id: 'ep-lctp-hsk24-remember-words',
      youtubeId: 'PTHiyUpf1d8',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2 - 4 | Learn Chinese Smarter: Remember New Words for Longer | Chinese Listening Practice',
      titleVi: 'Mẹo học từ vựng tiếng Trung nhớ lâu hơn (LCTP)',
      channel: 'Learn Chinese Through Podcast',
      channelName: 'Learn Chinese Through Podcast',
      channelHandle: '@LearnChineseThroughPodcast',
      channelId: 'UCI8Liuxdz6UPv5rgMskfwPg',
      channelUrl: 'https://www.youtube.com/@LearnChineseThroughPodcast',
      durationSec: 702,
      durationLabel: '11:42',
      topic: 'Phương pháp nhớ từ vựng',
      note: 'Trọn bộ 313 câu chia sẻ phương pháp ghi nhớ từ mới tiếng Trung lâu hơn (4 lớp Hán · Pinyin · Việt · Anh).',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/PTHiyUpf1d8.json',
      cuesCount: 313,
      cues: [
        {
          start: 6.25,
          end: 8.19,
          en: 'Have you ever had this feeling:',
          zh: '你有没有过这种感觉：',
          pinyin: 'Nǐ yǒu méiyǒu guò zhè zhǒng gǎnjué:',
          vi: 'Bạn đã bao giờ có cảm giác thế này chưa:'
        },
        {
          start: 8.25,
          end: 10.65,
          en: 'Yesterday you memorized fifty new words,',
          zh: '昨天背了五十个新词，',
          pinyin: 'Zuótiān bèi le wǔshí ge xīn cí,',
          vi: 'Hôm qua học thuộc năm mươi từ mới,'
        },
        {
          start: 10.65,
          end: 13.45,
          en: 'but today it feels as if you’re seeing them for the first time?',
          zh: '今天却好像第一次见到它们？',
          pinyin: 'Jīntiān què hǎoxiàng dì yī cì jiàn dào tāmen?',
          vi: 'mà hôm nay lại cứ như lần đầu tiên nhìn thấy chúng?'
        }
      ]
    },
    {
      id: "ep-lctp-extra-btc3DJx5eO8",
      youtubeId: "btc3DJx5eO8",
      level: "HSK 2–4",
      levelGroup: "hsk3",
      title: "HSK 2 - 4 | What Does Being Poor Say About You? | Chinese Listening Practice",
      titleVi: "Nghèo khó nói lên điều gì về bạn?",
      channel: "Learn Chinese Through Podcast",
      channelName: "Learn Chinese Through Podcast",
      channelHandle: "@LearnChineseThroughPodcast",
      channelId: "UCI8Liuxdz6UPv5rgMskfwPg",
      channelUrl: "https://www.youtube.com/@LearnChineseThroughPodcast",
      durationSec: 662,
      durationLabel: "11:02",
      topic: "Luyện nghe tiếng Trung",
      note: "Phụ đề theo timestamp nguồn với bốn lớp Hán · Pinyin · Việt · Anh.",
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: "content/podcast/cues/btc3DJx5eO8.json",
      cuesCount: 266,
      cues: [
        {
          start: 6.29,
          end: 8.35,
          en: "Hello, I'm Li Ming.",
          zh: "您好，我是李明。",
          pinyin: "Nín hǎo， wǒ shì Lǐ Míng。",
          vi: "Chào mọi người, tôi là Li Ming."
        },
        {
          start: 8.53,
          end: 12.47,
          en: "Welcome to `The Daily Podcast of Mandarin'.",
          zh: "欢迎收听……“普通话每日播客”。",
          pinyin: "Huān yíng shōu tīng ……“ pǔ tōng huà měi rì bō kè ”。",
          vi: "Chào mừng đến với… \"Podcast tiếng Hoa hàng ngày\"."
        },
        {
          start: 12.97,
          end: 15.85,
          en: "I'd like to ask you one today.",
          zh: "小宇，今天我想问你一个",
          pinyin: "Xiǎoyǔ， jīn tiān wǒ xiǎng wèn nǐ yí gè",
          vi: "Xiaoyu, hôm nay tôi muốn hỏi các bạn một"
        }
      ]
    },
    {
      id: "ep-lctp-extra-fDT6wh9y8es",
      youtubeId: "fDT6wh9y8es",
      level: "HSK 3+",
      levelGroup: "hsk3",
      title: "HSK 3 - 4 | The Cup of Patience | Chinese Listening Practice",
      titleVi: "Tách trà và bài học về lòng kiên nhẫn",
      channel: "Learn Chinese Through Podcast",
      channelName: "Learn Chinese Through Podcast",
      channelHandle: "@LearnChineseThroughPodcast",
      channelId: "UCI8Liuxdz6UPv5rgMskfwPg",
      channelUrl: "https://www.youtube.com/@LearnChineseThroughPodcast",
      durationSec: 816,
      durationLabel: "13:36",
      topic: "Luyện nghe tiếng Trung",
      note: "Phụ đề theo timestamp nguồn với bốn lớp Hán · Pinyin · Việt · Anh.",
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: "content/podcast/cues/fDT6wh9y8es.json",
      cuesCount: 281,
      cues: [
        {
          start: 6.33,
          end: 12.06,
          en: "⁇ : Welcome to the letter that I wrote to myself today.",
          zh: "🐼:欢迎收听……今天这封写给自己的信。",
          pinyin: "🐼: huān yíng shōu tīng …… jīn tiān zhè fēng xiě gěi zì jǐ de xìn。",
          vi: "🐼: Mời bạn lắng nghe lá thư hôm nay tôi viết cho chính mình."
        },
        {
          start: 12.33,
          end: 14.96,
          en: "GUY: Hello, I'm Zijun.",
          zh: "🐼:你好，我是子轩。",
          pinyin: "🐼: nǐ hǎo， wǒ shì Zǐxuān。",
          vi: "🐼: Xin chào, tôi là Tử Hiên."
        },
        {
          start: 15.17,
          end: 19.1,
          en: "GUARD: Tonight, I'd like to show you one.",
          zh: "🐼:今晚，我想先请你看一只",
          pinyin: "🐼: jīn wǎn， wǒ xiǎng xiān qǐng nǐ kàn yì zhī",
          vi: "🐼: Tối nay, trước tiên tôi muốn giới thiệu với các bạn một"
        }
      ]
    },
    {
      id: "ep-lctp-extra-C5VK4bR725E",
      youtubeId: "C5VK4bR725E",
      level: "HSK 2–4",
      levelGroup: "hsk3",
      title: "HSK 2 - 4 | If I Were 20 Again | Chinese Listening Practice",
      titleVi: "Nếu tôi lại ở tuổi đôi mươi",
      channel: "Learn Chinese Through Podcast",
      channelName: "Learn Chinese Through Podcast",
      channelHandle: "@LearnChineseThroughPodcast",
      channelId: "UCI8Liuxdz6UPv5rgMskfwPg",
      channelUrl: "https://www.youtube.com/@LearnChineseThroughPodcast",
      durationSec: 735,
      durationLabel: "12:15",
      topic: "Luyện nghe tiếng Trung",
      note: "Phụ đề theo timestamp nguồn với bốn lớp Hán · Pinyin · Việt · Anh.",
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: "content/podcast/cues/C5VK4bR725E.json",
      cuesCount: 299,
      cues: [
        {
          start: 7.2,
          end: 11.03,
          en: "⁇ : Welcome to the letter that I wrote to myself today.",
          zh: "🐼:欢迎收听……今天这封写给自己的信。",
          pinyin: "🐼: huān yíng shōu tīng …… jīn tiān zhè fēng xiě gěi zì jǐ de xìn。",
          vi: "Mời bạn lắng nghe lá thư hôm nay tôi viết cho chính mình."
        },
        {
          start: 11.13,
          end: 13.56,
          en: "GUY: Hello, I'm Zijun.",
          zh: "🐼:你好，我是子轩。",
          pinyin: "🐼: nǐ hǎo， wǒ shì Zǐxuān。",
          vi: "Xin chào, tôi là Tử Hiên."
        },
        {
          start: 13.63,
          end: 15.36,
          en: "Hello, everyone. I'm Yuzu.",
          zh: "🐼:大家好，我是雨桐。",
          pinyin: "🐼: dà jiā hǎo， wǒ shì Yǔtóng。",
          vi: "Chào mọi người, tôi là mưa."
        }
      ]
    },
    {
      id: "ep-lctp-extra-E5pdmms97EA",
      youtubeId: "E5pdmms97EA",
      level: "HSK 2–4",
      levelGroup: "hsk3",
      title: "HSK 2 - 4 | What Is Your Ultimate Goal for Learning Chinese? | Chinese Listening Practice",
      titleVi: "Mục tiêu cuối cùng khi học tiếng Trung là gì?",
      channel: "Learn Chinese Through Podcast",
      channelName: "Learn Chinese Through Podcast",
      channelHandle: "@LearnChineseThroughPodcast",
      channelId: "UCI8Liuxdz6UPv5rgMskfwPg",
      channelUrl: "https://www.youtube.com/@LearnChineseThroughPodcast",
      durationSec: 742,
      durationLabel: "12:22",
      topic: "Luyện nghe tiếng Trung",
      note: "Phụ đề theo timestamp nguồn với bốn lớp Hán · Pinyin · Việt · Anh.",
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: "content/podcast/cues/E5pdmms97EA.json",
      cuesCount: 288,
      cues: [
        {
          start: 6.13,
          end: 9,
          en: "What is the ultimate purpose of your learning Chinese?",
          zh: "你学习中文的最终目的是什么？",
          pinyin: "Nǐ xué xí zhōng wén de zuì zhōng mù dì shì shén me？",
          vi: "Mục tiêu cuối cùng của bạn khi học tiếng Trung là gì?"
        },
        {
          start: 9.17,
          end: 10.93,
          en: "It's about passing the exam.",
          zh: "是为了通过考试，",
          pinyin: "Shì wèi le tōng guò kǎo shì，",
          vi: "Có phải để thi đỗ,"
        },
        {
          start: 10.93,
          end: 13.13,
          en: "I've got to get a better job.",
          zh: "找到一份更好的工作，",
          pinyin: "Zhǎo dào yí fèn gèng hǎo de gōng zuò，",
          vi: "tìm được công việc tốt hơn,"
        }
      ]
    },
    {
      id: "ep-lctp-extra-o2apMtJSoao",
      youtubeId: "o2apMtJSoao",
      level: "HSK 2–4",
      levelGroup: "hsk3",
      title: "HSK 2 - 4 | Does Loving Someone Change Who You Are? | Chinese Listening Practice",
      titleVi: "Yêu một người có làm bạn thay đổi?",
      channel: "Learn Chinese Through Podcast",
      channelName: "Learn Chinese Through Podcast",
      channelHandle: "@LearnChineseThroughPodcast",
      channelId: "UCI8Liuxdz6UPv5rgMskfwPg",
      channelUrl: "https://www.youtube.com/@LearnChineseThroughPodcast",
      durationSec: 735,
      durationLabel: "12:15",
      topic: "Luyện nghe tiếng Trung",
      note: "Phụ đề theo timestamp nguồn với bốn lớp Hán · Pinyin · Việt · Anh.",
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: "content/podcast/cues/o2apMtJSoao.json",
      cuesCount: 268,
      cues: [
        {
          start: 6,
          end: 6.93,
          en: "You haven't found anything.",
          zh: "你有没有发现，",
          pinyin: "Nǐ yǒu méi yǒu fā xiàn，",
          vi: "Bạn có nhận thấy rằng"
        },
        {
          start: 7.93,
          end: 9.8,
          en: "Like someone else after that.",
          zh: "喜欢上一个人以后，",
          pinyin: "Xǐ huan shàng yí gè rén yǐ hòu，",
          vi: "sau khi yêu một ai đó,"
        },
        {
          start: 9.8,
          end: 12.9,
          en: "You seem to be slowly different?",
          zh: "自己好像慢慢变得不一样了？",
          pinyin: "Zì jǐ hǎo xiàng màn màn biàn de bù yí yàng le？",
          vi: "bạn dường như dần dần thay đổi không?"
        }
      ]
    },
    {
      id: 'ep-cdp-ganfe8bti_u',
      youtubeId: 'gaNfE8BTI_U',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '为什么越睡越累？真正的休息 | Why Are You Still Tired? True Rest in Chinese | Chinese Daily Podcast',
      titleVi: '为什么越睡越累？真正的休息 | Why Are You Still Tired? True Rest in Chinese | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1009,
      durationLabel: '16:49',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 351 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/gaNfE8BTI_U.json',
      cuesCount: 351,
      cues: [
        {
          start: 6.47,
          end: 10.36,
          en: 'Hello everyone! Welcome to today\'s "Chinese Daily"!',
          zh: '大家好！欢迎收听今天的《每天中文》！',
          pinyin: 'Dàjiā hǎo! Huānyíng shōutīng jīntiān de “Měitiān Zhōngwén”!',
          vi: 'Xin chào mọi người! Chào mừng các bạn nghe chương trình “Mỗi Ngày Tiếng Trung” hôm nay!'
        },
        {
          start: 10.37,
          end: 11.66,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-urzkyltefcq',
      youtubeId: 'uRzkyLtEFcQ',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '何为真正的知足？ | Ancient Wisdom for Modern Burnout | Chinese Daily Podcast',
      titleVi: '何为真正的知足？ | Ancient Wisdom for Modern Burnout | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 857,
      durationLabel: '14:17',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 284 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/uRzkyLtEFcQ.json',
      cuesCount: 284,
      cues: [
        {
          start: 6.37,
          end: 10.03,
          en: 'Hello everyone! Welcome to “Chinese Daily”, I\'m Li Ming.',
          zh: '大家好！欢迎收听《每天中文》，我是李明。',
          pinyin: 'Dàjiā hǎo! Huānyíng shōutīng “Měitiān Zhōngwén”, wǒ shì Lǐ Míng.',
          vi: 'Xin chào mọi người! Chào mừng các bạn đến với “Mỗi Ngày Tiếng Trung”, tôi là Lý Minh.'
        },
        {
          start: 10.03,
          end: 11.75,
          en: 'Hello everyone, I\'m Wang Yu!',
          zh: '大家好，我是王雨！',
          pinyin: 'Dàjiā hǎo, wǒ shì Wáng Yǔ!',
          vi: 'Xin chào mọi người, tôi là Vương Vũ!'
        }
      ]
    },
    {
      id: 'ep-cdp-dlhlsgjwfvu',
      youtubeId: 'DlhLSgjwfVU',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '众口铄金与网络暴力 | The Brutal Power of Words & Cyberbullying | Chinese Daily Podcast',
      titleVi: '众口铄金与网络暴力 | The Brutal Power of Words & Cyberbullying | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 953,
      durationLabel: '15:53',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 355 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/DlhLSgjwfVU.json',
      cuesCount: 355,
      cues: [
        {
          start: 7.7,
          end: 9.8,
          en: 'Dear listeners, hello everyone!',
          zh: '亲爱的听众朋友们，大家好！',
          pinyin: 'Qīn\'ài de tīngzhòng péngyǒumen, dàjiā hǎo!',
          vi: 'Các bạn thính giả thân mến, xin chào mọi người!'
        },
        {
          start: 9.83,
          end: 14.2,
          en: 'Long time no see, welcome to a new episode, I\'m Li Ming.',
          zh: '好久不见，欢迎收听新一期的节目，我是李明。',
          pinyin: 'Hǎojiǔ bú jiàn, huānyíng shōutīng xīn yī qī de jiémù, wǒ shì Lǐ Míng.',
          vi: 'Lâu rồi không gặp, chào mừng các bạn đến với tập mới của chương trình, tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp--f2cwdcfsmc',
      youtubeId: '-f2CWdcfSmc',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '聊斋志异：画皮 | Liaozhai Bedtime Story: The Painted Skin | Chinese Daily Podcast',
      titleVi: '聊斋志异：画皮 | Liaozhai Bedtime Story: The Painted Skin | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1089,
      durationLabel: '18:09',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 415 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/-f2CWdcfSmc.json',
      cuesCount: 415,
      cues: [
        {
          start: 6.5,
          end: 8.59,
          en: 'Dear friends, good evening.',
          zh: '亲爱的朋友们，晚上好。',
          pinyin: 'Qīn\'ài de péngyǒumen, wǎnshang hǎo.',
          vi: 'Các bạn thân mến, chào buổi tối.'
        },
        {
          start: 8.6,
          end: 12.79,
          en: 'Welcome to the \'Bedtime Stories\' segment of \'Chinese Daily.\'',
          zh: '欢迎收听《每天中文》的“睡前故事”专栏，',
          pinyin: 'Huānyíng shōutīng “Měitiān Zhōngwén” de “shuìqián gùshi” zhuānlán,',
          vi: 'Chào mừng các bạn đến với chuyên mục “Truyện kể trước giờ ngủ” của “Mỗi Ngày Trung Văn”.'
        }
      ]
    },
    {
      id: 'ep-cdp-mzbnuuwtzv4',
      youtubeId: 'MZbnUUWtZv4',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '你真的变了吗？成年人的成长瞬间 | Subtle Signs of Growing Up | Chinese Daily Podcast',
      titleVi: '你真的变了吗？成年人的成长瞬间 | Subtle Signs of Growing Up | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1199,
      durationLabel: '19:59',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 502 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/MZbnUUWtZv4.json',
      cuesCount: 502,
      cues: [
        {
          start: 6.47,
          end: 8.87,
          en: 'Dear listeners, hello everyone!',
          zh: '亲爱的听众朋友们，大家好呀！',
          pinyin: 'Qīn\'ài de tīngzhòng péngyoumen, dàjiā hǎo ya!',
          vi: 'Các bạn thính giả thân mến, xin chào mọi người!'
        },
        {
          start: 8.9,
          end: 13.13,
          en: 'Welcome to a new episode of "Chinese Daily"!',
          zh: '欢迎大家收听新一期的《每天中文》！',
          pinyin: 'Huānyíng dàjiā shōutīng xīn yī qī de 《Měitiān Zhōngwén》!',
          vi: 'Chào mừng mọi người đến với tập mới của “Mỗi Ngày Tiếng Trung”!'
        }
      ]
    },
    {
      id: 'ep-cdp-ikk8yoy4wl8',
      youtubeId: 'IKk8YoY4Wl8',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '为什么年轻人迷恋农村慢生活？ | Why Chinese Youth Love Rural Slow Living | Chinese Daily Podcast',
      titleVi: '为什么年轻人迷恋农村慢生活？ | Why Chinese Youth Love Rural Slow Living | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1024,
      durationLabel: '17:04',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 354 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/IKk8YoY4Wl8.json',
      cuesCount: 354,
      cues: [
        {
          start: 6.4,
          end: 9.59,
          en: 'Hello, dear listeners, how have you all been lately!',
          zh: '哈喽，亲爱的听众朋友们，大家最近好吗！',
          pinyin: 'Hālóu, qīn\'ài de tīngzhòng péngyoumen, dàjiā zuìjìn hǎo ma!',
          vi: 'Xin chào, những người bạn thính giả thân mến, dạo này mọi người có khỏe không!'
        },
        {
          start: 9.6,
          end: 14.56,
          en: 'Welcome to a new episode of Daily Chinese; I\'m Li Ming.',
          zh: '欢迎收听新一期的《每天中文》，我是李明。',
          pinyin: 'Huānyíng shōutīng xīn yī qī de “Měitiān Zhōngwén”, wǒ shì Lǐ Míng.',
          vi: 'Chào mừng các bạn đến với tập mới của \'Mỗi Ngày Tiếng Trung\', tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-468fvidwrle',
      youtubeId: '468fViDwrlE',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '孝顺还是盲从？ | Filial Piety vs Obedience in China | Chinese Daily Podcast',
      titleVi: '孝顺还是盲从？ | Filial Piety vs Obedience in China | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 995,
      durationLabel: '16:35',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 381 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/468fViDwrlE.json',
      cuesCount: 381,
      cues: [
        {
          start: 6.37,
          end: 8.3,
          en: 'Dear listeners, happy weekend to you all!',
          zh: '亲爱的听众朋友们，大家周末好！',
          pinyin: 'Qīn\'ài de tīngzhòng péngyǒumen, dàjiā zhōumò hǎo!',
          vi: 'Các bạn thính giả thân mến, chúc mọi người cuối tuần vui vẻ!'
        },
        {
          start: 8.33,
          end: 12.96,
          en: 'Welcome to a new episode of Daily Chinese; I\'m Li Ming.',
          zh: '欢迎收听新一期的《每天中文》，我是李明。',
          pinyin: 'Huānyíng shōutīng xīn yī qī de “Tiếng Trung Mỗi Ngày”, wǒ shì Lǐ Míng.',
          vi: 'Chào mừng các bạn đến với tập mới của “Tiếng Trung Mỗi Ngày”, tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-9jocykbpl3i',
      youtubeId: '9joCykBpl3I',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '中国人的客套话 | Decoding Chinese Polite Phrases & Small Talk | Chinese Daily Podcast',
      titleVi: '中国人的客套话 | Decoding Chinese Polite Phrases & Small Talk | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 914,
      durationLabel: '15:14',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 337 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/9joCykBpl3I.json',
      cuesCount: 337,
      cues: [
        {
          start: 6.27,
          end: 7.96,
          en: 'Dear listeners, hello everyone!',
          zh: '亲爱的听众朋友们，大家好！',
          pinyin: 'Qīn\'ài de tīngzhòng péngyoumen, dàjiā hǎo!',
          vi: 'Các thính giả thân mến, xin chào mọi người!'
        },
        {
          start: 7.97,
          end: 11.49,
          en: 'Welcome back to a new episode of Chinese Daily, I\'m Li Ming.',
          zh: '欢迎回到新一期的《每天中文》，我是李明。',
          pinyin: 'Huānyíng huídào xīn yī qī de 《Měitiān Zhōngwén》, wǒ shì Lǐ Míng.',
          vi: 'Chào mừng trở lại với tập mới của “Mỗi Ngày Tiếng Trung”, tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-jgyqgb-g9i8',
      youtubeId: 'JgyQgB-g9i8',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'Feeling Stuck in Chinese? You Are Just Growing Roots! | 感觉没进步？你只是在“扎根”',
      titleVi: 'Feeling Stuck in Chinese? You Are Just Growing Roots! | 感觉没进步？你只是在“扎根”',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1067,
      durationLabel: '17:47',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 398 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/JgyQgB-g9i8.json',
      cuesCount: 398,
      cues: [
        {
          start: 6.53,
          end: 9.13,
          en: 'Li Ming, when you came to the studio this morning,',
          zh: '李明，你早上来工作室的时候，',
          pinyin: 'Lǐ Míng, nǐ zǎoshang lái gōngzuòshì de shíhou,',
          vi: 'Lý Minh, lúc cậu đến studio vào sáng nay,'
        },
        {
          start: 9.17,
          end: 11.94,
          en: 'did you see that big tree at the park entrance?',
          zh: '看到公园门口那棵大树了吗？',
          pinyin: 'Kàn dào gōngyuán ménkǒu nà kē dàshù le ma?',
          vi: 'cậu có thấy cái cây lớn ở cổng công viên không?'
        }
      ]
    },
    {
      id: 'ep-cdp-rhyuqctidzm',
      youtubeId: 'rHyuQctiDZM',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '选择比努力更重要 | Choice is More Important Than Effort | Chinese Daily Podcast',
      titleVi: '选择比努力更重要 | Choice is More Important Than Effort | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1281,
      durationLabel: '21:21',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 494 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/rHyuQctiDZM.json',
      cuesCount: 494,
      cues: [
        {
          start: 6.3,
          end: 11.43,
          en: 'Sigh, I really feel so bad for her; my heart just feels awful.',
          zh: '唉，我真的太替她难过了，心里特别不是滋味。',
          pinyin: 'Āi, wǒ zhēn de tài tì tā nánguò le, xīnli tèbié bù shì zīwèi.',
          vi: 'Ôi, tôi thật sự thấy thương cô ấy quá, trong lòng cứ thấy không ổn chút nào.'
        },
        {
          start: 11.47,
          end: 12.67,
          en: 'What\'s wrong, Wang Yu?',
          zh: '怎么了王雨？',
          pinyin: 'Zěnme le Wáng Yǔ?',
          vi: 'Sao vậy Vương Vũ?'
        }
      ]
    },
    {
      id: 'ep-cdp-shluafrl4bu',
      youtubeId: 'ShLuafrl4BU',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '中国菜与八大菜系 | Eight Culinary Traditions of Chinese Food | Chinese Daily Podcast',
      titleVi: '中国菜与八大菜系 | Eight Culinary Traditions of Chinese Food | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1024,
      durationLabel: '17:04',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 355 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/ShLuafrl4BU.json',
      cuesCount: 355,
      cues: [
        {
          start: 6.2,
          end: 8.26,
          en: 'Li Ming, quick, look at this video!',
          zh: '李明，你快看这个视频！',
          pinyin: 'Lǐ Míng, nǐ kuài kàn zhège shìpín!',
          vi: 'Lý Minh, cậu mau xem video này đi!'
        },
        {
          start: 8.27,
          end: 11.53,
          en: 'I just saw a video of someone eating Sichuan hotpot,',
          zh: '我刚才看到一个吃四川火锅的视频，',
          pinyin: 'Wǒ gāngcái kàndào yí ge chī Sìchuān huǒguō de shìpín,',
          vi: 'Tớ vừa xem một video ăn lẩu Tứ Xuyên,'
        }
      ]
    },
    {
      id: 'ep-cdp-uufcrtzgg8i',
      youtubeId: 'UufcRTZgg8I',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '怎么给植物起中文名字？ | How to Name Plants in Chinese | Chinese Daily Podcast',
      titleVi: '怎么给植物起中文名字？ | How to Name Plants in Chinese | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1014,
      durationLabel: '16:54',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 358 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/UufcRTZgg8I.json',
      cuesCount: 358,
      cues: [
        {
          start: 6.33,
          end: 10.39,
          en: '(laughs) Look, look—isn\'t this especially cute?',
          zh: '(笑) 你看你看，这个是不是特别可爱？',
          pinyin: '(xiào) Nǐ kàn nǐ kàn, zhège shì bú shì tèbié kě\'ài?',
          vi: '(Cười) Anh xem này, cái này có phải đặc biệt đáng yêu không?'
        },
        {
          start: 10.4,
          end: 11.69,
          en: 'You\'ve been looking at your phone and laughing,',
          zh: '你一直看着手机笑，',
          pinyin: 'Nǐ yìzhí kànzhe shǒujī xiào,',
          vi: 'Anh cứ nhìn điện thoại cười suốt,'
        }
      ]
    },
    {
      id: 'ep-cdp-mvkils1pflg',
      youtubeId: 'MvKiLS1PfLg',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '改善中文发音的秘密 | The Secret to Improve Chinese Pronunciation | Chinese Daily Podcast',
      titleVi: '改善中文发音的秘密 | The Secret to Improve Chinese Pronunciation | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 847,
      durationLabel: '14:07',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 303 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/MvKiLS1PfLg.json',
      cuesCount: 303,
      cues: [
        {
          start: 6.2,
          end: 8.32,
          en: 'Li Ming! What were you laughing at just now?',
          zh: '李明！你刚才在笑什么？',
          pinyin: 'Lǐ Míng! Nǐ gāngcái zài xiào shénme?',
          vi: 'Lý Minh! Vừa nãy cậu cười cái gì thế?'
        },
        {
          start: 8.33,
          end: 9.95,
          en: 'Your laughter is too loud!',
          zh: '你的笑声太大了！',
          pinyin: 'Nǐ de xiàoshēng tài dà le!',
          vi: 'Tiếng cười của cậu lớn quá!'
        }
      ]
    },
    {
      id: 'ep-cdp-8fr-6eny0ms',
      youtubeId: '8fr-6enY0ms',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '关于分享的睡前故事 | Chinese Bedtime Stories About Sharing | Chinese Daily Podcast',
      titleVi: '关于分享的睡前故事 | Chinese Bedtime Stories About Sharing | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1209,
      durationLabel: '20:09',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 432 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/8fr-6enY0ms.json',
      cuesCount: 432,
      cues: [
        {
          start: 6.3,
          end: 9.36,
          en: 'Hello everyone, welcome to our podcast, Chinese Daily!',
          zh: '大家好，欢迎来到我们的播客，每天中文！',
          pinyin: 'Dàjiā hǎo, huānyíng lái dào wǒmen de bōkè, Měitiān Zhōngwén!',
          vi: 'Xin chào mọi người, chào mừng đến với podcast của chúng tôi, Mỗi Ngày Trung Văn!'
        },
        {
          start: 9.37,
          end: 12.13,
          en: 'I\'m Li Ming, and I\'m happy to meet everyone again.',
          zh: '我是李明，很高兴又和大家见面了。',
          pinyin: 'Wǒ shì Lǐ Míng, hěn gāoxìng yòu hé dàjiā jiànmiàn le.',
          vi: 'Tôi là Lý Minh, rất vui lại được gặp mọi người.'
        }
      ]
    },
    {
      id: 'ep-cdp-hssxcmlyqx4',
      youtubeId: 'HsSxcmLyqx4',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '为什么越沉默运气越好？ | Why Keeping Secrets Brings Good Luck | Chinese Daily Podcast',
      titleVi: '为什么越沉默运气越好？ | Why Keeping Secrets Brings Good Luck | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1103,
      durationLabel: '18:23',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 395 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/HsSxcmLyqx4.json',
      cuesCount: 395,
      cues: [
        {
          start: 6.37,
          end: 8.7,
          en: 'Hello everyone, welcome back to Chinese Daily!',
          zh: '大家好，欢迎回到每天中文！',
          pinyin: 'Dàjiā hǎo, huānyíng huídào Měitiān Zhōngwén!',
          vi: 'Xin chào mọi người, chào mừng quay lại với Mỗi Ngày Trung Văn!'
        },
        {
          start: 8.73,
          end: 10.7,
          en: 'I\'m very happy to chat with everyone again,',
          zh: '很高兴又能和大家一起聊天，',
          pinyin: 'Hěn gāoxìng yòu néng hé dàjiā yìqǐ liáotiān,',
          vi: 'Rất vui vì lại được trò chuyện cùng mọi người,'
        }
      ]
    },
    {
      id: 'ep-cdp-vhsprlbzaac',
      youtubeId: 'vhsPRlbzaac',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3-4 | 躺平是放弃还是觉醒？ | Is Lying Flat Giving Up or Waking Up? | Chinese Daily Podcast',
      titleVi: 'HSK 3-4 | 躺平是放弃还是觉醒？ | Is Lying Flat Giving Up or Waking Up? | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 767,
      durationLabel: '12:47',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 258 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/vhsPRlbzaac.json',
      cuesCount: 258,
      cues: [
        {
          start: 6.43,
          end: 8.93,
          en: 'Hello everyone, welcome back to Everyday Chinese!',
          zh: '大家好，欢迎回到每天中文！',
          pinyin: 'Dàjiā hǎo, huānyíng huídào Měitiān Zhōngwén!',
          vi: 'Xin chào mọi người, chào mừng quay lại với Tiếng Trung Mỗi Ngày!'
        },
        {
          start: 8.97,
          end: 10.67,
          en: 'I\'m Li Ming, and I\'m very happy',
          zh: '我是李明，很高兴',
          pinyin: 'Wǒ shì Lǐ Míng, hěn gāoxìng',
          vi: 'Tôi là Lý Minh, rất vui'
        }
      ]
    },
    {
      id: 'ep-cdp-tdlwxz1iqrq',
      youtubeId: 'tDlWxZ1IqrQ',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2 - 3 | The 4 Great Cuisines Explained | Chinese Daily Podcast',
      titleVi: 'HSK 2 - 3 | The 4 Great Cuisines Explained | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 772,
      durationLabel: '12:52',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 282 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/tDlWxZ1IqrQ.json',
      cuesCount: 282,
      cues: [
        {
          start: 6.77,
          end: 9.93,
          en: 'Hello everyone, welcome to \'Everyday Chinese\'.',
          zh: '大家好，欢迎收听“每天中文”。',
          pinyin: 'Dàjiā hǎo, huānyíng tīngshōu “Měitiān Zhōngwén”.',
          vi: 'Chào mọi người, chào mừng đến với “Tiếng Trung mỗi ngày”.'
        },
        {
          start: 9.93,
          end: 11.05,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-u2bfzltzwso',
      youtubeId: 'U2BFzltZWSo',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3-4 | Chinese BBQ Culture: Midnight Street Food | 中国深夜烧烤 | Chinese daily podcast',
      titleVi: 'HSK 3-4 | Chinese BBQ Culture: Midnight Street Food | 中国深夜烧烤 | Chinese daily podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 918,
      durationLabel: '15:18',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 350 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/U2BFzltZWSo.json',
      cuesCount: 350,
      cues: [
        {
          start: 6.37,
          end: 8.36,
          en: 'Hello everyone, welcome to Chinese Daily.',
          zh: '大家好，欢迎收听每天中文。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng Měitiān Zhōngwén.',
          vi: 'Xin chào mọi người, chào mừng đến với Mỗi Ngày Tiếng Trung.'
        },
        {
          start: 8.37,
          end: 9.29,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-4kgh4hnymj8',
      youtubeId: '4KGh4HNyMJ8',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3-4 | Dragon Boat Festival Traditions | 端午节的故事与习俗 | Chinese daily podcast',
      titleVi: 'HSK 3-4 | Dragon Boat Festival Traditions | 端午节的故事与习俗 | Chinese daily podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 935,
      durationLabel: '15:35',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 334 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/4KGh4HNyMJ8.json',
      cuesCount: 334,
      cues: [
        {
          start: 6.3,
          end: 9.02,
          en: 'Hello everyone! Welcome to \'Chinese Every Day.\'',
          zh: '大家好！欢迎来到《每天中文》。',
          pinyin: 'Dàjiā hǎo! Huānyíng lái dào “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người! Chào mừng đến với “Mỗi Ngày Tiếng Trung”.'
        },
        {
          start: 9.03,
          end: 9.95,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-7jbc1erfa08',
      youtubeId: '7jBC1ERfA08',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3-4 | Stop Confusing 不 vs 没 & 能 vs 可以 | 别再说错了！ | Chinese daily podcast',
      titleVi: 'HSK 3-4 | Stop Confusing 不 vs 没 & 能 vs 可以 | 别再说错了！ | Chinese daily podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1047,
      durationLabel: '17:27',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 409 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/7jBC1ERfA08.json',
      cuesCount: 409,
      cues: [
        {
          start: 6.27,
          end: 6.96,
          en: 'Hi everyone!',
          zh: '大家好！',
          pinyin: 'Dàjiā hǎo!',
          vi: 'Xin chào mọi người!'
        },
        {
          start: 6.97,
          end: 10.09,
          en: 'Welcome to a new episode of \'Daily Chinese\'!',
          zh: '欢迎来到新一期的“每天中文”！',
          pinyin: 'Huānyíng lái dào xīn yī qī de “Měitiān Zhōngwén”!',
          vi: 'Chào mừng đến với tập mới của “Mỗi Ngày Tiếng Trung”!'
        }
      ]
    },
    {
      id: 'ep-cdp-ai6y37t772k',
      youtubeId: 'AI6Y37T772k',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '学会倾听与消除误会 | How to Listen & Avoid Misunderstandings | Chinese Bedtime Story',
      titleVi: '学会倾听与消除误会 | How to Listen & Avoid Misunderstandings | Chinese Bedtime Story',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 982,
      durationLabel: '16:22',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 382 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/AI6Y37T772k.json',
      cuesCount: 382,
      cues: [
        {
          start: 7.67,
          end: 10.14,
          en: 'Hello everyone, welcome back to Daily Chinese, I\'m very happy',
          zh: '大家好，欢迎回到每天中文，很高兴',
          pinyin: 'Dàjiā hǎo, huānyíng huídào Měitiān Zhōngwén, hěn gāoxìng',
          vi: 'Xin chào mọi người, chào mừng quay lại 每天中文, rất vui'
        },
        {
          start: 10.17,
          end: 13.24,
          en: 'Today I can chat with everyone here again, today',
          zh: '今天又能和大家在这里一起聊天，今天',
          pinyin: 'Jīntiān yòu néng hé dàjiā zài zhèlǐ yìqǐ liáotiān, jīntiān',
          vi: 'Hôm nay lại có thể cùng mọi người trò chuyện ở đây, hôm nay'
        }
      ]
    },
    {
      id: 'ep-cdp-hbpecevvz-k',
      youtubeId: 'hBPECevVz-k',
      level: 'HSK 4',
      levelGroup: 'hsk4',
      title: 'HSK 4 | Why Chinese People Love Hot Water? | 为什么中国人爱喝热水？| Chinese Daily Podcast',
      titleVi: 'HSK 4 | Why Chinese People Love Hot Water? | 为什么中国人爱喝热水？| Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1204,
      durationLabel: '20:04',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 443 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/hBPECevVz-k.json',
      cuesCount: 443,
      cues: [
        {
          start: 6.37,
          end: 10.16,
          en: 'Hello everyone, welcome to a new episode of \'Chinese Daily.\'',
          zh: '大家好，欢迎收听新一期的《每天中文》。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yī qī de “Měitiān Zhōngwén”.',
          vi: 'Chào mọi người, hoan nghênh nghe tập mới của \'Mỗi Ngày Tiếng Trung\'.'
        },
        {
          start: 10.17,
          end: 11.13,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-qtdscuxhe3c',
      youtubeId: 'QTDSCuxhe3c',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3 | Chinese Birthday Culture & Longevity Noodles | 中国人生日吃什么？| Chinese Daily Podcast',
      titleVi: 'HSK 3 | Chinese Birthday Culture & Longevity Noodles | 中国人生日吃什么？| Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 985,
      durationLabel: '16:25',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 368 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/QTDSCuxhe3c.json',
      cuesCount: 368,
      cues: [
        {
          start: 6.43,
          end: 9.82,
          en: 'Hello everyone! This is “Chinese Daily”, welcome to the show.',
          zh: '大家好！这里是“每天中文”，欢迎你的收听。',
          pinyin: 'Dàjiā hǎo! Zhèlǐ shì “Měitiān Zhōngwén”, huānyíng nǐ de shōutīng.',
          vi: 'Xin chào mọi người! Đây là “Tiếng Trung Mỗi Ngày”, chào mừng bạn lắng nghe.'
        },
        {
          start: 9.83,
          end: 10.75,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-ktbmtlu9d3m',
      youtubeId: 'KtbmTlU9d3M',
      level: 'HSK 4',
      levelGroup: 'hsk4',
      title: 'HSK 4-5 | 酒逢知己千杯少 | Drinking with a True Friend | Chinese Daily Podcast',
      titleVi: 'HSK 4-5 | 酒逢知己千杯少 | Drinking with a True Friend | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 807,
      durationLabel: '13:27',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 289 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/KtbmTlU9d3M.json',
      cuesCount: 289,
      cues: [
        {
          start: 6.4,
          end: 8.9,
          en: 'Hello everyone, welcome back to Chinese Daily!',
          zh: '大家好，欢迎回到每天中文！',
          pinyin: 'Dàjiā hǎo, huānyíng huídào Měitiān Zhōngwén!',
          vi: 'Xin chào mọi người, chào mừng quay lại với Mỗi Ngày Tiếng Trung!'
        },
        {
          start: 8.93,
          end: 12.16,
          en: 'Today we\'re going to talk about another really interesting topic.',
          zh: '今天我们又要聊一个特别有意思的话题了。',
          pinyin: 'Jīntiān wǒmen yòu yào liáo yí ge tèbié yǒu yìsi de huàtí le.',
          vi: 'Hôm nay chúng ta lại sắp nói về một chủ đề đặc biệt thú vị.'
        }
      ]
    },
    {
      id: 'ep-cdp-cdx55ctkpus',
      youtubeId: 'cDx55cTKPUs',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3-4 | How Chinese Spend May Day 🇨🇳 中国人怎么过五一？| Chinese Daily Podcast',
      titleVi: 'HSK 3-4 | How Chinese Spend May Day 🇨🇳 中国人怎么过五一？| Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 993,
      durationLabel: '16:33',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 362 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/cDx55cTKPUs.json',
      cuesCount: 362,
      cues: [
        {
          start: 6.3,
          end: 8.09,
          en: 'Hello, dear listeners!',
          zh: '听众朋友们，大家好！',
          pinyin: 'Tīngzhòng péngyoumen, dàjiā hǎo!',
          vi: 'Xin chào các thính giả!'
        },
        {
          start: 8.1,
          end: 10.56,
          en: 'Welcome to “Daily Chinese.”',
          zh: '欢迎来到“每天中文”。',
          pinyin: 'Huānyíng lái dào “Měitiān Zhōngwén”.',
          vi: 'Chào mừng đến với “Mỗi Ngày Tiếng Trung”.'
        }
      ]
    },
    {
      id: 'ep-cdp-ikum3nphvs4',
      youtubeId: 'ikuM3nphvs4',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3 + | 中国常见迷信与禁忌 | Common Chinese Superstitions & Taboos | Chinese Daily Podcast',
      titleVi: 'HSK 3 + | 中国常见迷信与禁忌 | Common Chinese Superstitions & Taboos | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 954,
      durationLabel: '15:54',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 342 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/ikuM3nphvs4.json',
      cuesCount: 342,
      cues: [
        {
          start: 7.6,
          end: 10.79,
          en: 'Hello everyone, welcome to a new episode of Chinese Daily.',
          zh: '大家好，欢迎收听新一期的每天中文。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yī qī de Měitiān Zhōngwén.',
          vi: 'Xin chào mọi người, chào mừng đến với tập mới của Mỗi Ngày Tiếng Trung.'
        },
        {
          start: 10.8,
          end: 11.79,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp--zp8hi-xoni',
      youtubeId: '-zp8Hi-xONI',
      level: 'HSK 5–6',
      levelGroup: 'hsk5-6',
      title: 'HSK 5 | Living in the Future? China\'s New 4 Inventions | 中国新四大发明 | Chinese Daily Podcast',
      titleVi: 'HSK 5 | Living in the Future? China\'s New 4 Inventions | 中国新四大发明 | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1384,
      durationLabel: '23:04',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 542 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/-zp8Hi-xONI.json',
      cuesCount: 542,
      cues: [
        {
          start: 6.33,
          end: 10.06,
          en: 'Hello everyone—both those in front of the screen and each friend in your headphones!',
          zh: '屏幕前的，还有耳机里的每一位朋友，大家好！',
          pinyin: 'Píngmù qián de, hái yǒu ěrjī lǐ de měi yī wèi péngyou, dàjiā hǎo!',
          vi: 'Chào mọi người, cả những bạn trước màn hình lẫn từng bạn đang nghe trong tai nghe!'
        },
        {
          start: 10.1,
          end: 13.23,
          en: 'Welcome to a new episode of Chinese Daily.',
          zh: '欢迎收听新一期的《每天中文》。',
          pinyin: 'Huānyíng shōutīng xīn yī qī de 《Měitiān Zhōngwén》.',
          vi: 'Chào mừng đến với tập mới của \'Mỗi Ngày Tiếng Trung\'.'
        }
      ]
    },
    {
      id: 'ep-cdp-q1fo6dr5t_y',
      youtubeId: 'Q1FO6dr5T_Y',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3-4 | Social Media and Modern Life | Is Social Media Good or Bad? | Chinese Daily Podcast',
      titleVi: 'HSK 3-4 | Social Media and Modern Life | Is Social Media Good or Bad? | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 891,
      durationLabel: '14:51',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 313 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/Q1FO6dr5T_Y.json',
      cuesCount: 313,
      cues: [
        {
          start: 6.4,
          end: 11.09,
          en: 'Hello everyone, welcome to a new episode of “Chinese Daily”.',
          zh: '大家好，欢迎收听新一期的“每天中文”。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yī qī de “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người, chào mừng đến với tập mới của “Mỗi Ngày Tiếng Trung”.'
        },
        {
          start: 11.1,
          end: 12.16,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-3mhlegzxela',
      youtubeId: '3mHlegzXELA',
      level: 'HSK 3–5',
      levelGroup: 'hsk4',
      title: 'HSK 3–5 | Ancient Wisdom | 3 Chinese Fables for Critical Thinking | 成语故事 | Chinese daily podcast',
      titleVi: 'HSK 3–5 | Ancient Wisdom | 3 Chinese Fables for Critical Thinking | 成语故事 | Chinese daily podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1189,
      durationLabel: '19:49',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 434 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/3mHlegzXELA.json',
      cuesCount: 434,
      cues: [
        {
          start: 6.47,
          end: 10.23,
          en: 'Hello everyone, welcome to a new episode of “Everyday Chinese.”',
          zh: '大家好，欢迎收听新一期的“每天中文”。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yì qī de “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người, chào mừng đến với tập mới của “Mỗi Ngày Tiếng Trung”.'
        },
        {
          start: 10.23,
          end: 11.25,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-rtowijeg7sm',
      youtubeId: 'rTOwIJeG7sM',
      level: 'HSK 4',
      levelGroup: 'hsk4',
      title: 'HSK 4-5 | Don\'t Wait for the Perfect Moment | 不要等待完美的时机 | Chinese daily podcast',
      titleVi: 'HSK 4-5 | Don\'t Wait for the Perfect Moment | 不要等待完美的时机 | Chinese daily podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1418,
      durationLabel: '23:38',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 528 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/rTOwIJeG7sM.json',
      cuesCount: 528,
      cues: [
        {
          start: 6.43,
          end: 8.49,
          en: 'Dear listeners, hello everyone!',
          zh: '各位听众朋友们，大家好！',
          pinyin: 'Gèwèi tīngzhòng péngyǒumen, dàjiā hǎo!',
          vi: 'Kính chào các thính giả, xin chào mọi người!'
        },
        {
          start: 8.5,
          end: 11.49,
          en: 'Welcome to a new episode of “Chinese Daily.”',
          zh: '欢迎收听新一期的“每天中文”。',
          pinyin: 'Huānyíng shōutīng xīn yī qī de “Měitiān Zhōngwén”.',
          vi: 'Chào mừng các bạn đến với tập mới của “Tiếng Trung mỗi ngày”.'
        }
      ]
    },
    {
      id: 'ep-cdp-qabvnwgprje',
      youtubeId: 'qAbVNWgPRJE',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3-4 | Your Chinese Restaurant Survival Guide (中餐厅生存指南) | Chinese daily podcast',
      titleVi: 'HSK 3-4 | Your Chinese Restaurant Survival Guide (中餐厅生存指南) | Chinese daily podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 889,
      durationLabel: '14:49',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 314 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/qAbVNWgPRJE.json',
      cuesCount: 314,
      cues: [
        {
          start: 6.4,
          end: 10.53,
          en: 'Hello everyone, welcome to a new episode of “Daily Chinese.”',
          zh: '大家好，欢迎收听新一期的“每天中文”。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yī qī de “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người, chào mừng đến với tập mới của “Tiếng Trung Mỗi Ngày”.'
        },
        {
          start: 10.57,
          end: 11.7,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-vpt3c2leusy',
      youtubeId: 'Vpt3C2LEuSY',
      level: 'HSK 3–5',
      levelGroup: 'hsk4',
      title: 'HSK 3 - 5 | 当未来不确定时 | How to Face an Unclear Future | Chinese Daily Podcast',
      titleVi: 'HSK 3 - 5 | 当未来不确定时 | How to Face an Unclear Future | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 769,
      durationLabel: '12:49',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 283 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/Vpt3C2LEuSY.json',
      cuesCount: 283,
      cues: [
        {
          start: 6.47,
          end: 7.06,
          en: 'Hello everyone!',
          zh: '大家好！',
          pinyin: 'Dàjiā hǎo!',
          vi: 'Xin chào mọi người!'
        },
        {
          start: 7.07,
          end: 9.66,
          en: 'Welcome to a new episode of “Chinese Daily.”',
          zh: '欢迎来到新一集的“每天中文”。',
          pinyin: 'Huānyíng láidào xīn yì jí de “Měitiān Zhōngwén”.',
          vi: 'Chào mừng đến với tập mới của “Mỗi ngày tiếng Trung”.'
        }
      ]
    },
    {
      id: 'ep-cdp-ufvhabxrs7k',
      youtubeId: 'uFvhaBxrs7k',
      level: 'HSK 3–5',
      levelGroup: 'hsk4',
      title: 'HSK 3-5| Feel Stuck? The Matthew Effect (马太效应) | CHINESE DAILY PODCAST',
      titleVi: 'HSK 3-5| Feel Stuck? The Matthew Effect (马太效应) | CHINESE DAILY PODCAST',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1091,
      durationLabel: '18:11',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 403 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/uFvhaBxrs7k.json',
      cuesCount: 403,
      cues: [
        {
          start: 6.37,
          end: 9.14,
          en: 'Hello everyone! Welcome to “Everyday Chinese.”',
          zh: '大家好！欢迎收听“每天中文”。',
          pinyin: 'Dàjiā hǎo! Huānyíng shōutīng “Měitiān Zhōngwén”.',
          vi: 'Chào mọi người! Chào mừng đến với “Mỗi Ngày Tiếng Trung”.'
        },
        {
          start: 9.17,
          end: 10.27,
          en: 'I’m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-0wsxrqfky4s',
      youtubeId: '0WsXRQFkY4s',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3+ | Learn Chinese with Stories about Happiness (听故事学中文) | CHINESE DAILY PODCAST',
      titleVi: 'HSK 3+ | Learn Chinese with Stories about Happiness (听故事学中文) | CHINESE DAILY PODCAST',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1018,
      durationLabel: '16:58',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 352 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/0WsXRQFkY4s.json',
      cuesCount: 352,
      cues: [
        {
          start: 6.4,
          end: 10.83,
          en: 'Hello everyone, welcome to a new episode of “Chinese Daily.”',
          zh: '大家好，欢迎收听新一期的《每天中文》。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yī qī de 《Měitiān Zhōngwén》.',
          vi: 'Xin chào mọi người, chào mừng đến với tập mới của “Chinese Daily”.'
        },
        {
          start: 10.87,
          end: 12.24,
          en: 'I\'m Wang Yu.',
          zh: '我是王雨。',
          pinyin: 'Wǒ shì Wáng Yǔ.',
          vi: 'Tôi là Vương Vũ.'
        }
      ]
    },
    {
      id: 'ep-cdp-mjtayi52t3w',
      youtubeId: 'MJTAYI52T3w',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3 | What Is the Lantern Festival? (什么是元宵节？) | Chinese Daily Podcast',
      titleVi: 'HSK 3 | What Is the Lantern Festival? (什么是元宵节？) | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 912,
      durationLabel: '15:12',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 284 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/MJTAYI52T3w.json',
      cuesCount: 284,
      cues: [
        {
          start: 6.17,
          end: 9.89,
          en: 'Hello everyone! Welcome to Everyday Chinese.',
          zh: '大家好！欢迎来到每天中文。',
          pinyin: 'Dàjiā hǎo! Huānyíng lái dào Měitiān Zhōngwén.',
          vi: 'Xin chào mọi người! Chào mừng đến với Mỗi Ngày Trung Văn.'
        },
        {
          start: 9.9,
          end: 11.56,
          en: 'I\'m Wang Yu.',
          zh: '我是王雨。',
          pinyin: 'Wǒ shì Wáng Yǔ.',
          vi: 'Tôi là Wang Yu.'
        }
      ]
    },
    {
      id: 'ep-cdp-ed3skimfuk8',
      youtubeId: 'eD3sKIMFuK8',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK2+ | Modern Survival Skills: Don\'t Buy, Don\'t Do (现代生存技能) | CHINESE DAILY PODCAST',
      titleVi: 'HSK2+ | Modern Survival Skills: Don\'t Buy, Don\'t Do (现代生存技能) | CHINESE DAILY PODCAST',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1016,
      durationLabel: '16:56',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 339 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/eD3sKIMFuK8.json',
      cuesCount: 339,
      cues: [
        {
          start: 6.2,
          end: 7.49,
          en: 'Friends, hello everyone!',
          zh: '朋友们，大家好！',
          pinyin: 'Péngyoumen, dàjiā hǎo!',
          vi: 'Chào các bạn!'
        },
        {
          start: 7.5,
          end: 9.49,
          en: 'This is Daily Chinese.',
          zh: '这里是每天中文。',
          pinyin: 'Zhèlǐ shì Měitiān Zhōngwén.',
          vi: 'Đây là Mỗi Ngày Trung Văn.'
        }
      ]
    },
    {
      id: 'ep-cdp-hxvqzn4t3fy',
      youtubeId: 'HxVQZN4t3FY',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3 | Why Say "Ma Dao Cheng Gong"?Best 2026 Horse Year Greetings (马到成功) | Chinese daily podcast',
      titleVi: 'HSK 3 | Why Say "Ma Dao Cheng Gong"?Best 2026 Horse Year Greetings (马到成功) | Chinese daily podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 895,
      durationLabel: '14:55',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 269 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/HxVQZN4t3FY.json',
      cuesCount: 269,
      cues: [
        {
          start: 6.23,
          end: 6.89,
          en: 'Hello everyone!',
          zh: '大家好！',
          pinyin: 'Dàjiā hǎo!',
          vi: 'Xin chào mọi người!'
        },
        {
          start: 6.9,
          end: 9.76,
          en: 'Welcome to a new episode of “Daily Chinese.”',
          zh: '欢迎收听新一期的“每天中文”。',
          pinyin: 'Huānyíng shōutīng xīn yī qī de “Měitiān Zhōngwén”.',
          vi: 'Chào mừng các bạn đến với tập mới của “Mỗi Ngày Tiếng Trung”.'
        }
      ]
    },
    {
      id: 'ep-cdp-_bouklvjwsi',
      youtubeId: '_bOuklVJWsI',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'Chinese Bedtime Story: The Butterfly Lovers | Chinese Daily Podcast',
      titleVi: 'Chinese Bedtime Story: The Butterfly Lovers | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1087,
      durationLabel: '18:07',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 373 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/_bOuklVJWsI.json',
      cuesCount: 373,
      cues: [
        {
          start: 7.93,
          end: 11.76,
          en: 'Hello everyone, welcome to \'Daily Chinese.\'',
          zh: '大家好，欢迎收听“每天中文”。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người, chào mừng đến với “Mỗi Ngày Tiếng Trung”.'
        },
        {
          start: 11.8,
          end: 13.37,
          en: 'I\'m Wang Yu.',
          zh: '我是王雨。',
          pinyin: 'Wǒ shì Wáng Yǔ.',
          vi: 'Tôi là Vương Vũ.'
        }
      ]
    },
    {
      id: 'ep-cdp-kvsxl4gbprw',
      youtubeId: 'kVsxl4gbPrw',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3-4 | Why Lunar New Year Matters in Chinese Culture | 春节为什么这么重要？| Chinese daily podcast',
      titleVi: 'HSK 3-4 | Why Lunar New Year Matters in Chinese Culture | 春节为什么这么重要？| Chinese daily podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 947,
      durationLabel: '15:47',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 297 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/kVsxl4gbPrw.json',
      cuesCount: 297,
      cues: [
        {
          start: 6.3,
          end: 10.89,
          en: 'Hello everyone, welcome to a new episode of Daily Chinese; I\'m Li Ming.',
          zh: '大家好，欢迎收听新一期的每天中文，我是李明。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yī qī de Měitiān Zhōngwén, wǒ shì Lǐ Míng.',
          vi: 'Xin chào mọi người, chào mừng đến với tập mới của Mỗi Ngày Tiếng Trung, tôi là Lý Minh.'
        },
        {
          start: 10.9,
          end: 12.06,
          en: 'I\'m Wang Yu.',
          zh: '我是王雨。',
          pinyin: 'Wǒ shì Wáng Yǔ.',
          vi: 'Tôi là Vương Vũ.'
        }
      ]
    },
    {
      id: 'ep-cdp-dvsaq8upv_w',
      youtubeId: 'DvSaq8UPv_w',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3–4 | The Legend of the 12 Zodiac Animals (十二生肖的传说) | Chinese daily podcast',
      titleVi: 'HSK 3–4 | The Legend of the 12 Zodiac Animals (十二生肖的传说) | Chinese daily podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1113,
      durationLabel: '18:33',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 390 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/DvSaq8UPv_w.json',
      cuesCount: 390,
      cues: [
        {
          start: 6.4,
          end: 10.23,
          en: 'Hello everyone, welcome to \'Chinese Daily\', I\'m Li Ming.',
          zh: '大家好，欢迎收听“每天中文”，我是李明。',
          pinyin: 'Dàjiā hǎo，huānyíng shōutīng“Měitiān Zhōngwén”，wǒ shì Lǐ Míng.',
          vi: 'Chào mọi người, chào mừng đến với “Mỗi Ngày Tiếng Trung”, tôi là Lý Minh.'
        },
        {
          start: 10.27,
          end: 12.14,
          en: 'Hello everyone, I\'m Wang Yu.',
          zh: '大家好，我是王雨。',
          pinyin: 'Dàjiā hǎo，wǒ shì Wáng Yǔ.',
          vi: 'Chào mọi người, tôi là Vương Vũ.'
        }
      ]
    },
    {
      id: 'ep-cdp-ymzprfmwasy',
      youtubeId: 'YMZPRfMWaSY',
      level: 'HSK 3–5',
      levelGroup: 'hsk4',
      title: 'HSK 3-5 | Fight Fire with Fire (以毒攻毒) | CHINESE DAILY PODCAST',
      titleVi: 'HSK 3-5 | Fight Fire with Fire (以毒攻毒) | CHINESE DAILY PODCAST',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 952,
      durationLabel: '15:52',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 313 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/YMZPRfMWaSY.json',
      cuesCount: 313,
      cues: [
        {
          start: 6.27,
          end: 10.96,
          en: 'Hello, friends of “Everyday Chinese”; hello everyone, I’m Li Ming.',
          zh: '各位“每天中文”的朋友们，大家好，我是李明。',
          pinyin: 'Gèwèi “Měitiān Zhōngwén” de péngyoumen, dàjiā hǎo, wǒ shì Lǐ Míng.',
          vi: 'Chào các bạn của “Mỗi Ngày Tiếng Trung”, xin chào mọi người, tôi là Lý Minh.'
        },
        {
          start: 10.97,
          end: 12.79,
          en: 'Hello everyone, I’m Wang Yu.',
          zh: '大家好，我是王雨。',
          pinyin: 'Dàjiā hǎo, wǒ shì Wáng Yǔ.',
          vi: 'Chào mọi người, tôi là Vương Vũ.'
        }
      ]
    },
    {
      id: 'ep-cdp-frhbu_gwji0',
      youtubeId: 'FrHBU_gWJI0',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK3+ | Good Listening, Can\'t Read? The \'Eyes High, Hands Low\' Trap (眼高手低) | CHINESE DAILY PODCAST',
      titleVi: 'HSK3+ | Good Listening, Can\'t Read? The \'Eyes High, Hands Low\' Trap (眼高手低) | CHINESE DAILY PODCAST',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1094,
      durationLabel: '18:14',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 379 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/FrHBU_gWJI0.json',
      cuesCount: 379,
      cues: [
        {
          start: 6.37,
          end: 10.09,
          en: 'Hello everyone, welcome to a new episode of “Daily Chinese”.',
          zh: '大家好，欢迎收听新一期的“每天中文”。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yī qī de “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người, chào mừng nghe tập mới của “Trung Văn Mỗi Ngày”.'
        },
        {
          start: 10.1,
          end: 11.02,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-sg-drjmd3pc',
      youtubeId: 'SG-DrJMd3Pc',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3-4 | Is Luck or Hard Work More Important? (Timing, Location, and People) | Chinese Daily Post',
      titleVi: 'HSK 3-4 | Is Luck or Hard Work More Important? (Timing, Location, and People) | Chinese Daily Post',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 998,
      durationLabel: '16:38',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 333 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/SG-DrJMd3Pc.json',
      cuesCount: 333,
      cues: [
        {
          start: 6.3,
          end: 10.09,
          en: 'Hello everyone! Welcome to "Chinese Daily."',
          zh: '大家好！欢迎来到“每天中文”。',
          pinyin: 'Dàjiā hǎo! Huānyíng láidào “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người! Chào mừng đến với “Mỗi Ngày Trung Văn”.'
        },
        {
          start: 10.1,
          end: 11.52,
          en: 'I\'m Wang Yu.',
          zh: '我是王雨。',
          pinyin: 'Wǒ shì Wáng Yǔ.',
          vi: 'Tôi là Vương Vũ.'
        }
      ]
    },
    {
      id: 'ep-cdp-k9kcjsu0dku',
      youtubeId: 'k9KCJsU0DKU',
      level: 'HSK 3–5',
      levelGroup: 'hsk4',
      title: 'HSK 3-5 | What to Prepare Before a Job Interview? A Discussion on "Interview Preparation" | Chine...',
      titleVi: 'HSK 3-5 | What to Prepare Before a Job Interview? A Discussion on "Interview Preparation" | Chine...',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1296,
      durationLabel: '21:36',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 490 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/k9KCJsU0DKU.json',
      cuesCount: 490,
      cues: [
        {
          start: 6.4,
          end: 7.19,
          en: 'Hello everyone!',
          zh: '大家好！',
          pinyin: 'Dàjiā hǎo!',
          vi: 'Xin chào mọi người!'
        },
        {
          start: 7.2,
          end: 10.92,
          en: 'Welcome to a new episode of “Daily Chinese.”',
          zh: '欢迎收听新一期的“每天中文”。',
          pinyin: 'Huānyíng shōutīng xīn yī qī de “Měitiān Zhōngwén”.',
          vi: 'Chào mừng bạn đến với tập mới của “Mỗi Ngày Tiếng Trung”.'
        }
      ]
    },
    {
      id: 'ep-cdp-_c0cqaqowjy',
      youtubeId: '_C0CqAQowjY',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2+ | The Secret Story of "Jiāyóu"? 聊聊你不知道的“加油”故事 | Chinese Daily Podcast',
      titleVi: 'HSK 2+ | The Secret Story of "Jiāyóu"? 聊聊你不知道的“加油”故事 | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 756,
      durationLabel: '12:36',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 262 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/_C0CqAQowjY.json',
      cuesCount: 262,
      cues: [
        {
          start: 6.3,
          end: 9.56,
          en: 'Hello everyone! Welcome to “Everyday Chinese.”',
          zh: '大家好！欢迎来到“每天中文”。',
          pinyin: 'Dàjiā hǎo! Huānyíng láidào “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người! Chào mừng đến với “Mỗi Ngày Trung Văn”.'
        },
        {
          start: 9.57,
          end: 11.13,
          en: 'I’m Wang Yu.',
          zh: '我是王雨。',
          pinyin: 'Wǒ shì Wáng Yǔ.',
          vi: 'Tôi là Vương Vũ.'
        }
      ]
    },
    {
      id: 'ep-cdp-xcmubethvxg',
      youtubeId: 'XCMuBEthVxg',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3-4 | Finding Methods vs. Finding Excuses? 聊聊“找方法还是找理由” | Chinese Daily Podcast',
      titleVi: 'HSK 3-4 | Finding Methods vs. Finding Excuses? 聊聊“找方法还是找理由” | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1117,
      durationLabel: '18:37',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 378 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/XCMuBEthVxg.json',
      cuesCount: 378,
      cues: [
        {
          start: 6.4,
          end: 11.56,
          en: 'Hello everyone, welcome to a new episode of Everyday Chinese; I\'m Li Ming.',
          zh: '大家好，欢迎收听新一期的每天中文，我是李明。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yì qī de Měitiān Zhōngwén, wǒ shì Lǐ Míng.',
          vi: 'Xin chào mọi người, chào mừng đến với tập mới của Tiếng Trung Mỗi Ngày, tôi là Lý Minh.'
        },
        {
          start: 11.57,
          end: 13.53,
          en: 'Hello everyone, I\'m Wang Yu.',
          zh: '大家好，我是王雨。',
          pinyin: 'Dàjiā hǎo, wǒ shì Wáng Yǔ.',
          vi: 'Xin chào mọi người, tôi là Vương Vũ.'
        }
      ]
    },
    {
      id: 'ep-cdp-fd7hmbqexd0',
      youtubeId: 'fD7hmbqEXd0',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-3 | What do Chinese people do on Dec 31st? Talking about "New Year\'s Eve" | Chinese Daily P...',
      titleVi: 'HSK 1-3 | What do Chinese people do on Dec 31st? Talking about "New Year\'s Eve" | Chinese Daily P...',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 790,
      durationLabel: '13:10',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 249 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/fD7hmbqEXd0.json',
      cuesCount: 249,
      cues: [
        {
          start: 6.3,
          end: 10.36,
          en: 'Hello everyone! Welcome to Chinese Daily.',
          zh: '大家好！欢迎收听每天中文。',
          pinyin: 'Dàjiā hǎo! Huānyíng shōutīng Měitiān Zhōngwén.',
          vi: 'Xin chào mọi người! Chào mừng đến với Mỗi Ngày Trung Văn.'
        },
        {
          start: 10.37,
          end: 11.79,
          en: 'I\'m Wang Yu.',
          zh: '我是王雨。',
          pinyin: 'Wǒ shì Wáng Yǔ.',
          vi: 'Tôi là Vương Vũ.'
        }
      ]
    },
    {
      id: 'ep-cdp-prnhdkgbgge',
      youtubeId: 'pRNHDkGbgGE',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3+ | Goodbye 2025: From Anxiety to Happiness | Chinese Daily Podcast',
      titleVi: 'HSK 3+ | Goodbye 2025: From Anxiety to Happiness | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1199,
      durationLabel: '19:59',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 426 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/pRNHDkGbgGE.json',
      cuesCount: 426,
      cues: [
        {
          start: 7,
          end: 10.17,
          en: 'Hello everyone, welcome to Chinese Daily.',
          zh: '大家好，欢迎收听每天中文。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng Měitiān Zhōngwén.',
          vi: 'Xin chào mọi người, chào mừng nghe Mỗi Ngày Trung Văn.'
        },
        {
          start: 10.2,
          end: 11.37,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-amw4wucii8e',
      youtubeId: 'aMw4WUCIi8E',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '4 Secrets to a Prosperous Family | Chinese Daily Podcast',
      titleVi: '4 Secrets to a Prosperous Family | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 794,
      durationLabel: '13:14',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 278 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/aMw4WUCIi8E.json',
      cuesCount: 278,
      cues: [
        {
          start: 6.77,
          end: 10.27,
          en: 'Hello everyone! Welcome to “Everyday Chinese.”',
          zh: '大家好！欢迎来到“每天中文”。',
          pinyin: 'Dàjiā hǎo! Huānyíng láidào “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người! Chào mừng đến với “Tiếng Trung Mỗi Ngày”.'
        },
        {
          start: 10.3,
          end: 11.47,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-qcoj4js2slc',
      youtubeId: 'QcoJ4jS2slc',
      level: 'HSK 3–5',
      levelGroup: 'hsk4',
      title: 'HSK 3-5 | 中国年轻人还用农历吗？Do Chinese Youth Still Use the Lunar Calendar?',
      titleVi: 'HSK 3-5 | 中国年轻人还用农历吗？Do Chinese Youth Still Use the Lunar Calendar?',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 753,
      durationLabel: '12:33',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 256 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/QcoJ4jS2slc.json',
      cuesCount: 256,
      cues: [
        {
          start: 6.9,
          end: 10.47,
          en: 'Hey, Li Ming, my mom just sent me a WeChat message,',
          zh: '哎，李明，我妈妈刚给我发了个微信，',
          pinyin: 'Āi, Lǐ Míng, wǒ māma gāng gěi wǒ fā le ge Wēixìn,',
          vi: 'Này, Lý Minh, mẹ tôi vừa gửi cho tôi một tin nhắn WeChat,'
        },
        {
          start: 10.5,
          end: 13.37,
          en: 'reminding me not to forget to eat dumplings next week.',
          zh: '提醒我下个星期别忘了吃饺子。',
          pinyin: 'tíxǐng wǒ xià ge xīngqī bié wàng le chī jiǎozi.',
          vi: 'nhắc tôi tuần sau đừng quên ăn sủi cảo.'
        }
      ]
    },
    {
      id: 'ep-cdp-iyvm1bw0ruy',
      youtubeId: 'iyVM1bW0rUY',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2+ | 不求甚解: Why You Should STOP Trying to Understand 100%',
      titleVi: 'HSK 2+ | 不求甚解: Why You Should STOP Trying to Understand 100%',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 789,
      durationLabel: '13:09',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 299 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/iyVM1bW0rUY.json',
      cuesCount: 299,
      cues: [
        {
          start: 7.37,
          end: 10.24,
          en: 'Hello everyone, welcome to “Daily Chinese.”',
          zh: '大家好，欢迎来到“每天中文”。',
          pinyin: 'Dàjiā hǎo, huānyíng lái dào “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người, chào mừng đến với “Trung Văn Mỗi Ngày”.'
        },
        {
          start: 10.27,
          end: 11.37,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-yg2nbmpoofu',
      youtubeId: 'yg2NbmpOofU',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-3 | The True Meaning of Christmas | 圣诞节真正的意义 | 中文对话 | Chinese Daily Podcast',
      titleVi: 'HSK 1-3 | The True Meaning of Christmas | 圣诞节真正的意义 | 中文对话 | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 836,
      durationLabel: '13:56',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 313 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/yg2NbmpOofU.json',
      cuesCount: 313,
      cues: [
        {
          start: 7.63,
          end: 8.5,
          en: 'Hello everyone!',
          zh: '大家好！',
          pinyin: 'Dàjiā hǎo!',
          vi: 'Xin chào mọi người!'
        },
        {
          start: 8.53,
          end: 11.93,
          en: 'Welcome to a new episode of Daily Chinese.',
          zh: '欢迎收听新一期的《每天中文》。',
          pinyin: 'Huānyíng shōutīng xīn yì qī de 《Měitiān Zhōngwén》.',
          vi: 'Chào mừng các bạn đến với tập mới của 《Mỗi Ngày Trung Văn》.'
        }
      ]
    },
    {
      id: 'ep-cdp-diipii_ceqo',
      youtubeId: 'diIpII_ceQo',
      level: 'HSK 4',
      levelGroup: 'hsk4',
      title: 'HSK 4-5 | 水到渠成 | Everything Happens At The Right Time | The Four Rules of Life | Ep.3',
      titleVi: 'HSK 4-5 | 水到渠成 | Everything Happens At The Right Time | The Four Rules of Life | Ep.3',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 785,
      durationLabel: '13:05',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 271 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/diIpII_ceQo.json',
      cuesCount: 271,
      cues: [
        {
          start: 7.63,
          end: 8.33,
          en: 'Hello everyone,',
          zh: '大家好，',
          pinyin: 'Dàjiā hǎo,',
          vi: 'Xin chào mọi người,'
        },
        {
          start: 8.37,
          end: 12.64,
          en: 'Welcome to a new episode of “Daily Chinese”; I’m Li Ming.',
          zh: '欢迎收听新一期的“每天中文”，我是李明。',
          pinyin: 'Huānyíng shōutīng xīn yī qī de “Měitiān Zhōngwén”, wǒ shì Lǐ Míng.',
          vi: 'Chào mừng các bạn đến với tập mới của “Mỗi Ngày Tiếng Trung”, tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-gle66hlc7ds',
      youtubeId: 'gLE66HLc7Ds',
      level: 'HSK 3–5',
      levelGroup: 'hsk4',
      title: 'HSK 3 - 5 | Don\'t Visit at the Wrong Time! China Travel Tips | Don\'t Go at the Wrong Time! China ...',
      titleVi: 'HSK 3 - 5 | Don\'t Visit at the Wrong Time! China Travel Tips | Don\'t Go at the Wrong Time! China ...',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 831,
      durationLabel: '13:51',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 273 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/gLE66HLc7Ds.json',
      cuesCount: 273,
      cues: [
        {
          start: 7.53,
          end: 10.8,
          en: 'Hello everyone, welcome to Chinese Daily.',
          zh: '大家好，欢迎来到每天中文。',
          pinyin: 'Dàjiā hǎo, huānyíng lái dào Měitiān Zhōngwén.',
          vi: 'Xin chào mọi người, chào mừng đến với Mỗi Ngày Trung Văn.'
        },
        {
          start: 10.83,
          end: 12.13,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-z2ygfpzxpmk',
      youtubeId: 'z2YGfpZXPMk',
      level: 'HSK 3–5',
      levelGroup: 'hsk4',
      title: 'HSK 3 - 5 | Why Can\'t You Focus? Short Videos vs. Deep Learning | Chinese Daily Podcast',
      titleVi: 'HSK 3 - 5 | Why Can\'t You Focus? Short Videos vs. Deep Learning | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 863,
      durationLabel: '14:23',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 297 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/z2YGfpZXPMk.json',
      cuesCount: 297,
      cues: [
        {
          start: 6.97,
          end: 10.17,
          en: 'Hello everyone, welcome to “Chinese Daily.”',
          zh: '大家好，欢迎收听“每天中文”。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người, chào mừng nghe “Mỗi ngày tiếng Trung”.'
        },
        {
          start: 10.2,
          end: 11.13,
          en: 'I’m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-yln9hfxk-yg',
      youtubeId: 'yln9HFxk-Yg',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1 - 3 | 井底之蛙？谦虚打开中文世界！| Frog in the Well? Humility Opens Your Chinese World | Bedtime Story',
      titleVi: 'HSK 1 - 3 | 井底之蛙？谦虚打开中文世界！| Frog in the Well? Humility Opens Your Chinese World | Bedtime Story',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 985,
      durationLabel: '16:25',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 362 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/yln9HFxk-Yg.json',
      cuesCount: 362,
      cues: [
        {
          start: 7.37,
          end: 10.84,
          en: 'Hello everyone, welcome to “Daily Chinese.”',
          zh: '大家好，欢迎收听“每天中文”。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người, chào mừng các bạn đến với “Tiếng Trung Mỗi Ngày”.'
        },
        {
          start: 10.87,
          end: 11.8,
          en: 'I\'m Wang Yu.',
          zh: '我是王雨。',
          pinyin: 'Wǒ shì Wáng Yǔ.',
          vi: 'Tôi là Vương Vũ.'
        }
      ]
    },
    {
      id: 'ep-cdp-bkou6tymg_m',
      youtubeId: 'BkOu6Tymg_M',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'First Trip to China? A Step-by-Step Guide | 第一次去中国？保姆级准备指南 | Chinese Daily Podcast',
      titleVi: 'First Trip to China? A Step-by-Step Guide | 第一次去中国？保姆级准备指南 | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1116,
      durationLabel: '18:36',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 380 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/BkOu6Tymg_M.json',
      cuesCount: 380,
      cues: [
        {
          start: 7.5,
          end: 8.4,
          en: 'Hello everyone!',
          zh: '大家好！',
          pinyin: 'Dàjiā hǎo!',
          vi: 'Xin chào mọi người!'
        },
        {
          start: 8.43,
          end: 11.8,
          en: 'Welcome to a new episode of “Chinese Daily”!',
          zh: '欢迎收听新一期的“每天中文”！',
          pinyin: 'Huānyíng shōutīng xīn yī qī de “Měitiān Zhōngwén”!',
          vi: 'Chào mừng các bạn đến với tập mới của “Tiếng Trung Mỗi Ngày”!'
        }
      ]
    },
    {
      id: 'ep-cdp-gntfg-xj8xg',
      youtubeId: 'GnTfG-xJ8Xg',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '先苦后甜 | Why Easy Choices Lead to a Hard Life | Chinese Daily Podcast',
      titleVi: '先苦后甜 | Why Easy Choices Lead to a Hard Life | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 963,
      durationLabel: '16:03',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 323 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/GnTfG-xJ8Xg.json',
      cuesCount: 323,
      cues: [
        {
          start: 7.6,
          end: 11.5,
          en: 'Ah, Li Ming, I\'m so tired.',
          zh: '啊，李明，我好累啊。',
          pinyin: 'A, Lǐ Míng, wǒ hǎo lèi a.',
          vi: 'Ôi, Lý Minh, tôi mệt quá.'
        },
        {
          start: 11.53,
          end: 14.76,
          en: 'I really almost couldn\'t get up this morning.',
          zh: '今天早上我真的差点儿起不来。',
          pinyin: 'Jīntiān zǎoshang wǒ zhēn de chàdiǎnr qǐ bu lái.',
          vi: 'Sáng nay tôi suýt nữa thì không dậy nổi.'
        }
      ]
    },
    {
      id: 'ep-cdp-mw4gahblciq',
      youtubeId: 'mw4GahbLciQ',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '顺其自然 | Everything Happens for a Reason | Chinese Daily Podcast | Ep.2',
      titleVi: '顺其自然 | Everything Happens for a Reason | Chinese Daily Podcast | Ep.2',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1119,
      durationLabel: '18:39',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 383 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/mw4GahbLciQ.json',
      cuesCount: 383,
      cues: [
        {
          start: 7.43,
          end: 8.23,
          en: 'Hello everyone,',
          zh: '大家好，',
          pinyin: 'Dàjiā hǎo,',
          vi: 'Xin chào mọi người,'
        },
        {
          start: 8.27,
          end: 12.84,
          en: 'Welcome to a new episode of “Chinese Daily”; I’m Li Ming.',
          zh: '欢迎收听新一期的“每天中文”，我是李明。',
          pinyin: 'Huānyíng shōutīng xīn yì qī de “Měitiān Zhōngwén”, wǒ shì Lǐ Míng.',
          vi: 'Chào mừng các bạn đến với tập mới của “Mỗi Ngày Tiếng Trung”, tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-af4-aio4gpa',
      youtubeId: 'af4-aio4GpA',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'Who is Your Destiny? The Legend of Yue Lao | 谁是你的命中注定？月老的传说 | Chinese Daily Podcast',
      titleVi: 'Who is Your Destiny? The Legend of Yue Lao | 谁是你的命中注定？月老的传说 | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 991,
      durationLabel: '16:31',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 331 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/af4-aio4GpA.json',
      cuesCount: 331,
      cues: [
        {
          start: 7.5,
          end: 11.3,
          en: 'Hello everyone, welcome to “Chinese Daily”!',
          zh: '大家好，欢迎收听“每天中文”！',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng “Měitiān Zhōngwén”!',
          vi: 'Xin chào mọi người, chào mừng các bạn đến với “Tiếng Trung mỗi ngày”!'
        },
        {
          start: 11.33,
          end: 12.9,
          en: 'I’m Wang Yu.',
          zh: '我是王雨。',
          pinyin: 'Wǒ shì Wáng Yǔ.',
          vi: 'Tôi là Vương Vũ.'
        }
      ]
    },
    {
      id: 'ep-cdp-d0ixh4wlby4',
      youtubeId: 'd0Ixh4Wlby4',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '塞翁失马焉知非福  | Is Losing a Horse Good Luck? Chinese Daily Podcast | EP.2',
      titleVi: '塞翁失马焉知非福  | Is Losing a Horse Good Luck? Chinese Daily Podcast | EP.2',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1202,
      durationLabel: '20:02',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 413 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/d0Ixh4Wlby4.json',
      cuesCount: 413,
      cues: [
        {
          start: 7.47,
          end: 8.34,
          en: 'Hello everyone!',
          zh: '大家好！',
          pinyin: 'Dàjiā hǎo!',
          vi: 'Xin chào mọi người!'
        },
        {
          start: 8.37,
          end: 11.7,
          en: 'Welcome to a new episode of “Everyday Chinese.”',
          zh: '欢迎收听新一期的“每天中文”。',
          pinyin: 'Huānyíng shōutīng xīn yī qī de “Měitiān Zhōngwén”.',
          vi: 'Chào mừng các bạn đến với tập mới của “Mỗi Ngày Tiếng Trung”.'
        }
      ]
    },
    {
      id: 'ep-cdp-tzw5lse6yci',
      youtubeId: 'tZW5LSE6YcI',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'Why You Still Forget Chinese Characters? | 为什么学了很多汉字，还记不住？ | Chinese Daily Podcast',
      titleVi: 'Why You Still Forget Chinese Characters? | 为什么学了很多汉字，还记不住？ | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1202,
      durationLabel: '20:02',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 445 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/tZW5LSE6YcI.json',
      cuesCount: 445,
      cues: [
        {
          start: 7.37,
          end: 10.64,
          en: 'Hello everyone, welcome to Chinese Daily.',
          zh: '大家好，欢迎来到《每日中文》。',
          pinyin: 'Dàjiā hǎo, huānyíng lái dào “Měirì Zhōngwén”.',
          vi: 'Chào mọi người, chào mừng đến với “Tiếng Trung Mỗi Ngày”.'
        },
        {
          start: 10.67,
          end: 12.07,
          en: 'I\'m Xiaoming.',
          zh: '我是小明。',
          pinyin: 'Wǒ shì Xiǎomíng.',
          vi: 'Tôi là Tiểu Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-cdwz6q9x9dg',
      youtubeId: 'cDwz6q9x9Dg',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '所有的相遇，都是有原因的 | Everyone You Meet Comes for a Reason | Chinese Daily Podcast',
      titleVi: '所有的相遇，都是有原因的 | Everyone You Meet Comes for a Reason | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1097,
      durationLabel: '18:17',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 407 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/cDwz6q9x9Dg.json',
      cuesCount: 407,
      cues: [
        {
          start: 7.43,
          end: 11,
          en: 'Hello everyone, welcome to a new episode of \'Daily Chinese\',',
          zh: '大家好，欢迎收听新一期的“每天中文”，',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yì qī de “Měitiān Zhōngwén”,',
          vi: 'Chào mọi người, chào mừng đến với tập mới của \'Mỗi Ngày Tiếng Trung\','
        },
        {
          start: 11.03,
          end: 12,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Mình là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-xdulrjn_rzm',
      youtubeId: 'xdULRJN_RZM',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3 - 4 | 独处的秘密力量 | The Secret Power of Being Alone | Chinese Daily Podcast',
      titleVi: 'HSK 3 - 4 | 独处的秘密力量 | The Secret Power of Being Alone | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 667,
      durationLabel: '11:07',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 233 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/xdULRJN_RZM.json',
      cuesCount: 233,
      cues: [
        {
          start: 7.63,
          end: 11.33,
          en: 'Hello everyone, welcome to a new episode of \'Daily Chinese\'.',
          zh: '大家好，欢迎收听新一期的“每天中文”。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yī qī de “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người, chào mừng các bạn đến với tập mới của \'Mỗi Ngày Tiếng Trung\'.'
        },
        {
          start: 11.37,
          end: 12.5,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-p1gknd6_dm4',
      youtubeId: 'p1Gknd6_Dm4',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-3 | 善良有错吗？中国寓言故事 Are Good Deeds Always Right? | Chinese Bedtime Story',
      titleVi: 'HSK 1-3 | 善良有错吗？中国寓言故事 Are Good Deeds Always Right? | Chinese Bedtime Story',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1305,
      durationLabel: '21:45',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 453 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/p1Gknd6_Dm4.json',
      cuesCount: 453,
      cues: [
        {
          start: 7.63,
          end: 11.13,
          en: 'Li Ming, I discovered something interesting.',
          zh: '李明，我发现一件有意思的事情。',
          pinyin: 'Lǐ Míng, wǒ fāxiàn yí jiàn yǒu yìsi de shìqing.',
          vi: 'Lý Minh, tôi phát hiện ra một chuyện thú vị.'
        },
        {
          start: 11.13,
          end: 12.73,
          en: 'Oh? What is it?',
          zh: '哦？什么事？',
          pinyin: 'Ó? Shénme shì?',
          vi: 'Ồ? Chuyện gì vậy?'
        }
      ]
    },
    {
      id: 'ep-cdp-gfpovovfgqi',
      youtubeId: 'GFPOvOvFgQI',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-3 | 像泡茶一样学中文  | Learn Chinese Like Making Tea | Chinese Daily Podcast',
      titleVi: 'HSK 1-3 | 像泡茶一样学中文  | Learn Chinese Like Making Tea | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 994,
      durationLabel: '16:34',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 274 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/GFPOvOvFgQI.json',
      cuesCount: 274,
      cues: [
        {
          start: 7.63,
          end: 10.93,
          en: 'Hello everyone, welcome to Daily Chinese.',
          zh: '大家好，欢迎收听每天中文。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng Měitiān Zhōngwén.',
          vi: 'Xin chào mọi người, chào mừng đến với chương trình 每天中文.'
        },
        {
          start: 10.97,
          end: 12.3,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-ukbxnym07f0',
      youtubeId: 'ukBxnyM07F0',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3-4 | 赢了道理，还是输了关系？ | Win the Argument or Win at Life? | Chinese Daily Podcast',
      titleVi: 'HSK 3-4 | 赢了道理，还是输了关系？ | Win the Argument or Win at Life? | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 988,
      durationLabel: '16:28',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 334 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/ukBxnyM07F0.json',
      cuesCount: 334,
      cues: [
        {
          start: 6.47,
          end: 8.8,
          en: 'Li Ming, what\'s wrong with you today?',
          zh: '李明，你今天怎么了？',
          pinyin: 'Lǐ Míng, nǐ jīntiān zěnme le?',
          vi: 'Lý Minh, hôm nay cậu sao thế?'
        },
        {
          start: 8.83,
          end: 12.23,
          en: 'Ever since you came back from the meeting, you\'ve been staring out the window,',
          zh: '从刚才开会回来，你就一直看着窗外，',
          pinyin: 'Cóng gāngcái kāihuì huílái, nǐ jiù yīzhí kànzhe chuāngwài,',
          vi: 'Từ lúc họp xong trở về, cậu cứ nhìn ra ngoài cửa sổ mãi,'
        }
      ]
    },
    {
      id: 'ep-cdp-q2rskihezss',
      youtubeId: 'q2rSKIHezSs',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-3 | 和中文交朋友，告别战斗模式 | Your New Chinese Mindset | Chinese Daily Podcasat',
      titleVi: 'HSK 1-3 | 和中文交朋友，告别战斗模式 | Your New Chinese Mindset | Chinese Daily Podcasat',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 895,
      durationLabel: '14:55',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 245 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/q2rSKIHezSs.json',
      cuesCount: 245,
      cues: [
        {
          start: 6.87,
          end: 11.2,
          en: 'Hello everyone, welcome to a new episode of “Daily Chinese.”',
          zh: '大家好，欢迎收听新一期的《每天中文》。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yì qī de 《Měitiān Zhōngwén》.',
          vi: 'Xin chào mọi người, chào mừng đến với một tập mới của “Mỗi Ngày Trung Văn”.'
        },
        {
          start: 11.23,
          end: 12.96,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-nhkour8st8i',
      youtubeId: 'NhkOuR8sT8I',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-3 | 地道地问候健康 | How to Ask About Health in Chinese Like a Native | Chinese Daily Podcast',
      titleVi: 'HSK 1-3 | 地道地问候健康 | How to Ask About Health in Chinese Like a Native | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 899,
      durationLabel: '14:59',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 247 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/NhkOuR8sT8I.json',
      cuesCount: 247,
      cues: [
        {
          start: 7.43,
          end: 10.6,
          en: 'Hello everyone, welcome to a new episode of Chinese Daily.',
          zh: '大家好，欢迎收听新一期的《每天中文》。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yì qī de Měitiān Zhōngwén.',
          vi: 'Chào mọi người, chào mừng đến với tập mới của \'Mỗi Ngày Tiếng Trung\'.'
        },
        {
          start: 10.63,
          end: 11.73,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Mình là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-mrwle_3lmmm',
      youtubeId: 'MRwLE_3LmmM',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3-4| 你的朋友，你的未来 | How Friends Shape Your Life | Chinese Daily Podcast',
      titleVi: 'HSK 3-4| 你的朋友，你的未来 | How Friends Shape Your Life | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 941,
      durationLabel: '15:41',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 385 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/MRwLE_3LmmM.json',
      cuesCount: 385,
      cues: [
        {
          start: 7.7,
          end: 8.23,
          en: 'Li Ming,',
          zh: '李明,',
          pinyin: 'Lǐ Míng,',
          vi: 'Lý Minh,'
        },
        {
          start: 8.27,
          end: 11.77,
          en: 'I\'ve noticed I\'ve had a really big change recently,',
          zh: '我发现我最近有一个特别大的变化，',
          pinyin: 'Wǒ fāxiàn wǒ zuìjìn yǒu yí gè tèbié dà de biànhuà,',
          vi: 'Tôi phát hiện dạo này mình có một thay đổi đặc biệt lớn,'
        }
      ]
    },
    {
      id: 'ep-cdp-bjfvu2uppag',
      youtubeId: 'bJfVU2uPpAg',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-3| 听故事学成语：中国人的古老智慧 | Learn Chinese Idioms Through Stories',
      titleVi: 'HSK 1-3| 听故事学成语：中国人的古老智慧 | Learn Chinese Idioms Through Stories',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1297,
      durationLabel: '21:37',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 346 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/bJfVU2uPpAg.json',
      cuesCount: 346,
      cues: [
        {
          start: 7.37,
          end: 11,
          en: 'Hello everyone, welcome to a new episode of “Daily Chinese.”',
          zh: '大家好，欢迎收听新一期的“每天中文”。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yī qī de “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người, chào mừng đến với tập mới của “Mỗi Ngày Tiếng Trung”.'
        },
        {
          start: 11,
          end: 12.1,
          en: 'I’m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-rfautrhom5y',
      youtubeId: 'rFaUTrhom5Y',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-3 | 感觉生活很累？用跑步学中文 | Feeling Stuck? Start Running & Learn Chinese | Chinese Podcast',
      titleVi: 'HSK 1-3 | 感觉生活很累？用跑步学中文 | Feeling Stuck? Start Running & Learn Chinese | Chinese Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1176,
      durationLabel: '19:36',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 318 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/rFaUTrhom5Y.json',
      cuesCount: 318,
      cues: [
        {
          start: 7.63,
          end: 11.93,
          en: 'Li Ming, let me ask you a question.',
          zh: '李明，我问你一个问题。',
          pinyin: 'Lǐ Míng, wǒ wèn nǐ yí gè wèntí.',
          vi: 'Lý Minh, tôi hỏi cậu một câu nhé.'
        },
        {
          start: 11.93,
          end: 15.1,
          en: 'Huh? What question? Go ahead.',
          zh: '嗯？什么问题？你说。',
          pinyin: 'Ng? Shénme wèntí? Nǐ shuō.',
          vi: 'Hử? Câu hỏi gì? Cậu nói đi.'
        }
      ]
    },
    {
      id: 'ep-cdp-25qntxu6o3k',
      youtubeId: '25QNtxu6o3k',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-3: What is 中秋节? A Beginner\'s Guide to China\'s Mid-Autumn Festival | 什么是中秋节？新手指南',
      titleVi: 'HSK 1-3: What is 中秋节? A Beginner\'s Guide to China\'s Mid-Autumn Festival | 什么是中秋节？新手指南',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 816,
      durationLabel: '13:36',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 345 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/25QNtxu6o3k.json',
      cuesCount: 345,
      cues: [
        {
          start: 7.03,
          end: 10.6,
          en: 'Li Ming, look at the calendar quickly! Time really flies!',
          zh: '李明，你快看日历！时间过得真快啊！',
          pinyin: 'Lǐ Míng, nǐ kuài kàn rìlì! Shíjiān guò de zhēn kuài a!',
          vi: 'Lý Minh, cậu mau xem lịch đi! Thời gian trôi nhanh thật đấy!'
        },
        {
          start: 10.6,
          end: 12.3,
          en: 'What\'s wrong? Looking at the calendar all of a sudden.',
          zh: '怎么了？突然看日历。',
          pinyin: 'Zěnme le? Tūrán kàn rìlì.',
          vi: 'Sao thế? Tự nhiên lại xem lịch.'
        }
      ]
    },
    {
      id: 'ep-cdp-1rqdsl7re6e',
      youtubeId: '1rqdsL7RE6E',
      level: 'HSK 3–5',
      levelGroup: 'hsk4',
      title: 'HSK 3-5 | The Multitasking Trap: Are You a Multitasker or a Single-Tasker? 你是“多任务”还是“单任务”？',
      titleVi: 'HSK 3-5 | The Multitasking Trap: Are You a Multitasker or a Single-Tasker? 你是“多任务”还是“单任务”？',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 972,
      durationLabel: '16:12',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 296 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/1rqdsL7RE6E.json',
      cuesCount: 296,
      cues: [
        {
          start: 7.33,
          end: 11.83,
          en: 'Hello everyone, welcome to a new episode of Daily Chinese.',
          zh: '大家好，欢迎收听新一期的《每天中文》。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yì qī de “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người, chào mừng các bạn đến với tập mới của “Mỗi Ngày Tiếng Trung”.'
        },
        {
          start: 11.83,
          end: 13.06,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-xahfktydkm8',
      youtubeId: 'XAHfKtYdkM8',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-3: 你怎么去上班？ How to Talk About Transportation in Chinese',
      titleVi: 'HSK 1-3: 你怎么去上班？ How to Talk About Transportation in Chinese',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 954,
      durationLabel: '15:54',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 287 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/XAHfKtYdkM8.json',
      cuesCount: 287,
      cues: [
        {
          start: 6.83,
          end: 10.6,
          en: 'Li Ming, look, your coffee is almost cold,',
          zh: '李明，你快看，你这杯咖啡都快凉了，',
          pinyin: 'Lǐ Míng, nǐ kuài kàn, nǐ zhè bēi kāfēi dōu kuài liáng le,',
          vi: 'Lý Minh, bạn mau xem này, ly cà phê của bạn sắp nguội rồi,'
        },
        {
          start: 10.6,
          end: 12.33,
          en: 'Why haven\'t you taken a single sip?',
          zh: '你怎么一口都不喝？',
          pinyin: 'Nǐ zěnme yì kǒu dōu bù hē?',
          vi: 'Sao bạn một ngụm cũng không uống vậy?'
        }
      ]
    },
    {
      id: 'ep-cdp-jvfef_rhlxw',
      youtubeId: 'JVfef_rhLXw',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-3 | Relax & Learn Chinese with 3 Fairy Tales | 轻松学中文：小白兔、小老鼠和星星',
      titleVi: 'HSK 1-3 | Relax & Learn Chinese with 3 Fairy Tales | 轻松学中文：小白兔、小老鼠和星星',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1228,
      durationLabel: '20:28',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 447 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/JVfef_rhLXw.json',
      cuesCount: 447,
      cues: [
        {
          start: 7.23,
          end: 11.16,
          en: 'Li Ming, guess what happened this afternoon while I was organizing my bookshelf—',
          zh: '李明，你猜我今天下午整理书架的时候，',
          pinyin: 'Lǐ Míng, nǐ cāi wǒ jīntiān xiàwǔ zhěnglǐ shūjià de shíhou,',
          vi: 'Lý Minh, cậu đoán xem chiều nay lúc tớ sắp xếp giá sách,'
        },
        {
          start: 11.17,
          end: 13.33,
          en: 'what treasure did I come across?',
          zh: '翻到了什么宝贝？',
          pinyin: 'fān dào le shénme bǎobèi?',
          vi: 'tớ đã lật ra được bảo vật gì nào?'
        }
      ]
    },
    {
      id: 'ep-cdp-1zv-ivtppje',
      youtubeId: '1zv-ivTpPjE',
      level: 'HSK 4',
      levelGroup: 'hsk4',
      title: 'HSK 4-5 | 总是很累？可能是阴阳失衡了！| Always Tired? It Might Be Your Yin & Yang!',
      titleVi: 'HSK 4-5 | 总是很累？可能是阴阳失衡了！| Always Tired? It Might Be Your Yin & Yang!',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 845,
      durationLabel: '14:05',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 292 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/1zv-ivTpPjE.json',
      cuesCount: 292,
      cues: [
        {
          start: 7.23,
          end: 10.3,
          en: 'Hey, Li Ming, let me ask you a question.',
          zh: '哎，李明，我问你个问题。',
          pinyin: 'Āi, Lǐ Míng, wǒ wèn nǐ gè wèntí.',
          vi: 'Này, Lý Minh, tôi hỏi cậu một câu nhé.'
        },
        {
          start: 10.3,
          end: 15.27,
          en: 'Have you felt lately... like... your body is really strange?',
          zh: '你最近有没有觉得……就是……身体特别奇怪？',
          pinyin: 'Nǐ zuìjìn yǒu méiyǒu juéde…… jiùshì…… shēntǐ tèbié qíguài?',
          vi: 'Dạo này cậu có thấy... kiểu... cơ thể đặc biệt kỳ lạ không?'
        }
      ]
    },
    {
      id: 'ep-cdp-ydr4gaxzif0',
      youtubeId: 'yDr4gAxZif0',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-3 | How to Stay Motivated in Chinese Learning | 如何每天保持学习中文的动力？',
      titleVi: 'HSK 1-3 | How to Stay Motivated in Chinese Learning | 如何每天保持学习中文的动力？',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1109,
      durationLabel: '18:29',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 435 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/yDr4gAxZif0.json',
      cuesCount: 435,
      cues: [
        {
          start: 7.2,
          end: 11.13,
          en: 'Hello everyone, welcome to a new episode of “Daily Chinese.”',
          zh: '大家好，欢迎收听新一期的“每天中文”。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yī qī de “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người, chào mừng đến với tập mới của “Mỗi Ngày Tiếng Trung”.'
        },
        {
          start: 11.13,
          end: 12.1,
          en: 'I’m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-hbzuttfz-c8',
      youtubeId: 'HBzUTTfZ-C8',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1–3 | 成语故事 - Why Choose the Box over the Pearl? | Chinese Bedtime Stories',
      titleVi: 'HSK 1–3 | 成语故事 - Why Choose the Box over the Pearl? | Chinese Bedtime Stories',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1085,
      durationLabel: '18:05',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 382 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/HBzUTTfZ-C8.json',
      cuesCount: 382,
      cues: [
        {
          start: 6.6,
          end: 11.2,
          en: 'Li Ming, I did something very silly yesterday.',
          zh: '李明，我昨天做了一件很傻的事。',
          pinyin: 'Lǐ Míng, wǒ zuótiān zuò le yí jiàn hěn shǎ de shì.',
          vi: 'Lý Minh, hôm qua tôi đã làm một việc rất ngốc.'
        },
        {
          start: 11.23,
          end: 14.53,
          en: 'Oh? Tell me. What silly thing did you do?',
          zh: '哦？说来听听。你做什么傻事了？',
          pinyin: 'Ó? Shuō lái tīng tīng. Nǐ zuò shénme shǎ shì le?',
          vi: 'Ồ? Nói thử xem. Cậu đã làm việc ngốc gì vậy?'
        }
      ]
    },
    {
      id: 'ep-cdp-to9ilqpvjno',
      youtubeId: 'to9iLQPVJno',
      level: 'HSK 3–5',
      levelGroup: 'hsk4',
      title: 'HSK 3-5 | Why Chinese Youth Love Bubble Tea 为什么中国年轻人都爱喝奶茶？| Learn Chinese Podcast',
      titleVi: 'HSK 3-5 | Why Chinese Youth Love Bubble Tea 为什么中国年轻人都爱喝奶茶？| Learn Chinese Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 958,
      durationLabel: '15:58',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 373 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/to9iLQPVJno.json',
      cuesCount: 373,
      cues: [
        {
          start: 7.23,
          end: 9.83,
          en: 'Ah, Li Ming, I\'m back!',
          zh: '啊，李明，我回来了！',
          pinyin: 'Ā, Lǐ Míng, wǒ huílái le!',
          vi: 'A, Lý Minh, tớ về rồi đây!'
        },
        {
          start: 9.83,
          end: 12.16,
          en: 'Look what good thing I brought you!',
          zh: '你看我给你带了什么好东西！',
          pinyin: 'Nǐ kàn wǒ gěi nǐ dài le shénme hǎo dōngxi!',
          vi: 'Xem này, tớ mang cho cậu thứ gì ngon lắm đây!'
        }
      ]
    },
    {
      id: 'ep-cdp-02fh1f09kju',
      youtubeId: '02FH1F09kJU',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1–3 | 纸笔还是手机？Paper or Phone? How Chinese People Make To-Do Lists',
      titleVi: 'HSK 1–3 | 纸笔还是手机？Paper or Phone? How Chinese People Make To-Do Lists',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1084,
      durationLabel: '18:04',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 387 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/02FH1F09kJU.json',
      cuesCount: 387,
      cues: [
        {
          start: 7.2,
          end: 10.97,
          en: 'Hello everyone! This is Daily Chinese. I\'m Wang Yu.',
          zh: '大家好！这里是每天中文。我是王雨。',
          pinyin: 'Dàjiā hǎo! Zhèlǐ shì Měitiān Zhōngwén. Wǒ shì Wáng Yǔ.',
          vi: 'Xin chào mọi người! Đây là kênh Mỗi Ngày Trung Văn. Tôi là Vương Vũ.'
        },
        {
          start: 11,
          end: 12.87,
          en: 'Hello everyone! I\'m Li Ming.',
          zh: '大家好！我是李明。',
          pinyin: 'Dàjiā hǎo! Wǒ shì Lǐ Míng.',
          vi: 'Chào mọi người! Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-jycahy67pco',
      youtubeId: 'jycAHY67pco',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-3 | 合作的力量：三个中文晚安故事 | The Power of Cooperation | Chinese Bedtime Stories',
      titleVi: 'HSK 1-3 | 合作的力量：三个中文晚安故事 | The Power of Cooperation | Chinese Bedtime Stories',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1224,
      durationLabel: '20:24',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 452 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/jycAHY67pco.json',
      cuesCount: 452,
      cues: [
        {
          start: 7.43,
          end: 10.3,
          en: 'Li Ming, when I got off work today,',
          zh: '李明，我今天下班的时候，',
          pinyin: 'Lǐ Míng, wǒ jīntiān xiàbān de shíhou,',
          vi: 'Lý Minh, lúc tôi tan làm hôm nay,'
        },
        {
          start: 10.3,
          end: 13.1,
          en: 'I saw a few children playing in the park.',
          zh: '看到几个小孩子在公园里玩。',
          pinyin: 'kàndào jǐ ge xiǎoháizi zài gōngyuán lǐ wán.',
          vi: 'tôi thấy vài đứa trẻ đang chơi trong công viên.'
        }
      ]
    },
    {
      id: 'ep-cdp-rqruxjfpjve',
      youtubeId: 'rQRUXjFpjvE',
      level: 'HSK 4',
      levelGroup: 'hsk4',
      title: 'HSK 4 - 5: Why Can\'t We Connect? It\'s Not You, It\'s Your "Sanguan" (三观).',
      titleVi: 'HSK 4 - 5: Why Can\'t We Connect? It\'s Not You, It\'s Your "Sanguan" (三观).',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 893,
      durationLabel: '14:53',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 398 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/rQRUXjFpjvE.json',
      cuesCount: 398,
      cues: [
        {
          start: 7.13,
          end: 10.63,
          en: 'Hello everyone, welcome to a new episode of “Chinese Daily.”',
          zh: '大家好，欢迎收听新一期的“每天中文”。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yī qī de “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người, chào mừng nghe tập mới của “Mỗi Ngày Trung Văn”.'
        },
        {
          start: 10.63,
          end: 11.6,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-bckpg5omkue',
      youtubeId: 'bCKpG5OMKUE',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-3 | 不只是运气 Don’t Just Rely on Luck | Chinese Bedtime Story',
      titleVi: 'HSK 1-3 | 不只是运气 Don’t Just Rely on Luck | Chinese Bedtime Story',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1009,
      durationLabel: '16:49',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 472 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/bCKpG5OMKUE.json',
      cuesCount: 472,
      cues: [
        {
          start: 9.13,
          end: 14.76,
          en: 'Ah... Li Ming, I feel a bit tired today.',
          zh: '啊……李明，我今天觉得有点儿累。',
          pinyin: 'A…… Lǐ Míng, wǒ jīntiān juéde yǒudiǎnr lèi.',
          vi: 'A... Lý Minh, hôm nay tôi thấy hơi mệt.'
        },
        {
          start: 14.8,
          end: 17.67,
          en: 'What\'s wrong? You sound a bit low-energy.',
          zh: '怎么了？你听起来没什么精神。',
          pinyin: 'Zěnme le? Nǐ tīng qǐlái méi shénme jīngshén.',
          vi: 'Sao vậy? Nghe cậu không có tinh thần lắm.'
        }
      ]
    },
    {
      id: 'ep-cdp-axmazyilzka',
      youtubeId: 'axmAzYilZKA',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3–4 | 快节奏生活 vs 慢生活 | Fast Life vs Slow Life | 每天中文',
      titleVi: 'HSK 3–4 | 快节奏生活 vs 慢生活 | Fast Life vs Slow Life | 每天中文',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1174,
      durationLabel: '19:34',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 439 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/axmAzYilZKA.json',
      cuesCount: 439,
      cues: [
        {
          start: 7.23,
          end: 10.83,
          en: 'Hello everyone, welcome to a new episode of “Daily Chinese.”',
          zh: '大家好，欢迎收听新一期的“每天中文”。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yī qī de “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người, chào mừng nghe tập mới của “Mỗi Ngày Trung Văn”.'
        },
        {
          start: 10.83,
          end: 12.06,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-o5qauc7jx3o',
      youtubeId: 'O5QAuC7JX3o',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-3 | 学中文的“哭笑不得”错误  | Funny Mistakes Every Beginner Makes',
      titleVi: 'HSK 1-3 | 学中文的“哭笑不得”错误  | Funny Mistakes Every Beginner Makes',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1007,
      durationLabel: '16:47',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 441 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/O5QAuC7JX3o.json',
      cuesCount: 441,
      cues: [
        {
          start: 7.2,
          end: 9.6,
          en: '(laughs) I can\'t stop, Li Ming,',
          zh: '(笑)，不行了，李明，',
          pinyin: '(xiào), bù xíng le, Lǐ Míng,',
          vi: '(Cười) Không chịu nổi rồi, Lý Minh,'
        },
        {
          start: 9.6,
          end: 12.7,
          en: 'I just remembered something—it\'s so funny.',
          zh: '我刚想起来一件事，太好笑了。',
          pinyin: 'Wǒ gāng xiǎng qǐlái yī jiàn shì, tài hǎoxiào le.',
          vi: 'Tôi vừa nhớ ra một chuyện, buồn cười quá.'
        }
      ]
    },
    {
      id: 'ep-cdp--m0g0o7keec',
      youtubeId: '-M0G0O7KeEc',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2–3 | 坚持的力量 The Power of Perseverance | Chinese Bedtime Stories',
      titleVi: 'HSK 2–3 | 坚持的力量 The Power of Perseverance | Chinese Bedtime Stories',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1081,
      durationLabel: '18:01',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 387 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/-M0G0O7KeEc.json',
      cuesCount: 387,
      cues: [
        {
          start: 7.03,
          end: 11.33,
          en: 'Ugh, Li Ming, I kind of don\'t want to keep doing it.',
          zh: '唉，李明，我有点不想做了。',
          pinyin: 'Ài, Lǐ Míng, wǒ yǒu diǎn bù xiǎng zuò le.',
          vi: 'Ôi, Lý Minh, tôi hơi không muốn làm nữa.'
        },
        {
          start: 11.37,
          end: 14.74,
          en: 'What\'s wrong, Wang Yu? Aren\'t you learning to paint?',
          zh: '怎么了，王雨？你不是在学画画吗？',
          pinyin: 'Zěnme le, Wáng Yǔ? Nǐ bú shì zài xué huàhuà ma?',
          vi: 'Sao vậy, Vương Vũ? Cậu không phải đang học vẽ à?'
        }
      ]
    },
    {
      id: 'ep-cdp-yaeecv1jrjm',
      youtubeId: 'yaeECV1JRjM',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2-3 | 周末野餐对话  | Weekend Picnic Dialogue | Improve Your Mandarin Listening',
      titleVi: 'HSK 2-3 | 周末野餐对话  | Weekend Picnic Dialogue | Improve Your Mandarin Listening',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 823,
      durationLabel: '13:43',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 396 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/yaeECV1JRjM.json',
      cuesCount: 396,
      cues: [
        {
          start: 7.17,
          end: 9.17,
          en: 'Li Ming, quick, look at your phone.',
          zh: '李明，你快看手机，',
          pinyin: 'Lǐ Míng, nǐ kuài kàn shǒujī,',
          vi: 'Lý Minh, cậu mau xem điện thoại đi,'
        },
        {
          start: 9.17,
          end: 11.44,
          en: 'Look at the weather this weekend!',
          zh: '你看这个周末的天气！',
          pinyin: 'Nǐ kàn zhège zhōumò de tiānqì!',
          vi: 'Cậu xem thời tiết cuối tuần này đi!'
        }
      ]
    },
    {
      id: 'ep-cdp-_oeqqzrvfg8',
      youtubeId: '_oeqqZRVfG8',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3-4 | 用“断舍离”改变生活 | Stop Wasting Time Finding Things! | Chinese Listening Practice',
      titleVi: 'HSK 3-4 | 用“断舍离”改变生活 | Stop Wasting Time Finding Things! | Chinese Listening Practice',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1082,
      durationLabel: '18:02',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 310 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/_oeqqZRVfG8.json',
      cuesCount: 310,
      cues: [
        {
          start: 7.13,
          end: 8.7,
          en: 'Oh my god...',
          zh: '哎呀，我的天……',
          pinyin: 'Āiyā, wǒ de tiān...',
          vi: 'Ôi trời ơi...'
        },
        {
          start: 8.7,
          end: 12.3,
          en: 'Li Ming, wait for me a second, let me look for my transit card.',
          zh: '李明，你等我一下，我找找我的交通卡。',
          pinyin: 'Lǐ Míng, nǐ děng wǒ yíxià, wǒ zhǎozhao wǒ de jiāotōngkǎ.',
          vi: 'Lý Minh, đợi tôi một chút, tôi tìm thẻ giao thông của tôi.'
        }
      ]
    },
    {
      id: 'ep-cdp-zz3nw1hseog',
      youtubeId: 'Zz3nw1hSEog',
      level: 'HSK 1–3',
      levelGroup: 'hsk1-2',
      title: 'HSK 1–3 | 7 Things I Wish I Knew Before Learning Chinese | 学中文前我希望知道的7件事',
      titleVi: 'HSK 1–3 | 7 Things I Wish I Knew Before Learning Chinese | 学中文前我希望知道的7件事',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1223,
      durationLabel: '20:23',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 308 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/Zz3nw1hSEog.json',
      cuesCount: 308,
      cues: [
        {
          start: 6.67,
          end: 9.3,
          en: 'Li Ming, come quick and look at this photo.',
          zh: '李明，你快来看这张照片。',
          pinyin: 'Lǐ Míng, nǐ kuài lái kàn zhè zhāng zhàopiàn.',
          vi: 'Lý Minh, cậu mau đến xem bức ảnh này đi.'
        },
        {
          start: 9.33,
          end: 10.73,
          en: 'Let me see.',
          zh: '我看看。',
          pinyin: 'Wǒ kànkan.',
          vi: 'Để tôi xem nào.'
        }
      ]
    },
    {
      id: 'ep-cdp-asjuohj4-hq',
      youtubeId: 'asjuoHj4-HQ',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2–3 |  什么是真正的朋友？| What Makes a Real Friend? | Chinese Bedtime Stories',
      titleVi: 'HSK 2–3 |  什么是真正的朋友？| What Makes a Real Friend? | Chinese Bedtime Stories',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 775,
      durationLabel: '12:55',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 204 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/asjuoHj4-HQ.json',
      cuesCount: 204,
      cues: [
        {
          start: 6.67,
          end: 12.3,
          en: 'Hey, Li Ming, quick, look at your phone. This news... it\'s really sad.',
          zh: '哎，李明，你快看手机，这个新闻……真让人难过。',
          pinyin: 'Āi, Lǐ Míng, nǐ kuài kàn shǒujī, zhège xīnwén…… zhēn ràng rén nánguò.',
          vi: 'Này, Lý Minh, cậu mau xem điện thoại đi, tin tức này…… thật khiến người ta buồn.'
        },
        {
          start: 12.33,
          end: 13.66,
          en: 'What\'s wrong?',
          zh: '怎么了？',
          pinyin: 'Zěnme le?',
          vi: 'Sao thế?'
        }
      ]
    },
    {
      id: 'ep-cdp-do63hkal_gk',
      youtubeId: 'dO63hKal_Gk',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3 - 4 | Unlock the Secret of "Qi" (气) in Chinese Culture | 解锁中国文化中“气”的秘密',
      titleVi: 'HSK 3 - 4 | Unlock the Secret of "Qi" (气) in Chinese Culture | 解锁中国文化中“气”的秘密',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1061,
      durationLabel: '17:41',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 288 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/dO63hKal_Gk.json',
      cuesCount: 288,
      cues: [
        {
          start: 6.67,
          end: 12.4,
          en: 'Li Ming, when I left home this morning, I passed by the park next to our house,',
          zh: '李明，我今天早上出门的时候，路过我们家旁边的那个公园，',
          pinyin: 'Lǐ Míng, wǒ jīntiān zǎoshang chūmén de shíhou, lùguò wǒmen jiā pángbiān de nàge gōngyuán,',
          vi: 'Lý Minh, sáng nay lúc tôi ra khỏi nhà, đi ngang qua công viên bên cạnh nhà chúng tôi,'
        },
        {
          start: 12.4,
          end: 15.43,
          en: 'and saw something really interesting.',
          zh: '看到一件特别有意思的事情。',
          pinyin: 'Kàndào yí jiàn tèbié yǒu yìsi de shìqing.',
          vi: 'và thấy một chuyện đặc biệt thú vị.'
        }
      ]
    },
    {
      id: 'ep-cdp-hq4dxhjlrfc',
      youtubeId: 'Hq4dXHjlRFc',
      level: 'HSK 1–2',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-2 | 这个中文习惯改变你的一天 | The Secret Chinese Habit That CHANGES Your Day',
      titleVi: 'HSK 1-2 | 这个中文习惯改变你的一天 | The Secret Chinese Habit That CHANGES Your Day',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 758,
      durationLabel: '12:38',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 177 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/Hq4dXHjlRFc.json',
      cuesCount: 177,
      cues: [
        {
          start: 6.13,
          end: 9.86,
          en: '(Humming softly)',
          zh: '（轻轻地哼着歌）',
          pinyin: '(Qīngqīng de hēng zhe gē)',
          vi: '(Khẽ ngân nga hát)'
        },
        {
          start: 9.87,
          end: 14.24,
          en: 'Wang Yu, you seem especially happy today? Did something good happen?',
          zh: '王雨，你今天好像特别高兴？有什么好事吗？',
          pinyin: 'Wáng Yǔ, nǐ jīntiān hǎoxiàng tèbié gāoxìng? Yǒu shénme hǎoshì ma?',
          vi: 'Vương Vũ, hôm nay cậu có vẻ đặc biệt vui? Có chuyện gì tốt à?'
        }
      ]
    },
    {
      id: 'ep-cdp-0knmtaoml9e',
      youtubeId: '0KnmTAOMl9E',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3-4 | 充满能量的秘密：早餐 | Your Secret to a Full Day of Energy: Breakfast',
      titleVi: 'HSK 3-4 | 充满能量的秘密：早餐 | Your Secret to a Full Day of Energy: Breakfast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1074,
      durationLabel: '17:54',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 276 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/0KnmTAOMl9E.json',
      cuesCount: 276,
      cues: [
        {
          start: 6.67,
          end: 13.34,
          en: 'Ah, so delicious. I think the most important meal of the day is breakfast.',
          zh: '啊，真好吃。我觉得，一天中最重要的一顿饭，就是早饭。',
          pinyin: 'A, zhēn hǎo chī. Wǒ juéde, yì tiān zhōng zuì zhòngyào de yí dùn fàn, jiùshì zǎofàn.',
          vi: 'A, ngon thật. Tôi nghĩ bữa ăn quan trọng nhất trong ngày chính là bữa sáng.'
        },
        {
          start: 13.37,
          end: 17.97,
          en: 'After a good breakfast, I feel full of energy all day.',
          zh: '吃完一顿好的早饭，感觉一整天都充满了能量。',
          pinyin: 'Chī wán yí dùn hǎo de zǎofàn, gǎnjué yì zhěng tiān dōu chōngmǎn le néngliàng.',
          vi: 'Ăn xong một bữa sáng ngon, tôi cảm thấy cả ngày tràn đầy năng lượng.'
        }
      ]
    },
    {
      id: 'ep-cdp-dqbzsl3om1i',
      youtubeId: 'DQBzSl3OM1I',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK Level 2–3 | 诚实的故事：三个温暖的晚安故事 | Stories of Honesty | Chinese Bedtime Stories',
      titleVi: 'HSK Level 2–3 | 诚实的故事：三个温暖的晚安故事 | Stories of Honesty | Chinese Bedtime Stories',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 948,
      durationLabel: '15:48',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 210 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/DQBzSl3OM1I.json',
      cuesCount: 210,
      cues: [
        {
          start: 6.67,
          end: 11.97,
          en: 'Li Ming, today I saw a child crying in a shop.',
          zh: '李明，我今天看到一个小孩子，他在商店里哭。',
          pinyin: 'Lǐ Míng, wǒ jīntiān kàndào yí gè xiǎoháizi, tā zài shāngdiàn lǐ kū.',
          vi: 'Minh, hôm nay tôi thấy một đứa trẻ, nó đang khóc trong cửa hàng.'
        },
        {
          start: 12,
          end: 14.53,
          en: 'His mother wouldn\'t buy him a toy.',
          zh: '他妈妈不给他买玩具。',
          pinyin: 'Tā māma bù gěi tā mǎi wánjù.',
          vi: 'Mẹ cậu bé không mua đồ chơi cho cậu ấy.'
        }
      ]
    },
    {
      id: 'ep-cdp-tqksife-y0g',
      youtubeId: 'tQKsIFE-Y0g',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3 - 4 | 中国餐桌礼仪 | Chinese Table Manners | Avoid These Common Mistakes!',
      titleVi: 'HSK 3 - 4 | 中国餐桌礼仪 | Chinese Table Manners | Avoid These Common Mistakes!',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 979,
      durationLabel: '16:19',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 216 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/tQKsIFE-Y0g.json',
      cuesCount: 216,
      cues: [
        {
          start: 6.13,
          end: 12.26,
          en: 'Oh, Li Ming, I just got back from a family gathering and ate way too much! My belly is completely round.',
          zh: '哎呀，李明，我刚从一个家庭聚会回来，吃得太饱了！肚子都圆了。',
          pinyin: 'Āiyā, Lǐ Míng, wǒ gāng cóng yí ge jiātíng jùhuì huílái, chī de tài bǎo le! Dùzi dōu yuán le.',
          vi: 'Ôi, Lý Minh, tớ vừa đi dự một buổi họp mặt gia đình về, ăn no căng bụng luôn! Bụng tròn vo rồi.'
        },
        {
          start: 12.3,
          end: 17.53,
          en: 'Hearing how happy you sound, I can tell you must have eaten a lot of good food today.',
          zh: '听你这开心的声音，就知道今天肯定吃了不少好东西。',
          pinyin: 'Tīng nǐ zhè kāixīn de shēngyīn, jiù zhīdào jīntiān kěndìng chī le bùshǎo hǎo dōngxi.',
          vi: 'Nghe giọng vui vẻ của cậu là biết hôm nay chắc chắn đã ăn không ít món ngon rồi.'
        }
      ]
    },
    {
      id: 'ep-cdp-uu6btipoi4k',
      youtubeId: 'uU6bTIPOi4k',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2 – 3 | 周末安排：一起去看电影吧！Weekend Plan: Go to the Movies',
      titleVi: 'HSK 2 – 3 | 周末安排：一起去看电影吧！Weekend Plan: Go to the Movies',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 913,
      durationLabel: '15:13',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 249 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/uU6bTIPOi4k.json',
      cuesCount: 249,
      cues: [
        {
          start: 6.13,
          end: 10.33,
          en: 'Ah... Li Ming, look at me.',
          zh: '啊……李明，你看我。',
          pinyin: 'À…… Lǐ Míng, nǐ kàn wǒ.',
          vi: 'À…… Lý Minh, anh nhìn em này.'
        },
        {
          start: 10.37,
          end: 13.54,
          en: 'I\'m looking. Wang Yu, what\'s wrong?',
          zh: '我看着呢。王雨，你怎么了？',
          pinyin: 'Wǒ kàn zhe ne. Wáng Yǔ, nǐ zěnme le?',
          vi: 'Tôi đang nhìn đây. Vương Vũ, cậu sao vậy?'
        }
      ]
    },
    {
      id: 'ep-cdp-y5tlbhbe3hu',
      youtubeId: 'y5tLbhBE3hU',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3 - 4 | 网上购物 VS 实体店？你会怎么选？| Online Shopping vs In-Store?',
      titleVi: 'HSK 3 - 4 | 网上购物 VS 实体店？你会怎么选？| Online Shopping vs In-Store?',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 864,
      durationLabel: '14:24',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 243 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/y5tLbhBE3hU.json',
      cuesCount: 243,
      cues: [
        {
          start: 6.13,
          end: 9.63,
          en: 'Hello everyone, welcome to a new episode of “Daily Chinese.”',
          zh: '大家好，欢迎收听新一期的“每天中文”。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yī qī de “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người, chào mừng đến với tập mới của “Mỗi Ngày Trung Văn”.'
        },
        {
          start: 9.67,
          end: 10.6,
          en: 'I’m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-8mtp5dzofgm',
      youtubeId: '8MTp5dZoFGM',
      level: 'HSK 1–2',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-2｜用中文介绍自己！Self-introduction in Chinese for Beginners',
      titleVi: 'HSK 1-2｜用中文介绍自己！Self-introduction in Chinese for Beginners',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 973,
      durationLabel: '16:13',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 230 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/8MTp5dZoFGM.json',
      cuesCount: 230,
      cues: [
        {
          start: 6.13,
          end: 8.6,
          en: 'Li Ming, I\'m so happy today!',
          zh: '李明，我今天太开心了！',
          pinyin: 'Lǐ Míng, wǒ jīntiān tài kāixīn le!',
          vi: 'Lý Minh, hôm nay mình vui quá!'
        },
        {
          start: 8.6,
          end: 10.53,
          en: 'I made a new friend!',
          zh: '我认识了一个新朋友！',
          pinyin: 'Wǒ rènshi le yí ge xīn péngyou!',
          vi: 'Mình quen được một người bạn mới!'
        }
      ]
    },
    {
      id: 'ep-cdp-uv8kncxpels',
      youtubeId: 'uv8KNcXpels',
      level: 'HSK 1–2',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-2 每日学习法｜从零开始学中文也不难｜Easy Chinese Study Tips for Beginners',
      titleVi: 'HSK 1-2 每日学习法｜从零开始学中文也不难｜Easy Chinese Study Tips for Beginners',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 959,
      durationLabel: '15:59',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 259 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/uv8KNcXpels.json',
      cuesCount: 259,
      cues: [
        {
          start: 6.13,
          end: 9.2,
          en: 'Hello everyone! Welcome to "Daily Chinese." I\'m Li Ming.',
          zh: '大家好！欢迎来到“每天中文”。我是李明。',
          pinyin: 'Dàjiā hǎo! Huānyíng lái dào “Měitiān Zhōngwén”. Wǒ shì Lǐ Míng.',
          vi: 'Xin chào mọi người! Chào mừng đến với “Mỗi Ngày Tiếng Trung”. Tôi là Lý Minh.'
        },
        {
          start: 9.23,
          end: 10.76,
          en: 'Hello everyone! I\'m Wang Yu.',
          zh: '大家好！我是王雨。',
          pinyin: 'Dàjiā hǎo! Wǒ shì Wáng Yǔ.',
          vi: 'Xin chào mọi người! Tôi là Vương Vũ.'
        }
      ]
    },
    {
      id: 'ep-cdp-o2zwlcv2vza',
      youtubeId: 'O2zWlcv2vZA',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: '【Slow Chinese】 HSK 2-3 | 周一很累？秘密在你的周末！| Tired on Monday? The Secret is Your Weekend!',
      titleVi: '【Slow Chinese】 HSK 2-3 | 周一很累？秘密在你的周末！| Tired on Monday? The Secret is Your Weekend!',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 773,
      durationLabel: '12:53',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 176 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/O2zWlcv2vZA.json',
      cuesCount: 176,
      cues: [
        {
          start: 6.13,
          end: 11.16,
          en: 'Sigh... Li Ming, look, it\'s Monday again.',
          zh: '唉……李明，你看，又是星期一了。',
          pinyin: 'Āi... Lǐ Míng, nǐ kàn, yòu shì xīngqīyī le.',
          vi: 'Ôi... Lý Minh, cậu xem, lại là thứ Hai rồi.'
        },
        {
          start: 11.2,
          end: 13.13,
          en: 'Good morning, Wang Yu.',
          zh: '早上好，王雨。',
          pinyin: 'Zǎoshang hǎo, Wáng Yǔ.',
          vi: 'Chào buổi sáng, Vương Vũ.'
        }
      ]
    },
    {
      id: 'ep-cdp-nxafrmactzs',
      youtubeId: 'nxAfRmACtZs',
      level: 'HSK 1–2',
      levelGroup: 'hsk1-2',
      title: 'HSK 1–2 | 用中文讲故事 | Listen to Chinese Bedtime Stories for Sleep & Learning',
      titleVi: 'HSK 1–2 | 用中文讲故事 | Listen to Chinese Bedtime Stories for Sleep & Learning',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1186,
      durationLabel: '19:46',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 241 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/nxAfRmACtZs.json',
      cuesCount: 241,
      cues: [
        {
          start: 6.13,
          end: 9.53,
          en: 'Ah... I\'m a bit sleepy, Li Ming.',
          zh: '啊……我有点儿困了，李明。',
          pinyin: 'A…… wǒ yǒu diǎnr kùn le, Lǐ Míng.',
          vi: 'A... mình hơi buồn ngủ rồi, Lý Minh.'
        },
        {
          start: 9.57,
          end: 15.14,
          en: 'Sleepy? Wang Yu, look, it\'s still early, and the sky hasn\'t even darkened yet.',
          zh: '困了？王雨，你看，现在时间还早呢，天还没黑。',
          pinyin: 'Kùn le? Wáng Yǔ, nǐ kàn, xiànzài shíjiān hái zǎo ne, tiān hái méi hēi.',
          vi: 'Buồn ngủ à? Vương Vũ, cậu xem, bây giờ còn sớm mà, trời còn chưa tối.'
        }
      ]
    },
    {
      id: 'ep-cdp-tmc-p1m-3fc',
      youtubeId: 'tmC-p1M-3Fc',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2-3 | 不只是语言，还是文化！Learn Culture Through Everyday Chinese',
      titleVi: 'HSK 2-3 | 不只是语言，还是文化！Learn Culture Through Everyday Chinese',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 836,
      durationLabel: '13:56',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 195 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/tmC-p1M-3Fc.json',
      cuesCount: 195,
      cues: [
        {
          start: 6.13,
          end: 8.9,
          en: 'Li Ming, I\'m a bit unhappy today.',
          zh: '李明，我今天有点儿不高兴。',
          pinyin: 'Lǐ Míng, wǒ jīntiān yǒudiǎnr bù gāoxìng.',
          vi: 'Lý Minh, hôm nay tôi hơi không vui.'
        },
        {
          start: 8.93,
          end: 14.5,
          en: 'What\'s wrong, Wang Yu? You really don\'t look happy. What happened?',
          zh: '怎么了，王雨？你看起来真的不太高兴。发生什么事了？',
          pinyin: 'Zěnme le, Wáng Yǔ? Nǐ kàn qǐlái zhēnde bútài gāoxìng. Fāshēng shénme shì le?',
          vi: 'Sao vậy, Vương Vũ? Cậu trông thật sự không vui lắm. Có chuyện gì xảy ra à?'
        }
      ]
    },
    {
      id: 'ep-cdp-2eythzkr8w8',
      youtubeId: '2EythZkR8w8',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2 - 3 | How Do You Recharge on Weekends? | 你的周末“充电”方式是什么？',
      titleVi: 'HSK 2 - 3 | How Do You Recharge on Weekends? | 你的周末“充电”方式是什么？',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 726,
      durationLabel: '12:06',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 146 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/2EythZkR8w8.json',
      cuesCount: 146,
      cues: [
        {
          start: 6.13,
          end: 13.63,
          en: 'Ah, Li Ming, look, it\'s five in the afternoon now. Today is Friday! Are you happy?',
          zh: '啊，李明，你看，现在下午五点了。今天星期五了！你高不高兴？',
          pinyin: 'A, Lǐ Míng, nǐ kàn, xiànzài xiàwǔ wǔ diǎn le. Jīntiān xīngqīwǔ le! Nǐ gāo bu gāoxìng?',
          vi: 'À, Lý Minh, cậu xem, bây giờ là 5 giờ chiều rồi. Hôm nay là thứ Sáu rồi! Cậu có vui không?'
        },
        {
          start: 13.67,
          end: 19.87,
          en: 'Haha, Wang Yu, I can see you\'re very happy. Yeah, I\'m very happy too.',
          zh: '哈哈，王雨，我看你非常高兴。是啊，我也很高兴。',
          pinyin: 'Hāhā, Wáng Yǔ, wǒ kàn nǐ fēicháng gāoxìng. Shì a, wǒ yě hěn gāoxìng.',
          vi: 'Haha, Vương Vũ, tớ thấy cậu rất vui. Đúng vậy, tớ cũng rất vui.'
        }
      ]
    },
    {
      id: 'ep-cdp-0c5udgmvumc',
      youtubeId: '0C5uDGMVumc',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3 - 4 | 呼吸和声调：说好中文的第一步 | Breathing & Tones: The First Step to Speak Chinese Well',
      titleVi: 'HSK 3 - 4 | 呼吸和声调：说好中文的第一步 | Breathing & Tones: The First Step to Speak Chinese Well',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 899,
      durationLabel: '14:59',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 226 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/0C5uDGMVumc.json',
      cuesCount: 226,
      cues: [
        {
          start: 6.13,
          end: 7.76,
          en: 'Li Ming, wait a moment.',
          zh: '李明，你等一下。',
          pinyin: 'Lǐ Míng, nǐ děng yíxià.',
          vi: 'Lý Minh, bạn đợi một chút.'
        },
        {
          start: 7.8,
          end: 9.6,
          en: 'What\'s wrong, Wang Yu?',
          zh: '怎么了，王雨？',
          pinyin: 'Zěnme le, Wáng Yǔ?',
          vi: 'Sao vậy, Vương Vũ?'
        }
      ]
    },
    {
      id: 'ep-cdp-xdpsirpleoq',
      youtubeId: 'XDpsIrpLEOQ',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2-3 | 问路时怎么说？Learn How to Ask for Directions in Chinese!',
      titleVi: 'HSK 2-3 | 问路时怎么说？Learn How to Ask for Directions in Chinese!',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 859,
      durationLabel: '14:19',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 199 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/XDpsIrpLEOQ.json',
      cuesCount: 199,
      cues: [
        {
          start: 6.13,
          end: 9.6,
          en: 'Oh no, Li Ming, I got lost again yesterday!',
          zh: '哎呀，李明，我昨天又迷路了！',
          pinyin: 'Āiyā, Lǐ Míng, wǒ zuótiān yòu mílù le!',
          vi: 'Ôi trời, Lý Minh, hôm qua tôi lại bị lạc đường nữa rồi!'
        },
        {
          start: 9.63,
          end: 14.43,
          en: 'Lost again? Why do you always get lost? Where were you going this time?',
          zh: '又迷路了？你怎么总是迷路？这次是去哪儿了？',
          pinyin: 'Yòu mílù le? Nǐ zěnme zǒngshì mílù? Zhè cì shì qù nǎr le?',
          vi: 'Lại lạc đường nữa à? Sao cậu cứ lạc đường hoài vậy? Lần này đi đâu thế?'
        }
      ]
    },
    {
      id: 'ep-cdp-wzdej3logc4',
      youtubeId: 'wZDej3Logc4',
      level: 'HSK 3+',
      levelGroup: 'hsk3',
      title: 'HSK 3 - 4| 慢慢吃，对身体好！Why You Should Eat Slowly – Daily Chinese Podcast',
      titleVi: 'HSK 3 - 4| 慢慢吃，对身体好！Why You Should Eat Slowly – Daily Chinese Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 868,
      durationLabel: '14:28',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 244 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/wZDej3Logc4.json',
      cuesCount: 244,
      cues: [
        {
          start: 6.13,
          end: 9.75,
          en: 'Hello everyone, welcome to “Daily Chinese”. I’m Li Ming.',
          zh: '大家好，欢迎来到“每天中文”。我是李明。',
          pinyin: 'Dàjiā hǎo, huānyíng lái dào “Měitiān Zhōngwén”. Wǒ shì Lǐ Míng.',
          vi: 'Xin chào mọi người, chào mừng đến với “Mỗi Ngày Tiếng Trung”. Tôi là Lý Minh.'
        },
        {
          start: 9.77,
          end: 11.69,
          en: 'Hello everyone, I’m Wang Yu.',
          zh: '大家好，我是王雨。',
          pinyin: 'Dàjiā hǎo, wǒ shì Wáng Yǔ.',
          vi: 'Xin chào mọi người, tôi là Vương Vũ.'
        }
      ]
    },
    {
      id: 'ep-cdp-3k0d2hhyi04',
      youtubeId: '3K0D2hHYi04',
      level: 'HSK 1–2',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-2 | 中文对话：聊聊你的上个周末 | Talk About Your Weekend in Chinese',
      titleVi: 'HSK 1-2 | 中文对话：聊聊你的上个周末 | Talk About Your Weekend in Chinese',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 784,
      durationLabel: '13:04',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 205 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/3K0D2hHYi04.json',
      cuesCount: 205,
      cues: [
        {
          start: 6.13,
          end: 10.36,
          en: 'Sigh... Li Ming, good morning.',
          zh: '唉…… 李明，早上好。',
          pinyin: 'Āi…… Lǐ Míng, zǎoshang hǎo.',
          vi: 'Haiz... Lý Minh, chào buổi sáng.'
        },
        {
          start: 10.4,
          end: 12.4,
          en: 'Good morning, Wang Yu.',
          zh: '早上好，王雨。',
          pinyin: 'Zǎoshang hǎo, Wáng Yǔ.',
          vi: 'Chào buổi sáng, Vương Vũ.'
        }
      ]
    },
    {
      id: 'ep-cdp-gr-pvrnuija',
      youtubeId: 'gr-PvRnUIjA',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'HSK 2 - 3 | How to Express Your Feelings in Chinese?',
      titleVi: 'HSK 2 - 3 | How to Express Your Feelings in Chinese?',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1003,
      durationLabel: '16:43',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 217 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/gr-PvRnUIjA.json',
      cuesCount: 217,
      cues: [
        {
          start: 6.13,
          end: 8.13,
          en: 'Li Ming, you... what\'s wrong?',
          zh: '李明，你……怎么了？',
          pinyin: 'Lǐ Míng, nǐ……zěnme le?',
          vi: 'Lý Minh, bạn……sao vậy?'
        },
        {
          start: 8.13,
          end: 11.36,
          en: 'You haven\'t said a word since this morning.',
          zh: '你今天从早上到现在，一句话都没说。',
          pinyin: 'Nǐ jīntiān cóng zǎoshang dào xiànzài, yí jù huà dōu méi shuō.',
          vi: 'Hôm nay từ sáng đến giờ, bạn chẳng nói câu nào.'
        }
      ]
    },
    {
      id: 'ep-cdp-dvry3l9ojq4',
      youtubeId: 'DVRy3l9ojq4',
      level: 'HSK 1–2',
      levelGroup: 'hsk1-2',
      title: 'HSK 1–2 | 为什么学了很久还是不会说中文？| Why You Still Can’t Speak Chinese?',
      titleVi: 'HSK 1–2 | 为什么学了很久还是不会说中文？| Why You Still Can’t Speak Chinese?',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1137,
      durationLabel: '18:57',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 352 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/DVRy3l9ojq4.json',
      cuesCount: 352,
      cues: [
        {
          start: 6.13,
          end: 8.56,
          en: 'Hello everyone! Welcome to \'Chinese Daily\'!',
          zh: '大家好！欢迎来到“每天中文”！',
          pinyin: 'Dàjiā hǎo! Huānyíng láidào “Měitiān Zhōngwén”!',
          vi: 'Xin chào mọi người! Chào mừng đến với \'Mỗi ngày tiếng Trung\'!'
        },
        {
          start: 8.6,
          end: 11.5,
          en: 'I\'m your friend, Wang Yu.',
          zh: '我是你们的朋友，王雨。',
          pinyin: 'Wǒ shì nǐmen de péngyou, Wáng Yǔ.',
          vi: 'Tôi là bạn của các bạn, Vương Vũ.'
        }
      ]
    },
    {
      id: 'ep-cdp-limox_6yz2m',
      youtubeId: 'LIMOX_6yZ2M',
      level: 'HSK 1–2',
      levelGroup: 'hsk1-2',
      title: 'HSK 1-2 | 每天读10页中文方法 | How to Read 10 Chinese Pages Daily?',
      titleVi: 'HSK 1-2 | 每天读10页中文方法 | How to Read 10 Chinese Pages Daily?',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1443,
      durationLabel: '24:03',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 403 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/LIMOX_6yZ2M.json',
      cuesCount: 403,
      cues: [
        {
          start: 6.13,
          end: 10.1,
          en: 'Hello everyone, welcome to a new episode of "Daily Chinese."',
          zh: '大家好，欢迎收听新一期的《每天中文》。',
          pinyin: 'Dàjiā hǎo, huānyíng shōutīng xīn yī qī de “Měitiān Zhōngwén”.',
          vi: 'Xin chào mọi người, chào mừng các bạn đến với tập mới của “Mỗi Ngày Trung Văn”.'
        },
        {
          start: 10.13,
          end: 11.36,
          en: 'I\'m Li Ming.',
          zh: '我是李明。',
          pinyin: 'Wǒ shì Lǐ Míng.',
          vi: 'Tôi là Lý Minh.'
        }
      ]
    },
    {
      id: 'ep-cdp-o_kkptuqpy8',
      youtubeId: 'O_kkptuQPY8',
      level: 'HSK 1–2',
      levelGroup: 'hsk1-2',
      title: 'HSK 1–2 | Chinese Speaking Practice | Talking About Food and Feelings',
      titleVi: 'HSK 1–2 | Chinese Speaking Practice | Talking About Food and Feelings',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 995,
      durationLabel: '16:35',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 171 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/O_kkptuQPY8.json',
      cuesCount: 171,
      cues: [
        {
          start: 6.13,
          end: 13.76,
          en: 'Li Ming, I smell something really delicious from your office! Did you go eat something good at noon? Tell me quick, what did you eat?',
          zh: '李明，我闻到你办公室有好香的味道！你中午是不是去吃好吃的了？快说，你吃了什么？',
          pinyin: 'Lǐ Míng, wǒ wén dào nǐ bàngōngshì yǒu hǎo xiāng de wèidào! Nǐ zhōngwǔ shì bu shì qù chī hǎochī de le? Kuài shuō, nǐ chī le shénme?',
          vi: 'Lý Minh, tôi ngửi thấy trong văn phòng của anh có mùi rất thơm! Trưa nay anh có đi ăn món gì ngon không? Nói mau, anh đã ăn gì?'
        },
        {
          start: 13.8,
          end: 20.83,
          en: 'Haha, you have a good nose. I went to eat with a friend at noon. We went to a new noodle shop.',
          zh: '哈哈，你的鼻子真好。我中午是和一个朋友去吃了饭。我们去了一家新的面馆。',
          pinyin: 'Hāhā, nǐ de bízi zhēn hǎo. Wǒ zhōngwǔ shì hé yí ge péngyou qù chī le fàn. Wǒmen qù le yì jiā xīn de miànguǎn.',
          vi: 'Haha, mũi anh thật thính. Trưa nay tôi đi ăn với một người bạn. Chúng tôi đến một quán mì mới.'
        }
      ]
    },
    {
      id: 'ep-cdp-kn3ygmvew4u',
      youtubeId: 'KN3YgmVew4U',
      level: 'HSK 1–2',
      levelGroup: 'hsk1-2',
      title: 'HSK 1–2 | Try these 4 simple changes to make learning Chinese easy and fun',
      titleVi: 'HSK 1–2 | Try these 4 simple changes to make learning Chinese easy and fun',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1123,
      durationLabel: '18:43',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 227 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/KN3YgmVew4U.json',
      cuesCount: 227,
      cues: [
        {
          start: 6.13,
          end: 12,
          en: 'Li Ming, you\'re looking at that little notebook of yours again. What do you write in it? I\'m curious.',
          zh: '李明，你又在看你的那个小本子。你的本子上写的都是什么？我很好奇。',
          pinyin: 'Lǐ Míng, nǐ yòu zài kàn nǐ de nà ge xiǎo běnzi. Nǐ de běnzi shàng xiě de dōu shì shénme? Wǒ hěn hàoqí.',
          vi: 'Lý Minh, cậu lại đang xem cái cuốn sổ nhỏ đó của cậu rồi. Trên sổ cậu viết những gì thế? Tôi rất tò mò.'
        },
        {
          start: 12.13,
          end: 14.6,
          en: 'Haha, Wang Yu, you\'re here.',
          zh: '哈哈，王雨，你来了。',
          pinyin: 'Hāhā, Wáng Yǔ, nǐ lái le.',
          vi: 'Haha, Vương Vũ, cậu đến rồi.'
        }
      ]
    },
    {
      id: 'ep-cdp-myqrqvbr8vk',
      youtubeId: 'MYQrQvbR8Vk',
      level: 'HSK 1–2',
      levelGroup: 'hsk1-2',
      title: 'HSK 1–2 | 我的⼀天 My Daily Routine | Learn Everyday Chinese through Real Conversations',
      titleVi: 'HSK 1–2 | 我的⼀天 My Daily Routine | Learn Everyday Chinese through Real Conversations',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 801,
      durationLabel: '13:21',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 121 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/MYQrQvbR8Vk.json',
      cuesCount: 121,
      cues: [
        {
          start: 6,
          end: 10.63,
          en: 'Hello everyone! Welcome to a new episode of “Chinese Every Day.” I\'m Li Ming.',
          zh: '大家好！欢迎收听新一期的《每天中文》。我是李明。',
          pinyin: 'Dàjiā hǎo! Huānyíng shōutīng xīn yī qī de 《Měitiān Zhōngwén》. Wǒ shì Lǐ Míng.',
          vi: 'Xin chào mọi người! Chào mừng đến với tập mới của “Mỗi Ngày Tiếng Trung”. Tôi là Lý Minh.'
        },
        {
          start: 11.27,
          end: 14.87,
          en: 'Hello everyone! I\'m Wang Yu. Glad to meet you all again!',
          zh: '大家好！我是王雨。很高兴又和大家见面了！',
          pinyin: 'Dàjiā hǎo! Wǒ shì Wáng Yǔ. Hěn gāoxìng yòu hé dàjiā jiànmiàn le!',
          vi: 'Xin chào mọi người! Tôi là Vương Vũ. Rất vui lại được gặp mọi người!'
        }
      ]
    },
    {
      id: 'ep-cdp-vzygfurgonq',
      youtubeId: 'VZygFUrGONQ',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'How to Train Your Brain to Think in Chinese? | 学会用中文思考！每天中文 | Chinese Daily Podcast',
      titleVi: 'How to Train Your Brain to Think in Chinese? | 学会用中文思考！每天中文 | Chinese Daily Podcast',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1305,
      durationLabel: '21:45',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 371 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/VZygFUrGONQ.json',
      cuesCount: 371,
      cues: [
        {
          start: 6,
          end: 9.7,
          en: 'Hi everyone! Welcome to \'Daily Chinese\'. I\'m Li Ming.',
          zh: '大家好！欢迎收听“每天中文”。我是李明。',
          pinyin: 'Dàjiā hǎo! Huānyíng shōutīng “Měitiān Zhōngwén”. Wǒ shì Lǐ Míng.',
          vi: 'Chào mọi người! Chào mừng các bạn đến với “Mỗi ngày tiếng Trung”. Tôi là Lý Minh.'
        },
        {
          start: 10.17,
          end: 11.47,
          en: 'Hi everyone! I\'m Wang Yu.',
          zh: '大家好！我是王雨。',
          pinyin: 'Dàjiā hǎo! Wǒ shì Wáng Yǔ.',
          vi: 'Chào mọi người! Tôi là Vương Vũ.'
        }
      ]
    },
    {
      id: 'ep-cdp-xbr_xerk9hs',
      youtubeId: 'XBr_XERk9hs',
      level: 'HSK 2–4',
      levelGroup: 'hsk3',
      title: 'Walk & Learn Chinese with Podcasts | 散步听播客的学习技巧 | Beginner Level',
      titleVi: 'Walk & Learn Chinese with Podcasts | 散步听播客的学习技巧 | Beginner Level',
      channel: 'Chinese Daily Podcast',
      channelName: 'Chinese Daily Podcast',
      channelHandle: '@ChineseDailyPodcast',
      channelId: 'UCyYT-HdG1FXua6_vwyXNqhg',
      channelUrl: 'https://www.youtube.com/@ChineseDailyPodcast',
      durationSec: 1490,
      durationLabel: '24:50',
      topic: 'Podcast HSK hằng ngày',
      note: 'Trọn bộ 274 câu script 4 lớp Giản thể · Pinyin · Việt · Anh từ kênh @ChineseDailyPodcast.',
      defaultMaskBottom: 4,
      defaultMaskHeight: 22,
      cuesUrl: 'content/podcast/cues/XBr_XERk9hs.json',
      cuesCount: 274,
      cues: [
        {
          start: 0,
          end: 5.79,
          en: 'Hello everyone! Welcome to “Everyday Chinese”! I\'m Wang Yu.',
          zh: '大家好！欢迎收听“每天中文”！我是王雨。',
          pinyin: 'Dàjiā hǎo! Huānyíng shōutīng “Měitiān Zhōngwén”! Wǒ shì Wáng Yǔ.',
          vi: 'Xin chào mọi người! Chào mừng các bạn đến với “Mỗi Ngày Tiếng Trung”! Tôi là Vương Vũ.'
        },
        {
          start: 5.8,
          end: 10.09,
          en: 'Hello everyone! I\'m Li Ming. I\'m very happy to meet you all again.',
          zh: '大家好！我是李明。很高兴又和大家见面了。',
          pinyin: 'Dàjiā hǎo! Wǒ shì Lǐ Míng. Hěn gāoxìng yòu hé dàjiā jiànmiàn le.',
          vi: 'Xin chào mọi người! Tôi là Lý Minh. Rất vui lại được gặp mọi người.'
        }
      ]
    },
    {
      "id": "ep-lctp-extra-8IguP51Ru8E",
      "youtubeId": "8IguP51Ru8E",
      "level": "HSK 1–2",
      "levelGroup": "hsk1-2",
      "title": "HSK 1-2 | Learn Chinese Easily with 10 Uplifting Morning Phrases! | Chinese Listening Practice",
      "channel": "Learn Chinese Through Podcast",
      "channelName": "Learn Chinese Through Podcast",
      "channelHandle": "@LearnChineseThroughPodcast",
      "channelId": "UCI8Liuxdz6UPv5rgMskfwPg",
      "channelUrl": "https://www.youtube.com/@LearnChineseThroughPodcast",
      "durationSec": 981,
      "durationLabel": "16:21",
      "topic": "Luyện nghe tiếng Trung",
      "note": "Phụ đề theo timestamp nguồn với bốn lớp Hán · Pinyin · Việt · Anh.",
      "defaultMaskBottom": 4,
      "defaultMaskHeight": 22,
      "cuesUrl": "content/podcast/cues/8IguP51Ru8E.json",
      "cuesCount": 394,
      "cues": [
        {
          "start": 8.73,
          "end": 10.833,
          "zh": "大家好，我是李明，",
          "vi": "Chào mọi người, tôi là Lý Minh.",
          "en": "Hello. I'm Li Ming.",
          "pinyin": "dà jiā hǎo ， wǒ shì lǐ míng ，"
        },
        {
          "start": 10.833,
          "end": 13.866,
          "zh": "欢迎来到Learn Chinese Podcast。",
          "vi": "Chào mừng đến với Learn Chinese Podcast.",
          "en": "Welcome to Learn Chinese Podcast.",
          "pinyin": "huān yíng lái dào L e a r n   C h i n e s e   P o d c a s t 。"
        },
        {
          "start": 13.933,
          "end": 16.033,
          "zh": "大家好，我是小雨，",
          "vi": "Chào mọi người, tôi là Tiểu Vũ.",
          "en": "Hello, I'm Ame.",
          "pinyin": "dà jiā hǎo ， wǒ shì xiǎo yǔ ，"
        }
      ]
    },
    {
      "id": "ep-lctp-extra-HxAg55caCKs",
      "youtubeId": "HxAg55caCKs",
      "level": "HSK 2–4",
      "levelGroup": "hsk3",
      "title": "HSK 2 - 4 | When You Lose Your Way | Learn Chinese Through a Healing Beijing Story",
      "channel": "Learn Chinese Through Podcast",
      "channelName": "Learn Chinese Through Podcast",
      "channelHandle": "@LearnChineseThroughPodcast",
      "channelId": "UCI8Liuxdz6UPv5rgMskfwPg",
      "channelUrl": "https://www.youtube.com/@LearnChineseThroughPodcast",
      "durationSec": 539,
      "durationLabel": "8:59",
      "topic": "Luyện nghe tiếng Trung",
      "note": "Phụ đề theo timestamp nguồn với bốn lớp Hán · Pinyin · Việt · Anh.",
      "defaultMaskBottom": 4,
      "defaultMaskHeight": 22,
      "cuesUrl": "content/podcast/cues/HxAg55caCKs.json",
      "cuesCount": 209,
      "cues": [
        {
          "start": 6.37,
          "end": 10.2,
          "zh": "🐼:欢迎收听……今天这封写给自己的信。",
          "vi": "🐼: Chào mừng các bạn đến với... bức thư hôm nay viết cho chính mình.",
          "en": "⁇ : Welcome to the letter that I wrote to myself today.",
          "pinyin": "🐼 : huān yíng shōu tīng … … jīn tiān zhè fēng xiě gěi zì jǐ de xìn 。"
        },
        {
          "start": 10.37,
          "end": 12.17,
          "zh": "🐼:你好，我是子轩。",
          "vi": "🐼: Xin chào, tôi là Tử Hiên.",
          "en": "GUY: Hello, I'm Zijun.",
          "pinyin": "🐼 : nǐ hǎo ， wǒ shì zǐ xuān 。"
        },
        {
          "start": 12.27,
          "end": 13.3,
          "zh": "🐼:大家好，我是雨桐。",
          "vi": "🐼: Chào mọi người, tôi là Vũ Đồng.",
          "en": "Hello, everyone. I'm Yuzu.",
          "pinyin": "🐼 : dà jiā hǎo ， wǒ shì yǔ tóng 。"
        }
      ]
    },
    {
      "id": "ep-lctp-extra-MNCKKv9scf4",
      "youtubeId": "MNCKKv9scf4",
      "level": "HSK 2–4",
      "levelGroup": "hsk3",
      "title": "HSK 2 - 4 | Embarrassment Is the Best Opportunity for Growth | Chinese Listening Practice",
      "channel": "Learn Chinese Through Podcast",
      "channelName": "Learn Chinese Through Podcast",
      "channelHandle": "@LearnChineseThroughPodcast",
      "channelId": "UCI8Liuxdz6UPv5rgMskfwPg",
      "channelUrl": "https://www.youtube.com/@LearnChineseThroughPodcast",
      "durationSec": 608,
      "durationLabel": "10:08",
      "topic": "Luyện nghe tiếng Trung",
      "note": "Phụ đề theo timestamp nguồn với bốn lớp Hán · Pinyin · Việt · Anh.",
      "defaultMaskBottom": 4,
      "defaultMaskHeight": 22,
      "cuesUrl": "content/podcast/cues/MNCKKv9scf4.json",
      "cuesCount": 244,
      "cues": [
        {
          "start": 6.2,
          "end": 8.23,
          "zh": "大家好，欢迎收听“普通",
          "vi": "Chào mọi người, chào mừng đến với \"",
          "en": "Hello, everyone. Welcome to \"The Normal.\"",
          "pinyin": "dà jiā hǎo ， huān yíng shōu tīng “ pǔ tōng"
        },
        {
          "start": 8.33,
          "end": 10.63,
          "zh": "话每日播客”。我是子涵。",
          "vi": "Phổ Thông Thoại Mỗi Ngày\". Tôi là Zihan.",
          "en": "Talk to the daily podcast.\" I'm a child.",
          "pinyin": "huà měi rì bō kè ” 。 wǒ shì zǐ hán 。"
        },
        {
          "start": 10.93,
          "end": 14.46,
          "zh": "今天我想先问你一个很简单的问题：",
          "vi": "Hôm nay tôi muốn hỏi bạn một câu rất đơn giản trước:",
          "en": "Today I would like to ask you a simple question:",
          "pinyin": "jīn tiān wǒ xiǎng xiān wèn nǐ yí gè hěn jiǎn dān de wèn tí ："
        }
      ]
    },
    {
      "id": "ep-lctp-extra-U4TuivpulEo",
      "youtubeId": "U4TuivpulEo",
      "level": "HSK 2–4",
      "levelGroup": "hsk3",
      "title": "HSK 2 - 4 | How to Achieve Your Goals Without Comparing Yourself to Others",
      "channel": "Learn Chinese Through Podcast",
      "channelName": "Learn Chinese Through Podcast",
      "channelHandle": "@LearnChineseThroughPodcast",
      "channelId": "UCI8Liuxdz6UPv5rgMskfwPg",
      "channelUrl": "https://www.youtube.com/@LearnChineseThroughPodcast",
      "durationSec": 657,
      "durationLabel": "10:57",
      "topic": "Luyện nghe tiếng Trung",
      "note": "Phụ đề theo timestamp nguồn với bốn lớp Hán · Pinyin · Việt · Anh.",
      "defaultMaskBottom": 4,
      "defaultMaskHeight": 22,
      "cuesUrl": "content/podcast/cues/U4TuivpulEo.json",
      "cuesCount": 257,
      "cues": [
        {
          "start": 6.2,
          "end": 8.23,
          "zh": "你有没有这样的时刻？",
          "vi": "Bạn có bao giờ có những khoảnh khắc như thế này không?",
          "en": "Do you have a moment like this?",
          "pinyin": "nǐ yǒu méi yǒu zhè yàng de shí kè ？"
        },
        {
          "start": 8.27,
          "end": 9.93,
          "zh": "晚上刷手机，",
          "vi": "Buổi tối, bạn lướt điện thoại,",
          "en": "I've been working on my phone at night.",
          "pinyin": "wǎn shàng shuā shǒu jī ，"
        },
        {
          "start": 9.93,
          "end": 11.9,
          "zh": "看见别人升职了，",
          "vi": "thấy người khác được thăng chức,",
          "en": "I saw someone get promoted.",
          "pinyin": "kàn jiàn bié rén shēng zhí le ，"
        }
      ]
    },
    {
      "id": "ep-lctp-extra-bZu-TAK96nU",
      "youtubeId": "bZu-TAK96nU",
      "level": "HSK 1–2",
      "levelGroup": "hsk1-2",
      "title": "HSK 1-2 | SMART Method That Most Chinese Learners Forget! | Chinese Listening Practice",
      "channel": "Learn Chinese Through Podcast",
      "channelName": "Learn Chinese Through Podcast",
      "channelHandle": "@LearnChineseThroughPodcast",
      "channelId": "UCI8Liuxdz6UPv5rgMskfwPg",
      "channelUrl": "https://www.youtube.com/@LearnChineseThroughPodcast",
      "durationSec": 1045,
      "durationLabel": "17:25",
      "topic": "Luyện nghe tiếng Trung",
      "note": "Phụ đề theo timestamp nguồn với bốn lớp Hán · Pinyin · Việt · Anh.",
      "defaultMaskBottom": 4,
      "defaultMaskHeight": 22,
      "cuesUrl": "content/podcast/cues/bZu-TAK96nU.json",
      "cuesCount": 419,
      "cues": [
        {
          "start": 7.53,
          "end": 9.46,
          "zh": "🕺大家好，我是李明，",
          "vi": "🕺Xin chào mọi người, tôi là Lý Minh,",
          "en": "Hello, everyone. I'm Li Ming.",
          "pinyin": "🕺 dà jiā hǎo ， wǒ shì lǐ míng ，"
        },
        {
          "start": 9.47,
          "end": 11.57,
          "zh": "🕺很高兴和你们在一起。",
          "vi": "🕺Rất vui được gặp mọi người.",
          "en": "It's nice to be with you guys.",
          "pinyin": "🕺 hěn gāo xìng hé nǐ men zài yì qǐ 。"
        },
        {
          "start": 11.63,
          "end": 13.63,
          "zh": "🕺今天我们又见面了。",
          "vi": "🕺Hôm nay chúng ta lại gặp nhau rồi.",
          "en": "We meet again today.",
          "pinyin": "🕺 jīn tiān wǒ men yòu jiàn miàn le 。"
        }
      ]
    },
    {
      "id": "ep-lctp-extra-cl7uiNCtcmI",
      "youtubeId": "cl7uiNCtcmI",
      "level": "HSK 2–4",
      "levelGroup": "hsk3",
      "title": "HSK 2-3 | Describe Yourself in Chinese: Are you Introvert or Extrovert? | Chinese Listening Practice",
      "channel": "Learn Chinese Through Podcast",
      "channelName": "Learn Chinese Through Podcast",
      "channelHandle": "@LearnChineseThroughPodcast",
      "channelId": "UCI8Liuxdz6UPv5rgMskfwPg",
      "channelUrl": "https://www.youtube.com/@LearnChineseThroughPodcast",
      "durationSec": 808,
      "durationLabel": "13:28",
      "topic": "Luyện nghe tiếng Trung",
      "note": "Phụ đề theo timestamp nguồn với bốn lớp Hán · Pinyin · Việt · Anh.",
      "defaultMaskBottom": 4,
      "defaultMaskHeight": 22,
      "cuesUrl": "content/podcast/cues/cl7uiNCtcmI.json",
      "cuesCount": 329,
      "cues": [
        {
          "start": 6.27,
          "end": 10.2,
          "zh": "🕺大家好！欢迎来到“Learn Chinese Podcast”！",
          "vi": "🕺Chào mọi người! Chào mừng đến với \"Learn Chinese Podcast\"!",
          "en": "Hello, everyone! Welcome to \"Learne China Podcast\"!",
          "pinyin": "🕺 dà jiā hǎo ！ huān yíng lái dào “ L e a r n   C h i n e s e   P o d c a s t ” ！"
        },
        {
          "start": 10.2,
          "end": 11.47,
          "zh": "🕺我是李明。",
          "vi": "🕺Tôi là Lý Minh.",
          "en": "I'm Lee Myung.",
          "pinyin": "🕺 wǒ shì lǐ míng 。"
        },
        {
          "start": 11.57,
          "end": 13.57,
          "zh": "💃大家好！我是小雨。",
          "vi": "💃Chào mọi người! Tôi là Tiểu Vũ.",
          "en": "Hello, everyone! I'm Ame.",
          "pinyin": "💃 dà jiā hǎo ！ wǒ shì xiǎo yǔ 。"
        }
      ]
    },
    {
      "id": "ep-lctp-extra-iSDpi7v6l6Q",
      "youtubeId": "iSDpi7v6l6Q",
      "level": "HSK 1–2",
      "levelGroup": "hsk1-2",
      "title": "HSK 1-2 | Chinese characters that look like drawings | Chinese Listening Practice",
      "channel": "Learn Chinese Through Podcast",
      "channelName": "Learn Chinese Through Podcast",
      "channelHandle": "@LearnChineseThroughPodcast",
      "channelId": "UCI8Liuxdz6UPv5rgMskfwPg",
      "channelUrl": "https://www.youtube.com/@LearnChineseThroughPodcast",
      "durationSec": 860,
      "durationLabel": "14:20",
      "topic": "Luyện nghe tiếng Trung",
      "note": "Phụ đề theo timestamp nguồn với bốn lớp Hán · Pinyin · Việt · Anh.",
      "defaultMaskBottom": 4,
      "defaultMaskHeight": 22,
      "cuesUrl": "content/podcast/cues/iSDpi7v6l6Q.json",
      "cuesCount": 317,
      "cues": [
        {
          "start": 6.3,
          "end": 7.3,
          "zh": "🕺大家好！",
          "vi": "Xin chào tất cả mọi người!",
          "en": "Hello, everyone!",
          "pinyin": "🕺 dà jiā hǎo ！"
        },
        {
          "start": 7.3,
          "end": 10.67,
          "zh": "🕺欢迎回到我们的“学中文播客”！",
          "vi": "Chào mừng quay trở lại với podcast \"Học tiếng Trung\" của chúng ta!",
          "en": "Welcome back to our Chinese-language podcast!",
          "pinyin": "🕺 huān yíng huí dào wǒ men de “ xué zhōng wén bō kè ” ！"
        },
        {
          "start": 10.67,
          "end": 13.13,
          "zh": "💃大家好！我是小雨。",
          "vi": "Chào mọi người! Tôi là Tiểu Vũ.",
          "en": "Hello, everyone! I'm Ame.",
          "pinyin": "💃 dà jiā hǎo ！ wǒ shì xiǎo yǔ 。"
        }
      ]
    },
    {
      "id": "ep-lctp-extra-l5ybjaIofgA",
      "youtubeId": "l5ybjaIofgA",
      "level": "HSK 1–2",
      "levelGroup": "hsk1-2",
      "title": "HSK 1-2 | How to speak Chinese when you get lost in Beijing? | Chinese Listening Practice",
      "channel": "Learn Chinese Through Podcast",
      "channelName": "Learn Chinese Through Podcast",
      "channelHandle": "@LearnChineseThroughPodcast",
      "channelId": "UCI8Liuxdz6UPv5rgMskfwPg",
      "channelUrl": "https://www.youtube.com/@LearnChineseThroughPodcast",
      "durationSec": 1116,
      "durationLabel": "18:36",
      "topic": "Luyện nghe tiếng Trung",
      "note": "Phụ đề theo timestamp nguồn với bốn lớp Hán · Pinyin · Việt · Anh.",
      "defaultMaskBottom": 4,
      "defaultMaskHeight": 22,
      "cuesUrl": "content/podcast/cues/l5ybjaIofgA.json",
      "cuesCount": 373,
      "cues": [
        {
          "start": 9.1,
          "end": 13.87,
          "zh": "🕺大家好！欢迎收听“轻松学中文播客”。",
          "vi": "🕺Chào mọi người! Hoan nghênh các bạn đến với \"Podcast Học Tiếng Trung Nhẹ Nhàng\".",
          "en": "Hello, everyone! Welcome to the Easy Learning Chinese Podcast.",
          "pinyin": "🕺 dà jiā hǎo ！ huān yíng shōu tīng “ qīng sōng xué zhōng wén bō kè ” 。"
        },
        {
          "start": 13.97,
          "end": 15.63,
          "zh": "🕺我是李明。",
          "vi": "🕺Tôi là Lý Minh.",
          "en": "I'm Lee Myung.",
          "pinyin": "🕺 wǒ shì lǐ míng 。"
        },
        {
          "start": 15.63,
          "end": 18.4,
          "zh": "💃大家好！我是小雨。",
          "vi": "💃Chào mọi người! Tôi là Tiểu Vũ.",
          "en": "Hello, everyone! I'm Ame.",
          "pinyin": "💃 dà jiā hǎo ！ wǒ shì xiǎo yǔ 。"
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
    LIBRARY_EPISODES,
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
