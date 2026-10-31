"""Regression tests for hot-swappable Study4 R2 catalogs."""
import gzip
import importlib.util
import json
import pathlib
import tempfile
import unittest

PUBLISHER = pathlib.Path(__file__).with_name('publish-study4-cloud.py')
spec = importlib.util.spec_from_file_location('study4_publisher', PUBLISHER)
publisher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publisher)


class Study4CloudPublishTests(unittest.TestCase):
    def test_updates_payload_and_only_rewrites_mirrored_audio(self):
        source = 'https://s4-media1.study4.com/audio/first.mp3'
        another = 'https://s4-media1.study4.com/audio/second.mp3'
        catalog = {'schema': 1, 'tests': [{'id': '123', 'level': 1, 'parts': [{'audio': source, 'groups': [{'questions': [{'audio': another}]}]}]}]}
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / 'exams.json.gz'
            path.write_bytes(gzip.compress(json.dumps(catalog).encode()))
            data, manifest, rewritten = publisher.build_catalog(path, {source: publisher.PUBLIC_BASE + '/study4/audio/' + 'a'*64 + '.mp3'})
        out = json.loads(gzip.decompress(data))
        self.assertEqual(manifest['tests'], 1)
        self.assertEqual(manifest['sha256'], manifest['version'])
        self.assertEqual(rewritten, 1)
        self.assertTrue(out['tests'][0]['parts'][0]['audio'].startswith(publisher.PUBLIC_BASE))
        self.assertEqual(out['tests'][0]['parts'][0]['groups'][0]['questions'][0]['audio'], another)

    def test_invalid_or_duplicate_exams_fail_before_r2_manifest_can_change(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / 'bad.json.gz'
            for data in ({'tests': []}, {'tests': [{'id': '1', 'level': 1, 'parts': []}, {'id': '1', 'level': 2, 'parts': []}]}):
                path.write_bytes(gzip.compress(json.dumps(data).encode()))
                with self.assertRaises(ValueError):
                    publisher.build_catalog(path)


if __name__ == '__main__':
    unittest.main()
