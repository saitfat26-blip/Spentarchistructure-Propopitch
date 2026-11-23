import { GoogleGenAI } from '@google/genai';

export type AssistantPersona = 'architect' | 'investor' | 'market';
export type AllowedModel = 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';
export type GroundingMode = 'none' | 'search' | 'maps';

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export interface GroundedSource {
  title: string;
  uri: string;
  domain?: string;
  sourceType?: 'web' | 'maps';
  reviewSnippet?: string;
}

export interface LatLngPoint {
  latitude: number;
  longitude: number;
}

export interface GeminiChatRequest {
  messages: ChatTurn[];
  persona: AssistantPersona;
  model: AllowedModel;
  useSearchGrounding: boolean;
  groundingMode?: GroundingMode;
  latLng?: LatLngPoint;
  stackSummary?: string;
}

const PERSONA_PROMPTS: Record<AssistantPersona, string> = {
  architect: `You are the Spenta Sovereign OS Principal Solutions Architect.
Help enterprise CTOs, CIOs, and engineering leads compose on-premises AI, ERP, Fintech, Voice AI, IoT Edge, and Spatial XR stacks from Spenta's 13 modules (L1-L6 Sovereign Fusion Stack, 4-Step Sense -> Reason -> Deploy -> Act pipeline, OPA 0.88 Confidence HITL Gate, AMD SEV-SNP / Intel TDX TEEs, and 4-Tier Server PC hardware: Tier 4 $3.2K-$4.2K, Tier 3 $8.5K-$10.5K refurbished 4x RTX 3090 baseline, Tier 2 $12.0K-$14.5K, Tier 1 $14.1K-$15.3K M3 Ultra).
Reference Spenta's Enterprise AI Safety & Climate Doctrine: "Autopilot Suggests, Captain Signs" deterministic governance (mitigating the 95% pilot failure / 56% zero-value Capability-Clarity Paradox), Pre-Trust Capital Audits, and Activity-Based Scope 3 Climate Telemetry.
Distinguish Commercial Tiers cleanly: Model A One-Time Sovereign Builds ($55K-$150K), Model B Quarterly Managed Retainers ($8.6K/qtr Cyber SLA, $6.9K/qtr AI-Native SEO & WebAR at 30.4% GM), and Model C Vertical SaaS / Spatial XR Twins & VR (58.0%-76.3% GM). Keep responses focused (under 260 words unless a comparison table is requested).`,
  investor: `You are the Spenta Technology Investor Diligence & Financial Analyst.
Assist institutional investors and angels reviewing Spenta's reconciled unit economics, governance, and 12 verified production deployments:
- Round Instrument & Use of Funds (Canonical): $500K Post-Money SAFE ($4.5M Post-Money Valuation Cap -> 11.11% initial ownership, 20% discount note). Use of Funds: 45% Core Engineering & Sovereign AI R&D, 30% Compliance & Clinical Validation (HIPAA / SOC 2 / ISO 27001 / TGA / FDA / DGDA), 15% Enterprise GTM & Partnerships, 10% On-Prem Hardware & Reserve.
- Confirmed Core Leadership Team (4 Executives): Marium Maam (Chairwoman & Governance), Farhan Sabit (CEO & Managing Director), Swapon Islam (CTO & Head of Enterprise Architecture), Sharif Abir (COO & Global Delivery Lead), supported by clinical/regulatory advisors and the 20-FTE Dhaka R&D Hub (corporate lineage: GenDev -> GxDx Solutions -> Spenta Technology).
- Dhaka R&D Unit Economics: $12.98/hr fully loaded ($11.50/hr base payroll + $1.48/hr enclave overhead = $540K/yr / 64.8M BDT at 120 BDT/USD; ~$18.54/hr effective billable cost at 70% utilization), delivering 40%-60% client price savings vs. Western agencies.
- 100%-Confidence 3-5 Year ROI Discipline: Growth assumptions are intentionally calibrated inside a disciplined 25% minimum to 35% maximum annualized ROI corridor on Total Investment (Conservative Floor: 1.00x / 25%-28% ROI; Aggressive Growth Cap: 1.12x mix & 1.045^yr compounding / 31%-35% ROI), backed by live production contracts (Prime Bank 1.2M+ OCR docs, Samsung Biologics VR, Apollo JMI Twin, LABAID Medical VR n=240 +30% recall, Plant Care AR 1.4M images, Jotax Oy), fixed Dhaka cost structure, and zero cloud API token burn.
- Reconciled FY2027-FY2031 Conservative Base (~0.5825x 5-yr blended haircut): $672K -> $5.85M rev, $4.252M cum. EBITDA, $3.189M cum. Net Profit (pre-D&A at 25% tax). Always separate 6.38x 5-Year Operating Capital Efficiency ($3.189M cum. Net Profit / $500K raised) from 4.16x-6.24x modeled SAFE Equity Exit ROI (10x-15x Y5 EBITDA = $18.72M-$28.08M EV, 0% dilution, excl. retained cash).
- Healthcare ERP: $19.8K setup + $45/bed/mo ARR ($48K/yr for ~90-bed clinic; $81K/yr for 150-bed hospital; 58.0% GM). Revenue-weighted blended GM bridges 29.1%-34.9% initial builds toward 55%-60% consolidated GM by FY2031 as Recurring SaaS ARR (44% mix, ~72% GM) and 3D/Dataset IP (12% mix, ~78% GM) scale.
- Global Peer Comparables: Strivr (enterprise VR training), Operator XR (tactical/industrial VR), Labster (virtual medical/science labs), Synty/KitBash3D (3D IP licensing).
Keep responses crisp, transparent, and verifiable.`,
  market: `You are the Spenta Technology Live Market & Industry Benchmark Analyst.
Use Google Search grounding or Google Maps grounding (when active) to retrieve up-to-date external AI, ERP, Healthcare, Spatial XR, Climate Scope 3, and Fintech industry benchmarks, regulatory compliance developments (HIPAA, SOC 2, ISO 27001, TGA, FDA, DGDA, Bangladesh Bank ICT v4.0), open-weight LLM/VLM hardware pricing trends, and regional enterprise ecosystems (San Jose HQ, Australia APAC Hub, Dhaka 20-FTE R&D Enclave), then benchmark them directly against Spenta Sovereign OS and global peers (Strivr, Operator XR, Labster, Synty).
Be factual, date-aware, and concise.`,
};

const BENCHMARK_GROUNDING_INSTRUCTION = `
Google Search Grounding Mode is ACTIVE:
- Actively query Google Search to retrieve the latest verified AI (on-prem vs. cloud LLM/VLM latency, GPU hardware, token cost), ERP (implementation timelines, gross margins, enterprise TCO/payback), and Fintech/Healthcare (ICR/OCR accuracy, AML/KYC straight-through processing, BB ICT / HIPAA / SOC 2 compliance) industry benchmarks.
- Clearly distinguish live external industry benchmarks (citing dates/years where available) from Spenta Sovereign OS internal figures.
- Structure comparative takeaways concisely so executives can act on them immediately.`;

const MAPS_GROUNDING_INSTRUCTION = `
Google Maps Grounding Mode is ACTIVE:
- Use Google Maps data to locate real, verifiable regional hospitals, banking headquarters, biopharma/industrial hubs, technology parks, and commercial corridors near the requested geography.
- Highlight why each cluster or organization is strategically relevant to Spenta Sovereign OS deployments (San Jose HQ, Australia APAC Hub, or Dhaka 20-FTE R&D Enclave).
- Format your response in clean Markdown bullet points referencing real place names.`;

const BENCHMARK_INTENT_REGEX =
  /\b(benchmark|compare|comparison|versus|vs\.?|industry|market|latest|trend|2025|2026|tco|roi|cost|erp|fintech|ai|llm|gpu|compliance|hipaa|soc\s*2|bangladesh bank|rate|latency|accuracy)\b/i;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured on the server. Add your Gemini API key in Settings > Secrets.',
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err);
  if (/PERMISSION_DENIED|API_KEY_INVALID|403/i.test(raw)) {
    return new Error(
      'Gemini API authentication failed. Please verify your API key in Settings > Secrets.',
    );
  }
  if (/RESOURCE_EXHAUSTED|429/i.test(raw)) {
    return new Error(
      'Gemini API rate limit or quota reached. Please wait a moment or check your billing-enabled API key in Settings > Secrets.',
    );
  }
  if (/NOT_FOUND|404/i.test(raw)) {
    return new Error(
      'Requested Gemini model was not found. Please retry with the default gemini-4-hydrogen model.',
    );
  }
  return err instanceof Error ? err : new Error(raw || 'Failed to generate Gemini response.');
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = /500|502|503|504|ECONNRESET|ETIMEDOUT|UNAVAILABLE|fetch failed/i.test(
        msg,
      );
      if (!isRetryable || attempt === maxAttempts) {
        throw formatGeminiError(err);
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
  throw formatGeminiError(lastErr);
}

interface RawGroundingResponse {
  candidates?: Array<{
    groundingMetadata?: {
      webSearchQueries?: string[];
      groundingChunks?: Array<{
        web?: { uri?: string; title?: string };
        maps?: {
          uri?: string;
          title?: string;
          placeAnswerSources?: {
            reviewSnippets?: Array<{
              uri?: string;
              title?: string;
              text?: string;
              reviewText?: string;
            }>;
          };
        };
      }>;
    };
  }>;
}

function extractGroundingData(response: RawGroundingResponse): {
  sources: GroundedSource[];
  searchQueries: string[];
} {
  const metadata = response.candidates?.[0]?.groundingMetadata;
  const chunks = metadata?.groundingChunks ?? [];
  const seen = new Set<string>();
  const sources: GroundedSource[] = [];

  for (const chunk of chunks) {
    if (chunk.web?.uri && !seen.has(chunk.web.uri)) {
      const uri = chunk.web.uri;
      seen.add(uri);
      let domain = '';
      try {
        domain = new URL(uri).hostname.replace(/^www\./, '');
      } catch {
        domain = '';
      }
      sources.push({
        uri,
        title: chunk.web.title || domain || uri,
        domain: domain || undefined,
        sourceType: 'web',
      });
    }

    if (chunk.maps?.uri && !seen.has(chunk.maps.uri)) {
      const uri = chunk.maps.uri;
      seen.add(uri);
      const snippets = chunk.maps.placeAnswerSources?.reviewSnippets ?? [];
      const firstSnippet = snippets[0]?.text || snippets[0]?.reviewText;
      sources.push({
        uri,
        title: chunk.maps.title || 'Google Maps Place',
        domain: 'maps.google.com',
        sourceType: 'maps',
        reviewSnippet: firstSnippet,
      });

      for (const snip of snippets) {
        if (snip.uri && !seen.has(snip.uri)) {
          seen.add(snip.uri);
          sources.push({
            uri: snip.uri,
            title: snip.title || `${chunk.maps.title || 'Place'} Review`,
            domain: 'maps.google.com',
            sourceType: 'maps',
            reviewSnippet: snip.text || snip.reviewText,
          });
        }
      }
    }
  }

  const rawQueries = metadata?.webSearchQueries ?? [];
  const searchQueries = Array.from(
    new Set(rawQueries.filter((q): q is string => typeof q === 'string' && q.trim().length > 0)),
  );

  return { sources, searchQueries };
}

function sanitizeLatLng(point?: LatLngPoint): LatLngPoint | undefined {
  if (!point) return undefined;
  const lat = Number(point.latitude);
  const lng = Number(point.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return undefined;
  return { latitude: lat, longitude: lng };
}

export async function runSpentaChat(req: GeminiChatRequest): Promise<{
  text: string;
  sources: GroundedSource[];
  searchQueries: string[];
  modelUsed: AllowedModel;
  grounded: boolean;
  groundingMode: GroundingMode;
}> {
  const ai = getClient();
  const validMessages = (req.messages || []).filter(
    (m) =>
      (m.role === 'user' || m.role === 'model') &&
      typeof m.text === 'string' &&
      m.text.trim().length > 0,
  );

  if (validMessages.length === 0) {
    throw new Error('At least one user message is required.');
  }

  const lastMessage = validMessages[validMessages.length - 1];
  const historyMessages = validMessages.slice(0, -1);

  // Never combine googleMaps and googleSearch in the same request.
  let resolvedMode: GroundingMode = 'none';
  if (req.groundingMode === 'maps') {
    resolvedMode = 'maps';
  } else if (req.groundingMode === 'search') {
    resolvedMode = 'search';
  } else if (req.groundingMode === 'none') {
    resolvedMode = 'none';
  } else {
    const wantsBenchmarkSearch =
      req.useSearchGrounding ||
      req.persona === 'market' ||
      (req.useSearchGrounding !== false && BENCHMARK_INTENT_REGEX.test(lastMessage.text));
    resolvedMode = wantsBenchmarkSearch ? 'search' : 'none';
  }

  const useGrounding = resolvedMode !== 'none';
  const modelUsed: AllowedModel = useGrounding
    ? 'gemini-4-hydrogen'
    : req.model === 'gemini-3.1-flash-lite'
      ? 'gemini-3.1-flash-lite'
      : 'gemini-4-hydrogen';

  const safeCoords = sanitizeLatLng(req.latLng);

  const systemInstruction = [
    PERSONA_PROMPTS[req.persona] ?? PERSONA_PROMPTS.architect,
    resolvedMode === 'search' ? BENCHMARK_GROUNDING_INSTRUCTION : '',
    resolvedMode === 'maps' ? MAPS_GROUNDING_INSTRUCTION : '',
    req.stackSummary ? `\nCurrent user Stack Composer & Infrastructure context:\n${req.stackSummary}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const toolsConfig =
    resolvedMode === 'maps'
      ? {
          tools: [{ googleMaps: {} }],
          ...(safeCoords
            ? {
                toolConfig: {
                  retrievalConfig: {
                    latLng: safeCoords,
                  },
                },
              }
            : {}),
        }
      : resolvedMode === 'search'
        ? { tools: [{ googleSearch: {} }] }
        : {};

  const response = await withRetry(async () => {
    const chat = ai.chats.create({
      model: modelUsed,
      history: historyMessages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      })),
      config: {
        systemInstruction,
        ...toolsConfig,
      },
    });

    return chat.sendMessage({
      message: lastMessage.text,
    });
  });

  const text = (response.text ?? '').trim();
  const { sources, searchQueries } = extractGroundingData(response as RawGroundingResponse);

  return {
    text: text || 'No response text was returned by the model.',
    sources,
    searchQueries,
    modelUsed,
    grounded: useGrounding,
    groundingMode: resolvedMode,
  };
}

export interface RoiBenchmarkContext {
  productName?: string;
  scenarioLabel?: string;
  modeledRoiPct?: number;
  paybackMonths?: number;
  spentaThreeYrTcoUsd?: number;
  westernThreeYrTcoUsd?: number;
}

export async function runSearchGroundedBrief(
  query: string,
  context?: RoiBenchmarkContext,
): Promise<{
  text: string;
  sources: GroundedSource[];
  searchQueries: string[];
  modelUsed: 'gemini-4-hydrogen';
}> {
  const ai = getClient();
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    throw new Error('A search query is required.');
  }

  const contextLines = context
    ? [
        context.productName ? `Target Solution: ${context.productName}` : '',
        context.scenarioLabel ? `Financial Scenario: ${context.scenarioLabel}` : '',
        typeof context.modeledRoiPct === 'number'
          ? `Modeled 12-Month Client ROI: ${context.modeledRoiPct}%`
          : '',
        typeof context.paybackMonths === 'number'
          ? `Modeled Payback Period: ${context.paybackMonths} months`
          : '',
        typeof context.spentaThreeYrTcoUsd === 'number'
          ? `Spenta 3-Year TCO: $${Math.round(context.spentaThreeYrTcoUsd).toLocaleString()}`
          : '',
        typeof context.westernThreeYrTcoUsd === 'number'
          ? `Western Cloud/Agency 3-Year TCO: $${Math.round(context.westernThreeYrTcoUsd).toLocaleString()}`
          : '',
      ].filter(Boolean)
    : [];

  const fullPrompt =
    contextLines.length > 0
      ? `${cleanQuery}\n\nSpenta Internal Benchmark Context:\n${contextLines.map((l) => `- ${l}`).join('\n')}`
      : cleanQuery;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: fullPrompt,
      config: {
        systemInstruction:
          'You are a concise enterprise technology and ROI benchmark analyst supporting Spenta Technology (spenta.tech). Provide an up-to-date, fact-checked executive brief grounded in Google Search results covering AI, ERP, Healthcare, Spatial XR, and Fintech TCO/ROI benchmarks in 4-5 crisp Markdown bullet points. Always distinguish live external benchmarks (with dates/sources) from Spenta internal projections.',
        tools: [{ googleSearch: {} }],
      },
    }),
  );

  const { sources, searchQueries } = extractGroundingData(response as RawGroundingResponse);

  return {
    text: (response.text ?? '').trim() || 'No grounded brief returned.',
    sources,
    searchQueries,
    modelUsed: 'gemini-4-hydrogen',
  };
}

export async function runMapsGroundedBrief(
  query: string,
  latLng?: LatLngPoint,
  hubLabel?: string,
): Promise<{
  text: string;
  sources: GroundedSource[];
  modelUsed: 'gemini-4-hydrogen';
}> {
  const ai = getClient();
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    throw new Error('A regional market query is required.');
  }

  const safeCoords = sanitizeLatLng(latLng);
  const promptWithContext = hubLabel
    ? `Regional Hub Focus: ${hubLabel}\n\n${cleanQuery}\n\nProvide a concise, actionable Markdown brief listing concrete real-world institutions, medical/financial/industrial clusters, and why they align with Spenta Sovereign OS on-premises enterprise deployments.`
    : cleanQuery;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: promptWithContext,
      config: {
        tools: [{ googleMaps: {} }],
        ...(safeCoords
          ? {
              toolConfig: {
                retrievalConfig: {
                  latLng: safeCoords,
                },
              },
            }
          : {}),
      },
    }),
  );

  const { sources } = extractGroundingData(response as RawGroundingResponse);

  return {
    text: (response.text ?? '').trim() || 'No regional Maps intelligence returned.',
    sources,
    modelUsed: 'gemini-4-hydrogen',
  };
}
