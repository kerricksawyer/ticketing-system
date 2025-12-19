const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// Get all shows
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.description,
        s.date,
        s.created_at,
        (SELECT COUNT(*) FROM rows WHERE show_id = s.id) as row_count,
        (SELECT COUNT(*) FROM seats WHERE row_id IN (SELECT id FROM rows WHERE show_id = s.id)) as total_seats,
        (SELECT COUNT(*) FROM seats WHERE row_id IN (SELECT id FROM rows WHERE show_id = s.id) AND is_booked = TRUE) as booked_seats
      FROM shows s
      ORDER BY s.date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch shows' });
  }
});

// Get show details with seats
router.get('/:id', async (req, res) => {
  try {
    const showResult = await pool.query('SELECT * FROM shows WHERE id = $1', [req.params.id]);
    
    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: 'Show not found' });
    }

    const seatsResult = await pool.query(`
      SELECT s.id, s.seat_number, s.is_booked, r.row_name
      FROM seats s
      JOIN rows r ON s.row_id = r.id
      WHERE r.show_id = $1
      ORDER BY r.row_name, s.seat_number
    `, [req.params.id]);

    res.json({
      show: showResult.rows[0],
      seats: seatsResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch show details' });
  }
});

module.exports = router;
