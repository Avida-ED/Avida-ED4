# Browser regression tests

Install the locked dependencies and the browsers once:

```sh
npm ci
npx playwright install chromium firefox
```

Run `npm test` for the Chromium suite, or `npm test -- --browser=firefox --workers=1` for Firefox. The test configuration starts a local HTTP server on port 8124; `AVIDA_ED_BASE_URL` can point at an already running test instance. `--workers=1` reduces startup load on smaller machines.

The freezer tests cover configuration workspace save and reopen; item export and import for configurations, organisms, and populated dishes; context-menu export; naming and cancellation; real drag-and-drop; and a live population saved, reopened, and loaded back into the simulation. They also deliberately delay a worker response to check that incomplete population data cannot be downloaded and that stale replies do not overwrite replacement items. The Safari-availability tests set the app's Safari flag in the test browser to check that it does not block saving or exporting; they do not simulate Safari's download behavior. The worker smoke tests cover the Avida worker and selected existing regressions.

The tests run against a local web app and do not validate the packaged desktop application, real Safari, or every browser and operating system. Safari freezer save and export operations remain available but have not yet been verified in Safari.

Feedback tests intercept the email link and clipboard calls; no message is sent. They check user-entered text, optional edited diagnostics, character encoding, and the manual-copy fallback.
