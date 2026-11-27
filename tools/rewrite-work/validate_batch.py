#!/usr/bin/env python3
"""Strict automated validator for every rewrite-work output batch."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
import content_originality_pipeline as cop  # noqa: E402

WORK = ROOT / "tools" / "rewrite-work"
QUAR = WORK / "quarantine"
HANZI_RE = re.compile(r"[\u3400-\u9fff]")


def contains_word(cn: str, han: str) -> bool:
    han = han.replace("\u30aa", "才")
    if han in cn:
        return True
    # Allow split patterns like "太……了" or "一方面……一方面……" or optional parens "夏(天)"
    cleaned = re.sub(r"[()（）]", "", han)
    if cleaned and cleaned in cn:
        return True
    base = re.sub(r"[()（][^()）]*[)）]", "", han)
    if base and base in cn:
        return True
    parts = [p for p in re.split(r"[…\.—\-/／,，、]+", han) if p.strip()]
    if len(parts) >= 2:
        pos = 0
        for p in parts:
            idx = cn.find(p, pos)
            if idx < 0:
                return False
            pos = idx + len(p)
        return True
    return False


def validate_missing_vocab(batch_file: Path, out_file: Path) -> list[str]:
    inp = json.loads(batch_file.read_text(encoding="utf-8"))
    out = json.loads(out_file.read_text(encoding="utf-8"))
    expected = {x["han"]: x for x in inp["items"]}
    entries = out.get("entries") if isinstance(out, dict) else out
    errors: list[str] = []
    if not isinstance(entries, list):
        return ["Output must be a list or {entries: [...]}"]
    seen = set()
    for i, item in enumerate(entries):
        han = str(item.get("han") or "").strip()
        if han not in expected:
            errors.append(f"[{i}] unexpected han '{han}'")
            continue
        if han in seen:
            errors.append(f"[{i}] duplicate han '{han}'")
            continue
        seen.add(han)
        for f in ("pin", "mean", "hv"):
            if not isinstance(item.get(f), str) or not item[f].strip():
                errors.append(f"[{han}] missing {f}")
        exs = item.get("examples")
        if not isinstance(exs, list) or len(exs) != 3:
            errors.append(f"[{han}] must have exactly 3 examples, got {len(exs) if isinstance(exs, list) else type(exs)}")
            continue
        cns = set()
        for ei, ex in enumerate(exs):
            for f in ("cn", "pin", "vi"):
                if not isinstance(ex.get(f), str) or not ex[f].strip():
                    errors.append(f"[{han}].examples[{ei}] missing {f}")
            cn = str(ex.get("cn") or "")
            if not contains_word(cn, han):
                errors.append(f"[{han}].examples[{ei}].cn does not contain '{han}': {cn}")
            norm = cop.normalize_cn_sentence(cn)
            if norm in cns:
                errors.append(f"[{han}].examples[{ei}] duplicate cn sentence")
            cns.add(norm)
    missing = sorted(set(expected) - seen)
    if missing:
        errors.append(f"Missing {len(missing)} words: {missing[:10]}")
    raw = json.dumps(out, ensure_ascii=False)
    if re.search(r"hanzii", raw, re.IGNORECASE):
        errors.append("Found forbidden 'hanzii' reference in output")
    return errors


def validate_hanzii_examples(batch_file: Path, out_file: Path) -> list[str]:
    inp = json.loads(batch_file.read_text(encoding="utf-8"))
    out = json.loads(out_file.read_text(encoding="utf-8"))
    quar = json.loads((QUAR / "hanzii_examples_quarantine.json").read_text(encoding="utf-8"))
    expected = {x["k"]: x for x in inp["items"]}
    entries = out.get("entries") if isinstance(out, dict) else out
    errors: list[str] = []
    if not isinstance(entries, list):
        return ["Output must be a list or {entries: [...]}"]
    seen = set()
    for i, item in enumerate(entries):
        k = str(item.get("k") or "").strip()
        if k not in expected:
            errors.append(f"[{i}] unexpected key '{k}'")
            continue
        if k in seen:
            errors.append(f"[{i}] duplicate key '{k}'")
            continue
        seen.add(k)
        han = expected[k]["han"]
        for f in ("cn", "pin", "vi"):
            if not isinstance(item.get(f), str) or not item[f].strip():
                errors.append(f"[{k}] missing {f}")
        cn = str(item.get("cn") or "")
        if not contains_word(cn, han):
            errors.append(f"[{k}] cn missing '{han}': {cn}")
        norm = cop.normalize_cn_sentence(cn)
        q = quar.get(k) or {}
        for old_cn in (q.get("hanziiCns") or []) + (q.get("existingCns") or []):
            if norm and norm == cop.normalize_cn_sentence(old_cn):
                errors.append(f"[{k}] matches quarantined/existing sentence: {cn}")
    missing = sorted(set(expected) - seen)
    if missing:
        errors.append(f"Missing {len(missing)} keys: {missing[:10]}")
    raw = json.dumps(out, ensure_ascii=False)
    if re.search(r"hanzii", raw, re.IGNORECASE):
        errors.append("Found forbidden 'hanzii' reference in output")
    return errors


def validate_lessons(batch_file: Path, out_file: Path) -> list[str]:
    inp = json.loads(batch_file.read_text(encoding="utf-8"))
    out = json.loads(out_file.read_text(encoding="utf-8"))
    quar = json.loads((QUAR / "lessons_quarantine.json").read_text(encoding="utf-8"))
    expected = {x["id"]: x for x in inp["lessons"]}
    lessons = out.get("lessons") if isinstance(out, dict) else out
    errors: list[str] = []
    if not isinstance(lessons, list):
        return ["Output must be {lessons: [...]}"]
    seen = set()
    for lesson in lessons:
        lid = str(lesson.get("id") or "")
        if lid not in expected:
            errors.append(f"Unexpected lesson id '{lid}'")
            continue
        seen.add(lid)
        bp = expected[lid]
        orig = quar[lid]
        # Auto-check exact reading characterCount & schema
        schema = cop.validate_app_schema(
            {"lesson": lesson},
            blueprint_obj={
                "hsk": bp["hsk"],
                "grammarPoints": bp["grammarPoints"],
                "vocabulary": [{"han": w} for w in bp["words"]],
            },
        )
        for e in schema["errors"]:
            errors.append(f"[{lid}] schema: {e}")

        # Preserve extended dialogue & reading question invariants required by tools/check-content.cjs
        if bp["hasLongDialogue"]:
            lds = [d for d in (lesson.get("dialogues") or []) if d.get("kind") == "long-form-original"]
            if len(lds) != 1 or len(lds[0].get("lines") or []) != 8:
                errors.append(f"[{lid}] must preserve exactly 1 long-form-original dialogue with 8 lines")
        else:
            lds = [d for d in (lesson.get("dialogues") or []) if d.get("kind") == "long-form-original"]
            if lds:
                errors.append(f"[{lid}] should not add long-form-original dialogue (check-content.cjs expects exact total=24)")

        if bp["readingQuestionCount"]:
            rqs = [q for q in (lesson.get("practice") or []) if q.get("source") == "reading"]
            if len(rqs) != 3 or len(lesson.get("practice") or []) != 6:
                errors.append(f"[{lid}] must preserve 3 source='reading' questions and 6 total practice questions")
        else:
            rqs = [q for q in (lesson.get("practice") or []) if q.get("source") == "reading"]
            if rqs:
                errors.append(f"[{lid}] should not add source='reading' questions (check-content.cjs expects exact total=72)")

        # Originality check against quarantined lesson
        allowed = list(bp["words"]) + [g["pattern"] for g in bp["grammarPoints"]]
        orig_metrics = cop.compute_originality_metrics({"lesson": orig}, {"lesson": lesson}, allowed_terms=allowed)
        if not orig_metrics["passed"]:
            for f in orig_metrics["failures"]:
                errors.append(f"[{lid}] originality: {f}")

    missing = sorted(set(expected) - seen)
    if missing:
        errors.append(f"Missing lessons: {missing}")
    return errors


def validate_relations(batch_file: Path, out_file: Path) -> list[str]:
    inp = json.loads(batch_file.read_text(encoding="utf-8"))
    out = json.loads(out_file.read_text(encoding="utf-8"))
    quar = json.loads((QUAR / "relations_and_confusables_source.json").read_text(encoding="utf-8"))
    errors: list[str] = []

    raw = json.dumps(out, ensure_ascii=False)
    if re.search(r"hanzii", raw, re.IGNORECASE):
        errors.append("Found forbidden 'hanzii' reference in output")

    # Confusable groups
    exp_cg = {g["id"]: g for g in inp["confusableGroups"]}
    out_cg = out.get("confusableGroups") or []
    if len(out_cg) != len(exp_cg):
        errors.append(f"Expected {len(exp_cg)} confusableGroups, got {len(out_cg)}")
    src_cg_map = {g["id"]: g for g in quar["confusableGroups"]}
    for g in out_cg:
        gid = g.get("id")
        if gid not in exp_cg:
            errors.append(f"Unexpected confusable group '{gid}'")
            continue
        src_g = src_cg_map[gid]
        if not g.get("intro") or not g.get("caution"):
            errors.append(f"[{gid}] missing intro or caution")
        if len(g.get("members") or []) != len(src_g["members"]):
            errors.append(f"[{gid}] member count mismatch")
        for m in g.get("members") or []:
            if not m.get("note"):
                errors.append(f"[{gid}] member {m.get('han')} missing note")
            if "url" in m and m["url"]:
                errors.append(f"[{gid}] member {m.get('han')} should not keep Hanzii url")
        if len(g.get("questions") or []) != len(src_g["questions"]):
            errors.append(f"[{gid}] question count mismatch ({len(g.get('questions') or [])} vs {len(src_g['questions'])})")
        src_q_cns = {cop.normalize_cn_sentence(sq.get("cn", "")) for sq in src_g["questions"]}
        for qi, q in enumerate(g.get("questions") or []):
            for f in ("id", "key", "cn", "pin", "vi", "prompt", "answer", "explanation"):
                if not isinstance(q.get(f), str) or not q[f].strip():
                    errors.append(f"[{gid}].questions[{qi}] missing {f}")
            wrong = q.get("wrong")
            if not isinstance(wrong, list) or len(wrong) < 2 or not all(isinstance(x, str) and x.strip() for x in wrong):
                errors.append(f"[{gid}].questions[{qi}].wrong must be a list of >= 2 non-empty strings")
            if q.get("origin") != "authored":
                errors.append(f"[{gid}].questions[{qi}].origin must be 'authored'")
            if cop.normalize_cn_sentence(q.get("cn", "")) in src_q_cns:
                errors.append(f"[{gid}].questions[{qi}].cn copies source question sentence")

    # Pair notes
    exp_pairs = {p["pairKey"] for p in inp["pairNotes"]}
    out_pairs = out.get("pairNotes") or {}
    if set(out_pairs.keys()) != exp_pairs:
        errors.append(f"pairNotes keys mismatch: missing={sorted(exp_pairs - set(out_pairs))[:5]}, extra={sorted(set(out_pairs) - exp_pairs)[:5]}")
    for k, v in out_pairs.items():
        for f in ("common", "difference", "when"):
            if not isinstance(v.get(f), str) or len(v[f].strip()) < 15:
                errors.append(f"pairNote[{k}].{f} missing or too short")
        if k in quar["pairNotes"]:
            for f in ("common", "difference", "when"):
                s_toks = cop.tokenize_vi(quar["pairNotes"][k].get(f, ""))
                c_toks = cop.tokenize_vi(v.get(f, ""))
                if len(s_toks) >= 6 and len(c_toks) >= 6:
                    from difflib import SequenceMatcher
                    sim = SequenceMatcher(None, s_toks, c_toks).ratio()
                    if sim > 0.48:
                        errors.append(f"pairNote[{k}].{f} too similar to source ({sim:.2f})")
    return errors


def main():
    p = argparse.ArgumentParser()
    p.add_argument("kind", choices=["missing-vocab", "hanzii-examples", "lessons", "relations"])
    p.add_argument("--batch", type=Path, required=True)
    p.add_argument("--out", type=Path, required=True)
    args = p.parse_args()

    fn = {
        "missing-vocab": validate_missing_vocab,
        "hanzii-examples": validate_hanzii_examples,
        "lessons": validate_lessons,
        "relations": validate_relations,
    }[args.kind]
    errs = fn(args.batch, args.out)
    if errs:
        print(f"FAIL ({len(errs)} errors):")
        for e in errs[:40]:
            print("  -", e)
        return 1
    print(f"PASS: {args.kind} {args.out.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
