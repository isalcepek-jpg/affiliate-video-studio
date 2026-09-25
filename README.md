# ISAL NOVA v11

Your AI. Your Creation.

ISAL = Intelligent System for Adaptive Learning.
NOVA is the platform identity built on top of ISAL.

## v11
- Real OpenAI backend via the Responses API.
- OpenAI API key stays server-side in `OPENAI_API_KEY`.
- Chat UI sends messages to `/api/chat`.
- Render can serve both the frontend and API from the same web service.
- Default model: `gpt-5.6-luna` (override with `OPENAI_MODEL`).
- 14-language UI and global light/dark theme from v10 are preserved.
- APK build workflow updated to Node 22.

## Render
- Build Command: `npm install`
- Start Command: `npm start`
- Environment variable: `OPENAI_API_KEY` = your secret API key
- Optional: `OPENAI_MODEL` = `gpt-5.6-luna`

Never put the OpenAI API key in the Android app or frontend source.
