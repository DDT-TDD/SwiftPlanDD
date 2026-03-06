# Release Notes - SwiftPlanDD v1.1.1

SwiftPlanDD **v1.1.1** focuses on wall-editing control, clearer multi-floor tracing workflows, and drafting precision improvements for production planning.

## Highlights

### Wall Editing
- Selected walls can now be moved directly by dragging the wall segment.
- Arrow keys can nudge a selected wall for fine positioning.
- Wall length edits now keep connected joins intact.
- Selected walls now expose an **Angle** field in the Inspector for post-creation adjustment.
- Optional wall diagnostics overlay can highlight endpoint and junction density during editing.
- Dragging a wall corner now updates the intended endpoint only, without accidental whole-wall jumps from event bubbling.

### Workspace Layout
- The left toolbar and right Inspector are now foldable so you can reclaim more drawing space on smaller screens.
- Canvas sizing now responds to panel collapse and expand events automatically.

### Tracing Workflow
- Tracing import now supports two scopes:
  - **Current floor only**
  - **All floors**
- Floor-specific tracing overrides the global tracing on that floor to avoid overlay confusion.
- Tracing opacity, scale, and offsets are preserved with project save/load and floor switching.
- Tracing entries can now be replaced in place and reset to default transforms without reimporting from scratch.

### Precision Drafting
- New **Ortho Wall Drawing** mode locks new walls to horizontal and vertical directions.
- Existing 45° Shift-constrained drawing remains available when Ortho mode is off.
- Status bar and shortcuts now expose the active ortho state more clearly.

### Stability & Consistency
- Wall topology propagation is now shared between drag and Inspector edits, reducing mismatched joints.
- Autosave now falls back safely when embedded tracing images are too large for browser storage quotas.

## Verification
- `npm run lint` passed.
- `npm run build` passed.
- Store-level audit confirmed connected endpoints stay attached during both endpoint moves and whole-wall moves.

### QA Readiness
- A dedicated smoke checklist for `v1.1.1` is included in `RELEASE_SMOKE_TEST_v1.1.1.md`.

## Packaging
Build command:

```bash
npm run electron:build
```

Expected Windows portable output:

- `dist_electron/SwiftPlanDD 1.1.1.exe`

## Compatibility
- Desktop: Windows (Electron portable target)
- Project format: `.swift.json`

## License
MIT License (see `LICENSE`).