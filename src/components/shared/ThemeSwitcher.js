import React from 'react';
import { useTheme, themePresets } from '../../theme';

export default function ThemeSwitcher({ style }) {
  const { preset, setPreset, presets } = useTheme();
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', ...style }}>
      {presets.map(p => (
        <button
          key={p}
          onClick={() => setPreset(p)}
          aria-pressed={preset === p}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: preset === p ? '2px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.03)',
            background: themePresets[p].accent,
            cursor: 'pointer'
          }}
        >{p[0].toUpperCase()}</button>
      ))}
    </div>
  );
}
