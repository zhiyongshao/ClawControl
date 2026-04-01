import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.claw.control',
  appName: 'ClawControl',
  webDir: 'dist',
  server: {
    // Use https:// origin instead of capacitor:// to avoid CORS/mixed-content issues
    hostname: 'localhost',
    iosScheme: 'https',
    androidScheme: 'https',
    allowNavigation: ['*']
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#06080a',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashImmersive: true
    },
    Keyboard: {
      resize: 'none',
      resizeOnFullScreen: true
    },
    StatusBar: {
      style: 'DARK'
    },
    SpeechRecognition: {
      language: 'en-US'
    }
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#06080a',
    scheme: 'ClawControl',
    preferredContentMode: 'mobile',
    // Required Info.plist entries for speech recognition:
    // NSSpeechRecognitionUsageDescription: "ClawControl uses speech recognition for voice input."
    // NSMicrophoneUsageDescription: "ClawControl needs microphone access for voice input."
  },
  android: {
    backgroundColor: '#06080a',
    allowMixedContent: true,
    captureInput: false,
    webContentsDebuggingEnabled: true
  }
}

export default config
