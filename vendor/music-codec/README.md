# HSK on-device audio codec

Audio-only FFmpeg 5.1.4 (`4729204c17f756e186d622060088371d10b34f7e`), ffmpeg.wasm bindings (`f876f907c7e9b9bf51d4ed0b913a855a63ae63fc`) and Fraunhofer FDK AAC (`c41c3c7516ea8d0d78a53b96b30bed3a29745cc6`), compiled with Emscripten 3.1.64. Single thread, no SharedArrayBuffer/COOP/COEP requirement. No network protocols inside FFmpeg. No GPL codecs or --enable-nonfree. FFmpeg is LGPL 2.1 or later; FDK has its own accompanying notice and does not grant a patent license.

Rebuild from the exact sources using `tools/wasm/build-music-core.sh` with activated emsdk, CMake, Python 3 and make. That script contains all configuration and the single binding patch (retain ffprobe return code), and generates the WASM SHA-256 manifest. The compiled module is replaceable independently at this directory; rebuild manifest and PWA hashes together. Source repositories: https://github.com/FFmpeg/FFmpeg , https://github.com/ffmpegwasm/ffmpeg.wasm , https://github.com/mstorsjo/fdk-aac .

`ffmpeg-core.wasm` is fetched and SHA-256 checked on the first requested conversion, then retained in `hsk-music-codec-v1` Cache Storage. It is deliberately excluded from initial PWA downloads. The 74 KB JS glue and small manifest are PWA assets. Old WASM cache entries are replaced after a verified new download. Music itself stays in the separate bounded IndexedDB collection.
