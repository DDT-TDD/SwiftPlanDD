import { create } from 'zustand';

const getAutoGridSpacing = (scale) => {
    if (scale <= 20) return 100;
    if (scale <= 50) return 250;
    if (scale <= 75) return 500;
    if (scale <= 150) return 500;
    if (scale <= 250) return 1000;
    if (scale <= 500) return 2500;
    return 5000;
};

export const useEditorStore = create((set) => ({
    // UI State
    tool: 'wall', // select, wall, opening, room, measure
    selectedId: null,
    selectedIds: [],
    activeObject: null, // Temporary object being drawn

    // Interaction State
    mousePos: { x: 0, y: 0, snapType: null }, // Logical coords
    contextMenu: { show: false, x: 0, y: 0, targetId: null },

    // Environment Settings
    themeName: 'light',
    unit: 'm',
    showDual: false,
    roughMode: false,
    gridSpacing: 500, // 500mm = 50cm
    autoGridSpacing: false,
    showGrid: true,
    canvasScale: 100, // 1:100 scale (1cm on screen = 100cm in reality)
    wallThickness: 200, // 200mm = 20cm
    wallLabelPosition: 'center', // center, inside, outside, hidden
    showAutoDimensions: false,
    showRulers: true,
    orthoMode: false,
    showWallDiagnostics: false,

    // Viewport
    stagePos: { x: 0, y: 0 },
    stageScale: 1,
    isPanning: false,
    stageRef: null,

    // Actions
    setStageRef: (ref) => set({ stageRef: ref }),
    setTool: (tool) => set({ tool, activeObject: null }),
    setSelectedId: (id) => set({ selectedId: id, selectedIds: id ? [id] : [] }),
    setSelectedIds: (ids) => set({
        selectedIds: ids,
        selectedId: ids.length === 1 ? ids[0] : null
    }),
    toggleSelectedId: (id) => set((state) => {
        const exists = state.selectedIds.includes(id);
        const nextIds = exists ? state.selectedIds.filter(itemId => itemId !== id) : [...state.selectedIds, id];
        return {
            selectedIds: nextIds,
            selectedId: nextIds.length === 1 ? nextIds[0] : null
        };
    }),
    clearSelection: () => set({ selectedId: null, selectedIds: [] }),
    setActiveObject: (activeObject) => set({ activeObject }),
    updateActiveObject: (updates) => set((state) => ({ activeObject: { ...state.activeObject, ...updates } })),

    setMousePos: (mousePos) => set({ mousePos }),
    setContextMenu: (contextMenu) => set((state) => ({ contextMenu: { ...state.contextMenu, ...contextMenu } })),

    setThemeName: (themeName) => set({ themeName }),
    setUnit: (unit) => set({ unit }),
    setShowDual: (showDual) => set({ showDual }),
    setRoughMode: (roughMode) => set({ roughMode }),
    setGridSpacing: (gridSpacing) => set({ gridSpacing }),
    setAutoGridSpacing: (autoGridSpacing) => set((state) => ({
        autoGridSpacing,
        gridSpacing: autoGridSpacing ? getAutoGridSpacing(state.canvasScale) : state.gridSpacing
    })),
    setShowGrid: (showGrid) => set({ showGrid }),
    setCanvasScale: (canvasScale) => set((state) => ({
        canvasScale,
        gridSpacing: state.autoGridSpacing ? getAutoGridSpacing(canvasScale) : state.gridSpacing
    })),
    setWallThickness: (wallThickness) => set({ wallThickness }),
    setWallLabelPosition: (wallLabelPosition) => set({ wallLabelPosition }),
    setShowAutoDimensions: (showAutoDimensions) => set({ showAutoDimensions }),
    setShowRulers: (showRulers) => set({ showRulers }),
    setOrthoMode: (orthoMode) => set({ orthoMode }),
    setShowWallDiagnostics: (showWallDiagnostics) => set({ showWallDiagnostics }),

    setStagePos: (stagePos) => set({ stagePos }),
    setStageScale: (stageScale) => set({ stageScale }),
    setIsPanning: (isPanning) => set({ isPanning }),

    // Panel collapse state
    sidebarCollapsed: false,
    inspectorCollapsed: false,
    toggleSidebarCollapsed: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    toggleInspectorCollapsed: () => set(state => ({ inspectorCollapsed: !state.inspectorCollapsed })),
}));
