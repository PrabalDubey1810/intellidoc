import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import Sidebar from '../components/Sidebar'
import ChatPage from './ChatPage'
import AudioPage from './AudioPage'
import PodcastPage from './PodcastPage'
import QuizPage from './QuizPage'
import GraphPage from './GraphPage'
import SlidesPage from './SlidesPage'
import YouTubePage from './YouTubePage'
import TelegramPage from './TelegramPage'
import AgentPage from './AgentPage'
import { ChevronDown, Search, UserPlus, Plus, Monitor, Globe, Cpu } from 'lucide-react'

// ── Model definitions ─────────────────────────────────────────────────────────
const MODELS = [
    {
        key: 'online',
        label: 'MiniMax Cloud',
        description: 'Online · Fast · Powerful',
        Icon: Globe,
        color: '#8b5cf6',
    },
    {
        key: 'offline',
        label: 'Qwen3-VL 4B',
        description: 'Offline · Local · Private',
        Icon: Monitor,
        color: '#10b981',
    },
]

// ── Model Picker Dropdown ─────────────────────────────────────────────────────
function ModelPicker({ selected, onChange }) {
    const [open, setOpen] = useState(false)
    const ref = useRef()
    const current = MODELS.find(m => m.key === selected) || MODELS[0]

    // Close on outside click
    useEffect(() => {
        const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            {/* Badge button */}
            <button
                id="topbar-model-badge"
                className="topbar-model-badge"
                onClick={() => setOpen(o => !o)}
                style={{ gap: 7 }}
            >
                <current.Icon size={14} style={{ color: current.color }} />
                <span>{current.label}</span>
                <ChevronDown size={13} style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }} />
            </button>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 200,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 32px rgba(0,0,0,.35)',
                    minWidth: 220, overflow: 'hidden',
                    animation: 'fadeIn .15s ease',
                }}>
                    <div style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid var(--border)' }}>
                        Select Model
                    </div>
                    {MODELS.map(m => {
                        const active = m.key === selected
                        return (
                            <button
                                key={m.key}
                                id={`model-option-${m.key}`}
                                onClick={() => { onChange(m.key); setOpen(false) }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    width: '100%', padding: '10px 14px', border: 'none', cursor: 'pointer',
                                    background: active ? 'rgba(139,92,246,.08)' : 'transparent',
                                    color: 'var(--text-primary)', textAlign: 'left',
                                    transition: 'background .15s',
                                }}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)' }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                            >
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                    background: `${m.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <m.Icon size={15} style={{ color: m.color }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{m.label}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{m.description}</div>
                                </div>
                                {active && (
                                    <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                                )}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ── App Shell ─────────────────────────────────────────────────────────────────
export default function AppShell() {
    const { user } = useAuth()
    const [activePage, setActivePage] = useState('chat')
    const [selectedModel, setSelectedModel] = useState('online')

    return (
        <div className="app-layout">
            <Sidebar activePage={activePage} setActivePage={setActivePage} />

            <div className="main">
                {/* Topbar */}
                <header className="topbar">
                    <div className="topbar-left">
                        <ModelPicker selected={selectedModel} onChange={setSelectedModel} />
                    </div>
                    <div className="topbar-right">
                        <button id="topbar-search" className="topbar-btn">
                            <Search size={14} /> Search thread
                        </button>
                        <button id="topbar-invite" className="topbar-btn">
                            <UserPlus size={14} /> Invite
                        </button>
                        <button
                            id="topbar-new-thread"
                            className="topbar-btn primary"
                            onClick={() => setActivePage('chat')}
                        >
                            <Plus size={14} /> New Thread
                        </button>
                    </div>
                </header>

                {/* Page Content - Persisted */}
                <div className="content">
                    <div style={{ display: activePage === 'chat' ? 'flex' : 'none', flex: 1, flexDirection: 'column' }}>
                        <ChatPage username={user?.username || 'User'} model={selectedModel} />
                    </div>
                    <div style={{ display: activePage === 'audio' ? 'flex' : 'none', flex: 1, flexDirection: 'column' }}>
                        <AudioPage />
                    </div>
                    <div style={{ display: activePage === 'podcast' ? 'flex' : 'none', flex: 1, flexDirection: 'column' }}>
                        <PodcastPage />
                    </div>
                    <div style={{ display: activePage === 'quiz' ? 'flex' : 'none', flex: 1, flexDirection: 'column' }}>
                        <QuizPage />
                    </div>
                    <div style={{ display: activePage === 'graph' ? 'flex' : 'none', flex: 1, flexDirection: 'column' }}>
                        <GraphPage />
                    </div>
                    <div style={{ display: activePage === 'slides' ? 'flex' : 'none', flex: 1, flexDirection: 'column' }}>
                        <SlidesPage />
                    </div>
                    <div style={{ display: activePage === 'youtube' ? 'flex' : 'none', flex: 1, flexDirection: 'column' }}>
                        <YouTubePage />
                    </div>
                    <div style={{ display: activePage === 'telegram' ? 'flex' : 'none', flex: 1, flexDirection: 'column' }}>
                        <TelegramPage />
                    </div>
                    <div style={{ display: activePage === 'agent' ? 'flex' : 'none', flex: 1, flexDirection: 'column' }}>
                        <AgentPage />
                    </div>
                </div>
            </div>
        </div>
    )
}
