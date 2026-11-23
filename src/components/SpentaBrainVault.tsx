import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Box,
  Check,
  Copy,
  Cpu,
  Database,
  Download,
  Grid2x2,
  Grid3x3,
  Landmark,
  Layers,
  Mic,
  Network,
  Plus,
  Search,
  Share2,
  Shield,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import {
  APP_CATEGORIES,
  BRAIN_HUBS,
  DeploymentMode,
  EngineType,
  SERVER_TIERS,
  SOVEREIGN_STACK_LAYERS,
  SPENTA_APPS,
  SpentaApp,
  STARTER_RECIPES,
} from '../data/spentaManifest';
import { useStack } from '../store/StackContext';
import { usePathwayBrainSync } from '../hooks/usePathwayBrainSync';
import { copyTextWithFallback } from '../utils/shareUrlCodec';
import { SovereignBrain3D } from './three/SovereignBrain3D';

type VaultViewMode = 'matrix' | 'grid' | 'brain3d';

const GOVERNANCE_MARQUEE_ITEMS = [
  'ZERO CLOUD PII EXFILTRATION',
  '0.88 CONFIDENCE HITL GATE',
  '<50MS QUANTIZED EDGE INFERENCE',
  'AMD SEV-SNP & INTEL TDX TEE ENCLAVES',
  '13 COMPOSABLE SOVEREIGN MODULES',
  'DUAL-SHORE: SAN JOSE · AUSTRALIA · DHAKA ($12.98/HR LOADED)',
  'HIPAA · SOC 2 · ISO 27001 · BB ICT V4.0',
  'SELF-HOSTED LLAMA 3.2 VISION · LAYOUTLMV3 · WHISPER',
];

function HubIcon({ hubId }: { hubId: string }) {
  const cls = 'w-4 h-4 shrink-0';
  switch (hubId) {
    case 'healthcare':
      return <Stethoscope className={cls} strokeWidth={1.5} />;
    case 'fintech':
      return <Landmark className={cls} strokeWidth={1.5} />;
    case 'enterprise':
      return <Database className={cls} strokeWidth={1.5} />;
    case 'infra':
      return <Shield className={cls} strokeWidth={1.5} />;
    case 'xr':
      return <Box className={cls} strokeWidth={1.5} />;
    case 'voice':
      return <Mic className={cls} strokeWidth={1.5} />;
    case 'retail':
      return <ShoppingBag className={cls} strokeWidth={1.5} />;
    case 'energy':
      return <Activity className={cls} strokeWidth={1.5} />;
    default:
      return <Workflow className={cls} strokeWidth={1.5} />;
  }
}

function EvidenceLabel({ app }: { app: SpentaApp }) {
  const isProd =
    app.proofClient.includes('Bank') ||
    app.proofClient.includes('Samsung') ||
    app.proofClient.includes('BEST') ||
    app.proofClient.includes('Jotax') ||
    app.proofClient.includes('ISHO') ||
    app.proofClient.includes('X Ltd') ||
    app.proofClient.includes('bKash');
  return (
    <span className="text-[10px] font-mono uppercase tracking-wider text-[#5F6576] dark:text-[#8E96B0]">
      {isProd ? 'Verified Production' : 'Validated Deployment'}
    </span>
  );
}

const VAULT_VIEW_MODE_STORAGE_KEY = 'spenta_vault_view_mode_v1';

function loadStoredVaultViewMode(): VaultViewMode {
  try {
    const raw = window.localStorage.getItem(VAULT_VIEW_MODE_STORAGE_KEY);
    if (raw === 'matrix' || raw === 'grid' || raw === 'brain3d') {
      return raw;
    }
  } catch {
    // ignore storage errors
  }
  return 'matrix';
}

export function SpentaBrainVault() {
  const {
    theme,
    selectedIds,
    selectedApps,
    appMap,
    toggleApp,
    applyRecipe,
    clearStack,
    autoNotice,
    setAutoNotice,
    stackMetrics,
    setDrawerOpen,
    buildShareUrl,
    exportStackJson,
    buildExecutiveBrief,
    pendingNavFocus,
    clearPendingNavFocus,
    mobileGridVisible,
    toggleMobileGrid,
  } = useStack();

  const [viewMode, setViewMode] = useState<VaultViewMode>(loadStoredVaultViewMode);

  useEffect(() => {
    try {
      window.localStorage.setItem(VAULT_VIEW_MODE_STORAGE_KEY, viewMode);
    } catch {
      // ignore storage errors
    }
  }, [viewMode]);
  const [searchQuery, setSearchQuery] = useState('');
  const [engineFilter, setEngineFilter] = useState<'all' | EngineType>('all');
  const [deployFilter, setDeployFilter] = useState<'all' | DeploymentMode>('all');
  const [hoveredAppId, setHoveredAppId] = useState<string | null>(null);
  const [matrixShareCopied, setMatrixShareCopied] = useState(false);
  const [matrixBriefCopied, setMatrixBriefCopied] = useState(false);
  const { activeBrainSelection, selectBrainNode } = usePathwayBrainSync();

  const handleMatrixShare = async () => {
    const ok = await copyTextWithFallback(buildShareUrl({ tab: 'App Vault' }));
    if (ok) {
      setMatrixShareCopied(true);
      window.setTimeout(() => setMatrixShareCopied(false), 2000);
    }
  };

  const handleMatrixCopyBrief = async () => {
    const ok = await copyTextWithFallback(buildExecutiveBrief());
    if (ok) {
      setMatrixBriefCopied(true);
      window.setTimeout(() => setMatrixBriefCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (pendingNavFocus?.type === 'app') {
      const target = appMap[pendingNavFocus.id];
      if (target) {
        setViewMode('grid');
        setEngineFilter('all');
        setDeployFilter('all');
        setSearchQuery(target.shortName);
      }
      clearPendingNavFocus();
    }
  }, [pendingNavFocus, appMap, clearPendingNavFocus]);

  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SPENTA_APPS.filter((app) => {
      if (engineFilter !== 'all' && app.engine !== engineFilter) return false;
      if (deployFilter !== 'all' && !app.deployment.includes(deployFilter)) return false;
      if (!q) return true;
      return (
        app.name.toLowerCase().includes(q) ||
        app.shortName.toLowerCase().includes(q) ||
        app.tagline.toLowerCase().includes(q) ||
        app.proofClient.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, engineFilter, deployFilter]);

  const filteredIdSet = useMemo(() => new Set(filteredApps.map((a) => a.id)), [filteredApps]);

  const groupedByCategory = useMemo(() => {
    return APP_CATEGORIES.map((category) => ({
      category,
      apps: filteredApps.filter((a) => a.category === category),
    })).filter((g) => g.apps.length > 0);
  }, [filteredApps]);

  const leftHubs = useMemo(() => BRAIN_HUBS.filter((h) => h.side === 'left'), []);
  const rightHubs = useMemo(() => BRAIN_HUBS.filter((h) => h.side === 'right'), []);

  const hoveredApp = hoveredAppId ? appMap[hoveredAppId] : null;
  const activeLayersDisplay = hoveredApp
    ? new Set<string>(hoveredApp.layers)
    : stackMetrics.activeLayers;

  const tierSpec = SERVER_TIERS[stackMetrics.tier];

  return (
    <div className="space-y-5">
      {/* Compact Swiss Architectural Workspace Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] bg-obsidian-grid">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono uppercase tracking-[0.14em] text-[#1C6E46] dark:text-[#6FCB9F]">
                <span>SPENTA COMPOSABLE APP VAULT</span>
                <span className="text-[#D4CEC2] dark:text-[#2F3A60]">·</span>
                <span className="text-[#5F6576] dark:text-[#8E96B0]">13 SOVEREIGN MODULES</span>
                <span className="text-[#D4CEC2] dark:text-[#2F3A60]">·</span>
                <span className="text-[#5F6576] dark:text-[#8E96B0]">L1–L6 CORE KERNEL</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16213A] dark:text-[#E7EBF5] tracking-tight mt-1.5 leading-tight">
                Compose Verified Sovereign AI, ERP, Fintech &amp; Spatial XR Stacks
              </h1>
              <p className="text-xs sm:text-sm text-[#4A5568] dark:text-[#A4ADC6] mt-2 max-w-2xl leading-relaxed">
                Select modules across Operations and Experience hemispheres to verify native integrations, illuminate active L1–L6 layers, and size your air-gapped server baseline in real time.
              </p>
            </div>

            {/* 3-Way View Mode Switcher */}
            <div className="inline-flex flex-wrap rounded-xl bg-[#F2EFE9] dark:bg-[#0F1529] p-1 border border-[#E4DFD6] dark:border-[#232B4A] self-start xl:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'matrix'
                    ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                    : 'text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                }`}
              >
                <Network className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Architecture Matrix</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                    : 'text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                }`}
              >
                <Grid2x2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Catalog Grid (13)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('brain3d')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'brain3d'
                    ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                    : 'text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                }`}
              >
                <Box className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>3D Neural Core</span>
              </button>
            </div>
          </div>

          {/* Filter Bar & 1-Click Starter Recipes */}
          <div className="mt-5 pt-4 border-t border-[#E4DFD6] dark:border-[#232B4A] flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px] sm:flex-initial sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#5F6576] dark:text-[#8E96B0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter apps, proofs, specs..."
                  className="w-full min-h-[38px] sm:min-h-[34px] pl-8 pr-8 py-1.5 text-xs bg-[#FAF8F4] dark:bg-[#0B1020] border border-[#E4DFD6] dark:border-[#232B4A] rounded-lg text-[#16213A] dark:text-[#E7EBF5] placeholder:text-[#7D8599] dark:placeholder:text-[#707B9C] focus:outline-none focus:border-[#1F3863] dark:focus:border-[#8FA6E8]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5F6576] hover:text-[#16213A] dark:hover:text-[#E7EBF5] cursor-pointer"
                    aria-label="Clear filter"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                )}
              </div>

              <div className="inline-flex flex-wrap rounded-lg bg-[#F2EFE9] dark:bg-[#0B1020] p-0.5 border border-[#E4DFD6] dark:border-[#232B4A]">
                {(['all', 'operations', 'experience', 'fusion'] as const).map((eng) => (
                  <button
                    key={eng}
                    type="button"
                    onClick={() => setEngineFilter(eng)}
                    className={`px-2.5 py-1.5 sm:py-1 rounded-md text-[11px] font-semibold capitalize transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      engineFilter === eng
                        ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                        : 'text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                    }`}
                  >
                    {eng === 'all' ? 'All Engines' : eng}
                  </button>
                ))}
              </div>

              <div className="inline-flex flex-wrap rounded-lg bg-[#F2EFE9] dark:bg-[#0B1020] p-0.5 border border-[#E4DFD6] dark:border-[#232B4A]">
                {(['all', 'On-Prem', 'Private VPC', 'SaaS'] as const).map((dep) => (
                  <button
                    key={dep}
                    type="button"
                    onClick={() => setDeployFilter(dep)}
                    className={`px-2.5 py-1.5 sm:py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      deployFilter === dep
                        ? 'bg-[#1C6E46] text-white dark:bg-[#6FCB9F] dark:text-[#0B1020]'
                        : 'text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                    }`}
                  >
                    {dep === 'all' ? 'Any Deploy' : dep}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#5F6576] dark:text-[#8E96B0] mr-1">
                <Sparkles className="w-3 h-3 text-[#1C6E46] dark:text-[#6FCB9F]" strokeWidth={1.5} />
                Recipes:
              </span>
              {STARTER_RECIPES.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => applyRecipe(recipe.id)}
                  className="text-[11px] px-2.5 py-1.5 sm:py-1 rounded-lg border border-[#1C6E46]/25 dark:border-[#6FCB9F]/30 bg-[#1C6E46]/8 dark:bg-[#6FCB9F]/10 hover:bg-[#1C6E46]/15 dark:hover:bg-[#6FCB9F]/20 text-[#1C6E46] dark:text-[#6FCB9F] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  title={recipe.description}
                >
                  {recipe.name}
                </button>
              ))}
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={clearStack}
                  className="text-[11px] px-2 py-1 text-[#5F6576] dark:text-[#8E96B0] hover:text-[#E11D48] font-medium whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Governance & Engineering Marquee Ticker */}
        <div className="border-t border-[#E4DFD6] dark:border-[#232B4A] bg-[#F2EFE9]/90 dark:bg-[#0F1529]/90 overflow-hidden py-2">
          <div className="animate-spenta-marquee flex items-center gap-8 text-[10px] font-mono tracking-[0.14em] text-[#5F6576] dark:text-[#8E96B0]">
            {[...GOVERNANCE_MARQUEE_ITEMS, ...GOVERNANCE_MARQUEE_ITEMS].map((item, idx) => (
              <span key={`${item}-${idx}`} className="inline-flex items-center gap-3 shrink-0">
                <span className="w-1 h-1 rounded-full bg-[#1C6E46] dark:bg-[#6FCB9F]" />
                <span>{item}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Auto-Dependency Toast Banner */}
      {autoNotice && (
        <div className="px-4 py-2.5 rounded-xl bg-[#1F3863] dark:bg-[#141A32] text-[#E7EBF5] border border-[#6FCB9F]/40 text-xs font-mono flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[#6FCB9F] shrink-0" strokeWidth={1.5} />
            <span>{autoNotice}</span>
          </span>
          <button
            type="button"
            onClick={() => setAutoNotice(null)}
            className="text-[#6FCB9F] hover:text-white cursor-pointer"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Live Compact Stack Summary Strip */}
      <div className="rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 font-mono text-[#4A5568] dark:text-[#A4ADC6] tabular-nums">
          <span>
            <strong className="text-[#1C6E46] dark:text-[#6FCB9F]">{selectedApps.length}</strong> / 13 Modules
          </span>
          <span className="text-[#D4CEC2] dark:text-[#2F3A60]">·</span>
          <span>
            One-Time Build:{' '}
            <strong className="text-[#16213A] dark:text-[#E7EBF5]">
              ${(stackMetrics.oneTimeBuildUsd / 1000).toFixed(1)}K
            </strong>
            {stackMetrics.quarterlyRetainerUsd > 0 && (
              <span className="text-[#5F6576] dark:text-[#8E96B0]">
                {' '}
                + ${(stackMetrics.quarterlyRetainerUsd / 1000).toFixed(1)}K/qtr
              </span>
            )}
          </span>
          <span className="text-[#D4CEC2] dark:text-[#2F3A60]">·</span>
          <span>
            Blended GM: <strong className="text-[#1C6E46] dark:text-[#6FCB9F]">{stackMetrics.blendedGmPct.toFixed(1)}%</strong>
          </span>
          <span className="text-[#D4CEC2] dark:text-[#2F3A60]">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" strokeWidth={1.5} />
            <strong className="text-[#16213A] dark:text-[#E7EBF5]">{tierSpec.code}</strong>
            <span className="text-[#5F6576] dark:text-[#8E96B0]">({tierSpec.capex})</span>
          </span>
          <span className="text-[#D4CEC2] dark:text-[#2F3A60]">·</span>
          <span>
            <strong className="text-[#16213A] dark:text-[#E7EBF5]">{stackMetrics.synergyPairs.length}</strong> Verified Synergies
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#E11D48] hover:text-[#BE123C] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Inspect &amp; Export Stack</span>
          <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>
      </div>

      {/* VIEW 1: STRICTLY ORTHOGONAL RESPONSIVE BENTO ARCHITECTURE MATRIX */}
      {viewMode === 'matrix' && (
        <section className="rounded-2xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] bg-obsidian-grid p-4 sm:p-5 space-y-4">
          <div className="space-y-3 pb-3 border-b border-[#E4DFD6] dark:border-[#232B4A]">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-[#16213A] dark:text-[#E7EBF5]">
                  Spenta Sovereign AI Brain — Orthogonal Architecture Matrix
                </h2>
                <p className="text-xs text-[#5F6576] dark:text-[#8E96B0] mt-0.5">
                  Left: Operations Engine (Hubs 01–04) · Center: Live L1–L6 Core Processor · Right: Experience &amp; IR4 Engine (Hubs 05–08)
                </p>
              </div>

              {/* Top-Right Quick-Action Toolbar: Mobile Grid Toggle, Share, Export, Copy */}
              <div
                role="toolbar"
                aria-label="Architecture Matrix Quick Actions"
                className="flex flex-wrap items-center gap-1.5 self-start md:self-auto shrink-0"
              >
                <button
                  type="button"
                  onClick={toggleMobileGrid}
                  aria-pressed={mobileGridVisible}
                  className={`md:hidden inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    mobileGridVisible
                      ? 'border-[#1C6E46]/50 dark:border-[#6FCB9F]/50 bg-[#1C6E46]/10 dark:bg-[#6FCB9F]/15 text-[#1C6E46] dark:text-[#6FCB9F]'
                      : 'border-[#E4DFD6] dark:border-[#232B4A] bg-white/95 dark:bg-[#0F1529]/95 text-[#5F6576] dark:text-[#8E96B0]'
                  }`}
                  title={
                    mobileGridVisible
                      ? 'Hide 24×24 architectural grid on mobile'
                      : 'Show 24×24 architectural grid on mobile'
                  }
                >
                  <Grid3x3 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>{mobileGridVisible ? 'Grid On' : 'Grid Off'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleMatrixShare}
                  className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-white/95 dark:bg-[#0F1529]/95 hover:border-[#1F3863] dark:hover:border-[#8FA6E8] text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  title="Copy shareable link for this App Vault architecture"
                >
                  {matrixShareCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" strokeWidth={2} />
                      <span className="text-[#1C6E46] dark:text-[#6FCB9F]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-[#1F3863] dark:text-[#8FA6E8]" strokeWidth={1.75} />
                      <span>Share</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => exportStackJson()}
                  disabled={selectedApps.length === 0}
                  className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-white/95 dark:bg-[#0F1529]/95 hover:border-[#1C6E46] dark:hover:border-[#6FCB9F] disabled:opacity-45 disabled:cursor-not-allowed text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  title="Download composed stack configuration as JSON"
                >
                  <Download className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" strokeWidth={1.75} />
                  <span>Export</span>
                </button>

                <button
                  type="button"
                  onClick={handleMatrixCopyBrief}
                  disabled={selectedApps.length === 0}
                  className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-lg border border-[#1F3863]/20 dark:border-[#8FA6E8]/30 bg-[#1F3863] hover:bg-[#162848] dark:bg-[#8FA6E8] dark:hover:bg-[#A6B9F0] disabled:opacity-45 disabled:cursor-not-allowed text-xs font-semibold text-white dark:text-[#0B1020] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  title="Copy executive stack brief to clipboard"
                >
                  {matrixBriefCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" strokeWidth={2.25} />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono uppercase tracking-wider text-[#5F6576] dark:text-[#8E96B0]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1C6E46] dark:bg-[#6FCB9F]" /> In Stack
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Native Synergy
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#B9B2A5] dark:bg-[#3A456B]" /> Available
              </span>
            </div>
          </div>

          {/* Responsive 3-Column Bento Architecture Matrix (Zero Horizontal Clipping) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* LEFT HEMISPHERE: OPERATIONS ENGINE (HUBS 01-04) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between px-1 text-[10px] font-mono uppercase tracking-[0.14em] text-[#5F6576] dark:text-[#8E96B0]">
                <span>Operations Engine</span>
                <span>Hubs 01–04</span>
              </div>
              {leftHubs.map((hub) => {
                const hubApps = SPENTA_APPS.filter((a) => a.hubId === hub.id);
                const selectedInHub = hubApps.filter((a) => selectedIds.includes(a.id)).length;
                return (
                  <div
                    key={hub.id}
                    className={`rounded-xl border p-3 transition-colors ${
                      selectedInHub > 0
                        ? 'border-[#1C6E46]/35 dark:border-[#6FCB9F]/35 bg-[#1C6E46]/[0.04] dark:bg-[#6FCB9F]/[0.05]'
                        : 'border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[#5F6576] dark:text-[#8E96B0]">
                          <HubIcon hubId={hub.id} />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono text-[#5F6576] dark:text-[#8E96B0]">
                            HUB {hub.num} · {hub.keyLayers.join('/')}
                          </div>
                          <h3 className="text-xs font-bold text-[#16213A] dark:text-[#E7EBF5] truncate">
                            {hub.label}
                          </h3>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] tabular-nums text-[#1C6E46] dark:text-[#6FCB9F] shrink-0">
                        {selectedInHub}/{hubApps.length}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {hubApps.map((app) => {
                        const isSelected = selectedIds.includes(app.id);
                        const isSynergy = Boolean(
                          hoveredApp && hoveredApp.id !== app.id && hoveredApp.integratesWith.includes(app.id),
                        );
                        const isDimmed = !filteredIdSet.has(app.id);
                        return (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => toggleApp(app.id)}
                            onMouseEnter={() => setHoveredAppId(app.id)}
                            onMouseLeave={() => setHoveredAppId(null)}
                            className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                              isDimmed ? 'opacity-35' : 'opacity-100'
                            } ${
                              isSelected
                                ? 'bg-[#1F3863] text-white border-[#1F3863] dark:bg-[#1B2547] dark:border-[#6FCB9F]/60'
                                : isSynergy
                                  ? 'bg-amber-500/10 border-amber-500/60 text-[#16213A] dark:text-[#E7EBF5]'
                                  : 'bg-white dark:bg-[#141A32] border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1F3863]/40 dark:hover:border-[#8FA6E8]/50 text-[#16213A] dark:text-[#E7EBF5]'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-semibold truncate">{app.shortName}</div>
                              <div
                                className={`text-[10px] font-mono tabular-nums mt-0.5 ${
                                  isSelected
                                    ? 'text-[#A7E6C6]'
                                    : 'text-[#5F6576] dark:text-[#8E96B0]'
                                }`}
                              >
                                ${(app.setupUsd / 1000).toFixed(1)}K · {app.gmPct.toFixed(1)}% GM · T{app.minServerTier}
                              </div>
                            </div>
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-[#6FCB9F] text-[#0B1020]'
                                  : 'bg-[#F2EFE9] dark:bg-[#1D2545] text-[#5F6576] dark:text-[#8E96B0]'
                              }`}
                            >
                              {isSelected ? (
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              ) : (
                                <Plus className="w-3 h-3" strokeWidth={1.75} />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CENTER COLUMN: SPENTA CORE L1-L6 LIVE PROCESSOR */}
            <div className="lg:col-span-4 flex flex-col">
              <div className="flex items-center justify-between px-1 mb-3 text-[10px] font-mono uppercase tracking-[0.14em] text-[#1C6E46] dark:text-[#6FCB9F]">
                <span>Sovereign Core Bus</span>
                <span>L1–L6 Live</span>
              </div>

              <div className="flex-1 rounded-xl border border-[#232B4A] bg-[#0F1529] dark:bg-[#0B1020] text-[#E7EBF5] p-4 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#232B4A]">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#6FCB9F]">
                        SPENTA CORE KERNEL
                      </div>
                      <div className="text-base font-extrabold text-white mt-0.5">
                        {hoveredApp ? hoveredApp.shortName : 'Active Composed Stack'}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#6FCB9F]/15 border border-[#6FCB9F]/35 text-[10px] font-mono text-[#6FCB9F]">
                      <Layers className="w-3 h-3" strokeWidth={1.5} />
                      {activeLayersDisplay.size}/6 Layers
                    </span>
                  </div>

                  {/* L6 -> L1 Live Illuminated Layer Stack */}
                  <div className="mt-3 space-y-2">
                    {SOVEREIGN_STACK_LAYERS.map((layer) => {
                      const isActive = activeLayersDisplay.has(layer.id);
                      const countOnLayer = selectedApps.filter((a) => a.layers.includes(layer.id)).length;
                      return (
                        <div
                          key={layer.id}
                          className={`rounded-lg border px-3 py-2 transition-all ${
                            isActive
                              ? 'bg-[#6FCB9F]/12 border-[#6FCB9F]/45 text-white'
                              : 'bg-[#141A32] border-[#232B4A] text-[#7F89A8]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isActive
                                    ? 'bg-[#6FCB9F] text-[#0B1020]'
                                    : 'bg-[#1D2545] text-[#8E96B0]'
                                }`}
                              >
                                {layer.id}
                              </span>
                              <span className="text-xs font-semibold truncate">{layer.title}</span>
                            </div>
                            <span className="font-mono text-[10px] tabular-nums shrink-0 text-[#8E96B0]">
                              {countOnLayer > 0 ? `${countOnLayer} mod` : 'idle'}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-[#8E96B0] mt-1 truncate">
                            {layer.subtitle}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Kernel Telemetry & Inspected Module Readout */}
                <div className="rounded-lg bg-[#141A32] border border-[#232B4A] p-3 space-y-2">
                  {hoveredApp ? (
                    <>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#6FCB9F]">
                        Inspecting Module · {hoveredApp.engine} engine
                      </div>
                      <p className="text-xs text-[#D8DFEE] leading-relaxed">{hoveredApp.tagline}</p>
                      <div className="text-[10px] font-mono text-[#8E96B0]">
                        Proof: {hoveredApp.proofClient} · Deploy: {hoveredApp.deployment.join(' / ')}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#6FCB9F]">
                        <span>OPA 0.88 HITL GATE ACTIVE</span>
                        <span>ZERO CLOUD EGRESS</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 font-mono tabular-nums">
                        <div className="rounded bg-[#0B1020] border border-[#232B4A] p-2">
                          <div className="text-[10px] text-[#8E96B0]">Target Server</div>
                          <div className="text-xs font-bold text-white mt-0.5">{tierSpec.code}</div>
                          <div className="text-[10px] text-[#6FCB9F]">{tierSpec.capex}</div>
                        </div>
                        <div className="rounded bg-[#0B1020] border border-[#232B4A] p-2">
                          <div className="text-[10px] text-[#8E96B0]">Build + Retainers</div>
                          <div className="text-xs font-bold text-white mt-0.5">
                            ${(stackMetrics.oneTimeBuildUsd / 1000).toFixed(1)}K
                            {stackMetrics.quarterlyRetainerUsd > 0
                              ? ` + $${(stackMetrics.quarterlyRetainerUsd / 1000).toFixed(1)}K/qtr`
                              : ''}
                          </div>
                          <div className="text-[10px] text-[#6FCB9F]">
                            {stackMetrics.blendedGmPct.toFixed(1)}% Rev-Wtd GM
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#8E96B0] leading-snug pt-0.5">
                        Hover any module to trace its L1–L6 bindings and native integrations; click to toggle in your stack.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT HEMISPHERE: EXPERIENCE & IR4 ENGINE (HUBS 05-08) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between px-1 text-[10px] font-mono uppercase tracking-[0.14em] text-[#5F6576] dark:text-[#8E96B0]">
                <span>Experience &amp; IR4 Engine</span>
                <span>Hubs 05–08</span>
              </div>
              {rightHubs.map((hub) => {
                const hubApps = SPENTA_APPS.filter((a) => a.hubId === hub.id);
                const selectedInHub = hubApps.filter((a) => selectedIds.includes(a.id)).length;
                return (
                  <div
                    key={hub.id}
                    className={`rounded-xl border p-3 transition-colors ${
                      selectedInHub > 0
                        ? 'border-[#1C6E46]/35 dark:border-[#6FCB9F]/35 bg-[#1C6E46]/[0.04] dark:bg-[#6FCB9F]/[0.05]'
                        : 'border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[#5F6576] dark:text-[#8E96B0]">
                          <HubIcon hubId={hub.id} />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono text-[#5F6576] dark:text-[#8E96B0]">
                            HUB {hub.num} · {hub.keyLayers.join('/')}
                          </div>
                          <h3 className="text-xs font-bold text-[#16213A] dark:text-[#E7EBF5] truncate">
                            {hub.label}
                          </h3>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] tabular-nums text-[#1C6E46] dark:text-[#6FCB9F] shrink-0">
                        {selectedInHub}/{hubApps.length}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {hubApps.map((app) => {
                        const isSelected = selectedIds.includes(app.id);
                        const isSynergy = Boolean(
                          hoveredApp && hoveredApp.id !== app.id && hoveredApp.integratesWith.includes(app.id),
                        );
                        const isDimmed = !filteredIdSet.has(app.id);
                        return (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => toggleApp(app.id)}
                            onMouseEnter={() => setHoveredAppId(app.id)}
                            onMouseLeave={() => setHoveredAppId(null)}
                            className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                              isDimmed ? 'opacity-35' : 'opacity-100'
                            } ${
                              isSelected
                                ? 'bg-[#1F3863] text-white border-[#1F3863] dark:bg-[#1B2547] dark:border-[#6FCB9F]/60'
                                : isSynergy
                                  ? 'bg-amber-500/10 border-amber-500/60 text-[#16213A] dark:text-[#E7EBF5]'
                                  : 'bg-white dark:bg-[#141A32] border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1F3863]/40 dark:hover:border-[#8FA6E8]/50 text-[#16213A] dark:text-[#E7EBF5]'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-semibold truncate">{app.shortName}</div>
                              <div
                                className={`text-[10px] font-mono tabular-nums mt-0.5 ${
                                  isSelected
                                    ? 'text-[#A7E6C6]'
                                    : 'text-[#5F6576] dark:text-[#8E96B0]'
                                }`}
                              >
                                ${(app.setupUsd / 1000).toFixed(1)}K · {app.gmPct.toFixed(1)}% GM · T{app.minServerTier}
                              </div>
                            </div>
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-[#6FCB9F] text-[#0B1020]'
                                  : 'bg-[#F2EFE9] dark:bg-[#1D2545] text-[#5F6576] dark:text-[#8E96B0]'
                              }`}
                            >
                              {isSelected ? (
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              ) : (
                                <Plus className="w-3 h-3" strokeWidth={1.75} />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* VIEW 2: ODOO-INSPIRED SWISS HAIRLINE CATALOG GRID (13) */}
      {viewMode === 'grid' && (
        <div className="space-y-7">
          {groupedByCategory.length === 0 ? (
            <div className="rounded-2xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-10 text-center">
              <p className="text-sm font-semibold text-[#16213A] dark:text-[#E7EBF5]">
                No Spenta modules match your current filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setEngineFilter('all');
                  setDeployFilter('all');
                }}
                className="mt-3 text-xs font-semibold text-[#1C6E46] dark:text-[#6FCB9F] hover:underline cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            groupedByCategory.map(({ category, apps }) => (
              <section key={category}>
                <div className="flex items-center justify-between mb-3 px-0.5">
                  <h2 className="text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-[#5F6576] dark:text-[#8E96B0]">
                    {category}
                  </h2>
                  <span className="text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0] tabular-nums">
                    {apps.length} {apps.length === 1 ? 'module' : 'modules'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {apps.map((app) => {
                    const isSelected = selectedIds.includes(app.id);
                    const activeSynergies = app.integratesWith.filter((id) =>
                      selectedIds.includes(id),
                    );

                    return (
                      <article
                        key={app.id}
                        onClick={() => toggleApp(app.id)}
                        className={`rounded-xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#1F3863] text-white border-[#1F3863] dark:bg-[#1A2444] dark:border-[#6FCB9F]/60'
                            : 'bg-white dark:bg-[#141A32] text-[#16213A] dark:text-[#E7EBF5] border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1F3863]/40 dark:hover:border-[#8FA6E8]/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider flex-wrap">
                              <span className={isSelected ? 'text-[#6FCB9F] font-semibold' : 'text-[#1C6E46] dark:text-[#6FCB9F] font-semibold'}>
                                {app.engine}
                              </span>
                              <span className={isSelected ? 'text-white/30' : 'text-[#D4CEC2] dark:text-[#2F3A60]'}>·</span>
                              <span className={isSelected ? 'text-[#C6D2EE]' : 'text-[#5F6576] dark:text-[#8E96B0]'}>
                                {app.deployment.join(' / ')}
                              </span>
                            </div>

                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-[#6FCB9F] text-[#0B1020]'
                                  : 'bg-[#F2EFE9] dark:bg-[#1D2545] text-[#16213A] dark:text-[#C9D2E6]'
                              }`}
                            >
                              {isSelected ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4" strokeWidth={1.5} />}
                            </span>
                          </div>

                          <div className={`flex items-center gap-2 mb-1 ${isSelected ? 'text-[#C6D2EE]' : 'text-[#5F6576] dark:text-[#8E96B0]'}`}>
                            <HubIcon hubId={app.hubId} />
                            <EvidenceLabel app={app} />
                          </div>

                          <h3 className="font-bold text-base leading-snug">{app.name}</h3>
                          <p
                            className={`text-xs leading-relaxed mt-1.5 ${
                              isSelected ? 'text-[#D6DFF2]' : 'text-[#4A5568] dark:text-[#A4ADC6]'
                            }`}
                          >
                            {app.tagline}
                          </p>

                          <div
                            className={`mt-3 text-[11px] font-mono ${
                              isSelected ? 'text-[#C6D2EE]' : 'text-[#5F6576] dark:text-[#8E96B0]'
                            }`}
                          >
                            Proof: <span className={isSelected ? 'text-white' : 'text-[#16213A] dark:text-[#E7EBF5]'}>{app.proofClient}</span>
                          </div>

                          {(app.depends.length > 0 || activeSynergies.length > 0) && (
                            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono">
                              {app.depends.map((dep) => (
                                <span
                                  key={dep}
                                  className={isSelected ? 'text-amber-300' : 'text-amber-700 dark:text-amber-400'}
                                >
                                  Requires {appMap[dep]?.shortName ?? dep}
                                </span>
                              ))}
                              {activeSynergies.length > 0 && (
                                <span className={isSelected ? 'text-[#6FCB9F]' : 'text-[#1C6E46] dark:text-[#6FCB9F]'}>
                                  {activeSynergies.length} active synergy link{activeSynergies.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div
                          className={`mt-4 pt-3 border-t flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums ${
                            isSelected
                              ? 'border-white/15 text-[#A7E6C6]'
                              : 'border-[#E4DFD6] dark:border-[#232B4A] text-[#5F6576] dark:text-[#8E96B0]'
                          }`}
                        >
                          <span>{app.setupLabel}</span>
                          <span>{app.gmPct.toFixed(1)}% GM</span>
                          <span>T{app.minServerTier} · {app.layers.join('/')}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {/* VIEW 3: 3D SOVEREIGN NEURAL CORE */}
      {viewMode === 'brain3d' && (
        <section className="rounded-2xl border border-[#E4DFD6] dark:border-[#232B4A] bg-[#F2EFE9] dark:bg-[#0B1020] p-3 sm:p-4">
          <div className="h-[480px] sm:h-[600px] w-full">
            <SovereignBrain3D
              selectedHubId={activeBrainSelection.hubId}
              hubFocusNonce={activeBrainSelection.nonce}
              onSelectHub={(hubId) => selectBrainNode(hubId, undefined, 'vault')}
              polarity={theme}
            />
          </div>
        </section>
      )}
    </div>
  );
}
