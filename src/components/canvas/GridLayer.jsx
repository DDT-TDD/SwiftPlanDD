import { memo, useMemo } from 'react';
import { Group, Line } from 'react-konva';
import { THEMES } from '../../utils/constants';
import { useEditorStore } from '../../store/useEditorStore';

export const GridLayer = memo(({ width, height }) => {
    const showGrid = useEditorStore(state => state.showGrid);
    const gridSpacing = useEditorStore(state => state.gridSpacing);
    const canvasScale = useEditorStore(state => state.canvasScale);
    const stageScale = useEditorStore(state => state.stageScale);
    const stagePos = useEditorStore(state => state.stagePos);
    const themeName = useEditorStore(state => state.themeName);
    const theme = THEMES[themeName];

    const lines = useMemo(() => {
        if (!showGrid || width <= 0 || height <= 0) return { vertical: [], horizontal: [] };

        const spacingPx = gridSpacing / canvasScale;
        if (!Number.isFinite(spacingPx) || spacingPx <= 0) return { vertical: [], horizontal: [] };

        const minX = -stagePos.x / stageScale;
        const maxX = (width - stagePos.x) / stageScale;
        const minY = -stagePos.y / stageScale;
        const maxY = (height - stagePos.y) / stageScale;

        const startX = Math.floor(minX / spacingPx) * spacingPx;
        const startY = Math.floor(minY / spacingPx) * spacingPx;

        const vertical = [];
        const horizontal = [];

        for (let x = startX; x <= maxX + spacingPx && vertical.length < 400; x += spacingPx) {
            vertical.push(x);
        }

        for (let y = startY; y <= maxY + spacingPx && horizontal.length < 400; y += spacingPx) {
            horizontal.push(y);
        }

        return { vertical, horizontal };
    }, [canvasScale, gridSpacing, height, showGrid, stagePos.x, stagePos.y, stageScale, width]);

    if (!showGrid) return null;

    return (
        <Group listening={false}>
            {lines.vertical.map((x) => (
                <Line
                    key={`grid-v-${x}`}
                    points={[x, lines.horizontal[0] ?? 0, x, lines.horizontal[lines.horizontal.length - 1] ?? height]}
                    stroke={theme.grid}
                    strokeWidth={1 / stageScale}
                />
            ))}
            {lines.horizontal.map((y) => (
                <Line
                    key={`grid-h-${y}`}
                    points={[lines.vertical[0] ?? 0, y, lines.vertical[lines.vertical.length - 1] ?? width, y]}
                    stroke={theme.grid}
                    strokeWidth={1 / stageScale}
                />
            ))}
        </Group>
    );
});