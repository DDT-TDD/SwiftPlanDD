import { useRef, useState } from 'react';
import { Home, Image, Save, FolderOpen, Download, FileText, LayoutTemplate, HelpCircle } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { useProjectStore } from '../../store/useProjectStore';
import { exportToPNG, exportToPDF, exportToDrawio } from '../../utils/exportUtils';
import { THEMES } from '../../utils/constants';
import packageJson from '../../../package.json';
import { HelpModal } from './HelpModal';

export const Header = () => {
    const [showHelp, setShowHelp] = useState(false);
    const themeName = useEditorStore(state => state.themeName);
    const setBgImageFile = useEditorStore(state => state.setBgImageFile);
    const stageRef = useEditorStore(state => state.stageRef);
    const exportProject = useProjectStore(state => state.exportProject);
    const importProject = useProjectStore(state => state.importProject);
    const theme = THEMES[themeName];
    const bgInputRef = useRef(null);
    const projectInputRef = useRef(null);

    return (
        <header className="top-toolbar" style={{ height: '60px', background: themeName === 'light' ? '#f8fafc' : 'rgba(30, 41, 59, 0.8)', borderBottom: `1px solid ${theme.grid}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: '20px', zIndex: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Home size={24} color={theme.accent} />
                <span style={{ fontWeight: '600', fontSize: '1.2rem', color: theme.text }}>
                    SwiftPlanDD <span style={{ fontSize: '0.8rem', color: theme.dim, fontWeight: 'normal' }}>v{packageJson.version}</span>
                </span>
            </div>
            <div style={{ flexGrow: 1 }} />
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <button className="tool-button-small" onClick={() => projectInputRef.current?.click()} style={{ background: 'transparent', border: 'none', color: theme.dim, cursor: 'pointer' }} title="Open Project">
                    <FolderOpen size={20} />
                </button>
                <input type="file" ref={projectInputRef} hidden accept=".json" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            try {
                                const data = JSON.parse(ev.target.result);
                                importProject(data);
                            } catch (err) {
                                console.error("Failed to parse project file", err);
                            }
                        };
                        reader.readAsText(file);
                    }
                    e.target.value = ''; // Reset input so same file can be loaded again
                }} />

                <button className="tool-button-small" onClick={exportProject} style={{ background: 'transparent', border: 'none', color: theme.dim, cursor: 'pointer' }} title="Save Project">
                    <Save size={20} />
                </button>

                <div style={{ width: '1px', height: '24px', background: theme.grid, margin: '0 5px' }} />

                <button className="tool-button-small" onClick={() => bgInputRef.current?.click()} style={{ background: 'transparent', border: 'none', color: theme.dim, cursor: 'pointer' }} title="Upload Tracing Image">
                    <Image size={20} />
                </button>
                <input type="file" ref={bgInputRef} hidden accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setBgImageFile(URL.createObjectURL(file));
                    e.target.value = ''; // Reset
                }} />

                <div style={{ width: '1px', height: '24px', background: theme.grid, margin: '0 5px' }} />

                <button className="tool-button-small" onClick={() => exportToPNG(stageRef, themeName)} style={{ background: 'transparent', border: 'none', color: theme.dim, cursor: 'pointer' }} title="Export as PNG Image">
                    <Download size={20} />
                </button>

                <button className="tool-button-small" onClick={() => exportToPDF(stageRef, themeName)} style={{ background: 'transparent', border: 'none', color: theme.dim, cursor: 'pointer' }} title="Export as PDF Document">
                    <FileText size={20} />
                </button>

                <button className="tool-button-small" onClick={() => exportToDrawio(useProjectStore.getState())} style={{ background: 'transparent', border: 'none', color: theme.dim, cursor: 'pointer' }} title="Export to Draw.io (XML)">
                    <LayoutTemplate size={20} />
                </button>

                <div style={{ width: '1px', height: '24px', background: theme.grid, margin: '0 5px' }} />

                <button className="tool-button-small" onClick={() => setShowHelp(true)} style={{ background: 'transparent', border: 'none', color: theme.accent, cursor: 'pointer' }} title="Help & About">
                    <HelpCircle size={20} />
                </button>
            </div>
            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        </header>
    );
};
