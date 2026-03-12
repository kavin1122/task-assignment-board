import React, { useState } from 'react';
import { Container, Form, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth(); // We might use this to auto-login if token logic supports it

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    setLoading(true);

    try {
      const { data } = await authAPI.resetPassword(token, { password });
      setMessage(data.message || 'Password reset successful');
      
      // If the backend returns a token upon reset, log them in immediately
      if (data.token && data.user) {
        login(data.token, data.user);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Error occurred while resetting password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 60px)' }}>
        <div className="auth-card">
          <div className="text-center mb-4">
            <div className="auth-icon-wrapper">
              <span className="auth-icon">🔑</span>
            </div>
            <h2 className="auth-title">Reset Password</h2>
            <p className="auth-subtitle">Create a new secure password</p>
          </div>

          {error && <Alert variant="danger" className="auth-alert">{error}</Alert>}
          {message && <Alert variant="success" className="auth-alert">{message}</Alert>}

          <Form onSubmit={handleSubmit} className="auth-form">
            <Form.Group className="mb-4" controlId="password">
              <Form.Label className="auth-label">New Password</Form.Label>
              <div className="auth-input-group">
                <span className="auth-input-icon">🔒</span>
                <Form.Control
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-input"
                  minLength="6"
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-4" controlId="confirmPassword">
              <Form.Label className="auth-label">Confirm New Password</Form.Label>
              <div className="auth-input-group">
                <span className="auth-input-icon">✓</span>
                <Form.Control
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="auth-input"
                  minLength="6"
                />
              </div>
            </Form.Group>

            <button
              className="auth-submit-btn w-100 mb-3"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" /> Resetting...</span>
              ) : 'Reset Password'}
            </button>
            
            <div className="text-center">
              <Link to="/login" className="auth-link">
                Cancel
              </Link>
            </div>
          </Form>
        </div>
      </Container>
    </div>
  );
};

export default ResetPassword;
