import { BRAIN_HUBS, BrainHub, NavTab, SPENTA_APPS, SpentaApp } from '../data/spentaManifest';

export interface PathwayNodeLinkInput {
  trunkId?: string;
  branchId: string;
  appId?: string;
  nodeCode?: string;
  nodeTitle?: string;
}

export interface PathwayBrainLinkTarget {
  hubId: string;
  hubNum: string;
  hubLabel: string;
  hub: BrainHub;
  appId?: string;
  app?: SpentaApp;
}

export interface ActiveBrainSelection {
  hubId: string;
  appId?: string;
  source: 'brain' | 'pathway' | 'vault' | 'url';
  pathwayBranchId?: string;
  pathwayNodeCode?: string;
  pathwayNodeTitle?: string;
  nonce: number;
}

export interface LinkPathwayNodeOptions extends PathwayNodeLinkInput {
  navigateToBrain?: boolean;
  open3D?: boolean;
  returnTab?: NavTab;
  returnLabel?: string;
}

const APP_MAP: Record<string, SpentaApp> = Object.fromEntries(
  SPENTA_APPS.map((app) => [app.id, app]),
);

/**
 * Deterministically maps any Pathway node (app module, L1–L6 Sovereign Core layer,
 * Server PC tier, or Governance/Proof node) to its corresponding 3D Brain Hub.
 */
export function resolveBrainHubForPathwayNode(
  input: PathwayNodeLinkInput,
): PathwayBrainLinkTarget {
  const { trunkId, branchId, appId } = input;
  let resolvedAppId = appId;

  if (!resolvedAppId && branchId.startsWith('branch-app-')) {
    const inferred = branchId.slice('branch-app-'.length);
    if (APP_MAP[inferred]) {
      resolvedAppId = inferred;
    }
  }

  let hubId = 'infra';

  if (resolvedAppId && APP_MAP[resolvedAppId]) {
    hubId = APP_MAP[resolvedAppId].hubId;
  } else if (trunkId === 'trunk-core' || branchId.startsWith('branch-layer-')) {
    if (branchId === 'branch-layer-L3') hubId = 'fintech';
    else if (branchId === 'branch-layer-L4') hubId = 'xr';
    else if (branchId === 'branch-layer-L5') hubId = 'enterprise';
    else if (branchId === 'branch-layer-L6') hubId = 'voice';
    else hubId = 'infra';
  } else if (trunkId === 'trunk-hardware' || branchId.startsWith('branch-tier-')) {
    hubId = 'infra';
  } else if (trunkId === 'trunk-governance' || branchId.startsWith('branch-')) {
    if (branchId === 'branch-opa-gate') hubId = 'fintech';
    else if (branchId === 'branch-best-retail') hubId = 'retail';
    else if (branchId === 'branch-xltd-mobility') hubId = 'energy';
    else hubId = 'infra';
  }

  const hub = BRAIN_HUBS.find((h) => h.id === hubId) ?? BRAIN_HUBS[0];

  if (!resolvedAppId) {
    const firstHubApp = SPENTA_APPS.find((a) => a.hubId === hub.id);
    if (firstHubApp) resolvedAppId = firstHubApp.id;
  }

  return {
    hubId: hub.id,
    hubNum: hub.num,
    hubLabel: hub.label,
    hub,
    appId: resolvedAppId,
    app: resolvedAppId ? APP_MAP[resolvedAppId] : undefined,
  };
}
