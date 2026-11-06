import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { households, currentUser } from "../data/mockData";
import Ev from "../components/Ev";

const avatarColors = ["#00b8cc", "#00c8a0", "#b06aff", "#ff9600", "#ff4f6d", "#ffe066"];
const colorFor = (id) => avatarColors[id.charCodeAt(id.length - 1) % avatarColors.length];

function choreStatus(chore) {
  const now = new Date();
  if (chore.completedBy) return "done";
  if (new Date(chore.deadline) < now) return "missed";
  if (new Date(chore.earliestTime) > now) return "locked";
  return "open";
}

function timeUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  if (diff <= 0) return "now";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function calcPoints(chore) {
  if (!chore.completedAt) return 0;
  const total = new Date(chore.deadline) - new Date(chore.earliestTime);
  const remaining = new Date(chore.deadline) - new Date(chore.completedAt);
  return Math.round(chore.maxPoints * Math.max(0, Math.min(1, remaining / total)));
}

// ── Chore card ─────────────────────────────────────────────────────────────
function ChoreCard({ chore, isAdmin, onMarkDone, onEdit }) {
  const status = choreStatus(chore);
  const isMyChore = chore.assignedTo === currentUser.id || chore.assignedTo === "anyone";

  const statusConfig = {
    done:   { border: "var(--green)",  bg: "rgba(57,224,122,.07)",  icon: "✅", label: "Done"   },
    missed: { border: "var(--red)",    bg: "rgba(255,79,109,.07)",  icon: "❌", label: "Missed" },
    locked: { border: "var(--border)", bg: "var(--surface)",        icon: "🔒", label: "Locked" },
    open:   { border: "var(--cyan)",   bg: "rgba(0,229,255,.06)",   icon: "⚡", label: "Open"   },
  }[status];

  return (
    <div className="card" style={{ borderColor: statusConfig.border, background: statusConfig.bg, marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ fontSize: 24, marginTop: 2, filter: status === "open" ? "drop-shadow(0 0 6px var(--cyan))" : "none" }}>
          {statusConfig.icon}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)", marginBottom: 3 }}>
            {chore.name}
          </div>
          {chore.description && (
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>{chore.description}</div>
          )}

          {/* Pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            <span className="xp-pill">⭐ {chore.maxPoints} XP</span>
            <span style={{
              background: "rgba(176,106,255,.1)", border: "1px solid rgba(176,106,255,.3)",
              borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "var(--purple)",
            }}>
              🔁 {chore.recurrence}
            </span>
            {chore.assignedTo !== "anyone" && (
              <span style={{
                background: "rgba(0,200,160,.1)", border: "1px solid rgba(0,200,160,.3)",
                borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "var(--teal)",
              }}>
                👤 Assigned
              </span>
            )}
          </div>

          {/* Time info */}
          {status !== "done" && status !== "missed" && (
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>
              {status === "locked"
                ? `🔒 Unlocks in ${timeUntil(chore.earliestTime)}`
                : `⏰ Deadline in ${timeUntil(chore.deadline)}`}
            </div>
          )}

          {status === "done" && (
            <div style={{ fontSize: 13, color: "var(--green)", fontWeight: 800 }}>
              ✨ +{chore.earnedPoints ?? calcPoints(chore)} XP earned
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {status === "open" && isMyChore && (
              <button className="btn btn-primary btn-sm" onClick={() => onMarkDone(chore.id)}>
                ✓ Mark Done
              </button>
            )}
            {isAdmin && (
              <button className="btn btn-ghost btn-sm" onClick={() => onEdit(chore)}>
                ✏️ Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Admin Chore Modal ───────────────────────────────────────────────────────
function ChoreModal({ chore, members, onClose }) {
  const isNew = !chore;
  const [form, setForm] = useState(chore ?? {
    name: "", description: "", maxPoints: 50,
    recurrence: "Weekly", assignedTo: "anyone", deadline: "", earliestTime: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "flex-end", zIndex: 200 }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface)", borderRadius: "20px 20px 0 0",
          border: "1.5px solid var(--border-hi)", borderBottom: "none",
          padding: "24px 20px 40px", width: "100%", maxWidth: 480, margin: "0 auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 16,
          color: "var(--cyan)", marginBottom: 18,
        }}>
          {isNew ? "// NEW CHORE" : "// EDIT CHORE"}
        </div>

        <div className="form-group">
          <label className="form-label">Chore Name</label>
          <input className="form-input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Vacuum living room" />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Optional instructions…" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Max XP</label>
            <input className="form-input" type="number" value={form.maxPoints} onChange={(e) => set("maxPoints", +e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Recurrence</label>
            <select className="form-select" value={form.recurrence} onChange={(e) => set("recurrence", e.target.value)}>
              <option>Daily</option><option>Weekly</option><option>One-time</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Assign To</label>
          <select className="form-select" value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)}>
            <option value="anyone">Anyone</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Deadline</label>
            <input className="form-input" type="datetime-local" value={form.deadline?.slice(0, 16) ?? ""} onChange={(e) => set("deadline", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Earliest Unlock</label>
            <input className="form-input" type="datetime-local" value={form.earliestTime?.slice(0, 16) ?? ""} onChange={(e) => set("earliestTime", e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary btn-full" onClick={onClose}>
          {isNew ? "Create Chore" : "Save Changes"}
        </button>
        <button className="btn btn-ghost btn-full" style={{ marginTop: 10 }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

// ── Member row ──────────────────────────────────────────────────────────────
function MemberRow({ member, onAdjust }) {
  const rankMap = { rookie: "rank-rookie", bronze: "rank-bronze", silver: "rank-silver", gold: "rank-gold", diamond: "rank-diamond" };
  const rankLabels = { rookie: "Dust Bunny", bronze: "Tidy Helper", silver: "Clean Machine", gold: "Home Champion", diamond: "Grand Caretaker" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
      <div className="avatar" style={{ background: colorFor(member.id) }}>{member.avatar}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>
          {member.name}
          {member.isAdmin && <span style={{ marginLeft: 6, fontSize: 10, color: "var(--cyan)", fontWeight: 800, fontFamily: "'Orbitron', sans-serif" }}> ADMIN</span>}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
          <span className={`rank-badge ${rankMap[member.rank]}`}>{rankLabels[member.rank]}</span>
          <span className="xp-pill" style={{ fontSize: 10, padding: "1px 8px" }}>⭐ {member.xp.toLocaleString()}</span>
          <span className="streak-pill" style={{ fontSize: 10, padding: "1px 8px" }}>🔥 {member.streak}</span>
        </div>
      </div>
      {onAdjust && (
        <button className="btn btn-ghost btn-sm" onClick={() => onAdjust(member)}>⏱ Adjust</button>
      )}
    </div>
  );
}

// ── Toggle ──────────────────────────────────────────────────────────────────
function Toggle({ on, onToggle }) {
  return (
    <button className={`toggle${on ? " on" : ""}`} onClick={onToggle}>
      <div className="toggle-thumb" />
    </button>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function HouseholdPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const household = households.find((h) => h.id === id);
  const isAdmin = household?.adminId === currentUser.id;

  const [tab, setTab] = useState("chores");
  const [choreModal, setChoreModal] = useState(null);
  const [completedIds, setCompletedIds] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [penaltyOn, setPenaltyOn] = useState(true);
  const [seasonOn, setSeasonOn] = useState(false);

  if (!household) return (
    <div className="page-content" style={{ textAlign: "center", paddingTop: 60 }}>
      <Ev size={80} mood="idle" />
      <div style={{ fontWeight: 800, marginTop: 12, color: "var(--text)" }}>Household not found</div>
      <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate("/")}>← Back</button>
    </div>
  );

  const handleMarkDone = (choreId) => {
    setCompletedIds((p) => [...p, choreId]);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2200);
  };

  const myChores = household.chores.filter(
    (c) => c.assignedTo === currentUser.id || c.assignedTo === "anyone"
  );

  const tabs = isAdmin
    ? [{ key: "chores", label: "All Chores" }, { key: "members", label: "Members" }, { key: "settings", label: "Settings" }]
    : [{ key: "chores", label: "My Chores" }];

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--cyan)" }}>←</button>
        <div style={{
          fontSize: 30, width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--surface2)", borderRadius: 12, border: "1.5px solid var(--border-hi)",
        }}>
          {household.emoji}
        </div>
        <div>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: 16, color: "var(--text)" }}>
            {household.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
            {household.memberCount} members
            {isAdmin && <span style={{ color: "var(--cyan)", fontWeight: 800 }}> · ADMIN</span>}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, background: "var(--surface2)", borderRadius: 14, padding: 4, marginBottom: 20 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: "10px 4px", border: "none", borderRadius: 10,
              fontFamily: "inherit", fontWeight: 800, fontSize: 12, cursor: "pointer",
              background: tab === t.key ? "var(--surface)" : "transparent",
              color: tab === t.key ? "var(--cyan)" : "var(--muted)",
              boxShadow: tab === t.key ? "0 0 10px rgba(0,229,255,.12)" : "none",
              transition: "all .15s",
              letterSpacing: ".02em",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CHORES TAB ── */}
      {tab === "chores" && (
        <>
          {isAdmin && (
            <button className="btn btn-secondary btn-full" style={{ marginBottom: 16 }} onClick={() => setChoreModal("new")}>
              ＋ Add Chore
            </button>
          )}

          {(isAdmin ? household.chores : myChores).map((chore) => {
            const eff = completedIds.includes(chore.id)
              ? { ...chore, completedBy: currentUser.id, completedAt: new Date().toISOString(), earnedPoints: 45 }
              : chore;
            return (
              <ChoreCard key={chore.id} chore={eff} isAdmin={isAdmin}
                onMarkDone={handleMarkDone} onEdit={(c) => setChoreModal(c)} />
            );
          })}

          {(isAdmin ? household.chores : myChores).length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <Ev size={80} mood="cheer" />
              <div style={{ fontWeight: 800, marginTop: 12, color: "var(--text)" }}>All done!</div>
              <div style={{ fontSize: 13, marginTop: 4, color: "var(--text-dim)" }}>No chores pending 🎉</div>
            </div>
          )}
        </>
      )}

      {/* ── MEMBERS TAB ── */}
      {tab === "members" && isAdmin && (
        <>
          <div className="section-header">Household Members</div>
          {household.members.map((m) => (
            <MemberRow key={m.id} member={m}
              onAdjust={(member) => alert(`Adjust timestamp for ${member.name}`)} />
          ))}
          <button className="btn btn-ghost btn-full" style={{ marginTop: 20 }}>＋ Invite Member</button>
        </>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab === "settings" && isAdmin && (
        <>
          <div className="section-header">Household Settings</div>
          <div className="card">
            <div className="form-group">
              <label className="form-label">Household Name</label>
              <input className="form-input" defaultValue={household.name} />
            </div>
            <div className="form-group">
              <label className="form-label">Invite Code</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="form-input" readOnly value={household.inviteCode} style={{ flex: 1 }} />
                <button className="btn btn-ghost btn-sm">Copy</button>
              </div>
            </div>
          </div>

          <div className="section-header">Rules</div>
          <div className="card">
            {[
              { label: "Streak Penalties", desc: "Deduct XP for missed chores", state: penaltyOn, toggle: () => setPenaltyOn(v => !v) },
              { label: "Seasonal Resets",  desc: "Reset leaderboard monthly",   state: seasonOn,  toggle: () => setSeasonOn(v => !v) },
            ].map((item, i) => (
              <div key={item.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 0", borderBottom: i === 0 ? "1px solid var(--border)" : "none",
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{item.desc}</div>
                </div>
                <Toggle on={item.state} onToggle={item.toggle} />
              </div>
            ))}
          </div>

          <button className="btn btn-danger btn-full" style={{ marginTop: 8 }}>Delete Household</button>
        </>
      )}

      {/* Chore modal */}
      {choreModal && (
        <ChoreModal chore={choreModal === "new" ? null : choreModal} members={household.members} onClose={() => setChoreModal(null)} />
      )}

      {/* Celebration overlay */}
      {showCelebration && (
        <div style={{
          position: "fixed", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,.75)", zIndex: 300, pointerEvents: "none",
        }}>
          <Ev size={110} mood="cheer" />
          <div style={{
            fontFamily: "'Orbitron', sans-serif", fontSize: 24, fontWeight: 900,
            color: "var(--cyan)", marginTop: 12,
            textShadow: "0 0 20px var(--cyan)",
          }}>
            MISSION COMPLETE!
          </div>
          <div style={{
            background: "linear-gradient(135deg, var(--cyan), var(--teal))",
            color: "#001a22", fontWeight: 900, fontSize: 20,
            padding: "10px 28px", borderRadius: 99, marginTop: 14,
            boxShadow: "0 0 24px rgba(0,229,255,.5)",
          }}>
            ＋XP EARNED ⭐
          </div>
        </div>
      )}
    </div>
  );
}
