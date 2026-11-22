const { test, expect } = require('@playwright/test');
const fs = require('fs');
const JSZip = require('../lib/jszip-v2.6.1.js');

async function readyWithSafariFlag(page) {
  await page.goto('/?avidaTest=1');
  await page.evaluate(() => window.avidaTest.waitForReady(20000));
  await page.waitForFunction(() => av.fio.fileReadingDone && document.querySelector('#fzConfig .item'));
  // Exercise the application's Safari branches in this browser. This does not
  // simulate Safari's download implementation or replace real Safari testing.
  await page.evaluate(() => { av.brs.isSafari = true; });
}

test('workspace save and save as remain available with the Safari flag', async ({ page }, testInfo) => {
  await readyWithSafariFlag(page);
  await page.locator('#mnFile').click();
  await expect(page.locator('#mnFlWidth .browser-note')).toContainText('Safari: freezer saves and exports are untested');
  let downloadPromise = page.waitForEvent('download');
  await page.locator('#mnFlSaveWorkspace').click();
  let download = await downloadPromise;
  let path = testInfo.outputPath('current-workspace.zip');
  await download.saveAs(path);
  expect(Object.keys(new JSZip(fs.readFileSync(path)).files).some(name => name.endsWith('/c0/avida.cfg'))).toBe(true);

  await page.locator('#mnFile').click();
  page.once('dialog', dialog => dialog.accept('named-workspace.zip'));
  downloadPromise = page.waitForEvent('download');
  await page.locator('#mnFlSaveAs').click();
  download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('named-workspace.zip');
  path = testInfo.outputPath('named-workspace.zip');
  await download.saveAs(path);
  expect(Object.keys(new JSZip(fs.readFileSync(path)).files).some(name => name.endsWith('/c0/avida.cfg'))).toBe(true);
});

test('menu and context exports remain available with the Safari flag', async ({ page }, testInfo) => {
  await readyWithSafariFlag(page);
  page.once('dialog', dialog => dialog.accept('Safari test configuration'));
  await page.locator('#freezeButton').click();
  const item = page.locator('#fzConfig .item').filter({ hasText: 'Safari test configuration' });
  await expect(item).toHaveCount(1);
  const content = await item.evaluate(el => av.fzr.file[av.fzr.dir[el.id] + '/avida.cfg']);
  await item.click();
  await page.locator('#mnFreezer').click();
  await expect(page.locator('#mnFzWidth .browser-note')).toContainText('Safari: freezer saves and exports are untested');
  page.once('dialog', dialog => dialog.accept('menu-export.zip'));
  let downloadPromise = page.waitForEvent('download');
  await page.locator('#mnFzExport').click();
  let download = await downloadPromise;
  let path = testInfo.outputPath('menu-export.zip');
  await download.saveAs(path);
  expect(new JSZip(fs.readFileSync(path)).file('avida.cfg').asText()).toBe(content);

  await item.click({ button: 'right' });
  page.once('dialog', dialog => dialog.accept('context-export.zip'));
  downloadPromise = page.waitForEvent('download');
  await page.getByText('export', { exact: true }).click();
  download = await downloadPromise;
  path = testInfo.outputPath('context-export.zip');
  await download.saveAs(path);
  expect(new JSZip(fs.readFileSync(path)).file('avida.cfg').asText()).toBe(content);
});
