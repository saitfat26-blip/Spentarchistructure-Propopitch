import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Filter,
  Layers,
  Minus,
  Search,
  X,
} from 'lucide-react';
import {
  REFERO_UI_PATTERNS,
  ReferoPageType,
} from '../data/promptThemeStudioData';
import { useStack } from '../store/StackContext';

const PAGE_TYPE_FILTERS: ('All' | ReferoPageType)[] = [
  'All',
  'Vault',
  'Architecture',
  'Analytics',
  'Presenter',
  'Workbench',
];

const STATE_FILTERS: { id: 'all' | 'print' | 'resilient' | 'empty'; label: string }[] = [
  { id: 'all', label: 'All States' },
  { id: 'print', label: 'Print/PDF Ready' },
  { id: 'empty', label: 'Empty State Handled' },
  { id: 'resilient', label: 'Loading/Error Guarded' },
];

export function ReferoPatternExplorer() {
  const { setActiveTab } = useStack();
  const [pageType, setPageType] = useState<'All' | ReferoPageType>('All');
  const [selectedUxTag, setSelectedUxTag] = useState<string>('All');
  const [stateFilter, setStateFilter] = useState<'all' | 'print' | 'resilient' | 'empty'>('all');
  const [query, setQuery] = useState('');

  const uxTags = useMemo(() => {
    const set = new Set<string>();
    REFERO_UI_PATTERNS.forEach((p) => p.uxPatterns.forEach((tag) => set.add(tag)));
    return ['All', ...Array.from(set).sort()];
  }, []);

  const filteredPatterns = useMemo(() => {
    const q = query.trim().toLowerCase();
    return REFERO_UI_PATTERNS.filter((item) => {
      if (pageType !== 'All' && item.pageType !== pageType) return false;
      if (selectedUxTag !== 'All' && !item.uxPatterns.includes(selectedUxTag)) return false;
      if (stateFilter === 'print' && !item.states.print) return false;
      if (stateFilter === 'empty' && !item.states.empty) return false;
      if (stateFilter === 'resilient' && !(item.states.loading || item.states.error)) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.tokenAnatomy.toLowerCase().includes(q) ||
        item.uxPatterns.some((t) => t.toLowerCase().includes(q)) ||
        item.pageType.toLowerCase().includes(q)
      );
    });
  }, [pageType, selectedUxTag, stateFilter, query]);

  const resetAll = () => {
    setPageType('All');
    setSelectedUxTag('All');
    setStateFilter('all');
    setQuery('');
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div>
          <div className="text-xs text-[#5F6576] dark:text-[#8E96B0]">
            <span>04. UI Pattern Taxonomy &amp; Screen State Audit</span>
            <span className="mx-1.5" aria-hidden="true">
              ·
            </span>
            <span>Inspired by refero.design · Multi-tag filter + live portal deep-links</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#16213A] dark:text-[#E7EBF5] tracking-tight mt-0.5 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1C6E46] dark:text-[#6FCB9F] shrink-0" strokeWidth={1.5} />
            <span>Refero-Style UI Pattern Library &amp; State Completeness Checklist</span>
          </h3>
        </div>

        <div className="text-xs font-mono text-[#5F6576] dark:text-[#8E96B0] tabular-nums">
          Showing {filteredPatterns.length} / {REFERO_UI_PATTERNS.length} Verified Patterns
        </div>
      </div>

      {/* Multi-Facet Filter Bar */}
      <div className="rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-4 space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Page Type Segmented Tabs */}
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#F2EFE9] dark:bg-[#0F1529] border border-[#E4DFD6] dark:border-[#232B4A]">
            {PAGE_TYPE_FILTERS.map((pt) => {
              const active = pageType === pt;
              return (
                <button
                  key={pt}
                  type="button"
                  onClick={() => setPageType(pt)}
                  className={`min-h-[34px] px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#1F3863] text-white dark:bg-[#8FA6E8] dark:text-[#0B1020]'
                      : 'text-[#4A5568] dark:text-[#A4ADC6] hover:text-[#16213A] dark:hover:text-[#E7EBF5]'
                  }`}
                >
                  {pt}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* State Coverage Select */}
            <div className="inline-flex items-center gap-1.5 min-h-[38px] px-2.5 py-1.5 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529]">
              <Filter className="w-3.5 h-3.5 text-[#5F6576] dark:text-[#8E96B0] shrink-0" strokeWidth={1.5} />
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value as typeof stateFilter)}
                aria-label="Filter by screen state coverage"
                className="bg-transparent text-xs font-medium text-[#16213A] dark:text-[#E7EBF5] focus:outline-none cursor-pointer"
              >
                {STATE_FILTERS.map((sf) => (
                  <option key={sf.id} value={sf.id} className="bg-white dark:bg-[#141A32]">
                    {sf.label}
                  </option>
                ))}
              </select>
            </div>

            {/* UX Pattern Select */}
            <select
              value={selectedUxTag}
              onChange={(e) => setSelectedUxTag(e.target.value)}
              aria-label="Filter by UX pattern"
              className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] text-xs font-medium text-[#16213A] dark:text-[#E7EBF5] focus:outline-none focus:border-[#1F3863] dark:focus:border-[#8FA6E8] cursor-pointer"
            >
              {uxTags.map((tag) => (
                <option key={tag} value={tag} className="bg-white dark:bg-[#141A32]">
                  {tag === 'All' ? 'All UX Patterns' : tag}
                </option>
              ))}
            </select>

            {/* Keyword Search */}
            <div className="relative w-full sm:w-56">
              <Search
                className="w-3.5 h-3.5 text-[#5F6576] dark:text-[#8E96B0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                strokeWidth={1.5}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patterns or tokens..."
                aria-label="Search UI patterns"
                className="w-full min-h-[38px] pl-8 pr-7 py-1.5 rounded-lg border border-[#E4DFD6] dark:border-[#232B4A] bg-[#FAF8F4] dark:bg-[#0F1529] text-xs text-[#16213A] dark:text-[#E7EBF5] placeholder:text-[#5F6576] dark:placeholder:text-[#8E96B0] focus:outline-none focus:border-[#1F3863] dark:focus:border-[#8FA6E8]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear pattern search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5F6576] hover:text-[#16213A] dark:text-[#8E96B0] dark:hover:text-[#E7EBF5] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filtered Pattern Grid */}
      {filteredPatterns.length === 0 ? (
        <div className="rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-[#16213A] dark:text-[#E7EBF5]">
            No UI patterns match the active filter combination
          </p>
          <p className="text-xs text-[#5F6576] dark:text-[#8E96B0]">
            Clear the page type, state coverage, or UX pattern filter to inspect all 10 verified portal patterns.
          </p>
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 rounded-lg bg-[#1F3863] dark:bg-[#8FA6E8] text-white dark:text-[#0B1020] text-xs font-semibold cursor-pointer"
          >
            Reset Pattern Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPatterns.map((pattern) => {
            const stateRows: { key: keyof typeof pattern.states; label: string }[] = [
              { key: 'populated', label: 'Populated' },
              { key: 'empty', label: 'Empty' },
              { key: 'loading', label: 'Loading' },
              { key: 'error', label: 'Error' },
              { key: 'print', label: 'Print/PDF' },
            ];

            return (
              <article
                key={pattern.id}
                className="rounded-xl border border-[#E4DFD6] dark:border-[#232B4A] bg-white dark:bg-[#141A32] p-4 sm:p-5 flex flex-col justify-between gap-3.5 transition-colors hover:border-[#1F3863]/50 dark:hover:border-[#8FA6E8]/50"
              >
                <div className="space-y-2">
                  {/* Unboxed quiet metadata line */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0]">
                    <span>
                      <strong className="text-[#1C6E46] dark:text-[#6FCB9F]">
                        {pattern.pageType}
                      </strong>
                      <span className="mx-1.5" aria-hidden="true">
                        ·
                      </span>
                      <span>{pattern.uxPatterns.join(' · ')}</span>
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-[#16213A] dark:text-[#E7EBF5] tracking-tight leading-snug">
                    {pattern.title}
                  </h4>

                  <p className="text-xs text-[#4A5568] dark:text-[#A4ADC6] leading-relaxed">
                    {pattern.summary}
                  </p>

                  <div className="text-[11px] font-mono text-[#5F6576] dark:text-[#8E96B0] pt-1">
                    Tokens: <span className="text-[#16213A] dark:text-[#E7EBF5]">{pattern.tokenAnatomy}</span>
                  </div>
                </div>

                {/* State Completeness Checklist + Deep-Link Action */}
                <div className="pt-3 border-t border-[#E4DFD6] dark:border-[#232B4A] space-y-2.5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono">
                    {stateRows.map((st) => {
                      const covered = pattern.states[st.key];
                      return (
                        <span
                          key={st.key}
                          className={`inline-flex items-center gap-1 ${
                            covered
                              ? 'text-[#1C6E46] dark:text-[#6FCB9F] font-semibold'
                              : 'text-[#5F6576]/60 dark:text-[#8E96B0]/50'
                          }`}
                        >
                          {covered ? (
                            <Check className="w-3 h-3 shrink-0" strokeWidth={2.25} />
                          ) : (
                            <Minus className="w-3 h-3 shrink-0" strokeWidth={1.75} />
                          )}
                          <span>{st.label}</span>
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-[#5F6576] dark:text-[#8E96B0] truncate">
                      {pattern.referenceNote}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab(pattern.targetTab)}
                      className="inline-flex items-center gap-1 font-semibold text-[#1C6E46] dark:text-[#6FCB9F] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Open {pattern.targetTab}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
