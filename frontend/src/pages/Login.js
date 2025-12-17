import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../api';
import './Login.css';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyToken(token);
    }
  }, [searchParams]);

  const verifyToken = async (token) => {
    setVerifyingToken(true);
    try {
      const response = await auth.verifyLogin(token);
      localStorage.setItem('authToken', response.data.token);
      onLoginSuccess();
      navigate('/shows');
    } catch (err) {
      setError('Login token is invalid or expired. Please request a new login link.');
    } finally {
      setVerifyingToken(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await auth.requestLogin(email, firstName, lastName);
      setMessage('Check your email for a login link!');
      setEmail('');
      setFirstName('');
      setLastName('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request login');
    } finally {
      setLoading(false);
    }
  };

  if (verifyingToken) {
    return <div className="login-container"><div className="loading">Verifying your login...</div></div>;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login to Book Your Ticket</h2>
        
        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
            />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Login Link'}
          </button>
        </form>

        <p className="login-info">
          We'll send you a secure login link via email. No password needed!
        </p>
      </div>
    </div>
  );
}

export default Login;
