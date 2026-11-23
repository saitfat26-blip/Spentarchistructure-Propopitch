import React, { useEffect } from 'react';
import { Link2, RotateCcw, X } from 'lucide-react';
import { NAV_TABS, SPENTA_CONTACT_EMAIL } from './data/spentaManifest';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { StackProvider, useStack } from './store/StackContext';
import { Navbar } from './components/Navbar';
import { StackComposerDrawer } from './components/StackComposerDrawer';
import { SpentaBrainVault } from './components/SpentaBrainVault';
import { InfographicsView } from './components/InfographicsView';
import { FinancialsView } from './components/FinancialsView';
import { SpentaCoreView } from './components/SpentaCoreView';
import { TheBrainView } from './components/TheBrainView';
import { PitchDeckView } from './components/PitchDeckView';
import { ResourcesView } from './components/ResourcesView';
import { SpentaLogo } from './components/SpentaLogo';
import { SpentaAiAssistant } from './components/SpentaAiAssistant';
import { GlobalSearchBar } from './components/GlobalSearchBar';
import { SpentaThemeView } from './components/SpentaThemeView';
import { MobileGridToggle } from './components/MobileGridToggle';
import { FlowProgressBar } from './components/FlowProgressBar';

function PortalShell() {
  const {
    activeTab,
    setActiveTab,
    commandPaletteOpen,
    setCommandPaletteOpen,
    sharedSnapshotSummary,
    dismissSharedSnapshot,
    resetToLocalDefaults,
  } = useStack();
  const { theme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K toggles the Global Search Bar
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        (event.key.toLowerCase() === 'k' || event.code === 'KeyK')
      ) {
        event.preventDefault();
        if (!event.repeat) {
          setCommandPaletteOpen(!commandPaletteOpen);
        }
        return;
      }

      // Alt + 1..7 switches directly between primary navigation tabs
      if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        const target = event.target as HTMLElement | null;
        const isEditable =
          target &&
          (target.isContentEditable ||
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
        if (isEditable) return;

        let tabIndex = -1;
        const codeMatch = /^(?:Digit|Numpad)([1-9])$/.exec(event.code);
        if (codeMatch) {
          tabIndex = Number(codeMatch[1]) - 1;
        } else if (/^[1-9]$/.test(event.key)) {
          tabIndex = Number(event.key) - 1;
        }

        if (tabIndex >= 0 && tabIndex < NAV_TABS.length) {
          event.preventDefault();
          setActiveTab(NAV_TABS[tabIndex]);
          if (commandPaletteOpen) {
            setCommandPaletteOpen(false);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setActiveTab, setCommandPaletteOpen]);

  return (
    <div className="min-h-screen spenta-canvas print:bg-white print:text-zinc-950 print:min-h-0 flex flex-col overflow-x-hidden print:overflow-visible transition-colors duration-150">
      <Navbar />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3.5 sm:px-6 py-5 sm:py-6 print:max-w-none print:p-0">
        <FlowProgressBar />

        {sharedSnapshotSummary && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-[#1F3863]/25 dark:border-[#8FA6E8]/30 spenta-surface px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 no-print"
          >
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#1F3863]/10 dark:bg-[#8FA6E8]/15 border border-[#1F3863]/20 dark:border-[#8FA6E8]/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <Link2 className="w-3.5 h-3.5 spenta-brand" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold spenta-ink">
                  Shared Architecture Snapshot Loaded
                </div>
                <div className="text-[11px] font-mono spenta-muted truncate">
                  {sharedSnapshotSummary}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={resetToLocalDefaults}
                className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1.5 rounded-lg spenta-band border hover:border-[#1F3863] dark:hover:border-[#8FA6E8] text-xs font-medium spenta-ink transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.6} />
                <span>Reset to Defaults</span>
              </button>
              <button
                type="button"
                onClick={dismissSharedSnapshot}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg spenta-muted hover:text-[#16213A] dark:hover:text-[#E7EBF5] hover:bg-[#F2EFE9] dark:hover:bg-[#1E2747] transition-colors cursor-pointer"
                aria-label="Dismiss shared snapshot notice"
              >
                <X className="w-4 h-4" strokeWidth={1.6} />
              </button>
            </div>
          </div>
        )}

        <SpentaThemeView viewId={activeTab}>
          {activeTab === 'App Vault' && <SpentaBrainVault />}
          {activeTab === 'Infographics' && <InfographicsView />}
          {activeTab === 'Financials' && <FinancialsView />}
          {activeTab === 'Spenta Core' && <SpentaCoreView />}
          {activeTab === 'The Brain' && <TheBrainView />}
          {activeTab === 'Pitch Deck' && <PitchDeckView />}
          {activeTab === 'Resources' && <ResourcesView />}
        </SpentaThemeView>
      </main>

      <footer className="spenta-band spenta-muted border-t mt-10 no-print">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <SpentaLogo className="h-6" tone={theme === 'dark' ? 'dark-bg' : 'light-bg'} />
            <span className="h-3.5 w-px bg-[#CFC8BC] dark:bg-[#232B4A] shrink-0" />
            <span className="font-mono text-[11px] spenta-muted truncate">
              Sovereign AI · ERP · Fintech · Voice · Spatial XR
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px]">
            <span>San Jose · Australia · 20-FTE Dhaka R&amp;D Hub</span>
            <span className="text-[#CFC8BC] dark:text-[#333F69]" aria-hidden="true">
              ·
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Resources');
                window.setTimeout(() => {
                  document
                    .getElementById('spenta-proposal-form')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }, 80);
              }}
              className="spenta-positive hover:underline cursor-pointer"
            >
              {SPENTA_CONTACT_EMAIL}
            </button>
          </div>
        </div>
      </footer>

      <GlobalSearchBar />
      <StackComposerDrawer />
      <MobileGridToggle />
      <SpentaAiAssistant />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <StackProvider>
        <PortalShell />
      </StackProvider>
    </ThemeProvider>
  );
}
