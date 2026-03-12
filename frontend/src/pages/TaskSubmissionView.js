import React, { useState, useEffect } from 'react';
import { Container, Card, Badge, ProgressBar, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { taskAPI } from '../services/api';

const TaskSubmissionView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSubmission = async () => {
            try {
                setLoading(true);
                const response = await taskAPI.getSubmission(id);
                setData(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load submission');
            } finally {
                setLoading(false);
            }
        };
        fetchSubmission();
    }, [id]);

    if (loading) {
        return (
            <div className="loading-wrapper">
                <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
                <span className="loading-text">Loading submission...</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <Container className="py-5" style={{ maxWidth: '900px' }}>
                <div className="glass-card text-center p-5">
                    <div style={{ fontSize: '3rem' }}>😔</div>
                    <h3>{error || 'Submission not found'}</h3>
                    <Button className="btn-gradient mt-3" onClick={() => navigate(-1)}>← Go Back</Button>
                </div>
            </Container>
        );
    }

    const { task, submission, questions } = data;
    const isMCQ = task.taskType === 'mcq';
    const isCoding = task.taskType === 'coding';
    const scorePercent = submission.totalQuestions > 0 ? (submission.score / submission.totalQuestions) * 100 : 0;

    return (
        <Container className="py-5" style={{ maxWidth: '900px' }}>
            <button className="btn btn-outline-secondary mb-4" onClick={() => navigate(-1)}>← Back</button>

            {/* Header */}
            <div className="animate-fadeInUp mb-4">
                <Card>
                    <Card.Body className="p-4">
                        <div className="d-flex align-items-center gap-3 mb-2">
                            <Badge bg={isMCQ ? 'info' : 'warning'} style={{ fontSize: '0.8rem' }}>
                                {isMCQ ? '📝 MCQ Quiz' : '💻 Coding Challenge'}
                            </Badge>
                            <Badge bg={submission.passed ? 'success' : 'danger'} style={{ fontSize: '0.8rem' }}>
                                {submission.passed ? '✅ Passed' : '❌ Not Passed'}
                            </Badge>
                        </div>
                        <h2 style={{ fontWeight: 800 }}>Task {task.order}: {task.title}</h2>
                        {task.description && (
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>{task.description}</p>
                        )}
                    </Card.Body>
                </Card>
            </div>

            {/* Score Card */}
            <div className="animate-fadeInUp mb-4" style={{ animationDelay: '0.1s' }}>
                <Card style={{ borderLeft: `4px solid ${submission.passed ? '#10b981' : '#f87171'}` }}>
                    <Card.Body className="p-4 text-center">
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>
                            {submission.passed ? '🎉' : '📊'}
                        </div>
                        <h3 style={{ fontWeight: 700 }}>
                            Score: <span style={{ color: submission.passed ? '#34d399' : '#f87171' }}>{submission.score}</span>/{submission.totalQuestions}
                        </h3>
                        <ProgressBar
                            now={scorePercent}
                            variant={submission.passed ? 'success' : 'danger'}
                            style={{ height: '10px', borderRadius: '50px', marginTop: '0.75rem', maxWidth: '400px', margin: '0.75rem auto 0' }}
                        />
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                            Submitted: {new Date(submission.updatedAt).toLocaleString()}
                            {isCoding && submission.language && (
                                <span> • Language: <strong>{submission.language}</strong></span>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            </div>

            {/* Questions */}
            {questions.map((q, index) => (
                <div key={index} className="animate-fadeInUp mb-4" style={{ animationDelay: `${(index + 2) * 0.1}s` }}>
                    <Card style={{
                        borderLeft: isMCQ
                            ? `4px solid ${q.isCorrect ? '#10b981' : '#f87171'}`
                            : '4px solid #818cf8',
                    }}>
                        <Card.Body className="p-4">
                            {/* Question Header */}
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <span className="badge gradient-primary" style={{ color: 'white', fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}>
                                    Q{index + 1}
                                </span>
                                {isMCQ && (
                                    <span style={{
                                        fontWeight: 700, fontSize: '0.85rem',
                                        color: q.isCorrect ? '#10b981' : '#f87171',
                                    }}>
                                        {q.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                                    </span>
                                )}
                            </div>
                            <h5 style={{ fontWeight: 600, lineHeight: 1.6, marginBottom: '1.25rem' }}>{q.questionText}</h5>

                            {/* MCQ Options */}
                            {isMCQ && q.options && (
                                <div className="d-flex flex-column gap-2">
                                    {q.options.map((option, optIdx) => {
                                        const isUserAnswer = q.userAnswer === option;
                                        const isCorrect = q.correctAnswer === option;
                                        let borderColor = 'var(--border-color)';
                                        let bgColor = 'transparent';
                                        let icon = '';

                                        if (isCorrect && isUserAnswer) {
                                            borderColor = '#10b981';
                                            bgColor = 'rgba(16,185,129,0.1)';
                                            icon = '✅';
                                        } else if (isCorrect) {
                                            borderColor = '#10b981';
                                            bgColor = 'rgba(16,185,129,0.06)';
                                            icon = '✅';
                                        } else if (isUserAnswer && !isCorrect) {
                                            borderColor = '#f87171';
                                            bgColor = 'rgba(239,68,68,0.08)';
                                            icon = '❌';
                                        }

                                        return (
                                            <div key={optIdx} className="d-flex align-items-center gap-3 p-3" style={{
                                                borderRadius: 'var(--radius-sm)',
                                                border: `2px solid ${borderColor}`,
                                                background: bgColor,
                                                transition: 'all 0.2s',
                                            }}>
                                                <span style={{ fontWeight: 500 }}>
                                                    <span style={{
                                                        color: isCorrect ? '#10b981' : isUserAnswer ? '#f87171' : '#818cf8',
                                                        fontWeight: 700, marginRight: '0.5rem',
                                                    }}>
                                                        {String.fromCharCode(65 + optIdx)}.
                                                    </span>
                                                    {option}
                                                </span>
                                                {icon && (
                                                    <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>{icon}</span>
                                                )}
                                                {isUserAnswer && (
                                                    <span style={{
                                                        fontSize: '0.7rem', fontWeight: 600,
                                                        color: isCorrect ? '#10b981' : '#f87171',
                                                        background: isCorrect ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                                                        padding: '0.15rem 0.5rem', borderRadius: '50px',
                                                        marginLeft: icon ? '0' : 'auto',
                                                    }}>
                                                        Your Answer
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Coding - Show submitted code */}
                            {isCoding && (
                                <div>
                                    <div style={{
                                        fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)',
                                        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem',
                                    }}>
                                        Submitted Code {submission.language && `(${submission.language})`}
                                    </div>
                                    <div style={{
                                        background: 'rgba(0,0,0,0.3)',
                                        borderRadius: '10px',
                                        padding: '1rem 1.25rem',
                                        fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                                        fontSize: '0.88rem',
                                        lineHeight: 1.7,
                                        whiteSpace: 'pre-wrap',
                                        color: '#e2e8f0',
                                        border: '1px solid rgba(129,140,248,0.2)',
                                        overflowX: 'auto',
                                    }}>
                                        {q.userAnswer || '(No code submitted)'}
                                    </div>

                                    {/* Test Cases */}
                                    {q.testCases && q.testCases.length > 0 && (
                                        <div className="mt-3">
                                            <div style={{
                                                fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)',
                                                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem',
                                            }}>
                                                Test Cases
                                            </div>
                                            {q.testCases.map((tc, tcIdx) => (
                                                <div key={tcIdx} className="mb-1 p-2" style={{
                                                    background: 'rgba(0,0,0,0.15)',
                                                    borderRadius: '6px',
                                                    fontSize: '0.85rem',
                                                    fontFamily: 'monospace',
                                                }}>
                                                    <span style={{ color: '#22d3ee' }}>Input:</span> {tc.input}
                                                    {tc.expectedOutput && (
                                                        <span> → <span style={{ color: '#a78bfa' }}>Expected:</span> {tc.expectedOutput}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            ))}

            {/* Back Button */}
            <div className="text-center mt-4 animate-fadeInUp">
                <Button className="btn-gradient" size="lg" onClick={() => navigate(-1)} style={{ minWidth: '200px' }}>
                    ← Back to Project
                </Button>
            </div>
        </Container>
    );
};

export default TaskSubmissionView;
