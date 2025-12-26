"use client";

import { FC, useEffect, useRef, useState } from "react";
import Image from "next/image";
import solIcon from "./icons/SOL.png";
import ethIcon from "./icons/ETH.png";
import bnbIcon from "./icons/BNB.png";
import avaxIcon from "./icons/AVAX.png";
import usdcIcon from "./icons/USDC.png";
import bg from "./images/bg.png";
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
type ModalProps = {
  isOpen: boolean;
  hidden: true;
};
const ICONS = [solIcon, ethIcon, bnbIcon, avaxIcon, usdcIcon];
const GameSandbox: FC = () => {
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [playing, setPlaying] = useState(false);

  const gameRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const cannonX = 2;
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
          .map((e) => ({ ...e, x: e.x - (1 + score * 0.05) }))
          .filter((e) => {
            if (e.x <= 5) {
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
  }, [playing, dead, score]);

  /* ---------------- SHOOT ---------------- */
  const shoot = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playing) setPlaying(true);
    if (dead || !gameRef.current) return;

    const rect = gameRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const constrainedY = Math.max(5, Math.min(95, clickY));
    setCannonY(constrainedY);

    const dx = clickX - cannonX;
    const dy = clickY - constrainedY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.1) return;

    const speed = 1.4;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    const icon = ICONS[Math.floor(Math.random() * ICONS.length)];

    setBullets((bs) => [
      ...bs,
      {
        id: idRef.current++,
        x: cannonX,
        y: constrainedY,
        vx,
        vy,
        icon: icon.src,
      },
    ]);
  };

  /* ---------------- RESET ---------------- */
  const reset = () => {
    setBullets([]);
    setEnemies([]);
    setScore(0);
    setDead(false);
    setTimeLeft(60);
    setPlaying(false);
    setCannonY(50);
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div
        ref={gameRef}
        onClick={shoot}
        className="relative w-full max-w-sm aspect-[9/16] bg-black text-white overflow-hidden select-none"
      >
        {/* HUD */}
        <div className="absolute top-3 left-3 text-sm">
          Score: <b>{score}</b>
        </div>
        <div className="absolute top-3 right-3 text-sm">⏱ {timeLeft}s</div>

        {/* PLAYER */}
        <Image
          src={commando.src}
          width={72}
          height={72}
          alt="Player"
          className="absolute object-contain"
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
            width={24}
            height={24}
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

        {/* START SCREEN */}
        {!playing && !dead && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <p className="text-lg">Tap to Start</p>
          </div>
        )}

        {/* GAME OVER */}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <h2 className="text-3xl font-bold text-red-500 mb-2">GAME OVER</h2>
            <p className="mb-4">Score: {score}</p>
            <button onClick={reset} className="px-4 py-2 border border-white">
              Restart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default GameSandbox;
