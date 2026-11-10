import importlib.util
import unittest
import io
from pathlib import Path
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


    def test_waits_for_matching_live_release_before_notifying(self):
        old = io.BytesIO(b'{"version":"previous"}')
        current = io.BytesIO(b'{"version":"v2"}')
        with (
            mock.patch.object(notify.urllib.request, 'urlopen', side_effect=[old, current]) as request,
            mock.patch.object(notify.time, 'sleep') as pause,
        ):
            notify.wait_for_live_version('v2')
        self.assertEqual(request.call_count, 2)
        pause.assert_called_once_with(notify.PAGES_DEPLOY_POLL_SECONDS)
        first = request.call_args_list[0].args[0]
        second = request.call_args_list[1].args[0]
        self.assertNotEqual(first.full_url, second.full_url)

    def test_stale_release_never_passes_and_wait_budget_is_bounded(self):
        clock = [0.0]
        def fake_sleep(duration):
            clock[0] += duration
        with (
            mock.patch.object(notify.time, 'monotonic', side_effect=lambda: clock[0]),
            mock.patch.object(notify.time, 'sleep', side_effect=fake_sleep),
            mock.patch.object(notify.urllib.request, 'urlopen',
                              side_effect=lambda *args, **kwargs: io.BytesIO(b'{"version":"previous"}')) as request,
        ):
            with self.assertRaisesRegex(SystemExit, 'Live version differs'):
                notify.wait_for_live_version('v2')
        self.assertEqual(clock[0], notify.PAGES_DEPLOY_WAIT_BUDGET_SECONDS)
        self.assertGreater(request.call_count, 12)
        self.assertLessEqual(request.call_count, notify.PAGES_DEPLOY_WAIT_BUDGET_SECONDS // notify.PAGES_DEPLOY_POLL_SECONDS + 1)

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
        # Keep enough startup/send time within the workflow deadline, even if
        # GitHub Pages deployment needs an extended wait.
        self.assertGreaterEqual(notify.PAGES_DEPLOY_WAIT_BUDGET_SECONDS, 230)
        workflow = Path('.github/workflows/update-notifications.yml').read_text()
        self.assertIn('timeout-minutes: 10', workflow)
        self.assertLessEqual(notify.PAGES_DEPLOY_WAIT_BUDGET_SECONDS, 10 * 60 - 60)
