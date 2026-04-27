import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROLE_LABELS } from '../types'

interface NavItem {
  to: string
  label: string
  icon: string
}

const liderNav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/contratos', label: 'Contratos', icon: '◈' },
  { to: '/processos', label: 'Processos', icon: '◉' },
  { to: '/demandas', label: 'Demandas', icon: '◱' },
  { to: '/lgpd', label: 'LGPD / Compliance', icon: '⚑' },
  { to: '/espaco-seguro/admin', label: 'Espaço Seguro', icon: '◆' },
  { to: '/usuarios', label: 'Usuários', icon: '◎' },
]

const analistaNav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/contratos', label: 'Contratos', icon: '◈' },
  { to: '/processos', label: 'Processos', icon: '◉' },
  { to: '/demandas', label: 'Demandas', icon: '◱' },
  { to: '/lgpd', label: 'LGPD / Compliance', icon: '⚑' },
  { to: '/espaco-seguro/admin', label: 'Espaço Seguro', icon: '◆' },
]

const solicitanteNav: NavItem[] = [
  { to: '/', label: 'Minhas Demandas', icon: '◱' },
  { to: '/demandas/nova', label: 'Nova Solicitação', icon: '+' },
  { to: '/espaco-seguro', label: 'Espaço Seguro', icon: '◆' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

  const role = profile?.role ?? 'solicitante'
  const nav = role === 'juridico_lider'
    ? liderNav
    : role === 'juridico_analista'
      ? analistaNav
      : solicitanteNav

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <>
      <div className={'sidebar-backdrop' + (open ? ' open' : '')} onClick={onClose} />
      <aside className={'sidebar' + (open ? ' open' : '')}>
        <div className="brand">
          <div className="logo">ETUS</div>
          <div className="subtitle">Jurídico</div>
        </div>

        <div className="section-label">
          {role === 'juridico_lider'
            ? 'Jurídico — Líder'
            : role === 'juridico_analista'
              ? 'Jurídico — Analista'
              : 'Solicitante'}
        </div>

        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
            onClick={onClose}
          >
            <span style={{ width: 18, textAlign: 'center', fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className="user-box">
          <div>
            <div className="name">{profile?.name}</div>
            <div className="role">{profile?.email} · {ROLE_LABELS[role]}</div>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleLogout}
            style={{ color: 'var(--neutral-50)', borderColor: 'var(--neutral-700)' }}
          >
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
