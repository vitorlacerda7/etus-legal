import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import type { ContratoTipo } from '../../types'
import { CONTRATO_TIPO_LABELS, EMPRESAS } from '../../types'

export default function ContratoNovo() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [empresa, setEmpresa] = useState('')
  const [tipo, setTipo] = useState<ContratoTipo>('prestacao_servico')
  const [parteNome, setParteNome] = useState('')
  const [parteDoc, setParteDoc] = useState('')
  const [valor, setValor] = useState('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [clausulas, setClausulas] = useState('')
  const [tags, setTags] = useState('')
  const [observacoes, setObservacoes] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)
    setLoading(true)
    try {
      await addDoc(collection(db, 'contratos'), {
        empresa,
        tipo,
        parteContratadaNome: parteNome,
        parteContratadaDocumento: parteDoc,
        valorTotal: parseFloat(valor) || 0,
        vigenciaInicio: inicio,
        vigenciaFim: fim,
        clausulasRelevantes: clausulas,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        status: 'rascunho',
        criadoPorUid: user.uid,
        criadoEm: serverTimestamp(),
        anexos: [],
        observacoes,
      })
      navigate('/contratos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar contrato.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Novo Contrato</h1>
          <p>Cadastre um novo contrato no sistema.</p>
        </div>
      </div>

      <div className="card">
        {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>Empresa do grupo</label>
              <select value={empresa} onChange={(e) => setEmpresa(e.target.value)} required>
                <option value="">Selecione…</option>
                {EMPRESAS.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Tipo de contrato</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as ContratoTipo)}>
                {Object.entries(CONTRATO_TIPO_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Parte contratada (nome)</label>
              <input value={parteNome} onChange={(e) => setParteNome(e.target.value)} required />
            </div>
            <div className="field">
              <label>CNPJ / CPF</label>
              <input value={parteDoc} onChange={(e) => setParteDoc(e.target.value)} placeholder="00.000.000/0001-00" />
            </div>
            <div className="field">
              <label>Valor total (R$)</label>
              <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <div className="field">
              <label>Tags (separadas por vírgula)</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="mensal, marketing" />
            </div>
            <div className="field">
              <label>Vigência início</label>
              <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
            </div>
            <div className="field">
              <label>Vigência fim</label>
              <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} required />
            </div>
            <div className="field full">
              <label>Cláusulas relevantes</label>
              <textarea value={clausulas} onChange={(e) => setClausulas(e.target.value)} placeholder="Descreva as cláusulas principais…" />
            </div>
            <div className="field full">
              <label>Observações internas</label>
              <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando…' : 'Criar contrato'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/contratos')}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
