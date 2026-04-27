import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, doc, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import StatusBadge from '../components/StatusBadge'
import type { UserProfile, Role } from '../types'
import { ROLE_LABELS } from '../types'
import { formatDate } from '../utils/format'

export default function Usuarios() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'users'))
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile)))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  async function handleRoleChange(uid: string, newRole: Role) {
    await updateDoc(doc(db, 'users', uid), { role: newRole })
  }

  async function handleBlock(uid: string, email: string) {
    if (!confirm(`Bloquear ${email}? O usuário não poderá acessar o sistema.`)) return
    await setDoc(doc(db, 'blocked_users', uid), {
      email,
      blockedAt: new Date().toISOString(),
    })
  }

  const roleColor: Record<Role, string> = {
    juridico_lider: 'em_andamento',
    juridico_analista: 'vigente',
    solicitante: 'rascunho',
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Usuários</h1>
          <p>Gerencie permissões e bloqueios de acesso.</p>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Papel atual</th>
              <th>Empresa</th>
              <th>Criado em</th>
              <th>Alterar papel</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="empty-state">Carregando…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="empty-state">Nenhum usuário.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.uid}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td><StatusBadge status={roleColor[u.role]} label={ROLE_LABELS[u.role]} /></td>
                  <td>{u.empresa || '—'}</td>
                  <td>{u.createdAt ? formatDate(u.createdAt) : '—'}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value as Role)}
                      style={{ fontSize: 12, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border)' }}
                    >
                      {Object.entries(ROLE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleBlock(u.uid, u.email)}
                    >
                      Bloquear
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
