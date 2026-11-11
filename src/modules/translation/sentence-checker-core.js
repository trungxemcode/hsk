/*
 * Offline checker used by Sửa câu tiếng Trung.
 *
 * This module deliberately has no network or model dependency.  It compiles the
 * small, high-confidence grammar catalogue, indexes the vocabulary already
 * loaded by the app, and exposes one synchronous checkText() call for the UI.
 * The vocabulary index is rebuilt when the app announces a data refresh, so a
 * new vocabulary bundle improves spelling suggestions without a code change.
 */
(()=>{
  'use strict';

  const HAN=/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;
  const HAN_RUN=/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/gu;
  // Offline fallback mirrors hsk-grammar-rules.json; parity is covered by tests.
  const DEFAULT_CONFIG={
  "version": "2026.11.11.1",
  "macros": {
    "NUM": "(?:[一两三四五六七八九十百千万亿]+|几|每|这|那|哪)",
    "PRONOUN": "(?:我们|你们|他们|她们|咱们|大家|我|你|他|她|它)",
    "TIME_WORD": "(?:今天|明天|昨天|前天|后天|现在|刚才|以前|以后|早上|上午|中午|下午|晚上|周末|去年|今年|明年)",
    "NOUN_BEN": "(?:书|词典|字典|杂志|小说|课本|笔记本|画册|护照)",
    "NOUN_JIAN": "(?:衣服|衬衫|毛衣|大衣|外套|行李|事|事情|礼物)",
    "NOUN_TIAO": "(?:裤子|裙子|河|路|鱼|狗|新闻|毛巾|船)",
    "NOUN_ZHANG": "(?:纸|桌子|床|照片|票|地图|脸|嘴)",
    "ADJ_COMMON": "(?:高兴|开心|快乐|伤心|难过|认真|努力|仔细|热情|慢慢|快快|悄悄|大声|小声|清楚|流利)",
    "VERB_ACTION": "(?:看|听|说|读|写|走|跑|吃|喝|买|卖|学|学习|工作|休息|睡觉|做|打|玩|洗|穿|找|去|来|回|到|跑步|说话)"
  },
  "rules": [
    {
      "id": "HSK1_LIANG_ER",
      "hskLevel": 1,
      "category": "measure_word",
      "pattern": "(?<![第零〇一二两三四五六七八九十百千万亿\\d])二(个|本|件|条|张|杯|瓶|双|只|家|口|岁|块|次|遍)",
      "replace": "两$1",
      "message": "Đứng trước lượng từ, dùng 「两」 cho số lượng; 「二」 thường dùng trong số đếm và số thứ tự."
    },
    {
      "id": "HSK1_MW_BEN",
      "hskLevel": 1,
      "category": "measure_word",
      "pattern": "({{NUM}})个({{NOUN_BEN}})",
      "replace": "$1本$2",
      "message": "Sách, từ điển và tài liệu đóng quyển dùng lượng từ 「本」 thay vì 「个」."
    },
    {
      "id": "HSK1_MW_JIAN",
      "hskLevel": 1,
      "category": "measure_word",
      "pattern": "({{NUM}})个({{NOUN_JIAN}})",
      "replace": "$1件$2",
      "message": "Quần áo, hành lý, sự việc và món quà thường dùng lượng từ 「件」."
    },
    {
      "id": "HSK2_MW_TIAO",
      "hskLevel": 2,
      "category": "measure_word",
      "pattern": "({{NUM}})个({{NOUN_TIAO}})",
      "replace": "$1条$2",
      "message": "Vật dài, thon như cá, sông, đường và quần thường dùng 「条」."
    },
    {
      "id": "HSK2_MW_ZHANG",
      "hskLevel": 2,
      "category": "measure_word",
      "pattern": "({{NUM}})个({{NOUN_ZHANG}})",
      "replace": "$1张$2",
      "message": "Vật phẳng như giấy, ảnh, vé, bản đồ và bàn thường dùng 「张」."
    },
    {
      "id": "HSK1_NEG_BU_YOU",
      "hskLevel": 1,
      "category": "negation",
      "pattern": "(?<![无何岂所])不有(?![利害效用趣关名理])",
      "replace": "没有",
      "message": "Phủ định của 「有」 là 「没有」, không dùng 「不有」."
    },
    {
      "id": "HSK2_NEG_MEI_LE",
      "hskLevel": 2,
      "category": "negation",
      "pattern": "没(有)?({{VERB_ACTION}})了",
      "replace": "没$1$2",
      "message": "Cần xét ngữ cảnh. Sau 「没 / 没有」 không thêm trợ từ hoàn thành 「了」 ở cuối hành động.",
      "kind": "style"
    },
    {
      "id": "HSK2_DE_ADV_VERB",
      "hskLevel": 2,
      "category": "particle",
      "pattern": "({{ADJ_COMMON}})[的得]({{VERB_ACTION}})",
      "replace": "$1地$2",
      "message": "Trạng ngữ đứng trước động từ dùng 「地」: tính từ + 地 + động từ."
    },
    {
      "id": "HSK2_DE_VERB_COMP",
      "hskLevel": 2,
      "category": "particle",
      "pattern": "({{VERB_ACTION}})[的地](很|非常|太|真|特别)?({{ADJ_COMMON}}|好|快|慢|早|晚|多|少)",
      "replace": "$1得$2$3",
      "message": "Bổ ngữ chỉ mức độ sau động từ dùng 「得」: động từ + 得 + tính từ."
    },
    {
      "id": "HSK2_BI_DEGREE_ADV",
      "hskLevel": 2,
      "category": "comparison",
      "pattern": "(比[^，。！？\\s]{1,6})(?:很|非常|太|真|特别)([^，。！？\\s]{1,3})",
      "replace": "$1$2",
      "message": "Cần xét ngữ cảnh. Sau 「比」 không đặt trực tiếp phó từ mức độ như 「很、非常、太」 trước tính từ.",
      "kind": "style"
    },
    {
      "id": "HSK1_WORD_ORDER_TIME",
      "hskLevel": 1,
      "category": "word_order",
      "pattern": "({{PRONOUN}})((?:去|来|回|在|到|看|吃|买|学)[^，。！？\\s]{1,5})({{TIME_WORD}})(?=[，。！？\\s]|$)",
      "replace": "$1$3$2",
      "message": "Cần xét ngữ cảnh. Trạng ngữ thời gian thường đứng trước động từ: chủ ngữ + thời gian + động từ.",
      "kind": "style"
    },
    {
      "id": "HSK3_CONJ_RUGUO_JIU",
      "hskLevel": 3,
      "category": "word_order",
      "pattern": "(如果[^，。！？]+，)\\s*就({{PRONOUN}})",
      "replace": "$1$2就",
      "message": "Trong 「如果…就…」, 「就」 thường đứng sau chủ ngữ của vế sau."
    },
    {
      "id": "HSK3_BA_BARE_VERB",
      "hskLevel": 3,
      "category": "ba_sentence",
      "pattern": "(把[^，。！？\\s]{1,8})({{VERB_ACTION}})(?=[，。！？\\s]|$)",
      "replace": "$1$2了",
      "message": "Câu 把 thường cần kết quả hoặc trạng thái đi kèm. Chỉ thêm 了 nếu ý bạn là hành động đã hoàn thành.",
      "kind": "style"
    },
    {
      "id": "HSK1_PUNCT_SPACE",
      "hskLevel": 1,
      "category": "punctuation",
      "pattern": "[ \\t]+([，。！？、；：])",
      "replace": "$1",
      "message": "Không đặt khoảng trắng trước dấu câu tiếng Trung."
    },
    {
      "id": "HSK1_DUPLICATE_PUNCT",
      "hskLevel": 1,
      "category": "punctuation",
      "pattern": "([，。！？])\\1+",
      "replace": "$1",
      "message": "Dấu câu lặp liên tiếp nên rút gọn còn một dấu."
    },
    {
      "id": "HSK4_SUIRAN_SUOYI",
      "hskLevel": 4,
      "category": "conjunction",
      "pattern": "(虽然[^，。！？]+，[^，。！？]{1,20})所以",
      "replace": "$1但是",
      "message": "Cần xét ngữ cảnh. 「虽然」 thường đi với 「但是/可是」，không dùng 「所以」 để nối kết quả đối lập.",
      "kind": "style"
    },
    {
      "id": "HSK4_YINWEI_DANSHI",
      "hskLevel": 4,
      "category": "conjunction",
      "pattern": "(因为[^，。！？]+，[^，。！？]{1,20})但是",
      "replace": "$1所以",
      "message": "Cần xét ngữ cảnh. 「因为」 thường mở nguyên nhân và đi với 「所以」 ở vế kết quả.",
      "kind": "style"
    },
    {
      "id": "HSK4_RUGUO_DANSHI",
      "hskLevel": 4,
      "category": "conjunction",
      "pattern": "(如果[^，。！？]+，[^，。！？]{1,20})但是",
      "replace": "$1就",
      "message": "Cần xét ngữ cảnh. Điều kiện 「如果…」 thường đi với 「就」，không dùng 「但是」 để chỉ kết quả.",
      "kind": "style"
    },
    {
      "id": "HSK4_JIRAN_SUOYI",
      "hskLevel": 4,
      "category": "conjunction",
      "pattern": "(既然[^，。！？]+，[^，。！？]{1,20})所以",
      "replace": "$1就",
      "message": "Cần xét ngữ cảnh. 「既然…」 thường đi với 「就…」，không dùng 「所以」 lặp chức năng kết luận.",
      "kind": "style"
    },
    {
      "id": "HSK4_SUIRAN_QUE",
      "hskLevel": 4,
      "category": "conjunction",
      "pattern": "虽然([^，。！？]+)，所以",
      "replace": "虽然$1，但是",
      "message": "Cần xét ngữ cảnh. Cặp tương phản là 「虽然…但是/可是…」.",
      "kind": "style"
    },
    {
      "id": "HSK4_CHUF..._JIU",
      "hskLevel": 4,
      "category": "conjunction",
      "pattern": "(除非[^，。！？]+，[^，。！？]{1,20})就",
      "replace": "$1否则",
      "message": "Cần xét ngữ cảnh. 「除非…」 thường đi với 「否则…」 để nêu điều kiện loại trừ.",
      "kind": "style"
    },
    {
      "id": "HSK4_CHULE_DUPLICATE",
      "hskLevel": 4,
      "category": "conjunction",
      "pattern": "除了([^，。！？]{1,12})(以外|之外)之外",
      "replace": "除了$1$2",
      "message": "Cần xét ngữ cảnh. Chỉ dùng một lần thành phần 「以外/之外」 trong cấu trúc 「除了…以外/之外…」.",
      "kind": "style"
    },
    {
      "id": "HSK5_BU_GUAN_DANSHI",
      "hskLevel": 5,
      "category": "conjunction",
      "pattern": "((?:不管|无论)[^，。！？]+，[^，。！？]{1,20})(?:但是|可是)",
      "replace": "$1都",
      "message": "Cần xét ngữ cảnh. 「不管/无论…」 thường đi với 「都/也…」，không dùng 「但是」 để nối vế bao quát.",
      "kind": "style"
    },
    {
      "id": "HSK5_JISHI_DANSHI",
      "hskLevel": 5,
      "category": "conjunction",
      "pattern": "(即使[^，。！？]+，[^，。！？]{1,20})但是",
      "replace": "$1也",
      "message": "Cần xét ngữ cảnh. Cặp nhượng bộ là 「即使…也…」，không dùng 「但是」 ở vế sau.",
      "kind": "style"
    },
    {
      "id": "HSK5_JIRAN_DANSHI",
      "hskLevel": 5,
      "category": "conjunction",
      "pattern": "(既然[^，。！？]+，[^，。！？]{1,20})但是",
      "replace": "$1就",
      "message": "Cần xét ngữ cảnh. 「既然…」 thường dẫn đến kết luận bằng 「就…」.",
      "kind": "style"
    },
    {
      "id": "HSK5_ZHIYOU_JIU",
      "hskLevel": 5,
      "category": "conjunction",
      "pattern": "(只有[^，。！？]+，[^，。！？]{0,20}?)就",
      "replace": "$1才",
      "message": "Cần xét ngữ cảnh. Cấu trúc điều kiện cần là 「只有…才…」.",
      "kind": "style"
    },
    {
      "id": "HSK5_ZHIYAO_CAI",
      "hskLevel": 5,
      "category": "conjunction",
      "pattern": "(只要[^，。！？]+，[^，。！？]{1,20})才",
      "replace": "$1就",
      "message": "Cần xét ngữ cảnh. Cấu trúc điều kiện đủ là 「只要…就…」.",
      "kind": "style"
    },
    {
      "id": "HSK6_YIMIAN_DUPLICATE",
      "hskLevel": 6,
      "category": "conjunction",
      "pattern": "一方面([^，。！？]+)，所以",
      "replace": "一方面$1，另一方面",
      "message": "Cần xét ngữ cảnh. Khi trình bày hai mặt song song, dùng cặp 「一方面…另一方面…」.",
      "kind": "style"
    },
    {
      "id": "HSK6_YIMIAN_DANSHI",
      "hskLevel": 6,
      "category": "conjunction",
      "pattern": "一方面([^，。！？]+)，但是",
      "replace": "一方面$1，另一方面",
      "message": "Cần xét ngữ cảnh. Hai mặt song song nên dùng 「一方面…另一方面…」 thay vì 「但是」.",
      "kind": "style"
    },
    {
      "id": "HSK4_ASPECT_MEI_LE",
      "hskLevel": 4,
      "category": "aspect",
      "pattern": "没(有)?({{VERB_ACTION}})了",
      "replace": "没$1$2",
      "message": "Cần xét ngữ cảnh. 「没/没有」 đã phủ định việc xảy ra; thường không thêm 「了」 chỉ hoàn thành.",
      "kind": "style"
    },
    {
      "id": "HSK4_DE_DE",
      "hskLevel": 4,
      "category": "particle",
      "pattern": "的的+(?!解|结|分明|无几|可数|不得|确)",
      "replace": "的",
      "message": "Không lặp trợ từ 「的」 liên tiếp trong một cụm danh từ."
    },
    {
      "id": "HSK4_LE_LE",
      "hskLevel": 4,
      "category": "aspect",
      "pattern": "了了+(?!解|结|分明|无几|可数|不得|确)",
      "replace": "了",
      "message": "Cần xét ngữ cảnh. Không lặp trợ từ 「了」 liên tiếp.",
      "kind": "style"
    },
    {
      "id": "HSK3_BANGMANG_OBJECT",
      "hskLevel": 3,
      "category": "word_order",
      "pattern": "帮忙({{PRONOUN}})(?=打扫|搬|做|写|买|找|拿|看|学习|准备|收拾|解决|翻译|修|洗|开|关)",
      "replace": "帮$1",
      "message": "「帮忙」 không nhận trực tiếp tân ngữ chỉ người. Khi nói giúp ai làm gì, dùng 「帮 + người + hành động」."
    },
    {
      "id": "HSK2_MISSING_DE",
      "hskLevel": 2,
      "category": "particle",
      "pattern": "((?:很|非常|特别)(?:漂亮|好看|干净|可爱|有趣|重要|复杂|简单))(衣服|裙子|房间|孩子|故事|问题|事情|工作)",
      "replace": "$1的$2",
      "message": "Cụm tính từ có phó từ mức độ bổ nghĩa cho danh từ cần 「的」: 很漂亮的衣服."
    },
    {
      "id": "HSK2_SUIRAN_DIRECT",
      "hskLevel": 2,
      "category": "conjunction",
      "kind": "style",
      "pattern": "(因为[^，。！？]+，)但是",
      "replace": "$1所以",
      "message": "Nếu vế sau là kết quả của nguyên nhân, dùng 所以. Giữ 但是 nếu bạn thực sự muốn diễn đạt tương phản."
    },
    {
      "id": "HSK2_ZAI_ACTION",
      "hskLevel": 2,
      "category": "particle",
      "pattern": "({{PRONOUN}})在在(?=学习|工作|看书|吃饭|学校|家)",
      "replace": "$1在",
      "message": "「在」 bị lặp ở vị trí này; giữ lại một chữ."
    },
    {
      "id": "HSK3_LIANGCI_CHE",
      "hskLevel": 3,
      "category": "measure_word",
      "pattern": "({{NUM}})个(汽车|自行车|出租车)",
      "replace": "$1辆$2",
      "message": "Xe dùng lượng từ 「辆」."
    },
    {
      "id": "HSK2_LIANGCI_DIAN",
      "hskLevel": 2,
      "category": "measure_word",
      "pattern": "({{NUM}})个(电影)",
      "replace": "$1部$2",
      "message": "Khi đếm tác phẩm điện ảnh, dùng 「部电影」."
    },
    {
      "id": "HSK6_CONCESSION_RESULT",
      "hskLevel": 6,
      "category": "conjunction",
      "pattern": "(?<=尽管[^，,。！？；;]{2,60}[，,]\\s*)所以(?=[^，,。！？；;]{2})",
      "replace": "但是",
      "message": "「尽管」 mở vế nhượng bộ. Dùng 「但是」 nếu vế sau diễn đạt ý tương phản.",
      "kind": "style"
    },
    {
      "id": "HSK6_DISCUSS_WORD_ORDER",
      "hskLevel": 6,
      "category": "word_order",
      "pattern": "讨论(了?)(这个话题|这个问题|这件事|这个方案|这项计划)(跟|和|与)((?:同学|老师|朋友|同事|家人|父母|室友)(?:们)?)(?=[一二两三四五六七八九十几\\d]+(?:个)?(?:小时|钟头|分钟)|[，,。！？；;]|$)",
      "replace": "$3$4讨论$1$2",
      "message": "Đặt 「跟/和/与 + người」 trước động từ 「讨论」.",
      "kind": "fix"
    },
    {
      "id": "HSK6_OWN_VEHICLE",
      "hskLevel": 6,
      "category": "particle",
      "pattern": "((?:开|骑|驾驶|停放)自己)(汽车|自行车|摩托车|电动车|车)(?!辆|队|间|库|站|主|牌|票|行|轮|棚|门|窗)",
      "replace": "$1的$2",
      "message": "Thêm 「的」 khi nói đến phương tiện của chính mình.",
      "kind": "fix"
    },
    {
      "id": "HSK6_EXERCISE_BODY",
      "hskLevel": 6,
      "category": "collocation",
      "pattern": "练习身体(?=[，,。！？；;]|$)",
      "replace": "锻炼身体",
      "message": "Dùng 「锻炼身体」 cho việc rèn luyện sức khỏe. 「练习」 thường đi với kỹ năng hoặc bài tập.",
      "kind": "fix"
    },
    {
      "id": "HSK6_AWARENESS_DEGREE",
      "hskLevel": 6,
      "category": "collocation",
      "pattern": "提高((?:人们|公众|居民|学生|大家|市民)(?:的)?(?:保护环境|环保|节约用水|安全|交通安全)(?:的)?意识)(?:很|非常|特别)厉害(?=[，,。！？；;]|$)",
      "replace": "大幅提高$1",
      "message": "Đặt 「大幅」 trước 「提高」 để diễn đạt mức tăng. 「很厉害」 ở cuối câu không tự nhiên trong ngữ cảnh này.",
      "kind": "style"
    },
    {
      "id": "HSK6_COMMUTE_DURATION",
      "hskLevel": 6,
      "category": "word_order",
      "pattern": "(骑(?:自行车|电动车|摩托车)去(?:公司|学校|单位|办公室))([一二两三四五六七八九十几\\d]+(?:个)?(?:小时|钟头|分钟))(?=[，,。！？；;]|$)",
      "replace": "$1要花$2",
      "message": "Nếu ý là thời gian đi đường, dùng 「要花 + thời lượng」. Nếu nói thời gian tập đạp xe, hãy nêu rõ ý đó.",
      "kind": "style"
    },
    {
      "id": "HSK6_DOUBLE_CAUSE",
      "hskLevel": 6,
      "category": "conjunction",
      "pattern": "(?<=之所以[^，,。！？；;]{2,65}[，,]\\s*是因为)因为",
      "replace": "",
      "message": "「之所以…是因为…」 đã có từ nối nguyên nhân. Bỏ chữ 「因为」 bị lặp.",
      "kind": "fix"
    },
    {
      "id": "HSK6_DOUBLE_NEGATION",
      "hskLevel": 6,
      "category": "collocation",
      "pattern": "避免((?:事故|错误|问题|意外|冲突|污染))(?:不再|不要)(发生|出现)(?=[，,。！？；;]|$)",
      "replace": "避免$1$2",
      "message": "「避免」 đã mang ý ngăn một việc xảy ra. Nếu muốn phòng ngừa, bỏ 「不再/不要」.",
      "kind": "style"
    },
    {
      "id": "HSK6_REDUNDANT_APPROX",
      "hskLevel": 6,
      "category": "redundancy",
      "pattern": "大约([一二两三四五六七八九十百千万几\\d]+(?:个)?(?:小时|钟头|分钟|公里|天|年|人|元|次))左右",
      "replace": "大约$1",
      "message": "「大约」 và 「左右」 đều chỉ số gần đúng. Giữ một từ là đủ.",
      "kind": "style"
    },
    {
      "id": "HSK6_REDUNDANT_PURPOSE",
      "hskLevel": 6,
      "category": "redundancy",
      "pattern": "目的是为了",
      "replace": "目的是",
      "message": "Có thể lược 「为了」 sau 「目的是」 để câu gọn hơn.",
      "kind": "style"
    },
    {
      "id": "HSK6_REDUNDANT_CAUSAL_REASON",
      "hskLevel": 6,
      "category": "advanced_writing",
      "pattern": "(?<=之所以[^，,。！？；;]{2,65})的原因(?=[，,]\\s*是因为)",
      "replace": "",
      "message": "「之所以…是因为…」 đã diễn đạt nguyên nhân. Bỏ 「的原因」 bị lặp.",
      "kind": "fix"
    },
    {
      "id": "HSK6_CULTURAL_COLLOCATION",
      "hskLevel": 6,
      "category": "advanced_writing",
      "pattern": "培养(了?)([^，,。！？；;]{0,12}文化底蕴)",
      "replace": "丰富$1$2",
      "message": "「文化底蕴」 thường đi với 丰富 hoặc 增强. Nếu ý là làm phong phú nền tảng văn hóa, dùng 丰富.",
      "kind": "style"
    },
    {
      "id": "HSK6_PREVENT_DOUBLE_NEGATIVE",
      "hskLevel": 6,
      "category": "advanced_writing",
      "pattern": "(以防[^，,。！？；;]{1,18})不再(发生|出现)",
      "replace": "$1再次$2",
      "message": "「以防」 đã mang nghĩa phòng ngừa. Nếu ý là ngăn tái diễn, dùng 「以防…再次发生」.",
      "kind": "style"
    },
    {
      "id": "HSK6_BINARY_ONE_SIDED",
      "hskLevel": 6,
      "category": "advanced_writing",
      "pattern": "能否([^，,。！？；;]{2,40})([，,]\\s*是[^，,。！？；;]{2,40}的)(必然选择|重要前提|必要条件)",
      "replace": "$1$2$3",
      "message": "Vế 能否 nêu hai khả năng, còn vế sau khẳng định một điều kiện. Nếu muốn khẳng định việc cần làm, bỏ 能否.",
      "kind": "style"
    },
    {
      "id": "HSK6_THROUGH_CAUSATIVE",
      "hskLevel": 6,
      "category": "advanced_writing",
      "pattern": "(?<=(?:^|[，,。！？；])通过[^，,。！？；;]{2,35}[，,]\\s*)使(?=[^，,。！？；;]{2,35}得以)",
      "replace": "",
      "message": "Trong mẫu 「通过…，使…得以…」 ở đầu câu, có thể bỏ 使 để vế sau có chủ ngữ.",
      "kind": "style"
    }
  ]
};


  // Examine whole constructions in a sentence. Keep edits anchored to the
  // smallest part we can explain, and keep ambiguous readings as review cards.
  function structuralErrors(sentence) {
    const errors = [];
    // Mask quotations without changing UTF-16 offsets or inventing clause boundaries.
    const text = sentence.replace(/“[^”]*”|「[^」]*」|『[^』]*』|《[^》]*》|"[^"]*"/gu, value => ' '.repeat(value.length));
    const clauses = [...text.matchAll(/[^，,；;。！？!?：:]+/gu)].flatMap(match => {
      const content = match[0].trim();
      return content ? [{content, start: match.index + match[0].indexOf(content), end: match.index + match[0].trimEnd().length}] : [];
    });

    function add(start, end, replacement, ruleId, reason, kind = 'style') {
      const original = sentence.slice(start, end);
      if (!original || original === replacement) return;
      errors.push({
        start, end, original, replacement: replacement ?? '',
        ruleId, reason, kind, source: 'local', category: 'sentence_structure',
        hskLevel: 6, reviewOnly: replacement == null
      });
    }

    for (let i = 0; i < clauses.length; i++) {
      const current = clauses[i];
      const next = clauses[i + 1];
      const value = current.content;
      const directlyFollows = next && /^[，,]\s*$/u.test(text.slice(current.end, next.start));

      if (directlyFollows) {
        // A paired connective should match the relation of the first clause.
        // Stop at new clauses and leave explicitly nested conditions alone.
        const openers = [...value.matchAll(/只有|只要|除非|如果/gu)];
        const opener = openers.length === 1 && openers[0].index <= 10 ? openers[0][0] : '';
        const closer = next.content.match(/^(就(?!算|是|连|此|近|地|餐|位|业)|便(?!利|宜|捷|民|于)|才(?!华|能是|智|干))(?=[^\s])/u);
        if (opener && opener !== '如果' && closer) {
          const left = opener;
          const [, right] = closer;
          if ((left === '只要') === (right === '才')) {
            const rightPair = left === '只要' ? '只要…就…' : left + '…才…';
            add(next.start, next.start + right.length, null, 'STRUCT_CONDITION',
              'Hai vế dùng cặp điều kiện khác nhau. Nếu giữ ý của vế đầu, dùng 「' + rightPair + '」. Hãy xác nhận quan hệ bạn muốn diễn đạt.');
          }
        }

        const intro = /^(?:通过|经过|由于|凭借|鉴于)[\p{Script=Han}]{2,}$/u.test(value);
        const causative = next.content.match(/^(使得?|让|令)(?=[\p{Script=Han}]{2,})/u);
        const followsSentenceIntro = clauses.slice(0, i).every(clause =>
          /^(?:近年来|目前|过去|如今|日前|此前|随着|在[^，]{1,35}(?:下|中|后|时)$)/u.test(clause.content));
        if (intro && causative && followsSentenceIntro && !/^(?:让步|让利|令牌|使者|使命|使用|使团|使馆|令人[^，]{1,12}的是|让我[^，]{1,12}的是)/u.test(next.content)) {
          add(next.start, next.start + causative[0].length, null, 'STRUCT_MISSING_SUBJECT',
            'Vế đầu là cụm dẫn nhập. Sau đó câu mở bằng động từ gây khiến nên hãy kiểm tra chủ ngữ. Có thể bổ sung chủ ngữ hoặc bỏ động từ gây khiến nếu vế sau tự đứng được.');
        }

        const twoSided = value.match(/(?:^|[^既])(能否|是否|可否|能不能|会不会)(?=[\p{Script=Han}]{2,})/u);
        const oneSided = next.content.match(/^(?:关键|重点|核心|根本)(?:就)?在于(?:必须|应该|应当|要|一定要)(?=[\p{Script=Han}])/u);
        if (twoSided && oneSided && !/(?:以及|还是|或者|与否)/u.test(value)) {
          add(next.start, next.start + oneSided[0].length, null, 'STRUCT_POLARITY',
            'Vế đầu hỏi có hay không, còn vế sau nêu một việc phải làm. Nếu muốn giữ hai khả năng, có thể dùng 「取决于是否…」. Nếu muốn nêu yêu cầu, hãy viết lại vế đầu theo hướng khẳng định.');
        }
      }

      const composition = value.match(/(?:包括|包含|涵盖)([^，。！？；：]{3,65}?)(等(?:几个|若干|多个)?(?:部分|方面|环节|内容|要素|项目|类别|成员)?)(?:所)?组成$/u);
      if (composition && !/由[^，。！？；]{0,45}$/u.test(value.slice(0, composition.index))) {
        const ending = composition[0].match(/(?:所)?组成$/u)[0];
        add(current.end - ending.length, current.end, '', 'STRUCT_COMPOSITION',
          '「包括…」 đã giới thiệu thành phần. Bỏ 「' + ending + '」 hoặc dùng trọn mẫu 「由…组成」.', 'fix');
      }

      const mixedCause = value.match(/(?:是由于|是因为)([\p{Script=Han}]{2,45})(所致|造成的|导致的)$/u);
      if (mixedCause) {
        add(current.end - mixedCause[2].length, current.end, '', 'STRUCT_CAUSE',
          'Câu đang ghép 「是因为／是由于…」 với một đuôi chỉ nguyên nhân. Bỏ đuôi này để giữ mẫu đầu.', 'fix');
      }

      for (const match of value.matchAll(/(?:防止|以防|以免|避免)([^，。！？；]{0,30}?(?:事故|冲突|错误|灾害|问题|悲剧|故障|风险|纠纷))(不再|不要)(?=(?:发生|出现|重演|上演|扩大|恶化|蔓延)(?:$|的|了|后))/gu)) {
        const start = current.start + match.index + match[0].length - match[2].length;
        add(start, start + match[2].length, match[2] === '不再' ? '再次' : '', 'STRUCT_PREVENTION',
          'Động từ ở đầu cụm đã mang nghĩa ngăn ngừa. Nếu ý là ngăn sự việc xảy ra hay tái diễn, sửa cụm phủ định để tránh đảo nghĩa.');
      }

      const mixedFocus = value.match(/围绕(以)?([\p{Script=Han}]{2,40})(为(?:中心|核心|主题|主线))(?=$|开展|进行|推进|展开)/u);
      if (mixedFocus) {
        const start = current.start + mixedFocus.index;
        const end = start + mixedFocus[0].length;
        add(start, end, '围绕' + mixedFocus[2], 'STRUCT_FOCUS',
          '「围绕…」 và 「以…为中心／主题」 là hai cách dựng câu. Giữ một mẫu để tránh chồng cấu trúc.', 'fix');
      }

      const duplicatedMajority = value.match(/(?:大多|多数|主要)(?:都是|是)?以([\p{Script=Han}]{2,32})为主$/u);
      if (duplicatedMajority) {
        const start = current.start + duplicatedMajority.index;
        add(start, current.end, '以' + duplicatedMajority[1] + '为主', 'STRUCT_MAJORITY',
          '「以…为主」 đã chỉ thành phần chiếm ưu thế. Có thể lược từ chỉ số đông ở đầu cụm.');
      }

      const mixedPassive = value.match(/(?:深受|受到|受到了)([\p{Script=Han}]{2,30}?)所(?=(?:欢迎|喜爱|支持|重视|青睐|认可|认同|称赞|关注|批评|赞扬)$)/u);
      if (mixedPassive) {
        const end = current.start + mixedPassive.index + mixedPassive[0].length;
        add(end - 1, end, '', 'STRUCT_PASSIVE',
          '「受到…」 và 「为…所…」 là hai cấu trúc bị động. Nếu giữ 「受到」, bỏ 「所」.', 'fix');
      }

      const reduction = value.match(/(?:降低|减少|下降|缩短|压缩)(?:了|近|约|将近|大约)?(?:[一二两三四五六七八九十百千]+|\d+(?:\.\d+)?)倍(?=$|以上|左右)/u);
      if (reduction) {
        const start = current.start + reduction.index;
        add(start, start + reduction[0].length, null, 'STRUCT_REDUCTION',
          'Cách nói “giảm X lần” có thể khiến người đọc hiểu sai. Hãy kiểm tra số gốc rồi ghi phần trăm đã giảm hoặc tỷ lệ còn lại.');
      }

      // Policy verbs take a noun object. A coordinated list of action phrases
      // can be turned into that object with 等措施. Explicit objects are valid.
      const policy = value.match(/(?:出台|颁布|制定)(?:了|过)?(.+)$/u);
      if (policy) {
        const actions = policy[1].split(/、|以及|和|并(?:且)?/u).map(action => action.trim());
        const verb = /^(?:延长|缩短|扩大|增设|增开|增派|举办|开展|加强|减免|降低|提高|简化|设置|设立|增加|减少|暂停|恢复|优化|完善|调整|发放|开放)(?=[\p{Script=Han}]{2,})/u;
        const explicitObject = /(?:办法|措施|方案|通知|细则|条例|规定|政策|制度|计划|标准|目录|意见|规则|法规|文件|指南|要求|公告|草案|决议|议案)$/u;
        if (actions.length >= 2 && actions.every(action => verb.test(action)) && !explicitObject.test(policy[1])) {
          const last = actions.at(-1);
          add(current.end - last.length, current.end, last + '等措施', 'STRUCT_POLICY_OBJECT',
            '「出台／颁布／制定」 thường cần danh từ làm tân ngữ. Thêm 「等措施」 để cả danh sách hành động trở thành tân ngữ.');
        }
      }

      const beneficiary = value.match(/对于([\p{Script=Han}]{2,34}?)提供了(?=[\p{Script=Han}]{2,})/u);
      if (beneficiary && /(?:参考|建议|帮助|支持|便利|保障|服务|信息|机会|条件|方案|工具|依据)(?:等)?$/u.test(value)
          && !/^(?:是否|如何|为何|什么|为什么|谁|能否)/u.test(beneficiary[1])
          && !/(?:问题|现象|困难|情况|变化|影响|行为|缺陷|故障|挑战)$/u.test(beneficiary[1])) {
        const start = current.start + beneficiary.index;
        add(start, start + 2, '为', 'STRUCT_BENEFICIARY',
          'Nếu phần sau 「对于」 là người hoặc hoạt động được hỗ trợ, dùng mẫu 「为…提供…」.');
      }

      for (const match of value.matchAll(/([\p{Script=Han}]{2,24})(?:以及|和|与)(图书|车辆|水果|家具|乐器|电器)$/gu)) {
        const groups = {
          图书: /(?:小说|课本|名著|词典|字典|古籍|画册|绘本|读物)$/u,
          车辆: /(?:汽车|公交车|货车|摩托车|出租车)$/u,
          水果: /(?:苹果|橘子|香蕉|葡萄|梨子|西瓜)$/u,
          家具: /(?:书柜|桌椅|沙发|衣柜|餐桌)$/u,
          乐器: /(?:钢琴|古筝|吉他|小提琴|笛子)$/u,
          电器: /(?:冰箱|电视机|洗衣机|空调|微波炉)$/u
        };
        const [full, specific, group] = match;
        if (!groups[group].test(specific)) continue;
        const end = current.start + match.index + full.length;
        add(end - group.length, end, null, 'STRUCT_CATEGORY_OVERLAP',
          'Mục cuối có thể bao gồm mục đứng trước. Nếu bạn định nói phần còn lại của nhóm, hãy thêm 「其他」 trước danh từ cuối.');
      }
    }
    return errors;
  }

  function clone(value){return JSON.parse(JSON.stringify(value));}
  function normalizePinyin(value=''){
    return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ü/g,'v').replace(/[^a-z]/gi,'').toLowerCase();
  }
  function compileRules(config){
    const macros=config?.macros||{};
    return (config?.rules||[]).map((rule,index)=>{
      const source=String(rule.pattern||'').replace(/\{\{(\w+)\}\}/g,(_,name)=>macros[name]||'');
      try{return {...rule,order:index,source,regex:new RegExp(source,rule.flags||'g')};}
      catch{return null;}
    }).filter(Boolean);
  }

  class SymSpellChineseEngine{
    constructor(maxEditDistance=1){
      this.maxEditDistance=maxEditDistance;this.dictionary=new Map();this.deleteIndex=new Map();this.pinyinIndex=new Map();
    }
    clear(){this.dictionary.clear();this.deleteIndex.clear();this.pinyinIndex.clear();}
    generateDeletes(word,maxDist){
      const out=new Set(),queue=[{value:word,distance:0}];
      while(queue.length){const current=queue.shift();if(current.distance>=maxDist||current.value.length<=1)continue;
        for(let i=0;i<current.value.length;i++){const next=current.value.slice(0,i)+current.value.slice(i+1);if(out.has(next))continue;out.add(next);queue.push({value:next,distance:current.distance+1});}
      }return out;
    }
    _index(value,key){if(!value)return;let bucket=this.deleteIndex.get(value);if(!bucket)this.deleteIndex.set(value,bucket=new Set());bucket.add(key);}
    addEntry(entry={}){
      const word=String(entry.han||entry.word||'').trim();if(!word||!HAN.test(word)||word.length<2||word.includes('…'))return;
      const key=word.toLowerCase(),hsk=Math.max(1,Math.min(6,Number(entry.hsk)||3));
      const frequency=Number(entry.frequency)||((7-hsk)*100+word.length*5);
      const existing=this.dictionary.get(key);if(existing&&existing.frequency>=frequency)return;
      this.dictionary.set(key,{word,pinyin:entry.pin||entry.pinyin||'',hsk,frequency});
      const pinyin=normalizePinyin(entry.pin||entry.pinyin||'');
      if(pinyin){let rows=this.pinyinIndex.get(pinyin);if(!rows)this.pinyinIndex.set(pinyin,rows=[]);rows.push({word,frequency});this._index(pinyin,key);}
      this._index(key,key);for(const variant of this.generateDeletes(key,Math.min(this.maxEditDistance,1)))this._index(variant,key);
    }
    damerauLevenshtein(a,b,limit=2){
      if(Math.abs(a.length-b.length)>limit)return limit+1;
      const previous=Array.from({length:b.length+1},(_,i)=>i);let before=null;
      for(let i=1;i<=a.length;i++){const row=[i];let min=i;
        for(let j=1;j<=b.length;j++){const cost=a[i-1]===b[j-1]?0:1;let value=Math.min(row[j-1]+1,previous[j]+1,previous[j-1]+cost);
          if(before&&i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])value=Math.min(value,before[j-2]+1);row[j]=value;min=Math.min(min,value);}
        if(min>limit)return limit+1;before=previous.slice();for(let j=0;j<row.length;j++)previous[j]=row[j];
      }return previous[b.length];
    }
    lookup(query){
      const value=String(query||'').toLowerCase();if(!value)return null;if(this.dictionary.has(value))return null;
      const isHan=HAN.test(value),normalized=normalizePinyin(value),variants=this.generateDeletes(value,1);variants.add(value);
      const candidates=new Set();for(const variant of variants){const bucket=this.deleteIndex.get(variant)||[];
        // Short delete keys are shared by many ordinary HSK words.  Skipping
        // an oversized bucket keeps the realtime path bounded and avoids
        // turning a normal sentence into a full-dictionary scan.
        if(isHan&&bucket.size>80)continue;for(const key of bucket){candidates.add(key);if(isHan&&candidates.size>=160)break;}if(isHan&&candidates.size>=160)break;}
      let best=null;
      for(const key of candidates){const entry=this.dictionary.get(key);if(!entry)continue;if(isHan&&entry.word.length!==value.length)continue;
        const distance=this.damerauLevenshtein(value,isHan?key:(normalizePinyin(entry.pinyin)||key),1);if(distance>1)continue;
        if(!best||distance<best.distance||distance===best.distance&&entry.frequency>best.frequency)best={entry,distance};
      }
      if(best)return {suggestion:best.entry.word,distance:best.distance,type:'spelling',message:`Có thể bạn muốn viết 「${best.entry.word}」?`,confidence:best.distance===1?.91:.99};
      if(normalized&&normalized!==value){const rows=this.pinyinIndex.get(normalized)||[];if(rows.length)return {suggestion:rows[0].word,distance:1,type:'homophone',message:`Pinyin này thường được viết là 「${rows[0].word}」.`,confidence:.82};}
      return null;
    }
    lookupHan(query){return String(query||'').length>=3?this.lookup(query):null;}
  }

  class UnifiedGrammarChecker{
    constructor(config=DEFAULT_CONFIG){this.config=config;this.rules=compileRules(config);this.symSpell=new SymSpellChineseEngine(1);this.sentenceCache=new Map();this.cacheHits=0;this.datasetVersion='fallback';this.stats={checks:0,cacheHits:0,words:0,rules:this.rules.length};}
    setRules(config){if(!config||!Array.isArray(config.rules))return false;this.config=config;this.rules=compileRules(config);this.sentenceCache.clear();this.stats.rules=this.rules.length;return true;}
    refresh(vocabulary=[],facts=null){
      this.symSpell.clear();const seen=new Set();for(const item of Array.isArray(vocabulary)?vocabulary:[]){const key=String(item?.han||item?.word||'');if(!key||seen.has(key))continue;seen.add(key);this.symSpell.addEntry(item);}
      const report=facts?.report||{};this.datasetVersion=[seen.size,report.checkedWords||'',report.targetedNotes||'',this.config.version].join(':');this.sentenceCache.clear();this.stats.words=seen.size;return this.datasetVersion;
    }
    splitSentences(text){const rows=[],re=/(?:(?<=\d)\.(?=\d)|[^.!?。！？\n])+(?:(?<!\d)\.|\.(?!\d)|[!?。！？\n])*/gu;let match;while((match=re.exec(text))!==null)rows.push({text:match[0],offset:match.index});if(!rows.length&&text)rows.push({text,offset:0});return rows;}
    _ruleErrors(sentence){const errors=[];for(const rule of this.rules){const re=new RegExp(rule.source,rule.regex.flags);let match;while((match=re.exec(sentence))!==null){const wrong=match[0],replacement=String(rule.replace??wrong).replace(/\$(\$|&|\d{1,2})/g,(_,key)=>key==='$'?'$':key==='&'?wrong:(match[Number(key)]??''));if(!wrong){if(!re.global)break;re.lastIndex++;continue;}if(replacement===wrong)continue;errors.push({kind:rule.kind||'fix',source:'local',ruleId:rule.id,category:rule.category,start:match.index,end:match.index+wrong.length,original:wrong,replacement,reason:rule.message,hskLevel:rule.hskLevel});if(!re.global)break;}}return errors;}
    _spellingErrors(sentence,existing){const errors=[],blocked=(start,end)=>existing.some(item=>start<item.end&&end>item.start);const latin=/[A-Za-z][A-Za-z'’-]{2,}/gu;let match;
      while((match=latin.exec(sentence))!==null){const result=this.symSpell.lookup(match[0]);if(result&&!blocked(match.index,match.index+match[0].length))errors.push({kind:'style',source:'local',category:'spelling',start:match.index,end:match.index+match[0].length,original:match[0],replacement:result.suggestion,reason:result.message,confidence:result.confidence});}
      for(const run of sentence.matchAll(HAN_RUN)){const value=run[0],offset=run.index||0;if(value.length<3)continue;
        // Four-character chunks catch common HSK idiom/word typos while the
        // dictionary check prevents warnings for every ordinary Hanzi pair.
        for(let i=0;i<=value.length-3;i++){const size=value.length>=4?4:3;if(i+size>value.length)break;const start=offset+i,end=start+size;if(blocked(start,end))continue;const result=this.symSpell.lookupHan(value.slice(i,i+size));if(!result||result.confidence<.85)continue;errors.push({kind:'style',source:'local',category:'spelling',start,end,original:value.slice(i,i+size),replacement:result.suggestion,reason:result.message,confidence:result.confidence});}
      }return errors;
    }
    analyzeSentence(sentence){const cached=this.sentenceCache.get(sentence);if(cached){this.cacheHits++;this.stats.cacheHits++;return cached.map(item=>({...item}));}
      const grammar=[...this._ruleErrors(sentence),...structuralErrors(sentence)];
      const spelling=this._spellingErrors(sentence,grammar);
      const ranked=[...grammar,...spelling].sort((a,b)=>
        Number(Boolean(a.reviewOnly))-Number(Boolean(b.reviewOnly))||a.start-b.start||b.end-b.start);
      const accepted=[];
      for(const item of ranked){
        if(!accepted.some(other=>item.start<other.end&&item.end>other.start))accepted.push(item);
      }
      accepted.sort((a,b)=>a.start-b.start);if(this.sentenceCache.size>=200)this.sentenceCache.delete(this.sentenceCache.keys().next().value);this.sentenceCache.set(sentence,accepted);return accepted.map(item=>({...item}));}
    checkText(text){this.stats.checks++;if(!text)return [];const errors=[];for(const sentence of this.splitSentences(String(text)))for(const item of this.analyzeSentence(sentence.text))errors.push({...item,start:item.start+sentence.offset,end:item.end+sentence.offset});return errors;}
    metrics(){return {...this.stats,cacheSize:this.sentenceCache.size,datasetVersion:this.datasetVersion};}
  }

  const checker=new UnifiedGrammarChecker();
  checker.ready=(async()=>{try{const response=await fetch('./src/modules/translation/hsk-grammar-rules.json',{cache:'no-store'});if(response.ok)checker.setRules(await response.json());}catch{}return checker;})();
  function refreshFromApp(){const bridge=window.HSKVocabularyBridge;if(!bridge?.snapshot)return;try{checker.refresh(bridge.snapshot(),bridge.facts?.());}catch{}}
  window.addEventListener('hsk-lessons-ready',refreshFromApp);window.addEventListener('hsk-sentence-checker-refresh',refreshFromApp);refreshFromApp();
  window.HSKSentenceCheckerCore={checker,UnifiedGrammarChecker,SymSpellChineseEngine,compileRules,normalizePinyin,defaultConfig:clone(DEFAULT_CONFIG),refresh:refreshFromApp};
})();
