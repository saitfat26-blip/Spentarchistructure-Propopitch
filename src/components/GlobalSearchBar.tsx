import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Brain,
  Building2,
  Check,
  Cpu,
  Image,
  Layers,
  Moon,
  Plus,
  Presentation,
  Search,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import {
  AGENTIC_VERTICALS,
  BLUEPRINT_PILLARS,
  CASE_STUDIES,
  COMPLIANCE_FRAMEWORKS,
  NAV_TABS,
  NavTab,
  PITCH_DECK_SLIDES,
  SERVER_TIERS,
  SOVEREIGN_STACK_LAYERS,
  SPENTA_APPS,
  STARTER_RECIPES,
} from '../data/spentaManifest';
import { PendingNavFocus, useStack } from '../store/StackContext';

interface SearchEntry {
  id: string;
  kind:
    | 'Section'
    | 'Recipe'
    | 'App'
    | 'Infographic'
    | 'Pitch Slide'
    | 'Core Layer'
    | 'Server Tier'
    | 'Blueprint'
    | 'Case Study'
    | 'Action';
  title: string;
  subtitle: string;
  keywords: string;
  tab?: NavTab;
  focus?: Omit<PendingNavFocus, 'ts'>;
  appId?: string;
  recipeId?: string;
  onRun?: () => void;
}

const INFOGRAPHIC_INDEX: { id: string; title: string; subtitle: string; keywords: string }[] = [
  {
    id: 'ai-brain',
    title: 'Plate 01: Spenta Sovereign AI Brain',
    subtitle: 'Dual Capability Engine over L1–L6 Core across 8 domain hubs',
    keywords: 'infographic plate 01 diagram brain map hubs ecosystem architecture',
  },
  {
    id: 'l1-l6-stack',
    title: 'Plate 02: L1–L6 Sovereign Fusion Stack & 4-Tier Servers',
    subtitle: 'Hardware TEE (<50ms edge, 0.88 HITL) + Tier 1–4 server matrix',
    keywords: 'infographic plate 02 isolation security tee opa hitl server matrix',
  },
  {
    id: 'captive-ecosystem',
    title: 'Plate 03: Captive Ecosystem Synergies (BEST & X Ltd)',
    subtitle: 'BEST (65+ showrooms, 365 Exchange) & X Ltd (80 BaaS stations, 480 EVs)',
    keywords: 'infographic plate 03 best showrooms x ltd baas swap stations ev captive',
  },
  {
    id: 'financial-edge',
    title: 'Plate 04: FY2027–FY2031 Financial Trajectory & Dual-Shore Edge',
    subtitle: '$672K to $5.85M scale · 6.38× Cap. Eff. / 4.16×–6.24× SAFE ROI · $12.98/hr loaded Dhaka hub',
    keywords: 'infographic plate 04 financial trajectory dual shore dhaka safe roi',
  },
];

export function GlobalSearchBar() {
  const {
    theme,
    toggleTheme,
    commandPaletteOpen,
    setCommandPaletteOpen,
    navigateToItem,
    selectedIds,
    toggleApp,
    applyRecipe,
    setAiAssistantOpen,
  } = useStack();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const index = useMemo<SearchEntry[]>(() => {
    const items: SearchEntry[] = [];

    // 1-Click Industry Recipes
    STARTER_RECIPES.forEach((recipe) => {
      items.push({
        id: `recipe-${recipe.id}`,
        kind: 'Recipe',
        title: `Load Recipe: ${recipe.name}`,
        subtitle: `${recipe.pattern} · ${recipe.ids.length} verified modules`,
        keywords: `recipe pack starter ${recipe.name} ${recipe.pattern} ${recipe.description}`,
        recipeId: recipe.id,
      });
    });

    // 7 Portal Sections
    const sectionDescs: Record<NavTab, string> = {
      'App Vault': 'Composable 13-app catalog, Architecture Matrix & 3D Neural Core',
      Infographics: '4 high-resolution 16:9 presentation plates & full-screen lightbox',
      Financials: 'FY2027–FY2031 P&L, Quick Generate Brief, FX/Tax & 13-Product GM Table',
      'Spenta Core': 'L1–L6 Fusion Stack, 4-Tier Server Matrix & Configuration Audit Log',
      'The Brain': 'Operational Tech Radar, 0.88 HITL Gate Simulator & 3D Neural Core',
      'Pitch Deck': '18-Slide Master Investor Presentation with 16:9 PDF export',
      Resources: 'Governed Case Studies, Compliance Readiness & Proposal Builder',
    };
    NAV_TABS.forEach((tab) => {
      items.push({
        id: `sec-${tab}`,
        kind: 'Section',
        title: tab,
        subtitle: sectionDescs[tab],
        keywords: `${tab} ${sectionDescs[tab]} section tab page`,
        tab,
      });
    });

    // Quick Theme Toggle Action
    items.push({
      id: 'action-theme',
      kind: 'Action',
      title: theme === 'dark' ? 'Switch to Stone Light Mode' : 'Switch to Nocturnal Navy Mode',
      subtitle: 'Toggle Spenta Stone Light and Nocturnal Navy color tokens across all views',
      keywords: 'theme dark light mode stone nocturnal navy appearance toggle',
      onRun: () => toggleTheme(),
    });

    // 13 Composable Apps
    SPENTA_APPS.forEach((app) => {
      items.push({
        id: `app-${app.id}`,
        kind: 'App',
        title: app.name,
        subtitle: `${app.setupLabel} · ${app.gmPct.toFixed(1)}% GM · ${app.proofClient}`,
        keywords: `${app.name} ${app.shortName} ${app.tagline} ${app.category} ${app.proofClient} ${app.engine} ${app.deployment.join(' ')}`,
        tab: 'App Vault',
        focus: { type: 'app', id: app.id },
        appId: app.id,
      });
    });

    // 4 Infographics Plates
    INFOGRAPHIC_INDEX.forEach((inf) => {
      items.push({
        id: `inf-${inf.id}`,
        kind: 'Infographic',
        title: inf.title,
        subtitle: inf.subtitle,
        keywords: `${inf.title} ${inf.subtitle} ${inf.keywords}`,
        tab: 'Infographics',
        focus: { type: 'infographic', id: inf.id },
      });
    });

    // L1-L6 Sovereign Core Layers
    SOVEREIGN_STACK_LAYERS.forEach((layer) => {
      items.push({
        id: `layer-${layer.id}`,
        kind: 'Core Layer',
        title: `${layer.id}: ${layer.title}`,
        subtitle: layer.subtitle,
        keywords: `${layer.id} ${layer.title} ${layer.subtitle} ${layer.protocols.join(' ')} ${layer.slaMetric} audit`,
        tab: 'Spenta Core',
        focus: { type: 'layer', id: layer.id },
      });
    });

    // 4 Server PC Tiers
    ([1, 2, 3, 4] as const).forEach((tid) => {
      const t = SERVER_TIERS[tid];
      items.push({
        id: `tier-${t.id}`,
        kind: 'Server Tier',
        title: `${t.code} — ${t.name}`,
        subtitle: `${t.capex} · ${t.hardware}`,
        keywords: `${t.code} ${t.name} ${t.hardware} ${t.vramRam} ${t.capex} ${t.speed} server pc hardware`,
        tab: 'Spenta Core',
        focus: { type: 'tier', id: String(t.id) },
      });
    });

    // 18 Pitch Deck Slides
    PITCH_DECK_SLIDES.forEach((slide) => {
      items.push({
        id: `slide-${slide.num}`,
        kind: 'Pitch Slide',
        title: `Slide ${String(slide.num).padStart(2, '0')}: ${slide.title}`,
        subtitle: `${slide.section} · ${slide.subtitle}`,
        keywords: `slide ${slide.num} ${slide.section} ${slide.title} ${slide.subtitle} pitch deck investor pdf`,
        tab: 'Pitch Deck',
        focus: { type: 'slide', id: String(slide.num) },
      });
    });

    // Blueprint Pillars & Agentic Verticals
    BLUEPRINT_PILLARS.forEach((p) => {
      items.push({
        id: `bp-${p.id}`,
        kind: 'Blueprint',
        title: `${p.code}: ${p.title}`,
        subtitle: p.metrics.join(' · '),
        keywords: `${p.title} ${p.summary} ${p.tags.join(' ')} blueprint brain radar`,
        tab: 'The Brain',
        focus: { type: 'blueprint', id: p.title },
      });
    });

    AGENTIC_VERTICALS.forEach((v) => {
      items.push({
        id: `vert-${v.id}`,
        kind: 'Blueprint',
        title: `Agentic Vertical: ${v.name}`,
        subtitle: `Think · Learn · Solve — ${v.proof}`,
        keywords: `${v.name} ${v.think} ${v.learn} ${v.solve} ${v.proof} agentic vertical hitl`,
        tab: 'The Brain',
        focus: { type: 'blueprint', id: v.name },
      });
    });

    // Case Studies & Compliance
    CASE_STUDIES.forEach((cs) => {
      items.push({
        id: `cs-${cs.id}`,
        kind: 'Case Study',
        title: `${cs.client} — ${cs.solution}`,
        subtitle: `${cs.sector} · ${cs.headlineMetric}`,
        keywords: `${cs.client} ${cs.solution} ${cs.sector} ${cs.region} ${cs.headlineMetric} ${cs.summary} case study`,
        tab: 'Resources',
        focus: { type: 'case', id: cs.sector },
      });
    });

    COMPLIANCE_FRAMEWORKS.forEach((fw) => {
      items.push({
        id: `fw-${fw.id}`,
        kind: 'Case Study',
        title: `Compliance: ${fw.code} (${fw.name})`,
        subtitle: fw.scope,
        keywords: `${fw.code} ${fw.name} ${fw.scope} compliance security audit`,
        tab: 'Resources',
      });
    });

    // Coding-Agent Prompt Pack & 4-Theme Comparison Studio
    items.push(
      {
        id: 'studio-prompt-pack',
        kind: 'Section',
        title: 'Prompt Pack & 4-Theme Design Studio',
        subtitle: 'Download Universal Markdown P0/P1/P2 prompts, sandboxed 4-theme preview & matrix',
        keywords:
          'prompt pack markdown p0 p1 p2 coding agent cursor claude windsurf design studio theme template',
        tab: 'Resources',
        focus: { type: 'studio', id: 'prompt-theme-studio' },
      },
      {
        id: 'studio-theme-comparison',
        kind: 'Section',
        title: '4-Way Theme Comparison: Spenta Web v2, MMIS v2, Spenta Dhaka & Spenta OS',
        subtitle: 'Isolated light/dark preview sandbox, verified hex tokens & Markdown comparison table',
        keywords:
          'spenta-web-v2 mmis-intel-dashboards-v2 spenta-dhaka comparison table theme tokens swatches design pov',
        tab: 'Resources',
        focus: { type: 'studio', id: 'theme-comparison' },
      },
    );

    return items;
  }, [theme, toggleTheme]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [
        ...index.filter((i) => i.kind === 'Recipe'),
        ...index.filter((i) => i.kind === 'Section').slice(0, 5),
        ...index.filter((i) => i.kind === 'App').slice(0, 3),
        ...index.filter((i) => i.kind === 'Action'),
      ];
    }
    const tokens = q.split(/\s+/).filter(Boolean);
    return index
      .map((item) => {
        const hay = `${item.title} ${item.subtitle} ${item.keywords}`.toLowerCase();
        if (!tokens.every((t) => hay.includes(t))) return null;
        const titleLower = item.title.toLowerCase();
        let score = 0;
        if (titleLower.startsWith(q)) score += 30;
        else if (titleLower.includes(q)) score += 18;
        if (item.kind === 'App') score += 9;
        if (item.kind === 'Recipe') score += 8;
        if (item.kind === 'Infographic' || item.kind === 'Section') score += 6;
        return { item, score };
      })
      .filter((x): x is { item: SearchEntry; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((x) => x.item);
  }, [query, index]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, commandPaletteOpen]);

  // Quick '/' open and Escape close shortcuts (Cmd/Ctrl+K is handled globally in App.tsx)
  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !commandPaletteOpen && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.isContentEditable ||
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
        ) {
          return;
        }
        e.preventDefault();
        setCommandPaletteOpen(true);
      } else if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 20);
    } else {
      setQuery('');
    }
  }, [commandPaletteOpen]);

  const handleSelect = (entry: SearchEntry) => {
    if (entry.recipeId) {
      applyRecipe(entry.recipeId);
    } else if (entry.onRun) {
      entry.onRun();
    } else if (entry.tab) {
      navigateToItem(entry.tab, entry.focus);
    }
    setCommandPaletteOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
    }
  };

  const renderKindIcon = (kind: SearchEntry['kind']) => {
    const props = { className: 'w-4 h-4 shrink-0', strokeWidth: 1.5 };
    switch (kind) {
      case 'App':
        return <Layers {...props} className="w-4 h-4 shrink-0 text-emerald-500" />;
      case 'Recipe':
        return <Sparkles {...props} className="w-4 h-4 shrink-0 text-emerald-400" />;
      case 'Infographic':
        return <Image {...props} className="w-4 h-4 shrink-0 text-zinc-400" />;
      case 'Pitch Slide':
        return <Presentation {...props} className="w-4 h-4 shrink-0 text-amber-500" />;
      case 'Core Layer':
      case 'Server Tier':
        return <Cpu {...props} className="w-4 h-4 shrink-0 text-zinc-400" />;
      case 'Blueprint':
        return <Brain {...props} className="w-4 h-4 shrink-0 text-emerald-500" />;
      case 'Case Study':
        return <Building2 {...props} className="w-4 h-4 shrink-0 text-zinc-400" />;
      case 'Action':
        return theme === 'dark' ? (
          <Sun {...props} className="w-4 h-4 shrink-0 text-zinc-400" />
        ) : (
          <Moon {...props} className="w-4 h-4 shrink-0 text-zinc-500" />
        );
      default:
        return <ArrowRight {...props} className="w-4 h-4 shrink-0 text-zinc-400" />;
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B1020]/70 backdrop-blur-xs flex items-start justify-center pt-[8vh] sm:pt-[10vh] px-3 sm:px-6 no-print"
      onClick={() => setCommandPaletteOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Spenta Command Palette"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[92vw] sm:w-[76vw] md:w-[68vw] lg:w-[58vw] xl:w-[54vw] min-w-[50vw] bg-[#FAF8F4] dark:bg-[#141A32] text-[#16213A] dark:text-[#E7EBF5] rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] shadow-2xl overflow-hidden"
      >
        {/* Search Input Row */}
        <div className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 bg-white dark:bg-[#0F1529] border-b border-[#E4DFD6] dark:border-[#232B4A]">
          <Search className="w-4 h-4 text-[#5F6576] dark:text-[#8E96B0] shrink-0" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Jump to tabs, search 13 modules, apply stack recipes, inspect L1–L6..."
            aria-label="Command Palette Search"
            className="w-full flex-1 min-w-0 bg-transparent text-sm text-[#16213A] dark:text-[#E7EBF5] placeholder:text-[#7B8294] dark:placeholder:text-[#8E96B0] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-[#5F6576] hover:text-[#16213A] dark:hover:text-white cursor-pointer"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          )}
          <kbd className="hidden sm:inline-block font-mono text-[10px] text-[#5F6576] dark:text-[#8E96B0] bg-[#F2EFE9] dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A] px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        {results.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs text-[#5F6576] dark:text-[#8E96B0]">
              No direct portal matches for{' '}
              <strong className="text-[#16213A] dark:text-[#E7EBF5]">&ldquo;{query}&rdquo;</strong>.
            </p>
            <button
              type="button"
              onClick={() => {
                setCommandPaletteOpen(false);
                setAiAssistantOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#1C6E46] hover:bg-[#165838] dark:bg-[#6FCB9F] dark:text-[#0B1020] text-white text-xs font-semibold cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Ask Spenta AI Advisor</span>
            </button>
          </div>
        ) : (
          <div
            role="listbox"
            className="max-h-[58vh] overflow-y-auto divide-y divide-[#E4DFD6] dark:divide-[#232B4A]"
          >
            {results.map((entry, idx) => {
              const isActive = idx === activeIndex;
              const inStack = entry.appId ? selectedIds.includes(entry.appId) : false;

              return (
                <div
                  key={entry.id}
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => handleSelect(entry)}
                  className={`px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#F2EFE9] dark:bg-[#1C2545]'
                      : 'bg-transparent hover:bg-[#F2EFE9]/70 dark:hover:bg-[#1C2545]/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {renderKindIcon(entry.kind)}
                    <div className="min-w-0">
                      <div className="text-xs sm:text-[13px] font-medium text-[#16213A] dark:text-[#E7EBF5] truncate">
                        {entry.title}
                      </div>
                      <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0] truncate mt-0.5 font-mono">
                        {entry.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {entry.appId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleApp(entry.appId!);
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded font-mono text-[10px] font-semibold border transition-colors cursor-pointer ${
                          inStack
                            ? 'bg-[#1C6E46]/12 dark:bg-[#6FCB9F]/15 text-[#1C6E46] dark:text-[#6FCB9F] border-[#1C6E46]/40 dark:border-[#6FCB9F]/40'
                            : 'bg-white dark:bg-[#0F1529] text-[#4A5163] dark:text-[#C8D0E4] border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1F3863] dark:hover:border-[#8FA6E8]'
                        }`}
                      >
                        {inStack ? (
                          <Check className="w-3 h-3" strokeWidth={1.5} />
                        ) : (
                          <Plus className="w-3 h-3" strokeWidth={1.5} />
                        )}
                        <span>{inStack ? 'In Stack' : 'Add'}</span>
                      </button>
                    )}
                    <span className="font-mono text-[10px] text-[#7B8294] dark:text-[#8E96B0] uppercase tracking-wider">
                      {entry.kind}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Palette Footer */}
        <div className="px-4 py-2 bg-[#F2EFE9] dark:bg-[#0B1020] border-t border-[#E4DFD6] dark:border-[#232B4A] flex items-center justify-between text-[10px] font-mono text-[#5F6576] dark:text-[#8E96B0]">
          <span>
            {query.trim() ? `${results.length} matches` : 'Quick Navigation · Recipes · 13 Modules'}
          </span>
          <span className="hidden sm:inline">Alt+1–7 Tabs · ↑↓ Navigate · ↵ Open · ⌘K Toggle</span>
        </div>
      </div>
    </div>
  );
}
