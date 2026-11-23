import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  GitBranch,
  Layers,
  Link2,
  Moon,
  Plus,
  RotateCcw,
  Server,
  Shield,
  Sun,
  X,
} from 'lucide-react';
import {
  SERVER_TIERS,
  SOVEREIGN_STACK_LAYERS,
  SPENTA_APPS,
} from '../data/spentaManifest';
import {
  DEPLOYMENT_PROFILES,
  DEPLOYMENT_TARGET_ORDER,
  DeploymentProfileSpec,
  DeploymentProviderId,
} from '../data/deploymentProfiles';
import { downloadMarkdownFile } from '../data/promptThemeStudioData';
import { useTheme } from '../context/ThemeContext';
import { useStack } from '../store/StackContext';
import { usePathwayBrainSync } from '../hooks/usePathwayBrainSync';
import { copyTextWithFallback } from '../utils/shareUrlCodec';
import {
  ActivationHistoryEntry,
  PathwayHopPlayback,
  PlaybackSpeed,
  RequestWalkthroughTrace,
} from './PathwayHopPlayback';
import {
  ArchitectureNodeTooltip,
  ArchitectureTooltipData,
  getElementAnchorPoint,
  TooltipAccent,
} from './ArchitectureNodeTooltip';
import {
  PathwayMiniMapPillar,
  PathwayPanZoomStage,
} from './PathwayPanZoomStage';

export type { DeploymentProviderId };

const REQUEST_TRACES: RequestWalkthroughTrace[] = [
  {
    id: 'banking-icr',
    label: 'Banking ICR → 0.88 OPA Gate',
    subtitle: 'Handwritten Bangla/EN SME loan packet processed inside client firewall',
    hops: [
      {
        stepNumber: 1,
        trunkId: 'trunk-core',
        branchId: 'branch-layer-L1',
        nodeCode: 'L1',
        title: 'Ingress & Local TLS Termination',
        transitionLabel: 'mTLS',
        payloadSummary: '300 DPI multi-page loan PDF + NID scan ingested via branch scanner queue.',
        latencyTarget: '140ms',
        pitfallMitigation: 'Strip EXIF/PII metadata outside enclave; enforce zero external DNS egress.',
        highlightCompKind: 'protocol',
        metadataState: {
          stage: 'Ingress Terminated',
          enclaveState: 'Zero-Egress LAN Ingest',
          policyDecision: 'mTLS Cert Verified',
          auditProof: 'Packet Hash Queued',
          latencyMs: 140,
        },
      },
      {
        stepNumber: 2,
        trunkId: 'trunk-ops',
        branchId: 'branch-app-icr_ops',
        nodeCode: 'ICR',
        title: 'LLaMA 3.2 Vision + LayoutLMv3 Extraction',
        transitionLabel: 'Vision',
        payloadSummary: '14 structured collateral, guarantor & handwritten Bangla fields extracted locally.',
        latencyTarget: '18.4s (<30s SLA)',
        pitfallMitigation: 'Quantized INT4/FP8 batching prevents VRAM OOM on 96GB Tier-3 baselines.',
        highlightCompKind: 'capability',
        metadataState: {
          stage: '14 Fields Extracted',
          enclaveState: 'Local VRAM Tensor Inference',
          policyDecision: 'PII Redaction Active',
          auditProof: 'BBox Coordinates Logged',
          latencyMs: 18400,
        },
      },
      {
        stepNumber: 3,
        trunkId: 'trunk-governance',
        branchId: 'branch-opa-gate',
        nodeCode: 'OPA',
        title: '0.88 Confidence OPA Circuit Breaker',
        transitionLabel: 'Score',
        payloadSummary: 'Field-level score evaluated (0.94 Pass vs 0.81 Hold) against opa.bfsi.icr_v4.',
        latencyTarget: '24ms',
        pitfallMitigation: 'Any signature smudge <0.88 halts auto-commit and routes to React verifier.',
        highlightCompKind: 'protocol',
        metadataState: {
          stage: 'OPA 0.88 Scored',
          enclaveState: 'Deterministic Rego Sandbox',
          policyDecision: '0.94 Pass / <0.88 HITL',
          auditProof: 'Policy Verdict Signed',
          latencyMs: 24,
        },
      },
      {
        stepNumber: 4,
        trunkId: 'trunk-core',
        branchId: 'branch-layer-L5',
        nodeCode: 'L5',
        title: 'Immutable PostgreSQL / Kafka Core Commit',
        transitionLabel: 'Commit',
        payloadSummary: 'Signed SHA-256 inference hash + extracted JSON written to core banking ledger.',
        latencyTarget: '38ms',
        pitfallMitigation: 'Idempotency key prevents duplicate loan disbursements on retry.',
        highlightCompKind: 'capability',
        metadataState: {
          stage: 'Ledger Committed',
          enclaveState: 'Encrypted Core Bus',
          policyDecision: 'Idempotent Write Approved',
          auditProof: 'SHA-256 Ledger Sealed',
          latencyMs: 38,
        },
      },
      {
        stepNumber: 5,
        trunkId: 'trunk-hardware',
        branchId: 'branch-tier-3',
        nodeCode: 'T3',
        title: 'On-Prem Tier-3 Enclave Attestation',
        transitionLabel: 'NVMe',
        payloadSummary: 'Audit trail archived to local encrypted NVMe/NAS with zero cloud bytes sent.',
        latencyTarget: '12ms',
        pitfallMitigation: 'Daily offline snapshot verification prevents silent ledger corruption.',
        highlightCompKind: 'hardware',
        metadataState: {
          stage: 'Enclave Attested',
          enclaveState: 'SEV-SNP / TDX Verified',
          policyDecision: '0 Bytes Cloud Egress',
          auditProof: 'WORM NVMe Archived',
          latencyMs: 12,
        },
      },
    ],
  },
  {
    id: 'hospital-hl7',
    label: 'Hospital HL7 Shift Handover',
    subtitle: 'Clinical ERP + Handwritten Rx OCR + Nurse Rostering inside hospital LAN',
    hops: [
      {
        stepNumber: 1,
        trunkId: 'trunk-ops',
        branchId: 'branch-app-healthcare_erp',
        nodeCode: 'HL7',
        title: 'HL7/FHIR Ward Vitals & Rx Intake',
        transitionLabel: 'FHIR',
        payloadSummary: 'Aggregates 24-bed ICU vitals stream, lab flags, and handwritten discharge scripts.',
        latencyTarget: '110ms',
        pitfallMitigation: 'Strict HL7 v2/FHIR schema validation drops malformed telemetry before LLM prompt.',
        highlightCompKind: 'capability',
        metadataState: {
          stage: 'FHIR Schema Validated',
          enclaveState: 'Hospital Intranet PHI',
          policyDecision: 'Ward RBAC Scoped',
          auditProof: 'HL7 Stream Checksummed',
          latencyMs: 110,
        },
      },
      {
        stepNumber: 2,
        trunkId: 'trunk-core',
        branchId: 'branch-layer-L3',
        nodeCode: 'L3',
        title: 'Local Clinical LLM Synthesis',
        transitionLabel: 'cRAG',
        payloadSummary: 'Generates prioritized shift handover brief with drug-interaction warnings.',
        latencyTarget: '1.9s',
        pitfallMitigation: 'Corrective RAG grounds dosage checks solely against approved hospital formulary.',
        highlightCompKind: 'protocol',
        metadataState: {
          stage: 'Formulary cRAG Grounded',
          enclaveState: 'Local Clinical Enclave',
          policyDecision: 'Zero External API Calls',
          auditProof: 'Citation Links Attached',
          latencyMs: 1900,
        },
      },
      {
        stepNumber: 3,
        trunkId: 'trunk-governance',
        branchId: 'branch-opa-gate',
        nodeCode: 'HITL',
        title: 'Clinical Safety 0.88 HITL Gate',
        transitionLabel: 'Gate',
        payloadSummary: 'Flags ambiguous dosage (0.81 confidence) for attending MD sign-off queue.',
        latencyTarget: '19ms',
        pitfallMitigation: 'Zero silent clinical auto-commits when confidence drops below 0.88.',
        highlightCompKind: 'capability',
        metadataState: {
          stage: '0.81 Routed to MD',
          enclaveState: 'OPA Clinical Guardrail',
          policyDecision: 'Mandatory Clinician Sign-Off',
          auditProof: 'Override Queue Logged',
          latencyMs: 19,
        },
      },
      {
        stepNumber: 4,
        trunkId: 'trunk-core',
        branchId: 'branch-layer-L6',
        nodeCode: 'L6',
        title: 'Omni-Channel Clinician Handoff UI',
        transitionLabel: 'Push',
        payloadSummary: 'Delivers verified handover checklist to nursing tablet with highlighted Rx crops.',
        latencyTarget: '45ms',
        pitfallMitigation: 'RBAC ward scoping prevents cross-department patient PHI exposure.',
        highlightCompKind: 'protocol',
        metadataState: {
          stage: 'Shift Brief Delivered',
          enclaveState: 'Ward Tablet TLS Session',
          policyDecision: 'HIPAA Audit Complete',
          auditProof: 'Sign-Off Timestamp Sealed',
          latencyMs: 45,
        },
      },
    ],
  },
  {
    id: 'xltd-baas',
    label: 'X Ltd <50ms EV Battery Swap',
    subtitle: 'Sub-50ms Wasm/MQTT edge inference across 80 BaaS stations & 480 EVs',
    hops: [
      {
        stepNumber: 1,
        trunkId: 'trunk-governance',
        branchId: 'branch-xltd-mobility',
        nodeCode: 'BMS',
        title: 'BaaS Cabinet & EV BMS Telemetry Burst',
        transitionLabel: 'MQTT',
        payloadSummary: 'Cell voltage, thermal gradient, and rider RFID streamed over local MQTT broker.',
        latencyTarget: '9ms',
        pitfallMitigation: 'Edge store-and-forward ring buffer survives 4G backhaul blackouts.',
        highlightCompKind: 'proof',
        metadataState: {
          stage: 'BMS Frame Ingested',
          enclaveState: 'Cabinet Edge Broker',
          policyDecision: 'Device mTLS Authenticated',
          auditProof: 'RFID + Pack ID Paired',
          latencyMs: 9,
        },
      },
      {
        stepNumber: 2,
        trunkId: 'trunk-exp',
        branchId: 'branch-app-iot_edge',
        nodeCode: 'EDGE',
        title: 'Wasm Quantized Edge Anomaly Scoring',
        transitionLabel: 'Wasm',
        payloadSummary: 'Local Green AI model predicts cell degradation & selects optimal charged bay.',
        latencyTarget: '22ms (<50ms SLA)',
        pitfallMitigation: 'Thermal threshold hardware interlock overrides software if cell >58°C.',
        highlightCompKind: 'capability',
        metadataState: {
          stage: 'Thermal & SoH Cleared',
          enclaveState: 'Sandboxed Wasm Runtime',
          policyDecision: 'Cell <58°C Interlock Pass',
          auditProof: 'Bay #4 Optimal Selected',
          latencyMs: 22,
        },
      },
      {
        stepNumber: 3,
        trunkId: 'trunk-core',
        branchId: 'branch-layer-L1',
        nodeCode: 'IIoT',
        title: 'Sovereign IIoT Gateway Actuation',
        transitionLabel: 'Unlock',
        payloadSummary: 'Unlocks verified battery bay and signs swap telemetry event.',
        latencyTarget: '11ms',
        pitfallMitigation: 'Mutual TLS device certificates block spoofed cabinet unlock commands.',
        highlightCompKind: 'protocol',
        metadataState: {
          stage: 'Bay Latch Actuated',
          enclaveState: 'Signed IIoT Bus',
          policyDecision: 'Actuator Command Verified',
          auditProof: 'Swap Event Signed',
          latencyMs: 11,
        },
      },
      {
        stepNumber: 4,
        trunkId: 'trunk-hardware',
        branchId: 'branch-tier-4',
        nodeCode: 'T4',
        title: 'Tier-4 Branch Node ESG Carbon Sync',
        transitionLabel: 'ESG',
        payloadSummary: 'Commits Scope 2/3 carbon savings to regional X Ltd fleet ledger.',
        latencyTarget: '34ms',
        pitfallMitigation: 'Idempotent batch replay prevents double-counted carbon offset credits.',
        highlightCompKind: 'proof',
        metadataState: {
          stage: 'ESG Ledger Reconciled',
          enclaveState: 'Tier-4 Edge Appliance',
          policyDecision: 'Idempotent Carbon Commit',
          auditProof: 'Scope 2/3 Credit Sealed',
          latencyMs: 34,
        },
      },
    ],
  },
];

export interface PathwayComposition {
  id: string;
  code: string;
  label: string;
  detail: string;
  metric: string;
  kind: 'capability' | 'protocol' | 'hardware' | 'synergy' | 'proof';
  linkedAppId?: string;
}

export interface PathwayBranchNode {
  id: string;
  code: string;
  title: string;
  role: string;
  metric: string;
  summary: string;
  layers?: string[];
  proofClient?: string;
  appId?: string;
  compositions: PathwayComposition[];
}

export interface PathwayTrunkNode {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  metric: string;
  summary: string;
  accentTone: 'navy' | 'emerald' | 'teal' | 'amber';
  branches: PathwayBranchNode[];
}

type HoveredTipPayload = Omit<ArchitectureTooltipData, 'x' | 'y'>;

interface InteractiveArchitecturePathwayProps {
  compact?: boolean;
  defaultExpandedTrunks?: string[];
  syncedPolarity?: 'light' | 'dark';
  onPolarityChange?: (next: 'light' | 'dark') => void;
}

function buildPathwayTree(profile: DeploymentProfileSpec): PathwayTrunkNode[] {
  const opsApps = SPENTA_APPS.filter((a) => a.engine === 'operations');
  const expApps = SPENTA_APPS.filter((a) => a.engine === 'experience' || a.engine === 'fusion');

  return [
    {
      id: 'trunk-core',
      index: '01',
      title: 'Sovereign Fusion Core (L1–L6)',
      subtitle: `${profile.enclaveBoundary} · ${profile.transport}`,
      metric: `6 Layers · ${profile.latencyBudget}`,
      summary:
        'Vertical sovereign kernel isolating every model weight, vector store, and enterprise ledger inside customer-controlled boundaries.',
      accentTone: 'navy',
      branches: SOVEREIGN_STACK_LAYERS.map((layer) => ({
        id: `branch-layer-${layer.id}`,
        code: layer.id,
        title: layer.title,
        role: `${layer.subtitle} (${profile.shortLabel})`,
        metric: layer.slaMetric,
        summary: layer.summary,
        layers: [layer.id],
        compositions: [
          ...layer.protocols.slice(0, 2).map((p, i) => ({
            id: `${layer.id}-proto-${i}`,
            code: `${layer.id}.P${i + 1}`,
            label: p,
            detail: `Transport enforced under ${profile.shortLabel}: ${profile.transport}.`,
            metric: layer.slaMetric,
            kind: 'protocol' as const,
          })),
          ...layer.securityControls.slice(0, 2).map((c, i) => ({
            id: `${layer.id}-sec-${i}`,
            code: `${layer.id}.S${i + 1}`,
            label: c,
            detail: `Boundary attested via ${profile.enclaveBoundary}.`,
            metric: 'Attested',
            kind: 'capability' as const,
          })),
        ],
      })),
    },
    {
      id: 'trunk-ops',
      index: '02',
      title: 'Operations Engine (Core ERP & Regulated AI)',
      subtitle: 'Healthcare, Banking ICR, Sovereign MIS, Cyber SLA & Legacy Modernization',
      metric: `${opsApps.length} Composable Modules`,
      summary:
        'Mission-critical operational suites engineered for regulated hospitals, Tier-1 banks, and multi-entity conglomerates.',
      accentTone: 'emerald',
      branches: opsApps.map((app, idx) => ({
        id: `branch-app-${app.id}`,
        code: `02.${idx + 1}`,
        title: app.shortName,
        role: app.category,
        metric: `${app.setupLabel} · ${app.gmPct.toFixed(1)}% GM`,
        summary: app.tagline,
        layers: app.layers,
        proofClient: app.proofClient,
        appId: app.id,
        compositions: [
          ...app.coreCapabilities.map((cap, cIdx) => ({
            id: `${app.id}-cap-${cIdx}`,
            code: `C${cIdx + 1}`,
            label: cap,
            detail: `Core functional block shipped with ${app.name}.`,
            metric: `Tier ${app.minServerTier} Min`,
            kind: 'capability' as const,
          })),
          ...app.integratesWith.slice(0, 2).map((synId, sIdx) => ({
            id: `${app.id}-syn-${sIdx}`,
            code: `SYN`,
            label: `Integrates → ${SPENTA_APPS.find((x) => x.id === synId)?.shortName ?? synId}`,
            detail: `Zero-ETL event bus integration routed over ${profile.transport}.`,
            metric: 'Native Bus',
            kind: 'synergy' as const,
            linkedAppId: synId,
          })),
        ],
      })),
    },
    {
      id: 'trunk-exp',
      index: '03',
      title: 'Experience, Spatial XR & IR4 Engine',
      subtitle: 'Digital Twins, Multilingual Voice AI, WebAR Retail, IoT Edge & Agentic Workflows',
      metric: `${expApps.length} Composable Modules`,
      summary:
        'High-margin experience, spatial twin, voice assistant, and quantized <50ms edge intelligence modules.',
      accentTone: 'teal',
      branches: expApps.map((app, idx) => ({
        id: `branch-app-${app.id}`,
        code: `03.${idx + 1}`,
        title: app.shortName,
        role: app.category,
        metric: `${app.setupLabel} · ${app.gmPct.toFixed(1)}% GM`,
        summary: app.tagline,
        layers: app.layers,
        proofClient: app.proofClient,
        appId: app.id,
        compositions: [
          ...app.coreCapabilities.map((cap, cIdx) => ({
            id: `${app.id}-cap-${cIdx}`,
            code: `C${cIdx + 1}`,
            label: cap,
            detail: `Core capability inside ${app.name}.`,
            metric: app.layers.join('/'),
            kind: 'capability' as const,
          })),
          ...app.integratesWith.slice(0, 2).map((synId, sIdx) => ({
            id: `${app.id}-syn-${sIdx}`,
            code: `SYN`,
            label: `Integrates → ${SPENTA_APPS.find((x) => x.id === synId)?.shortName ?? synId}`,
            detail: `Bidirectional telemetry and workflow trigger over ${profile.transport}.`,
            metric: 'Native Bus',
            kind: 'synergy' as const,
            linkedAppId: synId,
          })),
        ],
      })),
    },
    {
      id: 'trunk-hardware',
      index: '04',
      title: 'On-Prem Server Matrix & Dual-Shore Delivery',
      subtitle: `${profile.costPosture} · 20-FTE Dhaka R&D Hub`,
      metric: '4 Tiers · $12.98/hr Loaded Pod',
      summary:
        'Predictable CapEx server appliances eliminating variable cloud GPU burn, paired with dual-shore San Jose · Australia · Dhaka engineering pods.',
      accentTone: 'navy',
      branches: Object.values(SERVER_TIERS).map((tier) => ({
        id: `branch-tier-${tier.id}`,
        code: tier.code,
        title: tier.name,
        role: tier.modelScale,
        metric: `${tier.capex} · ${tier.speed}`,
        summary: `${tier.hardware} — ${tier.idealFor}`,
        compositions: [
          {
            id: `tier-${tier.id}-hw`,
            code: 'HW',
            label: tier.hardware,
            detail: `Unified memory / VRAM envelope: ${tier.vramRam}.`,
            metric: tier.vramRam,
            kind: 'hardware',
          },
          {
            id: `tier-${tier.id}-st`,
            code: 'NVMe',
            label: `Storage: ${tier.storage}`,
            detail: `Configured for ${profile.shortLabel} with encrypted audit ledger.`,
            metric: tier.capex,
            kind: 'hardware',
          },
          {
            id: `tier-${tier.id}-tp`,
            code: 'TPS',
            label: `Throughput: ${tier.speed}`,
            detail: tier.idealFor,
            metric: tier.modelScale,
            kind: 'proof',
          },
        ],
      })),
    },
    {
      id: 'trunk-governance',
      index: '05',
      title: '0.88 OPA HITL Gate & Captive Distribution Proofs',
      subtitle: 'Policy-as-Code verification circuit breaker + BEST Retail & X Ltd Mobility rollouts',
      metric: '≥0.88 Auto · 65+ Sites',
      summary:
        'Deterministic human-in-the-loop governance verified across live sister-entity retail and EV battery-swap networks.',
      accentTone: 'amber',
      branches: [
        {
          id: 'branch-opa-gate',
          code: '05.1',
          title: '0.88 Confidence OPA Circuit Breaker',
          role: 'Deterministic Policy-as-Code Gate',
          metric: '≥0.88 Commit / <0.88 Queue',
          summary:
            'Every model inference is scored by Open Policy Agent before touching PostgreSQL/Kafka core ledgers.',
          layers: ['L5', 'L6'],
          compositions: [
            {
              id: 'opa-auto',
              code: 'PASS',
              label: 'Auto-Commit Path (Score ≥ 0.88)',
              detail: 'Cryptographically signs inference hash and commits directly to ledger.',
              metric: '<40ms',
              kind: 'protocol',
            },
            {
              id: 'opa-hitl',
              code: 'HOLD',
              label: 'Human Audit Verifier (Score < 0.88)',
              detail: 'Routes low-confidence fields to React Digital Twin side-by-side verifier.',
              metric: 'Zero Silent Errors',
              kind: 'capability',
            },
          ],
        },
        {
          id: 'branch-best-retail',
          code: '05.2',
          title: 'BEST Electronics Captive Network',
          role: 'Sister-Entity Retail Proof',
          metric: '65+ Showrooms',
          summary:
            'Production deployment across 65+ retail showrooms uniting 365 Exchange Circular CRM, WebAR Try-On, and AI-Native GEO.',
          proofClient: 'BEST Electronics',
          compositions: [
            {
              id: 'best-crm',
              code: 'CRM',
              label: '365 Exchange Circular Trade-In',
              detail: 'Automated appliance valuation, lifecycle tracking, and omnichannel POS sync.',
              metric: '65+ Stores',
              kind: 'proof',
            },
            {
              id: 'best-ar',
              code: 'AR',
              label: 'WebAR Try-On & 3D DOOH',
              detail: 'Browser-native spatial placement under AI-Native SEO & WebAR ($6.9K/qtr · 30.4% GM).',
              metric: '30.4% GM · $6.9K/qtr',
              kind: 'proof',
            },
          ],
        },
        {
          id: 'branch-xltd-mobility',
          code: '05.3',
          title: 'X Ltd EV & BaaS Mobility Grid',
          role: 'Sister-Entity Energy Proof',
          metric: '80 Stations · 480 EVs',
          summary:
            'Real-time MQTT/Wasm edge telemetry orchestrating 80 battery swap stations, 480 electric vehicles, and Green AI carbon routing.',
          proofClient: 'X Ltd Mobility',
          compositions: [
            {
              id: 'xltd-baas',
              code: 'BaaS',
              label: '80 Battery Swap Telemetry Nodes',
              detail: 'Predictive cell degradation scoring and automated station balancing.',
              metric: '<50ms Edge',
              kind: 'proof',
            },
            {
              id: 'xltd-carbon',
              code: 'ESG',
              label: 'Green AI Carbon Ledger',
              detail: 'Auditable Scope 2/3 savings calculated per swap cycle.',
              metric: '480 EVs Live',
              kind: 'proof',
            },
          ],
        },
      ],
    },
  ];
}

function buildPathwayMarkdownExport(
  tree: PathwayTrunkNode[],
  profile: DeploymentProfileSpec,
  trace: RequestWalkthroughTrace,
): string {
  const lines: string[] = [
    '# Spenta Sovereign OS — Interactive Spenta Dhaka × roadmap.sh Architecture Pathway',
    '',
    `> **Active Deployment Topology**: ${profile.title}`,
    `> **Transport**: ${profile.transport} | **Enclave**: ${profile.enclaveBoundary} | **Latency Budget**: ${profile.latencyBudget}`,
    `> **Trade-Off**: ${profile.tradeOffGuidance}`,
    `> **Pitfall & Mitigation**: ${profile.failurePitfall}`,
    '',
    `## Active Request Walkthrough: ${trace.label}`,
    ...trace.hops.map(
      (h) =>
        `${h.stepNumber}. **${h.title}** (${h.latencyTarget}) — ${h.payloadSummary} *Mitigation*: ${h.pitfallMitigation}`,
    ),
    '',
  ];
  tree.forEach((trunk) => {
    lines.push(`## ${trunk.index}. ${trunk.title} (${trunk.metric})`);
    lines.push(`${trunk.summary}\n`);
    trunk.branches.forEach((branch) => {
      lines.push(`- **${branch.code} ${branch.title}** — *${branch.role}* (${branch.metric})`);
      lines.push(`  - ${branch.summary}`);
      branch.compositions.forEach((comp) => {
        lines.push(`  - \`${comp.code}\` ${comp.label}: ${comp.detail} (${comp.metric})`);
      });
    });
    lines.push('');
  });
  return lines.join('\n');
}

export function InteractiveArchitecturePathway({
  compact = false,
  defaultExpandedTrunks = ['trunk-core', 'trunk-ops'],
  syncedPolarity,
  onPolarityChange,
}: InteractiveArchitecturePathwayProps) {
  const {
    activeTab,
    selectedIds,
    toggleApp,
    hitlConfidence,
    stackMetrics,
    deploymentTarget,
    deploymentProfile,
    setDeploymentTarget,
    buildShareUrl,
  } = useStack();
  const {
    activeBrainSelection,
    syncPathwayNode,
    inspectPathwayNodeInBrain,
    resolveHubForNode,
  } = usePathwayBrainSync();
  const [linkCopied, setLinkCopied] = useState(false);

  // Global synchronized Deployment Provider Swapping
  const activeProfile = deploymentProfile;
  const tree = useMemo(() => buildPathwayTree(activeProfile), [activeProfile]);

  // Hop-by-Hop Request Walkthrough Player + Chronological Back/Forward History state
  const [activeTraceId, setActiveTraceId] = useState<RequestWalkthroughTrace['id']>('banking-icr');
  const [activeHopIdx, setActiveHopIdx] = useState<number>(-1); // -1 = idle
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [navHistory, setNavHistory] = useState<{
    entries: ActivationHistoryEntry[];
    cursor: number;
  }>({ entries: [], cursor: -1 });
  const pendingHistorySourceRef = useRef<
    ActivationHistoryEntry['source'] | 'history-restore' | null
  >(null);

  const activeTrace = useMemo(
    () => REQUEST_TRACES.find((t) => t.id === activeTraceId) ?? REQUEST_TRACES[0],
    [activeTraceId],
  );
  const currentHop = activeHopIdx >= 0 ? activeTrace.hops[activeHopIdx] ?? null : null;

  const pushHistoryEntry = useCallback((entry: Omit<ActivationHistoryEntry, 'id'>) => {
    setNavHistory((prev) => {
      const current = prev.cursor >= 0 ? prev.entries[prev.cursor] : null;
      if (
        current &&
        current.traceId === entry.traceId &&
        current.hopIdx === entry.hopIdx &&
        current.branchId === entry.branchId
      ) {
        return prev;
      }
      const sliced = prev.entries.slice(0, prev.cursor + 1);
      const nextEntry: ActivationHistoryEntry = {
        ...entry,
        id: `${entry.traceId}-${entry.hopIdx}-${entry.branchId}-${Date.now()}-${sliced.length}`,
      };
      const nextEntries = [...sliced, nextEntry].slice(-40);
      return {
        entries: nextEntries,
        cursor: nextEntries.length - 1,
      };
    });
  }, []);

  const { theme: globalTheme, setTheme: setGlobalTheme } = useTheme();
  const effectivePolarity = syncedPolarity ?? globalTheme;

  const setPolarity = (next: 'light' | 'dark') => {
    setGlobalTheme(next);
    onPolarityChange?.(next);
  };

  const [expandedTrunks, setExpandedTrunks] = useState<string[]>(defaultExpandedTrunks);
  const [expandedBranches, setExpandedBranches] = useState<string[]>([
    'branch-layer-L5',
    'branch-app-healthcare_erp',
  ]);
  const [inspectedBranchId, setInspectedBranchId] = useState<string | null>(
    'branch-app-healthcare_erp',
  );
  const [hoveredTip, setHoveredTip] = useState<ArchitectureTooltipData | null>(null);
  const [exportedFlag, setExportedFlag] = useState(false);

  const showHoverTip = useCallback(
    (payload: HoveredTipPayload, e: React.MouseEvent) => {
      setHoveredTip({ ...payload, x: e.clientX, y: e.clientY });
    },
    [],
  );

  const moveHoverTip = useCallback((e: React.MouseEvent) => {
    setHoveredTip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev));
  }, []);

  const showFocusTip = useCallback(
    (payload: HoveredTipPayload, e: React.FocusEvent) => {
      const pt = getElementAnchorPoint(e.currentTarget);
      setHoveredTip({ ...payload, x: pt.x, y: pt.y });
    },
    [],
  );

  const clearHoverTip = useCallback(() => {
    setHoveredTip(null);
  }, []);

  // Sync tree expansion, inspector, and chronological activation history whenever active hop changes
  useEffect(() => {
    if (!currentHop) return;
    setExpandedTrunks((prev) =>
      prev.includes(currentHop.trunkId) ? prev : [...prev, currentHop.trunkId],
    );
    setExpandedBranches((prev) =>
      prev.includes(currentHop.branchId) ? prev : [...prev, currentHop.branchId],
    );
    setInspectedBranchId(currentHop.branchId);
    const hopTrunk = tree.find((t) => t.id === currentHop.trunkId);
    const hopBranch = hopTrunk?.branches.find((b) => b.id === currentHop.branchId);
    syncPathwayNode({
      trunkId: currentHop.trunkId,
      branchId: currentHop.branchId,
      appId: hopBranch?.appId,
      nodeCode: currentHop.nodeCode,
      nodeTitle: hopBranch?.title ?? currentHop.title,
    });

    const pendingSource = pendingHistorySourceRef.current;
    pendingHistorySourceRef.current = null;
    if (pendingSource === 'history-restore') return;

    pushHistoryEntry({
      traceId: activeTrace.id,
      traceLabel: activeTrace.label,
      hopIdx: activeHopIdx,
      trunkId: currentHop.trunkId,
      branchId: currentHop.branchId,
      nodeCode: currentHop.nodeCode,
      label: currentHop.title,
      source: pendingSource ?? 'step',
    });
  }, [activeTrace, activeHopIdx, currentHop, pushHistoryEntry, syncPathwayNode, tree]);

  // Clean autoplay timer scaled by playbackSpeed and cleared on pause, step, or unmount
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.round(2400 / playbackSpeed);
    const timer = window.setInterval(() => {
      pendingHistorySourceRef.current = 'play';
      setActiveHopIdx((prev) => {
        const next = prev + 1;
        if (next >= activeTrace.hops.length) {
          setIsPlaying(false);
          return activeTrace.hops.length - 1;
        }
        return next;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [isPlaying, activeTrace.hops.length, playbackSpeed]);

  const handleSelectTrace = (id: RequestWalkthroughTrace['id']) => {
    setIsPlaying(false);
    pendingHistorySourceRef.current = 'trace';
    setActiveTraceId(id);
    setActiveHopIdx(0);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (activeHopIdx < 0 || activeHopIdx >= activeTrace.hops.length - 1) {
      pendingHistorySourceRef.current = 'play';
      setActiveHopIdx(0);
    }
    setIsPlaying(true);
  };

  const handleStepPrev = () => {
    setIsPlaying(false);
    pendingHistorySourceRef.current = 'step';
    setActiveHopIdx((prev) => (prev <= 0 ? 0 : prev - 1));
  };

  const handleStepNext = () => {
    setIsPlaying(false);
    pendingHistorySourceRef.current = 'step';
    setActiveHopIdx((prev) =>
      prev < 0 ? 0 : Math.min(activeTrace.hops.length - 1, prev + 1),
    );
  };

  const handleSelectHop = (idx: number) => {
    setIsPlaying(false);
    pendingHistorySourceRef.current = 'jump';
    setActiveHopIdx(idx);
  };

  const handleResetWalkthrough = () => {
    setIsPlaying(false);
    pendingHistorySourceRef.current = null;
    setActiveHopIdx(-1);
    setNavHistory({ entries: [], cursor: -1 });
  };

  const applyHistoryAtIndex = useCallback(
    (nextIndex: number) => {
      const target = navHistory.entries[nextIndex];
      if (!target) return;

      setIsPlaying(false);
      setNavHistory((prev) => ({
        ...prev,
        cursor: Math.max(0, Math.min(prev.entries.length - 1, nextIndex)),
      }));

      const hopStateWillChange =
        target.hopIdx >= 0 &&
        (target.traceId !== activeTraceId || target.hopIdx !== activeHopIdx);
      if (hopStateWillChange) {
        pendingHistorySourceRef.current = 'history-restore';
      }

      setActiveTraceId(target.traceId);
      setActiveHopIdx(target.hopIdx);
      setExpandedTrunks((prev) =>
        prev.includes(target.trunkId) ? prev : [...prev, target.trunkId],
      );
      setExpandedBranches((prev) =>
        prev.includes(target.branchId) ? prev : [...prev, target.branchId],
      );
      setInspectedBranchId(target.branchId);
      const targetTrunk = tree.find((t) => t.id === target.trunkId);
      const targetBranch = targetTrunk?.branches.find((b) => b.id === target.branchId);
      syncPathwayNode({
        trunkId: target.trunkId,
        branchId: target.branchId,
        appId: targetBranch?.appId,
        nodeCode: target.nodeCode,
        nodeTitle: targetBranch?.title ?? target.label,
      });
    },
    [navHistory.entries, activeTraceId, activeHopIdx, syncPathwayNode, tree],
  );

  const handleHistoryBack = () => {
    if (navHistory.cursor <= 0) return;
    applyHistoryAtIndex(navHistory.cursor - 1);
  };

  const handleHistoryForward = () => {
    if (navHistory.cursor < 0 || navHistory.cursor >= navHistory.entries.length - 1) return;
    applyHistoryAtIndex(navHistory.cursor + 1);
  };

  const isDark = effectivePolarity === 'dark';

  const inspectedContext = useMemo(() => {
    if (!inspectedBranchId) return null;
    for (const trunk of tree) {
      const branch = trunk.branches.find((b) => b.id === inspectedBranchId);
      if (branch) return { trunk, branch };
    }
    return null;
  }, [inspectedBranchId, tree]);

  const toggleTrunk = (id: string) => {
    setExpandedTrunks((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleBranch = (branch: PathwayBranchNode) => {
    setIsPlaying(false);
    setInspectedBranchId(branch.id);
    setExpandedBranches((prev) =>
      prev.includes(branch.id) ? prev.filter((item) => item !== branch.id) : [...prev, branch.id],
    );

    const owningTrunk = tree.find((t) => t.branches.some((b) => b.id === branch.id));
    syncPathwayNode({
      trunkId: owningTrunk?.id,
      branchId: branch.id,
      appId: branch.appId,
      nodeCode: branch.code,
      nodeTitle: branch.title,
    });

    const matchedHopIdx = activeTrace.hops.findIndex((h) => h.branchId === branch.id);
    if (matchedHopIdx >= 0) {
      pendingHistorySourceRef.current = 'branch';
      setActiveHopIdx(matchedHopIdx);
      return;
    }

    if (owningTrunk) {
      setActiveHopIdx(-1);
      pushHistoryEntry({
        traceId: activeTrace.id,
        traceLabel: activeTrace.label,
        hopIdx: -1,
        trunkId: owningTrunk.id,
        branchId: branch.id,
        nodeCode: branch.code,
        label: branch.title,
        source: 'branch',
      });
    }
  };

  const expandAll = () => {
    setExpandedTrunks(tree.map((t) => t.id));
    setExpandedBranches(tree.flatMap((t) => t.branches.map((b) => b.id)));
  };

  const collapseAll = () => {
    setExpandedTrunks([]);
    setExpandedBranches([]);
  };

  const resetPathway = () => {
    setIsPlaying(false);
    pendingHistorySourceRef.current = null;
    setActiveHopIdx(-1);
    setNavHistory({ entries: [], cursor: -1 });
    setExpandedTrunks(defaultExpandedTrunks);
    setExpandedBranches(['branch-layer-L5', 'branch-app-healthcare_erp']);
    setInspectedBranchId('branch-app-healthcare_erp');
  };

  const handleExportPathwayMd = () => {
    downloadMarkdownFile(
      `spenta-pathway-${deploymentTarget}-${activeTrace.id}.md`,
      buildPathwayMarkdownExport(tree, activeProfile, activeTrace),
    );
    setExportedFlag(true);
    window.setTimeout(() => setExportedFlag(false), 1800);
  };

  const handleCopyPathwayLink = async () => {
    const ok = await copyTextWithFallback(buildShareUrl({ tab: activeTab }));
    if (ok) {
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const inspectedBrainHub = useMemo(() => {
    if (!inspectedContext) return null;
    return resolveHubForNode({
      trunkId: inspectedContext.trunk.id,
      branchId: inspectedContext.branch.id,
      appId: inspectedContext.branch.appId,
      nodeCode: inspectedContext.branch.code,
      nodeTitle: inspectedContext.branch.title,
    });
  }, [inspectedContext, resolveHubForNode]);

  const handleInspectBranchIn3D = useCallback(
    (trunkId: string, branch: PathwayBranchNode) => {
      inspectPathwayNodeInBrain({
        trunkId,
        branchId: branch.id,
        appId: branch.appId,
        nodeCode: branch.code,
        nodeTitle: branch.title,
        open3D: true,
        returnTab: activeTab,
        returnLabel: activeTab === 'Resources' ? 'Studio Pathway' : 'Architecture Pathway',
      });
    },
    [activeTab, inspectPathwayNodeInBrain],
  );

  const handleInspectActiveHopIn3D = useCallback(() => {
    if (!currentHop) return;
    const owningTrunk = tree.find((t) => t.id === currentHop.trunkId);
    const branch = owningTrunk?.branches.find((b) => b.id === currentHop.branchId);
    if (owningTrunk && branch) {
      handleInspectBranchIn3D(owningTrunk.id, branch);
    }
  }, [currentHop, handleInspectBranchIn3D, tree]);

  const focusLinkedAppBranch = (appId: string) => {
    const targetBranchId = `branch-app-${appId}`;
    const owningTrunk = tree.find((t) => t.branches.some((b) => b.id === targetBranchId));
    const targetBranch = owningTrunk?.branches.find((b) => b.id === targetBranchId);
    setIsPlaying(false);
    if (owningTrunk && !expandedTrunks.includes(owningTrunk.id)) {
      setExpandedTrunks((prev) => [...prev, owningTrunk.id]);
    }
    if (!expandedBranches.includes(targetBranchId)) {
      setExpandedBranches((prev) => [...prev, targetBranchId]);
    }
    setInspectedBranchId(targetBranchId);
    syncPathwayNode({
      trunkId: owningTrunk?.id,
      branchId: targetBranchId,
      appId,
      nodeCode: targetBranch?.code,
      nodeTitle: targetBranch?.title,
    });

    const matchedHopIdx = activeTrace.hops.findIndex((h) => h.branchId === targetBranchId);
    if (matchedHopIdx >= 0) {
      pendingHistorySourceRef.current = 'branch';
      setActiveHopIdx(matchedHopIdx);
    } else if (owningTrunk && targetBranch) {
      setActiveHopIdx(-1);
      pushHistoryEntry({
        traceId: activeTrace.id,
        traceLabel: activeTrace.label,
        hopIdx: -1,
        trunkId: owningTrunk.id,
        branchId: targetBranch.id,
        nodeCode: targetBranch.code,
        label: targetBranch.title,
        source: 'branch',
      });
    }
  };

  // Spenta Stone Light & Nocturnal Navy palette tokens scoped cleanly to this container
  const canvasClass = isDark
    ? 'bg-[#0B1020] text-[#E7EBF5] border-[#232B4A]'
    : 'bg-[#FAF8F4] text-[#16213A] border-[#E4DFD6]';
  const bandClass = isDark
    ? 'bg-[#0F1529] border-[#232B4A]'
    : 'bg-[#F2EFE9] border-[#E4DFD6]';
  const cardClass = isDark
    ? 'bg-[#141A32] border-[#232B4A] hover:border-[#7FA6FF]'
    : 'bg-[#FFFFFF] border-[#E4DFD6] hover:border-[#1F3863]';
  const mutedText = isDark ? 'text-[#8D97B5]' : 'text-[#5F6576]';
  const secondaryText = isDark ? 'text-[#C3CCE4]' : 'text-[#4A5163]';
  const brandStroke = isDark ? '#7FA6FF' : '#1F3863';
  const inactiveStroke = isDark ? '#2E3862' : '#CFC8BC';
  const activeGreen = isDark ? '#6FCB9F' : '#1C6E46';
  const hopAmber = isDark ? '#E0B063' : '#8A5C10';

  const miniMapPillars = useMemo<PathwayMiniMapPillar[]>(() => {
    return tree.map((trunk) => {
      const isActiveHop = currentHop?.trunkId === trunk.id;
      const isPassedHop =
        !isActiveHop &&
        activeHopIdx >= 0 &&
        activeTrace.hops.slice(0, activeHopIdx).some((h) => h.trunkId === trunk.id);
      const activeAppCount = trunk.branches.filter(
        (b) => b.appId && selectedIds.includes(b.appId),
      ).length;
      return {
        id: trunk.id,
        index: trunk.index,
        label: trunk.title,
        isExpanded: expandedTrunks.includes(trunk.id),
        isActiveHop,
        isPassedHop,
        activeAppCount,
      };
    });
  }, [tree, currentHop, activeHopIdx, activeTrace.hops, selectedIds, expandedTrunks]);

  const handleFocusPillarFromMiniMap = useCallback((pillarId: string) => {
    setExpandedTrunks((prev) => (prev.includes(pillarId) ? prev : [...prev, pillarId]));
    const targetTrunk = tree.find((t) => t.id === pillarId);
    if (targetTrunk && targetTrunk.branches.length > 0) {
      setInspectedBranchId(targetTrunk.branches[0].id);
    }
  }, [tree]);

  return (
    <section
      className={`rounded-[10px] border transition-colors duration-200 overflow-hidden ${canvasClass}`}
      aria-label="Interactive Spenta Dhaka and roadmap.sh Architecture Pathway"
    >
      {/* Top Editorial Header Bar */}
      <div
        className={`px-4 sm:px-6 py-4 border-b flex flex-col xl:flex-row xl:items-center justify-between gap-3 ${bandClass}`}
      >
        <div className="space-y-1">
          <div className={`flex flex-wrap items-center gap-2 text-[11px] font-mono ${mutedText}`}>
            <span className={isDark ? 'text-[#8FA6E8] font-semibold' : 'text-[#1F3863] font-semibold'}>
              PLATE 00 · CODE-DRAWN INTERACTIVE PATHWAY
            </span>
            <span aria-hidden="true">·</span>
            <span>Spenta Dhaka × roadmap.sh × Provider Swap &amp; Trace Player</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {selectedIds.length}/13 Modules Active · OPA {hitlConfidence.toFixed(2)}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-balance">
            Interactive Sovereign Architecture Pathway &amp; Request Walkthrough
          </h3>
          <p className={`text-xs max-w-3xl leading-relaxed ${secondaryText}`}>
            Swap deployment topologies (On-Prem, Private VPC, Air-Gap), step through live multi-hop request traces, and click any pillar or branch to expand its compositions and sync with your Stack Composer.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Scoped OITS Dhaka Stone / Nocturnal Polarity Toggle */}
          <div
            role="group"
            aria-label="Pathway visual theme polarity"
            className={`inline-flex items-center gap-1 p-1 rounded-lg border ${
              isDark ? 'bg-[#0B1020] border-[#232B4A]' : 'bg-[#FAF8F4] border-[#E4DFD6]'
            }`}
          >
            <button
              type="button"
              onClick={() => setPolarity('light')}
              aria-pressed={!isDark}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                !isDark
                  ? 'bg-[#1F3863] text-white'
                  : 'text-[#8D97B5] hover:text-[#E7EBF5]'
              }`}
            >
              <Sun className="w-3 h-3" strokeWidth={1.75} />
              <span>Stone</span>
            </button>
            <button
              type="button"
              onClick={() => setPolarity('dark')}
              aria-pressed={isDark}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isDark
                  ? 'bg-[#8FA6E8] text-[#0B1020]'
                  : 'text-[#5F6576] hover:text-[#16213A]'
              }`}
            >
              <Moon className="w-3 h-3" strokeWidth={1.75} />
              <span>Nocturnal</span>
            </button>
          </div>

          <button
            type="button"
            onClick={expandAll}
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${cardClass}`}
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${cardClass}`}
          >
            Collapse All
          </button>
          <button
            type="button"
            onClick={resetPathway}
            title="Reset expanded branches"
            aria-label="Reset expanded branches"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${cardClass}`}
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={handleCopyPathwayLink}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${cardClass}`}
          >
            {linkCopied ? (
              <Check className="w-3.5 h-3.5 text-[#1C6E46] dark:text-[#6FCB9F]" strokeWidth={2} />
            ) : (
              <Link2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            )}
            <span>{linkCopied ? 'Link Copied' : 'Share Link'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportPathwayMd}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isDark
                ? 'bg-[#8FA6E8] text-[#0B1020] hover:bg-[#7FA6FF]'
                : 'bg-[#1F3863] text-white hover:bg-[#12233F]'
            }`}
          >
            {exportedFlag ? (
              <Check className="w-3.5 h-3.5" strokeWidth={2} />
            ) : (
              <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
            )}
            <span>{exportedFlag ? 'Exported .md' : 'Export Pathway .md'}</span>
          </button>
        </div>
      </div>

      {/* Deployment Target Topology Bar (Synced Globally with Studio Workspace) */}
      <div
        className={`px-4 sm:px-6 py-2.5 border-b flex flex-col md:flex-row md:items-center justify-between gap-2.5 ${
          isDark ? 'bg-[#0B1020] border-[#232B4A]' : 'bg-[#FAF8F4] border-[#E4DFD6]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold ${mutedText}`}>
            <Server className="w-3.5 h-3.5" strokeWidth={1.6} />
            <span>Infrastructure Target:</span>
          </span>
          <div
            role="group"
            aria-label="Deployment provider topology"
            className={`inline-flex flex-wrap items-center gap-1 p-1 rounded-lg border ${
              isDark ? 'bg-[#0F1529] border-[#232B4A]' : 'bg-[#F2EFE9] border-[#E4DFD6]'
            }`}
          >
            {DEPLOYMENT_TARGET_ORDER.map((pid) => {
              const prof = DEPLOYMENT_PROFILES[pid];
              const active = deploymentTarget === pid;
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => setDeploymentTarget(pid, 'Pathway Explorer')}
                  aria-pressed={active}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? isDark
                        ? 'bg-[#6FCB9F] text-[#0B1020]'
                        : 'bg-[#1C6E46] text-white'
                      : isDark
                        ? 'text-[#C3CCE4] hover:text-white'
                        : 'text-[#4A5163] hover:text-[#16213A]'
                  }`}
                >
                  {prof.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`text-[11px] font-mono flex flex-wrap items-center gap-2 tabular-nums ${mutedText}`}>
          <span className={isDark ? 'text-[#E7EBF5] font-semibold' : 'text-[#16213A] font-semibold'}>
            {activeProfile.latencyBudget}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Build ${(stackMetrics.oneTimeBuildUsd / 1000).toFixed(1)}K
            {stackMetrics.quarterlyRetainerUsd > 0
              ? ` + $${(stackMetrics.quarterlyRetainerUsd / 1000).toFixed(1)}K/qtr`
              : ''}{' '}
            · Tier {stackMetrics.tier}
          </span>
        </div>
      </div>

      {/* Dedicated Hop-by-Hop Request Playback Component */}
      <PathwayHopPlayback
        traces={REQUEST_TRACES}
        activeTrace={activeTrace}
        activeHopIdx={activeHopIdx}
        isPlaying={isPlaying}
        speed={playbackSpeed}
        isDark={isDark}
        activeProfile={activeProfile}
        historyStack={navHistory.entries}
        historyCursor={navHistory.cursor}
        onSelectTrace={handleSelectTrace}
        onTogglePlay={handleTogglePlay}
        onStepPrev={handleStepPrev}
        onStepNext={handleStepNext}
        onSelectHop={handleSelectHop}
        onReset={handleResetWalkthrough}
        onSpeedChange={setPlaybackSpeed}
        onHistoryBack={handleHistoryBack}
        onHistoryForward={handleHistoryForward}
        onJumpToHistory={applyHistoryAtIndex}
        onInspectHopIn3D={handleInspectActiveHopIn3D}
      />

      {/* Contextual Hover Tooltip Strip */}
      {!currentHop && (
        <div
          className={`px-4 sm:px-6 py-2 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
            isDark
              ? 'bg-[#141A32]/70 border-[#232B4A]'
              : 'bg-[#FFFFFF] border-[#E4DFD6]'
          }`}
        >
          {hoveredTip ? (
            <>
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span
                  className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    isDark ? 'bg-[#161D3A] text-[#8FA6E8]' : 'bg-[#EEF3FB] text-[#1F3863]'
                  }`}
                >
                  {hoveredTip.code}
                </span>
                <span className="font-bold truncate">{hoveredTip.title}</span>
                <span className={mutedText} aria-hidden="true">
                  ·
                </span>
                <span className={`truncate ${secondaryText}`}>{hoveredTip.summary}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                <span className={isDark ? 'text-[#6FCB9F]' : 'text-[#1C6E46]'}>
                  {hoveredTip.metric}
                </span>
                <span className={mutedText}>{hoveredTip.hint}</span>
              </div>
            </>
          ) : (
            <div className={`flex flex-wrap items-center justify-between w-full gap-2 ${mutedText}`}>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                <span>
                  <strong className={isDark ? 'text-[#E7EBF5]' : 'text-[#16213A]'}>
                    {activeProfile.shortLabel}:
                  </strong>{' '}
                  {activeProfile.transport} · {activeProfile.egressPolicy}
                </span>
              </span>
              <span className="font-mono text-[11px] tabular-nums">
                Press Play above to step through connections and node states
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Split: Left Orthogonal Branching Tree | Right roadmap.sh Slide-In Inspector */}
      <div className={`grid grid-cols-1 ${compact ? 'xl:grid-cols-12' : 'lg:grid-cols-12'}`}>
        {/* Left Interactive SVG-Connected Architecture Tree with Framer Motion Pan & Zoom */}
        <PathwayPanZoomStage
          isDark={isDark}
          pillars={miniMapPillars}
          activeHopLabel={
            currentHop
              ? `HOP ${currentHop.stepNumber}/${activeTrace.hops.length} · ${currentHop.nodeCode}`
              : null
          }
          onFocusPillar={handleFocusPillarFromMiniMap}
          className={`${
            compact ? 'xl:col-span-8' : 'lg:col-span-8'
          } border-b lg:border-b-0 lg:border-r ${
            isDark ? 'border-[#232B4A]' : 'border-[#E4DFD6]'
          }`}
        >
          {/* Top Orthogonal Architectural Flow Bar (SVG Code-Drawn Overview + Directed Hop Transitions) */}
          <div className={`rounded-lg border p-3.5 ${bandClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className={`font-mono text-[10px] tracking-[0.06em] ${mutedText}`}>
                Orthogonal System Spine · {activeProfile.shortLabel}{' '}
                {currentHop
                  ? `· Hop ${currentHop.stepNumber}/${activeTrace.hops.length} (${currentHop.transitionLabel})`
                  : '(Click any pillar to toggle branches)'}
              </span>
              <span className={`font-mono text-[10px] tabular-nums ${mutedText}`}>
                {expandedTrunks.length}/5 Pillars Expanded
              </span>
            </div>
            <svg
              viewBox="0 0 880 116"
              className="w-full h-auto block select-none"
              role="img"
              aria-label="Five-stage interactive Sovereign Architecture Spine with directed hop-by-hop transitions"
            >
              <defs>
                <marker
                  id="spenta-arrow-active"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={hopAmber} />
                </marker>
                <marker
                  id="spenta-arrow-passed"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="5.5"
                  markerHeight="5.5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={activeGreen} />
                </marker>
              </defs>

              {/* Horizontal Baseline Spine Bus */}
              <line
                x1="78"
                y1="77"
                x2="802"
                y2="77"
                stroke={inactiveStroke}
                strokeWidth="1.5"
              />

              {/* Directed Hop-by-Hop Transition Arcs Above Spine (Including Hop 1 Ingress) */}
              {activeHopIdx >= 0 &&
                activeTrace.hops.map((hop, idx) => {
                  if (idx > activeHopIdx) return null;

                  // Hop 1 Ingress entry transition arc into the first activated pillar
                  if (idx === 0) {
                    const firstIdx = tree.findIndex((t) => t.id === hop.trunkId);
                    if (firstIdx < 0) return null;
                    const xTarget = 10 + firstIdx * 174 + 79;
                    const xStart = Math.max(12, xTarget - 64);
                    const isCurrentTransition = activeHopIdx === 0;
                    const strokeCol = isCurrentTransition ? hopAmber : activeGreen;
                    const ingressPathD = `M ${xStart} 18 Q ${xStart + 28} 18 ${xTarget} 46`;

                    return (
                      <g key={`arc-ingress-${activeTrace.id}`}>
                        <circle cx={xStart} cy="18" r="3" fill={strokeCol} />
                        <path
                          d={ingressPathD}
                          fill="none"
                          stroke={strokeCol}
                          strokeWidth={isCurrentTransition ? 2.4 : 1.5}
                          strokeDasharray={isCurrentTransition ? '5 3' : undefined}
                          opacity={isCurrentTransition ? 1 : 0.72}
                          markerEnd={
                            isCurrentTransition
                              ? 'url(#spenta-arrow-active)'
                              : 'url(#spenta-arrow-passed)'
                          }
                        />
                        {isCurrentTransition && (
                          <>
                            <rect
                              x={Math.max(4, xTarget - 42)}
                              y="2"
                              width="84"
                              height="16"
                              rx="4"
                              fill={hopAmber}
                            />
                            <text
                              x={Math.max(46, xTarget)}
                              y="13"
                              textAnchor="middle"
                              fill={isDark ? '#0B1020' : '#FFFFFF'}
                              fontSize="8.5"
                              fontWeight="800"
                              fontFamily="IBM Plex Mono, JetBrains Mono, monospace"
                            >
                              {`H1 · ${hop.transitionLabel}`}
                            </text>
                            {isPlaying && (
                              <circle r="3.6" fill={hopAmber}>
                                <animateMotion
                                  dur="1.1s"
                                  repeatCount="indefinite"
                                  path={ingressPathD}
                                />
                              </circle>
                            )}
                          </>
                        )}
                      </g>
                    );
                  }

                  const fromHop = activeTrace.hops[idx - 1];
                  const fromIdx = tree.findIndex((t) => t.id === fromHop.trunkId);
                  const toIdx = tree.findIndex((t) => t.id === hop.trunkId);
                  if (fromIdx < 0 || toIdx < 0) return null;

                  const x1 = 10 + fromIdx * 174 + 79;
                  const x2 = 10 + toIdx * 174 + 79;
                  const isCurrentTransition = idx === activeHopIdx;
                  const strokeCol = isCurrentTransition ? hopAmber : activeGreen;
                  const arcLift =
                    fromIdx === toIdx
                      ? 14
                      : Math.max(10, 36 - Math.abs(toIdx - fromIdx) * 6);
                  const midX = (x1 + x2) / 2;
                  const pathD =
                    fromIdx === toIdx
                      ? `M ${x1 - 24} 48 C ${x1 - 24} ${arcLift}, ${x1 + 24} ${arcLift}, ${x1 + 24} 46`
                      : `M ${x1} 48 Q ${midX} ${arcLift} ${x2} 46`;

                  return (
                    <g key={`arc-${activeTrace.id}-${idx}`}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke={strokeCol}
                        strokeWidth={isCurrentTransition ? 2.4 : 1.5}
                        strokeDasharray={isCurrentTransition ? '5 3' : undefined}
                        opacity={isCurrentTransition ? 1 : 0.72}
                        markerEnd={
                          isCurrentTransition
                            ? 'url(#spenta-arrow-active)'
                            : 'url(#spenta-arrow-passed)'
                        }
                      />
                      {isCurrentTransition && (
                        <>
                          <rect
                            x={midX - 42}
                            y={Math.max(2, arcLift - 7)}
                            width="84"
                            height="16"
                            rx="4"
                            fill={hopAmber}
                          />
                          <text
                            x={midX}
                            y={Math.max(13, arcLift + 4)}
                            textAnchor="middle"
                            fill={isDark ? '#0B1020' : '#FFFFFF'}
                            fontSize="8.5"
                            fontWeight="800"
                            fontFamily="IBM Plex Mono, JetBrains Mono, monospace"
                          >
                            {`H${hop.stepNumber} · ${hop.transitionLabel}`}
                          </text>
                          {isPlaying && (
                            <circle r="3.6" fill={hopAmber}>
                              <animateMotion dur="1.1s" repeatCount="indefinite" path={pathD} />
                            </circle>
                          )}
                        </>
                      )}
                    </g>
                  );
                })}

              {tree.map((trunk, idx) => {
                const x = 10 + idx * 174;
                const isExpanded = expandedTrunks.includes(trunk.id);
                const isHopTrunk = currentHop?.trunkId === trunk.id;
                const passedHopSteps =
                  activeHopIdx >= 0
                    ? activeTrace.hops
                        .slice(0, activeHopIdx)
                        .filter((h) => h.trunkId === trunk.id)
                        .map((h) => h.stepNumber)
                    : [];
                const upcomingHopSteps =
                  activeHopIdx >= 0
                    ? activeTrace.hops
                        .slice(activeHopIdx + 1)
                        .filter((h) => h.trunkId === trunk.id)
                        .map((h) => h.stepNumber)
                    : [];
                const isPassedTrunk = !isHopTrunk && passedHopSteps.length > 0;
                const isQueuedTrunk = !isHopTrunk && !isPassedTrunk && upcomingHopSteps.length > 0;
                const activeCount = trunk.branches.filter(
                  (b) => b.appId && selectedIds.includes(b.appId),
                ).length;

                const spineAccent: TooltipAccent = isHopTrunk
                  ? 'amber'
                  : isPassedTrunk || activeCount > 0
                    ? 'emerald'
                    : 'navy';
                const spineStatus = isHopTrunk
                  ? `ACTIVE · HOP ${currentHop.stepNumber}`
                  : isPassedTrunk
                    ? `PASSED · HOP ${passedHopSteps[passedHopSteps.length - 1]}`
                    : isQueuedTrunk
                      ? `QUEUED · HOP ${upcomingHopSteps[0]}`
                      : isExpanded
                        ? 'EXPANDED'
                        : 'COLLAPSED';
                const spinePayload: HoveredTipPayload = {
                  id: `spine-${trunk.id}`,
                  code: `PILLAR ${trunk.index}`,
                  title: trunk.title,
                  summary: trunk.summary,
                  metric: activeCount > 0 ? `${activeCount} in stack · ${trunk.metric}` : trunk.metric,
                  status: spineStatus,
                  hint: isExpanded ? 'Click to collapse' : 'Click to expand',
                  accent: spineAccent,
                };

                return (
                  <g
                    key={trunk.id}
                    onClick={() => toggleTrunk(trunk.id)}
                    onMouseEnter={(e) => showHoverTip(spinePayload, e)}
                    onMouseMove={moveHoverTip}
                    onMouseLeave={clearHoverTip}
                    className="cursor-pointer"
                  >
                    {idx > 0 && (isExpanded || isHopTrunk || isPassedTrunk) && (
                      <line
                        x1={x - 16}
                        y1="77"
                        x2={x}
                        y2="77"
                        stroke={isHopTrunk ? hopAmber : isPassedTrunk ? activeGreen : brandStroke}
                        strokeWidth={isHopTrunk ? 2.4 : 1.9}
                      />
                    )}
                    {isHopTrunk && (
                      <rect
                        x={x - 3}
                        y="45"
                        width="164"
                        height="64"
                        rx="10"
                        fill="none"
                        stroke={hopAmber}
                        strokeWidth="1.25"
                        strokeOpacity="0.5"
                        strokeDasharray="3 2"
                      />
                    )}
                    <rect
                      x={x}
                      y="48"
                      width="158"
                      height="58"
                      rx="8"
                      fill={
                        isHopTrunk
                          ? isDark
                            ? '#2A2112'
                            : '#FDF5E6'
                          : isPassedTrunk
                            ? isDark
                              ? '#10261F'
                              : '#ECF7F1'
                            : isExpanded
                              ? isDark
                                ? '#161D3A'
                                : '#EEF3FB'
                              : isDark
                                ? '#141A32'
                                : '#FFFFFF'
                      }
                      stroke={
                        isHopTrunk
                          ? hopAmber
                          : isPassedTrunk || activeCount > 0
                            ? activeGreen
                            : isQueuedTrunk || isExpanded
                              ? brandStroke
                              : inactiveStroke
                      }
                      strokeDasharray={isQueuedTrunk ? '4 2.5' : undefined}
                      strokeWidth={isHopTrunk ? 2.3 : isPassedTrunk || isExpanded ? 1.8 : 1.15}
                    />
                    <text
                      x={x + 12}
                      y="65"
                      fill={
                        isHopTrunk
                          ? hopAmber
                          : isPassedTrunk
                            ? activeGreen
                            : isQueuedTrunk || isExpanded
                              ? brandStroke
                              : isDark
                                ? '#8D97B5'
                                : '#5F6576'
                      }
                      fontSize="9.2"
                      fontWeight="700"
                      fontFamily="IBM Plex Mono, JetBrains Mono, monospace"
                    >
                      {isHopTrunk
                        ? `ACTIVE · HOP ${currentHop.stepNumber}`
                        : isPassedTrunk
                          ? `PASSED · HOP ${passedHopSteps[passedHopSteps.length - 1]}`
                          : isQueuedTrunk
                            ? `QUEUED · HOP ${upcomingHopSteps[0]}`
                            : `${trunk.index}. ${isExpanded ? 'EXPANDED' : 'BRANCH +'}`}
                    </text>
                    <text
                      x={x + 12}
                      y="82"
                      fill={isDark ? '#E7EBF5' : '#16213A'}
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                    >
                      {trunk.title.length > 20 ? `${trunk.title.slice(0, 19)}…` : trunk.title}
                    </text>
                    <text
                      x={x + 12}
                      y="97"
                      fill={activeCount > 0 ? activeGreen : isDark ? '#8D97B5' : '#5F6576'}
                      fontSize="9"
                      fontFamily="IBM Plex Mono, JetBrains Mono, monospace"
                    >
                      {activeCount > 0 ? `${activeCount} in stack` : trunk.metric}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Vertical Expandable Trunk → Branch → Composition Nodes */}
          <div className="space-y-3.5">
            {tree.map((trunk) => {
              const isTrunkOpen = expandedTrunks.includes(trunk.id);
              const isHopTrunk = currentHop?.trunkId === trunk.id;
              const activeAppsInTrunk = trunk.branches.filter(
                (b) => b.appId && selectedIds.includes(b.appId),
              ).length;

              const trunkPayload: HoveredTipPayload = {
                id: `trunk-${trunk.id}`,
                code: `PILLAR ${trunk.index}`,
                title: trunk.title,
                summary: trunk.summary,
                metric:
                  activeAppsInTrunk > 0
                    ? `${activeAppsInTrunk} active · ${trunk.metric}`
                    : trunk.metric,
                status: isHopTrunk
                  ? `ACTIVE · HOP ${currentHop.stepNumber}`
                  : isTrunkOpen
                    ? `${trunk.branches.length} BRANCHES OPEN`
                    : `${trunk.branches.length} BRANCHES`,
                hint: isTrunkOpen ? 'Click to collapse' : 'Click to expand',
                accent: isHopTrunk ? 'amber' : activeAppsInTrunk > 0 ? 'emerald' : 'navy',
              };

              return (
                <div key={trunk.id} className="space-y-2.5">
                  {/* Trunk Row */}
                  <button
                    type="button"
                    onClick={() => toggleTrunk(trunk.id)}
                    onMouseEnter={(e) => showHoverTip(trunkPayload, e)}
                    onMouseMove={moveHoverTip}
                    onMouseLeave={clearHoverTip}
                    onFocus={(e) => showFocusTip(trunkPayload, e)}
                    onBlur={clearHoverTip}
                    aria-expanded={isTrunkOpen}
                    className={`w-full text-left rounded-[10px] border px-4 py-3.5 transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                      isHopTrunk
                        ? isDark
                          ? 'bg-[#2A2112]/70 border-[#E0B063]'
                          : 'bg-[#FDF5E6] border-[#8A5C10]'
                        : isTrunkOpen
                          ? isDark
                            ? 'bg-[#161D3A] border-[#7FA6FF]'
                            : 'bg-[#EEF3FB] border-[#1F3863]'
                          : cardClass
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={`font-mono text-xs font-bold px-2 py-1 rounded-md shrink-0 tabular-nums ${
                          isHopTrunk
                            ? isDark
                              ? 'bg-[#E0B063] text-[#0B1020]'
                              : 'bg-[#8A5C10] text-white'
                            : isTrunkOpen
                              ? isDark
                                ? 'bg-[#8FA6E8] text-[#0B1020]'
                                : 'bg-[#1F3863] text-white'
                              : isDark
                                ? 'bg-[#0F1529] text-[#8FA6E8]'
                                : 'bg-[#F2EFE9] text-[#1F3863]'
                        }`}
                      >
                        {trunk.index}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold tracking-tight flex flex-wrap items-center gap-2">
                          <span>{trunk.title}</span>
                          {activeAppsInTrunk > 0 && (
                            <span
                              className={`font-mono text-[10px] font-semibold ${
                                isDark ? 'text-[#6FCB9F]' : 'text-[#1C6E46]'
                              }`}
                            >
                              · {activeAppsInTrunk} active in stack
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 leading-snug ${secondaryText}`}>
                          {trunk.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className={`hidden sm:inline font-mono text-[11px] tabular-nums ${mutedText}`}>
                        {trunk.branches.length} branches
                      </span>
                      {isTrunkOpen ? (
                        <ChevronDown className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      ) : (
                        <ChevronRight className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      )}
                    </div>
                  </button>

                  {/* Expanded Sub-Component Branches with SVG Orthogonal Tree Rails */}
                  {isTrunkOpen && (
                    <div className="pl-3 sm:pl-6 relative">
                      <div
                        aria-hidden="true"
                        className="absolute left-3 sm:left-6 top-0 bottom-3 w-px"
                        style={{ backgroundColor: isHopTrunk ? hopAmber : brandStroke, opacity: 0.45 }}
                      />

                      <div className="pl-4 sm:pl-5 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {trunk.branches.map((branch) => {
                          const isBranchOpen = expandedBranches.includes(branch.id);
                          const isInspected = inspectedBranchId === branch.id;
                          const branchHopIdx = activeTrace.hops.findIndex(
                            (h) => h.branchId === branch.id,
                          );
                          const branchHop = branchHopIdx >= 0 ? activeTrace.hops[branchHopIdx] : null;
                          const isHopBranch = currentHop?.branchId === branch.id;
                          const isPassedBranch =
                            !isHopBranch &&
                            activeHopIdx >= 0 &&
                            branchHopIdx >= 0 &&
                            branchHopIdx < activeHopIdx;
                          const isQueuedBranch =
                            !isHopBranch &&
                            activeHopIdx >= 0 &&
                            branchHopIdx > activeHopIdx;
                          const isInStack = branch.appId ? selectedIds.includes(branch.appId) : false;

                          return (
                            <div key={branch.id} className="relative space-y-2">
                              <span
                                aria-hidden="true"
                                className={`hidden md:block absolute -left-5 top-5 w-5 transition-all duration-200 ${
                                  isHopBranch ? 'h-[2.5px]' : 'h-[1.5px]'
                                }`}
                                style={{
                                  backgroundColor: isHopBranch
                                    ? hopAmber
                                    : isPassedBranch || isInStack
                                      ? activeGreen
                                      : isQueuedBranch || isInspected
                                        ? brandStroke
                                        : inactiveStroke,
                                }}
                              />
                              {(isHopBranch || isPassedBranch) && (
                                <span
                                  aria-hidden="true"
                                  className={`hidden md:block absolute -left-[5px] top-[16.5px] w-2 h-2 rounded-full transition-colors duration-200 ${
                                    isHopBranch && isPlaying ? 'animate-pulse' : ''
                                  }`}
                                  style={{
                                    backgroundColor: isHopBranch ? hopAmber : activeGreen,
                                  }}
                                />
                              )}

                              <div
                                className={`rounded-[10px] border transition-all duration-150 ${
                                  isHopBranch
                                    ? isDark
                                      ? 'bg-[#2A2112]/80 border-[#E0B063] shadow-sm'
                                      : 'bg-[#FDF5E6] border-[#8A5C10] shadow-sm'
                                    : isPassedBranch
                                      ? isDark
                                        ? 'bg-[#10261F]/70 border-[#6FCB9F]'
                                        : 'bg-[#ECF7F1] border-[#1C6E46]'
                                      : isQueuedBranch
                                        ? isDark
                                          ? 'bg-[#141A32]/85 border-[#7FA6FF]/70 border-dashed'
                                          : 'bg-[#FFFFFF] border-[#1F3863]/55 border-dashed'
                                        : isInspected
                                          ? isDark
                                            ? 'bg-[#141A32] border-[#7FA6FF] shadow-sm'
                                            : 'bg-[#FFFFFF] border-[#1F3863] shadow-sm'
                                          : isInStack
                                            ? isDark
                                              ? 'bg-[#141A32] border-[#6FCB9F]/60'
                                              : 'bg-[#FFFFFF] border-[#1C6E46]/60'
                                            : cardClass
                                }`}
                              >
                                <div className="p-3 flex items-start justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleBranch(branch)}
                                    onMouseEnter={(e) =>
                                      showHoverTip(
                                        {
                                          id: `branch-${branch.id}`,
                                          code: branch.code,
                                          title: branch.title,
                                          summary:
                                            (isHopBranch || isPassedBranch) && branchHop
                                              ? `${branchHop.metadataState.stage} · ${branchHop.metadataState.policyDecision} — ${branch.summary}`
                                              : branch.summary,
                                          metric: branch.metric,
                                          status: isHopBranch
                                            ? `ACTIVE · HOP ${currentHop.stepNumber}`
                                            : isPassedBranch && branchHop
                                              ? `PASSED · HOP ${branchHop.stepNumber}`
                                              : isQueuedBranch && branchHop
                                                ? `QUEUED · HOP ${branchHop.stepNumber}`
                                                : isInStack
                                                  ? 'IN STACK'
                                                  : branch.role,
                                          hint: `${branch.compositions.length} nodes · Click`,
                                          accent: isHopBranch
                                            ? 'amber'
                                            : isPassedBranch || isInStack
                                              ? 'emerald'
                                              : 'navy',
                                        },
                                        e,
                                      )
                                    }
                                    onMouseMove={moveHoverTip}
                                    onMouseLeave={clearHoverTip}
                                    onFocus={(e) =>
                                      showFocusTip(
                                        {
                                          id: `branch-${branch.id}`,
                                          code: branch.code,
                                          title: branch.title,
                                          summary: branch.summary,
                                          metric: branch.metric,
                                          status: isHopBranch
                                            ? `ACTIVE · HOP ${currentHop.stepNumber}`
                                            : isInStack
                                              ? 'IN STACK'
                                              : branch.role,
                                          hint: `${branch.compositions.length} nodes · Click`,
                                          accent: isHopBranch
                                            ? 'amber'
                                            : isPassedBranch || isInStack
                                              ? 'emerald'
                                              : 'navy',
                                        },
                                        e,
                                      )
                                    }
                                    onBlur={clearHoverTip}
                                    aria-expanded={isBranchOpen}
                                    className="text-left min-w-0 flex-1 cursor-pointer focus:outline-none"
                                  >
                                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                                      <span
                                        className={
                                          isHopBranch
                                            ? isDark
                                              ? 'text-[#E0B063] font-bold'
                                              : 'text-[#8A5C10] font-bold'
                                            : isPassedBranch || isInStack
                                              ? isDark
                                                ? 'text-[#6FCB9F] font-bold'
                                                : 'text-[#1C6E46] font-bold'
                                              : isDark
                                                ? 'text-[#8FA6E8] font-bold'
                                                : 'text-[#1F3863] font-bold'
                                        }
                                      >
                                        {isHopBranch
                                          ? `ACTIVE · HOP ${currentHop.stepNumber} · ${branch.code}`
                                          : isPassedBranch && branchHop
                                            ? `PASSED · HOP ${branchHop.stepNumber} · ${branch.code}`
                                            : isQueuedBranch && branchHop
                                              ? `QUEUED · HOP ${branchHop.stepNumber} · ${branch.code}`
                                              : branch.code}
                                      </span>
                                      <span className={mutedText} aria-hidden="true">
                                        ·
                                      </span>
                                      <span className={`truncate ${mutedText}`}>{branch.role}</span>
                                    </div>
                                    <div className="text-xs sm:text-[13px] font-bold mt-0.5 leading-snug">
                                      {branch.title}
                                    </div>
                                    <div className={`text-[11px] font-mono mt-1 tabular-nums ${mutedText}`}>
                                      {branch.metric}
                                    </div>
                                    {(isHopBranch || isPassedBranch) && branchHop && (
                                      <div
                                        className={`mt-1.5 pt-1.5 border-t font-mono text-[10px] leading-snug space-y-0.5 ${
                                          isHopBranch
                                            ? isDark
                                              ? 'border-[#E0B063]/30 text-[#E7EBF5]'
                                              : 'border-[#8A5C10]/25 text-[#16213A]'
                                            : isDark
                                              ? 'border-[#6FCB9F]/25 text-[#C3CCE4]'
                                              : 'border-[#1C6E46]/20 text-[#4A5163]'
                                        }`}
                                      >
                                        <div className="truncate">
                                          <span className={mutedText}>State: </span>
                                          <strong
                                            style={{
                                              color: isHopBranch ? hopAmber : activeGreen,
                                            }}
                                          >
                                            {branchHop.metadataState.stage}
                                          </strong>
                                        </div>
                                        <div className="truncate">
                                          <span className={mutedText}>Policy: </span>
                                          <span>{branchHop.metadataState.policyDecision}</span>
                                        </div>
                                      </div>
                                    )}
                                  </button>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {branch.appId && (
                                      <button
                                        type="button"
                                        onClick={() => toggleApp(branch.appId!)}
                                        title={
                                          isInStack
                                            ? `Remove ${branch.title} from stack`
                                            : `Add ${branch.title} to stack`
                                        }
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                                          isInStack
                                            ? isDark
                                              ? 'bg-[#6FCB9F] text-[#0B1020]'
                                              : 'bg-[#1C6E46] text-white'
                                            : isDark
                                              ? 'bg-[#0F1529] text-[#C3CCE4] border border-[#232B4A] hover:border-[#7FA6FF]'
                                              : 'bg-[#F2EFE9] text-[#16213A] border border-[#E4DFD6] hover:border-[#1F3863]'
                                        }`}
                                      >
                                        {isInStack ? (
                                          <>
                                            <Check className="w-3 h-3" strokeWidth={2.25} />
                                            <span>Active</span>
                                          </>
                                        ) : (
                                          <>
                                            <Plus className="w-3 h-3" strokeWidth={2} />
                                            <span>Add</span>
                                          </>
                                        )}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => toggleBranch(branch)}
                                      aria-label={
                                        isBranchOpen
                                          ? `Collapse ${branch.title} compositions`
                                          : `Expand ${branch.title} compositions`
                                      }
                                      className={`p-1 rounded-md transition-colors cursor-pointer ${mutedText}`}
                                    >
                                      {isBranchOpen ? (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Level-3 Expandable Leaf Compositions */}
                                {isBranchOpen && (
                                  <div
                                    className={`px-3 pb-3 pt-2 border-t space-y-1.5 ${
                                      isDark
                                        ? 'border-[#232B4A] bg-[#0F1529]/60'
                                        : 'border-[#ECE8E0] bg-[#FAF8F4]/70'
                                    }`}
                                  >
                                    <div className={`font-mono text-[9.5px] ${mutedText}`}>
                                      Sub-Components &amp; Compositions ({branch.compositions.length})
                                    </div>
                                    {branch.compositions.map((comp) => {
                                      const isHighlightedLeaf =
                                        isHopBranch &&
                                        currentHop?.highlightCompKind === comp.kind;
                                        const leafPayload: HoveredTipPayload = {
                                          id: `leaf-${comp.id}`,
                                          code: comp.code,
                                          title: comp.label,
                                          summary: comp.detail,
                                          metric: comp.metric,
                                          status: isHighlightedLeaf
                                            ? 'ACTIVE HOP SPEC'
                                            : comp.kind.toUpperCase(),
                                          hint: comp.linkedAppId
                                            ? 'Click to jump'
                                            : 'Click to inspect',
                                          accent: isHighlightedLeaf
                                            ? 'amber'
                                            : comp.kind === 'synergy' || comp.kind === 'proof'
                                              ? 'emerald'
                                              : 'navy',
                                        };
                                        return (
                                          <button
                                            key={comp.id}
                                            type="button"
                                            onClick={() => {
                                              if (comp.linkedAppId) {
                                                focusLinkedAppBranch(comp.linkedAppId);
                                              } else {
                                                setInspectedBranchId(branch.id);
                                              }
                                            }}
                                            onMouseEnter={(e) => showHoverTip(leafPayload, e)}
                                            onMouseMove={moveHoverTip}
                                            onMouseLeave={clearHoverTip}
                                            onFocus={(e) => showFocusTip(leafPayload, e)}
                                            onBlur={clearHoverTip}
                                          className={`w-full text-left px-2.5 py-1.5 rounded-md border text-[11px] flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                            isHighlightedLeaf
                                              ? isDark
                                                ? 'bg-[#2A2112]/90 border-[#E0B063]'
                                                : 'bg-[#FDF5E6] border-[#8A5C10]'
                                              : isDark
                                                ? 'bg-[#141A32] border-[#232B4A] hover:border-[#7FA6FF]'
                                                : 'bg-[#FFFFFF] border-[#E4DFD6] hover:border-[#1F3863]'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <span
                                              className={`font-mono text-[9.5px] font-bold shrink-0 ${
                                                isHighlightedLeaf
                                                  ? isDark
                                                    ? 'text-[#E0B063]'
                                                    : 'text-[#8A5C10]'
                                                  : comp.kind === 'synergy'
                                                    ? isDark
                                                      ? 'text-[#6FCB9F]'
                                                      : 'text-[#1C6E46]'
                                                    : isDark
                                                      ? 'text-[#8FA6E8]'
                                                      : 'text-[#1F3863]'
                                              }`}
                                            >
                                              {comp.code}
                                            </span>
                                            <span className="truncate font-medium">{comp.label}</span>
                                          </div>
                                          <span className={`font-mono text-[10px] shrink-0 tabular-nums ${mutedText}`}>
                                            {comp.metric}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </PathwayPanZoomStage>

        {/* Right roadmap.sh-Style Deep-Dive Inspector Drawer */}
        <aside
          className={`${compact ? 'xl:col-span-4' : 'lg:col-span-4'} p-4 sm:p-5 flex flex-col justify-between gap-4 ${
            isDark ? 'bg-[#0F1529]' : 'bg-[#F2EFE9]/65'
          }`}
          aria-label="Node architecture inspector"
        >
          {inspectedContext ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-current/10">
                <div className="min-w-0">
                  <div className={`font-mono text-[10px] ${mutedText}`}>
                    {inspectedContext.trunk.index}. {inspectedContext.trunk.title}
                  </div>
                  <h4 className="text-base font-extrabold tracking-tight mt-0.5 leading-snug">
                    {inspectedContext.branch.title}
                  </h4>
                  <div className={`text-xs mt-0.5 ${secondaryText}`}>
                    {inspectedContext.branch.role}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedBranchId(null)}
                  aria-label="Close inspector details"
                  className={`p-1 rounded-md cursor-pointer ${mutedText}`}
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              <p className={`text-xs leading-relaxed ${secondaryText}`}>
                {inspectedContext.branch.summary}
              </p>

              {/* Quantitative Metadata Strip */}
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className={`rounded-lg border p-2.5 ${cardClass}`}>
                  <div className={`text-[10px] ${mutedText}`}>Primary Metric</div>
                  <div className="font-bold mt-0.5 tabular-nums">
                    {inspectedContext.branch.metric}
                  </div>
                </div>
                <div className={`rounded-lg border p-2.5 ${cardClass}`}>
                  <div className={`text-[10px] ${mutedText}`}>
                    {inspectedContext.branch.proofClient ? 'Verified Proof' : 'Architecture Layers'}
                  </div>
                  <div className="font-bold mt-0.5 truncate">
                    {inspectedContext.branch.proofClient ??
                      inspectedContext.branch.layers?.join(' · ') ??
                      activeProfile.shortLabel}
                  </div>
                </div>
              </div>

              {/* Active Hop-by-Hop Playback State for Inspected Node */}
              {activeHopIdx >= 0 &&
                (() => {
                  const idxInTrace = activeTrace.hops.findIndex(
                    (h) => h.branchId === inspectedContext.branch.id,
                  );
                  if (idxInTrace < 0) return null;
                  const hopMeta = activeTrace.hops[idxInTrace];
                  const prevMeta = idxInTrace > 0 ? activeTrace.hops[idxInTrace - 1] : null;
                  const nodeState =
                    idxInTrace === activeHopIdx
                      ? isPlaying
                        ? 'Executing'
                        : 'Active'
                      : idxInTrace < activeHopIdx
                        ? 'Passed'
                        : 'Queued';
                  return (
                    <div
                      className={`rounded-lg border p-3 space-y-1.5 text-[11px] ${
                        idxInTrace === activeHopIdx
                          ? isDark
                            ? 'bg-[#2A2112]/80 border-[#E0B063]'
                            : 'bg-[#FDF5E6] border-[#8A5C10]'
                          : idxInTrace < activeHopIdx
                            ? isDark
                              ? 'bg-[#10261F]/70 border-[#6FCB9F]'
                              : 'bg-[#ECF7F1] border-[#1C6E46]'
                            : isDark
                              ? 'bg-[#141A32] border-[#2E3862] border-dashed'
                              : 'bg-[#FFFFFF] border-[#B8C4DA] border-dashed'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 font-mono text-[10px] font-bold tabular-nums">
                        <span
                          style={{
                            color:
                              idxInTrace === activeHopIdx
                                ? hopAmber
                                : idxInTrace < activeHopIdx
                                  ? activeGreen
                                  : brandStroke,
                          }}
                        >
                          HOP {hopMeta.stepNumber}/{activeTrace.hops.length} · {nodeState.toUpperCase()}
                        </span>
                        <span className={mutedText}>
                          {prevMeta ? `${prevMeta.nodeCode} → ${hopMeta.nodeCode}` : `Entry → ${hopMeta.nodeCode}`} ({hopMeta.transitionLabel})
                        </span>
                      </div>
                      <p className={`leading-relaxed ${secondaryText}`}>{hopMeta.payloadSummary}</p>
                      <div className="grid grid-cols-1 gap-1 pt-1 border-t border-current/10 font-mono text-[10px]">
                        <div>
                          <span className={mutedText}>Stage: </span>
                          <strong>{hopMeta.metadataState.stage}</strong>
                        </div>
                        <div>
                          <span className={mutedText}>Enclave: </span>
                          <strong>{hopMeta.metadataState.enclaveState}</strong>
                        </div>
                        <div>
                          <span className={mutedText}>Policy: </span>
                          <strong style={{ color: hopAmber }}>{hopMeta.metadataState.policyDecision}</strong>
                        </div>
                        <div>
                          <span className={mutedText}>Audit: </span>
                          <strong style={{ color: activeGreen }}>{hopMeta.metadataState.auditProof}</strong>
                        </div>
                      </div>
                      <div className={`font-mono text-[10px] tabular-nums ${mutedText}`}>
                        Target {hopMeta.latencyTarget} · {hopMeta.pitfallMitigation}
                      </div>
                    </div>
                  );
                })()}

              {/* Deployment Trade-Off & Failure Pitfall Callout (system-design-explainer) */}
              <div
                className={`rounded-lg border p-3 space-y-1.5 text-[11px] ${
                  isDark
                    ? 'bg-[#141A32] border-[#2E3862]'
                    : 'bg-[#FFFFFF] border-[#CFC8BC]'
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 font-mono text-[10px] font-bold ${
                    isDark ? 'text-[#E0B063]' : 'text-[#8A5C10]'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                  <span>Deployment Trade-Off &amp; Pitfall ({activeProfile.shortLabel})</span>
                </div>
                <p className={`leading-relaxed ${secondaryText}`}>
                  {activeProfile.tradeOffGuidance}
                </p>
                <p className={`font-mono text-[10.5px] leading-snug ${mutedText}`}>
                  {activeProfile.failurePitfall}
                </p>
              </div>

              {/* Direct 3D Brain Hub Deep-Link CTA */}
              {inspectedBrainHub && (
                <div
                  className={`rounded-lg border p-3 flex flex-col gap-2 ${
                    isDark
                      ? 'bg-[#141A32] border-[#8FA6E8]/35'
                      : 'bg-[#EEF3FB]/70 border-[#1F3863]/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                    <span className={isDark ? 'text-[#8FA6E8] font-bold' : 'text-[#1F3863] font-bold'}>
                      3D Neural Core Hub {inspectedBrainHub.hubNum}
                    </span>
                    <span className={`truncate ${mutedText}`}>{inspectedBrainHub.hubLabel}</span>
                  </div>
                  {activeBrainSelection.hubId === inspectedBrainHub.hubId && (
                    <div className={`font-mono text-[10px] ${isDark ? 'text-[#6FCB9F]' : 'text-[#1C6E46]'}`}>
                      Active 3D Brain selection synced to Hub {inspectedBrainHub.hubNum}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      handleInspectBranchIn3D(inspectedContext.trunk.id, inspectedContext.branch)
                    }
                    className={`w-full min-h-[38px] py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      isDark
                        ? 'bg-[#8FA6E8] text-[#0B1020] hover:bg-[#A6B9F0]'
                        : 'bg-[#1F3863] text-white hover:bg-[#12233F]'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5" strokeWidth={1.8} />
                    <span>Inspect in 3D Brain (Hub {inspectedBrainHub.hubNum})</span>
                  </button>
                </div>
              )}

              {/* Stack Composer Sync Action if Linked to a Spenta Module */}
              {inspectedContext.branch.appId && (
                <button
                  type="button"
                  onClick={() => toggleApp(inspectedContext.branch.appId!)}
                  className={`w-full min-h-[38px] py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedIds.includes(inspectedContext.branch.appId)
                      ? isDark
                        ? 'bg-[#6FCB9F] text-[#0B1020]'
                        : 'bg-[#1C6E46] text-white'
                      : isDark
                        ? 'bg-[#141A32] border border-[#8FA6E8] text-[#8FA6E8] hover:bg-[#1B2547]'
                        : 'bg-white border border-[#1F3863] text-[#1F3863] hover:bg-[#EEF3FB]'
                  }`}
                >
                  {selectedIds.includes(inspectedContext.branch.appId) ? (
                    <>
                      <Check className="w-3.5 h-3.5" strokeWidth={2.25} />
                      <span>Included in Stack Composer (Click to Remove)</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Add Module to Live Stack Composer</span>
                    </>
                  )}
                </button>
              )}

              {/* Detailed Composition Checklist */}
              <div className="space-y-2">
                <div className={`flex items-center gap-1.5 font-mono text-[10px] ${mutedText}`}>
                  <Layers className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>
                    Branch Compositions ({inspectedContext.branch.compositions.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {inspectedContext.branch.compositions.map((comp) => (
                    <div
                      key={comp.id}
                      className={`rounded-lg border p-2.5 space-y-1 ${cardClass}`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold">
                          <span
                            className={`font-mono text-[10px] mr-1.5 ${
                              isDark ? 'text-[#8FA6E8]' : 'text-[#1F3863]'
                            }`}
                          >
                            {comp.code}
                          </span>
                          {comp.label}
                        </span>
                        <span className={`font-mono text-[10px] shrink-0 tabular-nums ${mutedText}`}>
                          {comp.metric}
                        </span>
                      </div>
                      <p className={`text-[11px] leading-relaxed ${secondaryText}`}>
                        {comp.detail}
                      </p>
                      {comp.linkedAppId && (
                        <button
                          type="button"
                          onClick={() => focusLinkedAppBranch(comp.linkedAppId!)}
                          className={`text-[11px] font-mono font-semibold hover:underline cursor-pointer ${
                            isDark ? 'text-[#7FA6FF]' : 'text-[#1F3863]'
                          }`}
                        >
                          Jump to branch →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2">
              <GitBranch className={`w-6 h-6 ${mutedText}`} strokeWidth={1.5} />
              <div className="text-sm font-bold">Select Any Branch Node</div>
              <p className={`text-xs max-w-xs leading-relaxed ${secondaryText}`}>
                Click any architectural sub-component on the left—or press Walkthrough—to inspect protocols, failure mitigations, and live Stack Composer bindings.
              </p>
            </div>
          )}

          <div
            className={`pt-3 border-t text-[11px] font-mono flex items-center justify-between gap-2 ${
              isDark ? 'border-[#232B4A] text-[#8D97B5]' : 'border-[#E4DFD6] text-[#5F6576]'
            }`}
          >
            <span>{activeProfile.shortLabel}</span>
            <span className="tabular-nums">13 Apps · 6 Layers · 4 Tiers</span>
          </div>
        </aside>
      </div>

      {/* Animated Frosted-Glass Hover Tooltip for Interactive Architecture Nodes */}
      <ArchitectureNodeTooltip data={hoveredTip} isDark={isDark} />
    </section>
  );
}
