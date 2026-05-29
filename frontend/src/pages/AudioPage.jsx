import { useState, useRef } from 'react'
import { uploadPdf, getAudioSummary, setActivePdf as apiSetActivePdf } from '../api'
import { useAuth } from '../AuthContext'
import { Upload, FileText, Volume2, Loader, CheckCircle } from 'lucide-react'

export default function AudioPage() {
    const { activePdf, setActivePdf } = useAuth()
    const pdfContext = activePdf.text
    const fileName = activePdf.fileName

    const [summary, setSummary] = useState('')
    const [audioB64, setAudioB64] = useState('')
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
        setLoading(true); setError(''); setSummary(''); setAudioB64('')
        try {
            const r = await getAudioSummary(pdfContext)
            setSummary(r.data.summary)
            setAudioB64(r.data.audio_b64)
        } catch { setError('Failed to generate audio summary') }
        finally { setLoading(false) }
    }

    return (
        <div className="feature-panel">
            <h2>🔊 Audio Summary</h2>
            <p className="subtitle">Upload a PDF and get an AI-generated audio summary.</p>

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
                    id="audio-upload-zone"
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
                id="generate-audio-btn"
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={handleGenerate}
                disabled={loading || !pdfContext}
            >
                {loading ? <><Loader size={15} className="spin" /> Generating…</> : <><Volume2 size={15} /> Generate Audio Summary</>}
            </button>

            {summary && (
                <div className="panel-card" style={{ marginTop: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>📝 Summary</h3>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{summary}</p>
                </div>
            )}

            {audioB64 && (
                <div className="panel-card" style={{ marginTop: 12 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>🎧 Audio</h3>
                    <audio controls style={{ width: '100%' }} src={`data:audio/mp3;base64,${audioB64}`} />
                </div>
            )}
        </div>
    )
}
