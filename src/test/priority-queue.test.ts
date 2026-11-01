import { describe, it, expect } from "vitest";
import { PriorityQueue, computeScore, type Patient } from "@/lib/priority-queue";

const mk = (id: string, s: Patient["severity_level"], t: number, now: number): Patient => {
  const p: Patient = { id, name: id, severity_level: s, arrival_time: t, dynamic_score: 0 };
  p.dynamic_score = computeScore(p, now);
  return p;
};

describe("priority queue", () => {
  it("pops critical before minor", () => {
    const q = new PriorityQueue([mk("minor", 3, 0, 0), mk("crit", 1, 0, 0), mk("mod", 2, 0, 0)]);
    expect(q.pop()!.id).toBe("crit");
    expect(q.pop()!.id).toBe("mod");
  });
  it("aged minor patient overtakes fresh moderate", () => {
    const now = 60_000;
    const q = new PriorityQueue([mk("mod", 2, now, now), mk("minor", 3, 0, now)]);
    expect(q.pop()!.id).toBe("minor");
  });
});

import { treatmentDuration } from "@/lib/priority-queue";
describe("receptionist rules", () => {
  it("emergency override jumps ahead of any score", () => {
    const now = 600_000;
    const old = mk("old-crit", 1, 0, now);
    const em = { ...mk("em", 5, now, now), emergency: true };
    const q = new PriorityQueue([old, em]);
    expect(q.pop()!.id).toBe("em");
  });
  it("treatment never exceeds 30 seconds", () => {
    expect(treatmentDuration(20_000, 0.999)).toBe(30_000);
    expect(treatmentDuration(10_000, 0)).toBe(2_500);
  });
});
