import rough from 'roughjs/bin/rough';

// Initialize rough generator
const generator = rough.generator();

/**
 * Converts roughjs internal drawing operations into standard SVG path strings.
 * This allows tight integration with react-konva's <Path> component, decoupling 
 * roughjs from requiring an explicit HTMLCanvas DOM node.
 */
const opsToPath = (drawable) => {
    let path = '';
    for (const set of drawable.sets) {
        for (const op of set.ops) {
            const data = op.data;
            switch (op.op) {
                case 'move':
                    path += `M${data[0]} ${data[1]} `;
                    break;
                case 'bcurveTo':
                    path += `C${data[0]} ${data[1]}, ${data[2]} ${data[3]}, ${data[4]} ${data[5]} `;
                    break;
                case 'lineTo':
                    path += `L${data[0]} ${data[1]} `;
                    break;
            }
        }
    }
    return path.trim();
};

export const getRoughLinePath = (x1, y1, x2, y2, options = {}) => {
    const drawable = generator.line(x1, y1, x2, y2, { roughness: 1.5, strokeWidth: 2, bowing: 1, ...options });
    return opsToPath(drawable);
};

export const getRoughRectPath = (x, y, w, h, options = {}) => {
    const drawable = generator.rectangle(x, y, w, h, { roughness: 1.5, strokeWidth: 2, bowing: 1, ...options });
    return opsToPath(drawable);
};

export const getRoughPolygonPath = (points, options = {}) => {
    const pts = points.map(p => [p.x, p.y]);
    // Polygon needs at least 3 points
    if (pts.length < 3) return '';
    const drawable = generator.polygon(pts, { roughness: 1.5, strokeWidth: 2, bowing: 1, ...options });
    return opsToPath(drawable);
};

export const getRoughArcPath = (x, y, width, height, start, stop, closed, options = {}) => {
    const drawable = generator.arc(x, y, width, height, start, stop, closed, { roughness: 1.5, strokeWidth: 2, bowing: 1, ...options });
    return opsToPath(drawable);
};
