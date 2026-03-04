# Release Notes - SwiftPlanDD v1.1.0

SwiftPlanDD **v1.1.0** focuses on production polish, workflow speed, and feature depth for day-to-day floor planning.

## Highlights

### ✨ Editing & Annotation
- New **Text Tool** (`T`) for free-form notes and labels.
- Annotation editing from Inspector (text, font size, rotation).
- Annotation drag and double-click edit on canvas.

### 🧲 Precision & Drafting
- Enhanced snapping with:
  - Endpoint snap
  - Midpoint snap
  - Perpendicular projection snap
- Color-coded snap feedback and guide lines for faster drafting.
- Optional **Auto-Dimensions** for wall lengths.
- Optional **Rulers** overlay along top/left canvas edges.
- One-click **Fit Drawing to Selected Scale** for optimal viewport layout.

### 🧱 Geometry & Architectural Tools
- New **Arc Wall Tool** (`A`) using a 3-point curved wall workflow.
- Wall endpoint dragging with connected endpoint propagation for joined walls.
- Expanded furniture library with additional categories and symbols.

### 🏢 Multi-Floor Workflow
- Floor manager to add, rename, remove, and switch floors.
- Active floor isolation with lower-floor ghost wall overlay for alignment.

### 📤 Export & Output
- PDF export options:
  - A4 / A3 / Letter / Legal
  - Landscape / Portrait
  - Scale label presets
- Draw.io export improvements for room polygon geometry and line width scaling.

### 🚀 Performance & Usability
- Debounced undo history during drag operations.
- Action-aware undo/redo labels in tooltips.
- Mouse position update throttling for smoother interaction.
- Recent projects list in header (local storage).

### 🐛 Bug Fixes
- Floor manager dropdown now properly closes when clicking outside.
- Copy/paste now supports annotations.
- Escape key properly cancels active drawing and clears selection.
- Draw.io export handles rooms without computed area gracefully.

### ✅ Quality Audit
- Full regression audit completed for all features.
- Diagnostics, lint, and production build all validated successfully.

## Packaging
Build command:

```bash
npm run electron:build
```

Windows portable executable output:

- `dist_electron/SwiftPlanDD 1.1.0.exe`

## Compatibility
- Desktop: Windows (Electron build target: portable)
- Project format: `.swift.json`

## License
MIT License (see `LICENSE`).
