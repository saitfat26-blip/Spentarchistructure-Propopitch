import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Check, Layers, PieChart as PieChartIcon, RotateCcw, Split } from 'lucide-react';
import { REVENUE_SCOPES, RevenueScopeId } from '../data/roiModel';
import { GROWTH_MODE_SPECS, GrowthMode } from '../data/spentaEnrichments';
import { useStack } from '../store/StackContext';

export type MixPresetId = 'fy27' | 'fy31' | 'arr-heavy';

export const PRESET_REVENUE_SCALE_K: Record<MixPresetId, { label: string; totalRevK: number }> = {
  fy27: { label: 'FY2027 Base ($672K)', totalRevK: 672 },
  fy31: { label: 'FY2031 Base ($5.85M)', totalRevK: 5850 },
  'arr-heavy': { label: 'FY2031 Upside ($9.60M)', totalRevK: 9600 },
};

export const DEFAULT_MIX_WEIGHTS: Record<MixPresetId, Record<RevenueScopeId, number>> = {
  fy27: {
    one_time_builds: 52,
    recurring_saas: 20,
    managed_retainers: 16,
    ip_royalties: 6,
    captive_ecosystem: 6,
  },
  fy31: {
    one_time_builds: 24,
    recurring_saas: 44,
    managed_retainers: 14,
    ip_royalties: 12,
    captive_ecosystem: 6,
  },
  'arr-heavy': {
    one_time_builds: 15,
    recurring_saas: 52,
    managed_retainers: 11,
    ip_royalties: 16,
    captive_ecosystem: 6,
  },
};

export const DEFAULT_PRESET_OPEX: Record<MixPresetId, number> = {
  fy27: 32,
  fy31: 24,
  'arr-heavy': 21,
};

export const BUILD_SCOPE_IDS: RevenueScopeId[] = ['one_time_builds', 'captive_ecosystem'];

export interface SharedRevenueMixProps {
  activePreset?: MixPresetId;
  scopeWeights?: Record<RevenueScopeId, number>;
  targetOpexRatioPct?: number;
  growthMode?: GrowthMode;
  onApplyPreset?: (preset: MixPresetId) => void;
  onChangeScopeWeight?: (scopeId: RevenueScopeId, value: number) => void;
  onChangeOpexRatio?: (value: number) => void;
}

function formatUsdK(valK: number): string {
  if (valK >= 1000) return `$${(valK / 1000).toFixed(2)}M`;
  return `$${valK.toFixed(0)}K`;
}

export function RevenueMixModeler({
  activePreset: controlledPreset,
  scopeWeights: controlledWeights,
  targetOpexRatioPct: controlledOpex,
  growthMode = 'conservative',
  onApplyPreset,
  onChangeScopeWeight,
  onChangeOpexRatio,
}: SharedRevenueMixProps = {}) {
  const { theme } = useStack();
  const isDark = theme === 'dark';

  const [localPreset, setLocalPreset] = useState<MixPresetId>('fy31');
  const [localWeights, setLocalWeights] = useState<Record<RevenueScopeId, number>>(
    () => DEFAULT_MIX_WEIGHTS.fy31,
  );
  const [localOpex, setLocalOpex] = useState<number>(DEFAULT_PRESET_OPEX.fy31);
  const [separateBuildVsRetainers, setSeparateBuildVsRetainers] = useState<boolean>(true);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  const activePreset = controlledPreset ?? localPreset;
  const scopeWeights = controlledWeights ?? localWeights;
  const targetOpexRatioPct = controlledOpex ?? localOpex;

  const growthMultiplier = GROWTH_MODE_SPECS[growthMode].mixMultiplier;
  const revenueScaleK = Number(
    (PRESET_REVENUE_SCALE_K[activePreset].totalRevK * growthMultiplier).toFixed(1),
  );

  const revenueMixMetrics = useMemo(() => {
    const totalWeight = Object.values(scopeWeights).reduce((s, v) => s + v, 0) || 1;

    let buildRevK = 0;
    let buildGpK = 0;
    let recurringRevK = 0;
    let recurringGpK = 0;

    const rows = REVENUE_SCOPES.map((scope) => {
      const sharePct = (scopeWeights[scope.id] / totalWeight) * 100;
      const revK = (sharePct / 100) * revenueScaleK;
      const gpK = revK * (scope.grossMarginPct / 100);
      const gmContribution = (sharePct / 100) * scope.grossMarginPct;
      const isBuildType = BUILD_SCOPE_IDS.includes(scope.id);

      if (isBuildType) {
        buildRevK += revK;
        buildGpK += gpK;
      } else {
        recurringRevK += revK;
        recurringGpK += gpK;
      }

      return {
        ...scope,
        isBuildType,
        normalizedSharePct: Number(sharePct.toFixed(1)),
        revK: Number(revK.toFixed(1)),
        gpK: Number(gpK.toFixed(1)),
        gmContributionPct: Number(gmContribution.toFixed(1)),
      };
    });

    const totalGpK = buildGpK + recurringGpK;
    const revenueWeightedGmPct =
      revenueScaleK > 0 ? Number(((totalGpK / revenueScaleK) * 100).toFixed(1)) : 0;
    const buildWeightedGmPct =
      buildRevK > 0 ? Number(((buildGpK / buildRevK) * 100).toFixed(1)) : 0;
    const recurringWeightedGmPct =
      recurringRevK > 0 ? Number(((recurringGpK / recurringRevK) * 100).toFixed(1)) : 0;
    const buildSharePct =
      revenueScaleK > 0 ? Number(((buildRevK / revenueScaleK) * 100).toFixed(1)) : 0;
    const recurringSharePct = Number((100 - buildSharePct).toFixed(1));

    const impliedEbitdaMarginPct = Number((revenueWeightedGmPct - targetOpexRatioPct).toFixed(1));
    const impliedEbitdaK = Number(((impliedEbitdaMarginPct / 100) * revenueScaleK).toFixed(1));

    const fy27BaselineGmPct = Number(
      REVENUE_SCOPES.reduce((s, sc) => s + (sc.fy27SharePct / 100) * sc.grossMarginPct, 0).toFixed(
        1,
      ),
    );

    return {
      rows,
      totalGpK: Number(totalGpK.toFixed(1)),
      revenueWeightedGmPct,
      buildRevK: Number(buildRevK.toFixed(1)),
      buildSharePct,
      buildWeightedGmPct,
      recurringRevK: Number(recurringRevK.toFixed(1)),
      recurringSharePct,
      recurringWeightedGmPct,
      impliedEbitdaMarginPct,
      impliedEbitdaK,
      fy27BaselineGmPct,
    };
  }, [scopeWeights, targetOpexRatioPct, revenueScaleK]);

  const applyMixPreset = (preset: MixPresetId) => {
    if (onApplyPreset) {
      onApplyPreset(preset);
      return;
    }
    setLocalPreset(preset);
    setLocalWeights(DEFAULT_MIX_WEIGHTS[preset]);
    setLocalOpex(DEFAULT_PRESET_OPEX[preset]);
  };

  const handleWeightChange = (scopeId: RevenueScopeId, value: number) => {
    if (onChangeScopeWeight) {
      onChangeScopeWeight(scopeId, value);
      return;
    }
    setLocalWeights((prev) => ({ ...prev, [scopeId]: value }));
  };

  const handleOpexChange = (value: number) => {
    if (onChangeOpexRatio) {
      onChangeOpexRatio(value);
      return;
    }
    setLocalOpex(value);
  };

  const chartTickColor = isDark ? '#8E96B0' : '#5F6576';
  const chartGridColor = isDark ? '#232B4A' : '#E4DFD6';

  return (
    <section className="rounded-xl bg-white dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A] p-5 sm:p-6">
      {/* Header + Presets + Build vs. Retainer Split Toggle */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b border-[#E4DFD6] dark:border-[#232B4A]">
        <div>
          <div className="text-xs font-mono text-[#1C6E46] dark:text-[#6FCB9F] font-semibold">
            Margin Bridge Analysis · 5 Planned Revenue Generation Scopes
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#16213A] dark:text-[#E7EBF5] tracking-tight mt-0.5">
            5-Scope Revenue Mix &amp; FY2031 EBITDA Sustainability Modeler
          </h2>
          <p className="text-xs text-[#5F6576] dark:text-[#8E96B0] mt-1">
            Model dollar revenue-weighted GM expansion as mix shifts from one-time builds (34% GM) into recurring SaaS ARR (72% GM), managed retainers (38% GM), and 3D/Dataset IP (78% GM).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {(
            [
              { id: 'fy27', label: 'FY2027 Baseline' },
              { id: 'fy31', label: 'FY2031 Target Mix' },
              { id: 'arr-heavy', label: 'Upside ARR Mix' },
            ] as const
          ).map(({ id, label }) => {
            const active = activePreset === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => applyMixPreset(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#1C6E46] dark:bg-[#6FCB9F] text-white dark:text-[#0B1020]'
                    : 'border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0B1020] text-[#16213A] dark:text-[#E7EBF5] hover:border-[#1F3863]'
                }`}
              >
                {label}
              </button>
            );
          })}

          <button
            type="button"
            role="switch"
            aria-checked={separateBuildVsRetainers}
            onClick={() => setSeparateBuildVsRetainers((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              separateBuildVsRetainers
                ? 'bg-[#1F3863]/10 dark:bg-[#8FA6E8]/15 border-[#1F3863]/40 dark:border-[#8FA6E8]/40 text-[#1F3863] dark:text-[#8FA6E8]'
                : 'bg-[#FAF8F4] dark:bg-[#0B1020] border-[#E4DFD6] dark:border-[#232B4A] text-[#5F6576] dark:text-[#8E96B0]'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>
              {separateBuildVsRetainers ? 'Build vs. Annuity Split' : 'Consolidated View'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => applyMixPreset('fy31')}
            aria-label="Reset revenue mix"
            className="p-1.5 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
        {/* Left: 5-Scope Allocation Sliders */}
        <div className="lg:col-span-7 space-y-4">
          {revenueMixMetrics.rows.map((scope) => (
            <div
              key={scope.id}
              className="pb-3.5 border-b border-[#EFEBE3] dark:border-[#1E2642] last:border-b-0 last:pb-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: scope.accent }}
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-[#16213A] dark:text-[#E7EBF5]">
                    {scope.name}
                  </span>
                  {separateBuildVsRetainers && (
                    <span className="text-[10px] font-mono text-[#5F6576] dark:text-[#8E96B0]">
                      · {scope.isBuildType ? 'Build CapEx' : 'Recurring / IP'}
                    </span>
                  )}
                </div>
                <div className="font-mono tabular-nums flex items-center gap-2 shrink-0">
                  <span className="text-[#16213A] dark:text-[#E7EBF5] font-bold">
                    {scope.normalizedSharePct.toFixed(1)}% ({formatUsdK(scope.revK)})
                  </span>
                  <span className="text-[#5F6576] dark:text-[#8E96B0]">·</span>
                  <span className="text-[#1C6E46] dark:text-[#6FCB9F] font-semibold">
                    {scope.grossMarginPct}% GM
                  </span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={70}
                step={1}
                value={scopeWeights[scope.id]}
                onChange={(e) => handleWeightChange(scope.id, Number(e.target.value))}
                className="w-full mt-2 accent-[#1C6E46] dark:accent-[#6FCB9F] cursor-pointer"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5F6576] dark:text-[#8E96B0] mt-1">
                <span>{scope.examples}</span>
                <span className="font-mono tabular-nums">
                  +{scope.gmContributionPct.toFixed(1)} pts · GP {formatUsdK(scope.gpK)}
                </span>
              </div>
            </div>
          ))}

          {/* SG&A / OpEx Ratio Slider */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#16213A] dark:text-[#E7EBF5]">
                Operating SG&amp;A + Core Enclave OpEx Ratio (% of Revenue)
              </span>
              <span className="font-mono font-bold text-[#1F3863] dark:text-[#8FA6E8] tabular-nums">
                {targetOpexRatioPct}% of Rev
              </span>
            </div>
            <input
              type="range"
              min={16}
              max={38}
              step={1}
              value={targetOpexRatioPct}
              onChange={(e) => handleOpexChange(Number(e.target.value))}
              className="w-full mt-1.5 accent-[#1F3863] dark:accent-[#8FA6E8] cursor-pointer"
            />
          </div>
        </div>

        {/* Right: Live Revenue-Weighted GM, Build vs. Retainer Split & Dynamic Pie / Bar Chart */}
        <div className="lg:col-span-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[#FAF8F4] dark:bg-[#0B1020] border border-[#E4DFD6] dark:border-[#232B4A] p-4">
              <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0]">
                Revenue-Weighted GM
              </div>
              <div className="font-mono text-2xl font-bold text-[#1C6E46] dark:text-[#6FCB9F] mt-1 tabular-nums">
                {revenueMixMetrics.revenueWeightedGmPct.toFixed(1)}%
              </div>
              <div className="text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0] mt-0.5 tabular-nums">
                GP {formatUsdK(revenueMixMetrics.totalGpK)} · FY27 base{' '}
                {revenueMixMetrics.fy27BaselineGmPct}%
              </div>
            </div>

            <div className="rounded-lg bg-[#FAF8F4] dark:bg-[#0B1020] border border-[#E4DFD6] dark:border-[#232B4A] p-4">
              <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0]">
                Implied EBITDA Margin
              </div>
              <div
                className={`font-mono text-2xl font-bold mt-1 tabular-nums ${
                  revenueMixMetrics.impliedEbitdaMarginPct >= 32
                    ? 'text-[#1C6E46] dark:text-[#6FCB9F]'
                    : 'text-[#D97706] dark:text-[#F5C57B]'
                }`}
              >
                {revenueMixMetrics.impliedEbitdaMarginPct.toFixed(1)}%
              </div>
              <div className="text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0] mt-0.5 tabular-nums">
                {formatUsdK(revenueMixMetrics.impliedEbitdaK)} EBITDA · Target 32–43%
              </div>
            </div>
          </div>

          {/* Separated One-Time Builds vs. Recurring Retainers & IP Breakdown */}
          {separateBuildVsRetainers && (
            <div className="rounded-lg bg-[#FAF8F4] dark:bg-[#0B1020] border border-[#E4DFD6] dark:border-[#232B4A] p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#16213A] dark:text-[#E7EBF5]">
                  Build CapEx vs. Recurring Annuity Split
                </span>
                <span className="font-mono text-[11px] text-[#5F6576] dark:text-[#8E96B0] tabular-nums">
                  Scale: {PRESET_REVENUE_SCALE_K[activePreset].label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#E4DFD6] dark:border-[#232B4A] font-mono text-xs tabular-nums">
                <div>
                  <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0]">
                    Builds &amp; Captive ({revenueMixMetrics.buildSharePct}%)
                  </div>
                  <div className="font-bold text-sm text-[#1F3863] dark:text-[#8FA6E8] mt-0.5">
                    {formatUsdK(revenueMixMetrics.buildRevK)}
                  </div>
                  <div className="text-[10px] text-[#5F6576] dark:text-[#8E96B0]">
                    {revenueMixMetrics.buildWeightedGmPct.toFixed(1)}% Build Wtd GM
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0]">
                    SaaS, Retainers &amp; IP ({revenueMixMetrics.recurringSharePct}%)
                  </div>
                  <div className="font-bold text-sm text-[#1C6E46] dark:text-[#6FCB9F] mt-0.5">
                    {formatUsdK(revenueMixMetrics.recurringRevK)}
                  </div>
                  <div className="text-[10px] text-[#5F6576] dark:text-[#8E96B0]">
                    {revenueMixMetrics.recurringWeightedGmPct.toFixed(1)}% Annuity Wtd GM
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Responsive Recharts Pie Chart / GM Bridge Bar Chart Switcher */}
          <div className="rounded-lg bg-[#FAF8F4] dark:bg-[#0B1020] border border-[#E4DFD6] dark:border-[#232B4A] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5]">
                {chartType === 'pie'
                  ? '5-Scope Revenue Mix Share (%)'
                  : 'Gross Margin Contribution by Scope (pts)'}
              </span>
              <div className="inline-flex rounded-md bg-[#F2EFE9] dark:bg-[#141A32] p-0.5 border border-[#E4DFD6] dark:border-[#232B4A]">
                <button
                  type="button"
                  onClick={() => setChartType('pie')}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                    chartType === 'pie'
                      ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                      : 'text-[#5F6576] dark:text-[#8E96B0]'
                  }`}
                >
                  <PieChartIcon className="w-3 h-3" />
                  <span>Pie</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                    chartType === 'bar'
                      ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                      : 'text-[#5F6576] dark:text-[#8E96B0]'
                  }`}
                >
                  <BarChart3 className="w-3 h-3" />
                  <span>GM Bar</span>
                </button>
              </div>
            </div>

            <div className="h-[215px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'pie' ? (
                  <PieChart>
                    <Pie
                      data={revenueMixMetrics.rows}
                      dataKey="normalizedSharePct"
                      nameKey="shortName"
                      cx="50%"
                      cy="50%"
                      innerRadius="52%"
                      outerRadius="82%"
                      paddingAngle={2}
                      stroke={isDark ? '#0B1020' : '#FAF8F4'}
                      strokeWidth={2}
                    >
                      {revenueMixMetrics.rows.map((entry) => (
                        <Cell key={entry.id} fill={entry.accent} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, _name, item) => {
                        const payload = item?.payload as
                          | { revK?: number; grossMarginPct?: number; gmContributionPct?: number }
                          | undefined;
                        return [
                          `${Number(val ?? 0).toFixed(1)}% · ${formatUsdK(payload?.revK ?? 0)} (${payload?.grossMarginPct ?? 0}% GM)`,
                          'Revenue Scope',
                        ];
                      }}
                      contentStyle={{
                        backgroundColor: isDark ? '#141A32' : '#FFFFFF',
                        borderColor: chartGridColor,
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                ) : (
                  <BarChart
                    data={revenueMixMetrics.rows}
                    margin={{ top: 8, right: 12, left: -12, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fill: chartTickColor, fontSize: 10 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={44}
                    />
                    <YAxis
                      tick={{ fill: chartTickColor, fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      formatter={(val) => [`${Number(val ?? 0).toFixed(1)} pts`, 'GM Contribution']}
                      contentStyle={{
                        backgroundColor: isDark ? '#141A32' : '#FFFFFF',
                        borderColor: chartGridColor,
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="gmContributionPct" radius={[5, 5, 0, 0]} barSize={28}>
                      {revenueMixMetrics.rows.map((entry) => (
                        <Cell key={entry.id} fill={entry.accent} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            <div className="mt-2 pt-2 border-t border-[#E4DFD6] dark:border-[#232B4A] flex items-center gap-2 text-xs text-[#4A5568] dark:text-[#C8D0E4]">
              {revenueMixMetrics.impliedEbitdaMarginPct >= 32 ? (
                <>
                  <Check className="w-4 h-4 text-[#1C6E46] dark:text-[#6FCB9F] shrink-0" />
                  <span>
                    Sustainable: this revenue-weighted mix clears the 32% FY2031 EBITDA floor ({revenueMixMetrics.impliedEbitdaMarginPct.toFixed(1)}% implied).
                  </span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4 text-[#D97706] dark:text-[#F5C57B] shrink-0" />
                  <span>
                    Below FY2031 32% EBITDA floor ({revenueMixMetrics.impliedEbitdaMarginPct.toFixed(1)}%) — shift weight toward Recurring SaaS ARR or 3D/Dataset IP.
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
