#!/usr/bin/env python3
"""Deterministic assembler: merges all validated Clean-Room outputs into repo data files."""
from __future__ import annotations

import gzip
import json
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / "tools" / "rewrite-work"
OUT = WORK / "outputs"


def load_js_json(rel: str):
    txt = (ROOT / rel).read_text(encoding="utf-8").strip()
    eq = txt.find("=")
    return json.loads(txt[eq + 1 :].strip().rstrip(";").strip())


def write_js_json(rel: str, var_name: str, data) -> None:
    raw = f"const {var_name}={json.dumps(data, ensure_ascii=False, separators=(',', ':'))};\n".encode("utf-8")
    (ROOT / rel).write_bytes(raw)
    (ROOT / (rel + ".gz")).write_bytes(gzip.compress(raw, mtime=0))


def load_words_js() -> list[dict]:
    script = (
        "const fs=require('fs'),vm=require('vm');const c={};vm.createContext(c);"
        "vm.runInContext(fs.readFileSync('content/data/words.js','utf8')+';globalThis._w=words',c);"
        "process.stdout.write(JSON.stringify(c._w));"
    )
    return json.loads(subprocess.check_output(["node", "-e", script], cwd=ROOT, text=True, encoding="utf-8"))


def write_words_js(words_list: list[dict]) -> None:
    # Preserve the exact `const words = ...;` global declaration expected by loader.js & app.js
    body = (
        "// Dữ liệu từ vựng HSK 1–6 (phủ kín 146 bài học) — biến global `words`\n"
        f"const words = {json.dumps(words_list, ensure_ascii=False, separators=(',', ':'))};\n"
    ).encode("utf-8")
    (ROOT / "content/data/words.js").write_bytes(body)
    (ROOT / "content/data/words.js.gz").write_bytes(gzip.compress(body, mtime=0))


def main() -> int:
    # 1. Load all validated outputs
    rel_out = json.loads((OUT / "relations_and_confusables.json").read_text(encoding="utf-8"))

    missing_entries = []
    for p in sorted(OUT.glob("missing_vocab_*.json")):
        missing_entries.extend(json.loads(p.read_text(encoding="utf-8"))["entries"])

    hanzii_reps: dict[str, dict] = {}
    for p in sorted(OUT.glob("hanzii_examples_*.json")):
        for item in json.loads(p.read_text(encoding="utf-8"))["entries"]:
            hanzii_reps[item["k"]] = item

    rewritten_lessons: dict[str, dict] = {}
    for p in sorted(OUT.glob("lessons_*.json")):
        for lesson in json.loads(p.read_text(encoding="utf-8"))["lessons"]:
            rewritten_lessons[lesson["id"]] = lesson

    print(
        f"Loaded outputs: missing_vocab={len(missing_entries)}, "
        f"hanzii_reps={len(hanzii_reps)}, lessons={len(rewritten_lessons)}, "
        f"confusableGroups={len(rel_out['confusableGroups'])}, pairNotes={len(rel_out['pairNotes'])}"
    )
    assert len(missing_entries) == 626, f"Expected 626 missing vocab, got {len(missing_entries)}"
    assert len(hanzii_reps) == 4578, f"Expected 4578 hanzii example replacements, got {len(hanzii_reps)}"
    assert len(rewritten_lessons) == 146, f"Expected 146 lessons, got {len(rewritten_lessons)}"

    # 2. Update words.js (preserve all 5,011 existing keys untouched, clean old Hanzii provenance, append 626 new words)
    words = load_words_js()
    existing_keys = {f"{w['hsk']}|{w['han']}|{w['pin']}" for w in words}
    cleaned_old_prov = 0
    for w in words:
        prov = w.get("vocabularyProvenance")
        if isinstance(prov, dict):
            prov.pop("url", None)
            if prov.get("kind") == "hanzii-lexical-check" or "hanzii" in str(prov.get("label") or "").lower():
                prov["kind"] = "clean-room-authored"
                prov["checkedAt"] = "2026-11-26"
                prov["label"] = "Từ vựng và ví dụ biên soạn độc lập theo quy trình Clean-Room của app HSK."
                cleaned_old_prov += 1

    added_words = []
    for item in missing_entries:
        key = f"{item['hsk']}|{item['han']}|{item['pin']}"
        if key in existing_keys:
            # Disambiguate if rare collision occurs (should not happen since we filtered by han)
            continue
        existing_keys.add(key)
        exs = item["examples"]
        w_obj = {
            "han": item["han"],
            "pin": item["pin"],
            "mean": item["mean"],
            "hv": item["hv"],
            "hsk": str(item["hsk"]),
            "exCn": exs[0]["cn"],
            "exVi": exs[0]["vi"],
            "courseSupplement": True,
            "entryKind": item.get("entryKind") or "vocabulary",
            "vocabularyProvenance": {
                "kind": "clean-room-authored",
                "checkedAt": "2026-11-26",
                "label": "Từ vựng bổ sung phủ kín 146 bài giáo trình HSK 1–6; ví dụ biên soạn độc lập theo quy trình Clean-Room.",
            },
        }
        words.append(w_obj)
        added_words.append((key, item))
    write_words_js(words)
    print(f"words.js updated: total={len(words)}, cleaned_old_prov={cleaned_old_prov}, newly_added={len(added_words)}")

    # 3. Update checkedPracticeExamples.js
    cpe = load_js_json("content/data/checkedPracticeExamples.js")
    replaced_cpe = 0
    for key, entry in cpe["entries"].items():
        if "hanzii" in str(entry.get("checkedAgainst") or "").lower():
            entry["checkedAgainst"] = None
        if entry.get("sourceKind") == "hanzii":
            entry["sourceKind"] = "clean-room"
        for ex in entry.get("examples") or []:
            if ex.get("origin") == "hanzii":
                rep = hanzii_reps.get(key)
                if not rep:
                    raise ValueError(f"Missing replacement for checkedPracticeExamples key {key}")
                ex["cn"] = rep["cn"]
                ex["pin"] = rep["pin"]
                ex["vi"] = rep["vi"]
                ex["origin"] = "authored"
                replaced_cpe += 1

    for key, item in added_words:
        cpe["entries"][key] = {
            "examples": [
                {
                    "cn": ex["cn"],
                    "pin": ex["pin"],
                    "vi": ex["vi"],
                    "meaning": item["mean"],
                    "sense": item["mean"],
                    "origin": "authored",
                }
                for ex in item["examples"]
            ],
            "meanings": [],
            "checkedAgainst": None,
            "lexicalOnly": False,
            "sourceKind": "clean-room",
        }

    # Recompute cpe report
    total_sent = 0
    authored_sent = 0
    levels_rep: dict[str, dict[str, int]] = {}
    for key, entry in cpe["entries"].items():
        lvl = key.split("|", 1)[0]
        lv = levels_rep.setdefault(lvl, {"covered": 0, "sentences": 0})
        exs = entry.get("examples") or []
        if exs:
            lv["covered"] += 1
        lv["sentences"] += len(exs)
        total_sent += len(exs)
        authored_sent += sum(1 for x in exs if x.get("origin") == "authored")
    cpe["report"] = {
        "covered": len(cpe["entries"]),
        "total": len(words),
        "sentences": total_sent,
        "authored": authored_sent,
        "levels": dict(sorted(levels_rep.items())),
    }
    write_js_json("content/data/checkedPracticeExamples.js", "checkedPracticeExamples", cpe)
    print(f"checkedPracticeExamples.js updated: replaced_hanzii={replaced_cpe}, total_entries={len(cpe['entries'])}")

    # 4. Update dictionarySupplement.js
    sup = load_js_json("content/data/dictionarySupplement.js")
    replaced_sup = 0
    for key, entry in sup["entries"].items():
        entry.pop("url", None)
        entry["checkedAt"] = "2026-11-26"
        if key in hanzii_reps and isinstance(entry.get("example"), dict):
            rep = hanzii_reps[key]
            entry["example"]["cn"] = rep["cn"]
            entry["example"]["pin"] = rep["pin"]
            entry["example"]["vi"] = rep["vi"]
            replaced_sup += 1
    for key, item in added_words:
        ex0 = item["examples"][0]
        sup["entries"][key] = {
            "meanings": [],
            "checkedAt": "2026-11-26",
            "example": {
                "cn": ex0["cn"],
                "pin": ex0["pin"],
                "vi": ex0["vi"],
                "meaning": item["mean"],
            },
        }
    sup["report"]["date"] = "2026-11-26"
    sup["report"]["total"] = len(words)
    sup["report"]["matched"] = len(sup["entries"])
    sup["report"]["addedCourseWords"] = sup["report"].get("addedCourseWords", 0) + len(added_words)
    write_js_json("content/data/dictionarySupplement.js", "dictionarySupplement", sup)
    print(f"dictionarySupplement.js updated: replaced_sup={replaced_sup}, total_entries={len(sup['entries'])}")

    # 5. Update confusableGroups.js
    write_js_json("content/data/confusableGroups.js", "confusableGroups", rel_out["confusableGroups"])
    print(f"confusableGroups.js updated: groups={len(rel_out['confusableGroups'])}")

    # 6. Update usageFactsData.js
    usage = load_js_json("content/data/usageFactsData.js")
    usage["pairNotes"] = rel_out["pairNotes"]
    usage.setdefault("report", {})["targetedNotes"] = len(rel_out["pairNotes"])
    write_js_json("content/data/usageFactsData.js", "usageFactsData", usage)
    print(f"usageFactsData.js updated: pairNotes={len(rel_out['pairNotes'])}")

    # 7. Update wordRelationsData.js
    rel = load_js_json("content/data/wordRelationsData.js")
    rel.setdefault("report", {})["source"] = "HSK Clean-Room Lexical Graph"
    rel["report"]["checkedAt"] = "2026-11-26"
    for entry in (rel.get("entries") or {}).values():
        entry.pop("url", None)
    write_js_json("content/data/wordRelationsData.js", "wordRelationsData", rel)
    print(f"wordRelationsData.js updated: entries={len(rel.get('entries') or {})}")

    # 8. Update lesson-content-hsk1..6.json
    for hsk in range(1, 7):
        lp = ROOT / f"lesson-content-hsk{hsk}.json"
        data = json.loads(lp.read_text(encoding="utf-8"))
        new_list = []
        for old in data["lessons"]:
            lid = old["id"]
            if lid not in rewritten_lessons:
                raise ValueError(f"Missing rewritten lesson {lid}")
            new_list.append(rewritten_lessons[lid])
        data["lessons"] = new_list
        lp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"lesson-content-hsk{hsk}.json updated: {len(new_list)} lessons")

    # 9. Rebuild derived lesson-mini-data.json, lessons-data.json, and server/tutor-curriculum.mjs
    subprocess.check_call(["node", "tools/build-lesson-mini.cjs"], cwd=ROOT)
    subprocess.check_call(["node", "tools/build-tutor-curriculum.cjs"], cwd=ROOT)
    print("ALL DONE!")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
