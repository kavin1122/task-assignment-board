import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Alert, Badge, Button, Form, Modal, Tabs, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { projectAPI, taskAPI, uploadAPI } from '../services/api';

const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getFileIcon = (mimeType) => {
  if (!mimeType) return '📄';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html')) return '💻';
  return '📄';
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload management
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTaskId, setUploadTaskId] = useState(null);
  const [uploadTaskTitle, setUploadTaskTitle] = useState('');
  const [uploadTab, setUploadTab] = useState('file');
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [linkData, setLinkData] = useState({ link: '', linkTitle: '', description: '' });
  const [fileDescription, setFileDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  // View submissions
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [viewTaskId, setViewTaskId] = useState(null);
  const [viewTaskTitle, setViewTaskTitle] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) navigate('/admin-dashboard');
  }, [isAdmin, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectsRes, tasksRes] = await Promise.all([
          projectAPI.getAll(),
          taskAPI.getAll(),
        ]);
        setProjects(projectsRes.data.projects || []);
        setAllTasks(tasksRes.data.tasks || []);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let tasks = [...allTasks];
    if (statusFilter !== 'all') tasks = tasks.filter(t => t.status === statusFilter);
    if (searchQuery) tasks = tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredTasks(tasks);
  }, [allTasks, statusFilter, searchQuery]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskAPI.updateStatus(taskId, newStatus);
      setAllTasks(allTasks.map(t =>
        t._id === taskId ? { ...t, status: newStatus } : t
      ));
    } catch (err) {
      alert('Failed to update task status');
    }
  };

  // Upload handlers
  const openUploadModal = (taskId, taskTitle) => {
    setUploadTaskId(taskId);
    setUploadTaskTitle(taskTitle);
    setShowUploadModal(true);
    setSelectedFiles(null);
    setFileDescription('');
    setLinkData({ link: '', linkTitle: '', description: '' });
    setUploadTab('file');
  };

  const handleFileUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setUploading(true);
    try {
      if (selectedFiles.length === 1) {
        const formData = new FormData();
        formData.append('file', selectedFiles[0]);
        formData.append('description', fileDescription);
        await uploadAPI.uploadFile(uploadTaskId, formData);
      } else {
        const formData = new FormData();
        for (const file of selectedFiles) formData.append('files', file);
        formData.append('description', fileDescription);
        await uploadAPI.uploadFiles(uploadTaskId, formData);
      }
      setShowUploadModal(false);
      alert('File(s) uploaded successfully!');
    } catch (err) {
      alert('Failed to upload file(s)');
    } finally {
      setUploading(false);
    }
  };

  const handleLinkSubmit = async () => {
    if (!linkData.link) return;
    setUploading(true);
    try {
      await uploadAPI.submitLink(uploadTaskId, linkData);
      setShowUploadModal(false);
      alert('Link submitted successfully!');
    } catch (err) {
      alert('Failed to submit link');
    } finally {
      setUploading(false);
    }
  };

  // View submissions
  const openSubmissionsModal = async (taskId, taskTitle) => {
    setViewTaskId(taskId);
    setViewTaskTitle(taskTitle);
    setShowSubmissionsModal(true);
    setSubmissionsLoading(true);
    try {
      const res = await uploadAPI.getByTask(taskId);
      setSubmissions(res.data.uploads || []);
    } catch (err) {
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleDeleteSubmission = async (uploadId) => {
    if (window.confirm('Delete this submission?')) {
      try {
        await uploadAPI.delete(uploadId);
        setSubmissions(submissions.filter(s => s._id !== uploadId));
      } catch (err) {
        alert('Failed to delete');
      }
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      todo: { bg: 'secondary', icon: '📝', label: 'To Do' },
      inprogress: { bg: 'warning', icon: '⏳', label: 'In Progress' },
      completed: { bg: 'success', icon: '✅', label: 'Done' },
    };
    const c = config[status] || config.todo;
    return <Badge bg={c.bg}>{c.icon} {c.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
        <span className="loading-text">Loading your dashboard...</span>
      </div>
    );
  }

  const completedCount = allTasks.filter(t => t.status === 'completed').length;
  const progressPercent = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

  return (
    <Container className="py-5">
      <div className="page-header">
        <h1>📊 My Dashboard</h1>
        <p className="subtitle">Welcome, {user?.name} — Here's your work overview</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Stats */}
      <Row className="mb-5 stagger-children">
        <Col md={4} className="mb-3">
          <div className="stat-card primary animate-fadeInUp">
            <div className="d-flex align-items-center gap-3">
              <div className="stat-icon gradient-primary" style={{ color: 'white' }}>📂</div>
              <div><div className="stat-value" style={{ color: '#818cf8' }}>{projects.length}</div><div className="stat-label">My Projects</div></div>
            </div>
          </div>
        </Col>
        <Col md={4} className="mb-3">
          <div className="stat-card warning animate-fadeInUp">
            <div className="d-flex align-items-center gap-3">
              <div className="stat-icon gradient-warning" style={{ color: 'white' }}>📋</div>
              <div><div className="stat-value" style={{ color: '#fbbf24' }}>{allTasks.length}</div><div className="stat-label">My Tasks</div></div>
            </div>
          </div>
        </Col>
        <Col md={4} className="mb-3">
          <div className="stat-card success animate-fadeInUp">
            <div className="d-flex align-items-center gap-3">
              <div className="stat-icon gradient-success" style={{ color: 'white' }}>✅</div>
              <div><div className="stat-value" style={{ color: '#34d399' }}>{completedCount}</div><div className="stat-label">Done ({progressPercent}%)</div></div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Projects */}
      <div className="animate-fadeInUp mb-5" style={{ animationDelay: '0.2s' }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <h4 style={{ fontWeight: 700 }}>📂 My Projects</h4>
          <span className="badge bg-primary">{projects.length}</span>
        </div>
        {projects.length === 0 ? (
          <Card><Card.Body><div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-text">Not assigned to any projects yet</div></div></Card.Body></Card>
        ) : (
          <Row className="stagger-children">
            {projects.map((project) => (
              <Col md={6} lg={4} key={project._id} className="mb-3">
                <div className="project-card animate-fadeInUp">
                  <Card.Body className="p-4">
                    <h5 style={{ fontWeight: 700 }}>{project.name || project.title}</h5>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      {project.description || 'No description'}
                    </p>
                    <Button variant="primary" size="sm" onClick={() => navigate(`/project/${project._id}`)}>
                      View Project →
                    </Button>
                  </Card.Body>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* Tasks with Search & Filter + Upload Buttons */}
      <div className="animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <h4 style={{ fontWeight: 700 }}>📋 My Tasks</h4>
          <span className="badge bg-warning">{filteredTasks.length}</span>
        </div>

        {/* Filters */}
        <div className="card mb-3">
          <div className="card-body py-2 px-3">
            <Row className="align-items-center g-2">
              <Col md={7}>
                <Form.Control type="text" placeholder="🔍 Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} size="sm" />
              </Col>
              <Col md={4}>
                <Form.Select size="sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="todo">📝 To Do</option>
                  <option value="inprogress">⏳ In Progress</option>
                  <option value="completed">✅ Completed</option>
                </Form.Select>
              </Col>
            </Row>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-0">
            {filteredTasks.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-text">No tasks match filters</div></div>
            ) : (
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Deadline</th>
                      <th>Update</th>
                      <th>Submissions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr key={task._id}>
                        <td style={{ fontWeight: 500 }}>
                          {task.title}
                          {task.taskType && task.taskType !== 'general' && (
                            <Badge bg={task.taskType === 'mcq' ? 'info' : 'warning'} className="ms-2" style={{ fontSize: '0.65rem' }}>
                              {task.taskType === 'mcq' ? 'MCQ' : 'Code'}
                            </Badge>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{task.projectId?.name || task.projectId?.title || 'Unknown'}</td>
                        <td>{getStatusBadge(task.status)}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {task.deadline ? new Date(task.deadline).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <Form.Select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                            size="sm"
                            style={{ maxWidth: '140px' }}
                          >
                            <option value="todo">📝 To Do</option>
                            <option value="inprogress">⏳ Active</option>
                            <option value="completed">✅ Done</option>
                          </Form.Select>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            {(!task.taskType || task.taskType === 'general') ? (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => openUploadModal(task._id, task.title)}
                                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                                >
                                  📤 Upload
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => openSubmissionsModal(task._id, task.title)}
                                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                                >
                                  📎 View
                                </Button>
                              </>
                            ) : (
                              task.status === 'completed' && (
                                <Button
                                  variant="outline-light"
                                  size="sm"
                                  onClick={() => navigate(`/task/${task._id}/view`)}
                                  style={{
                                    fontSize: '0.75rem', padding: '0.2rem 0.5rem',
                                    fontWeight: 600,
                                    borderColor: '#818cf8', color: '#818cf8',
                                    borderRadius: '8px',
                                  }}
                                >
                                  👁 View
                                </Button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============ UPLOAD MODAL ============ */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1rem' }}>
            📤 Upload for: <span style={{ color: '#818cf8' }}>{uploadTaskTitle}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs activeKey={uploadTab} onSelect={(k) => setUploadTab(k)} className="mb-3">
            <Tab eventKey="file" title="📁 File / Folder">
              <Form.Group className="mb-3">
                <Form.Label>Select File(s)</Form.Label>
                <Form.Control type="file" multiple onChange={(e) => setSelectedFiles(e.target.files)} />
                <Form.Text className="text-muted">Select multiple files for folder contents. Max 50MB each.</Form.Text>
              </Form.Group>
              {selectedFiles && selectedFiles.length > 0 && (
                <div className="mb-3 p-2" style={{ background: 'rgba(79,70,229,0.05)', borderRadius: '8px' }}>
                  <small style={{ fontWeight: 600, color: '#818cf8' }}>
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                  </small>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {Array.from(selectedFiles).map(f => f.name).join(', ')}
                  </div>
                </div>
              )}
              <Form.Group className="mb-3">
                <Form.Label>Description <span style={{ color: 'var(--text-muted)' }}>(optional)</span></Form.Label>
                <Form.Control type="text" value={fileDescription} onChange={(e) => setFileDescription(e.target.value)} placeholder="Brief description..." />
              </Form.Group>
              <Button className="btn-gradient w-100" onClick={handleFileUpload} disabled={uploading || !selectedFiles}>
                {uploading ? (<><span className="spinner-border spinner-border-sm me-2" />Uploading...</>) : '📤 Upload File(s)'}
              </Button>
            </Tab>

            <Tab eventKey="link" title="🔗 Link">
              <Form.Group className="mb-3">
                <Form.Label>URL</Form.Label>
                <Form.Control type="url" value={linkData.link} onChange={(e) => setLinkData({ ...linkData, link: e.target.value })} placeholder="https://github.com/your-repo" required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Link Title <span style={{ color: 'var(--text-muted)' }}>(optional)</span></Form.Label>
                <Form.Control type="text" value={linkData.linkTitle} onChange={(e) => setLinkData({ ...linkData, linkTitle: e.target.value })} placeholder="e.g. GitHub Repository" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description <span style={{ color: 'var(--text-muted)' }}>(optional)</span></Form.Label>
                <Form.Control type="text" value={linkData.description} onChange={(e) => setLinkData({ ...linkData, description: e.target.value })} placeholder="Brief description..." />
              </Form.Group>
              <Button className="btn-gradient w-100" onClick={handleLinkSubmit} disabled={uploading || !linkData.link}>
                {uploading ? (<><span className="spinner-border spinner-border-sm me-2" />Submitting...</>) : '🔗 Submit Link'}
              </Button>
            </Tab>
          </Tabs>
        </Modal.Body>
      </Modal>

      {/* ============ VIEW SUBMISSIONS MODAL ============ */}
      <Modal show={showSubmissionsModal} onHide={() => setShowSubmissionsModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1rem' }}>
            📎 Submissions: <span style={{ color: '#818cf8' }}>{viewTaskTitle}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {submissionsLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm" role="status" />
              <span className="ms-2">Loading...</span>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-4">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
              <p style={{ color: 'var(--text-muted)' }}>No submissions yet</p>
              <Button className="btn-gradient" size="sm" onClick={() => { setShowSubmissionsModal(false); openUploadModal(viewTaskId, viewTaskTitle); }}>
                📤 Upload Now
              </Button>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {submissions.map((upload) => (
                <Card key={upload._id} style={{ borderLeft: `3px solid ${upload.uploadType === 'file' ? '#818cf8' : '#22d3ee'}` }}>
                  <Card.Body className="p-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-3">
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.2rem',
                          background: upload.uploadType === 'file' ? 'rgba(79,70,229,0.12)' : 'rgba(34,211,238,0.12)',
                        }}>
                          {upload.uploadType === 'file' ? getFileIcon(upload.mimeType) : '🔗'}
                        </div>
                        <div>
                          {upload.uploadType === 'file' ? (
                            <a href={`${API_URL}${upload.filePath}`} target="_blank" rel="noopener noreferrer"
                              style={{ fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
                              {upload.fileName}
                            </a>
                          ) : (
                            <a href={upload.link} target="_blank" rel="noopener noreferrer"
                              style={{ fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
                              {upload.linkTitle || upload.link}
                            </a>
                          )}
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {upload.userId?.name} • {new Date(upload.createdAt).toLocaleString()}
                            {upload.fileSize ? ` • ${formatFileSize(upload.fileSize)}` : ''}
                          </div>
                          {upload.description && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{upload.description}</div>
                          )}
                        </div>
                      </div>
                      <button className="btn btn-sm" onClick={() => handleDeleteSubmission(upload._id)}
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'none', borderRadius: '6px', fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>
                        ✕
                      </button>
                    </div>
                  </Card.Body>
                </Card>
              ))}
              <div className="text-center mt-2">
                <Button className="btn-gradient" size="sm" onClick={() => { setShowSubmissionsModal(false); openUploadModal(viewTaskId, viewTaskTitle); }}>
                  📤 Upload More
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default UserDashboard;