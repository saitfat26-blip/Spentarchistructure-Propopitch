import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useStack } from '../store/StackContext';
import { REGIONAL_HUBS } from '../data/roiModel';

type Persona = 'architect' | 'investor' | 'market';
type ModelChoice = 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';
type GroundingMode = 'none' | 'search' | 'maps';

interface GroundedSource {
  title: string;
  uri: string;
  domain?: string;
  sourceType?: 'web' | 'maps';
  reviewSnippet?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: GroundedSource[];
  searchQueries?: string[];
  modelUsed?: string;
  grounded?: boolean;
  groundingMode?: GroundingMode;
  timestamp: string;
}

const CHAT_STORAGE_KEY = 'spenta_gemini_chat_v1';

const PERSONAS: { id: Persona; label: string; desc: string }[] = [
  {
    id: 'architect',
    label: 'Solutions Architect',
    desc: 'L1–L6 stack design, 0.88 HITL & on-prem vs. cloud AI benchmarks',
  },
  {
    id: 'investor',
    label: 'Investor Diligence',
    desc: '$500K SAFE, FY27–FY31 P&L & ERP/SaaS industry margin benchmarks',
  },
  {
    id: 'market',
    label: 'Market Scout',
    desc: 'Live Google Search grounded AI, ERP & Fintech industry benchmarks',
  },
];

const BENCHMARK_QUICK_ACTIONS: { label: string; prompt: string }[] = [
  {
    label: 'AI Inference TCO',
    prompt:
      'Compare latest 2026 enterprise on-premises GPU server AI inference TCO & latency benchmarks against cloud LLM API pricing, and position Spenta Tier-3 ($8.5K–$10.5K) hardware.',
  },
  {
    label: 'ERP ROI Benchmarks',
    prompt:
      'What are the latest 2026 enterprise ERP implementation cost, timeline, and ROI industry benchmarks compared to Spenta Sovereign ERP & Dhaka dual-shore delivery ($12.98/hr loaded; $11.50/hr base)?',
  },
  {
    label: 'Fintech ICR & Compliance',
    prompt:
      'Summarize current 2026 Fintech document ICR/OCR straight-through processing accuracy benchmarks and banking AI compliance standards (HIPAA, SOC 2, Bangladesh Bank ICT) vs. Spenta 0.88 OPA HITL gate.',
  },
];

const STARTER_PROMPTS: Record<Persona, string[]> = {
  architect: [
    'Review my composed stack and benchmark our on-prem server tier against current cloud GPU API costs.',
    'How does Bank Document Intelligence (BankOCR) enforce the 0.88 OPA HITL gate compared to current fintech OCR benchmarks?',
    'Which Spenta modules should a 150-bed hospital deploy first under latest 2026 HL7/FHIR standards?',
  ],
  investor: [
    'Compare Spenta 29.1%–76.3% conservative gross margins against current 2026 Enterprise ERP & AI SaaS industry benchmarks.',
    'Separate Spenta 6.38x 5-year Capital Efficiency from modeled 4.16x–6.24x SAFE Exit ROI at 10x–15x Y5 EBITDA.',
    'How does Spenta Dhaka R&D ($12.98/hr fully loaded; ~$18.54/hr @ 70% util.) compare to global offshore engineering benchmarks?',
  ],
  market: [
    'What are the latest 2026 AI, ERP, and Fintech enterprise adoption & ROI benchmarks?',
    'Locate leading multi-specialty hospital networks in Dhaka for AI Healthcare ERP deployments.',
    'Compare current enterprise on-prem GPU server costs vs. cloud LLM API spend for regulated banks.',
  ],
};

function loadInitialMessages(): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [
    {
      id: 'welcome',
      role: 'model',
      text: 'Welcome to Spenta Sovereign AI Advisor with live Google Search Grounding. Ask for stack analysis, SAFE diligence, or up-to-date AI, ERP, and Fintech industry benchmark comparisons—sources and search queries are cited automatically.',
      modelUsed: 'gemini-4-hydrogen',
      grounded: true,
      timestamp: new Date().toISOString(),
    },
  ];
}

export function SpentaAiAssistant() {
  const { paletteMode } = useTheme();
  const {
    aiAssistantOpen,
    setAiAssistantOpen,
    buildExecutiveBrief,
    selectedApps,
    deploymentProfile,
  } = useStack();
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadInitialMessages());
  const [persona, setPersona] = useState<Persona>('architect');
  const [groundingMode, setGroundingMode] = useState<GroundingMode>('search');
  const [mapsHubId, setMapsHubId] = useState<'san-jose' | 'sydney' | 'dhaka'>('dhaka');
  const [model, setModel] = useState<ModelChoice>('gemini-4-hydrogen');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  const isStone = paletteMode === 'stone';
  const activeHub = REGIONAL_HUBS.find((h) => h.id === mapsHubId) ?? REGIONAL_HUBS[2];
  const groundingActive = groundingMode !== 'none';

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    if (aiAssistantOpen) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, aiAssistantOpen, loading]);

  useEffect(() => {
    if (!aiAssistantOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAiAssistantOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aiAssistantOpen, setAiAssistantOpen]);

  const sendMessage = async (
    textOverride?: string,
    options?: { forceMode?: GroundingMode; personaOverride?: Persona },
  ) => {
    const promptText = (textOverride ?? input).trim();
    if (!promptText || loading) return;

    const effectivePersona = options?.personaOverride ?? persona;
    const effectiveMode: GroundingMode = options?.forceMode ?? groundingMode;
    const effectiveGrounding = effectiveMode !== 'none';

    if (options?.forceMode && options.forceMode !== groundingMode) {
      setGroundingMode(options.forceMode);
      if (options.forceMode !== 'none') setModel('gemini-4-hydrogen');
    }
    if (options?.personaOverride && options.personaOverride !== persona) {
      setPersona(options.personaOverride);
    }

    setErrorMsg(null);
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: promptText,
      timestamp: new Date().toISOString(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = nextHistory
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          persona: effectivePersona,
          model: effectiveGrounding ? 'gemini-4-hydrogen' : model,
          useSearchGrounding: effectiveMode === 'search',
          groundingMode: effectiveMode,
          latLng:
            effectiveMode === 'maps'
              ? { latitude: activeHub.latitude, longitude: activeHub.longitude }
              : undefined,
          stackSummary:
            selectedApps.length > 0
              ? buildExecutiveBrief()
              : `Infrastructure Target: ${deploymentProfile.switcherLabel} — ${deploymentProfile.title} (${deploymentProfile.latencyBudget})`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      const reply: ChatMessage = {
        id: `m_${Date.now()}`,
        role: 'model',
        text: data.text,
        sources: Array.isArray(data.sources) ? data.sources : [],
        searchQueries: Array.isArray(data.searchQueries) ? data.searchQueries : [],
        modelUsed: data.modelUsed,
        grounded: Boolean(data.grounded),
        groundingMode: data.groundingMode ?? effectiveMode,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to reach Gemini service.');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    const reset: ChatMessage[] = [
      {
        id: 'welcome',
        role: 'model',
        text: 'Conversation cleared. Choose a persona or run a live AI, ERP, or Fintech industry benchmark comparison grounded in Google Search.',
        modelUsed: 'gemini-4-hydrogen',
        grounded: true,
        timestamp: new Date().toISOString(),
      },
    ];
    setMessages(reset);
    setErrorMsg(null);
  };

  return (
    <>
      {/* Compact Floating Launcher Button (Bottom-Right, Static) */}
      {!aiAssistantOpen && (
        <button
          type="button"
          onClick={() => setAiAssistantOpen(true)}
          className={`fixed bottom-4 right-4 z-40 min-h-[44px] inline-flex items-center gap-2 border px-3.5 py-2.5 rounded-xl shadow-lg text-xs font-semibold transition-colors cursor-pointer no-print ${
            isStone
              ? 'bg-[#16213A] hover:bg-[#1F3863] text-white border-[#1F3863]'
              : 'bg-[#141A32] hover:bg-[#1C2545] text-[#E7EBF5] border-[#6FCB9F]/45'
          }`}
          aria-label="Open Spenta AI Advisor"
        >
          <Sparkles className="w-4 h-4 text-[#6FCB9F]" strokeWidth={1.5} />
          <span className="hidden sm:inline">Spenta AI Advisor</span>
          <span className="sm:hidden">AI Advisor</span>
          <span className="hidden md:inline font-mono text-[10px] text-[#6FCB9F] bg-[#6FCB9F]/15 px-1.5 py-0.5 rounded">
            Live Benchmarks
          </span>
        </button>
      )}

      {/* Multi-Turn Gemini Chat & Google Search Grounding Drawer */}
      {aiAssistantOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end no-print"
          role="dialog"
          aria-modal="true"
          aria-label="Spenta Gemini AI Advisor"
        >
          <div
            className="fixed inset-0 bg-[#0B1020]/70 backdrop-blur-xs"
            onClick={() => setAiAssistantOpen(false)}
          />

          <aside
            className={`relative z-10 w-full sm:max-w-[460px] h-full shadow-2xl border-l flex flex-col ${
              isStone
                ? 'bg-[#FAF8F4] border-[#E4DFD6] text-[#16213A]'
                : 'bg-[#0F1529] border-[#232B4A] text-[#E7EBF5]'
            }`}
          >
            {/* Header */}
            <div
              className={`px-4 py-3.5 text-[#E7EBF5] border-b flex items-center justify-between gap-2 shrink-0 ${
                isStone
                  ? 'bg-[#16213A] border-[#263557]'
                  : 'bg-[#0B1020] border-[#232B4A]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#6FCB9F]/15 border border-[#6FCB9F]/35 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-[#6FCB9F]" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">Spenta AI Advisor</div>
                  <div className="text-[10px] font-mono text-[#6FCB9F] truncate">
                    {groundingMode === 'maps'
                      ? `Google Maps Grounded · ${activeHub.name}`
                      : groundingMode === 'search'
                        ? 'Google Search Grounded · AI, ERP & Fintech Benchmarks'
                        : `${model} · Verified Spenta Corpus`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={clearHistory}
                  className="p-2 rounded-lg text-[#A8B4D4] hover:text-white hover:bg-white/10 cursor-pointer"
                  title="Clear conversation history"
                  aria-label="Clear conversation history"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setAiAssistantOpen(false)}
                  className="p-2 rounded-lg text-[#A8B4D4] hover:text-white hover:bg-white/10 cursor-pointer"
                  aria-label="Close AI Advisor"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Role, Google Search Grounding Toggle & Quick Industry Benchmark Bar */}
            <div
              className={`px-4 py-2.5 border-b space-y-2 shrink-0 ${
                isStone
                  ? 'bg-[#F2EFE9] border-[#E4DFD6]'
                  : 'bg-[#141A32] border-[#232B4A]'
              }`}
            >
              <div className="grid grid-cols-3 gap-1">
                {PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPersona(p.id);
                      if (p.id === 'market' && groundingMode === 'none') {
                        setGroundingMode('search');
                        setModel('gemini-4-hydrogen');
                      }
                    }}
                    className={`min-h-[34px] px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer truncate ${
                      persona === p.id
                        ? isStone
                          ? 'bg-[#1F3863] text-white'
                          : 'bg-[#8FA6E8] text-[#0B1020]'
                        : isStone
                          ? 'bg-white text-[#4A5163] border border-[#E4DFD6] hover:border-[#1F3863]'
                          : 'bg-[#0B1020] text-[#C8D0E4] border border-[#232B4A] hover:border-[#8FA6E8]'
                    }`}
                    title={p.desc}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* 3-Mode Grounding Switcher: Corpus | Google Search | Google Maps */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="inline-flex rounded-md bg-white dark:bg-[#0B1020] border border-[#E4DFD6] dark:border-[#232B4A] p-0.5 font-mono text-[10px]">
                  {(
                    [
                      { id: 'none', label: 'Corpus' },
                      { id: 'search', label: 'Search' },
                      { id: 'maps', label: 'Maps' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setGroundingMode(opt.id);
                        if (opt.id !== 'none') setModel('gemini-4-hydrogen');
                      }}
                      className={`px-2 py-1 rounded transition-colors cursor-pointer whitespace-nowrap ${
                        groundingMode === opt.id
                          ? 'bg-[#1C6E46] dark:bg-[#6FCB9F] text-white dark:text-[#0B1020] font-bold'
                          : 'text-[#5F6576] dark:text-[#8E96B0] hover:text-[#16213A] dark:hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {groundingMode === 'maps' ? (
                  <div className="inline-flex items-center gap-1 font-mono text-[10px]">
                    {REGIONAL_HUBS.map((hub) => (
                      <button
                        key={hub.id}
                        type="button"
                        onClick={() => setMapsHubId(hub.id)}
                        className={`px-1.5 py-0.5 rounded border cursor-pointer whitespace-nowrap ${
                          mapsHubId === hub.id
                            ? 'bg-[#1F3863] dark:bg-[#8FA6E8] text-white dark:text-[#0B1020] border-transparent font-bold'
                            : isStone
                              ? 'bg-white border-[#CFC8BC] text-[#5F6576]'
                              : 'bg-[#0B1020] border-[#232B4A] text-[#8E96B0]'
                        }`}
                      >
                        {hub.id === 'san-jose' ? 'San Jose' : hub.id === 'sydney' ? 'AU' : 'Dhaka'}
                      </button>
                    ))}
                  </div>
                ) : !groundingActive ? (
                  <div className="inline-flex rounded-md bg-white dark:bg-[#0B1020] border border-[#E4DFD6] dark:border-[#232B4A] p-0.5 font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={() => setModel('gemini-4-hydrogen')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        model === 'gemini-4-hydrogen'
                          ? 'bg-[#1F3863] dark:bg-[#8FA6E8] text-white dark:text-[#0B1020] font-bold'
                          : 'text-[#5F6576] dark:text-[#8E96B0]'
                      }`}
                    >
                      Hydrogen
                    </button>
                    <button
                      type="button"
                      onClick={() => setModel('gemini-3.1-flash-lite')}
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded cursor-pointer ${
                        model === 'gemini-3.1-flash-lite'
                          ? 'bg-[#1F3863] dark:bg-[#8FA6E8] text-white dark:text-[#0B1020] font-bold'
                          : 'text-[#5F6576] dark:text-[#8E96B0]'
                      }`}
                    >
                      <Zap className="w-2.5 h-2.5" /> Fast Lite
                    </button>
                  </div>
                ) : (
                  <span
                    className={`font-mono text-[10px] ${
                      isStone ? 'text-[#5F6576]' : 'text-[#8E96B0]'
                    }`}
                  >
                    Target: {deploymentProfile.switcherLabel} · Live Web Citations
                  </span>
                )}
              </div>

              {/* 1-Click Live AI, ERP & Fintech Industry Benchmark Comparisons */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                <span
                  className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold shrink-0 ${
                    isStone ? 'text-[#5F6576]' : 'text-[#8E96B0]'
                  }`}
                >
                  <BarChart3 className="w-3 h-3" strokeWidth={1.7} />
                  <span>Benchmarks:</span>
                </span>
                {BENCHMARK_QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      sendMessage(action.prompt, {
                        forceMode: 'search',
                        personaOverride: 'market',
                      })
                    }
                    className={`px-2 py-1 rounded border text-[10.5px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 ${
                      isStone
                        ? 'bg-white border-[#CFC8BC] text-[#1F3863] hover:border-[#1F3863]'
                        : 'bg-[#0B1020] border-[#232B4A] text-[#6FCB9F] hover:border-[#6FCB9F]'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Conversation Thread */}
            <div
              className={`flex-1 overflow-y-auto px-4 py-4 space-y-3 ${
                isStone ? 'bg-[#FAF8F4]' : 'bg-[#0F1529]'
              }`}
            >
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[92%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? isStone
                            ? 'bg-[#1F3863] text-white font-medium'
                            : 'bg-[#8FA6E8] text-[#0B1020] font-medium'
                          : isStone
                            ? 'bg-white text-[#16213A] border border-[#E4DFD6]'
                            : 'bg-[#141A32] text-[#E7EBF5] border border-[#232B4A]'
                      }`}
                    >
                      {msg.text}

                      {msg.searchQueries && msg.searchQueries.length > 0 && (
                        <div
                          className={`mt-2.5 pt-2 border-t space-y-1 ${
                            isStone ? 'border-[#E4DFD6]' : 'border-[#232B4A]'
                          }`}
                        >
                          <div
                            className={`text-[10px] font-mono font-semibold flex items-center gap-1 ${
                              isStone ? 'text-[#5F6576]' : 'text-[#8E96B0]'
                            }`}
                          >
                            <Search className="w-2.5 h-2.5" />
                            <span>Google Search Queries:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {msg.searchQueries.slice(0, 4).map((q) => (
                              <span
                                key={q}
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                  isStone
                                    ? 'bg-[#F2EFE9] text-[#4A5163]'
                                    : 'bg-[#0B1020] text-[#C8D0E4]'
                                }`}
                              >
                                “{q}”
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {msg.sources && msg.sources.length > 0 && (
                        <div
                          className={`mt-2.5 pt-2 border-t space-y-1.5 ${
                            isStone ? 'border-[#E4DFD6]' : 'border-[#232B4A]'
                          }`}
                        >
                          <div className="text-[10px] font-mono font-bold uppercase text-[#1C6E46] dark:text-[#6FCB9F] flex items-center gap-1">
                            {msg.groundingMode === 'maps' ? (
                              <>
                                <MapPin className="w-3 h-3" /> Google Maps Places ({msg.sources.length})
                              </>
                            ) : (
                              <>
                                <Globe className="w-3 h-3" /> Grounded Web Sources ({msg.sources.length})
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sources.slice(0, 8).map((src) => (
                              <a
                                key={src.uri}
                                href={src.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={src.reviewSnippet || src.uri}
                                className={`inline-flex items-center gap-1 text-[10px] font-mono border px-2 py-0.5 rounded max-w-full transition-colors ${
                                  isStone
                                    ? 'bg-[#FAF8F4] border-[#CFC8BC] text-[#1C6E46] hover:border-[#1C6E46]'
                                    : 'bg-[#0B1020] border-[#232B4A] text-[#6FCB9F] hover:border-[#6FCB9F]'
                                }`}
                              >
                                {src.sourceType === 'maps' ? (
                                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                                ) : (
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                )}
                                <span className="truncate max-w-[190px]">{src.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {!isUser && msg.modelUsed && (
                      <span
                        className={`text-[10px] font-mono mt-1 px-1 ${
                          isStone ? 'text-[#5F6576]' : 'text-[#8E96B0]'
                        }`}
                      >
                        {msg.modelUsed}
                        {msg.groundingMode === 'maps'
                          ? ' · Google Maps Grounded'
                          : msg.grounded
                            ? ' · Google Search Grounded'
                            : ''}
                      </span>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2 text-xs font-mono text-[#1C6E46] dark:text-[#6FCB9F] bg-[#1C6E46]/10 dark:bg-[#6FCB9F]/15 border border-[#1C6E46]/30 dark:border-[#6FCB9F]/30 rounded-xl px-3 py-2 w-fit">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    {groundingMode === 'maps'
                      ? `Querying Google Maps around ${activeHub.name}…`
                      : groundingMode === 'search'
                        ? 'Searching live AI, ERP & Fintech benchmarks…'
                        : 'Synthesizing architecture brief…'}
                  </span>
                </div>
              )}

              {errorMsg && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">AI Advisor Notice</div>
                    <p className="mt-0.5">{errorMsg}</p>
                  </div>
                </div>
              )}

              {messages.length <= 2 && !loading && (
                <div className="pt-2 space-y-1.5">
                  <div
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                      isStone ? 'text-[#5F6576]' : 'text-[#8E96B0]'
                    }`}
                  >
                    Suggested {PERSONAS.find((p) => p.id === persona)?.label} Prompts
                  </div>
                  {STARTER_PROMPTS[persona].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className={`w-full text-left text-xs border rounded-lg px-3 py-2.5 transition-colors cursor-pointer ${
                        isStone
                          ? 'bg-white border-[#E4DFD6] text-[#16213A] hover:border-[#1F3863]'
                          : 'bg-[#141A32] border-[#232B4A] text-[#E7EBF5] hover:border-[#8FA6E8]'
                      }`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              <div ref={scrollEndRef} />
            </div>

            {/* Composer Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className={`p-3 border-t flex items-center gap-2 shrink-0 ${
                isStone
                  ? 'bg-[#F2EFE9] border-[#E4DFD6]'
                  : 'bg-[#0B1020] border-[#232B4A]'
              }`}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for AI, ERP, or Fintech benchmarks or stack analysis..."
                className={`flex-1 min-h-[40px] px-3 py-2 text-xs border rounded-lg focus:outline-none focus:border-[#1F3863] dark:focus:border-[#8FA6E8] ${
                  isStone
                    ? 'bg-white border-[#CFC8BC] text-[#16213A] placeholder:text-[#7B8294]'
                    : 'bg-[#141A32] border-[#232B4A] text-[#E7EBF5] placeholder:text-[#8E96B0]'
                }`}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center p-2.5 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] disabled:bg-[#CFC8BC] dark:disabled:bg-[#232B4A] text-white transition-colors cursor-pointer"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}
