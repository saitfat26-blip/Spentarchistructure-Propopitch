import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Columns2,
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  GitBranch,
  LayoutGrid,
  Link2,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Search,
  Server,
  Shield,
  SlidersHorizontal,
  Smartphone,
  Sun,
  Tablet,
  X,
} from 'lucide-react';
import {
  AGENT_PROMPT_SECTIONS,
  GLOBAL_AGENT_PREAMBLE,
  OITS_DHAKA_DEEP_ANALYSIS_PILLARS,
  OITS_DHAKA_ROADMAP_MASTER_PROMPT,
  PromptPriority,
  THEME_REFERENCE_SPECS,
  ThemeRefId,
  buildFullPromptPackMd,
  buildOitsDhakaMasterRemixMd,
  buildPriorityPhaseMd,
  buildSequencePromptsMd,
  buildSinglePromptSectionMd,
  buildThemeTemplatesPackMd,
  downloadMarkdownFile,
} from '../data/promptThemeStudioData';
import {
  ThemeOverridePatch,
  buildCustomThemeTokenCss,
  buildVirtualThemeIframeSrcDoc,
} from '../utils/virtualThemeIframeHtml';
import {
  DEPLOYMENT_PROFILES,
  DEPLOYMENT_TARGET_ORDER,
} from '../data/deploymentProfiles';
import { SERVER_TIERS } from '../data/spentaManifest';
import { useTheme } from '../context/ThemeContext';
import { useStack } from '../store/StackContext';
import { copyTextWithFallback } from '../utils/shareUrlCodec';
import { DesignComparisonTable } from './DesignComparisonTable';
import { InteractiveArchitecturePathway } from './InteractiveArchitecturePathway';
import { ReferoPatternExplorer } from './ReferoPatternExplorer';

const PRIORITY_FILTERS: { id: 'All' | PromptPriority; label: string }[] = [
  { id: 'All', label: 'All (11)' },
  { id: 'P0', label: 'P0 Foundation (3)' },
  { id: 'P1', label: 'P1 Core Views (4)' },
  { id: 'P2', label: 'P2 Exports & 3D (4)' },
];

const INITIAL_IFRAME_POLARITIES: Record<ThemeRefId, 'light' | 'dark'> = {
  'oits-web-v2': 'dark',
  'mmis-v2': 'light',
  oitsdhaka: 'light',
  'spenta-os': 'dark',
};

const BRAND_SWATCH_PRESETS = [
  { label: 'Heritage Navy', hex: '#1F3863' },
  { label: 'Sovereign Emerald', hex: '#10B981' },
  { label: 'Spenta Green', hex: '#1C6E46' },
  { label: 'Enterprise Cobalt', hex: '#2563EB' },
  { label: 'Sovereign Crimson', hex: '#E11D48' },
  { label: 'Governance Amber', hex: '#B45309' },
];

type ViewportSize = 'desktop' | 'tablet' | 'mobile';
type WorkbenchMode = 'preview' | 'split' | 'code';

export function PromptThemeStudio() {
  const { paletteMode, setPaletteMode, theme } = useTheme();
  const {
    deploymentTarget,
    deploymentProfile,
    projectArchitectureMetadata,
    setDeploymentTarget,
    coreLayerConfigs,
    stackMetrics,
    selectedApps,
    exportStackJson,
    setActiveTab,
    buildShareUrl,
  } = useStack();

  // P0/P1/P2 prompt deck state
  const [priorityFilter, setPriorityFilter] = useState<'All' | PromptPriority>('All');
  const [promptQuery, setPromptQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<string[]>(['p0-1-shell']);

  // Live Preview Toggle: 2x2 Virtual Iframes Grid vs Single Focus v0 Workbench
  const [previewLayout, setPreviewLayout] = useState<'iframes' | 'single'>('iframes');
  const [activeThemeId, setActiveThemeId] = useState<ThemeRefId>('oitsdhaka');
  const [previewPolarity, setPreviewPolarity] = useState<'dark' | 'light'>(theme);
  const [iframePolarities, setIframePolarities] = useState<Record<ThemeRefId, 'light' | 'dark'>>(
    INITIAL_IFRAME_POLARITIES,
  );

  const handleToggleGlobalPalette = (next: 'stone' | 'nocturnal') => {
    setPaletteMode(next);
    const nextPolarity: 'light' | 'dark' = next === 'stone' ? 'light' : 'dark';
    setPreviewPolarity(nextPolarity);
    setIframePolarities({
      'oits-web-v2': nextPolarity,
      'mmis-v2': nextPolarity,
      oitsdhaka: nextPolarity,
      'spenta-os': nextPolarity,
    });
  };

  // v0 Workbench Controls (Viewport Switcher, Preview/Split/Code, Visual Design Mode Token Tweaker)
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop');
  const [workbenchMode, setWorkbenchMode] = useState<WorkbenchMode>('preview');
  const [designModeOpen, setDesignModeOpen] = useState<boolean>(true);
  const [themeOverrides, setThemeOverrides] = useState<
    Partial<Record<ThemeRefId, ThemeOverridePatch>>
  >({});

  // Master Prompt accordion state
  const [masterPromptExpanded, setMasterPromptExpanded] = useState(true);
  const [showArchMetadata, setShowArchMetadata] = useState(true);

  // Clipboard & download visual confirmations
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadedKey, setDownloadedKey] = useState<string | null>(null);

  const activeTheme = useMemo(
    () => THEME_REFERENCE_SPECS.find((t) => t.id === activeThemeId) ?? THEME_REFERENCE_SPECS[0],
    [activeThemeId],
  );

  const activeOverrides = themeOverrides[activeThemeId];
  const hasActiveOverrides = Boolean(
    activeOverrides &&
      (activeOverrides.brandHex ||
        activeOverrides.accentHex ||
        activeOverrides.radiusCardPx !== undefined ||
        activeOverrides.density),
  );

  const defaultCardRadiusPx = useMemo(() => {
    const parsed = parseInt(activeTheme.radiusCard, 10);
    return Number.isFinite(parsed) ? parsed : 10;
  }, [activeTheme.radiusCard]);

  const effectiveRadiusPx = activeOverrides?.radiusCardPx ?? defaultCardRadiusPx;
  const effectiveDensity = activeOverrides?.density ?? 'balanced';
  const effectiveBrandHex =
    activeOverrides?.brandHex ??
    (previewPolarity === 'dark' ? activeTheme.dark.brand : activeTheme.light.brand);

  const updateActiveOverride = (patch: Partial<ThemeOverridePatch>) => {
    setThemeOverrides((prev) => ({
      ...prev,
      [activeThemeId]: {
        ...(prev[activeThemeId] ?? {}),
        ...patch,
      },
    }));
  };

  const resetActiveOverrides = () => {
    setThemeOverrides((prev) => {
      const next = { ...prev };
      delete next[activeThemeId];
      return next;
    });
  };

  const singleIframeSrcDoc = useMemo(
    () =>
      buildVirtualThemeIframeSrcDoc(
        activeTheme,
        previewPolarity,
        activeOverrides,
        deploymentProfile,
      ),
    [activeTheme, previewPolarity, activeOverrides, deploymentProfile],
  );

  const liveTokenCssCode = useMemo(
    () =>
      buildCustomThemeTokenCss(
        activeTheme,
        previewPolarity,
        activeOverrides,
        deploymentProfile,
      ),
    [activeTheme, previewPolarity, activeOverrides, deploymentProfile],
  );

  const gridIframeDocs = useMemo(
    () =>
      THEME_REFERENCE_SPECS.map((spec) => ({
        spec,
        polarity: iframePolarities[spec.id],
        srcDoc: buildVirtualThemeIframeSrcDoc(
          spec,
          iframePolarities[spec.id],
          themeOverrides[spec.id],
          deploymentProfile,
        ),
      })),
    [iframePolarities, themeOverrides, deploymentProfile],
  );

  const coreMetadataSummary = {
    airGappedCount: projectArchitectureMetadata.governanceSummary.airGappedLayers,
    vpcCount: projectArchitectureMetadata.governanceSummary.vpcLayers,
    teeCount: projectArchitectureMetadata.governanceSummary.teeEnabledLayers,
    strictOpaCount: projectArchitectureMetadata.governanceSummary.strictOpaLayers,
  };

  const activeServerTier = SERVER_TIERS[stackMetrics.tier];

  const liveArchitectureMetadataJson = useMemo(
    () => JSON.stringify(projectArchitectureMetadata, null, 2),
    [projectArchitectureMetadata],
  );

  const filteredPrompts = useMemo(() => {
    const q = promptQuery.trim().toLowerCase();
    return AGENT_PROMPT_SECTIONS.filter((item) => {
      if (priorityFilter !== 'All' && item.priority !== priorityFilter) return false;
      if (!q) return true;
      return (
        item.code.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.targetArea.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.promptMarkdown.toLowerCase().includes(q)
      );
    });
  }, [priorityFilter, promptQuery]);

  const handleCopy = async (key: string, text: string) => {
    const ok = await copyTextWithFallback(text);
    if (ok) {
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    }
  };

  const withActiveDeploymentBanner = (markdown: string): string => {
    const header = [
      '<!-- Active Studio Infrastructure Target Metadata -->',
      `> **Infrastructure Target**: ${deploymentProfile.switcherLabel} — ${deploymentProfile.title}`,
      `> **Transport**: ${deploymentProfile.transport} | **Latency Budget**: ${deploymentProfile.latencyBudget}`,
      `> **Enclave Boundary**: ${deploymentProfile.enclaveBoundary}`,
      `> **Egress & Compliance**: ${deploymentProfile.egressPolicy} | ${deploymentProfile.compliancePosture}`,
      `> **Active L1–L6 Core Posture**: ${coreMetadataSummary.teeCount}/6 Hardware TEE · ${coreMetadataSummary.strictOpaCount}/6 Strict OPA · ${activeServerTier.code} (${selectedApps.length} Apps)`,
      '',
      '---',
      '',
    ].join('\n');
    return `${header}${markdown}`;
  };

  const handleDownloadMd = (key: string, filename: string, content: string) => {
    downloadMarkdownFile(filename, withActiveDeploymentBanner(content));
    setDownloadedKey(key);
    window.setTimeout(() => {
      setDownloadedKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const handleDownloadArchitectureMetaJson = () => {
    const blob = new Blob([liveArchitectureMetadataJson], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spenta-architecture-meta-${deploymentProfile.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloadedKey('studio-arch-meta-json');
    window.setTimeout(() => {
      setDownloadedKey((prev) => (prev === 'studio-arch-meta-json' ? null : prev));
    }, 1800);
  };

  const handleSelectTheme = (
    id: ThemeRefId,
    switchToSingle = false,
    openDesignWorkbench = false,
  ) => {
    setActiveThemeId(id);
    const spec = THEME_REFERENCE_SPECS.find((t) => t.id === id);
    if (spec) {
      setPreviewPolarity(iframePolarities[id] ?? spec.defaultPolarity);
    }
    if (switchToSingle) {
      setPreviewLayout('single');
    }
    if (openDesignWorkbench) {
      setPreviewLayout('single');
      setWorkbenchMode('split');
      setDesignModeOpen(true);
    }
  };

  const syncAllIframePolarities = (mode: 'light' | 'dark' | 'native') => {
    if (mode === 'native') {
      setIframePolarities({ ...INITIAL_IFRAME_POLARITIES });
      return;
    }
    setIframePolarities({
      'oits-web-v2': mode,
      'mmis-v2': mode,
      oitsdhaka: mode,
      'spenta-os': mode,
    });
  };

  const toggleSingleIframePolarity = (id: ThemeRefId) => {
    setIframePolarities((prev) => ({
      ...prev,
      [id]: prev[id] === 'dark' ? 'light' : 'dark',
    }));
  };

  const toggleExpandPrompt = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const allVisibleExpanded =
    filteredPrompts.length > 0 && filteredPrompts.every((p) => expandedIds.includes(p.id));

  const toggleExpandAll = () => {
    if (allVisibleExpanded) {
      setExpandedIds([]);
    } else {
      setExpandedIds(filteredPrompts.map((p) => p.id));
    }
  };

  const viewportWidthClass =
    viewportSize === 'mobile'
      ? 'max-w-[375px] mx-auto'
      : viewportSize === 'tablet'
        ? 'max-w-[768px] mx-auto'
        : 'w-full';

  return (
    <div className="space-y-10">
      {/* Downloadable Universal Markdown Prompt Pack Bar */}
      <section className="rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-5 sm:p-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#5F6576] dark:text-[#8E96B0]">
              <span className="font-mono text-[#1C6E46] dark:text-[#6FCB9F] font-semibold">
                Universal Markdown Kit
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">11 P0–P2 Prompts</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">v0 Responsive Design Workbench</span>
              <span aria-hidden="true">·</span>
              <span>Refero State Taxonomy &amp; Spenta Dhaka Master Remix</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#16213A] dark:text-[#E7EBF5] tracking-tight text-balance">
              Coding-Agent Prompt Pack, v0 Theme Workbench &amp; Spenta Dhaka Remix Studio
            </h2>
            <p className="text-xs sm:text-sm text-[#4A5568] dark:text-[#A4ADC6] max-w-3xl leading-relaxed">
              Download any individual P0/P1/P2 section or phase bundle as Markdown, test all four themes live across Desktop/Tablet/Mobile frames with live CSS token tweaking, and audit UI pattern completeness.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Persistent Global Stone / Nocturnal Theme Toggler (Synced via ThemeProvider + localStorage) */}
            <div
              role="group"
              aria-label="Global Stone and Nocturnal theme switcher"
              title="Persists Stone (Light) / Nocturnal (Dark) across all views via localStorage"
              className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#F2EFE9] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A]"
            >
              <button
                type="button"
                onClick={() => handleToggleGlobalPalette('stone')}
                aria-pressed={paletteMode === 'stone'}
                className={`inline-flex items-center gap-1.5 min-h-[34px] px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  paletteMode === 'stone'
                    ? 'bg-[#1F3863] text-white shadow-xs'
                    : 'text-[#4A5568] dark:text-[#A4ADC6] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" strokeWidth={1.7} />
                <span>Stone</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleGlobalPalette('nocturnal')}
                aria-pressed={paletteMode === 'nocturnal'}
                className={`inline-flex items-center gap-1.5 min-h-[34px] px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  paletteMode === 'nocturnal'
                    ? 'bg-[#8FA6E8] text-[#0B1020] shadow-xs'
                    : 'text-[#4A5568] dark:text-[#A4ADC6] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                }`}
              >
                <Moon className="w-3.5 h-3.5" strokeWidth={1.7} />
                <span>Nocturnal</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                handleDownloadMd(
                  'bundle-p0p1p2',
                  'spenta-sovereign-os-p0-p1-p2-prompts.md',
                  buildSequencePromptsMd(),
                )
              }
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 text-[#16213A] dark:text-[#E7EBF5] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {downloadedKey === 'bundle-p0p1p2' ? (
                <Check className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" />
              ) : (
                <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
              )}
              <span>P0–P2 Prompts (.md)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleDownloadMd(
                  'bundle-master-remix',
                  'spenta-dhaka-roadmap-master-remix-prompt.md',
                  buildOitsDhakaMasterRemixMd(),
                )
              }
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 text-[#16213A] dark:text-[#E7EBF5] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {downloadedKey === 'bundle-master-remix' ? (
                <Check className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" />
              ) : (
                <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
              )}
              <span>Spenta Dhaka Master (.md)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleDownloadMd(
                  'bundle-themes',
                  'spenta-4-theme-templates-and-comparison.md',
                  buildThemeTemplatesPackMd(),
                )
              }
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 text-[#16213A] dark:text-[#E7EBF5] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {downloadedKey === 'bundle-themes' ? (
                <Check className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" />
              ) : (
                <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
              )}
              <span>4-Theme Kit (.md)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleDownloadMd(
                  'bundle-full',
                  'spenta-sovereign-os-complete-agent-kit.md',
                  buildFullPromptPackMd(),
                )
              }
              className="inline-flex items-center gap-1.5 min-h-[38px] px-4 py-2 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {downloadedKey === 'bundle-full' ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
              )}
              <span>{downloadedKey === 'bundle-full' ? 'Downloaded Pack' : 'Download Full Pack (.md)'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Deployment Configuration Switcher & Live Project Architecture Metadata */}
      <section
        aria-label="Deployment configuration switcher and project architecture metadata"
        className="rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] overflow-hidden"
      >
        <div className="p-4 sm:p-5 border-b border-[#E4DFD6] dark:border-[#232B4A] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#5F6576] dark:text-[#8E96B0]">
              <span className="inline-flex items-center gap-1.5 font-mono text-[#1C6E46] dark:text-[#6FCB9F] font-semibold">
                <Server className="w-3.5 h-3.5" strokeWidth={1.65} />
                <span>Deployment Configuration</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>Updates L1–L6 Core isolation, Pathway topology, virtual previews &amp; JSON manifests</span>
            </div>
            <h3 className="text-base font-bold text-[#16213A] dark:text-[#E7EBF5] tracking-tight">
              {deploymentProfile.title}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div
              role="group"
              aria-label="Infrastructure target environment"
              className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#F2EFE9] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A]"
            >
              {DEPLOYMENT_TARGET_ORDER.map((targetId) => {
                const prof = DEPLOYMENT_PROFILES[targetId];
                const active = deploymentTarget === targetId;
                return (
                  <button
                    key={targetId}
                    type="button"
                    onClick={() => setDeploymentTarget(targetId, 'Studio Workspace')}
                    aria-pressed={active}
                    className={`min-h-[34px] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                        : 'text-[#4A5568] dark:text-[#A4ADC6] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                    }`}
                  >
                    {prof.switcherLabel}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handleCopy('studio-share-url', buildShareUrl({ tab: 'Resources' }))}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Copy shareable URL encoding your current stack, deployment target, and theme"
            >
              {copiedKey === 'studio-share-url' ? (
                <Check className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" />
              ) : (
                <Link2 className="w-3.5 h-3.5" strokeWidth={1.6} />
              )}
              <span>{copiedKey === 'studio-share-url' ? 'Share Link Copied' : 'Copy Share Link'}</span>
            </button>

            <button
              type="button"
              onClick={() => exportStackJson({ exportedFrom: 'Studio Deployment Switcher' })}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.6} />
              <span>Export Manifest (.json)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('Spenta Core')}
              className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#1C6E46] dark:text-[#6FCB9F] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Inspect L1–L6 Core</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Live Updated Project Architecture Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E4DFD6] dark:divide-[#232B4A]">
          <div className="p-4 space-y-1">
            <div className="text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0]">
              Transport &amp; Latency Budget
            </div>
            <div className="text-xs font-bold text-[#16213A] dark:text-[#E7EBF5] tabular-nums">
              {deploymentProfile.latencyBudget}
            </div>
            <div className="text-[11px] text-[#4A5568] dark:text-[#A4ADC6] leading-snug">
              {deploymentProfile.transport}
            </div>
          </div>

          <div className="p-4 space-y-1">
            <div className="text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0]">
              Enclave &amp; Egress Boundary
            </div>
            <div className="text-xs font-bold text-[#16213A] dark:text-[#E7EBF5]">
              {deploymentProfile.egressPolicy}
            </div>
            <div className="text-[11px] text-[#4A5568] dark:text-[#A4ADC6] leading-snug">
              {deploymentProfile.enclaveBoundary}
            </div>
          </div>

          <div className="p-4 space-y-1">
            <div className="text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0]">
              Active L1–L6 Core Metadata
            </div>
            <div className="text-xs font-bold text-[#1C6E46] dark:text-[#6FCB9F] font-mono tabular-nums">
              {coreMetadataSummary.teeCount}/6 TEE · {coreMetadataSummary.strictOpaCount}/6 Strict OPA
            </div>
            <div className="text-[11px] text-[#4A5568] dark:text-[#A4ADC6] font-mono tabular-nums">
              {coreMetadataSummary.airGappedCount} Air-Gapped · {coreMetadataSummary.vpcCount} VPC ·{' '}
              {activeServerTier.code} ({selectedApps.length} Apps)
            </div>
          </div>

          <div className="p-4 space-y-1">
            <div className="text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0] flex items-center gap-1">
              <Shield className="w-3 h-3 text-[#1C6E46] dark:text-[#6FCB9F]" strokeWidth={1.6} />
              <span>Compliance &amp; Cost Posture</span>
            </div>
            <div className="text-xs font-bold text-[#16213A] dark:text-[#E7EBF5]">
              {deploymentProfile.compliancePosture}
            </div>
            <div className="text-[11px] text-[#4A5568] dark:text-[#A4ADC6] leading-snug">
              {deploymentProfile.costPosture}
            </div>
          </div>
        </div>

        {/* Interactive Live Architectural Metadata Inspector & L1-L6 Isolation Matrix */}
        <div className="border-t border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529]">
          <div className="px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#4A5568] dark:text-[#A4ADC6]">
              <span className="font-semibold text-[#16213A] dark:text-[#E7EBF5]">
                architecture.meta.json
              </span>
              <span aria-hidden="true">·</span>
              <span>Live L1–L6 isolation, Hardware TEE &amp; OPA metadata synced across project</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadArchitectureMetaJson}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] text-[11px] font-semibold text-[#16213A] dark:text-[#E7EBF5] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 cursor-pointer whitespace-nowrap shrink-0"
              >
                {downloadedKey === 'studio-arch-meta-json' ? (
                  <Check className="w-3 h-3 text-[#1C6E46] dark:text-[#6FCB9F]" />
                ) : (
                  <Download className="w-3 h-3" strokeWidth={1.6} />
                )}
                <span>
                  {downloadedKey === 'studio-arch-meta-json'
                    ? 'Saved Metadata JSON'
                    : 'Download Metadata JSON'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleCopy('studio-arch-meta', liveArchitectureMetadataJson)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] text-[11px] font-semibold text-[#16213A] dark:text-[#E7EBF5] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedKey === 'studio-arch-meta' ? (
                  <Check className="w-3 h-3 text-[#1C6E46] dark:text-[#6FCB9F]" />
                ) : (
                  <Copy className="w-3 h-3" strokeWidth={1.6} />
                )}
                <span>{copiedKey === 'studio-arch-meta' ? 'Copied Metadata' : 'Copy Metadata JSON'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowArchMetadata((v) => !v)}
                aria-expanded={showArchMetadata}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] text-[11px] font-semibold text-[#4A5568] dark:text-[#A4ADC6] cursor-pointer whitespace-nowrap shrink-0"
              >
                {showArchMetadata ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    <span>Hide Details</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span>Inspect Live Metadata</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {showArchMetadata && (
            <div className="px-4 sm:px-5 pb-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* Left 7 cols: Live L6-L1 Layer Isolation & TEE Table */}
              <div className="lg:col-span-7 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-[#E4DFD6] dark:border-[#232B4A] text-[10px] font-mono text-[#5F6576] dark:text-[#8E96B0]">
                      <th className="py-2 px-3 font-semibold">Layer</th>
                      <th className="py-2 px-3 font-semibold">Isolation Boundary</th>
                      <th className="py-2 px-3 font-semibold">Hardware TEE</th>
                      <th className="py-2 px-3 font-semibold">OPA Policy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4DFD6]/80 dark:divide-[#232B4A] font-mono tabular-nums">
                    {(['L6', 'L5', 'L4', 'L3', 'L2', 'L1'] as const).map((layerKey) => {
                      const cfg = coreLayerConfigs[layerKey];
                      return (
                        <tr key={layerKey} className="hover:bg-[#FAF8F4] dark:hover:bg-[#0F1529]/60">
                          <td className="py-2 px-3 font-bold text-[#16213A] dark:text-[#E7EBF5]">
                            {layerKey}
                          </td>
                          <td className="py-2 px-3 text-[#4A5568] dark:text-[#A4ADC6]">
                            {cfg.isolationMode}
                          </td>
                          <td
                            className={`py-2 px-3 font-semibold ${
                              cfg.teeEnabled
                                ? 'text-[#1C6E46] dark:text-[#6FCB9F]'
                                : 'text-[#5F6576] dark:text-[#8E96B0]'
                            }`}
                          >
                            {cfg.teeEnabled ? 'Enforced' : 'Standard'}
                          </td>
                          <td className="py-2 px-3 text-[#4A5568] dark:text-[#A4ADC6] truncate max-w-[180px]">
                            {cfg.policyMode}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Right 5 cols: Live Project Architectural Metadata JSON */}
              <div className="lg:col-span-5 rounded-lg border border-[#232B4A] bg-[#0B1020] overflow-hidden flex flex-col">
                <div className="px-3 py-1.5 border-b border-[#232B4A] flex items-center justify-between text-[10px] font-mono text-[#8E96B0]">
                  <span>target: {deploymentProfile.id}</span>
                  <span className="text-[#6FCB9F]">{deploymentProfile.switcherLabel} Active</span>
                </div>
                <pre className="p-3 text-[10.5px] leading-relaxed font-mono text-[#A7E6C7] overflow-auto max-h-[215px] whitespace-pre">
                  {liveArchitectureMetadataJson}
                </pre>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 01: P0 -> P1 -> P2 Coding-Agent Prompt Sequence */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div>
            <div className="text-xs text-[#5F6576] dark:text-[#8E96B0]">
              <span>01. Build Sequence</span>
              <span className="mx-1.5" aria-hidden="true">
                ·
              </span>
              <span>Ordered by dependency graph · Per-phase &amp; per-section .md export</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#16213A] dark:text-[#E7EBF5] tracking-tight mt-0.5 flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-[#1C6E46] dark:text-[#6FCB9F] shrink-0" strokeWidth={1.5} />
              <span>Section Design &amp; Develop Prompts (P0 → P1 → P2)</span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['P0', 'P1', 'P2'] as const).map((phase) => {
              const dlKey = `phase-${phase}`;
              const isDone = downloadedKey === dlKey;
              return (
                <button
                  key={phase}
                  type="button"
                  onClick={() =>
                    handleDownloadMd(
                      dlKey,
                      `spenta-sovereign-os-${phase.toLowerCase()}-prompts.md`,
                      buildPriorityPhaseMd(phase),
                    )
                  }
                  className="inline-flex items-center gap-1.5 min-h-[34px] px-2.5 py-1.5 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isDone ? (
                    <Check className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" />
                  ) : (
                    <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                  )}
                  <span>{isDone ? `Saved ${phase}` : `Download ${phase} (.md)`}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => handleCopy('global-preamble', GLOBAL_AGENT_PREAMBLE)}
              className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1.5 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 text-xs font-medium text-[#16213A] dark:text-[#E7EBF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedKey === 'global-preamble' ? (
                <Check className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" />
              ) : (
                <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
              )}
              <span>{copiedKey === 'global-preamble' ? 'Copied Preamble' : 'Copy Global Context'}</span>
            </button>

            <button
              type="button"
              onClick={toggleExpandAll}
              className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1.5 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 text-xs font-medium text-[#16213A] dark:text-[#E7EBF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{allVisibleExpanded ? 'Collapse All' : 'Expand All'}</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#F2EFE9] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A]">
            {PRIORITY_FILTERS.map((f) => {
              const active = priorityFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPriorityFilter(f.id)}
                  className={`min-h-[34px] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                      : 'text-[#4A5568] dark:text-[#A4ADC6] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72">
            <Search
              className="w-3.5 h-3.5 text-[#5F6576] dark:text-[#8E96B0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              strokeWidth={1.5}
            />
            <input
              type="text"
              value={promptQuery}
              onChange={(e) => setPromptQuery(e.target.value)}
              placeholder="Filter prompts (e.g. PDF, HITL, Audit)..."
              aria-label="Filter coding agent prompts"
              className="w-full min-h-[38px] pl-8 pr-8 py-2 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] text-xs text-[#16213A] dark:text-[#E7EBF5] placeholder:text-[#5F6576] dark:placeholder:text-[#8E96B0] focus:outline-none focus:border-[#1F3863] dark:focus:border-[#8FA6E8]"
            />
            {promptQuery && (
              <button
                type="button"
                onClick={() => setPromptQuery('')}
                aria-label="Clear prompt search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5F6576] hover:text-[#16213A] dark:text-[#8E96B0] dark:hover:text-[#E7EBF5] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Prompt Accordion List */}
        {filteredPrompts.length === 0 ? (
          <div className="rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-[#16213A] dark:text-[#E7EBF5]">
              No coding-agent prompts match "{promptQuery}"
            </p>
            <p className="text-xs text-[#5F6576] dark:text-[#8E96B0]">
              Reset the priority filter or search term to inspect all 11 P0–P2 build prompts.
            </p>
            <button
              type="button"
              onClick={() => {
                setPriorityFilter('All');
                setPromptQuery('');
              }}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 rounded-lg bg-[#1F3863] dark:bg-[#8FA6E8] text-white dark:text-[#0B1020] text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] divide-y divide-[#E4DFD6] dark:divide-[#232B4A] overflow-hidden">
            {filteredPrompts.map((section) => {
              const isOpen = expandedIds.includes(section.id);
              const isCopied = copiedKey === section.id;
              const isDownloaded = downloadedKey === `dl-${section.id}`;
              const priorityColor =
                section.priority === 'P0'
                  ? 'text-rose-600 dark:text-rose-400'
                  : section.priority === 'P1'
                    ? 'text-[#1C6E46] dark:text-[#6FCB9F]'
                    : 'text-[#1F3863] dark:text-[#8FA6E8]';

              return (
                <div key={section.id} className="transition-colors">
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleExpandPrompt(section.id)}
                      aria-expanded={isOpen}
                      className="text-left min-w-0 flex-1 space-y-1 cursor-pointer focus:outline-none"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#5F6576] dark:text-[#8E96B0]">
                        <span className={`font-mono font-bold tabular-nums ${priorityColor}`}>
                          {section.code}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{section.phaseLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{section.targetArea}</span>
                        {section.dependsOn.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-[11px]">
                              After {section.dependsOn.join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-sm sm:text-base font-bold text-[#16213A] dark:text-[#E7EBF5] tracking-tight">
                        {section.title}
                      </div>
                      <p className="text-xs text-[#4A5568] dark:text-[#A4ADC6] leading-relaxed max-w-3xl">
                        {section.summary}
                      </p>
                    </button>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(section.id, section.promptMarkdown)}
                        className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1.5 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                        )}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadMd(
                            `dl-${section.id}`,
                            `spenta-${section.code.toLowerCase().replace('.', '-')}-${section.id}.md`,
                            buildSinglePromptSectionMd(section),
                          )
                        }
                        className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1.5 rounded-lg border border-[#1C6E46]/35 dark:border-[#6FCB9F]/35 bg-[#1C6E46]/10 dark:bg-[#6FCB9F]/12 hover:bg-[#1C6E46]/18 dark:hover:bg-[#6FCB9F]/20 text-xs font-semibold text-[#1C6E46] dark:text-[#6FCB9F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        title={`Download ${section.code} agent prompt as Markdown`}
                      >
                        {isDownloaded ? (
                          <Check className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" />
                        ) : (
                          <Download className="w-3.5 h-3.5" strokeWidth={1.65} />
                        )}
                        <span>{isDownloaded ? 'Downloaded .md' : 'Download Markdown'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpandPrompt(section.id)}
                        aria-label={isOpen ? `Collapse ${section.code}` : `Expand ${section.code}`}
                        className="p-2 rounded-lg text-[#5F6576] dark:text-[#8E96B0] hover:bg-[#FAF8F4] dark:hover:bg-[#0F1529] cursor-pointer"
                      >
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4" strokeWidth={1.5} />
                        ) : (
                          <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5">
                      <pre className="p-4 rounded-lg bg-[#0B1020] text-[#E7EBF5] text-xs leading-relaxed font-mono overflow-x-auto whitespace-pre-wrap border border-[#232B4A]">
                        {section.promptMarkdown}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 02: 4-Theme Live Virtual Iframe Preview & v0 Design Mode Workbench */}
      <section className="space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-3">
          <div>
            <div className="text-xs text-[#5F6576] dark:text-[#8E96B0]">
              <span>02. Live Virtual Iframe Sandbox &amp; v0 Workbench</span>
              <span className="mx-1.5" aria-hidden="true">
                ·
              </span>
              <span>Responsive 100%/768px/375px frames · Preview / Split / Code · Visual Token Tweaker</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#16213A] dark:text-[#E7EBF5] tracking-tight mt-0.5 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#1C6E46] dark:text-[#6FCB9F] shrink-0" strokeWidth={1.5} />
              <span>4-Theme Virtual Iframes &amp; Interactive Design Mode Workbench</span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Live Preview Toggle: 2x2 Virtual Iframes vs Single Focus v0 Workbench */}
            <div
              role="group"
              aria-label="Live preview viewport layout"
              className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#F2EFE9] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A]"
            >
              <button
                type="button"
                onClick={() => setPreviewLayout('iframes')}
                aria-pressed={previewLayout === 'iframes'}
                className={`inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  previewLayout === 'iframes'
                    ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                    : 'text-[#4A5568] dark:text-[#A4ADC6] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.65} />
                <span>4-Theme Virtual Iframes (2×2)</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewLayout('single')}
                aria-pressed={previewLayout === 'single'}
                className={`inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  previewLayout === 'single'
                    ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                    : 'text-[#4A5568] dark:text-[#A4ADC6] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" strokeWidth={1.65} />
                <span>Single Focus v0 Workbench</span>
              </button>
            </div>

            {previewLayout === 'iframes' ? (
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#F2EFE9] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A]">
                <button
                  type="button"
                  onClick={() => syncAllIframePolarities('native')}
                  className="min-h-[34px] px-2.5 py-1.5 rounded-md text-xs font-semibold text-[#4A5568] dark:text-[#A4ADC6] hover:bg-white dark:hover:bg-[#141A32] hover:text-[#16213A] dark:hover:text-[#E7EBF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Native Defaults
                </button>
                <button
                  type="button"
                  onClick={() => syncAllIframePolarities('light')}
                  className="inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1.5 rounded-md text-xs font-semibold text-[#4A5568] dark:text-[#A4ADC6] hover:bg-white dark:hover:bg-[#141A32] hover:text-[#16213A] dark:hover:text-[#E7EBF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Sun className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>All Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => syncAllIframePolarities('dark')}
                  className="inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1.5 rounded-md text-xs font-semibold text-[#4A5568] dark:text-[#A4ADC6] hover:bg-white dark:hover:bg-[#141A32] hover:text-[#16213A] dark:hover:text-[#E7EBF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Moon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>All Dark</span>
                </button>
              </div>
            ) : (
              <>
                <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#F2EFE9] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A]">
                  {THEME_REFERENCE_SPECS.map((t) => {
                    const active = t.id === activeThemeId;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectTheme(t.id)}
                        className={`min-h-[34px] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                            : 'text-[#4A5568] dark:text-[#A4ADC6] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                        }`}
                      >
                        {t.shortLabel}
                      </button>
                    );
                  })}
                </div>

                <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#F2EFE9] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A]">
                  <button
                    type="button"
                    onClick={() => setPreviewPolarity('light')}
                    className={`inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      previewPolarity === 'light'
                        ? 'bg-white dark:bg-[#141A32] text-[#16213A] dark:text-[#E7EBF5] shadow-xs'
                        : 'text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPolarity('dark')}
                    className={`inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      previewPolarity === 'dark'
                        ? 'bg-white dark:bg-[#141A32] text-[#16213A] dark:text-[#E7EBF5] shadow-xs'
                        : 'text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Dark</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {previewLayout === 'iframes' ? (
          /* 2x2 Real-Time Virtual Iframes Comparison Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {gridIframeDocs.map(({ spec, polarity, srcDoc }) => {
              const isOitsDhaka = spec.id === 'oitsdhaka';
              return (
                <div
                  key={spec.id}
                  className={`rounded-xl border overflow-hidden flex flex-col bg-white dark:bg-[#141A32] ${
                    isOitsDhaka
                      ? 'border-[#1C6E46]/55 dark:border-[#6FCB9F]/45'
                      : 'border-[#E4DFD6] dark:border-[#232B4A]'
                  }`}
                >
                  {/* Virtual Browser Chrome Toolbar */}
                  <div className="px-3.5 py-2.5 border-b border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#16213A] dark:text-[#E7EBF5]">
                        <span className="truncate">{spec.name}</span>
                        <span className="font-mono text-[10px] font-normal text-[#5F6576] dark:text-[#8E96B0] shrink-0">
                          ({polarity})
                        </span>
                      </div>
                      <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0] truncate">
                        {spec.archetype}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleSingleIframePolarity(spec.id)}
                        title={`Flip ${spec.shortLabel} iframe to ${polarity === 'dark' ? 'light' : 'dark'} mode`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] text-[11px] font-semibold text-[#16213A] dark:text-[#E7EBF5] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {polarity === 'dark' ? (
                          <Sun className="w-3 h-3" strokeWidth={1.6} />
                        ) : (
                          <Moon className="w-3 h-3" strokeWidth={1.6} />
                        )}
                        <span>{polarity === 'dark' ? 'Light' : 'Dark'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectTheme(spec.id, true, true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1F3863] dark:bg-[#8FA6E8] text-white dark:text-[#0B1020] text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <SlidersHorizontal className="w-3 h-3" strokeWidth={1.75} />
                        <span>Design / Code</span>
                      </button>

                      <a
                        href={spec.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${spec.name} live site`}
                        className="p-1 rounded-md text-[#5F6576] hover:text-[#1C6E46] dark:text-[#8E96B0] dark:hover:text-[#6FCB9F]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </a>
                    </div>
                  </div>

                  {/* Isolated Interactive Virtual Iframe */}
                  <iframe
                    title={`${spec.name} virtual theme preview (${polarity})`}
                    srcDoc={srcDoc}
                    sandbox="allow-scripts"
                    className="w-full h-[350px] border-0 block bg-transparent"
                  />

                  {/* Compact Verified Hex Swatch Bar */}
                  <div className="px-3.5 py-2 border-t border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] flex items-center justify-between gap-2 text-[10px] font-mono text-[#5F6576] dark:text-[#8E96B0]">
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      {spec.keySwatches.slice(0, 5).map((sw) => (
                        <button
                          key={sw.hex}
                          type="button"
                          onClick={() => handleCopy(`grid-sw-${spec.id}-${sw.hex}`, sw.hex)}
                          title={`${sw.label}: ${sw.hex} (click to copy)`}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 cursor-pointer shrink-0"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-xs border border-black/15 dark:border-white/15"
                            style={{ backgroundColor: sw.hex }}
                          />
                          <span>
                            {copiedKey === `grid-sw-${spec.id}-${sw.hex}` ? 'Copied' : sw.hex}
                          </span>
                        </button>
                      ))}
                    </div>
                    <span className="shrink-0 hidden sm:inline">
                      r={spec.radiusCard}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Single Focus v0 Workbench: Responsive Viewport + Preview/Split/Code + Visual Design Mode */
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
            {/* Left 8 cols: v0 Responsive Preview / Split / Code Workbench */}
            <div className="xl:col-span-8 rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-4 sm:p-5 flex flex-col justify-between gap-4">
              {/* Top v0 Workbench Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-[#E4DFD6] dark:border-[#232B4A]">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#16213A] dark:text-[#E7EBF5]">
                    {activeTheme.name} — {activeTheme.archetype}
                  </div>
                  <div className="text-xs text-[#5F6576] dark:text-[#8E96B0] mt-0.5 flex flex-wrap items-center gap-2">
                    <span>
                      Polarity:{' '}
                      <strong className="font-mono text-[#1C6E46] dark:text-[#6FCB9F]">
                        {previewPolarity}
                      </strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Radius {effectiveRadiusPx}px · {effectiveDensity}
                    </span>
                    {hasActiveOverrides && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                          Custom Tokens Active
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Responsive Viewport Switcher (Desktop 100% / Tablet 768px / Mobile 375px) */}
                  <div
                    role="group"
                    aria-label="Virtual preview viewport width"
                    className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#F2EFE9] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A]"
                  >
                    {(
                      [
                        { id: 'desktop', label: '100%', icon: Monitor },
                        { id: 'tablet', label: '768px', icon: Tablet },
                        { id: 'mobile', label: '375px', icon: Smartphone },
                      ] as const
                    ).map((vp) => {
                      const Icon = vp.icon;
                      const active = viewportSize === vp.id;
                      return (
                        <button
                          key={vp.id}
                          type="button"
                          onClick={() => setViewportSize(vp.id)}
                          aria-pressed={active}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                            active
                              ? 'bg-white dark:bg-[#141A32] text-[#16213A] dark:text-[#6FCB9F] shadow-xs'
                              : 'text-[#4A5568] dark:text-[#A4ADC6] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                          }`}
                        >
                          <Icon className="w-3 h-3" strokeWidth={1.65} />
                          <span>{vp.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Preview | Split | Code Switcher */}
                  <div
                    role="group"
                    aria-label="Workbench view mode"
                    className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#F2EFE9] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A]"
                  >
                    {(
                      [
                        { id: 'preview', label: 'Preview', icon: Monitor },
                        { id: 'split', label: 'Split', icon: Columns2 },
                        { id: 'code', label: 'Code', icon: Code2 },
                      ] as const
                    ).map((m) => {
                      const Icon = m.icon;
                      const active = workbenchMode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setWorkbenchMode(m.id)}
                          aria-pressed={active}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                            active
                              ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                              : 'text-[#4A5568] dark:text-[#A4ADC6] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                          }`}
                        >
                          <Icon className="w-3 h-3" strokeWidth={1.65} />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Visual Design Mode Toggle */}
                  <button
                    type="button"
                    onClick={() => setDesignModeOpen((v) => !v)}
                    aria-pressed={designModeOpen}
                    className={`inline-flex items-center gap-1.5 min-h-[34px] px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      designModeOpen
                        ? 'border-[#1C6E46]/50 dark:border-[#6FCB9F]/50 bg-[#1C6E46]/10 dark:bg-[#6FCB9F]/12 text-[#1C6E46] dark:text-[#6FCB9F]'
                        : 'border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] text-[#4A5568] dark:text-[#A4ADC6]'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.6} />
                    <span>Design Mode</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Visual Design Mode Token Tweaker */}
              {designModeOpen && (
                <div className="rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] p-3.5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] font-mono font-semibold text-[#16213A] dark:text-[#E7EBF5]">
                      Visual Design Mode · Live CSS Custom Property Tweaker
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy('css-tokens-live', liveTokenCssCode)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] text-[11px] font-semibold text-[#16213A] dark:text-[#E7EBF5] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 cursor-pointer whitespace-nowrap"
                      >
                        {copiedKey === 'css-tokens-live' ? (
                          <Check className="w-3 h-3 text-[#1C6E46] dark:text-[#6FCB9F]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedKey === 'css-tokens-live' ? 'Copied CSS' : 'Copy CSS Tokens'}</span>
                      </button>
                      {hasActiveOverrides && (
                        <button
                          type="button"
                          onClick={resetActiveOverrides}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] text-[11px] font-semibold text-[#4A5568] dark:text-[#A4ADC6] hover:border-rose-500/40 cursor-pointer whitespace-nowrap"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Tokens</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    {/* Brand Accent Swatches + Native Picker */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-mono text-[#5F6576] dark:text-[#8E96B0]">
                        Brand Accent ({effectiveBrandHex})
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {BRAND_SWATCH_PRESETS.map((sw) => (
                          <button
                            key={sw.hex}
                            type="button"
                            onClick={() =>
                              updateActiveOverride({ brandHex: sw.hex, accentHex: sw.hex })
                            }
                            title={`${sw.label} (${sw.hex})`}
                            aria-label={`Set brand accent to ${sw.label}`}
                            className={`w-5 h-5 rounded-md border cursor-pointer transition-transform hover:scale-110 ${
                              effectiveBrandHex.toLowerCase() === sw.hex.toLowerCase()
                                ? 'ring-2 ring-[#1C6E46] dark:ring-[#6FCB9F] ring-offset-1 dark:ring-offset-[#0F1529]'
                                : 'border-black/15 dark:border-white/20'
                            }`}
                            style={{ backgroundColor: sw.hex }}
                          />
                        ))}
                        <label
                          className="inline-flex items-center gap-1 text-[10px] font-mono text-[#4A5568] dark:text-[#A4ADC6] cursor-pointer"
                          title="Pick custom hex color"
                        >
                          <input
                            type="color"
                            value={effectiveBrandHex.startsWith('#') ? effectiveBrandHex : '#1F3863'}
                            onChange={(e) =>
                              updateActiveOverride({
                                brandHex: e.target.value,
                                accentHex: e.target.value,
                              })
                            }
                            aria-label="Custom brand accent color"
                            className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Card Radius Slider (4px - 22px) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#5F6576] dark:text-[#8E96B0] tabular-nums">
                        <span>Card Radius</span>
                        <span className="font-bold text-[#16213A] dark:text-[#E7EBF5]">
                          {effectiveRadiusPx}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={4}
                        max={22}
                        step={1}
                        value={effectiveRadiusPx}
                        onChange={(e) =>
                          updateActiveOverride({ radiusCardPx: Number(e.target.value) })
                        }
                        aria-label="Card border radius in pixels"
                        className="w-full spenta-slider"
                      />
                    </div>

                    {/* Layout Density Segmented Toggle */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-mono text-[#5F6576] dark:text-[#8E96B0]">
                        Layout Density
                      </div>
                      <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-[#F2EFE9] dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A]">
                        {(['compact', 'balanced', 'editorial'] as const).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => updateActiveOverride({ density: d })}
                            className={`px-2 py-1 rounded text-[10px] font-mono font-semibold capitalize transition-colors cursor-pointer whitespace-nowrap ${
                              effectiveDensity === d
                                ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                                : 'text-[#4A5568] dark:text-[#A4ADC6] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview / Split / Code Main Viewport */}
              <div
                className={
                  workbenchMode === 'split'
                    ? 'grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch'
                    : 'block'
                }
              >
                {(workbenchMode === 'preview' || workbenchMode === 'split') && (
                  <div
                    className={`${
                      workbenchMode === 'split' ? 'lg:col-span-7' : 'w-full'
                    } rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-[#F2EFE9] dark:bg-[#0B1020] p-2.5 overflow-x-auto`}
                  >
                    <div
                      className={`${viewportWidthClass} transition-all duration-200 rounded-lg overflow-hidden border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#0B1020] shadow-sm`}
                    >
                      <iframe
                        title={`${activeTheme.name} focused virtual preview (${previewPolarity}, ${viewportSize})`}
                        srcDoc={singleIframeSrcDoc}
                        sandbox="allow-scripts"
                        className="w-full h-[380px] border-0 block"
                      />
                    </div>
                  </div>
                )}

                {(workbenchMode === 'code' || workbenchMode === 'split') && (
                  <div
                    className={`${
                      workbenchMode === 'split' ? 'lg:col-span-5' : 'w-full'
                    } rounded-xl border border-[#232B4A] bg-[#0B1020] flex flex-col overflow-hidden`}
                  >
                    <div className="px-3.5 py-2 border-b border-[#232B4A] flex items-center justify-between gap-2 text-[11px] font-mono text-[#8E96B0]">
                      <span>tokens.{activeTheme.id}.css</span>
                      <button
                        type="button"
                        onClick={() => handleCopy('css-code-pane', liveTokenCssCode)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#141A32] hover:bg-[#1E2646] text-[#E7EBF5] border border-[#232B4A] cursor-pointer whitespace-nowrap"
                      >
                        {copiedKey === 'css-code-pane' ? (
                          <Check className="w-3 h-3 text-[#6FCB9F]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedKey === 'css-code-pane' ? 'Copied' : 'Copy CSS'}</span>
                      </button>
                    </div>
                    <pre className="p-3.5 text-[11px] leading-relaxed font-mono text-[#A7E6C7] overflow-auto max-h-[370px] whitespace-pre">
                      {liveTokenCssCode}
                    </pre>
                  </div>
                )}
              </div>

              {/* Verified Hex Swatches (1-click copy) */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0]">
                    Verified Extracted Palette Tokens (click any swatch to copy hex)
                  </span>
                  <a
                    href={activeTheme.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1C6E46] dark:text-[#6FCB9F] hover:underline whitespace-nowrap shrink-0"
                  >
                    <span>Inspect Live Site</span>
                    <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                  </a>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {activeTheme.keySwatches.map((swatch) => {
                    const swatchKey = `swatch-${activeTheme.id}-${swatch.hex}`;
                    const copied = copiedKey === swatchKey;
                    return (
                      <button
                        key={swatch.label}
                        type="button"
                        onClick={() => handleCopy(swatchKey, swatch.hex)}
                        className="text-left p-2 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 transition-colors cursor-pointer"
                      >
                        <div
                          className="w-full h-6 rounded border border-black/10 dark:border-white/10 mb-1.5"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        <div className="text-[10px] font-semibold text-[#16213A] dark:text-[#E7EBF5] truncate">
                          {swatch.label}
                        </div>
                        <div className="text-[10px] font-mono text-[#5F6576] dark:text-[#8E96B0]">
                          {copied ? 'Copied!' : swatch.hex}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 4 cols: Copyable Theme Templating Prompt */}
            <div className="xl:col-span-4 rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-4 sm:p-5 flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E4DFD6] dark:border-[#232B4A]">
                <div>
                  <div className="text-xs text-[#5F6576] dark:text-[#8E96B0]">
                    Theme Templating Prompt
                  </div>
                  <div className="text-sm font-bold text-[#16213A] dark:text-[#E7EBF5] mt-0.5">
                    Apply "{activeTheme.archetype}"
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(`theme-prompt-${activeTheme.id}`, activeTheme.templatePromptMarkdown)
                    }
                    className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1.5 rounded-lg bg-[#1F3863] dark:bg-[#8FA6E8] text-white dark:text-[#0B1020] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedKey === `theme-prompt-${activeTheme.id}` ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                    )}
                    <span>
                      {copiedKey === `theme-prompt-${activeTheme.id}` ? 'Copied' : 'Copy'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadMd(
                        `dl-theme-${activeTheme.id}`,
                        `theme-template-${activeTheme.id}.md`,
                        `${activeTheme.templatePromptMarkdown}\n`,
                      )
                    }
                    className="inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1.5 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] cursor-pointer whitespace-nowrap"
                    title={`Download ${activeTheme.shortLabel} theme prompt as Markdown`}
                  >
                    {downloadedKey === `dl-theme-${activeTheme.id}` ? (
                      <Check className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" />
                    ) : (
                      <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                    )}
                    <span>.md</span>
                  </button>
                </div>
              </div>

              <pre className="flex-1 p-3.5 rounded-lg bg-[#0B1020] text-[#E7EBF5] text-[11.5px] leading-relaxed font-mono overflow-auto max-h-[460px] whitespace-pre-wrap border border-[#232B4A]">
                {activeTheme.templatePromptMarkdown}
              </pre>

              <div className="text-[11px] text-[#5F6576] dark:text-[#8E96B0] pt-1">
                Paste this theme block (or your tweaked CSS tokens) above any P0–P2 prompt to restyle a branch using{' '}
                <span className="font-mono text-[#16213A] dark:text-[#E7EBF5]">
                  {activeTheme.shortLabel}
                </span>
                .
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 03: Deep Spenta Dhaka Analysis, Live Interactive Pathway & Master Remix Prompt */}
      <section className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div>
            <div className="text-xs text-[#5F6576] dark:text-[#8E96B0]">
              <span>03. Primary Branch Remix Blueprint</span>
              <span className="mx-1.5" aria-hidden="true">
                ·
              </span>
              <span>spenta-dhaka Visual System × roadmap.sh UX × Spenta/Odoo Content</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#16213A] dark:text-[#E7EBF5] tracking-tight mt-0.5 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#1C6E46] dark:text-[#6FCB9F] shrink-0" strokeWidth={1.5} />
              <span>Deep Spenta Dhaka Analysis &amp; Master GitHub Branch Remix Prompt</span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy('oits-master-prompt', OITS_DHAKA_ROADMAP_MASTER_PROMPT)}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50 text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedKey === 'oits-master-prompt' ? (
                <Check className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" />
              ) : (
                <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
              )}
              <span>
                {copiedKey === 'oits-master-prompt' ? 'Copied Master Prompt' : 'Copy Master Prompt'}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleDownloadMd(
                  'oits-master-md',
                  'spenta-dhaka-roadmap-master-remix-prompt.md',
                  buildOitsDhakaMasterRemixMd(),
                )
              }
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 rounded-lg bg-[#1F3863] dark:bg-[#8FA6E8] text-white dark:text-[#0B1020] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {downloadedKey === 'oits-master-md' ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
              )}
              <span>
                {downloadedKey === 'oits-master-md'
                  ? 'Downloaded Master .md'
                  : 'Download Master Remix (.md)'}
              </span>
            </button>
          </div>
        </div>

        {/* 4-Pillar Deep Architectural Teardown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OITS_DHAKA_DEEP_ANALYSIS_PILLARS.map((pillar) => (
            <article
              key={pillar.id}
              className="rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-4 sm:p-5 space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#1C6E46] dark:text-[#6FCB9F]">
                  {pillar.index}.
                </span>
                <h4 className="text-sm font-bold text-[#16213A] dark:text-[#E7EBF5] tracking-tight">
                  {pillar.title}
                </h4>
              </div>
              <div className="space-y-2 text-xs leading-relaxed">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#5F6576] dark:text-[#8E96B0]">
                    Spenta Dhaka Pattern:{' '}
                  </span>
                  <span className="text-[#4A5568] dark:text-[#A4ADC6]">{pillar.oitsDhakaPattern}</span>
                </div>
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#1C6E46] dark:text-[#6FCB9F]">
                    roadmap.sh UX Fusion:{' '}
                  </span>
                  <span className="text-[#4A5568] dark:text-[#A4ADC6]">
                    {pillar.roadmapShAdaptation}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#1F3863] dark:text-[#8FA6E8]">
                    Spenta / Odoo Content:{' '}
                  </span>
                  <span className="text-[#4A5568] dark:text-[#A4ADC6]">
                    {pillar.odooContentMapping}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Live Interactive Spenta Dhaka × roadmap.sh Pathway Blueprint Prototype */}
        <InteractiveArchitecturePathway compact defaultExpandedTrunks={['trunk-core', 'trunk-ops']} />

        {/* Collapsible Full Master Remix Prompt Markdown Box */}
        <div className="rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-[#E4DFD6] dark:border-[#232B4A] flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-mono text-[#1C6E46] dark:text-[#6FCB9F] font-semibold">
                git checkout -b remix/spenta-dhaka-roadmap-edition
              </div>
              <div className="text-sm font-bold text-[#16213A] dark:text-[#E7EBF5] mt-0.5">
                Executable Master Prompt — Spenta Dhaka Theme + Code-Drawn roadmap.sh Infographics + Tactile 3D PBR + 4-Resource Spec
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMasterPromptExpanded((v) => !v)}
              className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1.5 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] cursor-pointer whitespace-nowrap"
            >
              {masterPromptExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Hide Prompt</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Show Full Prompt</span>
                </>
              )}
            </button>
          </div>
          {masterPromptExpanded && (
            <div className="p-4 sm:p-5">
              <pre className="p-4 rounded-lg bg-[#0B1020] text-[#E7EBF5] text-xs leading-relaxed font-mono overflow-auto max-h-[460px] whitespace-pre-wrap border border-[#232B4A]">
                {OITS_DHAKA_ROADMAP_MASTER_PROMPT}
              </pre>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 04: Refero UI Pattern Taxonomy & State Completeness Explorer */}
      <ReferoPatternExplorer />

      {/* SECTION 05: 4-Way Design & Theme Comparison Matrix */}
      <DesignComparisonTable />
    </div>
  );
}
