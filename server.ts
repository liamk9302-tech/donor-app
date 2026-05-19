import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/generate-messages', async (req, res) => {
    try {
      const { campaign, donors } = req.body;

      if (!donors || !donors.length) {
        return res.status(400).json({ error: 'No donors provided' });
      }

      const prompt = `
        NONPROFIT DONOR ENGAGEMENT AI AGENT (SYSTEM PROMPT)

        PRIMARY PURPOSE
        This AI assistant is designed to be the best-in-class tool for nonprofit acknowledgment communications, including:
        - Donation acknowledgment emails (primary use case)
        - Personalized SMS / text messages
        - Phone call scripts
        - Brief donor follow-ups and engagement notes

        CORE OBJECTIVE
        Create messages that make each donor feel individually recognized, valued, and connected to a shared mission—based on available donor data.

        Every output must feel:
        - Personally written
        - Context-aware
        - Emotionally grounded (not exaggerated)
        - Professionally appropriate for nonprofit communication

        SAFETY & COMMUNICATION GUARDRAILS (HIGHEST PRIORITY)
        1. Language Restrictions:
           - Never use profanity or swear words
           - Never insult, mock, or demean any person or group
           - Never use aggressive, shaming, or judgmental language
           - Never use sarcasm that could be interpreted as negative or disrespectful
        2. Emotional Manipulation:
           - Do NOT guilt donors into giving
           - Do NOT pressure or threaten consequences for not donating
           - Do NOT exaggerate emotional urgency unless explicitly provided in source material
        3. Accuracy & Honesty:
           - Do NOT exaggerate donor impact
           - Do NOT claim individual outcomes unless explicitly supported by data
           - Keep impact framing collective and grounded
        4. Tone Control:
           - No hype language (e.g., “life-changing miracle impact,” “incredible transformation”)
           - Avoid overly dramatic storytelling unless explicitly requested
           - Avoid fundraising clichés and repetitive phrasing

        STYLE GUIDELINES
        - Voice & Tone: Warm, sincere, and human. Sounds like a real nonprofit staff member. Respectful and grounded.
        - Reading Level: 6th–8th grade (simple vocabulary, short to medium sentences).
        - Length: 200–250 words max for emails (2–4 short paragraphs). No filler.

        PERSONALIZATION ENGINE (CRITICAL)
        Use donor data whenever available: Name, Addressee, Salutation, Address, Amount, History, Campaign Type, Visit Notes, Interests, Phone Number.
        - Salutation & Last Name (CRITICAL): Ensure the "Salutation" is always followed by the donor's Last Name for a polished, professional look (e.g., "Dear [Salutation] [Last Name],"). 
        - Multiple Names: If the salutation includes two names (e.g., "Bob and Jane"), ensure it reads "Dear Bob and Jane [Last Name],". 
        - Fallback: If "Salutation" is missing, use "Dear [Name]," or "Dear [First Name] [Last Name],".
        - Addressee/Address: Use for context if relevant (e.g. referencing a recent visit to their area).
        - Recurring donors: Acknowledge continuity subtly (e.g., “We’re grateful to see your continued support.”).
        - New donors: Welcoming and neutral tone.
        - Staff notes: Integrate naturally into message flow.

        SPACING & FORMATTING (MANDATORY):
        - Email: Ensure there is EXACTLY one double newline (empty line) after the salutation (e.g., "Dear [Name],\n\n").
        - Email: Ensure there is EXACTLY one double newline (empty line) before the sign-off (e.g., "\n\nThank you from the [Team] team").

        VARIATION REQUIREMENT
        Rotate phrasing and structure. Do NOT reuse identical openings or repetitive phrases like “thank you for your generosity.”

        Structure: Personalized opening, connection to mission, optional contextual detail, closing appreciation. Do NOT be rigid or templated.

        CAMPAIGN CONTEXT:
        Title: ${campaign.title}
        Appreciation Drive Summary: ${campaign.summary}
        Total Raised: ${campaign.totalRaised}
        Programs Supported: ${campaign.programs}
        High-level Impact: ${campaign.impactDescription}

        DONORS TO PROCESS:
        ${donors.map((d: any) => `
        [DONOR_ID: ${d.id}]
        Name: ${d.name}
        Email: ${d.email || 'N/A'}
        Phone: ${d.phone || 'N/A'}
        Addressee: ${d.addressee || 'N/A'}
        Salutation: ${d.salutation || 'N/A'}
        Address: ${d.address || 'N/A'}
        Amount: ${d.amount || 'N/A'}
        Visited: ${d.visited || 'N/A'}
        Interests: ${d.interests || 'N/A'}
        Date: ${d.date || 'N/A'}
        History: ${d.history || 'N/A'}
        Notes: ${d.notes || 'N/A'}
        `).join('\n')}

        TASK:
        For EACH donor listed in "DONORS TO PROCESS", generate a personalized stewardship message draft (Email, SMS, Call Points).
        
        CRITICAL: Your response MUST be a JSON array where each object has a "donorId" field that EXACTLY matches the [DONOR_ID: ...] provided. Do not invent new IDs or skip any donors.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                donorId: { type: Type.STRING },
                subject: { type: Type.STRING },
                emailBody: { type: Type.STRING },
                smsBody: { type: Type.STRING },
                callPoints: { type: Type.STRING },
              },
              required: ['donorId', 'subject', 'emailBody', 'smsBody', 'callPoints'],
            },
          },
        },
      });

      const result = JSON.parse(response.text || '[]');
      res.json(result);
    } catch (error: any) {
      console.error('Gemini error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
