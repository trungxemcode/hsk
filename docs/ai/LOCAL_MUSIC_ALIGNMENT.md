# Local music alignment fallback

This owner-operated fallback handles tracks where ASR omitted sung lines. It does not run on Cloudflare Workers. The Windows machine must remain awake during inference. Public playback remains native R2 audio; neither the audio nor frontend is modified.

Use a separate Python environment with stable-ts 2.19.1 and compatible PyTorch. The observed task environment uses torch 2.14.1, Python 3.14 and four CPU threads. Do not copy environment packages, models, transcripts, account tokens or temporary preview capabilities into Git.

`tools/align-music-local.py --jobs PRIVATE_JOBS_JSON --output-dir PRIVATE_RESULTS_DIR --model small --model-cache PRIVATE_MODEL_CACHE --ffmpeg FFMPEG_EXE --threads 4` generates candidates. Run the same command with `--model medium` afterwards. Each job contains videoId, trackId, audioPath, audioSha256, referenceLines and duration. Model results and identity/confidence metadata are checkpointed per track. A successful model run is not a publication decision.

`server/music/forced-alignment-proof.mjs` verifies identical source audio/transcript identities, complete canonical text, bounded monotonic timestamps, confidence and independent model onset agreement. Pinyin references still pass the existing phonetic check. Audio-generated references are explicitly marked generatedFromAudio. Character timing is retained only when both models corroborate individual observed character onsets; otherwise the cue follows the observed line. No equal-time division or timestamp averaging is permitted. Publication remains an owner-authorized conditional create and never replaces existing public lyrics.

The temporary owner preview used during the Moah repair has a per-session random capability plus authenticated Wrangler preview access. It is not a production API. Its capability and request data stay outside the repository. Stop the preview and remove its session capability when operations finish. Keep raw model evidence private. Deleting a track also removes forced-small.json, forced-medium.json and forced-proof.json.

The private task workspace is C:/Users/LENOVO/hsk-lyrics/forced-align. Inspect publication-status.json and actual public lyrics before reporting a track complete. Never describe failed terminal jobs as still running, and never claim that these local CPU jobs continue when the Windows machine is off.
