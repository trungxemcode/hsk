import importlib.util
import json
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('verify_editor', Path(__file__).with_name('verify-live-design-editor.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class DeploymentVerification(unittest.TestCase):
    def fetch(self, path):
        if path == '/__designer/state':
            return json.dumps({'release': json.loads((module.ROOT / 'app-version.json').read_text())['release']}).encode()
        return (module.ROOT / path.lstrip('/')).read_bytes()

    def test_matching_release_and_all_editor_files(self):
        release, count = module.verify(self.fetch)
        self.assertTrue(release)
        self.assertGreater(count, 5)

    def test_rejects_stale_release(self):
        def fetch(path):
            return b'{"release":"old"}' if path == '/__designer/state' else self.fetch(path)
        with self.assertRaisesRegex(ValueError, 'release differs'):
            module.verify(fetch)

    def test_rejects_stale_asset_even_with_correct_release(self):
        def fetch(path):
            return b'old editor' if path.endswith('/editor.js') else self.fetch(path)
        with self.assertRaisesRegex(ValueError, 'editor.js'):
            module.verify(fetch)
