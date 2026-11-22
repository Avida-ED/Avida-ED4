const { test, expect } = require('@playwright/test');
const fs = require('fs');
const JSZip = require('../lib/jszip-v2.6.1.js');

async function ready(page) {
  await page.goto('/?avidaTest=1');
  await page.evaluate(() => window.avidaTest.waitForReady(20000));
  await page.waitForFunction(() => av.fio.fileReadingDone && document.querySelector('#fzWorld .item'));
}

for (const spec of [
  { type: 'c', container: '#fzConfig', key: 'avida.cfg' },
  { type: 'g', container: '#fzOrgan', key: 'genome.seq' },
  { type: 'w', container: '#fzWorld', key: 'detail.spop' }
]) {
  test(`${spec.type} freezer item exports and imports its actual data`, async ({ page }, testInfo) => {
    await ready(page);
    const item = page.locator(`${spec.container} .item`).first();
    const original = await item.evaluate((el, key) => ({
      name: el.textContent.trim(),
      contents: av.fzr.file[av.fzr.dir[el.id] + '/' + key]
    }), spec.key);
    expect(original.contents).toBeTruthy();
    await item.click();
    await page.locator('#mnFreezer').click();
    page.once('dialog', dialog => dialog.accept(`${spec.type}-item.zip`));
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#mnFzExport').click();
    const download = await downloadPromise;
    const path = testInfo.outputPath(`${spec.type}-item.zip`);
    await download.saveAs(path);
    const archive = new JSZip(fs.readFileSync(path));
    expect(archive.file('entrytype.txt').asText()).toBe(spec.type);
    expect(archive.file(spec.key).asText()).toBe(original.contents);
    expect(archive.file('entryname.txt').asText().trim()).toBe(original.name);

    const alerts = [];
    page.on('dialog', dialog => { alerts.push(dialog.message()); return dialog.dismiss(); });
    await page.locator('#importFzrItem').setInputFiles(path);
    const matching = page.locator(`${spec.container} .item`).filter({ hasText: original.name });
    await expect(matching).toHaveCount(2);
    const imported = await matching.last().evaluate((el, key) => ({
      id: el.id,
      dir: av.fzr.dir[el.id],
      reverseId: av.fzr.domid[av.fzr.dir[el.id]],
      contents: av.fzr.file[av.fzr.dir[el.id] + '/' + key]
    }), spec.key);
    expect(imported.reverseId).toBe(imported.id);
    expect(imported.contents).toBe(original.contents);
    expect(alerts).toEqual([]);
    expect(await page.evaluate(() => av.fzr.saveState)).toBe('no');
  });
}

test('right-click export downloads the selected organism', async ({ page }, testInfo) => {
  await ready(page);
  const item = page.locator('#dom_g1');
  const genome = await item.evaluate(el => av.fzr.file[av.fzr.dir[el.id] + '/genome.seq']);
  expect(genome).toBeTruthy();
  await item.click({ button: 'right' });
  page.once('dialog', dialog => dialog.accept('context-item.zip'));
  const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
  await page.getByText('export', { exact: true }).click();
  const download = await downloadPromise;
  const path = testInfo.outputPath('context-item.zip');
  await download.saveAs(path);
  const archive = new JSZip(fs.readFileSync(path));
  expect(archive.file('genome.seq').asText()).toBe(genome);
});

test('cancelling freezer saves leaves no item or worker export', async ({ page }) => {
  await ready(page);
  const result = await page.evaluate(() => {
    const oldPrompt = window.prompt;
    const oldExport = av.msg.exportExpr;
    const oldSendData = av.msg.sendData;
    const before = { files: Object.keys(av.fzr.file).sort(), c: av.fzr.cNum, g: av.fzr.gNum, w: av.fzr.wNum, state: av.fzr.saveState };
    const exports = [];
    window.prompt = () => null;
    av.msg.exportExpr = name => exports.push(name);
    av.msg.sendData = () => {};
    try {
      av.ptd.FrConfigFn('cancel test');
      av.ptd.FrOrganismFn('selected', 'cancel test');
      av.ptd.FrPopulationFn();
      return { before, after: { files: Object.keys(av.fzr.file).sort(), c: av.fzr.cNum, g: av.fzr.gNum, w: av.fzr.wNum, state: av.fzr.saveState }, exports };
    } finally {
      window.prompt = oldPrompt;
      av.msg.exportExpr = oldExport;
      av.msg.sendData = oldSendData;
    }
  });
  expect(result.after).toEqual(result.before);
  expect(result.exports).toEqual([]);
});

test('a running population can be frozen and restored from a workspace', async ({ page }, testInfo) => {
  await ready(page);
  await page.locator('#dom_w0').dragTo(page.locator('#activeConfig'));
  await page.locator('#runStopButton').click();
  await page.waitForFunction(() => av.grd.runState === 'started' && av.grd.popStatsMsg.update > 0, null, { timeout: 20000 });
  await page.locator('#runStopButton').click();
  await page.locator('#freezeButton').click();
  await expect(page.locator('#fzModalID')).toBeVisible();
  page.once('dialog', dialog => dialog.accept('Saved live population'));
  await page.locator('#fzModSaveWorld').click();
  const item = page.locator('#fzWorld .item').filter({ hasText: 'Saved live population' });
  await expect(item).toHaveCount(1);
  const dir = await item.evaluate(el => av.fzr.dir[el.id]);
  await page.waitForFunction(dir => Boolean(av.fzr.file[dir + '/detail.spop'] && av.fzr.file[dir + '/clade.ssg']), dir, { timeout: 20000 });
  const before = await page.evaluate(dir => ({
    population: av.fzr.file[dir + '/detail.spop'],
    clades: av.fzr.file[dir + '/clade.ssg'],
    config: av.fzr.file[dir + '/avida.cfg'],
    history: av.fzr.file[dir + '/tr0.txt']
  }), dir);
  expect(before.population.length).toBeGreaterThan(10);
  expect(before.clades.length).toBeGreaterThan(10);
  expect(before.history).toBeTruthy();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#mnFile').click();
  await page.locator('#mnFlSaveWorkspace').click();
  const download = await downloadPromise;
  const path = testInfo.outputPath('live-population-workspace.zip');
  await download.saveAs(path);
  await page.locator('#putWS').setInputFiles(path);
  await expect.poll(() => page.evaluate(() => av.fzr.saveState)).toBe('yes');
  const restored = page.locator('#fzWorld .item').filter({ hasText: 'Saved live population' });
  await expect(restored).toHaveCount(1);
  const after = await restored.evaluate(el => {
    const dir = av.fzr.dir[el.id];
    return { population: av.fzr.file[dir + '/detail.spop'], clades: av.fzr.file[dir + '/clade.ssg'], config: av.fzr.file[dir + '/avida.cfg'], history: av.fzr.file[dir + '/tr0.txt'] };
  });
  // The existing workspace reader strips leading and trailing whitespace.
  for (const key of Object.keys(before)) expect(after[key]).toBe(before[key].trim());
  await restored.dragTo(page.locator('#activeConfig'));
  await expect(page.locator('#newDishModalID')).toBeVisible();
  await page.locator('#newDishDiscard').click();
  await expect.poll(() => page.evaluate(() => av.fzr.actConfig.name)).toBe('Saved live population');
  await page.evaluate(() => window.avidaTest.clearMessages());
  await page.locator('#runStopButton').click();
  const response = await page.evaluate(() => window.avidaTest.waitForMessage(message =>
    message && message.type === 'response' && message.request && message.request.name === 'importExpr', 20000));
  expect(response.success).toBe(true);
});

test('cancelling a duplicate name leaves the freezer unchanged', async ({ page }) => {
  await ready(page);
  const items = page.locator('#fzConfig .item');
  const duplicate = (await items.first().textContent()).trim();
  const count = await items.count();
  const state = await page.evaluate(() => av.fzr.saveState);
  let prompts = 0;
  page.on('dialog', dialog => {
    prompts += 1;
    return prompts === 1 ? dialog.accept(duplicate) : dialog.dismiss();
  });
  await page.locator('#freezeButton').click();
  expect(prompts).toBe(2);
  await expect(items).toHaveCount(count);
  expect(await page.evaluate(() => av.fzr.saveState)).toBe(state);
});

test('dragging an ancestor to and from the freezer retains its genome', async ({ page }) => {
  await ready(page);
  const original = page.locator('#dom_g1');
  const genome = await original.evaluate(el => av.fzr.file[av.fzr.dir[el.id] + '/genome.seq']);
  await original.dragTo(page.locator('#ancestorBox'));
  const parent = page.locator('#ancestorBox .item').first();
  await expect(parent).toBeVisible();
  page.once('dialog', dialog => dialog.accept('Dragged parent'));
  await parent.dragTo(page.locator('#fzOrgan'));
  const frozen = page.locator('#fzOrgan .item').filter({ hasText: 'Dragged parent' });
  await expect(frozen).toHaveCount(1);
  expect(await frozen.evaluate(el => av.fzr.file[av.fzr.dir[el.id] + '/genome.seq'])).toBe(genome);
  expect(await page.evaluate(() => av.fzr.saveState)).toBe('no');
});

test('pending population exports block incomplete downloads until ready', async ({ page }, testInfo) => {
  await ready(page);
  await page.locator('#dom_w0').dragTo(page.locator('#activeConfig'));
  await page.locator('#runStopButton').click();
  await page.waitForFunction(() => av.grd.runState === 'started' && av.grd.popStatsMsg.update > 0, null, { timeout: 20000 });
  await page.locator('#runStopButton').click();
  await page.evaluate(() => {
    window.delayedPopulationExports = [];
    const original = av.fwt.popExpWrite;
    av.fwt.popExpWrite = function (message) {
      window.delayedPopulationExports.push(() => original(message));
    };
  });
  await page.locator('#freezeButton').click();
  page.once('dialog', dialog => dialog.accept('Pending population'));
  await page.locator('#fzModSaveWorld').click();
  const item = page.locator('#fzWorld .item').filter({ hasText: 'Pending population' });
  await expect(item).toHaveCount(1);
  const dir = await item.evaluate(el => av.fzr.dir[el.id]);
  await page.waitForFunction(() => window.delayedPopulationExports.length > 0, null, { timeout: 20000 });
  await page.evaluate(() => {
    window.originalSaveAs = window.saveAs;
    window.saveCalls = 0;
    window.saveAs = () => { window.saveCalls += 1; };
  });
  const warnings = [];
  page.on('dialog', dialog => { warnings.push(dialog.message()); return dialog.accept(); });
  await item.click();
  await page.locator('#mnFreezer').click();
  await page.locator('#mnFzExport').click();
  await page.locator('#mnFile').click();
  await page.locator('#mnFlSaveWorkspace').click();
  expect(warnings).toHaveLength(2);
  expect(warnings.every(message => message.includes('still being prepared'))).toBe(true);
  expect(await page.evaluate(() => window.saveCalls)).toBe(0);
  expect(await page.evaluate(() => av.fzr.saveState)).toBe('no');
  await page.evaluate(() => {
    window.delayedPopulationExports.splice(0).forEach(deliver => deliver());
    window.saveAs = window.originalSaveAs;
  });
  await expect.poll(() => page.evaluate(() => av.fzr.hasPendingWorldExport())).toBe(false);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#mnFile').click();
  await page.locator('#mnFlSaveWorkspace').click();
  const download = await downloadPromise;
  const path = testInfo.outputPath('pending-workspace.zip');
  await download.saveAs(path);
  const archive = new JSZip(fs.readFileSync(path));
  const files = Object.keys(archive.files);
  expect(files.some(name => name.endsWith('/' + dir + '/detail.spop'))).toBe(true);
});

test('a late population export cannot overwrite a replacement item', async ({ page }) => {
  await ready(page);
  const result = await page.evaluate(() => {
    const worker = av.aww.uiWorker;
    const requests = [];
    av.aww.uiWorker = { postMessage: request => requests.push(request) };
    try {
      av.msg.exportExpr('w999');
      av.fzr.clearMainFzrFn(); // Closing the workspace invalidates the first request.
      av.msg.exportExpr('w999');
      const payload = value => [
        { name: 'detail.spop', data: value + ' population' },
        { name: 'clade.ssg', data: value + ' clades' }
      ];
      av.fwt.popExpWrite({ popName: requests[0].popName, files: payload('old') });
      const afterOld = av.fzr.file['w999/detail.spop'];
      const stillPending = av.fzr.hasPendingWorldExport('w999');
      av.fzr.file['w999/clade.ssg'] = 'stale clades';
      av.fwt.popExpWrite({ popName: requests[1].popName, files: [{ name: 'detail.spop', data: 'partial' }] });
      const partialStillPending = av.fzr.hasPendingWorldExport('w999');
      av.fwt.popExpWrite({ popName: requests[1].popName, files: payload('new') });
      const afterNew = av.fzr.file['w999/detail.spop'];
      const pendingAfterNew = av.fzr.hasPendingWorldExport('w999');
      av.fzr.domid.w999 = 'temporary-item';
      av.fzr.file['w9999/detail.spop'] = 'neighbor population';
      av.msg.exportExpr('w999');
      av.fwt.removeFzrWorld('w999');
      av.fwt.popExpWrite({ popName: requests[2].popName, files: payload('deleted') });
      return {
        idsDiffer: requests[0].popName !== requests[1].popName,
        afterOld: afterOld === undefined ? null : afterOld,
        stillPending, partialStillPending,
        afterNew, pendingAfterNew,
        pendingAfterDelete: av.fzr.hasPendingWorldExport('w999'),
        afterLateDelete: av.fzr.file['w999/detail.spop'] || null,
        neighbor: av.fzr.file['w9999/detail.spop']
      };
    } finally {
      av.aww.uiWorker = worker;
      av.fzr.cancelPendingWorldExports('w999');
      delete av.fzr.file['w999/detail.spop'];
      delete av.fzr.file['w999/clade.ssg'];
      delete av.fzr.file['w9999/detail.spop'];
    }
  });
  expect(result).toEqual({ idsDiffer: true, afterOld: null, stillPending: true, partialStillPending: true, afterNew: 'new population', pendingAfterNew: false, pendingAfterDelete: false, afterLateDelete: null, neighbor: 'neighbor population' });
});

test('a populated dish dragged into the freezer survives a workspace reopen', async ({ page }, testInfo) => {
  await ready(page);
  await page.locator('#dom_w0').dragTo(page.locator('#activeConfig'));
  await page.locator('#runStopButton').click();
  await page.waitForFunction(() => av.grd.runState === 'started' && av.grd.popStatsMsg.update > 0, null, { timeout: 20000 });
  await page.locator('#runStopButton').click();
  page.once('dialog', dialog => dialog.accept('Dragged population'));
  await page.locator('#activeConfig .item').first().dragTo(page.locator('#fzWorld'));
  const frozen = page.locator('#fzWorld .item').filter({ hasText: 'Dragged population' });
  await expect(frozen).toHaveCount(1);
  const dir = await frozen.evaluate(el => av.fzr.dir[el.id]);
  await expect.poll(() => page.evaluate(dir => av.fzr.hasPendingWorldExport(dir), dir)).toBe(false);
  expect(await page.evaluate(dir => av.fzr.file[dir + '/entryname.txt'], dir)).toBe('Dragged population');
  expect(await page.evaluate(dir => av.fzr.file[dir + '/detail.spop'], dir)).toBeTruthy();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#mnFile').click();
  await page.locator('#mnFlSaveWorkspace').click();
  const download = await downloadPromise;
  const path = testInfo.outputPath('dragged-population-workspace.zip');
  await download.saveAs(path);
  await page.locator('#putWS').setInputFiles(path);
  await expect.poll(() => page.evaluate(() => av.fzr.saveState)).toBe('yes');
  await expect(page.locator('#fzWorld .item').filter({ hasText: 'Dragged population' })).toHaveCount(1);
});
