# Yunjian ONNX lossless model transport — experimental (2026-10-23)

The user requires **zero audio-quality regression**, otherwise keep the original Yunjian package. This experiment is **not approved for a production model URL or merge**.

## Exact measurements (LAPTOP-FV84271N)

| Asset | Raw bytes | Lossless compressed bytes |
| --- | ---: | ---: |
| Kokoro `model_quantized.onnx` | 92,361,116 | Gzip-9: 63,949,949 |
| Same model, Brotli-9 | 92,361,116 | Brotli-9: 61,926,139 |
| Existing speaker + common runtime (unchanged) | 6,536,198 | 6,536,198 |
| **Whole first download via Gzip** | **98,897,314** | **70,486,147 (67.2 MiB)** |
| **Whole first download via Brotli** | **98,897,314** | **68,462,337 (65.3 MiB)** |

Original model SHA-256: `fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478`.
Gzip and Brotli both decompress to **exact original binary bytes**, SHA-256 matches. This is not another quantization run.

Live Chromium/Web Worker: Gzip decompression in browser took about 349–364 ms. Three Mandarin phrases generated from the original ONNX and the Gzip file inflated **inside `voice-pack-worker.js`** gave byte-identical PCM outputs, same duration, sample rate and hashes:
- `你好，欢迎学习中文。`: `100a3a02baf5...`, 59,739 samples each
- `今天是二〇二六年十月二十三日。`: `e5d0689a65c4...`, 75,372 samples each
- `我喜欢学习中文。`: `e472f9a644f1...`, 47,323 samples each

Gzip transport code keeps stored blob compressed until Web Worker initialization, and checks uncompressed model's size and SHA-256 before inference. Synthetic corrupt/wrong-size compressed inputs are rejected and raw legacy models still load. Production `voice-catalog.json` **still points at the original upstream ONNX**. No 60+ MB compressed model uploaded or distributed yet, and no other voice packs or user data have been modified.

## Compatibility & release gate

- Gzip via `DecompressionStream('gzip')` is already needed by this application's runtime and works in tested Chromium. Brotli `DecompressionStream('brotli')` was **not supported in tested Chromium**, so Brotli-only delivery would break those users; do not switch blindly.
- Actual on-device storage would fall to the compressed blob size *only after catalog points to a valid compressed URL and installer saves it*. During synthesis the model still expands in RAM, so lower download/storage size **does not imply lower RAM**.
- Remaining before approval: host files with browser-safe CORS, checksum-pin compressed URLs and test full real IndexedDB install/offline reload; validate iPhone Safari memory and playback in person. No merge to `main` before that verification. If any quality or stability regression emerges, retain the currently deployed raw model.
