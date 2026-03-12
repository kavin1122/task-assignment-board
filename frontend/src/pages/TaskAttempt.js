import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Badge, ProgressBar, Modal, Tabs, Tab } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { taskAPI, uploadAPI } from '../services/api';

const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

// File icon helper
const getFileIcon = (mimeType) => {
    if (!mimeType) return '📄';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '📦';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html') || mimeType.includes('css')) return '💻';
    return '📄';
};

const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const TaskAttempt = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    // Code execution state
    const [runningCode, setRunningCode] = useState({});
    const [testResults, setTestResults] = useState({});
    const [selectedLanguage, setSelectedLanguage] = useState('javascript');

    const languageOptions = [
        { value: 'javascript', label: '🟨 JavaScript', placeholder: '// Write your JavaScript code here...\n// Use readline() for input and console.log() for output' },
        { value: 'python', label: '🐍 Python', placeholder: '# Write your Python code here...\n# Use input() for reading input and print() for output' },
        { value: 'c', label: '🔵 C', placeholder: '#include <stdio.h>\n\nint main() {\n    // Write your C code here\n    return 0;\n}' },
        { value: 'cpp', label: '🔷 C++', placeholder: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your C++ code here\n    return 0;\n}' },
        { value: 'java', label: '☕ Java', placeholder: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your Java code here\n    }\n}' },
    ];

    // Upload state
    const [uploads, setUploads] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadTab, setUploadTab] = useState('file');
    const [selectedFiles, setSelectedFiles] = useState(null);
    const [linkData, setLinkData] = useState({ link: '', linkTitle: '', description: '' });
    const [fileDescription, setFileDescription] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchTask();
        fetchUploads();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchTask = async () => {
        try {
            setLoading(true);
            const response = await taskAPI.getById(id);
            const t = response.data.task;
            setTask(t);
            if (t.questions) {
                setAnswers(t.questions.map((_, i) => ({ questionIndex: i, answer: '' })));
            }
        } catch (err) {
            setError('Failed to load task');
        } finally {
            setLoading(false);
        }
    };

    const fetchUploads = async () => {
        try {
            const res = await uploadAPI.getByTask(id);
            setUploads(res.data.uploads || []);
        } catch (err) {
            // silently fail
        }
    };

    const handleAnswerChange = (index, value) => {
        setAnswers(prev =>
            prev.map(a => a.questionIndex === index ? { ...a, answer: value } : a)
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            setError(null);
            const response = await taskAPI.submit(id, answers, selectedLanguage);
            setResult(response.data);
        } catch (err) {
            if (err.response?.status === 403) {
                setError('🔒 Previous task must be completed first!');
            } else if (err.response?.status === 400) {
                setResult(err.response.data);
            } else {
                setError(err.response?.data?.message || 'Failed to submit');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Run code against test cases (without submitting)
    const handleRunCode = async (questionIndex) => {
        const code = answers[questionIndex]?.answer;
        if (!code || code.trim().length === 0) {
            setError('Please write some code before running');
            return;
        }
        try {
            setRunningCode(prev => ({ ...prev, [questionIndex]: true }));
            setError(null);
            const response = await taskAPI.runCode(id, questionIndex, code, selectedLanguage);
            setTestResults(prev => ({ ...prev, [questionIndex]: response.data }));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to run code');
        } finally {
            setRunningCode(prev => ({ ...prev, [questionIndex]: false }));
        }
    };

    // File upload handlers
    const handleFileUpload = async () => {
        if (!selectedFiles || selectedFiles.length === 0) return;
        setUploading(true);
        try {
            if (selectedFiles.length === 1) {
                const formData = new FormData();
                formData.append('file', selectedFiles[0]);
                formData.append('description', fileDescription);
                await uploadAPI.uploadFile(id, formData);
            } else {
                const formData = new FormData();
                for (const file of selectedFiles) {
                    formData.append('files', file);
                }
                formData.append('description', fileDescription);
                await uploadAPI.uploadFiles(id, formData);
            }
            setSelectedFiles(null);
            setFileDescription('');
            setShowUploadModal(false);
            await fetchUploads();
        } catch (err) {
            setError('Failed to upload file(s)');
        } finally {
            setUploading(false);
        }
    };

    const handleLinkSubmit = async () => {
        if (!linkData.link) return;
        setUploading(true);
        try {
            await uploadAPI.submitLink(id, linkData);
            setLinkData({ link: '', linkTitle: '', description: '' });
            setShowUploadModal(false);
            await fetchUploads();
        } catch (err) {
            setError('Failed to submit link');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteUpload = async (uploadId) => {
        if (window.confirm('Delete this upload?')) {
            try {
                await uploadAPI.delete(uploadId);
                setUploads(uploads.filter(u => u._id !== uploadId));
            } catch (err) {
                setError('Failed to delete');
            }
        }
    };

    const handleGeneralSubmit = async () => {
        try {
            setSubmitting(true);
            setError(null);
            const response = await taskAPI.submitGeneral(id);
            setResult(response.data);
        } catch (err) {
            if (err.response?.status === 403) {
                setError('🔒 Previous task must be completed first!');
            } else if (err.response?.status === 400) {
                setResult(err.response.data);
            } else {
                setError(err.response?.data?.message || 'Failed to submit');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-wrapper">
                <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
                <span className="loading-text">Loading task...</span>
            </div>
        );
    }

    if (!task) {
        return (
            <Container className="py-5">
                <div className="glass-card text-center p-5">
                    <div style={{ fontSize: '3rem' }}>🔍</div>
                    <h3>Task not found</h3>
                    <Button className="btn-gradient mt-3" onClick={() => navigate(-1)}>← Go Back</Button>
                </div>
            </Container>
        );
    }

    return (
        <Container className="py-5" style={{ maxWidth: '900px' }}>
            <button className="btn btn-outline-secondary mb-4" onClick={() => navigate(-1)}>← Back</button>

            {/* Task Header */}
            <div className="animate-fadeInUp mb-4">
                <Card>
                    <Card.Body className="p-4">
                        <div className="d-flex align-items-center gap-3 mb-2">
                            <Badge bg={task.taskType === 'mcq' ? 'info' : task.taskType === 'coding' ? 'warning' : 'secondary'} style={{ fontSize: '0.8rem' }}>
                                {task.taskType === 'mcq' ? '📝 MCQ Quiz' : task.taskType === 'coding' ? '💻 Coding Challenge' : '📋 General'}
                            </Badge>
                            <Badge bg={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}>
                                {task.priority}
                            </Badge>
                            {task.deadline && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    📅 Due: {new Date(task.deadline).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        <h2 style={{ fontWeight: 800 }}>Task {task.order}: {task.title}</h2>
                        {task.description && (
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>{task.description}</p>
                        )}
                        {task.questions && task.questions.length > 0 && (
                            <div className="mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {task.questions.length} question{task.questions.length !== 1 ? 's' : ''} — Pass score: {task.passingScore || 1}
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </div>

            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

            {/* Result Card */}
            {result && (
                <div className="animate-fadeInUp mb-4">
                    <Card style={{ borderLeft: `4px solid ${result.passed ? '#10b981' : '#f87171'}` }}>
                        <Card.Body className="p-4 text-center">
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                                {result.passed ? '🎉' : '😔'}
                            </div>
                            <h3 style={{ fontWeight: 700, color: result.passed ? '#34d399' : '#f87171' }}>
                                {result.passed ? 'Task Completed!' : 'Not Passed'}
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{result.message}</p>
                            {result.score !== undefined && result.totalQuestions !== undefined && result.totalQuestions > 0 && task.taskType !== 'general' && (
                                <div className="mb-3">
                                    <h4 style={{ fontWeight: 700 }}>Score: {result.score}/{result.totalQuestions}</h4>
                                    <ProgressBar
                                        now={(result.score / result.totalQuestions) * 100}
                                        variant={result.passed ? 'success' : 'danger'}
                                        style={{ height: '12px', borderRadius: '50px', marginTop: '0.5rem' }}
                                    />
                                </div>
                            )}
                            {/* Coding test results after submission */}
                            {result.codingResults && result.codingResults.length > 0 && (
                                <div className="text-start mb-3">
                                    {result.codingResults.map((cr, crIdx) => (
                                        <div key={crIdx} className="mb-3">
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                                {cr.passed ? '✅' : '❌'} Question {cr.questionIndex + 1}: {cr.totalPassed}/{cr.totalTests} tests passed
                                            </div>
                                            {cr.results && cr.results.map((tr, trIdx) => (
                                                <div key={trIdx} className="mb-1 p-2" style={{
                                                    background: tr.passed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                                                    borderLeft: `3px solid ${tr.passed ? '#10b981' : '#f87171'}`,
                                                    borderRadius: '6px', fontSize: '0.8rem',
                                                }}>
                                                    <span style={{ fontWeight: 600 }}>{tr.passed ? '✅' : '❌'} Test {trIdx + 1}</span>
                                                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                                        <div><span style={{ color: '#22d3ee' }}>Input:</span> {tr.input}</div>
                                                        <div><span style={{ color: '#a78bfa' }}>Expected:</span> {tr.expectedOutput}</div>
                                                        <div><span style={{ color: tr.passed ? '#34d399' : '#f87171' }}>Actual:</span> {tr.actualOutput || '(no output)'}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="d-flex gap-2 justify-content-center">
                                {result.passed ? (
                                    <Button className="btn-gradient" onClick={() => navigate(-1)}>← Back to Project</Button>
                                ) : (
                                    <Button className="btn-gradient" onClick={() => { setResult(null); setError(null); }}>🔄 Try Again</Button>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            )}

            {/* Questions */}
            {!result && task.questions && task.questions.length > 0 && (
                <Form onSubmit={handleSubmit}>
                    {task.questions.map((q, index) => (
                        <div key={index} className="animate-fadeInUp mb-4" style={{ animationDelay: `${index * 0.1}s` }}>
                            <Card>
                                <Card.Body className="p-4">
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <span className="badge gradient-primary" style={{ color: 'white', fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}>Q{index + 1}</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            {task.taskType === 'mcq' ? 'Multiple Choice' : 'Coding'}
                                        </span>
                                    </div>
                                    <h5 style={{ fontWeight: 600, lineHeight: 1.6, marginBottom: '1.25rem' }}>{q.questionText}</h5>

                                    {task.taskType === 'mcq' && q.options && (
                                        <div className="d-flex flex-column gap-2">
                                            {q.options.map((option, optIdx) => {
                                                const isSelected = answers[index]?.answer === option;
                                                return (
                                                    <label key={optIdx} className="d-flex align-items-center gap-3 p-3" style={{
                                                        cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                                                        border: `2px solid ${isSelected ? '#818cf8' : 'var(--border-color)'}`,
                                                        background: isSelected ? 'rgba(79,70,229,0.08)' : 'transparent', transition: 'all 0.2s',
                                                    }}>
                                                        <input type="radio" name={`q_${index}`} value={option} checked={isSelected}
                                                            onChange={() => handleAnswerChange(index, option)}
                                                            style={{ accentColor: '#818cf8', width: '18px', height: '18px' }} />
                                                        <span style={{ fontWeight: 500 }}>
                                                            <span style={{ color: '#818cf8', fontWeight: 700, marginRight: '0.5rem' }}>{String.fromCharCode(65 + optIdx)}.</span>{option}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {task.taskType === 'coding' && (
                                        <div>
                                            {q.starterCode && (
                                                <div className="mb-3 p-3" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', color: '#a78bfa' }}>
                                                    {q.starterCode}
                                                </div>
                                            )}
                                            {q.testCases && q.testCases.length > 0 && (
                                                <div className="mb-3">
                                                    <small style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Test Cases:</small>
                                                    {q.testCases.map((tc, tcIdx) => (
                                                        <div key={tcIdx} className="mt-1 p-2" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                                            <span style={{ color: '#22d3ee' }}>Input:</span> {tc.input}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Language Selector */}
                                            <div className="mb-3 d-flex align-items-center gap-2">
                                                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Language:</label>
                                                <Form.Select
                                                    size="sm"
                                                    value={selectedLanguage}
                                                    onChange={(e) => { setSelectedLanguage(e.target.value); setTestResults({}); }}
                                                    style={{ maxWidth: '200px', fontWeight: 600, fontSize: '0.85rem' }}
                                                >
                                                    {languageOptions.map(lang => (
                                                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                                                    ))}
                                                </Form.Select>
                                            </div>
                                            <Form.Control as="textarea" rows={8} value={answers[index]?.answer || ''}
                                                onChange={(e) => handleAnswerChange(index, e.target.value)}
                                                placeholder={languageOptions.find(l => l.value === selectedLanguage)?.placeholder || 'Write your code here...'}
                                                style={{ fontFamily: 'monospace', fontSize: '0.9rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-color)' }} />

                                            {/* Run Code Button */}
                                            <div className="mt-2 d-flex justify-content-end">
                                                <Button
                                                    variant="outline-info"
                                                    size="sm"
                                                    disabled={runningCode[index]}
                                                    onClick={() => handleRunCode(index)}
                                                    style={{ fontWeight: 600 }}
                                                >
                                                    {runningCode[index] ? (<><span className="spinner-border spinner-border-sm me-1" />Running...</>) : '▶ Run Code'}
                                                </Button>
                                            </div>

                                            {/* Test Results */}
                                            {testResults[index] && (
                                                <div className="mt-3">
                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                                            {testResults[index].passed ? '✅' : '❌'} Test Results: {testResults[index].totalPassed}/{testResults[index].totalTests} passed
                                                        </span>
                                                    </div>
                                                    {testResults[index].results.map((tr, trIdx) => (
                                                        <div key={trIdx} className="mb-2 p-3" style={{
                                                            background: tr.passed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                                                            borderLeft: `3px solid ${tr.passed ? '#10b981' : '#f87171'}`,
                                                            borderRadius: '8px',
                                                            fontSize: '0.85rem',
                                                        }}>
                                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                                <span style={{ fontWeight: 700 }}>{tr.passed ? '✅' : '❌'} Test Case {trIdx + 1}</span>
                                                            </div>
                                                            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                                                <div><span style={{ color: '#22d3ee', fontWeight: 600 }}>Input:</span> {tr.input}</div>
                                                                <div><span style={{ color: '#a78bfa', fontWeight: 600 }}>Expected:</span> {tr.expectedOutput}</div>
                                                                <div><span style={{ color: tr.passed ? '#34d399' : '#f87171', fontWeight: 600 }}>Actual:</span> {tr.actualOutput || '(no output)'}</div>
                                                            </div>
                                                            {tr.error && (
                                                                <div className="mt-1" style={{ color: '#f87171', fontSize: '0.8rem' }}>⚠️ {tr.error}</div>
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
                    <div className="text-center mt-4 animate-fadeInUp">
                        <Button type="submit" className="btn-gradient" size="lg" disabled={submitting} style={{ minWidth: '200px' }}>
                            {submitting ? (<><span className="spinner-border spinner-border-sm me-2" role="status" />Submitting...</>) : '🚀 Submit Answers'}
                        </Button>
                    </div>
                </Form>
            )}

            {/* General Task - No questions */}
            {(!task.questions || task.questions.length === 0) && !result && (
                <Card className="mb-4">
                    <Card.Body className="text-center py-5">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                        <h4>General Task</h4>
                        <p style={{ color: 'var(--text-secondary)' }}>Upload your work files or submit links below, then click Submit to mark this task as complete.</p>
                        <Button
                            className="btn-gradient mt-3"
                            size="lg"
                            disabled={submitting}
                            onClick={handleGeneralSubmit}
                            style={{ minWidth: '200px' }}
                        >
                            {submitting ? (<><span className="spinner-border spinner-border-sm me-2" role="status" />Submitting...</>) : '✅ Submit Task'}
                        </Button>
                    </Card.Body>
                </Card>
            )}

            {/* ============ FILE / LINK UPLOAD SECTION ============ */}
            <div className="mt-5 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h4 style={{ fontWeight: 700 }}>📎 Submissions</h4>
                    <Button className="btn-gradient" size="sm" onClick={() => setShowUploadModal(true)}>
                        + Upload File / Link
                    </Button>
                </div>

                {/* Uploads List */}
                {uploads.length === 0 ? (
                    <Card>
                        <Card.Body className="text-center py-4">
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 0 }}>No submissions yet. Upload files or submit links.</p>
                        </Card.Body>
                    </Card>
                ) : (
                    <div className="d-flex flex-column gap-2">
                        {uploads.map((upload) => (
                            <Card key={upload._id} style={{ borderLeft: `3px solid ${upload.uploadType === 'file' ? '#818cf8' : '#22d3ee'}` }}>
                                <Card.Body className="p-3">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-3">
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '8px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.3rem',
                                                background: upload.uploadType === 'file' ? 'rgba(79,70,229,0.12)' : 'rgba(34,211,238,0.12)',
                                            }}>
                                                {upload.uploadType === 'file' ? getFileIcon(upload.mimeType) : '🔗'}
                                            </div>
                                            <div>
                                                {upload.uploadType === 'file' ? (
                                                    <a
                                                        href={`${API_URL}${upload.filePath}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}
                                                    >
                                                        {upload.fileName}
                                                    </a>
                                                ) : (
                                                    <a
                                                        href={upload.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}
                                                    >
                                                        {upload.linkTitle || upload.link}
                                                    </a>
                                                )}
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {upload.userId?.name} • {new Date(upload.createdAt).toLocaleString()}
                                                    {upload.fileSize ? ` • ${formatFileSize(upload.fileSize)}` : ''}
                                                </div>
                                                {upload.description && (
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                        {upload.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-sm"
                                            onClick={() => handleDeleteUpload(upload._id)}
                                            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'none', borderRadius: '6px', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </Card.Body>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>📎 Upload Submission</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Tabs activeKey={uploadTab} onSelect={(k) => setUploadTab(k)} className="mb-3">
                        <Tab eventKey="file" title="📁 File / Folder">
                            <Form.Group className="mb-3">
                                <Form.Label>Select File(s)</Form.Label>
                                <Form.Control
                                    type="file"
                                    multiple
                                    onChange={(e) => setSelectedFiles(e.target.files)}
                                />
                                <Form.Text className="text-muted">
                                    Select multiple files to upload folder contents. Max 50MB per file.
                                </Form.Text>
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
                                <Form.Control
                                    type="text"
                                    value={fileDescription}
                                    onChange={(e) => setFileDescription(e.target.value)}
                                    placeholder="Brief description..."
                                />
                            </Form.Group>
                            <Button className="btn-gradient w-100" onClick={handleFileUpload} disabled={uploading || !selectedFiles}>
                                {uploading ? (<><span className="spinner-border spinner-border-sm me-2" />Uploading...</>) : '📤 Upload File(s)'}
                            </Button>
                        </Tab>

                        <Tab eventKey="link" title="🔗 Link">
                            <Form.Group className="mb-3">
                                <Form.Label>URL</Form.Label>
                                <Form.Control
                                    type="url"
                                    value={linkData.link}
                                    onChange={(e) => setLinkData({ ...linkData, link: e.target.value })}
                                    placeholder="https://github.com/your-repo"
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Link Title <span style={{ color: 'var(--text-muted)' }}>(optional)</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    value={linkData.linkTitle}
                                    onChange={(e) => setLinkData({ ...linkData, linkTitle: e.target.value })}
                                    placeholder="e.g. GitHub Repository"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Description <span style={{ color: 'var(--text-muted)' }}>(optional)</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    value={linkData.description}
                                    onChange={(e) => setLinkData({ ...linkData, description: e.target.value })}
                                    placeholder="Brief description..."
                                />
                            </Form.Group>
                            <Button className="btn-gradient w-100" onClick={handleLinkSubmit} disabled={uploading || !linkData.link}>
                                {uploading ? (<><span className="spinner-border spinner-border-sm me-2" />Submitting...</>) : '🔗 Submit Link'}
                            </Button>
                        </Tab>
                    </Tabs>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default TaskAttempt;
