import Foundation

struct TLSOptions {
    let required: Bool
    let expectedFingerprint: String?
    let allowTOFU: Bool
    let storeKey: String?
}

/// Manages a URLSession-based WebSocket with custom TLS certificate handling.
final class WebSocketManager: NSObject, URLSessionDelegate, URLSessionWebSocketDelegate {
    private var session: URLSession?
    private var task: URLSessionWebSocketTask?
    private let tlsOptions: TLSOptions
    /// Generation counter to ignore callbacks from stale connections after disconnect/reconnect.
    private var connectionGeneration: Int = 0

    var onOpen: (() -> Void)?
    var onMessage: ((String) -> Void)?
    var onClose: ((Int, String?) -> Void)?
    var onError: ((String) -> Void)?
    var onTLSFingerprint: ((String) -> Void)?

    init(tlsOptions: TLSOptions) {
        self.tlsOptions = tlsOptions
        super.init()
    }

    func connect(url: URL, origin: String? = nil) {
        connectionGeneration += 1

        let config = URLSessionConfiguration.default
        config.waitsForConnectivity = false
        config.timeoutIntervalForResource = 15
        if let origin {
            config.httpAdditionalHeaders = ["Origin": origin]
        }
        session = URLSession(configuration: config, delegate: self, delegateQueue: nil)

        var request = URLRequest(url: url)
        if let origin {
            request.setValue(origin, forHTTPHeaderField: "Origin")
        }
        task = session!.webSocketTask(with: request)
        task!.maximumMessageSize = 16 * 1024 * 1024
        task!.resume()
    }

    func send(_ text: String) {
        task?.send(.string(text)) { error in
            if let error {
                self.onError?("Send failed: \(error.localizedDescription)")
            }
        }
    }

    func disconnect() {
        connectionGeneration += 1 // Invalidate any pending callbacks
        task?.cancel(with: .normalClosure, reason: nil)
        task = nil
        session?.invalidateAndCancel()
        session = nil
    }

    // MARK: - Receive loop

    private func receiveNext() {
        let gen = connectionGeneration
        task?.receive { [weak self] result in
            guard let self, gen == self.connectionGeneration else { return }
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self.onMessage?(text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        self.onMessage?(text)
                    }
                @unknown default:
                    break
                }
                self.receiveNext()
            case .failure(let error):
                self.onError?(error.localizedDescription)
                // Receive failure is terminal — emit close so JS state stays consistent
                self.onClose?(1006, error.localizedDescription)
            }
        }
    }

    // MARK: - URLSessionWebSocketDelegate

    func urlSession(
        _ session: URLSession,
        webSocketTask: URLSessionWebSocketTask,
        didOpenWithProtocol protocol: String?
    ) {
        guard webSocketTask === task else { return } // Ignore stale task callbacks
        onOpen?()
        receiveNext()
    }

    func urlSession(
        _ session: URLSession,
        webSocketTask: URLSessionWebSocketTask,
        didCloseWith closeCode: URLSessionWebSocketTask.CloseCode,
        reason: Data?
    ) {
        guard webSocketTask === task else { return } // Ignore stale task callbacks
        let reasonText = reason.flatMap { String(data: $0, encoding: .utf8) }
        onClose?(closeCode.rawValue, reasonText)
    }

    // MARK: - URLSessionTaskDelegate (connection-level errors)

    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        didCompleteWithError error: Error?
    ) {
        guard task === self.task else { return } // Ignore stale task callbacks
        guard let error else { return }
        let nsError = error as NSError
        let message: String
        // Detect TLS/certificate errors specifically
        if nsError.domain == NSURLErrorDomain &&
           (nsError.code == NSURLErrorServerCertificateUntrusted ||
            nsError.code == NSURLErrorServerCertificateHasBadDate ||
            nsError.code == NSURLErrorServerCertificateHasUnknownRoot ||
            nsError.code == NSURLErrorServerCertificateNotYetValid ||
            nsError.code == NSURLErrorClientCertificateRejected ||
            nsError.code == NSURLErrorSecureConnectionFailed) {
            message = "TLS_CERTIFICATE_ERROR: \(error.localizedDescription)"
        } else {
            message = error.localizedDescription
        }
        onError?(message)
        onClose?(1006, message)
    }

    // MARK: - URLSessionDelegate (TLS)

    func urlSession(
        _ session: URLSession,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
              let trust = challenge.protectionSpace.serverTrust
        else {
            completionHandler(.performDefaultHandling, nil)
            return
        }

        // Extract fingerprint from the leaf certificate
        if let fingerprint = certificateFingerprint(trust) {
            // Report fingerprint to JS layer
            onTLSFingerprint?(fingerprint)

            // Pin check: if an expected fingerprint is set, compare
            if let expected = tlsOptions.expectedFingerprint.map(normalizeFingerprint) {
                if fingerprint == expected {
                    completionHandler(.useCredential, URLCredential(trust: trust))
                } else {
                    completionHandler(.cancelAuthenticationChallenge, nil)
                }
                return
            }

            // TOFU: check stored fingerprint first, only save on first use
            if tlsOptions.allowTOFU {
                if let storeKey = tlsOptions.storeKey {
                    if let stored = TLSCertificateStore.loadFingerprint(storeKey: storeKey) {
                        // Verify against stored fingerprint
                        if fingerprint == stored {
                            completionHandler(.useCredential, URLCredential(trust: trust))
                        } else {
                            onError?("TLS_CERTIFICATE_ERROR: Certificate fingerprint changed: expected \(stored), got \(fingerprint)")
                            completionHandler(.cancelAuthenticationChallenge, nil)
                        }
                        return
                    }
                    // First use: store and accept
                    TLSCertificateStore.saveFingerprint(fingerprint, storeKey: storeKey)
                }
                completionHandler(.useCredential, URLCredential(trust: trust))
                return
            }
        }

        // Fall back to system trust evaluation
        let ok = SecTrustEvaluateWithError(trust, nil)
        if ok || !tlsOptions.required {
            completionHandler(.useCredential, URLCredential(trust: trust))
        } else {
            completionHandler(.cancelAuthenticationChallenge, nil)
        }
    }
}
