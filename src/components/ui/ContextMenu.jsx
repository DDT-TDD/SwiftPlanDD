import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { useProjectStore } from '../../store/useProjectStore';
import { THEMES } from '../../utils/constants';

export const ContextMenu = () => {
    const contextMenu = useEditorStore(state => state.contextMenu);
    const setContextMenu = useEditorStore(state => state.setContextMenu);
    const themeName = useEditorStore(state => state.themeName);
    const deleteItem = useProjectStore(state => state.deleteItem);

    if (!contextMenu.show) return null;
    const theme = THEMES[themeName];

    const handleDelete = () => {
        if (contextMenu.targetId) {
            deleteItem(contextMenu.targetId);
            useEditorStore.getState().setSelectedId(null);
        }
        setContextMenu({ show: false });
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: contextMenu.y,
                left: contextMenu.x,
                background: themeName === 'light' ? '#ffffff' : '#1e293b',
                border: `1px solid ${theme.grid}`,
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                minWidth: '150px',
                padding: '4px'
            }}
            onMouseLeave={() => setContextMenu({ show: false })}
        >
            <button
                onClick={() => { useProjectStore.getState().undo(); setContextMenu({ show: false }); }}
                style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 12px',
                    textAlign: 'left',
                    color: theme.text,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.target.style.background = themeName === 'light' ? '#f1f5f9' : '#334155'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
                Undo (Ctrl+Z)
            </button>
            <button
                onClick={() => { useProjectStore.getState().redo(); setContextMenu({ show: false }); }}
                style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 12px',
                    textAlign: 'left',
                    color: theme.text,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.target.style.background = themeName === 'light' ? '#f1f5f9' : '#334155'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
                Redo (Ctrl+Y)
            </button>
            <div style={{ height: '1px', background: theme.grid, margin: '4px 0' }} />
            <button
                onClick={handleDelete}
                style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 12px',
                    textAlign: 'left',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.target.style.background = themeName === 'light' ? '#f1f5f9' : '#334155'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
                Delete
            </button>
            <button
                onClick={() => setContextMenu({ show: false })}
                style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 12px',
                    textAlign: 'left',
                    color: theme.text,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.target.style.background = themeName === 'light' ? '#f1f5f9' : '#334155'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
                Cancel
            </button>
        </div>
    );
};
