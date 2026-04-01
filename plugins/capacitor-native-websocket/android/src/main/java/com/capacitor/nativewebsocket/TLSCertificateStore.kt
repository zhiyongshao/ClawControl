package com.capacitor.nativewebsocket

import android.content.Context
import android.content.SharedPreferences
import java.security.MessageDigest
import java.security.cert.X509Certificate

object TLSCertificateStore {
    private const val PREFS_NAME = "ai.openclaw.tls"
    private const val KEY_PREFIX = "gateway.tls."

    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun loadFingerprint(context: Context, storeKey: String): String? {
        val key = KEY_PREFIX + storeKey
        val raw = prefs(context).getString(key, null)?.trim()
        return if (!raw.isNullOrEmpty()) raw else null
    }

    fun saveFingerprint(context: Context, fingerprint: String, storeKey: String) {
        val key = KEY_PREFIX + storeKey
        prefs(context).edit().putString(key, fingerprint).apply()
    }

    fun clearFingerprint(context: Context, storeKey: String) {
        val key = KEY_PREFIX + storeKey
        prefs(context).edit().remove(key).apply()
    }

    fun certificateFingerprint(cert: X509Certificate): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(cert.encoded)
        return hash.joinToString("") { "%02x".format(it) }
    }

    fun normalizeFingerprint(raw: String): String {
        val stripped = raw.replace(Regex("(?i)^sha-?256\\s*:?\\s*"), "")
        return stripped.lowercase().filter { it in '0'..'9' || it in 'a'..'f' }
    }
}
