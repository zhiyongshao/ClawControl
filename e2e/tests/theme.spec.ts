import { test, expect } from '../fixtures/base'

test.describe('Theme', () => {
  test('toggle dark to light mode', async ({ connectedPage }) => {
    const page = connectedPage

    // App starts in dark mode (seeded state)
    // Find theme toggle button
    const themeToggle = page.locator('[aria-label="Toggle theme"]')
    await expect(themeToggle).toBeVisible({ timeout: 3000 })

    // Get initial theme
    const initialTheme = await page.evaluate(() => {
      const stored = localStorage.getItem('clawcontrol-storage')
      return stored ? JSON.parse(stored).state?.theme : null
    })
    expect(initialTheme).toBe('dark')

    // Toggle
    await themeToggle.click()
    await page.waitForTimeout(300)

    // Theme should change
    const newTheme = await page.evaluate(() => {
      const stored = localStorage.getItem('clawcontrol-storage')
      return stored ? JSON.parse(stored).state?.theme : null
    })
    expect(newTheme).toBe('light')
  })

  test('theme persists after reload', async ({ connectedPage }) => {
    const page = connectedPage

    // Toggle theme to light
    const themeToggle = page.locator('[aria-label="Toggle theme"]')
    await themeToggle.click()
    await page.waitForTimeout(300)

    // Verify it's light
    const themeBeforeReload = await page.evaluate(() => {
      const stored = localStorage.getItem('clawcontrol-storage')
      return stored ? JSON.parse(stored).state?.theme : null
    })
    expect(themeBeforeReload).toBe('light')

    // Reload the page
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 15_000 })

    // Check theme is preserved in localStorage
    const themeAfterReload = await page.evaluate(() => {
      const stored = localStorage.getItem('clawcontrol-storage')
      return stored ? JSON.parse(stored).state?.theme : null
    })
    expect(themeAfterReload).toBe('light')
  })
})
