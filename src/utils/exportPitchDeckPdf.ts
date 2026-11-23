import { jsPDF } from 'jspdf';
import { PitchSlide, SPENTA_CONTACT_EMAIL, SPENTA_LOGO_URL } from '../data/spentaManifest';

type RGB = [number, number, number];

export type PdfThemeOption = 'auto' | 'dark' | 'light';

export interface StackAppendixData {
  moduleCount: number;
  modules: {
    shortName: string;
    category: string;
    setupUsd: number;
    gmPct: number;
    minServerTier: number;
    layers: string[];
  }[];
  totalSetupUsd: number;
  quarterlyRetainerUsd?: number;
  blendedGmPct: number;
  tierCode: string;
  tierName: string;
  tierHardware: string;
  tierCapex: string;
  tierSpeed: string;
  activeLayers: string[];
  synergyPairs: [string, string][];
}

export interface ExportDeckOptions {
  slides: PitchSlide[];
  totalDeckSlides?: number;
  includeSpeakerNotes: boolean;
  pdfTheme?: PdfThemeOption;
  stackAppendix?: StackAppendixData | null;
  filename?: string;
  onProgress?: (current: number, total: number) => void;
}

const COLORS: Record<string, RGB> = {
  obsidian: [9, 9, 11],
  obsidianCard: [17, 19, 21],
  obsidianInset: [24, 24, 27],
  obsidianBorder: [39, 39, 42],
  obsidianGrid: [22, 24, 28],
  white: [255, 255, 255],
  zincLight: [248, 250, 252],
  zincSubtle: [244, 244, 245],
  zincBorder: [228, 228, 231],
  zinc900: [24, 24, 27],
  zinc700: [63, 63, 70],
  zinc500: [113, 113, 122],
  zinc400: [161, 161, 170],
  zinc200: [228, 228, 231],
  emerald: [16, 185, 129],
  emeraldMint: [52, 211, 153],
  emeraldDark: [6, 95, 70],
  emeraldTintDark: [12, 34, 27],
  emeraldTintLight: [236, 253, 245],
  teal: [13, 148, 136],
  tealBright: [94, 234, 212],
  amber: [245, 158, 11],
  amberDark: [180, 83, 9],
  amberLight: [252, 211, 77],
  crimson: [225, 29, 72],
  crimsonLight: [251, 113, 133],
};

function sanitizePdfText(text: string): string {
  return text
    .replace(/×/g, 'x')
    .replace(/·/g, ' | ')
    .replace(/—/g, ' - ')
    .replace(/–/g, '-')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/↔/g, '<->')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/•/g, '-')
    .replace(/’|‘/g, "'")
    .replace(/“|”/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function getKpiColor(
  accent: 'emerald' | 'teal' | 'amber' | 'crimson' | undefined,
  isDark: boolean,
): RGB {
  if (isDark) {
    if (accent === 'crimson') return COLORS.crimsonLight;
    if (accent === 'amber') return COLORS.amberLight;
    if (accent === 'teal') return COLORS.tealBright;
    return COLORS.emeraldMint;
  }
  if (accent === 'crimson') return COLORS.crimson;
  if (accent === 'amber') return COLORS.amberDark;
  if (accent === 'teal') return COLORS.teal;
  return COLORS.emeraldDark;
}

async function tryLoadLogoDataUrl(url: string): Promise<{ dataUrl: string; ratio: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timeout = window.setTimeout(() => resolve(null), 1800);
    img.onload = () => {
      window.clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 240;
        canvas.height = img.naturalHeight || 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve({ dataUrl, ratio: canvas.width / Math.max(1, canvas.height) });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => {
      window.clearTimeout(timeout);
      resolve(null);
    };
    img.src = url;
  });
}

function drawObsidianGrid(doc: jsPDF, W: number, H: number) {
  doc.setDrawColor(...COLORS.obsidianGrid);
  doc.setLineWidth(0.12);
  const step = 12;
  for (let x = step; x < W; x += step) {
    doc.line(x, 1.5, x, H);
  }
  for (let y = step; y < H; y += step) {
    doc.line(0, y, W, y);
  }
}

function drawBrandMark(
  doc: jsPDF,
  x: number,
  y: number,
  isDark: boolean,
  logoAsset: { dataUrl: string; ratio: number } | null,
): number {
  if (logoAsset) {
    const logoH = 7.4;
    const logoW = Math.min(34, logoH * logoAsset.ratio);
    try {
      doc.addImage(logoAsset.dataUrl, 'PNG', x, y + 0.4, logoW, logoH);
      return logoW + 4;
    } catch {
      // fall through to crisp vector mark
    }
  }

  doc.setFillColor(...(isDark ? COLORS.obsidianCard : COLORS.obsidian));
  doc.setDrawColor(...COLORS.emerald);
  doc.setLineWidth(0.45);
  doc.roundedRect(x, y, 8.2, 8.2, 1.6, 1.6, 'FD');

  doc.setDrawColor(...COLORS.emeraldMint);
  doc.setLineWidth(0.55);
  doc.line(x + 2.1, y + 6.1, x + 6.1, y + 2.1);
  doc.setFillColor(...COLORS.emerald);
  doc.circle(x + 6.1, y + 2.1, 0.9, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...(isDark ? COLORS.white : COLORS.obsidian));
  doc.text('spenta', x + 10.4, y + 5.7);
  return 28;
}

function drawFooter(
  doc: jsPDF,
  W: number,
  H: number,
  padX: number,
  isDark: boolean,
  progressRatio: number,
  dateLabel: string,
) {
  const footY = H - 8.5;

  // Hairline divider
  doc.setDrawColor(...(isDark ? COLORS.obsidianBorder : COLORS.zincBorder));
  doc.setLineWidth(0.25);
  doc.line(padX, footY - 4.2, W - padX, footY - 4.2);

  // Subtle progress accent segment along the divider
  const progW = Math.max(8, (W - padX * 2) * Math.min(1, Math.max(0, progressRatio)));
  doc.setDrawColor(...COLORS.emerald);
  doc.setLineWidth(0.55);
  doc.line(padX, footY - 4.2, padX + progW, footY - 4.2);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(...(isDark ? COLORS.zinc400 : COLORS.zinc500));
  doc.text(`spenta.tech | Sovereign OS Investor Deck | ${dateLabel}`, padX, footY);
  doc.text(`Confidential Investor Briefing | ${SPENTA_CONTACT_EMAIL}`, W - padX, footY, {
    align: 'right',
  });
}

function drawStackAppendixSlide(
  doc: jsPDF,
  W: number,
  H: number,
  padX: number,
  contentW: number,
  appendix: StackAppendixData,
  isDark: boolean,
  logoAsset: { dataUrl: string; ratio: number } | null,
  pageNumber: number,
  totalPages: number,
  dateLabel: string,
) {
  doc.addPage([W, H], 'landscape');

  doc.setFillColor(...(isDark ? COLORS.obsidian : COLORS.white));
  doc.rect(0, 0, W, H, 'F');
  if (isDark) drawObsidianGrid(doc, W, H);

  doc.setFillColor(...COLORS.emerald);
  doc.rect(0, 0, W, 1.4, 'F');

  const brandW = drawBrandMark(doc, padX, 9.5, isDark, logoAsset);

  const badgeText = 'CUSTOM STACK APPENDIX';
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  const badgeW = doc.getTextWidth(badgeText) + 7;
  doc.setFillColor(...(isDark ? COLORS.emeraldTintDark : COLORS.emeraldTintLight));
  doc.setDrawColor(...COLORS.emerald);
  doc.setLineWidth(0.3);
  doc.roundedRect(padX + brandW, 10.6, badgeW, 6, 1.3, 1.3, 'FD');
  doc.setTextColor(...(isDark ? COLORS.emeraldMint : COLORS.emeraldDark));
  doc.text(badgeText, padX + brandW + 3.5, 14.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...(isDark ? COLORS.zinc400 : COLORS.zinc500));
  doc.text(
    `${String(pageNumber).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`,
    W - padX,
    14.8,
    { align: 'right' },
  );

  let y = 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18.5);
  doc.setTextColor(...(isDark ? COLORS.white : COLORS.obsidian));
  doc.text('Composed Sovereign Architecture & Hardware Sizing', padX, y);
  y += 6.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...(isDark ? COLORS.zinc400 : COLORS.zinc700));
  doc.text(
    sanitizePdfText(
      `Live Stack Composer snapshot attached to this investor deck: ${appendix.moduleCount}/13 modules, ${appendix.activeLayers.join('/')} active core layers.`,
    ),
    padX,
    y,
  );
  y += 7;

  const buildVal =
    appendix.quarterlyRetainerUsd && appendix.quarterlyRetainerUsd > 0
      ? `$${(appendix.totalSetupUsd / 1000).toFixed(1)}K + $${(appendix.quarterlyRetainerUsd / 1000).toFixed(1)}K/qtr`
      : `$${(appendix.totalSetupUsd / 1000).toFixed(1)}K`;

  const kpis = [
    { label: 'SELECTED MODULES', val: `${appendix.moduleCount} / 13 Apps`, accent: 'emerald' as const },
    {
      label: 'BUILD + RETAINERS',
      val: buildVal,
      accent: 'teal' as const,
    },
    {
      label: 'REV-WEIGHTED GM (Y1)',
      val: `${appendix.blendedGmPct.toFixed(1)}%`,
      accent: 'emerald' as const,
    },
    {
      label: 'RECOMMENDED SERVER',
      val: `${appendix.tierCode} (${appendix.tierCapex})`,
      accent: 'amber' as const,
    },
  ];
  const gap = 4.5;
  const kpiW = (contentW - gap * 3) / 4;
  kpis.forEach((kpi, idx) => {
    const kx = padX + idx * (kpiW + gap);
    doc.setFillColor(...(isDark ? COLORS.obsidianCard : COLORS.zincLight));
    doc.setDrawColor(...(isDark ? COLORS.obsidianBorder : COLORS.zincBorder));
    doc.setLineWidth(0.35);
    doc.roundedRect(kx, y, kpiW, 19.5, 2.2, 2.2, 'FD');

    doc.setFont('courier', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...(isDark ? COLORS.zinc400 : COLORS.zinc500));
    doc.text(kpi.label, kx + 3.8, y + 6);

    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...getKpiColor(kpi.accent, isDark));
    doc.text(sanitizePdfText(kpi.val), kx + 3.8, y + 14.3);
  });
  y += 24;

  // Two-column split: Selected Modules Table (Left) | Hardware & Synergies (Right)
  const leftW = contentW * 0.62;
  const rightW = contentW - leftW - 6;
  const rightX = padX + leftW + 6;

  // Left: Modules Table
  doc.setFillColor(...(isDark ? COLORS.obsidianCard : COLORS.zincLight));
  doc.setDrawColor(...(isDark ? COLORS.obsidianBorder : COLORS.zincBorder));
  doc.setLineWidth(0.3);
  doc.roundedRect(padX, y, leftW, 82, 2.2, 2.2, 'FD');

  doc.setFillColor(...(isDark ? COLORS.obsidianInset : COLORS.obsidian));
  doc.roundedRect(padX, y, leftW, 7.5, 2.2, 2.2, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(...COLORS.emeraldMint);
  doc.text('MODULE', padX + 3.5, y + 5);
  doc.text('LAYERS', padX + leftW - 58, y + 5);
  doc.text('BUILD', padX + leftW - 30, y + 5, { align: 'right' });
  doc.text('GM%', padX + leftW - 3.5, y + 5, { align: 'right' });

  let rowY = y + 13;
  appendix.modules.slice(0, 9).forEach((m, i) => {
    if (i > 0) {
      doc.setDrawColor(...(isDark ? COLORS.obsidianBorder : COLORS.zincBorder));
      doc.setLineWidth(0.15);
      doc.line(padX + 2.5, rowY - 4.4, padX + leftW - 2.5, rowY - 4.4);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.4);
    doc.setTextColor(...(isDark ? COLORS.white : COLORS.obsidian));
    doc.text(sanitizePdfText(m.shortName), padX + 3.5, rowY);

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(...(isDark ? COLORS.zinc400 : COLORS.zinc500));
    doc.text(m.layers.join('/'), padX + leftW - 58, rowY);

    doc.setTextColor(...(isDark ? COLORS.zinc200 : COLORS.zinc900));
    doc.text(`$${(m.setupUsd / 1000).toFixed(1)}K`, padX + leftW - 30, rowY, { align: 'right' });

    doc.setFont('courier', 'bold');
    doc.setTextColor(...(isDark ? COLORS.emeraldMint : COLORS.emeraldDark));
    doc.text(`${m.gmPct.toFixed(1)}%`, padX + leftW - 3.5, rowY, { align: 'right' });

    rowY += 7.5;
  });

  if (appendix.modules.length > 9) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...(isDark ? COLORS.zinc400 : COLORS.zinc500));
    doc.text(`+ ${appendix.modules.length - 9} additional selected modules`, padX + 3.5, y + 79);
  }

  // Right Top: Recommended Hardware Spec
  doc.setFillColor(...(isDark ? COLORS.emeraldTintDark : COLORS.obsidian));
  doc.setDrawColor(...COLORS.emerald);
  doc.setLineWidth(0.35);
  doc.roundedRect(rightX, y, rightW, 38, 2.2, 2.2, 'FD');

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(...COLORS.emeraldMint);
  doc.text('ON-PREMISE SERVER BASELINE', rightX + 4, y + 6.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...COLORS.white);
  const tierTitle = doc.splitTextToSize(
    sanitizePdfText(`${appendix.tierCode} - ${appendix.tierName}`),
    rightW - 8,
  );
  doc.text(tierTitle, rightX + 4, y + 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(...COLORS.zinc200);
  const hwLines = doc.splitTextToSize(sanitizePdfText(appendix.tierHardware), rightW - 8).slice(0, 2);
  doc.text(hwLines, rightX + 4, y + 22);

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.amberLight);
  doc.text(sanitizePdfText(`CapEx: ${appendix.tierCapex} | ${appendix.tierSpeed}`), rightX + 4, y + 33.5);

  // Right Bottom: Native Integrations
  const synY = y + 42;
  doc.setFillColor(...(isDark ? COLORS.obsidianCard : COLORS.zincLight));
  doc.setDrawColor(...(isDark ? COLORS.obsidianBorder : COLORS.zincBorder));
  doc.setLineWidth(0.3);
  doc.roundedRect(rightX, synY, rightW, 40, 2.2, 2.2, 'FD');

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(...(isDark ? COLORS.emeraldMint : COLORS.emeraldDark));
  doc.text(`VERIFIED SYNERGIES (${appendix.synergyPairs.length})`, rightX + 4, synY + 6.2);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(...(isDark ? COLORS.zinc200 : COLORS.zinc700));
  if (appendix.synergyPairs.length === 0) {
    doc.text('Standalone deployment profile.', rightX + 4, synY + 13);
  } else {
    let sy = synY + 12.5;
    appendix.synergyPairs.slice(0, 5).forEach(([a, b]) => {
      doc.text(sanitizePdfText(`${a} <-> ${b}`), rightX + 4, sy);
      sy += 5.2;
    });
  }

  drawFooter(doc, W, H, padX, isDark, 1, dateLabel);
}

export async function exportPitchDeckToPdf({
  slides,
  totalDeckSlides,
  includeSpeakerNotes,
  pdfTheme = 'auto',
  stackAppendix = null,
  filename = 'Spenta-Sovereign-OS-Investor-Deck.pdf',
  onProgress,
}: ExportDeckOptions): Promise<void> {
  // True 16:9 widescreen boardroom PDF (297mm x 167.06mm)
  const W = 297;
  const H = 167.06;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [W, H],
    compress: true,
  });

  const dateLabel = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });

  doc.setProperties({
    title: 'Spenta Technology - Sovereign OS Master Investor Deck',
    subject: 'Composable Sovereign AI, ERP, Fintech, Voice & Spatial XR',
    author: 'Spenta Technology (spenta.tech)',
    keywords: 'Spenta, Sovereign OS, AI, ERP, Spatial XR, SAFE, Investor Deck',
  });

  const logoAsset = await tryLoadLogoDataUrl(SPENTA_LOGO_URL);

  const hasAppendix = Boolean(stackAppendix && stackAppendix.moduleCount > 0);
  const totalExportPages = slides.length + (hasAppendix ? 1 : 0);
  const denominator = totalDeckSlides ?? slides.length;
  const padX = 16;
  const contentW = W - padX * 2;

  for (let idx = 0; idx < slides.length; idx++) {
    const slide = slides[idx];
    onProgress?.(idx + 1, totalExportPages);

    if (idx > 0) doc.addPage([W, H], 'landscape');

    const isDark =
      pdfTheme === 'dark' ? true : pdfTheme === 'light' ? false : slide.theme === 'dark';

    // Page Background
    doc.setFillColor(...(isDark ? COLORS.obsidian : COLORS.white));
    doc.rect(0, 0, W, H, 'F');
    if (isDark) drawObsidianGrid(doc, W, H);

    // Top Precision Emerald Accent Bar
    doc.setFillColor(...COLORS.emerald);
    doc.rect(0, 0, W, 1.4, 'F');

    // Header: Official Logo / Emblem + Section Tag + Slide Counter
    const brandW = drawBrandMark(doc, padX, 9.5, isDark, logoAsset);

    const secLabel = sanitizePdfText(slide.section.toUpperCase());
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    const pillW = doc.getTextWidth(secLabel) + 7;
    doc.setFillColor(...(isDark ? COLORS.emeraldTintDark : COLORS.emeraldTintLight));
    doc.setDrawColor(...COLORS.emerald);
    doc.setLineWidth(0.3);
    doc.roundedRect(padX + brandW, 10.6, pillW, 6, 1.3, 1.3, 'FD');
    doc.setTextColor(...(isDark ? COLORS.emeraldMint : COLORS.emeraldDark));
    doc.text(secLabel, padX + brandW + 3.5, 14.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(9.2);
    doc.setTextColor(...(isDark ? COLORS.zinc400 : COLORS.zinc500));
    const pageTag = `${String(slide.num).padStart(2, '0')} / ${String(denominator).padStart(2, '0')}`;
    doc.text(pageTag, W - padX, 14.8, { align: 'right' });

    // Title & Subtitle
    let cursorY = 29;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(19.5);
    doc.setTextColor(...(isDark ? COLORS.white : COLORS.obsidian));
    const titleLines = doc.splitTextToSize(sanitizePdfText(slide.title), contentW);
    doc.text(titleLines, padX, cursorY);
    cursorY += titleLines.length * 7.8 + 1.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.6);
    doc.setTextColor(...(isDark ? COLORS.zinc400 : COLORS.zinc700));
    const subLines = doc.splitTextToSize(sanitizePdfText(slide.subtitle), contentW - 6);
    doc.text(subLines, padX, cursorY);
    cursorY += subLines.length * 4.9 + 5;

    // KPI Callout Cards
    if (slide.kpis && slide.kpis.length > 0) {
      const gap = 4.5;
      const count = slide.kpis.length;
      const cardW = (contentW - gap * (count - 1)) / count;
      const cardH = 20.5;

      slide.kpis.forEach((kpi, kIdx) => {
        const kx = padX + kIdx * (cardW + gap);
        doc.setFillColor(...(isDark ? COLORS.obsidianCard : COLORS.zincLight));
        doc.setDrawColor(...(isDark ? COLORS.obsidianBorder : COLORS.zincBorder));
        doc.setLineWidth(0.35);
        doc.roundedRect(kx, cursorY, cardW, cardH, 2.2, 2.2, 'FD');

        doc.setFont('courier', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(...(isDark ? COLORS.zinc400 : COLORS.zinc500));
        doc.text(sanitizePdfText(kpi.label.toUpperCase()), kx + 4, cursorY + 6.2);

        doc.setFont('courier', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...getKpiColor(kpi.accent, isDark));
        doc.text(sanitizePdfText(kpi.value), kx + 4, cursorY + 14.8);
      });

      cursorY += cardH + 6.5;
    }

    // Reserve bottom space cleanly for speaker notes & footer
    const notesReserved = includeSpeakerNotes && slide.speakerNotes ? 20 : 0;
    const footerSafeY = H - 15 - notesReserved;

    // Callout pre-measurement so bullets never collide with callout
    let calloutLines: string[] = [];
    let calloutBoxH = 0;
    if (slide.callout) {
      const calloutText = `${sanitizePdfText(slide.callout.label.toUpperCase())}: ${sanitizePdfText(
        slide.callout.text,
      )}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      calloutLines = doc.splitTextToSize(calloutText, contentW - 10);
      calloutBoxH = Math.max(11, calloutLines.length * 4.4 + 5.2);
    }

    const bulletCeiling = slide.callout ? footerSafeY - calloutBoxH - 4 : footerSafeY - 2;

    // Bullet List
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.2);

    for (const bullet of slide.bullets) {
      const lines = doc.splitTextToSize(sanitizePdfText(bullet), contentW - 8);
      const blockH = lines.length * 4.8 + 2.8;
      if (cursorY + blockH > bulletCeiling + 4) break;

      doc.setFillColor(...COLORS.emerald);
      doc.circle(padX + 2.1, cursorY - 1.3, 1.0, 'F');

      doc.setTextColor(...(isDark ? COLORS.zinc200 : COLORS.zinc900));
      doc.text(lines, padX + 6.2, cursorY);
      cursorY += blockH;
    }

    // Optional Callout Box
    if (slide.callout && calloutLines.length > 0 && cursorY + calloutBoxH <= footerSafeY + 2) {
      const boxY = Math.min(cursorY + 1.5, footerSafeY - calloutBoxH - 1.5);
      doc.setFillColor(...(isDark ? COLORS.emeraldTintDark : COLORS.emeraldTintLight));
      doc.setDrawColor(...COLORS.emerald);
      doc.setLineWidth(0.35);
      doc.roundedRect(padX, boxY, contentW, calloutBoxH, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(...(isDark ? COLORS.emeraldMint : COLORS.emeraldDark));
      doc.text(calloutLines, padX + 4.5, boxY + 5.8);
    }

    // Optional Speaker Notes Band
    if (includeSpeakerNotes && slide.speakerNotes) {
      const noteY = H - 31.5;
      doc.setFillColor(...(isDark ? COLORS.obsidianCard : COLORS.zincSubtle));
      doc.setDrawColor(...(isDark ? COLORS.obsidianBorder : COLORS.zincBorder));
      doc.setLineWidth(0.25);
      doc.roundedRect(padX, noteY, contentW, 16, 1.8, 1.8, 'FD');

      doc.setFont('courier', 'bold');
      doc.setFontSize(7.1);
      doc.setTextColor(...(isDark ? COLORS.emeraldMint : COLORS.emeraldDark));
      doc.text('PRESENTER NOTES:', padX + 3.5, noteY + 4.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...(isDark ? COLORS.zinc400 : COLORS.zinc700));
      const nLines = doc
        .splitTextToSize(sanitizePdfText(slide.speakerNotes), contentW - 7)
        .slice(0, 2);
      doc.text(nLines, padX + 3.5, noteY + 9.4);
    }

    drawFooter(doc, W, H, padX, isDark, (idx + 1) / totalExportPages, dateLabel);
  }

  // Optional Appended Stack Composer Summary Slide
  if (hasAppendix && stackAppendix) {
    onProgress?.(totalExportPages, totalExportPages);
    const appendixDark = pdfTheme === 'light' ? false : true;
    drawStackAppendixSlide(
      doc,
      W,
      H,
      padX,
      contentW,
      stackAppendix,
      appendixDark,
      logoAsset,
      totalExportPages,
      totalExportPages,
      dateLabel,
    );
  }

  const pdfBlob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
  triggerPdfBlobDownload(pdfBlob, filename);
}

export interface SerializedPrintSlide {
  section: string;
  counter: string;
  title: string;
  subtitle: string;
  kpis: {
    label: string;
    value: string;
    accent: 'emerald' | 'teal' | 'amber' | 'crimson';
  }[];
  bullets: string[];
  callout: { label: string; text: string } | null;
  speakerNotes: string | null;
}

export function triggerPdfBlobDownload(pdfBlob: Blob, filename: string): void {
  const blobUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
}

export function serializePrintDeckDom(
  containerSelector = '.pitch-deck-print-deck',
): SerializedPrintSlide[] {
  const container = document.querySelector(containerSelector);
  if (!container) return [];

  const slideEls = Array.from(container.querySelectorAll<HTMLElement>('.pitch-deck-print-slide'));
  return slideEls.map((el, index) => {
    const section =
      el.querySelector('.pitch-deck-print-badge')?.textContent?.trim() ?? 'INVESTOR DECK';
    const counter =
      el.querySelector('.pitch-deck-print-counter')?.textContent?.trim() ??
      `${String(index + 1).padStart(2, '0')} / ${slideEls.length}`;
    const title = el.querySelector('h2')?.textContent?.trim() ?? `Slide ${index + 1}`;
    const subtitle = el.querySelector('.pitch-deck-print-subtitle')?.textContent?.trim() ?? '';

    const kpis = Array.from(el.querySelectorAll<HTMLElement>('.pitch-deck-print-kpi')).map(
      (kpiEl) => {
        const label =
          kpiEl.querySelector('.pitch-deck-print-kpi-label')?.textContent?.trim() ?? '';
        const valEl = kpiEl.querySelector<HTMLElement>('.pitch-deck-print-kpi-value');
        const value = valEl?.textContent?.trim() ?? '';
        let accent: 'emerald' | 'teal' | 'amber' | 'crimson' = 'emerald';
        if (valEl?.classList.contains('print-accent-crimson')) accent = 'crimson';
        else if (valEl?.classList.contains('print-accent-amber')) accent = 'amber';
        else if (valEl?.classList.contains('print-accent-teal')) accent = 'teal';
        return { label, value, accent };
      },
    );

    const bullets = Array.from(
      el.querySelectorAll<HTMLElement>('.pitch-deck-print-bullet-text'),
    )
      .map((b) => b.textContent?.trim() ?? '')
      .filter(Boolean);

    const calloutEl = el.querySelector<HTMLElement>('.pitch-deck-print-callout');
    let callout: { label: string; text: string } | null = null;
    if (calloutEl) {
      const labelRaw =
        calloutEl.querySelector('.pitch-deck-print-callout-label')?.textContent?.trim() ?? '';
      const label = labelRaw.replace(/:$/, '').trim();
      const fullText = calloutEl.textContent?.trim() ?? '';
      const text = labelRaw ? fullText.replace(labelRaw, '').trim() : fullText;
      if (label || text) {
        callout = { label: label || 'HIGHLIGHT', text };
      }
    }

    const speakerNotes =
      el.querySelector('.pitch-deck-print-notes p')?.textContent?.trim() ?? null;

    return {
      section,
      counter,
      title,
      subtitle,
      kpis,
      bullets,
      callout,
      speakerNotes,
    };
  });
}

export async function downloadSerializedPrintDeckPdf(options?: {
  containerSelector?: string;
  filename?: string;
  onProgress?: (current: number, total: number) => void;
}): Promise<Blob> {
  const {
    containerSelector = '.pitch-deck-print-deck',
    filename = 'Spenta-Sovereign-OS-Print-Deck.pdf',
    onProgress,
  } = options ?? {};

  const serializedSlides = serializePrintDeckDom(containerSelector);
  if (serializedSlides.length === 0) {
    throw new Error('No .pitch-deck-print-deck slide elements found to serialize.');
  }

  const W = 297;
  const H = 167.06;
  const padX = 16;
  const contentW = W - padX * 2;
  const totalPages = serializedSlides.length;
  const dateLabel = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const logoAsset = await tryLoadLogoDataUrl(SPENTA_LOGO_URL);

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [W, H],
    compress: true,
  });

  doc.setProperties({
    title: 'Spenta Sovereign OS — Print-Serialized Investor Pitch Deck',
    subject: 'Serialized .pitch-deck-print-deck Investor Presentation',
    author: 'Spenta Technology (spenta.tech)',
    creator: 'Spenta Sovereign OS Print Serializer',
  });

  for (let idx = 0; idx < serializedSlides.length; idx++) {
    const s = serializedSlides[idx];
    onProgress?.(idx + 1, totalPages);
    if (idx > 0) doc.addPage([W, H], 'landscape');

    // Paper-safe high-contrast white slide matching .pitch-deck-print-slide
    doc.setFillColor(...COLORS.white);
    doc.rect(0, 0, W, H, 'F');

    // Top emerald accent bar (matching border-top: 3.5pt solid #059669)
    doc.setFillColor(...COLORS.emerald);
    doc.rect(0, 0, W, 2.2, 'F');

    // Outer subtle border
    doc.setDrawColor(...COLORS.zincBorder);
    doc.setLineWidth(0.25);
    doc.rect(5, 5, W - 10, H - 10, 'S');

    // Brand + section badge + counter
    const brandW = drawBrandMark(doc, padX, 11.5, false, logoAsset);
    const badgeX = padX + brandW;
    const sectionText = sanitizePdfText(s.section.toUpperCase());
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.6);
    const badgeW = Math.min(90, doc.getTextWidth(sectionText) + 7);
    doc.setFillColor(...COLORS.emeraldTintLight);
    doc.setDrawColor(...COLORS.emerald);
    doc.setLineWidth(0.22);
    doc.roundedRect(badgeX, 10.6, badgeW, 5.8, 1.2, 1.2, 'FD');
    doc.setTextColor(...COLORS.emeraldDark);
    doc.text(sectionText, badgeX + 3.5, 14.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.zinc700);
    doc.text(sanitizePdfText(s.counter), W - padX, 14.5, { align: 'right' });

    doc.setDrawColor(...COLORS.zincBorder);
    doc.setLineWidth(0.2);
    doc.line(padX, 21.5, W - padX, 21.5);

    // Title & Subtitle
    let y = 31;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20.5);
    doc.setTextColor(...COLORS.zinc900);
    const titleLines = doc.splitTextToSize(sanitizePdfText(s.title), contentW);
    doc.text(titleLines, padX, y);
    y += titleLines.length * 7.8 + 1.5;

    if (s.subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(...COLORS.zinc700);
      const subLines = doc.splitTextToSize(sanitizePdfText(s.subtitle), contentW - 8);
      doc.text(subLines, padX, y);
      y += subLines.length * 4.8 + 4.5;
    }

    // KPI Cards
    if (s.kpis.length > 0) {
      const kpiCount = Math.min(4, s.kpis.length);
      const gap = 4;
      const cardW = (contentW - gap * (kpiCount - 1)) / kpiCount;
      const cardH = 19.5;

      s.kpis.slice(0, 4).forEach((kpi, kIdx) => {
        const x = padX + kIdx * (cardW + gap);
        doc.setFillColor(...COLORS.zincLight);
        doc.setDrawColor(...COLORS.zincBorder);
        doc.setLineWidth(0.25);
        doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD');

        doc.setFont('courier', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(...COLORS.zinc500);
        doc.text(sanitizePdfText(kpi.label.toUpperCase()).slice(0, 34), x + 3.5, y + 6);

        doc.setFont('courier', 'bold');
        doc.setFontSize(13.5);
        doc.setTextColor(...getKpiColor(kpi.accent, false));
        doc.text(sanitizePdfText(kpi.value), x + 3.5, y + 14.2);
      });
      y += cardH + 5.5;
    }

    // Reserve footer + optional notes + optional callout
    const footerReserve = s.speakerNotes ? 34 : 16;
    const calloutReserve = s.callout ? 14 : 0;
    const maxBulletY = H - footerReserve - calloutReserve;

    // Bullets
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.8);
    for (const bullet of s.bullets) {
      const wrapped = doc.splitTextToSize(sanitizePdfText(bullet), contentW - 7);
      const blockH = wrapped.length * 4.5 + 2.2;
      if (y + blockH > maxBulletY) break;

      doc.setFillColor(...COLORS.emerald);
      doc.circle(padX + 1.4, y - 1.2, 0.9, 'F');
      doc.setTextColor(...COLORS.zinc900);
      doc.text(wrapped, padX + 5.2, y);
      y += blockH;
    }

    // Callout Box
    if (s.callout) {
      const calloutY = Math.min(y + 1.5, H - footerReserve - 13);
      doc.setFillColor(...COLORS.emeraldTintLight);
      doc.setDrawColor(...COLORS.emerald);
      doc.setLineWidth(0.25);
      doc.roundedRect(padX, calloutY, contentW, 11.2, 1.8, 1.8, 'FD');

      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.emeraldDark);
      const labelTxt = `${sanitizePdfText(s.callout.label).toUpperCase()}: `;
      doc.text(labelTxt, padX + 3.5, calloutY + 6.7);

      const labelW = doc.getTextWidth(labelTxt);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.zinc900);
      const cText = doc.splitTextToSize(
        sanitizePdfText(s.callout.text),
        contentW - labelW - 7,
      )[0];
      doc.text(cText ?? '', padX + 3.5 + labelW, calloutY + 6.7);
    }

    // Speaker Notes Band (serialized from .pitch-deck-print-notes)
    if (s.speakerNotes) {
      const noteY = H - 31.5;
      doc.setFillColor(...COLORS.zincSubtle);
      doc.setDrawColor(...COLORS.zincBorder);
      doc.setLineWidth(0.25);
      doc.roundedRect(padX, noteY, contentW, 16, 1.8, 1.8, 'FD');

      doc.setFont('courier', 'bold');
      doc.setFontSize(7.1);
      doc.setTextColor(...COLORS.emeraldDark);
      doc.text('PRESENTER SPEAKER NOTES:', padX + 3.5, noteY + 4.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.zinc700);
      const nLines = doc
        .splitTextToSize(sanitizePdfText(s.speakerNotes), contentW - 7)
        .slice(0, 2);
      doc.text(nLines, padX + 3.5, noteY + 9.4);
    }

    drawFooter(doc, W, H, padX, false, (idx + 1) / totalPages, dateLabel);
  }

  const pdfBlob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
  triggerPdfBlobDownload(pdfBlob, filename);
  return pdfBlob;
}

