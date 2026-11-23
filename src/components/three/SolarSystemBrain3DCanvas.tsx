import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { Maximize2, Minimize2 } from 'lucide-react';
import { BRAIN_HUBS, SPENTA_APPS } from '../../data/spentaManifest';
import { useStack } from '../../store/StackContext';
import {
  GalaxyControlPanel,
  SolarConfigurationPreset,
} from './GalaxyControlPanel';
import {
  buildAtmosphericScatteringProfile,
  getPrimaryGasMixBlendProfile,
  InspectablePlanetSpec,
  LivePlanetInspectTelemetry,
  SolarPlanetInspectCard,
} from './SolarPlanetInspectCard';
import {
  CollisionMonitorSummary,
  createGravityWellFlashTexture,
  OrbitSampleBody,
  SolarOrbitCollisionMonitor,
} from './solarCollisionDetection';
import NeuralCoreTelemetryOverlay, {
  GravityWellInterferenceAlert,
  INITIAL_TELEMETRY_SNAPSHOT,
  NeuralCoreTelemetrySnapshot,
} from './NeuralCoreTelemetryOverlay';
import {
  OrbitalRingSummary,
  SolarOrbitLogEntry,
  SolarOrbitLogPanel,
} from './SolarOrbitLogPanel';

const SOLAR_ORBIT_LOG_STORAGE_KEY = 'spenta_solar_orbit_log_v1';
const MAX_SOLAR_ORBIT_LOG_ENTRIES = 60;

export interface SolarSystemBrain3DCanvasProps {
  compact?: boolean;
  polarity?: 'light' | 'dark';
  onSelectHub?: (hubId: string) => void;
  selectedHubId?: string | null;
  hubFocusNonce?: number;
  transitionFromSpiral?: boolean;
  onToggleAlternativeSystem?: () => void;
}

type SolarViewMode = 'overview' | 'ecliptic' | 'inner-core';

interface PlanetBlueprint extends InspectablePlanetSpec {
  orbitRadius: number;
  /** Signed direction & relative weight for dynamic 0°..45° Orbital Inclination scaling */
  tiltSignZ: 1 | -1;
  tiltSignX: 1 | -1;
  planetRadius: number;
  orbitSpeed: number;
  initialAngle: number;
  bandHex: string;
  hasRings?: boolean;
  ringColorHex?: string;
}

const DEFAULT_ORBITAL_VELOCITY = 1.0;
const DEFAULT_ORBITAL_INCLINATION_DEG = 6;
const DEFAULT_TIME_SCALE = 1.0;
const ORBIT_JITTER_RANGE = 0.15;
const STRESS_TEST_VELOCITY = 10.0;
const STRESS_RAMP_UP_SEC = 0.4;
const STRESS_HOLD_SEC = 2.8;
const STRESS_RAMP_DOWN_SEC = 1.2;
const STRESS_TOTAL_SEC = STRESS_RAMP_UP_SEC + STRESS_HOLD_SEC + STRESS_RAMP_DOWN_SEC;

const PLANET_BLUEPRINTS: PlanetBlueprint[] = [
  {
    hubId: 'healthcare',
    celestialTier: 'Inner Silicate · Clinical Core',
    celestialAnalog: 'Mercury-Class World',
    auValue: 0.39,
    auDistance: '0.39 AU',
    kmEquiv: '57.9M km eq.',
    orbitPeriod: '88 d cycle',
    orbitRadius: 3.1,
    eccentricity: 0.06,
    tiltSignZ: 1,
    tiltSignX: 1,
    tiltWeight: 1.0,
    planetRadius: 0.34,
    orbitSpeed: 0.56,
    initialAngle: 0.4,
    baseHex: '#10B981',
    bandHex: '#A7F3D0',
    accentHex: '#6FCB9F',
    orbitColorToken: '--solar-orbit-1',
    atmosphere: {
      composition: [
        { gas: 'O₂', percent: 42, color: '#68E4EF', molarMass: '32.0 g/mol', spectralBand: '760 nm O₂-A', volatility: 0.42 },
        { gas: 'Na', percent: 29, color: '#FFB563', molarMass: '23.0 g/mol', spectralBand: '589 nm Na-D', volatility: 0.65 },
        { gas: 'H₂', percent: 22, color: '#488EFF', molarMass: '2.02 g/mol', spectralBand: '121 nm Lyman-α', volatility: 0.38 },
        { gas: 'He', percent: 7, color: '#A7F3D0', molarMass: '4.00 g/mol', spectralBand: '58.4 nm He-I', volatility: 0.16 },
      ],
      surfacePressure: '< 10⁻¹⁴ bar (Exosphere)',
      pressureBarNum: 0,
      meanTemp: '167 °C (440 K)',
      meanTempC: 167,
      dayNightDeltaC: 590,
      baseFluxWm2: 9082,
      weatherSummary: 'Ultra-thin solar-wind sputtered exosphere with extreme 590 K day-night thermal swing across the terminator.',
    },
    orbitalStats: {
      meanVelocityKmS: 47.4,
      axialTiltDeg: '0.03°',
      surfaceGravity: '3.70 m/s²',
      escapeVelocityKmS: 4.3,
    },
    historicalOrbits: [
      {
        epochId: 'formation',
        epochLabel: '-100 Myr',
        ageLabel: 'Formation',
        au: 0.43,
        eccentricity: 0.145,
        inclinationDeg: 9.2,
        velocityKmS: 45.1,
        notes: 'Post-accretion silicate core locked inside high-eccentricity inner resonance.',
      },
      {
        epochId: 'migration',
        epochLabel: '-10 Myr',
        ageLabel: 'Secular Drift',
        au: 0.40,
        eccentricity: 0.095,
        inclinationDeg: 7.4,
        velocityKmS: 46.7,
        notes: 'Tidal damping circulars orbit toward current clinical inner boundary.',
      },
      {
        epochId: 'j2000',
        epochLabel: 'J2000.0',
        ageLabel: 'Reference',
        au: 0.39,
        eccentricity: 0.060,
        inclinationDeg: 6.0,
        velocityKmS: 47.4,
        notes: 'Baseline J2000 heliocentric ephemeris for HUB 01 Clinical Core.',
      },
    ],
  },
  {
    hubId: 'fintech',
    celestialTier: 'Golden Atmosphere · Settlement',
    celestialAnalog: 'Venus-Class Cloud World',
    auValue: 0.72,
    auDistance: '0.72 AU',
    kmEquiv: '108.2M km eq.',
    orbitPeriod: '225 d cycle',
    orbitRadius: 4.5,
    eccentricity: 0.03,
    tiltSignZ: -1,
    tiltSignX: 1,
    tiltWeight: 0.78,
    planetRadius: 0.44,
    orbitSpeed: 0.42,
    initialAngle: 1.9,
    baseHex: '#F59E0B',
    bandHex: '#FFE0BB',
    accentHex: '#FFB563',
    orbitColorToken: '--solar-orbit-2',
    atmosphere: {
      composition: [
        { gas: 'CO₂', percent: 96, color: '#FFB563', molarMass: '44.0 g/mol', spectralBand: '4.3 μm IR Band', volatility: 0.18 },
        { gas: 'N₂', percent: 3.5, color: '#488EFF', molarMass: '28.0 g/mol', spectralBand: '215 nm UV Continuum', volatility: 0.14 },
        { gas: 'SO₂', percent: 0.5, color: '#FF894F', molarMass: '64.1 g/mol', spectralBand: '7.3 μm Cloud Top', volatility: 0.09 },
      ],
      surfacePressure: '92.0 bar',
      pressureBarNum: 92.0,
      meanTemp: '464 °C (737 K)',
      meanTempC: 464,
      dayNightDeltaC: 18,
      baseFluxWm2: 2601,
      weatherSummary: 'Super-rotating sulfuric cloud decks circulating the globe every 4 days, homogenizing day-night heat.',
    },
    orbitalStats: {
      meanVelocityKmS: 35.0,
      axialTiltDeg: '177.4° (Retro)',
      surfaceGravity: '8.87 m/s²',
      escapeVelocityKmS: 10.4,
    },
    historicalOrbits: [
      {
        epochId: 'formation',
        epochLabel: '-100 Myr',
        ageLabel: 'Formation',
        au: 0.76,
        eccentricity: 0.068,
        inclinationDeg: 6.1,
        velocityKmS: 34.1,
        notes: 'Early runaway greenhouse onset during inward planetary settling.',
      },
      {
        epochId: 'migration',
        epochLabel: '-10 Myr',
        ageLabel: 'Secular Drift',
        au: 0.73,
        eccentricity: 0.042,
        inclinationDeg: 5.2,
        velocityKmS: 34.7,
        notes: 'Atmospheric tidal torque stabilized near-circular retrograde rotation.',
      },
      {
        epochId: 'j2000',
        epochLabel: 'J2000.0',
        ageLabel: 'Reference',
        au: 0.72,
        eccentricity: 0.030,
        inclinationDeg: 4.7,
        velocityKmS: 35.0,
        notes: 'Baseline J2000 heliocentric ephemeris for HUB 02 Settlement Core.',
      },
    ],
  },
  {
    hubId: 'enterprise',
    celestialTier: 'Sovereign Terra · Core ERP/BI',
    celestialAnalog: 'Terra-Class Biosphere',
    auValue: 1.0,
    auDistance: '1.00 AU',
    kmEquiv: '149.6M km eq.',
    orbitPeriod: '365 d cycle',
    orbitRadius: 6.1,
    eccentricity: 0.025,
    tiltSignZ: 1,
    tiltSignX: -1,
    tiltWeight: 0.58,
    planetRadius: 0.52,
    orbitSpeed: 0.33,
    initialAngle: 3.4,
    baseHex: '#0B57D0',
    bandHex: '#488EFF',
    accentHex: '#68E4EF',
    orbitColorToken: '--solar-orbit-3',
    atmosphere: {
      composition: [
        { gas: 'N₂', percent: 78, color: '#488EFF', molarMass: '28.0 g/mol', spectralBand: 'Rayleigh Blue 450 nm', volatility: 0.22 },
        { gas: 'O₂', percent: 21, color: '#68E4EF', molarMass: '32.0 g/mol', spectralBand: '762 nm Fraunhofer A', volatility: 0.21 },
        { gas: 'Ar/CO₂', percent: 1, color: '#C4D6F0', molarMass: '39.9 g/mol', spectralBand: '15.0 μm Tropospheric', volatility: 0.06 },
      ],
      surfacePressure: '1.01 bar',
      pressureBarNum: 1.01,
      meanTemp: '15 °C (288 K)',
      meanTempC: 15,
      dayNightDeltaC: 24,
      baseFluxWm2: 1361,
      weatherSummary: 'Magnetosphere-shielded troposphere supporting balanced diurnal warming and zonal jet streams.',
    },
    orbitalStats: {
      meanVelocityKmS: 29.8,
      axialTiltDeg: '23.4°',
      surfaceGravity: '9.81 m/s²',
      escapeVelocityKmS: 11.2,
    },
    historicalOrbits: [
      {
        epochId: 'formation',
        epochLabel: '-100 Myr',
        ageLabel: 'Formation',
        au: 1.04,
        eccentricity: 0.058,
        inclinationDeg: 4.9,
        velocityKmS: 29.2,
        notes: 'Habitable-zone orbital lock established after outer giant migration.',
      },
      {
        epochId: 'migration',
        epochLabel: '-10 Myr',
        ageLabel: 'Milankovitch',
        au: 1.01,
        eccentricity: 0.041,
        inclinationDeg: 3.8,
        velocityKmS: 29.6,
        notes: '100-kyr eccentricity cycle modulating seasonal solar insolation.',
      },
      {
        epochId: 'j2000',
        epochLabel: 'J2000.0',
        ageLabel: 'Reference',
        au: 1.00,
        eccentricity: 0.025,
        inclinationDeg: 3.5,
        velocityKmS: 29.8,
        notes: 'Baseline 1.00 AU canonical reference orbit for HUB 03 Enterprise.',
      },
    ],
  },
  {
    hubId: 'infra',
    celestialTier: 'Citadel World · Security TEE',
    celestialAnalog: 'Mars-Class Oxide World',
    auValue: 1.52,
    auDistance: '1.52 AU',
    kmEquiv: '227.9M km eq.',
    orbitPeriod: '687 d cycle',
    orbitRadius: 7.7,
    eccentricity: 0.075,
    tiltSignZ: -1,
    tiltSignX: -1,
    tiltWeight: 0.9,
    planetRadius: 0.41,
    orbitSpeed: 0.26,
    initialAngle: 5.0,
    baseHex: '#E11D48',
    bandHex: '#FDA4AF',
    accentHex: '#FF894F',
    orbitColorToken: '--solar-orbit-4',
    atmosphere: {
      composition: [
        { gas: 'CO₂', percent: 95, color: '#FF894F', molarMass: '44.0 g/mol', spectralBand: '2.0 μm Albedo Band', volatility: 0.34 },
        { gas: 'N₂', percent: 3, color: '#488EFF', molarMass: '28.0 g/mol', spectralBand: '337 nm Aurora Line', volatility: 0.18 },
        { gas: 'Ar', percent: 2, color: '#C4D6F0', molarMass: '39.9 g/mol', spectralBand: '811 nm Noble Trace', volatility: 0.12 },
      ],
      surfacePressure: '0.006 bar',
      pressureBarNum: 0.006,
      meanTemp: '-65 °C (208 K)',
      meanTempC: -65,
      dayNightDeltaC: 96,
      baseFluxWm2: 589,
      weatherSummary: 'Thin carbon-dioxide envelope with steep 96 K day-night drop and ferric dust suspension.',
    },
    orbitalStats: {
      meanVelocityKmS: 24.1,
      axialTiltDeg: '25.2°',
      surfaceGravity: '3.72 m/s²',
      escapeVelocityKmS: 5.0,
    },
    historicalOrbits: [
      {
        epochId: 'formation',
        epochLabel: '-100 Myr',
        ageLabel: 'Formation',
        au: 1.46,
        eccentricity: 0.118,
        inclinationDeg: 7.8,
        velocityKmS: 24.6,
        notes: 'Perturbed by outer gas-giant resonance across inner asteroid margin.',
      },
      {
        epochId: 'migration',
        epochLabel: '-10 Myr',
        ageLabel: 'Secular Drift',
        au: 1.50,
        eccentricity: 0.092,
        inclinationDeg: 6.1,
        velocityKmS: 24.3,
        notes: 'Obliquity oscillation driving seasonal polar CO₂ sublimation.',
      },
      {
        epochId: 'j2000',
        epochLabel: 'J2000.0',
        ageLabel: 'Reference',
        au: 1.52,
        eccentricity: 0.075,
        inclinationDeg: 5.4,
        velocityKmS: 24.1,
        notes: 'Baseline J2000 heliocentric ephemeris for HUB 04 Security TEE.',
      },
    ],
  },
  {
    hubId: 'xr',
    celestialTier: 'Gas Giant · Spatial XR Studio',
    celestialAnalog: 'Jupiter-Class Gas Giant',
    auValue: 5.2,
    auDistance: '5.20 AU',
    kmEquiv: '778.5M km eq.',
    orbitPeriod: '11.9 yr cycle',
    orbitRadius: 10.6,
    eccentricity: 0.045,
    tiltSignZ: 1,
    tiltSignX: 1,
    tiltWeight: 0.68,
    planetRadius: 0.78,
    orbitSpeed: 0.17,
    initialAngle: 0.95,
    baseHex: '#3B82F6',
    bandHex: '#C4D6F0',
    accentHex: '#488EFF',
    orbitColorToken: '--solar-orbit-5',
    atmosphere: {
      composition: [
        { gas: 'H₂', percent: 89, color: '#488EFF', molarMass: '2.02 g/mol', spectralBand: '825 nm Quadrupole', volatility: 0.28 },
        { gas: 'He', percent: 10, color: '#FFE0BB', molarMass: '4.00 g/mol', spectralBand: '58.4 nm EUV Scatter', volatility: 0.24 },
        { gas: 'CH₄/NH₃', percent: 1, color: '#68E4EF', molarMass: '16.5 g/mol', spectralBand: '890 nm Ammonia Cloud', volatility: 0.12 },
      ],
      surfacePressure: '> 1,000 bar (Deep)',
      pressureBarNum: 1000,
      meanTemp: '-110 °C (163 K)',
      meanTempC: -110,
      dayNightDeltaC: 8,
      baseFluxWm2: 50.3,
      weatherSummary: 'Counter-flowing ammonia cloud belts driven by deep Kelvin-Helmholtz internal heat flux.',
    },
    orbitalStats: {
      meanVelocityKmS: 13.1,
      axialTiltDeg: '3.1°',
      surfaceGravity: '24.79 m/s²',
      escapeVelocityKmS: 59.5,
    },
    historicalOrbits: [
      {
        epochId: 'formation',
        epochLabel: '-100 Myr',
        ageLabel: 'Grand Tack',
        au: 3.85,
        eccentricity: 0.088,
        inclinationDeg: 5.5,
        velocityKmS: 15.2,
        notes: 'Inward-then-outward Grand Tack migration sculpting the asteroid belt.',
      },
      {
        epochId: 'migration',
        epochLabel: '-10 Myr',
        ageLabel: 'Resonance',
        au: 5.05,
        eccentricity: 0.062,
        inclinationDeg: 4.5,
        velocityKmS: 13.3,
        notes: 'Locked in 5:2 secular Laplace-style orbital spacing with HUB 06.',
      },
      {
        epochId: 'j2000',
        epochLabel: 'J2000.0',
        ageLabel: 'Reference',
        au: 5.20,
        eccentricity: 0.045,
        inclinationDeg: 4.1,
        velocityKmS: 13.1,
        notes: 'Baseline J2000 heliocentric ephemeris for HUB 05 Spatial XR.',
      },
    ],
  },
  {
    hubId: 'voice',
    celestialTier: 'Ringed Giant · Multimodal AI',
    celestialAnalog: 'Saturn-Class Ringed World',
    auValue: 9.58,
    auDistance: '9.58 AU',
    kmEquiv: '1.43B km eq.',
    orbitPeriod: '29.5 yr cycle',
    orbitRadius: 13.4,
    eccentricity: 0.052,
    tiltSignZ: -1,
    tiltSignX: 1,
    tiltWeight: 0.96,
    planetRadius: 0.68,
    orbitSpeed: 0.125,
    initialAngle: 2.85,
    baseHex: '#D97706',
    bandHex: '#FFF1DD',
    accentHex: '#FFB563',
    orbitColorToken: '--solar-orbit-6',
    hasRings: true,
    ringColorHex: '#FFE0BB',
    atmosphere: {
      composition: [
        { gas: 'H₂', percent: 96, color: '#FFB563', molarMass: '2.02 g/mol', spectralBand: '1.28 μm H₂ Band', volatility: 0.2 },
        { gas: 'He', percent: 3, color: '#FFE0BB', molarMass: '4.00 g/mol', spectralBand: '58.4 nm Helium Rain', volatility: 0.16 },
        { gas: 'CH₄', percent: 1, color: '#68E4EF', molarMass: '16.0 g/mol', spectralBand: '727 nm Methane', volatility: 0.09 },
      ],
      surfacePressure: '> 1,000 bar (Deep)',
      pressureBarNum: 1000,
      meanTemp: '-140 °C (133 K)',
      meanTempC: -140,
      dayNightDeltaC: 11,
      baseFluxWm2: 14.8,
      weatherSummary: '1,800 km/h equatorial winds beneath hexagonal polar jet streams and crystalline ring shadows.',
    },
    orbitalStats: {
      meanVelocityKmS: 9.7,
      axialTiltDeg: '26.7°',
      surfaceGravity: '10.44 m/s²',
      escapeVelocityKmS: 35.5,
    },
    historicalOrbits: [
      {
        epochId: 'formation',
        epochLabel: '-100 Myr',
        ageLabel: 'Formation',
        au: 7.90,
        eccentricity: 0.094,
        inclinationDeg: 7.4,
        velocityKmS: 10.7,
        notes: 'Early icy-satellite capture creating crystalline Cassini ring plane.',
      },
      {
        epochId: 'migration',
        epochLabel: '-10 Myr',
        ageLabel: 'Secular Drift',
        au: 9.24,
        eccentricity: 0.068,
        inclinationDeg: 6.2,
        velocityKmS: 9.9,
        notes: 'Outward resonance stepping damped eccentricity toward 0.052.',
      },
      {
        epochId: 'j2000',
        epochLabel: 'J2000.0',
        ageLabel: 'Reference',
        au: 9.58,
        eccentricity: 0.052,
        inclinationDeg: 5.8,
        velocityKmS: 9.7,
        notes: 'Baseline J2000 heliocentric ephemeris for HUB 06 Multimodal AI.',
      },
    ],
  },
  {
    hubId: 'retail',
    celestialTier: 'Ice Giant · Commerce & Brand',
    celestialAnalog: 'Uranus-Class Ice Giant',
    auValue: 19.2,
    auDistance: '19.20 AU',
    kmEquiv: '2.87B km eq.',
    orbitPeriod: '84 yr cycle',
    orbitRadius: 16.0,
    eccentricity: 0.04,
    tiltSignZ: 1,
    tiltSignX: -1,
    tiltWeight: 0.84,
    planetRadius: 0.54,
    orbitSpeed: 0.095,
    initialAngle: 4.5,
    baseHex: '#06B6D4',
    bandHex: '#A5F3FC',
    accentHex: '#68E4EF',
    orbitColorToken: '--solar-orbit-7',
    atmosphere: {
      composition: [
        { gas: 'H₂', percent: 83, color: '#68E4EF', molarMass: '2.02 g/mol', spectralBand: '4.7 μm H₂-S(1)', volatility: 0.25 },
        { gas: 'He', percent: 15, color: '#97C4FF', molarMass: '4.00 g/mol', spectralBand: '58.4 nm Tropopause', volatility: 0.21 },
        { gas: 'CH₄', percent: 2, color: '#06B6D4', molarMass: '16.0 g/mol', spectralBand: '619 nm Red Absorb', volatility: 0.11 },
      ],
      surfacePressure: '> 1,000 bar (Mantle)',
      pressureBarNum: 1000,
      meanTemp: '-195 °C (78 K)',
      meanTempC: -195,
      dayNightDeltaC: 14,
      baseFluxWm2: 3.7,
      weatherSummary: 'Methane ice haze absorbing red solar wavelengths across extreme 42-year polar summer/night cycles.',
    },
    orbitalStats: {
      meanVelocityKmS: 6.8,
      axialTiltDeg: '97.8°',
      surfaceGravity: '8.69 m/s²',
      escapeVelocityKmS: 21.3,
    },
    historicalOrbits: [
      {
        epochId: 'formation',
        epochLabel: '-100 Myr',
        ageLabel: 'Nice Model',
        au: 15.6,
        eccentricity: 0.112,
        inclinationDeg: 6.9,
        velocityKmS: 7.5,
        notes: 'Scattering event tilted rotational axis to 97.8° and expanded semi-major axis.',
      },
      {
        epochId: 'migration',
        epochLabel: '-10 Myr',
        ageLabel: 'Secular Drift',
        au: 18.7,
        eccentricity: 0.056,
        inclinationDeg: 5.5,
        velocityKmS: 6.9,
        notes: 'Circularization inside outer Kuiper-margin dynamical relaxation.',
      },
      {
        epochId: 'j2000',
        epochLabel: 'J2000.0',
        ageLabel: 'Reference',
        au: 19.20,
        eccentricity: 0.040,
        inclinationDeg: 5.0,
        velocityKmS: 6.8,
        notes: 'Baseline J2000 heliocentric ephemeris for HUB 07 Commerce & Brand.',
      },
    ],
  },
  {
    hubId: 'energy',
    celestialTier: 'Deep Azure · IoT & Edge AI',
    celestialAnalog: 'Neptune-Class Ice Giant',
    auValue: 30.05,
    auDistance: '30.05 AU',
    kmEquiv: '4.50B km eq.',
    orbitPeriod: '165 yr cycle',
    orbitRadius: 18.5,
    eccentricity: 0.02,
    tiltSignZ: -1,
    tiltSignX: -1,
    tiltWeight: 0.72,
    planetRadius: 0.56,
    orbitSpeed: 0.072,
    initialAngle: 5.8,
    baseHex: '#1D4ED8',
    bandHex: '#93C5FD',
    accentHex: '#488EFF',
    orbitColorToken: '--solar-orbit-8',
    atmosphere: {
      composition: [
        { gas: 'H₂', percent: 80, color: '#488EFF', molarMass: '2.02 g/mol', spectralBand: '637 nm Raman Shift', volatility: 0.24 },
        { gas: 'He', percent: 19, color: '#97C4FF', molarMass: '4.00 g/mol', spectralBand: '58.4 nm Deep Scatter', volatility: 0.22 },
        { gas: 'CH₄', percent: 1, color: '#68E4EF', molarMass: '16.0 g/mol', spectralBand: '727 nm Deep Azure', volatility: 0.1 },
      ],
      surfacePressure: '> 1,000 bar (Mantle)',
      pressureBarNum: 1000,
      meanTemp: '-200 °C (73 K)',
      meanTempC: -200,
      dayNightDeltaC: 6,
      baseFluxWm2: 1.5,
      weatherSummary: 'Fastest supersonic winds in the system (2,100 km/h) sustained by deep mantle heat flux.',
    },
    orbitalStats: {
      meanVelocityKmS: 5.4,
      axialTiltDeg: '28.3°',
      surfaceGravity: '11.15 m/s²',
      escapeVelocityKmS: 23.5,
    },
    historicalOrbits: [
      {
        epochId: 'formation',
        epochLabel: '-100 Myr',
        ageLabel: 'Outward Push',
        au: 24.4,
        eccentricity: 0.082,
        inclinationDeg: 6.2,
        velocityKmS: 6.0,
        notes: 'Outward migration swept Edge-IoT planetesimals into 3:2 Kuiper resonance.',
      },
      {
        epochId: 'migration',
        epochLabel: '-10 Myr',
        ageLabel: 'Secular Drift',
        au: 29.5,
        eccentricity: 0.032,
        inclinationDeg: 4.9,
        velocityKmS: 5.5,
        notes: 'Settled into near-circular outer perimeter guard orbit.',
      },
      {
        epochId: 'j2000',
        epochLabel: 'J2000.0',
        ageLabel: 'Reference',
        au: 30.05,
        eccentricity: 0.020,
        inclinationDeg: 4.3,
        velocityKmS: 5.4,
        notes: 'Baseline J2000 heliocentric ephemeris for HUB 08 IoT & Edge AI.',
      },
    ],
  },
];

const NOMINAL_ORBIT_SCALES: number[] = PLANET_BLUEPRINTS.map(() => 1.0);

interface OrbitLayoutEntry {
  radiusScale: number;
  eccentricity: number;
  argPeriapsis: number;
  tiltOffsetZ: number;
  tiltOffsetX: number;
}

function generateConfigurationLayout(
  preset: SolarConfigurationPreset,
  seedNonce = 0,
): OrbitLayoutEntry[] {
  const seedOffset =
    preset === 'highly-eccentric' ? 109 : preset === 'young-chaotic' ? 313 : 17;
  const rand = mulberry32(20261122 + seedNonce * 7919 + seedOffset);

  if (preset === 'stable-circular') {
    return PLANET_BLUEPRINTS.map((spec) => ({
      radiusScale: 1.0,
      eccentricity: Math.min(0.022, Math.max(0.008, spec.eccentricity * 0.25)),
      argPeriapsis: 0,
      tiltOffsetZ: 0,
      tiltOffsetX: 0,
    }));
  }

  if (preset === 'highly-eccentric') {
    return PLANET_BLUEPRINTS.map((spec, idx) => {
      const radiusScale = 0.88 + rand() * 0.28;
      const a = spec.orbitRadius * radiusScale;
      const minPerihelion = 2.15 + spec.planetRadius;
      const maxSafeEcc = Math.max(0.18, Math.min(0.62, 1 - minPerihelion / a));
      const desiredEcc = (idx % 2 === 0 ? 0.42 : 0.5) + rand() * 0.14;
      const eccentricity = Math.min(maxSafeEcc, desiredEcc);
      const argPeriapsis = idx * 2.18 + (rand() - 0.5) * 0.62;
      const tiltOffsetZ = (rand() - 0.5) * 0.14;
      const tiltOffsetX = (rand() - 0.5) * 0.1;
      return {
        radiusScale,
        eccentricity,
        argPeriapsis,
        tiltOffsetZ,
        tiltOffsetX,
      };
    });
  }

  // 'young-chaotic': procedural protoplanetary trajectories with intersecting paths and mutual 3D inclinations
  return PLANET_BLUEPRINTS.map((spec) => {
    const radiusScale = 0.72 + rand() * 0.52;
    const a = spec.orbitRadius * radiusScale;
    const minPerihelion = 2.15 + spec.planetRadius;
    const maxSafeEcc = Math.max(0.2, Math.min(0.66, 1 - minPerihelion / a));
    const eccentricity = Math.min(maxSafeEcc, 0.24 + rand() * 0.42);
    const argPeriapsis = rand() * Math.PI * 2;
    const tiltOffsetZ = (rand() - 0.5) * 0.44;
    const tiltOffsetX = (rand() - 0.5) * 0.36;
    return {
      radiusScale,
      eccentricity,
      argPeriapsis,
      tiltOffsetZ,
      tiltOffsetX,
    };
  });
}

const STABLE_CIRCULAR_LAYOUT = generateConfigurationLayout('stable-circular', 0);

/**
 * Procedurally jitter-shifts each planet's orbital radius by +/-15% from its nominal
 * distance while guaranteeing a fresh visible delta on every trigger and preserving
 * safe non-overlapping clearance between adjacent worlds.
 */
function generateJitteredOrbitScales(prevScales: number[]): number[] {
  const minScale = 1 - ORBIT_JITTER_RANGE;
  const maxScale = 1 + ORBIT_JITTER_RANGE;

  const radii = PLANET_BLUEPRINTS.map((spec, idx) => {
    const prev = prevScales[idx] ?? 1.0;
    let candidate = 1 + (Math.random() * 2 - 1) * ORBIT_JITTER_RANGE;
    // Guarantee every trigger creates a fresh perceptible shift per planet
    if (Math.abs(candidate - prev) < 0.04) {
      const flipped = 2 - candidate;
      candidate =
        Math.abs(flipped - prev) >= 0.04
          ? flipped
          : prev >= 1
            ? Math.max(minScale, prev - 0.09)
            : Math.min(maxScale, prev + 0.09);
    }
    return spec.orbitRadius * THREE.MathUtils.clamp(candidate, minScale, maxScale);
  });

  // Symmetric separation pass keeping every orbit strictly within [0.85x, 1.15x]
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 1; i < radii.length; i++) {
      const prevSpec = PLANET_BLUEPRINTS[i - 1];
      const currSpec = PLANET_BLUEPRINTS[i];
      const minGap = prevSpec.planetRadius + currSpec.planetRadius + 0.28;
      const gap = radii[i] - radii[i - 1];
      if (gap < minGap) {
        const push = (minGap - gap) * 0.52;
        radii[i - 1] = THREE.MathUtils.clamp(
          radii[i - 1] - push,
          prevSpec.orbitRadius * minScale,
          prevSpec.orbitRadius * maxScale,
        );
        radii[i] = THREE.MathUtils.clamp(
          radii[i] + push,
          currSpec.orbitRadius * minScale,
          currSpec.orbitRadius * maxScale,
        );
      }
    }
  }

  return radii.map((r, idx) =>
    THREE.MathUtils.clamp(r / PLANET_BLUEPRINTS[idx].orbitRadius, minScale, maxScale),
  );
}

function formatScaledAu(bp: PlanetBlueprint, scale: number): string {
  const scaled = bp.auValue * scale;
  const pct = Math.round((scale - 1) * 100);
  if (pct === 0) return bp.auDistance;
  const sign = pct > 0 ? '+' : '';
  return `${scaled.toFixed(2)} AU (${sign}${pct}%)`;
}

const SOLAR_VIEW_CAMERA: Record<
  SolarViewMode,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  overview: { pos: [0.0, 14.5, 25.5], target: [0, -0.4, 0] },
  ecliptic: { pos: [0.0, 2.3, 24.0], target: [0, 0, 0] },
  'inner-core': { pos: [5.4, 5.6, 10.4], target: [0, 0, 0] },
};

type CinematicTourStop =
  | {
      id: string;
      title: string;
      subtitle: string;
      focusBodyId: 'sun';
      cameraPos: [number, number, number];
      targetPos: [number, number, number];
      duration: number;
      hold: number;
    }
  | {
      id: string;
      title: string;
      subtitle: string;
      focusBodyId: string;
      standOffMul: number;
      elevFrac: number;
      azimuthLead: number;
      duration: number;
      hold: number;
    };

const CINEMATIC_TOUR_STOPS: CinematicTourStop[] = [
  {
    id: 'sun-core',
    title: 'Sun Core · Spenta Reactor',
    subtitle: '0.00 AU · Magneto-Convective Plasma Sphere',
    focusBodyId: 'sun',
    cameraPos: [3.2, 2.0, 5.2],
    targetPos: [0, 0, 0],
    duration: 2.2,
    hold: 1.6,
  },
  {
    id: 'inner-healthcare',
    title: 'Inner Silicate · HUB 01 Clinical Core',
    subtitle: '0.39 AU · High-Velocity Perihelion Pass',
    focusBodyId: 'healthcare',
    standOffMul: 6.4,
    elevFrac: 0.38,
    azimuthLead: 0.55,
    duration: 2.4,
    hold: 1.6,
  },
  {
    id: 'inner-enterprise',
    title: 'Sovereign Terra · HUB 03 Enterprise',
    subtitle: '1.00 AU · Biosphere & Orbiting Module Array',
    focusBodyId: 'enterprise',
    standOffMul: 5.8,
    elevFrac: 0.36,
    azimuthLead: -0.6,
    duration: 2.4,
    hold: 1.6,
  },
  {
    id: 'citadel-asteroid-margin',
    title: 'Citadel & Asteroid Margin · HUB 04 TEE',
    subtitle: '1.52–2.80 AU · Ferric Basin & Debris Belt',
    focusBodyId: 'infra',
    standOffMul: 6.8,
    elevFrac: 0.55,
    azimuthLead: 0.85,
    duration: 2.5,
    hold: 1.6,
  },
  {
    id: 'ringed-giant',
    title: 'Ringed Giant · HUB 06 Multimodal AI',
    subtitle: '9.58 AU · Crystalline Ring Plane & Satellites',
    focusBodyId: 'voice',
    standOffMul: 5.4,
    elevFrac: 0.35,
    azimuthLead: -0.45,
    duration: 2.8,
    hold: 1.8,
  },
  {
    id: 'outer-orbital-fringes',
    title: 'Outer Orbital Fringes · HUB 08 Edge AI',
    subtitle: '30.05 AU · Deep Azure Kuiper Frontier',
    focusBodyId: 'energy',
    standOffMul: 6.4,
    elevFrac: 0.48,
    azimuthLead: 0.85,
    duration: 3.0,
    hold: 1.8,
  },
  {
    id: 'ecliptic-panorama',
    title: 'Heliocentric Ecliptic Panorama',
    subtitle: 'Full 8-Hub Keplerian Orbital Architecture',
    focusBodyId: 'sun',
    cameraPos: [0.0, 5.4, 27.5],
    targetPos: [0, 0, 0],
    duration: 2.8,
    hold: 1.4,
  },
];

const SOLAR_PHOTOSPHERE_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  varying vec3 vViewDir;

  void main() {
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const SOLAR_PHOTOSPHERE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uOpaPass;
  uniform float uBloom;
  varying vec3 vNormal;
  varying vec3 vPos;
  varying vec3 vViewDir;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.04 + vec3(0.13, -0.09, 0.17);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 p = normalize(vPos) * 3.4 + vec3(uTime * 0.16, -uTime * 0.11, uTime * 0.09);
    float n = fbm(p);
    float n2 = fbm(p * 2.1 - vec3(uTime * 0.22));
    float plasma = clamp(n * 0.65 + n2 * 0.45, 0.0, 1.0);

    float ndotv = clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0);
    float rim = pow(1.0 - ndotv, 2.2);

    vec3 colHot = vec3(1.0, 0.96, 0.89);
    vec3 colAmber = vec3(1.0, 0.71, 0.39);
    vec3 colFlare = vec3(1.0, 0.53, 0.31);
    vec3 colRimStable = vec3(0.41, 0.89, 0.94);

    vec3 col = mix(colFlare, colAmber, smoothstep(0.24, 0.68, plasma));
    col = mix(col, colHot, smoothstep(0.62, 0.95, plasma));
    col = mix(col, mix(colFlare, colRimStable, uOpaPass * 0.35), rim * (0.45 + 0.22 * uBloom));
    col *= 0.68 + uBloom * 0.56;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const CORONA_HALO_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CORONA_HALO_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uOpaPass;
  uniform float uBloom;
  varying vec2 vUv;

  void main() {
    vec2 c = vUv - 0.5;
    float d = length(c) * 2.0;
    if (d > 1.0) discard;
    float ang = atan(c.y, c.x);
    float rays = 0.88 + 0.12 * sin(ang * 9.0 + uTime * 0.8) * cos(ang * 5.0 - uTime * 0.5);
    float glow = exp(-d * d * 4.4) * 0.78 + exp(-d * 3.1) * 0.42 * rays;
    vec3 inner = vec3(1.0, 0.88, 0.73);
    vec3 outer = mix(vec3(1.0, 0.54, 0.31), vec3(0.28, 0.56, 1.0), uOpaPass * 0.45);
    vec3 col = mix(inner, outer, smoothstep(0.18, 0.82, d));
    float bloomMul = 0.25 + uBloom * 0.95;
    gl_FragColor = vec4(col * (0.72 + uBloom * 0.42), clamp(glow * bloomMul * (1.0 - d), 0.0, 0.96));
  }
`;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createSolarPlanetTexture(baseHex: string, bandHex: string, seed: number): THREE.CanvasTexture {
  const rand = mulberry32(seed);
  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#040A16');
  grad.addColorStop(0.18, baseHex);
  grad.addColorStop(0.48, bandHex);
  grad.addColorStop(0.76, baseHex);
  grad.addColorStop(1, '#040A16');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 18; i++) {
    const y = rand() * h;
    const bandH = 2 + rand() * 8;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.14)' : 'rgba(4,10,22,0.18)';
    ctx.fillRect(0, y, w, bandH);
  }
  for (let j = 0; j < 26; j++) {
    const x = rand() * w;
    const y = 16 + rand() * (h - 32);
    const rx = 5 + rand() * 18;
    const ry = 2 + rand() * 5;
    ctx.fillStyle = 'rgba(255, 245, 228, 0.16)';
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function createPlanetRingTexture(ringHex: string): THREE.CanvasTexture {
  const w = 256;
  const h = 16;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  for (let x = 0; x < w; x++) {
    const t = x / w;
    const innerEdge = Math.min(1, Math.max(0, (t - 0.12) / 0.12));
    const outerEdge = Math.min(1, Math.max(0, (0.96 - t) / 0.12));
    const cassiniGap = t > 0.56 && t < 0.63 ? 0.12 : 1.0;
    const ripple = 0.65 + 0.35 * Math.sin(t * 95.0);
    const alpha = innerEdge * outerEdge * cassiniGap * ripple * 0.72;
    ctx.fillStyle = ringHex;
    ctx.globalAlpha = alpha;
    ctx.fillRect(x, 0, 1, h);
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStarHaloTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.24, 'rgba(220, 238, 255, 0.72)');
  grad.addColorStop(0.58, 'rgba(104, 228, 239, 0.18)');
  grad.addColorStop(1, 'rgba(4, 10, 22, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createResonanceNodeTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.18, 'rgba(255, 245, 228, 0.88)');
  grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.34)');
  grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.08)');
  grad.addColorStop(1, 'rgba(4, 10, 22, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(half, half, half * 0.44, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface ConstellationSpec {
  az: number;
  el: number;
  span: number;
  stars: [number, number, number?][];
  edges: [number, number][];
  accent: 'blue' | 'cyan' | 'amber';
}

const CELESTIAL_CONSTELLATIONS: ConstellationSpec[] = [
  // 1. Orion-class Hourglass (Ecliptic North-East)
  {
    az: 0.45,
    el: 0.28,
    span: 0.34,
    accent: 'cyan',
    stars: [
      [-0.55, 0.65, 0],
      [0.48, 0.58, -1.2],
      [-0.18, 0.06, 0.5],
      [0.02, 0.0, 0.2],
      [0.22, -0.06, -0.4],
      [-0.46, -0.62, 0.8],
      [0.54, -0.58, 0.3],
    ],
    edges: [
      [0, 2],
      [1, 4],
      [2, 3],
      [3, 4],
      [2, 5],
      [4, 6],
      [0, 1],
      [5, 6],
    ],
  },
  // 2. Cassiopeia-class Sovereign W-Crown (High North)
  {
    az: 1.55,
    el: 0.76,
    span: 0.3,
    accent: 'amber',
    stars: [
      [-0.78, 0.22],
      [-0.36, -0.28],
      [0.04, 0.16],
      [0.42, -0.3],
      [0.82, 0.25],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  // 3. Cygnus-class Northern Cross (North-West)
  {
    az: 2.55,
    el: 0.44,
    span: 0.34,
    accent: 'blue',
    stars: [
      [0, 0.72],
      [0, 0.1],
      [0, -0.68],
      [-0.65, 0.16],
      [0.62, 0.08],
      [0.28, 0.42],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [3, 1],
      [1, 4],
      [0, 5],
    ],
  },
  // 4. Ursa Dipper Asterism (North-Center)
  {
    az: -1.15,
    el: 0.68,
    span: 0.36,
    accent: 'blue',
    stars: [
      [-0.82, 0.26],
      [-0.45, 0.36],
      [-0.12, 0.22],
      [0.2, 0.08],
      [0.64, 0.14],
      [0.72, -0.28],
      [0.24, -0.32],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 3],
    ],
  },
  // 5. Scorpius-class Sovereign Hook (Southern Ecliptic)
  {
    az: -2.35,
    el: -0.24,
    span: 0.35,
    accent: 'amber',
    stars: [
      [-0.58, 0.55],
      [-0.42, 0.22],
      [-0.22, -0.05],
      [0.02, -0.22],
      [0.26, -0.45],
      [0.58, -0.48],
      [0.74, -0.24],
      [0.62, -0.06],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
    ],
  },
  // 6. Lyra-class Vega Diamond (Mid-North)
  {
    az: 3.45,
    el: 0.32,
    span: 0.25,
    accent: 'cyan',
    stars: [
      [-0.36, 0.62],
      [-0.08, 0.18],
      [0.34, 0.06],
      [0.28, -0.52],
      [-0.22, -0.42],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 1],
    ],
  },
  // 7. Pegasus-class Sovereign Square (West Ecliptic)
  {
    az: -0.45,
    el: 0.14,
    span: 0.3,
    accent: 'blue',
    stars: [
      [-0.44, 0.44],
      [0.44, 0.4],
      [0.42, -0.42],
      [-0.46, -0.38],
      [-0.86, -0.55],
      [0.78, 0.68],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [3, 4],
      [1, 5],
    ],
  },
  // 8. Corona Borealis Arc (Overhead-East)
  {
    az: 0.95,
    el: 0.52,
    span: 0.24,
    accent: 'cyan',
    stars: [
      [-0.65, 0.18],
      [-0.42, -0.2],
      [-0.12, -0.36],
      [0.22, -0.3],
      [0.48, -0.06],
      [0.62, 0.26],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ],
  },
  // 9. Draco Serpent Arc (Far Polar Horizon)
  {
    az: 4.35,
    el: 0.65,
    span: 0.38,
    accent: 'blue',
    stars: [
      [-0.78, -0.18],
      [-0.45, 0.14],
      [-0.1, -0.05],
      [0.28, 0.28],
      [0.58, 0.08],
      [0.72, 0.42],
      [0.42, 0.56],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 3],
    ],
  },
  // 10. Centaurus Southern Horizon (South-East)
  {
    az: 1.95,
    el: -0.38,
    span: 0.34,
    accent: 'amber',
    stars: [
      [-0.62, 0.34],
      [-0.22, 0.46],
      [0.14, 0.12],
      [-0.2, -0.24],
      [0.34, -0.38],
      [0.68, -0.12],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [2, 4],
      [4, 5],
    ],
  },
  // 11. Taurus Pleiades V-Fork (Front-South)
  {
    az: -1.75,
    el: 0.08,
    span: 0.28,
    accent: 'amber',
    stars: [
      [-0.58, 0.42],
      [-0.2, 0.18],
      [0.12, -0.06],
      [-0.18, -0.24],
      [-0.54, -0.46],
      [0.62, 0.32],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [2, 5],
    ],
  },
];

function buildConstellationBuffers(
  baseRadius: number,
  blueCol: THREE.Color,
  cyanCol: THREE.Color,
  amberCol: THREE.Color,
  brightCol: THREE.Color,
) {
  const starPositions: number[] = [];
  const starColors: number[] = [];
  const segPositions: number[] = [];
  const segColors: number[] = [];
  const dir = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const tangentU = new THREE.Vector3();
  const tangentV = new THREE.Vector3();
  const pt = new THREE.Vector3();

  for (let c = 0; c < CELESTIAL_CONSTELLATIONS.length; c++) {
    const spec = CELESTIAL_CONSTELLATIONS[c];
    const cosEl = Math.cos(spec.el);
    dir.set(
      cosEl * Math.cos(spec.az),
      Math.sin(spec.el),
      cosEl * Math.sin(spec.az),
    ).normalize();
    tangentU.crossVectors(up, dir);
    if (tangentU.lengthSq() < 1e-4) tangentU.set(1, 0, 0);
    tangentU.normalize();
    tangentV.crossVectors(dir, tangentU).normalize();

    const accentColor =
      spec.accent === 'cyan' ? cyanCol : spec.accent === 'amber' ? amberCol : blueCol;

    const worldStars: THREE.Vector3[] = spec.stars.map(([u, v, dr = 0], sIdx) => {
      const r = baseRadius + dr + (sIdx % 3) * 0.9;
      pt.copy(dir)
        .addScaledVector(tangentU, u * spec.span)
        .addScaledVector(tangentV, v * spec.span)
        .normalize()
        .multiplyScalar(r);
      const clone = pt.clone();
      starPositions.push(clone.x, clone.y, clone.z);
      const starTint = sIdx === 0 ? brightCol : accentColor;
      starColors.push(starTint.r, starTint.g, starTint.b);
      return clone;
    });

    for (let e = 0; e < spec.edges.length; e++) {
      const [aIdx, bIdx] = spec.edges[e];
      const a = worldStars[aIdx];
      const b = worldStars[bIdx];
      if (!a || !b) continue;
      segPositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      segColors.push(
        accentColor.r,
        accentColor.g,
        accentColor.b,
        brightCol.r * 0.55 + accentColor.r * 0.45,
        brightCol.g * 0.55 + accentColor.g * 0.45,
        brightCol.b * 0.55 + accentColor.b * 0.45,
      );
    }
  }

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(segPositions, 3));
  lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(segColors, 3));

  const anchorGeo = new THREE.BufferGeometry();
  anchorGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  anchorGeo.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));

  return { lineGeo, anchorGeo };
}

interface ProjectedPlanetCallout {
  hubId: string;
  x: number;
  y: number;
}

const _pWorld = new THREE.Vector3();
const _pProj = new THREE.Vector3();
const _camGoal = new THREE.Vector3();
const _targetGoal = new THREE.Vector3();
const _radialScratch = new THREE.Vector3();
const _orbitColorScratch = new THREE.Color();
const _orbitWhite = new THREE.Color('#FFFFFF');
const _gsapStartCam = new THREE.Vector3();
const _gsapStartTarget = new THREE.Vector3();
const _gsapEndCam = new THREE.Vector3();
const _gsapEndTarget = new THREE.Vector3();
const _lightDirScratch = new THREE.Vector3();
const _planetDirScratch = new THREE.Vector3();
const _followPrevPos = new THREE.Vector3();
const _followDelta = new THREE.Vector3();
const _followErr = new THREE.Vector3();
const _resPtScratch = new THREE.Vector3();
const _resMidScratch = new THREE.Vector3();
const _resColorScratch = new THREE.Color();
const _tourStartCam = new THREE.Vector3();
const _tourStartTarget = new THREE.Vector3();
const _tourEndCam = new THREE.Vector3();
const _tourEndTarget = new THREE.Vector3();
const _tourRadial = new THREE.Vector3();
const _gwUpAxis = new THREE.Vector3(0, 1, 0);
const _gwColorA = new THREE.Color();
const _gwColorB = new THREE.Color('#488EFF');
const _gwProj = new THREE.Vector3();

export default function SolarSystemBrain3DCanvas({
  compact = false,
  onSelectHub,
  selectedHubId = null,
  hubFocusNonce = 0,
  transitionFromSpiral = false,
  onToggleAlternativeSystem,
}: SolarSystemBrain3DCanvasProps) {
  const {
    selectedIds,
    hitlConfidence,
    appMap,
    solarTimeScale: timeScale,
    setSolarTimeScale: setTimeScale,
    neuralBloomIntensity: bloomIntensity,
    setNeuralBloomIntensity: setBloomIntensity,
    solarOrbitalVelocity: orbitalVelocity,
    setSolarOrbitalVelocity: setOrbitalVelocity,
    solarOrbitalInclinationDeg: orbitalInclinationDeg,
    setSolarOrbitalInclinationDeg: setOrbitalInclinationDeg,
    solarConfigurationPreset: configurationPreset,
    setSolarConfigurationPreset: setConfigurationPreset,
    solarViewMode: viewMode,
    setSolarViewMode: setViewMode,
    solarShowOrbits: showOrbits,
    setSolarShowOrbits: setShowOrbits,
    solarAutoRotate: autoRotate,
    setSolarAutoRotate: setAutoRotate,
    solarDayNightCycle: dayNightCycle,
    setSolarDayNightCycle: setDayNightCycle,
    solarShowConstellations: showConstellations,
    setSolarShowConstellations: setShowConstellations,
    solarShowResonance: showResonance,
    setSolarShowResonance: setShowResonance,
    solarFollowPlanet: followPlanet,
    setSolarFollowPlanet: setFollowPlanet,
    navigateToItem,
  } = useStack();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const planetTrackerRef = useRef<
    Array<{ hubId: string; planetGroup: THREE.Group; planetRadius: number }>
  >([]);
  const gsapActiveRef = useRef<boolean>(false);
  const gsapFocusAnimRef = useRef<boolean>(false);
  const isSwitchingOutRef = useRef<boolean>(false);
  const activeGsapTlRef = useRef<gsap.core.Timeline | null>(null);
  const transitionFromSpiralRef = useRef<boolean>(transitionFromSpiral);

  const initialRestoredLayout = useMemo(
    () => generateConfigurationLayout(configurationPreset, 0),
    // Computed strictly for initial mount layout reconstruction
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [focusedBodyId, setFocusedBodyId] = useState<string>(
    selectedHubId && hubFocusNonce > 0 ? selectedHubId : 'sun',
  );
  const [lastSelectedPlanetId, setLastSelectedPlanetId] = useState<string>(
    selectedHubId && selectedHubId !== 'sun' ? selectedHubId : 'enterprise',
  );
  const [inspectedPlanetId, setInspectedPlanetId] = useState<string | null>(null);
  const [hoveredHubId, setHoveredHubId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [orbitLayout, setOrbitLayout] = useState<OrbitLayoutEntry[]>(initialRestoredLayout);
  const [orbitRadiusScales, setOrbitRadiusScales] = useState<number[]>(() =>
    initialRestoredLayout.map((e) => e.radiusScale),
  );
  const [orbitJitterCount, setOrbitJitterCount] = useState<number>(0);
  const [presetSeedNonce, setPresetSeedNonce] = useState<number>(0);
  const [activeResonanceCount, setActiveResonanceCount] = useState<number>(0);
  const [stressTestActive, setStressTestActive] = useState<boolean>(false);
  const [liveStressVelocity, setLiveStressVelocity] = useState<number>(DEFAULT_ORBITAL_VELOCITY);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [callout, setCallout] = useState<ProjectedPlanetCallout | null>(null);
  const [liveInspectTelemetry, setLiveInspectTelemetry] =
    useState<LivePlanetInspectTelemetry | null>(null);
  const [cinematicTour, setCinematicTour] = useState<boolean>(false);
  const [cinematicTourStepIndex, setCinematicTourStepIndex] = useState<number>(0);
  const [telemetryMetrics, setTelemetryMetrics] = useState<NeuralCoreTelemetrySnapshot>(
    INITIAL_TELEMETRY_SNAPSHOT,
  );
  const [atmosphericScattering, setAtmosphericScattering] = useState<boolean>(false);
  const [gravityWellHud, setGravityWellHud] = useState<{
    intersectionCount: number;
    latestPairLabel: string | null;
  }>({ intersectionCount: 0, latestPairLabel: null });
  const [gravityWellAlert, setGravityWellAlert] = useState<GravityWellInterferenceAlert | null>(
    null,
  );
  const [orbitLog, setOrbitLog] = useState<SolarOrbitLogEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(SOLAR_ORBIT_LOG_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.slice(0, MAX_SOLAR_ORBIT_LOG_ENTRIES) : [];
    } catch {
      return [];
    }
  });
  const prevEffectiveVelMultRef = useRef<number>(
    (stressTestActive ? liveStressVelocity : orbitalVelocity) * timeScale,
  );
  const prevVelContextRef = useRef<{
    velocity: number;
    timeScale: number;
    preset: SolarConfigurationPreset;
    stress: boolean;
    paused: boolean;
  }>({
    velocity: orbitalVelocity,
    timeScale,
    preset: configurationPreset,
    stress: stressTestActive,
    paused: isPaused,
  });

  const selectedIdsRef = useRef<string[]>(selectedIds);
  const hitlRef = useRef<number>(hitlConfidence);
  const bloomIntensityRef = useRef<number>(bloomIntensity);
  const atmosphericScatteringRef = useRef<boolean>(atmosphericScattering);
  const scatteringGlowRef = useRef<HTMLDivElement | null>(null);
  const primaryGasOverlayRef = useRef<HTMLDivElement | null>(null);
  const primaryGasRimRef = useRef<HTMLDivElement | null>(null);
  const planetGasOverlayRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const activeGasOverlayHubRef = useRef<string | null>(null);
  const activePrimaryGasSymbolRef = useRef<string | null>(null);
  const collisionMonitorRef = useRef<SolarOrbitCollisionMonitor | null>(null);
  const lastSeenIntersectionFlashIdRef = useRef<number>(0);
  const viewModeRef = useRef<SolarViewMode>(transitionFromSpiral ? 'ecliptic' : viewMode);
  const focusedBodyRef = useRef<string>(focusedBodyId);
  const inspectedPlanetRef = useRef<string | null>(inspectedPlanetId);
  const hoveredHubRef = useRef<string | null>(null);
  const isPausedRef = useRef<boolean>(isPaused);
  const orbitalVelocityRef = useRef<number>(orbitalVelocity);
  const orbitalInclinationRef = useRef<number>(orbitalInclinationDeg);
  const timeScaleRef = useRef<number>(timeScale);
  const showOrbitsRef = useRef<boolean>(showOrbits);
  const orbitLayoutRef = useRef<OrbitLayoutEntry[]>(orbitLayout);
  const orbitRadiusScalesRef = useRef<number[]>(orbitRadiusScales);
  const autoRotateRef = useRef<boolean>(autoRotate);
  const dayNightCycleRef = useRef<boolean>(dayNightCycle);
  const showConstellationsRef = useRef<boolean>(showConstellations);
  const showResonanceRef = useRef<boolean>(showResonance);
  const followPlanetRef = useRef<boolean>(followPlanet);
  const stressActiveRef = useRef<boolean>(false);
  const stressElapsedRef = useRef<number>(0);
  const stressSurgeVelRef = useRef<number>(DEFAULT_ORBITAL_VELOCITY);
  const cinematicTourRef = useRef<boolean>(false);
  const tourTlRef = useRef<gsap.core.Timeline | null>(null);
  const tourReducedTimerRef = useRef<number>(0);
  const onSelectHubRef = useRef(onSelectHub);
  const initialCamSpec = transitionFromSpiral
    ? SOLAR_VIEW_CAMERA.ecliptic
    : SOLAR_VIEW_CAMERA[viewMode] ?? SOLAR_VIEW_CAMERA.overview;
  const cameraCmdRef = useRef<{
    pos: [number, number, number];
    target: [number, number, number];
    nonce: number;
  }>({
    pos: initialCamSpec.pos,
    target: initialCamSpec.target,
    nonce: 0,
  });

  useEffect(() => {
    if (transitionFromSpiral) {
      setViewMode('ecliptic');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);
  useEffect(() => {
    hitlRef.current = hitlConfidence;
  }, [hitlConfidence]);
  useEffect(() => {
    bloomIntensityRef.current = bloomIntensity;
    if (rootRef.current) {
      rootRef.current.style.setProperty('--neural-bloom-intensity', bloomIntensity.toFixed(2));
    }
  }, [bloomIntensity]);
  useEffect(() => {
    atmosphericScatteringRef.current = atmosphericScattering;
  }, [atmosphericScattering]);
  useEffect(() => {
    focusedBodyRef.current = focusedBodyId;
  }, [focusedBodyId]);
  useEffect(() => {
    inspectedPlanetRef.current = inspectedPlanetId;
    if (!inspectedPlanetId) {
      setLiveInspectTelemetry(null);
    }
  }, [inspectedPlanetId]);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  useEffect(() => {
    orbitalVelocityRef.current = orbitalVelocity;
  }, [orbitalVelocity]);
  useEffect(() => {
    orbitalInclinationRef.current = orbitalInclinationDeg;
  }, [orbitalInclinationDeg]);
  useEffect(() => {
    timeScaleRef.current = timeScale;
  }, [timeScale]);
  useEffect(() => {
    showOrbitsRef.current = showOrbits;
  }, [showOrbits]);
  useEffect(() => {
    orbitLayoutRef.current = orbitLayout;
  }, [orbitLayout]);
  useEffect(() => {
    orbitRadiusScalesRef.current = orbitRadiusScales;
  }, [orbitRadiusScales]);
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);
  useEffect(() => {
    dayNightCycleRef.current = dayNightCycle;
  }, [dayNightCycle]);
  useEffect(() => {
    showConstellationsRef.current = showConstellations;
  }, [showConstellations]);
  useEffect(() => {
    showResonanceRef.current = showResonance;
    if (!showResonance) setActiveResonanceCount(0);
  }, [showResonance]);
  useEffect(() => {
    followPlanetRef.current = followPlanet;
  }, [followPlanet]);
  useEffect(() => {
    onSelectHubRef.current = onSelectHub;
  }, [onSelectHub]);

  // Persist Historical Orbit Log to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(
        SOLAR_ORBIT_LOG_STORAGE_KEY,
        JSON.stringify(orbitLog.slice(0, MAX_SOLAR_ORBIT_LOG_ENTRIES)),
      );
    } catch {
      // Ignore storage quota errors in restricted iframe sandboxes
    }
  }, [orbitLog]);

  // Debounced per-planet velocity change tracker for the persistent Historical Orbit Log
  useEffect(() => {
    const effectiveMult = isPaused
      ? 0
      : (stressTestActive ? liveStressVelocity : orbitalVelocity) * timeScale;
    const prevMult = prevEffectiveVelMultRef.current;
    const prevCtx = prevVelContextRef.current;

    if (Math.abs(effectiveMult - prevMult) < 0.04) {
      prevVelContextRef.current = {
        velocity: orbitalVelocity,
        timeScale,
        preset: configurationPreset,
        stress: stressTestActive,
        paused: isPaused,
      };
      return;
    }

    const triggerParts: string[] = [];
    if (prevCtx.paused !== isPaused) {
      triggerParts.push(isPaused ? 'Simulation Paused' : 'Simulation Resumed');
    }
    if (prevCtx.stress !== stressTestActive) {
      triggerParts.push(stressTestActive ? '10× Stress Surge' : 'Stress Surge Ended');
    }
    if (Math.abs(prevCtx.velocity - orbitalVelocity) >= 0.04) {
      triggerParts.push(`Velocity ${orbitalVelocity.toFixed(2)}×`);
    }
    if (Math.abs(prevCtx.timeScale - timeScale) >= 0.04) {
      triggerParts.push(`Time Scale ${timeScale.toFixed(1)}×`);
    }
    if (prevCtx.preset !== configurationPreset) {
      triggerParts.push(`Preset: ${configurationPreset}`);
    }
    const triggerLabel = triggerParts.length > 0 ? triggerParts.join(' · ') : 'Orbital Shift';

    const timer = window.setTimeout(() => {
      const nowIso = new Date().toISOString();
      const targetPlanets =
        focusedBodyId !== 'sun'
          ? PLANET_BLUEPRINTS.filter((bp) => bp.hubId === focusedBodyId)
          : PLANET_BLUEPRINTS;

      const newEntries: SolarOrbitLogEntry[] = targetPlanets.map((bp, idx) => {
        const hub = BRAIN_HUBS.find((h) => h.id === bp.hubId);
        return {
          id: `${nowIso}-${bp.hubId}-${idx}`,
          timestamp: nowIso,
          hubId: bp.hubId,
          planetName: hub ? `HUB ${hub.num} · ${hub.label}` : bp.celestialAnalog,
          orbitColorToken: bp.orbitColorToken,
          previousVelocityKmS: Number((bp.orbitalStats.meanVelocityKmS * prevMult).toFixed(2)),
          newVelocityKmS: Number((bp.orbitalStats.meanVelocityKmS * effectiveMult).toFixed(2)),
          velocityMultiplier: Number(effectiveMult.toFixed(2)),
          trigger: triggerLabel,
        };
      });

      setOrbitLog((prev) => [...newEntries, ...prev].slice(0, MAX_SOLAR_ORBIT_LOG_ENTRIES));
      prevEffectiveVelMultRef.current = effectiveMult;
      prevVelContextRef.current = {
        velocity: orbitalVelocity,
        timeScale,
        preset: configurationPreset,
        stress: stressTestActive,
        paused: isPaused,
      };
    }, 280);

    return () => window.clearTimeout(timer);
  }, [orbitalVelocity, timeScale, configurationPreset, stressTestActive, liveStressVelocity, isPaused, focusedBodyId]);

  const effectiveOrbitVelMultiplier = isPaused
    ? 0
    : (stressTestActive ? liveStressVelocity : orbitalVelocity) * timeScale;

  const orbitalRings: OrbitalRingSummary[] = useMemo(
    () =>
      PLANET_BLUEPRINTS.map((bp, idx) => {
        const hub = BRAIN_HUBS.find((h) => h.id === bp.hubId);
        return {
          hubId: bp.hubId,
          planetName: hub ? `HUB ${hub.num} · ${hub.label}` : bp.celestialAnalog,
          orbitColorToken: bp.orbitColorToken,
          radiusPx: 11 + idx * 5.8,
          effectiveVelocityKmS: bp.orbitalStats.meanVelocityKmS * effectiveOrbitVelMultiplier,
        };
      }),
    [effectiveOrbitVelMultiplier],
  );

  const handleHoverHubFromPanel = (hubId: string | null) => {
    hoveredHubRef.current = hubId;
    setHoveredHubId(hubId);
  };

  const handleClearOrbitLog = () => {
    setOrbitLog([]);
    try {
      window.localStorage.removeItem(SOLAR_ORBIT_LOG_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  // Sync external hub selection (Pathway / Brain Architecture Profile -> Solar Map)
  useEffect(() => {
    if (selectedHubId && hubFocusNonce > 0) {
      setFocusedBodyId(selectedHubId);
      setLastSelectedPlanetId(selectedHubId);
      setInspectedPlanetId(selectedHubId);
    }
  }, [selectedHubId, hubFocusNonce]);

  // Dismiss Inspect Planet popup on Escape key
  useEffect(() => {
    if (!inspectedPlanetId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInspectedPlanetId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inspectedPlanetId]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(
        Boolean(document.fullscreenElement && document.fullscreenElement === rootRef.current),
      );
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Shared GSAP focus transition helper: shifts camera focus smoothly between the Sun and any orbiting planet
  const runGsapFocusTransition = (targetBodyId: string, sunViewMode: SolarViewMode = viewMode) => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    if (prefersReducedMotion || !cam || !ctrl || isSwitchingOutRef.current) {
      if (targetBodyId === 'sun') {
        const sunCam = SOLAR_VIEW_CAMERA[sunViewMode];
        cameraCmdRef.current = {
          pos: sunCam.pos,
          target: sunCam.target,
          nonce: cameraCmdRef.current.nonce + 1,
        };
      }
      return;
    }

    activeGsapTlRef.current?.kill();
    gsapActiveRef.current = true;
    gsapFocusAnimRef.current = true;

    _gsapStartCam.copy(cam.position);
    _gsapStartTarget.copy(ctrl.target);

    const proxy = { t: 0 };
    const isGoingToSun = targetBodyId === 'sun';
    const sunCamSpec = SOLAR_VIEW_CAMERA[sunViewMode];
    if (isGoingToSun) {
      _gsapEndCam.set(...sunCamSpec.pos);
      _gsapEndTarget.set(...sunCamSpec.target);
    }

    const tl = gsap.timeline({
      onComplete: () => {
        gsapActiveRef.current = false;
        gsapFocusAnimRef.current = false;
        activeGsapTlRef.current = null;
      },
    });

    tl.to(proxy, {
      t: 1,
      duration: isGoingToSun ? 1.0 : 1.05,
      ease: 'power3.inOut',
      onUpdate: () => {
        const p = proxy.t;
        if (!isGoingToSun) {
          const tracker = planetTrackerRef.current.find((t) => t.hubId === targetBodyId);
          if (tracker) {
            tracker.planetGroup.parent?.updateMatrixWorld(true);
            tracker.planetGroup.getWorldPosition(_gsapEndTarget);
            _radialScratch.copy(_gsapEndTarget).normalize();
            const standOff = Math.max(3.6, tracker.planetRadius * 6.5);
            _gsapEndCam.copy(_gsapEndTarget).addScaledVector(_radialScratch, standOff);
            _gsapEndCam.y += standOff * 0.42;
          }
        }
        // Subtle vertical orbital arc keeps camera gliding cleanly over the ecliptic plane
        const arcLift = Math.sin(p * Math.PI) * (isGoingToSun ? 1.5 : 1.75);
        cam.position.lerpVectors(_gsapStartCam, _gsapEndCam, p);
        cam.position.y += arcLift;
        ctrl.target.lerpVectors(_gsapStartTarget, _gsapEndTarget, p);
        ctrl.update();
      },
    });

    activeGsapTlRef.current = tl;
  };

  const stopCinematicTour = () => {
    const wasActive = cinematicTourRef.current;
    cinematicTourRef.current = false;
    setCinematicTour(false);
    tourTlRef.current?.kill();
    tourTlRef.current = null;
    if (tourReducedTimerRef.current) {
      window.clearTimeout(tourReducedTimerRef.current);
      tourReducedTimerRef.current = 0;
    }
    if (wasActive && !isSwitchingOutRef.current) {
      gsapActiveRef.current = false;
      gsapFocusAnimRef.current = false;
      activeGsapTlRef.current = null;
    }
  };

  const computeTourStopPose = (
    stop: CinematicTourStop,
    orbitDriftRad: number,
    outCam: THREE.Vector3,
    outTarget: THREE.Vector3,
  ) => {
    if (stop.focusBodyId === 'sun' && 'cameraPos' in stop) {
      outTarget.set(...stop.targetPos);
      const ca = Math.cos(orbitDriftRad);
      const sa = Math.sin(orbitDriftRad);
      const sx = stop.cameraPos[0];
      const sy = stop.cameraPos[1];
      const sz = stop.cameraPos[2];
      outCam.set(sx * ca - sz * sa, sy, sx * sa + sz * ca);
      return;
    }

    const tracker = planetTrackerRef.current.find((t) => t.hubId === stop.focusBodyId);
    if (!tracker || !('standOffMul' in stop)) {
      outTarget.set(0, 0, 0);
      outCam.set(0, 14.5, 25.5);
      return;
    }
    tracker.planetGroup.parent?.updateMatrixWorld(true);
    tracker.planetGroup.getWorldPosition(outTarget);
    _tourRadial.set(outTarget.x, 0, outTarget.z);
    if (_tourRadial.lengthSq() < 1e-4) {
      _tourRadial.set(0, 0, 1);
    } else {
      _tourRadial.normalize();
    }
    const rotAng = stop.azimuthLead + orbitDriftRad;
    const ca = Math.cos(rotAng);
    const sa = Math.sin(rotAng);
    const rx = _tourRadial.x * ca - _tourRadial.z * sa;
    const rz = _tourRadial.x * sa + _tourRadial.z * ca;
    _tourRadial.set(rx, 0, rz);

    const standOff = Math.max(3.4, tracker.planetRadius * stop.standOffMul);
    outCam.copy(outTarget).addScaledVector(_tourRadial, standOff);
    outCam.y += standOff * stop.elevFrac;
  };

  const runTourStep = (stepIndex: number) => {
    if (!cinematicTourRef.current || isSwitchingOutRef.current) return;
    const idx =
      ((stepIndex % CINEMATIC_TOUR_STOPS.length) + CINEMATIC_TOUR_STOPS.length) %
      CINEMATIC_TOUR_STOPS.length;
    const stop = CINEMATIC_TOUR_STOPS[idx];
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;

    setCinematicTourStepIndex(idx);
    setFocusedBodyId(stop.focusBodyId);
    focusedBodyRef.current = stop.focusBodyId;
    if (stop.focusBodyId !== 'sun') {
      setLastSelectedPlanetId(stop.focusBodyId);
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      computeTourStopPose(stop, 0, _tourEndCam, _tourEndTarget);
      cam.position.copy(_tourEndCam);
      ctrl.target.copy(_tourEndTarget);
      ctrl.update();
      tourReducedTimerRef.current = window.setTimeout(() => {
        runTourStep(idx + 1);
      }, 2800);
      return;
    }

    activeGsapTlRef.current?.kill();
    tourTlRef.current?.kill();
    gsapActiveRef.current = true;
    gsapFocusAnimRef.current = true;

    _tourStartCam.copy(cam.position);
    _tourStartTarget.copy(ctrl.target);

    const flightProxy = { t: 0 };
    const holdProxy = { h: 0 };

    const tl = gsap.timeline({
      onComplete: () => {
        if (cinematicTourRef.current && !isSwitchingOutRef.current) {
          runTourStep(idx + 1);
        }
      },
    });

    tl.to(flightProxy, {
      t: 1,
      duration: stop.duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (!cinematicTourRef.current) return;
        const p = flightProxy.t;
        computeTourStopPose(stop, 0, _tourEndCam, _tourEndTarget);
        const arcLift = Math.sin(p * Math.PI) * (stop.focusBodyId === 'sun' ? 1.6 : 1.9);
        cam.position.lerpVectors(_tourStartCam, _tourEndCam, p);
        cam.position.y += arcLift;
        ctrl.target.lerpVectors(_tourStartTarget, _tourEndTarget, p);
        ctrl.update();
      },
    });

    tl.to(holdProxy, {
      h: 1,
      duration: stop.hold,
      ease: 'none',
      onUpdate: () => {
        if (!cinematicTourRef.current) return;
        computeTourStopPose(stop, holdProxy.h * 0.22, _tourEndCam, _tourEndTarget);
        cam.position.copy(_tourEndCam);
        ctrl.target.copy(_tourEndTarget);
        ctrl.update();
      },
    });

    tourTlRef.current = tl;
    activeGsapTlRef.current = tl;
  };

  const handleToggleCinematicTour = () => {
    if (cinematicTourRef.current) {
      stopCinematicTour();
      return;
    }
    setInspectedPlanetId(null);
    followPlanetRef.current = false;
    setFollowPlanet(false);
    autoRotateRef.current = false;
    setAutoRotate(false);
    cinematicTourRef.current = true;
    setCinematicTour(true);
    runTourStep(0);
  };

  const handleToggleFullscreen = async () => {
    const el = rootRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  };

  const handleSelectView = (mode: SolarViewMode) => {
    stopCinematicTour();
    setViewMode(mode);
    setFocusedBodyId('sun');
    setInspectedPlanetId(null);
    followPlanetRef.current = false;
    setFollowPlanet(false);
    runGsapFocusTransition('sun', mode);
  };

  const handleFocusBodyChange = (nextId: string) => {
    stopCinematicTour();
    setFocusedBodyId(nextId);
    if (nextId === 'sun') {
      setInspectedPlanetId(null);
      followPlanetRef.current = false;
      setFollowPlanet(false);
      runGsapFocusTransition('sun', viewMode);
    } else {
      setLastSelectedPlanetId(nextId);
      setInspectedPlanetId(nextId);
      onSelectHub?.(nextId);
      runGsapFocusTransition(nextId, viewMode);
    }
  };

  const handleToggleHeliocentricView = () => {
    stopCinematicTour();
    if (focusedBodyId !== 'sun') {
      // Currently focused on a planet -> GSAP transition back to Heliocentric Sun view
      setFocusedBodyId('sun');
      setInspectedPlanetId(null);
      followPlanetRef.current = false;
      setFollowPlanet(false);
      runGsapFocusTransition('sun', viewMode);
    } else {
      // Currently in Heliocentric Sun view -> GSAP transition onto the selected planet
      const targetId = lastSelectedPlanetId || 'enterprise';
      setFocusedBodyId(targetId);
      setInspectedPlanetId(targetId);
      onSelectHub?.(targetId);
      runGsapFocusTransition(targetId, viewMode);
    }
  };

  const handleToggleFollowPlanet = () => {
    stopCinematicTour();
    if (!followPlanet) {
      const targetId = focusedBodyId !== 'sun' ? focusedBodyId : lastSelectedPlanetId || 'enterprise';
      followPlanetRef.current = true;
      setFollowPlanet(true);
      if (focusedBodyId === 'sun') {
        setFocusedBodyId(targetId);
        setLastSelectedPlanetId(targetId);
        setInspectedPlanetId(targetId);
        onSelectHub?.(targetId);
        runGsapFocusTransition(targetId, viewMode);
      }
    } else {
      followPlanetRef.current = false;
      setFollowPlanet(false);
    }
  };

  const handleTriggerStressTest = () => {
    if (isPaused) {
      isPausedRef.current = false;
      setIsPaused(false);
    }
    stressElapsedRef.current = stressActiveRef.current ? STRESS_RAMP_UP_SEC : 0;
    stressActiveRef.current = true;
    stressSurgeVelRef.current = orbitalVelocityRef.current;
    setStressTestActive(true);
    setLiveStressVelocity(
      stressElapsedRef.current >= STRESS_RAMP_UP_SEC
        ? STRESS_TEST_VELOCITY
        : Math.max(orbitalVelocityRef.current, 1.0),
    );
  };

  const handleCycleInspectedPlanet = (direction: -1 | 1) => {
    const currentIdx = PLANET_BLUEPRINTS.findIndex((p) => p.hubId === inspectedPlanetId);
    const nextIdx =
      currentIdx < 0
        ? 0
        : (currentIdx + direction + PLANET_BLUEPRINTS.length) % PLANET_BLUEPRINTS.length;
    const nextHubId = PLANET_BLUEPRINTS[nextIdx].hubId;
    setFocusedBodyId(nextHubId);
    setLastSelectedPlanetId(nextHubId);
    setInspectedPlanetId(nextHubId);
    onSelectHub?.(nextHubId);
    runGsapFocusTransition(nextHubId, viewMode);
  };

  const handleRandomizeOrbits = () => {
    setOrbitRadiusScales((prev) => {
      const nextScales = generateJitteredOrbitScales(prev);
      setOrbitLayout((layoutPrev) =>
        layoutPrev.map((entry, idx) => ({
          ...entry,
          radiusScale: nextScales[idx] ?? entry.radiusScale,
        })),
      );
      return nextScales;
    });
    setOrbitJitterCount((c) => c + 1);
  };

  const handleSelectConfigurationPreset = (preset: SolarConfigurationPreset) => {
    const nextNonce = presetSeedNonce + 1;
    setPresetSeedNonce(nextNonce);
    setConfigurationPreset(preset);
    const nextLayout = generateConfigurationLayout(preset, nextNonce);
    setOrbitLayout(nextLayout);
    setOrbitRadiusScales(nextLayout.map((e) => e.radiusScale));
    if (preset === 'stable-circular') {
      setOrbitJitterCount(0);
    }
  };

  const handleResetMap = () => {
    stopCinematicTour();
    setViewMode('overview');
    setFocusedBodyId('sun');
    setInspectedPlanetId(null);
    followPlanetRef.current = false;
    setFollowPlanet(false);
    stressActiveRef.current = false;
    stressElapsedRef.current = 0;
    stressSurgeVelRef.current = DEFAULT_ORBITAL_VELOCITY;
    setStressTestActive(false);
    setLiveStressVelocity(DEFAULT_ORBITAL_VELOCITY);
    setIsPaused(false);
    setOrbitalVelocity(DEFAULT_ORBITAL_VELOCITY);
    setOrbitalInclinationDeg(DEFAULT_ORBITAL_INCLINATION_DEG);
    setTimeScale(DEFAULT_TIME_SCALE);
    setShowOrbits(true);
    setConfigurationPreset('stable-circular');
    setOrbitLayout(STABLE_CIRCULAR_LAYOUT);
    setOrbitRadiusScales(NOMINAL_ORBIT_SCALES);
    setOrbitJitterCount(0);
    setAutoRotate(false);
    setDayNightCycle(false);
    setShowConstellations(false);
    showResonanceRef.current = false;
    setShowResonance(false);
    setActiveResonanceCount(0);
    setBloomIntensity(1.0);
    setAtmosphericScattering(false);
    collisionMonitorRef.current?.reset();
    lastSeenIntersectionFlashIdRef.current = 0;
    setGravityWellHud({ intersectionCount: 0, latestPairLabel: null });
    setGravityWellAlert(null);
    cameraCmdRef.current = {
      pos: SOLAR_VIEW_CAMERA.overview.pos,
      target: SOLAR_VIEW_CAMERA.overview.target,
      nonce: cameraCmdRef.current.nonce + 1,
    };
  };

  // GSAP exit morph when switching from Solar System ecliptic back to Spiral Galaxy
  const handleRequestAlternativeSystem = () => {
    if (!onToggleAlternativeSystem || isSwitchingOutRef.current) return;
    stopCinematicTour();
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    const stageEl = rootRef.current;

    setInspectedPlanetId(null);
    if (prefersReducedMotion || !cam || !ctrl) {
      onToggleAlternativeSystem();
      return;
    }

    isSwitchingOutRef.current = true;
    gsapActiveRef.current = true;
    activeGsapTlRef.current?.kill();

    const offset = cam.position.clone().sub(ctrl.target);
    const sph = new THREE.Spherical().setFromVector3(offset);
    const proxy = {
      radius: sph.radius,
      phi: sph.phi,
      theta: sph.theta,
      tx: ctrl.target.x,
      ty: ctrl.target.y,
      tz: ctrl.target.z,
      fov: cam.fov,
    };

    const tl = gsap.timeline({
      onComplete: () => {
        activeGsapTlRef.current = null;
        onToggleAlternativeSystem();
      },
    });
    tl.to(
      proxy,
      {
        radius: 26.5,
        phi: 0.28,
        theta: sph.theta + 0.32,
        tx: 0,
        ty: 0,
        tz: 0,
        fov: 50,
        duration: 0.54,
        ease: 'power2.inOut',
        onUpdate: () => {
          sph.set(proxy.radius, proxy.phi, proxy.theta);
          cam.position.setFromSpherical(sph).add(ctrl.target.set(proxy.tx, proxy.ty, proxy.tz));
          cam.fov = proxy.fov;
          cam.updateProjectionMatrix();
          ctrl.update();
        },
      },
      0,
    );
    if (stageEl) {
      tl.to(stageEl, { opacity: 0, duration: 0.24, ease: 'power2.in' }, 0.32);
    }
    activeGsapTlRef.current = tl;
  };

  const focusOptions = useMemo(
    () => [
      { id: 'sun', label: 'Spenta Solar Core (0.00 AU)' },
      ...PLANET_BLUEPRINTS.map((bp, idx) => {
        const hub = BRAIN_HUBS.find((h) => h.id === bp.hubId);
        const scale = orbitRadiusScales[idx] ?? 1.0;
        return {
          id: bp.hubId,
          label: `HUB ${hub?.num ?? ''} · ${hub?.label ?? bp.hubId} (${formatScaledAu(bp, scale)})`,
        };
      }),
    ],
    [orbitRadiusScales],
  );

  const activeBlueprintIndex = useMemo(
    () => PLANET_BLUEPRINTS.findIndex((b) => b.hubId === focusedBodyId),
    [focusedBodyId],
  );
  const activeBlueprint = activeBlueprintIndex >= 0 ? PLANET_BLUEPRINTS[activeBlueprintIndex] : null;
  const activeOrbitScale =
    activeBlueprintIndex >= 0 ? (orbitRadiusScales[activeBlueprintIndex] ?? 1.0) : 1.0;

  const activeHubMeta = useMemo(
    () => BRAIN_HUBS.find((h) => h.id === (hoveredHubId ?? focusedBodyId)) ?? null,
    [hoveredHubId, focusedBodyId],
  );

  const inspectedBlueprintIndex = useMemo(
    () => (inspectedPlanetId ? PLANET_BLUEPRINTS.findIndex((b) => b.hubId === inspectedPlanetId) : -1),
    [inspectedPlanetId],
  );
  const inspectedBlueprint =
    inspectedBlueprintIndex >= 0 ? PLANET_BLUEPRINTS[inspectedBlueprintIndex] : null;
  const inspectedOrbitScale =
    inspectedBlueprintIndex >= 0 ? (orbitRadiusScales[inspectedBlueprintIndex] ?? 1.0) : 1.0;
  const inspectedHubMeta = useMemo(
    () => (inspectedPlanetId ? BRAIN_HUBS.find((h) => h.id === inspectedPlanetId) ?? null : null),
    [inspectedPlanetId],
  );
  const inspectedHubApps = useMemo(
    () => (inspectedPlanetId ? SPENTA_APPS.filter((a) => a.hubId === inspectedPlanetId) : []),
    [inspectedPlanetId],
  );
  const inspectedScatteringProfile = useMemo(
    () => (inspectedBlueprint ? buildAtmosphericScatteringProfile(inspectedBlueprint) : null),
    [inspectedBlueprint],
  );
  const activeScatteringProfileRef = useRef(inspectedScatteringProfile);
  useEffect(() => {
    activeScatteringProfileRef.current = inspectedScatteringProfile;
  }, [inspectedScatteringProfile]);

  const activeGasOverlayHubId =
    inspectedPlanetId ??
    (focusedBodyId !== 'sun'
      ? focusedBodyId
      : hoveredHubId ?? (selectedHubId && selectedHubId !== 'sun' ? selectedHubId : null));

  const selectedGasOverlayBlueprint = useMemo(
    () =>
      activeGasOverlayHubId
        ? PLANET_BLUEPRINTS.find((b) => b.hubId === activeGasOverlayHubId) ?? null
        : null,
    [activeGasOverlayHubId],
  );

  const allPlanetGasProfiles = useMemo(
    () =>
      PLANET_BLUEPRINTS.map((bp) => ({
        hubId: bp.hubId,
        profile: getPrimaryGasMixBlendProfile(bp),
      })),
    [],
  );

  const selectedPrimaryGasProfile = useMemo(
    () =>
      selectedGasOverlayBlueprint
        ? getPrimaryGasMixBlendProfile(selectedGasOverlayBlueprint)
        : null,
    [selectedGasOverlayBlueprint],
  );

  useEffect(() => {
    activeGasOverlayHubRef.current = activeGasOverlayHubId;
    activePrimaryGasSymbolRef.current = selectedPrimaryGasProfile?.gasSymbol ?? null;
  }, [activeGasOverlayHubId, selectedPrimaryGasProfile]);

  const calloutBlueprintIndex = useMemo(
    () => (callout ? PLANET_BLUEPRINTS.findIndex((b) => b.hubId === callout.hubId) : -1),
    [callout],
  );
  const calloutBlueprint =
    calloutBlueprintIndex >= 0 ? PLANET_BLUEPRINTS[calloutBlueprintIndex] : null;
  const calloutOrbitScale =
    calloutBlueprintIndex >= 0 ? (orbitRadiusScales[calloutBlueprintIndex] ?? 1.0) : 1.0;
  const calloutHubMeta = useMemo(
    () => (callout ? BRAIN_HUBS.find((h) => h.id === callout.hubId) ?? null : null),
    [callout],
  );
  const calloutApps = useMemo(
    () => (callout ? SPENTA_APPS.filter((a) => a.hubId === callout.hubId) : []),
    [callout],
  );

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let currentWidth = Math.max(container.clientWidth, 320);
    let currentHeight = Math.max(container.clientHeight, 360);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    const glCtx = renderer.getContext();
    const debugExt = glCtx.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = debugExt
      ? String(glCtx.getParameter(debugExt.UNMASKED_RENDERER_WEBGL) || '')
      : '';
    const isSoftwareWebGL = /SwiftShader|llvmpipe|Software|Basic Render|ANGLE.*Microsoft/i.test(
      rendererStr,
    );
    const isWebGL2 =
      typeof WebGL2RenderingContext !== 'undefined' && glCtx instanceof WebGL2RenderingContext;

    const dpr = Math.min(window.devicePixelRatio || 1, isSoftwareWebGL ? 1 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(currentWidth, currentHeight, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.info.autoReset = false;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#040814');

    const mountCamSpec = transitionFromSpiralRef.current
      ? SOLAR_VIEW_CAMERA.ecliptic
      : SOLAR_VIEW_CAMERA[viewModeRef.current] ?? SOLAR_VIEW_CAMERA.overview;

    const camera = new THREE.PerspectiveCamera(44, currentWidth / currentHeight, 0.1, 220);
    camera.position.set(...mountCamSpec.pos);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.enablePan = false;
    controls.minDistance = 3.6;
    controls.maxDistance = 46.0;
    controls.maxPolarAngle = Math.PI * 0.86;
    controls.minPolarAngle = Math.PI * 0.08;
    controls.target.set(...mountCamSpec.target);
    controlsRef.current = controls;

    // GPU-only Post-Processing (UnrealBloomPass skipped on Software WebGL)
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (!isSoftwareWebGL) {
      composer = new EffectComposer(renderer);
      composer.setPixelRatio(dpr);
      composer.setSize(currentWidth, currentHeight);
      const renderPass = new RenderPass(scene, camera);
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(currentWidth, currentHeight),
        0.45 * bloomIntensityRef.current,
        0.42 + bloomIntensityRef.current * 0.22,
        0.72,
      );
      composer.addPass(renderPass);
      composer.addPass(bloomPass);
    }

    // Phase B GSAP camera morph: Spiral Galaxy top-down perspective -> Solar System ecliptic plane
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (transitionFromSpiralRef.current && !prefersReducedMotion) {
      gsapActiveRef.current = true;
      const eclipticTargetSph = new THREE.Spherical().setFromVector3(
        new THREE.Vector3(...SOLAR_VIEW_CAMERA.ecliptic.pos),
      );
      const entrySph = new THREE.Spherical(31.2, 0.12, -0.42);
      camera.position.setFromSpherical(entrySph);
      camera.fov = 52;
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.update();

      const stageEl = rootRef.current;
      if (stageEl) {
        gsap.set(stageEl, { opacity: 0 });
      }
      const proxy = {
        radius: entrySph.radius,
        phi: entrySph.phi,
        theta: entrySph.theta,
        fov: 52,
      };
      const tl = gsap.timeline({
        onComplete: () => {
          gsapActiveRef.current = false;
          activeGsapTlRef.current = null;
        },
      });
      if (stageEl) {
        tl.to(stageEl, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0);
      }
      tl.to(
        proxy,
        {
          radius: eclipticTargetSph.radius,
          phi: eclipticTargetSph.phi,
          theta: eclipticTargetSph.theta,
          fov: 44,
          duration: 1.35,
          ease: 'power3.inOut',
          onUpdate: () => {
            entrySph.set(proxy.radius, proxy.phi, proxy.theta);
            camera.position.setFromSpherical(entrySph);
            controls.target.set(0, 0, 0);
            camera.fov = proxy.fov;
            camera.updateProjectionMatrix();
            controls.update();
          },
        },
        0,
      );
      activeGsapTlRef.current = tl;
    }

    const ambientLight = new THREE.AmbientLight('#89A8DC', 0.42);
    scene.add(ambientLight);
    const sunLight = new THREE.PointLight('#FFF5E4', 5.2, 95, 0.32);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    const rimFill = new THREE.DirectionalLight('#488EFF', 0.55);
    rimFill.position.set(-18, 12, -16);
    scene.add(rimFill);
    // Real-time rotating solar directional key light for dramatic planetary Day/Night terminators
    const cycleDirLight = new THREE.DirectionalLight('#FFF5E4', 0);
    cycleDirLight.position.set(28, 6.8, 0);
    scene.add(cycleDirLight);
    scene.add(cycleDirLight.target);

    const disposableGeos: THREE.BufferGeometry[] = [];
    const disposableMats: THREE.Material[] = [];
    const disposableTex: THREE.Texture[] = [];

    // 1. Deep-Space Celestial Star Dome
    const rand = mulberry32(20260711);
    const starCount = 3200;
    const starPos = new Float32Array(starCount * 3);
    const starCol = new Float32Array(starCount * 3);
    const tmpCol = new THREE.Color();
    for (let i = 0; i < starCount; i++) {
      const r = 46 + rand() * 58;
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(2 * rand() - 1);
      starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      starPos[i * 3 + 1] = r * Math.cos(ph);
      starPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      const tint = rand();
      if (tint < 0.25) tmpCol.set('#C4D6F0');
      else if (tint < 0.45) tmpCol.set('#FFE0BB');
      else tmpCol.set('#F7FBFF');
      const b = 0.45 + rand() * 0.55;
      starCol[i * 3] = tmpCol.r * b;
      starCol[i * 3 + 1] = tmpCol.g * b;
      starCol[i * 3 + 2] = tmpCol.b * b;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.24,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      depthWrite: false,
    });
    scene.add(new THREE.Points(starGeo, starMat));
    disposableGeos.push(starGeo);
    disposableMats.push(starMat);

    const computedSolarStyle = rootRef.current ? window.getComputedStyle(rootRef.current) : null;
    const resolveSolarTokenColor = (token: string, fallbackHex: string): THREE.Color => {
      const raw = computedSolarStyle?.getPropertyValue(token).trim();
      if (!raw) return new THREE.Color(fallbackHex);
      const rgbaMatch = raw.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
      if (rgbaMatch) {
        return new THREE.Color(
          Number(rgbaMatch[1]) / 255,
          Number(rgbaMatch[2]) / 255,
          Number(rgbaMatch[3]) / 255,
        );
      }
      return new THREE.Color(raw);
    };

    // 1b. Celestial Constellations (Subtle glowing line-segments & star halos using .solar-map-scope CSS tokens)
    const constellationGroup = new THREE.Group();
    constellationGroup.visible = showConstellationsRef.current;
    scene.add(constellationGroup);

    const cBlue = resolveSolarTokenColor('--solar-accent-blue', '#488EFF');
    const cCyan = resolveSolarTokenColor('--solar-border-cyan', '#68E4EF');
    const cAmber = resolveSolarTokenColor('--solar-accent-amber-fg', '#FFE0BB');
    const cBright = resolveSolarTokenColor('--solar-fg-bright', '#F7FBFF');

    const { lineGeo: constLineGeo, anchorGeo: constAnchorGeo } = buildConstellationBuffers(
      64,
      cBlue,
      cCyan,
      cAmber,
      cBright,
    );
    disposableGeos.push(constLineGeo, constAnchorGeo);

    const constLineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const constGlowMat = new THREE.LineBasicMaterial({
      color: cCyan,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const constLineMesh = new THREE.LineSegments(constLineGeo, constLineMat);
    const constGlowMesh = new THREE.LineSegments(constLineGeo, constGlowMat);
    constGlowMesh.scale.setScalar(1.012);
    constellationGroup.add(constLineMesh, constGlowMesh);
    disposableMats.push(constLineMat, constGlowMat);

    // Subtle permanent star points for constellation anchors + additive halo glow when Show Constellations is active
    const starHaloTex = createStarHaloTexture();
    disposableTex.push(starHaloTex);
    const constBaseStarMat = new THREE.PointsMaterial({
      size: 0.42,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      sizeAttenuation: true,
      depthWrite: false,
    });
    scene.add(new THREE.Points(constAnchorGeo, constBaseStarMat));
    disposableMats.push(constBaseStarMat);

    const constStarGlowMat = new THREE.PointsMaterial({
      size: 1.55,
      map: starHaloTex,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false,
    });
    constellationGroup.add(new THREE.Points(constAnchorGeo, constStarGlowMat));
    disposableMats.push(constStarGlowMat);

    // 2. Central Spenta Solar Core
    const sunGeo = new THREE.SphereGeometry(1.52, 48, 48);
    const sunUniforms = {
      uTime: { value: 0 },
      uOpaPass: { value: hitlRef.current >= 0.88 ? 1.0 : 0.0 },
      uBloom: { value: bloomIntensityRef.current },
    };
    const sunMat = new THREE.ShaderMaterial({
      vertexShader: SOLAR_PHOTOSPHERE_VERT,
      fragmentShader: SOLAR_PHOTOSPHERE_FRAG,
      uniforms: sunUniforms,
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.userData = { bodyId: 'sun' };
    scene.add(sunMesh);
    disposableGeos.push(sunGeo);
    disposableMats.push(sunMat);

    const coronaGeo = new THREE.PlaneGeometry(6.8, 6.8);
    const coronaUniforms = {
      uTime: { value: 0 },
      uOpaPass: { value: hitlRef.current >= 0.88 ? 1.0 : 0.0 },
      uBloom: { value: bloomIntensityRef.current },
    };
    const coronaMat = new THREE.ShaderMaterial({
      vertexShader: CORONA_HALO_VERT,
      fragmentShader: CORONA_HALO_FRAG,
      uniforms: coronaUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    scene.add(coronaMesh);
    disposableGeos.push(coronaGeo);
    disposableMats.push(coronaMat);

    // 3. Main Sovereign Data Asteroid Belt (grouped for smooth coupled inclination)
    const beltGroup = new THREE.Group();
    scene.add(beltGroup);
    const beltCount = 1500;
    const beltPos = new Float32Array(beltCount * 3);
    const beltCol = new Float32Array(beltCount * 3);
    for (let i = 0; i < beltCount; i++) {
      const a = rand() * Math.PI * 2;
      const r = 8.75 + rand() * 1.15;
      beltPos[i * 3] = Math.cos(a) * r;
      beltPos[i * 3 + 1] = (rand() - 0.5) * 0.38;
      beltPos[i * 3 + 2] = Math.sin(a) * r;
      const tone = 0.55 + rand() * 0.45;
      tmpCol.set(i % 4 === 0 ? '#FFB563' : '#97C4FF');
      beltCol[i * 3] = tmpCol.r * tone;
      beltCol[i * 3 + 1] = tmpCol.g * tone;
      beltCol[i * 3 + 2] = tmpCol.b * tone;
    }
    const beltGeo = new THREE.BufferGeometry();
    beltGeo.setAttribute('position', new THREE.BufferAttribute(beltPos, 3));
    beltGeo.setAttribute('color', new THREE.BufferAttribute(beltCol, 3));
    const beltMat = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const beltPoints = new THREE.Points(beltGeo, beltMat);
    beltGroup.add(beltPoints);
    disposableGeos.push(beltGeo);
    disposableMats.push(beltMat);

    // 3b. Faint Dashed Flat Ecliptic Reference Ring (helps read 3D inclination tilt clearly)
    const eclipticRefPts: THREE.Vector3[] = [];
    const eclipticRefSegs = 160;
    const eclipticRefRadius = 19.6;
    for (let s = 0; s <= eclipticRefSegs; s++) {
      const theta = (s / eclipticRefSegs) * Math.PI * 2;
      eclipticRefPts.push(
        new THREE.Vector3(Math.cos(theta) * eclipticRefRadius, 0, Math.sin(theta) * eclipticRefRadius),
      );
    }
    const eclipticRefGeo = new THREE.BufferGeometry().setFromPoints(eclipticRefPts);
    const eclipticRefMat = new THREE.LineDashedMaterial({
      color: '#488EFF',
      transparent: true,
      opacity: 0.14,
      dashSize: 0.65,
      gapSize: 0.55,
      depthWrite: false,
    });
    const eclipticRefLine = new THREE.Line(eclipticRefGeo, eclipticRefMat);
    eclipticRefLine.computeLineDistances();
    scene.add(eclipticRefLine);
    disposableGeos.push(eclipticRefGeo);
    disposableMats.push(eclipticRefMat);

    // 4. 8 Sovereign Planetary Hub Worlds + Token-Colored Dashed Elliptical Orbits + Module Moons + Wake Trails
    const resolveSolarOrbitColor = (token: string, fallback: string) =>
      resolveSolarTokenColor(token, fallback);

    interface PlanetRuntime {
      spec: PlanetBlueprint;
      orbitPivot: THREE.Group;
      orbitLine: THREE.Line;
      orbitMat: THREE.LineDashedMaterial;
      orbitBaseColor: THREE.Color;
      planetGroup: THREE.Group;
      planetMesh: THREE.Mesh;
      planetMat: THREE.MeshStandardMaterial;
      atmoMat: THREE.MeshBasicMaterial;
      selectRing: THREE.Mesh;
      selectRingMat: THREE.MeshBasicMaterial;
      wakeLine: THREE.Line;
      wakeGeo: THREE.BufferGeometry;
      wakeMat: THREE.LineBasicMaterial;
      moons: {
        appId: string;
        mesh: THREE.Mesh;
        mat: THREE.MeshStandardMaterial;
        radius: number;
        speed: number;
        phase: number;
        tilt: number;
      }[];
      angle: number;
      currentRadiusScale: number;
      currentEccentricity: number;
      currentArgPeriapsis: number;
      currentTiltOffsetZ: number;
      currentTiltOffsetX: number;
    }

    const planetRuntimes: PlanetRuntime[] = [];
    const pickables: THREE.Object3D[] = [sunMesh];
    const sharedMoonGeo = new THREE.SphereGeometry(0.085, 12, 12);
    disposableGeos.push(sharedMoonGeo);

    const initInclRad = THREE.MathUtils.degToRad(orbitalInclinationRef.current);
    const initLayout = orbitLayoutRef.current;

    PLANET_BLUEPRINTS.forEach((spec, idx) => {
      const entry = initLayout[idx] ?? STABLE_CIRCULAR_LAYOUT[idx];
      const orbitPivot = new THREE.Group();
      orbitPivot.rotation.order = 'ZXY';
      orbitPivot.rotation.z = initInclRad * spec.tiltWeight * spec.tiltSignZ + entry.tiltOffsetZ;
      orbitPivot.rotation.x =
        initInclRad * spec.tiltWeight * 0.48 * spec.tiltSignX + entry.tiltOffsetX;
      orbitPivot.rotation.y = entry.argPeriapsis;
      scene.add(orbitPivot);

      const orbitBaseColor = resolveSolarOrbitColor(spec.orbitColorToken, spec.accentHex);

      // Normalized reference circle scaled dynamically by (radiusScale, eccentricity) around focal Sun origin
      const orbitPts: THREE.Vector3[] = [];
      const segments = 160;
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        orbitPts.push(
          new THREE.Vector3(Math.cos(theta) * spec.orbitRadius, 0, Math.sin(theta) * spec.orbitRadius),
        );
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
      const orbitMat = new THREE.LineDashedMaterial({
        color: orbitBaseColor.clone(),
        transparent: true,
        opacity: 0.36,
        dashSize: 0.24 + spec.orbitRadius * 0.022,
        gapSize: 0.18 + spec.orbitRadius * 0.016,
        scale: 1,
        depthWrite: false,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitLine.computeLineDistances();
      const bScaleInit = Math.sqrt(Math.max(0.18, 1 - entry.eccentricity * entry.eccentricity));
      const aInit = spec.orbitRadius * entry.radiusScale;
      orbitLine.position.set(-aInit * entry.eccentricity, 0, 0);
      orbitLine.scale.set(entry.radiusScale, 1, entry.radiusScale * bScaleInit);
      orbitPivot.add(orbitLine);
      disposableGeos.push(orbitGeo);
      disposableMats.push(orbitMat);

      const wakeSegs = 28;
      const wakeBuf = new Float32Array((wakeSegs + 1) * 3);
      for (let w = 0; w <= wakeSegs; w++) {
        const lag = spec.initialAngle - (w / wakeSegs) * 0.55;
        wakeBuf[w * 3] = -aInit * entry.eccentricity + Math.cos(lag) * aInit;
        wakeBuf[w * 3 + 1] = 0;
        wakeBuf[w * 3 + 2] = Math.sin(lag) * aInit * bScaleInit;
      }
      const wakeGeo = new THREE.BufferGeometry();
      const wakeAttr = new THREE.BufferAttribute(wakeBuf, 3);
      wakeAttr.setUsage(THREE.DynamicDrawUsage);
      wakeGeo.setAttribute('position', wakeAttr);
      const wakeMat = new THREE.LineBasicMaterial({
        color: orbitBaseColor.clone(),
        transparent: true,
        opacity: 0.48,
        blending: THREE.AdditiveBlending,
      });
      const wakeLine = new THREE.Line(wakeGeo, wakeMat);
      orbitPivot.add(wakeLine);
      disposableGeos.push(wakeGeo);
      disposableMats.push(wakeMat);

      const planetGroup = new THREE.Group();
      orbitPivot.add(planetGroup);

      const planetTex = createSolarPlanetTexture(spec.baseHex, spec.bandHex, 4100 + idx * 97);
      disposableTex.push(planetTex);

      const planetGeo = new THREE.SphereGeometry(spec.planetRadius, 32, 32);
      const planetMat = new THREE.MeshStandardMaterial({
        map: planetTex,
        roughness: 0.58,
        metalness: 0.14,
        emissive: new THREE.Color(spec.baseHex),
        emissiveIntensity: 0.16,
      });
      const planetMesh = new THREE.Mesh(planetGeo, planetMat);
      planetMesh.userData = { hubId: spec.hubId };
      planetGroup.add(planetMesh);
      pickables.push(planetMesh);
      disposableGeos.push(planetGeo);
      disposableMats.push(planetMat);

      const atmoGeo = new THREE.SphereGeometry(spec.planetRadius * 1.13, 24, 24);
      const atmoMat = new THREE.MeshBasicMaterial({
        color: spec.accentHex,
        transparent: true,
        opacity: 0.14,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
      });
      planetGroup.add(new THREE.Mesh(atmoGeo, atmoMat));
      disposableGeos.push(atmoGeo);
      disposableMats.push(atmoMat);

      const selGeo = new THREE.RingGeometry(spec.planetRadius * 1.38, spec.planetRadius * 1.54, 48);
      const selectRingMat = new THREE.MeshBasicMaterial({
        color: '#FFB563',
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
      });
      const selectRing = new THREE.Mesh(selGeo, selectRingMat);
      selectRing.rotation.x = Math.PI * 0.5;
      planetGroup.add(selectRing);
      disposableGeos.push(selGeo);
      disposableMats.push(selectRingMat);

      if (spec.hasRings && spec.ringColorHex) {
        const ringGeo = new THREE.RingGeometry(
          spec.planetRadius * 1.42,
          spec.planetRadius * 2.38,
          64,
        );
        const posAttr = ringGeo.attributes.position as THREE.BufferAttribute;
        const uvAttr = ringGeo.attributes.uv as THREE.BufferAttribute;
        const v3 = new THREE.Vector3();
        for (let vi = 0; vi < posAttr.count; vi++) {
          v3.fromBufferAttribute(posAttr, vi);
          const distNorm =
            (v3.length() - spec.planetRadius * 1.42) / (spec.planetRadius * (2.38 - 1.42));
          uvAttr.setXY(vi, distNorm, 0.5);
        }
        const ringTex = createPlanetRingTexture(spec.ringColorHex);
        disposableTex.push(ringTex);
        const ringMat = new THREE.MeshBasicMaterial({
          map: ringTex,
          transparent: true,
          opacity: 0.82,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI * 0.42;
        ringMesh.rotation.y = 0.25;
        planetGroup.add(ringMesh);
        disposableGeos.push(ringGeo);
        disposableMats.push(ringMat);
      }

      const hubApps = SPENTA_APPS.filter((a) => a.hubId === spec.hubId);
      const moons = hubApps.map((app, mIdx) => {
        const mMat = new THREE.MeshStandardMaterial({
          color: '#C4D6F0',
          emissive: new THREE.Color('#68E4EF'),
          emissiveIntensity: 0.3,
          roughness: 0.4,
          metalness: 0.25,
        });
        disposableMats.push(mMat);
        const mMesh = new THREE.Mesh(sharedMoonGeo, mMat);
        planetGroup.add(mMesh);
        return {
          appId: app.id,
          mesh: mMesh,
          mat: mMat,
          radius: spec.planetRadius * (1.75 + mIdx * 0.45),
          speed: 1.15 + mIdx * 0.42,
          phase: mIdx * 2.1 + idx,
          tilt: (mIdx % 2 === 0 ? 1 : -1) * 0.26,
        };
      });

      planetRuntimes.push({
        spec,
        orbitPivot,
        orbitLine,
        orbitMat,
        orbitBaseColor,
        planetGroup,
        planetMesh,
        planetMat,
        atmoMat,
        selectRing,
        selectRingMat,
        wakeLine,
        wakeGeo,
        wakeMat,
        moons,
        angle: spec.initialAngle,
        currentRadiusScale: entry.radiusScale,
        currentEccentricity: entry.eccentricity,
        currentArgPeriapsis: entry.argPeriapsis,
        currentTiltOffsetZ: entry.tiltOffsetZ,
        currentTiltOffsetX: entry.tiltOffsetX,
      });
    });

    // 5. Orbital Resonance Pool (Pulsating Light Nodes at Orbit Intersections & Planetary Alignments)
    const MAX_RESONANCE_NODES = 24;
    const RES_SAMPLES = 44;
    const resonanceGroup = new THREE.Group();
    resonanceGroup.visible = showResonanceRef.current;
    scene.add(resonanceGroup);

    const resonanceTex = createResonanceNodeTexture();
    disposableTex.push(resonanceTex);
    const sharedResCoreGeo = new THREE.SphereGeometry(0.115, 16, 16);
    const sharedResHaloGeo = new THREE.RingGeometry(0.21, 0.31, 32);
    disposableGeos.push(sharedResCoreGeo, sharedResHaloGeo);

    interface ResonanceNodeRuntime {
      group: THREE.Group;
      coreMat: THREE.MeshBasicMaterial;
      haloMesh: THREE.Mesh;
      haloMat: THREE.MeshBasicMaterial;
      sprite: THREE.Sprite;
      spriteMat: THREE.SpriteMaterial;
    }

    const resonancePool: ResonanceNodeRuntime[] = Array.from(
      { length: MAX_RESONANCE_NODES },
      () => {
        const g = new THREE.Group();
        g.visible = false;
        const coreMat = new THREE.MeshBasicMaterial({
          color: '#FFFFFF',
          transparent: true,
          opacity: 0,
        });
        const coreMesh = new THREE.Mesh(sharedResCoreGeo, coreMat);
        const haloMat = new THREE.MeshBasicMaterial({
          color: '#68E4EF',
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const haloMesh = new THREE.Mesh(sharedResHaloGeo, haloMat);
        haloMesh.rotation.x = Math.PI / 2;
        const spriteMat = new THREE.SpriteMaterial({
          map: resonanceTex,
          color: '#68E4EF',
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(1.25, 1.25, 1);
        g.add(coreMesh, haloMesh, sprite);
        resonanceGroup.add(g);
        disposableMats.push(coreMat, haloMat, spriteMat);
        return { group: g, coreMat, haloMesh, haloMat, sprite, spriteMat };
      },
    );

    const resBeamMaxVerts = MAX_RESONANCE_NODES * 4;
    const resBeamPosBuf = new Float32Array(resBeamMaxVerts * 3);
    const resBeamColBuf = new Float32Array(resBeamMaxVerts * 3);
    const resBeamGeo = new THREE.BufferGeometry();
    const resBeamPosAttr = new THREE.BufferAttribute(resBeamPosBuf, 3);
    resBeamPosAttr.setUsage(THREE.DynamicDrawUsage);
    const resBeamColAttr = new THREE.BufferAttribute(resBeamColBuf, 3);
    resBeamColAttr.setUsage(THREE.DynamicDrawUsage);
    resBeamGeo.setAttribute('position', resBeamPosAttr);
    resBeamGeo.setAttribute('color', resBeamColAttr);
    resBeamGeo.setDrawRange(0, 0);
    const resBeamMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const resBeamLines = new THREE.LineSegments(resBeamGeo, resBeamMat);
    resBeamLines.frustumCulled = false;
    resonanceGroup.add(resBeamLines);
    disposableGeos.push(resBeamGeo);
    disposableMats.push(resBeamMat);

    // Pre-allocated scratch buffers for zero-GC resonance computation
    const orbitSamplePoints: THREE.Vector3[][] = Array.from({ length: PLANET_BLUEPRINTS.length }, () =>
      Array.from({ length: RES_SAMPLES }, () => new THREE.Vector3()),
    );
    const planetWorldScratch: THREE.Vector3[] = Array.from(
      { length: PLANET_BLUEPRINTS.length },
      () => new THREE.Vector3(),
    );
    const planetRadMin = new Float32Array(PLANET_BLUEPRINTS.length);
    const planetRadMax = new Float32Array(PLANET_BLUEPRINTS.length);

    // 5b. Gravity-Well Collision & Orbital Path Intersection Flash Pool (always active in Solar mode)
    const MAX_GRAVITY_WELL_FLASHES = 12;
    const gravityWellGroup = new THREE.Group();
    scene.add(gravityWellGroup);
    const gravityWellTex = createGravityWellFlashTexture();
    disposableTex.push(gravityWellTex);
    const sharedGwInnerGeo = new THREE.RingGeometry(0.28, 0.37, 40);
    const sharedGwOuterGeo = new THREE.RingGeometry(0.52, 0.565, 40);
    disposableGeos.push(sharedGwInnerGeo, sharedGwOuterGeo);

    const gravityWellPool = Array.from({ length: MAX_GRAVITY_WELL_FLASHES }, () => {
      const g = new THREE.Group();
      g.visible = false;
      const innerMat = new THREE.MeshBasicMaterial({
        color: '#A5F3FC',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const innerMesh = new THREE.Mesh(sharedGwInnerGeo, innerMat);
      const outerMat = new THREE.MeshBasicMaterial({
        color: '#488EFF',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const outerMesh = new THREE.Mesh(sharedGwOuterGeo, outerMat);
      const spriteMat = new THREE.SpriteMaterial({
        map: gravityWellTex,
        color: '#68E4EF',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(spriteMat);
      g.add(innerMesh, outerMesh, sprite);
      gravityWellGroup.add(g);
      disposableMats.push(innerMat, outerMat, spriteMat);
      return { group: g, innerMesh, innerMat, outerMesh, outerMat, sprite, spriteMat };
    });

    const collisionMonitor = new SolarOrbitCollisionMonitor();
    collisionMonitorRef.current = collisionMonitor;
    const collisionBodies: OrbitSampleBody[] = planetRuntimes.map((pr, idx) => {
      const hubMeta = BRAIN_HUBS.find((h) => h.id === pr.spec.hubId);
      return {
        hubId: pr.spec.hubId,
        label: hubMeta ? `HUB ${hubMeta.num}` : pr.spec.hubId,
        planetRadius: pr.spec.planetRadius,
        orbitRadius: pr.spec.orbitRadius,
        radiusScale: pr.currentRadiusScale,
        eccentricity: pr.currentEccentricity,
        worldPos: planetWorldScratch[idx],
        orbitSamples: orbitSamplePoints[idx],
      };
    });
    let latestCollisionSummary: CollisionMonitorSummary = {
      intersectionCount: 0,
      activeFlashCount: 0,
      latestFlashId: 0,
      latestPairLabel: null,
      latestKind: null,
      latestIntersectionFlashId: 0,
      latestIntersectionPairLabel: null,
    };
    const activeNodesPos: THREE.Vector3[] = Array.from(
      { length: MAX_RESONANCE_NODES },
      () => new THREE.Vector3(),
    );
    const activeNodesType = new Uint8Array(MAX_RESONANCE_NODES);
    const activeNodesStrength = new Float32Array(MAX_RESONANCE_NODES);
    const activeNodesPairA = new Int8Array(MAX_RESONANCE_NODES);
    const activeNodesPairB = new Int8Array(MAX_RESONANCE_NODES);

    planetTrackerRef.current = planetRuntimes.map((pr) => ({
      hubId: pr.spec.hubId,
      planetGroup: pr.planetGroup,
      planetRadius: pr.spec.planetRadius,
    }));

    // Raycasting & Pointer Interactions
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let pointerDownX = 0;
    let pointerDownY = 0;
    let cameraFlyActive = false;
    let lastHandledCmdNonce = cameraCmdRef.current.nonce;
    let lastTrackedBody = focusedBodyRef.current;

    const updatePointerNdc = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handlePointerMove = (e: PointerEvent) => {
      updatePointerNdc(e);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(pickables, false);
      const hitHub = hits[0]?.object?.userData?.hubId as string | undefined;
      if (hitHub !== hoveredHubRef.current) {
        hoveredHubRef.current = hitHub ?? null;
        setHoveredHubId(hitHub ?? null);
        renderer.domElement.style.cursor = hitHub ? 'pointer' : 'grab';
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY) > 6) return;
      updatePointerNdc(e);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(pickables, false);
      const hitHub = hits[0]?.object?.userData?.hubId as string | undefined;
      const hitBody = hits[0]?.object?.userData?.bodyId as string | undefined;
      if (hitHub) {
        stopCinematicTour();
        setFocusedBodyId(hitHub);
        setLastSelectedPlanetId(hitHub);
        setInspectedPlanetId(hitHub);
        onSelectHubRef.current?.(hitHub);
      } else if (hitBody === 'sun') {
        stopCinematicTour();
        setFocusedBodyId('sun');
        setInspectedPlanetId(null);
        followPlanetRef.current = false;
        setFollowPlanet(false);
        cameraCmdRef.current = {
          pos: SOLAR_VIEW_CAMERA.overview.pos,
          target: SOLAR_VIEW_CAMERA.overview.target,
          nonce: cameraCmdRef.current.nonce + 1,
        };
      }
    };

    const handleControlStart = () => {
      cameraFlyActive = false;
      if (cinematicTourRef.current) {
        cinematicTourRef.current = false;
        setCinematicTour(false);
        tourTlRef.current?.kill();
        tourTlRef.current = null;
        if (tourReducedTimerRef.current) {
          window.clearTimeout(tourReducedTimerRef.current);
          tourReducedTimerRef.current = 0;
        }
      }
      if (gsapActiveRef.current && !isSwitchingOutRef.current) {
        activeGsapTlRef.current?.kill();
        activeGsapTlRef.current = null;
        gsapActiveRef.current = false;
        gsapFocusAnimRef.current = false;
      }
    };

    controls.addEventListener('start', handleControlStart);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(Math.round(entry.contentRect.width), 280);
        const h = Math.max(Math.round(entry.contentRect.height), 340);
        if (w !== currentWidth || h !== currentHeight) {
          currentWidth = w;
          currentHeight = h;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
          composer?.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Software WebGL GPU-fence pacing
    let disposed = false;
    let rafId = 0;
    let syncTimerId = 0;
    let activeSync: WebGLSync | null = null;
    const afterDraw = (next: FrameRequestCallback) => {
      if (disposed) return;
      if (!isSoftwareWebGL) {
        rafId = requestAnimationFrame(next);
        return;
      }
      if (isWebGL2) {
        const gl2 = glCtx as WebGL2RenderingContext;
        if (activeSync) gl2.deleteSync(activeSync);
        activeSync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl2.flush();
        const pollFence = () => {
          if (disposed) return;
          if (!activeSync) {
            rafId = requestAnimationFrame(next);
            return;
          }
          const status = gl2.clientWaitSync(activeSync, 0, 0);
          if (status === gl2.ALREADY_SIGNALED || status === gl2.CONDITION_SATISFIED) {
            gl2.deleteSync(activeSync);
            activeSync = null;
            rafId = requestAnimationFrame(next);
          } else {
            syncTimerId = window.setTimeout(pollFence, 16);
          }
        };
        syncTimerId = window.setTimeout(pollFence, 16);
      } else {
        syncTimerId = window.setTimeout(() => {
          if (!disposed) rafId = requestAnimationFrame(next);
        }, 32);
      }
    };

    let lastMs = performance.now();
    let elapsedSim = 0;
    let simTime = 0;
    let realTime = 0;
    let constellationBlend = showConstellationsRef.current ? 1 : 0;
    let resonanceBlend = showResonanceRef.current ? 1 : 0;
    let activeResNodeCount = 0;
    let lastHudMs = 0;
    let lastTelemetryMs = 0;
    let telFrameCount = 0;
    let telWindowStartMs = performance.now();
    let smoothedFrameMs = 16.7;
    let followPrevValid = false;
    let lastFollowHubId = '';

    // One-time scene VRAM geometry buffer footprint audit (zero allocations in tick)
    let staticGeoVramBytes = 0;
    const seenGeoIds = new Set<number>();
    scene.traverse((obj) => {
      const geo = (obj as THREE.Mesh).geometry;
      if (geo && !seenGeoIds.has(geo.id)) {
        seenGeoIds.add(geo.id);
        for (const attrKey of Object.keys(geo.attributes)) {
          const attr = geo.attributes[attrKey];
          if (attr?.array) staticGeoVramBytes += attr.array.byteLength;
        }
        if (geo.index?.array) staticGeoVramBytes += geo.index.array.byteLength;
      }
    });

    const prefersReducedMotionScene =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tick = (now: number) => {
      if (disposed) return;
      const frameDeltaMs = Math.max(1, now - lastMs);
      const rawDt = Math.min(frameDeltaMs / 1000, 0.05);
      lastMs = now;
      smoothedFrameMs = smoothedFrameMs * 0.85 + frameDeltaMs * 0.15;
      telFrameCount += 1;
      realTime += rawDt;

      // Velocity Stress Test envelope: rapid ramp up to 10.0x, sustained surge hold, smooth recovery
      let stressFinishedNow = false;
      const baseOrbitalVel = orbitalVelocityRef.current;
      let surgeVel = baseOrbitalVel;
      if (stressActiveRef.current) {
        stressElapsedRef.current += rawDt;
        const st = stressElapsedRef.current;
        if (st < STRESS_RAMP_UP_SEC) {
          const u = st / STRESS_RAMP_UP_SEC;
          const ease = u * u * (3 - 2 * u);
          surgeVel = baseOrbitalVel + (STRESS_TEST_VELOCITY - baseOrbitalVel) * ease;
        } else if (st < STRESS_RAMP_UP_SEC + STRESS_HOLD_SEC) {
          surgeVel = STRESS_TEST_VELOCITY;
        } else if (st < STRESS_TOTAL_SEC) {
          const u = (st - STRESS_RAMP_UP_SEC - STRESS_HOLD_SEC) / STRESS_RAMP_DOWN_SEC;
          const ease = u * u * (3 - 2 * u);
          surgeVel = STRESS_TEST_VELOCITY + (baseOrbitalVel - STRESS_TEST_VELOCITY) * ease;
        } else {
          stressActiveRef.current = false;
          stressElapsedRef.current = 0;
          surgeVel = baseOrbitalVel;
          stressFinishedNow = true;
        }
        stressSurgeVelRef.current = surgeVel;
      } else {
        stressSurgeVelRef.current = baseOrbitalVel;
      }

      const activeTimeScale = isPausedRef.current ? 0 : timeScaleRef.current;
      const simDt = rawDt * activeTimeScale;
      simTime += simDt;
      const curVel = isPausedRef.current
        ? 0
        : Math.max(baseOrbitalVel, stressActiveRef.current ? surgeVel : 0);
      elapsedSim += simDt * curVel;

      // Read CSS-controlled --neural-bloom-intensity variable from root element
      const cssBloomRaw = rootRef.current?.style.getPropertyValue('--neural-bloom-intensity');
      const parsedCssBloom = cssBloomRaw ? Number.parseFloat(cssBloomRaw) : Number.NaN;
      const effectiveBloom = Number.isFinite(parsedCssBloom)
        ? Math.max(0, Math.min(2.0, parsedCssBloom))
        : bloomIntensityRef.current;

      if (bloomPass) {
        bloomPass.strength = 0.45 * effectiveBloom;
        bloomPass.radius = 0.42 + effectiveBloom * 0.22;
      }

      const opaPassVal = hitlRef.current >= 0.88 ? 1.0 : 0.0;
      sunUniforms.uTime.value = simTime;
      sunUniforms.uOpaPass.value = opaPassVal;
      sunUniforms.uBloom.value = effectiveBloom;
      sunMesh.rotation.y = simTime * 0.08;

      coronaUniforms.uTime.value = simTime;
      coronaUniforms.uOpaPass.value = opaPassVal;
      coronaUniforms.uBloom.value = effectiveBloom;
      coronaMesh.scale.setScalar(0.75 + effectiveBloom * 0.35);
      coronaMesh.quaternion.copy(camera.quaternion);

      // Smoothly fade glowing Celestial Constellations using .solar-map-scope tokens
      constellationBlend = THREE.MathUtils.damp(
        constellationBlend,
        showConstellationsRef.current ? 1 : 0,
        5.5,
        rawDt,
      );
      constellationGroup.visible = constellationBlend > 0.004;
      if (constellationGroup.visible) {
        const shimmer = 0.92 + 0.08 * Math.sin(realTime * 1.15);
        constLineMat.opacity = constellationBlend * 0.42 * shimmer;
        constGlowMat.opacity = constellationBlend * 0.19 * shimmer;
        constStarGlowMat.opacity = constellationBlend * 0.85 * shimmer;
      }

      // Smoothly scale per-orbit 3D inclination (0° flat ecliptic -> 45° steep 3D tilt)
      const targetInclRad = THREE.MathUtils.degToRad(orbitalInclinationRef.current);
      beltGroup.rotation.z = THREE.MathUtils.damp(
        beltGroup.rotation.z,
        targetInclRad * 0.22,
        6.0,
        rawDt,
      );
      beltGroup.rotation.x = THREE.MathUtils.damp(
        beltGroup.rotation.x,
        -targetInclRad * 0.14,
        6.0,
        rawDt,
      );
      beltPoints.rotation.y = elapsedSim * 0.032;

      // Real-time Day/Night Cycle dynamic rotating solar light & terminator contrast
      const dayNightActive = dayNightCycleRef.current;
      const cycleSweepAngle = simTime * 0.65;
      cycleDirLight.position.set(
        Math.cos(cycleSweepAngle) * 28,
        6.8,
        Math.sin(cycleSweepAngle) * 28,
      );
      cycleDirLight.intensity = THREE.MathUtils.damp(
        cycleDirLight.intensity,
        dayNightActive ? 2.85 : 0.0,
        5.5,
        rawDt,
      );
      sunLight.intensity = THREE.MathUtils.damp(
        sunLight.intensity,
        dayNightActive ? 7.2 : 5.2,
        5.5,
        rawDt,
      );
      ambientLight.intensity = THREE.MathUtils.damp(
        ambientLight.intensity,
        dayNightActive ? 0.08 : 0.42,
        5.5,
        rawDt,
      );
      rimFill.intensity = THREE.MathUtils.damp(
        rimFill.intensity,
        dayNightActive ? 0.14 : 0.55,
        5.5,
        rawDt,
      );
      if (dayNightActive) {
        rimFill.position.set(
          -Math.cos(cycleSweepAngle) * 22,
          5.0,
          -Math.sin(cycleSweepAngle) * 22,
        );
      } else {
        rimFill.position.set(-18, 12, -16);
      }

      const selIds = selectedIdsRef.current;
      const focusedId = focusedBodyRef.current;
      const hoveredId = hoveredHubRef.current;
      const orbitsVisible = showOrbitsRef.current;
      const targetLayout = orbitLayoutRef.current;
      const targetScales = orbitRadiusScalesRef.current;
      const wakeOpacityScale = Math.min(1, 0.22 + curVel * activeTimeScale * 0.28);

      eclipticRefLine.visible = orbitsVisible && orbitalInclinationRef.current > 0.5;
      eclipticRefMat.opacity = Math.min(0.18, 0.08 + (orbitalInclinationRef.current / 45) * 0.1);

      for (let i = 0; i < planetRuntimes.length; i++) {
        const pr = planetRuntimes[i];
        const layoutGoal = targetLayout[i] ?? STABLE_CIRCULAR_LAYOUT[i];
        const targetRadiusScale = targetScales[i] ?? layoutGoal.radiusScale;
        pr.currentRadiusScale = THREE.MathUtils.damp(
          pr.currentRadiusScale,
          targetRadiusScale,
          5.6,
          rawDt,
        );
        pr.currentEccentricity = THREE.MathUtils.damp(
          pr.currentEccentricity,
          layoutGoal.eccentricity,
          5.2,
          rawDt,
        );
        // Wrap shortest-path angular difference for smooth periapsis morphing across presets
        const dArg =
          Math.atan2(
            Math.sin(layoutGoal.argPeriapsis - pr.currentArgPeriapsis),
            Math.cos(layoutGoal.argPeriapsis - pr.currentArgPeriapsis),
          );
        pr.currentArgPeriapsis += dArg * Math.min(1, 1 - Math.exp(-5.0 * rawDt));
        pr.currentTiltOffsetZ = THREE.MathUtils.damp(
          pr.currentTiltOffsetZ,
          layoutGoal.tiltOffsetZ,
          5.2,
          rawDt,
        );
        pr.currentTiltOffsetX = THREE.MathUtils.damp(
          pr.currentTiltOffsetX,
          layoutGoal.tiltOffsetX,
          5.2,
          rawDt,
        );

        const a = pr.spec.orbitRadius * pr.currentRadiusScale;
        const bScale = Math.sqrt(Math.max(0.18, 1 - pr.currentEccentricity * pr.currentEccentricity));
        const b = a * bScale;
        const c = a * pr.currentEccentricity;
        planetRadMin[i] = a * (1 - pr.currentEccentricity);
        planetRadMax[i] = a * (1 + pr.currentEccentricity);

        // Kepler's 2nd Law equal-areas modulation: faster near periapsis, slower near aphelion
        const localXPre = -c + Math.cos(pr.angle) * a;
        const localZPre = Math.sin(pr.angle) * b;
        const curHelioR = Math.hypot(localXPre, localZPre);
        const keplerSecondLaw = THREE.MathUtils.clamp(a / Math.max(1.25, curHelioR), 0.55, 2.35);

        pr.angle +=
          simDt * curVel * keplerSecondLaw * (pr.spec.orbitSpeed / Math.pow(pr.currentRadiusScale, 0.65));
        const angle = pr.angle;

        // Smoothly damp each planetary orbit's distinct 3D inclination + procedural preset tilt + periapsis orientation
        const goalRotZ = targetInclRad * pr.spec.tiltWeight * pr.spec.tiltSignZ + pr.currentTiltOffsetZ;
        const goalRotX =
          targetInclRad * pr.spec.tiltWeight * 0.48 * pr.spec.tiltSignX + pr.currentTiltOffsetX;
        pr.orbitPivot.rotation.z = THREE.MathUtils.damp(
          pr.orbitPivot.rotation.z,
          goalRotZ,
          6.2,
          rawDt,
        );
        pr.orbitPivot.rotation.x = THREE.MathUtils.damp(
          pr.orbitPivot.rotation.x,
          goalRotX,
          6.2,
          rawDt,
        );
        pr.orbitPivot.rotation.y = pr.currentArgPeriapsis;

        pr.planetGroup.position.set(-c + Math.cos(angle) * a, 0, Math.sin(angle) * b);
        pr.planetMesh.rotation.y = simTime * ((dayNightActive ? 0.85 : 0.45) + i * 0.04);
        pr.planetMat.emissiveIntensity = THREE.MathUtils.damp(
          pr.planetMat.emissiveIntensity,
          dayNightActive ? 0.022 : 0.16,
          5.5,
          rawDt,
        );

        pr.orbitLine.position.set(-c, 0, 0);
        pr.orbitLine.scale.set(pr.currentRadiusScale, 1, pr.currentRadiusScale * bScale);
        pr.orbitMat.scale = pr.currentRadiusScale;
        pr.orbitLine.visible = orbitsVisible;

        const wakeVisible = (orbitsVisible || stressActiveRef.current) && curVel > 0.01;
        pr.wakeLine.visible = wakeVisible;
        if (wakeVisible) {
          const wakeAttr = pr.wakeGeo.attributes.position as THREE.BufferAttribute;
          const wakeArr = wakeAttr.array as Float32Array;
          const wakeSegsCount = 28;
          for (let w = 0; w <= wakeSegsCount; w++) {
            const lagAngle = angle - (w / wakeSegsCount) * 0.55;
            wakeArr[w * 3] = -c + Math.cos(lagAngle) * a;
            wakeArr[w * 3 + 1] = 0;
            wakeArr[w * 3 + 2] = Math.sin(lagAngle) * b;
          }
          wakeAttr.needsUpdate = true;
        }
        pr.wakeMat.opacity = Math.min(0.95, (stressActiveRef.current ? 0.88 : 0.52) * wakeOpacityScale);

        const isFocused = focusedId === pr.spec.hubId;
        const isHovered = hoveredId === pr.spec.hubId;
        const hasActiveMod = pr.moons.some((m) => selIds.includes(m.appId));

        // Preserve each planet's unique Solar System CSS token color; brighten & softly pulse on hover
        const tiltClarityBoost = (orbitalInclinationRef.current / 45) * 0.1;
        const hoverPulse = isHovered ? 0.5 + 0.5 * Math.sin(realTime * 4.2) : 0;
        _orbitColorScratch.copy(pr.orbitBaseColor);
        if (isFocused) {
          _orbitColorScratch.lerp(_orbitWhite, 0.28);
        } else if (isHovered) {
          _orbitColorScratch.lerp(_orbitWhite, 0.14 + hoverPulse * 0.22);
        }
        pr.orbitMat.color.copy(_orbitColorScratch);
        pr.orbitMat.opacity = isFocused
          ? 0.86
          : isHovered
            ? 0.62 + hoverPulse * 0.32
            : hasActiveMod
              ? Math.min(0.58, 0.44 + tiltClarityBoost)
              : Math.min(0.48, 0.34 + tiltClarityBoost);
        pr.selectRingMat.opacity = isFocused ? 0.85 : isHovered ? 0.46 + hoverPulse * 0.34 : 0.0;
        pr.selectRing.rotation.z = realTime * 0.6;
        pr.atmoMat.opacity = isFocused ? 0.28 : isHovered ? 0.22 + hoverPulse * 0.1 : hasActiveMod ? 0.2 : 0.12;

        for (let m = 0; m < pr.moons.length; m++) {
          const moon = pr.moons[m];
          const active = selIds.includes(moon.appId);
          const mAng = moon.phase + elapsedSim * moon.speed;
          moon.mesh.position.set(
            Math.cos(mAng) * moon.radius,
            Math.sin(mAng) * moon.radius * Math.sin(moon.tilt),
            Math.sin(mAng) * moon.radius * Math.cos(moon.tilt),
          );
          moon.mesh.scale.setScalar(active ? 1.35 : 0.85);
          moon.mat.emissive.set(active ? '#68E4EF' : '#488EFF');
          moon.mat.emissiveIntensity = active ? 1.2 : 0.18;
        }
      }

      // 5. Update World Coordinates & Sampled 3D Orbital Curves + Collision / Gravity-Well Monitor
      for (let i = 0; i < planetRuntimes.length; i++) {
        const pr = planetRuntimes[i];
        pr.orbitPivot.updateMatrixWorld(true);
        pr.planetGroup.getWorldPosition(planetWorldScratch[i]);
        const a = pr.spec.orbitRadius * pr.currentRadiusScale;
        const b = a * Math.sqrt(Math.max(0.18, 1 - pr.currentEccentricity * pr.currentEccentricity));
        const c = a * pr.currentEccentricity;
        const samples = orbitSamplePoints[i];
        for (let s = 0; s < RES_SAMPLES; s++) {
          const th = (s / RES_SAMPLES) * Math.PI * 2;
          samples[s]
            .set(-c + Math.cos(th) * a, 0, Math.sin(th) * b)
            .applyMatrix4(pr.orbitPivot.matrixWorld);
        }
        collisionBodies[i].radiusScale = pr.currentRadiusScale;
        collisionBodies[i].eccentricity = pr.currentEccentricity;
      }

      latestCollisionSummary = collisionMonitor.evaluate(collisionBodies, realTime, rawDt);
      for (let k = 0; k < gravityWellPool.length; k++) {
        const slot = gravityWellPool[k];
        const f = collisionMonitor.flashes[k];
        if (!f || !f.active) {
          slot.group.visible = false;
          continue;
        }
        const u = Math.min(1, f.ageSec / f.durationSec);
        const env =
          u < 0.14
            ? u / 0.14
            : Math.pow(Math.max(0, 1 - (u - 0.14) / 0.86), 1.8);
        const pulseEnv = env * f.intensity;
        slot.group.visible = true;
        slot.group.position.copy(f.position);
        slot.innerMesh.quaternion.setFromUnitVectors(_gwUpAxis, f.normal);
        slot.outerMesh.quaternion.copy(slot.innerMesh.quaternion);
        const s1 = prefersReducedMotionScene ? 1.1 : 0.48 + u * 2.15;
        const s2 = prefersReducedMotionScene ? 1.35 : 0.36 + u * 2.85;
        slot.innerMesh.scale.setScalar(s1);
        slot.outerMesh.scale.setScalar(s2);
        slot.sprite.scale.setScalar(prefersReducedMotionScene ? 1.45 : 0.95 + u * 2.1);

        if (f.kind === 'planetary-conjunction') {
          _gwColorA.set('#FFE0BB').lerp(_gwColorB, u * 0.62);
        } else {
          _gwColorA.set('#A5F3FC').lerp(_gwColorB, u * 0.72);
        }
        slot.innerMat.color.copy(_gwColorA);
        slot.outerMat.color.copy(_gwColorB);
        slot.spriteMat.color.copy(_gwColorA);
        slot.innerMat.opacity = pulseEnv * 0.44;
        slot.outerMat.opacity = pulseEnv * 0.28;
        slot.spriteMat.opacity = pulseEnv * 0.36;
      }

      // 5b. Orbital Resonance Visualization: Pulsating Light Nodes at Orbit Crossings & Conjunction Alignments
      resonanceBlend = THREE.MathUtils.damp(
        resonanceBlend,
        showResonanceRef.current ? 1 : 0,
        6.0,
        rawDt,
      );
      resonanceGroup.visible = resonanceBlend > 0.004;
      if (resonanceGroup.visible) {
        let nCount = 0;

        // Pass A: Geometric Orbital Intersection & Near-Crossing Points
        for (let i = 0; i < planetRuntimes.length && nCount < MAX_RESONANCE_NODES - 6; i++) {
          for (let j = i + 1; j < planetRuntimes.length && nCount < MAX_RESONANCE_NODES - 6; j++) {
            // Fast radial interval overlap check
            if (planetRadMax[i] < planetRadMin[j] - 0.9 || planetRadMax[j] < planetRadMin[i] - 0.9) {
              continue;
            }
            const sA = orbitSamplePoints[i];
            const sB = orbitSamplePoints[j];
            let best1DistSq = 1.65 * 1.65;
            let best1IdxA = -1;
            let best1IdxB = -1;
            for (let aIdx = 0; aIdx < RES_SAMPLES; aIdx++) {
              const pA = sA[aIdx];
              for (let bIdx = 0; bIdx < RES_SAMPLES; bIdx++) {
                const dSq = pA.distanceToSquared(sB[bIdx]);
                if (dSq < best1DistSq) {
                  best1DistSq = dSq;
                  best1IdxA = aIdx;
                  best1IdxB = bIdx;
                }
              }
            }
            if (best1IdxA >= 0 && nCount < MAX_RESONANCE_NODES) {
              _resMidScratch.copy(sA[best1IdxA]).add(sB[best1IdxB]).multiplyScalar(0.5);
              const dPlanet = Math.min(
                planetWorldScratch[i].distanceTo(_resMidScratch),
                planetWorldScratch[j].distanceTo(_resMidScratch),
              );
              const proximityBoost = Math.max(0, 1 - dPlanet / 3.8);
              activeNodesPos[nCount].copy(_resMidScratch);
              activeNodesType[nCount] = 0;
              activeNodesStrength[nCount] = Math.min(
                1.0,
                0.55 + (1 - Math.sqrt(best1DistSq) / 1.65) * 0.25 + proximityBoost * 0.45,
              );
              activeNodesPairA[nCount] = i;
              activeNodesPairB[nCount] = j;
              nCount++;

              // Check opposite lobe intersection (>= 2.8 units away from first crossing)
              let best2DistSq = 1.65 * 1.65;
              let best2IdxA = -1;
              let best2IdxB = -1;
              for (let aIdx = 0; aIdx < RES_SAMPLES; aIdx++) {
                const pA = sA[aIdx];
                if (pA.distanceToSquared(_resMidScratch) < 7.8) continue;
                for (let bIdx = 0; bIdx < RES_SAMPLES; bIdx++) {
                  const dSq = pA.distanceToSquared(sB[bIdx]);
                  if (dSq < best2DistSq) {
                    best2DistSq = dSq;
                    best2IdxA = aIdx;
                    best2IdxB = bIdx;
                  }
                }
              }
              if (best2IdxA >= 0 && nCount < MAX_RESONANCE_NODES) {
                _resPtScratch.copy(sA[best2IdxA]).add(sB[best2IdxB]).multiplyScalar(0.5);
                const dPlanet2 = Math.min(
                  planetWorldScratch[i].distanceTo(_resPtScratch),
                  planetWorldScratch[j].distanceTo(_resPtScratch),
                );
                const proximityBoost2 = Math.max(0, 1 - dPlanet2 / 3.8);
                activeNodesPos[nCount].copy(_resPtScratch);
                activeNodesType[nCount] = 0;
                activeNodesStrength[nCount] = Math.min(
                  1.0,
                  0.52 + (1 - Math.sqrt(best2DistSq) / 1.65) * 0.25 + proximityBoost2 * 0.45,
                );
                activeNodesPairA[nCount] = i;
                activeNodesPairB[nCount] = j;
                nCount++;
              }
            }
          }
        }

        // Pass B: Dynamic Conjunction / Gravitational Alignment Points between Planets
        let closestDelta = Infinity;
        let closestPairA = 0;
        let closestPairB = 1;
        for (let i = 0; i < planetRuntimes.length; i++) {
          const pA = planetWorldScratch[i];
          const azA = Math.atan2(pA.z, pA.x);
          for (let j = i + 1; j < planetRuntimes.length; j++) {
            const pB = planetWorldScratch[j];
            const azB = Math.atan2(pB.z, pB.x);
            const dAz = Math.abs(Math.atan2(Math.sin(azA - azB), Math.cos(azA - azB)));
            if (dAz < closestDelta) {
              closestDelta = dAz;
              closestPairA = i;
              closestPairB = j;
            }
            if (dAz < 0.4 && nCount < MAX_RESONANCE_NODES) {
              activeNodesPos[nCount].copy(pA).add(pB).multiplyScalar(0.5);
              activeNodesType[nCount] = 1;
              activeNodesStrength[nCount] = 0.45 + (1 - dAz / 0.4) * 0.55;
              activeNodesPairA[nCount] = i;
              activeNodesPairB[nCount] = j;
              nCount++;
            }
          }
        }

        // Ensure at least one nearest gravitational syzygy node illuminates in concentric layouts
        if (nCount === 0) {
          activeNodesPos[0]
            .copy(planetWorldScratch[closestPairA])
            .add(planetWorldScratch[closestPairB])
            .multiplyScalar(0.5);
          activeNodesType[0] = 1;
          activeNodesStrength[0] = Math.max(0.35, 1 - closestDelta / Math.PI);
          activeNodesPairA[0] = closestPairA;
          activeNodesPairB[0] = closestPairB;
          nCount = 1;
        }

        activeResNodeCount = nCount;

        // Update pooled 3D pulsating nodes and resonance flux tether lines
        let beamVertCursor = 0;
        for (let k = 0; k < MAX_RESONANCE_NODES; k++) {
          const rn = resonancePool[k];
          if (k < nCount) {
            const isIntersection = activeNodesType[k] === 0;
            const strength = activeNodesStrength[k];
            const pulse = prefersReducedMotionScene
              ? 0.78
              : 0.5 + 0.5 * Math.sin(realTime * (isIntersection ? 5.6 : 4.2) + k * 1.15);

            rn.group.visible = true;
            rn.group.position.copy(activeNodesPos[k]);

            const baseScale = (isIntersection ? 0.95 : 0.85) + strength * 0.45;
            const haloScale = baseScale * (0.85 + pulse * 0.72);
            rn.haloMesh.scale.setScalar(haloScale);
            rn.haloMesh.lookAt(camera.position);
            rn.sprite.scale.setScalar(baseScale * (1.1 + pulse * 0.85));

            if (isIntersection) {
              _resColorScratch.set('#FF894F').lerp(_orbitWhite, pulse * 0.45);
            } else {
              _resColorScratch.set('#68E4EF').lerp(_orbitWhite, pulse * 0.35);
            }

            rn.coreMat.color.copy(_resColorScratch);
            rn.coreMat.opacity = resonanceBlend * (0.65 + pulse * 0.35);
            rn.haloMat.color.copy(_resColorScratch);
            rn.haloMat.opacity = resonanceBlend * (0.35 + pulse * 0.55) * strength;
            rn.spriteMat.color.copy(_resColorScratch);
            rn.spriteMat.opacity = resonanceBlend * (0.45 + pulse * 0.5) * strength;

            // Connect planetary alignment nodes with subtle glowing flux beams
            const idxA = activeNodesPairA[k];
            const idxB = activeNodesPairB[k];
            if (!isIntersection || strength > 0.72) {
              const pA = planetWorldScratch[idxA];
              const pNode = activeNodesPos[k];
              const pB = planetWorldScratch[idxB];
              const bFade = (0.35 + pulse * 0.55) * resonanceBlend * strength;
              const cr = _resColorScratch.r * bFade;
              const cg = _resColorScratch.g * bFade;
              const cb = _resColorScratch.b * bFade;

              const off = beamVertCursor * 3;
              resBeamPosBuf[off] = pA.x;
              resBeamPosBuf[off + 1] = pA.y;
              resBeamPosBuf[off + 2] = pA.z;
              resBeamPosBuf[off + 3] = pNode.x;
              resBeamPosBuf[off + 4] = pNode.y;
              resBeamPosBuf[off + 5] = pNode.z;
              resBeamPosBuf[off + 6] = pNode.x;
              resBeamPosBuf[off + 7] = pNode.y;
              resBeamPosBuf[off + 8] = pNode.z;
              resBeamPosBuf[off + 9] = pB.x;
              resBeamPosBuf[off + 10] = pB.y;
              resBeamPosBuf[off + 11] = pB.z;

              for (let v = 0; v < 4; v++) {
                resBeamColBuf[off + v * 3] = cr;
                resBeamColBuf[off + v * 3 + 1] = cg;
                resBeamColBuf[off + v * 3 + 2] = cb;
              }
              beamVertCursor += 4;
            }
          } else {
            rn.group.visible = false;
          }
        }
        resBeamPosAttr.needsUpdate = true;
        resBeamColAttr.needsUpdate = true;
        resBeamGeo.setDrawRange(0, beamVertCursor);
        resBeamMat.opacity = 0.7 * resonanceBlend;
      } else {
        activeResNodeCount = 0;
      }

      if (cameraCmdRef.current.nonce !== lastHandledCmdNonce) {
        lastHandledCmdNonce = cameraCmdRef.current.nonce;
        if (gsapActiveRef.current && !isSwitchingOutRef.current && !gsapFocusAnimRef.current) {
          activeGsapTlRef.current?.kill();
          activeGsapTlRef.current = null;
          gsapActiveRef.current = false;
        }
        _camGoal.set(...cameraCmdRef.current.pos);
        _targetGoal.set(...cameraCmdRef.current.target);
        cameraFlyActive = !gsapFocusAnimRef.current;
      }

      if (focusedId !== lastTrackedBody) {
        lastTrackedBody = focusedId;
        if (focusedId !== 'sun') {
          if (gsapFocusAnimRef.current) {
            // GSAP focus transition is actively flying the camera to this planet
            cameraFlyActive = false;
          } else {
            if (gsapActiveRef.current && !isSwitchingOutRef.current) {
              activeGsapTlRef.current?.kill();
              activeGsapTlRef.current = null;
              gsapActiveRef.current = false;
            }
            cameraFlyActive = true;
          }
        }
      }

      if (gsapActiveRef.current) {
        followPrevValid = false;
        lastFollowHubId = '';
      } else if (focusedId !== 'sun') {
        const targetPlanet = planetRuntimes.find((p) => p.spec.hubId === focusedId);
        if (targetPlanet) {
          // Ensure current frame orbital rotation/position matrices are flushed before reading world coordinates
          targetPlanet.orbitPivot.updateMatrixWorld(true);
          targetPlanet.planetGroup.getWorldPosition(_pWorld);

          if (followPlanetRef.current) {
            if (followPrevValid && lastFollowHubId === focusedId) {
              _followDelta.copy(_pWorld).sub(_followPrevPos);
              camera.position.add(_followDelta);
              controls.target.add(_followDelta);
            }

            if (cameraFlyActive) {
              _radialScratch.copy(_pWorld).normalize();
              const standOff = Math.max(3.6, targetPlanet.spec.planetRadius * 6.5);
              _camGoal.copy(_pWorld).addScaledVector(_radialScratch, standOff);
              _camGoal.y += standOff * 0.42;
              controls.target.x = THREE.MathUtils.damp(controls.target.x, _pWorld.x, 7.5, rawDt);
              controls.target.y = THREE.MathUtils.damp(controls.target.y, _pWorld.y, 7.5, rawDt);
              controls.target.z = THREE.MathUtils.damp(controls.target.z, _pWorld.z, 7.5, rawDt);
              camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoal.x, 5.2, rawDt);
              camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoal.y, 5.2, rawDt);
              camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoal.z, 5.2, rawDt);
              if (
                camera.position.distanceTo(_camGoal) < 0.16 &&
                controls.target.distanceTo(_pWorld) < 0.12
              ) {
                cameraFlyActive = false;
              }
            } else {
              // Co-translate any residual target centering equally into camera + target so orbit angle & zoom stay locked
              _followErr.copy(_pWorld).sub(controls.target);
              const errStep = Math.min(1, 1 - Math.exp(-12 * rawDt));
              _followErr.multiplyScalar(errStep);
              controls.target.add(_followErr);
              camera.position.add(_followErr);
            }

            _followPrevPos.copy(_pWorld);
            followPrevValid = true;
            lastFollowHubId = focusedId;
          } else {
            followPrevValid = false;
            lastFollowHubId = '';
            controls.target.x = THREE.MathUtils.damp(controls.target.x, _pWorld.x, 5.2, rawDt);
            controls.target.y = THREE.MathUtils.damp(controls.target.y, _pWorld.y, 5.2, rawDt);
            controls.target.z = THREE.MathUtils.damp(controls.target.z, _pWorld.z, 5.2, rawDt);
            if (cameraFlyActive) {
              _radialScratch.copy(_pWorld).normalize();
              const standOff = Math.max(3.6, targetPlanet.spec.planetRadius * 6.5);
              _camGoal.copy(_pWorld).addScaledVector(_radialScratch, standOff);
              _camGoal.y += standOff * 0.42;
              camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoal.x, 4.2, rawDt);
              camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoal.y, 4.2, rawDt);
              camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoal.z, 4.2, rawDt);
              if (camera.position.distanceTo(_camGoal) < 0.14) {
                cameraFlyActive = false;
              }
            }
          }
        } else {
          followPrevValid = false;
          lastFollowHubId = '';
        }
      } else {
        followPrevValid = false;
        lastFollowHubId = '';
        if (cameraFlyActive) {
          camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoal.x, 4.2, rawDt);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoal.y, 4.2, rawDt);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoal.z, 4.2, rawDt);
          controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetGoal.x, 4.8, rawDt);
          controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetGoal.y, 4.8, rawDt);
          controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetGoal.z, 4.8, rawDt);
          if (
            camera.position.distanceTo(_camGoal) < 0.1 &&
            controls.target.distanceTo(_targetGoal) < 0.06
          ) {
            cameraFlyActive = false;
          }
        }
      }

      controls.autoRotate = autoRotateRef.current && !cameraFlyActive && !gsapActiveRef.current;
      controls.autoRotateSpeed = 0.65;
      controls.update();

      renderer.info.reset();
      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
      const frameDrawCalls = renderer.info.render.calls;
      const frameTriangles = renderer.info.render.triangles;

      if (now - lastTelemetryMs >= 250) {
        const winElapsedSec = Math.max(0.05, (now - telWindowStartMs) / 1000);
        const measuredFps = Math.max(1, Math.round(telFrameCount / winElapsedSec));
        telFrameCount = 0;
        telWindowStartMs = now;
        lastTelemetryMs = now;

        const perfMem = (
          performance as Performance & {
            memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
          }
        ).memory;
        const jsHeapMb = perfMem ? perfMem.usedJSHeapSize / (1024 * 1024) : null;
        const jsHeapLimitMb = perfMem ? Math.round(perfMem.jsHeapSizeLimit / (1024 * 1024)) : null;
        const rtBytes = currentWidth * currentHeight * dpr * dpr * 4 * (composer ? 5 : 2);
        const texBytes = renderer.info.memory.textures * 256 * 128 * 4;
        const gpuEstimateMb = (staticGeoVramBytes + rtBytes + texBytes) / (1024 * 1024);

        setTelemetryMetrics({
          fps: measuredFps,
          frameMs: smoothedFrameMs,
          drawCalls: frameDrawCalls,
          triangles: frameTriangles,
          geometries: renderer.info.memory.geometries,
          textures: renderer.info.memory.textures,
          programs: renderer.info.programs?.length ?? 0,
          jsHeapMb,
          jsHeapLimitMb,
          gpuEstimateMb,
          rendererMode: isSoftwareWebGL ? 'software' : 'hardware',
        });
      }

      // 60fps Zero-React Screen Projection for CSS mix-blend-mode Atmospheric Scattering Glow
      const glowOverlayEl = scatteringGlowRef.current;
      const activeInspectedId = inspectedPlanetRef.current;
      if (glowOverlayEl) {
        if (atmosphericScatteringRef.current && activeInspectedId) {
          const scatterPr = planetRuntimes.find((p) => p.spec.hubId === activeInspectedId);
          if (scatterPr) {
            scatterPr.planetGroup.getWorldPosition(_pWorld);
            _gwProj.copy(_pWorld).project(camera);
            if (_gwProj.z > -1 && _gwProj.z < 1) {
              const sx = (_gwProj.x * 0.5 + 0.5) * currentWidth;
              const sy = (-_gwProj.y * 0.5 + 0.5) * currentHeight;
              const distCam = Math.max(0.5, camera.position.distanceTo(_pWorld));
              const halfFovTan = Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5);
              const pxRadius =
                (scatterPr.spec.planetRadius / (distCam * halfFovTan)) * (currentHeight * 0.5);
              const spreadMul = activeScatteringProfileRef.current?.spreadMultiplier ?? 2.85;
              const baseOp = activeScatteringProfileRef.current?.baseOpacity ?? 0.78;
              const glowPx = THREE.MathUtils.clamp(Math.round(pxRadius * 2 * spreadMul), 96, 540);
              const finalOp = THREE.MathUtils.clamp(
                baseOp * (0.68 + effectiveBloom * 0.3),
                0.28,
                0.98,
              );
              glowOverlayEl.style.width = `${glowPx}px`;
              glowOverlayEl.style.height = `${glowPx}px`;
              glowOverlayEl.style.transform = `translate3d(${(sx - glowPx * 0.5).toFixed(1)}px, ${(sy - glowPx * 0.5).toFixed(1)}px, 0)`;
              glowOverlayEl.style.opacity = finalOp.toFixed(3);
            } else {
              glowOverlayEl.style.opacity = '0';
            }
          } else {
            glowOverlayEl.style.opacity = '0';
          }
        } else {
          glowOverlayEl.style.opacity = '0';
        }
      }

      // 60fps Zero-React Screen Projection for Primary Atmospheric Gas CSS mix-blend-mode Planetary Overlays
      const gasDiscEl = primaryGasOverlayRef.current;
      const gasRimEl = primaryGasRimRef.current;
      const activeGasTargetId = activeGasOverlayHubRef.current;
      const activeGasSymbol = activePrimaryGasSymbolRef.current;
      const halfFovTanOverlay = Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5);

      for (let i = 0; i < planetRuntimes.length; i++) {
        const pr = planetRuntimes[i];
        const perPlanetEl = planetGasOverlayRefs.current[pr.spec.hubId];
        if (!perPlanetEl) continue;

        pr.planetGroup.getWorldPosition(_pWorld);
        _gwProj.copy(_pWorld).project(camera);
        if (_gwProj.z > -1 && _gwProj.z < 1) {
          const sx = (_gwProj.x * 0.5 + 0.5) * currentWidth;
          const sy = (-_gwProj.y * 0.5 + 0.5) * currentHeight;
          const distCam = Math.max(0.5, camera.position.distanceTo(_pWorld));
          const pxRadius =
            (pr.spec.planetRadius / (distCam * halfFovTanOverlay)) * (currentHeight * 0.5);
          const haloPx = THREE.MathUtils.clamp(Math.round(pxRadius * 2.28), 16, 320);
          const isSelectedTarget = pr.spec.hubId === activeGasTargetId;
          const prPrimaryGas = allPlanetGasProfiles[i]?.profile.gasSymbol ?? '';
          const matchesSelectedGas = Boolean(activeGasSymbol && prPrimaryGas === activeGasSymbol);
          const basePlanetOp = isSelectedTarget
            ? 0
            : activeGasSymbol
              ? matchesSelectedGas
                ? 0.52
                : 0.22
              : 0.36;

          perPlanetEl.style.width = `${haloPx}px`;
          perPlanetEl.style.height = `${haloPx}px`;
          perPlanetEl.style.transform = `translate3d(${(sx - haloPx * 0.5).toFixed(1)}px, ${(sy - haloPx * 0.5).toFixed(1)}px, 0)`;
          perPlanetEl.style.opacity = basePlanetOp.toFixed(3);
        } else {
          perPlanetEl.style.opacity = '0';
        }
      }

      if (gasDiscEl && gasRimEl) {
        if (activeGasTargetId) {
          const gasPr = planetRuntimes.find((p) => p.spec.hubId === activeGasTargetId);
          if (gasPr) {
            gasPr.planetGroup.getWorldPosition(_pWorld);
            _gwProj.copy(_pWorld).project(camera);
            if (_gwProj.z > -1 && _gwProj.z < 1) {
              const sx = (_gwProj.x * 0.5 + 0.5) * currentWidth;
              const sy = (-_gwProj.y * 0.5 + 0.5) * currentHeight;
              const distCam = Math.max(0.5, camera.position.distanceTo(_pWorld));
              const pxRadius =
                (gasPr.spec.planetRadius / (distCam * halfFovTanOverlay)) * (currentHeight * 0.5);
              const discPx = THREE.MathUtils.clamp(Math.round(pxRadius * 2.12), 18, 300);
              const rimPx = THREE.MathUtils.clamp(Math.round(pxRadius * 2.58), 28, 380);
              gasDiscEl.style.width = `${discPx}px`;
              gasDiscEl.style.height = `${discPx}px`;
              gasDiscEl.style.transform = `translate3d(${(sx - discPx * 0.5).toFixed(1)}px, ${(sy - discPx * 0.5).toFixed(1)}px, 0)`;
              gasDiscEl.style.opacity = '0.76';

              gasRimEl.style.width = `${rimPx}px`;
              gasRimEl.style.height = `${rimPx}px`;
              gasRimEl.style.transform = `translate3d(${(sx - rimPx * 0.5).toFixed(1)}px, ${(sy - rimPx * 0.5).toFixed(1)}px, 0)`;
              gasRimEl.style.opacity = THREE.MathUtils.clamp(
                0.56 + effectiveBloom * 0.16,
                0.45,
                0.88,
              ).toFixed(3);
            } else {
              gasDiscEl.style.opacity = '0';
              gasRimEl.style.opacity = '0';
            }
          } else {
            gasDiscEl.style.opacity = '0';
            gasRimEl.style.opacity = '0';
          }
        } else {
          gasDiscEl.style.opacity = '0';
          gasRimEl.style.opacity = '0';
        }
      }

      if (stressFinishedNow) {
        setStressTestActive(false);
        setLiveStressVelocity(baseOrbitalVel);
      }

      if (now - lastHudMs > 62) {
        lastHudMs = now;
        if (stressActiveRef.current) {
          setLiveStressVelocity(stressSurgeVelRef.current);
        }
        if (showResonanceRef.current) {
          setActiveResonanceCount(activeResNodeCount);
        }
        setGravityWellHud((prev) =>
          prev.intersectionCount === latestCollisionSummary.intersectionCount &&
          prev.latestPairLabel === latestCollisionSummary.latestPairLabel
            ? prev
            : {
                intersectionCount: latestCollisionSummary.intersectionCount,
                latestPairLabel: latestCollisionSummary.latestPairLabel,
              },
        );
        if (
          latestCollisionSummary.latestIntersectionFlashId >
            lastSeenIntersectionFlashIdRef.current &&
          latestCollisionSummary.intersectionCount > 0
        ) {
          lastSeenIntersectionFlashIdRef.current = latestCollisionSummary.latestIntersectionFlashId;
          setGravityWellAlert({
            id: latestCollisionSummary.latestIntersectionFlashId,
            pairLabel:
              latestCollisionSummary.latestIntersectionPairLabel ??
              latestCollisionSummary.latestPairLabel ??
              'Orbital Trajectory Crossing',
            intersectionCount: latestCollisionSummary.intersectionCount,
            activeFlashCount: latestCollisionSummary.activeFlashCount,
          });
        }
        const inspectedId = inspectedPlanetRef.current;
        const candidateHub = hoveredId ?? (focusedId !== 'sun' ? focusedId : null);
        // Hide compact hover tooltip when the same planet is already open in Inspect Planet card
        const calloutHub = candidateHub && candidateHub !== inspectedId ? candidateHub : null;
        if (calloutHub) {
          const pr = planetRuntimes.find((p) => p.spec.hubId === calloutHub);
          if (pr) {
            pr.planetGroup.getWorldPosition(_pWorld);
            _pProj.copy(_pWorld).project(camera);
            if (_pProj.z > -1 && _pProj.z < 1) {
              const sx = (_pProj.x * 0.5 + 0.5) * currentWidth;
              const sy = (-_pProj.y * 0.5 + 0.5) * currentHeight;
              setCallout({
                hubId: calloutHub,
                x: Math.min(Math.max(sx, 126), currentWidth - 126),
                y: Math.min(Math.max(sy - 32, 68), currentHeight - 135),
              });
            } else {
              setCallout(null);
            }
          }
        } else {
          setCallout(null);
        }

        if (inspectedId) {
          const pr = planetRuntimes.find((p) => p.spec.hubId === inspectedId);
          if (pr) {
            const twoPi = Math.PI * 2;
            const normPhaseRad = ((pr.angle - pr.spec.initialAngle) % twoPi + twoPi) % twoPi;
            const orbitalPhaseDeg = (normPhaseRad / twoPi) * 360;
            const revolutions = Math.max(0, (pr.angle - pr.spec.initialAngle) / twoPi);

            pr.planetGroup.getWorldPosition(_pWorld);
            _planetDirScratch.copy(_pWorld).normalize();
            let illumPct = 58;
            let hourFrac = 12;
            if (dayNightCycleRef.current) {
              _lightDirScratch.copy(cycleDirLight.position).normalize();
              const dot = _planetDirScratch.dot(_lightDirScratch);
              illumPct = Math.round(THREE.MathUtils.clamp((dot * 0.5 + 0.5) * 100, 6, 98));
              const spinAngle = (pr.planetMesh.rotation.y + cycleSweepAngle) % twoPi;
              hourFrac = ((spinAngle / twoPi) * 24 + 24) % 24;
            } else {
              const dotCam = _planetDirScratch.dot(
                _lightDirScratch.copy(camera.position).normalize(),
              );
              illumPct = Math.round(THREE.MathUtils.clamp((0.62 - dotCam * 0.25) * 100, 35, 88));
              const spinAngle = pr.planetMesh.rotation.y % twoPi;
              hourFrac = ((spinAngle / twoPi) * 24 + 24) % 24;
            }
            const hr = Math.floor(hourFrac);
            const min = Math.floor((hourFrac - hr) * 60);
            const localSolarHour = `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

            setLiveInspectTelemetry({
              hubId: inspectedId,
              orbitalPhaseDeg,
              revolutions,
              solarIlluminationPct: illumPct,
              localSolarHour,
              atmoFluxWave: realTime * 1.15,
              dayNightCycleActive: dayNightCycleRef.current,
            });
          }
        }
      }

      afterDraw(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cinematicTourRef.current = false;
      tourTlRef.current?.kill();
      tourTlRef.current = null;
      if (tourReducedTimerRef.current) {
        window.clearTimeout(tourReducedTimerRef.current);
        tourReducedTimerRef.current = 0;
      }
      activeGsapTlRef.current?.kill();
      activeGsapTlRef.current = null;
      gsapActiveRef.current = false;
      gsapFocusAnimRef.current = false;
      isSwitchingOutRef.current = false;
      cameraRef.current = null;
      controlsRef.current = null;
      planetTrackerRef.current = [];
      collisionMonitorRef.current = null;
      cancelAnimationFrame(rafId);
      window.clearTimeout(syncTimerId);
      if (activeSync && isWebGL2) {
        (glCtx as WebGL2RenderingContext).deleteSync(activeSync);
        activeSync = null;
      }
      resizeObserver.disconnect();
      controls.removeEventListener('start', handleControlStart);
      controls.dispose();
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      disposableGeos.forEach((g) => g.dispose());
      disposableMats.forEach((m) => m.dispose());
      disposableTex.forEach((t) => t.dispose());
      composer?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const opaPass = hitlConfidence >= 0.88;

  return (
    <div
      ref={rootRef}
      data-qa="solar-system-3d-neural-core"
      style={{ '--neural-bloom-intensity': bloomIntensity.toFixed(2) } as React.CSSProperties}
      className={`solar-map-scope relative w-full h-full min-h-[380px] overflow-hidden select-none bg-[var(--solar-bg-void)] text-[var(--solar-fg-primary)] ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'rounded-[10px]'
      }`}
    >
      {/* Pure WebGL Heliocentric Solar System Mount */}
      <div ref={mountRef} className="w-full h-full" />

      {/* CSS mix-blend-mode Atmospheric Scattering Radial Glow around Inspected 3D Planet Model */}
      <div
        ref={scatteringGlowRef}
        data-qa="solar-planet-scattering-glow"
        aria-hidden="true"
        style={{
          display: atmosphericScattering && inspectedBlueprint ? 'block' : 'none',
          position: 'absolute',
          left: 0,
          top: 0,
          width: '220px',
          height: '220px',
          borderRadius: '9999px',
          pointerEvents: 'none',
          zIndex: 5,
          mixBlendMode: inspectedScatteringProfile?.mixBlendMode ?? 'screen',
          background: inspectedScatteringProfile?.gradientCss ?? 'none',
          opacity: 0,
          willChange: 'transform, opacity',
        }}
      />

      {/* Per-Planet Primary Atmospheric Gas CSS mix-blend-mode Overlays for Visual Distinction */}
      {allPlanetGasProfiles.map(({ hubId, profile }) => (
        <div
          key={hubId}
          ref={(el) => {
            planetGasOverlayRefs.current[hubId] = el;
          }}
          data-qa={`solar-planet-gas-overlay-${hubId}`}
          data-primary-gas={profile.gasSymbol}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '48px',
            height: '48px',
            borderRadius: '9999px',
            pointerEvents: 'none',
            zIndex: 5,
            mixBlendMode: profile.rimMixBlendMode,
            background: profile.rimAuraCss,
            opacity: 0,
            transition: 'opacity 220ms ease',
            willChange: 'transform, opacity',
          }}
        />
      ))}

      {/* Dynamic Primary Atmospheric Gas CSS mix-blend-mode Overlay on Selected Planetary Model */}
      <div
        ref={primaryGasOverlayRef}
        data-qa="solar-planet-primary-gas-overlay"
        data-planet-id={selectedGasOverlayBlueprint?.hubId ?? ''}
        data-primary-gas={selectedPrimaryGasProfile?.gasSymbol ?? ''}
        aria-hidden="true"
        style={{
          display: selectedPrimaryGasProfile ? 'block' : 'none',
          position: 'absolute',
          left: 0,
          top: 0,
          width: '96px',
          height: '96px',
          borderRadius: '9999px',
          pointerEvents: 'none',
          zIndex: 6,
          mixBlendMode: selectedPrimaryGasProfile?.mixBlendMode ?? 'color',
          background: selectedPrimaryGasProfile?.discTintCss ?? 'none',
          opacity: 0,
          transition: 'background 320ms ease',
          willChange: 'transform, opacity',
        }}
      />
      <div
        ref={primaryGasRimRef}
        data-qa="solar-planet-primary-gas-rim"
        data-primary-gas={selectedPrimaryGasProfile?.gasSymbol ?? ''}
        aria-hidden="true"
        style={{
          display: selectedPrimaryGasProfile ? 'block' : 'none',
          position: 'absolute',
          left: 0,
          top: 0,
          width: '120px',
          height: '120px',
          borderRadius: '9999px',
          pointerEvents: 'none',
          zIndex: 6,
          mixBlendMode: selectedPrimaryGasProfile?.rimMixBlendMode ?? 'screen',
          background: selectedPrimaryGasProfile?.rimAuraCss ?? 'none',
          opacity: 0,
          transition: 'background 320ms ease',
          willChange: 'transform, opacity',
        }}
      />

      {/* Top-Left Distance & Orbital Telemetry Card (design.md: .solar-map-distance-card) */}
      <div
        data-qa="solar-map-distance-card"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(4, 10, 22, 0.84), rgba(4, 10, 22, 0.32))',
          borderLeft: '2px solid var(--solar-accent-amber)',
          boxShadow: 'var(--solar-shadow-card)',
        }}
        className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col gap-[5px] py-[8px] px-[11px] max-w-[290px] sm:max-w-[350px]"
      >
        <div className="flex items-center justify-between gap-2 text-[10px] font-mono tracking-[0.08em] text-[var(--solar-fg-warm)]">
          <span className="font-bold uppercase truncate">
            {cinematicTour
              ? `CINEMATIC TOUR · ${cinematicTourStepIndex + 1}/${CINEMATIC_TOUR_STOPS.length}`
              : activeBlueprint && activeHubMeta
                ? `HUB ${activeHubMeta.num} · ${activeHubMeta.label}`
                : 'SPENTA SOLAR SYSTEM MODEL'}
          </span>
          <span
            className={
              opaPass
                ? 'text-[#68E4EF] font-bold shrink-0'
                : 'text-[#FFB563] font-bold shrink-0'
            }
          >
            OPA {hitlConfidence.toFixed(2)}
          </span>
        </div>

        <div className="font-mono text-[12px] font-semibold tabular-nums text-[var(--solar-fg-bright)] truncate">
          {cinematicTour
            ? CINEMATIC_TOUR_STOPS[cinematicTourStepIndex]?.title
            : activeBlueprint
              ? `${formatScaledAu(activeBlueprint, activeOrbitScale)} · ${activeBlueprint.kmEquiv} · ${
                  stressTestActive
                    ? `${liveStressVelocity.toFixed(1)}× SURGE`
                    : activeBlueprint.orbitPeriod
                }`
              : `0.00 AU · ${(stressTestActive ? liveStressVelocity : orbitalVelocity).toFixed(2)}× vel · ${timeScale.toFixed(1)}× time · ${Math.round(orbitalInclinationDeg)}° incl`}
        </div>

        <span className="solar-map-scale-note font-mono text-[10px] font-medium leading-[12px] text-[var(--solar-fg-soft)]">
          {cinematicTour
            ? `${CINEMATIC_TOUR_STOPS[cinematicTourStepIndex]?.subtitle ?? ''} · Drag camera to exit`
            : activeBlueprint
              ? `${activeBlueprint.celestialTier} · ${timeScale.toFixed(1)}× rate · ${Math.round(orbitalInclinationDeg)}° tilt${
                  followPlanet ? ' · FOLLOW LOCKED' : ''
                }${stressTestActive ? ' · 10.0× STRESS TEST' : ''}${
                  showResonance ? ` · Resonance (${activeResonanceCount})` : ''
                }${
                  gravityWellHud.latestPairLabel
                    ? ` · Gravity-Well (${gravityWellHud.latestPairLabel})`
                    : gravityWellHud.intersectionCount > 0
                      ? ` · ${gravityWellHud.intersectionCount} Path Crossings`
                      : ''
                }${dayNightCycle ? ' · Day/Night ON' : ''}`
              : (() => {
                  const presetTitle =
                    configurationPreset === 'highly-eccentric'
                      ? 'Highly Eccentric'
                      : configurationPreset === 'young-chaotic'
                        ? 'Young Chaotic'
                        : 'Stable Circular';
                  const flags = [
                    orbitJitterCount > 0 ? `±15% Layout #${orbitJitterCount}` : '',
                    gravityWellHud.latestPairLabel
                      ? `Gravity-Well: ${gravityWellHud.latestPairLabel}`
                      : gravityWellHud.intersectionCount > 0
                        ? `${gravityWellHud.intersectionCount} Orbit Crossings`
                        : '',
                    showResonance ? `Resonance (${activeResonanceCount} nodes)` : '',
                    stressTestActive ? '10.0× Stress Test' : '',
                    dayNightCycle ? 'Day/Night Cycle' : '',
                    showConstellations ? 'Constellations ON' : '',
                  ].filter(Boolean);
                  return flags.length > 0
                    ? `${presetTitle} · ${flags.join(' · ')}`
                    : 'Stable Circular · 8 Planetary Hubs · 13 Sovereign Modules';
                })()}
        </span>
      </div>

      {/* Top-Right View Mode Navigation (.solar-map-views) & Fullscreen Button (.solar-map-fullscreen) */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-[8px]">
        <nav
          aria-label="Solar System 3D camera views"
          data-qa="solar-map-views"
          style={{
            backgroundColor: 'var(--solar-bg-strip)',
            borderColor: 'var(--solar-border-subtle)',
          }}
          className="flex items-center gap-[4px] p-[4px] rounded-[8px] border"
        >
          {(
            [
              { id: 'overview', label: 'Overview' },
              { id: 'ecliptic', label: 'Ecliptic' },
              { id: 'inner-core', label: 'Inner Core' },
            ] as { id: SolarViewMode; label: string }[]
          ).map((tab) => {
            const active = viewMode === tab.id && focusedBodyId === 'sun';
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={active}
                onClick={() => handleSelectView(tab.id)}
                style={
                  active
                    ? {
                        backgroundColor: 'var(--solar-accent-amber-bg)',
                        color: 'var(--solar-accent-amber-fg)',
                        boxShadow: 'rgba(255, 181, 99, 0.396) 0px 0px 0px 1px inset',
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: 'var(--solar-fg-blue)',
                      }
                }
                className="px-[9px] sm:px-[11px] py-[6px] rounded-[5px] text-[11px] font-semibold leading-[15px] cursor-pointer transition-colors whitespace-nowrap hover:text-white"
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleToggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen solar map' : 'Open fullscreen solar map'}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen 3D Solar Map'}
          data-qa="solar-map-fullscreen"
          style={{
            backgroundColor: 'var(--solar-bg-panel)',
            borderColor: 'var(--solar-border-strong)',
            boxShadow: 'var(--solar-shadow-glow)',
            color: 'var(--solar-fg-bright)',
          }}
          className="grid place-items-center w-[40px] h-[40px] rounded-[8px] border cursor-pointer transition-colors hover:border-[#488EFF]"
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" strokeWidth={1.75} />
          ) : (
            <Maximize2 className="w-4 h-4" strokeWidth={1.75} />
          )}
        </button>
      </div>

      {/* Real-Time Performance Telemetry Overlay positioned cleanly below Solar View Controls */}
      <NeuralCoreTelemetryOverlay
        mode="solar-map"
        metrics={telemetryMetrics}
        gravityWellAlert={gravityWellAlert}
        positionClassName="top-[60px] right-3"
        compact={compact}
      />

      {/* Projected Planetary Hub Inspection Callout */}
      {callout && calloutHubMeta && calloutBlueprint && (
        <div
          style={{
            left: `${callout.x}px`,
            top: `${callout.y}px`,
            backgroundColor: 'rgba(4, 10, 22, 0.92)',
            borderColor: 'var(--solar-border-strong)',
            boxShadow: 'var(--solar-shadow-glow)',
          }}
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full w-[236px] rounded-[8px] border px-3 py-2.5"
        >
          <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
            <span className="font-bold text-[var(--solar-accent-amber-fg)]">
              HUB {calloutHubMeta.num} · {formatScaledAu(calloutBlueprint, calloutOrbitScale)}
            </span>
            <span className="text-[var(--solar-fg-blue-muted)]">
              {calloutHubMeta.keyLayers.join('/')}
            </span>
          </div>
          <div className="text-xs font-bold text-white mt-0.5 leading-snug">
            {calloutHubMeta.label}
          </div>
          <div className="text-[10px] font-mono text-[var(--solar-fg-soft)] mt-0.5">
            {calloutBlueprint.celestialTier}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {calloutApps.map((app) => {
              const active = selectedIds.includes(app.id);
              return (
                <span
                  key={app.id}
                  style={
                    active
                      ? {
                          backgroundColor: 'var(--solar-accent-amber-bg)',
                          borderColor: 'var(--solar-accent-amber)',
                          color: 'var(--solar-accent-amber-fg)',
                        }
                      : {
                          backgroundColor: 'rgba(8, 18, 38, 0.85)',
                          borderColor: 'var(--solar-border-subtle)',
                          color: 'var(--solar-fg-blue)',
                        }
                  }
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded-[5px] border font-semibold"
                >
                  {appMap[app.id]?.shortName ?? app.shortName}
                </span>
              );
            })}
          </div>
          <div className="mt-1.5 pt-1 border-t border-[var(--solar-border-subtle)] text-[9px] font-mono text-[var(--solar-accent-amber-fg)]">
            Click planet to inspect atmosphere &amp; orbits
          </div>
        </div>
      )}

      {/* Inspect Planet Detailed Popup Card (Real-Time Atmospheric Telemetry & Historical Orbits) */}
      {inspectedBlueprint && inspectedHubMeta && (
        <SolarPlanetInspectCard
          planet={inspectedBlueprint}
          hubMeta={inspectedHubMeta}
          hubApps={inspectedHubApps}
          selectedAppIds={selectedIds}
          appMap={appMap}
          orbitScale={inspectedOrbitScale}
          orbitalVelocityMultiplier={
            isPaused ? 0 : (stressTestActive ? liveStressVelocity : orbitalVelocity) * timeScale
          }
          orbitalInclinationDeg={orbitalInclinationDeg}
          liveTelemetry={
            liveInspectTelemetry?.hubId === inspectedBlueprint.hubId
              ? liveInspectTelemetry
              : null
          }
          atmosphericScattering={atmosphericScattering}
          onToggleAtmosphericScattering={() => setAtmosphericScattering((v) => !v)}
          onClose={() => setInspectedPlanetId(null)}
          onCyclePlanet={handleCycleInspectedPlanet}
          onReturnToOverview={() => handleSelectView('ecliptic')}
        />
      )}

      {/* Interactive Orbital Path Hover Pulse Radar & Persistent Historical Orbit Log */}
      {!compact && !inspectedBlueprint && (
        <div className="pointer-events-none absolute top-[102px] left-3 z-10 hidden md:block">
          <SolarOrbitLogPanel
            entries={orbitLog}
            onClearLog={handleClearOrbitLog}
            rings={orbitalRings}
            hoveredHubId={hoveredHubId}
            selectedHubId={focusedBodyId}
            onHoverHub={handleHoverHubFromPanel}
            onSelectHub={handleFocusBodyChange}
            onOpenShowreelVr={() => navigateToItem('Resources', { type: 'showreel', id: '18' })}
          />
        </div>
      )}

      {/* Unified 3D Neural Core Bottom Control Panel in Solar System Mode (.solar-map-scope CSS tokens) */}
      <GalaxyControlPanel
        systemMode="solar-map"
        onToggleAlternativeSystem={
          onToggleAlternativeSystem ? handleRequestAlternativeSystem : undefined
        }
        isLightMode={false}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
        onReset={handleResetMap}
        solarControls={{
          focusedBodyId,
          focusOptions,
          onFocusBodyChange: handleFocusBodyChange,
          isHeliocentric: focusedBodyId === 'sun',
          heliocentricPlanetLabel: (() => {
            const targetId = focusedBodyId !== 'sun' ? focusedBodyId : lastSelectedPlanetId;
            const hub = BRAIN_HUBS.find((h) => h.id === targetId);
            return hub ? `HUB ${hub.num} · ${hub.label}` : 'HUB 03 · Enterprise';
          })(),
          onToggleHeliocentricView: handleToggleHeliocentricView,
          isPaused,
          onTogglePause: () => setIsPaused((p) => !p),
          showOrbits,
          onToggleOrbits: () => setShowOrbits(!showOrbits),
          onRandomizeOrbits: handleRandomizeOrbits,
          orbitJitterCount,
          orbitalVelocity,
          onOrbitalVelocityChange: (val) => {
            setOrbitalVelocity(val);
            if (isPaused && val > 0) setIsPaused(false);
          },
          orbitalInclinationDeg,
          onOrbitalInclinationChange: setOrbitalInclinationDeg,
          timeScale,
          onTimeScaleChange: (val) => {
            setTimeScale(val);
            if (isPaused && val > 0) setIsPaused(false);
          },
          dayNightCycle,
          onToggleDayNightCycle: () => setDayNightCycle(!dayNightCycle),
          showConstellations,
          onToggleConstellations: () => setShowConstellations(!showConstellations),
          followPlanet,
          followPlanetLabel: (() => {
            const targetId = focusedBodyId !== 'sun' ? focusedBodyId : lastSelectedPlanetId;
            const hub = BRAIN_HUBS.find((h) => h.id === targetId);
            return hub ? `HUB ${hub.num} · ${hub.label}` : 'HUB 03 · Enterprise';
          })(),
          onToggleFollowPlanet: handleToggleFollowPlanet,
          stressTestActive,
          stressTestVelocity: liveStressVelocity,
          onTriggerStressTest: handleTriggerStressTest,
          configurationPreset,
          onSelectConfigurationPreset: handleSelectConfigurationPreset,
          showResonance,
          activeResonanceCount,
          onToggleResonance: () => setShowResonance(!showResonance),
          cinematicTour,
          cinematicTourStopLabel: CINEMATIC_TOUR_STOPS[cinematicTourStepIndex]?.title,
          cinematicTourStepIndex,
          cinematicTourTotalStops: CINEMATIC_TOUR_STOPS.length,
          onToggleCinematicTour: handleToggleCinematicTour,
          bloomIntensity,
          onBloomIntensityChange: setBloomIntensity,
          compact,
        }}
      />
    </div>
  );
}
