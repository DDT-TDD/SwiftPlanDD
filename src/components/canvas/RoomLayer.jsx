import { memo, useEffect, useState } from 'react';
import { Group, Line, Text, Path } from 'react-konva';
import { THEMES } from '../../utils/constants';
import { createPatternDataUrl } from '../../utils/geometry';
import { getRoughPolygonPath, getStableRoughSeed } from '../../utils/roughUtils';
import { useProjectStore } from '../../store/useProjectStore';
import { useEditorStore } from '../../store/useEditorStore';

export const RoomLayer = memo(() => {
    const rooms = useProjectStore(state => state.rooms);

    const themeName = useEditorStore(state => state.themeName);
    const selectedId = useEditorStore(state => state.selectedId);
    const setSelectedId = useEditorStore(state => state.setSelectedId);
    const tool = useEditorStore(state => state.tool);
    const activeObject = useEditorStore(state => state.activeObject);
    const mousePos = useEditorStore(state => state.mousePos);
    const stageScale = useEditorStore(state => state.stageScale);
    const canvasScale = useEditorStore(state => state.canvasScale);
    const roughMode = useEditorStore(state => state.roughMode);

    const theme = THEMES[themeName];
    const [patterns, setPatterns] = useState({ solid: null, diagonal: null, crosshatch: null, grid: null });

    useEffect(() => {
        let cancelled = false;

        const loadPattern = (type) => new Promise((resolve) => {
            const src = createPatternDataUrl(type, theme.dim);
            if (!src) {
                resolve(null);
                return;
            }

            const img = new window.Image();
            img.onload = () => resolve(cancelled ? null : img);
            img.onerror = () => resolve(null);
            img.src = src;
        });

        Promise.all([
            loadPattern('diagonal'),
            loadPattern('crosshatch'),
            loadPattern('grid')
        ]).then(([diagonal, crosshatch, grid]) => {
            if (!cancelled) {
                setPatterns({ solid: null, diagonal, crosshatch, grid });
            }
        });

        return () => {
            cancelled = true;
        };
    }, [theme.dim]);

    return (
        <Group>
            {activeObject && tool === 'room' && (
                <Line
                    points={activeObject.points.flatMap(p => [p.x / canvasScale, p.y / canvasScale]).concat([mousePos.x / canvasScale, mousePos.y / canvasScale])}
                    stroke={theme.accent}
                    strokeWidth={2}
                    dash={[5, 5]}
                />
            )}

            {rooms.map(room => {
                const scaledPoints = room.points.map(p => ({ x: p.x / canvasScale, y: p.y / canvasScale }));
                const flatPoints = scaledPoints.flatMap(p => [p.x, p.y]);
                const roughPath = roughMode ? getRoughPolygonPath(scaledPoints, { seed: getStableRoughSeed(room.id) }) : null;

                return (
                    <Group key={room.id} onClick={(e) => { if (tool === 'select') { e.cancelBubble = true; setSelectedId(room.id); } }}>
                        {roughMode ? (
                            <Path
                                data={roughPath}
                                fill={room.pattern === 'solid' || !room.pattern ? theme.furniture : undefined}
                                fillPatternImage={room.pattern && room.pattern !== 'solid' ? patterns[room.pattern] : undefined}
                                fillPatternRepeat="repeat"
                                stroke={selectedId === room.id ? theme.accent : theme.furnitureStroke}
                                strokeWidth={Math.max(1 / stageScale, selectedId === room.id ? 2 : 1)}
                            />
                        ) : (
                            <Line
                                points={flatPoints}
                                fill={room.pattern === 'solid' || !room.pattern ? theme.furniture : 'rgba(0,0,0,0.01)'}
                                fillPatternImage={room.pattern && room.pattern !== 'solid' ? patterns[room.pattern] : undefined}
                                fillPatternRepeat="repeat"
                                stroke={selectedId === room.id ? theme.accent : theme.furnitureStroke}
                                strokeWidth={Math.max(1 / stageScale, selectedId === room.id ? 2 : 1)}
                                closed
                            />
                        )}
                        {(() => {
                            const center = { x: 0, y: 0 };
                            if (scaledPoints.length > 0) {
                                for (let i = 0; i < scaledPoints.length; i++) {
                                    center.x += scaledPoints[i].x;
                                    center.y += scaledPoints[i].y;
                                }
                                center.x /= scaledPoints.length;
                                center.y /= scaledPoints.length;
                            }
                            // Clamp scale out so text doesn't become too tiny
                            const textScale = Math.min(stageScale, 1.5);
                            return (
                                <Group x={center.x} y={center.y}>
                                    {room.name && (
                                        <Text
                                            text={room.name}
                                            fill={selectedId === room.id ? theme.accent : theme.text} fontSize={14 / textScale} fontStyle="bold"
                                            align="center"
                                            y={-14 / textScale}
                                            width={400} offsetX={200}
                                        />
                                    )}
                                    <Text
                                        text={`${(room.area / 1000000).toFixed(2)}m²`}
                                        fill={selectedId === room.id ? theme.accent : theme.text} fontSize={11 / textScale}
                                        align="center"
                                        y={room.name ? (4 / textScale) : (-6 / textScale)}
                                        width={400} offsetX={200}
                                    />
                                </Group>
                            );
                        })()}
                    </Group>
                );
            })}
        </Group>
    );
});
