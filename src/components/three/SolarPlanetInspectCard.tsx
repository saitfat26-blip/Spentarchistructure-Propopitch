import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Compass,
  Contrast,
  Gauge,
  Globe,
  History,
  Orbit,
  Sun,
  SunMoon,
  Thermometer,
  Wind,
  X,
} from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { BrainHub, SpentaApp } from '../../data/spentaManifest';

export interface PlanetAtmosphereGas {
  gas: string;
  percent: number;
  color: string;
  molarMass: string;
  spectralBand: string;
  volatility: number;
}

export interface PlanetAtmosphereData {
  composition: PlanetAtmosphereGas[];
  surfacePressure: string;
  pressureBarNum: number;
  meanTemp: string;
  meanTempC: number;
  dayNightDeltaC: number;
  baseFluxWm2: number;
  weatherSummary: string;
}

export interface PlanetOrbitalStats {
  meanVelocityKmS: number;
  axialTiltDeg: string;
  surfaceGravity: string;
  escapeVelocityKmS: number;
}

export interface PlanetHistoricalOrbitEpoch {
  epochId: string;
  epochLabel: string;
  ageLabel: string;
  au: number;
  eccentricity: number;
  inclinationDeg: number;
  velocityKmS: number;
  notes: string;
}

export interface LivePlanetInspectTelemetry {
  hubId: string;
  orbitalPhaseDeg: number;
  revolutions: number;
  solarIlluminationPct: number;
  localSolarHour: string;
  atmoFluxWave: number;
  dayNightCycleActive: boolean;
}

export interface InspectablePlanetSpec {
  hubId: string;
  celestialTier: string;
  celestialAnalog: string;
  auValue: number;
  auDistance: string;
  kmEquiv: string;
  orbitPeriod: string;
  eccentricity: number;
  tiltWeight: number;
  baseHex: string;
  accentHex: string;
  orbitColorToken: string;
  atmosphere: PlanetAtmosphereData;
  orbitalStats: PlanetOrbitalStats;
  historicalOrbits: PlanetHistoricalOrbitEpoch[];
}

export interface SolarPlanetInspectCardProps {
  planet: InspectablePlanetSpec;
  hubMeta: BrainHub;
  hubApps: SpentaApp[];
  selectedAppIds: string[];
  appMap: Record<string, SpentaApp>;
  orbitScale: number;
  orbitalVelocityMultiplier: number;
  orbitalInclinationDeg: number;
  liveTelemetry: LivePlanetInspectTelemetry | null;
  atmosphericScattering: boolean;
  onToggleAtmosphericScattering: () => void;
  onClose: () => void;
  onCyclePlanet: (direction: -1 | 1) => void;
  onReturnToOverview: () => void;
}

export interface AtmosphericScatteringProfile {
  label: string;
  dominantSummary: string;
  gradientCss: string;
  orbGlowCss: string;
  mixBlendMode: 'screen';
  baseOpacity: number;
  spreadMultiplier: number;
  primaryColor: string;
  secondaryColor: string;
}

export interface PrimaryGasMixBlendProfile {
  gasSymbol: string;
  gasName: string;
  percent: number;
  color: string;
  secondaryColor: string;
  mixBlendMode: 'color';
  rimMixBlendMode: 'screen';
  discTintCss: string;
  rimAuraCss: string;
  spectralLabel: string;
}

const GAS_SPECTRAL_DIRECTORY: Record<string, { name: string; tintHex: string }> = {
  'N₂': { name: 'Nitrogen', tintHex: '#488EFF' },
  'O₂': { name: 'Oxygen', tintHex: '#68E4EF' },
  'CO₂': { name: 'Carbon Dioxide', tintHex: '#FF894F' },
  'H₂': { name: 'Hydrogen', tintHex: '#A78BFA' },
  He: { name: 'Helium', tintHex: '#FDE08D' },
  Ar: { name: 'Argon', tintHex: '#C084FC' },
  'Ar/CO₂': { name: 'Argon / CO₂', tintHex: '#C084FC' },
  'CH₄': { name: 'Methane', tintHex: '#4ADEB5' },
  'CH₄/NH₃': { name: 'Methane / Ammonia', tintHex: '#4ADEB5' },
  Na: { name: 'Sodium Vapor', tintHex: '#FFB563' },
  'SO₂': { name: 'Sulfur Dioxide', tintHex: '#FBBF24' },
};

function parseHexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return [
    Number.isFinite(r) ? r : 104,
    Number.isFinite(g) ? g : 228,
    Number.isFinite(b) ? b : 239,
  ];
}

function rgbaStr(rgb: [number, number, number], alpha: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
}

/**
 * Generates a composition-specific soft radial gradient glow and CSS mix-blend-mode profile
 * reflecting each planet's dominant atmospheric gases and barometric optical depth.
 */
export function buildAtmosphericScatteringProfile(
  planet: InspectablePlanetSpec,
  liveComposition?: Array<{ gas: string; percent: number; color: string }>,
): AtmosphericScatteringProfile {
  const source =
    liveComposition && liveComposition.length > 0
      ? liveComposition
      : planet.atmosphere.composition;
  const sorted = [...source].sort((a, b) => b.percent - a.percent);
  const g0 = sorted[0] ?? { gas: 'N₂', percent: 78, color: planet.accentHex };
  const g1 = sorted[1] ?? { gas: 'O₂', percent: 21, color: planet.baseHex };
  const g2 = sorted[2] ?? g1;

  const rgb0 = parseHexToRgb(g0.color);
  const rgb1 = parseHexToRgb(g1.color);
  const rgb2 = parseHexToRgb(g2.color);

  const pBar = planet.atmosphere.pressureBarNum;
  const densityTier = pBar >= 50 ? 'dense' : pBar >= 0.5 ? 'balanced' : 'tenuous';
  const spreadMultiplier =
    densityTier === 'dense' ? 3.25 : densityTier === 'balanced' ? 2.85 : 2.5;
  const baseOpacity =
    densityTier === 'dense' ? 0.88 : densityTier === 'balanced' ? 0.8 : 0.7;

  const gradientCss = [
    'radial-gradient(circle at 46% 44%,',
    `${rgbaStr(rgb0, 0.72)} 0%,`,
    `${rgbaStr(rgb0, 0.54)} 26%,`,
    `${rgbaStr(rgb1, 0.38)} 46%,`,
    `${rgbaStr(rgb2, 0.2)} 61%,`,
    `${rgbaStr(rgb2, 0)} 74%)`,
  ].join(' ');

  const orbGlowCss = [
    'radial-gradient(circle at 42% 38%,',
    `${rgbaStr(rgb0, 0.92)} 0%,`,
    `${rgbaStr(rgb1, 0.52)} 46%,`,
    `${rgbaStr(rgb2, 0)} 74%)`,
  ].join(' ');

  const dominantSummary = `${g0.gas} ${Math.round(g0.percent)}% · ${g1.gas} ${Math.round(g1.percent)}%`;
  const scatterVerb =
    densityTier === 'dense'
      ? 'Mie-Rayleigh Haze'
      : densityTier === 'balanced'
        ? 'Rayleigh Limb Scatter'
        : 'Exospheric Glow';

  return {
    label: scatterVerb,
    dominantSummary,
    gradientCss,
    orbGlowCss,
    mixBlendMode: 'screen',
    baseOpacity,
    spreadMultiplier,
    primaryColor: g0.color,
    secondaryColor: g1.color,
  };
}

/**
 * Derives a planetary CSS mix-blend-mode chromatic profile directly from the selected
 * planet's primary atmospheric gas metadata so each planetary model visually shifts hue
 * by dominant gas species (N₂ cobalt, O₂ cyan, CO₂ amber-oxide, H₂ Balmer violet).
 */
export function getPrimaryGasMixBlendProfile(
  planet: InspectablePlanetSpec,
  liveComposition?: Array<{ gas: string; percent: number; color: string }>,
): PrimaryGasMixBlendProfile {
  const source =
    liveComposition && liveComposition.length > 0
      ? liveComposition
      : planet.atmosphere.composition;
  const sorted = [...source].sort((a, b) => b.percent - a.percent);
  const primary = sorted[0] ?? { gas: 'N₂', percent: 78, color: planet.accentHex };
  const secondary = sorted[1] ?? { gas: 'O₂', percent: 21, color: planet.baseHex };

  const meta = GAS_SPECTRAL_DIRECTORY[primary.gas];
  const color = meta?.tintHex ?? primary.color ?? planet.accentHex;
  const gasName = meta?.name ?? primary.gas;
  const secondaryColor =
    GAS_SPECTRAL_DIRECTORY[secondary.gas]?.tintHex ?? secondary.color ?? planet.baseHex;

  const primaryRgb = parseHexToRgb(color);
  const secondaryRgb = parseHexToRgb(secondaryColor);

  const discTintCss = [
    'radial-gradient(circle at 42% 38%,',
    `${rgbaStr(primaryRgb, 0.92)} 0%,`,
    `${rgbaStr(primaryRgb, 0.84)} 52%,`,
    `${rgbaStr(secondaryRgb, 0.62)} 78%,`,
    `${rgbaStr(primaryRgb, 0)} 98%)`,
  ].join(' ');

  const rimAuraCss = [
    'radial-gradient(circle at 46% 44%,',
    `${rgbaStr(primaryRgb, 0.14)} 0%,`,
    `${rgbaStr(primaryRgb, 0.34)} 54%,`,
    `${rgbaStr(primaryRgb, 0.72)} 76%,`,
    `${rgbaStr(secondaryRgb, 0.34)} 90%,`,
    `${rgbaStr(primaryRgb, 0)} 100%)`,
  ].join(' ');

  return {
    gasSymbol: primary.gas,
    gasName,
    percent: primary.percent,
    color,
    secondaryColor,
    mixBlendMode: 'color',
    rimMixBlendMode: 'screen',
    discTintCss,
    rimAuraCss,
    spectralLabel: `${primary.gas} ${gasName} (${Math.round(primary.percent)}%)`,
  };
}

type InspectTabId = 'atmosphere' | 'historical' | 'modules';

function formatPressureReading(baseBar: number, fallback: string, liveDeltaFactor: number): string {
  if (baseBar <= 0) return fallback;
  const liveBar = Math.max(0.0001, baseBar * (1 + liveDeltaFactor * 0.008));
  if (liveBar >= 100) return `${Math.round(liveBar).toLocaleString()} bar`;
  if (liveBar >= 1) return `${liveBar.toFixed(2)} bar`;
  return `${liveBar.toFixed(4)} bar`;
}

export function SolarPlanetInspectCard({
  planet,
  hubMeta,
  hubApps,
  selectedAppIds,
  appMap,
  orbitScale,
  orbitalVelocityMultiplier,
  orbitalInclinationDeg,
  liveTelemetry,
  atmosphericScattering,
  onToggleAtmosphericScattering,
  onClose,
  onCyclePlanet,
  onReturnToOverview,
}: SolarPlanetInspectCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<InspectTabId>('atmosphere');
  const [selectedGasSymbol, setSelectedGasSymbol] = useState<string>(
    planet.atmosphere.composition[0]?.gas ?? '',
  );
  const [selectedEpochId, setSelectedEpochId] = useState<string>('live');

  useEffect(() => {
    setSelectedGasSymbol(planet.atmosphere.composition[0]?.gas ?? '');
  }, [planet.hubId, planet.atmosphere.composition]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const tween = gsap.fromTo(
      el,
      { opacity: 0, y: 12, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power2.out', clearProps: 'transform' },
    );
    return () => {
      tween.kill();
    };
  }, [planet.hubId]);

  const scaledAu = planet.auValue * orbitScale;
  const jitterPct = Math.round((orbitScale - 1) * 100);
  const jitterLabel =
    jitterPct === 0 ? 'Nominal' : `${jitterPct > 0 ? '+' : ''}${jitterPct}% jitter`;
  const effectiveInclinationDeg = orbitalInclinationDeg * planet.tiltWeight;
  const effectiveSimKmS =
    planet.orbitalStats.meanVelocityKmS *
    (orbitalVelocityMultiplier / Math.pow(orbitScale, 0.5));

  // Real-time solar illumination & thermal modulation
  const phaseWave = liveTelemetry?.atmoFluxWave ?? 0;
  const illumPct = liveTelemetry?.solarIlluminationPct ?? 62;
  const illumNorm = illumPct / 100;
  const dayNightActive = liveTelemetry?.dayNightCycleActive ?? false;
  const liveThermalOffset = (illumNorm - 0.5) * planet.atmosphere.dayNightDeltaC * (dayNightActive ? 0.55 : 0.25);
  const liveTempC = Math.round(planet.atmosphere.meanTempC + liveThermalOffset + Math.sin(phaseWave) * 1.4);
  const liveTempK = Math.max(3, liveTempC + 273);
  const inverseSquareFactor = 1 / Math.max(0.25, orbitScale * orbitScale);
  const liveFluxWm2 =
    planet.atmosphere.baseFluxWm2 * inverseSquareFactor * (0.72 + illumNorm * 0.56);

  // Normalized real-time gas composition (keeps sum = 100.0% while showing micro-oscillations)
  const liveGasReadings = useMemo(() => {
    const raw = planet.atmosphere.composition.map((item, idx) => {
      const drift =
        Math.sin(phaseWave * (1.1 + idx * 0.45) + idx * 1.7) *
        item.volatility *
        (0.65 + illumNorm * 0.55);
      const val = Math.max(0.05, item.percent + drift);
      return { ...item, liveVal: val, delta: val - item.percent };
    });
    const sum = raw.reduce((acc, r) => acc + r.liveVal, 0) || 100;
    return raw.map((r) => {
      const pct = (r.liveVal / sum) * 100;
      const ppm = Math.round(pct * 10_000);
      const partialBar =
        planet.atmosphere.pressureBarNum > 0
          ? (planet.atmosphere.pressureBarNum * pct) / 100
          : 0;
      return {
        ...r,
        livePercent: pct,
        ppm,
        partialBar,
      };
    });
  }, [planet.atmosphere.composition, planet.atmosphere.pressureBarNum, phaseWave, illumNorm]);

  const activeGas =
    liveGasReadings.find((g) => g.gas === selectedGasSymbol) ?? liveGasReadings[0];

  const scatteringProfile = useMemo(
    () =>
      buildAtmosphericScatteringProfile(
        planet,
        liveGasReadings.map((g) => ({
          gas: g.gas,
          percent: g.livePercent,
          color: g.color,
        })),
      ),
    [planet, liveGasReadings],
  );

  const primaryGasProfile = useMemo(
    () =>
      getPrimaryGasMixBlendProfile(
        planet,
        liveGasReadings.map((g) => ({
          gas: g.gas,
          percent: g.livePercent,
          color: g.color,
        })),
      ),
    [planet, liveGasReadings],
  );

  const atmosphericRadarData = useMemo(() => {
    const bySymbol = new Map<
      string,
      { symbol: string; name: string; percent: number; color: string; ppm: number }
    >();

    const upsert = (symbol: string, pct: number, color: string) => {
      const cleanPct = Math.max(0, Math.min(100, pct));
      const existing = bySymbol.get(symbol);
      const name = GAS_SPECTRAL_DIRECTORY[symbol]?.name ?? symbol;
      if (existing) {
        existing.percent += cleanPct;
        existing.ppm = Math.round(existing.percent * 10_000);
      } else {
        bySymbol.set(symbol, {
          symbol,
          name,
          percent: cleanPct,
          color,
          ppm: Math.round(cleanPct * 10_000),
        });
      }
    };

    liveGasReadings.forEach((g) => {
      if (g.gas === 'Ar/CO₂') {
        upsert('Ar', g.livePercent * 0.93, '#C084FC');
        upsert('CO₂', g.livePercent * 0.07, '#FF894F');
      } else if (g.gas === 'CH₄/NH₃') {
        upsert('CH₄', g.livePercent, '#4ADEB5');
      } else {
        upsert(g.gas, g.livePercent, GAS_SPECTRAL_DIRECTORY[g.gas]?.tintHex ?? g.color);
      }
    });

    const canonicalBaseline = ['N₂', 'O₂', 'Ar', 'CO₂', 'H₂', 'He'];
    for (const sym of canonicalBaseline) {
      if (bySymbol.size >= 6) break;
      if (!bySymbol.has(sym)) {
        upsert(sym, 0, GAS_SPECTRAL_DIRECTORY[sym]?.tintHex ?? '#97C4FF');
      }
    }

    const orderPriority = ['N₂', 'O₂', 'Ar', 'CO₂', 'H₂', 'He', 'CH₄', 'Na', 'SO₂'];
    return Array.from(bySymbol.values())
      .sort((a, b) => {
        const ai = orderPriority.indexOf(a.symbol);
        const bi = orderPriority.indexOf(b.symbol);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      })
      .slice(0, 6)
      .map((entry) => ({
        ...entry,
        percentRounded: Number(entry.percent.toFixed(2)),
        isPrimary: entry.symbol === primaryGasProfile.gasSymbol,
      }));
  }, [liveGasReadings, primaryGasProfile.gasSymbol]);

  // Historical + Live epoch series for interactive archive & SVG orbital drift chart
  const epochRecords: PlanetHistoricalOrbitEpoch[] = useMemo(() => {
    const liveEpoch: PlanetHistoricalOrbitEpoch = {
      epochId: 'live',
      epochLabel: 'Live Sim',
      ageLabel: `${(liveTelemetry?.revolutions ?? 0).toFixed(2)} rev`,
      au: scaledAu,
      eccentricity: planet.eccentricity,
      inclinationDeg: effectiveInclinationDeg,
      velocityKmS: effectiveSimKmS,
      notes:
        jitterPct === 0
          ? `Real-time Keplerian state at phase ${Math.round(liveTelemetry?.orbitalPhaseDeg ?? 0)}° true anomaly.`
          : `Active procedural ±15% jitter (${jitterLabel}) at phase ${Math.round(liveTelemetry?.orbitalPhaseDeg ?? 0)}° true anomaly.`,
    };
    return [...planet.historicalOrbits, liveEpoch];
  }, [
    planet.historicalOrbits,
    planet.eccentricity,
    scaledAu,
    effectiveInclinationDeg,
    effectiveSimKmS,
    jitterPct,
    jitterLabel,
    liveTelemetry,
  ]);

  const selectedEpoch =
    epochRecords.find((e) => e.epochId === selectedEpochId) ??
    epochRecords[epochRecords.length - 1];
  const selectedPerihelion = selectedEpoch.au * (1 - selectedEpoch.eccentricity);
  const selectedAphelion = selectedEpoch.au * (1 + selectedEpoch.eccentricity);

  // SVG chart coordinates across epochs
  const chartPoints = useMemo(() => {
    const width = 264;
    const height = 64;
    const padX = 18;
    const padY = 10;
    const minAu = Math.min(...epochRecords.map((e) => e.au)) * 0.92;
    const maxAu = Math.max(...epochRecords.map((e) => e.au)) * 1.08;
    const auSpan = Math.max(0.05, maxAu - minAu);
    const maxEcc = Math.max(0.14, ...epochRecords.map((e) => e.eccentricity * 1.18));

    return epochRecords.map((ep, idx) => {
      const x =
        epochRecords.length <= 1
          ? width / 2
          : padX + (idx / (epochRecords.length - 1)) * (width - padX * 2);
      const yAu =
        height - padY - ((ep.au - minAu) / auSpan) * (height - padY * 2);
      const yEcc =
        height - padY - (ep.eccentricity / maxEcc) * (height - padY * 2);
      return { ep, x, yAu, yEcc };
    });
  }, [epochRecords]);

  const auPathD = chartPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.yAu.toFixed(1)}`)
    .join(' ');
  const eccPathD = chartPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.yEcc.toFixed(1)}`)
    .join(' ');

  return (
    <aside
      ref={cardRef}
      role="dialog"
      aria-label={`Inspect Planet: HUB ${hubMeta.num} ${hubMeta.label}`}
      data-qa="solar-planet-inspect-card"
      style={{
        backgroundColor: 'var(--solar-bg-panel)',
        borderColor: 'var(--solar-border-strong)',
        boxShadow: 'var(--solar-shadow-glow)',
        color: 'var(--solar-fg-primary)',
      }}
      className="solar-map-scope absolute top-[62px] right-3 z-30 w-[calc(100%-24px)] max-w-[356px] max-h-[calc(100%-178px)] overflow-y-auto rounded-[8px] border p-3.5"
    >
      {/* Header: Planet Identity + Cycle + Close */}
      <div
        style={{ borderColor: 'var(--solar-border-subtle)' }}
        className="flex items-start justify-between gap-2 pb-2.5 border-b"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Miniature Planet Preview with Primary-Gas mix-blend-mode Chromatic Overlay + Optional Scattering */}
          <div className="relative w-8 h-8 shrink-0 grid place-items-center" aria-hidden="true">
            {atmosphericScattering && (
              <span
                data-qa="solar-inspect-mini-scattering-glow"
                style={{
                  background: scatteringProfile.orbGlowCss,
                  mixBlendMode: scatteringProfile.mixBlendMode,
                  opacity: Math.min(1, 0.72 + illumNorm * 0.28),
                }}
                className="pointer-events-none absolute -inset-2.5 rounded-full transition-opacity duration-200"
              />
            )}
            <span
              style={{
                background: `radial-gradient(circle at 34% 32%, ${planet.accentHex} 0%, ${planet.baseHex} 58%, #040A16 100%)`,
                borderColor: atmosphericScattering
                  ? scatteringProfile.primaryColor
                  : primaryGasProfile.color,
                boxShadow: atmosphericScattering
                  ? `0 0 12px ${scatteringProfile.primaryColor}88`
                  : `0 0 8px ${primaryGasProfile.color}55`,
              }}
              className="relative z-10 inline-block w-6 h-6 rounded-full border transition-shadow duration-200 overflow-hidden"
            >
              <span
                data-qa="solar-inspect-mini-primary-gas-overlay"
                style={{
                  background: primaryGasProfile.discTintCss,
                  mixBlendMode: primaryGasProfile.mixBlendMode,
                  opacity: 0.78,
                }}
                className="pointer-events-none absolute inset-0 rounded-full transition-all duration-300"
              />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.06em] uppercase text-[var(--solar-accent-amber-fg)] font-bold">
              <span>Inspect Planet · HUB {hubMeta.num}</span>
            </div>
            <h4 className="text-[14px] font-bold text-[var(--solar-fg-primary)] leading-tight mt-0.5 truncate">
              {hubMeta.label}
            </h4>
            <p className="text-[10px] font-mono text-[var(--solar-fg-soft)] mt-0.5 leading-snug truncate">
              {planet.celestialAnalog} · {planet.celestialTier}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onCyclePlanet(-1)}
            aria-label="Inspect previous planet"
            title="Previous planet"
            style={{
              backgroundColor: 'var(--solar-bg-chip)',
              borderColor: 'var(--solar-border-subtle)',
              color: 'var(--solar-fg-blue)',
            }}
            className="grid place-items-center w-6 h-6 rounded-[5px] border cursor-pointer transition-colors hover:text-white hover:border-[var(--solar-accent-blue)]"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onCyclePlanet(1)}
            aria-label="Inspect next planet"
            title="Next planet"
            style={{
              backgroundColor: 'var(--solar-bg-chip)',
              borderColor: 'var(--solar-border-subtle)',
              color: 'var(--solar-fg-blue)',
            }}
            className="grid place-items-center w-6 h-6 rounded-[5px] border cursor-pointer transition-colors hover:text-white hover:border-[var(--solar-accent-blue)]"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close planet inspection card"
            title="Close inspector (Esc)"
            style={{
              backgroundColor: 'var(--solar-bg-chip)',
              borderColor: 'var(--solar-border-subtle)',
              color: 'var(--solar-fg-blue)',
            }}
            className="grid place-items-center w-6 h-6 rounded-[5px] border cursor-pointer transition-colors hover:text-white hover:border-[var(--solar-accent-amber)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real-Time Telemetry Status Strip */}
      <div
        style={{
          backgroundColor: 'var(--solar-bg-strip)',
          borderColor: 'var(--solar-border-subtle)',
        }}
        className="mt-2.5 rounded-[6px] border px-2.5 py-1.5 flex items-center justify-between gap-2 font-mono text-[10px] tabular-nums"
      >
        <span className="inline-flex items-center gap-1.5 text-[var(--solar-fg-bright)] font-semibold">
          {dayNightActive ? (
            <SunMoon className="w-3 h-3 text-[var(--solar-accent-amber-fg)] shrink-0" />
          ) : (
            <Sun className="w-3 h-3 text-[var(--solar-accent-amber-fg)] shrink-0" />
          )}
          <span>Sunlit {Math.round(illumPct)}%</span>
          <span className="text-[var(--solar-fg-blue-muted)] font-normal">
            ({liveTelemetry?.localSolarHour ?? '12:00'} solar)
          </span>
        </span>
        <span className="text-[var(--solar-accent-amber-fg)] font-semibold">
          ν {Math.round(liveTelemetry?.orbitalPhaseDeg ?? 0)}° · {(liveTelemetry?.revolutions ?? 0).toFixed(2)} rev
        </span>
      </div>

      {/* Atmospheric Scattering CSS mix-blend-mode Toggle */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggleAtmosphericScattering}
          aria-pressed={atmosphericScattering}
          data-qa="solar-inspect-atmospheric-scattering-toggle"
          style={
            atmosphericScattering
              ? {
                  backgroundColor: 'rgba(104, 228, 239, 0.16)',
                  borderColor: scatteringProfile.primaryColor,
                  color: 'var(--solar-fg-bright)',
                }
              : {
                  backgroundColor: 'var(--solar-bg-chip)',
                  borderColor: 'var(--solar-border-subtle)',
                  color: 'var(--solar-fg-blue)',
                }
          }
          className="flex-1 inline-flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[6px] border font-mono text-[10px] cursor-pointer transition-colors hover:border-[var(--solar-accent-blue)] hover:text-white"
        >
          <span className="inline-flex items-center gap-1.5 font-semibold whitespace-nowrap shrink-0">
            <Contrast
              className="w-3 h-3 shrink-0"
              style={{ color: atmosphericScattering ? scatteringProfile.primaryColor : undefined }}
              strokeWidth={1.85}
            />
            <span>Atmospheric Scattering</span>
          </span>
          <span
            className="text-[9px] tabular-nums truncate"
            style={{
              color: atmosphericScattering
                ? scatteringProfile.primaryColor
                : 'var(--solar-fg-soft)',
            }}
          >
            {atmosphericScattering
              ? `${scatteringProfile.label} · ${scatteringProfile.dominantSummary}`
              : 'Off'}
          </span>
        </button>
      </div>

      {/* Interactive Mode Switcher Tabs (.solar-map-scope tokens) */}
      <div
        role="tablist"
        aria-label="Planetary telemetry sections"
        style={{
          backgroundColor: 'var(--solar-bg-strip)',
          borderColor: 'var(--solar-border-subtle)',
        }}
        className="mt-2.5 grid grid-cols-3 gap-1 p-1 rounded-[6px] border font-mono text-[10px]"
      >
        {(
          [
            { id: 'atmosphere', label: 'Atmosphere', Icon: Wind },
            { id: 'historical', label: 'Orbits Archive', Icon: History },
            { id: 'modules', label: `Hub (${hubApps.length})`, Icon: Globe },
          ] as { id: InspectTabId; label: string; Icon: React.ElementType }[]
        ).map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-qa={`solar-inspect-tab-${id}`}
              onClick={() => setActiveTab(id)}
              style={
                isActive
                  ? {
                      backgroundColor: 'var(--solar-accent-amber-bg)',
                      borderColor: 'var(--solar-accent-amber)',
                      color: 'var(--solar-accent-amber-fg)',
                    }
                  : {
                      backgroundColor: 'transparent',
                      borderColor: 'transparent',
                      color: 'var(--solar-fg-blue)',
                    }
              }
              className="inline-flex items-center justify-center gap-1 py-1 px-1.5 rounded-[5px] border font-semibold cursor-pointer transition-colors hover:text-white whitespace-nowrap"
            >
              <Icon className="w-3 h-3 shrink-0" strokeWidth={1.85} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: REAL-TIME ATMOSPHERIC COMPOSITION */}
      {activeTab === 'atmosphere' && (
        <div
          role="tabpanel"
          aria-label="Real-time atmospheric composition"
          className="pt-2.5 pb-2.5 space-y-2.5"
        >
          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-[0.06em] text-[var(--solar-fg-blue)]">
            <span className="inline-flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-[#68E4EF]" strokeWidth={1.85} />
              Live Atmospheric Composition
            </span>
            <span className="text-[var(--solar-fg-soft)] normal-case font-medium">
              Click species
            </span>
          </div>

          {/* Segmented Live Composition Bar */}
          <div className="space-y-2">
            <div
              style={{
                backgroundColor: 'var(--solar-bg-select)',
                borderColor: 'var(--solar-border-subtle)',
              }}
              className="flex h-2.5 w-full overflow-hidden rounded-[4px] border"
              role="img"
              aria-label={`Live atmospheric composition: ${liveGasReadings
                .map((g) => `${g.gas} ${g.livePercent.toFixed(1)}%`)
                .join(', ')}`}
            >
              {liveGasReadings.map((item) => {
                const isSelected = activeGas?.gas === item.gas;
                return (
                  <button
                    key={item.gas}
                    type="button"
                    onClick={() => setSelectedGasSymbol(item.gas)}
                    style={{
                      width: `${item.livePercent}%`,
                      backgroundColor: item.color,
                      opacity: isSelected ? 1 : 0.72,
                    }}
                    className="h-full cursor-pointer transition-opacity first:rounded-l-[3px] last:rounded-r-[3px]"
                    title={`Inspect ${item.gas}: ${item.livePercent.toFixed(2)}%`}
                    aria-label={`Select ${item.gas} atmospheric species`}
                  />
                );
              })}
            </div>

            {/* Interactive Gas Species Selector */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono tabular-nums">
              {liveGasReadings.map((item) => {
                const isSelected = activeGas?.gas === item.gas;
                return (
                  <button
                    key={item.gas}
                    type="button"
                    onClick={() => setSelectedGasSymbol(item.gas)}
                    aria-pressed={isSelected}
                    style={
                      isSelected
                        ? {
                            backgroundColor: 'var(--solar-accent-amber-bg)',
                            borderColor: 'var(--solar-accent-amber)',
                            color: 'var(--solar-accent-amber-fg)',
                          }
                        : {
                            backgroundColor: 'var(--solar-bg-select)',
                            borderColor: 'var(--solar-border-subtle)',
                            color: 'var(--solar-fg-bright)',
                          }
                    }
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[5px] border cursor-pointer transition-colors hover:border-[var(--solar-accent-blue)]"
                  >
                    <span
                      style={{ backgroundColor: item.color }}
                      className="inline-block w-2 h-2 rounded-[2px] shrink-0"
                      aria-hidden="true"
                    />
                    <span className="font-bold">{item.gas}</span>
                    <span className="text-[var(--solar-fg-soft)]">
                      {item.livePercent.toFixed(2)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recharts Radial Radar Chart — Atmospheric Composition Profile */}
          <div
            data-qa="solar-inspect-atmospheric-radar"
            style={{
              backgroundColor: 'var(--solar-bg-select)',
              borderColor: 'var(--solar-border-mid)',
            }}
            className="rounded-[6px] border px-2.5 pt-2 pb-1.5"
          >
            <div className="flex items-center justify-between gap-2 text-[9px] font-mono mb-1">
              <span className="uppercase tracking-[0.06em] font-bold text-[var(--solar-fg-blue)]">
                Radial Spectral Profile
              </span>
              <span
                className="inline-flex items-center gap-1.5 tabular-nums font-semibold truncate"
                style={{ color: primaryGasProfile.color }}
              >
                <span
                  style={{ backgroundColor: primaryGasProfile.color }}
                  className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                  aria-hidden="true"
                />
                Primary: {primaryGasProfile.spectralLabel}
              </span>
            </div>

            <div className="w-full h-[198px]" aria-label={`Atmospheric composition radar chart for ${hubMeta.label}`}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="51%"
                  outerRadius="58%"
                  data={atmosphericRadarData}
                >
                  <defs>
                    <linearGradient
                      id={`solar-atmo-radar-fill-${planet.hubId}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={primaryGasProfile.color} stopOpacity={0.56} />
                      <stop offset="100%" stopColor="var(--solar-accent-blue)" stopOpacity={0.14} />
                    </linearGradient>
                  </defs>
                  <PolarGrid
                    gridType="polygon"
                    stroke="var(--solar-border-mid)"
                    strokeOpacity={0.9}
                  />
                  <PolarAngleAxis
                    dataKey="symbol"
                    tick={(tickProps) => {
                      const raw = tickProps as unknown as {
                        x?: number;
                        y?: number;
                        cx?: number;
                        cy?: number;
                        payload?: { value?: string };
                        textAnchor?: 'start' | 'middle' | 'end' | 'inherit';
                      };
                      const x = Number(raw.x ?? 0);
                      const y = Number(raw.y ?? 0);
                      const cx = typeof raw.cx === 'number' ? raw.cx : x;
                      const cy = typeof raw.cy === 'number' ? raw.cy : y;
                      const value = raw.payload?.value ?? '';
                      const textAnchor = raw.textAnchor ?? 'middle';
                      const dx = x - cx;
                      const dy = y - cy;
                      const dist = Math.hypot(dx, dy);
                      const nx = dist > 0.5 ? x + (dx / dist) * 8 : x;
                      const ny = dist > 0.5 ? y + (dy / dist) * 8 : y;
                      const datum = atmosphericRadarData.find((d) => d.symbol === value);
                      const isPrimary = datum?.isPrimary ?? false;
                      return (
                        <g transform={`translate(${nx.toFixed(1)},${ny.toFixed(1)})`}>
                          <text
                            x={0}
                            y={-2}
                            textAnchor={textAnchor}
                            fill={
                              isPrimary
                                ? 'var(--solar-accent-amber-fg)'
                                : 'var(--solar-fg-bright)'
                            }
                            fontSize={10}
                            fontWeight={isPrimary ? 700 : 600}
                            fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                          >
                            {value}
                          </text>
                          <text
                            x={0}
                            y={9}
                            textAnchor={textAnchor}
                            fill={
                              datum && datum.percentRounded > 0
                                ? 'var(--solar-fg-blue)'
                                : 'var(--solar-fg-blue-muted)'
                            }
                            fontSize={8.5}
                            fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                          >
                            {datum ? `${datum.percentRounded.toFixed(datum.percentRounded >= 10 ? 0 : 1)}%` : '0%'}
                          </text>
                        </g>
                      );
                    }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tickCount={5}
                    stroke="var(--solar-border-subtle)"
                    tick={{
                      fill: 'var(--solar-fg-blue-muted)',
                      fontSize: 8,
                    }}
                    tickFormatter={(val: number) => `${val}%`}
                  />
                  <Radar
                    name={hubMeta.label}
                    dataKey="percentRounded"
                    stroke={primaryGasProfile.color}
                    strokeWidth={2}
                    fill={`url(#solar-atmo-radar-fill-${planet.hubId})`}
                    fillOpacity={1}
                    dot={{
                      r: 3,
                      fill: primaryGasProfile.color,
                      stroke: 'var(--solar-bg-void)',
                      strokeWidth: 1.5,
                    }}
                    activeDot={{
                      r: 4.5,
                      fill: 'var(--solar-accent-amber-fg)',
                      stroke: primaryGasProfile.color,
                      strokeWidth: 1.5,
                    }}
                    isAnimationActive={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const entry = payload[0]?.payload as
                        | (typeof atmosphericRadarData)[number]
                        | undefined;
                      if (!entry) return null;
                      return (
                        <div
                          style={{
                            backgroundColor: 'var(--solar-bg-panel)',
                            borderColor: 'var(--solar-border-strong)',
                            color: 'var(--solar-fg-primary)',
                            boxShadow: 'var(--solar-shadow-card)',
                          }}
                          className="rounded-[6px] border px-2.5 py-1.5 font-mono text-[10px] tabular-nums"
                        >
                          <div className="flex items-center gap-1.5 font-bold">
                            <span
                              style={{ backgroundColor: entry.color }}
                              className="inline-block w-2 h-2 rounded-full shrink-0"
                            />
                            <span>
                              {entry.name} ({entry.symbol})
                            </span>
                          </div>
                          <div className="text-[var(--solar-accent-amber-fg)] mt-0.5 font-semibold">
                            {entry.percent.toFixed(2)}% · {entry.ppm.toLocaleString()} ppm
                          </div>
                        </div>
                      );
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Selected Gas Real-Time Spectral Readout */}
          {activeGas && (
            <div
              style={{
                backgroundColor: 'var(--solar-bg-select)',
                borderColor: 'var(--solar-border-mid)',
              }}
              className="rounded-[6px] border p-2.5 space-y-1.5 font-mono"
            >
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <span className="inline-flex items-center gap-1.5 font-bold text-[var(--solar-fg-primary)]">
                  <span
                    style={{ backgroundColor: activeGas.color }}
                    className="inline-block w-2 h-2 rounded-full"
                    aria-hidden="true"
                  />
                  {activeGas.gas} Spectral Telemetry
                </span>
                <span
                  className="tabular-nums font-semibold"
                  style={{
                    color:
                      activeGas.delta >= 0
                        ? 'var(--solar-accent-amber-fg)'
                        : 'var(--solar-fg-blue)',
                  }}
                >
                  {activeGas.delta >= 0 ? '+' : ''}
                  {activeGas.delta.toFixed(3)}% Δ
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[10px] tabular-nums">
                <div>
                  <div className="text-[9px] uppercase text-[var(--solar-fg-blue-muted)]">
                    Conc.
                  </div>
                  <div className="font-semibold text-[var(--solar-fg-primary)]">
                    {activeGas.ppm.toLocaleString()} ppm
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-[var(--solar-fg-blue-muted)]">
                    Molar Mass
                  </div>
                  <div className="font-semibold text-[var(--solar-fg-primary)]">
                    {activeGas.molarMass}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-[var(--solar-fg-blue-muted)]">
                    Partial P
                  </div>
                  <div className="font-semibold text-[var(--solar-fg-primary)]">
                    {activeGas.partialBar > 0
                      ? activeGas.partialBar >= 1
                        ? `${activeGas.partialBar.toFixed(1)} bar`
                        : `${activeGas.partialBar.toFixed(3)} bar`
                      : 'Trace'}
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-[var(--solar-fg-soft)] pt-0.5 border-t border-[var(--solar-border-subtle)]">
                Band: {activeGas.spectralBand}
              </div>
            </div>
          )}

          {/* Live Surface Pressure, Dynamic Day/Night Thermal & Solar Flux */}
          <div className="grid grid-cols-2 gap-2">
            <div
              style={{
                backgroundColor: 'var(--solar-bg-select)',
                borderColor: 'var(--solar-border-subtle)',
              }}
              className="rounded-[6px] border px-2 py-1.5"
            >
              <div className="flex items-center gap-1 text-[9px] font-mono uppercase text-[var(--solar-fg-blue-muted)]">
                <Gauge className="w-2.5 h-2.5" />
                <span>Baric Pressure</span>
              </div>
              <div className="text-[11px] font-mono font-semibold text-[var(--solar-fg-primary)] tabular-nums mt-0.5">
                {formatPressureReading(
                  planet.atmosphere.pressureBarNum,
                  planet.atmosphere.surfacePressure,
                  Math.sin(phaseWave),
                )}
              </div>
              <div className="text-[9px] font-mono text-[var(--solar-fg-soft)] tabular-nums">
                Flux: {liveFluxWm2 >= 10 ? `${Math.round(liveFluxWm2).toLocaleString()} W/m²` : `${liveFluxWm2.toFixed(2)} W/m²`}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--solar-bg-select)',
                borderColor: 'var(--solar-border-subtle)',
              }}
              className="rounded-[6px] border px-2 py-1.5"
            >
              <div className="flex items-center gap-1 text-[9px] font-mono uppercase text-[var(--solar-fg-blue-muted)]">
                <Thermometer className="w-2.5 h-2.5" />
                <span>Live Surface Temp</span>
              </div>
              <div className="text-[11px] font-mono font-semibold text-[var(--solar-fg-primary)] tabular-nums mt-0.5">
                {liveTempC} °C ({liveTempK} K)
              </div>
              <div className="text-[9px] font-mono text-[var(--solar-accent-amber-fg)] tabular-nums">
                Δ Day/Night ±{Math.round(planet.atmosphere.dayNightDeltaC / 2)} K
              </div>
            </div>
          </div>

          <p className="text-[10px] font-mono text-[var(--solar-fg-soft)] leading-relaxed">
            {planet.atmosphere.weatherSummary}
          </p>
        </div>
      )}

      {/* TAB 2: HISTORICAL ORBITAL DATA & SECULAR DRIFT */}
      {activeTab === 'historical' && (
        <div
          role="tabpanel"
          aria-label="Historical orbital data and live comparison"
          className="pt-2.5 pb-2.5 space-y-2.5 font-mono"
        >
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--solar-fg-blue)]">
            <span className="inline-flex items-center gap-1.5">
              <Orbit className="w-3 h-3 text-[var(--solar-accent-amber)]" strokeWidth={1.85} />
              Historical Orbital Archive
            </span>
            <span className="text-[var(--solar-accent-amber-fg)] normal-case font-semibold tabular-nums">
              {jitterLabel}
            </span>
          </div>

          {/* Interactive Epoch Selector */}
          <div className="grid grid-cols-4 gap-1 text-[9px]">
            {epochRecords.map((ep) => {
              const active = selectedEpoch.epochId === ep.epochId;
              return (
                <button
                  key={ep.epochId}
                  type="button"
                  onClick={() => setSelectedEpochId(ep.epochId)}
                  aria-pressed={active}
                  style={
                    active
                      ? {
                          backgroundColor: 'var(--solar-accent-amber-bg)',
                          borderColor: 'var(--solar-accent-amber)',
                          color: 'var(--solar-accent-amber-fg)',
                        }
                      : {
                          backgroundColor: 'var(--solar-bg-select)',
                          borderColor: 'var(--solar-border-subtle)',
                          color: 'var(--solar-fg-blue)',
                        }
                  }
                  className="px-1.5 py-1 rounded-[5px] border font-semibold cursor-pointer transition-colors hover:text-white text-center truncate"
                  title={`${ep.epochLabel} (${ep.ageLabel})`}
                >
                  {ep.epochLabel}
                </button>
              );
            })}
          </div>

          {/* Crisp SVG Secular Drift Trendline (Semi-Major Axis AU & Eccentricity e) */}
          <div
            style={{
              backgroundColor: 'var(--solar-bg-select)',
              borderColor: 'var(--solar-border-subtle)',
            }}
            className="rounded-[6px] border p-2 space-y-1"
          >
            <div className="flex items-center justify-between text-[9px] text-[var(--solar-fg-soft)]">
              <span className="inline-flex items-center gap-1">
                <span
                  style={{ backgroundColor: `var(${planet.orbitColorToken})` }}
                  className="inline-block w-2.5 h-[2px] rounded-full"
                />
                Orbit Radius (AU)
              </span>
              <span className="inline-flex items-center gap-1">
                <span
                  style={{ backgroundColor: 'var(--solar-accent-amber)' }}
                  className="inline-block w-2.5 h-[2px] rounded-full"
                />
                Eccentricity (e)
              </span>
            </div>

            <svg
              viewBox="0 0 264 64"
              className="w-full h-[64px] overflow-visible"
              role="img"
              aria-label={`Historical semi-major axis and eccentricity trend across ${epochRecords.length} epochs`}
            >
              <line
                x1="12"
                y1="54"
                x2="252"
                y2="54"
                stroke="rgba(151, 196, 255, 0.22)"
                strokeDasharray="2 3"
              />
              <line
                x1="12"
                y1="20"
                x2="252"
                y2="20"
                stroke="rgba(151, 196, 255, 0.14)"
                strokeDasharray="2 3"
              />
              <path
                d={eccPathD}
                fill="none"
                stroke="#FFB563"
                strokeWidth="1.5"
                strokeDasharray="3 2"
                strokeOpacity="0.88"
              />
              <path
                d={auPathD}
                fill="none"
                stroke={`var(${planet.orbitColorToken})`}
                strokeWidth="2"
              />
              {chartPoints.map(({ ep, x, yAu, yEcc }) => {
                const isSelected = ep.epochId === selectedEpoch.epochId;
                return (
                  <g
                    key={ep.epochId}
                    onClick={() => setSelectedEpochId(ep.epochId)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={x}
                      cy={yEcc}
                      r={isSelected ? 3.2 : 2.2}
                      fill="#FFB563"
                    />
                    <circle
                      cx={x}
                      cy={yAu}
                      r={isSelected ? 4.4 : 2.8}
                      fill={`var(${planet.orbitColorToken})`}
                      stroke={isSelected ? '#FFFFFF' : '#040A16'}
                      strokeWidth="1.3"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Selected Epoch Telemetry Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div
              style={{
                backgroundColor: 'var(--solar-bg-select)',
                borderColor: 'var(--solar-border-subtle)',
              }}
              className="rounded-[6px] border px-2 py-1.5"
            >
              <div className="text-[9px] uppercase text-[var(--solar-fg-blue-muted)]">
                Semi-Major Axis
              </div>
              <div className="text-[11px] font-semibold text-[var(--solar-fg-primary)] tabular-nums mt-0.5">
                {selectedEpoch.au.toFixed(2)} AU
              </div>
              <div className="text-[9px] text-[var(--solar-fg-soft)] tabular-nums">
                {selectedEpoch.ageLabel}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--solar-bg-select)',
                borderColor: 'var(--solar-border-subtle)',
              }}
              className="rounded-[6px] border px-2 py-1.5"
            >
              <div className="text-[9px] uppercase text-[var(--solar-fg-blue-muted)]">
                Orbital Velocity
              </div>
              <div className="text-[11px] font-semibold text-[var(--solar-fg-primary)] tabular-nums mt-0.5">
                {selectedEpoch.velocityKmS.toFixed(1)} km/s
              </div>
              <div className="text-[9px] text-[var(--solar-accent-amber-fg)] tabular-nums">
                Period: {planet.orbitPeriod}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--solar-bg-select)',
                borderColor: 'var(--solar-border-subtle)',
              }}
              className="rounded-[6px] border px-2 py-1.5"
            >
              <div className="flex items-center justify-between gap-1 text-[9px] uppercase text-[var(--solar-fg-blue-muted)]">
                <span>Inclination &amp; e</span>
                <span
                  style={{ backgroundColor: `var(${planet.orbitColorToken})` }}
                  className="inline-block w-3 h-[2px] rounded-full shrink-0"
                  aria-hidden="true"
                />
              </div>
              <div className="text-[11px] font-semibold text-[var(--solar-fg-primary)] tabular-nums mt-0.5">
                {selectedEpoch.inclinationDeg.toFixed(1)}° · e={selectedEpoch.eccentricity.toFixed(3)}
              </div>
              <div className="text-[9px] text-[var(--solar-fg-soft)] tabular-nums">
                Axial Tilt {planet.orbitalStats.axialTiltDeg}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--solar-bg-select)',
                borderColor: 'var(--solar-border-subtle)',
              }}
              className="rounded-[6px] border px-2 py-1.5"
            >
              <div className="text-[9px] uppercase text-[var(--solar-fg-blue-muted)]">
                Peri / Aphelion
              </div>
              <div className="text-[11px] font-semibold text-[var(--solar-fg-primary)] tabular-nums mt-0.5">
                {selectedPerihelion.toFixed(2)}–{selectedAphelion.toFixed(2)} AU
              </div>
              <div className="text-[9px] text-[var(--solar-fg-soft)] tabular-nums">
                Esc: {planet.orbitalStats.escapeVelocityKmS.toFixed(1)} km/s
              </div>
            </div>
          </div>

          <p className="text-[10px] text-[var(--solar-fg-soft)] leading-relaxed">
            {selectedEpoch.notes}
          </p>
        </div>
      )}

      {/* TAB 3: ORBITING SOVEREIGN SPENTA HUB MODULES */}
      {activeTab === 'modules' && (
        <div
          role="tabpanel"
          aria-label="Orbiting Spenta hub modules"
          className="pt-2.5 pb-2.5 space-y-2.5"
        >
          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-[0.06em] text-[var(--solar-fg-blue)]">
            <span className="inline-flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-[#488EFF]" strokeWidth={1.85} />
              Orbiting Hub Modules ({hubApps.length})
            </span>
            <span className="text-[var(--solar-fg-blue-muted)]">
              {hubMeta.keyLayers.join('/')}
            </span>
          </div>

          <div className="space-y-1.5">
            {hubApps.map((app) => {
              const active = selectedAppIds.includes(app.id);
              return (
                <div
                  key={app.id}
                  style={
                    active
                      ? {
                          backgroundColor: 'var(--solar-accent-amber-bg)',
                          borderColor: 'var(--solar-accent-amber)',
                        }
                      : {
                          backgroundColor: 'var(--solar-bg-select)',
                          borderColor: 'var(--solar-border-subtle)',
                        }
                  }
                  className="rounded-[6px] border px-2.5 py-1.5 font-mono"
                >
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span
                      className="font-bold"
                      style={{
                        color: active
                          ? 'var(--solar-accent-amber-fg)'
                          : 'var(--solar-fg-bright)',
                      }}
                    >
                      {appMap[app.id]?.shortName ?? app.shortName}
                    </span>
                    <span className="text-[9px] uppercase text-[var(--solar-fg-blue-muted)]">
                      {active ? 'Active Moon' : app.hubId}
                    </span>
                  </div>
                  <p className="text-[9px] text-[var(--solar-fg-soft)] mt-0.5 leading-snug">
                    {app.tagline}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Persistent Footer Return Action */}
      <div
        style={{ borderColor: 'var(--solar-border-subtle)' }}
        className="pt-2 border-t flex items-center justify-between gap-2"
      >
        <div className="text-[9px] font-mono text-[var(--solar-fg-soft)] tabular-nums">
          g={planet.orbitalStats.surfaceGravity} · {planet.kmEquiv}
        </div>
        <button
          type="button"
          onClick={onReturnToOverview}
          style={{
            backgroundColor: 'var(--solar-bg-chip)',
            borderColor: 'var(--solar-border-mid)',
            color: 'var(--solar-fg-bright)',
          }}
          className="inline-flex items-center gap-1.5 px-2.5 h-[28px] rounded-[6px] border text-[10px] font-mono font-semibold cursor-pointer transition-colors hover:border-[var(--solar-accent-amber)] hover:text-white shrink-0"
        >
          <Compass className="w-3 h-3 text-[var(--solar-accent-amber-fg)]" />
          <span>Ecliptic View</span>
        </button>
      </div>
    </aside>
  );
}
