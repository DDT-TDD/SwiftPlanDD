import { create } from 'zustand';

export const useProjectStore = create((set, get) => ({
    walls: [],
    openings: [],
    furniture: [],
    rooms: [],
    dimensions: [],

    past: [],
    future: [],

    saveState: () => {
        const state = get();
        const current = { walls: state.walls, openings: state.openings, furniture: state.furniture, rooms: state.rooms, dimensions: state.dimensions };
        const newPast = [...state.past, current].slice(-50);
        set({ past: newPast, future: [] });
    },

    undo: () => set((state) => {
        if (state.past.length === 0) return state;
        const newPast = [...state.past];
        const previous = newPast.pop();
        const current = { walls: state.walls, openings: state.openings, furniture: state.furniture, rooms: state.rooms, dimensions: state.dimensions };
        return {
            ...previous,
            past: newPast,
            future: [...state.future, current]
        };
    }),

    redo: () => set((state) => {
        if (state.future.length === 0) return state;
        const newFuture = [...state.future];
        const next = newFuture.pop();
        const current = { walls: state.walls, openings: state.openings, furniture: state.furniture, rooms: state.rooms, dimensions: state.dimensions };
        return {
            ...next,
            past: [...state.past, current],
            future: newFuture
        };
    }),

    // Actions
    setWalls: (walls) => { get().saveState(); set({ walls }); },
    addWall: (wall) => { get().saveState(); set((state) => ({ walls: [...state.walls, wall] })); },
    updateWall: (id, updates) => {
        get().saveState(); set((state) => ({
            walls: state.walls.map(w => w.id === id ? { ...w, ...updates } : w)
        }));
    },

    addOpening: (opening) => { get().saveState(); set((state) => ({ openings: [...state.openings, opening] })); },
    updateOpening: (id, updates) => {
        get().saveState(); set((state) => ({
            openings: state.openings.map(o => o.id === id ? { ...o, ...updates } : o)
        }));
    },

    addFurniture: (item) => { get().saveState(); set((state) => ({ furniture: [...state.furniture, item] })); },
    updateFurniture: (id, updates) => {
        get().saveState(); set((state) => ({
            furniture: state.furniture.map(f => f.id === id ? { ...f, ...updates } : f)
        }));
    },

    addRoom: (room) => { get().saveState(); set((state) => ({ rooms: [...state.rooms, room] })); },
    updateRoom: (id, updates) => {
        get().saveState(); set((state) => ({
            rooms: state.rooms.map(r => r.id === id ? { ...r, ...updates } : r)
        }));
    },

    addDimension: (dim) => { get().saveState(); set((state) => ({ dimensions: [...state.dimensions, dim] })); },

    deleteItem: (id) => {
        get().saveState(); set((state) => ({
            walls: state.walls.filter(w => w.id !== id),
            openings: state.openings.filter(o => o.id !== id),
            furniture: state.furniture.filter(f => f.id !== id),
            dimensions: state.dimensions.filter(d => d.id !== id),
            rooms: state.rooms.filter(r => r.id !== id)
        }));
    },

    clearAll: () => { get().saveState(); set({ walls: [], openings: [], furniture: [], rooms: [], dimensions: [] }); },

    exportProject: () => {
        const state = get();
        const data = {
            walls: state.walls,
            openings: state.openings,
            furniture: state.furniture,
            rooms: state.rooms,
            dimensions: state.dimensions
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `swiftplan-project-${new Date().toISOString().split('T')[0]}.swift.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importProject: (data) => set({
        walls: Array.isArray(data.walls) ? data.walls : [],
        openings: Array.isArray(data.openings) ? data.openings : [],
        furniture: Array.isArray(data.furniture) ? data.furniture : [],
        rooms: Array.isArray(data.rooms) ? data.rooms : [],
        dimensions: Array.isArray(data.dimensions) ? data.dimensions : []
    })
}));
