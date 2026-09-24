export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const rawText = body.text;

    if (!rawText) {
      return new Response(JSON.stringify({ error: 'Missing text parameter' }), { status: 400 });
    }

    const apiKey = env.GROQ_API_KEY || env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI API Key not configured on server (Missing GROQ_API_KEY)' }), { status: 500 });
    }

    const prompt = \
Extract the list of ordered food/drink items from the following raw OCR text of a restaurant receipt.
Ignore taxes, subtotals, service charges, tips, and header/footer garbage.
Return ONLY a valid JSON object matching this schema:
{
  "restaurantName": "Name of the restaurant (if found, else null)",
  "items": [
    {
      "name": "Cleaned up item name",
      "quantity": number (default to 1 if unknown),
      "totalPrice": number (the final price for this row, e.g., 90.00)
    }
  ],
  "grandTotal": number (the final total of the entire receipt, including taxes, e.g., 2773.00)
}

RAW OCR TEXT:
\
\;

    // If it's a Groq key (starts with gsk_)
    if (apiKey.startsWith('gsk_')) {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': \Bearer \\,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            { role: 'system', content: 'You are an expert receipt parsing AI. Return ONLY a raw, valid JSON object without any markdown formatting.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        })
      });

      if (!groqRes.ok) {
        throw new Error('Groq API Error: ' + await groqRes.text());
      }

      const data = await groqRes.json();
      return new Response(data.choices[0].message.content, {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fallback to Gemini if it's not a Groq key
    const geminiRes = await fetch(\https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\\, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    if (!geminiRes.ok) {
      throw new Error('Gemini API Error: ' + await geminiRes.text());
    }

    const data = await geminiRes.json();
    return new Response(data.candidates[0].content.parts[0].text, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
