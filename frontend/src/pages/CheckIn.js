import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { bookings } from '../api';
import './CheckIn.css';

function CheckIn() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [booking, setBooking] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    performCheckIn();
  }, [token]);

  const performCheckIn = async () => {
    try {
      const response = await bookings.checkIn(token);
      setBooking(response.data.booking);
      setStatus('success');
      setMessage('Check-in successful!');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Check-in failed');
    }
  };

  return (
    <div className="check-in-container">
      <div className="check-in-card">
        {status === 'loading' && (
          <div className="loading">Checking you in...</div>
        )}

        {status === 'success' && (
          <div className="success-check-in">
            <div className="success-icon">✓</div>
            <h2>Welcome!</h2>
            <p className="message">{message}</p>
            {booking && (
              <div className="booking-details">
                <p>You're all set for the show.</p>
                <p>Confirmation: <code>{booking.confirmation_token}</code></p>
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="error-check-in">
            <div className="error-icon">✗</div>
            <h2>Check-in Error</h2>
            <p className="message">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckIn;
