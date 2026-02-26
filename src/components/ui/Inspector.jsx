import { THEMES, FURNITURE_PRESETS } from '../../utils/constants';
import { formatValue } from '../../utils/units';
import { getDistance, getPointAtOffset } from '../../utils/geometry';
import { useEditorStore } from '../../store/useEditorStore';
import { useProjectStore } from '../../store/useProjectStore';

export const Inspector = () => {
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
    const wallLabelPosition = useEditorStore(state => state.wallLabelPosition);
    const setWallLabelPosition = useEditorStore(state => state.setWallLabelPosition);
    const canvasScale = useEditorStore(state => state.canvasScale);
    const setCanvasScale = useEditorStore(state => state.setCanvasScale);
    const selectedId = useEditorStore(state => state.selectedId);
    const setSelectedId = useEditorStore(state => state.setSelectedId);
    const setTool = useEditorStore(state => state.setTool);

    const walls = useProjectStore(state => state.walls);
    const updateWall = useProjectStore(state => state.updateWall);
    const openings = useProjectStore(state => state.openings);
    const updateOpening = useProjectStore(state => state.updateOpening);
    const furniture = useProjectStore(state => state.furniture);
    const updateFurniture = useProjectStore(state => state.updateFurniture);
    const addFurniture = useProjectStore(state => state.addFurniture);
    const rooms = useProjectStore(state => state.rooms);
    const updateRoom = useProjectStore(state => state.updateRoom);

    const theme = THEMES[themeName];

    /* eslint-disable react-hooks/purity */
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
            id: Date.now(),
            ...preset,
            x: Math.round(centerX) || 1000,
            y: Math.round(centerY) || 1000,
            rotation: 0,
            clearance: 60,
            showClearance: false
        };
        addFurniture(newItem);
        /* eslint-enable react-hooks/purity */
        setTool('select');
        setSelectedId(newItem.id);
    };

    return (
        <aside className="inspector" style={{ width: '300px', background: themeName === 'light' ? '#f8fafc' : 'rgba(30, 41, 59, 0.9)', borderLeft: `1px solid ${theme.grid}`, padding: '24px', color: theme.text, overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '24px', color: theme.accent }}>Inspector</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {selectedId ? (
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
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: theme.dim, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fixture Library</span>

                        {Object.entries(FURNITURE_PRESETS).map(([category, items]) => (
                            <details key={category} style={{ borderBottom: `1px solid ${theme.grid}`, paddingBottom: '8px' }}>
                                <summary style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', padding: '4px 0', userSelect: 'none' }}>{category}</summary>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginTop: '10px' }}>
                                    {items.map(p => (
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
                        ))}
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

                        <label style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Grid Spacing (mm)
                            <input type="number" value={gridSpacing} onChange={(e) => setGridSpacing(Math.max(1, Number(e.target.value)))} style={{ width: '60px', padding: '4px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, fontSize: '0.8rem' }} />
                        </label>

                        <div style={{ height: '1px', background: theme.grid, margin: '8px 0' }} />

                        <label style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            Scale (e.g., 1:50)
                            <select value={canvasScale} onChange={(e) => setCanvasScale(Number(e.target.value))} style={{ padding: '4px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, color: theme.text, fontSize: '0.8rem' }}>
                                <option value="20">1:20 (Details)</option>
                                <option value="50">1:50 (Standard Room)</option>
                                <option value="100">1:100 (Standard House)</option>
                                <option value="200">1:200 (Site Plan)</option>
                                <option value="500">1:500 (Master Plan)</option>
                            </select>
                        </label>
                    </div>
                </div>
            </div>
        </aside>
    );
};
