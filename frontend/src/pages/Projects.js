import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Alert,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { projectAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const Projects = () => {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getAll();
      setProjects(response.data.projects);
      setError(null);
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await projectAPI.create(formData);
      setSuccess('Project created successfully!');
      setFormData({ title: '', description: '' });
      setShowModal(false);
      await fetchProjects();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to create project');
    }
  };

  const handleDelete = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectAPI.delete(projectId);
        setSuccess('Project deleted successfully!');
        await fetchProjects();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Failed to delete project');
      }
    }
  };

  const filteredProjects = projects.filter(p =>
    (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
        <span className="loading-text">Loading projects...</span>
      </div>
    );
  }

  return (
    <Container className="py-5">
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h1>📂 Projects</h1>
            <p className="subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace</p>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <Form.Control
              type="text"
              placeholder="🔍 Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="sm"
              style={{ maxWidth: '200px' }}
            />
            {isAdmin && (
              <Button className="btn-gradient" onClick={() => setShowModal(true)}>
                + New Project
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      {/* Create Project Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create New Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Project Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter project title"
                required
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your project..."
                rows={3}
              />
            </Form.Group>
            <div className="d-flex gap-2">
              <Button type="submit" className="btn-gradient flex-grow-1">Create Project</Button>
              <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-grow-1">Cancel</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Projects Grid */}
      <Row className="stagger-children">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <Col md={6} lg={4} key={project._id} className="mb-4">
              <div className="project-card animate-fadeInUp">
                <div className="card-body p-4">
                  <h5 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{project.title}</h5>
                  <p style={{
                    color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {project.description || 'No description provided'}
                  </p>
                  <span className="badge bg-info mb-3" style={{ display: 'inline-block' }}>
                    👥 {project.members.length} member{project.members.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="card-footer d-flex align-items-center justify-content-between">
                  <Link to={`/project/${project._id}`} className="btn btn-primary btn-sm">View Details →</Link>
                  {isAdmin && (
                    <Button variant="danger" size="sm" onClick={() => handleDelete(project._id)}>Delete</Button>
                  )}
                </div>
              </div>
            </Col>
          ))
        ) : (
          <Col xs={12}>
            <div className="card">
              <div className="card-body">
                <div className="empty-state">
                  <div className="empty-state-icon">{searchQuery ? '🔍' : '🚀'}</div>
                  <div className="empty-state-text">
                    {searchQuery ? 'No projects match your search' : 'No projects yet. Create one to get started!'}
                  </div>
                </div>
              </div>
            </div>
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default Projects;
