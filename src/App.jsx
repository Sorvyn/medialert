const { useState, useRef, useEffect } = React;

// ERROR BOUNDARY - catches all crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error('App crashed:', error);
    if (window.Sentry) window.Sentry.captureException(error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: '20px' }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>The app crashed. We've been notified and will fix it.</p>
            <button onClick={() => window.location.reload()} style={{ background: '#FF3B47', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// INITIALIZE SENTRY
if (window.location.hostname !== 'localhost') {
  window.Sentry?.init({
    dsn: 'https://your-sentry-dsn@sentry.io/project-id',
    environment: 'production',
    tracesSampleRate: 0.1,
  });
}

const EMERGENCIES = [
  { id: "heart", icon: "🫀", label: "Heart Attack", color: "#FF3B47" },
  { id: "burn", icon: "🔥", label: "Burns", color: "#FF7A00" },
  { id: "choking", icon: "🫁", label: "Choking", color: "#FF5733" },
  { id: "fracture", icon: "🦴", label: "Fracture", color: "#A78BFA" },
  { id: "bleeding", icon: "🩸", label: "Heavy Bleeding", color: "#EF4444" },
  { id: "seizure", icon: "⚡", label: "Seizure", color: "#FBBF24" },
  { id: "fainting", icon: "😵", label: "Fainting", color: "#60A5FA" },
  { id: "allergic", icon: "🤧", label: "Allergic Reaction", color: "#34D399" },
];

const MEDICINES = [
  { id: "fever", icon: "🌡️", label: "Fever", color: "#F97316" },
  { id: "cold", icon: "🤧", label: "Cold & Flu", color: "#38BDF8" },
  { id: "headache", icon: "🤕", label: "Headache", color: "#818CF8" },
  { id: "stomach", icon: "🤢", label: "Stomach Ache", color: "#4ADE80" },
  { id: "acidity", icon: "🔥", label: "Acidity", color: "#FB923C" },
  { id: "diarrhea", icon: "💊", label: "Diarrhea", color: "#A3E635" },
  { id: "sprain", icon: "🦵", label: "Sprain/Pain", color: "#F472B6" },
  { id: "insomnia", icon: "😴", label: "Sleep Issues", color: "#C084FC" },
];

function App() {
  const [tab, setTab] = useState("home");
  const [selected, setSelected] = useState(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [customQuery, setCustomQuery] = useState("");
  const [showSOS, setShowSOS] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const askClaude = async (prompt, type) => {
    try {
      setLoading(true);
      setResponse("");
      const systemPrompt = type === "emergency"
        ? "Give ONLY numbered action steps. No theory. Example: 1. CALL 1122 IMMEDIATELY 2. Step 2"
        : "Give: OTC medicines + dosage, home remedies, warning signs.";
      
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 500, system: systemPrompt, messages: [{ role: "user", content: prompt }] }),
      });
      
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setResponse(data.content?.map(b => b.text || "").join("") || "Unable to get response.");
    } catch (err) {
      console.error('API Error:', err);
      if (window.Sentry) window.Sentry.captureException(err);
      setResponse("⚠️ Connection error. Check internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmergency = (item) => {
    setSelected({ ...item, type: "emergency" });
    setTab("result");
    askClaude(`${item.label} - emergency steps only`, "emergency");
  };

  const handleMedicine = (item) => {
    setSelected({ ...item, type: "medicine" });
    setTab("result");
    askClaude(`${item.label} - medicine and remedies`, "medicine");
  };

  const handleCustom = () => {
    if (!customQuery.trim()) return;
    const isEmergency = /emergency|accident|bleeding|attack|unconscious|fainted/.test(customQuery.toLowerCase());
    setSelected({ label: customQuery, icon: "💬", color: "#60A5FA", type: isEmergency ? "emergency" : "medicine" });
    setTab("result");
    askClaude(customQuery, isEmergency ? "emergency" : "medicine");
    setCustomQuery("");
  };

  if (!termsAccepted) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 40%, #0a0a0f 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ maxWidth: 420, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>❤️‍🔥</div>
            <h1 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 6px", letterSpacing: 2 }}>MEDIALERT</h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>AI FIRST AID ASSISTANT</p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "16px", marginBottom: 16, maxHeight: 300, overflowY: "auto" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#FF3B47", marginBottom: 12 }}>⚖️ TERMS & PRIVACY</div>
            {[
              "MediAlert is NOT medical advice. Always call 1122 (PK) / 112 (IN).",
              "AI responses may be incorrect. Consult a real doctor.",
              "Your data is NOT stored. Each request is temporary.",
              "We do NOT collect personal information.",
              "We do NOT share data with anyone.",
              "No cookies, no tracking, no ads.",
              "Use at your own risk. We accept no liability."
            ].map((item, i) => (
              <p key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "8px 0", lineHeight: 1.6 }}>✓ {item}</p>
            ))}
          </div>

          <button onClick={() => setTermsAccepted(true)} style={{ width: "100%", background: "linear-gradient(135deg, #FF3B47, #cc2230)", border: "none", borderRadius: 14, color: "#fff", padding: "14px", fontSize: 14, fontWeight: 800, cursor: "pointer", letterSpacing: 1 }}>
            ✅ I UNDERSTAND & CONTINUE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 40%, #0a0a0f 100%)", paddingBottom: 100 }}>
      {/* SOS */}
      {showSOS && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "linear-gradient(145deg, #1a0505, #2a0808)", border: "2px solid #FF3B47", borderRadius: 24, padding: "32px 24px", textAlign: "center", maxWidth: 320, width: "92%" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚨</div>
            <h2 style={{ fontSize: 28, color: "#FF3B47", letterSpacing: 2, margin: "0 0 14px" }}>EMERGENCY</h2>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 2, marginBottom: 16 }}>
              🇵🇰 <strong>1122</strong> · 🇮🇳 <strong>112</strong><br/>
              Ambulance: <strong>115</strong> (PK) / <strong>108</strong> (IN)
            </div>
            <button onClick={() => setShowSOS(false)} style={{ width: "100%", background: "linear-gradient(135deg, #FF3B47, #cc2230)", border: "none", borderRadius: 12, color: "#fff", padding: "12px", fontWeight: 700, cursor: "pointer" }}>
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid rgba(255,59,71,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 36, margin: 0, letterSpacing: 3, fontWeight: 800 }}>MEDIALERT</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, margin: "2px 0 0" }}>AI FIRST AID</p>
        </div>
        <button onClick={() => setShowSOS(true)} style={{ background: "linear-gradient(135deg, #FF3B47, #cc2230)", border: "none", borderRadius: 12, color: "#fff", padding: "10px 14px", fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: 1 }}>
          🆘 SOS
        </button>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", padding: "12px 16px", gap: 6 }}>
        {[{ id: "home", label: "🏠" }, { id: "emergency", label: "🚨" }, { id: "medicine", label: "💊" }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); setResponse(""); }} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 20, border: tab === t.id ? "1.5px solid rgba(255,59,71,0.6)" : "1.5px solid rgba(255,255,255,0.08)", background: tab === t.id ? "rgba(255,59,71,0.12)" : "transparent", cursor: "pointer" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* HOME TAB */}
      {tab === "home" && (
        <div style={{ padding: "16px 18px", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(135deg, rgba(255,59,71,0.15) 0%, rgba(255,59,71,0.04) 100%)", border: "1px solid rgba(255,59,71,0.2)", borderRadius: 16, padding: "18px", marginBottom: 16 }}>
            <h2 style={{ fontSize: 24, margin: "0 0 6px", letterSpacing: 2, fontWeight: 800 }}>STAY CALM</h2>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: 0 }}>Emergency first aid in seconds. Call 1122 🇵🇰 / 112 🇮🇳 for emergencies.</p>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input value={customQuery} onChange={e => setCustomQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCustom()} placeholder="e.g. 'My brother has a heart attack...'" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 12px", color: "#fff", fontSize: 12, outline: "none" }} />
            <button onClick={handleCustom} style={{ background: "linear-gradient(135deg, #FF3B47, #cc2230)", border: "none", borderRadius: 10, color: "#fff", padding: "0 16px", fontSize: 18, cursor: "pointer" }}>→</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[{ id: "emergency", icon: "🚨", label: "Emergency" }, { id: "medicine", icon: "💊", label: "Medicine" }].map(f => (
              <button key={f.id} onClick={() => setTab(f.id)} style={{ background: `linear-gradient(145deg, rgba(255,59,71,0.15), rgba(255,59,71,0.05))`, border: "1px solid rgba(255,59,71,0.25)", borderRadius: 14, padding: "14px 12px", color: "#fff", cursor: "pointer", textAlign: "left" }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{f.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{f.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* EMERGENCY TAB */}
      {tab === "emergency" && (
        <div style={{ padding: "16px 18px", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {EMERGENCIES.map(item => (
              <button key={item.id} onClick={() => handleEmergency(item)} style={{ background: `linear-gradient(145deg, ${item.color}15, ${item.color}05)`, border: `1px solid ${item.color}30`, borderRadius: 16, padding: "16px 12px", color: "#fff", cursor: "pointer", textAlign: "left" }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{item.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MEDICINE TAB */}
      {tab === "medicine" && (
        <div style={{ padding: "16px 18px", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {MEDICINES.map(item => (
              <button key={item.id} onClick={() => handleMedicine(item)} style={{ background: `linear-gradient(145deg, ${item.color}15, ${item.color}05)`, border: `1px solid ${item.color}30`, borderRadius: 16, padding: "16px 12px", color: "#fff", cursor: "pointer", textAlign: "left" }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{item.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RESULT TAB */}
      {tab === "result" && selected && (
        <div style={{ padding: "16px 18px", maxWidth: 480, margin: "0 auto" }}>
          <button onClick={() => { setTab(selected.type === "emergency" ? "emergency" : "medicine"); setSelected(null); setResponse(""); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "rgba(255,255,255,0.55)", padding: "6px 12px", cursor: "pointer", fontSize: 12, marginBottom: 12 }}>
            ← Back
          </button>
          <div style={{ background: `linear-gradient(135deg, ${selected.color}20, ${selected.color}05)`, border: `1px solid ${selected.color}30`, borderRadius: 16, padding: "16px", marginBottom: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{selected.icon}</div>
            <h2 style={{ fontSize: 22, margin: "0 0 4px", letterSpacing: 2, fontWeight: 800 }}>{selected.label.toUpperCase()}</h2>
          </div>
          {loading && <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 12, padding: "20px" }}>Loading...</div>}
          {response && !loading && (
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px", whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.8 }}>
              {response}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// RENDER WITH ERROR BOUNDARY
ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
