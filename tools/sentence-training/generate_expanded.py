
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "data" / "expanded-v1"
SPLITS = {0: "train", 1: "train", 2: "validation", 3: "validation", 4: "test", 5: "test"}
KINDS = (
    "character", "classifier", "particle", "aspect", "word_order",
    "missing_component", "redundancy", "collocation", "conjunction",
    "scope", "polarity", "parallelism", "ambiguity", "punctuation",
)

WORDS = {
    1: {
        "person": ["我", "你", "他", "她", "我们", "老师"],
        "place": ["学校", "家里", "商店", "公园", "北京", "图书馆"],
        "object": ["汉语", "米饭", "电影", "音乐", "苹果", "咖啡"],
        "verb": ["学习", "看", "买", "听", "吃", "写"],
        "time": ["今天", "明天", "昨天", "晚上", "早上", "周末"],
        "topic": ["天气", "考试", "工作", "朋友", "孩子", "学生"],
    },
    2: {
        "person": ["我哥哥", "你姐姐", "他同学", "她朋友", "我们老师", "他们家人"],
        "place": ["医院", "车站", "超市", "教室", "上海", "饭馆"],
        "object": ["生日礼物", "中文报纸", "那部电影", "这首歌", "两杯茶", "新手机"],
        "verb": ["准备", "借", "参加", "练习", "介绍", "选择"],
        "time": ["昨天晚上", "下个星期", "每天早上", "去年夏天", "吃饭以后", "放学以后"],
        "topic": ["身体", "旅行", "天气", "比赛", "礼物", "汉字"],
    },
    3: {
        "person": ["我的同事", "那位记者", "小王和小李", "她的孩子", "学校的学生", "这位客人"],
        "place": ["机场", "银行", "火车站", "办公室", "历史博物馆", "会议室"],
        "object": ["重要文件", "中文小说", "旅行计划", "调查结果", "新项目", "考试材料"],
        "verb": ["完成", "检查", "讨论", "安排", "说明", "保存"],
        "time": ["刚才", "下个月", "最近", "三年前", "会议结束后", "周一上午"],
        "topic": ["课程", "计划", "环境", "问题", "报告", "经验"],
    },
    4: {
        "person": ["研究人员", "项目负责人", "当地居民", "这家公司的员工", "参会代表", "医疗团队"],
        "place": ["研究中心", "服务大厅", "生产基地", "市中心", "培训现场", "国际机场"],
        "object": ["相关资料", "公共设施", "安全方案", "客户需求", "实验数据", "发展目标"],
        "verb": ["分析", "改善", "落实", "调整", "推动", "确认"],
        "time": ["经过一段时间", "会议开始前", "问题出现以后", "在过去几年中", "按照计划", "截至目前"],
        "topic": ["改革", "服务", "合作", "管理", "教育", "交通"],
    },
    5: {
        "person": ["调查小组", "专家团队", "企业管理者", "地方政府", "新闻发言人", "项目成员"],
        "place": ["实验室", "社区服务站", "产业园区", "新闻发布会", "项目现场", "海外市场"],
        "object": ["统计报告", "资源配置方案", "产品质量", "长期规划", "市场需求", "风险评估"],
        "verb": ["比较", "评估", "协调", "预测", "限制", "完善"],
        "time": ["从长远来看", "在此基础上", "经过反复研究", "在特殊情况下", "根据最新数据", "自去年以来"],
        "topic": ["政策", "经济", "技术", "文化", "就业", "投资"],
    },
    6: {
        "person": ["相关部门", "课题组成员", "审查委员会", "管理机构", "各方代表", "专业团队"],
        "place": ["公共管理平台", "跨区域合作中心", "司法审查机构", "灾害救援现场", "国际交流会议", "基础设施项目"],
        "object": ["制度建设方案", "综合治理报告", "法律适用问题", "应急响应机制", "跨文化传播项目", "财政投入安排"],
        "verb": ["论证", "统筹", "规范", "审议", "整合", "监督"],
        "time": ["从整体上看", "在充分论证之后", "就目前情况而言", "在多重因素影响下", "经过系统评估", "按照既定程序"],
        "topic": ["社会治理", "公共利益", "制度改革", "风险控制", "国际合作", "资源配置"],
    },
}

CHAR_PAIRS = {
    1: [("汉语", "汗语"), ("米饭", "米反"), ("电影", "电彤"), ("音乐", "音月"), ("苹果", "平果"), ("咖啡", "咖非")],
    2: [("医院", "医原"), ("朋友", "朋有"), ("比赛", "比塞"), ("汉字", "汗字"), ("礼物", "礼勿"), ("旅行", "旅形")],
    3: [("文件", "文侏"), ("计划", "计画"), ("问题", "问提"), ("报告", "报高"), ("经验", "经捡"), ("环境", "环镜")],
    4: [("资料", "资抖"), ("设施", "设失"), ("方案", "方按"), ("需求", "需球"), ("目标", "目表"), ("交通", "交诵")],
    5: [("报告", "报高"), ("配置", "配製"), ("质量", "质谅"), ("规划", "规化"), ("评估", "评姑"), ("政策", "规策")],
    6: [("制度", "制渡"), ("治理", "治里"), ("法律", "法侓"), ("机制", "机智"), ("传播", "传博"), ("财政", "财正")],
}

MEASURES = {
    1: [("一张", "纸"), ("一本", "书"), ("一只", "猫"), ("一杯", "水"), ("一件", "衣服"), ("一条", "鱼")],
    2: [("两张", "票"), ("三本", "杂志"), ("两把", "雨伞"), ("一部", "手机"), ("三条", "消息"), ("两件", "礼物")],
    3: [("一份", "报告"), ("两项", "任务"), ("三封", "邮件"), ("一所", "学校"), ("两座", "桥"), ("一门", "课程")],
    4: [("一项", "方案"), ("两套", "设备"), ("三家", "机构"), ("一批", "资料"), ("两座", "建筑"), ("一轮", "谈判")],
    5: [("一套", "制度"), ("两项", "指标"), ("三批", "样本"), ("一系列", "措施"), ("两种", "模式"), ("一场", "研讨会")],
    6: [("一项", "制度"), ("两套", "机制"), ("三类", "风险"), ("一系列", "政策"), ("两种", "路径"), ("一轮", "审查")],
}


def lex(level: int, variant: int) -> dict[str, str]:
    return {key: values[variant] for key, values in WORDS[level].items()}


def replace_once(text: str, old: str, new: str) -> tuple[str, str]:
    position = text.find(old)
    if position < 0:
        raise ValueError(f"cannot find {old!r} in {text!r}")
    return text[:position] + new + text[position + len(old):], new


def row(level: int, kind: str, variant: int, clean: str, bad: str, target: str | None = None, at: int | None = None) -> dict:
    if target is not None:
        start = at if at is not None else bad.find(target)
        if start < 0:
            raise ValueError(f"target {target!r} not in {bad!r}")
        end = start + len(target)
    else:
        if at is None:
            raise ValueError("insertion rows need at")
        start = end = at
    family = f"expanded-{kind}-hsk{level}-{variant}"
    return {
        "id": f"{family}-bad",
        "hsk": level,
        "family": family,
        "text": bad,
        "errors": [{"start": start, "end": end, "type": kind, "original": bad[start:end]}],
        "source": "expanded-v1-hand-authored-template",
    }, {
        "id": f"{family}-clean",
        "hsk": level,
        "family": family,
        "text": clean,
        "errors": [],
        "source": "expanded-v1-hand-authored-template",
    }


def make_case(kind: str, level: int, variant: int) -> tuple[str, str, str | None, int | None]:
    w = lex(level, variant)
    if kind == "character":
        good, typo = CHAR_PAIRS[level][variant]
        clean = f"{w['person']}喜欢{good}。"
        bad = f"{w['person']}喜欢{typo}。"
        return clean, bad, typo, None
    if kind == "classifier":
        good_measure, noun = MEASURES[level][variant]
        wrong = ["个", "个", "个", "个", "个", "个"][variant]
        good = good_measure
        number = good[:-1]
        clean = f"{w['person']}需要{good}{noun}。"
        bad = f"{w['person']}需要{number}{wrong}{noun}。"
        return clean, bad, wrong, None
    if kind == "particle":
        clean = f"{w['person']}{w['verb']}得很快。"
        bad = f"{w['person']}{w['verb']}的很快。"
        return clean, bad, "的", None
    if kind == "aspect":
        clean = f"{w['time']}{w['person']}没有{w['verb']}{w['place']}。"
        bad = f"{w['time']}{w['person']}没有{w['verb']}了{w['place']}。"
        return clean, bad, "了", None
    if kind == "word_order":
        clean = f"{w['person']}{w['time']}{w['verb']}{w['object']}。"
        bad = f"{w['person']}{w['verb']}{w['time']}{w['object']}。"
        return clean, bad, w['verb'] + w['time'], None
    if kind == "missing_component":
        clean = f"请把{w['object']}放在{w['place']}里。"
        bad = f"请{w['object']}放在{w['place']}里。"
        return clean, bad, None, bad.find(w['object'])
    if kind == "redundancy":
        patterns = [
            (f"{w['person']}大约来了十个人。", f"{w['person']}大约来了十个人左右。", "左右"),
            (f"{w['person']}一起讨论这个问题。", f"{w['person']}共同一起讨论这个问题。", "共同"),
            (f"{w['person']}已经完成任务。", f"{w['person']}已经完成了任务。", "了"),
            (f"{w['person']}比昨天更忙。", f"{w['person']}比昨天更加更忙。", "更加"),
            (f"{w['person']}首先介绍计划。", f"{w['person']}首先先介绍计划。", "先"),
            (f"{w['person']}反复检查资料。", f"{w['person']}反复重复检查资料。", "重复"),
        ]
        return (*patterns[variant], None)
    if kind == "collocation":
        pairs = [
            (f"{w['person']}提高了{w['topic']}的效率。", f"{w['person']}加快了{w['topic']}的效率。", "加快"),
            (f"{w['person']}扩大了{w['topic']}的影响。", f"{w['person']}延长了{w['topic']}的影响。", "延长"),
            (f"{w['person']}承担了重要责任。", f"{w['person']}承受了重要责任。", "承受"),
            (f"{w['person']}提出了新的要求。", f"{w['person']}制造了新的要求。", "制造"),
            (f"{w['person']}改善了服务质量。", f"{w['person']}改良了服务质量。", "改良"),
            (f"{w['person']}遵守相关规定。", f"{w['person']}服从相关规定。", "服从"),
        ]
        return (*pairs[variant], None)
    if kind == "conjunction":
        pairs = [
            (f"虽然{w['topic']}很复杂，但是{w['person']}仍然继续研究。", f"虽然{w['topic']}很复杂，所以{w['person']}仍然继续研究。", "所以"),
            (f"因为天气变化，所以活动延期。", f"因为天气变化，但是活动延期。", "但是"),
            (f"只有认真准备，才能完成任务。", f"只有认真准备，就能完成任务。", "就"),
            (f"只要按时提交，就可以参加考试。", f"只要按时提交，才可以参加考试。", "才"),
            (f"即使遇到困难，我们也不会放弃。", f"即使遇到困难，我们却不会放弃。", "却"),
            (f"不但完成了计划，而且提高了质量。", f"不但完成了计划，但是提高了质量。", "但是"),
        ]
        return (*pairs[variant], None)
    if kind == "scope":
        patterns = [
            (f"这些{w['object']}我不都喜欢。", f"这些{w['object']}我都不喜欢。", "都"),
            (f"不是所有{w['topic']}都需要调整。", f"所有{w['topic']}都不需要调整。", "所有"),
            (f"他未必完全同意这个方案。", f"他完全未必同意这个方案。", "完全"),
            (f"这个规定并非对每个人都适用。", f"这个规定对每个人都并非适用。", "都"),
            (f"我们只讨论了部分问题。", f"我们讨论了只部分问题。", "只"),
            (f"她几乎没有错过任何课程。", f"她没有几乎错过任何课程。", "没有"),
        ]
        return (*patterns[variant], None)
    if kind == "polarity":
        patterns = [
            ("为了防止事故再次发生，大家加强了检查。", "为了防止事故不再发生，大家加强了检查。", "不再"),
            ("除非下雨，比赛不会取消。", "除非下雨，比赛会取消。", "会"),
            ("避免出现重复错误，需要复核记录。", "避免不出现重复错误，需要复核记录。", "不"),
            ("他没有忘记提交材料。", "他没有不忘记提交材料。", "不"),
            ("这项措施有助于减少风险。", "这项措施无助于减少风险。", "无助"),
            ("我们不能忽视这个问题。", "我们不能不忽视这个问题。", "不"),
        ]
        return (*patterns[variant], None)
    if kind == "parallelism":
        patterns = [
            ("这个项目不仅降低成本，而且提高效率。", "这个项目不仅降低成本，而且能否提高效率。", "能否"),
            ("他喜欢读书、运动和旅行。", "他喜欢读书、运动和去旅行。", "去"),
            ("我们要统一标准、明确责任、提高效率。", "我们要统一标准、明确责任和提高效率。", "和"),
            ("她既认真又有耐心。", "她既认真又能够有耐心。", "能够"),
            ("会议讨论了预算、进度以及风险。", "会议讨论了预算、进度以及是否存在风险。", "是否"),
            ("该方案需要论证充分、执行严格、反馈及时。", "该方案需要论证充分、执行严格以及反馈要及时。", "以及"),
        ]
        return (*patterns[variant], None)
    if kind == "ambiguity":
        patterns = [
            ("李老师告诉王老师，王老师明天开会。", "李老师告诉王老师，他明天开会。", "他"),
            ("我在办公室看见了刚来的同事。", "我在办公室看见了刚来的同事们。", "同事们"),
            ("请把放在桌上的文件交给经理。", "请把桌上的文件放在交给经理。", "放在"),
            ("学校通知家长，学生下周返校。", "学校通知家长学生下周返校。", "家长"),
            ("他把没有完成的报告交给了主任。", "他把没有完成报告的交给了主任。", "的"),
            ("我们讨论了关于课程调整的意见。", "我们讨论了课程调整关于的意见。", "关于"),
        ]
        return (*patterns[variant], None)
    if kind == "punctuation":
        patterns = [
            (f"{w['person']}今天去{w['place']}吗？", f"{w['person']}今天去{w['place']}吗。", "。"),
            (f"请准备好材料，再进入会议室。", f"请准备好材料再进入会议室。", "再"),
            (f"{w['topic']}很重要，我们要认真对待。", f"{w['topic']}很重要我们要认真对待。", "重要"),
            (f"他说：“明天见。”", f"他说“明天见”。", "说"),
            (f"第一，检查资料；第二，确认数据。", f"第一，检查资料，第二，确认数据。", "，"),
            (f"如果下雨，就改为线上会议。", f"如果下雨就改为线上会议。", "雨"),
        ]
        return (*patterns[variant], None)
    raise KeyError(kind)


def main() -> None:
    for split in SPLITS.values():
        (OUT / split).parent.mkdir(parents=True, exist_ok=True)
    rows = {split: [] for split in ("train", "validation", "test")}
    seen_text = set()
    for level in range(1, 7):
        for kind in KINDS:
            for variant in range(6):
                clean, bad, target, at = make_case(kind, level, variant)
                original_bad_length = len(bad)
                original_target_start = bad.find(target) if target is not None else at
                # Some advanced constructions are intentionally shared by level.
                # Prefix a deterministic level/topic frame so every held-out row
                # stays text-disjoint while retaining the annotated target.
                while ("".join(clean.split()).casefold() in seen_text or
                       "".join(bad.split()).casefold() in seen_text or clean == bad):
                    frame = f"{lex(level, variant)['time']}，{lex(level, variant)['topic']}方面，"
                    clean, bad = frame + clean, frame + bad
                seen_text.update(("".join(clean.split()).casefold(),
                                  "".join(bad.split()).casefold()))
                if original_target_start is not None:
                    at = original_target_start + len(bad) - original_bad_length
                bad_row, clean_row = row(level, kind, variant, clean, bad, target, at)
                rows[SPLITS[variant]].extend((bad_row, clean_row))
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {
        "name": "HSK 1-6 expanded synthetic sentence error corpus v1",
        "license": "CC0-1.0",
        "provenance": "Original hand-authored templates with controlled perturbations, generated deterministically by generate_expanded.py. No scraped or personally identifying data. HSK levels are instructional estimates and examples require native-speaker review before production release.",
        "purpose": "Expanded ELECTRA localization training and held-out evaluation across 14 error types, including grammatical, orthographic, collocation, pragmatic-naturalness, scope and punctuation cases. Synthetic rows are coverage scaffolding, not a claim of native-speaker frequency.",
        "generator": "tools/sentence-training/generate_expanded.py",
        "counts": {"families": 504, "rows": 1008, "variants_per_type_level": 6},
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for split, values in rows.items():
        (OUT / f"{split}.jsonl").write_text(
            "".join(json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n" for value in values),
            encoding="utf-8",
        )
    print(json.dumps({split: len(values) for split, values in rows.items()}, ensure_ascii=False))


if __name__ == "__main__":
    main()

