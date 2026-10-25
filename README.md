# APEX RUSH F1 🏎️💨

A premier, high-octane 2D Formula 1 racing simulation built with HTML5 Canvas, modern physics, procedural sound synthesis, and customizable neon LED underglow ground effects.

![APEX RUSH F1](https://img.shields.io/badge/APEX_RUSH-F1_CHAMPIONSHIP-red?style=for-the-badge&logo=formula1)

---

## 🌟 Key Features

- **High-Performance 2D Canvas Engine**: 60fps physics simulation with clamped delta-time (`Math.min(dt, 0.05)`), multi-sample Catmull-Rom spline circuits, and camera follow dynamics.
- **Customizable Neon LED Underglow Lights**: 8 vivid ground-effect LED underglow lighting modes (Cyber Cyan, Acid Lime, Apex Red, Hyper Violet, Sunburst Gold, Polar Ice, RGB Chroma cycle, or Off) that illuminate the dark asphalt beneath the floor of the car with engine-reactive pulsing!
- **Realistic Formula 1 Vehicle Anatomy**:
  - Detailed carbon monocoque chassis, sidepod radiator vents, and aerodynamic bargeboards.
  - Steerable front slick tires that visibly turn with steering angle.
  - Multi-element stepped front wing and high-downforce rear wing with DRS flap.
  - Driver cockpit with safety Halo ring and helmet visor reflections.
  - Dynamic flashing rear LED rain/brake light.
  - Tire smoke plumes, persistent skid marks on braking/sliding, and titanium skid plate sparks.
- **8 Formula 1 Constructors & Drivers**:
  - **Red Bull Racing** (Max Verstappen) - High downforce & explosive exit acceleration.
  - **Scuderia Ferrari** (Charles Leclerc) - Screaming top-end hybrid power & razor-sharp front-end bite.
  - **Mercedes-AMG F1** (Lewis Hamilton) - Precision German chassis balance & consistent race pace.
  - **McLaren F1 Team** (Lando Norris) - Papaya high-speed direction change agility.
  - **Aston Martin Aramco** (Fernando Alonso) - Veteran tire preservation & braking stability.
  - **Alpine F1 Team** (Pierre Gasly) - Nimble chicane turn-in & responsive hybrid power.
  - **Williams Racing** (Alex Albon) - Blistering straight-line trap speed.
  - **Haas F1 Team** (Nico Hülkenberg) - Punchy qualifying agility & wheel-to-wheel tenacity.
- **3 Grand Prix Circuits**:
  1. **Coastal GP (Riviera Marina, Monaco)**: Fast flowing circuit with seaside cliffs, yacht marina, tunnel chicane, and harbor turns.
  2. **Neon City GP (Neo-Tokyo, Singapore)**: Technical night street circuit with wet asphalt, glowing floodlights, and neon barriers.
  3. **Desert International (Sakhir Dunes, Bahrain)**: Expansive modern GP track with a 1.2km DRS straight, high-speed esses, and desert sand runoff.
- **3 Game Modes**:
  - **Quick Race**: 8-car grid with starting 5-lights countdown, 3-10 laps, 4 AI difficulty tiers, live leaderboard gaps, and podium results.
  - **Time Trial**: Solo hot lap battle against the clock with persistent personal best records saved locally.
  - **Free Practice**: Pressure-free practice session to master braking points, telemetry, and racing lines.
- **Synthesized Web Audio Engine**: Zero external MP3 downloads required! Dynamic F1 V6 turbo hybrid engine revs with RPM scaling, gear shifts, tire squeals, countdown beeps, crash sounds, and checkered flag fanfares.
- **Cross-Platform Responsive Controls**: Desktop keyboard controls and mobile/tablet on-screen touch steering pads and pedals.

---

## 🕹️ Controls

### Desktop Keyboard
| Key | Action |
| :--- | :--- |
| **W / Up Arrow** | Accelerate / Gas Pedal |
| **S / Down Arrow** | Brake / Reverse Gear |
| **A / Left Arrow** | Steer Left |
| **D / Right Arrow** | Steer Right |
| **Spacebar** | Handbrake / Power Drift |
| **R** | Reset Car to Nearest Track Centerline (2s cooldown) |
| **Esc** | Pause / Resume Race Session |

### Mobile / Tablet
- On-screen touch buttons for **Steer Left**, **Steer Right**, **Throttle**, and **Brake/Reverse**.
- Instant touch toggle in Settings.

---

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or pnpm / yarn)

---

## 🚀 Installation & Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/apex-rush-f1.git
   cd apex-rush-f1
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000` (or the port indicated in your terminal).

---

## 🏗️ Production Build

To compile a minified, production-ready static bundle:

```bash
npm run build
```

The compiled assets will be placed inside the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```

---

## 🌐 Deployment Instructions

### Deploy to GitHub Pages

1. In `vite.config.ts`, set the `base` property to match your GitHub repository name:
   ```typescript
   export default defineConfig({
     base: '/apex-rush-f1/', // Replace with your repository name
     // ... other config
   });
   ```

2. Run the build:
   ```bash
   npm run build
   ```

3. Push the contents of the `dist/` folder to the `gh-pages` branch using `gh-pages`:
   ```bash
   npx gh-pages -d dist
   ```

4. Go to **Settings > Pages** on your GitHub repository and ensure the source is set to `gh-pages`.

### Deploy to Vercel / Netlify / Cloudflare Pages

1. Connect your repository to the hosting provider.
2. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
3. Click **Deploy**.

---

## 🛠️ Troubleshooting

- **No Sound?** Modern browsers restrict audio until the first user interaction. Click anywhere on the screen or press "Start Race" to unlock the Web Audio context. Also verify that the mute button at the top right is unmuted.
- **Controls Not Responding?** Ensure the game window has focus by clicking inside the game viewport.
- **Car Stuck Off-Track?** Press **R** on your keyboard (or tap the Reset icon in the HUD) to safely respawn on the nearest track centerline.
- **Reset Saved Times?** Open **Settings > Reset Lap Records** to clear personal best times from `localStorage`.

---

## 📄 License

Apache-2.0. Built for high-speed motorsport racing enthusiasts.
