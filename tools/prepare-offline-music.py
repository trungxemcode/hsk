#!/usr/bin/env python3
"""Prepare an owned audio file as HE-AAC v2 at 32/64/96 kbps. Never downloads provider media."""
import argparse, json, shutil, subprocess, tempfile
from pathlib import Path

def run(args):
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr[-1800:] or 'Không mã hóa được âm thanh.')
    return result.stdout

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--bitrate', type=int, choices=[32,64,96], default=64)
    parser.add_argument('--encoder', type=Path, help='FDK-AAC aac-enc executable; otherwise ffmpeg must have libfdk_aac')
    args = parser.parse_args()
    if not args.input.is_file(): parser.error('Không tìm thấy file nguồn.')
    if args.output.suffix.lower() != '.m4a': parser.error('Đầu ra phải có đuôi .m4a.')
    if args.output.exists(): parser.error('File đầu ra đã tồn tại; chọn tên khác để giữ bản gốc.')
    if not shutil.which('ffmpeg') or not shutil.which('ffprobe'): parser.error('Cần cài ffmpeg và ffprobe.')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='hsk-heaac-') as temp:
        temp = Path(temp); output = temp / 'encoded.m4a'
        if args.encoder:
            wav, raw = temp / 'source.wav', temp / 'encoded.aac'
            run(['ffmpeg', '-v', 'error', '-i', str(args.input), '-vn', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', str(wav)])
            run([str(args.encoder), '-t', '29', '-r', str(args.bitrate*1000), str(wav), str(raw)])
            run(['ffmpeg', '-v', 'error', '-i', str(raw), '-c:a', 'copy', '-movflags', '+faststart', str(output)])
        else:
            encoders = run(['ffmpeg', '-hide_banner', '-encoders'])
            if 'libfdk_aac' not in encoders:
                raise RuntimeError('FFmpeg chưa có libfdk_aac. Cài bản có FDK hoặc truyền --encoder tới aac-enc. Không dùng AAC-LC để giả HE-AAC v2.')
            run(['ffmpeg', '-v', 'error', '-i', str(args.input), '-vn', '-ar', '48000', '-ac', '2', '-c:a', 'libfdk_aac', '-profile:a', 'aac_he_v2', '-b:a', str(args.bitrate)+'k', '-movflags', '+faststart', str(output)])
        probe = json.loads(run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_name,profile,channels:format=duration,size,bit_rate', '-of', 'json', str(output)]))
        stream = probe['streams'][0]
        if stream.get('profile') != 'HE-AACv2' or stream.get('channels') != 2:
            raise RuntimeError('Đầu ra không đúng HE-AAC v2 stereo.')
        if output.stat().st_size > 50*1024*1024: raise RuntimeError('Đầu ra vượt giới hạn 50 MB mỗi file.')
        run(['ffmpeg', '-v', 'error', '-i', str(output), '-f', 'null', '-'])
        shutil.copyfile(output, args.output)
        print(json.dumps({'output':str(args.output.resolve()), 'codec':'HE-AAC v2', 'targetBitrate':args.bitrate*1000, 'probe':probe}, ensure_ascii=False))
if __name__ == '__main__':
    try: main()
    except (RuntimeError, OSError) as error: raise SystemExit(str(error))
