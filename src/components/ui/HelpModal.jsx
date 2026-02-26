import { X } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { THEMES } from '../../utils/constants';

export const HelpModal = ({ onClose }) => {
    const themeName = useEditorStore(state => state.themeName);
    const theme = THEMES[themeName];

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: themeName === 'light' ? '#fff' : '#1e293b', padding: '30px', borderRadius: '12px', width: '500px', maxWidth: '90%', maxHeight: '90%', overflowY: 'auto', color: theme.text, position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: theme.dim, cursor: 'pointer' }}>
                    <X size={24} />
                </button>
                <h2 style={{ marginTop: 0, marginBottom: '20px', color: theme.accent }}>How to use SwiftPlanDD</h2>

                <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Drawing Basics</h3>
                <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5', color: theme.text }}>
                    <li><strong>Walls:</strong> Click the Wall tool. Click once to start a wall, move your mouse, and click again to place the corner. Ensure the length is at least a few mm.</li>
                    <li><strong>Rooms:</strong> Click the Room tool. Trace the inner corners of an enclosed space. The room will automatically fill when you connect back near the start point.</li>
                    <li><strong>Doors & Windows:</strong> Click the Door or Window tool and click anywhere on an existing Wall to insert an opening. You can adjust the exact Width and Flip direction in the Inspector.</li>
                </ul>

                <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Navigation & Shortcuts</h3>
                <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5', color: theme.text }}>
                    <li><strong>Pan:</strong> Use the Middle Mouse Button (scroll wheel click), OR right-click drag, OR hold <strong>Spacebar + Left Click</strong> and drag the canvas.</li>
                    <li><strong>Zoom:</strong> Scroll the mouse wheel up and down.</li>
                    <li><strong>Undo / Redo:</strong> Press <code>Ctrl+Z</code> to undo, and <code>Ctrl+Y</code> (or <code>Ctrl+Shift+Z</code>) to redo.</li>
                    <li><strong>Delete:</strong> Select an object and press <code>Delete</code> or <code>Backspace</code>, or use the Right-Click Menu.</li>
                </ul>

                <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Properties & Exporting</h3>
                <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', lineHeight: '1.5', color: theme.text }}>
                    <li><strong>Inspector:</strong> Select any element to edit its exact dimensions, text labels, and visual properties.</li>
                    <li><strong>Exporting:</strong> Use the Header icons to Save your project (.swift.json), or export as PNG, PDF, or Draw.io XML.</li>
                </ul>
            </div>
        </div>
    );
};
