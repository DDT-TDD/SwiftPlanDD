import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditorStore } from './store/useEditorStore';
import { useProjectStore } from './store/useProjectStore';
import { THEMES } from './utils/constants';

import { Header } from './components/ui/Header';
import { Sidebar } from './components/ui/Sidebar';
import { Inspector } from './components/ui/Inspector';
import { StageManager } from './components/canvas/StageManager';

import './index.css';
import { ContextMenu } from './components/ui/ContextMenu';
import { ShortcutsModal } from './components/ui/ShortcutsModal';
import { OnboardingWizard } from './components/ui/OnboardingWizard';
import { FloorManager } from './components/ui/FloorManager';

const App = () => {
  const AUTOSAVE_KEY = 'swiftplandd.autosave.v1';

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('swiftplandd.onboarding.dismissed'));
  const clipboardRef = useRef(null);

  const themeName = useEditorStore(state => state.themeName);
  const tool = useEditorStore(state => state.tool);
  const mousePos = useEditorStore(state => state.mousePos);
  const canvasScale = useEditorStore(state => state.canvasScale);
  const selectedIds = useEditorStore(state => state.selectedIds);
  const theme = THEMES[themeName];

  const wallsCount = useProjectStore(state => state.walls.length);
  const openingsCount = useProjectStore(state => state.openings.length);
  const furnitureCount = useProjectStore(state => state.furniture.length);
  const rooms = useProjectStore(state => state.rooms);

  const copySelection = useCallback(() => {
    const selectedId = useEditorStore.getState().selectedId;
    const selectedIds = useEditorStore.getState().selectedIds;
    const ids = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
    if (ids.length === 0) return;

    const state = useProjectStore.getState();
    const bundle = [];

    ids.forEach((id) => {
      const wall = state.walls.find(item => item.id === id);
      if (wall) {
        bundle.push({ type: 'wall', item: wall });
        return;
      }
      const opening = state.openings.find(item => item.id === id);
      if (opening) {
        bundle.push({ type: 'opening', item: opening });
        return;
      }
      const furniture = state.furniture.find(item => item.id === id);
      if (furniture) {
        bundle.push({ type: 'furniture', item: furniture });
        return;
      }
      const room = state.rooms.find(item => item.id === id);
      if (room) {
        bundle.push({ type: 'room', item: room });
        return;
      }
      const dimension = state.dimensions.find(item => item.id === id);
      if (dimension) {
        bundle.push({ type: 'dimension', item: dimension });
        return;
      }
      const annotation = state.annotations.find(item => item.id === id);
      if (annotation) {
        bundle.push({ type: 'annotation', item: annotation });
      }
    });

    clipboardRef.current = bundle.length > 1 ? { type: 'bundle', items: bundle } : bundle[0] || null;
  }, []);

  const pasteClipboard = useCallback(() => {
    const payload = clipboardRef.current;
    if (!payload) return;

    const store = useProjectStore.getState();
    const offset = 200;

    const addClone = (entry, index = 1) => {
      const id = globalThis.crypto.randomUUID();
      const appliedOffset = offset * index;

      if (entry.type === 'wall') {
        const item = entry.item;
        return { type: 'wall', data: { ...item, id, x1: item.x1 + appliedOffset, y1: item.y1 + appliedOffset, x2: item.x2 + appliedOffset, y2: item.y2 + appliedOffset } };
      }
      if (entry.type === 'opening') {
        const item = entry.item;
        return { type: 'opening', data: { ...item, id, offset: Math.max(0, item.offset + appliedOffset) } };
      }
      if (entry.type === 'furniture') {
        const item = entry.item;
        return { type: 'furniture', data: { ...item, id, x: item.x + appliedOffset, y: item.y + appliedOffset } };
      }
      if (entry.type === 'room') {
        const item = entry.item;
        return {
          type: 'room',
          data: {
            ...item,
            id,
            points: Array.isArray(item.points)
              ? item.points.map(point => ({ x: point.x + appliedOffset, y: point.y + appliedOffset }))
              : item.points
          }
        };
      }
      if (entry.type === 'dimension') {
        const item = entry.item;
        return { type: 'dimension', data: { ...item, id, x1: item.x1 + appliedOffset, y1: item.y1 + appliedOffset, x2: item.x2 + appliedOffset, y2: item.y2 + appliedOffset } };
      }
      if (entry.type === 'annotation') {
        const item = entry.item;
        return { type: 'annotation', data: { ...item, id, x: item.x + appliedOffset, y: item.y + appliedOffset } };
      }

      return null;
    };

    if (payload.type === 'bundle') {
      const newIds = [];
      payload.items.forEach((entry, idx) => {
        const clone = addClone(entry, idx + 1);
        if (!clone) return;
        if (clone.type === 'wall') store.addWall(clone.data);
        if (clone.type === 'opening') store.addOpening(clone.data);
        if (clone.type === 'furniture') store.addFurniture(clone.data);
        if (clone.type === 'room') store.addRoom(clone.data);
        if (clone.type === 'dimension') store.addDimension(clone.data);
        if (clone.type === 'annotation') store.addAnnotation(clone.data);
        newIds.push(clone.data.id);
      });
      useEditorStore.getState().setSelectedIds(newIds);
      return;
    }

    const clone = addClone(payload, 1);
    if (!clone) return;
    if (clone.type === 'wall') store.addWall(clone.data);
    if (clone.type === 'opening') store.addOpening(clone.data);
    if (clone.type === 'furniture') store.addFurniture(clone.data);
    if (clone.type === 'room') store.addRoom(clone.data);
    if (clone.type === 'dimension') store.addDimension(clone.data);
    if (clone.type === 'annotation') store.addAnnotation(clone.data);
    useEditorStore.getState().setSelectedIds([clone.data.id]);
  }, []);

  const duplicateSelection = useCallback(() => {
    copySelection();
    pasteClipboard();
  }, [copySelection, pasteClipboard]);

  const selectAll = useCallback(() => {
    const state = useProjectStore.getState();
    const allIds = [
      ...state.walls,
      ...state.openings,
      ...state.furniture,
      ...state.rooms,
      ...state.dimensions,
      ...state.annotations
    ].map((item) => item.id);
    useEditorStore.getState().setSelectedIds(allIds);
  }, []);

  const deleteSelection = useCallback(() => {
    const selectedId = useEditorStore.getState().selectedId;
    const selectedIds = useEditorStore.getState().selectedIds;
    const ids = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
    if (ids.length === 0) return;

    const store = useProjectStore.getState();
    ids.forEach((id) => store.deleteItem(id));
    useEditorStore.getState().clearSelection();
    useEditorStore.getState().setContextMenu({ show: false });
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        useProjectStore.getState().importProject(data);
      }
    } catch {
      localStorage.removeItem(AUTOSAVE_KEY);
    }
  }, []);

  useEffect(() => {
    const saveSnapshot = () => {
      const state = useProjectStore.getState();
      const currentData = { walls: state.walls, openings: state.openings, furniture: state.furniture, rooms: state.rooms, dimensions: state.dimensions, annotations: state.annotations };
      const payload = {
        ...currentData,
        floors: state.floors,
        currentFloorId: state.currentFloorId,
        floorData: { ...state.floorData, [state.currentFloorId]: currentData }
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
    };

    const intervalId = window.setInterval(saveSnapshot, 30000);
    window.addEventListener('beforeunload', saveSnapshot);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('beforeunload', saveSnapshot);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          useProjectStore.getState().undo();
        }
        if (e.key === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z')) {
          e.preventDefault();
          useProjectStore.getState().redo();
        }
        if (e.key.toLowerCase() === 'c') {
          e.preventDefault();
          copySelection();
        }
        if (e.key.toLowerCase() === 'v') {
          e.preventDefault();
          pasteClipboard();
        }
        if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          duplicateSelection();
        }
        if (e.key.toLowerCase() === 'a') {
          e.preventDefault();
          selectAll();
        }
        if (e.shiftKey && (e.key === 'Delete' || e.key === 'Backspace')) {
          e.preventDefault();
          if (window.confirm('Delete all elements in the current project?')) {
            useProjectStore.getState().clearAll();
            useEditorStore.getState().clearSelection();
          }
        }
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'v') useEditorStore.getState().setTool('select');
        if (key === 'w') useEditorStore.getState().setTool('wall');
        if (key === 'd') useEditorStore.getState().setTool('door');
        if (key === 'n') useEditorStore.getState().setTool('window');
        if (key === 'r') useEditorStore.getState().setTool('room');
        if (key === 'm') useEditorStore.getState().setTool('measure');
        if (key === 't') useEditorStore.getState().setTool('text');
        if (key === 'a') useEditorStore.getState().setTool('arc_wall');
        if (e.key === '?' || (e.shiftKey && e.key === '/')) {
          e.preventDefault();
          setShowShortcuts(prev => !prev);
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelection();
      }

      if (e.key === 'Escape') {
        setShowShortcuts(false);
        useEditorStore.getState().clearSelection();
        useEditorStore.getState().setActiveObject(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copySelection, deleteSelection, duplicateSelection, pasteClipboard, selectAll]);

  const totalArea = rooms.reduce((sum, room) => sum + (room.area || 0), 0) / 1_000_000;

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: theme.bg, color: theme.text }}>
      <Header />
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <Sidebar />
        <StageManager />
        <Inspector />
      </div>
      <div style={{ height: '26px', display: 'flex', alignItems: 'center', gap: '14px', padding: '0 12px', fontSize: '0.72rem', borderTop: `1px solid ${theme.grid}`, background: themeName === 'light' ? '#f8fafc' : '#0f172a', color: theme.dim }}>
        <FloorManager />
        <span>Tool: {tool}</span>
        <span>Scale: 1:{canvasScale}</span>
        <span>Cursor: {Math.round(mousePos.x)}, {Math.round(mousePos.y)} mm</span>
        <span>Items: {wallsCount + openingsCount + furnitureCount}</span>
        <span>Selected: {selectedIds.length}</span>
        <span>Area: {totalArea.toFixed(2)} m²</span>
      </div>
      <ContextMenu />
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {showOnboarding && <OnboardingWizard onClose={() => setShowOnboarding(false)} />}
    </div>
  );
};

export default App;