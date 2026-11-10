/* Small, bounded candidate generator and contextual features shared by training and inference. */
(() => {
  'use strict';

  const width = 512;
  const families = [
    ['spelling', '以经', '已经', 'Dùng 已经 để nói việc đã xảy ra.'],
    ['spelling', '应为', '因为', 'Dùng 因为 khi nêu nguyên nhân.'],
    ['spelling', '在见', '再见', 'Dùng 再见 khi chào tạm biệt.'],
    ['spelling', '觉的', '觉得', 'Dùng 觉得 để diễn đạt cảm nhận hoặc ý kiến.'],
    ['spelling', '因该', '应该', 'Viết 应该 khi nói điều nên làm.'],
    ['spelling', '希忘', '希望', 'Viết 希望 khi diễn đạt điều mong muốn.'],
    ['collocation', '穿眼镜', '戴眼镜', 'Khi nói đeo kính, dùng 戴眼镜.'],
    ['collocation', '听书', '看书', 'Nếu ý là đọc chữ trên sách, dùng 看书.'],
    ['particle', '跑的', '跑得', 'Dùng 得 trước bổ ngữ mức độ của 跑.'],
    ['particle', '说的', '说得', 'Dùng 得 trước bổ ngữ mức độ của 说.'],
    ['particle', '写的', '写得', 'Dùng 得 trước bổ ngữ mức độ của 写.'],
    ['particle', '唱的', '唱得', 'Dùng 得 trước bổ ngữ mức độ của 唱.'],
    ['classifier', '只书', '本书', 'Khi đếm sách, dùng lượng từ 本.'],
    ['classifier', '本猫', '只猫', 'Khi đếm mèo, dùng lượng từ 只.'],
    ['classifier', '件照片', '张照片', 'Khi đếm ảnh, dùng lượng từ 张.'],
    ['classifier', '张衣服', '件衣服', 'Khi đếm quần áo, dùng lượng từ 件.']
  ];
  const degree = /^(?:很|真|太|挺|更|非常|特别|比较|不太|不够|比|快|慢|好|差|清楚|流利|漂亮|整齐|认真)/u;
  const completeDegree = /^(?:(?:很|真|太|挺|更|非常|特别|比较|不太|不够)?(?:快|慢|好|差|清楚|流利|漂亮|整齐|认真)|比[\p{Script=Han}]{1,5}(?:快|慢|好|差))了?\s*$/u;
  const number = /[零一二两三四五六七八九十百千万几每这那各\d]$/u;
  const causes = /^(?:我|你|他|她|它|天|下雨|生病|工作|学习|今天|昨天|明天|没有|没|路上|天气|时间|太|很|不|要|有|家|考|刚|这|那)/u;
  const reasonContext = {
    '觉的': left => !/[感觉知听视嗅味触察睡]$/u.test(left),
    '以经': (left, right) => !/[可足何得]$/u.test(left) && !/^(?:常|过|验|典|营)/u.test(right),
    '因该': (left, right) => /^(?:早|多|少|先|好好|认真|休息|回|学|去|来|做|看|写|读|吃|喝|睡|准备)/u.test(right),
    '应为': (left, right) => !/应$/.test(left) && causes.test(right) && !/^(?:零|正数|负数|被|人民|客户|其|公共)/u.test(right),
    '在见': (left, right) => !left.trim() && !right.trim(),
    '听书': (left, right) => /(?:用眼睛|逐字|默默地)$/u.test(left) || /^(?:上的字|本上的字)/u.test(right)
  };

  function candidates(text) {
    const spans = [];
    for (const match of text.matchAll(/[^。！？!?；;\n，,：:“”「」『』《》]+/gu)) {
      const clause = match[0];
      const first = match.index;
      const before = text.slice(0, first);
      const quoteCount = (before.match(/["“”「」『』《》]/g) || []).length;
      if (quoteCount % 2 || /https?:\/\//iu.test(clause)) continue;
      for (const [kind, original, replacement, reason] of families) {
        let offset = clause.indexOf(original);
        while (offset !== -1 && spans.length < 32) {
          const left = clause.slice(0, offset);
          const right = clause.slice(offset + original.length);
          const eligible = kind === 'particle' ? completeDegree.test(right)
            : kind === 'classifier' ? number.test(left) && !/^包/u.test(right)
            : !reasonContext[original] || reasonContext[original](left, right);
          if (eligible) {
            const start = first + offset;
            spans.push({start, end: start + original.length, original, replacement, reason, family: kind});
          }
          offset = clause.indexOf(original, offset + original.length);
        }
      }
    }
    return spans.sort((a, b) => a.start - b.start);
  }

  function features(text, edit, target, offset = 0) {
    const vector = target.subarray(offset, offset + width);
    const left = Array.from(text.slice(0, edit.start)).slice(-8).join('');
    const right = Array.from(text.slice(edit.end)).slice(0, 8).join('');
    const add = (key, scale = 1) => {
      let hash = 2166136261;
      for (let index = 0; index < key.length; index++) hash = Math.imul(hash ^ key.charCodeAt(index), 16777619);
      vector[(hash >>> 0) % width] += (hash & 512 ? -1 : 1) * scale;
    };
    add('family:' + edit.family);
    add('edit:' + edit.original, 2);
    add('before-number:' + number.test(left) + ':' + edit.family);
    add('after-degree:' + degree.test(right) + ':' + edit.family);
    add('after-cause:' + causes.test(right) + ':' + edit.family);
    add('start:' + !left.trim() + ':' + edit.family);
    add('end:' + !right.trim() + ':' + edit.family);
    add('quote:' + /["“”「」『』《》]/u.test(left + right) + ':' + edit.family);
    for (const [side, chars] of [['L', Array.from(left).reverse()], ['R', Array.from(right)]]) {
      for (let index = 0; index < Math.min(chars.length, 4); index++) {
        add(side + index + chars[index]);
        if (index < 2) add(edit.family + side + index + chars[index], 0.5);
      }
    }
  }

  const core = {width, families, candidates, features};
  if (typeof module === 'object' && module.exports) module.exports = core;
  else globalThis.HSKSentenceOnnxCore = core;
})();
