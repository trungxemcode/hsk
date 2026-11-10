# ONNX Runtime Web assets

The runtime files come from the official npm package onnxruntime-web@1.22.0
(https://www.npmjs.com/package/onnxruntime-web/v/1.22.0), MIT license.
The WASM binary is compressed with gzip -n -9. The worker sets one inference
thread, and loads this WASM-only bundle after the user enables the feature.
The module loader resolves its fallback WASM URL against the Worker URL so it
can load from a blob on cached restarts. The Worker supplies the WASM bytes.

The local HSK ranker is trained by tools/train-sentence-onnx.py on the synthetic
cases in tools/sentence-onnx-training.cjs. The model uses the shared features
in src/modules/translation/sentence-onnx-core.js.
