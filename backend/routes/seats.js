const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// Get available seats for a show
router.get('/show/:showId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.seat_number, s.is_booked, r.row_name, r.id as row_id
      FROM seats s
      JOIN rows r ON s.row_id = r.id
      WHERE r.show_id = $1
      ORDER BY r.row_name, s.seat_number
    `, [req.params.showId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch seats' });
  }
});

// Book a seat (with transaction to prevent double-booking)
router.post('/book', async (req, res) => {
  const { seatId, parentId } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if seat is available
    const seatCheck = await client.query('SELECT is_booked FROM seats WHERE id = $1', [seatId]);
    
    if (seatCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Seat not found' });
    }

    if (seatCheck.rows[0].is_booked) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Seat is already booked' });
    }

    // Book the seat
    const bookResult = await client.query(
      'UPDATE seats SET is_booked = TRUE, booked_by = $1, booked_at = NOW() WHERE id = $2 RETURNING *',
      [parentId, seatId]
    );

    await client.query('COMMIT');
    res.json(bookResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to book seat' });
  } finally {
    client.release();
  }
});

module.exports = router;
