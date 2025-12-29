"use client";

// useful imports 
import { FC, useEffect, useRef, useState } from "react";
import Image from "next/image";
import alienIcon from "./icons/alien.png";
import alien2Icon from "./icons/alien2.png";
import alien3Icon from "./icons/alien3.png";
import solIcon from "./icons/SOL.png";
import ethIcon from "./icons/ETH.png";
import bnbIcon from "./icons/BNB.png";
import avaxIcon from "./icons/AVAX.png";
import usdcIcon from "./icons/USDC.png";
import commando from "./icons/commando.png";


// Types
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
  icon: string;
};

const ICONS = [solIcon, ethIcon, bnbIcon, avaxIcon, usdcIcon];
const ALIEN_ICONS = [alienIcon, alien2Icon, alien3Icon];

const GameSandbox: FC = () => {
  /* ---------------- STATE ---------------- */
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [playing, setPlaying] = useState(false);
  const [welcomePassed, setWelcomePassed] = useState(false);
  const [enemySpeedMul, setEnemySpeedMul] = useState(1);
  const [win, setWin] = useState(false);

  const gameRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const soundsRef = useRef<{
    shot: HTMLAudioElement | null;
    game_over: HTMLAudioElement | null;
  }>({
    shot: null,
    game_over: null,
  });

  const cannonX = 5;
  const [cannonY, setCannonY] = useState(50);

  /* ---------------- INITIALIZE AUDIO (CLIENT-SIDE ONLY) ---------------- */
  useEffect(() => {
    // Only initialize Audio on client-side
    soundsRef.current = {
      shot: new Audio("/shot.wav"),
      game_over: new Audio("/game_over.wav"),
    };

    return () => {
      // Cleanup audio on unmount
      if (soundsRef.current.shot) {
        soundsRef.current.shot.pause();
        soundsRef.current.shot.src = "";
      }
      if (soundsRef.current.game_over) {
        soundsRef.current.game_over.pause();
        soundsRef.current.game_over.src = "";
      }
    };
  }, []);

  /* ---------------- SOUND FUNCTIONS ---------------- */
  const playShot = () => {
    if (soundsRef.current.shot) {
      soundsRef.current.shot.currentTime = 0;
      soundsRef.current.shot.play().catch(() => {
        // Silently handle if audio fails to play
      });
    }
  };

  const playGameOver = () => {
    if (soundsRef.current.game_over) {
      soundsRef.current.game_over.currentTime = 0;
      soundsRef.current.game_over.play().catch(() => {
        // Silently handle if audio fails to play
      });
    }
  };

  // Keep refs in sync with state
  useEffect(() => {
    bulletsRef.current = bullets;
  }, [bullets]);

  useEffect(() => {
    enemiesRef.current = enemies;
  }, [enemies]);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (!playing || dead || win) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Player has survived the full 60 seconds – trigger win state
          setWin(true);
          setPlaying(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [playing, dead, win, score, enemySpeedMul]);

  /* ---------------- DIFFICULTY RAMP ---------------- */
  useEffect(() => {
    if (!playing || dead || win) return;

    const interval = setInterval(() => {
      setEnemySpeedMul((m) => Math.min(m * 1.1, 6));
    }, 5000);
    return () => clearInterval(interval);
  }, [playing, dead, win]);

  /* ---------------- ENEMY SPAWN ---------------- */
  useEffect(() => {
    if (!playing || dead || win) return;

    const spawn = setInterval(() => {
      const randomAlien = ALIEN_ICONS[Math.floor(Math.random() * ALIEN_ICONS.length)];
      setEnemies((e) => [
        ...e,
        {
          id: idRef.current++,
          x: 100,
          y: Math.random() * 80 + 10,
          icon: randomAlien.src,
        },
      ]);
    }, 800);

    return () => clearInterval(spawn);
  }, [playing, dead, win]);

  /* ---------------- GAME LOOP ---------------- */
  useEffect(() => {
    if (!playing || dead || win) return;

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
              playGameOver();
              return false;
            }
            return true;
          }),
      );

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, dead, win, score, enemySpeedMul]);

  /* ---------------- COLLISION DETECTION  ---------------- */
  useEffect(() => {
    if (!playing || dead || win) return;

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
  }, [playing, dead, win]);
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

    const speed = 1.5;
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
    setWin(false);
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
        className="relative w-full h-full max-w-[420px] max-h-[90svh] aspect-9/16 overflow-hidden select-none mx-auto shadow-xl rounded-lg"
        style={{
          minWidth: "min(100vw,420px)",
          minHeight: "min(90svh, calc(100vw*16/9), 700px)",
          backgroundImage:
            "url('https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920&dpr=2')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#050816",
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
          width={46}
          height={46}
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
            src={e.icon}
            width={38}
            height={38}
            key={e.id}
            className="absolute w-[32px] h-[32px] sm:w-9 sm:h-9 rounded-sm select-none pointer-events-none"
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
              Aliens have taken over the world<br/>You Sergent James Reef
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

        {win && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white rounded-lg z-30">
          <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-red-600 tracking-tight">
          🪽 YOU WIN 🪽
          </h2>
          <p className="mb-2 text-lg">
            You survived for 60 secs
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
