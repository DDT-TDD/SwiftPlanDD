import { memo, useEffect, useMemo, useRef } from 'react';
import { THEMES } from '../../utils/constants';
import { useEditorStore } from '../../store/useEditorStore';

const RULER_SIZE = 24;

export const Rulers = memo(({ width, height }) => {
    const themeName = useEditorStore(state => state.themeName);
    const canvasScale = useEditorStore(state => state.canvasScale);
    const stageScale = useEditorStore(state => state.stageScale);
    const stagePos = useEditorStore(state => state.stagePos);
    const showRulers = useEditorStore(state => state.showRulers);
    const theme = THEMES[themeName];
    const topCanvasRef = useRef(null);
    const leftCanvasRef = useRef(null);

    const pxPerMm = stageScale / canvasScale;

    const tickInterval = useMemo(() => {
        const pxPer100mm = pxPerMm * 100;
        if (pxPer100mm > 200) return 100;
        if (pxPer100mm > 80) return 250;
        if (pxPer100mm > 40) return 500;
        if (pxPer100mm > 20) return 1000;
        if (pxPer100mm > 8) return 2500;
        return 5000;
    }, [pxPerMm]);

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

    const bg = themeName === 'light' ? '#f1f5f9' : '#1e293b';
    const borderColor = theme.grid;

    useEffect(() => {
        const canvas = topCanvasRef.current;
        if (!canvas || !showRulers) return;
        canvas.width = Math.max(1, width - RULER_SIZE);
        canvas.height = RULER_SIZE;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = borderColor;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 0.5);
        ctx.lineTo(canvas.width, canvas.height - 0.5);
        ctx.stroke();
        ctx.fillStyle = theme.dim;
        ctx.font = '9px sans-serif';
        ctx.textBaseline = 'top';

        hTicks.forEach((tick) => {
            const x = tick.px - RULER_SIZE;
            if (x < 0 || x > canvas.width) return;
            ctx.fillRect(x, canvas.height - 8, 1, 8);
            ctx.fillText(tick.label, x + 3, 2);
        });
    }, [bg, borderColor, hTicks, showRulers, theme.dim, width]);

    useEffect(() => {
        const canvas = leftCanvasRef.current;
        if (!canvas || !showRulers) return;
        canvas.width = RULER_SIZE;
        canvas.height = Math.max(1, height - RULER_SIZE);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = borderColor;
        ctx.beginPath();
        ctx.moveTo(canvas.width - 0.5, 0);
        ctx.lineTo(canvas.width - 0.5, canvas.height);
        ctx.stroke();
        ctx.fillStyle = theme.dim;
        ctx.font = '9px sans-serif';
        ctx.textBaseline = 'top';

        vTicks.forEach((tick) => {
            const y = tick.px - RULER_SIZE;
            if (y < 0 || y > canvas.height) return;
            ctx.fillRect(canvas.width - 8, y, 8, 1);
            ctx.save();
            ctx.translate(2, y + 3);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(tick.label, 0, 0);
            ctx.restore();
        });
    }, [bg, borderColor, height, showRulers, theme.dim, vTicks]);

    if (!showRulers) return null;

    return (
        <>
            <canvas
                ref={topCanvasRef}
                style={{
                    position: 'absolute', top: 0, left: RULER_SIZE, right: 0, height: RULER_SIZE,
                    background: bg, borderBottom: `1px solid ${borderColor}`, overflow: 'hidden',
                    zIndex: 5, pointerEvents: 'none', userSelect: 'none'
                }}
            />

            <canvas
                ref={leftCanvasRef}
                style={{
                    position: 'absolute', top: RULER_SIZE, left: 0, bottom: 0, width: RULER_SIZE,
                    background: bg, borderRight: `1px solid ${borderColor}`, overflow: 'hidden',
                    zIndex: 5, pointerEvents: 'none', userSelect: 'none'
                }}
            />

            <div style={{
                position: 'absolute', top: 0, left: 0, width: RULER_SIZE, height: RULER_SIZE,
                background: bg, borderBottom: `1px solid ${borderColor}`, borderRight: `1px solid ${borderColor}`,
                zIndex: 6
            }} />
        </>
    );
});

export const RULER_SIZE_PX = RULER_SIZE;
