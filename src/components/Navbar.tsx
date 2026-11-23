import React, { useState } from 'react';
import { Grid3x3, Layers, Menu, Moon, Search, Sparkles, Sun, X } from 'lucide-react';
import { NAV_TABS, NavTab } from '../data/spentaManifest';
import { useTheme } from '../context/ThemeContext';
import { useStack } from '../store/StackContext';
import { SpentaLogo } from './SpentaLogo';

export function Navbar() {
  const { theme, paletteMode, toggleTheme } = useTheme();
  const {
    activeTab,
    setActiveTab,
    selectedIds,
    drawerOpen,
    setDrawerOpen,
    setCommandPaletteOpen,
    setAiAssistantOpen,
    mobileGridVisible,
    toggleMobileGrid,
  } = useStack();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 h-14 bg-[#FAF8F4]/92 dark:bg-[#0B1020]/92 backdrop-blur-md text-[#16213A] dark:text-[#E7EBF5] border-b border-[#E4DFD6] dark:border-[#232B4A] transition-colors no-print">
      <div className="max-w-[1440px] mx-auto px-3.5 sm:px-6 h-full flex items-center justify-between gap-2.5 sm:gap-3">
        {/* Zone 1: Brand Wordmark + Subtle Hairline Divider */}
        <button
          type="button"
          onClick={() => handleSelectTab('App Vault')}
          className="flex items-center gap-2.5 shrink-0 cursor-pointer focus:outline-none"
          aria-label="Spenta Sovereign OS Home"
        >
          <SpentaLogo className="h-7" tone={theme === 'dark' ? 'dark-bg' : 'light-bg'} />
          <span className="hidden 2xl:block h-4 w-px bg-[#CFC8BC] dark:bg-[#232B4A]" />
          <span className="hidden 2xl:inline-block text-[11px] font-mono font-medium tracking-[0.12em] text-[#5F6576] dark:text-[#8E96B0] whitespace-nowrap">
            SOVEREIGN OS
          </span>
        </button>

        {/* Zone 2: 7 Clean Single-Line Navigation Tabs */}
        <nav
          aria-label="Primary portal navigation"
          className="hidden lg:flex items-center gap-0.5 xl:gap-1 overflow-x-auto no-scrollbar min-w-0"
        >
          {NAV_TABS.map((tab, idx) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleSelectTab(tab)}
                title={`${tab} (Alt+${idx + 1})`}
                aria-keyshortcuts={`Alt+${idx + 1}`}
                className={`relative whitespace-nowrap shrink-0 px-2 xl:px-2.5 py-1.5 rounded-md text-xs xl:text-[13px] font-medium transition-colors cursor-pointer ${
                  active
                    ? 'text-[#16213A] dark:text-[#E7EBF5] bg-[#F2EFE9] dark:bg-[#141A32]'
                    : 'text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-[#E7EBF5] hover:bg-[#F2EFE9]/70 dark:hover:bg-[#141A32]/70'
                }`}
              >
                {tab}
                {active && (
                  <span className="absolute inset-x-2 -bottom-[11px] h-[2px] bg-[#1F3863] dark:bg-[#8FA6E8] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Command Palette + Stone/Nocturnal Theme Toggle + Primary Stack Composer CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="inline-flex items-center justify-between gap-2 h-9 sm:h-8 px-2.5 sm:px-3 sm:w-56 md:w-72 lg:w-48 xl:w-64 2xl:w-80 rounded-md bg-[#F2EFE9] dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1F3863] dark:hover:border-[#8FA6E8] text-[#4A5163] dark:text-[#C8D0E4] text-xs transition-colors cursor-pointer whitespace-nowrap min-w-0"
            aria-label="Open Command Palette (Cmd+K)"
            title="Search apps, tabs, recipes, L1–L6… (⌘K)"
          >
            <span className="inline-flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
              <span className="hidden sm:inline truncate text-[#5F6576] dark:text-[#8E96B0]">
                Search apps, tabs, L1–L6…
              </span>
            </span>
            <kbd className="hidden sm:inline-block shrink-0 font-mono text-[10px] text-[#5F6576] dark:text-[#8E96B0] bg-white dark:bg-[#0B1020] border border-[#E4DFD6] dark:border-[#232B4A] px-1.5 py-0.5 rounded leading-none">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center justify-center gap-1.5 h-9 sm:h-8 px-2.5 sm:px-2 rounded-md bg-[#F2EFE9] dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1F3863] dark:hover:border-[#8FA6E8] text-[#16213A] dark:text-[#E7EBF5] text-xs font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            aria-label={
              paletteMode === 'nocturnal'
                ? 'Switch to Stone light theme'
                : 'Switch to Nocturnal dark theme'
            }
            title={
              paletteMode === 'nocturnal'
                ? 'Active: Nocturnal Navy (Click for Stone)'
                : 'Active: Stone Light (Click for Nocturnal)'
            }
          >
            {paletteMode === 'nocturnal' ? (
              <Sun className="w-3.5 h-3.5 text-[#8FA6E8]" strokeWidth={1.6} />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[#1F3863]" strokeWidth={1.6} />
            )}
            <span className="hidden xl:inline">
              {paletteMode === 'nocturnal' ? 'Nocturnal' : 'Stone'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="inline-flex items-center gap-1.5 h-9 sm:h-8 px-2.5 sm:px-3.5 rounded-md bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Layers className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            <span className="hidden sm:inline">Stack Composer</span>
            <span className="sm:hidden">Stack</span>
            <span className="font-mono tabular-nums bg-black/25 px-1.5 py-0.5 rounded text-[11px] leading-none">
              {selectedIds.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-md text-[#16213A] dark:text-[#E7EBF5] hover:bg-[#F2EFE9] dark:hover:bg-[#141A32] transition-colors cursor-pointer shrink-0"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4" strokeWidth={1.75} />
            ) : (
              <Menu className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] px-4 py-3.5 space-y-3 shadow-xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {NAV_TABS.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleSelectTab(tab)}
                  className={`min-h-[44px] px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#1F3863] dark:bg-[#8FA6E8] text-white dark:text-[#0B1020] font-semibold'
                      : 'bg-white dark:bg-[#141A32] text-[#16213A] dark:text-[#C8D0E4] hover:border-[#1F3863] dark:hover:border-[#8FA6E8] border border-[#E4DFD6] dark:border-[#232B4A]'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Mobile-only Display Density Setting for .bg-obsidian-grid */}
          <div className="md:hidden pt-2.5 border-t border-[#E4DFD6] dark:border-[#232B4A]">
            <button
              type="button"
              onClick={toggleMobileGrid}
              role="switch"
              aria-checked={mobileGridVisible}
              className="w-full min-h-[44px] flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1F3863] dark:hover:border-[#8FA6E8] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2 text-left min-w-0">
                <Grid3x3
                  className={`w-4 h-4 shrink-0 ${
                    mobileGridVisible
                      ? 'text-[#1C6E46] dark:text-[#6FCB9F]'
                      : 'text-[#5F6576] dark:text-[#8E96B0]'
                  }`}
                  strokeWidth={1.75}
                />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5]">
                    Swiss Architectural Grid
                  </span>
                  <span className="block text-[10px] font-mono text-[#5F6576] dark:text-[#8E96B0] truncate">
                    {mobileGridVisible
                      ? 'Active on mobile (.bg-obsidian-grid)'
                      : 'Hidden on mobile for clean density'}
                  </span>
                </span>
              </span>
              <span
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  mobileGridVisible
                    ? 'bg-[#1C6E46] dark:bg-[#6FCB9F]'
                    : 'bg-[#CFC8BC] dark:bg-[#2A355A]'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white dark:bg-[#0B1020] transition-transform ${
                    mobileGridVisible ? 'translate-x-4.5' : 'translate-x-1'
                  }`}
                />
              </span>
            </button>
          </div>

          <div className="pt-2.5 border-t border-[#E4DFD6] dark:border-[#232B4A] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setCommandPaletteOpen(true);
              }}
              className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-white dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A] text-xs font-medium text-[#16213A] dark:text-[#E7EBF5] cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Command Search</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setAiAssistantOpen(true);
              }}
              className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#1C6E46]/12 dark:bg-[#6FCB9F]/15 border border-[#1C6E46]/35 dark:border-[#6FCB9F]/35 text-xs font-semibold text-[#1C6E46] dark:text-[#6FCB9F] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>AI Advisor</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
