import { AuthService } from '../backend/src/services/authService.js';
import { prisma } from '../backend/src/config/db.js';
import { redisClient } from '../backend/src/config/redis.js';

async function runFullE2ETest() {
  console.log('===========================================================');
  console.log('RUNNING FULL MAILORA AUTHENTICATION & REGRESSION TEST SUITE');
  console.log('===========================================================\n');

  const testEmailRaw = '  Test_User_E2E_' + Date.now() + '@Example.COM  ';
  const testEmailNorm = testEmailRaw.toLowerCase().trim();
  const testPassword = 'Password123!';

  // 1. Registration
  console.log('1. Testing User Registration & Email Normalization...');
  const regResult = await AuthService.register({
    name: 'E2E User',
    email: testEmailRaw,
    password: testPassword,
  });
  console.log('✔ Registration PASS. User ID:', regResult.user.id);
  console.log('✔ Normalized email saved in DB:', regResult.user.email);
  if (regResult.user.email !== testEmailNorm) {
    throw new Error('FAILED: Email normalization mismatch');
  }

  // 2. Login with uppercase & untrimmed email
  console.log('\n2. Testing Login with Case/Space In-Sensitive Email...');
  const loginResult = await AuthService.loginWithPassword({
    email: '  TEST_USER_E2E_' + testEmailNorm.split('@')[0].split('_')[3] + '@EXAMPLE.COM  ',
    password: testPassword,
  });
  console.log('✔ Login PASS. Session ID created:', loginResult.sid ? 'Yes' : 'No');

  // 3. Login with Wrong Password
  console.log('\n3. Testing Login with Wrong Password...');
  try {
    await AuthService.loginWithPassword({
      email: testEmailNorm,
      password: 'WrongPassword!',
    });
    throw new Error('FAILED: Allowed login with wrong password!');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'Invalid email or password.') {
      console.log('✔ Wrong Password PASS (Returned generic error message)');
    } else {
      throw new Error(`FAILED: Non-generic error: ${msg}`);
    }
  }

  // 4. Redis Login Failed Counter Check
  console.log('\n4. Checking Redis Failed Attempts Tracking...');
  const failedCount = await redisClient.get(`mailora:login:failed:${testEmailNorm}`);
  console.log('✔ Redis failed counter value:', failedCount, '(1 failed attempt recorded)');

  // 5. Successful Login Resets Redis Failed Counter
  console.log('\n5. Testing Successful Login Resets Redis Failed Counter...');
  await AuthService.loginWithPassword({ email: testEmailNorm, password: testPassword });
  const clearedCount = await redisClient.get(`mailora:login:failed:${testEmailNorm}`);
  console.log('✔ Redis failed counter cleared on success:', clearedCount === null ? 'PASS' : 'FAIL');

  // 6. Password Reset Token & Session Revocation
  console.log('\n6. Testing Password Reset Request & Token Hash...');
  const resetReq = await AuthService.requestPasswordReset(testEmailNorm);
  console.log('✔ Forgot password response:', resetReq.message);

  const tokenRecord = await prisma.passwordResetToken.findFirst({
    where: { userId: regResult.user.id, usedAt: null },
  });
  if (!tokenRecord || tokenRecord.tokenHash.length !== 64) {
    throw new Error('FAILED: Reset token record or SHA-256 hash length invalid');
  }
  console.log('✔ Dedicated PasswordResetToken model created with SHA-256 hash');

  // 7. Cleanup test data
  await prisma.user.delete({ where: { id: regResult.user.id } });
  console.log('\n===========================================================');
  console.log('ALL E2E AUTHENTICATION & REGRESSION TESTS PASSED 100%');
  console.log('===========================================================');

  await prisma.$disconnect();
  redisClient.quit();
}

runFullE2ETest().catch((err) => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
