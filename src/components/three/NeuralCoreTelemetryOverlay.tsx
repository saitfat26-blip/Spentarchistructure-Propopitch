import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  HardDrive,
  Layers,
  X,
} from 'lucide-react';

export interface NeuralCoreTelemetrySnapshot {
  fps: number;
  frameMs: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
  jsHeapMb: number | null;
  jsHeapLimitMb: number | null;
  gpuEstimateMb: number;
  rendererMode: 'hardware' | 'software';
}

export interface GravityWellInterferenceAlert {
  id: number;
  pairLabel: string;
  intersectionCount: number;
  activeFlashCount: number;
}

export const INITIAL_TELEMETRY_SNAPSHOT: NeuralCoreTelemetrySnapshot = {
  fps: 60,
  frameMs: 16.7,
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  programs: 0,
  jsHeapMb: null,
  jsHeapLimitMb: null,
  gpuEstimateMb: 0,
  rendererMode: 'hardware',
};

interface NeuralCoreTelemetryOverlayProps {
  mode: 'spiral-galaxy' | 'solar-map';
  isLightMode?: boolean;
  metrics: NeuralCoreTelemetrySnapshot;
  gravityWellAlert?: GravityWellInterferenceAlert | null;
  positionClassName?: string;
  compact?: boolean;
}

const GRAVITY_WELL_TOAST_DWELL_MS = 3600;

function formatTriangles(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(2)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return String(count);
}

export default function NeuralCoreTelemetryOverlay({
  mode,
  isLightMode = false,
  metrics,
  gravityWellAlert = null,
  positionClassName,
  compact = false,
}: NeuralCoreTelemetryOverlayProps) {
  const [expanded, setExpanded] = useState<boolean>(() => {
    if (compact) return false;
    if (typeof window !== 'undefined') return window.innerWidth >= 900;
    return true;
  });
  const [visibleAlert, setVisibleAlert] = useState<GravityWellInterferenceAlert | null>(null);

  useEffect(() => {
    if (compact) setExpanded(false);
  }, [compact]);

  useEffect(() => {
    if (mode !== 'solar-map' || !gravityWellAlert || gravityWellAlert.id <= 0) {
      setVisibleAlert(null);
      return;
    }

    setVisibleAlert(gravityWellAlert);
    const timer = window.setTimeout(() => {
      setVisibleAlert((current) =>
        current && current.id === gravityWellAlert.id ? null : current,
      );
    }, GRAVITY_WELL_TOAST_DWELL_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [mode, gravityWellAlert]);

  const isSolar = mode === 'solar-map';
  const defaultPosition = isSolar ? 'top-[60px] right-3' : 'top-3 right-3';
  const fpsSmoothRatio = Math.max(0.06, Math.min(1, metrics.fps / 60));

  const fpsColorStyle = isSolar
    ? metrics.fps >= 48
      ? '#68E4EF'
      : metrics.fps >= 24
        ? 'var(--solar-accent-amber-fg)'
        : '#FF894F'
    : isLightMode
      ? metrics.fps >= 48
        ? '#1C6E46'
        : metrics.fps >= 24
          ? '#B45309'
          : '#BE123C'
      : metrics.fps >= 48
        ? '#6FCB9F'
        : metrics.fps >= 24
          ? '#FBBF24'
          : '#FB7185';

  const containerStyle: React.CSSProperties | undefined = isSolar
    ? {
        backgroundColor: 'var(--solar-bg-panel)',
        borderColor: visibleAlert ? 'var(--solar-accent-amber)' : 'var(--solar-border-mid)',
        boxShadow: 'var(--solar-shadow-card)',
        color: 'var(--solar-fg-primary)',
      }
    : undefined;

  const containerClass = isSolar
    ? 'rounded-[8px] border'
    : isLightMode
      ? 'rounded-xl border bg-[#FAF8F4]/95 border-[#D4CEC2] text-[#16213A] shadow-md'
      : 'rounded-xl border bg-[#0B1124]/94 border-[#233157] text-[#E7EBF5] shadow-lg';

  const mutedTextClass = isSolar
    ? 'text-[var(--solar-fg-blue)]'
    : isLightMode
      ? 'text-[#5F6576]'
      : 'text-[#8E9DC2]';

  const brightTextClass = isSolar
    ? 'text-[var(--solar-fg-bright)]'
    : isLightMode
      ? 'text-[#16213A]'
      : 'text-[#F8FAFC]';

  const dividerStyle: React.CSSProperties | undefined = isSolar
    ? { borderColor: 'var(--solar-border-subtle)' }
    : undefined;

  const dividerClass = isSolar
    ? 'border-t'
    : isLightMode
      ? 'border-t border-[#E4DFD6]'
      : 'border-t border-[#1E2B4F]';

  const subCardStyle: React.CSSProperties | undefined = isSolar
    ? {
        backgroundColor: 'var(--solar-bg-chip)',
        borderColor: 'var(--solar-border-subtle)',
      }
    : undefined;

  const subCardClass = isSolar
    ? 'rounded-[6px] border px-2 py-1.5'
    : isLightMode
      ? 'rounded-lg border border-[#E4DFD6] bg-[#FFFFFF]/90 px-2 py-1.5'
      : 'rounded-lg border border-[#1E2B4F] bg-[#101933]/90 px-2 py-1.5';

  const heapPct =
    metrics.jsHeapMb !== null && metrics.jsHeapLimitMb && metrics.jsHeapLimitMb > 0
      ? Math.min(100, Math.round((metrics.jsHeapMb / metrics.jsHeapLimitMb) * 100))
      : null;

  return (
    <aside
      data-qa="neural-core-telemetry-overlay"
      aria-label={`3D Neural Core ${isSolar ? 'Solar System' : 'Spiral Galaxy'} Performance Telemetry`}
      className={`absolute ${positionClassName ?? defaultPosition} z-20 font-mono flex flex-col items-end gap-1.5`}
    >
      <div
        style={containerStyle}
        className={`transition-all ${expanded || (isSolar && visibleAlert) ? 'w-[232px]' : 'w-auto'} ${containerClass}`}
      >
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-label={
            expanded
              ? 'Collapse 3D Neural Core telemetry dashboard'
              : 'Expand 3D Neural Core telemetry dashboard'
          }
          data-qa="neural-core-telemetry-toggle"
          className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[10px] cursor-pointer transition-opacity hover:opacity-90"
        >
          <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.06em]">
            <Activity
              className="w-3 h-3 shrink-0"
              style={{ color: fpsColorStyle }}
              strokeWidth={2}
            />
            <span className={brightTextClass}>Telemetry</span>
            {isSolar && visibleAlert && (
              <AlertTriangle
                className="w-3 h-3 shrink-0"
                style={{ color: 'var(--solar-accent-amber-fg)' }}
                strokeWidth={2.1}
                aria-label="Gravity Well Interference"
              />
            )}
          </span>

          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <span style={{ color: fpsColorStyle }} className="font-bold">
              {metrics.fps} FPS
            </span>
            <span className={mutedTextClass}>·</span>
            <span className={mutedTextClass} data-qa="telemetry-header-draw-calls">
              {metrics.drawCalls} DC
            </span>
            {expanded ? (
              <ChevronUp className={`w-3 h-3 shrink-0 ${mutedTextClass}`} />
            ) : (
              <ChevronDown className={`w-3 h-3 shrink-0 ${mutedTextClass}`} />
            )}
          </span>
        </button>

        {expanded && (
          <div style={dividerStyle} className={`${dividerClass} px-2.5 py-2 space-y-1.5 text-[10px]`}>
            {/* Mode + Renderer Classification Row */}
            <div className="flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.06em]">
              <span className={mutedTextClass}>
                {isSolar ? 'Solar System Mode' : 'Spiral Galaxy Mode'}
              </span>
              <span
                style={
                  isSolar
                    ? { color: 'var(--solar-accent-amber-fg)' }
                    : { color: isLightMode ? '#1F3863' : '#97C4FF' }
                }
                className="font-semibold"
              >
                {metrics.rendererMode === 'software' ? 'SW WebGL' : 'GPU WebGL'}
              </span>
            </div>

            {/* Frame Rate & Frame Timing */}
            <div style={subCardStyle} className={subCardClass}>
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1 text-[9px] uppercase ${mutedTextClass}`}>
                  <Cpu className="w-2.5 h-2.5 shrink-0" strokeWidth={1.8} />
                  <span>Frame Rate</span>
                </span>
                <span
                  className="font-bold tabular-nums"
                  style={{ color: fpsColorStyle }}
                  data-qa="telemetry-fps-value"
                >
                  {metrics.fps} FPS{' '}
                  <span className={`font-normal ${mutedTextClass}`}>
                    ({metrics.frameMs.toFixed(1)} ms)
                  </span>
                </span>
              </div>
              <div
                className={`mt-1 h-[3px] w-full rounded-full overflow-hidden ${
                  isSolar ? 'bg-[#081226]' : isLightMode ? 'bg-[#E4DFD6]' : 'bg-[#172347]'
                }`}
              >
                <div
                  style={{
                    width: `${Math.round(fpsSmoothRatio * 100)}%`,
                    backgroundColor: fpsColorStyle,
                  }}
                  className="h-full rounded-full transition-all duration-200"
                />
              </div>
            </div>

            {/* Draw Calls & Triangles */}
            <div style={subCardStyle} className={subCardClass}>
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1 text-[9px] uppercase ${mutedTextClass}`}>
                  <Layers className="w-2.5 h-2.5 shrink-0" strokeWidth={1.8} />
                  <span>Draw Calls</span>
                </span>
                <span
                  className={`font-bold tabular-nums ${brightTextClass}`}
                  data-qa="telemetry-draw-calls-value"
                >
                  {metrics.drawCalls.toLocaleString()}{' '}
                  <span className={`font-normal ${mutedTextClass}`}>
                    ({formatTriangles(metrics.triangles)} tris)
                  </span>
                </span>
              </div>
            </div>

            {/* Memory Usage (JS Heap + GPU WebGL Buffers) */}
            <div style={subCardStyle} className={subCardClass}>
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1 text-[9px] uppercase ${mutedTextClass}`}>
                  <HardDrive className="w-2.5 h-2.5 shrink-0" strokeWidth={1.8} />
                  <span>Memory</span>
                </span>
                <span
                  className={`font-bold tabular-nums ${brightTextClass}`}
                  data-qa="telemetry-memory-value"
                >
                  {metrics.jsHeapMb !== null ? (
                    <>
                      {metrics.jsHeapMb.toFixed(1)} MB
                      {heapPct !== null ? (
                        <span className={`font-normal ${mutedTextClass}`}> ({heapPct}%)</span>
                      ) : null}
                    </>
                  ) : (
                    <>{metrics.gpuEstimateMb.toFixed(1)} MB VRAM</>
                  )}
                </span>
              </div>
              <div className={`mt-0.5 flex items-center justify-between text-[9px] tabular-nums ${mutedTextClass}`}>
                <span>
                  {metrics.geometries} geo · {metrics.textures} tex · {metrics.programs} prog
                </span>
                {metrics.jsHeapMb !== null && (
                  <span>~{metrics.gpuEstimateMb.toFixed(1)} MB GPU</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Temporary 'Gravity Well Interference' Toast Notification on Orbital Path Intersection */}
      {isSolar && visibleAlert && (
        <div
          role="status"
          aria-live="polite"
          data-qa="telemetry-gravity-well-toast"
          style={{
            backgroundColor: 'rgba(18, 16, 36, 0.96)',
            borderColor: 'var(--solar-accent-amber)',
            boxShadow: 'var(--solar-shadow-card)',
            color: 'var(--solar-fg-bright)',
          }}
          className="w-[232px] rounded-[8px] border px-2.5 py-2 text-[10px] transition-opacity duration-200 motion-reduce:transition-none"
        >
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex items-start gap-2 min-w-0">
              <span
                style={{
                  backgroundColor: 'rgba(255, 181, 99, 0.14)',
                  borderColor: 'var(--solar-accent-amber)',
                  color: 'var(--solar-accent-amber-fg)',
                }}
                className="grid place-items-center w-5 h-5 rounded-[5px] border shrink-0 mt-0.5"
              >
                <AlertTriangle className="w-3 h-3" strokeWidth={2.1} />
              </span>
              <div className="min-w-0">
                <div
                  style={{ color: 'var(--solar-accent-amber-fg)' }}
                  className="font-bold uppercase tracking-[0.05em] leading-tight"
                >
                  Gravity Well Interference
                </div>
                <div className="mt-0.5 text-[9.5px] text-[var(--solar-fg-primary)] truncate">
                  {visibleAlert.pairLabel}
                </div>
                <div className="mt-0.5 text-[9px] text-[var(--solar-border-cyan)] tabular-nums">
                  {visibleAlert.intersectionCount} orbital crossing
                  {visibleAlert.intersectionCount === 1 ? '' : 's'} detected
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setVisibleAlert(null)}
              aria-label="Dismiss Gravity Well Interference notice"
              className="p-0.5 rounded-[4px] text-[var(--solar-fg-blue)] hover:text-white cursor-pointer shrink-0"
            >
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
