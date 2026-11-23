import React, { Component, Suspense, useEffect, useState } from 'react';
import { BRAIN_HUBS } from '../../data/spentaManifest';
import { useStack } from '../../store/StackContext';

const LazySovereignBrain3DCanvas = React.lazy(() => import('./SovereignBrain3DCanvas'));
const LazySolarSystemBrain3DCanvas = React.lazy(() => import('./SolarSystemBrain3DCanvas'));

export type NeuralCoreArchitecture = 'spiral-galaxy' | 'solar-map';

interface SovereignBrain3DProps {
  compact?: boolean;
  polarity?: 'light' | 'dark';
  onSelectHub?: (hubId: string) => void;
  selectedHubId?: string | null;
  hubFocusNonce?: number;
  initialCore?: NeuralCoreArchitecture;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ThreeErrorBoundary extends Component<
  {
    children: React.ReactNode;
    polarity?: 'light' | 'dark';
    selectedHubId?: string | null;
    onSelectHub?: (hubId: string) => void;
  },
  ErrorBoundaryState
> {
  constructor(props: {
    children: React.ReactNode;
    polarity?: 'light' | 'dark';
    selectedHubId?: string | null;
    onSelectHub?: (hubId: string) => void;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      const isLight = this.props.polarity === 'light';
      return (
        <div
          className={`w-full min-h-[420px] rounded-[10px] p-6 flex flex-col justify-center items-center text-center ${
            isLight
              ? 'bg-[#F2EFE9] text-[#16213A]'
              : 'bg-[#0B1020] text-[#E7EBF5]'
          }`}
        >
          <div
            className={`text-xs font-mono font-semibold mb-1 ${
              isLight ? 'text-[#1F3863]' : 'text-[#8FA6E8]'
            }`}
          >
            3D WebGL Renderer Unavailable
          </div>
          <h3 className="text-base font-bold">
            Spenta Sovereign Neural Core (Interactive Fallback)
          </h3>
          <p
            className={`text-xs mt-1 max-w-md ${
              isLight ? 'text-[#4A5163]' : 'text-[#C3CCE4]'
            }`}
          >
            Select any of the 8 Sovereign Brain hubs below to inspect capabilities and toggle modules.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 w-full max-w-2xl">
            {BRAIN_HUBS.map((hub) => {
              const isSelected = this.props.selectedHubId === hub.id;
              return (
                <button
                  key={hub.id}
                  type="button"
                  onClick={() => this.props.onSelectHub?.(hub.id)}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                    isSelected ? 'brain-node-emissive-pulse--selected' : ''
                  } ${
                    isLight
                      ? isSelected
                        ? 'bg-[#EEF3FB] border-[#1F3863] text-[#16213A]'
                        : 'bg-[#FFFFFF] border-[#E4DFD6] hover:border-[#1F3863] text-[#16213A]'
                      : isSelected
                        ? 'bg-[#1B2547] border-[#8FA6E8] text-[#E7EBF5]'
                        : 'bg-[#141A32] border-[#232B4A] hover:border-[#8FA6E8] text-[#E7EBF5]'
                  }`}
                >
                  <div
                    className={`text-[10px] font-mono font-bold ${
                      isLight ? 'text-[#1F3863]' : 'text-[#8FA6E8]'
                    }`}
                  >
                    HUB {hub.num}
                  </div>
                  <div className="text-xs font-semibold mt-0.5">{hub.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function SovereignBrain3D({
  initialCore,
  ...props
}: SovereignBrain3DProps) {
  const { activeNeuralSystem, setActiveNeuralSystem } = useStack();
  const [transitionOrigin, setTransitionOrigin] = useState<
    'initial' | 'from-spiral' | 'from-solar'
  >('initial');

  useEffect(() => {
    if (initialCore) {
      setActiveNeuralSystem(initialCore);
    }
  }, [initialCore, setActiveNeuralSystem]);

  const activeCore = activeNeuralSystem;
  const isLight = props.polarity === 'light';
  const isSolar = activeCore === 'solar-map';

  const handleToggleAlternativeSystem = () => {
    if (activeCore === 'spiral-galaxy') {
      setTransitionOrigin('from-spiral');
      setActiveNeuralSystem('solar-map');
    } else {
      setTransitionOrigin('from-solar');
      setActiveNeuralSystem('spiral-galaxy');
    }
  };

  return (
    <div
      className={`relative w-full h-full min-h-[460px] rounded-[10px] overflow-hidden ${
        isSolar || transitionOrigin !== 'initial'
          ? 'bg-[#040814]'
          : isLight
            ? 'bg-[#EDEAE2]'
            : 'bg-[#040712]'
      }`}
    >
      <ThreeErrorBoundary
        key={activeCore}
        polarity={props.polarity}
        selectedHubId={props.selectedHubId}
        onSelectHub={props.onSelectHub}
      >
        <Suspense
          fallback={
            <div
              className={`w-full h-full min-h-[460px] rounded-[10px] flex flex-col items-center justify-center gap-2 font-mono text-xs ${
                isSolar
                  ? 'bg-[#040814] text-[#C4D6F0]'
                  : isLight
                    ? 'bg-[#F2EFE9] text-[#4A5163]'
                    : 'bg-[#0B1020] text-[#C3CCE4]'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full border-2 border-t-transparent animate-spin ${
                  isSolar
                    ? 'border-[#FFB563]'
                    : isLight
                      ? 'border-[#1F3863]'
                      : 'border-[#8FA6E8]'
                }`}
              />
              <span>
                {isSolar
                  ? 'Morphing to Solar System Ecliptic Plane…'
                  : 'Morphing to Spiral Galaxy Perspective…'}
              </span>
            </div>
          }
        >
          {activeCore === 'spiral-galaxy' ? (
            <LazySovereignBrain3DCanvas
              {...props}
              transitionFromSolar={transitionOrigin === 'from-solar'}
              onToggleAlternativeSystem={handleToggleAlternativeSystem}
            />
          ) : (
            <LazySolarSystemBrain3DCanvas
              {...props}
              transitionFromSpiral={transitionOrigin === 'from-spiral'}
              onToggleAlternativeSystem={handleToggleAlternativeSystem}
            />
          )}
        </Suspense>
      </ThreeErrorBoundary>
    </div>
  );
}
