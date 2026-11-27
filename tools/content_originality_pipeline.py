#!/usr/bin/env python3
"""Clean-room content originality & lesson restructuring pipeline for HSK app.

Supports two workflows:
1. Auditing and cleaning existing Hanzii-referenced data in the repo
   (content/data/*.js, src/ui/dictionary-relations.js, lesson-content-hsk*.json).
2. Transforming newly imported raw Hanzii lesson data into original,
   copyright-safe HSK app lesson JSON via a strict 2-stage Clean-Room flow:
   raw/existing source -> extract-blueprint (strips prose/examples) ->
   author from blueprint only -> verify against quarantined source & app schema ->
   apply-lesson.
"""

from __future__ import annotations

import argparse
from collections import Counter
from difflib import SequenceMatcher
import json
from pathlib import Path
import re
import subprocess
import sys
from typing import Any
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
HSK_MIN_CHARS = {1: 120, 2: 180, 3: 200, 4: 280, 5: 320, 6: 400}
HANZI_RE = re.compile(r"[\u3400-\u9fff]")
CN_KEEP_RE = re.compile(r"[^\u3400-\u9fff0-9A-Za-z]+")
VI_TOKEN_RE = re.compile(r"[0-9a-zA-ZÀ-ỹ]+", re.UNICODE)
BANNED_SOURCE_PATTERNS = [
    re.compile(r"hanzii\.net", re.IGNORECASE),
    re.compile(r"\bhanzii\b", re.IGNORECASE),
    re.compile(r"ví\s+dụ\s+hanzii", re.IGNORECASE),
    re.compile(r'"origin"\s*:\s*"hanzii"', re.IGNORECASE),
]

DEFAULT_THRESHOLDS = {
    "max_exact_cn_matches": 0,
    "max_cn_5gram_overlap": 0.08,
    "max_vi_4gram_overlap": 0.12,
    "max_vi_field_similarity": 0.45,
    "min_exact_cn_len": 4,
    "min_vi_field_words": 6,
}


def load_js_json(path: Path) -> Any:
    """Parse `const varName = <json>;` files in content/data/."""
    text = path.read_text(encoding="utf-8").strip()
    eq = text.find("=")
    if eq < 0:
        raise ValueError(f"Cannot locate assignment in {path}")
    payload = text[eq + 1 :].strip()
    if payload.endswith(";"):
        payload = payload[:-1].strip()
    return json.loads(payload)


def load_words_js(path: Path) -> list[dict[str, Any]]:
    """Evaluate content/data/words.js using Node vm (same approach as check-content.cjs)."""
    script = (
        "const fs=require('fs'),vm=require('vm');const c={};vm.createContext(c);"
        f"vm.runInContext(fs.readFileSync({json.dumps(str(path))},'utf8')+';globalThis._w=words',c);"
        "process.stdout.write(JSON.stringify(c._w));"
    )
    out = subprocess.check_output(["node", "-e", script], text=True, encoding="utf-8")
    return json.loads(out)


def count_hanzi(text: str) -> int:
    return len(HANZI_RE.findall(text or ""))


def extract_hanzi_only(text: str) -> str:
    return "".join(HANZI_RE.findall(text or ""))


def normalize_cn_sentence(text: str) -> str:
    return CN_KEEP_RE.sub("", (text or "").strip())


def split_cn_sentences(text: str) -> list[str]:
    parts = re.split(r"[。！？!?;；\n]+", text or "")
    out: list[str] = []
    for part in parts:
        norm = normalize_cn_sentence(part)
        if norm:
            out.append(norm)
    return out


def tokenize_vi(text: str) -> list[str]:
    return [tok.lower() for tok in VI_TOKEN_RE.findall(text or "")]


def make_char_ngrams(text: str, n: int) -> set[str]:
    if len(text) < n:
        return set()
    return {text[i : i + n] for i in range(len(text) - n + 1)}


def make_word_ngrams(tokens: list[str], n: int) -> set[tuple[str, ...]]:
    if len(tokens) < n:
        return set()
    return {tuple(tokens[i : i + n]) for i in range(len(tokens) - n + 1)}


def _extract_lesson_payload(obj: dict[str, Any]) -> dict[str, Any]:
    return obj["lesson"] if isinstance(obj.get("lesson"), dict) else obj


def collect_cn_texts(payload: dict[str, Any]) -> list[tuple[str, str]]:
    """Collect (field_path, cn_text) pairs from a lesson/source/candidate bundle."""
    items: list[tuple[str, str]] = []
    lesson = _extract_lesson_payload(payload)

    for gi, g in enumerate(lesson.get("grammar") or []):
        for ei, ex in enumerate(g.get("examples") or []):
            if isinstance(ex, dict) and ex.get("cn"):
                items.append((f"grammar[{gi}].examples[{ei}].cn", str(ex["cn"])))
            elif isinstance(ex, str) and ex.strip():
                items.append((f"grammar[{gi}].examples[{ei}]", ex.strip()))

    reading = lesson.get("reading") or {}
    if isinstance(reading, dict):
        for li, line in enumerate(reading.get("lines") or []):
            if isinstance(line, dict) and line.get("cn"):
                items.append((f"reading.lines[{li}].cn", str(line["cn"])))

    warmup = lesson.get("warmupReading") or {}
    if isinstance(warmup, dict):
        for li, line in enumerate(warmup.get("lines") or []):
            if isinstance(line, dict) and line.get("cn"):
                items.append((f"warmupReading.lines[{li}].cn", str(line["cn"])))

    for di, d in enumerate(lesson.get("dialogues") or []):
        for li, line in enumerate(d.get("lines") or []):
            if isinstance(line, dict) and line.get("cn"):
                items.append((f"dialogues[{di}].lines[{li}].cn", str(line["cn"])))

    for qi, q in enumerate(lesson.get("practice") or []):
        if isinstance(q, dict) and q.get("prompt"):
            items.append((f"practice[{qi}].prompt", str(q["prompt"])))

    # Vocab examples (either quarantined source or candidate replacements)
    for bucket in ("vocabSources", "vocabReplacements"):
        entries = payload.get(bucket) or []
        if isinstance(entries, list):
            for ei, entry in enumerate(entries):
                for xi, ex in enumerate(entry.get("examples") or []):
                    if isinstance(ex, dict) and ex.get("cn"):
                        items.append((f"{bucket}[{ei}].examples[{xi}].cn", str(ex["cn"])))
                if isinstance(entry.get("supplementExample"), dict) and entry["supplementExample"].get("cn"):
                    items.append((f"{bucket}[{ei}].supplementExample.cn", str(entry["supplementExample"]["cn"])))

    # Raw text fallback (for raw Hanzii imports)
    if isinstance(payload.get("rawText"), str) and payload["rawText"].strip():
        items.append(("rawText", payload["rawText"]))

    return items


def collect_vi_fields(payload: dict[str, Any]) -> list[tuple[str, str]]:
    """Collect (field_path, vi_text) pairs for plagiarism/paraphrase detection."""
    fields: list[tuple[str, str]] = []
    lesson = _extract_lesson_payload(payload)

    if lesson.get("summary"):
        fields.append(("summary", str(lesson["summary"])))
    for oi, obj in enumerate(lesson.get("objectives") or []):
        if obj:
            fields.append((f"objectives[{oi}]", str(obj)))

    for gi, g in enumerate(lesson.get("grammar") or []):
        for key in ("usage", "error"):
            if g.get(key):
                fields.append((f"grammar[{gi}].{key}", str(g[key])))
        for ei, ex in enumerate(g.get("examples") or []):
            if isinstance(ex, dict) and ex.get("vi"):
                fields.append((f"grammar[{gi}].examples[{ei}].vi", str(ex["vi"])))

    reading = lesson.get("reading") or {}
    if isinstance(reading, dict):
        for li, line in enumerate(reading.get("lines") or []):
            if isinstance(line, dict) and line.get("vi"):
                fields.append((f"reading.lines[{li}].vi", str(line["vi"])))

    warmup = lesson.get("warmupReading") or {}
    if isinstance(warmup, dict):
        for li, line in enumerate(warmup.get("lines") or []):
            if isinstance(line, dict) and line.get("vi"):
                fields.append((f"warmupReading.lines[{li}].vi", str(line["vi"])))

    for di, d in enumerate(lesson.get("dialogues") or []):
        for li, line in enumerate(d.get("lines") or []):
            if isinstance(line, dict) and line.get("vi"):
                fields.append((f"dialogues[{di}].lines[{li}].vi", str(line["vi"])))

    for qi, q in enumerate(lesson.get("practice") or []):
        if isinstance(q, dict):
            for key in ("prompt", "explanation"):
                if q.get(key):
                    fields.append((f"practice[{qi}].{key}", str(q[key])))

    for bucket in ("vocabSources", "vocabReplacements"):
        entries = payload.get(bucket) or []
        if isinstance(entries, list):
            for ei, entry in enumerate(entries):
                for xi, ex in enumerate(entry.get("examples") or []):
                    if isinstance(ex, dict) and ex.get("vi"):
                        fields.append((f"{bucket}[{ei}].examples[{xi}].vi", str(ex["vi"])))
                if isinstance(entry.get("supplementExample"), dict) and entry["supplementExample"].get("vi"):
                    fields.append((f"{bucket}[{ei}].supplementExample.vi", str(entry["supplementExample"]["vi"])))

    if isinstance(payload.get("rawText"), str) and payload["rawText"].strip():
        fields.append(("rawText", payload["rawText"]))

    return fields


def compute_originality_metrics(
    source_obj: dict[str, Any],
    candidate_obj: dict[str, Any],
    allowed_terms: list[str] | None = None,
    thresholds: dict[str, float] | None = None,
) -> dict[str, Any]:
    """Compare candidate against quarantined source to detect copied or shallowly paraphrased text."""
    cfg = {**DEFAULT_THRESHOLDS, **(thresholds or {})}
    allowed_set = {extract_hanzi_only(t) for t in (allowed_terms or []) if extract_hanzi_only(t)}

    src_cn_items = collect_cn_texts(source_obj)
    cand_cn_items = collect_cn_texts(candidate_obj)

    src_sentences: dict[str, list[str]] = {}
    for path, text in src_cn_items:
        for sent in split_cn_sentences(text):
            if count_hanzi(sent) >= int(cfg["min_exact_cn_len"]):
                src_sentences.setdefault(sent, []).append(path)

    exact_cn_matches: list[dict[str, Any]] = []
    for path, text in cand_cn_items:
        for sent in split_cn_sentences(text):
            if sent in src_sentences:
                exact_cn_matches.append(
                    {
                        "candidateField": path,
                        "sourceFields": src_sentences[sent],
                        "sentence": sent,
                    }
                )

    # 5-gram Hanzi overlap (excluding 5-grams that are purely inside an allowed vocabulary/pattern string)
    src_5grams: set[str] = set()
    for _, text in src_cn_items:
        for sent in split_cn_sentences(text):
            src_5grams |= make_char_ngrams(extract_hanzi_only(sent), 5)

    cand_5grams: set[str] = set()
    for _, text in cand_cn_items:
        for sent in split_cn_sentences(text):
            cand_5grams |= make_char_ngrams(extract_hanzi_only(sent), 5)

    def _is_exempt_ngram(ng: str) -> bool:
        return any(ng in term for term in allowed_set if len(term) >= 5)

    filtered_src_5 = {ng for ng in src_5grams if not _is_exempt_ngram(ng)}
    filtered_cand_5 = {ng for ng in cand_5grams if not _is_exempt_ngram(ng)}
    matched_cn_5 = sorted(filtered_src_5 & filtered_cand_5)
    cn_5gram_ratio = (len(matched_cn_5) / len(filtered_cand_5)) if filtered_cand_5 else 0.0

    # Vietnamese 4-gram overlap
    src_vi_fields = collect_vi_fields(source_obj)
    cand_vi_fields = collect_vi_fields(candidate_obj)

    src_vi_4: set[tuple[str, ...]] = set()
    for _, text in src_vi_fields:
        src_vi_4 |= make_word_ngrams(tokenize_vi(text), 4)

    cand_vi_4: set[tuple[str, ...]] = set()
    for _, text in cand_vi_fields:
        cand_vi_4 |= make_word_ngrams(tokenize_vi(text), 4)

    matched_vi_4 = sorted(src_vi_4 & cand_vi_4)
    vi_4gram_ratio = (len(matched_vi_4) / len(cand_vi_4)) if cand_vi_4 else 0.0

    # Pairwise word-level sequence similarity for Vietnamese prose
    high_sim_pairs: list[dict[str, Any]] = []
    max_vi_sim = 0.0
    min_words = int(cfg["min_vi_field_words"])
    for c_path, c_text in cand_vi_fields:
        c_tokens = tokenize_vi(c_text)
        if len(c_tokens) < min_words:
            continue
        for s_path, s_text in src_vi_fields:
            s_tokens = tokenize_vi(s_text)
            if len(s_tokens) < min_words:
                continue
            sim = SequenceMatcher(None, s_tokens, c_tokens).ratio()
            if sim > max_vi_sim:
                max_vi_sim = sim
            if sim > cfg["max_vi_field_similarity"]:
                high_sim_pairs.append(
                    {
                        "candidateField": c_path,
                        "sourceField": s_path,
                        "similarity": round(sim, 4),
                        "candidateSnippet": c_text[:120],
                        "sourceSnippet": s_text[:120],
                    }
                )

    # Banned source markers in serialized candidate
    serialized = json.dumps(candidate_obj, ensure_ascii=False)
    banned_hits: list[str] = []
    for pat in BANNED_SOURCE_PATTERNS:
        found = pat.findall(serialized)
        if found:
            banned_hits.append(f"{pat.pattern} ({len(found)}x)")

    failures: list[str] = []
    if len(exact_cn_matches) > cfg["max_exact_cn_matches"]:
        failures.append(
            f"Found {len(exact_cn_matches)} exact Chinese sentence match(es) against source (allowed: 0)."
        )
    if cn_5gram_ratio > cfg["max_cn_5gram_overlap"]:
        failures.append(
            f"Chinese 5-gram overlap {cn_5gram_ratio:.3f} exceeds threshold {cfg['max_cn_5gram_overlap']:.3f}."
        )
    if vi_4gram_ratio > cfg["max_vi_4gram_overlap"]:
        failures.append(
            f"Vietnamese 4-gram overlap {vi_4gram_ratio:.3f} exceeds threshold {cfg['max_vi_4gram_overlap']:.3f}."
        )
    if high_sim_pairs:
        failures.append(
            f"Found {len(high_sim_pairs)} Vietnamese field pair(s) above similarity {cfg['max_vi_field_similarity']:.2f} "
            f"(max={max_vi_sim:.3f})."
        )
    if banned_hits:
        failures.append("Banned source markers found in candidate: " + ", ".join(banned_hits))

    return {
        "passed": len(failures) == 0,
        "thresholds": cfg,
        "exactCnMatchCount": len(exact_cn_matches),
        "exactCnMatches": exact_cn_matches[:20],
        "cn5gramOverlapRatio": round(cn_5gram_ratio, 4),
        "matchedCn5gramCount": len(matched_cn_5),
        "matchedCn5gramsSample": matched_cn_5[:20],
        "vi4gramOverlapRatio": round(vi_4gram_ratio, 4),
        "matchedVi4gramCount": len(matched_vi_4),
        "matchedVi4gramsSample": [" ".join(x) for x in matched_vi_4[:20]],
        "maxViFieldSimilarity": round(max_vi_sim, 4),
        "highSimilarityPairs": high_sim_pairs[:15],
        "bannedMarkers": banned_hits,
        "failures": failures,
    }


def validate_app_schema(
    candidate_obj: dict[str, Any],
    blueprint_obj: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Validate candidate lesson against lessons.js and tools/check-content.cjs invariants."""
    errors: list[str] = []
    warnings: list[str] = []
    lesson = _extract_lesson_payload(candidate_obj)

    lesson_id = str(lesson.get("id") or "").strip()
    if not lesson_id:
        errors.append("Missing lesson.id")

    hsk = None
    if blueprint_obj and isinstance(blueprint_obj.get("hsk"), int):
        hsk = blueprint_obj["hsk"]
    else:
        m = re.match(r"standard-(\d+)-", lesson_id)
        if m:
            hsk = int(m.group(1))
    if hsk not in HSK_MIN_CHARS:
        errors.append(f"Cannot determine valid HSK level (1-6) for lesson id '{lesson_id}'")

    objectives = lesson.get("objectives")
    if not isinstance(objectives, list) or not objectives or not all(isinstance(x, str) and x.strip() for x in objectives):
        errors.append("lesson.objectives must be a non-empty list of strings")

    if not isinstance(lesson.get("summary"), str) or len(lesson["summary"].strip()) < 30:
        errors.append("lesson.summary must be a descriptive string (>= 30 chars)")

    grammar = lesson.get("grammar")
    if not isinstance(grammar, list) or not grammar:
        errors.append("lesson.grammar must be a non-empty list")
    else:
        if blueprint_obj and len(grammar) < len(blueprint_obj.get("grammarPoints") or []):
            errors.append(
                f"lesson.grammar has {len(grammar)} items, fewer than blueprint's "
                f"{len(blueprint_obj.get('grammarPoints') or [])}"
            )
        for idx, g in enumerate(grammar):
            for field in ("title", "pattern", "usage", "error"):
                if not isinstance(g.get(field), str) or not g[field].strip():
                    errors.append(f"grammar[{idx}].{field} is missing or empty")
            exs = g.get("examples")
            if not isinstance(exs, list) or not exs:
                errors.append(f"grammar[{idx}].examples must be a non-empty list")
            else:
                for ei, ex in enumerate(exs):
                    for field in ("cn", "pin", "vi"):
                        if not isinstance(ex.get(field), str) or not ex[field].strip():
                            errors.append(f"grammar[{idx}].examples[{ei}].{field} is missing or empty")

    reading = lesson.get("reading")
    if not isinstance(reading, dict):
        errors.append("lesson.reading must be an object")
    else:
        if reading.get("kind") != "long-form-original":
            errors.append("reading.kind must be 'long-form-original'")
        lines = reading.get("lines")
        if not isinstance(lines, list) or len(lines) < 3:
            errors.append("reading.lines must have at least 3 paragraphs")
        else:
            actual_chars = 0
            full_reading_cn = ""
            for li, line in enumerate(lines):
                for field in ("cn", "pin", "vi"):
                    if not isinstance(line.get(field), str) or not line[field].strip():
                        errors.append(f"reading.lines[{li}].{field} is missing or empty")
                actual_chars += count_hanzi(line.get("cn", ""))
                full_reading_cn += "\n" + str(line.get("cn", ""))

            declared_chars = reading.get("characterCount")
            if declared_chars != actual_chars:
                errors.append(
                    f"reading.characterCount ({declared_chars}) does not match actual Hanzi count ({actual_chars})"
                )
            if hsk in HSK_MIN_CHARS and actual_chars < HSK_MIN_CHARS[hsk]:
                errors.append(
                    f"reading Hanzi count ({actual_chars}) is below HSK {hsk} minimum ({HSK_MIN_CHARS[hsk]})"
                )

            app_meta = reading.get("lessonApplication")
            if not isinstance(app_meta, dict):
                errors.append("reading.lessonApplication is required")
            else:
                vocab_used = app_meta.get("vocabularyUsed") or []
                for term in vocab_used:
                    if term and term not in full_reading_cn:
                        errors.append(f"reading.lessonApplication.vocabularyUsed claims '{term}' but it is not in reading.lines")
                if blueprint_obj:
                    bp_words = [w["han"] for w in (blueprint_obj.get("vocabulary") or []) if w.get("han")]
                    missing_bp = [w for w in bp_words if w not in full_reading_cn]
                    if missing_bp:
                        warnings.append(f"Blueprint vocabulary not found verbatim in reading.lines: {missing_bp}")

                g_applied = app_meta.get("grammarApplied") or []
                g_missing = app_meta.get("grammarMissing")
                if isinstance(grammar, list) and len(g_applied) < len(grammar):
                    errors.append(
                        f"reading.lessonApplication.grammarApplied ({len(g_applied)}) < lesson.grammar ({len(grammar)})"
                    )
                if g_missing != []:
                    errors.append(f"reading.lessonApplication.grammarMissing must be [], got {g_missing!r}")
                for gi, item in enumerate(g_applied):
                    p_idx = item.get("paragraph")
                    ex_text = str(item.get("example") or "").strip()
                    if not isinstance(p_idx, int) or p_idx < 1 or p_idx > len(lines):
                        errors.append(f"grammarApplied[{gi}].paragraph ({p_idx}) out of range 1..{len(lines)}")
                    elif ex_text and ex_text not in lines[p_idx - 1].get("cn", ""):
                        errors.append(f"grammarApplied[{gi}].example not found in reading.lines[{p_idx - 1}]")

    warmup = lesson.get("warmupReading")
    if hsk in (1, 2):
        if not isinstance(warmup, dict) or not (warmup.get("lines") or []):
            errors.append(f"warmupReading.lines is required for HSK {hsk}")
    if isinstance(warmup, dict):
        for li, line in enumerate(warmup.get("lines") or []):
            for field in ("cn", "pin", "vi"):
                if not isinstance(line.get(field), str) or not line[field].strip():
                    errors.append(f"warmupReading.lines[{li}].{field} is missing or empty")

    dialogues = lesson.get("dialogues")
    if not isinstance(dialogues, list) or not dialogues:
        errors.append("lesson.dialogues must be a non-empty list")
    else:
        for di, d in enumerate(dialogues):
            if not d.get("title"):
                errors.append(f"dialogues[{di}].title is missing")
            dlines = d.get("lines")
            if not isinstance(dlines, list) or len(dlines) < 2:
                errors.append(f"dialogues[{di}].lines must have at least 2 turns")
            else:
                for li, line in enumerate(dlines):
                    for field in ("cn", "pin", "vi", "speaker"):
                        if not isinstance(line.get(field), str) or not line[field].strip():
                            errors.append(f"dialogues[{di}].lines[{li}].{field} is missing or empty")

    practice = lesson.get("practice")
    if not isinstance(practice, list) or len(practice) < 3:
        errors.append("lesson.practice must have at least 3 questions")
    else:
        ids = [q.get("id") for q in practice]
        if len(set(ids)) != len(ids):
            errors.append("lesson.practice contains duplicate question IDs")
        for qi, q in enumerate(practice):
            if not q.get("id") or not q.get("prompt") or not q.get("explanation"):
                errors.append(f"practice[{qi}] missing id, prompt, or explanation")
            opts = q.get("options")
            ans = q.get("answer")
            if not isinstance(opts, list) or len(opts) < 2:
                errors.append(f"practice[{qi}].options must have at least 2 choices")
            elif not isinstance(ans, int) or ans < 0 or ans >= len(opts):
                errors.append(f"practice[{qi}].answer ({ans}) out of range 0..{len(opts) - 1}")

    prov = lesson.get("provenance")
    if not isinstance(prov, dict) or prov.get("kind") != "original" or not prov.get("label"):
        errors.append("lesson.provenance must have kind='original' and non-empty label")

    # Validate optional vocabReplacements (for cleaning content/data Hanzii examples)
    vocab_reps = candidate_obj.get("vocabReplacements")
    if vocab_reps is not None:
        if not isinstance(vocab_reps, list):
            errors.append("vocabReplacements must be a list when present")
        else:
            for vi, entry in enumerate(vocab_reps):
                han = str(entry.get("han") or "").strip()
                if not entry.get("key") or not han:
                    errors.append(f"vocabReplacements[{vi}] missing key or han")
                    continue
                for xi, ex in enumerate(entry.get("examples") or []):
                    for field in ("cn", "pin", "vi"):
                        if not isinstance(ex.get(field), str) or not ex[field].strip():
                            errors.append(f"vocabReplacements[{vi}].examples[{xi}].{field} missing")
                    if han not in str(ex.get("cn") or ""):
                        errors.append(
                            f"vocabReplacements[{vi}].examples[{xi}].cn does not contain target word '{han}'"
                        )
                    if ex.get("origin") != "authored":
                        errors.append(f"vocabReplacements[{vi}].examples[{xi}].origin must be 'authored'")
                sup = entry.get("supplementExample")
                if isinstance(sup, dict):
                    for field in ("cn", "pin", "vi", "meaning"):
                        if not isinstance(sup.get(field), str) or not sup[field].strip():
                            errors.append(f"vocabReplacements[{vi}].supplementExample.{field} missing")
                    if han not in str(sup.get("cn") or ""):
                        errors.append(
                            f"vocabReplacements[{vi}].supplementExample.cn does not contain target word '{han}'"
                        )

    return {
        "passed": len(errors) == 0,
        "hsk": hsk,
        "errors": errors,
        "warnings": warnings,
    }


def audit_repo(repo_root: Path = ROOT) -> dict[str, Any]:
    """Audit all Hanzii and external-source references across the HSK repository."""
    report: dict[str, Any] = {"summary": {}, "files": {}}

    # 1. checkedPracticeExamples.js
    cpe_path = repo_root / "content/data/checkedPracticeExamples.js"
    cpe = load_js_json(cpe_path)
    origin_counts: Counter[str] = Counter()
    hanzii_by_hsk: Counter[str] = Counter()
    checked_against_hanzii = 0
    for key, entry in (cpe.get("entries") or {}).items():
        hsk_level = key.split("|", 1)[0]
        if "hanzii.net" in str(entry.get("checkedAgainst") or "").lower():
            checked_against_hanzii += 1
        for ex in entry.get("examples") or []:
            orig = str(ex.get("origin") or "unknown")
            origin_counts[orig] += 1
            if orig == "hanzii":
                hanzii_by_hsk[f"HSK {hsk_level}"] += 1
    report["files"]["content/data/checkedPracticeExamples.js"] = {
        "totalEntries": len(cpe.get("entries") or {}),
        "totalSentences": sum(origin_counts.values()),
        "originCounts": dict(origin_counts),
        "hanziiExamplesByLevel": dict(sorted(hanzii_by_hsk.items())),
        "checkedAgainstHanziiUrls": checked_against_hanzii,
        "risk": "HIGH",
    }

    # 2. dictionarySupplement.js
    sup_path = repo_root / "content/data/dictionarySupplement.js"
    sup = load_js_json(sup_path)
    sup_hanzii_urls = 0
    sup_examples_with_hanzii = 0
    sup_examples_by_hsk: Counter[str] = Counter()
    for key, entry in (sup.get("entries") or {}).items():
        hsk_level = key.split("|", 1)[0]
        is_hanzii = "hanzii.net" in str(entry.get("url") or "").lower()
        if is_hanzii:
            sup_hanzii_urls += 1
        if entry.get("example") and is_hanzii:
            sup_examples_with_hanzii += 1
            sup_examples_by_hsk[f"HSK {hsk_level}"] += 1
    report["files"]["content/data/dictionarySupplement.js"] = {
        "totalEntries": len(sup.get("entries") or {}),
        "hanziiUrls": sup_hanzii_urls,
        "hanziiExamples": sup_examples_with_hanzii,
        "hanziiExamplesByLevel": dict(sorted(sup_examples_by_hsk.items())),
        "risk": "HIGH",
    }

    # 3. wordRelationsData.js
    rel_path = repo_root / "content/data/wordRelationsData.js"
    rel = load_js_json(rel_path)
    rel_hanzii_urls = sum(
        1 for entry in (rel.get("entries") or {}).values() if "hanzii.net" in str(entry.get("url") or "").lower()
    )
    report["files"]["content/data/wordRelationsData.js"] = {
        "totalEntries": len(rel.get("entries") or {}),
        "reportSource": (rel.get("report") or {}).get("source"),
        "hanziiUrls": rel_hanzii_urls,
        "risk": "MEDIUM",
    }

    # 4. confusableGroups.js
    cg_path = repo_root / "content/data/confusableGroups.js"
    cg = load_js_json(cg_path)
    cg_hanzii_urls = sum(
        1
        for g in cg
        for m in (g.get("members") or [])
        if "hanzii.net" in str(m.get("url") or "").lower()
    )
    report["files"]["content/data/confusableGroups.js"] = {
        "totalGroups": len(cg),
        "hanziiMemberUrls": cg_hanzii_urls,
        "risk": "MEDIUM",
    }

    # 5. words.js
    words = load_words_js(repo_root / "content/data/words.js")
    words_hanzii = sum(
        1
        for w in words
        if (w.get("vocabularyProvenance") or {}).get("kind") == "hanzii-lexical-check"
    )
    report["files"]["content/data/words.js"] = {
        "totalWords": len(words),
        "hanziiLexicalChecks": words_hanzii,
        "risk": "LOW",
    }

    # 6. src/ui/dictionary-relations.js
    ui_rel_path = repo_root / "src/ui/dictionary-relations.js"
    ui_rel_lines = ui_rel_path.read_text(encoding="utf-8").splitlines()
    ui_hits = [
        {"line": i + 1, "snippet": line.strip()[:140]}
        for i, line in enumerate(ui_rel_lines)
        if "hanzii" in line.lower()
    ]
    report["files"]["src/ui/dictionary-relations.js"] = {
        "hanziiLineCount": len(ui_hits),
        "matches": ui_hits,
        "risk": "HIGH",
    }

    # 7. lesson-content-hsk1..6.json
    lesson_domains: Counter[str] = Counter()
    total_lessons = 0
    hanzii_in_lessons = 0
    for hsk in range(1, 7):
        lp = repo_root / f"lesson-content-hsk{hsk}.json"
        raw = lp.read_text(encoding="utf-8")
        hanzii_in_lessons += len(re.findall(r"hanzii", raw, re.IGNORECASE))
        data = json.loads(raw)
        total_lessons += len(data.get("lessons") or [])
        for lesson in data.get("lessons") or []:
            for src in (lesson.get("provenance") or {}).get("sources") or []:
                dom = urlparse(str(src.get("url") or "")).netloc
                if dom:
                    lesson_domains[dom] += 1

    report["files"]["lesson-content-hsk1..6.json"] = {
        "totalLessons": total_lessons,
        "hanziiMentions": hanzii_in_lessons,
        "provenanceDomains": dict(lesson_domains.most_common()),
        "risk": "LOW-MEDIUM",
    }

    report["summary"] = {
        "totalHanziiPracticeExamples": origin_counts.get("hanzii", 0),
        "totalHanziiSupplementExamples": sup_examples_with_hanzii,
        "totalHanziiUiLines": len(ui_hits),
        "totalLessons": total_lessons,
        "hanziiMentionsInLessonFiles": hanzii_in_lessons,
    }
    return report


def _strip_grammar_to_concept(grammar_item: dict[str, Any]) -> dict[str, Any]:
    """Keep ONLY the linguistic pattern & concept title; strip all prose usage/error/examples."""
    return {
        "pattern": str(grammar_item.get("pattern") or "").strip(),
        "conceptTopic": str(grammar_item.get("title") or "").strip(),
    }


def build_authoring_prompt(blueprint: dict[str, Any]) -> str:
    """Generate a clean-room authoring prompt strictly from the blueprint (zero source prose)."""
    vocab_lines = "\n".join(
        f"- `{w['han']}` ({w.get('pin', '')}): {w.get('mean', '')}"
        for w in (blueprint.get("vocabulary") or [])
    )
    grammar_lines = "\n".join(
        f"{i + 1}. Công thức cốt lõi: `{g['pattern']}` — Chủ điểm kiến thức: {g['conceptTopic']}"
        for i, g in enumerate(blueprint.get("grammarPoints") or [])
    )
    vocab_ex_lines = "\n".join(
        f"- `{v['key']}` (`{v['han']}` · {v.get('pin', '')} · nghĩa: {v.get('mean', '')}) — "
        f"cần {v['neededSupplementExample']} câu bổ sung, {v['neededPracticeExamples']} câu thay thế ví dụ luyện tập"
        for v in (blueprint.get("vocabExamplesNeeded") or [])
    )
    req = blueprint.get("readingRequirements") or {}
    return f"""# Clean-Room Authoring Brief — {blueprint['id']} (HSK {blueprint['hsk']})

> **NGUYÊN TẮC BẮT BUỘC**: Chỉ biên soạn dựa trên khung kiến thức bên dưới.
> KHÔNG tra chép lại văn bản Hanzii hay giáo trình gốc. Sáng tác hoàn toàn mới bối cảnh, nhân vật, lời giải thích, ví dụ, bài đọc, hội thoại và câu hỏi.

## 1. Thông tin bài học
- **ID bài**: `{blueprint['id']}`
- **Cấp độ**: HSK {blueprint['hsk']}
- **Chủ đề cốt lõi**: {blueprint.get('topicVi', '')} ({blueprint.get('topicCn', '')})

## 2. Danh sách từ vựng mục tiêu ({len(blueprint.get('vocabulary') or [])} từ)
{vocab_lines or '(Không có)'}

## 3. Các điểm ngữ pháp cần truyền đạt ({len(blueprint.get('grammarPoints') or [])} điểm)
{grammar_lines or '(Không có)'}

## 4. Yêu cầu cấu trúc & chất lượng sư phạm
1. **`objectives`**: 2–3 mục tiêu viết theo năng lực giao tiếp thực tế của người học Việt Nam.
2. **`summary`**: 1 đoạn tóm tắt ngắn (2–3 câu) nêu bối cảnh áp dụng và gợi ý cách tự luyện trong app.
3. **`grammar[]`**: Đủ {len(blueprint.get('grammarPoints') or [])} điểm tương ứng. Mỗi điểm gồm:
   - `title`: tên mới theo chức năng giao tiếp.
   - `pattern`: ký hiệu công thức thống nhất của app.
   - `usage`: diễn giải mạch lạc (khi nào dùng + vị trí thành phần trong câu).
   - `error`: chỉ ra lỗi phổ biến của người Việt học tiếng Trung và cách tránh.
   - `examples`: 1–2 câu ví dụ **bối cảnh hoàn toàn mới**, đủ `cn`, `pin` (đúng dấu thanh), `vi`.
4. **`warmupReading`**: 2–3 câu ngắn khởi động (bắt buộc với HSK 1–2), dùng từ vựng bài.
5. **`reading`**:
   - `kind`: `"long-form-original"`
   - Tối thiểu **{req.get('minParagraphs', 3)} đoạn**, tổng số chữ Hán `>= {req.get('minHanziChars', 120)}` (ghi đúng vào `characterCount`).
   - Xây dựng cốt truyện/tình huống đời sống mới hoàn toàn.
   - Phủ tối đa toàn bộ từ vựng mục tiêu (`lessonApplication.vocabularyUsed`) và chèn đủ mọi điểm ngữ pháp (`lessonApplication.grammarApplied`, `grammarMissing: []`).
6. **`dialogues[]`**: Ít nhất {req.get('minDialogues', 2)} hội thoại giao tiếp mới, mỗi lượt đủ `speaker`, `cn`, `pin`, `vi`.
7. **`practice[]`**: Tối thiểu {req.get('minPracticeQuestions', 3)} câu trắc nghiệm (`id` khớp `{', '.join(blueprint.get('practiceIds') or ['understanding', 'understanding-2', 'understanding-3'])}`), mỗi câu phải bám đúng nội dung đoạn đọc/khởi động tương ứng, có 4 phương án và `explanation` rõ ràng.
8. **`provenance`**: `kind: "original"`, ghi rõ đây là học liệu biên soạn riêng qua quy trình Clean-Room của app, **không** gắn URL hay nhãn Hanzii.

## 5. Ví dụ từ vựng cần biên soạn thay thế (để làm sạch `content/data/`)
{vocab_ex_lines or '(Không có từ nào cần thay thế ví dụ Hanzii trong bài này)'}

## 6. Kiểm định sau khi viết xong
Lưu JSON vào `rewritten-lesson.json` (dạng `{{"lesson": {{...}}, "vocabReplacements": [...]}}`) rồi chạy:
```bash
python3 tools/content_originality_pipeline.py verify \\
  --candidate rewritten-lesson.json \\
  --source source-snapshot.json \\
  --blueprint blueprint.json
```
"""


def extract_blueprint_from_repo(
    lesson_id: str,
    out_dir: Path,
    repo_root: Path = ROOT,
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Extract a clean Knowledge Blueprint + quarantined source snapshot from an existing repo lesson."""
    catalog = json.loads((repo_root / "lessons-data.json").read_text(encoding="utf-8"))
    meta_lesson = None
    hsk = None
    for course in catalog["courses"]:
        for item in course["lessons"]:
            if item["id"] == lesson_id:
                meta_lesson = item
                hsk = course["hsk"]
                break
        if meta_lesson:
            break
    if not meta_lesson or hsk is None:
        raise ValueError(f"Lesson ID '{lesson_id}' not found in lessons-data.json")

    content_data = json.loads((repo_root / f"lesson-content-hsk{hsk}.json").read_text(encoding="utf-8"))
    lesson_content = next((x for x in content_data["lessons"] if x["id"] == lesson_id), None)
    if not lesson_content:
        raise ValueError(f"Lesson ID '{lesson_id}' not found in lesson-content-hsk{hsk}.json")

    words = load_words_js(repo_root / "content/data/words.js")
    cpe = load_js_json(repo_root / "content/data/checkedPracticeExamples.js")
    sup = load_js_json(repo_root / "content/data/dictionarySupplement.js")

    # Map lesson vocabulary to exact words.js records (prefer matching HSK level, fallback any level)
    words_by_han: dict[str, list[dict[str, Any]]] = {}
    for w in words:
        words_by_han.setdefault(w["han"], []).append(w)

    vocab_blueprint: list[dict[str, Any]] = []
    vocab_needed: list[dict[str, Any]] = []
    vocab_sources: list[dict[str, Any]] = []

    for han in meta_lesson.get("words") or []:
        candidates = words_by_han.get(han) or []
        chosen = next((w for w in candidates if str(w.get("hsk")) == str(hsk)), candidates[0] if candidates else None)
        if not chosen:
            vocab_blueprint.append({"han": han, "pin": "", "mean": "", "inWordsDb": False})
            continue

        key = f"{chosen['hsk']}|{chosen['han']}|{chosen['pin']}"
        vocab_blueprint.append(
            {
                "key": key,
                "han": chosen["han"],
                "pin": chosen["pin"],
                "mean": chosen["mean"],
                "inWordsDb": True,
            }
        )

        cpe_entry = (cpe.get("entries") or {}).get(key) or {}
        hanzii_practice = [ex for ex in (cpe_entry.get("examples") or []) if ex.get("origin") == "hanzii"]
        sup_entry = (sup.get("entries") or {}).get(key) or {}
        sup_is_hanzii = "hanzii.net" in str(sup_entry.get("url") or "").lower()
        sup_ex = sup_entry.get("example") if (sup_is_hanzii and isinstance(sup_entry.get("example"), dict)) else None

        if hanzii_practice or sup_ex:
            vocab_needed.append(
                {
                    "key": key,
                    "han": chosen["han"],
                    "pin": chosen["pin"],
                    "mean": chosen["mean"],
                    "neededPracticeExamples": len(hanzii_practice),
                    "neededSupplementExample": 1 if sup_ex else 0,
                    "targetSenses": sorted(
                        {
                            str(ex.get("sense") or ex.get("meaning") or chosen["mean"])
                            for ex in hanzii_practice
                        }
                        | ({str(sup_ex.get("meaning") or chosen["mean"])} if sup_ex else set())
                    ),
                }
            )
            vocab_sources.append(
                {
                    "key": key,
                    "han": chosen["han"],
                    "examples": hanzii_practice,
                    "supplementExample": sup_ex,
                }
            )

    blueprint = {
        "schemaVersion": 1,
        "mode": "clean-room-blueprint",
        "id": lesson_id,
        "hsk": hsk,
        "number": meta_lesson["number"],
        "topicCn": meta_lesson["title"],
        "topicVi": meta_lesson["vi"],
        "vocabulary": vocab_blueprint,
        "grammarPoints": [_strip_grammar_to_concept(g) for g in (lesson_content.get("grammar") or [])],
        "practiceIds": [q["id"] for q in (lesson_content.get("practice") or []) if q.get("id")],
        "readingRequirements": {
            "minParagraphs": 3,
            "minHanziChars": HSK_MIN_CHARS[hsk],
            "requireWarmup": hsk in (1, 2),
            "minDialogues": max(2, len(lesson_content.get("dialogues") or [])),
            "minPracticeQuestions": max(3, len(lesson_content.get("practice") or [])),
        },
        "vocabExamplesNeeded": vocab_needed,
    }

    source_snapshot = {
        "schemaVersion": 1,
        "quarantineNotice": "DO NOT feed this file into authoring prompts. Use ONLY for automated originality verification.",
        "lesson": lesson_content,
        "vocabSources": vocab_sources,
    }

    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "blueprint.json").write_text(json.dumps(blueprint, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (out_dir / "source-snapshot.json").write_text(
        json.dumps(source_snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (out_dir / "authoring-prompt.md").write_text(build_authoring_prompt(blueprint), encoding="utf-8")
    return blueprint, source_snapshot


def extract_blueprint_from_raw(raw_path: Path, out_dir: Path, hsk: int = 1, lesson_id: str | None = None) -> tuple[dict[str, Any], dict[str, Any]]:
    """Extract a clean Knowledge Blueprint + quarantined source snapshot from raw Hanzii JSON or Markdown/text."""
    raw_text = raw_path.read_text(encoding="utf-8")
    parsed: dict[str, Any]
    if raw_path.suffix.lower() == ".json":
        parsed = json.loads(raw_text)
    else:
        # Lightweight Markdown/text parser for pasted Hanzii lesson notes
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        vocab_items: list[dict[str, Any]] = []
        grammar_items: list[dict[str, Any]] = []
        title = lines[0].lstrip("#").strip() if lines else raw_path.stem
        for line in lines[1:]:
            # Pattern: `汉字 (pinyin): nghĩa` or `汉字 - pinyin - nghĩa`
            m_vocab = re.match(r"^[-*•]?\s*([\u3400-\u9fff]+)\s*[\(\[（]([^)\]）]+)[\)\]）]\s*[:：\-–]\s*(.+)$", line)
            if m_vocab:
                vocab_items.append({"han": m_vocab.group(1), "pin": m_vocab.group(2).strip(), "mean": m_vocab.group(3).strip()})
                continue
            m_gram = re.match(r"^(?:Ngữ pháp|Grammar|Cấu trúc|Mẫu)\s*\d*[:：]\s*(.+)$", line, re.IGNORECASE)
            if m_gram:
                grammar_items.append({"title": m_gram.group(1).strip(), "pattern": m_gram.group(1).strip()})
        parsed = {
            "id": lesson_id or f"custom-{hsk}-01",
            "hsk": hsk,
            "topicVi": title,
            "topicCn": extract_hanzi_only(title),
            "vocabulary": vocab_items,
            "grammar": grammar_items,
            "rawText": raw_text,
        }

    eff_hsk = int(parsed.get("hsk") or hsk)
    eff_id = str(lesson_id or parsed.get("id") or f"custom-{eff_hsk}-01")
    raw_vocab = parsed.get("vocabulary") or parsed.get("words") or []
    vocab_blueprint: list[dict[str, Any]] = []
    for item in raw_vocab:
        if isinstance(item, str):
            vocab_blueprint.append({"han": item, "pin": "", "mean": ""})
        elif isinstance(item, dict):
            vocab_blueprint.append(
                {
                    "han": str(item.get("han") or item.get("word") or ""),
                    "pin": str(item.get("pin") or item.get("pinyin") or ""),
                    "mean": str(item.get("mean") or item.get("meaning") or item.get("vi") or ""),
                }
            )

    grammar_blueprint = [
        _strip_grammar_to_concept(g) if isinstance(g, dict) else {"pattern": str(g), "conceptTopic": str(g)}
        for g in (parsed.get("grammar") or [])
    ]

    blueprint = {
        "schemaVersion": 1,
        "mode": "clean-room-blueprint",
        "id": eff_id,
        "hsk": eff_hsk,
        "topicCn": str(parsed.get("topicCn") or parsed.get("title") or ""),
        "topicVi": str(parsed.get("topicVi") or parsed.get("vi") or parsed.get("name") or eff_id),
        "vocabulary": vocab_blueprint,
        "grammarPoints": grammar_blueprint,
        "practiceIds": ["understanding", "understanding-2", "understanding-3"],
        "readingRequirements": {
            "minParagraphs": 3,
            "minHanziChars": HSK_MIN_CHARS.get(eff_hsk, 120),
            "requireWarmup": eff_hsk in (1, 2),
            "minDialogues": 2,
            "minPracticeQuestions": 3,
        },
        "vocabExamplesNeeded": [],
    }
    source_snapshot = {
        "schemaVersion": 1,
        "quarantineNotice": "DO NOT feed this file into authoring prompts. Use ONLY for automated originality verification.",
        "lesson": parsed,
        "rawText": raw_text,
    }

    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "blueprint.json").write_text(json.dumps(blueprint, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (out_dir / "source-snapshot.json").write_text(
        json.dumps(source_snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (out_dir / "authoring-prompt.md").write_text(build_authoring_prompt(blueprint), encoding="utf-8")
    return blueprint, source_snapshot


def verify_candidate(
    candidate_obj: dict[str, Any],
    source_obj: dict[str, Any],
    blueprint_obj: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Run both Originality Gate and Knowledge/Schema Gate."""
    allowed_terms: list[str] = []
    if blueprint_obj:
        for w in blueprint_obj.get("vocabulary") or []:
            if w.get("han"):
                allowed_terms.append(str(w["han"]))
        for g in blueprint_obj.get("grammarPoints") or []:
            if g.get("pattern"):
                allowed_terms.append(str(g["pattern"]))

    originality = compute_originality_metrics(source_obj, candidate_obj, allowed_terms=allowed_terms)
    schema = validate_app_schema(candidate_obj, blueprint_obj=blueprint_obj)
    return {
        "passed": originality["passed"] and schema["passed"],
        "originalityGate": originality,
        "schemaGate": schema,
    }


def apply_lesson_to_repo(
    candidate_path: Path,
    write: bool = False,
    repo_root: Path = ROOT,
) -> dict[str, Any]:
    """Validate and optionally write a verified lesson into lesson-content-hsk{N}.json."""
    candidate = json.loads(candidate_path.read_text(encoding="utf-8"))
    schema = validate_app_schema(candidate)
    if not schema["passed"]:
        raise ValueError("Candidate failed schema gate: " + "; ".join(schema["errors"]))

    lesson = _extract_lesson_payload(candidate)
    hsk = schema["hsk"]
    target_path = repo_root / f"lesson-content-hsk{hsk}.json"
    data = json.loads(target_path.read_text(encoding="utf-8"))
    idx = next((i for i, item in enumerate(data["lessons"]) if item["id"] == lesson["id"]), None)
    if idx is None:
        raise ValueError(f"Lesson '{lesson['id']}' not found in {target_path.name}")

    old_lesson = data["lessons"][idx]
    summary = {
        "targetFile": str(target_path.relative_to(repo_root)),
        "lessonId": lesson["id"],
        "dryRun": not write,
        "oldReadingChars": old_lesson.get("reading", {}).get("characterCount"),
        "newReadingChars": lesson.get("reading", {}).get("characterCount"),
        "oldGrammarCount": len(old_lesson.get("grammar") or []),
        "newGrammarCount": len(lesson.get("grammar") or []),
        "vocabReplacementsBundled": len(candidate.get("vocabReplacements") or []),
    }
    if write:
        data["lessons"][idx] = lesson
        target_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return summary


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="HSK Clean-Room Content Originality Pipeline")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_audit = sub.add_parser("audit-repo", help="Audit Hanzii and external-source references across the repo")
    p_audit.add_argument("--out", type=Path, help="Optional JSON output path")

    p_bp = sub.add_parser("extract-blueprint", help="Strip prose/examples and output a clean Knowledge Blueprint")
    src_group = p_bp.add_mutually_exclusive_group(required=True)
    src_group.add_argument("--lesson-id", help="Existing repo lesson ID (e.g. standard-1-04)")
    src_group.add_argument("--raw-input", type=Path, help="Raw Hanzii lesson file (JSON or Markdown/text)")
    p_bp.add_argument("--hsk", type=int, default=1, help="HSK level for --raw-input (default: 1)")
    p_bp.add_argument("--out-dir", type=Path, required=True, help="Output directory for blueprint, snapshot, and prompt")

    p_ver = sub.add_parser("verify", help="Verify rewritten lesson against quarantined source and app schema")
    p_ver.add_argument("--candidate", type=Path, required=True, help="Path to rewritten-lesson.json")
    p_ver.add_argument("--source", type=Path, required=True, help="Path to source-snapshot.json")
    p_ver.add_argument("--blueprint", type=Path, help="Optional path to blueprint.json")
    p_ver.add_argument("--report", type=Path, help="Optional path to save verification JSON report")

    p_app = sub.add_parser("apply-lesson", help="Dry-run or apply verified lesson to lesson-content-hskN.json")
    p_app.add_argument("--candidate", type=Path, required=True)
    p_app.add_argument("--write", action="store_true", help="Actually write changes (default is dry-run)")

    args = parser.parse_args(argv)

    if args.cmd == "audit-repo":
        report = audit_repo(ROOT)
        if args.out:
            args.out.parent.mkdir(parents=True, exist_ok=True)
            args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0

    if args.cmd == "extract-blueprint":
        if args.lesson_id:
            bp, _ = extract_blueprint_from_repo(args.lesson_id, args.out_dir, ROOT)
        else:
            bp, _ = extract_blueprint_from_raw(args.raw_input, args.out_dir, hsk=args.hsk)
        print(
            f"OK: extracted clean blueprint for {bp['id']} (HSK {bp['hsk']}) -> {args.out_dir}\n"
            f"  vocab={len(bp['vocabulary'])}, grammarPoints={len(bp['grammarPoints'])}, "
            f"vocabExamplesNeeded={len(bp['vocabExamplesNeeded'])}"
        )
        return 0

    if args.cmd == "verify":
        cand = json.loads(args.candidate.read_text(encoding="utf-8"))
        src = json.loads(args.source.read_text(encoding="utf-8"))
        bp = json.loads(args.blueprint.read_text(encoding="utf-8")) if args.blueprint else None
        res = verify_candidate(cand, src, bp)
        if args.report:
            args.report.parent.mkdir(parents=True, exist_ok=True)
            args.report.write_text(json.dumps(res, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(res, ensure_ascii=False, indent=2))
        return 0 if res["passed"] else 1

    if args.cmd == "apply-lesson":
        res = apply_lesson_to_repo(args.candidate, write=args.write, repo_root=ROOT)
        print(json.dumps(res, ensure_ascii=False, indent=2))
        return 0

    return 2


if __name__ == "__main__":
    raise SystemExit(main())
