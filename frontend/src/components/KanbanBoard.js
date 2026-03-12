import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { taskAPI } from '../services/api';

// Deadline helper
const getDeadlineInfo = (deadline) => {
  if (!deadline) return null;
  const now = new Date();
  const dl = new Date(deadline);
  const diff = Math.ceil((dl - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: '#f87171', bg: 'rgba(239,68,68,0.12)' };
  if (diff === 0) return { label: 'Due today', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' };
  if (diff <= 2) return { label: `${diff}d left`, color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' };
  return { label: `${diff}d left`, color: '#34d399', bg: 'rgba(16,185,129,0.12)' };
};

const KanbanBoard = ({ projectId, isAdmin }) => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getByProject(projectId);
      setTasks(response.data.tasks || []);
      setError(null);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskAPI.delete(taskId);
        await fetchTasks();
      } catch (err) {
        setError('Failed to delete task');
      }
    }
  };

  const handleStartTask = async (taskId, e) => {
    e.stopPropagation();
    try {
      await taskAPI.startTask(taskId);
      await fetchTasks();
      navigate(`/task/${taskId}/attempt`);
    } catch (err) {
      // If task was already started, just navigate
      navigate(`/task/${taskId}/attempt`);
    }
  };

  const completedCount = tasks.filter(t => t.submission?.passed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="loading-wrapper" style={{ minHeight: '300px' }}>
        <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
        <span className="loading-text">Loading tasks...</span>
      </div>
    );
  }

  return (
    <Container className="px-0">
      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

      {/* Progress Bar */}
      {tasks.length > 0 && (
        <div className="card mb-4 animate-fadeInUp">
          <div className="card-body p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>📈 Progress</span>
              <span style={{ fontWeight: 700, color: progressPercent === 100 ? '#34d399' : '#818cf8' }}>
                {completedCount}/{tasks.length} ({progressPercent}%)
              </span>
            </div>
            <div style={{
              height: '8px',
              background: 'rgba(148,163,184,0.15)',
              borderRadius: '50px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: progressPercent === 100
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, #4f46e5, #818cf8)',
                borderRadius: '50px',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Sequential Task List */}
      {tasks.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-text">No tasks created yet</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {tasks.map((task, index) => {
            const isCompleted = task.submission?.passed;
            const isLocked = task.isLocked;
            const isInProgress = task.status === 'inprogress' && !isCompleted;
            const isActive = !isLocked && !isCompleted;
            const deadlineInfo = getDeadlineInfo(task.deadline);

            return (
              <div
                key={task._id}
                className="animate-fadeInUp"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div
                  className="card"
                  style={{
                    borderLeft: `4px solid ${isCompleted ? '#10b981' : isLocked ? '#475569' : '#818cf8'
                      }`,
                    opacity: isLocked ? 0.6 : 1,
                    transition: 'all 0.3s',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                  }}
                  onClick={() => {
                    if (!isLocked) {
                      navigate(`/task/${task._id}/attempt`);
                    }
                  }}
                >
                  <div className="card-body p-4">
                    <Row className="align-items-center">
                      {/* Status Icon */}
                      <Col xs="auto">
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.5rem',
                          background: isCompleted
                            ? 'rgba(16,185,129,0.15)'
                            : isLocked
                              ? 'rgba(71,85,105,0.15)'
                              : 'rgba(79,70,229,0.15)',
                        }}>
                          {isCompleted ? '✅' : isLocked ? '🔒' : isInProgress ? '🔄' : '🔓'}
                        </div>
                      </Col>

                      {/* Task Info */}
                      <Col>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            TASK {task.order}
                          </span>
                          <Badge bg={
                            task.taskType === 'mcq' ? 'info'
                              : task.taskType === 'coding' ? 'warning'
                                : 'secondary'
                          } style={{ fontSize: '0.7rem' }}>
                            {task.taskType === 'mcq' ? '📝 MCQ' : task.taskType === 'coding' ? '💻 Code' : '📋 General'}
                          </Badge>
                          <Badge bg={
                            task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'
                          } style={{ fontSize: '0.7rem' }}>
                            {task.priority}
                          </Badge>
                        </div>
                        <h5 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                          {task.title}
                        </h5>
                        {task.description && (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                            {task.description}
                          </p>
                        )}
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          {task.questions?.length > 0 && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {task.questions.length} question{task.questions.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          {deadlineInfo && (
                            <span style={{
                              fontSize: '0.75rem', fontWeight: 600, color: deadlineInfo.color,
                              background: deadlineInfo.bg, padding: '0.15rem 0.5rem', borderRadius: '50px',
                            }}>
                              ⏰ {deadlineInfo.label}
                            </span>
                          )}
                          {task.assignedTeam && (
                            <span style={{
                              fontSize: '0.75rem', fontWeight: 600, color: '#818cf8',
                              background: 'rgba(79,70,229,0.12)', padding: '0.15rem 0.5rem', borderRadius: '50px',
                            }}>
                              👥 {task.assignedTeam.name || 'Team'}
                            </span>
                          )}
                          {isCompleted && task.submission && (
                            <span style={{
                              fontSize: '0.75rem', fontWeight: 600, color: '#34d399',
                              background: 'rgba(16,185,129,0.12)', padding: '0.15rem 0.5rem', borderRadius: '50px',
                            }}>
                              ✅ Score: {task.submission.score}/{task.submission.totalQuestions}
                            </span>
                          )}
                        </div>
                      </Col>

                      {/* Action */}
                      <Col xs="auto">
                        {isAdmin && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}
                            className="me-2"
                          >
                            Delete
                          </Button>
                        )}
                        {isActive && !isInProgress && (
                          <Button
                            className="btn-gradient"
                            size="sm"
                            onClick={(e) => handleStartTask(task._id, e)}
                          >
                            Start →
                          </Button>
                        )}
                        {isInProgress && (
                          <div className="d-flex align-items-center gap-2">
                            <span style={{
                              fontWeight: 600, fontSize: '0.75rem', color: '#fbbf24',
                              background: 'rgba(245,158,11,0.12)', padding: '0.2rem 0.6rem', borderRadius: '50px',
                            }}>
                              🔄 In Progress
                            </span>
                            <Button
                              className="btn-gradient"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); navigate(`/task/${task._id}/attempt`); }}
                            >
                              Continue →
                            </Button>
                          </div>
                        )}
                        {isCompleted && (
                          <div className="d-flex align-items-center gap-2">
                            <span style={{
                              fontWeight: 700, fontSize: '0.85rem', color: '#34d399',
                              background: 'rgba(16,185,129,0.1)', padding: '0.4rem 0.8rem', borderRadius: '8px',
                            }}>
                              Passed ✓
                            </span>
                            {(task.taskType === 'mcq' || task.taskType === 'coding') && (
                              <Button
                                variant="outline-light"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); navigate(`/task/${task._id}/view`); }}
                                style={{
                                  fontWeight: 600, fontSize: '0.8rem',
                                  borderColor: '#818cf8', color: '#818cf8',
                                  borderRadius: '8px', padding: '0.35rem 0.75rem',
                                }}
                              >
                                👁 View
                              </Button>
                            )}
                          </div>
                        )}
                        {isLocked && (
                          <span style={{
                            fontWeight: 600, fontSize: '0.85rem', color: '#64748b',
                          }}>
                            🔒 Locked
                          </span>
                        )}
                      </Col>
                    </Row>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
};

export default KanbanBoard;
