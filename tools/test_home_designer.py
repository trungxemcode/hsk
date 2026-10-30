import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import threading
import unittest
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('designer', ROOT / 'tools/serve-home-designer.py')
M = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(M)
SCHEMA = json.loads((ROOT / 'tools/home-designer/schema.json').read_text())


def config():
    return {'schema': 1, 'page': 'home', 'styles': {'desktop': {}, 'mobile': {}}, 'order': copy.deepcopy(SCHEMA['groups'])}


class DesignerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / 'tools/home-designer').mkdir(parents=True)
        (self.root / 'tools/home-designer/schema.json').write_text(json.dumps(SCHEMA))
        (self.root / 'app-version.json').write_text('{"release":"test"}')
        self.html = '<html><head><script src="app.js"></script></head><body><button id="keep" onclick="run()">Go</button></body></html>'
        (self.root / 'index.html').write_text(self.html)

    def tearDown(self):
        self.temp.cleanup()

    def test_only_managed_files_change_and_repeated_apply_is_idempotent(self):
        (self.root / 'tools/pwa-assets.json').write_text('{"files":["app.js"],"aliases":{}}')
        c = config()
        c['styles']['desktop']['word-heading'] = {'fontSize': 28}
        (self.root / 'app.js').write_text('window.run=()=>42;')
        M.apply_config(self.root, SCHEMA, c)
        self.assertEqual(json.loads((self.root / 'tools/pwa-assets.json').read_text())['files'], ['app.js', 'home-design.css'])
        html = (self.root / 'index.html').read_text()
        self.assertEqual(html.count('href="./home-design.css"'), 1)
        self.assertIn('<button id="keep" onclick="run()">', html)
        self.assertIn('<script src="app.js"></script>', html)
        self.assertEqual((self.root / 'app.js').read_text(), 'window.run=()=>42;')
        M.apply_config(self.root, SCHEMA, c)
        self.assertEqual((self.root / 'index.html').read_text(), html)
        broken = config()
        broken['styles']['desktop']['word-heading'] = {'color': 'url(https://bad.example)'}
        before = {p.name: p.read_bytes() for p in self.root.glob('*') if p.is_file()}
        with self.assertRaises(ValueError):
            M.apply_config(self.root, SCHEMA, broken)
        self.assertEqual(before, {p.name: p.read_bytes() for p in self.root.glob('*') if p.is_file()})

    def test_legacy_home_apply_preserves_other_pages(self):
        bundle = M.empty_project(SCHEMA)
        bundle['pages']['quiz']['components']['title'] = {'selector': '#quizTitle', 'label': 'Câu hỏi'}
        bundle['pages']['quiz']['styles']['desktop']['title'] = {'fontSize': 30}
        M.apply_config(self.root, SCHEMA, bundle)
        home = config()
        home['styles']['mobile']['word-heading'] = {'fontSize': 21}
        M.apply_config(self.root, SCHEMA, home)
        saved = json.loads((self.root / 'home-design.json').read_text())
        self.assertEqual(saved['pages']['quiz']['styles']['desktop']['title']['fontSize'], 30)
        self.assertEqual(saved['pages']['home']['styles']['mobile']['word-heading']['fontSize'], 21)

    def test_local_writer_requires_same_origin_token_and_rejects_path_escape(self):
        server = M.make_server(self.root, 0)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        url = 'http://127.0.0.1:' + str(server.server_port)
        try:
            state = json.load(urllib.request.urlopen(url + '/__designer/state'))
            for headers in [{}, {'Origin': 'https://elsewhere.example', 'X-HSK-Designer-Token': state['token']}]:
                request = urllib.request.Request(url + '/__designer/apply', data=json.dumps(config()).encode(), headers=headers)
                with self.assertRaises(urllib.error.HTTPError) as error:
                    urllib.request.urlopen(request)
                self.assertEqual(error.exception.code, 403)
            headers = {'Origin': url, 'X-HSK-Designer-Token': state['token'], 'Content-Type': 'application/json'}
            request = urllib.request.Request(url + '/__designer/apply', data=json.dumps(config()).encode(), headers=headers)
            self.assertTrue(json.load(urllib.request.urlopen(request))['ok'])
            (self.root / '.env').write_text('private')
            with self.assertRaises(urllib.error.HTTPError):
                urllib.request.urlopen(url + '/.env')
            self.assertEqual(json.load(urllib.request.urlopen(url + '/account-config.json')), {'enabled': False})
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == '__main__':
    unittest.main()
