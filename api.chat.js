export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: req.body.messages,
      max_tokens: 1000
    })
  });
  const data = await response.json();
  const result = { content: [{ text: data.choices?.[0]?.message?.content || "Error" }] };
  res.status(200).json(result);
}
