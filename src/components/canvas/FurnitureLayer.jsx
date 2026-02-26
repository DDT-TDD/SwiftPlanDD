import { useMemo, useState } from 'react';
import { Group, Rect, Text, Path, Line, Circle, Ellipse } from 'react-konva';
import { THEMES } from '../../utils/constants';
import { formatValue } from '../../utils/units';
import { getRoughRectPath } from '../../utils/roughUtils';
import { useProjectStore } from '../../store/useProjectStore';
import { useEditorStore } from '../../store/useEditorStore';

const Furniture = ({ item, onSelect, isSelected, canvasScale, onDragEnd, theme, unit, interactive = true, roughMode = false, themeName }) => {
    const [isHovered, setIsHovered] = useState(false);

    const w = item.width / canvasScale;
    const h = item.height / canvasScale;
    const clearance = item.clearance || 0;
    const clPx = clearance / canvasScale;
    const dimText = `${formatValue(item.width, unit)} x ${formatValue(item.height, unit)}`;

    const roughRect = useMemo(() => roughMode ? getRoughRectPath(0, 0, w, h) : null, [roughMode, w, h]);

    return (
        <Group
            draggable={interactive}
            x={item.x / canvasScale} y={item.y / canvasScale} rotation={item.rotation || 0}
            onClick={(e) => { if (!interactive) return; e.cancelBubble = true; onSelect(item.id); }}
            onDragEnd={(e) => onDragEnd(item.id, e.target.x() * canvasScale, e.target.y() * canvasScale)}
            onMouseEnter={(e) => {
                if (interactive) {
                    setIsHovered(true);
                    e.target.getStage().container().style.cursor = 'pointer';
                }
            }}
            onMouseLeave={(e) => {
                if (interactive) {
                    setIsHovered(false);
                    e.target.getStage().container().style.cursor = 'default';
                }
            }}
        >
            {(isSelected || item.showClearance) && (
                <Rect
                    x={-clPx} y={-clPx}
                    width={w + clPx * 2} height={h + clPx * 2}
                    stroke={theme.dim} strokeWidth={1} dash={[5, 5]} opacity={0.5}
                />
            )}
            {roughMode ? (
                <Path
                    data={roughRect}
                    fill={theme.furniture}
                    stroke={isSelected ? theme.accent : theme.furnitureStroke} strokeWidth={2}
                />
            ) : (
                <Group>
                    <Rect
                        width={w} height={h}
                        fill={theme.furniture}
                        stroke={isSelected ? theme.accent : theme.furnitureStroke} strokeWidth={2}
                        cornerRadius={2}
                    />
                    {item.name.includes('Bed') && (
                        <Group>
                            <Rect x={w * 0.1} y={h * 0.1} width={w * 0.35} height={h * 0.2} stroke={theme.furnitureStroke} strokeWidth={1} cornerRadius={2} />
                            <Rect x={w * 0.55} y={h * 0.1} width={w * 0.35} height={h * 0.2} stroke={theme.furnitureStroke} strokeWidth={1} cornerRadius={2} />
                            <Line points={[0, h * 0.4, w, h * 0.4]} stroke={theme.furnitureStroke} strokeWidth={1} />
                        </Group>
                    )}
                    {item.name.includes('Sofa') && (
                        <Path data={`M 0,${h} L 0,0 L ${w},0 L ${w},${h} M ${w * 0.1},${h} L ${w * 0.1},${h * 0.2} L ${w * 0.9},${h * 0.2} L ${w * 0.9},${h}`} stroke={theme.furnitureStroke} strokeWidth={1} />
                    )}
                    {item.name.includes('Table') && (
                        <Rect x={w * 0.05} y={h * 0.05} width={w * 0.9} height={h * 0.9} stroke={theme.furnitureStroke} strokeWidth={1} />
                    )}
                    {item.name.includes('Bath') && (
                        <Rect x={w * 0.05} y={h * 0.05} width={w * 0.9} height={h * 0.9} stroke={theme.furnitureStroke} strokeWidth={1} cornerRadius={Math.min(w, h) * 0.4} />
                    )}
                    {item.name.includes('Shower') && (
                        <Group>
                            <Line points={[0, 0, w, h]} stroke={theme.furnitureStroke} strokeWidth={1} />
                            <Line points={[w, 0, 0, h]} stroke={theme.furnitureStroke} strokeWidth={1} />
                        </Group>
                    )}
                    {item.name.includes('Toilet') && (
                        <Group>
                            <Rect x={w * 0.2} y={0} width={w * 0.6} height={h * 0.3} stroke={theme.furnitureStroke} strokeWidth={1} />
                            <Ellipse x={w / 2} y={h * 0.65} radiusX={w * 0.25} radiusY={h * 0.3} stroke={theme.furnitureStroke} strokeWidth={1} />
                        </Group>
                    )}
                    {item.name.includes('TV') && (
                        <Rect x={w * 0.05} y={h * 0.4} width={w * 0.9} height={h * 0.2} stroke={theme.furnitureStroke} strokeWidth={1} />
                    )}
                    {item.name.includes('Stove') && (
                        <Group>
                            <Circle x={w * 0.25} y={h * 0.25} radius={Math.min(w, h) * 0.15} stroke={theme.furnitureStroke} strokeWidth={1} />
                            <Circle x={w * 0.75} y={h * 0.25} radius={Math.min(w, h) * 0.15} stroke={theme.furnitureStroke} strokeWidth={1} />
                            <Circle x={w * 0.25} y={h * 0.75} radius={Math.min(w, h) * 0.15} stroke={theme.furnitureStroke} strokeWidth={1} />
                            <Circle x={w * 0.75} y={h * 0.75} radius={Math.min(w, h) * 0.15} stroke={theme.furnitureStroke} strokeWidth={1} />
                        </Group>
                    )}
                </Group>
            )}
            {(isHovered || isSelected) && (
                <Group y={-15}>
                    <Rect
                        fill={themeName === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(15,23,42,0.9)'}
                        width={(item.name.length * 6)} height={14} cornerRadius={2}
                        offsetX={(item.name.length * 3) - (w / 2)}
                    />
                    <Text
                        text={item.name} fontSize={10} fill={theme.text}
                        align="center" width={item.name.length * 6}
                        offsetX={(item.name.length * 3) - (w / 2)} y={2}
                    />
                </Group>
            )}
            {isSelected && (
                <Text
                    text={dimText}
                    fontSize={8} fill={theme.accent}
                    y={h + 5} width={w} align="center"
                />
            )}
        </Group>
    );
};

export const FurnitureLayer = () => {
    const furniture = useProjectStore(state => state.furniture);
    const updateFurniture = useProjectStore(state => state.updateFurniture);

    const canvasScale = useEditorStore(state => state.canvasScale);
    const themeName = useEditorStore(state => state.themeName);
    const unit = useEditorStore(state => state.unit);
    const selectedId = useEditorStore(state => state.selectedId);
    const setSelectedId = useEditorStore(state => state.setSelectedId);
    const tool = useEditorStore(state => state.tool);
    const roughMode = useEditorStore(state => state.roughMode);

    const theme = THEMES[themeName];

    return (
        <Group>
            {furniture.map(f => (
                <Furniture
                    key={f.id}
                    item={f}
                    canvasScale={canvasScale}
                    theme={theme}
                    unit={unit}
                    isSelected={selectedId === f.id}
                    onSelect={setSelectedId}
                    onDragEnd={(id, x, y) => updateFurniture(id, { x, y })}
                    interactive={tool === 'select'}
                    roughMode={roughMode}
                    themeName={themeName}
                />
            ))}
        </Group>
    );
};
