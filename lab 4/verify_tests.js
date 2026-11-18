const { app, startServer } = require('./server');
const { initializeDB, getDB, closeDB, dbPath } = require('./database/database');
const jwt = require('jsonwebtoken');

const PORT = 3001; // Use 3001 for automated test runner to avoid port conflicts

async function runTests() {
  console.log('========================================================');
  console.log('        LAB 4: AUTOMATED TEST SUITE EXECUTION           ');
  console.log('========================================================\n');

  // 1. Initialize DB and start server on test port
  await initializeDB();
  const db = getDB();

  // Clear existing users from test database for clean run
  await db.run('DELETE FROM users;');

  const server = app.listen(PORT, '127.0.0.1', () => {
    console.log(`[Test Server] Running on http://127.0.0.1:${PORT}\n`);
  });

  const baseUrl = `http://127.0.0.1:${PORT}`;
  let passed = 0;
  let total = 0;

  async function testCase(name, fn) {
    total++;
    try {
      await fn();
      console.log(`[PASS] Case ${total}: ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] Case ${total}: ${name}`);
      console.error(`       Error: ${err.message}`);
    }
  }

  // --- REGISTRATION TESTS ---
  console.log('--- A. REGISTRATION API TESTS ---');

  // Test 1: Register a new user - success
  await testCase('Register a new user (HTTP 200 / success message)', async () => {
    const res = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'arjun123',
        name: 'Arjun',
        password: 'arjun@123',
      }),
    });
    const body = await res.json();
    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.status}: ${JSON.stringify(body)}`);
    }
    if (!body.message || body.message !== 'User registered successfully') {
      throw new Error(`Unexpected message: ${JSON.stringify(body)}`);
    }
    if (body.password || body.passwordHash || body.hash) {
      throw new Error(`Security breach: response contains password data!`);
    }
  });

  // Test 2: Register the same username again - HTTP 400
  await testCase('Register duplicate username (HTTP 400 User already exists)', async () => {
    const res = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'arjun123',
        name: 'Arjun Duplicate',
        password: 'anotherpassword',
      }),
    });
    const body = await res.json();
    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400, got ${res.status}: ${JSON.stringify(body)}`);
    }
    if (body.error !== 'User already exists' && body.message !== 'User already exists') {
      throw new Error(`Expected error message 'User already exists', got: ${JSON.stringify(body)}`);
    }
  });

  // Test 3: Register without required fields - HTTP 400
  await testCase('Register without required fields (HTTP 400 Validation Error)', async () => {
    const res = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'incomplete_user',
        // missing name and password
      }),
    });
    const body = await res.json();
    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400, got ${res.status}: ${JSON.stringify(body)}`);
    }
  });

  // --- LOGIN TESTS ---
  console.log('\n--- B. LOGIN API TESTS ---');

  let acquiredToken = null;

  // Test 4: Login with correct credentials - success with JWT token
  await testCase('Login with correct credentials (HTTP 200 with JWT token)', async () => {
    const res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'arjun123',
        password: 'arjun@123',
      }),
    });
    const body = await res.json();
    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200, got ${res.status}: ${JSON.stringify(body)}`);
    }
    if (!body.jwt_token) {
      throw new Error(`Missing jwt_token in response: ${JSON.stringify(body)}`);
    }
    acquiredToken = body.jwt_token;

    // Verify JWT payload strictly contains only username
    const decoded = jwt.decode(acquiredToken);
    if (!decoded || decoded.username !== 'arjun123') {
      throw new Error(`JWT payload missing expected username: ${JSON.stringify(decoded)}`);
    }
    if (decoded.password || decoded.passwordHash || decoded.hash) {
      throw new Error(`Security breach: JWT payload contains password!`);
    }
    console.log(`       [Token verified] Payload: ${JSON.stringify(decoded)}`);
  });

  // Test 5: Login with unknown username - HTTP 400
  await testCase('Login with unknown username (HTTP 400 Invalid user)', async () => {
    const res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'nonexistent_user',
        password: 'somepassword',
      }),
    });
    const body = await res.json();
    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400, got ${res.status}: ${JSON.stringify(body)}`);
    }
    if (body.error !== 'Invalid user' && body.message !== 'Invalid user') {
      throw new Error(`Expected 'Invalid user', got: ${JSON.stringify(body)}`);
    }
  });

  // Test 6: Login with incorrect password - HTTP 400
  await testCase('Login with incorrect password (HTTP 400 Invalid password)', async () => {
    const res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'arjun123',
        password: 'wrong_password_123',
      }),
    });
    const body = await res.json();
    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400, got ${res.status}: ${JSON.stringify(body)}`);
    }
    if (body.error !== 'Invalid password' && body.message !== 'Invalid password') {
      throw new Error(`Expected 'Invalid password', got: ${JSON.stringify(body)}`);
    }
  });

  // --- DATABASE VERIFICATION ---
  console.log('\n--- C. DATABASE SECURITY VERIFICATION ---');

  await testCase('Verify SQLite database: passwords stored as bcrypt hashes', async () => {
    const rows = await db.all('SELECT id, username, name, password FROM users;');
    if (rows.length === 0) {
      throw new Error('No user records found in SQLite users table');
    }
    for (const user of rows) {
      console.log(`       Row: id=${user.id}, username="${user.username}", name="${user.name}"`);
      console.log(`       Password in DB: "${user.password}"`);

      // Verify bcrypt hash structure ($2b$10$...)
      if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        throw new Error(`Password is NOT a valid bcrypt hash: ${user.password}`);
      }
      if (user.password === 'arjun@123') {
        throw new Error('CRITICAL SECURITY FLAW: Plain-text password stored in database!');
      }
    }
  });

  // Teardown
  server.close();
  await closeDB();

  console.log('\n========================================================');
  console.log(`RESULTS: ${passed} / ${total} tests passed successfully.`);
  console.log('========================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
