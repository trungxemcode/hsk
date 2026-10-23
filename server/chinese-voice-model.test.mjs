import test from 'node:test';
import assert from 'node:assert/strict';
import model from '../src/modules/speech/voice-model.js';
// Independent ONNX Python serialization: FP16 weights + Cast + input/output types.
const source=Buffer.from('CAoSGGluZGVwZW5kZW50IHRlc3QgZml4dHVyZTpgChcKAXgSAXkiBENhc3QqCQoCdG8YCqABAhIKaGFsZiBtb2RlbCoXCAQQCkIHd2VpZ2h0c0oIAAAAOADA/3taDwoBeBIKCggIChIECgIIBGIPCgF5EgoKCAgKEgQKAggEQgIQFg==','base64'),expected=Buffer.from('CAoSGGluZGVwZW5kZW50IHRlc3QgZml4dHVyZTpoChcKAXgSAXkiBENhc3QqCQoCdG8YAaABAhIKaGFsZiBtb2RlbCofCAQQAUIHd2VpZ2h0c0oQAAAAAAAAAD8AAADAAOB/R1oPCgF4EgoKCAgBEgQKAggEYg8KAXkSCgoICAESBAoCCARCAhAW','base64');
test('expands a valid half model into the independently generated FP32 model',()=>{assert.deepEqual(Buffer.from(model.expand(source)),expected);assert.deepEqual(Buffer.from(model.expand(expected)),expected,'FP32 graph remains unchanged');});
test('adds speaker metadata without changing the expanded graph',()=>{const metadata=Buffer.from([114,6,10,1,97,18,1,98]);assert.deepEqual(Buffer.from(model.expand(source,metadata)),Buffer.concat([expected,metadata]));});
test('rejects truncated protobuf before touching the original model',()=>{assert.throws(()=>model.expand(source.subarray(0,source.length-1)));assert.throws(()=>model.expand(Uint8Array.from([58,255])));});
