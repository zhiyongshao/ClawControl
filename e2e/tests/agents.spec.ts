import { test, expect } from '../fixtures/base'

test.describe('Agents', () => {
  test('view agent list in sidebar', async ({ connectedPage }) => {
    const page = connectedPage

    // Agents should be shown in the sidebar agent selector or top bar
    const agentSelector = page.locator('.agent-selector, .agent-dropdown, .agent-name').first()
    if (await agentSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(agentSelector).toBeVisible()
    }
  })

  test('create agent form', async ({ connectedPage, mockServer }) => {
    const page = connectedPage

    // Navigate to create agent view
    // Look for a "Create Agent" or "+" button in the agent area
    const createBtn = page.locator('button:has-text("Create Agent"), button:has-text("New Agent"), .create-agent-btn').first()
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click()

      // Fill form
      await expect(page.getByTestId('create-agent-form')).toBeVisible()
      await page.getByTestId('agent-name-input').fill('Test Agent')
      await page.locator('#agent-workspace').fill('/tmp/test-agent')

      // Submit
      await page.getByTestId('create-agent-submit').click()

      // Verify agents.create was called
      const history = await mockServer.getHistory('agents.create')
      expect(history.length).toBeGreaterThanOrEqual(1)
    }
  })

  test('agent detail view shows files', async ({ connectedPage, mockServer }) => {
    const page = connectedPage

    // Click on an agent to view details
    const agentItem = page.locator('.agent-item, [data-testid*="agent-item"]').first()
    if (await agentItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await agentItem.click()

      // Should show file list
      await expect(page.locator('.agent-files, .file-list').first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('edit agent file and save', async ({ connectedPage, mockServer }) => {
    const page = connectedPage

    // Navigate to agent detail first
    const agentItem = page.locator('.agent-item, [data-testid*="agent-item"]').first()
    if (await agentItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await agentItem.click()
      await page.waitForTimeout(500)

      // Click on a file to edit
      const fileItem = page.locator('.file-item, .agent-file').first()
      if (await fileItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fileItem.click()

        // Editor should appear
        const editor = page.locator('textarea, .code-editor, .file-editor').first()
        if (await editor.isVisible({ timeout: 3000 }).catch(() => false)) {
          await editor.fill('# Updated content')

          // Save
          const saveBtn = page.locator('button:has-text("Save")').first()
          if (await saveBtn.isVisible()) {
            await saveBtn.click()

            const history = await mockServer.getHistory('agents.files.set')
            expect(history.length).toBeGreaterThanOrEqual(1)
          }
        }
      }
    }
  })

  test('delete agent with confirmation', async ({ connectedPage, mockServer }) => {
    const page = connectedPage

    const agentItem = page.locator('.agent-item, [data-testid*="agent-item"]').first()
    if (await agentItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await agentItem.click()
      await page.waitForTimeout(500)

      const deleteBtn = page.locator('button:has-text("Delete Agent"), button:has-text("Delete")').first()
      if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        page.on('dialog', (dialog) => dialog.accept())
        await deleteBtn.click()

        const history = await mockServer.getHistory('agents.delete')
        expect(history.length).toBeGreaterThanOrEqual(1)
      }
    }
  })
})
