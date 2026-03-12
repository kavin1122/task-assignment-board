import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';
import { projectAPI, taskAPI } from '../services/api';

/**
 * Example component showing how to implement role-based UI rendering
 * This shows:
 * - Conditional rendering of admin-only buttons
 * - Role-based action visibility
 * - Task status updates for members
 * - Project management for admins
 */
const ProjectsExample = () => {
  const { isAdmin, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data.projects || []);
    } catch (err) {
      setError('Failed to load projects');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setError('Only admins can create projects');
      return;
    }

    try {
      await projectAPI.create(formData);
      setFormData({ name: '', description: '' });
      setShowCreateModal(false);
      await fetchProjects();
      alert('Project created successfully');
    } catch (err) {
      setError('Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!isAdmin) {
      alert('Only admins can delete projects');
      return;
    }

    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectAPI.delete(projectId);
        await fetchProjects();
        alert('Project deleted successfully');
      } catch (err) {
        alert('Failed to delete project');
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!isAdmin) {
      alert('Only admins can delete tasks');
      return;
    }

    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskAPI.delete(taskId);
        alert('Task deleted successfully');
      } catch (err) {
        alert('Failed to delete task');
      }
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    // Members can change status, admins can too
    try {
      await taskAPI.updateStatus(taskId, newStatus);
      alert('Status updated successfully');
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <Container className="py-5">
      <Row className="mb-4 align-items-center">
        <Col md={8}>
          <h1>Projects</h1>
        </Col>
        <Col md={4} className="text-end">
          {/* ADMIN-ONLY BUTTON */}
          {isAdmin && (
            <Button
              variant="success"
              onClick={() => setShowCreateModal(true)}
            >
              + Create Project
            </Button>
          )}

          {/* MEMBER INFO */}
          {!isAdmin && (
            <Alert variant="info" className="mb-0">
              View your assigned projects below
            </Alert>
          )}
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Create Project Modal - ADMIN ONLY */}
      {isAdmin && (
        <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Create New Project</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleCreateProject}>
              <Form.Group className="mb-3">
                <Form.Label>Project Name</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </Form.Group>
              <Button variant="primary" type="submit" className="w-100">
                Create Project
              </Button>
            </Form>
          </Modal.Body>
        </Modal>
      )}

      {/* Projects Table */}
      <Card>
        <Card.Body>
          {projects.length === 0 ? (
            <p className="text-muted">No projects available</p>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Description</th>
                  <th>Members</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project._id}>
                    <td><strong>{project.name}</strong></td>
                    <td>{project.description || 'N/A'}</td>
                    <td>{project.members?.length || 0}</td>
                    <td>
                      <Button
                        variant="primary"
                        size="sm"
                        className="me-2"
                      >
                        View
                      </Button>

                      {/* ADMIN-ONLY EDIT BUTTON */}
                      {isAdmin && (
                        <Button
                          variant="warning"
                          size="sm"
                          className="me-2"
                        >
                          Edit
                        </Button>
                      )}

                      {/* ADMIN-ONLY DELETE BUTTON */}
                      {isAdmin && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteProject(project._id)}
                        >
                          Delete
                        </Button>
                      )}

                      {/* ADMIN-ONLY MANAGE MEMBERS BUTTON */}
                      {isAdmin && (
                        <Button
                          variant="info"
                          size="sm"
                          className="ms-2"
                        >
                          Manage Members
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Example: Tasks with conditional rendering */}
      <Card className="mt-4">
        <Card.Header>
          <h5 className="mb-0">Tasks</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Status</th>
                {!isAdmin && <th>Update Status</th>}
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 3 : 3} className="text-center text-muted">
                    No tasks
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task._id}>
                    <td>{task.title}</td>
                    <td>{task.status}</td>

                    {/* MEMBER: Status change dropdown */}
                    {!isAdmin && (
                      <td>
                        <select
                          value={task.status}
                          onChange={(e) =>
                            handleStatusChange(task._id, e.target.value)
                          }
                          className="form-select form-select-sm"
                        >
                          <option value="todo">To Do</option>
                          <option value="inprogress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                    )}

                    {/* ADMIN: Delete button */}
                    {isAdmin && (
                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteTask(task._id)}
                        >
                          Delete
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProjectsExample;
