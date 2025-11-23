"use client";

import { Check, Hand, Music, Play, RefreshCw, RotateCcw, Settings, Trophy, Volume2, VolumeX, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

// --- Types ---

// "ready" state added: Modal is closed, but bird is hovering waiting for first tap
type GameStatus = "idle" | "ready" | "playing" | "gameover";

interface AudioTheme {
    id: string;
    name: string;
    description: string;
    folder: string;
}

interface GameSettings {
    gapSize: number;
    gravity: number;
    jumpStrength: number;
    pipeSpeed: number;
    pipeSpawnRate: number;
    audioThemeId: string;
}

interface BirdState {
    y: number;
    velocity: number;
    rotation: number;
}

interface PipeData {
    id: number;
    x: number;
    topHeight: number;
    passed: boolean;
}

// --- Constants ---

const LOGICAL_HEIGHT = 800;
const BIRD_SIZE = 34;
const PIPE_WIDTH = 52;
const GROUND_HEIGHT = 20;

const DEFAULT_BIRD = "https://img.etimg.com/thumb/width-420,height-315,imgsize-2014934,resizemode-75,msid-113998626/news/india/23-years-of-narendra-modi-in-public-office-what-has-been-achieved-and-whats-still-to-come/23-years-of-narendra-modi-in-public-office.jpg";
const DEFAULT_PIPE_TEXTURE = "https://www.imageshine.in/uploads/gallery/Rahul_Gandhi_New_PNG_Images_Free_Download.png";

const AUDIO_THEMES: AudioTheme[] = [
    { id: "default", name: "Classic Arcade", description: "Standard game sounds", folder: "default" },
    { id: "modi", name: "PM Modi", description: "Mitron! (Iconic speeches)", folder: "modi" },
    { id: "amitabh", name: "Amitabh Bachchan", description: "Deviyon aur Sajjanon...", folder: "amitabh" },
    { id: "srk", name: "Shahrukh Khan", description: "Picture abhi baaki hai...", folder: "srk" },
];

const DEFAULT_SETTINGS: GameSettings = {
    gapSize: 220,
    gravity: 0.15,
    jumpStrength: -5,
    pipeSpeed: 1.5,
    pipeSpawnRate: 260,
    audioThemeId: "default",
};

// --- Audio Hook ---
const useGameAudio = (currentThemeId: string) => {
    const [isMuted, setIsMuted] = useState(false);
    const bgmRef = useRef<HTMLAudioElement | null>(null);
    const jumpRef = useRef<HTMLAudioElement | null>(null);
    const dieRef = useRef<HTMLAudioElement | null>(null);
    const scoreRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (bgmRef.current) {
            bgmRef.current.pause();
            bgmRef.current.currentTime = 0;
        }
        const theme = AUDIO_THEMES.find(t => t.id === currentThemeId) || AUDIO_THEMES[0];
        const basePath = `/audio/${theme.folder}`;

        bgmRef.current = new Audio(`${basePath}/playing.mp3`);
        bgmRef.current.loop = true;
        bgmRef.current.volume = 0.5;

        jumpRef.current = new Audio(`${basePath}/jump.mp3`);
        dieRef.current = new Audio(`${basePath}/out.mp3`);
        scoreRef.current = new Audio(`${basePath}/win.mp3`);

        jumpRef.current.load();
        dieRef.current.load();
        scoreRef.current.load();

        // Sync mute state immediately
        const els = [bgmRef.current, jumpRef.current, dieRef.current, scoreRef.current];
        els.forEach(el => { if (el) el.muted = isMuted; });

    }, [currentThemeId]);

    useEffect(() => {
        const els = [bgmRef.current, jumpRef.current, dieRef.current, scoreRef.current];
        els.forEach(el => { if (el) el.muted = isMuted; });
    }, [isMuted]);

    const playBGM = useCallback(() => {
        if (isMuted || !bgmRef.current) return;
        bgmRef.current.currentTime = 0;
        bgmRef.current.play().catch((e) => console.log("Audio error", e));
    }, [isMuted]);

    const stopBGM = useCallback(() => {
        if (bgmRef.current) {
            bgmRef.current.pause();
            bgmRef.current.currentTime = 0;
        }
    }, []);

    const playSound = useCallback((type: "jump" | "score" | "die") => {
        if (isMuted) return;
        let audio: HTMLAudioElement | null = null;
        if (type === "jump") audio = jumpRef.current;
        else if (type === "score") audio = scoreRef.current;
        else if (type === "die") audio = dieRef.current;
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch((e) => console.log("SFX error", e));
        }
    }, [isMuted]);

    return { isMuted, setIsMuted, playBGM, stopBGM, playSound };
};

// --- Helper Components ---
const SliderControl = ({
    label, value, min, max, step, onChange
}: {
    label: string; value: number; min: number; max: number; step: number; onChange: (val: number) => void
}) => (
    <div className="mb-4">
        <div className="flex justify-between mb-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
            <span className="text-xs font-bold text-primary">{value}</span>
        </div>
        <input
            type="range" min={min} max={max} step={step} value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
    </div>
);

// Updated Bird with "Hover" animation prop
const Bird = ({ y, rotation, imageSrc, isHovering }: { y: number; rotation: number; imageSrc: string; isHovering: boolean }) => (
    <div
        className={`absolute left-10 w-[34px] h-[24px] z-20 pointer-events-none ${isHovering ? 'animate-bounce' : ''}`}
        style={{
            // If hovering, center it vertically.
            // If playing, use the exact physics Y coordinate.
            top: isHovering ? '50%' : y,

            transform: isHovering ? 'scale(1.2)' : `rotate(${rotation}deg)`,

            // === THE FIX ===
            // We REMOVED 'top' from the transition. 
            // Physics must be instant. Rotation can be smooth.
            transition: "transform 0.1s ease-out"
        }}
    >
        <img src={imageSrc} alt="bird" className="w-full h-full object-contain drop-shadow-md" />
    </div>
);

const Pipe = ({ x, height, isTop, imageSrc }: { x: number; height: number; isTop: boolean; imageSrc: string }) => (
    <div
        className="absolute w-[80px] z-10 object-center overflow-hidden border-x border-black/20"
        style={{
            left: x,
            height: height,
            top: isTop ? 0 : undefined,
            bottom: isTop ? undefined : GROUND_HEIGHT,
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            borderRadius: isTop ? "0 0 4px 4px" : "4px 4px 0 0",
        }}
    >
        <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(0,0,0,0.3)] pointer-events-none" />
    </div>
);

// --- Main Game Component ---

export default function FlappyGame({
    birdImageSrc = DEFAULT_BIRD,
    pipeImageSrc = DEFAULT_PIPE_TEXTURE,
}: { birdImageSrc?: string; pipeImageSrc?: string }) {

    const [status, setStatus] = useState<GameStatus>("idle");
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
    const [showSettings, setShowSettings] = useState(false);

    // Dynamic Game Dimensions
    const [gameWidth, setGameWidth] = useState(600);
    const [scale, setScale] = useState(1);

    const birdRef = useRef<BirdState>({ y: 300, velocity: 0, rotation: 0 });
    const pipesRef = useRef<PipeData[]>([]);
    const frameRef = useRef<number>(0);
    const lastPipeTimeRef = useRef<number>(0);
    const loopRef = useRef<number | null>(null);
    const [, setTick] = useState(0);

    const { isMuted, setIsMuted, playBGM, stopBGM, playSound } = useGameAudio(settings.audioThemeId);

    // --- SCALING ENGINE ---
    useEffect(() => {
        const handleResize = () => {
            const newScale = window.innerHeight / LOGICAL_HEIGHT;
            const newGameWidth = window.innerWidth / newScale;
            setScale(newScale);
            setGameWidth(newGameWidth);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem("flappy-best-score");
        if (saved) setBestScore(parseInt(saved, 10));
    }, []);

    // --- ACTIONS ---

    const prepareGame = () => {
        // 1. Reset Physics state
        birdRef.current = { y: LOGICAL_HEIGHT / 2, velocity: 0, rotation: 0 };
        pipesRef.current = [];
        lastPipeTimeRef.current = 0;
        setScore(0);

        // 2. Close Modal but DO NOT start loop yet
        setStatus("ready");
    };

    const resetGame = () => {
        setStatus("idle");
        setScore(0);
        birdRef.current = { y: LOGICAL_HEIGHT / 2, velocity: 0, rotation: 0 };
        pipesRef.current = [];
    };

    const jump = () => {
        if (status === "gameover" || showSettings) return;

        // FIRST CLICK LOGIC
        if (status === "ready") {
            setStatus("playing");
            // Start Music on first tap
            playBGM();
            // Initialize exact Y position so it doesn't jump from center abruptly
            birdRef.current.y = LOGICAL_HEIGHT / 2;
        }

        if (status === "playing" || status === "ready") {
            birdRef.current.velocity = settings.jumpStrength;
            playSound("jump");
        }
    };

    const gameOver = () => {
        setStatus("gameover");
        stopBGM();
        playSound("die");
        if (score > bestScore) {
            setBestScore(score);
            localStorage.setItem("flappy-best-score", score.toString());
        }
        if (loopRef.current) cancelAnimationFrame(loopRef.current);
    };

    // --- GAME LOOP ---
    const gameLoop = useCallback(() => {
        // Only run physics if playing
        if (status !== "playing" || showSettings) return;

        // Physics
        const bird = birdRef.current;
        bird.velocity += settings.gravity;
        bird.y += bird.velocity;
        bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (bird.velocity * 0.15))) * (180 / Math.PI);

        if (bird.y + BIRD_SIZE >= LOGICAL_HEIGHT - GROUND_HEIGHT || bird.y <= 0) {
            gameOver();
            return;
        }

        // Pipe Spawning
        frameRef.current++;
        if (frameRef.current - lastPipeTimeRef.current > settings.pipeSpawnRate) {
            const minPipeHeight = 50;
            const maxPipeHeight = LOGICAL_HEIGHT - GROUND_HEIGHT - settings.gapSize - minPipeHeight;
            const randomHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;

            pipesRef.current.push({
                id: Date.now(),
                x: gameWidth + 50,
                topHeight: randomHeight,
                passed: false,
            });
            lastPipeTimeRef.current = frameRef.current;
        }

        // Pipe Movement & Collision
        pipesRef.current.forEach((pipe) => {
            pipe.x -= settings.pipeSpeed;

            const forgiveness = 10;
            const birdLeft = 40 + forgiveness;
            const birdRight = 40 + BIRD_SIZE - forgiveness;
            const birdTop = bird.y + forgiveness;
            const birdBottom = bird.y + 24 - forgiveness;
            const pipeLeft = pipe.x;
            const pipeRight = pipe.x + PIPE_WIDTH;

            if (birdRight > pipeLeft && birdLeft < pipeRight) {
                if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + settings.gapSize) {
                    gameOver();
                }
            }

            if (!pipe.passed && birdLeft > pipeRight) {
                pipe.passed = true;
                setScore((prev) => prev + 1);
                playSound("score");
            }
        });

        if (pipesRef.current.length > 0 && pipesRef.current[0].x < -100) {
            pipesRef.current.shift();
        }

        setTick((t) => t + 1);
        loopRef.current = requestAnimationFrame(gameLoop);
    }, [status, showSettings, settings, bestScore, playSound, stopBGM, gameWidth]);

    useEffect(() => {
        if (status === "playing" && !showSettings) {
            loopRef.current = requestAnimationFrame(gameLoop);
        }
        return () => {
            if (loopRef.current) cancelAnimationFrame(loopRef.current);
        };
    }, [status, showSettings, gameLoop]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();
                if (status === "gameover") resetGame();
                else if (status === "idle") prepareGame();
                else jump();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [status, showSettings]);

    return (
        <div className="flex items-center justify-center h-dvh w-full bg-background text-foreground overflow-hidden">

            {/* SCALING CONTAINER */}
            <div
                style={{
                    width: gameWidth,
                    height: LOGICAL_HEIGHT,
                    transform: `scale(${scale})`,
                    transformOrigin: "center center"
                }}
                className="relative bg-card overflow-hidden"
            >
                {/* HEADER */}
                <div className="absolute top-0 left-0 right-0 z-30 p-4 flex justify-between items-start">
                    <div className="flex flex-col pointer-events-none select-none">
                        <span className="text-4xl font-bold text-foreground drop-shadow-md tabular-nums leading-none transition-all duration-300">{score}</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-80 mt-1">Best: {bestScore}</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="p-2.5 rounded-full bg-black/10 backdrop-blur-md hover:bg-black/20 text-foreground transition active:scale-95">
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setShowSettings(true); }} className="p-2.5 rounded-full bg-black/10 backdrop-blur-md hover:bg-black/20 text-foreground transition active:scale-95">
                            <Settings size={18} />
                        </button>
                    </div>
                </div>

                {/* CLICK AREA */}
                <div className="absolute inset-0 z-10 cursor-pointer" onPointerDown={jump} />

                {/* GAME WORLD */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

                    {pipesRef.current.map((pipe) => (
                        <React.Fragment key={pipe.id}>
                            <Pipe x={pipe.x} height={pipe.topHeight} isTop={true} imageSrc={pipeImageSrc} />
                            <Pipe x={pipe.x} height={LOGICAL_HEIGHT - pipe.topHeight - settings.gapSize - GROUND_HEIGHT} isTop={false} imageSrc={pipeImageSrc} />
                        </React.Fragment>
                    ))}

                    {/* Bird component handles its own physics state vs hover state */}
                    <Bird
                        y={birdRef.current.y}
                        rotation={birdRef.current.rotation}
                        imageSrc={birdImageSrc}
                        isHovering={status === "ready"}
                    />

                    <div className="absolute bottom-0 w-full bg-muted border-t-4 border-muted-foreground/20 z-20" style={{ height: GROUND_HEIGHT }} />
                </div>

                {/* --- UI OVERLAYS --- */}

                {/* READY HINT (Shown after clicking Start, before first tap) */}
                <div className={`absolute inset-0 z-20 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${status === 'ready' ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex flex-col items-center gap-4 animate-pulse">
                        <Hand className="w-12 h-12 text-primary" />
                        <span className="text-2xl font-black text-foreground drop-shadow-md">TAP TO JUMP</span>
                    </div>
                </div>

                {/* START MODAL */}
                {status === "idle" && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/40 backdrop-blur-[2px] animate-in fade-in duration-300">
                        <div className="bg-popover border border-border shadow-2xl max-w-sm w-[90%] rounded-2xl p-6 text-center animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
                            <div className="flex items-center justify-end">
                                <button onClick={(e) => { e.stopPropagation(); setShowSettings(true); }} className="p-2.5 rounded-full bg-black/10 backdrop-blur-md hover:bg-black/20 text-foreground transition active:scale-95">
                                    <Settings size={18} />
                                </button>
                            </div>
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary ring-4 ring-primary/20">
                                <Play fill="currentColor" size={32} className="ml-1" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Ready to Float?</h2>
                            <p className="text-sm text-muted-foreground mb-6">Tap start to enter the arena</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); prepareGame(); }} // Use prepareGame() instead of jump()
                                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 transition shadow-lg hover:brightness-110"
                            >
                                START GAME
                            </button>
                        </div>
                    </div>
                )}

                {/* GAME OVER MODAL */}
                {status === "gameover" && !showSettings && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-6 animate-in fade-in duration-500">
                        <div className="bg-card border border-border shadow-2xl rounded-2xl p-6 max-w-sm w-[90%] text-center animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 delay-100">
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <h2 className="text-3xl font-black text-destructive tracking-tight">GAME OVER</h2>
                                <button onClick={(e) => { e.stopPropagation(); setShowSettings(true); }} className="p-2.5 rounded-full bg-black/10 backdrop-blur-md hover:bg-black/20 text-foreground transition active:scale-95">
                                    <Settings size={18} />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-muted/50 p-4 rounded-2xl flex flex-col items-center justify-center border border-border/50">
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Score</span>
                                    <span className="text-3xl font-black">{score}</span>
                                </div>
                                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl flex flex-col items-center justify-center">
                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-yellow-600 dark:text-yellow-400 tracking-wider mb-1">
                                        <Trophy size={10} /> Best
                                    </div>
                                    <span className="text-3xl font-black text-yellow-700 dark:text-yellow-400">{bestScore}</span>
                                </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); resetGame(); }} className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl active:scale-95 transition flex items-center justify-center gap-2 shadow-xl hover:brightness-110">
                                <RefreshCw size={20} /> TRY AGAIN
                            </button>
                        </div>
                    </div>
                )}

                {/* SETTINGS PANEL (Slide In/Out Animation) */}
                {/* We remove the conditional rendering so we can use CSS transitions for Exit animation */}
                <div
                    className={`absolute inset-0 z-[60] flex justify-end transition-all duration-300 ease-in-out ${showSettings ? "bg-background/80 backdrop-blur-sm pointer-events-auto" : "bg-transparent pointer-events-none delay-200"
                        }`}
                >
                    <div
                        className={`h-full w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-out ${showSettings ? "translate-x-0" : "translate-x-full"
                            }`}
                    >
                        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                            <h2 className="font-bold text-lg flex items-center gap-2">
                                <Settings size={18} /> Settings
                            </h2>
                            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-black/5 rounded-full transition active:scale-90">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground tracking-wider">
                                    <Music size={14} /> Audio Voice Pack
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {AUDIO_THEMES.map((theme) => {
                                        const isSelected = settings.audioThemeId === theme.id;
                                        return (
                                            <button
                                                key={theme.id}
                                                onClick={() => setSettings(s => ({ ...s, audioThemeId: theme.id }))}
                                                className={`relative p-3 rounded-xl text-left border-2 transition-all ${isSelected
                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                    : "border-transparent bg-muted/50 hover:bg-muted"
                                                    }`}
                                            >
                                                <div className="font-bold text-sm truncate">{theme.name}</div>
                                                <div className="text-[10px] text-muted-foreground truncate">{theme.description}</div>
                                                {isSelected && <div className="absolute top-3 right-3 text-primary"><Check size={16} strokeWidth={3} /></div>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <hr className="border-border" />
                            <div className="space-y-1">
                                <SliderControl label="Gravity" value={settings.gravity} min={0.1} max={0.8} step={0.05} onChange={(val) => setSettings(s => ({ ...s, gravity: val }))} />
                                <SliderControl label="Game Speed" value={settings.pipeSpeed} min={1} max={5} step={0.5} onChange={(val) => setSettings(s => ({ ...s, pipeSpeed: val }))} />
                                <SliderControl label="Jump Strength" value={settings.jumpStrength} min={-10} max={-3} step={0.5} onChange={(val) => setSettings(s => ({ ...s, jumpStrength: val }))} />
                                <SliderControl label="Gap Size" value={settings.gapSize} min={100} max={300} step={10} onChange={(val) => setSettings(s => ({ ...s, gapSize: val }))} />
                            </div>
                        </div>
                        <div className="p-4 border-t border-border bg-muted/30">
                            <button onClick={() => setSettings(DEFAULT_SETTINGS)} className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition">
                                <RotateCcw size={14} /> Reset Defaults
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}