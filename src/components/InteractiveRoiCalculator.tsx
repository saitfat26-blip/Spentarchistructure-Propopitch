import React, { useMemo, useState } from 'react';
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
  Calculator,
  Download,
  ExternalLink,
  Globe2,
  Loader2,
  Printer,
  Server,
  ShieldCheck,
  Split,
} from 'lucide-react';
import { SERVER_TIERS, SPENTA_APPS, ServerTierId } from '../data/spentaManifest';
import { PRODUCT_ROI_PROFILES, computeProductRoi } from '../data/roiModel';
import {
  GROWTH_MODE_SPECS,
  GrowthMode,
  ROI_CONFIDENCE_EVIDENCE_NOTE,
} from '../data/spentaEnrichments';
import { useStack } from '../store/StackContext';
import { downloadSerializedPrintDeckPdf } from '../utils/exportPitchDeckPdf';

export interface SearchGroundingResult {
  text: string;
  sources: Array<{ title: string; uri: string; domain?: string }>;
  searchQueries: string[];
}

export interface SharedSearchBenchmarkState {
  loading: boolean;
  error: string | null;
  data: SearchGroundingResult | null;
  subject: string;
}

export interface BenchmarkVerifyPayload {
  query: string;
  subject: string;
  context?: {
    productName?: string;
    modeledRoiPct?: number;
    paybackMonths?: number;
    spentaThreeYrTcoUsd?: number;
    westernThreeYrTcoUsd?: number;
  };
}

export interface InteractiveRoiCalculatorProps {
  initialAppId?: string;
  sharedBenchmark?: SharedSearchBenchmarkState;
  onVerifyBenchmarks?: (payload: BenchmarkVerifyPayload) => Promise<void>;
  growthMode?: GrowthMode;
  onChangeGrowthMode?: (mode: GrowthMode) => void;
}

type StreamFilter = 'all' | 'builds' | 'retainers';

function formatUsd(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
  if (Math.abs(amount) >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${Math.round(amount).toLocaleString()}`;
}

function renderMarkdownLines(text: string) {
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  return (
    <div className="space-y-2 text-xs leading-relaxed text-[#334155] dark:text-[#C8D0E4]">
      {lines.map((raw, idx) => {
        const cleaned = raw.replace(/^[-*•]\s*/, '').trim();
        const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
        const isBullet = /^[-*•]\s/.test(raw.trim());
        return (
          <p key={idx} className={isBullet ? 'pl-3 relative' : ''}>
            {isBullet && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 text-[#1C6E46] dark:text-[#6FCB9F] font-bold"
              >
                ·
              </span>
            )}
            {parts.map((part, pIdx) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={pIdx} className="font-semibold text-[#16213A] dark:text-[#E7EBF5]">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <React.Fragment key={pIdx}>{part}</React.Fragment>
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}

export function InteractiveRoiCalculator({
  initialAppId,
  sharedBenchmark,
  onVerifyBenchmarks,
  growthMode: controlledGrowthMode,
  onChangeGrowthMode,
}: InteractiveRoiCalculatorProps) {
  const { theme, selectedApps, stackMetrics, toggleApp, selectedIds } = useStack();
  const isDark = theme === 'dark';

  const [localGrowthMode, setLocalGrowthMode] = useState<GrowthMode>('conservative');
  const growthMode = controlledGrowthMode ?? localGrowthMode;
  const setGrowthMode = (next: GrowthMode) => {
    if (onChangeGrowthMode) onChangeGrowthMode(next);
    else setLocalGrowthMode(next);
  };
  const activeGrowthSpec = GROWTH_MODE_SPECS[growthMode];

  const [mode, setMode] = useState<'single' | 'stack'>('single');
  const [activeAppId, setActiveAppId] = useState<string>(initialAppId || SPENTA_APPS[0].id);
  const [scaleMap, setScaleMap] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      SPENTA_APPS.map((a) => [a.id, PRODUCT_ROI_PROFILES[a.id]?.driver.defaultValue ?? 50]),
    ),
  );
  const [serverTierOverride, setServerTierOverride] = useState<ServerTierId | null>(null);
  const [includeHardware, setIncludeHardware] = useState<boolean>(true);

  // Separate Build vs. Retainers & Revenue-Weighted GM controls
  const [separateBuildAndRetainers, setSeparateBuildAndRetainers] = useState<boolean>(true);
  const [streamFilter, setStreamFilter] = useState<StreamFilter>('all');
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);

  // Local fallback Google Search state when rendered outside FinancialsView
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localData, setLocalData] = useState<SearchGroundingResult | null>(null);
  const [localSubject, setLocalSubject] = useState<string>('');

  const benchmarkLoading = sharedBenchmark ? sharedBenchmark.loading : localLoading;
  const benchmarkError = sharedBenchmark ? sharedBenchmark.error : localError;
  const benchmarkData = sharedBenchmark ? sharedBenchmark.data : localData;
  const benchmarkSubject = sharedBenchmark ? sharedBenchmark.subject : localSubject;

  const activeApp = useMemo(
    () => SPENTA_APPS.find((a) => a.id === activeAppId) ?? SPENTA_APPS[0],
    [activeAppId],
  );
  const activeProfile = PRODUCT_ROI_PROFILES[activeApp.id];
  const currentScale = scaleMap[activeApp.id] ?? activeProfile.driver.defaultValue;
  const effectiveTier: ServerTierId =
    mode === 'stack'
      ? serverTierOverride ?? stackMetrics.tier
      : serverTierOverride ?? activeApp.minServerTier;

  // Unified calculation with strict Build vs. Retainer separation + Revenue-Weighted GM%
  const activeMetrics = useMemo(() => {
    const apps =
      mode === 'stack'
        ? selectedApps.length > 0
          ? selectedApps
          : [SPENTA_APPS[0]]
        : [activeApp];

    const tierCapex =
      includeHardware && streamFilter !== 'retainers' ? SERVER_TIERS[effectiveTier].capexMidUsd : 0;

    let oneTimeBuildUsd = 0;
    let buildWeightedProfitY1 = 0;
    let quarterlyRetainerUsd = 0;
    let retainerAnnualizedUsd = 0;
    let retainerWeightedProfitY1 = 0;
    let saasArrAnnualUsd = 0;
    let saasWeightedProfitY1 = 0;
    let year1ClientValueUsd = 0;
    let western3YrTcoUsd = 0;
    let grossProfit3Yr = 0;
    let unweightedGmSum = 0;
    let unweightedCount = 0;

    apps.forEach((app) => {
      const r = computeProductRoi(app.id, scaleMap[app.id], effectiveTier, false);
      const prof = PRODUCT_ROI_PROFILES[app.id];
      const isRetainerApp = app.billingCadence === 'quarterly-retainer';

      const includeBuildStream = streamFilter !== 'retainers';
      const includeRecurringStream = streamFilter !== 'builds';

      const appBuildUsd = includeBuildStream ? r.oneTimeBuildUsd : 0;
      const appRetainerQtr = includeRecurringStream && isRetainerApp ? app.setupUsd : 0;
      const appRetainerAnnual = includeRecurringStream && isRetainerApp ? r.annualRecurringUsd : 0;
      const appSaasAnnual = includeRecurringStream && !isRetainerApp ? r.annualRecurringUsd : 0;

      oneTimeBuildUsd += appBuildUsd;
      buildWeightedProfitY1 += appBuildUsd * (app.gmPct / 100);

      quarterlyRetainerUsd += appRetainerQtr;
      retainerAnnualizedUsd += appRetainerAnnual;
      retainerWeightedProfitY1 += appRetainerAnnual * (app.gmPct / 100);

      saasArrAnnualUsd += appSaasAnnual;
      saasWeightedProfitY1 += appSaasAnnual * ((prof?.recurringGmPct ?? app.gmPct) / 100);

      const appActiveY1Spend = appBuildUsd + appRetainerAnnual + appSaasAnnual;
      const appFullY1Spend = r.oneTimeBuildUsd + r.annualRecurringUsd;
      const valueRatio =
        streamFilter === 'all'
          ? 1
          : appFullY1Spend > 0
            ? Math.min(1, appActiveY1Spend / appFullY1Spend)
            : 0;

      year1ClientValueUsd += r.year1ClientValueUsd * valueRatio;
      western3YrTcoUsd += r.western3YrTcoUsd * valueRatio;

      grossProfit3Yr +=
        appBuildUsd * (app.gmPct / 100) +
        appRetainerAnnual * 3 * ((prof?.recurringGmPct ?? app.gmPct) / 100) +
        appSaasAnnual * 3 * ((prof?.recurringGmPct ?? app.gmPct) / 100);

      if (appActiveY1Spend > 0) {
        unweightedGmSum += app.gmPct;
        unweightedCount += 1;
      }
    });

    const totalRecurringAnnualUsd = retainerAnnualizedUsd + saasArrAnnualUsd;
    const year1SpentaContractUsd = oneTimeBuildUsd + totalRecurringAnnualUsd;
    const year1TotalProfit = buildWeightedProfitY1 + retainerWeightedProfitY1 + saasWeightedProfitY1;

    const revenueWeightedY1GmPct =
      year1SpentaContractUsd > 0
        ? Number(((year1TotalProfit / year1SpentaContractUsd) * 100).toFixed(1))
        : 0;
    const unweightedAvgGmPct =
      unweightedCount > 0 ? Number((unweightedGmSum / unweightedCount).toFixed(1)) : 0;
    const buildWeightedGmPct =
      oneTimeBuildUsd > 0 ? Number(((buildWeightedProfitY1 / oneTimeBuildUsd) * 100).toFixed(1)) : 0;
    const recurringWeightedGmPct =
      totalRecurringAnnualUsd > 0
        ? Number(
            (((retainerWeightedProfitY1 + saasWeightedProfitY1) / totalRecurringAnnualUsd) * 100).toFixed(
              1,
            ),
          )
        : 0;

    const growthFactor = activeGrowthSpec.mixMultiplier;
    const scaledYear1ClientValueUsd = Math.round(year1ClientValueUsd * growthFactor);
    const year1ClientInvestmentUsd = year1SpentaContractUsd + tierCapex;
    const year1NetBenefitUsd = scaledYear1ClientValueUsd - year1ClientInvestmentUsd;
    const client12MoRoiPct =
      year1ClientInvestmentUsd > 0
        ? Math.round((year1NetBenefitUsd / year1ClientInvestmentUsd) * 100)
        : 0;
    const paybackMonths =
      scaledYear1ClientValueUsd > 0 && year1ClientInvestmentUsd > 0
        ? Math.max(
            1.2,
            Number((year1ClientInvestmentUsd / (scaledYear1ClientValueUsd / 12)).toFixed(1)),
          )
        : 0;

    // Disciplined 3-to-5-Year Annualized ROI strictly bounded within 25% min – 35% max confidence band
    const rawRatioNorm = Math.min(1, Math.max(0, (revenueWeightedY1GmPct - 30) / 45));
    const disciplinedAnnualRoiPct = Number(
      (
        activeGrowthSpec.targetRoiMinPct +
        rawRatioNorm * (activeGrowthSpec.targetRoiMaxPct - activeGrowthSpec.targetRoiMinPct)
      ).toFixed(1),
    );

    const spenta3YrTcoUsd = oneTimeBuildUsd + tierCapex + totalRecurringAnnualUsd * 3;
    const spenta3YrLtvUsd = oneTimeBuildUsd + totalRecurringAnnualUsd * 3;
    const spenta3YrBlendedGmPct =
      spenta3YrLtvUsd > 0 ? Number(((grossProfit3Yr / spenta3YrLtvUsd) * 100).toFixed(1)) : 0;

    return {
      moduleCount: apps.length,
      oneTimeBuildUsd,
      buildWeightedGmPct,
      quarterlyRetainerUsd,
      retainerAnnualizedUsd,
      saasArrAnnualUsd,
      totalRecurringAnnualUsd,
      recurringWeightedGmPct,
      serverCapexUsd: tierCapex,
      year1SpentaContractUsd,
      year1ClientInvestmentUsd,
      year1ClientValueUsd: scaledYear1ClientValueUsd,
      year1NetBenefitUsd,
      client12MoRoiPct,
      disciplinedAnnualRoiPct,
      paybackMonths,
      spenta3YrTcoUsd,
      western3YrTcoUsd,
      threeYrSavingsUsd: Math.max(0, western3YrTcoUsd - spenta3YrTcoUsd),
      spenta3YrLtvUsd,
      spenta3YrBlendedGmPct,
      revenueWeightedY1GmPct,
      unweightedAvgGmPct,
      gmWeightingDeltaPct: Number((revenueWeightedY1GmPct - unweightedAvgGmPct).toFixed(1)),
    };
  }, [
    mode,
    selectedApps,
    activeApp,
    scaleMap,
    effectiveTier,
    includeHardware,
    streamFilter,
    activeGrowthSpec,
  ]);

  const tcoChartData = useMemo(
    () => [
      {
        label: 'Spenta Sovereign (3-Yr)',
        amountK: Number((activeMetrics.spenta3YrTcoUsd / 1000).toFixed(1)),
        color: isDark ? '#6FCB9F' : '#1C6E46',
      },
      {
        label: 'Western Agency / Cloud (3-Yr)',
        amountK: Number((activeMetrics.western3YrTcoUsd / 1000).toFixed(1)),
        color: isDark ? '#8FA6E8' : '#1F3863',
      },
    ],
    [activeMetrics.spenta3YrTcoUsd, activeMetrics.western3YrTcoUsd, isDark],
  );

  const handleVerifyBenchmarks = async () => {
    const subjectLabel =
      mode === 'stack'
        ? `Composed Stack (${selectedApps.map((a) => a.shortName).join(', ') || activeApp.shortName})`
        : activeApp.name;

    const query =
      mode === 'stack'
        ? `Verify current 2026 enterprise software & on-premises AI ROI, payback period, and 3-year TCO benchmarks for a multi-module stack (${selectedApps
            .map((a) => a.shortName)
            .join(', ')}) compared to Spenta Sovereign OS: One-Time Build ${formatUsd(
            activeMetrics.oneTimeBuildUsd,
          )}, Annual Recurring ${formatUsd(activeMetrics.totalRecurringAnnualUsd)}/yr, Year-1 Revenue-Weighted GM ${
            activeMetrics.revenueWeightedY1GmPct
          }%, modeled 12-month ROI ${activeMetrics.client12MoRoiPct}%, payback ${
            activeMetrics.paybackMonths
          } months, and 3-year TCO ${formatUsd(activeMetrics.spenta3YrTcoUsd)} vs Western equivalent ${formatUsd(
            activeMetrics.western3YrTcoUsd,
          )}.`
        : `Verify 2026 enterprise industry ROI, implementation cost, and payback period benchmarks for ${activeApp.name} (${activeApp.tagline}) compared to Spenta Sovereign OS pricing (${activeApp.setupLabel}, ${activeApp.recurringLabel}, ${activeProfile.driver.label}: ${currentScale} ${activeProfile.driver.unit}, Year-1 Revenue-Weighted GM ${activeMetrics.revenueWeightedY1GmPct}%, modeled 12-month client ROI ${activeMetrics.client12MoRoiPct}%, payback ${activeMetrics.paybackMonths} months, 3-year TCO ${formatUsd(
            activeMetrics.spenta3YrTcoUsd,
          )} vs Western equivalent ${formatUsd(activeMetrics.western3YrTcoUsd)}).`;

    const payload: BenchmarkVerifyPayload = {
      query,
      subject: subjectLabel,
      context: {
        productName: subjectLabel,
        modeledRoiPct: activeMetrics.client12MoRoiPct,
        paybackMonths: activeMetrics.paybackMonths,
        spentaThreeYrTcoUsd: activeMetrics.spenta3YrTcoUsd,
        westernThreeYrTcoUsd: activeMetrics.western3YrTcoUsd,
      },
    };

    if (onVerifyBenchmarks) {
      await onVerifyBenchmarks(payload);
      return;
    }

    setLocalLoading(true);
    setLocalError(null);
    setLocalSubject(subjectLabel);
    try {
      const res = await fetch('/api/gemini/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: payload.query, context: payload.context }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Live benchmark verification failed.');
      }
      setLocalData({
        text: json.text || '',
        sources: Array.isArray(json.sources) ? json.sources : [],
        searchQueries: Array.isArray(json.searchQueries) ? json.searchQueries : [],
      });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to reach benchmark service.');
    } finally {
      setLocalLoading(false);
    }
  };

  const chartTickColor = isDark ? '#8E96B0' : '#5F6576';
  const chartGridColor = isDark ? '#232B4A' : '#E4DFD6';
  const inStack = selectedIds.includes(activeApp.id);

  const modeledApps = useMemo(
    () =>
      mode === 'stack'
        ? selectedApps.length > 0
          ? selectedApps
          : [SPENTA_APPS[0]]
        : [activeApp],
    [mode, selectedApps, activeApp],
  );

  const pdfTitleSubject =
    mode === 'stack'
      ? `Composed Sovereign Stack (${modeledApps.length} Modules)`
      : activeApp.name;

  const tcoReductionPct =
    activeMetrics.western3YrTcoUsd > 0
      ? Math.round(
          ((activeMetrics.western3YrTcoUsd - activeMetrics.spenta3YrTcoUsd) /
            activeMetrics.western3YrTcoUsd) *
            100,
        )
      : 0;

  const handleExportRoiPdf = async () => {
    setExportingPdf(true);
    try {
      const slug = (mode === 'stack' ? 'composed-stack' : activeApp.id).replace(/[^a-z0-9-_]/gi, '-');
      await downloadSerializedPrintDeckPdf({
        containerSelector: '.roi-print-deck',
        filename: `Spenta-ROI-Report-${slug}.pdf`,
      });
    } finally {
      setExportingPdf(false);
    }
  };

  const handlePrintRoiDeck = () => {
    const root = document.documentElement;
    root.classList.add('printing-roi-deck-only');
    const cleanup = () => {
      root.classList.remove('printing-roi-deck-only');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    window.setTimeout(cleanup, 2500);
  };

  return (
    <section className="rounded-xl bg-white dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A] p-5 sm:p-6">
      {/* Header + Mode / Build-vs-Retainer Toggle Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b border-[#E4DFD6] dark:border-[#232B4A]">
        <div>
          <div className="text-xs font-mono text-[#1C6E46] dark:text-[#6FCB9F] font-semibold">
            Evidence-Driven Unit Economics · 13 Sovereign Solutions
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#16213A] dark:text-[#E7EBF5] tracking-tight mt-0.5">
            Interactive ROI Calculator, Payback &amp; 3-Year Sovereign TCO
          </h2>
          <p className="text-xs text-[#5F6576] dark:text-[#8E96B0] mt-1">
            Model bottom-up client ROI with Year-1 revenue-weighted gross margin and explicit one-time build vs. recurring retainer separation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Single vs. Stack Mode */}
          <div className="inline-flex rounded-lg bg-[#F2EFE9] dark:bg-[#0B1020] p-1 border border-[#E4DFD6] dark:border-[#232B4A]">
            <button
              type="button"
              onClick={() => {
                setMode('single');
                setServerTierOverride(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'single'
                  ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                  : 'text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
              }`}
            >
              Single Solution
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('stack');
                setServerTierOverride(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'stack'
                  ? 'bg-[#1C6E46] text-white dark:bg-[#6FCB9F] dark:text-[#0B1020]'
                  : 'text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
              }`}
            >
              Active Stack ({selectedApps.length})
            </button>
          </div>

          {/* Separate Build vs. Retainers Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={separateBuildAndRetainers}
            onClick={() => setSeparateBuildAndRetainers((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              separateBuildAndRetainers
                ? 'bg-[#1C6E46]/10 dark:bg-[#6FCB9F]/15 border-[#1C6E46]/40 dark:border-[#6FCB9F]/40 text-[#1C6E46] dark:text-[#6FCB9F]'
                : 'bg-[#FAF8F4] dark:bg-[#0B1020] border-[#E4DFD6] dark:border-[#232B4A] text-[#5F6576] dark:text-[#8E96B0]'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>
              {separateBuildAndRetainers
                ? 'Build vs. Retainers: Separated'
                : 'Build vs. Retainers: Combined Y1'}
            </span>
          </button>

          {/* Export Formatted ROI PDF (using print-deck CSS conventions) */}
          <button
            type="button"
            disabled={exportingPdf}
            onClick={handleExportRoiPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1C6E46] hover:bg-[#175B3A] dark:bg-[#6FCB9F] dark:hover:bg-[#5EC092] text-white dark:text-[#0B1020] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 cursor-pointer"
          >
            {exportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{exportingPdf ? 'Exporting…' : 'Export ROI PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintRoiDeck}
            aria-label="Print ROI report"
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0B1020] hover:border-[#1F3863] text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Disciplined Growth Mode Toggle (Conservative 25% Floor vs Aggressive Growth 35% Cap) + Highlighted Confidence & Evidence Note */}
      <div className="mt-5 rounded-xl border border-[#1C6E46]/35 dark:border-[#6FCB9F]/35 bg-[#1C6E46]/[0.06] dark:bg-[#6FCB9F]/[0.07] p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#1C6E46] dark:text-[#6FCB9F]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{ROI_CONFIDENCE_EVIDENCE_NOTE.title}</span>
            </div>
            <p className="text-xs text-[#334155] dark:text-[#C8D0E4] mt-1 leading-relaxed">
              {ROI_CONFIDENCE_EVIDENCE_NOTE.lead}
            </p>
          </div>

          <div
            role="group"
            aria-label="Disciplined ROI Growth Mode"
            className="inline-flex rounded-lg bg-white dark:bg-[#0B1020] p-1 border border-[#E4DFD6] dark:border-[#232B4A] self-start lg:self-auto shrink-0"
          >
            <button
              type="button"
              onClick={() => setGrowthMode('conservative')}
              aria-pressed={growthMode === 'conservative'}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                growthMode === 'conservative'
                  ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                  : 'text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
              }`}
            >
              Conservative (25% ROI Floor)
            </button>
            <button
              type="button"
              onClick={() => setGrowthMode('aggressive')}
              aria-pressed={growthMode === 'aggressive'}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                growthMode === 'aggressive'
                  ? 'bg-[#1C6E46] text-white dark:bg-[#6FCB9F] dark:text-[#0B1020]'
                  : 'text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
              }`}
            >
              Aggressive Growth (35% ROI Cap)
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#1C6E46]/20 dark:border-[#6FCB9F]/20 text-xs font-mono tabular-nums">
          <span className="text-[#16213A] dark:text-[#E7EBF5] font-semibold">
            Active Posture: {activeGrowthSpec.confidenceBadge}
          </span>
          <span className="text-[#1C6E46] dark:text-[#6FCB9F] font-bold">
            Disciplined 3–5 Yr Annualized ROI on Total Investment: {activeMetrics.disciplinedAnnualRoiPct.toFixed(1)}% (Band: 25%–35%)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 pt-1">
          {ROI_CONFIDENCE_EVIDENCE_NOTE.pillars.map((pillar) => (
            <div
              key={pillar.label}
              className="rounded-lg bg-white/85 dark:bg-[#0F1529]/85 border border-[#E4DFD6] dark:border-[#232B4A] p-2.5"
            >
              <div className="text-[11px] font-bold text-[#16213A] dark:text-[#E7EBF5]">
                {pillar.label}
              </div>
              <p className="text-[11px] text-[#4A5568] dark:text-[#A4ADC6] mt-0.5 leading-relaxed">
                {pillar.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main 2-column split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
        {/* Left Controls */}
        <div className="lg:col-span-5 space-y-5">
          {mode === 'single' ? (
            <>
              <div>
                <label
                  htmlFor="roi-product-select"
                  className="block text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] mb-1.5"
                >
                  Digital Solution (13 Composable Modules)
                </label>
                <select
                  id="roi-product-select"
                  value={activeApp.id}
                  onChange={(e) => {
                    setActiveAppId(e.target.value);
                    setServerTierOverride(null);
                  }}
                  className="w-full rounded-lg bg-[#FAF8F4] dark:bg-[#0B1020] border border-[#E4DFD6] dark:border-[#232B4A] px-3 py-2.5 text-sm font-semibold text-[#16213A] dark:text-[#E7EBF5] focus:outline-none focus:border-[#1C6E46] dark:focus:border-[#6FCB9F]"
                >
                  {SPENTA_APPS.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.shortName} — {app.setupLabel} ({app.gmPct.toFixed(1)}% GM)
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between gap-2 mt-2 text-xs text-[#5F6576] dark:text-[#8E96B0]">
                  <span>
                    {activeApp.category} ·{' '}
                    {activeApp.billingCadence === 'quarterly-retainer'
                      ? 'Quarterly Retainer'
                      : 'One-Time Build + ARR'}{' '}
                    · Proof: {activeApp.proofClient}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleApp(activeApp.id)}
                    className="text-xs font-semibold text-[#1C6E46] dark:text-[#6FCB9F] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {inStack ? 'In Stack ✓' : '+ Add to Stack'}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E4DFD6] dark:border-[#232B4A]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#16213A] dark:text-[#E7EBF5]">
                    {activeProfile.driver.label}
                  </span>
                  <span className="font-mono font-bold text-[#1C6E46] dark:text-[#6FCB9F] tabular-nums">
                    {currentScale} {activeProfile.driver.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={activeProfile.driver.min}
                  max={activeProfile.driver.max}
                  step={activeProfile.driver.step}
                  value={currentScale}
                  onChange={(e) =>
                    setScaleMap((prev) => ({
                      ...prev,
                      [activeApp.id]: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-[#1C6E46] dark:accent-[#6FCB9F] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0] mt-1 tabular-nums">
                  <span>
                    {activeProfile.driver.min} {activeProfile.driver.unit}
                  </span>
                  <span>
                    Default: {activeProfile.driver.defaultValue} {activeProfile.driver.unit}
                  </span>
                  <span>
                    {activeProfile.driver.max} {activeProfile.driver.unit}
                  </span>
                </div>
                <p className="text-xs text-[#5F6576] dark:text-[#8E96B0] mt-2 leading-relaxed">
                  {activeProfile.driver.description}
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5]">
                  Composed Sovereign Stack Modules ({selectedApps.length})
                </span>
                <span className="font-mono text-xs text-[#1C6E46] dark:text-[#6FCB9F] tabular-nums">
                  Shared {SERVER_TIERS[effectiveTier].code}
                </span>
              </div>
              {selectedApps.length === 0 ? (
                <p className="text-xs text-[#5F6576] dark:text-[#8E96B0]">
                  No modules in Stack Composer yet—defaulting preview to AI Healthcare ERP. Add modules from the margin matrix to model a multi-app stack.
                </p>
              ) : (
                <div className="divide-y divide-[#EFEBE3] dark:divide-[#1E2642] border-y border-[#E4DFD6] dark:border-[#232B4A]">
                  {selectedApps.map((app) => {
                    const prof = PRODUCT_ROI_PROFILES[app.id];
                    const val = scaleMap[app.id] ?? prof.driver.defaultValue;
                    return (
                      <div key={app.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <div className="font-semibold text-[#16213A] dark:text-[#E7EBF5] truncate">
                            {app.shortName}
                          </div>
                          <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0] font-mono tabular-nums">
                            {app.setupLabel} · {app.gmPct.toFixed(1)}% GM · {val} {prof.driver.unit}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAppId(app.id);
                            setMode('single');
                          }}
                          className="text-[11px] font-semibold text-[#1F3863] dark:text-[#8FA6E8] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Tune scale
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Billing Stream Filter (Builds vs. Retainers/ARR) */}
          <div className="pt-4 border-t border-[#E4DFD6] dark:border-[#232B4A] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#16213A] dark:text-[#E7EBF5]">
                Contract Stream Scope
              </span>
              <span className="font-mono text-[11px] text-[#5F6576] dark:text-[#8E96B0]">
                Isolate CapEx vs. Annuity
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'all', label: 'All Streams' },
                  { id: 'builds', label: 'Builds Only' },
                  { id: 'retainers', label: 'Retainers & ARR' },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setStreamFilter(id)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    streamFilter === id
                      ? 'bg-[#1F3863] text-white border-[#1F3863] dark:bg-[#8FA6E8] dark:text-[#0B1020] dark:border-[#8FA6E8]'
                      : 'bg-[#FAF8F4] dark:bg-[#0B1020] text-[#4A5568] dark:text-[#C8D0E4] border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1C6E46]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Sovereign Server Tier & Hardware CapEx Controls */}
          <div className="pt-4 border-t border-[#E4DFD6] dark:border-[#232B4A] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5]">
                <Server className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" />
                <span>On-Premises Server PC Tier</span>
              </span>
              <label className="inline-flex items-center gap-1.5 text-xs text-[#5F6576] dark:text-[#8E96B0] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHardware}
                  onChange={(e) => setIncludeHardware(e.target.checked)}
                  className="accent-[#1C6E46] dark:accent-[#6FCB9F]"
                />
                <span>Include CapEx</span>
              </label>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {([4, 3, 2, 1] as ServerTierId[]).map((tid) => {
                const tier = SERVER_TIERS[tid];
                const active = effectiveTier === tid;
                return (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => setServerTierOverride(tid)}
                    className={`px-2 py-2 rounded-lg border text-center transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#1F3863] text-white border-[#1F3863] dark:bg-[#8FA6E8] dark:text-[#0B1020] dark:border-[#8FA6E8]'
                        : 'bg-[#FAF8F4] dark:bg-[#0B1020] text-[#16213A] dark:text-[#E7EBF5] border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1F3863]/50'
                    }`}
                  >
                    <div className="font-mono text-[11px] font-bold">{tier.code}</div>
                    <div className="font-mono text-[10px] opacity-85 tabular-nums">
                      {formatUsd(tier.capexMidUsd)}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0]">
              {SERVER_TIERS[effectiveTier].name} · {SERVER_TIERS[effectiveTier].capex} (
              {SERVER_TIERS[effectiveTier].speed})
            </div>
          </div>

          {/* Adjacent Proof Evidence */}
          <div className="pt-4 border-t border-[#E4DFD6] dark:border-[#232B4A] space-y-1.5">
            <div className="text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5]">
              Evidence Basis &amp; Value Mechanism
            </div>
            <p className="text-xs text-[#4A5568] dark:text-[#C8D0E4] leading-relaxed">
              {mode === 'stack'
                ? 'Multi-module Sovereign OS deployments amortize one shared on-prem server tier and L5 OPA governance bus across every selected vertical module.'
                : activeProfile.evidenceBasis}
            </p>
            {mode === 'single' && (
              <p className="text-xs text-[#5F6576] dark:text-[#8E96B0] leading-relaxed">
                {activeProfile.valueMechanism}
              </p>
            )}
          </div>
        </div>

        {/* Right Computed KPIs + Build vs Retainer Ledger + 3-Yr TCO Chart + Google Search Verification */}
        <div className="lg:col-span-7 space-y-5">
          {/* 4 Key ROI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-[#FAF8F4] dark:bg-[#0B1020] border border-[#E4DFD6] dark:border-[#232B4A] p-3.5">
              <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0]">Client 12-Mo ROI</div>
              <div className="font-mono text-2xl font-bold text-[#1C6E46] dark:text-[#6FCB9F] mt-1 tabular-nums">
                {activeMetrics.client12MoRoiPct}%
              </div>
              <div className="text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0] mt-0.5 tabular-nums">
                Net {activeMetrics.year1NetBenefitUsd >= 0 ? '+' : ''}
                {formatUsd(activeMetrics.year1NetBenefitUsd)}
              </div>
            </div>

            <div className="rounded-lg bg-[#FAF8F4] dark:bg-[#0B1020] border border-[#E4DFD6] dark:border-[#232B4A] p-3.5">
              <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0]">Payback Period</div>
              <div className="font-mono text-2xl font-bold text-[#16213A] dark:text-[#E7EBF5] mt-1 tabular-nums">
                {activeMetrics.paybackMonths > 0 ? `${activeMetrics.paybackMonths} mo` : '—'}
              </div>
              <div className="text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0] mt-0.5 tabular-nums">
                Y1 Spend {formatUsd(activeMetrics.year1ClientInvestmentUsd)}
              </div>
            </div>

            <div className="rounded-lg bg-[#FAF8F4] dark:bg-[#0B1020] border border-[#E4DFD6] dark:border-[#232B4A] p-3.5">
              <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0]">
                Rev-Weighted GM (Y1)
              </div>
              <div className="font-mono text-2xl font-bold text-[#1C6E46] dark:text-[#6FCB9F] mt-1 tabular-nums">
                {activeMetrics.revenueWeightedY1GmPct.toFixed(1)}%
              </div>
              <div className="text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0] mt-0.5 tabular-nums">
                {activeMetrics.gmWeightingDeltaPct >= 0 ? '+' : ''}
                {activeMetrics.gmWeightingDeltaPct.toFixed(1)} pts vs flat avg
              </div>
            </div>

            <div className="rounded-lg bg-[#FAF8F4] dark:bg-[#0B1020] border border-[#E4DFD6] dark:border-[#232B4A] p-3.5">
              <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0]">Spenta 3-Yr LTV</div>
              <div className="font-mono text-2xl font-bold text-[#1F3863] dark:text-[#8FA6E8] mt-1 tabular-nums">
                {formatUsd(activeMetrics.spenta3YrLtvUsd)}
              </div>
              <div className="text-[11px] font-mono text-[#1C6E46] dark:text-[#6FCB9F] mt-0.5 tabular-nums">
                {activeMetrics.spenta3YrBlendedGmPct}% 3-Yr Wtd GM
              </div>
            </div>
          </div>

          {/* Separated vs. Combined Build / Retainer / Hardware Commercial Ledger */}
          <div className="rounded-lg bg-[#FAF8F4] dark:bg-[#0B1020] border border-[#E4DFD6] dark:border-[#232B4A] p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#16213A] dark:text-[#E7EBF5]">
                {separateBuildAndRetainers
                  ? 'Reconciled Build vs. Retainer Ledger (Year-1 Revenue-Weighted GM)'
                  : 'Combined Year-1 Commercial Summary'}
              </span>
              <span className="font-mono text-[11px] text-[#5F6576] dark:text-[#8E96B0] tabular-nums">
                Formula: Σ(Y1 USD × GM%) ÷ Σ(Y1 USD)
              </span>
            </div>

            {separateBuildAndRetainers ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs font-mono tabular-nums">
                <div className="border-t border-[#E4DFD6] dark:border-[#232B4A] pt-2">
                  <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0]">
                    One-Time Build CapEx
                  </div>
                  <div className="font-bold text-sm text-[#16213A] dark:text-[#E7EBF5] mt-0.5">
                    {formatUsd(activeMetrics.oneTimeBuildUsd)}
                  </div>
                  <div className="text-[10px] text-[#5F6576] dark:text-[#8E96B0]">
                    {activeMetrics.oneTimeBuildUsd > 0
                      ? `${activeMetrics.buildWeightedGmPct.toFixed(1)}% Build Wtd GM`
                      : 'No build CapEx'}
                  </div>
                </div>

                <div className="border-t border-[#E4DFD6] dark:border-[#232B4A] pt-2">
                  <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0]">
                    Quarterly Retainers
                  </div>
                  <div className="font-bold text-sm text-[#0D9488] dark:text-[#38BDF8] mt-0.5">
                    {activeMetrics.quarterlyRetainerUsd > 0
                      ? `${formatUsd(activeMetrics.quarterlyRetainerUsd)}/qtr`
                      : '$0/qtr'}
                  </div>
                  <div className="text-[10px] text-[#5F6576] dark:text-[#8E96B0]">
                    {formatUsd(activeMetrics.retainerAnnualizedUsd)}/yr annualized
                  </div>
                </div>

                <div className="border-t border-[#E4DFD6] dark:border-[#232B4A] pt-2">
                  <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0]">
                    Sovereign SaaS ARR
                  </div>
                  <div className="font-bold text-sm text-[#1C6E46] dark:text-[#6FCB9F] mt-0.5">
                    {formatUsd(activeMetrics.saasArrAnnualUsd)}/yr
                  </div>
                  <div className="text-[10px] text-[#5F6576] dark:text-[#8E96B0]">
                    {activeMetrics.totalRecurringAnnualUsd > 0
                      ? `${activeMetrics.recurringWeightedGmPct.toFixed(1)}% Recurring GM`
                      : 'Excluded by filter'}
                  </div>
                </div>

                <div className="border-t border-[#E4DFD6] dark:border-[#232B4A] pt-2">
                  <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0]">
                    Hardware ({SERVER_TIERS[effectiveTier].code})
                  </div>
                  <div className="font-bold text-sm text-[#16213A] dark:text-[#E7EBF5] mt-0.5">
                    {formatUsd(activeMetrics.serverCapexUsd)}
                  </div>
                  <div className="text-[10px] text-[#5F6576] dark:text-[#8E96B0]">
                    {includeHardware ? 'Pass-through CapEx' : 'Excluded'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs font-mono tabular-nums border-t border-[#E4DFD6] dark:border-[#232B4A]">
                <div>
                  <span className="text-[#5F6576] dark:text-[#8E96B0]">Y1 Spenta Contract: </span>
                  <strong className="text-[#16213A] dark:text-[#E7EBF5]">
                    {formatUsd(activeMetrics.year1SpentaContractUsd)}
                  </strong>
                </div>
                <div>
                  <span className="text-[#5F6576] dark:text-[#8E96B0]">Recurring Share: </span>
                  <strong className="text-[#1C6E46] dark:text-[#6FCB9F]">
                    {activeMetrics.year1SpentaContractUsd > 0
                      ? `${Math.round(
                          (activeMetrics.totalRecurringAnnualUsd /
                            activeMetrics.year1SpentaContractUsd) *
                            100,
                        )}%`
                      : '0%'}
                  </strong>
                </div>
                <div>
                  <span className="text-[#5F6576] dark:text-[#8E96B0]">Y1 Total Client Spend: </span>
                  <strong className="text-[#16213A] dark:text-[#E7EBF5]">
                    {formatUsd(activeMetrics.year1ClientInvestmentUsd)}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* 3-Year TCO Comparison Chart */}
          <div className="rounded-lg bg-[#FAF8F4] dark:bg-[#0B1020] border border-[#E4DFD6] dark:border-[#232B4A] p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5]">
                3-Year Total Cost of Ownership ($K USD) · Savings:{' '}
                {formatUsd(activeMetrics.threeYrSavingsUsd)}
              </span>
              <span className="font-mono text-[11px] text-[#1C6E46] dark:text-[#6FCB9F] tabular-nums">
                {activeMetrics.western3YrTcoUsd > 0
                  ? `${Math.round(
                      ((activeMetrics.western3YrTcoUsd - activeMetrics.spenta3YrTcoUsd) /
                        activeMetrics.western3YrTcoUsd) *
                        100,
                    )}% client TCO reduction`
                  : '—'}
              </span>
            </div>
            <div className="h-[155px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tcoChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 10, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: chartTickColor, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    tickFormatter={(v) => `$${v}K`}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={165}
                    tick={{ fill: chartTickColor, fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(val) => [`$${Number(val ?? 0).toFixed(1)}K`, '3-Yr TCO']}
                    contentStyle={{
                      backgroundColor: isDark ? '#141A32' : '#FFFFFF',
                      borderColor: chartGridColor,
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="amountK" radius={[0, 6, 6, 0]} barSize={24}>
                    {tcoChartData.map((entry, index) => (
                      <Cell key={`tco-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Live Google Search Grounding Benchmark Box */}
          <div className="rounded-lg bg-[#FAF8F4] dark:bg-[#0B1020] border border-[#E4DFD6] dark:border-[#232B4A] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" />
                  <span>Live Google Search ROI &amp; TCO Benchmark Check</span>
                </div>
                <p className="text-[11px] text-[#5F6576] dark:text-[#8E96B0] mt-0.5">
                  Cross-verify this configuration’s modeled ROI and payback against live external industry benchmarks via server-side Search grounding.
                </p>
              </div>
              <button
                type="button"
                disabled={benchmarkLoading}
                onClick={handleVerifyBenchmarks}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1F3863] hover:bg-[#162848] dark:bg-[#8FA6E8] dark:hover:bg-[#A6B9F0] text-white dark:text-[#0B1020] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 cursor-pointer"
              >
                {benchmarkLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Calculator className="w-3.5 h-3.5" />
                )}
                <span>{benchmarkLoading ? 'Verifying…' : 'Verify Live Benchmarks'}</span>
              </button>
            </div>

            {benchmarkError && (
              <div className="text-xs text-[#E11D48] dark:text-[#FDA4AF] bg-[#E11D48]/10 border border-[#E11D48]/25 rounded-lg px-3 py-2">
                {benchmarkError}
              </div>
            )}

            {benchmarkLoading && (
              <div className="space-y-2 py-2 animate-pulse">
                <div className="h-3 bg-[#E4DFD6] dark:bg-[#232B4A] rounded w-3/4" />
                <div className="h-3 bg-[#E4DFD6] dark:bg-[#232B4A] rounded w-full" />
                <div className="h-3 bg-[#E4DFD6] dark:bg-[#232B4A] rounded w-5/6" />
              </div>
            )}

            {!benchmarkLoading && benchmarkData && (
              <div className="pt-3 border-t border-[#E4DFD6] dark:border-[#232B4A] space-y-3">
                <div className="text-[11px] font-mono text-[#1C6E46] dark:text-[#6FCB9F]">
                  Verified via Google Search · Subject: {benchmarkSubject}
                </div>
                {renderMarkdownLines(benchmarkData.text)}
                {benchmarkData.sources.length > 0 && (
                  <div className="pt-2 border-t border-[#E4DFD6] dark:border-[#232B4A]">
                    <div className="text-[11px] font-semibold text-[#5F6576] dark:text-[#8E96B0] mb-1.5">
                      Cited Web Sources ({benchmarkData.sources.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {benchmarkData.sources.slice(0, 6).map((src, idx) => (
                        <a
                          key={`${src.uri}-${idx}`}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1F3863] dark:text-[#8FA6E8] hover:underline bg-white dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A] rounded-md px-2.5 py-1 max-w-[260px] truncate"
                        >
                          <span className="truncate">{src.title}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print-Deck Styled ROI Report Container (serialized to PDF & used for browser Print) */}
      <div className="roi-print-deck" aria-hidden="true">
        {/* Slide 01: Executive ROI & Revenue-Weighted Unit Economics */}
        <article className="pitch-deck-print-slide">
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-zinc-200">
            <span className="pitch-deck-print-badge px-2.5 py-1 rounded text-xs font-mono font-bold">
              ROI &amp; UNIT ECONOMICS BRIEF
            </span>
            <span className="pitch-deck-print-counter text-xs font-mono font-bold">01 / 02</span>
          </div>

          <div className="my-4 space-y-4">
            <div>
              <h2>{pdfTitleSubject} — Sovereign ROI &amp; 3-Year TCO Analysis</h2>
              <p className="pitch-deck-print-subtitle mt-1.5">
                {mode === 'single'
                  ? `${activeApp.category} · ${activeProfile.driver.label}: ${currentScale} ${activeProfile.driver.unit} · ${SERVER_TIERS[effectiveTier].code} (${SERVER_TIERS[effectiveTier].capex}) · Stream Scope: ${streamFilter.toUpperCase()}`
                  : `${modeledApps.length} Composed Modules · Shared ${SERVER_TIERS[effectiveTier].code} (${SERVER_TIERS[effectiveTier].capex}) · Build vs. Retainers: ${separateBuildAndRetainers ? 'Separated' : 'Combined Y1'}`}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="pitch-deck-print-kpi">
                <div className="pitch-deck-print-kpi-label font-mono uppercase">Client 12-Mo ROI</div>
                <div className="pitch-deck-print-kpi-value print-accent-emerald font-mono">
                  {activeMetrics.client12MoRoiPct}%
                </div>
              </div>
              <div className="pitch-deck-print-kpi">
                <div className="pitch-deck-print-kpi-label font-mono uppercase">Payback Period</div>
                <div className="pitch-deck-print-kpi-value print-accent-teal font-mono">
                  {activeMetrics.paybackMonths > 0 ? `${activeMetrics.paybackMonths} months` : 'N/A'}
                </div>
              </div>
              <div className="pitch-deck-print-kpi">
                <div className="pitch-deck-print-kpi-label font-mono uppercase">
                  Rev-Weighted GM (Y1)
                </div>
                <div className="pitch-deck-print-kpi-value print-accent-emerald font-mono">
                  {activeMetrics.revenueWeightedY1GmPct.toFixed(1)}%
                </div>
              </div>
              <div className="pitch-deck-print-kpi">
                <div className="pitch-deck-print-kpi-label font-mono uppercase">
                  Spenta 3-Yr LTV
                </div>
                <div className="pitch-deck-print-kpi-value print-accent-amber font-mono">
                  {formatUsd(activeMetrics.spenta3YrLtvUsd)} ({activeMetrics.spenta3YrBlendedGmPct}% GM)
                </div>
              </div>
            </div>

            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="pitch-deck-print-bullet-dot w-2 h-2 rounded-full mt-1.5 shrink-0" />
                <span className="pitch-deck-print-bullet-text">
                  One-Time Build CapEx: {formatUsd(activeMetrics.oneTimeBuildUsd)} (Build Weighted GM:{' '}
                  {activeMetrics.buildWeightedGmPct.toFixed(1)}%) separated strictly from Quarterly Managed Retainers ({formatUsd(activeMetrics.quarterlyRetainerUsd)}/qtr · {formatUsd(activeMetrics.retainerAnnualizedUsd)}/yr).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="pitch-deck-print-bullet-dot w-2 h-2 rounded-full mt-1.5 shrink-0" />
                <span className="pitch-deck-print-bullet-text">
                  Recurring Sovereign SaaS ARR: {formatUsd(activeMetrics.saasArrAnnualUsd)}/yr (Total Recurring Weighted GM: {activeMetrics.recurringWeightedGmPct.toFixed(1)}%); On-Premises Hardware CapEx ({SERVER_TIERS[effectiveTier].code}): {formatUsd(activeMetrics.serverCapexUsd)}.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="pitch-deck-print-bullet-dot w-2 h-2 rounded-full mt-1.5 shrink-0" />
                <span className="pitch-deck-print-bullet-text">
                  3-Year Total Cost of Ownership: Spenta Sovereign {formatUsd(activeMetrics.spenta3YrTcoUsd)} vs. Western Cloud/Agency Equivalent {formatUsd(activeMetrics.western3YrTcoUsd)} — saving {formatUsd(activeMetrics.threeYrSavingsUsd)} ({tcoReductionPct}% client TCO reduction).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="pitch-deck-print-bullet-dot w-2 h-2 rounded-full mt-1.5 shrink-0" />
                <span className="pitch-deck-print-bullet-text">
                  Year-1 Client Value Unlocked: {formatUsd(activeMetrics.year1ClientValueUsd)} against Year-1 Total Client Investment of {formatUsd(activeMetrics.year1ClientInvestmentUsd)} (Net Year-1 Benefit: {activeMetrics.year1NetBenefitUsd >= 0 ? '+' : ''}{formatUsd(activeMetrics.year1NetBenefitUsd)}).
                </span>
              </li>
            </ul>

            <div className="pitch-deck-print-callout">
              <span className="pitch-deck-print-callout-label">EVIDENCE BASIS: </span>
              {mode === 'stack'
                ? 'Shared on-premises Server PC tier and L5 OPA governance bus amortize fixed CapEx across all selected modules while preserving zero external LLM cloud egress.'
                : `${activeProfile.evidenceBasis} ${activeProfile.valueMechanism}`}
            </div>
          </div>

          <div className="space-y-2">
            <div className="pitch-deck-print-notes">
              <div className="pitch-deck-print-notes-title">UNIT ECONOMICS AUDIT NOTE</div>
              <p>
                Year-1 composite GM ({activeMetrics.revenueWeightedY1GmPct.toFixed(1)}%) is dollar-weighted across Year-1 contract revenue (delta vs. flat arithmetic average: {activeMetrics.gmWeightingDeltaPct >= 0 ? '+' : ''}{activeMetrics.gmWeightingDeltaPct.toFixed(1)} pts), anchored by $12.98/hr loaded Dhaka R&amp;D hub economics.
              </p>
            </div>
            <div className="pitch-deck-print-footer flex justify-between font-mono">
              <span>Spenta Technology (spenta.tech) · Sovereign OS ROI Modeler</span>
              <span>hello@spenta.tech · Confidential</span>
            </div>
          </div>
        </article>

        {/* Slide 02: Module Breakdown & Live Grounded Benchmark Verification */}
        <article className="pitch-deck-print-slide">
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-zinc-200">
            <span className="pitch-deck-print-badge px-2.5 py-1 rounded text-xs font-mono font-bold">
              MODULE SCHEDULE &amp; BENCHMARK VERIFICATION
            </span>
            <span className="pitch-deck-print-counter text-xs font-mono font-bold">02 / 02</span>
          </div>

          <div className="my-4 space-y-4">
            <div>
              <h2>Included Solution Architecture &amp; External Benchmark Context</h2>
              <p className="pitch-deck-print-subtitle mt-1.5">
                Hardware Baseline: {SERVER_TIERS[effectiveTier].code} — {SERVER_TIERS[effectiveTier].name} ({SERVER_TIERS[effectiveTier].hardware} · {SERVER_TIERS[effectiveTier].speed})
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="pitch-deck-print-kpi">
                <div className="pitch-deck-print-kpi-label font-mono uppercase">One-Time Build</div>
                <div className="pitch-deck-print-kpi-value print-accent-teal font-mono">
                  {formatUsd(activeMetrics.oneTimeBuildUsd)}
                </div>
              </div>
              <div className="pitch-deck-print-kpi">
                <div className="pitch-deck-print-kpi-label font-mono uppercase">Annual Recurring</div>
                <div className="pitch-deck-print-kpi-value print-accent-emerald font-mono">
                  {formatUsd(activeMetrics.totalRecurringAnnualUsd)}/yr
                </div>
              </div>
              <div className="pitch-deck-print-kpi">
                <div className="pitch-deck-print-kpi-label font-mono uppercase">3-Yr TCO Savings</div>
                <div className="pitch-deck-print-kpi-value print-accent-emerald font-mono">
                  {formatUsd(activeMetrics.threeYrSavingsUsd)}
                </div>
              </div>
              <div className="pitch-deck-print-kpi">
                <div className="pitch-deck-print-kpi-label font-mono uppercase">Hardware CapEx</div>
                <div className="pitch-deck-print-kpi-value print-accent-amber font-mono">
                  {formatUsd(activeMetrics.serverCapexUsd)}
                </div>
              </div>
            </div>

            <ul className="space-y-2">
              {modeledApps.slice(0, 5).map((app) => {
                const prof = PRODUCT_ROI_PROFILES[app.id];
                const scaleVal = scaleMap[app.id] ?? prof.driver.defaultValue;
                return (
                  <li key={app.id} className="flex items-start gap-2">
                    <span className="pitch-deck-print-bullet-dot w-2 h-2 rounded-full mt-1.5 shrink-0" />
                    <span className="pitch-deck-print-bullet-text">
                      {app.name} ({app.category}): {app.setupLabel} · {app.recurringLabel} · {app.gmPct.toFixed(1)}% GM · Scale: {scaleVal} {prof.driver.unit} · Proof: {app.proofClient}.
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="pitch-deck-print-callout">
              <span className="pitch-deck-print-callout-label">
                {benchmarkData ? 'LIVE GOOGLE SEARCH BENCHMARK: ' : 'SOVEREIGN GOVERNANCE GUARANTEE: '}
              </span>
              {benchmarkData
                ? `${benchmarkData.text.replace(/\*\*/g, '').replace(/\n+/g, ' ').slice(0, 260)}...`
                : 'Every modeled deployment runs inside an air-gapped L1-L6 Sovereign Enclave with OPA >=0.88 HITL gating, AMD SEV-SNP / Intel TDX TEEs, and zero third-party LLM token leakage.'}
            </div>
          </div>

          <div className="space-y-2">
            <div className="pitch-deck-print-notes">
              <div className="pitch-deck-print-notes-title">EXPORT METADATA</div>
              <p>
                Generated directly from Spenta Sovereign OS Interactive ROI Calculator using the standardized print-deck styling contract ({modeledApps.length} active module{modeledApps.length === 1 ? '' : 's'}).
              </p>
            </div>
            <div className="pitch-deck-print-footer flex justify-between font-mono">
              <span>Spenta Technology (spenta.tech) · Print-Deck Standardized PDF</span>
              <span>hello@spenta.tech · Confidential</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
