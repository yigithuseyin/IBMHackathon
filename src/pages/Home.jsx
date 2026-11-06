import { useNavigate } from "react-router-dom";
import { households, currentUser } from "../data/mockData";
import Ev from "../components/Ev";

const avatarColors = ["#00b8cc", "#00c8a0", "#b06aff", "#ff9600", "#ff4f6d", "#ffe066"];
const colorFor = (id) => avatarColors[id.charCodeAt(id.length - 1) % avatarColors.length];

export default function Home() {
  const navigate = useNavigate();
  const myHouseholds = households.filter((h) =>
    h.members.some((m) => m.id === currentUser.id)
  );

  return (
    <div className="page-content">
      {/* ── Hero header ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0d1a2e 0%, #131e35 60%, #1a1030 100%)",
          border: "1.5px solid var(--border-hi)",
          borderRadius: 20,
          padding: "20px 16px 16px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 16,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid lines bg */}
        <div style={{
          position: "absolute", inset: 0, opacity: .07,
          backgroundImage: "linear-gradient(var(--cyan) 1px, transparent 1px), linear-gradient(90deg, var(--cyan) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          borderRadius: 20,
        }} />

        <Ev size={88} mood="happy" />

        <div style={{ flex: 1, position: "relative" }}>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 20, fontWeight: 900,
            color: "#fff", letterSpacing: ".05em", marginBottom: 2,
          }}>
            ChoreQuest
          </div>
          <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 10 }}>
            Hey {currentUser.name.split(" ")[0]}! Ev is ready 🤖
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="streak-pill">🔥 {currentUser.streak} streak</span>
            <span className="xp-pill">⭐ {currentUser.xp.toLocaleString()} XP</span>
          </div>
        </div>
      </div>

      {/* ── My Households ── */}
      <div className="section-header">My Households</div>

      {myHouseholds.map((h) => {
        const isAdmin = h.adminId === currentUser.id;
        const myEntry = h.members.find((m) => m.id === currentUser.id);
        const pendingCount = h.chores.filter(
          (c) => !c.completedBy && (c.assignedTo === currentUser.id || c.assignedTo === "anyone")
        ).length;
        const myRank = [...h.members].sort((a, b) => b.xp - a.xp)
          .findIndex((m) => m.id === currentUser.id) + 1;

        return (
          <div
            key={h.id}
            className="card card-pressable"
            onClick={() => navigate(`/household/${h.id}`)}
            style={isAdmin ? { borderColor: "var(--cyan-dim)", boxShadow: "0 0 14px rgba(0,229,255,.15)" } : {}}
          >
            {/* Top row */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{
                fontSize: 34, width: 52, height: 52,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "var(--surface2)", borderRadius: 14,
                border: "1.5px solid var(--border-hi)",
              }}>
                {h.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text)" }}>{h.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  {h.memberCount} members · {h.chores.length} chores
                </div>
              </div>
              {isAdmin && (
                <span style={{
                  background: "rgba(0,229,255,.12)", color: "var(--cyan)",
                  border: "1px solid rgba(0,229,255,.35)",
                  fontSize: 10, fontWeight: 800,
                  padding: "3px 10px", borderRadius: 99,
                  textTransform: "uppercase", letterSpacing: ".06em",
                  fontFamily: "'Orbitron', sans-serif",
                }}>
                  Admin
                </span>
              )}
            </div>

            {/* Member avatars */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
              {h.members.slice(0, 4).map((m, i) => (
                <div
                  key={m.id}
                  className="avatar avatar-sm"
                  style={{
                    background: colorFor(m.id),
                    marginLeft: i === 0 ? 0 : -10,
                    border: "2px solid var(--surface)",
                    zIndex: 4 - i,
                  }}
                  title={m.name}
                >
                  {m.avatar}
                </div>
              ))}
              {h.members.length > 4 && (
                <div className="avatar avatar-sm"
                  style={{ background: "var(--surface2)", color: "var(--text-dim)", marginLeft: -10, border: "2px solid var(--surface)" }}>
                  +{h.members.length - 4}
                </div>
              )}
            </div>

            {/* Stats row */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8, paddingTop: 12,
              borderTop: "1px solid var(--border)",
            }}>
              {[
                {
                  label: "Pending",
                  value: pendingCount,
                  color: pendingCount > 0 ? "var(--yellow)" : "var(--green)",
                  bg: pendingCount > 0 ? "rgba(255,224,102,.08)" : "rgba(57,224,122,.08)",
                },
                {
                  label: "Your XP",
                  value: (myEntry?.xp ?? 0).toLocaleString(),
                  color: "var(--yellow)", bg: "rgba(255,224,102,.06)",
                },
                {
                  label: "Position",
                  value: `#${myRank}`,
                  color: "var(--cyan)", bg: "rgba(0,229,255,.06)",
                },
              ].map((s) => (
                <div key={s.label} style={{
                  background: s.bg, borderRadius: 10, padding: "8px 4px",
                  textAlign: "center",
                  border: "1px solid rgba(255,255,255,.04)",
                }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* ── CTA ── */}
      <button
        className="btn btn-primary btn-full"
        style={{ marginTop: 8 }}
        onClick={() => navigate("/create-household")}
      >
        ＋ Create New Household
      </button>

      <div style={{
        marginTop: 14, textAlign: "center",
        fontSize: 13, color: "var(--text-dim)",
      }}>
        Have an invite code?{" "}
        <span style={{ color: "var(--cyan)", fontWeight: 800, cursor: "pointer" }}>
          Join a household →
        </span>
      </div>

      {/* Ev tip */}
      <div style={{
        marginTop: 24, display: "flex", gap: 12, alignItems: "flex-start",
        background: "rgba(0,229,255,.05)", border: "1px solid rgba(0,229,255,.15)",
        borderRadius: 14, padding: "12px 14px",
      }}>
        <Ev size={36} mood="idle" />
        <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.6 }}>
          <span style={{ color: "var(--cyan)", fontWeight: 800 }}>Ev says: </span>
          Complete chores early for maximum XP! The sooner you do it, the more stars you earn ⭐
        </div>
      </div>
    </div>
  );
}
