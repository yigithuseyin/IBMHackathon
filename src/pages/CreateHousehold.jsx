import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Ev from "../components/Ev";

const EMOJIS = ["🏠", "🎓", "🏡", "🏢", "🏰", "🛖", "🏗️", "⛺"];

export default function CreateHousehold() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏠");
  const [created, setCreated] = useState(false);
  const inviteCode = "CQ-" + Math.random().toString(36).slice(2, 6).toUpperCase();

  const handleCreate = () => { if (name.trim()) setCreated(true); };

  if (created) {
    return (
      <div className="page-content" style={{ textAlign: "center", paddingTop: 32 }}>
        <Ev size={110} mood="cheer" />
        <div style={{
          fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 22,
          color: "var(--text)", marginTop: 12, marginBottom: 6,
        }}>
          {name}
        </div>
        <div style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 28 }}>
          Household is live! You are the Admin 🤖
        </div>

        {/* Invite code card */}
        <div style={{
          background: "linear-gradient(135deg, #0a2030, #12183a)",
          border: "1.5px solid var(--cyan-dim)",
          boxShadow: "0 0 24px rgba(0,229,255,.2)",
          borderRadius: 20, padding: "28px 20px", marginBottom: 28,
        }}>
          <div style={{
            fontFamily: "'Orbitron', sans-serif", fontSize: 10, fontWeight: 700,
            color: "var(--cyan)", letterSpacing: ".18em", marginBottom: 10,
          }}>
            INVITE CODE
          </div>
          <div style={{
            fontFamily: "'Orbitron', sans-serif", fontSize: 36, fontWeight: 900,
            color: "#fff", letterSpacing: ".2em",
            textShadow: "0 0 16px var(--cyan)",
          }}>
            {inviteCode}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 10 }}>
            Share with your household members
          </div>
        </div>

        <button className="btn btn-primary btn-full" onClick={() => navigate("/")}>
          Start Adding Chores →
        </button>
        <button className="btn btn-ghost btn-full" style={{ marginTop: 10 }} onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--cyan)" }}>
          ←
        </button>
        <div>
          <div className="page-title">New Household</div>
          <div className="page-subtitle">You'll be the Admin</div>
        </div>
        <Ev size={52} mood="idle" style={{ marginLeft: "auto" }} />
      </div>

      {/* Emoji picker */}
      <div className="section-header">Pick an Icon</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        {EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            style={{
              fontSize: 26, width: 52, height: 52,
              borderRadius: 14,
              border: emoji === e ? "2px solid var(--cyan)" : "1.5px solid var(--border)",
              background: emoji === e ? "rgba(0,229,255,.1)" : "var(--surface2)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .15s",
              boxShadow: emoji === e ? "0 0 12px rgba(0,229,255,.25)" : "none",
            }}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Name input */}
      <div className="form-group">
        <label className="form-label">Household Name</label>
        <input
          className="form-input"
          placeholder="e.g. Rivera Family Home"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ fontSize: 16, padding: "14px 16px" }}
        />
      </div>

      {/* Live preview */}
      {name.trim() && (
        <div className="card card-glow" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              fontSize: 32, width: 50, height: 50,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "var(--surface2)", borderRadius: 12,
              border: "1.5px solid var(--border-hi)",
            }}>
              {emoji}
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, color: "var(--text)" }}>{name}</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>1 member (you) · Admin</div>
            </div>
            <span style={{
              marginLeft: "auto",
              background: "rgba(0,229,255,.12)", color: "var(--cyan)",
              border: "1px solid rgba(0,229,255,.35)",
              fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 99,
              fontFamily: "'Orbitron', sans-serif", textTransform: "uppercase",
            }}>Admin</span>
          </div>
        </div>
      )}

      {/* Admin perks */}
      <div className="section-header">As Admin You Can</div>
      {[
        { icon: "⭐", text: "Create & manage chores with XP weights" },
        { icon: "🔒", text: "Set earliest completion time (anti-cheat)" },
        { icon: "👥", text: "Invite and manage household members" },
        { icon: "⏱️", text: "Adjust member completion timestamps" },
        { icon: "🏆", text: "View full leaderboard & audit log" },
        { icon: "⚙️", text: "Configure rules, streaks & seasonal resets" },
      ].map(({ icon, text }) => (
        <div key={text} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "11px 0", borderBottom: "1px solid var(--border)",
        }}>
          <div style={{
            fontSize: 18, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,229,255,.07)", borderRadius: 10, border: "1px solid var(--border-hi)",
          }}>
            {icon}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{text}</div>
        </div>
      ))}

      <button
        className="btn btn-primary btn-full"
        style={{ marginTop: 28 }}
        disabled={!name.trim()}
        onClick={handleCreate}
      >
        {emoji} Create {name || "Household"}
      </button>

      <div className="divider" style={{ margin: "24px 0" }} />

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 12 }}>
          Already have an invite code?
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="form-input" placeholder="Enter code e.g. RIV-2024" style={{ flex: 1 }} />
          <button className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>Join</button>
        </div>
      </div>
    </div>
  );
}
