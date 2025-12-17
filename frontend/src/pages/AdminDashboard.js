import React, { useState, useEffect } from 'react';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState(''); // Store actual password for API calls
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState('createShow');
  const [shows, setShows] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create Show State
  const [showName, setShowName] = useState('');
  const [showDescription, setShowDescription] = useState('');
  const [showDate, setShowDate] = useState('');

  // Create Seats State
  const [selectedShow, setSelectedShow] = useState('');
  const [rows, setRows] = useState([{ rowName: 'A', seatCount: 10 }]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Admin Login
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (password.trim() === '') {
      setError('Please enter admin password');
      return;
    }
    setAdminPassword(password); // Store for API calls
    setIsAuthenticated(true);
    setError('');
    // Don't clear password yet - we need it for loadShows/loadBookings
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setAdminPassword(''); // Clear stored password
    setCurrentTab('createShow');
  };

  // Load Shows
  const loadShows = async () => {
    try {
      const response = await fetch(`${API_URL}/shows`);
      const data = await response.json();
      setShows(data);
    } catch (err) {
      setError('Failed to load shows');
    }
  };

  // Load Bookings
  const loadBookings = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/shows/1/bookings`, {
        headers: { 'x-admin-password': adminPassword }
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (err) {
      console.log('Could not load bookings');
    }
  };

  // Create Show
  const handleCreateShow = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!showName || !showDate) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/shows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({
          name: showName,
          description: showDescription,
          date: new Date(showDate).toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create show');
      }

      setSuccess(`Show "${showName}" created successfully!`);
      setShowName('');
      setShowDescription('');
      setShowDate('');
      loadShows();
    } catch (err) {
      setError(err.message || 'Failed to create show');
    }
  };

  // Create Seats
  const handleCreateSeats = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedShow) {
      setError('Please select a show');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/shows/${selectedShow}/seats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({ rows: rows })
      });

      if (!response.ok) {
        throw new Error('Failed to create seats');
      }

      setSuccess('Seats created successfully!');
      setRows([{ rowName: 'A', seatCount: 10 }]);
      loadShows();
    } catch (err) {
      setError(err.message || 'Failed to create seats');
    }
  };

  // Add Row
  const handleAddRow = () => {
    const newRows = [...rows];
    const lastRow = newRows[newRows.length - 1];
    const nextRowName = String.fromCharCode(lastRow.rowName.charCodeAt(0) + 1);
    newRows.push({ rowName: nextRowName, seatCount: 10 });
    setRows(newRows);
  };

  // Update Row
  const handleUpdateRow = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = field === 'seatCount' ? parseInt(value) : value;
    setRows(newRows);
  };

  // Delete Row
  const handleDeleteRow = (index) => {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-box">
          <h1>🎭 Admin Dashboard</h1>
          <p>Enter admin password to continue</p>
          
          <form onSubmit={handleAdminLogin}>
            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input"
            />
            <button type="submit" className="admin-button">
              Login
            </button>
          </form>

          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <h1>🎭 Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab ${currentTab === 'createShow' ? 'active' : ''}`}
          onClick={() => setCurrentTab('createShow')}
        >
          📝 Create Show
        </button>
        <button
          className={`tab ${currentTab === 'addSeats' ? 'active' : ''}`}
          onClick={() => setCurrentTab('addSeats')}
        >
          💺 Add Seats
        </button>
        <button
          className={`tab ${currentTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setCurrentTab('bookings')}
        >
          📊 View Bookings
        </button>
      </div>

      {/* Messages */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Content */}
      <div className="admin-content">
        {/* Create Show Tab */}
        {currentTab === 'createShow' && (
          <div className="admin-section">
            <h2>Create New Show</h2>
            <form onSubmit={handleCreateShow} className="admin-form">
              <div className="form-group">
                <label>Show Name *</label>
                <input
                  type="text"
                  placeholder="e.g., School Concert"
                  value={showName}
                  onChange={(e) => setShowName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="e.g., Annual holiday concert"
                  value={showDescription}
                  onChange={(e) => setShowDescription(e.target.value)}
                  className="form-input"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Date & Time *</label>
                <input
                  type="datetime-local"
                  value={showDate}
                  onChange={(e) => setShowDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <button type="submit" className="submit-button">
                Create Show
              </button>
            </form>
          </div>
        )}

        {/* Add Seats Tab */}
        {currentTab === 'addSeats' && (
          <div className="admin-section">
            <h2>Add Seats to Show</h2>
            <form onSubmit={handleCreateSeats} className="admin-form">
              <div className="form-group">
                <label>Select Show *</label>
                <select
                  value={selectedShow}
                  onChange={(e) => setSelectedShow(e.target.value)}
                  className="form-input"
                >
                  <option value="">-- Choose a show --</option>
                  {shows.map((show) => (
                    <option key={show.id} value={show.id}>
                      {show.name} ({new Date(show.date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rows-container">
                <h3>Rows and Seats</h3>
                {rows.map((row, index) => (
                  <div key={index} className="row-input-group">
                    <input
                      type="text"
                      placeholder="Row Name (A, B, C...)"
                      value={row.rowName}
                      onChange={(e) => handleUpdateRow(index, 'rowName', e.target.value)}
                      className="row-name-input"
                      maxLength="2"
                    />
                    <input
                      type="number"
                      placeholder="Number of seats"
                      value={row.seatCount}
                      onChange={(e) => handleUpdateRow(index, 'seatCount', e.target.value)}
                      className="seat-count-input"
                      min="1"
                      max="100"
                    />
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(index)}
                        className="delete-row-button"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddRow}
                className="add-row-button"
              >
                + Add Another Row
              </button>

              <button type="submit" className="submit-button">
                Create Seats
              </button>
            </form>
          </div>
        )}

        {/* Bookings Tab */}
        {currentTab === 'bookings' && (
          <div className="admin-section">
            <h2>Current Bookings</h2>
            
            <div className="shows-list">
              {shows.length === 0 ? (
                <p>No shows created yet</p>
              ) : (
                shows.map((show) => (
                  <div key={show.id} className="show-card">
                    <h3>{show.name}</h3>
                    <p>📅 {new Date(show.date).toLocaleDateString()} at {new Date(show.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p>Total Seats: <strong>{show.total_seats || 0}</strong></p>
                    <p>Booked: <strong style={{color: '#e74c3c'}}>{show.booked_seats || 0}</strong></p>
                    <p>Available: <strong style={{color: '#27ae60'}}>{(show.total_seats || 0) - (show.booked_seats || 0)}</strong></p>
                  </div>
                ))
              )}
            </div>

            <div className="bookings-table">
              <h3>Recent Bookings</h3>
              {bookings.length === 0 ? (
                <p>No bookings yet</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Seat</th>
                      <th>Booked At</th>
                      <th>Checked In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>{booking.parent_email}</td>
                        <td>Row {booking.row_name}, Seat {booking.seat_number}</td>
                        <td>{new Date(booking.created_at).toLocaleDateString()}</td>
                        <td>
                          {booking.checked_in ? (
                            <span className="checked-in">✓ Yes</span>
                          ) : (
                            <span className="not-checked-in">✗ No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
