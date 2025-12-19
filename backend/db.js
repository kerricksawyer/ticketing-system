const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS shows (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rows (
        id SERIAL PRIMARY KEY,
        show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
        row_name VARCHAR(10) NOT NULL,
        columns INTEGER DEFAULT 1,
        seats_per_column INTEGER DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS seats (
        id SERIAL PRIMARY KEY,
        row_id INTEGER NOT NULL REFERENCES rows(id) ON DELETE CASCADE,
        seat_number VARCHAR(10) NOT NULL,
        is_booked BOOLEAN DEFAULT FALSE,
        booked_by INTEGER,
        booked_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS parents (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        login_token VARCHAR(255),
        token_expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
        seat_id INTEGER NOT NULL REFERENCES seats(id),
        show_id INTEGER NOT NULL REFERENCES shows(id),
        confirmation_token VARCHAR(255) UNIQUE NOT NULL,
        qr_code_data TEXT,
        checked_in BOOLEAN DEFAULT FALSE,
        checked_in_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_seats_row_id ON seats(row_id);
      CREATE INDEX IF NOT EXISTS idx_seats_is_booked ON seats(is_booked);
      CREATE INDEX IF NOT EXISTS idx_bookings_parent_id ON bookings(parent_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_show_id ON bookings(show_id);
      CREATE INDEX IF NOT EXISTS idx_parents_email ON parents(email);
    `);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
};

module.exports = { pool, initializeDatabase };
