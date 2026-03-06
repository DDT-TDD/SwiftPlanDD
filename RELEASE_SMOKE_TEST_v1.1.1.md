# SwiftPlanDD v1.1.1 Smoke Test Checklist

Use this checklist before marking `v1.1.1` ready.

## Build And Launch

- [ ] Launch `dist_electron/SwiftPlanDD 1.1.1.exe` on Windows.
- [ ] Verify app opens without crash and shows `v1.1.1` in the header.

## Wall Editing

- [ ] Draw a 4-wall room and confirm walls are created normally.
- [ ] Select one wall and drag the wall segment: connected joints should follow.
- [ ] Use arrow keys to nudge a selected wall and verify movement.
- [ ] Edit selected wall length in Inspector and confirm shared corner remains connected.
- [ ] Edit selected wall angle in Inspector and confirm wall rotates to requested angle.

## Ortho And Angle Modes

- [ ] Toggle Ortho mode in Inspector and draw walls: only horizontal/vertical segments should be created.
- [ ] Turn Ortho off, hold `Shift`, and draw: 45-degree constrained segments should work.

## Wall Diagnostics

- [ ] Enable `Show Wall Diagnostics` in Inspector.
- [ ] Confirm endpoints are visible as markers.
- [ ] Confirm junctions (shared endpoints) are highlighted and show connection count.
- [ ] Disable diagnostics and verify markers disappear.

## Tracing Workflow

- [ ] Upload tracing as `current floor` and verify it is visible only on that floor.
- [ ] Upload tracing as `all floors` and verify it appears on every floor without floor-specific tracing.
- [ ] Set both floor and global tracing on one floor and verify floor tracing takes precedence.
- [ ] Use `Replace` on floor tracing and verify image swaps while keeping transform values.
- [ ] Use `Reset` on tracing and verify opacity/scale/offset return to defaults.

## Save And Restore

- [ ] Save project to `.swift.json`.
- [ ] Reopen project and verify walls, floors, and tracing scopes/transforms are preserved.
- [ ] Close and reopen app to validate autosave restores project without corruption.

## Export Sanity

- [ ] Export PNG and verify output image matches current floor drawing.
- [ ] Export PDF with options and verify generated file opens correctly.
- [ ] Export Draw.io and verify XML imports into diagrams.net.

## Final Sign-Off

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] `npm run electron:build` passes and portable exe is generated.