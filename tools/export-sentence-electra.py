import argparse
import hashlib
import struct
from pathlib import Path
import numpy as np
import torch
from onnxruntime.quantization import QuantType, quantize_dynamic
from transformers import AutoModelForTokenClassification, AutoTokenizer

parser = argparse.ArgumentParser(description="Export the pinned Chinese ELECTRA token detector to the HSK trial package.")
parser.add_argument("weights", type=Path, help="Local directory of the pinned upstream model snapshot")
parser.add_argument("output", type=Path, help="Writable directory for ONNX intermediates and the trial package")
args = parser.parse_args()
root = args.output
root.mkdir(parents=True, exist_ok=True)
torch.set_num_threads(2)
model = AutoModelForTokenClassification.from_pretrained(args.weights, attn_implementation='eager').eval()
tokenizer = AutoTokenizer.from_pretrained(args.weights)
embedding = model.electra.embeddings.word_embeddings.weight.detach().numpy()
scales = np.maximum(np.abs(embedding).max(axis=1), 1e-8).astype('<f4') / 127
qembedding = np.rint(embedding / scales[:, None]).clip(-127,127).astype(np.int8)

class ExportDetector(torch.nn.Module):
    def __init__(self, electra):
        super().__init__()
        self.detector = electra
    def forward(self, embeddings, mask):
        return self.detector(inputs_embeds=embeddings, attention_mask=mask).logits

torch.onnx.export(
    ExportDetector(model), (torch.zeros(1, 32, embedding.shape[1]), torch.ones(1, 32, dtype=torch.int64)),
    root/'detector-fp32.onnx', input_names=['embeddings','attention_mask'], output_names=['logits'],
    dynamic_axes={'embeddings':{1:'tokens'},'attention_mask':{1:'tokens'},'logits':{1:'tokens'}},
    opset_version=17
)
quantize_dynamic(root/'detector-fp32.onnx',root/'detector-int8.onnx',weight_type=QuantType.QInt8,per_channel=True)
blob=(root/'detector-int8.onnx').read_bytes()
vocab=(args.weights/'vocab.txt').read_bytes()
pack=root/'HSK_ELECTRA_INT8_Experimental.hskmodel'
with pack.open('wb') as f:
    f.write(struct.pack('<8sIIII',b'HSKELC01',len(blob),embedding.shape[0],embedding.shape[1],len(vocab)))
    f.write(scales.tobytes())
    f.write(qembedding.tobytes())
    f.write(vocab)
    f.write(blob)
with pack.open('rb') as f:
    print(pack.stat().st_size, hashlib.file_digest(f, 'sha256').hexdigest(), flush=True)
