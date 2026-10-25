import { GEAR_RATIOS } from './constants';
import { soundEngine } from './audio';
import { Car, Particle, SkidMark, TrackConfig } from './types';

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  handbrake: boolean;
  reset: boolean;
}

/**
 * Finds the closest point and distance from a point to a line segment.
 */
function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { distance: number; projX: number; projY: number } {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return { distance: Math.hypot(px - x1, py - y1), projX: x1, projY: y1 };

  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));

  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  return { distance: Math.hypot(px - projX, py - projY), projX, projY };
}

/**
 * Calculates nearest track distance and surface type.
 */
export function getTrackSurface(
  x: number,
  y: number,
  track: TrackConfig
): { surface: 'asphalt' | 'kerb' | 'grass' | 'gravel'; distanceToCenter: number; nearestIndex: number } {
  const pts = track.centerline;
  const len = pts.length;
  let minDistance = Infinity;
  let nearestIndex = 0;

  // Optimized segment search with step
  for (let i = 0; i < len; i += 2) {
    const next = (i + 1) % len;
    const res = distToSegment(x, y, pts[i].x, pts[i].y, pts[next].x, pts[next].y);
    if (res.distance < minDistance) {
      minDistance = res.distance;
      nearestIndex = i;
    }
  }

  // Check neighbors of best candidate for higher precision
  const prevIdx = (nearestIndex - 1 + len) % len;
  const nextIdx = (nearestIndex + 1) % len;
  const resPrev = distToSegment(x, y, pts[prevIdx].x, pts[prevIdx].y, pts[nearestIndex].x, pts[nearestIndex].y);
  if (resPrev.distance < minDistance) {
    minDistance = resPrev.distance;
  }
  const resNext = distToSegment(x, y, pts[nearestIndex].x, pts[nearestIndex].y, pts[nextIdx].x, pts[nextIdx].y);
  if (resNext.distance < minDistance) {
    minDistance = resNext.distance;
  }

  const halfWidth = track.trackWidth * 0.5;
  const kerbWidth = 14;

  if (minDistance <= halfWidth) {
    return { surface: 'asphalt', distanceToCenter: minDistance, nearestIndex };
  } else if (minDistance <= halfWidth + kerbWidth) {
    return { surface: 'kerb', distanceToCenter: minDistance, nearestIndex };
  } else if (track.theme === 'desert') {
    return { surface: 'gravel', distanceToCenter: minDistance, nearestIndex };
  } else {
    return { surface: 'grass', distanceToCenter: minDistance, nearestIndex };
  }
}

/**
 * Updates individual car physics with realistic Formula 1 dynamics.
 */
export function updateCarPhysics(
  car: Car,
  inputs: InputState,
  track: TrackConfig,
  dt: number,
  particles: Particle[],
  skidMarks: SkidMark[]
) {
  // Clamp delta time to avoid physics explosion
  const safeDt = Math.min(Math.max(dt, 0.001), 0.05);

  // Surface detection
  const trackInfo = getTrackSurface(car.x, car.y, track);
  car.surfaceType = trackInfo.surface;

  // Surface modifiers
  let gripFactor = 1.0;
  let surfaceDrag = 0.00045;
  let maxSurfaceSpeed = 360;

  if (car.surfaceType === 'kerb') {
    gripFactor = 0.88;
    surfaceDrag = 0.0007;
  } else if (car.surfaceType === 'grass') {
    gripFactor = 0.45;
    surfaceDrag = 0.0035;
    maxSurfaceSpeed = 110;
  } else if (car.surfaceType === 'gravel') {
    gripFactor = 0.35;
    surfaceDrag = 0.007;
    maxSurfaceSpeed = 80;
  }

  // Throttle & Brake inputs
  car.throttle = inputs.up ? 1.0 : 0.0;
  car.brake = inputs.down ? 1.0 : 0.0;
  const isHandbrake = inputs.handbrake;

  // Forward and right unit vectors
  const forwardX = Math.cos(car.angle);
  const forwardY = Math.sin(car.angle);
  const rightX = -Math.sin(car.angle);
  const rightY = Math.cos(car.angle);

  // Decompose velocity into longitudinal and lateral components
  const forwardVelocity = car.vx * forwardX + car.vy * forwardY;
  const lateralVelocity = car.vx * rightX + car.vy * rightY;

  car.speed = Math.abs(forwardVelocity) * 3.6; // convert m/s approx to km/h

  // Gear Calculation based on speed
  let currentGear = 1;
  for (let i = GEAR_RATIOS.length - 1; i >= 0; i--) {
    if (car.speed >= GEAR_RATIOS[i].minSpeed) {
      currentGear = GEAR_RATIOS[i].gear;
      break;
    }
  }
  car.gear = currentGear;

  // RPM Calculation
  const gearConfig = GEAR_RATIOS[car.gear - 1];
  const speedInGear = Math.max(0, car.speed - gearConfig.minSpeed);
  const gearSpeedRange = Math.max(20, gearConfig.maxSpeed - gearConfig.minSpeed);
  const rpmRatio = Math.min(1.0, speedInGear / gearSpeedRange);
  car.rpm = 4000 + rpmRatio * 10500; // 4,000 to 14,500 RPM

  // Acceleration & Braking Forces
  let engineAccel = 0;
  const speedPowerFalloff = Math.max(0.2, 1.0 - (car.speed / maxSurfaceSpeed) * 0.85);

  if (car.throttle > 0) {
    if (forwardVelocity < -2) {
      // Braking while going in reverse
      engineAccel = 1800;
    } else {
      // Forward acceleration with high low-end torque
      const teamSpeedBonus = (car.team.speedRating / 100);
      engineAccel = (1600 * speedPowerFalloff * teamSpeedBonus) * (car.surfaceType === 'asphalt' ? 1.0 : 0.6);
    }
    car.isReversing = false;
  } else if (car.brake > 0) {
    if (forwardVelocity > 2) {
      // Heavy carbon brake deceleration (approx 4.5G)
      engineAccel = -2800;
      car.isReversing = false;
    } else {
      // Reverse gear
      engineAccel = -450;
      car.isReversing = true;
    }
  }

  // Aerodynamic Drag & Rolling Resistance
  const airDragForce = -0.5 * 0.55 * forwardVelocity * Math.abs(forwardVelocity);
  const rollingResistance = -forwardVelocity * (surfaceDrag * 1500);

  const totalLongitudinalForce = engineAccel + airDragForce + rollingResistance;
  const newForwardVelocity = forwardVelocity + (totalLongitudinalForce / 780) * safeDt;

  // Steering mechanics (speed-sensitive steering lock)
  const maxSteer = 0.045;
  const speedFactor = Math.max(0.3, 1.0 - Math.min(car.speed / 320, 0.7));
  const effectiveSteerSpeed = maxSteer * speedFactor * (car.team.corneringRating / 100);

  let steerInput = 0;
  if (inputs.left) steerInput -= 1;
  if (inputs.right) steerInput += 1;

  car.steerAngle = steerInput * effectiveSteerSpeed;

  // Turning angular velocity
  if (Math.abs(forwardVelocity) > 1.5) {
    const turnDirection = forwardVelocity >= 0 ? 1 : -1;
    const targetAngularVelocity = steerInput * effectiveSteerSpeed * (forwardVelocity * 0.04) * turnDirection;
    car.angularVelocity = targetAngularVelocity * (car.surfaceType === 'asphalt' ? 1.0 : 0.65);
    car.angle += car.angularVelocity * (safeDt * 60);
  } else {
    car.angularVelocity = 0;
  }

  // Lateral grip & drift slip
  const maxLateralGrip = isHandbrake ? 1.8 : 9.5 * gripFactor;
  const lateralResistance = -Math.sign(lateralVelocity) * Math.min(Math.abs(lateralVelocity) * 12, maxLateralGrip * 15);
  const newLateralVelocity = (lateralVelocity + lateralResistance * safeDt) * (isHandbrake ? 0.94 : 0.82);

  // Compute drift slip ratio
  car.driftSlip = Math.min(1.0, (Math.abs(lateralVelocity) / 12) + (isHandbrake ? 0.5 : 0));

  // Recombine velocities into world coordinates
  car.vx = forwardX * newForwardVelocity + rightX * newLateralVelocity;
  car.vy = forwardY * newForwardVelocity + rightY * newLateralVelocity;

  // Apply speed clamp for safety
  const currentSpeed = Math.hypot(car.vx, car.vy);
  const maxVelocity = (maxSurfaceSpeed / 3.6);
  if (currentSpeed > maxVelocity) {
    car.vx = (car.vx / currentSpeed) * maxVelocity;
    car.vy = (car.vy / currentSpeed) * maxVelocity;
  }

  // Update position
  const prevX = car.x;
  const prevY = car.y;
  car.x += car.vx * (safeDt * 60);
  car.y += car.vy * (safeDt * 60);

  // Generate tire skid marks if sliding or heavy braking
  if (car.surfaceType === 'asphalt' && (car.driftSlip > 0.35 || (car.brake > 0 && car.speed > 80))) {
    // Generate left and right tire tracks
    const tireOffset = 14;
    const lTx1 = prevX + rightX * -tireOffset;
    const lTy1 = prevY + rightY * -tireOffset;
    const lTx2 = car.x + rightX * -tireOffset;
    const lTy2 = car.y + rightY * -tireOffset;

    const rTx1 = prevX + rightX * tireOffset;
    const rTy1 = prevY + rightY * tireOffset;
    const rTx2 = car.x + rightX * tireOffset;
    const rTy2 = car.y + rightY * tireOffset;

    if (skidMarks.length >= 500) {
      skidMarks.splice(0, 2);
    }
    skidMarks.push({ x1: lTx1, y1: lTy1, x2: lTx2, y2: lTy2, alpha: 0.5, width: 4.5 });
    skidMarks.push({ x1: rTx1, y1: rTy1, x2: rTx2, y2: rTy2, alpha: 0.5, width: 4.5 });

    // Tire smoke particles
    if (Math.random() < 0.4 && particles.length < 200) {
      particles.push({
        x: car.x - forwardX * 20 + (Math.random() - 0.5) * 15,
        y: car.y - forwardY * 20 + (Math.random() - 0.5) * 15,
        vx: -car.vx * 0.15 + (Math.random() - 0.5) * 2,
        vy: -car.vy * 0.15 + (Math.random() - 0.5) * 2,
        life: 0,
        maxLife: 25 + Math.random() * 15,
        size: 7 + Math.random() * 8,
        color: '#e2e8f0',
        alpha: 0.6,
        type: 'smoke',
      });
    }
  }

  // Dust particles on gravel or grass
  if ((car.surfaceType === 'grass' || car.surfaceType === 'gravel') && car.speed > 30 && Math.random() < 0.35) {
    particles.push({
      x: car.x - forwardX * 18,
      y: car.y - forwardY * 18,
      vx: -car.vx * 0.2 + (Math.random() - 0.5) * 3,
      vy: -car.vy * 0.2 + (Math.random() - 0.5) * 3,
      life: 0,
      maxLife: 20 + Math.random() * 10,
      size: 5 + Math.random() * 5,
      color: car.surfaceType === 'grass' ? '#22c55e' : '#d97706',
      alpha: 0.7,
      type: 'dust',
    });
  }

  // Barrier boundary collision
  const barrierLimit = track.trackWidth * 0.5 + 160;
  if (trackInfo.distanceToCenter > barrierLimit) {
    // Rebound back toward center point
    const pts = track.centerline;
    const centerPoint = pts[trackInfo.nearestIndex];
    const dx = centerPoint.x - car.x;
    const dy = centerPoint.y - car.y;
    const distToCenter = Math.hypot(dx, dy);

    if (distToCenter > 0) {
      const normX = dx / distToCenter;
      const normY = dy / distToCenter;
      car.vx = normX * 3.5;
      car.vy = normY * 3.5;
      car.speed *= 0.4;
      soundEngine.playCollisionSound(0.7);

      // Sparks
      for (let s = 0; s < 6; s++) {
        particles.push({
          x: car.x,
          y: car.y,
          vx: normX * 5 + (Math.random() - 0.5) * 6,
          vy: normY * 5 + (Math.random() - 0.5) * 6,
          life: 0,
          maxLife: 15,
          size: 2.5,
          color: '#fbbf24',
          alpha: 1.0,
          type: 'spark',
        });
      }
    }
  }
}

/**
 * Resolves car-to-car collisions with elastic impulse.
 */
export function resolveCarCollisions(cars: Car[], particles: Particle[]) {
  const n = cars.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const c1 = cars[i];
      const c2 = cars[j];

      const dx = c2.x - c1.x;
      const dy = c2.y - c1.y;
      const dist = Math.hypot(dx, dy);
      const minDistance = c1.radius + c2.radius;

      if (dist < minDistance && dist > 0.001) {
        // Overlap resolution
        const overlap = minDistance - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        c1.x -= nx * (overlap * 0.5);
        c1.y -= ny * (overlap * 0.5);
        c2.x += nx * (overlap * 0.5);
        c2.y += ny * (overlap * 0.5);

        // Relative velocity
        const kx = c1.vx - c2.vx;
        const ky = c1.vy - c2.vy;
        const p = Math.max(-6, Math.min(6, 2 * (nx * kx + ny * ky) / 2));

        c1.vx -= p * nx * 0.6;
        c1.vy -= p * ny * 0.6;
        c2.vx += p * nx * 0.6;
        c2.vy += p * ny * 0.6;

        if (isNaN(c1.vx) || isNaN(c1.vy)) { c1.vx = 0; c1.vy = 0; }
        if (isNaN(c2.vx) || isNaN(c2.vy)) { c2.vx = 0; c2.vy = 0; }

        c1.collidedWithCar = true;
        c2.collidedWithCar = true;

        if (c1.isPlayer || c2.isPlayer) {
          const impactSpeed = Math.hypot(kx, ky);
          if (impactSpeed > 2.5) {
            soundEngine.playCollisionSound(Math.min(impactSpeed / 10, 1.0));
            // Spark shower
            for (let s = 0; s < 5; s++) {
              particles.push({
                x: (c1.x + c2.x) * 0.5,
                y: (c1.y + c2.y) * 0.5,
                vx: (Math.random() - 0.5) * 7,
                vy: (Math.random() - 0.5) * 7,
                life: 0,
                maxLife: 15,
                size: 3,
                color: '#f59e0b',
                alpha: 1.0,
                type: 'spark',
              });
            }
          }
        }
      }
    }
  }
}
