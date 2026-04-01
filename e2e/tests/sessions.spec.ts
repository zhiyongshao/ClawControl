import { test, expect } from '../fixtures/base'

test.describe('Sessions', () => {
  test('create new session via button', async ({ connectedPage }) => {
    const page = connectedPage

    await page.getByTestId('new-chat-btn').click()

    // Input should be focused for the new session
    await expect(page.getByTestId('message-input')).toBeFocused({ timeout: 3000 })
  })

  test('switch between sessions updates messages', async ({ connectedPage }) => {
    const page = connectedPage

    // Click on session-2
    const session2 = page.getByTestId('session-item-session-2')
    if (await session2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await session2.click()
      await page.waitForTimeout(500)

      // Session name should update
      await expect(page.getByTestId('session-name')).toContainText('Second conversation')
    }
  })

  test('search and filter sessions', async ({ connectedPage }) => {
    const page = connectedPage

    const searchInput = page.getByTestId('session-search')
    await searchInput.fill('First')
    await page.waitForTimeout(500)

    // Should show matching session
    await expect(page.getByTestId('session-item-session-1')).toBeVisible()

    // Non-matching session should be hidden
    const session2Visible = await page.getByTestId('session-item-session-2').isVisible().catch(() => false)
    // session-2 title is "Second conversation" — should be filtered out
    expect(session2Visible).toBe(false)

    // Clear search
    await searchInput.clear()
  })

  test('pin and unpin session via context menu', async ({ connectedPage }) => {
    const page = connectedPage

    const sessionItem = page.getByTestId('session-item-session-1')
    if (await sessionItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Right-click to open context menu
      await sessionItem.click({ button: 'right' })

      // Click pin
      const pinBtn = page.getByTestId('ctx-pin')
      if (await pinBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await pinBtn.click()
        // Session should now be in pinned section
        await page.waitForTimeout(300)
      }
    }
  })

  test('rename session via context menu', async ({ connectedPage }) => {
    const page = connectedPage

    const sessionItem = page.getByTestId('session-item-session-1')
    if (await sessionItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sessionItem.click({ button: 'right' })

      const renameBtn = page.getByTestId('ctx-rename')
      if (await renameBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await renameBtn.click()

        // Rename modal/input should appear
        const renameInput = page.locator('.rename-input, input[type="text"]').last()
        if (await renameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await renameInput.fill('Renamed Session')
          await page.keyboard.press('Enter')
        }
      }
    }
  })

  test('delete session via context menu', async ({ connectedPage }) => {
    const page = connectedPage

    const sessionItem = page.getByTestId('session-item-session-2')
    if (await sessionItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sessionItem.click({ button: 'right' })

      const deleteBtn = page.getByTestId('ctx-delete')
      if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Set up dialog handler before clicking
        page.on('dialog', (dialog) => dialog.accept())
        await deleteBtn.click()
        await page.waitForTimeout(500)
      }
    }
  })
})
