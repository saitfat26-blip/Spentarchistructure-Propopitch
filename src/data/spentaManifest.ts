import spentaLogoAsset from '../assets/spenta-logo.svg';

export const SPENTA_LOGO_URL = spentaLogoAsset;

export const SPENTA_CONTACT_EMAIL = 'hello@spenta.tech';

export type NavTab =
  | 'App Vault'
  | 'Infographics'
  | 'Financials'
  | 'Spenta Core'
  | 'The Brain'
  | 'Pitch Deck'
  | 'Resources';

export const NAV_TABS: NavTab[] = [
  'App Vault',
  'Infographics',
  'Financials',
  'Spenta Core',
  'The Brain',
  'Pitch Deck',
  'Resources',
];

export type EngineType = 'operations' | 'experience' | 'fusion';
export type DeploymentMode = 'On-Prem' | 'Private VPC' | 'SaaS';
export type ServerTierId = 1 | 2 | 3 | 4;

export interface BrainHub {
  id: string;
  num: string;
  label: string;
  side: 'left' | 'right';
  y: number;
  accent: string;
  engineLabel: string;
  summary: string;
  keyLayers: string[];
}

export interface SpentaApp {
  id: string;
  shortName: string;
  name: string;
  hubId: string;
  category:
    | 'AI & Data Operations'
    | 'Enterprise Core & Modernization'
    | 'Vertical Industry Suites'
    | 'Voice, Spatial XR & Experience'
    | 'Sovereign Infra, Edge & Security'
    | 'Growth, MarTech & Data IP';
  engine: EngineType;
  tagline: string;
  coreCapabilities: string[];
  setupUsd: number;
  billingCadence?: 'one-time' | 'quarterly-retainer';
  setupLabel: string;
  recurringLabel: string;
  gmPct: number;
  minServerTier: ServerTierId;
  layers: ('L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6')[];
  depends: string[];
  integratesWith: string[];
  provides: string[];
  proofClient: string;
  deployment: DeploymentMode[];
}

export interface StarterRecipe {
  id: string;
  name: string;
  pattern: string;
  description: string;
  ids: string[];
}

export interface SovereignLayer {
  id: 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6';
  title: string;
  subtitle: string;
  summary: string;
  slaMetric: string;
  protocols: string[];
  apiContracts: string[];
  securityControls: string[];
  accent: string;
}

export interface ServerTierSpec {
  id: ServerTierId;
  code: string;
  name: string;
  modelScale: string;
  hardware: string;
  vramRam: string;
  storage: string;
  capex: string;
  capexMidUsd: number;
  speed: string;
  idealFor: string;
  note?: string;
}

export interface FinancialYear {
  year: string;
  label: string;
  conservativeRevK: number;
  conservativeBurnK: number;
  conservativeEbitdaK: number;
  conservativeNetProfitK: number;
  upsideRevK: number;
  upsideEbitdaK: number;
  upsideNetProfitK: number;
  milestone: string;
  upsideMilestone: string;
}

export interface BlueprintPillar {
  id: string;
  code: string;
  title: string;
  engine: EngineType;
  summary: string;
  metrics: string[];
  apps: string[];
  tags: string[];
}

export interface AgenticVertical {
  id: string;
  name: string;
  think: string;
  learn: string;
  solve: string;
  hitlTrigger: string;
  proof: string;
}

export interface HitlSampleEvent {
  id: string;
  appId: string;
  appName: string;
  clientPattern: string;
  documentType: string;
  payloadSummary: string;
  baseConfidence: number;
  policyRule: string;
  latencyMs: number;
}

export interface PitchSlide {
  num: number;
  section: string;
  title: string;
  subtitle: string;
  theme: 'dark' | 'light';
  kpis?: { label: string; value: string; accent?: 'emerald' | 'teal' | 'amber' | 'crimson' }[];
  bullets: string[];
  callout?: { label: string; text: string };
  speakerNotes: string;
}

export interface CaseStudy {
  id: string;
  client: string;
  sector:
    | 'Healthcare & Biopharma'
    | 'Banking & Fintech'
    | 'Enterprise Core & BI'
    | 'Retail & Commerce'
    | 'Energy & Mobility'
    | 'Heritage, Agri & Legal';
  region: string;
  solution: string;
  appIds: string[];
  headlineMetric: string;
  metrics: string[];
  summary: string;
  deployment: DeploymentMode;
}

export interface ComplianceBadge {
  id: string;
  code: string;
  name: string;
  scope: string;
  controls: string[];
  verifiedApps: string[];
}

export const BRAIN_HUBS: BrainHub[] = [
  {
    id: 'healthcare',
    num: '01',
    label: 'Healthcare & Bio',
    side: 'left',
    y: 115,
    accent: '#1EB56A',
    engineLabel: 'Operations Engine',
    summary: 'Clinical ERP, HL7/FHIR rostering, AI shift handover, Rx OCR & medical image readers.',
    keyLayers: ['L3', 'L5', 'L6'],
  },
  {
    id: 'fintech',
    num: '02',
    label: 'Banking & Fintech',
    side: 'left',
    y: 280,
    accent: '#0D9488',
    engineLabel: 'Operations Engine',
    summary: 'On-prem ICR (<30s/form), 0.88 HITL reconciliation, MFS rails & TEE-hardened wallets.',
    keyLayers: ['L2', 'L3', 'L5', 'L6'],
  },
  {
    id: 'enterprise',
    num: '03',
    label: 'Enterprise Core & BI',
    side: 'left',
    y: 470,
    accent: '#059669',
    engineLabel: 'Operations Engine',
    summary: 'Modular MIS/ERP, prompt-driven GenAI BI & legacy DB virtualization (28+ relations).',
    keyLayers: ['L3', 'L5', 'L6'],
  },
  {
    id: 'infra',
    num: '04',
    label: 'Security & Data IP',
    side: 'left',
    y: 655,
    accent: '#14B8A6',
    engineLabel: 'Operations Engine',
    summary: '24/7 cyber resilience, AMD SEV-SNP/TDX TEEs & 1.4M+ PII-stripped regional dataset packs.',
    keyLayers: ['L2', 'L3', 'L5'],
  },
  {
    id: 'xr',
    num: '05',
    label: 'Spatial XR & 3D IP',
    side: 'right',
    y: 115,
    accent: '#10B981',
    engineLabel: 'Experience Engine',
    summary: 'VirtuTrain360 VR, UE5/Unity Digital Twins w/ AI guides, VirtuED AR & Epic Fab 3D IP.',
    keyLayers: ['L3', 'L4', 'L6'],
  },
  {
    id: 'voice',
    num: '06',
    label: 'Voice & Assistants',
    side: 'right',
    y: 280,
    accent: '#0D9488',
    engineLabel: 'Fusion Engine',
    summary: 'Multilingual Bangla/Banglish/EN/HI/UR Voice AI & Corrective RAG 8-vertical agents.',
    keyLayers: ['L3', 'L5', 'L6'],
  },
  {
    id: 'retail',
    num: '07',
    label: 'Retail & BEST',
    side: 'right',
    y: 470,
    accent: '#E11D48',
    engineLabel: 'Experience Engine',
    summary: 'AI-Native SEO/GEO, WebAR try-on commerce, 3D DOOH & 365 Exchange circular CRM.',
    keyLayers: ['L4', 'L6'],
  },
  {
    id: 'energy',
    num: '08',
    label: 'IoT, Edge & X Ltd',
    side: 'right',
    y: 655,
    accent: '#F59E0B',
    engineLabel: 'Fusion Engine',
    summary: '<50ms quantized edge inference, Wasm/MQTT IIoT gateways & Green AI carbon planner.',
    keyLayers: ['L1', 'L2', 'L3', 'L5'],
  },
];

export const SPENTA_APPS: SpentaApp[] = [
  {
    id: 'healthcare_erp',
    shortName: 'AI Healthcare ERP',
    name: 'AI Healthcare ERP & Clinical AI',
    hubId: 'healthcare',
    category: 'Vertical Industry Suites',
    engine: 'operations',
    tagline: 'Care Ops, AI Shift Handover, Smart Rostering (HL7/FHIR), AI GP, Medical Image Reader & Rx OCR',
    coreCapabilities: [
      'HL7 / FHIR Clinical Core & Smart Rostering',
      'AI Shift Handover & AI GP Pre-Screening',
      'Medical Image Reader & Prescription Rx OCR',
      'DiagnosticCentre AI & Multi-Site Bed Analytics',
    ],
    setupUsd: 19800,
    setupLabel: '$19.8K setup',
    recurringLabel: '$45/bed/mo ARR ($48K/yr ~90-bed clinic · $81K/yr 150-bed hospital)',
    gmPct: 58.0,
    minServerTier: 3,
    layers: ['L3', 'L5', 'L6'],
    depends: ['cyber_sla'],
    integratesWith: ['icr_ops', 'voice_ai', 'spatial_xr', 'datasets'],
    provides: ['clinical_records', 'hl7_fhir_bus', 'shift_handover'],
    proofClient: 'Apollo JMI · LABAID',
    deployment: ['On-Prem', 'Private VPC', 'SaaS'],
  },
  {
    id: 'icr_ops',
    shortName: 'Document AI (ICR)',
    name: 'Document Intelligence (ICR) & Bulk Data Ops',
    hubId: 'fintech',
    category: 'AI & Data Operations',
    engine: 'operations',
    tagline: 'Self-hosted LLaMA 3.2 Vision + Tesseract + LayoutLMv3, React Digital Twin UI (<30s/form, 0.88 HITL gate)',
    coreCapabilities: [
      'Self-hosted LLaMA 3.2 Vision + Tesseract + LayoutLMv3',
      'React Digital Twin Verification UI (<30s/form)',
      '0.88 Confidence OPA HITL Circuit Breaker',
      'Bulk Deduplication & Core Ledger Reconciliation',
    ],
    setupUsd: 48500,
    setupLabel: '$48.5K build',
    recurringLabel: 'Per-page / Annual Sovereign SaaS',
    gmPct: 33.2,
    minServerTier: 2,
    layers: ['L3', 'L5', 'L6'],
    depends: ['cyber_sla'],
    integratesWith: ['fintech_rails', 'workflow_ai', 'genai_bi', 'healthcare_erp', 'datasets'],
    provides: ['verified_forms', 'hitl_audit_log', 'reconciled_batches'],
    proofClient: 'Bank (BankOCR)',
    deployment: ['On-Prem', 'Private VPC'],
  },
  {
    id: 'fintech_rails',
    shortName: 'Fintech & MFS Suite',
    name: 'Fintech Suite (Digital Wallet, Crypto-Wallet & MFS)',
    hubId: 'fintech',
    category: 'Vertical Industry Suites',
    engine: 'operations',
    tagline: 'Custodial/Non-Custodial Wallets, Mobile Financial Services (MFS) rails, KYC/AML & TEE hardening',
    coreCapabilities: [
      'Digital Wallets & Custodial/Non-Custodial Crypto',
      'High-Throughput MFS Rails & Merchant Settlement',
      'Automated KYC/AML Screening & Fraud Rules',
      'Hardware TEE Key Isolation (SEV-SNP / TDX)',
    ],
    setupUsd: 39800,
    setupLabel: '$39.8K build',
    recurringLabel: 'Enterprise License + 24/7 SLA',
    gmPct: 33.7,
    minServerTier: 3,
    layers: ['L2', 'L5', 'L6'],
    depends: ['cyber_sla'],
    integratesWith: ['icr_ops', 'genai_bi', 'voice_ai', 'workflow_ai'],
    provides: ['wallet_ledger', 'mfs_rails', 'kyc_aml_gate'],
    proofClient: 'bKash · LankaBangla',
    deployment: ['On-Prem', 'Private VPC'],
  },
  {
    id: 'mis_erp',
    shortName: 'Modular MIS & ERP',
    name: 'Management Information System (MIS) & SaaS Systems',
    hubId: 'enterprise',
    category: 'Enterprise Core & Modernization',
    engine: 'operations',
    tagline: 'Stock MIS, Asset Tracking, HRM/RBAC, Work Orders, Branch Maps & HelloKhata Voice',
    coreCapabilities: [
      'Multi-Branch Stock MIS & Asset Lifecycle Tracking',
      'Unified HRM, Payroll & Multi-Tenant RBAC',
      'Work Order Dispatch & Geospatial Branch Maps',
      'HelloKhata Voice Bookkeeping Integration',
    ],
    setupUsd: 20400,
    setupLabel: '$20.4K modular license',
    recurringLabel: 'Annual Modular SaaS / Site License',
    gmPct: 29.4,
    minServerTier: 4,
    layers: ['L5', 'L6'],
    depends: [],
    integratesWith: ['genai_bi', 'workflow_ai', 'iot_edge', 'legacy_mod', 'branding_geo', 'voice_ai'],
    provides: ['erp_entities', 'rbac_identity', 'branch_inventory'],
    proofClient: 'BEST (65+ Showrooms)',
    deployment: ['On-Prem', 'Private VPC', 'SaaS'],
  },
  {
    id: 'genai_bi',
    shortName: 'Conversational GenAI BI',
    name: 'BI Dashboard w/ Conversational GenAI',
    hubId: 'enterprise',
    category: 'AI & Data Operations',
    engine: 'operations',
    tagline: 'Prompt-driven on-the-fly ERP/MIS insights over PostgreSQL/Kafka + Power BI/React',
    coreCapabilities: [
      'Natural-Language-to-SQL over PostgreSQL & Kafka',
      'Live Executive React & Power BI Connectors',
      'Row-Level RBAC Policy Enforcement via OPA',
      'Automated Anomaly Alerts & Scheduled Briefs',
    ],
    setupUsd: 22300,
    setupLabel: '$22.3K setup',
    recurringLabel: 'Monthly Analytics Retainer',
    gmPct: 29.1,
    minServerTier: 3,
    layers: ['L3', 'L5', 'L6'],
    depends: ['mis_erp'],
    integratesWith: ['icr_ops', 'legacy_mod', 'iot_edge', 'fintech_rails'],
    provides: ['conversational_analytics', 'executive_kpis'],
    proofClient: 'Jotax Oy (-80% report time, 96% accuracy)',
    deployment: ['On-Prem', 'Private VPC', 'SaaS'],
  },
  {
    id: 'legacy_mod',
    shortName: 'Legacy Modernization',
    name: 'Digital Transformation & Legacy Modernization',
    hubId: 'enterprise',
    category: 'Enterprise Core & Modernization',
    engine: 'operations',
    tagline: 'Legacy DB virtualization (28+ virtual relations), microservices, cloud/on-prem migration & upkeep',
    coreCapabilities: [
      'Zero-Downtime DB Virtualization (28+ Virtual Relations)',
      'Strangler-Fig Microservices & Event CDC Extraction',
      'On-Prem to Private VPC Sovereign Migration',
      'Branded Legacy Maintenance & API Modernization',
    ],
    setupUsd: 34000,
    setupLabel: '$22K–$46.5K ($34K base)',
    recurringLabel: 'Branded Maintenance & SLA',
    gmPct: 32.9,
    minServerTier: 4,
    layers: ['L5', 'L6'],
    depends: [],
    integratesWith: ['mis_erp', 'genai_bi', 'cyber_sla'],
    provides: ['virtualized_schema', 'legacy_cdc_stream'],
    proofClient: 'Jotax Oy · Mid-Market Silos',
    deployment: ['On-Prem', 'Private VPC'],
  },
  {
    id: 'cyber_sla',
    shortName: 'Cyber Security & SLA',
    name: 'Cyber Security, Resilience & 24/7 Maintenance',
    hubId: 'infra',
    category: 'Sovereign Infra, Edge & Security',
    engine: 'operations',
    tagline: 'VAPT, Attack Avoidance/Mitigation, HIPAA/SOC 2/ISO 27001/BB ICT v4.0, AMD SEV-SNP / Intel TDX TEE',
    coreCapabilities: [
      'Continuous VAPT & Attack Avoidance/Mitigation',
      'HIPAA, SOC 2, ISO 27001 & BB ICT v4.0 Readiness',
      'AMD SEV-SNP & Intel TDX Confidential Compute TEE',
      '24/7 Incident Response, Patching & Air-Gapped DR',
    ],
    setupUsd: 8600,
    billingCadence: 'quarterly-retainer',
    setupLabel: '$8.6K/qtr SLA',
    recurringLabel: '$8.6K/qtr Managed Security SLA',
    gmPct: 32.6,
    minServerTier: 4,
    layers: ['L2', 'L5'],
    depends: [],
    integratesWith: ['icr_ops', 'fintech_rails', 'healthcare_erp', 'iot_edge', 'legacy_mod'],
    provides: ['tee_enclave', 'compliance_audit', 'sla_24x7'],
    proofClient: 'Regulated BFSI & Healthcare',
    deployment: ['On-Prem', 'Private VPC'],
  },
  {
    id: 'datasets',
    shortName: 'Curated Dataset Packs',
    name: 'Curated & Synthetic Dataset Packs',
    hubId: 'infra',
    category: 'Growth, MarTech & Data IP',
    engine: 'operations',
    tagline: '1.4M+ PII-stripped Bangla, Banglish, EN, HI, UR handwritten ICR, voice, clinical & leaf vision sets',
    coreCapabilities: [
      '1.4M+ PII-Stripped Regional Multimodal Samples',
      'Bangla, Banglish, EN, HI & UR Handwritten ICR Sets',
      'Annotated Clinical, Voice & Agricultural Leaf Vision',
      'Domain-Specific RAG Corpora & Synthetic Benchmarks',
    ],
    setupUsd: 19500,
    setupLabel: '$19.5K/pack',
    recurringLabel: 'Commercial Pack License + Refresh',
    gmPct: 65.1,
    minServerTier: 4,
    layers: ['L3', 'L5'],
    depends: [],
    integratesWith: ['icr_ops', 'voice_ai', 'healthcare_erp'],
    provides: ['training_corpora', 'domain_rag_vectors'],
    proofClient: 'Regional AI Labs & Fintechs',
    deployment: ['On-Prem', 'Private VPC', 'SaaS'],
  },
  {
    id: 'spatial_xr',
    shortName: 'Spatial XR & 3D IP',
    name: 'Spatial XR, Intelligent XR Guides & 3D IP',
    hubId: 'xr',
    category: 'Voice, Spatial XR & Experience',
    engine: 'experience',
    tagline: 'VirtuTrain360 VR, UE5/Unity Digital Twins w/ AI Guides, 3D Previz, VirtuED AR & Epic Fab/UEFN Packs',
    coreCapabilities: [
      'VirtuTrain360 Certified Industrial & Cleanroom VR',
      'UE5 / Unity Facility Digital Twins w/ AI Guides',
      'VirtuED Medical AR & Heritage Spatial Twins',
      'Epic Fab / UEFN 3D Asset IP (70%–88% Royalties)',
    ],
    setupUsd: 38000,
    setupLabel: '$38K baseline build',
    recurringLabel: 'Enterprise License + 70%–88% IP Royalties',
    gmPct: 76.3,
    minServerTier: 2,
    layers: ['L3', 'L4', 'L6'],
    depends: [],
    integratesWith: ['healthcare_erp', 'workflow_ai', 'branding_geo', 'iot_edge'],
    provides: ['spatial_twin', 'xr_training_telemetry', '3d_asset_ip'],
    proofClient: 'Samsung Biologics · Apollo JMI · Puthia Rajbari',
    deployment: ['On-Prem', 'SaaS'],
  },
  {
    id: 'voice_ai',
    shortName: 'Multilingual Voice AI',
    name: 'Multilingual Voice AI (STT-TTS for Customer Care & BPO)',
    hubId: 'voice',
    category: 'Voice, Spatial XR & Experience',
    engine: 'fusion',
    tagline: 'On-prem/hybrid STT-TTS in Bangla, Banglish, EN, HI, UR (+ Arabic roadmap) & WhatsApp Voice ERP',
    coreCapabilities: [
      'On-Prem / Hybrid STT-TTS (Bangla, Banglish, EN, HI, UR)',
      'Code-Switched BPO & Banking Call Center Agents',
      'WhatsApp Business Voice-to-ERP Workflows',
      'Sub-600ms Turn-Taking w/ Sentiment Escalation',
    ],
    setupUsd: 21200,
    setupLabel: '$21.2K setup',
    recurringLabel: 'Per-min / Concurrent Seat SaaS',
    gmPct: 34.9,
    minServerTier: 3,
    layers: ['L3', 'L6'],
    depends: [],
    integratesWith: ['workflow_ai', 'fintech_rails', 'healthcare_erp', 'mis_erp', 'datasets'],
    provides: ['voice_channel', 'whatsapp_voice_bridge'],
    proofClient: 'BPO & Banking Call Centers',
    deployment: ['On-Prem', 'Private VPC', 'SaaS'],
  },
  {
    id: 'workflow_ai',
    shortName: 'Workflow & AI Agents',
    name: 'Workflow Automation & Vertical AI Assistants',
    hubId: 'voice',
    category: 'AI & Data Operations',
    engine: 'fusion',
    tagline: 'Multi-agent Corrective RAG + OPA policy-as-code across 8 verticals (Think · Learn · Solve)',
    coreCapabilities: [
      'Multi-Agent Corrective RAG Orchestration',
      'OPA Policy-as-Code & Deterministic Guardrails',
      '8 Verticals: E-Com, Banking, Edu, Med, CRM, BPO, Tutor, Tour',
      'SecureBank AI & Automated Escalation Pipelines',
    ],
    setupUsd: 18200,
    setupLabel: '$18.2K sprint',
    recurringLabel: 'Governance & Optimization SLA',
    gmPct: 29.7,
    minServerTier: 3,
    layers: ['L3', 'L5', 'L6'],
    depends: [],
    integratesWith: ['icr_ops', 'mis_erp', 'voice_ai', 'spatial_xr', 'fintech_rails'],
    provides: ['agentic_orchestrator', 'opa_policy_bus'],
    proofClient: 'SecureBank AI · 8 Verticals',
    deployment: ['On-Prem', 'Private VPC', 'SaaS'],
  },
  {
    id: 'branding_geo',
    shortName: 'AI-Native SEO & WebAR',
    name: 'Digital Branding & AI-Native Marketing',
    hubId: 'retail',
    category: 'Growth, MarTech & Data IP',
    engine: 'experience',
    tagline: 'Digital Branding, AI-Native SEO/GEO, WebAR Try-On, 3D DOOH, Event Games & 365 Exchange Circular CRM',
    coreCapabilities: [
      'AI-Native SEO & Generative Engine Optimization (GEO)',
      'Zero-App WebAR Product Try-On Commerce',
      '3D Anamorphic DOOH & Event Attraction Games',
      '365 Exchange Circular CRM & Reverse Logistics',
    ],
    setupUsd: 6900,
    billingCadence: 'quarterly-retainer',
    setupLabel: '$6.9K/qtr retainer',
    recurringLabel: '$6.9K/qtr Growth & GEO Retainer',
    gmPct: 30.4,
    minServerTier: 4,
    layers: ['L4', 'L6'],
    depends: [],
    integratesWith: ['spatial_xr', 'mis_erp', 'voice_ai'],
    provides: ['webar_commerce', 'geo_visibility', 'circular_crm'],
    proofClient: 'ISHO (+28% conv., -22% returns) · Coca-Cola · BEST',
    deployment: ['SaaS'],
  },
  {
    id: 'iot_edge',
    shortName: 'IoT, Edge & Green AI',
    name: 'IR4/IR5 IoT, Edge Computing & Climate-Friendly Green AI',
    hubId: 'energy',
    category: 'Sovereign Infra, Edge & Security',
    engine: 'fusion',
    tagline: '<50ms quantized edge inference, IIoT gateways (Wasm/MQTT) & Green AI Carbon Emission Planner',
    coreCapabilities: [
      '<50ms Quantized Edge Inference on Rugged Nodes',
      'Wasm / MQTT Industrial & EV Battery Gateways',
      'Green AI Carbon Emission Planner & ESG Telemetry',
      'Predictive Fleet & Swap Station Maintenance',
    ],
    setupUsd: 29400,
    setupLabel: '$29.4K build',
    recurringLabel: 'Managed Edge Fleet SLA',
    gmPct: 33.3,
    minServerTier: 3,
    layers: ['L1', 'L2', 'L3', 'L5'],
    depends: ['cyber_sla'],
    integratesWith: ['mis_erp', 'genai_bi', 'spatial_xr'],
    provides: ['edge_telemetry', 'mqtt_stream', 'esg_carbon_ledger'],
    proofClient: 'X Ltd (80 BaaS Swap Stations / 480 EVs)',
    deployment: ['On-Prem', 'Private VPC'],
  },
];

export const STARTER_RECIPES: StarterRecipe[] = [
  {
    id: 'banking_pack',
    name: 'Regulated Banking Pack',
    pattern: 'Bank Pattern',
    description: 'Air-gapped ICR, MFS/wallet rails, conversational executive BI & BB ICT v4.0 cyber SLA.',
    ids: ['icr_ops', 'fintech_rails', 'genai_bi', 'mis_erp', 'cyber_sla'],
  },
  {
    id: 'hospital_pack',
    name: 'Hospital & Care Ops Pack',
    pattern: 'Apollo JMI Pattern',
    description: 'HL7/FHIR clinical ERP, multilingual Bangla/EN triage voice AI, facility Digital Twin & HIPAA SLA.',
    ids: ['healthcare_erp', 'voice_ai', 'spatial_xr', 'cyber_sla'],
  },
  {
    id: 'retail_baas_pack',
    name: 'Retail & BaaS Fleet Pack',
    pattern: 'BEST & X Ltd Pattern',
    description: '65+ showroom MIS, 80-station BaaS IoT edge, GenAI BI, WebAR commerce & managed security.',
    ids: ['mis_erp', 'iot_edge', 'genai_bi', 'branding_geo', 'cyber_sla'],
  },
];

export const SOVEREIGN_STACK_LAYERS: SovereignLayer[] = [
  {
    id: 'L6',
    title: 'Omni-Channel UI & Delivery',
    subtitle: 'Web · Mobile · WhatsApp Business · VR/AR Headsets',
    summary:
      'Unified client presentation layer exposing identical backend state across React web portals, native mobile apps, WhatsApp Business Voice ERP, and standalone XR headsets.',
    slaMetric: '99.95% UI uptime · <120ms TTI',
    protocols: ['HTTPS/TLS 1.3', 'WebSockets', 'WhatsApp Cloud API', 'OpenXR / WebXR'],
    apiContracts: [
      'POST /v1/channel/whatsapp/voice-erp',
      'GET /v1/portal/digital-twin/viewport-state',
      'WS /v1/hitl/review-queue/stream',
    ],
    securityControls: ['SSO / OIDC Multi-Tenant RBAC', 'Zero-PII Client Cache', 'Device Attestation'],
    accent: '#1EB56A',
  },
  {
    id: 'L5',
    title: 'Governance & Data Bus',
    subtitle: 'PostgreSQL · Kafka · Vector DB · OPA Policy · 0.88 HITL Gate',
    summary:
      'Shared Spenta Core kernel providing unified entity schemas, event streaming, Open Policy Agent circuit breakers, and immutable human-in-the-loop audit ledgers.',
    slaMetric: '0.88 HITL Gate · 100% immutable audit trace',
    protocols: ['PostgreSQL 16 + pgvector', 'Apache Kafka', 'OPA Rego', 'HL7 / FHIR R4'],
    apiContracts: [
      'POST /v1/opa/evaluate-confidence (threshold >= 0.88)',
      'PUB kafka://spenta.verified.documents',
      'QUERY pg://spenta_core.virtual_relations[28+]',
    ],
    securityControls: ['Row-Level RBAC Enforcement', 'Cryptographic Audit Signing', 'Automated PII Redaction'],
    accent: '#0D9488',
  },
  {
    id: 'L4',
    title: 'Spatial Fusion Engine',
    subtitle: 'Unreal Engine 5 · Unity · WebAR · Three.js Digital Twins',
    summary:
      'Real-time spatial computing bridge fusing live L1–L5 enterprise telemetry into interactive cleanroom VR simulations, hospital digital twins, and zero-app WebAR retail.',
    slaMetric: '60–90 FPS XR · <18MB WebAR payloads',
    protocols: ['glTF 2.0 / USD', 'WebGL 2 / WebGPU', 'Pixel Streaming', 'Spatial Anchors'],
    apiContracts: [
      'SYNC /v1/spatial/twin/{siteId}/telemetry-bind',
      'POST /v1/spatial/ai-guide/dialogue-turn',
      'GET /v1/assets/fab-pack/{skuId}/lod',
    ],
    securityControls: ['Signed Asset Manifests', 'Watermarked 3D IP Distribution', 'On-Prem Render Nodes'],
    accent: '#10B981',
  },
  {
    id: 'L3',
    title: 'Sovereign Neural Core',
    subtitle: 'LLaMA 3.2 Vision · LayoutLMv3 · Whisper · Quantized Green AI',
    summary:
      'Self-hosted open-weight inference router abstracting local multimodal vision, document ICR, regional Bangla/Banglish STT-TTS, and Corrective RAG with zero external LLM API calls.',
    slaMetric: '<30s/form ICR · 0 bytes cloud PII egress',
    protocols: ['vLLM / Ollama / TensorRT-LLM', 'gRPC Streaming', 'GGUF / AWQ INT4', 'Corrective RAG'],
    apiContracts: [
      'POST /v1/neural/icr/extract-layout',
      'STREAM /v1/neural/voice/bn-en-stt-tts',
      'POST /v1/neural/rag/corrective-query',
    ],
    securityControls: ['Air-Gapped Model Weights', 'Prompt-Injection Sandbox', 'Confidence Calibration'],
    accent: '#059669',
  },
  {
    id: 'L2',
    title: 'Edge Compute & Hardware TEEs',
    subtitle: 'AMD SEV-SNP · Intel TDX · <50ms Local Inference',
    summary:
      'Confidential computing and rugged edge layer guaranteeing hardware-encrypted memory enclaves for banking/clinical workloads and ultra-low latency site inference.',
    slaMetric: '<50ms edge inference · Hardware-enforced memory encryption',
    protocols: ['AMD SEV-SNP', 'Intel TDX', 'Kubernetes / K3s', 'WasmEdge'],
    apiContracts: [
      'VERIFY /v1/tee/attestation-quote',
      'DEPLOY /v1/edge/node/{stationId}/quantized-bundle',
      'GET /v1/security/vapt/posture-score',
    ],
    securityControls: ['Encrypted RAM Enclaves', 'Zero-Trust mTLS Mesh', 'BB ICT v4.0 / HIPAA Hardening'],
    accent: '#14B8A6',
  },
  {
    id: 'L1',
    title: 'Sensing & IIoT Gateways',
    subtitle: 'Wasm / MQTT · EV BaaS Stations · Clinical & Facility Sensors',
    summary:
      'Physical-world telemetry ingestion for battery-swapping stations, industrial machinery, solar/EPC assets, and clinical medical devices.',
    slaMetric: '80 BaaS Stations / 480 EVs · Sub-second MQTT ingest',
    protocols: ['MQTT 5.0', 'Modbus / OPC-UA', 'CAN-Bus Telemetry', 'BLE / LoRaWAN'],
    apiContracts: [
      'PUB mqtt://xltd/baas/{stationId}/pack-health',
      'POST /v1/iot/green-ai/carbon-ledger',
      'STREAM /v1/iot/predictive-maintenance/alerts',
    ],
    securityControls: ['X.509 Hardware Device Certs', 'Signed OTA Firmware', 'Local Offline Buffering'],
    accent: '#F59E0B',
  },
];

export const SERVER_TIERS: Record<ServerTierId, ServerTierSpec> = {
  1: {
    id: 1,
    code: 'TIER 1',
    name: '300B MoE Real-Time Sovereign Flagship',
    modelScale: '300B MoE (30–40B Active) / Dense Batch',
    hardware: 'Apple Mac Studio M3 Ultra (80-core GPU, 819 GB/s bandwidth)',
    vramRam: '512GB Unified Memory',
    storage: '8TB NVMe SSD + Encrypted NAS Backup',
    capex: '$14,100–$15,300',
    capexMidUsd: 14700,
    speed: '18–35 tok/s (MoE) · ~5 tok/s (Dense)',
    idealFor: 'Concurrent 300B MoE multimodal ICR, hospital-wide Clinical AI, Voice & XR Guides on one silent desktop box.',
  },
  2: {
    id: 2,
    code: 'TIER 2',
    name: '200B–300B MoE Hybrid Rack',
    modelScale: '200B–300B MoE Hybrid',
    hardware: '4× RTX 3090 (96GB) or 2× RTX 5090 (64GB) + AMD EPYC 9004',
    vramRam: '384–512GB DDR5 ECC + 64–96GB VRAM',
    storage: '10TB NVMe + 50TB Enterprise Backup',
    capex: '$12,000–$14,500',
    capexMidUsd: 13250,
    speed: '12–22 tok/s',
    idealFor: 'High-volume Bank ICR clusters, Spatial XR rendering nodes & multi-branch enterprise inference.',
  },
  3: {
    id: 3,
    code: 'TIER 3',
    name: 'Spenta Budget Baseline (70B–120B RT)',
    modelScale: '70B–120B RT / 200B MoE',
    hardware: '4× refurbished RTX 3090 (96GB VRAM) + Workstation EPYC/Threadripper',
    vramRam: '96GB VRAM + 256GB DDR5',
    storage: '2TB 990 PRO + 8TB U.2 NVMe + 50TB HDD',
    capex: '$8,500–$10,500',
    capexMidUsd: 9500,
    speed: '20–38 tok/s (70B)',
    idealFor: 'Spenta default enterprise baseline for Healthcare ERP, Fintech Suite, Voice AI, GenAI BI & IoT Edge.',
    note: 'Reconciled baseline build with refurbished 4× RTX 3090, 2000W PSU & 50TB backup; new enterprise-warranty RTX A5000/L40S upgrade available for Tier-1 banks.',
  },
  4: {
    id: 4,
    code: 'TIER 4',
    name: '33B–70B Efficient Production Node',
    modelScale: '33B–70B Quantized Production',
    hardware: '2× RTX 3090 (48GB VRAM) + 1200W Platinum PSU',
    vramRam: '48GB VRAM + 128GB DDR5',
    storage: '4TB NVMe Enterprise SSD',
    capex: '$3,200–$4,200',
    capexMidUsd: 3700,
    speed: '25–45 tok/s',
    idealFor: 'Standalone Modular MIS, Legacy Virtualization, Security SLA gateways & branch edge analytics.',
  },
};

export const DUAL_SHORE_COMPARISON = [
  {
    role: 'Spenta Dhaka R&D Hub (20 FTE)',
    hourlyUsd: 12.98,
    annualTeamUsd: 540000,
    edgeLabel: '$11.50 base + $1.48 enclave overhead (64.8M BDT/yr · ~$18.54/hr @ 70% util.)',
    color: '#1EB56A',
  },
  {
    role: 'Eastern Europe / LatAm (20 FTE)',
    hourlyUsd: 68,
    annualTeamUsd: 2828800,
    edgeLabel: '5.2× higher loaded cost (41,600 hrs/yr)',
    color: '#0D9488',
  },
  {
    role: 'US / AU Tier-2 Agency (20 FTE)',
    hourlyUsd: 115,
    annualTeamUsd: 4784000,
    edgeLabel: '8.9× higher loaded cost (41,600 hrs/yr)',
    color: '#64748B',
  },
  {
    role: 'Global Big-4 AI Pod (20 FTE)',
    hourlyUsd: 150,
    annualTeamUsd: 6240000,
    edgeLabel: '11.6× higher loaded cost (41,600 hrs/yr)',
    color: '#E11D48',
  },
];

export const FINANCIAL_TRAJECTORY: FinancialYear[] = [
  {
    year: 'FY2027',
    label: 'Y1',
    conservativeRevK: 672,
    conservativeBurnK: 590,
    conservativeEbitdaK: 82,
    conservativeNetProfitK: 61.5,
    upsideRevK: 1150,
    upsideEbitdaK: 310,
    upsideNetProfitK: 232.5,
    milestone: '$500K Post-Money SAFE · 20-FTE Dhaka Hub · $60K MRR target in 12 mos',
    upsideMilestone: 'Full pipeline velocity ($1.15M rev · $310K EBITDA) across Healthcare ERP & Bank ICR pilots',
  },
  {
    year: 'FY2028',
    label: 'Y2',
    conservativeRevK: 1450,
    conservativeBurnK: 1060,
    conservativeEbitdaK: 390,
    conservativeNetProfitK: 292.5,
    upsideRevK: 2490,
    upsideEbitdaK: 920,
    upsideNetProfitK: 690,
    milestone: 'Self-sustaining cashflow covering $1.06M total OpEx ($585K core Dhaka pod + delivery scaling)',
    upsideMilestone: 'Multi-site hospital & regional BFSI rollout driving $2.49M rev (36.9% EBITDA margin)',
  },
  {
    year: 'FY2029',
    label: 'Y3',
    conservativeRevK: 2650,
    conservativeBurnK: 1870,
    conservativeEbitdaK: 780,
    conservativeNetProfitK: 585,
    upsideRevK: 4800,
    upsideEbitdaK: 1840,
    upsideNetProfitK: 1380,
    milestone: 'Conservative $2.65M base (0.552× of $4.80M Y3 Healthcare ERP upside) · Regional BFSI & BaaS expansion',
    upsideMilestone: 'Unscaled $4.80M Healthcare ERP + BFSI pipeline ($1.84M EBITDA · 38.3% margin)',
  },
  {
    year: 'FY2030',
    label: 'Y4',
    conservativeRevK: 4100,
    conservativeBurnK: 2972,
    conservativeEbitdaK: 1128,
    conservativeNetProfitK: 846,
    upsideRevK: 6950,
    upsideEbitdaK: 2790,
    upsideNetProfitK: 2092.5,
    milestone: '3.57× capital efficiency (cum. net profit / $500K raised) · High-margin SaaS & IP mix rises',
    upsideMilestone: '$4.40M cum. Net Profit (8.79× capital efficiency) · ANZ & MENA multi-vertical scale',
  },
  {
    year: 'FY2031',
    label: 'Y5',
    conservativeRevK: 5850,
    conservativeBurnK: 3978,
    conservativeEbitdaK: 1872,
    conservativeNetProfitK: 1404,
    upsideRevK: 9600,
    upsideEbitdaK: 4120,
    upsideNetProfitK: 3090,
    milestone: '$4.252M cum. EBITDA · $3.189M cum. Net Profit · 6.38× capital efficiency · 4.16×–6.24× SAFE exit ROI',
    upsideMilestone: '$9.98M cum. EBITDA · $7.485M cum. Net Profit · 14.97× capital efficiency · 9.16×–13.73× SAFE exit ROI',
  },
];

export const BLUEPRINT_PILLARS: BlueprintPillar[] = [
  {
    id: 'sovereign_ai_ops',
    code: 'PILLAR 01',
    title: 'Sovereign Document & Decision AI',
    engine: 'operations',
    summary:
      'Self-hosted vision, layout extraction, and Corrective RAG engines running entirely inside client firewalls with mathematical 0.88 confidence gating.',
    metrics: ['<30s/form ICR', '0.88 HITL OPA Gate', '0 bytes cloud PII egress'],
    apps: ['icr_ops', 'workflow_ai', 'genai_bi'],
    tags: ['LLaMA 3.2 Vision', 'LayoutLMv3', 'OPA', 'Bank', 'SecureBank'],
  },
  {
    id: 'clinical_vertical',
    code: 'PILLAR 02',
    title: 'Clinical & Regulated Vertical ERP',
    engine: 'operations',
    summary:
      'Turnkey industry suites engineered for hospital networks and regulated financial rails where downtime and data leakage are non-starters.',
    metrics: ['58.0% Healthcare GM', '$45/bed/mo ARR', 'HL7/FHIR & KYC/AML'],
    apps: ['healthcare_erp', 'fintech_rails', 'mis_erp'],
    tags: ['Apollo JMI', 'LABAID', 'bKash', 'HL7/FHIR', 'BEST'],
  },
  {
    id: 'spatial_xr_ip',
    code: 'PILLAR 03',
    title: 'Spatial XR, Digital Twins & 3D IP',
    engine: 'experience',
    summary:
      'High-margin 76.3% GM spatial computing practice combining certified VR cleanroom training, UE5 facility twins with AI guides, and Fab/UEFN asset royalties.',
    metrics: ['76.3% Conservative GM', '70%–88% IP Royalties', '60–90 FPS XR'],
    apps: ['spatial_xr', 'branding_geo'],
    tags: ['Samsung Biologics', 'VirtuTrain360', 'UE5', 'VirtuED', 'ISHO WebAR'],
  },
  {
    id: 'multilingual_voice',
    code: 'PILLAR 04',
    title: 'South Asian & Hybrid Voice AI',
    engine: 'fusion',
    summary:
      'Purpose-built speech recognition and synthesis tuned for Bangla, Banglish code-switching, English, Hindi, and Urdu across BPOs and WhatsApp Business ERP.',
    metrics: ['5+ Regional Languages', 'WhatsApp Voice ERP', '1.4M+ Curated Samples'],
    apps: ['voice_ai', 'datasets'],
    tags: ['STT-TTS', 'Banglish', 'BPO', 'HelloKhata', 'RAG Corpora'],
  },
  {
    id: 'edge_green_ai',
    code: 'PILLAR 05',
    title: 'IR4/IR5 Edge Telemetry & Green AI',
    engine: 'fusion',
    summary:
      'Sub-50ms quantized inference on Wasm/MQTT industrial gateways powering EV battery-swapping fleets and verifiable ESG carbon emission planning.',
    metrics: ['<50ms Edge Latency', '80 BaaS Stations / 480 EVs', 'Quantized Green AI'],
    apps: ['iot_edge', 'legacy_mod'],
    tags: ['X Ltd', 'MQTT', 'Wasm', 'ESG Carbon', '28+ Virtual Relations'],
  },
  {
    id: 'tee_cyber_infra',
    code: 'PILLAR 06',
    title: 'Confidential Hardware & 24/7 Resilience',
    engine: 'operations',
    summary:
      '4-Tier local Server PC blueprints ($3.2K–$15.3K) hardened with AMD SEV-SNP / Intel TDX enclaves and continuous VAPT compliance SLAs.',
    metrics: ['Tier 3 $8.5K–$10.5K Base', 'AMD SEV-SNP / TDX', '24/7 Managed SLA'],
    apps: ['cyber_sla'],
    tags: ['HIPAA', 'SOC 2', 'ISO 27001', 'BB ICT v4.0', 'Mac Studio M3 Ultra'],
  },
];

export const AGENTIC_VERTICALS: AgenticVertical[] = [
  {
    id: 'v_banking',
    name: 'Banking & KYC',
    think: 'Parse loan/KYC packets via LLaMA 3.2 Vision + LayoutLMv3 and cross-check AML watchlists.',
    learn: 'Update field-extraction heuristics from officer corrections captured in the 0.88 HITL queue.',
    solve: 'Auto-reconcile approved forms into core banking ledgers in <30s with cryptographic audit trails.',
    hitlTrigger: 'Signature mismatch or OCR confidence < 0.88 routes to compliance desk.',
    proof: 'Bank · SecureBank AI',
  },
  {
    id: 'v_medical',
    name: 'Medical & Care Ops',
    think: 'Synthesize HL7/FHIR vitals, handwritten Rx OCR, and nurse shift notes into clinical risk scores.',
    learn: 'Adapt ward rostering and triage sensitivity from senior clinician feedback loops.',
    solve: 'Generate verified shift handovers, pre-screening briefs, and diagnostic routing.',
    hitlTrigger: 'Any dosage ambiguity or clinical confidence < 0.88 escalates to attending MD.',
    proof: 'Apollo JMI · LABAID',
  },
  {
    id: 'v_ecommerce',
    name: 'E-Commerce & Retail',
    think: 'Correlate showroom stock MIS, WebAR try-on dwell metrics, and 365 Exchange return triggers.',
    learn: 'Refine SKU size/fit recommendations and GEO content rankings from conversion telemetry.',
    solve: 'Automate omnichannel replenishment, circular exchange credits, and personalized bundles.',
    hitlTrigger: 'High-value return override or margin floor breach triggers branch manager approval.',
    proof: 'ISHO (+28% conv.) · BEST (65+ Showrooms)',
  },
  {
    id: 'v_bpo',
    name: 'Call Center & BPO',
    think: 'Transcribe live Bangla/Banglish/EN/HI/UR caller audio and retrieve policy-grounded answers.',
    learn: 'Cluster recurring unresolved intents into verified Corrective RAG playbooks.',
    solve: 'Resolve tier-1 billing, balance, and order-status tickets autonomously via voice & WhatsApp.',
    hitlTrigger: 'Negative sentiment spike or policy confidence < 0.88 performs warm transfer with transcript.',
    proof: 'Regional BPO & Banking Care',
  },
  {
    id: 'v_crm_hrm',
    name: 'CRM / HRM & Executive BI',
    think: 'Translate natural-language leadership prompts into governed SQL across 28+ virtualized tables.',
    learn: 'Cache validated KPI definitions and department RBAC scopes per executive role.',
    solve: 'Deliver instant margin, attrition, and cashflow visualizations cutting report time by 80%.',
    hitlTrigger: 'Unverified join or restricted PII column blocked by OPA policy before execution.',
    proof: 'Jotax Oy (96% accuracy)',
  },
  {
    id: 'v_education',
    name: 'Education & VirtuED',
    think: 'Assess learner mastery across clinical AR procedures and multilingual coursework.',
    learn: 'Personalize spaced repetition and anatomical simulation difficulty per student cohort.',
    solve: 'Deliver interactive AR lab coaching and automated rubric grading at scale.',
    hitlTrigger: 'Certification exam anomalies route to faculty proctor review.',
    proof: 'LABAID VirtuED Medical AR',
  },
  {
    id: 'v_tutor',
    name: 'Intelligent Corporate Tutor',
    think: 'Track VR cleanroom SOP sequences inside VirtuTrain360 against GMP compliance steps.',
    learn: 'Identify high-error stations across technician cohorts to target micro-drills.',
    solve: 'Certify operators in zero-risk spatial environments with instant remediation prompts.',
    hitlTrigger: 'Critical GMP sterile breach flags QA trainer sign-off.',
    proof: 'Samsung Biologics',
  },
  {
    id: 'v_tour',
    name: 'Virtual Tour & Spatial Guides',
    think: 'Track visitor gaze, location, and multilingual voice queries inside UE5/Unity Digital Twins.',
    learn: 'Adapt narrative depth and architectural/facility highlights based on visitor profile.',
    solve: 'Power 24/7 Intelligent XR Guides across heritage landmarks, campuses, and factories.',
    hitlTrigger: 'Restricted facility zone inquiry redacted by site OPA rules.',
    proof: 'Puthia Rajbari · Old Central Jail · Apollo JMI',
  },
];

export const HITL_SAMPLE_EVENTS: HitlSampleEvent[] = [
  {
    id: 'evt_1',
    appId: 'icr_ops',
    appName: 'Document AI (ICR)',
    clientPattern: 'Bank (BankOCR)',
    documentType: 'Bangla/EN Handwritten SME Loan Application #PB-48219',
    payloadSummary: 'NID verified, collateral deed parsed (14 fields), ledger reconciliation ready.',
    baseConfidence: 0.94,
    policyRule: 'opa.bfsi.icr_auto_commit_v4',
    latencyMs: 18400,
  },
  {
    id: 'evt_2',
    appId: 'healthcare_erp',
    appName: 'AI Healthcare ERP',
    clientPattern: 'Apollo JMI Clinical Ops',
    documentType: 'Handwritten Rx OCR + HL7/FHIR Ward Handover #AJ-9032',
    payloadSummary: 'Parsed 4 medications; dosage unit smudged on line 3 requires verification.',
    baseConfidence: 0.81,
    policyRule: 'opa.clinical.hipaa_rx_guard',
    latencyMs: 4200,
  },
  {
    id: 'evt_3',
    appId: 'fintech_rails',
    appName: 'Fintech & MFS Suite',
    clientPattern: 'bKash / LankaBangla Pattern',
    documentType: 'Cross-Border Wallet KYC/AML Tier-3 Upgrade #FT-11904',
    payloadSummary: 'Biometric liveness passed; entity name fuzzy match on PEP register.',
    baseConfidence: 0.85,
    policyRule: 'opa.fintech.bb_ict_v4_kyc',
    latencyMs: 1120,
  },
  {
    id: 'evt_4',
    appId: 'genai_bi',
    appName: 'Conversational GenAI BI',
    clientPattern: 'Jotax Oy Executive BI',
    documentType: 'Prompt: "Q3 branch EBITDA variance across 28 virtualized tables"',
    payloadSummary: 'Read-only SQL validated against OPA row-level RBAC; 96% schema match.',
    baseConfidence: 0.96,
    policyRule: 'opa.bi.readonly_sql_sandbox',
    latencyMs: 890,
  },
  {
    id: 'evt_5',
    appId: 'iot_edge',
    appName: 'IoT, Edge & Green AI',
    clientPattern: 'X Ltd (80 BaaS Stations)',
    documentType: 'Battery Pack #EV-318 Thermal Drift Telemetry (MQTT)',
    payloadSummary: 'Quantized edge model detected cell imbalance; recommends bay lock + dispatch.',
    baseConfidence: 0.91,
    policyRule: 'opa.edge.baas_safety_lock',
    latencyMs: 38,
  },
];

export const PITCH_DECK_SLIDES: PitchSlide[] = [
  {
    num: 1,
    section: 'Cover',
    title: 'Spenta Technology — Sovereign OS for Enterprise AI & Spatial XR',
    subtitle: 'Composable On-Premises AI, ERP, Fintech, Voice & Digital Twins Built on Dual-Shore Economics',
    theme: 'dark',
    kpis: [
      { label: 'Capital Raise', value: '$500K SAFE', accent: 'crimson' },
      { label: 'Valuation Cap', value: '$4.5M Post · 20% Disc.', accent: 'emerald' },
      { label: 'Capital Efficiency', value: '6.38×', accent: 'teal' },
      { label: 'Modeled SAFE ROI', value: '4.16×–6.24×', accent: 'amber' },
    ],
    bullets: [
      '13 composable sovereign enterprise apps sharing one L1–L6 kernel (PostgreSQL, Kafka, OPA 0.88 HITL Gate).',
      'Proven across Samsung Biologics, Bank, Apollo JMI, LABAID, ISHO, Jotax Oy, BEST & X Ltd.',
      '20-FTE Dhaka R&D Hub ($12.98/hr fully loaded · $11.50/hr base payroll) orchestrated from San Jose & Australia.',
    ],
    speakerNotes:
      'Open with positioning: Spenta is not another thin API wrapper. We deliver full-stack sovereign enterprise software that runs air-gapped on client-owned hardware at 40%–60% lower cost than Western agencies.',
  },
  {
    num: 2,
    section: 'Thesis',
    title: 'Executive Thesis: Why Sovereign Composable AI Wins Now',
    subtitle: 'Regulated enterprises cannot ship customer PII, medical charts, or bank ledgers to public LLM clouds',
    theme: 'light',
    kpis: [
      { label: 'Composable Apps', value: '13 Modules', accent: 'emerald' },
      { label: 'Cost Edge vs West', value: '40%–60%', accent: 'teal' },
      { label: 'Conservative Client ROI', value: '250%–350%', accent: 'amber' },
    ],
    bullets: [
      'Odoo proved modular open-core apps beat rigid legacy suites; Spenta brings that composability to Sovereign AI + XR.',
      'Dual Capability Engine pairs recurring Operations cashflow (ERP, ICR, Fintech) with high-margin Experience IP (76.3% GM XR/3D).',
      'Captive sister-entity distribution (BEST 65+ showrooms, X Ltd 80 BaaS stations) de-risks Year 1 deployment velocity.',
    ],
    callout: {
      label: 'Core Differentiator',
      text: 'Zero cloud PII exfiltration + mathematical 0.88 HITL governance + $8.5K–$10.5K on-prem Server PC baseline.',
    },
    speakerNotes:
      'Emphasize the dual moat: technical sovereignty (local LLaMA 3.2 Vision + OPA governance) plus structural cost arbitrage via our Dhaka engineering hub.',
  },
  {
    num: 3,
    section: 'Problem',
    title: 'The Enterprise Friction Matrix',
    subtitle: 'Four structural failures blocking AI adoption in Banking, Healthcare, Retail & Mobility',
    theme: 'light',
    bullets: [
      'Compliance Deadlock: HIPAA, SOC 2, and Bangladesh Bank ICT v4.0 prohibit sending raw PII/KYC records to public cloud APIs.',
      'Hallucination Liability: Generic chatbots lack deterministic confidence thresholds or auditable human-in-the-loop sign-off.',
      'Language & Script Blindness: Frontier models fail on handwritten Bangla/Banglish forms, clinical Rx notes, and regional code-switched voice.',
      'CapEx & Vendor Sprawl: Western consulting pods charge $100–$150/hr while leaving disconnected silos across ERP, BI, and XR.',
    ],
    callout: {
      label: 'Spenta Resolution',
      text: 'One shared Spenta Core bus with self-hosted models, 1.4M+ curated regional datasets, and 0.88 HITL gating.',
    },
    speakerNotes:
      'Highlight that every regulated CIO we meet has stalled pilots for these exact four reasons. Spenta eliminates all four on day one.',
  },
  {
    num: 4,
    section: 'Market',
    title: 'Market Timing: Three Converging Multi-Billion Waves',
    subtitle: 'Capturing the sovereign middle ground between enterprise AI, Spatial XR, and clinical workforce gaps',
    theme: 'dark',
    kpis: [
      { label: 'Global AI Spend', value: '$2.52T', accent: 'emerald' },
      { label: 'Spatial Computing', value: '$667B', accent: 'teal' },
      { label: 'Global Health Worker Deficit', value: '11M', accent: 'crimson' },
    ],
    bullets: [
      'Open-weight models (LLaMA 3.2 Vision, LayoutLMv3, Whisper) now match cloud quality on $3.2K–$15.3K local hardware.',
      'Healthcare faces an 11M global staffing deficit—driving urgent demand for AI Shift Handover, Smart Rostering, and Rx OCR.',
      'South & Southeast Asia + ANZ mid-market enterprises demand local-language Voice AI and sovereign deployment at regional pricing.',
    ],
    speakerNotes:
      'Point out the timing inflection: 18 months ago you could not run a 70B–300B multimodal stack on a $8K–$15K office server. Today you can.',
  },
  {
    num: 5,
    section: 'Engine',
    title: 'The Dual Capability Engine',
    subtitle: 'Operations Engine (Cashflow & Retention) + Experience Engine (High-Margin IP & Brand Pull)',
    theme: 'light',
    kpis: [
      { label: 'Operations Engine GM', value: '29%–65%', accent: 'emerald' },
      { label: 'Experience XR/3D GM', value: '76.3%', accent: 'teal' },
      { label: '3D IP Royalties', value: '70%–88%', accent: 'amber' },
    ],
    bullets: [
      'Left Hemisphere — Operations Engine: AI Healthcare ERP, Document ICR, Fintech Rails, Modular MIS, GenAI BI, Legacy Mod, Cyber SLA & Datasets.',
      'Right Hemisphere — Experience Engine: Spatial XR & Digital Twins, VirtuTrain360 VR, WebAR Try-On, AI-Native SEO/GEO & 3D DOOH.',
      'Fusion Bridge: Multilingual Voice AI, 8-Vertical Agentic Workflows, and <50ms IoT Edge bind physical & digital operations.',
    ],
    speakerNotes:
      'Investors often ask why we do both ERP/AI and Spatial XR. Answer: XR wins executive doors (Samsung Biologics, Apollo) and yields 76.3% GM, while Operations locks multi-year recurring ARR.',
  },
  {
    num: 6,
    section: 'Architecture',
    title: 'Spenta Core: The L1–L6 Sovereign Fusion Stack',
    subtitle: 'Every app runs standalone or composes natively over one standardized six-layer architecture',
    theme: 'dark',
    bullets: [
      'L6 Omni-Channel UI: React Web, Mobile, WhatsApp Business Voice ERP, and OpenXR/VR Headsets.',
      'L5 Governance & Data Bus: PostgreSQL, Kafka, Vector DB, OPA Policy-as-Code & 0.88 Confidence HITL Gate.',
      'L4 Spatial Fusion: Unreal Engine 5, Unity, WebAR & Three.js Digital Twins bound to live telemetry.',
      'L3 Sovereign Neural Core: Self-hosted LLaMA 3.2 Vision, LayoutLMv3, Whisper & Quantized Green AI.',
      'L2 Edge & Hardware TEEs: <50ms inference with AMD SEV-SNP / Intel TDX encrypted memory enclaves.',
      'L1 Sensing & IIoT: Wasm/MQTT gateways across EV swap stations, showrooms & clinical devices.',
    ],
    speakerNotes:
      'Walk bottom-to-top or top-to-bottom. Emphasize that L5 OPA governance guarantees no AI agent ever mutates an ERP ledger below 0.88 confidence without human audit.',
  },
  {
    num: 7,
    section: 'Wedge',
    title: 'Primary SaaS Wedge: AI Healthcare ERP & Clinical AI',
    subtitle: '58.0% conservative gross margin with repeatable multi-site hospital ARR expansion',
    theme: 'light',
    kpis: [
      { label: 'Site Setup', value: '$19.8K', accent: 'teal' },
      { label: '150-Bed Site ARR', value: '$81K/yr ($48K @ ~90b)', accent: 'emerald' },
      { label: 'Per-Bed Pricing', value: '$45/bed/mo', accent: 'amber' },
      { label: 'Conservative GM', value: '58.0%', accent: 'emerald' },
    ],
    bullets: [
      'End-to-end Care Ops: HL7/FHIR backbone, AI Shift Handover, Smart Nurse Rostering, AI GP triage & Rx OCR.',
      'Clinically validated through Apollo JMI Digital Twin & LABAID VirtuED partnerships.',
      'Unscaled Year 3 Healthcare ERP pipeline represents $4.80M upside (conservatively haircut to $2.65M in Y3, ~0.5825× 5-yr blended factor).',
    ],
    speakerNotes:
      'Stress that our base investor forecast applies a ~0.5825× 5-year blended conservatism factor—even without full hospital upside, the business generates 6.38× capital efficiency ($3.189M cum. net profit) and 4.16×–6.24× modeled SAFE equity multiple at 10×–15× Y5 EBITDA.',
  },
  {
    num: 8,
    section: 'Proof 01',
    title: 'Flagship Proof: Bank Document Intelligence (BankOCR)',
    subtitle: 'Air-gapped multilingual ICR delivering <30s/form extraction with 450%–580% banking ROI',
    theme: 'dark',
    kpis: [
      { label: 'Form Speed', value: '<30 sec', accent: 'emerald' },
      { label: 'HITL Gate', value: '0.88 OPA', accent: 'teal' },
      { label: 'Banking Proof ROI', value: '450%–580%', accent: 'amber' },
    ],
    bullets: [
      'Stack: Self-hosted LLaMA 3.2 Vision + Tesseract + LayoutLMv3 + React Digital Twin side-by-side verifier.',
      'Processes dense handwritten Bangla/English KYC & loan files completely on-premises under BB ICT v4.0.',
      'Eliminates manual data-entry bottlenecks while keeping a 100% auditable human review trail for low-confidence fields.',
    ],
    speakerNotes:
      'Note how we frame ROI carefully for investors: we model conservative 250%–350% enterprise ROI, while citing 450%–580% strictly as realized banking proofs.',
  },
  {
    num: 9,
    section: 'Proof 02',
    title: 'Flagship Proof: Apollo JMI & LABAID Clinical Ecosystem',
    subtitle: 'Fusing Spatial Digital Twins, VirtuED Medical AR, and AI Clinical Operations',
    theme: 'light',
    kpis: [
      { label: 'Deployment', value: 'On-Prem / VPC', accent: 'teal' },
      { label: 'Standards', value: 'HL7 / FHIR · HIPAA', accent: 'emerald' },
    ],
    bullets: [
      'Apollo JMI: Interactive hospital & biopharma Digital Twin paired with Intelligent XR Guides and care ops workflows.',
      'LABAID: VirtuED Medical AR training modules accelerating clinical onboarding and diagnostic precision.',
      'Provides immediate reference sites to convert regional multi-hospital groups onto the $45/bed/mo AI Healthcare ERP.',
    ],
    speakerNotes:
      'Healthcare buyers buy from peers. Having Apollo JMI and LABAID in production collapses our enterprise sales cycle.',
  },
  {
    num: 10,
    section: 'Proof 03',
    title: 'Flagship Proof: Samsung Biologics (VirtuTrain360 VR)',
    subtitle: 'Enterprise-grade Spatial XR cleanroom certification for global biopharma manufacturing',
    theme: 'dark',
    kpis: [
      { label: 'Vertical', value: 'Global Biopharma', accent: 'emerald' },
      { label: 'XR Line GM', value: '76.3%', accent: 'teal' },
      { label: 'Platform', value: 'VirtuTrain360', accent: 'amber' },
    ],
    bullets: [
      'Delivered zero-risk virtual cleanroom GMP training simulations using Unreal Engine 5 & Unity XR.',
      'Proves Spenta Dhaka R&D Hub ships Tier-1 global enterprise quality trusted by multinational leaders.',
      'Reusable 3D facility IP compounds into 70%–88% royalty streams across Epic Fab, UEFN, and pharma clients.',
    ],
    speakerNotes:
      'Samsung Biologics validates our engineering bar globally—bridging our Dhaka engineering center directly to Fortune Global 500 standards.',
  },
  {
    num: 11,
    section: 'Proof 04',
    title: 'Flagship Proof: ISHO WebAR & Jotax Oy Conversational BI',
    subtitle: 'Measurable commercial lift in retail commerce and automated Nordic enterprise analytics',
    theme: 'light',
    kpis: [
      { label: 'ISHO Conversion Lift', value: '+28%', accent: 'emerald' },
      { label: 'ISHO Return Drop', value: '-22%', accent: 'teal' },
      { label: 'Jotax Report Time', value: '-80%', accent: 'amber' },
      { label: 'Jotax BI Accuracy', value: '96%', accent: 'emerald' },
    ],
    bullets: [
      'ISHO: Zero-app WebAR furniture try-on and AI-Native SEO/GEO driving +28% conversion and -22% product returns.',
      'Jotax Oy (Finland): Legacy DB virtualization across 28+ virtual relations + Conversational GenAI BI cutting reporting time by 80%.',
      'Coca-Cola & bKashVerse: High-traffic interactive 3D brand experiences & event attraction games.',
    ],
    speakerNotes:
      'Jotax Oy proves cross-border EU delivery, while ISHO proves our Experience Engine directly moves bottom-line retail KPIs.',
  },
  {
    num: 12,
    section: 'Captive Rollout',
    title: 'Built-In Captive Distribution: BEST & X Ltd Ecosystems',
    subtitle: 'Immediate real-world testbeds across 65+ retail showrooms and 80 EV battery-swapping stations',
    theme: 'dark',
    kpis: [
      { label: 'BEST Footprint', value: '65+ Showrooms', accent: 'emerald' },
      { label: 'X Ltd BaaS Network', value: '80 Stations', accent: 'amber' },
      { label: 'Connected EV Fleet', value: '480 EVs', accent: 'teal' },
    ],
    bullets: [
      'BEST Electronics (65+ Showrooms): Modular Stock MIS, HRM/RBAC, 365 Exchange Circular CRM, and AI-Native GEO.',
      'X Ltd Energy & Mobility: 80 BaaS swap stations and 480 EVs streaming Wasm/MQTT telemetry into <50ms Edge AI & Green AI Carbon Planner.',
      'Creates live telemetry datasets and turnkey reference deployments for regional retail and mobility buyers.',
    ],
    speakerNotes:
      'Highlight how rare it is for a seed-stage enterprise AI company to have 65+ physical retail branches and 80 live IoT EV stations already running its software.',
  },
  {
    num: 13,
    section: 'Catalog',
    title: 'The 13-Product Composable Catalog & Margin Architecture',
    subtitle: 'Balanced portfolio combining predictable service pods (29%–35% GM) with high-margin IP (58%–76% GM)',
    theme: 'light',
    kpis: [
      { label: 'High-Margin IP Lines', value: '58%–76.3% GM', accent: 'emerald' },
      { label: 'Core Delivery Pods', value: '29.1%–34.9% GM', accent: 'teal' },
      { label: 'Data IP Corpus', value: '1.4M+ Samples', accent: 'amber' },
    ],
    bullets: [
      'High-Margin Engines: Spatial XR & 3D IP (76.3% GM), Curated Dataset Packs (65.1% GM), AI Healthcare ERP (58.0% GM).',
      'Enterprise Land-and-Expand Pods: ICR ($48.5K), Fintech ($39.8K), Legacy Mod ($34K), IoT Edge ($29.4K), GenAI BI ($22.3K), Voice AI ($21.2K), MIS ($20.4K), Workflow AI ($18.2K).',
      'Sticky Recurring Shields: 24/7 Cyber Security SLA ($8.6K/qtr) and AI-Native Marketing/GEO ($6.9K/qtr).',
    ],
    speakerNotes:
      'Our Odoo-inspired Stack Composer turns single-app buyers into 4-to-6 module accounts with native dependencies and cross-app synergies.',
  },
  {
    num: 14,
    section: 'Hardware',
    title: 'Sovereign On-Premises Hardware: 4-Tier Server PC Matrix',
    subtitle: 'Right-sized local compute from $3.2K edge boxes to $15.3K 300B real-time flagships',
    theme: 'dark',
    kpis: [
      { label: 'Tier 4 Edge', value: '$3.2K–$4.2K', accent: 'teal' },
      { label: 'Tier 3 Baseline', value: '$8.5K–$10.5K', accent: 'emerald' },
      { label: 'Tier 2 MoE Rack', value: '$12.0K–$14.5K', accent: 'amber' },
      { label: 'Tier 1 M3 Ultra', value: '$14.1K–$15.3K', accent: 'emerald' },
    ],
    bullets: [
      'Tier 1 (300B RT): Mac Studio M3 Ultra 512GB Unified RAM (819 GB/s, 18–35+ tok/s).',
      'Tier 2 (200B–300B MoE): 4× RTX 3090 or 2× RTX 5090 + AMD EPYC 9004 512GB DDR5 ECC.',
      'Tier 3 (Spenta Budget Baseline): 4× used RTX 3090 (96GB VRAM) + 256GB DDR5 + 10TB NVMe + 50TB HDD.',
      'Tier 4 (33B–70B Edge): 2× used RTX 3090 (48GB VRAM) + 128GB DDR5 at 25–45 tok/s.',
    ],
    speakerNotes:
      'Clients avoid unpredictable per-token cloud bills that explode at scale. One $9.5K Tier 3 server pays for itself in 90–120 days vs cloud GPU APIs.',
  },
  {
    num: 15,
    section: 'Operations',
    title: 'Dual-Shore Delivery Edge: Dhaka R&D + Global Orchestration',
    subtitle: '20-FTE Dhaka engineering engine delivering 40%–60% client savings while preserving healthy margins',
    theme: 'light',
    kpis: [
      { label: 'Fully Loaded Rate', value: '$12.98/hr', accent: 'emerald' },
      { label: 'Y1 Dhaka Budget', value: '$540K (64.8M BDT)', accent: 'teal' },
      { label: 'Western 20-FTE Pod', value: '$4.78M–$6.24M', accent: 'crimson' },
    ],
    bullets: [
      'San Jose & Australia client leadership handles architecture, executive closing, and regulatory alignment.',
      '20-FTE Dhaka R&D Hub executes AI/ML, ERP, UE5 XR, and 24/7 SecOps at $12.98/hr fully loaded ($11.50/hr base + enclave overhead).',
      'Year 2 revenue ($1.45M) self-funds $1.06M total operating OpEx ($585K core Dhaka pod + delivery scaling) with $390K EBITDA.',
    ],
    speakerNotes:
      'Unlike Silicon Valley startups burning $200K/mo before product-market fit, our entire 20-person R&D hub runs for $45K/mo.',
  },
  {
    num: 16,
    section: 'Financials',
    title: 'Reconciled 5-Year Trajectory (FY2027–FY2031)',
    subtitle: 'Conservative base case scales from $672K to $5.85M with $3.189M cumulative net profit',
    theme: 'dark',
    kpis: [
      { label: 'Y1 (FY2027)', value: '$672K Rev', accent: 'teal' },
      { label: 'Y3 (FY2029)', value: '$2.65M Rev', accent: 'emerald' },
      { label: 'Y5 (FY2031)', value: '$5.85M Rev', accent: 'emerald' },
      { label: '5-Yr Cum. EBITDA', value: '$4.252M', accent: 'amber' },
    ],
    bullets: [
      'Y1 $672K ($82K EBITDA) → Y2 $1.45M ($390K EBITDA) → Y3 $2.65M ($780K EBITDA).',
      'Y4 $4.10M ($1.128M EBITDA, 3.57× capital efficiency) → Y5 $5.85M ($1.872M EBITDA as high-GM IP mix scales).',
      'Cumulative 5-Year Net Profit reaches $3.189M (6.38× capital efficiency); at 10×–15× Y5 EBITDA ($18.7M–$28.1M EV), 11.11% Post-Money SAFE equity models 4.16×–6.24× investor ROI (excl. retained cash).',
    ],
    speakerNotes:
      'Invite investors to inspect the interactive Financials tab to stress-test BDT/USD FX (115–130), tax rates (20%–30%), and Exit EBITDA multiples (8×–15×) live.',
  },
  {
    num: 17,
    section: 'Governance',
    title: 'Security, Governance & Risk Mitigation',
    subtitle: 'Built from day one for Banking, Healthcare, and Defense-grade enterprise scrutiny',
    theme: 'light',
    bullets: [
      '0.88 Confidence HITL Gate: OPA policy-as-code intercepts low-confidence outputs and routes to human audit queues.',
      'Hardware TEE Hardening: AMD SEV-SNP and Intel TDX memory encryption prevent host-level inspection.',
      'Compliance Frameworks: HIPAA, SOC 2 Type II readiness, ISO 27001 controls, and Bangladesh Bank ICT v4.0.',
      'FX & Margin Hedge: USD/AUD/EUR enterprise contracts naturally hedge BDT engineering payroll.',
    ],
    callout: {
      label: 'Audit Readiness',
      text: 'Every model decision records input hash, model weight version, confidence score, and human reviewer ID.',
    },
    speakerNotes:
      'Natural FX hedge is a major plus for global investors: revenue is denominated in hard currency while engineering cost is BDT-based.',
  },
  {
    num: 18,
    section: 'The Ask',
    title: 'The Ask: $500,000 SAFE to Scale Sovereign OS Globally',
    subtitle: '$4.5M Valuation Cap · 20% Discount · Targeting $60K MRR Within 12 Months',
    theme: 'dark',
    kpis: [
      { label: 'Instrument', value: '$500K SAFE', accent: 'crimson' },
      { label: 'Terms', value: '$4.5M Post-Cap · 20%', accent: 'emerald' },
      { label: 'Capital Efficiency', value: '6.38×', accent: 'teal' },
      { label: 'SAFE Exit ROI (10×–15×)', value: '4.16×–6.24×', accent: 'amber' },
    ],
    bullets: [
      '45% R&D & Sovereign Core Productization: Packaging Healthcare ERP, ICR & Voice AI into zero-friction on-prem installers.',
      '30% Enterprise Go-To-Market (San Jose, Australia & MENA/SAARC): Closing 6–8 hospital and banking anchor sites.',
      '15% Sovereign Hardware Lab & Dataset IP: Expanding 1.4M+ regional dataset corpus & Tier 1–3 benchmark rigs.',
      '10% Compliance & Security Certifications: SOC 2 Type II, ISO 27001 & HIPAA formal attestations.',
    ],
    callout: {
      label: 'Direct Partner Contact',
      text: 'hello@spenta.tech · San Jose · Australia · Dhaka R&D Hub',
    },
    speakerNotes:
      'Close with clear next step: invite them to compose a live stack in App Vault or submit an investor/enterprise brief directly in the Resources tab.',
  },
];

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'cs_samsung',
    client: 'Samsung Biologics',
    sector: 'Healthcare & Biopharma',
    region: 'South Korea / Global',
    solution: 'VirtuTrain360 Certified VR Cleanroom Training',
    appIds: ['spatial_xr'],
    headlineMetric: 'Zero-risk GMP cleanroom certification',
    metrics: ['UE5 / Unity XR Simulation', '76.3% Product Line GM', 'Reusable 3D Biopharma IP'],
    summary:
      'Built immersive virtual cleanroom SOP simulations enabling biopharma operators to rehearse sterile procedures without disrupting live production suites.',
    deployment: 'On-Prem',
  },
  {
    id: 'cs_primebank',
    client: 'Prime Bank',
    sector: 'Banking & Fintech',
    region: 'Bangladesh / SAARC',
    solution: 'PrimeOCR — Air-Gapped Document Intelligence (ICR)',
    appIds: ['icr_ops', 'cyber_sla', 'workflow_ai'],
    headlineMetric: '1.2M+ Docs · <30s/form · 450%–580% realized ROI',
    metrics: ['LLaMA 3.2 Vision + LayoutLMv3', '0.88 Confidence HITL Gate', 'BB ICT v4.0 On-Prem'],
    summary:
      'Deployed self-hosted handwritten Bangla/English form extraction across 1.2M+ banking documents paired with a React Digital Twin verification UI, keeping 100% of PII inside bank firewalls (client-reported benchmark).',
    deployment: 'On-Prem',
  },
  {
    id: 'cs_apollo',
    client: 'Apollo JMI',
    sector: 'Healthcare & Biopharma',
    region: 'South Asia',
    solution: 'Hospital 360° Digital Twin & AI Clinical Operations',
    appIds: ['healthcare_erp', 'spatial_xr', 'voice_ai', 'cyber_sla'],
    headlineMetric: 'HL7/FHIR Care Ops + Interactive 360° Digital Twin',
    metrics: ['$45/bed/mo SaaS Pattern', 'AI Shift Handover & Rx OCR', 'Intelligent XR Facility Guides'],
    summary:
      'Combined photorealistic 360° spatial hospital digital twins with clinical ERP workflows, automated shift handovers, and multilingual patient triage voice assistants.',
    deployment: 'Private VPC',
  },
  {
    id: 'cs_labaid',
    client: 'LABAID',
    sector: 'Healthcare & Biopharma',
    region: 'Bangladesh',
    solution: 'VirtuED Medical AR & VR LMS (n=240 Cohort)',
    appIds: ['healthcare_erp', 'spatial_xr'],
    headlineMetric: '+30% Clinical Recall (n=240) + Rx OCR',
    metrics: ['VirtuED AR Curriculum', 'Medical VR LMS Validation', 'Rx OCR Verification'],
    summary:
      'Modernized clinical training and diagnostic operations through augmented/virtual reality anatomy modules validated at +30% recall across a 240-learner cohort plus AI-assisted prescription review.',
    deployment: 'On-Prem',
  },
  {
    id: 'cs_isho',
    client: 'ISHO',
    sector: 'Retail & Commerce',
    region: 'South Asia / Global',
    solution: 'Zero-App WebAR Try-On & AI-Native SEO/GEO',
    appIds: ['branding_geo', 'spatial_xr'],
    headlineMetric: '+28% Conversion · -22% Product Returns',
    metrics: ['Zero-App Mobile WebAR', 'AI-Native GEO Visibility', 'High-Fidelity 3D Furniture Twins'],
    summary:
      'Enabled shoppers to place photorealistic furniture models directly in their rooms from mobile browsers, lifting conversion while slashing size-mismatch returns.',
    deployment: 'SaaS',
  },
  {
    id: 'cs_jotax',
    client: 'Jotax Oy',
    sector: 'Enterprise Core & BI',
    region: 'Finland / EU',
    solution: 'Legacy DB Virtualization & Conversational GenAI BI',
    appIds: ['legacy_mod', 'genai_bi', 'mis_erp'],
    headlineMetric: '-80% Reporting Time · 96% Query Accuracy',
    metrics: ['28+ Virtualized DB Relations', 'Natural-Language SQL BI', 'Zero-Downtime Modernization'],
    summary:
      'Virtualized fragmented legacy relational databases into a governed analytics layer with conversational prompt-to-dashboard BI for Nordic operations teams.',
    deployment: 'Private VPC',
  },
  {
    id: 'cs_cocacola_bkash',
    client: 'Coca-Cola / bKashVerse / BEST & X Ltd',
    sector: 'Energy & Mobility',
    region: 'Regional Ecosystem',
    solution: '3D Brand Experiences, 65+ Showroom MIS & 80 BaaS Swap Stations',
    appIds: ['mis_erp', 'iot_edge', 'fintech_rails', 'branding_geo'],
    headlineMetric: '65+ Showrooms · 80 BaaS Stations / 480 EVs',
    metrics: ['<50ms Edge Telemetry', '365 Exchange Circular CRM', 'bKashVerse & 3D DOOH'],
    summary:
      'Powers interactive brand activations for Coca-Cola and bKashVerse alongside captive operational stacks across BEST showrooms and X Ltd EV battery-swap infrastructure.',
    deployment: 'On-Prem',
  },
  {
    id: 'cs_heritage_3d',
    client: 'Puthia Rajbari & Old Central Jail',
    sector: 'Heritage, Agri & Legal',
    region: 'Bangladesh / Cultural Preservation',
    solution: '360° Heritage Digital Twins & Aerial Drone Photogrammetry',
    appIds: ['spatial_xr', 'voice_ai'],
    headlineMetric: 'Sub-cm Aerial Photogrammetry · 360° Interactive Tours',
    metrics: ['Drone LiDAR + Photogrammetry', 'UE5 Real-Time Walkthroughs', 'Multilingual AI Docent'],
    summary:
      'Reconstructed landmark architectural heritage complexes via aerial photogrammetry and 360° spatial capture for national archiving, civic education, and interactive virtual tourism.',
    deployment: 'Private VPC',
  },
  {
    id: 'cs_plant_care_ar',
    client: 'Plant Care AR Vision Platform',
    sector: 'Heritage, Agri & Legal',
    region: 'South Asia / AgriTech',
    solution: 'Offline Mobile AR Crop Pathology & Vision Classifier',
    appIds: ['datasets', 'spatial_xr', 'iot_edge'],
    headlineMetric: '1.4M Curated Images · 38 Disease Classes',
    metrics: ['On-Device Quantized Vision', '38 Plant Pathology Classes', 'Offline Field Diagnostics'],
    summary:
      'Trained a compact mobile AR computer-vision pipeline on 1.4M+ curated regional botanical images to diagnose 38 crop diseases directly in low-connectivity agricultural zones.',
    deployment: 'On-Prem',
  },
  {
    id: 'cs_national_logistics',
    client: 'Regional Fleet & National Logistics Ops',
    sector: 'Energy & Mobility',
    region: 'SAARC Distribution Corridor',
    solution: 'Edge Route Optimization & Predictive Fleet Dispatch',
    appIds: ['iot_edge', 'mis_erp', 'genai_bi'],
    headlineMetric: '+25% On-Time Delivery · -18% Fuel Expenditure',
    metrics: ['Real-Time MQTT Telemetry', 'Automated Route Re-Dispatch', 'Scope 3 Fuel Ledger'],
    summary:
      'Unified multi-depot dispatch telemetry with quantized edge analytics to eliminate idle mileage, lift on-time delivery by 25%, and trim fleet fuel burn by 18%.',
    deployment: 'Private VPC',
  },
  {
    id: 'cs_industrial_mfg',
    client: 'Industrial Manufacturing Line Telemetry',
    sector: 'Enterprise Core & BI',
    region: 'South Asia / APAC',
    solution: 'IR4/IR5 Edge Anomaly Detection & Predictive Maintenance',
    appIds: ['iot_edge', 'legacy_mod', 'cyber_sla'],
    headlineMetric: '<50ms Edge Anomaly Alerts · Zero Cloud Egress',
    metrics: ['Wasm/MQTT Sensor Gateways', 'Legacy PLC Virtualization', '24/7 SecOps Hardening'],
    summary:
      'Retrofitted legacy factory machinery with quantized on-premises sensor gateways detecting vibration and thermal drift in under 50ms to prevent unplanned production halts.',
    deployment: 'On-Prem',
  },
  {
    id: 'cs_law_firm_rag',
    client: 'Regional Corporate Law Practice',
    sector: 'Heritage, Agri & Legal',
    region: 'SAARC / Cross-Border Legal',
    solution: 'Air-Gapped Legal Corrective RAG & Clause Verification',
    appIds: ['icr_ops', 'workflow_ai', 'cyber_sla'],
    headlineMetric: '-65% Contract Review Cycle · 100% Privileged On-Prem',
    metrics: ['0.88 OPA Clause Verification', 'Zero External Data Retention', 'Audit-Ready Citation Map'],
    summary:
      'Deployed an air-gapped document and precedent retrieval assistant inside the firm’s local Server PC enclave, compressing due-diligence contract review time by 65% without breaching client privilege.',
    deployment: 'On-Prem',
  },
];

export const COMPLIANCE_FRAMEWORKS: ComplianceBadge[] = [
  {
    id: 'hipaa',
    code: 'HIPAA',
    name: 'Health Insurance Portability & Accountability Act',
    scope: 'Clinical EHR, Rx OCR, AI Shift Handover & Medical Imaging',
    controls: [
      'Zero external cloud PHI transmission (Air-Gapped L3 Neural Core)',
      'BAA-aligned RBAC & encrypted PostgreSQL/pgvector storage',
      '0.88 HITL clinical escalation with signed clinician audit log',
    ],
    verifiedApps: ['healthcare_erp', 'voice_ai', 'cyber_sla'],
  },
  {
    id: 'soc2',
    code: 'SOC 2',
    name: 'SOC 2 Type II Readiness',
    scope: 'Security, Availability, Processing Integrity & Confidentiality',
    controls: [
      'Automated OPA policy enforcement across every AI tool call',
      'Continuous VAPT, immutable Kafka audit trails & 24/7 SLA',
      'Dual-shore access isolation with ephemeral privileged credentials',
    ],
    verifiedApps: ['cyber_sla', 'genai_bi', 'mis_erp', 'workflow_ai'],
  },
  {
    id: 'iso27001',
    code: 'ISO 27001',
    name: 'ISO/IEC 27001 Information Security Management',
    scope: 'Enterprise Software Engineering & Managed Infrastructure',
    controls: [
      'Hardware TEE memory encryption (AMD SEV-SNP / Intel TDX)',
      'PII-stripped dataset governance across 1.4M+ curated samples',
      'Encrypted offline disaster recovery & signed OTA edge updates',
    ],
    verifiedApps: ['cyber_sla', 'datasets', 'iot_edge', 'legacy_mod'],
  },
  {
    id: 'bb_ict_v4',
    code: 'BB ICT v4.0',
    name: 'Bangladesh Bank ICT Security Guideline v4.0',
    scope: 'Regulated BFSI, NBFI, MFS & Digital Wallet Infrastructure',
    controls: [
      'Strict in-country & on-premises financial data residency',
      'Maker-checker dual control mapped directly to 0.88 HITL Gate',
      'Segregated KYC/AML ledger reconciliation & HSM/TEE key custody',
    ],
    verifiedApps: ['icr_ops', 'fintech_rails', 'cyber_sla'],
  },
];

export const APP_CATEGORIES = [
  'AI & Data Operations',
  'Enterprise Core & Modernization',
  'Vertical Industry Suites',
  'Voice, Spatial XR & Experience',
  'Sovereign Infra, Edge & Security',
  'Growth, MarTech & Data IP',
] as const;
