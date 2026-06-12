import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { useProjectStore } from '../../store/useProjectStore';
import { THEMES } from '../../utils/constants';

export const ContextMenu = () => {
    const contextMenu = useEditorStore(state => state.contextMenu);
    const setContextMenu = useEditorStore(state => state.setContextMenu);
    const selectedIds = useEditorStore(state => state.selectedIds);
    const themeName = useEditorStore(state => state.themeName);
    const deleteItem = useProjectStore(state => state.deleteItem);

    if (!contextMenu.show) return null;
    const theme = THEMES[themeName];
    const menuX = Math.max(0, Math.min(contextMenu.x, window.innerWidth - 160));
    const menuY = Math.max(0, Math.min(contextMenu.y, window.innerHeight - 190));

    const handleDelete = () => {
        if (contextMenu.targetId) {
            deleteItem(contextMenu.targetId);
            useEditorStore.getState().clearSelection();
        } else if (selectedIds.length > 0) {
            selectedIds.forEach((id) => deleteItem(id));
            useEditorStore.getState().clearSelection();
        }
        setContextMenu({ show: false });
    };

    const itemStyle = {
        color: theme.text,
        cursor: 'pointer'
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: menuY,
                left: menuX,
                background: themeName === 'light' ? '#ffffff' : '#1e293b',
                border: `1px solid ${theme.grid}`,
                borderRadius: '8px',
                boxShadow: 'var(--shadow-premium)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                minWidth: '160px',
                padding: '6px',
                gap: '2px'
            }}
        >
            <button
                onClick={() => { useProjectStore.getState().undo(); setContextMenu({ show: false }); }}
                className="context-menu-item"
                style={itemStyle}
            >
                Undo (Ctrl+Z)
            </button>
            <button
                onClick={() => { useProjectStore.getState().redo(); setContextMenu({ show: false }); }}
                className="context-menu-item"
                style={itemStyle}
            >
                Redo (Ctrl+Y)
            </button>
            <div style={{ height: '1px', background: theme.grid, margin: '4px 2px' }} />
            <button
                onClick={handleDelete}
                className="context-menu-item delete"
                style={{ cursor: 'pointer' }}
            >
                Delete
            </button>
            <button
                onClick={() => setContextMenu({ show: false })}
                className="context-menu-item"
                style={itemStyle}
            >
                Cancel
            </button>
        </div>
    );
};
