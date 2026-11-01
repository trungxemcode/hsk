import importlib.util
import unittest
from unittest import mock
from urllib.parse import urlsplit, parse_qs
spec = importlib.util.spec_from_file_location('notify', 'send-update-notification.py')
notify = importlib.util.module_from_spec(spec)
spec.loader.exec_module(notify)

class UpdatePushTests(unittest.TestCase):
    def test_readable_release_name_is_not_prefixed_twice(self):
        result = notify.payload('app', {'version': 'hsk-offline-r2-01', 'label': 'Bản 2.01 (Thu gọn Luyện & Ôn)'})
        self.assertTrue(result['contents']['en'].startswith('Bản 2.01 (Thu gọn Luyện & Ôn) đã sẵn sàng.'))
        self.assertNotIn('Bản Bản', result['contents']['en'])

    def test_release_deduplication_and_consent(self):
        a = notify.payload('app', {'version': 'v1', 'label': 'v1'})
        b = notify.payload('app', {'version': 'v2', 'label': 'v2'})
        self.assertEqual(a, notify.payload('app', {'version': 'v1', 'label': 'v1'}))
        self.assertNotEqual(a['idempotency_key'], b['idempotency_key'])
        self.assertEqual(a['filters'][0]['key'], 'hsk_update_on')
        self.assertEqual(a['filters'][0]['value'], '1')
        self.assertTrue(a['url'].endswith('?update=1'))

    def test_live_deploy_check_busts_github_pages_cache(self):
        # GitHub Pages uses Cache-Control: max-age=600 for this manifest.
        with mock.patch.object(notify.time, 'time_ns', side_effect=[111, 222]):
            first = notify.live_manifest_url('hsk-offline-3-23-37', 0)
            second = notify.live_manifest_url('hsk-offline-3-23-37', 1)
        self.assertNotEqual(first, second)
        self.assertEqual(parse_qs(urlsplit(first).query)['release'], ['hsk-offline-3-23-37'])
        self.assertEqual(parse_qs(urlsplit(first).query)['attempt'], ['0'])
        self.assertEqual(parse_qs(urlsplit(second).query)['attempt'], ['1'])
        self.assertEqual(parse_qs(urlsplit(first).query)['probe'], ['111'])
        self.assertEqual(parse_qs(urlsplit(second).query)['probe'], ['222'])
        self.assertEqual(notify.PAGES_DEPLOY_ATTEMPTS, 12)
