# Changelog

All notable changes to this project are documented in this file.

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
