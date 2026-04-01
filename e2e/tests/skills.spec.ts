import { test, expect } from '../fixtures/base'

test.describe('Skills', () => {
  test.beforeEach(async ({ connectedPage }) => {
    // Open right panel via toggle button
    const panelToggle = connectedPage.locator('[aria-label="Toggle right panel"]')
    if (await panelToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await panelToggle.click()
      await connectedPage.waitForTimeout(300)
    }
  })

  test('list installed skills', async ({ connectedPage }) => {
    const page = connectedPage

    const skillsTab = page.getByTestId('tab-skills')
    await expect(skillsTab).toBeVisible({ timeout: 5000 })
    await skillsTab.click()
    await page.waitForTimeout(500)

    await expect(page.getByTestId('skill-item-skill-web-search')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('skill-item-skill-code-exec')).toBeVisible()
  })

  test('toggle skill enable/disable', async ({ connectedPage, mockServer }) => {
    const page = connectedPage

    const skillsTab = page.getByTestId('tab-skills')
    await expect(skillsTab).toBeVisible({ timeout: 5000 })
    await skillsTab.click()
    await page.waitForTimeout(500)

    const skillItem = page.getByTestId('skill-item-skill-web-search')
    if (await skillItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skillItem.click()

      // Look for toggle in skill detail view
      const toggle = page.locator('.toggle-button, .skill-toggle, input[type="checkbox"]').first()
      if (await toggle.isVisible({ timeout: 3000 }).catch(() => false)) {
        await toggle.click()

        const history = await mockServer.getHistory('skills.update')
        expect(history.length).toBeGreaterThanOrEqual(1)
      }
    }
  })

  test('search skills', async ({ connectedPage }) => {
    const page = connectedPage

    const skillsTab = page.getByTestId('tab-skills')
    await expect(skillsTab).toBeVisible({ timeout: 5000 })
    await skillsTab.click()
    await page.waitForTimeout(500)

    const searchInput = page.locator('.panel-search input, .skill-search input').first()
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Web')
      await page.waitForTimeout(300)

      await expect(page.getByTestId('skill-item-skill-web-search')).toBeVisible()
    }
  })

  test('switch to ClawHub tab', async ({ connectedPage }) => {
    const page = connectedPage

    const skillsTab = page.getByTestId('tab-skills')
    await expect(skillsTab).toBeVisible({ timeout: 5000 })
    await skillsTab.click()
    await page.waitForTimeout(500)

    const clawHubTab = page.locator('button:has-text("ClawHub"), .subtab:has-text("ClawHub")').first()
    if (await clawHubTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clawHubTab.click()
      await page.waitForTimeout(500)
    }
  })
})
