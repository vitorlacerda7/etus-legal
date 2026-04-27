import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { db } from '../../firebase'
import StatusBadge from '../../components/StatusBadge'
import type { Contrato, ContratoStatus, ContratoTipo } from '../../types'
import { CONTRATO_STATUS_LABELS, CONTRATO_TIPO_LABELS, EMPRESAS } from '../../types'
import { formatCurrency, daysUntil } from '../../utils/format'

export default function ContratosList() {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState<ContratoStatus | 'all'>('all')
  const [empresa, setEmpresa] = useState<string>('all')
  const [tipo, setTipo] = useState<ContratoTipo | 'all'>('all')

  useEffect(() => {
    const q = query(collection(db, 'contratos'), orderBy('criadoEm', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setContratos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Contrato)))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  const filtrados = useMemo(() => {
    return contratos.filter((c) => {
      if (status !== 'all' && c.status !== status) return false
      if (empresa !== 'all' && c.empresa !== empresa) return false
      if (tipo !== 'all' && c.tipo !== tipo) return false
      if (busca) {
        const hay = `${c.parteContratadaNome} ${c.empresa} ${c.parteContratadaDocumento}`.toLowerCase()
        if (!hay.includes(busca.toLowerCase())) return false
      }
      return true
    })
  }, [contratos, status, empresa, tipo, busca])

  function getVencimentoBadge(c: Contrato) {
    if (c.status === 'rescindido') return null
    const d = daysUntil(c.vigenciaFim)
    if (d < 0) return <StatusBadge status="vencido" label="Vencido" />
    if (d <= 30) return <StatusBadge status="alta" label={`Vence em ${d}d`} />
    return null
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Contratos</h1>
          <p>Gestão de contratos do Grupo ETUS.</p>
        </div>
        <Link to="/contratos/novo" className="btn btn-primary">
          + Novo contrato
        </Link>
      </div>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Buscar por parte contratada, empresa…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ flex: 1, minWidth: 260 }}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as ContratoStatus | 'all')}>
          <option value="all">Todos os status</option>
          {Object.entries(CONTRATO_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={empresa} onChange={(e) => setEmpresa(e.target.value)}>
          <option value="all">Todas as empresas</option>
          {EMPRESAS.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select value={tipo} onChange={(e) => setTipo(e.target.value as ContratoTipo | 'all')}>
          <option value="all">Todos os tipos</option>
          {Object.entries(CONTRATO_TIPO_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Parte contratada</th>
              <th>Empresa</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Vigência</th>
              <th>Status</th>
              <th>Alerta</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="empty-state">Carregando…</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={8} className="empty-state">Nenhum contrato encontrado.</td></tr>
            ) : (
              filtrados.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.parteContratadaNome}</td>
                  <td>{c.empresa}</td>
                  <td>{CONTRATO_TIPO_LABELS[c.tipo]}</td>
                  <td>{formatCurrency(c.valorTotal)}</td>
                  <td>{c.vigenciaInicio} — {c.vigenciaFim}</td>
                  <td><StatusBadge status={c.status} label={CONTRATO_STATUS_LABELS[c.status]} /></td>
                  <td>{getVencimentoBadge(c)}</td>
                  <td><Link to={`/contratos/${c.id}`} className="btn btn-sm btn-ghost">Detalhe</Link></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
