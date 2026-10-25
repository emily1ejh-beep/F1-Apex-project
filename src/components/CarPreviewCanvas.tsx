import React, { useEffect, useRef } from 'react';
import { UNDERGLOW_PRESETS } from '../game/constants';
import { GameRenderer } from '../game/renderer';
import { Car, TeamConfig, UnderglowColorId } from '../game/types';

interface CarPreviewCanvasProps {
  team: TeamConfig;
  underglow: UnderglowColorId;
  width?: number;
  height?: number;
}

export const CarPreviewCanvas: React.FC<CarPreviewCanvasProps> = ({
  team,
  underglow,
  width = 240,
  height = 160,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const mockCar: Car = {
      id: 'preview',
      name: team.driverName,
      isPlayer: true,
      team,
      underglow,
      x: 0,
      y: 0,
      angle: 0,
      vx: 0,
      vy: 0,
      angularVelocity: 0,
      steerAngle: 0,
      speed: 120,
      rpm: 9500,
      gear: 3,
      throttle: 0.8,
      brake: 0,
      driftSlip: 0,
      isReversing: false,
      surfaceType: 'asphalt',
      currentLap: 1,
      currentCheckpoint: 0,
      lapTimes: [],
      currentLapStartTime: 0,
      currentLapTime: 0,
      bestLapTime: null,
      lastLapTime: null,
      totalRaceTime: 0,
      isFinished: false,
      finishRank: 0,
      distanceAlongTrack: 0,
      wrongWay: false,
      targetSpeed: 200,
      aiWayIndex: 0,
      aiOvertakeOffset: 0,
      aiAggression: 0.5,
      aiStuckTimer: 0,
      radius: 17,
      collidedWithCar: false,
      collidedWithWall: false,
    };

    const renderer = new GameRenderer(canvas);

    const renderLoop = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Dark carbon background with subtle radial vignette
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        10,
        width * 0.5,
        height * 0.5,
        width * 0.6
      );
      bgGrad.addColorStop(0, '#131824');
      bgGrad.addColorStop(1, '#06080c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle showroom floor grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.save();
      // Center and scale car slightly for preview
      ctx.translate(width * 0.5, height * 0.5);
      ctx.scale(1.4, 1.4);

      // Subtle wobble to show off lighting
      mockCar.angle = Math.sin(time) * 0.08;
      mockCar.steerAngle = Math.sin(time * 1.5) * 0.04;
      mockCar.rpm = 8000 + Math.sin(time * 3) * 4000;

      renderer.renderCar(mockCar, time);
      ctx.restore();

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [team, underglow, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-xl border border-slate-800 shadow-2xl block"
    />
  );
};
