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

## Current independent small model

- Quantized Huayan medium model and original Piper config:
  `IhorShevchuk/piper1-voices-fp16-quantized`, revision
  `7fb50e46b26367633c599b9da5128fd2883ef3e7`, files
  `zh/zh_CN/huayan/medium/zh_CN-huayan-medium.int8.onnx` and
  `zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx.json`.
- This source is the publisher of the conversion; the upstream Piper model is
  `rhasspy/piper-voices`, revision `5041a7a49ae5b3a0f30e6837769eb03fdbb231bd`.
  Its Huayan model card identifies the dataset as PlayVoice/HuaYan_TTS and lists
  the dataset license as Unknown. Do not invent an Apache/CC0 grant for Huayan
  from the separate Kokoro license. Preserve upstream notices and attribution.
- `huayan-medium.json` contains the original phoneme map rendered as Sherpa tokens
  and minimal VITS metadata. The model is unmodified on disk; on initialization,
  FP16 types are expanded to FP32 and metadata appended. Quantized parameters
  remain quantized. Real WASM inference is checked before default replacement.
- `piper-resources.json.gz` is a lossless subset of the legacy resources below,
  retaining only the eight eSpeak files required by the Chinese/English frontend.
  Common runtime/resources total ~4.9 MiB; Huayan model/config ~17.8 MiB.
  Unlike Kokoro, the common runtime contains no neural weights.

## Small prerecorded auditions

`content/voice-demos/*.mp3` are generated locally with these pinned models,
using the phrase `你好，欢迎学习中文。`, encoded mono MP3 at 24 kbit/s / 24 kHz.
All nine combined fit 0.1 MiB; exact size/hash is recorded per catalog entry.
No synthesis API or quota is used to audition: playback is of the recorded clip.
Auditions are PWA assets; full models/runtimes are not.

## Legacy Kokoro compatibility

The eight Kokoro entries are demo-only for new installations. Existing stored
Kokoro blobs still play, so users can replace/remove them without losing access.
These sources are retained for reproducibility, not advertised as small packs:

- `onnx-community/Kokoro-82M-v1.0-ONNX`, revision
  `1939ad2a8e416c0acfeecc08a694d14ef25f2231`, `onnx/model_fp16.onnx`.
- Voice tensors: `hexgrad/Kokoro-82M`, revision
  `f3ff3571791e39611d31c381e3a41a3af07b4987`, eight `voices/z*.pt` files;
  Apache-2.0 per the publisher model card. ZIP reads only stored `data/0` tensor
  bytes; the app never executes pickle.
- Tokens/lexicon: `csukuangfj/kokoro-int8-multi-lang-v1_0`, revision
  `2a360693d79b88b49b88e29aec2b53577f41f206`.
- FSTs and eSpeak files: `csukuangfj/kokoro-int8-multi-lang-v1_1`, revision
  `155831f1b4ba23b1f5c058be6a61df90cefb2a37`.
- The ~162 MiB first download was mostly a shared neural model. It is not eight
  separable 20 MiB models. No such size claim is made in the app.

## Reproduce current catalog

1. Runtime provenance/build is above. The unchanged WASM and bindings remain
   those of v1.13.8; the loader modifications remain the same two changes.
2. Download the pinned Huayan model/config as `huayan.onnx` and
   `huayan-config.json` in a fixture directory. The existing catalog contains
   expected hashes; do not silently update them to unverified upstream files.
3. Run `python tools/prepare-light-chinese-voices.py FIXTURE_DIR`. This rebuilds
   the small resource bundle/config/catalog and hashes the checked-in auditions.
4. For a full legacy runtime rebuild, first follow
   `tools/build-chinese-voice-runtime.py` with its pinned inputs, then run the
   lightweight preparation script. The latter replaces the large catalog policy.
5. For actual WASM checks, also name/symlink the model using its upstream basename
   `zh_CN-huayan-medium.int8.onnx`, then run
   `HSK_CHINESE_VOICE_FIXTURE=FIXTURE_DIR node tools/check-chinese-voice-runtime.cjs`
   with Playwright and `CHROME_EXECUTABLE` when needed. This checks finite PCM,
   not subjective listening quality or real-iPhone behavior.
