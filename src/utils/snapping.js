import { getDistance } from './geometry';
import { GRID_SIZE_DEFAULT, SNAP_THRESHOLD } from './constants';

export const getSnappedPoint = (logicalPos, walls, zoomScale, gridSpacing) => {
    const snapGrid = (gridSpacing || GRID_SIZE_DEFAULT);
    for (const wall of walls) {
        if (getDistance(logicalPos, { x: wall.x1, y: wall.y1 }) < SNAP_THRESHOLD / zoomScale) return { x: wall.x1, y: wall.y1, snapType: 'point' };
        if (getDistance(logicalPos, { x: wall.x2, y: wall.y2 }) < SNAP_THRESHOLD / zoomScale) return { x: wall.x2, y: wall.y2, snapType: 'point' };
    }
    return { x: Math.round(logicalPos.x / snapGrid) * snapGrid, y: Math.round(logicalPos.y / snapGrid) * snapGrid, snapType: 'grid' };
};

export const findNearestWall = (pos, walls) => {
    let best = null;
    let minDist = 30;
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
