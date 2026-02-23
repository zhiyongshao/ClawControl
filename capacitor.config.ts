import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.claw.control',
  appName: 'ClawControl',
  webDir: 'dist',
  server: {
    // Allow connections to any WebSocket server
    allowNavigation: ['*'],
    // Use http:// instead of capacitor:// so WebSocket origin headers
    // are a standard scheme that servers accept without patching
    iosScheme: 'http',
    androidScheme: 'http'
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
    }
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#06080a',
    scheme: 'ClawControl',
    preferredContentMode: 'mobile'
  },
  android: {
    backgroundColor: '#06080a',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
}

export default config
