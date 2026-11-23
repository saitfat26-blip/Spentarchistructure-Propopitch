import React from 'react';
import {
  FastForward,
  Pause,
  Play,
  Rewind,
  SkipBack,
  SkipForward,
} from 'lucide-react';

export const TIMELINE_MIN_MYR = -500;
export const TIMELINE_MAX_MYR = 500;

export interface TimelineMilestone {
  epoch: number;
  label: string;
  short: string;
  primary?: boolean;
}

export const TIMELINE_MILESTONES: TimelineMilestone[] = [
  { epoch: -500, label: 'Formation', short: '-500 Myr', primary: true },
  { epoch: -250, label: 'Early Disk', short: '-250 Myr' },
  { epoch: 0, label: 'Current State', short: '0 Myr', primary: true },
  { epoch: 250, label: 'Mature', short: '+250 Myr' },
  { epoch: 500, label: 'Future Decay', short: '+500 Myr', primary: true },
];

export function getEpochPhaseLabel(epochMyr: number): string {
  if (epochMyr <= -300) return 'Formation';
  if (epochMyr < -40) return 'Early Disk';
  if (epochMyr <= 40) return 'Current State';
  if (epochMyr < 300) return 'Mature Winding';
  return 'Future Decay';
}

export function formatEpochMyr(epochMyr: number): string {
  const rounded = Math.round(epochMyr);
  if (rounded === 0) return '0 Myr';
  return `${rounded > 0 ? '+' : ''}${rounded} Myr`;
}

export interface GalaxyTimelineScrubProps {
  isLightMode: boolean;
  simEpoch: number;
  onScrubEpoch: (epochMyr: number) => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
  isPaused: boolean;
  playbackRate: number;
  onTogglePause: () => void;
  onRewind: () => void;
  onFastForward: () => void;
  onStepEpoch: (deltaMyr: number) => void;
  onJumpToPresent: () => void;
}

export function GalaxyTimelineScrub({
  isLightMode,
  simEpoch,
  onScrubEpoch,
  onScrubStart,
  onScrubEnd,
  isPaused,
  playbackRate,
  onTogglePause,
  onRewind,
  onFastForward,
  onStepEpoch,
  onJumpToPresent,
}: GalaxyTimelineScrubProps) {
  const isRewinding = !isPaused && playbackRate < 0;
  const isFastForwarding = !isPaused && playbackRate > 1;
  const isPlayingForward = !isPaused && playbackRate === 1;

  const btnNeutral = isLightMode
    ? 'bg-white border-[#D4CEC2] text-[#16213A] hover:border-[#1F3863]'
    : 'bg-[#141D38] border-[#26355E] text-[#D9E3FA] hover:border-[#6FCB9F]';

  const btnActive = isLightMode
    ? 'bg-[#1F3863] border-[#1F3863] text-white'
    : 'bg-[#6FCB9F] border-[#6FCB9F] text-[#0B1020]';

  const tickColor = isLightMode ? 'bg-[#1F3863]/40' : 'bg-[#8FA6E8]/45';
  const tickActiveColor = isLightMode ? 'bg-[#1C6E46]' : 'bg-[#6FCB9F]';

  return (
    <div
      className="space-y-1.5 text-[10px] font-mono"
      role="group"
      aria-label="Galaxy Simulation Timeline Scrub"
    >
      {/* Top Row: Label + Live Epoch & Evolutionary Stage + Transport Cluster */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold opacity-80 whitespace-nowrap">Timeline Scrub</span>
          <span className="opacity-35">·</span>
          <span
            className={`tabular-nums font-bold whitespace-nowrap ${
              isLightMode ? 'text-[#1F3863]' : 'text-[#6FCB9F]'
            }`}
          >
            {formatEpochMyr(simEpoch)}
          </span>
          <span className="opacity-75 truncate">· {getEpochPhaseLabel(simEpoch)}</span>
          <span className="opacity-55 tabular-nums whitespace-nowrap hidden sm:inline">
            · {isPaused ? 'Paused' : `${playbackRate > 0 ? '+' : ''}${playbackRate}×`}
          </span>
        </div>

        {/* Pause, Rewind, Fast-Forward & Step Transport Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onStepEpoch(-50)}
            aria-label="Step backward 50 million years"
            title="Step back 50 Myr"
            className={`hidden sm:inline-flex items-center gap-0.5 px-1.5 py-1 rounded-md border text-[9px] cursor-pointer transition-colors whitespace-nowrap ${btnNeutral}`}
          >
            <SkipBack className="w-2.5 h-2.5" />
            <span className="tabular-nums">-50</span>
          </button>

          <button
            type="button"
            onClick={onRewind}
            aria-label="Rewind galactic orbital simulation"
            title="Rewind simulation (-2× / -4× / -1×)"
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-semibold cursor-pointer transition-colors whitespace-nowrap ${
              isRewinding ? btnActive : btnNeutral
            }`}
          >
            <Rewind className="w-3 h-3" />
            <span className="tabular-nums">{isRewinding ? `${playbackRate}×` : 'Rewind'}</span>
          </button>

          <button
            type="button"
            onClick={onTogglePause}
            aria-label={isPaused ? 'Play orbital simulation' : 'Pause orbital simulation'}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[10px] font-semibold cursor-pointer transition-colors whitespace-nowrap ${
              isPlayingForward ? btnActive : btnNeutral
            }`}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            <span>{isPaused ? 'Play' : 'Pause'}</span>
          </button>

          <button
            type="button"
            onClick={onFastForward}
            aria-label="Fast-forward galactic orbital simulation"
            title="Fast-forward simulation (+2× / +4× / +1×)"
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-semibold cursor-pointer transition-colors whitespace-nowrap ${
              isFastForwarding ? btnActive : btnNeutral
            }`}
          >
            <FastForward className="w-3 h-3" />
            <span className="tabular-nums">
              {isFastForwarding ? `+${playbackRate}×` : 'FF'}
            </span>
          </button>

          <button
            type="button"
            onClick={onJumpToPresent}
            aria-label="Jump to Current State (0 Myr)"
            title="Jump to Current State (0 Myr)"
            className={`px-1.5 py-1 rounded-md border text-[9px] font-semibold cursor-pointer transition-colors whitespace-nowrap ${
              Math.abs(simEpoch) < 2 ? btnActive : btnNeutral
            }`}
          >
            0 Myr
          </button>

          <button
            type="button"
            onClick={() => onStepEpoch(50)}
            aria-label="Step forward 50 million years"
            title="Step forward 50 Myr"
            className={`hidden sm:inline-flex items-center gap-0.5 px-1.5 py-1 rounded-md border text-[9px] cursor-pointer transition-colors whitespace-nowrap ${btnNeutral}`}
          >
            <span className="tabular-nums">+50</span>
            <SkipForward className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Range-Input Timeline Scrubber (.spenta-slider) with Permanent Step Tick Markers */}
      <div className="relative flex items-center py-0.5">
        {/* Permanent Tick Marks at 0% (Formation), 50% (Current State), 100% (Future Decay) */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-[8px] w-[1.5px] h-2.5 rounded-full z-0 ${
            simEpoch <= -460 ? tickActiveColor : tickColor
          }`}
        />
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-1/2 -translate-x-1/2 w-[2px] h-3 rounded-full z-0 ${
            Math.abs(simEpoch) <= 30 ? tickActiveColor : tickColor
          }`}
        />
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute right-[8px] w-[1.5px] h-2.5 rounded-full z-0 ${
            simEpoch >= 460 ? tickActiveColor : tickColor
          }`}
        />

        <input
          type="range"
          list="spenta-galaxy-timeline-steps"
          min={TIMELINE_MIN_MYR}
          max={TIMELINE_MAX_MYR}
          step={1}
          value={Math.round(simEpoch)}
          onPointerDown={onScrubStart}
          onPointerUp={onScrubEnd}
          onPointerCancel={onScrubEnd}
          onBlur={onScrubEnd}
          onChange={(e) => onScrubEpoch(Number(e.target.value))}
          aria-label="Galaxy simulation timeline scrub from Formation (-500 Myr) through Current State (0 Myr) to Future Decay (+500 Myr)"
          aria-valuetext={`${formatEpochMyr(simEpoch)}, ${getEpochPhaseLabel(simEpoch)}`}
          className="relative z-10 w-full spenta-slider"
        />
        <datalist id="spenta-galaxy-timeline-steps">
          <option value={-500} label="Formation" />
          <option value={-250} label="Early Disk" />
          <option value={0} label="Current State" />
          <option value={250} label="Mature" />
          <option value={500} label="Future Decay" />
        </datalist>
      </div>

      {/* Permanent Step Labels: Formation · Current State · Future Decay (+ intermediate milestones on wider viewports) */}
      <div className="grid grid-cols-3 sm:grid-cols-5 items-start gap-1 text-[9px] tabular-nums pt-0.5">
        {TIMELINE_MILESTONES.map((m, idx) => {
          const near = Math.abs(simEpoch - m.epoch) <= 32;
          const alignClass =
            idx === 0
              ? 'justify-self-start text-left'
              : idx === TIMELINE_MILESTONES.length - 1
                ? 'justify-self-end text-right'
                : 'justify-self-center text-center';

          return (
            <button
              key={m.epoch}
              type="button"
              onClick={() => onScrubEpoch(m.epoch)}
              title={`Jump to ${m.label} (${m.short})`}
              className={`cursor-pointer transition-colors whitespace-nowrap leading-tight ${alignClass} ${
                !m.primary ? 'hidden sm:inline-flex flex-col items-center' : 'inline-flex flex-col'
              } ${
                idx === 0
                  ? 'items-start'
                  : idx === TIMELINE_MILESTONES.length - 1
                    ? 'items-end'
                    : 'items-center'
              } ${
                near
                  ? isLightMode
                    ? 'font-bold text-[#1F3863]'
                    : 'font-bold text-[#6FCB9F]'
                  : m.primary
                    ? isLightMode
                      ? 'font-semibold text-[#334155] hover:text-[#16213A]'
                      : 'font-semibold text-[#C3CCE4] hover:text-white'
                    : 'opacity-55 hover:opacity-100'
              }`}
            >
              <span>{m.label}</span>
              <span className="text-[8px] opacity-65">{m.short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
