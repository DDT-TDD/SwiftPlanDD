import { useState, useEffect, useRef } from 'react';
import { Layers, Plus, X, ChevronDown } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import { useEditorStore } from '../../store/useEditorStore';
import { THEMES } from '../../utils/constants';

export const FloorManager = () => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    // Click outside to close
    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);
    const [renaming, setRenaming] = useState(null);
    const [renameText, setRenameText] = useState('');

    const themeName = useEditorStore(state => state.themeName);
    const theme = THEMES[themeName];

    const floors = useProjectStore(state => state.floors);
    const currentFloorId = useProjectStore(state => state.currentFloorId);
    const switchFloor = useProjectStore(state => state.switchFloor);
    const addFloor = useProjectStore(state => state.addFloor);
    const renameFloor = useProjectStore(state => state.renameFloor);
    const removeFloor = useProjectStore(state => state.removeFloor);

    const currentFloor = floors.find(f => f.id === currentFloorId);

    return (
        <div ref={containerRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'transparent', border: `1px solid ${theme.grid}`,
                    color: theme.text, padding: '4px 10px', borderRadius: '6px',
                    cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap'
                }}
                title="Switch Floor"
            >
                <Layers size={14} />
                {currentFloor?.name || 'Ground Floor'}
                <ChevronDown size={12} />
            </button>

            {open && (
                <div style={{
                    position: 'absolute', bottom: '100%', left: 0, marginBottom: '4px',
                    background: themeName === 'light' ? '#fff' : '#1e293b',
                    border: `1px solid ${theme.grid}`, borderRadius: '8px',
                    padding: '6px 0', minWidth: '200px', zIndex: 200,
                    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.15)'
                }}>
                    <div style={{ padding: '4px 12px 6px', fontSize: '0.7rem', color: theme.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Floors</div>
                    {floors.map(f => (
                        <div key={f.id} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '5px 12px', cursor: 'pointer',
                            background: f.id === currentFloorId ? (themeName === 'light' ? '#e2e8f0' : '#334155') : 'transparent'
                        }}
                            onClick={() => { switchFloor(f.id); setOpen(false); }}
                        >
                            {renaming === f.id ? (
                                <input
                                    value={renameText}
                                    onChange={(e) => setRenameText(e.target.value)}
                                    onBlur={() => { renameFloor(f.id, renameText); setRenaming(null); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { renameFloor(f.id, renameText); setRenaming(null); } }}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        flex: 1, padding: '2px 4px', fontSize: '0.8rem',
                                        background: themeName === 'light' ? '#fff' : '#0f172a',
                                        border: `1px solid ${theme.accent}`, color: theme.text,
                                        borderRadius: '3px', outline: 'none'
                                    }}
                                />
                            ) : (
                                <span
                                    style={{ flex: 1, fontSize: '0.8rem', color: theme.text }}
                                    onDoubleClick={(e) => { e.stopPropagation(); setRenaming(f.id); setRenameText(f.name); }}
                                >
                                    {f.name}
                                </span>
                            )}
                            {floors.length > 1 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeFloor(f.id); }}
                                    style={{ background: 'transparent', border: 'none', padding: '2px', cursor: 'pointer', color: theme.dim, display: 'flex' }}
                                    title="Remove floor"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                    <div style={{ height: '1px', background: theme.grid, margin: '4px 0' }} />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const name = `Floor ${floors.length}`;
                            addFloor(name);
                        }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            width: '100%', padding: '5px 12px', background: 'transparent',
                            border: 'none', color: theme.accent, cursor: 'pointer',
                            fontSize: '0.8rem', textAlign: 'left'
                        }}
                    >
                        <Plus size={14} /> Add Floor
                    </button>
                </div>
            )}
        </div>
    );
};
