import { SERVER_TIERS, SPENTA_APPS, ServerTierId } from './spentaManifest';

export interface ProductRoiDriver {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  description: string;
}

export interface ProductRoiProfile {
  appId: string;
  driver: ProductRoiDriver;
  /** Baseline annual recurring fee/SaaS/retainer billed by Spenta at default scale */
  annualRecurringFn: (scale: number) => number;
  /** Estimated annual gross client savings / incremental margin unlocked at scale */
  annualClientValueFn: (scale: number) => number;
  /** Estimated 3-year Western agency + cloud equivalent TCO at scale */
  western3YrTcoFn: (scale: number) => number;
  /** Recurring gross margin % for Spenta on annual SaaS / SLA renewals */
  recurringGmPct: number;
  /** Evidence summary shown next to ROI outputs */
  evidenceBasis: string;
  valueMechanism: string;
  revenueScopeId: RevenueScopeId;
}

export type RevenueScopeId =
  | 'one_time_builds'
  | 'recurring_saas'
  | 'managed_retainers'
  | 'ip_royalties'
  | 'captive_ecosystem';

export interface RevenueScopeSpec {
  id: RevenueScopeId;
  name: string;
  shortName: string;
  examples: string;
  fy27SharePct: number;
  fy31SharePct: number;
  grossMarginPct: number;
  roleSummary: string;
  accent: string;
}

export interface RegionalHubSpec {
  id: 'san-jose' | 'sydney' | 'dhaka';
  name: string;
  role: string;
  regionLabel: string;
  latitude: number;
  longitude: number;
  costProfile: string;
  targetVerticals: string[];
  presetQueries: Array<{
    label: string;
    prompt: string;
  }>;
}

export const REVENUE_SCOPES: RevenueScopeSpec[] = [
  {
    id: 'one_time_builds',
    name: 'Sovereign One-Time Builds',
    shortName: 'One-Time Builds',
    examples: 'ICR ($48.5K), Fintech ($39.8K), Legacy ($34K), IoT ($29.4K), MIS ($20.4K)',
    fy27SharePct: 52,
    fy31SharePct: 24,
    grossMarginPct: 34,
    roleSummary: 'Cash-positive enterprise entry wedge that anchors L1–L6 sovereign infrastructure lock-in.',
    accent: '#1F3863',
  },
  {
    id: 'recurring_saas',
    name: 'Recurring Sovereign SaaS & Usage ARR',
    shortName: 'Recurring SaaS ARR',
    examples: 'Healthcare ERP ($45/bed/mo), Voice AI (per-min/seat), ICR per-page, Site ERP SaaS',
    fy27SharePct: 20,
    fy31SharePct: 44,
    grossMarginPct: 72,
    roleSummary: 'Primary EBITDA and exit-multiple driver converting initial deployments into multi-year annuities.',
    accent: '#1C6E46',
  },
  {
    id: 'managed_retainers',
    name: 'Managed Security & Growth Retainers',
    shortName: 'Quarterly Retainers',
    examples: '24/7 Cyber Security SLA ($8.6K/qtr), AI-Native SEO/WebAR ($6.9K/qtr), BI/AI SLAs',
    fy27SharePct: 16,
    fy31SharePct: 14,
    grossMarginPct: 38,
    roleSummary: 'Predictable quarterly cash floor covering core Dhaka R&D enclave payroll.',
    accent: '#0D9488',
  },
  {
    id: 'ip_royalties',
    name: '3D Spatial IP & Curated Dataset Packs',
    shortName: '3D & Dataset IP',
    examples: 'Epic Fab / UEFN (70%–88% royalties), 1.4M+ Bangla/Clinical Dataset Packs (65.1% GM)',
    fy27SharePct: 6,
    fy31SharePct: 12,
    grossMarginPct: 78,
    roleSummary: 'Zero-marginal-cost IP leverage expanding consolidated company gross margin toward 60%.',
    accent: '#D97706',
  },
  {
    id: 'captive_ecosystem',
    name: 'Captive Sister-Entity Rollouts',
    shortName: 'Captive Ecosystem',
    examples: 'BEST (65+ showrooms), X Ltd (80 BaaS stations / 480 EVs), Apollo JMI & LABAID pilots',
    fy27SharePct: 6,
    fy31SharePct: 6,
    grossMarginPct: 48,
    roleSummary: 'Zero-CAC live production reference sites accelerating regional enterprise trust.',
    accent: '#6366F1',
  },
];

export const PRODUCT_ROI_PROFILES: Record<string, ProductRoiProfile> = {
  healthcare_erp: {
    appId: 'healthcare_erp',
    driver: {
      label: 'Hospital Bed Capacity',
      unit: 'beds',
      min: 50,
      max: 400,
      step: 10,
      defaultValue: 150,
      description: 'Billed at $45/bed/mo ARR ($48K/yr for ~90-bed clinic; $81K/yr for 150-bed hospital).',
    },
    annualRecurringFn: (beds) => beds * 45 * 12,
    annualClientValueFn: (beds) => Math.round(beds * 2250),
    western3YrTcoFn: (beds) => Math.round(145000 + beds * 1450 * 3),
    recurringGmPct: 72,
    evidenceBasis: 'Apollo JMI & LABAID clinical workflows: ~35% nurse handover reduction + 12–18% lower claim denials.',
    valueMechanism: 'Replaces high-fee legacy HIS seats while automating shift handovers, HL7/FHIR rostering, and Rx OCR.',
    revenueScopeId: 'recurring_saas',
  },
  icr_ops: {
    appId: 'icr_ops',
    driver: {
      label: 'Monthly Document Forms',
      unit: 'K forms/mo',
      min: 10,
      max: 200,
      step: 5,
      defaultValue: 40,
      description: 'Handwritten KYC, loan vouchers, and trade finance packets verified at <30s/form with 0.88 HITL gate.',
    },
    annualRecurringFn: (kForms) => Math.round(18000 + kForms * 280),
    annualClientValueFn: (kForms) => Math.round(kForms * 10200),
    western3YrTcoFn: (kForms) => Math.round(240000 + kForms * 2900 * 3),
    recurringGmPct: 68,
    evidenceBasis: 'BankOCR production proof: <30s/form extraction, 0.88 OPA HITL gate, 70%–80% manual entry reduction.',
    valueMechanism: 'Redeploys 8–15 manual verification clerks while eliminating cloud OCR per-page API overages.',
    revenueScopeId: 'one_time_builds',
  },
  fintech_rails: {
    appId: 'fintech_rails',
    driver: {
      label: 'Monthly Active Wallet Users',
      unit: 'K users',
      min: 20,
      max: 500,
      step: 10,
      defaultValue: 100,
      description: 'Digital wallet, MFS settlement rails, automated KYC/AML screening, and TEE key enclaves.',
    },
    annualRecurringFn: (kUsers) => Math.round(24000 + kUsers * 180),
    annualClientValueFn: (kUsers) => Math.round(165000 + kUsers * 1650),
    western3YrTcoFn: (kUsers) => Math.round(290000 + kUsers * 1200 * 3),
    recurringGmPct: 62,
    evidenceBasis: 'bKash & LankaBangla sector benchmarks: 6–9 mo faster time-to-market & ~50% lower AML review cost.',
    valueMechanism: 'Eliminates $250K+ Western custom wallet build while automating compliance and settlement reconciliation.',
    revenueScopeId: 'one_time_builds',
  },
  mis_erp: {
    appId: 'mis_erp',
    driver: {
      label: 'Connected Branches / Showrooms',
      unit: 'sites',
      min: 5,
      max: 120,
      step: 5,
      defaultValue: 30,
      description: 'Multi-branch stock MIS, HRM/RBAC, work orders, and HelloKhata voice bookkeeping.',
    },
    annualRecurringFn: (sites) => Math.round(9600 + sites * 280),
    annualClientValueFn: (sites) => Math.round(52000 + sites * 3400),
    western3YrTcoFn: (sites) => Math.round(125000 + sites * 1800 * 3),
    recurringGmPct: 60,
    evidenceBasis: 'BEST Electronics (65+ showrooms): 1.5%–3.0% inventory shrinkage reduction and unified branch payroll.',
    valueMechanism: 'Replaces fragmented spreadsheet/legacy ERPs with real-time branch stock visibility and voice entry.',
    revenueScopeId: 'captive_ecosystem',
  },
  genai_bi: {
    appId: 'genai_bi',
    driver: {
      label: 'Executive & Analyst Users',
      unit: 'seats',
      min: 10,
      max: 150,
      step: 5,
      defaultValue: 35,
      description: 'Natural-language-to-SQL conversational analytics over PostgreSQL/Kafka with OPA row-level security.',
    },
    annualRecurringFn: (seats) => Math.round(14400 + seats * 220),
    annualClientValueFn: (seats) => Math.round(78000 + seats * 2600),
    western3YrTcoFn: (seats) => Math.round(135000 + seats * 1400 * 3),
    recurringGmPct: 58,
    evidenceBasis: 'Jotax Oy (Finland) proof: -80% ad-hoc reporting turnaround at 96% query accuracy.',
    valueMechanism: 'Saves 2–4 analyst FTEs of manual SQL/BI turnaround and avoids escalating cloud BI seat licenses.',
    revenueScopeId: 'recurring_saas',
  },
  legacy_mod: {
    appId: 'legacy_mod',
    driver: {
      label: 'Legacy Schema Tables / Silos',
      unit: 'schemas',
      min: 10,
      max: 80,
      step: 2,
      defaultValue: 28,
      description: 'Zero-downtime database virtualization, strangler-fig microservices, and event CDC extraction.',
    },
    annualRecurringFn: (schemas) => Math.round(12000 + schemas * 320),
    annualClientValueFn: (schemas) => Math.round(68000 + schemas * 3100),
    western3YrTcoFn: (schemas) => Math.round(220000 + schemas * 2400 * 3),
    recurringGmPct: 52,
    evidenceBasis: 'Jotax Oy (28+ virtual relations): 30%–45% lower legacy maintenance/downtime without rip-and-replace risk.',
    valueMechanism: 'Unlocks modern AI/API access over decades-old silos at a fraction of a $250K–$400K Western rewrite.',
    revenueScopeId: 'one_time_builds',
  },
  cyber_sla: {
    appId: 'cyber_sla',
    driver: {
      label: 'Protected Enclave Nodes',
      unit: 'nodes',
      min: 2,
      max: 30,
      step: 1,
      defaultValue: 6,
      description: '24/7 managed SecOps, continuous VAPT, AMD SEV-SNP / Intel TDX TEE hardening, and audit readiness.',
    },
    annualRecurringFn: (nodes) => Math.round(34400 + Math.max(0, nodes - 4) * 2400),
    annualClientValueFn: (nodes) => Math.round(128000 + nodes * 9500),
    western3YrTcoFn: (nodes) => Math.round((145000 + nodes * 6800) * 3),
    recurringGmPct: 42,
    evidenceBasis: 'Regulated BFSI & Healthcare: replaces $120K–$180K/yr in-house SecOps & lowers audit/breach exposure.',
    valueMechanism: 'Delivers continuous HIPAA, SOC 2, ISO 27001, and BB ICT v4.0 readiness via Dhaka 24/7 enclave team.',
    revenueScopeId: 'managed_retainers',
  },
  datasets: {
    appId: 'datasets',
    driver: {
      label: 'Curated Domain Packs',
      unit: 'packs',
      min: 1,
      max: 8,
      step: 1,
      defaultValue: 2,
      description: '1.4M+ PII-stripped Bangla, Banglish, EN, HI, UR handwritten ICR, voice, clinical & vision corpora.',
    },
    annualRecurringFn: (packs) => Math.round(packs * 6000),
    annualClientValueFn: (packs) => Math.round(packs * 115000),
    western3YrTcoFn: (packs) => Math.round(packs * 160000),
    recurringGmPct: 80,
    evidenceBasis: 'Regional AI Labs & Fintechs: avoids 6–12 months and $90K–$160K internal labeling/QA buildout.',
    valueMechanism: 'Immediately boosts Bangla/South Asian model accuracy with zero-PII compliance clearance.',
    revenueScopeId: 'ip_royalties',
  },
  spatial_xr: {
    appId: 'spatial_xr',
    driver: {
      label: 'Certified Operators / Trainees',
      unit: 'staff/yr',
      min: 25,
      max: 400,
      step: 25,
      defaultValue: 120,
      description: 'VirtuTrain360 VR cleanroom training, UE5 Digital Twins with AI guides, and reusable 3D IP.',
    },
    annualRecurringFn: (staff) => Math.round(12000 + staff * 75),
    annualClientValueFn: (staff) => Math.round(95000 + staff * 1150),
    western3YrTcoFn: (staff) => Math.round(240000 + staff * 650 * 3),
    recurringGmPct: 82,
    evidenceBasis: 'Samsung Biologics & Apollo JMI: 40%–60% faster cleanroom SOP onboarding with zero facility downtime.',
    valueMechanism: 'Replaces costly physical cleanroom shutdowns for training while compounding reusable 3D facility IP.',
    revenueScopeId: 'ip_royalties',
  },
  voice_ai: {
    appId: 'voice_ai',
    driver: {
      label: 'Automated Voice Minutes',
      unit: 'K min/mo',
      min: 10,
      max: 250,
      step: 10,
      defaultValue: 50,
      description: 'Sub-600ms on-prem/hybrid Bangla, Banglish, EN, HI, UR STT-TTS agents & WhatsApp Voice ERP.',
    },
    annualRecurringFn: (kMin) => Math.round(kMin * 1000 * 0.045 * 12),
    annualClientValueFn: (kMin) => Math.round(kMin * 1000 * 0.24 * 12),
    western3YrTcoFn: (kMin) => Math.round(95000 + kMin * 1000 * 0.16 * 36),
    recurringGmPct: 68,
    evidenceBasis: 'BPO & Banking Call Centers: automates 45%–65% of Tier-1 calls at ~60% lower cost/min than live agents.',
    valueMechanism: 'Handles code-switched regional calls 24/7 on-prem without leaking voice recordings to third-party APIs.',
    revenueScopeId: 'recurring_saas',
  },
  workflow_ai: {
    appId: 'workflow_ai',
    driver: {
      label: 'Automated Monthly Tickets / Runs',
      unit: 'K runs/mo',
      min: 5,
      max: 120,
      step: 5,
      defaultValue: 25,
      description: 'Multi-agent Corrective RAG + OPA guardrails across 8 enterprise verticals (Think · Learn · Solve).',
    },
    annualRecurringFn: (kRuns) => Math.round(12000 + kRuns * 320),
    annualClientValueFn: (kRuns) => Math.round(58000 + kRuns * 3600),
    western3YrTcoFn: (kRuns) => Math.round(140000 + kRuns * 1800 * 3),
    recurringGmPct: 60,
    evidenceBasis: 'SecureBank AI & 8 Verticals: automates 30%–50% of L1 ops/CRM/banking workflows with audit trails.',
    valueMechanism: 'Cuts ticket resolution times and labor overhead while enforcing deterministic OPA escalation gates.',
    revenueScopeId: 'recurring_saas',
  },
  branding_geo: {
    appId: 'branding_geo',
    driver: {
      label: 'Monthly E-Com / Catalog Sessions',
      unit: 'K visits/mo',
      min: 20,
      max: 500,
      step: 10,
      defaultValue: 80,
      description: 'AI-Native SEO/GEO, Zero-App WebAR Try-On, 3D Anamorphic DOOH, and 365 Exchange Circular CRM.',
    },
    annualRecurringFn: (kVisits) => Math.round(27600 + Math.max(0, kVisits - 80) * 65),
    annualClientValueFn: (kVisits) => Math.round(62000 + kVisits * 1150),
    western3YrTcoFn: (kVisits) => Math.round((88000 + kVisits * 420) * 3),
    recurringGmPct: 38,
    evidenceBasis: 'ISHO retail proof: +28% conversion lift and -22% product returns via WebAR Try-On & GEO.',
    valueMechanism: 'Directly lifts online order conversion while cutting reverse-logistics return costs (30.4% GM retainer).',
    revenueScopeId: 'managed_retainers',
  },
  iot_edge: {
    appId: 'iot_edge',
    driver: {
      label: 'Connected Edge Stations / Assets',
      unit: 'stations',
      min: 10,
      max: 250,
      step: 10,
      defaultValue: 80,
      description: '<50ms quantized edge inference, Wasm/MQTT industrial & EV battery gateways, and Green AI ESG ledger.',
    },
    annualRecurringFn: (stations) => Math.round(12000 + stations * 165),
    annualClientValueFn: (stations) => Math.round(48000 + stations * 2150),
    western3YrTcoFn: (stations) => Math.round(175000 + stations * 1100 * 3),
    recurringGmPct: 56,
    evidenceBasis: 'X Ltd (80 BaaS swap stations / 480 EVs): 12%–18% battery lifecycle extension & reduced station downtime.',
    valueMechanism: 'Detects thermal/pack faults in <50ms locally while tracking ESG carbon savings without cloud egress.',
    revenueScopeId: 'captive_ecosystem',
  },
};

export interface ProductRoiResult {
  appId: string;
  scale: number;
  oneTimeBuildUsd: number;
  serverCapexUsd: number;
  annualRecurringUsd: number;
  year1ClientInvestmentUsd: number;
  year1ClientValueUsd: number;
  year1NetBenefitUsd: number;
  client12MoRoiPct: number;
  paybackMonths: number;
  spenta3YrTcoUsd: number;
  western3YrTcoUsd: number;
  threeYrSavingsUsd: number;
  spenta3YrLtvUsd: number;
  spenta3YrBlendedGmPct: number;
}

export function computeProductRoi(
  appId: string,
  scaleOverride?: number,
  serverTierOverride?: ServerTierId,
  includeHardwareCapex = true,
): ProductRoiResult {
  const app = SPENTA_APPS.find((a) => a.id === appId) ?? SPENTA_APPS[0];
  const profile = PRODUCT_ROI_PROFILES[app.id] ?? PRODUCT_ROI_PROFILES.healthcare_erp;
  const scale = scaleOverride ?? profile.driver.defaultValue;
  const tierId = serverTierOverride ?? app.minServerTier;
  const serverCapexUsd = includeHardwareCapex ? SERVER_TIERS[tierId].capexMidUsd : 0;

  const isRetainer = app.billingCadence === 'quarterly-retainer';
  const oneTimeBuildUsd = isRetainer ? 0 : app.setupUsd;
  const annualRecurringUsd = profile.annualRecurringFn(scale);
  const year1ClientInvestmentUsd = oneTimeBuildUsd + annualRecurringUsd + serverCapexUsd;
  const year1ClientValueUsd = profile.annualClientValueFn(scale);
  const year1NetBenefitUsd = year1ClientValueUsd - year1ClientInvestmentUsd;

  const client12MoRoiPct =
    year1ClientInvestmentUsd > 0
      ? Math.round((year1NetBenefitUsd / year1ClientInvestmentUsd) * 100)
      : 0;
  const monthlyValue = year1ClientValueUsd / 12;
  const paybackMonths =
    monthlyValue > 0 ? Math.max(1.2, Number((year1ClientInvestmentUsd / monthlyValue).toFixed(1))) : 12;

  const spenta3YrTcoUsd = oneTimeBuildUsd + serverCapexUsd + annualRecurringUsd * 3;
  const western3YrTcoUsd = profile.western3YrTcoFn(scale);
  const threeYrSavingsUsd = Math.max(0, western3YrTcoUsd - spenta3YrTcoUsd);

  const spenta3YrLtvUsd = oneTimeBuildUsd + annualRecurringUsd * 3;
  const grossProfit3Yr =
    oneTimeBuildUsd * (app.gmPct / 100) + annualRecurringUsd * 3 * (profile.recurringGmPct / 100);
  const spenta3YrBlendedGmPct =
    spenta3YrLtvUsd > 0 ? Number(((grossProfit3Yr / spenta3YrLtvUsd) * 100).toFixed(1)) : app.gmPct;

  return {
    appId: app.id,
    scale,
    oneTimeBuildUsd,
    serverCapexUsd,
    annualRecurringUsd,
    year1ClientInvestmentUsd,
    year1ClientValueUsd,
    year1NetBenefitUsd,
    client12MoRoiPct,
    paybackMonths,
    spenta3YrTcoUsd,
    western3YrTcoUsd,
    threeYrSavingsUsd,
    spenta3YrLtvUsd,
    spenta3YrBlendedGmPct,
  };
}

export const REGIONAL_HUBS: RegionalHubSpec[] = [
  {
    id: 'san-jose',
    name: 'San Jose, California',
    role: 'US Commercial HQ & Enterprise Architecture',
    regionLabel: 'Silicon Valley · North America',
    latitude: 37.3382,
    longitude: -121.8863,
    costProfile: 'Executive closing, HIPAA/SOC 2 enterprise sales, strategic biopharma & fintech partnerships',
    targetVerticals: ['Biopharma XR', 'Healthcare Systems', 'Enterprise GenAI BI'],
    presetQueries: [
      {
        label: 'Major Hospital & Health Networks',
        prompt:
          'Identify major hospital networks and regional healthcare systems near San Jose and Silicon Valley suitable for on-premises HL7/FHIR AI Healthcare ERP and clinical digital twin deployments.',
      },
      {
        label: 'Biopharma & Cleanroom Facilities',
        prompt:
          'Locate key biopharma, biotech manufacturing, and cleanroom life-science centers around San Jose and the Bay Area that are strong enterprise targets for VirtuTrain360 VR training and digital twins.',
      },
      {
        label: 'Regional Banks & Fintech Corridors',
        prompt:
          'Find prominent regional banks, credit unions, and enterprise fintech hubs near San Jose and San Francisco Bay Area for air-gapped Document Intelligence (ICR) and TEE-hardened financial automation.',
      },
    ],
  },
  {
    id: 'sydney',
    name: 'Sydney & Melbourne, Australia',
    role: 'APAC Commercial & Enterprise Delivery Office',
    regionLabel: 'ANZ · Asia-Pacific Corridor',
    latitude: -33.8688,
    longitude: 151.2093,
    costProfile: 'APAC executive governance, ANZ healthcare & retail expansion, sovereign private-VPC compliance',
    targetVerticals: ['ANZ Hospital Groups', 'Retail & Circular CRM', 'Managed Cyber SLA'],
    presetQueries: [
      {
        label: 'ANZ Private & Public Hospital Groups',
        prompt:
          'Identify major private and public hospital groups and diagnostic networks near Sydney, Australia that represent strong targets for sovereign AI Healthcare ERP and clinical shift-handover automation.',
      },
      {
        label: 'Financial District & Banking HQs',
        prompt:
          'Locate major banking headquarters, super funds, and regulated financial institutions in Sydney CBD suitable for on-premises Document AI (ICR), Conversational GenAI BI, and 24/7 Cyber Security SLAs.',
      },
      {
        label: 'Logistics, EV & Industrial Corridors',
        prompt:
          'Find key industrial logistics parks, retail distribution centers, and EV fleet corridors around Greater Sydney suitable for Modular MIS, IoT Edge (<50ms), and Green AI carbon planning.',
      },
    ],
  },
  {
    id: 'dhaka',
    name: 'Dhaka, Bangladesh',
    role: '20-FTE Sovereign R&D Enclave & Captive Testbed',
    regionLabel: 'SAARC · Dual-Shore Engineering Hub',
    latitude: 23.8103,
    longitude: 90.4125,
    costProfile: '$12.98/hr fully loaded ($11.50/hr base + $1.48 enclave overhead · 64.8M BDT/yr · ~$18.54/hr @ 70% util.)',
    targetVerticals: ['BB ICT v4.0 Banks & MFS', 'Multi-Site Hospitals', 'Retail Showrooms & EV BaaS'],
    presetQueries: [
      {
        label: 'Leading Hospitals & Diagnostic Centers',
        prompt:
          'Identify major multi-specialty hospitals and diagnostic centers in Dhaka, Bangladesh (such as Gulshan, Dhanmondi, and Bashundhara medical corridors) relevant to Spenta AI Healthcare ERP and clinical AI.',
      },
      {
        label: 'Motijheel & Gulshan Banking HQs',
        prompt:
          'Locate major commercial bank headquarters and MFS institutions across Motijheel and Gulshan in Dhaka that require Bangladesh Bank ICT v4.0 compliant on-premises ICR and Fintech Suite rails.',
      },
      {
        label: 'Tech Parks, Retail & EV Corridors',
        prompt:
          'Find prominent technology parks, electronics retail corridors, and urban mobility hubs in Dhaka suitable for Spenta R&D talent, BEST showroom MIS rollouts, and X Ltd EV battery-swap networks.',
      },
    ],
  },
];
