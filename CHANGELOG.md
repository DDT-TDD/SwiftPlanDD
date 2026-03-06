# Changelog

All notable changes to this project are documented in this file.

## [1.1.1] - 2026-03-06

### Added
- Ortho wall drawing mode with keyboard toggle and status indicator.
- Wall angle editing in the Inspector for selected walls.
- Scoped tracing import so a tracing can be assigned to the current floor or shared across all floors.
- Separate Inspector controls for floor-specific and global tracing underlays.
- Wall diagnostics overlay toggle to visualize endpoints and junction density while editing.
- Tracing replace and reset controls for both floor and global tracing entries.
- Foldable left toolbar and right Inspector panels to reclaim canvas space while drafting.
- 1.1.1 release smoke-test checklist for manual regression coverage.

### Changed
- Wall translation is now supported directly by dragging a selected wall segment or nudging it with arrow keys.
- Wall geometry edits now propagate through connected endpoints consistently from both canvas drags and Inspector edits.
- Tracing data now lives in project state so floor switching, exports, and imports preserve tracing scope and transforms.
- Autosave now degrades gracefully if browser storage cannot hold embedded tracing images.
- Canvas sizing now follows live panel collapse and expand state instead of relying on fixed sidebar widths.
- Release preparation now includes a targeted checklist for core wall/tracing workflows.

### Fixed
- Selected walls are no longer effectively locked in place when layout adjustments require repositioning.
- Wall length edits no longer break connected joints when the edited endpoint is shared with adjacent walls.
- Corner-handle drags no longer bubble into whole-wall translation, preventing unpredictable jumps while moving joined endpoints.
- Tracing images no longer create cross-floor confusion by always appearing on every floor.

### Verified
- Lint and production build passed after the wall-drag and foldable-panel changes.
- Store-level audit confirmed that endpoint moves and whole-wall moves both preserve connected shared endpoints.

## [1.1.0] - 2026-03-04

### Added
- Text/annotation tool with placement, editing, drag, and inspector controls.
- Expanded furniture library with additional categories and symbols.
- Auto-dimension overlay for walls with environment toggle.
- PDF export options dialog (paper size, orientation, scale label).
- Onboarding wizard for first-run guidance.
- Arc wall drawing tool (3-point curved wall workflow).
- Floor manager with floor switching and lower-floor ghost wall overlay.
- Rulers overlay and environment toggle.
- Recent projects list in header (stored locally).
- One-click "Fit Drawing to Selected Scale" action in the environment inspector.

### Changed
- Snap behavior enhanced with endpoint, midpoint, and perpendicular targets plus visual indicators.
- Draw.io export improved to export room polygons and corrected wall stroke widths.
- Undo/redo history now includes action labels shown in tooltips.
- Drag-heavy mutations use debounced history snapshots to reduce undo stack noise.
- Background tracing image supports opacity, scale, and offset controls.
- Fit action recenters the drawing, optimizes viewport zoom, and harmonizes grid spacing when Auto Grid is enabled.

### Fixed
- Floor manager dropdown now closes when clicking outside.
- Copy/paste now supports annotations.
- Escape key properly cancels active drawing and clears selection.
- Draw.io export handles rooms without computed area gracefully.
- Release documentation/license consistency updates for MIT declaration.

### Verified
- Full project audit passed with clean diagnostics, lint, and production build.

## [1.0.0] - 2026-01-xx

### Added
- Initial stable release of SwiftPlanDD with wall/opening/furniture tools.
- JSON project save/load and PNG/PDF/Draw.io exports.
- Multi-theme UI and rough drafting mode.
- Core undo/redo, snapping, panning, and keyboard workflows.
