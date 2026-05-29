import { useState, useRef, useEffect } from 'react'
import { sendChat, uploadPdf, setActivePdf as apiSetActivePdf } from '../api'
import { useAuth } from '../AuthContext'
import { ArrowUp, Paperclip, ChevronDown, X, CheckCircle, Trash2 } from 'lucide-react'

const EXAMPLES = [
    { text: 'Summarize the uploaded PDF in 3 key points', icon: '📄' },
    { text: 'What are the main conclusions of this document?', icon: '🔍' },
    { text: 'Explain the technical concepts in simple terms', icon: '💡' },
    { text: 'Create a timeline of events from this text', icon: '📅' },
]

function TypingDots() {
    return (
        <div className="typing-dots">
            <span /><span /><span />
        </div>
    )
}

function MessageBubble({ msg }) {
    const isUser = msg.role === 'user'
    return (
        <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
            <div className={`msg-avatar ${isUser ? 'user-av' : 'ai'}`}>{isUser ? 'U' : 'AI'}</div>
            <div className="msg-bubble">
                {msg.content === '__typing__'
                    ? <TypingDots />
                    : msg.content.replace(/\*\*/g, '').split('\n').map((line, i, arr) => (
                        <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                    ))
                }
            </div>
        </div>
    )
}

// ── Attach button ─────────────────────────────────────────────────────────────
function AttachBtn({ onUpload, uploading, fileName, onClear, id }) {
    const ref = useRef()
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input ref={ref} type="file" accept=".pdf" multiple hidden onChange={e => onUpload(e.target.files)} />
            <button
                id={id}
                className="toolbar-btn"
                onClick={() => ref.current.click()}
                disabled={uploading}
                title="Attach PDF"
            >
                {uploading
                    ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                    : <Paperclip size={13} />
                }
                {uploading ? 'Uploading…' : 'Attach'}
            </button>

            {fileName && !uploading && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'rgba(139,92,246,.1)', border: '1px solid rgba(139,92,246,.3)',
                    borderRadius: 'var(--radius-full)', padding: '3px 10px',
                    fontSize: 12, fontWeight: 500, color: 'var(--accent-dark)',
                    maxWidth: 180, overflow: 'hidden',
                }}>
                    <CheckCircle size={12} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fileName}
                    </span>
                    <button
                        onClick={onClear}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: 'var(--accent-dark)', flexShrink: 0 }}
                        title="Remove PDF"
                    >
                        <X size={11} />
                    </button>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ChatPage({ username, model = 'online' }) {
    const { history, setHistory, clearHistory, activePdf, setActivePdf, clearActiveDoc } = useAuth()
    const pdfContext = activePdf.text
    const fileName = activePdf.fileName

    // Seed messages from persisted history, or show welcome message
    const [messages, setMessages] = useState(() => {
        if (history && history.length > 0) return history
        return [{ role: 'assistant', content: `Hi ${username}! 👋 I'm IntelliDoc AI. Upload a PDF or ask me anything.` }]
    })

    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState('')
    const [clearing, setClearing] = useState(false)

    const bottomRef = useRef(null)
    const textareaRef = useRef(null)

    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'

    // Sync messages from context when history loads (e.g. after page refresh)
    useEffect(() => {
        if (history && history.length > 0) {
            setMessages(history)
        }
    }, [history])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const autoResize = () => {
        const ta = textareaRef.current
        if (!ta) return
        ta.style.height = 'auto'
        ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
    }

    // ── PDF upload ─────────────────────────────────────────────────────────────
    const handleUpload = async (files) => {
        if (!files || !files.length) return
        setUploading(true); setUploadError('')
        try {
            const r = await uploadPdf(Array.from(files))
            const text = r.data.pdf_context
            const name = r.data.fileName
            await apiSetActivePdf(text, name)
            setActivePdf({ text, fileName: name })
            const confirmMsg = { role: 'assistant', content: `✅ PDF attached: ${name}\nYou can now ask me questions about it!` }
            setMessages(prev => [...prev, confirmMsg])
        } catch {
            setUploadError('Failed to upload PDF. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    const handleClearPdf = () => { clearActiveDoc() }

    // ── Clear chat history ─────────────────────────────────────────────────────
    const handleClearHistory = async () => {
        if (!window.confirm('Clear all chat history? This cannot be undone.')) return
        setClearing(true)
        try {
            await clearHistory()
            const welcome = { role: 'assistant', content: `Hi ${username}! 👋 Chat history cleared. Start a new conversation!` }
            setMessages([welcome])
        } catch {
            // silent fail
        } finally {
            setClearing(false)
        }
    }

    // ── Send message ───────────────────────────────────────────────────────────
    const handleSend = async (text) => {
        const content = (text || input).trim()
        if (!content || loading) return
        setInput('')
        if (textareaRef.current) textareaRef.current.style.height = 'auto'

        const userMsg = { role: 'user', content }
        const newMessages = [...messages, userMsg]
        setMessages([...newMessages, { role: 'assistant', content: '__typing__' }])
        setLoading(true)

        try {
            const r = await sendChat(
                newMessages.map(m => ({ role: m.role, content: m.content })),
                pdfContext,
                model
            )
            const aiMsg = { role: 'assistant', content: r.data.response }
            const finalMessages = [...newMessages, aiMsg]
            setMessages(finalMessages)
            // Keep context in sync
            setHistory(finalMessages)
        } catch {
            setMessages([...newMessages, { role: 'assistant', content: '⚠️ Error connecting to the AI. Please try again.' }])
        } finally {
            setLoading(false)
        }
    }

    const handleKey = e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    }

    const showHome = messages.length <= 1

    // ── Shared toolbar ─────────────────────────────────────────────────────────
    const Toolbar = ({ inputId, sendId }) => (
        <div className="input-toolbar">
            <div className="input-toolbar-left">
                <AttachBtn
                    id={`attach-btn-${inputId}`}
                    onUpload={handleUpload}
                    uploading={uploading}
                    fileName={fileName}
                    onClear={handleClearPdf}
                />
                <button className="toolbar-btn" id={`style-btn-${inputId}`}>
                    Writing Styles <ChevronDown size={12} />
                </button>
            </div>
            <button
                id={sendId}
                className="send-btn"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
            >
                <ArrowUp size={16} />
            </button>
        </div>
    )

    return (
        <div className="content">
            {uploadError && (
                <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)', color: '#dc2626', padding: '8px 16px', fontSize: 13, textAlign: 'center' }}>
                    {uploadError}
                </div>
            )}

            {showHome ? (
                /* ── Home screen ── */
                <div className="home-wrap">
                    <div className="home-orb" />
                    <h1 className="home-greeting">{greeting}, {username}</h1>
                    <p className="home-sub">What's on <span>your mind?</span></p>

                    <div className="input-wrap" style={{ width: '100%' }}>
                        <textarea
                            ref={textareaRef}
                            id="chat-input-home"
                            className="input-textarea"
                            placeholder="Ask AI a question or make a request…"
                            value={input}
                            onChange={e => { setInput(e.target.value); autoResize() }}
                            onKeyDown={handleKey}
                            rows={1}
                        />
                        <Toolbar inputId="home" sendId="send-btn-home" />
                    </div>

                    <p className="examples-label">Get started with an example below</p>
                    <div className="examples-grid">
                        {EXAMPLES.map((ex, i) => (
                            <div key={i} id={`example-card-${i}`} className="example-card" onClick={() => handleSend(ex.text)}>
                                <p className="example-card-text">{ex.text}</p>
                                <span className="example-card-icon" style={{ fontSize: 20 }}>{ex.icon}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* ── Conversation view ── */
                <>
                    {/* Clear history bar */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 24px 0', maxWidth: 760, margin: '0 auto', width: '100%' }}>
                        <button
                            id="clear-history-btn"
                            className="toolbar-btn"
                            onClick={handleClearHistory}
                            disabled={clearing}
                            style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,.3)' }}
                            title="Clear chat history"
                        >
                            <Trash2 size={13} />
                            {clearing ? 'Clearing…' : 'Clear History'}
                        </button>
                    </div>

                    <div className="chat-wrap">
                        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
                        <div ref={bottomRef} />
                    </div>

                    <div className="chat-input-area" style={{ padding: '12px 0 20px', maxWidth: 760, margin: '0 auto', width: '100%' }}>
                        <div className="input-wrap">
                            <textarea
                                ref={textareaRef}
                                id="chat-input-conv"
                                className="input-textarea"
                                placeholder="Ask something…"
                                value={input}
                                onChange={e => { setInput(e.target.value); autoResize() }}
                                onKeyDown={handleKey}
                                rows={1}
                            />
                            <Toolbar inputId="conv" sendId="send-btn-conv" />
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
