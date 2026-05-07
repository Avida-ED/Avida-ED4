# Avida-ED 4

Avida-ED 4 is the browser-hosted Avida-ED application distributed through
GitHub Pages.

## Development

The app is static HTML, JavaScript, CSS, and bundled Avida worker assets.
There is no application compile step for normal UI work.

Install local test dependencies once:

```sh
npm install
npx playwright install
```

Serve the repository root while developing:

```sh
python3 -m http.server 8004
```

Then open:

```text
http://127.0.0.1:8004/
```

For browser automation and manual inspection of the test harness, add the
`avidaTest` query flag:

```text
http://127.0.0.1:8004/?avidaTest=1
```

That mode loads `test-harness.js` and exposes `window.avidaTest`, which wraps
worker startup, worker messages, and captured browser errors for Playwright.

## Tests

Run the browser regression suite with:

```sh
npm test
```

For an interactive browser run:

```sh
npm run test:headed
```

The suite in `tests/` currently covers app-shell rendering without the test
harness, opt-in test-harness loading, worker import/data flow, resource grid
messages, missing parent time-series data in population stats, freezer deletion
with stale DOM nodes, workspace-open save prompts, and CSV export with empty
analysis selections.

Generated dependencies and reports such as `node_modules/`, `test-results/`,
and `playwright-report/` are ignored by Git and should be kept locally between
test runs.
