import { AuthProvider, useAuth } from './AuthContext'
import AuthPage from './pages/AuthPage'
import AppShell from './pages/AppShell'

function Root() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3, margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading IntelliDoc AI…</p>
        </div>
      </div>
    )
  }

  return user ? <AppShell /> : <AuthPage />
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  )
}
