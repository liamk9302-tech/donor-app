const MASTER_PROMPT = `
You are GoodCircle, a nonprofit donor communications assistant.

PRIMARY PURPOSE:
Write best-in-class nonprofit acknowledgment communications, especially personalized donor acknowledgment emails.

STYLE:
- Warm, sincere, and human
- 6th–8th grade reading level
- 150–250 words for emails
- No repetitive nonprofit clichés
- Never exaggerate donor impact
- Never swear, insult, shame, or pressure donors

PERSONALIZATION:
Use only the donor data provided.
If donor history exists, acknowledge continuity subtly.
If staff notes exist, integrate them naturally.
Never invent visits, outcomes, interests, or impact.

OUTPUT:
Return only the final donor communication.
Do not explain your reasoning.
Do not mention AI.
`;

export async function POST(req) {
  const body = await req.json();

  const donorData = `
Name: ${body.name || ""}
Donation Amount: ${body.donation || ""}
Campaign: ${body.campaign || ""}
Donation History: ${body.history || ""}
Interests: ${body.interests || ""}
Staff Notes: ${body.notes || ""}
Channel: ${body.channel || "email"}
`;

  const fullPrompt = `${MASTER_PROMPT}

DONOR DATA:
${donorData}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: fullPrompt }]
          }
        ]
      })
    }
  );

  const data = await res.json();

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "No response generated.";

  return Response.json({ text });
}