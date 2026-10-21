"""Catalog failures must stop a build before shipping broken offline paths."""
import gzip
import json
from pathlib import Path
import tempfile
import unittest
from pwa_assets import collect_assets, read_catalog


class CatalogTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / 'tools').mkdir()
        self.catalog = {'schema': 1, 'files': ['index.html', 'data.js', 'data.js.gz'], 'aliases': {}}
        (self.root / 'index.html').write_text('<html></html>')
        (self.root / 'data.js').write_bytes(b'const data=[];')
        (self.root / 'data.js.gz').write_bytes(gzip.compress(b'const data=[];'))
        (self.root / 'loader.js').write_text("const names=['data'];")
        (self.root / 'drive-audio-data.json').write_text(json.dumps({'items': [{'audioFile': 'content/audio.mp3'}]}))
        (self.root / 'drive-exam-data.json.gz').write_bytes(gzip.compress(json.dumps({'report': {'images': ['path/H10001-01.png']}}).encode()))
        (self.root / 'content/drive-hsk').mkdir(parents=True)
        (self.root / 'content/audio.mp3').write_bytes(b'audio')
        (self.root / 'content/drive-hsk/H10001.json').write_text('{}')
        self.save()

    def save(self):
        (self.root / 'tools/pwa-assets.json').write_text(json.dumps(self.catalog))

    def test_static_and_derived_paths_remain_deterministic(self):
        self.assertEqual(collect_assets(self.root), self.catalog['files'] +
                         ['content/audio.mp3', 'content/drive-hsk/H10001.json'])

    def test_missing_file_stops_build(self):
        (self.root / 'data.js').unlink()
        with self.assertRaisesRegex(ValueError, 'Missing or unsafe'): collect_assets(self.root)

    def test_duplicate_assets_rejected(self):
        self.catalog['files'].append('index.html'); self.save()
        with self.assertRaisesRegex(ValueError, 'Duplicate'): read_catalog(self.root)

    def test_unsafe_paths_rejected(self):
        for name in ['../private', '/root.js', 'a/../b', 'a\\b', 'a//b', 'x?y', 'https://x']:
            with self.subTest(name=name):
                self.catalog['files'] = [name]; self.save()
                with self.assertRaisesRegex(ValueError, 'Unsafe'): read_catalog(self.root)

    def test_missing_compressed_or_fallback_variant_rejected(self):
        for name in ['data.js', 'data.js.gz']:
            with self.subTest(name=name):
                self.catalog['files'] = ['index.html', 'data.js', 'data.js.gz']
                self.catalog['files'].remove(name); self.save()
                with self.assertRaisesRegex(ValueError, 'Missing loader data variant'): collect_assets(self.root)

    def test_stale_compressed_data_rejected(self):
        (self.root / 'data.js.gz').write_bytes(gzip.compress(b'old data'))
        with self.assertRaisesRegex(ValueError, 'Compressed loader data differs'): collect_assets(self.root)

    def test_retired_url_can_resolve_directly_to_new_asset(self):
        self.catalog['aliases'] = {'old.js': 'data.js'}; self.save()
        self.assertEqual(read_catalog(self.root)['aliases']['old.js'], 'data.js')

    def test_alias_missing_target_cycle_and_shadowing_rejected(self):
        for aliases in [{'old.js': 'missing.js'}, {'index.html': 'data.js'},
                        {'old.js': 'other.js', 'other.js': 'data.js'}, {'old.js': 'old.js'}]:
            with self.subTest(aliases=aliases):
                self.catalog['aliases'] = aliases; self.save()
                with self.assertRaisesRegex(ValueError, 'PWA alias'): read_catalog(self.root)

    def test_missing_derived_audio_rejected(self):
        (self.root / 'content/audio.mp3').unlink()
        with self.assertRaisesRegex(ValueError, 'Missing or unsafe'): collect_assets(self.root)
