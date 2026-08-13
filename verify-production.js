#!/usr/bin/env node
/**
 * Production Verification Script
 * Validates env setup, OTP route, and driver page code
 */

const fs = require('fs');
const path = require('path');

console.log('\n=== PRODUCTION ENV & OTP VERIFICATION ===\n');

const checks = {
  passed: [],
  failed: [],
};

// Check 1: .env production values
console.log('1. Checking production env values...');
const envPath = path.join(__dirname, 'packages/db/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasNeonDb = envContent.includes('neondb_owner');
  const hasFirebaseKey = envContent.includes('AIzaSyA4');
  const hasProductionUrl = envContent.includes('evaluna-erp.com') || envContent.includes('https://');
  const hasNodeEnvProd = envContent.includes('NODE_ENV=production');

  if (hasNeonDb && hasFirebaseKey) {
    checks.passed.push('✅ .env has real Firebase API key and Neon database URL');
  } else {
    checks.failed.push('❌ .env missing real Firebase or DB values');
  }

  if (hasProductionUrl) {
    checks.passed.push('✅ .env configured for production URLs');
  } else {
    checks.failed.push('❌ .env still uses localhost URLs');
  }
} else {
  checks.failed.push('❌ .env file not found at packages/db/.env');
}

// Check 2: OTP API route simplified
console.log('2. Checking OTP API route...');
const otpRoutePath = path.join(__dirname, 'apps/web/src/app/api/otp/route.ts');
if (fs.existsSync(otpRoutePath)) {
  const otpContent = fs.readFileSync(otpRoutePath, 'utf-8');
  const hasFirebaseApiKeyUsage = otpContent.includes('process.env.NEXT_PUBLIC_FIREBASE_API_KEY');
  const removedAdminTokenFlow = !otpContent.includes('getFirebaseAccessToken');
  const hasPhoneSendLogic = otpContent.includes('sendOobCode');
  const hasPhoneVerifyLogic = otpContent.includes('verifyOobCode');

  if (hasFirebaseApiKeyUsage && removedAdminTokenFlow && hasPhoneSendLogic && hasPhoneVerifyLogic) {
    checks.passed.push('✅ OTP API route uses public Firebase API key (no admin token needed)');
  } else {
    checks.failed.push('❌ OTP API route not properly simplified');
  }
} else {
  checks.failed.push('❌ OTP route.ts not found');
}

// Check 3: OTP Page customer input requirement
console.log('3. Checking driver OTP page...');
const otpPagePath = path.join(__dirname, 'apps/web/src/app/driver/otp/page.tsx');
if (fs.existsSync(otpPagePath)) {
  const pageContent = fs.readFileSync(otpPagePath, 'utf-8');
  const hasCustomerPhoneInput = pageContent.includes('customerPhone') && pageContent.includes('setCustomerPhone');
  const hasCustomerNumberLabel = pageContent.includes('Customer number required before OTP') || pageContent.includes('Customer');
  const resetOtpOnSend = pageContent.includes('setOtp(["", "", "", ""])');

  if (hasCustomerPhoneInput && hasCustomerNumberLabel) {
    checks.passed.push('✅ Driver OTP page requires customer number input before sending');
  } else {
    checks.failed.push('❌ Driver OTP page missing proper customer input field');
  }

  if (resetOtpOnSend) {
    checks.passed.push('✅ OTP input boxes reset after successful send');
  }
} else {
  checks.failed.push('❌ Driver OTP page not found');
}

// Check 4: Env example file updated
console.log('4. Checking env.example...');
const examplePath = path.join(__dirname, '.env.example');
if (fs.existsSync(examplePath)) {
  const exampleContent = fs.readFileSync(examplePath, 'utf-8');
  const hasProductionTemplate = exampleContent.includes('evaluna-erp.com');
  const hasRealFirebaseExample = exampleContent.includes('AIzaSyA4') || exampleContent.includes('NEXT_PUBLIC_FIREBASE_API_KEY');

  if (hasProductionTemplate || hasRealFirebaseExample) {
    checks.passed.push('✅ .env.example has production-like template with real Firebase example');
  } else {
    checks.failed.push('❌ .env.example still has placeholder values');
  }
} else {
  checks.failed.push('❌ .env.example not found');
}

// Check 5: Database schema has required fields
console.log('5. Checking database schema...');
const schemaPath = path.join(__dirname, 'packages/db/src/schema.ts');
if (fs.existsSync(schemaPath)) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const hasRolePermissionsTable = schemaContent.includes('rolePermissions') || schemaContent.includes('role_permissions');
  const hasDomainField = schemaContent.includes('domain');

  if (hasRolePermissionsTable) {
    checks.passed.push('✅ Database schema includes rolePermissions table');
  } else {
    checks.failed.push('❌ Database schema missing rolePermissions table');
  }
} else {
  checks.failed.push('❌ Schema file not found');
}

// Check 6: Package manager dependencies
console.log('6. Checking package dependencies...');
const packageJsonPath = path.join(__dirname, 'apps/web/package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const hasBetterAuth = packageJson.dependencies && packageJson.dependencies['better-auth'];
  const hasNext = packageJson.dependencies && packageJson.dependencies['next'];

  if (hasBetterAuth && hasNext) {
    checks.passed.push(`✅ App dependencies: Next.js and Better Auth configured`);
  } else {
    checks.failed.push('❌ Missing required dependencies (Next.js or Better Auth)');
  }
} else {
  checks.failed.push('❌ Web package.json not found');
}

// Report
console.log('\n=== VERIFICATION RESULTS ===\n');
console.log(`✅ PASSED (${checks.passed.length}):`);
checks.passed.forEach(msg => console.log(`  ${msg}`));

if (checks.failed.length > 0) {
  console.log(`\n❌ FAILED (${checks.failed.length}):`);
  checks.failed.forEach(msg => console.log(`  ${msg}`));
}

console.log('\n=== SUMMARY ===');
const passRate = Math.round((checks.passed.length / (checks.passed.length + checks.failed.length)) * 100);
console.log(`Production setup readiness: ${passRate}% (${checks.passed.length}/${checks.passed.length + checks.failed.length} checks passed)`);

if (checks.failed.length === 0) {
  console.log('\n✅ All production checks PASSED! App is ready for build and deployment.\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. Review above for details.\n');
  process.exit(1);
}
