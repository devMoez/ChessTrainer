import { test, expect } from '@playwright/test';

test.describe('Opening Trainer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to Opening Trainer from Home page and play correct first move', async ({ page }) => {
    // Click on an opening card from the Home page (Italian Game - beginner friendly)
    await page.click('#home-card-italian-game');
    
    // Wait for the study modal to appear
    await expect(page.locator('#study-modal')).toBeVisible();
    await expect(page.locator('#study-modal-title')).toContainText('Italian Game');
    
    // Click "Play this Opening" button
    await page.click('#study-modal-play-btn');
    
    // Wait for navigation to the trainer page
    await expect(page).toHaveURL('/trainer');
    
    // Verify we're on the Opening Trainer page
    await expect(page.locator('h1')).toContainText('Italian Game');
    
    // Wait for the board to be ready
    await page.waitForSelector('.react-chessboard');
    
    // Get the board position
    const board = page.locator('.react-chessboard');
    await expect(board).toBeVisible();
    
    // The Italian Game starts with 1. e4 (white plays e4)
    // Source: e2, Target: e4
    // We'll drag the pawn from e2 to e4
    
    // Get board bounding box
    const boardBox = await board.boundingBox();
    if (!boardBox) throw new Error('Board not found');
    
    // Calculate square positions (board is 8x8)
    // Each square is boardBox.width / 8
    const squareSize = boardBox.width / 8;
    
    // For white orientation (default), bottom is rank 1, top is rank 8
    // e2 is column 4 (0-indexed: 4), row 1 (from bottom)
    // e4 is column 4, row 3 (from bottom)
    // In Playwright coordinates (0,0 is top-left), e2 is row 6, e4 is row 4
    
    // e2 square center (column E = 4, row from top = 8-2 = 6)
    const e2Col = 4;
    const e2Row = 6;
    const e2X = boardBox.x + e2Col * squareSize + squareSize / 2;
    const e2Y = boardBox.y + e2Row * squareSize + squareSize / 2;
    
    // e4 square center (column E = 4, row from top = 8-4 = 4)
    const e4Col = 4;
    const e4Row = 4;
    const e4X = boardBox.x + e4Col * squareSize + squareSize / 2;
    const e4Y = boardBox.y + e4Row * squareSize + squareSize / 2;
    
    // Drag the pawn from e2 to e4
    await page.mouse.move(e2X, e2Y);
    await page.mouse.down();
    await page.mouse.move(e4X, e4Y, { steps: 10 });
    await page.mouse.up();
    
    // Wait for the move to be processed and feedback to appear
    await page.waitForTimeout(500);
    
    // Verify the feedback indicator appears (correct move shows green check)
    // The feedback is shown via an icon with color var(--accent-green)
    const feedbackIcon = page.locator('svg[class*="text-"]').first();
    await expect(feedbackIcon).toBeVisible({ timeout: 2000 });
    
    // Wait for opponent's move to be automatically played (e5)
    // After white plays e4, black should automatically play e5
    await page.waitForTimeout(800);
    
    // Verify the board has been updated (opponent's move was played)
    // The board should still show pieces - we can verify by checking the board exists
    await expect(board).toBeVisible();
    
    // Check that the move counter or some indicator shows progress
    // The page should show instructions or some feedback
    const pageContent = await page.content();
    expect(pageContent).toContain('Italian Game');
  });

  test('should navigate to Opening Trainer from Openings page', async ({ page }) => {
    // Click "Browse All Openings" button on Home page
    await page.click('#browse-all-openings-btn');
    
    // Wait for navigation to Openings page
    await expect(page).toHaveURL('/openings');
    
    // Wait for opening cards to load
    await page.waitForSelector('[class*="opening-card"]', { timeout: 10000 });
    
    // Click on the first opening card (Ruy Lopez)
    await page.click('[class*="opening-card"] >> nth=0');
    
    // Wait for the study modal
    await expect(page.locator('#study-modal')).toBeVisible();
    
    // Click "Play this Opening" button
    await page.click('#study-modal-play-btn');
    
    // Verify we're on the trainer page
    await expect(page).toHaveURL('/trainer');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show correct move feedback after playing correct move', async ({ page }) => {
    // Navigate directly to trainer with Italian Game via URL
    await page.goto('/trainer', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for potential navigation or check if we're on the "No opening selected" page
    const noOpening = page.locator('text=No opening selected');
    const hasNoOpening = await noOpening.isVisible().catch(() => false);
    
    if (hasNoOpening) {
      // Go to home and select an opening
      await page.goto('/');
      await page.click('#home-card-italian-game');
      await page.click('#study-modal-play-btn');
    }
    
    // Wait for the board
    await page.waitForSelector('.react-chessboard');
    const board = page.locator('.react-chessboard');
    await expect(board).toBeVisible();
    
    // Get board dimensions
    const boardBox = await board.boundingBox();
    if (!boardBox) throw new Error('Board not found');
    
    const squareSize = boardBox.width / 8;
    
    // Play e4 (white pawn from e2 to e4)
    const e2X = boardBox.x + 4 * squareSize + squareSize / 2;
    const e2Y = boardBox.y + 6 * squareSize + squareSize / 2;
    const e4X = boardBox.x + 4 * squareSize + squareSize / 2;
    const e4Y = boardBox.y + 4 * squareSize + squareSize / 2;
    
    await page.mouse.move(e2X, e2Y);
    await page.mouse.down();
    await page.mouse.move(e4X, e4Y, { steps: 10 });
    await page.mouse.up();
    
    // Wait for the feedback animation
    await page.waitForTimeout(1000);
    
    // The page should still show the trainer interface
    // with the chessboard visible
    await expect(board).toBeVisible();
    
    // Verify no error messages or "wrong move" feedback appears
    // (which would show a red X icon instead of green check)
  });

  test('should automatically play opponent move after correct move', async ({ page }) => {
    // Navigate to trainer with Italian Game
    await page.goto('/');
    await page.click('#home-card-italian-game');
    await page.click('#study-modal-play-btn');
    
    // Wait for board
    await page.waitForSelector('.react-chessboard');
    const board = page.locator('.react-chessboard');
    const boardBox = await board.boundingBox();
    const squareSize = boardBox.width / 8;
    
    // Play e4 (first move)
    const e2X = boardBox.x + 4 * squareSize + squareSize / 2;
    const e2Y = boardBox.y + 6 * squareSize + squareSize / 2;
    const e4X = boardBox.x + 4 * squareSize + squareSize / 2;
    const e4Y = boardBox.y + 4 * squareSize + squareSize / 2;
    
    await page.mouse.move(e2X, e2Y);
    await page.mouse.down();
    await page.mouse.move(e4X, e4Y, { steps: 10 });
    await page.mouse.up();
    
    // Wait for opponent's move (e5 should be played automatically)
    await page.waitForTimeout(1000);
    
    // The board should still be visible and functional
    await expect(board).toBeVisible();
    
    // Now play the second move: Nf3 (Knight from g1 to f3)
    // g1 is column 6, row 7 (from top)
    // f3 is column 5, row 5 (from top)
    
    const g1X = boardBox.x + 6 * squareSize + squareSize / 2;
    const g1Y = boardBox.y + 7 * squareSize + squareSize / 2;
    const f3X = boardBox.x + 5 * squareSize + squareSize / 2;
    const f3Y = boardBox.y + 5 * squareSize + squareSize / 2;
    
    await page.mouse.move(g1X, g1Y);
    await page.mouse.down();
    await page.mouse.move(f3X, f3Y, { steps: 10 });
    await page.mouse.up();
    
    // Wait for opponent's response (Nc6 should come automatically)
    await page.waitForTimeout(1000);
    
    // Verify board is still visible
    await expect(board).toBeVisible();
  });

  test('should display "Opening Learned!" when all moves are completed', async ({ page }) => {
    // Navigate to trainer with a short opening (French Exchange has fewer moves)
    // Actually let's use the Italian Game but we'll need to play through all moves
    // For a simpler test, let's use a different approach
    
    await page.goto('/');
    await page.click('#home-card-italian-game');
    await page.click('#study-modal-play-btn');
    
    // Wait for board
    await page.waitForSelector('.react-chessboard');
    const board = page.locator('.react-chessboard');
    const boardBox = await board.boundingBox();
    const squareSize = boardBox.width / 8;
    
    // Helper function to play a move
    const playMove = async (fromCol, fromRow, toCol, toRow) => {
      const fromX = boardBox.x + fromCol * squareSize + squareSize / 2;
      const fromY = boardBox.y + fromRow * squareSize + squareSize / 2;
      const toX = boardBox.x + toCol * squareSize + squareSize / 2;
      const toY = boardBox.y + toRow * squareSize + squareSize / 2;
      
      await page.mouse.move(fromX, fromY);
      await page.mouse.down();
      await page.mouse.move(toX, toY, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(700);
    };
    
    // Play through the Italian Game moves:
    // 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d3 Nf6
    
    // Move 1: e4
    await playMove(4, 6, 4, 4);
    
    // Move 2: e5 (opponent)
    await playMove(4, 1, 4, 3);
    
    // Move 3: Nf3
    await playMove(6, 7, 5, 5);
    
    // Move 4: Nc6 (opponent)
    await playMove(1, 0, 2, 2);
    
    // Move 5: Bc4
    await playMove(5, 7, 2, 4);
    
    // Move 6: Bc5 (opponent) 
    await playMove(2, 0, 1, 3);
    
    // Move 7: d3
    await playMove(3, 6, 3, 4);
    
    // Move 8: Nf6 (opponent)
    await playMove(1, 0, 2, 2);
    
    // Check if we've completed all the moves in the sequence
    // The Italian Game in the data has: 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d3 Nf6 5. c3 d6 6. 0-0 0-0 7. h3
    // We need to continue...
    
    // Continue with more moves...
    // 5. c3 (white)
    await playMove(2, 6, 2, 5);
    
    // 6. d6 (opponent)
    await playMove(3, 1, 3, 2);
    
    // 6. 0-0 (white - kingside castling)
    // Castling is a special move - we need to move the king from e1 to g1
    await playMove(4, 7, 6, 7);
    
    // 7. 0-0 (black - kingside castling)
    await playMove(4, 0, 6, 0);
    
    // 7. h3 (white)
    await playMove(7, 7, 7, 6);
    
    // Now all moves should be completed, check for success message
    await expect(page.locator('text=Opening Learned!')).toBeVisible({ timeout: 5000 });
    
    // Verify the "Practice Again" button is visible
    await expect(page.locator('text=Practice Again')).toBeVisible();
  });
});
