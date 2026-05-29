import { Send, FileText, MessageSquare } from 'lucide-react'

export default function TelegramPage() {
    return (
        <div className="feature-panel">
            <h2>🤖 Telegram Bot Integration</h2>
            <p className="subtitle">Chat with IntelliDoc AI directly from Telegram and analyze PDFs on the go.</p>

            <div className="panel-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{
                    width: 80, height: 80, borderRadius: '50%', background: '#0088cc', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                    fontSize: 40, boxShadow: '0 8px 32px rgba(0,136,204,0.3)'
                }}>
                    <Send size={40} style={{ marginLeft: -4 }} />
                </div>

                <h3 style={{ fontSize: 20, marginBottom: 10 }}>@ComedyhackersBOT</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 }}>
                    Our Telegram bot is running and ready to help! Send it a PDF to analyze or just chat with it.
                </p>

                <a
                    href="https://t.me/ComedyhackersBOT"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ background: '#0088cc', border: 'none', display: 'inline-flex', padding: '10px 24px' }}
                >
                    <MessageSquare size={18} />
                    Open in Telegram
                </a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
                <div className="panel-card">
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ padding: 8, borderRadius: 8, background: 'rgba(59,130,246,.1)', color: '#3b82f6' }}><FileText size={20} /></div>
                        <h4 style={{ margin: 0 }}>Analyze PDFs</h4>
                    </div>
                    <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Send any PDF file to the bot. It will read it instantly and let you ask questions about the content.
                    </p>
                </div>

                <div className="panel-card">
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ padding: 8, borderRadius: 8, background: 'rgba(16,185,129,.1)', color: '#10b981' }}><MessageSquare size={20} /></div>
                        <h4 style={{ margin: 0 }}>Instant Chat</h4>
                    </div>
                    <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Just send text messages to chat with the AI. It uses the same powerful model as this web app.
                    </p>
                </div>
            </div>
        </div>
    )
}
