import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  Link2,
  Mail,
  Server,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { SERVER_TIERS } from '../data/spentaManifest';
import { DEPLOYMENT_PROFILES, DEPLOYMENT_TARGET_ORDER } from '../data/deploymentProfiles';
import { useStack } from '../store/StackContext';
import { copyTextWithFallback } from '../utils/shareUrlCodec';

export function StackComposerDrawer() {
  const {
    drawerOpen,
    setDrawerOpen,
    selectedApps,
    toggleApp,
    clearStack,
    stackMetrics,
    exportStackJson,
    buildExecutiveBrief,
    buildMailtoHref,
    buildShareUrl,
    setActiveTab,
    deploymentTarget,
    deploymentProfile,
    setDeploymentTarget,
  } = useStack();

  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, setDrawerOpen]);

  if (!drawerOpen) return null;

  const tierSpec = SERVER_TIERS[stackMetrics.tier];

  const handleCopyBrief = async () => {
    const ok = await copyTextWithFallback(buildExecutiveBrief());
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleCopyShareLink = async () => {
    const ok = await copyTextWithFallback(buildShareUrl());
    if (ok) {
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2200);
    }
  };

  const handleOpenProposalForm = () => {
    setDrawerOpen(false);
    setActiveTab('Resources');
    window.setTimeout(() => {
      const formEl = document.getElementById('spenta-proposal-form');
      formEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end no-print"
      role="dialog"
      aria-modal="true"
      aria-label="Stack Composer Drawer"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0B1020]/70 backdrop-blur-xs transition-opacity"
        onClick={() => setDrawerOpen(false)}
      />

      {/* Slide-over Panel */}
      <aside className="relative z-10 w-full sm:max-w-[430px] bg-[#FAF8F4] dark:bg-[#0F1529] h-full shadow-2xl border-l border-[#E4DFD6] dark:border-[#232B4A] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-[#16213A] dark:bg-[#0B1020] text-[#E7EBF5] border-b border-[#263557] dark:border-[#232B4A] flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base tracking-tight">Stack Composer</h2>
              <span className="font-mono text-xs bg-[#6FCB9F]/15 border border-[#6FCB9F]/35 text-[#6FCB9F] px-2 py-0.5 rounded font-semibold tabular-nums">
                {selectedApps.length} / 13
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#A8B4D4] mt-0.5">
              {deploymentProfile.shortLabel} · {deploymentProfile.latencyBudget} · 0.88 OPA Gate
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-lg text-[#A8B4D4] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Stack Composer"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Synced Infrastructure Target Configuration */}
          <div className="rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[#5F6576] dark:text-[#8E96B0]">
              <span className="font-bold uppercase tracking-wider">Infrastructure Target</span>
              <span className="text-[#1C6E46] dark:text-[#6FCB9F] font-semibold">
                {deploymentProfile.latencyBudget}
              </span>
            </div>
            <div
              role="group"
              aria-label="Stack Composer deployment target"
              className="grid grid-cols-3 gap-1"
            >
              {DEPLOYMENT_TARGET_ORDER.map((tid) => {
                const prof = DEPLOYMENT_PROFILES[tid];
                const active = deploymentTarget === tid;
                return (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => setDeploymentTarget(tid, 'Stack Composer')}
                    aria-pressed={active}
                    className={`min-h-[36px] px-2 py-1.5 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                        : 'bg-[#FAF8F4] dark:bg-[#0B1020] text-[#4A5163] dark:text-[#C8D0E4] border border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1F3863] dark:hover:border-[#8FA6E8]'
                    }`}
                  >
                    {prof.switcherLabel}
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0] leading-snug">
              {deploymentProfile.enclaveBoundary}
            </div>
          </div>

          {/* Active Sovereign Layers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5F6576] dark:text-[#8E96B0]">
                Activated Sovereign Core Layers
              </span>
              {selectedApps.length > 0 && (
                <button
                  type="button"
                  onClick={clearStack}
                  className="inline-flex items-center gap-1 text-xs text-[#5F6576] dark:text-[#8E96B0] hover:text-[#E11D48] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {(['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] as const).map((layer) => {
                const active = stackMetrics.activeLayers.has(layer);
                return (
                  <div
                    key={layer}
                    className={`py-1.5 rounded text-center font-mono text-xs font-bold border ${
                      active
                        ? 'bg-[#1C6E46]/12 dark:bg-[#6FCB9F]/15 text-[#1C6E46] dark:text-[#6FCB9F] border-[#1C6E46]/40 dark:border-[#6FCB9F]/40'
                        : 'bg-white dark:bg-[#141A32] text-[#9AA1B2] dark:text-[#556082] border-[#E4DFD6] dark:border-[#232B4A]'
                    }`}
                  >
                    {layer}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Modules */}
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5F6576] dark:text-[#8E96B0] mb-2">
              Selected Composable Modules
            </div>
            {selectedApps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#CFC8BC] dark:border-[#333F69] bg-white dark:bg-[#141A32] p-5 text-center">
                <p className="text-sm font-medium text-[#16213A] dark:text-[#E7EBF5]">
                  No modules selected yet
                </p>
                <p className="text-xs text-[#5F6576] dark:text-[#8E96B0] mt-1">
                  Select modules in the Architecture Matrix or Catalog Grid, or load a 1-click starter recipe.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-start justify-between gap-2 rounded-lg bg-white dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#16213A] dark:text-[#E7EBF5] leading-snug">
                        {app.shortName}
                      </div>
                      <div className="text-[11px] font-mono text-[#4A5163] dark:text-[#C8D0E4] mt-0.5 tabular-nums">
                        ${(app.setupUsd / 1000).toFixed(1)}K
                        {app.billingCadence === 'quarterly-retainer' ? '/qtr' : ''} · {app.gmPct.toFixed(1)}% GM · Tier{' '}
                        {app.minServerTier}
                      </div>
                      <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0] mt-0.5 truncate">
                        {app.proofClient}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleApp(app.id)}
                      className="p-1.5 text-[#5F6576] dark:text-[#8E96B0] hover:text-[#E11D48] rounded transition-colors cursor-pointer shrink-0"
                      title={`Remove ${app.shortName}`}
                      aria-label={`Remove ${app.shortName}`}
                    >
                      <X className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verified Native Synergies */}
          {stackMetrics.synergyPairs.length > 0 && (
            <div className="rounded-xl bg-white dark:bg-[#141A32] border border-[#1C6E46]/30 dark:border-[#6FCB9F]/30 p-3.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#1C6E46] dark:text-[#6FCB9F] mb-2">
                <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Verified Native Integrations ({stackMetrics.synergyPairs.length})</span>
              </div>
              <div className="space-y-1">
                {stackMetrics.synergyPairs.slice(0, 8).map(([a, b]) => (
                  <div
                    key={`${a}-${b}`}
                    className="text-xs font-mono text-[#16213A] dark:text-[#E7EBF5] bg-[#FAF8F4] dark:bg-[#0B1020] px-2.5 py-1 rounded border border-[#E4DFD6] dark:border-[#232B4A]"
                  >
                    {a} ↔ {b}
                  </div>
                ))}
                {stackMetrics.synergyPairs.length > 8 && (
                  <div className="text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0] pt-1">
                    +{stackMetrics.synergyPairs.length - 8} additional verified connectors
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommended Sovereign Hardware */}
          {selectedApps.length > 0 && (
            <div className="rounded-xl bg-[#16213A] dark:bg-[#0B1020] border border-[#1C6E46]/50 dark:border-[#6FCB9F]/35 text-[#E7EBF5] p-4">
              <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[#6FCB9F] mb-1">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <Server className="w-3.5 h-3.5" strokeWidth={1.5} />
                  TARGET: {deploymentProfile.switcherLabel.toUpperCase()} · {tierSpec.code}
                </span>
                <span>{tierSpec.speed}</span>
              </div>
              <div className="text-sm font-bold text-white">
                {tierSpec.code} — {tierSpec.name}
              </div>
              <div className="text-xs text-[#C8D0E4] mt-1 leading-relaxed">
                {tierSpec.hardware} · {tierSpec.vramRam}
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-[#F5C57B]">Est. CapEx: {tierSpec.capex}</span>
                {stackMetrics.escalatedByCount && (
                  <span className="text-[10px] text-[#F5C57B]">Auto-scaled (6+ apps)</span>
                )}
              </div>
            </div>
          )}

          {/* Commercial Summary (Strictly Separated Build vs. Retainers + Revenue-Weighted GM) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A] p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#5F6576] dark:text-[#8E96B0]">
                One-Time Build CapEx
              </div>
              <div className="font-mono text-xl font-bold text-[#16213A] dark:text-[#E7EBF5] mt-0.5 tabular-nums">
                ${(stackMetrics.oneTimeBuildUsd / 1000).toFixed(1)}K
              </div>
              {stackMetrics.quarterlyRetainerUsd > 0 ? (
                <div className="text-[10px] font-mono text-[#0D9488] dark:text-[#6FCB9F] mt-0.5 tabular-nums">
                  + ${(stackMetrics.quarterlyRetainerUsd / 1000).toFixed(1)}K/qtr ($
                  {(stackMetrics.annualizedRetainerUsd / 1000).toFixed(1)}K/yr)
                </div>
              ) : (
                <div className="text-[10px] font-mono text-[#5F6576] dark:text-[#8E96B0] mt-0.5">
                  No quarterly retainers selected
                </div>
              )}
            </div>
            <div className="rounded-xl bg-white dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A] p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#5F6576] dark:text-[#8E96B0]">
                Rev-Weighted GM (Y1)
              </div>
              <div className="font-mono text-xl font-bold text-[#1C6E46] dark:text-[#6FCB9F] mt-0.5 tabular-nums">
                {stackMetrics.blendedGmPct.toFixed(1)}%
              </div>
              <div className="text-[10px] font-mono text-[#5F6576] dark:text-[#8E96B0] mt-0.5 tabular-nums">
                Y1 Contract: ${(stackMetrics.year1ContractUsd / 1000).toFixed(1)}K
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="p-4 border-t border-[#E4DFD6] dark:border-[#232B4A] bg-[#F2EFE9] dark:bg-[#0B1020] space-y-2.5 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              disabled={selectedApps.length === 0}
              onClick={handleOpenProposalForm}
              className="w-full min-h-[42px] flex items-center justify-center gap-2 bg-[#E11D48] hover:bg-[#BE123C] disabled:bg-[#CFC8BC] dark:disabled:bg-[#232B4A] disabled:cursor-not-allowed text-white py-2.5 px-3.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Request Proposal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleCopyShareLink}
              className="w-full min-h-[42px] flex items-center justify-center gap-1.5 bg-[#1F3863] hover:bg-[#162848] dark:bg-[#8FA6E8] dark:hover:bg-[#A6B9F0] text-white dark:text-[#0B1020] py-2.5 px-3.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              {linkCopied ? (
                <Check className="w-3.5 h-3.5" strokeWidth={2} />
              ) : (
                <Link2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              )}
              <span>{linkCopied ? 'Link Copied' : 'Copy Share Link'}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={selectedApps.length === 0}
              onClick={() => exportStackJson()}
              className="min-h-[38px] flex items-center justify-center gap-1.5 bg-white dark:bg-[#141A32] hover:border-[#1F3863] dark:hover:border-[#8FA6E8] disabled:opacity-50 text-[#16213A] dark:text-[#E7EBF5] border border-[#E4DFD6] dark:border-[#232B4A] py-2 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>JSON</span>
            </button>

            <button
              type="button"
              disabled={selectedApps.length === 0}
              onClick={handleCopyBrief}
              className="min-h-[38px] flex items-center justify-center gap-1.5 bg-white dark:bg-[#141A32] hover:border-[#1F3863] dark:hover:border-[#8FA6E8] disabled:opacity-50 text-[#16213A] dark:text-[#E7EBF5] border border-[#E4DFD6] dark:border-[#232B4A] py-2 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" />
              ) : (
                <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
              )}
              <span>{copied ? 'Copied' : 'Brief'}</span>
            </button>

            <a
              href={selectedApps.length > 0 ? buildMailtoHref() : undefined}
              onClick={(e) => {
                if (selectedApps.length === 0) e.preventDefault();
              }}
              className={`min-h-[38px] flex items-center justify-center gap-1.5 bg-white dark:bg-[#141A32] hover:border-[#1F3863] dark:hover:border-[#8FA6E8] text-[#16213A] dark:text-[#E7EBF5] border border-[#E4DFD6] dark:border-[#232B4A] py-2 px-2.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedApps.length === 0 ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Email</span>
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
