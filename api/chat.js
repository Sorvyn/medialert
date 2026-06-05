const rateLimit = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Rate limiting - max 10 requests per IP per minute
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, start: now });
  } else {
    const data = rateLimit.get(ip);
    if (now - data.start < windowMs) {
      if (data.count >= maxRequests) {
        return res.status(429).json({ 
          content: [{ text: "⚠️ Too many requests. Please wait 1 minute before trying again." }] 
        });
      }
      data.count++;
    } else {
      rateLimit.set(ip, { count: 1, start: now });
    }
  }

  try {
    const body = req.body;
    const groqMessages = [];
    if (body.system) groqMessages.push({ role: "system", content: body.system });
    if (body.messages && Array.isArray(body.messages)) {
      body.messages.forEach(m => {
        if (typeof m.content === 'string') groqMessages.push({ role: m.role, content: m.content });
        else if (Array.isArray(m.content)) groqMessages.push({ role: m.role, content: m.content.map(c => c.text || '').join('') });
      });
    }
    if (groqMessages.length === 0) return res.status(400).json({ content: [{ text: "No messages provided" }] });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: groqMessages, max_tokens: 1000 })
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "No response received";
    res.status(200).json({ content: [{ text }] });

  } catch (err) {
    res.status(500).json({ content: [{ text: "Server error: " + err.message }] });
  }
}
