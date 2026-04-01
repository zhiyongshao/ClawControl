// Extended Playwright test fixture with connected app page and mock server controls

import { test as base, type Page } from '@playwright/test'

const WS_PORT = 18789
const CONTROL_PORT = 18790
const CONTROL_URL = `http://localhost:${CONTROL_PORT}`

export interface MockServerControls {
  /** Reset all handlers to defaults, clear history and stream queues */
  reset(): Promise<void>
  /** Override an RPC method to return a fixed response */
  setHandler(method: string, response: { ok: boolean; payload?: any; error?: any }): Promise<void>
  /** Queue stream events to be sent after a chat.send for a specific session */
  setStreamResponse(sessionKey: string, events: any[]): Promise<void>
  /** Broadcast an event to all connected WS clients */
  broadcast(event: any): Promise<void>
  /** Get RPC call history, optionally filtered by method */
  getHistory(method?: string): Promise<Array<{ method: string; params: any; timestamp: number }>>
}

function createMockServerControls(): MockServerControls {
  return {
    async reset() {
      await fetch(`${CONTROL_URL}/reset`, { method: 'POST' })
    },
    async setHandler(method, response) {
      await fetch(`${CONTROL_URL}/set-handler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, response }),
      })
    },
    async setStreamResponse(sessionKey, events) {
      await fetch(`${CONTROL_URL}/set-stream-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionKey, events }),
      })
    },
    async broadcast(event) {
      await fetch(`${CONTROL_URL}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
    },
    async getHistory(method?) {
      const url = method
        ? `${CONTROL_URL}/history?method=${encodeURIComponent(method)}`
        : `${CONTROL_URL}/history`
      const res = await fetch(url)
      return res.json()
    },
  }
}

export const test = base.extend<{
  connectedPage: Page
  mockServer: MockServerControls
}>({
  mockServer: async ({}, use) => {
    const controls = createMockServerControls()
    await controls.reset()
    await use(controls)
  },

  connectedPage: async ({ page, mockServer }, use) => {
    // Inject window.electronAPI mock before any scripts load
    await page.addInitScript(() => {
      ;(window as any).electronAPI = {
        getVersion: () => '1.0.0-test',
        openExternal: (url: string) => console.log('openExternal:', url),
        onDeepLink: () => {},
        removeDeepLinkListener: () => {},
        setTitle: () => {},
        getBuildInfo: () => ({ version: '1.0.0-test', commit: 'test', date: '2025-01-01' }),
        store: {
          get: (key: string) => null,
          set: (key: string, value: any) => {},
          delete: (key: string) => {},
        },
      }
    })

    // Seed Zustand persisted state in localStorage before navigating
    const zustandState = {
      state: {
        theme: 'dark',
        serverUrl: `ws://localhost:${WS_PORT}`,
        authMode: 'token',
        gatewayToken: 'test-token',
        sidebarCollapsed: false,
        thinkingEnabled: false,
        sidebarOpen: true,
        rightPanelOpen: false,
        deviceName: 'E2E Test Device',
        serverProfiles: [{
          id: 'test-profile',
          name: 'Test Server',
          serverUrl: `ws://localhost:${WS_PORT}`,
          authMode: 'token',
          deviceName: 'E2E Test Device',
        }],
        activeProfileId: 'test-profile',
      },
      version: 0,
    }

    await page.addInitScript((stateJson) => {
      // Only seed if no existing state (avoid overwriting on reload)
      if (!localStorage.getItem('clawcontrol-storage')) {
        localStorage.setItem('clawcontrol-storage', stateJson)
      }
      // Always ensure token is set
      if (!localStorage.getItem('clawcontrol-gateway-token-test-profile')) {
        localStorage.setItem('clawcontrol-gateway-token-test-profile', 'test-token')
      }
    }, JSON.stringify(zustandState))

    // Navigate and wait for the app to load
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Wait for the app to render (sidebar should appear)
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 15_000 })

    // Wait for connection to complete (status shows "Connected" or agent name, not "Connecting...")
    // Give the WebSocket handshake time to complete
    await page.waitForTimeout(2000)

    // Close settings modal if it auto-opened
    const settingsModal = page.getByTestId('settings-modal')
    if (await settingsModal.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }

    await use(page)
  },
})

export { expect } from '@playwright/test'
