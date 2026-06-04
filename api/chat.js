export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  try {
    const body = req.body;
    const groqMessages = [];
    
    if (body.system) groqMessages.push({ role: "system", content: body.system });
    
    if (body.messages && Array.isArray(body.messages)) {
      body.messages.forEach(m => {
        if (typeof m.content === 'string') {
          groqMessages.push({ role: m.role, content: m.content });
        } else if (Array.isArray(m.content)) {
          const text = m.content.map(c => c.text || '').join('');
          groqMessages.push({ role: m.role, content: text });
        }
      });
    }

    if (groqMessages.length === 0) {
      return res.status(400).json({ content: [{ text: "No messages provided" }] });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: groqMessages,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "No response received";
    res.status(200).json({ content: [{ text }] });

  } catch (err) {
    res.status(500).json({ content: [{ text: "Server error: " + err.message }] });
  }
}
