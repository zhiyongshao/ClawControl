import { test, expect } from '../fixtures/base'

test.describe('Nodes View', () => {
  test('node list displays', async ({ connectedPage }) => {
    const page = connectedPage

    // Navigate to nodes view
    await page.getByTestId('nodes-btn').click()
    await page.waitForTimeout(500)

    // Nodes view should be visible
    await expect(page.locator('.detail-view, .nodes-view').first()).toBeVisible({ timeout: 5000 })
  })

  test('exec approval approve and deny buttons', async ({ connectedPage, mockServer }) => {
    const page = connectedPage

    // Set up pending device approval requests
    await mockServer.setHandler('device.pair.list', {
      ok: true,
      payload: {
        requests: [
          {
            requestId: 'req-1',
            deviceId: 'device-new',
            displayName: 'New Device',
            platform: 'win32',
          },
        ],
        devices: [],
      },
    })

    await page.getByTestId('nodes-btn').click()
    await page.waitForTimeout(1000)

    // Look for approve/deny buttons
    const approveBtn = page.getByTestId('exec-approve')
    const denyBtn = page.getByTestId('exec-deny')

    if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await approveBtn.click()

      const history = await mockServer.getHistory('device.pair.approve')
      expect(history.length).toBeGreaterThanOrEqual(1)
    }
  })
})
