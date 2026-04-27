import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, onSnapshot, updateDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import type { Demanda, DemandaStatus, Comentario, UserProfile } from '../../types'
import {
  DEMANDA_STATUS_LABELS,
  DEMANDA_TIPO_LABELS,
  DEMANDA_URGENCIA_LABELS,
  SLA_DIAS,
} from '../../types'
import { formatDate, businessDaysSince } from '../../utils/format'

export default function DemandaDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [demanda, setDemanda] = useState<Demanda | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [comentario, setComentario] = useState('')
  const [analistas, setAnalistas] = useState<UserProfile[]>([])

  const isLider = profile?.role === 'juridico_lider'
  const isJuridico = profile?.role === 'juridico_lider' || profile?.role === 'juridico_analista'

  useEffect(() => {
    if (!id) return
    const unsub = onSnapshot(doc(db, 'demandas', id), (snap) => {
      if (snap.exists()) {
        setDemanda({ id: snap.id, ...snap.data() } as Demanda)
      } else {
        setDemanda(null)
      }
      setLoading(false)
    })
    return unsub
  }, [id])

  useEffect(() => {
    if (!isLider) return
    getDocs(collection(db, 'users')).then((snap) => {
      const users = snap.docs
        .map((d) => ({ uid: d.id, ...d.data() } as UserProfile))
        .filter((u) => u.role === 'juridico_analista' || u.role === 'juridico_lider')
      setAnalistas(users)
    })
  }, [isLider])

  async function handleStatusChange(newStatus: DemandaStatus) {
    if (!id || updating) return
    setUpdating(true)
    try {
      const updates: Record<string, unknown> = { status: newStatus }
      if (newStatus === 'concluida') updates.concluidoEm = serverTimestamp()
      await updateDoc(doc(db, 'demandas', id), updates)
    } finally {
      setUpdating(false)
    }
  }

  async function handleAtribuir(uid: string) {
    if (!id || updating) return
    const analista = analistas.find((a) => a.uid === uid)
    setUpdating(true)
    try {
      await updateDoc(doc(db, 'demandas', id), {
        analistaAtribuidoUid: uid,
        analistaAtribuidoNome: analista?.name || '',
        status: 'em_analise',
      })
    } finally {
      setUpdating(false)
    }
  }

  async function handleAddComentario(e: FormEvent) {
    e.preventDefault()
    if (!id || !demanda || !user || !profile || !comentario.trim()) return
    setUpdating(true)
    try {
      const newComment: Comentario = {
        autorUid: user.uid,
        autorNome: profile.name,
        texto: comentario.trim(),
        criadoEm: serverTimestamp() as Comentario['criadoEm'],
      }
      await updateDoc(doc(db, 'demandas', id), {
        comentarios: [...(demanda.comentarios || []), newComment],
      })
      setComentario('')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="empty-state">Carregando…</div>
  if (!demanda) return <div className="empty-state">Demanda não encontrada. <Link to="/demandas">Voltar</Link></div>

  const diasUteis = businessDaysSince(demanda.criadoEm)
  const slaLimit = SLA_DIAS[demanda.urgencia]
  const slaStatus = demanda.status === 'concluida' || demanda.status === 'arquivada'
    ? 'ok'
    : diasUteis > slaLimit
      ? 'bad'
      : diasUteis > slaLimit * 0.7
        ? 'warn'
        : 'ok'

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{demanda.titulo}</h1>
          <p>{DEMANDA_TIPO_LABELS[demanda.tipo]} · Urgência {DEMANDA_URGENCIA_LABELS[demanda.urgencia]}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Voltar</button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="row-gap-16">
          <div className={`card sla-${slaStatus}`}>
            <h3>Informações da demanda</h3>
            <div className="detail-meta">
              <div className="meta-item">
                <span className="meta-label">Status</span>
                <StatusBadge status={demanda.status} label={DEMANDA_STATUS_LABELS[demanda.status]} />
              </div>
              <div className="meta-item">
                <span className="meta-label">Urgência</span>
                <StatusBadge status={demanda.urgencia} label={DEMANDA_URGENCIA_LABELS[demanda.urgencia]} />
              </div>
              <div className="meta-item">
                <span className="meta-label">Solicitante</span>
                <span className="meta-value">{demanda.solicitanteNome}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Analista</span>
                <span className="meta-value">{demanda.analistaAtribuidoNome || 'Não atribuído'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Criada em</span>
                <span className="meta-value">{formatDate(demanda.criadoEm)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">SLA</span>
                <span className="meta-value">
                  {diasUteis} / {slaLimit} dias úteis
                  {slaStatus === 'bad' && <span style={{ color: 'var(--red-600)', marginLeft: 6, fontWeight: 700 }}>FORA DO SLA</span>}
                </span>
              </div>
              {demanda.contratoRelacionadoId && (
                <div className="meta-item">
                  <span className="meta-label">Contrato relacionado</span>
                  <Link to={`/contratos/${demanda.contratoRelacionadoId}`} className="meta-value">
                    Ver contrato →
                  </Link>
                </div>
              )}
              {demanda.concluidoEm && (
                <div className="meta-item">
                  <span className="meta-label">Concluída em</span>
                  <span className="meta-value">{formatDate(demanda.concluidoEm)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3>Descrição</h3>
            <p style={{ fontSize: 14, whiteSpace: 'pre-wrap', color: 'var(--neutral-700)', lineHeight: 1.6 }}>
              {demanda.descricao}
            </p>
          </div>

          <div className="card">
            <h3>Comentários ({(demanda.comentarios || []).length})</h3>
            <div className="comment-list">
              {(demanda.comentarios || []).map((c, i) => (
                <div key={i} className="comment">
                  <div className="comment-header">
                    <span className="comment-author">{c.autorNome}</span>
                    <span className="comment-date">{formatDate(c.criadoEm)}</span>
                  </div>
                  <div className="comment-text">{c.texto}</div>
                </div>
              ))}
              {(demanda.comentarios || []).length === 0 && (
                <p className="muted" style={{ fontSize: 13 }}>Nenhum comentário ainda.</p>
              )}
            </div>
            <form onSubmit={handleAddComentario} className="comment-input">
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Escreva um comentário…"
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={updating || !comentario.trim()}>
                Enviar
              </button>
            </form>
          </div>
        </div>

        <div className="row-gap-16">
          {isJuridico && (
            <div className="card">
              <h3>Alterar status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(Object.keys(DEMANDA_STATUS_LABELS) as DemandaStatus[])
                  .filter((s) => s !== demanda.status)
                  .map((s) => (
                    <button
                      key={s}
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleStatusChange(s)}
                      disabled={updating}
                      style={{ justifyContent: 'flex-start' }}
                    >
                      → {DEMANDA_STATUS_LABELS[s]}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {isLider && (
            <div className="card">
              <h3>Atribuir analista</h3>
              {analistas.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {analistas.map((a) => (
                    <button
                      key={a.uid}
                      className={`btn btn-sm ${demanda.analistaAtribuidoUid === a.uid ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleAtribuir(a.uid)}
                      disabled={updating}
                      style={{ justifyContent: 'flex-start' }}
                    >
                      {a.name}
                      {demanda.analistaAtribuidoUid === a.uid && ' (atual)'}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="muted" style={{ fontSize: 13 }}>Nenhum analista cadastrado.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
