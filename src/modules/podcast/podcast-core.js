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
