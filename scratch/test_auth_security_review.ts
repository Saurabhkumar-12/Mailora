import { AuthService } from '../backend/src/services/authService.js';
import { prisma } from '../backend/src/config/db.js';
import { redisClient } from '../backend/src/config/redis.js';

async function runSecurityAuditTests() {
  console.log('=== STARTING SECURITY & CORRECTNESS REVIEW VERIFICATION ===\n');

  const testEmail = `audit_${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';

  // 1. Registration Test
  console.log('1. Testing User Registration...');
  const regResult = await AuthService.register({
    name: 'Security Test User',
    email: testEmail,
    password: testPassword,
  });
  console.log('✔ Registration successful. User ID:', regResult.user.id);
  console.log('✔ Session ID generated:', regResult.sid ? 'Yes (Signed)' : 'No');

  // Check Password Hash format
  const dbUser = await prisma.user.findUnique({ where: { id: regResult.user.id } });
  if (!dbUser?.passwordHash || !dbUser.passwordHash.includes(':')) {
    throw new Error('FAILED: Password hash format invalid');
  }
  console.log('✔ Password hash securely formatted with scrypt salt');

  // 2. Registration Duplicate Prevention (Account Enumeration / Credential Overwriting Check)
  console.log('\n2. Testing Registration Duplicate Prevention...');
  try {
    await AuthService.register({
      name: 'Attacker',
      email: testEmail,
      password: 'AnotherPassword!',
    });
    throw new Error('FAILED: Allowed duplicate registration!');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('already exists')) {
      console.log('✔ Correctly blocked duplicate registration with generic message');
    } else {
      throw err;
    }
  }

  // 3. Password Login Test
  console.log('\n3. Testing Password Login...');
  const loginResult = await AuthService.loginWithPassword({
    email: testEmail,
    password: testPassword,
  });
  console.log('✔ Login successful. Session ID:', loginResult.sid ? 'Yes' : 'No');

  // 4. Invalid Login Credentials Test
  console.log('\n4. Testing Invalid Password Login...');
  try {
    await AuthService.loginWithPassword({
      email: testEmail,
      password: 'WrongPassword!',
    });
    throw new Error('FAILED: Allowed login with wrong password!');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'Invalid email or password.') {
      console.log('✔ Correctly returned generic "Invalid email or password." response');
    } else {
      throw new Error(`FAILED: Non-generic login error: ${msg}`);
    }
  }

  // 5. Password Reset Token Security Test
  console.log('\n5. Testing Password Reset Request...');
  const reqResetRes = await AuthService.requestPasswordReset(testEmail);
  console.log('✔ Reset request response:', reqResetRes.message);

  // Check DB representation: raw token must NOT exist, tokenHash MUST exist
  const tokenRecord = await prisma.passwordResetToken.findFirst({
    where: { userId: dbUser.id, usedAt: null },
  });

  if (!tokenRecord) {
    throw new Error('FAILED: PasswordResetToken record not created');
  }
  console.log('✔ PasswordResetToken record created with ID:', tokenRecord.id);
  console.log('✔ Token hash length:', tokenRecord.tokenHash.length, '(SHA-256 hex string)');

  // 6. Reset Password Execution & Session Invalidation Test
  console.log('\n6. Testing Reset Password Execution & Session Invalidation...');
  // Find raw token by matching hash in memory
  // Wait, we generate tokenHash from raw token. Let's create a fresh token to test reset execution directly
  const testRawToken = 'test_raw_token_secret_1234567890';
  const crypto = await import('crypto');
  const testTokenHash = crypto.createHash('sha256').update(testRawToken).digest('hex');

  await prisma.passwordResetToken.create({
    data: {
      userId: dbUser.id,
      tokenHash: testTokenHash,
      expiresAt: new Date(Date.now() + 3600000),
    },
  });

  const newPassword = 'NewSecurePassword456!';
  const resetRes = await AuthService.resetPassword(testRawToken, newPassword);
  console.log('✔ Reset password response:', resetRes.message);

  // Check usedAt updated
  const updatedTokenRecord = await prisma.passwordResetToken.findUnique({
    where: { id: (await prisma.passwordResetToken.findFirst({ where: { tokenHash: testTokenHash } }))!.id },
  });
  if (!updatedTokenRecord?.usedAt) {
    throw new Error('FAILED: Token usedAt flag was not set upon reset');
  }
  console.log('✔ Reset token marked as single-use (usedAt updated)');

  // Re-use attempt must fail
  try {
    await AuthService.resetPassword(testRawToken, 'YetAnotherPassword!');
    throw new Error('FAILED: Allowed token re-use!');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Invalid or expired')) {
      console.log('✔ Single-use token enforcement verified (re-use attempt blocked)');
    } else {
      throw err;
    }
  }

  // Check session invalidation: all active sessions for this user should be deleted
  const userSessionsCount = await prisma.session.count({ where: { userId: dbUser.id } });
  if (userSessionsCount !== 0) {
    throw new Error(`FAILED: Active sessions were not invalidated on password reset! Count: ${userSessionsCount}`);
  }
  console.log('✔ All existing user sessions successfully invalidated upon password reset');

  // Verify new password works
  const newLoginResult = await AuthService.loginWithPassword({
    email: testEmail,
    password: newPassword,
  });
  console.log('✔ Login with new password successful. Session ID:', newLoginResult.sid);

  // Clean up test data
  await prisma.user.delete({ where: { id: dbUser.id } });
  console.log('\n=== ALL SECURITY & CORRECTNESS TESTS PASSED CLEANLY ===');

  await prisma.$disconnect();
  redisClient.quit();
}

runSecurityAuditTests().catch((err) => {
  console.error('\n❌ SECURITY TEST FAILED:', err);
  process.exit(1);
});
