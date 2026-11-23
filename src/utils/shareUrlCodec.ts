import { BRAIN_HUBS, NavTab, SPENTA_APPS } from '../data/spentaManifest';
import { DeploymentTargetId } from '../data/deploymentProfiles';
import type { PaletteMode } from '../context/ThemeContext';

export interface ShareableStateInput {
  selectedIds: string[];
  deploymentTarget: DeploymentTargetId;
  paletteMode: PaletteMode;
  activeTab: NavTab;
  hitlConfidence?: number;
  hubId?: string | null;
  brainMode?: '3d' | 'radar';
}

export interface ParsedShareSnapshot {
  selectedIds?: string[];
  deploymentTarget?: DeploymentTargetId;
  paletteMode?: PaletteMode;
  activeTab?: NavTab;
  hitlConfidence?: number;
  hubId?: string;
  brainMode?: '3d' | 'radar';
  summary: string;
}

const TAB_TO_SLUG: Record<NavTab, string> = {
  'App Vault': 'vault',
  Infographics: 'infographics',
  Financials: 'financials',
  'Spenta Core': 'core',
  'The Brain': 'brain',
  'Pitch Deck': 'pitch',
  Resources: 'resources',
};

const SLUG_TO_TAB: Record<string, NavTab> = {
  vault: 'App Vault',
  infographics: 'Infographics',
  financials: 'Financials',
  core: 'Spenta Core',
  brain: 'The Brain',
  pitch: 'Pitch Deck',
  resources: 'Resources',
};

const VALID_APP_IDS = new Set(SPENTA_APPS.map((a) => a.id));
const VALID_HUB_IDS = new Set(BRAIN_HUBS.map((h) => h.id));
const VALID_ENVS = new Set<DeploymentTargetId>(['on-prem', 'private-vpc', 'air-gapped']);

const ENV_LABELS: Record<DeploymentTargetId, string> = {
  'on-prem': 'On-Prem',
  'private-vpc': 'Private VPC',
  'air-gapped': 'Air-Gap',
};

const SHARE_PARAM_KEYS = ['stack', 'env', 'theme', 'tab', 'hub', 'mode', 'hitl'] as const;

export function parseShareThemeParam(search?: string): PaletteMode | null {
  try {
    const query = search ?? (typeof window !== 'undefined' ? window.location.search : '');
    if (!query) return null;
    const params = new URLSearchParams(query);
    const raw = params.get('theme');
    if (raw === 'stone' || raw === 'nocturnal') return raw;
    if (raw === 'light') return 'stone';
    if (raw === 'dark') return 'nocturnal';
  } catch {
    // ignore malformed URL
  }
  return null;
}

export function parseShareUrlParams(search?: string): ParsedShareSnapshot | null {
  try {
    const query = search ?? (typeof window !== 'undefined' ? window.location.search : '');
    if (!query) return null;
    const params = new URLSearchParams(query);
    const hasAnyKey = SHARE_PARAM_KEYS.some((k) => params.has(k));
    if (!hasAnyKey) return null;

    const result: Omit<ParsedShareSnapshot, 'summary'> = {};
    const summaryParts: string[] = [];

    if (params.has('stack')) {
      const rawStack = (params.get('stack') ?? '').trim();
      if (rawStack === 'none' || rawStack === '') {
        result.selectedIds = [];
        summaryParts.push('0 modules');
      } else {
        const clean = Array.from(
          new Set(
            rawStack
              .split(',')
              .map((s) => s.trim())
              .filter((id) => VALID_APP_IDS.has(id)),
          ),
        );
        if (clean.length > 0) {
          result.selectedIds = clean;
          summaryParts.push(`${clean.length} module${clean.length === 1 ? '' : 's'}`);
        }
      }
    }

    const rawEnv = params.get('env');
    if (rawEnv && VALID_ENVS.has(rawEnv as DeploymentTargetId)) {
      result.deploymentTarget = rawEnv as DeploymentTargetId;
      summaryParts.push(ENV_LABELS[result.deploymentTarget]);
    }

    const parsedTheme = parseShareThemeParam(query);
    if (parsedTheme) {
      result.paletteMode = parsedTheme;
      summaryParts.push(parsedTheme === 'stone' ? 'Stone Light' : 'Nocturnal Navy');
    }

    const rawTab = params.get('tab')?.toLowerCase();
    if (rawTab && SLUG_TO_TAB[rawTab]) {
      result.activeTab = SLUG_TO_TAB[rawTab];
    }

    const rawHub = params.get('hub');
    if (rawHub && VALID_HUB_IDS.has(rawHub)) {
      result.hubId = rawHub;
      const hubMeta = BRAIN_HUBS.find((h) => h.id === rawHub);
      if (hubMeta) summaryParts.push(hubMeta.label);
      if (!result.activeTab) {
        result.activeTab = 'The Brain';
      }
    }

    const rawMode = params.get('mode');
    if (rawMode === '3d' || rawMode === 'radar') {
      result.brainMode = rawMode;
    }

    const rawHitl = params.get('hitl');
    if (rawHitl !== null) {
      const n = Number(rawHitl);
      if (Number.isFinite(n) && n >= 0.5 && n <= 0.99) {
        result.hitlConfidence = Number(n.toFixed(2));
        summaryParts.push(`OPA ${result.hitlConfidence.toFixed(2)}`);
      }
    }

    const hasValidField = Object.keys(result).length > 0;
    if (!hasValidField) return null;

    return {
      ...result,
      summary: summaryParts.length > 0 ? summaryParts.join(' · ') : 'Custom architecture view',
    };
  } catch {
    return null;
  }
}

export function buildShareableUrl(input: ShareableStateInput): string {
  const base =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://spenta.tech/';

  const params = new URLSearchParams();
  params.set('stack', input.selectedIds.length > 0 ? input.selectedIds.join(',') : 'none');
  params.set('env', input.deploymentTarget);
  params.set('theme', input.paletteMode);
  params.set('tab', TAB_TO_SLUG[input.activeTab] ?? 'vault');

  if (typeof input.hitlConfidence === 'number' && Math.abs(input.hitlConfidence - 0.91) > 0.005) {
    params.set('hitl', input.hitlConfidence.toFixed(2));
  }

  if (input.hubId && VALID_HUB_IDS.has(input.hubId)) {
    params.set('hub', input.hubId);
  }

  if (input.brainMode) {
    params.set('mode', input.brainMode);
  }

  return `${base}?${params.toString()}`;
}

export function clearShareUrlParams(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    let changed = false;
    SHARE_PARAM_KEYS.forEach((k) => {
      if (url.searchParams.has(k)) {
        url.searchParams.delete(k);
        changed = true;
      }
    });
    if (changed) {
      const cleanUrl = `${url.pathname}${url.search ? url.search : ''}${url.hash}`;
      window.history.replaceState({}, '', cleanUrl);
    }
  } catch {
    // ignore history errors inside restricted frames
  }
}

export async function copyTextWithFallback(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to textarea fallback
    }
  }
  if (typeof document === 'undefined') return false;
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
