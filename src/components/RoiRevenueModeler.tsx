import React from 'react';
import {
  BenchmarkVerifyPayload,
  InteractiveRoiCalculator,
  SharedSearchBenchmarkState,
} from './InteractiveRoiCalculator';
import { RevenueMixModeler, SharedRevenueMixProps } from './RevenueMixModeler';
import { GrowthMode } from '../data/spentaEnrichments';

export type {
  BenchmarkVerifyPayload,
  SearchGroundingResult,
  SharedSearchBenchmarkState,
} from './InteractiveRoiCalculator';
export type { MixPresetId, SharedRevenueMixProps } from './RevenueMixModeler';

interface RoiRevenueModelerProps {
  initialAppId?: string;
  sharedBenchmark?: SharedSearchBenchmarkState;
  onVerifyBenchmarks?: (payload: BenchmarkVerifyPayload) => Promise<void>;
  revenueMixProps?: SharedRevenueMixProps;
  growthMode?: GrowthMode;
  onChangeGrowthMode?: (mode: GrowthMode) => void;
}

export function RoiRevenueModeler({
  initialAppId,
  sharedBenchmark,
  onVerifyBenchmarks,
  revenueMixProps,
  growthMode,
  onChangeGrowthMode,
}: RoiRevenueModelerProps) {
  return (
    <div className="space-y-6">
      <InteractiveRoiCalculator
        initialAppId={initialAppId}
        sharedBenchmark={sharedBenchmark}
        onVerifyBenchmarks={onVerifyBenchmarks}
        growthMode={growthMode}
        onChangeGrowthMode={onChangeGrowthMode}
      />
      <RevenueMixModeler {...revenueMixProps} growthMode={growthMode} />
    </div>
  );
}
