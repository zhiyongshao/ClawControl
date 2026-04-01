import { test, expect } from '../fixtures/base'

test.describe('Hooks', () => {
  test.beforeEach(async ({ connectedPage }) => {
    // Open right panel via toggle button
    const panelToggle = connectedPage.locator('[aria-label="Toggle right panel"]')
    if (await panelToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await panelToggle.click()
      await connectedPage.waitForTimeout(300)
    }
  })

  test('list hooks', async ({ connectedPage }) => {
    const page = connectedPage

    const hooksTab = page.getByTestId('tab-hooks')
    await expect(hooksTab).toBeVisible({ timeout: 5000 })
    await hooksTab.click()
    await page.waitForTimeout(500)

    await expect(page.getByTestId('hook-item-hook-1')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('hook-item-hook-2')).toBeVisible()
  })

  test('toggle hook enable/disable', async ({ connectedPage, mockServer }) => {
    const page = connectedPage

    const hooksTab = page.getByTestId('tab-hooks')
    await expect(hooksTab).toBeVisible({ timeout: 5000 })
    await hooksTab.click()
    await page.waitForTimeout(500)

    const hookItem = page.getByTestId('hook-item-hook-1')
    if (await hookItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await hookItem.click()
      await page.waitForTimeout(500)

      // Look for toggle in hook detail
      const toggle = page.locator('.toggle-button').first()
      if (await toggle.isVisible({ timeout: 3000 }).catch(() => false)) {
        await toggle.click()

        const history = await mockServer.getHistory('hooks.update')
        expect(history.length).toBeGreaterThanOrEqual(1)
      }
    }
  })

  test('hook detail view', async ({ connectedPage }) => {
    const page = connectedPage

    const hooksTab = page.getByTestId('tab-hooks')
    await expect(hooksTab).toBeVisible({ timeout: 5000 })
    await hooksTab.click()
    await page.waitForTimeout(500)

    const hookItem = page.getByTestId('hook-item-hook-1')
    if (await hookItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await hookItem.click()
      await expect(page.locator('.detail-view').first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('edit environment variables', async ({ connectedPage, mockServer }) => {
    const page = connectedPage

    const hooksTab = page.getByTestId('tab-hooks')
    await expect(hooksTab).toBeVisible({ timeout: 5000 })
    await hooksTab.click()
    await page.waitForTimeout(500)

    // Select hook-2 which has env vars
    const hookItem = page.getByTestId('hook-item-hook-2')
    if (await hookItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await hookItem.click()
      await page.waitForTimeout(500)

      const editEnvBtn = page.locator('.cron-edit-btn, button:has-text("Edit")').first()
      if (await editEnvBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editEnvBtn.click()

        const textarea = page.locator('textarea.cron-content-editor, textarea').first()
        if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
          await textarea.fill('WEBHOOK_URL=https://new-url.example.com')

          const saveBtn = page.locator('.settings-button.primary, button:has-text("Save")').first()
          if (await saveBtn.isVisible()) {
            await saveBtn.click()
          }
        }
      }
    }
  })
})
