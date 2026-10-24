import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('Online resolver authenticates and preserves exact source without media storage',()=>{
 const r=spawnSync('python3',['tools/check-music-online-resolver.py'],{encoding:'utf8'});
 assert.equal(r.status,0,r.stdout+r.stderr);
});
