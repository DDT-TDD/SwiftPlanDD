import { memo } from 'react';
import { Group, Circle, Image as KonvaImage, Line } from 'react-konva';
import { THEMES } from '../../utils/constants';
import { useEditorStore } from '../../store/useEditorStore';
import { useProjectStore } from '../../store/useProjectStore';
import useImage from 'use-image';

export const InteractionLayer = memo(() => {
    const tool = useEditorStore(state => state.tool);
    const mousePos = useEditorStore(state => state.mousePos);
    const canvasScale = useEditorStore(state => state.canvasScale);
    const themeName = useEditorStore(state => state.themeName);
    const tracing = useProjectStore(state => state.tracing);
    const globalTracing = useProjectStore(state => state.globalTracing);
    const theme = THEMES[themeName];
    const activeTracing = tracing || globalTracing;

    const [bgImage] = useImage(activeTracing?.imageSrc || null);

    // Snap type color coding: green=endpoint, blue=midpoint, orange=perpendicular, gray=grid
    const snapColor = mousePos.snapType === 'point' ? '#22c55e'
        : mousePos.snapType === 'midpoint' ? '#3b82f6'
        : mousePos.snapType === 'perpendicular' ? '#f97316'
        : theme.dim;

    const snapRadius = mousePos.snapType === 'grid' ? 3 : 6;

    const cx = mousePos.x / canvasScale;
    const cy = mousePos.y / canvasScale;
    const guideLen = 20;

    return (
        <Group>
            {bgImage && (
                <KonvaImage
                    image={bgImage}
                    opacity={activeTracing?.opacity ?? 0.3}
                    scaleX={activeTracing?.scale ?? 1}
                    scaleY={activeTracing?.scale ?? 1}
                    x={(activeTracing?.offsetX || 0) / canvasScale}
                    y={(activeTracing?.offsetY || 0) / canvasScale}
                />
            )}

            {tool !== 'select' && (
                <>
                    <Circle
                        x={cx}
                        y={cy}
                        radius={snapRadius}
                        fill={snapColor}
                        stroke={theme.bg}
                        strokeWidth={1}
                    />
                    {/* Crosshair guide lines for non-grid snaps */}
                    {mousePos.snapType && mousePos.snapType !== 'grid' && (
                        <>
                            <Line points={[cx - guideLen, cy, cx - 4, cy]} stroke={snapColor} strokeWidth={0.5} dash={[3, 3]} opacity={0.6} />
                            <Line points={[cx + 4, cy, cx + guideLen, cy]} stroke={snapColor} strokeWidth={0.5} dash={[3, 3]} opacity={0.6} />
                            <Line points={[cx, cy - guideLen, cx, cy - 4]} stroke={snapColor} strokeWidth={0.5} dash={[3, 3]} opacity={0.6} />
                            <Line points={[cx, cy + 4, cx, cy + guideLen]} stroke={snapColor} strokeWidth={0.5} dash={[3, 3]} opacity={0.6} />
                        </>
                    )}
                </>
            )}
        </Group>
    );
});
