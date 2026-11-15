#!/usr/bin/env python3
"""Import Panda Studio (@PandaStudio24) reading-practice videos into the podcast listener.

Panda Studio publishes HSK 2/3 "Chinese reading practice" videos: a short passage is read
sentence by sentence, then a vocabulary section, then the whole passage again. YouTube has
no Chinese caption track for these videos (only machine `en`), and timedtext downloads from
this network return HTTP 429, so the transcript is produced locally by transcribing the
downloaded audio with faster-whisper.

Pipeline per video (all steps cached in a work directory):
  1. channel enumeration        python -m yt_dlp --flat-playlist
  2. metadata                   python -m yt_dlp --dump-json
  3. audio download             python -m yt_dlp -f bestaudio  (sequential, sleeps between)
  4. ASR                        faster-whisper (language=zh, word timestamps, VAD)
  5. cue segmentation           sentence punctuation + pause threshold, intro/music skipped
  6. pinyin                     pypinyin Style.TONE (tone marks, no heteronyms)
  7. vi/en                      hand-authored mapping (tools/podcast-translations.json).
                                No web MT service is called.
  8. write                      content/podcast/cues/<youtubeId>.json
                                content/podcast/panda-studio-episodes.json (merged sidecar)

Written cue packs use the existing schema exactly:

  {"id","youtubeId","channelHandle","title","durationSec",
   "cues":[{"start","end","en","zh","pinyin","vi"}, ...]}

The script is idempotent: existing cue packs are left untouched unless --force is given, and
audio/ASR/translation results are cached so a re-run only redoes the missing stages.

Examples
--------
  # inspect the channel without writing anything
  python tools/podcast-import-panda-studio.py --dry-run --limit 10

  # pilot: three known HSK 3 reading videos
  python tools/podcast-import-panda-studio.py --ids UnRHYEXWIWE,i4byr6B7Eak,t4xs_6knnpQ

  # wider batch, skipping the long vocabulary videos and the vocabulary chapter
  python tools/podcast-import-panda-studio.py --limit 40 --max-duration 400 --sleep 8

Requirements: python >= 3.10 with `yt_dlp`, `faster_whisper`, `numpy`, `imageio_ffmpeg`
(or ffmpeg on PATH) and `pypinyin`. The first run downloads the whisper model (~500 MB for
`small`, ~1.5 GB for `medium`) into the Hugging Face cache.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

CHANNEL_URL = "https://www.youtube.com/@pandastudio24/videos"
CHANNEL_HANDLE = "@PandaStudio24"
DEFAULT_SLEEP = 8.0
MAX_AUDIO_BYTES = "150M"
HAN = re.compile(r"[\u3400-\u9fff]")
SENT_END = "。！？!?…"
CLAUSE = "，,、；;：:"
PY = sys.executable

# These videos have a vocabulary chapter (single words repeated twice). Those cues have no
# sentence context and translate badly, so they are excluded by default.
#
# The second reading of the passage is deliberately NOT excluded. It is real speech and the
# pack QA graded excellent contains it (first reading 15-68s, vocabulary gap, second reading
# 119-152s). Excluding it deleted half of every lesson.
DEFAULT_EXCLUDE_CHAPTER = r"từ vựng|vocab|词语|词汇"

# Packs the owner has approved after human review. These are never rebuilt: the audio-derived
# transcript is measurably worse than the reviewed file (e.g. 洗衣店 -> 洗衫店, 南京 -> 南经),
# so --force must not be able to overwrite them. This guard is unconditional -- there is no
# flag that disables it, by design.
PROTECTED_IDS = frozenset({
    "i4byr6B7Eak",
    "oLs4RakP7ro",
    "t4xs_6knnpQ",
    "UnRHYEXWIWE",
})

# Ported verbatim from src/modules/podcast/podcast-core.js (TRAD_TO_SIMP_PAIRS).
# The podcast runtime asserts toSimplifiedChinese(cue.zh) === cue.zh, so this list must stay
# character-for-character identical to the app's own table. Do not extend it here.
TRAD_TO_SIMP_PAIRS = (
    '萬万', '與与', '專专', '業业', '東东', '絲丝', '兩两', '嚴严', '喪丧', '個个', '臨临', '為为',
    '麗丽', '舉举', '義义', '烏乌', '樂乐', '喬乔', '習习', '鄉乡', '書书', '買买', '亂乱', '爭争',
    '亞亚', '親亲', '億亿', '僅仅', '後后', '臺台', '從从', '侖仑', '倉仓', '儀仪', '們们', '價价',
    '眾众', '優优', '會会', '傳传', '傷伤', '倫伦', '偽伪', '體体', '餘余', '來来', '側侧', '偵侦',
    '備备', '傢家', '兒儿', '內内', '冊册', '寫写', '軍军', '農农', '準准', '涼凉', '幾几', '凱凯',
    '別别', '刪删', '則则', '剛刚', '創创', '劉刘', '劍剑', '劇剧', '勸劝', '辦办', '動动', '務务',
    '勝胜', '勞劳', '勢势', '區区', '醫医', '華华', '協协', '單单', '賣卖', '衛卫', '廠厂', '廳厅',
    '歷历', '厲厉', '壓压', '厭厌', '參参', '雙双', '發发', '變变', '葉叶', '號号', '嗎吗', '聽听',
    '啟启', '吳吴', '員员', '響响', '問问', '囉啰', '園园', '圍围', '圖图', '團团', '國国', '圓圆',
    '場场', '塊块', '壞坏', '報报', '壽寿', '夠够', '夢梦', '頭头', '奪夺', '獎奖', '媽妈', '嬰婴',
    '學学', '實实', '寬宽', '寶宝', '對对', '導导', '將将', '尋寻', '層层', '屬属', '歲岁', '島岛',
    '嶺岭', '師师', '帶带', '幫帮', '幹干', '廣广', '張张', '強强', '彈弹', '歸归', '當当', '錄录',
    '復复', '憶忆', '懷怀', '態态', '總总', '戀恋', '惡恶', '愛爱', '慣惯', '應应', '懶懒', '戰战',
    '戲戏', '戶户', '擔担', '換换', '據据', '擺摆', '擴扩', '攝摄', '數数', '敵敌', '斷断', '於于',
    '無无', '時时', '暫暂', '暢畅', '機机', '條条', '極极', '標标', '樓楼', '樣样', '樹树', '檢检',
    '權权', '歡欢', '氣气', '沒没', '溫温', '漢汉', '點点', '燒烧', '營营', '獨独', '現现', '環环',
    '產产', '電电', '畫画', '畢毕', '識识', '確确', '視视', '禮礼', '離离', '種种', '稱称', '積积',
    '穩稳', '窮穷', '競竞', '筆笔', '簡简', '節节', '範范', '籃篮', '類类', '緊紧', '紅红', '約约',
    '級级', '細细', '終终', '組组', '經经', '結结', '給给', '統统', '網网', '線线', '績绩', '繼继',
    '續续', '聯联', '職职', '腦脑', '臉脸', '藝艺', '藍蓝', '藥药', '蘇苏', '處处', '裝装', '裡里',
    '裏里', '補补', '見见', '觀观', '規规', '覺觉', '覽览', '訂订', '計计', '討讨', '訓训', '記记',
    '設设', '許许', '訴诉', '詞词', '試试', '詩诗', '話话', '該该', '詳详', '語语', '誤误', '說说',
    '誰谁', '課课', '調调', '談谈', '請请', '論论', '譯译', '議议', '護护', '讀读', '讓让', '貝贝',
    '負负', '財财', '貨货', '貧贫', '責责', '費费', '貼贴', '貴贵', '資资', '賽赛', '贊赞', '贏赢',
    '車车', '軌轨', '軟软', '較较', '載载', '輕轻', '輝辉', '輸输', '轉转', '辭辞', '這这', '進进',
    '連连', '過过', '達达', '遠远', '適适', '選选', '還还', '郵邮', '釋释', '針针', '銀银', '錯错',
    '錢钱', '鎮镇', '鏡镜', '長长', '門门', '開开', '間间', '關关', '陰阴', '陽阳', '際际', '隨随',
    '險险', '隱隐', '難难', '雲云', '靈灵', '靜静', '頁页', '頂顶', '順顺', '須须', '領领', '題题',
    '顏颜', '願愿', '風风', '飛飞', '飯饭', '飲饮', '飾饰', '飽饱', '館馆', '馬马', '騎骑', '騙骗',
    '騷骚', '驗验', '髮发', '鬧闹', '魚鱼', '鮮鲜', '鳥鸟', '雞鸡', '麥麦', '麵面', '黃黄', '齊齐',
    '齒齿', '龍龙', '龜龟', '麼么', '噹当', '唄呗', '欸诶',
)
TRAD_TO_SIMP_MAP = {p[0]: p[1] for p in TRAD_TO_SIMP_PAIRS if p[0] != p[1]}


# --------------------------------------------------------------------------------------
# small helpers
# --------------------------------------------------------------------------------------

def log(msg: str) -> None:
    print(msg, flush=True)


def run(cmd: list[str], *, timeout: int | None = None) -> subprocess.CompletedProcess:
    """Run a command, capture bytes, never use the shell (avoids Windows quoting bugs)."""
    env = dict(os.environ)
    env.setdefault("PYTHONIOENCODING", "utf-8")
    return subprocess.run(
        cmd,
        capture_output=True,
        timeout=timeout,
        env=env,
        stdin=subprocess.DEVNULL,
    )


def has_han(text: str) -> bool:
    return bool(HAN.search(text or ""))


def han_count(text: str) -> int:
    return len(HAN.findall(text or ""))


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data, *, trailing_newline: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, indent=2)
    if trailing_newline:
        text += "\n"
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, path)


# --------------------------------------------------------------------------------------
# 1. channel enumeration + metadata
# --------------------------------------------------------------------------------------

def yt_dlp_base() -> list[str]:
    return [PY, "-m", "yt_dlp", "--ignore-config", "--no-playlist", "--js-runtimes", "node"]


def enumerate_channel(limit: int | None, cache: Path, refresh: bool) -> list[dict]:
    """Return [{'id','duration','title'}] for the channel, newest first (yt-dlp order)."""
    if cache.exists() and not refresh:
        age = time.time() - cache.stat().st_mtime
        if age < 6 * 3600:
            log(f"channel listing: cache hit ({cache}, {age / 60:.0f} min old)")
            return read_json(cache)

    log("channel listing: querying youtube (flat playlist)…")
    cmd = [PY, "-m", "yt_dlp", "--ignore-config", "--flat-playlist", "--js-runtimes", "node",
           "--print", "%(id)s\t%(duration)s\t%(title)s", CHANNEL_URL]
    res = run(cmd, timeout=900)
    if res.returncode != 0:
        raise SystemExit("channel enumeration failed:\n" + res.stderr.decode("utf-8", "replace")[-2000:])
    entries = []
    for line in res.stdout.decode("utf-8", "replace").splitlines():
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        vid, dur, title = parts[0].strip(), parts[1].strip(), parts[2].strip()
        try:
            duration = int(float(dur))
        except ValueError:
            duration = 0
        entries.append({"id": vid, "duration": duration, "title": title})
    if limit:
        entries = entries[:limit]
    cache.parent.mkdir(parents=True, exist_ok=True)
    write_json(cache, entries)
    log(f"channel listing: {len(entries)} videos")
    return entries


def fetch_metadata(vid: str, work: Path, refresh: bool) -> dict:
    cache = work / f"{vid}.meta.json"
    if cache.exists() and not refresh:
        meta = read_json(cache)
        if meta.get("title"):
            return meta
    cmd = yt_dlp_base() + ["--skip-download", "--dump-json", f"https://www.youtube.com/watch?v={vid}"]
    res = run(cmd, timeout=300)
    if res.returncode != 0:
        raise RuntimeError("metadata failed: " + res.stderr.decode("utf-8", "replace")[-800:])
    line = res.stdout.decode("utf-8", "replace").strip().splitlines()[-1]
    raw = json.loads(line)
    meta = {
        "id": vid,
        "title": raw.get("title") or "",
        "duration": int(round(raw.get("duration") or 0)),
        "description": raw.get("description") or "",
        "chapters": [
            {"start": float(c.get("start_time") or 0), "title": c.get("title") or ""}
            for c in (raw.get("chapters") or [])
        ],
        "channel": raw.get("channel") or "",
        "upload_date": raw.get("upload_date") or "",
    }
    write_json(cache, meta, trailing_newline=True)
    return meta


# --------------------------------------------------------------------------------------
# 2. audio
# --------------------------------------------------------------------------------------

def download_audio(vid: str, work: Path, *, ffmpeg_dir: str | None, max_bytes: str) -> Path:
    existing = sorted(work.glob(f"{vid}.*"))
    for p in existing:
        if p.suffix in {".m4a", ".webm", ".opus", ".mp3", ".aac"} and p.stat().st_size > 10_000:
            return p
    cmd = yt_dlp_base() + [
        "--max-filesize", max_bytes,
        "--no-progress",
        "--socket-timeout", "30",
        "--retries", "3",
        "--fragment-retries", "3",
        "-f", "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio",
        "-o", str(work / "%(id)s.%(ext)s"),
        f"https://www.youtube.com/watch?v={vid}",
    ]
    if ffmpeg_dir:
        cmd[3:3] = ["--ffmpeg-location", ffmpeg_dir]
    res = run(cmd, timeout=1800)
    if res.returncode != 0:
        raise RuntimeError("audio download failed: " + res.stderr.decode("utf-8", "replace")[-800:])
    for p in sorted(work.glob(f"{vid}.*")):
        if p.suffix in {".m4a", ".webm", ".opus", ".mp3", ".aac"} and p.stat().st_size > 10_000:
            return p
    raise RuntimeError("audio download produced no usable file (max-filesize hit?)")


def find_ffmpeg(explicit: str | None) -> str:
    if explicit:
        return explicit
    try:
        import imageio_ffmpeg  # noqa: PLC0415
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    found = shutil.which("ffmpeg")
    if found:
        return found
    raise SystemExit("ffmpeg not found: install imageio-ffmpeg or pass --ffmpeg")


def decode_audio(path: Path, ffmpeg: str, start: float = 0.0):
    """Decode to mono 16 kHz float32.

    faster-whisper's own decoder currently breaks with av>=16 (`metadata_errors` kwarg),
    so we always decode with ffmpeg and hand a numpy array to the model.

    ``start`` cuts the audio before decoding. This is how the intro is excluded: whisper
    hallucinates on music and on Vietnamese narration, so the intro is never decoded at
    all rather than transcribed and deleted afterwards.
    """
    import numpy as np  # noqa: PLC0415

    cmd = [ffmpeg, "-v", "error"]
    if start > 0:
        cmd += ["-ss", f"{start:.3f}"]
    cmd += ["-i", str(path), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"]
    res = run(cmd, timeout=1800)
    if res.returncode != 0:
        raise RuntimeError("ffmpeg decode failed: " + res.stderr.decode("utf-8", "replace")[-500:])
    audio = np.frombuffer(res.stdout, dtype=np.float32)
    if audio.size == 0:
        raise RuntimeError("ffmpeg decoded zero samples")
    return audio


# --------------------------------------------------------------------------------------
# 3. ASR
# --------------------------------------------------------------------------------------

def load_model(name: str, device: str, compute_type: str, threads: int):
    from faster_whisper import WhisperModel  # noqa: PLC0415
    t0 = time.time()
    model = WhisperModel(name, device=device, compute_type=compute_type, cpu_threads=threads)
    log(f"  whisper '{name}' loaded in {time.time() - t0:.1f}s ({device}/{compute_type})")
    return model


def transcribe(model, audio, *, beam_size: int, initial_prompt: str,
               no_repeat_ngram_size: int = 3, offset: float = 0.0) -> tuple[list, dict]:
    t0 = time.time()
    segments, info = model.transcribe(
        audio,
        language="zh",
        task="transcribe",
        beam_size=beam_size,
        word_timestamps=True,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 500},
        condition_on_previous_text=False,
        initial_prompt=initial_prompt or None,
        temperature=0.0,
        # Whisper degenerates into loops on this channel's music-heavy intro and on
        # near-identical example sentences ("你老板又年轻,又有钱。" x29). Banning a
        # repeated 3-gram at decode time removes the loop at the source instead of
        # post-filtering it, so real repeated sentences are still transcribed once.
        no_repeat_ngram_size=no_repeat_ngram_size,
    )
    out = []
    for seg in segments:
        out.append({
            # Timestamps stay absolute to the video even when decoding started late.
            "start": float(seg.start) + offset,
            "end": float(seg.end) + offset,
            "text": seg.text or "",
            "words": [[float(w.start) + offset, float(w.end) + offset, w.word or ""]
                      for w in (seg.words or [])],
        })
    log(f"  ASR {time.time() - t0:.1f}s, {len(out)} segments, lang={info.language} "
        f"({info.language_probability:.2f})")
    return out, {"language": info.language, "probability": float(info.language_probability)}


def get_segments(vid: str, audio_path: Path, work: Path, model, opts,
                 decode_from: float = 0.0, decode_to: float | None = None) -> tuple[list, dict]:
    cache = work / f"{vid}.asr.json"
    prompt = opts.initial_prompt or ""
    ngram = int(getattr(opts, "no_repeat_ngram_size", 3) or 0)
    # The signature must cover every knob that changes the bytes, not just the prompt.
    sig_src = f"{prompt}\x00ngram={ngram}\x00from={decode_from:.2f}"
    prompt_sig = hashlib.sha1(sig_src.encode("utf-8")).hexdigest()[:12]
    if cache.exists() and not opts.refresh_asr:
        data = read_json(cache)
        # A cache produced with different decode settings is unusable: it may hold a prompt
        # echo or intro hallucination, so stale bytes would reintroduce the exact defect.
        if data.get("segments") and data.get("promptSig", "") == prompt_sig:
            return data["segments"], data.get("info") or {}
        if data.get("segments"):
            log("  ASR cache was built with different decode settings — re-transcribing")
    ffmpeg = find_ffmpeg(opts.ffmpeg)
    audio = decode_audio(audio_path, ffmpeg, start=decode_from)
    log(f"  decoded {audio.size / 16000:.1f}s of audio from {decode_from:.1f}s")
    segments, info = transcribe(model, audio, beam_size=opts.beam_size, initial_prompt=prompt,
                                no_repeat_ngram_size=ngram, offset=decode_from)
    if decode_to:
        segments = [s for s in segments if s["start"] < float(decode_to)]
    write_json(cache, {"segments": segments, "info": info, "promptSig": prompt_sig,
                       "initialPrompt": prompt, "noRepeatNgramSize": ngram,
                       "decodeFrom": decode_from, "decodeTo": decode_to})
    return segments, info


# --------------------------------------------------------------------------------------
# 4. cue segmentation
# --------------------------------------------------------------------------------------

CN_DIGITS = "零一二三四五六七八九"


def _num_to_zh(num: str) -> str:
    """30 -> 三十, 154 -> 一百五十四 (reading style, no 零 padding beyond tens)."""
    n = int(num)
    if n == 0:
        return "零"
    if n > 9999:
        return num
    units = ["", "十", "百", "千"]
    digits = str(n)
    out = ""
    zero = False
    for idx, ch in enumerate(digits):
        d = int(ch)
        pos = len(digits) - idx - 1
        if d == 0:
            zero = True
            continue
        if zero and out:
            out += "零"
        zero = False
        out += CN_DIGITS[d] + units[pos]
    if out.startswith("一十"):
        out = out[1:]
    return out


def normalize_digits(text: str) -> str:
    """Spell Arabic numerals inside Chinese text so pinyin and MT stay consistent."""
    def repl(m: re.Match) -> str:
        return _num_to_zh(m.group(0))
    return re.sub(r"\d+", repl, text)


def clean_zh(text: str) -> str:
    t = runtime_clean(text)
    t = re.sub(r"(?<=[\u3400-\u9fff])\s+(?=[\u3400-\u9fff])", "", t)
    t = re.sub(r"^(?:\d{1,2}\s*[.、)．]\s*)+", "", t)     # "1." list markers from the reading
    if has_han(t):
        t = t.replace(",", "，").replace("?", "？").replace("!", "！")
        t = t.replace(";", "；").replace(":", "：")
        t = re.sub(r"(?<!\d)\.(?!\d)", "。", t)
        t = re.sub(r"…+", "……", t)
        t = normalize_digits(t)
    t = to_simplified(t)
    # drop Latin-letter garbage that whisper emits for the Vietnamese intro; real cues in the
    # existing packs keep only deliberate terms (App etc.), which appear mid-sentence.
    t = re.sub(r"[A-Za-z]{2,}", "", t)
    t = re.sub(r"\s+([，。、！？；：…）】》”’])", r"\1", t)
    t = re.sub(r"([，。、！？；：…（【《“‘])\s+(?=\S)", r"\1", t)
    t = re.sub(r"([（【《“‘])\s+", r"\1", t)
    return runtime_clean(t)


_OPENCC = None


def canonical_simplified(text: str) -> str:
    """The exact substitution the podcast runtime applies (character-by-character)."""
    if not text:
        return ""
    return "".join(TRAD_TO_SIMP_MAP.get(ch, ch) for ch in text)


def opencc_simplified(text: str) -> str:
    """Optional phrase-level pass. Only used to clean input before the canonical check."""
    global _OPENCC
    if _OPENCC is None:
        try:
            from opencc import OpenCC  # noqa: PLC0415
            _OPENCC = OpenCC("t2s")
        except Exception:
            _OPENCC = False
    if _OPENCC:
        return _OPENCC.convert(text)
    return text


def to_simplified(text: str) -> str:
    """Normalise to Simplified Chinese so the runtime validator accepts the cue.

    opencc (when installed) fixes phrase-level cases the app's 367-pair table misses
    (e.g. 軟體 -> 软体); the canonical substitution is then applied so the result is
    guaranteed stable under podcastCore.toSimplifiedChinese.

    `著` needs one extra pass. It is a single Unicode character that is BOTH the correct
    Simplified form (zhu4: 著作/著名/显著) and the Traditional form of `着` (zhe: 长著/穿著).
    opencc refuses to touch it for that reason and the app's table does not list it, so an
    ASR cue like `她长著一双小小的眼睛` would otherwise ship with a Traditional character.
    The resolution is a whitelist rather than a blanket replace, so the zhu4 words survive.
    """
    return fix_zhu(canonical_simplified(opencc_simplified(text)))


# 著 is kept only inside these zhu4 words; everywhere else it is Traditional 着.
_ZHU_KEEP_WORDS = (
    "著作", "著名", "显著", "著书", "著者", "著述", "著录", "著称", "著书立说",
    "名著", "专著", "巨著", "原著", "论著", "译著", "编著", "土著", "卓著",
    "昭著", "遗著", "撰著", "合著", "新著", "大著",
)


def _zhu_is_zhu4(text: str, i: int) -> bool:
    """True when the 著 at index i sits inside a zhu4 word and must be kept."""
    for word in _ZHU_KEEP_WORDS:
        anchor = word.find("著")
        start = i - anchor
        if start >= 0 and text[start:start + len(word)] == word:
            return True
    return False


def fix_zhu(text: str) -> str:
    """Turn Traditional `著` (the particle zhe) into Simplified `着`, keeping zhu4 words."""
    if not text or "著" not in text:
        return text
    out = []
    for i, ch in enumerate(text):
        if ch == "著" and not _zhu_is_zhu4(text, i):
            out.append("着")
        else:
            out.append(ch)
    return "".join(out)


def traditional_leftovers(text: str) -> list[str]:
    """Characters still traditional-only after the canonical substitution."""
    leftovers = {ch for ch in canonical_simplified(text) if ch in TRAD_TO_SIMP_MAP
                 and TRAD_TO_SIMP_MAP[ch] != ch}
    if "著" in canonical_simplified(text):
        # Same rule as fix_zhu: a 著 outside a zhu4 word is a Traditional 着.
        if fix_zhu(canonical_simplified(text)) != canonical_simplified(text):
            leftovers.add("著")
    return sorted(leftovers)


def runtime_clean(text: str) -> str:
    """Mirror podcast-core cleanSubtitleLineText: strip tags/entities, collapse whitespace."""
    s = str(text or "")
    s = re.sub(r"<[^>]*>", " ", s)
    s = re.sub(r"&amp;", "&", s, flags=re.I)
    s = re.sub(r"&lt;", "<", s, flags=re.I)
    s = re.sub(r"&gt;", ">", s, flags=re.I)
    s = re.sub(r"&quot;", '"', s, flags=re.I)
    s = re.sub(r"&#39;|&apos;", "'", s, flags=re.I)
    s = re.sub(r"&nbsp;", " ", s, flags=re.I)
    s = re.sub(r"\s+", " ", s)
    return s.strip().lstrip("\ufeff")


def _ends_with(text: str, charset: str) -> bool:
    return bool(text) and text.rstrip()[-1:] in tuple(charset)


def _item_stream(segments: list[dict]) -> list[tuple[float, float, str, int]]:
    items: list[tuple[float, float, str, int]] = []
    for si, seg in enumerate(segments):
        words = seg.get("words") or []
        if words:
            for w in words:
                s, e, t = float(w[0]), float(w[1]), (w[2] or "")
                if t.strip():
                    items.append((s, e, t, si))
        elif (seg.get("text") or "").strip():
            items.append((float(seg["start"]), float(seg["end"]), seg["text"], si))
    items.sort(key=lambda x: x[0])
    # repair non-positive / non-monotonic word spans
    fixed = []
    prev_end = 0.0
    for s, e, t, si in items:
        s = max(0.0, s)
        if s < prev_end - 0.5:      # large backwards jump: clamp to the running cursor
            s = prev_end
        if e <= s:
            e = s + 0.02
        fixed.append((s, e, t, si))
        prev_end = max(prev_end, e)
    return fixed


def _word_boundaries(text: str) -> list[int]:
    """Character offsets where a word starts (word-boundary break points)."""
    offsets = [0]
    pos = 0
    for word in _han_words(text):
        pos += len(word)
        offsets.append(pos)
    return offsets


def _split_group(group: list[tuple[float, float, str, int]], max_chars: int
                 ) -> list[list[tuple[float, float, str, int]]]:
    """Split an over-long group at word boundaries instead of mid-word.

    The second, continuous reading of the passage has no punctuation in the ASR output, so
    the hard cap has to cut somewhere; cutting on a jieba word boundary keeps cues readable.
    """
    text = "".join(t for _, _, t, _ in group)
    if han_count(text) <= max_chars:
        return [group]

    offsets = [0]
    for _, _, t, _ in group:
        offsets.append(offsets[-1] + len(t))
    boundaries = _word_boundaries(text)

    chunks: list[list[tuple[float, float, str, int]]] = []
    start_offset = 0
    start_item = 0
    total = len(text)
    while start_offset < total:
        remaining = text[start_offset:]
        if han_count(remaining) <= max_chars:
            chunks.append(group[start_item:])
            break
        # probe forward in small steps until the Han count would exceed max_chars
        limit = start_offset
        count = 0
        while limit < total:
            ch = text[limit]
            if HAN.match(ch):
                if count + 1 > max_chars:
                    break
                count += 1
            limit += 1
        # snap back to the nearest word boundary at or before the hard limit
        candidates = [b for b in boundaries if start_offset < b <= limit]
        cut = candidates[-1] if candidates else limit
        # find the item index that covers `cut`
        idx = start_item
        while idx < len(group) and offsets[idx] < cut:
            idx += 1
        if idx <= start_item:
            idx = start_item + 1
        chunks.append(group[start_item:idx])
        start_item = idx
        start_offset = offsets[idx]
        if start_item >= len(group):
            break
    return chunks or [group]


def build_cues(segments: list[dict], duration: float, *, max_chars: int = 46,
               pause: float = 1.1, min_dur: float = 0.3,
               skip_before: float = 0.0, skip_windows: list[tuple[float, float]] | None = None
               ) -> list[dict]:
    """Turn whisper segments/words into sentence-level cues.

    Cues break on sentence punctuation, on pauses longer than `pause`, and as a hard cap at
    `max_chars` Han characters (the second, continuous reading of the passage has no
    punctuation in the ASR output, so the cap is what keeps those cues readable).
    """
    items = _item_stream(segments)
    groups: list[list[tuple[float, float, str, int]]] = []
    cur: list[tuple[float, float, str, int]] = []
    chars = 0
    cur_seg = -1

    def flush() -> None:
        nonlocal cur, chars, cur_seg
        if cur:
            groups.append(cur)
        cur, chars, cur_seg = [], 0, -1

    for idx, (s, e, t, si) in enumerate(items):
        if cur and cur_seg != si and s - cur[-1][1] > pause:
            flush()
        cur.append((s, e, t, si))
        cur_seg = si
        chars += han_count(t) + sum(c.isalnum() for c in t)
        stripped = t.strip()
        nxt = items[idx + 1] if idx + 1 < len(items) else None
        seg_break = nxt is None or nxt[3] != si
        end_pause = seg_break and ((nxt is None) or (nxt[0] - e > pause))
        if _ends_with(stripped, SENT_END) and (end_pause or chars >= max_chars * 0.6):
            flush()
        elif end_pause:
            flush()
        elif chars >= max_chars and _ends_with(stripped, CLAUSE):
            flush()
        elif chars >= max_chars * 1.35:
            flush()
    flush()

    groups = [chunk for group in groups for chunk in _split_group(group, max_chars)]

    windows = skip_windows or []
    cues: list[dict] = []
    prev_end = 0.0
    for group in groups:
        zh = clean_zh("".join(t for _, _, t, _ in group))
        zh = re.sub(r"^[，。、；：!?！？…\s]+", "", zh)
        if not has_han(zh):
            continue
        start = round(max(0.0, group[0][0]), 2)
        end = round(max(group[-1][1], start + min_dur), 2)
        if duration > 0:
            if start >= duration:
                break
            end = min(end, round(float(duration), 2))
        if any(w0 - 1.0 <= start < w1 for w0, w1 in windows):
            continue
        if start < prev_end:
            start = round(prev_end + 0.01, 2)
        if end <= start:
            end = round(start + 0.3, 2)
        if skip_before and end <= skip_before:
            continue
        cues.append({"start": start, "end": end, "zh": zh})
        prev_end = end
    return cues


def drop_bad_cues(cues: list[dict]) -> tuple[list[dict], dict]:
    """Remove cues no reader can use: hallucinations, loops, and exact duplicate text.

    Applied to cues (not raw segments) because an artefact can be produced by merging a
    clean fragment with a hallucinated one, and because a loop can span segment boundaries.

    Duplicate policy: only a cue whose Han-only text is IDENTICAL to an earlier cue is
    dropped. Near-duplicates are kept on purpose. The channel reads each passage twice
    (sentence by sentence, then continuously), and the pack QA graded excellent keeps both
    readings -- the first is split into short sentences, the second is merged into longer
    ones, so they are similar but not identical. Dropping similar cues deleted the second
    reading and halved the lesson. A fuzzy threshold is therefore wrong here: it cannot tell
    "the same sentence read again" from "a sentence that shares most of its words".
    """
    stats = {"hallucination": 0, "repetition": 0, "duplicate": 0}
    out: list[dict] = []
    seen: set[str] = set()

    def key(text: str) -> str:
        return re.sub(r"[^\u3400-\u9fff]", "", text or "")

    for cue in cues:
        zh = cue["zh"]
        if is_hallucination(zh) or is_junk_text(zh):
            stats["hallucination"] += 1
            continue
        if is_repetition(zh) or is_degenerate(zh) or is_loop_ratio(zh):
            stats["repetition"] += 1
            continue
        k = key(zh)
        if not k:
            stats["hallucination"] += 1
            continue
        if k in seen:
            stats["duplicate"] += 1
            continue
        seen.add(k)
        out.append(cue)
    return out, stats


def enforce_min_cue_duration(cues: list[dict], *, min_seconds: float = 1.0,
                             contiguous_gap: float = 1.1) -> tuple[list[dict], int]:
    """Remove cues too short to read, without ever stretching a cue over silence.

    A sub-second cue is either a fragment of neighbouring speech (then merge it) or an
    isolated blip separated by silence (then drop it). Merging unconditionally is what
    produced a 52-second cue for a 7-second sentence: a 0.58s "听来" blip at 19.38s was
    merged with a real sentence starting at 63.94s, so the cue claimed to be spoken for a
    minute of music. Karaoke highlighting is driven by these timestamps, so a cue may only
    cover audio it actually spans.
    """
    merged = 0
    dropped = 0
    out: list[dict] = []

    def join_text(a: str, b: str) -> str:
        return a if han_count(a) >= han_count(b) else b

    for cue in cues:
        short = (cue["end"] - cue["start"]) < min_seconds - 1e-9
        if not short:
            out.append(cue)
            continue
        prev = out[-1] if out else None
        # A blip with silence on both sides is not speech; there is nothing to attach it to.
        near_prev = prev is not None and (cue["start"] - prev["end"]) <= contiguous_gap
        if near_prev:
            prev["end"] = max(prev["end"], cue["end"])
            prev["zh"] = join_text(prev["zh"], cue["zh"])
            merged += 1
        else:
            dropped += 1

    # A lone leading short cue has nothing to merge into; give it the next cue's start.
    if len(out) == 1 and (out[0]["end"] - out[0]["start"]) < min_seconds - 1e-9:
        out[0]["end"] = round(out[0]["start"] + min_seconds, 2)
    return out, merged, dropped


# --- ASR junk removal ------------------------------------------------------------------
#
# Every video on this channel has the same three-part shape: a spoken intro (Vietnamese +
# music + the channel name read aloud), the passage read sentence by sentence, a vocabulary
# drill, then the passage read again continuously. Whisper mangles the intro, because the
# audio there is not Mandarin: it emits channel branding ("练读《天中》，级度 H.S.K.3"),
# the curriculum menu read aloud ("1. 听和读词汉没有语言，然后回答误会"), or degenerate
# repetition ("标点使用简体中文普通话朗读。" x9). None of that is passage content.
#
# The primary defence is structural: the intro is never decoded (see `decode_audio`), so
# those tokens are never generated. The token list below is the second line of defence that
# guarantees a stray artefact can never reach a written pack.

# Halucination signatures. These are strings whisper emits when it is transcribing music,
# Vietnamese narration, or its own initial prompt -- never anything a speaker says.
HALLUCINATION_PATTERNS = tuple(re.compile(p) for p in (
    r"练读", r"練讀", r"论读", r"論讀", r"乱读", r"亂讀", r"链读", r"鏈讀", r"键读", r"鍵讀",
    r"级度", r"級度", r"攻赌", r"攻賭",
    r"天中", r"铁中", r"鐵中",
    r"标点使用", r"標點使用",
    r"简体中文普通话", r"簡體中文普通話", r"普通话朗读", r"普通話朗讀",
    # whisper writes the acronym with full stops it invented: H。S。K。 / H.S.K.
    r"H\s*[。.．]\s*S\s*[。.．]\s*K",
    r"《\s*》",                     # empty book-title brackets are always an artefact
    r"Penda\s*Studio", r"PendaStudio", r"Hadeske",
))

# Branding + curriculum menu + outro + prompt-echo tokens that never occur in a passage.
JUNK_TOKENS = (
    # channel branding read aloud at the top of the video
    "练读", "練讀", "論讀", "论读", "链读", "链讀", "键读", "鍵讀", "讀集", "读集",
    "級度", "级度", "攻赌", "攻賭", "添中", "天中", "铁中", "鐵中",
    "Penda", "PendaStudio", "Hadeske", "HK3", "H.S.K", "hdxk3", "HDXK3",
    "中极高度", "中極高度", "中夹度", "中夾度",
    # the curriculum menu every video reads out before the passage
    "听和读", "聽和讀", "聂和读", "聶和讀", "聂和独断", "读词课", "讀詞課",
    "词工程", "詞工程", "语法关键", "語法關鍵", "语法关重", "語法關重",
    "自问关键", "自問關鍵", "自互關鍵", "唸唸唸", "念念念",
    "中断文", "中斷文", "中断乱", "中斷亂", "断文", "斷文",
    "简短读", "短暫", "短暂",
    # whisper echoing a previous run's initial_prompt back as content
    "标点使用简体中文", "標點使用簡體中文", "普通话朗读", "普通話朗讀",
    "简体中文普通话",
    # Vietnamese-channel outro read in Mandarin, plus burned-in subtitle credits
    "請觀看", "请观看", "觀賞其他", "观赏其他", "到此為止", "到此为止",
    "這裡是結束", "这里是结束", "訂閱", "订阅", "打赏", "打賞",
    "多謝", "多谢", "字幕",
    # the outro sentence is re-heard differently every time but keeps this core
    "关重", "關重", "关众", "關眾", "关纵", "關縱", "白乱", "白亂",
    "Kinda Studio", "Kenten",
    # the spoken intro's third line announces what the video is
    "這是一套語法", "这是一套语法", "這是一篇文章", "这是一篇文章",
    "這是一句話題", "这是一句话题", "這是一段", "这是一段",
    "專門學習", "专门学习", "中級高級", "中级高级",
    # end-of-video call to action
    "我們再次觀看", "我们再次观看", "接下來的學習", "接下来的学习",
    "点赞", "點贊", "转发", "轉發", "下次見", "下次见",
    "祝大家", "學得好", "学得好",
    # garbled preview of the passage that whisper hears in the spoken intro
    "風雨大雨", "风雨大雨",
)

# Tokens that only appear in the curriculum menu read out before every passage.
MENU_TOKENS = (
    "听和读", "聽和讀", "聂和读", "聶和讀", "聂和独断", "聂和独读",
    "读词课", "讀詞課", "词工程", "詞工程", "中断文", "中斷文",
    "断文", "斷文", "简短读", "短暫", "短暂", "独断妄", "独断王",
    "回答误会", "回答语言", "回答词", "回答语", "回答答案", "回答问题",
    "没有语言", "沒有語言", "没有音乐", "沒有音樂", "没有声音", "沒有聲音",
    "有语言", "有語言", "有音乐", "有音樂", "有声音", "有聲音",
    "解释知识", "解釋知識", "解释答案", "语法关重", "語法關重",
)

LEAD_MARKER = re.compile(r"^\s*\d{1,2}\s*[.、)．]\s*")
SENT_FINAL = "。！？!?…"

# Non-Chinese text inside a `zh` cue: a run of Latin letters, or any Vietnamese letter.
# Vietnamese diacritics can never appear in pinyin, so they are unambiguous evidence that
# the speaker switched language (grammar videos interleave "ví dụ thứ ba" narration).
FOREIGN_IN_ZH = re.compile(
    r"[A-Za-z]{2,}"
    r"|[ăâđêôơưĂÂĐÊÔƠƯạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]"
)

# The curriculum menu's third line and the outros are re-worded slightly by whisper on every
# video ("包含自愤, 和语法关重。", "语法 关众 中 白 啦"), so token matching alone misses them.
JUNK_PATTERNS = tuple(re.compile(p) for p in (
    r"包含.{0,10}(语法|語法|自愿|自願|自愤|自愚|自讯|自訊|自問|自问)",
    r"(语法|語法).{0,8}(关重|關重|关纵|關縱|关键|關鍵|关系|關係|关众|關眾)",
    r"(唸書|念书|唸讀|阅读|閱讀).{0,12}(結束|结束|這裡|这里)",
    r"(这里|這裡|到此|到這|到这里|到這裡).{0,10}(結束|结束)",
    r"多看.{0,10}(影片|学习|學習)",
    r"(的自愿|的自願)",
    r"阿斯迪迪奥",
    r"(然后|然後)再次?[见見]",
    r"^[開开]始[!！。.]?$",
    r"^(詞語|词语|语法|語法)[!！。.]?$",
    r"^【[^】]{1,14}】$",                    # whisper renders title cards as 【讲故事】
    r"(站|訂|订|关注|關注).{0,6}(学习|學習)",
    r"^[^，。]{0,6}(关重|關重|关众|關眾|关纵|關縱)[^，。]{0,6}[，。]?$",
    r"自[问問愿願][关關]",                   # "自问关键" / "学习自愿关照"
    r"學自[问問]",                           # "2. 學自問關 chong"
    r"(接下[来來]|下一[步個个]|更多).{0,8}(學習|学习|影片|內容|内容)",
))


# --- owner-reviewed transcript corrections ----------------------------------------------
#
# Rule from the owner: a character may be corrected ONLY when the ASR sequence is not a real
# word AND the replacement is a common word with the same sound (历世 -> 历史, 南经 -> 南京,
# 与 -> 雨). A cue that is unintelligible for any other reason is never rewritten to taste --
# it is dropped (REVIEW_DROPS) or left alone and reported.
#
# Matching is by exact substring of the cue's zh, not by cue index, so the entry survives a
# rebuild whose segmentation shifts. `scope` restricts a fix to the packs where that string
# really is the wrong word: 辛苦 appears in 经历 legitimately elsewhere, so blanket replacing
# 经历 -> 精力 globally would corrupt a correct cue.
#
# Every applied fix is printed to the change log with before/after/reason. Nothing here is
# silently applied, and nothing outside this table is ever rewritten.
REVIEW_ZH_FIXES: tuple[tuple[str, str, str, tuple[str, ...]], ...] = (
    # (find, replace, why, scope)
    ("挂着", "刮着", "大风呼呼地挂着 is not a phrase; 刮 guā = to blow, same syllable", ("-7vHw8HY7e0",)),

    ("家亭", "家庭", "家亭 is not a word; 家庭 jiātíng = family, same sound", ("220SPiohH6o",)),
    ("陪办", "陪伴", "陪办 is not a word; 陪伴 péibàn = to accompany, same sound", ("220SPiohH6o",)),
    ("小虫屋们", "小宠物们", "小虫屋 is not a word; 宠物 chǒngwù = pet, same sound", ("220SPiohH6o",)),

    ("首度", "首都", "首度 shǒudù means 'first time'; the sentence needs 首都 capital", ("2_xoyU_kG6E",)),
    ("手都", "首都", "手都 is not a word; 首都 shǒudū, identical sound shǒu", ("2_xoyU_kG6E",)),
    ("守都", "首都", "守都 is not a word; 首都 shǒudū, identical sound shǒu", ("2_xoyU_kG6E",)),
    ("首读", "首都", "首读 is not a word; 首都 shǒudū, same syllable dū/dú", ("2_xoyU_kG6E",)),

    ("较离江", "叫漓江", "河较离江 is not a phrase; 叫漓江 jiào Líjiāng = 'is called Li River'", ("3iBHC8jjXZY",)),
    ("轿离江", "叫漓江", "轿离江 is not a phrase; 叫漓江, identical sounds jiào / lí", ("3iBHC8jjXZY",)),
    ("桂霖", "桂林", "桂霖 is not a place name; 桂林 Guìlín, identical sound lín", ("3iBHC8jjXZY",)),

    ("很多经历", "很多精力", "after exercise you have energy; 精力 jīnglì is a homophone of 经历", ("5KD4DU7PQWw",)),

    ("交外卖", "叫外卖", "交外卖 is not a word; 叫外卖 jiào wàimài = order takeout, same syllable", ("0AaZ9ynRHfk",)),

    ("为主四。她常常", "她常常",
     "为主四 is the curriculum menu's 'item four' marker, not part of the sentence", ("oMz3ocdDgGw",)),

    ("小嘴吧", "小嘴巴", "小嘴吧 is not a word; 嘴巴 zuǐba = mouth, same syllable", ("boNZ-Aqa3Jg",)),

    ("一班小朋友", "一般小朋友", "一般 yībān = ordinary; 一班 (= class one) contradicts the comparison", ("boNZ-Aqa3Jg",)),

    ("闹中没有想", "闹钟没有响", "闹中 is not a word and 想 cannot 'not happen'; 闹钟 nàozhōng / 响 xiǎng", ("DnPkczMdJCI",)),
    ("闹中就响了", "闹钟就响了", "闹中 is not a word; 闹钟 nàozhōng, identical sound", ("DnPkczMdJCI",)),

    ("工作的很好", "工作得很好", "a degree complement after a verb takes 得, not 的; identical sound", ("ezcv22csdsw",)),
    ("在\ufffd厅", "在餐厅", "U+FFFD is a corrupted byte; 餐厅 cāntīng restores the word", ("ezcv22csdsw",)),

    ("与这么大", "雨这么大", "与 = and, cannot be 'this big'; title is 雨这么大, 雨 yǔ is a homophone", ("iGRVOGb9euA",)),
    ("中国的历世", "中国的历史", "历世 is not a word; 历史 lìshǐ = history, same syllable", ("iGRVOGb9euA",)),

    ("教\ufffd室", "教室", "U+FFFD is a corrupted byte; 教室 jiàoshì = classroom", ("IjuXvfFgXZE",)),
    ("我的教士", "我的教室", "教士 = clergy, wrong here; 教室 jiàoshì, identical sound shì", ("IjuXvfFgXZE",)),
    ("书家上", "书架上", "书家 is not a word; 书架 shūjià = bookshelf, same syllable jiā/jià", ("IjuXvfFgXZE",)),

    ("大眼镜", "大眼睛", "the sentence describes a face, not spectacles; 眼睛 is a homophone of 眼镜", ("IqgwURpdJBA",)),
    ("人人都跨得", "人人都夸得", "跨 = step over, wrong here; 夸 kuā = to praise, identical sound", ("IqgwURpdJBA",)),

    ("而事经历", "而是经历", "而事 is not a word; 而是 ér shì, identical sound shì", ("IZrsZjmNxBc",)),

    ("才能倒", "才能到", "倒 = fall, wrong after 走很多台阶; 到 dào = arrive, identical sound", ("jwsV_-hYnt4",)),
    ("寺原里", "寺院里", "寺原 is not a word; 寺院 sìyuàn = temple grounds, same syllable", ("jwsV_-hYnt4",)),
    ("买很多纪念品", "卖很多纪念品", "the shop sells the souvenirs; 卖 mài and 买 mǎi share one syllable", ("jwsV_-hYnt4",)),

    ("游勇", "游泳", "游勇 is not a word; 游泳 yóuyǒng = swimming, identical sound yǒng", ("Jzu6F5dk5gE",)),
    ("游涌", "游泳", "游涌 is not a word; 游泳, identical sound yǒng", ("Jzu6F5dk5gE",)),
    ("游永", "游泳", "游永 is not a word; 游泳, same syllable yǒng", ("Jzu6F5dk5gE",)),
    ("很高幸", "很高兴", "很高幸 is not a word; 高兴 gāoxìng, identical sound xìng", ("Jzu6F5dk5gE",)),
    ("小鸣", "小明", "the character is 小明 throughout; 鸣 míng is a homophone of 明", ("Jzu6F5dk5gE",)),
    ("抱了游泳班", "报了游泳班", "抱 = embrace; 报 bào = to enrol, identical sound", ("Jzu6F5dk5gE",)),

    ("一遍唱歌", "一边唱歌", "the lesson is 一边…一边…; 一遍 (once) is wrong, 边 biān homophone", ("oMz3ocdDgGw",)),

    ("阿怡", "阿姨", "阿怡 is not a word; 阿姨 āyí = aunt, identical sound yí", ("v24Yq-muNss",)),

    ("历世", "历史", "历世 is not a word; 历史 lìshǐ = history, same syllable", ("wey_cffoo7U",)),
    ("南经", "南京", "南经 is not a place name; 南京 Nánjīng, identical sound jīng", ("wey_cffoo7U",)),
)

# Cues that are channel furniture or wrong-character text that the homophone table above cannot
# repair. They are dropped, never "translated": rendering a sentence that has no meaning would
# be fiction, and shipping it with a blank layer violates the four-layer rule.
#
# Compared AFTER REVIEW_ZH_FIXES, so an entry may be written in its corrected form.
REVIEW_DROPS: frozenset[str] = frozenset({
    # --- channel furniture: outro CTA / curriculum menu read aloud / corrupted bytes ---------
    "第二，聂和独词汉有辅音、解 之评。",
    "第二，聂和独词汉有辅音，解 之铁。",
    "女法官众中白老。",
    "女法关传中白了。",
    "女发关传中白老。",
    "就读问观众，中拜啦。",
    "就问观众，中拜啦。",
    "读问观众，中拜啦。",
    "语法关锨中白啦",
    "听了来，云仰之铁。",
    "这首词的诅咒是结束",
    "联系。",
    "回答，比如第一。",
    "例如十二",
    "我现在很忙我现在也很忙如果有什么需要解答请在下方评论我们会尽量的",
    "因为听说北京的冬天很冷读文关照张拜",            # outro glued onto a real sentence

    # --- 0AaZ9ynRHfk (又…又…): wrong characters the homophone rule cannot repair ------------
    "妈妈的头发又很有亮。",            # 又很有亮: needs 又黑又亮, not a homophone
    "脉搭的妈妈，又黑又薄，",          # 脉搭 is not a word
    "这个房间，又重大，又闪瘦。",      # 又重大 / 又闪瘦 are not words
    "他小时候又爱，又瘦。他小的时候又爱、又烁。",   # 又爱 / 又烁 are not words
    "他小时后又爱。他小时后又浏，又受。",           # 又浏 / 又受 are not words
    "他小年纪小时，又凶、又异。",      # not a sentence
    "他小小时时，就凶，又弃。",        # not a sentence
    "她也就知道跳舞和跳舞",            # degenerate
    "他小的孩子，又有钱。又聪明、又可爱",   # 他小的孩子 is not a phrase (小 does not fit)

    # --- 220SPiohH6o: degraded second reading ----------------------------------------------
    "现在越来越多的家庭会养小宵物了，",              # 小宵物 is not a word
    "他们成为了一位家庆成员，给家里人带来了欢乐。",   # 家庆 is not a word
    "他们好像能处听懂人类说话一样，特别的聪明。",     # 能处 is not a word

    # --- 2_xoyU_kG6E: degraded second reading -----------------------------------------------
    "联邦是英国的首都。",              # 联邦 = federation, cannot be a capital
    "巴黍是法国的首都。",              # 巴黍 is not a place name
    "首尼是韩国的首都。",              # 首尼 is not a place name
    "东京是日本的首都是。",            # trailing 是 breaks the sentence

    # --- 3iBHC8jjXZY -----------------------------------------------------------------------
    "有山，有河，还有便宥的食物。",    # 便宥 is not a word
    "桂岭的山不是很高，从城市中穿过的河叫漓江，很干净。",   # 桂岭 is not a place name
    "桂岭的米粉好吃又便宜。",          # 桂岭 is not a place name

    # --- 5KD4DU7PQWw -----------------------------------------------------------------------
    "每天早上，我都会去公园跑步，公囯里的空气，很新鲜，让我感觉非常舒服。",   # 公囯 for 公园
    "公囯里的空气很新鲜，让我感觉非常舒服。",                                  # 公囯 for 公园
    "跑步不仅，能让我健康，还能让 放松。",          # 还能让 _ 放松: object missing
    "我最喜欢的运动是跑步，跑步不仅能让我健康，还能让 放松。",   # same omission

    # --- 220SPiohH6o: degraded first reading ------------------------------------------------
    "还能够陪伴家的小孩子一起长大。",  # 家的小孩子: 里 missing (cue 09 has it right)

    # --- bi5wu3dds-M -----------------------------------------------------------------------
    "冷漠，爱自己，非常重要。",        # 冷漠 (indifferent) contradicts 爱自己
    "每天运动，吃健庚的食物。",        # 健庚 is not a word
    "再者，我们又有足够的休息和睡眠。",  # 又 is wrong here; cue 14 has the correct 也要有

    # --- ePWi8ETlN4Y -----------------------------------------------------------------------
    "如果不尽量只学书，就不会去大学学校。",            # not a sentence
    "如果天气不好，我就会去团书院书书室。",            # 团书院 / 书书室 are not words
    "如果天气不好，就不去困书房。",                    # 困书房 is not a word (图书馆)
    "如果好吃，就再吃点点。",                          # 吃点点 is a stutter
    "比如第二。",                                      # curriculum menu marker
    "例如八.",                                         # curriculum menu marker
    "例如九.",                                         # curriculum menu marker
    "例如十.",                                         # curriculum menu marker

    # --- IjuXvfFgXZE -----------------------------------------------------------------------
    "电扄是蓝色的。在教室的角落里有两个书架，书架上有各种类型的图书。",   # 电扄 is not a word
    "我非常喜欢读书，我也很喜欢我的教宿。",            # 教宿 is not a word
    "它很宽敞明亮，教宰里有三十个桌子和椅子。",        # 教宰 is not a word
    "电扅是蓝色的。",                                  # 电扅 is not a word
    "在教宿的角落里有两个书架，书架上有各种类型的图书。",   # 教宿 is not a word
    "我非常喜欢读书，我也很喜欢我的教宾。",            # 教宾 is not a word

    # --- IqgwURpdJBA -----------------------------------------------------------------------
    "冷目，我爸爸是工厂里的生产调度员，三十多岁，他不太高，",   # 冷目 is not a word
    "爸爸宽额头，方脸盘，眉眉毛，大眼睛，厚嘴唇，人人都夸得长得帅。",   # 眉眉毛; cues 05-08 read the same lines cleanly
    "三十多岁他不太高但长得很瘦把宽额头",              # 把宽额头 interrupts the sentence

    # --- IZrsZjmNxBc -----------------------------------------------------------------------
    "让一个人成熟的，不是年龄。而是经历，是能控制情绪的能量。",   # 能量 for 能力; cue 09 has it right

    # --- jwsV_-hYnt4 -----------------------------------------------------------------------
    "寺院里很安静，有很多大树。我看到了一桌很大的佛像，有些人在那里许愿。",   # 一桌 for 一尊

    # --- Jzu6F5dk5gE -----------------------------------------------------------------------
    "就给她报了渹永班",                        # 渹永 / 她 for 他
    "小铭，我给你报的渚永这样你可以玩水了",    # 小铭 / 渚永
    "小民喜欢玩水所以很高兴",                  # 小民 for 小明
    "小铣的妈妈想让儿子学会游泳，",            # 小铣 for 小明

    # --- oMz3ocdDgGw (一边…一边…): degraded second reading ---------------------------------
    "别有饭，就说话，",                # 别有饭 is not a word
    "为主第二。",                      # menu marker
    "我通常一遇，一会儿唱歌，",        # 一遇 / 一会儿 mix both patterns
    "别有开车，一时打电话。",          # 别有 / 一时
    "别有车车、一时叫电话，",          # 别有车车 / 叫电话
    "她一般是工作人员，一般玩电话。",  # 一般玩电话 is not a sentence
    "老板喜欢一边抽烟，一人工作。",    # 一人工作 is not a word
    "她一时在工作，一时去工作。",      # 一时…一时 is not the lesson's pattern here
    "她一日在工作、一日去工作，她一天在工作和工作。",   # degenerate
    "你可以一边做饭、一边听点台。",    # 听点台 is not a word
    "你还可以一边看电视、一面吃雷食。", # 一面 / 吃雷食
    "比如 十一",
    "比如 十二",
    "我们就去边说话",                  # degenerate
    "她随时一边煮饭、一边照顾儿童。",  # 随时 / 儿童 are not this lesson's pattern; cue 07 has it right

    # --- Q-sbgg7UJvY -----------------------------------------------------------------------
    "中末，我还打算去买一些冬天的衣服。",          # 中末 is not a word
    "月公司要派我去北京工作半年。听到这个消息，我非常开心。",   # truncated start
    "为了准备这次出差，我每天都在认真复许汉语。",  # 复许 is not a word

    # --- u7Kn6Wo8iZ0 -----------------------------------------------------------------------
    "办公室的\ufffd桌是干净了。",                  # U+FFFD
    "看着干准的楼子，说，",                        # 干准 / 楼子
    "我希望你们的头脑不要和现在的楼子一样。",      # 楼子 for 桌子
    "看着干准的\ufffd桌，说，",                    # U+FFFD
    "我希望你们的头脑不要和现在的标子一一样，",    # 标子 / 一一样
    "他非常不高兴地说，我希望你的思想不要和这儿的桌在一样。",   # 桌在 is not a word


    # --- Enw9IuaaYT4 -----------------------------------------------------------------------
    "冷目，我的妈妈，一米六五左右，不胖也不瘦。",  # 冷目 is not a word

    # --- YiQV3XO5JdM: both passes partly wrecked -------------------------------------------
    "开始，现在网上购物越来越流行，越来人喜欢在网上面购乌。",   # 越来人 / 购乌
    "现在在罐上，人们几乎什么都可以买到。",                     # 罐上 for 网上
    "现在网上购物越来越流行，越来人喜欢在网购购，比如说在淘宝网、",   # 越来人 / 网购购
    "现在在罐上，人们几乎什么都可以买到，你不仅可以在罚上买吃的东西，",   # 罐上 / 罚上
    "也可以在罒上乱穿的衣服，还可以在往上义用的东东西。",       # 罒上 / 往上义
    "只要你有手机和网络，就可以购乌。",                         # 购乌 for 购物
})


def apply_review_fixes(vid: str, zh: str, changes: list[dict]) -> str:
    """Apply the owner-reviewed homophone corrections for one cue.

    Only entries whose `scope` includes this video are eligible. Each successful replacement
    is appended to `changes` so `main` can print the exact audit table the owner reviews.
    """
    for find, replace, why, scope in REVIEW_ZH_FIXES:
        if vid not in scope or find not in zh:
            continue
        zh = zh.replace(find, replace)
        changes.append({"pack": vid, "find": find, "replace": replace,
                        "why": why, "after": zh})
    return zh


def is_junk_text(text: str) -> bool:
    """True when the segment is channel furniture, a menu, or degenerate repetition."""
    t = (text or "").strip()
    if not t:
        return True
    if is_hallucination(t):
        return True
    lowered = t.lower()
    if any(tok.lower() in lowered for tok in JUNK_TOKENS):
        return True
    if any(p.search(t) for p in JUNK_PATTERNS):
        return True
    return is_degenerate(t)


def is_foreign_contaminated(text: str) -> bool:
    """A segment the speaker delivered in Vietnamese/English rather than Chinese.

    Grammar videos on this channel interleave live Vietnamese narration
    ("ví dụ thứ ba" = example three) between the Chinese examples. That audio has no
    valid Chinese transcript, so the segment must be dropped rather than translated
    into a `zh` layer that is partly Latin.

    A Chinese sentence that merely contains an acronym is kept: Latin text is only
    disqualifying when it dominates the segment, or when Vietnamese diacritics appear
    (which are impossible in Chinese and therefore unambiguous).
    """
    t = (text or "").strip()
    if not t:
        return False
    if re.search(r"[ăâđêôơưĂÂĐÊÔƠƯạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]", t):
        return True
    latin = sum(len(w) for w in re.findall(r"[A-Za-z]{2,}", t))
    return latin >= 4 and latin > han_count(t)


def is_hallucination(text: str) -> bool:
    """Whisper artefacts: channel branding, its own prompt echo, invented acronyms.

    These strings are impossible in this channel's passage readings, so matching one is
    proof that the cue came from the intro music or the Vietnamese narration.
    """
    t = (text or "").strip()
    if not t:
        return True
    return any(p.search(t) for p in HALLUCINATION_PATTERNS)


def repeated_run_length(text: str, *, max_unit: int = 16) -> int:
    """Longest run of the same unit repeated consecutively ("首都首都首都" -> 3)."""
    t = text or ""
    n = len(t)
    best = 1
    for size in range(1, min(max_unit, n // 2) + 1):
        i = 0
        while i + size <= n:
            unit = t[i:i + size]
            if not unit.strip() or unit.strip() in "，。、！？；：…,.!?;: ":
                i += 1
                continue
            reps = 1
            while t[i + reps * size:i + (reps + 1) * size] == unit:
                reps += 1
            if reps > best:
                best = reps
            i += 1
    return best


def is_repetition(text: str, *, max_reps: int = 2) -> bool:
    """A cue whisper looped rather than transcribed speech.

    Two shapes, both impossible in a read passage:
      - the same unit three or more times in a row ("首都首都首都");
      - the same whole sentence twice in a row, when the unit is long enough to be a
        sentence rather than a word ("他小时候又矮，又瘦。他小时候又矮，又瘦。"). Reading
        aloud does not repeat a 6+ character sentence verbatim back to back.
    """
    t = text or ""
    if repeated_run_length(t) > max_reps:
        return True
    return repeated_run_length(t) >= 2 and _longest_run_unit(t) >= 6


def _longest_run_unit(text: str, *, max_unit: int = 16) -> int:
    """Length of the unit that repeats most often (0 when nothing repeats)."""
    t = text or ""
    n = len(t)
    best_reps, best_size = 1, 0
    for size in range(1, min(max_unit, n // 2) + 1):
        i = 0
        while i + size <= n:
            unit = t[i:i + size]
            if not unit.strip() or unit.strip() in "，。、！？；：…,.!?;: ":
                i += 1
                continue
            reps = 1
            while t[i + reps * size:i + (reps + 1) * size] == unit:
                reps += 1
            if reps > best_reps or (reps == best_reps and size > best_size):
                best_reps, best_size = reps, size
            i += 1
    return best_size if best_reps >= 2 else 0


def distinct_han_ratio(text: str) -> float:
    """Distinct Han characters over total Han characters -- the loop fingerprint.

    A hallucination on music repeats a handful of characters ("念念念念…", "聽來聽來…",
    "我乘车，我乘车…"), so the ratio collapses. Measured over all 176 packs on disk:
    every artefact sits at 0.03-0.31, while the lowest ratio in a genuine passage is 0.37.
    0.30 therefore separates them with margin on both sides.
    """
    han = [ch for ch in (text or "") if "\u3400" <= ch <= "\u9fff"]
    if not han:
        return 1.0
    return len(set(han)) / len(han)


LOOP_RATIO_MAX = 0.30
LOOP_MIN_HAN = 8


def is_loop_ratio(text: str) -> bool:
    """A long-enough run of text that reuses too few characters to be a real sentence."""
    han = sum(1 for ch in (text or "") if "\u3400" <= ch <= "\u9fff")
    return han >= LOOP_MIN_HAN and distinct_han_ratio(text) < LOOP_RATIO_MAX


def is_sentence_like(text: str) -> bool:
    """Passage text, as opposed to a title card, a channel sting or one vocabulary word."""
    t = (text or "").strip()
    return han_count(t) >= 5


def content_range(meta: dict, *, head_guard: float = 12.0,
                  min_head: float = 4.0) -> tuple[float, float, dict]:
    """The audio span that contains the passage, i.e. what should be decoded.

    Whisper hallucinates on the music/Vietnamese intro and on the outro sting, so that
    audio must never reach the model -- deleting artefacts afterwards is strictly worse
    than never generating them.

    Chapter shapes actually observed on this channel:
      ["<Untitled Chapter 1>", "Đọc lần 1 từng câu", "Từ vựng", "Đọc lần 2 cả đoạn"]
          -> the untitled chapter at 0 is the intro; content starts at chapter 1 (~17s).
      ["Nghe đọc lần một (có phiên âm)", "Từ vựng", "Nghe đọc lần hai"]
          -> chapter 0 IS the first reading. Nothing may be skipped, only the intro
             seconds before the speech are trimmed by the guard.
    So only an untitled / explicitly-intro chapter is skipped; the head guard is applied
    on top of it in both cases, because a chapter starting at 0.0 still contains the
    music sting before the first sentence.
    """
    dur = float(meta.get("duration") or 0)
    chapters = meta.get("chapters") or []
    info = {"source": "guard", "head": head_guard, "tail": dur}

    if chapters:
        first = chapters[0]
        title = (first.get("title") or "").strip()
        untitled = ((not title) or "<untitled" in title.lower()
                    or _looks_like_intro(title))
        if untitled and len(chapters) > 1:
            # Content begins at the next chapter, but never before the guard: a chapter
            # that starts at 0.0 does not mean the music ends there.
            head = max(float(chapters[1]["start"]), min(head_guard, dur * 0.2))
            info = {"source": "chapter", "head": head, "tail": dur}
            last = chapters[-1]
            if len(chapters) > 2 and _looks_like_outro((last.get("title") or "")):
                info["tail"] = float(last["start"])
                info["outroChapter"] = last.get("title")
            return head, info["tail"], info

    # No usable chapter: fall back to the measured time guard, unless the audio is too short
    # to spare it (in that case keep everything -- a truncated pack is worse than an intro).
    head = head_guard if dur > 60 else min_head
    return head, dur, info


def _looks_like_intro(title: str) -> bool:
    """A chapter title that means "this is the intro/branding", not content.

    Deliberately narrow. "Nghe đọc lần một" / "Đọc lần 1 …" are the FIRST READING OF THE
    PASSAGE -- the most valuable content in the video, not an intro. Treating them as intro
    threw away the whole first reading of 5KD4DU7PQWw (content 0-67s) and left only the
    second one.
    """
    t = (title or "").lower()
    return any(k in t for k in ("giới thiệu", "gioi thieu", "intro", "mở đầu", "mo dau",
                                "định nghĩa", "dinh nghia"))


def _looks_like_outro(title: str) -> bool:
    t = (title or "").lower()
    return any(k in t for k in ("kết thúc", "ket thuc", "outro", "tạm biệt", "tam biet",
                                "làm bài tập", "lam bai tap", "bài tập", "bai tap"))


def is_degenerate(text: str, *, max_unit: int = 12) -> bool:
    """Detect whisper's repetition loops ("来来来…", "我乘车,我乘车,我乘车…")."""
    t = text or ""
    n = len(t)
    for size in range(1, max_unit + 1):
        i = 0
        while i + size <= n:
            unit = t[i:i + size]
            if not unit.strip() or unit.strip() in "，。、！？；：…,.!?;: ":
                i += 1
                continue
            reps = 1
            while t[i + reps * size:i + (reps + 1) * size] == unit:
                reps += 1
            if (size >= 2 and reps >= 4) or (size == 1 and reps >= 6):
                return True
            i += 1
    return False


def is_menu_text(text: str) -> bool:
    """The curriculum menu ("1. 听和读… 2. 学习…") read out before every passage."""
    t = (text or "").strip()
    return any(tok in t for tok in MENU_TOKENS)


def filter_segments(segments: list[dict]) -> tuple[list[dict], dict]:
    """Drop intro furniture, menu segments, outros and repetition loops.

    Every video reads the same curriculum menu aloud before the passage, so the menu is the
    most reliable boundary marker. The passage starts right after the last menu segment in
    the opening; title cards and the Vietnamese intro precede it and the outro follows the
    passage. When a video has no menu, the first passage-like segment is used instead.
    """
    kept: list[dict] = []
    dropped_head = 0
    dropped_mid = 0

    menu_idx = [i for i, s in enumerate(segments)
                if is_menu_text(s.get("text") or "") and float(s["start"]) <= 40.0]
    start_idx = 0
    if menu_idx:
        start_idx = menu_idx[-1] + 1
    else:
        for i, s in enumerate(segments):
            if not is_junk_text(s.get("text") or "") and is_sentence_like(s.get("text") or ""):
                start_idx = i
                break

    # Skip any residual title cards / stings immediately after the menu.
    while start_idx < len(segments):
        text = (segments[start_idx].get("text") or "").strip()
        if is_junk_text(text) or not is_sentence_like(text):
            start_idx += 1
            continue
        break
    dropped_head = start_idx

    for seg in segments[start_idx:]:
        text = (seg.get("text") or "").strip()
        # Outside the intro only explicit junk is removed: a real sentence mis-heard as a
        # stutter is worth keeping, a repetition loop is not. A segment delivered in
        # Vietnamese is also removed — it has no valid Chinese transcript.
        if is_junk_text(text) or is_foreign_contaminated(text):
            dropped_mid += 1
            continue
        kept.append(seg)

    # Trailing furniture ("请观看《Penda Studio》的学习", "冷嗨")
    trimmed_tail = 0
    while kept and han_count(kept[-1].get("text") or "") < 4:
        kept.pop()
        trimmed_tail += 1

    return kept, {"droppedHead": dropped_head, "droppedMid": dropped_mid,
                  "droppedTail": trimmed_tail}


def detect_intro_end(meta: dict, mode: str, manual: float | None) -> float:
    """Skip the music/branding intro.

    `auto` uses the chapter list: most of these videos start with an untitled chapter
    (music + channel sting) and the first titled chapter marks the passage. A titled chapter
    that merely begins at 0 is NOT an intro, so `start == 0` alone must not count.
    """
    if manual is not None:
        return max(0.0, float(manual))
    if mode == "none":
        return 0.0
    chapters = meta.get("chapters") or []
    if len(chapters) >= 2:
        first = chapters[0]
        title = (first["title"] or "").strip()
        untitled = (not title) or "<untitled" in title.lower()
        if untitled and float(chapters[1]["start"]) <= 40:
            return float(chapters[1]["start"])
    return 0.0


# --------------------------------------------------------------------------------------
# 5. pinyin
# --------------------------------------------------------------------------------------

_PUNCT = set("，。、！？；：…（）【】《》“”‘’—,.!?;:()[]-~·")
_PUNCT_MAP = {"，": ",", "。": ".", "、": ",", "！": "!", "？": "?", "；": ";",
              "：": ":", "…": "…", "（": "(", "）": ")", "“": "\"", "”": "\"",
              "‘": "'", "’": "'", "《": "\"", "》": "\"", "【": "[", "】": "]"}
_SENTENCE_PUNCT = ".!?"


def _pinyin_word(word: str) -> str:
    """Pinyin for one Han word, syllables merged (今天 -> Jīntiān)."""
    from pypinyin import Style, lazy_pinyin  # noqa: PLC0415

    syls = lazy_pinyin(word, style=Style.TONE, errors=lambda x: list(x))
    syls = [s for s in syls if s and s.strip()]
    if not syls:
        return ""
    out = syls[0]
    for syl in syls[1:]:
        # 儿 as an erhua suffix attaches to the previous syllable: diǎn + r -> diǎnr
        if syl == "ér" and out and out[-1].isalpha():
            out += "r"
        else:
            out += syl
    return out


def _han_words(text: str) -> list[str]:
    """Segment Han text into words so pinyin groups match the existing packs."""
    try:
        import logging  # noqa: PLC0415
        import jieba  # noqa: PLC0415
        jieba.setLogLevel(logging.WARNING)
        # HMM=False keeps dictionary segmentation: HMM discovery merges neighbours such as
        # 今天天气 or 我选了 that the existing packs keep as separate words.
        return [w for w in jieba.cut(text, HMM=False) if w]
    except Exception:
        return list(text)


def to_pinyin(text: str) -> str:
    """Tone-mark pinyin in the style used by the existing cue packs.

    Word-grouped syllables, lowercase except sentence starts, ASCII sentence punctuation.
    """
    tokens: list[tuple[str, str]] = []      # (kind, value)
    i, n = 0, len(text)
    while i < n:
        ch = text[i]
        if HAN.match(ch):
            j = i
            while j < n and HAN.match(text[j]):
                j += 1
            for word in _han_words(text[i:j]):
                if HAN.match(word):
                    tokens.append(("word", _pinyin_word(word)))
                elif word.isalnum():
                    tokens.append(("word", word))
            i = j
        elif ch.isalnum():
            j = i
            while j < n and text[j].isalnum():
                j += 1
            tokens.append(("word", text[i:j]))
            i = j
        elif ch in _PUNCT_MAP or ch.isspace():
            if not ch.isspace():
                tokens.append(("punct", _PUNCT_MAP.get(ch, ch)))
            i += 1
        else:
            tokens.append(("punct", ch))
            i += 1

    out = ""
    capitalize = True
    for kind, val in tokens:
        if kind == "word":
            if not val:
                continue
            if out and not out.endswith((" ", "(", "[", "\"", "'")):
                out += " "
            if capitalize and val[0].isalpha():
                val = val[0].upper() + val[1:]
                capitalize = False
            out += val
        else:
            val = val.strip()
            if not val:
                continue
            out = out.rstrip() + val
            if val in _SENTENCE_PUNCT:
                capitalize = True
                out += " "
            elif val in ",;:":
                out += " "
    return re.sub(r"\s+", " ", out).strip()


# --------------------------------------------------------------------------------------
# 6. translation
# --------------------------------------------------------------------------------------

class HandTranslator:
    """vi/en supplied by the reasoning model that wrote them, not by a web service.

    The owner rejected Google gtx: it is an unvetted third-party machine translation that
    rendered 块钱 as "đô la" and produced literal, teaching-unsafe Vietnamese. Instead the
    translations live in a reviewable JSON file (tools/podcast-translations.json), authored
    deliberately per cue, and this class only maps zh -> vi/en from it.

    A cue with no entry is a hard error rather than an empty string, because shipping a cue
    with a blank layer is exactly the defect the QA gate rejects. Missing entries are
    reported with the full list so they can be authored -- never silently blanked.
    """

    name = "hand-authored"

    def __init__(self, path: Path):
        self.path = path
        self.data = read_json(path) if path.exists() else {}
        self.missing: dict[str, list[str]] = {}

    def translate(self, texts: list[str], tl: str) -> list[str]:
        out: list[str] = []
        missing: list[str] = []
        for zh in texts:
            entry = self.data.get(zh) or {}
            value = (entry.get(tl) or "").strip()
            if not value:
                missing.append(zh)
            out.append(value)
        if missing:
            self.missing.setdefault(tl, []).extend(missing)
        return out


class NullTranslator:
    name = "none"

    def translate(self, texts: list[str], tl: str) -> list[str]:
        return ["" for _ in texts]


def apply_currency_rule(zh: str, vi: str, en: str) -> tuple[str, str]:
    """块/元/人民币 mean RMB yuan, never US dollars.

    The machine translator renders 块钱 as "đô la"/"dollars". Rewrite those back unless the
    source really is USD (美元/美金), in which case the translation is left alone.

    The trigger is deliberately narrow -- a numeral followed by 块/元, or an explicit
    currency noun. Bare 钱 must NOT trigger: `又有钱` means "also has money", and its
    translation never mentions dollars in the first place.
    """
    if not zh:
        return vi, en
    if re.search(r"美元|美金|美圆|美圓", zh):
        return vi, en
    if not re.search(r"\d+\s*[块塊元]|[一二三四五六七八九十百千万半两几]+\s*[块塊元]"
                     r"|人民币|人民幣", zh):
        return vi, en

    vi = re.sub(r"\bđô\s*la\b", "tệ", vi, flags=re.I)
    vi = re.sub(r"\bUSD\b", "tệ", vi)
    vi = re.sub(r"\bđồng\s+đô\s+la\b", "nhân dân tệ", vi, flags=re.I)
    en = re.sub(r"\bdollars?\b", "yuan", en, flags=re.I)
    en = re.sub(r"\bUSD\b", "RMB", en)
    en = re.sub(r"\bUS\s+dollars?\b", "RMB", en, flags=re.I)
    return vi, en


def translate_cues(vid: str, cues: list[dict], translator, work: Path) -> list[dict]:
    """Fill vi/en from the authored map. A missing entry is an error, never a blank."""
    if isinstance(translator, NullTranslator):
        for cue in cues:
            cue["vi"] = ""
            cue["en"] = ""
        return cues

    zh_list = [c["zh"] for c in cues]
    for key in ("vi", "en"):
        values = translator.translate(zh_list, key)
        for cue, val in zip(cues, values):
            cue[key] = val

    missing = getattr(translator, "missing", {})
    if missing:
        # Do not write a pack with blank layers: QA rule 4 rejects it and a learner would see
        # an empty translation. Fail loudly with the exact sentences still to be authored.
        lines = [f"  [{lang}] {zh!r}" for lang, items in missing.items()
                 for zh in dict.fromkeys(items)]
        raise RuntimeError(
            "untranslated cues (author them in podcast-translations.json):\n"
            + "\n".join(lines[:40]))

    # Correct the systematic 块/元 -> dollar mistranslation on every cue.
    fixed = 0
    for cue in cues:
        vi, en = apply_currency_rule(cue["zh"], cue.get("vi") or "", cue.get("en") or "")
        if vi != (cue.get("vi") or "") or en != (cue.get("en") or ""):
            fixed += 1
        cue["vi"] = vi
        cue["en"] = en
    if fixed:
        log(f"  currency rule: corrected {fixed} cue(s)")
    return cues


# --------------------------------------------------------------------------------------
# 7. pack assembly + validation
# --------------------------------------------------------------------------------------

def level_from(*texts: str) -> int | None:
    for text in texts:
        m = re.search(r"HSK\s*[-_ ]?([1-6])", text or "", re.I)
        if m:
            return int(m.group(1))
    return None


def topic_from(title: str) -> str:
    body = title
    m = re.search(r"[】\]](.+)$", title)
    if m:
        body = m.group(1)
    body = body.strip(" -–—|")
    return body.strip()


def build_pack(vid: str, meta: dict, cues: list[dict], translator_name: str) -> dict:
    title = meta["title"]
    level = level_from(title, meta.get("description") or "")
    return {
        "id": vid,
        "youtubeId": vid,
        "channelHandle": CHANNEL_HANDLE,
        "title": title,
        # Persisted so the sidecar can be rebuilt from the packs alone, and so a re-run
        # can never re-derive a different topic for an already-written episode.
        "titleVi": title_vi(title, meta.get("description") or ""),
        "topic": topic_category(title),
        "level": level_display(level),
        "levelGroup": level_group(level),
        "durationSec": int(meta["duration"]),
        "cues": [
            {
                "start": c["start"],
                "end": c["end"],
                "en": c.get("en") or "",
                "zh": c["zh"],
                "pinyin": c["pinyin"],
                "vi": c.get("vi") or "",
            }
            for c in cues
        ],
    }


def validate_pack(pack: dict, allow_empty_translation: bool) -> list[str]:
    """Hard gate mirroring server/podcast-core.test.mjs. A pack that fails must not be written."""
    problems: list[str] = []
    for key in ("id", "youtubeId", "channelHandle", "title", "durationSec", "cues"):
        if key not in pack:
            problems.append(f"missing top-level key {key}")
    if pack.get("channelHandle") != CHANNEL_HANDLE:
        problems.append("channelHandle mismatch")
    if pack.get("id") != pack.get("youtubeId"):
        problems.append("id != youtubeId")
    cues = pack.get("cues") or []
    if not cues:
        problems.append("cue count is 0")
    prev_end = -1.0
    dur = float(pack.get("durationSec") or 0)
    for i, cue in enumerate(cues):
        for key in ("start", "end", "en", "zh", "pinyin", "vi"):
            if key not in cue:
                problems.append(f"cue {i}: missing {key}")
        s, e = cue.get("start"), cue.get("end")
        if not isinstance(s, float) or not isinstance(e, float):
            problems.append(f"cue {i}: start/end not float ({type(s).__name__})")
            continue
        if e <= s:
            problems.append(f"cue {i}: end<=start ({s}->{e})")
        if s < prev_end - 0.01:
            problems.append(f"cue {i}: overlapping start {s} < prev_end {prev_end}")
        prev_end = e
        zh = cue.get("zh") or ""
        if not has_han(zh):
            problems.append(f"cue {i}: zh has no Han characters")
        # The zh layer is the Chinese transcript. Latin/Vietnamese text there means the
        # speaker switched language (or ASR drifted) and the cue cannot be read as Chinese.
        foreign = FOREIGN_IN_ZH.search(zh)
        if foreign:
            problems.append(f"cue {i}: zh contains non-Chinese text {foreign.group(0)!r}")
        # the runtime assertion: podcastCore.toSimplifiedChinese(cue.zh) === cue.zh
        if canonical_simplified(zh) != zh:
            leftover = "".join(traditional_leftovers(zh))
            problems.append(f"cue {i}: zh is not Simplified (leftover Traditional: {leftover})")
        # 著 is absent from the app's 367-pair table (it is valid in 著作 but Traditional in
        # 长著), so it needs its own assertion or a Traditional particle would ship.
        elif fix_zhu(zh) != zh:
            problems.append(f"cue {i}: zh has Traditional 著 (zhe) that must be 着")
        if not (cue.get("pinyin") or "").strip():
            problems.append(f"cue {i}: empty pinyin")
        if not allow_empty_translation and (not (cue.get("vi") or "").strip()
                                            or not (cue.get("en") or "").strip()):
            problems.append(f"cue {i}: empty vi/en")
        if runtime_clean(zh) != zh:
            problems.append(f"cue {i}: zh changes under cleanSubtitleLineText")
    if cues and dur and cues[-1]["end"] > dur + 0.5:
        problems.append(f"last cue ends at {cues[-1]['end']} > durationSec {dur}")
    return problems


# --------------------------------------------------------------------------------------
# 8. sidecar
# --------------------------------------------------------------------------------------

def english_topic(title: str) -> str:
    """The English passage name from a title like '【HSK3 …】Going to the Laundromat'."""
    body = title or ""
    m = re.search(r"[】\]](.+)$", body)
    if m:
        body = m.group(1)
    body = body.strip(" -–—|")
    parts = re.split(r"\s+[-–—]\s+", body)
    if len(parts) > 1:
        body = parts[0]
    return body.strip() or title


def topic_category(title: str) -> str:
    """Short Vietnamese category chip, the way `topic` is used in the app UI.

    `topic` is rendered as a one-line label next to the channel name (see
    podcast.js: `ep.topic`), so it must be a category, never a copy of the title.
    """
    if re.search(r"NGỮ PHÁP|NGU PHAP|GRAMMAR", title or "", re.I):
        return "Ngữ pháp HSK 3"
    return "Luyện đọc HSK 3"


def level_display(level: int | None) -> str:
    """Manifest display label. This channel's passages are HSK 3 reading practice."""
    if not level:
        return "HSK 3+"
    if level <= 2:
        return "HSK 2"
    if level == 3:
        return "HSK 3+"
    return f"HSK {level}"


def level_group(level: int | None) -> str:
    """Only hsk1-2 | hsk3 | hsk4 | hsk5-6 are visible in the UI filter."""
    if not level or level <= 2:
        return "hsk1-2"
    if level == 3:
        return "hsk3"
    if level == 4:
        return "hsk4"
    return "hsk5-6"


def duration_label(seconds: int) -> str:
    s = max(0, int(seconds or 0))
    return f"{s // 60}:{s % 60:02d}"


# --- 他/她 homophone limitation ---------------------------------------------------------
#
# Mandarin 他 (he) and 她 (she) are homophones (tā). Whisper picks one from language-model
# priors, not from the audio, so it cannot be recovered from a transcript. Guessing from
# nearby words would silently rewrite the passage (and can corrupt it), so the importer
# deliberately does NOT change a single character. Instead it flags cues whose 他/她 conflicts
# with an explicit gender noun in the same cue, so the mismatch is visible rather than shipped
# silently. These are reported per pack and listed in the run report.
FEMALE_MARKERS = ("女儿", "妈妈", "母亲", "阿姨", "妻子", "太太", "姐姐", "妹妹",
                  "奶奶", "外婆", "姑娘", "女士", "女朋友", "女孩", "女生")
MALE_MARKERS = ("儿子", "爸爸", "父亲", "叔叔", "丈夫", "先生", "哥哥", "弟弟",
                "爷爷", "外公", "男孩", "男生", "男朋友")
MALE_PRONOUN = "他"
FEMALE_PRONOUN = "她"


def pronoun_conflicts(cues: list[dict]) -> list[dict]:
    """Cues whose 他/她 disagrees with an explicit gender noun in the same sentence.

    This only reports. It never edits `zh`: doing so would be guessing which of two
    identical-sounding characters the speaker said, and a wrong guess corrupts a sentence
    the learner will memorise.
    """
    found = []
    for i, cue in enumerate(cues):
        zh = cue.get("zh") or ""
        has_f = any(w in zh for w in FEMALE_MARKERS)
        has_m = any(w in zh for w in MALE_MARKERS)
        if has_f and not has_m and MALE_PRONOUN in zh:
            found.append({"cue": i, "start": cue.get("start"), "kind": "他 with female noun",
                          "zh": zh})
        elif has_m and not has_f and FEMALE_PRONOUN in zh:
            found.append({"cue": i, "start": cue.get("start"), "kind": "她 with male noun",
                          "zh": zh})
    return found


def _is_boilerplate(text: str) -> bool:
    """Channel/series furniture, not a topic: 'LUYỆN ĐỌC TIẾNG TRUNG', 'NGỮ PHÁP…'."""
    t = (text or "").upper()
    return any(k in t for k in ("LUYỆN ĐỌC", "LUYEN DOC", "NGỮ PHÁP", "NGU PHAP",
                                "CHINESE READING", "PRACTICE READING", "CHINESE GRAMMAR",
                                "GRAMMAR", "HSK"))


def title_vi(title: str, description: str = "") -> str:
    """Vietnamese topic taken from THIS title only.

    Every title on the channel carries its own topic, either before `||` or after the level
    prefix as `<han> - <Vietnamese>`. Deriving it per title is what keeps 讲故事 from ever
    picking up another episode's "đặt đồ ăn ngoài"; no cross-episode hint table is used.
    """
    body = re.sub(r"^\s*[【\[][^】\]]*[】\]]\s*", "", title or "").strip()

    parts = [p.strip() for p in re.split(r"\|\|", body) if p.strip()]
    if len(parts) >= 2 and not _is_boilerplate(parts[0]):
        return _tidy_vi(parts[0])

    parts = [p.strip() for p in re.split(r"\s+[-–—]\s+", parts[0] if parts else body) if p.strip()]
    if len(parts) >= 2:
        head, tail = parts[0], parts[-1]
        if has_han(head) and not has_han(tail):
            return _tidy_vi(tail)               # "去洗衣店 - Đi tiệm giặt là"
        if not _is_boilerplate(head):
            return _tidy_vi(head)               # "Tôi thích chạy bộ - LUYỆN ĐỌC…"

    if parts and not _is_boilerplate(parts[0]):
        return _tidy_vi(parts[0])

    # Last resort: the description states the topic in an uppercase Vietnamese quote.
    m = re.search(r'tiếng Việt là\s*"([^"]{2,80})"', description or "")
    if m:
        return _tidy_vi(m.group(1).title())
    m = re.search(r'là\s*"([^"]{2,80})"', description or "")
    if m:
        return _tidy_vi(m.group(1).title())
    return _tidy_vi(english_topic(title))


def _tidy_vi(text: str) -> str:
    t = re.sub(r"\s+", " ", (text or "").strip(" -–—|.。,，"))
    return t[:1].upper() + t[1:] if t else ""


def episode_record(summary: dict, pack: dict | None = None) -> dict:
    vid = summary["youtubeId"]
    level = summary.get("level")
    return {
        # Stable, collision-proof, and survives re-translation of the title.
        "id": f"ep-ps-{vid.lower()}",
        "youtubeId": vid,
        "title": summary["title"],
        "titleVi": summary.get("titleVi") or "",
        "durationSec": summary["durationSec"],
        "durationLabel": duration_label(summary["durationSec"]),
        "level": level_display(level),
        "levelGroup": level_group(level),
        "topic": summary.get("topic") or "",
        "cuesCount": summary["cuesCount"],
        "cuesUrl": f"content/podcast/cues/{vid}.json",
    }


def scan_panda_packs(cues_dir: Path) -> list[dict]:
    """Read every cue pack this importer owns, straight from disk."""
    packs = []
    for path in sorted(cues_dir.glob("*.json")):
        try:
            pack = read_json(path)
        except Exception:  # a corrupt or unrelated json must not break the rebuild
            continue
        if not isinstance(pack, dict) or pack.get("channelHandle") != CHANNEL_HANDLE:
            continue
        packs.append(pack)
    return packs


def record_from_pack(pack: dict) -> dict:
    """Build a sidecar entry from a written pack, so the sidecar can never lag the disk."""
    return episode_record({
        "youtubeId": pack["youtubeId"],
        "title": pack.get("title") or "",
        "titleVi": pack.get("titleVi") or "",
        "durationSec": int(pack.get("durationSec") or 0),
        "level": level_from(pack.get("title") or ""),
        "topic": pack.get("topic") or "",
        "cuesCount": len(pack.get("cues") or []),
    }, pack)


def rebuild_sidecar(path: Path, cues_dir: Path) -> tuple[int, int]:
    """Rewrite the sidecar from the packs on disk. Returns (entries, panda packs)."""
    packs = scan_panda_packs(cues_dir)
    by_vid = {p["youtubeId"]: record_from_pack(p) for p in packs}
    merged = sorted(by_vid.values(), key=lambda e: (
        e.get("levelGroup") or "", e.get("title") or "", e.get("youtubeId") or ""))
    write_json(path, merged, trailing_newline=True)
    return len(merged), len(packs)


# --------------------------------------------------------------------------------------
# 9. main pipeline
# --------------------------------------------------------------------------------------

def process_video(vid: str, opts, model, translator, repo: Path) -> dict:
    work = Path(opts.work_dir) if opts.work_dir else Path(tempfile.gettempdir()) / "panda-studio-import"
    cue_path = repo / "content" / "podcast" / "cues" / f"{vid}.json"
    started = time.time()
    summary = {"youtubeId": vid, "status": "ok", "warnings": []}

    if cue_path.exists() and vid in PROTECTED_IDS:
        pack = read_json(cue_path)
        summary.update({
            "status": "protected",
            "title": pack.get("title", ""),
            "titleVi": pack.get("titleVi", ""),
            "durationSec": pack.get("durationSec", 0),
            "level": level_from(pack.get("title") or ""),
            "topic": pack.get("topic", ""),
            "cuesCount": len(pack.get("cues") or []),
            "cuesPath": str(cue_path),
        })
        if opts.force:
            summary["warnings"].append(
                "PROTECTED: --force ignored; this pack was approved after human review")
            log(f"  PROTECTED: refusing to rebuild {cue_path.name} even with --force")
        else:
            log(f"  exists, protected (never rebuilt): {cue_path.name}")
        return summary

    if cue_path.exists() and not opts.force:
        pack = read_json(cue_path)
        summary.update({
            "status": "skipped-existing",
            "title": pack.get("title", ""),
            "titleVi": pack.get("titleVi", ""),
            "durationSec": pack.get("durationSec", 0),
            "level": level_from(pack.get("title") or ""),
            "topic": pack.get("topic", ""),
            "cuesCount": len(pack.get("cues") or []),
            "cuesPath": str(cue_path),
        })
        log(f"  exists, skipped (use --force to rebuild): {cue_path.name}")
        return summary

    meta = fetch_metadata(vid, work, opts.refresh_metadata)
    if not meta["duration"]:
        meta["duration"] = 0
    log(f"  title: {meta['title']}")
    log(f"  duration: {meta['duration']}s, chapters: "
        f"{[(round(c['start']), c['title'][:28]) for c in meta['chapters']]}")

    audio = download_audio(vid, work, ffmpeg_dir=opts.ffmpeg_dir, max_bytes=opts.max_audio_size)
    summary["audioBytes"] = audio.stat().st_size

    # Decide the content span BEFORE decoding. The intro (music + Vietnamese branding) and
    # the outro are never sent to the model, so their hallucinations are never generated.
    decode_from, decode_to, span = content_range(
        meta, head_guard=opts.head_guard)
    summary["decodeFrom"] = round(decode_from, 2)
    summary["decodeTo"] = round(float(decode_to or meta["duration"] or 0), 2)
    summary["contentRange"] = span
    log(f"  content span: {summary['decodeFrom']}s -> {summary['decodeTo']}s "
        f"({span.get('source')})")

    segments, info = get_segments(vid, audio, work, model, opts,
                                  decode_from=decode_from, decode_to=decode_to)
    if info.get("language") and info["language"] != "zh":
        summary["warnings"].append(f"ASR language was {info['language']}")

    # Remove intro branding, the curriculum menu, outros and repetition loops BEFORE
    # segmenting, so no junk token can ever be merged into a real sentence.
    raw_count = len(segments)
    segments, junk = filter_segments(segments)
    summary["segmentsRaw"] = raw_count
    summary["segmentsKept"] = len(segments)
    summary["junk"] = junk
    if junk["droppedHead"] or junk["droppedMid"] or junk["droppedTail"]:
        log(f"  ASR filter: -{junk['droppedHead']} intro, -{junk['droppedMid']} junk, "
            f"-{junk['droppedTail']} tail segment(s)")
    if not segments:
        raise RuntimeError("every ASR segment was filtered out as non-passage audio")

    intro_end = detect_intro_end(meta, opts.intro_mode, opts.skip_before)
    skip_windows: list[tuple[float, float]] = []
    if opts.exclude_chapter and opts.exclude_chapter.lower() != "none":
        pattern = re.compile(opts.exclude_chapter, re.I)
        chapters = meta["chapters"]
        dropped = []
        for i, ch in enumerate(chapters):
            if not pattern.search(ch["title"] or ""):
                continue
            start = max(0.0, float(ch["start"]))
            end = float(chapters[i + 1]["start"]) if i + 1 < len(chapters) else float(meta["duration"] or 1e9)
            skip_windows.append((start, end))
            dropped.append(ch["title"])
        if dropped:
            summary["warnings"].append(f"excluded chapters {dropped}")
    cues = build_cues(segments, float(meta["duration"] or 0),
                      max_chars=opts.max_chars, pause=opts.pause, min_dur=opts.min_dur,
                      skip_before=intro_end, skip_windows=skip_windows)
    summary["introEnd"] = intro_end
    summary["rawCues"] = len(cues)
    if not cues:
        raise RuntimeError("no cues survived segmentation")

    # Cue-level gates. Applied before translation so no translator call is wasted on a cue
    # that cannot ship.
    cues, cue_stats = drop_bad_cues(cues)
    summary["cueDrops"] = cue_stats
    if cue_stats["hallucination"] or cue_stats["repetition"] or cue_stats["duplicate"]:
        log(f"  cue gate: -{cue_stats['hallucination']} hallucination, "
            f"-{cue_stats['repetition']} repetition, -{cue_stats['duplicate']} duplicate")
    cues, merged, micro_dropped = enforce_min_cue_duration(cues, min_seconds=opts.min_cue_seconds)
    summary["microMerged"] = merged
    summary["microDropped"] = micro_dropped
    if merged or micro_dropped:
        log(f"  micro-cue gate: {merged} merged into neighbour, "
            f"{micro_dropped} isolated blip(s) dropped")
    if not cues:
        raise RuntimeError("no cues survived the cue-level gates")

    # --- Simplified-Chinese gate: drop (never write) cues the runtime validator would reject.
    dropped = 0
    rewritten = 0
    kept: list[dict] = []
    for cue in cues:
        original = cue["zh"]
        fixed = to_simplified(original)
        leftover = traditional_leftovers(fixed)
        if leftover:
            dropped += 1
            summary["warnings"].append(
                f"dropped cue at {cue['start']}s, Traditional left: {''.join(leftover)}")
            continue
        if fixed != original:
            rewritten += 1
        cue["zh"] = fixed
        kept.append(cue)
    cues = kept
    summary["zhDropped"] = dropped
    summary["zhRewritten"] = rewritten
    if dropped or rewritten:
        log(f"  Simplified gate: {rewritten} rewritten, {dropped} dropped")
    if not cues:
        raise RuntimeError("all cues were dropped by the Simplified-Chinese gate")

    # --- owner-reviewed corrections: drop unrecoverable furniture, then fix homophones.
    # This runs after segmentation and before pinyin, so pinyin, vi and en all inherit the
    # corrected characters instead of the ASR ones.
    reviewed: list[dict] = []
    kept_cues: list[dict] = []
    for cue in cues:
        before = cue["zh"]
        staged: list[dict] = []
        after = apply_review_fixes(vid, before, staged)
        if before in REVIEW_DROPS or after in REVIEW_DROPS:
            reviewed.append({"pack": vid, "find": before, "replace": None,
                             "why": "unrecoverable ASR (listed in REVIEW_DROPS)",
                             "after": None})
            continue
        reviewed.extend(staged)
        cue["zh"] = after
        kept_cues.append(cue)
    cues = kept_cues
    summary["reviewChanges"] = reviewed
    if reviewed:
        log(f"  review: {sum(1 for c in reviewed if c['replace'])} homophone fix(es), "
            f"{sum(1 for c in reviewed if not c['replace'])} drop(s)")
    if not cues:
        raise RuntimeError("all cues were dropped by the review table")

    for cue in cues:
        cue["pinyin"] = to_pinyin(cue["zh"])
        if not cue["pinyin"]:
            summary["warnings"].append("empty pinyin on a cue")

    cues = translate_cues(vid, cues, translator, work)
    empty_vi = sum(1 for c in cues if not c.get("vi"))
    empty_en = sum(1 for c in cues if not c.get("en"))
    if empty_vi or empty_en:
        summary["warnings"].append(f"empty translations vi={empty_vi} en={empty_en}")

    # 他/她 is a homophone ASR cannot resolve; report conflicts instead of guessing.
    conflicts = pronoun_conflicts(cues)
    if conflicts:
        summary["pronounConflicts"] = conflicts
        summary["warnings"].append(
            f"{len(conflicts)} cue(s) where 他/她 disagrees with an explicit gender noun "
            f"(left unchanged: homophone, not recoverable from audio)")

    pack = build_pack(vid, meta, cues, getattr(translator, "name", "?"))
    problems = validate_pack(pack, allow_empty_translation=isinstance(translator, NullTranslator))
    if problems:
        summary["warnings"].extend(problems)
        if not opts.allow_invalid:
            raise RuntimeError("validation failed: " + "; ".join(problems[:6]))

    write_json(cue_path, pack)
    level = level_from(meta["title"], meta["description"])
    # Coverage. Two numbers, because they answer different questions:
    #   runtime  = cues / durationSec. This format is a *lesson*, not a continuous read:
    #              the four packs QA graded excellent sit at 32-40% because the speaker
    #              pauses to explain between sentences (the 146 older packs are continuous
    #              subtitles at ~97%, so they are not comparable). A literal 60% runtime
    #              bar would reject the approved reference standard.
    #   content  = spoken time / (last_end - first_start). This measures whether the
    #              transcribed span is densely filled -- i.e. whether sentences are missing
    #              from the middle of the lesson -- which is the defect QA actually saw
    #              (Enw9IuaaYT4 at 18%, IZrsZjmNxBc with a 108s hole).
    # WEAK is therefore judged on content density, calibrated against the approved packs
    # (41-50%): below 30% the transcript is genuinely sparse.
    spoken = sum(max(0.0, c["end"] - c["start"]) for c in pack["cues"])
    first, last = pack["cues"][0]["start"], pack["cues"][-1]["end"]
    span = last - first
    coverage = round(spoken / pack["durationSec"], 3) if pack["durationSec"] else 0.0
    density = round(spoken / span, 3) if span > 0 else 0.0
    gaps = [pack["cues"][i + 1]["start"] - pack["cues"][i]["end"]
            for i in range(len(pack["cues"]) - 1)]
    max_gap = round(max(gaps), 2) if gaps else 0.0
    weak = density < 0.30
    summary.update({
        "title": pack["title"],
        "titleVi": pack["titleVi"],
        "durationSec": pack["durationSec"],
        "durationLabel": duration_label(pack["durationSec"]),
        "level": level,
        "levelLabel": pack["level"],
        "levelGroup": pack["levelGroup"],
        "topic": pack["topic"],
        "cuesCount": len(pack["cues"]),
        "firstStart": first,
        "lastEnd": last,
        "coverage": coverage,
        "density": density,
        "maxGap": max_gap,
        "coverageVerdict": "WEAK" if weak else "OK",
        "cuesPath": str(cue_path),
        "bytes": cue_path.stat().st_size,
        "translator": getattr(translator, "name", "?"),
        "elapsedSec": round(time.time() - started, 1),
    })
    if weak:
        summary["warnings"].append(
            f"WEAK density: cues fill {density:.0%} of the transcribed span "
            f"({coverage:.0%} of runtime)")
        log(f"  WARNING weak density: {density:.0%} of content span "
            f"({coverage:.0%} of runtime)")
    log(f"  wrote {cue_path.name}: {len(pack['cues'])} cues, "
        f"{pack['cues'][0]['start']}s -> {pack['cues'][-1]['end']}s "
        f"({cue_path.stat().st_size / 1024:.0f} KB, {summary['elapsedSec']}s)")
    return summary


def parse_args(argv: list[str] | None = None):
    here = Path(__file__).resolve().parent
    ap = argparse.ArgumentParser(
        prog="podcast-import-panda-studio.py",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        description=__doc__.split("\n\n")[0],
        epilog="Read the module docstring for the full pipeline description.",
    )
    sel = ap.add_argument_group("selection")
    sel.add_argument("--ids", help="comma-separated YouTube ids (skips channel enumeration)")
    sel.add_argument("--limit", type=int, help="process at most N videos from the channel (newest first)")
    sel.add_argument("--match", help="only titles matching this regex (case-insensitive substring ok)")
    sel.add_argument("--max-duration", type=int, help="skip videos longer than N seconds")
    sel.add_argument("--min-duration", type=int, help="skip videos shorter than N seconds")
    sel.add_argument("--sort", choices=["channel", "duration", "title"], default="channel",
                     help="order before --limit (default: channel order, newest first)")

    asr = ap.add_argument_group("transcription")
    asr.add_argument("--model", default="small", help="faster-whisper model (default: small)")
    asr.add_argument("--device", default="cpu", help="cpu or cuda (default: cpu)")
    asr.add_argument("--compute-type", default="int8", help="int8 / float32 / int8_float32 (default: int8)")
    asr.add_argument("--beam-size", type=int, default=5)
    asr.add_argument("--threads", type=int, default=min(8, os.cpu_count() or 4),
                     help="CPU threads for faster-whisper (default: min(8, cores))")
    asr.add_argument("--initial-prompt", default="",
                     help="initial prompt for whisper; leave empty (default) — a non-empty "
                          "prompt is echoed back as fake content on this channel's audio")
    asr.add_argument("--refresh-asr", action="store_true", help="ignore cached ASR output")
    asr.add_argument("--no-repeat-ngram-size", type=int, default=3,
                     help="ban repeated n-grams during decoding to stop whisper's repetition "
                          "loops (default: 3; 0 disables)")
    asr.add_argument("--refresh-metadata", action="store_true",
                     help="re-fetch yt-dlp metadata instead of using the cached dump")

    seg = ap.add_argument_group("segmentation")
    seg.add_argument("--max-chars", type=int, default=46, help="target Han characters per cue")
    seg.add_argument("--pause", type=float, default=1.1, help="pause in seconds that ends a cue")
    seg.add_argument("--min-dur", type=float, default=0.3, help="minimum cue duration in seconds")
    seg.add_argument("--intro-mode", choices=["auto", "none"], default="auto",
                     help="auto: skip the leading untitled chapter (music + channel sting)")
    seg.add_argument("--head-guard", type=float, default=12.0,
                     help="seconds at the start never sent to whisper when a video has no "
                          "usable chapter (default: 12; measured safe on this channel)")
    seg.add_argument("--min-cue-seconds", type=float, default=1.0,
                     help="cues shorter than this are merged into their neighbour "
                          "(default: 1.0)")
    seg.add_argument("--skip-before", type=float, default=None,
                     help="explicit seconds of intro to drop (overrides --intro-mode)")
    seg.add_argument("--exclude-chapter", default=DEFAULT_EXCLUDE_CHAPTER,
                     help="drop cues from chapters whose title matches this regex "
                          "(default: the vocabulary chapter; pass 'none' to keep it)")

    tr = ap.add_argument_group("translation")
    tr.add_argument("--translator", choices=["hand", "none"], default="hand",
                    help="hand: map vi/en from tools/podcast-translations.json (authored, "
                         "no network); none: leave vi/en empty")
    tr.add_argument("--translations", default=None,
                    help="path to the hand-authored zh -> {vi,en} mapping "
                         "(default: <repo>/tools/podcast-translations.json)")
    tr.add_argument("--no-translate", action="store_true", help="alias for --translator none")

    out = ap.add_argument_group("output")
    out.add_argument("--repo-root", default=str(here.parent), help="repo root (default: script parent)")
    out.add_argument("--work-dir", default=None,
                     help="cache dir for audio/ASR/translations (default: system temp)")
    out.add_argument("--force", action="store_true",
                     help="rebuild cue packs that already exist; IGNORED for owner-approved "
                          "packs (PROTECTED_IDS), which are never rebuilt")
    out.add_argument("--allow-invalid", action="store_true", help="write even if validation complains")
    out.add_argument("--report", help="write a JSON run report to this path")

    net = ap.add_argument_group("network politeness")
    net.add_argument("--sleep", type=float, default=DEFAULT_SLEEP,
                     help=f"seconds between videos (default: {DEFAULT_SLEEP:g})")
    net.add_argument("--max-audio-size", default=MAX_AUDIO_BYTES, help="yt-dlp --max-filesize")
    net.add_argument("--ffmpeg", help="path to ffmpeg (default: imageio-ffmpeg, then PATH)")
    net.add_argument("--ffmpeg-dir", help="--ffmpeg-location passed to yt-dlp")
    net.add_argument("--refresh-channel", action="store_true", help="bypass the 6h channel cache")

    misc = ap.add_argument_group("misc")
    misc.add_argument("--dry-run", action="store_true", help="list what would be processed, then exit")
    misc.add_argument("--verbose", action="store_true")
    return ap.parse_args(argv)


def select_videos(opts, work: Path) -> list[dict]:
    if opts.ids:
        entries = [{"id": v.strip(), "duration": 0, "title": ""}
                   for v in opts.ids.split(",") if v.strip()]
    else:
        entries = enumerate_channel(None, work / "channel.json", opts.refresh_channel)
    if opts.match:
        pattern = re.compile(opts.match, re.I)
        entries = [e for e in entries if pattern.search(e.get("title") or "")]
    if opts.min_duration:
        entries = [e for e in entries if not e.get("duration") or e["duration"] >= opts.min_duration]
    if opts.max_duration:
        entries = [e for e in entries if not e.get("duration") or e["duration"] <= opts.max_duration]
    if opts.sort == "duration":
        entries = sorted(entries, key=lambda e: (e.get("duration") or 0, e["id"]))
    elif opts.sort == "title":
        entries = sorted(entries, key=lambda e: (e.get("title") or "", e["id"]))
    if opts.limit:
        entries = entries[:opts.limit]
    return entries


def main(argv: list[str] | None = None) -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    opts = parse_args(argv)

    repo = Path(opts.repo_root).resolve()
    if not (repo / "content" / "podcast").is_dir():
        log(f"error: {repo} does not look like the HSK repo (content/podcast missing)")
        return 2

    if opts.no_translate:
        opts.translator = "none"
    if opts.work_dir:
        work = Path(opts.work_dir).expanduser().resolve()
    else:
        work = Path(tempfile.gettempdir()) / "panda-studio-import"
    work.mkdir(parents=True, exist_ok=True)
    opts.work_dir = str(work)

    entries = select_videos(opts, work)
    log(f"selected {len(entries)} video(s); work dir: {work}")
    if opts.dry_run:
        for e in entries:
            log(f"  {e['id']}  {e.get('duration') or '?':>5}s  {e.get('title') or ''}")
        return 0
    if not entries:
        log("nothing to do")
        return 0

    if opts.translator == "none":
        translator = NullTranslator()
        log("translation DISABLED: vi/en will be written as empty strings")
    else:
        tpath = Path(opts.translations) if opts.translations else (
            repo / "tools" / "podcast-translations.json")
        translator = HandTranslator(tpath)
        log(f"translation: hand-authored map ({tpath.name}, "
            f"{len(translator.data)} entries); no network MT")

    log(f"loading whisper model '{opts.model}' (device={opts.device}, {opts.compute_type})…")
    model = load_model(opts.model, opts.device, opts.compute_type, opts.threads)

    t_all = time.time()
    results = []
    for idx, entry in enumerate(entries, 1):
        vid = entry["id"]
        log(f"\n[{idx}/{len(entries)}] {vid}")
        try:
            summary = process_video(vid, opts, model, translator, repo)
        except Exception as exc:  # one failure must not abort the batch
            log(f"  FAILED: {exc}")
            results.append({"youtubeId": vid, "status": "failed", "error": str(exc)[:2000]})
            continue
        results.append(summary)
        if summary.get("cuesCount") and (summary.get("level") or 3) <= 2:
            summary["warnings"].append(
                "level outside this channel batch scope (HSK 3)")
            log("  WARNING: HSK 2 video detected — cue pack kept, excluded from sidecar")
        if idx < len(entries):
            time.sleep(max(0.0, opts.sleep))

    sidecar = repo / "content" / "podcast" / "panda-studio-episodes.json"
    # Rebuild from the packs on disk, never from an in-memory list: the sidecar can then
    # never lag behind what was actually written (and re-running cannot duplicate entries).
    entries_written, panda_packs = rebuild_sidecar(sidecar, repo / "content" / "podcast" / "cues")
    log(f"\nsidecar rebuilt from disk: {sidecar}")
    log(f"  panda packs on disk: {panda_packs}  |  sidecar entries: {entries_written}")
    if entries_written != panda_packs:
        log(f"  ERROR: sidecar/disk mismatch ({entries_written} != {panda_packs})")
        return 3

    ok = [r for r in results if r["status"] == "ok"]
    failed = [r for r in results if r["status"] == "failed"]
    skipped = [r for r in results if r["status"] == "skipped-existing"]
    elapsed = round(time.time() - t_all, 1)
    log("\n" + "=" * 72)
    log(f"done in {elapsed}s: {len(ok)} imported, {len(skipped)} skipped, {len(failed)} failed")
    for r in ok:
        cov = r.get("coverage")
        den = r.get("density")
        cov_s = f"{cov:4.0%}" if isinstance(cov, float) else "   ?"
        den_s = f"{den:4.0%}" if isinstance(den, float) else "   ?"
        flag = "  WEAK" if r.get("coverageVerdict") == "WEAK" else ""
        log(f"  OK   {r['youtubeId']:12s} {r['cuesCount']:3d} cues  {r['firstStart']:6.2f}-"
            f"{r['lastEnd']:7.2f}s  run={cov_s} span={den_s} gap={r.get('maxGap', 0):5.1f}s  "
            f"{r.get('bytes', 0) // 1024:4d} KB  {r.get('elapsedSec', 0):5.1f}s{flag}")
    if ok:
        per_video = round(sum(r.get("elapsedSec", 0) for r in ok) / len(ok), 1)
        log(f"  mean per-video processing time: {per_video}s")
    for r in failed:
        log(f"  FAIL {r['youtubeId']:12s} {r['error'][:160]}")
    if isinstance(translator, NullTranslator):
        log("  NOTE: vi/en left empty (--no-translate) — no translations were fabricated.")
    else:
        log(f"  translations: {translator.name} machine translation "
            f"({getattr(translator, 'calls', 0)} HTTP calls)")

    if opts.report:
        write_json(Path(opts.report), {
            "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "model": opts.model, "translator": getattr(translator, "name", "?"),
            "elapsedSec": elapsed, "results": results,
        }, trailing_newline=True)
        log(f"report: {opts.report}")
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
