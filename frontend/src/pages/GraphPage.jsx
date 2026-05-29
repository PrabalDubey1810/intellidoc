import { useState, useRef, useEffect } from 'react'
import { uploadPdf, getKnowledgeGraph, setActivePdf as apiSetActivePdf } from '../api'
import { useAuth } from '../AuthContext'
import { Upload, FileText, Share2, CheckCircle } from 'lucide-react'

function GraphViz({ relationships }) {
    const svgRef = useRef()
    const W = 700, H = 420, R = 28

    // Simple force-like layout: place nodes in a circle
    const nodes = []
    const nodeMap = {}
    relationships.forEach(r => {
        if (!nodeMap[r.source]) { nodeMap[r.source] = nodes.length; nodes.push(r.source) }
        if (!nodeMap[r.target]) { nodeMap[r.target] = nodes.length; nodes.push(r.target) }
    })

    const cx = W / 2, cy = H / 2, radius = Math.min(W, H) / 2 - 70
    const positions = nodes.map((_, i) => ({
        x: cx + radius * Math.cos((2 * Math.PI * i) / nodes.length - Math.PI / 2),
        y: cy + radius * Math.sin((2 * Math.PI * i) / nodes.length - Math.PI / 2),
    }))

    return (
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-card)' }}>
            <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="var(--text-muted)" />
                </marker>
            </defs>

            {/* Edges */}
            {relationships.map((rel, i) => {
                const si = nodeMap[rel.source], ti = nodeMap[rel.target]
                if (si === undefined || ti === undefined) return null
                const s = positions[si], t = positions[ti]
                const dx = t.x - s.x, dy = t.y - s.y
                const len = Math.sqrt(dx * dx + dy * dy)
                const ux = dx / len, uy = dy / len
                const x1 = s.x + ux * R, y1 = s.y + uy * R
                const x2 = t.x - ux * (R + 8), y2 = t.y - uy * (R + 8)
                const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
                return (
                    <g key={i}>
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--border)" strokeWidth="1.5" markerEnd="url(#arrow)" />
                        <text x={mx} y={my - 6} textAnchor="middle" className="graph-edge-label" fontSize="10" fill="var(--text-muted)">{rel.label}</text>
                    </g>
                )
            })}

            {/* Nodes */}
            {nodes.map((name, i) => (
                <g key={i}>
                    <circle cx={positions[i].x} cy={positions[i].y} r={R} fill="var(--bg-secondary)" stroke="var(--accent)" strokeWidth="2" />
                    <text x={positions[i].x} y={positions[i].y + 4} textAnchor="middle" fontSize="11" fontFamily="Inter,sans-serif" fill="var(--text-primary)" fontWeight="600">
                        {name.length > 10 ? name.slice(0, 9) + '…' : name}
                    </text>
                </g>
            ))}
        </svg>
    )
}

export default function GraphPage() {
    const { activePdf, setActivePdf } = useAuth()
    const pdfContext = activePdf.text
    const fileName = activePdf.fileName

    const [rels, setRels] = useState(null)
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
        setLoading(true); setError(''); setRels(null)
        try {
            const r = await getKnowledgeGraph(pdfContext)
            setRels(r.data.relationships)
        } catch (e) { setError(e.response?.data?.error || 'Failed to generate graph') }
        finally { setLoading(false) }
    }

    return (
        <div className="feature-panel">
            <h2>🕸️ Knowledge Graph</h2>
            <p className="subtitle">Visualize entity relationships extracted from your document.</p>

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
                    id="graph-upload-zone"
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
                id="generate-graph-btn"
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={handleGenerate}
                disabled={loading || !pdfContext}
            >
                {loading
                    ? <><span className="spinner" style={{ borderTopColor: 'white', width: 15, height: 15 }} /> Analyzing…</>
                    : <><Share2 size={15} /> Generate Knowledge Graph</>
                }
            </button>

            {rels && (
                <div style={{ marginTop: 24 }}>
                    <GraphViz relationships={rels} />
                    <div className="panel-card" style={{ marginTop: 14 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Relationships</h3>
                        {rels.map((r, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '5px 0', borderBottom: i < rels.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                <span className="badge badge-purple">{r.source}</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>→ {r.label} →</span>
                                <span className="badge badge-gray">{r.target}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
