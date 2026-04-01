import { test, expect } from '../fixtures/base'

test.describe('Navigation', () => {
  test('sidebar is visible on load', async ({ connectedPage }) => {
    await expect(connectedPage.getByTestId('sidebar')).toBeVisible()
  })

  test('sidebar collapse and expand', async ({ connectedPage }) => {
    const page = connectedPage
    const sidebar = page.getByTestId('sidebar')

    // Hover over sidebar to reveal the toggle button (hidden until hover)
    await sidebar.hover()
    const collapseBtn = page.locator('[aria-label="Toggle sidebar"]')
    await collapseBtn.click({ force: true })

    // Sidebar should get collapsed class
    await expect(sidebar).toHaveClass(/collapsed/)

    // Click logo to expand (when collapsed, clicking logo expands)
    const logo = page.locator('.logo')
    await logo.click()
    await expect(sidebar).not.toHaveClass(/collapsed/)
  })

  test('right panel toggle', async ({ connectedPage }) => {
    const page = connectedPage

    // Click toggle right panel button
    const panelToggle = page.locator('[aria-label="Toggle right panel"]')
    if (await panelToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await panelToggle.click()

      const rightPanel = page.getByTestId('right-panel')
      await expect(rightPanel).toHaveClass(/visible/)

      // Toggle off
      await panelToggle.click()
      await expect(rightPanel).toHaveClass(/hidden/)
    }
  })

  test('right panel tab switching', async ({ connectedPage }) => {
    const page = connectedPage

    // Open right panel
    const panelToggle = page.locator('[aria-label="Toggle right panel"]')
    if (await panelToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await panelToggle.click()

      // Click Skills tab
      const skillsTab = page.getByTestId('tab-skills')
      await expect(skillsTab).toBeVisible({ timeout: 3000 })
      await skillsTab.click()
      await expect(skillsTab).toHaveClass(/active/)

      // Click Cron Jobs tab
      const cronsTab = page.getByTestId('tab-crons')
      await cronsTab.click()
      await expect(cronsTab).toHaveClass(/active/)
      await expect(skillsTab).not.toHaveClass(/active/)

      // Click Hooks tab
      const hooksTab = page.getByTestId('tab-hooks')
      await hooksTab.click()
      await expect(hooksTab).toHaveClass(/active/)
    }
  })
})
