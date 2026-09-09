import dns from 'dns';
import { hashPassword, verifyPassword, AuthService } from '../backend/src/services/authService.js';
import { prisma } from '../backend/src/config/db.js';
import { redisClient } from '../backend/src/config/redis.js';

async function diagnose() {
  console.log('====================================================');
  console.log('DIAGNOSING ISSUE 1: GOOGLE OAUTH DNS & CONNECTIVITY');
  console.log('====================================================');

  try {
    const addresses = await new Promise<string[]>((resolve, reject) => {
      dns.resolve4('oauth2.googleapis.com', (err, addrs) => {
        if (err) reject(err);
        else resolve(addrs);
      });
    });
    console.log('✔ Google OAuth DNS resolution succeeded:', addresses);
  } catch (err: unknown) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    console.log('❌ Google OAuth DNS resolution FAILED:', errorObj.message);
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST' });
    console.log('✔ Google token endpoint HTTP reachability status:', res.status);
  } catch (err: unknown) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    console.log('❌ Google token endpoint HTTP reachability FAILED:', errorObj.message);
  }

  console.log('\n====================================================');
  console.log('DIAGNOSING ISSUE 2: EMAIL / PASSWORD HASH & LOGIN');
  console.log('====================================================');

  const testPass = 'MySecretPassword123!';
  const hash = hashPassword(testPass);
  const verifyResult = verifyPassword(testPass, hash);
  console.log('1. Direct scrypt hashPassword & verifyPassword test:', verifyResult ? 'PASS' : 'FAIL');

  const rawEmail = ' TestUser_Diag@Example.COM ';
  const normalizedEmail = rawEmail.toLowerCase().trim();
  console.log('2. Email normalization check:');
  console.log('   Input:', JSON.stringify(rawEmail));
  console.log('   Normalized:', JSON.stringify(normalizedEmail));

  // Test registration via AuthService
  try {
    // Delete existing if any
    await prisma.user.deleteMany({ where: { email: normalizedEmail } });

    console.log('\n3. Testing AuthService.register...');
    const regRes = await AuthService.register({
      name: 'Diag User',
      email: rawEmail, // Pass un-normalized email to verify normalization in register
      password: testPass,
    });
    console.log('   Registered user ID:', regRes.user.id);
    console.log('   Registered user email in DB:', regRes.user.email);
    console.log('   Has passwordHash in DB:', !!regRes.user.passwordHash);

    console.log('\n4. Testing AuthService.loginWithPassword with uppercase/untrimmed email...');
    const loginRes = await AuthService.loginWithPassword({
      email: '  TESTUSER_DIAG@EXAMPLE.COM ',
      password: testPass,
    });
    console.log('   Login succeeded. SID:', loginRes.sid ? 'YES' : 'NO');
  } catch (err: unknown) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    console.error('❌ AuthService Register/Login FAILED:', errorObj.message);
  }

  console.log('\n5. Checking Redis failed login attempt keys...');
  const keys = await redisClient.keys('mailora:login:*');
  console.log('   Active Redis auth keys:', keys);
  for (const k of keys) {
    const val = await redisClient.get(k);
    const ttl = await redisClient.ttl(k);
    console.log(`   Key: ${k} | Val: ${val} | TTL: ${ttl}s`);
  }

  await prisma.$disconnect();
  redisClient.quit();
}

diagnose().catch((err) => {
  console.error('Diagnosis Script Crash:', err);
  process.exit(1);
});
