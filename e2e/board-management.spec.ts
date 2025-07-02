import { test, expect } from '@playwright/test';

test.describe('Kanban Board Management', () => {
  test.beforeEach(async ({ page }) => {
    // Clean up database before each test (in real implementation)
    // await cleanDatabase();
  });

  test('should create new board and get shareable URL', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Verify home page loads
    await expect(page.getByText('Welcome to Kanban Board')).toBeVisible();

    // Click create board button
    await page.getByRole('button', { name: /create your first board/i }).click();

    // Should redirect to new board with unique ID
    await expect(page).toHaveURL(/\/board\/[A-Za-z0-9_-]{21}$/);

    // Verify board is created with default columns
    await expect(page.getByText('My Kanban Board')).toBeVisible();
    await expect(page.getByText('Todo')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
    await expect(page.getByText('Done')).toBeVisible();
  });

  test('should access existing board via direct URL', async ({ page }) => {
    // First create a board
    await page.goto('/');
    await page.getByRole('button', { name: /create your first board/i }).click();
    
    // Get the board URL
    const boardUrl = page.url();
    const boardId = boardUrl.split('/board/')[1];

    // Navigate away and back
    await page.goto('/');
    await page.goto(`/board/${boardId}`);

    // Verify board loads correctly
    await expect(page.getByText('My Kanban Board')).toBeVisible();
    await expect(page.getByText('Todo')).toBeVisible();
  });

  test('should handle non-existent board gracefully', async ({ page }) => {
    // Navigate to non-existent board
    await page.goto('/board/non-existent-board-id');

    // Should show error message
    await expect(page.getByText(/board not found/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create new board/i })).toBeVisible();
  });

  test('complete card management workflow', async ({ page }) => {
    // Create a board
    await page.goto('/');
    await page.getByRole('button', { name: /create your first board/i }).click();

    // Add a card to Todo column
    await page.locator('[data-testid="board-column"]').first().getByRole('button', { name: /add card/i }).click();
    
    // Card should be in edit mode
    const cardInput = page.getByPlaceholder(/enter card content/i);
    await expect(cardInput).toBeVisible();
    
    // Type card content and save
    await cardInput.fill('My first task');
    await cardInput.press('Enter');
    
    // Verify card is created
    await expect(page.getByText('My first task')).toBeVisible();

    // Edit the card
    await page.getByText('My first task').dblclick();
    const editInput = page.locator('input[value="My first task"]');
    await editInput.fill('Updated task content');
    await editInput.press('Enter');
    
    // Verify card is updated
    await expect(page.getByText('Updated task content')).toBeVisible();

    // Delete the card
    await page.getByText('Updated task content').hover();
    await page.getByRole('button', { name: /delete card/i }).click();
    
    // Verify card is deleted
    await expect(page.getByText('Updated task content')).not.toBeVisible();
  });

  test('drag and drop cards between columns', async ({ page }) => {
    // Create a board
    await page.goto('/');
    await page.getByRole('button', { name: /create your first board/i }).click();

    // Add a card to Todo column
    await page.locator('[data-testid="board-column"]').first().getByRole('button', { name: /add card/i }).click();
    await page.getByPlaceholder(/enter card content/i).fill('Task to move');
    await page.getByPlaceholder(/enter card content/i).press('Enter');

    // Get the card and target column
    const card = page.getByText('Task to move');
    const inProgressColumn = page.locator('[data-testid="board-column"]').nth(1);

    // Perform drag and drop
    await card.dragTo(inProgressColumn);

    // Verify card moved to In Progress column
    const inProgressCards = inProgressColumn.locator('[data-testid^="card-"]');
    await expect(inProgressCards.getByText('Task to move')).toBeVisible();

    // Verify card is no longer in Todo column
    const todoColumn = page.locator('[data-testid="board-column"]').first();
    await expect(todoColumn.getByText('Task to move')).not.toBeVisible();
  });

  test('board persists after page reload', async ({ page }) => {
    // Create a board and add content
    await page.goto('/');
    await page.getByRole('button', { name: /create your first board/i }).click();
    
    // Change board title (if this functionality exists)
    await page.getByText('My Kanban Board').click();
    await page.locator('input[value="My Kanban Board"]').fill('Test Project Board');
    await page.locator('input[value="Test Project Board"]').press('Enter');

    // Add a card
    await page.locator('[data-testid="board-column"]').first().getByRole('button', { name: /add card/i }).click();
    await page.getByPlaceholder(/enter card content/i).fill('Persistent task');
    await page.getByPlaceholder(/enter card content/i).press('Enter');

    // Reload the page
    await page.reload();

    // Verify data persists
    await expect(page.getByText('Test Project Board')).toBeVisible();
    await expect(page.getByText('Persistent task')).toBeVisible();
  });

  test('works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Create a board
    await page.goto('/');
    await page.getByRole('button', { name: /create your first board/i }).click();

    // Verify mobile layout
    await expect(page.getByText('My Kanban Board')).toBeVisible();
    
    // Columns should stack vertically on mobile
    const columns = page.locator('[data-testid="board-column"]');
    await expect(columns).toHaveCount(3);

    // Add a card using touch interactions
    await page.locator('[data-testid="board-column"]').first().getByRole('button', { name: /add card/i }).tap();
    await page.getByPlaceholder(/enter card content/i).fill('Mobile task');
    await page.getByPlaceholder(/enter card content/i).press('Enter');
    
    // Verify card is created
    await expect(page.getByText('Mobile task')).toBeVisible();
  });

  test('handles network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/boards/**', route => route.abort());

    // Try to create a board
    await page.goto('/');
    await page.getByRole('button', { name: /create your first board/i }).click();

    // Should show error message
    await expect(page.getByText(/something went wrong/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();

    // Restore network and retry
    await page.unroute('**/api/boards/**');
    await page.getByRole('button', { name: /retry/i }).click();

    // Should work now
    await expect(page).toHaveURL(/\/board\/[A-Za-z0-9_-]{21}$/);
  });

  test('supports keyboard navigation', async ({ page }) => {
    // Create a board with some cards
    await page.goto('/');
    await page.getByRole('button', { name: /create your first board/i }).click();

    // Add cards
    for (let i = 1; i <= 3; i++) {
      await page.locator('[data-testid="board-column"]').first().getByRole('button', { name: /add card/i }).click();
      await page.getByPlaceholder(/enter card content/i).fill(`Task ${i}`);
      await page.getByPlaceholder(/enter card content/i).press('Enter');
    }

    // Navigate cards with keyboard
    await page.keyboard.press('Tab'); // Focus first card
    await expect(page.getByText('Task 1')).toBeFocused();

    await page.keyboard.press('ArrowDown'); // Move to next card
    await expect(page.getByText('Task 2')).toBeFocused();

    // Activate card with keyboard
    await page.keyboard.press('Enter');
    await expect(page.locator('input[value="Task 2"]')).toBeFocused();
  });
}); 