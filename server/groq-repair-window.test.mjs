import test from 'node:test';
import assert from 'node:assert/strict';
import {repairSearchWindow} from './music/groq-alignment.mjs';
test('collapsed observed anchors expand only the recognition search region',()=>{assert.deepEqual(repairSearchWindow({start:127.27869,end:127.27869,cue:19},210.12),{start:102.27869,end:127.27869+25,cue:19});assert.deepEqual(repairSearchWindow({start:0,end:0},8),{start:0,end:8});assert.deepEqual(repairSearchWindow({start:3,end:6},8),{start:3,end:6});assert.equal(repairSearchWindow({start:NaN,end:1},8),null);});
