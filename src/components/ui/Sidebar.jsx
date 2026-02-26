import { MousePointer2, Box, DoorOpen, AppWindow, Layout, Ruler, Trash2 } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { useProjectStore } from '../../store/useProjectStore';
import { THEMES } from '../../utils/constants';

const TOOLS = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'wall', icon: Box, label: 'Wall' },
    { id: 'door', icon: DoorOpen, label: 'Add Door' },
    { id: 'window', icon: AppWindow, label: 'Add Window' },
    { id: 'room', icon: Layout, label: 'Room' },
    { id: 'measure', icon: Ruler, label: 'Measure' }
];

export const Sidebar = () => {
    const tool = useEditorStore(state => state.tool);
    const setTool = useEditorStore(state => state.setTool);
    const selectedId = useEditorStore(state => state.selectedId);
    const themeName = useEditorStore(state => state.themeName);

    const deleteItem = useProjectStore(state => state.deleteItem);

    const theme = THEMES[themeName];

    return (
        <nav className="sidebar" style={{ width: '80px', background: themeName === 'light' ? '#f1f5f9' : 'rgba(30, 41, 59, 0.9)', borderRight: `1px solid ${theme.grid}`, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px', gap: '20px' }}>
            {TOOLS.map(item => (
                <button
                    key={item.id}
                    className={`tool-button ${tool === item.id ? 'active' : ''}`}
                    onClick={() => setTool(item.id)}
                    title={item.label}
                    style={{
                        width: '48px', height: '48px', borderRadius: '12px', border: 'none',
                        background: tool === item.id ? theme.accent : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <item.icon size={24} color={tool === item.id ? 'white' : theme.dim} />
                </button>
            ))}
            <div style={{ flexGrow: 1 }} />
            <button
                className="tool-button"
                onClick={() => {
                    if (selectedId) deleteItem(selectedId);
                }}
                disabled={!selectedId}
                style={{ marginBottom: '20px', background: 'transparent', border: 'none', cursor: selectedId ? 'pointer' : 'default' }}
            >
                <Trash2 size={24} color={selectedId ? "#ef4444" : "#1e293b"} />
            </button>
        </nav>
    );
};
