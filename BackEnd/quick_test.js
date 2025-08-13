const jwt = require('jsonwebtoken');
const config = require('./config/env');

// Create a token like the login does
const token = jwt.sign(
  { 
    id: 16, 
    email: 'michael.brown@itu.edu', 
    role: 'faculty'
  }, 
  config.JWT_SECRET, 
  { expiresIn: '24h' }
);

console.log('Generated token for testing:');
console.log(`Bearer ${token}`);
console.log('\nDecoded payload:');
console.log(JSON.stringify(jwt.decode(token), null, 2));

console.log('\nNow test this with:');
console.log('curl -H "Authorization: Bearer ' + token + '" http://localhost:5000/api/faculty/my-students'); 