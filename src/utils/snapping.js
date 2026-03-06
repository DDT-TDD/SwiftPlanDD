import { getDistance } from './geometry';
import { GRID_SIZE_DEFAULT, SNAP_THRESHOLD } from './constants';

export const getSnappedPoint = (logicalPos, walls, zoomScale, gridSpacing) => {
    const snapGrid = (gridSpacing || GRID_SIZE_DEFAULT);
    const threshold = SNAP_THRESHOLD / zoomScale;

    let bestPoint = null;
    let bestPointDistance = threshold;
    let bestMidpoint = null;
    let bestMidpointDistance = threshold;
    let bestPerpendicular = null;
    let bestPerpendicularDistance = threshold;

    for (const wall of walls) {
        const p1 = { x: wall.x1, y: wall.y1 };
        const p2 = { x: wall.x2, y: wall.y2 };

        const p1Distance = getDistance(logicalPos, p1);
        if (p1Distance < bestPointDistance) {
            bestPointDistance = p1Distance;
            bestPoint = { x: wall.x1, y: wall.y1, snapType: 'point' };
        }

        const p2Distance = getDistance(logicalPos, p2);
        if (p2Distance < bestPointDistance) {
            bestPointDistance = p2Distance;
            bestPoint = { x: wall.x2, y: wall.y2, snapType: 'point' };
        }

        const midpoint = { x: (wall.x1 + wall.x2) / 2, y: (wall.y1 + wall.y2) / 2 };
        const midpointDistance = getDistance(logicalPos, midpoint);
        if (midpointDistance < bestMidpointDistance) {
            bestMidpointDistance = midpointDistance;
            bestMidpoint = { ...midpoint, snapType: 'midpoint' };
        }

        const dx = wall.x2 - wall.x1;
        const dy = wall.y2 - wall.y1;
        const l2 = dx * dx + dy * dy;
        if (l2 === 0) continue;
        const t = ((logicalPos.x - wall.x1) * dx + (logicalPos.y - wall.y1) * dy) / l2;
        if (t < 0.05 || t > 0.95) continue; // skip near endpoints (already handled)
        const px = wall.x1 + t * dx;
        const py = wall.y1 + t * dy;
        const perpendicularDistance = getDistance(logicalPos, { x: px, y: py });
        if (perpendicularDistance < bestPerpendicularDistance) {
            bestPerpendicularDistance = perpendicularDistance;
            bestPerpendicular = { x: px, y: py, snapType: 'perpendicular' };
        }
    }

    if (bestPoint) return bestPoint;
    if (bestMidpoint) return bestMidpoint;
    if (bestPerpendicular) return bestPerpendicular;

    // 4. Snap to grid
    return { x: Math.round(logicalPos.x / snapGrid) * snapGrid, y: Math.round(logicalPos.y / snapGrid) * snapGrid, snapType: 'grid' };
};

export const findNearestWall = (pos, walls, stageScale = 1, canvasScale = 100) => {
    let best = null;
    let minDist = (SNAP_THRESHOLD * canvasScale) / Math.max(stageScale, 0.01);
    walls.forEach(wall => {
        const p1 = { x: wall.x1, y: wall.y1 };
        const p2 = { x: wall.x2, y: wall.y2 };
        const l2 = Math.pow(getDistance(p1, p2), 2);
        if (l2 === 0) return;
        let t = ((pos.x - p1.x) * (p2.x - p1.x) + (pos.y - p1.y) * (p2.y - p1.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const projection = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
        const dist = getDistance(pos, projection);
        if (dist < minDist) { minDist = dist; best = { wallId: wall.id, offset: t * getDistance(p1, p2), pos: projection }; }
    });
    return best;
};
