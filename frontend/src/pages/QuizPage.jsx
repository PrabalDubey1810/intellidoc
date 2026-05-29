import { useState, useRef } from 'react'
import { uploadPdf, getQuiz, setActivePdf as apiSetActivePdf } from '../api'
import { useAuth } from '../AuthContext'
import { Upload, FileText, ClipboardList, CheckCircle, XCircle, Info } from 'lucide-react'

export default function QuizPage() {
    const { activePdf, setActivePdf } = useAuth()
    const pdfContext = activePdf.text
    const fileName = activePdf.fileName

    const [quiz, setQuiz] = useState(null)
    const [selected, setSelected] = useState({})
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const [drag, setDrag] = useState(false)
    const inputRef = useRef()

    const handleFiles = async (files) => {
        if (!files.length) return
        setUploading(true); setError('')
        try {
            const r = await uploadPdf(Array.from(files))
            const text = r.data.pdf_context
            const name = r.data.fileName
            await apiSetActivePdf(text, name)
            setActivePdf({ text, fileName: name })
        } catch { setError('Failed to upload PDF') }
        finally { setUploading(false) }
    }

    const handleGenerate = async () => {
        if (!pdfContext) { setError('Upload a PDF first'); return }
        setLoading(true); setError(''); setQuiz(null); setSelected({}); setSubmitted(false)
        try {
            const r = await getQuiz(pdfContext)
            setQuiz(r.data.quiz)
        } catch (e) { setError(e.response?.data?.error || 'Failed to generate quiz') }
        finally { setLoading(false) }
    }

    const score = quiz ? quiz.filter((q, i) => selected[i] === q.answer).length : 0

    return (
        <div className="feature-panel">
            <h2>📝 PDF Quiz</h2>
            <p className="subtitle">Test your understanding of the document with AI-generated questions.</p>

            {fileName ? (
                <div className="panel-card" style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ background: '#10b981', borderRadius: 8, padding: 8, display: 'flex' }}>
                        <CheckCircle size={20} color="white" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>Document Active</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fileName}</div>
                    </div>
                    <button
                        className="btn btn-secondary"
                        style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: 12 }}
                        onClick={() => inputRef.current.click()}
                    >
                        Change Document
                    </button>
                    <input ref={inputRef} type="file" accept=".pdf" multiple hidden onChange={e => handleFiles(e.target.files)} />
                </div>
            ) : (
                <div
                    id="quiz-upload-zone"
                    className={`upload-zone ${drag ? 'drag-over' : ''}`}
                    onClick={() => inputRef.current.click()}
                    onDragOver={e => { e.preventDefault(); setDrag(true) }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files) }}
                >
                    <input ref={inputRef} type="file" accept=".pdf" multiple hidden onChange={e => handleFiles(e.target.files)} />
                    <div className="upload-zone-icon"><Upload size={32} /></div>
                    {uploading
                        ? <p className="upload-zone-text">Uploading…</p>
                        : <><p className="upload-zone-text">Drop PDF here or click to browse</p><p className="upload-zone-sub">Supports multiple PDFs</p></>
                    }
                </div>
            )}

            {error && <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>}

            <button
                id="generate-quiz-btn"
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={handleGenerate}
                disabled={loading || !pdfContext}
            >
                {loading
                    ? <><span className="spinner" style={{ borderTopColor: 'white', width: 15, height: 15 }} /> Generating Quiz…</>
                    : <><ClipboardList size={15} /> Generate Quiz</>
                }
            </button>

            {quiz && (
                <div style={{ marginTop: 28 }}>
                    {quiz.map((q, qi) => (
                        <div key={qi} className="quiz-question panel-card">
                            <p className="quiz-q-text">Q{qi + 1}: {q.question}</p>
                            <div className="quiz-options">
                                {q.options.map((opt, oi) => {
                                    let cls = 'quiz-option'
                                    if (selected[qi] === opt) cls += ' selected'
                                    if (submitted) {
                                        if (opt === q.answer) cls = 'quiz-option correct'
                                        else if (selected[qi] === opt) cls = 'quiz-option wrong'
                                    }
                                    return (
                                        <div
                                            key={oi}
                                            id={`q${qi}-opt${oi}`}
                                            className={cls}
                                            onClick={() => !submitted && setSelected(s => ({ ...s, [qi]: opt }))}
                                        >
                                            {submitted && opt === q.answer && <CheckCircle size={15} color="#22c55e" />}
                                            {submitted && selected[qi] === opt && opt !== q.answer && <XCircle size={15} color="#ef4444" />}
                                            {opt}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}

                    {!submitted ? (
                        <button
                            id="submit-quiz-btn"
                            className="btn btn-accent"
                            onClick={() => setSubmitted(true)}
                            disabled={Object.keys(selected).length < quiz.length}
                        >
                            Submit Quiz
                        </button>
                    ) : (
                        <div className="panel-card" style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 22, fontWeight: 700 }}>
                                {score === quiz.length ? '🎉' : score >= quiz.length / 2 ? '👍' : '📚'} {score}/{quiz.length}
                            </p>
                            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                                {score === quiz.length ? 'Perfect score!' : score >= quiz.length / 2 ? 'Good job!' : 'Keep studying!'}
                            </p>
                            <button className="btn btn-secondary" style={{ marginTop: 14 }} onClick={() => { setSubmitted(false); setSelected({}); setQuiz(null) }}>
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
