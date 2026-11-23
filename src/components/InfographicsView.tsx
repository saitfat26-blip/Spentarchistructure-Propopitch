import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Code2,
  Download,
  GitBranch,
  Image as ImageIcon,
  ImageOff,
  Layers,
  Maximize2,
  Moon,
  Printer,
  Sun,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import aiBrainPlate from '../assets/images/spenta_ai_brain_plate_1795170757868.jpg';
import l1L6Plate from '../assets/images/spenta_l1_l6_stack_plate_1795170758646.jpg';
import captivePlate from '../assets/images/spenta_captive_ecosystem_plate_1795170758530.jpg';
import financialsPlate from '../assets/images/spenta_financials_plate_1795170783795.jpg';
import { useTheme } from '../context/ThemeContext';
import { useStack } from '../store/StackContext';
import { InteractiveArchitecturePathway } from './InteractiveArchitecturePathway';
import {
  InteractiveInfographicPlate,
  OitsPlateId,
  exportPlateSvg,
} from './InteractiveInfographicPlates';

interface InfographicPlate {
  id: OitsPlateId;
  legacyId: string;
  plateNumber: string;
  tag: string;
  title: string;
  subtitle: string;
  highlights: string[];
  imageUrl: string;
  filename: string;
  svgFilename: string;
}

const INFOGRAPHIC_PLATES: InfographicPlate[] = [
  {
    id: 'ai-brain',
    legacyId: 'spenta-ai-brain-map',
    plateNumber: 'PLATE 01',
    tag: 'ECOSYSTEM TOPOLOGY',
    title: 'Spenta Sovereign AI Brain — 8 Hubs & 13 Composable Modules',
    subtitle:
      'Dual-hemisphere architecture uniting Operations Engine (Healthcare, Banking, ERP, Security) with Experience & IR4 Engine (XR, Voice, Retail, Edge) around Spenta Core L1–L6.',
    highlights: ['Zero Cloud PII Egress', '0.88 Confidence HITL Gate', 'San Jose · Australia · Dhaka'],
    imageUrl: aiBrainPlate,
    filename: 'spenta-plate-01-sovereign-ai-brain.jpg',
    svgFilename: 'spenta-plate-01-spentadhaka-brain.svg',
  },
  {
    id: 'l1-l6-stack',
    legacyId: 'l1-l6-sovereign-isolation',
    plateNumber: 'PLATE 02',
    tag: 'SYSTEM ARCHITECTURE',
    title: 'L1–L6 Sovereign Fusion Stack & 4-Tier On-Prem Server Matrix',
    subtitle:
      'End-to-end hardware-enforced sovereignty from Wasm/MQTT IIoT gateways and AMD SEV-SNP/TDX enclaves up through local LLaMA 3.2 Vision, UE5 Digital Twins, OPA 0.88 Gate, and Omni-Channel UI.',
    highlights: ['Tier 1–4 ($3.2K–$15.3K)', 'Tier 3 Baseline $8.5K–$10.5K', '<50ms Edge Inference'],
    imageUrl: l1L6Plate,
    filename: 'spenta-plate-02-l1-l6-sovereign-stack.jpg',
    svgFilename: 'spenta-plate-02-spentadhaka-l1-l6-stack.svg',
  },
  {
    id: 'captive-ecosystem',
    legacyId: 'best-xltd-captive-flows',
    plateNumber: 'PLATE 03',
    tag: 'CAPTIVE DISTRIBUTION',
    title: 'Captive Sister-Entity Synergies: BEST Retail & X Ltd Mobility',
    subtitle:
      'Production-hardened rollout pipelines spanning BEST Electronics (65+ showrooms, 365 Exchange Circular CRM, WebAR Try-On) and X Ltd (80 BaaS swap stations, 480 EVs, Green AI carbon telemetry).',
    highlights: ['65+ Retail Showrooms', '80 BaaS Stations / 480 EVs', 'Live Sister-Entity Proof'],
    imageUrl: captivePlate,
    filename: 'spenta-plate-03-captive-ecosystem-synergies.jpg',
    svgFilename: 'spenta-plate-03-spentadhaka-captive-synergies.svg',
  },
  {
    id: 'financial-edge',
    legacyId: 'dual-capability-engine',
    plateNumber: 'PLATE 04',
    tag: 'INVESTOR ECONOMICS',
    title: 'Reconciled FY2027–FY2031 Trajectory & Dual-Shore Cost Edge',
    subtitle:
      'Conservative ~0.5825× 5-yr blended scaling from $672K FY27 to $5.85M FY31 delivering 6.38× 5-year Capital Efficiency and 4.16×–6.24× modeled SAFE Exit ROI (10×–15× EV), anchored by $12.98/hr loaded (~$18.54/hr @ 70% util.) Dhaka R&D economics.',
    highlights: ['$500K SAFE · $4.5M Post-Money Cap', '4.16×–6.24× Exit ROI', '6.38× Capital Eff.'],
    imageUrl: financialsPlate,
    filename: 'spenta-plate-04-financial-trajectory-dual-shore.jpg',
    svgFilename: 'spenta-plate-04-spentadhaka-financial-edge.svg',
  },
];

export function InfographicsView() {
  const { theme: platePolarity, setTheme: setPlatePolarity } = useTheme();
  const { pendingNavFocus, clearPendingNavFocus } = useStack();
  const [viewMode, setViewMode] = useState<'all' | 'pathway' | 'plates'>('all');
  const [globalRenderMode, setGlobalRenderMode] = useState<'code' | 'static'>('code');
  const [plateModeOverrides, setPlateModeOverrides] = useState<
    Partial<Record<OitsPlateId, 'code' | 'static'>>
  >({});
  const [lightboxItem, setLightboxItem] = useState<InfographicPlate | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [downloadedKey, setDownloadedKey] = useState<string | null>(null);
  const downloadTimerRef = useRef<number | null>(null);

  const svgRefs: Record<OitsPlateId, React.RefObject<SVGSVGElement | null>> = {
    'ai-brain': useRef<SVGSVGElement | null>(null),
    'l1-l6-stack': useRef<SVGSVGElement | null>(null),
    'captive-ecosystem': useRef<SVGSVGElement | null>(null),
    'financial-edge': useRef<SVGSVGElement | null>(null),
  };
  const lightboxSvgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    return () => {
      if (downloadTimerRef.current !== null) {
        window.clearTimeout(downloadTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (pendingNavFocus?.type === 'infographic') {
      const match = INFOGRAPHIC_PLATES.find(
        (p) => p.id === pendingNavFocus.id || p.legacyId === pendingNavFocus.id,
      );
      if (match) {
        setZoom(1);
        setLightboxItem(match);
      }
      clearPendingNavFocus();
    }
  }, [pendingNavFocus, clearPendingNavFocus]);

  useEffect(() => {
    if (!lightboxItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxItem(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxItem]);

  const getPlateMode = (id: OitsPlateId): 'code' | 'static' =>
    plateModeOverrides[id] ?? globalRenderMode;

  const setAllPlatesMode = (mode: 'code' | 'static') => {
    setGlobalRenderMode(mode);
    setPlateModeOverrides({});
  };

  const toggleSinglePlateMode = (id: OitsPlateId) => {
    const current = getPlateMode(id);
    setPlateModeOverrides((prev) => ({
      ...prev,
      [id]: current === 'code' ? 'static' : 'code',
    }));
  };

  const flashDownloadConfirmation = (key: string) => {
    setDownloadedKey(key);
    if (downloadTimerRef.current !== null) {
      window.clearTimeout(downloadTimerRef.current);
    }
    downloadTimerRef.current = window.setTimeout(() => {
      setDownloadedKey(null);
      downloadTimerRef.current = null;
    }, 1800);
  };

  const downloadPlate = (plate: InfographicPlate, fromLightbox = false) => {
    const mode = getPlateMode(plate.id);
    const key = fromLightbox ? `${plate.id}-lightbox` : plate.id;
    if (mode === 'code') {
      const targetSvg = fromLightbox ? lightboxSvgRef.current : svgRefs[plate.id].current;
      const polaritySuffix = platePolarity === 'dark' ? 'nocturnal' : 'stone';
      const svgFilename = plate.svgFilename.replace(/\.svg$/i, `-${polaritySuffix}.svg`);
      const exported = exportPlateSvg(
        targetSvg,
        svgFilename,
        `${plate.plateNumber}: ${plate.title}`,
      );
      if (exported) {
        flashDownloadConfirmation(key);
      }
      return;
    }
    const link = document.createElement('a');
    link.href = plate.imageUrl;
    link.download = plate.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    flashDownloadConfirmation(key);
  };

  const isDark = platePolarity === 'dark';

  return (
    <div className="space-y-6">
      {/* OITS Dhaka Editorial Header */}
      <section
        className={`rounded-[10px] border p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors ${
          isDark
            ? 'bg-[#0F1529] border-[#232B4A] text-[#E7EBF5]'
            : 'bg-[#FAF8F4] border-[#E4DFD6] text-[#16213A]'
        }`}
      >
        <div className="min-w-0">
          <div
            className={`text-[11px] font-mono font-semibold ${
              isDark ? 'text-[#8FA6E8]' : 'text-[#1F3863]'
            }`}
          >
            Spenta Dhaka Swiss Editorial Edition · Interactive Code Plates &amp; Branching Pathway
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1 text-balance">
            Infographics — Code-Drawn Architectural Plates &amp; Interactive Pathway
          </h1>
          <p
            className={`text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed ${
              isDark ? 'text-[#C3CCE4]' : 'text-[#4A5163]'
            }`}
          >
            Inspect all four executive plates as live, clickable Spenta Dhaka vector schematics synced directly to your Stack Composer—or toggle to the original static JPG raster plates at any time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          {/* View Mode Filter */}
          <div
            role="group"
            aria-label="Infographics display mode"
            className={`inline-flex flex-wrap items-center gap-1 p-1 rounded-lg border ${
              isDark ? 'bg-[#0B1020] border-[#232B4A]' : 'bg-[#F2EFE9] border-[#E4DFD6]'
            }`}
          >
            {(
              [
                { id: 'all', label: 'All Views', icon: null },
                { id: 'pathway', label: 'Pathway', icon: GitBranch },
                { id: 'plates', label: '4 Plates', icon: Layers },
              ] as const
            ).map((opt) => {
              const active = viewMode === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setViewMode(opt.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? isDark
                        ? 'bg-[#8FA6E8] text-[#0B1020]'
                        : 'bg-[#1F3863] text-white'
                      : isDark
                        ? 'text-[#8D97B5] hover:text-[#E7EBF5]'
                        : 'text-[#4A5163] hover:text-[#16213A]'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={1.6} />}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Code SVG vs Static JPG Global Toggle */}
          <div
            role="group"
            aria-label="Plate render mode"
            className={`inline-flex items-center gap-1 p-1 rounded-lg border ${
              isDark ? 'bg-[#0B1020] border-[#232B4A]' : 'bg-[#F2EFE9] border-[#E4DFD6]'
            }`}
          >
            <button
              type="button"
              onClick={() => setAllPlatesMode('code')}
              aria-pressed={globalRenderMode === 'code'}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                globalRenderMode === 'code'
                  ? isDark
                    ? 'bg-[#6FCB9F] text-[#0B1020]'
                    : 'bg-[#1C6E46] text-white'
                  : isDark
                    ? 'text-[#8D97B5] hover:text-[#E7EBF5]'
                    : 'text-[#4A5163] hover:text-[#16213A]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" strokeWidth={1.6} />
              <span>Interactive Code</span>
            </button>
            <button
              type="button"
              onClick={() => setAllPlatesMode('static')}
              aria-pressed={globalRenderMode === 'static'}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                globalRenderMode === 'static'
                  ? isDark
                    ? 'bg-[#8FA6E8] text-[#0B1020]'
                    : 'bg-[#1F3863] text-white'
                  : isDark
                    ? 'text-[#8D97B5] hover:text-[#E7EBF5]'
                    : 'text-[#4A5163] hover:text-[#16213A]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" strokeWidth={1.6} />
              <span>Static JPG</span>
            </button>
          </div>

          {/* Local OITS Dhaka Stone Light / Nocturnal Dark Polarity Toggle */}
          <div
            role="group"
            aria-label="Spenta Dhaka plate theme polarity"
            className={`inline-flex items-center gap-1 p-1 rounded-lg border ${
              isDark ? 'bg-[#0B1020] border-[#232B4A]' : 'bg-[#F2EFE9] border-[#E4DFD6]'
            }`}
          >
            <button
              type="button"
              onClick={() => setPlatePolarity('light')}
              aria-pressed={!isDark}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                !isDark
                  ? 'bg-[#1F3863] text-white'
                  : 'text-[#8D97B5] hover:text-[#E7EBF5]'
              }`}
            >
              <Sun className="w-3.5 h-3.5" strokeWidth={1.6} />
              <span>Stone</span>
            </button>
            <button
              type="button"
              onClick={() => setPlatePolarity('dark')}
              aria-pressed={isDark}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isDark
                  ? 'bg-[#8FA6E8] text-[#0B1020]'
                  : 'text-[#4A5163] hover:text-[#16213A]'
              }`}
            >
              <Moon className="w-3.5 h-3.5" strokeWidth={1.6} />
              <span>Nocturnal</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isDark
                ? 'bg-[#E7EBF5] text-[#0B1020] hover:bg-white'
                : 'bg-[#16213A] text-white hover:bg-[#1F3863]'
            }`}
          >
            <Printer className="w-3.5 h-3.5" strokeWidth={1.6} />
            <span>Print Gallery</span>
          </button>
        </div>
      </section>

      {/* Live Code-Drawn OITS Dhaka × roadmap.sh Interactive Architecture Pathway */}
      {(viewMode === 'all' || viewMode === 'pathway') && (
        <InteractiveArchitecturePathway
          defaultExpandedTrunks={['trunk-core', 'trunk-ops']}
          syncedPolarity={platePolarity}
          onPolarityChange={setPlatePolarity}
        />
      )}

      {/* 2x2 OITS Dhaka Interactive Code / Static JPG Plate Grid */}
      {(viewMode === 'all' || viewMode === 'plates') && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {INFOGRAPHIC_PLATES.map((plate) => {
            const mode = getPlateMode(plate.id);
            const isBroken = Boolean(failedImages[plate.id]);

            return (
              <article
                key={plate.id}
                className={`rounded-[10px] border overflow-hidden flex flex-col transition-colors ${
                  isDark
                    ? 'bg-[#141A32] border-[#232B4A] text-[#E7EBF5]'
                    : 'bg-[#FFFFFF] border-[#E4DFD6] text-[#16213A]'
                }`}
              >
                <div
                  className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                    isDark ? 'border-[#232B4A] bg-[#0F1529]' : 'border-[#E4DFD6] bg-[#FAF8F4]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                      <span
                        className={`font-bold ${isDark ? 'text-[#8FA6E8]' : 'text-[#1F3863]'}`}
                      >
                        {plate.plateNumber}
                      </span>
                      <span className={isDark ? 'text-[#34416E]' : 'text-[#CFC8BC]'}>·</span>
                      <span className={isDark ? 'text-[#8D97B5]' : 'text-[#5F6576]'}>
                        {plate.tag}
                      </span>
                      <span className={isDark ? 'text-[#34416E]' : 'text-[#CFC8BC]'}>·</span>
                      <span
                        className={
                          mode === 'code'
                            ? isDark
                              ? 'text-[#6FCB9F] font-semibold'
                              : 'text-[#1C6E46] font-semibold'
                            : isDark
                              ? 'text-[#8D97B5]'
                              : 'text-[#5F6576]'
                        }
                      >
                        {mode === 'code' ? 'Interactive Vector SVG' : 'Static JPG Plate'}
                      </span>
                    </div>
                    <h2 className="font-bold text-sm sm:text-base mt-1 leading-snug text-balance">
                      {plate.title}
                    </h2>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        isDark ? 'text-[#C3CCE4]' : 'text-[#4A5163]'
                      }`}
                    >
                      {plate.subtitle}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 no-print">
                    <button
                      type="button"
                      onClick={() => toggleSinglePlateMode(plate.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isDark
                          ? 'bg-[#141A32] border-[#2E3862] text-[#E7EBF5] hover:border-[#8FA6E8]'
                          : 'bg-[#FFFFFF] border-[#CFC8BC] text-[#16213A] hover:border-[#1F3863]'
                      }`}
                      title={mode === 'code' ? 'Switch to static JPG plate' : 'Switch to interactive code plate'}
                    >
                      {mode === 'code' ? (
                        <>
                          <ImageIcon className="w-3.5 h-3.5" strokeWidth={1.6} />
                          <span>JPG</span>
                        </>
                      ) : (
                        <>
                          <Code2 className="w-3.5 h-3.5" strokeWidth={1.6} />
                          <span>Code</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadPlate(plate)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        downloadedKey === plate.id
                          ? isDark
                            ? 'bg-[#10261F] border-[#6FCB9F] text-[#6FCB9F]'
                            : 'bg-[#ECF7F1] border-[#1C6E46] text-[#1C6E46]'
                          : mode === 'code'
                            ? isDark
                              ? 'bg-[#161D3A] border-[#8FA6E8]/70 text-[#E7EBF5] hover:border-[#8FA6E8] hover:bg-[#1D264A]'
                              : 'bg-[#EEF3FB] border-[#1F3863]/45 text-[#1F3863] hover:border-[#1F3863] hover:bg-[#E2ECFA]'
                            : isDark
                              ? 'border-[#2E3862] text-[#C3CCE4] hover:border-[#8FA6E8] hover:text-white'
                              : 'border-[#CFC8BC] text-[#4A5163] hover:border-[#1F3863] hover:text-[#16213A]'
                      }`}
                      title={
                        mode === 'code'
                          ? `Download ${plate.plateNumber} vector graphic as SVG`
                          : `Download ${plate.plateNumber} static JPG`
                      }
                      aria-label={
                        mode === 'code'
                          ? `Download ${plate.title} as SVG`
                          : `Download ${plate.title} as JPG`
                      }
                    >
                      {downloadedKey === plate.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>{mode === 'code' ? 'Saved SVG' : 'Saved JPG'}</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" strokeWidth={1.7} />
                          <span>{mode === 'code' ? 'Download as SVG' : 'Save JPG'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setZoom(1);
                        setLightboxItem(plate);
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                        isDark
                          ? 'bg-[#8FA6E8] text-[#0B1020] hover:bg-[#7FA6FF]'
                          : 'bg-[#1F3863] text-white hover:bg-[#12233F]'
                      }`}
                      title="Inspect full-screen"
                      aria-label={`Inspect ${plate.title} in lightbox`}
                    >
                      <Maximize2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Interactive Code-Drawn SVG Plate OR Static JPG Raster Plate */}
                {mode === 'code' ? (
                  <InteractiveInfographicPlate
                    plateId={plate.id}
                    polarity={platePolarity}
                    svgRef={svgRefs[plate.id]}
                  />
                ) : (
                  <div
                    onClick={() => {
                      setZoom(1);
                      setLightboxItem(plate);
                    }}
                    className="relative aspect-video bg-[#09090B] overflow-hidden cursor-zoom-in group"
                  >
                    {!isBroken ? (
                      <img
                        src={plate.imageUrl}
                        alt={plate.title}
                        loading="lazy"
                        onError={() => setFailedImages((prev) => ({ ...prev, [plate.id]: true }))}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#0B1020]">
                        <ImageOff className="w-7 h-7 text-[#8FA6E8] mb-2" strokeWidth={1.5} />
                        <div className="text-xs font-mono text-[#8FA6E8]">
                          {plate.plateNumber} · {plate.tag}
                        </div>
                        <div className="text-sm font-bold text-white mt-1 max-w-md">
                          {plate.title}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quiet Unboxed Footer Metadata Strip */}
                <div
                  className={`px-5 py-2.5 border-t flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono ${
                    isDark
                      ? 'border-[#232B4A] bg-[#0B1020] text-[#8D97B5]'
                      : 'border-[#E4DFD6] bg-[#FAF8F4] text-[#5F6576]'
                  }`}
                >
                  <span>{plate.highlights.join(' · ')}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1);
                      setLightboxItem(plate);
                    }}
                    className={`font-semibold hover:underline cursor-pointer no-print ${
                      isDark ? 'text-[#8FA6E8]' : 'text-[#1F3863]'
                    }`}
                  >
                    Open Interactive Lightbox →
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Full-Screen Interactive Lightbox (Supports both Code SVG & Static JPG) */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-[#0B1020]/94 backdrop-blur-sm flex flex-col p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={lightboxItem.title}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 text-[#E7EBF5] mb-4">
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-[#8FA6E8]">
                {lightboxItem.plateNumber} · {lightboxItem.tag} ·{' '}
                {getPlateMode(lightboxItem.id) === 'code'
                  ? 'Interactive Vector Plate'
                  : 'Static JPG Plate'}
              </div>
              <h3 className="text-sm sm:text-lg font-bold truncate">{lightboxItem.title}</h3>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => toggleSinglePlateMode(lightboxItem.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141A32] border border-[#2E3862] hover:border-[#8FA6E8] text-xs font-semibold text-[#E7EBF5] cursor-pointer whitespace-nowrap"
              >
                {getPlateMode(lightboxItem.id) === 'code' ? (
                  <>
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>View Static JPG</span>
                  </>
                ) : (
                  <>
                    <Code2 className="w-3.5 h-3.5" />
                    <span>View Interactive Code</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPlatePolarity(platePolarity === 'light' ? 'dark' : 'light')}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg bg-[#141A32] border border-[#2E3862] hover:border-[#8FA6E8] text-xs font-semibold text-[#E7EBF5] cursor-pointer whitespace-nowrap"
              >
                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span>{isDark ? 'Stone' : 'Nocturnal'}</span>
              </button>

              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.75, Number((z - 0.25).toFixed(2))))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <span className="font-mono text-xs w-12 text-center tabular-nums text-[#C3CCE4]">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2, Number((z + 0.25).toFixed(2))))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => downloadPlate(lightboxItem, true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#6FCB9F] hover:bg-[#82D7AE] text-[#0B1020] font-semibold text-xs cursor-pointer whitespace-nowrap shrink-0"
              >
                {downloadedKey === `${lightboxItem.id}-lightbox` ? (
                  <>
                    <Check className="w-3.5 h-3.5" strokeWidth={2.2} />
                    <span>
                      {getPlateMode(lightboxItem.id) === 'code' ? 'Saved SVG' : 'Saved JPG'}
                    </span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>
                      {getPlateMode(lightboxItem.id) === 'code' ? 'Download as SVG' : 'Save JPG'}
                    </span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                className="p-2 rounded-lg bg-white/10 hover:bg-[#BF000F] text-white cursor-pointer"
                aria-label="Close lightbox"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <div
            className="flex-1 overflow-auto rounded-xl bg-[#0F1529] border border-[#232B4A] p-3 sm:p-5 flex items-center justify-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) setLightboxItem(null);
            }}
          >
            <div
              style={{
                width: `${Math.round(zoom * 100)}%`,
                maxWidth: `${Math.round(zoom * 1160)}px`,
              }}
              className="transition-all duration-150"
            >
              {getPlateMode(lightboxItem.id) === 'code' ? (
                <div className="rounded-xl overflow-hidden border border-[#2E3862] shadow-2xl">
                  <InteractiveInfographicPlate
                    plateId={lightboxItem.id}
                    polarity={platePolarity}
                    svgRef={lightboxSvgRef}
                  />
                </div>
              ) : (
                <img
                  src={lightboxItem.imageUrl}
                  alt={lightboxItem.title}
                  className="w-full h-auto rounded-xl border border-white/10 shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
