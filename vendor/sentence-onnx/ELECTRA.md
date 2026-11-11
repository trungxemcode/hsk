# Optional ELECTRA trial package

The 103,137,607-byte `HSK_ELECTRA_INT8_Experimental.hskmodel` is adapted from
[xurong123/ChineseErrorDetectorElectra](https://huggingface.co/xurong123/ChineseErrorDetectorElectra/tree/b58d6bdbc60b4f308352ff7c87a8dd419c4019be)
under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0).
Upstream weights are not committed or delivered with this app.

Modifications: the token classification network was exported to ONNX opset 17,
its matrix weights dynamically quantized to INT8 per channel, and the token
embedding table quantized to INT8 per row and stored alongside the graph and
original vocabulary. The client expands only the needed embedding rows.
The model labels potential mistakes; it does not generate replacements.
The experimental 0.90 threshold is a score cutoff, not a calibrated accuracy claim.

Export with Python 3.12, NumPy 2.5.4, CPU PyTorch 2.6.0, transformers 4.51.3,
ONNX 1.18.0 and ONNX Runtime 1.22.1:

```sh
python tools/export-sentence-electra.py /path/to/pinned-snapshot /path/to/output
```

The trial client pins the package SHA-256
`72a744229e20e7b9b16922aee39e8cd52e08e9e3114bc0203de8d336b9d5634b`.
Reverify artifacts when rebuilding with different export tooling. Use the
[training entry](../../tools/sentence-training/README.md) to train and evaluate
candidates separately from the production editor.
