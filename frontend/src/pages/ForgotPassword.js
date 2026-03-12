import React, { useState } from 'react';
import { Container, Form, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { data } = await authAPI.forgotPassword({ email });
      setMessage(data.message || 'Email sent successfully. Please check your inbox.');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Error occurred while sending reset email.'
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
              <span className="auth-icon">🔒</span>
            </div>
            <h2 className="auth-title">Forgot Password</h2>
            <p className="auth-subtitle">Enter your email to receive a reset link</p>
          </div>

          {error && <Alert variant="danger" className="auth-alert">{error}</Alert>}
          {message && <Alert variant="success" className="auth-alert">{message}</Alert>}

          <Form onSubmit={handleSubmit} className="auth-form">
            <Form.Group className="mb-4" controlId="email">
              <Form.Label className="auth-label">Email Address</Form.Label>
              <div className="auth-input-group">
                <span className="auth-input-icon">✉️</span>
                <Form.Control
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="auth-input"
                />
              </div>
            </Form.Group>

            <button
              className="auth-submit-btn w-100 mb-3"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" /> Sending...</span>
              ) : 'Send Reset Link'}
            </button>
            
            <div className="text-center">
              <Link to="/login" className="auth-link">
                ← Back to Login
              </Link>
            </div>
          </Form>
        </div>
      </Container>
    </div>
  );
};

export default ForgotPassword;
