import { useEffect, useState, type FormEvent } from 'react'
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import type { IncidenteLgpd, IncidenteStatus, IncidenteTipo, InventarioDados, BaseLegal, TemplateLgpd } from '../../types'
import { INCIDENTE_TIPO_LABELS, INCIDENTE_STATUS_LABELS, BASE_LEGAL_LABELS } from '../../types'

type Tab = 'incidentes' | 'inventario' | 'templates'

export default function LgpdPage() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState<Tab>('incidentes')

  // Incidentes
  const [incidentes, setIncidentes] = useState<IncidenteLgpd[]>([])
  const [showIncModal, setShowIncModal] = useState(false)
  const [incData, setIncData] = useState('')
  const [incTipo, setIncTipo] = useState<IncidenteTipo>('vazamento')
  const [incDesc, setIncDesc] = useState('')
  const [incDados, setIncDados] = useState('')
  const [incAcao, setIncAcao] = useState('')

  // Inventário
  const [inventario, setInventario] = useState<InventarioDados[]>([])
  const [showInvModal, setShowInvModal] = useState(false)
  const [invSistema, setInvSistema] = useState('')
  const [invFinalidade, setInvFinalidade] = useState('')
  const [invBaseLegal, setInvBaseLegal] = useState<BaseLegal>('consentimento')
  const [invPrazo, setInvPrazo] = useState('')

  // Templates
  const [templates, setTemplates] = useState<TemplateLgpd[]>([])
  const [showTplModal, setShowTplModal] = useState(false)
  const [tplTitulo, setTplTitulo] = useState('')
  const [tplCorpo, setTplCorpo] = useState('')
  const [editingTplId, setEditingTplId] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let loaded = 0
    const done = () => { loaded++; if (loaded >= 3) setLoading(false) }

    const u1 = onSnapshot(query(collection(db, 'incidentesLgpd'), orderBy('criadoEm', 'desc')), (s) => {
      setIncidentes(s.docs.map((d) => ({ id: d.id, ...d.data() } as IncidenteLgpd)))
      done()
    }, () => done())

    const u2 = onSnapshot(query(collection(db, 'inventarioDados')), (s) => {
      setInventario(s.docs.map((d) => ({ id: d.id, ...d.data() } as InventarioDados)))
      done()
    }, () => done())

    const u3 = onSnapshot(query(collection(db, 'templatesLgpd')), (s) => {
      setTemplates(s.docs.map((d) => ({ id: d.id, ...d.data() } as TemplateLgpd)))
      done()
    }, () => done())

    return () => { u1(); u2(); u3() }
  }, [])

  async function handleAddIncidente(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await addDoc(collection(db, 'incidentesLgpd'), {
        data: incData,
        tipo: incTipo,
        descricao: incDesc,
        dadosEnvolvidos: incDados,
        acaoTomada: incAcao,
        status: 'aberto',
        criadoEm: serverTimestamp(),
      })
      setShowIncModal(false)
      setIncData(''); setIncDesc(''); setIncDados(''); setIncAcao('')
    } finally { setSaving(false) }
  }

  async function handleIncidenteStatus(id: string, status: IncidenteStatus) {
    await updateDoc(doc(db, 'incidentesLgpd', id), { status })
  }

  async function handleAddInventario(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'inventarioDados'), {
        sistema: invSistema,
        finalidade: invFinalidade,
        baseLegal: invBaseLegal,
        prazoRetencao: invPrazo,
        responsavelUid: user.uid,
        responsavelNome: profile?.name || '',
      })
      setShowInvModal(false)
      setInvSistema(''); setInvFinalidade(''); setInvPrazo('')
    } finally { setSaving(false) }
  }

  async function handleSaveTemplate(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingTplId) {
        await updateDoc(doc(db, 'templatesLgpd', editingTplId), {
          titulo: tplTitulo,
          corpoMarkdown: tplCorpo,
          atualizadoEm: serverTimestamp(),
        })
      } else {
        await addDoc(collection(db, 'templatesLgpd'), {
          titulo: tplTitulo,
          corpoMarkdown: tplCorpo,
          atualizadoEm: serverTimestamp(),
        })
      }
      setShowTplModal(false)
      setTplTitulo(''); setTplCorpo(''); setEditingTplId(null)
    } finally { setSaving(false) }
  }

  async function handleDeleteTemplate(id: string) {
    if (confirm('Excluir este template?')) {
      await deleteDoc(doc(db, 'templatesLgpd', id))
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>LGPD / Compliance</h1>
          <p>Gestão de incidentes, inventário de dados e templates de resposta.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {([
          ['incidentes', 'Incidentes'],
          ['inventario', 'Inventário de Dados'],
          ['templates', 'Templates de Resposta'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            className={`btn btn-sm ${tab === key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <div className="empty-state">Carregando…</div>}

      {/* ── Incidentes ── */}
      {!loading && tab === 'incidentes' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowIncModal(true)}>+ Novo incidente</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {incidentes.length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">Nenhum incidente.</td></tr>
                ) : incidentes.map((i) => (
                  <tr key={i.id}>
                    <td>{i.data}</td>
                    <td>{INCIDENTE_TIPO_LABELS[i.tipo]}</td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.descricao}</td>
                    <td><StatusBadge status={i.status === 'aberto' ? 'aberto' : i.status === 'em_tratamento' ? 'em_tratamento' : 'encerrado'} label={INCIDENTE_STATUS_LABELS[i.status]} /></td>
                    <td className="actions">
                      <select
                        value={i.status}
                        onChange={(e) => handleIncidenteStatus(i.id, e.target.value as IncidenteStatus)}
                        style={{ fontSize: 12, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border)' }}
                      >
                        {Object.entries(INCIDENTE_STATUS_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {showIncModal && (
            <Modal title="Novo incidente LGPD" onClose={() => setShowIncModal(false)}>
              <form onSubmit={handleAddIncidente}>
                <div className="form-grid">
                  <div className="field"><label>Data</label><input type="date" value={incData} onChange={(e) => setIncData(e.target.value)} required /></div>
                  <div className="field">
                    <label>Tipo</label>
                    <select value={incTipo} onChange={(e) => setIncTipo(e.target.value as IncidenteTipo)}>
                      {Object.entries(INCIDENTE_TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="field full"><label>Descrição</label><textarea value={incDesc} onChange={(e) => setIncDesc(e.target.value)} required /></div>
                  <div className="field full"><label>Dados envolvidos</label><textarea value={incDados} onChange={(e) => setIncDados(e.target.value)} required /></div>
                  <div className="field full"><label>Ação tomada</label><textarea value={incAcao} onChange={(e) => setIncAcao(e.target.value)} /></div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowIncModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando…' : 'Criar'}</button>
                </div>
              </form>
            </Modal>
          )}
        </>
      )}

      {/* ── Inventário ── */}
      {!loading && tab === 'inventario' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowInvModal(true)}>+ Novo registro</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Sistema</th><th>Finalidade</th><th>Base legal</th><th>Retenção</th><th>Responsável</th></tr>
              </thead>
              <tbody>
                {inventario.length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">Nenhum registro.</td></tr>
                ) : inventario.map((i) => (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 600 }}>{i.sistema}</td>
                    <td>{i.finalidade}</td>
                    <td>{BASE_LEGAL_LABELS[i.baseLegal]}</td>
                    <td>{i.prazoRetencao}</td>
                    <td>{i.responsavelNome || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {showInvModal && (
            <Modal title="Novo registro de dados" onClose={() => setShowInvModal(false)}>
              <form onSubmit={handleAddInventario}>
                <div className="form-grid">
                  <div className="field"><label>Sistema / Fornecedor</label><input value={invSistema} onChange={(e) => setInvSistema(e.target.value)} required /></div>
                  <div className="field"><label>Finalidade</label><input value={invFinalidade} onChange={(e) => setInvFinalidade(e.target.value)} required /></div>
                  <div className="field">
                    <label>Base legal</label>
                    <select value={invBaseLegal} onChange={(e) => setInvBaseLegal(e.target.value as BaseLegal)}>
                      {Object.entries(BASE_LEGAL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="field"><label>Prazo de retenção</label><input value={invPrazo} onChange={(e) => setInvPrazo(e.target.value)} required placeholder="Ex.: 5 anos" /></div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowInvModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando…' : 'Criar'}</button>
                </div>
              </form>
            </Modal>
          )}
        </>
      )}

      {/* ── Templates ── */}
      {!loading && tab === 'templates' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => { setEditingTplId(null); setTplTitulo(''); setTplCorpo(''); setShowTplModal(true) }}>+ Novo template</button>
          </div>
          <div className="row-gap-16">
            {templates.length === 0 ? (
              <div className="empty-state">Nenhum template.</div>
            ) : templates.map((t) => (
              <div key={t.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3>{t.titulo}</h3>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => { setEditingTplId(t.id); setTplTitulo(t.titulo); setTplCorpo(t.corpoMarkdown); setShowTplModal(true) }}>Editar</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteTemplate(t.id)}>Excluir</button>
                  </div>
                </div>
                <pre style={{ fontSize: 13, whiteSpace: 'pre-wrap', color: 'var(--neutral-700)', marginTop: 8, background: 'var(--neutral-50)', padding: 12, borderRadius: 10 }}>{t.corpoMarkdown}</pre>
              </div>
            ))}
          </div>
          {showTplModal && (
            <Modal title={editingTplId ? 'Editar template' : 'Novo template'} onClose={() => setShowTplModal(false)}>
              <form onSubmit={handleSaveTemplate}>
                <div className="form-grid">
                  <div className="field full"><label>Título</label><input value={tplTitulo} onChange={(e) => setTplTitulo(e.target.value)} required /></div>
                  <div className="field full"><label>Corpo (markdown)</label><textarea value={tplCorpo} onChange={(e) => setTplCorpo(e.target.value)} required style={{ minHeight: 200, fontFamily: 'monospace' }} /></div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowTplModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando…' : editingTplId ? 'Salvar' : 'Criar'}</button>
                </div>
              </form>
            </Modal>
          )}
        </>
      )}
    </>
  )
}
