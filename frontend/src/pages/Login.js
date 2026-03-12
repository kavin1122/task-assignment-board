import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(formData);
      if (response.user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/user-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-wrapper">
      <Container className="d-flex justify-content-center align-items-center" style={{ position: 'relative', zIndex: 1 }}>
        <div className="auth-card w-100" style={{ maxWidth: '440px' }}>
          <div className="p-5">
            <div className="text-center mb-4">
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✦</div>
              <h2 className="auth-title">Welcome Back</h2>
              <p className="auth-subtitle">Sign in to your TaskBoard account</p>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <Form.Label className="mb-0">Password</Form.Label>
                  <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#818cf8', textDecoration: 'none' }}>
                    Forgot password?
                  </Link>
                </div>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </Form.Group>
              <Button
                type="submit"
                className="btn-gradient w-100 mb-3"
                disabled={loading}
                style={{ padding: '0.75rem' }}
              >
                {loading ? (
                  <span className="d-flex align-items-center justify-content-center gap-2">
                    <span className="spinner-border spinner-border-sm" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In →'
                )}
              </Button>
            </Form>

            <p className="text-center mb-0" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ fontWeight: 600 }}>
                Create one
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Login;
