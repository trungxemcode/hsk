"""Validate labeled HSK data and score localization, including missed errors."""
import argparse
import collections
import hashlib
import json
import re
import unicodedata
from pathlib import Path

SPLITS = ("train", "validation", "test")
TYPES = {
    "character", "classifier", "particle", "aspect", "word_order",
    "missing_component", "redundancy", "collocation", "conjunction",
    "scope", "polarity", "parallelism", "ambiguity", "punctuation",
}


def han(char):
    return bool(re.fullmatch(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\U00020000-\U000323af]", char))


def anchor(text, span):
    """The two-label checkpoint can represent a missing item only via a neighbor."""
    start, end = span["start"], span["end"]
    positions = {index for index in range(start, end) if han(text[index])}
    if positions:
        return positions
    right = next((index for index in range(start, len(text)) if han(text[index])), None)
    if right is not None:
        return {right}
    return {next(index for index in range(start - 1, -1, -1) if han(text[index]))}


def normalize(text):
    return "".join(unicodedata.normalize("NFKC", text).split()).casefold()


def load_corpus(folder):
    folder = Path(folder)
    manifest = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))
    for key in ("name", "license", "provenance", "purpose"):
        if not isinstance(manifest.get(key), str) or not manifest[key].strip():
            raise ValueError(f"manifest.json must declare {key}")
    seen_ids, seen_text, family_split = set(), set(), {}
    rows, hashes = {}, {}
    for split in SPLITS:
        raw = (folder / f"{split}.jsonl").read_bytes()
        hashes[split] = hashlib.sha256(raw).hexdigest()
        records = []
        for index, line in enumerate(raw.decode().splitlines(), 1):
            if not line.strip():
                continue
            try:
                row = json.loads(line)
                key, level, group, text, spans = (row[field] for field in ("id", "hsk", "family", "text", "errors"))
                if not isinstance(key, str) or not key.strip() or key in seen_ids:
                    raise ValueError("id must be unique")
                if type(level) is not int or level not in range(1, 7):
                    raise ValueError("hsk must be an integer between 1 and 6")
                if not isinstance(text, str) or not 2 <= len(text) <= 500 or not any(map(han, text)):
                    raise ValueError("text must contain Han characters and have 2–500 code points")
                if normalize(text) in seen_text:
                    raise ValueError("duplicate text across records")
                if not isinstance(group, str) or not group.strip() or family_split.setdefault(group, split) != split:
                    raise ValueError("each template/topic family belongs to exactly one split")
                if not isinstance(spans, list):
                    raise ValueError("errors must be a list, empty for a clean sentence")
                previous_end, previous_start = -1, -1
                for span in spans:
                    start, end = span["start"], span["end"]
                    if type(start) is not int or type(end) is not int or not 0 <= start <= end <= len(text):
                        raise ValueError("invalid half-open Unicode offsets")
                    if start < previous_end or start == previous_start:
                        raise ValueError("error spans must be sorted and non-overlapping")
                    if span["type"] not in TYPES:
                        raise ValueError("unknown error type")
                    if "original" in span and span["original"] != text[start:end]:
                        raise ValueError("original does not match the labeled source span")
                    previous_end, previous_start = end, start
                seen_ids.add(key)
                seen_text.add(normalize(text))
                records.append(row)
            except (KeyError, ValueError, TypeError) as error:
                raise ValueError(f"{split}.jsonl:{index}: {error}") from error
        for level in range(1, 7):
            labels = {bool(row["errors"]) for row in records if row["hsk"] == level}
            if labels != {False, True}:
                raise ValueError(f"{split}: HSK {level} needs clean and erroneous sentences")
        rows[split] = records
    return rows, {"manifest": manifest, "sha256": hashes}


def ratio(top, bottom):
    return round(top / bottom, 5) if bottom else None


def metrics(rows, scores, threshold):
    if len(rows) != len(scores):
        raise ValueError("missing score rows")
    by_level = collections.defaultdict(collections.Counter)
    by_type = collections.defaultdict(collections.Counter)
    total = collections.Counter()
    for row, probabilities in zip(rows, scores):
        flagged = {index for index, score in probabilities.items() if score >= threshold}
        gold = set()
        counters = collections.Counter()
        for span in row["errors"]:
            targets = anchor(row["text"], span)
            gold.update(targets)
            category = by_type[span["type"]]
            category["errors"] += 1
            category["located"] += bool(flagged & targets)
            category["anchor_only"] += span["start"] == span["end"] or not any(map(han, row["text"][span["start"]:span["end"]]))
            counters["errors"] += 1
            counters["located"] += bool(flagged & targets)
        counters["clean"] = not row["errors"]
        counters["clean_flagged"] = bool(flagged) and not row["errors"]
        counters["characters_flagged"] = len(flagged)
        counters["correct_characters_flagged"] = len(flagged & gold)
        counters["gold_characters"] = len(gold)
        by_level[row["hsk"]].update(counters)
        total.update(counters)

    def summarize(counts):
        return {
            **counts,
            "error_location_recall": ratio(counts["located"], counts["errors"]),
            "clean_sentence_false_alarm_rate": ratio(counts["clean_flagged"], counts["clean"]),
            "character_precision": ratio(counts["correct_characters_flagged"], counts["characters_flagged"]),
            "character_recall": ratio(counts["correct_characters_flagged"], counts["gold_characters"]),
        }

    return {
        "overall": summarize(total),
        "by_hsk": {str(level): summarize(by_level[level]) for level in range(1, 7)},
        "by_type": {kind: {**counts, "error_location_recall": ratio(counts["located"], counts["errors"])}
                    for kind, counts in sorted(by_type.items())},
    }


def calibrate(rows, scores, max_false_alarm):
    thresholds = [1.000001, *(i / 100 for i in range(20, 100))]
    best = None
    for threshold in thresholds:
        report = metrics(rows, scores, threshold)
        overall = report["overall"]
        if overall["clean_sentence_false_alarm_rate"] > max_false_alarm:
            continue
        macro = sum(level["error_location_recall"] for level in report["by_hsk"].values()) / 6
        rank = (macro, overall["character_precision"] or 0, threshold)
        if best is None or rank > best[0]:
            best = (rank, report)
    return best[0][2], best[1]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset_dir", type=Path)
    args = parser.parse_args()
    rows, provenance = load_corpus(args.dataset_dir)
    print(json.dumps({"counts": {split: len(values) for split, values in rows.items()}, **provenance}, ensure_ascii=False, indent=2))
