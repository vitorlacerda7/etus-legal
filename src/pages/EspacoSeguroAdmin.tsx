import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import type { EspacoSeguroRelato, EspacoSeguroStatus } from '../types'
import { ESPACO_SEGURO_STATUS_LABELS } from '../types'
import { formatDate } from '../utils/format'

export default function EspacoSeguroAdmin() {
  const [relatos, setRelatos] = useState<EspacoSeguroRelato[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<EspacoSeguroRelato | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'espacoSeguro'), orderBy('criadoEm', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setRelatos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as EspacoSeguroRelato)))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  async function handleStatusChange(id: string, newStatus: EspacoSeguroStatus) {
    setUpdating(true)
    try {
      await updateDoc(doc(db, 'espacoSeguro', id), { status: newStatus })
      if (selected && selected.id === id) {
        setSelected({ ...selected, status: newStatus })
      }
    } finally {
      setUpdating(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Espaço Seguro — Relatos</h1>
          <p>Canal de Compliance — visualização restrita ao Jurídico.</p>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Área</th>
              <th>Praticante</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="empty-state">Carregando…</td></tr>
            ) : relatos.length === 0 ? (
              <tr><td colSpan={6} className="empty-state">Nenhum relato registrado.</td></tr>
            ) : (
              relatos.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.criadoEm)}</td>
                  <td style={{ fontWeight: 600 }}>{r.tipoOcorrencia}</td>
                  <td>{r.areaEmpresa}</td>
                  <td>{r.nomePraticante}</td>
                  <td><StatusBadge status={r.status === 'pendente' ? 'aberto' : r.status === 'em_apuracao' ? 'em_tratamento' : 'encerrado'} label={ESPACO_SEGURO_STATUS_LABELS[r.status]} /></td>
                  <td><button className="btn btn-sm btn-ghost" onClick={() => setSelected(r)}>Ver</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <Modal title="Detalhe do relato" onClose={() => setSelected(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Relator</span>
              <p style={{ margin: '2px 0', fontSize: 14 }}>{selected.nomeRelator || 'Anônimo'}</p>
            </div>
            <div>
              <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Ocorreu com</span>
              <p style={{ margin: '2px 0', fontSize: 14 }}>{selected.ocorreuComQuem}</p>
            </div>
            <div>
              <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Tipo</span>
              <p style={{ margin: '2px 0', fontSize: 14 }}>{selected.tipoOcorrencia}</p>
            </div>
            <div>
              <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Data / Período</span>
              <p style={{ margin: '2px 0', fontSize: 14 }}>{selected.dataOcorrencia || selected.sabeData} · {selected.parteDoDia || '—'}</p>
            </div>
            <div>
              <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Área</span>
              <p style={{ margin: '2px 0', fontSize: 14 }}>{selected.areaEmpresa}</p>
            </div>
            <div>
              <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Praticante(s)</span>
              <p style={{ margin: '2px 0', fontSize: 14 }}>{selected.nomePraticante}</p>
            </div>
            <div>
              <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Testemunhas</span>
              <p style={{ margin: '2px 0', fontSize: 14 }}>{selected.testemunhas}</p>
            </div>
            <div>
              <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Descrição</span>
              <p style={{ margin: '2px 0', fontSize: 14, whiteSpace: 'pre-wrap' }}>{selected.descricao}</p>
            </div>
            {selected.informacoesAdicionais && (
              <div>
                <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Informações adicionais</span>
                <p style={{ margin: '2px 0', fontSize: 14, whiteSpace: 'pre-wrap' }}>{selected.informacoesAdicionais}</p>
              </div>
            )}
            <div className="divider" />
            <div>
              <span className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Alterar status</span>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {(Object.keys(ESPACO_SEGURO_STATUS_LABELS) as EspacoSeguroStatus[]).map((s) => (
                  <button
                    key={s}
                    className={`btn btn-sm ${selected.status === s ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleStatusChange(selected.id, s)}
                    disabled={updating}
                  >
                    {ESPACO_SEGURO_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setSelected(null)}>Fechar</button>
          </div>
        </Modal>
      )}
    </>
  )
}
