import { useState, useRef, useEffect } from "react"

const EMERGENCIES = [
  { id: "heart", icon: "🫀", label: "Heart Attack", color: "#FF3B47" },
  { id: "burn", icon: "🔥", label: "Burns", color: "#FF7A00" },
  { id: "choking", icon: "🫁", label: "Choking", color: "#FF5733" },
  { id: "fracture", icon: "🦴", label: "Fracture", color: "#A78BFA" },
  { id: "bleeding", icon: "🩸", label: "Heavy Bleeding", color: "#EF4444" },
  { id: "seizure", icon: "⚡", label: "Seizure", color: "#FBBF24" },
  { id: "fainting", icon: "😵", label: "Fainting", color: "#60A5FA" },
  { id: "allergic", icon: "🤧", label: "Allergic Reaction", color: "#34D399" },
]

const MEDICINES = [
  { id: "fever", icon: "🌡️", label: "Fever", color: "#F97316" },
  { id: "cold", icon: "🤧", label: "Cold & Flu", color: "#38BDF8" },
  { id: "headache", icon: "🤕", label: "Headache", color: "#818CF8" },
  { id: "stomach", icon: "🤢", label: "Stomach Ache", color: "#4ADE80" },
  { id: "acidity", icon: "🔥", label: "Acidity", color: "#FB923C" },
  { id: "diarrhea", icon: "💊", label: "Diarrhea", color: "#A3E635" },
  { id: "sprain", icon: "🦵", label: "Sprain/Pain", color: "#F472B6" },
  { id: "insomnia", icon: "😴", label: "Sleep Issues", color: "#C084FC" },
]

const SYMPTOMS = ["Fever","Headache","Cough","Sore Throat","Chest Pain","Shortness of Breath","Nausea","Vomiting","Diarrhea","Stomach Pain","Dizziness","Fatigue","Body Ache","Rash","Swelling","Joint Pain","Back Pain","Eye Pain"]

export default function App() {
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [tab, setTab] = useState("home")
  const [selected, setSelected] = useState(null)
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)
  const [customQuery, setCustomQuery] = useState("")
  const [showSOS, setShowSOS] = useState(false)
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [customSymptom, setCustomSymptom] = useState("")
  const [symptomResult, setSymptomResult] = useState("")
  const [symptomLoading, setSymptomLoading] = useState(false)
  const [hospitalLocation, setHospitalLocation] = useState("")
  const [hospitalType, setHospitalType] = useState("general")
  const [hospitals, setHospitals] = useState([])
  const [hospitalLoading, setHospitalLoading] = useState(false)

  const callAPI = async (system, userMessage) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system,
        messages: [{ role: "user", content: userMessage }]
      })
    })
    if (!res.ok) throw new Error("API error")
    const data = await res.json()
    return data.content?.[0]?.text || "No response"
  }

  const handleEmergency = async (item) => {
    setSelected({ ...item, type: "emergency" })
    setTab("result")
    setLoading(true)
    setResponse("")
    try {
      const text = await callAPI(
        `You are CareAlert emergency assistant. Give clear numbered action steps only. 
Rules:
- Step 1 is ALWAYS calling emergency number
- Each step is ONE clear action
- Max 8 steps
- No theory, no explanations, just what to DO
- Keep each step under 15 words
- Format: 1. Action here`,
        `Emergency situation: ${item.label}. What are the immediate action steps?`
      )
      setResponse(text)
    } catch { setResponse("⚠️ Connection error. Try again.") }
    setLoading(false)
  }

  const handleMedicine = async (item) => {
    setSelected({ ...item, type: "medicine" })
    setTab("result")
    setLoading(true)
    setResponse("")
    try {
      const text = await callAPI(
        `You are CareAlert medical advisor. Give:
MEDICINES: Name (dosage for adult)
HOME REMEDIES: 3 simple effective ones
WARNING: 2 signs that need doctor immediately
Keep each point under 15 words. No long paragraphs.`,
        `What medicines and home remedies for: ${item.label}`
      )
      setResponse(text)
    } catch { setResponse("⚠️ Connection error. Try again.") }
    setLoading(false)
  }

  const handleCustom = async () => {
    if (!customQuery.trim()) return
    const isEmergency = /emergency|accident|bleeding|attack|unconscious|faint|broke|fracture|burn|chok/.test(customQuery.toLowerCase())
    setSelected({ label: customQuery, icon: "💬", color: "#60A5FA", type: isEmergency ? "emergency" : "medicine" })
    setTab("result")
    setLoading(true)
    setResponse("")
    try {
      const system = isEmergency
        ? `Give numbered action steps only. Step 1 is always call 1122 (PK) or 112 (IN). Max 8 steps. No theory.`
        : `Give medicines with dosage, 3 home remedies, 2 warning signs. Keep each point short.`
      const text = await callAPI(system, customQuery)
      setResponse(text)
    } catch { setResponse("⚠️ Connection error. Try again.") }
    setLoading(false)
    setCustomQuery("")
  }

  const checkSymptoms = async () => {
    const all = [...selectedSymptoms, ...(customSymptom ? [customSymptom] : [])]
    if (!all.length) return
    setSymptomLoading(true)
    setSymptomResult("")
    try {
      const text = await callAPI(
        `Analyze symptoms and give:
POSSIBLE CONDITIONS: list 2-3 with likelihood
URGENCY: Emergency / See Doctor Today / Home Care OK
STEPS: 3 immediate things to do now
RED FLAGS: 2 signs to go ER immediately
Keep each point under 15 words.`,
        `Patient symptoms: ${all.join(", ")}`
      )
      setSymptomResult(text)
    } catch { setSymptomResult("⚠️ Connection error. Try again.") }
    setSymptomLoading(false)
  }

  const findHospitals = async () => {
    if (!hospitalLocation.trim()) return
    setHospitalLoading(true)
    setHospitals([])
    try {
      const text = await callAPI(
        `Return ONLY valid JSON array. No text outside JSON. No markdown.
Format: [{"name":"Hospital Name","address":"Full address","phone":"number","emergency":true}]`,
        `Find ${hospitalType} hospitals in ${hospitalLocation}. Return 5 results.`
      )
      const cleaned = text.replace(/```json|```/g, "").trim()
      setHospitals(JSON.parse(cleaned))
    } catch {
      setHospitals([{ name: "Try again with full location", address: "Example: Lahore, Pakistan", phone: "", emergency: false }])
    }
    setHospitalLoading(false)
  }

  const toggle = (s) => setSelectedSymptoms(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const formatSteps = (text) => {
    if (!text) return null
    return text.split("\n").map((line, i) => {
      if (!line.trim()) return <div key={i} style={{ height: 4 }} />
      const isStep = /^[1-9]\./.test(line.trim())
      const isSection = /^(MEDICINES|HOME REMEDIES|WARNING|POSSIBLE|URGENCY|STEPS|RED FLAGS|IMMEDIATE)/i.test(line.trim())
      return (
        <p key={i} style={{
          margin: "5px 0",
          fontSize: isStep ? 15 : isSection ? 13 : 13,
          fontWeight: isSection ? 700 : 400,
          color: isSection ? "#FF3B47" : "#ffffff",
          lineHeight: 1.8,
          paddingLeft: isStep ? 4 : 0
        }}>
          {line}
        </p>
      )
    })
  }

  const S = {
    page: { minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "system-ui, sans-serif", paddingBottom: 90 },
    header: { padding: "18px 16px 12px", borderBottom: "1px solid rgba(255,59,71,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" },
    sos: { background: "linear-gradient(135deg, #FF3B47, #cc2230)", border: "none", borderRadius: 12, color: "#fff", padding: "10px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer" },
    tabs: { display: "flex", padding: "10px 14px", gap: 6 },
    tab: (active) => ({ flex: 1, padding: "9px 4px", borderRadius: 10, fontSize: 18, border: active ? "1.5px solid #FF3B47" : "1.5px solid rgba(255,255,255,0.08)", background: active ? "rgba(255,59,71,0.12)" : "transparent", cursor: "pointer" }),
    content: { padding: "14px 16px", maxWidth: 480, margin: "0 auto" },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    card: (color) => ({ background: `linear-gradient(145deg, ${color}15, ${color}05)`, border: `1px solid ${color}30`, borderRadius: 14, padding: "14px 12px", color: "#fff", cursor: "pointer", textAlign: "left", width: "100%" }),
    input: { width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "11px 12px", color: "#fff", fontSize: 13, outline: "none", fontFamily: "system-ui, sans-serif" },
    btn: (color) => ({ width: "100%", background: `linear-gradient(135deg, ${color}, ${color}bb)`, border: "none", borderRadius: 12, color: "#fff", padding: "13px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 10 }),
    result: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "16px", marginTop: 12 },
    overlay: { position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center" },
    modal: { background: "#1a0505", border: "2px solid #FF3B47", borderRadius: 20, padding: "28px 20px", textAlign: "center", maxWidth: 300, width: "92%" },
    bottomNav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(10,10,15,0.97)", backdropFilter: "blur(10px)", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "10px 8px 16px", display: "flex", justifyContent: "space-around" },
    navBtn: (active) => ({ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", opacity: active ? 1 : 0.38 }),
    tagBtn: (active) => ({ padding: "6px 11px", borderRadius: 16, fontSize: 11, fontWeight: 600, border: active ? "1.5px solid #A78BFA" : "1.5px solid rgba(255,255,255,0.12)", background: active ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.04)", color: active ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer" }),
  }

  if (!termsAccepted) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 400, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>❤️‍🔥</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: 2 }}>CAREALERT</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 }}>AI FIRST AID ASSISTANT</p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "14px", marginBottom: 14, maxHeight: 280, overflowY: "auto" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#FF3B47", marginBottom: 10 }}>⚖️ Terms & Privacy</p>
          {[
            "NOT medical advice — always call 1122 (PK) / 112 (IN) for emergencies",
            "AI responses may be incorrect — consult a real doctor for diagnosis",
            "No personal data stored — each request is temporary and deleted",
            "No personal information collected from users",
            "No liability accepted — use at your own risk"
          ].map((t, i) => (
            <p key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", margin: "7px 0", lineHeight: 1.6 }}>✓ {t}</p>
          ))}
        </div>
        <button onClick={() => setTermsAccepted(true)} style={{ ...S.btn("#FF3B47"), marginTop: 0 }}>✅ I AGREE & CONTINUE</button>
        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 10 }}>Emergency: 1122 🇵🇰 · 112 🇮🇳</p>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      {showSOS && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🚨</div>
            <h2 style={{ color: "#FF3B47", fontSize: 22, margin: "0 0 12px", fontWeight: 800 }}>EMERGENCY</h2>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 2.2, marginBottom: 16, textAlign: "left" }}>
              🇵🇰 Rescue: <strong style={{ color: "#fff" }}>1122</strong><br/>
              🇵🇰 Ambulance (Edhi): <strong style={{ color: "#fff" }}>115</strong><br/>
              🇵🇰 Police: <strong style={{ color: "#fff" }}>15</strong><br/>
              🇮🇳 Emergency: <strong style={{ color: "#fff" }}>112</strong><br/>
              🇮🇳 Ambulance: <strong style={{ color: "#fff" }}>108</strong>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>Share live location on Google Maps with dispatcher</p>
            <button onClick={() => setShowSOS(false)} style={{ ...S.btn("#FF3B47"), marginTop: 0 }}>CLOSE</button>
          </div>
        </div>
      )}

      <div style={S.header}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: 2 }}>CAREALERT</h1>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>AI FIRST AID</p>
        </div>
        <button style={S.sos} onClick={() => setShowSOS(true)}>🆘 SOS</button>
      </div>

      <div style={S.tabs}>
        {[["home","🏠"],["emergency","🚨"],["medicine","💊"],["symptoms","🔍"],["hospitals","🏥"]].map(([id, icon]) => (
          <button key={id} style={S.tab(tab === id)} onClick={() => { setTab(id); setSelected(null); setResponse("") }}>{icon}</button>
        ))}
      </div>

      {tab === "home" && (
        <div style={S.content}>
          <div style={{ background: "rgba(255,59,71,0.1)", border: "1px solid rgba(255,59,71,0.2)", borderRadius: 14, padding: "16px", marginBottom: 14 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>STAY CALM. ACT FAST.</h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0 }}>For life-threatening emergencies call <strong style={{ color: "#FF3B47" }}>1122</strong> 🇵🇰 or <strong style={{ color: "#FF3B47" }}>112</strong> 🇮🇳 immediately.</p>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input value={customQuery} onChange={e => setCustomQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCustom()} placeholder="e.g. My brother has a heart attack..." style={{ ...S.input, flex: 1 }} />
            <button onClick={handleCustom} style={{ background: "#FF3B47", border: "none", borderRadius: 10, color: "#fff", padding: "0 16px", fontSize: 18, cursor: "pointer" }}>→</button>
          </div>
          <div style={S.grid2}>
            {[["emergency","🚨","Emergency","#FF3B47"],["medicine","💊","Medicine","#60A5FA"],["symptoms","🔍","Symptoms","#A78BFA"],["hospitals","🏥","Hospitals","#34D399"]].map(([id, icon, label, color]) => (
              <button key={id} onClick={() => setTab(id)} style={S.card(color)}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div>
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 16, textAlign: "center", lineHeight: 1.5 }}>⚕️ General guidance only. Not medical advice. Consult a doctor for serious conditions.</p>
        </div>
      )}

      {tab === "emergency" && (
        <div style={S.content}>
          <div style={{ background: "rgba(255,59,71,0.08)", border: "1px solid rgba(255,59,71,0.15)", borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0 }}>🚨 Tap emergency type for immediate action steps</p>
          </div>
          <div style={S.grid2}>
            {EMERGENCIES.map(item => (
              <button key={item.id} onClick={() => handleEmergency(item)} style={S.card(item.color)}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{item.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "medicine" && (
        <div style={S.content}>
          <div style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.15)", borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0 }}>💊 OTC medicines and home remedies for common illnesses</p>
          </div>
          <div style={S.grid2}>
            {MEDICINES.map(item => (
              <button key={item.id} onClick={() => handleMedicine(item)} style={S.card(item.color)}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{item.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "symptoms" && (
        <div style={S.content}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>Select your symptoms:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {SYMPTOMS.map(s => (
              <button key={s} onClick={() => toggle(s)} style={S.tagBtn(selectedSymptoms.includes(s))}>{selectedSymptoms.includes(s) ? "✓ " : ""}{s}</button>
            ))}
          </div>
          <input value={customSymptom} onChange={e => setCustomSymptom(e.target.value)} placeholder="+ Add other symptom" style={{ ...S.input, marginBottom: 8 }} />
          <button onClick={checkSymptoms} disabled={!selectedSymptoms.length && !customSymptom} style={{ ...S.btn("#A78BFA"), opacity: (!selectedSymptoms.length && !customSymptom) ? 0.5 : 1 }}>
            🔍 Analyze Symptoms
          </button>
          {symptomLoading && <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 14 }}>Analyzing symptoms...</p>}
          {symptomResult && !symptomLoading && <div style={S.result}>{formatSteps(symptomResult)}</div>}
        </div>
      )}

      {tab === "hospitals" && (
        <div style={S.content}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Enter your city to find nearby hospitals:</p>
          <input value={hospitalLocation} onChange={e => setHospitalLocation(e.target.value)} onKeyDown={e => e.key === "Enter" && findHospitals()} placeholder="e.g. Lahore, Pakistan" style={{ ...S.input, marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {["general","emergency","children","cardiac"].map(t => (
              <button key={t} onClick={() => setHospitalType(t)} style={{ padding: "6px 12px", borderRadius: 14, fontSize: 11, fontWeight: 700, border: hospitalType === t ? "1.5px solid #34D399" : "1.5px solid rgba(255,255,255,0.12)", background: hospitalType === t ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.04)", color: hospitalType === t ? "#fff" : "rgba(255,255,255,0.45)", cursor: "pointer" }}>{t}</button>
            ))}
          </div>
          <button onClick={findHospitals} disabled={!hospitalLocation.trim()} style={{ ...S.btn("#34D399"), opacity: !hospitalLocation.trim() ? 0.5 : 1 }}>🏥 Search Hospitals</button>
          {hospitalLoading && <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 14 }}>Searching hospitals...</p>}
          {hospitals.length > 0 && !hospitalLoading && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {hospitals.map((h, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: 12, padding: "12px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{h.name}</div>
                  {h.emergency && <span style={{ fontSize: 10, background: "rgba(255,59,71,0.15)", color: "#FF3B47", padding: "2px 8px", borderRadius: 6, fontWeight: 700, marginBottom: 6, display: "inline-block" }}>🚨 24/7 ER</span>}
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 8, lineHeight: 1.5 }}>📍 {h.address}</div>
                  {h.phone && <div style={{ fontSize: 12, color: "#60A5FA", marginBottom: 6 }}>📞 {h.phone}</div>}
                  <a href={`https://www.google.com/maps/search/${encodeURIComponent(h.name + " " + (h.address || hospitalLocation))}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#34D399", fontWeight: 700, textDecoration: "none" }}>🗺️ Open in Maps</a>
                </div>
              ))}
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>Results are AI-generated. Call ahead to confirm.</p>
            </div>
          )}
        </div>
      )}

      {tab === "result" && selected && (
        <div style={S.content}>
          <button onClick={() => { setTab(selected.type === "emergency" ? "emergency" : "medicine"); setSelected(null); setResponse("") }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "rgba(255,255,255,0.5)", padding: "6px 12px", cursor: "pointer", fontSize: 12, marginBottom: 12 }}>← Back</button>
          <div style={{ background: `${selected.color}15`, border: `1px solid ${selected.color}30`, borderRadius: 14, padding: "14px", marginBottom: 12 }}>
            <div style={{ fontSize: 30, marginBottom: 6 }}>{selected.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1 }}>{selected.label.toUpperCase()}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{selected.type === "emergency" ? "⚡ EMERGENCY PROTOCOL" : "💊 REMEDY GUIDE"}</div>
          </div>
          {loading && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Loading...</p>
            </div>
          )}
          {response && !loading && (
            <div style={S.result}>
              {formatSteps(response)}
              {selected.type === "emergency" && (
                <div style={{ marginTop: 16, background: "rgba(255,59,71,0.1)", borderRadius: 10, padding: "12px", textAlign: "center" }}>
                  <p style={{ fontSize: 13, margin: 0, fontWeight: 700 }}>🚨 Pakistan: <span style={{ color: "#FF3B47" }}>1122</span> · India: <span style={{ color: "#FF3B47" }}>112</span></p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={S.bottomNav}>
        {[["home","🏠","Home"],["emergency","🚨","Emergency"],["medicine","💊","Medicine"],["symptoms","🔍","Symptoms"],["hospitals","🏥","Hospitals"]].map(([id, icon, label]) => (
          <button key={id} style={S.navBtn(tab === id)} onClick={() => { setTab(id); setSelected(null); setResponse("") }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ fontSize: 8, color: tab === id ? "#FF3B47" : "#fff", fontWeight: 700 }}>{label.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
