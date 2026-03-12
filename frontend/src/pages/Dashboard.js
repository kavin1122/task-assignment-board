import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { projectAPI, taskAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ projects: 0, tasks: 0, completed: 0, inprogress: 0, todo: 0 });
  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    let tasks = [...allTasks];
    if (statusFilter !== 'all') tasks = tasks.filter(t => t.status === statusFilter);
    if (priorityFilter !== 'all') tasks = tasks.filter(t => t.priority === priorityFilter);
    if (searchQuery) tasks = tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredTasks(tasks);
  }, [allTasks, statusFilter, priorityFilter, searchQuery]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projectsRes, tasksRes] = await Promise.all([
        projectAPI.getAll(),
        taskAPI.getAll(),
      ]);

      const projects = projectsRes.data.projects || [];
      const tasks = tasksRes.data.tasks || [];

      setStats({
        projects: projects.length,
        tasks: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inprogress: tasks.filter(t => t.status === 'inprogress').length,
        todo: tasks.filter(t => t.status === 'todo').length,
      });

      setAllTasks(tasks);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: ['To Do', 'In Progress', 'Completed'],
    datasets: [{
      data: [stats.todo, stats.inprogress, stats.completed],
      backgroundColor: ['rgba(100, 116, 139, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(16, 185, 129, 0.7)'],
      borderColor: ['#64748b', '#f59e0b', '#10b981'],
      borderWidth: 2,
    }],
  };

  const chartOptions = {
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16, font: { size: 12 } } },
    },
    cutout: '65%',
    responsive: true,
    maintainAspectRatio: false,
  };

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
        <span className="loading-text">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <Container className="py-5">
      <div className="page-header">
        <h1>Welcome back, {user?.name}! 👋</h1>
        <p className="subtitle">Here's an overview of your workspace</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Stats Row */}
      <Row className="mb-5 stagger-children">
        <Col md={3} className="mb-3">
          <div className="stat-card primary animate-fadeInUp">
            <div className="d-flex align-items-center gap-3">
              <div className="stat-icon gradient-primary" style={{ color: 'white' }}>📂</div>
              <div><div className="stat-value" style={{ color: '#818cf8' }}>{stats.projects}</div><div className="stat-label">Projects</div></div>
            </div>
          </div>
        </Col>
        <Col md={3} className="mb-3">
          <div className="stat-card info animate-fadeInUp">
            <div className="d-flex align-items-center gap-3">
              <div className="stat-icon gradient-info" style={{ color: 'white' }}>📋</div>
              <div><div className="stat-value" style={{ color: '#22d3ee' }}>{stats.tasks}</div><div className="stat-label">Total Tasks</div></div>
            </div>
          </div>
        </Col>
        <Col md={3} className="mb-3">
          <div className="stat-card warning animate-fadeInUp">
            <div className="d-flex align-items-center gap-3">
              <div className="stat-icon gradient-warning" style={{ color: 'white' }}>⏳</div>
              <div><div className="stat-value" style={{ color: '#fbbf24' }}>{stats.inprogress}</div><div className="stat-label">In Progress</div></div>
            </div>
          </div>
        </Col>
        <Col md={3} className="mb-3">
          <div className="stat-card success animate-fadeInUp">
            <div className="d-flex align-items-center gap-3">
              <div className="stat-icon gradient-success" style={{ color: 'white' }}>✅</div>
              <div><div className="stat-value" style={{ color: '#34d399' }}>{stats.completed}</div><div className="stat-label">Completed</div></div>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="mb-5">
        {/* Chart */}
        <Col md={4} className="mb-4">
          <div className="card animate-fadeInUp p-3" style={{ animationDelay: '0.2s' }}>
            <h5 style={{ fontWeight: 700, marginBottom: '1rem' }}>📊 Task Distribution</h5>
            <div style={{ height: '220px' }}>
              {stats.tasks > 0 ? <Doughnut data={chartData} options={chartOptions} /> : (
                <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-text">No task data</div></div>
              )}
            </div>
          </div>
        </Col>

        {/* Tasks Table */}
        <Col md={8}>
          <div className="animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h4 style={{ fontWeight: 700 }}>📝 Tasks</h4>
              <span className="badge bg-primary">{filteredTasks.length}</span>
            </div>

            {/* Search & Filters */}
            <div className="card mb-3">
              <div className="card-body py-2 px-3">
                <Row className="align-items-center g-2">
                  <Col md={5}>
                    <Form.Control
                      type="text"
                      placeholder="🔍 Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      size="sm"
                    />
                  </Col>
                  <Col md={3}>
                    <Form.Select size="sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="todo">To Do</option>
                      <option value="inprogress">In Progress</option>
                      <option value="completed">Completed</option>
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Form.Select size="sm" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                      <option value="all">All Priority</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </Form.Select>
                  </Col>
                </Row>
              </div>
            </div>

            <div className="card">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr><th>Title</th><th>Status</th><th>Priority</th><th>Deadline</th></tr>
                    </thead>
                    <tbody>
                      {filteredTasks.length > 0 ? filteredTasks.slice(0, 10).map((task) => (
                        <tr key={task._id}>
                          <td style={{ fontWeight: 500 }}>{task.title}</td>
                          <td>
                            <span className={`badge bg-${task.status === 'todo' ? 'secondary' : task.status === 'inprogress' ? 'warning' : 'success'}`}>
                              {task.status === 'todo' ? '📝 To Do' : task.status === 'inprogress' ? '⏳ Active' : '✅ Done'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge bg-${task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {task.deadline ? new Date(task.deadline).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="4"><div className="empty-state"><div className="empty-state-text">No tasks match filters</div></div></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <div className="animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
        <Link to="/projects" className="btn btn-gradient">View All Projects →</Link>
      </div>
    </Container>
  );
};

export default Dashboard;
