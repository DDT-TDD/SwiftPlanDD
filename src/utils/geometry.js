export const getDistance = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

export const getAngle = (p1, p2) => Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);

export const getPointAtOffset = (p1, p2, offset) => {
    const d = getDistance(p1, p2);
    if (d === 0) return p1;
    const t = offset / d;
    return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
};

export const getProjectedDistance = (p, p1, p2) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    if (dx === 0 && dy === 0) return 0;
    const t = ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / (dx * dx + dy * dy);
    const cl = Math.max(0, Math.min(1, t));
    return cl * getDistance(p1, p2);
};

export const shoelaceArea = (points) => {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        let j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
};

// Canvas-based Pattern Generator
export const createPattern = (type, color) => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    if (type === 'diagonal') {
        ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(20, 0); ctx.stroke();
        // Offset line to ensure seamless tile
        ctx.beginPath(); ctx.moveTo(20, 40); ctx.lineTo(40, 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(0, -20); ctx.stroke();
    } else if (type === 'crosshatch') {
        ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(20, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(20, 20); ctx.stroke();
    } else if (type === 'grid') {
        ctx.strokeRect(0, 0, 20, 20);
    }

    const img = new window.Image();
    img.src = canvas.toDataURL();
    return img;
};
