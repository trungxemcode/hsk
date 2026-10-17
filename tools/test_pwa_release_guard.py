import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'tools' / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


guard = load('pwa_guard_tested', 'check-pwa-release.py')
live = load('pwa_live_tested', 'verify-live-pwa.py')
prepare = load('pwa_prepare_tested', 'prepare-pwa-release.py')


class PwaReleaseGuardTests(unittest.TestCase):
    def test_next_patch_release_helper(self):
        self.assertEqual(prepare.next_release('3.3.6', 'patch'), '3.3.7')
        self.assertEqual(prepare.next_release('3.3.6', 'minor'), '3.4.1')
        with self.assertRaises(ValueError):
            prepare.next_release('3.3', 'patch')

    def test_actual_checkout_is_consistent(self):
        data = guard.ensure_release_integrity()
        self.assertGreaterEqual(len(data['assets']), 150)
        self.assertEqual(data['version'], 'hsk-offline-3-3-6')

    def test_assets_classify_ui_and_backend(self):
        names = set(guard.ensure_release_integrity()['assets'])
        self.assertTrue(guard.is_client_change('index.html', names))
        self.assertTrue(guard.is_client_change('real-reading.js', names))
        self.assertTrue(guard.is_client_change('fresh-client-feature.js', names))
        self.assertFalse(guard.is_client_change('server/reading-service.mjs', names))
        self.assertFalse(guard.is_client_change('docs/ai/TASK_STATE.md', names))
        self.assertFalse(guard.is_client_change('.github/workflows/pwa-release-guard.yml', names))

    def test_unversioned_frontend_change_is_rejected(self):
        current = guard.ensure_release_integrity()
        previous = {'version': current['version'], 'release': current['release'],
                    'assets': current['assets']}
        calls = [json.dumps(previous), 'index.html']
        with patch.object(guard, '_run', side_effect=calls):
            with self.assertRaisesRegex(ValueError, 'FRONTEND CHANGED WITHOUT PWA'):
                guard.compare_with_base('old-head', current)

    def test_backend_only_push_does_not_force_ios_download(self):
        current = guard.ensure_release_integrity()
        previous = {'version': current['version'], 'release': current['release'],
                    'assets': current['assets']}
        calls = [json.dumps(previous), 'server/reading-service.mjs\nserver/translator-worker.mjs']
        with patch.object(guard, '_run', side_effect=calls):
            self.assertEqual(guard.compare_with_base('old-head', current), [])

    def test_new_release_allows_frontend_update(self):
        current = guard.ensure_release_integrity()
        previous = {'version': 'hsk-offline-3-3-5', 'release': '3.3.5',
                    'assets': current['assets']}
        with patch.object(guard, '_run', side_effect=[json.dumps(previous), 'index.html']):
            self.assertEqual(guard.compare_with_base('old-head', current), ['index.html'])

    def test_version_without_new_semantic_release_is_rejected(self):
        current = guard.ensure_release_integrity()
        previous = {'version': 'hsk-offline-3-3-5', 'release': current['release'],
                    'assets': current['assets']}
        with patch.object(guard, '_run', side_effect=[json.dumps(previous), 'index.html']):
            with self.assertRaisesRegex(ValueError, 'new release'):
                guard.compare_with_base('old-head', current)

    def test_hash_mismatch_caught_with_single_changed_asset(self):
        current = guard.ensure_release_integrity()
        with patch.object(guard, 'source_assets', return_value=['index.html']):
            with self.assertRaisesRegex(ValueError, 'Manifest assets'):
                guard.ensure_release_integrity()

    def test_public_verifier_rejects_stale_deployment(self):
        current = guard.ensure_release_integrity()
        with self.assertRaisesRegex(ValueError, 'Stale public PWA version'):
            live.inspect(live.DEFAULT_SITE, current,
                         lambda url: json.dumps({'version': 'hsk-offline-3-3-3'}).encode())

    def test_public_verifier_accepts_identical_assets(self):
        current = guard.ensure_release_integrity()
        def mock_site(url):
            if 'app-version.json' in url:
                return json.dumps(current).encode()
            name = url.split('?')[0].rsplit('/', 1)[-1]
            return (ROOT / name).read_bytes()
        self.assertEqual(live.inspect(live.DEFAULT_SITE, current, mock_site),
                         current['version'])

    def test_public_verifier_detects_partial_pages_deployment(self):
        current = guard.ensure_release_integrity()
        def partial(url):
            if 'app-version.json' in url:
                return json.dumps(current).encode()
            name = url.split('?')[0].rsplit('/', 1)[-1]
            if name == 'offline-worker.js':
                return b'old cached worker'
            return (ROOT / name).read_bytes()
        with self.assertRaisesRegex(ValueError, 'Public Pages asset out of sync'):
            live.inspect(live.DEFAULT_SITE, current, partial)


if __name__ == '__main__':
    unittest.main()
