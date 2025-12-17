import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shows, bookings } from '../api';
import './SeatSelection.css';

function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const [showData, setShowData] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadShowData();
  }, [showId]);

  const loadShowData = async () => {
    try {
      const response = await shows.getById(showId);
      setShowData(response.data.show);
      setSeats(response.data.seats);
    } catch (err) {
      setError('Failed to load show details');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seatId, isBooked) => {
    if (!isBooked) {
      setSelectedSeat(selectedSeat === seatId ? null : seatId);
    }
  };

  const handleBooking = async () => {
    if (!selectedSeat) {
      setError('Please select a seat');
      return;
    }

    setBooking(true);
    setError('');
    setMessage('');

    try {
      await bookings.create(selectedSeat, showId);
      setMessage('Booking successful! Check your email for confirmation.');
      setTimeout(() => {
        navigate('/bookings');
      }, 2000);
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Sorry, that seat was just booked. Please select another.');
        loadShowData(); // Refresh seats
      } else {
        setError(err.response?.data?.error || 'Booking failed');
      }
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading seat selection...</div>;
  }

  if (!showData) {
    return <div className="error">Show not found</div>;
  }

  // Group seats by row
  const seatsByRow = {};
  seats.forEach((seat) => {
    if (!seatsByRow[seat.row_name]) {
      seatsByRow[seat.row_name] = [];
    }
    seatsByRow[seat.row_name].push(seat);
  });

  const selectedSeatData = seats.find((s) => s.id === selectedSeat);

  return (
    <div className="seat-selection-container">
      <h2>{showData.name}</h2>
      <p className="show-date">
        {new Date(showData.date).toLocaleDateString()} at{' '}
        {new Date(showData.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>

      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}

      <div className="seating-area">
        <div className="screen">SCREEN</div>

        <div className="seats">
          {Object.keys(seatsByRow).map((rowName) => (
            <div key={rowName} className="seat-row">
              <div className="row-label">{rowName}</div>
              <div className="row-seats">
                {seatsByRow[rowName].map((seat) => (
                  <button
                    key={seat.id}
                    className={`seat ${seat.is_booked ? 'booked' : ''} ${
                      selectedSeat === seat.id ? 'selected' : ''
                    }`}
                    onClick={() => handleSeatClick(seat.id, seat.is_booked)}
                    disabled={seat.is_booked}
                    title={seat.is_booked ? 'Already booked' : `${rowName}${seat.seat_number}`}
                  >
                    {seat.seat_number}
                  </button>
                ))}
              </div>
              <div className="row-label">{rowName}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-seat"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-seat selected"></div>
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <div className="legend-seat booked"></div>
          <span>Booked</span>
        </div>
      </div>

      {selectedSeatData && (
        <div className="booking-summary">
          <p>
            Selected Seat: <strong>{selectedSeatData.row_name}{selectedSeatData.seat_number}</strong>
          </p>
          <button onClick={handleBooking} disabled={booking} className="book-btn">
            {booking ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      )}
    </div>
  );
}

export default SeatSelection;
