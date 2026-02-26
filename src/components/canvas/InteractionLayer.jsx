import { Group, Circle, Image as KonvaImage } from 'react-konva';
import { THEMES } from '../../utils/constants';
import { useEditorStore } from '../../store/useEditorStore';
import useImage from 'use-image';

export const InteractionLayer = () => {
    const tool = useEditorStore(state => state.tool);
    const mousePos = useEditorStore(state => state.mousePos);
    const themeName = useEditorStore(state => state.themeName);
    const bgImageFile = useEditorStore(state => state.bgImageFile);
    const theme = THEMES[themeName];

    const [bgImage] = useImage(bgImageFile);

    return (
        <Group>
            {bgImage && <KonvaImage image={bgImage} opacity={0.3} />}

            {tool !== 'select' && (
                <Circle
                    x={mousePos.x}
                    y={mousePos.y}
                    radius={mousePos.snapType === 'point' ? 6 : 3}
                    fill={mousePos.snapType === 'point' ? theme.accent : theme.dim}
                    stroke={theme.bg}
                    strokeWidth={1}
                />
            )}
        </Group>
    );
};
