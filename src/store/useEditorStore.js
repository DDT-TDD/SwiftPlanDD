import { create } from 'zustand';

export const useEditorStore = create((set) => ({
    // UI State
    tool: 'wall', // select, wall, opening, room, measure
    selectedId: null,
    activeObject: null, // Temporary object being drawn

    // Interaction State
    // Interaction State
    mousePos: { x: 0, y: 0, snapType: null }, // Logical coords
    contextMenu: { show: false, x: 0, y: 0, targetId: null },

    // Environment Settings
    themeName: 'light',
    unit: 'm',
    showDual: false,
    roughMode: false,
    gridSpacing: 500, // 500mm = 50cm
    showGrid: true,
    canvasScale: 100, // 1:100 scale (1cm on screen = 100cm in reality)
    wallThickness: 20, // 20cm
    wallLabelPosition: 'center', // center, inside, outside, hidden

    // Viewport
    stagePos: { x: 0, y: 0 },
    stageScale: 1,
    isPanning: false,
    stageRef: null,
    bgImageFile: null,

    // Actions
    setStageRef: (ref) => set({ stageRef: ref }),
    setTool: (tool) => set({ tool, activeObject: null }),
    setSelectedId: (id) => set({ selectedId: id }),
    setActiveObject: (activeObject) => set({ activeObject }),
    updateActiveObject: (updates) => set((state) => ({ activeObject: { ...state.activeObject, ...updates } })),

    setMousePos: (mousePos) => set({ mousePos }),
    setContextMenu: (contextMenu) => set((state) => ({ contextMenu: { ...state.contextMenu, ...contextMenu } })),

    setThemeName: (themeName) => set({ themeName }),
    setUnit: (unit) => set({ unit }),
    setShowDual: (showDual) => set({ showDual }),
    setRoughMode: (roughMode) => set({ roughMode }),
    setGridSpacing: (gridSpacing) => set({ gridSpacing }),
    setShowGrid: (showGrid) => set({ showGrid }),
    setCanvasScale: (canvasScale) => set({ canvasScale }),
    setWallThickness: (wallThickness) => set({ wallThickness }),
    setWallLabelPosition: (wallLabelPosition) => set({ wallLabelPosition }),

    setStagePos: (stagePos) => set({ stagePos }),
    setStageScale: (stageScale) => set({ stageScale }),
    setIsPanning: (isPanning) => set({ isPanning }),
    setBgImageFile: (bgImageFile) => set({ bgImageFile }),
}));
