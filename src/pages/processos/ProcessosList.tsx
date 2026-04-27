import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { db } from '../../firebase'
import StatusBadge from '../../components/StatusBadge'
import type { Processo, ProcessoArea, ProcessoStatus } from '../../types'
import { PROCESSO_AREA_LABELS, PROCESSO_STATUS_LABELS, EMPRESAS } from '../../types'
import { formatCurrency } from '../../utils/format'

export default function ProcessosList() {
  const [processos, setProcessos] = useState<Processo[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState<ProcessoStatus | 'all'>('all')
  const [area, setArea] = useState<ProcessoArea | 'all'>('all')
  const [empresa, setEmpresa] = useState<string>('all')

  useEffect(() => {
    const q = query(collection(db, 'processos'), orderBy('criadoEm', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setProcessos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Processo)))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  const filtrados = useMemo(() => {
    return processos.filter((p) => {
      if (status !== 'all' && p.status !== status) return false
      if (area !== 'all' && p.area !== area) return false
      if (empresa !== 'all' && p.empresa !== empresa) return false
      if (busca) {
        const hay = `${p.numeroCnj} ${p.autorNome} ${p.reuNome} ${p.vara} ${p.comarca}`.toLowerCase()
        if (!hay.includes(busca.toLowerCase())) return false
      }
      return true
    })
  }, [processos, status, area, empresa, busca])

  const totalContingencia = useMemo(
    () => filtrados.reduce((s, p) => s + (p.valorProvisionado || 0), 0),
    [filtrados],
  )

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Processos Judiciais</h1>
          <p>Contingência total filtrada: {formatCurrency(totalContingencia)}</p>
        </div>
        <Link to="/processos/novo" className="btn btn-primary">
          + Novo processo
        </Link>
      </div>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Buscar por nº CNJ, partes, vara…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ flex: 1, minWidth: 260 }}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as ProcessoStatus | 'all')}>
          <option value="all">Todos os status</option>
          {Object.entries(PROCESSO_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={area} onChange={(e) => setArea(e.target.value as ProcessoArea | 'all')}>
          <option value="all">Todas as áreas</option>
          {Object.entries(PROCESSO_AREA_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={empresa} onChange={(e) => setEmpresa(e.target.value)}>
          <option value="all">Todas as empresas</option>
          {EMPRESAS.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nº CNJ</th>
              <th>Área</th>
              <th>Empresa</th>
              <th>Autor</th>
              <th>Réu</th>
              <th>Valor causa</th>
              <th>Provisionado</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="empty-state">Carregando…</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={9} className="empty-state">Nenhum processo encontrado.</td></tr>
            ) : (
              filtrados.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}>{p.numeroCnj}</td>
                  <td>{PROCESSO_AREA_LABELS[p.area]}</td>
                  <td>{p.empresa}</td>
                  <td>{p.autorNome}</td>
                  <td>{p.reuNome}</td>
                  <td>{formatCurrency(p.valorCausa)}</td>
                  <td>{formatCurrency(p.valorProvisionado)}</td>
                  <td><StatusBadge status={p.status} label={PROCESSO_STATUS_LABELS[p.status]} /></td>
                  <td><Link to={`/processos/${p.id}`} className="btn btn-sm btn-ghost">Detalhe</Link></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
