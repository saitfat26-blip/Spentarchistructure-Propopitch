import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Grid3x3,
  Keyboard,
  Loader2,
  Presentation,
  Printer,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { PITCH_DECK_SLIDES, PitchSlide, SERVER_TIERS } from '../data/spentaManifest';
import {
  AI_SAFETY_CLIMATE_SLIDES,
  CTO_TECHNICAL_SLIDES,
  INVESTOR_MASTER_ADDITIONAL_SLIDES,
  PITCH_DECK_TRACKS,
  PitchDeckTrackId,
} from '../data/spentaEnrichments';
import { useStack } from '../store/StackContext';
import {
  PdfThemeOption,
  StackAppendixData,
  downloadSerializedPrintDeckPdf,
  exportPitchDeckToPdf,
} from '../utils/exportPitchDeckPdf';
import { SpentaLogo } from './SpentaLogo';

type ExportScope = 'all' | 'current' | 'range';

export function PitchDeckView() {
  const {
    pendingNavFocus,
    clearPendingNavFocus,
    selectedApps,
    stackMetrics,
    mobileGridVisible,
    toggleMobileGrid,
    setDeckProgress,
  } = useStack();
  const [activeTrack, setActiveTrack] = useState<PitchDeckTrackId>('investor-master');
  const [slideIdx, setSlideIdx] = useState(0);
  const [displayedIdx, setDisplayedIdx] = useState(0);
  const [transitionStage, setTransitionStage] = useState<'visible' | 'fading-out' | 'fading-in'>(
    'visible',
  );
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [showNotes, setShowNotes] = useState(true);
  const transitionTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const investorMasterSlides = useMemo<PitchSlide[]>(() => {
    const baseWithoutAsk = PITCH_DECK_SLIDES.slice(0, PITCH_DECK_SLIDES.length - 1);
    const askSlide = PITCH_DECK_SLIDES[PITCH_DECK_SLIDES.length - 1];
    return [...baseWithoutAsk, ...INVESTOR_MASTER_ADDITIONAL_SLIDES, askSlide].map((s, idx) => ({
      ...s,
      num: idx + 1,
    }));
  }, []);

  const activeSlides = useMemo<PitchSlide[]>(() => {
    if (activeTrack === 'cto-technical') return CTO_TECHNICAL_SLIDES;
    if (activeTrack === 'ai-safety-climate') return AI_SAFETY_CLIMATE_SLIDES;
    return investorMasterSlides;
  }, [activeTrack, investorMasterSlides]);

  const activeTrackMeta = useMemo(
    () => PITCH_DECK_TRACKS.find((t) => t.id === activeTrack) ?? PITCH_DECK_TRACKS[0],
    [activeTrack],
  );

  // High-Quality PDF Export state & modal options
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState<ExportScope>('all');
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(activeSlides.length);
  const [includeNotesInPdf, setIncludeNotesInPdf] = useState(true);
  const [includeStackAppendix, setIncludeStackAppendix] = useState(true);
  const [pdfTheme, setPdfTheme] = useState<PdfThemeOption>('auto');
  const [pdfState, setPdfState] = useState<'idle' | 'exporting' | 'done'>('idle');
  const [pdfProgress, setPdfProgress] = useState<string>('');
  const [blobPdfState, setBlobPdfState] = useState<'idle' | 'exporting' | 'done'>('idle');
  const [blobPdfProgress, setBlobPdfProgress] = useState<string>('');

  const total = activeSlides.length;
  const safeDisplayedIdx = Math.min(displayedIdx, total - 1);
  const safeSlideIdx = Math.min(slideIdx, total - 1);
  const slide = activeSlides[safeDisplayedIdx];
  const activeSlide = activeSlides[safeSlideIdx];
  const isDarkSlide = slide.theme === 'dark';

  useEffect(() => {
    setDeckProgress({
      slideNumber: safeSlideIdx + 1,
      totalSlides: total,
      trackLabel: activeTrackMeta.shortLabel,
      section: activeSlide.section,
      title: activeSlide.title,
    });
  }, [
    safeSlideIdx,
    total,
    activeTrackMeta.shortLabel,
    activeSlide.section,
    activeSlide.title,
    setDeckProgress,
  ]);

  const handleSelectTrack = (trackId: PitchDeckTrackId) => {
    if (trackId === activeTrack) return;
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const nextLength =
      trackId === 'cto-technical'
        ? CTO_TECHNICAL_SLIDES.length
        : trackId === 'ai-safety-climate'
          ? AI_SAFETY_CLIMATE_SLIDES.length
          : investorMasterSlides.length;
    setActiveTrack(trackId);
    setSlideIdx(0);
    setDisplayedIdx(0);
    setTransitionStage('visible');
    setRangeStart(1);
    setRangeEnd(nextLength);
  };

  const navigateToSlide = useCallback(
    (targetIdx: number) => {
      const clamped = Math.max(0, Math.min(total - 1, targetIdx));
      if (clamped === slideIdx && clamped === displayedIdx && transitionStage === 'visible') return;

      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      setSlideIdx(clamped);

      if (prefersReduced) {
        setDisplayedIdx(clamped);
        setTransitionStage('visible');
        return;
      }

      setSlideDir(clamped >= displayedIdx ? 1 : -1);
      setTransitionStage('fading-out');

      transitionTimerRef.current = window.setTimeout(() => {
        setDisplayedIdx(clamped);
        setTransitionStage('fading-in');
        rafRef.current = window.requestAnimationFrame(() => {
          rafRef.current = window.requestAnimationFrame(() => {
            setTransitionStage('visible');
          });
        });
      }, 140);
    },
    [total, slideIdx, displayedIdx, transitionStage],
  );

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const goPrev = () => navigateToSlide(slideIdx - 1);
  const goNext = () => navigateToSlide(slideIdx + 1);

  useEffect(() => {
    if (pendingNavFocus?.type === 'slide') {
      const num = Number(pendingNavFocus.id);
      if (num >= 1 && num <= total) {
        navigateToSlide(num - 1);
      }
      clearPendingNavFocus();
    }
  }, [pendingNavFocus, clearPendingNavFocus, total, navigateToSlide]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && exportModalOpen) {
        setExportModalOpen(false);
        return;
      }
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        navigateToSlide(slideIdx + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        navigateToSlide(slideIdx - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [exportModalOpen, navigateToSlide, slideIdx]);

  const buildStackAppendix = (): StackAppendixData | null => {
    if (!includeStackAppendix || selectedApps.length === 0) return null;
    const tierSpec = SERVER_TIERS[stackMetrics.tier];
    return {
      moduleCount: selectedApps.length,
      modules: selectedApps.map((a) => ({
        shortName: a.shortName,
        category: a.category,
        setupUsd: a.setupUsd,
        gmPct: a.gmPct,
        minServerTier: a.minServerTier,
        layers: a.layers,
      })),
      totalSetupUsd: stackMetrics.oneTimeBuildUsd,
      quarterlyRetainerUsd: stackMetrics.quarterlyRetainerUsd,
      blendedGmPct: stackMetrics.blendedGmPct,
      tierCode: tierSpec.code,
      tierName: tierSpec.name,
      tierHardware: `${tierSpec.hardware} (${tierSpec.vramRam})`,
      tierCapex: tierSpec.capex,
      tierSpeed: tierSpec.speed,
      activeLayers: Array.from(stackMetrics.activeLayers).sort(),
      synergyPairs: stackMetrics.synergyPairs,
    };
  };

  const handleExportPdf = async (scopeOverride?: ExportScope) => {
    const scope = scopeOverride ?? exportScope;
    setPdfState('exporting');
    setPdfProgress('Preparing slides…');

    let targetSlides = activeSlides;
    let filename = `Spenta-Sovereign-OS-${activeTrackMeta.filenameSlug}.pdf`;

    if (scope === 'current') {
      targetSlides = [activeSlide];
      filename = `Spenta-${activeTrackMeta.filenameSlug}-Slide-${String(activeSlide.num).padStart(2, '0')}.pdf`;
    } else if (scope === 'range') {
      const start = Math.max(1, Math.min(total, Math.min(rangeStart, rangeEnd)));
      const end = Math.max(1, Math.min(total, Math.max(rangeStart, rangeEnd)));
      targetSlides = activeSlides.slice(start - 1, end);
      filename = `Spenta-${activeTrackMeta.filenameSlug}-Slides-${String(start).padStart(2, '0')}-${String(end).padStart(
        2,
        '0',
      )}.pdf`;
    }

    try {
      await exportPitchDeckToPdf({
        slides: targetSlides,
        totalDeckSlides: total,
        includeSpeakerNotes: includeNotesInPdf,
        pdfTheme,
        stackAppendix: scope === 'current' ? null : buildStackAppendix(),
        filename,
        onProgress: (curr, tot) => {
          setPdfProgress(`Rendering ${curr} / ${tot}…`);
        },
      });
      setPdfState('done');
      setPdfProgress('');
      setExportModalOpen(false);
      window.setTimeout(() => setPdfState('idle'), 2600);
    } catch {
      setPdfState('idle');
      setPdfProgress('');
    }
  };

  // Serialize .pitch-deck-print-deck DOM content and trigger Blob-based PDF download
  const handleDownloadSerializedPrintDeck = async () => {
    setBlobPdfState('exporting');
    setBlobPdfProgress('Serializing deck…');
    try {
      await downloadSerializedPrintDeckPdf({
        containerSelector: '.pitch-deck-print-deck',
        filename: `Spenta-Sovereign-OS-${activeTrackMeta.filenameSlug}-Print.pdf`,
        onProgress: (curr, tot) => {
          setBlobPdfProgress(`Blob PDF ${curr}/${tot}…`);
        },
      });
      setBlobPdfState('done');
      setBlobPdfProgress('');
      window.setTimeout(() => setBlobPdfState('idle'), 2400);
    } catch {
      setBlobPdfState('idle');
      setBlobPdfProgress('');
    }
  };

  // Trigger browser print dialog scoped specifically to .pitch-deck-print-deck elements
  const handlePrintPitchDeck = () => {
    const printContainer = document.querySelector('.pitch-deck-print-deck');
    if (!printContainer) return;

    const root = document.documentElement;
    root.classList.add('printing-pitch-deck-only');

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      root.classList.remove('printing-pitch-deck-only');
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1200);
  };

  const kpiAccentClass = (accent?: 'emerald' | 'teal' | 'amber' | 'crimson') => {
    if (isDarkSlide) {
      if (accent === 'crimson') return 'text-[#FB7185]';
      if (accent === 'amber') return 'text-[#FCD34D]';
      if (accent === 'teal') return 'text-[#5EEAD4]';
      return 'text-[#34D399]';
    }
    if (accent === 'crimson') return 'text-[#E11D48]';
    if (accent === 'amber') return 'text-[#B45309]';
    if (accent === 'teal') return 'text-[#0D9488]';
    return 'text-[#065F46]';
  };

  const printAccentClass = (accent?: 'emerald' | 'teal' | 'amber' | 'crimson') => {
    if (accent === 'crimson') return 'print-accent-crimson';
    if (accent === 'amber') return 'print-accent-amber';
    if (accent === 'teal') return 'print-accent-teal';
    return 'print-accent-emerald';
  };

  return (
    <div className="space-y-5 print:space-y-0">
      {/* Header Bar + Multi-Track Deck Switcher */}
      <section className="rounded-2xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-4 sm:p-5 space-y-3 no-print pitch-deck-nav">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#1C6E46] dark:text-[#6FCB9F] uppercase tracking-[0.14em]">
              <Presentation className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>
                {total}-SLIDE TRACK · {activeTrackMeta.shortLabel.toUpperCase()}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#16213A] dark:text-[#E7EBF5] tracking-tight mt-0.5">
              Pitch Deck — {activeTrackMeta.label}
            </h1>
            <p className="text-xs text-[#5F6576] dark:text-[#8E96B0] mt-0.5">
              {activeTrackMeta.subtitle}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Pitch deck presentation track"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#F2EFE9] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A] self-start xl:self-auto"
          >
            {PITCH_DECK_TRACKS.map((track) => {
              const isSelected = track.id === activeTrack;
              return (
                <button
                  key={track.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleSelectTrack(track.id)}
                  className={`min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                      : 'text-[#4A5568] dark:text-[#A4ADC6] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                  }`}
                >
                  {track.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[#E4DFD6] dark:border-[#232B4A]">
          <span className="hidden 2xl:inline-flex items-center gap-1.5 text-xs font-mono text-[#5F6576] dark:text-[#8E96B0] bg-[#FAF8F4] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A] px-2.5 py-1.5 rounded-lg">
            <Keyboard className="w-3.5 h-3.5" strokeWidth={1.5} /> ← / → Arrows
          </span>

          <button
            type="button"
            disabled={pdfState === 'exporting'}
            onClick={() => handleExportPdf('current')}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 text-[#16213A] dark:text-[#E7EBF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Slide {String(activeSlide.num).padStart(2, '0')} PDF</span>
          </button>

          <button
            type="button"
            disabled={pdfState === 'exporting'}
            onClick={() => setExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 text-[#16213A] dark:text-[#E7EBF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            title="Configure PDF theme, slide range, speaker notes & stack appendix"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>PDF Options</span>
          </button>

          <button
            type="button"
            disabled={pdfState === 'exporting'}
            onClick={() => handleExportPdf('all')}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#E11D48] hover:bg-[#BE123C] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {pdfState === 'exporting' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : pdfState === 'done' ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
            )}
            <span>
              {pdfState === 'exporting'
                ? pdfProgress || 'Generating PDF…'
                : pdfState === 'done'
                  ? 'Deck PDF Exported'
                  : 'Export Full Deck PDF'}
            </span>
          </button>

          <button
            type="button"
            onClick={handlePrintPitchDeck}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 text-[#16213A] dark:text-[#E7EBF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Print full 18-slide .pitch-deck-print-deck to PDF via browser print dialog"
          >
            <Printer className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            className={`inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showNotes
                ? 'bg-[#1F3863] text-white border-[#1F3863] dark:bg-[#8FA6E8] dark:text-[#0B1020] dark:border-[#8FA6E8]'
                : 'bg-[#FAF8F4] dark:bg-[#0F1529] text-[#16213A] dark:text-[#E7EBF5] border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>{showNotes ? 'Hide Notes' : 'Show Notes'}</span>
          </button>

          <button
            type="button"
            onClick={toggleMobileGrid}
            aria-pressed={mobileGridVisible}
            className={`md:hidden inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mobileGridVisible
                ? 'border-[#1C6E46]/50 dark:border-[#6FCB9F]/50 bg-[#1C6E46]/10 dark:bg-[#6FCB9F]/15 text-[#1C6E46] dark:text-[#6FCB9F]'
                : 'bg-[#FAF8F4] dark:bg-[#0F1529] text-[#5F6576] dark:text-[#8E96B0] border-[#E4DFD6] dark:border-[#232B4A]'
            }`}
            title={
              mobileGridVisible
                ? 'Hide 24×24 architectural grid on mobile'
                : 'Show 24×24 architectural grid on mobile'
            }
          >
            <Grid3x3 className="w-3.5 h-3.5" strokeWidth={1.65} />
            <span>{mobileGridVisible ? 'Grid On' : 'Grid Off'}</span>
          </button>
        </div>
      </section>

      {/* Main Deck Stage + Slide Jump Rail (Screen Interactive View) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pitch-deck-screen-only">
        <aside className="lg:col-span-3 rounded-2xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-3 max-h-[260px] lg:max-h-[640px] overflow-y-auto order-2 lg:order-1 no-print pitch-deck-nav">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5F6576] dark:text-[#8E96B0] px-2 pb-2 border-b border-[#E4DFD6] dark:border-[#232B4A]">
            Slide Index ({total} Slides)
          </div>
          <div className="mt-2 space-y-1">
            {activeSlides.map((s, idx) => {
              const active = idx === safeSlideIdx;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => navigateToSlide(idx)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-start gap-2.5 ${
                    active
                      ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8]/18 dark:text-[#E7EBF5] dark:border dark:border-[#8FA6E8]/45 font-semibold'
                      : 'text-[#4A5568] dark:text-[#A4ADC6] hover:bg-[#FAF8F4] dark:hover:bg-[#0F1529]'
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] shrink-0 mt-0.5 tabular-nums ${
                      active ? 'text-[#6FCB9F]' : 'text-[#5F6576] dark:text-[#8E96B0]'
                    }`}
                  >
                    {String(s.num).padStart(2, '0')}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-[10px] font-mono uppercase ${
                        active ? 'text-[#A7E6C7]' : 'text-[#1C6E46] dark:text-[#6FCB9F]'
                      }`}
                    >
                      {s.section}
                    </span>
                    <span className="block truncate">{s.title}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="lg:col-span-9 min-w-0 space-y-4 order-1 lg:order-2">
          {/* 16:9 Aspect Slide Stage with Smooth Directional Fade-In/Out Transition */}
          <div
            className={`relative rounded-2xl border overflow-hidden transition-colors duration-200 motion-reduce:transition-none ${
              isDarkSlide
                ? 'bg-[#0B1020] bg-obsidian-grid text-[#E7EBF5] border-[#6FCB9F]/35'
                : 'bg-white text-[#16213A] border-[#E4DFD6] dark:border-[#232B4A]'
            }`}
          >
            <div
              className={`flex flex-col justify-between p-5 sm:p-8 lg:p-10 min-h-[380px] lg:aspect-[16/9] will-change-[opacity,transform] motion-reduce:transition-none motion-reduce:transform-none ${
                transitionStage === 'fading-out'
                  ? `transition-all duration-150 ease-in opacity-0 ${
                      slideDir === 1 ? '-translate-x-2' : 'translate-x-2'
                    }`
                  : transitionStage === 'fading-in'
                    ? `transition-none opacity-0 ${
                        slideDir === 1 ? 'translate-x-2' : '-translate-x-2'
                      }`
                    : 'transition-all duration-200 ease-out opacity-100 translate-x-0'
              }`}
            >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <SpentaLogo className="h-6 sm:h-7" tone={isDarkSlide ? 'dark-bg' : 'light-bg'} />
                <span
                  className={`font-mono text-[10px] sm:text-[11px] uppercase tracking-wider px-2 py-0.5 rounded border truncate ${
                    isDarkSlide
                      ? 'text-[#6FCB9F] border-[#6FCB9F]/30 bg-[#6FCB9F]/10'
                      : 'text-[#1C6E46] border-[#1C6E46]/30 bg-[#1C6E46]/10'
                  }`}
                >
                  {slide.section}
                </span>
              </div>
              <span
                className={`font-mono text-xs font-bold tabular-nums shrink-0 ${
                  isDarkSlide ? 'text-[#8E96B0]' : 'text-[#5F6576]'
                }`}
              >
                {String(slide.num).padStart(2, '0')} / {total}
              </span>
            </div>

            <div className="my-5 space-y-4 sm:space-y-5">
              <div>
                <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                  {slide.title}
                </h2>
                <p
                  className={`text-xs sm:text-base mt-2 max-w-3xl ${
                    isDarkSlide ? 'text-[#A4ADC6]' : 'text-[#4A5568]'
                  }`}
                >
                  {slide.subtitle}
                </p>
              </div>

              {slide.kpis && slide.kpis.length > 0 && (
                <div
                  className={`grid gap-3 ${
                    slide.kpis.length === 4
                      ? 'grid-cols-2 sm:grid-cols-4'
                      : slide.kpis.length === 3
                        ? 'grid-cols-1 sm:grid-cols-3'
                        : 'grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  {slide.kpis.map((kpi) => (
                    <div
                      key={kpi.label}
                      className={`rounded-xl p-3 sm:p-3.5 border ${
                        isDarkSlide
                          ? 'bg-[#141A32] border-[#232B4A]'
                          : 'bg-[#FAF8F4] border-[#E4DFD6]'
                      }`}
                    >
                      <div
                        className={`text-[10px] font-mono uppercase tracking-wider ${
                          isDarkSlide ? 'text-[#8E96B0]' : 'text-[#5F6576]'
                        }`}
                      >
                        {kpi.label}
                      </div>
                      <div
                        className={`font-mono text-base sm:text-xl font-extrabold mt-0.5 tabular-nums ${kpiAccentClass(
                          kpi.accent,
                        )}`}
                      >
                        {kpi.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <ul className="space-y-2 text-xs sm:text-sm">
                {slide.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5 leading-relaxed">
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 sm:mt-2 shrink-0 ${
                        isDarkSlide ? 'bg-[#6FCB9F]' : 'bg-[#1C6E46]'
                      }`}
                    />
                    <span className={isDarkSlide ? 'text-[#E7EBF5]' : 'text-[#4A5568]'}>{bullet}</span>
                  </li>
                ))}
              </ul>

              {slide.callout && (
                <div
                  className={`rounded-xl px-4 py-3 border text-xs ${
                    isDarkSlide
                      ? 'bg-[#6FCB9F]/10 border-[#6FCB9F]/35 text-[#E7EBF5]'
                      : 'bg-[#FAF8F4] border-[#E4DFD6] text-[#16213A]'
                  }`}
                >
                  <span
                    className={`font-mono font-bold uppercase mr-2 ${
                      isDarkSlide ? 'text-[#6FCB9F]' : 'text-[#1C6E46]'
                    }`}
                  >
                    {slide.callout.label}:
                  </span>
                  <span>{slide.callout.text}</span>
                </div>
              )}
            </div>

            <div
              className={`pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] font-mono ${
                isDarkSlide
                  ? 'border-[#232B4A] text-[#8E96B0]'
                  : 'border-[#E4DFD6] text-[#5F6576]'
              }`}
            >
              <span>spenta.tech · Sovereign OS</span>
              <span>Confidential Investor Briefing · hello@spenta.tech</span>
            </div>
            </div>
          </div>

          {/* Navigation Controls + Progress Bar */}
          <div className="rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] px-4 py-3 flex items-center justify-between gap-3 no-print pitch-deck-nav">
            <button
              type="button"
              disabled={slideIdx === 0}
              onClick={goPrev}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg bg-[#F2EFE9] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A] hover:bg-[#1F3863] hover:text-white dark:hover:bg-[#8FA6E8] dark:hover:text-[#0B1020] disabled:opacity-40 disabled:cursor-not-allowed text-[#16213A] dark:text-[#E7EBF5] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="sm:hidden font-mono text-xs font-bold tabular-nums text-[#4A5568] dark:text-[#A4ADC6]">
              {String(slideIdx + 1).padStart(2, '0')} / {total}
            </span>

            <div className="flex-1 max-w-md hidden sm:block">
              <div className="h-1.5 bg-[#F2EFE9] dark:bg-[#0F1529] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1C6E46] dark:bg-[#6FCB9F] transition-all duration-200"
                  style={{ width: `${((slideIdx + 1) / total) * 100}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              disabled={slideIdx === total - 1}
              onClick={goNext}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg bg-[#1F3863] dark:bg-[#8FA6E8] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white dark:text-[#0B1020] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Speaker Notes Drawer */}
          {showNotes && (
            <div className="rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#141A32] p-4">
              <div
                className={`transition-opacity duration-200 motion-reduce:transition-none ${
                  transitionStage === 'visible' ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1C6E46] dark:text-[#6FCB9F] mb-1">
                  Presenter Speaker Notes — Slide {String(slide.num).padStart(2, '0')}
                </div>
                <p className="text-xs sm:text-sm text-[#4A5568] dark:text-[#A4ADC6] leading-relaxed">
                  {slide.speakerNotes}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print-Only Paginated Active Track Executive Deck */}
      <div className="pitch-deck-print-deck">
        {activeSlides.map((s) => (
          <article key={`${activeTrack}-${s.num}`} className="pitch-deck-print-slide">
            {/* Top Slide Header */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <SpentaLogo className="h-6" tone="light-bg" />
                <span className="pitch-deck-print-badge font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                  {s.section}
                </span>
              </div>
              <span className="pitch-deck-print-counter font-mono text-xs font-bold tabular-nums shrink-0">
                {String(s.num).padStart(2, '0')} / {total}
              </span>
            </div>

            {/* Slide Body */}
            <div className="my-4 space-y-4">
              <div>
                <h2 className="tracking-tight">{s.title}</h2>
                <p className="pitch-deck-print-subtitle mt-1.5 max-w-4xl">{s.subtitle}</p>
              </div>

              {s.kpis && s.kpis.length > 0 && (
                <div
                  className={`grid gap-3 ${
                    s.kpis.length >= 4
                      ? 'grid-cols-4'
                      : s.kpis.length === 3
                        ? 'grid-cols-3'
                        : 'grid-cols-2'
                  }`}
                >
                  {s.kpis.map((kpi) => (
                    <div key={kpi.label} className="pitch-deck-print-kpi">
                      <div className="pitch-deck-print-kpi-label font-mono uppercase tracking-wider">
                        {kpi.label}
                      </div>
                      <div
                        className={`pitch-deck-print-kpi-value font-mono mt-0.5 tabular-nums ${printAccentClass(
                          kpi.accent,
                        )}`}
                      >
                        {kpi.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <ul className="space-y-2">
                {s.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5">
                    <span className="pitch-deck-print-bullet-dot w-1.5 h-1.5 rounded-full mt-2 shrink-0" />
                    <span className="pitch-deck-print-bullet-text">{bullet}</span>
                  </li>
                ))}
              </ul>

              {s.callout && (
                <div className="pitch-deck-print-callout">
                  <span className="pitch-deck-print-callout-label font-mono uppercase mr-2">
                    {s.callout.label}:
                  </span>
                  <span>{s.callout.text}</span>
                </div>
              )}

              {showNotes && (
                <div className="pitch-deck-print-notes">
                  <div className="pitch-deck-print-notes-title font-mono uppercase tracking-wider mb-0.5">
                    Presenter Speaker Notes — Slide {String(s.num).padStart(2, '0')}
                  </div>
                  <p>{s.speakerNotes}</p>
                </div>
              )}
            </div>

            {/* Slide Footer */}
            <div className="pitch-deck-print-footer flex items-center justify-between gap-2 font-mono">
              <span>spenta.tech · Sovereign OS · {activeTrackMeta.label}</span>
              <span>Confidential Briefing · hello@spenta.tech</span>
            </div>
          </article>
        ))}
      </div>

      {/* High-Quality PDF Export Configuration Modal */}
      {exportModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0B1020]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 no-print pitch-deck-nav"
          onClick={() => setExportModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Export Pitch Deck as High-Quality PDF"
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-[#1F3863] dark:bg-[#0F1529] text-white border-b border-white/10 dark:border-[#232B4A] flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#6FCB9F]">
                  WIDESCREEN 16:9 VECTOR PDF EXPORT
                </div>
                <h3 className="font-bold text-base mt-0.5">
                  Configure Investor Presentation PDF
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="p-2 rounded-lg text-[#CBD5E1] hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label="Close PDF options"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Scope Selector */}
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5F6576] dark:text-[#8E96B0] mb-2">
                  Slide Selection
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'all', label: `Full Deck (${total})` },
                      { id: 'current', label: `Slide ${String(slide.num).padStart(2, '0')} Only` },
                      { id: 'range', label: 'Custom Range' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setExportScope(opt.id)}
                      className={`min-h-[38px] px-3 py-2 rounded-lg font-semibold border transition-colors cursor-pointer ${
                        exportScope === opt.id
                          ? 'bg-[#1C6E46]/12 dark:bg-[#6FCB9F]/15 border-[#1C6E46] dark:border-[#6FCB9F] text-[#1C6E46] dark:text-[#6FCB9F]'
                          : 'bg-[#FAF8F4] dark:bg-[#0F1529] border-[#E4DFD6] dark:border-[#232B4A] text-[#4A5568] dark:text-[#A4ADC6]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {exportScope === 'range' && (
                  <div className="mt-2.5 grid grid-cols-2 gap-3 rounded-lg bg-[#FAF8F4] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A] p-3">
                    <label className="block">
                      <span className="text-[10px] font-mono uppercase text-[#5F6576] dark:text-[#8E96B0]">
                        From Slide
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={total}
                        value={rangeStart}
                        onChange={(e) => setRangeStart(Number(e.target.value))}
                        className="mt-1 w-full px-2.5 py-1.5 rounded bg-white dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A] font-mono text-xs text-[#16213A] dark:text-[#E7EBF5]"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-mono uppercase text-[#5F6576] dark:text-[#8E96B0]">
                        To Slide
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={total}
                        value={rangeEnd}
                        onChange={(e) => setRangeEnd(Number(e.target.value))}
                        className="mt-1 w-full px-2.5 py-1.5 rounded bg-white dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A] font-mono text-xs text-[#16213A] dark:text-[#E7EBF5]"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* PDF Color Theme */}
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5F6576] dark:text-[#8E96B0] mb-2">
                  Document Color Theme
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'auto', label: 'Deck Native' },
                      { id: 'dark', label: 'Nocturnal Dark' },
                      { id: 'light', label: 'Print-Friendly Light' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPdfTheme(opt.id)}
                      className={`min-h-[38px] px-3 py-2 rounded-lg font-semibold border transition-colors cursor-pointer ${
                        pdfTheme === opt.id
                          ? 'bg-[#1C6E46]/12 dark:bg-[#6FCB9F]/15 border-[#1C6E46] dark:border-[#6FCB9F] text-[#1C6E46] dark:text-[#6FCB9F]'
                          : 'bg-[#FAF8F4] dark:bg-[#0F1529] border-[#E4DFD6] dark:border-[#232B4A] text-[#4A5568] dark:text-[#A4ADC6]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Toggles */}
              <div className="space-y-2 pt-1">
                <label className="flex items-start gap-2.5 p-3 rounded-lg bg-[#FAF8F4] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeNotesInPdf}
                    onChange={(e) => setIncludeNotesInPdf(e.target.checked)}
                    className="mt-0.5 accent-[#1C6E46] dark:accent-[#6FCB9F] cursor-pointer"
                  />
                  <div>
                    <div className="font-semibold text-[#16213A] dark:text-[#E7EBF5]">
                      Include Presenter Speaker Notes
                    </div>
                    <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0]">
                      Renders a structured notes band at the bottom of each exported slide.
                    </div>
                  </div>
                </label>

                {exportScope !== 'current' && (
                  <label className="flex items-start gap-2.5 p-3 rounded-lg bg-[#FAF8F4] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeStackAppendix && selectedApps.length > 0}
                      disabled={selectedApps.length === 0}
                      onChange={(e) => setIncludeStackAppendix(e.target.checked)}
                      className="mt-0.5 accent-[#1C6E46] dark:accent-[#6FCB9F] cursor-pointer"
                    />
                    <div>
                      <div className="font-semibold text-[#16213A] dark:text-[#E7EBF5]">
                        Append Live Composed Stack Appendix ({selectedApps.length} modules)
                      </div>
                      <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0]">
                        Adds a final 16:9 sheet detailing your selected modules, build scope, GM%, and recommended on-prem server tier.
                      </div>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <div className="px-5 py-3.5 bg-[#FAF8F4] dark:bg-[#0F1529] border-t border-[#E4DFD6] dark:border-[#232B4A] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="min-h-[38px] px-3.5 py-2 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] text-[#4A5568] dark:text-[#A4ADC6] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pdfState === 'exporting'}
                onClick={() => handleExportPdf()}
                className="inline-flex items-center gap-2 min-h-[38px] px-4 py-2 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
              >
                {pdfState === 'exporting' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
                )}
                <span>
                  {pdfState === 'exporting' ? pdfProgress || 'Generating…' : 'Generate & Download PDF'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Print Pitch Deck & Serialized Blob PDF Action Bar (positioned bottom-left to stay clear of AI Advisor) */}
      <div
        className="fixed bottom-3.5 left-3 sm:bottom-4 sm:left-4 z-40 inline-flex items-center gap-1.5 p-1 rounded-xl bg-white/95 dark:bg-[#141A32]/95 backdrop-blur-md border border-[#E4DFD6] dark:border-[#232B4A] shadow-lg no-print pitch-deck-nav"
        role="region"
        aria-label="Pitch Deck Print and PDF Download Controls"
      >
        <button
          type="button"
          onClick={handlePrintPitchDeck}
          className="inline-flex items-center gap-2 min-h-[38px] px-3 sm:px-3.5 py-2 rounded-lg bg-[#1F3863] hover:bg-[#16213A] dark:bg-[#8FA6E8] dark:hover:bg-[#A6B9F0] text-white dark:text-[#0B1020] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Open browser print dialog targeting .pitch-deck-print-deck"
        >
          <Printer className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
          <span className="sm:hidden">Print</span>
          <span className="hidden sm:inline">Print Pitch Deck</span>
        </button>

        <button
          type="button"
          disabled={blobPdfState === 'exporting'}
          onClick={handleDownloadSerializedPrintDeck}
          className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-2 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 text-[#16213A] dark:text-[#E7EBF5] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          title="Serialize .pitch-deck-print-deck content and download as PDF Blob"
        >
          {blobPdfState === 'exporting' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          ) : blobPdfState === 'done' ? (
            <Check className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F] shrink-0" />
          ) : (
            <Download className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
          )}
          <span className="hidden sm:inline">
            {blobPdfState === 'exporting'
              ? blobPdfProgress || 'Serializing…'
              : blobPdfState === 'done'
                ? 'Blob PDF Saved'
                : 'Download Print PDF'}
          </span>
        </button>
      </div>
    </div>
  );
}
