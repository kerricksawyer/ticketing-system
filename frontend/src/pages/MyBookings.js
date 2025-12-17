import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookings } from '../api';
import './MyBookings.css';

function MyBookings() {
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await bookings.getMyBookings();
      setMyBookings(response.data);
    } catch (err) {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading bookings...</div>;
  }

  return (
    <div className="my-bookings-container">
      <div className="bookings-header">
        <h2>My Bookings</h2>
        <Link to="/shows" className="back-link">← Back to Shows</Link>
      </div>

      {error && <div className="error">{error}</div>}

      {myBookings.length === 0 ? (
        <div className="no-bookings">
          <p>You haven't booked any tickets yet.</p>
          <Link to="/shows" className="book-btn">Browse Shows</Link>
        </div>
      ) : (
        <div className="bookings-list">
          {myBookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-info">
                <h3>{booking.show_name}</h3>
                <p className="show-date">
                  {new Date(booking.date).toLocaleDateString()} at{' '}
                  {new Date(booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="seat-info">
                  Seat: <strong>{booking.row_name}{booking.seat_number}</strong>
                </p>
                <p className="confirmation">
                  Confirmation: <code>{booking.confirmation_token}</code>
                </p>
              </div>

              <div className="booking-status">
                {booking.checked_in ? (
                  <div className="checked-in">✓ Checked In</div>
                ) : (
                  <div className="not-checked-in">Pending Check-in</div>
                )}
              </div>

              {/* In a real app, you'd display the QR code here */}
              <div className="booking-qr">
                <p>Show this QR code at check-in</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyBookings;
