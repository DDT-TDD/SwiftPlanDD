import { useMemo } from 'react';
import { THEMES } from '../../utils/constants';
import { useEditorStore } from '../../store/useEditorStore';

const RULER_SIZE = 24;

export const Rulers = ({ width, height }) => {
    const themeName = useEditorStore(state => state.themeName);
    const canvasScale = useEditorStore(state => state.canvasScale);
    const stageScale = useEditorStore(state => state.stageScale);
    const stagePos = useEditorStore(state => state.stagePos);
    const showRulers = useEditorStore(state => state.showRulers);
    const theme = THEMES[themeName];

    const pxPerMm = stageScale / canvasScale;

    // Choose nice tick intervals based on zoom
    const tickInterval = useMemo(() => {
        const pxPer100mm = pxPerMm * 100;
        if (pxPer100mm > 200) return 100;     // every 100mm 
        if (pxPer100mm > 80) return 250;      // every 250mm
        if (pxPer100mm > 40) return 500;      // every 500mm
        if (pxPer100mm > 20) return 1000;     // every 1000mm (1m)
        if (pxPer100mm > 8) return 2500;      // every 2.5m
        return 5000;                           // every 5m
    }, [pxPerMm]);

    // Generate horizontal ticks (top ruler)
    const hTicks = useMemo(() => {
        const ticks = [];
        const startMm = Math.floor((-stagePos.x / pxPerMm) / tickInterval) * tickInterval;
        const endMm = startMm + (width / pxPerMm) + tickInterval;
        for (let mm = startMm; mm <= endMm; mm += tickInterval) {
            const px = mm * pxPerMm + stagePos.x;
            if (px >= 0 && px <= width) {
                ticks.push({ px, label: mm >= 1000 ? `${(mm / 1000).toFixed(mm % 1000 === 0 ? 0 : 1)}m` : `${mm}` });
            }
        }
        return ticks;
    }, [stagePos.x, pxPerMm, tickInterval, width]);

    // Generate vertical ticks (left ruler)
    const vTicks = useMemo(() => {
        const ticks = [];
        const startMm = Math.floor((-stagePos.y / pxPerMm) / tickInterval) * tickInterval;
        const endMm = startMm + (height / pxPerMm) + tickInterval;
        for (let mm = startMm; mm <= endMm; mm += tickInterval) {
            const px = mm * pxPerMm + stagePos.y;
            if (px >= 0 && px <= height) {
                ticks.push({ px, label: mm >= 1000 ? `${(mm / 1000).toFixed(mm % 1000 === 0 ? 0 : 1)}m` : `${mm}` });
            }
        }
        return ticks;
    }, [stagePos.y, pxPerMm, tickInterval, height]);

    if (!showRulers) return null;

    const bg = themeName === 'light' ? '#f1f5f9' : '#1e293b';
    const borderColor = theme.grid;

    return (
        <>
            {/* Top (horizontal) ruler */}
            <div style={{
                position: 'absolute', top: 0, left: RULER_SIZE, right: 0, height: RULER_SIZE,
                background: bg, borderBottom: `1px solid ${borderColor}`, overflow: 'hidden',
                zIndex: 5, pointerEvents: 'none', userSelect: 'none'
            }}>
                {hTicks.map((t, i) => (
                    <div key={i} style={{ position: 'absolute', left: t.px, top: 0, height: '100%' }}>
                        <div style={{ position: 'absolute', left: 0, bottom: 0, width: '1px', height: '8px', background: theme.dim }} />
                        <span style={{ position: 'absolute', left: '3px', top: '2px', fontSize: '9px', color: theme.dim, whiteSpace: 'nowrap' }}>{t.label}</span>
                    </div>
                ))}
            </div>

            {/* Left (vertical) ruler */}
            <div style={{
                position: 'absolute', top: RULER_SIZE, left: 0, bottom: 0, width: RULER_SIZE,
                background: bg, borderRight: `1px solid ${borderColor}`, overflow: 'hidden',
                zIndex: 5, pointerEvents: 'none', userSelect: 'none'
            }}>
                {vTicks.map((t, i) => (
                    <div key={i} style={{ position: 'absolute', top: t.px, left: 0, width: '100%' }}>
                        <div style={{ position: 'absolute', right: 0, top: 0, height: '1px', width: '8px', background: theme.dim }} />
                        <span style={{
                            position: 'absolute', top: '3px', left: '2px', fontSize: '9px', color: theme.dim,
                            whiteSpace: 'nowrap', writingMode: 'vertical-lr', transform: 'rotate(180deg)',
                            transformOrigin: 'center center'
                        }}>{t.label}</span>
                    </div>
                ))}
            </div>

            {/* Corner square */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: RULER_SIZE, height: RULER_SIZE,
                background: bg, borderBottom: `1px solid ${borderColor}`, borderRight: `1px solid ${borderColor}`,
                zIndex: 6
            }} />
        </>
    );
};

export const RULER_SIZE_PX = RULER_SIZE;
