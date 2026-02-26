export const GRID_SIZE_DEFAULT = 1000;
export const SNAP_THRESHOLD = 15;
export const DEFAULT_WALL_THICKNESS = 200;

export const THEMES = {
    light: {
        bg: '#ffffff',
        grid: '#e2e8f0',
        wall: '#1e293b',
        wallSelected: '#38bdf8',
        opening: '#475569',
        openingSelected: '#38bdf8',
        furniture: 'rgba(71, 85, 105, 0.05)',
        furnitureStroke: '#94a3b8',
        text: '#1e293b',
        accent: '#38bdf8',
        dim: '#64748b'
    },
    dark: {
        bg: '#0f172a',
        grid: '#1e293b',
        wall: '#e2e8f0',
        wallSelected: '#38bdf8',
        opening: '#fbbf24',
        openingSelected: '#38bdf8',
        furniture: 'rgba(56, 189, 248, 0.1)',
        furnitureStroke: '#64748b',
        text: '#ffffff',
        accent: '#38bdf8',
        dim: '#94a3b8'
    },
    blueprint: {
        bg: '#1e3a8a',
        grid: 'rgba(255,255,255,0.1)',
        wall: '#ffffff',
        wallSelected: '#38bdf8',
        opening: '#ffffff',
        openingSelected: '#38bdf8',
        furniture: 'rgba(255, 255, 255, 0.05)',
        furnitureStroke: 'rgba(255, 255, 255, 0.5)',
        text: '#ffffff',
        accent: '#38bdf8',
        dim: '#ffffff'
    }
};

export const FURNITURE_PRESETS = {
    Living: [
        { name: 'Sofa 3-Seat', width: 2200, height: 900, type: 'furniture' },
        { name: 'Sofa 2-Seat', width: 1600, height: 900, type: 'furniture' },
        { name: 'TV Unit', width: 1800, height: 450, type: 'furniture' },
        { name: 'Coffee Table', width: 1200, height: 600, type: 'furniture' }
    ],
    Bedroom: [
        { name: 'Queen Bed', width: 1520, height: 2030, type: 'furniture' },
        { name: 'King Bed', width: 1930, height: 2030, type: 'furniture' },
        { name: 'Wardrobe', width: 1200, height: 600, type: 'furniture' },
        { name: 'Nightstand', width: 450, height: 450, type: 'furniture' }
    ],
    Kitchen: [
        { name: 'Counter (60cm)', width: 600, height: 600, type: 'furniture' },
        { name: 'Fridge', width: 900, height: 850, type: 'furniture' },
        { name: 'Stove/Oven', width: 750, height: 600, type: 'furniture' },
        { name: 'Dining Table', width: 1800, height: 900, type: 'furniture' }
    ],
    Bath: [
        { name: 'Bathtub', width: 1500, height: 700, type: 'furniture' },
        { name: 'Shower Cabin', width: 900, height: 900, type: 'furniture' },
        { name: 'Toilet', width: 400, height: 700, type: 'furniture' },
        { name: 'Vanity', width: 900, height: 500, type: 'furniture' }
    ]
};
