#!/usr/bin/env python3
"""
tools/download-study4-audio.py
Tải toàn bộ file audio bài nghe HSK 1–6 từ Study4 về máy local (content/study4-audio/).
Lưu trữ nội bộ để bảo đảm app luôn có audio dù Study4 thay đổi hoặc gián đoạn.

Tính năng:
- Đa luồng (mặc định 16 workers) với tốc độ cao (~10-15 MB/s)
- Khả năng tiếp tục (resume): bỏ qua file đã tải thành công, không tải lại
- Tải qua file tạm .tmp trước khi đổi tên -> tránh file hỏng/dở dang
- Báo cáo tiến độ realtime (phần trăm, dung lượng đã tải, tốc độ MB/s, thời gian còn lại)
- Hỗ trợ tải theo từng cấp HSK (--level 1..6) hoặc toàn bộ
- Tạo file manifest.json tổng kết danh mục sau khi hoàn thành

Cách dùng:
  python tools/download-study4-audio.py
  python tools/download-study4-audio.py --level 3
  python tools/download-study4-audio.py --workers 20
"""

import argparse
import concurrent.futures
import gzip
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
)

def extract_audio_entries(data_path, level_filter=None):
    """Trích xuất tất cả cặp (url, filename, level) duy nhất từ dữ liệu bộ đề."""
    with gzip.open(data_path, "rt", encoding="utf-8") as f:
        data = json.load(f)

    entries = {}  # basename -> { 'url': ..., 'level': ..., 'test_id': ... }

    def record(obj, lvl, tid):
        u = obj.get("audio")
        f = obj.get("audioFile")
        if u and f:
            base = os.path.basename(f)
            if base not in entries:
                entries[base] = {
                    "url": u,
                    "level": lvl,
                    "test_id": tid,
                    "filename": base,
                }

    for t in data.get("tests", []):
        lvl = t.get("level")
        if level_filter and lvl != level_filter:
            continue
        tid = t.get("id")
        record(t, lvl, tid)
        for p in t.get("parts", []):
            record(p, lvl, tid)
            for g in p.get("groups", []):
                record(g, lvl, tid)
                for q in g.get("questions", []):
                    record(q, lvl, tid)

    return entries


def download_one(entry, dest_dir, timeout=30, max_retries=3):
    """Tải một file audio qua file tạm .tmp, hỗ trợ thử lại."""
    url = entry["url"]
    filename = entry["filename"]
    final_path = os.path.join(dest_dir, filename)
    tmp_path = os.path.join(dest_dir, filename + ".tmp")

    # Kiểm tra nếu file đã tồn tại và hợp lệ (> 1024 bytes)
    if os.path.exists(final_path):
        sz = os.path.getsize(final_path)
        if sz > 1024:
            return filename, sz, "skipped"

    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = resp.read()
                if len(data) < 100:
                    raise ValueError(f"Dữ liệu tải quá nhỏ ({len(data)} bytes)")
                with open(tmp_path, "wb") as out:
                    out.write(data)
                os.replace(tmp_path, final_path)
                return filename, len(data), "downloaded"
        except Exception as e:
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass
            if attempt < max_retries - 1:
                time.sleep(1.0 + attempt * 1.5)
            else:
                return filename, 0, f"failed: {e}"

    return filename, 0, "failed"


def format_bytes(n):
    if n < 1024:
        return f"{n} B"
    elif n < 1024 * 1024:
        return f"{n / 1024:.1f} KB"
    elif n < 1024 * 1024 * 1024:
        return f"{n / (1024 * 1024):.1f} MB"
    else:
        return f"{n / (1024 * 1024 * 1024):.2f} GB"


def main():
    parser = argparse.ArgumentParser(description="Tải audio đề thi Study4 HSK về thư mục local.")
    parser.add_argument("--data", default="study4-tests-data.json.gz", help="Đường dẫn file dữ liệu bộ đề")
    parser.add_argument("--dest", default="content/study4-audio", help="Thư mục lưu trữ audio local")
    parser.add_argument("--level", type=int, choices=[1, 2, 3, 4, 5, 6], default=None, help="Lọc theo cấp HSK (1-6)")
    parser.add_argument("--workers", type=int, default=16, help="Số luồng tải song song (mặc định 16)")
    parser.add_argument("--timeout", type=int, default=30, help="Timeout mỗi request (giây)")
    args = parser.parse_args()

    if not os.path.exists(args.data):
        print(f"Lỗi: Không tìm thấy file dữ liệu: {args.data}", file=sys.stderr)
        sys.exit(1)

    os.makedirs(args.dest, exist_ok=True)

    print("=" * 68)
    print("  HSK Study4 Audio Downloader")
    print(f"  Dữ liệu nguồn: {args.data}")
    print(f"  Thư mục đích:  {args.dest}")
    print(f"  Cấp HSK lọc:   {args.level if args.level else 'Tất cả (HSK 1–6)'}")
    print(f"  Số luồng:      {args.workers}")
    print("=" * 68)

    entries = extract_audio_entries(args.data, level_filter=args.level)
    total_files = len(entries)
    print(f"\n→ Tìm thấy tổng cộng {total_files} file audio bài nghe độc nhất.")

    # Kiểm tra số lượng đã có
    existing_files = set(os.listdir(args.dest)) if os.path.exists(args.dest) else set()
    already_done = 0
    already_bytes = 0
    for name, item in entries.items():
        if name in existing_files:
            fp = os.path.join(args.dest, name)
            sz = os.path.getsize(fp)
            if sz > 1024:
                already_done += 1
                already_bytes += sz

    print(f"→ Đã tải sẵn: {already_done} / {total_files} file ({format_bytes(already_bytes)})")
    remaining_count = total_files - already_done
    if remaining_count == 0:
        print("\n✓ Toàn bộ file audio đã được tải đầy đủ về máy local!")
        sys.exit(0)

    print(f"→ Cần tải tiếp: {remaining_count} file\n")

    start_time = time.time()
    last_print_time = start_time
    downloaded_bytes = 0
    completed_count = already_done
    downloaded_new_count = 0
    failed_items = []

    manifest = {}

    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
        future_map = {
            executor.submit(download_one, entry, args.dest, args.timeout): entry
            for entry in entries.values()
        }

        for future in concurrent.futures.as_completed(future_map):
            entry = future_map[future]
            fname, sz, status = future.result()

            if status == "downloaded":
                completed_count += 1
                downloaded_new_count += 1
                downloaded_bytes += sz
                manifest[fname] = {
                    "url": entry["url"],
                    "bytes": sz,
                    "level": entry["level"],
                    "test_id": entry["test_id"],
                }
            elif status == "skipped":
                manifest[fname] = {
                    "url": entry["url"],
                    "bytes": sz,
                    "level": entry["level"],
                    "test_id": entry["test_id"],
                }
            else:
                failed_items.append((entry, status))

            # In cập nhật tiến độ mỗi 1 giây
            now = time.time()
            if now - last_print_time >= 1.0 or completed_count == total_files:
                last_print_time = now
                elapsed = max(now - start_time, 0.001)
                speed = downloaded_bytes / elapsed
                percent = (completed_count / total_files) * 100
                rem_files = total_files - completed_count
                avg_file_sz = (downloaded_bytes / max(downloaded_new_count, 1)) if downloaded_new_count > 0 else 700000
                eta_sec = (rem_files * avg_file_sz) / max(speed, 1000) if speed > 0 else 0
                eta_str = f"{int(eta_sec // 60)}m{int(eta_sec % 60):02d}s" if eta_sec < 3600 else f"{eta_sec/3600:.1f}h"

                bar_len = 25
                filled = int(bar_len * completed_count // total_files)
                bar = "█" * filled + "░" * (bar_len - filled)

                sys.stdout.write(
                    f"\r[{bar}] {completed_count}/{total_files} ({percent:5.1f}%) "
                    f"| Tải mới: {format_bytes(downloaded_bytes)} "
                    f"| Tốc độ: {format_bytes(int(speed))}/s "
                    f"| Còn lại: {eta_str}    "
                )
                sys.stdout.flush()

    total_time = time.time() - start_time
    print("\n" + "=" * 68)
    print(f"✓ Hoàn thành trong {int(total_time // 60)} phút {int(total_time % 60)} giây!")
    print(f"  Tổng file hiện có:  {completed_count} / {total_files}")
    print(f"  File mới tải về:    {downloaded_new_count} ({format_bytes(downloaded_bytes)})")
    if failed_items:
        print(f"  Số file thất bại:   {len(failed_items)}")
        with open(os.path.join(args.dest, "failed.json"), "w", encoding="utf-8") as f:
            json.dump([{"url": it[0]["url"], "error": it[1]} for it in failed_items], f, indent=2)
        print(f"  Chi tiết lỗi đã lưu tại: {os.path.join(args.dest, 'failed.json')}")
    else:
        print("  Không có lỗi nào xảy ra.")

    # Lưu manifest.json
    manifest_path = os.path.join(args.dest, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump({
            "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "totalFiles": completed_count,
            "totalBytes": already_bytes + downloaded_bytes,
            "files": manifest,
        }, f, indent=2)
    print(f"  Manifest danh mục:  {manifest_path}")
    print("=" * 68)


if __name__ == "__main__":
    main()
