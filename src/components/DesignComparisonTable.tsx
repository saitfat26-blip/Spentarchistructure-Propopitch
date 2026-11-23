import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Moon, Sun, Table2 } from 'lucide-react';
import { useStack } from '../store/StackContext';
import { copyTextWithFallback } from '../utils/shareUrlCodec';

export type DesignPillar = 'visual-style' | 'typography' | 'spacing' | 'color-palette';

interface ComparisonRow {
  id: string;
  pillar: DesignPillar;
  pillarLabel: string;
  dimension: string;
  odoo: string;
  oitsWeb: string;
  mmis: string;
  oitsDhaka: string;
  swatches?: {
    odoo: string[];
    oitsWeb: string[];
    mmis: string[];
    oitsDhaka: string[];
  };
}

const PILLAR_FILTERS: { id: 'all' | DesignPillar; label: string }[] = [
  { id: 'all', label: 'All Criteria (12)' },
  { id: 'visual-style', label: 'Visual Style' },
  { id: 'typography', label: 'Typography' },
  { id: 'spacing', label: 'Spacing' },
  { id: 'color-palette', label: 'Color Palette' },
];

const COMPARISON_ROWS: ComparisonRow[] = [
  // Visual Style
  {
    id: 'archetype',
    pillar: 'visual-style',
    pillarLabel: 'Visual Style',
    dimension: 'Visual Archetype',
    odoo: 'Dark-first Swiss Technical Command & Composable Enterprise OS',
    oitsWeb: 'Cybernetic Midnight Glass & Luminous Sky Showcase',
    mmis: 'Botanical Editorial Intelligence & Calm BI Workbench',
    oitsDhaka: 'Swiss Institutional Editorial & Heritage Consultancy',
  },
  {
    id: 'polarity',
    pillar: 'visual-style',
    pillarLabel: 'Visual Style',
    dimension: 'Default Polarity & Theme',
    odoo: 'Dark-first (html.dark pure obsidian) with crisp light mode',
    oitsWeb: 'Dark-first (html.dark deep midnight navy) with 500ms light shift',
    mmis: 'Light-first (:root warm parchment) with deep forest dark mode',
    oitsDhaka: 'Light-first (:root warm stone paper) with nocturnal navy dark mode',
  },
  {
    id: 'elevation',
    pillar: 'visual-style',
    pillarLabel: 'Visual Style',
    dimension: 'Borders, Surface & Elevation',
    odoo: 'Flat single-elevation cards with razor-thin white/[0.08] / zinc-200 hairlines',
    oitsWeb: 'Frosted translucent glass (#0F172A/70), backdrop blur, luminous sky glow shadows',
    mmis: 'Soft sage hairlines (#E0E6DD / #3A5141) + ultra-soft organic shadow (0 6px 26px)',
    oitsDhaka: 'Putty/navy 1px architectural rules (#E4DFD6), flat rhythm, subtle hover lift',
  },
  {
    id: 'motion',
    pillar: 'visual-style',
    pillarLabel: 'Visual Style',
    dimension: 'Atmosphere & Motion',
    odoo: 'Subtle 24px architectural hero grid, 150ms crisp transitions, 3D/SVG stages',
    oitsWeb: 'Expressive ambient glows, radial dot matrices, float/shimmer/pulseGlow/marquee',
    mmis: 'Utilitarian stillness, zero glow clutter, high-contrast 3px #9FCAAD focus rings',
    oitsDhaka: 'Restrained editorial calm, smooth anchor scrolling, minimal decorative motion',
  },

  // Typography
  {
    id: 'font-pairing',
    pillar: 'typography',
    pillarLabel: 'Typography',
    dimension: 'Font Families & Pairing',
    odoo: 'Plus Jakarta Sans (UI & display) + JetBrains Mono (data & metrics)',
    oitsWeb: 'Clean system/Inter sans-serif UI + monospace technical telemetry badges',
    mmis: 'Inter (14px high-density UI) + Georgia serif monogram brand mark',
    oitsDhaka: 'Inter Variable / Inter Tight (editorial display) + IBM Plex Mono (specs)',
  },
  {
    id: 'type-scale',
    pillar: 'typography',
    pillarLabel: 'Typography',
    dimension: 'Display Scale & Tracking',
    odoo: 'Tight geometric headings, balanced wrapping, crisp 12–14px workspace prose',
    oitsWeb: 'Bold marketing display headings with tight -0.025em to -0.05em tracking',
    mmis: '31px heavy titles (780 wt, -1.1px tracking) + 10px eyebrows with 16px rule',
    oitsDhaka: 'Fluid clamp() display headings with text-balance and 720px reading measure',
  },
  {
    id: 'numerals',
    pillar: 'typography',
    pillarLabel: 'Typography',
    dimension: 'Numeric & Data Formatting',
    odoo: 'Strict JetBrains Mono tabular-nums across financials, GM%, tiers & HITL scores',
    oitsWeb: 'Monospace uppercase micro-labels (10–12px) for tech metrics & status tags',
    mmis: 'Dense 11–14px Inter alignment optimized for operational ledgers & KPI strips',
    oitsDhaka: 'IBM Plex Mono (12–12.5px) for indices, timelines, and technical callouts',
  },

  // Spacing
  {
    id: 'spatial-frame',
    pillar: 'spacing',
    pillarLabel: 'Spacing',
    dimension: 'Navigation & Spatial Frame',
    odoo: '56px sticky glass topbar (7 tabs + ⌘K + slide-over drawer), 1440px canvas',
    oitsWeb: 'Fixed transparent→glass top header, 1280px (max-w-7xl) marketing flow',
    mmis: 'Persistent 252px sticky left sidebar + 72px topbar, 1660px wide BI canvas',
    oitsDhaka: 'Editorial top header, strict 1200px architectural frame + alternating bands',
  },
  {
    id: 'density',
    pillar: 'spacing',
    pillarLabel: 'Spacing',
    dimension: 'Padding Rhythm & Density',
    odoo: 'Structured medium-high density (p-4/p-5 cards, 20–24px section rhythm)',
    oitsWeb: 'Generous marketing whitespace (py-20 sm:py-24 sections, space-y-12)',
    mmis: 'Generous dashboard breathing room (30px×32px content padding, 22px headings)',
    oitsDhaka: 'Editorial print pacing with clear 1px horizontal section dividers & 720px measure',
  },
  {
    id: 'radii',
    pillar: 'spacing',
    pillarLabel: 'Spacing',
    dimension: 'Corner Radius & Print Geometry',
    odoo: '8px controls, 12–16px stages + dedicated landscape @media print pagination',
    oitsWeb: 'Modern soft-rounded geometry (12px–24px / rounded-xl to rounded-3xl)',
    mmis: 'Warm organic radii (15px cards, 9px nav items, 8px selects, 12px callouts)',
    oitsDhaka: 'Tight architectural radii (10px cards, 8px controls, 16px hero cap)',
  },

  // Color Palette
  {
    id: 'canvas-surfaces',
    pillar: 'color-palette',
    pillarLabel: 'Color Palette',
    dimension: 'Canvas & Surface Palette',
    odoo: 'Dark #09090B / #111315 / #18181B · Light #F8FAFC / #FFFFFF / #F4F4F5',
    oitsWeb: 'Dark #070A13 / #0F172A · Light #F8FAFC / #FFFFFF (translucent glass)',
    mmis: 'Light #F7F5F0 / #FDFCF9 / #FFFEFA · Dark #131E19 / #19271E / #1C2A22',
    oitsDhaka: 'Light #FAF8F4 / #F2EFE9 / #FFFFFF · Dark #0B1020 / #0F1529 / #141A32',
    swatches: {
      odoo: ['#09090B', '#111315', '#F8FAFC', '#FFFFFF'],
      oitsWeb: ['#070A13', '#0F172A', '#F8FAFC', '#FFFFFF'],
      mmis: ['#F7F5F0', '#FFFEFA', '#131E19', '#1C2A22'],
      oitsDhaka: ['#FAF8F4', '#F2EFE9', '#0B1020', '#141A32'],
    },
  },
  {
    id: 'accents-ink',
    pillar: 'color-palette',
    pillarLabel: 'Color Palette',
    dimension: 'Brand, Ink & Semantic Accents',
    odoo: 'Emerald #10B981, Teal #0D9488, Amber #F59E0B, Crimson #E11D48 (CTA only)',
    oitsWeb: 'Navy #2A3B8F, Electric Blue #2563EB, Sky #38BDF8, Emerald #10B981',
    mmis: 'Deep Pine #213C31, Botanical #25704D / #79C29B, Ochre #AD6B20, Terracotta #A4413C',
    oitsDhaka: 'Heritage Navy #1F3863 / #8FA6E8, Deep Ink #16213A, Soft Ice #EEF3FB, Green #1C6E46',
    swatches: {
      odoo: ['#10B981', '#0D9488', '#F59E0B', '#E11D48'],
      oitsWeb: ['#2A3B8F', '#2563EB', '#38BDF8', '#10B981'],
      mmis: ['#213C31', '#25704D', '#79C29B', '#AD6B20'],
      oitsDhaka: ['#1F3863', '#8FA6E8', '#16213A', '#1C6E46'],
    },
  },
];

function buildMarkdownTable(rows: ComparisonRow[]): string {
  const header = `| Dimension | Odoo (Spenta Sovereign OS) | Spenta Web | MMIS Intel Dashboards | Spenta Dhaka |
| :--- | :--- | :--- | :--- | :--- |`;
  const body = rows
    .map(
      (r) => `| **${r.dimension}** | ${r.odoo} | ${r.oitsWeb} | ${r.mmis} | ${r.oitsDhaka} |`,
    )
    .join('\n');
  return `${header}\n${body}`;
}

function SwatchRow({ hexes, isDark }: { hexes: string[]; isDark: boolean }) {
  return (
    <div className="flex items-center gap-1.5 mt-2">
      {hexes.map((hex) => (
        <span
          key={hex}
          title={hex}
          className={`inline-flex items-center gap-1 text-[10px] font-mono ${
            isDark ? 'text-[#8E96B0]' : 'text-[#5F6576]'
          }`}
        >
          <span
            className={`w-3 h-3 rounded-xs border shrink-0 ${
              isDark ? 'border-white/20' : 'border-black/15'
            }`}
            style={{ backgroundColor: hex }}
          />
        </span>
      ))}
    </div>
  );
}

interface DesignComparisonTableProps {
  heading?: string;
  kicker?: string;
}

export function DesignComparisonTable({
  heading = 'Design & Theme Benchmark Comparison',
  kicker = 'Visual Style · Typography · Spacing · Color Palette',
}: DesignComparisonTableProps) {
  const { theme: portalTheme } = useStack();
  const [activePillar, setActivePillar] = useState<'all' | DesignPillar>('all');
  const [tableTheme, setTableTheme] = useState<'light' | 'dark'>(portalTheme);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTableTheme(portalTheme);
  }, [portalTheme]);

  const isTableDark = tableTheme === 'dark';

  const visibleRows = useMemo(() => {
    if (activePillar === 'all') return COMPARISON_ROWS;
    return COMPARISON_ROWS.filter((row) => row.pillar === activePillar);
  }, [activePillar]);

  const handleCopyMarkdown = async () => {
    const ok = await copyTextWithFallback(buildMarkdownTable(visibleRows));
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div>
          <div className="text-xs text-[#5F6576] dark:text-[#8E96B0]">{kicker}</div>
          <h2 className="text-base sm:text-lg font-bold text-[#16213A] dark:text-[#E7EBF5] tracking-tight mt-0.5 flex items-center gap-2">
            <Table2 className="w-4 h-4 text-[#1C6E46] dark:text-[#6FCB9F] shrink-0" strokeWidth={1.5} />
            <span>{heading}</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label="Filter design comparison criteria"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#F2EFE9] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A]"
          >
            {PILLAR_FILTERS.map((filter) => {
              const active = activePillar === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActivePillar(filter.id)}
                  className={`min-h-[34px] px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                      : 'text-[#4A5568] dark:text-[#A4ADC6] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Scoped Comparison View Light / Dark Mode Toggle */}
          <div
            role="group"
            aria-label="Comparison table color mode"
            className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#F2EFE9] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A]"
          >
            <button
              type="button"
              aria-pressed={!isTableDark}
              onClick={() => setTableTheme('light')}
              className={`inline-flex items-center gap-1.5 min-h-[34px] px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                !isTableDark
                  ? 'bg-white dark:bg-[#141A32] text-[#16213A] dark:text-[#E7EBF5] shadow-xs'
                  : 'text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
              }`}
              title="Preview comparison table in Stone Light Mode"
            >
              <Sun className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
              <span>Stone</span>
            </button>
            <button
              type="button"
              aria-pressed={isTableDark}
              onClick={() => setTableTheme('dark')}
              className={`inline-flex items-center gap-1.5 min-h-[34px] px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isTableDark
                  ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020] shadow-xs'
                  : 'text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
              }`}
              title="Preview comparison table in Nocturnal Navy Mode"
            >
              <Moon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
              <span>Nocturnal</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" />
            ) : (
              <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
            )}
            <span>{copied ? 'Copied Table' : 'Copy Markdown'}</span>
          </button>
        </div>
      </div>

      <div
        className={`rounded-xl border overflow-hidden transition-colors duration-200 ${
          isTableDark
            ? 'border-[#232B4A] bg-[#141A32] text-[#E7EBF5]'
            : 'border-[#E4DFD6] bg-white text-[#16213A]'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[880px]">
            <thead>
              <tr
                className={`border-b transition-colors duration-200 ${
                  isTableDark
                    ? 'border-[#232B4A] bg-[#0F1529]'
                    : 'border-[#E4DFD6] bg-[#F2EFE9]'
                }`}
              >
                <th
                  scope="col"
                  className={`sticky left-0 z-10 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-wider w-[190px] border-r transition-colors duration-200 ${
                    isTableDark
                      ? 'bg-[#0F1529] text-[#8E96B0] border-[#232B4A]'
                      : 'bg-[#F2EFE9] text-[#5F6576] border-[#E4DFD6]'
                  }`}
                >
                  Design Criterion
                </th>
                <th scope="col" className="px-4 py-3 align-top">
                  <div
                    className={`font-bold ${
                      isTableDark ? 'text-[#6FCB9F]' : 'text-[#1C6E46]'
                    }`}
                  >
                    Odoo (Spenta OS)
                  </div>
                  <div
                    className={`text-[11px] font-normal mt-0.5 ${
                      isTableDark ? 'text-[#8E96B0]' : 'text-[#5F6576]'
                    }`}
                  >
                    Current Portal · spenta.tech
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 align-top">
                  <div className={`font-bold ${isTableDark ? 'text-[#E7EBF5]' : 'text-[#16213A]'}`}>
                    Spenta Web
                  </div>
                  <a
                    href="https://oits-web-v2-5i7a.vercel.app/"
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1 text-[11px] font-normal mt-0.5 transition-colors ${
                      isTableDark
                        ? 'text-[#8E96B0] hover:text-[#6FCB9F]'
                        : 'text-[#5F6576] hover:text-[#1C6E46]'
                    }`}
                  >
                    <span>spenta-web-v2</span>
                    <ExternalLink className="w-2.5 h-2.5" strokeWidth={1.5} />
                  </a>
                </th>
                <th scope="col" className="px-4 py-3 align-top">
                  <div className={`font-bold ${isTableDark ? 'text-[#E7EBF5]' : 'text-[#16213A]'}`}>
                    MMIS Intel Dashboards
                  </div>
                  <a
                    href="https://mmis-intel-dashboards-v2.vercel.app/"
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1 text-[11px] font-normal mt-0.5 transition-colors ${
                      isTableDark
                        ? 'text-[#8E96B0] hover:text-[#6FCB9F]'
                        : 'text-[#5F6576] hover:text-[#1C6E46]'
                    }`}
                  >
                    <span>mmis-intel-dashboards-v2</span>
                    <ExternalLink className="w-2.5 h-2.5" strokeWidth={1.5} />
                  </a>
                </th>
                <th scope="col" className="px-4 py-3 align-top">
                  <div className={`font-bold ${isTableDark ? 'text-[#E7EBF5]' : 'text-[#16213A]'}`}>
                    Spenta Dhaka
                  </div>
                  <a
                    href="https://www.oitsdhaka.com/"
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1 text-[11px] font-normal mt-0.5 transition-colors ${
                      isTableDark
                        ? 'text-[#8E96B0] hover:text-[#6FCB9F]'
                        : 'text-[#5F6576] hover:text-[#1C6E46]'
                    }`}
                  >
                    <span>spenta-dhaka</span>
                    <ExternalLink className="w-2.5 h-2.5" strokeWidth={1.5} />
                  </a>
                </th>
              </tr>
            </thead>

            <tbody
              className={`divide-y ${
                isTableDark ? 'divide-[#232B4A]' : 'divide-[#E4DFD6]'
              }`}
            >
              {visibleRows.map((row) => (
                <tr
                  key={row.id}
                  className={`transition-colors ${
                    isTableDark ? 'hover:bg-[#0F1529]/60' : 'hover:bg-[#FAF8F4]'
                  }`}
                >
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 px-4 py-3 text-left font-semibold border-r align-top transition-colors duration-200 ${
                      isTableDark
                        ? 'bg-[#141A32] text-[#E7EBF5] border-[#232B4A]'
                        : 'bg-white text-[#16213A] border-[#E4DFD6]'
                    }`}
                  >
                    <div>{row.dimension}</div>
                    <div
                      className={`text-[10px] font-mono font-normal mt-0.5 ${
                        isTableDark ? 'text-[#8E96B0]' : 'text-[#5F6576]'
                      }`}
                    >
                      {row.pillarLabel}
                    </div>
                  </th>
                  <td
                    className={`px-4 py-3 font-medium leading-relaxed align-top ${
                      isTableDark
                        ? 'text-[#E7EBF5] bg-[#6FCB9F]/[0.06]'
                        : 'text-[#16213A] bg-[#1C6E46]/[0.05]'
                    }`}
                  >
                    <div>{row.odoo}</div>
                    {row.swatches && <SwatchRow hexes={row.swatches.odoo} isDark={isTableDark} />}
                  </td>
                  <td
                    className={`px-4 py-3 leading-relaxed align-top ${
                      isTableDark ? 'text-[#A4ADC6]' : 'text-[#4A5568]'
                    }`}
                  >
                    <div>{row.oitsWeb}</div>
                    {row.swatches && (
                      <SwatchRow hexes={row.swatches.oitsWeb} isDark={isTableDark} />
                    )}
                  </td>
                  <td
                    className={`px-4 py-3 leading-relaxed align-top ${
                      isTableDark ? 'text-[#A4ADC6]' : 'text-[#4A5568]'
                    }`}
                  >
                    <div>{row.mmis}</div>
                    {row.swatches && <SwatchRow hexes={row.swatches.mmis} isDark={isTableDark} />}
                  </td>
                  <td
                    className={`px-4 py-3 leading-relaxed align-top ${
                      isTableDark ? 'text-[#A4ADC6]' : 'text-[#4A5568]'
                    }`}
                  >
                    <div>{row.oitsDhaka}</div>
                    {row.swatches && (
                      <SwatchRow hexes={row.swatches.oitsDhaka} isDark={isTableDark} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
