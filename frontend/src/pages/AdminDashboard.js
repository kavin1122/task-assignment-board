import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Table, Alert, Form, Modal, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useAuth } from '../hooks/useAuth';
import { projectAPI, taskAPI, teamAPI, authAPI } from '../services/api';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Team creation modal
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [teamCreating, setTeamCreating] = useState(false);

  useEffect(() => {
    if (!isAdmin) navigate('/user-dashboard');
  }, [isAdmin, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectsRes, tasksRes, teamsRes, usersRes] = await Promise.all([
          projectAPI.getAll(),
          taskAPI.getAll(),
          teamAPI.getAll(),
          authAPI.getUsers(),
        ]);
        setProjects(projectsRes.data.projects || []);
        setAllTasks(tasksRes.data.tasks || []);
        setAllTeams(teamsRes.data.teams || []);
        setAllUsers(usersRes.data.users || []);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectAPI.delete(projectId);
        setProjects(projects.filter(p => p._id !== projectId));
      } catch (err) {
        alert('Failed to delete project');
      }
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setTeamCreating(true);
    try {
      const res = await teamAPI.create({ name: teamName.trim(), members: selectedMembers });
      setAllTeams([res.data.team, ...allTeams]);
      setShowTeamModal(false);
      setTeamName('');
      setSelectedMembers([]);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create team');
    } finally {
      setTeamCreating(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await teamAPI.delete(teamId);
        setAllTeams(allTeams.filter(t => t._id !== teamId));
      } catch (err) {
        alert('Failed to delete team');
      }
    }
  };

  const toggleMemberSelection = (memberId) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const filteredProjects = projects.filter(p =>
    (p.name || p.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMembers = projects.reduce((total, p) => total + (p.members?.length || 0), 0);
  const todoCount = allTasks.filter(t => t.status === 'todo').length;
  const inprogressCount = allTasks.filter(t => t.status === 'inprogress').length;
  const completedCount = allTasks.filter(t => t.status === 'completed').length;

  // Task status chart
  const statusChartData = {
    labels: ['To Do', 'In Progress', 'Completed'],
    datasets: [{
      data: [todoCount, inprogressCount, completedCount],
      backgroundColor: ['rgba(100,116,139,0.7)', 'rgba(245,158,11,0.7)', 'rgba(16,185,129,0.7)'],
      borderColor: ['#64748b', '#f59e0b', '#10b981'],
      borderWidth: 2,
    }],
  };

  // Tasks per project chart
  const barChartData = {
    labels: projects.slice(0, 6).map(p => (p.name || p.title || '').substring(0, 12)),
    datasets: [{
      label: 'Tasks',
      data: projects.slice(0, 6).map(p => allTasks.filter(t => t.projectId?._id === p._id || t.projectId === p._id).length),
      backgroundColor: 'rgba(79, 70, 229, 0.6)',
      borderColor: '#4f46e5',
      borderWidth: 2,
      borderRadius: 6,
    }],
  };

  const chartOptions = {
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.08)' } },
      y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(148,163,184,0.08)' } },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
        <span className="loading-text">Loading admin dashboard...</span>
      </div>
    );
  }

  // Get member users (non-admin) for team creation
  const memberUsers = allUsers.filter(u => u.role === 'member');

  return (
    <Container className="py-5">
      <div className="page-header">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h1>⚡ Admin Dashboard</h1>
            <p className="subtitle">Welcome, {user?.name} — Manage projects and teams</p>
          </div>
          <div className="d-flex gap-2">
            <Button className="btn-gradient" onClick={() => navigate('/projects')}>+ Create Project</Button>
            <Button variant="secondary" onClick={() => setShowTeamModal(true)}>+ Create Team</Button>
          </div>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Stats */}
      <Row className="mb-4 stagger-children">
        <Col md={3} className="mb-3">
          <div className="stat-card primary animate-fadeInUp">
            <div className="d-flex align-items-center gap-3">
              <div className="stat-icon gradient-primary" style={{ color: 'white' }}>📂</div>
              <div><div className="stat-value" style={{ color: '#818cf8' }}>{projects.length}</div><div className="stat-label">Projects</div></div>
            </div>
          </div>
        </Col>
        <Col md={3} className="mb-3">
          <div className="stat-card info animate-fadeInUp">
            <div className="d-flex align-items-center gap-3">
              <div className="stat-icon gradient-info" style={{ color: 'white' }}>👥</div>
              <div><div className="stat-value" style={{ color: '#22d3ee' }}>{allTeams.length}</div><div className="stat-label">Teams</div></div>
            </div>
          </div>
        </Col>
        <Col md={3} className="mb-3">
          <div className="stat-card warning animate-fadeInUp">
            <div className="d-flex align-items-center gap-3">
              <div className="stat-icon gradient-warning" style={{ color: 'white' }}>📋</div>
              <div><div className="stat-value" style={{ color: '#fbbf24' }}>{allTasks.length}</div><div className="stat-label">Total Tasks</div></div>
            </div>
          </div>
        </Col>
        <Col md={3} className="mb-3">
          <div className="stat-card success animate-fadeInUp">
            <div className="d-flex align-items-center gap-3">
              <div className="stat-icon gradient-success" style={{ color: 'white' }}>✅</div>
              <div><div className="stat-value" style={{ color: '#34d399' }}>{completedCount}</div><div className="stat-label">Completed</div></div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Charts */}
      <Row className="mb-5">
        <Col md={5} className="mb-3">
          <div className="card animate-fadeInUp p-3" style={{ animationDelay: '0.2s' }}>
            <h5 style={{ fontWeight: 700, marginBottom: '1rem' }}>📊 Task Status</h5>
            <div style={{ height: '220px' }}>
              {allTasks.length > 0 ? (
                <Doughnut data={statusChartData} options={{ plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12 } } }, cutout: '65%', responsive: true, maintainAspectRatio: false }} />
              ) : (
                <div className="empty-state"><div className="empty-state-text">No data</div></div>
              )}
            </div>
          </div>
        </Col>
        <Col md={7} className="mb-3">
          <div className="card animate-fadeInUp p-3" style={{ animationDelay: '0.3s' }}>
            <h5 style={{ fontWeight: 700, marginBottom: '1rem' }}>📈 Tasks per Project</h5>
            <div style={{ height: '220px' }}>
              {projects.length > 0 ? <Bar data={barChartData} options={chartOptions} /> : (
                <div className="empty-state"><div className="empty-state-text">No data</div></div>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Teams Section */}
      <div className="animate-fadeInUp mb-5" style={{ animationDelay: '0.32s' }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <h4 style={{ fontWeight: 700 }}>👥 Teams</h4>
            <span className="badge bg-info">{allTeams.length}</span>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowTeamModal(true)}>+ Create Team</Button>
        </div>
        <div className="card">
          <div className="card-body p-0">
            {allTeams.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-text">No teams created yet</div></div>
            ) : (
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead><tr><th>Team Name</th><th>Members</th><th>Member List</th><th>Actions</th></tr></thead>
                  <tbody>
                    {allTeams.map((team) => (
                      <tr key={team._id}>
                        <td style={{ fontWeight: 600 }}>👥 {team.name}</td>
                        <td><span className="badge bg-primary">{team.members?.length || 0}</span></td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {team.members?.map(m => (
                              <span key={m._id} className="member-badge" style={{ fontSize: '0.75rem' }}>
                                👤 {m.name}
                              </span>
                            ))}
                            {(!team.members || team.members.length === 0) && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No members</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteTeam(team._id)}>Delete</Button>
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

      {/* Projects Table */}
      <div className="animate-fadeInUp" style={{ animationDelay: '0.35s' }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <h4 style={{ fontWeight: 700 }}>📋 Projects</h4>
            <span className="badge bg-primary">{filteredProjects.length}</span>
          </div>
          <Form.Control
            type="text"
            placeholder="🔍 Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="sm"
            style={{ maxWidth: '250px' }}
          />
        </div>
        <div className="card">
          <div className="card-body p-0">
            {filteredProjects.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-text">No projects found</div></div>
            ) : (
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead><tr><th>Project</th><th>Description</th><th>Teams</th><th>Members</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr key={project._id}>
                        <td style={{ fontWeight: 600 }}>{project.name || project.title}</td>
                        <td style={{ color: 'var(--text-secondary)', maxWidth: '250px' }}>
                          {project.description || <span style={{ opacity: 0.5 }}>No description</span>}
                        </td>
                        <td><span className="badge bg-info">{project.teams?.length || 0}</span></td>
                        <td><span className="badge bg-primary">{project.members?.length || 0}</span></td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button variant="info" size="sm" onClick={() => navigate(`/project/${project._id}`)}>View</Button>
                            <Button variant="danger" size="sm" onClick={() => handleDeleteProject(project._id)}>Delete</Button>
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

      {/* Create Team Modal */}
      <Modal show={showTeamModal} onHide={() => setShowTeamModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>👥 Create Team</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateTeam}>
            <Form.Group className="mb-3">
              <Form.Label>Team Name</Form.Label>
              <Form.Control
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Frontend Team"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Select Members</Form.Label>
              <div style={{
                maxHeight: '250px', overflowY: 'auto',
                border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem',
              }}>
                {memberUsers.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '1rem 0' }}>No members available</p>
                ) : (
                  memberUsers.map(u => (
                    <div
                      key={u._id}
                      onClick={() => toggleMemberSelection(u._id)}
                      className="d-flex align-items-center gap-2 p-2"
                      style={{
                        cursor: 'pointer',
                        borderRadius: '6px',
                        background: selectedMembers.includes(u._id) ? 'rgba(79,70,229,0.12)' : 'transparent',
                        border: selectedMembers.includes(u._id) ? '1px solid #818cf8' : '1px solid transparent',
                        marginBottom: '0.25rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span style={{
                        width: '20px', height: '20px', borderRadius: '4px',
                        border: selectedMembers.includes(u._id) ? '2px solid #818cf8' : '2px solid var(--text-muted)',
                        background: selectedMembers.includes(u._id) ? '#818cf8' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', color: 'white',
                      }}>
                        {selectedMembers.includes(u._id) ? '✓' : ''}
                      </span>
                      <span style={{ fontWeight: 500 }}>👤 {u.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</span>
                    </div>
                  ))
                )}
              </div>
              {selectedMembers.length > 0 && (
                <div className="mt-2">
                  <small style={{ color: '#818cf8', fontWeight: 600 }}>{selectedMembers.length} member(s) selected</small>
                </div>
              )}
            </Form.Group>
            <div className="d-flex gap-2">
              <Button type="submit" className="btn-gradient flex-grow-1" disabled={teamCreating}>
                {teamCreating ? (<><span className="spinner-border spinner-border-sm me-2" />Creating...</>) : 'Create Team'}
              </Button>
              <Button variant="secondary" onClick={() => setShowTeamModal(false)} className="flex-grow-1">Cancel</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;
