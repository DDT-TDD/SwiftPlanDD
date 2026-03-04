import { Group, Circle, Image as KonvaImage, Line } from 'react-konva';
import { THEMES } from '../../utils/constants';
import { useEditorStore } from '../../store/useEditorStore';
import useImage from 'use-image';

export const InteractionLayer = () => {
    const tool = useEditorStore(state => state.tool);
    const mousePos = useEditorStore(state => state.mousePos);
    const canvasScale = useEditorStore(state => state.canvasScale);
    const themeName = useEditorStore(state => state.themeName);
    const bgImageFile = useEditorStore(state => state.bgImageFile);
    const bgOpacity = useEditorStore(state => state.bgOpacity) ?? 0.3;
    const bgScale = useEditorStore(state => state.bgScale) ?? 1;
    const bgOffsetX = useEditorStore(state => state.bgOffsetX) ?? 0;
    const bgOffsetY = useEditorStore(state => state.bgOffsetY) ?? 0;
    const theme = THEMES[themeName];

    const [bgImage] = useImage(bgImageFile);

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
                    opacity={bgOpacity}
                    scaleX={bgScale}
                    scaleY={bgScale}
                    x={bgOffsetX / canvasScale}
                    y={bgOffsetY / canvasScale}
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
};
