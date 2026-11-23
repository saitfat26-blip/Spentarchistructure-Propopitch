import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Film, History, Trash2 } from 'lucide-react';

export interface SolarOrbitLogEntry {
  id: string;
  timestamp: string;
  hubId: string;
  planetName: string;
  orbitColorToken: string;
  previousVelocityKmS: number;
  newVelocityKmS: number;
  velocityMultiplier: number;
  trigger: string;
}

export interface OrbitalRingSummary {
  hubId: string;
  planetName: string;
  orbitColorToken: string;
  radiusPx: number;
  effectiveVelocityKmS: number;
}

interface SolarOrbitLogPanelProps {
  entries: SolarOrbitLogEntry[];
  onClearLog: () => void;
  rings: OrbitalRingSummary[];
  hoveredHubId: string | null;
  selectedHubId: string;
  onHoverHub: (hubId: string | null) => void;
  onSelectHub: (hubId: string) => void;
  onOpenShowreelVr?: () => void;
}

function formatLogClock(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function SolarOrbitLogPanel({
  entries,
  onClearLog,
  rings,
  hoveredHubId,
  selectedHubId,
  onHoverHub,
  onSelectHub,
  onOpenShowreelVr,
}: SolarOrbitLogPanelProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="pointer-events-auto flex flex-col gap-2 w-[268px] sm:w-[292px]">
      {/* Interactive Orbital Path Circles Radar with CSS Hover Pulse driven by .solar-map-scope tokens */}
      <div
        className="rounded-[8px] px-3 py-2.5"
        style={{
          background: 'var(--solar-bg-panel)',
          border: '1px solid var(--solar-border-mid)',
          boxShadow: 'var(--solar-shadow-card)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span
            className="text-[11px] font-semibold tracking-tight"
            style={{ color: 'var(--solar-fg-bright)' }}
          >
            Orbital Path Telemetry
          </span>
          {onOpenShowreelVr && (
            <button
              type="button"
              onClick={onOpenShowreelVr}
              className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded transition-opacity hover:opacity-100 opacity-85 whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                color: 'var(--solar-accent-amber-fg)',
                background: 'var(--solar-accent-amber-bg)',
                border: '1px solid var(--solar-accent-amber)',
              }}
              title="Watch Solar System VR chapter (0:18) in Resources Showreel"
            >
              <Film className="w-3 h-3" />
              <span>VR Reel 0:18</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <svg
            viewBox="0 0 120 120"
            className="w-[96px] h-[96px] shrink-0 overflow-visible"
            aria-label="Interactive planetary orbital path rings"
          >
            <circle cx="60" cy="60" r="4.5" fill="var(--solar-accent-amber-fg)" opacity="0.95" />
            {rings.map((ring) => {
              const isHovered = hoveredHubId === ring.hubId;
              const isSelected = selectedHubId === ring.hubId;
              return (
                <circle
                  key={ring.hubId}
                  cx="60"
                  cy="60"
                  r={ring.radiusPx}
                  fill="none"
                  stroke={`var(${ring.orbitColorToken})`}
                  strokeWidth={isHovered ? 2.2 : isSelected ? 1.5 : 0.9}
                  opacity={isHovered ? 1 : isSelected ? 0.82 : 0.34}
                  className={`solar-orbit-path-circle cursor-pointer ${
                    isHovered ? 'solar-orbit-path-circle--pulsing' : ''
                  }`}
                  style={
                    {
                      '--solar-orbit-glow': `var(${ring.orbitColorToken})`,
                    } as React.CSSProperties
                  }
                  onMouseEnter={() => onHoverHub(ring.hubId)}
                  onMouseLeave={() => onHoverHub(null)}
                  onClick={() => onSelectHub(ring.hubId)}
                >
                  <title>
                    {ring.planetName} — {ring.effectiveVelocityKmS.toFixed(1)} km/s
                  </title>
                </circle>
              );
            })}
          </svg>

          <div className="min-w-0 flex-1 space-y-1 max-h-[96px] overflow-y-auto pr-0.5">
            {rings.map((ring) => {
              const isHovered = hoveredHubId === ring.hubId;
              const isSelected = selectedHubId === ring.hubId;
              return (
                <button
                  key={ring.hubId}
                  type="button"
                  onMouseEnter={() => onHoverHub(ring.hubId)}
                  onMouseLeave={() => onHoverHub(null)}
                  onClick={() => onSelectHub(ring.hubId)}
                  className="w-full flex items-center justify-between gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer"
                  style={{
                    background:
                      isHovered || isSelected ? 'rgba(72, 142, 255, 0.16)' : 'transparent',
                    color: isHovered
                      ? 'var(--solar-fg-primary)'
                      : isSelected
                        ? 'var(--solar-fg-blue)'
                        : 'var(--solar-fg-muted)',
                  }}
                >
                  <span className="truncate flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: `var(${ring.orbitColorToken})` }}
                    />
                    <span className="truncate">{ring.planetName}</span>
                  </span>
                  <span className="tabular-nums shrink-0">
                    {ring.effectiveVelocityKmS.toFixed(1)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Persistent Scrollable Historical Orbit Log */}
      <div
        className="rounded-[8px] overflow-hidden"
        style={{
          background: 'var(--solar-bg-panel)',
          border: '1px solid var(--solar-border-mid)',
          boxShadow: 'var(--solar-shadow-card)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          className="flex items-center justify-between gap-2 px-3 py-2"
          style={{
            borderBottom: expanded ? '1px solid var(--solar-border-subtle)' : 'none',
          }}
        >
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer"
            style={{ color: 'var(--solar-fg-bright)' }}
          >
            <History className="w-3.5 h-3.5" style={{ color: 'var(--solar-accent-blue)' }} />
            <span>Historical Orbit Log</span>
            <span
              className="text-[10px] font-mono tabular-nums"
              style={{ color: 'var(--solar-fg-muted)' }}
            >
              ({entries.length})
            </span>
          </button>

          <div className="flex items-center gap-1">
            {entries.length > 0 && (
              <button
                type="button"
                onClick={onClearLog}
                aria-label="Clear historical orbit log"
                title="Clear orbit velocity history"
                className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
                style={{ color: 'var(--solar-fg-muted)' }}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? 'Collapse orbit log' : 'Expand orbit log'}
              className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
              style={{ color: 'var(--solar-fg-muted)' }}
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="max-h-[160px] overflow-y-auto px-2.5 py-2 space-y-1.5">
            {entries.length === 0 ? (
              <div
                className="text-[11px] py-2 px-1 leading-relaxed"
                style={{ color: 'var(--solar-fg-muted)' }}
              >
                Adjust orbital velocity, time scale, or orbital presets to log per-planet velocity shifts here.
              </div>
            ) : (
              entries.map((entry) => {
                const delta = entry.newVelocityKmS - entry.previousVelocityKmS;
                const deltaPrefix = delta >= 0 ? '+' : '';
                return (
                  <div
                    key={entry.id}
                    className="rounded px-2 py-1.5 text-[10px] font-mono"
                    style={{
                      background: 'rgba(8, 18, 38, 0.56)',
                      border: '1px solid var(--solar-border-subtle)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="font-semibold truncate flex items-center gap-1.5"
                        style={{ color: 'var(--solar-fg-primary)' }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: `var(${entry.orbitColorToken})` }}
                        />
                        <span className="truncate">{entry.planetName}</span>
                      </span>
                      <span
                        className="tabular-nums shrink-0"
                        style={{ color: 'var(--solar-fg-muted)' }}
                      >
                        {formatLogClock(entry.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5 tabular-nums">
                      <span style={{ color: 'var(--solar-fg-blue)' }}>
                        {entry.previousVelocityKmS.toFixed(1)} → {entry.newVelocityKmS.toFixed(1)} km/s
                      </span>
                      <span
                        style={{
                          color:
                            delta >= 0
                              ? 'var(--solar-orbit-1)'
                              : 'var(--solar-orbit-4)',
                        }}
                      >
                        {deltaPrefix}
                        {delta.toFixed(1)} ({entry.velocityMultiplier.toFixed(2)}×)
                      </span>
                    </div>
                    <div
                      className="text-[9px] truncate mt-0.5"
                      style={{ color: 'var(--solar-fg-muted)' }}
                    >
                      {entry.trigger}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
