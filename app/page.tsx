"use client";

import { FC, useEffect, useRef, useState } from "react";
import Image from "next/image";
import alienIcon from "./icons/alien.png";
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
  const [welcomePassed, setWelcomePassed] = useState(false);
  const sounds = {
    shot: new Audio("shot.wav"),
    game_over: new Audio("game_over.wav"),
  };

  function playShot() {
    const sound = sounds.shot;
    sound.currentTime = 0;
    sound.play();
  }
  function playGameOver() {
    const sound = sounds.game_over;
    sound.currentTime = 0;
    sound.play();
  }
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
      setEnemySpeedMul((m) => Math.min(m * 1, 6));
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
    }, 800);

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

  /* ---------------- COLLISION DETECTION  ---------------- */
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
      // playGameOver()
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
    playShot();
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
    setWelcomePassed(true);
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0B0F1A] touch-none">
      <div
        ref={gameRef}
        onClick={shoot}
        className="relative w-full h-full max-w-[420px] max-h-[90svh] aspect-[9/16] bg-[#0B0F1A] overflow-hidden select-none mx-auto shadow-xl rounded-lg"
        style={{
          // To provide full height on mobile, but keep reasonable center on desktop
          minWidth: "min(100vw,420px)",
          minHeight: "min(90svh, calc(100vw*16/9), 700px)",
          boxSizing: "border-box",
        }}
      >
        {/* HUD */}
        <div className="absolute top-2 left-3 text-xs sm:text-sm mb-1 z-10">
          <span>Score: {score}</span>
        </div>
        <div className="absolute top-2 right-3 text-xs sm:text-sm z-10">
          ⏱ {timeLeft}s
        </div>
        <div className="absolute top-7 left-3 text-xs opacity-70 z-10">
          Speed ×{enemySpeedMul.toFixed(2)}
        </div>

        {/* PLAYER */}
        <Image
          src={commando.src}
          width={44}
          height={44}
          alt="Player"
          className="absolute select-none pointer-events-none"
          style={{
            left: `${cannonX}%`,
            top: `${cannonY}%`,
            transform: "translate(-50%, -50%)",
            zIndex: 2,
            width: "36px",
            height: "36px",
            maxWidth: "12vw",
            maxHeight: "8vw",
            userSelect: "none",
            touchAction: "none",
          }}
          draggable={false}
          priority
        />

        {/* BULLETS */}
        {bullets.map((b) => (
          <Image
            key={b.id}
            src={b.icon}
            width={18}
            height={18}
            alt="Bullet"
            priority
            className="absolute select-none pointer-events-none"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 1,
              width: "18px",
              height: "18px",
            }}
            draggable={false}
          />
        ))}

        {/* ENEMIES */}
        {enemies.map((e) => (
          <Image
            alt="Enemy"
            src={alienIcon.src}
            width={38}
            height={38}
            key={e.id}
            className="absolute w-[32px] h-[32px] sm:w-9 sm:h-9 bg-red-600 rounded-sm select-none pointer-events-none"
            style={{
              left: `${e.x}%`,
              top: `${e.y}%`,
              zIndex: 1,
              width: "32px",
              height: "32px",
              maxWidth: "11vw",
              maxHeight: "7vw",
              userSelect: "none",
              touchAction: "none",
            }}
            draggable={false}
            priority
          />
        ))}

        {/* START */}
        {!playing && !dead && !welcomePassed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg px-5 py-6 z-20">
            <p className="text-white text-base font-bold mb-2">Set in 2026</p>
            <p className="text-white text-xs mb-1">
              Aliens have taken over the world
            </p>
            <p className="text-indigo-400 text-base uppercase font-bold mb-3 tracking-wider">
              How to Play?
            </p>
            <p className="mb-2 text-center text-gray-100 text-xs font-medium px-1 leading-relaxed">
              Cryptondo is a commando-style game.
              <br />
              Shoot enemies with tokens.{" "}
              <span className="text-red-400 font-bold">Survive</span> for 60s!
            </p>
            <button
              aria-label="Tap to Start"
              className="px-7 py-2 bg-indigo-600 text-white cursor-pointer rounded uppercase text-sm mt-2 font-semibold shadow hover:bg-indigo-700 transition"
              onClick={() => setWelcomePassed(true)}
            >
              Tap to Start
            </button>
          </div>
        )}

        {/* GAME OVER */}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white rounded-lg z-30">
            <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-red-600 tracking-tight">
              ☠️ GAME OVER ☠️
            </h2>
            <p className="mb-2 text-lg">
              You survived for {60 - timeLeft} secs
            </p>
            <p className="mb-4 text-base font-semibold">Score: {score}</p>
            <button
              onClick={reset}
              aria-label="Restart"
              className="cursor-pointer px-7 py-2 bg-white/30 border border-white/60 text-white rounded font-semibold shadow backdrop-blur-xl hover:bg-white/50 transition"
            >
              Restart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameSandbox;
