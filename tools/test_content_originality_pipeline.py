#!/usr/bin/env python3
"""Unit tests for tools/content_originality_pipeline.py."""

from __future__ import annotations

import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest

TOOLS_DIR = Path(__file__).resolve().parent
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

import content_originality_pipeline as pipeline  # noqa: E402

PILOT_DIR = TOOLS_DIR / "originality-pilot" / "standard-1-04"


class ContentOriginalityPipelineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.source = json.loads((PILOT_DIR / "source-snapshot.json").read_text(encoding="utf-8"))
        cls.blueprint = json.loads((PILOT_DIR / "blueprint.json").read_text(encoding="utf-8"))
        cls.pilot_candidate = json.loads((PILOT_DIR / "rewritten-lesson.json").read_text(encoding="utf-8"))

    def test_pilot_lesson_passes_both_gates(self) -> None:
        result = pipeline.verify_candidate(self.pilot_candidate, self.source, self.blueprint)
        self.assertTrue(result["passed"], f"Pilot should pass, got: {json.dumps(result, ensure_ascii=False)}")
        self.assertEqual(result["originalityGate"]["exactCnMatchCount"], 0)
        self.assertEqual(result["originalityGate"]["bannedMarkers"], [])
        self.assertEqual(result["schemaGate"]["errors"], [])

    def test_detects_exact_chinese_sentence_copy(self) -> None:
        cand = copy.deepcopy(self.pilot_candidate)
        # Copy a Hanzii supplement example directly into vocabReplacements
        cand["vocabReplacements"][4]["supplementExample"]["cn"] = "谁告诉你这个消息的？"
        result = pipeline.verify_candidate(cand, self.source, self.blueprint)
        self.assertFalse(result["originalityGate"]["passed"])
        self.assertGreaterEqual(result["originalityGate"]["exactCnMatchCount"], 1)

    def test_detects_shallow_vietnamese_paraphrase(self) -> None:
        cand = copy.deepcopy(self.pilot_candidate)
        # Shallowly tweak the source summary
        orig_summary = self.source["lesson"]["summary"]
        cand["lesson"]["summary"] = orig_summary.replace("người học", "bạn học")
        result = pipeline.verify_candidate(cand, self.source, self.blueprint)
        self.assertFalse(result["originalityGate"]["passed"])
        self.assertGreater(len(result["originalityGate"]["highSimilarityPairs"]), 0)

    def test_detects_banned_hanzii_marker(self) -> None:
        cand = copy.deepcopy(self.pilot_candidate)
        cand["lesson"]["provenance"]["sources"] = [
            {"label": "Hanzii", "url": "https://hanzii.net/search/word/%E8%B0%81?hl=vi"}
        ]
        result = pipeline.verify_candidate(cand, self.source, self.blueprint)
        self.assertFalse(result["originalityGate"]["passed"])
        self.assertTrue(result["originalityGate"]["bannedMarkers"])

    def test_schema_gate_catches_character_count_and_missing_target_word(self) -> None:
        cand = copy.deepcopy(self.pilot_candidate)
        cand["lesson"]["reading"]["characterCount"] = 999
        cand["vocabReplacements"][1]["supplementExample"]["cn"] = "我每天早上看新闻。"  # missing 汉语
        schema = pipeline.validate_app_schema(cand, self.blueprint)
        self.assertFalse(schema["passed"])
        joined = "\n".join(schema["errors"])
        self.assertIn("characterCount", joined)
        self.assertIn("汉语", joined)

    def test_extract_blueprint_from_raw_markdown_strips_source_prose(self) -> None:
        raw_md = """# HSK 2 - Bài mẫu từ Hanzii: Đi du lịch
- 旅游 (lǚyóu): du lịch
- 觉得 (juéde): cảm thấy
Ngữ pháp 1: 最 + tính từ
Giải thích gốc từ Hanzii: Câu này là văn bản nguồn dài cần bị loại khỏi blueprint.
Ví dụ gốc Hanzii: 我最喜欢去海边旅游。
"""
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            raw_file = tmp_path / "raw-hanzii.md"
            raw_file.write_text(raw_md, encoding="utf-8")
            out_dir = tmp_path / "out"
            bp, snap = pipeline.extract_blueprint_from_raw(raw_file, out_dir, hsk=2, lesson_id="standard-2-01")

            self.assertEqual(bp["id"], "standard-2-01")
            self.assertEqual(bp["hsk"], 2)
            self.assertEqual([w["han"] for w in bp["vocabulary"]], ["旅游", "觉得"])
            self.assertEqual(len(bp["grammarPoints"]), 1)

            bp_text = (out_dir / "blueprint.json").read_text(encoding="utf-8")
            prompt_text = (out_dir / "authoring-prompt.md").read_text(encoding="utf-8")
            self.assertNotIn("我最喜欢去海边旅游", bp_text)
            self.assertNotIn("văn bản nguồn dài cần bị loại", bp_text)
            self.assertNotIn("我最喜欢去海边旅游", prompt_text)
            self.assertIn("我最喜欢去海边旅游", snap["rawText"])


if __name__ == "__main__":
    unittest.main()
