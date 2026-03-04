import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Line as KonvaLine, Group } from 'react-konva';
import { useEditorStore } from '../../store/useEditorStore';
import { useProjectStore } from '../../store/useProjectStore';
import { THEMES, SNAP_THRESHOLD } from '../../utils/constants';
import { getDistance, shoelaceArea } from '../../utils/geometry';
import { getSnappedPoint, findNearestWall } from '../../utils/snapping';
import { WallLayer } from './WallLayer';
import { FurnitureLayer } from './FurnitureLayer';
import { AnnotationLayer } from './AnnotationLayer';
import { RoomLayer } from './RoomLayer';
import { InteractionLayer } from './InteractionLayer';
import { Rulers } from './Rulers';

export const StageManager = () => {
    const SIDEBAR_WIDTH = 80;
    const INSPECTOR_WIDTH = 300;
    const HEADER_HEIGHT = 60;

    const createId = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const [spaceBarDown, setSpaceBarDown] = useState(false);
    const [shiftDown, setShiftDown] = useState(false);
    const [dragDistance, setDragDistance] = useState(0);
    const [selectionStart, setSelectionStart] = useState(null);
    const [selectionEnd, setSelectionEnd] = useState(null);
    const [wallLengthInput, setWallLengthInput] = useState('');
    const [wallAngleInput, setWallAngleInput] = useState('0');
    const [isWallLengthEditing, setIsWallLengthEditing] = useState(false);
    const [isWallAngleEditing, setIsWallAngleEditing] = useState(false);
    const [stageSize, setStageSize] = useState({
        width: Math.max(320, window.innerWidth - (SIDEBAR_WIDTH + INSPECTOR_WIDTH)),
        height: Math.max(240, window.innerHeight - HEADER_HEIGHT)
    });
    const stageRef = useRef(null);

    const tool = useEditorStore(state => state.tool);
    const activeObject = useEditorStore(state => state.activeObject);
    const setActiveObject = useEditorStore(state => state.setActiveObject);
    const mousePos = useEditorStore(state => state.mousePos);
    const setMousePos = useEditorStore(state => state.setMousePos);

    const themeName = useEditorStore(state => state.themeName);
    const showGrid = useEditorStore(state => state.showGrid);
    const gridSpacing = useEditorStore(state => state.gridSpacing);
    const canvasScale = useEditorStore(state => state.canvasScale);
    const wallThickness = useEditorStore(state => state.wallThickness);

    const stagePos = useEditorStore(state => state.stagePos);
    const setStagePos = useEditorStore(state => state.setStagePos);
    const stageScale = useEditorStore(state => state.stageScale);
    const setStageScale = useEditorStore(state => state.setStageScale);
    const isPanning = useEditorStore(state => state.isPanning);
    const setIsPanning = useEditorStore(state => state.setIsPanning);

    const setSelectedIds = useEditorStore(state => state.setSelectedIds);
    const clearSelection = useEditorStore(state => state.clearSelection);
    const setStageRef = useEditorStore(state => state.setStageRef);

    const walls = useProjectStore(state => state.walls);
    const furniture = useProjectStore(state => state.furniture);
    const floors = useProjectStore(state => state.floors);
    const currentFloorId = useProjectStore(state => state.currentFloorId);
    const getFloorData = useProjectStore(state => state.getFloorData);
    const addWall = useProjectStore(state => state.addWall);
    const addOpening = useProjectStore(state => state.addOpening);
    const addRoom = useProjectStore(state => state.addRoom);
    const addDimension = useProjectStore(state => state.addDimension);
    const addAnnotation = useProjectStore(state => state.addAnnotation);

    const theme = THEMES[themeName];

    // Throttle mousePos updates to ~60fps
    const lastMouseUpdateRef = useRef(0);
    const throttledSetMousePos = useCallback((pos) => {
        const now = performance.now();
        if (now - lastMouseUpdateRef.current >= 16) {
            lastMouseUpdateRef.current = now;
            setMousePos(pos);
        }
    }, [setMousePos]);

    // Ghost floor: show previous floor's walls at low opacity
    const ghostWalls = (() => {
        const idx = floors.findIndex(f => f.id === currentFloorId);
        if (idx <= 0) return [];
        const belowFloor = floors[idx - 1];
        const data = getFloorData(belowFloor.id);
        return data.walls || [];
    })();

    const constrainToAngle = (from, to) => {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.sqrt((dx * dx) + (dy * dy));
        if (distance <= 0) return to;
        const snapStep = Math.PI / 4;
        const angle = Math.atan2(dy, dx);
        const snappedAngle = Math.round(angle / snapStep) * snapStep;
        return {
            x: from.x + Math.cos(snappedAngle) * distance,
            y: from.y + Math.sin(snappedAngle) * distance
        };
    };

    const getLogicalPosition = (stage) => {
        const pointer = stage.getPointerPosition();
        if (!pointer) return null;
        return {
            x: ((pointer.x - stage.x()) / stage.scaleX()) * canvasScale,
            y: ((pointer.y - stage.y()) / stage.scaleY()) * canvasScale
        };
    };

    const getAngleDeg = (from, to) => {
        const angleRad = Math.atan2(to.y - from.y, to.x - from.x);
        return Math.round((angleRad * 180) / Math.PI);
    };

    const getPointAtLengthAndAngle = (from, length, angleDeg) => {
        const rad = (angleDeg * Math.PI) / 180;
        return {
            x: from.x + Math.cos(rad) * length,
            y: from.y + Math.sin(rad) * length
        };
    };

    const commitWallWithLength = (lengthMm, angleDegInput) => {
        if (!activeObject || tool !== 'wall') return;
        const safeLength = Number(lengthMm);
        if (!Number.isFinite(safeLength) || safeLength <= 5) return;

        const fallbackAngle = getAngleDeg(
            { x: activeObject.x1, y: activeObject.y1 },
            { x: activeObject.x2, y: activeObject.y2 }
        );
        const parsedAngle = Number(angleDegInput);
        const finalAngle = Number.isFinite(parsedAngle) ? parsedAngle : fallbackAngle;
        const endPoint = getPointAtLengthAndAngle(
            { x: activeObject.x1, y: activeObject.y1 },
            safeLength,
            finalAngle
        );

        addWall({ ...activeObject, x2: endPoint.x, y2: endPoint.y });
        setActiveObject({ id: createId(), x1: endPoint.x, y1: endPoint.y, x2: endPoint.x, y2: endPoint.y, thickness: wallThickness });
        setWallLengthInput('');
        setWallAngleInput(String(finalAngle));
    };

    useEffect(() => {
        if (stageRef.current) {
            setStageRef(stageRef.current);
        }
    }, [setStageRef]);

    useEffect(() => {
        const handleResize = () => {
            setStageSize({
                width: Math.max(320, window.innerWidth - (SIDEBAR_WIDTH + INSPECTOR_WIDTH)),
                height: Math.max(240, window.innerHeight - HEADER_HEIGHT)
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Shift') {
                setShiftDown(true);
            }

            if (e.key === 'Escape') {
                useEditorStore.getState().setContextMenu({ show: false });
                if (useEditorStore.getState().activeObject) {
                    useEditorStore.getState().setActiveObject(null);
                    setWallLengthInput('');
                    setWallAngleInput('0');
                } else {
                    useEditorStore.getState().setSelectedId(null);
                }
            }

            if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                e.preventDefault();
                setSpaceBarDown(true);
            }

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                e.preventDefault();
                const dx = e.code === 'ArrowLeft' ? -1 : e.code === 'ArrowRight' ? 1 : 0;
                const dy = e.code === 'ArrowUp' ? -1 : e.code === 'ArrowDown' ? 1 : 0;
                const currentSelectedId = useEditorStore.getState().selectedId;
                if (currentSelectedId) {
                    const store = useProjectStore.getState();
                    const stateGrid = useEditorStore.getState().gridSpacing;
                    const shift = e.shiftKey ? Math.max(stateGrid, 100) : Math.max(stateGrid / 10, 10);

                    const furn = store.furniture.find(f => f.id === currentSelectedId);
                    if (furn) {
                        store.updateFurniture(currentSelectedId, { x: furn.x + dx * shift, y: furn.y + dy * shift });
                    }
                    const open = store.openings.find(o => o.id === currentSelectedId);
                    if (open) {
                        const dir = (dx + dy) > 0 ? 1 : -1;
                        store.updateOpening(currentSelectedId, { offset: Math.max(0, open.offset + dir * shift) });
                    }
                }
            }
        };

        const handleKeyUp = (e) => {
            if (e.code === 'Space') {
                setSpaceBarDown(false);
                setIsPanning(false);
            }
            if (e.key === 'Shift') {
                setShiftDown(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [setIsPanning]);

    const handleStageClick = (e) => {
        if (spaceBarDown || isPanning) return;

        if (tool === 'select') {
            if (selectionStart || selectionEnd) return;
            if (e.target === stageRef.current) {
                clearSelection();
            }
            return;
        }

        const pos = mousePos;

        if (tool === 'wall') {
            if (!activeObject) {
                setActiveObject({ id: createId(), x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, thickness: wallThickness });
                setWallLengthInput('');
                setWallAngleInput('0');
            } else {
                const endPos = shiftDown ? constrainToAngle({ x: activeObject.x1, y: activeObject.y1 }, pos) : pos;
                const newWall = { ...activeObject, x2: endPos.x, y2: endPos.y };
                if (getDistance({ x: newWall.x1, y: newWall.y1 }, { x: newWall.x2, y: newWall.y2 }) > 5) {
                    addWall(newWall);
                    setActiveObject({ id: createId(), x1: endPos.x, y1: endPos.y, x2: endPos.x, y2: endPos.y, thickness: wallThickness });
                    setWallLengthInput('');
                    setWallAngleInput(String(getAngleDeg({ x: newWall.x1, y: newWall.y1 }, { x: newWall.x2, y: newWall.y2 })));
                } else {
                    setActiveObject(null);
                    setWallLengthInput('');
                    setWallAngleInput('0');
                }
            }
        } else if (tool === 'door' || tool === 'window') {
            const nearest = findNearestWall(pos, walls, stageScale, canvasScale);
            if (nearest) {
                const defaultWidth = tool === 'window' ? 1200 : 900;
                addOpening({ id: createId(), wallId: nearest.wallId, type: tool, width: defaultWidth, offset: nearest.offset });
            }
        } else if (tool === 'measure') {
            if (!activeObject) {
                setActiveObject({ id: createId(), x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, type: 'dimension' });
            } else {
                const newDim = { ...activeObject, x2: pos.x, y2: pos.y };
                if (getDistance({ x: newDim.x1, y: newDim.y1 }, { x: newDim.x2, y: newDim.y2 }) > 1) {
                    addDimension(newDim);
                }
                setActiveObject(null);
            }
        } else if (tool === 'room') {
            const logicalPos = getLogicalPosition(e.target.getStage());
            if (!activeObject) {
                setActiveObject({ id: createId(), points: [logicalPos] });
            } else {
                const newPoints = [...activeObject.points, logicalPos];
                if (getDistance(newPoints[0], logicalPos) < (SNAP_THRESHOLD * canvasScale) / stageScale && newPoints.length > 2) {
                    const area = shoelaceArea(newPoints);
                    addRoom({ id: createId(), points: newPoints, area, pattern: 'solid' });
                    setActiveObject(null);
                } else {
                    setActiveObject({ ...activeObject, points: newPoints });
                }
            }
        } else if (tool === 'text') {
            const newAnnotationId = createId();
            addAnnotation({
                id: newAnnotationId,
                x: pos.x,
                y: pos.y,
                text: 'New Text',
                fontSize: 14,
                color: null,
                rotation: 0
            });
            useEditorStore.getState().setSelectedId(newAnnotationId);
            useEditorStore.getState().setTool('select');
        } else if (tool === 'arc_wall') {
            if (!activeObject) {
                // First click: start point
                setActiveObject({ id: createId(), x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, thickness: wallThickness, arcPhase: 1 });
            } else if (activeObject.arcPhase === 1) {
                // Second click: end point
                if (getDistance({ x: activeObject.x1, y: activeObject.y1 }, pos) > 5) {
                    setActiveObject({ ...activeObject, x2: pos.x, y2: pos.y, arcPhase: 2, arcMidX: (activeObject.x1 + pos.x) / 2, arcMidY: (activeObject.y1 + pos.y) / 2 });
                }
            } else if (activeObject.arcPhase === 2) {
                // Third click: arc midpoint (defines curvature)
                const arcWall = { ...activeObject, arcMidX: pos.x, arcMidY: pos.y };
                delete arcWall.arcPhase;
                addWall(arcWall);
                setActiveObject(null);
            }
        }
    };

    const handleMouseMove = (e) => {
        if (isPanning) {
            setDragDistance(prev => prev + Math.abs(e.evt.movementX) + Math.abs(e.evt.movementY));
            setStagePos({
                x: stagePos.x + e.evt.movementX,
                y: stagePos.y + e.evt.movementY
            });
            return;
        }

        const stage = e.target.getStage();
        const logicalPos = getLogicalPosition(stage);
        if (!logicalPos) return;

        const snapped = getSnappedPoint(logicalPos, walls, stageScale / canvasScale, gridSpacing);
        throttledSetMousePos(snapped);

        if (tool === 'select' && selectionStart) {
            setSelectionEnd(logicalPos);
            return;
        }

        if (activeObject && tool === 'wall') {
            const targetPoint = (shiftDown || e.evt.shiftKey)
                ? constrainToAngle({ x: activeObject.x1, y: activeObject.y1 }, snapped)
                : snapped;

            setActiveObject({ ...activeObject, x2: targetPoint.x, y2: targetPoint.y });

            if (!isWallLengthEditing) {
                const draftLength = Math.round(getDistance(
                    { x: activeObject.x1, y: activeObject.y1 },
                    { x: targetPoint.x, y: targetPoint.y }
                ));
                setWallLengthInput(String(Math.max(draftLength, 0)));
            }

            if (!isWallAngleEditing) {
                const draftAngle = getAngleDeg(
                    { x: activeObject.x1, y: activeObject.y1 },
                    { x: targetPoint.x, y: targetPoint.y }
                );
                setWallAngleInput(String(draftAngle));
            }
        }

        if (activeObject && tool === 'measure') {
            setActiveObject({ ...activeObject, x2: snapped.x, y2: snapped.y });
        }

        if (activeObject && tool === 'arc_wall') {
            if (activeObject.arcPhase === 1) {
                setActiveObject({ ...activeObject, x2: snapped.x, y2: snapped.y });
            } else if (activeObject.arcPhase === 2) {
                setActiveObject({ ...activeObject, arcMidX: snapped.x, arcMidY: snapped.y });
            }
        }
    };

    const handleWheel = (e) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;
        const scaleBy = 1.1;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
        setStageScale(newScale);
        setStagePos({
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        });
    };

    const handleMouseDown = (e) => {
        if (tool === 'select' && e.evt.button === 0 && e.target === stageRef.current) {
            const logicalPos = getLogicalPosition(e.target.getStage());
            if (logicalPos) {
                setSelectionStart(logicalPos);
                setSelectionEnd(logicalPos);
            }
            return;
        }

        if (e.evt.button === 1 || e.evt.button === 2 || (spaceBarDown && e.evt.button === 0)) {
            e.evt.preventDefault();
            setIsPanning(true);
            setDragDistance(0);
        }
    };

    const handleMouseUp = (e) => {
        if (tool === 'select' && selectionStart && selectionEnd && e.evt.button === 0) {
            const x1 = Math.min(selectionStart.x, selectionEnd.x);
            const x2 = Math.max(selectionStart.x, selectionEnd.x);
            const y1 = Math.min(selectionStart.y, selectionEnd.y);
            const y2 = Math.max(selectionStart.y, selectionEnd.y);
            const isDragSelection = Math.abs(selectionStart.x - selectionEnd.x) > 10 || Math.abs(selectionStart.y - selectionEnd.y) > 10;

            if (isDragSelection) {
                const hits = furniture
                    .filter(item => {
                        const fx1 = item.x;
                        const fy1 = item.y;
                        const fx2 = item.x + item.width;
                        const fy2 = item.y + item.height;
                        return !(fx2 < x1 || fx1 > x2 || fy2 < y1 || fy1 > y2);
                    })
                    .map(item => item.id);

                setSelectedIds(hits);
            } else if (e.target === stageRef.current) {
                clearSelection();
            }

            setSelectionStart(null);
            setSelectionEnd(null);
            return;
        }

        if (e.evt.button === 1 || e.evt.button === 2 || (spaceBarDown && e.evt.button === 0)) {
            setIsPanning(false);
        }
    };

    const selectionRect = selectionStart && selectionEnd ? {
        x: Math.min(selectionStart.x, selectionEnd.x) / canvasScale,
        y: Math.min(selectionStart.y, selectionEnd.y) / canvasScale,
        width: Math.abs(selectionEnd.x - selectionStart.x) / canvasScale,
        height: Math.abs(selectionEnd.y - selectionStart.y) / canvasScale
    } : null;

    return (
        <main className="canvas-area" style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
            <Rulers width={stageSize.width} height={stageSize.height} />
            <div style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: themeName === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(15, 23, 42, 0.8)', border: `1px solid ${theme.grid}`, padding: '10px 15px', borderRadius: '8px', zIndex: 10, color: theme.text, fontSize: '0.8rem', pointerEvents: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                Scale: 1:{canvasScale} | Zoom: {Math.round(stageScale * 100)}% | Pos: {Math.round(mousePos.x)}, {Math.round(mousePos.y)} mm
            </div>

            <Stage
                width={stageSize.width}
                height={stageSize.height}
                onClick={handleStageClick}
                onDblClick={() => {
                    if (tool === 'wall' && activeObject) {
                        setActiveObject(null);
                        setWallLengthInput('');
                        setWallAngleInput('0');
                    }
                }}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                draggable={false}
                scaleX={stageScale}
                scaleY={stageScale}
                x={stagePos.x}
                y={stagePos.y}
                ref={stageRef}
                style={{
                    backgroundColor: theme.bg,
                    backgroundImage: showGrid ? `linear-gradient(to right, ${theme.grid} 1px, transparent 1px), linear-gradient(to bottom, ${theme.grid} 1px, transparent 1px)` : 'none',
                    backgroundSize: `${(gridSpacing / canvasScale) * stageScale}px ${(gridSpacing / canvasScale) * stageScale}px`,
                    backgroundPosition: `${stagePos.x}px ${stagePos.y}px`,
                    cursor: isPanning ? 'grabbing' : (spaceBarDown ? 'grab' : (tool === 'select' ? 'default' : 'crosshair'))
                }}
                onContextMenu={(e) => {
                    e.evt.preventDefault();
                    if (dragDistance > 5) return;
                    const MENU_WIDTH = 160;
                    const MENU_HEIGHT = 190;
                    const maxX = Math.max(0, window.innerWidth - MENU_WIDTH);
                    const maxY = Math.max(0, window.innerHeight - MENU_HEIGHT);
                    useEditorStore.getState().setContextMenu({
                        show: true,
                        x: Math.max(0, Math.min(e.evt.clientX, maxX)),
                        y: Math.max(0, Math.min(e.evt.clientY, maxY)),
                        targetId: useEditorStore.getState().selectedId
                    });
                }}
            >
                <Layer>
                    {/* Ghost floor overlay */}
                    {ghostWalls.length > 0 && (
                        <Group opacity={0.15}>
                            {ghostWalls.map(w => (
                                <KonvaLine
                                    key={w.id}
                                    points={[w.x1 / canvasScale, w.y1 / canvasScale, w.x2 / canvasScale, w.y2 / canvasScale]}
                                    stroke={theme.wall}
                                    strokeWidth={Math.max(1, (w.thickness || 200) / canvasScale)}
                                    lineCap="square"
                                    dash={[6, 4]}
                                />
                            ))}
                        </Group>
                    )}
                    <InteractionLayer />
                    <RoomLayer />
                    <WallLayer />
                    <FurnitureLayer />
                    <AnnotationLayer />
                    {selectionRect && (
                        <Rect
                            x={selectionRect.x}
                            y={selectionRect.y}
                            width={selectionRect.width}
                            height={selectionRect.height}
                            fill={theme.accent}
                            opacity={0.12}
                            stroke={theme.accent}
                            strokeWidth={1}
                            dash={[4, 4]}
                        />
                    )}
                </Layer>
            </Stage>

            {tool === 'wall' && activeObject && (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        commitWallWithLength(wallLengthInput, wallAngleInput);
                    }}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: themeName === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(15, 23, 42, 0.9)',
                        border: `1px solid ${theme.grid}`,
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        zIndex: 11,
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                >
                    <span style={{ fontSize: '0.75rem', color: theme.dim, whiteSpace: 'nowrap' }}>Length (mm)</span>
                    <input
                        type="number"
                        min="1"
                        value={wallLengthInput}
                        onChange={(e) => setWallLengthInput(e.target.value)}
                        onFocus={() => setIsWallLengthEditing(true)}
                        onBlur={() => setIsWallLengthEditing(false)}
                        style={{
                            width: '90px',
                            background: themeName === 'light' ? '#fff' : '#1e293b',
                            border: `1px solid ${theme.grid}`,
                            color: theme.text,
                            borderRadius: '6px',
                            padding: '5px 8px',
                            fontSize: '0.8rem'
                        }}
                    />
                    <span style={{ fontSize: '0.75rem', color: theme.dim, whiteSpace: 'nowrap' }}>Angle (°)</span>
                    <input
                        type="number"
                        value={wallAngleInput}
                        onChange={(e) => setWallAngleInput(e.target.value)}
                        onFocus={() => setIsWallAngleEditing(true)}
                        onBlur={() => setIsWallAngleEditing(false)}
                        style={{
                            width: '76px',
                            background: themeName === 'light' ? '#fff' : '#1e293b',
                            border: `1px solid ${theme.grid}`,
                            color: theme.text,
                            borderRadius: '6px',
                            padding: '5px 8px',
                            fontSize: '0.8rem'
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            background: theme.accent,
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                        }}
                    >
                        Set
                    </button>
                    <span style={{ fontSize: '0.7rem', color: theme.dim, whiteSpace: 'nowrap' }}>Shift: 45° | Esc/Double-click: finish</span>
                </form>
            )}
        </main>
    );
};