import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

export type TooltipAccent = 'navy' | 'emerald' | 'amber' | 'crimson';

export interface ArchitectureTooltipData {
  id: string;
  code: string;
  title: string;
  summary: string;
  metric?: string;
  status?: string;
  hint?: string;
  accent?: TooltipAccent;
  x: number;
  y: number;
}

interface ArchitectureNodeTooltipProps {
  data: ArchitectureTooltipData | null;
  isDark: boolean;
}

const TOOLTIP_WIDTH = 304;
const ESTIMATED_HEIGHT = 152;
const VIEWPORT_MARGIN = 14;
const CURSOR_OFFSET_X = 16;
const CURSOR_OFFSET_Y = 18;

export function getElementAnchorPoint(el: Element): { x: number; y: number } {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + Math.min(rect.height / 2, 24),
  };
}

export function ArchitectureNodeTooltip({ data, isDark }: ArchitectureNodeTooltipProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  let left = data ? data.x + CURSOR_OFFSET_X : 0;
  let top = data ? data.y + CURSOR_OFFSET_Y : 0;

  if (data) {
    if (left + TOOLTIP_WIDTH + VIEWPORT_MARGIN > vw) {
      left = Math.max(VIEWPORT_MARGIN, data.x - TOOLTIP_WIDTH - CURSOR_OFFSET_X);
    } else {
      left = Math.max(VIEWPORT_MARGIN, left);
    }

    if (top + ESTIMATED_HEIGHT + VIEWPORT_MARGIN > vh) {
      top = Math.max(VIEWPORT_MARGIN, data.y - ESTIMATED_HEIGHT - 12);
    } else {
      top = Math.max(VIEWPORT_MARGIN, top);
    }
  }

  const accent = data?.accent ?? 'navy';

  const codeToneClass = (() => {
    if (accent === 'emerald') {
      return isDark
        ? 'bg-[#0F2A22]/90 text-[#6FCB9F] border-[#6FCB9F]/35'
        : 'bg-[#EBF6F0]/90 text-[#1C6E46] border-[#1C6E46]/30';
    }
    if (accent === 'amber') {
      return isDark
        ? 'bg-[#2A2112]/90 text-[#E0B063] border-[#E0B063]/35'
        : 'bg-[#FDF5E6]/90 text-[#8A5C10] border-[#8A5C10]/30';
    }
    if (accent === 'crimson') {
      return isDark
        ? 'bg-[#2C1219]/90 text-[#F45B69] border-[#F45B69]/35'
        : 'bg-[#FDECEF]/90 text-[#BF000F] border-[#BF000F]/30';
    }
    return isDark
      ? 'bg-[#161D3A]/90 text-[#8FA6E8] border-[#8FA6E8]/35'
      : 'bg-[#EEF3FB]/90 text-[#1F3863] border-[#1F3863]/25';
  })();

  const accentDotColor = (() => {
    if (accent === 'emerald') return isDark ? '#6FCB9F' : '#1C6E46';
    if (accent === 'amber') return isDark ? '#E0B063' : '#8A5C10';
    if (accent === 'crimson') return isDark ? '#F45B69' : '#BF000F';
    return isDark ? '#8FA6E8' : '#1F3863';
  })();

  return createPortal(
    <AnimatePresence>
      {data && (
        <motion.div
          key="architecture-frosted-tooltip"
          role="tooltip"
          initial={{ opacity: 0, y: 7, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          style={{
            left,
            top,
            width: TOOLTIP_WIDTH,
          }}
          className={`fixed z-[80] pointer-events-none rounded-[10px] border px-3.5 py-3 backdrop-blur-md backdrop-saturate-150 transition-colors ${
            isDark
              ? 'bg-[#0F1529]/80 border-[#34416E]/85 text-[#E7EBF5] shadow-[0_18px_40px_rgba(3,7,18,0.58)] ring-1 ring-[#8FA6E8]/15'
              : 'bg-[#FAF8F4]/80 border-[#CFC8BC]/90 text-[#16213A] shadow-[0_14px_34px_rgba(22,33,58,0.16)] ring-1 ring-white/60'
          }`}
        >
          {/* Top Code + Status Row */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${codeToneClass}`}
            >
              <span
                aria-hidden="true"
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: accentDotColor }}
              />
              <span>{data.code}</span>
            </span>

            {data.status && (
              <span
                className={`font-mono text-[9.5px] font-bold tracking-[0.03em] truncate ${
                  isDark ? 'text-[#C3CCE4]' : 'text-[#4A5163]'
                }`}
              >
                {data.status}
              </span>
            )}
          </div>

          {/* Node Title & Summary */}
          <div className="mt-1.5 text-[12.5px] font-extrabold tracking-tight leading-snug">
            {data.title}
          </div>
          <p
            className={`mt-1 text-[11px] leading-relaxed line-clamp-3 ${
              isDark ? 'text-[#C3CCE4]' : 'text-[#4A5163]'
            }`}
          >
            {data.summary}
          </p>

          {/* Footer Metric & Interaction Hint */}
          {(data.metric || data.hint) && (
            <div
              className={`mt-2.5 pt-2 border-t flex items-center justify-between gap-2 font-mono text-[10px] ${
                isDark ? 'border-[#232B4A]/90' : 'border-[#E4DFD6]/90'
              }`}
            >
              <span
                className={`font-bold truncate tabular-nums ${
                  isDark ? 'text-[#6FCB9F]' : 'text-[#1C6E46]'
                }`}
              >
                {data.metric ?? ''}
              </span>
              {data.hint && (
                <span
                  className={`shrink-0 ${isDark ? 'text-[#8D97B5]' : 'text-[#5F6576]'}`}
                >
                  {data.hint}
                </span>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
