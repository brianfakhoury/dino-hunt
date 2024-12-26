"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";

// Types
interface DinoType {
  name: string;
  baseHealth: number;
  speed: number;
  size: number;
  color: string;
  points: number;
  width: number;
  height: number;
}

interface Dinosaur {
  id: number;
  x: number;
  y: number;
  health: number;
  type: DinoType;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  angle: number;
  spawnTime: number;
  hit?: boolean;
}

// Assets
const DINO_DATA = {
  Carnotaurus: {
    name: "Carnotaurus",
    baseHealth: 75,
    speed: 0.4,
    size: 25,
    color: "#ff4444",
    points: 15,
    width: 80,
    height: 60,
    imagePath: "/assets/dinosaurs/carnotaurus.png",
    soundPath: "/assets/dinosaurs/carnataurus.m4a",
  },
  "T-Rex": {
    name: "T-Rex",
    baseHealth: 150,
    speed: 0.2,
    size: 40,
    color: "#8b0000",
    points: 30,
    width: 100,
    height: 80,
    imagePath: "/assets/dinosaurs/t-rex.png",
    soundPath: "/assets/dinosaurs/t-rex.m4a",
  },
  Allosaurus: {
    name: "Allosaurus",
    baseHealth: 100,
    speed: 0.3,
    size: 30,
    color: "#ff8c00",
    points: 20,
    width: 90,
    height: 70,
    imagePath: "/assets/dinosaurs/allosaurus.png",
    soundPath: "/assets/dinosaurs/allosaurus.m4a",
  },
  Triceratops: {
    name: "Triceratops",
    baseHealth: 125,
    speed: 0.15,
    size: 35,
    color: "#556b2f",
    points: 25,
    width: 100,
    height: 70,
    imagePath: "/assets/dinosaurs/triceratops.png",
    soundPath: "/assets/dinosaurs/triceratops.m4a",
  },
  Stegosaurus: {
    name: "Stegosaurus",
    baseHealth: 100,
    speed: 0.175,
    size: 35,
    color: "#2f4f4f",
    points: 20,
    width: 110,
    height: 60,
    imagePath: "/assets/dinosaurs/stegosaurus.png",
    soundPath: "/assets/dinosaurs/stegosaurus.m4a",
  },
};

// Simple sound manager
class GameSounds {
  private sounds = new Map<string, HTMLAudioElement>();
  load(name: string, path: string) {
    const audio = new Audio(path);
    this.sounds.set(name, audio);
  }
  play(name: string) {
    const sound = this.sounds.get(name);
    if (sound) {
      (sound.cloneNode(true) as HTMLAudioElement).play().catch(console.error);
    }
  }
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const soundSystem = useRef(new GameSounds());

  // Core state
  const [dinosaurs, setDinosaurs] = useState<Dinosaur[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Track crosshair
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // Images
  const [dinoImgs, setDinoImgs] = useState<Record<string, HTMLImageElement>>({});
  const [gunImg, setGunImg] = useState<HTMLImageElement | null>(null);
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);

  // Mobile detection helper
  const isMobile = typeof window !== "undefined" && "ontouchstart" in window;

  // Load assets once
  useEffect(() => {
    // Sounds
    soundSystem.current.load("shoot", "/assets/guns/gun.m4a");
    Object.values(DINO_DATA).forEach(dino => {
      soundSystem.current.load(`${dino.name}-death`, dino.soundPath);
    });

    // Background
    const bg = new Image();
    bg.src = "/background.png";
    bg.onload = () => setBgImg(bg);

    // Gun
    const gun = new Image();
    gun.src = "/assets/guns/gun.png";
    gun.onload = () => setGunImg(gun);

    // Dinos
    (async () => {
      const loaded: Record<string, HTMLImageElement> = {};
      for (const dino of Object.values(DINO_DATA)) {
        const img = new Image();
        img.src = dino.imagePath;
        await new Promise(res => (img.onload = res));
        loaded[dino.name] = img;
      }
      setDinoImgs(loaded);
    })();
  }, []);

  // Spawn dinosaurs
  const spawnDinosaurs = useCallback(() => {
    const minDist = 500;
    const maxDist = 1000;
    // Fewer dinos for mobile to help performance
    const count = isMobile ? 25 : 50;

    const newDinos: Dinosaur[] = [];
    const dinoTypes = Object.values(DINO_DATA);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const dist = minDist + Math.random() * (maxDist - minDist);
      const dType = dinoTypes[Math.floor(Math.random() * dinoTypes.length)];
      newDinos.push({
        id: Date.now() + i,
        x: dist * Math.cos(angle),
        y: dist * Math.sin(angle),
        health: dType.baseHealth,
        type: dType,
      });
    }
    setDinosaurs(newDinos);
  }, [isMobile]);

  // Handle pointer lock (desktop only)
  const handlePointerLockChange = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!isMobile && document.pointerLockElement !== canvas && gameStarted) {
      // If we lose pointer lock on desktop, reset
      setGameStarted(false);
      setDinosaurs([]);
      setBullets([]);
      setScore(0);
    }
  }, [gameStarted, isMobile]);

  // Mouse movement (desktop)
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!gameStarted) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (!isMobile && document.pointerLockElement === canvas) {
        // Relative movement
        setMouse(prev => ({
          x: Math.max(0, Math.min(prev.x + e.movementX, canvas.width)),
          y: Math.max(0, Math.min(prev.y + e.movementY, canvas.height)),
        }));
      } else {
        // Absolute positioning
        const rect = canvas.getBoundingClientRect();
        setMouse({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    },
    [gameStarted, isMobile]
  );

  // Touch movement (mobile)
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!gameStarted || !isMobile) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      setMouse({ x, y });
    },
    [gameStarted, isMobile]
  );

  // Touch start -> update crosshair + shoot
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!gameStarted || gameOver || !isMobile) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const { clientX, clientY } = e.touches[0];
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Move crosshair right where the finger is
      setMouse({ x, y });

      // Shoot
      const cw = canvas.width;
      const ch = canvas.height;
      const angle = Math.atan2(y - ch / 2, x - cw / 2);
      soundSystem.current.play("shoot");
      setBullets(bs => [
        ...bs,
        { id: Date.now(), x: 0, y: 0, angle, spawnTime: Date.now() },
      ]);
    },
    [gameStarted, gameOver, isMobile]
  );

  // Safely request pointer lock (desktop only)
  const requestLock = useCallback(() => {
    if (!isMobile) {
      try {
        canvasRef.current?.requestPointerLock();
      } catch {
        /* ignore errors */
      }
    }
  }, [isMobile]);

  // Handle key inputs (desktop)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!gameStarted || gameOver || isMobile) {
        // Let mobile rely on touch
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Fullscreen
      if (e.code === "KeyF") {
        if (!document.fullscreenElement) {
          canvas.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }

      // Start or restart
      if (e.code === "Space" && !gameOver) {
        // If not started, start it
        if (!gameStarted) {
          setGameStarted(true);
          spawnDinosaurs();
          requestLock();
        } else {
          // Otherwise shoot
          const cw = canvas.width;
          const ch = canvas.height;
          const angle = Math.atan2(mouse.y - ch / 2, mouse.x - cw / 2);
          soundSystem.current.play("shoot");
          setBullets(bs => [
            ...bs,
            { id: Date.now(), x: 0, y: 0, angle, spawnTime: Date.now() },
          ]);
        }
      }
      // Restart
      if (e.code === "KeyR") {
        setGameOver(false);
        setScore(0);
        setBullets([]);
        setDinosaurs([]);
        setGameStarted(true);
        spawnDinosaurs();
        requestLock();
      }
    },
    [gameStarted, gameOver, isMobile, mouse, spawnDinosaurs, requestLock]
  );

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize
    const resize = () => {
      if (document.fullscreenElement) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      } else {
        // Fixed dimensions for both mobile and desktop
        if (isMobile) {
          canvas.width = 400;  // Fixed width for mobile
          canvas.height = 550; // Fixed height for mobile
        } else {
          canvas.width = 800;  // Desktop width
          canvas.height = 600; // Desktop height
        }
      }
    };
    resize();

    let lastTime = performance.now();
    let animId = 0;

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      if (bgImg) {
        const scale = Math.max(
          canvas.width / bgImg.width,
          canvas.height / bgImg.height
        );
        const w = bgImg.width * scale;
        const h = bgImg.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        ctx.drawImage(bgImg, x, y, w, h);
      } else {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      if (gameStarted) {
        // Crosshair + gun
        drawCrosshair(ctx, mouse);
        if (gunImg) drawGun(ctx, gunImg, cx, cy, mouse);

        // Update dinos & bullets
        const updatedDinos = updateDinosaurs(dinosaurs, dt);
        const updatedBullets = updateBullets(bullets, dt);

        // Collisions
        const { aliveDinos, activeBullets, increment } = checkCollisions(
          updatedDinos,
          updatedBullets,
          name => soundSystem.current.play(name)
        );
        if (increment > 0) setScore(s => s + increment);

        // Draw
        aliveDinos.forEach(d =>
          drawDino(ctx, d, dinoImgs[d.type.name], cx, cy)
        );
        activeBullets.forEach(b => drawBullet(ctx, b, cx, cy));

        // Check if dinos reached player
        if (aliveDinos.some(d => Math.hypot(d.x, d.y) < d.type.size + 20)) {
          setGameOver(true);
        }

        setDinosaurs(aliveDinos);
        setBullets(activeBullets);

        // Score
        ctx.fillStyle = "#fff";
        ctx.font = "16px sans-serif";
        ctx.fillText(`Score: ${score}`, 20, 40);
      }

      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    // Listeners
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerlockchange", handlePointerLockChange);

    // Touch listeners (mobile)
    if (isMobile) {
      canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
      canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);

      // Remove touch listeners
      if (isMobile) {
        canvas.removeEventListener("touchmove", handleTouchMove);
        canvas.removeEventListener("touchstart", handleTouchStart);
      }
    };
  }, [
    gameStarted,
    gameOver,
    dinosaurs,
    bullets,
    score,
    mouse,
    dinoImgs,
    gunImg,
    bgImg,
    handleMouseMove,
    handleKeyDown,
    handlePointerLockChange,
    handleTouchMove,
    handleTouchStart,
    isMobile,
  ]);

  // End screen
  if (gameOver || (gameStarted && dinosaurs.length === 0)) {
    const victory = dinosaurs.length === 0;
    return (
      <div className="text-center">
        <h2
          className={`text-3xl ${
            victory ? "text-green-500" : "text-red-500"
          } mb-4`}
        >
          {victory ? "Victory!" : "Game Over!"}
        </h2>
        <p className="text-xl text-white mb-4">Final Score: {score}</p>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            setGameOver(false);
            setDinosaurs([]);
            setBullets([]);
            setScore(0);
            setGameStarted(false);
          }}
        >
          Play Again
        </button>
      </div>
    );
  }

  // Intro overlay
  return (
    <div
      className="relative text-white select-none"
      style={{ userSelect: "none", overflow: "hidden" }}
    >
      {!gameStarted && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center bg-black bg-opacity-50 p-3 rounded text-sm">
          <h2 className="text-2xl mb-4">Controls</h2>
          <ul className="text-lg space-y-2">
            <li>
              <span className="font-bold">[SPACE]</span> - Start / Shoot (desktop)
            </li>
            <li>
              <span className="font-bold">Tap</span> - Shoot (mobile)
            </li>
            <li>
              <span className="font-bold">[R]</span> - Restart game
            </li>
            <li>
              <span className="font-bold">[F]</span> - Toggle fullscreen
            </li>
          </ul>
          <button
            className="mt-4 bg-green-600 hover:bg-green-700 px-4 py-4 rounded"
            onClick={() => {
              setGameStarted(true);
              spawnDinosaurs();
              requestLock();
            }}
          >
            Start Game
          </button>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={isMobile ? 400 : 800}
        height={isMobile ? 550 : 600}
        className="border border-white"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}

// --- Helpers ---

function updateDinosaurs(dinosaurs: Dinosaur[], dt: number) {
  return dinosaurs.map(d => {
    const angle = Math.atan2(-d.y, -d.x);
    const speed = d.type.speed * 60;
    return {
      ...d,
      x: d.x + Math.cos(angle) * speed * dt,
      y: d.y + Math.sin(angle) * speed * dt,
    };
  });
}

function updateBullets(bullets: Bullet[], dt: number) {
  const speed = 600;
  return bullets
    .map(b => ({
      ...b,
      x: b.x + Math.cos(b.angle) * speed * dt,
      y: b.y + Math.sin(b.angle) * speed * dt,
    }))
    .filter(b => Math.hypot(b.x, b.y) < 5000);
}

function checkCollisions(
  dinos: Dinosaur[],
  bullets: Bullet[],
  playSound: (soundName: string) => void
) {
  let increment = 0;
  bullets.forEach(b => {
    dinos.forEach(d => {
      if (Math.hypot(d.x - b.x, d.y - b.y) < d.type.size) {
        d.health -= 25;
        b.hit = true;
        if (d.health <= 0) {
          increment += d.type.points;
          playSound(`${d.type.name}-death`);
        }
      }
    });
  });
  const aliveDinos = dinos.filter(d => d.health > 0);
  const activeBullets = bullets.filter(b => !b.hit);
  return { aliveDinos, activeBullets, increment };
}

function drawCrosshair(ctx: CanvasRenderingContext2D, mouse: { x: number; y: number }) {
  ctx.save();
  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = 2;
  const size = 15;
  ctx.beginPath();
  // Horizontal
  ctx.moveTo(mouse.x - size, mouse.y);
  ctx.lineTo(mouse.x + size, mouse.y);
  // Vertical
  ctx.moveTo(mouse.x, mouse.y - size);
  ctx.lineTo(mouse.x, mouse.y + size);
  ctx.stroke();
  ctx.restore();
}

function drawGun(
  ctx: CanvasRenderingContext2D,
  gunImg: HTMLImageElement,
  cx: number,
  cy: number,
  mouse: { x: number; y: number }
) {
  ctx.save();
  ctx.translate(cx, cy);
  const angle = Math.atan2(mouse.y - cy, mouse.x - cx);
  ctx.rotate(angle);
  ctx.scale(-1, 1);
  ctx.drawImage(gunImg, 0, -30, 100, 60);
  ctx.restore();
}

function drawDino(
  ctx: CanvasRenderingContext2D,
  d: Dinosaur,
  img: HTMLImageElement,
  cx: number,
  cy: number
) {
  if (!img) return;
  const sx = cx + d.x;
  const sy = cy + d.y;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(Math.atan2(-d.y, -d.x) + Math.PI / 2);
  ctx.drawImage(img, -d.type.width / 2, -d.type.height / 2, d.type.width, d.type.height);
  ctx.restore();

  // Health bar
  const hpPct = d.health / d.type.baseHealth;
  ctx.fillStyle = "#333";
  ctx.fillRect(sx - 25, sy - d.type.height / 2 - 18, 50, 5);
  ctx.fillStyle = hpPct > 0.5 ? "#0f0" : hpPct > 0.25 ? "#ff0" : "#f00";
  ctx.fillRect(sx - 25, sy - d.type.height / 2 - 18, 50 * hpPct, 5);
}

function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet, cx: number, cy: number) {
  const sx = cx + b.x;
  const sy = cy + b.y;
  const age = (Date.now() - b.spawnTime) / 1000;
  const baseSize = 6 * (1 + Math.sin(age * 8) * 0.3);

  // Trail
  ctx.save();
  const trailLen = 35;
  const grad = ctx.createLinearGradient(
    sx - Math.cos(b.angle) * trailLen,
    sy - Math.sin(b.angle) * trailLen,
    sx,
    sy
  );
  grad.addColorStop(0, "rgba(255, 100, 0, 0)");
  grad.addColorStop(0.4, "rgba(255, 200, 0, 0.4)");
  grad.addColorStop(1, "rgba(255, 255, 100, 0.8)");
  ctx.strokeStyle = grad;
  ctx.lineWidth = baseSize * 1.5;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(
    sx - Math.cos(b.angle) * trailLen,
    sy - Math.sin(b.angle) * trailLen
  );
  ctx.stroke();
  ctx.restore();

  // Glow + core
  ctx.save();
  ctx.beginPath();
  ctx.arc(sx, sy, baseSize * 3, 0, Math.PI * 2);
  const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, baseSize * 3);
  glow.addColorStop(0, "rgba(255, 200, 0, 0.4)");
  glow.addColorStop(0.5, "rgba(255, 150, 0, 0.2)");
  glow.addColorStop(1, "rgba(255, 100, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(sx, sy, baseSize, 0, Math.PI * 2);
  const core = ctx.createRadialGradient(sx, sy, 0, sx, sy, baseSize);
  core.addColorStop(0, "#fff");
  core.addColorStop(0.3, "#fff700");
  core.addColorStop(1, "#ff8c00");
  ctx.fillStyle = core;
  ctx.fill();
  ctx.restore();
}
