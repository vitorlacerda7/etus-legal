import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { db } from '../firebase'
import KpiCard from '../components/KpiCard'
import StatusBadge from '../components/StatusBadge'
import type {
  Contrato,
  Demanda,
  DemandaStatus,
  Processo,
  ProcessoStatus,
} from '../types'
import {
  CONTRATO_STATUS_LABELS,
  DEMANDA_STATUS_LABELS,
  DEMANDA_URGENCIA_LABELS,
  PROCESSO_STATUS_LABELS,
} from '../types'
import { daysUntil, formatCurrency } from '../utils/format'

const STATUS_COLORS: Record<string, string> = {
  rascunho: '#D6D4D1',
  em_analise: '#A0E3F3',
  aprovado: '#C5F07A',
  assinado: '#3BE476',
  vigente: '#3BE476',
  vencido: '#F0BFBF',
  rescindido: '#D6D4D1',
  em_andamento: '#A0E3F3',
  sentenca_favoravel: '#3BE476',
  sentenca_desfavoravel: '#F0BFBF',
  recurso: '#F0EE7A',
  transito_julgado: '#D6D4D1',
  arquivado: '#D6D4D1',
}

export default function Dashboard() {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [processos, setProcessos] = useState<Processo[]>([])
  const [demandas, setDemandas] = useState<Demanda[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let loaded = 0
    const done = () => { loaded++; if (loaded >= 3) setLoading(false) }
    const u1 = onSnapshot(query(collection(db, 'contratos')), (s) => {
      setContratos(s.docs.map((d) => ({ id: d.id, ...d.data() } as Contrato)))
      done()
    }, () => done())
    const u2 = onSnapshot(query(collection(db, 'processos')), (s) => {
      setProcessos(s.docs.map((d) => ({ id: d.id, ...d.data() } as Processo)))
      done()
    }, () => done())
    const u3 = onSnapshot(query(collection(db, 'demandas')), (s) => {
      setDemandas(s.docs.map((d) => ({ id: d.id, ...d.data() } as Demanda)))
      done()
    }, () => done())
    return () => { u1(); u2(); u3() }
  }, [])

  const stats = useMemo(() => {
    const contratosVencendo = contratos.filter((c) => {
      const d = daysUntil(c.vigenciaFim)
      return d >= 0 && d <= 30 && c.status !== 'rescindido'
    })
    const contratosVencendo60 = contratos.filter((c) => {
      const d = daysUntil(c.vigenciaFim)
      return d > 30 && d <= 60 && c.status !== 'rescindido'
    })
    const contratosVigentes = contratos.filter((c) => c.status === 'vigente').length
    const processosAtivos = processos.filter((c) => c.status === 'em_andamento').length
    const contingencia = processos.reduce((s, p) => s + (p.valorProvisionado || 0), 0)
    const demandasAbertas = demandas.filter((d) => d.status === 'aberta' || d.status === 'em_analise').length
    const demandasAlta = demandas.filter(
      (d) => d.urgencia === 'alta' && d.status !== 'concluida' && d.status !== 'arquivada'
    ).length

    const porStatusProcesso: Record<string, number> = {}
    processos.forEach((p) => {
      porStatusProcesso[p.status] = (porStatusProcesso[p.status] || 0) + 1
    })

    const porStatusDemanda: Record<string, number> = {}
    demandas.forEach((d) => {
      porStatusDemanda[d.status] = (porStatusDemanda[d.status] || 0) + 1
    })

    return {
      totalContratos: contratos.length,
      contratosVigentes,
      contratosVencendo,
      contratosVencendo60,
      processosAtivos,
      totalProcessos: processos.length,
      contingencia,
      demandasAbertas,
      demandasAlta,
      totalDemandas: demandas.length,
      porStatusProcesso,
      porStatusDemanda,
    }
  }, [contratos, processos, demandas])

  const processoChartData = Object.entries(stats.porStatusProcesso).map(([key, value]) => ({
    name: PROCESSO_STATUS_LABELS[key as ProcessoStatus] ?? key,
    value,
    key,
  }))

  const demandaChartData = Object.entries(stats.porStatusDemanda).map(([key, value]) => ({
    name: DEMANDA_STATUS_LABELS[key as DemandaStatus] ?? key,
    value,
    key,
  }))

  if (loading) {
    return <div className="empty-state">Carregando…</div>
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral do Jurídico · Grupo ETUS</p>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Contratos vigentes" value={stats.contratosVigentes} accent />
        <KpiCard label="Vencem em 30 dias" value={stats.contratosVencendo.length} trend="Atenção" />
        <KpiCard label="Processos ativos" value={stats.processosAtivos} />
        <KpiCard label="Contingência total" value={formatCurrency(stats.contingencia)} />
        <KpiCard label="Demandas abertas" value={stats.demandasAbertas} />
        <KpiCard label="Demandas urgentes" value={stats.demandasAlta} trend="Alta prioridade" />
      </div>

      {stats.contratosVencendo.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid var(--orange-600)' }}>
          <h3>⚠ Contratos vencendo nos próximos 30 dias</h3>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Parte contratada</th>
                  <th>Empresa</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {stats.contratosVencendo.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.parteContratadaNome}</td>
                    <td>{c.empresa}</td>
                    <td>{c.vigenciaFim}</td>
                    <td>{formatCurrency(c.valorTotal)}</td>
                    <td><Link to={`/contratos/${c.id}`} className="btn btn-sm btn-ghost">Ver</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="two-col" style={{ marginBottom: 20 }}>
        <div className="card">
          <h3>Processos por status</h3>
          {processoChartData.length > 0 ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={processoChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {processoChartData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#D6D4D1'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">Nenhum processo cadastrado.</div>
          )}
        </div>

        <div className="card">
          <h3>Demandas por status</h3>
          {demandaChartData.length > 0 ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={demandaChartData}>
                  <CartesianGrid stroke="#EBE9E5" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8DF768" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">Nenhuma demanda cadastrada.</div>
          )}
        </div>
      </div>

      {stats.contratosVencendo60.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Contratos vencendo em 31–60 dias</h3>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Parte contratada</th>
                  <th>Empresa</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {stats.contratosVencendo60.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.parteContratadaNome}</td>
                    <td>{c.empresa}</td>
                    <td>{c.vigenciaFim}</td>
                    <td><StatusBadge status={c.status} label={CONTRATO_STATUS_LABELS[c.status]} /></td>
                    <td><Link to={`/contratos/${c.id}`} className="btn btn-sm btn-ghost">Ver</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <h3>Últimas demandas</h3>
          {demandas.length > 0 ? (
            <div className="table-wrap" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Urgência</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {demandas.slice(0, 5).map((d) => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{d.titulo}</td>
                      <td><StatusBadge status={d.urgencia} label={DEMANDA_URGENCIA_LABELS[d.urgencia]} /></td>
                      <td><StatusBadge status={d.status} label={DEMANDA_STATUS_LABELS[d.status]} /></td>
                      <td><Link to={`/demandas/${d.id}`} className="btn btn-sm btn-ghost">Ver</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">Nenhuma demanda.</div>
          )}
        </div>

        <div className="card">
          <h3>Resumo rápido</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="muted">Total de contratos</span>
              <strong>{stats.totalContratos}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="muted">Total de processos</span>
              <strong>{stats.totalProcessos}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="muted">Total de demandas</span>
              <strong>{stats.totalDemandas}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span className="muted">Demandas urgentes</span>
              <strong style={{ color: stats.demandasAlta > 0 ? 'var(--red-600)' : undefined }}>{stats.demandasAlta}</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
