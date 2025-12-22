import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shows, bookings } from '../api';
import './SeatSelection.css';

function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const [showData, setShowData] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]); // Changed to array for multiple seats
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
      setSelectedSeats(prev => 
        prev.includes(seatId) 
          ? prev.filter(id => id !== seatId) // Deselect if already selected
          : [...prev, seatId] // Add to selection
      );
    }
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }

    setBooking(true);
    setError('');
    setMessage('');

    try {
      // Book all selected seats
      const bookingPromises = selectedSeats.map(seatId => 
        bookings.create(seatId, showId)
      );
      
      await Promise.all(bookingPromises);
      setMessage(`Booking successful! ${selectedSeats.length} seat(s) booked. Check your email for confirmation.`);
      setTimeout(() => {
        navigate('/bookings');
      }, 2000);
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Sorry, one or more seats were just booked. Please refresh and try again.');
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

  // Sort seats within each row numerically
  Object.keys(seatsByRow).forEach(rowName => {
    seatsByRow[rowName].sort((a, b) => {
      const numA = parseInt(a.seat_number) || a.seat_number;
      const numB = parseInt(b.seat_number) || b.seat_number;
      return numA - numB;
    });
  });

  // Sort rows alphabetically
  const sortedRows = Object.keys(seatsByRow).sort();

  // Get selected seat data for display
  const selectedSeatDataList = seats.filter(s => selectedSeats.includes(s.id));

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
          {sortedRows.map((rowName) => {
            const rowSeats = seatsByRow[rowName];
            
            return (
              <div key={rowName} className="seat-row">
                <div className="row-label">{rowName}</div>
                <div className="row-seats">
                  {rowSeats.map((seat) => (
                    <button
                      key={seat.id}
                      className={`seat ${seat.is_booked ? 'booked' : ''} ${
                        selectedSeats.includes(seat.id) ? 'selected' : ''
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
            );
          })}
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

      {selectedSeats.length > 0 && (
        <div className="booking-summary">
          <p>
            Selected Seats: <strong>{selectedSeatDataList.map(s => `${s.row_name}${s.seat_number}`).join(', ')}</strong>
          </p>
          <p>Total: <strong>{selectedSeats.length} seat(s)</strong></p>
          <button onClick={handleBooking} disabled={booking} className="book-btn">
            {booking ? 'Booking...' : `Confirm Booking (${selectedSeats.length} seat${selectedSeats.length !== 1 ? 's' : ''})`}
          </button>
        </div>
      )}
    </div>
  );
}

export default SeatSelection;
