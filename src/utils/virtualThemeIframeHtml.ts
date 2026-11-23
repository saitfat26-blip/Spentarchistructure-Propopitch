import { ThemeReferenceSpec } from '../data/promptThemeStudioData';
import { DeploymentProfileSpec } from '../data/deploymentProfiles';

export interface ThemeOverridePatch {
  brandHex?: string;
  accentHex?: string;
  radiusCardPx?: number;
  density?: 'compact' | 'balanced' | 'editorial';
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parsePx(value: string, fallback: number): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function resolveEffectiveThemeTokens(
  spec: ThemeReferenceSpec,
  polarity: 'light' | 'dark',
  overrides?: ThemeOverridePatch,
) {
  const base = polarity === 'dark' ? spec.dark : spec.light;
  const radiusCardPx = overrides?.radiusCardPx ?? parsePx(spec.radiusCard, 12);
  const radiusControlPx = Math.max(4, Math.min(14, Math.round(radiusCardPx * 0.65)));
  const brand = overrides?.brandHex || base.brand;
  const accent = overrides?.accentHex || overrides?.brandHex || base.accent;
  const density = overrides?.density ?? 'balanced';

  return {
    ...base,
    brand,
    accent,
    radiusCard: `${radiusCardPx}px`,
    radiusControl: `${radiusControlPx}px`,
    density,
  };
}

/**
 * Generates a copy-ready CSS custom property & Tailwind v4 @theme block reflecting
 * live v0 Design Mode token tweaks for the selected theme and polarity.
 */
export function buildCustomThemeTokenCss(
  spec: ThemeReferenceSpec,
  polarity: 'light' | 'dark',
  overrides?: ThemeOverridePatch,
  deploymentProfile?: DeploymentProfileSpec,
): string {
  const t = resolveEffectiveThemeTokens(spec, polarity, overrides);
  const padMain = t.density === 'compact' ? '12px' : t.density === 'editorial' ? '24px' : '16px';
  const gapGrid = t.density === 'compact' ? '8px' : t.density === 'editorial' ? '16px' : '12px';
  const infraComment = deploymentProfile
    ? `\n * Infrastructure Target: ${deploymentProfile.shortLabel} (${deploymentProfile.latencyBudget})\n * Transport: ${deploymentProfile.transport}\n * Enclave: ${deploymentProfile.enclaveBoundary}`
    : '';
  const infraVars = deploymentProfile
    ? `\n  --infra-target: "${deploymentProfile.switcherLabel}";\n  --infra-latency-budget: "${deploymentProfile.latencyBudget}";`
    : '';

  return `/* ${spec.name} (${polarity.toUpperCase()}) — Generated Design Mode Tokens${infraComment}
 */
:root${polarity === 'dark' ? '.dark' : ''} {
  --bg-canvas: ${t.canvas};
  --bg-surface: ${t.surface};
  --bg-recessed: ${t.recessed};
  --border-hairline: ${t.border};

  --ink-primary: ${t.ink};
  --ink-secondary: ${t.secondaryInk};
  --ink-muted: ${t.mutedInk};

  --brand-primary: ${t.brand};
  --brand-on-primary: ${t.brandText};
  --accent-interactive: ${t.accent};
  --accent-soft: ${t.accentSoft};

  --semantic-positive: ${t.positive};
  --semantic-caution: ${t.caution};
  --semantic-danger: ${t.danger};

  --radius-card: ${t.radiusCard};
  --radius-control: ${t.radiusControl};
  --space-surface: ${padMain};
  --space-gap: ${gapGrid};
  --elevation-card: ${t.shadow};${infraVars}
}

@theme inline {
  --font-display: ${spec.fontDisplay};
  --font-sans: ${spec.fontBody};
  --font-mono: ${spec.fontMono};
}`;
}

/**
 * Generates a fully isolated, self-contained HTML/CSS/JS document for rendering
 * each referenced theme inside a sandboxed virtual <iframe> without CSS bleed.
 */
export function buildVirtualThemeIframeSrcDoc(
  spec: ThemeReferenceSpec,
  polarity: 'light' | 'dark',
  overrides?: ThemeOverridePatch,
  deploymentProfile?: DeploymentProfileSpec,
): string {
  const tokens = resolveEffectiveThemeTokens(spec, polarity, overrides);
  const isSidebar = spec.navLayout === 'sidebar-workbench';
  const isEditorial = spec.navLayout === 'editorial-topbar';
  const isGlass = spec.hasGlassBlur;

  const mainPad =
    tokens.density === 'compact'
      ? '10px'
      : tokens.density === 'editorial'
        ? '20px'
        : '14px';
  const sectionGap =
    tokens.density === 'compact'
      ? '8px'
      : tokens.density === 'editorial'
        ? '15px'
        : '11px';
  const cardPad =
    tokens.density === 'compact'
      ? '7px 9px'
      : tokens.density === 'editorial'
        ? '12px 14px'
        : '9px 10px';
  const baseFont =
    tokens.density === 'compact'
      ? '11.5px'
      : tokens.density === 'editorial'
        ? '12.5px'
        : '12px';

  const gridBg = spec.hasAmbientGrid
    ? polarity === 'dark'
      ? 'background-image: linear-gradient(to right, rgba(255,255,255,0.032) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.032) 1px, transparent 1px); background-size: 22px 22px;'
      : 'background-image: linear-gradient(to right, rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.04) 1px, transparent 1px); background-size: 22px 22px;'
    : '';

  const radialGlow =
    spec.id === 'oits-web-v2' && polarity === 'dark'
      ? 'radial-gradient(ellipse 70% 50% at 85% 0%, rgba(56,189,248,0.16), transparent 60%), radial-gradient(ellipse 60% 45% at 10% 100%, rgba(37,99,235,0.14), transparent 65%)'
      : 'none';

  const brandWord =
    spec.id === 'oits-web-v2'
      ? 'Spenta Web v2'
      : spec.id === 'mmis-v2'
        ? 'MMIS Intel'
        : spec.id === 'oitsdhaka'
          ? 'SPENTA DHAKA'
          : 'SPENTA OS';

  const primaryCtaLabel =
    spec.id === 'oits-web-v2'
      ? 'Launch Stack'
      : spec.id === 'mmis-v2'
        ? 'Generate Brief'
        : spec.id === 'oitsdhaka'
          ? 'Architecture Spec'
          : 'Stack Composer (4)';

  const heroTitle =
    spec.id === 'oits-web-v2'
      ? 'Autonomous Enterprise Systems'
      : spec.id === 'mmis-v2'
        ? 'Executive Margin & Risk Cockpit'
        : spec.id === 'oitsdhaka'
          ? 'Institutional Systems & Sovereign Architecture'
          : 'Composable Sovereign AI Operating System';

  const targetTag = deploymentProfile ? deploymentProfile.switcherLabel.toUpperCase() : 'ON-PREM';
  const targetLatency = deploymentProfile ? deploymentProfile.latencyBudget : '<35ms LAN';

  const heroEyebrow =
    spec.id === 'oits-web-v2'
      ? `01. CLOUD & ENGINEERING · ${targetTag}`
      : spec.id === 'mmis-v2'
        ? `EXECUTIVE INTELLIGENCE · ${targetTag}`
        : spec.id === 'oitsdhaka'
          ? `01. ARCHITECTURAL BLUEPRINT · ${targetTag}`
          : `L1–L6 SOVEREIGN COMMAND · ${targetTag}`;

  const navShellHtml = isSidebar
    ? `
      <aside class="sidebar">
        <div class="sidebar-top">
          <div class="brand-row">
            <div class="monogram">M</div>
            <div>
              <div class="brand-title">${escapeHtml(brandWord)}</div>
              <div class="brand-sub">Executive Suite</div>
            </div>
          </div>
          <nav class="side-nav" aria-label="Theme preview navigation">
            <button class="nav-btn active" data-tab="overview">Executive Overview</button>
            <button class="nav-btn" data-tab="metrics">Margin Telemetry</button>
            <button class="nav-btn" data-tab="audit">Governance Queue</button>
          </nav>
        </div>
        <div class="side-note">
          Warm organic parchment contrast calibrated for long-session executive intelligence.
        </div>
      </aside>
    `
    : `
      <header class="topbar">
        <div class="brand-title">${escapeHtml(brandWord)}</div>
        <nav class="top-nav" aria-label="Theme preview navigation">
          <button class="nav-btn active" data-tab="overview">Overview</button>
          <button class="nav-btn" data-tab="metrics">Metrics</button>
          <button class="nav-btn" data-tab="audit">Audit</button>
        </nav>
        <button class="cta-btn" id="primaryCta">${escapeHtml(primaryCtaLabel)}</button>
      </header>
    `;

  const editorialSvgBand = isEditorial
    ? `
      <div class="editorial-band">
        <div class="band-head">
          <span class="mono-label">CODE-DRAWN ARCHITECTURE · ${escapeHtml(targetTag)}</span>
          <span class="mono-label">${escapeHtml(targetLatency)}</span>
        </div>
        <svg viewBox="0 0 420 58" class="schematic-svg" role="img" aria-label="Editorial architectural flow">
          <line x1="88" y1="29" x2="152" y2="29" stroke="${tokens.brand}" stroke-width="1.25" />
          <line x1="268" y1="29" x2="332" y2="29" stroke="${tokens.brand}" stroke-width="1.25" stroke-dasharray="3 2" />
          <rect x="6" y="11" width="82" height="36" rx="6" fill="${tokens.surface}" stroke="${tokens.border}" stroke-width="1.2" />
          <text x="47" y="27" text-anchor="middle" fill="${tokens.mutedInk}" font-size="7" font-family="monospace">01. CORE</text>
          <text x="47" y="39" text-anchor="middle" fill="${tokens.ink}" font-size="8.5" font-weight="700">${escapeHtml(targetTag)}</text>
          <rect x="152" y="11" width="116" height="36" rx="6" fill="${tokens.accentSoft}" stroke="${tokens.brand}" stroke-width="1.4" />
          <text x="210" y="27" text-anchor="middle" fill="${tokens.brand}" font-size="7" font-family="monospace">02. GOVERNANCE</text>
          <text x="210" y="39" text-anchor="middle" fill="${tokens.ink}" font-size="8.5" font-weight="700">0.88 HITL Gate</text>
          <rect x="332" y="11" width="82" height="36" rx="6" fill="${tokens.surface}" stroke="${tokens.border}" stroke-width="1.2" />
          <text x="373" y="27" text-anchor="middle" fill="${tokens.mutedInk}" font-size="7" font-family="monospace">03. LEDGER</text>
          <text x="373" y="39" text-anchor="middle" fill="${tokens.positive}" font-size="8.5" font-weight="700">Verified</text>
        </svg>
      </div>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(spec.name)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --canvas: ${tokens.canvas};
    --surface: ${tokens.surface};
    --recessed: ${tokens.recessed};
    --border: ${tokens.border};
    --ink: ${tokens.ink};
    --ink-2: ${tokens.secondaryInk};
    --muted: ${tokens.mutedInk};
    --brand: ${tokens.brand};
    --brand-text: ${tokens.brandText};
    --accent: ${tokens.accent};
    --accent-soft: ${tokens.accentSoft};
    --pos: ${tokens.positive};
    --warn: ${tokens.caution};
    --danger: ${tokens.danger};
    --shadow: ${tokens.shadow};
    --r-card: ${tokens.radiusCard};
    --r-ctrl: ${tokens.radiusControl};
    --font-display: ${spec.fontDisplay};
    --font-body: ${spec.fontBody};
    --font-mono: ${spec.fontMono};
  }
  html, body {
    width: 100%;
    min-height: 100%;
    background-color: var(--canvas);
    color: var(--ink);
    font-family: var(--font-body);
    font-size: ${baseFont};
    line-height: 1.45;
    -webkit-font-smoothing: antialiased;
    ${gridBg}
    background-image: ${radialGlow !== 'none' ? `${radialGlow}${spec.hasAmbientGrid ? `, ${polarity === 'dark' ? 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)' : 'linear-gradient(to right, rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.035) 1px, transparent 1px)'}` : ''}` : ''};
  }
  .shell {
    display: ${isSidebar ? 'grid' : 'flex'};
    ${isSidebar ? 'grid-template-columns: 148px 1fr;' : 'flex-direction: column;'}
    min-height: 100vh;
  }
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 9px 14px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    ${isGlass ? 'backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);' : ''}
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .sidebar {
    background: var(--recessed);
    border-right: 1px solid var(--border);
    padding: 12px 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 12px;
  }
  .brand-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .monogram {
    width: 26px; height: 26px;
    border-radius: var(--r-ctrl);
    background: var(--brand); color: var(--brand-text);
    display: grid; place-items: center;
    font-family: Georgia, serif; font-weight: 900; font-size: 13px;
    flex-shrink: 0;
  }
  .brand-title {
    font-family: var(--font-display);
    font-weight: 800; font-size: 11.5px; letter-spacing: -0.02em;
    white-space: nowrap;
  }
  .brand-sub { font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }
  .top-nav { display: flex; align-items: center; gap: 4px; }
  .side-nav { display: flex; flex-direction: column; gap: 3px; }
  .nav-btn {
    border: none;
    background: transparent;
    color: var(--muted);
    font-family: var(--font-body);
    font-size: 10.5px;
    font-weight: 600;
    padding: ${isSidebar ? '6px 8px' : '4px 8px'};
    border-radius: var(--r-ctrl);
    cursor: pointer;
    text-align: left;
    transition: background-color 140ms ease, color 140ms ease;
    white-space: nowrap;
  }
  .nav-btn:hover { color: var(--ink); }
  .nav-btn.active { background: var(--accent-soft); color: var(--accent); }
  .cta-btn {
    border: none;
    background: var(--brand);
    color: var(--brand-text);
    font-family: var(--font-body);
    font-size: 10px;
    font-weight: 700;
    padding: 5px 9px;
    border-radius: var(--r-ctrl);
    cursor: pointer;
    white-space: nowrap;
    transition: opacity 150ms ease, transform 150ms ease;
  }
  .cta-btn:hover { opacity: 0.9; }
  .cta-btn:active { transform: scale(0.98); }
  .side-note {
    font-size: 9.5px;
    color: var(--muted);
    border: 1px dashed var(--border);
    border-radius: var(--r-ctrl);
    padding: 7px;
    line-height: 1.35;
  }
  .main {
    padding: ${mainPad};
    display: flex;
    flex-direction: column;
    gap: ${sectionGap};
    flex: 1;
  }
  .eyebrow {
    display: flex; align-items: center; gap: 6px;
    font-family: var(--font-mono);
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--accent);
  }
  .eyebrow-rule { display: inline-block; width: 14px; height: 2px; background: var(--accent); }
  .hero-title {
    font-family: var(--font-display);
    font-size: ${isEditorial ? '16px' : '15px'};
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.18;
    margin-top: 3px;
  }
  .hero-desc {
    font-size: 10.5px;
    color: var(--ink-2);
    margin-top: 3px;
    max-width: 56ch;
  }
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    box-shadow: var(--shadow);
    ${isGlass ? 'backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);' : ''}
  }
  .kpi { padding: ${cardPad}; }
  .kpi-label { font-size: 9.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .kpi-val {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 14px;
    font-weight: 800;
    margin-top: 2px;
  }
  .editorial-band {
    background: var(--recessed);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    padding: 8px 10px;
  }
  .band-head {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 4px;
  }
  .mono-label {
    font-family: var(--font-mono);
    font-size: 8.5px;
    color: var(--muted);
    letter-spacing: 0.08em;
  }
  .schematic-svg { width: 100%; height: auto; display: block; }
  .table-wrap { overflow: hidden; }
  table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  th {
    text-align: left;
    padding: 6px 10px;
    font-weight: 600;
    font-size: 9.5px;
    color: var(--muted);
    border-bottom: 1px solid var(--border);
  }
  td {
    padding: 6px 10px;
    border-top: 1px solid var(--border);
    color: var(--ink);
  }
  tr:first-child td { border-top: none; }
  .num { text-align: right; font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
  .footer-bar {
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px; padding-top: 2px;
  }
  .panel-hidden { display: none; }
  @media (max-width: 410px) {
    .shell { display: flex; flex-direction: column; }
    .sidebar { border-right: none; border-bottom: 1px solid var(--border); }
    .side-note { display: none; }
    .kpi-grid { grid-template-columns: 1fr; }
    .topbar { flex-wrap: wrap; }
  }
</style>
</head>
<body>
  <div class="shell">
    ${navShellHtml}
    <main class="main">
      <div>
        <div class="eyebrow">
          ${spec.eyebrowBar ? '<span class="eyebrow-rule"></span>' : ''}
          <span id="eyebrowText">${escapeHtml(heroEyebrow)}</span>
        </div>
        <h1 class="hero-title" id="heroTitle">${escapeHtml(heroTitle)}</h1>
        <p class="hero-desc" id="heroDesc">${escapeHtml(spec.summary)}</p>
      </div>

      <div class="kpi-grid">
        <div class="card kpi">
          <div class="kpi-label">FY31 Run-Rate</div>
          <div class="kpi-val" style="color:var(--pos)">$5.85M</div>
        </div>
        <div class="card kpi">
          <div class="kpi-label">Blended GM</div>
          <div class="kpi-val" style="color:var(--accent)">65.1%</div>
        </div>
        <div class="card kpi">
          <div class="kpi-label">OPA HITL Gate</div>
          <div class="kpi-val" style="color:var(--warn)">0.88</div>
        </div>
      </div>

      ${editorialSvgBand}

      <div class="card table-wrap" id="panel-overview">
        <table>
          <thead>
            <tr>
              <th>Composable Module</th>
              <th class="num">GM %</th>
              <th class="num">Gate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Document AI (ICR)</td>
              <td class="num">58.0%</td>
              <td class="num" style="color:var(--pos);font-weight:700">Verified</td>
            </tr>
            <tr>
              <td>Sovereign MIS ERP</td>
              <td class="num">64.2%</td>
              <td class="num" style="color:var(--warn);font-weight:700">Review</td>
            </tr>
            <tr>
              <td>Cyber SLA Core</td>
              <td class="num">71.5%</td>
              <td class="num" style="color:var(--accent);font-weight:700">Enforced</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card table-wrap panel-hidden" id="panel-metrics">
        <table>
          <thead>
            <tr>
              <th>FY Horizon</th>
              <th class="num">Revenue</th>
              <th class="num">EBITDA</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>FY2027</td>
              <td class="num">$672K</td>
              <td class="num" style="color:var(--pos)">$214K</td>
            </tr>
            <tr>
              <td>FY2029</td>
              <td class="num">$2.41M</td>
              <td class="num" style="color:var(--pos)">$1.04M</td>
            </tr>
            <tr>
              <td>FY2031</td>
              <td class="num">$5.85M</td>
              <td class="num" style="color:var(--accent);font-weight:700">$2.78M</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card table-wrap panel-hidden" id="panel-audit">
        <table>
          <thead>
            <tr>
              <th>Policy Rule</th>
              <th class="num">Score</th>
              <th class="num">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>OPA-BANK-ICR-04</td>
              <td class="num">0.94</td>
              <td class="num" style="color:var(--pos);font-weight:700">Commit</td>
            </tr>
            <tr>
              <td>OPA-CLINICAL-RX-11</td>
              <td class="num">0.81</td>
              <td class="num" style="color:var(--warn);font-weight:700">HITL Queue</td>
            </tr>
            <tr>
              <td>TEE-SEV-SNP-VERIFY</td>
              <td class="num">0.99</td>
              <td class="num" style="color:var(--accent);font-weight:700">Attested</td>
            </tr>
          </tbody>
        </table>
      </div>

      ${
        isSidebar
          ? `<div class="footer-bar">
              <span class="mono-label">Mode: ${polarity.toUpperCase()} · ${tokens.density}</span>
              <button class="cta-btn" id="primaryCta">${escapeHtml(primaryCtaLabel)}</button>
            </div>`
          : ''
      }
    </main>
  </div>
  <script>
    (function () {
      var btns = document.querySelectorAll('.nav-btn');
      var panels = {
        overview: document.getElementById('panel-overview'),
        metrics: document.getElementById('panel-metrics'),
        audit: document.getElementById('panel-audit')
      };
      var titles = {
        overview: ${JSON.stringify(heroTitle)},
        metrics: 'FY2027–FY2031 Margin Trajectory',
        audit: 'OPA 0.88 Policy & TEE Verification'
      };
      var h1 = document.getElementById('heroTitle');
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var tab = btn.getAttribute('data-tab');
          btns.forEach(function (b) { b.classList.toggle('active', b === btn); });
          Object.keys(panels).forEach(function (k) {
            if (panels[k]) panels[k].classList.toggle('panel-hidden', k !== tab);
          });
          if (h1 && titles[tab]) h1.textContent = titles[tab];
        });
      });
      var cta = document.getElementById('primaryCta');
      if (cta) {
        var orig = cta.textContent;
        cta.addEventListener('click', function () {
          cta.textContent = 'Applied ✓';
          setTimeout(function () { cta.textContent = orig; }, 1400);
        });
      }
    })();
  </script>
</body>
</html>`;
}
