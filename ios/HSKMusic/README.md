# HSK Music for iPhone — native audio shell

This is **not** a PWA fix. It is a lightweight iOS host for the existing
https://trungxemcode.github.io/hsk/ app with an iOS **AVPlayer** that owns
background playback, even when the WKWebView JavaScript thread is suspended.
It intentionally keeps the existing HSK web login, menus, playlists, and
learning flows; only online YouTube M4A transport is native.

The native player uses:
- `AVAudioSession.Category.playback` (activated when playback is requested)
- `UIBackgroundModes = audio` configured in project.yml
- `AVPlayer` + `MPRemoteCommandCenter` + `MPNowPlayingInfoCenter`
- A main-frame-only WKWebView script bridge, restricted to
  `https://trungxemcode.github.io`.
- HTTPS media from `*.googlevideo.com` or the configured HSK relay.
  No media data are permanently saved and bearer tokens are never passed to
  native, except the ephemeral audio URLs already resolved by the HSK site.

## Build / install

1. On a **Mac with Xcode** install XcodeGen: `brew install xcodegen`.
2. From repo root:
   `xcodegen generate --spec ios/HSKMusic/project.yml --project ios/HSKMusic`
3. Open `ios/HSKMusic/HSKMusic.xcodeproj` in Xcode.
4. Set **Signing & Capabilities → Team** for your Apple account,
   and verify Background Modes → Audio is enabled by `project.yml`.
5. Pick your physical iPhone as build destination and install with Xcode,
   or distribute a signed release through TestFlight if your developer
   account supports it. The CI simulator build is **unsigned and cannot
   be installed directly on iPhone**.

The website is unchanged for users opening it in Safari / PWA. Installing
the GitHub Pages PWA does **not** grant native iOS background privileges.

## What this fixes — and what it doesn't

An AVPlayer-backed iOS app can continue **the current playable M4A track**
while switched to another app or while the screen is locked, and show native
Play/Pause/seek controls on the lock screen. It is still subject to iOS audio
interruptions (calls, AirPlay changes, user pauses, or force quit). Playlist
auto-next while backgrounded is **not guaranteed** in this initial version;
the web JS may be suspended before the next item is resolved. The native
audio bridge deliberately never claims to extract or download blocked
YouTube videos. It cannot play a track if the AWS resolver returns
`Sign in to confirm you're not a bot`, 403, or other source failures.
It does not block ads inside official YouTube/SoundCloud players.

## Manual acceptance on physical iPhone

1. Open native HSK Music (not Safari/PWA), sign in, and play a
   **known-working M4A source**.
2. Verify native iOS lock screen shows track name and Play/Pause.
3. Tap Home / switch app, lock screen, wait at least 2 min, confirm
   continuous audible playback and elapsed time moving forward.
4. Pause and resume with hardware/headset/Control Center.
5. Return to HSK, seek 10 s; switch track; verify previous audio stops.
6. Sign out and confirm previous account's audio stops immediately.
7. Separately test a YouTube video known to be blocked by AWS;
   verify error and that no phantom/silent playback is reported.

**No unconditional guarantees:** iOS can stop user-force-quit apps and
background execution for reasons outside HSK. This is the supported native
background-audio architecture, not a workaround to force PWA lifetime.
