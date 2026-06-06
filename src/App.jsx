import { useState, useEffect, useRef } from "react";

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

const SYMPTOM_TAGS = ["Fever","Headache","Cough","Sore Throat","Chest Pain","Shortness of Breath","Nausea","Vomiting","Diarrhea","Stomach Pain","Dizziness","Fatigue","Body Ache","Rash","Swelling","Joint Pain","Back Pain","Eye Pain"];

const CSS = `
@keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes heartbeat { 0%, 100% { transform: scale(1); } 25% { transform: scale(1.15); } 50% { transform: scale(1); } 75% { transform: scale(1.08); } }
@keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
@keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(255,59,71,0.3); } 50% { box-shadow: 0 0 40px rgba(255,59,71,0.6); } }
@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
input::placeholder { color: rgba(255,255,255,0.28); }
* { box-sizing: border-box; }
`;

export default function MediAlert() {
  const [tab, setTab] = useState("home");
  const [selected, setSelected] = useState(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [customQuery, setCustomQuery] = useState("");
  const [showSOS, setShowSOS] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [symptomAge, setSymptomAge] = useState("");
  const [symptomDuration, setSymptomDuration] = useState("");
  const [symptomResult, setSymptomResult] = useState("");
  const [symptomLoading, setSymptomLoading] = useState(false);
  const [hospitalLocation, setHospitalLocation] = useState("");
  const [hospitalType, setHospitalType] = useState("general");
  const [hospitals, setHospitals] = useState([]);
  const [hospitalLoading, setHospitalLoading] = useState(false);

  const responseRef = useRef(null);
  const symptomRef = useRef(null);

  useEffect(() => { if (response && responseRef.current) responseRef.current.scrollIntoView({ behavior: "smooth" }); }, [response]);
  useEffect(() => { if (symptomResult && symptomRef.current) symptomRef.current.scrollIntoView({ behavior: "smooth" }); }, [symptomResult]);

  const askClaude = async (prompt, type) => {
    setLoading(true); setResponse("");
    try {
      const systemPrompt = type === "emergency"
        ? `You are MediAlert. Return ONLY numbered action steps. NO theory. NO explanations. Just steps.
Example format:
1. CALL 1122 IMMEDIATELY
2. Step 2
3. Step 3
That's it.`
        : `You are MediAlert. Give: 1) OTC medicine names + dosage 2) Home remedies 3) Warning signs. Simple, direct.`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 500, system: systemPrompt, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      setResponse(data.content?.map(b => b.text || "").join("") || "Unable to get response.");
    } catch { setResponse("⚠️ Connection error. Please try again."); }
    setLoading(false);
  };

  const checkSymptoms = async () => {
    const allSymptoms = [...selectedSymptoms, ...(customSymptom ? [customSymptom] : [])];
    if (!allSymptoms.length) return;
    setSymptomLoading(true); setSymptomResult("");
    try {
      const prompt = `Symptoms: ${allSymptoms.join(", ")}. ${symptomAge ? `Age: ${symptomAge}.` : ""} ${symptomDuration ? `Duration: ${symptomDuration}.` : ""}`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 500, system: `List possible conditions (high/medium/low risk), urgency level, immediate steps, red flags.`, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      setSymptomResult(data.content?.map(b => b.text || "").join("") || "Unable to analyze.");
    } catch { setSymptomResult("⚠️ Connection error. Please try again."); }
    setSymptomLoading(false);
  };

  const findHospitals = async () => {
    if (!hospitalLocation.trim()) return;
    setHospitalLoading(true); setHospitals([]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, system: `Return ONLY JSON array of hospitals. No text. No markdown. Just valid JSON.`, messages: [{ role: "user", content: `${hospitalType} hospitals in ${hospitalLocation}` }] }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "[]";
      try {
        const cleaned = text.replace(/```json|```/g, "").trim();
        setHospitals(JSON.parse(cleaned));
      } catch { setHospitals([{ name: "Search Error", address: "Try 'Lahore, Pakistan' or 'Karachi Clifton'" }]); }
    } catch { setHospitals([{ name: "Connection Error", address: "Check internet and try again." }]); }
    setHospitalLoading(false);
  };

  const toggleSymptom = (s) => setSelectedSymptoms(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const handleEmergency = (item) => { setSelected({ ...item, type: "emergency" }); setTab("result"); askClaude(`${item.label} - give emergency steps only`, "emergency"); };
  const handleMedicine = (item) => { setSelected({ ...item, type: "medicine" }); setTab("result"); askClaude(`${item.label} treatment`, "medicine"); };
  const handleCustom = () => {
    if (!customQuery.trim()) return;
    const isEmergency = /emergency|accident|bleeding|attack|unconscious|fainted/.test(customQuery.toLowerCase());
    setSelected({ label: customQuery, icon: "💬", color: "#60A5FA", type: isEmergency ? "emergency" : "medicine" });
    setTab("result");
    askClaude(customQuery, isEmergency ? "emergency" : "medicine");
    setCustomQuery("");
  };

  const formatResponse = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
      if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
      const isHeader = /^[1-9]\./.test(line.trim());
      return <p key={i} style={{ margin: "6px 0", fontSize: isHeader ? 16 : 13.5, fontWeight: isHeader ? 700 : 400, color: isHeader ? "#FF3B47" : "rgba(255,255,255,0.85)", lineHeight: 1.8 }}>{line}</p>;
    });
  };

  const NAV = [{ id: "home", icon: "🏠", label: "Home" }, { id: "emergency", icon: "🚨", label: "Emergency" }, { id: "medicine", icon: "💊", label: "Medicine" }, { id: "symptoms", icon: "🔍", label: "Symptoms" }, { id: "hospitals", icon: "🏥", label: "Hospitals" }];

  return (
    <>
      <style>{CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {!termsAccepted && (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 40%, #0a0a0f 100%)", fontFamily: "'DM Sans', sans-serif", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ maxWidth: 420, width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12, animation: "heartbeat 2s ease infinite" }}>❤️‍🔥</div>
              <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 36, letterSpacing: 4, margin: "0 0 6px", color: "#fff" }}>MEDIALERT</h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>AI FIRST AID ASSISTANT</p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "16px", marginBottom: 16, maxHeight: 300, overflowY: "auto" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#FF3B47", marginBottom: 12 }}>⚖️ TERMS & PRIVACY</div>
              {["MediAlert is NOT medical advice. Always call 1122 (PK) / 112 (IN) for emergencies.", "AI responses may be incorrect. Consult a real doctor.", "Your data is NOT stored. Each request is temporary.", "We do NOT collect personal information.", "We do NOT share data with anyone.", "No cookies, no tracking, no ads.", "Use at your own risk. We accept no liability."].map((item, i) => (
                <p key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "8px 0", lineHeight: 1.6 }}>✓ {item}</p>
              ))}
            </div>

            <button onClick={() => setTermsAccepted(true)} style={{ width: "100%", background: "linear-gradient(135deg, #FF3B47, #cc2230)", border: "none", borderRadius: 14, color: "#fff", padding: "14px", fontSize: 14, fontWeight: 800, cursor: "pointer", letterSpacing: 1 }}>
              ✅ I UNDERSTAND & CONTINUE
            </button>
          </div>
        </div>
      )}

      {termsAccepted && (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 40%, #0a0a0f 100%)", fontFamily: "'DM Sans', sans-serif", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: `linear-gradient(rgba(255,59,71,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,59,71,0.04) 1px, transparent 1px)`, backgroundSize: "40px 40px", pointerEvents: "none" }} />

        {showSOS && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "linear-gradient(145deg, #1a0505, #2a0808)", border: "2px solid #FF3B47", borderRadius: 24, padding: "32px 24px", textAlign: "center", maxWidth: 320, width: "92%" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🚨</div>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: "#FF3B47", letterSpacing: 2, margin: "0 0 14px" }}>EMERGENCY NUMBERS</h2>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 2, marginBottom: 16 }}>
                🇵🇰 <strong>1122</strong> · 🇮🇳 <strong>112</strong><br/>
                Ambulance: <strong>115</strong> (PK) / <strong>108</strong> (IN)<br/>
                Share location on Google Maps
              </div>
              <button onClick={() => setShowSOS(false)} style={{ width: "100%", background: "linear-gradient(135deg, #FF3B47, #cc2230)", border: "none", borderRadius: 12, color: "#fff", padding: "12px", fontWeight: 700, cursor: "pointer" }}>CLOSE</button>
            </div>
          </div>
        )}

        <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "0 0 90px" }}>
          <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid rgba(255,59,71,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 36, margin: 0, letterSpacing: 3, background: "linear-gradient(135deg, #fff 30%, rgba(255,59,71,0.9))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>MEDIALERT</h1>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, margin: "2px 0 0" }}>AI FIRST AID</p>
            </div>
            <button onClick={() => setShowSOS(true)} style={{ background: "linear-gradient(135deg, #FF3B47, #cc2230)", border: "none", borderRadius: 12, color: "#fff", padding: "10px 14px", fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: 1 }}>🆘 SOS</button>
          </div>

          <div style={{ display: "flex", padding: "12px 16px", gap: 6 }}>
            {[{ id: "home", label: "🏠" }, { id: "emergency", label: "🚨" }, { id: "medicine", label: "💊" }, { id: "symptoms", label: "🔍" }, { id: "hospitals", label: "🏥" }].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); setResponse(""); }} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, fontSize: 20, border: tab === t.id ? "1.5px solid rgba(255,59,71,0.6)" : "1.5px solid rgba(255,255,255,0.08)", background: tab === t.id ? "rgba(255,59,71,0.12)" : "transparent", cursor: "pointer" }}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "home" && (
            <div style={{ padding: "16px 18px" }}>
              <div style={{ background: "linear-gradient(135deg, rgba(255,59,71,0.15) 0%, rgba(255,59,71,0.04) 100%)", border: "1px solid rgba(255,59,71,0.2)", borderRadius: 16, padding: "18px", marginBottom: 16 }}>
                <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 24, margin: "0 0 6px", letterSpacing: 2 }}>STAY CALM</h2>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: 0 }}>Emergency first aid in seconds. For life-threatening: call 1122 🇵🇰 / 112 🇮🇳 now.</p>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input value={customQuery} onChange={e => setCustomQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCustom()} placeholder="e.g. 'My brother has a heart attack...'" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 12px", color: "#fff", fontSize: 12, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
                <button onClick={handleCustom} style={{ background: "linear-gradient(135deg, #FF3B47, #cc2230)", border: "none", borderRadius: 10, color: "#fff", padding: "0 16px", fontSize: 18, cursor: "pointer" }}>→</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[{ tab: "emergency", icon: "🚨", label: "Emergency", color: "#FF3B47" }, { tab: "medicine", icon: "💊", label: "Medicines", color: "#60A5FA" }, { tab: "symptoms", icon: "🔍", label: "Symptoms", color: "#A78BFA" }, { tab: "hospitals", icon: "🏥", label: "Hospitals", color: "#34D399" }].map((f, i) => (
                  <button key={i} onClick={() => setTab(f.tab)} style={{ background: `linear-gradient(145deg, ${f.color}15, ${f.color}05)`, border: `1px solid ${f.color}25`, borderRadius: 14, padding: "14px 12px", color: "#fff", cursor: "pointer", textAlign: "left", animation: `slideUp ${0.3 + i * 0.08}s ease` }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{f.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{f.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === "emergency" && (
            <div style={{ padding: "16px 18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {EMERGENCIES.map((item, i) => (
                  <button key={item.id} onClick={() => handleEmergency(item)} style={{ background: `linear-gradient(145deg, ${item.color}15, ${item.color}05)`, border: `1px solid ${item.color}30`, borderRadius: 16, padding: "16px 12px", color: "#fff", cursor: "pointer", textAlign: "left", animation: `slideUp ${0.2 + i * 0.06}s ease` }}>
                    <div style={{ fontSize: 26, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{item.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === "medicine" && (
            <div style={{ padding: "16px 18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {MEDICINES.map((item, i) => (
                  <button key={item.id} onClick={() => handleMedicine(item)} style={{ background: `linear-gradient(145deg, ${item.color}15, ${item.color}05)`, border: `1px solid ${item.color}30`, borderRadius: 16, padding: "16px 12px", color: "#fff", cursor: "pointer", textAlign: "left", animation: `slideUp ${0.2 + i * 0.06}s ease` }}>
                    <div style={{ fontSize: 26, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{item.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === "symptoms" && (
            <div style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {SYMPTOM_TAGS.map(s => (
                  <button key={s} onClick={() => toggleSymptom(s)} style={{ padding: "6px 11px", borderRadius: 16, fontSize: 11, fontWeight: 600, border: selectedSymptoms.includes(s) ? "1.5px solid #A78BFA" : "1.5px solid rgba(255,255,255,0.1)", background: selectedSymptoms.includes(s) ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.04)", color: selectedSymptoms.includes(s) ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer" }}>
                    {selectedSymptoms.includes(s) ? "✓ " : ""}{s}
                  </button>
                ))}
              </div>
              <input value={customSymptom} onChange={e => setCustomSymptom(e.target.value)} placeholder="+ Custom symptom" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 12, outline: "none", marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }} />
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input value={symptomAge} onChange={e => setSymptomAge(e.target.value)} placeholder="Age (optional)" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 12, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
                <input value={symptomDuration} onChange={e => setSymptomDuration(e.target.value)} placeholder="Since? (e.g. 2 days)" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 12, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
              </div>
              <button onClick={checkSymptoms} disabled={!selectedSymptoms.length && !customSymptom} style={{ width: "100%", background: (!selectedSymptoms.length && !customSymptom) ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #A78BFA, #7C3AED)", border: "none", borderRadius: 12, color: "#fff", padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: (!selectedSymptoms.length && !customSymptom) ? 0.5 : 1 }}>
                🔍 Analyze
              </button>
              {symptomLoading && <div style={{ marginTop: 12, textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Analyzing...</div>}
              {symptomResult && !symptomLoading && (
                <div ref={symptomRef} style={{ marginTop: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px" }}>
                  {formatResponse(symptomResult)}
                </div>
              )}
            </div>
          )}

          {tab === "hospitals" && (
            <div style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input value={hospitalLocation} onChange={e => setHospitalLocation(e.target.value)} onKeyDown={e => e.key === "Enter" && findHospitals()} placeholder="e.g. Lahore, Pakistan" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 12, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                {[{ id: "general", label: "General" }, { id: "emergency", label: "Emergency" }, { id: "children", label: "Children" }, { id: "cardiac", label: "Cardiac" }].map(t => (
                  <button key={t.id} onClick={() => setHospitalType(t.id)} style={{ padding: "7px 12px", borderRadius: 16, fontSize: 11, fontWeight: 700, border: hospitalType === t.id ? "1.5px solid #34D399" : "1.5px solid rgba(255,255,255,0.1)", background: hospitalType === t.id ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.04)", color: hospitalType === t.id ? "#fff" : "rgba(255,255,255,0.45)", cursor: "pointer" }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <button onClick={findHospitals} disabled={!hospitalLocation.trim()} style={{ width: "100%", background: !hospitalLocation.trim() ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #34D399, #059669)", border: "none", borderRadius: 12, color: "#fff", padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: !hospitalLocation.trim() ? 0.5 : 1 }}>
                🏥 Search
              </button>
              {hospitalLoading && <div style={{ marginTop: 12, textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Searching...</div>}
              {hospitals.length > 0 && !hospitalLoading && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  {hospitals.map((h, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: 12, padding: "12px", animation: `slideUp ${0.1 + i * 0.08}s ease` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{h.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, marginBottom: 8 }}>📍 {h.address}</div>
                      {h.phone && h.phone !== "Not available" && (
                        <a href={`tel:${h.phone.replace(/\s/g,"")}`} style={{ display: "block", fontSize: 12, color: "#60A5FA", fontWeight: 700, textDecoration: "none" }}>
                          📞 Call Now
                        </a>
                      )}
                      <a href={`https://www.google.com/maps/search/${encodeURIComponent(h.name + " " + (h.address || hospitalLocation))}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: 12, color: "#34D399", fontWeight: 700, textDecoration: "none", marginTop: 4 }}>
                        🗺️ Open in Maps
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "result" && selected && (
            <div style={{ padding: "16px 18px" }}>
              <button onClick={() => { setTab(selected.type === "emergency" ? "emergency" : "medicine"); setSelected(null); setResponse(""); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "rgba(255,255,255,0.55)", padding: "6px 12px", cursor: "pointer", fontSize: 12, marginBottom: 12 }}>← Back</button>
              <div style={{ background: `linear-gradient(135deg, ${selected.color}20, ${selected.color}05)`, border: `1px solid ${selected.color}30`, borderRadius: 16, padding: "16px", marginBottom: 12 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{selected.icon}</div>
                <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 22, margin: "0 0 4px", letterSpacing: 2 }}>{selected.label.toUpperCase()}</h2>
              </div>
              {loading && <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 12, padding: "20px" }}>Loading...</div>}
              {response && !loading && (
                <div ref={responseRef} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px" }}>
                  {formatResponse(response)}
                  {selected.type === "emergency" && (
                    <div style={{ marginTop: 14, background: "rgba(255,59,71,0.1)", border: "1px solid rgba(255,59,71,0.25)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", margin: 0 }}>🚨 <strong style={{ color: "#FF3B47" }}>1122</strong> 🇵🇰 · <strong style={{ color: "#FF3B47" }}>112</strong> 🇮🇳</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </>
  );
}
