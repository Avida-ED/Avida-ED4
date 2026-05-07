const { test, expect } = require('@playwright/test');

const instsetCfg = [
  'INSTSET heads_default:hw_type=0',
  'INST nop-A',
  'INST nop-B',
  'INST nop-C',
  'INST if-n-equ',
  'INST if-less',
  'INST if-label',
  'INST mov-head',
  'INST jmp-head',
  'INST get-head',
  'INST set-flow',
  'INST shift-r',
  'INST shift-l',
  'INST inc',
  'INST dec',
  'INST push',
  'INST pop',
  'INST swap-stk',
  'INST swap',
  'INST add',
  'INST sub',
  'INST nand',
  'INST h-copy',
  'INST h-alloc',
  'INST h-divide',
  'INST IO',
  'INST h-search'
].join('\n');

const baseConfig = [
  'WORLD_X 30',
  'WORLD_Y 30',
  'WORLD_GEOMETRY 1',
  'COPY_MUT_PROB 0.02',
  'DIVIDE_INS_PROB 0.0',
  'DIVIDE_DEL_PROB 0.0',
  'OFFSPRING_SIZE_RANGE 1.0',
  'BIRTH_METHOD 0',
  'RANDOM_SEED -1',
  '#include instset.cfg',
  'PRECALC_PHENOTYPE 1',
  'VERSION_ID 2.14.0',
  'MERIT_INC_APPLY_IMMEDIATE 1'
].join('\n');

const environmentCfg = [
  'RESOURCE not000:geometry=grid:xdiffuse=0:ydiffuse=0',
  'CELL not000:0..899:initial=10',
  'REACTION not000 not process:resource=not000:value=1:type=pow requisite:max_count=1',
  'RESOURCE nan000:geometry=grid:xdiffuse=0:ydiffuse=0',
  'CELL nan000:0..899:initial=11',
  'REACTION nan000 nand process:resource=nan000:value=1:type=pow requisite:max_count=1',
  'RESOURCE and000:geometry=grid:xdiffuse=0:ydiffuse=0',
  'CELL and000:0..899:initial=12',
  'REACTION and000 and process:resource=and000:value=2:type=pow requisite:max_count=1',
  'RESOURCE orn000:geometry=grid:xdiffuse=0:ydiffuse=0',
  'CELL orn000:0..899:initial=13',
  'REACTION orn000 orn process:resource=orn000:value=2:type=pow requisite:max_count=1',
  'RESOURCE oro000:geometry=grid:xdiffuse=0:ydiffuse=0',
  'CELL oro000:0..899:initial=14',
  'REACTION oro000 or process:resource=oro000:value=3:type=pow requisite:max_count=1',
  'RESOURCE ant000:geometry=grid:xdiffuse=0:ydiffuse=0',
  'CELL ant000:0..899:initial=15',
  'REACTION ant000 andn process:resource=ant000:value=3:type=pow requisite:max_count=1',
  'RESOURCE nor000:geometry=grid:xdiffuse=0:ydiffuse=0',
  'CELL nor000:0..899:initial=16',
  'REACTION nor000 nor process:resource=nor000:value=4:type=pow requisite:max_count=1',
  'RESOURCE xor000:geometry=grid:xdiffuse=0:ydiffuse=0',
  'CELL xor000:0..899:initial=17',
  'REACTION xor000 xor process:resource=xor000:value=4:type=pow requisite:max_count=1',
  'RESOURCE equ000:geometry=grid:xdiffuse=0:ydiffuse=0',
  'CELL equ000:0..899:initial=18',
  'REACTION equ000 equ process:resource=equ000:value=5:type=pow requisite:max_count=1'
].join('\n');

test('worker imports an ED4 config and returns grid and population data', async ({ page }) => {
  await page.goto('/?avidaTest=1');
  await page.evaluate(() => window.avidaTest.waitForReady());

  await page.evaluate(({ avidaCfg, environment, instset }) => {
    window.avidaTest.clearMessages();
    window.avidaTest.importExpression([
      { name: 'avida.cfg', data: avidaCfg },
      { name: 'environment.cfg', data: environment },
      { name: 'instset.cfg', data: instset }
    ]);
  }, { avidaCfg: baseConfig, environment: environmentCfg, instset: instsetCfg });

  const importResponse = await page.evaluate(() => {
    return window.avidaTest.waitForMessage((message) =>
      message && message.type === 'response' && message.request && message.request.name === 'importExpr'
    );
  });
  expect(importResponse.success).toBe(true);

  await page.evaluate(() => {
    window.avidaTest.clearMessages();
    window.avidaTest.send({ type: 'addEvent', name: 'webGridData', start: 'begin', interval: 1 });
    window.avidaTest.send({ type: 'addEvent', name: 'webPopulationStats', start: 'now', interval: 1 });
    window.avidaTest.sendData();
    window.avidaTest.send({ type: 'stepUpdate' });
  });

  const grid = await page.evaluate(() => {
    return window.avidaTest.waitForMessage((message) =>
      message && message.type === 'data' && message.name === 'webGridData'
    );
  });

  for (const key of ['rnot', 'rnan', 'rand', 'rorn', 'roro', 'rant', 'rnor', 'rxor', 'requ']) {
    expect(grid[key]).toBeTruthy();
    expect(Array.isArray(grid[key].data)).toBe(true);
    expect(typeof grid[key].minVal).toBe('number');
    expect(typeof grid[key].maxVal).toBe('number');
  }

  const stats = await page.evaluate(() => {
    return window.avidaTest.waitForMessage((message) =>
      message && message.type === 'data' && message.name === 'webPopulationStats'
    );
  });
  expect(typeof stats.update).toBe('number');

  const errors = await page.evaluate(() => window.avidaTest.state.errors);
  expect(errors).toEqual([]);
});

test('population stats tolerate missing parent time-series arrays', async ({ page }) => {
  await page.goto('/?avidaTest=1');
  await page.evaluate(() => window.avidaTest.waitForReady());

  const result = await page.evaluate(() => {
    window.avidaTest.clearMessages();
    av.parents.name = ['@ancestor'];
    av.pch.numDads = 1;
    delete av.pch.dadFit['@ancestor'];
    delete av.pch.dadCst['@ancestor'];
    delete av.pch.dadEar['@ancestor'];
    delete av.pch.dadNum['@ancestor'];
    delete av.pch.dadVia['@ancestor'];

    av.msg.updatePopStats({
      update: 3210,
      ave_fitness: 0.25,
      ave_gestation_time: 189,
      ave_metabolic_rate: 47,
      ave_age: 1,
      organisms: 900,
      viables: 899,
      ave_repro_fitness: 0.24,
      ave_repro_gestation_time: 188,
      ave_repro_metabolic_rate: 46,
      with_offspring: 898,
      by_clade: {},
      globalResourceAmount: {},
      not: 0,
      nand: 0,
      and: 0,
      orn: 0,
      or: 0,
      andn: 0,
      nor: 0,
      xor: 0,
      equ: 0
    });

    return {
      dadFit: av.pch.dadFit['@ancestor'][3210],
      dadCst: av.pch.dadCst['@ancestor'][3210],
      errors: window.avidaTest.state.errors
    };
  });

  expect(result.dadFit).toBeNull();
  expect(result.dadCst).toBeNull();
  expect(result.errors).toEqual([]);
});

test('freezer delete tolerates stale DOM nodes outside the target container', async ({ page }) => {
  await page.goto('/?avidaTest=1');
  await page.evaluate(() => window.avidaTest.waitForReady());

  const result = await page.evaluate(() => {
    window.avidaTest.clearMessages();
    var itemId = 'staleFzOrganItem';
    var dir = 'g987';
    var container = document.getElementById('fzOrgan');
    var staleItem = document.createElement('div');
    var menuItems = [];
    var oldMenu = dijit.Menu;
    var oldMenuItem = dijit.MenuItem;
    var oldConfirm = window.confirm;
    var oldRemoveFzrItem = av.fwt.removeFzrItem;
    var oldSaveUpdateState = av.fzr.saveUpdateState;
    var removed = [];
    var saved = [];

    staleItem.id = itemId;
    staleItem.textContent = '@F1- Daisy';
    document.body.appendChild(staleItem);

    av.fzr.dir[itemId] = dir;
    av.fzr.file[dir + '/entryname.txt'] = '@F1- Daisy';
    av.dnd.containerMap['#fzOrgan'] = av.dnd.containerMap['#fzOrgan'] || {};
    av.dnd.containerMap['#fzOrgan'][itemId] = { name: '@F1- Daisy' };

    window.confirm = function () { return true; };
    av.fwt.removeFzrItem = function (removeDir, type) {
      removed.push({ dir: removeDir, type: type });
    };
    av.fzr.saveUpdateState = function (state) {
      saved.push(state);
    };
    dijit.Menu = function () {
      this.addChild = function (item) {
        menuItems.push(item);
      };
    };
    dijit.MenuItem = function (options) {
      return options;
    };

    try {
      av.dnd.contextMenu(container, itemId, 'playwright');
      menuItems.filter(function (item) { return item.label === 'delete'; })[0].onClick();
    } finally {
      dijit.Menu = oldMenu;
      dijit.MenuItem = oldMenuItem;
      window.confirm = oldConfirm;
      av.fwt.removeFzrItem = oldRemoveFzrItem;
      av.fzr.saveUpdateState = oldSaveUpdateState;
      if (staleItem.parentNode) staleItem.parentNode.removeChild(staleItem);
      delete av.fzr.dir[itemId];
      delete av.fzr.file[dir + '/entryname.txt'];
    }

    return {
      removed: removed,
      saved: saved,
      stillInMap: Boolean(av.dnd.containerMap['#fzOrgan'][itemId]),
      errors: window.avidaTest.state.errors
    };
  });

  expect(result.removed).toEqual([{ dir: 'g987', type: 'g' }]);
  expect(result.saved).toEqual(['no']);
  expect(result.stillInMap).toBe(false);
  expect(result.errors).toEqual([]);
});

test('open workspace prompts when freezer save state is maybe', async ({ page }) => {
  await page.goto('/?avidaTest=1');
  await page.evaluate(() => window.avidaTest.waitForReady());

  const result = await page.evaluate(() => {
    window.avidaTest.clearMessages();
    var modal = document.getElementById('sWSfModalID');
    var putWS = document.getElementById('putWS');
    var openWS = document.getElementById('mnFlOpenWS');
    var openDefaultWS = document.getElementById('mnFlOpenDefaultWS');
    var oldDisplay = modal.style.display;
    var oldClick = putWS.click;
    var oldReadZipWS = av.fio.readZipWS;
    var oldSaveState = av.fzr.saveState;
    var clicked = 0;
    var readCalls = [];

    putWS.click = function () {
      clicked += 1;
    };
    av.fio.readZipWS = function (fname, loadConfigFlag) {
      readCalls.push({ fname: fname, loadConfigFlag: loadConfigFlag });
    };

    function run(button, state) {
      modal.style.display = 'none';
      clicked = 0;
      readCalls.length = 0;
      av.fzr.saveState = state;
      button.onclick();
      return {
        display: modal.style.display,
        clicked: clicked,
        readCalls: readCalls.slice()
      };
    }

    try {
      return {
        userMaybe: run(openWS, 'maybe'),
        userNo: run(openWS, 'no'),
        userYes: run(openWS, 'yes'),
        defaultMaybe: run(openDefaultWS, 'maybe'),
        defaultYes: run(openDefaultWS, 'yes'),
        errors: window.avidaTest.state.errors
      };
    } finally {
      putWS.click = oldClick;
      av.fio.readZipWS = oldReadZipWS;
      av.fzr.saveState = oldSaveState;
      modal.style.display = oldDisplay;
    }
  });

  expect(result.userMaybe).toMatchObject({ display: 'block', clicked: 0 });
  expect(result.userNo).toMatchObject({ display: 'block', clicked: 0 });
  expect(result.userYes).toMatchObject({ display: 'none', clicked: 1 });
  expect(result.defaultMaybe).toMatchObject({ display: 'block', clicked: 0 });
  expect(result.defaultYes.display).toBe('none');
  expect(result.defaultYes.readCalls).toHaveLength(1);
  expect(result.defaultYes.readCalls[0].loadConfigFlag).toBe(false);
  expect(result.errors).toEqual([]);
});

test('CSV export tolerates empty analysis selections', async ({ page }) => {
  await page.goto('/?avidaTest=1');
  await page.evaluate(() => window.avidaTest.waitForReady());

  const result = await page.evaluate(() => {
    window.avidaTest.clearMessages();
    var oldPage = av.ui.page;
    var oldPop = av.fzr.pop;
    var labels = [0, 1, 2].map(function (index) {
      return document.getElementById('popDish' + index).textContent;
    });

    try {
      av.ui.page = 'analysisBlock';
      av.fzr.pop = [
        { fit: [], ges: [], met: [], num: [], via: [] },
        { fit: [], ges: [], met: [], num: [], via: [] },
        { fit: [], ges: [], met: [], num: [], via: [] }
      ];
      [0, 1, 2].forEach(function (index) {
        document.getElementById('popDish' + index).textContent = '';
      });
      av.fwt.makeCSV('empty-analysis.csv', 'playwright');
      return {
        csv: av.fwt.csvStrg,
        errors: window.avidaTest.state.errors
      };
    } finally {
      av.ui.page = oldPage;
      av.fzr.pop = oldPop;
      [0, 1, 2].forEach(function (index) {
        document.getElementById('popDish' + index).textContent = labels[index];
      });
    }
  });

  expect(result.csv).toBe('Update');
  expect(result.errors).toEqual([]);
});
