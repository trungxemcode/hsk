"""Ruleset setup must never rewrite another protection rule."""
import importlib.util
import json
import pathlib
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("ui_rules", ROOT / "tools/apply-ui-scope-ruleset.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class RulesetTest(unittest.TestCase):
    def run_case(self, rows, method, suffix):
        payload = json.loads((ROOT / ".github/ui-scope-ruleset.json").read_text())
        saved = dict(payload, id=123, node_id="additional GitHub response metadata")
        with patch.object(module.subprocess, "run"), patch.object(module, "api", side_effect=[rows, saved, saved]) as api:
            module.main()
        writes = [call for call in api.call_args_list if call.args[0] != "GET"]
        self.assertEqual(len(writes), 1)
        self.assertEqual(writes[0].args, (method, "repos/trungxemcode/hsk/rulesets" + suffix, payload))
        self.assertEqual(payload["bypass_actors"], [])
        self.assertEqual(payload["rules"][0]["parameters"]["required_status_checks"][0]["context"], "ui-outside-scope")

    def test_adds_separate_rule_preserving_existing_rules(self):
        self.run_case([{"id": 8, "name": "Existing feature protection"}], "POST", "")

    def test_updates_only_matching_rule(self):
        self.run_case([{"id": 8, "name": "Other"}, {"id": 123, "name": "Protect UI outside requested scope"}], "PUT", "/123")

    def test_duplicate_rules_fail_without_any_write(self):
        rows = [{"id": i, "name": "Protect UI outside requested scope"} for i in [1, 2]]
        with patch.object(module.subprocess, "run"), patch.object(module, "api", return_value=rows) as api:
            with self.assertRaises(RuntimeError):
                module.main()
            self.assertEqual(api.call_count, 1)


if __name__ == "__main__":
    unittest.main()
