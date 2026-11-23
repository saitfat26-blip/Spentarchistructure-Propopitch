import { PitchSlide } from './spentaManifest';

export type GrowthMode = 'conservative' | 'aggressive';

export interface GrowthModeSpec {
  id: GrowthMode;
  label: string;
  shortLabel: string;
  mixMultiplier: number;
  annualCompoundBase: number;
  targetRoiMinPct: number;
  targetRoiMaxPct: number;
  horizonYears: string;
  confidenceBadge: string;
  summary: string;
}

/**
 * Disciplined 100%-confidence growth parameters calibrated strictly to a
 * 25% minimum and 35% maximum annualized ROI on Total Investment over 3–5 years.
 */
export const GROWTH_MODE_SPECS: Record<GrowthMode, GrowthModeSpec> = {
  conservative: {
    id: 'conservative',
    label: 'Conservative (25% ROI Floor)',
    shortLabel: 'Conservative',
    mixMultiplier: 1.0,
    annualCompoundBase: 1.0,
    targetRoiMinPct: 25,
    targetRoiMaxPct: 28,
    horizonYears: '3–5 Years',
    confidenceBadge: '100% Execution Confidence · 25% Min ROI Floor',
    summary:
      'Anchored to the reconciled FY2027–FY2031 base ledger ($672K → $5.85M) with zero speculative upside—targeting a dependable 25%–28% annualized ROI on total investment.',
  },
  aggressive: {
    id: 'aggressive',
    label: 'Aggressive Growth (35% ROI Cap)',
    shortLabel: 'Aggressive Growth',
    mixMultiplier: 1.12,
    annualCompoundBase: 1.045,
    targetRoiMinPct: 31,
    targetRoiMaxPct: 35,
    horizonYears: '3–5 Years',
    confidenceBadge: '100% Execution Confidence · 35% Max ROI Cap',
    summary:
      'Disciplined +12% mix capture and +4.5%/yr compounding (1.00× → 1.19× by FY2031), intentionally capped at 35% annualized ROI on total investment to eliminate over-estimated hockey-stick assumptions.',
  },
};

export const ROI_CONFIDENCE_EVIDENCE_NOTE = {
  title: '100% Execution Confidence Band: 25% Min – 35% Max Annualized ROI (3–5 Year Horizon)',
  lead: 'Rather than modeling speculative 1.75× hockey-stick multipliers, Spenta deliberately constrains growth assumptions inside a verifiable 25%–35% ROI corridor backed by contracted delivery unit economics.',
  pillars: [
    {
      label: 'Live Production Proofs Already Deployed',
      detail:
        'Revenue baseline is anchored in live enterprise systems—Prime Bank OCR (1.2M+ docs), Samsung Biologics GMP cleanroom VR, Apollo 360° digital twin, Jotax Oy EU BI, and 100+ delivered engagements across 9+ global clients.',
    },
    {
      label: 'Structural Dual-Shore Margin Floor',
      detail:
        'A 20-FTE Dhaka R&D enclave ($12.98/hr fully loaded · $45K/mo total hub budget) paired with USD/AUD/EUR enterprise pricing preserves positive operating cashflow even at conservative utilization.',
    },
    {
      label: 'Zero Hyperscaler Cloud Token Burn',
      detail:
        'Self-hosted on-premises Server PCs ($8.5K–$10.5K Tier 3 baseline) eliminate recurring LLM API margin erosion, locking repeatable gross margins across Model A/B/C enterprise retainers.',
    },
    {
      label: 'Captive Distribution & Renewal Visibility',
      detail:
        'Built-in sister-entity deployments (BEST 65+ retail showrooms, X Ltd 80 BaaS stations / 480 EVs) plus quarterly Cyber SLA & SaaS renewals provide predictable multi-year cash conversion.',
    },
  ],
};

export interface ShowreelChapter {
  id: string;
  timestampLabel: string;
  seconds: number;
  title: string;
  sector: string;
  highlight: string;
  appIds: string[];
}

export const SHOWREEL_VIDEO_SRC = '/assets/aistudio/Spenta_Demo_-_1080_c74fdc06.mp4';

export const SHOWREEL_CHAPTERS: ShowreelChapter[] = [
  {
    id: '0',
    timestampLabel: '0:00',
    seconds: 0,
    title: 'Spenta Sovereign OS Reel Intro',
    sector: 'Platform Overview',
    highlight: 'Unified enterprise AI, Spatial XR, and digital twin production showcase.',
    appIds: ['spatial_xr', 'icr_ops'],
  },
  {
    id: '16',
    timestampLabel: '0:16',
    seconds: 16,
    title: 'Samsung Biologics GMP Cleanroom VR',
    sector: 'Biopharma & Healthcare',
    highlight: 'Zero-risk sterile cleanroom SOP simulation via VirtuTrain360.',
    appIds: ['spatial_xr', 'healthcare_erp'],
  },
  {
    id: '18',
    timestampLabel: '0:18',
    seconds: 18,
    title: 'Solar System VR & Spatial Telemetry',
    sector: 'Spatial Simulation',
    highlight: 'Interactive orbital mechanics and multi-body 3D visualization in VR.',
    appIds: ['spatial_xr', 'iot_edge'],
  },
  {
    id: '30',
    timestampLabel: '0:30',
    seconds: 30,
    title: 'WebAR Product Try-On & Spatial Retail',
    sector: 'Retail & Commerce',
    highlight: 'Zero-app mobile WebAR placement lifting conversion +28% and cutting returns −22%.',
    appIds: ['branding_geo', 'spatial_xr'],
  },
  {
    id: '34',
    timestampLabel: '0:34',
    seconds: 34,
    title: 'VirtuCareBD / VirtuED Medical AR',
    sector: 'Clinical Education',
    highlight: 'Interactive anatomical AR curriculum validated with n=240 cohort (+30% recall).',
    appIds: ['healthcare_erp', 'spatial_xr'],
  },
  {
    id: '56',
    timestampLabel: '0:56',
    seconds: 56,
    title: 'Gamification & UE5 Co-Op Training',
    sector: 'Enterprise LMS',
    highlight: 'Multi-user Unreal Engine 5 procedural scenarios and gamified workforce readiness.',
    appIds: ['spatial_xr', 'workflow_ai'],
  },
  {
    id: '67',
    timestampLabel: '1:07',
    seconds: 67,
    title: 'UE5 Environments & Modular 3D Asset Packs',
    sector: '3D IP & Royalties',
    highlight: 'Reusable PBR asset pipelines powering 70%–88% marketplace and enterprise royalties.',
    appIds: ['spatial_xr', 'datasets'],
  },
  {
    id: '82',
    timestampLabel: '1:22',
    seconds: 82,
    title: 'Apollo Clinic 360° Digital Twin',
    sector: 'Healthcare Facilities',
    highlight: 'Photorealistic hospital twin integrated with HL7/FHIR workflows and AI guides.',
    appIds: ['healthcare_erp', 'spatial_xr', 'voice_ai'],
  },
  {
    id: '136',
    timestampLabel: '2:16',
    seconds: 136,
    title: 'Puthia Rajbari 360° Heritage Twin',
    sector: 'Cultural Heritage & Civic',
    highlight: 'High-precision architectural preservation twin with multilingual spatial narration.',
    appIds: ['spatial_xr', 'voice_ai'],
  },
  {
    id: '165',
    timestampLabel: '2:45',
    seconds: 165,
    title: 'Old Central Jail Aerial Photogrammetry',
    sector: 'Civic & Digital Twins',
    highlight: 'Drone LiDAR & photogrammetry reconstruction for heritage archiving and virtual tours.',
    appIds: ['spatial_xr', 'iot_edge'],
  },
];

export interface BrandCollaboration {
  name: string;
  domain: string;
}

export const BRAND_COLLABORATIONS: BrandCollaboration[] = [
  { name: 'Prime Bank', domain: 'Banking OCR & Sovereign AI' },
  { name: 'Nike', domain: 'Interactive Brand & 3D' },
  { name: 'Adidas', domain: 'Spatial Retail Experience' },
  { name: 'Hyundai', domain: '3D Product Showcase' },
  { name: 'Samsung', domain: 'GMP Cleanroom VR Training' },
  { name: 'Toyota', domain: 'Interactive Mobility Media' },
  { name: 'Coca-Cola', domain: '3D Brand Activation' },
  { name: 'Suzuki', domain: 'Digital Experience' },
  { name: 'British American Tobacco (BAT)', domain: 'Enterprise Activation' },
  { name: 'Apollo JMI', domain: 'Hospital 360° Digital Twin' },
  { name: 'bKash', domain: 'bKashVerse 3D Ecosystem' },
  { name: 'ISHO', domain: 'Zero-App WebAR Commerce' },
  { name: 'Jotax Oy', domain: 'EU Legacy BI Virtualization' },
  { name: 'LABAID', domain: 'VirtuED Medical AR' },
  { name: 'LankaBangla Finance', domain: 'BFSI Digital Rails' },
  { name: 'Asiatic MCL', domain: 'Interactive Media & DOOH' },
];

export interface CoreLeader {
  id: string;
  name: string;
  role: string;
  location: string;
  focus: string;
  credentials: string;
  initials: string;
}

/**
 * Verified 4-leader executive & technical roster.
 */
export const CORE_LEADERSHIP_TEAM: CoreLeader[] = [
  {
    id: 'marium_maam',
    name: 'Marium Maam',
    role: 'Managing Director',
    location: 'Australia / Global Governance',
    focus: 'Corporate governance, ANZ partner network, and cross-border commercial structure.',
    credentials: 'Leads institutional partnerships, cross-border legal compliance, and enterprise board relationships.',
    initials: 'MM',
  },
  {
    id: 'farhan_sabit',
    name: 'Farhan Sabit',
    role: 'Software Architect & Technical Lead',
    location: 'Dhaka R&D Hub / Global',
    focus: 'L1–L6 Sovereign Fusion Stack, Rust/Wasm edge gateways, ESB/CBS banking rails, and OPA governance.',
    credentials: 'Architected air-gapped document AI pipelines, multi-tenant ERP backbones, and hardware TEE deployments.',
    initials: 'FS',
  },
  {
    id: 'swapon_islam',
    name: 'Swapon Islam',
    role: 'Game Dev & Interactive XR Lead',
    location: 'Dhaka R&D Hub',
    focus: 'Unity 3D, ARKit/ARCore WebAR commerce, VirtuED medical XR, and gamified enterprise LMS.',
    credentials: 'Shipped interactive medical AR curricula, WebAR retail try-ons, and high-concurrency brand experiences.',
    initials: 'SI',
  },
  {
    id: 'sharif_abir',
    name: 'Sharif Abir',
    role: 'Unreal Engine & Digital Twin Lead',
    location: 'Dhaka R&D Hub',
    focus: 'Unreal Engine 5 surgical & cleanroom VR, Apollo 360° twin, Puthia heritage twin, and 3D DOOH.',
    credentials: 'Directs photorealistic photogrammetry, real-time UE5 industrial twins, and reusable 3D asset pipelines.',
    initials: 'SA',
  },
];

export const CORPORATE_LINEAGE = [
  {
    era: 'Phase 01 · Foundation',
    entity: 'GenDev Engineering Studio',
    summary: 'Established the Dhaka full-stack software, game engineering, and enterprise automation delivery pod.',
  },
  {
    era: 'Phase 02 · Interactive & XR Expansion',
    entity: 'GxDx Solutions',
    summary: 'Scaled Unreal Engine 5 digital twins, GMP cleanroom VR, WebAR commerce, and regional enterprise BI across 100+ projects.',
  },
  {
    era: 'Phase 03 · Sovereign OS',
    entity: 'Spenta Technology (San Jose · Australia · Dhaka)',
    summary: 'Productized 13 composable on-premises AI, ERP, Voice, Fintech, and Spatial XR modules on a single L1–L6 Sovereign Kernel.',
  },
];

export const ADVISORY_NETWORK = [
  {
    track: 'Clinical & Medical XR Advisory',
    scope: 'Hospital workflow validation, VirtuED curriculum fidelity, and clinical safety sign-off.',
    pathways: 'HIPAA · HL7/FHIR · Clinical Simulation Ethics',
  },
  {
    track: 'Regulatory & Cross-Border Compliance',
    scope: 'Structured alignment for medical software, banking data residency, and AI auditability.',
    pathways: 'TGA (AU) · FDA SaMD Guidance · DGDA · BB ICT v4.0',
  },
  {
    track: '20-FTE Dhaka Engineering Network',
    scope: 'Full-stack AI/ML, UE5/Unity XR, Rust/Wasm IIoT, and 24/7 SecOps operating at $12.98/hr fully loaded.',
    pathways: 'ISO 27001 & SOC 2 Type II Readiness',
  },
];

export interface GlobalPeerComparable {
  company: string;
  vertical: string;
  traction: string;
  spentaAdvantage: string;
}

export const GLOBAL_PEER_COMPARABLES: GlobalPeerComparable[] = [
  {
    company: 'Strivr',
    vertical: 'Enterprise VR Workforce Training',
    traction: '$51M+ raised · Fortune 500 retail & logistics VR training benchmarks',
    spentaAdvantage: 'Spenta pairs VirtuTrain360 GMP VR (76.3% GM) with on-prem ERP + Document AI at 40%–60% lower build cost.',
  },
  {
    company: 'Operator XR',
    vertical: 'Tactical & High-Risk Spatial Rehearsal',
    traction: 'Portable on-prem VR simulation kits for regulated institutional buyers',
    spentaAdvantage: 'Air-gapped L2/L3 Server PC deployment extends spatial rehearsal directly into biopharma cleanrooms & hospitals.',
  },
  {
    company: 'Labster',
    vertical: 'Virtual Science & Clinical Labs',
    traction: '$147M+ raised · Proven 30%+ knowledge retention uplift in STEM & medical cohorts',
    spentaAdvantage: 'VirtuED adds Bangla/English AR anatomy + HL7/FHIR clinical ERP upsell inside hospital networks.',
  },
  {
    company: 'Synty / KitBash3D',
    vertical: 'Modular 3D Asset & World IP',
    traction: 'High-margin repeatable 3D pack catalogs monetized across UE5 & Unity ecosystems',
    spentaAdvantage: 'Every client twin (Apollo, Puthia, cleanrooms) compounds into 70%–88% royalty-grade Fab/UEFN asset libraries.',
  },
];

export interface CompetitiveEdgeRow {
  dimension: string;
  legacyVendors: string;
  publicCloudWrappers: string;
  spentaSovereignOs: string;
}

export const COMPETITIVE_EDGE_MATRIX: CompetitiveEdgeRow[] = [
  {
    dimension: 'Data Sovereignty & Compliance',
    legacyVendors: 'Fragmented on-prem silos with manual CSV exports and brittle patching.',
    publicCloudWrappers: 'Raw PII/PHI shipped to third-party APIs; fails HIPAA & BB ICT v4.0 audits.',
    spentaSovereignOs: '100% air-gapped on client Server PCs ($8.5K–$10.5K) with AMD SEV-SNP / Intel TDX TEEs.',
  },
  {
    dimension: 'AI Governance & Reliability',
    legacyVendors: 'Static rule engines unable to parse handwritten Bangla/EN documents or voice.',
    publicCloudWrappers: 'Opaque black-box prompts with unverified hallucination risk and no kill switch.',
    spentaSovereignOs: 'OPA Policy-as-Code with 0.88 Confidence HITL Gate ("Autopilot Suggests, Captain Signs").',
  },
  {
    dimension: 'Spatial XR + Enterprise Fusion',
    legacyVendors: 'Zero native 3D digital twin, VR training, or WebAR capabilities.',
    publicCloudWrappers: 'Text-only chat wrappers disconnected from physical operations and IIoT.',
    spentaSovereignOs: 'Dual Capability Engine uniting ERP/ICR/BI cashflow with 76.3% GM UE5/Unity XR twins.',
  },
  {
    dimension: 'Total Cost & Delivery Economics',
    legacyVendors: '12–24 month multi-million consulting lock-in ($120–$180/hr Western pods).',
    publicCloudWrappers: 'Unpredictable per-token cloud bills that compound steeply with usage.',
    spentaSovereignOs: '20-FTE Dhaka R&D hub ($12.98/hr fully loaded) delivers 40%–60% TCO savings with predictable fixed CapEx.',
  },
];

export interface CommercialTier {
  id: 'model-a' | 'model-b' | 'model-c';
  code: string;
  name: string;
  targetBuyer: string;
  pricingRange: string;
  cadence: string;
  deliverables: string[];
}

export const COMMERCIAL_TIERS: CommercialTier[] = [
  {
    id: 'model-a',
    code: 'Model A',
    name: 'Turnkey Sovereign Pilot',
    targetBuyer: 'Single hospital, bank department, or flagship retail brand',
    pricingRange: '$18K – $48.5K setup',
    cadence: '60–90 day fixed-scope build + optional quarterly SLA',
    deliverables: [
      '1–2 flagship modules (e.g., BankOCR, WebAR Try-On, or GenAI BI)',
      'Tier 3/4 on-prem Server PC sizing & air-gapped container installation',
      '0.88 OPA HITL governance calibration & operator sign-off playbook',
    ],
  },
  {
    id: 'model-b',
    code: 'Model B',
    name: 'Modular Enterprise Suite (SaaS + Retainer)',
    targetBuyer: 'Multi-site hospital groups, NBFIs, and regional conglomerates',
    pricingRange: '$45/bed/mo or $6.9K–$8.6K/qtr + build',
    cadence: 'Annual recurring license + 24/7 SecOps & model tuning retainer',
    deliverables: [
      '3–6 composed modules sharing PostgreSQL, Kafka, and L5 OPA Governance',
      'Multi-site HL7/FHIR, core banking ESB, or 65+ showroom MIS federation',
      'Quarterly VAPT hardening, dataset fine-tuning, and executive ROI reviews',
    ],
  },
  {
    id: 'model-c',
    code: 'Model C',
    name: 'Dedicated Dual-Shore Sovereign Pod & IP Co-Build',
    targetBuyer: 'Multinational biopharma, tier-1 banks & global OEMs (AU / US / EU)',
    pricingRange: '$14K – $28K/mo dedicated pod',
    cadence: 'Multi-quarter dedicated engineering + shared 3D/Dataset IP licensing',
    deliverables: [
      'Dedicated San Jose / AU architect + Dhaka AI, UE5 XR & SecOps engineers',
      'Custom VirtuTrain360 cleanroom twins, multilingual Voice AI, or IIoT edge',
      'Full source escrow, TEE enclave attestation, and global multi-region rollout',
    ],
  },
];

export const ENGAGEMENT_MODELS = [
  {
    id: 'pilot-sprint',
    label: 'Fixed-Scope Sovereign Pilot (60–90 Days)',
    summary: 'Bounded proof-of-value on client hardware with measurable accuracy and payback gates.',
  },
  {
    id: 'dedicated-pod',
    label: 'Dedicated Dual-Shore Engineering Pod',
    summary: 'Monthly multidisciplinary AI, ERP, and XR squad orchestrated from AU/US with Dhaka delivery.',
  },
  {
    id: 'modular-saas-retainer',
    label: 'Modular License + 24/7 Managed SLA',
    summary: 'Per-bed clinical SaaS or enterprise runtime license paired with quarterly Cyber & AI Ops.',
  },
  {
    id: 'ip-co-development',
    label: 'Enterprise 3D / Dataset IP Co-Development',
    summary: 'Joint vertical productization with sovereign IP ownership and shared marketplace royalties.',
  },
] as const;

export const ONBOARDING_PATHS = [
  {
    id: 'path-diagnostic',
    step: 'Path 01',
    name: '2-Week Architecture & Pre-Trust Diagnostic',
    duration: '14 Days',
    outcome: 'Data residency audit, Server PC BOM, OPA 0.88 boundary map, and signed 3-year ROI case.',
  },
  {
    id: 'path-pilot',
    step: 'Path 02',
    name: '60-Day On-Prem Pilot & Shadow Validation',
    duration: '60 Days',
    outcome: 'Live deployment inside client firewall running side-by-side with human reviewers before cutover.',
  },
  {
    id: 'path-scale',
    step: 'Path 03',
    name: 'Multi-Site Production Rollout & 24/7 SLA',
    duration: '90–180 Days',
    outcome: 'Enterprise-wide federation across branches, wards, or stations with continuous VAPT monitoring.',
  },
] as const;

export interface InvestorGlossaryItem {
  term: string;
  definition: string;
}

export const INVESTOR_GLOSSARY: InvestorGlossaryItem[] = [
  {
    term: 'OPA 0.88 HITL Gate',
    definition:
      'Open Policy Agent rule engine that automatically pauses any AI extraction, SQL query, or workflow action scoring below 0.88 confidence and routes it to a verified human officer.',
  },
  {
    term: 'Post-Money SAFE ($4.5M Cap)',
    definition:
      'Simple Agreement for Future Equity where $500K invested at a $4.5M post-money cap represents 11.11% pre-Series A ownership (with 20% discount protection on priced conversion).',
  },
  {
    term: 'Dual Capability Engine',
    definition:
      'Spenta’s two-hemisphere revenue structure: recurring Operations Engine (ERP, ICR, Fintech, Cyber SLA) paired with high-margin Experience Engine (76.3% GM Spatial XR & 3D IP).',
  },
  {
    term: 'Hardware TEE (AMD SEV-SNP / Intel TDX)',
    definition:
      'Trusted Execution Environments encrypting active AI model weights and customer PII in hardware RAM so even compromised host operating systems cannot inspect data.',
  },
  {
    term: 'Activity-Based Scope 3 Telemetry',
    definition:
      'Measuring real operational carbon emissions directly from edge hardware (watt-hours per inference, EV battery swap telemetry) rather than crude spend-based averages.',
  },
  {
    term: 'Capital Efficiency vs. SAFE Exit ROI',
    definition:
      'Capital efficiency ($3.189M 5-yr cum. net profit / $500K raised = 6.38×) measures operational cash generation separately from equity exit ROI (4.16×–6.24× at 10×–15× Y5 EBITDA).',
  },
];

export const QA_CREDIBILITY_SHIELD = [
  {
    question: 'What Spenta will NOT overclaim',
    answer:
      'We do not claim autonomous unsupervised medical diagnosis, zero-error OCR without human review, or inflated 10× overnight ARR multipliers. Every clinical and financial workflow enforces a deterministic 0.88 human sign-off boundary, and our investor model uses a disciplined 25%–35% ROI confidence band.',
  },
  {
    question: 'Why won’t hyperscalers or big SI firms crush your margins?',
    answer:
      'Hyperscalers optimize for cloud token consumption, which regulated banks and hospitals in SAARC/MENA/ANZ cannot adopt for raw PII/PHI. Western SIs bill $120–$180/hr, whereas our 20-FTE Dhaka enclave runs at $12.98/hr fully loaded—letting us underprice by 40%–60% while keeping 55%–60% consolidated target GM.',
  },
  {
    question: 'How is the 5-year plan de-risked in Year 1?',
    answer:
      'Year 1 ($672K revenue, $82K EBITDA) relies on proven repeatable modules and captive sister-entity rollouts (BEST 65+ showrooms, X Ltd 80 BaaS stations) plus existing client relationships (Prime Bank, Apollo JMI, LABAID, Samsung Biologics, Jotax Oy), rather than cold greenfield enterprise hunting.',
  },
  {
    question: 'Why both Spatial XR and Enterprise AI/ERP?',
    answer:
      'Spatial XR (76.3% GM) opens C-suite doors at global enterprises like Samsung Biologics and Apollo while generating reusable 3D IP; Operations modules (Healthcare ERP, ICR, Cyber SLA) lock in multi-year recurring cashflow on the exact same L1–L6 kernel.',
  },
];

export interface DataRoomDocument {
  id: string;
  title: string;
  category: string;
  format: string;
  description: string;
  href: string;
  downloadName: string;
}

/**
 * Verified downloadable investor & partner materials (GenDev template PDF intentionally excluded).
 */
export const DATA_ROOM_DOCUMENTS: DataRoomDocument[] = [
  {
    id: 'doc_master_deck',
    title: 'Spenta Master Investor Deck (2026)',
    category: 'Investor Relations',
    format: 'TXT / Slide Script',
    description:
      '24-slide institutional narrative covering thesis, 6-gate GTM funnel, Q4 2026–Q2 2027 evidence-gated milestones, and Q&A credibility shield.',
    href: '/assets/aistudio/Spenta_Master_Investor_Deck_2026__2__b26511f5',
    downloadName: 'Spenta-Master-Investor-Deck-2026.txt',
  },
  {
    id: 'doc_consolidated_deck',
    title: 'Spenta Consolidated Investor Deck (2026)',
    category: 'Executive Overview',
    format: 'TXT / Deck Outline',
    description:
      '26-slide executive synthesis featuring the 4-Step Sovereign Pipeline (Sense → Reason → Deploy → Act), governance matrix, and investor glossary.',
    href: '/assets/aistudio/Spenta_Consolidated_Investor_Deck_2026_42d31f78',
    downloadName: 'Spenta-Consolidated-Investor-Deck-2026.txt',
  },
  {
    id: 'doc_tech_pitch',
    title: 'Spenta Technical & Product Proof Deck',
    category: 'CTO Diligence',
    format: 'TXT / Architecture',
    description:
      '13-slide technical brief detailing PrimeOCR 1.2M+ docs, Plant Care AR 1.4M images, Medical VR LMS (n=240, +30% recall), and Model A/B/C tiers.',
    href: '/assets/aistudio/Spenta_Tech_Pitch_Deck_2026__1__209b88e4',
    downloadName: 'Spenta-Technical-Pitch-Deck-2026.txt',
  },
  {
    id: 'doc_ai_safety',
    title: 'Enterprise AI Safety, Governance & Climate Doctrine',
    category: 'Risk & ESG',
    format: 'TXT / Doctrine',
    description:
      'Analysis of the Capability-Clarity Paradox (95% pilot failure), Pre-Trust Capital Audit, Specification Gaming guardrails, and Scope 3 climate telemetry.',
    href: '/assets/aistudio/Presentation_Slide_Ideas_Analysis_dc9f1544',
    downloadName: 'Spenta-AI-Safety-and-Climate-Doctrine-2026.txt',
  },
  {
    id: 'doc_services_portfolio',
    title: 'Digital Transformation & Partner Services Portfolio',
    category: 'Commercial Brochure',
    format: 'PDF',
    description:
      'Enterprise partner portfolio summarizing engagement models, industry verticals, and structured 3-path onboarding playbooks.',
    href: '/assets/aistudio/Digital-Transformation-Partner-Services-Portfolios_5ca15d90.pdf',
    downloadName: 'Spenta-Digital-Transformation-Services-Portfolio.pdf',
  },
];

// ============================================================================
// AI SAFETY & PRE-TRUST GOVERNANCE WORKBENCH DATA (SpentaCoreView)
// ============================================================================

export interface AutopilotCaptainMapping {
  id: string;
  domain: string;
  appIds: string[];
  autopilotSuggests: string;
  captainSigns: string;
  opaGate: string;
  unconstrainedRiskMitigated: string;
}

export const AUTOPILOT_CAPTAIN_MATRIX: AutopilotCaptainMapping[] = [
  {
    id: 'ac_banking',
    domain: 'Banking KYC & Loan Underwriting',
    appIds: ['icr_ops', 'fintech_rails'],
    autopilotSuggests:
      'Extracts 14+ bilingual fields via LLaMA 3.2 Vision + LayoutLMv3, flags PEP fuzzy matches, and drafts reconciliation entries in <30s.',
    captainSigns:
      'Compliance officer reviews any field <0.88 confidence inside React Digital Twin and signs final core banking ledger commit.',
    opaGate: 'opa.bfsi.icr_auto_commit_v4 (≥0.88)',
    unconstrainedRiskMitigated: 'Prevents silent KYC fabrication or unverified credit-limit auto-disbursement.',
  },
  {
    id: 'ac_clinical',
    domain: 'Clinical Care Ops & Rx Verification',
    appIds: ['healthcare_erp', 'voice_ai'],
    autopilotSuggests:
      'Synthesizes HL7/FHIR vitals, transcribes handwritten prescriptions, and drafts ward handover summaries and nurse rosters.',
    captainSigns:
      'Attending physician or charge nurse verifies dosage anomalies and executes clinical sign-off before EHR writeback.',
    opaGate: 'opa.clinical.hipaa_rx_guard (≥0.88)',
    unconstrainedRiskMitigated: 'Eliminates autonomous dosage hallucination and unverified triage escalation.',
  },
  {
    id: 'ac_bi',
    domain: 'Executive GenAI BI & Virtualized SQL',
    appIds: ['genai_bi', 'legacy_mod', 'mis_erp'],
    autopilotSuggests:
      'Translates natural-language financial questions into read-only SQL queries across 28+ virtualized relational tables.',
    captainSigns:
      'OPA sandbox blocks write operations and restricted PII joins; CFO/finance controller approves board export snapshots.',
    opaGate: 'opa.bi.readonly_sql_sandbox (Read-Only)',
    unconstrainedRiskMitigated: 'Blocks schema-drift hallucination, SQL injection, and cross-branch PII leakage.',
  },
  {
    id: 'ac_edge',
    domain: 'IIoT Edge & Battery Swap Safety',
    appIds: ['iot_edge', 'cyber_sla'],
    autopilotSuggests:
      'Quantized <50ms Wasm/MQTT edge model detects thermal drift on EV battery packs and isolates anomalous swap bays.',
    captainSigns:
      'Field operations engineer confirms physical pack inspection and unlocks bay dispatch via signed MFA workflow.',
    opaGate: 'opa.edge.baas_safety_lock (Deterministic)',
    unconstrainedRiskMitigated: 'Prevents reward-hacking uptime targets at the expense of thermal battery safety.',
  },
  {
    id: 'ac_spatial',
    domain: 'Cleanroom VR & Spatial Digital Twins',
    appIds: ['spatial_xr', 'branding_geo', 'workflow_ai'],
    autopilotSuggests:
      'Tracks operator SOP compliance inside VirtuTrain360 VR and scores anatomical procedure recall inside VirtuED AR.',
    captainSigns:
      'GMP Quality Assurance trainer or medical faculty reviews flagged sterile breaches before issuing operator certification.',
    opaGate: 'opa.xr.gmp_cert_attestation',
    unconstrainedRiskMitigated: 'Prevents gaming of virtual training completion without real SOP mastery.',
  },
];

export interface PreTrustAuditControl {
  id: string;
  pillar: 'Pillar 1 · Objective Clarity' | 'Pillar 2 · Boundary & Kill-Switch' | 'Pillar 3 · Specification Gaming Shield' | 'Pillar 4 · Sovereign Audit & ESG';
  title: string;
  unconstrainedVariable: string;
  controlMechanism: string;
  weight: number;
  defaultChecked: boolean;
}

export const PRE_TRUST_AUDIT_CONTROLS: PreTrustAuditControl[] = [
  {
    id: 'pt_1',
    pillar: 'Pillar 1 · Objective Clarity',
    title: 'Explicit Decision Contract Defined Before Model Deployment',
    unconstrainedVariable: 'Ambiguous KPIs causing the Capability-Clarity Paradox (95% pilot failure rate).',
    controlMechanism: 'Every deployed module maps exact input schema, acceptable error tolerance, and named human owner.',
    weight: 15,
    defaultChecked: true,
  },
  {
    id: 'pt_2',
    pillar: 'Pillar 1 · Objective Clarity',
    title: 'Bilingual / Domain Ground-Truth Benchmark Set Frozen',
    unconstrainedVariable: 'Unmeasured drift across handwritten Bangla/EN scripts or medical abbreviations.',
    controlMechanism: 'Golden validation set from Spenta 1.4M+ sample corpus evaluated prior to every weight update.',
    weight: 10,
    defaultChecked: true,
  },
  {
    id: 'pt_3',
    pillar: 'Pillar 2 · Boundary & Kill-Switch',
    title: 'OPA 0.88 Confidence HITL Gate Active on Ledger Writes',
    unconstrainedVariable: 'Silent autonomous commits from low-confidence probabilistic outputs.',
    controlMechanism: 'Deterministic L5 OPA policy intercepts outputs <0.88 and forces Captain Sign-Off.',
    weight: 15,
    defaultChecked: true,
  },
  {
    id: 'pt_4',
    pillar: 'Pillar 2 · Boundary & Kill-Switch',
    title: 'Air-Gapped Zero-Egress Firewall & Hardware TEE Enclave',
    unconstrainedVariable: 'Unauthorized shadow-AI exfiltration of customer PII/PHI to public endpoints.',
    controlMechanism: 'Local Server PC inference inside AMD SEV-SNP / Intel TDX encrypted RAM with outbound block.',
    weight: 15,
    defaultChecked: true,
  },
  {
    id: 'pt_5',
    pillar: 'Pillar 3 · Specification Gaming Shield',
    title: 'King Midas / Proxy-Metric Guardrails Enforced',
    unconstrainedVariable: 'Agents optimizing narrow speed or approval ratios while degrading compliance safety.',
    controlMechanism: 'Dual-objective OPA constraints penalize unverified fast-tracks and enforce random human audits.',
    weight: 15,
    defaultChecked: true,
  },
  {
    id: 'pt_6',
    pillar: 'Pillar 3 · Specification Gaming Shield',
    title: 'Read-Only SQL & Tool-Call Parameter Allowlisting',
    unconstrainedVariable: 'Prompt-injected agents executing destructive ERP mutations or unauthorized table scans.',
    controlMechanism: 'Strict schema-bound read-only sandboxes with row-level RBAC enforced outside the LLM.',
    weight: 10,
    defaultChecked: true,
  },
  {
    id: 'pt_7',
    pillar: 'Pillar 4 · Sovereign Audit & ESG',
    title: 'Immutable Kafka Decision Lineage (Input + Weights + Reviewer)',
    unconstrainedVariable: 'Unexplainable AI decisions failing HIPAA, SOC 2, or BB ICT v4.0 forensic audits.',
    controlMechanism: 'Cryptographic log captures input hash, model version, confidence score, and human reviewer ID.',
    weight: 10,
    defaultChecked: true,
  },
  {
    id: 'pt_8',
    pillar: 'Pillar 4 · Sovereign Audit & ESG',
    title: 'Activity-Based Scope 3 Energy & Compute Telemetry Logged',
    unconstrainedVariable: 'Unmeasured datacenter carbon footprint from oversized cloud foundation models.',
    controlMechanism: 'Quantized INT4/FP8 on-prem inference logs real watt-hours per task for verifiable ESG reporting.',
    weight: 10,
    defaultChecked: false,
  },
];

export const SCOPE3_TELEMETRY_COMPARISON = [
  {
    metric: 'Inference Energy per 10K Documents',
    spendBasedCloud: '~18.4 kWh (Estimated hyperscaler GPU cluster + network transit)',
    spentaActivityBased: '2.9 kWh (Measured on-prem Tier 3 quantized LLaMA 3.2 Vision + LayoutLMv3)',
    delta: '−84% Compute Carbon',
  },
  {
    metric: 'ESG Reporting Methodology',
    spendBasedCloud: 'Spend-based averages (±40% estimation error, non-auditable)',
    spentaActivityBased: 'Activity-based telemetry from MQTT/edge meters & Server PC power sensors',
    delta: 'Audit-Ready Scope 3',
  },
  {
    metric: 'EV Fleet & BaaS Grid Optimization',
    spendBasedCloud: 'Manual batch spreadsheets lagging operational peaks by weeks',
    spentaActivityBased: '<50ms quantized edge scheduling across 80 BaaS stations & 480 EVs',
    delta: 'Real-Time Carbon Ledger',
  },
];

// ============================================================================
// MULTI-TRACK PITCH DECK DEFINITIONS (Investor Master + Module B + Module C)
// ============================================================================

export type PitchDeckTrackId = 'investor-master' | 'cto-technical' | 'ai-safety-climate';

export interface PitchDeckTrackMeta {
  id: PitchDeckTrackId;
  label: string;
  shortLabel: string;
  subtitle: string;
  filenameSlug: string;
}

export const PITCH_DECK_TRACKS: PitchDeckTrackMeta[] = [
  {
    id: 'investor-master',
    label: 'Investor Master (23 Slides)',
    shortLabel: 'Investor Master',
    subtitle: 'Full institutional narrative · Canonical 45/30/15/10 Use of Funds · $500K SAFE ($4.5M Cap)',
    filenameSlug: 'Investor-Master-23-Slides',
  },
  {
    id: 'cto-technical',
    label: 'CTO / Technical (Module B · 8 Slides)',
    shortLabel: 'CTO / Technical',
    subtitle: '4-Step Sovereign Pipeline, PrimeOCR 1.2M+ docs, Plant Care AR, Medical VR LMS & Model A/B/C tiers',
    filenameSlug: 'CTO-Technical-Module-B-8-Slides',
  },
  {
    id: 'ai-safety-climate',
    label: 'AI Safety & Climate (Module C · 6 Slides)',
    shortLabel: 'AI Safety & Climate',
    subtitle: 'Capability-Clarity Paradox, Pre-Trust Capital Audit, Captain Sign-Off & Scope 3 Telemetry',
    filenameSlug: 'AI-Safety-Climate-Module-C-6-Slides',
  },
];

/**
 * 5 additional slides appended to Investor Master (inserted cleanly before The Ask / re-numbered in PitchDeckView).
 */
export const INVESTOR_MASTER_ADDITIONAL_SLIDES: PitchSlide[] = [
  {
    num: 19,
    section: 'Leadership',
    title: 'Core Leadership, Regulatory Advisors & Corporate Lineage',
    subtitle: 'Proven execution spanning GenDev → GxDx Solutions → Spenta Technology across AU, US & Dhaka',
    theme: 'light',
    kpis: [
      { label: 'Core Leaders', value: '4 Executives', accent: 'emerald' },
      { label: 'Dhaka R&D Hub', value: '20 FTEs', accent: 'teal' },
      { label: 'Delivered Projects', value: '100+ Shipped', accent: 'amber' },
    ],
    bullets: [
      'Marium Maam (Managing Director) — Corporate governance, ANZ partner network, and cross-border commercial structure.',
      'Farhan Sabit (Software Architect & Tech Lead) — L1–L6 Sovereign Fusion Stack, Rust/Wasm edge, ESB/CBS rails & OPA gates.',
      'Swapon Islam (Game Dev & XR Lead) — Unity 3D, ARKit/ARCore WebAR commerce, VirtuED Medical AR & gamified LMS.',
      'Sharif Abir (Unreal Engine & Digital Twin Lead) — UE5 cleanroom VR, Apollo 360° twin, Puthia heritage twin & 3D DOOH.',
      'Backed by Clinical & TGA/FDA/DGDA regulatory advisors plus 20-FTE Dhaka engineering enclave ($12.98/hr fully loaded).',
    ],
    callout: {
      label: 'Corporate Lineage',
      text: 'GenDev Engineering Studio → GxDx Solutions (100+ projects, 9+ global brands) → Spenta Technology Sovereign OS.',
    },
    speakerNotes:
      'Highlight continuity: this is not a first-time team assembling from scratch. Leadership has already shipped enterprise systems across Samsung Biologics, Prime Bank, Apollo JMI, LABAID, and Jotax Oy.',
  },
  {
    num: 20,
    section: 'Comparables',
    title: 'Validated Global Peer Comparables & Competitive Edge',
    subtitle: 'Benchmarking Spenta’s Dual Capability Engine against category-defining Spatial XR and AI peers',
    theme: 'dark',
    kpis: [
      { label: 'Strivr Benchmark', value: '$51M+ Raised', accent: 'teal' },
      { label: 'Labster Benchmark', value: '$147M+ Raised', accent: 'emerald' },
      { label: 'Spenta Cost Edge', value: '40%–60% Lower', accent: 'amber' },
    ],
    bullets: [
      'Strivr & Operator XR proved Fortune 500 willingness to pay for VR training; Spenta adds on-prem ERP & Document AI on the same kernel.',
      'Labster proved +30% clinical/STEM retention in virtual labs; Spenta’s VirtuED pairs Medical AR with $45/bed/mo Hospital ERP.',
      'Synty / KitBash3D validated high-margin 3D asset packs; Spenta monetizes client twin geometry at 70%–88% royalty margins.',
      '4-Axis Sovereign Moat: Zero cloud PII egress + 0.88 OPA governance + 76.3% GM XR + $12.98/hr Dhaka engineering economics.',
    ],
    speakerNotes:
      'Use global comparables to anchor valuation discipline: category peers raised $50M–$150M+ for single-pillar XR alone, while Spenta enters at a $4.5M post-money SAFE cap with dual-engine revenue.',
  },
  {
    num: 21,
    section: 'GTM Funnel',
    title: '6-Gate Enterprise Go-To-Market & Land-and-Expand Funnel',
    subtitle: 'Disciplined evidence-gated conversion from 14-day architectural diagnostic to multi-site ARR',
    theme: 'light',
    kpis: [
      { label: 'Gate 1–2', value: '14-Day Audit', accent: 'teal' },
      { label: 'Gate 3–4', value: '60-Day Pilot', accent: 'emerald' },
      { label: 'Gate 5–6', value: 'Multi-Site ARR', accent: 'amber' },
    ],
    bullets: [
      'Gate 1 (Trigger): Regulatory or operational pain—BB ICT v4.0 banking audit, HIPAA EHR upgrade, or GMP training bottleneck.',
      'Gate 2 (Pre-Trust Diagnostic): 14-day hardware sizing, OPA 0.88 boundary design, and signed 25%–35% ROI business case.',
      'Gate 3–4 (Model A Pilot → Shadow Validation): 60-day on-prem deployment running side-by-side with human officers.',
      'Gate 5–6 (Model B/C Expansion): Cross-sell additional composable modules + quarterly 24/7 Cyber SLA and multi-branch rollout.',
    ],
    callout: {
      label: 'Commercial Packaging',
      text: 'Model A Turnkey Pilot ($18K–$48.5K) → Model B Modular SaaS & SLA ($45/bed/mo + $6.9K–$8.6K/qtr) → Model C Dedicated Pod ($14K–$28K/mo).',
    },
    speakerNotes:
      'Emphasize that every stage is gated by measurable client sign-off—eliminating stalled proofs-of-concept and protecting gross margin.',
  },
  {
    num: 22,
    section: 'Milestones',
    title: 'Q4 2026 – Q2 2027 Evidence-Gated Execution Roadmap',
    subtitle: 'Concrete operational checkpoints tied directly to capital deployment and 100%-confidence ROI discipline',
    theme: 'dark',
    kpis: [
      { label: 'Target MRR (12 Mo)', value: '$60K MRR', accent: 'emerald' },
      { label: 'Anchor Sites', value: '6–8 Accounts', accent: 'teal' },
      { label: 'Disciplined ROI Band', value: '25%–35% / yr', accent: 'amber' },
    ],
    bullets: [
      'Q4 2026: Package zero-friction on-prem installers for Healthcare ERP, BankOCR, and Voice AI; complete captive BEST/X Ltd Phase 1 telemetry.',
      'Q1 2027: Close 3–4 hospital and BFSI anchor deployments across SAARC & Australia; launch VirtuTrain360 & Fab/UEFN 3D IP catalog.',
      'Q2 2027: Hit $60K MRR run-rate with ≥55% blended GM on recurring cohorts; finalize SOC 2 Type II & ISO 27001 formal audit readiness.',
      'Disciplined 100%-Confidence Growth Policy: Financial targets cap ROI assumptions at 25%–35% annualized over 3–5 years—backed by live deployments and low-burn Dhaka operations.',
    ],
    speakerNotes:
      'Reiterate the user-mandated financial discipline: we deliberately under-promise on speculative multiples so every investor milestone carries 100% operational confidence.',
  },
  {
    num: 23,
    section: 'Credibility',
    title: 'Q&A Credibility Shield & Investor Glossary',
    subtitle: 'Transparent boundaries on what Spenta guarantees—and what we will never overclaim',
    theme: 'light',
    bullets: [
      'What We Will Not Overclaim: Zero unsupervised autonomous clinical diagnosis, zero 100%-unreviewed OCR promises, and zero speculative 1.75× revenue inflation.',
      'Human-in-the-Loop Guarantee: Every regulated write enforces L5 OPA 0.88 gating ("Autopilot Suggests, Captain Signs") with immutable Kafka audit trails.',
      'Clean Metric Separation: Operating Capital Efficiency (6.38× = $3.189M cum. net profit / $500K SAFE) is always reported separately from Equity Exit ROI (4.16×–6.24× at 10×–15× Y5 EBITDA).',
      'Natural FX & Margin Shield: USD/AUD/EUR enterprise billing hedges BDT engineering costs ($12.98/hr fully loaded) across 115–130 FX stress scenarios.',
    ],
    callout: {
      label: 'Due Diligence Ready',
      text: 'Live ROI Calculator, 5-Year CSV Export, 3D Neural Core & Downloadable Data Room available interactively in this portal.',
    },
    speakerNotes:
      'Close Q&A from a position of radical transparency—institutional investors reward founders who define technical boundaries clearly.',
  },
];

export const CTO_TECHNICAL_SLIDES: PitchSlide[] = [
  {
    num: 1,
    section: 'Module B · Cover',
    title: 'CTO / Technical Architecture Brief — Spenta Sovereign OS',
    subtitle: '4-Step Sovereign Pipeline (Sense → Reason → Deploy → Act) Engineered for Regulated Production',
    theme: 'dark',
    kpis: [
      { label: 'Core Kernel', value: 'L1–L6 Stack', accent: 'emerald' },
      { label: 'Edge Latency', value: '<50ms Wasm', accent: 'teal' },
      { label: 'Cloud PII Egress', value: '0 Bytes', accent: 'amber' },
    ],
    bullets: [
      'Sense: Air-gapped ingestion across scanned Bangla/EN forms, HL7/FHIR streams, MQTT EV telemetry, and spatial LiDAR scans.',
      'Reason: Self-hosted LLaMA 3.2 Vision, LayoutLMv3, Whisper STT, and quantized INT4/FP8 models inside AMD SEV-SNP / Intel TDX enclaves.',
      'Deploy: Zero-egress Docker/K3s bundles sized for $3.2K–$15.3K on-prem Server PCs or Private VPC.',
      'Act: Deterministic L5 OPA 0.88 HITL Gate orchestrating ERP/CBS ledger writes, digital twin updates, and human escalations.',
    ],
    speakerNotes:
      'Designed for CTOs and Principal Architects evaluating security, deployment ergonomics, and production benchmarks.',
  },
  {
    num: 2,
    section: 'Production Proof',
    title: 'Prime Bank OCR & Regional BFSI Document Intelligence',
    subtitle: '1.2M+ production documents processed inside bank firewalls under BB ICT v4.0',
    theme: 'light',
    kpis: [
      { label: 'Processed Volume', value: '1.2M+ Docs', accent: 'emerald' },
      { label: 'Extraction Speed', value: '<30s / Form', accent: 'teal' },
      { label: 'HITL OPA Gate', value: '0.88 Floor', accent: 'amber' },
    ],
    bullets: [
      'Multi-model ensemble combines LayoutLMv3 structural parsing, Tesseract Bangla OCR, and LLaMA 3.2 Vision reasoning.',
      'React Digital Twin UI highlights low-confidence bounding boxes (<0.88) side-by-side with source scans for maker-checker sign-off.',
      'Direct ESB/CBS ledger integration eliminates manual re-keying while logging input hashes, model weights, and reviewer IDs.',
    ],
    speakerNotes:
      'Walk technical evaluators through the fallback chain: deterministic schema validation runs after VLM extraction so malformed numbers never hit core banking.',
  },
  {
    num: 3,
    section: 'Computer Vision',
    title: 'Plant Care AR & Sovereign Regional Vision Datasets',
    subtitle: '1.4M+ curated images spanning 38 agricultural & clinical classification classes',
    theme: 'dark',
    kpis: [
      { label: 'Curated Corpus', value: '1.4M+ Images', accent: 'emerald' },
      { label: 'Taxonomy Scope', value: '38 Classes', accent: 'teal' },
      { label: 'Dataset Line GM', value: '65.1% GM', accent: 'amber' },
    ],
    bullets: [
      'On-device quantized vision models run offline on mid-tier Android smartphones for field agronomists and clinicians.',
      'Proprietary South Asian annotation pipelines cover Bangla/Banglish scripts, handwritten Rx notes, and regional crop pathology.',
      'Strict PII-stripping and provenance governance make dataset packs license-ready for enterprise RAG and fine-tuning.',
    ],
    speakerNotes:
      'Data moats beat prompt wrappers. Highlight how our 1.4M+ image and voice corpora improve accuracy where generic Western foundation models fail.',
  },
  {
    num: 4,
    section: 'Enterprise Ops',
    title: 'Legal Review, Logistics Telemetry & Industrial AI Proofs',
    subtitle: 'Measurable operational compression across regulated legal, fleet, and manufacturing workflows',
    theme: 'light',
    kpis: [
      { label: 'Law Firm Review', value: '−65% Time', accent: 'emerald' },
      { label: 'Logistics On-Time', value: '+25% Lift', accent: 'teal' },
      { label: 'Fleet Fuel Burn', value: '−18% Cost', accent: 'amber' },
    ],
    bullets: [
      'Regional Law Firm RAG: Air-gapped clause extraction and precedent verification cutting contract review cycles by 65%.',
      'National Logistics & X Ltd Mobility: Real-time route & battery-swap dispatch improving on-time delivery +25% and reducing fuel spend −18%.',
      'Industrial Manufacturing: Predictive MQTT anomaly detection on quantized <50ms gateways preventing unplanned line stoppages.',
    ],
    speakerNotes:
      'Point out that all three verticals reuse the exact same L1–L5 ingestion, Corrective RAG, and OPA governance primitives.',
  },
  {
    num: 5,
    section: 'Spatial & XR',
    title: 'Medical VR LMS, Cleanroom Twins & Heritage Photogrammetry',
    subtitle: 'Validated learning uplift (n=240, +30% recall) and photorealistic UE5/Unity production assets',
    theme: 'dark',
    kpis: [
      { label: 'Medical VR Cohort', value: 'n=240 · +30%', accent: 'emerald' },
      { label: 'Frame Target', value: '60–90 FPS', accent: 'teal' },
      { label: 'XR Line GM', value: '76.3% GM', accent: 'amber' },
    ],
    bullets: [
      'Medical VR LMS & VirtuED AR: Controlled n=240 learner cohort achieved +30% clinical recall versus static textbook protocols.',
      'Samsung Biologics VirtuTrain360 & Apollo 360° Twin: Interactive sterile cleanroom and hospital facility navigation linked to live SOPs.',
      'bKashVerse, Puthia Rajbari & Old Central Jail: Drone photogrammetry, LiDAR meshing, and WebGL/UE5 pixel streaming.',
    ],
    speakerNotes:
      'Remind technical leads that XR scenes bind directly into L5 Kafka telemetry—making digital twins operational control rooms, not static videos.',
  },
  {
    num: 6,
    section: 'Hardware & TEE',
    title: '4-Tier Sovereign Server PC & Confidential Compute Blueprints',
    subtitle: 'Predictable one-time hardware CapEx replacing unbounded cloud GPU API bills',
    theme: 'light',
    kpis: [
      { label: 'Tier 4 Edge', value: '$3.2K–$4.2K', accent: 'teal' },
      { label: 'Tier 3 Baseline', value: '$8.5K–$10.5K', accent: 'emerald' },
      { label: 'Tier 1 M3 Ultra', value: '$14.1K–$15.3K', accent: 'amber' },
    ],
    bullets: [
      'Tier 3 Spenta Budget Baseline ($8.5K–$10.5K): 4× refurbished RTX 3090 (96GB VRAM), 256GB DDR5, 10TB NVMe + 50TB HDD.',
      'Tier 1 Real-Time 300B ($14.1K–$15.3K): Mac Studio M3 Ultra 512GB Unified RAM delivering 18–35+ tok/s locally.',
      'Confidential Computing: AMD SEV-SNP & Intel TDX encrypt model weights and inference buffers in hardware memory.',
    ],
    speakerNotes:
      'CTOs love the hardware transparency—clients can procure hardware directly via their own IT vendors using Spenta’s verified BOM.',
  },
  {
    num: 7,
    section: 'Delivery Tiers',
    title: 'Model A / B / C Technical Packaging & Onboarding Paths',
    subtitle: 'Modular engagement tiers aligned to enterprise security review and IT procurement cycles',
    theme: 'dark',
    bullets: [
      'Model A — Turnkey Sovereign Pilot ($18K–$48.5K): 60–90 day fixed deployment of 1–2 apps on client hardware with OPA 0.88 validation.',
      'Model B — Modular Enterprise Suite ($45/bed/mo or $6.9K–$8.6K/qtr): Multi-site ERP/BI/ICR federation plus 24/7 SecOps & VAPT SLA.',
      'Model C — Dedicated Dual-Shore Pod ($14K–$28K/mo): Embedded AU/US architect + Dhaka AI/XR squad for custom IP co-development.',
      '3-Path Onboarding: 14-Day Pre-Trust Diagnostic → 60-Day Shadow Pilot → 90–180 Day Multi-Site Cutover.',
    ],
    callout: {
      label: 'Zero Vendor Lock-In',
      text: 'Standard PostgreSQL, Kafka, OpenXR, and OPA Rego policies ensure full client data portability and source escrow options.',
    },
    speakerNotes:
      'Highlight zero proprietary lock-in: every component runs on open standards so enterprise security teams sign off faster.',
  },
  {
    num: 8,
    section: 'Architecture Summary',
    title: 'Security Attestation, CI/CD & 24/7 Managed SecOps SLA',
    subtitle: 'Continuous compliance across HIPAA, SOC 2 Type II, ISO 27001 & Bangladesh Bank ICT v4.0',
    theme: 'light',
    bullets: [
      'Signed Container Supply Chain: Offline air-gapped image bundles with SBOM attestation and zero external telemetry phone-home.',
      'Immutable Audit Ledger: Every inference logs SHA-256 input digest, weight revision, OPA rule decision, and human approver.',
      '24/7 Dhaka SecOps Pod ($8.6K/qtr): Automated SIEM alerting, quarterly VAPT penetration testing, and zero-downtime weight rollbacks.',
    ],
    callout: {
      label: 'Next Step for CTOs',
      text: 'Configure your target L1–L6 stack in App Vault or run the Pre-Trust Capital Audit inside Spenta Core.',
    },
    speakerNotes:
      'Invite the CTO to test the live OPA 0.88 HITL simulator and Pre-Trust Governance Workbench directly inside Spenta Core.',
  },
];

export const AI_SAFETY_CLIMATE_SLIDES: PitchSlide[] = [
  {
    num: 1,
    section: 'Module C · Thesis',
    title: 'The Capability-Clarity Paradox in Enterprise AI',
    subtitle: 'Why 95% of enterprise AI pilots stall and 56% deliver zero measurable financial value',
    theme: 'dark',
    kpis: [
      { label: 'Pilot Failure Rate', value: '95% Stall', accent: 'crimson' },
      { label: 'Zero Value Capture', value: '56% Pilots', accent: 'amber' },
      { label: 'Root Cause', value: 'Clarity Gap', accent: 'emerald' },
    ],
    bullets: [
      'Enterprises treat AI as a raw capability upgrade while leaving decision contracts, escalation boundaries, and edge-case rules undefined.',
      'When probabilistic models meet ambiguous business objectives, pilots fail security sign-off or silently erode operational trust.',
      'Spenta reverses the sequence: engineer Clarity, OPA policy boundaries, and human ownership BEFORE scaling autonomous execution.',
    ],
    speakerNotes:
      'Frame AI Safety not as academic philosophy, but as the #1 commercial reason enterprise AI budgets succeed or fail.',
  },
  {
    num: 2,
    section: 'Risk Mechanics',
    title: 'King Midas Problem & Specification Gaming in Production',
    subtitle: 'How unconstrained proxy metrics turn capable AI agents into balance-sheet liabilities',
    theme: 'light',
    bullets: [
      'Specification Gaming: An agent rewarded solely on "ticket closure speed" or "loan throughput" learns to bypass ambiguous edge cases.',
      'Unconstrained Variables: Leaving compliance checks, dosage nuances, or thermal thresholds implicit invites catastrophic tail-risk failures.',
      'Spenta Mitigation: Every production agent runs inside an Unconstrained Variable Register enforced by deterministic L5 OPA Rego rules.',
    ],
    callout: {
      label: 'Engineering Principle',
      text: 'Never ask a probabilistic LLM to police its own safety boundary—enforce hard constraints outside the model in L5 OPA.',
    },
    speakerNotes:
      'Use concrete enterprise examples: a bank OCR agent that guesses a smudged digit to hit an SLA target is a King Midas failure.',
  },
  {
    num: 3,
    section: 'Governance Split',
    title: 'Autopilot Suggests, Captain Signs',
    subtitle: 'Operationalizing deterministic 0.88 HITL human sovereignty across every Spenta module',
    theme: 'dark',
    kpis: [
      { label: 'OPA Threshold', value: '≥ 0.88 Gate', accent: 'emerald' },
      { label: 'Audit Lineage', value: '100% Signed', accent: 'teal' },
      { label: 'Kill-Switch', value: 'Instant L5', accent: 'amber' },
    ],
    bullets: [
      'Autopilot (L3 Sovereign Neural Core): Performs high-speed OCR extraction, FHIR clinical synthesis, SQL drafting, and <50ms edge telemetry.',
      'Captain (Verified Human Officer): Reviews highlighted <0.88 exceptions, confirms clinical/financial intent, and holds final commit authority.',
      'Cryptographic Accountability: Every approved write binds model output + confidence score + human reviewer ID in an immutable Kafka ledger.',
    ],
    speakerNotes:
      'Regulators in banking (BB ICT v4.0) and healthcare (HIPAA/TGA/FDA) immediately grasp "Autopilot Suggests, Captain Signs".',
  },
  {
    num: 4,
    section: 'Pre-Trust Audit',
    title: 'The 4-Pillar Pre-Trust Capital Audit',
    subtitle: 'Mandatory enterprise readiness gate before deploying capital or production AI permissions',
    theme: 'light',
    bullets: [
      'Pillar 1 — Objective Clarity: Signed decision contracts, golden bilingual test sets, and named executive accountability.',
      'Pillar 2 — Boundary & Kill-Switch: OPA 0.88 gating, air-gapped zero-egress firewalls, and AMD SEV-SNP / Intel TDX enclaves.',
      'Pillar 3 — Specification Gaming Shield: Proxy-metric guardrails, read-only SQL sandboxes, and randomized human audits.',
      'Pillar 4 — Sovereign Audit & ESG: Immutable Kafka decision traces paired with activity-based compute energy telemetry.',
    ],
    callout: {
      label: 'Interactive Assessment',
      text: 'Run the live 0–100 Pre-Trust Capital Audit checklist inside the Spenta Core Governance Workbench.',
    },
    speakerNotes:
      'Show investors and CIOs that Spenta packages AI governance as a concrete, auditable engineering checklist.',
  },
  {
    num: 5,
    section: 'Climate & ESG',
    title: 'Green AI & Activity-Based Scope 3 Climate Telemetry',
    subtitle: 'Replacing crude spend-based carbon estimates with real watt-hour & edge fleet telemetry',
    theme: 'dark',
    kpis: [
      { label: 'Compute Carbon Drop', value: '−84% Energy', accent: 'emerald' },
      { label: 'Edge Fleet Proof', value: '80 BaaS / 480 EVs', accent: 'teal' },
      { label: 'Reporting Grade', value: 'Scope 3 Audit', accent: 'amber' },
    ],
    bullets: [
      'Right-Sized Quantized Inference: Running INT4/FP8 specialist models on local Server PCs cuts document-AI energy ~84% vs oversized cloud clusters.',
      'Activity-Based Telemetry: Direct watt-hour metering on local GPU nodes and MQTT EV battery-swap stations eliminates ±40% spend-based guesswork.',
      'X Ltd Energy Proof: Real-time Green AI carbon planner orchestrates 80 battery-swapping stations and 480 EVs at <50ms edge latency.',
    ],
    speakerNotes:
      'Highlight the financial-climate alignment: quantized on-prem AI simultaneously slashes client TCO and cuts Scope 3 compute emissions.',
  },
  {
    num: 6,
    section: 'Outcome',
    title: 'Trust-First Sovereign AI Drives Durable 25%–35% ROI',
    subtitle: 'Eliminating pilot churn by shipping compliant, energy-efficient, human-governed systems from day one',
    theme: 'light',
    bullets: [
      'Faster Compliance Sign-Off: Pre-Trust Audit artifacts collapse banking and hospital infosec procurement cycles.',
      'Predictable Cash Conversion: Customers renew multi-year SaaS & Cyber SLAs when systems stay reliable, auditable, and cost-capped.',
      'Aligned Investor Discipline: Spenta models a 100%-confidence 25%–35% annualized ROI corridor backed by real deployments—not hype.',
    ],
    callout: {
      label: 'Sovereign Mandate',
      text: 'Capable AI + Mathematical Clarity + Human Sovereignty = Zero-Hype Enterprise Compounding.',
    },
    speakerNotes:
      'Tie Module C directly back to commercial durability: safety and energy efficiency are profit multipliers, not cost centers.',
  },
];
