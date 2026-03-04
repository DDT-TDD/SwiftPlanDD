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
        { name: 'Sofa L-Shape', width: 2600, height: 2000, type: 'furniture' },
        { name: 'Armchair', width: 850, height: 850, type: 'furniture' },
        { name: 'TV Unit', width: 1800, height: 450, type: 'furniture' },
        { name: 'Coffee Table', width: 1200, height: 600, type: 'furniture' },
        { name: 'Side Table', width: 500, height: 500, type: 'furniture' },
        { name: 'Bookshelf', width: 1200, height: 350, type: 'furniture' },
        { name: 'Floor Lamp', width: 300, height: 300, type: 'furniture' },
        { name: 'Plant Pot (Large)', width: 450, height: 450, type: 'furniture' }
    ],
    Bedroom: [
        { name: 'Queen Bed', width: 1520, height: 2030, type: 'furniture' },
        { name: 'King Bed', width: 1930, height: 2030, type: 'furniture' },
        { name: 'Single Bed', width: 900, height: 1900, type: 'furniture' },
        { name: 'Baby Crib', width: 700, height: 1300, type: 'furniture' },
        { name: 'Wardrobe', width: 1200, height: 600, type: 'furniture' },
        { name: 'Wardrobe (Double)', width: 2000, height: 600, type: 'furniture' },
        { name: 'Nightstand', width: 450, height: 450, type: 'furniture' },
        { name: 'Dresser', width: 1200, height: 500, type: 'furniture' },
        { name: 'Vanity Desk', width: 1000, height: 450, type: 'furniture' }
    ],
    Kitchen: [
        { name: 'Counter (60cm)', width: 600, height: 600, type: 'furniture' },
        { name: 'Counter (120cm)', width: 1200, height: 600, type: 'furniture' },
        { name: 'Fridge', width: 900, height: 850, type: 'furniture' },
        { name: 'Stove/Oven', width: 750, height: 600, type: 'furniture' },
        { name: 'Microwave', width: 500, height: 400, type: 'furniture' },
        { name: 'Dishwasher', width: 600, height: 600, type: 'furniture' },
        { name: 'Sink (Kitchen)', width: 600, height: 500, type: 'furniture' },
        { name: 'Island Counter', width: 1800, height: 900, type: 'furniture' },
        { name: 'Dining Table', width: 1800, height: 900, type: 'furniture' },
        { name: 'Dining Table (Round)', width: 1200, height: 1200, type: 'furniture' },
        { name: 'Dining Chair', width: 450, height: 450, type: 'furniture' }
    ],
    Bath: [
        { name: 'Bathtub', width: 1500, height: 700, type: 'furniture' },
        { name: 'Bathtub (Corner)', width: 1500, height: 1500, type: 'furniture' },
        { name: 'Shower Cabin', width: 900, height: 900, type: 'furniture' },
        { name: 'Shower Cabin (Rect)', width: 1200, height: 800, type: 'furniture' },
        { name: 'Toilet', width: 400, height: 700, type: 'furniture' },
        { name: 'Bidet', width: 400, height: 600, type: 'furniture' },
        { name: 'Vanity', width: 900, height: 500, type: 'furniture' },
        { name: 'Vanity (Double)', width: 1500, height: 500, type: 'furniture' }
    ],
    Office: [
        { name: 'Desk (Rectangular)', width: 1400, height: 700, type: 'furniture' },
        { name: 'Desk (L-Shaped)', width: 1800, height: 1800, type: 'furniture' },
        { name: 'Office Chair', width: 600, height: 600, type: 'furniture' },
        { name: 'Filing Cabinet', width: 450, height: 600, type: 'furniture' },
        { name: 'Bookshelf (Tall)', width: 800, height: 350, type: 'furniture' },
        { name: 'Printer Stand', width: 600, height: 500, type: 'furniture' }
    ],
    Outdoor: [
        { name: 'Outdoor Table', width: 1500, height: 900, type: 'furniture' },
        { name: 'Outdoor Chair', width: 600, height: 600, type: 'furniture' },
        { name: 'Sun Lounger', width: 700, height: 2000, type: 'furniture' },
        { name: 'BBQ Grill', width: 1200, height: 600, type: 'furniture' },
        { name: 'Plant Pot (Outdoor)', width: 600, height: 600, type: 'furniture' },
        { name: 'Garden Bench', width: 1500, height: 500, type: 'furniture' }
    ],
    Laundry: [
        { name: 'Washing Machine', width: 600, height: 600, type: 'furniture' },
        { name: 'Dryer', width: 600, height: 600, type: 'furniture' },
        { name: 'Laundry Sink', width: 600, height: 500, type: 'furniture' },
        { name: 'Ironing Board', width: 400, height: 1200, type: 'furniture' },
        { name: 'Storage Shelf', width: 1000, height: 400, type: 'furniture' }
    ],
    Stairs: [
        { name: 'Staircase (Straight)', width: 900, height: 3000, type: 'furniture' },
        { name: 'Staircase (L-Shape)', width: 1800, height: 2700, type: 'furniture' },
        { name: 'Staircase (Spiral)', width: 1800, height: 1800, type: 'furniture' },
        { name: 'Staircase (U-Shape)', width: 1800, height: 3600, type: 'furniture' }
    ]
};
