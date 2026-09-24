export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const rawText = body.text;

    if (!rawText) {
      return new Response(JSON.stringify({ error: 'Missing text parameter' }), { status: 400 });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Gemini API Key not configured on server' }), { status: 500 });
    }

    const prompt = \
You are an expert receipt parsing AI. 
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

    const geminiRes = await fetch(\https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\\, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      throw new Error('Gemini API Error: ' + errorText);
    }

    const data = await geminiRes.json();
    const aiText = data.candidates[0].content.parts[0].text;
    
    return new Response(aiText, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
