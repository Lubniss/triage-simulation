export interface Patient {
  id: string;
  name: string;
  severity_level: 1 | 2 | 3 | 4 | 5;
  emergency?: boolean;
  blood_type?: string;
  age?: number;
  arrival_time: number;
  dynamic_score: number;
}

export const SEVERITY_WEIGHT: Record<number, number> = { 1: 100, 2: 80, 3: 60, 4: 40, 5: 20 };
export const AGING_MULTIPLIER = 1.5; // points per second waited

export function computeScore(p: Patient, now: number): number {
  const waitedSec = (now - p.arrival_time) / 1000;
  return Math.round((SEVERITY_WEIGHT[p.severity_level]! + waitedSec * AGING_MULTIPLIER) * 10) / 10;
}

/** Binary max-heap keyed by dynamic_score (ties: earlier arrival first). */
export class PriorityQueue {
  private heap: Patient[];
  constructor(items: Patient[] = []) {
    this.heap = [];
    items.forEach((i) => this.push(i));
  }
  private higher(a: Patient, b: Patient) {
    if (!!a.emergency !== !!b.emergency) return !!a.emergency;
    if (a.emergency && b.emergency) return a.arrival_time < b.arrival_time;
    return a.dynamic_score > b.dynamic_score ||
      (a.dynamic_score === b.dynamic_score && a.arrival_time < b.arrival_time);
  }
  get size() { return this.heap.length; }
  push(p: Patient) {
    const h = this.heap;
    h.push(p);
    let i = h.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.higher(h[i]!, h[parent]!)) break;
      [h[i], h[parent]] = [h[parent]!, h[i]!];
      i = parent;
    }
  }
  pop(): Patient | undefined {
    const h = this.heap;
    if (!h.length) return undefined;
    const top = h[0]!;
    const last = h.pop()!;
    if (h.length) {
      h[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let best = i;
        if (l < h.length && this.higher(h[l]!, h[best]!)) best = l;
        if (r < h.length && this.higher(h[r]!, h[best]!)) best = r;
        if (best === i) break;
        [h[i], h[best]] = [h[best]!, h[i]!];
        i = best;
      }
    }
    return top;
  }
  /** Drain into sorted array (highest priority first) without mutating. */
  toSorted(): Patient[] {
    const copy = new PriorityQueue();
    copy.heap = [...this.heap];
    const out: Patient[] = [];
    let p;
    while ((p = copy.pop())) out.push(p);
    return out;
  }
}

const FIRST = ["Ava","Liam","Noah","Emma","Olivia","Mia","Ethan","Zara","Arjun","Priya","Lucas","Sofia","Kenji","Amara","Diego","Hana","Omar","Ines","Ravi","Chloe"];
const LAST = ["Patel","Smith","Garcia","Kim","Nguyen","Okafor","Rossi","Müller","Silva","Khan","Lopez","Tanaka","Brown","Haddad","Singh"];
export const randomName = () =>
  `${FIRST[Math.floor(Math.random() * FIRST.length)]} ${LAST[Math.floor(Math.random() * LAST.length)]}`;

const BLOOD = ["O-","O+","A-","A+","B-","B+","AB-","AB+"];
export const randomBloodType = () => BLOOD[Math.floor(Math.random() * BLOOD.length)]!;
export const randomAge = () => 1 + Math.floor(Math.random() * 90);

export const MAX_TREATMENT_MS = 30_000;
/** Random duration around the doctor's average (50%–150%), hard-capped at 30s. */
export function treatmentDuration(avgMs: number, rand = Math.random()): number {
  return Math.min(MAX_TREATMENT_MS, avgMs * (0.5 + rand));
}
