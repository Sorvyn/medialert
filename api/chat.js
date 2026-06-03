export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  try {
    const { messages, system, max_tokens } = req.body;
    
    const groqMessages = [];
    if (system) groqMessages.push({ role: "system", content: system });
    if (messages) groqMessages.push(...messages);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: groqMessages,
        max_tokens: max_tokens || 1000
      })
    });
    
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "No response received";
    res.status(200).json({ content: [{ text }] });
    
  } catch (err) {
    res.status(500).json({ content: [{ text: "Server error: " + err.message }] });
  }
}
