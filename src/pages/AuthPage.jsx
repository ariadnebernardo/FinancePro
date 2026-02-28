import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Btn, Input } from '../components/ui'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode]   = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [pass, setPass]   = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    if (mode === 'login') {
      const { error } = await signIn(email, pass)
      if (error) setError(error.message)
    } else {
      const { error } = await signUp(email, pass)
      if (error) setError(error.message)
      else setSuccess('Conta criada! Verifique seu e-mail para confirmar.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0b0f1a',
      backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,179,237,0.08) 0%, transparent 60%)',
      padding: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24, padding: 36,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>💰</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>FinançasPro</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Controle financeiro pessoal</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
              style={{
                flex: 1, padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600,
                background: mode === m ? '#63b3ed' : 'transparent',
                color: mode === m ? '#0b0f1a' : 'rgba(255,255,255,0.45)',
                transition: 'all .2s',
              }}
            >
              {m === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            label="Senha"
            type="password"
            placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
            value={pass}
            onChange={e => setPass(e.target.value)}
            required
          />

          {error   && <p style={{ fontSize: 13, color: '#fc8181', background: 'rgba(252,129,129,0.08)', padding: '10px 14px', borderRadius: 10 }}>{error}</p>}
          {success && <p style={{ fontSize: 13, color: '#68d391', background: 'rgba(104,211,145,0.08)', padding: '10px 14px', borderRadius: 10 }}>{success}</p>}

          <Btn type="submit" disabled={loading} style={{ width: '100%', marginTop: 4, padding: '12px' }}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </Btn>
        </form>
      </div>
    </div>
  )
}
