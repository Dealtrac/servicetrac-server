const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const callJobs = {};

app.get('/', (req, res) => {
  res.json({ 
    status: 'ServiceTrac AI Call Server running',
    version: '1.0',
    time: new Date().toISOString()
  });
});

app.post('/call-test', async (req, res) => {
  const { to, sid, token, from, leadId, ghlContactId } = req.body;
  if (!to || !sid || !token || !from) {
    return res.status(400).json({ error: 'Missing required fields: to, sid, token, from' });
  }
  const phone = to.replace(/\D/g, '');
  const e164 = phone.length === 10 ? '+1' + phone : '+' + phone;
  try {
    const client = twilio(sid, token);
    const serverUrl = process.env.SERVER_URL || `https://${req.headers.host}`;
    const call = await client.calls.create({
      to: e164,
      from: from,
      twiml: `<Response><Pause length="30"/></Response>`,
      machineDetection: 'DetectMessageEnd',
      asyncAmd: true,
      asyncAmdStatusCallback: `${serverUrl}/call-result`,
      asyncAmdStatusCallbackMethod: 'POST',
    });
    callJobs[call.sid] = { leadId, ghlContactId, phone: e164, startTime: new Date().toISOString() };
    console.log(`Call queued: ${e164} | Lead: ${leadId} | CallSid: ${call.sid}`);
    res.json({ success: true, callSid: call.sid, to: e164 });
  } catch (err) {
    console.error('Twilio error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/call-result', (req, res) => {
  const { CallSid, AnsweredBy, To } = req.body;
  const job = callJobs[CallSid];
  const isVM = AnsweredBy && (AnsweredBy.startsWith('machine') || AnsweredBy === 'fax');
  const isAnswered = AnsweredBy === 'human';
  const result = isVM ? 'VOICEMAIL' : isAnswered ? 'ANSWERED' : 'UNKNOWN';
  console.log(`Call result: ${To} | ${result} | AnsweredBy: ${AnsweredBy} | Lead: ${job?.leadId}`);
  if (job) delete callJobs[CallSid];
  res.sendStatus(200);
});

app.get('/status', (req, res) => {
  res.json({
    pendingCalls: Object.keys(callJobs).length,
    calls: Object.entries(callJobs).map(([sid, job]) => ({
      callSid: sid, leadId: job.leadId, phone: job.phone, startTime: job.startTime
    }))
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ServiceTrac AI Call Server running on port ${PORT}`));
