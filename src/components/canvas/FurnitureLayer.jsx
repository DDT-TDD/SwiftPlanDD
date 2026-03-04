import { useMemo, useRef, useState, useEffect } from 'react';
import { Group, Rect, Text, Path, Line, Circle, Ellipse, Transformer } from 'react-konva';
import { THEMES } from '../../utils/constants';
import { formatValue } from '../../utils/units';
import { getRoughRectPath } from '../../utils/roughUtils';
import { useProjectStore } from '../../store/useProjectStore';
import { useEditorStore } from '../../store/useEditorStore';

const ROTATION_SNAPS = [
    -180, -165, -150, -135, -120, -105, -90, -75, -60, -45, -30, -15,
    0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180
];

const Furniture = ({ item, onSelect, isSelected, canvasScale, onDragStart, onDragEnd, onTransformEnd, theme, unit, interactive = true, roughMode = false, themeName }) => {
    const [isHovered, setIsHovered] = useState(false);
    const nodeRef = useRef(null);
    const trRef = useRef(null);

    const w = item.width / canvasScale;
    const h = item.height / canvasScale;
    const clearance = item.clearance || 0;
    const clPx = clearance / canvasScale;
    const dimText = `${formatValue(item.width, unit)} x ${formatValue(item.height, unit)}`;

    const roughRect = useMemo(() => roughMode ? getRoughRectPath(0, 0, w, h) : null, [roughMode, w, h]);

    useEffect(() => {
        if (isSelected && trRef.current && nodeRef.current) {
            trRef.current.nodes([nodeRef.current]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected]);

    return (
        <Group
            ref={nodeRef}
            draggable={interactive}
            x={item.x / canvasScale} y={item.y / canvasScale} rotation={item.rotation || 0}
            onClick={(e) => {
                if (!interactive) return;
                e.cancelBubble = true;
                onSelect(item.id, e.evt.shiftKey);
            }}
            onDragStart={(e) => onDragStart(item.id, e.target.x() * canvasScale, e.target.y() * canvasScale)}
            onDragEnd={(e) => onDragEnd(item.id, e.target.x() * canvasScale, e.target.y() * canvasScale)}
            onTransformEnd={(e) => {
                if (!interactive) return;
                const node = e.target;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();

                node.scaleX(1);
                node.scaleY(1);

                onTransformEnd(item.id, {
                    x: node.x() * canvasScale,
                    y: node.y() * canvasScale,
                    width: Math.max(100, Math.round((node.width() * scaleX) * canvasScale)),
                    height: Math.max(100, Math.round((node.height() * scaleY) * canvasScale)),
                    rotation: Math.round(node.rotation())
                });
            }}
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

            {isSelected && interactive && (
                <Transformer
                    ref={trRef}
                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                    rotateEnabled
                    rotationSnaps={ROTATION_SNAPS}
                    borderStroke={theme.accent}
                    anchorStroke={theme.accent}
                    anchorFill={themeName === 'light' ? '#fff' : '#0f172a'}
                    anchorSize={7}
                    borderDash={[4, 4]}
                />
            )}
        </Group>
    );
};

export const FurnitureLayer = () => {
    const furniture = useProjectStore(state => state.furniture);
    const updateFurniture = useProjectStore(state => state.updateFurniture);
    const updateFurnitureMany = useProjectStore(state => state.updateFurnitureMany);

    const canvasScale = useEditorStore(state => state.canvasScale);
    const themeName = useEditorStore(state => state.themeName);
    const unit = useEditorStore(state => state.unit);
    const selectedId = useEditorStore(state => state.selectedId);
    const selectedIds = useEditorStore(state => state.selectedIds);
    const setSelectedId = useEditorStore(state => state.setSelectedId);
    const toggleSelectedId = useEditorStore(state => state.toggleSelectedId);
    const setSelectedIds = useEditorStore(state => state.setSelectedIds);
    const tool = useEditorStore(state => state.tool);
    const roughMode = useEditorStore(state => state.roughMode);

    const theme = THEMES[themeName];
    const dragStartRef = useRef({});

    const handleDragStart = (id, x, y) => {
        dragStartRef.current[id] = { x, y };
    };

    const handleDragEnd = (id, x, y) => {
        const currentSelectedIds = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
        const isGroupDrag = currentSelectedIds.length > 1 && currentSelectedIds.includes(id);

        if (!isGroupDrag) {
            updateFurniture(id, { x, y });
            return;
        }

        const sourceStart = dragStartRef.current[id] || furniture.find(item => item.id === id);
        const dx = x - sourceStart.x;
        const dy = y - sourceStart.y;

        const updates = furniture
            .filter(item => currentSelectedIds.includes(item.id))
            .map(item => ({ id: item.id, updates: { x: item.x + dx, y: item.y + dy } }));

        updateFurnitureMany(updates);
        dragStartRef.current = {};
    };

    return (
        <Group>
            {furniture.map(f => (
                <Furniture
                    key={f.id}
                    item={f}
                    canvasScale={canvasScale}
                    theme={theme}
                    unit={unit}
                    isSelected={selectedIds.includes(f.id) || selectedId === f.id}
                    onSelect={(id, additive) => {
                        if (additive) {
                            toggleSelectedId(id);
                        } else {
                            setSelectedId(id);
                            setSelectedIds([id]);
                        }
                    }}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onTransformEnd={(id, updates) => updateFurniture(id, updates)}
                    interactive={tool === 'select'}
                    roughMode={roughMode}
                    themeName={themeName}
                />
            ))}
        </Group>
    );
};
