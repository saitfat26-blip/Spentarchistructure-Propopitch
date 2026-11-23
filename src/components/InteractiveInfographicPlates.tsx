import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import {
  BRAIN_HUBS,
  DUAL_SHORE_COMPARISON,
  FINANCIAL_TRAJECTORY,
  SERVER_TIERS,
  SOVEREIGN_STACK_LAYERS,
  SPENTA_APPS,
  ServerTierId,
} from '../data/spentaManifest';
import { useStack } from '../store/StackContext';
import {
  ArchitectureNodeTooltip,
  ArchitectureTooltipData,
  getElementAnchorPoint,
} from './ArchitectureNodeTooltip';

type PlateTipPayload = Omit<ArchitectureTooltipData, 'x' | 'y'>;

function usePlateTooltip() {
  const [tip, setTip] = useState<ArchitectureTooltipData | null>(null);

  const showTip = useCallback((payload: PlateTipPayload, e: React.MouseEvent) => {
    setTip({ ...payload, x: e.clientX, y: e.clientY });
  }, []);

  const moveTip = useCallback((e: React.MouseEvent) => {
    setTip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev));
  }, []);

  const focusTip = useCallback((payload: PlateTipPayload, e: React.FocusEvent) => {
    const pt = getElementAnchorPoint(e.currentTarget);
    setTip({ ...payload, x: pt.x, y: pt.y });
  }, []);

  const clearTip = useCallback(() => {
    setTip(null);
  }, []);

  return { tip, showTip, moveTip, focusTip, clearTip };
}

export type OitsPlateId = 'ai-brain' | 'l1-l6-stack' | 'captive-ecosystem' | 'financial-edge';

interface InteractivePlateProps {
  plateId: OitsPlateId;
  polarity: 'light' | 'dark';
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

interface Palette {
  bg: string;
  band: string;
  card: string;
  cardActive: string;
  hairline: string;
  hairlineStrong: string;
  ink: string;
  body: string;
  muted: string;
  navy: string;
  navySoft: string;
  green: string;
  greenSoft: string;
  amber: string;
  amberSoft: string;
  crimson: string;
  teal: string;
}

function getOitsPalette(polarity: 'light' | 'dark'): Palette {
  if (polarity === 'dark') {
    return {
      bg: '#0B1020',
      band: '#0F1529',
      card: '#141A32',
      cardActive: '#1B2547',
      hairline: '#232B4A',
      hairlineStrong: '#34416E',
      ink: '#E7EBF5',
      body: '#C3CCE4',
      muted: '#8D97B5',
      navy: '#8FA6E8',
      navySoft: '#161D3A',
      green: '#6FCB9F',
      greenSoft: '#0F2A22',
      amber: '#E0B063',
      amberSoft: '#2A2112',
      crimson: '#F45B69',
      teal: '#5EEAD4',
    };
  }
  return {
    bg: '#FAF8F4',
    band: '#F2EFE9',
    card: '#FFFFFF',
    cardActive: '#EEF3FB',
    hairline: '#E4DFD6',
    hairlineStrong: '#CFC8BC',
    ink: '#16213A',
    body: '#4A5163',
    muted: '#5F6576',
    navy: '#1F3863',
    navySoft: '#EEF3FB',
    green: '#1C6E46',
    greenSoft: '#EBF6F0',
    amber: '#8A5C10',
    amberSoft: '#FDF5E6',
    crimson: '#BF000F',
    teal: '#0F766E',
  };
}

export function exportPlateSvg(
  svgEl: SVGSVGElement | null,
  filename: string,
  metadataTitle?: string,
): boolean {
  if (!svgEl) return false;
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  const viewBox = clone.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/);
    if (parts.length === 4) {
      clone.setAttribute('width', parts[2]);
      clone.setAttribute('height', parts[3]);
    }
  }

  const svgNs = 'http://www.w3.org/2000/svg';
  const styleEl = document.createElementNS(svgNs, 'style');
  styleEl.textContent =
    'text { font-family: "Plus Jakarta Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }';
  clone.insertBefore(styleEl, clone.firstChild);

  if (metadataTitle) {
    const titleEl = document.createElementNS(svgNs, 'title');
    titleEl.textContent = metadataTitle;
    clone.insertBefore(titleEl, clone.firstChild);
  }

  const serialized = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${serialized}`], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

/* ============================================================================
 * PLATE 01: Spenta Sovereign AI Brain — 8 Hubs & 13 Composable Modules
 * ========================================================================== */
function Plate01BrainTopology({
  polarity,
  svgRef,
}: {
  polarity: 'light' | 'dark';
  svgRef?: React.RefObject<SVGSVGElement | null>;
}) {
  const { selectedIds, toggleApp, hitlConfidence } = useStack();
  const [focusedHubId, setFocusedHubId] = useState<string>('fintech');
  const { tip, showTip, moveTip, focusTip, clearTip } = usePlateTooltip();
  const p = getOitsPalette(polarity);

  const leftHubs = useMemo(() => BRAIN_HUBS.filter((h) => h.side === 'left'), []);
  const rightHubs = useMemo(() => BRAIN_HUBS.filter((h) => h.side === 'right'), []);
  const focusedHub = useMemo(
    () => BRAIN_HUBS.find((h) => h.id === focusedHubId) ?? BRAIN_HUBS[0],
    [focusedHubId],
  );
  const focusedApps = useMemo(
    () => SPENTA_APPS.filter((a) => a.hubId === focusedHub.id),
    [focusedHub],
  );

  const passHitl = hitlConfidence >= 0.88;

  return (
    <div className="flex flex-col" style={{ backgroundColor: p.bg, color: p.ink }}>
      <div className="w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 880 460"
          className="w-full h-auto block select-none"
          role="img"
          aria-label="Plate 01: Spenta Sovereign AI Brain 8-Hub Interactive Topology"
        >
          <rect x="0" y="0" width="880" height="460" fill={p.bg} />

          {/* Architectural Grid Header Strip */}
          <rect x="20" y="16" width="840" height="36" rx="8" fill={p.band} stroke={p.hairline} />
          <text
            x="36"
            y="38"
            fill={p.navy}
            fontSize="10"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            01. DUAL-HEMISPHERE SOVEREIGN TOPOLOGY
          </text>
          <text
            x="844"
            y="38"
            textAnchor="end"
            fill={p.muted}
            fontSize="10"
            fontFamily="JetBrains Mono, monospace"
          >
            {selectedIds.length}/13 MODULES IN STACK · OPA {hitlConfidence.toFixed(2)}{' '}
            {passHitl ? 'AUTO-COMMIT' : 'HITL AUDIT'}
          </text>

          {/* Column Labels */}
          <text
            x="30"
            y="78"
            fill={p.muted}
            fontSize="9.5"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            OPERATIONS ENGINE (REGULATED CORE)
          </text>
          <text
            x="440"
            y="78"
            textAnchor="middle"
            fill={p.navy}
            fontSize="9.5"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            SPENTA KERNEL · L1–L6
          </text>
          <text
            x="850"
            y="78"
            textAnchor="end"
            fill={p.muted}
            fontSize="9.5"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            EXPERIENCE &amp; IR4 ENGINE
          </text>

          {/* Orthogonal Bus Connectors — Left */}
          {leftHubs.map((hub, i) => {
            const cy = 122 + i * 84;
            const apps = SPENTA_APPS.filter((a) => a.hubId === hub.id);
            const activeCount = apps.filter((a) => selectedIds.includes(a.id)).length;
            const isFocus = focusedHub.id === hub.id;
            const stroke = isFocus ? p.navy : activeCount > 0 ? p.green : p.hairlineStrong;
            return (
              <path
                key={`bus-l-${hub.id}`}
                d={`M 262 ${cy} L 306 ${cy} L 306 248 L 352 248`}
                fill="none"
                stroke={stroke}
                strokeWidth={isFocus ? 2.2 : activeCount > 0 ? 1.6 : 1.1}
              />
            );
          })}

          {/* Orthogonal Bus Connectors — Right */}
          {rightHubs.map((hub, i) => {
            const cy = 122 + i * 84;
            const apps = SPENTA_APPS.filter((a) => a.hubId === hub.id);
            const activeCount = apps.filter((a) => selectedIds.includes(a.id)).length;
            const isFocus = focusedHub.id === hub.id;
            const stroke = isFocus ? p.navy : activeCount > 0 ? p.green : p.hairlineStrong;
            return (
              <path
                key={`bus-r-${hub.id}`}
                d={`M 618 ${cy} L 574 ${cy} L 574 248 L 528 248`}
                fill="none"
                stroke={stroke}
                strokeWidth={isFocus ? 2.2 : activeCount > 0 ? 1.6 : 1.1}
              />
            );
          })}

          {/* Central L1–L6 Sovereign Kernel Block */}
          <rect
            x="352"
            y="96"
            width="176"
            height="304"
            rx="10"
            fill={p.card}
            stroke={passHitl ? p.navy : p.amber}
            strokeWidth="1.6"
          />
          <g
            onMouseEnter={(e) =>
              showTip(
                {
                  id: 'p1-core',
                  code: 'SPENTA CORE',
                  title: 'Sovereign Fusion Kernel (L1–L6)',
                  summary:
                    'Air-gapped customer-enclave execution spine isolating every LLM weight, vector index, and PostgreSQL/Kafka ledger.',
                  metric: '0% Cloud PII Egress',
                  status: `${selectedIds.length}/13 ACTIVE`,
                  hint: 'Inspect L1–L6 rungs below',
                  accent: 'navy',
                },
                e,
              )
            }
            onMouseMove={moveTip}
            onMouseLeave={clearTip}
            className="cursor-default"
          >
            <rect x="364" y="108" width="152" height="44" rx="7" fill={p.navySoft} stroke={p.hairline} />
            <text
              x="440"
              y="127"
              textAnchor="middle"
              fill={p.navy}
              fontSize="11"
              fontWeight="800"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              SPENTA CORE
            </text>
            <text
              x="440"
              y="142"
              textAnchor="middle"
              fill={p.muted}
              fontSize="8.5"
              fontFamily="JetBrains Mono, monospace"
            >
              0% Cloud PII Egress
            </text>
          </g>

          {/* L6 -> L1 Mini Rungs inside Kernel */}
          {[...SOVEREIGN_STACK_LAYERS].reverse().map((layer, idx) => {
            const ry = 162 + idx * 30;
            const isUsedByFocus = focusedHub.keyLayers.includes(layer.id);
            return (
              <g
                key={`k-${layer.id}`}
                onMouseEnter={(e) =>
                  showTip(
                    {
                      id: `p1-layer-${layer.id}`,
                      code: `LAYER ${layer.id}`,
                      title: layer.title,
                      summary: layer.summary,
                      metric: layer.slaMetric,
                      status: isUsedByFocus ? `USED BY HUB ${focusedHub.num}` : 'KERNEL RUNG',
                      hint: layer.protocols[0] ?? 'Sovereign protocol',
                      accent: isUsedByFocus ? 'emerald' : 'navy',
                    },
                    e,
                  )
                }
                onMouseMove={moveTip}
                onMouseLeave={clearTip}
                className="cursor-default"
              >
                <rect
                  x="364"
                  y={ry}
                  width="152"
                  height="24"
                  rx="5"
                  fill={isUsedByFocus ? p.navySoft : p.band}
                  stroke={isUsedByFocus ? p.navy : p.hairline}
                  strokeWidth={isUsedByFocus ? 1.3 : 0.9}
                />
                <text
                  x="374"
                  y={ry + 15.5}
                  fill={isUsedByFocus ? p.navy : p.muted}
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {layer.id}
                </text>
                <text
                  x="396"
                  y={ry + 15.5}
                  fill={p.ink}
                  fontSize="8.8"
                  fontWeight={isUsedByFocus ? '700' : '500'}
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {layer.title.length > 20 ? `${layer.title.slice(0, 19)}…` : layer.title}
                </text>
              </g>
            );
          })}

          {/* OPA Gate Footer inside Kernel */}
          <g
            onMouseEnter={(e) =>
              showTip(
                {
                  id: 'p1-opa-gate',
                  code: `OPA ${hitlConfidence.toFixed(2)}`,
                  title: passHitl ? 'Deterministic Auto-Commit Active' : 'Human-in-the-Loop Audit Hold',
                  summary:
                    'Open Policy Agent circuit breaker evaluates every inference score before allowing automated PostgreSQL/Kafka writes.',
                  metric: passHitl ? '≥0.88 Auto-Ledger' : '<0.88 Verifier Queue',
                  status: passHitl ? 'PASS' : 'HOLD',
                  hint: 'Adjust slider in The Brain',
                  accent: passHitl ? 'emerald' : 'amber',
                },
                e,
              )
            }
            onMouseMove={moveTip}
            onMouseLeave={clearTip}
            className="cursor-default"
          >
            <rect
              x="364"
              y="348"
              width="152"
              height="40"
              rx="7"
              fill={passHitl ? p.greenSoft : p.amberSoft}
              stroke={passHitl ? p.green : p.amber}
            />
            <text
              x="440"
              y="365"
              textAnchor="middle"
              fill={passHitl ? p.green : p.amber}
              fontSize="9.5"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              OPA GATE: {hitlConfidence.toFixed(2)}
            </text>
            <text
              x="440"
              y="379"
              textAnchor="middle"
              fill={p.body}
              fontSize="8"
              fontFamily="JetBrains Mono, monospace"
            >
              {passHitl ? '≥0.88 AUTO-LEDGER' : '<0.88 HUMAN VERIFY'}
            </text>
          </g>

          {/* Left 4 Hub Cards */}
          {leftHubs.map((hub, i) => {
            const y = 92 + i * 84;
            const apps = SPENTA_APPS.filter((a) => a.hubId === hub.id);
            const activeCount = apps.filter((a) => selectedIds.includes(a.id)).length;
            const isFocus = focusedHub.id === hub.id;
            return (
              <g
                key={hub.id}
                onClick={() => setFocusedHubId(hub.id)}
                onMouseEnter={(e) =>
                  showTip(
                    {
                      id: `p1-hub-${hub.id}`,
                      code: `HUB ${hub.num} · ${hub.keyLayers.join('/')}`,
                      title: hub.label,
                      summary: hub.summary,
                      metric: `${activeCount}/${apps.length} modules active`,
                      status: isFocus ? 'FOCUSED' : activeCount > 0 ? 'IN STACK' : 'OPERATIONS',
                      hint: 'Click to inspect apps',
                      accent: activeCount > 0 ? 'emerald' : 'navy',
                    },
                    e,
                  )
                }
                onMouseMove={moveTip}
                onMouseLeave={clearTip}
                className="cursor-pointer"
              >
                <rect
                  x="26"
                  y={y}
                  width="236"
                  height="64"
                  rx="9"
                  fill={isFocus ? p.cardActive : p.card}
                  stroke={isFocus ? p.navy : activeCount > 0 ? p.green : p.hairlineStrong}
                  strokeWidth={isFocus ? 1.8 : 1.1}
                />
                <text
                  x="40"
                  y={y + 20}
                  fill={isFocus ? p.navy : p.muted}
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  HUB {hub.num} · {hub.keyLayers.join('/')}
                </text>
                <text
                  x="248"
                  y={y + 20}
                  textAnchor="end"
                  fill={activeCount > 0 ? p.green : p.muted}
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {activeCount}/{apps.length} active
                </text>
                <text
                  x="40"
                  y={y + 39}
                  fill={p.ink}
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {hub.label}
                </text>
                <text
                  x="40"
                  y={y + 54}
                  fill={p.muted}
                  fontSize="8.8"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {apps.map((a) => a.shortName).join(' · ').slice(0, 38)}
                </text>
              </g>
            );
          })}

          {/* Right 4 Hub Cards */}
          {rightHubs.map((hub, i) => {
            const y = 92 + i * 84;
            const apps = SPENTA_APPS.filter((a) => a.hubId === hub.id);
            const activeCount = apps.filter((a) => selectedIds.includes(a.id)).length;
            const isFocus = focusedHub.id === hub.id;
            return (
              <g
                key={hub.id}
                onClick={() => setFocusedHubId(hub.id)}
                onMouseEnter={(e) =>
                  showTip(
                    {
                      id: `p1-hub-${hub.id}`,
                      code: `HUB ${hub.num} · ${hub.keyLayers.join('/')}`,
                      title: hub.label,
                      summary: hub.summary,
                      metric: `${activeCount}/${apps.length} modules active`,
                      status: isFocus ? 'FOCUSED' : activeCount > 0 ? 'IN STACK' : 'EXPERIENCE',
                      hint: 'Click to inspect apps',
                      accent: activeCount > 0 ? 'emerald' : 'navy',
                    },
                    e,
                  )
                }
                onMouseMove={moveTip}
                onMouseLeave={clearTip}
                className="cursor-pointer"
              >
                <rect
                  x="618"
                  y={y}
                  width="236"
                  height="64"
                  rx="9"
                  fill={isFocus ? p.cardActive : p.card}
                  stroke={isFocus ? p.navy : activeCount > 0 ? p.green : p.hairlineStrong}
                  strokeWidth={isFocus ? 1.8 : 1.1}
                />
                <text
                  x="632"
                  y={y + 20}
                  fill={isFocus ? p.navy : p.muted}
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  HUB {hub.num} · {hub.keyLayers.join('/')}
                </text>
                <text
                  x="840"
                  y={y + 20}
                  textAnchor="end"
                  fill={activeCount > 0 ? p.green : p.muted}
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {activeCount}/{apps.length} active
                </text>
                <text
                  x="632"
                  y={y + 39}
                  fill={p.ink}
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {hub.label}
                </text>
                <text
                  x="632"
                  y={y + 54}
                  fill={p.muted}
                  fontSize="8.8"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {apps.map((a) => a.shortName).join(' · ').slice(0, 38)}
                </text>
              </g>
            );
          })}

          {/* Delivery Hubs Footnote inside SVG */}
          <line x1="20" y1="422" x2="860" y2="422" stroke={p.hairline} strokeWidth="1" />
          <text
            x="26"
            y="443"
            fill={p.muted}
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
          >
            CLICK ANY HUB TO INSPECT MODULES &amp; LAYERS · SAN JOSE · AUSTRALIA · 20-FTE DHAKA R&amp;D HUB
          </text>
          <text
            x="854"
            y="443"
            textAnchor="end"
            fill={p.navy}
            fontSize="9"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            PLATE 01 · SPENTA DHAKA EDITION
          </text>
        </svg>
      </div>

      {/* Inline Interactive Hub Inspector Bar */}
      <div
        className="px-4 py-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs"
        style={{ backgroundColor: p.band, borderColor: p.hairline }}
      >
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-bold" style={{ color: p.navy }}>
            HUB {focusedHub.num} · {focusedHub.engineLabel} · Layers {focusedHub.keyLayers.join(' / ')}
          </div>
          <div className="text-[11px] truncate mt-0.5" style={{ color: p.body }}>
            <strong style={{ color: p.ink }}>{focusedHub.label}:</strong> {focusedHub.summary}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {focusedApps.map((app) => {
            const active = selectedIds.includes(app.id);
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => toggleApp(app.id)}
                onMouseEnter={(e) =>
                  showTip(
                    {
                      id: `p1-app-${app.id}`,
                      code: app.layers.join('/'),
                      title: app.name,
                      summary: app.tagline,
                      metric: `${app.setupLabel} · ${app.gmPct.toFixed(1)}% GM`,
                      status: active ? 'IN STACK' : `TIER ${app.minServerTier} MIN`,
                      hint: active ? 'Click to remove' : 'Click to add',
                      accent: active ? 'emerald' : 'navy',
                    },
                    e,
                  )
                }
                onMouseMove={moveTip}
                onMouseLeave={clearTip}
                onFocus={(e) =>
                  focusTip(
                    {
                      id: `p1-app-${app.id}`,
                      code: app.layers.join('/'),
                      title: app.name,
                      summary: app.tagline,
                      metric: `${app.setupLabel} · ${app.gmPct.toFixed(1)}% GM`,
                      status: active ? 'IN STACK' : `TIER ${app.minServerTier} MIN`,
                      hint: active ? 'Click to remove' : 'Click to add',
                      accent: active ? 'emerald' : 'navy',
                    },
                    e,
                  )
                }
                onBlur={clearTip}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[10px] font-semibold border transition-colors cursor-pointer whitespace-nowrap"
                style={{
                  backgroundColor: active ? p.green : p.card,
                  color: active ? (polarity === 'dark' ? '#0B1020' : '#FFFFFF') : p.ink,
                  borderColor: active ? p.green : p.hairlineStrong,
                }}
              >
                {active ? <Check className="w-3 h-3" strokeWidth={2.5} /> : <Plus className="w-3 h-3" />}
                <span>{app.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ArchitectureNodeTooltip data={tip} isDark={polarity === 'dark'} />
    </div>
  );
}

/* ============================================================================
 * PLATE 02: L1–L6 Sovereign Fusion Stack & 4-Tier On-Prem Server Matrix
 * ========================================================================== */
function Plate02StackAndServers({
  polarity,
  svgRef,
}: {
  polarity: 'light' | 'dark';
  svgRef?: React.RefObject<SVGSVGElement | null>;
}) {
  const { stackMetrics } = useStack();
  const [selectedLayerId, setSelectedLayerId] = useState<string>('L5');
  const [selectedTierId, setSelectedTierId] = useState<ServerTierId>(stackMetrics.tier);
  const { tip, showTip, moveTip, clearTip } = usePlateTooltip();
  const p = getOitsPalette(polarity);

  const layersDesc = useMemo(() => [...SOVEREIGN_STACK_LAYERS].reverse(), []);
  const tiers = useMemo(() => Object.values(SERVER_TIERS), []);
  const activeLayer =
    SOVEREIGN_STACK_LAYERS.find((l) => l.id === selectedLayerId) ?? SOVEREIGN_STACK_LAYERS[4];
  const activeTier = SERVER_TIERS[selectedTierId] ?? SERVER_TIERS[3];

  const capexScale = (midUsd: number) => Math.round((midUsd / 15500) * 190);

  return (
    <div className="flex flex-col" style={{ backgroundColor: p.bg, color: p.ink }}>
      <div className="w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 880 460"
          className="w-full h-auto block select-none"
          role="img"
          aria-label="Plate 02: L1–L6 Sovereign Fusion Stack and 4-Tier Server Matrix"
        >
          <rect x="0" y="0" width="880" height="460" fill={p.bg} />

          {/* Header Bar */}
          <rect x="20" y="16" width="840" height="36" rx="8" fill={p.band} stroke={p.hairline} />
          <text
            x="36"
            y="38"
            fill={p.navy}
            fontSize="10"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            02. L1–L6 SOVEREIGN FUSION STACK × 4-TIER ON-PREM SERVER MATRIX
          </text>
          <text
            x="844"
            y="38"
            textAnchor="end"
            fill={p.green}
            fontSize="10"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            STACK RECOMMENDED: TIER {stackMetrics.tier} ({SERVER_TIERS[stackMetrics.tier].capex})
          </text>

          {/* Left Section Label */}
          <text
            x="28"
            y="76"
            fill={p.muted}
            fontSize="9.5"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            L6 → L1 ISOLATION SPINE (CLICK LAYER)
          </text>
          {/* Right Section Label */}
          <text
            x="466"
            y="76"
            fill={p.muted}
            fontSize="9.5"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            4-TIER ON-PREM APPLIANCE MATRIX (CLICK TIER)
          </text>

          {/* Center Orthogonal Bridge Line */}
          <path
            d="M 424 252 L 456 252"
            fill="none"
            stroke={p.navy}
            strokeWidth="1.6"
            strokeDasharray="3 3"
          />

          {/* Left: L6 -> L1 Interactive Vertical Stack */}
          {layersDesc.map((layer, idx) => {
            const y = 88 + idx * 53;
            const isSelected = layer.id === selectedLayerId;
            return (
              <g
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                onMouseEnter={(e) =>
                  showTip(
                    {
                      id: `p2-layer-${layer.id}`,
                      code: `LAYER ${layer.id}`,
                      title: layer.title,
                      summary: `${layer.summary} Controls: ${layer.securityControls.slice(0, 2).join(', ')}.`,
                      metric: layer.slaMetric,
                      status: isSelected ? 'SELECTED LAYER' : layer.subtitle,
                      hint: 'Click to inspect controls',
                      accent: isSelected ? 'emerald' : 'navy',
                    },
                    e,
                  )
                }
                onMouseMove={moveTip}
                onMouseLeave={clearTip}
                className="cursor-pointer"
              >
                <rect
                  x="26"
                  y={y}
                  width="398"
                  height="45"
                  rx="8"
                  fill={isSelected ? p.cardActive : p.card}
                  stroke={isSelected ? p.navy : p.hairlineStrong}
                  strokeWidth={isSelected ? 1.8 : 1}
                />
                <rect
                  x="36"
                  y={y + 9}
                  width="34"
                  height="27"
                  rx="5"
                  fill={isSelected ? p.navy : p.band}
                />
                <text
                  x="53"
                  y={y + 26}
                  textAnchor="middle"
                  fill={isSelected ? (polarity === 'dark' ? '#0B1020' : '#FFFFFF') : p.navy}
                  fontSize="10"
                  fontWeight="800"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {layer.id}
                </text>
                <text
                  x="82"
                  y={y + 20}
                  fill={p.ink}
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {layer.title}
                </text>
                <text
                  x="82"
                  y={y + 35}
                  fill={p.muted}
                  fontSize="8.8"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {layer.protocols.slice(0, 2).join(' · ').slice(0, 44)}
                </text>
                <text
                  x="412"
                  y={y + 20}
                  textAnchor="end"
                  fill={isSelected ? p.green : p.muted}
                  fontSize="8.8"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {layer.slaMetric}
                </text>
              </g>
            );
          })}

          {/* Right: 4-Tier Server Appliance Cards with CapEx Scale Bar */}
          {tiers.map((tier, idx) => {
            const y = 88 + idx * 80;
            const isSelected = tier.id === selectedTierId;
            const isRec = tier.id === stackMetrics.tier;
            const barW = capexScale(tier.capexMidUsd);
            return (
              <g
                key={tier.id}
                onClick={() => setSelectedTierId(tier.id)}
                onMouseEnter={(e) =>
                  showTip(
                    {
                      id: `p2-tier-${tier.id}`,
                      code: tier.code,
                      title: tier.name,
                      summary: `${tier.hardware} (${tier.vramRam}, ${tier.storage}). ${tier.idealFor}`,
                      metric: `${tier.capex} · ${tier.speed}`,
                      status: isRec ? 'RECOMMENDED' : isSelected ? 'SELECTED' : tier.modelScale,
                      hint: 'Click to lock hardware spec',
                      accent: isRec ? 'emerald' : 'navy',
                    },
                    e,
                  )
                }
                onMouseMove={moveTip}
                onMouseLeave={clearTip}
                className="cursor-pointer"
              >
                <rect
                  x="458"
                  y={y}
                  width="396"
                  height="70"
                  rx="9"
                  fill={isSelected ? p.cardActive : p.card}
                  stroke={isRec ? p.green : isSelected ? p.navy : p.hairlineStrong}
                  strokeWidth={isSelected || isRec ? 1.8 : 1}
                />
                <text
                  x="472"
                  y={y + 20}
                  fill={isRec ? p.green : p.navy}
                  fontSize="9.5"
                  fontWeight="800"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {tier.code} {isRec ? '· RECOMMENDED FOR STACK' : `· ${tier.modelScale}`}
                </text>
                <text
                  x="840"
                  y={y + 20}
                  textAnchor="end"
                  fill={p.ink}
                  fontSize="10"
                  fontWeight="800"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {tier.capex}
                </text>
                <text
                  x="472"
                  y={y + 38}
                  fill={p.ink}
                  fontSize="11.5"
                  fontWeight="700"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {tier.name}
                </text>

                {/* CapEx Proportion Track */}
                <rect x="472" y={y + 49} width="190" height="8" rx="4" fill={p.band} />
                <rect
                  x="472"
                  y={y + 49}
                  width={barW}
                  height="8"
                  rx="4"
                  fill={isRec ? p.green : p.navy}
                />
                <text
                  x="840"
                  y={y + 56}
                  textAnchor="end"
                  fill={p.muted}
                  fontSize="8.8"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {tier.vramRam.slice(0, 22)} · {tier.speed}
                </text>
              </g>
            );
          })}

          <line x1="20" y1="422" x2="860" y2="422" stroke={p.hairline} strokeWidth="1" />
          <text x="26" y="443" fill={p.muted} fontSize="9" fontFamily="JetBrains Mono, monospace">
            ONE-TIME CAPEX HARDWARE · ZERO CLOUD GPU TOKEN BURN · AMD SEV-SNP / INTEL TDX ENCLAVES
          </text>
          <text
            x="854"
            y="443"
            textAnchor="end"
            fill={p.navy}
            fontSize="9"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            PLATE 02 · SPENTA DHAKA EDITION
          </text>
        </svg>
      </div>

      {/* Inline Dual-Selection Telemetry Strip */}
      <div
        className="px-4 py-3 border-t grid grid-cols-1 md:grid-cols-2 gap-3 text-xs"
        style={{ backgroundColor: p.band, borderColor: p.hairline }}
      >
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-bold" style={{ color: p.navy }}>
            LAYER {activeLayer.id} · {activeLayer.title} ({activeLayer.slaMetric})
          </div>
          <div className="text-[11px] mt-0.5 truncate" style={{ color: p.body }}>
            Controls: {activeLayer.securityControls.slice(0, 2).join(' · ')}
          </div>
        </div>
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-bold" style={{ color: p.green }}>
            {activeTier.code} · {activeTier.capex} · {activeTier.speed}
          </div>
          <div className="text-[11px] mt-0.5 truncate" style={{ color: p.body }}>
            {activeTier.hardware}
          </div>
        </div>
      </div>

      <ArchitectureNodeTooltip data={tip} isDark={polarity === 'dark'} />
    </div>
  );
}

/* ============================================================================
 * PLATE 03: Captive Sister-Entity Synergies (BEST Retail & X Ltd Mobility)
 * ========================================================================== */
interface CaptiveStage {
  id: string;
  track: 'best' | 'xltd';
  step: string;
  title: string;
  metric: string;
  detail: string;
  appId: string;
  x: number;
  y: number;
}

const CAPTIVE_STAGES: CaptiveStage[] = [
  {
    id: 'best-showrooms',
    track: 'best',
    step: 'B1',
    title: '65+ Retail Showrooms',
    metric: 'BEST Electronics',
    detail: 'Unified omnichannel POS & showroom inventory telemetry across 65+ physical appliance outlets.',
    appId: 'mis_erp',
    x: 34,
    y: 112,
  },
  {
    id: 'best-exchange',
    track: 'best',
    step: 'B2',
    title: '365 Exchange CRM',
    metric: 'Circular Trade-In',
    detail: 'Automated valuation, serial lifecycle ledger, and instant exchange credit issuance.',
    appId: 'mis_erp',
    x: 244,
    y: 112,
  },
  {
    id: 'best-webar',
    track: 'best',
    step: 'B3',
    title: 'WebAR Try-On & DOOH',
    metric: '30.4% GM · $6.9K/qtr',
    detail: 'Zero-app browser spatial placement & 3D DOOH under AI-Native SEO & WebAR (distinct from 76.3% GM Spatial XR Twins).',
    appId: 'branding_geo',
    x: 454,
    y: 112,
  },
  {
    id: 'best-geo',
    track: 'best',
    step: 'B4',
    title: 'AI-Native GEO Growth',
    metric: '+28% Conversion',
    detail: 'Answer-engine catalog visibility and localized Bangla/EN conversational product search.',
    appId: 'branding_geo',
    x: 664,
    y: 112,
  },
  {
    id: 'xltd-stations',
    track: 'xltd',
    step: 'X1',
    title: '80 BaaS Swap Stations',
    metric: 'X Ltd Energy Grid',
    detail: 'Live cabinet charge balancing, thermal monitoring, and automated battery availability routing.',
    appId: 'iot_edge',
    x: 34,
    y: 280,
  },
  {
    id: 'xltd-fleet',
    track: 'xltd',
    step: 'X2',
    title: '480 Active EV Fleet',
    metric: 'Live BMS Telemetry',
    detail: 'Continuous state-of-health (SoH) diagnostics and rider swap authentication.',
    appId: 'iot_edge',
    x: 244,
    y: 280,
  },
  {
    id: 'xltd-edge',
    track: 'xltd',
    step: 'X3',
    title: '<50ms Wasm/MQTT Edge',
    metric: 'Quantized Green AI',
    detail: 'On-gateway anomaly detection and predictive cell degradation scoring without cloud lag.',
    appId: 'iot_edge',
    x: 454,
    y: 280,
  },
  {
    id: 'xltd-carbon',
    track: 'xltd',
    step: 'X4',
    title: 'ESG Carbon Ledger',
    metric: 'Auditable Scope 2/3',
    detail: 'Cryptographically signed per-swap carbon offset accounting synced to Spenta Core.',
    appId: 'genai_bi',
    x: 664,
    y: 280,
  },
];

function Plate03CaptiveSynergies({
  polarity,
  svgRef,
}: {
  polarity: 'light' | 'dark';
  svgRef?: React.RefObject<SVGSVGElement | null>;
}) {
  const { selectedIds, toggleApp, appMap } = useStack();
  const [trackFilter, setTrackFilter] = useState<'all' | 'best' | 'xltd'>('all');
  const [activeStageId, setActiveStageId] = useState<string>('best-exchange');
  const { tip, showTip, moveTip, clearTip } = usePlateTooltip();
  const p = getOitsPalette(polarity);

  const activeStage =
    CAPTIVE_STAGES.find((s) => s.id === activeStageId) ?? CAPTIVE_STAGES[0];
  const linkedApp = appMap[activeStage.appId];
  const linkedInStack = linkedApp ? selectedIds.includes(linkedApp.id) : false;

  return (
    <div className="flex flex-col" style={{ backgroundColor: p.bg, color: p.ink }}>
      {/* Track Filter Micro-Bar */}
      <div
        className="px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-[11px]"
        style={{ backgroundColor: p.band, borderColor: p.hairline }}
      >
        <span className="font-mono text-[10px] font-bold" style={{ color: p.muted }}>
          CAPTIVE DISTRIBUTION FILTER
        </span>
        <div className="inline-flex items-center gap-1">
          {([
            { id: 'all', label: 'All Synergies' },
            { id: 'best', label: 'BEST Retail (65+)' },
            { id: 'xltd', label: 'X Ltd Mobility (80 BaaS)' },
          ] as const).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTrackFilter(opt.id)}
              className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: trackFilter === opt.id ? p.navy : p.card,
                color:
                  trackFilter === opt.id
                    ? polarity === 'dark'
                      ? '#0B1020'
                      : '#FFFFFF'
                    : p.body,
                border: `1px solid ${trackFilter === opt.id ? p.navy : p.hairlineStrong}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 880 430"
          className="w-full h-auto block select-none"
          role="img"
          aria-label="Plate 03: Captive Sister-Entity Synergies BEST Retail and X Ltd Mobility"
        >
          <rect x="0" y="0" width="880" height="430" fill={p.bg} />

          {/* Track 1 Band: BEST Electronics */}
          <rect
            x="20"
            y="72"
            width="840"
            height="136"
            rx="10"
            fill={p.band}
            stroke={trackFilter === 'best' ? p.navy : p.hairline}
            opacity={trackFilter === 'xltd' ? 0.32 : 1}
          />
          <text
            x="36"
            y="95"
            fill={p.navy}
            fontSize="10"
            fontWeight="800"
            fontFamily="JetBrains Mono, monospace"
            opacity={trackFilter === 'xltd' ? 0.35 : 1}
          >
            TRACK 01 · BEST ELECTRONICS CAPTIVE RETAIL PIPELINE (65+ SHOWROOMS)
          </text>

          {/* Track 1 Orthogonal Connectors */}
          {[218, 428, 638].map((cx) => (
            <line
              key={`c-best-${cx}`}
              x1={cx}
              y1="150"
              x2={cx + 26}
              y2="150"
              stroke={p.navy}
              strokeWidth="1.6"
              opacity={trackFilter === 'xltd' ? 0.25 : 0.85}
            />
          ))}

          {/* Shared Sovereign Core Bus in the Middle */}
          <g
            onMouseEnter={(e) =>
              showTip(
                {
                  id: 'p3-core-bus',
                  code: 'SPENTA CORE BUS',
                  title: 'Kafka / OPA 0.88 Unified Event Spine',
                  summary:
                    'Shared real-time sovereign event bus bridging BEST Electronics retail showrooms and X Ltd EV battery-swap telemetry.',
                  metric: '0% Cloud PII · ≥0.88 OPA',
                  status: 'LIVE PRODUCTION',
                  hint: 'Hover stage nodes above/below',
                  accent: 'emerald',
                },
                e,
              )
            }
            onMouseMove={moveTip}
            onMouseLeave={clearTip}
            className="cursor-default"
          >
            <rect x="190" y="218" width="500" height="32" rx="7" fill={p.card} stroke={p.green} />
            <text
              x="440"
              y="238"
              textAnchor="middle"
              fill={p.green}
              fontSize="9.5"
              fontWeight="800"
              fontFamily="JetBrains Mono, monospace"
            >
              SHARED SPENTA SOVEREIGN CORE · KAFKA / OPA 0.88 / UNIFIED DATA BUS
            </text>
          </g>
          <line x1="340" y1="208" x2="340" y2="218" stroke={p.green} strokeWidth="1.5" />
          <line x1="540" y1="250" x2="540" y2="260" stroke={p.green} strokeWidth="1.5" />

          {/* Track 2 Band: X Ltd Mobility */}
          <rect
            x="20"
            y="260"
            width="840"
            height="136"
            rx="10"
            fill={p.band}
            stroke={trackFilter === 'xltd' ? p.green : p.hairline}
            opacity={trackFilter === 'best' ? 0.32 : 1}
          />
          <text
            x="36"
            y="283"
            fill={p.green}
            fontSize="10"
            fontWeight="800"
            fontFamily="JetBrains Mono, monospace"
            opacity={trackFilter === 'best' ? 0.35 : 1}
          >
            TRACK 02 · X LTD EV &amp; BaaS MOBILITY NETWORK (80 STATIONS · 480 EVs)
          </text>

          {/* Track 2 Orthogonal Connectors */}
          {[218, 428, 638].map((cx) => (
            <line
              key={`c-xltd-${cx}`}
              x1={cx}
              y1="336"
              x2={cx + 26}
              y2="336"
              stroke={p.green}
              strokeWidth="1.6"
              opacity={trackFilter === 'best' ? 0.25 : 0.85}
            />
          ))}

          {/* Header Banner */}
          <rect x="20" y="18" width="840" height="38" rx="8" fill={p.card} stroke={p.hairline} />
          <text
            x="36"
            y="41"
            fill={p.navy}
            fontSize="10"
            fontWeight="800"
            fontFamily="JetBrains Mono, monospace"
          >
            03. ZERO-CAC CAPTIVE SISTER-ENTITY DEPLOYMENT ENGINE
          </text>
          <text
            x="844"
            y="41"
            textAnchor="end"
            fill={p.muted}
            fontSize="9.5"
            fontFamily="JetBrains Mono, monospace"
          >
            CLICK ANY PIPELINE NODE TO INSPECT PRODUCTION PROOF
          </text>

          {/* Interactive Stage Nodes */}
          {CAPTIVE_STAGES.map((st) => {
            const isDimmed =
              (trackFilter === 'best' && st.track !== 'best') ||
              (trackFilter === 'xltd' && st.track !== 'xltd');
            const isSelected = st.id === activeStage.id;
            const nodeY = st.track === 'best' ? 112 : 298;
            const accent = st.track === 'best' ? p.navy : p.green;
            const inStack = selectedIds.includes(st.appId);
            return (
              <g
                key={st.id}
                onClick={() => setActiveStageId(st.id)}
                onMouseEnter={(e) =>
                  showTip(
                    {
                      id: `p3-stage-${st.id}`,
                      code: `${st.step} · ${st.track === 'best' ? 'BEST RETAIL' : 'X LTD EV'}`,
                      title: st.title,
                      summary: st.detail,
                      metric: st.metric,
                      status: inStack ? 'IN STACK' : isSelected ? 'SELECTED' : 'CAPTIVE PROOF',
                      hint: 'Click to inspect & bind app',
                      accent: st.track === 'xltd' || inStack ? 'emerald' : 'navy',
                    },
                    e,
                  )
                }
                onMouseMove={moveTip}
                onMouseLeave={clearTip}
                opacity={isDimmed ? 0.28 : 1}
                className="cursor-pointer"
              >
                <rect
                  x={st.x}
                  y={nodeY}
                  width="184"
                  height="78"
                  rx="8"
                  fill={isSelected ? p.cardActive : p.card}
                  stroke={isSelected ? accent : inStack ? p.green : p.hairlineStrong}
                  strokeWidth={isSelected ? 1.9 : 1.1}
                />
                <text
                  x={st.x + 12}
                  y={nodeY + 20}
                  fill={accent}
                  fontSize="9"
                  fontWeight="800"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {st.step} · {inStack ? 'IN STACK' : 'MODULE'}
                </text>
                <text
                  x={st.x + 12}
                  y={nodeY + 41}
                  fill={p.ink}
                  fontSize="11.5"
                  fontWeight="700"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {st.title}
                </text>
                <text
                  x={st.x + 12}
                  y={nodeY + 60}
                  fill={p.muted}
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {st.metric}
                </text>
              </g>
            );
          })}

          <text
            x="854"
            y="418"
            textAnchor="end"
            fill={p.navy}
            fontSize="9"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            PLATE 03 · SPENTA DHAKA EDITION
          </text>
        </svg>
      </div>

      {/* Inline Stage Proof + Module Toggle */}
      <div
        className="px-4 py-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs"
        style={{ backgroundColor: p.band, borderColor: p.hairline }}
      >
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-bold" style={{ color: p.navy }}>
            {activeStage.step} · {activeStage.title} · {activeStage.metric}
          </div>
          <div className="text-[11px] mt-0.5 truncate" style={{ color: p.body }}>
            {activeStage.detail}
          </div>
        </div>
        {linkedApp && (
          <button
            type="button"
            onClick={() => toggleApp(linkedApp.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-[10px] font-semibold border cursor-pointer whitespace-nowrap shrink-0"
            style={{
              backgroundColor: linkedInStack ? p.green : p.card,
              color: linkedInStack ? (polarity === 'dark' ? '#0B1020' : '#FFFFFF') : p.ink,
              borderColor: linkedInStack ? p.green : p.hairlineStrong,
            }}
          >
            {linkedInStack ? <Check className="w-3 h-3" strokeWidth={2.5} /> : <Plus className="w-3 h-3" />}
            <span>
              {linkedInStack ? `In Stack: ${linkedApp.shortName}` : `Add ${linkedApp.shortName}`}
            </span>
          </button>
        )}
      </div>

      <ArchitectureNodeTooltip data={tip} isDark={polarity === 'dark'} />
    </div>
  );
}

/* ============================================================================
 * PLATE 04: Reconciled FY2027–FY2031 Trajectory & Dual-Shore Cost Edge
 * ========================================================================== */
function Plate04FinancialEdge({
  polarity,
  svgRef,
}: {
  polarity: 'light' | 'dark';
  svgRef?: React.RefObject<SVGSVGElement | null>;
}) {
  const [scenario, setScenario] = useState<'conservative' | 'upside'>('conservative');
  const [selectedYear, setSelectedYear] = useState<string>('FY2031');
  const { tip, showTip, moveTip, clearTip } = usePlateTooltip();
  const p = getOitsPalette(polarity);

  const activeFy =
    FINANCIAL_TRAJECTORY.find((f) => f.year === selectedYear) ?? FINANCIAL_TRAJECTORY[4];
  const maxRev = scenario === 'conservative' ? 6200 : 10200;

  const chartBaseY = 354;
  const chartHeight = 224;
  const barX = (idx: number) => 66 + idx * 84;
  const yForVal = (valK: number) => chartBaseY - Math.round((valK / maxRev) * chartHeight);

  const ebitdaPoints = FINANCIAL_TRAJECTORY.map((fy, i) => {
    const v = scenario === 'conservative' ? fy.conservativeEbitdaK : fy.upsideEbitdaK;
    return `${barX(i) + 22},${yForVal(v)}`;
  }).join(' ');

  const netPoints = FINANCIAL_TRAJECTORY.map((fy, i) => {
    const v = scenario === 'conservative' ? fy.conservativeNetProfitK : fy.upsideNetProfitK;
    return `${barX(i) + 22},${yForVal(v)}`;
  }).join(' ');

  const activeRev =
    scenario === 'conservative' ? activeFy.conservativeRevK : activeFy.upsideRevK;
  const activeEbitda =
    scenario === 'conservative' ? activeFy.conservativeEbitdaK : activeFy.upsideEbitdaK;
  const activeNet =
    scenario === 'conservative' ? activeFy.conservativeNetProfitK : activeFy.upsideNetProfitK;
  const activeMilestone =
    scenario === 'conservative' ? activeFy.milestone : activeFy.upsideMilestone;

  const scenarioCumNetK = FINANCIAL_TRAJECTORY.reduce(
    (sum, fy) => sum + (scenario === 'conservative' ? fy.conservativeNetProfitK : fy.upsideNetProfitK),
    0,
  );
  const scenarioCumNetM = scenarioCumNetK / 1000;
  const scenarioCapEff = scenarioCumNetK / 500;
  const y5Row = FINANCIAL_TRAJECTORY[FINANCIAL_TRAJECTORY.length - 1];
  const y5EbitdaM = (scenario === 'conservative' ? y5Row.conservativeEbitdaK : y5Row.upsideEbitdaK) / 1000;
  const ownershipFrac = 500 / 4500; // 11.11% Post-Money SAFE
  const safeRoiLow = ((y5EbitdaM * 10) * ownershipFrac) / 0.5;
  const safeRoiHigh = ((y5EbitdaM * 15) * ownershipFrac) / 0.5;
  const safeRoiRange = `${safeRoiLow.toFixed(2)}×–${safeRoiHigh.toFixed(2)}×`;

  return (
    <div className="flex flex-col" style={{ backgroundColor: p.bg, color: p.ink }}>
      {/* Scenario Switcher Micro-Bar */}
      <div
        className="px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-[11px]"
        style={{ backgroundColor: p.band, borderColor: p.hairline }}
      >
        <span className="font-mono text-[10px] font-bold" style={{ color: p.muted }}>
          TRAJECTORY SCENARIO ($500K POST-MONEY SAFE · $4.5M CAP)
        </span>
        <div className="inline-flex items-center gap-1">
          {([
            { id: 'conservative', label: 'Conservative (~0.5825× avg)' },
            { id: 'upside', label: 'Upside Case' },
          ] as const).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setScenario(opt.id)}
              className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: scenario === opt.id ? p.navy : p.card,
                color:
                  scenario === opt.id
                    ? polarity === 'dark'
                      ? '#0B1020'
                      : '#FFFFFF'
                    : p.body,
                border: `1px solid ${scenario === opt.id ? p.navy : p.hairlineStrong}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 880 430"
          className="w-full h-auto block select-none"
          role="img"
          aria-label="Plate 04: FY2027 to FY2031 Financial Trajectory and Dual-Shore Cost Edge"
        >
          <rect x="0" y="0" width="880" height="430" fill={p.bg} />

          {/* Header Bar */}
          <rect x="20" y="16" width="840" height="36" rx="8" fill={p.band} stroke={p.hairline} />
          <text
            x="36"
            y="38"
            fill={p.navy}
            fontSize="10"
            fontWeight="800"
            fontFamily="JetBrains Mono, monospace"
          >
            04. RECONCILED 5-YEAR P&amp;L TRAJECTORY &amp; DHAKA DUAL-SHORE ARBITRAGE
          </text>
          <text
            x="844"
            y="38"
            textAnchor="end"
            fill={p.green}
            fontSize="10"
            fontWeight="800"
            fontFamily="JetBrains Mono, monospace"
          >
            {scenarioCapEff.toFixed(2)}× CAP. EFF. · {safeRoiRange} SAFE ROI · 76.3% XR GM
          </text>

          {/* Left Chart Card */}
          <rect x="20" y="68" width="492" height="330" rx="10" fill={p.card} stroke={p.hairline} />
          <text
            x="36"
            y="92"
            fill={p.ink}
            fontSize="11"
            fontWeight="700"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            FY2027–FY2031 Revenue, EBITDA &amp; Net Profit ({scenario === 'conservative' ? 'Conservative' : 'Upside'})
          </text>
          <text
            x="36"
            y="108"
            fill={p.muted}
            fontSize="8.8"
            fontFamily="JetBrains Mono, monospace"
          >
            CLICK ANY FISCAL YEAR BAR · VALUES IN USD THOUSANDS ($K)
          </text>

          {/* Horizontal Hairline Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const gy = chartBaseY - Math.round(frac * chartHeight);
            const labelVal = Math.round(frac * maxRev);
            return (
              <g key={`grid-${frac}`}>
                <line x1="56" y1={gy} x2="494" y2={gy} stroke={p.hairline} strokeWidth="1" />
                <text
                  x="50"
                  y={gy + 3}
                  textAnchor="end"
                  fill={p.muted}
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                >
                  ${labelVal >= 1000 ? `${(labelVal / 1000).toFixed(1)}M` : `${labelVal}K`}
                </text>
              </g>
            );
          })}

          {/* Interactive Revenue Bars */}
          {FINANCIAL_TRAJECTORY.map((fy, i) => {
            const rev = scenario === 'conservative' ? fy.conservativeRevK : fy.upsideRevK;
            const x = barX(i);
            const topY = yForVal(rev);
            const h = Math.max(8, chartBaseY - topY);
            const isSel = fy.year === selectedYear;
            const fyEbitda =
              scenario === 'conservative' ? fy.conservativeEbitdaK : fy.upsideEbitdaK;
            const fyNet =
              scenario === 'conservative' ? fy.conservativeNetProfitK : fy.upsideNetProfitK;
            return (
              <g
                key={fy.year}
                onClick={() => setSelectedYear(fy.year)}
                onMouseEnter={(e) =>
                  showTip(
                    {
                      id: `p4-fy-${fy.year}`,
                      code: `${fy.year} · ${scenario.toUpperCase()}`,
                      title: `${fy.label} Trajectory`,
                      summary: scenario === 'conservative' ? fy.milestone : fy.upsideMilestone,
                      metric: `Rev $${rev.toLocaleString()}K · EBITDA $${fyEbitda.toLocaleString()}K · Net $${fyNet.toLocaleString()}K`,
                      status: isSel ? 'SELECTED YEAR' : 'CLICK TO PIN',
                      hint: 'Switch scenario above',
                      accent: isSel ? 'emerald' : 'navy',
                    },
                    e,
                  )
                }
                onMouseMove={moveTip}
                onMouseLeave={clearTip}
                className="cursor-pointer"
              >
                <rect
                  x={x}
                  y={topY}
                  width="44"
                  height={h}
                  rx="5"
                  fill={isSel ? p.navy : p.navySoft}
                  stroke={p.navy}
                  strokeWidth={isSel ? 1.8 : 1}
                />
                <text
                  x={x + 22}
                  y={topY - 6}
                  textAnchor="middle"
                  fill={isSel ? p.navy : p.body}
                  fontSize="8.8"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  ${rev >= 1000 ? `${(rev / 1000).toFixed(2)}M` : `${rev}K`}
                </text>
                <text
                  x={x + 22}
                  y={chartBaseY + 18}
                  textAnchor="middle"
                  fill={isSel ? p.ink : p.muted}
                  fontSize="9.5"
                  fontWeight={isSel ? '800' : '600'}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {fy.year}
                </text>
              </g>
            );
          })}

          {/* EBITDA & Net Profit Overlay Lines */}
          <polyline
            fill="none"
            stroke={p.green}
            strokeWidth="2.2"
            points={ebitdaPoints}
          />
          <polyline
            fill="none"
            stroke={p.amber}
            strokeWidth="1.8"
            strokeDasharray="4 3"
            points={netPoints}
          />
          {FINANCIAL_TRAJECTORY.map((fy, i) => {
            const eb = scenario === 'conservative' ? fy.conservativeEbitdaK : fy.upsideEbitdaK;
            return (
              <circle
                key={`dot-${fy.year}`}
                cx={barX(i) + 22}
                cy={yForVal(eb)}
                r={fy.year === selectedYear ? 4.5 : 3}
                fill={p.green}
                stroke={p.card}
                strokeWidth="1.5"
              />
            );
          })}

          {/* Legend */}
          <text x="58" y="388" fill={p.navy} fontSize="8.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
            ■ Revenue
          </text>
          <text x="140" y="388" fill={p.green} fontSize="8.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
            — EBITDA
          </text>
          <text x="220" y="388" fill={p.amber} fontSize="8.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
            -- Net Profit
          </text>

          {/* Right Panel: Dual-Shore Hourly Cost Arbitrage */}
          <rect x="526" y="68" width="334" height="330" rx="10" fill={p.card} stroke={p.hairline} />
          <text
            x="542"
            y="92"
            fill={p.ink}
            fontSize="11"
            fontWeight="700"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            Dual-Shore Engineering Cost Advantage
          </text>
          <text
            x="542"
            y="108"
            fill={p.muted}
            fontSize="8.8"
            fontFamily="JetBrains Mono, monospace"
          >
            BLENDED HOURLY RATE ($/HR) · 40%–60% CLIENT COST EDGE
          </text>

          {DUAL_SHORE_COMPARISON.map((row, idx) => {
            const ry = 132 + idx * 54;
            const w = Math.max(24, Math.round((row.hourlyUsd / 155) * 288));
            const isDhaka = idx === 0;
            return (
              <g
                key={row.role}
                onMouseEnter={(e) =>
                  showTip(
                    {
                      id: `p4-shore-${idx}`,
                      code: isDhaka ? 'DHAKA R&D POD' : 'BENCHMARK',
                      title: row.role,
                      summary: `${row.edgeLabel}. Dual-shore San Jose · Australia · Dhaka model delivers 40%–60% client price savings vs. Western agencies while sustaining 29%–76% product GMs.`,
                      metric: `$${row.hourlyUsd.toFixed(row.hourlyUsd % 1 === 0 ? 0 : 2)}/hr blended`,
                      status: isDhaka ? 'SPENTA ADVANTAGE' : 'MARKET RATE',
                      hint: 'Cost arbitrage benchmark',
                      accent: isDhaka ? 'emerald' : idx === 3 ? 'crimson' : 'navy',
                    },
                    e,
                  )
                }
                onMouseMove={moveTip}
                onMouseLeave={clearTip}
                className="cursor-default"
              >
                <text
                  x="542"
                  y={ry}
                  fill={isDhaka ? p.green : p.ink}
                  fontSize="9.8"
                  fontWeight={isDhaka ? '800' : '600'}
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {row.role}
                </text>
                <text
                  x="844"
                  y={ry}
                  textAnchor="end"
                  fill={isDhaka ? p.green : p.ink}
                  fontSize="10"
                  fontWeight="800"
                  fontFamily="JetBrains Mono, monospace"
                >
                  ${row.hourlyUsd.toFixed(row.hourlyUsd % 1 === 0 ? 0 : 2)}/hr
                </text>
                <rect x="542" y={ry + 8} width="302" height="12" rx="4" fill={p.band} />
                <rect
                  x="542"
                  y={ry + 8}
                  width={w}
                  height="12"
                  rx="4"
                  fill={isDhaka ? p.green : idx === 3 ? p.crimson : p.navy}
                  opacity={isDhaka ? 1 : 0.72}
                />
                <text
                  x="542"
                  y={ry + 32}
                  fill={p.muted}
                  fontSize="8.3"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {row.edgeLabel}
                </text>
              </g>
            );
          })}

          {/* SAFE Terms Summary Box inside Right Card */}
          <g
            onMouseEnter={(e) =>
              showTip(
                {
                  id: 'p4-safe-box',
                  code: 'SEED SAFE',
                  title: '$500K Post-Money SAFE · $4.5M Cap',
                  summary: `Reconciled 5-year ${scenario} projection delivers $${scenarioCumNetM.toFixed(3)}M cumulative net profit (${scenarioCapEff.toFixed(2)}× operating capital efficiency) and ${safeRoiRange} modeled SAFE equity ROI at 10×–15× Y5 EBITDA.`,
                  metric: `${scenarioCapEff.toFixed(2)}× Cap. Eff. · ${safeRoiRange} SAFE`,
                  status: scenario === 'conservative' ? 'CONSERVATIVE BASE' : 'UPSIDE CASE',
                  hint: 'See Financials tab',
                  accent: 'emerald',
                },
                e,
              )
            }
            onMouseMove={moveTip}
            onMouseLeave={clearTip}
            className="cursor-default"
          >
            <rect x="542" y="346" width="302" height="38" rx="7" fill={p.greenSoft} stroke={p.green} />
            <text
              x="554"
              y="362"
              fill={p.green}
              fontSize="9"
              fontWeight="800"
              fontFamily="JetBrains Mono, monospace"
            >
              $500K POST-SAFE · $4.5M CAP · 20% DISC.
            </text>
            <text
              x="554"
              y="376"
              fill={p.body}
              fontSize="8.3"
              fontFamily="JetBrains Mono, monospace"
            >
              {scenarioCapEff.toFixed(2)}× Cap. Eff. (${scenarioCumNetM.toFixed(2)}M Net) · {safeRoiRange} SAFE
            </text>
          </g>

          <text
            x="854"
            y="418"
            textAnchor="end"
            fill={p.navy}
            fontSize="9"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            PLATE 04 · SPENTA DHAKA EDITION
          </text>
        </svg>
      </div>

      {/* Inline Fiscal Year Telemetry Strip */}
      <div
        className="px-4 py-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs"
        style={{ backgroundColor: p.band, borderColor: p.hairline }}
      >
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-bold tabular-nums" style={{ color: p.navy }}>
            {activeFy.year} ({activeFy.label} · {scenario === 'conservative' ? 'Base' : 'Upside'}) · Rev $
            {activeRev.toLocaleString()}K · EBITDA ${activeEbitda.toLocaleString()}K · Net $
            {activeNet.toLocaleString()}K
          </div>
          <div className="text-[11px] mt-0.5 truncate" style={{ color: p.body }}>
            {activeMilestone}
          </div>
        </div>
        <span className="font-mono text-[10px] shrink-0" style={{ color: p.green }}>
          Click FY27–FY31 bars to inspect
        </span>
      </div>

      <ArchitectureNodeTooltip data={tip} isDark={polarity === 'dark'} />
    </div>
  );
}

export function InteractiveInfographicPlate({ plateId, polarity, svgRef }: InteractivePlateProps) {
  const internalRef = useRef<SVGSVGElement | null>(null);
  const effectiveRef = svgRef ?? internalRef;

  if (plateId === 'ai-brain') {
    return <Plate01BrainTopology polarity={polarity} svgRef={effectiveRef} />;
  }
  if (plateId === 'l1-l6-stack') {
    return <Plate02StackAndServers polarity={polarity} svgRef={effectiveRef} />;
  }
  if (plateId === 'captive-ecosystem') {
    return <Plate03CaptiveSynergies polarity={polarity} svgRef={effectiveRef} />;
  }
  return <Plate04FinancialEdge polarity={polarity} svgRef={effectiveRef} />;
}
