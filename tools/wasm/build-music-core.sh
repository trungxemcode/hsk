#!/usr/bin/env bash
# Audio-only, single-thread FFmpeg.wasm + FDK. Requires emsdk 3.1.64, CMake, make.
set -euo pipefail
OUT=$(cd "$(dirname "$0")/../.." && pwd)/vendor/music-codec
BUILD=${HSK_CODEC_BUILD:-/tmp/hsk-music-codec-build}
mkdir -p "$BUILD" "$OUT"
clone() { if [ ! -d "$BUILD/$1/.git" ]; then git clone "$2" "$BUILD/$1"; fi; git -C "$BUILD/$1" checkout "$3"; }
clone ffmpeg https://github.com/FFmpeg/FFmpeg.git n5.1.4
clone bindings https://github.com/ffmpegwasm/ffmpeg.wasm.git f876f907c7e9b9bf51d4ed0b913a855a63ae63fc
clone fdk https://github.com/mstorsjo/fdk-aac.git c41c3c7516ea8d0d78a53b96b30bed3a29745cc6
PREFIX="$BUILD/install"
emcmake cmake -S "$BUILD/fdk" -B "$BUILD/fdk-build" -DCMAKE_BUILD_TYPE=MinSizeRel -DCMAKE_INSTALL_PREFIX="$PREFIX" -DBUILD_SHARED_LIBS=OFF
cmake --build "$BUILD/fdk-build" -j4
cmake --install "$BUILD/fdk-build"
cd "$BUILD/ffmpeg"
export INSTALL_DIR="$PREFIX" FFMPEG_ST=yes CFLAGS="-Oz -I$PREFIX/include" CXXFLAGS="-Oz -I$PREFIX/include" LDFLAGS="-Oz -L$PREFIX/lib -lfdk-aac"
# No GPL libraries or --enable-nonfree. Ship source/license notices with artifacts.
bash "$BUILD/bindings/build/ffmpeg.sh" --disable-everything --disable-avdevice --disable-postproc --disable-network --disable-gpl --enable-libfdk-aac --enable-avcodec --enable-avformat --enable-avfilter --enable-swresample --enable-swscale --enable-protocol=file --enable-demuxer=mov,matroska,mp3,wav,flac,ogg,aac --enable-decoder=aac,aac_latm,mp3,mp3float,opus,vorbis,flac,pcm_s16le,pcm_s24le,pcm_s32le,pcm_f32le --enable-encoder=libfdk_aac --enable-muxer=mp4,adts,null --enable-filter=aresample,aformat,anull --enable-parser=aac,aac_latm,mpegaudio,opus,vorbis,flac
cp -R "$BUILD/bindings/src" .
# ffprobe normally returns rather than aborting; retain its return code.
python3 - <<'PATCH'
from pathlib import Path
p=Path('src/bind/ffmpeg/bind.js')
p.write_text(p.read_text().replace('Module["_ffprobe"](args.length, stringsToPtr(args));','Module["ret"] = Module["_ffprobe"](args.length, stringsToPtr(args));'))
PATCH
# Link only audio libraries; omit SDL and unused video codecs.
emcc -Oz -I. -Isrc/fftools -I"$PREFIX/include" -L"$PREFIX/lib" -Llibavcodec -Llibavfilter -Llibavformat -Llibavutil -Llibswresample -Llibswscale src/fftools/cmdutils.c src/fftools/ffmpeg.c src/fftools/ffmpeg_filter.c src/fftools/ffmpeg_hw.c src/fftools/ffmpeg_opt.c src/fftools/ffmpeg_mux.c src/fftools/opt_common.c src/fftools/ffprobe.c -lavfilter -lavformat -lavcodec -lswresample -lswscale -lavutil -lfdk-aac -sENVIRONMENT=web,worker,node -sWASM_BIGINT -sSTACK_SIZE=5MB -sMODULARIZE -sINITIAL_MEMORY=32MB -sALLOW_MEMORY_GROWTH -sMAXIMUM_MEMORY=512MB -sEXPORT_NAME=createFFmpegCore -sEXPORTED_FUNCTIONS=_ffmpeg,_ffprobe,_abort,_malloc -sEXPORTED_RUNTIME_METHODS=FS,setValue,getValue,UTF8ToString,lengthBytesUTF8,stringToUTF8 --pre-js src/bind/ffmpeg/bind.js -o "$OUT/ffmpeg-core.js"
cp COPYING.LGPLv2.1 "$OUT/LICENSE.FFmpeg"
cp "$BUILD/fdk/NOTICE" "$OUT/LICENSE.FDK-AAC"

python3 - "$OUT" <<'MANIFEST'
import hashlib,json,sys
from pathlib import Path
p=Path(sys.argv[1]);p.joinpath('manifest.json').write_text(json.dumps({'sha256':hashlib.sha256(p.joinpath('ffmpeg-core.wasm').read_bytes()).hexdigest()}))
MANIFEST
