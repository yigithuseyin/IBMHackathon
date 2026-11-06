import { currentUser, households } from "../data/mockData";
import Ev from "../components/Ev";

const rankInfo = {
  rookie:  { label: "Dust Bunny",      cls: "rank-rookie",  next: 500,   current: 0    },
  bronze:  { label: "Tidy Helper",     cls: "rank-bronze",  next: 1500,  current: 500  },
  silver:  { label: "Clean Machine",   cls: "rank-silver",  next: 4000,  current: 1500 },
  gold:    { label: "Home Champion",   cls: "rank-gold",    next: 10000, current: 4000 },
  diamond: { label: "Grand Caretaker", cls: "rank-diamond", next: 99999, current: 10000},
};

const avatarColors = ["#00b8cc", "#00c8a0", "#b06aff", "#ff9600", "#ff4f6d", "#ffe066"];
const colorFor = (id) => avatarColors[id.charCodeAt(id.length - 1) % avatarColors.length];

const HISTORY = [
  { date: "Mon", xp: 45 }, { date: "Tue", xp: 80 }, { date: "Wed", xp: 30 },
  { date: "Thu", xp: 100 }, { date: "Fri", xp: 55 }, { date: "Sat", xp: 90 },
  { date: "Sun", xp: 70 },
];
const maxHistory = Math.max(...HISTORY.map((d) => d.xp));

export default function Profile() {
  const rank = rankInfo[currentUser.rankLevel] ?? rankInfo.silver;
  const xpInLevel = currentUser.xp - rank.current;
  const xpNeeded  = rank.next - rank.current;
  const progress  = Math.min(1, xpInLevel / xpNeeded);

  const myHouseholds = households.filter((h) =>
    h.members.some((m) => m.id === currentUser.id)
  );

  const totalCompleted = households.reduce(
    (acc, h) => acc + h.chores.filter((c) => c.completedBy === currentUser.id).length, 0
  );

  return (
    <div className="page-content">
      {/* Hero card */}
      <div style={{
        background: "linear-gradient(135deg, #0a1830 0%, #11183a 50%, #180c2a 100%)",
        border: "1.5px solid var(--border-hi)",
        borderRadius: 20, padding: "24px 20px 20px",
        marginBottom: 20, textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        {/* Grid bg */}
        <div style={{
          position: "absolute", inset: 0, opacity: .06,
          backgroundImage: "linear-gradient(var(--cyan) 1px, transparent 1px), linear-gradient(90deg, var(--cyan) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }} />
        <div style={{ position: "relative" }}>
          {/* Ev stands next to avatar */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12, marginBottom: 12 }}>
            <div
              className="avatar avatar-lg"
              style={{
                background: colorFor(currentUser.id),
                boxShadow: "0 0 20px rgba(0,229,255,.3)",
                border: "3px solid var(--cyan-dim)",
              }}
            >
              {currentUser.avatar}
            </div>
            <Ev size={68} mood="happy" />
          </div>

          <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 20, color: "#fff" }}>
            {currentUser.name}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 12 }}>
            Member since November 2026
          </div>
          <span className={`rank-badge ${rank.cls}`} style={{ fontSize: 12, padding: "4px 14px" }}>
            {rank.label}
          </span>

          {/* Stats row */}
          <div style={{ display: "flex", marginTop: 20, borderTop: "1px solid var(--border-hi)", paddingTop: 16 }}>
            {[
              { label: "Total XP",  value: currentUser.xp.toLocaleString() },
              { label: "Streak",    value: `🔥 ${currentUser.streak}` },
              { label: "Completed", value: totalCompleted },
            ].map((s, i) => (
              <div key={s.label} style={{
                flex: 1,
                borderLeft: i > 0 ? "1px solid var(--border-hi)" : "none",
              }}>
                <div style={{ fontWeight: 900, fontSize: 20, color: "#fff" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "var(--text-dim)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rank progress */}
      <div className="section-header">Rank Progress</div>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span className={`rank-badge ${rank.cls}`}>{rank.label}</span>
          <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 700 }}>
            {xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 8 }}>
          {(xpNeeded - xpInLevel).toLocaleString()} XP to next rank
        </div>
      </div>

      {/* Weekly XP chart */}
      <div className="section-header">This Week's XP</div>
      <div className="card">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 72, marginBottom: 8 }}>
          {HISTORY.map((d) => (
            <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: "100%",
                height: `${(d.xp / maxHistory) * 64}px`,
                background: "linear-gradient(180deg, var(--cyan), var(--purple))",
                borderRadius: "5px 5px 0 0",
                minHeight: 4,
                boxShadow: "0 0 8px rgba(0,229,255,.3)",
              }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {HISTORY.map((d) => (
            <div key={d.date} style={{ flex: 1, textAlign: "center", fontSize: 10, color: "var(--muted)", fontWeight: 700 }}>
              {d.date}
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 10, fontWeight: 800, fontSize: 14, color: "var(--yellow)" }}>
          ⭐ {HISTORY.reduce((s, d) => s + d.xp, 0)} XP this week
        </div>
      </div>

      {/* Households */}
      <div className="section-header">My Households</div>
      {myHouseholds.map((h) => {
        const me = h.members.find((m) => m.id === currentUser.id);
        const pos = [...h.members].sort((a, b) => b.xp - a.xp)
          .findIndex((m) => m.id === currentUser.id) + 1;
        const isAdmin = h.adminId === currentUser.id;
        return (
          <div key={h.id} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                fontSize: 24, width: 40, height: 40,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "var(--surface2)", borderRadius: 10,
                border: "1.5px solid var(--border-hi)",
              }}>{h.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>
                  {h.name}
                  {isAdmin && (
                    <span style={{
                      marginLeft: 6, fontSize: 10, color: "var(--cyan)",
                      fontFamily: "'Orbitron', sans-serif", fontWeight: 700,
                    }}> ADMIN</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{h.memberCount} members</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 900, fontSize: 17, color: "var(--yellow)" }}>
                  ⭐ {me?.xp.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-dim)" }}>#{pos} place</div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Achievements */}
      <div className="section-header">Achievements</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { icon: "🔥", label: "7-Day Streak",    desc: "7 days in a row",   unlocked: true  },
          { icon: "⭐", label: "XP Master",        desc: "Earn 3000+ XP",     unlocked: true  },
          { icon: "🏆", label: "Top of the Week",  desc: "Rank #1 weekly",    unlocked: false },
          { icon: "🧹", label: "Speed Cleaner",    desc: "10 early finishes", unlocked: false },
          { icon: "💎", label: "Diamond Dreamer",  desc: "Reach Diamond",     unlocked: false },
          { icon: "🎯", label: "Perfect Day",      desc: "All chores early",  unlocked: false },
        ].map((a) => (
          <div
            key={a.label}
            className="card"
            style={{
              textAlign: "center", padding: "14px 10px",
              opacity: a.unlocked ? 1 : 0.4,
              borderColor: a.unlocked ? "var(--yellow)" : "var(--border)",
              background: a.unlocked ? "rgba(255,224,102,.06)" : "var(--surface)",
              boxShadow: a.unlocked ? "0 0 12px rgba(255,224,102,.15)" : "none",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6, filter: a.unlocked ? "drop-shadow(0 0 6px rgba(255,224,102,.5))" : "none" }}>
              {a.icon}
            </div>
            <div style={{ fontWeight: 800, fontSize: 12, color: "var(--text)" }}>{a.label}</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{a.desc}</div>
            {a.unlocked && (
              <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 800, marginTop: 4 }}>✓ Unlocked</div>
            )}
          </div>
        ))}
      </div>

      {/* Account */}
      <div className="section-header">Account</div>
      <div className="card">
        {[
          { icon: "✏️", label: "Edit Profile" },
          { icon: "🔔", label: "Notifications" },
          { icon: "🔒", label: "Change Password" },
        ].map((item) => (
          <div key={item.label} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "13px 0", borderBottom: "1px solid var(--border)", cursor: "pointer",
          }}>
            <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{item.icon}</span>
            <span style={{ fontWeight: 700, flex: 1, color: "var(--text)" }}>{item.label}</span>
            <span style={{ color: "var(--cyan)", fontSize: 16 }}>›</span>
          </div>
        ))}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "13px 0", cursor: "pointer",
        }}>
          <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>🚪</span>
          <span style={{ fontWeight: 700, flex: 1, color: "var(--red)" }}>Sign Out</span>
        </div>
      </div>

      {/* Ev footer */}
      <div style={{
        display: "flex", gap: 12, alignItems: "center", justifyContent: "center",
        padding: "20px 0 8px", color: "var(--muted)", fontSize: 13,
      }}>
        <Ev size={28} mood="idle" />
        <span>Ev is proud of you! Keep it up 🤖</span>
      </div>
    </div>
  );
}
