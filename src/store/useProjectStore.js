import { create } from 'zustand';

let _lastSaveTime = 0;
const DEBOUNCE_MS = 300;

const RECENT_KEY = 'swiftplandd.recentProjects';

function getRecentProjects() {
    try {
        return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch { return []; }
}

function addRecentProject(name, data) {
    const recent = getRecentProjects();
    const entry = { name, date: new Date().toISOString(), wallCount: (data.walls || []).length, roomCount: (data.rooms || []).length, furnitureCount: (data.furniture || []).length };
    const filtered = recent.filter(r => r.name !== name);
    const updated = [entry, ...filtered].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

export const useProjectStore = create((set, get) => ({
    walls: [],
    openings: [],
    furniture: [],
    rooms: [],
    dimensions: [],
    annotations: [],

    // Floor management
    floors: [{ id: 'floor-0', name: 'Ground Floor' }],
    currentFloorId: 'floor-0',
    floorData: {}, // Map of floorId -> { walls, openings, furniture, rooms, dimensions, annotations }

    past: [],
    future: [],

    saveState: (label) => {
        const state = get();
        const current = { walls: state.walls, openings: state.openings, furniture: state.furniture, rooms: state.rooms, dimensions: state.dimensions, annotations: state.annotations, _label: label || 'Edit' };
        const newPast = [...state.past, current].slice(-50);
        _lastSaveTime = Date.now();
        set({ past: newPast, future: [] });
    },

    // Debounced save: skips if saveState was called within DEBOUNCE_MS
    _saveIfNotRecent: (label) => {
        if (Date.now() - _lastSaveTime > DEBOUNCE_MS) {
            get().saveState(label);
        }
    },

    getUndoLabel: () => {
        const { past } = get();
        if (past.length === 0) return null;
        return past[past.length - 1]._label || 'Edit';
    },
    getRedoLabel: () => {
        const { future } = get();
        if (future.length === 0) return null;
        return future[future.length - 1]._label || 'Edit';
    },

    undo: () => set((state) => {
        if (state.past.length === 0) return state;
        const newPast = [...state.past];
        const previous = newPast.pop();
        const current = { walls: state.walls, openings: state.openings, furniture: state.furniture, rooms: state.rooms, dimensions: state.dimensions, annotations: state.annotations };
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
        const current = { walls: state.walls, openings: state.openings, furniture: state.furniture, rooms: state.rooms, dimensions: state.dimensions, annotations: state.annotations };
        return {
            ...next,
            past: [...state.past, current],
            future: newFuture
        };
    }),

    // Actions
    setWalls: (walls) => { get().saveState('Set Walls'); set({ walls }); },
    addWall: (wall) => { get().saveState('Add Wall'); set((state) => ({ walls: [...state.walls, wall] })); },
    updateWall: (id, updates) => {
        get()._saveIfNotRecent('Move Wall'); set((state) => ({
            walls: state.walls.map(w => w.id === id ? { ...w, ...updates } : w)
        }));
    },

    addOpening: (opening) => { get().saveState('Add Opening'); set((state) => ({ openings: [...state.openings, opening] })); },
    updateOpening: (id, updates) => {
        get()._saveIfNotRecent('Edit Opening'); set((state) => ({
            openings: state.openings.map(o => o.id === id ? { ...o, ...updates } : o)
        }));
    },

    addFurniture: (item) => { get().saveState('Add Furniture'); set((state) => ({ furniture: [...state.furniture, item] })); },
    updateFurniture: (id, updates) => {
        get()._saveIfNotRecent('Edit Furniture'); set((state) => ({
            furniture: state.furniture.map(f => f.id === id ? { ...f, ...updates } : f)
        }));
    },
    updateFurnitureMany: (updateList) => {
        if (!Array.isArray(updateList) || updateList.length === 0) return;
        const updateMap = new Map(updateList.map(entry => [entry.id, entry.updates]));
        get()._saveIfNotRecent('Move Furniture');
        set((state) => ({
            furniture: state.furniture.map(item => {
                const updates = updateMap.get(item.id);
                return updates ? { ...item, ...updates } : item;
            })
        }));
    },

    addRoom: (room) => { get().saveState('Add Room'); set((state) => ({ rooms: [...state.rooms, room] })); },
    updateRoom: (id, updates) => {
        get()._saveIfNotRecent('Edit Room'); set((state) => ({
            rooms: state.rooms.map(r => r.id === id ? { ...r, ...updates } : r)
        }));
    },

    addDimension: (dim) => { get().saveState('Add Dimension'); set((state) => ({ dimensions: [...state.dimensions, dim] })); },

    addAnnotation: (ann) => { get().saveState('Add Annotation'); set((state) => ({ annotations: [...state.annotations, ann] })); },
    updateAnnotation: (id, updates) => {
        get()._saveIfNotRecent('Edit Annotation'); set((state) => ({
            annotations: state.annotations.map(a => a.id === id ? { ...a, ...updates } : a)
        }));
    },

    deleteItem: (id) => {
        get().saveState('Delete'); set((state) => ({
            walls: state.walls.filter(w => w.id !== id),
            openings: state.openings.filter(o => o.id !== id),
            furniture: state.furniture.filter(f => f.id !== id),
            dimensions: state.dimensions.filter(d => d.id !== id),
            rooms: state.rooms.filter(r => r.id !== id),
            annotations: state.annotations.filter(a => a.id !== id)
        }));
    },

    clearAll: () => { get().saveState('Clear All'); set({ walls: [], openings: [], furniture: [], rooms: [], dimensions: [], annotations: [], floors: [{ id: 'floor-0', name: 'Ground Floor' }], currentFloorId: 'floor-0', floorData: {} }); },

    // Floor management
    switchFloor: (targetFloorId) => {
        const state = get();
        if (targetFloorId === state.currentFloorId) return;
        // Save current floor's data
        const currentData = { walls: state.walls, openings: state.openings, furniture: state.furniture, rooms: state.rooms, dimensions: state.dimensions, annotations: state.annotations };
        const newFloorData = { ...state.floorData, [state.currentFloorId]: currentData };
        // Load target floor's data 
        const target = newFloorData[targetFloorId] || { walls: [], openings: [], furniture: [], rooms: [], dimensions: [], annotations: [] };
        set({
            currentFloorId: targetFloorId,
            floorData: newFloorData,
            walls: target.walls,
            openings: target.openings,
            furniture: target.furniture,
            rooms: target.rooms,
            dimensions: target.dimensions,
            annotations: target.annotations,
            past: [],
            future: []
        });
    },

    addFloor: (name) => {
        const id = `floor-${Date.now()}`;
        set((state) => ({
            floors: [...state.floors, { id, name: name || `Floor ${state.floors.length}` }]
        }));
        return id;
    },

    renameFloor: (floorId, name) => {
        set((state) => ({
            floors: state.floors.map(f => f.id === floorId ? { ...f, name } : f)
        }));
    },

    removeFloor: (floorId) => {
        const state = get();
        if (state.floors.length <= 1) return; // Can't remove last floor
        if (state.currentFloorId === floorId) {
            // Switch to another floor first
            const other = state.floors.find(f => f.id !== floorId);
            if (other) get().switchFloor(other.id);
        }
        const newFloorData = { ...get().floorData };
        delete newFloorData[floorId];
        set((state2) => ({
            floors: state2.floors.filter(f => f.id !== floorId),
            floorData: newFloorData
        }));
    },

    getFloorData: (floorId) => {
        const state = get();
        if (floorId === state.currentFloorId) {
            return { walls: state.walls, openings: state.openings, furniture: state.furniture, rooms: state.rooms };
        }
        return state.floorData[floorId] || { walls: [], openings: [], furniture: [], rooms: [] };
    },

    exportProject: () => {
        const state = get();
        // Save current floor data before exporting
        const currentData = { walls: state.walls, openings: state.openings, furniture: state.furniture, rooms: state.rooms, dimensions: state.dimensions, annotations: state.annotations };
        const allFloorData = { ...state.floorData, [state.currentFloorId]: currentData };
        const data = {
            walls: state.walls,
            openings: state.openings,
            furniture: state.furniture,
            rooms: state.rooms,
            dimensions: state.dimensions,
            annotations: state.annotations,
            floors: state.floors,
            currentFloorId: state.currentFloorId,
            floorData: allFloorData
        };
        const filename = `swiftplan-project-${new Date().toISOString().split('T')[0]}.swift.json`;
        addRecentProject(filename, data);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    importProject: (data, filename) => {
        get().saveState('Import Project');
        if (filename) addRecentProject(filename, data);
        set({
            walls: Array.isArray(data.walls) ? data.walls : [],
            openings: Array.isArray(data.openings) ? data.openings : [],
            furniture: Array.isArray(data.furniture) ? data.furniture : [],
            rooms: Array.isArray(data.rooms) ? data.rooms : [],
            dimensions: Array.isArray(data.dimensions) ? data.dimensions : [],
            annotations: Array.isArray(data.annotations) ? data.annotations : [],
            floors: Array.isArray(data.floors) ? data.floors : [{ id: 'floor-0', name: 'Ground Floor' }],
            currentFloorId: data.currentFloorId || 'floor-0',
            floorData: data.floorData || {}
        });
    },

    getRecentProjects
}));
