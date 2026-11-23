import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  BRAIN_HUBS,
  NAV_TABS,
  NavTab,
  SERVER_TIERS,
  SPENTA_APPS,
  SPENTA_CONTACT_EMAIL,
  ServerTierId,
  SpentaApp,
  STARTER_RECIPES,
} from '../data/spentaManifest';

import {
  DEPLOYMENT_PROFILES,
  DeploymentProfileSpec,
  DeploymentTargetId,
} from '../data/deploymentProfiles';
import { PaletteMode, ThemeMode, useTheme } from '../context/ThemeContext';
import {
  buildShareableUrl,
  clearShareUrlParams,
  ParsedShareSnapshot,
  parseShareUrlParams,
} from '../utils/shareUrlCodec';
import {
  ActiveBrainSelection,
  LinkPathwayNodeOptions,
  PathwayBrainLinkTarget,
  resolveBrainHubForPathwayNode,
} from '../utils/pathwayBrainLink';

const STACK_STORAGE_KEY = 'spenta_sovereign_stack_v1';
const PROPOSALS_STORAGE_KEY = 'spenta_saved_proposals_v1';
const CORE_CONFIG_STORAGE_KEY = 'spenta_core_layer_configs_v1';
const CORE_AUDIT_STORAGE_KEY = 'spenta_core_audit_log_v1';
const DEPLOYMENT_TARGET_STORAGE_KEY = 'spenta_deployment_target_v1';
const MOBILE_GRID_STORAGE_KEY = 'spenta_mobile_grid_v1';
const NEURAL_CORE_STORAGE_KEY = 'spenta_neural_core_v2';
const ACTIVE_TAB_STORAGE_KEY = 'spenta_active_tab_v1';
const DEFAULT_SELECTED_IDS = ['icr_ops', 'genai_bi', 'mis_erp', 'cyber_sla'];

export type NeuralCoreSystem = 'spiral-galaxy' | 'solar-map';
export type NeuralSimulationSystem = 'spiral' | 'solar' | 'nebula';
export type NeuralGalaxyPresetId =
  | 'andromeda-spiral'
  | 'elliptical-dense'
  | 'active-starburst'
  | 'procedural-nebula';
export type NeuralObservatoryFinish = 'cosmos' | 'nocturnal' | 'nebula' | 'stone';
export type NeuralCameraPreset = 'overview' | 'operations' | 'experience' | 'ecliptic';
export type SolarConfigurationPresetId =
  | 'stable-circular'
  | 'highly-eccentric'
  | 'young-chaotic';
export type SolarViewModeId = 'overview' | 'ecliptic' | 'inner-core';

export interface NeuralCoreState {
  activeSystem: NeuralCoreSystem;
  solarTimeScale: number;
  galaxyRotationSpeed: number;
  galaxyPreset: NeuralGalaxyPresetId;
  observatoryFinish: NeuralObservatoryFinish | null;
  bloomIntensity: number;
  nebulaMode: boolean;
  nebulaDensity: number;
  particleTurbulence: number;
  starDensity: number;
  orbitalDecay: number;
  orbitalSpread: number;
  galaxyCameraPreset: NeuralCameraPreset;
  galaxyAutoRotate: boolean;
  solarOrbitalVelocity: number;
  solarOrbitalInclinationDeg: number;
  solarConfigurationPreset: SolarConfigurationPresetId;
  solarViewMode: SolarViewModeId;
  solarShowOrbits: boolean;
  solarAutoRotate: boolean;
  solarDayNightCycle: boolean;
  solarShowConstellations: boolean;
  solarShowResonance: boolean;
  solarFollowPlanet: boolean;
}

export const DEFAULT_NEURAL_CORE_STATE: NeuralCoreState = {
  activeSystem: 'solar-map',
  solarTimeScale: 1.0,
  galaxyRotationSpeed: 0.85,
  galaxyPreset: 'andromeda-spiral',
  observatoryFinish: null,
  bloomIntensity: 1.0,
  nebulaMode: false,
  nebulaDensity: 1.0,
  particleTurbulence: 0.75,
  starDensity: 1.0,
  orbitalDecay: 0.0,
  orbitalSpread: 0.65,
  galaxyCameraPreset: 'overview',
  galaxyAutoRotate: false,
  solarOrbitalVelocity: 1.0,
  solarOrbitalInclinationDeg: 6,
  solarConfigurationPreset: 'stable-circular',
  solarViewMode: 'overview',
  solarShowOrbits: true,
  solarAutoRotate: false,
  solarDayNightCycle: false,
  solarShowConstellations: false,
  solarShowResonance: false,
  solarFollowPlanet: false,
};

export type { PaletteMode, ThemeMode };
export type CoreLayerId = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6';
export type CoreAuditScope = CoreLayerId | 'Hardware';
export type CoreIsolationMode =
  | 'Air-Gapped On-Prem'
  | 'Private Sovereign VPC'
  | 'Hybrid Edge';
export type CorePolicyMode =
  | 'Strict OPA (>= 0.88 HITL)'
  | 'Balanced OPA (>= 0.85 HITL)'
  | 'Audit-Only Monitor';

export interface LayerConfig {
  isolationMode: CoreIsolationMode;
  policyMode: CorePolicyMode;
  teeEnabled: boolean;
  slaTarget: string;
}

export interface CoreAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  layer: CoreAuditScope;
  action: string;
  field: string;
  previousValue: string;
  newValue: string;
}

export const DEFAULT_CORE_LAYER_CONFIGS: Record<CoreLayerId, LayerConfig> = {
  L6: {
    isolationMode: 'Private Sovereign VPC',
    policyMode: 'Strict OPA (>= 0.88 HITL)',
    teeEnabled: false,
    slaTarget: '99.95% UI uptime · <120ms TTI',
  },
  L5: {
    isolationMode: 'Air-Gapped On-Prem',
    policyMode: 'Strict OPA (>= 0.88 HITL)',
    teeEnabled: true,
    slaTarget: '0.88 HITL Gate · 100% immutable audit trace',
  },
  L4: {
    isolationMode: 'Private Sovereign VPC',
    policyMode: 'Balanced OPA (>= 0.85 HITL)',
    teeEnabled: false,
    slaTarget: '60–90 FPS XR · <18MB WebAR payloads',
  },
  L3: {
    isolationMode: 'Air-Gapped On-Prem',
    policyMode: 'Strict OPA (>= 0.88 HITL)',
    teeEnabled: true,
    slaTarget: '<30s/form ICR · 0 bytes cloud PII egress',
  },
  L2: {
    isolationMode: 'Air-Gapped On-Prem',
    policyMode: 'Strict OPA (>= 0.88 HITL)',
    teeEnabled: true,
    slaTarget: '<50ms edge inference · Hardware-enforced memory encryption',
  },
  L1: {
    isolationMode: 'Hybrid Edge',
    policyMode: 'Balanced OPA (>= 0.85 HITL)',
    teeEnabled: true,
    slaTarget: '80 BaaS Stations / 480 EVs · Sub-second MQTT ingest',
  },
};

function buildInitialAuditLog(): CoreAuditEntry[] {
  const now = Date.now();
  return [
    {
      id: 'audit_init_1',
      timestamp: new Date(now - 1000 * 60 * 18).toISOString(),
      actor: 'System Bootstrap',
      layer: 'L5',
      action: 'Enforced OPA Governance Gate',
      field: 'OPA Policy Mode',
      previousValue: 'Balanced OPA (>= 0.85 HITL)',
      newValue: 'Strict OPA (>= 0.88 HITL)',
    },
    {
      id: 'audit_init_2',
      timestamp: new Date(now - 1000 * 60 * 42).toISOString(),
      actor: 'Security Architect',
      layer: 'L2',
      action: 'Enabled Confidential Compute TEE',
      field: 'Hardware TEE (SEV-SNP/TDX)',
      previousValue: 'Disabled',
      newValue: 'Enabled (AMD SEV-SNP / Intel TDX)',
    },
    {
      id: 'audit_init_3',
      timestamp: new Date(now - 1000 * 60 * 95).toISOString(),
      actor: 'Infra Lead',
      layer: 'Hardware',
      action: 'Initialized Server PC Baseline',
      field: 'Target Server Tier',
      previousValue: 'Unassigned',
      newValue: 'TIER 3 — Spenta Budget Baseline ($8.5K–$10.5K)',
    },
  ];
}

export interface SavedProposal {
  id: string;
  createdAt: string;
  organization: string;
  contactName: string;
  email: string;
  deployment: 'On-Prem' | 'Private VPC' | 'Air-Gap' | 'SaaS';
  timeline: string;
  engagementModel?: string;
  commercialTier?: string;
  onboardingPath?: string;
  notes: string;
  appIds: string[];
  appNames: string[];
  estimatedBuildUsd: number;
  quarterlyRetainerUsd?: number;
  blendedGmPct: number;
  recommendedTier: ServerTierId;
}

export interface StackMetrics {
  /** Strictly one-time build setup CapEx (kept for legacy compatibility alongside oneTimeBuildUsd) */
  totalSetupUsd: number;
  oneTimeBuildUsd: number;
  quarterlyRetainerUsd: number;
  annualizedRetainerUsd: number;
  year1ContractUsd: number;
  buildWeightedGmPct: number;
  retainerWeightedGmPct: number;
  /** Revenue-weighted composite GM% across Year-1 contract value (one-time builds + 4x quarterly retainers) */
  blendedGmPct: number;
  tier: ServerTierId;
  activeLayers: Set<string>;
  synergyPairs: [string, string][];
  escalatedByCount: boolean;
}

export interface PendingNavFocus {
  type:
    | 'app'
    | 'slide'
    | 'infographic'
    | 'layer'
    | 'tier'
    | 'case'
    | 'blueprint'
    | 'studio'
    | 'showreel'
    | 'brain-hub';
  id: string;
  appId?: string;
  open3D?: boolean;
  returnTab?: NavTab;
  returnLabel?: string;
  ts: number;
}

export interface DeckProgressInfo {
  slideNumber: number;
  totalSlides: number;
  trackLabel: string;
  section: string;
  title: string;
}

export interface ProjectArchitectureMetadata {
  project: string;
  updatedAt: string;
  infrastructureTarget: {
    id: DeploymentTargetId;
    environment: string;
    topology: string;
    transport: string;
    enclaveBoundary: string;
    latencyBudget: string;
    egressPolicy: string;
    compliancePosture: string;
    costPosture: string;
  };
  stackSizing: {
    activeModules: number;
    recommendedTier: string;
    estimatedBuildUsd: number;
    quarterlyRetainerUsd: number;
    year1ContractUsd: number;
  };
  governanceSummary: {
    teeEnabledLayers: number;
    strictOpaLayers: number;
    airGappedLayers: number;
    vpcLayers: number;
  };
  coreLayers: Record<CoreLayerId, LayerConfig>;
}

interface StackContextValue {
  theme: ThemeMode;
  paletteMode: PaletteMode;
  setTheme: (theme: ThemeMode) => void;
  setPaletteMode: (palette: PaletteMode) => void;
  toggleTheme: () => void;
  mobileGridVisible: boolean;
  setMobileGridVisible: (visible: boolean) => void;
  toggleMobileGrid: () => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  visitedTabs: NavTab[];
  deckProgress: DeckProgressInfo | null;
  setDeckProgress: (progress: DeckProgressInfo | null) => void;
  pendingNavFocus: PendingNavFocus | null;
  navigateToItem: (tab: NavTab, focus?: Omit<PendingNavFocus, 'ts'>) => void;
  clearPendingNavFocus: () => void;
  aiAssistantOpen: boolean;
  setAiAssistantOpen: (open: boolean) => void;
  selectedIds: string[];
  selectedApps: SpentaApp[];
  appMap: Record<string, SpentaApp>;
  toggleApp: (id: string) => void;
  applyRecipe: (recipeId: string) => void;
  clearStack: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  autoNotice: string | null;
  setAutoNotice: (msg: string | null) => void;
  hitlConfidence: number;
  setHitlConfidence: (val: number) => void;
  stackMetrics: StackMetrics;
  savedProposals: SavedProposal[];
  saveProposal: (input: Omit<SavedProposal, 'id' | 'createdAt' | 'appIds' | 'appNames' | 'estimatedBuildUsd' | 'quarterlyRetainerUsd' | 'blendedGmPct' | 'recommendedTier'>) => SavedProposal;
  deleteProposal: (id: string) => void;
  exportStackJson: (extra?: Record<string, unknown>) => void;
  buildExecutiveBrief: () => string;
  buildMailtoHref: (subject?: string, bodyExtra?: string) => string;
  deploymentTarget: DeploymentTargetId;
  deploymentProfile: DeploymentProfileSpec;
  projectArchitectureMetadata: ProjectArchitectureMetadata;
  setDeploymentTarget: (target: DeploymentTargetId, actor?: string) => void;
  coreLayerConfigs: Record<CoreLayerId, LayerConfig>;
  coreAuditLog: CoreAuditEntry[];
  updateCoreLayerConfig: (
    layerId: CoreLayerId,
    patch: Partial<LayerConfig>,
    actionLabel?: string,
    actor?: string,
  ) => void;
  resetCoreLayerConfig: (layerId: CoreLayerId, actor?: string) => void;
  logCoreAuditEvent: (entry: Omit<CoreAuditEntry, 'id' | 'timestamp'>) => void;
  clearCoreAuditLog: () => void;
  sharedSnapshotSummary: string | null;
  dismissSharedSnapshot: () => void;
  resetToLocalDefaults: () => void;
  buildShareUrl: (overrides?: {
    tab?: NavTab;
    hubId?: string | null;
    brainMode?: '3d' | 'radar';
  }) => string;
  activeBrainSelection: ActiveBrainSelection;
  selectBrainHub: (
    hubId: string,
    options?: {
      appId?: string;
      source?: ActiveBrainSelection['source'];
      pathwayBranchId?: string;
      pathwayNodeCode?: string;
      pathwayNodeTitle?: string;
    },
  ) => void;
  linkPathwayNodeToBrain: (options: LinkPathwayNodeOptions) => PathwayBrainLinkTarget;
  neuralCoreState: NeuralCoreState;
  activeNeuralSystem: NeuralCoreSystem;
  setActiveNeuralSystem: (system: NeuralCoreSystem) => void;
  toggleNeuralSystem: () => void;
  activeSimulationSystem: NeuralSimulationSystem;
  setActiveSimulationSystem: (system: NeuralSimulationSystem) => void;
  solarTimeScale: number;
  setSolarTimeScale: (scale: number) => void;
  galaxyRotationSpeed: number;
  setGalaxyRotationSpeed: (speed: number) => void;
  neuralGalaxyPreset: NeuralGalaxyPresetId;
  setNeuralGalaxyPreset: (preset: NeuralGalaxyPresetId) => void;
  neuralObservatoryFinish: NeuralObservatoryFinish | null;
  setNeuralObservatoryFinish: (finish: NeuralObservatoryFinish) => void;
  neuralBloomIntensity: number;
  setNeuralBloomIntensity: (intensity: number) => void;
  nebulaMode: boolean;
  setNebulaMode: (enabled: boolean) => void;
  toggleNebulaMode: () => void;
  nebulaDensity: number;
  setNebulaDensity: (density: number) => void;
  particleTurbulence: number;
  setParticleTurbulence: (turbulence: number) => void;
  starDensity: number;
  setStarDensity: (density: number) => void;
  orbitalDecay: number;
  setOrbitalDecay: (decay: number) => void;
  orbitalSpread: number;
  setOrbitalSpread: (spread: number) => void;
  galaxyCameraPreset: NeuralCameraPreset;
  setGalaxyCameraPreset: (preset: NeuralCameraPreset) => void;
  galaxyAutoRotate: boolean;
  setGalaxyAutoRotate: (enabled: boolean) => void;
  solarOrbitalVelocity: number;
  setSolarOrbitalVelocity: (vel: number) => void;
  solarOrbitalInclinationDeg: number;
  setSolarOrbitalInclinationDeg: (deg: number) => void;
  solarConfigurationPreset: SolarConfigurationPresetId;
  setSolarConfigurationPreset: (preset: SolarConfigurationPresetId) => void;
  solarViewMode: SolarViewModeId;
  setSolarViewMode: (mode: SolarViewModeId) => void;
  solarShowOrbits: boolean;
  setSolarShowOrbits: (show: boolean) => void;
  solarAutoRotate: boolean;
  setSolarAutoRotate: (enabled: boolean) => void;
  solarDayNightCycle: boolean;
  setSolarDayNightCycle: (enabled: boolean) => void;
  solarShowConstellations: boolean;
  setSolarShowConstellations: (enabled: boolean) => void;
  solarShowResonance: boolean;
  setSolarShowResonance: (enabled: boolean) => void;
  solarFollowPlanet: boolean;
  setSolarFollowPlanet: (enabled: boolean) => void;
  resetNeuralCoreState: () => void;
}

const StackContext = createContext<StackContextValue | null>(null);

function loadStoredIds(): string[] {
  try {
    const raw = window.localStorage.getItem(STACK_STORAGE_KEY);
    if (!raw) return DEFAULT_SELECTED_IDS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const validSet = new Set(SPENTA_APPS.map((a) => a.id));
      const clean = parsed.filter((id): id is string => typeof id === 'string' && validSet.has(id));
      return clean;
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_SELECTED_IDS;
}

function loadStoredProposals(): SavedProposal[] {
  try {
    const raw = window.localStorage.getItem(PROPOSALS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // ignore storage errors
  }
  return [];
}

function loadStoredCoreConfigs(): Record<CoreLayerId, LayerConfig> {
  try {
    const raw = window.localStorage.getItem(CORE_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_CORE_LAYER_CONFIGS;
    const parsed = JSON.parse(raw) as Partial<Record<CoreLayerId, Partial<LayerConfig>>>;
    const merged = { ...DEFAULT_CORE_LAYER_CONFIGS };
    (['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] as CoreLayerId[]).forEach((layerId) => {
      if (parsed && parsed[layerId]) {
        merged[layerId] = { ...DEFAULT_CORE_LAYER_CONFIGS[layerId], ...parsed[layerId] };
      }
    });
    return merged;
  } catch {
    // ignore storage errors
  }
  return DEFAULT_CORE_LAYER_CONFIGS;
}

function loadStoredAuditLog(): CoreAuditEntry[] {
  try {
    const raw = window.localStorage.getItem(CORE_AUDIT_STORAGE_KEY);
    if (!raw) return buildInitialAuditLog();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as CoreAuditEntry[];
  } catch {
    // ignore storage errors
  }
  return buildInitialAuditLog();
}

function loadStoredDeploymentTarget(): DeploymentTargetId {
  try {
    const raw = window.localStorage.getItem(DEPLOYMENT_TARGET_STORAGE_KEY);
    if (raw === 'on-prem' || raw === 'private-vpc' || raw === 'air-gapped') return raw;
  } catch {
    // ignore storage errors
  }
  return 'on-prem';
}

function loadStoredMobileGridVisible(): boolean {
  try {
    return window.localStorage.getItem(MOBILE_GRID_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function clampSolarTimeScale(val: number): number {
  if (!Number.isFinite(val)) return DEFAULT_NEURAL_CORE_STATE.solarTimeScale;
  return Math.round(Math.max(0.1, Math.min(5.0, val)) * 10) / 10;
}

function clampGalaxyRotationSpeed(val: number): number {
  if (!Number.isFinite(val)) return DEFAULT_NEURAL_CORE_STATE.galaxyRotationSpeed;
  return Math.round(Math.max(0, Math.min(2.5, val)) * 100) / 100;
}

function clampBloomIntensity(val: number): number {
  if (!Number.isFinite(val)) return DEFAULT_NEURAL_CORE_STATE.bloomIntensity;
  return Math.round(Math.max(0, Math.min(2.0, val)) * 100) / 100;
}

function clampNebulaDensity(val: number): number {
  if (!Number.isFinite(val)) return DEFAULT_NEURAL_CORE_STATE.nebulaDensity;
  return Math.round(Math.max(0.2, Math.min(2.0, val)) * 100) / 100;
}

function clampParticleTurbulence(val: number): number {
  if (!Number.isFinite(val)) return DEFAULT_NEURAL_CORE_STATE.particleTurbulence;
  return Math.round(Math.max(0, Math.min(2.0, val)) * 100) / 100;
}

function clampStarDensity(val: number): number {
  if (!Number.isFinite(val)) return DEFAULT_NEURAL_CORE_STATE.starDensity;
  return Math.round(Math.max(0.2, Math.min(1.0, val)) * 100) / 100;
}

function clampOrbitalDecay(val: number): number {
  if (!Number.isFinite(val)) return DEFAULT_NEURAL_CORE_STATE.orbitalDecay;
  return Math.round(Math.max(0, Math.min(1.0, val)) * 100) / 100;
}

function clampOrbitalSpread(val: number): number {
  if (!Number.isFinite(val)) return DEFAULT_NEURAL_CORE_STATE.orbitalSpread;
  return Math.round(Math.max(0.25, Math.min(1.5, val)) * 100) / 100;
}

function clampSolarOrbitalVelocity(val: number): number {
  if (!Number.isFinite(val)) return DEFAULT_NEURAL_CORE_STATE.solarOrbitalVelocity;
  return Math.round(Math.max(0, Math.min(4.0, val)) * 100) / 100;
}

function clampSolarOrbitalInclinationDeg(val: number): number {
  if (!Number.isFinite(val)) return DEFAULT_NEURAL_CORE_STATE.solarOrbitalInclinationDeg;
  return Math.round(Math.max(0, Math.min(45, val)));
}

function loadStoredActiveTab(): NavTab {
  try {
    const raw = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    if (raw && (NAV_TABS as string[]).includes(raw)) {
      return raw as NavTab;
    }
  } catch {
    // ignore storage errors
  }
  return 'App Vault';
}

function loadStoredNeuralCoreState(): NeuralCoreState {
  try {
    const raw = window.localStorage.getItem(NEURAL_CORE_STORAGE_KEY);
    if (!raw) return DEFAULT_NEURAL_CORE_STATE;
    const parsed = JSON.parse(raw) as Partial<NeuralCoreState>;
    const activeSystem: NeuralCoreSystem =
      parsed.activeSystem === 'spiral-galaxy' ? 'spiral-galaxy' : 'solar-map';
    const galaxyPreset: NeuralGalaxyPresetId =
      parsed.galaxyPreset === 'elliptical-dense' ||
      parsed.galaxyPreset === 'active-starburst' ||
      parsed.galaxyPreset === 'procedural-nebula'
        ? parsed.galaxyPreset
        : 'andromeda-spiral';
    const observatoryFinish: NeuralObservatoryFinish | null =
      parsed.observatoryFinish === 'cosmos' ||
      parsed.observatoryFinish === 'nocturnal' ||
      parsed.observatoryFinish === 'nebula' ||
      parsed.observatoryFinish === 'stone'
        ? parsed.observatoryFinish
        : null;
    const galaxyCameraPreset: NeuralCameraPreset =
      parsed.galaxyCameraPreset === 'operations' ||
      parsed.galaxyCameraPreset === 'experience' ||
      parsed.galaxyCameraPreset === 'ecliptic'
        ? parsed.galaxyCameraPreset
        : 'overview';
    const solarConfigurationPreset: SolarConfigurationPresetId =
      parsed.solarConfigurationPreset === 'highly-eccentric' ||
      parsed.solarConfigurationPreset === 'young-chaotic'
        ? parsed.solarConfigurationPreset
        : 'stable-circular';
    const solarViewMode: SolarViewModeId =
      parsed.solarViewMode === 'ecliptic' || parsed.solarViewMode === 'inner-core'
        ? parsed.solarViewMode
        : 'overview';
    return {
      activeSystem,
      solarTimeScale: clampSolarTimeScale(parsed.solarTimeScale ?? DEFAULT_NEURAL_CORE_STATE.solarTimeScale),
      galaxyRotationSpeed: clampGalaxyRotationSpeed(
        parsed.galaxyRotationSpeed ?? DEFAULT_NEURAL_CORE_STATE.galaxyRotationSpeed,
      ),
      galaxyPreset,
      observatoryFinish,
      bloomIntensity: clampBloomIntensity(parsed.bloomIntensity ?? DEFAULT_NEURAL_CORE_STATE.bloomIntensity),
      nebulaMode: Boolean(parsed.nebulaMode),
      nebulaDensity: clampNebulaDensity(parsed.nebulaDensity ?? DEFAULT_NEURAL_CORE_STATE.nebulaDensity),
      particleTurbulence: clampParticleTurbulence(
        parsed.particleTurbulence ?? DEFAULT_NEURAL_CORE_STATE.particleTurbulence,
      ),
      starDensity: clampStarDensity(parsed.starDensity ?? DEFAULT_NEURAL_CORE_STATE.starDensity),
      orbitalDecay: clampOrbitalDecay(parsed.orbitalDecay ?? DEFAULT_NEURAL_CORE_STATE.orbitalDecay),
      orbitalSpread: clampOrbitalSpread(parsed.orbitalSpread ?? DEFAULT_NEURAL_CORE_STATE.orbitalSpread),
      galaxyCameraPreset,
      galaxyAutoRotate: Boolean(parsed.galaxyAutoRotate),
      solarOrbitalVelocity: clampSolarOrbitalVelocity(
        parsed.solarOrbitalVelocity ?? DEFAULT_NEURAL_CORE_STATE.solarOrbitalVelocity,
      ),
      solarOrbitalInclinationDeg: clampSolarOrbitalInclinationDeg(
        parsed.solarOrbitalInclinationDeg ?? DEFAULT_NEURAL_CORE_STATE.solarOrbitalInclinationDeg,
      ),
      solarConfigurationPreset,
      solarViewMode,
      solarShowOrbits:
        typeof parsed.solarShowOrbits === 'boolean'
          ? parsed.solarShowOrbits
          : DEFAULT_NEURAL_CORE_STATE.solarShowOrbits,
      solarAutoRotate: Boolean(parsed.solarAutoRotate),
      solarDayNightCycle: Boolean(parsed.solarDayNightCycle),
      solarShowConstellations: Boolean(parsed.solarShowConstellations),
      solarShowResonance: Boolean(parsed.solarShowResonance),
      solarFollowPlanet: Boolean(parsed.solarFollowPlanet),
    };
  } catch {
    return DEFAULT_NEURAL_CORE_STATE;
  }
}

export function StackProvider({ children }: { children: React.ReactNode }) {
  const { theme, paletteMode, setTheme, setPaletteMode, toggleTheme } = useTheme();
  const [mobileGridVisible, setMobileGridVisible] = useState<boolean>(loadStoredMobileGridVisible);

  const toggleMobileGrid = useCallback(() => {
    setMobileGridVisible((prev) => !prev);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('spenta-mobile-grid-on', mobileGridVisible);
    try {
      window.localStorage.setItem(MOBILE_GRID_STORAGE_KEY, String(mobileGridVisible));
    } catch {
      // ignore storage errors
    }
  }, [mobileGridVisible]);
  const [initialShareSnapshot] = useState<ParsedShareSnapshot | null>(() => parseShareUrlParams());
  const [sharedSnapshotSummary, setSharedSnapshotSummary] = useState<string | null>(
    () => initialShareSnapshot?.summary ?? null,
  );
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTab>(
    () => initialShareSnapshot?.activeTab ?? loadStoredActiveTab(),
  );
  const [visitedTabs, setVisitedTabs] = useState<NavTab[]>(() => [
    initialShareSnapshot?.activeTab ?? loadStoredActiveTab(),
  ]);
  const [deckProgress, setDeckProgress] = useState<DeckProgressInfo | null>(null);
  const [pendingNavFocus, setPendingNavFocus] = useState<PendingNavFocus | null>(() => {
    if (initialShareSnapshot?.hubId) {
      return {
        type: 'brain-hub',
        id: initialShareSnapshot.hubId,
        open3D: initialShareSnapshot.brainMode !== 'radar',
        ts: Date.now(),
      };
    }
    return null;
  });
  const [activeBrainSelection, setActiveBrainSelection] = useState<ActiveBrainSelection>(() => {
    const initialHubId = initialShareSnapshot?.hubId;
    if (initialHubId && BRAIN_HUBS.some((h) => h.id === initialHubId)) {
      const firstApp = SPENTA_APPS.find((a) => a.hubId === initialHubId);
      return {
        hubId: initialHubId,
        appId: firstApp?.id,
        source: 'url',
        nonce: 1,
      };
    }
    return {
      hubId: 'fintech',
      appId: 'icr_ops',
      source: 'brain',
      nonce: 0,
    };
  });
  const [aiAssistantOpen, setAiAssistantOpen] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    () => initialShareSnapshot?.selectedIds ?? loadStoredIds(),
  );
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [autoNotice, setAutoNotice] = useState<string | null>(null);
  const [hitlConfidence, setHitlConfidence] = useState<number>(
    () => initialShareSnapshot?.hitlConfidence ?? 0.91,
  );
  const [savedProposals, setSavedProposals] = useState<SavedProposal[]>(() => loadStoredProposals());
  const [deploymentTarget, setDeploymentTargetState] = useState<DeploymentTargetId>(
    () => initialShareSnapshot?.deploymentTarget ?? loadStoredDeploymentTarget(),
  );
  const [coreLayerConfigs, setCoreLayerConfigs] = useState<Record<CoreLayerId, LayerConfig>>(() => {
    if (initialShareSnapshot?.deploymentTarget) {
      const presets = DEPLOYMENT_PROFILES[initialShareSnapshot.deploymentTarget].layerPresets;
      return {
        L1: { ...presets.L1 },
        L2: { ...presets.L2 },
        L3: { ...presets.L3 },
        L4: { ...presets.L4 },
        L5: { ...presets.L5 },
        L6: { ...presets.L6 },
      };
    }
    return loadStoredCoreConfigs();
  });
  const [architectureUpdatedAt, setArchitectureUpdatedAt] = useState<string>(() =>
    new Date().toISOString(),
  );
  const [coreAuditLog, setCoreAuditLog] = useState<CoreAuditEntry[]>(() => loadStoredAuditLog());
  const [neuralCoreState, setNeuralCoreState] = useState<NeuralCoreState>(() =>
    loadStoredNeuralCoreState(),
  );

  const deploymentProfile = DEPLOYMENT_PROFILES[deploymentTarget];

  const navigateToItem = useCallback((tab: NavTab, focus?: Omit<PendingNavFocus, 'ts'>) => {
    setActiveTab(tab);
    setPendingNavFocus(focus ? { ...focus, ts: Date.now() } : null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const clearPendingNavFocus = useCallback(() => setPendingNavFocus(null), []);

  const selectBrainHub = useCallback<StackContextValue['selectBrainHub']>((hubId, options) => {
    const validHub = BRAIN_HUBS.find((h) => h.id === hubId) ?? BRAIN_HUBS[0];
    const resolvedAppId =
      options?.appId && SPENTA_APPS.some((a) => a.id === options.appId)
        ? options.appId
        : SPENTA_APPS.find((a) => a.hubId === validHub.id)?.id;

    setActiveBrainSelection((prev) => ({
      hubId: validHub.id,
      appId: resolvedAppId,
      source: options?.source ?? 'brain',
      pathwayBranchId: options?.pathwayBranchId,
      pathwayNodeCode: options?.pathwayNodeCode,
      pathwayNodeTitle: options?.pathwayNodeTitle,
      nonce: prev.nonce + 1,
    }));
  }, []);

  const linkPathwayNodeToBrain = useCallback<StackContextValue['linkPathwayNodeToBrain']>(
    (options) => {
      const target = resolveBrainHubForPathwayNode(options);
      setActiveBrainSelection((prev) => ({
        hubId: target.hubId,
        appId: target.appId,
        source: 'pathway',
        pathwayBranchId: options.branchId,
        pathwayNodeCode: options.nodeCode,
        pathwayNodeTitle: options.nodeTitle,
        nonce: prev.nonce + 1,
      }));

      if (options.navigateToBrain) {
        navigateToItem('The Brain', {
          type: 'brain-hub',
          id: target.hubId,
          appId: target.appId,
          open3D: options.open3D !== false,
          returnTab: options.returnTab,
          returnLabel: options.returnLabel,
        });
      }

      return target;
    },
    [navigateToItem],
  );

  const appMap = useMemo(
    () => Object.fromEntries(SPENTA_APPS.map((app) => [app.id, app])) as Record<string, SpentaApp>,
    [],
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STACK_STORAGE_KEY, JSON.stringify(selectedIds));
    } catch {
      // ignore storage quota errors
    }
  }, [selectedIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(savedProposals));
    } catch {
      // ignore storage quota errors
    }
  }, [savedProposals]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CORE_CONFIG_STORAGE_KEY, JSON.stringify(coreLayerConfigs));
    } catch {
      // ignore storage quota errors
    }
  }, [coreLayerConfigs]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CORE_AUDIT_STORAGE_KEY, JSON.stringify(coreAuditLog));
    } catch {
      // ignore storage quota errors
    }
  }, [coreAuditLog]);

  useEffect(() => {
    try {
      window.localStorage.setItem(DEPLOYMENT_TARGET_STORAGE_KEY, deploymentTarget);
    } catch {
      // ignore storage quota errors
    }
  }, [deploymentTarget]);

  useEffect(() => {
    if (!autoNotice) return;
    const timer = window.setTimeout(() => setAutoNotice(null), 5500);
    return () => window.clearTimeout(timer);
  }, [autoNotice]);

  useEffect(() => {
    setVisitedTabs((prev) => (prev.includes(activeTab) ? prev : [...prev, activeTab]));
    try {
      window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
    } catch {
      // ignore storage quota errors
    }
  }, [activeTab]);

  useEffect(() => {
    try {
      window.localStorage.setItem(NEURAL_CORE_STORAGE_KEY, JSON.stringify(neuralCoreState));
    } catch {
      // ignore storage quota errors
    }
  }, [neuralCoreState]);

  const activeSimulationSystem: NeuralSimulationSystem =
    neuralCoreState.activeSystem === 'solar-map'
      ? 'solar'
      : neuralCoreState.nebulaMode
        ? 'nebula'
        : 'spiral';

  const setActiveSimulationSystem = useCallback((system: NeuralSimulationSystem) => {
    setNeuralCoreState((prev) => {
      if (system === 'solar') {
        return prev.activeSystem === 'solar-map' ? prev : { ...prev, activeSystem: 'solar-map' };
      }
      if (system === 'nebula') {
        return prev.activeSystem === 'spiral-galaxy' && prev.nebulaMode
          ? prev
          : { ...prev, activeSystem: 'spiral-galaxy', nebulaMode: true };
      }
      return prev.activeSystem === 'spiral-galaxy' && !prev.nebulaMode
        ? prev
        : { ...prev, activeSystem: 'spiral-galaxy', nebulaMode: false };
    });
  }, []);

  const setActiveNeuralSystem = useCallback((system: NeuralCoreSystem) => {
    setNeuralCoreState((prev) =>
      prev.activeSystem === system ? prev : { ...prev, activeSystem: system },
    );
  }, []);

  const toggleNeuralSystem = useCallback(() => {
    setNeuralCoreState((prev) => ({
      ...prev,
      activeSystem: prev.activeSystem === 'spiral-galaxy' ? 'solar-map' : 'spiral-galaxy',
    }));
  }, []);

  const setSolarTimeScale = useCallback((scale: number) => {
    const next = clampSolarTimeScale(scale);
    setNeuralCoreState((prev) => (prev.solarTimeScale === next ? prev : { ...prev, solarTimeScale: next }));
  }, []);

  const setGalaxyRotationSpeed = useCallback((speed: number) => {
    const next = clampGalaxyRotationSpeed(speed);
    setNeuralCoreState((prev) =>
      prev.galaxyRotationSpeed === next ? prev : { ...prev, galaxyRotationSpeed: next },
    );
  }, []);

  const setNeuralGalaxyPreset = useCallback((preset: NeuralGalaxyPresetId) => {
    setNeuralCoreState((prev) =>
      prev.galaxyPreset === preset ? prev : { ...prev, galaxyPreset: preset },
    );
  }, []);

  const setNeuralObservatoryFinish = useCallback((finish: NeuralObservatoryFinish) => {
    setNeuralCoreState((prev) =>
      prev.observatoryFinish === finish ? prev : { ...prev, observatoryFinish: finish },
    );
  }, []);

  const setNeuralBloomIntensity = useCallback((intensity: number) => {
    const next = clampBloomIntensity(intensity);
    setNeuralCoreState((prev) =>
      prev.bloomIntensity === next ? prev : { ...prev, bloomIntensity: next },
    );
  }, []);

  const setNebulaMode = useCallback((enabled: boolean) => {
    setNeuralCoreState((prev) =>
      prev.nebulaMode === enabled ? prev : { ...prev, nebulaMode: enabled },
    );
  }, []);

  const toggleNebulaMode = useCallback(() => {
    setNeuralCoreState((prev) => ({
      ...prev,
      nebulaMode: !prev.nebulaMode,
    }));
  }, []);

  const setNebulaDensity = useCallback((density: number) => {
    const next = clampNebulaDensity(density);
    setNeuralCoreState((prev) =>
      prev.nebulaDensity === next ? prev : { ...prev, nebulaDensity: next },
    );
  }, []);

  const setParticleTurbulence = useCallback((turbulence: number) => {
    const next = clampParticleTurbulence(turbulence);
    setNeuralCoreState((prev) =>
      prev.particleTurbulence === next ? prev : { ...prev, particleTurbulence: next },
    );
  }, []);

  const setStarDensity = useCallback((density: number) => {
    const next = clampStarDensity(density);
    setNeuralCoreState((prev) => (prev.starDensity === next ? prev : { ...prev, starDensity: next }));
  }, []);

  const setOrbitalDecay = useCallback((decay: number) => {
    const next = clampOrbitalDecay(decay);
    setNeuralCoreState((prev) => (prev.orbitalDecay === next ? prev : { ...prev, orbitalDecay: next }));
  }, []);

  const setOrbitalSpread = useCallback((spread: number) => {
    const next = clampOrbitalSpread(spread);
    setNeuralCoreState((prev) => (prev.orbitalSpread === next ? prev : { ...prev, orbitalSpread: next }));
  }, []);

  const setGalaxyCameraPreset = useCallback((preset: NeuralCameraPreset) => {
    setNeuralCoreState((prev) =>
      prev.galaxyCameraPreset === preset ? prev : { ...prev, galaxyCameraPreset: preset },
    );
  }, []);

  const setGalaxyAutoRotate = useCallback((enabled: boolean) => {
    setNeuralCoreState((prev) =>
      prev.galaxyAutoRotate === enabled ? prev : { ...prev, galaxyAutoRotate: enabled },
    );
  }, []);

  const setSolarOrbitalVelocity = useCallback((vel: number) => {
    const next = clampSolarOrbitalVelocity(vel);
    setNeuralCoreState((prev) =>
      prev.solarOrbitalVelocity === next ? prev : { ...prev, solarOrbitalVelocity: next },
    );
  }, []);

  const setSolarOrbitalInclinationDeg = useCallback((deg: number) => {
    const next = clampSolarOrbitalInclinationDeg(deg);
    setNeuralCoreState((prev) =>
      prev.solarOrbitalInclinationDeg === next ? prev : { ...prev, solarOrbitalInclinationDeg: next },
    );
  }, []);

  const setSolarConfigurationPreset = useCallback((preset: SolarConfigurationPresetId) => {
    setNeuralCoreState((prev) =>
      prev.solarConfigurationPreset === preset
        ? prev
        : { ...prev, solarConfigurationPreset: preset },
    );
  }, []);

  const setSolarViewMode = useCallback((mode: SolarViewModeId) => {
    setNeuralCoreState((prev) =>
      prev.solarViewMode === mode ? prev : { ...prev, solarViewMode: mode },
    );
  }, []);

  const setSolarShowOrbits = useCallback((show: boolean) => {
    setNeuralCoreState((prev) =>
      prev.solarShowOrbits === show ? prev : { ...prev, solarShowOrbits: show },
    );
  }, []);

  const setSolarAutoRotate = useCallback((enabled: boolean) => {
    setNeuralCoreState((prev) =>
      prev.solarAutoRotate === enabled ? prev : { ...prev, solarAutoRotate: enabled },
    );
  }, []);

  const setSolarDayNightCycle = useCallback((enabled: boolean) => {
    setNeuralCoreState((prev) =>
      prev.solarDayNightCycle === enabled ? prev : { ...prev, solarDayNightCycle: enabled },
    );
  }, []);

  const setSolarShowConstellations = useCallback((enabled: boolean) => {
    setNeuralCoreState((prev) =>
      prev.solarShowConstellations === enabled
        ? prev
        : { ...prev, solarShowConstellations: enabled },
    );
  }, []);

  const setSolarShowResonance = useCallback((enabled: boolean) => {
    setNeuralCoreState((prev) =>
      prev.solarShowResonance === enabled ? prev : { ...prev, solarShowResonance: enabled },
    );
  }, []);

  const setSolarFollowPlanet = useCallback((enabled: boolean) => {
    setNeuralCoreState((prev) =>
      prev.solarFollowPlanet === enabled ? prev : { ...prev, solarFollowPlanet: enabled },
    );
  }, []);

  const resetNeuralCoreState = useCallback(() => {
    setNeuralCoreState(DEFAULT_NEURAL_CORE_STATE);
  }, []);

  const toggleApp = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        setAutoNotice(null);
        return prev.filter((item) => item !== id);
      }
      const target = appMap[id];
      if (!target) return prev;
      const next = new Set([...prev, id]);
      const addedDeps: string[] = [];

      const attachDeps = (modId: string) => {
        const mod = appMap[modId];
        if (!mod) return;
        mod.depends.forEach((dep) => {
          if (!next.has(dep)) {
            next.add(dep);
            addedDeps.push(appMap[dep]?.shortName ?? dep);
            attachDeps(dep);
          }
        });
      };
      attachDeps(id);

      if (addedDeps.length > 0) {
        setAutoNotice(`Auto-attached required dependency: ${addedDeps.join(', ')}`);
      } else {
        setAutoNotice(null);
      }
      return Array.from(next);
    });
  };

  const applyRecipe = (recipeId: string) => {
    const recipe = STARTER_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return;
    setSelectedIds(recipe.ids);
    setAutoNotice(`Loaded "${recipe.name}" (${recipe.pattern}) — ${recipe.ids.length} modules ready`);
    setDrawerOpen(true);
  };

  const clearStack = () => {
    setSelectedIds([]);
    setAutoNotice('Cleared composed stack');
  };

  const selectedApps = useMemo(
    () => selectedIds.map((id) => appMap[id]).filter(Boolean),
    [selectedIds, appMap],
  );

  const stackMetrics = useMemo<StackMetrics>(() => {
    if (selectedApps.length === 0) {
      return {
        totalSetupUsd: 0,
        oneTimeBuildUsd: 0,
        quarterlyRetainerUsd: 0,
        annualizedRetainerUsd: 0,
        year1ContractUsd: 0,
        buildWeightedGmPct: 0,
        retainerWeightedGmPct: 0,
        blendedGmPct: 0,
        tier: 4,
        activeLayers: new Set<string>(),
        synergyPairs: [],
        escalatedByCount: false,
      };
    }

    const oneTimeApps = selectedApps.filter((app) => app.billingCadence !== 'quarterly-retainer');
    const retainerApps = selectedApps.filter((app) => app.billingCadence === 'quarterly-retainer');

    const oneTimeBuildUsd = oneTimeApps.reduce((sum, app) => sum + app.setupUsd, 0);
    const quarterlyRetainerUsd = retainerApps.reduce((sum, app) => sum + app.setupUsd, 0);
    const annualizedRetainerUsd = quarterlyRetainerUsd * 4;
    const year1ContractUsd = oneTimeBuildUsd + annualizedRetainerUsd;
    // Strictly one-time build CapEx (never mixes quarterly retainers into one-time build totals)
    const totalSetupUsd = oneTimeBuildUsd;

    const buildWeightedGmPct =
      oneTimeBuildUsd > 0
        ? oneTimeApps.reduce((sum, app) => sum + app.setupUsd * app.gmPct, 0) / oneTimeBuildUsd
        : 0;
    const retainerWeightedGmPct =
      quarterlyRetainerUsd > 0
        ? retainerApps.reduce((sum, app) => sum + app.setupUsd * app.gmPct, 0) / quarterlyRetainerUsd
        : 0;

    // Revenue-weighted composite GM across Year-1 contract value (builds + 4x quarterly retainers)
    const weightedGrossProfitY1 =
      oneTimeApps.reduce((sum, app) => sum + app.setupUsd * app.gmPct, 0) +
      retainerApps.reduce((sum, app) => sum + app.setupUsd * 4 * app.gmPct, 0);
    const blendedGmPct = year1ContractUsd > 0 ? weightedGrossProfitY1 / year1ContractUsd : 0;

    let minTier = Math.min(...selectedApps.map((app) => app.minServerTier)) as ServerTierId;
    let escalatedByCount = false;
    if (selectedApps.length >= 6 && minTier > 1) {
      minTier = (minTier - 1) as ServerTierId;
      escalatedByCount = true;
    }

    const activeLayers = new Set<string>();
    selectedApps.forEach((app) => app.layers.forEach((l) => activeLayers.add(l)));

    const synergyPairs: [string, string][] = [];
    const seen = new Set<string>();
    selectedApps.forEach((app) => {
      app.integratesWith.forEach((targetId) => {
        if (selectedIds.includes(targetId) && appMap[targetId]) {
          const key = [app.id, targetId].sort().join('::');
          if (!seen.has(key)) {
            seen.add(key);
            synergyPairs.push([app.shortName, appMap[targetId].shortName]);
          }
        }
      });
    });

    return {
      totalSetupUsd,
      oneTimeBuildUsd,
      quarterlyRetainerUsd,
      annualizedRetainerUsd,
      year1ContractUsd,
      buildWeightedGmPct,
      retainerWeightedGmPct,
      blendedGmPct,
      tier: minTier,
      activeLayers,
      synergyPairs,
      escalatedByCount,
    };
  }, [selectedApps, selectedIds, appMap]);

  const projectArchitectureMetadata = useMemo<ProjectArchitectureMetadata>(() => {
    const tierSpec = SERVER_TIERS[stackMetrics.tier];
    const layers = Object.values(coreLayerConfigs);
    return {
      project: 'Spenta Sovereign OS',
      updatedAt: architectureUpdatedAt,
      infrastructureTarget: {
        id: deploymentProfile.id,
        environment: deploymentProfile.switcherLabel,
        topology: deploymentProfile.title,
        transport: deploymentProfile.transport,
        enclaveBoundary: deploymentProfile.enclaveBoundary,
        latencyBudget: deploymentProfile.latencyBudget,
        egressPolicy: deploymentProfile.egressPolicy,
        compliancePosture: deploymentProfile.compliancePosture,
        costPosture: deploymentProfile.costPosture,
      },
      stackSizing: {
        activeModules: selectedApps.length,
        recommendedTier: `${tierSpec.code} (${tierSpec.name})`,
        estimatedBuildUsd: stackMetrics.oneTimeBuildUsd,
        quarterlyRetainerUsd: stackMetrics.quarterlyRetainerUsd,
        year1ContractUsd: stackMetrics.year1ContractUsd,
      },
      governanceSummary: {
        teeEnabledLayers: layers.filter((l) => l.teeEnabled).length,
        strictOpaLayers: layers.filter((l) => l.policyMode === 'Strict OPA (>= 0.88 HITL)').length,
        airGappedLayers: layers.filter((l) => l.isolationMode === 'Air-Gapped On-Prem').length,
        vpcLayers: layers.filter((l) => l.isolationMode === 'Private Sovereign VPC').length,
      },
      coreLayers: coreLayerConfigs,
    };
  }, [
    architectureUpdatedAt,
    coreLayerConfigs,
    deploymentProfile,
    selectedApps.length,
    stackMetrics.tier,
    stackMetrics.oneTimeBuildUsd,
    stackMetrics.quarterlyRetainerUsd,
    stackMetrics.year1ContractUsd,
  ]);

  const buildExecutiveBrief = () => {
    const tierSpec = SERVER_TIERS[stackMetrics.tier];
    const lines = [
      'SPENTA SOVEREIGN OS — COMPOSED ARCHITECTURE BRIEF',
      '================================================',
      `Infrastructure Target: ${deploymentProfile.title} (${deploymentProfile.switcherLabel})`,
      `  Transport: ${deploymentProfile.transport}`,
      `  Enclave Boundary: ${deploymentProfile.enclaveBoundary}`,
      `  Latency Budget: ${deploymentProfile.latencyBudget}`,
      `  Egress & Compliance: ${deploymentProfile.egressPolicy} | ${deploymentProfile.compliancePosture}`,
      '',
      `Selected Modules (${selectedApps.length}/13):`,
      ...selectedApps.map(
        (a, i) =>
          `  ${i + 1}. ${a.name} (${a.setupLabel} | ${a.gmPct.toFixed(1)}% GM | ${a.recurringLabel})`,
      ),
      '',
      `Verified Native Integrations (${stackMetrics.synergyPairs.length}):`,
      ...(stackMetrics.synergyPairs.length > 0
        ? stackMetrics.synergyPairs.map(([a, b]) => `  - ${a} <-> ${b}`)
        : ['  - Standalone deployment']),
      '',
      `Active Sovereign Layers: ${Array.from(stackMetrics.activeLayers).sort().join(', ') || 'None'}`,
      `Recommended Server Baseline: ${tierSpec.code} — ${tierSpec.name}`,
      `  Hardware: ${tierSpec.hardware} (${tierSpec.vramRam})`,
      `  Est. CapEx: ${tierSpec.capex} | Throughput: ${tierSpec.speed}`,
      '',
      `One-Time Build CapEx: $${(stackMetrics.oneTimeBuildUsd / 1000).toFixed(1)}K${
        stackMetrics.oneTimeBuildUsd > 0 ? ` (${stackMetrics.buildWeightedGmPct.toFixed(1)}% weighted GM)` : ''
      }`,
      ...(stackMetrics.quarterlyRetainerUsd > 0
        ? [
            `Quarterly Managed Retainers: $${(stackMetrics.quarterlyRetainerUsd / 1000).toFixed(1)}K/qtr ($${(
              stackMetrics.annualizedRetainerUsd / 1000
            ).toFixed(1)}K/yr · ${stackMetrics.retainerWeightedGmPct.toFixed(1)}% weighted GM)`,
          ]
        : []),
      `Year-1 Composite Contract Value: $${(stackMetrics.year1ContractUsd / 1000).toFixed(1)}K`,
      `Revenue-Weighted Composite GM (Y1): ${stackMetrics.blendedGmPct.toFixed(1)}%`,
      `Governance Baseline: OPA Policy-as-Code + 0.88 Confidence HITL Gate`,
      `Contact: ${SPENTA_CONTACT_EMAIL}`,
    ];
    return lines.join('\n');
  };

  const exportStackJson = (extra?: Record<string, unknown>) => {
    const tierSpec = SERVER_TIERS[stackMetrics.tier];
    const payload = {
      platform: 'Spenta Sovereign OS',
      exportedAt: new Date().toISOString(),
      contact: SPENTA_CONTACT_EMAIL,
      infrastructureTarget: {
        id: deploymentProfile.id,
        label: deploymentProfile.switcherLabel,
        title: deploymentProfile.title,
        transport: deploymentProfile.transport,
        enclaveBoundary: deploymentProfile.enclaveBoundary,
        latencyBudget: deploymentProfile.latencyBudget,
        egressPolicy: deploymentProfile.egressPolicy,
        compliancePosture: deploymentProfile.compliancePosture,
        costPosture: deploymentProfile.costPosture,
      },
      selectedCount: selectedApps.length,
      oneTimeBuildUsd: stackMetrics.oneTimeBuildUsd,
      quarterlyRetainerUsd: stackMetrics.quarterlyRetainerUsd,
      annualizedRetainerUsd: stackMetrics.annualizedRetainerUsd,
      year1ContractUsd: stackMetrics.year1ContractUsd,
      buildWeightedGmPct: Number(stackMetrics.buildWeightedGmPct.toFixed(1)),
      retainerWeightedGmPct: Number(stackMetrics.retainerWeightedGmPct.toFixed(1)),
      revenueWeightedCompositeGmPct: Number(stackMetrics.blendedGmPct.toFixed(1)),
      activeSovereignLayers: Array.from(stackMetrics.activeLayers).sort(),
      coreLayerConfigs,
      recommendedServerTier: tierSpec,
      verifiedSynergyPairs: stackMetrics.synergyPairs,
      modules: selectedApps.map((a) => ({
        id: a.id,
        name: a.name,
        category: a.category,
        engine: a.engine,
        billingCadence: a.billingCadence ?? 'one-time',
        setupUsd: a.setupUsd,
        recurringLabel: a.recurringLabel,
        gmPct: a.gmPct,
        layers: a.layers,
        depends: a.depends,
        proofClient: a.proofClient,
      })),
      ...(extra ?? {}),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spenta-sovereign-stack-${deploymentProfile.id}-${selectedApps.length}apps.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const buildMailtoHref = (subject?: string, bodyExtra?: string) => {
    const scopeLabel =
      stackMetrics.quarterlyRetainerUsd > 0
        ? `$${(stackMetrics.oneTimeBuildUsd / 1000).toFixed(1)}K Build + $${(
            stackMetrics.quarterlyRetainerUsd / 1000
          ).toFixed(1)}K/qtr`
        : `$${(stackMetrics.oneTimeBuildUsd / 1000).toFixed(1)}K Build`;
    const sub =
      subject ??
      `Spenta Sovereign OS Stack Proposal (${selectedApps.length} Modules — ${scopeLabel})`;
    const body = bodyExtra ? `${bodyExtra}\n\n${buildExecutiveBrief()}` : buildExecutiveBrief();
    return `mailto:${SPENTA_CONTACT_EMAIL}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(
      body,
    )}`;
  };

  const saveProposal: StackContextValue['saveProposal'] = (input) => {
    const created: SavedProposal = {
      ...input,
      id: `prop_${Date.now()}`,
      createdAt: new Date().toISOString(),
      appIds: selectedApps.map((a) => a.id),
      appNames: selectedApps.map((a) => a.shortName),
      estimatedBuildUsd: stackMetrics.oneTimeBuildUsd,
      quarterlyRetainerUsd: stackMetrics.quarterlyRetainerUsd,
      blendedGmPct: Number(stackMetrics.blendedGmPct.toFixed(1)),
      recommendedTier: stackMetrics.tier,
    };
    setSavedProposals((prev) => [created, ...prev]);
    return created;
  };

  const deleteProposal = (id: string) => {
    setSavedProposals((prev) => prev.filter((p) => p.id !== id));
  };

  const logCoreAuditEvent: StackContextValue['logCoreAuditEvent'] = (entry) => {
    const created: CoreAuditEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    setCoreAuditLog((prev) => [created, ...prev].slice(0, 200));
  };

  const updateCoreLayerConfig: StackContextValue['updateCoreLayerConfig'] = (
    layerId,
    patch,
    actionLabel,
    actor = 'Sovereign Architect',
  ) => {
    const current = coreLayerConfigs[layerId];
    if (!current) return;

    const fieldLabels: Record<keyof LayerConfig, string> = {
      isolationMode: 'Deployment Isolation',
      policyMode: 'OPA Policy Mode',
      teeEnabled: 'Hardware TEE (SEV-SNP/TDX)',
      slaTarget: 'Target SLA Profile',
    };

    const formatFieldValue = (key: keyof LayerConfig, val: LayerConfig[keyof LayerConfig]) => {
      if (key === 'teeEnabled') {
        return val ? 'Enabled (AMD SEV-SNP / Intel TDX)' : 'Disabled';
      }
      return String(val);
    };

    const newEntries: CoreAuditEntry[] = [];
    const nowIso = new Date().toISOString();

    (Object.keys(patch) as (keyof LayerConfig)[]).forEach((key) => {
      const nextVal = patch[key];
      if (nextVal === undefined || nextVal === current[key]) return;
      newEntries.push({
        id: `audit_${Date.now()}_${key}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: nowIso,
        actor,
        layer: layerId,
        action: actionLabel ?? `Updated ${layerId} ${fieldLabels[key]}`,
        field: fieldLabels[key],
        previousValue: formatFieldValue(key, current[key]),
        newValue: formatFieldValue(key, nextVal),
      });
    });

    if (newEntries.length === 0) return;

    setCoreLayerConfigs((prev) => ({
      ...prev,
      [layerId]: { ...prev[layerId], ...patch },
    }));
    setArchitectureUpdatedAt(nowIso);
    setCoreAuditLog((prev) => [...newEntries, ...prev].slice(0, 200));
  };

  const resetCoreLayerConfig: StackContextValue['resetCoreLayerConfig'] = (
    layerId,
    actor = 'Sovereign Architect',
  ) => {
    const baseline = DEFAULT_CORE_LAYER_CONFIGS[layerId];
    updateCoreLayerConfig(layerId, baseline, `Reset ${layerId} to Sovereign Baseline`, actor);
  };

  const setDeploymentTarget: StackContextValue['setDeploymentTarget'] = (
    target,
    actor = 'Studio Architect',
  ) => {
    if (target === deploymentTarget) return;
    const prevProfile = DEPLOYMENT_PROFILES[deploymentTarget];
    const nextProfile = DEPLOYMENT_PROFILES[target];
    setDeploymentTargetState(target);
    setCoreLayerConfigs({
      L1: { ...nextProfile.layerPresets.L1 },
      L2: { ...nextProfile.layerPresets.L2 },
      L3: { ...nextProfile.layerPresets.L3 },
      L4: { ...nextProfile.layerPresets.L4 },
      L5: { ...nextProfile.layerPresets.L5 },
      L6: { ...nextProfile.layerPresets.L6 },
    });
    setArchitectureUpdatedAt(new Date().toISOString());
    logCoreAuditEvent({
      actor,
      layer: 'Hardware',
      action: 'Switched Infrastructure Target Environment',
      field: 'Deployment Topology & L1–L6 Presets',
      previousValue: prevProfile.shortLabel,
      newValue: `${nextProfile.shortLabel} (${nextProfile.latencyBudget})`,
    });
    setAutoNotice(
      `Infrastructure target switched to ${nextProfile.shortLabel} — L1–L6 architecture metadata updated`,
    );
  };

  const clearCoreAuditLog = () => {
    setCoreAuditLog([]);
  };

  const dismissSharedSnapshot = () => {
    setSharedSnapshotSummary(null);
    clearShareUrlParams();
  };

  const resetToLocalDefaults = () => {
    setSelectedIds(DEFAULT_SELECTED_IDS);
    setDeploymentTargetState('on-prem');
    setCoreLayerConfigs({ ...DEFAULT_CORE_LAYER_CONFIGS });
    setHitlConfidence(0.91);
    setPaletteMode('stone');
    setActiveBrainSelection((prev) => ({
      hubId: 'fintech',
      appId: 'icr_ops',
      source: 'brain',
      nonce: prev.nonce + 1,
    }));
    setSharedSnapshotSummary(null);
    clearShareUrlParams();
    setNeuralCoreState(DEFAULT_NEURAL_CORE_STATE);
    setAutoNotice('Restored default Spenta Sovereign OS baseline configuration');
  };

  const buildShareUrl: StackContextValue['buildShareUrl'] = (overrides) =>
    buildShareableUrl({
      selectedIds,
      deploymentTarget,
      paletteMode,
      activeTab: overrides?.tab ?? activeTab,
      hitlConfidence,
      hubId:
        overrides?.hubId !== undefined
          ? overrides.hubId
          : (overrides?.tab ?? activeTab) === 'The Brain'
            ? activeBrainSelection.hubId
            : null,
      brainMode: overrides?.brainMode,
    });

  return (
    <StackContext.Provider
      value={{
        theme,
        paletteMode,
        setTheme,
        setPaletteMode,
        toggleTheme,
        mobileGridVisible,
        setMobileGridVisible,
        toggleMobileGrid,
        commandPaletteOpen,
        setCommandPaletteOpen,
        activeTab,
        setActiveTab,
        visitedTabs,
        deckProgress,
        setDeckProgress,
        pendingNavFocus,
        navigateToItem,
        clearPendingNavFocus,
        aiAssistantOpen,
        setAiAssistantOpen,
        selectedIds,
        selectedApps,
        appMap,
        toggleApp,
        applyRecipe,
        clearStack,
        drawerOpen,
        setDrawerOpen,
        autoNotice,
        setAutoNotice,
        hitlConfidence,
        setHitlConfidence,
        stackMetrics,
        savedProposals,
        saveProposal,
        deleteProposal,
        exportStackJson,
        buildExecutiveBrief,
        buildMailtoHref,
        deploymentTarget,
        deploymentProfile,
        projectArchitectureMetadata,
        setDeploymentTarget,
        coreLayerConfigs,
        coreAuditLog,
        updateCoreLayerConfig,
        resetCoreLayerConfig,
        logCoreAuditEvent,
        clearCoreAuditLog,
        sharedSnapshotSummary,
        dismissSharedSnapshot,
        resetToLocalDefaults,
        buildShareUrl,
        activeBrainSelection,
        selectBrainHub,
        linkPathwayNodeToBrain,
        neuralCoreState,
        activeNeuralSystem: neuralCoreState.activeSystem,
        setActiveNeuralSystem,
        toggleNeuralSystem,
        activeSimulationSystem,
        setActiveSimulationSystem,
        solarTimeScale: neuralCoreState.solarTimeScale,
        setSolarTimeScale,
        galaxyRotationSpeed: neuralCoreState.galaxyRotationSpeed,
        setGalaxyRotationSpeed,
        neuralGalaxyPreset: neuralCoreState.galaxyPreset,
        setNeuralGalaxyPreset,
        neuralObservatoryFinish: neuralCoreState.observatoryFinish,
        setNeuralObservatoryFinish,
        neuralBloomIntensity: neuralCoreState.bloomIntensity,
        setNeuralBloomIntensity,
        nebulaMode: neuralCoreState.nebulaMode,
        setNebulaMode,
        toggleNebulaMode,
        nebulaDensity: neuralCoreState.nebulaDensity,
        setNebulaDensity,
        particleTurbulence: neuralCoreState.particleTurbulence,
        setParticleTurbulence,
        starDensity: neuralCoreState.starDensity,
        setStarDensity,
        orbitalDecay: neuralCoreState.orbitalDecay,
        setOrbitalDecay,
        orbitalSpread: neuralCoreState.orbitalSpread,
        setOrbitalSpread,
        galaxyCameraPreset: neuralCoreState.galaxyCameraPreset,
        setGalaxyCameraPreset,
        galaxyAutoRotate: neuralCoreState.galaxyAutoRotate,
        setGalaxyAutoRotate,
        solarOrbitalVelocity: neuralCoreState.solarOrbitalVelocity,
        setSolarOrbitalVelocity,
        solarOrbitalInclinationDeg: neuralCoreState.solarOrbitalInclinationDeg,
        setSolarOrbitalInclinationDeg,
        solarConfigurationPreset: neuralCoreState.solarConfigurationPreset,
        setSolarConfigurationPreset,
        solarViewMode: neuralCoreState.solarViewMode,
        setSolarViewMode,
        solarShowOrbits: neuralCoreState.solarShowOrbits,
        setSolarShowOrbits,
        solarAutoRotate: neuralCoreState.solarAutoRotate,
        setSolarAutoRotate,
        solarDayNightCycle: neuralCoreState.solarDayNightCycle,
        setSolarDayNightCycle,
        solarShowConstellations: neuralCoreState.solarShowConstellations,
        setSolarShowConstellations,
        solarShowResonance: neuralCoreState.solarShowResonance,
        setSolarShowResonance,
        solarFollowPlanet: neuralCoreState.solarFollowPlanet,
        setSolarFollowPlanet,
        resetNeuralCoreState,
      }}
    >
      {children}
    </StackContext.Provider>
  );
}

export function useStack() {
  const ctx = useContext(StackContext);
  if (!ctx) throw new Error('useStack must be used inside StackProvider');
  return ctx;
}
