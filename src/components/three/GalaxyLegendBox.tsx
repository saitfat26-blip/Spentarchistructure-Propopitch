import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Disc3, Flame, Orbit, Sparkles } from 'lucide-react';
import { GalaxyPresetId, GalaxyTypePreset } from './GalaxyPresetSelector';
import { formatEpochMyr } from './GalaxyTimelineScrub';

function LegendGlyph({ id, isLightMode }: { id: GalaxyPresetId; isLightMode: boolean }) {
  const accentClass =
    id === 'andromeda-spiral'
      ? isLightMode
        ? 'text-[#1C6E46]'
        : 'text-[#6FCB9F]'
      : id === 'elliptical-dense'
        ? isLightMode
          ? 'text-[#9A6700]'
          : 'text-[#F6C86E]'
        : id === 'procedural-nebula'
          ? isLightMode
            ? 'text-[#0F766E]'
            : 'text-[#2DD4BF]'
          : isLightMode
            ? 'text-[#B42318]'
            : 'text-[#F87171]';

  if (id === 'andromeda-spiral') {
    return <Orbit className={`w-3.5 h-3.5 shrink-0 ${accentClass}`} strokeWidth={1.85} />;
  }
  if (id === 'elliptical-dense') {
    return <Disc3 className={`w-3.5 h-3.5 shrink-0 ${accentClass}`} strokeWidth={1.85} />;
  }
  if (id === 'procedural-nebula') {
    return <Sparkles className={`w-3.5 h-3.5 shrink-0 ${accentClass}`} strokeWidth={1.85} />;
  }
  return <Flame className={`w-3.5 h-3.5 shrink-0 ${accentClass}`} strokeWidth={1.85} />;
}

export interface GalaxyLegendBoxProps {
  activePreset: GalaxyTypePreset;
  isLightMode: boolean;
  isNebulaTheme?: boolean;
  nebulaMode?: boolean;
  nebulaDensity?: number;
  particleTurbulence?: number;
  simEpoch: number;
  spinSpeed: number;
  orbitalDecay: number;
  starDensity: number;
  hitlConfidence: number;
  compact?: boolean;
}

export function GalaxyLegendBox({
  activePreset,
  isLightMode,
  isNebulaTheme = false,
  nebulaMode = false,
  nebulaDensity = 1.0,
  particleTurbulence = 0.75,
  simEpoch,
  spinSpeed,
  orbitalDecay,
  starDensity,
  hitlConfidence,
  compact = false,
}: GalaxyLegendBoxProps) {
  const [expanded, setExpanded] = useState<boolean>(() => {
    if (compact) return false;
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 640;
    }
    return true;
  });

  const opaPass = hitlConfidence >= 0.88;
  const dividerClass = isLightMode ? 'border-[#E4DFD6]' : 'border-[#1E2B4F]';
  const mutedTextClass = isLightMode ? 'text-[#5A6275]' : 'text-[#8E9DC2]';
  const bodyTextClass = isLightMode ? 'text-[#28334D]' : 'text-[#D6E0F5]';

  return (
    <div
      className="absolute top-3 left-3 z-10 flex flex-col gap-1 w-[calc(100%-24px)] max-w-[300px]"
      role="region"
      aria-label="Active Galaxy Type and Gravitational Characteristics"
    >
      <div
        style={
          isNebulaTheme && !isLightMode
            ? {
                backgroundColor: 'var(--nebula-bg-panel)',
                borderColor: 'var(--nebula-border-mid)',
                boxShadow: 'var(--nebula-shadow-glow)',
                color: 'var(--nebula-fg-bright)',
              }
            : undefined
        }
        className={`rounded-lg border shadow-md transition-colors overflow-hidden ${
          isNebulaTheme && !isLightMode
            ? ''
            : isLightMode
              ? 'bg-[#FAF8F4]/94 border-[#D4CEC2] text-[#16213A]'
              : 'bg-[#0A1024]/92 border-[#25345C] text-[#E7EBF5]'
        }`}
      >
        {isNebulaTheme && !isLightMode && (
          <div
            aria-hidden="true"
            style={{ backgroundImage: 'var(--nebula-gradient-filament)' }}
            className="h-[2px] w-full"
          />
        )}
        {/* Header Bar: Active Galaxy Type + Classification + OPA + Collapse Toggle */}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls="spenta-galaxy-legend-details"
          className="w-full flex items-center justify-between gap-2 px-2.5 py-2 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <LegendGlyph id={activePreset.id} isLightMode={isLightMode} />
            <div className="min-w-0">
              <div className="font-mono text-[11px] font-bold tracking-[0.02em] leading-tight truncate">
                {activePreset.label}
              </div>
              <div className={`font-mono text-[9px] tracking-[0.04em] truncate ${mutedTextClass}`}>
                {activePreset.classification} · {activePreset.massScale}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 font-mono text-[9px]">
            <span
              className={`tabular-nums font-semibold ${
                opaPass
                  ? isLightMode
                    ? 'text-[#1C6E46]'
                    : 'text-[#6FCB9F]'
                  : 'text-amber-500'
              }`}
            >
              OPA {hitlConfidence.toFixed(2)}
            </span>
            {expanded ? (
              <ChevronUp className={`w-3.5 h-3.5 ${mutedTextClass}`} />
            ) : (
              <ChevronDown className={`w-3.5 h-3.5 ${mutedTextClass}`} />
            )}
          </div>
        </button>

        {/* Collapsible Gravitational Characteristics Detail */}
        {expanded && (
          <div
            id="spenta-galaxy-legend-details"
            className={`px-2.5 pb-2 pt-1.5 border-t space-y-1.5 font-mono text-[10px] ${dividerClass}`}
          >
            <dl className="space-y-1">
              <div className="grid grid-cols-[72px_1fr] gap-1.5 leading-snug">
                <dt className={`text-[9px] uppercase tracking-[0.06em] ${mutedTextClass}`}>
                  Gravity
                </dt>
                <dd className={bodyTextClass}>{activePreset.gravityProfile}</dd>
              </div>
              <div className="grid grid-cols-[72px_1fr] gap-1.5 leading-snug">
                <dt className={`text-[9px] uppercase tracking-[0.06em] ${mutedTextClass}`}>
                  Kinematics
                </dt>
                <dd className={bodyTextClass}>{activePreset.orbitalMechanics}</dd>
              </div>
              <div className="grid grid-cols-[72px_1fr] gap-1.5 leading-snug">
                <dt className={`text-[9px] uppercase tracking-[0.06em] ${mutedTextClass}`}>
                  Regime
                </dt>
                <dd className={bodyTextClass}>{activePreset.escapeDynamics}</dd>
              </div>
            </dl>

            {/* Live Tabular Physics Readout */}
            <div
              className={`pt-1.5 border-t flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[9px] tabular-nums ${dividerClass} ${mutedTextClass}`}
            >
              <span>{formatEpochMyr(simEpoch)}</span>
              <span>{spinSpeed.toFixed(2)}× spin</span>
              <span>
                {orbitalDecay === 0 ? '0% decay' : `${Math.round(orbitalDecay * 100)}% decay`}
              </span>
              <span>{Math.round(starDensity * 100)}% stars</span>
              {nebulaMode && (
                <span className={isLightMode ? 'text-[#0F766E] font-semibold' : 'text-[#5EEAD4] font-semibold'}>
                  {Math.round(nebulaDensity * 100)}% nebula · {Math.round(particleTurbulence * 100)}% turb
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {!compact && (
        <div
          className={`pointer-events-none hidden sm:block text-[10px] font-mono px-1 ${
            isLightMode ? 'text-[#4A5163]' : 'text-[#8E9DC2]'
          }`}
        >
          Drag to orbit · Scroll to zoom · Click hub to inspect · H for controls
        </div>
      )}
    </div>
  );
}
