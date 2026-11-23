export type PromptPriority = 'P0' | 'P1' | 'P2';
export type ThemeRefId = 'oits-web-v2' | 'mmis-v2' | 'oitsdhaka' | 'spenta-os';
export type ComparisonGroup = 'color' | 'typography' | 'layout' | 'polish';

export interface AgentPromptSection {
  id: string;
  code: string;
  priority: PromptPriority;
  phaseLabel: string;
  title: string;
  targetArea: string;
  summary: string;
  dependsOn: string[];
  promptMarkdown: string;
}

export interface ScopedThemeTokens {
  canvas: string;
  surface: string;
  recessed: string;
  border: string;
  ink: string;
  secondaryInk: string;
  mutedInk: string;
  brand: string;
  brandText: string;
  accent: string;
  accentSoft: string;
  positive: string;
  caution: string;
  danger: string;
  shadow: string;
}

export interface ThemeReferenceSpec {
  id: ThemeRefId;
  shortLabel: string;
  name: string;
  sourceUrl: string;
  archetype: string;
  defaultPolarity: 'dark' | 'light';
  summary: string;
  fontDisplay: string;
  fontBody: string;
  fontMono: string;
  radiusCard: string;
  radiusControl: string;
  navLayout: 'topbar-glass' | 'sidebar-workbench' | 'editorial-topbar' | 'command-topbar';
  hasAmbientGrid: boolean;
  hasGlassBlur: boolean;
  eyebrowBar: boolean;
  light: ScopedThemeTokens;
  dark: ScopedThemeTokens;
  keySwatches: { label: string; hex: string }[];
  templatePromptMarkdown: string;
}

export interface ThemeComparisonRow {
  id: string;
  dimension: string;
  group: ComparisonGroup;
  oitsWebV2: string;
  mmisV2: string;
  oitsDhaka: string;
  spentaOs: string;
}

export const GLOBAL_AGENT_PREAMBLE = `## Global Context Block (Prepend to Any Coding-Agent Session)

- **Stack**: React 19 + Vite + TypeScript (\`strict: true\`) + Tailwind CSS v4 (\`@import "tailwindcss";\`, \`@source "../index.html";\`, \`@source "../src";\`, and \`@custom-variant dark (&:where(.dark, .dark *));\`).
- **Typography**: \`Plus Jakarta Sans\` (UI & display headings) paired with \`JetBrains Mono\` (\`font-variant-numeric: tabular-nums\`) for metrics, financials, confidence scores, and layer IDs.
- **Dual-Theme Posture**: Dark-first Obsidian (\`#09090B\` canvas, \`#111315\` surface, \`white/[0.08]\` hairlines) + Light Slate (\`#F8FAFC\` canvas, \`#FFFFFF\` surface, \`zinc-200\` borders).
- **Semantic Accents**: Emerald \`#10B981\` (active / verified >= 0.88 HITL), Teal \`#0D9488\` (L1-L6 architecture & integrations), Amber \`#F59E0B\` (HITL review < 0.88), Crimson \`#E11D48\` (exclusive primary CTAs).
- **Non-Negotiables**: Pure client-side state synced to \`localStorage\`; zero \`window.alert\`/\`confirm\`/\`open\`; WCAG AA+ contrast in dark & light modes; responsive from 360px mobile to 1440px+ desktop; single-elevation cards without nested card-in-card clutter or static metadata pills.`;

export const AGENT_PROMPT_SECTIONS: AgentPromptSection[] = [
  {
    id: 'p0-1-shell',
    code: 'P0.1',
    priority: 'P0',
    phaseLabel: 'Foundation & Store',
    title: 'App Shell, Dual-Theme Engine & StackContext Store',
    targetArea: 'Global Layout, Manifest & State Persistence',
    summary:
      'Sticky 56px 3-zone navigation bar, dual dark/light theme engine, typed 13-app manifest, and localStorage-backed StackContext with recursive dependency auto-attachment.',
    dependsOn: [],
    promptMarkdown: `### TASK [P0.1]: App Shell, Dual-Theme Engine & Centralized StackContext Store

**DESIGN SPEC**
- Sticky 56px top navbar (\`bg-white/85 dark:bg-[#09090B]/85 backdrop-blur-md\`) with hairline bottom border and 3 balanced zones:
  1. Left: Official Spenta logo (tone-aware for dark/light backgrounds) + subtle vertical divider + \`SOVEREIGN OS\` monospace label on wide viewports.
  2. Center: 7 single-line tabs (\`App Vault\`, \`Infographics\`, \`Financials\`, \`Spenta Core\`, \`The Brain\`, \`Pitch Deck\`, \`Resources\`) with an active emerald bottom bar.
  3. Right: Command Palette button (\`⌘K\`), Dark/Light theme toggle, crimson \`Stack Composer\` CTA with live module count, and responsive mobile drawer button (<1024px).
- Minimal footer displaying brand mark, regional delivery hubs (San Jose · Australia · 20-FTE Dhaka R&D Hub), and contact action.

**DEVELOP SPEC**
- Author a strongly typed manifest covering 13 Spenta apps, 8 Brain Hubs, 6 Sovereign Layers (L1–L6), 4 On-Prem Server Tiers, 5-year Financials (FY2027–FY2031), 18 Pitch Slides, and Starter Recipes.
- Implement \`StackContext\` persisted in \`localStorage\` for \`theme\`, \`activeTab\`, \`selectedIds\` (4-app default), \`drawerOpen\`, \`hitlConfidence\` (0.91 default), \`coreLayerConfigs\`, \`coreAuditLog\`, and \`savedProposals\`.
- In \`toggleApp(id)\`, recursively attach transitive \`depends\` modules and emit a dismissible inline notice.
- Compute memoized \`stackMetrics\`: \`totalSetupUsd\`, \`blendedGmPct\`, recommended \`ServerTierId\` (auto-escalate 1 tier when >= 6 apps selected), \`activeLayers\`, and deduplicated \`synergyPairs\`.

**ACCEPTANCE CRITERIA**
- Zero horizontal overflow at 375px, 768px, 1280px, and 1440px.
- Theme toggle persists across reload and applies cleanly without missing dark classes (verify \`.gitignore\` does not ignore \`/src/\`).`,
  },
  {
    id: 'p0-2-vault',
    code: 'P0.2',
    priority: 'P0',
    phaseLabel: 'Foundation & Store',
    title: 'App Vault — 13-App Catalog & 2D Architecture Matrix',
    targetArea: 'Default Landing Tab',
    summary:
      'Interactive 2D SVG Orthogonal Architecture Matrix linked to an Odoo-inspired 13-app composable catalog with live filtering, starter recipes, and module inspection modal.',
    dependsOn: ['P0.1'],
    promptMarkdown: `### TASK [P0.2]: App Vault — 13-App Composable Catalog & 2D Architecture Matrix

**DESIGN SPEC**
- Compact executive KPI bar showing live stack telemetry: Selected Modules (/13), Estimated Build Scope ($K), Blended Conservative GM%, and Auto-Recommended Server Tier.
- Starter Recipe strip offering 1-click curated multi-module stacks in crisp single-elevation cards.
- Interactive 2D SVG "Spenta Sovereign AI Brain" Orthogonal Matrix:
  - Central L1–L6 Core flanked by 8 domain hubs (4 Operations Engine left, 4 Experience & IR4 Engine right) connected via orthogonal bus lines that highlight emerald/teal when constituent modules are selected.
  - Clicking any hub filters and inspects its mapped modules inline.
- Responsive 13-App Catalog Grid (1-col mobile, 2-col tablet, 3-col desktop) leading with quiet unboxed category metadata, module title, tagline, setup/recurring pricing, GM%, L1–L6 layer indices, proof client, and Add/Selected toggle.

**DEVELOP SPEC**
- Support real-time search, category filter, engine filter (Operations / Experience / Fusion), and deployment filter (On-Prem / Private VPC / SaaS).
- Build an accessible module detail modal displaying \`coreCapabilities\`, required \`depends\`, native \`integratesWith\` (with 1-click Add), and minimum hardware tier.
- Listen for \`pendingNavFocus\` from global search to jump directly to any module.

**ACCEPTANCE CRITERIA**
- Selecting a module updates SVG bus highlights, KPI counters, and Stack Composer count in <50ms.
- Selecting an app with dependencies automatically attaches required modules with visible feedback.`,
  },
  {
    id: 'p0-3-composer',
    code: 'P0.3',
    priority: 'P0',
    phaseLabel: 'Foundation & Store',
    title: 'Persistent Slide-Over Stack Composer Drawer',
    targetArea: 'Cross-Portal Stack Configurator',
    summary:
      'Right-anchored slide-over drawer displaying live build scope, blended GM%, recommended server hardware, L1–L6 layer coverage, native synergies, and JSON/Email export.',
    dependsOn: ['P0.1'],
    promptMarkdown: `### TASK [P0.3]: Persistent Slide-Over Stack Composer Drawer

**DESIGN SPEC**
- Right-anchored slide-over panel (\`max-w-[420px]\`, full width on mobile) with dimmed backdrop, Escape-to-close, and dark obsidian header showing \`{N} / 13 Modules\`.
- Summary strip: Estimated Build Scope ($K), Blended GM%, and Recommended Server PC Tier specification (hardware, VRAM/RAM, CapEx, token throughput).
- Compact 6-segment L1–L6 Sovereign Layer coverage bar indicating active layers.
- Scrollable selected modules list with 1-click removal and verified native synergy pair list.
- Sticky footer with 4 actions: \`Export JSON\`, \`Copy Brief\`, \`Email Draft\`, and \`Request Proposal\` jump-to-form CTA.

**DEVELOP SPEC**
- Bind directly to \`StackContext\` (\`selectedApps\`, \`stackMetrics\`, \`toggleApp\`, \`clearStack\`, \`exportStackJson\`, \`buildExecutiveBrief\`, \`buildMailtoHref\`).
- Apply \`no-print\` to the root overlay so it never obstructs printed documents.

**ACCEPTANCE CRITERIA**
- Build totals, GM%, hardware tier escalations, and synergy counts update immediately on add/remove.
- JSON export downloads a valid structured architecture manifest; Copy Brief shows inline confirmation.`,
  },
  {
    id: 'p1-1-search',
    code: 'P1.1',
    priority: 'P1',
    phaseLabel: 'Core Intelligence',
    title: 'Global Command Palette Search (⌘K)',
    targetArea: 'Cross-Portal Navigation & Quick Actions',
    summary:
      'Keyboard-first global search modal indexing all 13 apps, 18 pitch slides, 6 core layers, 4 server tiers, 4 infographics, recipes, case studies, and studio resources.',
    dependsOn: ['P0.1', 'P0.2'],
    promptMarkdown: `### TASK [P1.1]: Global Command Palette Search (⌘K)

**DESIGN SPEC**
- Top-weighted centered modal (\`max-w-2xl\`) with clean search input, clear button, Esc hint, and scannable result rows showing icon, title, concise subtitle, and destination tab label.
- Group and rank matches cleanly across Sections, Starter Recipes, Apps, Infographics, Core Layers, Server Tiers, Pitch Slides, Blueprints, and Case Studies.

**DEVELOP SPEC**
- Bind global \`Cmd+K\` / \`Ctrl+K\` shortcut (ignoring focus inside \`INPUT\`, \`TEXTAREA\`, or \`SELECT\`).
- Support full keyboard navigation (\`ArrowUp\`, \`ArrowDown\`, \`Enter\`, \`Escape\`) synchronized with mouse hover.
- Selecting an entry invokes \`navigateToItem(tab, focus)\` so the target view highlights or opens the exact requested item automatically.

**ACCEPTANCE CRITERIA**
- Queries like "HITL", "Healthcare", "Tier 1", "EBITDA", or "Slide 12" surface accurate matches instantly and deep-link cleanly on Enter.`,
  },
  {
    id: 'p1-2-financials',
    code: 'P1.2',
    priority: 'P1',
    phaseLabel: 'Core Intelligence',
    title: 'Financials View — 5-Year P&L, GM Matrix & Quick Summary PDF',
    targetArea: 'Investor Financial Modeling',
    summary:
      'Reconciled FY2027–FY2031 Recharts P&L visualizations, Conservative vs. Upside toggles, FX/Tax sensitivity sliders, sortable 13-Product GM Matrix, and 1-page PDF executive brief.',
    dependsOn: ['P0.1'],
    promptMarkdown: `### TASK [P1.2]: Financials View — FY2027–FY2031 P&L, Sensitivity Controls & Quick Generate PDF

**DESIGN SPEC**
- Top KPI strip: Year 5 Revenue, 5-Year Cumulative EBITDA, 5-Year Net Profit, Blended Portfolio GM%, and SAFE Raise Terms ($500K / $4.5M Cap / 20% Disc).
- Theme-aware Recharts \`ComposedChart\` (Revenue bars + EBITDA & Net Profit curves) with legible dark/light axes, gridlines, and custom tooltips.
- Interactive Sensitivity Controls: Conservative vs. Upside scenario toggle, BDT/USD FX rate slider, Tax rate slider, and Dhaka Dual-Shore OpEx leverage readout.
- Sortable 13-Product Gross Margin table aligned with tabular monospace numerals and live Stack inclusion indicators.

**DEVELOP SPEC**
- Derive all 5-year P&L tables and chart series purely from scenario, FX, and tax state without mutating base constants.
- Implement a **"Quick Generate"** button opening a simplified 1-page Quarterly Executive Summary modal powered by active financial parameters, with 1-click single-page PDF export via \`jsPDF\`.

**ACCEPTANCE CRITERIA**
- All currency and percentage cells use \`JetBrains Mono\` with \`tabular-nums\`.
- Quick Generate PDF reflects live scenario, FX, and tax slider adjustments accurately.`,
  },
  {
    id: 'p1-3-core',
    code: 'P1.3',
    priority: 'P1',
    phaseLabel: 'Core Intelligence',
    title: 'Spenta Core — L1–L6 Stack, Server Matrix & Audit Log',
    targetArea: 'Sovereign Infrastructure & Governance',
    summary:
      'Interactive L1–L6 architecture configurator, 4-tier on-prem server matrix, Dhaka dual-shore cost chart, and persistent Audit Log tracking previous vs. new configuration diffs.',
    dependsOn: ['P0.1'],
    promptMarkdown: `### TASK [P1.3]: Spenta Core — L1–L6 Fusion Stack, 4-Tier Server Matrix & Persistent Audit Log

**DESIGN SPEC**
- Clean sub-navigation bar: \`L1–L6 Fusion Stack\`, \`Server PC Matrix\`, \`Dual-Shore Pods\`, and \`Audit Log\` (showing live entry count).
- L1–L6 Stack: clickable vertical spine (L6 down to L1) paired with a Layer Inspector displaying SLA target, protocols, API contracts, security controls, mapped apps, and live editable controls (Deployment Isolation, OPA Policy Mode, Hardware TEE toggle, Reset to Baseline).
- 4-Tier Server Matrix: 4 comparison cards (Tier 1 Mac Studio M3 Ultra 512GB through Tier 4 48GB Edge) marking the StackContext-recommended tier and offering a "Set Target Tier" action.
- Dual-Shore Pods: Recharts hourly cost comparison chart (Dhaka R&D Hub vs. Western Agency) and pod structure breakdown.
- Audit Log Tab: search bar, scope filter (All, L1–L6, Hardware), JSON/CSV export, inline Clear Log confirmation (no \`window.confirm\`), and chronological diff table (Timestamp, Actor, Scope, Action, Field, Previous → New Value).

**DEVELOP SPEC**
- Automatically log an immutable entry to \`coreAuditLog\` in \`StackContext\` on every L1–L6 policy/isolation/TEE change or hardware tier assignment, persisted in \`localStorage\`.

**ACCEPTANCE CRITERIA**
- Modifying any L1–L6 control immediately records an accurate Previous → New Value entry with ISO timestamp that persists across reload.`,
  },
  {
    id: 'p1-4-pitch-stage',
    code: 'P1.4',
    priority: 'P1',
    phaseLabel: 'Core Intelligence',
    title: 'Pitch Deck — 18-Slide Interactive Presenter Stage',
    targetArea: 'Investor Briefing Room',
    summary:
      '12-column investor slide presenter with scrollable 18-slide index rail, true 16:9 widescreen viewport, keyboard navigation, and collapsible Presenter Speaker Notes.',
    dependsOn: ['P0.1'],
    promptMarkdown: `### TASK [P1.4]: Pitch Deck — 18-Slide Interactive Presenter Stage

**DESIGN SPEC**
- Header toolbar with deck title, keyboard navigation cue (\`← / →\`), and \`Show / Hide Notes\` toggle.
- 12-column desktop stage: 3-column scrollable Slide Index rail + 9-column widescreen \`aspect-[16/9]\` slide frame.
- Every slide displays official Spenta logo, section label, \`XX / 18\` counter, bold headline, subtitle, 2–4 semantic KPI blocks, bullet list, optional callout banner, and confidential footer.
- Below stage: Previous / Progress Bar / Next control strip + collapsible Presenter Speaker Notes drawer.

**DEVELOP SPEC**
- Bind \`ArrowLeft\`, \`ArrowRight\`, \`PageUp\`, and \`PageDown\` shortcuts while ignoring focused inputs/textareas/selects.
- Consume \`pendingNavFocus\` so global search links open the target slide directly.

**ACCEPTANCE CRITERIA**
- All 18 slides render cleanly without text clipping on both mobile stacked viewports and desktop 16:9 stages.`,
  },
  {
    id: 'p2-1-brain',
    code: 'P2.1',
    priority: 'P2',
    phaseLabel: 'Visuals, Exports & Hardening',
    title: 'The Brain — 3D Neural Core, Tech Radar & 0.88 HITL Simulator',
    targetArea: 'Spatial 3D & Governance Sandbox',
    summary:
      'Lazy-loaded Three.js 3D Neural Core with WebGL Error Boundary fallback to 2D SVG Operational Tech Radar, interactive 0.88 HITL Gate simulator, and 8-vertical agentic explorer.',
    dependsOn: ['P0.1', 'P0.2'],
    promptMarkdown: `### TASK [P2.1]: The Brain — 3D Neural Core, Operational Tech Radar & 0.88 HITL Gate Simulator

**DESIGN SPEC**
- Primary visualization panel toggling between:
  1. Interactive Three.js 3D Sovereign Neural Core (central emerald core, L1–L6 orbital rings, clickable 13-app nodes synced to \`selectedIds\`, smooth orbit controls).
  2. High-contrast 2D SVG Operational Tech Radar plotting modules across adoption rings and domain quadrants.
- 0.88 Confidence HITL Gate Simulator: interactive confidence threshold slider (0.50–0.99) dynamically classifying realistic enterprise inference events (ICR banking forms, HL7 handovers, KYC checks) into Auto-Pass (>= 0.88 Emerald) vs. Human Review Queue (< 0.88 Amber) with OPA policy rationale and latency readouts.
- Filterable 8-Vertical Agentic Loop (Think → Learn → Solve → HITL Trigger) and Blueprint Pillar Explorer.

**DEVELOP SPEC**
- Lazy-load the Three.js canvas with \`React.lazy\` + \`Suspense\` wrapped in a React Error Boundary falling back seamlessly to the 2D SVG Tech Radar if WebGL is unavailable.
- Dispose Three.js geometries, materials, and renderer cleanly on unmount.

**ACCEPTANCE CRITERIA**
- Moving the HITL slider recalculates pass/escalate ratios instantaneously.
- Zero crashes in WebGL-disabled or headless environments.`,
  },
  {
    id: 'p2-2-infographics',
    code: 'P2.2',
    priority: 'P2',
    phaseLabel: 'Visuals, Exports & Hardening',
    title: 'Infographics Gallery & Zoomable Lightbox',
    targetArea: 'Executive Visual Plates',
    summary:
      'Responsive 2-column gallery of 4 widescreen 16:9 executive architectural and financial plates paired with a keyboard-accessible zoom lightbox and direct downloads.',
    dependsOn: ['P0.1'],
    promptMarkdown: `### TASK [P2.2]: Infographics Gallery & Zoomable Lightbox

**DESIGN SPEC**
- 2-column responsive gallery showcasing 4 widescreen 16:9 visual plates:
  1. Spenta Sovereign AI Brain (8-Hub Architecture)
  2. L1–L6 Sovereign Fusion Stack & 4-Tier Server Matrix
  3. FY2027–FY2031 Financial Trajectory & Dual-Shore Edge
  4. Captive Ecosystem Synergies (BEST Retail & X Ltd Mobility)
- Each plate card presents plate index, title, summary caption, crisp 16:9 preview, Expand Lightbox trigger, and Download action.
- Full-screen dark lightbox modal with Zoom In/Out/Reset controls, Escape/Arrow keyboard navigation, Print view, and Download action.

**DEVELOP SPEC**
- Import static visual assets via Vite ES imports with \`src/vite-env.d.ts\` declaring \`vite/client\` types and graceful fallback styling if any asset fails to load.

**ACCEPTANCE CRITERIA**
- Lightbox zooms cleanly without aspect-ratio distortion and closes reliably on Escape or backdrop click.`,
  },
  {
    id: 'p2-3-pitch-pdf',
    code: 'P2.3',
    priority: 'P2',
    phaseLabel: 'Visuals, Exports & Hardening',
    title: 'Pitch Deck Vector 16:9 PDF Exporter & Print-to-PDF CSS',
    targetArea: 'Document Export & Print Fidelity',
    summary:
      'High-resolution jsPDF 16:9 slide generator (Full/Current/Custom range, logo embedding, theme selector, Stack Appendix) plus landscape @media print stylesheets hiding all navigation chrome.',
    dependsOn: ['P1.4', 'P0.3'],
    promptMarkdown: `### TASK [P2.3]: Pitch Deck Vector 16:9 PDF Exporter & Print-to-PDF Media Queries

**DESIGN SPEC**
- Pitch Deck toolbar actions: \`Slide XX PDF\`, \`PDF Options\` modal trigger, primary crimson \`Export Full Deck PDF\` (with live rendering progress), and native \`Print\` button.
- PDF Options modal: Slide Scope (Full 18 / Current Slide / Custom From–To Range), Document Theme (Deck Native / All Obsidian Dark / Print-Friendly Light), Toggle Presenter Speaker Notes, and Toggle Live Composed Stack Appendix slide.

**DEVELOP SPEC**
- Build \`exportPitchDeckToPdf\` using \`jsPDF\` (297mm × 167.06mm 16:9 landscape):
  - Preload official Spenta logo to offscreen canvas with timeout + clean vector fallback.
  - Sanitize Unicode glyphs (\`×\`, \`·\`, \`—\`, \`≥\`, \`↔\`, smart quotes) so built-in PDF fonts never garble characters.
  - Pre-measure wrapped text heights dynamically to guarantee zero overlap across titles, KPIs, bullets, callouts, speaker notes, and footers.
  - Optionally append a 16:9 "Custom Stack Appendix" slide pulling live StackContext data.
- Author comprehensive \`@media print\` rules:
  - \`@page { size: landscape; margin: 10mm; }\` and \`print-color-adjust: exact\`.
  - Hide all navigational elements (\`header, nav, footer, aside, .no-print, .pitch-deck-nav, .pitch-deck-screen-only\`).
  - Override \`html.dark\` root canvas to white with deep dark ink and reveal a print-only paginated 18-slide layout (\`break-after: page; break-inside: avoid;\`) so all text prints clearly even when dark mode is active or background graphics are disabled.

**ACCEPTANCE CRITERIA**
- Vector PDF downloads cleanly for Full Deck, Single Slide, and Custom Range with zero text overlaps or garbled characters.
- Browser Print Preview renders 18 paginated, high-contrast landscape slides with zero navigation clutter.`,
  },
  {
    id: 'p2-4-resources',
    code: 'P2.4',
    priority: 'P2',
    phaseLabel: 'Visuals, Exports & Hardening',
    title: 'Resources Hub, Proposal Workbench & Prompt/Theme Studio',
    targetArea: 'Enterprise Proofs, Proposals & Agent Kit',
    summary:
      'Filterable enterprise case studies, sovereign compliance pack, stack-aware proposal form with local archive, plus the integrated Markdown Prompt Pack & Sandboxed 4-Theme Comparison Studio.',
    dependsOn: ['P0.1', 'P0.3'],
    promptMarkdown: `### TASK [P2.4]: Resources Hub, Stack Proposal Workbench & Prompt/Theme Studio

**DESIGN SPEC**
- Top segmented mode bar toggling cleanly between \`Enterprise Proofs & Proposals\` and \`Prompt Pack & Theme Studio\`.
- Proofs & Proposals mode: sector-filtered Enterprise Case Studies (with 1-click "Load Matching Stack" actions), Sovereign Compliance matrix, live stack-aware Proposal Form (\`#spenta-proposal-form\`), and Saved Proposals archive.
- Prompt Pack & Theme Studio mode:
  - Universal Markdown download toolbar (Full Kit \`.md\`, P0–P2 Prompts \`.md\`, 4-Theme Kit \`.md\`).
  - Priority-filtered P0/P1/P2 prompt deck with one-click Copy and single-section \`.md\` download.
  - Sandboxed 4-Theme Live Preview Studio (scoped strictly inside the preview frame so global portal styling stays untouched) + copyable Theme Templating Prompts.
  - 4-Way Design & Theme Comparison Matrix with one-click Copy Markdown Table.

**DEVELOP SPEC**
- Persist saved proposals in \`localStorage\` with inline validation, JSON download, and pre-filled \`mailto:\` draft builder.
- Synthesize all downloadable \`.md\` bundles dynamically from the typed studio manifest so UI cards and exported Markdown never drift.

**ACCEPTANCE CRITERIA**
- Proposal submissions persist across reload; all \`.md\` downloads and per-section clipboard actions work cleanly with inline confirmation.`,
  },
];

export const THEME_REFERENCE_SPECS: ThemeReferenceSpec[] = [
  {
    id: 'oits-web-v2',
    shortLabel: 'spenta-web-v2',
    name: 'Spenta Web v2 (Vercel)',
    sourceUrl: 'https://oits-web-v2-5i7a.vercel.app/',
    archetype: 'Cybernetic Midnight Glass & Luminous Sky',
    defaultPolarity: 'dark',
    summary:
      'Dark-first high-tech engineering showcase anchored in deep midnight navy (#070A13), frosted translucent slate glass cards, luminous sky/electric-blue accents, radial atmospheric glows, and kinetic micro-motion.',
    fontDisplay: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    fontBody: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    radiusCard: '16px',
    radiusControl: '10px',
    navLayout: 'topbar-glass',
    hasAmbientGrid: true,
    hasGlassBlur: true,
    eyebrowBar: false,
    dark: {
      canvas: '#070A13',
      surface: 'rgba(15, 23, 42, 0.78)',
      recessed: 'rgba(30, 41, 59, 0.55)',
      border: 'rgba(30, 41, 59, 0.85)',
      ink: '#F8FAFC',
      secondaryInk: '#CBD5E1',
      mutedInk: '#94A3B8',
      brand: '#2563EB',
      brandText: '#FFFFFF',
      accent: '#38BDF8',
      accentSoft: 'rgba(56, 189, 248, 0.14)',
      positive: '#10B981',
      caution: '#F59E0B',
      danger: '#F43F5E',
      shadow: '0 0 24px rgba(56, 189, 248, 0.12)',
    },
    light: {
      canvas: '#F8FAFC',
      surface: 'rgba(255, 255, 255, 0.95)',
      recessed: '#F1F5F9',
      border: 'rgba(226, 232, 240, 0.90)',
      ink: '#0B0F19',
      secondaryInk: '#334155',
      mutedInk: '#64748B',
      brand: '#1D2A68',
      brandText: '#FFFFFF',
      accent: '#0284C7',
      accentSoft: '#E0F2FE',
      positive: '#059669',
      caution: '#D97706',
      danger: '#E11D48',
      shadow: '0 10px 25px -10px rgba(15, 23, 42, 0.10)',
    },
    keySwatches: [
      { label: 'Midnight Canvas', hex: '#070A13' },
      { label: 'Glass Surface', hex: '#0F172A' },
      { label: 'Brand Navy', hex: '#2A3B8F' },
      { label: 'Electric Blue', hex: '#2563EB' },
      { label: 'Luminous Sky', hex: '#38BDF8' },
      { label: 'Emerald Signal', hex: '#10B981' },
    ],
    templatePromptMarkdown: `### THEME TEMPLATE: "Cybernetic Midnight Glass" (\`spenta-web-v2\`)

**COLOR TOKENS**
- **Dark Mode (Default — \`html.dark\`)**:
  - Canvas: \`#070A13\` (Deep Midnight Navy)
  - Glass Surface: \`rgba(15, 23, 42, 0.70)\` (\`#0F172AB3\`) + \`backdrop-blur-md\`
  - Border: \`rgba(30, 41, 59, 0.80)\` (\`#1E293BCC\`)
  - Text: Primary \`#F8FAFC\` | Secondary \`#CBD5E1\` | Muted \`#94A3B8\`
  - Brand & Accents: Brand Navy \`#2A3B8F\` (dark \`#1D2A68\`), Electric Blue \`#2563EB\`, Sky Accent \`#38BDF8\`, Emerald \`#10B981\`, Amber \`#F59E0B\`, Indigo Depth \`#312E81\`
- **Light Mode**:
  - Canvas: \`#F8FAFC\` | Surface: \`rgba(255, 255, 255, 0.95)\` | Border: \`rgba(226, 232, 240, 0.80)\`
  - Text: Primary \`#0B0F19\` | Secondary \`#334155\` | Muted \`#64748B\` | Brand Navy \`#1D2A68\`

**TYPOGRAPHY & SCALE**
- Display & UI: Crisp sans-serif with tight display tracking (\`-0.025em\` to \`-0.05em\`), bold/extrabold headings (700–800).
- Telemetry/Tags: Monospace (\`10px–12px\`, uppercase tracking) for metadata and status readouts.

**SURFACES, RADIUS & MOTION**
- Fixed transparent header transitioning to frosted midnight glass on scroll.
- Spacious marketing cadence (\`max-w-7xl\`, \`py-20 sm:py-24\`, \`space-y-12\`), \`rounded-xl\` to \`rounded-2xl\` cards, ambient radial glows, luminous accent shadows, and 500ms theme transitions (\`float\`, \`shimmer\`, \`pulseGlow\`, \`marquee\`, respecting \`prefers-reduced-motion\`).`,
  },
  {
    id: 'mmis-v2',
    shortLabel: 'mmis-v2',
    name: 'MMIS Admin Intelligence v2',
    sourceUrl: 'https://mmis-intel-dashboards-v2.vercel.app/',
    archetype: 'Botanical Parchment & Forest Intelligence',
    defaultPolarity: 'light',
    summary:
      'Warm, low-fatigue executive BI workbench anchored in unbleached parchment (#F7F5F0), ivory cards (#FFFEFA), deep pine ink (#213C31), sage hairlines, Georgia serif monogram accents, and a calm botanical forest dark mode (#131E19).',
    fontDisplay: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif',
    fontBody: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif',
    fontMono: 'Georgia, "Times New Roman", serif',
    radiusCard: '15px',
    radiusControl: '9px',
    navLayout: 'sidebar-workbench',
    hasAmbientGrid: false,
    hasGlassBlur: false,
    eyebrowBar: true,
    light: {
      canvas: '#F7F5F0',
      surface: '#FFFEFA',
      recessed: '#F8F8F3',
      border: '#E0E6DD',
      ink: '#213C31',
      secondaryInk: '#345247',
      mutedInk: '#6D7E75',
      brand: '#153C2A',
      brandText: '#FFFFFF',
      accent: '#25704D',
      accentSoft: '#E8F2E7',
      positive: '#25704D',
      caution: '#AD6B20',
      danger: '#A4413C',
      shadow: '0 6px 26px rgba(30, 55, 38, 0.035)',
    },
    dark: {
      canvas: '#131E19',
      surface: '#1C2A22',
      recessed: '#223428',
      border: '#3A5141',
      ink: '#F1F6EE',
      secondaryInk: '#D5E6D7',
      mutedInk: '#B3C0B6',
      brand: '#79C29B',
      brandText: '#131E19',
      accent: '#79C29B',
      accentSoft: '#243E2E',
      positive: '#79C29B',
      caution: '#E9B66B',
      danger: '#EFA2A2',
      shadow: '0 8px 28px rgba(0, 0, 0, 0.15)',
    },
    keySwatches: [
      { label: 'Warm Parchment', hex: '#F7F5F0' },
      { label: 'Ivory Card', hex: '#FFFEFA' },
      { label: 'Deep Pine Ink', hex: '#213C31' },
      { label: 'Botanical Green', hex: '#25704D' },
      { label: 'Forest Dark BG', hex: '#131E19' },
      { label: 'Sage Mint Dark', hex: '#79C29B' },
    ],
    templatePromptMarkdown: `### THEME TEMPLATE: "Botanical Parchment & Forest Intelligence" (\`mmis-intel-dashboards-v2\`)

**COLOR TOKENS**
- **Light Mode (Default — \`:root\`)**:
  - Canvas: \`#F7F5F0\` (Warm Parchment) | Sidebar: \`#FDFCF9\` | Card: \`#FFFEFA\` | Recessed: \`#F8F8F3\`
  - Border Hairline: \`#E0E6DD\` (Soft Sage) | Shadow: \`0 6px 26px rgba(30, 55, 38, 0.035)\`
  - Text: Primary \`#213C31\` (Deep Pine) | Secondary \`#345247\` | Muted \`#6D7E75\`
  - Brand & Semantic: Deep Forest \`#153C2A\`, Botanical Green \`#25704D\` (tint \`#E8F2E7\`), Ochre \`#AD6B20\` (\`#FFF4DF\`), Terracotta \`#A4413C\` (\`#FFEFEC\`), Slate Blue \`#386A87\` (\`#E9F3FA\`)
- **Dark Mode (\`[data-theme="dark"]\`)**:
  - Canvas: \`#131E19\` | Sidebar: \`#19271E\` | Card: \`#1C2A22\` | Recessed: \`#223428\` | Border: \`#3A5141\`
  - Text: Primary \`#F1F6EE\` | Secondary \`#D5E6D7\` | Muted \`#B3C0B6\` | Accent Green: \`#79C29B\` on \`#243E2E\`

**TYPOGRAPHY & SCALE**
- Primary UI: \`Inter, ui-sans-serif, system-ui, sans-serif\` at 14px base; page titles \`31px\`, weight 780, \`letter-spacing: -1.1px\`, \`line-height: 1.1\`.
- Eyebrows: \`10px\` uppercase, weight 900, \`letter-spacing: 0.17em\`, preceded by a \`16px × 2px\` green rule.
- Brand Monogram: \`Georgia, "Times New Roman", serif\` (weight 900).

**SURFACES & LAYOUT**
- Persistent 2-column dashboard shell: sticky \`252px\` left sidebar + sticky \`72px\` top utility bar + \`1660px\` wide content canvas.
- Organic soft radii: \`15px\` cards, \`9px\` nav items, \`8px\` selects/inputs, \`3px solid #9FCAAD\` focus rings, zero neon glow.`,
  },
  {
    id: 'oitsdhaka',
    shortLabel: 'spenta-dhaka',
    name: 'Spenta Dhaka Corporate',
    sourceUrl: 'https://www.oitsdhaka.com/',
    archetype: 'Swiss Editorial Stone & Heritage Navy',
    defaultPolarity: 'light',
    summary:
      'Restrained institutional B2B consultancy aesthetic built on warm stone paper (#FAF8F4), linen section bands (#F2EFE9), putty hairlines (#E4DFD6), authoritative Heritage Navy (#1F3863), fluid Inter Variable display type, and IBM Plex Mono technical metadata.',
    fontDisplay: '"Inter Variable", Inter, ui-sans-serif, system-ui, sans-serif',
    fontBody: '"Inter Variable", Inter, ui-sans-serif, system-ui, sans-serif',
    fontMono: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    radiusCard: '10px',
    radiusControl: '8px',
    navLayout: 'editorial-topbar',
    hasAmbientGrid: false,
    hasGlassBlur: false,
    eyebrowBar: false,
    light: {
      canvas: '#FAF8F4',
      surface: '#FFFFFF',
      recessed: '#F2EFE9',
      border: '#E4DFD6',
      ink: '#16213A',
      secondaryInk: '#4A5163',
      mutedInk: '#5F6576',
      brand: '#1F3863',
      brandText: '#FFFFFF',
      accent: '#1F3863',
      accentSoft: '#EEF3FB',
      positive: '#1C6E46',
      caution: '#8A5C10',
      danger: '#BF000F',
      shadow: '0 10px 30px -18px rgba(22, 33, 58, 0.14)',
    },
    dark: {
      canvas: '#0B1020',
      surface: '#141A32',
      recessed: '#0F1529',
      border: '#232B4A',
      ink: '#E7EBF5',
      secondaryInk: '#C3CCE4',
      mutedInk: '#8D97B5',
      brand: '#8FA6E8',
      brandText: '#0B1020',
      accent: '#7FA6FF',
      accentSoft: '#161D3A',
      positive: '#6FCB9F',
      caution: '#E0B063',
      danger: '#FF6568',
      shadow: '0 10px 30px -18px rgba(0, 0, 0, 0.45)',
    },
    keySwatches: [
      { label: 'Warm Stone Paper', hex: '#FAF8F4' },
      { label: 'Linen Band', hex: '#F2EFE9' },
      { label: 'Putty Hairline', hex: '#E4DFD6' },
      { label: 'Heritage Navy', hex: '#1F3863' },
      { label: 'Deep Ink', hex: '#16213A' },
      { label: 'Nocturnal Navy', hex: '#0B1020' },
    ],
    templatePromptMarkdown: `### THEME TEMPLATE: "Swiss Editorial Stone & Heritage Navy" (\`spenta-dhaka\`)

**COLOR TOKENS**
- **Light Mode (Default — \`:root\`)**:
  - Canvas: \`#FAF8F4\` (Warm Stone Paper) | Band Surface: \`#F2EFE9\` (Linen) | Elevated Card: \`#FFFFFF\`
  - Hairlines: \`#E4DFD6\` (Line) | \`#ECE8E0\` (Soft) | \`#CFC8BC\` (Strong)
  - Brand Navy: \`#1F3863\` | Strong/Hover: \`#12233F\` | Tint: \`#EEF3FB\` | Soft Accent: \`#D9E1F3\`
  - Text: Heading \`#16213A\` | Body \`#4A5163\` | Muted \`#5F6576\` | Positive \`#1C6E46\` | Caution \`#8A5C10\`
- **Dark Mode (\`.dark\`)**:
  - Canvas: \`#0B1020\` | Surface: \`#0F1529\` | Elevated: \`#141A32\` | Borders: \`#232B4A\` / \`#2E3862\`
  - Brand: \`#8FA6E8\` | Accent: \`#7FA6FF\` | Text: \`#E7EBF5\` / \`#C3CCE4\` / \`#8D97B5\`

**TYPOGRAPHY & SCALE**
- Display & Body: \`"Inter Variable"\` / \`Inter Tight\` with fluid \`clamp()\` display headlines, \`text-balance\`, and a strict \`720px\` reading measure.
- Technical Metadata: \`"IBM Plex Mono"\` (\`12px–12.5px\`) for specs, indices, and architectural notes.

**SURFACES, RADIUS & LAYOUT**
- Disciplined \`1200px\` architectural frame with alternating stone and linen bands separated by crisp 1px horizontal rules.
- Tight geometric radii (\`10px\` cards, \`8px\` buttons/inputs), restrained hover elevation (\`0 10px 30px -18px\`), zero neon glow or heavy blur.`,
  },
  {
    id: 'spenta-os',
    shortLabel: 'Spenta Sovereign OS',
    name: 'Spenta Sovereign OS (Current App)',
    sourceUrl: 'https://spenta.tech/',
    archetype: 'Dark-First Swiss Technical Command & Composable OS',
    defaultPolarity: 'dark',
    summary:
      'Pure Obsidian (#09090B) technical command system with subtle 24px architectural gridlines, carbon cards (#111315), razor-thin white/[0.08] hairlines, Plus Jakarta Sans + JetBrains Mono tabular numerals, emerald/teal/crimson semantic rigor, and landscape print-safe overrides.',
    fontDisplay: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
    fontBody: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
    fontMono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    radiusCard: '14px',
    radiusControl: '8px',
    navLayout: 'command-topbar',
    hasAmbientGrid: true,
    hasGlassBlur: true,
    eyebrowBar: false,
    dark: {
      canvas: '#09090B',
      surface: '#111315',
      recessed: '#18181B',
      border: 'rgba(255, 255, 255, 0.09)',
      ink: '#FAFAFA',
      secondaryInk: '#D4D4D8',
      mutedInk: '#A1A1AA',
      brand: '#E11D48',
      brandText: '#FFFFFF',
      accent: '#10B981',
      accentSoft: 'rgba(16, 185, 129, 0.14)',
      positive: '#10B981',
      caution: '#F59E0B',
      danger: '#E11D48',
      shadow: 'none',
    },
    light: {
      canvas: '#F8FAFC',
      surface: '#FFFFFF',
      recessed: '#F4F4F5',
      border: '#E4E4E7',
      ink: '#09090B',
      secondaryInk: '#3F3F46',
      mutedInk: '#71717A',
      brand: '#E11D48',
      brandText: '#FFFFFF',
      accent: '#059669',
      accentSoft: '#ECFDF5',
      positive: '#059669',
      caution: '#D97706',
      danger: '#E11D48',
      shadow: 'none',
    },
    keySwatches: [
      { label: 'Pure Obsidian', hex: '#09090B' },
      { label: 'Carbon Surface', hex: '#111315' },
      { label: 'Sovereign Emerald', hex: '#10B981' },
      { label: 'Architecture Teal', hex: '#0D9488' },
      { label: 'Governance Amber', hex: '#F59E0B' },
      { label: 'Action Crimson', hex: '#E11D48' },
    ],
    templatePromptMarkdown: `### THEME TEMPLATE: "Obsidian Precision & Sovereign Emerald" (\`Spenta Sovereign OS\`)

**COLOR TOKENS**
- **Dark Mode (Default — \`html.dark\`)**:
  - Canvas: \`#09090B\` (Pure Obsidian + subtle 24px architectural grid on hero stages)
  - Surface: \`#111315\` (Carbon) | Recessed Controls: \`#18181B\` | Hairlines: \`rgba(255, 255, 255, 0.08)\`
  - Text: Primary \`#FAFAFA\` | Secondary \`#D4D4D8\` | Muted \`#A1A1AA\`
- **Light Mode**:
  - Canvas: \`#F8FAFC\` | Surface: \`#FFFFFF\` | Recessed: \`#F4F4F5\` | Hairlines: \`#E4E4E7\`
  - Text: Primary \`#09090B\` | Secondary \`#3F3F46\` | Muted \`#71717A\`
- **Semantic Accents (Both Modes)**:
  - Sovereign Emerald \`#10B981\` (active / >= 0.88 HITL pass), Architecture Teal \`#0D9488\` (L1–L6 integrations), Governance Amber \`#F59E0B\` (< 0.88 review), Action Crimson \`#E11D48\` (exclusive primary CTAs).

**TYPOGRAPHY & SCALE**
- UI & Display: \`Plus Jakarta Sans\` (geometric precision, tight display headings).
- Data & Telemetry: \`JetBrains Mono\` with \`tabular-nums\` strictly enforced across financials, percentages, confidence scores, and layer specs.

**SURFACES, LAYOUT & PRINT**
- Compact 56px glassmorphic topbar (\`max-w-[1440px]\` workspace) + \`⌘K\` Command Palette + right slide-over Stack Composer drawer.
- Flat single-elevation surfaces (hairline borders over drop shadows), \`8px\` controls, \`12px–16px\` cards, plus dedicated landscape \`@media print\` paper-safe overrides stripping all navigation chrome.`,
  },
];

export const THEME_COMPARISON_ROWS: ThemeComparisonRow[] = [
  {
    id: 'archetype',
    dimension: 'Visual Archetype',
    group: 'polish',
    oitsWebV2: 'Cybernetic Midnight Glass & Luminous Sky',
    mmisV2: 'Botanical Editorial Intelligence Workbench',
    oitsDhaka: 'Swiss Institutional Editorial & Heritage Navy',
    spentaOs: 'Dark-First Swiss Technical Command OS',
  },
  {
    id: 'default-mode',
    dimension: 'Default Polarity',
    group: 'color',
    oitsWebV2: 'Dark-first (html.dark midnight navy)',
    mmisV2: 'Light-first (:root warm parchment)',
    oitsDhaka: 'Light-first (:root warm stone paper)',
    spentaOs: 'Dark-first (html.dark pure obsidian)',
  },
  {
    id: 'canvas',
    dimension: 'Canvas Tokens (Dark / Light)',
    group: 'color',
    oitsWebV2: '#070A13 / #F8FAFC',
    mmisV2: '#131E19 / #F7F5F0',
    oitsDhaka: '#0B1020 / #FAF8F4',
    spentaOs: '#09090B (+24px grid) / #F8FAFC',
  },
  {
    id: 'surface',
    dimension: 'Card / Elevated Surface',
    group: 'color',
    oitsWebV2: '#0F172A/70 (glass) / #FFFFFF/95',
    mmisV2: '#1C2A22 / #FFFEFA (warm ivory)',
    oitsDhaka: '#141A32 / #FFFFFF over #F2EFE9 bands',
    spentaOs: '#111315 (carbon) / #FFFFFF',
  },
  {
    id: 'ink',
    dimension: 'Primary Ink (Dark / Light)',
    group: 'color',
    oitsWebV2: '#F8FAFC / #0B0F19 (cool slate)',
    mmisV2: '#F1F6EE / #213C31 (deep pine)',
    oitsDhaka: '#E7EBF5 / #16213A (oxford navy)',
    spentaOs: '#FAFAFA / #09090B (neutral zinc)',
  },
  {
    id: 'accents',
    dimension: 'Brand & Semantic Accents',
    group: 'color',
    oitsWebV2: 'Sky #38BDF8, Blue #2563EB, Navy #1D2A68, Emerald #10B981',
    mmisV2: 'Botanical #25704D/#79C29B, Pine #153C2A, Ochre #AD6B20, Terracotta #A4413C',
    oitsDhaka: 'Heritage Navy #1F3863/#8FA6E8, Soft Tint #EEF3FB, Muted Green #1C6E46',
    spentaOs: 'Emerald #10B981, Teal #0D9488, Amber #F59E0B, Action Crimson #E11D48',
  },
  {
    id: 'typography',
    dimension: 'Typography Pairing',
    group: 'typography',
    oitsWebV2: 'Clean Sans UI + Monospace telemetry tags',
    mmisV2: 'Inter (14px dense, -1.1px titles) + Georgia serif monogram',
    oitsDhaka: 'Inter Variable / Inter Tight (clamp()) + IBM Plex Mono',
    spentaOs: 'Plus Jakarta Sans + JetBrains Mono (tabular-nums)',
  },
  {
    id: 'elevation',
    dimension: 'Borders & Elevation Style',
    group: 'layout',
    oitsWebV2: 'Translucent slate borders, frosted blur, luminous glows',
    mmisV2: 'Organic sage hairlines (#E0E6DD), ultra-soft ambient shadow (0 6px 26px)',
    oitsDhaka: 'Putty/navy 1px rules (#E4DFD6), flat editorial rhythm, minimal hover lift',
    spentaOs: 'Razor-thin white/[0.08] / zinc-200 hairlines, flat single-elevation cards',
  },
  {
    id: 'radius',
    dimension: 'Corner Radius System',
    group: 'layout',
    oitsWebV2: 'Modern rounded (12px–24px / xl–3xl)',
    mmisV2: 'Soft organic (15px cards, 9px nav, 12px callouts)',
    oitsDhaka: 'Tight architectural (8px–10px, max 16px)',
    spentaOs: 'Structured technical (8px controls, 12px–16px stages)',
  },
  {
    id: 'navigation',
    dimension: 'Navigation & Spatial Frame',
    group: 'layout',
    oitsWebV2: 'Fixed transparent→glass topbar, 1280px (max-w-7xl) marketing flow',
    mmisV2: 'Sticky 252px left sidebar + 72px topbar, 1660px wide BI canvas',
    oitsDhaka: 'Editorial top header, strict 1200px frame + 720px prose measure',
    spentaOs: 'Compact 56px glass topbar (7 tabs + ⌘K + slide-over drawer), 1440px canvas',
  },
  {
    id: 'motion',
    dimension: 'Motion & Visual Atmosphere',
    group: 'polish',
    oitsWebV2: 'Expressive (float, pulseGlow, shimmer, marquee, 500ms theme fade)',
    mmisV2: 'Calm & utilitarian (instant feedback, crisp focus rings, zero glow)',
    oitsDhaka: 'Restrained editorial (smooth scroll, subtle hover transitions)',
    spentaOs: 'Precision functional (3D Three.js / SVG stages, 150ms crisp transitions)',
  },
  {
    id: 'print',
    dimension: 'Print & Document Strategy',
    group: 'polish',
    oitsWebV2: 'Screen-first marketing experience',
    mmisV2: 'Screen-focused enterprise admin cockpit',
    oitsDhaka: 'Editorial corporate web experience',
    spentaOs: 'Dedicated landscape @media print paper override + 16:9 vector PDF engine',
  },
];

export function buildThemeComparisonTableMd(): string {
  const header = `| Design Dimension | 1. spenta-web-v2 (Vercel) | 2. mmis-intel-dashboards-v2 | 3. spenta-dhaka | 4. Spenta Sovereign OS (Current App) |
| :--- | :--- | :--- | :--- | :--- |`;
  const rows = THEME_COMPARISON_ROWS.map(
    (r) => `| **${r.dimension}** | ${r.oitsWebV2} | ${r.mmisV2} | ${r.oitsDhaka} | ${r.spentaOs} |`,
  ).join('\n');
  return `${header}\n${rows}`;
}

export interface DeepAnalysisPillar {
  id: string;
  index: string;
  title: string;
  oitsDhakaPattern: string;
  roadmapShAdaptation: string;
  odooContentMapping: string;
}

export const OITS_DHAKA_DEEP_ANALYSIS_PILLARS: DeepAnalysisPillar[] = [
  {
    id: 'surfaces',
    index: '01',
    title: 'Editorial Surface Cadence & Color Architecture',
    oitsDhakaPattern:
      'Warm Stone Paper (#FAF8F4) primary canvas alternating with Linen Bands (#F2EFE9), crisp #FFFFFF elevated cards, Putty 1px hairlines (#E4DFD6), Heritage Navy (#1F3863) focal actions, and Nocturnal Navy (#0B1020) dark mode.',
    roadmapShAdaptation:
      'High-contrast neutral architectural canvas makes interactive nodes, active Heritage Navy/Emerald orthogonal buses, and hover tooltips immediately legible without visual noise.',
    odooContentMapping:
      'Replaces dark obsidian framing on the remix branch while preserving 100% semantic rigor across all 7 tabs, KPI strips, and landscape print-to-PDF stylesheets.',
  },
  {
    id: 'infographics-code',
    index: '02',
    title: 'Code-Drawn Architectural Infographics (Zero Static Raster)',
    oitsDhakaPattern:
      'Disciplined Swiss institutional graphics built from 1px rules, numbered indices (01.–06.), rectilinear rounded-10px blocks, balanced whitespace, and muted Heritage Navy/Emerald highlights.',
    roadmapShAdaptation:
      'Every node, connector bus, and sub-component is rendered as live React + SVG vectors supporting hover tooltips, click-to-expand branches, active path illumination, and keyboard focus.',
    odooContentMapping:
      'Transforms the 4 Spenta executive visual plates (8-Hub Brain, L1–L6 Fusion Stack, Captive BEST/X Ltd Synergies, FY27–FY31 Trajectory) into interactive, clickable code diagrams synced to StackContext.',
  },
  {
    id: 'branching-ux',
    index: '03',
    title: 'roadmap.sh Interactive Pathway & Slide-In Inspector',
    oitsDhakaPattern:
      'Strict 1200px institutional container with 720px prose measure and zero decorative clutter, ensuring technical architects can read complex specifications cleanly.',
    roadmapShAdaptation:
      'Multi-level branching (Pillar → Sub-Component → Leaf Compositions), progress/stack checkboxes, instant Expand All / Collapse All, and a right-hand slide-in Inspector Drawer.',
    odooContentMapping:
      'Maps every Spenta App, Sovereign Layer (L1–L6), Server Tier (1–4), and 0.88 OPA Gate rule to expandable branches that toggle modules directly in the Stack Composer.',
  },
  {
    id: '3d-pbr',
    index: '04',
    title: 'Tactile 3D Artifacts & Meaningful Visual Feedback',
    oitsDhakaPattern:
      'Restrained industrial polish—tactile physical depth rather than arcade neon glows—paired with crisp monospace technical callouts.',
    roadmapShAdaptation:
      'Hovering a 3D hub pins a projected telemetry callout card next to the node; clicking triggers an expanding radial emissive shockwave and accelerates synaptic conduit packets.',
    odooContentMapping:
      'Upgrades the Three.js Sovereign Neural Core with procedural anisotropic brushed metal, frosted optical glass hemispheres, RoomEnvironment reflections, and Obsidian Titanium ↔ Heritage Stone & Navy finishes.',
  },
];

export const OITS_DHAKA_ROADMAP_MASTER_PROMPT = `# MASTER REMIX PROMPT: Spenta Dhaka Editorial Theme × roadmap.sh Interactive Architecture (Spenta / Odoo Sovereign OS Branch)

> **Target GitHub Workflow**: Create a dedicated remix branch from \`main\` (\`git checkout -b remix/spenta-dhaka-roadmap-edition\`). Keep all existing Spenta/Odoo business logic, \`StackContext\` state, 13-app manifest, 5-year Financials, 18-Slide Pitch Deck, and PDF/Print exporters 100% functional while transforming the visual system, code-drawn infographics, and 3D materials into the **Spenta Dhaka × roadmap.sh** edition.

---

## 1. Deep Design Token Contract (\`spenta-dhaka\` Swiss Editorial Stone & Heritage Navy)

Implement these exact CSS custom properties and Tailwind v4 dual-theme tokens (\`@custom-variant dark (&:where(.dark, .dark *));\`):

### Light Mode (Default — \`:root\`, Warm Stone Editorial)
- **Canvas**: \`#FAF8F4\` (Warm Stone Paper)
- **Alternating Section Band / Recessed**: \`#F2EFE9\` (Architectural Linen)
- **Elevated Card Surface**: \`#FFFFFF\` (Crisp Institutional White)
- **Hairline Borders**: \`#E4DFD6\` (Standard), \`#ECE8E0\` (Soft), \`#CFC8BC\` (Strong)
- **Typography Ink**: Primary Heading \`#16213A\` (Oxford Ink) | Body \`#4A5163\` | Muted Metadata \`#5F6576\`
- **Brand & Interactive Accents**:
  - Heritage Navy Primary: \`#1F3863\` (Hover Strong: \`#12233F\`, Active Fill Tint: \`#EEF3FB\`, Subtle Border: \`#D9E1F3\`)
  - Sovereign Verified Green: \`#1C6E46\` (Active Stack / >= 0.88 OPA Pass)
  - Governance Amber: \`#8A5C10\` (< 0.88 HITL Review Queue)
  - Critical Alert / Exclusive Action: \`#BF000F\`

### Dark Mode (\`html.dark\`, Nocturnal Heritage Navy)
- **Canvas**: \`#0B1020\` | **Section Band**: \`#0F1529\` | **Elevated Card**: \`#141A32\`
- **Hairlines**: \`#232B4A\` (Standard) | \`#2E3862\` (Strong)
- **Typography Ink**: Primary \`#E7EBF5\` | Body \`#C3CCE4\` | Muted \`#8D97B5\`
- **Brand & Accents**: Luminous Heritage Blue \`#8FA6E8\` / \`#7FA6FF\` (Tint \`#161D3A\`), Verified Sage \`#6FCB9F\`, Governance Gold \`#E0B063\`.

### Typography, Geometry & Layout Rhythm
- **Display & UI**: \`"Plus Jakarta Sans"\` / \`"Inter Variable"\` with fluid \`clamp()\` display headlines (\`text-wrap: balance\`), crisp 600–800 weight contrast, and strict \`720px\` prose reading measure inside a disciplined \`1200px\` architectural frame.
- **Technical Metadata & Numerals**: \`"IBM Plex Mono"\` / \`"JetBrains Mono"\` with \`font-variant-numeric: tabular-nums\` on all prices, GM%, confidence scores, server specs, and editorial indices (\`01.\`–\`06.\`).
- **Radii & Elevation**: Tight geometric radii (\`10px\` cards, \`8px\` controls/buttons/inputs), single-elevation flat surfaces separated by 1px putty/navy hairlines and whitespace—zero nested card-in-card clutter, zero static metadata pills, zero pulsing status dots, zero neon drop-shadows.

---

## 2. Primary Content Mapping (Current Spenta / Odoo Sections → Spenta Dhaka Frame)

Preserve every real dataset and working handler while restyling all 7 primary sections into alternating Stone (\`#FAF8F4\`) and Linen (\`#F2EFE9\`) editorial bands:

1. **App Vault (13 Composable Odoo-Style Modules)**:
   - Lead with an editorial numbered header (\`01. Composable Enterprise Modules\`) + 4-metric tabular KPI strip.
   - Render the 13 modules in a crisp hairline grid with unboxed \`·\`-separated metadata, Heritage Navy selection state, recursive dependency auto-attachment notices, and slide-over Stack Composer drawer.
2. **Infographics (Code-Drawn Interactive Plates — Primary Focus)**:
   - Replace static-only visuals with **code-drawn SVG + React architectural schematics** matching Spenta Dhaka's crisp blueprint aesthetic AND **roadmap.sh** interactive ergonomics (see Section 3 below).
3. **Financials (FY2027–FY2031 P&L & GM Matrix)**:
   - Restyle Recharts axes/series to Heritage Navy (\`#1F3863\`), Sovereign Green (\`#1C6E46\`), and Putty hairlines (\`#E4DFD6\`), keeping Conservative/Upside scenario switches, FX/Tax sliders, and 1-page Quick Summary PDF export intact.
4. **Spenta Core (L1–L6 Stack, 4-Tier Server Matrix, Dual-Shore Pods & Audit Log)**:
   - Present L6→L1 as an architectural spine with interactive OPA/TEE/Isolation controls and chronological Audit Log diffs.
5. **The Brain (3D Sovereign Neural Core + Operational Tech Radar + 0.88 HITL Simulator)**:
   - Upgrade the 3D scene with tactile PBR materials and projected hover callouts (see Section 4 below).
6. **Pitch Deck (18-Slide Stage + Blob PDF & Landscape Print CSS)**:
   - Maintain smooth fade-in/out slide transitions, serialized \`.pitch-deck-print-deck\` Blob PDF download, floating Print button, and paper-safe \`@media print\` rules.
7. **Resources & Studio**:
   - Include Proofs, Proposal Workbench, per-section Markdown downloads, 4-Theme Virtual Iframes toggle, and Scoped Light/Dark Design Comparison Matrix.

---

## 3. Code-Drawn Infographics & \`roadmap.sh\` Interactive Pathway Spec

All architecture plans, system pathways, and executive diagrams MUST be implemented as **deterministic code-drawn SVG + React components**—never flat raster screenshots:

- **Visual Style (Spenta Dhaka GUI Grammar)**:
  - Crisp 1px orthogonal SVG connector buses (\`#CFC8BC\` resting, \`#1F3863\` expanded, \`#1C6E46\` active in Stack Composer).
  - Editorial numbered pillar blocks (\`01.\` Sovereign Core L1–L6, \`02.\` Operations Engine, \`03.\` Experience & IR4 Engine, \`04.\` On-Prem Server Tiers & Dual-Shore Pods, \`05.\` 0.88 OPA HITL & Captive Proofs).
  - Scoped Stone Light / Nocturnal Dark toggle directly on the diagram toolbar.
- **Interactive Ergonomics (\`roadmap.sh\` UX Contract)**:
  1. **Hover Tooltips**: Hovering or keyboard-focusing any pillar, sub-component, or leaf composition immediately reveals a high-contrast contextual telemetry bar/tooltip (code, title, concise summary, quantitative SLA/GM metric, and click hint) with zero viewport clipping.
  2. **Multi-Level Branch Expansion**: Clicking any trunk pillar expands its orthogonal branch tree of sub-components; clicking any sub-component expands its **leaf compositions** (capabilities, API protocols, hardware specs, and native cross-module synergy links that jump straight to connected branches).
  3. **Slide-In Inspector Drawer**: Clicking a branch opens a roadmap.sh-style detail inspector on the right with full specs, verified proof client, layer bindings, and a live **Add to Stack / Active in Stack** toggle bound directly to \`StackContext.toggleApp()\`.
  4. **Pathway Utilities**: Provide one-click \`Expand All\`, \`Collapse All\`, \`Reset Pathway\`, and \`Export Pathway (.md)\` controls.

---

## 4. 3D Artifacts — Tactile PBR Materials & Meaningful Visual Feedback Spec

For the Three.js **3D Sovereign Neural Core** (and any future 3D architectural artifacts on this remix branch):

- **Physically Based Materials (Zero External 404s)**:
  - Initialize \`RoomEnvironment\` via \`PMREMGenerator\` on every device so metallic and glass surfaces carry crisp studio reflections.
  - **Anisotropic Brushed Metal** (\`MeshPhysicalMaterial\`): Procedural HTML5 Canvas brushed-grain bump/roughness map (\`metalness: 0.92\`, \`roughness: 0.24\`, \`anisotropy: 0.8\`, \`clearcoat: 0.35\`) on L1–L6 spine rings, hemisphere ribs, hub bevel collars, and grounded circuit pedestal trim.
  - **Frosted Optical Glass** (\`MeshPhysicalMaterial\`): Dual brain hemisphere shells and hub containment capsules (\`transmission: isSoftwareGl ? 0 : 0.72\`, \`ior: 1.52\`, \`thickness: 1.2\`, \`roughness: 0.22\`, \`clearcoat: 1.0\`, graceful translucent fallback on software WebGL) revealing luminous crystalline inner cores.
  - **Dual Material Finish Toggle**: Support switching between **Obsidian Titanium** and **Spenta Heritage Stone & Navy** (\`#FAF8F4\` studio cyclorama / \`#1F3863\` brushed navy anodized titanium + warm frosted quartz glass) in real time without tearing down the WebGL context.
- **Meaningful Visual Feedback**:
  - **Hover Telemetry Callout**: Project the hovered 3D node's world position (\`vector.project(camera)\`) to a clamped, solid-surface DOM callout (zero \`backdrop-filter\` over WebGL) displaying Hub Index, Title, Active App Count, and click action.
  - **Click / Selection Shockwave Ripple**: Clicking a hub or toggling an app spawns an expanding radial emissive pulse ring around that hub and accelerates \`InstancedMesh\` synaptic data packets along its Bezier conduit.
  - **OPA 0.88 State Shift**: Dropping simulated confidence below \`0.88\` smoothly shifts the orbiting OPA governance ring, core light, and shockwave accents from Verified Emerald to Governance Amber with heightened audit cadence.

---

## 5. 4-Resource Architecture & UX Enhancement Contract

Synthesize these four high-signal interactive engineering and UI pattern benchmarks directly into the remix branch:

1. **Deployment Provider Swapping (\`system-design-explainer.vercel.app\`)**:
   - Every interactive architecture diagram MUST include a live **Deployment Profile Switcher** (\`Sovereign On-Prem\`, \`Private VPC\`, \`Air-Gapped Enclave\`).
   - Switching deployment profiles instantaneously relabels node protocols (e.g., local loopback NVLink vs. WireGuard mTLS VPC vs. physical HSM air-gap diode), latency envelopes, CapEx/OpEx posture, and Inspector Drawer failure-pitfall trade-offs without losing expanded branch state.
2. **Hop-by-Hop Request Walkthrough Player (\`systemdesignprimer.vercel.app\`)**:
   - Pair the branching architecture tree with a **Walkthrough Transport Bar** (\`Play / Pause\`, \`Prev\`, \`Next\`, \`Reset\`) tracing real multi-hop enterprise requests (e.g., *Banking ICR Form → LLaMA 3.2 Vision → 0.88 OPA Gate → PostgreSQL/Kafka Ledger*, *Hospital HL7 Shift Handover*, *X Ltd <50ms EV Battery Swap*).
   - Advancing each hop automatically illuminates the active orthogonal SVG node, expands its owning branch, focuses the Inspector Drawer, and prints hop payload, latency budget, and mitigation trade-offs.
3. **UI Pattern Taxonomy & State Completeness (\`refero.design\`)**:
   - Audit every core screen against Refero's multi-tag UX pattern taxonomy (\`Page Type\` × \`UX Pattern\` × \`Screen State Coverage\`).
   - Every interactive data view must explicitly handle **Populated**, **Empty** (actionable reset/CTA), **Loading** (geometry-matched skeleton/fallback), **Error** (inline recovery), and **Print/PDF** states—no blank voids or dead states.
4. **Responsive Preview / Code Split & Visual Design Mode (\`v0.app\`)**:
   - Provide a live Studio workbench featuring a **Responsive Viewport Switcher** (\`Desktop 100%\` / \`Tablet 768px\` / \`Mobile 375px\`), **Preview / Split / Code** mode toggle, and a **Visual Design Mode Token Tweaker** (brand accent, card radius, layout density, polarity) that live-updates both the isolated virtual iframe and the copyable CSS custom properties / Tailwind \`@theme\` output.

---

## 6. GitHub Multi-Branch Remix Checklist & Acceptance Criteria

\`\`\`bash
git checkout -b remix/spenta-dhaka-roadmap-edition
# 1. Apply Spenta Dhaka semantic tokens in src/index.css (preserve @custom-variant dark)
# 2. Swap static plates for InteractiveArchitecturePathway + hop-by-hop walkthrough & deployment swap
# 3. Enable Spenta Heritage Stone & Navy default finish in SovereignBrain3DCanvas
# 4. Run Refero state-completeness audit & v0 responsive viewport checks
# 5. Run full typecheck & production bundle check
npm run lint && npm run build
\`\`\`

**Acceptance Criteria**:
- Zero horizontal overflow at 375px, 768px, 1280px, and 1440px.
- WCAG AA+ contrast verified in both Warm Stone Light and Nocturnal Navy Dark modes.
- Every node in the interactive pathway expands/collapses deterministically, responds to deployment profile swaps, steps cleanly through hop-by-hop traces, and mutates \`StackContext\` live.
- 3D canvas maintains smooth frame pacing (software-WebGL guarded), disposes all geometries/materials/textures on unmount, and falls back gracefully if WebGL is unavailable.`;

export type ReferoPageType = 'Vault' | 'Architecture' | 'Analytics' | 'Presenter' | 'Workbench';

export interface ReferoPatternSpec {
  id: string;
  title: string;
  pageType: ReferoPageType;
  uxPatterns: string[];
  targetTab: 'App Vault' | 'Infographics' | 'Financials' | 'Spenta Core' | 'The Brain' | 'Pitch Deck' | 'Resources';
  summary: string;
  tokenAnatomy: string;
  referenceNote: string;
  states: {
    populated: boolean;
    empty: boolean;
    loading: boolean;
    error: boolean;
    print: boolean;
  };
}

export const REFERO_UI_PATTERNS: ReferoPatternSpec[] = [
  {
    id: 'ref-app-vault',
    title: 'Composable 13-Module Catalog & 2D Orthogonal Bus',
    pageType: 'Vault',
    uxPatterns: ['Filterable Grid', 'Interactive SVG', 'Detail Modal'],
    targetTab: 'App Vault',
    summary:
      'Odoo-inspired composable catalog synchronized live with an 8-hub SVG topology diagram, starter recipes, and recursive dependency notices.',
    tokenAnatomy: 'Single-elevation 14px cards · 1px hairlines · Tabular KPI strip · Emerald active states',
    referenceNote: 'Refero SaaS Marketplace & Catalog Pattern (multi-facet search + instant state feedback)',
    states: { populated: true, empty: true, loading: false, error: false, print: true },
  },
  {
    id: 'ref-stack-drawer',
    title: 'Persistent Slide-Over Stack Composer Drawer',
    pageType: 'Workbench',
    uxPatterns: ['Slide-Over Drawer', 'Live Calculator', 'Export Actions'],
    targetTab: 'App Vault',
    summary:
      'Right-anchored 420px drawer computing build scope, blended GM%, auto-escalated server tier, L1–L6 coverage bar, and JSON/Email export.',
    tokenAnatomy: '420px overlay · Escape-to-close · 6-segment layer bar · Sticky action footer',
    referenceNote: 'Refero Cart & Configurator Drawer Pattern (zero-navigation context preservation)',
    states: { populated: true, empty: true, loading: false, error: false, print: false },
  },
  {
    id: 'ref-pathway-tree',
    title: 'Spenta Dhaka × roadmap.sh Branching Pathway & Walkthrough',
    pageType: 'Architecture',
    uxPatterns: ['Expandable Tree', 'Hop-by-Hop Player', 'Scoped Theme Toggle', 'Slide-In Inspector'],
    targetTab: 'Infographics',
    summary:
      'Code-drawn architectural diagram with On-Prem/VPC/Air-Gap provider swapping, animated request playback, hover telemetry, and live Stack sync.',
    tokenAnatomy: 'Stone #FAF8F4 / Nocturnal #0B1020 · 10px radii · 1px orthogonal SVG connectors',
    referenceNote: 'Synthesizes roadmap.sh + system-design-explainer + systemdesignprimer interactive patterns',
    states: { populated: true, empty: true, loading: false, error: false, print: true },
  },
  {
    id: 'ref-financial-cockpit',
    title: '5-Year Financial P&L, Sensitivity Sliders & 1-Page PDF',
    pageType: 'Analytics',
    uxPatterns: ['Composed Chart', 'Live Sliders', 'Sortable Matrix', 'Quick PDF Modal'],
    targetTab: 'Financials',
    summary:
      'Reconciled FY2027–FY2031 revenue/EBITDA/net-profit modeling with Conservative/Upside toggle, BDT/USD FX & Tax sliders, and 1-page jsPDF export.',
    tokenAnatomy: 'JetBrains Mono tabular-nums · Theme-aware Recharts · 13-row sortable GM matrix',
    referenceNote: 'Refero Executive Analytics & Scenario Modeler Pattern (direct manipulation + instant PDF)',
    states: { populated: true, empty: false, loading: false, error: false, print: true },
  },
  {
    id: 'ref-core-audit',
    title: 'L1–L6 Sovereign Spine, Server Matrix & Immutable Audit Log',
    pageType: 'Architecture',
    uxPatterns: ['Vertical Spine', 'Config Diff Table', 'Inline Confirmation'],
    targetTab: 'Spenta Core',
    summary:
      'Interactive layer inspector recording every OPA/TEE/isolation mutation into a searchable, CSV/JSON-exportable Previous → New Value audit log.',
    tokenAnatomy: 'Monospace ISO timestamps · Inline confirm (no window.confirm) · Segmented sub-nav',
    referenceNote: 'Refero Enterprise Settings & Audit Trail Pattern (safe destructive actions + filterable log)',
    states: { populated: true, empty: true, loading: false, error: false, print: true },
  },
  {
    id: 'ref-brain-3d',
    title: 'PBR 3D Neural Core, Operational Tech Radar & 0.88 HITL Gate',
    pageType: 'Architecture',
    uxPatterns: ['3D Spatial Viewport', 'Projected Callouts', 'Threshold Simulator', 'Error Boundary'],
    targetTab: 'The Brain',
    summary:
      'Anisotropic brushed-metal & frosted-glass Three.js neural core with click shockwaves, 2D SVG radar fallback, and real-time 0.88 OPA confidence gate.',
    tokenAnatomy: 'Collapsible bottom dock · Zero backdrop-filter over WebGL · RoomEnvironment PBR',
    referenceNote: 'Refero Interactive Simulation & Resilient WebGL Fallback Pattern',
    states: { populated: true, empty: true, loading: true, error: true, print: false },
  },
  {
    id: 'ref-pitch-stage',
    title: '18-Slide Widescreen Presenter, Fade Transitions & Print Deck',
    pageType: 'Presenter',
    uxPatterns: ['16:9 Stage', 'Keyboard Navigation', 'Blob PDF Export', 'Print Media Isolation'],
    targetTab: 'Pitch Deck',
    summary:
      '12-column investor briefing room with directional fade-in/out transitions, speaker notes, serialized Blob PDF export, and floating landscape print bar.',
    tokenAnatomy: 'aspect-[16/9] stage · 18-slide index rail · @media print paper-safe override',
    referenceNote: 'Refero Presentation & Document Export Pattern (dual screen + paper fidelity)',
    states: { populated: true, empty: false, loading: true, error: true, print: true },
  },
  {
    id: 'ref-command-palette',
    title: 'Global Command Palette Search (⌘K)',
    pageType: 'Workbench',
    uxPatterns: ['Command Palette', 'Keyboard Navigation', 'Deep-Link Routing'],
    targetTab: 'App Vault',
    summary:
      'Instant cross-portal spotlight indexing all 13 apps, 18 slides, 6 layers, 4 server tiers, recipes, blueprints, and studio resources.',
    tokenAnatomy: 'max-w-2xl centered overlay · ArrowUp/Down/Enter/Esc · Grouped result rows',
    referenceNote: 'Refero Linear/Vercel Command Menu Pattern (sub-50ms keyboard-first discovery)',
    states: { populated: true, empty: true, loading: false, error: false, print: false },
  },
  {
    id: 'ref-v0-studio',
    title: 'v0-Style 4-Theme Virtual Iframes & Visual Design Mode',
    pageType: 'Workbench',
    uxPatterns: ['Virtual Iframes', 'Responsive Viewport Switch', 'Preview/Code Split', 'Design Mode'],
    targetTab: 'Resources',
    summary:
      'Isolated srcDoc multi-theme sandbox toggling between 2×2 comparison and Single Focus with Desktop/Tablet/Mobile frames and live CSS token tweaking.',
    tokenAnatomy: 'sandbox="allow-scripts" iframes · 375/768/100% frames · Live :root CSS code sync',
    referenceNote: 'Synthesizes v0.app split-pane visual editing + Refero design-token dissection',
    states: { populated: true, empty: true, loading: false, error: false, print: false },
  },
  {
    id: 'ref-comparison-matrix',
    title: 'Scoped Light/Dark 4-Way Design Comparison Matrix',
    pageType: 'Analytics',
    uxPatterns: ['Sticky Column Table', 'Scoped Theme Toggle', 'Markdown Copy'],
    targetTab: 'Resources',
    summary:
      'Independent Light/Dark table comparing Odoo (Spenta OS), Spenta Web, MMIS Intel, and Spenta Dhaka across Visual Style, Typography, Spacing, and Palette.',
    tokenAnatomy: 'Sticky criterion th · Swatch chips · Independent local tableTheme state',
    referenceNote: 'Refero Design-System Matrix Pattern (high-density scannability + zero global bleed)',
    states: { populated: true, empty: false, loading: false, error: false, print: true },
  },
];

export function buildPriorityPhaseMd(priority: PromptPriority): string {
  const phaseTitles: Record<PromptPriority, string> = {
    P0: 'P0 — Foundation, Navigation & Primary Discovery (Build First)',
    P1: 'P1 — Core Interactive Intelligence & Commercial Depth (Build Second)',
    P2: 'P2 — Visuals, Exports, 3D/Spatial & Hardening (Build Third)',
  };

  const sections = AGENT_PROMPT_SECTIONS.filter((s) => s.priority === priority)
    .map((s) => s.promptMarkdown)
    .join('\n\n---\n\n');

  return `# Spenta Sovereign OS — ${phaseTitles[priority]}

> Universal Markdown Coding-Agent Prompt Set (${priority} Phase). Compatible with Cursor, Claude Code, Windsurf, and Google AI Studio.

${GLOBAL_AGENT_PREAMBLE}

---

${sections}
`;
}

export function buildSinglePromptSectionMd(section: AgentPromptSection): string {
  const deps = section.dependsOn.length > 0 ? section.dependsOn.join(', ') : 'None (Root Foundation)';
  return `# Spenta Sovereign OS — ${section.code}: ${section.title}

- **Priority Phase**: ${section.priority} (${section.phaseLabel})
- **Target Area**: ${section.targetArea}
- **Dependencies**: ${deps}

${GLOBAL_AGENT_PREAMBLE}

---

${section.promptMarkdown}
`;
}

export function buildOitsDhakaMasterRemixMd(): string {
  return `${OITS_DHAKA_ROADMAP_MASTER_PROMPT}\n`;
}

export function buildSequencePromptsMd(): string {
  const sectionsByPriority = (priority: PromptPriority) =>
    AGENT_PROMPT_SECTIONS.filter((s) => s.priority === priority)
      .map((s) => s.promptMarkdown)
      .join('\n\n---\n\n');

  return `# Spenta Sovereign OS — P0 / P1 / P2 Coding-Agent Design & Develop Prompt Pack

> Universal Markdown format compatible with Cursor, Claude Code, Windsurf, and Google AI Studio.

${GLOBAL_AGENT_PREAMBLE}

---

# P0 — Foundation, Navigation & Primary Discovery (Build First)

${sectionsByPriority('P0')}

---

# P1 — Core Interactive Intelligence & Commercial Depth (Build Second)

${sectionsByPriority('P1')}

---

# P2 — Visuals, Exports, 3D/Spatial & Hardening (Build Third)

${sectionsByPriority('P2')}
`;
}

export function buildThemeTemplatesPackMd(): string {
  const themesBlock = THEME_REFERENCE_SPECS.map(
    (t, idx) => `## Reference ${idx + 1}: ${t.name}
- **URL**: ${t.sourceUrl}
- **Visual Archetype**: ${t.archetype}
- **Default Polarity**: ${t.defaultPolarity.toUpperCase()}
- **Summary**: ${t.summary}

${t.templatePromptMarkdown}`,
  ).join('\n\n---\n\n');

  return `# 4-Way Design & Theme Analysis + Universal Theme Templating Prompts

> Grounded in direct live stylesheet & token inspection of \`spenta-web-v2\`, \`mmis-intel-dashboards-v2\`, \`spenta-dhaka\`, and **Spenta Sovereign OS**.

${themesBlock}

---

## 4-Way Design & Theme Comparison Matrix (Design & Theme POV Only)

${buildThemeComparisonTableMd()}
`;
}

export function buildFullPromptPackMd(): string {
  return `${buildSequencePromptsMd()}

---

${buildThemeTemplatesPackMd()}

---

${OITS_DHAKA_ROADMAP_MASTER_PROMPT}
`;
}

export function downloadMarkdownFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
