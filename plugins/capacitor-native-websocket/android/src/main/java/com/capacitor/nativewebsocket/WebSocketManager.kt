package com.capacitor.nativewebsocket

import android.content.Context
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.security.SecureRandom
import java.security.cert.X509Certificate
import java.util.concurrent.TimeUnit
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLHandshakeException
import javax.net.ssl.X509TrustManager

data class TLSOptions(
    val required: Boolean = true,
    val expectedFingerprint: String? = null,
    val allowTOFU: Boolean = false,
    val storeKey: String? = null,
)

/**
 * OkHttp-based WebSocket with custom TLS certificate handling (TOFU support).
 * Android equivalent of the iOS WebSocketManager using URLSession.
 */
class WebSocketManager(
    private val context: Context,
    private val tlsOptions: TLSOptions,
) {
    var onOpen: (() -> Unit)? = null
    var onMessage: ((String) -> Unit)? = null
    var onClose: ((Int, String?) -> Unit)? = null
    var onError: ((String) -> Unit)? = null
    var onTLSFingerprint: ((String) -> Unit)? = null

    private var webSocket: WebSocket? = null
    private var client: OkHttpClient? = null
    /** Generation counter to ignore callbacks from stale connections after disconnect/reconnect. */
    private var connectionGeneration = 0

    fun connect(url: String, origin: String? = null) {
        val trustManager = TOFUTrustManager(context, tlsOptions, onTLSFingerprint)

        val sslContext = SSLContext.getInstance("TLS")
        sslContext.init(null, arrayOf(trustManager), SecureRandom())

        client = OkHttpClient.Builder()
            .sslSocketFactory(sslContext.socketFactory, trustManager)
            .hostnameVerifier { _, _ -> true } // Hostname verified by fingerprint instead
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(0, TimeUnit.MINUTES) // No read timeout for WebSocket
            .writeTimeout(15, TimeUnit.SECONDS)
            .pingInterval(30, TimeUnit.SECONDS)
            .build()

        val requestBuilder = Request.Builder().url(url)
        if (origin != null) {
            requestBuilder.header("Origin", origin)
        }
        val request = requestBuilder.build()

        val gen = ++connectionGeneration
        webSocket = client!!.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                if (gen != connectionGeneration) return
                onOpen?.invoke()
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                if (gen != connectionGeneration) return
                onMessage?.invoke(text)
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                webSocket.close(code, reason)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                if (gen != connectionGeneration) return
                onClose?.invoke(code, reason.ifEmpty { null })
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                if (gen != connectionGeneration) return
                val message = if (t is SSLHandshakeException || t.cause is SSLHandshakeException) {
                    "TLS_CERTIFICATE_ERROR: ${t.localizedMessage}"
                } else {
                    t.localizedMessage ?: "WebSocket connection failed"
                }
                onError?.invoke(message)
                onClose?.invoke(1006, message)
            }
        })
    }

    fun send(text: String) {
        val ws = webSocket ?: run {
            onError?.invoke("WebSocket is not connected")
            return
        }
        if (!ws.send(text)) {
            onError?.invoke("Send failed: WebSocket is closing or closed")
        }
    }

    fun disconnect() {
        connectionGeneration++ // Invalidate any pending callbacks from current connection
        webSocket?.close(1000, null)
        webSocket = null
        client?.dispatcher?.cancelAll()
        client?.connectionPool?.evictAll()
        client = null
    }
}

/**
 * Custom X509TrustManager implementing Trust-On-First-Use (TOFU) for self-signed certificates.
 *
 * Behaviour mirrors the iOS URLSession delegate:
 * 1. If expectedFingerprint is set → pin check (accept only matching cert)
 * 2. If allowTOFU is set → store fingerprint on first use, verify on subsequent connects
 * 3. If neither → fall through to !required check or reject
 */
private class TOFUTrustManager(
    private val context: Context,
    private val tlsOptions: TLSOptions,
    private val onTLSFingerprint: ((String) -> Unit)?,
) : X509TrustManager {

    override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) {
        // Not verifying client certs
    }

    override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) {
        val leaf = chain?.firstOrNull()
            ?: throw javax.net.ssl.SSLHandshakeException("No server certificate provided")

        val fingerprint = TLSCertificateStore.certificateFingerprint(leaf)

        // Report fingerprint to JS layer
        onTLSFingerprint?.invoke(fingerprint)

        // Pin check: if an expected fingerprint is set, compare
        val expected = tlsOptions.expectedFingerprint
        if (expected != null) {
            val normalized = TLSCertificateStore.normalizeFingerprint(expected)
            if (fingerprint == normalized) return
            throw javax.net.ssl.SSLHandshakeException(
                "TLS_CERTIFICATE_ERROR: Certificate fingerprint mismatch: expected $normalized, got $fingerprint"
            )
        }

        // TOFU: check stored or store-and-accept
        if (tlsOptions.allowTOFU) {
            val storeKey = tlsOptions.storeKey
            if (storeKey != null) {
                val stored = TLSCertificateStore.loadFingerprint(context, storeKey)
                if (stored != null) {
                    // Verify against stored fingerprint
                    if (fingerprint == stored) return
                    throw javax.net.ssl.SSLHandshakeException(
                        "TLS_CERTIFICATE_ERROR: Certificate fingerprint changed: expected $stored, got $fingerprint"
                    )
                }
                // First use: store and accept
                TLSCertificateStore.saveFingerprint(context, fingerprint, storeKey)
            }
            return // TOFU accepted
        }

        // No TOFU, no pin — fall back
        if (!tlsOptions.required) return // Accept anything if TLS not required

        // Try system trust
        try {
            val defaultFactory = javax.net.ssl.TrustManagerFactory.getInstance(
                javax.net.ssl.TrustManagerFactory.getDefaultAlgorithm()
            )
            defaultFactory.init(null as java.security.KeyStore?)
            for (tm in defaultFactory.trustManagers) {
                if (tm is X509TrustManager) {
                    tm.checkServerTrusted(chain, authType)
                    return
                }
            }
        } catch (e: Exception) {
            throw javax.net.ssl.SSLHandshakeException(
                "TLS_CERTIFICATE_ERROR: ${e.localizedMessage}"
            )
        }
    }

    override fun getAcceptedIssuers(): Array<X509Certificate> = emptyArray()
}
