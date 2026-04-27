import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import type { ProcessoArea } from '../../types'
import { PROCESSO_AREA_LABELS, EMPRESAS } from '../../types'

export default function ProcessoNovo() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [numeroCnj, setNumeroCnj] = useState('')
  const [vara, setVara] = useState('')
  const [comarca, setComarca] = useState('')
  const [area, setArea] = useState<ProcessoArea>('civel')
  const [empresa, setEmpresa] = useState('')
  const [autorNome, setAutorNome] = useState('')
  const [reuNome, setReuNome] = useState('')
  const [valorCausa, setValorCausa] = useState('')
  const [valorProvisionado, setValorProvisionado] = useState('')
  const [advogadoNome, setAdvogadoNome] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)
    setLoading(true)
    try {
      await addDoc(collection(db, 'processos'), {
        numeroCnj,
        vara,
        comarca,
        area,
        empresa,
        autorNome,
        reuNome,
        status: 'em_andamento',
        valorCausa: parseFloat(valorCausa) || 0,
        valorProvisionado: parseFloat(valorProvisionado) || 0,
        advogadoResponsavelUid: user.uid,
        advogadoResponsavelNome: advogadoNome || user.displayName || '',
        criadoEm: serverTimestamp(),
        movimentacoes: [],
      })
      navigate('/processos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar processo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Novo Processo Judicial</h1>
          <p>Cadastre um novo processo no sistema.</p>
        </div>
      </div>

      <div className="card">
        {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>Número CNJ</label>
              <input value={numeroCnj} onChange={(e) => setNumeroCnj(e.target.value)} placeholder="0000000-00.0000.0.00.0000" required />
            </div>
            <div className="field">
              <label>Área</label>
              <select value={area} onChange={(e) => setArea(e.target.value as ProcessoArea)}>
                {Object.entries(PROCESSO_AREA_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Vara</label>
              <input value={vara} onChange={(e) => setVara(e.target.value)} required />
            </div>
            <div className="field">
              <label>Comarca</label>
              <input value={comarca} onChange={(e) => setComarca(e.target.value)} required />
            </div>
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
              <label>Advogado responsável</label>
              <input value={advogadoNome} onChange={(e) => setAdvogadoNome(e.target.value)} />
            </div>
            <div className="field">
              <label>Autor</label>
              <input value={autorNome} onChange={(e) => setAutorNome(e.target.value)} required />
            </div>
            <div className="field">
              <label>Réu</label>
              <input value={reuNome} onChange={(e) => setReuNome(e.target.value)} required />
            </div>
            <div className="field">
              <label>Valor da causa (R$)</label>
              <input type="number" step="0.01" value={valorCausa} onChange={(e) => setValorCausa(e.target.value)} />
            </div>
            <div className="field">
              <label>Valor provisionado (R$)</label>
              <input type="number" step="0.01" value={valorProvisionado} onChange={(e) => setValorProvisionado(e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando…' : 'Criar processo'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/processos')}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
