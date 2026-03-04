import { useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { THEMES } from '../../utils/constants';
import { Box, DoorOpen, Armchair } from 'lucide-react';

const STEPS = [
    {
        icon: Box,
        title: 'Draw Walls',
        description: 'Select the Wall tool (W) and click to place wall endpoints. Hold Shift for angle snapping. Double-click or Escape to finish a chain. Type exact length and angle in the floating input.'
    },
    {
        icon: DoorOpen,
        title: 'Add Doors & Windows',
        description: 'Select the Door (D) or Window (N) tool and click on a wall to insert. Openings auto-align to the wall. Flip their direction in the Inspector panel on the right.'
    },
    {
        icon: Armchair,
        title: 'Place Furniture',
        description: 'Browse the Fixture Library in the Inspector. Click an item to add it at the viewport center. Drag to reposition, use corner handles to resize, and the circular handle to rotate.'
    }
];

const ONBOARDING_KEY = 'swiftplandd.onboarding.dismissed';

export const OnboardingWizard = ({ onClose }) => {
    const [step, setStep] = useState(0);
    const themeName = useEditorStore(state => state.themeName);
    const theme = THEMES[themeName];

    const currentStep = STEPS[step];
    const Icon = currentStep.icon;

    const handleDismiss = (permanent) => {
        if (permanent) {
            localStorage.setItem(ONBOARDING_KEY, '1');
        }
        onClose();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={(e) => { if (e.target === e.currentTarget) handleDismiss(false); }}>
            <div style={{ background: themeName === 'light' ? '#fff' : '#1e293b', borderRadius: '16px', padding: '32px', color: theme.text, width: '440px', maxWidth: '90vw', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={24} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: theme.dim, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step {step + 1} of {STEPS.length}</div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{currentStep.title}</h3>
                    </div>
                </div>

                <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: theme.dim, margin: '0 0 24px 0' }}>
                    {currentStep.description}
                </p>

                {/* Step indicator dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: i === step ? theme.accent : theme.grid,
                                transition: 'background 0.2s'
                            }}
                        />
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.75rem', color: theme.dim, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" onChange={(e) => { if (e.target.checked) localStorage.setItem(ONBOARDING_KEY, '1'); else localStorage.removeItem(ONBOARDING_KEY); }} />
                        Don&#39;t show again
                    </label>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {step > 0 && (
                            <button onClick={() => setStep(step - 1)} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${theme.grid}`, color: theme.text, borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>Back</button>
                        )}
                        {step < STEPS.length - 1 ? (
                            <button onClick={() => setStep(step + 1)} style={{ padding: '8px 16px', background: theme.accent, border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>Next</button>
                        ) : (
                            <button onClick={() => handleDismiss(false)} style={{ padding: '8px 16px', background: theme.accent, border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>Get Started</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
