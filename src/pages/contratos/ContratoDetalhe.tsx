import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import type { Contrato, ContratoStatus } from '../../types'
import { CONTRATO_STATUS_LABELS, CONTRATO_TIPO_LABELS } from '../../types'
import { formatCurrency, formatDate, daysUntil } from '../../utils/format'

export default function ContratoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const isJuridico = profile?.role === 'juridico_lider' || profile?.role === 'juridico_analista'

  useEffect(() => {
    if (!id) return
    const unsub = onSnapshot(doc(db, 'contratos', id), (snap) => {
      if (snap.exists()) {
        setContrato({ id: snap.id, ...snap.data() } as Contrato)
      } else {
        setContrato(null)
      }
      setLoading(false)
    })
    return unsub
  }, [id])

  async function handleStatusChange(newStatus: ContratoStatus) {
    if (!id || updating) return
    setUpdating(true)
    try {
      await updateDoc(doc(db, 'contratos', id), { status: newStatus })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="empty-state">Carregando…</div>
  if (!contrato) return <div className="empty-state">Contrato não encontrado. <Link to="/contratos">Voltar</Link></div>

  const dias = daysUntil(contrato.vigenciaFim)

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{contrato.parteContratadaNome}</h1>
          <p>{CONTRATO_TIPO_LABELS[contrato.tipo]} · {contrato.empresa}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/contratos')}>← Voltar</button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="row-gap-16">
          <div className="card">
            <h3>Informações do contrato</h3>
            <div className="detail-meta">
              <div className="meta-item">
                <span className="meta-label">Status</span>
                <StatusBadge status={contrato.status} label={CONTRATO_STATUS_LABELS[contrato.status]} />
              </div>
              <div className="meta-item">
                <span className="meta-label">Valor total</span>
                <span className="meta-value">{formatCurrency(contrato.valorTotal)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">CNPJ / CPF</span>
                <span className="meta-value">{contrato.parteContratadaDocumento || '—'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Empresa</span>
                <span className="meta-value">{contrato.empresa}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Vigência início</span>
                <span className="meta-value">{contrato.vigenciaInicio}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Vigência fim</span>
                <span className="meta-value">
                  {contrato.vigenciaFim}
                  {dias >= 0 && dias <= 30 && (
                    <span style={{ marginLeft: 8, color: 'var(--red-600)', fontWeight: 600, fontSize: 12 }}>
                      Vence em {dias} dia{dias !== 1 ? 's' : ''}
                    </span>
                  )}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Criado em</span>
                <span className="meta-value">{formatDate(contrato.criadoEm)}</span>
              </div>
            </div>
          </div>

          {contrato.clausulasRelevantes && (
            <div className="card">
              <h3>Cláusulas relevantes</h3>
              <p style={{ fontSize: 14, whiteSpace: 'pre-wrap', color: 'var(--neutral-700)' }}>
                {contrato.clausulasRelevantes}
              </p>
            </div>
          )}

          {contrato.observacoes && (
            <div className="card">
              <h3>Observações internas</h3>
              <p style={{ fontSize: 14, whiteSpace: 'pre-wrap', color: 'var(--neutral-700)' }}>
                {contrato.observacoes}
              </p>
            </div>
          )}

          {contrato.tags && contrato.tags.length > 0 && (
            <div className="card">
              <h3>Tags</h3>
              <div className="tags-row">
                {contrato.tags.map((t, i) => (
                  <span key={i} className="tag">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="row-gap-16">
          {isJuridico && (
            <div className="card">
              <h3>Alterar status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(Object.keys(CONTRATO_STATUS_LABELS) as ContratoStatus[])
                  .filter((s) => s !== contrato.status)
                  .map((s) => (
                    <button
                      key={s}
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleStatusChange(s)}
                      disabled={updating}
                      style={{ justifyContent: 'flex-start' }}
                    >
                      → {CONTRATO_STATUS_LABELS[s]}
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3>Anexos</h3>
            {contrato.anexos && contrato.anexos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {contrato.anexos.map((a, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13 }}>{a.nome}</span>
                    <span className="muted" style={{ fontSize: 12 }}>v{a.versao}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ fontSize: 13 }}>Nenhum anexo.</p>
            )}
          </div>

          <div className="card">
            <h3>Ações</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to={`/demandas/nova?contratoId=${contrato.id}`} className="btn btn-sm btn-secondary">
                Solicitar revisão (abrir demanda)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
