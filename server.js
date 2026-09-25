import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 10000);
const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna';

app.disable('x-powered-by');
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'ISAL NOVA AI Core', model });
});

app.post('/api/chat', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'AI backend is not configured yet.' });
    }

    const { message, history = [], language = 'en' } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'A message is required.' });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .slice(-12)
          .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
          .map(item => ({ role: item.role, content: item.content.slice(0, 12000) }))
      : [];

    const languageName = String(language || 'en').slice(0, 16);
    const instructions = `You are ISAL NOVA, an AI technology assistant. Be helpful, accurate, clear, and practical. Adapt to the user's context and task. Reply in the user's selected language when possible (language code: ${languageName}). Do not claim to have performed actions or accessed data that you did not actually perform or access.`;

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model,
      instructions,
      input: [
        ...safeHistory,
        { role: 'user', content: message.trim() }
      ]
    });

    const reply = response.output_text?.trim();
    if (!reply) {
      return res.status(502).json({ error: 'The AI returned an empty response.' });
    }

    res.json({ reply, model });
  } catch (error) {
    console.error('ISAL NOVA AI error:', error?.message || error);
    res.status(500).json({ error: 'AI request failed. Please try again.' });
  }
});

app.use(express.static(path.join(__dirname, 'www')));
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`ISAL NOVA AI Core listening on port ${port}`);
});
