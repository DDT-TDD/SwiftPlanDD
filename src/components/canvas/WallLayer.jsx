import { memo, useCallback, useMemo } from 'react';
import { Group, Line, Rect, Circle, Text, Arc, Path } from 'react-konva';
import { getDistance, getAngle, getPointAtOffset, getProjectedDistance } from '../../utils/geometry';
import { DEFAULT_WALL_THICKNESS, THEMES } from '../../utils/constants';
import { formatValue } from '../../utils/units';
import { getRoughLinePath, getStableRoughSeed } from '../../utils/roughUtils';
import { useProjectStore } from '../../store/useProjectStore';
import { useEditorStore } from '../../store/useEditorStore';

const Opening = memo(({ opening, wall, onSelect, isSelected, canvasScale, theme, interactive = true, roughMode = false, onDragEnd }) => {
    const roughLine = useMemo(() => (
        roughMode ? getRoughLinePath(0, 0, 0, -(opening.width / canvasScale), { seed: getStableRoughSeed(opening.id) }) : null
    ), [canvasScale, opening.id, opening.width, roughMode]);

    if (!wall) return null;
    const p1 = { x: wall.x1 / canvasScale, y: wall.y1 / canvasScale };
    const p2 = { x: wall.x2 / canvasScale, y: wall.y2 / canvasScale };
    const pos = getPointAtOffset(p1, p2, opening.offset / canvasScale);
    const angle = getAngle(p1, p2);
    const widthPx = opening.width / canvasScale;

    return (
        <Group
            x={pos.x} y={pos.y} rotation={angle}
            draggable={interactive}
            onDragEnd={(e) => {
                if (!interactive) return;
                const px = e.target.x() * canvasScale;
                const py = e.target.y() * canvasScale;
                if (onDragEnd) onDragEnd(opening.id, px, py);
            }}
            onClick={(e) => { if (!interactive) return; e.cancelBubble = true; onSelect(opening.id); }}
        >
            {opening.type === 'door' ? (
                <Group
                    scaleX={opening.flipX ? -1 : 1}
                    scaleY={opening.flipY ? -1 : 1}
                    offsetX={opening.flipX ? widthPx : 0}
                >
                    {roughMode ? (
                        <Path data={roughLine} stroke={isSelected ? theme.openingSelected : theme.opening} strokeWidth={3} />
                    ) : (
                        <Line points={[0, 0, 0, -widthPx]} stroke={isSelected ? theme.openingSelected : theme.opening} strokeWidth={3} />
                    )}
                    <Arc innerRadius={widthPx} outerRadius={widthPx} angle={90} rotation={-90} stroke={isSelected ? theme.openingSelected : theme.opening} strokeWidth={1} dash={roughMode ? undefined : [4, 2]} />
                </Group>
            ) : opening.type === 'french_window' ? (
                <Group>
                    <Rect width={widthPx} height={6} fill={theme.bg} stroke={isSelected ? theme.openingSelected : theme.opening} strokeWidth={1} offsetY={3} />
                    {roughMode ? null : (
                        <Group scaleY={opening.flipY ? -1 : 1}>
                            <Line points={[0, 0, 0, -widthPx / 2]} stroke={isSelected ? theme.openingSelected : theme.opening} strokeWidth={2} />
                            <Line points={[widthPx, 0, widthPx, -widthPx / 2]} stroke={isSelected ? theme.openingSelected : theme.opening} strokeWidth={2} />
                            <Arc innerRadius={widthPx / 2} outerRadius={widthPx / 2} angle={90} rotation={-90} stroke={isSelected ? theme.openingSelected : theme.opening} strokeWidth={1} dash={[4, 2]} />
                            <Arc x={widthPx} innerRadius={widthPx / 2} outerRadius={widthPx / 2} angle={90} rotation={180} stroke={isSelected ? theme.openingSelected : theme.opening} strokeWidth={1} dash={[4, 2]} />
                        </Group>
                    )}
                </Group>
            ) : (
                <Group>
                    <Rect width={widthPx} height={6} fill={theme.bg} stroke={theme.wall} strokeWidth={1} offsetY={3} />
                    <Rect width={widthPx} height={2} fill={isSelected ? theme.openingSelected : theme.opening} offsetY={1} />
                </Group>
            )}
        </Group>
    );
});

const Wall = memo(({ wall, openings = [], onSelect, isSelected, canvasScale, stageScale, theme, unit, showDual, interactive = true, roughMode = false, wallLabelPosition = 'center', onEndpointDrag, onWallDragEnd }) => {
    const activeLabelPosition = wall.labelPosition || wallLabelPosition;
    const p1 = useMemo(() => ({ x: wall.x1 / canvasScale, y: wall.y1 / canvasScale }), [canvasScale, wall.x1, wall.y1]);
    const p2 = useMemo(() => ({ x: wall.x2 / canvasScale, y: wall.y2 / canvasScale }), [canvasScale, wall.x2, wall.y2]);
    const isArc = wall.arcMidX != null && wall.arcMidY != null;
    const arcMid = useMemo(() => (
        isArc ? { x: wall.arcMidX / canvasScale, y: wall.arcMidY / canvasScale } : null
    ), [canvasScale, isArc, wall.arcMidX, wall.arcMidY]);

    const wallDistLogical = getDistance({ x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 });
    const wallDistPx = getDistance(p1, p2);
    const angle = getAngle(p1, p2);
    const logicalThicknessPx = (wall.thickness || DEFAULT_WALL_THICKNESS) / canvasScale;
    const thicknessPx = Math.max(1 / stageScale, logicalThicknessPx);

    // Generate arc points (quadratic bezier approximation with 32 segments)
    const arcPoints = useMemo(() => (isArc ? (() => {
        const pts = [];
        const steps = 32;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const invT = 1 - t;
            const x = invT * invT * p1.x + 2 * invT * t * arcMid.x + t * t * p2.x;
            const y = invT * invT * p1.y + 2 * invT * t * arcMid.y + t * t * p2.y;
            pts.push(x, y);
        }
        return pts;
    })() : null), [arcMid, isArc, p1, p2]);

    const segments = useMemo(() => {
        if (openings.length === 0) return [[p1.x, p1.y, p2.x, p2.y]];
        const sortedOpenings = [...openings].sort((a, b) => a.offset - b.offset);
        const result = [];
        let startOffsetPx = 0;
        sortedOpenings.forEach(op => {
            const opOffsetPx = op.offset / canvasScale;
            if (opOffsetPx > startOffsetPx) {
                const segStart = getPointAtOffset(p1, p2, startOffsetPx);
                const segEnd = getPointAtOffset(p1, p2, opOffsetPx);
                result.push([segStart.x, segStart.y, segEnd.x, segEnd.y]);
            }
            startOffsetPx = opOffsetPx + (op.width / canvasScale);
        });
        if (startOffsetPx < wallDistPx) {
            const segStart = getPointAtOffset(p1, p2, startOffsetPx);
            result.push([segStart.x, segStart.y, p2.x, p2.y]);
        }
        return result;
    }, [canvasScale, openings, p1, p2, wallDistPx]);

    const lengthDisplay = formatValue(wallDistLogical, unit, showDual);

    const roughSegments = useMemo(() => {
        if (!roughMode) return [];
        return segments.map((pts, index) => getRoughLinePath(pts[0], pts[1], pts[2], pts[3], {
            seed: getStableRoughSeed(`${wall.id}:${index}`)
        }));
    }, [roughMode, segments, wall.id]);

    return (
        <Group
            draggable={interactive && isSelected}
            onClick={(e) => { if (!interactive) return; e.cancelBubble = true; onSelect(wall.id); }}
            onDragEnd={(e) => {
                if (!interactive || !isSelected || !onWallDragEnd) return;
                const dx = e.target.x() * canvasScale;
                const dy = e.target.y() * canvasScale;
                onWallDragEnd(wall.id, dx, dy);
                e.target.position({ x: 0, y: 0 });
            }}
        >
            {isArc ? (
                <>
                    <Line points={arcPoints} stroke={isSelected ? theme.wallSelected : theme.wall} strokeWidth={thicknessPx} lineCap="round" lineJoin="round" />
                    <Line points={arcPoints} stroke="transparent" strokeWidth={30} />
                </>
            ) : (
                <>
                    {segments.map((points, i) => (
                        roughMode ? (
                            <Path key={i} data={roughSegments[i]} stroke={isSelected ? theme.wallSelected : theme.wall} strokeWidth={thicknessPx} />
                        ) : (
                            <Line key={i} points={points} stroke={isSelected ? theme.wallSelected : theme.wall} strokeWidth={thicknessPx} lineCap="square" />
                        )
                    ))}
                    <Line points={[p1.x, p1.y, p2.x, p2.y]} stroke="transparent" strokeWidth={30} />
                </>
            )}
            {activeLabelPosition !== 'hidden' && (
                <Group x={(p1.x + p2.x) / 2} y={(p1.y + p2.y) / 2} rotation={angle > 90 || angle < -90 ? angle + 180 : angle}>
                    <Rect fill="rgba(15, 23, 42, 0.8)" width={(lengthDisplay.length * 7) / stageScale} height={18 / stageScale} cornerRadius={4 / stageScale} offsetX={(lengthDisplay.length * 3.5) / stageScale} offsetY={activeLabelPosition === 'inside' ? 25 / stageScale : activeLabelPosition === 'outside' ? -7 / stageScale : 9 / stageScale} />
                    <Text text={lengthDisplay} fontSize={10 / stageScale} fill={theme.accent} width={(lengthDisplay.length * 7) / stageScale} align="center" offsetX={(lengthDisplay.length * 3.5) / stageScale} offsetY={activeLabelPosition === 'inside' ? 22 / stageScale : activeLabelPosition === 'outside' ? -10 / stageScale : 6 / stageScale} fontStyle="bold" />
                </Group>
            )}
            {isSelected && interactive && (
                <>
                    <Circle x={p1.x} y={p1.y} radius={6 / stageScale} fill={theme.wallSelected} stroke={theme.bg} strokeWidth={1 / stageScale} draggable
                        onDragMove={(e) => {
                            e.cancelBubble = true;
                            const x = e.target.x() * canvasScale;
                            const y = e.target.y() * canvasScale;
                            if (onEndpointDrag) onEndpointDrag(wall.id, 'p1', x, y);
                        }}
                        onDragEnd={(e) => { e.cancelBubble = true; e.target.x(p1.x); e.target.y(p1.y); }}
                    />
                    <Circle x={p2.x} y={p2.y} radius={6 / stageScale} fill={theme.wallSelected} stroke={theme.bg} strokeWidth={1 / stageScale} draggable
                        onDragMove={(e) => {
                            e.cancelBubble = true;
                            const x = e.target.x() * canvasScale;
                            const y = e.target.y() * canvasScale;
                            if (onEndpointDrag) onEndpointDrag(wall.id, 'p2', x, y);
                        }}
                        onDragEnd={(e) => { e.cancelBubble = true; e.target.x(p2.x); e.target.y(p2.y); }}
                    />
                </>
            )}
            {isSelected && !interactive && (
                <>
                    <Circle x={p1.x} y={p1.y} radius={4} fill={theme.wallSelected} />
                    <Circle x={p2.x} y={p2.y} radius={4} fill={theme.wallSelected} />
                </>
            )}
        </Group>
    );
});

export const WallLayer = memo(() => {
    const walls = useProjectStore(state => state.walls);
    const openings = useProjectStore(state => state.openings);
    const moveWallEndpoint = useProjectStore(state => state.moveWallEndpoint);
    const moveWall = useProjectStore(state => state.moveWall);
    const updateOpening = useProjectStore(state => state.updateOpening);

    const canvasScale = useEditorStore(state => state.canvasScale);
    const stageScale = useEditorStore(state => state.stageScale);
    const wallLabelPosition = useEditorStore(state => state.wallLabelPosition);
    const themeName = useEditorStore(state => state.themeName);
    const unit = useEditorStore(state => state.unit);
    const showDual = useEditorStore(state => state.showDual);
    const selectedId = useEditorStore(state => state.selectedId);
    const setSelectedId = useEditorStore(state => state.setSelectedId);
    const tool = useEditorStore(state => state.tool);
    const activeObject = useEditorStore(state => state.activeObject);
    const roughMode = useEditorStore(state => state.roughMode);
    const showWallDiagnostics = useEditorStore(state => state.showWallDiagnostics);

    const theme = THEMES[themeName];

    const openingsByWall = useMemo(() => openings.reduce((grouped, opening) => {
        if (!grouped[opening.wallId]) {
            grouped[opening.wallId] = [];
        }
        grouped[opening.wallId].push(opening);
        return grouped;
    }, {}), [openings]);

    const wallById = useMemo(() => Object.fromEntries(walls.map((wall) => [wall.id, wall])), [walls]);

    const diagnostics = useMemo(() => {
        if (!showWallDiagnostics || walls.length === 0) return [];
        const points = new Map();

        const register = (x, y) => {
            const key = `${Math.round(x)}:${Math.round(y)}`;
            const existing = points.get(key);
            if (existing) {
                existing.count += 1;
                return;
            }
            points.set(key, { x, y, count: 1 });
        };

        walls.forEach((wall) => {
            register(wall.x1, wall.y1);
            register(wall.x2, wall.y2);
        });

        return Array.from(points.values());
    }, [showWallDiagnostics, walls]);

    const handleEndpointDrag = useCallback((wallId, endpoint, newX, newY) => {
        moveWallEndpoint(wallId, endpoint, newX, newY);
    }, [moveWallEndpoint]);

    const handleOpeningDragEnd = useCallback((id, wall, px, py) => {
        if (!wall) return;
        const newOffset = getProjectedDistance({ x: px, y: py }, { x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 });
        updateOpening(id, { offset: newOffset });
    }, [updateOpening]);

    return (
        <Group>
            {walls.map(w => (
                <Wall
                    key={w.id}
                    wall={w}
                    canvasScale={canvasScale}
                    stageScale={stageScale}
                    theme={theme}
                    unit={unit}
                    showDual={showDual}
                    isSelected={selectedId === w.id}
                    onSelect={setSelectedId}
                    openings={openingsByWall[w.id] || []}
                    interactive={tool === 'select'}
                    roughMode={roughMode}
                    wallLabelPosition={wallLabelPosition}
                    onEndpointDrag={handleEndpointDrag}
                    onWallDragEnd={moveWall}
                />
            ))}
            {openings.map(o => {
                const wall = wallById[o.wallId];
                return (
                    <Opening
                        key={o.id}
                        opening={o}
                        wall={wall}
                        canvasScale={canvasScale}
                        theme={theme}
                        isSelected={selectedId === o.id}
                        onSelect={setSelectedId}
                        interactive={tool === 'select'}
                        roughMode={roughMode}
                        onDragEnd={(id, px, py) => handleOpeningDragEnd(id, wall, px, py)}
                    />
                );
            })}
            {activeObject && tool === 'wall' && (
                <Wall
                    wall={activeObject}
                    canvasScale={canvasScale}
                    stageScale={stageScale}
                    theme={theme}
                    unit={unit}
                    showDual={showDual}
                    isSelected
                    interactive={false}
                    roughMode={roughMode}
                    wallLabelPosition={wallLabelPosition}
                />
            )}
            {activeObject && tool === 'arc_wall' && (
                <Wall
                    wall={activeObject}
                    canvasScale={canvasScale}
                    stageScale={stageScale}
                    theme={theme}
                    unit={unit}
                    showDual={showDual}
                    isSelected
                    interactive={false}
                    roughMode={roughMode}
                    wallLabelPosition={wallLabelPosition}
                />
            )}
            {diagnostics.map((point, index) => {
                const isJunction = point.count > 1;
                return (
                    <Group key={`diag-${index}`} x={point.x / canvasScale} y={point.y / canvasScale} listening={false}>
                        <Circle
                            radius={isJunction ? (7 / stageScale) : (5 / stageScale)}
                            fill={isJunction ? '#f97316' : '#22c55e'}
                            opacity={0.85}
                            stroke={theme.bg}
                            strokeWidth={1 / stageScale}
                        />
                        {isJunction && (
                            <Text
                                text={String(point.count)}
                                fontSize={8 / stageScale}
                                fill="#ffffff"
                                align="center"
                                verticalAlign="middle"
                                width={14 / stageScale}
                                height={12 / stageScale}
                                offsetX={7 / stageScale}
                                offsetY={6 / stageScale}
                            />
                        )}
                    </Group>
                );
            })}
        </Group>
    );
});
