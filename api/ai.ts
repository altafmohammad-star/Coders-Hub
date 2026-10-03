export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, conversationHistory } = req.body || {};
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.AI_SERVICE_KEY || '';

  if (!geminiApiKey) {
    return res.status(500).json({
      error: 'AI service authentication is not configured. Please set GEMINI_API_KEY or AI_SERVICE_KEY in Vercel Environment Variables.'
    });
  }

  try {
    const contents: any[] = [];
    if (Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text || '' }]
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: message || '' }]
    });

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: `Gemini API returned status ${response.status}: ${errText}`
      });
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || '';

    return res.status(200).json({ text });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
