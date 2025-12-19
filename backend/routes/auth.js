const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { sendLoginEmail } = require('../email');
require('dotenv').config();
const router = express.Router();

// Request login (send email)
router.post('/request-login', async (req, res) => {
  const { email, firstName, lastName } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const loginToken = uuidv4();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert or update parent
    const result = await pool.query(
      `INSERT INTO parents (email, first_name, last_name, login_token, token_expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET login_token = $4, token_expires_at = $5
       RETURNING id, email`,
      [email, firstName || '', lastName || '', loginToken, tokenExpiry]
    );

    const loginLink = `${process.env.FRONTEND_URL}/login?token=${loginToken}`;
    await sendLoginEmail(email, loginLink);

    res.json({ message: 'Login email sent', parentId: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process login request' });
  }
});

// Verify login token and return JWT
router.post('/verify-login', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email FROM parents WHERE login_token = $1 AND token_expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const parent = result.rows[0];
    const jwtToken = jwt.sign({ parentId: parent.id, email: parent.email }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    // Clear the login token after use
    await pool.query('UPDATE parents SET login_token = NULL WHERE id = $1', [parent.id]);

    res.json({ token: jwtToken, parentId: parent.id, email: parent.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to verify login' });
  }
});

// Get current parent info
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT id, email, first_name, last_name FROM parents WHERE id = $1', [decoded.parentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
