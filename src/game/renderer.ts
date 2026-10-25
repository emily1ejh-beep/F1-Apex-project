import { UNDERGLOW_PRESETS } from './constants';
import { Car, Particle, SkidMark, TrackConfig } from './types';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private cameraX: number = 0;
  private cameraY: number = 0;
  private cameraZoom: number = 1.0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas 2D context not supported');
    this.ctx = context;
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public render(
    track: TrackConfig,
    cars: Car[],
    playerCar: Car,
    skidMarks: SkidMark[],
    particles: Particle[],
    gameTime: number
  ) {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    // 1. Smooth Camera Follow
    const targetZoom = Math.max(0.68, 1.05 - (playerCar.speed / 360) * 0.32);
    this.cameraZoom += (targetZoom - this.cameraZoom) * 0.08;

    // Look slightly ahead in the direction of player motion
    const forwardX = Math.cos(playerCar.angle);
    const forwardY = Math.sin(playerCar.angle);
    const lookaheadX = playerCar.x + forwardX * (playerCar.speed * 0.45);
    const lookaheadY = playerCar.y + forwardY * (playerCar.speed * 0.45);

    this.cameraX += (lookaheadX - this.cameraX) * 0.1;
    this.cameraY += (lookaheadY - this.cameraY) * 0.1;

    // 2. Clear Screen & Draw Scenery Terrain
    ctx.save();
    ctx.fillStyle = track.groundColor;
    ctx.fillRect(0, 0, w, h);

    // Apply Camera Transform
    ctx.translate(w * 0.5, h * 0.5);
    ctx.scale(this.cameraZoom, this.cameraZoom);
    ctx.translate(-this.cameraX, -this.cameraY);

    // 3. Render Track Ground Scenery (Grass / Desert Sand / Water)
    this.renderTerrainBackground(track, gameTime);

    // 4. Render Track Surface & Kerbs
    this.renderTrackRibbon(track);

    // 5. Render Skid Marks
    this.renderSkidMarks(skidMarks);

    // 6. Render Start/Finish Line & Grid Slots
    this.renderStartFinishGrid(track);

    // 7. Render Track Scenery Objects (Grandstands, Palm Trees, Yachts, Streetlights)
    this.renderSceneryObjects(track, gameTime);

    // 8. Render Cars (Underglow LEDs, Shadows, Bodywork, Wings, Tires)
    // Sort cars by Y position for slight pseudo-depth
    const sortedCars = [...cars].sort((a, b) => a.y - b.y);
    for (const car of sortedCars) {
      this.renderCar(car, gameTime);
    }

    // 9. Render Particles (Tire Smoke, Sparks, Dust)
    this.renderParticles(particles);

    // 10. Render Streetlight Lighting Glow & Shadows
    this.renderLightingGlows(track);

    // Restore Camera Transform
    ctx.restore();

    // 11. Render Speed Lines at High Speed (Screen Space)
    if (playerCar.speed > 240) {
      this.renderSpeedLines(w, h, playerCar.speed);
    }
  }

  /**
   * Renders terrain textures and thematic elements (ocean water, marina, sand dunes).
   */
  private renderTerrainBackground(track: TrackConfig, gameTime: number) {
    const { ctx } = this;

    if (track.theme === 'coastal') {
      // Draw scenic ocean water on coastal track
      ctx.save();
      const waveShift = Math.sin(gameTime * 2) * 8;
      const oceanGrad = ctx.createLinearGradient(0, 700, 3200, 2400);
      oceanGrad.addColorStop(0, '#0284c7');
      oceanGrad.addColorStop(0.5, '#0369a1');
      oceanGrad.addColorStop(1, '#075985');

      ctx.fillStyle = oceanGrad;
      ctx.beginPath();
      ctx.arc(1700 + waveShift, 1400, 850, 0, Math.PI * 2);
      ctx.fill();

      // Marina pier boardwalk
      ctx.fillStyle = '#78350f';
      ctx.fillRect(1150, 1050, 60, 480);
      ctx.fillRect(1500, 1150, 60, 420);
      ctx.restore();
    } else if (track.theme === 'neon') {
      // Midnight street grid pattern
      ctx.save();
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1.5;
      const step = 120;
      for (let x = 0; x < 2800; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 2600);
        ctx.stroke();
      }
      for (let y = 0; y < 2600; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(2800, y);
        ctx.stroke();
      }
      ctx.restore();
    } else if (track.theme === 'desert') {
      // Subtle sand dune ripples
      ctx.save();
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let y = 200; y < 2400; y += 140) {
        ctx.moveTo(100, y);
        ctx.bezierCurveTo(800, y + 40, 1600, y - 40, 2600, y + 20);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Renders the complete track ribbon: outer runoffs, alternating colored kerbs,
   * smooth asphalt roadbed, and white track boundary lines.
   */
  private renderTrackRibbon(track: TrackConfig) {
    const { ctx } = this;
    const pts = track.centerline;
    const n = pts.length;
    const halfWidth = track.trackWidth * 0.5;
    const kerbWidth = 14;

    // Compute left and right boundary points along centerline
    const leftInner: { x: number; y: number }[] = [];
    const rightInner: { x: number; y: number }[] = [];
    const leftKerb: { x: number; y: number }[] = [];
    const rightKerb: { x: number; y: number }[] = [];

    for (let i = 0; i < n; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const nx = -Math.sin(angle);
      const ny = Math.cos(angle);

      leftInner.push({ x: p1.x + nx * halfWidth, y: p1.y + ny * halfWidth });
      rightInner.push({ x: p1.x - nx * halfWidth, y: p1.y - ny * halfWidth });

      leftKerb.push({ x: p1.x + nx * (halfWidth + kerbWidth), y: p1.y + ny * (halfWidth + kerbWidth) });
      rightKerb.push({ x: p1.x - nx * (halfWidth + kerbWidth), y: p1.y - ny * (halfWidth + kerbWidth) });
    }

    // 1. Alternating Colored Kerbs (Left & Right)
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      const isAlt = Math.floor(i / 3) % 2 === 0;
      ctx.fillStyle = isAlt ? track.kerbColor1 : track.kerbColor2;

      // Left kerb segment
      ctx.beginPath();
      ctx.moveTo(leftInner[i].x, leftInner[i].y);
      ctx.lineTo(leftKerb[i].x, leftKerb[i].y);
      ctx.lineTo(leftKerb[next].x, leftKerb[next].y);
      ctx.lineTo(leftInner[next].x, leftInner[next].y);
      ctx.closePath();
      ctx.fill();

      // Right kerb segment
      ctx.beginPath();
      ctx.moveTo(rightInner[i].x, rightInner[i].y);
      ctx.lineTo(rightKerb[i].x, rightKerb[i].y);
      ctx.lineTo(rightKerb[next].x, rightKerb[next].y);
      ctx.lineTo(rightInner[next].x, rightInner[next].y);
      ctx.closePath();
      ctx.fill();
    }

    // 2. Dark Asphalt Track Surface
    ctx.fillStyle = track.asphaltColor;
    ctx.beginPath();
    ctx.moveTo(leftInner[0].x, leftInner[0].y);
    for (let i = 1; i < n; i++) {
      ctx.lineTo(leftInner[i].x, leftInner[i].y);
    }
    ctx.lineTo(leftInner[0].x, leftInner[0].y);

    // Reversed right edge to make a closed polygon
    for (let i = n - 1; i >= 0; i--) {
      ctx.lineTo(rightInner[i].x, rightInner[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // 3. Crisp White Track Boundary Lines
    ctx.strokeStyle = track.theme === 'neon' ? 'rgba(0, 255, 255, 0.8)' : '#ffffff';
    ctx.lineWidth = 3.5;

    // Left line
    ctx.beginPath();
    ctx.moveTo(leftInner[0].x, leftInner[0].y);
    for (let i = 1; i < n; i++) {
      ctx.lineTo(leftInner[i].x, leftInner[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Right line
    ctx.beginPath();
    ctx.moveTo(rightInner[0].x, rightInner[0].y);
    for (let i = 1; i < n; i++) {
      ctx.lineTo(rightInner[i].x, rightInner[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // 4. Subtle Dashed Centerline
    ctx.strokeStyle = track.theme === 'neon' ? 'rgba(255, 0, 127, 0.4)' : 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 22]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < n; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * Renders tire skid marks with soft fading alpha.
   */
  private renderSkidMarks(skidMarks: SkidMark[]) {
    const { ctx } = this;
    ctx.save();
    ctx.lineCap = 'round';
    for (const sm of skidMarks) {
      ctx.strokeStyle = `rgba(10, 10, 15, ${sm.alpha})`;
      ctx.lineWidth = sm.width;
      ctx.beginPath();
      ctx.moveTo(sm.x1, sm.y1);
      ctx.lineTo(sm.x2, sm.y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Renders the start/finish gantry, checkered line, and F1 starting grid slots.
   */
  private renderStartFinishGrid(track: TrackConfig) {
    const { ctx } = this;
    const startPoint = track.centerline[0];
    const nextPoint = track.centerline[1];
    const angle = Math.atan2(nextPoint.y - startPoint.y, nextPoint.x - startPoint.x);
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);
    const halfWidth = track.trackWidth * 0.5;

    // Checkered Finish Line
    ctx.save();
    ctx.translate(startPoint.x, startPoint.y);
    ctx.rotate(angle);

    const cols = 12;
    const rows = 2;
    const boxW = 10;
    const boxH = (track.trackWidth - 10) / cols;

    for (let c = 0; c < rows; c++) {
      for (let r = 0; r < cols; r++) {
        ctx.fillStyle = (c + r) % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(-boxW * (rows - c), -halfWidth + 5 + r * boxH, boxW, boxH);
      }
    }

    // Overhead Start/Finish Gantry Bridge
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(-15, -halfWidth - 30, 30, 24);
    ctx.fillRect(-15, -halfWidth - 30, 30, 24);
    ctx.strokeRect(-15, halfWidth + 6, 30, 24);
    ctx.fillRect(-15, halfWidth + 6, 30, 24);

    // Gantry crossbar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-8, -halfWidth - 15, 16, track.trackWidth + 30);
    ctx.restore();

    // 8 Staggered F1 Grid Slot Boxes
    for (let i = 0; i < track.gridSpots.length; i++) {
      const spot = track.gridSpots[i];
      ctx.save();
      ctx.translate(spot.x, spot.y);
      ctx.rotate(spot.angle);

      // Yellow box marking
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-26, -18, 52, 36);

      // Grid number text
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 12px "Barlow Condensed", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`P${i + 1}`, -36, 0);

      ctx.restore();
    }
  }

  /**
   * Renders trackside scenery objects: grandstands, sponsor hoardings, yachts, trees.
   */
  private renderSceneryObjects(track: TrackConfig, gameTime: number) {
    const { ctx } = this;

    for (const item of track.scenery) {
      ctx.save();
      ctx.translate(item.x, item.y);
      if (item.rotation) ctx.rotate(item.rotation);

      if (item.type === 'grandstand') {
        const w = item.width || 200;
        const h = item.height || 45;

        // Base structure shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(-w * 0.5 + 6, -h * 0.5 + 8, w, h);

        // Seating tiers
        ctx.fillStyle = item.color || '#0284c7';
        ctx.fillRect(-w * 0.5, -h * 0.5, w, h);

        // Spectator colored dots
        ctx.fillStyle = '#f8fafc';
        for (let sx = -w * 0.5 + 8; sx < w * 0.5 - 8; sx += 12) {
          for (let sy = -h * 0.5 + 6; sy < h * 0.5 - 6; sy += 10) {
            ctx.fillStyle = ((sx + sy) % 3 === 0) ? '#f43f5e' : ((sx + sy) % 2 === 0 ? '#38bdf8' : '#fbbf24');
            ctx.fillRect(sx, sy, 4, 4);
          }
        }

        // Roof canopy
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(-w * 0.5, -h * 0.5, w, 8);
      } else if (item.type === 'tree') {
        // Palm tree shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(8, 8, 20, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trunk
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        // Palm fronds
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 4;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const fx = Math.cos(a) * 26;
          const fy = Math.sin(a) * 26;
          ctx.quadraticCurveTo(Math.cos(a + 0.3) * 16, Math.sin(a + 0.3) * 16, fx, fy);
          ctx.stroke();
        }
      } else if (item.type === 'yacht') {
        const w = item.width || 140;
        const h = item.height || 45;

        // Boat shadow in water
        ctx.fillStyle = 'rgba(0, 20, 40, 0.45)';
        ctx.beginPath();
        ctx.ellipse(5, 8, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sleek yacht hull
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(w * 0.5, 0);
        ctx.bezierCurveTo(w * 0.4, h * 0.5, -w * 0.4, h * 0.45, -w * 0.5, 0);
        ctx.bezierCurveTo(-w * 0.4, -h * 0.45, w * 0.4, -h * 0.5, w * 0.5, 0);
        ctx.closePath();
        ctx.fill();

        // Tinted glass cockpit
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-w * 0.15, -h * 0.22, w * 0.35, h * 0.44);

        // Teak wood deck
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-w * 0.42, -h * 0.28, w * 0.22, h * 0.56);
      } else if (item.type === 'sponsor') {
        const w = item.width || 160;
        const h = item.height || 16;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-w * 0.5, -h * 0.5, w, h);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-w * 0.5, -h * 0.5, w, h);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px "Barlow Condensed", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.label || 'APEX F1', 0, 0);
      }

      ctx.restore();
    }
  }

  /**
   * Renders realistic open-wheel Formula 1 racing car:
   * 1. UNDERGLOW NEON LED LIGHTING under the floor reflecting onto the tarmac!
   * 2. Ground drop shadow.
   * 3. Carbon-fiber monocoque chassis, stepped sidepods, bargeboards, and nose cone.
   * 4. Multi-element aerodynamic front wing with endplates.
   * 5. Front steerable slick tyres visibly angled with steerAngle.
   * 6. Driver cockpit, safety Halo ring, helmet with tinted reflective visor.
   * 7. Engine air intake box above driver.
   * 8. High-downforce rear wing with DRS actuator and flashing red rain/brake LED light!
   */
  public renderCar(car: Car, gameTime: number) {
    const { ctx } = this;

    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    // =========================================================================
    // A. UNDERGLOW NEON LED LIGHTS (User feature requirement!)
    // =========================================================================
    const underglowConfig = UNDERGLOW_PRESETS.find((u) => u.id === car.underglow) || UNDERGLOW_PRESETS[0];

    if (underglowConfig.id !== 'off') {
      ctx.save();
      // Calculate dynamic underglow color
      let glowHex = underglowConfig.hex;
      if (underglowConfig.id === 'rainbow') {
        const hue = (gameTime * 120 + (car.isPlayer ? 0 : 90)) % 360;
        glowHex = `hsl(${hue}, 100%, 55%)`;
      }

      // Pulse brightness slightly with throttle / RPM
      const pulseIntensity = 0.65 + (car.rpm / 15000) * 0.35;

      // Radial underglow bloom under the floorpan onto the tarmac
      const underglowGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
      underglowGrad.addColorStop(0, glowHex);
      underglowGrad.addColorStop(0.35, glowHex);
      underglowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.globalAlpha = pulseIntensity * (car.surfaceType === 'asphalt' ? 0.85 : 0.45);
      ctx.fillStyle = underglowGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 42, 26, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sharp underglow LED side strip lines along the floor edge
      ctx.strokeStyle = glowHex;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = glowHex;
      ctx.shadowBlur = 10;

      // Left LED strip
      ctx.beginPath();
      ctx.moveTo(-16, -15);
      ctx.lineTo(14, -13);
      ctx.stroke();

      // Right LED strip
      ctx.beginPath();
      ctx.moveTo(-16, 15);
      ctx.lineTo(14, 13);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // =========================================================================
    // B. CAR GROUND DROP SHADOW
    // =========================================================================
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(2, 3, 30, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // =========================================================================
    // C. SUSPENSION WISHBONES & BRAKE DUCTS (Front & Rear)
    // =========================================================================
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;

    // Front suspension arms
    ctx.beginPath();
    ctx.moveTo(14, -6);
    ctx.lineTo(18, -17);
    ctx.moveTo(8, -6);
    ctx.lineTo(18, -17);
    ctx.moveTo(14, 6);
    ctx.lineTo(18, 17);
    ctx.moveTo(8, 6);
    ctx.lineTo(18, 17);
    ctx.stroke();

    // Rear suspension arms
    ctx.beginPath();
    ctx.moveTo(-12, -7);
    ctx.lineTo(-18, -18);
    ctx.moveTo(-18, -7);
    ctx.lineTo(-18, -18);
    ctx.moveTo(-12, 7);
    ctx.lineTo(-18, 18);
    ctx.moveTo(-18, 7);
    ctx.lineTo(-18, 18);
    ctx.stroke();

    // =========================================================================
    // D. REAR SLICK TIRES (Wide Pirelli-spec 405mm)
    // =========================================================================
    const tireW = 18;
    const tireH = 10;

    // Rear Left Tire
    ctx.save();
    ctx.translate(-18, -18);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-tireW * 0.5, -tireH * 0.5, tireW, tireH);
    // Tire tread line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(-tireW * 0.5, -tireH * 0.5, tireW, tireH);
    // Rim cover / wheel hub
    ctx.fillStyle = car.team.accentColor;
    ctx.fillRect(-4, -1, 8, 2);
    ctx.restore();

    // Rear Right Tire
    ctx.save();
    ctx.translate(-18, 18);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-tireW * 0.5, -tireH * 0.5, tireW, tireH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(-tireW * 0.5, -tireH * 0.5, tireW, tireH);
    ctx.fillStyle = car.team.accentColor;
    ctx.fillRect(-4, -1, 8, 2);
    ctx.restore();

    // =========================================================================
    // E. FRONT STEERABLE TIRES (Visibly turn with steerAngle!)
    // =========================================================================
    const frontSteerAngle = car.steerAngle * 4.5; // Amplified for crisp visual articulation

    // Front Left Tire
    ctx.save();
    ctx.translate(18, -17);
    ctx.rotate(frontSteerAngle);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-tireW * 0.45, -tireH * 0.45, tireW * 0.9, tireH * 0.9);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(-tireW * 0.45, -tireH * 0.45, tireW * 0.9, tireH * 0.9);
    ctx.fillStyle = car.team.accentColor;
    ctx.fillRect(-3, -1, 6, 2);
    ctx.restore();

    // Front Right Tire
    ctx.save();
    ctx.translate(18, 17);
    ctx.rotate(frontSteerAngle);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-tireW * 0.45, -tireH * 0.45, tireW * 0.9, tireH * 0.9);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(-tireW * 0.45, -tireH * 0.45, tireW * 0.9, tireH * 0.9);
    ctx.fillStyle = car.team.accentColor;
    ctx.fillRect(-3, -1, 6, 2);
    ctx.restore();

    // =========================================================================
    // F. FRONT WING WITH STEPPED FLAPS & ENDPLATES
    // =========================================================================
    ctx.fillStyle = car.team.secondaryColor;
    // Main front wing flap
    ctx.beginPath();
    ctx.moveTo(27, -22);
    ctx.lineTo(31, -22);
    ctx.lineTo(34, 0);
    ctx.lineTo(31, 22);
    ctx.lineTo(27, 22);
    ctx.lineTo(29, 0);
    ctx.closePath();
    ctx.fill();

    // Front wing endplates
    ctx.fillStyle = car.team.accentColor;
    ctx.fillRect(25, -23, 7, 2);
    ctx.fillRect(25, 21, 7, 2);

    // =========================================================================
    // G. MAIN MONOCOQUE CHASSIS & AERODYNAMIC SIDEPODS
    // =========================================================================
    // Floor undertray (carbon black)
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-22, -15, 38, 30);

    // Primary Bodywork
    ctx.fillStyle = car.team.primaryColor;
    ctx.beginPath();
    ctx.moveTo(33, 0); // Nose tip
    ctx.lineTo(18, -4); // Front bulkhead
    ctx.lineTo(8, -13); // Sidepod leading intake
    ctx.lineTo(-14, -13); // Sidepod undercut
    ctx.lineTo(-24, -7); // Engine cover taper
    ctx.lineTo(-24, 7);
    ctx.lineTo(-14, 13);
    ctx.lineTo(8, 13);
    ctx.lineTo(18, 4);
    ctx.closePath();
    ctx.fill();

    // Team Secondary Color Racing Stripes
    ctx.fillStyle = car.team.secondaryColor;
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(15, -2);
    ctx.lineTo(2, -6);
    ctx.lineTo(-18, -5);
    ctx.lineTo(-18, 5);
    ctx.lineTo(2, 6);
    ctx.lineTo(15, 2);
    ctx.closePath();
    ctx.fill();

    // Sidepod Air Radiator Vents
    ctx.fillStyle = '#000000';
    ctx.fillRect(5, -12, 6, 3);
    ctx.fillRect(5, 9, 6, 3);

    // =========================================================================
    // H. COCKPIT, DRIVER HELMET & HALO SAFETY RING
    // =========================================================================
    // Cockpit recess
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.ellipse(3, 0, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Driver Helmet
    ctx.fillStyle = car.team.accentColor;
    ctx.beginPath();
    ctx.arc(2, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Visor reflection
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(4, -2.5, 2.5, 5);

    // Halo safety structure
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(4, 0, 6.5, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
    // Halo central pylon
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(11, 0);
    ctx.stroke();

    // Engine airbox intake scoop (behind helmet)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(-3, 0, 3, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // =========================================================================
    // I. REAR WING & DRS FLAP
    // =========================================================================
    ctx.fillStyle = car.team.secondaryColor;
    // Wing plane
    ctx.fillRect(-27, -19, 6, 38);

    // DRS opening line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-24, -18);
    ctx.lineTo(-24, 18);
    ctx.stroke();

    // Rear wing endplates
    ctx.fillStyle = car.team.primaryColor;
    ctx.fillRect(-29, -20, 9, 2.5);
    ctx.fillRect(-29, 17.5, 9, 2.5);

    // =========================================================================
    // J. REAR BRAKE / RAIN LED LIGHT
    // =========================================================================
    const isBraking = car.brake > 0;
    const rainLightBlink = Math.sin(gameTime * 20) > 0;

    if (isBraking || (car.speed > 250 && rainLightBlink)) {
      ctx.save();
      ctx.fillStyle = '#ff003c';
      ctx.shadowColor = '#ff003c';
      ctx.shadowBlur = 12;
      ctx.fillRect(-28, -2, 4, 4);
      ctx.restore();
    } else {
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-28, -2, 4, 4);
    }

    ctx.restore();
  }

  /**
   * Renders active particles (smoke, sparks, dust, flames).
   */
  private renderParticles(particles: Particle[]) {
    const { ctx } = this;
    ctx.save();

    for (const p of particles) {
      const alpha = p.alpha * (1 - p.life / p.maxLife);
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

      if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 6;
        ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /**
   * Renders streetlights and floodlight illumination cones for night/neon GP.
   */
  private renderLightingGlows(track: TrackConfig) {
    if (track.theme !== 'neon') return;

    const { ctx } = this;
    ctx.save();

    for (const item of track.scenery) {
      if (item.type === 'light') {
        const glowColor = item.color || '#00ffff';
        const grad = ctx.createRadialGradient(item.x, item.y, 10, item.x, item.y, 120);
        grad.addColorStop(0, glowColor);
        grad.addColorStop(0.3, glowColor);
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.globalAlpha = 0.28;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(item.x, item.y, 120, 0, Math.PI * 2);
        ctx.fill();

        // Light fixture point
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(item.x, item.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /**
   * Renders dynamic peripheral speed lines at high velocities.
   */
  private renderSpeedLines(w: number, h: number, speed: number) {
    const { ctx } = this;
    ctx.save();
    const count = Math.floor((speed - 240) * 0.4);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < count; i++) {
      const edge = i % 4;
      let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
      const len = 40 + Math.random() * 60;

      if (edge === 0) { // Top
        x1 = Math.random() * w;
        y1 = 0;
        x2 = x1 + (x1 - w * 0.5) * 0.2;
        y2 = len;
      } else if (edge === 1) { // Bottom
        x1 = Math.random() * w;
        y1 = h;
        x2 = x1 + (x1 - w * 0.5) * 0.2;
        y2 = h - len;
      } else if (edge === 2) { // Left
        x1 = 0;
        y1 = Math.random() * h;
        x2 = len;
        y2 = y1 + (y1 - h * 0.5) * 0.2;
      } else { // Right
        x1 = w;
        y1 = Math.random() * h;
        x2 = w - len;
        y2 = y1 + (y1 - h * 0.5) * 0.2;
      }

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Renders high-contrast circuit minimap with car positions.
   */
  public renderMinimap(
    ctx: CanvasRenderingContext2D,
    track: TrackConfig,
    cars: Car[],
    playerCar: Car,
    mapWidth: number,
    mapHeight: number
  ) {
    ctx.clearRect(0, 0, mapWidth, mapHeight);

    // Background panel
    ctx.fillStyle = 'rgba(6, 8, 12, 0.85)';
    ctx.fillRect(0, 0, mapWidth, mapHeight);

    // Compute track bounding box
    const pts = track.centerline;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const pad = 18;
    const trackW = maxX - minX;
    const trackH = maxY - minY;
    const scale = Math.min((mapWidth - pad * 2) / trackW, (mapHeight - pad * 2) / trackH);
    const offsetX = (mapWidth - trackW * scale) * 0.5 - minX * scale;
    const offsetY = (mapHeight - trackH * scale) * 0.5 - minY * scale;

    const toMap = (x: number, y: number) => ({
      x: x * scale + offsetX,
      y: y * scale + offsetY,
    });

    // Draw track circuit outline
    ctx.save();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    const p0 = toMap(pts[0].x, pts[0].y);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < pts.length; i++) {
      const mp = toMap(pts[i].x, pts[i].y);
      ctx.lineTo(mp.x, mp.y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.strokeStyle = track.theme === 'neon' ? '#00ffff' : '#475569';
    ctx.stroke();

    // Start line marker
    const sPos = toMap(track.startPosition.x, track.startPosition.y);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sPos.x - 3, sPos.y - 3, 6, 6);

    // Draw AI cars
    for (const car of cars) {
      if (car.isPlayer) continue;
      const cp = toMap(car.x, car.y);
      ctx.fillStyle = car.team.secondaryColor;
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Player car (larger glowing dot)
    const pp = toMap(playerCar.x, playerCar.y);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(pp.x, pp.y, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
