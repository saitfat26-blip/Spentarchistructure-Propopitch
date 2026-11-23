import { jsPDF } from 'jspdf';

type RGB = [number, number, number];

const COLORS: Record<string, RGB> = {
  forest: [7, 19, 15],
  forestCard: [13, 33, 25],
  forestBorder: [20, 62, 46],
  mist: [244, 247, 245],
  elevated: [238, 243, 241],
  white: [255, 255, 255],
  slateBorder: [203, 213, 225],
  slateText: [71, 85, 105],
  slateMuted: [148, 163, 184],
  emerald: [30, 181, 106],
  emeraldMint: [110, 231, 183],
  emeraldDark: [6, 95, 70],
  teal: [13, 148, 136],
  amberDark: [180, 83, 9],
  amberBg: [255, 251, 235],
  amberBorder: [253, 230, 138],
  emeraldBg: [236, 253, 245],
};

function sanitizePdfText(text: string): string {
  return text
    .replace(/×/g, 'x')
    .replace(/·/g, '|')
    .replace(/—/g, ' - ')
    .replace(/–/g, '-')
    .replace(/→/g, '->')
    .replace(/↔/g, '<->')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/’/g, "'")
    .replace(/“|”/g, '"');
}

export interface QuarterRow {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  weightPct: number;
  revK: number;
  ebitdaK: number;
  netProfitK: number;
  ebitdaMarginPct: number;
}

export interface QuarterlyExecutiveSummaryData {
  fiscalYear: string;
  fiscalLabel: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  scenarioLabel: string;
  fxRate: number;
  taxRate: number;
  dhakaY1UsdK: number;
  annualRevK: number;
  annualEbitdaK: number;
  annualNetProfitK: number;
  cumNetK: number;
  capitalEfficiencyMultiple: number;
  fiveYearCapitalEfficiency: number;
  fiveYearCumNetM: number;
  exitEbitdaMultiple: number;
  dilutionPct?: number;
  effectiveOwnershipPct?: number;
  safeEquityRoiMultiple: number;
  impliedExitEvM: number;
  milestone: string;
  quarters: QuarterRow[];
  selectedQuarterRow: QuarterRow;
  stackModuleCount: number;
  stackModuleNames: string[];
  stackSetupUsd: number;
  stackQuarterlyRetainerUsd?: number;
  stackBlendedGmPct: number;
  recommendedTierCode: string;
  recommendedTierName: string;
  recommendedTierCapex: string;
  generatedAtLabel: string;
}

function formatK(valK: number): string {
  if (valK >= 1000) return `$${(valK / 1000).toFixed(2)}M`;
  return `$${valK.toFixed(1)}K`;
}

export function exportQuarterlySummaryToPdf(data: QuarterlyExecutiveSummaryData): void {
  // Single-page Portrait A4 (210mm x 297mm)
  const W = 210;
  const H = 297;
  const padX = 14;
  const contentW = W - padX * 2;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  doc.setProperties({
    title: `Spenta Technology — ${data.quarter} ${data.fiscalYear} Executive Financial Summary`,
    subject: 'Quarterly Financial Brief — Spenta Sovereign OS',
    author: 'Spenta Technology (spenta.tech)',
    keywords: 'Spenta, Executive Summary, Quarterly Financials, SAFE, Sovereign OS',
  });

  // Page Background
  doc.setFillColor(...COLORS.white);
  doc.rect(0, 0, W, H, 'F');

  // Top Header Banner (Deep Forest #07130F)
  const bannerH = 38;
  doc.setFillColor(...COLORS.forest);
  doc.rect(0, 0, W, bannerH, 'F');

  // Top Emerald Accent Stripe
  doc.setFillColor(...COLORS.emerald);
  doc.rect(0, 0, W, 1.8, 'F');

  // Vector Spenta Emblem
  doc.setFillColor(...COLORS.forestCard);
  doc.setDrawColor(...COLORS.emerald);
  doc.setLineWidth(0.45);
  doc.roundedRect(padX, 8, 8.5, 8.5, 1.8, 1.8, 'FD');
  doc.setDrawColor(...COLORS.emeraldMint);
  doc.setLineWidth(0.55);
  doc.line(padX + 2.2, 8 + 6.3, padX + 6.3, 8 + 2.2);
  doc.setFillColor(...COLORS.emerald);
  doc.circle(padX + 6.3, 8 + 2.2, 0.9, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.white);
  doc.text('spenta', padX + 10.8, 13.8);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.emeraldMint);
  doc.text('SOVEREIGN OS | QUARTERLY EXECUTIVE BRIEF', padX + 28, 13.6);

  // Banner Main Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16.5);
  doc.setTextColor(...COLORS.white);
  doc.text(
    sanitizePdfText(`${data.quarter} ${data.fiscalYear} (${data.fiscalLabel}) Executive Financial Summary`),
    padX,
    25.2,
  );

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.slateMuted);
  doc.text(
    sanitizePdfText(
      `Scenario: ${data.scenarioLabel} | FX: ${data.fxRate} BDT/USD | Tax: ${data.taxRate.toFixed(1)}% | Generated: ${data.generatedAtLabel}`,
    ),
    padX,
    32.2,
  );

  // Quarter Pill Top-Right
  const qBadge = `${data.quarter} ${data.fiscalYear}`;
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  const badgeW = doc.getTextWidth(qBadge) + 8;
  doc.setFillColor(...COLORS.emerald);
  doc.roundedRect(W - padX - badgeW, 8.5, badgeW, 7.2, 1.5, 1.5, 'F');
  doc.setTextColor(...COLORS.forest);
  doc.text(qBadge, W - padX - badgeW / 2, 13.3, { align: 'center' });

  let y = bannerH + 8;

  // Section 1: Selected Quarter KPI Strip (4 Cards)
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.teal);
  doc.text(
    sanitizePdfText(`01 / ${data.quarter} ${data.fiscalYear} HEADLINE PERFORMANCE (${data.selectedQuarterRow.weightPct}% ANNUAL WEIGHT)`),
    padX,
    y,
  );
  y += 4;

  const kpiGap = 3.5;
  const kpiW = (contentW - kpiGap * 3) / 4;
  const kpiH = 24;
  const annualizedRunRateK = data.selectedQuarterRow.revK * 4;

  const kpis = [
    {
      label: `${data.quarter} REVENUE`,
      value: formatK(data.selectedQuarterRow.revK),
      sub: `Run-rate: ${formatK(annualizedRunRateK)}/yr`,
      color: COLORS.forest,
      fill: COLORS.mist,
    },
    {
      label: `${data.quarter} EBITDA`,
      value: formatK(data.selectedQuarterRow.ebitdaK),
      sub: `Margin: ${data.selectedQuarterRow.ebitdaMarginPct.toFixed(1)}%`,
      color: COLORS.teal,
      fill: COLORS.mist,
    },
    {
      label: `${data.quarter} NET PROFIT`,
      value: formatK(data.selectedQuarterRow.netProfitK),
      sub: `After ${data.taxRate.toFixed(1)}% corp. tax`,
      color: COLORS.emeraldDark,
      fill: COLORS.emeraldBg,
    },
    {
      label: `SAFE EXIT ROI (${data.exitEbitdaMultiple}x)`,
      value: `${data.safeEquityRoiMultiple.toFixed(2)}x`,
      sub: `Cap. Eff.: ${data.capitalEfficiencyMultiple.toFixed(2)}x (${data.fiveYearCapitalEfficiency.toFixed(2)}x 5Y)`,
      color: COLORS.forest,
      fill: COLORS.mist,
    },
  ];

  kpis.forEach((kpi, idx) => {
    const x = padX + idx * (kpiW + kpiGap);
    doc.setFillColor(...kpi.fill);
    doc.setDrawColor(...COLORS.slateBorder);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, kpiW, kpiH, 2.2, 2.2, 'FD');

    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.slateText);
    doc.text(sanitizePdfText(kpi.label), x + 3.2, y + 6);

    doc.setFont('courier', 'bold');
    doc.setFontSize(13.5);
    doc.setTextColor(...kpi.color);
    doc.text(sanitizePdfText(kpi.value), x + 3.2, y + 14.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...COLORS.slateText);
    doc.text(sanitizePdfText(kpi.sub), x + 3.2, y + 20.5);
  });

  y += kpiH + 9;

  // Section 2: Full-Year Quarterly Phasing Table
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.teal);
  doc.text(
    sanitizePdfText(`02 / ${data.fiscalYear} QUARTERLY PHASING & ANNUAL RECONCILIATION ($K USD)`),
    padX,
    y,
  );
  y += 4;

  const cols = [
    { label: 'QUARTER', x: padX + 3, align: 'left' as const },
    { label: 'SHARE', x: padX + 42, align: 'right' as const },
    { label: 'REVENUE', x: padX + 78, align: 'right' as const },
    { label: 'EBITDA', x: padX + 114, align: 'right' as const },
    { label: 'EBITDA %', x: padX + 146, align: 'right' as const },
    { label: 'NET PROFIT', x: padX + contentW - 3, align: 'right' as const },
  ];

  // Table header
  doc.setFillColor(...COLORS.forest);
  doc.roundedRect(padX, y, contentW, 8, 1.5, 1.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.emeraldMint);
  cols.forEach((col) => {
    doc.text(col.label, col.x, y + 5.2, { align: col.align });
  });
  y += 8.5;

  data.quarters.forEach((row) => {
    const isSelected = row.quarter === data.quarter;
    const rowH = 8.2;
    if (isSelected) {
      doc.setFillColor(...COLORS.emeraldBg);
      doc.setDrawColor(...COLORS.emerald);
      doc.setLineWidth(0.35);
      doc.rect(padX, y, contentW, rowH, 'FD');
    } else {
      doc.setFillColor(...COLORS.white);
      doc.setDrawColor(...COLORS.slateBorder);
      doc.setLineWidth(0.15);
      doc.line(padX, y + rowH, padX + contentW, y + rowH);
    }

    doc.setFont('courier', isSelected ? 'bold' : 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(...(isSelected ? COLORS.forest : COLORS.slateText));

    doc.text(
      isSelected ? `${row.quarter} ${data.fiscalYear} [ACTIVE]` : `${row.quarter} ${data.fiscalYear}`,
      cols[0].x,
      y + 5.4,
    );
    doc.text(`${row.weightPct}%`, cols[1].x, y + 5.4, { align: 'right' });
    doc.text(formatK(row.revK), cols[2].x, y + 5.4, { align: 'right' });

    doc.setTextColor(...COLORS.teal);
    doc.text(formatK(row.ebitdaK), cols[3].x, y + 5.4, { align: 'right' });
    doc.setTextColor(...COLORS.slateText);
    doc.text(`${row.ebitdaMarginPct.toFixed(1)}%`, cols[4].x, y + 5.4, { align: 'right' });

    doc.setTextColor(...COLORS.emeraldDark);
    doc.setFont('courier', 'bold');
    doc.text(formatK(row.netProfitK), cols[5].x, y + 5.4, { align: 'right' });

    y += rowH;
  });

  // Full Year Total Row
  const fyMargin = data.annualRevK > 0 ? (data.annualEbitdaK / data.annualRevK) * 100 : 0;
  doc.setFillColor(...COLORS.elevated);
  doc.rect(padX, y, contentW, 8.8, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.4);
  doc.setTextColor(...COLORS.forest);
  doc.text(`TOTAL ${data.fiscalYear} (${data.fiscalLabel})`, cols[0].x, y + 5.8);
  doc.text('100%', cols[1].x, y + 5.8, { align: 'right' });
  doc.text(formatK(data.annualRevK), cols[2].x, y + 5.8, { align: 'right' });
  doc.setTextColor(...COLORS.teal);
  doc.text(formatK(data.annualEbitdaK), cols[3].x, y + 5.8, { align: 'right' });
  doc.setTextColor(...COLORS.forest);
  doc.text(`${fyMargin.toFixed(1)}%`, cols[4].x, y + 5.8, { align: 'right' });
  doc.setTextColor(...COLORS.emeraldDark);
  doc.text(formatK(data.annualNetProfitK), cols[5].x, y + 5.8, { align: 'right' });

  y += 16;

  // Section 3: Two-Column Assumptions & Composed Stack Snapshot
  const halfGap = 5;
  const colW = (contentW - halfGap) / 2;
  const panelH = 60;

  // Left Box: Sensitivity & Capital Assumptions
  doc.setFillColor(...COLORS.mist);
  doc.setDrawColor(...COLORS.slateBorder);
  doc.setLineWidth(0.3);
  doc.roundedRect(padX, y, colW, panelH, 2.5, 2.5, 'FD');

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(...COLORS.teal);
  doc.text('03 / MODEL ASSUMPTIONS & CAPITAL', padX + 4, y + 6.8);

  const effOwnPct = data.effectiveOwnershipPct ?? 11.11;
  const dilLabel =
    data.dilutionPct && data.dilutionPct > 0
      ? `${effOwnPct.toFixed(1)}% (-${data.dilutionPct}% dil.)`
      : `~${effOwnPct.toFixed(1)}% pre-dil.`;

  const leftRows: [string, string][] = [
    ['Active Scenario', data.scenarioLabel],
    ['BDT / USD FX Rate', `${data.fxRate} BDT (120 base)`],
    ['Effective Corp. Tax', `${data.taxRate.toFixed(1)}% (25.0% base)`],
    ['20-FTE Dhaka Burn', `$${data.dhakaY1UsdK}K/yr ($12.98/hr loaded)`],
    [`SAFE (${dilLabel})`, '$500K | $4.5M Cap | 20% Disc.'],
    ['5Y Cap. Eff. / Exit ROI', `${data.fiveYearCapitalEfficiency.toFixed(2)}x CapEff | ${data.safeEquityRoiMultiple.toFixed(2)}x SAFE`],
  ];

  let ly = y + 14;
  leftRows.forEach(([k, v]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.slateText);
    doc.text(sanitizePdfText(k), padX + 4, ly);

    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.forest);
    doc.text(sanitizePdfText(v), padX + colW - 4, ly, { align: 'right' });
    ly += 7.2;
  });

  // Right Box: Composed Stack Snapshot
  const rx = padX + colW + halfGap;
  doc.setFillColor(...COLORS.mist);
  doc.setDrawColor(...COLORS.slateBorder);
  doc.setLineWidth(0.3);
  doc.roundedRect(rx, y, colW, panelH, 2.5, 2.5, 'FD');

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(...COLORS.emeraldDark);
  doc.text('04 / COMPOSED STACK CONTEXT', rx + 4, y + 6.8);

  const buildText =
    data.stackQuarterlyRetainerUsd && data.stackQuarterlyRetainerUsd > 0
      ? `$${(data.stackSetupUsd / 1000).toFixed(1)}K + $${(data.stackQuarterlyRetainerUsd / 1000).toFixed(1)}K/qtr`
      : `$${(data.stackSetupUsd / 1000).toFixed(1)}K one-time`;

  const rightRows: [string, string][] = [
    ['Selected Modules', `${data.stackModuleCount} / 13 Spenta Apps`],
    ['One-Time + Retainers', buildText],
    ['Rev-Weighted GM (Y1)', `${data.stackBlendedGmPct.toFixed(1)}%`],
    ['Recommended Hardware', `${data.recommendedTierCode} (${data.recommendedTierCapex})`],
  ];

  let ry = y + 14;
  rightRows.forEach(([k, v]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.slateText);
    doc.text(sanitizePdfText(k), rx + 4, ry);

    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.forest);
    doc.text(sanitizePdfText(v), rx + colW - 4, ry, { align: 'right' });
    ry += 7.2;
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(...COLORS.slateText);
  doc.text('ACTIVE MODULES:', rx + 4, ry + 1.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...COLORS.forest);
  const modListText =
    data.stackModuleNames.length > 0
      ? data.stackModuleNames.join(', ')
      : 'No modules selected in Stack Composer';
  const modLines = doc.splitTextToSize(sanitizePdfText(modListText), colW - 8).slice(0, 3);
  doc.text(modLines, rx + 4, ry + 6);

  y += panelH + 8;

  // Section 4: Strategic Milestone & FX Hedge Narrative
  doc.setFillColor(...COLORS.forest);
  doc.roundedRect(padX, y, contentW, 24, 2.5, 2.5, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.6);
  doc.setTextColor(...COLORS.emeraldMint);
  doc.text(sanitizePdfText(`05 / ${data.fiscalYear} OPERATING MILESTONE & EXECUTION FOCUS`), padX + 4.5, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.6);
  doc.setTextColor(...COLORS.white);
  const mLines = doc
    .splitTextToSize(
      sanitizePdfText(
        `${data.milestone}. Quarterly phasing assumes 21%/24%/26%/29% seasonal ramp across Q1-Q4. Enterprise USD/AUD/EUR billings naturally hedge BDT engineering payroll ($12.98/hr fully loaded across 20-FTE Dhaka R&D Hub; $11.50/hr base payroll).`,
      ),
      contentW - 9,
    )
    .slice(0, 3);
  doc.text(mLines, padX + 4.5, y + 12.2);

  y += 30;

  // Governance & Risk Callout Box
  doc.setFillColor(...COLORS.amberBg);
  doc.setDrawColor(...COLORS.amberBorder);
  doc.setLineWidth(0.35);
  doc.roundedRect(padX, y, contentW, 18, 2.2, 2.2, 'FD');

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.amberDark);
  doc.text('SOVEREIGN GOVERNANCE & CLIENT ROI BENCHMARK', padX + 4, y + 5.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(...COLORS.forest);
  const gLines = doc
    .splitTextToSize(
      sanitizePdfText(
        'All deployments inherit L1-L6 Sovereign Core with OPA Policy-as-Code (>=0.88 HITL confidence gate) and zero external LLM cloud egress. Enterprise client ROI averages 250%-350% (verified banking proofs: 450%-580%).',
      ),
      contentW - 8,
    )
    .slice(0, 2);
  doc.text(gLines, padX + 4, y + 11.2);

  // Footer
  const footY = H - 11;
  doc.setDrawColor(...COLORS.slateBorder);
  doc.setLineWidth(0.25);
  doc.line(padX, footY - 4, W - padX, footY - 4);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.slateText);
  doc.text('Spenta Technology (spenta.tech) | Sovereign Forest & Slate', padX, footY);
  doc.text('Confidential Quarterly Brief | hello@spenta.tech', W - padX, footY, {
    align: 'right',
  });

  const safeScenario = data.scenarioLabel.toLowerCase().includes('upside') ? 'Upside' : 'Conservative';
  doc.save(`Spenta-${data.quarter}-${data.fiscalYear}-${safeScenario}-Executive-Summary.pdf`);
}
