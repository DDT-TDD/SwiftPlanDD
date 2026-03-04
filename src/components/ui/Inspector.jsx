import { useState } from 'react';
import { THEMES, FURNITURE_PRESETS } from '../../utils/constants';
import { formatValue } from '../../utils/units';
import { getDistance, getPointAtOffset } from '../../utils/geometry';
import { useEditorStore } from '../../store/useEditorStore';
import { useProjectStore } from '../../store/useProjectStore';

export const Inspector = () => {
    const [furnitureSearch, setFurnitureSearch] = useState('');

    const SIDEBAR_WIDTH = 80;
    const INSPECTOR_WIDTH = 300;
    const HEADER_HEIGHT = 60;

    const themeName = useEditorStore(state => state.themeName);
    const setThemeName = useEditorStore(state => state.setThemeName);
    const roughMode = useEditorStore(state => state.roughMode);
    const setRoughMode = useEditorStore(state => state.setRoughMode);
    const unit = useEditorStore(state => state.unit);
    const setUnit = useEditorStore(state => state.setUnit);
    const showDual = useEditorStore(state => state.showDual);
    const setShowDual = useEditorStore(state => state.setShowDual);
    const showGrid = useEditorStore(state => state.showGrid);
    const setShowGrid = useEditorStore(state => state.setShowGrid);
    const gridSpacing = useEditorStore(state => state.gridSpacing);
    const setGridSpacing = useEditorStore(state => state.setGridSpacing);
    const autoGridSpacing = useEditorStore(state => state.autoGridSpacing);
    const setAutoGridSpacing = useEditorStore(state => state.setAutoGridSpacing);
    const wallLabelPosition = useEditorStore(state => state.wallLabelPosition);
    const setWallLabelPosition = useEditorStore(state => state.setWallLabelPosition);
    const showAutoDimensions = useEditorStore(state => state.showAutoDimensions);
    const setShowAutoDimensions = useEditorStore(state => state.setShowAutoDimensions);
    const showRulers = useEditorStore(state => state.showRulers);
    const setShowRulers = useEditorStore(state => state.setShowRulers);
    const canvasScale = useEditorStore(state => state.canvasScale);
    const setCanvasScale = useEditorStore(state => state.setCanvasScale);
    const setStagePos = useEditorStore(state => state.setStagePos);
    const setStageScale = useEditorStore(state => state.setStageScale);
    const bgImageFile = useEditorStore(state => state.bgImageFile);
    const bgOpacity = useEditorStore(state => state.bgOpacity) ?? 0.3;
    const setBgOpacity = useEditorStore(state => state.setBgOpacity);
    const bgScale = useEditorStore(state => state.bgScale) ?? 1;
    const setBgScale = useEditorStore(state => state.setBgScale);
    const bgOffsetX = useEditorStore(state => state.bgOffsetX) ?? 0;
    const setBgOffsetX = useEditorStore(state => state.setBgOffsetX);
    const bgOffsetY = useEditorStore(state => state.bgOffsetY) ?? 0;
    const setBgOffsetY = useEditorStore(state => state.setBgOffsetY);
    const selectedId = useEditorStore(state => state.selectedId);
    const selectedIds = useEditorStore(state => state.selectedIds);
    const setSelectedId = useEditorStore(state => state.setSelectedId);
    const setTool = useEditorStore(state => state.setTool);

    const walls = useProjectStore(state => state.walls);
    const updateWall = useProjectStore(state => state.updateWall);
    const openings = useProjectStore(state => state.openings);
    const updateOpening = useProjectStore(state => state.updateOpening);
    const furniture = useProjectStore(state => state.furniture);
    const updateFurniture = useProjectStore(state => state.updateFurniture);
    const updateFurnitureMany = useProjectStore(state => state.updateFurnitureMany);
    const addFurniture = useProjectStore(state => state.addFurniture);
    const clearAll = useProjectStore(state => state.clearAll);
    const rooms = useProjectStore(state => state.rooms);
    const updateRoom = useProjectStore(state => state.updateRoom);
    const annotations = useProjectStore(state => state.annotations);
    const updateAnnotation = useProjectStore(state => state.updateAnnotation);

    const theme = THEMES[themeName];
    const selectedFurniture = furniture.filter(item => selectedIds.includes(item.id));

    const runFurnitureBatch = (computeUpdates) => {
        if (selectedFurniture.length === 0) return;
        const updateList = selectedFurniture.map(item => ({
            id: item.id,
            updates: computeUpdates(item)
        }));
        updateFurnitureMany(updateList);
    };

    const alignFurniture = (mode) => {
        if (selectedFurniture.length < 2) return;
        const left = Math.min(...selectedFurniture.map(item => item.x));
        const right = Math.max(...selectedFurniture.map(item => item.x + item.width));
        const top = Math.min(...selectedFurniture.map(item => item.y));
        const bottom = Math.max(...selectedFurniture.map(item => item.y + item.height));
        const centerX = (left + right) / 2;
        const centerY = (top + bottom) / 2;

        runFurnitureBatch((item) => {
            if (mode === 'left') return { x: left };
            if (mode === 'center') return { x: Math.round(centerX - item.width / 2) };
            if (mode === 'right') return { x: right - item.width };
            if (mode === 'top') return { y: top };
            if (mode === 'middle') return { y: Math.round(centerY - item.height / 2) };
            if (mode === 'bottom') return { y: bottom - item.height };
            return {};
        });
    };

    const distributeFurniture = (axis) => {
        if (selectedFurniture.length < 3) return;

        if (axis === 'horizontal') {
            const sorted = [...selectedFurniture].sort((a, b) => a.x - b.x);
            const min = sorted[0].x;
            const max = sorted[sorted.length - 1].x;
            const step = (max - min) / (sorted.length - 1);
            const updateList = sorted.map((item, idx) => ({ id: item.id, updates: { x: Math.round(min + step * idx) } }));
            updateFurnitureMany(updateList);
            return;
        }

        const sorted = [...selectedFurniture].sort((a, b) => a.y - b.y);
        const min = sorted[0].y;
        const max = sorted[sorted.length - 1].y;
        const step = (max - min) / (sorted.length - 1);
        const updateList = sorted.map((item, idx) => ({ id: item.id, updates: { y: Math.round(min + step * idx) } }));
        updateFurnitureMany(updateList);
    };

    const handleAddFurniture = (preset) => {
        const stagePos = useEditorStore.getState().stagePos;
        const stageScale = useEditorStore.getState().stageScale;
        const canvasScale = useEditorStore.getState().canvasScale;

        // Window dimensions approx stage size
        const winW = window.innerWidth - 380;
        const winH = window.innerHeight - 60;

        // Logical coordinates at center of viewport
        const centerX = ((-stagePos.x + winW / 2) / stageScale) * canvasScale;
        const centerY = ((-stagePos.y + winH / 2) / stageScale) * canvasScale;

        const newItem = {
            id: globalThis.crypto.randomUUID(),
            ...preset,
            x: Math.round(centerX) ?? 1000,
            y: Math.round(centerY) ?? 1000,
            rotation: 0,
            clearance: 60,
            showClearance: false
        };
        addFurniture(newItem);
        setTool('select');
        setSelectedId(newItem.id);
    };

    const fitToSelectedScale = () => {
        const points = [];

        walls.forEach((wall) => {
            points.push({ x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 });
        });
        rooms.forEach((room) => {
            (room.points || []).forEach((point) => points.push({ x: point.x, y: point.y }));
        });
        furniture.forEach((item) => {
            points.push({ x: item.x, y: item.y });
            points.push({ x: item.x + item.width, y: item.y + item.height });
        });
        openings.forEach((opening) => {
            const hostWall = walls.find((wall) => wall.id === opening.wallId);
            if (!hostWall) return;
            const wallLength = getDistance({ x: hostWall.x1, y: hostWall.y1 }, { x: hostWall.x2, y: hostWall.y2 });
            if (wallLength <= 0) return;
            const t = Math.max(0, Math.min(1, opening.offset / wallLength));
            points.push({
                x: hostWall.x1 + (hostWall.x2 - hostWall.x1) * t,
                y: hostWall.y1 + (hostWall.y2 - hostWall.y1) * t
            });
        });
        annotations.forEach((annotation) => {
            points.push({ x: annotation.x, y: annotation.y });
        });

        if (points.length === 0) {
            setStageScale(1);
            setStagePos({ x: 0, y: 0 });
            return;
        }

        const minX = Math.min(...points.map((point) => point.x));
        const maxX = Math.max(...points.map((point) => point.x));
        const minY = Math.min(...points.map((point) => point.y));
        const maxY = Math.max(...points.map((point) => point.y));

        const worldWidthPx = Math.max(1, (maxX - minX) / canvasScale);
        const worldHeightPx = Math.max(1, (maxY - minY) / canvasScale);

        const viewportWidth = Math.max(320, window.innerWidth - (SIDEBAR_WIDTH + INSPECTOR_WIDTH));
        const viewportHeight = Math.max(240, window.innerHeight - HEADER_HEIGHT);
        const fitScale = Math.min(viewportWidth / worldWidthPx, viewportHeight / worldHeightPx) * 0.9;
        const nextScale = Math.max(0.2, Math.min(fitScale, 8));

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        setStageScale(nextScale);
        setStagePos({
            x: viewportWidth / 2 - ((centerX / canvasScale) * nextScale),
            y: viewportHeight / 2 - ((centerY / canvasScale) * nextScale)
        });

        if (autoGridSpacing) {
            if (canvasScale <= 20) setGridSpacing(100);
            else if (canvasScale <= 50) setGridSpacing(250);
            else if (canvasScale <= 75) setGridSpacing(500);
            else if (canvasScale <= 150) setGridSpacing(500);
            else if (canvasScale <= 250) setGridSpacing(1000);
            else if (canvasScale <= 500) setGridSpacing(2500);
            else setGridSpacing(5000);
        }
    };

    return (
        <aside className="inspector" style={{ width: '300px', background: themeName === 'light' ? '#f8fafc' : 'rgba(30, 41, 59, 0.9)', borderLeft: `1px solid ${theme.grid}`, padding: '24px', color: theme.text, overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '24px', color: theme.accent }}>Inspector</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {selectedIds.length > 1 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: theme.dim, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selection Properties</span>
                        <div style={{ padding: '10px 12px', borderRadius: '8px', border: `1px solid ${theme.grid}`, background: themeName === 'light' ? '#fff' : '#1e293b' }}>
                            <div style={{ fontSize: '0.85rem', color: theme.text, marginBottom: '6px' }}>{selectedIds.length} items selected</div>
                            <div style={{ fontSize: '0.75rem', color: theme.dim }}>Use drag to move as a group, or Delete / Ctrl+C / Ctrl+V for batch actions.</div>
                        </div>

                        {selectedFurniture.length > 1 && (
                            <div style={{ padding: '10px 12px', borderRadius: '8px', border: `1px solid ${theme.grid}`, background: themeName === 'light' ? '#fff' : '#1e293b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ fontSize: '0.78rem', color: theme.dim, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Furniture Align</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                                    <button onClick={() => alignFurniture('left')} style={{ padding: '6px', borderRadius: '4px', border: `1px solid ${theme.grid}`, background: 'transparent', color: theme.text, fontSize: '0.72rem', cursor: 'pointer' }}>Left</button>
                                    <button onClick={() => alignFurniture('center')} style={{ padding: '6px', borderRadius: '4px', border: `1px solid ${theme.grid}`, background: 'transparent', color: theme.text, fontSize: '0.72rem', cursor: 'pointer' }}>Center</button>
                                    <button onClick={() => alignFurniture('right')} style={{ padding: '6px', borderRadius: '4px', border: `1px solid ${theme.grid}`, background: 'transparent', color: theme.text, fontSize: '0.72rem', cursor: 'pointer' }}>Right</button>
                                    <button onClick={() => alignFurniture('top')} style={{ padding: '6px', borderRadius: '4px', border: `1px solid ${theme.grid}`, background: 'transparent', color: theme.text, fontSize: '0.72rem', cursor: 'pointer' }}>Top</button>
                                    <button onClick={() => alignFurniture('middle')} style={{ padding: '6px', borderRadius: '4px', border: `1px solid ${theme.grid}`, background: 'transparent', color: theme.text, fontSize: '0.72rem', cursor: 'pointer' }}>Middle</button>
                                    <button onClick={() => alignFurniture('bottom')} style={{ padding: '6px', borderRadius: '4px', border: `1px solid ${theme.grid}`, background: 'transparent', color: theme.text, fontSize: '0.72rem', cursor: 'pointer' }}>Bottom</button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                                    <button onClick={() => distributeFurniture('horizontal')} disabled={selectedFurniture.length < 3} style={{ padding: '6px', borderRadius: '4px', border: `1px solid ${theme.grid}`, background: 'transparent', color: selectedFurniture.length < 3 ? theme.dim : theme.text, fontSize: '0.72rem', cursor: selectedFurniture.length < 3 ? 'not-allowed' : 'pointer' }}>Distribute X</button>
                                    <button onClick={() => distributeFurniture('vertical')} disabled={selectedFurniture.length < 3} style={{ padding: '6px', borderRadius: '4px', border: `1px solid ${theme.grid}`, background: 'transparent', color: selectedFurniture.length < 3 ? theme.dim : theme.text, fontSize: '0.72rem', cursor: selectedFurniture.length < 3 ? 'not-allowed' : 'pointer' }}>Distribute Y</button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : selectedId ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: theme.dim, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selection Properties</span>
                            {walls.find(w => w.id === selectedId) && (() => {
                                const w = walls.find(w => w.id === selectedId);
                                const currentLength = Math.round(getDistance({ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 }));
                                return (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '0.85rem' }}>Length:</span>
                                            <input
                                                type="number"
                                                value={currentLength}
                                                onChange={(e) => {
                                                    const newLen = Number(e.target.value);
                                                    if (newLen > 0) {
                                                        const p2 = getPointAtOffset({ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 }, newLen);
                                                        updateWall(w.id, { x2: p2.x, y2: p2.y });
                                                    }
                                                }}
                                                style={{ width: '80px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, padding: '5px' }}
                                            />
                                            <span style={{ fontSize: '0.8rem' }}>mm</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '0.85rem' }}>Thickness:</span>
                                            <input
                                                type="number"
                                                value={w.thickness || 200}
                                                onChange={(e) => updateWall(w.id, { thickness: Number(e.target.value) })}
                                                style={{ width: '60px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, padding: '5px' }}
                                            />
                                            <span style={{ fontSize: '0.8rem' }}>mm</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '0.85rem' }}>Label Pos:</span>
                                            <select
                                                value={w.labelPosition || ''}
                                                onChange={(e) => updateWall(w.id, { labelPosition: e.target.value || undefined })}
                                                style={{ padding: '4px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, fontSize: '0.8rem', width: '90px' }}
                                            >
                                                <option value="">Global</option>
                                                <option value="center">Center</option>
                                                <option value="inside">Offset Side A</option>
                                                <option value="outside">Offset Side B</option>
                                                <option value="hidden">Hidden</option>
                                            </select>
                                        </div>
                                    </>
                                );
                            })()}
                            {openings.find(o => o.id === selectedId) && (() => {
                                const o = openings.find(o => o.id === selectedId);
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '0.85rem' }}>Type:</span>
                                            <select
                                                value={o.type}
                                                onChange={(e) => updateOpening(o.id, { type: e.target.value })}
                                                style={{ padding: '4px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, fontSize: '0.8rem', flexGrow: 1 }}
                                            >
                                                <option value="door">Door</option>
                                                <option value="window">Window</option>
                                                <option value="french_window">French Window</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '0.85rem' }}>Wall Offset:</span>
                                            <input
                                                type="number"
                                                value={Math.round(o.offset)}
                                                onChange={(e) => updateOpening(o.id, { offset: Number(e.target.value) })}
                                                style={{ width: '60px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, padding: '5px' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '0.85rem' }}>Width:</span>
                                            <input
                                                type="number"
                                                value={o.width}
                                                onChange={(e) => updateOpening(o.id, { width: Number(e.target.value) })}
                                                style={{ width: '60px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, padding: '5px' }}
                                            />
                                            <span style={{ fontSize: '0.8rem' }}>mm</span>
                                        </div>
                                        {(o.type === 'door' || o.type === 'french_window') && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                <button
                                                    onClick={() => updateOpening(selectedId, { flipX: !o.flipX })}
                                                    style={{ padding: '6px 12px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, fontSize: '0.7rem', borderRadius: '4px', cursor: 'pointer' }}
                                                >Flip Horiz.</button>
                                                <button
                                                    onClick={() => updateOpening(selectedId, { flipY: !o.flipY })}
                                                    style={{ padding: '6px 12px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, fontSize: '0.7rem', borderRadius: '4px', cursor: 'pointer' }}
                                                >Flip Vert.</button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                            {furniture.find(f => f.id === selectedId) && (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '0.85rem' }}>Rotation:</span>
                                        <input
                                            type="number"
                                            value={furniture.find(f => f.id === selectedId)?.rotation || 0}
                                            onChange={(e) => updateFurniture(selectedId, { rotation: Number(e.target.value) })}
                                            style={{ width: '60px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, padding: '5px' }}
                                        />
                                        <span style={{ fontSize: '0.8rem' }}>deg</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '0.85rem' }}>Pos X/Y:</span>
                                        <input
                                            type="number"
                                            value={Math.round(furniture.find(f => f.id === selectedId)?.x || 0)}
                                            onChange={(e) => updateFurniture(selectedId, { x: Number(e.target.value) })}
                                            style={{ width: '60px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, padding: '5px' }}
                                        />
                                        <input
                                            type="number"
                                            value={Math.round(furniture.find(f => f.id === selectedId)?.y || 0)}
                                            onChange={(e) => updateFurniture(selectedId, { y: Number(e.target.value) })}
                                            style={{ width: '60px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, padding: '5px' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <input
                                                type="checkbox"
                                                checked={furniture.find(f => f.id === selectedId)?.showClearance}
                                                onChange={(e) => updateFurniture(selectedId, { showClearance: e.target.checked })}
                                            /> Show Clearance
                                        </label>
                                    </div>
                                </>
                            )}
                            {rooms.find(r => r.id === selectedId) && (() => {
                                const r = rooms.find(r => r.id === selectedId);
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '0.85rem' }}>Name:</span>
                                            <input
                                                type="text"
                                                value={r.name || ''}
                                                placeholder="Living Room..."
                                                onChange={(e) => updateRoom(r.id, { name: e.target.value })}
                                                style={{ flexGrow: 1, background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, padding: '5px' }}
                                            />
                                        </div>
                                        <span style={{ fontSize: '0.85rem' }}>Fill Pattern:</span>
                                        <select
                                            value={r.pattern || 'solid'}
                                            onChange={(e) => updateRoom(r.id, { pattern: e.target.value })}
                                            style={{ background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, padding: '5px' }}
                                        >
                                            <option value="solid">Solid Shade</option>
                                            <option value="diagonal">Diagonal Hatch</option>
                                            <option value="crosshatch">Crosshatch</option>
                                            <option value="grid">Grid (Tiles)</option>
                                        </select>
                                    </div>
                                );
                            })()}
                            {annotations.find(a => a.id === selectedId) && (() => {
                                const ann = annotations.find(a => a.id === selectedId);
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '0.85rem' }}>Text:</span>
                                            <input
                                                type="text"
                                                value={ann.text || ''}
                                                onChange={(e) => updateAnnotation(ann.id, { text: e.target.value })}
                                                style={{ flexGrow: 1, background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, padding: '5px' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '0.85rem' }}>Size:</span>
                                            <input
                                                type="number"
                                                value={ann.fontSize || 14}
                                                min="8"
                                                max="72"
                                                onChange={(e) => updateAnnotation(ann.id, { fontSize: Number(e.target.value) })}
                                                style={{ width: '60px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, padding: '5px' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '0.85rem' }}>Rotation:</span>
                                            <input
                                                type="number"
                                                value={ann.rotation || 0}
                                                onChange={(e) => updateAnnotation(ann.id, { rotation: Number(e.target.value) })}
                                                style={{ width: '60px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, padding: '5px' }}
                                            />
                                            <span style={{ fontSize: '0.8rem' }}>deg</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: theme.dim, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fixture Library</span>

                        <input
                            type="text"
                            placeholder="Search furniture..."
                            value={furnitureSearch}
                            onChange={(e) => setFurnitureSearch(e.target.value)}
                            style={{ width: '100%', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, borderRadius: '6px', padding: '8px 10px', fontSize: '0.8rem' }}
                        />

                        {Object.entries(FURNITURE_PRESETS).map(([category, items]) => {
                            const q = furnitureSearch.trim().toLowerCase();
                            const filtered = q ? items.filter(item => item.name.toLowerCase().includes(q)) : items;
                            if (filtered.length === 0) return null;

                            return (
                            <details key={category} style={{ borderBottom: `1px solid ${theme.grid}`, paddingBottom: '8px' }}>
                                <summary style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', padding: '4px 0', userSelect: 'none' }}>{category}</summary>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginTop: '10px' }}>
                                    {filtered.map(p => (
                                        <button
                                            key={p.name}
                                            onClick={() => handleAddFurniture(p)}
                                            style={{ padding: '8px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', textAlign: 'left', transition: 'background 0.2s' }}
                                            onMouseOver={(e) => e.target.style.background = theme.furniture}
                                            onMouseOut={(e) => e.target.style.background = themeName === 'light' ? '#fff' : '#1e293b'}
                                        >
                                            <div style={{ fontWeight: '500' }}>{p.name}</div>
                                            <div style={{ color: theme.dim, fontSize: '0.7rem' }}>{formatValue(p.width, unit)} x {formatValue(p.height, unit)}</div>
                                        </button>
                                    ))}
                                </div>
                            </details>
                            );
                        })}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: theme.dim, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Environment</span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Theme
                            <select value={themeName} onChange={(e) => setThemeName(e.target.value)} style={{ padding: '4px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, fontSize: '0.8rem' }}>
                                <option value="light">Classic Light</option>
                                <option value="dark">Modern Dark</option>
                                <option value="blueprint">Blueprint</option>
                            </select>
                        </label>

                        <label style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Primary Units
                            <select value={unit} onChange={(e) => setUnit(e.target.value)} style={{ padding: '4px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, fontSize: '0.8rem' }}>
                                <option value="m">Meters (m)</option>
                                <option value="cm">Centimeters (cm)</option>
                                <option value="mm">Millimeters (mm)</option>
                                <option value="ft">Feet (ft)</option>
                                <option value="in">Inches (in)</option>
                            </select>
                        </label>

                        <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" checked={showDual} onChange={(e) => setShowDual(e.target.checked)} />
                            Show Dual Dimensioning
                        </label>

                        <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <input type="checkbox" checked={roughMode} onChange={(e) => setRoughMode(e.target.checked)} />
                            Drafting / Rough Mode
                        </label>

                        <div style={{ height: '1px', background: theme.grid, margin: '8px 0' }} />

                        <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
                            Show Grid
                        </label>

                        <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" checked={autoGridSpacing} onChange={(e) => setAutoGridSpacing(e.target.checked)} />
                            Auto Grid Spacing
                        </label>

                        <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" checked={showAutoDimensions} onChange={(e) => setShowAutoDimensions(e.target.checked)} />
                            Auto-Dimension Lines
                        </label>

                        <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" checked={showRulers} onChange={(e) => setShowRulers(e.target.checked)} />
                            Show Rulers
                        </label>

                        <label style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Grid Spacing (mm)
                            <select disabled={autoGridSpacing} value={gridSpacing} onChange={(e) => setGridSpacing(Number(e.target.value))} style={{ width: '86px', padding: '4px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, fontSize: '0.8rem', opacity: autoGridSpacing ? 0.6 : 1 }}>
                                <option value="100">100</option>
                                <option value="250">250</option>
                                <option value="500">500</option>
                                <option value="750">750</option>
                                <option value="1000">1000</option>
                                <option value="1500">1500</option>
                                <option value="2000">2000</option>
                                <option value="2500">2500</option>
                                <option value="5000">5000</option>
                            </select>
                        </label>

                        <label style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: theme.dim }}>
                            Custom Grid (mm)
                            <input disabled={autoGridSpacing} type="number" value={gridSpacing} onChange={(e) => setGridSpacing(Math.max(1, Number(e.target.value)))} style={{ width: '86px', padding: '4px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, fontSize: '0.78rem', opacity: autoGridSpacing ? 0.6 : 1 }} />
                        </label>

                        <div style={{ height: '1px', background: theme.grid, margin: '8px 0' }} />

                        <label style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Wall Label Position
                            <select value={wallLabelPosition} onChange={(e) => setWallLabelPosition(e.target.value)} style={{ padding: '4px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, fontSize: '0.8rem' }}>
                                <option value="center">Center</option>
                                <option value="inside">Offset Side A</option>
                                <option value="outside">Offset Side B</option>
                                <option value="hidden">Hidden</option>
                            </select>
                        </label>

                        <label style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            Scale (e.g., 1:50)
                            <select value={canvasScale} onChange={(e) => setCanvasScale(Number(e.target.value))} style={{ padding: '4px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, fontSize: '0.8rem' }}>
                                <option value="10">1:10 (Detail Joinery)</option>
                                <option value="20">1:20 (Details)</option>
                                <option value="25">1:25 (Interior Detail)</option>
                                <option value="50">1:50 (Standard Room)</option>
                                <option value="75">1:75 (Small Building)</option>
                                <option value="100">1:100 (Standard House)</option>
                                <option value="150">1:150 (Block Plan)</option>
                                <option value="200">1:200 (Site Plan)</option>
                                <option value="250">1:250 (Large Site)</option>
                                <option value="500">1:500 (Master Plan)</option>
                                <option value="1000">1:1000 (Urban Plan)</option>
                            </select>
                        </label>

                        <button
                            onClick={fitToSelectedScale}
                            style={{
                                padding: '8px 10px',
                                background: theme.accent,
                                border: 'none',
                                color: '#fff',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                textAlign: 'center'
                            }}
                        >
                            Fit Drawing to Selected Scale
                        </button>

                        {bgImageFile && (
                            <>
                                <div style={{ height: '1px', background: theme.grid, margin: '8px 0' }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: theme.dim, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tracing Image</span>
                                <label style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    Opacity
                                    <input type="range" min="0" max="1" step="0.05" value={bgOpacity} onChange={(e) => setBgOpacity(Number(e.target.value))} style={{ width: '100px' }} />
                                </label>
                                <label style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    Scale
                                    <input type="range" min="0.1" max="5" step="0.1" value={bgScale} onChange={(e) => setBgScale(Number(e.target.value))} style={{ width: '100px' }} />
                                </label>
                                <label style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    Offset X (mm)
                                    <input type="number" value={bgOffsetX} onChange={(e) => setBgOffsetX(Number(e.target.value))} style={{ width: '70px', padding: '4px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, fontSize: '0.8rem' }} />
                                </label>
                                <label style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    Offset Y (mm)
                                    <input type="number" value={bgOffsetY} onChange={(e) => setBgOffsetY(Number(e.target.value))} style={{ width: '70px', padding: '4px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, fontSize: '0.8rem' }} />
                                </label>
                            </>
                        )}

                        <div style={{ height: '1px', background: theme.grid, margin: '8px 0' }} />
                        <button
                            onClick={() => {
                                if (window.confirm('Delete all elements in this project? This cannot be undone as a single action.')) {
                                    clearAll();
                                    useEditorStore.getState().clearSelection();
                                }
                            }}
                            style={{
                                padding: '8px 10px',
                                background: 'transparent',
                                border: `1px solid ${theme.grid}`,
                                color: '#ef4444',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                textAlign: 'left'
                            }}
                        >
                            Delete All Elements
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};
