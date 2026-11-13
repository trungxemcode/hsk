import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

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

    def test_accepts_crlf_local_vs_lf_live_for_text_assets(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            designer_dir = root / 'tools/home-designer'
            designer_dir.mkdir(parents=True)
            (root / 'app-version.json').write_bytes(b'{\r\n  "release": "4.1.9"\r\n}\r\n')
            (designer_dir / 'bridge.js').write_bytes(b'const a = 1;\r\nconst b = 2;\r\n')
            (designer_dir / 'editor.html').write_bytes(b'<div>\r\n  hi\r\n</div>\r\n')

            def fetch(path):
                if path == '/__designer/state':
                    return b'{"release":"4.1.9"}'
                return (root / path.lstrip('/')).read_bytes().replace(b'\r\n', b'\n')

            with mock.patch.object(module, 'ROOT', root):
                release, count = module.verify(fetch)
            self.assertEqual(release, '4.1.9')
            self.assertEqual(count, 3)

    def test_rejects_non_eol_source_change_even_when_eol_differs(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            designer_dir = root / 'tools/home-designer'
            designer_dir.mkdir(parents=True)
            (root / 'app-version.json').write_bytes(b'{\r\n  "release": "4.1.9"\r\n}\r\n')
            (designer_dir / 'bridge.js').write_bytes(b'const a = 1;\r\nconst b = 2;\r\n')

            def fetch(path):
                if path == '/__designer/state':
                    return b'{"release":"4.1.9"}'
                if path == '/tools/home-designer/bridge.js':
                    return b'const a = 1;\nconst b = 3;\n'
                return (root / path.lstrip('/')).read_bytes().replace(b'\r\n', b'\n')

            with mock.patch.object(module, 'ROOT', root):
                with self.assertRaisesRegex(ValueError, 'bridge.js'):
                    module.verify(fetch)

    def test_rejects_binary_asset_with_crlf_vs_lf_difference(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            designer_dir = root / 'tools/home-designer'
            designer_dir.mkdir(parents=True)
            (root / 'app-version.json').write_bytes(b'{"release":"4.1.9"}\n')
            (designer_dir / 'icon.png').write_bytes(b'\x89PNG\r\n\x1a\n\x00\r\n')

            def fetch(path):
                if path == '/__designer/state':
                    return b'{"release":"4.1.9"}'
                if path == '/tools/home-designer/icon.png':
                    return b'\x89PNG\n\x1a\n\x00\n'
                return (root / path.lstrip('/')).read_bytes()

            with mock.patch.object(module, 'ROOT', root):
                with self.assertRaisesRegex(ValueError, 'icon.png'):
                    module.verify(fetch)
