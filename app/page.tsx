"use client";

import { FC, useEffect, useRef, useState } from "react";
import Image from "next/image";
import solIcon from "./icons/SOL.png";
import ethIcon from "./icons/ETH.png";
import bnbIcon from "./icons/BNB.png";
import avaxIcon from "./icons/AVAX.png";
import usdcIcon from "./icons/USDC.png";
import commando from "./icons/commando.png";

type Bullet = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  icon: string;
};

type Enemy = {
  id: number;
  x: number;
  y: number;
};

const ICONS = [solIcon, ethIcon, bnbIcon, avaxIcon, usdcIcon];

const GameSandbox: FC = () => {
  /* ---------------- STATE ---------------- */
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [playing, setPlaying] = useState(false);

  // 🔥 global enemy speed multiplier
  const [enemySpeedMul, setEnemySpeedMul] = useState(1);

  const gameRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);

  // Keep refs in sync with state
  useEffect(() => {
    bulletsRef.current = bullets;
  }, [bullets]);

  useEffect(() => {
    enemiesRef.current = enemies;
  }, [enemies]);

  const cannonX = 5;
  const [cannonY, setCannonY] = useState(50);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (!playing || dead) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setDead(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [playing, dead]);

  /* ---------------- DIFFICULTY RAMP ---------------- */
  useEffect(() => {
    if (!playing || dead) return;

    const interval = setInterval(() => {
      setEnemySpeedMul((m) => Math.min(m * 0.1, 6));
    }, 5000);

    return () => clearInterval(interval);
  }, [playing, dead]);

  /* ---------------- ENEMY SPAWN ---------------- */
  useEffect(() => {
    if (!playing || dead) return;

    const spawn = setInterval(() => {
      setEnemies((e) => [
        ...e,
        {
          id: idRef.current++,
          x: 100,
          y: Math.random() * 80 + 10,
        },
      ]);
    }, 1000);

    return () => clearInterval(spawn);
  }, [playing, dead]);

  /* ---------------- GAME LOOP ---------------- */
  useEffect(() => {
    if (!playing || dead) return;

    let raf: number;

    const loop = () => {
      setBullets((bs) =>
        bs
          .map((b) => ({ ...b, x: b.x + b.vx, y: b.y + b.vy }))
          .filter((b) => b.x >= 0 && b.x <= 100 && b.y >= 0 && b.y <= 100),
      );

      setEnemies((es) =>
        es
          .map((e) => ({
            ...e,
            x: e.x - (0.6 * enemySpeedMul + score * 0.03),
          }))
          .filter((e) => {
            if (e.x <= 3) {
              setDead(true);
              return false;
            }
            return true;
          }),
      );

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, dead, score, enemySpeedMul]);

  /* ---------------- COLLISION DETECTION (FIXED) ---------------- */
  useEffect(() => {
    if (!playing || dead) return;

    const interval = setInterval(() => {
      const currentBullets = bulletsRef.current;
      const currentEnemies = enemiesRef.current;
      
      const newBullets = [...currentBullets];
      let hits = 0;

      const survivingEnemies = currentEnemies.filter((enemy) => {
        const bulletIndex = newBullets.findIndex((b) => {
          const dx = b.x - enemy.x;
          const dy = b.y - enemy.y;
          return Math.sqrt(dx * dx + dy * dy) < 4;
        });

        if (bulletIndex !== -1) {
          newBullets.splice(bulletIndex, 1);
          hits++;
          return false; // 💥 enemy dies
        }

        return true;
      });

      if (hits > 0) {
        setScore((s) => s + hits);
      }

      // Update both states with the calculated results
      setBullets(newBullets);
      setEnemies(survivingEnemies);
    }, 16);

    return () => clearInterval(interval);
  }, [playing, dead]);

  /* ---------------- SHOOT ---------------- */
  const shoot = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playing) setPlaying(true);
    if (dead || !gameRef.current) return;

    const rect = gameRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const y = Math.max(5, Math.min(95, clickY));
    setCannonY(y);

    const dx = clickX - cannonX;
    const dy = clickY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.1) return;

    const speed = 1.4;
    const icon = ICONS[Math.floor(Math.random() * ICONS.length)];

    setBullets((bs) => [
      ...bs,
      {
        id: idRef.current++,
        x: cannonX,
        y,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        icon: icon.src,
      },
    ]);
  };

  /* ---------------- RESET ---------------- */
  const reset = () => {
    setBullets([]);
    setEnemies([]);
    setScore(0);
    setEnemySpeedMul(1);
    setDead(false);
    setTimeLeft(60);
    setPlaying(false);
    setCannonY(50);
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-amber-200">
      <div
        ref={gameRef}
        onClick={shoot}
        className="relative w-full max-w-sm md:aspect-9/16 bg-amber-400 overflow-hidden select-none"
      >
        {/* HUD */}
        <div className="absolute top-3 left-3 text-sm">Score: {score}</div>
        <div className="absolute top-3 right-3 text-sm">⏱ {timeLeft}s</div>
        <div className="absolute top-8 left-3 text-xs opacity-70">
          Speed ×{enemySpeedMul.toFixed(2)}
        </div>

        {/* PLAYER */}
        <Image
          src={commando.src}
          width={72}
          height={72}
          alt="Player"
          className="absolute"
          style={{
            left: `${cannonX}%`,
            top: `${cannonY}%`,
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* BULLETS */}
        {bullets.map((b) => (
          <Image
            key={b.id}
            src={b.icon}
            width={22}
            height={22}
            alt="Bullet"
            className="absolute"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}

        {/* ENEMIES */}
        {enemies.map((e) => (
          <div
            key={e.id}
            className="absolute w-6 h-6 bg-red-600 rounded-sm"
            style={{ left: `${e.x}%`, top: `${e.y}%` }}
          />
        ))}

        {/* START */}
        {!playing && !dead && (
          <div className="absolute inset-0 w-[300] mx-auto px-1 items-center justify-center bg-black/70 h-1/2 my-auto flex flex-col rounded-sm">
            <p>How to Play</p>
            <h3>Scrim is a commando style based game in which u have to shoot enemies with tokens , survive for 60s</h3>
            <button className="px-6 py-3 bg-indigo-600 text-white rounded">
              Tap to Start
            </button>
          </div>
        )}

        {/* GAME OVER */}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
            <h2 className="text-3xl font-bold mb-2">GAME OVER</h2>
            <p className="mb-4">Score: {score}</p>
            <button onClick={reset} className="px-4 py-2 border">
              Restart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameSandbox;
