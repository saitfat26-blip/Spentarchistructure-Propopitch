import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Box,
  Brain,
  Check,
  CheckCircle2,
  ExternalLink,
  Globe,
  Link2,
  Loader2,
  Moon,
  Plus,
  Radar,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import {
  AGENTIC_VERTICALS,
  BLUEPRINT_PILLARS,
  BRAIN_HUBS,
  HITL_SAMPLE_EVENTS,
  NavTab,
  SPENTA_APPS,
} from '../data/spentaManifest';
import { useTheme } from '../context/ThemeContext';
import { useStack } from '../store/StackContext';
import { usePathwayBrainSync } from '../hooks/usePathwayBrainSync';
import { SovereignBrain3D } from './three/SovereignBrain3D';
import { copyTextWithFallback } from '../utils/shareUrlCodec';
import brainStoneSculptImg from '../assets/images/brain_stone_sculpt_1795257685678.jpg';
import brainNocturnalCoreImg from '../assets/images/brain_nocturnal_core_1795257688515.jpg';
import brainDualSynapseImg from '../assets/images/brain_dual_synapse_1795257687722.jpg';

type BrainBackdropVariantId = 'auto' | 'stone-sculpt' | 'nocturnal-core' | 'dual-synapse' | 'none';

interface Brain3DAssetVariant {
  id: Exclude<BrainBackdropVariantId, 'auto' | 'none'>;
  title: string;
  themeBadge: string;
  caption: string;
  src: string;
  alt: string;
  recommendedPolarity: 'light' | 'dark' | 'dual';
}

const BRAIN_3D_ASSET_VARIANTS: Brain3DAssetVariant[] = [
  {
    id: 'stone-sculpt',
    title: 'Stone Alabaster Rings',
    themeBadge: 'Stone Light',
    caption: 'Concentric honed limestone & opal glass neural orbits with heritage navy filaments.',
    src: brainStoneSculptImg,
    alt: 'Abstract 3D warm stone alabaster neural concentric rings with navy steel filaments and emerald glass nodes',
    recommendedPolarity: 'light',
  },
  {
    id: 'nocturnal-core',
    title: 'Nocturnal Sapphire Core',
    themeBadge: 'Nocturnal Navy',
    caption: 'Smoked sapphire glass neural folds interlocked inside brushed dark titanium rings.',
    src: brainNocturnalCoreImg,
    alt: 'Abstract 3D nocturnal midnight navy smoked glass neural sculpture inside brushed titanium orbital rings',
    recommendedPolarity: 'dark',
  },
  {
    id: 'dual-synapse',
    title: 'Dual-Theme Synapse Bridge',
    themeBadge: 'Stone × Navy',
    caption: 'Travertine architectural plinth bridged via brushed titanium arcs into sapphire glass.',
    src: brainDualSynapseImg,
    alt: 'Abstract 3D architectural bridge connecting warm travertine limestone and dark nocturnal sapphire glass with titanium arcs',
    recommendedPolarity: 'dual',
  },
];

interface GroundedBriefState {
  text: string;
  sources: { title: string; uri: string }[];
  query: string;
}

type RadarQuadrant =
  | 'All'
  | 'Healthcare & Bio'
  | 'Banking & Fintech'
  | 'Enterprise & Data'
  | 'XR, Voice & Edge';

interface RadarNodeSpec {
  appId: string;
  code: string;
  quadrant: Exclude<RadarQuadrant, 'All'>;
  ring: 'CORE' | 'PRODUCTION' | 'PILOT';
  angleDeg: number;
  radius: number;
}

const RADAR_NODES: RadarNodeSpec[] = [
  // Top-Left (180..270): Healthcare & Bio / Security
  { appId: 'healthcare_erp', code: 'HC', quadrant: 'Healthcare & Bio', ring: 'CORE', angleDeg: 215, radius: 74 },
  { appId: 'cyber_sla', code: 'SEC', quadrant: 'Healthcare & Bio', ring: 'CORE', angleDeg: 248, radius: 66 },
  { appId: 'datasets', code: 'DATA', quadrant: 'Healthcare & Bio', ring: 'PRODUCTION', angleDeg: 202, radius: 138 },

  // Top-Right (270..360): Banking & Fintech
  { appId: 'icr_ops', code: 'ICR', quadrant: 'Banking & Fintech', ring: 'CORE', angleDeg: 300, radius: 72 },
  { appId: 'fintech_rails', code: 'MFS', quadrant: 'Banking & Fintech', ring: 'PRODUCTION', angleDeg: 332, radius: 132 },
  { appId: 'workflow_ai', code: 'AGT', quadrant: 'Banking & Fintech', ring: 'PRODUCTION', angleDeg: 286, radius: 146 },

  // Bottom-Left (90..180): Enterprise & Data
  { appId: 'mis_erp', code: 'MIS', quadrant: 'Enterprise & Data', ring: 'CORE', angleDeg: 142, radius: 76 },
  { appId: 'genai_bi', code: 'BI', quadrant: 'Enterprise & Data', ring: 'PRODUCTION', angleDeg: 118, radius: 136 },
  { appId: 'legacy_mod', code: 'MOD', quadrant: 'Enterprise & Data', ring: 'PILOT', angleDeg: 162, radius: 194 },

  // Bottom-Right (0..90): XR, Voice & Edge
  { appId: 'spatial_xr', code: 'XR', quadrant: 'XR, Voice & Edge', ring: 'CORE', angleDeg: 38, radius: 78 },
  { appId: 'voice_ai', code: 'VOX', quadrant: 'XR, Voice & Edge', ring: 'PRODUCTION', angleDeg: 64, radius: 142 },
  { appId: 'iot_edge', code: 'IOT', quadrant: 'XR, Voice & Edge', ring: 'PRODUCTION', angleDeg: 20, radius: 146 },
  { appId: 'branding_geo', code: 'GEO', quadrant: 'XR, Voice & Edge', ring: 'PILOT', angleDeg: 52, radius: 198 },
];

const GROUNDING_PRESETS = [
  'Latest 2026 enterprise on-prem LLM server hardware pricing vs cloud GPU APIs',
  'Current global healthcare AI clinical ERP & HL7 FHIR adoption benchmarks 2026',
  'Bangladesh Bank ICT security & financial data residency compliance expectations',
];

function polarCoords(angleDeg: number, radius: number): { cx: number; cy: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    cx: 260 + Math.cos(rad) * radius,
    cy: 260 + Math.sin(rad) * radius,
  };
}

const BRAIN_VISUAL_MODE_STORAGE_KEY = 'spenta_brain_visual_mode_v1';

function loadStoredBrainVisualMode(): 'radar' | '3d' {
  try {
    const raw = window.localStorage.getItem(BRAIN_VISUAL_MODE_STORAGE_KEY);
    if (raw === 'radar' || raw === '3d') return raw;
  } catch {
    // ignore storage errors
  }
  return '3d';
}

export function TheBrainView() {
  const { theme: brainPolarity, setTheme: setBrainPolarity } = useTheme();
  const {
    hitlConfidence,
    setHitlConfidence,
    selectedIds,
    toggleApp,
    appMap,
    pendingNavFocus,
    clearPendingNavFocus,
    navigateToItem,
    buildShareUrl,
    setAiAssistantOpen,
  } = useStack();

  const {
    activeBrainSelection,
    activeHub,
    activeApp,
    selectBrainNode,
  } = usePathwayBrainSync();

  const [visualMode, setVisualMode] = useState<'radar' | '3d'>(loadStoredBrainVisualMode);

  useEffect(() => {
    try {
      window.localStorage.setItem(BRAIN_VISUAL_MODE_STORAGE_KEY, visualMode);
    } catch {
      // ignore storage errors
    }
  }, [visualMode]);
  const [backdropVariant, setBackdropVariant] = useState<BrainBackdropVariantId>('auto');
  const [quadrantFilter, setQuadrantFilter] = useState<RadarQuadrant>('All');
  const [returnContext, setReturnContext] = useState<{ tab: NavTab; label: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [hoveredRadarId, setHoveredRadarId] = useState<string | null>(null);
  const [blueprintTab, setBlueprintTab] = useState<'pillars' | 'verticals'>('pillars');
  const [blueprintQuery, setBlueprintQuery] = useState('');
  const [groundQuery, setGroundQuery] = useState('');
  const [groundLoading, setGroundLoading] = useState(false);
  const [groundError, setGroundError] = useState<string | null>(null);
  const [groundResult, setGroundResult] = useState<GroundedBriefState | null>(null);

  const selectedHubId = activeBrainSelection.hubId;
  const focusedAppId = activeApp.id;
  const hubFocusNonce = activeBrainSelection.nonce;

  useEffect(() => {
    if (pendingNavFocus?.type === 'blueprint') {
      const q = pendingNavFocus.id;
      const isVert = AGENTIC_VERTICALS.some((v) => v.name === q);
      setBlueprintTab(isVert ? 'verticals' : 'pillars');
      setBlueprintQuery(q);
      clearPendingNavFocus();
      return;
    }

    if (pendingNavFocus?.type === 'brain-hub') {
      const validHub = BRAIN_HUBS.find((h) => h.id === pendingNavFocus.id) ?? BRAIN_HUBS[0];
      const nextAppId =
        pendingNavFocus.appId && appMap[pendingNavFocus.appId]
          ? pendingNavFocus.appId
          : SPENTA_APPS.find((a) => a.hubId === validHub.id)?.id;
      if (
        activeBrainSelection.hubId !== validHub.id ||
        activeBrainSelection.appId !== nextAppId
      ) {
        selectBrainNode(validHub.id, nextAppId, 'brain');
      }
      setVisualMode(pendingNavFocus.open3D === false ? 'radar' : '3d');
      if (pendingNavFocus.returnTab) {
        setReturnContext({
          tab: pendingNavFocus.returnTab,
          label: pendingNavFocus.returnLabel ?? 'Pathway',
        });
      }
      clearPendingNavFocus();
    }
  }, [
    pendingNavFocus,
    clearPendingNavFocus,
    appMap,
    activeBrainSelection.hubId,
    activeBrainSelection.appId,
    selectBrainNode,
  ]);

  // Bidirectional 3D Hub <-> Architecture Profile synchronization
  const handleSelect3DHub = (hubId: string) => {
    const hubApps = SPENTA_APPS.filter((a) => a.hubId === hubId);
    selectBrainNode(hubId, hubApps[0]?.id, 'brain');
  };

  const handleSelectRadarApp = (appId: string) => {
    const app = appMap[appId];
    if (app) {
      selectBrainNode(app.hubId, appId, 'brain');
    }
  };

  const runLiveGrounding = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? groundQuery).trim();
    if (!q || groundLoading) return;
    setGroundQuery(q);
    setGroundLoading(true);
    setGroundError(null);
    try {
      const res = await fetch('/api/gemini/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
      setGroundResult({
        query: q,
        text: data.text,
        sources: Array.isArray(data.sources) ? data.sources : [],
      });
    } catch (err) {
      setGroundError(err instanceof Error ? err.message : 'Unable to run Search Grounding.');
    } finally {
      setGroundLoading(false);
    }
  };

  const passGate = hitlConfidence >= 0.88;
  const inspectedApp = appMap[hoveredRadarId ?? focusedAppId] ?? SPENTA_APPS[0];
  const inspectedInStack = selectedIds.includes(inspectedApp.id);
  const hubSiblingApps = useMemo(
    () => SPENTA_APPS.filter((a) => a.hubId === activeHub.id),
    [activeHub.id],
  );

  const simulatedEvents = useMemo(() => {
    const delta = hitlConfidence - 0.88;
    return HITL_SAMPLE_EVENTS.map((evt) => {
      const score = Math.max(
        0.5,
        Math.min(0.99, Number((evt.baseConfidence + delta * 0.45).toFixed(2))),
      );
      return {
        ...evt,
        liveScore: score,
        autoApproved: score >= 0.88,
      };
    });
  }, [hitlConfidence]);

  const filteredPillars = useMemo(() => {
    const q = blueprintQuery.trim().toLowerCase();
    if (!q) return BLUEPRINT_PILLARS;
    return BLUEPRINT_PILLARS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.metrics.some((m) => m.toLowerCase().includes(q)),
    );
  }, [blueprintQuery]);

  const filteredVerticals = useMemo(() => {
    const q = blueprintQuery.trim().toLowerCase();
    if (!q) return AGENTIC_VERTICALS;
    return AGENTIC_VERTICALS.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.think.toLowerCase().includes(q) ||
        v.learn.toLowerCase().includes(q) ||
        v.solve.toLowerCase().includes(q) ||
        v.proof.toLowerCase().includes(q),
    );
  }, [blueprintQuery]);

  const isDark = brainPolarity === 'dark';

  // Spenta Stone Light & Nocturnal Navy Editorial Palette Classes
  const surfaceCard = isDark
    ? 'bg-[#141A32] border-[#232B4A] text-[#E7EBF5]'
    : 'bg-[#FFFFFF] border-[#E4DFD6] text-[#16213A]';
  const bandSurface = isDark
    ? 'bg-[#0F1529] border-[#232B4A] text-[#E7EBF5]'
    : 'bg-[#FAF8F4] border-[#E4DFD6] text-[#16213A]';
  const recessedBox = isDark
    ? 'bg-[#0B1020] border-[#232B4A]'
    : 'bg-[#F2EFE9] border-[#E4DFD6]';
  const bodyInk = isDark ? 'text-[#C3CCE4]' : 'text-[#4A5163]';
  const mutedInk = isDark ? 'text-[#8D97B5]' : 'text-[#5F6576]';
  const brandInk = isDark ? 'text-[#8FA6E8]' : 'text-[#1F3863]';
  const greenInk = isDark ? 'text-[#6FCB9F]' : 'text-[#1C6E46]';
  const amberInk = isDark ? 'text-[#E0B063]' : 'text-[#8A5C10]';

  // Radar SVG Stone / Nocturnal Tokens
  const rNavy = isDark ? '#8FA6E8' : '#1F3863';
  const rGreen = isDark ? '#6FCB9F' : '#1C6E46';
  const rAmber = isDark ? '#E0B063' : '#8A5C10';
  const rGrid = isDark ? '#232B4A' : '#E4DFD6';
  const rGridStrong = isDark ? '#34416E' : '#CFC8BC';
  const rInk = isDark ? '#E7EBF5' : '#16213A';
  const rMuted = isDark ? '#8D97B5' : '#5F6576';
  const rNodeIdle = isDark ? '#0F1529' : '#FAF8F4';

  const focusedNodeSpec = RADAR_NODES.find((n) => n.appId === inspectedApp.id);
  const focusedPos = focusedNodeSpec
    ? polarCoords(focusedNodeSpec.angleDeg, focusedNodeSpec.radius)
    : null;

  const activeBackdropAsset = useMemo<Brain3DAssetVariant | null>(() => {
    if (backdropVariant === 'none') return null;
    if (backdropVariant === 'auto') {
      return isDark ? BRAIN_3D_ASSET_VARIANTS[1] : BRAIN_3D_ASSET_VARIANTS[0];
    }
    return BRAIN_3D_ASSET_VARIANTS.find((v) => v.id === backdropVariant) ?? BRAIN_3D_ASSET_VARIANTS[0];
  }, [backdropVariant, isDark]);

  return (
    <div className="space-y-6">
      {/* Spenta Editorial Header with Theme-Matched 3D Abstract Backdrop Texture */}
      <section className={`relative overflow-hidden rounded-[10px] border p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors ${bandSurface}`}>
        {activeBackdropAsset && (
          <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
            <img
              src={activeBackdropAsset.src}
              alt=""
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover object-center transition-opacity duration-300 ${
                isDark ? 'opacity-30' : 'opacity-25'
              }`}
            />
            <div
              className={`absolute inset-0 ${
                isDark
                  ? 'bg-gradient-to-r from-[#0F1529]/95 via-[#0F1529]/82 to-[#0F1529]/45'
                  : 'bg-gradient-to-r from-[#FAF8F4]/96 via-[#FAF8F4]/86 to-[#FAF8F4]/50'
              }`}
            />
          </div>
        )}
        <div className="relative z-10 min-w-0">
          <div className={`text-[11px] font-mono font-semibold ${brandInk}`}>
            Spenta Dhaka Edition · Sovereign Operational Tech Radar &amp; 3D Spiral Galaxy Neural Core
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1 text-balance">
            The Brain — Sovereign Tech Radar, 3D Galaxy Core &amp; 0.88 HITL Simulator
          </h1>
          <p className={`text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed ${bodyInk}`}>
            Inspect all 13 modules across CORE, PRODUCTION, and PILOT rings with live synergy arcs, explore the realistic 3D Spiral Galaxy &amp; Solar Core synced to your Architecture Profile, and test deterministic OPA 0.88 confidence gating.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2 self-start xl:self-auto">
          {returnContext && (
            <button
              type="button"
              onClick={() => {
                const targetTab = returnContext.tab;
                setReturnContext(null);
                navigateToItem(targetTab);
              }}
              className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isDark
                  ? 'bg-[#141A32] border-[#6FCB9F]/50 text-[#6FCB9F] hover:bg-[#1B2547]'
                  : 'bg-white border-[#1C6E46]/40 text-[#1C6E46] hover:bg-[#EBF6F0]'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.8} />
              <span>Return to {returnContext.label}</span>
            </button>
          )}

          {/* Radar vs 3D Segmented Toggle */}
          <div
            role="group"
            aria-label="Brain visualization mode"
            className={`inline-flex flex-wrap rounded-lg p-1 border ${recessedBox}`}
          >
            <button
              type="button"
              onClick={() => setVisualMode('radar')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                visualMode === 'radar'
                  ? isDark
                    ? 'bg-[#8FA6E8] text-[#0B1020]'
                    : 'bg-[#1F3863] text-white'
                  : `${bodyInk} hover:opacity-100`
              }`}
            >
              <Radar className="w-3.5 h-3.5" strokeWidth={1.6} />
              <span>Operational Tech Radar</span>
            </button>
            <button
              type="button"
              onClick={() => setVisualMode('3d')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                visualMode === '3d'
                  ? isDark
                    ? 'bg-[#8FA6E8] text-[#0B1020]'
                    : 'bg-[#1F3863] text-white'
                  : `${bodyInk} hover:opacity-100`
              }`}
            >
              <Box className="w-3.5 h-3.5" strokeWidth={1.6} />
              <span>3D Neural Core</span>
            </button>
          </div>

          <button
            type="button"
            onClick={async () => {
              const ok = await copyTextWithFallback(
                buildShareUrl({
                  tab: 'The Brain',
                  hubId: activeHub.id,
                  brainMode: visualMode,
                }),
              );
              if (ok) {
                setLinkCopied(true);
                window.setTimeout(() => setLinkCopied(false), 2000);
              }
            }}
            className={`inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isDark
                ? 'bg-[#141A32] border-[#232B4A] text-[#E7EBF5] hover:border-[#8FA6E8]'
                : 'bg-white border-[#E4DFD6] text-[#16213A] hover:border-[#1F3863]'
            }`}
            title="Copy shareable link focused on this Brain Hub"
          >
            {linkCopied ? (
              <Check className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" strokeWidth={2} />
            ) : (
              <Link2 className="w-3.5 h-3.5" strokeWidth={1.6} />
            )}
            <span>{linkCopied ? 'Copied' : 'Share View'}</span>
          </button>

          {/* Local Spenta Dhaka Stone Light / Nocturnal Dark Toggle */}
          <div
            role="group"
            aria-label="The Brain Spenta Dhaka polarity"
            className={`inline-flex rounded-lg p-1 border ${recessedBox}`}
          >
            <button
              type="button"
              onClick={() => setBrainPolarity('light')}
              aria-pressed={!isDark}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                !isDark
                  ? 'bg-[#1F3863] text-white'
                  : 'text-[#8D97B5] hover:text-[#E7EBF5]'
              }`}
            >
              <Sun className="w-3.5 h-3.5" strokeWidth={1.6} />
              <span>Stone</span>
            </button>
            <button
              type="button"
              onClick={() => setBrainPolarity('dark')}
              aria-pressed={isDark}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isDark
                  ? 'bg-[#8FA6E8] text-[#0B1020]'
                  : 'text-[#4A5163] hover:text-[#16213A]'
              }`}
            >
              <Moon className="w-3.5 h-3.5" strokeWidth={1.6} />
              <span>Nocturnal</span>
            </button>
          </div>
        </div>
      </section>

      {/* Split-Panel Hero: Left Radar / 3D Core | Right Profile + 0.88 HITL Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Panel (7 cols) */}
        <div className={`lg:col-span-7 rounded-[10px] border p-4 sm:p-5 flex flex-col justify-between ${surfaceCard}`}>
          {visualMode === 'radar' ? (
            <>
              <div className={`flex flex-wrap items-center justify-between gap-2 pb-3 border-b ${isDark ? 'border-[#232B4A]' : 'border-[#E4DFD6]'}`}>
                <div>
                  <h2 className="text-sm font-bold">
                    Interactive Operational Tech Radar (13 Modules)
                  </h2>
                  <p className={`text-[11px] ${mutedInk}`}>
                    Click any node to inspect architecture &amp; synergy links · Green = Active in Stack · Amber = Native Integration
                  </p>
                </div>
                <div className={`font-mono text-[10px] tabular-nums ${mutedInk}`}>
                  <span className={`font-bold ${greenInk}`}>{selectedIds.length} Active</span>
                  <span className="mx-1.5">·</span>
                  <span>{SPENTA_APPS.length - selectedIds.length} Available</span>
                </div>
              </div>

              {/* Quadrant Filter Strip */}
              <div className="flex flex-wrap items-center gap-1 pt-3">
                {(
                  [
                    'All',
                    'Healthcare & Bio',
                    'Banking & Fintech',
                    'Enterprise & Data',
                    'XR, Voice & Edge',
                  ] as const
                ).map((quad) => {
                  const active = quadrantFilter === quad;
                  return (
                    <button
                      key={quad}
                      type="button"
                      onClick={() => setQuadrantFilter(quad)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer border ${
                        active
                          ? isDark
                            ? 'bg-[#161D3A] border-[#8FA6E8] text-[#8FA6E8]'
                            : 'bg-[#EEF3FB] border-[#1F3863] text-[#1F3863]'
                          : isDark
                            ? 'bg-[#0F1529] border-[#232B4A] text-[#8D97B5] hover:text-[#E7EBF5]'
                            : 'bg-[#FAF8F4] border-[#E4DFD6] text-[#4A5163] hover:text-[#16213A]'
                      }`}
                    >
                      {quad === 'All' ? 'All Quadrants (13)' : quad}
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full max-w-[520px] mx-auto aspect-square my-2 flex items-center justify-center rounded-xl overflow-hidden">
                {activeBackdropAsset && (
                  <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
                    <img
                      src={activeBackdropAsset.src}
                      alt=""
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover object-center scale-105 transition-opacity duration-300 ${
                        isDark ? 'opacity-[0.22]' : 'opacity-[0.14]'
                      }`}
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: isDark
                          ? 'radial-gradient(circle at center, rgba(20,26,50,0.38) 0%, rgba(20,26,50,0.88) 76%, #141A32 100%)'
                          : 'radial-gradient(circle at center, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.88) 76%, #FFFFFF 100%)',
                      }}
                    />
                  </div>
                )}
                <svg
                  viewBox="0 0 520 520"
                  className="relative z-10 w-full h-full select-none"
                  role="img"
                  aria-label="Spenta Operational Tech Radar in Spenta Dhaka Editorial Palette"
                >
                  {/* Concentric Rings */}
                  {[220, 158, 96].map((r, i) => (
                    <circle
                      key={r}
                      cx="260"
                      cy="260"
                      r={r}
                      fill={
                        i === 2
                          ? isDark
                            ? 'rgba(143,166,232,0.08)'
                            : 'rgba(31,56,99,0.05)'
                          : 'none'
                      }
                      stroke={i === 2 ? rGridStrong : rGrid}
                      strokeWidth="1.1"
                      strokeDasharray={i === 0 ? '4 4' : undefined}
                    />
                  ))}

                  {/* Crosshair Axes */}
                  <line x1="260" y1="26" x2="260" y2="494" stroke={rGrid} strokeWidth="1" />
                  <line x1="26" y1="260" x2="494" y2="260" stroke={rGrid} strokeWidth="1" />

                  {/* Ring Labels */}
                  <text x="266" y="174" fill={rNavy} fontSize="9" fontWeight="800" fontFamily="JetBrains Mono, monospace">
                    CORE
                  </text>
                  <text x="266" y="112" fill={rMuted} fontSize="9" fontWeight="700" fontFamily="JetBrains Mono, monospace">
                    PRODUCTION
                  </text>
                  <text x="266" y="50" fill={rMuted} fontSize="9" fontWeight="600" fontFamily="JetBrains Mono, monospace">
                    PILOT
                  </text>

                  {/* Quadrant Headers */}
                  <text x="30" y="34" fill={quadrantFilter === 'Healthcare & Bio' ? rNavy : rMuted} fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
                    01. HEALTHCARE &amp; SECURITY
                  </text>
                  <text x="490" y="34" textAnchor="end" fill={quadrantFilter === 'Banking & Fintech' ? rNavy : rMuted} fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
                    02. BANKING &amp; FINTECH
                  </text>
                  <text x="30" y="498" fill={quadrantFilter === 'Enterprise & Data' ? rNavy : rMuted} fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
                    03. ENTERPRISE &amp; BI
                  </text>
                  <text x="490" y="498" textAnchor="end" fill={quadrantFilter === 'XR, Voice & Edge' ? rNavy : rMuted} fontSize="9.5" fontWeight="700" fontFamily="JetBrains Mono, monospace">
                    04. XR, VOICE &amp; EDGE
                  </text>

                  {/* Active Stack Spokes to Center Kernel */}
                  {RADAR_NODES.map((node) => {
                    const { cx, cy } = polarCoords(node.angleDeg, node.radius);
                    const isSelected = selectedIds.includes(node.appId);
                    const isFocused = inspectedApp.id === node.appId;
                    if (!isSelected && !isFocused) return null;
                    return (
                      <line
                        key={`spoke-${node.appId}`}
                        x1="260"
                        y1="260"
                        x2={cx}
                        y2={cy}
                        stroke={isFocused ? rNavy : rGreen}
                        strokeOpacity={isFocused ? 0.85 : 0.35}
                        strokeWidth={isFocused ? 1.8 : 1.1}
                      />
                    );
                  })}

                  {/* Native Synergy Connector Arcs from Focused Module */}
                  {focusedPos &&
                    RADAR_NODES.filter((n) => inspectedApp.integratesWith.includes(n.appId)).map(
                      (synNode) => {
                        const target = polarCoords(synNode.angleDeg, synNode.radius);
                        const midX = (focusedPos.cx + target.cx) / 2;
                        const midY = (focusedPos.cy + target.cy) / 2;
                        const ctrlX = midX + (260 - midX) * 0.28;
                        const ctrlY = midY + (260 - midY) * 0.28;
                        return (
                          <path
                            key={`syn-arc-${synNode.appId}`}
                            d={`M ${focusedPos.cx} ${focusedPos.cy} Q ${ctrlX} ${ctrlY} ${target.cx} ${target.cy}`}
                            fill="none"
                            stroke={rAmber}
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                            opacity="0.85"
                          />
                        );
                      },
                    )}

                  {/* Center Kernel */}
                  <circle
                    cx="260"
                    cy="260"
                    r="29"
                    fill={isDark ? '#141A32' : '#1F3863'}
                    stroke={passGate ? rGreen : rAmber}
                    strokeWidth="2"
                  />
                  <text
                    x="260"
                    y="257"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="8.5"
                    fontWeight="800"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    SPENTA
                  </text>
                  <text
                    x="260"
                    y="269"
                    textAnchor="middle"
                    fill={passGate ? '#6FCB9F' : '#E0B063'}
                    fontSize="7.5"
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    OPA {hitlConfidence.toFixed(2)}
                  </text>

                  {/* Clickable Radar Nodes */}
                  {RADAR_NODES.map((node) => {
                    const { cx, cy } = polarCoords(node.angleDeg, node.radius);
                    const isSelected = selectedIds.includes(node.appId);
                    const isFocused = inspectedApp.id === node.appId;
                    const isSynergy = inspectedApp.integratesWith.includes(node.appId);
                    const isDimmed =
                      quadrantFilter !== 'All' && node.quadrant !== quadrantFilter;

                    const hasEmissivePulse = !isDimmed && (isFocused || isSelected);
                    return (
                      <g
                        key={node.appId}
                        onClick={() => handleSelectRadarApp(node.appId)}
                        onMouseEnter={() => setHoveredRadarId(node.appId)}
                        onMouseLeave={() => setHoveredRadarId(null)}
                        opacity={isDimmed ? 0.25 : 1}
                        style={
                          hasEmissivePulse
                            ? ({
                                '--brain-emissive-dim': isSelected
                                  ? isDark
                                    ? 'rgba(111, 203, 159, 0.28)'
                                    : 'rgba(28, 110, 70, 0.22)'
                                  : isDark
                                    ? 'rgba(143, 166, 232, 0.28)'
                                    : 'rgba(31, 56, 99, 0.22)',
                                '--brain-emissive-glow': isSelected
                                  ? isDark
                                    ? 'rgba(111, 203, 159, 0.82)'
                                    : 'rgba(28, 110, 70, 0.68)'
                                  : isDark
                                    ? 'rgba(143, 166, 232, 0.82)'
                                    : 'rgba(31, 56, 99, 0.68)',
                              } as React.CSSProperties)
                            : undefined
                        }
                        className={`cursor-pointer ${hasEmissivePulse ? 'brain-svg-emissive-pulse' : ''}`}
                      >
                        {isFocused && (
                          <circle
                            cx={cx}
                            cy={cy}
                            r="21"
                            fill="none"
                            stroke={rNavy}
                            strokeWidth="1.6"
                            strokeDasharray="3 3"
                          />
                        )}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isFocused ? 15.5 : 13.5}
                          fill={
                            isSelected
                              ? rGreen
                              : isSynergy
                                ? rAmber
                                : rNodeIdle
                          }
                          stroke={
                            isFocused
                              ? rNavy
                              : isSelected
                                ? rGreen
                                : isSynergy
                                  ? rAmber
                                  : rGridStrong
                          }
                          strokeWidth={isFocused ? 2 : 1.4}
                        />
                        <text
                          x={cx}
                          y={cy + 3.2}
                          textAnchor="middle"
                          fill={
                            isSelected || isSynergy
                              ? isDark
                                ? '#0B1020'
                                : '#FFFFFF'
                              : rInk
                          }
                          fontSize="8.5"
                          fontWeight="800"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {node.code}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Compact Radar Module Strip */}
              <div className={`pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono ${isDark ? 'border-[#232B4A]' : 'border-[#E4DFD6]'} ${mutedInk}`}>
                <span>
                  Focused: <strong className={isDark ? 'text-[#E7EBF5]' : 'text-[#16213A]'}>{inspectedApp.shortName}</strong> · {inspectedApp.layers.join('/')}
                </span>
                <span>Proof: {inspectedApp.proofClient}</span>
              </div>
            </>
          ) : (
            <div
              className={`flex-1 min-h-[480px] sm:min-h-[560px] lg:min-h-[600px] rounded-[10px] overflow-hidden border ${
                isDark ? 'border-[#232B4A] bg-[#0B1020]' : 'border-[#E4DFD6] bg-[#F2EFE9]'
              }`}
            >
              <SovereignBrain3D
                polarity={brainPolarity}
                selectedHubId={selectedHubId}
                hubFocusNonce={hubFocusNonce}
                onSelectHub={handleSelect3DHub}
              />
            </div>
          )}
        </div>

        {/* Right Panel (5 cols): Bidirectional Architecture Profile + Live 0.88 HITL Gate Inspector */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Inspected Module & Active Hub Architecture Profile */}
          <div className={`rounded-[10px] border p-5 space-y-3 ${surfaceCard}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className={`text-[10px] font-mono font-semibold ${brandInk}`}>
                  HUB {activeHub.num} · {activeHub.label} · {inspectedApp.engine} engine
                </div>
                {activeBrainSelection.source === 'pathway' && activeBrainSelection.pathwayNodeTitle && (
                  <div className={`text-[11px] font-mono mt-0.5 ${greenInk}`}>
                    Synced from Pathway · {activeBrainSelection.pathwayNodeCode ? `${activeBrainSelection.pathwayNodeCode} — ` : ''}
                    {activeBrainSelection.pathwayNodeTitle}
                  </div>
                )}
                <h2 className="text-base font-bold mt-0.5 leading-snug">
                  {inspectedApp.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => toggleApp(inspectedApp.id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  inspectedInStack
                    ? isDark
                      ? 'bg-[#6FCB9F] text-[#0B1020]'
                      : 'bg-[#1C6E46] text-white'
                    : isDark
                      ? 'bg-[#8FA6E8] text-[#0B1020]'
                      : 'bg-[#1F3863] text-white hover:bg-[#12233F]'
                }`}
              >
                {inspectedInStack ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>In Stack</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Add</span>
                  </>
                )}
              </button>
            </div>

            <p className={`text-xs leading-relaxed ${bodyInk}`}>
              {inspectedApp.tagline}
            </p>

            {/* Hub Sibling Module Selector (Synced directly with 3D Hub Clicks) */}
            {hubSiblingApps.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className={`font-mono text-[10px] ${mutedInk}`}>Hub Modules:</span>
                {hubSiblingApps.map((sib) => {
                  const isCurrent = sib.id === inspectedApp.id;
                  return (
                    <button
                      key={sib.id}
                      type="button"
                      onClick={() => selectBrainNode(activeHub.id, sib.id, 'brain')}
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                        isCurrent ? 'brain-node-emissive-pulse' : ''
                      } ${
                        isCurrent
                          ? isDark
                            ? 'bg-[#161D3A] border-[#8FA6E8] text-[#8FA6E8]'
                            : 'bg-[#EEF3FB] border-[#1F3863] text-[#1F3863]'
                          : isDark
                            ? 'bg-[#0F1529] border-[#232B4A] text-[#C3CCE4]'
                            : 'bg-[#FAF8F4] border-[#E4DFD6] text-[#4A5163]'
                      }`}
                    >
                      {sib.shortName}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono tabular-nums">
              <div className={`rounded-lg border p-2.5 ${recessedBox}`}>
                <div className={`text-[10px] ${mutedInk}`}>
                  {inspectedApp.billingCadence === 'quarterly-retainer' ? 'Qtr. Retainer' : 'Build Scope'}
                </div>
                <div className="text-xs font-bold mt-0.5">
                  ${(inspectedApp.setupUsd / 1000).toFixed(1)}K
                  {inspectedApp.billingCadence === 'quarterly-retainer' ? '/qtr' : ''}
                </div>
              </div>
              <div className={`rounded-lg border p-2.5 ${recessedBox}`}>
                <div className={`text-[10px] ${mutedInk}`}>Conservative GM</div>
                <div className={`text-xs font-bold mt-0.5 ${greenInk}`}>
                  {inspectedApp.gmPct.toFixed(1)}%
                </div>
              </div>
              <div className={`rounded-lg border p-2.5 ${recessedBox}`}>
                <div className={`text-[10px] ${mutedInk}`}>Hardware Min</div>
                <div className="text-xs font-bold mt-0.5">
                  Tier {inspectedApp.minServerTier}
                </div>
              </div>
            </div>
          </div>

          {/* Live 0.88 Confidence HITL Gate Simulator */}
          <div className={`rounded-[10px] border p-5 flex-1 flex flex-col justify-between gap-4 ${surfaceCard}`}>
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className={`inline-flex items-center gap-2 text-[11px] font-mono font-bold ${brandInk}`}>
                  <Sliders className="w-3.5 h-3.5" strokeWidth={1.6} />
                  <span>0.88 HITL Gate Simulator</span>
                </div>
                <span className={`text-[10px] font-mono ${mutedInk}`}>OPA Policy-as-Code</span>
              </div>

              <div className={`mt-3 p-3.5 rounded-lg border ${recessedBox}`}>
                <div className="flex items-baseline justify-between">
                  <span className={`text-xs font-medium ${bodyInk}`}>
                    Simulated Confidence
                  </span>
                  <span
                    className={`font-mono text-2xl sm:text-3xl font-extrabold tabular-nums ${
                      passGate ? greenInk : amberInk
                    }`}
                  >
                    {hitlConfidence.toFixed(2)}
                  </span>
                </div>

                <div className="mt-2.5">
                  <input
                    type="range"
                    min={0.5}
                    max={0.99}
                    step={0.01}
                    value={hitlConfidence}
                    onChange={(e) => setHitlConfidence(Number(e.target.value))}
                    aria-label="Simulated inference confidence score"
                    className="w-full spenta-slider"
                  />
                  <div className={`flex justify-between text-[10px] font-mono mt-1.5 ${mutedInk}`}>
                    <span>0.50 Escalate</span>
                    <span className={`font-bold ${isDark ? 'text-[#E7EBF5]' : 'text-[#16213A]'}`}>
                      0.88 Gate
                    </span>
                    <span>0.99 Auto-Commit</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[
                    { label: '0.94 BankOCR', val: 0.94 },
                    { label: '0.88 Boundary', val: 0.88 },
                    { label: '0.81 Rx Smudge', val: 0.81 },
                    { label: '0.67 Ambiguous', val: 0.67 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setHitlConfidence(preset.val)}
                      className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors cursor-pointer ${
                        Math.abs(hitlConfidence - preset.val) < 0.005
                          ? isDark
                            ? 'bg-[#8FA6E8] text-[#0B1020] border-[#8FA6E8] font-bold'
                            : 'bg-[#1F3863] text-white border-[#1F3863] font-bold'
                          : isDark
                            ? 'bg-[#141A32] text-[#C3CCE4] border-[#232B4A] hover:border-[#8FA6E8]'
                            : 'bg-[#FFFFFF] text-[#4A5163] border-[#E4DFD6] hover:border-[#1F3863]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Decision Banner */}
              <div
                className={`mt-3 rounded-lg p-3.5 border ${
                  passGate
                    ? isDark
                      ? 'bg-[#0F2A22] border-[#6FCB9F]/40 text-[#E7EBF5]'
                      : 'bg-[#EBF6F0] border-[#1C6E46]/35 text-[#16213A]'
                    : isDark
                      ? 'bg-[#2A2112] border-[#E0B063]/45 text-[#E7EBF5]'
                      : 'bg-[#FDF5E6] border-[#8A5C10]/35 text-[#16213A]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {passGate ? (
                    <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${greenInk}`} strokeWidth={1.75} />
                  ) : (
                    <ShieldAlert className={`w-4 h-4 shrink-0 mt-0.5 ${amberInk}`} strokeWidth={1.75} />
                  )}
                  <div>
                    <div className={`font-mono text-[11px] font-bold ${passGate ? greenInk : amberInk}`}>
                      {passGate
                        ? 'PASS (>= 0.88) · Auto-Commit to Ledger'
                        : 'HOLD (< 0.88) · Route to Human Audit Queue'}
                    </div>
                    <p className={`text-[11px] mt-1 leading-relaxed ${bodyInk}`}>
                      {passGate
                        ? 'OPA verifies schema integrity and signs directly into PostgreSQL/Kafka core with immutable model hash.'
                        : 'Automated ledger write blocked. Opens in React Digital Twin verifier with highlighted low-confidence bounding boxes.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Policy Stream */}
              <div className="mt-3 space-y-1.5 max-h-[195px] overflow-y-auto pr-1">
                {simulatedEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className={`rounded-lg border px-3 py-2 text-xs ${recessedBox}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold truncate">{evt.clientPattern}</span>
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold tabular-nums shrink-0 ${
                          evt.autoApproved ? greenInk : amberInk
                        }`}
                      >
                        {evt.autoApproved ? (
                          <CheckCircle2 className="w-3 h-3" strokeWidth={1.75} />
                        ) : (
                          <AlertTriangle className="w-3 h-3" strokeWidth={1.75} />
                        )}
                        {evt.liveScore.toFixed(2)} · {evt.autoApproved ? 'COMMIT' : 'HITL'}
                      </span>
                    </div>
                    <div className={`text-[11px] mt-0.5 truncate ${bodyInk}`}>
                      {evt.documentType}
                    </div>
                    <div className={`text-[10px] font-mono mt-0.5 ${mutedInk}`}>
                      {evt.policyRule} · {evt.latencyMs}ms
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Abstract 3D Architectural Backdrop & UI Embellishment Studio Strip */}
      <section className={`rounded-[10px] border p-4 sm:p-5 space-y-3.5 ${surfaceCard}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className={`text-[10.5px] font-mono font-bold ${brandInk}`}>
              3D Editorial Backdrop Textures · Stone &amp; Nocturnal Navy Material Variants
            </div>
            <h2 className="text-sm sm:text-base font-bold mt-0.5">
              Abstract 3D Brain Embellishments &amp; Atmospheric Textures
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setBackdropVariant('auto')}
              aria-pressed={backdropVariant === 'auto'}
              className={`px-2.5 py-1 rounded-md font-mono text-[10.5px] font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                backdropVariant === 'auto'
                  ? isDark
                    ? 'bg-[#8FA6E8] text-[#0B1020] border-[#8FA6E8]'
                    : 'bg-[#1F3863] text-white border-[#1F3863]'
                  : isDark
                    ? 'bg-[#0F1529] border-[#232B4A] text-[#C3CCE4] hover:border-[#8FA6E8]'
                    : 'bg-[#FAF8F4] border-[#E4DFD6] text-[#4A5163] hover:border-[#1F3863]'
              }`}
            >
              Auto Sync ({isDark ? 'Nocturnal' : 'Stone'})
            </button>
            <button
              type="button"
              onClick={() => setBackdropVariant('none')}
              aria-pressed={backdropVariant === 'none'}
              className={`px-2.5 py-1 rounded-md font-mono text-[10.5px] font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                backdropVariant === 'none'
                  ? isDark
                    ? 'bg-[#8FA6E8] text-[#0B1020] border-[#8FA6E8]'
                    : 'bg-[#1F3863] text-white border-[#1F3863]'
                  : isDark
                    ? 'bg-[#0F1529] border-[#232B4A] text-[#C3CCE4] hover:border-[#8FA6E8]'
                    : 'bg-[#FAF8F4] border-[#E4DFD6] text-[#4A5163] hover:border-[#1F3863]'
              }`}
            >
              Flat Editorial
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {BRAIN_3D_ASSET_VARIANTS.map((variant) => {
            const isActiveVariant = activeBackdropAsset?.id === variant.id;
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => setBackdropVariant(variant.id)}
                aria-pressed={isActiveVariant}
                className={`group text-left rounded-[10px] border overflow-hidden transition-all cursor-pointer ${
                  isActiveVariant
                    ? isDark
                      ? 'bg-[#161D3A] border-[#8FA6E8] ring-1 ring-[#8FA6E8]/40'
                      : 'bg-[#EEF3FB] border-[#1F3863] ring-1 ring-[#1F3863]/25'
                    : isDark
                      ? 'bg-[#0F1529] border-[#232B4A] hover:border-[#8FA6E8]/70'
                      : 'bg-[#FAF8F4] border-[#E4DFD6] hover:border-[#1F3863]/70'
                }`}
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  <img
                    src={variant.src}
                    alt={variant.alt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[9.5px] font-bold border ${
                        variant.recommendedPolarity === 'dark'
                          ? 'bg-[#0B1020]/90 border-[#34416E] text-[#8FA6E8]'
                          : 'bg-[#FAF8F4]/92 border-[#CFC8BC] text-[#1F3863]'
                      }`}
                    >
                      {variant.themeBadge}
                    </span>
                  </div>
                  {isActiveVariant && (
                    <span
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded font-mono text-[9.5px] font-bold ${
                        isDark
                          ? 'bg-[#6FCB9F] text-[#0B1020]'
                          : 'bg-[#1C6E46] text-white'
                      }`}
                    >
                      Active Texture
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold tracking-tight">{variant.title}</span>
                    <span className={`font-mono text-[9.5px] ${mutedInk}`}>16:9 3D</span>
                  </div>
                  <p className={`text-[11px] leading-snug line-clamp-2 ${bodyInk}`}>
                    {variant.caption}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Live Google Search Grounded Intelligence Panel */}
      <section className={`rounded-[10px] border p-5 space-y-4 ${surfaceCard}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold ${brandInk}`}>
              <Globe className="w-3.5 h-3.5" strokeWidth={1.6} />
              <span>Live Web Market Intelligence · Google Search Grounding</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold mt-0.5">
              Verify Market Benchmarks, Hardware Pricing &amp; Compliance in Real Time
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setAiAssistantOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer self-start md:self-auto whitespace-nowrap ${
              isDark
                ? 'bg-[#8FA6E8] text-[#0B1020]'
                : 'bg-[#1F3863] text-white hover:bg-[#12233F]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.6} />
            <span>Open Multi-Turn AI Advisor</span>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runLiveGrounding();
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={groundQuery}
            onChange={(e) => setGroundQuery(e.target.value)}
            placeholder="Ask for up-to-date AI hardware pricing, regulatory updates, or healthcare ERP trends..."
            className={`flex-1 px-3.5 py-2 text-xs border rounded-lg focus:outline-none ${
              isDark
                ? 'bg-[#0B1020] border-[#232B4A] text-[#E7EBF5] placeholder:text-[#8D97B5] focus:border-[#8FA6E8]'
                : 'bg-[#FAF8F4] border-[#CFC8BC] text-[#16213A] placeholder:text-[#5F6576] focus:border-[#1F3863]'
            }`}
          />
          <button
            type="submit"
            disabled={groundLoading || !groundQuery.trim()}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 disabled:opacity-45 whitespace-nowrap ${
              isDark
                ? 'bg-[#6FCB9F] text-[#0B1020] hover:bg-[#82D7AE]'
                : 'bg-[#1C6E46] text-white hover:bg-[#165838]'
            }`}
          >
            {groundLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Globe className="w-3.5 h-3.5" strokeWidth={1.6} />
            )}
            <span>{groundLoading ? 'Searching Web…' : 'Run Grounded Brief'}</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5">
          {GROUNDING_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => runLiveGrounding(preset)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer text-left ${
                isDark
                  ? 'bg-[#0F1529] border-[#232B4A] text-[#C3CCE4] hover:border-[#8FA6E8]'
                  : 'bg-[#FAF8F4] border-[#E4DFD6] text-[#4A5163] hover:border-[#1F3863]'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {groundError && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-300">
            {groundError}
          </div>
        )}

        {groundResult && (
          <div className={`rounded-lg border p-4 space-y-3 ${recessedBox}`}>
            <div className={`flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono ${brandInk}`}>
              <span className="font-bold truncate">Query: {groundResult.query}</span>
              <span className={`shrink-0 ${mutedInk}`}>Google Search Grounded</span>
            </div>
            <div className={`text-xs leading-relaxed whitespace-pre-wrap ${bodyInk}`}>
              {groundResult.text}
            </div>
            {groundResult.sources.length > 0 && (
              <div className={`pt-2 border-t flex flex-wrap items-center gap-1.5 ${isDark ? 'border-[#232B4A]' : 'border-[#E4DFD6]'}`}>
                <span className={`text-[10px] font-mono font-bold mr-1 ${mutedInk}`}>
                  Sources:
                </span>
                {groundResult.sources.slice(0, 6).map((src) => (
                  <a
                    key={src.uri}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 text-[10px] font-mono border px-2 py-0.5 rounded ${
                      isDark
                        ? 'bg-[#141A32] border-[#232B4A] text-[#8FA6E8] hover:border-[#8FA6E8]'
                        : 'bg-[#FFFFFF] border-[#E4DFD6] text-[#1F3863] hover:border-[#1F3863]'
                    }`}
                  >
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    <span className="max-w-[200px] truncate">{src.title}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Consolidated Master Blueprint Explorer */}
      <section className={`rounded-[10px] border p-5 ${surfaceCard}`}>
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b ${isDark ? 'border-[#232B4A]' : 'border-[#E4DFD6]'}`}>
          <div>
            <div className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold ${brandInk}`}>
              <Brain className="w-3.5 h-3.5" strokeWidth={1.6} />
              <span>Consolidated Master Blueprint Explorer</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold mt-0.5">
              6 Capability Pillars &amp; 8-Vertical Agentic Core (Think · Learn · Solve)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${mutedInk}`} strokeWidth={1.5} />
              <input
                type="text"
                value={blueprintQuery}
                onChange={(e) => setBlueprintQuery(e.target.value)}
                placeholder="Query capabilities, SLAs, verticals..."
                className={`w-full pl-8 pr-8 py-1.5 text-xs border rounded-lg focus:outline-none ${
                  isDark
                    ? 'bg-[#0B1020] border-[#232B4A] text-[#E7EBF5] placeholder:text-[#8D97B5] focus:border-[#8FA6E8]'
                    : 'bg-[#FAF8F4] border-[#CFC8BC] text-[#16213A] placeholder:text-[#5F6576] focus:border-[#1F3863]'
                }`}
              />
              {blueprintQuery && (
                <button
                  type="button"
                  onClick={() => setBlueprintQuery('')}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer ${mutedInk}`}
                  aria-label="Clear blueprint search"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              )}
            </div>

            <div className={`inline-flex rounded-lg p-1 border ${recessedBox}`}>
              <button
                type="button"
                onClick={() => setBlueprintTab('pillars')}
                className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  blueprintTab === 'pillars'
                    ? isDark
                      ? 'bg-[#8FA6E8] text-[#0B1020]'
                      : 'bg-[#1F3863] text-white'
                    : mutedInk
                }`}
              >
                6 Capability Pillars
              </button>
              <button
                type="button"
                onClick={() => setBlueprintTab('verticals')}
                className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  blueprintTab === 'verticals'
                    ? isDark
                      ? 'bg-[#8FA6E8] text-[#0B1020]'
                      : 'bg-[#1F3863] text-white'
                    : mutedInk
                }`}
              >
                8 Agentic Verticals
              </button>
            </div>
          </div>
        </div>

        {blueprintTab === 'pillars' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
            {filteredPillars.map((pillar) => (
              <article
                key={pillar.id}
                className={`rounded-[10px] border p-4 flex flex-col justify-between ${recessedBox}`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className={`font-bold ${brandInk}`}>{pillar.code}</span>
                    <span className={mutedInk}>{pillar.engine} engine</span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base mt-1">
                    {pillar.title}
                  </h3>
                  <p className={`text-xs leading-relaxed mt-1.5 ${bodyInk}`}>
                    {pillar.summary}
                  </p>
                  <div className={`mt-3 text-[11px] font-mono ${greenInk}`}>
                    {pillar.metrics.join(' · ')}
                  </div>
                </div>

                <div className={`mt-4 pt-3 border-t flex flex-wrap gap-1.5 ${isDark ? 'border-[#232B4A]' : 'border-[#E4DFD6]'}`}>
                  {pillar.apps.map((appId) => {
                    const app = appMap[appId];
                    if (!app) return null;
                    const active = selectedIds.includes(appId);
                    return (
                      <button
                        key={appId}
                        type="button"
                        onClick={() => toggleApp(appId)}
                        className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors cursor-pointer ${
                          active
                            ? isDark
                              ? 'bg-[#0F2A22] text-[#6FCB9F] border-[#6FCB9F]/50 font-bold'
                              : 'bg-[#EBF6F0] text-[#1C6E46] border-[#1C6E46]/50 font-bold'
                            : isDark
                              ? 'bg-[#141A32] text-[#E7EBF5] border-[#232B4A] hover:border-[#8FA6E8]'
                              : 'bg-[#FFFFFF] text-[#16213A] border-[#E4DFD6] hover:border-[#1F3863]'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {app.shortName}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            {filteredVerticals.map((v) => (
              <article
                key={v.id}
                className={`rounded-[10px] border p-4 space-y-2.5 ${recessedBox}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-sm">{v.name}</h3>
                  <span className={`text-[10px] font-mono ${greenInk}`}>
                    {v.proof}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className={`rounded-lg p-2.5 border ${surfaceCard}`}>
                    <div className={`text-[10px] font-mono font-bold ${brandInk}`}>
                      1. Think
                    </div>
                    <p className={`mt-1 leading-snug ${bodyInk}`}>{v.think}</p>
                  </div>
                  <div className={`rounded-lg p-2.5 border ${surfaceCard}`}>
                    <div className={`text-[10px] font-mono font-bold ${greenInk}`}>
                      2. Learn
                    </div>
                    <p className={`mt-1 leading-snug ${bodyInk}`}>{v.learn}</p>
                  </div>
                  <div className={`rounded-lg p-2.5 border ${surfaceCard}`}>
                    <div className="text-[10px] font-mono font-bold">
                      3. Solve
                    </div>
                    <p className={`mt-1 leading-snug ${bodyInk}`}>{v.solve}</p>
                  </div>
                </div>
                <div
                  className={`text-[11px] font-mono rounded-lg px-2.5 py-1.5 border ${
                    isDark
                      ? 'bg-[#2A2112] border-[#E0B063]/35 text-[#E0B063]'
                      : 'bg-[#FDF5E6] border-[#8A5C10]/30 text-[#8A5C10]'
                  }`}
                >
                  HITL Trigger: {v.hitlTrigger}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
