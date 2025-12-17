import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './api';
import Login from './pages/Login';
import Shows from './pages/Shows';
import SeatSelection from './pages/SeatSelection';
import MyBookings from './pages/MyBookings';
import CheckIn from './pages/CheckIn';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [parentInfo, setParentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await auth.getMe();
          setParentInfo(response.data);
          setIsAuthenticated(true);
        } catch (err) {
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setParentInfo(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <header className="header">
          <div className="container">
            <h1>🎭 Theater Ticketing</h1>
            {isAuthenticated && (
              <div className="header-actions">
                <span>Welcome, {parentInfo?.first_name || parentInfo?.email}</span>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            )}
          </div>
        </header>

        <main className="main">
          <Routes>
            <Route
              path="/"
              element={isAuthenticated ? <Navigate to="/shows" /> : <Navigate to="/login" />}
            />
            <Route
              path="/login"
              element={<Login onLoginSuccess={() => setIsAuthenticated(true)} />}
            />
            <Route
              path="/admin"
              element={<AdminDashboard />}
            />
            <Route
              path="/shows"
              element={isAuthenticated ? <Shows /> : <Navigate to="/login" />}
            />
            <Route
              path="/shows/:showId/seats"
              element={isAuthenticated ? <SeatSelection /> : <Navigate to="/login" />}
            />
            <Route
              path="/bookings"
              element={isAuthenticated ? <MyBookings /> : <Navigate to="/login" />}
            />
            <Route
              path="/check-in/:token"
              element={<CheckIn />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
