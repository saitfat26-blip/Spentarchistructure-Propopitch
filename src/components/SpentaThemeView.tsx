import React from 'react';
import { NavTab } from '../data/spentaManifest';
import { useTheme } from '../context/ThemeContext';

/**
 * Semantic Stone Light / Nocturnal Navy CSS utility classes backed by the
 * --spenta-* custom properties declared in src/index.css.
 */
export const SPENTA_THEME_CLASSES = {
  view: 'spenta-theme-view',
  canvas: 'spenta-canvas',
  band: 'spenta-band',
  surface: 'spenta-surface',
  border: 'spenta-border',
  borderStrong: 'spenta-border-strong',
  ink: 'spenta-ink',
  body: 'spenta-body',
  muted: 'spenta-muted',
  brand: 'spenta-brand',
  brandBg: 'spenta-brand-bg',
  brandTint: 'spenta-brand-tint',
  positive: 'spenta-positive',
  caution: 'spenta-caution',
  danger: 'spenta-danger',
} as const;

interface SpentaThemeViewProps {
  viewId: NavTab | string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Unified Stone / Nocturnal theme wrapper for every portal tab view.
 * Binds each view directly to the CSS design tokens defined in index.css
 * while keeping @media print exports paper-safe.
 */
export function SpentaThemeView({ viewId, children, className = '' }: SpentaThemeViewProps) {
  const { paletteMode } = useTheme();

  return (
    <div
      data-spenta-theme={paletteMode}
      data-spenta-view={viewId}
      className={`spenta-theme-view ${className}`.trim()}
    >
      {children}
    </div>
  );
}
