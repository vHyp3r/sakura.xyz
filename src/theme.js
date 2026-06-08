import React from 'react';

const PRESETS = {
  purple: { accent: '#a259fa', strong: '#8c40f5' },
  teal: { accent: '#2ac5b3', strong: '#1ea893' },
  orange: { accent: '#ff8c42', strong: '#ff6a00' },
};

const ThemeContext = React.createContext({
  preset: 'purple',
  setPreset: () => {},
  presets: Object.keys(PRESETS),
});

export function ThemeProvider({ children }) {
  const [preset, setPresetState] = React.useState(() => {
    try { return localStorage.getItem('sakura:theme') || 'purple'; } catch (e) { return 'purple'; }
  });

  React.useEffect(() => {
    const p = PRESETS[preset] || PRESETS.purple;
    document.documentElement.style.setProperty('--accent', p.accent);
    document.documentElement.style.setProperty('--accent-strong', p.strong);
    try { localStorage.setItem('sakura:theme', preset); } catch (e) {}
  }, [preset]);

  const setPreset = (p) => setPresetState(p);

  return (
    <ThemeContext.Provider value={{ preset, setPreset, presets: Object.keys(PRESETS) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}

export const themePresets = PRESETS;
