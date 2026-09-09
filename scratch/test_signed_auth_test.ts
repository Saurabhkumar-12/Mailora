import cookieParser from 'cookie-parser';
import { env } from '../backend/src/config/env.js';

async function testSignedCookieAuth() {
  console.log('Testing signed cookie authentication...');

  // 1. Register test user
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Cookie Tester', email: `cookie_${Date.now()}@example.com`, password: 'Password123!' }),
  });

  const rawCookieHeader = regRes.headers.get('set-cookie');
  console.log('Raw set-cookie header received from server:', rawCookieHeader);

  // Send the EXACT set-cookie value back to the backend
  const cookieValue = rawCookieHeader ? rawCookieHeader.split(';')[0] : '';

  // 2. Schedule email
  const schedRes = await fetch('http://localhost:5000/api/emails/schedule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieValue,
    },
    body: JSON.stringify({
      recipient: 'test_lead@company.com',
      subject: 'Signed Cookie Campaign',
      body: 'Testing email dispatch with signed session cookie.',
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
    }),
  });

  const schedJson = await schedRes.json();
  console.log('Schedule Response Status:', schedRes.status);
  console.log('Schedule Response Body:', JSON.stringify(schedJson));

  if (schedRes.status === 201 && schedJson.data?.id) {
    console.log('✔ Email scheduling succeeded! Email ID:', schedJson.data.id);

    // Test cancellation
    const cancelRes = await fetch(`http://localhost:5000/api/emails/${schedJson.data.id}/cancel`, {
      method: 'POST',
      headers: { 'Cookie': cookieValue },
    });
    const cancelJson = await cancelRes.json();
    console.log('Cancel Response Status:', cancelRes.status);
    console.log('Cancel Response Body:', JSON.stringify(cancelJson));
  }
}

testSignedCookieAuth().catch(console.error);
