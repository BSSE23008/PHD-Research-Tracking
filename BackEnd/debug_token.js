const jwt = require('jsonwebtoken');
const config = require('./config/env');

console.log('🔍 JWT Token Debug\n');

// Test 1: Create token exactly like login does
const loginPayload = {
  id: 16,
  email: 'michael.brown@itu.edu',
  role: 'faculty'
};

const token = jwt.sign(loginPayload, config.JWT_SECRET, { expiresIn: '24h' });
console.log('1. Token created:', token.substring(0, 50) + '...');

// Test 2: Decode the token
const decoded = jwt.decode(token);
console.log('2. Decoded payload:', JSON.stringify(decoded, null, 2));

// Test 3: Verify the token
try {
  const verified = jwt.verify(token, config.JWT_SECRET);
  console.log('3. Verified payload:', JSON.stringify(verified, null, 2));
} catch (error) {
  console.log('3. Verification failed:', error.message);
}

// Test 4: Check role specifically
const roleFromToken = decoded.role;
console.log('4. Role from token:', roleFromToken);
console.log('   Role type:', typeof roleFromToken);
console.log('   Role length:', roleFromToken ? roleFromToken.length : 'N/A');
console.log('   Role === "faculty":', roleFromToken === 'faculty');

// Test 5: Check if role is in array
const requiredRoles = ['faculty'];
console.log('5. Required roles:', requiredRoles);
console.log('   includes check:', requiredRoles.includes(roleFromToken));

// Test 6: Check for hidden characters
if (roleFromToken) {
  console.log('6. Role character codes:', Array.from(roleFromToken).map(c => c.charCodeAt(0)));
  console.log('   Expected "faculty" codes:', Array.from('faculty').map(c => c.charCodeAt(0)));
}

console.log('\n✅ Debug completed'); 