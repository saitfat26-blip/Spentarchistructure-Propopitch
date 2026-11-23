import React, { useCallback, useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useSpring } from 'framer-motion';
import {
  Compass,
  Hand,
  Maximize2,
  Minimize2,
  MousePointer2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export interface PathwayMiniMapPillar {
  id: string;
  index: string;
  label: string;
  isExpanded: boolean;
  isActiveHop: boolean;
  isPassedHop: boolean;
  activeAppCount: number;
}

interface PathwayPanZoomStageProps {
  children: React.ReactNode;
  isDark: boolean;
  pillars: PathwayMiniMapPillar[];
  activeHopLabel?: string | null;
  onFocusPillar?: (pillarId: string) => void;
  className?: string;
}

const MIN_SCALE = 0.65;
const MAX_SCALE = 1.85;
const SCALE_STEP = 0.15;

export function PathwayPanZoomStage({
  children,
  isDark,
  pillars,
  activeHopLabel = null,
  onFocusPillar,
  className = '',
}: PathwayPanZoomStageProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [scaleState, setScaleState] = useState<number>(1);
  const [wheelZoomEnabled, setWheelZoomEnabled] = useState<boolean>(false);
  const [panOnlyMode, setPanOnlyMode] = useState<boolean>(false);
  const [showMiniMap, setShowMiniMap] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  );
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [panSnapshot, setPanSnapshot] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [viewportDims, setViewportDims] = useState<{ w: number; h: number }>({ w: 720, h: 640 });

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rawScale = useMotionValue(1);
  const smoothScale = useSpring(rawScale, { stiffness: 300, damping: 30, mass: 0.55 });

  // Track viewport size for responsive drag constraints and mini-map reticle ratio
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const updateSize = () => {
      setViewportDims({
        w: Math.max(280, el.clientWidth),
        h: Math.max(320, el.clientHeight),
      });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keep lightweight pan coordinates synced for the Context Mini-Map viewport indicator
  useEffect(() => {
    const unsubX = x.on('change', (vx) => {
      setPanSnapshot((prev) => (Math.abs(prev.x - vx) > 1.5 ? { ...prev, x: vx } : prev));
    });
    const unsubY = y.on('change', (vy) => {
      setPanSnapshot((prev) => (Math.abs(prev.y - vy) > 1.5 ? { ...prev, y: vy } : prev));
    });
    return () => {
      unsubX();
      unsubY();
    };
  }, [x, y]);

  const clampScale = (next: number) =>
    Math.round(Math.min(MAX_SCALE, Math.max(MIN_SCALE, next)) * 100) / 100;

  const computeDragBounds = useCallback(
    (forScale: number) => {
      const contentH = contentRef.current?.scrollHeight ?? viewportDims.h;
      const scaledW = viewportDims.w * forScale;
      const scaledH = contentH * forScale;
      const horizontalSlack = Math.max(120, Math.round(Math.abs(scaledW - viewportDims.w) * 0.65 + 110));
      const verticalSlack = Math.max(140, Math.round(Math.abs(scaledH - viewportDims.h) * 0.65 + 140));
      return {
        left: -horizontalSlack,
        right: horizontalSlack,
        top: -verticalSlack,
        bottom: verticalSlack,
      };
    },
    [viewportDims.h, viewportDims.w],
  );

  const dragConstraints = computeDragBounds(scaleState);

  const applyScale = useCallback(
    (nextScale: number) => {
      const clamped = clampScale(nextScale);
      setScaleState(clamped);
      rawScale.set(clamped);
      const bounds = computeDragBounds(clamped);
      const curX = x.get();
      const curY = y.get();
      if (curX < bounds.left || curX > bounds.right) {
        animate(x, Math.max(bounds.left, Math.min(bounds.right, curX)), {
          type: 'spring',
          stiffness: 260,
          damping: 28,
        });
      }
      if (curY < bounds.top || curY > bounds.bottom) {
        animate(y, Math.max(bounds.top, Math.min(bounds.bottom, curY)), {
          type: 'spring',
          stiffness: 260,
          damping: 28,
        });
      }
    },
    [computeDragBounds, rawScale, x, y],
  );

  const handleZoomIn = useCallback(() => {
    applyScale(scaleState + SCALE_STEP);
  }, [applyScale, scaleState]);

  const handleZoomOut = useCallback(() => {
    applyScale(scaleState - SCALE_STEP);
  }, [applyScale, scaleState]);

  const handleResetView = useCallback(() => {
    setScaleState(1);
    rawScale.set(1);
    animate(x, 0, { type: 'spring', stiffness: 280, damping: 28 });
    animate(y, 0, { type: 'spring', stiffness: 280, damping: 28 });
  }, [rawScale, x, y]);

  const handleFitOverview = useCallback(() => {
    setScaleState(0.82);
    rawScale.set(0.82);
    animate(x, 0, { type: 'spring', stiffness: 280, damping: 28 });
    animate(y, 0, { type: 'spring', stiffness: 280, damping: 28 });
  }, [rawScale, x, y]);

  // Ctrl/Cmd + Wheel always zooms smoothly; plain wheel zooms when Wheel Zoom is toggled on
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!wheelZoomEnabled && !e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      applyScale(scaleState + delta);
    },
    [applyScale, scaleState, wheelZoomEnabled],
  );

  const isTransformed =
    Math.abs(scaleState - 1) > 0.01 ||
    Math.abs(panSnapshot.x) > 4 ||
    Math.abs(panSnapshot.y) > 4;

  // Mini-map viewport reticle math (normalized inside 128 x 68 preview frame)
  const reticleWidthPct = Math.min(100, Math.max(26, Math.round((1 / scaleState) * 86)));
  const reticleHeightPct = Math.min(100, Math.max(28, Math.round((1 / scaleState) * 78)));
  const maxPanX = Math.max(1, dragConstraints.right);
  const maxPanY = Math.max(1, dragConstraints.bottom);
  const normOffsetX = Math.max(-1, Math.min(1, -panSnapshot.x / maxPanX));
  const normOffsetY = Math.max(-1, Math.min(1, -panSnapshot.y / maxPanY));
  const reticleLeftPct = ((100 - reticleWidthPct) / 2) * (1 + normOffsetX);
  const reticleTopPct = ((100 - reticleHeightPct) / 2) * (1 + normOffsetY);

  const barSurface = isDark
    ? 'bg-[#0F1529]/95 border-[#232B4A] text-[#E7EBF5]'
    : 'bg-[#FAF8F4]/95 border-[#E4DFD6] text-[#16213A]';
  const btnIdle = isDark
    ? 'bg-[#141A32] border-[#232B4A] text-[#C3CCE4] hover:border-[#8FA6E8] hover:text-white'
    : 'bg-[#FFFFFF] border-[#E4DFD6] text-[#4A5163] hover:border-[#1F3863] hover:text-[#16213A]';
  const btnActive = isDark
    ? 'bg-[#8FA6E8] border-[#8FA6E8] text-[#0B1020]'
    : 'bg-[#1F3863] border-[#1F3863] text-white';

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Sticky Pan & Zoom Gesture Toolbar */}
      <div
        className={`px-3.5 sm:px-5 py-2 border-b flex flex-wrap items-center justify-between gap-2 ${barSurface}`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold ${
              isDark ? 'text-[#8FA6E8]' : 'text-[#1F3863]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Interactive Viewport</span>
          </span>
          <span
            className={`hidden sm:inline font-mono text-[10px] ${
              isDark ? 'text-[#8D97B5]' : 'text-[#5F6576]'
            }`}
          >
            · Drag to pan · {wheelZoomEnabled ? 'Scroll' : 'Ctrl+Scroll'} to zoom
          </span>
          {activeHopLabel && (
            <span
              className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                isDark
                  ? 'bg-[#2A2112] border-[#E0B063]/50 text-[#E0B063]'
                  : 'bg-[#FDF5E6] border-[#8A5C10]/40 text-[#8A5C10]'
              }`}
            >
              {activeHopLabel}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {/* Interact vs Dedicated Pan Gesture Mode */}
          <div
            role="group"
            aria-label="Canvas pointer gesture mode"
            className={`inline-flex items-center gap-0.5 p-0.5 rounded-lg border ${
              isDark ? 'bg-[#0B1020] border-[#232B4A]' : 'bg-[#F2EFE9] border-[#E4DFD6]'
            }`}
          >
            <button
              type="button"
              onClick={() => setPanOnlyMode(false)}
              aria-pressed={!panOnlyMode}
              title="Interact with nodes and drag canvas"
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[10px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                !panOnlyMode ? btnActive : isDark ? 'text-[#8D97B5] hover:text-white' : 'text-[#5F6576] hover:text-[#16213A]'
              }`}
            >
              <MousePointer2 className="w-3 h-3" strokeWidth={1.75} />
              <span>Explore</span>
            </button>
            <button
              type="button"
              onClick={() => setPanOnlyMode(true)}
              aria-pressed={panOnlyMode}
              title="Lock canvas to pure pan drag without triggering node clicks"
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[10px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                panOnlyMode ? btnActive : isDark ? 'text-[#8D97B5] hover:text-white' : 'text-[#5F6576] hover:text-[#16213A]'
              }`}
            >
              <Hand className="w-3 h-3" strokeWidth={1.75} />
              <span>Pan Hand</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scaleState <= MIN_SCALE}
              aria-label="Zoom out pathway"
              title="Zoom out (-15%)"
              className={`p-1.5 rounded-md border transition-colors cursor-pointer disabled:opacity-40 ${btnIdle}`}
            >
              <ZoomOut className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={handleResetView}
              title="Reset zoom and center canvas"
              className={`px-2 py-1 rounded-md border font-mono text-[10px] font-bold tabular-nums transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isTransformed ? btnActive : btnIdle
              }`}
            >
              {Math.round(scaleState * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scaleState >= MAX_SCALE}
              aria-label="Zoom in pathway"
              title="Zoom in (+15%)"
              className={`p-1.5 rounded-md border transition-colors cursor-pointer disabled:opacity-40 ${btnIdle}`}
            >
              <ZoomIn className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>

          <button
            type="button"
            onClick={scaleState < 0.9 ? handleResetView : handleFitOverview}
            title={scaleState < 0.9 ? 'Restore 100% scale' : 'Zoom out to overview (82%)'}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border font-mono text-[10px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${btnIdle}`}
          >
            {scaleState < 0.9 ? (
              <Maximize2 className="w-3 h-3" strokeWidth={1.75} />
            ) : (
              <Minimize2 className="w-3 h-3" strokeWidth={1.75} />
            )}
            <span>{scaleState < 0.9 ? '100%' : 'Overview'}</span>
          </button>

          <button
            type="button"
            onClick={() => setWheelZoomEnabled((v) => !v)}
            aria-pressed={wheelZoomEnabled}
            title="Toggle direct mouse-wheel zooming on the Pathway viewport"
            className={`px-2 py-1 rounded-md border font-mono text-[10px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              wheelZoomEnabled ? btnActive : btnIdle
            }`}
          >
            Scroll Zoom: {wheelZoomEnabled ? 'On' : 'Ctrl'}
          </button>

          <button
            type="button"
            onClick={() => setShowMiniMap((v) => !v)}
            aria-pressed={showMiniMap}
            className={`px-2 py-1 rounded-md border font-mono text-[10px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showMiniMap ? btnActive : btnIdle
            }`}
          >
            Mini-Map
          </button>
        </div>
      </div>

      {/* Framer Motion Gesture Pan & Zoom Canvas */}
      <div
        ref={viewportRef}
        onWheel={handleWheel}
        onDoubleClick={(e) => {
          const target = e.target as HTMLElement | null;
          if (target?.closest('button')) return;
          if (isTransformed) {
            handleResetView();
          } else {
            applyScale(1.25);
          }
        }}
        className={`relative overflow-hidden select-none min-h-[420px] sm:min-h-[540px] ${
          isDark ? 'bg-[#0B1020]' : 'bg-[#FAF8F4]'
        }`}
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(rgba(143,166,232,0.14) 1px, transparent 1px)'
            : 'radial-gradient(rgba(31,56,99,0.12) 1px, transparent 1px)',
          backgroundSize: `${Math.round(22 * scaleState)}px ${Math.round(22 * scaleState)}px`,
          touchAction: panOnlyMode ? 'none' : 'pan-y',
        }}
      >
        <motion.div
          ref={contentRef}
          drag
          dragConstraints={dragConstraints}
          dragElastic={0.08}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          style={{
            x,
            y,
            scale: smoothScale,
            transformOrigin: 'top center',
          }}
          className={`p-4 sm:p-6 space-y-5 origin-top will-change-transform ${
            isDragging
              ? 'cursor-grabbing'
              : panOnlyMode
                ? 'cursor-grab'
                : 'cursor-grab'
          }`}
        >
          <div className={panOnlyMode ? 'pointer-events-none' : ''}>{children}</div>
        </motion.div>

        {/* Pinned Architectural Context Mini-Map (Maintains Orientation While Zoomed / Panned) */}
        {showMiniMap && (
          <div
            className={`absolute bottom-3 right-3 z-20 w-[184px] rounded-[10px] border p-2.5 backdrop-blur-md shadow-lg transition-colors ${
              isDark
                ? 'bg-[#0F1529]/85 border-[#34416E]/85 text-[#E7EBF5]'
                : 'bg-[#FAF8F4]/88 border-[#CFC8BC]/90 text-[#16213A]'
            }`}
            aria-label="Pathway context mini-map"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5 font-mono text-[9px]">
              <span className={isDark ? 'text-[#8FA6E8] font-bold' : 'text-[#1F3863] font-bold'}>
                CONTEXT MAP
              </span>
              <span className={`tabular-nums ${isDark ? 'text-[#8D97B5]' : 'text-[#5F6576]'}`}>
                {Math.round(scaleState * 100)}% · {Math.round(panSnapshot.x)},{Math.round(panSnapshot.y)}
              </span>
            </div>

            {/* 5-Pillar Schematic + Live Viewport Reticle */}
            <div
              className={`relative h-[60px] rounded-md border p-1.5 overflow-hidden ${
                isDark ? 'bg-[#0B1020] border-[#232B4A]' : 'bg-[#F2EFE9] border-[#E4DFD6]'
              }`}
            >
              <div className="grid grid-cols-5 gap-1 h-full items-stretch">
                {pillars.map((pil) => (
                  <button
                    key={pil.id}
                    type="button"
                    onClick={() => {
                      onFocusPillar?.(pil.id);
                      animate(x, 0, { type: 'spring', stiffness: 280, damping: 28 });
                      animate(y, 0, { type: 'spring', stiffness: 280, damping: 28 });
                    }}
                    title={`Focus ${pil.index}. ${pil.label}`}
                    className={`rounded-sm border flex flex-col items-center justify-between py-1 px-0.5 cursor-pointer transition-colors ${
                      pil.isActiveHop
                        ? isDark
                          ? 'bg-[#2A2112] border-[#E0B063]'
                          : 'bg-[#FDF5E6] border-[#8A5C10]'
                        : pil.isPassedHop
                          ? isDark
                            ? 'bg-[#0F2A22] border-[#6FCB9F]'
                            : 'bg-[#EBF6F0] border-[#1C6E46]'
                          : pil.isExpanded
                            ? isDark
                              ? 'bg-[#161D3A] border-[#8FA6E8]/70'
                              : 'bg-[#EEF3FB] border-[#1F3863]/70'
                            : isDark
                              ? 'bg-[#141A32] border-[#232B4A]'
                              : 'bg-[#FFFFFF] border-[#CFC8BC]'
                    }`}
                  >
                    <span className="font-mono text-[7.5px] font-bold leading-none">
                      {pil.index}
                    </span>
                    <span
                      className={`w-full rounded-full ${
                        pil.isExpanded ? 'h-3.5' : 'h-1.5'
                      }`}
                      style={{
                        backgroundColor: pil.isActiveHop
                          ? isDark
                            ? '#E0B063'
                            : '#8A5C10'
                          : pil.isPassedHop || pil.activeAppCount > 0
                            ? isDark
                              ? '#6FCB9F'
                              : '#1C6E46'
                            : isDark
                              ? '#34416E'
                              : '#CFC8BC',
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Translucent Active Viewport Reticle */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute rounded border-[1.5px] transition-all duration-75"
                style={{
                  left: `${Math.max(0, Math.min(100 - reticleWidthPct, reticleLeftPct))}%`,
                  top: `${Math.max(0, Math.min(100 - reticleHeightPct, reticleTopPct))}%`,
                  width: `${reticleWidthPct}%`,
                  height: `${reticleHeightPct}%`,
                  borderColor: isDark ? '#8FA6E8' : '#1F3863',
                  backgroundColor: isDark
                    ? 'rgba(143, 166, 232, 0.14)'
                    : 'rgba(31, 56, 99, 0.1)',
                }}
              />
            </div>

            {isTransformed && (
              <button
                type="button"
                onClick={handleResetView}
                className={`mt-1.5 w-full py-0.5 rounded font-mono text-[9.5px] font-bold border transition-colors cursor-pointer ${btnIdle}`}
              >
                Recenter Canvas (100%)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
