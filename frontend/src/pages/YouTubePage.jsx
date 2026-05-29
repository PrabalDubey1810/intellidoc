import { useState } from 'react'
import { processYoutube, sendChat } from '../api'
import { Youtube, Send, ArrowUp } from 'lucide-react'

export default function YouTubePage() {
    const [url, setUrl] = useState('')
    const [transcript, setTranscript] = useState('')
    const [summary, setSummary] = useState('')
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [chatLoading, setChatLoading] = useState(false)
    const [error, setError] = useState('')
    const [language, setLanguage] = useState('English')

    const languages = [
        { code: 'English', label: 'English' },
        { code: 'Hindi', label: 'Hindi' },
        { code: 'Spanish', label: 'Spanish' },
        { code: 'French', label: 'French' },
        { code: 'German', label: 'German' },
        { code: 'Chinese', label: 'Chinese' },
        { code: 'Japanese', label: 'Japanese' },
        { code: 'Russian', label: 'Russian' }
    ]

    const handleProcess = async () => {
        if (!url.trim()) return
        setLoading(true); setError(''); setSummary(''); setTranscript(''); setMessages([])
        try {
            const r = await processYoutube(url, language)
            setTranscript(r.data.transcript)
            setSummary(r.data.summary)
        } catch (e) { setError(e.response?.data?.error || 'Failed to process video') }
        finally { setLoading(false) }
    }

    const handleChat = async () => {
        if (!input.trim() || !transcript) return
        const userMsg = { role: 'user', content: input }
        const newMsgs = [...messages, userMsg]
        setMessages([...newMsgs, { role: 'assistant', content: '__typing__' }])
        setInput(''); setChatLoading(true)
        try {
            const r = await sendChat(
                [{ role: 'system', content: `Answer questions based on this video transcript:\n\n${transcript.slice(0, 15000)}` }, ...newMsgs],
                ''
            )
            setMessages([...newMsgs, { role: 'assistant', content: r.data.response }])
        } catch { setMessages([...newMsgs, { role: 'assistant', content: '⚠️ Error. Try again.' }]) }
        finally { setChatLoading(false) }
    }

    return (
        <div className="feature-panel">
            <h2>📺 YouTube Assistant</h2>
            <p className="subtitle">Paste a YouTube URL to get a summary and chat with the video content.</p>

            <div className="panel-card">
                <div style={{ display: 'flex', gap: 10 }}>
                    <input
                        id="youtube-url-input"
                        className="form-input"
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleProcess()}
                        style={{ flex: 1 }}
                    />
                    <select
                        id="youtube-language-select"
                        className="form-input"
                        value={language}
                        onChange={e => setLanguage(e.target.value)}
                        style={{ width: 120, cursor: 'pointer' }}
                    >
                        {languages.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.label}</option>
                        ))}
                    </select>
                    <button
                        id="process-youtube-btn"
                        className="btn btn-primary"
                        onClick={handleProcess}
                        disabled={loading || !url.trim()}
                    >
                        {loading
                            ? <span className="spinner" style={{ borderTopColor: 'white', width: 15, height: 15 }} />
                            : <Youtube size={15} />
                        }
                        {loading ? 'Processing…' : 'Process'}
                    </button>
                </div>
            </div>

            {error && <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>}

            {summary && (
                <div className="panel-card" style={{ marginTop: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>📋 Video Summary</h3>
                    <div style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{summary}</div>
                </div>
            )}

            {transcript && (
                <div style={{ marginTop: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>💬 Chat with Video</h3>

                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', minHeight: 160, maxHeight: 320, overflowY: 'auto', padding: 16, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {messages.length === 0
                            ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Ask anything about the video…</p>
                            : messages.map((m, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.role === 'user' ? 'var(--accent)' : 'var(--text-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                        {m.role === 'user' ? 'U' : 'AI'}
                                    </div>
                                    <div style={{ maxWidth: '80%', fontSize: 13.5, lineHeight: 1.6, background: m.role === 'user' ? 'var(--bg-hover)' : 'transparent', padding: m.role === 'user' ? '8px 12px' : '4px 0', borderRadius: 10 }}>
                                        {m.content === '__typing__'
                                            ? <div className="typing-dots"><span /><span /><span /></div>
                                            : m.content
                                        }
                                    </div>
                                </div>
                            ))
                        }
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            id="yt-chat-input"
                            className="form-input"
                            placeholder="Ask about the video…"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleChat()}
                            style={{ flex: 1 }}
                        />
                        <button
                            id="yt-chat-send"
                            className="send-btn"
                            style={{ width: 40, height: 40, borderRadius: 10 }}
                            onClick={handleChat}
                            disabled={chatLoading || !input.trim()}
                        >
                            <ArrowUp size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
