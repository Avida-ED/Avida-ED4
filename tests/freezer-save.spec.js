const { test, expect } = require('@playwright/test');
const fs = require('fs');
const JSZip = require('../lib/jszip-v2.6.1.js');

test('save a configuration in the freezer and restore it from a workspace', async ({ page }, testInfo) => {
  await page.goto('/?avidaTest=1');
  await page.evaluate(() => window.avidaTest.waitForReady());
  await page.waitForFunction(() => av.fio.fileReadingDone && document.querySelector('#fzConfig .item'));
  page.once('dialog', dialog => dialog.accept('Saved configuration'));
  await page.evaluate(() => document.getElementById('mnFzConfig').click());
  await expect(page.locator('#fzConfig .item', { hasText: 'Saved configuration' })).toHaveCount(1);
  const config = await page.evaluate(() => {
    const item = Array.from(document.querySelectorAll('#fzConfig .item')).find(el => el.textContent.includes('Saved configuration'));
    return av.fzr.file[av.fzr.dir[item.id] + '/avida.cfg'];
  });
  expect(config).toContain('WORLD_X');
  const downloadPromise = page.waitForEvent('download');
  await page.evaluate(() => document.getElementById('mnFlSaveWorkspace').click());
  const download = await downloadPromise;
  const path = testInfo.outputPath('workspace.zip');
  await download.saveAs(path);
  await page.locator('#putWS').setInputFiles(path);
  await expect(page.locator('#fzConfig .item', { hasText: 'Saved configuration' })).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => av.fzr.saveState)).toBe('yes');
  expect(await page.evaluate(() => {
    const item = Array.from(document.querySelectorAll('#fzConfig .item')).find(el => el.textContent.includes('Saved configuration'));
    return av.fzr.file[av.fzr.dir[item.id] + '/avida.cfg'];
  })).toBe(config);
});

test('export a selected freezer item and import it again', async ({ page }, testInfo) => {
  await page.goto('/?avidaTest=1');
  await page.evaluate(() => window.avidaTest.waitForReady());
  await page.waitForFunction(() => av.fio.fileReadingDone && document.querySelector('#fzOrgan .item'));
  const original = page.locator('#fzOrgan .item').first();
  const name = (await original.textContent()).trim();
  const originalData = await original.evaluate(el => ({ dir: av.fzr.dir[el.id], genome: av.fzr.file[av.fzr.dir[el.id] + '/genome.seq'] }));
  expect(originalData.genome).toBeTruthy();
  await page.evaluate(dir => { av.fzr.file[dir + '999/foreign.txt'] = 'other item'; }, originalData.dir);
  await original.click();
  page.once('dialog', dialog => dialog.accept('item.zip'));
  const downloadPromise = page.waitForEvent('download', { timeout: 5000 });
  await page.evaluate(() => document.getElementById('mnFzExport').click());
  const download = await downloadPromise;
  const path = testInfo.outputPath('item.zip');
  await download.saveAs(path);
  const archive = new JSZip(fs.readFileSync(path));
  expect(archive.file('entrytype.txt').asText()).toBe('g');
  expect(archive.file('genome.seq').asText()).toBe(originalData.genome);
  expect(archive.file('999/foreign.txt')).toBeNull();
  const alerts = [];
  page.on('dialog', dialog => { alerts.push(dialog.message()); return dialog.dismiss(); });
  await page.locator('#importFzrItem').setInputFiles(path);
  await expect(page.locator('#fzOrgan .item', { hasText: name })).toHaveCount(2);
  const imported = await page.locator('#fzOrgan .item', { hasText: name }).last().evaluate(el => ({
    id: el.id, dir: av.fzr.dir[el.id], reverseId: av.fzr.domid[av.fzr.dir[el.id]],
    genome: av.fzr.file[av.fzr.dir[el.id] + '/genome.seq']
  }));
  expect(imported.reverseId).toBe(imported.id);
  expect(imported.genome).toBe(originalData.genome);
  expect(alerts).toEqual([]);
  expect(await page.evaluate(() => window.avidaTest.state.errors)).toEqual([]);
});

test('dragging a parent into the freezer preserves its genome', async ({ page }) => {
  await page.goto('/?avidaTest=1');
  await page.evaluate(() => window.avidaTest.waitForReady());
  await page.waitForFunction(() => av.fio.fileReadingDone && document.querySelector('#fzOrgan .item'));
  const result = await page.evaluate(() => {
    const source = document.createElement('div');
    source.id = 'test-parent';
    source.className = 'item g';
    source.textContent = 'Parent';
    av.parents.domid.push(source.id);
    av.parents.genome.push('0,heads_default,abc');
    av.dnd.fzOrgan.appendChild(source);
    const oldPrompt = window.prompt;
    window.prompt = () => 'Frozen parent';
    try {
      av.dnd.landFzOrgan(source, av.dnd.fzOrgan, av.dnd.ancestorBox);
      return { genome: av.fzr.file[av.fzr.dir[source.id] + '/genome.seq'], state: av.fzr.saveState };
    } finally { window.prompt = oldPrompt; }
  });
  expect(result).toEqual({ genome: '0,heads_default,abc', state: 'no' });
});
