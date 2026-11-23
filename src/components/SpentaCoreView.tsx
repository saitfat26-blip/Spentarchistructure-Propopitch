import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  Check,
  ClipboardList,
  Cpu,
  Download,
  Globe2,
  HardDrive,
  Layers,
  Lock,
  RotateCcw,
  Search,
  Server,
  Shield,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import {
  DUAL_SHORE_COMPARISON,
  SERVER_TIERS,
  SOVEREIGN_STACK_LAYERS,
  SPENTA_APPS,
  ServerTierId,
} from '../data/spentaManifest';
import {
  DEPLOYMENT_PROFILES,
  DEPLOYMENT_TARGET_ORDER,
} from '../data/deploymentProfiles';
import {
  CoreAuditScope,
  CoreIsolationMode,
  CoreLayerId,
  CorePolicyMode,
  DEFAULT_CORE_LAYER_CONFIGS,
  useStack,
} from '../store/StackContext';
import { AiSafetyWorkbench } from './AiSafetyWorkbench';

type CoreTab = 'architecture' | 'safety' | 'audit';

const ISOLATION_OPTIONS: CoreIsolationMode[] = [
  'Air-Gapped On-Prem',
  'Private Sovereign VPC',
  'Hybrid Edge',
];

const POLICY_OPTIONS: CorePolicyMode[] = [
  'Strict OPA (>= 0.88 HITL)',
  'Balanced OPA (>= 0.85 HITL)',
  'Audit-Only Monitor',
];

const LAYER_SLA_PRESETS: Record<CoreLayerId, string[]> = {
  L6: [
    '99.95% UI uptime · <120ms TTI',
    '99.99% HA Active-Active · <80ms TTI',
    '99.90% Standard Branch · <180ms TTI',
  ],
  L5: [
    '0.88 HITL Gate · 100% immutable audit trace',
    '0.92 Banking Zero-Defect · Dual-Key Signoff',
    '0.85 Fast-Track Ops · Async Audit Mirror',
  ],
  L4: [
    '60–90 FPS XR · <18MB WebAR payloads',
    '90 FPS Cleanroom VR · Local Pixel Stream',
    '45–60 FPS Mobile WebAR · <10MB Lite Mesh',
  ],
  L3: [
    '<30s/form ICR · 0 bytes cloud PII egress',
    '<15s/form Batch ICR · Dual-GPU TensorRT',
    '<60s/form Eco Quantized INT4 · Low-Power',
  ],
  L2: [
    '<50ms edge inference · Hardware-enforced memory encryption',
    '<25ms ultra-low latency · AMD SEV-SNP Attested',
    '<100ms standard edge · TLS 1.3 + K3s',
  ],
  L1: [
    '80 BaaS Stations / 480 EVs · Sub-second MQTT ingest',
    '250+ Fleet Nodes · 500ms Telemetry SLA',
    'Offline-First Store & Forward · 72h Buffer',
  ],
};

function formatAuditTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

export function SpentaCoreView() {
  const {
    theme,
    selectedIds,
    toggleApp,
    stackMetrics,
    pendingNavFocus,
    clearPendingNavFocus,
    deploymentTarget,
    deploymentProfile,
    setDeploymentTarget,
    coreLayerConfigs,
    coreAuditLog,
    updateCoreLayerConfig,
    resetCoreLayerConfig,
    logCoreAuditEvent,
    clearCoreAuditLog,
  } = useStack();

  const [activeCoreTab, setActiveCoreTab] = useState<CoreTab>('architecture');
  const [activeLayerId, setActiveLayerId] = useState<CoreLayerId>('L5');
  const [selectedTierId, setSelectedTierId] = useState<ServerTierId>(stackMetrics.tier);
  const [recentLogHint, setRecentLogHint] = useState<string | null>(null);

  const [auditQuery, setAuditQuery] = useState<string>('');
  const [auditScopeFilter, setAuditScopeFilter] = useState<'ALL' | CoreAuditScope>('ALL');
  const [confirmClearLog, setConfirmClearLog] = useState<boolean>(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (!pendingNavFocus) return;
    if (pendingNavFocus.type === 'layer') {
      const valid = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];
      if (valid.includes(pendingNavFocus.id)) {
        setActiveCoreTab('architecture');
        setActiveLayerId(pendingNavFocus.id as CoreLayerId);
      }
      clearPendingNavFocus();
    } else if (pendingNavFocus.type === 'tier') {
      const n = Number(pendingNavFocus.id);
      if (n >= 1 && n <= 4) {
        setActiveCoreTab('architecture');
        setSelectedTierId(n as ServerTierId);
      }
      clearPendingNavFocus();
    }
  }, [pendingNavFocus, clearPendingNavFocus]);

  useEffect(() => {
    if (!recentLogHint) return;
    const timer = window.setTimeout(() => setRecentLogHint(null), 5000);
    return () => window.clearTimeout(timer);
  }, [recentLogHint]);

  const activeLayer = useMemo(
    () => SOVEREIGN_STACK_LAYERS.find((l) => l.id === activeLayerId) ?? SOVEREIGN_STACK_LAYERS[1],
    [activeLayerId],
  );

  const activeConfig = coreLayerConfigs[activeLayerId];
  const defaultConfig = DEFAULT_CORE_LAYER_CONFIGS[activeLayerId];
  const isLayerModified =
    activeConfig.isolationMode !== defaultConfig.isolationMode ||
    activeConfig.policyMode !== defaultConfig.policyMode ||
    activeConfig.teeEnabled !== defaultConfig.teeEnabled ||
    activeConfig.slaTarget !== defaultConfig.slaTarget;

  const dependentApps = useMemo(
    () => SPENTA_APPS.filter((app) => app.layers.includes(activeLayerId)),
    [activeLayerId],
  );

  const tierList = [SERVER_TIERS[1], SERVER_TIERS[2], SERVER_TIERS[3], SERVER_TIERS[4]];
  const focusedTier = SERVER_TIERS[selectedTierId];

  const modifiedLayerCount = useMemo(() => {
    return (['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] as CoreLayerId[]).filter((id) => {
      const cfg = coreLayerConfigs[id];
      const def = DEFAULT_CORE_LAYER_CONFIGS[id];
      return (
        cfg.isolationMode !== def.isolationMode ||
        cfg.policyMode !== def.policyMode ||
        cfg.teeEnabled !== def.teeEnabled ||
        cfg.slaTarget !== def.slaTarget
      );
    }).length;
  }, [coreLayerConfigs]);

  const strictOpaCount = useMemo(
    () =>
      (['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] as CoreLayerId[]).filter(
        (id) => coreLayerConfigs[id].policyMode === 'Strict OPA (>= 0.88 HITL)',
      ).length,
    [coreLayerConfigs],
  );

  const teeEnabledCount = useMemo(
    () =>
      (['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] as CoreLayerId[]).filter(
        (id) => coreLayerConfigs[id].teeEnabled,
      ).length,
    [coreLayerConfigs],
  );

  const filteredAuditEntries = useMemo(() => {
    const q = auditQuery.trim().toLowerCase();
    return coreAuditLog.filter((entry) => {
      if (auditScopeFilter !== 'ALL' && entry.layer !== auditScopeFilter) return false;
      if (!q) return true;
      return (
        entry.action.toLowerCase().includes(q) ||
        entry.field.toLowerCase().includes(q) ||
        entry.previousValue.toLowerCase().includes(q) ||
        entry.newValue.toLowerCase().includes(q) ||
        entry.actor.toLowerCase().includes(q) ||
        entry.layer.toLowerCase().includes(q)
      );
    });
  }, [coreAuditLog, auditQuery, auditScopeFilter]);

  const handleLayerConfigChange = (
    patch: Partial<typeof activeConfig>,
    actionLabel: string,
  ) => {
    updateCoreLayerConfig(activeLayerId, patch, actionLabel);
    setRecentLogHint(`${activeLayerId}: ${actionLabel}`);
  };

  const handleResetLayer = () => {
    resetCoreLayerConfig(activeLayerId);
    setRecentLogHint(`${activeLayerId}: Restored Sovereign Baseline`);
  };

  const handleLayerModuleToggle = (appId: string, appShortName: string, currentlyActive: boolean) => {
    toggleApp(appId);
    logCoreAuditEvent({
      actor: 'Sovereign Architect',
      layer: activeLayerId,
      action: currentlyActive ? 'Detached Module from Layer Stack' : 'Attached Module to Layer Stack',
      field: 'Composed Stack Module',
      previousValue: currentlyActive ? `${appShortName} (Attached)` : `${appShortName} (Detached)`,
      newValue: currentlyActive ? `${appShortName} (Detached)` : `${appShortName} (Attached)`,
    });
    setRecentLogHint(
      `${activeLayerId}: ${currentlyActive ? 'Detached' : 'Attached'} ${appShortName}`,
    );
  };

  const handleSelectServerTier = (tierId: ServerTierId) => {
    if (tierId === selectedTierId) return;
    const prevTier = SERVER_TIERS[selectedTierId];
    const nextTier = SERVER_TIERS[tierId];
    setSelectedTierId(tierId);
    logCoreAuditEvent({
      actor: 'Sovereign Architect',
      layer: 'Hardware',
      action: 'Updated Target Server PC Tier',
      field: 'Target Server Tier',
      previousValue: `${prevTier.code} (${prevTier.capex})`,
      newValue: `${nextTier.code} (${nextTier.capex})`,
    });
    setRecentLogHint(`Hardware: Switched to ${nextTier.code}`);
  };

  const handleExportAuditJson = () => {
    const payload = {
      platform: 'Spenta Sovereign OS — Core L1–L6 Audit Ledger',
      exportedAt: new Date().toISOString(),
      totalEvents: coreAuditLog.length,
      currentLayerConfigs: coreLayerConfigs,
      auditLog: coreAuditLog,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spenta-core-audit-log-${coreAuditLog.length}events.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header + Segmented View Switcher */}
      <section className="rounded-2xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#1C6E46] dark:text-[#6FCB9F]">
            SPENTA CORE KERNEL · L1–L6 FUSION STACK · 4-TIER LOCAL SERVERS · AUDIT LEDGER
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#16213A] dark:text-[#E7EBF5] tracking-tight mt-1">
            Spenta Core — Sovereign Fusion Architecture &amp; Configuration Governance
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5568] dark:text-[#A4ADC6] mt-1 max-w-3xl">
            Every module in the Spenta App Vault inherits one shared L1–L6 kernel. Active target:{' '}
            <strong className="font-mono text-[#16213A] dark:text-[#E7EBF5]">
              {deploymentProfile.shortLabel}
            </strong>{' '}
            ({deploymentProfile.latencyBudget} · {deploymentProfile.transport}).
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0]">
              Target Environment:
            </span>
            <div
              role="group"
              aria-label="Core infrastructure target environment"
              className="inline-flex flex-wrap items-center gap-1 p-0.5 rounded-lg bg-[#F2EFE9] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A]"
            >
              {DEPLOYMENT_TARGET_ORDER.map((tid) => {
                const prof = DEPLOYMENT_PROFILES[tid];
                const active = deploymentTarget === tid;
                return (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => setDeploymentTarget(tid, 'Spenta Core Console')}
                    aria-pressed={active}
                    className={`px-2.5 py-1.5 sm:py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                        : 'text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                    }`}
                  >
                    {prof.switcherLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="inline-flex flex-wrap rounded-xl bg-[#F2EFE9] dark:bg-[#0F1529] p-1 border border-[#E4DFD6] dark:border-[#232B4A] self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveCoreTab('architecture')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeCoreTab === 'architecture'
                ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                : 'text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Architecture &amp; Config</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCoreTab('safety')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeCoreTab === 'safety'
                ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                : 'text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>AI Safety &amp; Pre-Trust</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCoreTab('audit')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeCoreTab === 'audit'
                ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                : 'text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Audit Log</span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.5 rounded tabular-nums ${
                activeCoreTab === 'audit'
                  ? 'bg-[#6FCB9F] text-[#0B1020]'
                  : 'bg-white dark:bg-[#141A32] text-[#16213A] dark:text-[#E7EBF5] border border-[#E4DFD6] dark:border-[#232B4A]'
              }`}
            >
              {coreAuditLog.length}
            </span>
          </button>
        </div>
      </section>

      {activeCoreTab === 'safety' ? (
        <AiSafetyWorkbench />
      ) : activeCoreTab === 'architecture' ? (
        <>
          {/* Section 1: Interactive L1-L6 Sovereign Fusion Stack */}
          <section className="rounded-2xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="inline-flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1C6E46] dark:text-[#6FCB9F]" strokeWidth={1.5} />
                <h2 className="text-base sm:text-lg font-bold text-[#16213A] dark:text-[#E7EBF5]">
                  Interactive L1–L6 Sovereign Fusion Stack
                </h2>
              </div>

              {recentLogHint ? (
                <button
                  type="button"
                  onClick={() => setActiveCoreTab('audit')}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#1C6E46] dark:text-[#6FCB9F] bg-[#1C6E46]/10 dark:bg-[#6FCB9F]/10 border border-[#1C6E46]/30 dark:border-[#6FCB9F]/35 px-3 py-1 rounded-lg hover:bg-[#1C6E46]/15 dark:hover:bg-[#6FCB9F]/20 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Logged: {recentLogHint}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <span className="text-xs font-mono text-[#5F6576] dark:text-[#8E96B0]">
                  Select a layer to inspect API contracts &amp; configure isolation/OPA rules
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Vertical Stack Selector */}
              <div className="lg:col-span-5 space-y-2">
                {SOVEREIGN_STACK_LAYERS.map((layer) => {
                  const isSelected = layer.id === activeLayerId;
                  const isActivatedByStack = stackMetrics.activeLayers.has(layer.id);
                  const layerAppCount = SPENTA_APPS.filter((a) => a.layers.includes(layer.id)).length;
                  const cfg = coreLayerConfigs[layer.id];
                  const def = DEFAULT_CORE_LAYER_CONFIGS[layer.id];
                  const modified =
                    cfg.isolationMode !== def.isolationMode ||
                    cfg.policyMode !== def.policyMode ||
                    cfg.teeEnabled !== def.teeEnabled ||
                    cfg.slaTarget !== def.slaTarget;

                  return (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => setActiveLayerId(layer.id)}
                      className={`w-full text-left rounded-xl p-3.5 border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#1F3863] text-white border-[#1F3863] dark:bg-[#1B2547] dark:border-[#6FCB9F]/60'
                          : 'bg-[#FAF8F4] dark:bg-[#0F1529] text-[#16213A] dark:text-[#E7EBF5] border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1F3863]/40 dark:hover:border-[#8FA6E8]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-10 h-10 rounded-lg font-mono text-xs font-extrabold flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-[#6FCB9F] text-[#0B1020] border-[#6FCB9F]'
                              : 'bg-white dark:bg-[#141A32] text-[#1F3863] dark:text-[#6FCB9F] border-[#E4DFD6] dark:border-[#232B4A]'
                          }`}
                        >
                          {layer.id}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">{layer.title}</div>
                          <div
                            className={`text-[11px] truncate ${
                              isSelected ? 'text-[#C6D2EE]' : 'text-[#5F6576] dark:text-[#8E96B0]'
                            }`}
                          >
                            {cfg.isolationMode} · {cfg.teeEnabled ? 'TEE ON' : 'Standard TLS'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-mono text-[10px]">
                        <div className={isSelected ? 'text-[#A7E6C6]' : 'text-[#5F6576] dark:text-[#8E96B0]'}>
                          {layerAppCount} apps
                        </div>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                          {modified && <span className="text-amber-400 font-bold">EDITED</span>}
                          {isActivatedByStack && (
                            <span className={isSelected ? 'text-[#6FCB9F] font-bold' : 'text-[#1C6E46] dark:text-[#6FCB9F] font-bold'}>
                              ACTIVE
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Layer Technical Detail Inspector + Live Configuration */}
              <div className="lg:col-span-7 rounded-2xl bg-[#FAF8F4] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A] p-4 sm:p-5 flex flex-col justify-between gap-5">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E4DFD6] dark:border-[#232B4A]">
                    <div>
                      <span className="font-mono text-[11px] font-extrabold text-[#1C6E46] dark:text-[#6FCB9F]">
                        {activeLayer.id} ARCHITECTURE CONTRACT
                      </span>
                      <h3 className="text-base sm:text-lg font-extrabold text-[#16213A] dark:text-[#E7EBF5] mt-0.5">
                        {activeLayer.title}
                      </h3>
                    </div>
                    <span className="font-mono text-[11px] bg-[#0F1529] dark:bg-[#141A32] text-[#6FCB9F] border border-[#232B4A] px-2.5 py-1 rounded-lg">
                      {activeConfig.slaTarget}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#4A5568] dark:text-[#C9D2E6] leading-relaxed">
                    {activeLayer.summary}
                  </p>

                  {/* Live L1-L6 Configuration Panel */}
                  <div className="bg-white dark:bg-[#141A32] rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] p-4 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#16213A] dark:text-[#E7EBF5]">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" strokeWidth={1.5} />
                        <span>Live {activeLayer.id} Configuration Controls</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetLayer}
                        disabled={!isLayerModified}
                        className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-1.5 sm:py-1 rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                          isLayerModified
                            ? 'border-[#D4CEC2] dark:border-[#2F3A60] bg-[#FAF8F4] dark:bg-[#0F1529] text-[#16213A] dark:text-[#E7EBF5] hover:border-[#1F3863] dark:hover:border-[#8FA6E8] cursor-pointer'
                            : 'border-[#E4DFD6] dark:border-[#232B4A] bg-[#F2EFE9] dark:bg-[#0B1020] text-[#9AA1B2] dark:text-[#4F5A7B] cursor-not-allowed'
                        }`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Baseline</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="core-isolation-select"
                          className="block text-[10px] font-mono font-bold uppercase text-[#5F6576] dark:text-[#8E96B0] mb-1"
                        >
                          Deployment Isolation
                        </label>
                        <select
                          id="core-isolation-select"
                          value={activeConfig.isolationMode}
                          onChange={(e) =>
                            handleLayerConfigChange(
                              { isolationMode: e.target.value as CoreIsolationMode },
                              'Changed Deployment Isolation',
                            )
                          }
                          className="w-full min-h-[38px] rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0B1020] px-2.5 py-1.5 text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] focus:outline-none focus:border-[#1F3863] dark:focus:border-[#8FA6E8]"
                        >
                          {ISOLATION_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="core-policy-select"
                          className="block text-[10px] font-mono font-bold uppercase text-[#5F6576] dark:text-[#8E96B0] mb-1"
                        >
                          OPA Policy Enforcement
                        </label>
                        <select
                          id="core-policy-select"
                          value={activeConfig.policyMode}
                          onChange={(e) =>
                            handleLayerConfigChange(
                              { policyMode: e.target.value as CorePolicyMode },
                              'Updated OPA Policy Mode',
                            )
                          }
                          className="w-full min-h-[38px] rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0B1020] px-2.5 py-1.5 text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] focus:outline-none focus:border-[#1F3863] dark:focus:border-[#8FA6E8]"
                        >
                          {POLICY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="core-sla-select"
                          className="block text-[10px] font-mono font-bold uppercase text-[#5F6576] dark:text-[#8E96B0] mb-1"
                        >
                          Target SLA Profile
                        </label>
                        <select
                          id="core-sla-select"
                          value={activeConfig.slaTarget}
                          onChange={(e) =>
                            handleLayerConfigChange(
                              { slaTarget: e.target.value },
                              'Updated Target SLA Profile',
                            )
                          }
                          className="w-full min-h-[38px] rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0B1020] px-2.5 py-1.5 text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] focus:outline-none focus:border-[#1F3863] dark:focus:border-[#8FA6E8]"
                        >
                          {LAYER_SLA_PRESETS[activeLayerId].map((preset) => (
                            <option key={preset} value={preset}>
                              {preset}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="block text-[10px] font-mono font-bold uppercase text-[#5F6576] dark:text-[#8E96B0] mb-1">
                          Hardware TEE (AMD SEV-SNP / TDX)
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleLayerConfigChange(
                              { teeEnabled: !activeConfig.teeEnabled },
                              !activeConfig.teeEnabled
                                ? 'Enabled Hardware TEE Enclave'
                                : 'Disabled Hardware TEE Enclave',
                            )
                          }
                          className={`w-full min-h-[38px] flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-colors cursor-pointer ${
                            activeConfig.teeEnabled
                              ? 'bg-[#1C6E46]/12 dark:bg-[#6FCB9F]/15 text-[#1C6E46] dark:text-[#6FCB9F] border-[#1C6E46]/40 dark:border-[#6FCB9F]/50'
                              : 'bg-[#FAF8F4] dark:bg-[#0B1020] text-[#5F6576] dark:text-[#8E96B0] border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1F3863]/40 dark:hover:border-[#8FA6E8]/40'
                          }`}
                        >
                          <span>{activeConfig.teeEnabled ? 'TEE ATTESTED' : 'TEE DISABLED'}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              activeConfig.teeEnabled
                                ? 'bg-[#1C6E46] dark:bg-[#6FCB9F] text-white dark:text-[#0B1020]'
                                : 'bg-[#E4DFD6] dark:bg-[#1D2545] text-[#5F6576] dark:text-[#8E96B0]'
                            }`}
                          >
                            {activeConfig.teeEnabled ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Protocols & Security */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-[#141A32] rounded-xl p-3.5 border border-[#E4DFD6] dark:border-[#232B4A]">
                      <div className="text-[10px] font-mono font-bold uppercase text-[#5F6576] dark:text-[#8E96B0] mb-2">
                        Core Protocols &amp; Engines
                      </div>
                      <ul className="space-y-1 text-xs text-[#16213A] dark:text-[#E7EBF5] font-medium">
                        {activeLayer.protocols.map((p) => (
                          <li key={p} className="font-mono">
                            · {p}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white dark:bg-[#141A32] rounded-xl p-3.5 border border-[#E4DFD6] dark:border-[#232B4A]">
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#1C6E46] dark:text-[#6FCB9F] mb-2">
                        <Lock className="w-3 h-3" strokeWidth={1.5} />
                        <span>Security &amp; Isolation Controls</span>
                      </div>
                      <ul className="space-y-1 text-xs text-[#4A5568] dark:text-[#C9D2E6]">
                        {activeLayer.securityControls.map((c) => (
                          <li key={c}>· {c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* API Contracts */}
                  <div className="bg-[#0B1020] text-[#E7EBF5] rounded-xl border border-[#232B4A] p-3.5 overflow-x-auto">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#6FCB9F] mb-2">
                      Standardized Spenta Core API Contracts ({activeLayer.id})
                    </div>
                    <div className="space-y-1.5 font-mono text-xs">
                      {activeLayer.apiContracts.map((contract) => (
                        <div key={contract} className="text-[#C6D2EE] whitespace-nowrap">
                          $ {contract}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dependent Apps Toggle Strip */}
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5F6576] dark:text-[#8E96B0] mb-2">
                    Spenta Modules Powered by {activeLayer.id} ({dependentApps.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dependentApps.map((app) => {
                      const active = selectedIds.includes(app.id);
                      return (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => handleLayerModuleToggle(app.id, app.shortName, active)}
                          className={`text-xs font-mono px-2.5 py-1.5 sm:py-1 rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            active
                              ? 'bg-[#1C6E46]/12 dark:bg-[#6FCB9F]/15 text-[#1C6E46] dark:text-[#6FCB9F] border-[#1C6E46]/40 dark:border-[#6FCB9F]/50'
                              : 'bg-white dark:bg-[#141A32] text-[#16213A] dark:text-[#E7EBF5] border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50'
                          }`}
                        >
                          {active ? '✓ ' : '+ '}
                          {app.shortName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: 4-Tier On-Prem Server PC Configurator */}
          <section className="rounded-2xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="inline-flex items-center gap-2">
                <Server className="w-4 h-4 text-[#1C6E46] dark:text-[#6FCB9F]" strokeWidth={1.5} />
                <h2 className="text-base sm:text-lg font-bold text-[#16213A] dark:text-[#E7EBF5]">
                  4-Tier On-Premises Sovereign Server PC Configurator
                </h2>
              </div>
              <div className="text-xs font-mono text-[#4A5568] dark:text-[#A4ADC6]">
                Your Stack Recommends:{' '}
                <strong className="text-[#1C6E46] dark:text-[#6FCB9F] bg-[#1C6E46]/10 dark:bg-[#6FCB9F]/12 border border-[#1C6E46]/30 dark:border-[#6FCB9F]/35 px-2 py-0.5 rounded">
                  {SERVER_TIERS[stackMetrics.tier].code} ({SERVER_TIERS[stackMetrics.tier].capex})
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {tierList.map((tier) => {
                const isRecommended = tier.id === stackMetrics.tier;
                const isFocused = tier.id === selectedTierId;

                return (
                  <article
                    key={tier.id}
                    onClick={() => handleSelectServerTier(tier.id)}
                    className={`rounded-xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                      isRecommended
                        ? 'bg-[#1F3863] text-white border-[#1C6E46] dark:bg-[#0F1529] dark:border-[#6FCB9F]/60'
                        : isFocused
                          ? 'bg-[#F2EFE9] dark:bg-[#19213E] text-[#16213A] dark:text-[#E7EBF5] border-[#1F3863]/50 dark:border-[#8FA6E8]/50'
                          : 'bg-[#FAF8F4] dark:bg-[#0F1529] text-[#16213A] dark:text-[#E7EBF5] border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1F3863]/45 dark:hover:border-[#8FA6E8]/45'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`font-mono text-xs font-extrabold ${
                            isRecommended ? 'text-[#6FCB9F]' : 'text-[#1C6E46] dark:text-[#6FCB9F]'
                          }`}
                        >
                          {tier.code}
                        </span>
                        {isRecommended && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold bg-[#6FCB9F] text-[#0B1020] px-2 py-0.5 rounded">
                            <Check className="w-3 h-3" /> STACK FIT
                          </span>
                        )}
                        {!isRecommended && tier.id === 3 && (
                          <span className="font-mono text-[10px] font-semibold text-[#1C6E46] dark:text-[#6FCB9F] bg-[#1C6E46]/10 dark:bg-[#6FCB9F]/12 border border-[#1C6E46]/25 dark:border-[#6FCB9F]/30 px-2 py-0.5 rounded">
                            BASELINE
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm leading-snug">{tier.name}</h3>
                      <div
                        className={`font-mono text-lg font-extrabold mt-2 tabular-nums ${
                          isRecommended ? 'text-amber-300' : 'text-[#16213A] dark:text-[#E7EBF5]'
                        }`}
                      >
                        {tier.capex}
                      </div>
                      <div
                        className={`font-mono text-xs mt-0.5 ${
                          isRecommended ? 'text-[#A7E6C7]' : 'text-[#1C6E46] dark:text-[#6FCB9F]'
                        }`}
                      >
                        {tier.speed} · {tier.modelScale}
                      </div>

                      <div
                        className={`mt-3 space-y-1.5 text-xs ${
                          isRecommended ? 'text-[#CBD5E1]' : 'text-[#4A5568] dark:text-[#A4ADC6]'
                        }`}
                      >
                        <div className="flex items-start gap-1.5">
                          <Cpu
                            className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                              isRecommended ? 'text-[#6FCB9F]' : 'text-[#1C6E46] dark:text-[#6FCB9F]'
                            }`}
                            strokeWidth={1.5}
                          />
                          <span>{tier.hardware}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <HardDrive
                            className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                              isRecommended ? 'text-[#A4ADC6]' : 'text-[#5F6576] dark:text-[#8E96B0]'
                            }`}
                            strokeWidth={1.5}
                          />
                          <span>
                            {tier.vramRam} · {tier.storage}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p
                      className={`mt-3 pt-3 border-t text-[11px] leading-snug ${
                        isRecommended
                          ? 'border-white/15 text-[#CBD5E1]'
                          : 'border-[#E4DFD6] dark:border-[#232B4A] text-[#5F6576] dark:text-[#8E96B0]'
                      }`}
                    >
                      {tier.idealFor}
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl bg-[#FAF8F4] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-mono font-bold text-[#1C6E46] dark:text-[#6FCB9F]">
                  {focusedTier.code} BENCHMARK:
                </span>{' '}
                <span className="text-[#16213A] dark:text-[#E7EBF5]">
                  {focusedTier.note ?? focusedTier.idealFor}
                </span>
              </div>
              <div className="font-mono text-[#4A5568] dark:text-[#A4ADC6] shrink-0 tabular-nums">
                12-Mo Amortized Compute:{' '}
                <strong className="text-[#16213A] dark:text-[#E7EBF5]">
                  ${Math.round(focusedTier.capexMidUsd / 12).toLocaleString()}/mo
                </strong>{' '}
                (Zero token metering)
              </div>
            </div>
          </section>

          {/* Section 3: Dual-Shore Delivery Pod Advantage */}
          <section className="rounded-2xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-4 sm:p-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 min-w-0 space-y-3">
                <div className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-[#1C6E46] dark:text-[#6FCB9F]">
                  <Globe2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Dual-Shore Delivery Pods (Normalized 20-FTE)</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#16213A] dark:text-[#E7EBF5]">
                  San Jose &amp; Australia Orchestration + 20-FTE Dhaka R&amp;D Hub
                </h2>
                <p className="text-xs sm:text-sm text-[#4A5568] dark:text-[#A4ADC6] leading-relaxed">
                  Spenta pairs senior Western architecture and client governance with a full-stack 20-FTE Dhaka R&amp;D engineering center running at{' '}
                  <strong className="font-mono text-[#16213A] dark:text-[#E7EBF5]">$12.98/hr</strong>{' '}
                  fully loaded (<span className="font-mono">$11.50/hr</span> base payroll +{' '}
                  <span className="font-mono">$1.48/hr</span> enclave overhead ={' '}
                  <strong className="font-mono text-[#16213A] dark:text-[#E7EBF5]">
                    $540K / 64.8M BDT
                  </strong>{' '}
                  Y1 budget across 41,600 hrs/yr).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl bg-[#FAF8F4] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A] p-3">
                    <div className="text-[10px] font-mono uppercase text-[#5F6576] dark:text-[#8E96B0]">
                      20-FTE Annual Edge
                    </div>
                    <div className="font-mono text-xl font-extrabold text-[#1C6E46] dark:text-[#6FCB9F] mt-0.5 tabular-nums">
                      $540K vs $4.78M
                    </div>
                    <div className="text-[11px] text-[#4A5568] dark:text-[#A4ADC6]">
                      8.9× cost advantage vs. US/AU pods
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#FAF8F4] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A] p-3">
                    <div className="text-[10px] font-mono uppercase text-[#5F6576] dark:text-[#8E96B0]">
                      Security Posture
                    </div>
                    <div className="font-mono text-xl font-extrabold text-[#16213A] dark:text-[#E7EBF5] mt-0.5 inline-flex items-center gap-1">
                      <Shield className="w-4 h-4 text-[#1C6E46] dark:text-[#6FCB9F]" strokeWidth={1.5} /> 24/7 SLA
                    </div>
                    <div className="text-[11px] text-[#4A5568] dark:text-[#A4ADC6]">
                      TEE + Air-Gapped VPN
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 min-w-0 h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={DUAL_SHORE_COMPARISON}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? '#232B4A' : '#E4DFD6'}
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      domain={[0, 165]}
                      tickFormatter={(v) => `$${v}/hr`}
                      tick={{
                        fontSize: 11,
                        fontFamily: 'JetBrains Mono, monospace',
                        fill: isDark ? '#8E96B0' : '#5F6576',
                      }}
                      axisLine={{ stroke: isDark ? '#232B4A' : '#E4DFD6' }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="role"
                      width={136}
                      tick={{
                        fontSize: 10,
                        fontWeight: 600,
                        fill: isDark ? '#E7EBF5' : '#16213A',
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: unknown, _name: unknown, props: { payload?: { annualTeamUsd?: number; edgeLabel?: string } }) => {
                        const annual = props.payload?.annualTeamUsd;
                        const annualFmt = annual
                          ? annual >= 1000000
                            ? `$${(annual / 1000000).toFixed(2)}M/yr`
                            : `$${(annual / 1000).toFixed(0)}K/yr`
                          : '';
                        return [
                          `$${Number(value).toFixed(2)}/hr (${annualFmt})`,
                          props.payload?.edgeLabel ?? '20-FTE Loaded Pod',
                        ];
                      }}
                      contentStyle={{
                        borderRadius: '10px',
                        backgroundColor: isDark ? '#141A32' : '#FFFFFF',
                        border: isDark ? '1px solid #232B4A' : '1px solid #E4DFD6',
                        color: isDark ? '#E7EBF5' : '#16213A',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '12px',
                      }}
                      itemStyle={{ color: isDark ? '#E7EBF5' : '#16213A' }}
                    />
                    <Bar dataKey="hourlyUsd" radius={[0, 6, 6, 0]} barSize={24}>
                      {DUAL_SHORE_COMPARISON.map((entry) => (
                        <Cell key={entry.role} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </>
      ) : (
        /* Audit Log Tab */
        <div className="space-y-5">
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl p-4 bg-[#1F3863] dark:bg-[#0F1529] text-white border border-[#1F3863] dark:border-[#6FCB9F]/35">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#6FCB9F]">
                Total Audit Events
              </div>
              <div className="font-mono text-2xl font-extrabold mt-1 tabular-nums">
                {coreAuditLog.length}
              </div>
              <div className="text-[11px] font-mono text-[#CBD5E1] dark:text-[#A4ADC6] mt-0.5">
                Persisted locally across sessions
              </div>
            </div>

            <div className="rounded-2xl p-4 bg-white dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A]">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#5F6576] dark:text-[#8E96B0]">
                Customized Layers
              </div>
              <div className="font-mono text-2xl font-extrabold text-[#16213A] dark:text-[#E7EBF5] mt-1 tabular-nums">
                {modifiedLayerCount} / 6
              </div>
              <div className="text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0] mt-0.5">
                Diverged from L1–L6 baseline
              </div>
            </div>

            <div className="rounded-2xl p-4 bg-white dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A]">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#5F6576] dark:text-[#8E96B0]">
                Strict OPA (&gt;=0.88)
              </div>
              <div className="font-mono text-2xl font-extrabold text-[#1C6E46] dark:text-[#6FCB9F] mt-1 tabular-nums">
                {strictOpaCount} / 6
              </div>
              <div className="text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0] mt-0.5">
                HITL circuit-breaker active
              </div>
            </div>

            <div className="rounded-2xl p-4 bg-white dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A]">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#5F6576] dark:text-[#8E96B0]">
                Hardware TEE Active
              </div>
              <div className="font-mono text-2xl font-extrabold text-[#1F3863] dark:text-[#8FA6E8] mt-1 tabular-nums">
                {teeEnabledCount} / 6
              </div>
              <div className="text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0] mt-0.5">
                AMD SEV-SNP / Intel TDX enclaves
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#5F6576] dark:text-[#8E96B0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
                <input
                  type="text"
                  value={auditQuery}
                  onChange={(e) => setAuditQuery(e.target.value)}
                  placeholder="Filter by action, layer, field, value, or actor..."
                  aria-label="Filter audit log entries"
                  className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] text-xs text-[#16213A] dark:text-[#E7EBF5] placeholder:text-[#5F6576] dark:placeholder:text-[#8E96B0] focus:outline-none focus:border-[#1F3863] dark:focus:border-[#8FA6E8]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportAuditJson}
                  disabled={coreAuditLog.length === 0}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#1C6E46] hover:bg-[#165838] dark:bg-[#6FCB9F] dark:hover:bg-[#5BBE90] disabled:opacity-40 text-white dark:text-[#0B1020] text-xs font-mono font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Export JSON</span>
                </button>

                {!confirmClearLog ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClearLog(true)}
                    disabled={coreAuditLog.length === 0}
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] hover:border-rose-500/40 hover:text-[#E11D48] disabled:opacity-40 text-xs font-semibold text-[#4A5568] dark:text-[#A4ADC6] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Clear Log</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1.5 rounded-xl">
                    <span className="text-[11px] font-semibold text-[#E11D48]">Clear all?</span>
                    <button
                      type="button"
                      onClick={() => {
                        clearCoreAuditLog();
                        setConfirmClearLog(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#E11D48] text-white text-[11px] font-bold cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearLog(false)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A] text-[11px] font-semibold text-[#4A5568] dark:text-[#A4ADC6] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(['ALL', 'L6', 'L5', 'L4', 'L3', 'L2', 'L1', 'Hardware'] as const).map((scope) => {
                const active = auditScopeFilter === scope;
                return (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => setAuditScopeFilter(scope)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#1F3863] text-white border-[#1F3863] dark:bg-[#8FA6E8] dark:text-[#0B1020] dark:border-[#8FA6E8]'
                        : 'bg-[#FAF8F4] dark:bg-[#0F1529] text-[#4A5568] dark:text-[#A4ADC6] border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1F3863]/45 dark:hover:border-[#8FA6E8]/45'
                    }`}
                  >
                    {scope === 'ALL' ? `All (${coreAuditLog.length})` : scope}
                  </button>
                );
              })}
            </div>

            {filteredAuditEntries.length === 0 ? (
              <div className="rounded-xl bg-[#FAF8F4] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A] p-8 text-center">
                <ClipboardList className="w-7 h-7 text-[#5F6576] dark:text-[#8E96B0] mx-auto mb-2" strokeWidth={1.5} />
                <div className="text-sm font-bold text-[#16213A] dark:text-[#E7EBF5]">
                  No matching audit entries
                </div>
                <p className="text-xs text-[#4A5568] dark:text-[#A4ADC6] mt-1">
                  Modify any L1–L6 layer isolation mode, OPA policy, Hardware TEE toggle, or Server PC Tier to record live configuration diffs.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveCoreTab('architecture')}
                  className="mt-3 inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#1F3863] dark:bg-[#8FA6E8] text-white dark:text-[#0B1020] text-xs font-bold cursor-pointer"
                >
                  <span>Go to Architecture &amp; Config</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#E4DFD6] dark:border-[#232B4A]">
                <table className="w-full min-w-[740px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0F1529] text-[#6FCB9F] font-mono text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Scope</th>
                      <th className="py-2.5 px-3">User Action &amp; Field</th>
                      <th className="py-2.5 px-3">Previous Value → New Value</th>
                      <th className="py-2.5 px-3 text-right">Actor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4DFD6]/80 dark:divide-[#232B4A]">
                    {filteredAuditEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-[#FAF8F4] dark:hover:bg-[#0F1529]/70 transition-colors"
                      >
                        <td className="py-3 px-3 font-mono text-[11px] text-[#4A5568] dark:text-[#A4ADC6] whitespace-nowrap tabular-nums">
                          {formatAuditTime(entry.timestamp)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-block font-mono text-[10px] font-extrabold px-2 py-0.5 rounded ${
                              entry.layer === 'Hardware'
                                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                                : 'bg-[#1C6E46]/12 dark:bg-[#6FCB9F]/15 text-[#1C6E46] dark:text-[#6FCB9F] border border-[#1C6E46]/30 dark:border-[#6FCB9F]/35'
                            }`}
                          >
                            {entry.layer}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#16213A] dark:text-[#E7EBF5]">
                            {entry.action}
                          </div>
                          <div className="font-mono text-[10px] text-[#5F6576] dark:text-[#8E96B0] mt-0.5">
                            {entry.field}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 line-through decoration-amber-400/70">
                              {entry.previousValue}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#5F6576] dark:text-[#8E96B0] shrink-0" />
                            <span className="px-2 py-0.5 rounded bg-[#1C6E46]/12 dark:bg-[#6FCB9F]/15 text-[#1C6E46] dark:text-[#6FCB9F] border border-[#1C6E46]/30 dark:border-[#6FCB9F]/35 font-bold">
                              {entry.newValue}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[11px] text-[#4A5568] dark:text-[#A4ADC6] whitespace-nowrap">
                          {entry.actor}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
