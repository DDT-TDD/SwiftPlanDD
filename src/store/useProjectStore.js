import { create } from 'zustand';

let _lastSaveTime = 0;
const DEBOUNCE_MS = 300;
const CONNECTION_EPSILON = 1;

const RECENT_KEY = 'swiftplandd.recentProjects';

const getHistorySnapshot = (state, label) => ({
    walls: state.walls,
    openings: state.openings,
    furniture: state.furniture,
    rooms: state.rooms,
    dimensions: state.dimensions,
    annotations: state.annotations,
    _label: label || 'Edit'
});

const createEmptyFloorContent = () => ({
    walls: [],
    openings: [],
    furniture: [],
    rooms: [],
    dimensions: [],
    annotations: [],
    tracing: null
});

const getFloorSnapshot = (state) => ({
    walls: state.walls,
    openings: state.openings,
    furniture: state.furniture,
    rooms: state.rooms,
    dimensions: state.dimensions,
    annotations: state.annotations,
    tracing: state.tracing
});

const matchesPoint = (point, target) => {
    if (!point || !target) return false;
    return Math.hypot(point.x - target.x, point.y - target.y) <= CONNECTION_EPSILON;
};

const translateWallFields = (wall, dx, dy) => {
    const updates = {
        x1: wall.x1 + dx,
        y1: wall.y1 + dy,
        x2: wall.x2 + dx,
        y2: wall.y2 + dy
    };

    if (wall.arcMidX != null && wall.arcMidY != null) {
        updates.arcMidX = wall.arcMidX + dx;
        updates.arcMidY = wall.arcMidY + dy;
    }

    return updates;
};

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
    tracing: null,
    globalTracing: null,

    // Floor management
    floors: [{ id: 'floor-0', name: 'Ground Floor' }],
    currentFloorId: 'floor-0',
    floorData: {}, // Map of floorId -> { walls, openings, furniture, rooms, dimensions, annotations, tracing }

    past: [],
    future: [],

    saveState: (label) => {
        const state = get();
        const current = getHistorySnapshot(state, label);
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
        const current = getHistorySnapshot(state);
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
        const current = getHistorySnapshot(state);
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
    moveWallEndpoint: (wallId, endpoint, newX, newY) => {
        get()._saveIfNotRecent('Edit Wall Geometry');
        set((state) => {
            const movedWall = state.walls.find(wall => wall.id === wallId);
            if (!movedWall) return state;

            const oldPoint = endpoint === 'p1'
                ? { x: movedWall.x1, y: movedWall.y1 }
                : { x: movedWall.x2, y: movedWall.y2 };

            return {
                walls: state.walls.map((wall) => {
                    const nextWall = { ...wall };

                    if (wall.id === wallId) {
                        if (endpoint === 'p1') {
                            nextWall.x1 = newX;
                            nextWall.y1 = newY;
                        } else {
                            nextWall.x2 = newX;
                            nextWall.y2 = newY;
                        }
                        return nextWall;
                    }

                    if (matchesPoint({ x: wall.x1, y: wall.y1 }, oldPoint)) {
                        nextWall.x1 = newX;
                        nextWall.y1 = newY;
                    }

                    if (matchesPoint({ x: wall.x2, y: wall.y2 }, oldPoint)) {
                        nextWall.x2 = newX;
                        nextWall.y2 = newY;
                    }

                    return nextWall;
                })
            };
        });
    },
    moveWall: (wallId, dx, dy) => {
        if (!Number.isFinite(dx) || !Number.isFinite(dy) || (dx === 0 && dy === 0)) return;
        get()._saveIfNotRecent('Move Wall');
        set((state) => {
            const movedWall = state.walls.find(wall => wall.id === wallId);
            if (!movedWall) return state;

            const oldP1 = { x: movedWall.x1, y: movedWall.y1 };
            const oldP2 = { x: movedWall.x2, y: movedWall.y2 };

            return {
                walls: state.walls.map((wall) => {
                    if (wall.id === wallId) {
                        return { ...wall, ...translateWallFields(wall, dx, dy) };
                    }

                    const nextWall = { ...wall };

                    if (matchesPoint({ x: wall.x1, y: wall.y1 }, oldP1)) {
                        nextWall.x1 = wall.x1 + dx;
                        nextWall.y1 = wall.y1 + dy;
                    }

                    if (matchesPoint({ x: wall.x2, y: wall.y2 }, oldP1)) {
                        nextWall.x2 = wall.x2 + dx;
                        nextWall.y2 = wall.y2 + dy;
                    }

                    if (matchesPoint({ x: wall.x1, y: wall.y1 }, oldP2)) {
                        nextWall.x1 = wall.x1 + dx;
                        nextWall.y1 = wall.y1 + dy;
                    }

                    if (matchesPoint({ x: wall.x2, y: wall.y2 }, oldP2)) {
                        nextWall.x2 = wall.x2 + dx;
                        nextWall.y2 = wall.y2 + dy;
                    }

                    return nextWall;
                })
            };
        });
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

    setCurrentFloorTracing: (tracing) => {
        set({ tracing });
    },
    updateCurrentFloorTracing: (updates) => {
        set((state) => ({ tracing: state.tracing ? { ...state.tracing, ...updates } : state.tracing }));
    },
    clearCurrentFloorTracing: () => {
        set({ tracing: null });
    },
    setGlobalTracing: (tracing) => {
        set({ globalTracing: tracing });
    },
    updateGlobalTracing: (updates) => {
        set((state) => ({ globalTracing: state.globalTracing ? { ...state.globalTracing, ...updates } : state.globalTracing }));
    },
    clearGlobalTracing: () => {
        set({ globalTracing: null });
    },

    clearAll: () => {
        get().saveState('Clear All');
        set({
            walls: [],
            openings: [],
            furniture: [],
            rooms: [],
            dimensions: [],
            annotations: [],
            tracing: null,
            globalTracing: null,
            floors: [{ id: 'floor-0', name: 'Ground Floor' }],
            currentFloorId: 'floor-0',
            floorData: {}
        });
    },

    // Floor management
    switchFloor: (targetFloorId) => {
        const state = get();
        if (targetFloorId === state.currentFloorId) return;
        // Save current floor's data
        const currentData = getFloorSnapshot(state);
        const newFloorData = { ...state.floorData, [state.currentFloorId]: currentData };
        // Load target floor's data 
        const target = newFloorData[targetFloorId] || createEmptyFloorContent();
        set({
            currentFloorId: targetFloorId,
            floorData: newFloorData,
            walls: target.walls,
            openings: target.openings,
            furniture: target.furniture,
            rooms: target.rooms,
            dimensions: target.dimensions,
            annotations: target.annotations,
            tracing: target.tracing || null,
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
            return getFloorSnapshot(state);
        }
        return state.floorData[floorId] || createEmptyFloorContent();
    },

    exportProject: () => {
        const state = get();
        // Save current floor data before exporting
        const currentData = getFloorSnapshot(state);
        const allFloorData = { ...state.floorData, [state.currentFloorId]: currentData };
        const data = {
            walls: state.walls,
            openings: state.openings,
            furniture: state.furniture,
            rooms: state.rooms,
            dimensions: state.dimensions,
            annotations: state.annotations,
            tracing: state.tracing,
            globalTracing: state.globalTracing,
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
        const floors = Array.isArray(data.floors) ? data.floors : [{ id: 'floor-0', name: 'Ground Floor' }];
        const currentFloorId = data.currentFloorId || floors[0]?.id || 'floor-0';
        const floorData = data.floorData || {};
        const currentFloorData = floorData[currentFloorId] || createEmptyFloorContent();
        set({
            walls: Array.isArray(data.walls) ? data.walls : [],
            openings: Array.isArray(data.openings) ? data.openings : [],
            furniture: Array.isArray(data.furniture) ? data.furniture : [],
            rooms: Array.isArray(data.rooms) ? data.rooms : [],
            dimensions: Array.isArray(data.dimensions) ? data.dimensions : [],
            annotations: Array.isArray(data.annotations) ? data.annotations : [],
            tracing: currentFloorData.tracing ?? data.tracing ?? null,
            globalTracing: data.globalTracing || null,
            floors,
            currentFloorId,
            floorData
        });
    },

    getRecentProjects
}));
