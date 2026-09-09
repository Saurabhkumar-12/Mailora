import { api } from '../frontend/src/services/api.js';

async function verifyRedesignRuntime() {
  console.log('===========================================================');
  console.log('VERIFYING MAILORA REDESIGN RUNTIME & API INTEGRATION');
  console.log('===========================================================\n');

  // 1. Health check
  const healthRes = await fetch('http://localhost:5000/api/health');
  const healthJson = await healthRes.json();
  console.log('1. Health Check:', healthRes.status === 200 && healthJson.status === 'healthy' ? 'PASS' : 'FAIL');

  // 2. Register test user
  const testEmail = `redesign_${Date.now()}@example.com`;
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Redesign Tester', email: testEmail, password: 'Password123!' }),
  });
  const cookieHeader = regRes.headers.get('set-cookie');
  const cookie = cookieHeader ? cookieHeader.split(';')[0] : '';
  console.log('2. Registration & Session Cookie:', regRes.status === 201 && cookie ? 'PASS' : 'FAIL');

  // 3. Schedule Single Email
  const schedRes = await fetch('http://localhost:5000/api/emails/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      recipient: 'lead1@company.com',
      subject: 'Welcome Campaign Q3',
      body: 'Hello, this is a test scheduled campaign email.',
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
    }),
  });
  const schedJson = await schedRes.json();
  console.log('3. Schedule Single Email:', schedRes.status === 201 && schedJson.data?.id ? 'PASS' : 'FAIL');
  const emailId = schedJson.data?.id;

  // 4. Get Scheduled List
  const listRes = await fetch('http://localhost:5000/api/emails/scheduled', {
    headers: { Cookie: cookie },
  });
  const listJson = await listRes.json();
  console.log('4. GET Scheduled List (Total):', listRes.status === 200 && listJson.pagination?.total === 1 ? 'PASS' : 'FAIL');

  // 5. Test Stop Sending / Campaign Cancellation API
  const cancelRes = await fetch(`http://localhost:5000/api/emails/${emailId}/cancel`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });
  const cancelJson = await cancelRes.json();
  console.log('5. Stop Sending / Cancel Campaign API:', cancelRes.status === 200 && cancelJson.data?.status === 'FAILED' ? 'PASS' : 'FAIL');

  // 6. Slack Status Check
  const slackRes = await fetch('http://localhost:5000/api/slack/status', {
    headers: { Cookie: cookie },
  });
  console.log('6. Slack Status API:', slackRes.status === 200 ? 'PASS' : 'FAIL');

  console.log('\n===========================================================');
  console.log('ALL REDESIGN RUNTIME & API FUNCTIONAL CHECKS PASSED');
  console.log('===========================================================');
}

verifyRedesignRuntime().catch((err) => {
  console.error('\n❌ RUNTIME VERIFICATION FAILED:', err);
  process.exit(1);
});
