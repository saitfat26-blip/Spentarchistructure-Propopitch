import React, { useMemo, useState } from 'react';
import { Check, Leaf, RotateCcw, ShieldAlert, ShieldCheck, UserCheck } from 'lucide-react';
import {
  AUTOPILOT_CAPTAIN_MATRIX,
  PRE_TRUST_AUDIT_CONTROLS,
  SCOPE3_TELEMETRY_COMPARISON,
} from '../data/spentaEnrichments';
import { SPENTA_APPS } from '../data/spentaManifest';
import { useStack } from '../store/StackContext';

export function AiSafetyWorkbench() {
  const { selectedIds, logCoreAuditEvent } = useStack();

  const [checkedControls, setCheckedControls] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PRE_TRUST_AUDIT_CONTROLS.map((c) => [c.id, c.defaultChecked])),
  );

  const appNameMap = useMemo(
    () => Object.fromEntries(SPENTA_APPS.map((a) => [a.id, a.shortName])),
    [],
  );

  const auditScore = useMemo(() => {
    return PRE_TRUST_AUDIT_CONTROLS.reduce(
      (sum, ctrl) => sum + (checkedControls[ctrl.id] ? ctrl.weight : 0),
      0,
    );
  }, [checkedControls]);

  const checkedCount = useMemo(
    () => PRE_TRUST_AUDIT_CONTROLS.filter((c) => checkedControls[c.id]).length,
    [checkedControls],
  );

  const readinessPosture =
    auditScore >= 90
      ? {
          label: 'Production Sovereign Ready',
          tone: 'text-[#1C6E46] dark:text-[#6FCB9F]',
          note: 'All mandatory Objective Clarity, OPA 0.88 kill-switch, and audit controls verified.',
        }
      : auditScore >= 70
        ? {
            label: 'Pilot Shadow Mode Recommended',
            tone: 'text-[#B45309] dark:text-[#FBBF24]',
            note: 'Safe for shadow-mode evaluation; close remaining controls prior to autonomous ledger cutover.',
          }
        : {
            label: 'Pre-Trust Remediation Required',
            tone: 'text-[#BE123C] dark:text-[#FDA4AF]',
            note: 'Unconstrained variables detected—do not grant write permissions until boundary controls pass.',
          };

  const toggleControl = (id: string, title: string) => {
    setCheckedControls((prev) => {
      const nextVal = !prev[id];
      logCoreAuditEvent({
        actor: 'AI Safety Officer',
        layer: 'L5',
        action: 'Updated Pre-Trust Capital Audit Control',
        field: title,
        previousValue: prev[id] ? 'Verified' : 'Pending',
        newValue: nextVal ? 'Verified' : 'Pending',
      });
      return { ...prev, [id]: nextVal };
    });
  };

  const resetChecklist = () => {
    setCheckedControls(
      Object.fromEntries(PRE_TRUST_AUDIT_CONTROLS.map((c) => [c.id, c.defaultChecked])),
    );
  };

  return (
    <div className="space-y-6">
      {/* Capability-Clarity Paradox Overview */}
      <section className="rounded-2xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-5 border-b border-[#E4DFD6] dark:border-[#232B4A]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#1C6E46] dark:text-[#6FCB9F] font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Enterprise AI Safety &amp; Pre-Trust Doctrine · Module C Governance</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#16213A] dark:text-[#E7EBF5] mt-1">
              Solving the Capability-Clarity Paradox Before Capital Deployment
            </h2>
            <p className="text-xs sm:text-sm text-[#4A5568] dark:text-[#A4ADC6] mt-1.5 leading-relaxed">
              Industry studies show <strong className="text-[#16213A] dark:text-[#E7EBF5]">95% of enterprise AI pilots stall</strong> and{' '}
              <strong className="text-[#16213A] dark:text-[#E7EBF5]">56% return zero measurable financial value</strong>—not because models lack capability,
              but because objectives, safety boundaries, and human sign-off rules remain unconstrained. Spenta enforces deterministic L5 OPA boundaries
              to prevent King Midas / specification-gaming failures in production.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0B1020] px-3.5 py-2.5">
              <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0]">Pilot Failure</div>
              <div className="text-lg font-bold font-mono tabular-nums text-[#BE123C] dark:text-[#FDA4AF]">
                95%
              </div>
              <div className="text-[10px] text-[#5F6576] dark:text-[#8E96B0]">Industry baseline</div>
            </div>
            <div className="rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0B1020] px-3.5 py-2.5">
              <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0]">Zero Value</div>
              <div className="text-lg font-bold font-mono tabular-nums text-[#B45309] dark:text-[#FBBF24]">
                56%
              </div>
              <div className="text-[10px] text-[#5F6576] dark:text-[#8E96B0]">Unclear contracts</div>
            </div>
            <div className="rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0B1020] px-3.5 py-2.5">
              <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0]">OPA Gate</div>
              <div className="text-lg font-bold font-mono tabular-nums text-[#1C6E46] dark:text-[#6FCB9F]">
                ≥ 0.88
              </div>
              <div className="text-[10px] text-[#5F6576] dark:text-[#8E96B0]">Captain sign-off</div>
            </div>
          </div>
        </div>

        {/* Autopilot Suggests, Captain Signs Matrix */}
        <div className="mt-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="inline-flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#1F3863] dark:text-[#8FA6E8]" />
              <h3 className="text-sm sm:text-base font-bold text-[#16213A] dark:text-[#E7EBF5]">
                “Autopilot Suggests, Captain Signs” — Active Stack Governance Split
              </h3>
            </div>
            <span className="text-xs text-[#5F6576] dark:text-[#8E96B0]">
              Highlighted rows map directly to your {selectedIds.length} active Stack Composer modules
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E4DFD6] dark:border-[#232B4A] text-[#5F6576] dark:text-[#8E96B0]">
                  <th className="py-2.5 pr-3 font-semibold">Operational Domain</th>
                  <th className="py-2.5 px-3 font-semibold">Autopilot Suggests (L3 Neural Core)</th>
                  <th className="py-2.5 px-3 font-semibold">Captain Signs (Human Authority)</th>
                  <th className="py-2.5 pl-3 font-semibold">OPA Policy &amp; Gaming Shield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4DFD6] dark:divide-[#232B4A]">
                {AUTOPILOT_CAPTAIN_MATRIX.map((row) => {
                  const matchedApps = row.appIds.filter((id) => selectedIds.includes(id));
                  const isActiveRow = matchedApps.length > 0;
                  return (
                    <tr
                      key={row.id}
                      className={
                        isActiveRow
                          ? 'bg-[#1C6E46]/[0.05] dark:bg-[#6FCB9F]/[0.07]'
                          : 'hover:bg-[#FAF8F4] dark:hover:bg-[#0F1529]'
                      }
                    >
                      <td className="py-3 pr-3 align-top min-w-[180px]">
                        <div className="font-bold text-[#16213A] dark:text-[#E7EBF5]">
                          {row.domain}
                        </div>
                        <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0] mt-0.5">
                          {row.appIds.map((id) => appNameMap[id] ?? id).join(' · ')}
                        </div>
                        {isActiveRow && (
                          <div className="text-[10px] font-mono font-semibold text-[#1C6E46] dark:text-[#6FCB9F] mt-1">
                            Active in Stack ({matchedApps.length})
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 align-top text-[#334155] dark:text-[#C8D0E4] leading-relaxed">
                        {row.autopilotSuggests}
                      </td>
                      <td className="py-3 px-3 align-top text-[#16213A] dark:text-[#E7EBF5] font-medium leading-relaxed">
                        {row.captainSigns}
                      </td>
                      <td className="py-3 pl-3 align-top min-w-[200px]">
                        <div className="font-mono text-[11px] font-semibold text-[#1F3863] dark:text-[#8FA6E8]">
                          {row.opaGate}
                        </div>
                        <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0] mt-1">
                          {row.unconstrainedRiskMitigated}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Interactive 4-Pillar Pre-Trust Capital Audit & Unconstrained Variable Register */}
      <section className="rounded-2xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E4DFD6] dark:border-[#232B4A]">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#1F3863] dark:text-[#8FA6E8] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Interactive Readiness Assessment · Unconstrained Variable Register</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#16213A] dark:text-[#E7EBF5] mt-0.5">
              4-Pillar Pre-Trust Capital Audit Checklist
            </h3>
            <p className="text-xs text-[#5F6576] dark:text-[#8E96B0] mt-0.5">
              Toggle controls below to evaluate production sign-off readiness; every state change is recorded in the L5 Configuration Audit Log.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0]">
                Pre-Trust Audit Score ({checkedCount}/{PRE_TRUST_AUDIT_CONTROLS.length})
              </div>
              <div className={`text-2xl font-extrabold font-mono tabular-nums ${readinessPosture.tone}`}>
                {auditScore} / 100
              </div>
              <div className={`text-[11px] font-semibold ${readinessPosture.tone}`}>
                {readinessPosture.label}
              </div>
            </div>
            <button
              type="button"
              onClick={resetChecklist}
              aria-label="Reset Pre-Trust checklist"
              className="p-2 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-white cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 mb-5">
          <div className="h-2 w-full rounded-full bg-[#EFECE5] dark:bg-[#0B1020] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${auditScore}%`,
                backgroundColor:
                  auditScore >= 90 ? '#1C6E46' : auditScore >= 70 ? '#D97706' : '#BE123C',
              }}
            />
          </div>
          <p className="text-xs text-[#4A5568] dark:text-[#A4ADC6] mt-2">{readinessPosture.note}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRE_TRUST_AUDIT_CONTROLS.map((ctrl) => {
            const isChecked = !!checkedControls[ctrl.id];
            return (
              <button
                key={ctrl.id}
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                onClick={() => toggleControl(ctrl.id, ctrl.title)}
                className={`text-left rounded-xl border p-4 transition-colors cursor-pointer ${
                  isChecked
                    ? 'border-[#1C6E46]/45 dark:border-[#6FCB9F]/45 bg-[#1C6E46]/[0.05] dark:bg-[#6FCB9F]/[0.06]'
                    : 'border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0B1020] hover:border-[#1F3863]/45'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0]">
                      {ctrl.pillar} · Weight +{ctrl.weight} pts
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-[#16213A] dark:text-[#E7EBF5] mt-0.5">
                      {ctrl.title}
                    </div>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                      isChecked
                        ? 'bg-[#1C6E46] dark:bg-[#6FCB9F] border-[#1C6E46] dark:border-[#6FCB9F] text-white dark:text-[#0B1020]'
                        : 'border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#141A32]'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                  </span>
                </div>
                <div className="text-[11px] text-[#BE123C] dark:text-[#FDA4AF] mt-2">
                  Unconstrained Risk: {ctrl.unconstrainedVariable}
                </div>
                <div className="text-[11px] text-[#4A5568] dark:text-[#A4ADC6] mt-1">
                  Control: {ctrl.controlMechanism}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Activity-Based Scope 3 Climate Telemetry */}
      <section className="rounded-2xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[#1C6E46] dark:text-[#6FCB9F] font-semibold">
          <Leaf className="w-3.5 h-3.5" />
          <span>Green AI &amp; Activity-Based Scope 3 Climate Telemetry</span>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-[#16213A] dark:text-[#E7EBF5] mt-0.5">
          Replacing Spend-Based Cloud Guesswork With Metered On-Prem &amp; Edge Carbon Accounting
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {SCOPE3_TELEMETRY_COMPARISON.map((item) => (
            <div
              key={item.metric}
              className="rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0B1020] p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="text-xs font-bold text-[#16213A] dark:text-[#E7EBF5]">
                  {item.metric}
                </div>
                <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0] mt-2">
                  <span className="font-semibold text-[#16213A] dark:text-[#E7EBF5]">Cloud Baseline: </span>
                  {item.spendBasedCloud}
                </div>
                <div className="text-[11px] text-[#334155] dark:text-[#C8D0E4] mt-1.5">
                  <span className="font-semibold text-[#1C6E46] dark:text-[#6FCB9F]">Spenta Sovereign: </span>
                  {item.spentaActivityBased}
                </div>
              </div>
              <div className="pt-2 border-t border-[#E4DFD6] dark:border-[#232B4A] text-xs font-mono font-bold text-[#1C6E46] dark:text-[#6FCB9F]">
                {item.delta}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
