import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shows, bookings } from '../api';
import './Shows.css';

function Shows() {
  const [showsList, setShowsList] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadShows();
    loadMyBookings();
  }, []);

  const loadShows = async () => {
    try {
      const response = await shows.getAll();
      setShowsList(response.data);
    } catch (err) {
      setError('Failed to load shows');
    } finally {
      setLoading(false);
    }
  };

  const loadMyBookings = async () => {
    try {
      const response = await bookings.getMyBookings();
      setMyBookings(response.data);
    } catch (err) {
      console.log('No bookings yet');
    }
  };

  if (loading) {
    return <div className="loading">Loading shows...</div>;
  }

  return (
    <div className="shows-container">
      <div className="shows-header">
        <h2>Available Shows</h2>
        {myBookings.length > 0 && (
          <Link to="/bookings" className="my-bookings-link">
            My Bookings ({myBookings.length})
          </Link>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {showsList.length === 0 ? (
        <div className="no-shows">No shows available yet</div>
      ) : (
        <div className="shows-grid">
          {showsList.map((show) => (
            <div key={show.id} className="show-card">
              <h3>{show.name}</h3>
              {show.description && <p className="description">{show.description}</p>}
              <p className="date">
                {new Date(show.date).toLocaleDateString()} at{' '}
                {new Date(show.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <Link to={`/shows/${show.id}/seats`} className="select-seats-btn">
                Select Seats
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Shows;
