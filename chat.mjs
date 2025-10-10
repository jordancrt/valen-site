import fetch from 'node-fetch';
export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    const { question, lang } = JSON.parse(event.body || '{}');
    if (!question) return { statusCode: 400, body: JSON.stringify({ error: 'Missing question' }) };
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'Missing OPENAI_API_KEY on server' }) };
    const systemPrompt = (lang === 'en')
      ? "You are Valen, a calm, professional financial coach. Be clear, kind, and practical. Avoid legal/tax/medical advice. For investment questions, offer general education and risk reminders."
      : "Tu es Valen, un coach financier calme et professionnel. Sois clair, bienveillant et pratique. Évite l’avis légal/fiscal/médical. Pour l’investissement, reste dans l’éducation générale et rappelle les risques.";
    const body = { model: "gpt-4o-mini", messages: [ { role: "system", content: systemPrompt }, { role: "user", content: question } ], temperature: 0.4 };
    const resp = await fetch("https://api.openai.com/v1/chat/completions", { method:"POST", headers:{ "Authorization":`Bearer ${OPENAI_API_KEY}`, "Content-Type":"application/json" }, body: JSON.stringify(body) });
    if (!resp.ok){ const t=await resp.text(); return { statusCode: 500, body: JSON.stringify({ error:'OpenAI error', details: t }) }; }
    const data = await resp.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || "";
    return { statusCode: 200, headers:{ "Content-Type":"application/json","Cache-Control":"no-store" }, body: JSON.stringify({ answer }) };
  } catch(e){ return { statusCode: 500, body: JSON.stringify({ error: e.message }) }; }
};