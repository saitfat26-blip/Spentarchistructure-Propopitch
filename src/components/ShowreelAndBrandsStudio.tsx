import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Film, Layers, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import {
  BRAND_COLLABORATIONS,
  SHOWREEL_CHAPTERS,
  SHOWREEL_VIDEO_SRC,
  ShowreelChapter,
} from '../data/spentaEnrichments';
import { SPENTA_APPS } from '../data/spentaManifest';
import { useStack } from '../store/StackContext';

interface ShowreelAndBrandsStudioProps {
  seekSignal?: { seconds: number; nonce: number } | null;
}

function formatClock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function ShowreelAndBrandsStudio({ seekSignal }: ShowreelAndBrandsStudioProps) {
  const { selectedIds, toggleApp, setDrawerOpen } = useStack();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(182);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [sliderPaused, setSliderPaused] = useState(false);

  const activeChapter = useMemo<ShowreelChapter>(() => {
    let matched = SHOWREEL_CHAPTERS[0];
    for (const ch of SHOWREEL_CHAPTERS) {
      if (currentTime + 0.35 >= ch.seconds) {
        matched = ch;
      }
    }
    return matched;
  }, [currentTime]);

  const jumpToChapter = (seconds: number, autoPlay = true) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = seconds;
    setCurrentTime(seconds);
    if (autoPlay) {
      el.play().catch(() => {
        /* autoplay blocked by browser policy; user can press Play */
      });
    }
  };

  useEffect(() => {
    if (!seekSignal) return;
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const timer = window.setTimeout(() => {
      jumpToChapter(seekSignal.seconds, true);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [seekSignal]);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  };

  const handleAddChapterModules = (chapter: ShowreelChapter) => {
    chapter.appIds.forEach((id) => {
      if (!selectedIds.includes(id)) {
        toggleApp(id);
      }
    });
    setDrawerOpen(true);
  };

  const appNameMap = useMemo(
    () => Object.fromEntries(SPENTA_APPS.map((a) => [a.id, a.shortName])),
    [],
  );

  return (
    <div className="space-y-6">
      {/* Looping Brand Collaboration Slider */}
      <section className="rounded-2xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <div className="text-xs font-mono text-[#1C6E46] dark:text-[#6FCB9F] font-semibold">
              Enterprise Deployments &amp; Brand Collaborations · 16 Portfolio Partners
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#16213A] dark:text-[#E7EBF5] mt-0.5">
              Production Footprint Across Global &amp; Regional Leaders
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setSliderPaused((p) => !p)}
            aria-pressed={sliderPaused}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0B1020] text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] hover:border-[#1F3863] transition-colors self-start sm:self-auto whitespace-nowrap shrink-0 cursor-pointer"
          >
            {sliderPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{sliderPaused ? 'Resume Slider' : 'Pause Slider'}</span>
          </button>
        </div>

        <div className="spenta-brand-slider-mask py-2">
          <div
            className="spenta-brand-slider-track gap-3"
            style={sliderPaused ? { animationPlayState: 'paused' } : undefined}
          >
            {[0, 1].map((loopIdx) => (
              <div
                key={loopIdx}
                aria-hidden={loopIdx === 1}
                className={`flex items-center gap-3 pr-3 ${
                  loopIdx === 1 ? 'spenta-brand-slider-duplicate' : ''
                }`}
              >
                {BRAND_COLLABORATIONS.map((brand) => (
                  <div
                    key={`${loopIdx}-${brand.name}`}
                    className="flex flex-col justify-center px-4 py-2.5 rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0B1020] min-w-[178px] shrink-0"
                  >
                    <span className="text-sm font-bold text-[#16213A] dark:text-[#E7EBF5] whitespace-nowrap">
                      {brand.name}
                    </span>
                    <span className="text-[11px] text-[#5F6576] dark:text-[#8E96B0] whitespace-nowrap mt-0.5">
                      {brand.domain}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-[#5F6576] dark:text-[#8E96B0] mt-2">
          Collaborations and deployments per company portfolio, 2026; client-reported benchmarks. Hover any item to pause.
        </p>
      </section>

      {/* Interactive Chaptered 1080p Showreel Studio */}
      <section
        ref={sectionRef}
        id="spenta-showreel-studio"
        className="rounded-2xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-5 sm:p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-[#E4DFD6] dark:border-[#232B4A]">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#1C6E46] dark:text-[#6FCB9F] font-semibold">
              <Film className="w-3.5 h-3.5" />
              <span>Interactive Production Showreel · 1080p · 10 Indexed Chapters</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#16213A] dark:text-[#E7EBF5] mt-0.5">
              Spenta Sovereign OS — Spatial XR, Cleanroom VR &amp; Digital Twin Demo
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1F3863] dark:bg-[#8FA6E8] text-white dark:text-[#0B1020] text-xs font-semibold hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause Reel' : 'Play Showreel'}</span>
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0B1020] text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] hover:border-[#1F3863] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mt-5 items-start">
          {/* Video Viewport + Active Chapter Context */}
          <div className="xl:col-span-7 space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-[#060B18] border border-[#232B4A] aspect-video">
              <video
                ref={videoRef}
                src={SHOWREEL_VIDEO_SRC}
                controls
                muted={isMuted}
                playsInline
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={(e) => {
                  const d = e.currentTarget.duration;
                  if (Number.isFinite(d) && d > 0) setDuration(d);
                }}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                className="w-full h-full object-contain bg-black"
              />
            </div>

            <div className="rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0B1020] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-[#5F6576] dark:text-[#8E96B0] font-mono tabular-nums">
                  <span className="text-[#1C6E46] dark:text-[#6FCB9F] font-semibold">
                    Now Showing · {activeChapter.timestampLabel}
                  </span>
                  <span aria-hidden="true">/</span>
                  <span>{formatClock(currentTime)} of {formatClock(duration)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeChapter.sector}</span>
                </div>
                <div className="text-sm font-bold text-[#16213A] dark:text-[#E7EBF5] mt-1">
                  {activeChapter.title}
                </div>
                <p className="text-xs text-[#4A5568] dark:text-[#A4ADC6] mt-0.5">
                  {activeChapter.highlight}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleAddChapterModules(activeChapter)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1C6E46] dark:bg-[#6FCB9F] text-white dark:text-[#0B1020] text-xs font-semibold hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Add Matching Modules ({activeChapter.appIds.length})</span>
              </button>
            </div>
          </div>

          {/* Clickable Chapter Index */}
          <div className="xl:col-span-5">
            <div className="text-xs font-semibold text-[#5F6576] dark:text-[#8E96B0] mb-2">
              Jump directly to production chapters
            </div>
            <div className="space-y-1.5 max-h-[430px] overflow-y-auto pr-1">
              {SHOWREEL_CHAPTERS.map((ch) => {
                const isActive = activeChapter.id === ch.id;
                const moduleLabels = ch.appIds.map((id) => appNameMap[id] ?? id).join(' · ');
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => jumpToChapter(ch.seconds, true)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#1F3863]/10 dark:bg-[#8FA6E8]/15 border-[#1F3863]/50 dark:border-[#8FA6E8]/50'
                        : 'bg-[#FAF8F4] dark:bg-[#0B1020] border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1F3863]/40 dark:hover:border-[#8FA6E8]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#16213A] dark:text-[#E7EBF5] truncate">
                        {ch.title}
                      </span>
                      <span className="text-xs font-mono tabular-nums font-semibold text-[#1C6E46] dark:text-[#6FCB9F] shrink-0">
                        {ch.timestampLabel}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0] mt-0.5 truncate">
                      {ch.sector} · {moduleLabels}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
