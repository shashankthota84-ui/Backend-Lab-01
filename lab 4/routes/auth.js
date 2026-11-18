const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDB } = require('../database/database');

const router = express.Router();

// JWT Secret Key stored in a constant for this lab
const JWT_SECRET = 'COLLEGE_LAB4_JWT_SECRET_KEY';

/**
 * POST /register
 * Registers a new user with username, name, and hashed password.
 */
router.post('/register', async (req, res) => {
  try {
    const { username, name, password } = req.body;

    // Validate required fields
    if (
      !username ||
      !name ||
      !password ||
      typeof username !== 'string' ||
      typeof name !== 'string' ||
      typeof password !== 'string' ||
      username.trim() === '' ||
      name.trim() === '' ||
      password.trim() === ''
    ) {
      return res.status(400).json({
        error: 'All fields (username, name, password) are required and cannot be empty.',
        message: 'All fields (username, name, password) are required and cannot be empty.',
      });
    }

    const trimmedUsername = username.trim();
    const trimmedName = name.trim();
    const db = getDB();

    // Check whether the username already exists (parameterized query)
    const selectUserQuery = 'SELECT * FROM users WHERE username = ?;';
    const existingUser = await db.get(selectUserQuery, [trimmedUsername]);

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'User already exists',
      });
    }

    // Hash the password with bcrypt (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user using parameterized query to prevent SQL injection
    const insertUserQuery = `
      INSERT INTO users (username, name, password)
      VALUES (?, ?, ?);
    `;
    await db.run(insertUserQuery, [trimmedUsername, trimmedName, hashedPassword]);

    // Return success message without exposing password or hash
    return res.status(200).json({
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('[Register Error]', error.message);
    return res.status(500).json({
      error: 'Internal server error during registration',
      message: 'Internal server error during registration',
    });
  }
});

/**
 * POST /login
 * Authenticates user credentials and issues a JWT token containing ONLY the username.
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (
      !username ||
      !password ||
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      username.trim() === '' ||
      password.trim() === ''
    ) {
      return res.status(400).json({
        error: 'Both username and password are required.',
        message: 'Both username and password are required.',
      });
    }

    const trimmedUsername = username.trim();
    const db = getDB();

    // Check if user exists using parameterized query
    const selectUserQuery = 'SELECT * FROM users WHERE username = ?;';
    const user = await db.get(selectUserQuery, [trimmedUsername]);

    if (!user) {
      return res.status(400).json({
        error: 'Invalid user',
        message: 'Invalid user',
      });
    }

    // Verify password with bcrypt.compare
    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Invalid password',
      });
    }

    // Generate JWT token with ONLY username in the payload
    const payload = {
      username: user.username,
    };

    const jwtToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    // Return the generated JWT token
    return res.status(200).json({
      jwt_token: jwtToken,
    });
  } catch (error) {
    console.error('[Login Error]', error.message);
    return res.status(500).json({
      error: 'Internal server error during login',
      message: 'Internal server error during login',
    });
  }
});

module.exports = router;
