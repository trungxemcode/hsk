import AVFoundation
import MediaPlayer
import UIKit

/// System-owned playback continues when the WKWebView or JS thread is suspended.
/// This plays only a validated HTTPS audio URL returned by the HSK app after auth.
@MainActor
final class HSKNativePlayer {
    private let player = AVPlayer()
    private let notify: ([String: Any]) -> Void
    private var currentSession = ""
    private var title = "HSK Music"
    private var artist = ""
    private var directURL: URL?
    private var relayURL: URL?
    private var didFallback = false
    private var wantsPlayback = false
    private var looping = false
    private var rate: Float = 1
    private var statusObserver: NSKeyValueObservation?
    private var periodicToken: Any?
    private var endObserver: NSObjectProtocol?
    private var timeControlObserver: NSKeyValueObservation?

    init(notify: @escaping ([String: Any]) -> Void) {
        self.notify = notify
        player.actionAtItemEnd = .pause
        periodicToken = player.addPeriodicTimeObserver(
            forInterval: CMTime(seconds: 1, preferredTimescale: 600),
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor [weak self] in self?.publish() }
        }
        timeControlObserver = player.observe(\.timeControlStatus, options: [.new]) { [weak self] _, _ in
            Task { @MainActor [weak self] in self?.publish() }
        }
        configureRemoteControls()
    }

    deinit {
        if let periodicToken { player.removeTimeObserver(periodicToken) }
        if let endObserver { NotificationCenter.default.removeObserver(endObserver) }
        statusObserver?.invalidate()
        timeControlObserver?.invalidate()
        MPRemoteCommandCenter.shared().playCommand.removeTarget(nil)
        MPRemoteCommandCenter.shared().pauseCommand.removeTarget(nil)
        MPRemoteCommandCenter.shared().changePlaybackPositionCommand.removeTarget(nil)
        MPRemoteCommandCenter.shared().skipForwardCommand.removeTarget(nil)
        MPRemoteCommandCenter.shared().skipBackwardCommand.removeTarget(nil)
    }

    private func secureURL(_ string: Any?, relay: Bool) -> URL? {
        guard let value = string as? String,
              let parts = URLComponents(string: value),
              parts.scheme == "https", parts.user == nil, parts.password == nil,
              parts.fragment == nil,
              let host = parts.host?.lowercased(),
              let url = parts.url else { return nil }
        if relay {
            return host == "flamboyant-curran.13-211-174-192.plesk.page" &&
                parts.path.hasPrefix("/api/online/stream/") ? url : nil
        }
        return host.hasSuffix(".googlevideo.com") ? url : nil
    }

    func handle(action: String, data: [String: Any]) {
        switch action {
        case "load":
            guard let stream = secureURL(data["url"], relay: false),
                  let relay = secureURL(data["relayUrl"], relay: true),
                  let session = data["session"] as? String, !session.isEmpty else {
                notify(["event":"error", "session":currentSession,
                        "message":"Nguồn audio HTTPS không hợp lệ"])
                return
            }
            currentSession = session
            directURL = stream
            relayURL = relay
            didFallback = false
            title = String((data["title"] as? String ?? "HSK Music").prefix(120))
            artist = String((data["artist"] as? String ?? "").prefix(120))
            wantsPlayback = data["autoPlay"] as? Bool ?? false
            looping = data["loop"] as? Bool ?? false
            rate = max(0.75, min(1.25, Float(data["rate"] as? Double ?? 1)))
            replaceSource(stream)
        case "play":
            wantsPlayback = true
            if player.currentItem != nil { play() }
        case "pause":
            wantsPlayback = false
            player.pause()
            publish()
        case "seek":
            guard let seconds = data["position"] as? Double, seconds.isFinite else { return }
            player.seek(to: CMTime(seconds: max(0, seconds), preferredTimescale: 600))
            publish()
        case "rate":
            rate = max(0.75, min(1.25, Float(data["value"] as? Double ?? 1)))
            if wantsPlayback { player.rate = rate }
            publish()
        case "loop":
            looping = data["enabled"] as? Bool ?? false
        case "stop":
            stop()
        case "state":
            publish()
        default:
            break
        }
    }

    private func configureSession() -> Bool {
        do {
            let audio = AVAudioSession.sharedInstance()
            try audio.setCategory(.playback, mode: .default, options: [])
            try audio.setActive(true)
            return true
        } catch {
            notify(["event":"error", "session":currentSession,
                    "message":"iPhone chưa cho phép mở phiên phát nhạc"])
            return false
        }
    }

    private func replaceSource(_ url: URL) {
        statusObserver?.invalidate()
        statusObserver = nil
        if let endObserver { NotificationCenter.default.removeObserver(endObserver) }
        endObserver = nil

        let item = AVPlayerItem(url: url)
        player.replaceCurrentItem(with: item)
        statusObserver = item.observe(\.status, options: [.new, .initial]) { [weak self] observed, _ in
            Task { @MainActor [weak self] in
                guard let self, observed === self.player.currentItem else { return }
                switch observed.status {
                case .readyToPlay:
                    if self.wantsPlayback { self.play() }
                    self.publish()
                case .failed:
                    self.handleError()
                default:
                    break
                }
            }
        }
        endObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime, object: item, queue: .main
        ) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self else { return }
                if self.looping {
                    self.player.seek(to: .zero) { [weak self] _ in
                        Task { @MainActor [weak self] in
                            guard let self, self.wantsPlayback else { return }
                            self.play()
                        }
                    }
                } else {
                    self.wantsPlayback = false
                    self.publish(event: "ended")
                }
            }
        }
        publish(event: "loading")
    }

    private func handleError() {
        if !didFallback, let relay = relayURL {
            didFallback = true
            replaceSource(relay)
        } else {
            wantsPlayback = false
            player.pause()
            publish(event: "error", message: "Nguồn âm thanh đã ngừng hoặc bị từ chối")
        }
    }

    private func play() {
        guard configureSession() else { return }
        player.playImmediately(atRate: rate)
        publish()
    }

    private func stop() {
        wantsPlayback = false
        statusObserver?.invalidate()
        statusObserver = nil
        if let endObserver { NotificationCenter.default.removeObserver(endObserver) }
        endObserver = nil
        player.pause()
        player.replaceCurrentItem(with: nil)
        directURL = nil
        relayURL = nil
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        publish(event: "stopped")
    }

    func publish(event: String = "state", message: String? = nil) {
        let t = player.currentTime().seconds
        let d = player.currentItem?.duration.seconds ?? 0
        let playing = wantsPlayback && player.timeControlStatus == .playing
        var info: [String: Any] = [
            "event":event,
            "session":currentSession,
            "playing":playing,
            "position":t.isFinite ? t : 0,
            "duration":d.isFinite ? d : 0
        ]
        if let message { info["message"] = message }
        notify(info)
        updateNowPlaying(position: t.isFinite ? t : 0,
                         duration: d.isFinite ? d : 0, playing: playing)
    }

    private func updateNowPlaying(position: Double, duration: Double, playing: Bool) {
        guard player.currentItem != nil else { return }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = [
            MPMediaItemPropertyTitle: title,
            MPMediaItemPropertyArtist: artist,
            MPMediaItemPropertyPlaybackDuration: duration,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: position,
            MPNowPlayingInfoPropertyPlaybackRate: playing ? rate : 0
        ]
    }

    private func configureRemoteControls() {
        let center = MPRemoteCommandCenter.shared()
        center.playCommand.addTarget { [weak self] _ in
            Task { @MainActor [weak self] in self?.handle(action:"play", data:[:]) }
            return .success
        }
        center.pauseCommand.addTarget { [weak self] _ in
            Task { @MainActor [weak self] in self?.handle(action:"pause", data:[:]) }
            return .success
        }
        center.changePlaybackPositionCommand.isEnabled = true
        center.changePlaybackPositionCommand.addTarget { [weak self] command in
            if let value = (command as? MPChangePlaybackPositionCommandEvent)?.positionTime {
                Task { @MainActor [weak self] in
                    self?.handle(action:"seek", data:["position":value])
                }
            }
            return .success
        }
        for (command, delta) in [(center.skipForwardCommand, 10.0),
                                  (center.skipBackwardCommand, -10.0)] {
            command.preferredIntervals = [10]
            command.addTarget { [weak self] _ in
                Task { @MainActor [weak self] in
                    guard let self else { return }
                    let seconds = max(0, self.player.currentTime().seconds + delta)
                    self.handle(action:"seek", data:["position":seconds.isFinite ? seconds : 0])
                }
                return .success
            }
        }
    }
}
