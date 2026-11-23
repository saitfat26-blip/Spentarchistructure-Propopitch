import React, { useState } from 'react';
import {
  Compass,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  Search,
} from 'lucide-react';
import { REGIONAL_HUBS, RegionalHubSpec } from '../data/roiModel';

export interface MapsPlaceSource {
  title: string;
  uri: string;
  domain?: string;
  sourceType?: 'web' | 'maps';
  reviewSnippet?: string;
}

export interface MapsGroundingResponse {
  text: string;
  sources: MapsPlaceSource[];
}

export interface SharedMapsMarketState {
  loading: boolean;
  error: string | null;
  result: MapsGroundingResponse | null;
  activePromptLabel: string;
  activeHubLabel: string;
}

export interface MapsQueryPayload {
  query: string;
  label: string;
  hubLabel: string;
  latLng?: { latitude: number; longitude: number };
}

interface RegionalMarketMapsViewProps {
  sharedMaps?: SharedMapsMarketState;
  onRunMapsQuery?: (payload: MapsQueryPayload) => Promise<void>;
}

function renderMarkdownBrief(text: string) {
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-[#334155] dark:text-[#C8D0E4]">
      {lines.map((raw, idx) => {
        const isHeading = /^#{1,3}\s/.test(raw.trim());
        const isBullet = /^[-*•]\s/.test(raw.trim());
        const cleaned = raw.replace(/^#{1,3}\s*/, '').replace(/^[-*•]\s*/, '').trim();
        const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);

        if (isHeading) {
          return (
            <h4
              key={idx}
              className="font-bold text-sm text-[#16213A] dark:text-[#E7EBF5] pt-2 first:pt-0"
            >
              {cleaned.replace(/\*\*/g, '')}
            </h4>
          );
        }

        return (
          <p key={idx} className={isBullet ? 'pl-3.5 relative' : ''}>
            {isBullet && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 text-[#1C6E46] dark:text-[#6FCB9F] font-bold"
              >
                ·
              </span>
            )}
            {parts.map((part, pIdx) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={pIdx} className="font-semibold text-[#16213A] dark:text-[#E7EBF5]">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <React.Fragment key={pIdx}>{part}</React.Fragment>
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}

export function RegionalMarketMapsView({
  sharedMaps,
  onRunMapsQuery,
}: RegionalMarketMapsViewProps = {}) {
  const [selectedHub, setSelectedHub] = useState<RegionalHubSpec>(REGIONAL_HUBS[2]); // Dhaka default
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState<string>('');
  const [localPromptLabel, setLocalPromptLabel] = useState<string>('');
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localResult, setLocalResult] = useState<MapsGroundingResponse | null>(null);

  const loading = sharedMaps ? sharedMaps.loading : localLoading;
  const error = sharedMaps ? sharedMaps.error : localError;
  const result = sharedMaps ? sharedMaps.result : localResult;
  const activePromptLabel = sharedMaps ? sharedMaps.activePromptLabel : localPromptLabel;

  const runMapsQuery = async (
    queryText: string,
    label: string,
    coordsOverride?: { latitude: number; longitude: number } | null,
    hubNameOverride?: string,
  ) => {
    const clean = queryText.trim();
    if (!clean) return;

    const coords =
      coordsOverride !== undefined
        ? coordsOverride
        : userCoords ?? { latitude: selectedHub.latitude, longitude: selectedHub.longitude };
    const resolvedHubLabel =
      hubNameOverride ?? (userCoords ? 'Current User Location' : selectedHub.name);

    if (onRunMapsQuery) {
      await onRunMapsQuery({
        query: clean,
        label,
        hubLabel: resolvedHubLabel,
        latLng: coords ?? undefined,
      });
      return;
    }

    setLocalLoading(true);
    setLocalError(null);
    setLocalPromptLabel(label);

    try {
      const res = await fetch('/api/gemini/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: clean,
          hubLabel: resolvedHubLabel,
          latLng: coords ?? undefined,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || 'Google Maps grounding request failed.');
      }
      setLocalResult({
        text: payload.text || '',
        sources: Array.isArray(payload.sources) ? payload.sources : [],
      });
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : 'Unable to reach Google Maps grounding service.',
      );
    } finally {
      setLocalLoading(false);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Browser geolocation is unavailable in this environment.');
      return;
    }
    setGeoStatus('Requesting location…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: Number(pos.coords.latitude.toFixed(5)),
          longitude: Number(pos.coords.longitude.toFixed(5)),
        };
        setUserCoords(coords);
        setGeoStatus(`Centered on your coordinates (${coords.latitude}, ${coords.longitude})`);
      },
      () => {
        setGeoStatus('Location permission declined—using selected Spenta regional hub coordinates.');
      },
      { timeout: 8000 },
    );
  };

  return (
    <div className="space-y-6">
      {/* Tri-Shore Hub Selector */}
      <section className="rounded-xl bg-white dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E4DFD6] dark:border-[#232B4A]">
          <div>
            <div className="text-xs font-mono text-[#1C6E46] dark:text-[#6FCB9F] font-semibold">
              Live Google Maps Grounding · Tri-Shore Operations &amp; Enterprise Markets
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#16213A] dark:text-[#E7EBF5] tracking-tight mt-0.5">
              Regional Operating Hubs &amp; Target Enterprise Market Discovery
            </h2>
            <p className="text-xs text-[#5F6576] dark:text-[#8E96B0] mt-1">
              Explore real hospitals, banking headquarters, biopharma corridors, and EV/retail networks around Spenta’s three operating hubs or your current location.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLocateMe}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0B1020] hover:border-[#1C6E46] dark:hover:border-[#6FCB9F] text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" />
            <span>{userCoords ? 'Update My Location' : 'Use My Location'}</span>
          </button>
        </div>

        {geoStatus && (
          <div className="flex items-center justify-between gap-2 text-xs font-mono text-[#1C6E46] dark:text-[#6FCB9F] bg-[#FAF8F4] dark:bg-[#0B1020] border border-[#E4DFD6] dark:border-[#232B4A] rounded-lg px-3.5 py-2">
            <span>{geoStatus}</span>
            {userCoords && (
              <button
                type="button"
                onClick={() => {
                  setUserCoords(null);
                  setGeoStatus(null);
                }}
                className="text-[#5F6576] dark:text-[#8E96B0] hover:underline cursor-pointer"
              >
                Reset to Hub
              </button>
            )}
          </div>
        )}

        {/* 3 Tri-Shore Hub Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {REGIONAL_HUBS.map((hub) => {
            const active = !userCoords && selectedHub.id === hub.id;
            return (
              <button
                key={hub.id}
                type="button"
                onClick={() => {
                  setUserCoords(null);
                  setGeoStatus(null);
                  setSelectedHub(hub);
                }}
                className={`text-left rounded-xl p-4 border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#FAF8F4] dark:bg-[#0F1529] border-[#1C6E46] dark:border-[#6FCB9F]'
                    : 'bg-white dark:bg-[#141A32] border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold text-[#1C6E46] dark:text-[#6FCB9F]">
                    {hub.regionLabel}
                  </span>
                  <span className="font-mono text-[10px] text-[#5F6576] dark:text-[#8E96B0] tabular-nums">
                    {hub.latitude.toFixed(2)}, {hub.longitude.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm font-bold text-[#16213A] dark:text-[#E7EBF5] mt-1">
                  {hub.name}
                </div>
                <div className="text-xs text-[#4A5568] dark:text-[#C8D0E4] mt-0.5">{hub.role}</div>
                <p className="text-[11px] text-[#5F6576] dark:text-[#8E96B0] mt-2 leading-relaxed">
                  {hub.costProfile}
                </p>
                <div className="text-[11px] text-[#1F3863] dark:text-[#8FA6E8] mt-2.5 font-medium">
                  {hub.targetVerticals.join(' · ')}
                </div>
              </button>
            );
          })}
        </div>

        {/* Preset Vertical Market Queries + Custom Search */}
        <div className="pt-4 border-t border-[#E4DFD6] dark:border-[#232B4A] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5]">
              Discover Real-World Enterprise Corridors near {userCoords ? 'Your Location' : selectedHub.name}
            </span>
            <span className="font-mono text-[11px] text-[#5F6576] dark:text-[#8E96B0]">
              Grounded via Google Maps
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedHub.presetQueries.map((preset) => (
              <button
                key={preset.label}
                type="button"
                disabled={loading}
                onClick={() => runMapsQuery(preset.prompt, preset.label)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0B1020] hover:border-[#1C6E46] dark:hover:border-[#6FCB9F] text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5] transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" />
                <span>{preset.label}</span>
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              runMapsQuery(customQuery, customQuery);
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#5F6576] dark:text-[#8E96B0] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder={`Search hospitals, bank headquarters, or industrial parks near ${selectedHub.name}…`}
                className="w-full rounded-lg bg-[#FAF8F4] dark:bg-[#0B1020] border border-[#E4DFD6] dark:border-[#232B4A] pl-9 pr-3 py-2.5 text-xs text-[#16213A] dark:text-[#E7EBF5] placeholder:text-[#8E96B0] focus:outline-none focus:border-[#1C6E46] dark:focus:border-[#6FCB9F]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !customQuery.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#1C6E46] hover:bg-[#175B3A] dark:bg-[#6FCB9F] dark:hover:bg-[#5EC092] text-white dark:text-[#0B1020] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              <span>Query Maps</span>
            </button>
          </form>
        </div>
      </section>

      {/* Maps Grounded Intelligence Output & Verified Google Maps Place Links */}
      <section className="rounded-xl bg-white dark:bg-[#141A32] border border-[#E4DFD6] dark:border-[#232B4A] p-5 sm:p-6">
        {error && (
          <div className="text-xs text-[#E11D48] dark:text-[#FDA4AF] bg-[#E11D48]/10 border border-[#E11D48]/25 rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3 py-4 animate-pulse">
            <div className="h-4 bg-[#E4DFD6] dark:bg-[#232B4A] rounded w-1/3" />
            <div className="h-3 bg-[#E4DFD6] dark:bg-[#232B4A] rounded w-full" />
            <div className="h-3 bg-[#E4DFD6] dark:bg-[#232B4A] rounded w-11/12" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              <div className="h-16 bg-[#FAF8F4] dark:bg-[#0B1020] rounded-lg border border-[#E4DFD6] dark:border-[#232B4A]" />
              <div className="h-16 bg-[#FAF8F4] dark:bg-[#0B1020] rounded-lg border border-[#E4DFD6] dark:border-[#232B4A]" />
              <div className="h-16 bg-[#FAF8F4] dark:bg-[#0B1020] rounded-lg border border-[#E4DFD6] dark:border-[#232B4A]" />
            </div>
          </div>
        ) : result ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E4DFD6] dark:border-[#232B4A]">
              <div>
                <div className="text-xs font-mono text-[#1C6E46] dark:text-[#6FCB9F] font-semibold">
                  Google Maps Grounded Brief · {userCoords ? 'Current Location' : selectedHub.name}
                </div>
                <h3 className="text-base font-bold text-[#16213A] dark:text-[#E7EBF5] mt-0.5">
                  {activePromptLabel}
                </h3>
              </div>
              <span className="font-mono text-xs text-[#5F6576] dark:text-[#8E96B0]">
                {result.sources.length} verified Maps {result.sources.length === 1 ? 'place' : 'places'}
              </span>
            </div>

            {renderMarkdownBrief(result.text)}

            {/* Mandatory Clickable Google Maps Grounding Links */}
            {result.sources.length > 0 && (
              <div className="pt-4 border-t border-[#E4DFD6] dark:border-[#232B4A] space-y-3">
                <div className="text-xs font-semibold text-[#16213A] dark:text-[#E7EBF5]">
                  Verified Google Maps Places &amp; Links
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.sources.map((place, idx) => (
                    <a
                      key={`${place.uri}-${idx}`}
                      href={place.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group rounded-lg bg-[#FAF8F4] dark:bg-[#0B1020] border border-[#E4DFD6] dark:border-[#232B4A] hover:border-[#1C6E46] dark:hover:border-[#6FCB9F] p-3.5 flex flex-col justify-between gap-2 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-4 h-4 text-[#1C6E46] dark:text-[#6FCB9F] shrink-0" />
                          <span className="text-xs font-bold text-[#16213A] dark:text-[#E7EBF5] group-hover:text-[#1C6E46] dark:group-hover:text-[#6FCB9F] truncate">
                            {place.title}
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-[#5F6576] dark:text-[#8E96B0] shrink-0" />
                      </div>
                      {place.reviewSnippet && (
                        <p className="text-[11px] text-[#5F6576] dark:text-[#8E96B0] line-clamp-2 leading-relaxed">
                          “{place.reviewSnippet}”
                        </p>
                      )}
                      <span className="text-[11px] font-mono text-[#1F3863] dark:text-[#8FA6E8]">
                        Open in Google Maps →
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center space-y-3 max-w-xl mx-auto">
            <MapPin className="w-7 h-7 text-[#1C6E46] dark:text-[#6FCB9F] mx-auto" strokeWidth={1.5} />
            <h3 className="text-sm font-bold text-[#16213A] dark:text-[#E7EBF5]">
              Select a Regional Hub &amp; Run a Google Maps Market Query
            </h3>
            <p className="text-xs text-[#5F6576] dark:text-[#8E96B0] leading-relaxed">
              Click any vertical discovery button above (such as hospital networks, banking HQs, or biopharma corridors) to fetch live grounded locations with clickable Google Maps links around San Jose, Australia, or Dhaka.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
