import { Checkpoint, Point, TrackConfig, TrackSceneryItem } from './types';

/**
 * Computes smooth Catmull-Rom spline points for closed loops.
 */
function generateClosedSpline(controlPoints: Point[], samplesPerSegment: number = 20): Point[] {
  const result: Point[] = [];
  const n = controlPoints.length;

  for (let i = 0; i < n; i++) {
    const p0 = controlPoints[(i - 1 + n) % n];
    const p1 = controlPoints[i];
    const p2 = controlPoints[(i + 1) % n];
    const p3 = controlPoints[(i + 2) % n];

    for (let s = 0; s < samplesPerSegment; s++) {
      const t = s / samplesPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;

      // Standard Catmull-Rom formulation
      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

      const y =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

      result.push({ x, y });
    }
  }

  return result;
}

/**
 * Places checkpoints uniformly spaced along the centerline.
 */
function generateCheckpoints(centerline: Point[], count: number = 24): Checkpoint[] {
  const checkpoints: Checkpoint[] = [];
  const step = Math.floor(centerline.length / count);

  for (let i = 0; i < count; i++) {
    const idx = (i * step) % centerline.length;
    const nextIdx = (idx + 1) % centerline.length;
    const p = centerline[idx];
    const next = centerline[nextIdx];
    const angle = Math.atan2(next.y - p.y, next.x - p.x);

    checkpoints.push({
      x: p.x,
      y: p.y,
      radius: 130,
      index: i,
      angle,
    });
  }

  return checkpoints;
}

/**
 * Computes 8 staggered F1 starting grid positions behind start line.
 */
function generateGridSpots(centerline: Point[], trackWidth: number): Array<{ x: number; y: number; angle: number }> {
  const spots: Array<{ x: number; y: number; angle: number }> = [];
  const total = centerline.length;

  for (let i = 0; i < 8; i++) {
    // Each row is offset by ~25 points backwards along centerline
    const offsetIndex = (total - (i + 1) * 22) % total;
    const p = centerline[offsetIndex];
    const nextP = centerline[(offsetIndex + 1) % total];
    const angle = Math.atan2(nextP.y - p.y, nextP.x - p.x);

    // Lateral normal
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);

    // Stagger left and right: P1 is on racing line (right/left), P2 opposite
    const lateralShift = (i % 2 === 0 ? 0.28 : -0.28) * trackWidth;

    spots.push({
      x: p.x + nx * lateralShift,
      y: p.y + ny * lateralShift,
      angle,
    });
  }

  return spots;
}

/* =========================================================================
   1. COASTAL GP (Riviera Marina)
   ========================================================================= */
const coastalControlPoints: Point[] = [
  { x: 1200, y: 500 }, // Start/finish straight
  { x: 1700, y: 500 }, // Turn 1 entry
  { x: 2100, y: 650 }, // Turn 1 fast sweep
  { x: 2400, y: 1000 }, // Turn 2 seaside cliff
  { x: 2350, y: 1400 }, // Ocean curve
  { x: 2000, y: 1750 }, // Harbour chicane entry
  { x: 1750, y: 1650 }, // Harbour chicane exit
  { x: 1500, y: 1950 }, // Marina hairpin
  { x: 1100, y: 1800 }, // Pier straight
  { x: 800, y: 1500 },  // Tunnel chicane
  { x: 500, y: 1600 },  // Beach hairpin
  { x: 350, y: 1200 },  // Sweeping bend
  { x: 450, y: 800 },   // Yacht club turn
  { x: 800, y: 520 },   // Final corner onto main straight
];

const coastalCenterline = generateClosedSpline(coastalControlPoints, 28);
const coastalCheckpoints = generateCheckpoints(coastalCenterline, 24);
const coastalWidth = 145;
const coastalGrid = generateGridSpots(coastalCenterline, coastalWidth);

const coastalScenery: TrackSceneryItem[] = [
  // Grandstands along main straight
  { x: 1350, y: 390, type: 'grandstand', width: 220, height: 45, color: '#0284c7' },
  { x: 1620, y: 390, type: 'grandstand', width: 220, height: 45, color: '#0284c7' },
  // Palm trees along waterfront
  { x: 2500, y: 900, type: 'tree' },
  { x: 2450, y: 1150, type: 'tree' },
  { x: 2400, y: 1350, type: 'tree' },
  { x: 2250, y: 1600, type: 'tree' },
  { x: 1950, y: 1900, type: 'tree' },
  { x: 1650, y: 2100, type: 'tree' },
  { x: 1350, y: 2050, type: 'tree' },
  { x: 1000, y: 1950, type: 'tree' },
  { x: 700, y: 1650, type: 'tree' },
  { x: 300, y: 1400, type: 'tree' },
  { x: 280, y: 1100, type: 'tree' },
  { x: 350, y: 700, type: 'tree' },
  // Luxury Yachts moored in marina bay
  { x: 1550, y: 1100, type: 'yacht', width: 140, height: 45, rotation: 0.3 },
  { x: 1750, y: 1300, type: 'yacht', width: 180, height: 50, rotation: -0.4 },
  { x: 1300, y: 1350, type: 'yacht', width: 160, height: 48, rotation: 0.1 },
  // Trackside sponsor hoardings
  { x: 1450, y: 590, type: 'sponsor', width: 160, height: 16, label: 'ROLEX RIVIERA GP' },
  { x: 2200, y: 570, type: 'sponsor', width: 160, height: 16, label: 'PIRELLI ZERO' },
  { x: 1850, y: 1830, type: 'sponsor', width: 150, height: 16, label: 'APEX OIL' },
  { x: 400, y: 950, type: 'sponsor', width: 150, height: 16, label: 'TAG HEUER' },
];

/* =========================================================================
   2. NEON CITY GP (Midnight Street Circuit)
   ========================================================================= */
const neonControlPoints: Point[] = [
  { x: 1000, y: 400 }, // Start straight
  { x: 1500, y: 400 }, // High speed straight
  { x: 1900, y: 400 }, // Turn 1 heavy braking
  { x: 2150, y: 650 }, // 90-degree right
  { x: 2150, y: 1100 }, // Boulevard straight
  { x: 2000, y: 1350 }, // Chicane 1
  { x: 2200, y: 1600 }, // Chicane 2
  { x: 1900, y: 1900 }, // Bridge entry
  { x: 1400, y: 1900 }, // Underpass straight
  { x: 1000, y: 1800 }, // Tunnel exit
  { x: 700, y: 2000 },  // Harbor hairpin
  { x: 450, y: 1750 },  // Left kink
  { x: 450, y: 1200 },  // West boulevard
  { x: 650, y: 900 },   // Plaza chicane
  { x: 500, y: 650 },   // Tower corner
  { x: 750, y: 450 },   // Final corner
];

const neonCenterline = generateClosedSpline(neonControlPoints, 28);
const neonCheckpoints = generateCheckpoints(neonCenterline, 24);
const neonWidth = 140;
const neonGrid = generateGridSpots(neonCenterline, neonWidth);

const neonScenery: TrackSceneryItem[] = [
  // Neon streetlights casting bright illumination cones
  { x: 1100, y: 310, type: 'light', color: '#00ffff' },
  { x: 1400, y: 310, type: 'light', color: '#00ffff' },
  { x: 1700, y: 310, type: 'light', color: '#00ffff' },
  { x: 2230, y: 800, type: 'light', color: '#ff007f' },
  { x: 2230, y: 1200, type: 'light', color: '#ff007f' },
  { x: 1900, y: 1980, type: 'light', color: '#00ffff' },
  { x: 1500, y: 1980, type: 'light', color: '#00ffff' },
  { x: 1100, y: 1880, type: 'light', color: '#ff007f' },
  { x: 370, y: 1500, type: 'light', color: '#00ffff' },
  { x: 370, y: 1000, type: 'light', color: '#ff007f' },
  // Skyscraper rooftop grandstands
  { x: 1250, y: 290, type: 'grandstand', width: 240, height: 50, color: '#4f46e5' },
  { x: 1650, y: 290, type: 'grandstand', width: 240, height: 50, color: '#4f46e5' },
  { x: 1600, y: 1990, type: 'grandstand', width: 260, height: 50, color: '#9333ea' },
  // Neon sponsor banners
  { x: 1300, y: 490, type: 'sponsor', width: 160, height: 16, label: 'CYBER MOTORSPORT' },
  { x: 2050, y: 950, type: 'sponsor', width: 150, height: 16, label: 'NEXUS ENERGY' },
  { x: 1200, y: 1720, type: 'sponsor', width: 160, height: 16, label: 'HYPERDRIVE V8' },
  { x: 550, y: 1400, type: 'sponsor', width: 140, height: 16, label: 'APEX NITRO' },
];

/* =========================================================================
   3. DESERT INTERNATIONAL (Oasis Grand Prix)
   ========================================================================= */
const desertControlPoints: Point[] = [
  { x: 1100, y: 450 }, // Main start straight
  { x: 1650, y: 450 }, // DRS detection point
  { x: 2150, y: 450 }, // High speed straight end
  { x: 2500, y: 700 }, // Turn 1 & 2 tight hairpin
  { x: 2300, y: 1050 }, // Technical downhill sweep
  { x: 2450, y: 1400 }, // Turn 4 fast entry
  { x: 2200, y: 1750 }, // Turn 5 esses
  { x: 1800, y: 1600 }, // Turn 6 esses
  { x: 1500, y: 1900 }, // Turn 7 hairpin
  { x: 1050, y: 1700 }, // Back straight
  { x: 650, y: 1850 },  // Stadium section entry
  { x: 400, y: 1550 },  // Carousel turn
  { x: 450, y: 1100 },  // Sweeping left
  { x: 750, y: 850 },   // Technical right
  { x: 650, y: 580 },   // Final hairpin
  { x: 850, y: 450 },   // Straight entry
];

const desertCenterline = generateClosedSpline(desertControlPoints, 28);
const desertCheckpoints = generateCheckpoints(desertCenterline, 24);
const desertWidth = 155;
const desertGrid = generateGridSpots(desertCenterline, desertWidth);

const desertScenery: TrackSceneryItem[] = [
  // Grandstands
  { x: 1300, y: 340, type: 'grandstand', width: 260, height: 50, color: '#d97706' },
  { x: 1700, y: 340, type: 'grandstand', width: 260, height: 50, color: '#d97706' },
  { x: 1250, y: 1800, type: 'grandstand', width: 220, height: 45, color: '#b45309' },
  // Floodlights for twilight GP
  { x: 1100, y: 360, type: 'light', color: '#ffedd5' },
  { x: 1500, y: 360, type: 'light', color: '#ffedd5' },
  { x: 1900, y: 360, type: 'light', color: '#ffedd5' },
  { x: 2580, y: 850, type: 'light', color: '#ffedd5' },
  { x: 2350, y: 1550, type: 'light', color: '#ffedd5' },
  { x: 1650, y: 1700, type: 'light', color: '#ffedd5' },
  { x: 800, y: 1750, type: 'light', color: '#ffedd5' },
  { x: 350, y: 1350, type: 'light', color: '#ffedd5' },
  // Oasis palm clusters
  { x: 1400, y: 1150, type: 'tree' },
  { x: 1450, y: 1200, type: 'tree' },
  { x: 1350, y: 1250, type: 'tree' },
  { x: 1500, y: 1100, type: 'tree' },
  // Sponsor hoardings
  { x: 1450, y: 550, type: 'sponsor', width: 170, height: 16, label: 'ARAMCO SAHARA' },
  { x: 2350, y: 550, type: 'sponsor', width: 150, height: 16, label: 'DHL FASTEST LAP' },
  { x: 1950, y: 1500, type: 'sponsor', width: 150, height: 16, label: 'EMIRATES GP' },
  { x: 500, y: 950, type: 'sponsor', width: 150, height: 16, label: 'PIRELLI F1' },
];

/* =========================================================================
   CIRCUIT EXPORT LIST
   ========================================================================= */
export const TRACKS: Record<string, TrackConfig> = {
  coastal: {
    id: 'coastal',
    name: 'Coastal GP',
    location: 'Riviera Port',
    country: 'Monaco',
    flag: '🇲🇨',
    lengthMeters: 4280,
    lapsDefault: 5,
    trackWidth: coastalWidth,
    centerline: coastalCenterline,
    startPosition: { x: coastalCenterline[0].x, y: coastalCenterline[0].y },
    startAngle: 0,
    gridSpots: coastalGrid,
    checkpoints: coastalCheckpoints,
    scenery: coastalScenery,
    theme: 'coastal',
    skyColor: '#0c4a6e',
    groundColor: '#064e3b',
    asphaltColor: '#1e2430',
    kerbColor1: '#dc2626',
    kerbColor2: '#f8fafc',
    recordsKey: 'apex_rush_record_coastal',
  },
  neon_city: {
    id: 'neon_city',
    name: 'Neon City GP',
    location: 'Neo Marina Bay',
    country: 'Singapore',
    flag: '🇸🇬',
    lengthMeters: 4520,
    lapsDefault: 5,
    trackWidth: neonWidth,
    centerline: neonCenterline,
    startPosition: { x: neonCenterline[0].x, y: neonCenterline[0].y },
    startAngle: 0,
    gridSpots: neonGrid,
    checkpoints: neonCheckpoints,
    scenery: neonScenery,
    theme: 'neon',
    skyColor: '#050510',
    groundColor: '#0b0f19',
    asphaltColor: '#11151f',
    kerbColor1: '#00ffff',
    kerbColor2: '#ff007f',
    recordsKey: 'apex_rush_record_neon',
  },
  desert: {
    id: 'desert',
    name: 'Desert International',
    location: 'Sakhir Dunes',
    country: 'Bahrain',
    flag: '🇧🇭',
    lengthMeters: 5412,
    lapsDefault: 5,
    trackWidth: desertWidth,
    centerline: desertCenterline,
    startPosition: { x: desertCenterline[0].x, y: desertCenterline[0].y },
    startAngle: 0,
    gridSpots: desertGrid,
    checkpoints: desertCheckpoints,
    scenery: desertScenery,
    theme: 'desert',
    skyColor: '#451a03',
    groundColor: '#78350f',
    asphaltColor: '#23252e',
    kerbColor1: '#0284c7',
    kerbColor2: '#f8fafc',
    recordsKey: 'apex_rush_record_desert',
  },
};
