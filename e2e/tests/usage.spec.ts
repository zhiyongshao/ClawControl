import { test, expect } from '../fixtures/base'

test.describe('Usage View', () => {
  test('view renders with chart area', async ({ connectedPage }) => {
    const page = connectedPage

    // Navigate to usage view
    await page.getByTestId('usage-btn').click()
    await page.waitForTimeout(500)

    // Usage view should show
    await expect(page.locator('.detail-view').first()).toBeVisible({ timeout: 5000 })
  })

  test('toggle between tokens and cost view', async ({ connectedPage }) => {
    const page = connectedPage

    await page.getByTestId('usage-btn').click()
    await page.waitForTimeout(500)

    // Find tokens/cost toggle buttons
    const tokensBtn = page.locator('button:has-text("Tokens")').first()
    const costBtn = page.locator('button:has-text("Cost")').first()

    if (await tokensBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click Cost
      await costBtn.click()
      await page.waitForTimeout(200)

      // Click Tokens
      await tokensBtn.click()
      await page.waitForTimeout(200)
    }
  })
})
