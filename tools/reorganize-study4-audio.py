#!/usr/bin/env python3
"""
tools/reorganize-study4-audio.py
Tái cấu trúc toàn bộ 9.058 file audio Study4 thành thư mục theo từng bộ đề:
  content/study4-audio/hsk{level}/test-{id}/listening.mp3
  content/study4-audio/hsk{level}/test-{id}/q{number}.mp3
  content/study4-audio/hsk{level}/test-{id}/group-q{start}-q{end}.mp3

Cập nhật lại đường dẫn audioFile trong study4-tests-data.json.gz.
"""

import gzip
import json
import os
import shutil
import sys
import time

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def main():
    data_path = "study4-tests-data.json.gz"
    root_dir = "content/study4-audio"

    if not os.path.exists(data_path):
        print(f"Lỗi: Không tìm thấy {data_path}", file=sys.stderr)
        sys.exit(1)

    print("=" * 70)
    print("  TÁI CẤU TRÚC KHO AUDIO STUDY4 THEO BỘ ĐỀ VÀ PHẦN THI")
    print("=" * 70)

    with gzip.open(data_path, "rt", encoding="utf-8") as f:
        data = json.load(f)

    tests = data.get("tests", [])
    moved_count = 0
    already_count = 0
    missing_count = 0

    manifest = {}

    for t in tests:
        lvl = t.get("level")
        tid = t.get("id")
        target_dir = os.path.join(root_dir, f"hsk{lvl}", f"test-{tid}")
        os.makedirs(target_dir, exist_ok=True)

        has_q_audio = any(
            q.get("audio")
            for p in t.get("parts", [])
            for g in p.get("groups", [])
            for q in g.get("questions", [])
        )

        if not has_q_audio:
            # Đề track nghe toàn phần
            top_audio = t.get("audio")
            if top_audio:
                old_file = t.get("audioFile") or ""
                old_base = os.path.basename(old_file)
                new_rel = f"content/study4-audio/hsk{lvl}/test-{tid}/listening.mp3"
                new_abs = os.path.normpath(new_rel)

                old_abs = os.path.join(root_dir, old_base)
                if os.path.exists(old_abs):
                    os.replace(old_abs, new_abs)
                    moved_count += 1
                elif os.path.exists(new_abs):
                    already_count += 1
                else:
                    missing_count += 1

                t["audioFile"] = new_rel
                for p in t.get("parts", []):
                    if p.get("skill") == "listening":
                        p["audioFile"] = new_rel

                manifest[new_rel] = {
                    "url": top_audio,
                    "level": lvl,
                    "test_id": tid,
                    "part": "listening",
                    "type": "full_track",
                    "bytes": os.path.getsize(new_abs) if os.path.exists(new_abs) else 0,
                }
        else:
            # Đề chia nhỏ câu lẻ
            for p in t.get("parts", []):
                for g in p.get("groups", []):
                    q_nums = [q.get("number") for q in g.get("questions", []) if q.get("number")]
                    if g.get("audio"):
                        old_file = g.get("audioFile") or ""
                        old_base = os.path.basename(old_file)
                        grp_name = (
                            f"group-q{q_nums[0]}-q{q_nums[-1]}.mp3"
                            if len(q_nums) > 1
                            else f"group-q{q_nums[0]}.mp3"
                        )
                        new_rel = f"content/study4-audio/hsk{lvl}/test-{tid}/{grp_name}"
                        new_abs = os.path.normpath(new_rel)

                        old_abs = os.path.join(root_dir, old_base)
                        if os.path.exists(old_abs):
                            os.replace(old_abs, new_abs)
                            moved_count += 1
                        elif os.path.exists(new_abs):
                            already_count += 1
                        else:
                            missing_count += 1

                        g["audioFile"] = new_rel
                        manifest[new_rel] = {
                            "url": g["audio"],
                            "level": lvl,
                            "test_id": tid,
                            "type": "group_context",
                            "questions": q_nums,
                            "bytes": os.path.getsize(new_abs) if os.path.exists(new_abs) else 0,
                        }

                    for q in g.get("questions", []):
                        if q.get("audio"):
                            old_file = q.get("audioFile") or ""
                            old_base = os.path.basename(old_file)
                            q_num = q.get("number")
                            new_rel = f"content/study4-audio/hsk{lvl}/test-{tid}/q{q_num}.mp3"
                            new_abs = os.path.normpath(new_rel)

                            old_abs = os.path.join(root_dir, old_base)
                            if os.path.exists(old_abs):
                                os.replace(old_abs, new_abs)
                                moved_count += 1
                            elif os.path.exists(new_abs):
                                already_count += 1
                            else:
                                missing_count += 1

                            q["audioFile"] = new_rel
                            manifest[new_rel] = {
                                "url": q["audio"],
                                "level": lvl,
                                "test_id": tid,
                                "type": "question",
                                "q_num": q_num,
                                "qid": q.get("qid"),
                                "bytes": os.path.getsize(new_abs) if os.path.exists(new_abs) else 0,
                            }

    print(f"→ Đã di chuyển sang thư mục mới: {moved_count} file")
    print(f"→ Đã ở đúng vị trí mới từ trước:  {already_count} file")
    if missing_count > 0:
        print(f"⚠ Số file thiếu:                 {missing_count} file")
    else:
        print("✓ 100% file audio đã được gom vào đúng folder bộ đề và đổi tên chuẩn xác!")

    # Xóa các file .mp3 cũ còn sót lại ở root dir nếu có
    leftovers = [
        f for f in os.listdir(root_dir)
        if f.endswith(".mp3") and os.path.isfile(os.path.join(root_dir, f))
    ]
    if leftovers:
        print(f"Xóa {len(leftovers)} file dư thừa ở thư mục gốc...")
        for lf in leftovers:
            try:
                os.remove(os.path.join(root_dir, lf))
            except OSError:
                pass

    # Lưu lại study4-tests-data.json.gz với cấu trúc đường dẫn mới
    print(f"\n→ Đang ghi lại {data_path} với đường dẫn mới...")
    with gzip.open(data_path, "wt", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    print(f"✓ Đã cập nhật xong {data_path} ({os.path.getsize(data_path) / (1024*1024):.2f} MB)")

    # Lưu manifest.json mới
    manifest_path = os.path.join(root_dir, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump({
            "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "totalFiles": len(manifest),
            "files": manifest,
        }, f, indent=2)
    print(f"✓ Đã cập nhật xong manifest: {manifest_path}")
    print("=" * 70)


if __name__ == "__main__":
    main()
