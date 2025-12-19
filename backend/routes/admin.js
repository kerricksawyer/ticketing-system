const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// Simple admin password check (in production, use proper auth)
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

const checkAdminPassword = (req, res, next) => {
  const password = req.headers['x-admin-password'];
  if (password !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Create a new show
router.post('/shows', checkAdminPassword, async (req, res) => {
  const { name, description, date } = req.body;

  if (!name || !date) {
    return res.status(400).json({ error: 'Name and date are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO shows (name, description, date) VALUES ($1, $2, $3) RETURNING *',
      [name, description || '', new Date(date)]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create show' });
  }
});

// Create rows and seats for a show
router.post('/shows/:showId/seats', checkAdminPassword, async (req, res) => {
  const { rows } = req.body;
  // rows should be: [{ rowName: 'A', seatsPerColumn: 10, columns: 2 }, ...]

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Rows array is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const createdSeats = [];

    for (const row of rows) {
      // Create row with column information
      const rowResult = await client.query(
        'INSERT INTO rows (show_id, row_name, columns, seats_per_column) VALUES ($1, $2, $3, $4) RETURNING id',
        [req.params.showId, row.rowName, row.columns || 1, row.seatsPerColumn || 10]
      );

      const rowId = rowResult.rows[0].id;

      // Create seats for this row
      // For multiple columns: create seats with numbering like 1-10, 11-20 for each column
      let seatNumber = 1;
      const columns = row.columns || 1;
      const seatsPerColumn = row.seatsPerColumn || row.seatCount || 10;

      for (let col = 0; col < columns; col++) {
        for (let i = 1; i <= seatsPerColumn; i++) {
          const seatResult = await client.query(
            'INSERT INTO seats (row_id, seat_number) VALUES ($1, $2) RETURNING *',
            [rowId, seatNumber.toString()]
          );
          createdSeats.push(seatResult.rows[0]);
          seatNumber++;
        }
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Seats created successfully', count: createdSeats.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create seats' });
  } finally {
    client.release();
  }
});

// Get all shows with seat counts
router.get('/shows', checkAdminPassword, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, COUNT(se.id) as total_seats, SUM(CASE WHEN se.is_booked THEN 1 ELSE 0 END) as booked_seats
      FROM shows s
      LEFT JOIN rows r ON s.id = r.show_id
      LEFT JOIN seats se ON r.id = se.row_id
      GROUP BY s.id
      ORDER BY s.date DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch shows' });
  }
});

// Get bookings for a show
router.get('/shows/:showId/bookings', checkAdminPassword, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, p.email, p.first_name, p.last_name, s.seat_number, r.row_name
      FROM bookings b
      JOIN parents p ON b.parent_id = p.id
      JOIN seats s ON b.seat_id = s.id
      JOIN rows r ON s.row_id = r.id
      WHERE b.show_id = $1
      ORDER BY b.created_at DESC
    `, [req.params.showId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Delete a show (and all associated data)
router.delete('/shows/:showId', checkAdminPassword, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete bookings first (depends on seats)
    await client.query('DELETE FROM bookings WHERE seat_id IN (SELECT id FROM seats WHERE row_id IN (SELECT id FROM rows WHERE show_id = $1))', [req.params.showId]);

    // Delete seats
    await client.query('DELETE FROM seats WHERE row_id IN (SELECT id FROM rows WHERE show_id = $1)', [req.params.showId]);

    // Delete rows
    await client.query('DELETE FROM rows WHERE show_id = $1', [req.params.showId]);

    // Delete show
    const result = await client.query('DELETE FROM shows WHERE id = $1 RETURNING *', [req.params.showId]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Show not found' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Show deleted successfully', show: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to delete show' });
  } finally {
    client.release();
  }
});

module.exports = router;
