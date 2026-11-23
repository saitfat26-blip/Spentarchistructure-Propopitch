import { useCallback, useMemo } from 'react';
import { BRAIN_HUBS, BrainHub, NavTab, SPENTA_APPS, SpentaApp } from '../data/spentaManifest';
import { useStack } from '../store/StackContext';
import {
  ActiveBrainSelection,
  PathwayBrainLinkTarget,
  PathwayNodeLinkInput,
  resolveBrainHubForPathwayNode,
} from '../utils/pathwayBrainLink';

export interface InspectPathwayNodeOptions extends PathwayNodeLinkInput {
  open3D?: boolean;
  returnTab?: NavTab;
  returnLabel?: string;
}

/**
 * Shared hook synchronizing the Pathway Architecture visualization with
 * the 3D Sovereign Brain & Tech Radar hub selection across views.
 */
export function usePathwayBrainSync() {
  const {
    activeTab,
    activeBrainSelection,
    selectBrainHub,
    linkPathwayNodeToBrain,
    appMap,
  } = useStack();

  const activeHub: BrainHub = useMemo(
    () => BRAIN_HUBS.find((h) => h.id === activeBrainSelection.hubId) ?? BRAIN_HUBS[0],
    [activeBrainSelection.hubId],
  );

  const activeApp: SpentaApp = useMemo(() => {
    if (activeBrainSelection.appId && appMap[activeBrainSelection.appId]) {
      return appMap[activeBrainSelection.appId];
    }
    return SPENTA_APPS.find((a) => a.hubId === activeHub.id) ?? SPENTA_APPS[0];
  }, [activeBrainSelection.appId, activeHub.id, appMap]);

  /**
   * Immediately updates the active 3D Brain node selection when a user clicks
   * or activates a corresponding node in the Pathway visualization.
   */
  const syncPathwayNode = useCallback(
    (input: PathwayNodeLinkInput): PathwayBrainLinkTarget =>
      linkPathwayNodeToBrain({ ...input, navigateToBrain: false }),
    [linkPathwayNodeToBrain],
  );

  /**
   * Updates the active 3D Brain node selection and navigates directly into
   * The Brain in 3D mode with a return path back to the Pathway view.
   */
  const inspectPathwayNodeInBrain = useCallback(
    (options: InspectPathwayNodeOptions): PathwayBrainLinkTarget =>
      linkPathwayNodeToBrain({
        ...options,
        navigateToBrain: true,
        open3D: options.open3D ?? true,
        returnTab: options.returnTab ?? activeTab,
        returnLabel:
          options.returnLabel ??
          (activeTab === 'Resources' ? 'Studio Pathway' : 'Architecture Pathway'),
      }),
    [activeTab, linkPathwayNodeToBrain],
  );

  const selectBrainNode = useCallback(
    (hubId: string, appId?: string, source: ActiveBrainSelection['source'] = 'brain') => {
      selectBrainHub(hubId, { appId, source });
    },
    [selectBrainHub],
  );

  const resolveHubForNode = useCallback(
    (input: PathwayNodeLinkInput): PathwayBrainLinkTarget =>
      resolveBrainHubForPathwayNode(input),
    [],
  );

  return {
    activeBrainSelection,
    activeHub,
    activeApp,
    syncPathwayNode,
    inspectPathwayNodeInBrain,
    selectBrainNode,
    resolveHubForNode,
  };
}
