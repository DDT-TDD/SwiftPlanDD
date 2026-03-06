import { memo, useMemo } from 'react';
import { Group, Line, Rect, Text, Path } from 'react-konva';
import { getDistance, getAngle } from '../../utils/geometry';
import { THEMES } from '../../utils/constants';
import { formatValue } from '../../utils/units';
import { getRoughLinePath } from '../../utils/roughUtils';
import { useProjectStore } from '../../store/useProjectStore';
import { useEditorStore } from '../../store/useEditorStore';

const DimensionLine = memo(({ dim, canvasScale, theme, unit, showDual, isSelected, onSelect, interactive = true, roughMode = false }) => {
    const p1 = { x: dim.x1 / canvasScale, y: dim.y1 / canvasScale };
    const p2 = { x: dim.x2 / canvasScale, y: dim.y2 / canvasScale };
    const logicalDist = getDistance({ x: dim.x1, y: dim.y1 }, { x: dim.x2, y: dim.y2 });
    const angle = getAngle(p1, p2);
    const lengthDisplay = formatValue(logicalDist, unit, showDual);

    const tickSize = 8;
    const roughLine = useMemo(() => roughMode ? getRoughLinePath(p1.x, p1.y, p2.x, p2.y) : null, [roughMode, p1.x, p1.y, p2.x, p2.y]);

    return (
        <Group onClick={(e) => { if (!interactive) return; e.cancelBubble = true; onSelect(dim.id); }}>
            {roughMode ? (
                <Path data={roughLine} stroke={isSelected ? theme.accent : theme.dim} strokeWidth={1} />
            ) : (
                <Line points={[p1.x, p1.y, p2.x, p2.y]} stroke={isSelected ? theme.accent : theme.dim} strokeWidth={1} />
            )}

            <Group x={p1.x} y={p1.y} rotation={angle}>
                <Line points={[-tickSize, tickSize, tickSize, -tickSize]} stroke={isSelected ? theme.accent : theme.dim} strokeWidth={1} />
            </Group>
            <Group x={p2.x} y={p2.y} rotation={angle}>
                <Line points={[-tickSize, tickSize, tickSize, -tickSize]} stroke={isSelected ? theme.accent : theme.dim} strokeWidth={1} />
            </Group>

            <Group x={(p1.x + p2.x) / 2} y={(p1.y + p2.y) / 2} rotation={angle > 90 || angle < -90 ? angle + 180 : angle}>
                <Rect fill={theme.bg} width={lengthDisplay.length * 6 + 10} height={16} cornerRadius={2} offsetX={(lengthDisplay.length * 6 + 10) / 2} offsetY={8} />
                <Text text={lengthDisplay} fontSize={10} fill={isSelected ? theme.accent : theme.text} width={lengthDisplay.length * 6 + 10} align="center" offsetX={(lengthDisplay.length * 6 + 10) / 2} offsetY={4} />
            </Group>

            <Line points={[p1.x, p1.y, p2.x, p2.y]} stroke="transparent" strokeWidth={20} />
        </Group>
    );
});

export const AnnotationLayer = memo(() => {
    const dimensions = useProjectStore(state => state.dimensions);
    const annotations = useProjectStore(state => state.annotations);
    const updateAnnotation = useProjectStore(state => state.updateAnnotation);
    const walls = useProjectStore(state => state.walls);

    const canvasScale = useEditorStore(state => state.canvasScale);
    const themeName = useEditorStore(state => state.themeName);
    const unit = useEditorStore(state => state.unit);
    const showDual = useEditorStore(state => state.showDual);
    const selectedId = useEditorStore(state => state.selectedId);
    const setSelectedId = useEditorStore(state => state.setSelectedId);
    const tool = useEditorStore(state => state.tool);
    const activeObject = useEditorStore(state => state.activeObject);
    const showAutoDimensions = useEditorStore(state => state.showAutoDimensions);

    const roughMode = useEditorStore(state => state.roughMode);

    const theme = THEMES[themeName];

    return (
        <Group>
            {dimensions.map(d => (
                <DimensionLine
                    key={d.id}
                    dim={d}
                    canvasScale={canvasScale}
                    theme={theme}
                    unit={unit}
                    showDual={showDual}
                    isSelected={selectedId === d.id}
                    onSelect={setSelectedId}
                    interactive={tool === 'select'}
                    roughMode={roughMode}
                />
            ))}

            {activeObject && tool === 'measure' && (
                <DimensionLine
                    dim={activeObject}
                    canvasScale={canvasScale}
                    theme={theme}
                    unit={unit}
                    showDual={showDual}
                    isSelected
                    interactive={false}
                    roughMode={roughMode}
                />
            )}

            {/* Auto-dimension lines for walls */}
            {showAutoDimensions && walls.map(w => {
                // Offset dimension line parallel to the wall
                const dx = w.x2 - w.x1;
                const dy = w.y2 - w.y1;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len < 10) return null;
                const offset = (w.thickness || 200) + 150; // place outside wall
                const nx = -dy / len * offset;
                const ny = dx / len * offset;
                return (
                    <DimensionLine
                        key={`auto-dim-${w.id}`}
                        dim={{ id: `auto-${w.id}`, x1: w.x1 + nx, y1: w.y1 + ny, x2: w.x2 + nx, y2: w.y2 + ny }}
                        canvasScale={canvasScale}
                        theme={theme}
                        unit={unit}
                        showDual={showDual}
                        isSelected={false}
                        interactive={false}
                        roughMode={roughMode}
                    />
                );
            })}

            {/* Text annotations */}
            {annotations.map(ann => (
                <Group
                    key={ann.id}
                    x={ann.x / canvasScale}
                    y={ann.y / canvasScale}
                    rotation={ann.rotation || 0}
                    draggable={tool === 'select'}
                    onClick={(e) => { if (tool === 'select') { e.cancelBubble = true; setSelectedId(ann.id); } }}
                    onDblClick={() => {
                        if (tool !== 'select') return;
                        const newText = window.prompt('Edit annotation:', ann.text);
                        if (newText !== null && newText.trim()) {
                            updateAnnotation(ann.id, { text: newText.trim() });
                        }
                    }}
                    onDragEnd={(e) => {
                        if (tool !== 'select') return;
                        updateAnnotation(ann.id, {
                            x: e.target.x() * canvasScale,
                            y: e.target.y() * canvasScale
                        });
                    }}
                >
                    <Text
                        text={ann.text}
                        fontSize={ann.fontSize || 14}
                        fill={selectedId === ann.id ? theme.accent : (ann.color || theme.text)}
                        fontStyle={ann.fontStyle || 'normal'}
                    />
                    {/* Wider invisible hit area */}
                    <Rect
                        width={Math.max(80, (ann.text || '').length * (ann.fontSize || 14) * 0.6)}
                        height={(ann.fontSize || 14) + 6}
                        fill="transparent"
                        y={-3}
                    />
                </Group>
            ))}
        </Group>
    );
});
