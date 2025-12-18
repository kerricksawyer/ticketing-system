const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { sendConfirmationEmail } = require('../email');
const { authMiddleware } = require('../middleware');
require('dotenv').config();
const router = express.Router();

// Create booking
router.post('/', authMiddleware, async (req, res) => {
  const { seatId, showId } = req.body;
  const parentId = req.parentId;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get parent info
    const parentResult = await client.query('SELECT email, first_name FROM parents WHERE id = $1', [parentId]);
    const parent = parentResult.rows[0];

    // Check if seat is available
    const seatResult = await client.query('SELECT * FROM seats WHERE id = $1', [seatId]);
    if (seatResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Seat not found' });
    }

    if (seatResult.rows[0].is_booked) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Seat is already booked' });
    }

    // Book the seat
    const confirmationToken = uuidv4();
    const qrCodeData = `${process.env.FRONTEND_URL}/check-in/${confirmationToken}`;

    await client.query(
      'UPDATE seats SET is_booked = TRUE, booked_by = $1, booked_at = NOW() WHERE id = $2',
      [parentId, seatId]
    );

    // Create booking record
    const bookingResult = await client.query(
      `INSERT INTO bookings (parent_id, seat_id, show_id, confirmation_token, qr_code_data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [parentId, seatId, showId, confirmationToken, qrCodeData]
    );

    await client.query('COMMIT');

    // Get seat info for email
    const rowResult = await client.query('SELECT row_name FROM rows WHERE id = $1', [seatResult.rows[0].row_id]);
    const seatInfo = `${rowResult.rows[0].row_name}${seatResult.rows[0].seat_number}`;

    // Get show name
    const showResult = await client.query('SELECT name FROM shows WHERE id = $1', [showId]);

    // Send confirmation email
    await sendConfirmationEmail(parent.email, parent.first_name, showResult.rows[0].name, seatInfo, confirmationToken, qrCodeData);

    res.json({ booking: bookingResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  } finally {
    client.release();
  }
});

// Get parent's bookings
router.get('/my-bookings', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, s.seat_number, r.row_name, sh.name as show_name, sh.date
      FROM bookings b
      JOIN seats s ON b.seat_id = s.id
      JOIN rows r ON s.row_id = r.id
      JOIN shows sh ON b.show_id = sh.id
      WHERE b.parent_id = $1
      ORDER BY sh.date DESC
    `, [req.parentId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Check in with QR code
// Check-in via QR code (GET - when link is opened)
router.get('/check-in/:confirmationToken', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE bookings SET checked_in = TRUE, checked_in_at = NOW() WHERE confirmation_token = $1 RETURNING *',
      [req.params.confirmationToken]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ message: 'Successfully checked in', booking: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check in' });
  }
});

// Check-in via POST (for backward compatibility)
router.post('/check-in/:confirmationToken', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE bookings SET checked_in = TRUE, checked_in_at = NOW() WHERE confirmation_token = $1 RETURNING *',
      [req.params.confirmationToken]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ message: 'Successfully checked in', booking: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check in' });
  }
});

module.exports = router;
