"""Reproduce the local contextual ranker. Requires numpy, onnx and onnxruntime."""
import json
from pathlib import Path
import subprocess

import numpy as np
import onnx
from onnx import TensorProto, helper, numpy_helper
import onnxruntime as ort
from onnxruntime.quantization import QuantType, quantize_dynamic

root = Path(__file__).resolve().parent.parent
rows = json.loads(subprocess.check_output(["node", "tools/sentence-onnx-training.cjs"], cwd=root))
x = np.asarray([row[0] for row in rows], dtype=np.float32)
y = np.asarray([row[1] for row in rows], dtype=np.float32)[:, None]

# Fit a regularized logistic model. Normalizing dimensions is unnecessary:
# the shared encoder bounds both the count and magnitude of active features.
weights = np.zeros((x.shape[1], 1), dtype=np.float32)
bias = np.zeros(1, dtype=np.float32)
for _ in range(600):
    scores = x @ weights + bias
    error = 1 / (1 + np.exp(-scores)) - y
    weights -= 0.25 * (x.T @ error / len(x) + 0.001 * weights)
    bias -= 0.25 * error.mean(axis=0)

graph = helper.make_graph(
    [
        helper.make_node("MatMul", ["features", "weights"], ["linear"]),
        helper.make_node("Add", ["linear", "bias"], ["logits"]),
        helper.make_node("Sigmoid", ["logits"], ["accept"]),
    ],
    "HSK contextual candidate ranker",
    [helper.make_tensor_value_info("features", TensorProto.FLOAT, ["candidates", x.shape[1]])],
    [helper.make_tensor_value_info("accept", TensorProto.FLOAT, ["candidates", 1])],
    [numpy_helper.from_array(weights, "weights"), numpy_helper.from_array(bias, "bias")],
)
model = helper.make_model(graph, opset_imports=[helper.make_opsetid("", 13)], ir_version=8)
onnx.checker.check_model(model)
output = root / "vendor/sentence-onnx/grammar-lite-v1.onnx"
quantize_dynamic(model, output, weight_type=QuantType.QInt8)
options = ort.SessionOptions()
options.intra_op_num_threads = 1
session = ort.InferenceSession(str(output), sess_options=options, providers=["CPUExecutionProvider"])
scores = session.run(["accept"], {"features": x})[0]
print(f"{len(x)} synthetic candidate rows, {output.stat().st_size} bytes")
print(f"Training accuracy at 0.5: {np.mean((scores >= 0.5) == y):.1%}")
