import React from 'react';
import { Container, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="error-page">
      <Container className="d-flex justify-content-center align-items-center">
        <Col md={6} lg={5}>
          <div className="glass-card text-center p-5 animate-fadeInUp">
            <div className="error-code mb-3">403</div>
            <h2 className="mb-3" style={{ fontWeight: 700 }}>Access Denied</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.7 }}>
              You don't have permission to access this resource.
              Please contact your administrator if you believe this is an error.
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <button
                className="btn btn-gradient"
                onClick={() => navigate('/')}
              >
                Go Home
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
              >
                Go Back
              </button>
            </div>
          </div>
        </Col>
      </Container>
    </div>
  );
};

export default Unauthorized;
