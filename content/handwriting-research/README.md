# Handwriting recognition research — 2026-10-12

## Current evidence

`handwriting-data.json` contains one Make Me a Hanzi median-stroke template for each of the 2,603 distinct Han characters in the app's 5,011 vocabulary entries. Coverage is 2,603/2,603; this describes labels with templates, not recognition accuracy. The source is licensed under the Arphic Public License and its notice is shipped in `hanzi-data-APL.txt`.

The bitmap matcher is local, order independent, and returns at most 10 suggestions. The recorded geometric-fixture baseline is 17/40 top-1 and 27/40 top-10 on clean fixtures; 95/240 top-1 and 156/240 top-10 on controlled rough variants; 8/39 top-10 with the final stroke omitted. These are not samples from multiple human writers. `content/handwriting-evaluation.json` contains per-character and confusion-group counts. Do not present these figures as real-user accuracy.

An aspect-preserving crop was tested against the same fixture suite. It did not improve top-10 (27/40 clean, 147/240 rough), lowered top-1, and lowered missing-stroke top-10 to 6/39. That change was rejected; the matcher preprocessing remains unchanged.

## Candidate comparison

| Candidate | Artifact and coverage | License / runtime | Finding |
|---|---|---|---|
| Current app matcher | 2,603/2,603 HSK characters; compact data is about 1.2 MB raw / 379 KB gzip | Arphic Public License; plain JS, offline capable | Only candidate benchmarked in this checkout; insufficient evidence for reliable handwriting recognition. |
| PP-OCRv5_mobile_rec | Official Paddle weights `inference.pdiparams` are 16,458,665 bytes. The bundled PaddleOCR dictionary has 18,383 labels, covering 2,603/2,603 app characters. Weights are Paddle format, not a ready ONNX/Web model. | Apache-2.0; model card reports 0.4166 exact-line accuracy on its handwritten Chinese benchmark | A text-line OCR model. Its published line metric and label coverage do not establish single-glyph top-10 performance. No ONNX conversion, single-character benchmark, or Safari/iPhone measurement is available here. |
| `gugray/hanzi_lookup` | Repository includes a 740,534-byte WASM and 593,078-byte stroke database for 9,507 characters | LGPL-3.0 code plus Arphic Public License derived data; browser WASM | Local trajectory matching is available, but recognition with reordered strokes was not tested. It is not selected without that test. |
| `mcyph/cnn_chinese_hw` | Current repository has a 53,879,553-byte legacy `hw_model.pt`, but its current README says the current PyTorch recognizer requires training and no compatible pretrained checkpoint ships. Its corpus files include Tomoe, Make Me a Hanzi, and KanjiVG. | LGPL-2.1 code; separate model/data license groups, including Arphic PL and CC BY-SA 3.0 | The project supports some stroke reordering and documents ONNX export, but the checkpoint's compatibility and provenance for this current architecture are unverified. Training needs PyTorch and corpus preparation. Not bundled. |

CASIA-HWDB is not included or redistributed: its terms require an academic research agreement, and commercial use needs separate permission. Do not use it for app weights by default.

## Decision and limits

No candidate model was run on an independently collected, writer-separated handwriting test set. This checkout has no such labeled images. The released PP-OCRv5 model is not a drop-in glyph classifier, and installing a conversion/runtime stack without a valid test set would not establish that it improves the existing matcher. No new recognizer or training data is claimed as an accuracy improvement.

The offline package now includes all existing drawing UI, worker, matcher data, personal-sample logic, and attribution notice. Recognition and personal samples remain local unless a user explicitly enables and confirms sample sharing in the existing UI. This package change does not make the present algorithm accurate enough to claim general handwriting support.

Before selecting a new recognizer, collect a consented test corpus from multiple writers, split by writer before any tuning, and evaluate the current matcher, PP-OCRv5 single-glyph crops, and an order-permuted `hanzi_lookup` test on the same samples. Include the specified confusable groups and report top-1/top-10, latency, peak memory, download size, and iPhone Safari behavior. Keep model training offline; CASIA use requires its terms to be satisfied.

## Sources inspected

- [PP-OCRv5_mobile_rec model card](https://huggingface.co/PaddlePaddle/PP-OCRv5_mobile_rec): Apache-2.0, Paddle-format weights, text-line recognition, handwritten Chinese exact-line metric.
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR): dictionary snapshot source `ppocr/utils/dict/ppocrv5_dict.txt`.
- [ONNX Runtime Web deployment](https://onnxruntime.ai/docs/tutorials/web/deploy.html): browser runtime requires compatible exported model and runtime assets to be packaged.
- [hanzi_lookup](https://github.com/gugray/hanzi_lookup): LGPL-3.0 recognizer, APL-derived Make Me a Hanzi data.
- [cnn_chinese_hw](https://github.com/mcyph/cnn_chinese_hw) and [third-party data terms](https://github.com/mcyph/cnn_chinese_hw/blob/master/THIRD_PARTY_DATA.md): current training architecture and license-separated corpora.
- [Make Me a Hanzi](https://github.com/skishore/makemeahanzi): stroke geometry, not handwritten training samples.
- [CASIA download](https://nlpr.ia.ac.cn/databases/handwriting/Download.html) and [application terms](https://nlpr.ia.ac.cn/databases/handwriting/Application_form.html).
