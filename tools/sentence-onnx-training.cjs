/* Synthetic examples. The held-out cases are kept out of the fitting loop. */
const core = require('../src/modules/translation/sentence-onnx-core.js');
const examples = [];
const subjects = ['我', '他', '她', '老师', '小王', '弟弟', '姐姐', '同学', '妈妈', '爸爸'];
const templates = {
  '以经': ['%以经吃过饭了。', '%以经准备好了。', '%以经买了票。'],
  '应为': ['%没去，应为他生病了。', '%想休息，应为今天太累了。', '%很开心，应为我来了。'],
  '在见': ['在见。', '%说：“在见。”'],
  '觉的': ['%觉的很有意思。', '%觉的这个问题不难。', '%觉的我们应该走了。'],
  '因该': ['%因该早点回来。', '%因该好好学习。', '%因该多休息。'],
  '希忘': ['%希忘明天不下雨。', '%希忘你能来。', '%希忘大家都开心。'],
  '穿眼镜': ['%每天都穿眼镜。', '%看黑板要穿眼镜。', '%穿眼镜出门。'],
  '听书': ['%用眼睛听书。', '%正在听书上的字。', '%逐字听书。'],
  '跑的': ['%跑的很快。', '%跑的太慢了。', '%跑的比我快。'],
  '说的': ['%说的很清楚。', '%说的非常流利。', '%说的比我好。'],
  '写的': ['%写的很漂亮。', '%写的特别整齐。', '%写的比我慢。'],
  '唱的': ['%唱的真好。', '%唱的比以前好。', '%唱的非常认真。'],
  '只书': ['%买了三只书。', '%拿了两只书。', '%借了五只书。'],
  '本猫': ['%养了两本猫。', '%看见了三本猫。', '%喜欢那本猫。'],
  '件照片': ['%拍了五件照片。', '%洗了两件照片。', '%给了我三件照片。'],
  '张衣服': ['%买了两张衣服。', '%洗了三张衣服。', '%穿了那张衣服。']
};
for (const [original, patterns] of Object.entries(templates)) {
  for (const pattern of patterns) for (const subject of subjects) {
    examples.push([pattern.replace('%', subject), original, 1]);
  }
}
for (const subject of subjects) {
  examples.push(
    [subject + '跑的快车晚点了。', '跑的', 0],
    [subject + '说的好消息是什么？', '说的', 0],
    [subject + '写的很漂亮的字被选中了。', '写的', 0],
    [subject + '唱的好歌很多。', '唱的', 0],
    [subject + '填的答案应为正数。', '应为', 0],
    [subject + '听书很放松。', '听书', 0],
    [subject + '拿了三只书袋。', '只书', 0],
    [subject + '买了两本猫咪图鉴。', '本猫', 0],
    [subject + '选了三件照片墙装饰品。', '件照片', 0],
    [subject + '买了几张衣服收纳贴纸。', '张衣服', 0]
  );
}

function encode(rows) {
  return [...new Map(rows.map(row => [JSON.stringify(row), row])).values()].flatMap(([text, original, label]) =>
    core.candidates(text).filter(edit => edit.original === original).map(edit => {
      const input = new Float32Array(core.width);
      core.features(text, edit, input);
      return [Array.from(input), label];
    })
  );
}
process.stdout.write(JSON.stringify(encode(examples)));
