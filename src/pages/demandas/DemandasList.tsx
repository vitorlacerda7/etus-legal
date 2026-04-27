import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import type { Demanda, DemandaStatus, DemandaTipo, DemandaUrgencia } from '../../types'
import {
  DEMANDA_STATUS_LABELS,
  DEMANDA_TIPO_LABELS,
  DEMANDA_URGENCIA_LABELS,
  SLA_DIAS,
} from '../../types'
import { businessDaysSince, formatDate } from '../../utils/format'

function getSlaClass(d: Demanda): string {
  if (d.status === 'concluida' || d.status === 'arquivada') return ''
  const days = businessDaysSince(d.criadoEm)
  const limit = SLA_DIAS[d.urgencia]
  if (days > limit) return 'sla-bad'
  if (days > limit * 0.7) return 'sla-warn'
  return 'sla-ok'
}

export default function DemandasList() {
  const { profile } = useAuth()
  const [demandas, setDemandas] = useState<Demanda[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState<DemandaStatus | 'all'>('all')
  const [tipo, setTipo] = useState<DemandaTipo | 'all'>('all')
  const [urgencia, setUrgencia] = useState<DemandaUrgencia | 'all'>('all')

  const isSolicitante = profile?.role === 'solicitante'

  useEffect(() => {
    const q = query(collection(db, 'demandas'), orderBy('criadoEm', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Demanda))
      if (isSolicitante) {
        docs = docs.filter((d) => d.solicitanteUid === profile?.uid)
      }
      setDemandas(docs)
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [isSolicitante, profile?.uid])

  const filtradas = useMemo(() => {
    return demandas.filter((d) => {
      if (status !== 'all' && d.status !== status) return false
      if (tipo !== 'all' && d.tipo !== tipo) return false
      if (urgencia !== 'all' && d.urgencia !== urgencia) return false
      if (busca) {
        const hay = `${d.titulo} ${d.descricao} ${d.solicitanteNome}`.toLowerCase()
        if (!hay.includes(busca.toLowerCase())) return false
      }
      return true
    })
  }, [demandas, status, tipo, urgencia, busca])

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{isSolicitante ? 'Minhas Demandas' : 'Demandas'}</h1>
          <p>{isSolicitante ? 'Acompanhe suas solicitações ao Jurídico.' : 'Gerencie as demandas do time.'}</p>
        </div>
        <Link to="/demandas/nova" className="btn btn-primary">
          + Nova demanda
        </Link>
      </div>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Buscar por título, descrição…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ flex: 1, minWidth: 260 }}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as DemandaStatus | 'all')}>
          <option value="all">Todos os status</option>
          {Object.entries(DEMANDA_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={tipo} onChange={(e) => setTipo(e.target.value as DemandaTipo | 'all')}>
          <option value="all">Todos os tipos</option>
          {Object.entries(DEMANDA_TIPO_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={urgencia} onChange={(e) => setUrgencia(e.target.value as DemandaUrgencia | 'all')}>
          <option value="all">Todas as urgências</option>
          {Object.entries(DEMANDA_URGENCIA_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Tipo</th>
              <th>Urgência</th>
              <th>Solicitante</th>
              <th>Analista</th>
              <th>Status</th>
              <th>Criada em</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="empty-state">Carregando…</td></tr>
            ) : filtradas.length === 0 ? (
              <tr><td colSpan={8} className="empty-state">Nenhuma demanda encontrada.</td></tr>
            ) : (
              filtradas.map((d) => (
                <tr key={d.id} className={getSlaClass(d)}>
                  <td style={{ fontWeight: 600 }}>{d.titulo}</td>
                  <td>{DEMANDA_TIPO_LABELS[d.tipo]}</td>
                  <td><StatusBadge status={d.urgencia} label={DEMANDA_URGENCIA_LABELS[d.urgencia]} /></td>
                  <td>{d.solicitanteNome}</td>
                  <td>{d.analistaAtribuidoNome || '—'}</td>
                  <td><StatusBadge status={d.status} label={DEMANDA_STATUS_LABELS[d.status]} /></td>
                  <td>{formatDate(d.criadoEm)}</td>
                  <td><Link to={`/demandas/${d.id}`} className="btn btn-sm btn-ghost">Ver</Link></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
