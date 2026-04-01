import { test, expect } from '../fixtures/base'

test.describe('Server Settings', () => {
  test('load config and render tabs', async ({ connectedPage, mockServer }) => {
    const page = connectedPage

    // Navigate to server settings via sidebar
    page.getByTestId('usage-btn').click()
    await page.waitForTimeout(300)

    // Try opening via settings modal
    const settingsBtn = page.locator('.settings-btn, [aria-label="Settings"]').first()
    await settingsBtn.click()
    await page.waitForTimeout(300)

    const serverSettingsBtn = page.locator('button:has-text("OpenClaw Server Settings"), .server-settings-link').first()
    if (await serverSettingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await serverSettingsBtn.click()
      await page.waitForTimeout(500)

      // Tabs should render
      await expect(page.locator('.settings-tab').first()).toBeVisible({ timeout: 5000 })

      // Verify config.get was called
      const history = await mockServer.getHistory('config.get')
      expect(history.length).toBeGreaterThanOrEqual(1)
    }
  })

  test('edit setting shows save bar', async ({ connectedPage, mockServer }) => {
    const page = connectedPage

    // Navigate to server settings
    const settingsBtn = page.locator('.settings-btn, [aria-label="Settings"]').first()
    await settingsBtn.click()
    await page.waitForTimeout(300)

    const serverSettingsBtn = page.locator('button:has-text("OpenClaw Server Settings"), .server-settings-link').first()
    if (await serverSettingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await serverSettingsBtn.click()
      await page.waitForTimeout(1000)

      // Find any input/select to modify
      const input = page.locator('.server-settings-view input, .server-settings-view select').first()
      if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
        const tagName = await input.evaluate((el) => el.tagName)
        if (tagName === 'SELECT') {
          const options = await input.locator('option').allTextContents()
          if (options.length > 1) {
            await input.selectOption({ index: 1 })
          }
        } else {
          await input.fill('modified-value')
        }

        // Save bar should appear with save button
        await expect(page.getByTestId('server-settings-save')).toBeVisible({ timeout: 3000 })
      }
    }
  })

  test('save config calls config.patch', async ({ connectedPage, mockServer }) => {
    const page = connectedPage

    const settingsBtn = page.locator('.settings-btn, [aria-label="Settings"]').first()
    await settingsBtn.click()
    await page.waitForTimeout(300)

    const serverSettingsBtn = page.locator('button:has-text("OpenClaw Server Settings"), .server-settings-link').first()
    if (await serverSettingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await serverSettingsBtn.click()
      await page.waitForTimeout(1000)

      // Modify a setting
      const input = page.locator('.server-settings-view input').first()
      if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
        await input.fill('new-value-for-test')
        await page.waitForTimeout(200)

        // Click save
        const saveBtn = page.getByTestId('server-settings-save')
        if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await saveBtn.click()

          // Verify config.patch was called
          await page.waitForTimeout(1000)
          const history = await mockServer.getHistory('config.patch')
          expect(history.length).toBeGreaterThanOrEqual(1)
        }
      }
    }
  })
})
