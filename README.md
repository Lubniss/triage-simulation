# Triage Simulation

Build a full-stack Hospital Patient Queue Simulation in React.

Core Goal: Create a dynamic healthcare dashboard that visualizes a triage waiting room and 3 active treatment rooms. The system must use a Priority Queue (Heap) algorithm to automatically sort patients by a dynamic severity score, ensuring critical emergencies are treated first.

UI & Layout Requirements (Use Tailwind CSS & Lucide Icons):

Header: A clean, modern dashboard header displaying the active simulation status.

Action Panel: Buttons to manually inject new patients: "Add Critical (Level 1)", "Add Moderate (Level 3)", and "Add Minor (Level 5)".

Waiting Room Column: A vertical list of waiting patients. Color-code the patient cards based on severity (e.g., Red for Critical, Yellow for Moderate, Green for Minor).

Treatment Rooms (3 slots): Visual indicators showing which doctor is treating which patient, along with a countdown timer for their discharge.

Simulation & Priority Queue Logic (Implement in TypeScript/React State):

Create a Patient interface with: id, name (generate random mock names), severity_level (1-5, where 1 is highest priority), arrival_time, and dynamic_score.

Implement a Priority Queue algorithm. The dynamic_score should be calculated as: (Severity Weight) + (Time Waiting * Multiplier).

Dynamic Aging: Write a useEffect interval that updates the wait time for all queued patients every 2 seconds. If a minor injury patient waits long enough, their priority score should slowly increase so they don't stay at the bottom forever.

Auto-Assign: Whenever one of the 3 treatment rooms becomes empty, the system must automatically pop the patient with the highest dynamic_score from the queue and move them into the available room. Treat them for a random duration (5 to 15 seconds) before discharging them.

Make the UI polished, responsive, and visually engaging. Ensure the dynamic resorting of the waiting list is instantly visible when new patients are added or wait times increase.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://triage-simulation.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/39d829ca-7fb3-50c1-8b10-777e49f938b0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
