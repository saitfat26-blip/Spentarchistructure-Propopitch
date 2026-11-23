import React from 'react';
import { Grid3x3 } from 'lucide-react';
import { useStack } from '../store/StackContext';

/**
 * Mobile-only (<768px) floating architectural grid visibility toggle.
 * Manages the `spenta-mobile-grid-on` class on <html> via StackContext,
 * allowing mobile users to reveal or hide `.bg-obsidian-grid` surfaces
 * without cluttering compact viewports.
 */
export function MobileGridToggle() {
  const { mobileGridVisible, toggleMobileGrid } = useStack();

  return (
    <button
      type="button"
      onClick={toggleMobileGrid}
      aria-pressed={mobileGridVisible}
      aria-label={
        mobileGridVisible
          ? 'Disable 24×24 architectural grid on mobile'
          : 'Enable 24×24 architectural grid on mobile'
      }
      title={
        mobileGridVisible
          ? 'Swiss Grid: On (Tap to hide on mobile)'
          : 'Swiss Grid: Off (Tap to show on mobile)'
      }
      className={`md:hidden fixed bottom-[72px] right-4 z-30 inline-flex items-center justify-center w-11 h-11 rounded-xl border shadow-lg transition-all cursor-pointer no-print ${
        mobileGridVisible
          ? 'bg-[#1F3863] dark:bg-[#8FA6E8] text-white dark:text-[#0B1020] border-[#1F3863] dark:border-[#8FA6E8] ring-2 ring-[#1C6E46]/35 dark:ring-[#6FCB9F]/40'
          : 'bg-white/95 dark:bg-[#141A32]/95 text-[#5F6576] dark:text-[#A4ADC6] border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1F3863] dark:hover:border-[#8FA6E8]'
      }`}
    >
      <Grid3x3 className="w-4 h-4" strokeWidth={1.75} />
    </button>
  );
}
