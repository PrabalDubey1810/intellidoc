import { useState, useRef } from 'react'
import { uploadPdf, generateSlides, setActivePdf as apiSetActivePdf } from '../api'
import { useAuth } from '../AuthContext'
import { Upload, FileText, Presentation, Download, CheckCircle } from 'lucide-react'

export default function SlidesPage() {
    const { activePdf, setActivePdf } = useAuth()
    const pdfContext = activePdf.text
    const fileName = activePdf.fileName

    const [slidesData, setSlidesData] = useState(null)
    const [pptxB64, setPptxB64] = useState('')
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const [drag, setDrag] = useState(false)
    const [theme, setTheme] = useState('midnight')
    const inputRef = useRef()

    const themes = [
        { id: 'midnight', label: 'Midnight', colors: ['#14141e', '#ffc800', '#0096ff'] },
        { id: 'ocean', label: 'Ocean', colors: ['#0a2d3c', '#00ffc8', '#00b4dc'] },
        { id: 'minimal', label: 'Minimal', colors: ['#ffffff', '#000000', '#646464'] },
        { id: 'sunset', label: 'Sunset', colors: ['#2d0a32', '#ff7800', '#b432c8'] }
    ]

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
        setLoading(true); setError(''); setSlidesData(null); setPptxB64('')
        try {
            const r = await generateSlides(pdfContext, theme)
            setSlidesData(r.data.slides_data)
            setPptxB64(r.data.pptx_b64)
        } catch (e) { setError(e.response?.data?.error || 'Failed to generate slides') }
        finally { setLoading(false) }
    }

    const handleDownload = () => {
        const bytes = atob(pptxB64)
        const arr = new Uint8Array(bytes.length)
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
        const blob = new Blob([arr], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'intellidoc_presentation.pptx'; a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="feature-panel">
            <h2>📽️ Smart Slide Deck</h2>
            <p className="subtitle">Generate a designer PowerPoint presentation from your PDF using Google Gemini.</p>

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
                    id="slides-upload-zone"
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

            <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Select Slide Theme</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
                    {themes.map(t => (
                        <div
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            style={{
                                cursor: 'pointer',
                                padding: 10,
                                borderRadius: 12,
                                border: '2px solid',
                                borderColor: theme === t.id ? 'var(--accent)' : 'var(--border)',
                                background: t.colors[0],
                                transition: 'all 0.2s'
                            }}
                        >
                            <p style={{ color: t.colors[1], fontSize: 11, fontWeight: 700, marginBottom: 8 }}>{t.label}</p>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <div style={{ width: 12, height: 12, borderRadius: 2, background: t.colors[1] }} />
                                <div style={{ width: 12, height: 12, borderRadius: 2, background: t.colors[2] }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button
                id="generate-slides-btn"
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={handleGenerate}
                disabled={loading || !pdfContext}
            >
                {loading
                    ? <><span className="spinner" style={{ borderTopColor: 'white', width: 15, height: 15 }} /> Designing Slides…</>
                    : <><Presentation size={15} /> Generate Slides</>
                }
            </button>

            {pptxB64 && (
                <div className="panel-card" style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <p style={{ fontWeight: 600, fontSize: 15 }}>✅ Slides Ready!</p>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Your presentation has been generated successfully.</p>
                    </div>
                    <button id="download-pptx-btn" className="btn btn-accent" onClick={handleDownload}>
                        <Download size={15} /> Download .pptx
                    </button>
                </div>
            )}

            {slidesData && (
                <div className="panel-card" style={{ marginTop: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Slide Preview</h3>
                    {(Array.isArray(slidesData) ? slidesData : slidesData.slides || []).map((slide, i) => (
                        <div key={i} style={{ padding: '12px 0', borderBottom: i < (slidesData.slides || slidesData).length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <p style={{ fontWeight: 600, fontSize: 14 }}>Slide {i + 1}: {slide.title || slide.heading || 'Untitled'}</p>
                            {slide.content && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{typeof slide.content === 'string' ? slide.content : JSON.stringify(slide.content)}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
