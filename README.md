# ServiceTrac AI — Call Test Server

Backend for after-hours voicemail detection via Twilio.

## Deploy on Railway
1. Push this repo to GitHub
2. Go to railway.app → New Project → Deploy from GitHub repo
3. Select this repo — Railway auto-detects Node.js and deploys
4. Settings → Domains → Generate Domain → copy the URL
5. Paste URL into ServiceTrac AI app → Twilio Setup → Backend Server URL

## Endpoints
- GET  /            Health check (open in browser to confirm running)
- POST /call-test   Queue a call test from the app
- POST /call-result Twilio webhook (fires automatically when call completes)
- GET  /status      See pending calls
