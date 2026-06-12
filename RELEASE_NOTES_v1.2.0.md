# Release Notes - SwiftPlanDD v1.2.0

SwiftPlanDD **v1.2.0** introduces professional CAD precision enhancements, multi-floor undo/redo history safety, flexible object resizing handles, and premium style improvements.

## Highlights

### 1. Snapping Controls & Alt Bypass
- **Alt snapping bypass:** Pressing and holding the `Alt` key (or `Option` key on Mac) temporarily suspends grid and endpoint snapping. This enables pixel-precise placement of walls, measurements, and annotations.

### 2. Precise Object Manipulation
- **8-Anchor Resize Transformer:** Replaced the proportional corner-only handles with full 8-anchor handles. You can now resize and stretch the width or depth of selected furniture items independently directly on the canvas.

### 3. Escape Key Workflow Polish
- **Tool Cancellation Reset:** Pressing `Escape` while drawing wall segments or measurements cancels the active segment drawing. Pressing `Escape` again (or when no drawing is active) now automatically switches the current tool back to the default **Select** (V) tool.

### 4. Continuous Wall Drawing Tooltip
- **Floating HUD Overlay:** Added a cursor-following tooltip overlay that renders next to the active coordinate crosshair while drawing walls. It provides real-time updates for length (in mm) and angle (in degrees).

### 5. Multi-Floor History & Integrity
- **Undoable Floor Operations:** Adding, renaming, and removing floors in the Floor Manager now registers inside the undo/redo history stack, preventing accidental project loss.
- **Global History Switching:** History state now tracks all floors. Undoing edits made on other floors will automatically switch the active floor focus to where the edit occurred and restore the correct geometry.
- **Preserved History:** Swapping floors no longer clears the undo/redo stack.

### 6. Visual Polish & CSS Cleanups
- **Premium Fonts:** Integrated `Outfit` and `Inter` font families via Google Fonts.
- **Pure CSS Transitions & Hovers:** Removed manual hover style mutations on the Context Menu and Sidebar. Library buttons now use a dynamic hover class (`.library-button`) resolving cursor/text visual artifacts.

## Verification
- `npm run lint` passed.
- `npm run build` passed.

## Packaging
Build command:
```bash
npm run electron:build
```

Expected Windows portable output:
- `dist_electron/SwiftPlanDD 1.2.0.exe`
