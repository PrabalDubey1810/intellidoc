import { useState, useRef } from 'react'
import { uploadPdf, setActivePdf as apiSetActivePdf } from '../api'
import { useAuth } from '../AuthContext'
import { Upload, FileText, Mic, Loader, CheckCircle } from 'lucide-react'

// Podcast page — script generation + audio (calls backend)
export default function PodcastPage() {
    const { activePdf, setActivePdf } = useAuth()
    const pdfContext = activePdf.text
    const fileName = activePdf.fileName

    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const [drag, setDrag] = useState(false)
    const [script, setScript] = useState(null)
    const [audioB64, setAudioB64] = useState('')
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
        setLoading(true); setError(''); setScript(null); setAudioB64('')
        try {
            const res = await fetch('/api/podcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ pdf_context: pdfContext }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')
            setScript(data.script)
            if (data.audio_b64) setAudioB64(data.audio_b64)
        } catch (e) { setError(e.message) }
        finally { setLoading(false) }
    }

    return (
        <div className="feature-panel">
            <h2>🎙️ AI Podcast Studio</h2>
            <p className="subtitle">Transform your PDF into a two-host podcast conversation.</p>

            {/* Hosts animation */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', marginBottom: 20, border: '1px solid var(--border)' }}>
                {['Host 1 (US)', 'Host 2 (UK)'].map((label, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: '50%',
                            background: i === 0 ? 'linear-gradient(135deg,#a78bfa,#7c3aed)' : 'linear-gradient(135deg,#34d399,#059669)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 28, margin: '0 auto',
                            boxShadow: `0 4px 16px ${i === 0 ? 'rgba(139,92,246,.35)' : 'rgba(16,185,129,.35)'}`,
                            animation: `float ${2 + i * 0.5}s ease-in-out infinite`,
                        }}>
                            {i === 0 ? '🎤' : '🎧'}
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>{label}</p>
                    </div>
                ))}
            </div>

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
                    id="podcast-upload-zone"
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
                id="generate-podcast-btn"
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={handleGenerate}
                disabled={loading || !pdfContext}
            >
                {loading
                    ? <><span className="spinner" style={{ borderTopColor: 'white', width: 15, height: 15 }} /> Generating Podcast…</>
                    : <><Mic size={15} /> Generate Podcast</>
                }
            </button>

            {audioB64 && (
                <div className="panel-card" style={{ marginTop: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>🎧 Listen</h3>
                    <audio controls style={{ width: '100%' }} src={`data:audio/mp3;base64,${audioB64}`} />
                </div>
            )}

            {script && (
                <div className="panel-card" style={{ marginTop: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📜 Script</h3>
                    {script.map((line, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                            <span className={`badge ${line.speaker?.includes('1') ? 'badge-purple' : 'badge-green'}`} style={{ flexShrink: 0 }}>{line.speaker}</span>
                            <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>{line.text}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
