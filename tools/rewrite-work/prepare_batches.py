#!/usr/bin/env python3
"""Prepare clean-room batch inputs + quarantined source snapshots for full repo rewrite."""
from __future__ import annotations

import gzip
import json
import math
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / "tools" / "rewrite-work"
BATCHES = WORK / "batches"
QUAR = WORK / "quarantine"
OUT = WORK / "outputs"

for d in (BATCHES, QUAR, OUT):
    d.mkdir(parents=True, exist_ok=True)


def load_js_json(rel: str):
    txt = (ROOT / rel).read_text(encoding="utf-8").strip()
    eq = txt.find("=")
    body = txt[eq + 1 :].strip().rstrip(";").strip()
    return json.loads(body)


def load_words():
    script = (
        "const fs=require('fs'),vm=require('vm');const c={};vm.createContext(c);"
        "vm.runInContext(fs.readFileSync('content/data/words.js','utf8')+';globalThis._w=words',c);"
        "process.stdout.write(JSON.stringify(c._w));"
    )
    return json.loads(subprocess.check_output(["node", "-e", script], cwd=ROOT, text=True, encoding="utf-8"))


def load_open_dictionary() -> dict[str, list[tuple[str, list[str]]]]:
    """Load CC-CEDICT shards from content/open-dictionary/*.json.gz keyed by simplified Hanzi."""
    idx: dict[str, list[tuple[str, list[str]]]] = {}
    od_dir = ROOT / "content" / "open-dictionary"
    for gz in sorted(od_dir.glob("*.json.gz")):
        rows = json.loads(gzip.open(gz, "rt", encoding="utf-8").read())
        for row in rows:
            if isinstance(row, list) and len(row) >= 4:
                simp, _trad, pin, defs = row[0], row[1], row[2], row[3]
                idx.setdefault(simp, []).append((pin, defs[:4]))
    return idx


def chunk_list(items: list, size: int) -> list[list]:
    return [items[i : i + size] for i in range(0, len(items), size)]


def main():
    words = load_words()
    cpe = load_js_json("content/data/checkedPracticeExamples.js")
    sup = load_js_json("content/data/dictionarySupplement.js")
    usage = load_js_json("content/data/usageFactsData.js")
    rel = load_js_json("content/data/wordRelationsData.js")
    cg = load_js_json("content/data/confusableGroups.js")
    catalog = json.loads((ROOT / "lessons-data.json").read_text(encoding="utf-8"))
    open_dict = load_open_dictionary()

    # ---------------------------------------------------------
    # 1. Missing lesson vocabulary (exact app.js matching logic)
    # ---------------------------------------------------------
    by_han: dict[str, list] = {}
    for w in words:
        for h in {w["han"], *[s.strip() for s in re.split(r"[()（）]", w["han"]) if s.strip()]}:
            by_han.setdefault(h, []).append(w)
    aliases = {"贏": "赢", "內容": "内容", "勺（子）": "勺子"}

    missing_items = []
    seen_missing = set()
    for course in catalog["courses"]:
        for lesson in course["lessons"]:
            for han in lesson["words"]:
                resolved = aliases.get(han, han)
                if not by_han.get(resolved) and han not in seen_missing:
                    seen_missing.add(han)
                    u_vars = (usage.get("words", {}).get(han) or {}).get("variants") or []
                    u_hints = [
                        {"pin": v.get("pin", ""), "senses": [s.get("mean", "") for s in (v.get("senses") or [])[:4]]}
                        for v in u_vars[:2]
                    ]
                    r_hints = (rel.get("lexicon") or {}).get(han) or []
                    od_hints = open_dict.get(han) or []
                    missing_items.append(
                        {
                            "han": han,
                            "hsk": str(course["hsk"]),
                            "firstLesson": lesson["id"],
                            "lessonTopicVi": lesson["vi"],
                            "usageHints": u_hints,
                            "lexiconHints": r_hints[:2],
                            "cedictHints": [{"pin": p, "defs": d} for p, d in od_hints[:2]],
                        }
                    )

    for bi, batch in enumerate(chunk_list(missing_items, 160), 1):
        (BATCHES / f"missing_vocab_{bi:02d}.json").write_text(
            json.dumps({"batch": bi, "count": len(batch), "items": batch}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    # ---------------------------------------------------------
    # 2. Confusable groups (15) + usageFactsData pairNotes (40)
    # ---------------------------------------------------------
    cg_bp = []
    for g in cg:
        cg_bp.append(
            {
                "id": g["id"],
                "title": g["title"],
                "category": g.get("category", "near"),
                "members": [
                    {"han": m["han"], "pin": m["pin"], "key": m["key"], "level": m["level"]}
                    for m in g.get("members") or []
                ],
                "questionCount": len(g.get("questions") or []),
            }
        )
    pair_bp = [{"pairKey": k, "words": v["words"]} for k, v in (usage.get("pairNotes") or {}).items()]
    (BATCHES / "relations_and_confusables.json").write_text(
        json.dumps(
            {
                "confusableGroups": cg_bp,
                "pairNotes": pair_bp,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    (QUAR / "relations_and_confusables_source.json").write_text(
        json.dumps(
            {
                "confusableGroups": cg,
                "pairNotes": usage.get("pairNotes") or {},
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    # ---------------------------------------------------------
    # 3. All 4,578 words needing Hanzii example replacement
    #    (Clean-Room: NO Hanzii example sentence in batch inputs!)
    # ---------------------------------------------------------
    words_by_key = {f"{w['hsk']}|{w['han']}|{w['pin']}": w for w in words}
    hanzii_targets = []
    hanzii_quarantine = {}

    for key, w in words_by_key.items():
        cpe_entry = (cpe.get("entries") or {}).get(key) or {}
        sup_entry = (sup.get("entries") or {}).get(key) or {}
        h_cpe = [ex for ex in (cpe_entry.get("examples") or []) if ex.get("origin") == "hanzii"]
        sup_ex = sup_entry.get("example") if (
            isinstance(sup_entry.get("example"), dict)
            and "hanzii.net" in str(sup_entry.get("url") or "").lower()
        ) else None

        if not h_cpe and not sup_ex:
            continue

        target_sense = (
            (h_cpe[0].get("meaning") or h_cpe[0].get("sense")) if h_cpe
            else (sup_ex.get("meaning") if sup_ex else w.get("mean", ""))
        ) or w.get("mean", "")

        hanzii_targets.append(
            {
                "k": key,
                "han": w["han"],
                "pin": w["pin"],
                "hsk": w["hsk"],
                "mean": w["mean"],
                "sense": target_sense,
            }
        )
        blocked_cns = []
        for ex in h_cpe:
            if ex.get("cn"):
                blocked_cns.append(ex["cn"])
        if sup_ex and sup_ex.get("cn") and sup_ex["cn"] not in blocked_cns:
            blocked_cns.append(sup_ex["cn"])
        # Also include existing non-hanzii sentences so the new sentence doesn't duplicate them
        existing_cns = [ex.get("cn", "") for ex in (cpe_entry.get("examples") or []) if ex.get("origin") != "hanzii"]
        hanzii_quarantine[key] = {"hanziiCns": blocked_cns, "existingCns": existing_cns}

    # Split into 16 clean batches (~287 words each)
    batch_size = math.ceil(len(hanzii_targets) / 16)
    for bi, batch in enumerate(chunk_list(hanzii_targets, batch_size), 1):
        (BATCHES / f"hanzii_examples_{bi:02d}.json").write_text(
            json.dumps({"batch": bi, "count": len(batch), "items": batch}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    (QUAR / "hanzii_examples_quarantine.json").write_text(
        json.dumps(hanzii_quarantine, ensure_ascii=False),
        encoding="utf-8",
    )

    # ---------------------------------------------------------
    # 4. All 146 lessons clean-room blueprints (15 batches of ~10)
    # ---------------------------------------------------------
    hsk_min_chars = {1: 120, 2: 180, 3: 200, 4: 280, 5: 320, 6: 400}
    lesson_blueprints = []
    lesson_quarantine = {}

    for course in catalog["courses"]:
        hsk = course["hsk"]
        lc = json.loads((ROOT / f"lesson-content-hsk{hsk}.json").read_text(encoding="utf-8"))
        lc_map = {x["id"]: x for x in lc["lessons"]}
        for meta in course["lessons"]:
            lid = meta["id"]
            orig = lc_map[lid]
            lesson_quarantine[lid] = orig
            has_long_dialogue = any(d.get("kind") == "long-form-original" for d in (orig.get("dialogues") or []))
            reading_q_count = sum(1 for q in (orig.get("practice") or []) if q.get("source") == "reading")
            lesson_blueprints.append(
                {
                    "id": lid,
                    "hsk": hsk,
                    "number": meta["number"],
                    "topicCn": meta["title"],
                    "topicVi": meta["vi"],
                    "words": meta["words"],
                    "grammarPoints": [
                        {"pattern": g.get("pattern", ""), "conceptTopic": g.get("title", "")}
                        for g in (orig.get("grammar") or [])
                    ],
                    "practiceIds": [q["id"] for q in (orig.get("practice") or [])],
                    "readingQuestionCount": reading_q_count,
                    "hasLongDialogue": has_long_dialogue,
                    "dialogueCount": len(orig.get("dialogues") or []),
                    "minHanziChars": hsk_min_chars[hsk],
                    "requireWarmup": hsk in (1, 2) or bool(orig.get("warmupReading")),
                }
            )

    # Split 146 lessons into 15 batches (~10 lessons each)
    for bi, batch in enumerate(chunk_list(lesson_blueprints, 10), 1):
        (BATCHES / f"lessons_{bi:02d}.json").write_text(
            json.dumps({"batch": bi, "count": len(batch), "lessons": batch}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    (QUAR / "lessons_quarantine.json").write_text(
        json.dumps(lesson_quarantine, ensure_ascii=False),
        encoding="utf-8",
    )

    print(
        json.dumps(
            {
                "missingVocabTotal": len(missing_items),
                "missingVocabBatches": len(list(BATCHES.glob("missing_vocab_*.json"))),
                "hanziiExamplesTotal": len(hanzii_targets),
                "hanziiExampleBatches": len(list(BATCHES.glob("hanzii_examples_*.json"))),
                "lessonsTotal": len(lesson_blueprints),
                "lessonBatches": len(list(BATCHES.glob("lessons_*.json"))),
                "confusableGroups": len(cg_bp),
                "pairNotes": len(pair_bp),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
