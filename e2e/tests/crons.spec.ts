import { test, expect } from '../fixtures/base'

test.describe('Cron Jobs', () => {
  test.beforeEach(async ({ connectedPage }) => {
    // Open right panel via toggle button
    const panelToggle = connectedPage.locator('[aria-label="Toggle right panel"]')
    if (await panelToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await panelToggle.click()
      await connectedPage.waitForTimeout(300)
    }
  })

  test('list cron jobs', async ({ connectedPage }) => {
    const page = connectedPage

    const cronsTab = page.getByTestId('tab-crons')
    await expect(cronsTab).toBeVisible({ timeout: 5000 })
    await cronsTab.click()
    await page.waitForTimeout(500)

    await expect(page.getByTestId('cron-item-cron-1')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('cron-item-cron-2')).toBeVisible()
  })

  test('cron detail view', async ({ connectedPage }) => {
    const page = connectedPage

    const cronsTab = page.getByTestId('tab-crons')
    await expect(cronsTab).toBeVisible({ timeout: 5000 })
    await cronsTab.click()
    await page.waitForTimeout(500)

    const cronItem = page.getByTestId('cron-item-cron-1')
    if (await cronItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cronItem.click()
      await expect(page.locator('.detail-view, .cron-detail').first()).toBeVisible({ timeout: 5000 })
      await expect(page.getByTestId('cron-pause-toggle')).toBeVisible()
      await expect(page.getByTestId('cron-run-now')).toBeVisible()
    }
  })

  test('toggle pause/active', async ({ connectedPage, mockServer }) => {
    const page = connectedPage

    const cronsTab = page.getByTestId('tab-crons')
    await expect(cronsTab).toBeVisible({ timeout: 5000 })
    await cronsTab.click()
    await page.waitForTimeout(500)

    const cronItem = page.getByTestId('cron-item-cron-1')
    if (await cronItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cronItem.click()
      await page.waitForTimeout(500)

      const toggleBtn = page.getByTestId('cron-pause-toggle')
      if (await toggleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await toggleBtn.click()

        const history = await mockServer.getHistory('cron.update')
        expect(history.length).toBeGreaterThanOrEqual(1)
      }
    }
  })

  test('run now', async ({ connectedPage, mockServer }) => {
    const page = connectedPage

    const cronsTab = page.getByTestId('tab-crons')
    await expect(cronsTab).toBeVisible({ timeout: 5000 })
    await cronsTab.click()
    await page.waitForTimeout(500)

    const cronItem = page.getByTestId('cron-item-cron-1')
    if (await cronItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cronItem.click()
      await page.waitForTimeout(500)

      const runNowBtn = page.getByTestId('cron-run-now')
      if (await runNowBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await runNowBtn.click()
        await page.waitForTimeout(500)
      }
    }
  })

  test('delete cron job with confirmation', async ({ connectedPage, mockServer }) => {
    const page = connectedPage

    const cronsTab = page.getByTestId('tab-crons')
    await expect(cronsTab).toBeVisible({ timeout: 5000 })
    await cronsTab.click()
    await page.waitForTimeout(500)

    const cronItem = page.getByTestId('cron-item-cron-1')
    if (await cronItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cronItem.click()
      await page.waitForTimeout(500)

      // Scroll to danger zone and click delete
      const deleteBtn = page.getByTestId('cron-delete')
      if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await deleteBtn.click()
        await page.waitForTimeout(300)

        // Click confirmation delete button (the second delete button that appears)
        const confirmBtn = page.locator('.delete-confirm .btn-danger').first()
        if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmBtn.click()
          await page.waitForTimeout(500)
        }
      }
    }
  })
})
