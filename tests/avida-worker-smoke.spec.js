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
