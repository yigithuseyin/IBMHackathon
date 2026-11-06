/* Ev the robot maid mascot — inline SVG component */
/* Faithfully recreated from the mascot: round white head with dark visor,
   glowing eyes/smile, maid cap, apron dress, robot arms, unicycle wheel */

export default function Ev({ size = 120, mood = "happy", className = "" }) {
  // mood: "happy" | "cheer" | "idle"
  const eyeGlow = mood === "cheer" ? "#ffe066" : "#00e5ff";
  const smileD = mood === "idle"
    ? "M 38 62 Q 50 66 62 62"   // slight smile
    : "M 36 60 Q 50 72 64 60";  // big smile

  return (
    <svg
      className={className}
      width={size}
      height={size * 1.35}
      viewBox="0 0 100 135"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Wheel ── */}
      <ellipse cx="50" cy="124" rx="14" ry="9" fill="#1a1a2e" stroke="#3a4470" strokeWidth="1.5" />
      <ellipse cx="50" cy="122" rx="12" ry="7" fill="#222640" stroke="#4a5490" strokeWidth="1" />
      <ellipse cx="50" cy="122" rx="5" ry="3.5" fill="#2a3050" stroke="#5a6490" strokeWidth="1" />

      {/* ── Body / dress ── */}
      {/* Dark skirt */}
      <path d="M 34 86 Q 28 110 35 120 Q 50 125 65 120 Q 72 110 66 86 Z"
        fill="#2a2d42" stroke="#3a4060" strokeWidth="1.2" />
      {/* White apron front */}
      <path d="M 38 76 Q 36 96 40 112 Q 50 116 60 112 Q 64 96 62 76 Q 56 72 50 72 Q 44 72 38 76 Z"
        fill="#dde8f0" stroke="#aab8c8" strokeWidth="1" />
      {/* Body torso */}
      <rect x="38" y="68" width="24" height="20" rx="8" fill="#d0dae6" stroke="#9aaabb" strokeWidth="1" />
      {/* Chest panel lines */}
      <line x1="44" y1="72" x2="44" y2="82" stroke="#8899aa" strokeWidth="1" strokeLinecap="round" />
      <line x1="50" y1="72" x2="50" y2="82" stroke="#8899aa" strokeWidth="1" strokeLinecap="round" />
      <line x1="56" y1="72" x2="56" y2="82" stroke="#8899aa" strokeWidth="1" strokeLinecap="round" />

      {/* ── Left arm (holding duster) ── */}
      <circle cx="37" cy="76" r="3.5" fill="#c0cad6" stroke="#9aaabb" strokeWidth="1" />
      <line x1="37" y1="76" x2="22" y2="62" stroke="#b0bac6" strokeWidth="3" strokeLinecap="round" />
      <circle cx="22" cy="62" r="3" fill="#c0cad6" stroke="#9aaabb" strokeWidth="1" />
      {/* Gripper claw */}
      <rect x="17" y="57" width="9" height="6" rx="2" fill="#888fa0" stroke="#5a6070" strokeWidth="1" />
      {/* Duster stick */}
      <line x1="21" y1="57" x2="14" y2="40" stroke="#7a5c3a" strokeWidth="2" strokeLinecap="round" />
      {/* Duster fluff (heart shaped) */}
      <path d="M 8 32 Q 5 26 10 24 Q 14 22 14 28 Q 14 22 18 24 Q 23 26 20 32 Q 16 38 14 40 Q 12 38 8 32 Z"
        fill="#e8dcc8" stroke="#c8b898" strokeWidth="1" />
      {/* Duster accent lines */}
      <path d="M 10 29 Q 14 32 18 29" stroke="#b8a888" strokeWidth=".8" fill="none" />
      <path d="M 9 33 Q 14 36 19 33" stroke="#b8a888" strokeWidth=".8" fill="none" />

      {/* ── Right arm (dangling) ── */}
      <circle cx="63" cy="76" r="3.5" fill="#c0cad6" stroke="#9aaabb" strokeWidth="1" />
      <line x1="63" y1="76" x2="76" y2="90" stroke="#b0bac6" strokeWidth="3" strokeLinecap="round" />
      <circle cx="76" cy="90" r="3" fill="#c0cad6" stroke="#9aaabb" strokeWidth="1" />
      {/* C-shaped right hand */}
      <path d="M 72 90 Q 68 96 74 100 Q 80 96 78 90" fill="none" stroke="#888fa0" strokeWidth="2.5" strokeLinecap="round" />

      {/* ── Head — outer shell ── */}
      <ellipse cx="50" cy="42" rx="24" ry="26" fill="#d8e2ec" stroke="#a8b8c8" strokeWidth="1.5" />

      {/* ── Side eye/sensor (right side) ── */}
      <ellipse cx="71" cy="40" rx="5" ry="5.5" fill="#5ab8c8" stroke="#3a8898" strokeWidth="1" opacity="0.85" />
      <ellipse cx="71" cy="40" rx="3" ry="3.5" fill="#80d8e8" opacity="0.6" />

      {/* ── Maid cap ── */}
      {/* Cap ruffle base */}
      <ellipse cx="50" cy="20" rx="22" ry="6" fill="#f0f4f8" stroke="#c8d4e0" strokeWidth="1" />
      {/* Ruffle bumps */}
      {[34,38,42,46,50,54,58,62,66].map((x, i) => (
        <ellipse key={i} cx={x} cy="17" rx="3.5" ry="4" fill="#f0f4f8" stroke="#c8d4e0" strokeWidth="1" />
      ))}

      {/* ── Visor (dark face shield) ── */}
      <ellipse cx="50" cy="45" rx="18" ry="20" fill="#0d1020" stroke="#1e2840" strokeWidth="1.5" />
      {/* Visor shine / reflection */}
      <path d="M 37 32 Q 44 28 52 30 Q 56 31 58 34" stroke="rgba(255,255,255,.18)" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* ── Eyes ── */}
      {/* Left eye */}
      <rect x="35" y="42" width="12" height="8" rx="2" fill={eyeGlow} opacity="0.9" />
      <rect x="36" y="43.5" width="10" height="2" rx="1" fill="rgba(0,0,0,.35)" />
      <rect x="36" y="46.5" width="10" height="2" rx="1" fill="rgba(0,0,0,.35)" />
      {/* Left eye glow */}
      <rect x="35" y="42" width="12" height="8" rx="2" fill={eyeGlow} opacity="0.15"
        style={{ filter: `blur(3px)` }} />

      {/* Right eye */}
      <rect x="53" y="42" width="12" height="8" rx="2" fill={eyeGlow} opacity="0.9" />
      <rect x="54" y="43.5" width="10" height="2" rx="1" fill="rgba(0,0,0,.35)" />
      <rect x="54" y="46.5" width="10" height="2" rx="1" fill="rgba(0,0,0,.35)" />

      {/* ── Smile ── */}
      <path d={smileD} stroke={eyeGlow} strokeWidth="2.2" strokeLinecap="round" fill="none"
        style={{ filter: `drop-shadow(0 0 4px ${eyeGlow})` }} />

      {/* Mood cheer sparkles */}
      {mood === "cheer" && (
        <>
          <text x="80" y="28" fontSize="10" fill="#ffe066" opacity="0.9">✦</text>
          <text x="12" y="30" fontSize="8"  fill="#00e5ff" opacity="0.8">✦</text>
          <text x="78" y="55" fontSize="7"  fill="#b06aff" opacity="0.8">✦</text>
        </>
      )}
    </svg>
  );
}
