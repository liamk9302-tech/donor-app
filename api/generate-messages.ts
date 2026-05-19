export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { donors, campaignSummary } = req.body;

    if (!donors || !Array.isArray(donors)) {
      return res.status(400).json({
        error: "Donors array is required"
      });
    }

    const donorContext = donors
      .map((d: any, index: number) => {
        return `
DONOR ${index + 1}
Name: ${d.name || ""}
Email: ${d.email || ""}
Donation Amount: ${d.amount || ""}
Campaign: ${d.campaign || ""}
Notes: ${d.notes || ""}
Interests: ${d.interests || ""}
Donation History: ${d.history || ""}
`;
      })
      .join("\n");

    const prompt = `
You are GoodCircle, an AI nonprofit donor stewardship assistant.

Your role:
Generate warm, thoughtful, emotionally intelligent donor stewardship communications for nonprofit organizations.

IMPORTANT RULES:
- Never fabricate impact
- Never invent donor actions
- Never exaggerate
- Never sound robotic
- Never use corporate jargon
- Keep tone elegant, warm, concise, and human
- Avoid guilt-based fundraising language
- Make each message feel personal
- Use only provided donor information

Campaign Summary:
${campaignSummary || "General stewardship outreach"}

Donor Data:
${donorContext}

For EACH donor generate:
1. A donor thank-you email
2. A short SMS version
3. A short call script for staff

Return ONLY valid JSON in this exact format:

{
  "messages": [
    {
      "donorName": "Jane Smith",
      "email": "Full email text",
      "sms": "Short SMS text",
      "callScript": "Call script"
    }
  ]
}
`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            maxOutputTokens: 4096
          }
        })
      }
    );

    const rawData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API Error:", rawData);

      return res.status(500).json({
        error:
          rawData?.error?.message ||
          "Gemini request failed"
      });
    }

    const text =
      rawData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!text) {
      return res.status(500).json({
        error: "Empty Gemini response"
      });
    }

    let parsed;

    try {
      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);

      parsed = {
        messages: [
          {
            donorName: donors?.[0]?.name || "Donor",
            email: text,
            sms: "",
            callScript: ""
          }
        ]
      };
    }

    return res.status(200).json(parsed);

  } catch (error: any) {
    console.error("Server Error:", error);

    return res.status(500).json({
      error: error?.message || "Internal server error"
    });
  }
}