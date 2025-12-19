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
  const [rows, setRows] = useState([{ rowName: 'A', seatsPerColumn: 10, columns: 1 }]);
  const [selectedShowForMap, setSelectedShowForMap] = useState(''); // For seat map
  const [showSeats, setShowSeats] = useState([]); // For seat map
  const [hoveredSeat, setHoveredSeat] = useState(null); // For seat hover tooltip

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (password.trim() === '') {
      setError('Please enter admin password');
      return;
    }
    
    try {
      setError('');
      // Validate password by trying to load shows with admin header
      const response = await fetch(`${API_URL}/admin/shows`, {
        headers: { 'x-admin-password': password }
      });
      
      if (!response.ok) {
        setError('Invalid admin password');
        return;
      }
      
      // Password is correct, authenticate and load data
      setAdminPassword(password);
      setIsAuthenticated(true);
      setError('');
      
      // Load shows and bookings
      const data = await response.json();
      setShows(data);
      await loadBookings();
    } catch (err) {
      setError('Authentication failed');
      console.error(err);
    }
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
      setRows([{ rowName: 'A', seatsPerColumn: 10, columns: 1 }]);
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
    newRows.push({ rowName: nextRowName, seatsPerColumn: 10, columns: 1 });
    setRows(newRows);
  };

  // Update Row
  const handleUpdateRow = (index, field, value) => {
    const newRows = [...rows];
    if (field === 'seatsPerColumn' || field === 'columns') {
      newRows[index][field] = parseInt(value);
    } else {
      newRows[index][field] = value;
    }
    setRows(newRows);
  };

  // Delete Row
  const handleDeleteRow = (index) => {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
  };

  // Load seats for seat map
  const loadSeatsForMap = async (showId) => {
    try {
      const response = await fetch(`${API_URL}/shows/${showId}`);
      const data = await response.json();
      setShowSeats(data.seats || []);
    } catch (err) {
      setError('Failed to load seats');
    }
  };

  // Handle show selection for seat map
  const handleSelectShowForMap = (showId) => {
    setSelectedShowForMap(showId);
    loadSeatsForMap(showId);
  };

  // Delete a show
  const handleDeleteShow = async (showId, showName) => {
    if (!window.confirm(`Are you sure you want to delete "${showName}"? This will delete all seats and bookings for this show.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/shows/${showId}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': adminPassword }
      });

      if (!response.ok) {
        throw new Error('Failed to delete show');
      }

      setSuccess(`Show "${showName}" deleted successfully!`);
      loadShows(); // Reload shows list
      loadBookings(); // Reload bookings
    } catch (err) {
      setError(err.message || 'Failed to delete show');
    }
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
        <button
          className={`tab ${currentTab === 'seatMap' ? 'active' : ''}`}
          onClick={() => setCurrentTab('seatMap')}
        >
          🎫 Seat Map
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
                <h3>Rows and Seats Configuration</h3>
                <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
                  Configure rows with multiple aisles (columns). Example: Row A with 10 seats per column and 2 columns = 20 total seats with an aisle in middle
                </p>
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
                      placeholder="Seats per column"
                      value={row.seatsPerColumn}
                      onChange={(e) => handleUpdateRow(index, 'seatsPerColumn', e.target.value)}
                      className="seat-count-input"
                      min="1"
                      max="100"
                      title="Number of seats in each section"
                    />
                    <input
                      type="number"
                      placeholder="Number of aisles"
                      value={row.columns}
                      onChange={(e) => handleUpdateRow(index, 'columns', e.target.value)}
                      className="seat-count-input"
                      min="1"
                      max="5"
                      title="Number of sections/aisles (e.g., 2 = left and right of center aisle)"
                    />
                    <span style={{ fontSize: '12px', color: '#666', padding: '10px' }}>
                      Total: {row.seatsPerColumn * row.columns} seats
                    </span>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 10px 0' }}>{show.name}</h3>
                        <p style={{ margin: '5px 0' }}>📅 {new Date(show.date).toLocaleDateString()} at {new Date(show.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p style={{ margin: '5px 0' }}>Total Seats: <strong>{show.total_seats || 0}</strong></p>
                        <p style={{ margin: '5px 0' }}>Booked: <strong style={{color: '#e74c3c'}}>{show.booked_seats || 0}</strong></p>
                        <p style={{ margin: '5px 0' }}>Available: <strong style={{color: '#27ae60'}}>{(show.total_seats || 0) - (show.booked_seats || 0)}</strong></p>
                      </div>
                      <button
                        onClick={() => handleDeleteShow(show.id, show.name)}
                        className="delete-show-button"
                        title="Delete this show"
                      >
                        🗑️ Delete
                      </button>
                    </div>
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

        {/* Seat Map Tab */}
        {currentTab === 'seatMap' && (
          <div className="admin-section">
            <h2>🎫 Seat Map - Click Booked Seats to See Details</h2>
            
            <div className="form-group">
              <label>Select Show</label>
              <select
                value={selectedShowForMap}
                onChange={(e) => handleSelectShowForMap(e.target.value)}
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

            {selectedShowForMap && showSeats.length > 0 && (
              <div className="seat-map-container">
                <div className="seat-map-legend">
                  <div className="legend-item">
                    <div className="seat-indicator available"></div>
                    <span>Available</span>
                  </div>
                  <div className="legend-item">
                    <div className="seat-indicator booked"></div>
                    <span>Booked (hover for details)</span>
                  </div>
                </div>

                <div className="screen">SCREEN</div>

                <div className="seat-map">
                  {(() => {
                    // Group seats by row
                    const seatsByRow = {};
                    showSeats.forEach((seat) => {
                      if (!seatsByRow[seat.row_name]) {
                        seatsByRow[seat.row_name] = [];
                      }
                      seatsByRow[seat.row_name].push(seat);
                    });

                    // Sort rows and seats
                    const sortedRows = Object.keys(seatsByRow).sort();
                    Object.keys(seatsByRow).forEach(rowName => {
                      seatsByRow[rowName].sort((a, b) => a.seat_number - b.seat_number);
                    });

                    return sortedRows.map((rowName) => {
                      const rowSeats = seatsByRow[rowName];
                      
                      // Determine if this row has multiple columns/aisles
                      // Default: split in half if we have more than 10 seats
                      let seatsPerColumn = rowSeats.length;
                      if (rowSeats.length > 10) {
                        seatsPerColumn = Math.ceil(rowSeats.length / 2);
                      }
                      
                      return (
                        <div key={rowName} className="seat-row-map">
                          <div className="row-label-map">{rowName}</div>
                          <div className="seats-grid-with-aisle">
                            {/* First column */}
                            <div className="seats-column">
                              {rowSeats.slice(0, seatsPerColumn).map((seat) => (
                                <div
                                  key={seat.id}
                                  className="seat-container"
                                  onMouseEnter={() => setHoveredSeat(seat.id)}
                                  onMouseLeave={() => setHoveredSeat(null)}
                                >
                                  <button
                                    className={`seat-button ${seat.is_booked ? 'booked' : 'available'}`}
                                    title={seat.is_booked ? 'Click to see booking' : 'Available'}
                                  >
                                    {seat.seat_number}
                                  </button>
                                  
                                  {hoveredSeat === seat.id && seat.is_booked && (
                                    <div className="seat-tooltip">
                                      {(() => {
                                        const booking = bookings.find(b => b.seat_id === seat.id);
                                        return (
                                          <div>
                                            <strong>{seat.row_name}{seat.seat_number}</strong>
                                            {booking?.parent_first_name && booking?.parent_last_name ? (
                                              <>
                                                <p style={{margin: '4px 0', fontSize: '13px', fontWeight: 'bold'}}>
                                                  {booking.parent_first_name} {booking.parent_last_name}
                                                </p>
                                                <p style={{margin: '4px 0', fontSize: '11px'}}>
                                                  {booking.parent_email}
                                                </p>
                                              </>
                                            ) : (
                                              <p style={{margin: '4px 0'}}>
                                                {booking?.parent_email || 'Booked'}
                                              </p>
                                            )}
                                            {booking?.checked_in && (
                                              <p style={{margin: '4px 0', color: '#27ae60', fontSize: '12px'}}>
                                                ✓ Checked In
                                              </p>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {/* Aisle spacer */}
                            {rowSeats.length > seatsPerColumn && (
                              <div className="aisle-spacer"></div>
                            )}
                            
                            {/* Second column */}
                            {rowSeats.length > seatsPerColumn && (
                              <div className="seats-column">
                                {rowSeats.slice(seatsPerColumn).map((seat) => (
                                  <div
                                    key={seat.id}
                                    className="seat-container"
                                    onMouseEnter={() => setHoveredSeat(seat.id)}
                                    onMouseLeave={() => setHoveredSeat(null)}
                                  >
                                    <button
                                      className={`seat-button ${seat.is_booked ? 'booked' : 'available'}`}
                                      title={seat.is_booked ? 'Click to see booking' : 'Available'}
                                    >
                                      {seat.seat_number}
                                    </button>
                                    
                                    {hoveredSeat === seat.id && seat.is_booked && (
                                      <div className="seat-tooltip">
                                        {(() => {
                                          const booking = bookings.find(b => b.seat_id === seat.id);
                                          return (
                                            <div>
                                              <strong>{seat.row_name}{seat.seat_number}</strong>
                                              {booking?.parent_first_name && booking?.parent_last_name ? (
                                                <>
                                                  <p style={{margin: '4px 0', fontSize: '13px', fontWeight: 'bold'}}>
                                                    {booking.parent_first_name} {booking.parent_last_name}
                                                  </p>
                                                  <p style={{margin: '4px 0', fontSize: '11px'}}>
                                                    {booking.parent_email}
                                                  </p>
                                                </>
                                              ) : (
                                                <p style={{margin: '4px 0'}}>
                                                  {booking?.parent_email || 'Booked'}
                                                </p>
                                              )}
                                              {booking?.checked_in && (
                                                <p style={{margin: '4px 0', color: '#27ae60', fontSize: '12px'}}>
                                                  ✓ Checked In
                                                </p>
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="row-label-map">{rowName}</div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {selectedShowForMap && showSeats.length === 0 && (
              <p>No seats configured for this show yet.</p>
            )}

            {!selectedShowForMap && (
              <p>Select a show to view the seat map.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
