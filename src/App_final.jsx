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

const SYMPTOM_TAGS = [
  "Fever","Headache","Cough","Sore Throat","Chest Pain","Shortness of Breath",
  "Nausea","Vomiting","Diarrhea","Stomach Pain","Dizziness","Fatigue",
  "Body Ache","Rash","Swelling","Joint Pain","Back Pain","Eye Pain",
];

const CSS = `
@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2.2); opacity: 0; }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.15); }
  50% { transform: scale(1); }
  75% { transform: scale(1.08); }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px rgba(255,59,71,0.3); }
  50% { box-shadow: 0 0 40px rgba(255,59,71,0.6); }
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
input::placeholder { color: rgba(255,255,255,0.28); }
textarea::placeholder { color: rgba(255,255,255,0.28); }
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

  // Symptom checker state
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [symptomAge, setSymptomAge] = useState("");
  const [symptomDuration, setSymptomDuration] = useState("");
  const [symptomResult, setSymptomResult] = useState("");
  const [symptomLoading, setSymptomLoading] = useState(false);

  // Hospital finder state
  const [hospitalLocation, setHospitalLocation] = useState("");
  const [hospitalType, setHospitalType] = useState("general");
  const [hospitals, setHospitals] = useState([]);
  const [hospitalLoading, setHospitalLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const responseRef = useRef(null);
  const symptomRef = useRef(null);
  const hospitalRef = useRef(null);

  useEffect(() => {
    if (response && responseRef.current) responseRef.current.scrollIntoView({ behavior: "smooth" });
  }, [response]);
  useEffect(() => {
    if (symptomResult && symptomRef.current) symptomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [symptomResult]);
  useEffect(() => {
    if (hospitals.length && hospitalRef.current) hospitalRef.current.scrollIntoView({ behavior: "smooth" });
  }, [hospitals]);

  const askClaude = async (prompt, type) => {
    setLoading(true); setResponse("");
    try {
      const systemPrompt = type === "emergency"
        ? `You are MediAlert, a calm emergency first-aid assistant. Give:
1. ⚠️ IMMEDIATE ACTIONS (numbered steps to do RIGHT NOW)
2. ❌ WHAT NOT TO DO
3. 🚑 WHEN TO CALL AMBULANCE
4. 💬 CALMING NOTE
Simple English, no jargon. Max 300 words.`
        : `You are MediAlert, a home remedy and OTC medicine advisor. Give:
1. 💊 SUGGESTED OTC MEDICINES (generic names + brands, dosage)
2. 🌿 HOME REMEDIES (3-4 effective ones)
3. ⚠️ WARNING SIGNS (when to see doctor)
4. ✅ DO'S AND DON'TS
Remind: general guidance only. Max 300 words.`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt }],
        }),
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
      const prompt = `Patient symptoms: ${allSymptoms.join(", ")}. ${symptomAge ? `Age: ${symptomAge}.` : ""} ${symptomDuration ? `Duration: ${symptomDuration}.` : ""}`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: `You are MediAlert Symptom Checker. Analyze symptoms and respond with:

🔍 POSSIBLE CONDITIONS (list 2-3 most likely, from most to least probable)
For each condition:
  - Name (with likelihood: High/Medium/Low)
  - Brief explanation (1-2 lines)

⚡ URGENCY LEVEL: (choose one: 🔴 EMERGENCY - go to hospital now / 🟡 MODERATE - see doctor today / 🟢 MILD - home care ok)

💊 IMMEDIATE STEPS (2-3 things to do right now)

⚠️ RED FLAGS (symptoms that mean go to ER immediately)

IMPORTANT: Always end with "This is NOT a diagnosis. Please consult a doctor for proper evaluation." Keep under 350 words. Simple English.`,
          messages: [{ role: "user", content: prompt }],
        }),
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
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: `You are a hospital finder assistant. When given a location, provide a JSON array of real, well-known hospitals in that area. Return ONLY a valid JSON array, no extra text, no markdown, no backticks.

Format:
[
  {
    "name": "Hospital Name",
    "type": "Government/Private/Teaching",
    "address": "Full address",
    "phone": "Phone number or 'Not available'",
    "emergency": true/false,
    "rating": "Good/Excellent/Average",
    "specialty": "General/Cardiac/Children/Trauma etc",
    "distance": "Approx distance from city center or area"
  }
]

Return 5-6 real hospitals. Focus on well-known, reputable ones. If you don't know exact phone numbers, write 'Call 1122 (PK) or 112 (IN)'.`,
          messages: [{ role: "user", content: `Find ${hospitalType === "emergency" ? "emergency" : hospitalType === "children" ? "children's" : hospitalType === "cardiac" ? "cardiac/heart" : "general"} hospitals near: ${hospitalLocation}` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "[]";
      try {
        const cleaned = text.replace(/```json|```/g, "").trim();
        setHospitals(JSON.parse(cleaned));
      } catch { setHospitals([{ name: "Search Error", address: "Could not parse results. Try a more specific location like 'Lahore, Pakistan' or 'Karachi Clifton'", type: "Error", phone: "", emergency: false, rating: "", specialty: "", distance: "" }]); }
    } catch { setHospitals([{ name: "Connection Error", address: "Please check your internet and try again.", type: "Error", phone: "", emergency: false, rating: "", specialty: "", distance: "" }]); }
    setHospitalLoading(false);
  };

  const getLocation = () => {
    setLocationLoading(true);
    if (!navigator.geolocation) { setHospitalLocation("Geolocation not supported"); setLocationLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const d = await r.json();
          const loc = d.address?.city || d.address?.town || d.address?.county || d.display_name?.split(",")[0];
          setHospitalLocation(loc || `${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`);
        } catch { setHospitalLocation(`${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`); }
        setLocationLoading(false);
      },
      () => { setHospitalLocation(""); setLocationLoading(false); alert("Location access denied. Please type your city manually."); }
    );
  };

  const toggleSymptom = (s) => setSelectedSymptoms(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const handleEmergency = (item) => { setSelected({ ...item, type: "emergency" }); setTab("result"); askClaude(`Emergency: ${item.label}. Give immediate first aid steps.`, "emergency"); };
  const handleMedicine = (item) => { setSelected({ ...item, type: "medicine" }); setTab("result"); askClaude(`I have ${item.label}. What home remedies and OTC medicines can help?`, "medicine"); };
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
      const isHeader = /^[1-9]\./.test(line.trim()) || ["⚠️","💊","🌿","🚑","✅","❌","💬","🔍","⚡","🔴","🟡","🟢"].some(e => line.includes(e));
      return <p key={i} style={{ margin: "3px 0", fontSize: isHeader ? 15 : 13.5, fontWeight: isHeader ? 700 : 400, color: isHeader ? "#fff" : "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>{line}</p>;
    });
  };

  const NAV = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "emergency", icon: "🚨", label: "Emergency" },
    { id: "medicine", icon: "💊", label: "Medicine" },
    { id: "symptoms", icon: "🔍", label: "Symptoms" },
    { id: "hospitals", icon: "🏥", label: "Hospitals" },
  ];

  const urgencyColor = (text) => {
    if (text?.includes("🔴")) return "#FF3B47";
    if (text?.includes("🟡")) return "#FBBF24";
    return "#4ADE80";
  };

  return (
    <>
      <style>{CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* TERMS SCREEN */}
      {!termsAccepted && (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 40%, #0a0a0f 100%)", fontFamily: "'DM Sans', sans-serif", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ maxWidth: 420, width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 52, marginBottom: 12, animation: "heartbeat 2s ease infinite" }}>❤️‍🔥</div>
              <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 38, letterSpacing: 4, margin: "0 0 6px", background: "linear-gradient(135deg, #fff 30%, rgba(255,59,71,0.9))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>MEDIALERT</h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0, letterSpacing: 1 }}>AI-POWERED FIRST AID ASSISTANT</p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "20px", marginBottom: 16, maxHeight: 320, overflowY: "auto" }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 2, color: "#FF3B47", marginBottom: 14 }}>⚖️ TERMS OF USE & DISCLAIMER</div>

              {[
                { title: "📋 General Use", text: "MediAlert provides general first aid guidance and health information for educational purposes only. It is NOT a substitute for professional medical advice, diagnosis, or treatment." },
                { title: "⚠️ Not Medical Advice", text: "The information provided by MediAlert is AI-generated and may not be accurate, complete, or applicable to your specific situation. Always consult a qualified doctor or medical professional for proper diagnosis and treatment." },
                { title: "🚨 Emergency Situations", text: "In any life-threatening emergency, ALWAYS call 1122 (Pakistan) or 112 (India) immediately. Do not rely solely on this app in emergencies. Every second counts." },
                { title: "🤖 AI Limitations", text: "MediAlert uses artificial intelligence which can make mistakes. The app does not have access to your medical history, allergies, or current medications. Responses are general in nature." },
                { title: "👨‍⚕️ Professional Consultation", text: "Always seek professional medical advice for any health concerns. Never delay seeking medical treatment because of information obtained from this app." },
                { title: "⚕️ No Liability", text: "The creators of MediAlert accept no responsibility or liability for any harm, injury, loss, or damage arising from the use of this application. Use at your own risk." },
                { title: "🔒 Privacy", text: "Your symptom queries are processed by AI and are not stored permanently. Do not enter personally identifiable information." },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: i < 6 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 5 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{item.text}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(255,59,71,0.08)", border: "1px solid rgba(255,59,71,0.2)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.6, textAlign: "center" }}>
                By tapping <strong style={{ color: "#FF3B47" }}>"I Agree & Continue"</strong> you confirm you have read and understood these terms and agree to use MediAlert responsibly.
              </p>
            </div>

            <button onClick={() => setTermsAccepted(true)} style={{ width: "100%", background: "linear-gradient(135deg, #FF3B47, #cc2230)", border: "none", borderRadius: 16, color: "#fff", padding: "16px", fontSize: 15, fontWeight: 800, cursor: "pointer", letterSpacing: 1, boxShadow: "0 4px 24px rgba(255,59,71,0.4)", marginBottom: 12 }}>
              ✅ I AGREE & CONTINUE
            </button>
            <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>
              For emergencies call 1122 🇵🇰 · 112 🇮🇳
            </p>
          </div>
        </div>
      )}

      {/* MAIN APP */}
      {termsAccepted && (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 40%, #0a0a0f 100%)", fontFamily: "'DM Sans', sans-serif", color: "#fff", position: "relative", overflow: "hidden" }}>

        {/* BG grid */}
        <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: `linear-gradient(rgba(255,59,71,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,59,71,0.04) 1px, transparent 1px)`, backgroundSize: "40px 40px", pointerEvents: "none" }} />
        <div style={{ position: "fixed", top: "-20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(255,59,71,0.1) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

        {/* SOS Modal */}
        {showSOS && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.3s ease" }}>
            <div style={{ background: "linear-gradient(145deg, #1a0505, #2a0808)", border: "2px solid #FF3B47", borderRadius: 24, padding: "36px 28px", textAlign: "center", maxWidth: 340, width: "92%", animation: "glow 1.5s ease infinite" }}>
              <div style={{ fontSize: 56, marginBottom: 10, animation: "heartbeat 1s ease infinite" }}>🚨</div>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 30, color: "#FF3B47", letterSpacing: 3, marginBottom: 14 }}>EMERGENCY NUMBERS</div>

              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "14px 16px", marginBottom: 10, textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#60A5FA", marginBottom: 6 }}>🇵🇰 PAKISTAN</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.9 }}>
                  Emergency / Rescue: <strong style={{ color: "#fff" }}>1122</strong><br />
                  Ambulance (Edhi): <strong style={{ color: "#fff" }}>115</strong><br />
                  Police: <strong style={{ color: "#fff" }}>15</strong><br />
                  Rescue (KPK/Punjab): <strong style={{ color: "#fff" }}>1122</strong><br />
                  Fire Brigade: <strong style={{ color: "#fff" }}>16</strong>
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "14px 16px", marginBottom: 16, textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#F97316", marginBottom: 6 }}>🇮🇳 INDIA</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.9 }}>
                  Emergency: <strong style={{ color: "#fff" }}>112</strong><br />
                  Ambulance: <strong style={{ color: "#fff" }}>108</strong><br />
                  Police: <strong style={{ color: "#fff" }}>100</strong>
                </div>
              </div>

              <div style={{ background: "rgba(255,59,71,0.1)", border: "1px solid rgba(255,59,71,0.25)", borderRadius: 10, padding: "10px 12px", marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: 0 }}>📍 Share your live location on Google Maps with the dispatcher for faster response</p>
              </div>
              <button onClick={() => setShowSOS(false)} style={{ background: "linear-gradient(135deg, #FF3B47, #cc2230)", border: "none", borderRadius: 12, color: "#fff", padding: "13px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%" }}>CLOSE</button>
            </div>
          </div>
        )}

        <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "0 0 90px" }}>

          {/* Header */}
          <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,59,71,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF3B47", position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#FF3B47", animation: "pulse-ring 1.5s ease-out infinite" }} />
                  </div>
                  <span style={{ fontFamily: "'Space Mono'", fontSize: 10, color: "#FF3B47", letterSpacing: 2 }}>AI-POWERED · LIVE</span>
                </div>
                <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 40, margin: 0, letterSpacing: 4, background: "linear-gradient(135deg, #fff 30%, rgba(255,59,71,0.9))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>MEDIALERT</h1>
                <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 11, margin: "3px 0 0", letterSpacing: 0.5 }}>First Aid · Symptoms · Hospitals · Remedies</p>
              </div>
              <button onClick={() => setShowSOS(true)} style={{ background: "linear-gradient(135deg, #FF3B47, #cc2230)", border: "none", borderRadius: 14, color: "#fff", padding: "12px 16px", fontSize: 12, fontWeight: 800, cursor: "pointer", letterSpacing: 1.5, boxShadow: "0 4px 20px rgba(255,59,71,0.4)", animation: "float 3s ease infinite" }}>
                🆘 SOS
              </button>
            </div>
          </div>

          {/* HOME TAB */}
          {tab === "home" && (
            <div style={{ padding: "16px 20px", animation: "slideUp 0.4s ease" }}>
              <div style={{ background: "linear-gradient(135deg, rgba(255,59,71,0.18) 0%, rgba(255,59,71,0.04) 100%)", border: "1px solid rgba(255,59,71,0.22)", borderRadius: 20, padding: "22px 18px", marginBottom: 18, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #FF3B47, transparent)" }} />
                <div style={{ fontSize: 38, marginBottom: 8, animation: "heartbeat 2s ease infinite" }}>❤️‍🔥</div>
                <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 26, margin: "0 0 6px", letterSpacing: 2 }}>STAY CALM. ACT FAST.</h2>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>AI-powered emergency guidance for Pakistan 🇵🇰 & India 🇮🇳. For real emergencies call <strong style={{ color: "#FF3B47" }}>1122</strong> (PK) or <strong style={{ color: "#FF3B47" }}>112</strong> (IN).</p>
              </div>

              <p style={{ fontFamily: "'Space Mono'", fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>ASK ANYTHING</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <input value={customQuery} onChange={e => setCustomQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCustom()} placeholder="e.g. 'My brother has a heart attack...'" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", color: "#fff", fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
                <button onClick={handleCustom} style={{ background: "linear-gradient(135deg, #FF3B47, #cc2230)", border: "none", borderRadius: 12, color: "#fff", padding: "0 18px", fontSize: 18, cursor: "pointer" }}>→</button>
              </div>

              <p style={{ fontFamily: "'Space Mono'", fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>FEATURES</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { tab: "emergency", icon: "🚨", label: "Emergency First Aid", sub: "Instant steps", color: "#FF3B47" },
                  { tab: "medicine", icon: "💊", label: "Home Remedies", sub: "OTC medicines", color: "#60A5FA" },
                  { tab: "symptoms", icon: "🔍", label: "Symptom Checker", sub: "AI diagnosis", color: "#A78BFA" },
                  { tab: "hospitals", icon: "🏥", label: "Find Hospitals", sub: "Near you", color: "#34D399" },
                ].map((f, i) => (
                  <button key={i} onClick={() => setTab(f.tab)} style={{ background: `linear-gradient(145deg, ${f.color}18, ${f.color}06)`, border: `1px solid ${f.color}30`, borderRadius: 16, padding: "16px 14px", color: "#fff", cursor: "pointer", textAlign: "left", animation: `slideUp ${0.3 + i * 0.08}s ease` }}>
                    <div style={{ fontSize: 26, marginBottom: 6 }}>{f.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: f.color, marginTop: 3, fontWeight: 600 }}>{f.sub} →</div>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "11px 14px" }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, lineHeight: 1.6 }}>⚕️ MediAlert provides general guidance only. Always consult a doctor for serious conditions. In life-threatening emergencies, call 1122 (PK) or 112 (IN) immediately.</p>
              </div>
            </div>
          )}

          {/* EMERGENCY TAB */}
          {tab === "emergency" && (
            <div style={{ padding: "16px 20px", animation: "slideUp 0.4s ease" }}>
              <div style={{ background: "rgba(255,59,71,0.08)", border: "1px solid rgba(255,59,71,0.2)", borderRadius: 14, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>🚨</span>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>Select the emergency for <strong style={{ color: "#FF3B47" }}>immediate first-aid steps</strong></p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {EMERGENCIES.map((item, i) => (
                  <button key={item.id} onClick={() => handleEmergency(item)} style={{ background: `linear-gradient(145deg, ${item.color}18, ${item.color}06)`, border: `1px solid ${item.color}35`, borderRadius: 18, padding: "18px 14px", color: "#fff", cursor: "pointer", textAlign: "left", animation: `slideUp ${0.2 + i * 0.06}s ease`, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, right: 0, width: 50, height: 50, background: `radial-gradient(circle, ${item.color}22, transparent)`, borderRadius: "0 18px 0 0" }} />
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{item.label}</div>
                    <div style={{ fontSize: 10, marginTop: 5, color: item.color, fontFamily: "'Space Mono'", letterSpacing: 1 }}>TAP FOR AID →</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MEDICINE TAB */}
          {tab === "medicine" && (
            <div style={{ padding: "16px 20px", animation: "slideUp 0.4s ease" }}>
              <div style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 14, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>💊</span>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>OTC medicines & home remedies for <strong style={{ color: "#60A5FA" }}>common illnesses</strong></p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {MEDICINES.map((item, i) => (
                  <button key={item.id} onClick={() => handleMedicine(item)} style={{ background: `linear-gradient(145deg, ${item.color}18, ${item.color}06)`, border: `1px solid ${item.color}35`, borderRadius: 18, padding: "18px 14px", color: "#fff", cursor: "pointer", textAlign: "left", animation: `slideUp ${0.2 + i * 0.06}s ease`, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, right: 0, width: 50, height: 50, background: `radial-gradient(circle, ${item.color}22, transparent)`, borderRadius: "0 18px 0 0" }} />
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{item.label}</div>
                    <div style={{ fontSize: 10, marginTop: 5, color: item.color, fontFamily: "'Space Mono'", letterSpacing: 1 }}>SEE REMEDIES →</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SYMPTOMS TAB */}
          {tab === "symptoms" && (
            <div style={{ padding: "16px 20px", animation: "slideUp 0.4s ease" }}>
              <div style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.22)", borderRadius: 16, padding: "16px", marginBottom: 18 }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 2, marginBottom: 4 }}>🔍 SYMPTOM CHECKER</div>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, margin: 0 }}>Select your symptoms → AI analyzes possible conditions</p>
              </div>

              {/* Symptom tags */}
              <p style={{ fontFamily: "'Space Mono'", fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>SELECT SYMPTOMS</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {SYMPTOM_TAGS.map(s => (
                  <button key={s} onClick={() => toggleSymptom(s)} style={{ padding: "7px 13px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: selectedSymptoms.includes(s) ? "1.5px solid #A78BFA" : "1.5px solid rgba(255,255,255,0.1)", background: selectedSymptoms.includes(s) ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.04)", color: selectedSymptoms.includes(s) ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.15s" }}>
                    {selectedSymptoms.includes(s) ? "✓ " : ""}{s}
                  </button>
                ))}
              </div>

              {/* Custom symptom */}
              <input value={customSymptom} onChange={e => setCustomSymptom(e.target.value)} placeholder="+ Add custom symptom (e.g. 'pain in left shoulder')" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "11px 14px", color: "#fff", fontSize: 13, outline: "none", marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }} />

              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <input value={symptomAge} onChange={e => setSymptomAge(e.target.value)} placeholder="Age (optional)" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "11px 14px", color: "#fff", fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
                <input value={symptomDuration} onChange={e => setSymptomDuration(e.target.value)} placeholder="Since? (e.g. 2 days)" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "11px 14px", color: "#fff", fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
              </div>

              {selectedSymptoms.length > 0 && (
                <div style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Selected: <strong style={{ color: "#A78BFA" }}>{selectedSymptoms.join(", ")}</strong></p>
                </div>
              )}

              <button onClick={checkSymptoms} disabled={!selectedSymptoms.length && !customSymptom} style={{ width: "100%", background: (!selectedSymptoms.length && !customSymptom) ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #A78BFA, #7C3AED)", border: "none", borderRadius: 14, color: "#fff", padding: "14px", fontSize: 15, fontWeight: 700, cursor: (!selectedSymptoms.length && !customSymptom) ? "not-allowed" : "pointer", letterSpacing: 0.5, marginBottom: 20, opacity: (!selectedSymptoms.length && !customSymptom) ? 0.5 : 1 }}>
                🔍 Analyze Symptoms
              </button>

              {/* Loading */}
              {symptomLoading && (
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 16, padding: "28px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 12, display: "inline-block", animation: "spin 2s linear infinite" }}>🔍</div>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: 0, fontFamily: "'Space Mono'" }}>ANALYZING SYMPTOMS...</p>
                </div>
              )}

              {/* Symptom result */}
              {symptomResult && !symptomLoading && (
                <div ref={symptomRef} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${urgencyColor(symptomResult)}40`, borderRadius: 16, padding: "20px", animation: "fadeIn 0.5s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: urgencyColor(symptomResult), boxShadow: `0 0 8px ${urgencyColor(symptomResult)}` }} />
                    <span style={{ fontFamily: "'Space Mono'", fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.4)" }}>AI ANALYSIS COMPLETE</span>
                  </div>
                  {formatResponse(symptomResult)}
                  <button onClick={() => { setSelectedSymptoms([]); setCustomSymptom(""); setSymptomAge(""); setSymptomDuration(""); setSymptomResult(""); }} style={{ marginTop: 16, width: "100%", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 12, color: "#A78BFA", padding: "11px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                    🔄 Check New Symptoms
                  </button>
                </div>
              )}
            </div>
          )}

          {/* HOSPITALS TAB */}
          {tab === "hospitals" && (
            <div style={{ padding: "16px 20px", animation: "slideUp 0.4s ease" }}>
              <div style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.22)", borderRadius: 16, padding: "16px", marginBottom: 18 }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 2, marginBottom: 4 }}>🏥 FIND HOSPITALS</div>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, margin: 0 }}>Find best hospitals near your location in Pakistan or India</p>
              </div>

              {/* Location input */}
              <p style={{ fontFamily: "'Space Mono'", fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>YOUR LOCATION</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input value={hospitalLocation} onChange={e => setHospitalLocation(e.target.value)} onKeyDown={e => e.key === "Enter" && findHospitals()} placeholder="e.g. Lahore, Pakistan or Karachi Clifton" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", color: "#fff", fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
                <button onClick={getLocation} title="Use my location" style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 12, color: "#34D399", padding: "0 14px", fontSize: 18, cursor: "pointer" }}>
                  {locationLoading ? <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span> : "📍"}
                </button>
              </div>

              {/* Hospital type */}
              <p style={{ fontFamily: "'Space Mono'", fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>HOSPITAL TYPE</p>
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {[
                  { id: "general", label: "🏥 General" },
                  { id: "emergency", label: "🚨 Emergency" },
                  { id: "children", label: "👶 Children" },
                  { id: "cardiac", label: "🫀 Cardiac" },
                ].map(t => (
                  <button key={t.id} onClick={() => setHospitalType(t.id)} style={{ padding: "8px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: hospitalType === t.id ? "1.5px solid #34D399" : "1.5px solid rgba(255,255,255,0.1)", background: hospitalType === t.id ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.04)", color: hospitalType === t.id ? "#fff" : "rgba(255,255,255,0.45)", cursor: "pointer" }}>
                    {t.label}
                  </button>
                ))}
              </div>

              <button onClick={findHospitals} disabled={!hospitalLocation.trim()} style={{ width: "100%", background: !hospitalLocation.trim() ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #34D399, #059669)", border: "none", borderRadius: 14, color: "#fff", padding: "14px", fontSize: 15, fontWeight: 700, cursor: !hospitalLocation.trim() ? "not-allowed" : "pointer", marginBottom: 20, opacity: !hospitalLocation.trim() ? 0.5 : 1 }}>
                🏥 Search Hospitals
              </button>

              {/* Loading */}
              {hospitalLoading && (
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 16, padding: "28px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 12, display: "inline-block", animation: "heartbeat 0.8s ease infinite" }}>🏥</div>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: 0, fontFamily: "'Space Mono'" }}>SEARCHING HOSPITALS...</p>
                </div>
              )}

              {/* Hospital cards */}
              {hospitals.length > 0 && !hospitalLoading && (
                <div ref={hospitalRef} style={{ animation: "fadeIn 0.5s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 8px #34D399" }} />
                    <span style={{ fontFamily: "'Space Mono'", fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.4)" }}>{hospitals.length} HOSPITALS FOUND NEAR {hospitalLocation.toUpperCase()}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {hospitals.map((h, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${h.emergency ? "rgba(255,59,71,0.25)" : "rgba(52,211,153,0.18)"}`, borderRadius: 16, padding: "16px", position: "relative", overflow: "hidden", animation: `slideUp ${0.1 + i * 0.08}s ease` }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${h.emergency ? "#FF3B47" : "#34D399"}, transparent)` }} />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: 4 }}>{h.name}</div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {h.type && <span style={{ fontSize: 10, background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "2px 8px", color: "rgba(255,255,255,0.6)" }}>{h.type}</span>}
                              {h.specialty && <span style={{ fontSize: 10, background: "rgba(52,211,153,0.12)", borderRadius: 6, padding: "2px 8px", color: "#34D399" }}>{h.specialty}</span>}
                              {h.emergency && <span style={{ fontSize: 10, background: "rgba(255,59,71,0.15)", borderRadius: 6, padding: "2px 8px", color: "#FF3B47", fontWeight: 700 }}>🚨 24/7 ER</span>}
                            </div>
                          </div>
                          {h.rating && <div style={{ fontSize: 11, color: h.rating === "Excellent" ? "#FBBF24" : h.rating === "Good" ? "#34D399" : "rgba(255,255,255,0.4)", fontWeight: 700, marginLeft: 8, textAlign: "right" }}>⭐ {h.rating}</div>}
                        </div>
                        {h.address && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, lineHeight: 1.5 }}>📍 {h.address}</div>}
                        {h.distance && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>🗺️ {h.distance}</div>}
                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                          {h.phone && h.phone !== "Not available" && (
                            <a href={`tel:${h.phone.replace(/\s/g,"")}`} style={{ flex: 1, minWidth: 100, textAlign: "center", fontSize: 12, color: "#60A5FA", fontWeight: 700, background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", borderRadius: 10, padding: "8px 10px", textDecoration: "none", display: "block" }}>
                              📞 Call
                            </a>
                          )}
                          <a href={`https://www.google.com/maps/search/${encodeURIComponent(h.name + " " + (h.address || hospitalLocation))}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 100, textAlign: "center", fontSize: 12, color: "#34D399", fontWeight: 700, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 10, padding: "8px 10px", textDecoration: "none", display: "block" }}>
                            🗺️ Open in Maps
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 14px" }}>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>ℹ️ Results are AI-generated. Always call ahead to confirm availability. In emergencies call 1122 (PK) or 112 (IN).</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RESULT TAB */}
          {tab === "result" && selected && (
            <div style={{ padding: "16px 20px", animation: "slideUp 0.4s ease" }}>
              <button onClick={() => { setTab(selected.type === "emergency" ? "emergency" : "medicine"); setSelected(null); setResponse(""); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "rgba(255,255,255,0.55)", padding: "7px 14px", cursor: "pointer", fontSize: 13, marginBottom: 16 }}>← Back</button>
              <div style={{ background: `linear-gradient(135deg, ${selected.color}22, ${selected.color}07)`, border: `1px solid ${selected.color}40`, borderRadius: 20, padding: "20px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${selected.color}, transparent)` }} />
                <div style={{ fontSize: 38, marginBottom: 8 }}>{selected.icon}</div>
                <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 24, margin: "0 0 4px", letterSpacing: 2 }}>{selected.label.toUpperCase()}</h2>
                <span style={{ fontSize: 10, fontFamily: "'Space Mono'", letterSpacing: 1.5, color: selected.color, fontWeight: 700 }}>{selected.type === "emergency" ? "⚡ EMERGENCY PROTOCOL" : "💊 REMEDY GUIDE"}</span>
              </div>

              {loading && (
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "28px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 12, animation: "heartbeat 0.8s ease infinite" }}>{selected.type === "emergency" ? "🫀" : "⚕️"}</div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ height: "100%", width: "60%", background: `linear-gradient(90deg, transparent, ${selected.color}, transparent)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s ease infinite" }} />
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0, fontFamily: "'Space Mono'" }}>{selected.type === "emergency" ? "FETCHING PROTOCOL..." : "ANALYZING REMEDIES..."}</p>
                </div>
              )}

              {response && !loading && (
                <div ref={responseRef} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "20px", animation: "fadeIn 0.5s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 8px #4ADE80" }} />
                    <span style={{ fontFamily: "'Space Mono'", fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.4)" }}>AI RESPONSE READY</span>
                  </div>
                  {formatResponse(response)}
                  {selected.type === "emergency" && (
                    <div style={{ marginTop: 18, background: "rgba(255,59,71,0.1)", border: "1px solid rgba(255,59,71,0.25)", borderRadius: 12, padding: "11px 14px" }}>
                      <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>🚨 Pakistan: <span style={{ color: "#FF3B47", fontFamily: "'Space Mono'" }}>1122</span> &nbsp;|&nbsp; India: <span style={{ color: "#FF3B47", fontFamily: "'Space Mono'" }}>112</span></p>
                    </div>
                  )}
                  <button onClick={() => askClaude(selected.type === "emergency" ? `Emergency: ${selected.label}. Give more detailed steps.` : `${selected.label} - give more home remedy and medicine details`, selected.type)} style={{ marginTop: 14, width: "100%", background: `linear-gradient(135deg, ${selected.color}28, ${selected.color}12)`, border: `1px solid ${selected.color}40`, borderRadius: 12, color: "#fff", padding: "12px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                    🔄 Get More Details
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Nav */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "center" }}>
          <div style={{ maxWidth: 480, width: "100%", background: "rgba(10,10,15,0.96)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "10px 8px 18px", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
            {NAV.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); setResponse(""); }} style={{ background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", padding: "4px 8px", opacity: tab === t.id ? 1 : 0.38, transition: "all 0.2s" }}>
                <span style={{ fontSize: 20 }}>{t.icon}</span>
                <span style={{ fontSize: 9, color: tab === t.id ? "#FF3B47" : "#fff", fontFamily: "'Space Mono'", letterSpacing: 0.8, fontWeight: 700 }}>{t.label.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      )}
    </>
  );
}
