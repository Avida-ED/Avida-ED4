// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: process.env.AVIDA_ED_BASE_URL || 'http://127.0.0.1:8124',
    trace: 'retain-on-failure'
  },
  webServer: process.env.AVIDA_ED_BASE_URL ? undefined : {
    command: 'python3 -m http.server 8124',
    url: 'http://127.0.0.1:8124',
    reuseExistingServer: true,
    timeout: 10000
  }
});
