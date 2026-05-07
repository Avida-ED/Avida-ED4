const { test, expect } = require('@playwright/test');

test('app shell renders the primary UI without the test harness', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#populationButton')).toBeVisible();
  await expect(page.locator('#organismButton')).toBeVisible();
  await expect(page.locator('#analysisButton')).toBeVisible();
  await expect(page.locator('#fzOrgan')).toBeVisible();
  await expect(page.locator('#gridCanvas')).toBeVisible();

  const shell = await page.evaluate(() => {
    function rect(id) {
      var box = document.getElementById(id).getBoundingClientRect();
      return {
        width: box.width,
        height: box.height,
        visible: box.width > 0 && box.height > 0
      };
    }

    return {
      title: document.title,
      bodyTextLength: document.body.innerText.length,
      populationButton: rect('populationButton'),
      organismButton: rect('organismButton'),
      analysisButton: rect('analysisButton'),
      gridCanvas: rect('gridCanvas'),
      mainMenu: rect('mainMenu'),
      hasTestHarness: Boolean(window.avidaTest)
    };
  });

  expect(shell.title).toContain('Avida-ED');
  expect(shell.bodyTextLength).toBeGreaterThan(100);
  expect(shell.populationButton.visible).toBe(true);
  expect(shell.organismButton.visible).toBe(true);
  expect(shell.analysisButton.visible).toBe(true);
  expect(shell.gridCanvas.visible).toBe(true);
  expect(shell.gridCanvas.width).toBeGreaterThan(100);
  expect(shell.gridCanvas.height).toBeGreaterThan(100);
  expect(shell.mainMenu.visible).toBe(true);
  expect(shell.hasTestHarness).toBe(false);
});

test('test harness loads only when requested', async ({ page }) => {
  await page.goto('/?avidaTest=1');
  await page.evaluate(() => window.avidaTest.waitForReady());

  const harness = await page.evaluate(() => ({
    ready: Boolean(window.avidaTest),
    errors: window.avidaTest.state.errors
  }));

  expect(harness.ready).toBe(true);
  expect(harness.errors).toEqual([]);
});
