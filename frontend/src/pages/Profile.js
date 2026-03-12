import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { authAPI } from '../services/api';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await authAPI.getProfile();
            setProfile(response.data.user);
            setFormData({
                name: response.data.user.name,
                email: response.data.user.email,
            });
        } catch (err) {
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const response = await authAPI.updateProfile(formData);
            setProfile({ ...profile, ...response.data.user });
            setSuccess('Profile updated successfully!');
            setEditMode(false);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }
        try {
            await authAPI.updateProfile({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            setSuccess('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowPasswordForm(false);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        }
    };

    if (loading) {
        return (
            <div className="loading-wrapper">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <span className="loading-text">Loading profile...</span>
            </div>
        );
    }

    return (
        <Container className="py-5" style={{ maxWidth: '800px' }}>
            <div className="page-header">
                <h1>👤 My Profile</h1>
                <p className="subtitle">Manage your account information</p>
            </div>

            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

            {/* Profile Card */}
            <Card className="mb-4 animate-fadeInUp">
                <Card.Body className="p-4">
                    <div className="d-flex align-items-center gap-4 mb-4">
                        <div
                            className="gradient-primary d-flex align-items-center justify-content-center"
                            style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                fontSize: '2rem', color: 'white', fontWeight: 700, flexShrink: 0,
                            }}
                        >
                            {profile?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{profile?.name}</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{profile?.email}</p>
                            <span className="role-badge">{profile?.role}</span>
                        </div>
                    </div>

                    <Row>
                        <Col md={6}>
                            <div className="mb-2">
                                <small style={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.75rem' }}>
                                    Member Since
                                </small>
                                <p style={{ fontWeight: 500 }}>
                                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'long', day: 'numeric'
                                    }) : 'N/A'}
                                </p>
                            </div>
                        </Col>
                        <Col md={6} className="text-md-end">
                            <Button
                                variant={editMode ? 'secondary' : 'primary'}
                                size="sm"
                                onClick={() => setEditMode(!editMode)}
                            >
                                {editMode ? 'Cancel Edit' : '✏️ Edit Profile'}
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Edit Profile Form */}
            {editMode && (
                <Card className="mb-4 animate-fadeInUp">
                    <Card.Header>
                        <h5 className="mb-0" style={{ fontWeight: 700 }}>Edit Profile</h5>
                    </Card.Header>
                    <Card.Body>
                        <Form onSubmit={handleUpdateProfile}>
                            <Form.Group className="mb-3">
                                <Form.Label>Full Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label>Email Address</Form.Label>
                                <Form.Control
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </Form.Group>
                            <Button type="submit" className="btn-gradient">
                                Save Changes
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            )}

            {/* Change Password */}
            <Card className="animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                <Card.Header className="d-flex align-items-center justify-content-between">
                    <h5 className="mb-0" style={{ fontWeight: 700 }}>🔒 Security</h5>
                    <Button
                        variant={showPasswordForm ? 'secondary' : 'warning'}
                        size="sm"
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                    >
                        {showPasswordForm ? 'Cancel' : 'Change Password'}
                    </Button>
                </Card.Header>
                {showPasswordForm && (
                    <Card.Body>
                        <Form onSubmit={handleChangePassword}>
                            <Form.Group className="mb-3">
                                <Form.Label>Current Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    placeholder="Enter current password"
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>New Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    placeholder="Enter new password (min 6 chars)"
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label>Confirm New Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    placeholder="Confirm new password"
                                    required
                                />
                            </Form.Group>
                            <Button type="submit" className="btn-gradient">
                                Update Password
                            </Button>
                        </Form>
                    </Card.Body>
                )}
            </Card>
        </Container>
    );
};

export default Profile;
