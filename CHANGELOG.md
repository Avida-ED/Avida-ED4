# Changelog

## Unreleased

- Kept workspace saving and freezer-item export available in Safari, with a non-blocking note that those operations have not yet been tested there.
- Fixed exporting a selected freezer item from the Freezer menu and importing the exported item again.
- Fixed parent organisms dragged to the freezer losing their genomes, and corrected the context menu for organisms saved from the population.
- Restricted freezer-item exports to the selected item's files, including when another item has a similar directory name.
- Prevented incomplete populated dishes from being downloaded while the simulation is still preparing them; late replies from a closed workspace are ignored.
- Fixed populated dishes dragged into the freezer losing their names when a workspace is reopened.
- Fixed cancelled population saves sending an unnecessary worker export, and expanded browser coverage for freezer workflows in Chromium and Firefox.
- Added an opt-in `?avidaTest=1` browser harness and Playwright worker smoke test for running-instance regression checks.
- Added browser regression coverage for freezer deletion with stale DOM nodes outside the target container.
- Added browser regression coverage for workspace-open prompts when freezer save state is uncertain.
- Added browser regression coverage for missing parent time-series data in population stats updates.
- Fixed population statistics updates and CSV export when parent/clade series are missing from incoming worker data.
- Fixed freezer item deletion paths so stale DOM nodes are not removed from the wrong parent.
- Fixed the save-workspace prompt when opening another workspace with unsaved freezer changes.
- Fixed CSV export from unexpected page states so it produces an empty CSV string instead of throwing on an undefined value.
- Guarded splash teardown, freezer item creation, and selected-organism color rendering when UI or grid data is incomplete.
