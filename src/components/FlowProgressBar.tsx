import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NAV_TABS, NavTab } from '../data/spentaManifest';
import { useStack } from '../store/StackContext';

export function FlowProgressBar() {
  const { activeTab, setActiveTab, visitedTabs, deckProgress, navigateToItem } = useStack();

  const tabIdx = Math.max(0, NAV_TABS.indexOf(activeTab));
  const totalTabs = NAV_TABS.length;
  const isDeckMode = activeTab === 'Pitch Deck' && deckProgress !== null;

  const currentStep = isDeckMode ? deckProgress.slideNumber : tabIdx + 1;
  const totalSteps = isDeckMode ? deckProgress.totalSlides : totalTabs;
  const progressRatio = totalSteps > 0 ? Math.min(1, Math.max(0, currentStep / totalSteps)) : 0;
  const progressPct = Math.round(progressRatio * 100);

  const prevTab: NavTab | null = tabIdx > 0 ? NAV_TABS[tabIdx - 1] : null;
  const nextTab: NavTab | null = tabIdx < totalTabs - 1 ? NAV_TABS[tabIdx + 1] : null;

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSlide = (slideNum: number) => {
    if (!deckProgress) return;
    const clamped = Math.max(1, Math.min(deckProgress.totalSlides, slideNum));
    navigateToItem('Pitch Deck', { type: 'slide', id: String(clamped) });
  };

  const handlePrev = () => {
    if (isDeckMode) {
      if (deckProgress.slideNumber > 1) {
        handleSelectSlide(deckProgress.slideNumber - 1);
      } else if (prevTab) {
        handleSelectTab(prevTab);
      }
      return;
    }
    if (prevTab) {
      handleSelectTab(prevTab);
    }
  };

  const handleNext = () => {
    if (isDeckMode) {
      if (deckProgress.slideNumber < deckProgress.totalSlides) {
        handleSelectSlide(deckProgress.slideNumber + 1);
      } else if (nextTab) {
        handleSelectTab(nextTab);
      }
      return;
    }
    if (nextTab) {
      handleSelectTab(nextTab);
    }
  };

  const canGoPrev = isDeckMode ? deckProgress.slideNumber > 1 || Boolean(prevTab) : Boolean(prevTab);
  const canGoNext = isDeckMode
    ? deckProgress.slideNumber < deckProgress.totalSlides || Boolean(nextTab)
    : Boolean(nextTab);

  const prevLabel = isDeckMode
    ? deckProgress.slideNumber > 1
      ? 'Prev slide'
      : prevTab ?? 'Previous'
    : prevTab ?? 'Previous';

  const nextLabel = isDeckMode
    ? deckProgress.slideNumber < deckProgress.totalSlides
      ? 'Next slide'
      : nextTab ?? 'Next'
    : nextTab ?? 'Next';

  const pad2 = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      className="mb-4 sm:mb-5 no-print"
      aria-label={isDeckMode ? 'Investor deck progress' : 'Portal navigation progress'}
    >
      <div className="flex items-center justify-between gap-3 pb-2 text-xs">
        {/* Left: Quiet unboxed typographic position indicator */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono tabular-nums text-[11px] font-medium text-[#1F3863] dark:text-[#8FA6E8] whitespace-nowrap shrink-0">
            {isDeckMode
              ? `Slide ${pad2(currentStep)} / ${pad2(totalSteps)}`
              : `Step ${pad2(currentStep)} / ${pad2(totalSteps)}`}
          </span>
          <span className="text-[#CFC8BC] dark:text-[#2E3862]" aria-hidden="true">
            ·
          </span>
          <span className="font-medium text-[#16213A] dark:text-[#E7EBF5] truncate">
            {isDeckMode ? deckProgress.trackLabel : activeTab}
          </span>
          {isDeckMode && deckProgress.section && (
            <>
              <span
                className="hidden sm:inline text-[#CFC8BC] dark:text-[#2E3862]"
                aria-hidden="true"
              >
                ·
              </span>
              <span className="hidden sm:inline text-[#5F6576] dark:text-[#8D97B5] truncate">
                {deckProgress.section}
              </span>
            </>
          )}
          {!isDeckMode && (
            <>
              <span
                className="hidden sm:inline text-[#CFC8BC] dark:text-[#2E3862]"
                aria-hidden="true"
              >
                ·
              </span>
              <span className="hidden sm:inline font-mono tabular-nums text-[11px] text-[#5F6576] dark:text-[#8D97B5] whitespace-nowrap shrink-0">
                {visitedTabs.length}/{totalTabs} visited
              </span>
            </>
          )}
        </div>

        {/* Center: Subtle clickable step ticks on desktop */}
        <div className="hidden md:flex items-center gap-1 flex-1 max-w-xs lg:max-w-sm mx-2">
          {isDeckMode
            ? Array.from({ length: totalSteps }, (_, idx) => {
                const slideNum = idx + 1;
                const isActive = slideNum === currentStep;
                const isCompleted = slideNum < currentStep;
                return (
                  <button
                    key={slideNum}
                    type="button"
                    onClick={() => handleSelectSlide(slideNum)}
                    title={`Slide ${pad2(slideNum)} of ${pad2(totalSteps)}`}
                    aria-label={`Jump to slide ${slideNum} of ${totalSteps}`}
                    aria-current={isActive ? 'step' : undefined}
                    className="group flex-1 py-2 -my-1.5 flex items-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3863] dark:focus-visible:ring-[#8FA6E8] rounded-xs"
                  >
                    <span
                      className={`block w-full rounded-full transition-colors duration-150 ${
                        isActive
                          ? 'h-[3px] bg-[#1F3863] dark:bg-[#8FA6E8]'
                          : isCompleted
                            ? 'h-[2px] bg-[#1F3863]/40 dark:bg-[#8FA6E8]/45 group-hover:bg-[#1F3863]/75 dark:group-hover:bg-[#8FA6E8]/80'
                            : 'h-[2px] bg-[#E4DFD6] dark:bg-[#232B4A] group-hover:bg-[#CFC8BC] dark:group-hover:bg-[#3A4674]'
                      }`}
                    />
                  </button>
                );
              })
            : NAV_TABS.map((tab, idx) => {
                const isActive = idx === tabIdx;
                const isVisited = visitedTabs.includes(tab);
                const isEarlier = idx < tabIdx;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleSelectTab(tab)}
                    title={`${tab} (Alt+${idx + 1})`}
                    aria-label={`Go to ${tab} (step ${idx + 1} of ${totalTabs})`}
                    aria-current={isActive ? 'step' : undefined}
                    className="group flex-1 py-2 -my-1.5 flex items-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3863] dark:focus-visible:ring-[#8FA6E8] rounded-xs"
                  >
                    <span
                      className={`block w-full rounded-full transition-colors duration-150 ${
                        isActive
                          ? 'h-[3px] bg-[#1F3863] dark:bg-[#8FA6E8]'
                          : isEarlier || isVisited
                            ? 'h-[2px] bg-[#1F3863]/35 dark:bg-[#8FA6E8]/40 group-hover:bg-[#1F3863]/75 dark:group-hover:bg-[#8FA6E8]/80'
                            : 'h-[2px] bg-[#E4DFD6] dark:bg-[#232B4A] group-hover:bg-[#CFC8BC] dark:group-hover:bg-[#3A4674]'
                      }`}
                    />
                  </button>
                );
              })}
        </div>

        {/* Right: Tabular percentage & lightweight Prev/Next step controls */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono tabular-nums text-[11px] text-[#5F6576] dark:text-[#8D97B5] whitespace-nowrap">
            {progressPct}%
          </span>
          <span className="h-3 w-px bg-[#E4DFD6] dark:bg-[#232B4A]" aria-hidden="true" />
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!canGoPrev}
              title={canGoPrev ? prevLabel : undefined}
              aria-label={prevLabel}
              className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded text-[11px] font-medium text-[#5F6576] dark:text-[#8D97B5] hover:text-[#16213A] dark:hover:text-[#E7EBF5] hover:bg-[#F2EFE9] dark:hover:bg-[#141A32] disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3863] dark:focus-visible:ring-[#8FA6E8]"
            >
              <ChevronLeft className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
              <span className="hidden xl:inline max-w-[100px] truncate">{prevLabel}</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              title={canGoNext ? nextLabel : undefined}
              aria-label={nextLabel}
              className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded text-[11px] font-medium text-[#16213A] dark:text-[#E7EBF5] hover:text-[#1F3863] dark:hover:text-[#8FA6E8] hover:bg-[#F2EFE9] dark:hover:bg-[#141A32] disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3863] dark:focus-visible:ring-[#8FA6E8]"
            >
              <span className="hidden sm:inline max-w-[116px] truncate">{nextLabel}</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      {/* Continuous 2px hairline progress track (compositor-only scaleX transition) */}
      <div
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={
          isDeckMode
            ? `${deckProgress.trackLabel}: slide ${currentStep} of ${totalSteps}`
            : `Portal flow: ${activeTab}, step ${currentStep} of ${totalSteps}`
        }
        className="h-[2px] w-full bg-[#E4DFD6] dark:bg-[#232B4A] overflow-hidden rounded-full"
      >
        <div
          className="h-full w-full origin-left bg-[#1F3863] dark:bg-[#8FA6E8] transition-transform duration-200 ease-out motion-reduce:transition-none"
          style={{ transform: `scaleX(${progressRatio})` }}
        />
      </div>
    </div>
  );
}
