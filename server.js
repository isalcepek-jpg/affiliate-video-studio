import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 10000);

// Gemini model
const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

app.disable('x-powered-by');

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

// ===============================
// HEALTH CHECK
// ===============================

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'ISAL NOVA AI Core',
    provider: 'Google Gemini',
    model
  });
});

// ===============================
// AI CHAT
// ===============================

app.post('/api/chat', async (req, res) => {
  try {
    // Pastikan Gemini API Key tersedia
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Gemini AI backend is not configured yet.'
      });
    }

    const {
      message,
      history = [],
      language = 'en'
    } = req.body || {};

    // Validasi pesan
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: 'A message is required.'
      });
    }

    // ===============================
    // BERSIHKAN HISTORY
    // ===============================

    const safeHistory = Array.isArray(history)
      ? history
          .slice(-12)
          .filter(
            item =>
              item &&
              (item.role === 'user' || item.role === 'assistant') &&
              typeof item.content === 'string'
          )
          .map(item => ({
            role: item.role === 'assistant' ? 'model' : 'user',
            parts: [
              {
                text: item.content.slice(0, 12000)
              }
            ]
          }))
      : [];

    // ===============================
    // BAHASA
    // ===============================

    const languageCode = String(language || 'en').slice(0, 16);

    const systemInstruction = `
You are ISAL NOVA, an advanced AI technology assistant.

Your responsibilities:
- Be helpful, accurate, clear and practical.
- Understand the user's question and context.
- Help the user step by step when they are building technology.
- Do not claim that you performed an action that you did not actually perform.
- Do not claim to have accessed information that you did not actually access.
- Keep answers understandable.
- When the user asks for technical help, provide concrete instructions.
- Respect the user's selected language.

IMPORTANT LANGUAGE RULE:
Always answer in the language selected by the user.

Selected language code:
${languageCode}

If the user writes in another language but the application language is selected,
follow the selected application language whenever appropriate.
`;

    // ===============================
    // BENTUK CONTENT GEMINI
    // ===============================

    const contents = [
      ...safeHistory,
      {
        role: 'user',
        parts: [
          {
            text: message.trim()
          }
        ]
      }
    ];

    // ===============================
    // REQUEST KE GEMINI
    // ===============================

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: systemInstruction
              }
            ]
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const data = await response.json();

    // ===============================
    // ERROR GEMINI
    // ===============================

    if (!response.ok) {
      console.error(
        'Gemini API error:',
        JSON.stringify(data)
      );

      return res.status(502).json({
        error: 'Gemini AI request failed.'
      });
    }

    // ===============================
    // AMBIL JAWABAN
    // ===============================

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || '')
        .join('')
        .trim();

    if (!reply) {
      console.error(
        'Gemini returned no text:',
        JSON.stringify(data)
      );

      return res.status(502).json({
        error: 'The AI returned an empty response.'
      });
    }

    // ===============================
    // RESPONSE KE APK
    // ===============================

    res.json({
      reply,
      model,
      provider: 'Google Gemini'
    });

  } catch (error) {
    console.error(
      'ISAL NOVA Gemini error:',
      error?.message || error
    );

    res.status(500).json({
      error: 'AI request failed. Please try again.'
    });
  }
});

// ===============================
// STATIC WEB
// ===============================

app.use(
  express.static(
    path.join(__dirname, 'www')
  )
);

app.get('/{*splat}', (_req, res) => {
  res.sendFile(
    path.join(__dirname, 'www', 'index.html')
  );
});

// ===============================
// START SERVER
// ===============================

app.listen(port, '0.0.0.0', () => {
  console.log(
    `ISAL NOVA AI Core listening on port ${port}`
  );
});
