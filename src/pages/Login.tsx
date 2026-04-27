import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao entrar.'
      setError(traduzirErro(message))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    setLoading(true)
    try {
      await loginWithGoogle()
      navigate('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao entrar com Google.'
      setError(traduzirErro(message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="logo">ETUS</div>
        <div>
          <h2>
            Bem-vindo ao <span>Jurídico</span>
          </h2>
          <p style={{ color: 'var(--neutral-300)', marginTop: 16, maxWidth: 480, fontSize: 15, lineHeight: 1.6 }}>
            Sistema interno do time Jurídico do Grupo ETUS. Gerencie contratos, processos,
            demandas e compliance em um único lugar.
          </p>
        </div>
        <div className="footnote">
          Jurídico · Grupo ETUS
        </div>
      </div>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <h1>Entrar</h1>
            <p>Acesse com seu e-mail corporativo.</p>
          </div>
          {error && <div className="error-text">{error}</div>}
          <div className="field">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
          <div className="divider" />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleGoogle}
            disabled={loading}
            style={{ width: '100%' }}
          >
            Entrar com Google
          </button>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Apenas e-mails @etus.com.br, @plusdin.com.br, @brius.com.br e @bhaz.com.br
          </p>
        </form>
      </div>
    </div>
  )
}

function traduzirErro(msg: string): string {
  if (msg.includes('auth/invalid-credential')) return 'E-mail ou senha incorretos.'
  if (msg.includes('auth/user-not-found')) return 'Usuário não encontrado.'
  if (msg.includes('auth/wrong-password')) return 'Senha incorreta.'
  if (msg.includes('auth/too-many-requests')) return 'Muitas tentativas. Tente novamente em alguns minutos.'
  if (msg.includes('auth/network-request-failed')) return 'Falha de conexão. Verifique sua internet.'
  if (msg.includes('não autorizado')) return msg
  return msg
}
