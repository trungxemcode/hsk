#!/usr/bin/env python3
"""Build compact offline Mandarin corpus frequency table for HSK search ranking.

Source: jieba/dict.txt (MIT License, modern Chinese corpus word frequencies)
augmented with high-frequency everyday contemporary Mandarin terms that entered
common usage after jieba's baseline corpus.

Output:
  - content/data/wordFrequency.js      (classic script defining `const wordFrequency=...`)
  - content/data/wordFrequency.js.gz   (gzipped bundle loaded by loader.js)
"""
import glob
import gzip
import json
import math
import os
import re
import sys

import jieba

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_JS = os.path.join(ROOT, "content", "data", "wordFrequency.js")
OUT_GZ = os.path.join(ROOT, "content", "data", "wordFrequency.js.gz")

HAN_RE = re.compile(r"^[\u3400-\u9fff]{1,4}$")

# Contemporary everyday words with very high real-world lookup volume
# (tier 20..26 out of 30) that post-date classic news corpora.
MODERN_EVERYDAY_BOOST = {
    "微信": 26, "支付宝": 25, "外卖": 25, "奶茶": 24, "高铁": 24,
    "扫码": 24, "点赞": 23, "网购": 23, "直播间": 23, "短视频": 23,
    "网红": 22, "打卡": 22, "加班": 23, "熬夜": 23, "快递": 24,
    "充电宝": 22, "表情包": 21, "朋友圈": 23, "小程序": 22, "二维码": 23,
    "拼多多": 20, "淘宝": 23, "抖音": 23, "小红书": 21, "空调": 24,
    "地铁": 25, "打车": 23, "共享单车": 20, "新能源": 21, "人工智能": 22,
    "躺平": 20, "内卷": 20, "种草": 20, "破防": 19, "闺蜜": 22,
    "老板": 25, "手机": 27, "电脑": 26, "米饭": 24, "饭": 26,
    "心": 28, "新": 29, "信": 26, "请": 28, "求": 24, "申请": 23,
    "对不起": 25, "请假": 22, "讨饭": 16, "乞讨": 16,
}


def collect_app_vocab():
    vocab = set()
    # 1. HSK words.js
    words_txt = open(os.path.join(ROOT, "content", "data", "words.js"), encoding="utf8").read()
    for m in re.finditer(r'"han":"([^"]+)"', words_txt):
        vocab.add(m.group(1))
    # 2. usageFactsData.js
    uf_txt = open(os.path.join(ROOT, "content", "data", "usageFactsData.js"), encoding="utf8").read()
    uf_start = uf_txt.find("{")
    uf_end = uf_txt.rfind("}")
    uf_obj = json.loads(uf_txt[uf_start:uf_end + 1])
    for han in (uf_obj.get("words") or {}).keys():
        vocab.add(han)
    # 3. CC-CEDICT shards
    for gz_path in sorted(glob.glob(os.path.join(ROOT, "content", "open-dictionary", "*.json.gz"))):
        rows = json.loads(gzip.open(gz_path, "rt", encoding="utf8").read())
        for row in rows:
            if row and isinstance(row[0], str):
                vocab.add(row[0])
    return vocab


def main():
    vocab = collect_app_vocab()
    dict_path = os.path.join(os.path.dirname(jieba.__file__), "dict.txt")
    freqs = {}
    with open(dict_path, encoding="utf8") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) < 2 or not parts[1].isdigit():
                continue
            word = parts[0]
            if not HAN_RE.match(word) or word not in vocab:
                continue
            val = int(parts[1])
            if val > freqs.get(word, 0):
                freqs[word] = val

    # Take top 30,000 matched Mandarin words and map log-frequency cleanly to tiers 1..30.
    ranked = sorted(freqs.items(), key=lambda kv: (-kv[1], len(kv[0]), kv[0]))[:30000]
    if not ranked:
        raise RuntimeError("No matched frequency entries found.")

    max_log = math.log10(ranked[0][1] + 1)
    min_log = math.log10(ranked[-1][1] + 1)
    span = max(0.001, max_log - min_log)

    word_tier = {}
    for word, count in ranked:
        norm = (math.log10(count + 1) - min_log) / span
        tier = max(1, min(30, int(round(1 + norm * 29))))
        word_tier[word] = tier

    for word, tier in MODERN_EVERYDAY_BOOST.items():
        if word in vocab and tier > word_tier.get(word, 0):
            word_tier[word] = tier

    # Group into 30 compact space-separated strings (index 0 = tier 1, index 29 = tier 30).
    buckets = [[] for _ in range(30)]
    for word, tier in sorted(word_tier.items(), key=lambda kv: (-kv[1], len(kv[0]), kv[0])):
        buckets[tier - 1].append(word)

    payload = {
        "version": 1,
        "source": "jieba-corpus-mit+modern-curated",
        "count": len(word_tier),
        "tiers": [" ".join(b) for b in buckets],
    }
    js_content = "const wordFrequency=" + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n"

    with open(OUT_JS, "w", encoding="utf8", newline="\n") as f:
        f.write(js_content)

    gz_bytes = gzip.compress(js_content.encode("utf8"), compresslevel=9, mtime=0)
    with open(OUT_GZ, "wb") as f:
        f.write(gz_bytes)

    print(
        f"Built wordFrequency: {len(word_tier)} entries | "
        f"JS={len(js_content.encode('utf8'))/1024:.1f} KB | "
        f"GZ={len(gz_bytes)/1024:.1f} KB"
    )
    for sample in ["新", "心", "请", "信", "求", "申请", "恳求", "饭", "米饭", "吃饭", "赚", "剑", "检查", "手机", "微信", "外卖", "馨", "信手", "伈"]:
        print(f"  {sample:5s} -> tier {word_tier.get(sample, 0)}/30")


if __name__ == "__main__":
    main()
