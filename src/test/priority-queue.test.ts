import { describe, it, expect } from "vitest";
import { PriorityQueue, computeScore, type Patient } from "@/lib/priority-queue";

const mk = (id: string, s: Patient["severity_level"], t: number, now: number): Patient => {
  const p: Patient = { id, name: id, severity_level: s, arrival_time: t, dynamic_score: 0 };
  p.dynamic_score = computeScore(p, now);
  return p;
};

describe("priority queue", () => {
  it("pops critical before minor", () => {
    const q = new PriorityQueue([mk("minor", 5, 0, 0), mk("crit", 1, 0, 0), mk("mod", 3, 0, 0)]);
    expect(q.pop()!.id).toBe("crit");
    expect(q.pop()!.id).toBe("mod");
  });
  it("aged minor patient overtakes fresh moderate", () => {
    const now = 60_000;
    const q = new PriorityQueue([mk("mod", 3, now, now), mk("minor", 5, 0, now)]);
    expect(q.pop()!.id).toBe("minor");
  });
});
