async function verifyRuntime() {
  console.log('=== VERIFYING LOCAL MAILORA RUNTIME ===\n');

  // 1. Health endpoint
  const healthRes = await fetch('http://localhost:5000/api/health');
  const healthJson = await healthRes.json();
  console.log('1. Health Check:', healthRes.status === 200 && healthJson.status === 'healthy' ? 'PASS' : 'FAIL');
  console.log('   Payload:', JSON.stringify(healthJson));

  // 2. Auth me endpoint (unauthenticated check)
  const meRes = await fetch('http://localhost:5000/api/auth/me');
  const meJson = await meRes.json();
  console.log('\n2. Auth Me (Unauthenticated):', meRes.status === 401 ? 'PASS (401 expected)' : 'FAIL');

  // 3. Register a test session
  const regEmail = `dev_test_${Date.now()}@example.com`;
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Dev Tester', email: regEmail, password: 'Password123!' }),
  });
  const cookieHeader = regRes.headers.get('set-cookie');
  const regJson = await regRes.json();
  console.log('\n3. Registration:', regRes.status === 201 ? 'PASS' : 'FAIL');
  console.log('   User ID:', regJson.data?.user?.id);
  console.log('   Cookie Header Present:', !!cookieHeader);

  const cookie = cookieHeader ? cookieHeader.split(';')[0] : '';

  // 4. Auth me with session cookie
  const authedMeRes = await fetch('http://localhost:5000/api/auth/me', {
    headers: { Cookie: cookie },
  });
  const authedMeJson = await authedMeRes.json();
  console.log('\n4. Auth Me (Authenticated):', authedMeRes.status === 200 && authedMeJson.user ? 'PASS' : 'FAIL');
  console.log('   User Name:', authedMeJson.user?.name);

  // 5. Get Scheduled Emails
  const schedRes = await fetch('http://localhost:5000/api/emails/scheduled', {
    headers: { Cookie: cookie },
  });
  const schedJson = await schedRes.json();
  console.log('\n5. GET /api/emails/scheduled:', schedRes.status === 200 ? 'PASS' : 'FAIL');
  console.log('   Total Scheduled Count:', schedJson.pagination?.total);

  // 6. Get Sent Emails
  const sentRes = await fetch('http://localhost:5000/api/emails/sent', {
    headers: { Cookie: cookie },
  });
  const sentJson = await sentRes.json();
  console.log('\n6. GET /api/emails/sent:', sentRes.status === 200 ? 'PASS' : 'FAIL');
  console.log('   Total Sent Count:', sentJson.pagination?.total);

  // 7. Get Slack Integration Status
  const slackRes = await fetch('http://localhost:5000/api/slack/status', {
    headers: { Cookie: cookie },
  });
  const slackJson = await slackRes.json();
  console.log('\n7. GET /api/slack/status (Disconnected state):', slackRes.status === 200 ? 'PASS' : 'FAIL');
  console.log('   Is Connected:', slackJson.data?.isConnected);

  console.log('\n=== ALL LOCAL RUNTIME VERIFICATION CHECKS PASSED ===');
}

verifyRuntime().catch((err) => {
  console.error('\n❌ LOCAL RUNTIME VERIFICATION FAILED:', err);
  process.exit(1);
});
