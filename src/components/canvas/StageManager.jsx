import { useRef, useEffect, useState } from 'react';
import { Stage, Layer } from 'react-konva';
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

export const StageManager = () => {
    const [spaceBarDown, setSpaceBarDown] = useState(false);
    const [dragDistance, setDragDistance] = useState(0);
    const stageRef = useRef(null);

    // Editor State
    const tool = useEditorStore(state => state.tool);
    const activeObject = useEditorStore(state => state.activeObject);
    const setActiveObject = useEditorStore(state => state.setActiveObject);
    const mousePos = useEditorStore(state => state.mousePos);
    const setMousePos = useEditorStore(state => state.setMousePos);

    const themeName = useEditorStore(state => state.themeName);
    const showGrid = useEditorStore(state => state.showGrid);
    const gridSpacing = useEditorStore(state => state.gridSpacing); // Now in logical units (cm/mm etc as set in Inspector)
    const canvasScale = useEditorStore(state => state.canvasScale); // e.g. 50 meaning 1:50 scale
    const wallThickness = useEditorStore(state => state.wallThickness);

    const stagePos = useEditorStore(state => state.stagePos);
    const setStagePos = useEditorStore(state => state.setStagePos);
    const stageScale = useEditorStore(state => state.stageScale);
    const setStageScale = useEditorStore(state => state.setStageScale);
    const isPanning = useEditorStore(state => state.isPanning);
    const setIsPanning = useEditorStore(state => state.setIsPanning);

    const setSelectedId = useEditorStore(state => state.setSelectedId);
    const setStageRef = useEditorStore(state => state.setStageRef);

    useEffect(() => {
        if (stageRef.current) {
            setStageRef(stageRef.current);
        }
    }, [setStageRef]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                e.preventDefault();
                setSpaceBarDown(true);
            }
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                e.preventDefault();
                const dx = e.code === 'ArrowLeft' ? -1 : e.code === 'ArrowRight' ? 1 : 0;
                const dy = e.code === 'ArrowUp' ? -1 : e.code === 'ArrowDown' ? 1 : 0;
                const selectedId = useEditorStore.getState().selectedId;
                if (selectedId) {
                    const store = useProjectStore.getState();
                    const stateGrid = useEditorStore.getState().gridSpacing;
                    const shift = e.shiftKey ? Math.max(stateGrid, 100) : Math.max(stateGrid / 10, 10);

                    const furn = store.furniture.find(f => f.id === selectedId);
                    if (furn) {
                        store.updateFurniture(selectedId, { x: furn.x + dx * shift, y: furn.y + dy * shift });
                    }
                    const open = store.openings.find(o => o.id === selectedId);
                    if (open) {
                        const dir = (dx + dy) > 0 ? 1 : -1;
                        store.updateOpening(selectedId, { offset: Math.max(0, open.offset + dir * shift) });
                    }
                }
            }
        };
        const handleKeyUp = (e) => {
            if (e.code === 'Space') {
                setSpaceBarDown(false);
                setIsPanning(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [setIsPanning]);

    // Project State
    const walls = useProjectStore(state => state.walls);
    const addWall = useProjectStore(state => state.addWall);
    const addOpening = useProjectStore(state => state.addOpening);
    const addRoom = useProjectStore(state => state.addRoom);
    const addDimension = useProjectStore(state => state.addDimension);

    const theme = THEMES[themeName];

    const getLogicalPosition = (stage) => {
        const pointer = stage.getPointerPosition();
        if (!pointer) return null;
        // The logical coordinate is the real-world centimeter coordinate.
        // stageScale handles viewport zooming. canvasScale handles the physical to logical scale (e.g., 1px = Xcm).
        return {
            x: ((pointer.x - stage.x()) / stage.scaleX()) * canvasScale,
            y: ((pointer.y - stage.y()) / stage.scaleY()) * canvasScale
        };
    };

    const handleStageClick = (e) => {
        if (spaceBarDown || isPanning) return;

        if (tool === 'select') {
            if (e.target === stageRef.current) setSelectedId(null);
            return;
        }

        const pos = mousePos;

        if (tool === 'wall') {
            if (!activeObject) {
                setActiveObject({ id: Date.now(), x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, thickness: wallThickness });
            } else {
                const newWall = { ...activeObject, x2: pos.x, y2: pos.y };
                if (getDistance({ x: newWall.x1, y: newWall.y1 }, { x: newWall.x2, y: newWall.y2 }) > 5) {
                    addWall(newWall);
                    setActiveObject({ id: Date.now(), x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, thickness: wallThickness });
                } else {
                    setActiveObject(null);
                }
            }
        } else if (tool === 'door' || tool === 'window') {
            const nearest = findNearestWall(pos, walls);
            if (nearest) {
                const defaultWidth = tool === 'window' ? 1200 : 900;
                addOpening({ id: Date.now(), wallId: nearest.wallId, type: tool, width: defaultWidth, offset: nearest.offset });
            }
        } else if (tool === 'measure') {
            if (!activeObject) {
                setActiveObject({ id: Date.now(), x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, type: 'dimension' });
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
                setActiveObject({ id: Date.now(), points: [logicalPos] });
            } else {
                const newPoints = [...activeObject.points, logicalPos];
                if (getDistance(newPoints[0], logicalPos) < (SNAP_THRESHOLD * canvasScale) / stageScale && newPoints.length > 2) {
                    const area = shoelaceArea(newPoints); // Area in cm^2
                    addRoom({ id: Date.now(), points: newPoints, area, pattern: 'solid' });
                    setActiveObject(null);
                } else {
                    setActiveObject({ ...activeObject, points: newPoints });
                }
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

        // Snapping requires access to scaled grid
        const snapped = getSnappedPoint(logicalPos, walls, stageScale / canvasScale, gridSpacing);
        setMousePos(snapped);

        if (activeObject && tool === 'wall') {
            setActiveObject({ ...activeObject, x2: snapped.x, y2: snapped.y });
        }
        if (activeObject && tool === 'measure') {
            setActiveObject({ ...activeObject, x2: snapped.x, y2: snapped.y });
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
        if (e.evt.button === 1 || e.evt.button === 2 || (spaceBarDown && e.evt.button === 0)) {
            e.evt.preventDefault();
            setIsPanning(true);
            setDragDistance(0);
        }
    };

    const handleMouseUp = (e) => {
        if (e.evt.button === 1 || e.evt.button === 2 || (spaceBarDown && e.evt.button === 0)) {
            setIsPanning(false);
        }
    };

    return (
        <main className="canvas-area" style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: themeName === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(15, 23, 42, 0.8)', border: `1px solid ${theme.grid}`, padding: '10px 15px', borderRadius: '8px', zIndex: 10, color: theme.text, fontSize: '0.8rem', pointerEvents: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                Scale: 1:{canvasScale} | Zoom: {Math.round(stageScale * 100)}% | Pos: {Math.round(mousePos.x)}, {Math.round(mousePos.y)} mm
            </div>

            <Stage
                width={window.innerWidth - 380} // Approx sidebar(80) + inspector(300) width.
                height={window.innerHeight - 60} // Header height
                onClick={handleStageClick}
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
                    // Convert grid spacing (mm) to physical pixels using canvasScale and stageScale
                    backgroundSize: `${(gridSpacing / canvasScale) * stageScale}px ${(gridSpacing / canvasScale) * stageScale}px`,
                    backgroundPosition: `${stagePos.x}px ${stagePos.y}px`,
                    cursor: isPanning ? 'grabbing' : (spaceBarDown ? 'grab' : (tool === 'select' ? 'default' : 'crosshair'))
                }}
                onContextMenu={(e) => {
                    e.evt.preventDefault();
                    if (dragDistance > 5) return; // Was panning, don't show menu
                    useEditorStore.getState().setContextMenu({
                        show: true,
                        x: e.evt.clientX,
                        y: e.evt.clientY,
                        targetId: useEditorStore.getState().selectedId
                    });
                }}
            >
                <Layer>
                    <InteractionLayer />
                    <RoomLayer />
                    <WallLayer />
                    <FurnitureLayer />
                    <AnnotationLayer />
                </Layer>
            </Stage>
        </main>
    );
};
