import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { THEMES } from '../../utils/constants';

const SHORTCUTS = [
    ['V', 'Select tool'],
    ['W', 'Wall tool'],
    ['D', 'Door tool'],
    ['N', 'Window tool'],
    ['R', 'Room tool'],
    ['M', 'Measure tool'],
    ['A', 'Arc Wall tool'],
    ['T', 'Text tool'],
    ['Ctrl+Z', 'Undo'],
    ['Ctrl+Y', 'Redo'],
    ['Ctrl+A', 'Select all elements'],
    ['Ctrl+Shift+Delete', 'Delete all elements'],
    ['Delete', 'Delete selection'],
    ['Shift', 'Constrain wall angle (45°)'],
    ['Esc', 'Cancel active drawing / clear selection'],
    ['?', 'Toggle this shortcuts panel']
];

export const ShortcutsModal = ({ onClose }) => {
    const themeName = useEditorStore(state => state.themeName);
    const theme = THEMES[themeName];

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '520px', maxWidth: '92%', maxHeight: '90%', overflowY: 'auto', background: themeName === 'light' ? '#fff' : '#1e293b', color: theme.text, border: `1px solid ${theme.grid}`, borderRadius: '12px', padding: '24px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: theme.dim, cursor: 'pointer' }}>
                    <X size={20} />
                </button>
                <h2 style={{ marginTop: 0, marginBottom: '14px', color: theme.accent, fontSize: '1.1rem' }}>Keyboard Shortcuts</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 12px' }}>
                    {SHORTCUTS.map(([combo, desc]) => (
                        <div key={combo} style={{ display: 'contents' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', background: themeName === 'light' ? '#f8fafc' : '#0f172a', border: `1px solid ${theme.grid}`, borderRadius: '6px', padding: '6px 8px', color: theme.accent }}>
                                {combo}
                            </div>
                            <div style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', color: theme.text }}>
                                {desc}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
