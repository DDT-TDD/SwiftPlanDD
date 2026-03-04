import { MousePointer2, Box, DoorOpen, AppWindow, Layout, Ruler, Type, Spline, Trash2 } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { useProjectStore } from '../../store/useProjectStore';
import { THEMES } from '../../utils/constants';

const TOOLS = [
    { id: 'select', icon: MousePointer2, label: 'Select', keyHint: 'V' },
    { id: 'wall', icon: Box, label: 'Wall', keyHint: 'W' },
    { id: 'door', icon: DoorOpen, label: 'Door', keyHint: 'D' },
    { id: 'window', icon: AppWindow, label: 'Window', keyHint: 'N' },
    { id: 'room', icon: Layout, label: 'Room', keyHint: 'R' },
    { id: 'measure', icon: Ruler, label: 'Measure', keyHint: 'M' },
    { id: 'arc_wall', icon: Spline, label: 'Arc Wall', keyHint: 'A' },
    { id: 'text', icon: Type, label: 'Text', keyHint: 'T' }
];

export const Sidebar = () => {
    const tool = useEditorStore(state => state.tool);
    const setTool = useEditorStore(state => state.setTool);
    const selectedId = useEditorStore(state => state.selectedId);
    const selectedIds = useEditorStore(state => state.selectedIds);
    const clearSelection = useEditorStore(state => state.clearSelection);
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
                    title={`${item.label} (${item.keyHint})`}
                    style={{
                        width: '58px', height: '58px', borderRadius: '12px', border: 'none',
                        background: tool === item.id ? theme.accent : 'transparent',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <item.icon size={24} color={tool === item.id ? 'white' : theme.dim} />
                    <span style={{ fontSize: '0.58rem', marginTop: '2px', color: tool === item.id ? 'white' : theme.dim, lineHeight: 1 }}>{item.label}</span>
                </button>
            ))}
            <div style={{ flexGrow: 1 }} />
            <button
                className="tool-button"
                onClick={() => {
                    const ids = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
                    if (ids.length > 0) {
                        ids.forEach(id => deleteItem(id));
                        clearSelection();
                    }
                }}
                disabled={selectedIds.length === 0 && !selectedId}
                style={{ marginBottom: '20px', background: 'transparent', border: 'none', cursor: (selectedIds.length > 0 || selectedId) ? 'pointer' : 'default' }}
            >
                <Trash2 size={24} color={(selectedIds.length > 0 || selectedId) ? '#ef4444' : theme.dim} />
            </button>
        </nav>
    );
};
