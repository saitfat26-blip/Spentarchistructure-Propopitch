import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  History,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { DeploymentProfileSpec } from '../data/deploymentProfiles';

export interface HopMetadataState {
  stage: string;
  enclaveState: string;
  policyDecision: string;
  auditProof: string;
  latencyMs: number;
}

export interface WalkthroughHop {
  stepNumber: number;
  trunkId: string;
  branchId: string;
  nodeCode: string;
  title: string;
  transitionLabel: string;
  payloadSummary: string;
  latencyTarget: string;
  pitfallMitigation: string;
  highlightCompKind?: 'capability' | 'protocol' | 'hardware' | 'synergy' | 'proof';
  metadataState: HopMetadataState;
}

export interface RequestWalkthroughTrace {
  id: 'banking-icr' | 'hospital-hl7' | 'xltd-baas';
  label: string;
  subtitle: string;
  hops: WalkthroughHop[];
}

export type PlaybackSpeed = 0.75 | 1 | 1.5;

export interface ActivationHistoryEntry {
  id: string;
  traceId: RequestWalkthroughTrace['id'];
  traceLabel: string;
  hopIdx: number;
  trunkId: string;
  branchId: string;
  nodeCode: string;
  label: string;
  source: 'play' | 'step' | 'jump' | 'trace' | 'branch';
}

interface PathwayHopPlaybackProps {
  traces: RequestWalkthroughTrace[];
  activeTrace: RequestWalkthroughTrace;
  activeHopIdx: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  isDark: boolean;
  activeProfile: DeploymentProfileSpec;
  historyStack: ActivationHistoryEntry[];
  historyCursor: number;
  onSelectTrace: (id: RequestWalkthroughTrace['id']) => void;
  onTogglePlay: () => void;
  onStepPrev: () => void;
  onStepNext: () => void;
  onSelectHop: (idx: number) => void;
  onReset: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  onHistoryBack: () => void;
  onHistoryForward: () => void;
  onJumpToHistory: (index: number) => void;
  onInspectHopIn3D?: () => void;
}

function formatCumulativeLatency(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${ms}ms`;
}

export function PathwayHopPlayback({
  traces,
  activeTrace,
  activeHopIdx,
  isPlaying,
  speed,
  isDark,
  activeProfile,
  historyStack,
  historyCursor,
  onSelectTrace,
  onTogglePlay,
  onStepPrev,
  onStepNext,
  onSelectHop,
  onReset,
  onSpeedChange,
  onHistoryBack,
  onHistoryForward,
  onJumpToHistory,
  onInspectHopIn3D,
}: PathwayHopPlaybackProps) {
  const totalHops = activeTrace.hops.length;
  const currentHop = activeHopIdx >= 0 ? activeTrace.hops[activeHopIdx] ?? null : null;
  const previousHop = activeHopIdx > 0 ? activeTrace.hops[activeHopIdx - 1] ?? null : null;
  const isCompleted = activeHopIdx === totalHops - 1 && !isPlaying;

  const canHistoryBack = historyCursor > 0;
  const canHistoryForward = historyCursor >= 0 && historyCursor < historyStack.length - 1;
  const backTarget = canHistoryBack ? historyStack[historyCursor - 1] : null;
  const forwardTarget = canHistoryForward ? historyStack[historyCursor + 1] : null;

  const progressPct = activeHopIdx >= 0 ? Math.round(((activeHopIdx + 1) / totalHops) * 100) : 0;
  const cumulativeMs =
    activeHopIdx >= 0
      ? activeTrace.hops
          .slice(0, activeHopIdx + 1)
          .reduce((sum, hop) => sum + hop.metadataState.latencyMs, 0)
      : 0;

  const mutedText = isDark ? 'text-[#8D97B5]' : 'text-[#5F6576]';
  const secondaryText = isDark ? 'text-[#C3CCE4]' : 'text-[#4A5163]';
  const activeGreen = isDark ? '#6FCB9F' : '#1C6E46';
  const hopAmber = isDark ? '#E0B063' : '#8A5C10';
  const brandBlue = isDark ? '#8FA6E8' : '#1F3863';

  return (
    <div
      className={`border-b transition-colors ${
        isDark ? 'bg-[#0D1326] border-[#232B4A]' : 'bg-[#F7F4EE] border-[#E4DFD6]'
      }`}
      aria-label="Hop-by-hop request playback controller"
    >
      {/* Top Transport Controls Row */}
      <div className="px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Trace Selector */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className={`font-mono text-[10px] font-bold shrink-0 ${mutedText}`}>
            Hop-by-Hop Trace:
          </span>
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Request walkthrough scenario"
          >
            {traces.map((tr) => {
              const selected = tr.id === activeTrace.id;
              return (
                <button
                  key={tr.id}
                  type="button"
                  onClick={() => onSelectTrace(tr.id)}
                  aria-pressed={selected}
                  className={`px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selected
                      ? isDark
                        ? 'bg-[#161D3A] border-[#8FA6E8] text-[#8FA6E8]'
                        : 'bg-[#EEF3FB] border-[#1F3863] text-[#1F3863]'
                      : isDark
                        ? 'bg-[#141A32] border-[#232B4A] text-[#C3CCE4] hover:border-[#7FA6FF]'
                        : 'bg-[#FFFFFF] border-[#E4DFD6] text-[#4A5163] hover:border-[#1F3863]'
                  }`}
                >
                  {tr.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Playback Transport Buttons (Play / Pause / Step Back & Forward / History / Speed / Reset) */}
        <div
          className="flex flex-wrap items-center gap-2 shrink-0"
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' && activeHopIdx > 0) {
              e.preventDefault();
              onStepPrev();
            } else if (e.key === 'ArrowRight' && activeHopIdx < totalHops - 1) {
              e.preventDefault();
              onStepNext();
            }
          }}
        >
          <div
            role="group"
            aria-label="Hop-by-hop step playback"
            className={`inline-flex items-center gap-1 p-1 rounded-lg border ${
              isDark ? 'bg-[#0B1020] border-[#232B4A]' : 'bg-[#FFFFFF] border-[#E4DFD6]'
            }`}
          >
            <button
              type="button"
              onClick={onTogglePlay}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isPlaying
                  ? isDark
                    ? 'bg-[#E0B063] text-[#0B1020]'
                    : 'bg-[#8A5C10] text-white'
                  : isDark
                    ? 'bg-[#8FA6E8] text-[#0B1020] hover:bg-[#7FA6FF]'
                    : 'bg-[#1F3863] text-white hover:bg-[#12233F]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>{isCompleted ? 'Replay' : 'Play'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onStepPrev}
              disabled={activeHopIdx <= 0}
              aria-label="Step back to previous hop"
              title="Step back to previous hop (Left Arrow)"
              className={`inline-flex items-center gap-0.5 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                activeHopIdx > 0
                  ? isDark
                    ? 'text-[#E7EBF5] hover:bg-[#161D3A]'
                    : 'text-[#16213A] hover:bg-[#EEF3FB]'
                  : secondaryText
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <span className="font-mono text-[11px] font-bold px-1 tabular-nums">
              {activeHopIdx >= 0 ? `${activeHopIdx + 1}/${totalHops}` : `0/${totalHops}`}
            </span>

            <button
              type="button"
              onClick={onStepNext}
              disabled={activeHopIdx >= totalHops - 1}
              aria-label="Step forward to next hop"
              title="Step forward to next hop (Right Arrow)"
              className={`inline-flex items-center gap-0.5 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                activeHopIdx < totalHops - 1
                  ? isDark
                    ? 'text-[#E7EBF5] hover:bg-[#161D3A]'
                    : 'text-[#16213A] hover:bg-[#EEF3FB]'
                  : secondaryText
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onReset}
              disabled={activeHopIdx < 0 && !isPlaying && historyStack.length === 0}
              aria-label="Reset playback and history"
              title="Reset hop-by-hop playback and navigation history"
              className={`p-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${mutedText}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Manual Back / Forward Node Activation History Controls */}
          <div
            role="group"
            aria-label="Node activation history navigation"
            className={`inline-flex items-center gap-1 p-1 rounded-lg border ${
              isDark ? 'bg-[#0B1020] border-[#232B4A]' : 'bg-[#FFFFFF] border-[#E4DFD6]'
            }`}
          >
            <span
              className={`hidden sm:inline-flex items-center gap-1 pl-1.5 pr-0.5 font-mono text-[10px] font-semibold ${mutedText}`}
              title="Chronological activation history"
            >
              <History className="w-3 h-3" strokeWidth={1.75} />
            </span>
            <button
              type="button"
              onClick={onHistoryBack}
              disabled={!canHistoryBack}
              title={
                backTarget
                  ? `Back to ${backTarget.nodeCode} · ${backTarget.label}`
                  : 'No earlier node activation in history'
              }
              aria-label="Step back in activation history"
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                canHistoryBack
                  ? isDark
                    ? 'text-[#E7EBF5] hover:bg-[#161D3A]'
                    : 'text-[#16213A] hover:bg-[#EEF3FB]'
                  : mutedText
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Back</span>
            </button>

            <span
              className={`font-mono text-[10px] font-semibold px-1 tabular-nums ${mutedText}`}
              title="Current position in activation history"
            >
              {historyStack.length > 0 ? `${historyCursor + 1}/${historyStack.length}` : '0/0'}
            </span>

            <button
              type="button"
              onClick={onHistoryForward}
              disabled={!canHistoryForward}
              title={
                forwardTarget
                  ? `Forward to ${forwardTarget.nodeCode} · ${forwardTarget.label}`
                  : 'No later node activation in history'
              }
              aria-label="Step forward in activation history"
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                canHistoryForward
                  ? isDark
                    ? 'text-[#E7EBF5] hover:bg-[#161D3A]'
                    : 'text-[#16213A] hover:bg-[#EEF3FB]'
                  : mutedText
              }`}
            >
              <span>Forward</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>

          {/* Speed Segmented Toggle */}
          <div
            role="group"
            aria-label="Playback speed"
            className={`inline-flex items-center gap-0.5 p-1 rounded-lg border ${
              isDark ? 'bg-[#0B1020] border-[#232B4A]' : 'bg-[#FFFFFF] border-[#E4DFD6]'
            }`}
          >
            {([0.75, 1, 1.5] as const).map((spd) => {
              const active = speed === spd;
              return (
                <button
                  key={spd}
                  type="button"
                  onClick={() => onSpeedChange(spd)}
                  aria-pressed={active}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
                    active
                      ? isDark
                        ? 'bg-[#161D3A] text-[#8FA6E8]'
                        : 'bg-[#EEF3FB] text-[#1F3863]'
                      : mutedText
                  }`}
                >
                  {spd}×
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Linear Playback Progress Bar & Status Cue */}
      <div
        className={`px-4 sm:px-6 pb-2.5 flex flex-wrap items-center justify-between gap-2 text-[10.5px] font-mono tabular-nums ${mutedText}`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
          <div
            className={`flex-1 h-1.5 rounded-full overflow-hidden ${
              isDark ? 'bg-[#1B2340]' : 'bg-[#E4DFD6]'
            }`}
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Hop-by-hop playback progress"
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${progressPct}%`,
                backgroundColor: isCompleted ? activeGreen : hopAmber,
              }}
            />
          </div>
          <span className="shrink-0 font-semibold">
            {activeHopIdx < 0
              ? 'Idle · Ready to step'
              : isPlaying
                ? `Playing Hop ${activeHopIdx + 1} of ${totalHops}`
                : isCompleted
                  ? `Verified ${totalHops}/${totalHops} Hops`
                  : `Paused at Hop ${activeHopIdx + 1}/${totalHops}`}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span>
            Cumulative SLA:{' '}
            <strong style={{ color: activeHopIdx >= 0 ? activeGreen : undefined }}>
              {activeHopIdx >= 0 ? formatCumulativeLatency(cumulativeMs) : '—'}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>Target: {activeProfile.switcherLabel}</span>
        </div>
      </div>

      {/* Interactive Chronological Node Activation History Trail */}
      {historyStack.length > 0 && (
        <div
          className={`px-4 sm:px-6 py-2 border-t flex items-center gap-2 overflow-x-auto ${
            isDark ? 'border-[#232B4A]/70 bg-[#0B1020]/50' : 'border-[#E4DFD6]/80 bg-[#FFFFFF]/70'
          }`}
          aria-label="Chronological node activation history"
        >
          <span
            className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold shrink-0 ${mutedText}`}
          >
            <History className="w-3 h-3" strokeWidth={1.75} />
            <span>History Trail:</span>
          </span>
          <div className="flex items-center gap-1 min-w-max">
            {historyStack.map((entry, idx) => {
              const isCurrent = idx === historyCursor;
              const isFuture = idx > historyCursor;
              return (
                <React.Fragment key={entry.id}>
                  {idx > 0 && (
                    <ArrowRight
                      className={`w-3 h-3 shrink-0 ${
                        isFuture
                          ? isDark
                            ? 'text-[#2E3862]'
                            : 'text-[#CFC8BC]'
                          : isDark
                            ? 'text-[#6FCB9F]/70'
                            : 'text-[#1C6E46]/70'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => onJumpToHistory(idx)}
                    aria-current={isCurrent ? 'location' : undefined}
                    title={`${entry.traceLabel} — ${entry.nodeCode}: ${entry.label}`}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono text-[10px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isCurrent
                        ? isDark
                          ? 'bg-[#2A2112] border-[#E0B063] text-[#E0B063] font-bold'
                          : 'bg-[#FDF5E6] border-[#8A5C10] text-[#8A5C10] font-bold'
                        : isFuture
                          ? isDark
                            ? 'bg-transparent border-[#2E3862] border-dashed text-[#6E7896] hover:text-[#C3CCE4] hover:border-[#7FA6FF]'
                            : 'bg-transparent border-[#CFC8BC] border-dashed text-[#7B8294] hover:text-[#16213A] hover:border-[#1F3863]'
                          : isDark
                            ? 'bg-[#10261F]/70 border-[#6FCB9F]/45 text-[#C3CCE4] hover:border-[#6FCB9F]'
                            : 'bg-[#ECF7F1]/80 border-[#1C6E46]/35 text-[#16213A] hover:border-[#1C6E46]'
                    }`}
                  >
                    <span className="tabular-nums opacity-75">#{idx + 1}</span>
                    <span className="font-bold">{entry.nodeCode}</span>
                    <span className="max-w-[110px] truncate font-sans text-[10.5px]">
                      {entry.label}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Hop-by-Hop Sequence Track (Nodes + Directed Transitions + Metadata Stages) */}
      <div
        className={`px-4 sm:px-6 py-3 border-t overflow-x-auto ${
          isDark ? 'border-[#232B4A]/80 bg-[#0B1020]/70' : 'border-[#E4DFD6]/90 bg-[#FAF8F4]/90'
        }`}
      >
        <div className="flex items-stretch gap-1.5 min-w-[700px]">
          {activeTrace.hops.map((hop, idx) => {
            const state: 'idle' | 'completed' | 'active' | 'queued' =
              activeHopIdx < 0
                ? 'idle'
                : idx < activeHopIdx
                  ? 'completed'
                  : idx === activeHopIdx
                    ? 'active'
                    : 'queued';

            const stateLabel =
              state === 'completed'
                ? 'Passed'
                : state === 'active'
                  ? isPlaying
                    ? 'Executing'
                    : 'Active'
                  : state === 'queued'
                    ? 'Queued'
                    : 'Ready';

            const nextEdgeState: 'idle' | 'traversed' | 'inflight' | 'pending' =
              activeHopIdx < 0
                ? 'idle'
                : idx + 1 < activeHopIdx
                  ? 'traversed'
                  : idx + 1 === activeHopIdx
                    ? 'inflight'
                    : 'pending';

            return (
              <React.Fragment key={`${activeTrace.id}-hop-${hop.stepNumber}`}>
                <button
                  type="button"
                  onClick={() => onSelectHop(idx)}
                  aria-current={state === 'active' ? 'step' : undefined}
                  className={`flex-1 min-w-[132px] text-left rounded-lg border px-2.5 py-2 transition-all duration-150 cursor-pointer ${
                    state === 'active'
                      ? isDark
                        ? 'bg-[#2A2112]/90 border-[#E0B063]'
                        : 'bg-[#FDF5E6] border-[#8A5C10]'
                      : state === 'completed'
                        ? isDark
                          ? 'bg-[#10261F]/80 border-[#6FCB9F]/70'
                          : 'bg-[#ECF7F1] border-[#1C6E46]/60'
                        : state === 'queued'
                          ? isDark
                            ? 'bg-[#141A32]/65 border-[#2E3862] border-dashed'
                            : 'bg-[#FFFFFF]/80 border-[#B8C4DA] border-dashed'
                          : isDark
                            ? 'bg-[#141A32] border-[#232B4A] hover:border-[#7FA6FF]'
                            : 'bg-[#FFFFFF] border-[#E4DFD6] hover:border-[#1F3863]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 font-mono text-[9.5px] tabular-nums">
                    <span
                      className="font-bold"
                      style={{
                        color:
                          state === 'active'
                            ? hopAmber
                            : state === 'completed'
                              ? activeGreen
                              : brandBlue,
                      }}
                    >
                      0{hop.stepNumber} · {hop.nodeCode}
                    </span>
                    <span
                      className="inline-flex items-center gap-0.5 font-semibold"
                      style={{
                        color:
                          state === 'active'
                            ? hopAmber
                            : state === 'completed'
                              ? activeGreen
                              : isDark
                                ? '#8D97B5'
                                : '#5F6576',
                      }}
                    >
                      {state === 'completed' && <Check className="w-2.5 h-2.5" strokeWidth={2.5} />}
                      <span>{stateLabel}</span>
                    </span>
                  </div>
                  <div className="text-[11px] font-bold mt-1 leading-tight line-clamp-1">
                    {hop.title}
                  </div>
                  <div className={`font-mono text-[9px] mt-0.5 truncate ${secondaryText}`}>
                    {hop.metadataState.stage}
                  </div>
                  <div className={`font-mono text-[9px] mt-0.5 tabular-nums ${mutedText}`}>
                    {hop.latencyTarget}
                  </div>
                </button>

                {/* Directed Transition Connector Between Consecutive Hops */}
                {idx < totalHops - 1 && (
                  <div
                    className="flex flex-col items-center justify-center px-0.5 shrink-0 w-10"
                    aria-hidden="true"
                  >
                    <span
                      className="font-mono text-[8.5px] truncate max-w-[40px] mb-0.5 font-semibold"
                      style={{
                        color:
                          nextEdgeState === 'inflight'
                            ? hopAmber
                            : nextEdgeState === 'traversed'
                              ? activeGreen
                              : isDark
                                ? '#6E7896'
                                : '#7B8294',
                      }}
                    >
                      {activeTrace.hops[idx + 1]?.transitionLabel}
                    </span>
                    <div className="flex items-center w-full">
                      <div
                        className="h-[2px] flex-1 transition-colors duration-200"
                        style={{
                          backgroundColor:
                            nextEdgeState === 'inflight'
                              ? hopAmber
                              : nextEdgeState === 'traversed'
                                ? activeGreen
                                : isDark
                                  ? '#2E3862'
                                  : '#CFC8BC',
                        }}
                      />
                      <ArrowRight
                        className="w-3 h-3 -ml-1 shrink-0 transition-colors duration-200"
                        style={{
                          color:
                            nextEdgeState === 'inflight'
                              ? hopAmber
                              : nextEdgeState === 'traversed'
                                ? activeGreen
                                : isDark
                                  ? '#2E3862'
                                  : '#CFC8BC',
                        }}
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Live Transition & Node Metadata State Telemetry Bar */}
      {currentHop && (
        <div
          className={`px-4 sm:px-6 py-3 border-t space-y-2 text-xs ${
            isDark
              ? 'bg-[#2A2112]/65 border-[#E0B063]/35'
              : 'bg-[#FDF5E6] border-[#8A5C10]/30'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="min-w-0 flex flex-wrap items-center gap-2">
              <span
                className="font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0 tabular-nums"
                style={{
                  backgroundColor: hopAmber,
                  color: isDark ? '#0B1020' : '#FFFFFF',
                }}
              >
                HOP {currentHop.stepNumber}/{totalHops}
              </span>
              <span className="font-mono text-[10.5px] font-semibold shrink-0">
                {previousHop
                  ? `${previousHop.nodeCode} → ${currentHop.nodeCode}`
                  : `Ingress → ${currentHop.nodeCode}`}{' '}
                ({currentHop.transitionLabel})
              </span>
              <span className={mutedText} aria-hidden="true">
                ·
              </span>
              <span className="font-bold">{currentHop.title}</span>
              <span className={mutedText} aria-hidden="true">
                ·
              </span>
              <span className={secondaryText}>{currentHop.payloadSummary}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0 font-mono text-[10.5px] tabular-nums">
              <span style={{ color: activeGreen }} className="font-bold">
                SLA {currentHop.latencyTarget}
              </span>
              {onInspectHopIn3D && (
                <button
                  type="button"
                  onClick={onInspectHopIn3D}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-sans text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    isDark
                      ? 'bg-[#8FA6E8] text-[#0B1020] hover:bg-[#A6B9F0]'
                      : 'bg-[#1F3863] text-white hover:bg-[#12233F]'
                  }`}
                >
                  <Box className="w-3 h-3" strokeWidth={1.8} />
                  <span>View Hop in 3D</span>
                </button>
              )}
            </div>
          </div>

          {/* Explicit Metadata State Row Updating Per Hop */}
          <div
            className={`pt-2 border-t grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[10.5px] ${
              isDark ? 'border-[#E0B063]/20' : 'border-[#8A5C10]/20'
            }`}
          >
            <div className="truncate">
              <span className={mutedText}>Enclave State: </span>
              <strong className={isDark ? 'text-[#E7EBF5]' : 'text-[#16213A]'}>
                {currentHop.metadataState.enclaveState} ({activeProfile.switcherLabel})
              </strong>
            </div>
            <div className="truncate">
              <span className={mutedText}>Policy State: </span>
              <strong style={{ color: hopAmber }}>{currentHop.metadataState.policyDecision}</strong>
            </div>
            <div className="truncate">
              <span className={mutedText}>Audit Proof: </span>
              <strong style={{ color: activeGreen }}>{currentHop.metadataState.auditProof}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
