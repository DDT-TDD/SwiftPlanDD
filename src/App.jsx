import React, { useEffect } from 'react';
import { useEditorStore } from './store/useEditorStore';
import { useProjectStore } from './store/useProjectStore';
import { THEMES } from './utils/constants';

import { Header } from './components/ui/Header';
import { Sidebar } from './components/ui/Sidebar';
import { Inspector } from './components/ui/Inspector';
import { StageManager } from './components/canvas/StageManager';

import './index.css';
import { ContextMenu } from './components/ui/ContextMenu';

const App = () => {
  const themeName = useEditorStore(state => state.themeName);
  const theme = THEMES[themeName];

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
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedId = useEditorStore.getState().selectedId;
        if (selectedId) {
          useProjectStore.getState().deleteItem(selectedId);
          useEditorStore.getState().setSelectedId(null);
          useEditorStore.getState().setContextMenu({ show: false });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: theme.bg, color: theme.text }}>
      <Header />
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <Sidebar />
        <StageManager />
        <Inspector />
      </div>
      <ContextMenu />
    </div>
  );
};

export default App;
