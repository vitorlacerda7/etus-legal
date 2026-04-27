import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import type { Processo, ProcessoStatus, Movimentacao } from '../../types'
import { PROCESSO_STATUS_LABELS, PROCESSO_AREA_LABELS } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'

export default function ProcessoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [processo, setProcesso] = useState<Processo | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showMovModal, setShowMovModal] = useState(false)

  const [movData, setMovData] = useState('')
  const [movTipo, setMovTipo] = useState('')
  const [movDesc, setMovDesc] = useState('')

  const isJuridico = profile?.role === 'juridico_lider' || profile?.role === 'juridico_analista'

  useEffect(() => {
    if (!id) return
    const unsub = onSnapshot(doc(db, 'processos', id), (snap) => {
      if (snap.exists()) {
        setProcesso({ id: snap.id, ...snap.data() } as Processo)
      } else {
        setProcesso(null)
      }
      setLoading(false)
    })
    return unsub
  }, [id])

  async function handleStatusChange(newStatus: ProcessoStatus) {
    if (!id || updating) return
    setUpdating(true)
    try {
      await updateDoc(doc(db, 'processos', id), { status: newStatus })
    } finally {
      setUpdating(false)
    }
  }

  async function handleAddMovimentacao(e: FormEvent) {
    e.preventDefault()
    if (!id || !processo) return
    setUpdating(true)
    try {
      const newMov: Movimentacao = {
        data: movData,
        tipo: movTipo,
        descricao: movDesc,
      }
      await updateDoc(doc(db, 'processos', id), {
        movimentacoes: [...(processo.movimentacoes || []), newMov],
      })
      setShowMovModal(false)
      setMovData('')
      setMovTipo('')
      setMovDesc('')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="empty-state">Carregando…</div>
  if (!processo) return <div className="empty-state">Processo não encontrado. <Link to="/processos">Voltar</Link></div>

  const movimentacoes = [...(processo.movimentacoes || [])].sort(
    (a, b) => (b.data || '').localeCompare(a.data || ''),
  )

  return (
    <>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'monospace', fontSize: 22 }}>{processo.numeroCnj}</h1>
          <p>{PROCESSO_AREA_LABELS[processo.area]} · {processo.empresa}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/processos')}>← Voltar</button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="row-gap-16">
          <div className="card">
            <h3>Informações do processo</h3>
            <div className="detail-meta">
              <div className="meta-item">
                <span className="meta-label">Status</span>
                <StatusBadge status={processo.status} label={PROCESSO_STATUS_LABELS[processo.status]} />
              </div>
              <div className="meta-item">
                <span className="meta-label">Área</span>
                <span className="meta-value">{PROCESSO_AREA_LABELS[processo.area]}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Vara</span>
                <span className="meta-value">{processo.vara}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Comarca</span>
                <span className="meta-value">{processo.comarca}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Autor</span>
                <span className="meta-value">{processo.autorNome}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Réu</span>
                <span className="meta-value">{processo.reuNome}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Valor da causa</span>
                <span className="meta-value">{formatCurrency(processo.valorCausa)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Valor provisionado</span>
                <span className="meta-value">{formatCurrency(processo.valorProvisionado)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Advogado responsável</span>
                <span className="meta-value">{processo.advogadoResponsavelNome || '—'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Criado em</span>
                <span className="meta-value">{formatDate(processo.criadoEm)}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ marginBottom: 0 }}>Movimentações</h3>
              {isJuridico && (
                <button className="btn btn-sm btn-secondary" onClick={() => setShowMovModal(true)}>
                  + Movimentação
                </button>
              )}
            </div>
            {movimentacoes.length > 0 ? (
              <div className="timeline">
                {movimentacoes.map((m, i) => (
                  <div key={i} className="timeline-item">
                    <div className="tl-date">{m.data}</div>
                    <div className="tl-tipo">{m.tipo}</div>
                    <div className="tl-desc">{m.descricao}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ fontSize: 13 }}>Nenhuma movimentação registrada.</p>
            )}
          </div>
        </div>

        <div className="row-gap-16">
          {isJuridico && (
            <div className="card">
              <h3>Alterar status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(Object.keys(PROCESSO_STATUS_LABELS) as ProcessoStatus[])
                  .filter((s) => s !== processo.status)
                  .map((s) => (
                    <button
                      key={s}
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleStatusChange(s)}
                      disabled={updating}
                      style={{ justifyContent: 'flex-start' }}
                    >
                      → {PROCESSO_STATUS_LABELS[s]}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showMovModal && (
        <Modal title="Nova movimentação" onClose={() => setShowMovModal(false)}>
          <form onSubmit={handleAddMovimentacao}>
            <div className="form-grid">
              <div className="field">
                <label>Data</label>
                <input type="date" value={movData} onChange={(e) => setMovData(e.target.value)} required />
              </div>
              <div className="field">
                <label>Tipo</label>
                <input value={movTipo} onChange={(e) => setMovTipo(e.target.value)} required placeholder="Ex.: Audiência, Despacho, Sentença" />
              </div>
              <div className="field full">
                <label>Descrição</label>
                <textarea value={movDesc} onChange={(e) => setMovDesc(e.target.value)} required />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowMovModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={updating}>
                {updating ? 'Salvando…' : 'Adicionar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
