import React, { useState, useEffect } from 'react';
import { Container, Button, Form, Modal, Alert, Row, Col, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, taskAPI, authAPI, teamAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import KanbanBoard from '../components/KanbanBoard';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Task creation form
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    deadline: '',
    assignedTeam: '',
    taskType: 'mcq',
    passingScore: 1,
  });
  const [questions, setQuestions] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projectRes, usersRes, teamsRes] = await Promise.all([
        projectAPI.getById(id),
        authAPI.getUsers(),
        teamAPI.getAll(),
      ]);
      setProject(projectRes.data.project);
      setUsers(usersRes.data.users);
      setTeams(teamsRes.data.teams || []);
      setError(null);
    } catch (err) {
      setError('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskChange = (e) => {
    const { name, value } = e.target;
    setTaskFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Question management
  const addQuestion = () => {
    if (taskFormData.taskType === 'mcq') {
      setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
    } else {
      setQuestions([...questions, { questionText: '', starterCode: '', testCases: [{ input: '', expectedOutput: '' }] }]);
    }
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const updateTestCase = (qIndex, tcIndex, field, value) => {
    const updated = [...questions];
    updated[qIndex].testCases[tcIndex][field] = value;
    setQuestions(updated);
  };

  const addTestCase = (qIndex) => {
    const updated = [...questions];
    updated[qIndex].testCases.push({ input: '', expectedOutput: '' });
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await taskAPI.create({
        ...taskFormData,
        projectId: id,
        questions,
        passingScore: parseInt(taskFormData.passingScore) || 1,
      });
      setSuccess('Task created successfully!');
      setTaskFormData({
        title: '', description: '', priority: 'medium',
        deadline: '', assignedTeam: '', taskType: 'mcq', passingScore: 1,
      });
      setQuestions([]);
      setShowTaskModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to create task');
    }
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();
    if (!selectedTeam) { setError('Please select a team'); return; }
    try {
      await projectAPI.addTeam(id, { teamId: selectedTeam });
      setSuccess('Team added! All team members synced to project.');
      setSelectedTeam('');
      setShowTeamModal(false);
      await fetchProjectData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add team');
    }
  };

  const resetTaskModal = () => {
    setShowTaskModal(true);
    setQuestions([]);
    setTaskFormData(prev => ({ ...prev, taskType: 'mcq' }));
  };

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
        <span className="loading-text">Loading project...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <Container className="py-5">
        <div className="glass-card text-center p-5">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3>Project not found</h3>
          <Button className="btn-gradient" onClick={() => navigate('/projects')}>← Back to Projects</Button>
        </div>
      </Container>
    );
  }

  // Get team names that are already added to the project
  const projectTeamIds = (project.teams || []).map(t => typeof t === 'object' ? t._id : t);

  return (
    <Container className="py-5">
      <div className="mb-4 animate-fadeIn">
        <button className="btn btn-outline-secondary" onClick={() => navigate('/projects')}>← Back to Projects</button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      {/* Hero */}
      <div className="hero-section animate-fadeInUp">
        <Row className="align-items-center">
          <Col md={7}>
            <h1 style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>{project.title}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{project.description || 'No description'}</p>

            {/* Teams */}
            {project.teams && project.teams.length > 0 && (
              <div className="mb-3">
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Teams</span>
                <div className="mt-2 d-flex flex-wrap gap-1">
                  {project.teams.map((t) => (
                    <span key={t._id || t} className="member-badge" style={{ background: 'rgba(79,70,229,0.15)', color: '#818cf8' }}>
                      👥 {t.name || 'Team'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Members */}
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Members</span>
              <div className="mt-2 d-flex flex-wrap gap-1">
                {project.members.length > 0 ? (
                  project.members.map((m) => <span key={m._id} className="member-badge">👤 {m.name}</span>)
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No members</span>
                )}
              </div>
            </div>
          </Col>
          <Col md={5} className="text-md-end mt-3 mt-md-0">
            {isAdmin && (
              <div className="d-flex gap-2 justify-content-md-end">
                <Button className="btn-gradient" onClick={resetTaskModal}>+ Add Task / Quiz</Button>
                <Button variant="secondary" onClick={() => setShowTeamModal(true)}>+ Add Team</Button>
              </div>
            )}
          </Col>
        </Row>
      </div>

      {/* Task Board */}
      <div className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
        <div className="d-flex align-items-center gap-2 mb-4">
          <h3 style={{ fontWeight: 700 }}>📋 Tasks & Quizzes</h3>
        </div>
        <KanbanBoard projectId={id} isAdmin={isAdmin} />
      </div>

      {/* Create Task Modal */}
      <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create Task / Quiz</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Form onSubmit={handleCreateTask}>
            {/* Basic Info */}
            <Form.Group className="mb-3">
              <Form.Label>Task Title</Form.Label>
              <Form.Control type="text" name="title" value={taskFormData.title} onChange={handleTaskChange} placeholder="e.g. JavaScript Basics Quiz" required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" name="description" value={taskFormData.description} onChange={handleTaskChange} placeholder="Describe the task..." rows={2} />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Task Type</Form.Label>
                  <Form.Select name="taskType" value={taskFormData.taskType} onChange={(e) => { handleTaskChange(e); setQuestions([]); }}>
                    <option value="mcq">📝 MCQ Quiz</option>
                    <option value="coding">💻 Coding Challenge</option>
                    <option value="general">📋 General Task</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select name="priority" value={taskFormData.priority} onChange={handleTaskChange}>
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Pass Score</Form.Label>
                  <Form.Control type="number" name="passingScore" value={taskFormData.passingScore} onChange={handleTaskChange} min="1" />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Deadline</Form.Label>
                  <Form.Control type="date" name="deadline" value={taskFormData.deadline} onChange={handleTaskChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Assign To Team</Form.Label>
                  <Form.Select name="assignedTeam" value={taskFormData.assignedTeam} onChange={handleTaskChange}>
                    <option value="">Select team</option>
                    {teams.map((t) => <option key={t._id} value={t._id}>👥 {t.name}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Questions Builder */}
            {taskFormData.taskType !== 'general' && (
              <>
                <hr style={{ borderColor: 'var(--border-color)' }} />
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 style={{ fontWeight: 700, marginBottom: 0 }}>
                    {taskFormData.taskType === 'mcq' ? '📝 Questions' : '💻 Coding Challenges'}
                  </h5>
                  <Button variant="primary" size="sm" onClick={addQuestion}>
                    + Add Question
                  </Button>
                </div>

                {questions.map((q, qIndex) => (
                  <div key={qIndex} className="card mb-3" style={{ borderLeft: '3px solid #818cf8' }}>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Badge bg="primary">Q{qIndex + 1}</Badge>
                        <Button variant="danger" size="sm" onClick={() => removeQuestion(qIndex)}>Remove</Button>
                      </div>

                      <Form.Group className="mb-3">
                        <Form.Label>Question Text</Form.Label>
                        <Form.Control
                          as="textarea"
                          value={q.questionText}
                          onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                          placeholder="Enter question..."
                          rows={2}
                          required
                        />
                      </Form.Group>

                      {/* MCQ Options */}
                      {taskFormData.taskType === 'mcq' && (
                        <>
                          <Form.Label>Options</Form.Label>
                          <Row className="mb-2">
                            {q.options.map((opt, optIdx) => (
                              <Col md={6} key={optIdx} className="mb-2">
                                <div className="d-flex align-items-center gap-2">
                                  <span style={{ fontWeight: 700, color: '#818cf8', minWidth: '20px' }}>
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  <Form.Control
                                    type="text"
                                    value={opt}
                                    onChange={(e) => updateOption(qIndex, optIdx, e.target.value)}
                                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                    size="sm"
                                    required
                                  />
                                </div>
                              </Col>
                            ))}
                          </Row>
                          <Form.Group>
                            <Form.Label>Correct Answer</Form.Label>
                            <Form.Select
                              value={q.correctAnswer}
                              onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                              required
                            >
                              <option value="">Select correct answer</option>
                              {q.options.filter(o => o).map((opt, i) => (
                                <option key={i} value={opt}>{String.fromCharCode(65 + i)}. {opt}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </>
                      )}

                      {/* Coding Fields */}
                      {taskFormData.taskType === 'coding' && (
                        <>
                          <Form.Group className="mb-3">
                            <Form.Label>Starter Code</Form.Label>
                            <Form.Control
                              as="textarea"
                              value={q.starterCode || ''}
                              onChange={(e) => updateQuestion(qIndex, 'starterCode', e.target.value)}
                              placeholder="// Starter code template..."
                              rows={3}
                              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                            />
                          </Form.Group>
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <Form.Label className="mb-0">Test Cases</Form.Label>
                            <Button variant="secondary" size="sm" onClick={() => addTestCase(qIndex)}>+ Test Case</Button>
                          </div>
                          {q.testCases?.map((tc, tcIdx) => (
                            <Row key={tcIdx} className="mb-2">
                              <Col md={5}>
                                <Form.Control
                                  type="text"
                                  value={tc.input}
                                  onChange={(e) => updateTestCase(qIndex, tcIdx, 'input', e.target.value)}
                                  placeholder="Input"
                                  size="sm"
                                />
                              </Col>
                              <Col md={1} className="d-flex align-items-center justify-content-center">→</Col>
                              <Col md={5}>
                                <Form.Control
                                  type="text"
                                  value={tc.expectedOutput}
                                  onChange={(e) => updateTestCase(qIndex, tcIdx, 'expectedOutput', e.target.value)}
                                  placeholder="Expected Output"
                                  size="sm"
                                />
                              </Col>
                            </Row>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            <div className="d-flex gap-2 mt-3">
              <Button type="submit" className="btn-gradient flex-grow-1">Create Task</Button>
              <Button variant="secondary" onClick={() => setShowTaskModal(false)} className="flex-grow-1">Cancel</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Add Team Modal */}
      <Modal show={showTeamModal} onHide={() => setShowTeamModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Add Team to Project</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddTeam}>
            <Form.Group className="mb-3">
              <Form.Label>Select Team</Form.Label>
              <Form.Select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
                <option value="">Choose a team...</option>
                {teams.filter(t => !projectTeamIds.includes(t._id)).map(t => (
                  <option key={t._id} value={t._id}>👥 {t.name} ({t.members?.length || 0} members)</option>
                ))}
              </Form.Select>
            </Form.Group>
            {selectedTeam && (
              <div className="mb-3 p-2" style={{ background: 'rgba(79,70,229,0.05)', borderRadius: '8px' }}>
                <small style={{ fontWeight: 600, color: '#818cf8' }}>Team Members:</small>
                <div className="mt-1 d-flex flex-wrap gap-1">
                  {teams.find(t => t._id === selectedTeam)?.members?.map(m => (
                    <span key={m._id} className="member-badge" style={{ fontSize: '0.75rem' }}>👤 {m.name}</span>
                  )) || <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No members</span>}
                </div>
              </div>
            )}
            <div className="d-flex gap-2">
              <Button type="submit" className="btn-gradient flex-grow-1">Add Team</Button>
              <Button variant="secondary" onClick={() => setShowTeamModal(false)} className="flex-grow-1">Cancel</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ProjectDetail;
