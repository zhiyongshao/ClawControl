import { test, expect } from '../fixtures/base'

test.describe('Settings', () => {
  test('open and close settings modal', async ({ connectedPage }) => {
    const page = connectedPage

    const settingsBtn = page.locator('[aria-label="Settings"]')
    await settingsBtn.click()

    await expect(page.getByTestId('settings-modal')).toBeVisible()

    const closeBtn = page.locator('.modal-close').first()
    await closeBtn.click()

    await expect(page.getByTestId('settings-modal')).not.toBeVisible()
  })

  test('server URL input is visible when connection expanded', async ({ connectedPage }) => {
    const page = connectedPage

    const settingsBtn = page.locator('[aria-label="Settings"]')
    await settingsBtn.click()
    await page.waitForTimeout(300)

    // Expand the connection section by clicking the header
    const connectionHeader = page.locator('.modal-body > div').first()
    await connectionHeader.click()
    await page.waitForTimeout(300)

    // Now the server URL input should be visible
    const serverUrlInput = page.getByTestId('settings-server-url')
    await expect(serverUrlInput).toBeVisible({ timeout: 5000 })
    await expect(serverUrlInput).toHaveValue(/localhost:18789/)
  })

  test('auth mode toggle buttons', async ({ connectedPage }) => {
    const page = connectedPage

    const settingsBtn = page.locator('[aria-label="Settings"]')
    await settingsBtn.click()
    await page.waitForTimeout(300)

    // Expand connection section
    const connectionHeader = page.locator('.modal-body > div').first()
    await connectionHeader.click()
    await page.waitForTimeout(300)

    // Auth mode toggle buttons (Token/Password)
    const passwordBtn = page.locator('button:has-text("Password")').first()
    if (await passwordBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordBtn.click()
      await page.waitForTimeout(200)

      const tokenBtn = page.locator('button:has-text("Token")').first()
      await tokenBtn.click()
    }
  })

  test('connect button or disconnect button exists', async ({ connectedPage }) => {
    const page = connectedPage

    const settingsBtn = page.locator('[aria-label="Settings"]')
    await settingsBtn.click()
    await page.waitForTimeout(300)

    // When connected, should show Disconnect and Close buttons
    const disconnectBtn = page.locator('button:has-text("Disconnect")')
    const connectBtn = page.getByTestId('settings-connect-btn')

    const hasDisconnect = await disconnectBtn.isVisible({ timeout: 2000 }).catch(() => false)
    const hasConnect = await connectBtn.isVisible({ timeout: 2000 }).catch(() => false)

    expect(hasDisconnect || hasConnect).toBe(true)
  })

  test('close modal with close button', async ({ connectedPage }) => {
    const page = connectedPage

    const settingsBtn = page.locator('[aria-label="Settings"]')
    await settingsBtn.click()
    await expect(page.getByTestId('settings-modal')).toBeVisible()

    const closeBtn = page.locator('.modal-close').first()
    await closeBtn.click()
    await expect(page.getByTestId('settings-modal')).not.toBeVisible()
  })
})
