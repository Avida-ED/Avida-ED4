const { test, expect } = require('@playwright/test');

async function openFeedback(page) {
  await page.goto('/?avidaTest=1');
  await page.evaluate(() => window.avidaTest.waitForReady(20000));
  await page.locator('#mnHelp').click();
  await page.locator('#mnHpFeedback').click();
  await expect(page.locator('#sendLogModalID')).toBeVisible();
}

test('email draft includes the edited feedback, with optional edited diagnostics', async ({ page }) => {
  await openFeedback(page);
  await page.evaluate(() => {
    window.testMailLinks = [];
    HTMLAnchorElement.prototype.click = function () { window.testMailLinks.push(this.href); };
  });
  const message = 'Trying to save & reopen?\nThe result is café 🧬.';
  await page.locator('#CommentAreaScrollBox').fill(message);
  await page.locator('#sendLogScrollBox').fill('Edited diagnostic log & details');
  await page.locator('#sendLogEmail').click();
  let href = await page.evaluate(() => window.testMailLinks[0]);
  expect(href).toBeTruthy();
  let uri = new URL(href);
  expect(uri.protocol).toBe('mailto:');
  expect(uri.pathname).toBe('Avida-ED-development@googlegroups.com');
  expect(uri.searchParams.get('body')).toBe(message);
  expect(uri.searchParams.get('subject')).toBe('Avida-ED feedback');

  await page.locator('#sendLogIncludeDiagnostics').check();
  await page.locator('#sendLogEmail').click();
  href = await page.evaluate(() => window.testMailLinks[1]);
  uri = new URL(href);
  expect(uri.searchParams.get('body')).toContain(message);
  expect(uri.searchParams.get('body')).toContain('Edited diagnostic log & details');
});

test('copy feedback provides a manual fallback when clipboard access fails', async ({ page }) => {
  await openFeedback(page);
  await page.locator('#CommentAreaScrollBox').fill('A reproducible problem');
  await page.locator('#sendLogScrollBox').fill('Edited session information');
  await page.locator('#sendLogIncludeDiagnostics').check();
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('unavailable')) } });
    document.execCommand = () => false;
  });
  await page.locator('#sendLogCopy').click();
  const fallback = page.locator('#sendLogCopyFallback');
  await expect(fallback).toBeVisible();
  await expect(fallback).toHaveValue(/A reproducible problem[\s\S]*Edited session information/);
  await expect(page.locator('#sendLogCopyStatus')).toContainText('copy');
});

test('copy feedback uses the same text as the email draft', async ({ page }) => {
  await openFeedback(page);
  await page.locator('#CommentAreaScrollBox').fill('Feedback with café & symbols');
  await page.locator('#sendLogScrollBox').fill('Current diagnostics');
  await page.locator('#sendLogIncludeDiagnostics').check();
  await page.evaluate(() => {
    window.copiedFeedback = null;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: text => { window.copiedFeedback = text; return Promise.resolve(); }
    } });
  });
  await page.locator('#sendLogCopy').click();
  await expect(page.locator('#sendLogCopyStatus')).toContainText('Feedback copied');
  expect(await page.evaluate(() => window.copiedFeedback)).toBe('Feedback with café & symbols\n\nCurrent diagnostics');
  await expect(page.locator('#sendLogCopyFallback')).toBeHidden();
  await page.locator('#CommentAreaScrollBox').fill('Revised feedback');
  await expect(page.locator('#sendLogCopyStatus')).toBeEmpty();
});

test('error reports also show the destination for manual email', async ({ page }) => {
  await page.goto('/?avidaTest=1');
  await page.evaluate(() => window.avidaTest.waitForReady(20000));
  await page.evaluate(() => {
    av.debug.sendLogPara1 = 'The error is in the session log.';
    av.debug.sendLogScrollBox = 'Example error';
    av.ui.problemWindow('feedback test');
  });
  await expect(page.locator('#sendLogRecipient')).toHaveText('Avida-ED-development@googlegroups.com');
  await expect(page.locator('#sendLogRecipient')).toHaveAttribute('href', 'mailto:Avida-ED-development@googlegroups.com');
  await expect(page.locator('#sendLogScrollBox')).toHaveValue('Example error');
});

test('copy feedback falls back if clipboard access throws', async ({ page }) => {
  await openFeedback(page);
  await page.locator('#CommentAreaScrollBox').fill('Cannot use clipboard');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: () => { throw new Error('unavailable'); }
    } });
  });
  await page.locator('#sendLogCopy').click();
  await expect(page.locator('#sendLogCopyFallback')).toBeVisible();
  await expect(page.locator('#sendLogCopyFallback')).toHaveValue('Cannot use clipboard');
});
