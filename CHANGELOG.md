# Changelog

## Unreleased

- Added an opt-in `?avidaTest=1` browser harness and Playwright worker smoke test for running-instance regression checks.
- Added browser regression coverage for missing parent time-series data in population stats updates.
- Fixed population statistics updates and CSV export when parent/clade series are missing from incoming worker data.
- Fixed freezer item deletion paths so stale DOM nodes are not removed from the wrong parent.
- Fixed the save-workspace prompt when opening another workspace with unsaved freezer changes.
- Fixed CSV export from unexpected page states so it produces an empty CSV string instead of throwing on an undefined value.
- Guarded splash teardown, freezer item creation, and selected-organism color rendering when UI or grid data is incomplete.
