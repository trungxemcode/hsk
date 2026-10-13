import importlib.util
import unittest
spec = importlib.util.spec_from_file_location('notify', 'send-update-notification.py')
notify = importlib.util.module_from_spec(spec)
spec.loader.exec_module(notify)

class UpdatePushTests(unittest.TestCase):
    def test_release_deduplication_and_consent(self):
        a = notify.payload('app', {'version': 'v1', 'label': 'v1'})
        b = notify.payload('app', {'version': 'v2', 'label': 'v2'})
        self.assertEqual(a, notify.payload('app', {'version': 'v1', 'label': 'v1'}))
        self.assertNotEqual(a['idempotency_key'], b['idempotency_key'])
        self.assertEqual(a['filters'][0]['key'], 'hsk_update_on')
        self.assertEqual(a['filters'][0]['value'], '1')
        self.assertTrue(a['url'].endswith('?update=1'))
