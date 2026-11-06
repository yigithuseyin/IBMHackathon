import { useState } from "react";
import { households, currentUser } from "../data/mockData";
import Ev from "../components/Ev";

const avatarColors = ["#00b8cc", "#00c8a0", "#b06aff", "#ff9600", "#ff4f6d", "#ffe066"];
const colorFor = (id) => avatarColors[id.charCodeAt(id.length - 1) % avatarColors.length];

const rankLabels = { rookie: "Dust Bunny", bronze: "Tidy Helper", silver: "Clean Machine", gold: "Home Champion", diamond: "Grand Caretaker" };
const rankClass  = { rookie: "rank-rookie", bronze: "rank-bronze", silver: "rank-silver", gold: "rank-gold", diamond: "rank-diamond" };
const PERIODS = ["Weekly", "Monthly", "All-Time"];

function getMedal(pos) {
  if (pos === 0) return { icon: "🥇", color: "#FFD700", glow: "rgba(255,215,0,.3)" };
  if (pos === 1) return { icon: "🥈", color: "#C0C0C0", glow: "rgba(192,192,192,.2)" };
  if (pos === 2) return { icon: "🥉", color: "#CD7F32", glow: "rgba(205,127,50,.2)" };
  return null;
}

export default function Leaderboard() {
  const [householdIdx, setHouseholdIdx] = useState(0);
  const [period, setPeriod] = useState("Weekly");

  const myHouseholds = households.filter((h) => h.members.some((m) => m.id === currentUser.id));
  const household = myHouseholds[householdIdx];
  const sorted = [...(household?.members ?? [])].sort((a, b) => b.xp - a.xp);
  const myPos = sorted.findIndex((m) => m.id === currentUser.id);

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div className="page-title">Leaderboard</div>
          <div className="page-subtitle">Who's keeping it clean?</div>
        </div>
        <Ev size={60} mood="happy" />
      </div>

      {/* Household tabs */}
      {myHouseholds.length > 1 && (
        <div style={{ display: "flex", gap: 4, background: "var(--surface2)", borderRadius: 14, padding: 4, marginBottom: 14 }}>
          {myHouseholds.map((h, i) => (
            <button
              key={h.id}
              onClick={() => setHouseholdIdx(i)}
              style={{
                flex: 1, padding: "9px 4px", border: "none", borderRadius: 10,
                fontFamily: "inherit", fontWeight: 800, fontSize: 12, cursor: "pointer",
                background: householdIdx === i ? "var(--surface)" : "transparent",
                color: householdIdx === i ? "var(--text)" : "var(--muted)",
                boxShadow: householdIdx === i ? "var(--shadow)" : "none",
                transition: "all .15s",
              }}
            >
              {h.emoji} {h.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {/* Period tabs */}
      <div style={{ display: "flex", gap: 4, background: "var(--surface2)", borderRadius: 14, padding: 4, marginBottom: 28 }}>
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              flex: 1, padding: "9px 4px", border: "none", borderRadius: 10,
              fontFamily: "inherit", fontWeight: 800, fontSize: 12, cursor: "pointer",
              background: period === p ? "var(--cyan)" : "transparent",
              color: period === p ? "#001a22" : "var(--muted)",
              transition: "all .15s",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Podium */}
      {sorted.length >= 3 && (
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 10, marginBottom: 32, padding: "0 4px" }}>
          <PodiumBlock member={sorted[1]} pos={1} height={90} />
          <PodiumBlock member={sorted[0]} pos={0} height={116} />
          <PodiumBlock member={sorted[2]} pos={2} height={72} />
        </div>
      )}

      {/* Full list */}
      <div className="section-header">Full Rankings</div>
      {sorted.map((member, i) => {
        const medal = getMedal(i);
        const isMe = member.id === currentUser.id;
        return (
          <div
            key={member.id}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px", borderRadius: 14, marginBottom: 8,
              background: isMe ? "rgba(0,229,255,.07)" : "var(--surface)",
              border: isMe ? "1.5px solid var(--cyan-dim)" : "1.5px solid var(--border)",
              boxShadow: isMe ? "0 0 12px rgba(0,229,255,.12)" : "none",
            }}
          >
            {/* Position */}
            <div style={{
              width: 28, textAlign: "center",
              fontWeight: 900, fontSize: 16,
              color: medal ? medal.color : "var(--muted)",
              textShadow: medal ? `0 0 10px ${medal.glow}` : "none",
            }}>
              {medal ? medal.icon : `#${i + 1}`}
            </div>

            {/* Avatar */}
            <div className="avatar" style={{ background: colorFor(member.id), boxShadow: isMe ? "0 0 10px rgba(0,229,255,.3)" : "none" }}>
              {member.avatar}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>
                {member.name}
                {isMe && <span style={{ color: "var(--cyan)", fontSize: 11, marginLeft: 6 }}>(You)</span>}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                <span className={`rank-badge ${rankClass[member.rank]}`}>{rankLabels[member.rank]}</span>
                <span className="streak-pill" style={{ fontSize: 10, padding: "1px 8px" }}>🔥 {member.streak}</span>
              </div>
            </div>

            {/* XP */}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: "var(--yellow)" }}>
                {member.xp.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>XP</div>
            </div>
          </div>
        );
      })}

      {/* Sticky my-position hint */}
      {myPos > 4 && (
        <div style={{
          position: "sticky", bottom: 100,
          background: "linear-gradient(135deg, var(--cyan), var(--teal))",
          color: "#001a22", borderRadius: 14, padding: "10px 16px",
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 4px 20px rgba(0,229,255,.35)",
        }}>
          <span style={{ fontWeight: 800, fontFamily: "'Orbitron', sans-serif", fontSize: 12 }}>
            YOUR POSITION: #{myPos + 1}
          </span>
          <span style={{ marginLeft: "auto", fontWeight: 900, fontSize: 16 }}>
            ⭐ {sorted[myPos]?.xp.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}

function PodiumBlock({ member, pos, height }) {
  const medal = getMedal(pos);
  const c = medal.color;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
      {pos === 0 && <div style={{ fontSize: 20, marginBottom: 4, filter: "drop-shadow(0 0 6px #FFD700)" }}>👑</div>}

      <div
        className="avatar"
        style={{
          background: colorFor(member.id),
          border: `2.5px solid ${c}`,
          boxShadow: `0 0 14px ${medal.glow}`,
          width: pos === 0 ? 54 : 42,
          height: pos === 0 ? 54 : 42,
          fontSize: pos === 0 ? 18 : 13,
          marginBottom: 6,
        }}
      >
        {member.avatar}
      </div>

      <div style={{ fontWeight: 800, fontSize: 11, color: "var(--text)", textAlign: "center", marginBottom: 2 }}>
        {member.name.split(" ")[0]}
      </div>
      <div style={{ fontWeight: 900, fontSize: 12, color: "var(--yellow)", marginBottom: 6 }}>
        ⭐ {member.xp.toLocaleString()}
      </div>

      {/* Podium platform */}
      <div style={{
        width: "100%", height,
        background: `linear-gradient(180deg, ${c}22, ${c}55)`,
        borderRadius: "10px 10px 0 0",
        border: `1.5px solid ${c}55`,
        borderBottom: "none",
        display: "flex", alignItems: "flex-start",
        justifyContent: "center", paddingTop: 10,
        fontWeight: 900, fontSize: pos === 0 ? 22 : 16,
        boxShadow: `0 0 16px ${medal.glow}`,
      }}>
        {medal.icon}
      </div>
    </div>
  );
}
