# Affiliate Video Studio Isal — Web Test v6

Versi ini dibuat untuk dites melalui Chrome **setelah backend dijalankan**.

## AI
Menggunakan Google Gemini API + Veo 3.1. Dokumentasi resmi: https://ai.google.dev/gemini-api/docs/veo

Veo 3.1 mendukung image-to-video, portrait 9:16, dan audio native.

## Menjalankan di komputer/server
1. Install Node.js 20+
2. Install FFmpeg jika nanti ingin penggabungan video
3. Jalankan `npm install`
4. Atur environment variable:
   `GEMINI_API_KEY=API_KEY_KAMU`
5. Jalankan `npm start`
6. Buka `http://localhost:8080` di Chrome.

## Deploy online
Upload project ini ke layanan hosting Node.js yang mendukung environment variables.
Set:
`GEMINI_API_KEY`
Start command:
`npm start`

Setelah mendapatkan URL HTTPS, URL tersebut dapat dibuka dari Chrome HP.

Jangan memasukkan API key ke index.html atau APK.
