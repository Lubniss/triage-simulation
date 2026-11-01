import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Activity, AlertTriangle, BedDouble, ClipboardPlus, Clock, Droplet, Siren, HeartPulse, Pause, Play, Stethoscope, Users, CheckCircle2, RotateCcw } from "lucide-react";
import { PriorityQueue, computeScore, randomAge, randomBloodType, treatmentDuration, type Patient } from "@/lib/priority-queue";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Triage Live — Hospital Queue Simulation" },
      { name: "description", content: "Real-time ER triage simulation with priority-queue scheduling, dynamic aging and 3 treatment rooms." },
      { property: "og:title", content: "Triage Live — Hospital Queue Simulation" },
      { property: "og:description", content: "Watch a heap-based priority queue route patients to treatment rooms in real time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

interface Doctor { name: string; specialty: string; avgMs: number }
interface Room { doctor: Doctor; patient: Patient | null; endsAt: number }
const DOCTORS: Doctor[] = [
  { name: "Dr. Smith", specialty: "Trauma / ER", avgMs: 20_000 },
  { name: "Dr. Patel", specialty: "Cardiology", avgMs: 15_000 },
  { name: "Dr. Lee", specialty: "General Practice", avgMs: 10_000 },
];
const emptyRooms = (): Room[] => DOCTORS.map((d) => ({ doctor: d, patient: null, endsAt: 0 }));
const LEVELS = [
  { v: 1, label: "Critical" }, { v: 2, label: "Emergent" }, { v: 3, label: "Urgent" }, { v: 4, label: "Less urgent" }, { v: 5, label: "Minor" },
] as const;

const sevMeta = (s: number) =>
  ({ label: LEVELS[s - 1]?.label ?? "Minor", ...(s <= 2 ? { cls: "sev-critical", dot: "bg-critical" }
  : s <= 3 ? { cls: "sev-moderate", dot: "bg-moderate" }
  : { cls: "sev-minor", dot: "bg-minor" }) });

let idSeq = 1;
const resetIdSeq = () => { idSeq = 1; };
const newPatient = (name: string, s: Patient["severity_level"], emergency: boolean): Patient => {
  const now = Date.now();
  const p: Patient = { id: `P-${String(idSeq++).padStart(3, "0")}`, name, severity_level: s, emergency, blood_type: randomBloodType(), age: randomAge(), arrival_time: now, dynamic_score: 0 };
  p.dynamic_score = computeScore(p, now);
  return p;
};

function Index() {
  const [queue, setQueue] = useState<Patient[]>([]);
  const [rooms, setRooms] = useState<Room[]>(emptyRooms);
  const [now, setNow] = useState(Date.now());
  const [running, setRunning] = useState(true);
  const [discharged, setDischarged] = useState(0);
  const [name, setName] = useState("");
  const [sev, setSev] = useState<Patient["severity_level"]>(3);
  const [emergency, setEmergency] = useState(false);
  const queueRef = useRef(queue);
  queueRef.current = queue;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    setQueue((q) => [...q, newPatient(n, sev, emergency)]);
    setName(""); setEmergency(false);
  };

  const resetAll = () => {
    setQueue([]);
    setRooms(emptyRooms());
    setDischarged(0);
    setNow(Date.now());
    resetIdSeq();
  };

  // Dynamic aging every 2s
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      const n = Date.now();
      setQueue((q) => q.map((p) => ({ ...p, dynamic_score: computeScore(p, n) })));
    }, 2000);
    return () => clearInterval(t);
  }, [running]);

  // Clock tick for countdowns + discharge
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [running]);

  // Discharge + auto-assign
  useEffect(() => {
    if (!running) return;
    let changed = false;
    let freed = 0;
    const next = rooms.map((r) => {
      if (r.patient && now >= r.endsAt) { changed = true; freed++; toast.success(`${r.doctor.name} is now free`); return { ...r, patient: null }; }
      return r;
    });
    if (freed) setDischarged((d) => d + freed);
    if (next.some((r) => !r.patient) && queueRef.current.length) {
      const pq = new PriorityQueue(queueRef.current);
      for (let i = 0; i < next.length; i++) {
        if (next[i]!.patient) continue;
        const p = pq.pop();
        if (!p) break;
        next[i] = { ...next[i]!, patient: p, endsAt: now + treatmentDuration(next[i]!.doctor.avgMs) };
        changed = true;
      }
      const taken = new Set(next.map((r) => r.patient?.id));
      setQueue((q) => q.filter((p) => !taken.has(p.id)));
    }
    if (changed) setRooms(next);
  }, [now, queue.length, running]); // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = useMemo(() => new PriorityQueue(queue).toSorted(), [queue]);
  const occupied = rooms.filter((r) => r.patient).length;
  const critCount = queue.filter((p) => p.severity_level === 1).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-4 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center size-10 rounded-xl bg-primary text-primary-foreground"><HeartPulse className="size-5" /></div>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight">Triage Live</h1>
              <p className="text-xs text-muted-foreground">Emergency department queue simulation</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium ${running ? "sev-minor" : "bg-muted text-muted-foreground"}`}>
              <span className={`size-2 rounded-full ${running ? "bg-minor animate-pulse" : "bg-muted-foreground"}`} />
              {running ? "Simulation running" : "Paused"}
            </span>
            <button onClick={() => setRunning((r) => !r)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 hover:bg-muted transition">
              {running ? <Pause className="size-4" /> : <Play className="size-4" />}{running ? "Pause" : "Resume"}
            </button>
            <button onClick={resetAll} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 hover:bg-muted transition" title="Clear waiting list, rooms and counters">
              <RotateCcw className="size-4" />Reset
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={<Users className="size-4" />} label="Waiting" value={queue.length} />
          <Stat icon={<AlertTriangle className="size-4" />} label="Critical waiting" value={critCount} tone="text-critical" />
          <Stat icon={<BedDouble className="size-4" />} label="Rooms occupied" value={`${occupied}/3`} />
          <Stat icon={<CheckCircle2 className="size-4" />} label="Discharged" value={discharged} />
        </section>

        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-4 grid gap-3 md:grid-cols-[1fr_220px_auto_auto] md:items-end">
          <div className="md:col-span-4 flex items-center gap-2 font-display font-semibold"><ClipboardPlus className="size-4" />Receptionist Intake</div>
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Patient name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder="e.g. Jane Doe"
              className="rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Severity</span>
            <select value={sev} onChange={(e) => setSev(Number(e.target.value) as Patient["severity_level"])}
              className="rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring">
              {LEVELS.map((l) => <option key={l.v} value={l.v}>Level {l.v} — {l.label}</option>)}
            </select>
          </label>
          <label className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium cursor-pointer ${emergency ? "sev-critical" : "border-border"}`}>
            <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} className="accent-primary" />
            <Siren className="size-4" />Emergency Override
          </label>
          <button type="submit" disabled={!name.trim()} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition">
            Add to queue
          </button>
        </form>

        <div className="grid lg:grid-cols-[380px_1fr] gap-6">
          <section className="rounded-2xl border border-border bg-card flex flex-col max-h-[70vh]">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-display font-semibold flex items-center gap-2"><Clock className="size-4" />Waiting Room</h2>
              <span className="text-xs text-muted-foreground">sorted by score ↓</span>
            </div>
            <ol className="p-3 space-y-2 overflow-y-auto flex-1">
              {sorted.length === 0 && <li className="text-sm text-muted-foreground text-center py-10">No patients waiting</li>}
              {sorted.map((p, i) => {
                const m = sevMeta(p.severity_level);
                const waited = Math.floor((now - p.arrival_time) / 1000);
                return (
                  <li key={p.id} className={`rounded-xl border p-3 flex items-center gap-3 animate-in fade-in slide-in-from-left-2 transition-all ${p.emergency ? "sev-critical ring-2 ring-critical" : m.cls}`}>
                    <span className="font-mono text-xs w-5 text-center opacity-60">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate flex items-center gap-1.5">{p.emergency && <Siren className="size-3.5 shrink-0" />}{p.name}</div>
                      <div className="text-xs opacity-75">{p.id} · L{p.severity_level} {m.label} · {p.age}y · {p.blood_type} · waited {waited}s</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-lg leading-none">{p.emergency ? "ER" : p.dynamic_score.toFixed(1)}</div>
                      <div className="text-[10px] uppercase tracking-wide opacity-60">{p.emergency ? "override" : "score"}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="px-4 py-3 border-t border-border text-[11px] text-muted-foreground">Score = severity weight (L1 100 … L5 20) + seconds waited × 1.5 · Emergency Override always goes first</p>
          </section>

          <section>
            <h2 className="font-display font-semibold flex items-center gap-2 mb-3"><Stethoscope className="size-4" />Treatment Rooms</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {rooms.map((r, i) => {
                const m = r.patient ? sevMeta(r.patient.severity_level) : null;
                return (
                  <div key={i} className={`rounded-2xl border p-5 min-h-56 flex flex-col transition-all ${r.patient ? "bg-card border-border shadow-lg" : "border-dashed border-border bg-muted/40"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Room {i + 1}</span>
                      <span className={`size-2.5 rounded-full ${r.patient ? m!.dot + " animate-pulse" : "bg-muted-foreground/40"}`} />
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm"><Stethoscope className="size-4 text-primary" /><span className="font-semibold">{r.doctor.name}</span></div>
                    <div className="text-xs text-muted-foreground">{r.doctor.specialty}</div>
                    {r.patient ? (
                      <div className="mt-auto space-y-3 animate-in fade-in zoom-in-95">
                        <div>
                          <div className="font-display text-lg font-semibold">{r.patient.name}</div>
                          <span className={`inline-block mt-1 text-xs rounded-full px-2 py-0.5 border ${m!.cls}`}>L{r.patient.severity_level} {m!.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Droplet className="size-3.5" />{r.patient.blood_type} · {r.patient.age}y · <span className="animate-pulse">In treatment…</span></div>
                      </div>
                    ) : (
                      <div className="mt-auto flex flex-col items-center text-muted-foreground py-6"><Activity className="size-6 mb-1" /><span className="text-sm">Available</span></div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Stat({ icon, label, value, tone = "" }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className={`font-display text-2xl font-bold mt-1 ${tone}`}>{value}</div>
    </div>
  );
}
