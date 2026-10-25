# APEX RUSH F1: Full System Audit & Official F1 Team Integration

Audit and enhance APEX RUSH F1 by integrating real Formula 1 constructors (Red Bull Racing, Scuderia Ferrari, Mercedes-AMG, McLaren, etc.) with official driver names, adding a prominent interactive team picker to the main menu and pre-race setup, and conducting a deep codebase audit across physics, collision, lap validation, memory lifecycle, and build configuration.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product decisions were confirmed during the planning interview:
> - **Real F1 Team Names & Drivers**: The 8-team grid will feature official team names (Red Bull Racing, Scuderia Ferrari, Mercedes-AMG Petronas, McLaren F1, Aston Martin Aramco, Alpine F1, Williams Racing, Haas F1) paired with their iconic drivers (Max Verstappen, Charles Leclerc, Lewis Hamilton, Lando Norris, Fernando Alonso, Pierre Gasly, Alex Albon, Nico Hülkenberg).
> - **Prominent Team Selector**: A dedicated, interactive team selection carousel and livery card bar will be featured directly on the Main Menu and pre-race setup screen, allowing instant team switching alongside the garage customization modal.

---

## 1. Overview & Core Concept

- **What It Does**: APEX RUSH F1 is a 60fps top-down 2D canvas motorsport simulator. Players pilot an open-wheel Formula 1 car with aerodynamic downforce, power drifts, customizable underglow neon LED ground effects, and dynamic telemetry against a 7-car AI grid.
- **Target Audience**: Motorsport fans and casual gamers seeking authentic F1 racecraft, real constructor identities, responsive controls, and zero-loading arcade stability.
- **Key Value**: A stable, standalone browser game requiring zero external asset downloads, offering responsive desktop and mobile controls, persistent personal best timing, and authentic racing audio.

---

## 2. User Experience & Visual Design

- **Prominent Main Menu Team Selector**:
  - Horizontal constructor selector placed directly on the Title Screen.
  - Interactive constructor badges displaying real team names (e.g., Red Bull Racing, Ferrari), official livery colors, and driver names.
  - Instant live car preview updates on selection, showcasing the team's aerodynamics and chosen underglow LED lighting.
- **Race Setup Flow**:
  - Title Screen: Mode (Quick Race / Time Trial / Practice) -> Prominent Team Pick -> Laps (3, 5, 10) & AI Difficulty (Easy, Medium, Hard, Pro) -> Direct "START RACE" CTA.
  - Deep Customization: "Customize Garage" button opens the full LED Underglow and Vehicle Studio.
- **Visual Identity**:
  - 60% Carbon-neutral asphalt and dark garage canvas (`#06080c`, `#0f172a`).
  - 30% Structural titanium panels, kerb geometry, and telemetry clusters (`#1e293b`, `#334155`).
  - 10% Constructor identity accents (Ferrari Scarlet, Red Bull Deep Navy & Yellow, Mercedes Cyan, McLaren Papaya, Aston Martin Racing Green) and neon underglow bloom.

---

## 3. Audit Findings & Engineering Fixes

A thorough audit of the entire codebase was conducted across 6 core areas:

### A. Team Roster & Driver Profiles (`src/game/constants.ts`)
- **Current State**: Uses fictional aliases ("Apex Crimson", "Scuderia Corsa", "Silver Spear").
- **Fix**: Update team definitions to real F1 constructors and drivers with authentic primary, secondary, and accent colors, balanced downforce ratings, and top speed values.

### B. Delta-Time & Game Loop Stability (`src/game/engine.ts`, `src/game/physics.ts`)
- **Audit**: Clamping `rawDt` to `Math.min(rawDt, 0.05)` is currently active, preventing physics explosions when tab switches occur.
- **Enhancement**: Ensure `currentLapStartTime` and timing deltas correctly account for pauses and countdown states so lap timers never accumulate paused duration.

### C. Collision Detection & Boundary Safety (`src/game/physics.ts`)
- **Audit**: Overlap resolution currently scales by `overlap * 0.5`. In tight multi-car packs (turns 1 and 2), multiple simultaneous overlaps could cause micro-jitter.
- **Enhancement**: Add minimum distance safeguards and clamp maximum impulse force to prevent unnatural spin-outs.

### D. Memory Lifecycle & Garbage Collection (`src/game/engine.ts`, `src/game/audio.ts`)
- **Audit**: Skid mark arrays capped at 500 segments; particles capped at 200.
- **Enhancement**: Ensure `skidMarks` use a circular FIFO buffer when reaching capacity to continuously drop the oldest segments smoothly. Ensure Web Audio oscillator nodes disconnect properly upon stopping or unmounting.

### E. Lap Counting & Anti-Cheat Validation (`src/game/engine.ts`)
- **Audit**: Checkpoints validated sequentially (0 to 23).
- **Enhancement**: Ensure finish line crossing only registers if at least 80% of checkpoints were visited in that lap, preventing accidental triggers when cars spin near the line.

### F. Package & Deployment Configuration (`package.json`, `vite.config.ts`, `README.md`)
- **Audit**: Verify Vite dev server configuration, production build commands, and GitHub Pages base path instructions.

---

## 4. Technical Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                               App.tsx                                  │
│  - Active View State (TITLE | RACING | PAUSED | FINISHED)              │
│  - Race Settings (Constructor, Driver, Track, Laps, AI Difficulty)     │
│  - Audio Master Mute State & LocalStorage Synchronization              │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
         ┌──────────▼──────────┐          ┌──────────▼──────────┐
         │     TitleScreen     │          │       RaceHUD       │
         │ - Hero Title Lockup │          │ - Lap & Timing Bar  │
         │ - Mode Selector     │          │ - Shift Light Bar   │
         │ - PROMINENT F1 TEAM │          │ - Speed & Gear HUD  │
         │   PICKER CAROUSEL   │          │ - Minimap Radar     │
         │ - Live Car Preview  │          │ - Touch Controls    │
         └──────────┬──────────┘          └──────────┬──────────┘
                    │                                │
         ┌──────────▼────────────────────────────────▼──────────┐
         │                    GameEngine.ts                     │
         │ - RequestAnimationFrame 60fps Fixed-Step Loop       │
         │ - Input Manager (Keyboard WASD/Arrows + Touch)       │
         │ - Checkpoint Anti-Cut Lap Validation                 │
         │ - Starting Lights 5-Red Sequence Manager             │
         └──────────┬──────────────────┬─────────────────┬──────┘
                    │                  │                 │
         ┌──────────▼───────┐  ┌───────▼──────┐  ┌───────▼──────┐
         │    Physics.ts    │  │  Renderer.ts │  │   Audio.ts   │
         │ - Aerodynamics   │  │ - 2D Canvas  │  │ - Web Audio  │
         │ - Drift & Grip   │  │ - Car Models │  │   V6 Engine  │
         │ - Collisions     │  │ - Underglow  │  │ - Screeches  │
         └──────────────────┘  └──────────────┘  └──────────────┘
```

---

## 5. Implementation Steps

1. **Update Constructor Roster (`src/game/constants.ts`)**:
   - Define Red Bull Racing (Verstappen), Scuderia Ferrari (Leclerc), Mercedes-AMG (Hamilton), McLaren F1 (Norris), Aston Martin Aramco (Alonso), Alpine F1 (Gasly), Williams Racing (Albon), Haas F1 (Hülkenberg).
2. **Implement Prominent Team Selector in UI (`src/components/TitleScreen.tsx`)**:
   - Add a high-visibility team selector bar with team badges, driver names, and livery swatches right on the main menu.
   - Synchronize with the live `CarPreviewCanvas`.
3. **Audit & Harden Engine Subsystems**:
   - `src/game/physics.ts`: Fine-tune multi-car collision damping and barrier rebounds.
   - `src/game/engine.ts`: Verify paused time calculation, circular FIFO skid mark pool, and lap sequence validation.
   - `src/game/audio.ts`: Verify audio context suspension and cleanup.
   - `src/components/CarSelectModal.tsx`: Sync real constructor list and underglow LED options.
4. **Build & Lint Verification**:
   - Run `compile_applet` and `lint_applet` to confirm zero compilation or TypeScript errors.
   - Verify deployment instructions in `README.md`.
