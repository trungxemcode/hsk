"""Fine-tune the app's ELECTRA checkpoint and evaluate the exported INT8 model."""
import argparse
import hashlib
import json
import random
import shutil
import struct
import subprocess
import sys
import tempfile
from pathlib import Path

from corpus import anchor, calibrate, han, load_corpus, metrics

ROOT = Path(__file__).resolve().parents[2]
MODEL_ID = "xurong123/ChineseErrorDetectorElectra"
MODEL_REVISION = "b58d6bdbc60b4f308352ff7c87a8dd419c4019be"
PACKAGE = "HSK_ELECTRA_INT8_Experimental.hskmodel"
WINDOW, OVERLAP = 126, 24


def tokenize(rows, tokenizer):
    windows = []
    for row_index, row in enumerate(rows):
        text = row["text"]
        targets = set().union(*(anchor(text, span) for span in row["errors"]))
        encoded = tokenizer(text, add_special_tokens=False, return_offsets_mapping=True, verbose=False)
        tokens, offsets = encoded["input_ids"], encoded["offset_mapping"]
        for start in range(0, len(tokens), WINDOW - OVERLAP):
            end = min(start + WINDOW, len(tokens))
            valid_start = start + (OVERLAP // 2 if start else 0)
            valid_end = end - (OVERLAP // 2 if end < len(tokens) else 0)
            indices = [tuple(i for i in range(left, right) if han(text[i])) if valid_start <= position < valid_end else ()
                       for position, (left, right) in enumerate(offsets[start:end], start)]
            indices = [(), *indices, ()]
            labels = [int(bool(targets.intersection(items))) if items else -100 for items in indices]
            if any(label >= 0 for label in labels):
                ids = [tokenizer.cls_token_id, *tokens[start:end], tokenizer.sep_token_id]
                windows.append((row_index, ids, labels, indices))
            if end == len(tokens):
                break
    return windows


def fit(model, windows, tokenizer, args, torch):
    for parameter in model.parameters():
        parameter.requires_grad_(False)
    for module in [model.classifier, *model.electra.encoder.layer[-args.unfreeze_layers:]] if args.unfreeze_layers else [model.classifier]:
        for parameter in module.parameters():
            parameter.requires_grad_(True)
    optimizer = torch.optim.AdamW([p for p in model.parameters() if p.requires_grad], lr=args.learning_rate)
    weights = torch.tensor([1.0, args.error_weight])
    order = list(range(len(windows)))
    for epoch in range(args.epochs):
        random.Random(args.seed + epoch).shuffle(order)
        model.train()
        total, steps = 0.0, 0
        for start in range(0, len(order), args.batch_size):
            batch = [windows[index] for index in order[start:start + args.batch_size]]
            size = max(len(ids) for _, ids, _, _ in batch)
            input_ids = torch.tensor([ids + [tokenizer.pad_token_id] * (size - len(ids)) for _, ids, _, _ in batch])
            attention = torch.tensor([[1] * len(ids) + [0] * (size - len(ids)) for _, ids, _, _ in batch])
            labels = torch.tensor([tags + [-100] * (size - len(tags)) for _, _, tags, _ in batch])
            optimizer.zero_grad(set_to_none=True)
            logits = model(input_ids=input_ids, attention_mask=attention).logits
            loss = torch.nn.functional.cross_entropy(logits.reshape(-1, 2), labels.flatten(), weight=weights)
            if not torch.isfinite(loss):
                raise ValueError("Training loss is not finite")
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            steps += 1
            total += loss.item()
        print(f"Epoch {epoch + 1}/{args.epochs}, loss={total / steps:.4f}", flush=True)


def export(checkpoint, output):
    subprocess.run([sys.executable, str(ROOT / "tools/export-sentence-electra.py"), str(checkpoint), str(output)], check=True)
    return output / PACKAGE


def quantized_scores(package, rows, windows, threads):
    import numpy as np
    import onnxruntime as ort

    blob = package.read_bytes()
    magic, size, vocab_rows, width, vocab_length = struct.unpack_from("<8sIIII", blob)
    scale_end = 24 + 4 * vocab_rows
    model_start = scale_end + vocab_rows * width + vocab_length
    if magic != b"HSKELC01" or (vocab_rows, width) != (21128, 768) or model_start + size != len(blob):
        raise ValueError("Package does not match the app's ELECTRA format")
    scales = np.frombuffer(blob, "<f4", vocab_rows, 24)
    table = np.frombuffer(blob, np.int8, vocab_rows * width, scale_end).reshape(vocab_rows, width)
    options = ort.SessionOptions()
    options.intra_op_num_threads = threads
    session = ort.InferenceSession(blob[model_start:], sess_options=options, providers=["CPUExecutionProvider"])
    results = [{} for _ in rows]
    for row, ids, _, indices in windows:
        vectors = table[ids].astype(np.float32) * scales[ids, None]
        logits = session.run(["logits"], {"embeddings": vectors[None], "attention_mask": np.ones((1, len(ids)), np.int64)})[0][0]
        delta = np.clip(logits[:, 0] - logits[:, 1], -80, 80)
        for offsets, probability in zip(indices, 1 / (1 + np.exp(delta))):
            for offset in offsets:
                results[row][offset] = float(probability)
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset-dir", type=Path, default=Path(__file__).parent / "data/seed")
    parser.add_argument("--base-dir", type=Path, help="Use an already downloaded local copy of the pinned checkpoint")
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--epochs", type=int, choices=range(1, 6), default=1)
    parser.add_argument("--batch-size", type=int, choices=(2, 4, 8, 16), default=4)
    parser.add_argument("--unfreeze-layers", type=int, choices=range(13), default=2)
    parser.add_argument("--learning-rate", type=float, default=2e-5)
    parser.add_argument("--error-weight", type=float, default=2)
    parser.add_argument("--max-clean-false-alarm", type=float, default=.15)
    parser.add_argument("--threads", type=int, default=2)
    parser.add_argument("--seed", type=int, default=195)
    args = parser.parse_args()
    if not 0 < args.learning_rate <= .01 or not 0 < args.error_weight <= 20 or not 0 <= args.max_clean_false_alarm < 1 or not 1 <= args.threads <= 16:
        parser.error("Training parameters are out of range")
    rows, dataset = load_corpus(args.dataset_dir)

    import torch
    from huggingface_hub import snapshot_download
    from transformers import AutoModelForTokenClassification, AutoTokenizer

    torch.set_num_threads(args.threads)
    torch.manual_seed(args.seed)
    base = args.base_dir or Path(snapshot_download(
        MODEL_ID, revision=MODEL_REVISION,
        allow_patterns=["config.json", "model.safetensors", "special_tokens_map.json", "tokenizer.json", "tokenizer_config.json", "vocab.txt"],
    ))
    tokenizer = AutoTokenizer.from_pretrained(base, use_fast=True, local_files_only=True)
    model = AutoModelForTokenClassification.from_pretrained(base, local_files_only=True, use_safetensors=True)
    if model.config.model_type != "electra" or model.config.num_labels != 2 or model.config.vocab_size != 21128:
        raise ValueError("Expected the app's two-label Chinese ELECTRA checkpoint")
    windows = {split: tokenize(records, tokenizer) for split, records in rows.items()}
    if any({win[0] for win in windows[split]} != set(range(len(records))) for split, records in rows.items()):
        raise ValueError("At least one sentence could not be tokenized")
    args.out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="hsk-train-") as folder:
        scratch = Path(folder)
        baseline_package = export(base, scratch / "baseline")
        baseline_test = quantized_scores(baseline_package, rows["test"], windows["test"], args.threads)
        print("Baseline INT8 evaluated.", flush=True)
        fit(model, windows["train"], tokenizer, args, torch)
        checkpoint = scratch / "checkpoint"
        model.save_pretrained(checkpoint, safe_serialization=True)
        tokenizer.save_pretrained(checkpoint)
        package = export(checkpoint, scratch / "candidate")
        validation = quantized_scores(package, rows["validation"], windows["validation"], args.threads)
        threshold, validation_report = calibrate(rows["validation"], validation, args.max_clean_false_alarm)
        candidate_test = quantized_scores(package, rows["test"], windows["test"], args.threads)
        output = args.out / "HSK_ELECTRA_INT8_Candidate.hskmodel"
        shutil.copyfile(package, output)
    for notice in ("LICENSE-MODEL.txt", "MODEL-NOTICE.md"):
        shutil.copyfile(Path(__file__).parent / notice, args.out / notice)
    with output.open("rb") as file:
        digest = hashlib.file_digest(file, "sha256").hexdigest()
    report = {
        "base": {"id": MODEL_ID, "revision": MODEL_REVISION if args.base_dir is None else None},
        "dataset": dataset, "counts": {split: len(records) for split, records in rows.items()},
        "training": {key: getattr(args, key) for key in ("epochs", "batch_size", "unfreeze_layers", "learning_rate", "error_weight", "threads", "seed")},
        "artifact": {"name": output.name, "bytes": output.stat().st_size, "sha256": digest, "license": "Apache-2.0"},
        "baseline_threshold": .90, "candidate_threshold": threshold,
        "validation_clean_false_alarm_limit": args.max_clean_false_alarm,
        "candidate_validation": validation_report,
        "baseline_test": metrics(rows["test"], baseline_test, .90),
        "candidate_test_at_baseline_threshold": metrics(rows["test"], candidate_test, .90),
        "candidate_test_at_calibrated_threshold": metrics(rows["test"], candidate_test, threshold),
        "notes": "Localization means at least one marked Han character within the annotated error. Insertions and punctuation use a neighboring anchor.",
    }
    (args.out / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"artifact": report["artifact"], "threshold": threshold,
                      "baseline": report["baseline_test"]["overall"],
                      "candidate": report["candidate_test_at_calibrated_threshold"]["overall"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
