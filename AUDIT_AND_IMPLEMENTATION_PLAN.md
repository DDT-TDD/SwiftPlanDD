# SwiftPlanDD — Full Audit & Implementation Plan

**Date:** 2026-03-03  
**Audited Version:** 1.0.0  
**Stack:** React 19 + Vite 7 + Konva + Zustand + Electron 40 + roughjs

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Feature Gap Analysis vs HomePlan Pro](#2-feature-gap-analysis-vs-homeplan-pro)
3. [Bug Report — Critical & High Priority](#3-bug-report--critical--high-priority)
4. [ESLint Errors — 20 Errors, 3 Warnings](#4-eslint-errors--20-errors-3-warnings)
5. [UX Audit — Usability for Non-CAD Users](#5-ux-audit--usability-for-non-cad-users)
6. [Architecture & Performance Issues](#6-architecture--performance-issues)
7. [Implementation Plan — Phased Roadmap](#7-implementation-plan--phased-roadmap)

---

## 1. Executive Summary

SwiftPlanDD is a promising Electron-based home interior planner with a clean React/Konva architecture, three themes (light/dark/blueprint), multi-unit support, undo/redo, and PNG/PDF/Draw.io export. However, the current v1.0.0 has **20 ESLint errors**, several **functional bugs**, and significant **usability gaps** that prevent non-CAD users from effectively planning their interiors.

Compared to HomePlan Pro's feature set (which targets the same audience — homeowners, realtors, contractors), SwiftPlanDD is missing critical features like **auto-save/persistence**, **copy/paste**, **angle-constrained drawing**, **automatic dimensioning**, **multi-select**, **wall topology** (connected walls), and a comprehensive **furniture/symbol library**.

The tool's foundation is solid. The phased plan below addresses bugs first, then UX fundamentals, then feature parity, and finally polish — designed for implementation by a modern AI coding assistant.

---

## 2. Feature Gap Analysis vs HomePlan Pro

| HomePlan Pro Feature | SwiftPlanDD Status | Priority |
|---|---|---|
| **Draw arcs, rectangles, circles, lines** | Only walls (lines) and rectangles (rooms/furniture) | HIGH |
| **Automatic dimension lines** | Manual measure tool only; no auto-dimensions on walls | CRITICAL |
| **Automatic door & window insertion** | Manual placement only; no wall-click-to-insert | HIGH |
| **Automatic drawing to specified dimensions** | Can type dimensions in Inspector, but no direct numeric input while drawing | HIGH |
| **Adjustable wall thicknesses** | Global setting, but default value is bugged (20mm vs 200mm) | CRITICAL |
| **Calculate square feet/meters** | Room area displayed — ✅ DONE | — |
| **Clip & save sections** | Not available | MEDIUM |
| **Delete objects or sections** | Delete single objects — ✅ DONE; no area/region delete | LOW |
| **Fill patterns** | Room fill patterns — ✅ DONE | — |
| **Mouse and keyboard drawing** | Mouse only; no keyboard dimension input during drawing | HIGH |
| **Hundreds of furniture/symbol library items** | 16 presets in 4 categories | HIGH |
| **On-screen measurement odometers** | Mouse coords shown in stats overlay | LOW |
| **Multiple line styles** | Rough mode toggle only | MEDIUM |
| **Multiple text sizes** | No text/annotation tool | HIGH |
| **Repeat/clone last action** | Not available | MEDIUM |
| **Resize all or part of drawings** | No scale/resize tool | MEDIUM |
| **Undo/Redo** | ✅ DONE (50-state history) | — |
| **Zoom in/out** | ✅ DONE (mouse wheel) | — |
| **Print with scale control** | Export to PDF with basic scaling | MEDIUM |
| **Custom/predefined print scales** | Single scale factor, no presets | MEDIUM |
| **Paper size & orientation selection** | Hardcoded landscape | MEDIUM |
| **Snap grid adjustable** | Grid spacing adjustable — ✅ DONE | — |
| **Metric & USA measurement** | ✅ DONE (m, cm, mm, ft, in) | — |
| **Interactive tutorial** | Help modal with static text only | MEDIUM |
| **Quick and easy to learn** | NEEDS WORK — see UX audit | CRITICAL |

---

## 3. Bug Report — Critical & High Priority

### BUG-01: Cursor Indicator Position Mismatch (CRITICAL)
**File:** `src/components/canvas/InteractionLayer.jsx`  
**Issue:** The snap cursor circle uses raw `mousePos.x/y` (mm coordinates), but wall/furniture layers divide coordinates by `canvasScale`. At any `canvasScale ≠ 1` (default is 100), the cursor appears in a completely different location than the drawing elements.  
**Impact:** Users cannot see where they're clicking. The snap indicator is useless.  
**Fix:** Divide cursor position by `canvasScale` to match other layers.

### BUG-02: Default Wall Thickness Inconsistency (CRITICAL)
**File:** `src/store/useEditorStore.js` line 22 vs `src/utils/constants.js` line 3  
**Issue:** Editor store default `wallThickness: 20` (20mm = paper-thin) while `DEFAULT_WALL_THICKNESS = 200` (200mm = standard 20cm). New walls created from the store default are invisible-thin.  
**Impact:** Walls drawn by users appear as hairlines.  
**Fix:** Change store default to `wallThickness: 200`.

### BUG-03: `findNearestWall` Threshold Too Small (HIGH)
**File:** `src/utils/snapping.js`  
**Issue:** `minDist = 30` is in mm. At 1:100 canvas scale, 30mm = 0.3 screen-pixels. Users cannot click on walls to select them via this function.  
**Impact:** Wall selection is nearly impossible at common zoom levels.  
**Fix:** Scale the threshold by `canvasScale` or use screen-pixel-based thresholds.

### BUG-04: `stageRef.current` in useEffect Dependencies (HIGH)
**File:** `src/components/canvas/StageManager.jsx` line 46  
**Issue:** React refs in dependency arrays don't trigger re-renders. ESLint correctly flags this as an error. The current approach silently fails.  
**Fix:** Use a callback ref pattern or `useCallback` ref.

### BUG-05: No Window Resize Handling (HIGH)
**File:** `src/components/canvas/StageManager.jsx`  
**Issue:** `Stage` width/height uses `window.innerWidth - 380` computed once. Resizing the window leaves the canvas at the wrong size.  
**Fix:** Add a `resize` event listener that updates `Stage` dimensions.

### BUG-06: Memory Leak — Background Image URL Not Revoked (MEDIUM)
**File:** `src/components/ui/Header.jsx`  
**Issue:** `URL.createObjectURL(file)` is never followed by `URL.revokeObjectURL()`. Each background image upload leaks memory.  
**Fix:** Revoke previous URL before creating a new one.

### BUG-07: Sidebar Delete Button Doesn't Deselect (MEDIUM)
**File:** `src/components/ui/Sidebar.jsx`  
**Issue:** After deleting via the sidebar button, `selectedId` still references the deleted item. (The Delete key in `App.jsx` correctly calls `setSelectedId(null)`, but the sidebar button does not.)  
**Fix:** Call `setSelectedId(null)` after deletion.

### BUG-08: Furniture Position Fallback Masks Valid Zero Coord (MEDIUM)
**File:** `src/components/ui/Inspector.jsx`  
**Issue:** `|| 1000` used as position fallback — if `centerX` or `centerY` is legitimately `0`, furniture is wrongly placed at `1000`.  
**Fix:** Use `?? 1000` (nullish coalescing) instead of `||`.

### BUG-09: `Date.now()` ID Collisions (LOW)
**Files:** `StageManager.jsx`, `Inspector.jsx`  
**Issue:** Rapid creation of items (e.g., fast double-click) can produce duplicate IDs.  
**Fix:** Use `crypto.randomUUID()` or a monotonic counter.

### BUG-10: Context Menu Renders Off-Screen (LOW)
**File:** `src/components/ui/ContextMenu.jsx`  
**Issue:** Menu position uses raw mouse coordinates without viewport boundary clamping.  
**Fix:** Clamp `x` and `y` to keep the menu within the viewport.

---

## 4. ESLint Errors — 20 Errors, 3 Warnings

All extracted from the project's own `eslint_output.txt`:

### Unused Variables / Imports (Quick Fixes)
| # | File | Variable | Fix |
|---|---|---|---|
| 1 | `RoomLayer.jsx:4` | `formatValue` imported but unused | Remove import |
| 2 | `RoomLayer.jsx:14` | `unit` assigned but unused | Remove destructuring |
| 3 | `StageManager.jsx:37` | `selectedId` assigned but unused | Remove destructuring |
| 4 | `StageManager.jsx:39` | `setContextMenu` assigned but unused | Remove destructuring |
| 5 | `StageManager.jsx:51` | `openings` assigned but unused | Remove destructuring |
| 6 | `Header.jsx:40` | `err` in catch block | Rename to `_err` or remove |
| 7 | `Inspector.jsx:20` | `tool` assigned but unused | Remove destructuring |
| 8 | `exportUtils.js:4` | `themeName` parameter unused | Remove parameter or use `_themeName` |
| 9 | `exportUtils.js:72` | `pointsString` assigned but unused | Remove variable or implement polygon export |
| 10 | `snapping.js:1` | `getPointAtOffset` imported but unused | Remove import |

### React Hooks Violations
| # | File | Issue | Fix |
|---|---|---|---|
| 11–12 | `StageManager.jsx:46` | `stageRef.current` in useEffect deps (refs during render) | Use callback ref pattern |
| 13 | `WallLayer.jsx:17` | `useMemo` called conditionally / not defined | Import `useMemo` from React; restructure conditional logic |
| 14 | `WallLayer.jsx:52` | Same — `useMemo` not defined | Add import |
| 15 | `WallLayer.jsx:75` | Same — `useMemo` not defined | Add import |
| 16–18 | `WallLayer.jsx:71` | `preserve-manual-memoization` — deps `p1`, `p2`, `wallDistPx` may be mutated | Memoize `p1`/`p2` with individual `useMemo` |
| 19 | `Inspector.jsx:178` | `useEditorStore` called inside callback | Use `useEditorStore.getState()` (Zustand-safe pattern, suppress lint) |

### Warnings
| # | File | Issue | Fix |
|---|---|---|---|
| W1 | `StageManager.jsx:46` | Unnecessary dependency `stageRef.current` | Remove from deps |
| W2-3 | `WallLayer.jsx:45-46` | `p1`/`p2` objects in useMemo deps cause re-render every render | Wrap in individual `useMemo` or use primitive deps |

---

## 5. UX Audit — Usability for Non-CAD Users

### 5.1 Onboarding & Discoverability
| Issue | Severity | Recommendation |
|---|---|---|
| No guided first-run experience | HIGH | Add a 3-step welcome wizard: "Draw walls → Add doors → Place furniture" |
| Help modal is static text — hard to scan | MEDIUM | Add animated GIFs or step-by-step walkthrough |
| Tool icons have no visible labels | HIGH | Add text labels below icons (not just `title` tooltips) |
| No keyboard shortcut legend visible | MEDIUM | Show shortcut hints next to tool buttons (e.g., "W" for Wall) |
| Escape key doesn't close any modal/context menu | MEDIUM | Implement Escape key handler universally |

### 5.2 Drawing Experience
| Issue | Severity | Recommendation |
|---|---|---|
| No numeric input during wall drawing | CRITICAL | Allow typing exact length after first click (e.g., "3500" + Enter = 3.5m wall) |
| No angle constraints (45°/90°) | CRITICAL | Hold Shift to constrain to orthogonal/45° angles |
| No visual feedback when approaching snap points | HIGH | Show a colored indicator (green dot/line) when within snap range |
| Snapping only to wall endpoints, not midpoints/perpendicular | HIGH | Expand snap targets: midpoints, perpendicular projections, intersections |
| No wall-to-wall connection/joining | HIGH | Auto-join walls that share endpoints within snap threshold |
| Right-click drag for panning is non-standard | MEDIUM | Use middle-click or Ctrl+drag for panning; right-click for context menu only |
| No continuous wall drawing mode | HIGH | After placing a wall, auto-start next wall from the endpoint |
| Background image has no position/scale/opacity controls | HIGH | Add transform controls for tracing image alignment |

### 5.3 Object Manipulation
| Issue | Severity | Recommendation |
|---|---|---|
| No rotation handles on furniture | HIGH | Add visual rotation handle on selected furniture |
| No resize handles (drag to resize) | HIGH | Add corner drag handles for furniture and rooms |
| No copy/paste (Ctrl+C / Ctrl+V) | HIGH | Implement with position offset for pasted items |
| No multi-select (Shift+click or drag-select) | MEDIUM | Add marquee selection and Shift+click additive selection |
| No alignment/distribution tools | MEDIUM | "Align left/center/right" for multiple selected items |
| Double-click to edit text not supported | MEDIUM | Allow inline editing of room names/labels |

### 5.4 Door & Window Placement
| Issue | Severity | Recommendation |
|---|---|---|
| Doors/windows placed manually without wall awareness | CRITICAL | Click on a wall to insert; door auto-aligns to wall |
| No door swing direction control | HIGH | Toggle swing left/right/in/out via click or Inspector |
| No automatic wall cutout preview during placement | MEDIUM | Show ghost preview of the opening in the wall while hovering |
| Window sill height not a parameter | LOW | Add sill height for elevation-aware planning |

### 5.5 Inspector & Settings
| Issue | Severity | Recommendation |
|---|---|---|
| Furniture library has only 16 items | HIGH | Expand to 50+ items across 8+ categories (Office, Outdoor, Laundry, Kids, etc.) |
| No search/filter in furniture library | MEDIUM | Add search bar to filter furniture by name |
| Theme colors for disabled state hardcoded | LOW | Use theme-aware disabled colors |
| No "fit to view" / "zoom to extents" | HIGH | Button to auto-frame all content in the viewport |
| No ruler along canvas edges | MEDIUM | Show horizontal/vertical rulers with scale markings |

### 5.6 File & Project Management
| Issue | Severity | Recommendation |
|---|---|---|
| No auto-save | CRITICAL | Auto-save to localStorage every 30 seconds |
| No recent projects list | HIGH | Show recently opened projects on startup |
| Closing app loses all work | CRITICAL | Prompt "Save before closing?" via Electron `before-quit` |
| Import doesn't support undo | MEDIUM | Call `saveState()` before `importProject()` |
| No "New Project" confirmation | MEDIUM | Warn if unsaved changes exist |

---

## 6. Architecture & Performance Issues

### 6.1 Performance
| Issue | Impact | Fix |
|---|---|---|
| `setMousePos` on every mouse move triggers all subscribers | Lag with 50+ elements | Throttle to 16ms (60fps) or use Zustand selectors |
| Full state snapshot on every mutation for undo | Memory bloat | Use structural sharing (immer) or command pattern |
| Rapid drag = hundreds of undo states | Undo stack filled with noise | Debounce `saveState()` during drag operations |
| Wall segments recalculated every render (IIFE, not memoized) | CPU waste | Proper `useMemo` with stable dependencies |
| Room centroid calculation naive | Wrong label position on concave rooms | Use pole-of-inaccessibility algorithm |

### 6.2 Architecture
| Issue | Impact | Fix |
|---|---|---|
| No wall topology graph | Walls don't "know" about connections | Implement wall graph data structure (nodes at endpoints) |
| Grid rendered via CSS background, not Konva | Grid missing from exports | Draw grid in a Konva `Layer` |
| `App.css` is dead Vite boilerplate | Clutter | Delete file |
| `pako` dependency unused | Bundle size waste | Remove from `package.json` |
| `preload.js` is a no-op | No Electron IPC capability | Implement `contextBridge` for file dialogs, save/load |
| Hardcoded `380px` sidebar/inspector width | Not responsive | Use CSS `calc()` or `ResizeObserver` |
| Title "swiftplandd" inconsistent with branding | Unprofessional | Fix to "SwiftPlanDD" |

---

## 7. Implementation Plan — Phased Roadmap

### Phase 0: Bug Fixes & Lint Cleanup (1–2 sessions)
**Goal:** Zero errors, stable foundation.

```
0.1 Fix all 20 ESLint errors (unused vars, imports, hooks violations)
0.2 Fix BUG-01: Cursor position mismatch in InteractionLayer.jsx
0.3 Fix BUG-02: Default wallThickness 20 → 200 in useEditorStore.js
0.4 Fix BUG-03: findNearestWall threshold scaling in snapping.js
0.5 Fix BUG-04: stageRef.current in useEffect deps (callback ref pattern)
0.6 Fix BUG-05: Add window resize handler for Stage dimensions
0.7 Fix BUG-06: Revoke background image object URL
0.8 Fix BUG-07: Sidebar delete deselects selectedId
0.9 Fix BUG-08: Use ?? instead of || for furniture position fallback
0.10 Fix BUG-09: Replace Date.now() with crypto.randomUUID()
0.11 Fix BUG-10: Clamp context menu to viewport bounds
0.12 Delete dead App.css, remove unused pako dependency
0.13 Fix index.html title to "SwiftPlanDD"
```

### Phase 1: Core UX — Make It Usable (3–4 sessions)
**Goal:** A non-CAD user can draw a room and place furniture without frustration.

```
1.1 SHIFT-CONSTRAINED DRAWING: Hold Shift during wall drawing to snap
    to 0°/45°/90° angles. Show angle indicator near cursor.

1.2 NUMERIC INPUT DURING DRAWING: After placing the first wall point,
    show a floating input field. User types "3500" + Enter → wall is
    exactly 3500mm. Tab cycles between length/angle inputs.

1.3 CONTINUOUS WALL MODE: After completing a wall segment, auto-start
    the next wall from the previous endpoint. Press Escape or double-
    click to exit. Show visual "chain" indicator.

1.4 SMART DOOR/WINDOW PLACEMENT: When Door/Window tool is active,
    clicking near a wall auto-inserts the opening centered at the
    click point, aligned to the wall. Show preview ghost while
    hovering over a wall.

1.5 AUTO-SAVE & PERSISTENCE: Save project to localStorage every 30
    seconds. On app launch, restore last session. Add "Save before
    closing?" dialog via Electron IPC (implement preload.js
    contextBridge).

1.6 WINDOW RESIZE HANDLING: Add ResizeObserver or window 'resize'
    event → update Stage width/height dynamically.

1.7 FIT-TO-VIEW BUTTON: "Zoom to Extents" button that calculates
    the bounding box of all elements and sets stagePos/stageScale
    to frame everything with 10% padding.

1.8 ESCAPE KEY UNIVERSAL: Escape closes modals, cancels active
    drawing, deselects current selection, closes context menu.
```

### Phase 2: Enhanced Interaction (3–4 sessions)
**Goal:** Manipulation feels intuitive and efficient.

```
2.1 ROTATION HANDLES: Show a rotation handle (circle above selected
    furniture). Drag to rotate freely; Shift+drag to snap to 15°
    increments. Display angle tooltip during rotation.

2.2 RESIZE HANDLES: Show corner/edge handles on selected furniture.
    Drag to resize proportionally (corner) or along one axis (edge).
    Show dimension tooltip during resize.

2.3 COPY/PASTE: Ctrl+C stores selected item to clipboard state.
    Ctrl+V places a copy offset by (200mm, 200mm). Ctrl+D for
    duplicate-in-place.

2.4 MULTI-SELECT: Shift+click adds to selection. Drag an empty area
    to create a selection marquee. Multi-selected items move, delete,
    copy as a group.

2.5 SNAP ENHANCEMENT: Add snap targets — wall midpoints, perpendicular
    projections, T-intersections. Show colored guide lines (green for
    endpoint, blue for midpoint, orange for perpendicular). Display
    snap type indicator.

2.6 WALL TOPOLOGY: Implement a wall graph — when walls share endpoints
    within snap threshold, they're "connected". Moving a wall endpoint
    drags connected walls. Inserting an opening references the host
    wall, and moving the wall moves the opening.

2.7 BACKGROUND IMAGE CONTROLS: Add position (drag), scale (slider or
    corner handles), and opacity (slider) controls for the tracing
    image. Store settings in editor store.

2.8 DRAG-DEBOUNCED UNDO: During drag operations (furniture move, wall
    endpoint move), save undo state only on mouseup, not on every
    mousemove.
```

### Phase 3: Feature Expansion (4–5 sessions)
**Goal:** Feature parity with HomePlan Pro essentials.

```
3.1 EXPANDED FURNITURE LIBRARY: Add 50+ items across 8 categories:
    Living, Bedroom, Kitchen, Bath, Office, Outdoor, Laundry, Kids.
    Include common items: desk, bookshelf, washing machine, dryer,
    baby crib, outdoor table, grill, plant pots, etc.

3.2 FURNITURE SEARCH: Add search/filter bar in the Inspector's
    furniture section. Filter by name as user types.

3.3 TEXT/ANNOTATION TOOL: Free-text labels that can be placed anywhere
    on the canvas. Support font size, color (theme-aware), and
    rotation. Used for room labels, notes, dimensions.

3.4 AUTO-DIMENSION LINES: When a wall is drawn, automatically place a
    dimension line parallel to the wall showing the length. Update when
    the wall is resized. Toggle via environment setting.

3.5 RULERS & GUIDES: Horizontal and vertical rulers along the canvas
    edges with scale markings. Click+drag from ruler to create guide
    lines (snappable).

3.6 DRAW.IO EXPORT FIX: Export rooms as actual polygons (not bounding
    boxes). Scale coordinates appropriately. Fix strokeWidth from mm
    to points.

3.7 PRINT/PDF ENHANCEMENTS: Paper size selection (A4, A3, Letter,
    Legal). Orientation toggle. Scale presets (1:50, 1:100, 1:200).
    Option to include/exclude grid, dimensions, furniture labels.

3.8 ARC/CURVED WALL TOOL: Draw curved walls using 3-point arc input.
    Essential for bay windows and curved architectural features.

3.9 STAIRCASE SYMBOL: Pre-built staircase symbols (straight, L-shape,
    spiral) with configurable width and number of steps.

3.10 FLOOR/STORY MANAGEMENT: Add "floors" to a project. Switch between
     Ground Floor, First Floor, etc. Each floor has independent walls,
     rooms, furniture. Display lower floor as ghost overlay.
```

### Phase 4: Polish & Delight (2–3 sessions)
**Goal:** Professional feel and confidence-building features.

```
4.1 ONBOARDING WIZARD: First-run 3-step overlay:
    Step 1: "Click to place walls" (highlight wall tool)
    Step 2: "Add doors and windows" (highlight opening tool)
    Step 3: "Drag furniture from the library" (highlight inspector)
    "Don't show again" checkbox.

4.2 KEYBOARD SHORTCUTS PANEL: Dedicated shortcuts reference panel,
    accessible via "?" key. Show all shortcuts in a clean grid layout.

4.3 TOOL LABELS: Show text labels under sidebar icons. Add single-key
    shortcuts: W=Wall, D=Door, N=Window, R=Room, M=Measure, V=Select.

4.4 UNDO/REDO IMPROVEMENTS: Show "Undo [action name]" in tooltip.
    Use structural sharing (immer) for memory efficiency. Limit based
    on memory, not just count.

4.5 RECENT PROJECTS: Store last 5 project paths. Show on startup or
    via File menu. Include project thumbnail preview.

4.6 STATUS BAR: Bottom bar showing: cursor position (formatted),
    canvas scale, total area, element count, current tool name.

4.7 THEME REFINEMENT: Ensure all UI elements (disabled states, hover
    states, focus rings) adapt to all 3 themes. Add high-contrast
    theme for accessibility.

4.8 PERFORMANCE OPTIMIZATION:
    - Throttle mousePos updates to 60fps
    - Implement virtualization for off-screen elements
    - Use structural sharing in undo history
    - Memoize all Konva components properly
    - Draw grid in Konva Layer (visible in exports)
```

---

## Appendix A: File-by-File Issue Inventory

| File | Issues | Severity |
|---|---|---|
| `src/components/canvas/InteractionLayer.jsx` | Cursor position bug; bg image no controls | CRITICAL |
| `src/components/canvas/StageManager.jsx` | 5 ESLint errors; no resize handler; magic numbers | HIGH |
| `src/components/canvas/WallLayer.jsx` | 8 ESLint errors; IIFE not memoized; no `useMemo` import | HIGH |
| `src/components/canvas/RoomLayer.jsx` | 2 unused imports; naive centroid; rough mode path not closed | MEDIUM |
| `src/components/canvas/FurnitureLayer.jsx` | String-based detection fragile; no rotation handles; cursor leak | MEDIUM |
| `src/components/canvas/AnnotationLayer.jsx` | Minor: tick marks don't scale with zoom | LOW |
| `src/components/ui/Header.jsx` | Unused `err`; memory leak; extra `themeName` param | MEDIUM |
| `src/components/ui/Sidebar.jsx` | Delete doesn't deselect; hardcoded disabled color | MEDIUM |
| `src/components/ui/Inspector.jsx` | Unused `tool`; hooks lint false positive; `\|\|` vs `??`; repeated `.find()` | MEDIUM |
| `src/components/ui/ContextMenu.jsx` | Closes on mouseLeave; renders off-screen | LOW |
| `src/components/ui/HelpModal.jsx` | No Escape close; no click-outside close | LOW |
| `src/store/useEditorStore.js` | `wallThickness: 20` wrong; duplicate comment | CRITICAL |
| `src/store/useProjectStore.js` | No persistence; full snapshots; no debounce; import no undo | HIGH |
| `src/utils/constants.js` | `SNAP_THRESHOLD` unit ambiguity | LOW |
| `src/utils/exportUtils.js` | Unused vars; Draw.io uses bounding boxes not polygons | MEDIUM |
| `src/utils/snapping.js` | Unused imports; threshold too small; no midpoint/perp snapping | HIGH |
| `src/utils/geometry.js` | Clean | — |
| `src/utils/roughUtils.js` | Missing default case in switch | LOW |
| `src/utils/units.js` | Minor alt-unit logic | LOW |
| `src/App.css` | Dead Vite boilerplate — delete | LOW |
| `src/App.jsx` | Clean | — |
| `src/main.jsx` | Clean | — |
| `index.html` | Title casing wrong; default favicon | LOW |
| `package.json` | `pako` unused dependency | LOW |
| `preload.js` | No-op — needs contextBridge for persistence | HIGH |
| `electron.cjs` | No save-before-quit dialog | HIGH |

---

## Appendix B: Estimated Effort per Phase

| Phase | Scope | Sessions* | Risk |
|---|---|---|---|
| **Phase 0** | Bug fixes & lint cleanup | 1–2 | Low — mechanical fixes |
| **Phase 1** | Core UX (drawing, persistence, zoom) | 3–4 | Medium — requires UX decisions |
| **Phase 2** | Enhanced interaction (handles, multi-select, topology) | 3–4 | High — wall topology is complex |
| **Phase 3** | Feature expansion (library, annotations, print, floors) | 4–5 | Medium — mostly additive |
| **Phase 4** | Polish (onboarding, shortcuts, perf, themes) | 2–3 | Low — refinement work |

*One "session" ≈ one focused AI coding session of significant implementation work.

---

## Appendix C: Quick Win Checklist (< 30 min each)

These can be done immediately for visible improvement:

- [ ] Fix `wallThickness: 20` → `200` in `useEditorStore.js`
- [ ] Fix cursor position in `InteractionLayer.jsx` (divide by `canvasScale`)
- [ ] Remove all unused imports/variables (10 ESLint errors)
- [ ] Delete `App.css`
- [ ] Fix `index.html` title to "SwiftPlanDD"
- [ ] Remove `pako` from `package.json`
- [ ] Add `setSelectedId(null)` to sidebar delete button
- [ ] Change `|| 1000` to `?? 1000` in `Inspector.jsx`
- [ ] Rename `err` to `_err` in `Header.jsx` catch block
- [ ] Add Escape key handler to `HelpModal.jsx`
- [ ] Add `window.addEventListener('resize', ...)` for Stage dimensions
- [ ] Replace `Date.now()` with `crypto.randomUUID()` for IDs

---

*This document is designed to be consumed by a modern AI coding assistant for systematic implementation. Each item is actionable, localized to specific files, and prioritized. Start with Phase 0, validate with `npm run lint`, then proceed phase by phase.*
