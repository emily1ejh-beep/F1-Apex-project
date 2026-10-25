import { InputState } from './physics';
import { AIDifficulty, Car, TrackConfig } from './types';

/**
 * Computes lookahead waypoints, braking points, overtaking lines, and track recovery.
 */
export function updateAICar(
  car: Car,
  otherCars: Car[],
  track: TrackConfig,
  difficulty: AIDifficulty
): InputState {
  const inputs: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    handbrake: false,
    reset: false,
  };

  const pts = track.centerline;
  const n = pts.length;

  // 1. Difficulty Multipliers
  let speedSkill = 0.92;
  let brakeSkill = 0.88;
  let lookaheadDistance = 14;

  if (difficulty === 'easy') {
    speedSkill = 0.82;
    brakeSkill = 0.78;
    lookaheadDistance = 10;
  } else if (difficulty === 'medium') {
    speedSkill = 0.90;
    brakeSkill = 0.86;
    lookaheadDistance = 13;
  } else if (difficulty === 'hard') {
    speedSkill = 0.96;
    brakeSkill = 0.94;
    lookaheadDistance = 17;
  } else if (difficulty === 'pro') {
    speedSkill = 1.0;
    brakeSkill = 0.98;
    lookaheadDistance = 20;
  }

  // 2. Find Nearest Centerline Waypoint
  let closestDist = Infinity;
  let closestIndex = car.aiWayIndex || 0;

  // Search local window around current waypoint
  const searchWindow = 30;
  for (let offset = -searchWindow; offset <= searchWindow; offset++) {
    const idx = (car.aiWayIndex + offset + n) % n;
    const d = Math.hypot(pts[idx].x - car.x, pts[idx].y - car.y);
    if (d < closestDist) {
      closestDist = d;
      closestIndex = idx;
    }
  }
  car.aiWayIndex = closestIndex;

  // 3. Lookahead Waypoint for Steering
  const targetIndex = (closestIndex + lookaheadDistance) % n;
  const targetPoint = pts[targetIndex];

  // 4. Overtaking & Collision Avoidance Offset
  // Check if there is another car ahead in close range
  let lateralOvertakeOffset = 0;
  const forwardX = Math.cos(car.angle);
  const forwardY = Math.sin(car.angle);

  for (const other of otherCars) {
    if (other.id === car.id) continue;
    const dx = other.x - car.x;
    const dy = other.y - car.y;
    const distToOther = Math.hypot(dx, dy);

    if (distToOther < 120 && distToOther > 5) {
      // Check if other car is in front
      const dot = (dx * forwardX + dy * forwardY) / distToOther;
      if (dot > 0.6) {
        // Car is directly in front: decide whether to duck left or right
        const cross = dx * forwardY - dy * forwardX;
        const overtakeSide = cross > 0 ? -1 : 1;
        lateralOvertakeOffset = overtakeSide * Math.min(35, (track.trackWidth * 0.22));
        break;
      }
    }
  }

  // Smoothly lerp AI lateral offset
  car.aiOvertakeOffset = car.aiOvertakeOffset * 0.9 + lateralOvertakeOffset * 0.1;

  // Compute waypoint normal for lateral offset
  const nextTarget = pts[(targetIndex + 1) % n];
  const targetAngle = Math.atan2(nextTarget.y - targetPoint.y, nextTarget.x - targetPoint.x);
  const normX = -Math.sin(targetAngle);
  const normY = Math.cos(targetAngle);

  const steerTargetX = targetPoint.x + normX * car.aiOvertakeOffset;
  const steerTargetY = targetPoint.y + normY * car.aiOvertakeOffset;

  // 5. Compute Steering Angle to Target
  const angleToTarget = Math.atan2(steerTargetY - car.y, steerTargetX - car.x);
  let angleDiff = angleToTarget - car.angle;

  // Normalize angle difference to [-PI, PI]
  while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

  const steerDeadzone = 0.04;
  if (angleDiff > steerDeadzone) {
    inputs.right = true;
  } else if (angleDiff < -steerDeadzone) {
    inputs.left = true;
  }

  // 6. Corner Curvature & Target Speed Calculation
  // Look ahead several waypoints to detect sharp corners
  const farLookahead = (closestIndex + 22) % n;
  const farPoint = pts[farLookahead];
  const farNext = pts[(farLookahead + 1) % n];
  const farAngle = Math.atan2(farNext.y - farPoint.y, farNext.x - farPoint.x);

  let cornerSharpness = Math.abs(farAngle - targetAngle);
  while (cornerSharpness > Math.PI) cornerSharpness = 2 * Math.PI - cornerSharpness;

  // Max corner speed based on sharpness
  let cornerMaxSpeed = 330;
  if (cornerSharpness > 1.2) {
    cornerMaxSpeed = 95; // tight hairpin
  } else if (cornerSharpness > 0.7) {
    cornerMaxSpeed = 150; // medium corner
  } else if (cornerSharpness > 0.35) {
    cornerMaxSpeed = 230; // fast sweeper
  }

  const teamBonus = car.team.speedRating / 100;
  const targetSpeed = cornerMaxSpeed * speedSkill * teamBonus;
  car.targetSpeed = targetSpeed;

  // 7. Throttle & Braking
  if (car.speed < targetSpeed - 10) {
    inputs.up = true;
  } else if (car.speed > targetSpeed + 15) {
    // Need braking for corner entry
    inputs.down = Math.random() < brakeSkill;
  } else {
    // Feather throttle
    inputs.up = Math.random() < 0.65;
  }

  // 8. Track Recovery & Unstuck Mechanism
  if (car.surfaceType === 'grass' || car.surfaceType === 'gravel') {
    // Car left the track: limit throttle and steer hard back to nearest point
    inputs.up = car.speed < 70;
    if (Math.abs(angleDiff) > 0.4) {
      inputs.down = car.speed > 85;
    }
  }

  // Anti-stuck watchdog: if moving very slowly while holding throttle
  if (car.speed < 5 && inputs.up) {
    car.aiStuckTimer = (car.aiStuckTimer || 0) + 1;
    if (car.aiStuckTimer > 80) {
      // Reverse briefly to free the car
      inputs.up = false;
      inputs.down = true;
      inputs.left = !inputs.left;
      inputs.right = !inputs.right;
      if (car.aiStuckTimer > 130) {
        car.aiStuckTimer = 0;
      }
    }
  } else {
    car.aiStuckTimer = 0;
  }

  return inputs;
}
