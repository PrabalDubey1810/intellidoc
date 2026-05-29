import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { login as apiLogin, register as apiRegister, getMe } from '../api'
import { FileText, Sparkles } from 'lucide-react'

export default function AuthPage() {
    const { setUser } = useAuth()
    const [tab, setTab] = useState('login')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'

    const handleLogin = async e => {
        e.preventDefault()
        setError(''); setSuccess('')
        if (!username || !password) { setError('Please fill in all fields'); return }
        setLoading(true)
        try {
            const r = await apiLogin(username, password)
            setUser(r.data)
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed')
        } finally { setLoading(false) }
    }

    const handleRegister = async e => {
        e.preventDefault()
        setError(''); setSuccess('')
        if (!username || !password) { setError('Please fill in all fields'); return }
        setLoading(true)
        try {
            await apiRegister(username, password)
            setSuccess('Account created! Please log in.')
            setTab('login')
            setUsername(''); setPassword('')
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed')
        } finally { setLoading(false) }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                {/* Logo */}
                <div className="auth-logo">
                    <div className="auth-logo-icon">
                        <FileText size={22} color="white" />
                    </div>
                    <span className="auth-logo-text">IntelliDoc AI</span>
                </div>

                <h1 className="auth-title">{greeting}! 👋</h1>
                <p className="auth-sub">Your advanced document assistant. Chat, Analyze, Visualize.</p>

                {/* Tabs */}
                <div className="auth-tabs">
                    <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); setSuccess('') }}>
                        Login
                    </button>
                    <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); setSuccess('') }}>
                        Register
                    </button>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {success && <div className="auth-success">{success}</div>}

                <form onSubmit={tab === 'login' ? handleLogin : handleRegister}>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                            id="auth-username"
                            className="form-input"
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoComplete="username"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            id="auth-password"
                            className="form-input"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                        />
                    </div>
                    <button
                        id="auth-submit"
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                        disabled={loading}
                    >
                        {loading ? <span className="spinner" style={{ borderTopColor: 'white' }} /> : <Sparkles size={15} />}
                        {loading ? 'Please wait…' : tab === 'login' ? 'Login' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    )
}
