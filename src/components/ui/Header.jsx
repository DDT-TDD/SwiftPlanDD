import { useRef, useState, useEffect } from 'react';
import { Home, Image, Save, FolderOpen, Download, FileText, LayoutTemplate, HelpCircle, ScanSearch, Undo2, Redo2, Clock } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { useProjectStore } from '../../store/useProjectStore';
import { exportToPNG, exportToPDF, exportToDrawio } from '../../utils/exportUtils';
import { THEMES } from '../../utils/constants';
import packageJson from '../../../package.json';
import { HelpModal } from './HelpModal';

export const Header = () => {
    const [showHelp, setShowHelp] = useState(false);
    const [showPdfOptions, setShowPdfOptions] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [showRecent, setShowRecent] = useState(false);
    const [showTracingMenu, setShowTracingMenu] = useState(false);
    const [pdfPaper, setPdfPaper] = useState('a4');
    const [pdfOrientation, setPdfOrientation] = useState('landscape');
    const [pdfScale, setPdfScale] = useState('');
    const themeName = useEditorStore(state => state.themeName);
    const stageRef = useEditorStore(state => state.stageRef);
    const canvasScale = useEditorStore(state => state.canvasScale);
    const setStagePos = useEditorStore(state => state.setStagePos);
    const setStageScale = useEditorStore(state => state.setStageScale);
    const exportProject = useProjectStore(state => state.exportProject);
    const importProject = useProjectStore(state => state.importProject);
    const undo = useProjectStore(state => state.undo);
    const redo = useProjectStore(state => state.redo);
    const pastLen = useProjectStore(state => state.past.length);
    const futureLen = useProjectStore(state => state.future.length);
    const undoLabel = pastLen > 0 ? useProjectStore.getState().getUndoLabel() : null;
    const redoLabel = futureLen > 0 ? useProjectStore.getState().getRedoLabel() : null;
    const tracing = useProjectStore(state => state.tracing);
    const globalTracing = useProjectStore(state => state.globalTracing);
    const setCurrentFloorTracing = useProjectStore(state => state.setCurrentFloorTracing);
    const setGlobalTracing = useProjectStore(state => state.setGlobalTracing);
    const theme = THEMES[themeName];
    const bgInputRef = useRef(null);
    const projectInputRef = useRef(null);
    const tracingTargetRef = useRef('floor');

    useEffect(() => {
        if (!showRecent && !showTracingMenu) return;
        const close = () => {
            setShowRecent(false);
            setShowTracingMenu(false);
        };
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, [showRecent, showTracingMenu]);

    const buildTracingPayload = (imageSrc, target) => {
        const base = target === 'global' ? globalTracing : tracing;
        return {
            imageSrc,
            opacity: base?.opacity ?? 0.3,
            scale: base?.scale ?? 1,
            offsetX: base?.offsetX ?? 0,
            offsetY: base?.offsetY ?? 0
        };
    };

    const openTracingFilePicker = (target) => {
        tracingTargetRef.current = target;
        setShowTracingMenu(false);
        bgInputRef.current?.click();
    };

    const fitToView = () => {
        const state = useProjectStore.getState();
        const points = [];

        state.walls.forEach((wall) => {
            points.push({ x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 });
        });
        state.rooms.forEach((room) => {
            (room.points || []).forEach((point) => points.push({ x: point.x, y: point.y }));
        });
        state.furniture.forEach((item) => {
            points.push({ x: item.x, y: item.y });
            points.push({ x: item.x + item.width, y: item.y + item.height });
        });
        state.dimensions.forEach((dim) => {
            points.push({ x: dim.x1, y: dim.y1 }, { x: dim.x2, y: dim.y2 });
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

        const viewportWidth = Math.max(320, window.innerWidth - 380);
        const viewportHeight = Math.max(240, window.innerHeight - 60);
        const fitScale = Math.min(viewportWidth / worldWidthPx, viewportHeight / worldHeightPx) * 0.9;
        const nextScale = Math.max(0.2, Math.min(fitScale, 8));

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        setStageScale(nextScale);
        setStagePos({
            x: viewportWidth / 2 - ((centerX / canvasScale) * nextScale),
            y: viewportHeight / 2 - ((centerY / canvasScale) * nextScale)
        });
    };

    const handlePdfExport = async () => {
        if (isExportingPdf) return;
        setIsExportingPdf(true);
        try {
            await exportToPDF(stageRef, themeName, {
                paperSize: pdfPaper,
                orientation: pdfOrientation,
                scalePreset: pdfScale || null
            });
            setShowPdfOptions(false);
        } finally {
            setIsExportingPdf(false);
        }
    };

    return (
        <header className="top-toolbar" style={{ height: '60px', background: themeName === 'light' ? '#f8fafc' : 'rgba(30, 41, 59, 0.8)', borderBottom: `1px solid ${theme.grid}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: '20px', zIndex: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Home size={24} color={theme.accent} />
                <span style={{ fontWeight: '600', fontSize: '1.2rem', color: theme.text }}>
                    SwiftPlanDD <span style={{ fontSize: '0.8rem', color: theme.dim, fontWeight: 'normal' }}>v{packageJson.version}</span>
                </span>
            </div>
            <div style={{ flexGrow: 1 }} />
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <button className="tool-button-small" onClick={() => projectInputRef.current?.click()} style={{ background: 'transparent', border: 'none', color: theme.dim, cursor: 'pointer' }} title="Open Project">
                    <FolderOpen size={20} />
                </button>
                <div style={{ position: 'relative' }}>
                    <button className="tool-button-small" onClick={() => setShowRecent(!showRecent)} style={{ background: 'transparent', border: 'none', color: theme.dim, cursor: 'pointer' }} title="Recent Projects">
                        <Clock size={20} />
                    </button>
                    {showRecent && (() => {
                        const recent = useProjectStore.getState().getRecentProjects();
                        return (
                            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, borderRadius: '8px', padding: '8px 0', minWidth: '240px', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.15)', zIndex: 200 }} onClick={(e) => e.stopPropagation()}>
                                <div style={{ padding: '4px 12px 8px', fontSize: '0.75rem', color: theme.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Projects</div>
                                {recent.length === 0 ? (
                                    <div style={{ padding: '8px 12px', fontSize: '0.85rem', color: theme.dim }}>No recent projects</div>
                                ) : recent.map((r, i) => (
                                    <div key={i} style={{ padding: '6px 12px', fontSize: '0.85rem', color: theme.text, cursor: 'default', borderBottom: i < recent.length - 1 ? `1px solid ${theme.grid}` : 'none' }}>
                                        <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: theme.dim, marginTop: '2px' }}>{r.wallCount} walls, {r.roomCount} rooms, {r.furnitureCount} items — {new Date(r.date).toLocaleDateString()}</div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
                <input type="file" ref={projectInputRef} hidden accept=".json" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            try {
                                const data = JSON.parse(ev.target.result);
                                importProject(data, file.name);
                            } catch (err) {
                                console.error("Failed to parse project file", err);
                            }
                        };
                        reader.readAsText(file);
                    }
                    e.target.value = ''; // Reset input so same file can be loaded again
                }} />

                <button className="tool-button-small" onClick={exportProject} style={{ background: 'transparent', border: 'none', color: theme.dim, cursor: 'pointer' }} title="Save Project">
                    <Save size={20} />
                </button>

                <div style={{ width: '1px', height: '24px', background: theme.grid, margin: '0 5px' }} />

                <button className="tool-button-small" onClick={undo} disabled={pastLen === 0} style={{ background: 'transparent', border: 'none', color: pastLen > 0 ? theme.dim : theme.grid, cursor: pastLen > 0 ? 'pointer' : 'default', opacity: pastLen > 0 ? 1 : 0.4 }} title={undoLabel ? `Undo ${undoLabel} (Ctrl+Z)` : 'Undo (Ctrl+Z)'}>
                    <Undo2 size={20} />
                </button>
                <button className="tool-button-small" onClick={redo} disabled={futureLen === 0} style={{ background: 'transparent', border: 'none', color: futureLen > 0 ? theme.dim : theme.grid, cursor: futureLen > 0 ? 'pointer' : 'default', opacity: futureLen > 0 ? 1 : 0.4 }} title={redoLabel ? `Redo ${redoLabel} (Ctrl+Y)` : 'Redo (Ctrl+Y)'}>
                    <Redo2 size={20} />
                </button>

                <div style={{ position: 'relative' }}>
                    <button className="tool-button-small" onClick={(e) => { e.stopPropagation(); setShowTracingMenu(!showTracingMenu); }} style={{ background: 'transparent', border: 'none', color: theme.dim, cursor: 'pointer' }} title="Upload Tracing Image">
                        <Image size={20} />
                    </button>
                    {showTracingMenu && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: themeName === 'light' ? '#fff' : '#1e293b', border: `1px solid ${theme.grid}`, borderRadius: '8px', padding: '8px 0', minWidth: '220px', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.15)', zIndex: 200 }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ padding: '4px 12px 8px', fontSize: '0.75rem', color: theme.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tracing Scope</div>
                            <button onClick={() => openTracingFilePicker('floor')} style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: theme.text, cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem' }}>Upload to current floor</button>
                            <button onClick={() => openTracingFilePicker('global')} style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: theme.text, cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem' }}>Upload to all floors</button>
                        </div>
                    )}
                </div>
                <input type="file" ref={bgInputRef} hidden accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const imageSrc = typeof event.target?.result === 'string' ? event.target.result : null;
                            if (!imageSrc) return;

                            if (tracingTargetRef.current === 'global') {
                                setGlobalTracing(buildTracingPayload(imageSrc, 'global'));
                            } else {
                                setCurrentFloorTracing(buildTracingPayload(imageSrc, 'floor'));
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                    e.target.value = '';
                }} />

                <div style={{ width: '1px', height: '24px', background: theme.grid, margin: '0 5px' }} />

                <button className="tool-button-small" onClick={() => exportToPNG(stageRef)} style={{ background: 'transparent', border: 'none', color: theme.dim, cursor: 'pointer' }} title="Export as PNG Image">
                    <Download size={20} />
                </button>

                <button className="tool-button-small" onClick={() => setShowPdfOptions(true)} style={{ background: 'transparent', border: 'none', color: theme.dim, cursor: 'pointer' }} title="Export as PDF Document">
                    <FileText size={20} />
                </button>

                <button className="tool-button-small" onClick={() => exportToDrawio(useProjectStore.getState())} style={{ background: 'transparent', border: 'none', color: theme.dim, cursor: 'pointer' }} title="Export to Draw.io (XML)">
                    <LayoutTemplate size={20} />
                </button>

                <button className="tool-button-small" onClick={fitToView} style={{ background: 'transparent', border: 'none', color: theme.dim, cursor: 'pointer' }} title="Fit Drawing to View">
                    <ScanSearch size={20} />
                </button>

                <div style={{ width: '1px', height: '24px', background: theme.grid, margin: '0 5px' }} />

                <button className="tool-button-small" onClick={() => setShowHelp(true)} style={{ background: 'transparent', border: 'none', color: theme.accent, cursor: 'pointer' }} title="Help & About">
                    <HelpCircle size={20} />
                </button>
            </div>
            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
            {showPdfOptions && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) setShowPdfOptions(false); }}>
                    <div style={{ background: themeName === 'light' ? '#fff' : '#1e293b', borderRadius: '12px', padding: '24px', color: theme.text, minWidth: '300px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem' }}>PDF Export Options</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                Paper Size
                                <select value={pdfPaper} onChange={(e) => setPdfPaper(e.target.value)} style={{ padding: '4px 8px', background: themeName === 'light' ? '#fff' : '#0f172a', border: `1px solid ${theme.grid}`, color: theme.text, borderRadius: '4px' }}>
                                    <option value="a4">A4</option>
                                    <option value="a3">A3</option>
                                    <option value="letter">Letter</option>
                                    <option value="legal">Legal</option>
                                </select>
                            </label>
                            <label style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                Orientation
                                <select value={pdfOrientation} onChange={(e) => setPdfOrientation(e.target.value)} style={{ padding: '4px 8px', background: themeName === 'light' ? '#fff' : '#0f172a', border: `1px solid ${theme.grid}`, color: theme.text, borderRadius: '4px' }}>
                                    <option value="landscape">Landscape</option>
                                    <option value="portrait">Portrait</option>
                                </select>
                            </label>
                            <label style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                Scale Label
                                <select value={pdfScale} onChange={(e) => setPdfScale(e.target.value)} style={{ padding: '4px 8px', background: themeName === 'light' ? '#fff' : '#0f172a', border: `1px solid ${theme.grid}`, color: theme.text, borderRadius: '4px' }}>
                                    <option value="">None</option>
                                    <option value="1:20">1:20</option>
                                    <option value="1:50">1:50</option>
                                    <option value="1:100">1:100</option>
                                    <option value="1:200">1:200</option>
                                    <option value="1:500">1:500</option>
                                </select>
                            </label>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button onClick={() => setShowPdfOptions(false)} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${theme.grid}`, color: theme.text, borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                            <button onClick={handlePdfExport} disabled={isExportingPdf} style={{ padding: '8px 16px', background: theme.accent, border: 'none', color: '#fff', borderRadius: '6px', cursor: isExportingPdf ? 'progress' : 'pointer', fontSize: '0.85rem', opacity: isExportingPdf ? 0.7 : 1 }}>Export PDF</button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};
