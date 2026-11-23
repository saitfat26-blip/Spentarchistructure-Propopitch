import * as THREE from 'three';

export interface OrbitSampleBody {
  hubId: string;
  label: string;
  planetRadius: number;
  orbitRadius: number;
  radiusScale: number;
  eccentricity: number;
  worldPos: THREE.Vector3;
  orbitSamples: THREE.Vector3[];
}

export interface OrbitalIntersectionPoint {
  pairKey: string;
  hubA: string;
  hubB: string;
  labelA: string;
  labelB: string;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  minSeparation: number;
}

export type GravityWellFlashKind = 'path-intersection' | 'planetary-conjunction';

export interface GravityWellFlashEvent {
  id: number;
  active: boolean;
  pairKey: string;
  hubA: string;
  hubB: string;
  labelA: string;
  labelB: string;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  intensity: number;
  ageSec: number;
  durationSec: number;
  kind: GravityWellFlashKind;
}

export interface CollisionMonitorSummary {
  intersectionCount: number;
  activeFlashCount: number;
  latestFlashId: number;
  latestPairLabel: string | null;
  latestKind: GravityWellFlashKind | null;
  latestIntersectionFlashId: number;
  latestIntersectionPairLabel: string | null;
}

const MAX_INTERSECTIONS = 28;
const MAX_FLASHES = 12;

/**
 * Threshold in 3D world units below which two planetary orbital paths
 * are considered intersecting or grazing a shared gravitational corridor.
 * Chosen so nominal concentric circular orbits (>= 1.40 units radial gap)
 * report 0 false positives while Eccentric / Chaotic / Jittered crossings trigger cleanly.
 */
const PATH_INTERSECTION_TOLERANCE = 0.78;
const PATH_INTERSECTION_TOLERANCE_SQ =
  PATH_INTERSECTION_TOLERANCE * PATH_INTERSECTION_TOLERANCE;
const SECOND_LOBE_MIN_SEP_SQ = 2.6 * 2.6;

const PATH_TRAVERSAL_COOLDOWN_SEC = 1.85;
const CONJUNCTION_COOLDOWN_SEC = 2.35;
const TOPOLOGY_FLASH_COOLDOWN_SEC = 1.65;
const GRAVITY_WELL_FLASH_DURATION_SEC = 1.35;

/**
 * Zero-GC collision & orbital intersection detector for Solar System mode.
 * Monitors live 3D planet world coordinates alongside their Keplerian orbital curves
 * and triggers subtle 'gravity-well' flash events whenever orbital paths intersect
 * or a planet traverses an intersecting corridor.
 */
export class SolarOrbitCollisionMonitor {
  readonly intersections: OrbitalIntersectionPoint[];
  readonly flashes: GravityWellFlashEvent[];

  private intersectionCount = 0;
  private nextFlashId = 1;
  private latestFlashId = 0;
  private latestIntersectionFlashId = 0;
  private lastTopologySig = '';
  private latestPairLabel: string | null = null;
  private latestIntersectionPairLabel: string | null = null;
  private latestKind: GravityWellFlashKind | null = null;

  private readonly lastTriggerTime = new Map<string, number>();
  private readonly activePairSet = new Set<string>();
  private readonly prevPairSet = new Set<string>();

  // Pre-allocated scratch vectors (zero allocation in render loop)
  private readonly _tanA = new THREE.Vector3();
  private readonly _tanB = new THREE.Vector3();
  private readonly _normalScratch = new THREE.Vector3();
  private readonly _midScratch = new THREE.Vector3();
  private readonly _lobe1Pos = new THREE.Vector3();

  constructor() {
    this.intersections = Array.from({ length: MAX_INTERSECTIONS }, () => ({
      pairKey: '',
      hubA: '',
      hubB: '',
      labelA: '',
      labelB: '',
      position: new THREE.Vector3(),
      normal: new THREE.Vector3(0, 1, 0),
      minSeparation: 0,
    }));

    this.flashes = Array.from({ length: MAX_FLASHES }, () => ({
      id: 0,
      active: false,
      pairKey: '',
      hubA: '',
      hubB: '',
      labelA: '',
      labelB: '',
      position: new THREE.Vector3(),
      normal: new THREE.Vector3(0, 1, 0),
      intensity: 0.75,
      ageSec: 0,
      durationSec: GRAVITY_WELL_FLASH_DURATION_SEC,
      kind: 'path-intersection',
    }));
  }

  reset() {
    this.intersectionCount = 0;
    this.latestFlashId = 0;
    this.latestIntersectionFlashId = 0;
    this.lastTopologySig = '';
    this.latestPairLabel = null;
    this.latestIntersectionPairLabel = null;
    this.latestKind = null;
    this.lastTriggerTime.clear();
    this.activePairSet.clear();
    this.prevPairSet.clear();
    for (let i = 0; i < MAX_FLASHES; i++) {
      this.flashes[i].active = false;
      this.flashes[i].ageSec = 0;
    }
  }

  private computeOrbitPlaneNormal(
    samples: THREE.Vector3[],
    sampleIdx: number,
    out: THREE.Vector3,
  ) {
    const n = samples.length;
    if (n < 3) {
      out.set(0, 1, 0);
      return;
    }
    const prevIdx = (sampleIdx - 1 + n) % n;
    const nextIdx = (sampleIdx + 1) % n;
    const quarterIdx = (sampleIdx + Math.floor(n / 4)) % n;
    this._tanA.copy(samples[nextIdx]).sub(samples[prevIdx]);
    this._tanB.copy(samples[quarterIdx]).sub(samples[sampleIdx]);
    out.crossVectors(this._tanA, this._tanB);
    if (out.lengthSq() < 1e-5) {
      out.set(0, 1, 0);
    } else {
      out.normalize();
      if (out.y < 0) out.negate();
    }
  }

  private spawnFlash(
    triggerKey: string,
    pairKey: string,
    bodyA: OrbitSampleBody,
    bodyB: OrbitSampleBody,
    position: THREE.Vector3,
    normal: THREE.Vector3,
    intensity: number,
    kind: GravityWellFlashKind,
    realTime: number,
    cooldownSec: number,
  ) {
    const lastFired = this.lastTriggerTime.get(triggerKey);
    if (lastFired !== undefined && realTime - lastFired < cooldownSec) {
      return;
    }
    this.lastTriggerTime.set(triggerKey, realTime);

    // Pick first inactive slot or evict oldest flash
    let slotIdx = -1;
    let oldestAge = -1;
    let oldestIdx = 0;
    for (let k = 0; k < MAX_FLASHES; k++) {
      if (!this.flashes[k].active) {
        slotIdx = k;
        break;
      }
      if (this.flashes[k].ageSec > oldestAge) {
        oldestAge = this.flashes[k].ageSec;
        oldestIdx = k;
      }
    }
    if (slotIdx < 0) slotIdx = oldestIdx;

    const slot = this.flashes[slotIdx];
    slot.id = this.nextFlashId++;
    slot.active = true;
    slot.pairKey = pairKey;
    slot.hubA = bodyA.hubId;
    slot.hubB = bodyB.hubId;
    slot.labelA = bodyA.label;
    slot.labelB = bodyB.label;
    slot.position.copy(position);
    slot.normal.copy(normal);
    slot.intensity = THREE.MathUtils.clamp(intensity, 0.35, 1.0);
    slot.ageSec = 0;
    slot.durationSec =
      kind === 'planetary-conjunction' ? GRAVITY_WELL_FLASH_DURATION_SEC * 1.15 : GRAVITY_WELL_FLASH_DURATION_SEC;
    slot.kind = kind;

    this.latestFlashId = slot.id;
    this.latestPairLabel = `${bodyA.label} × ${bodyB.label}`;
    this.latestKind = kind;
    if (kind === 'path-intersection') {
      this.latestIntersectionFlashId = slot.id;
      this.latestIntersectionPairLabel = `${bodyA.label} × ${bodyB.label}`;
    }
  }

  evaluate(
    bodies: OrbitSampleBody[],
    realTime: number,
    rawDt: number,
  ): CollisionMonitorSummary {
    // 1. Advance & expire active gravity-well flashes
    let activeFlashCount = 0;
    for (let k = 0; k < MAX_FLASHES; k++) {
      const f = this.flashes[k];
      if (!f.active) continue;
      f.ageSec += rawDt;
      if (f.ageSec >= f.durationSec) {
        f.active = false;
      } else {
        activeFlashCount++;
      }
    }
    if (activeFlashCount === 0) {
      this.latestPairLabel = null;
      this.latestKind = null;
    }

    // 2. Detect 3D orbital path intersections & monitor planetary coordinates
    this.activePairSet.clear();
    let iCount = 0;

    // Lightweight topology signature to recognize newly established intersections
    let topoHash = 0;
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      topoHash +=
        Math.round(b.radiusScale * 100) * (i + 1) +
        Math.round(b.eccentricity * 1000) * (i + 7);
    }
    const topologyChanged = this.lastTopologySig !== String(topoHash);
    this.lastTopologySig = String(topoHash);

    for (let i = 0; i < bodies.length; i++) {
      const bA = bodies[i];
      const aA = bA.orbitRadius * bA.radiusScale;
      const rMinA = aA * (1 - bA.eccentricity);
      const rMaxA = aA * (1 + bA.eccentricity);

      for (let j = i + 1; j < bodies.length; j++) {
        const bB = bodies[j];
        const aB = bB.orbitRadius * bB.radiusScale;
        const rMinB = aB * (1 - bB.eccentricity);
        const rMaxB = aB * (1 + bB.eccentricity);

        // Monitor live planet-to-planet 3D coordinate proximity
        const liveSep = bA.worldPos.distanceTo(bB.worldPos);
        const encounterThreshold =
          (bA.planetRadius + bB.planetRadius) * 2.4 + 0.52;
        if (liveSep <= encounterThreshold) {
          this._midScratch.copy(bA.worldPos).add(bB.worldPos).multiplyScalar(0.5);
          this._normalScratch.set(0, 1, 0);
          const pairKey = `${bA.hubId}__${bB.hubId}`;
          const proximityStrength = 1 - liveSep / encounterThreshold;
          this.spawnFlash(
            `conj:${pairKey}`,
            pairKey,
            bA,
            bB,
            this._midScratch,
            this._normalScratch,
            0.55 + proximityStrength * 0.45,
            'planetary-conjunction',
            realTime,
            CONJUNCTION_COOLDOWN_SEC,
          );
        }

        // Quick perihelion/aphelion radial overlap screen before scanning 3D curve samples
        if (
          rMaxA < rMinB - PATH_INTERSECTION_TOLERANCE ||
          rMaxB < rMinA - PATH_INTERSECTION_TOLERANCE
        ) {
          continue;
        }

        const sA = bA.orbitSamples;
        const sB = bB.orbitSamples;
        let best1DistSq = PATH_INTERSECTION_TOLERANCE_SQ;
        let best1IdxA = -1;
        let best1IdxB = -1;

        for (let aIdx = 0; aIdx < sA.length; aIdx++) {
          const pA = sA[aIdx];
          for (let bIdx = 0; bIdx < sB.length; bIdx++) {
            const dSq = pA.distanceToSquared(sB[bIdx]);
            if (dSq < best1DistSq) {
              best1DistSq = dSq;
              best1IdxA = aIdx;
              best1IdxB = bIdx;
            }
          }
        }

        if (best1IdxA >= 0 && iCount < MAX_INTERSECTIONS) {
          this._midScratch
            .copy(sA[best1IdxA])
            .add(sB[best1IdxB])
            .multiplyScalar(0.5);
          this._lobe1Pos.copy(this._midScratch);
          this.computeOrbitPlaneNormal(sA, best1IdxA, this._normalScratch);

          const minSep1 = Math.sqrt(best1DistSq);
          const pairKey1 = `${bA.hubId}__${bB.hubId}__0`;
          this.activePairSet.add(pairKey1);

          const slot1 = this.intersections[iCount++];
          slot1.pairKey = pairKey1;
          slot1.hubA = bA.hubId;
          slot1.hubB = bB.hubId;
          slot1.labelA = bA.label;
          slot1.labelB = bB.label;
          slot1.position.copy(this._midScratch);
          slot1.normal.copy(this._normalScratch);
          slot1.minSeparation = minSep1;

          // Trigger flash if orbital intersection newly formed OR either planet's coordinates cross it
          const newlyIntersected1 =
            !this.prevPairSet.has(pairKey1) && realTime > 0.25 && topologyChanged;
          const crossThreshold = Math.max(
            0.9,
            Math.max(bA.planetRadius, bB.planetRadius) * 2.15,
          );
          const distPlanetA = bA.worldPos.distanceTo(slot1.position);
          const distPlanetB = bB.worldPos.distanceTo(slot1.position);

          if (newlyIntersected1) {
            this.spawnFlash(
              `topo:${pairKey1}`,
              pairKey1,
              bA,
              bB,
              slot1.position,
              slot1.normal,
              0.72,
              'path-intersection',
              realTime,
              TOPOLOGY_FLASH_COOLDOWN_SEC,
            );
          }
          if (distPlanetA <= crossThreshold) {
            this.spawnFlash(
              `cross:${pairKey1}:${bA.hubId}`,
              pairKey1,
              bA,
              bB,
              slot1.position,
              slot1.normal,
              0.68 + (1 - distPlanetA / crossThreshold) * 0.32,
              'path-intersection',
              realTime,
              PATH_TRAVERSAL_COOLDOWN_SEC,
            );
          }
          if (distPlanetB <= crossThreshold) {
            this.spawnFlash(
              `cross:${pairKey1}:${bB.hubId}`,
              pairKey1,
              bA,
              bB,
              slot1.position,
              slot1.normal,
              0.68 + (1 - distPlanetB / crossThreshold) * 0.32,
              'path-intersection',
              realTime,
              PATH_TRAVERSAL_COOLDOWN_SEC,
            );
          }

          // Check opposite orbital lobe intersection (>= 2.6 units away from first crossing)
          if (iCount < MAX_INTERSECTIONS) {
            let best2DistSq = PATH_INTERSECTION_TOLERANCE_SQ;
            let best2IdxA = -1;
            let best2IdxB = -1;
            for (let aIdx = 0; aIdx < sA.length; aIdx++) {
              const pA = sA[aIdx];
              if (pA.distanceToSquared(this._lobe1Pos) < SECOND_LOBE_MIN_SEP_SQ) {
                continue;
              }
              for (let bIdx = 0; bIdx < sB.length; bIdx++) {
                const dSq = pA.distanceToSquared(sB[bIdx]);
                if (dSq < best2DistSq) {
                  best2DistSq = dSq;
                  best2IdxA = aIdx;
                  best2IdxB = bIdx;
                }
              }
            }

            if (best2IdxA >= 0) {
              this._midScratch
                .copy(sA[best2IdxA])
                .add(sB[best2IdxB])
                .multiplyScalar(0.5);
              this.computeOrbitPlaneNormal(sA, best2IdxA, this._normalScratch);
              const minSep2 = Math.sqrt(best2DistSq);
              const pairKey2 = `${bA.hubId}__${bB.hubId}__1`;
              this.activePairSet.add(pairKey2);

              const slot2 = this.intersections[iCount++];
              slot2.pairKey = pairKey2;
              slot2.hubA = bA.hubId;
              slot2.hubB = bB.hubId;
              slot2.labelA = bA.label;
              slot2.labelB = bB.label;
              slot2.position.copy(this._midScratch);
              slot2.normal.copy(this._normalScratch);
              slot2.minSeparation = minSep2;

              const newlyIntersected2 =
                !this.prevPairSet.has(pairKey2) && realTime > 0.25 && topologyChanged;
              const dA2 = bA.worldPos.distanceTo(slot2.position);
              const dB2 = bB.worldPos.distanceTo(slot2.position);

              if (newlyIntersected2) {
                this.spawnFlash(
                  `topo:${pairKey2}`,
                  pairKey2,
                  bA,
                  bB,
                  slot2.position,
                  slot2.normal,
                  0.68,
                  'path-intersection',
                  realTime,
                  TOPOLOGY_FLASH_COOLDOWN_SEC,
                );
              }
              if (dA2 <= crossThreshold) {
                this.spawnFlash(
                  `cross:${pairKey2}:${bA.hubId}`,
                  pairKey2,
                  bA,
                  bB,
                  slot2.position,
                  slot2.normal,
                  0.65 + (1 - dA2 / crossThreshold) * 0.32,
                  'path-intersection',
                  realTime,
                  PATH_TRAVERSAL_COOLDOWN_SEC,
                );
              }
              if (dB2 <= crossThreshold) {
                this.spawnFlash(
                  `cross:${pairKey2}:${bB.hubId}`,
                  pairKey2,
                  bA,
                  bB,
                  slot2.position,
                  slot2.normal,
                  0.65 + (1 - dB2 / crossThreshold) * 0.32,
                  'path-intersection',
                  realTime,
                  PATH_TRAVERSAL_COOLDOWN_SEC,
                );
              }
            }
          }
        }
      }
    }

    this.intersectionCount = iCount;
    this.prevPairSet.clear();
    this.activePairSet.forEach((k) => this.prevPairSet.add(k));

    // Recompute active flash count in case new flashes spawned this frame
    activeFlashCount = 0;
    for (let k = 0; k < MAX_FLASHES; k++) {
      if (this.flashes[k].active) activeFlashCount++;
    }

    return {
      intersectionCount: this.intersectionCount,
      activeFlashCount,
      latestFlashId: this.latestFlashId,
      latestPairLabel: this.latestPairLabel,
      latestKind: this.latestKind,
      latestIntersectionFlashId: this.latestIntersectionFlashId,
      latestIntersectionPairLabel: this.latestIntersectionPairLabel,
    };
  }
}

export function createGravityWellFlashTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.96)');
  grad.addColorStop(0.18, 'rgba(165, 243, 252, 0.72)');
  grad.addColorStop(0.42, 'rgba(72, 142, 255, 0.34)');
  grad.addColorStop(0.72, 'rgba(72, 142, 255, 0.08)');
  grad.addColorStop(1.0, 'rgba(4, 10, 22, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
