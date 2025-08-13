// Simple seeding script for Docker and production environments
const bcrypt = require('bcrypt');

// This will be used to create default users via SQL or API calls
const defaultCredentials = {
  admin: { username: 'admin', password: 'admin123', fullName: 'System Administrator', role: 'admin' },
  manager: { username: 'manager1', password: 'manager123', fullName: 'Masjid Manager', role: 'manager' },  
  collector1: { username: 'collector1', password: 'collector123', fullName: 'Cash Collector 1', role: 'cash_collector' },
  collector2: { username: 'collector2', password: 'collector456', fullName: 'Cash Collector 2', role: 'cash_collector' }
};

console.log('=== DEFAULT LOGIN CREDENTIALS ===');
console.log('Admin: username="admin", password="admin123"');
console.log('Manager: username="manager1", password="manager123"');
console.log('Cash Collector 1: username="collector1", password="collector123"');
console.log('Cash Collector 2: username="collector2", password="collector456"');
console.log('==================================');

module.exports = { defaultCredentials };