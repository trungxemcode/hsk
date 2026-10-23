# Optional Chinese TTS runtime and model sources

These files are **not** part of the initial PWA download. They are fetched only
when a user selects an extended voice. Model/voice weights are fetched directly
from the pinned Hugging Face URLs in `voice-catalog.json`, verified by byte count
and SHA-256, and stored locally. No text is sent to a synthesis service.

## Runtime source and redistribution

- Sherpa-ONNX v1.13.8: https://github.com/k2-fsa/sherpa-onnx/tree/v1.13.8
- Original binary release:
  https://github.com/k2-fsa/sherpa-onnx/releases/download/v1.13.8/sherpa-onnx-wasm-simd-1.13.8-kokoro-multi-lang-v1_0.tar.bz2
- Original archive SHA-256: `39180cc8851bc5c4a2b8f47e2546b31f58704169421fd2e2dc06c459b7d367e7`.
- Build entry point: `build-wasm-simd-tts.sh` in that tag. The corresponding
  `cmake/` files identify every linked dependency and its pinned source archive;
  `.github/workflows/` records the upstream build environment.
- Piper phonemize source:
  https://github.com/csukuangfj/piper-phonemize/tree/f3ff95afc03640bc1399e113e83361192a2fafb4
- eSpeak-NG source:
  https://github.com/csukuangfj/espeak-ng/tree/ed530aa113046142eb5115cf2fc9157854d0ffe1
- ONNX Runtime SIMD prebuilt dependency v1.28.2 is pinned by Sherpa's
  `cmake/onnxruntime-wasm-simd.cmake`.

The WASM binary is unchanged, gzip-compressed with mtime=0. The loader has exactly
two changes, reproducible with `tools/build-chinese-voice-runtime.py`: remove the
380 MB automatic `.data` preload, and expose the existing MEMFS as `Module.FS`.
`bindings.js` is copied unchanged. Model resources are repacked losslessly as
base64 JSON + gzip; only Chinese/English eSpeak resources are included.

Sherpa is Apache-2.0; Piper phonemize and ONNX Runtime are MIT; **eSpeak-NG and its
data are GPL-3.0-or-later**. This combined runtime includes GPL components; do not
represent it as an Apache-only binary. Accompanying license texts are retained
here. The source/build links above cover the unmodified binary and its pinned
transitive dependencies; this repository supplies the loader changes and all
app-side glue. Preserve these notices and source access when redistributing.

## Pinned neural model and voices

- Model: `onnx-community/Kokoro-82M-v1.0-ONNX`, revision
  `1939ad2a8e416c0acfeecc08a694d14ef25f2231`, `onnx/model_fp16.onnx`.
- Voice tensors: `hexgrad/Kokoro-82M`, revision
  `f3ff3571791e39611d31c381e3a41a3af07b4987`, eight `voices/z*.pt` files.
  Only the selected tensor is downloaded. ZIP parsing reads the stored
  `data/0` tensor bytes; Python pickle is never executed in the app.
- Chinese tokens/lexicon: `csukuangfj/kokoro-int8-multi-lang-v1_0`, revision
  `2a360693d79b88b49b88e29aec2b53577f41f206`.
- Normalization FSTs and reduced eSpeak resources:
  `csukuangfj/kokoro-int8-multi-lang-v1_1`, revision
  `155831f1b4ba23b1f5c058be6a61df90cefb2a37`.
- Kokoro model/voices: Apache-2.0 per the publisher's model card:
  https://huggingface.co/hexgrad/Kokoro-82M/tree/f3ff3571791e39611d31c381e3a41a3af07b4987

All asset sizes and SHA-256 values are in the catalog. The first selected voice
requires about 162 MiB; another voice reuses the model/runtime and downloads about
0.5 MiB. The compact FP16 model stays on disk. On initialization the worker
expands weights, graph types, and Cast operations to FP32 and appends Sherpa
metadata for one speaker. This avoids non-finite samples found in real browser
inference with the int8 and direct FP16 paths. Inference therefore needs much more
RAM than the on-disk size; successful use on old iPhones is not guaranteed.
Device speech remains the default. There is no academic/HSK certification claim.

## Reproduce

1. Download/extract the pinned runtime archive above.
2. Download the listed lexicon/tokens, three FSTs, the eight eSpeak files named in
   `tools/build-chinese-voice-runtime.py`, model, and eight `.pt` files.
   Save the model as `model.web-fp16.onnx`; preserve resource paths.
3. Create `voice-hashes.json` as `[id, bytes, sha256]` rows for the eight voice
   files (catalog values provide the expected values).
4. Run `python tools/build-chinese-voice-runtime.py RUNTIME_DIR RESOURCE_DIR`.
   The result is deterministic; compare the regenerated catalog/hashes.
5. Run `HSK_CHINESE_VOICE_FIXTURE=RESOURCE_DIR node tools/check-chinese-voice-runtime.cjs`
   with Playwright and `CHROME_EXECUTABLE` when needed. This uses real local
   weights and checks finite, non-silent PCM for all eight voices, dates and
   several sentence lengths. It does not claim listening validation or iOS QA.
