import SwiftUI
import WebKit
import AVFoundation
import MediaPlayer

@main
struct HSKMusicApp: App {
    var body: some Scene {
        WindowGroup {
            HSKWebViewContainer().ignoresSafeArea()
        }
    }
}

struct HSKWebViewContainer: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> HSKWebController {
        HSKWebController()
    }
    func updateUIViewController(_ uiViewController: HSKWebController, context: Context) {}
}

// The native AVPlayer, rather than WKWebView audio, owns background playback.
// WKWebView is the existing HSK interface only. The content must come from
// the authenticated HSK resolver, and the source URL must pass validation.
final class HSKWebController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler {
    private let allowedHost = "trungxemcode.github.io"
    private var webView: WKWebView!
    private var player: HSKNativePlayer!

    override func loadView() {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        let js = """
        (() => {
          if (window.HSKNativeAudio) return;
          window.HSKNativeAudio = Object.freeze({
            available: true,
            send(command) {
              window.webkit.messageHandlers.hskAudio.postMessage(command);
            }
          });
        })();
        """
        configuration.userContentController.addUserScript(
            WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        )
        configuration.userContentController.add(self, name: "hskAudio")
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = UIColor.systemBackground
        player = HSKNativePlayer { [weak self] info in self?.sendToWeb(info) }
        view = webView
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        guard let url = URL(string: "https://trungxemcode.github.io/hsk/") else { return }
        webView.load(URLRequest(url: url))
    }

    // Prevent arbitrary iframes from initiating player requests.
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "hskAudio", message.frameInfo.isMainFrame,
              message.frameInfo.securityOrigin.protocol == "https",
              message.frameInfo.securityOrigin.host == allowedHost,
              let data = message.body as? [String: Any],
              let action = data["action"] as? String else { return }
        player.handle(action: action, data: data)
    }

    private func sendToWeb(_ data: [String: Any]) {
        guard let dataBytes = try? JSONSerialization.data(withJSONObject: data),
              let json = String(data: dataBytes, encoding: .utf8) else { return }
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript(
                "window.dispatchEvent(new CustomEvent('hsk-native-audio', {detail: \(json)}));",
                completionHandler: nil
            )
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        player.publish()
    }

    deinit {
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: "hskAudio")
    }
}
