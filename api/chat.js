const rateLimit = new Map()

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  try {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || "unknown"
    const now = Date.now()
    const limit = rateLimit.get(ip)

    if (limit && now - limit.start < 60000) {
      if (limit.count >= 10) return res.status(429).json({ content: [{ text: "Too many requests. Wait 1 minute." }] })
      limit.count++
    } else {
      rateLimit.set(ip, { count: 1, start: now })
    }

    const { system, messages } = req.body
    const groqMessages = []
    if (system) groqMessages.push({ role: "system", content: system })
    if (messages) messages.forEach(m => groqMessages.push({ role: m.role || "user", content: typeof m.content === "string" ? m.content : m.content?.map(c => c.text || "").join("") || "" }))

    const res2 = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: groqMessages, max_tokens: 600 })
    })

    const data = await res2.json()
    const text = data.choices?.[0]?.message?.content || "No response"
    return res.status(200).json({ content: [{ text }] })
  } catch (err) {
    return res.status(500).json({ content: [{ text: "Server error. Try again." }] })
  }
}
