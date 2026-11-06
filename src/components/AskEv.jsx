import { useState, useRef, useEffect } from "react";
import Ev from "./Ev";

// ── Knowledge base ────────────────────────────────────────────────────────────
const TOPICS = [
  { label: "Getting started",  icon: "🚀" },
  { label: "Earning XP",       icon: "⭐" },
  { label: "Households",       icon: "🏠" },
  { label: "Chores",           icon: "🧹" },
  { label: "Leaderboard",      icon: "🏆" },
  { label: "Ranks",            icon: "💎" },
  { label: "Admin controls",   icon: "⚙️" },
  { label: "Streaks",          icon: "🔥" },
];

const QA = {
  "Getting started": [
    {
      q: "How do I get started?",
      a: "Welcome to ChoreQuest! Here's your quick-start:\n1️⃣ Create a household (tap **＋ Create New Household** on the Home screen).\n2️⃣ Share your invite code with your flatmates / family.\n3️⃣ Your Admin account is set up automatically — head to your household and tap **＋ Add Chore** to add your first task.\n4️⃣ Members will see chores on their Chore Board and can tap **✓ Mark Done** when finished!",
    },
    {
      q: "How do I join a household?",
      a: "Ask your Admin for the invite code (e.g. **RIV-2024**). Then go to **Home → Create New Household** and scroll down to the **'Already have an invite code?'** section. Enter the code and tap **Join** — you're in!",
    },
    {
      q: "Can I be in multiple households?",
      a: "Yes! You can belong to as many households as you like — for example, your family home and your student flat. Switch between them from the **Home** screen. Each household has its own leaderboard and chore list.",
    },
  ],
  "Earning XP": [
    {
      q: "How do I earn XP?",
      a: "XP is earned when you tap **✓ Mark Done** on a chore. The amount depends on *how early* you complete it within the allowed window:\n\n⚡ **Early completion = more XP**\n⏰ **Right at the deadline = 0 XP** (still counts as done!)\n\nFormula: `earned = maxXP × (time remaining / window duration)`",
    },
    {
      q: "Why can't I mark a chore done yet?",
      a: "Chores have an **Earliest Completion Time** set by the Admin — this is the anti-cheat lock 🔒. It stops anyone from clicking Done at midnight to grab maximum points without actually doing the work. Wait for the lock to open, then tap away!",
    },
    {
      q: "What are bonus XP opportunities?",
      a: "You can earn extra XP through:\n🔥 **Streak Bonus** — completing the same chore on time multiple weeks in a row gives a multiplier (×1.1 → ×1.5)\n🎯 **Perfect Day** — finish all your chores before 50% of each window for a +50 XP flat bonus!\n💎 **Rank Perks** — Gold and Diamond ranks give permanent XP multipliers.",
    },
  ],
  "Households": [
    {
      q: "How do I create a household?",
      a: "Tap **＋ Create New Household** on the Home screen. Pick an emoji, give it a name, and hit Create. You'll get a unique **invite code** — share it with people you want to join. You'll automatically be the **Admin**.",
    },
    {
      q: "What's the difference between Admin and Member?",
      a: "**Admin** (the creator):\n• Creates & edits chores\n• Sets XP weights and deadlines\n• Controls the earliest completion time lock\n• Adjusts member timestamps\n• Can remove or promote members\n\n**Member**:\n• Sees their personal chore to-do list\n• Marks chores as done\n• Views the leaderboard and their profile",
    },
    {
      q: "Can I have multiple admins?",
      a: "Yes! The current Admin can promote any member to Admin via the **Members tab** inside the household. Tap ⏱ Adjust next to a member and look for the promote option. Both admins then have full control.",
    },
  ],
  "Chores": [
    {
      q: "How do I add a new chore?",
      a: "Open your household → **All Chores** tab → tap **＋ Add Chore**. You'll set:\n• Chore name & description\n• Max XP (the point ceiling)\n• Recurrence (Daily / Weekly / One-time)\n• Who it's assigned to\n• Deadline\n• Earliest completion time (the anti-cheat lock)",
    },
    {
      q: "What do the chore card colours mean?",
      a: "⚡ **Cyan border** — Open and ready to complete!\n🔒 **Grey** — Locked, wait for the earliest time to pass\n✅ **Green** — Done, XP already awarded\n❌ **Red** — Missed, deadline passed without completion",
    },
    {
      q: "Can chores repeat automatically?",
      a: "Yes! Set the **Recurrence** when creating a chore:\n• **Daily** — resets every day\n• **Weekly** — resets every week\n• **One-time** — disappears after completion\n\nThe Admin can edit recurrence at any time from the chore's edit panel.",
    },
  ],
  "Leaderboard": [
    {
      q: "How does the leaderboard work?",
      a: "The leaderboard ranks all members in a household by XP earned. You can switch between:\n📅 **Weekly** — resets every Monday\n🗓️ **Monthly** — resets on the 1st\n♾️ **All-Time** — lifetime cumulative XP\n\nThe top 3 get the gold/silver/bronze **podium**. Your row is always pinned so you can see your position even if you're lower down.",
    },
    {
      q: "My position is far down the list — can I catch up?",
      a: "Absolutely! Weekly XP resets every Monday, so anyone can climb to the top. The best strategy: complete chores **early in the window** to maximise each task's XP, and maintain your **streak** for the multiplier bonus. You've got this! 💪",
    },
  ],
  "Ranks": [
    {
      q: "What are the ranks?",
      a: "There are 5 ranks based on your **lifetime XP** in a household:\n\n🔴 **Dust Bunny** — 0–499 XP\n🟤 **Tidy Helper** — 500–1,499 XP\n⬜ **Clean Machine** — 1,500–3,999 XP\n🟡 **Home Champion** — 4,000–9,999 XP\n🔵 **Grand Caretaker** — 10,000+ XP\n\nHigher ranks unlock perks like XP multipliers and streak shields!",
    },
    {
      q: "What perks do higher ranks give me?",
      a: "🟡 **Home Champion** — Permanent ×1.1 XP multiplier on all chores\n🔵 **Grand Caretaker** — Permanent ×1.25 multiplier + animated badge\n⬜ **Clean Machine** — Streak shield: miss one chore without breaking your streak\n🟤 **Tidy Helper** — Custom avatar border unlock",
    },
  ],
  "Admin controls": [
    {
      q: "How do I adjust a member's timestamp?",
      a: "Go to your household → **Members** tab → tap **⏱ Adjust** next to the member. You can move their recorded completion time earlier or later. This is useful if someone did the chore physically but forgot to tap Done in the app in time.",
    },
    {
      q: "How do I set the earliest completion time?",
      a: "When creating or editing a chore, set the **Earliest Unlock** datetime field. Members will see the chore card as locked 🔒 and cannot tap Done until that time passes. This prevents gaming the early-bird XP bonus.",
    },
    {
      q: "How do I change household settings?",
      a: "Household → **Settings** tab (Admin only). You can:\n• Rename the household\n• Regenerate the invite code\n• Toggle **Streak Penalties** (deduct XP for missed chores)\n• Toggle **Seasonal Resets** (wipe leaderboard monthly)\n\nAll Admin actions are logged in the Audit Log.",
    },
  ],
  "Streaks": [
    {
      q: "How do streaks work?",
      a: "Your streak 🔥 counts how many days in a row you've completed at least one chore on time. Streaks give a XP multiplier that grows the longer you keep them going. A missed day resets your streak to 0 — unless you have the **Clean Machine** rank streak shield!",
    },
    {
      q: "What happens if I miss a chore?",
      a: "Missing a chore means 0 XP for that task and your streak resets. If the Admin has **Streak Penalties** enabled, you'll also lose a small amount of XP. The chore card will turn red ❌ after the deadline passes.",
    },
  ],
};

// ── Markdown-lite renderer ───────────────────────────────────────────────────
function renderAnswer(text) {
  return text.split("\n").map((line, i) => {
    // Bold **text**
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const rendered = parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: "#fff" }}>{p}</strong> : p);
    // Code `text`
    return (
      <p key={i} style={{ margin: "3px 0", lineHeight: 1.6, color: "var(--text-dim)" }}>
        {rendered}
      </p>
    );
  });
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AskEv() {
  const [open, setOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeQ, setActiveQ] = useState(null);
  const [inputVal, setInputVal] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      from: "ev",
      text: "Hi! I'm **Ev** 🤖 — your ChoreQuest helper!\n\nPick a topic below or type your question and I'll do my best to help!",
    },
  ]);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, open]);

  const handleTopicClick = (topic) => {
    setActiveTopic(topic);
    setActiveQ(null);
  };

  const handleQuestionClick = (item) => {
    setActiveQ(item.q);
    setChatHistory((h) => [
      ...h,
      { from: "user", text: item.q },
      { from: "ev",   text: item.a },
    ]);
  };

  const handleSend = () => {
    const val = inputVal.trim();
    if (!val) return;
    setInputVal("");

    // Simple keyword matching
    const lower = val.toLowerCase();
    const allQA = Object.values(QA).flat();
    const match = allQA.find((qa) =>
      qa.q.toLowerCase().split(/\s+/).some((w) => w.length > 3 && lower.includes(w))
    );

    setChatHistory((h) => [
      ...h,
      { from: "user", text: val },
      {
        from: "ev",
        text: match
          ? match.a
          : "Hmm, I'm not sure about that one! 🤔\n\nTry picking a topic from the buttons above, or rephrase your question — I'll try again!",
      },
    ]);
  };

  const handleClose = () => {
    setOpen(false);
    setActiveTopic(null);
    setActiveQ(null);
  };

  return (
    <>
      {/* ── Floating button ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "fixed",
            bottom: 80,
            right: "calc(50% - 228px)",
            zIndex: 150,
            background: "linear-gradient(135deg, #0a2030, #12183a)",
            border: "1.5px solid var(--cyan-dim)",
            borderRadius: "99px",
            padding: "8px 16px 8px 8px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(0,229,255,.3), 0 4px 12px rgba(0,0,0,.5)",
            transition: "transform .15s, box-shadow .15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 0 28px rgba(0,229,255,.5), 0 6px 16px rgba(0,0,0,.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(0,229,255,.3), 0 4px 12px rgba(0,0,0,.5)";
          }}
        >
          <Ev size={32} mood="happy" />
          <span style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 11, fontWeight: 700,
            color: "var(--cyan)", letterSpacing: ".06em",
          }}>
            Ask Ev
          </span>
        </button>
      )}

      {/* ── Slide-up panel ── */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          {/* Backdrop */}
          <div
            onClick={handleClose}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)" }}
          />

          {/* Panel */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 480,
              height: "82vh",
              background: "var(--bg2)",
              borderRadius: "20px 20px 0 0",
              border: "1.5px solid var(--border-hi)",
              borderBottom: "none",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* ── Panel header ── */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 16px 12px",
              borderBottom: "1px solid var(--border)",
              background: "linear-gradient(135deg, #0a1830, #11183a)",
              flexShrink: 0,
            }}>
              <Ev size={44} mood="happy" />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 900, fontSize: 14,
                  color: "var(--cyan)",
                }}>
                  Ask Ev
                </div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  Your ChoreQuest assistant
                </div>
              </div>
              <button
                onClick={handleClose}
                style={{
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: "50%",
                  width: 30, height: 30,
                  color: "var(--text-dim)",
                  fontSize: 16, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            {/* ── Topic pills ── */}
            <div style={{
              display: "flex",
              gap: 8,
              padding: "10px 14px",
              overflowX: "auto",
              flexShrink: 0,
              borderBottom: "1px solid var(--border)",
              scrollbarWidth: "none",
            }}>
              {TOPICS.map((t) => (
                <button
                  key={t.label}
                  onClick={() => handleTopicClick(t.label)}
                  style={{
                    whiteSpace: "nowrap",
                    padding: "6px 12px",
                    borderRadius: 99,
                    border: activeTopic === t.label
                      ? "1.5px solid var(--cyan)"
                      : "1.5px solid var(--border)",
                    background: activeTopic === t.label
                      ? "rgba(0,229,255,.12)"
                      : "var(--surface2)",
                    color: activeTopic === t.label ? "var(--cyan)" : "var(--text-dim)",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    transition: "all .15s",
                    display: "flex", alignItems: "center", gap: 5,
                    boxShadow: activeTopic === t.label ? "0 0 8px rgba(0,229,255,.2)" : "none",
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* ── Question list (when topic selected, no question yet) ── */}
            {activeTopic && !activeQ && (
              <div style={{
                padding: "10px 14px",
                borderBottom: "1px solid var(--border)",
                flexShrink: 0,
                background: "var(--surface)",
              }}>
                <div style={{
                  fontSize: 10, fontFamily: "'Orbitron', sans-serif",
                  color: "var(--cyan)", letterSpacing: ".1em", marginBottom: 8,
                }}>
                  {activeTopic.toUpperCase()} · SELECT A QUESTION
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(QA[activeTopic] ?? []).map((item) => (
                    <button
                      key={item.q}
                      onClick={() => handleQuestionClick(item)}
                      style={{
                        textAlign: "left",
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid var(--border-hi)",
                        background: "var(--surface2)",
                        color: "var(--text)",
                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                        transition: "all .15s",
                        display: "flex", alignItems: "center", gap: 8,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--cyan-dim)";
                        e.currentTarget.style.background = "rgba(0,229,255,.07)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-hi)";
                        e.currentTarget.style.background = "var(--surface2)";
                      }}
                    >
                      <span style={{ color: "var(--cyan)", fontSize: 14 }}>›</span>
                      {item.q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Chat messages ── */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px 14px 8px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}>
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: msg.from === "user" ? "row-reverse" : "row",
                    alignItems: "flex-end",
                    gap: 8,
                  }}
                >
                  {/* Avatar */}
                  {msg.from === "ev" && (
                    <div style={{ flexShrink: 0, marginBottom: 2 }}>
                      <Ev size={28} mood="happy" />
                    </div>
                  )}
                  {msg.from === "user" && (
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "var(--purple)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0,
                    }}>
                      AR
                    </div>
                  )}

                  {/* Bubble */}
                  <div style={{
                    maxWidth: "75%",
                    padding: "10px 13px",
                    borderRadius: msg.from === "ev"
                      ? "4px 14px 14px 14px"
                      : "14px 4px 14px 14px",
                    background: msg.from === "ev"
                      ? "var(--surface)"
                      : "linear-gradient(135deg, var(--purple), var(--pink))",
                    border: msg.from === "ev"
                      ? "1px solid var(--border-hi)"
                      : "none",
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: msg.from === "user" ? "#fff" : "var(--text-dim)",
                  }}>
                    {msg.from === "ev" ? renderAnswer(msg.text) : msg.text}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* ── Input bar ── */}
            <div style={{
              padding: "10px 14px 16px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: 8,
              flexShrink: 0,
              background: "var(--surface)",
            }}>
              <input
                className="form-input"
                placeholder="Ask Ev anything…"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                style={{ flex: 1, fontSize: 14, padding: "10px 14px" }}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSend}
                disabled={!inputVal.trim()}
                style={{ flexShrink: 0, padding: "10px 16px" }}
              >
                Send ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
