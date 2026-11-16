import React from 'react';
import { useConnection } from '../../context/ConnectionContext';

interface MongoLensLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

interface ThemePalette {
  primary: string;
  secondary: string;
  highlight: string;
  accent: string;
  glow: string;
  diskDark: string;
}

const THEME_PALETTES: Record<string, ThemePalette> = {
  'theme-mongo': {
    primary: '#10b981', // Emerald
    secondary: '#06b6d4', // Cyan
    highlight: '#6ee7b7', // Light Emerald
    accent: '#3b82f6', // Blue
    glow: 'rgba(16, 185, 129, 0.35)',
    diskDark: '#047857'
  },
  'theme-postman': {
    primary: '#ff6c37', // Postman Orange
    secondary: '#38bdf8', // Sky Blue
    highlight: '#fed7aa', // Light Peach
    accent: '#f97316', // Deep Orange
    glow: 'rgba(255, 108, 55, 0.4)',
    diskDark: '#c2410c'
  },
  'theme-vscode': {
    primary: '#007acc', // VS Code Blue
    secondary: '#4ec9b0', // VS Code Teal
    highlight: '#9cdcfe', // Light Blue
    accent: '#0284c7', // Sky Blue
    glow: 'rgba(0, 122, 204, 0.4)',
    diskDark: '#0369a1'
  },
  'theme-cyberpunk': {
    primary: '#ec4899', // Hot Pink
    secondary: '#06b6d4', // Neon Cyan
    highlight: '#f0abfc', // Light Magenta
    accent: '#a855f7', // Neon Purple
    glow: 'rgba(236, 72, 153, 0.5)',
    diskDark: '#be185d'
  },
  'theme-light': {
    primary: '#059669', // Clean Emerald
    secondary: '#0284c7', // Cyan Blue
    highlight: '#34d399', // Mint
    accent: '#047857', // Forest
    glow: 'rgba(5, 150, 105, 0.25)',
    diskDark: '#065f46'
  }
};

export const MongoLensLogo: React.FC<MongoLensLogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = ''
}) => {
  let activeTheme = 'theme-mongo';
  try {
    const conn = useConnection();
    if (conn?.theme) {
      activeTheme = conn.theme;
    }
  } catch {
    // Graceful fallback outside provider
  }

  const palette = THEME_PALETTES[activeTheme] || THEME_PALETTES['theme-mongo'];

  const dimensions = {
    sm: { box: 'w-7 h-7', text: 'text-sm', badge: 'text-[9px] px-1 py-0.5' },
    md: { box: 'w-8 h-8', text: 'text-base', badge: 'text-[10px] px-1.5 py-0.5' },
    lg: { box: 'w-10 h-10', text: 'text-xl', badge: 'text-xs px-2 py-0.5' }
  }[size];

  const gradLensId = `lensGrad_${activeTheme}`;
  const gradDiskId = `diskGrad_${activeTheme}`;

  return (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      {/* SVG Icon Emblem (Theme-Adaptive) */}
      <div
        className={`${dimensions.box} rounded-lg flex items-center justify-center relative transition-all duration-300 group-hover:scale-105 flex-shrink-0`}
        style={{
          background: `linear-gradient(135deg, ${palette.primary}22, ${palette.secondary}18)`,
          border: `1px solid ${palette.primary}50`,
          boxShadow: `0 3px 12px ${palette.glow}`
        }}
        title={`MongoLens — Next-Gen MongoDB Web GUI (${activeTheme})`}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-0.5 transition-colors duration-300"
        >
          <defs>
            <linearGradient id={gradLensId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={palette.primary} />
              <stop offset="60%" stopColor={palette.secondary} />
              <stop offset="100%" stopColor={palette.accent} />
            </linearGradient>
            <linearGradient id={gradDiskId} x1="16" y1="0" x2="48" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={palette.diskDark} />
              <stop offset="50%" stopColor={palette.primary} />
              <stop offset="100%" stopColor={palette.highlight} />
            </linearGradient>
          </defs>

          {/* Database Disk Layers (Theme Primary / Disk Colors) */}
          {/* Bottom Disk */}
          <ellipse cx="32" cy="46" rx="17" ry="5.5" fill={palette.diskDark} opacity="0.85" />
          <path d="M15 46 v4 c0 3 7.6 5.5 17 5.5 s17 -2.5 17 -5.5 v-4 Z" fill={palette.diskDark} opacity="0.65" />
          <ellipse cx="32" cy="50" rx="17" ry="5.5" fill="none" stroke={palette.highlight} strokeWidth="0.8" opacity="0.6" />

          {/* Middle Disk */}
          <ellipse cx="32" cy="38" rx="17" ry="5.5" fill={palette.primary} opacity="0.9" />
          <path d="M15 38 v4 c0 3 7.6 5.5 17 5.5 s17 -2.5 17 -5.5 v-4 Z" fill={palette.diskDark} opacity="0.85" />
          <ellipse cx="32" cy="42" rx="17" ry="5.5" fill="none" stroke={palette.highlight} strokeWidth="0.8" opacity="0.75" />

          {/* Optical Focus Aperture Ring (Theme Lens Gradient) */}
          <circle cx="32" cy="25" r="14" fill="none" stroke={`url(#${gradLensId})`} strokeWidth="2.5" />
          <circle cx="32" cy="25" r="10" fill={`${palette.secondary}20`} stroke={palette.secondary} strokeWidth="1" />

          {/* Refractive Diamond Core Prism */}
          <polygon points="32,15 40,25 32,35 24,25" fill={`url(#${gradLensId})`} />
          <polygon points="32,15 40,25 32,25" fill={palette.highlight} opacity="0.85" />
          <polygon points="32,25 40,25 32,35" fill={palette.secondary} opacity="0.75" />
          <polygon points="24,25 32,25 32,35" fill={palette.diskDark} opacity="0.9" />
          <polygon points="24,25 32,15 32,25" fill={palette.highlight} opacity="0.65" />

          {/* Specular Core Glint */}
          <circle cx="32" cy="25" r="1.8" fill="#ffffff" />
        </svg>
      </div>

      {/* Stylized Typography Wordmark (Theme-Adaptive) */}
      {showWordmark && (
        <div className="flex items-center gap-1.5 leading-none">
          <div className="flex items-baseline">
            <span className={`font-extrabold tracking-tight text-[var(--text-primary)] ${dimensions.text}`}>
              Mongo
            </span>
            <span
              className={`font-black tracking-tight bg-clip-text text-transparent transition-all duration-300 ${dimensions.text}`}
              style={{
                backgroundImage: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 100%)`
              }}
            >
              Lens
            </span>
          </div>

          <span
            className={`font-mono font-bold tracking-wider rounded border uppercase transition-all duration-300 ${dimensions.badge}`}
            style={{
              color: palette.primary,
              backgroundColor: `${palette.primary}18`,
              borderColor: `${palette.primary}40`
            }}
          >
            Studio
          </span>
        </div>
      )}
    </div>
  );
};
