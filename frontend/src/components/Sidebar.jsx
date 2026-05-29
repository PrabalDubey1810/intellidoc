import { useState, useRef } from 'react'
import { useAuth } from '../AuthContext'
import {
    FileText, MessageSquare, History, Mic, FolderOpen,
    Share2, Database, Headphones, Settings, Youtube,
    Presentation, ClipboardList, LogOut, ChevronDown, Send, Cpu,
    Paperclip, X, CheckCircle, Upload
} from 'lucide-react'
import { uploadPdf, setActivePdf as apiSetActivePdf } from '../api'

const NAV_ITEMS = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'audio', label: 'Audio Summary', icon: Headphones },
    { id: 'podcast', label: 'Podcast Studio', icon: Mic },
    { id: 'quiz', label: 'PDF Quiz', icon: ClipboardList },
    { id: 'graph', label: 'Knowledge Graph', icon: Share2 },
    { id: 'slides', label: 'Slide Deck', icon: Presentation },
    { id: 'youtube', label: 'YouTube Assistant', icon: Youtube },
    { id: 'telegram', label: 'Telegram Bot', icon: Send },
    { id: 'agent', label: 'Agent Mode', icon: Cpu },
]

export default function Sidebar({ activePage, setActivePage }) {
    const { user, logout, activePdf, userPdfs, togglePdfSelection, addUploadedPdfs, removePdf } = useAuth()
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const fileInputRef = useState(null)[0] // Not using useRef because it's simpler here
    const inputRef = useRef()

    const handleUpload = async (files) => {
        if (!files || !files.length) return
        setUploading(true); setError('')
        try {
            const r = await uploadPdf(Array.from(files))
            addUploadedPdfs(r.data.pdfs)
        } catch (err) {
            setError('Upload failed')
            console.error(err)
        } finally {
            setUploading(false)
        }
    }

    const initials = user?.username
        ? user.username.slice(0, 2).toUpperCase()
        : 'U'

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    <FileText size={18} color="white" />
                </div>
                <span className="sidebar-logo-text">IntelliDoc AI</span>
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
                <span className="nav-section-label">Features</span>
                {NAV_ITEMS.map(item => {
                    const Icon = item.icon
                    return (
                        <button
                            key={item.id}
                            id={`nav-${item.id}`}
                            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                            onClick={() => setActivePage(item.id)}
                        >
                            <Icon size={16} />
                            {item.label}
                        </button>
                    )
                })}
            </nav>

            {/* Document Management */}
            <div className="sidebar-docs" style={{ padding: '0 12px', marginTop: 24, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="nav-section-label">Your Documents</span>
                
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {userPdfs.map(pdf => {
                        const isActive = (activePdf.ids || []).includes(pdf.id)
                        return (
                            <div key={pdf.id} className="pdf-item-card" style={{
                                background: isActive ? 'rgba(139, 92, 246, 0.08)' : 'var(--bg-secondary)',
                                border: isActive ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                padding: '8px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }} onClick={() => togglePdfSelection(pdf.id)}>
                                <div style={{ 
                                    background: isActive ? 'var(--accent)' : 'var(--text-muted)', 
                                    borderRadius: 4, 
                                    padding: 4, 
                                    display: 'flex' 
                                }}>
                                    <FileText size={14} color="white" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ 
                                        fontSize: 12, 
                                        fontWeight: 600, 
                                        color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap' 
                                    }}>
                                        {pdf.filename}
                                    </div>
                                </div>
                                {isActive && (
                                    <CheckCircle size={14} color="var(--accent)" />
                                )}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); removePdf(pdf.id) }}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2, marginLeft: 'auto' }}
                                    title="Delete document"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )
                    })}
                </div>

                <div className="upload-btn-container" style={{ marginTop: 8 }}>
                    <input 
                        type="file" 
                        accept=".pdf" 
                        multiple 
                        hidden 
                        ref={inputRef}
                        onChange={e => handleUpload(e.target.files)}
                    />
                    <button 
                        className="nav-item" 
                        style={{ width: '100%', justifyContent: 'center', background: 'var(--bg-secondary)', border: '1px dashed var(--border)', gap: 8, padding: '8px' }}
                        onClick={() => inputRef.current.click()}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <span className="spinner" style={{ width: 14, height: 14 }} />
                        ) : (
                            <Upload size={14} />
                        )}
                        {uploading ? 'Uploading...' : 'Upload PDF'}
                    </button>
                    {error && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4, textAlign: 'center' }}>{error}</div>}
                </div>
            </div>

            {/* Bottom */}
            <div className="sidebar-bottom">
                <button id="nav-settings" className="nav-item">
                    <Settings size={16} /> Settings
                </button>
                <div className="user-chip" onClick={logout} title="Click to logout" id="user-chip">
                    <div className="user-avatar">{initials}</div>
                    <span className="user-name">{user?.username}</span>
                    <LogOut size={14} color="var(--text-muted)" />
                </div>
            </div>
        </aside>
    )
}
