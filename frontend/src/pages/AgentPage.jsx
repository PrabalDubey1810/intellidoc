import { useState, useRef, useEffect } from 'react'
import { runAgent } from '../api'
import { Cpu, Send, CheckCircle, Info, AlertCircle, Terminal } from 'lucide-react'

export default function AgentPage() {
    const [task, setTask] = useState('')
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const scrollRef = useRef()

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [logs])

    const handleRun = async () => {
        if (!task.trim()) return
        setLoading(true); setError(''); setLogs([])
        try {
            const r = await runAgent(task)
            setLogs(r.data.logs)
        } catch (e) {
            setError(e.response?.data?.error || 'Failed to execute agent task')
        } finally {
            setLoading(false)
        }
    }

    const renderLogIcon = (type) => {
        switch (type) {
            case 'thought': return <Info size={14} color="#8b5cf6" />
            case 'action': return <Terminal size={14} color="#3b82f6" />
            case 'result': return <CheckCircle size={14} color="#10b981" />
            case 'error': return <AlertCircle size={14} color="#ef4444" />
            case 'final': return <Cpu size={14} color="#f59e0b" />
            default: return null
        }
    }

    return (
        <div className="feature-panel">
            <h2>🤖 Autonomous Agent Mode</h2>
            <p className="subtitle">Delegate complex tasks to an autonomous AI agent that can use tools and research for you.</p>

            <div className="panel-card">
                <div style={{ display: 'flex', gap: 10 }}>
                    <input
                        id="agent-task-input"
                        className="form-input"
                        placeholder="e.g., Compare stock price of Apple and Microsoft..."
                        value={task}
                        onChange={e => setTask(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleRun()}
                        style={{ flex: 1 }}
                        disabled={loading}
                    />
                    <button
                        id="run-agent-btn"
                        className="btn btn-primary"
                        onClick={handleRun}
                        disabled={loading || !task.trim()}
                    >
                        {loading
                            ? <span className="spinner" style={{ borderTopColor: 'white', width: 15, height: 15 }} />
                            : <Send size={15} />
                        }
                        {loading ? 'Thinking…' : 'Run Agent'}
                    </button>
                </div>
            </div>

            {error && <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>}

            {(logs.length > 0 || loading) && (
                <div
                    ref={scrollRef}
                    className="panel-card"
                    style={{
                        marginTop: 16,
                        background: '#0a0a0f',
                        border: '1px solid #1e1e2d',
                        padding: '16px',
                        maxHeight: '450px',
                        overflowY: 'auto',
                        fontFamily: 'monospace'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, borderBottom: '1px solid #1e1e2d', paddingBottom: 8 }}>
                        <Terminal size={16} color="#8b5cf6" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa' }}>Agent Execution Logs</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {logs.map((log, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10 }}>
                                <div style={{ marginTop: 3 }}>{renderLogIcon(log.type)}</div>
                                <div style={{ flex: 1 }}>
                                    <span style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        color: log.type === 'final' ? '#f59e0b' : '#71717a',
                                        display: 'block',
                                        marginBottom: 2
                                    }}>
                                        {log.type}
                                    </span>
                                    <p style={{
                                        fontSize: 13,
                                        lineHeight: 1.5,
                                        color: log.type === 'final' ? '#fff' : '#d1d1d6',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {log.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ display: 'flex', gap: 10, animation: 'pulse 1.5s infinite' }}>
                                <Info size={14} color="#8b5cf6" />
                                <div>
                                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#71717a' }}>Thinking</span>
                                    <p style={{ fontSize: 13, color: '#71717a' }}>Agent is processing the next step...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="panel-card" style={{ marginTop: 16, background: 'rgba(139, 92, 246, 0.05)', border: '1px dashed var(--accent)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>Suggested Tasks</h3>
                <ul style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 18, lineHeight: 1.6 }}>
                    <li>"What is the current stock price of NVDA and should I buy?"</li>
                    <li>"Search for the price of iPhone 15 Pro and compare with MacBook Air."</li>
                    <li>"Find flights from New York to London and estimate total trip cost."</li>
                </ul>
            </div>
        </div>
    )
}
