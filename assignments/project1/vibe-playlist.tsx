import { useState, useEffect, useRef, useCallback } from "react";
import type { CSSProperties, ReactNode } from "react";

/**
 * ═══════════════════════════════════════════════════════════════════
 *  VIBE PLAYLIST — "The Living Canvas"
 *
 *  A mood-driven music discovery app built as a single React artifact.
 *  The entire viewport is a full-bleed animated mesh gradient that
 *  morphs in real-time based on mood keywords. Content floats on
 *  frosted glass panels over the breathing, colorful canvas.
 *
 *  Stack: React 19, TypeScript, CSS-in-JS (inline styles),
 *         Anthropic Messages API (claude-opus-4-6), window.storage
 *
 *  Typography: Sora (display/headings) + DM Sans (body/UI) +
 *              IBM Plex Mono (metadata)
 * ═══════════════════════════════════════════════════════════════════
 */

// ─── Type Definitions ────────────────────────────────────────────

/** A single song recommendation from the LLM */
interface Song {
  title: string;
  artist: string;
  explanation: string;
}

/** A saved playlist with metadata */
interface Playlist {
  id: string;
  mood_description: string;
  custom_title: string | null;
  created_at: string;
  songs: Song[];
}

/** User genre/artist preferences injected into LLM prompt */
interface UserPreferences {
  preferred_genres: string[];
  favorite_artists: string[];
  excluded_artists: string[];
}

/** Aurora palette — base void color + 3 band colors for the flowing aurora */
interface AuroraPalette {
  base: string;
  colors: [string, string, string];
}

/** Decoded payload from a shared playlist URL */
interface SharedPayload {
  mood: string;
  songs: Song[];
}

/** Application view state */
type ViewState = "home" | "results" | "history" | "prefs" | "shared";

// ─── Design Tokens ───────────────────────────────────────────────

/**
 * Central design token object. All colors, fonts, and derived
 * values live here so the entire visual language can be tuned
 * from a single location.
 */
const T = {
  // Text hierarchy (tuned for contrast on vivid gradient backgrounds)
  textHi: "#f4f1fc",
  textMid: "#d0c9e0",
  textLo: "#a99fbf",

  // Accent (electric lime — CTAs, Spotify links, active states)
  accent: "#c9f06b",
  accentGlow: "rgba(201,240,107,0.4)",
  accentDim: "rgba(201,240,107,0.12)",

  // Glass surface tokens (higher opacity for readability on vivid gradients)
  glassBase: "rgba(8,5,18,0.52)",
  glassBorder: "rgba(255,255,255,0.13)",
  glassBorderHover: "rgba(255,255,255,0.22)",

  // Typography — Sora for display/headings, DM Sans for body, Plex Mono for meta
  display: "'Sora', sans-serif",
  heading: "'DM Sans', sans-serif",
  body: "'DM Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
} as const;

// ─── Mood Palettes ───────────────────────────────────────────────

/**
 * Aurora color palettes — 7 distinct mood categories.
 * Each has a void-dark base and 3 vivid band colors that create
 * the flowing aurora ribbons. Colors are chosen for maximum
 * differentiation between moods.
 */
const PALETTES: Record<string, AuroraPalette> = {
  // Neutral/idle — deep indigo + violet + soft blue
  default:  { base: "#060412", colors: ["#7B3FBE", "#2A60D8", "#A050A0"] },
  // Warm — campfire amber + rose + deep gold
  warm:     { base: "#0C0604", colors: ["#E07028", "#D04060", "#F0A830"] },
  // Cool — icy teal + cerulean + seafoam mint
  cool:     { base: "#030A10", colors: ["#18A0C0", "#2870E0", "#20D8A8"] },
  // Dark — deep wine + midnight violet + charcoal purple
  dark:     { base: "#030108", colors: ["#50186A", "#281858", "#6A2050"] },
  // Bright — hot magenta + electric blue + coral pink
  bright:   { base: "#08030E", colors: ["#E050E8", "#5090FF", "#FF6888"] },
  // Serene — lavender + powder blue + soft sage
  serene:   { base: "#050610", colors: ["#8878C8", "#5898D0", "#70B898"] },
  // Aching — desaturated rose + dusty blue + faded mauve
  aching:   { base: "#080610", colors: ["#B06888", "#6878A8", "#907090"] },
};

/** Keywords that map user input to a mood category */
const MOOD_KEYWORDS: Record<string, string[]> = {
  warm: [
    "cozy", "warm", "fire", "sun", "golden", "amber", "coffee", "autumn",
    "summer", "heat", "passionate", "love", "tender", "comfort", "honey",
    "candle", "glow", "sunset", "rooftop", "campfire", "blanket", "morning",
  ],
  cool: [
    "cold", "ice", "rain", "ocean", "winter", "snow", "frost", "blue",
    "chill", "cool", "breeze", "mist", "fog", "crystal", "aqua",
    "underwater", "arctic", "glass", "silver", "moon", "water",
  ],
  dark: [
    "dark", "night", "shadow", "gothic", "deep", "heavy", "storm", "noir",
    "midnight", "haunted", "grief", "doom", "void", "black", "hollow",
    "sinister", "brooding", "abyss", "grim", "somber",
  ],
  bright: [
    "happy", "bright", "electric", "energy", "euphoria", "dance", "party",
    "joy", "sunshine", "radiant", "vivid", "wild", "feral", "rush",
    "alive", "ecstatic", "manic", "neon", "disco", "blazing", "hype",
  ],
  serene: [
    "peaceful", "calm", "gentle", "quiet", "soft", "still", "zen",
    "dreamy", "floating", "weightless", "ethereal", "tranquil", "sleepy",
    "lullaby", "meditation", "spa", "yoga", "breath", "clouds",
  ],
  aching: [
    "sad", "lonely", "melancholy", "nostalgia", "nostalgic", "longing",
    "bittersweet", "aching", "yearning", "missing", "heartbreak", "loss",
    "wistful", "regret", "faraway", "distant", "memory", "fading",
    "broken", "empty", "lost",
  ],
};

/**
 * Scans the input text for mood keywords and returns the dominant
 * mood category. Falls back to "default" if no keywords match.
 */
function detectMood(text: string): string {
  if (!text || text.length < 2) return "default";
  const low = text.toLowerCase();
  const scores: Record<string, number> = {
    warm: 0, cool: 0, dark: 0, bright: 0, serene: 0, aching: 0,
  };

  for (const [mood, words] of Object.entries(MOOD_KEYWORDS)) {
    for (const w of words) {
      if (low.includes(w)) scores[mood]++;
    }
  }

  const max = Math.max(...Object.values(scores));
  if (max === 0) return "default";
  return Object.keys(scores).find((k) => scores[k] === max) ?? "default";
}

// ─── Constants ───────────────────────────────────────────────────

/** Inspirational mood chips shown on the home screen */
const MOOD_CHIPS = [
  "cozy", "electric", "aching", "feral",
  "weightless", "nostalgic", "dreamy", "serene",
];

/** Genre options for the preferences screen */
const GENRE_OPTIONS = [
  "Indie", "Electronic", "Hip-Hop", "Jazz", "Classical", "R&B",
  "Rock", "Pop", "Latin", "Ambient", "Folk", "Metal",
  "Soul", "Country", "Punk", "Lo-fi",
];

/** Maximum characters for mood input */
const MAX_CHARS = 300;

const VIEW: Record<string, ViewState> = {
  HOME: "home",
  RESULTS: "results",
  HISTORY: "history",
  PREFS: "prefs",
  SHARED: "shared",
};

// ─── Global Stylesheet ──────────────────────────────────────────

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@300;400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { height: 100%; }
body, #root {
  min-height: 100%; width: 100%;
  overflow-x: hidden;
  font-family: ${T.body};
  color: ${T.textHi};
}
::selection { background: ${T.accent}33; color: ${T.accent}; }
input::placeholder, textarea::placeholder { color: ${T.textMid}; opacity: 0.65; }
textarea { resize: none; overflow-y: auto; }
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 3px; }

/* ── Content animations ── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(36px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes barPulse {
  0%,100% { transform: scaleY(0.3); opacity: 0.25; }
  50%     { transform: scaleY(1); opacity: 1; }
}
@keyframes accentBreathe {
  0%,100% { box-shadow: 0 0 20px ${T.accentGlow}, 0 0 50px rgba(201,240,107,0.1); }
  50%     { box-shadow: 0 0 32px ${T.accentGlow}, 0 0 72px rgba(201,240,107,0.22); }
}
`;

/** Injects global styles once into the document head */
function InjectCSS(): null {
  useEffect(() => {
    if (!document.getElementById("vp-styles")) {
      const el = document.createElement("style");
      el.id = "vp-styles";
      el.textContent = GLOBAL_CSS;
      document.head.appendChild(el);
    }
  }, []);
  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BACKGROUND COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Liquid Aurora Background — Performance-Tiered
 *
 * Shows an instant CSS gradient so the page is never blank, then
 * layers the animated canvas on top after a short defer.
 *
 * Two rendering tiers (auto-detected):
 *  Desktop: 5 bands, shadowBlur glow, step=5, 30fps, 1x res
 *  Mobile:  3 bands, NO shadowBlur, step=10, 20fps, 0.5x res
 */
function AuroraBackground({
  mood,
  intensify,
}: {
  mood: string;
  intensify: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const palette = PALETTES[mood] ?? PALETTES.default;
  const paletteRef = useRef(palette);
  const intensifyRef = useRef(intensify);

  useEffect(() => { paletteRef.current = palette; }, [palette]);
  useEffect(() => { intensifyRef.current = intensify; }, [intensify]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isMobile =
      window.innerWidth < 768 ||
      (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);

    const BAND_COUNT = isMobile ? 3 : 5;
    const STEP = isMobile ? 10 : 5;
    const TARGET_MS = 1000 / (isMobile ? 20 : 30);
    const USE_GLOW = !isMobile;
    const RES = isMobile ? 0.5 : 1;

    let w = 0;
    let h = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * RES);
      canvas.height = Math.round(h * RES);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(RES, 0, 0, RES, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const bands = Array.from({ length: BAND_COUNT }, (_, i) => ({
      yBase: 0.1 + i * (0.8 / BAND_COUNT),
      amplitude: 35 + Math.random() * 55,
      freq1: 0.0012 + Math.random() * 0.002,
      freq2: 0.005 + Math.random() * 0.004,
      freq3: 0.001 + Math.random() * 0.001,
      speed1: 0.0003 + Math.random() * 0.0004,
      speed2: 0.0002 + Math.random() * 0.0003,
      speed3: 0.0005 + Math.random() * 0.0004,
      phase: Math.random() * Math.PI * 2,
      thickness: 80 + Math.random() * 100,
      colorIdx: i % 3,
    }));

    let time = 0;
    let lastFrame = 0;

    const draw = (now: number) => {
      rafRef.current = requestAnimationFrame(draw);
      if (now - lastFrame < TARGET_MS) return;
      lastFrame = now;
      time += 1;

      const pal = paletteRef.current;
      const boost = intensifyRef.current ? 1.4 : 1;

      ctx.fillStyle = pal.base;
      ctx.fillRect(0, 0, w, h);

      for (const band of bands) {
        const y0 = band.yBase * h;
        const color = pal.colors[band.colorIdx];

        const pts: number[] = [];
        for (let x = -10; x <= w + 10; x += STEP) {
          const n1 = Math.sin(x * band.freq1 + time * band.speed1 + band.phase) * band.amplitude;
          const n2 = Math.sin(x * band.freq2 + time * band.speed2 + band.phase * 1.5) * band.amplitude * 0.4;
          const n3 = Math.sin(x * band.freq3 + time * band.speed3 + band.phase * 0.4) * band.amplitude * 0.6;
          pts.push(x, y0 + n1 + n2 + n3);
        }

        // 1) Gradient fill
        const grad = ctx.createLinearGradient(0, y0 - band.thickness, 0, y0 + band.thickness);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.3, color + "15");
        grad.addColorStop(0.5, color + Math.round(0x28 * boost).toString(16).padStart(2, "0"));
        grad.addColorStop(0.7, color + "15");
        grad.addColorStop(1, "transparent");

        ctx.beginPath();
        ctx.moveTo(pts[0], h + 10);
        for (let i = 0; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
        ctx.lineTo(pts[pts.length - 2], h + 10);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // 2) Glow — desktop only
        if (USE_GLOW) {
          ctx.beginPath();
          for (let i = 0; i < pts.length; i += 2) {
            if (i === 0) ctx.moveTo(pts[i], pts[i + 1]);
            else ctx.lineTo(pts[i], pts[i + 1]);
          }
          ctx.strokeStyle = color + "18";
          ctx.lineWidth = band.thickness * 0.5;
          ctx.shadowColor = color;
          ctx.shadowBlur = 30;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // 3) Center line (wider+brighter on mobile to compensate)
        ctx.beginPath();
        for (let i = 0; i < pts.length; i += 2) {
          if (i === 0) ctx.moveTo(pts[i], pts[i + 1]);
          else ctx.lineTo(pts[i], pts[i + 1]);
        }
        ctx.strokeStyle = color + (USE_GLOW ? "30" : "45");
        ctx.lineWidth = USE_GLOW ? 1.5 : 2.5;
        ctx.stroke();
      }

      const vig = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, Math.max(w, h) * 0.8);
      vig.addColorStop(0, "transparent");
      vig.addColorStop(1, pal.base + "55");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
    };

    // Defer canvas start so React paints UI + CSS fallback first
    const delay = setTimeout(() => {
      rafRef.current = requestAnimationFrame(draw);
    }, 120);

    return () => {
      clearTimeout(delay);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Instant CSS fallback — visible until canvas paints over it
  const pal = PALETTES[mood] ?? PALETTES.default;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse at 25% 20%, ${pal.colors[0]}30 0%, transparent 55%),
            radial-gradient(ellipse at 70% 55%, ${pal.colors[1]}25 0%, transparent 50%),
            radial-gradient(ellipse at 45% 80%, ${pal.colors[2]}20 0%, transparent 50%),
            ${pal.base}
          `,
          transition: "background 2s ease",
        }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
      />
    </div>
  );
}

/** SVG film grain texture overlay — adds tactile quality to the canvas */
function Grain() {
  return (
    <svg
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
        pointerEvents: "none",
        opacity: 0.028,
      }}
    >
      <filter id="vp-grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.8"
          numOctaves="4"
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#vp-grain)" />
    </svg>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  UI PRIMITIVES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface GlassProps {
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/**
 * Frosted glass surface panel.
 * Uses `backdrop-filter: blur(24px) saturate(1.2)` over a
 * semi-transparent dark base, allowing the mesh gradient to
 * bleed through and create depth.
 */
function Glass({ children, style, onClick, onMouseEnter, onMouseLeave }: GlassProps) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: T.glassBase,
        backdropFilter: "blur(24px) saturate(1.2)",
        WebkitBackdropFilter: "blur(24px) saturate(1.2)",
        border: `1px solid ${T.glassBorder}`,
        borderRadius: 22,
        transition:
          "transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s ease, border-color 0.3s ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Ephemeral notification bar — auto-dismisses after 2.4s */
function Toast({
  message,
  visible,
  onDone,
}: {
  message: string;
  visible: boolean;
  onDone: () => void;
}) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onDone, 2400);
      return () => clearTimeout(t);
    }
  }, [visible, onDone]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 300,
        padding: "10px 28px",
        borderRadius: 50,
        background: "rgba(8,5,18,0.82)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${T.accentDim}`,
        color: T.accent,
        fontFamily: T.mono,
        fontSize: 12,
        fontWeight: 300,
        animation: "fadeUp 0.3s ease",
        boxShadow: `0 0 24px ${T.accentGlow}`,
      }}
    >
      {message}
    </div>
  );
}

/** Animated loading indicator — pulsing equalizer bars */
function Loader() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 28,
        animation: "fadeUp 0.5s ease",
      }}
    >
      <div style={{ display: "flex", gap: 5, alignItems: "flex-end", height: 44 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 3,
              height: 40,
              borderRadius: 2,
              background: T.accent,
              animation: `barPulse 1s ease-in-out ${i * 0.1}s infinite`,
              transformOrigin: "bottom",
            }}
          />
        ))}
      </div>
      <p
        style={{
          fontFamily: T.mono,
          fontSize: 12,
          color: T.textLo,
          fontWeight: 300,
          letterSpacing: "0.06em",
        }}
      >
        Curating Your Vibe…
      </p>
    </div>
  );
}

/** Outlined pill navigation button with hover fill */
function Nav({
  label,
  onClick,
  accent,
}: {
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const accentMode = !!accent;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov
          ? accentMode ? T.accentDim : "rgba(255,255,255,0.08)"
          : "transparent",
        border: `1px solid ${
          accentMode
            ? hov ? T.accent : T.accentDim
            : hov ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)"
        }`,
        borderRadius: 50,
        cursor: "pointer",
        padding: "6px 16px",
        fontFamily: T.mono,
        fontSize: 11.5,
        fontWeight: 400,
        letterSpacing: "0.02em",
        color: hov
          ? accentMode ? T.accent : T.textHi
          : accentMode ? T.accent : T.textMid,
        textShadow: hov && accentMode ? `0 0 14px ${T.accentGlow}` : "none",
        boxShadow: hov && accentMode ? `0 0 12px ${T.accent}15` : "none",
        transition: "all 0.25s ease",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

/** Shared top navigation bar used across results/history/prefs views */
function TopBar({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 52,
        animation: "fadeUp 0.4s ease",
      }}
    >
      <div>{left}</div>
      <div style={{ display: "flex", gap: 8 }}>{right}</div>
    </div>
  );
}

/** Mood chip button for the home screen — fills input on click */
function MoodChip({ label, onClick }: { label: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "rgba(255,255,255,0.12)" : "none",
        border: "none",
        cursor: "pointer",
        padding: "6px 14px",
        borderRadius: 50,
        fontFamily: T.heading,
        fontWeight: 600,
        fontSize: 13,
        color: hov ? T.textHi : T.textMid,
        textShadow: hov ? `0 0 20px rgba(240,236,248,0.25)` : "none",
        transition: "all 0.3s ease",
        letterSpacing: "0.01em",
      }}
    >
      {label}
    </button>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SONG CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Individual song recommendation card with:
 *  - Left accent edge bar (glows on hover)
 *  - Frosted glass surface
 *  - Song metadata + italic explanation
 *  - Spotify link (opens open.spotify.com — on mobile this triggers
 *    the native app via universal/app links if installed)
 *
 * NOTE: The artifact sandbox CSP blocks custom URI schemes (spotify:),
 * iframes to external origins, and restricted window.open targets.
 * Spotify's own web URLs handle native app redirection on mobile via
 * universal links (iOS) and app links (Android). On desktop, the
 * Spotify web player shows an "Open in app" prompt.
 */
function SongCard({ song, index }: { song: Song; index: number }) {
  const [hov, setHov] = useState(false);
  const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(
    `${song.title} ${song.artist}`
  )}`;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        animation: `cardIn 0.45s cubic-bezier(.22,1,.36,1) ${0.08 + index * 0.05}s both`,
      }}
    >
      {/* Left accent edge — transitions to lime glow on hover */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 20,
          bottom: 20,
          width: 3,
          borderRadius: 2,
          background: hov
            ? `linear-gradient(180deg, ${T.accent}, rgba(201,240,107,0.15))`
            : "linear-gradient(180deg, rgba(255,255,255,0.14), transparent)",
          boxShadow: hov ? `0 0 14px ${T.accentGlow}` : "none",
          transition: "all 0.4s ease",
        }}
      />

      <Glass
        style={{
          marginLeft: 16,
          padding: "26px 26px 22px",
          transform: hov ? "translateY(-3px)" : "none",
          borderColor: hov ? T.glassBorderHover : undefined,
          boxShadow: hov ? "0 8px 44px rgba(0,0,0,0.35)" : "none",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontFamily: T.heading,
                fontWeight: 700,
                fontSize: 16,
                color: T.textHi,
                marginBottom: 3,
                lineHeight: 1.35,
                letterSpacing: "-0.01em",
              }}
            >
              {song.title}
            </h3>
            <p
              style={{
                fontFamily: T.mono,
                fontSize: 11.5,
                color: T.textLo,
                fontWeight: 300,
                marginBottom: 14,
                letterSpacing: "0.02em",
              }}
            >
              {song.artist}
            </p>
            <p
              style={{
                fontFamily: T.body,
                fontStyle: "italic",
                fontSize: 14,
                color: T.textMid,
                lineHeight: 1.6,
                fontWeight: 300,
              }}
            >
              {song.explanation}
            </p>
          </div>

          {/* Spotify link — opens web player (auto-redirects to native app on mobile) */}
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flexShrink: 0,
              fontFamily: T.heading,
              fontWeight: 600,
              fontSize: 12,
              color: T.accent,
              textDecoration: "none",
              padding: "8px 18px",
              borderRadius: 50,
              border: `1px solid ${T.accentDim}`,
              background: hov ? T.accentDim : "transparent",
              textShadow: hov ? `0 0 10px ${T.accentGlow}` : "none",
              transition: "all 0.25s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            Spotify ↗
          </a>
        </div>
      </Glass>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  VIEWS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── Home View ───────────────────────────────────────────────────

interface HomeViewProps {
  onSubmit: (mood: string) => void;
  onNav: (view: ViewState) => void;
  loading: boolean;
  /** Called on every keystroke (debounced) to morph the gradient in real-time */
  onMoodType: (text: string) => void;
}

/**
 * Landing screen. Hero title, frosted glass input panel, mood chips,
 * and bottom-left navigation. The `onMoodType` callback drives the
 * real-time gradient morphing as the user types.
 */
function HomeView({ onSubmit, onNav, loading, onMoodType }: HomeViewProps) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const remaining = MAX_CHARS - text.length;

  /** Update text + fire debounced mood detection + auto-resize */
  const handleChange = (val: string) => {
    const clamped = val.slice(0, MAX_CHARS);
    setText(clamped);
    autoResize(inputRef.current, 33, 4);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onMoodType(clamped), 200);
  };

  const submit = () => {
    if (text.trim().length >= 3 && !loading) onSubmit(text.trim());
  };

  const canSubmit = text.trim().length >= 3 && !loading;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "48px 28px",
        position: "relative",
        zIndex: 2,
      }}
    >
      <div style={{ maxWidth: 600, width: "100%", textAlign: "center" }}>
        {/* ── Hero Title ── */}
        <div style={{ animation: "fadeUp 0.8s ease", marginBottom: 52 }}>
          <h1
            style={{
              fontFamily: T.display,
              fontWeight: 800,
              fontSize: "clamp(52px, 13vw, 96px)",
              color: T.textHi,
              lineHeight: 0.95,
              letterSpacing: "-0.05em",
              
            }}
          >
            Vibe
            <br />
            Playlist
          </h1>
        </div>

        {/* ── Input Panel (frosted glass) ── */}
        <Glass
          style={{
            padding: "28px 32px 24px",
            marginBottom: 28,
            animation: "fadeUp 0.8s ease 0.1s both",
            boxShadow: focused
              ? `0 0 60px rgba(201,240,107,0.06), inset 0 0 0 1px rgba(255,255,255,0.12)`
              : "0 4px 32px rgba(0,0,0,0.25)",
            borderColor: focused ? "rgba(255,255,255,0.14)" : undefined,
          }}
        >
          <textarea
            ref={inputRef}
            value={text}
            rows={1}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={loading}
            placeholder="something soft and faraway…"
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              color: T.textHi,
              fontFamily: T.body,
              fontSize: "clamp(17px, 3.5vw, 22px)",
              fontWeight: 400,
              textAlign: "center",
              outline: "none",
              lineHeight: 1.5,
              overflowY: "hidden",
            }}
          />

          {/* Animated accent underline — expands on focus */}
          <div
            style={{
              margin: "16px auto 0",
              height: 2,
              borderRadius: 1,
              width: focused ? "80%" : "30%",
              background: focused
                ? `linear-gradient(90deg, transparent, ${T.accent}, transparent)`
                : `linear-gradient(90deg, transparent, ${T.textLo}40, transparent)`,
              transition: "all 0.6s cubic-bezier(.22,1,.36,1)",
              boxShadow: focused ? `0 0 18px ${T.accentGlow}` : "none",
            }}
          />

          {/* Character limit indicator — visible while typing */}
          {text.length > 0 && (
            <p
              style={{
                fontFamily: T.mono,
                fontSize: 10.5,
                fontWeight: 300,
                marginTop: 10,
                textAlign: "right",
                color:
                  remaining <= 0
                    ? "#f06b6b"
                    : remaining <= 50
                      ? "#e8a838"
                      : T.textLo,
                transition: "color 0.3s ease",
                letterSpacing: "0.02em",
              }}
            >
              {remaining <= 50
                ? `${remaining} Characters Left`
                : `${text.length} / ${MAX_CHARS}`}
            </p>
          )}
        </Glass>

        {/* ── Go Button ── */}
        <div style={{ animation: "fadeUp 0.8s ease 0.2s both", marginBottom: 48 }}>
          <button
            onClick={submit}
            disabled={!canSubmit}
            style={{
              background: T.accent,
              color: "#0a0618",
              fontFamily: T.heading,
              fontWeight: 700,
              fontSize: 15,
              border: "none",
              borderRadius: 50,
              padding: "15px 44px",
              cursor: canSubmit ? "pointer" : "not-allowed",
              opacity: canSubmit ? 1 : 0.2,
              transition: "all 0.3s cubic-bezier(.22,1,.36,1)",
              animation: canSubmit ? "accentBreathe 3s ease-in-out infinite" : "none",
              letterSpacing: "0.02em",
            }}
            onMouseEnter={(e) => {
              if (canSubmit) (e.currentTarget.style.transform = "scale(1.07)");
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Go →
          </button>
        </div>

        {/* ── Mood Chips ── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "4px 8px",
            animation: "fadeUp 0.8s ease 0.32s both",
          }}
        >
          {MOOD_CHIPS.map((w) => (
            <MoodChip
              key={w}
              label={w}
              onClick={() => {
                handleChange(w);
                inputRef.current?.focus();
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Bottom-left navigation ── */}
      <div
        style={{
          position: "fixed",
          bottom: 28,
          left: 28,
          zIndex: 10,
          display: "flex",
          gap: 8,
        }}
      >
        <Nav label="History" onClick={() => onNav(VIEW.HISTORY)} />
        <Nav label="Prefs" onClick={() => onNav(VIEW.PREFS)} />
      </div>
    </div>
  );
}

// ─── Results View ────────────────────────────────────────────────

interface ResultsViewProps {
  playlist: Playlist;
  onNewVibe: (mood: string) => void;
  onNav: (view: ViewState) => void;
  loading: boolean;
  onShare: (playlist: Playlist) => void;
  onRename: (id: string, title: string | null) => void;
}

/** Displays a generated playlist: header with rename, song cards, bottom input */
function ResultsView({
  playlist,
  onNewVibe,
  onNav,
  loading,
  onShare,
  onRename,
}: ResultsViewProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      autoResize(editRef.current, 48, 3);
    }
  }, [editing]);

  const title = playlist.custom_title || playlist.mood_description;

  const commitRename = () => {
    onRename(playlist.id, draft.trim().slice(0, MAX_CHARS) || null);
    setEditing(false);
  };

  const startEditing = () => {
    setDraft(playlist.custom_title || playlist.mood_description);
    setEditing(true);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "28px 24px 140px",
        position: "relative",
        zIndex: 2,
        maxWidth: 660,
        margin: "0 auto",
      }}
    >
      <TopBar
        left={<Nav label="← New Vibe" onClick={() => onNav(VIEW.HOME)} />}
        right={
          <>
            <Nav label="History" onClick={() => onNav(VIEW.HISTORY)} />
            <Nav label="Prefs" onClick={() => onNav(VIEW.PREFS)} />
          </>
        }
      />

      {/* ── Playlist header ── */}
      <div style={{ marginBottom: 44, animation: "fadeUp 0.5s ease 0.06s both" }}>
        {editing ? (
          <textarea
            ref={editRef}
            value={draft}
            rows={1}
            onChange={(e) => {
              setDraft(e.target.value.slice(0, MAX_CHARS));
              autoResize(editRef.current, 48, 3);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitRename(); }
              if (e.key === "Escape") setEditing(false);
            }}
            onBlur={commitRename}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: `1px solid ${T.accent}55`,
              paddingBottom: 8,
              color: T.textHi,
              fontFamily: T.display,
              fontWeight: 700,
              fontSize: "clamp(26px, 6vw, 44px)",
              outline: "none",
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              overflowY: "hidden",
            }}
          />
        ) : (
          <h2
            onClick={startEditing}
            style={{
              fontFamily: T.display,
              fontWeight: 700,
              fontSize: "clamp(26px, 6vw, 44px)",
              color: T.textHi,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
              cursor: "pointer",
            }}
            title="click to rename"
          >
            {title}
          </h2>
        )}

        {/* Show original mood if custom title is set */}
        {playlist.custom_title && (
          <p
            style={{
              fontFamily: T.mono,
              fontSize: 11,
              color: T.textLo,
              fontWeight: 300,
              marginTop: 10,
              fontStyle: "italic",
            }}
          >
            "{playlist.mood_description}"
          </p>
        )}

        {/* Meta row: track count, time, share, rename */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 14,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: T.mono,
              fontSize: 11,
              color: T.textLo,
              fontWeight: 300,
            }}
          >
            {playlist.songs.length} Tracks · {timeAgo(playlist.created_at)}
          </span>
          <Nav label="Share ↗" onClick={() => onShare(playlist)} accent />
          <Nav label="Rename" onClick={startEditing} />
        </div>
      </div>

      {/* ── Song cards ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {playlist.songs.map((s, i) => (
          <SongCard key={`${s.title}-${s.artist}-${i}`} song={s} index={i} />
        ))}
      </div>

      {/* ── "Feel something else?" input ── */}
      <BottomInput onSubmit={onNewVibe} loading={loading} />
    </div>
  );
}

/** Compact input at the bottom of results view for a follow-up query */
function BottomInput({
  onSubmit,
  loading,
}: {
  onSubmit: (mood: string) => void;
  loading: boolean;
}) {
  const [text, setText] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  const go = () => {
    if (text.trim().length >= 3 && !loading) onSubmit(text.trim());
  };

  const canGo = text.trim().length >= 3 && !loading;

  return (
    <Glass style={{ padding: "26px 28px", marginTop: 52 }}>
      <p
        style={{
          fontFamily: T.heading,
          fontWeight: 600,
          fontSize: 13,
          color: T.textLo,
          marginBottom: 14,
          textAlign: "center",
          letterSpacing: "0.02em",
        }}
      >
        Feel Something Else?
      </p>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        <textarea
          ref={taRef}
          value={text}
          rows={1}
          onChange={(e) => {
            setText(e.target.value.slice(0, MAX_CHARS));
            autoResize(taRef.current, 23, 3);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); go(); }
          }}
          placeholder="another vibe…"
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 14,
            padding: "12px 16px",
            color: T.textHi,
            fontFamily: T.body,
            fontSize: 15,
            outline: "none",
            lineHeight: 1.5,
            overflowY: "hidden",
          }}
        />
        <button
          onClick={go}
          disabled={!canGo}
          style={{
            background: T.accent,
            color: "#0a0618",
            fontFamily: T.heading,
            fontWeight: 700,
            fontSize: 14,
            border: "none",
            borderRadius: 14,
            padding: "12px 24px",
            cursor: canGo ? "pointer" : "not-allowed",
            opacity: canGo ? 1 : 0.25,
            boxShadow: `0 0 16px ${T.accent}18`,
          }}
        >
          Go →
        </button>
      </div>
    </Glass>
  );
}

// ─── History View ────────────────────────────────────────────────

interface HistoryViewProps {
  playlists: Playlist[];
  onSelect: (playlist: Playlist) => void;
  onDelete: (id: string) => void;
  onNav: (view: ViewState) => void;
}

/** Reverse-chronological list of all saved playlists */
function HistoryView({ playlists, onSelect, onDelete, onNav }: HistoryViewProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "28px 24px 80px",
        position: "relative",
        zIndex: 2,
        maxWidth: 660,
        margin: "0 auto",
      }}
    >
      <TopBar
        left={<Nav label="← New Vibe" onClick={() => onNav(VIEW.HOME)} />}
        right={<Nav label="Prefs" onClick={() => onNav(VIEW.PREFS)} />}
      />

      <h2
        style={{
          fontFamily: T.display,
          fontWeight: 700,
          fontSize: "clamp(36px, 8vw, 52px)",
          color: T.textHi,
          letterSpacing: "-0.04em",
          marginBottom: 36,
          animation: "fadeUp 0.5s ease 0.06s both",
        }}
      >
        History
      </h2>

      {playlists.length === 0 ? (
        <p
          style={{
            fontFamily: T.body,
            fontStyle: "italic",
            color: T.textLo,
            fontSize: 16,
            animation: "fadeUp 0.5s ease 0.12s both",
          }}
        >
          No playlists yet — go feel something.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {playlists.map((p, i) => (
            <HistoryItem
              key={p.id}
              playlist={p}
              index={i}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Single history row — slides right on hover, × to delete */
function HistoryItem({
  playlist,
  index,
  onSelect,
  onDelete,
}: {
  playlist: Playlist;
  index: number;
  onSelect: (p: Playlist) => void;
  onDelete: (id: string) => void;
}) {
  const [hov, setHov] = useState(false);

  return (
    <Glass
      onClick={() => onSelect(playlist)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "18px 24px",
        cursor: "pointer",
        animation: `cardIn 0.35s ease ${index * 0.04}s both`,
        transform: hov ? "translateX(6px)" : "none",
        borderColor: hov ? T.glassBorderHover : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontFamily: T.heading,
              fontWeight: 600,
              fontSize: 14,
              color: T.textHi,
              marginBottom: 3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {playlist.custom_title || playlist.mood_description}
          </h3>
          <p
            style={{
              fontFamily: T.mono,
              fontSize: 11,
              color: T.textLo,
              fontWeight: 300,
            }}
          >
            {playlist.songs.length} Tracks · {timeAgo(playlist.created_at)}
          </p>
        </div>
        <DeleteBtn
          onClick={(e) => {
            e.stopPropagation();
            onDelete(playlist.id);
          }}
        />
      </div>
    </Glass>
  );
}

/** Delete button — turns red on hover */
function DeleteBtn({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  const [hov, setHov] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "0 0 0 14px",
        color: hov ? "#f06b6b" : T.textLo,
        fontSize: 18,
        lineHeight: 1,
        transition: "color 0.2s",
      }}
      title="delete"
    >
      ×
    </button>
  );
}

// ─── Preferences View ────────────────────────────────────────────

interface PrefsViewProps {
  prefs: UserPreferences;
  onSave: (prefs: UserPreferences) => void;
  onNav: (view: ViewState) => void;
}

/** Settings screen for genre toggles and artist include/exclude lists */
function PrefsView({ prefs, onSave, onNav }: PrefsViewProps) {
  const [genres, setGenres] = useState<string[]>(prefs.preferred_genres);
  const [favs, setFavs] = useState<string[]>(prefs.favorite_artists);
  const [excl, setExcl] = useState<string[]>(prefs.excluded_artists);
  const [favIn, setFavIn] = useState("");
  const [exIn, setExIn] = useState("");

  const toggleGenre = (g: string) =>
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );

  /** Adds an artist name to a list (max 5, no duplicates) */
  const addArtist = (
    list: string[],
    set: React.Dispatch<React.SetStateAction<string[]>>,
    val: string,
    setVal: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const name = val.trim();
    if (name && list.length < 5 && !list.includes(name)) {
      set([...list, name]);
      setVal("");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "28px 24px 80px",
        position: "relative",
        zIndex: 2,
        maxWidth: 660,
        margin: "0 auto",
      }}
    >
      <TopBar
        left={<Nav label="← New Vibe" onClick={() => onNav(VIEW.HOME)} />}
        right={<Nav label="History" onClick={() => onNav(VIEW.HISTORY)} />}
      />

      <h2
        style={{
          fontFamily: T.display,
          fontWeight: 700,
          fontSize: "clamp(36px, 8vw, 52px)",
          color: T.textHi,
          letterSpacing: "-0.04em",
          marginBottom: 36,
          animation: "fadeUp 0.5s ease 0.06s both",
        }}
      >
        Preferences
      </h2>

      {/* Genre toggles */}
      <PrefSection title="Preferred Genres" delay="0.1s">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {GENRE_OPTIONS.map((g) => {
            const on = genres.includes(g);
            return (
              <button
                key={g}
                onClick={() => toggleGenre(g)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 50,
                  cursor: "pointer",
                  border: `1px solid ${on ? T.accent : "rgba(255,255,255,0.14)"}`,
                  background: on ? T.accentDim : "transparent",
                  color: on ? T.accent : T.textLo,
                  fontFamily: T.heading,
                  fontWeight: 600,
                  fontSize: 12,
                  transition: "all 0.25s ease",
                  boxShadow: on ? `0 0 14px ${T.accent}12` : "none",
                }}
              >
                {g}
              </button>
            );
          })}
        </div>
      </PrefSection>

      {/* Favorite artists */}
      <ArtistField
        label="Favorite Artists"
        desc="Used as style anchors"
        items={favs}
        val={favIn}
        onVal={setFavIn}
        onAdd={() => addArtist(favs, setFavs, favIn, setFavIn)}
        onRemove={(a) => setFavs((p) => p.filter((x) => x !== a))}
        delay="0.16s"
      />

      {/* Excluded artists */}
      <ArtistField
        label="Excluded Artists"
        desc="Never recommended"
        items={excl}
        val={exIn}
        onVal={setExIn}
        onAdd={() => addArtist(excl, setExcl, exIn, setExIn)}
        onRemove={(a) => setExcl((p) => p.filter((x) => x !== a))}
        delay="0.2s"
      />

      {/* Save button */}
      <button
        onClick={() =>
          onSave({
            preferred_genres: genres,
            favorite_artists: favs,
            excluded_artists: excl,
          })
        }
        style={{
          background: T.accent,
          color: "#0a0618",
          fontFamily: T.heading,
          fontWeight: 700,
          fontSize: 14,
          border: "none",
          borderRadius: 50,
          padding: "14px 44px",
          cursor: "pointer",
          boxShadow: `0 0 28px ${T.accentGlow}`,
          animation: "fadeUp 0.5s ease 0.26s both",
          letterSpacing: "0.02em",
        }}
      >
        Save Preferences
      </button>
    </div>
  );
}

/** Labeled section wrapper for the preferences view */
function PrefSection({
  title,
  delay,
  children,
}: {
  title: string;
  delay: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 36, animation: `fadeUp 0.5s ease ${delay} both` }}>
      <p
        style={{
          fontFamily: T.heading,
          fontWeight: 600,
          fontSize: 11,
          color: T.textLo,
          marginBottom: 14,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

/** Reusable artist input + tag list (used for favs and exclusions) */
function ArtistField({
  label,
  desc,
  items,
  val,
  onVal,
  onAdd,
  onRemove,
  delay,
}: {
  label: string;
  desc: string;
  items: string[];
  val: string;
  onVal: (v: string) => void;
  onAdd: () => void;
  onRemove: (artist: string) => void;
  delay: string;
}) {
  return (
    <PrefSection title={label} delay={delay}>
      <p
        style={{
          fontFamily: T.mono,
          fontSize: 11,
          color: T.textLo,
          fontWeight: 300,
          marginBottom: 12,
          marginTop: -8,
        }}
      >
        {desc} · max 5
      </p>

      {/* Input row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={val}
          onChange={(e) => onVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          placeholder="artist name…"
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 12,
            padding: "10px 14px",
            color: T.textHi,
            fontFamily: T.body,
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          onClick={onAdd}
          disabled={items.length >= 5 || !val.trim()}
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 12,
            padding: "10px 18px",
            color: T.textHi,
            fontFamily: T.heading,
            fontSize: 14,
            cursor: "pointer",
            opacity: items.length >= 5 || !val.trim() ? 0.2 : 1,
          }}
        >
          +
        </button>
      </div>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((a) => (
          <span
            key={a}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 50,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              fontFamily: T.mono,
              fontSize: 12,
              color: T.textHi,
              fontWeight: 300,
            }}
          >
            {a}
            <button
              onClick={() => onRemove(a)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: T.textLo,
                fontSize: 13,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </PrefSection>
  );
}

// ─── Shared View ─────────────────────────────────────────────────

/** Read-only view for playlists opened via a shared URL */
function SharedView({
  data,
  onNav,
}: {
  data: SharedPayload;
  onNav: (view: ViewState) => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "28px 24px 120px",
        position: "relative",
        zIndex: 2,
        maxWidth: 660,
        margin: "0 auto",
      }}
    >
      <div style={{ marginBottom: 44, animation: "fadeUp 0.5s ease" }}>
        <h2
          style={{
            fontFamily: T.display,
            fontWeight: 700,
            fontSize: "clamp(28px, 6vw, 50px)",
            color: T.textHi,
            lineHeight: 1.1,
            letterSpacing: "-0.04em",
            marginBottom: 10,
          }}
        >
          {data.mood}
        </h2>
        <p
          style={{
            fontFamily: T.mono,
            fontSize: 11,
            color: T.textLo,
            fontWeight: 300,
          }}
        >
          Shared Playlist · {data.songs?.length ?? 0} Tracks
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {data.songs?.map((s, i) => (
          <SongCard key={`${s.title}-${i}`} song={s} index={i} />
        ))}
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: 52,
          animation: "fadeUp 0.5s ease 0.3s both",
        }}
      >
        <button
          onClick={() => onNav(VIEW.HOME)}
          style={{
            background: T.accent,
            color: "#0a0618",
            fontFamily: T.heading,
            fontWeight: 700,
            fontSize: 15,
            border: "none",
            borderRadius: 50,
            padding: "15px 44px",
            cursor: "pointer",
            boxShadow: `0 0 28px ${T.accentGlow}`,
            letterSpacing: "0.02em",
          }}
        >
          Create Your Own Vibe
        </button>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PERSISTENT STORAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Thin wrappers around `window.storage` (artifact persistent storage).
 * All values are JSON-stringified on write and parsed on read.
 * Errors are caught silently — storage is best-effort.
 */

async function sGet<T>(key: string): Promise<T | null> {
  try {
    const result = await window.storage.get(key);
    return result ? (JSON.parse(result.value) as T) : null;
  } catch {
    return null;
  }
}

async function sSet(key: string, value: unknown): Promise<void> {
  try {
    await window.storage.set(key, JSON.stringify(value));
  } catch {}
}

async function sDel(key: string): Promise<void> {
  try {
    await window.storage.delete(key);
  } catch {}
}

/** Saves a playlist to storage (adds to index + writes data) */
async function savePlaylist(playlist: Playlist): Promise<void> {
  const index = (await sGet<string[]>("playlist_index")) ?? [];
  if (!index.includes(playlist.id)) index.unshift(playlist.id);
  await sSet("playlist_index", index);
  await sSet(`playlist:${playlist.id}`, playlist);
}

/** Loads all playlists in index order (reverse chronological) */
async function loadPlaylists(): Promise<Playlist[]> {
  const index = (await sGet<string[]>("playlist_index")) ?? [];
  const playlists: Playlist[] = [];
  for (const id of index) {
    const p = await sGet<Playlist>(`playlist:${id}`);
    if (p) playlists.push(p);
  }
  return playlists;
}

/** Deletes a playlist from storage + removes from index */
async function delPlaylist(id: string): Promise<void> {
  const index = (await sGet<string[]>("playlist_index")) ?? [];
  await sSet(
    "playlist_index",
    index.filter((i) => i !== id)
  );
  await sDel(`playlist:${id}`);
}

/** Partially updates a stored playlist (e.g., rename) */
async function patchPlaylist(
  id: string,
  patch: Partial<Playlist>
): Promise<void> {
  const existing = await sGet<Playlist>(`playlist:${id}`);
  if (existing) await sSet(`playlist:${id}`, { ...existing, ...patch });
}

async function loadPrefs(): Promise<UserPreferences> {
  return (
    (await sGet<UserPreferences>("user_preferences")) ?? {
      preferred_genres: [],
      favorite_artists: [],
      excluded_artists: [],
    }
  );
}

async function savePrefs(prefs: UserPreferences): Promise<void> {
  await sSet("user_preferences", prefs);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LLM INTEGRATION (Claude API)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Builds the system prompt for the Claude Messages API.
 * Dynamically appends user preference context (genres, liked/excluded artists)
 * when available.
 */
function buildSystemPrompt(prefs: UserPreferences | null): string {
  let extra = "";

  if (prefs?.preferred_genres?.length) {
    extra += `\nPreferred genres (bias toward): ${prefs.preferred_genres.join(", ")}.`;
  }
  if (prefs?.favorite_artists?.length) {
    extra += `\nFavorite artists (style anchors, don't exclusively pick these): ${prefs.favorite_artists.join(", ")}.`;
  }
  if (prefs?.excluded_artists?.length) {
    extra += `\nEXCLUDED (never recommend): ${prefs.excluded_artists.join(", ")}.`;
  }

  return `You are an emotionally intelligent music curator with encyclopedic knowledge spanning every genre, decade, and culture. Given a mood description, return 10 song recommendations as a JSON array.

Each object must have: {"title":"...","artist":"...","explanation":"1-2 sentences citing specific musical qualities — tempo, instrumentation, vocal texture, lyrical themes, production style. No generic filler."}

Rules:
- Return ONLY a valid JSON array. No markdown, no backticks, no surrounding text.
- 8-12 songs. Max 2 per artist. Mix well-known with deep cuts. Span genres.
- Interpret vague or short inputs generously and creatively.${extra}`;
}

/**
 * Calls the Anthropic Messages API to generate song recommendations.
 *
 * @param mood  - User's free-form mood description
 * @param prefs - Optional user preferences for genre/artist biasing
 * @returns Array of Song objects parsed from the LLM's JSON response
 * @throws If the API call fails or response isn't valid JSON
 */
async function fetchSongs(
  mood: string,
  prefs: UserPreferences | null
): Promise<Song[]> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 1000,
      system: buildSystemPrompt(prefs),
      messages: [{ role: "user", content: `My mood: "${mood}"` }],
      output_config: { effort: "low" },
    }),
  });

  const data = await response.json();
  const raw = (data.content ?? [])
    .map((block: { text?: string }) => block.text ?? "")
    .join("");

  // Strip any accidental markdown fences and parse
  return JSON.parse(raw.replace(/```json|```/g, "").trim()) as Song[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SHARE URL ENCODING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Encodes a playlist as a base64 URL hash (no server required) */
function encodeShareURL(playlist: Playlist): string {
  const payload: SharedPayload = {
    mood: playlist.mood_description,
    songs: playlist.songs,
  };
  const encoded = btoa(
    unescape(encodeURIComponent(JSON.stringify(payload)))
  );
  return `${location.origin}${location.pathname}#shared=${encoded}`;
}

/** Decodes a shared playlist from a URL hash fragment */
function decodeShareURL(hash: string): SharedPayload | null {
  try {
    const encoded = hash.replace("#shared=", "");
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json) as SharedPayload;
  } catch {
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  UTILITIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Formats an ISO timestamp as a human-readable relative time string */
function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * Auto-resizes a textarea to fit its content, capped at maxRows.
 * Resets height to 'auto' first to shrink if content was deleted,
 * then clamps scrollHeight to maxRows × lineHeight.
 */
function autoResize(el: HTMLTextAreaElement | null, lineHeightPx: number, maxRows: number): void {
  if (!el) return;
  el.style.height = "auto";
  const maxH = lineHeightPx * maxRows;
  el.style.height = Math.min(el.scrollHeight, maxH) + "px";
  el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
}

/** Generates a short unique ID (timestamp base36 + random suffix) */
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * Copies text to clipboard with fallback for restricted environments.
 * Tries navigator.clipboard first, falls back to a hidden textarea +
 * execCommand('copy') for sandboxed iframes where the Clipboard API
 * is blocked by permissions policy.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern API first
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback: hidden textarea + execCommand
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ROOT APPLICATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Main application component. Manages global state:
 *  - View routing (home → results → history → prefs → shared)
 *  - Mood palette (drives gradient morphing)
 *  - Playlist CRUD (via persistent storage)
 *  - User preferences
 *  - Toast notifications
 */
export default function App() {
  const [view, setView] = useState<ViewState>(VIEW.HOME);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<Playlist | null>(null);
  const [all, setAll] = useState<Playlist[]>([]);
  const [prefs, setPrefs] = useState<UserPreferences>({
    preferred_genres: [],
    favorite_artists: [],
    excluded_artists: [],
  });
  const [toast, setToast] = useState({ visible: false, msg: "" });
  const [mood, setMood] = useState("default");
  const [intense, setIntense] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState<SharedPayload | null>(null);

  const flash = useCallback((msg: string) => {
    setToast({ visible: true, msg });
  }, []);

  // ── Initialization: load persisted data + check for shared URL ──
  useEffect(() => {
    (async () => {
      const [playlists, userPrefs] = await Promise.all([
        loadPlaylists(),
        loadPrefs(),
      ]);
      setAll(playlists);
      setPrefs(userPrefs);

      // Check for shared playlist in URL hash
      if (location.hash.startsWith("#shared=")) {
        const decoded = decodeShareURL(location.hash);
        if (decoded) {
          setShared(decoded);
          setMood(detectMood(decoded.mood ?? ""));
          setView(VIEW.SHARED);
        } else {
          flash("Couldn't Decode Shared Playlist");
        }
      }
    })();
  }, [flash]);

  /**
   * Real-time mood detection callback — called on every keystroke
   * (debounced 200ms in HomeView). Updates the gradient palette
   * without submitting a query.
   */
  const handleMoodType = useCallback((text: string) => {
    setMood(detectMood(text));
  }, []);

  /**
   * Submit a mood description: set gradient, call LLM, save result.
   * On success, navigates to results view. On failure, shows error
   * with retry option.
   */
  const submit = async (moodText: string) => {
    setError(null);
    setLoading(true);
    setMood(detectMood(moodText));
    setIntense(true);
    setView(VIEW.RESULTS);

    const shell: Playlist = {
      id: uid(),
      mood_description: moodText,
      custom_title: null,
      created_at: new Date().toISOString(),
      songs: [],
    };
    setCurrent(shell);

    try {
      const songs = await fetchSongs(moodText, prefs);
      const playlist: Playlist = {
        ...shell,
        songs: Array.isArray(songs) ? songs : [],
      };

      if (!playlist.songs.length) {
        setError("No songs matched — try a different vibe.");
        return;
      }

      setCurrent(playlist);
      await savePlaylist(playlist);
      setAll((prev) => [playlist, ...prev.filter((p) => p.id !== playlist.id)]);
    } catch (e) {
      console.error("LLM fetch error:", e);
      setError("Something went wrong. Let's try that again.");
    } finally {
      setLoading(false);
      setIntense(false);
    }
  };

  // ── Action handlers ──

  const share = useCallback(
    (playlist: Playlist) => {
      const url = encodeShareURL(playlist);
      copyToClipboard(url).then(
        (ok) => flash(ok ? "Link Copied ✓" : "Couldn't Copy Link")
      );
    },
    [flash]
  );

  const rename = useCallback(
    (id: string, title: string | null) => {
      // Optimistic: update UI immediately, persist in background
      const update = (list: Playlist[]) =>
        list.map((p) => (p.id === id ? { ...p, custom_title: title } : p));
      setAll(update);
      setCurrent((p) => (p?.id === id ? { ...p, custom_title: title } : p));
      flash("Renamed ✓");
      patchPlaylist(id, { custom_title: title });
    },
    [flash]
  );

  const remove = useCallback(
    (id: string) => {
      // Optimistic: update UI immediately, persist in background
      setAll((prev) => prev.filter((p) => p.id !== id));
      flash("Deleted");
      delPlaylist(id);
    },
    [flash]
  );

  const saveUserPrefs = useCallback(
    (newPrefs: UserPreferences) => {
      // Optimistic: update state + navigate immediately, persist in background
      setPrefs(newPrefs);
      setView(VIEW.HOME);
      flash("Preferences Saved ✓");
      savePrefs(newPrefs);
    },
    [flash]
  );

  /** Navigate to a view + reset gradient on home */
  const nav = useCallback((target: ViewState) => {
    setView(target);
    if (target === VIEW.HOME) setMood("default");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /** Open a playlist from history */
  const selectPlaylist = useCallback((playlist: Playlist) => {
    setCurrent(playlist);
    setMood(detectMood(playlist.mood_description));
    setView(VIEW.RESULTS);
  }, []);

  // ── Render ──

  return (
    <>
      <InjectCSS />
      <AuroraBackground mood={mood} intensify={intense} />
      <Grain />

      {/* Home */}
      {view === VIEW.HOME && (
        <HomeView
          onSubmit={submit}
          onNav={nav}
          loading={loading}
          onMoodType={handleMoodType}
        />
      )}

      {/* Results (loading / error / playlist) */}
      {view === VIEW.RESULTS &&
        (loading ? (
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              position: "relative",
              zIndex: 2,
            }}
          >
            <Loader />
          </div>
        ) : error ? (
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 2,
              padding: 24,
            }}
          >
            <p
              style={{
                fontFamily: T.body,
                fontStyle: "italic",
                color: T.textMid,
                fontSize: 18,
                marginBottom: 28,
                textAlign: "center",
              }}
            >
              {error}
            </p>
            <button
              onClick={() => current && submit(current.mood_description)}
              style={{
                background: T.accent,
                color: "#0a0618",
                fontFamily: T.heading,
                fontWeight: 700,
                fontSize: 14,
                border: "none",
                borderRadius: 50,
                padding: "12px 34px",
                cursor: "pointer",
                boxShadow: `0 0 24px ${T.accentGlow}`,
                marginBottom: 14,
              }}
            >
              Retry
            </button>
            <Nav label="← Try a Different Vibe" onClick={() => nav(VIEW.HOME)} />
          </div>
        ) : current ? (
          <ResultsView
            playlist={current}
            onNewVibe={submit}
            onNav={nav}
            loading={loading}
            onShare={share}
            onRename={rename}
          />
        ) : null)}

      {/* History */}
      {view === VIEW.HISTORY && (
        <HistoryView
          playlists={all}
          onSelect={selectPlaylist}
          onDelete={remove}
          onNav={nav}
        />
      )}

      {/* Preferences */}
      {view === VIEW.PREFS && (
        <PrefsView prefs={prefs} onSave={saveUserPrefs} onNav={nav} />
      )}

      {/* Shared (read-only) */}
      {view === VIEW.SHARED && shared && (
        <SharedView data={shared} onNav={nav} />
      )}

      {/* Toast notifications */}
      <Toast
        message={toast.msg}
        visible={toast.visible}
        onDone={() => setToast({ visible: false, msg: "" })}
      />
    </>
  );
}
