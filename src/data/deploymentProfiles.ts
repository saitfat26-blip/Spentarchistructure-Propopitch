export type DeploymentTargetId = 'on-prem' | 'private-vpc' | 'air-gapped';
export type DeploymentProviderId = DeploymentTargetId;

export type CoreLayerKey = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6';

export type DeploymentIsolationMode =
  | 'Air-Gapped On-Prem'
  | 'Private Sovereign VPC'
  | 'Hybrid Edge';

export type DeploymentPolicyMode =
  | 'Strict OPA (>= 0.88 HITL)'
  | 'Balanced OPA (>= 0.85 HITL)'
  | 'Audit-Only Monitor';

export interface DeploymentLayerPreset {
  isolationMode: DeploymentIsolationMode;
  policyMode: DeploymentPolicyMode;
  teeEnabled: boolean;
  slaTarget: string;
}

export interface DeploymentProfileSpec {
  id: DeploymentTargetId;
  switcherLabel: string;
  shortLabel: string;
  title: string;
  transport: string;
  enclaveBoundary: string;
  latencyBudget: string;
  egressPolicy: string;
  compliancePosture: string;
  costPosture: string;
  tradeOffGuidance: string;
  failurePitfall: string;
  layerPresets: Record<CoreLayerKey, DeploymentLayerPreset>;
}

export const DEPLOYMENT_TARGET_ORDER: DeploymentTargetId[] = [
  'on-prem',
  'private-vpc',
  'air-gapped',
];

export const DEPLOYMENT_PROFILES: Record<DeploymentTargetId, DeploymentProfileSpec> = {
  'on-prem': {
    id: 'on-prem',
    switcherLabel: 'On-Prem',
    shortLabel: 'Sovereign On-Prem',
    title: 'Customer-Owned On-Premises Appliance (Tier 1–4)',
    transport: 'Local Loopback NVLink + 10GbE LAN mTLS',
    enclaveBoundary: 'AMD SEV-SNP / Intel TDX on Client Rack (0 bytes cloud egress)',
    latencyBudget: '<35ms LAN · <50ms Edge',
    egressPolicy: 'Zero Cloud PII Egress · Local Signed Model Registry',
    compliancePosture: 'BB ICT v4.0 · HIPAA Local PHI · SOC2 Type II',
    costPosture: 'One-time CapEx ($3.2K–$15.3K) · Zero GPU token burn',
    tradeOffGuidance:
      'Maximizes regulatory sovereignty (BB ICT v4.0 / HIPAA) and eliminates per-token OpEx; requires scheduled local NVMe snapshot replication.',
    failurePitfall:
      'Pitfall: Single-PSU workstation power loss halts live OCR queues. Mitigation: Dual-node active/passive failover + encrypted local NAS backup.',
    layerPresets: {
      L6: {
        isolationMode: 'Private Sovereign VPC',
        policyMode: 'Strict OPA (>= 0.88 HITL)',
        teeEnabled: false,
        slaTarget: '99.95% UI uptime · <120ms TTI',
      },
      L5: {
        isolationMode: 'Air-Gapped On-Prem',
        policyMode: 'Strict OPA (>= 0.88 HITL)',
        teeEnabled: true,
        slaTarget: '0.88 HITL Gate · 100% immutable audit trace',
      },
      L4: {
        isolationMode: 'Private Sovereign VPC',
        policyMode: 'Balanced OPA (>= 0.85 HITL)',
        teeEnabled: false,
        slaTarget: '60–90 FPS XR · <18MB WebAR payloads',
      },
      L3: {
        isolationMode: 'Air-Gapped On-Prem',
        policyMode: 'Strict OPA (>= 0.88 HITL)',
        teeEnabled: true,
        slaTarget: '<30s/form ICR · 0 bytes cloud PII egress',
      },
      L2: {
        isolationMode: 'Air-Gapped On-Prem',
        policyMode: 'Strict OPA (>= 0.88 HITL)',
        teeEnabled: true,
        slaTarget: '<50ms edge inference · Hardware-enforced memory encryption',
      },
      L1: {
        isolationMode: 'Hybrid Edge',
        policyMode: 'Balanced OPA (>= 0.85 HITL)',
        teeEnabled: true,
        slaTarget: '80 BaaS Stations / 480 EVs · Sub-second MQTT ingest',
      },
    },
  },
  'private-vpc': {
    id: 'private-vpc',
    switcherLabel: 'VPC',
    shortLabel: 'Private VPC',
    title: 'Dedicated Single-Tenant Sovereign VPC',
    transport: 'WireGuard mTLS Mesh + PrivateLink Peering',
    enclaveBoundary: 'Confidential Compute VM + Customer-Managed KMS Keys (BYOK)',
    latencyBudget: '45–95ms Regional Backbone',
    egressPolicy: 'Deny-by-Default OPA Egress · Private DNS Endpoints Only',
    compliancePosture: 'ISO 27001 · Regional Data Residency · BYOK HSM',
    costPosture: 'Reserved Dedicated GPU OpEx + Zero Multi-Tenant Bleed',
    tradeOffGuidance:
      'Enables elastic multi-region bursting for distributed retail chains (65+ showrooms) while retaining encrypted single-tenant isolation.',
    failurePitfall:
      'Pitfall: Cross-AZ egress spikes or misconfigured NAT routes leaking embeddings. Mitigation: Strict OPA egress deny-by-default & private endpoint DNS lock.',
    layerPresets: {
      L6: {
        isolationMode: 'Private Sovereign VPC',
        policyMode: 'Strict OPA (>= 0.88 HITL)',
        teeEnabled: false,
        slaTarget: '99.99% Multi-AZ UI · <95ms Regional TTI',
      },
      L5: {
        isolationMode: 'Private Sovereign VPC',
        policyMode: 'Strict OPA (>= 0.88 HITL)',
        teeEnabled: true,
        slaTarget: '0.88 HITL Gate · BYOK KMS Signed Audit Stream',
      },
      L4: {
        isolationMode: 'Private Sovereign VPC',
        policyMode: 'Balanced OPA (>= 0.85 HITL)',
        teeEnabled: false,
        slaTarget: '60–90 FPS XR · Private CDN Edge PoPs',
      },
      L3: {
        isolationMode: 'Private Sovereign VPC',
        policyMode: 'Strict OPA (>= 0.88 HITL)',
        teeEnabled: true,
        slaTarget: 'Single-Tenant GPU Pool · PrivateLink Zero-NAT',
      },
      L2: {
        isolationMode: 'Private Sovereign VPC',
        policyMode: 'Strict OPA (>= 0.88 HITL)',
        teeEnabled: true,
        slaTarget: 'Confidential VM (SEV-SNP/TDX) · <65ms RPC',
      },
      L1: {
        isolationMode: 'Hybrid Edge',
        policyMode: 'Balanced OPA (>= 0.85 HITL)',
        teeEnabled: true,
        slaTarget: 'WireGuard mTLS Branch Tunnel · Store-and-Forward',
      },
    },
  },
  'air-gapped': {
    id: 'air-gapped',
    switcherLabel: 'Air-Gap',
    shortLabel: 'Air-Gapped Enclave',
    title: 'Zero-Internet Air-Gapped Defense & Core Banking Enclave',
    transport: 'Unidirectional Hardware Data Diode + Signed Offline Bundles',
    enclaveBoundary: 'Physical Faraday / HSM Hardware Root-of-Trust (No External NIC)',
    latencyBudget: '<28ms Deterministic Enclave Bus',
    egressPolicy: 'Physically Severed External NIC · SHA-256 Cassette Updates',
    compliancePosture: 'Tier-1 Core Banking · Defense Secret Enclave · Zero-Trust HSM',
    costPosture: 'Dedicated Dual-Redundant CapEx + Quarterly Signed Model Drops',
    tradeOffGuidance:
      'Eliminates remote exfiltration surface entirely for defense, sovereign health registries, and Tier-1 banking cores.',
    failurePitfall:
      'Pitfall: Model drift or stale AML/clinical ontologies without internet sync. Mitigation: Cryptographically signed SHA-256 offline weight & policy cassettes.',
    layerPresets: {
      L6: {
        isolationMode: 'Air-Gapped On-Prem',
        policyMode: 'Strict OPA (>= 0.88 HITL)',
        teeEnabled: true,
        slaTarget: 'Intranet-Only Operator Console · Hardware Smartcard Auth',
      },
      L5: {
        isolationMode: 'Air-Gapped On-Prem',
        policyMode: 'Strict OPA (>= 0.88 HITL)',
        teeEnabled: true,
        slaTarget: '0.88 Mandatory HITL · WORM Hardware Audit Vault',
      },
      L4: {
        isolationMode: 'Air-Gapped On-Prem',
        policyMode: 'Strict OPA (>= 0.88 HITL)',
        teeEnabled: true,
        slaTarget: 'Local Offline 3D/XR Asset Vault · Zero CDN Calls',
      },
      L3: {
        isolationMode: 'Air-Gapped On-Prem',
        policyMode: 'Strict OPA (>= 0.88 HITL)',
        teeEnabled: true,
        slaTarget: 'SHA-256 Signed Offline Weights · Zero Egress Bus',
      },
      L2: {
        isolationMode: 'Air-Gapped On-Prem',
        policyMode: 'Strict OPA (>= 0.88 HITL)',
        teeEnabled: true,
        slaTarget: '<28ms Deterministic Bus · Full Hardware TEE Enforced',
      },
      L1: {
        isolationMode: 'Air-Gapped On-Prem',
        policyMode: 'Strict OPA (>= 0.88 HITL)',
        teeEnabled: true,
        slaTarget: 'Hardware Data Diode Ingest · Physical Port Lock',
      },
    },
  },
};
