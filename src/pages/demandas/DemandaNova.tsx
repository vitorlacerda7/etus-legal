import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import type { DemandaTipo, DemandaUrgencia } from '../../types'
import { DEMANDA_TIPO_LABELS, DEMANDA_URGENCIA_LABELS, EMPRESAS } from '../../types'

export default function DemandaNova() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const contratoId = searchParams.get('contratoId') || ''

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [tipo, setTipo] = useState<DemandaTipo>('tarefa')
  const [urgencia, setUrgencia] = useState<DemandaUrgencia>('media')
  const [time, setTime] = useState('')

  // Campos comuns
  const [titulo, setTitulo] = useState('')

  // Elaboração de contrato
  const [parte1, setParte1] = useState('')
  const [parte2Descricao, setParte2Descricao] = useState('')
  const [objetoContrato, setObjetoContrato] = useState('')
  const [valorContrato, setValorContrato] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('')
  const [prazoPagamento, setPrazoPagamento] = useState('')
  const [reajusteValor, setReajusteValor] = useState('')
  const [obrigacoes, setObrigacoes] = useState('')
  const [observacoesElab, setObservacoesElab] = useState('')
  const [prazoAnalise, setPrazoAnalise] = useState('')

  // Análise de contrato
  const [observacoesAnalise, setObservacoesAnalise] = useState('')
  const [prazoAnaliseData, setPrazoAnaliseData] = useState('')

  // Tarefa / Consultoria
  const [descricaoTarefa, setDescricaoTarefa] = useState('')

  const [contratoRelacionadoId, setContratoRelacionadoId] = useState(contratoId)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !profile) return
    setError(null)
    setLoading(true)

    const { descricao, autoTitulo } = (() => {
      if (tipo === 'elaboracao_contrato') {
        return {
          autoTitulo: titulo || `Elaboração de contrato — ${parte2Descricao || 'N/I'}`,
          descricao: [
            `**Parte 1:** ${parte1}`,
            `**Parte 2 (Fornecedor/Parceiro):** ${parte2Descricao}`,
            `**Objeto:** ${objetoContrato}`,
            `**Valor:** ${valorContrato}`,
            `**Forma de pagamento:** ${formaPagamento}`,
            `**Prazo de pagamento:** ${prazoPagamento}`,
            `**Reajuste e Índice:** ${reajusteValor}`,
            `**Obrigações:** ${obrigacoes}`,
            `**Observações:** ${observacoesElab}`,
            `**Prazo de análise:** ${prazoAnalise}`,
          ].join('\n'),
        }
      }
      if (tipo === 'analise_contrato') {
        return {
          autoTitulo: titulo || `Análise de contrato — ${parte1 || 'N/I'}`,
          descricao: [
            `**Parte 1:** ${parte1}`,
            `**Prazo de análise:** ${prazoAnaliseData}`,
            `**Observações:** ${observacoesAnalise}`,
          ].join('\n'),
        }
      }
      return {
        autoTitulo: titulo || DEMANDA_TIPO_LABELS[tipo],
        descricao: descricaoTarefa,
      }
    })()

    try {
      await addDoc(collection(db, 'demandas'), {
        titulo: autoTitulo,
        tipo,
        descricao,
        urgencia,
        solicitanteUid: user.uid,
        solicitanteNome: profile.name,
        solicitanteTime: time,
        analistaAtribuidoUid: '',
        analistaAtribuidoNome: '',
        contratoRelacionadoId: contratoRelacionadoId || '',
        status: 'aberta',
        criadoEm: serverTimestamp(),
        concluidoEm: null,
        comentarios: [],
        parte1: tipo === 'elaboracao_contrato' || tipo === 'analise_contrato' ? parte1 : '',
        parte2Descricao: tipo === 'elaboracao_contrato' ? parte2Descricao : '',
        objetoContrato: tipo === 'elaboracao_contrato' ? objetoContrato : '',
        valorContrato: tipo === 'elaboracao_contrato' ? valorContrato : '',
        formaPagamento: tipo === 'elaboracao_contrato' ? formaPagamento : '',
        prazoPagamento: tipo === 'elaboracao_contrato' ? prazoPagamento : '',
        reajusteValor: tipo === 'elaboracao_contrato' ? reajusteValor : '',
        obrigacoes: tipo === 'elaboracao_contrato' ? obrigacoes : '',
        prazoAnalise: tipo === 'elaboracao_contrato' ? prazoAnalise : prazoAnaliseData,
        observacoesAnalise: tipo === 'analise_contrato' ? observacoesAnalise : '',
      })
      navigate(profile.role === 'solicitante' ? '/' : '/demandas')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar demanda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Nova Solicitação</h1>
          <p>Envie uma solicitação ao time Jurídico.</p>
        </div>
      </div>

      <div className="card">
        {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Tipo de solicitação */}
            <div className="field full">
              <label>Tipo de solicitação</label>
              <div className="radio-group">
                {(Object.entries(DEMANDA_TIPO_LABELS) as [DemandaTipo, string][]).map(([k, v]) => (
                  <label key={k} className={'radio-option' + (tipo === k ? ' selected' : '')}>
                    <input type="radio" name="tipo" value={k} checked={tipo === k} onChange={() => setTipo(k)} />
                    {v}
                  </label>
                ))}
              </div>
            </div>

            {/* Dados do solicitante */}
            <div className="field">
              <label>Nome do solicitante</label>
              <input value={profile?.name || ''} disabled style={{ opacity: 0.7 }} />
            </div>
            <div className="field">
              <label>Time do solicitante</label>
              <input value={time} onChange={(e) => setTime(e.target.value)} required placeholder="Ex.: Tecnologia, Comercial…" />
            </div>

            <div className="field">
              <label>Urgência</label>
              <div className="radio-group">
                {(Object.entries(DEMANDA_URGENCIA_LABELS) as [DemandaUrgencia, string][]).map(([k, v]) => (
                  <label key={k} className={'radio-option' + (urgencia === k ? ' selected' : '')}>
                    <input type="radio" name="urgencia" value={k} checked={urgencia === k} onChange={() => setUrgencia(k)} />
                    {v}
                  </label>
                ))}
              </div>
              <span className="hint">Alta: 2 dias úteis · Média: 5 dias úteis · Baixa: 10 dias úteis</span>
            </div>

            {/* ── Elaboração de contrato ── */}
            {tipo === 'elaboracao_contrato' && (
              <>
                <div className="field full" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <label style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Dados do contrato</label>
                </div>
                <div className="field">
                  <label>Parte 1 (Empresa do Grupo)</label>
                  <select value={parte1} onChange={(e) => setParte1(e.target.value)} required>
                    <option value="">Selecione…</option>
                    {EMPRESAS.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Parte 2 (Fornecedor, Parceiro, Afiliado etc.)</label>
                  <input value={parte2Descricao} onChange={(e) => setParte2Descricao(e.target.value)} required placeholder="Nome da empresa/pessoa" />
                  <span className="hint">Encaminhar o contrato social da empresa se possível</span>
                </div>
                <div className="field full">
                  <label>1 — Objeto (objetivo do contrato)</label>
                  <textarea value={objetoContrato} onChange={(e) => setObjetoContrato(e.target.value)} required placeholder="Descreva o objetivo do contrato…" />
                </div>
                <div className="field">
                  <label>2 — Valor</label>
                  <input value={valorContrato} onChange={(e) => setValorContrato(e.target.value)} required placeholder="Ex.: R$ 10.000,00" />
                </div>
                <div className="field">
                  <label>3 — Forma de pagamento</label>
                  <input value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} required placeholder="Ex.: Boleto, TED, PIX…" />
                </div>
                <div className="field">
                  <label>4 — Prazo de pagamento</label>
                  <input value={prazoPagamento} onChange={(e) => setPrazoPagamento(e.target.value)} required placeholder="Ex.: Mensal, até dia 15" />
                </div>
                <div className="field">
                  <label>5 — Reajuste do valor e Índice</label>
                  <input value={reajusteValor} onChange={(e) => setReajusteValor(e.target.value)} required placeholder="Ex.: IPCA anual" />
                </div>
                <div className="field full">
                  <label>6 — Obrigações específicas</label>
                  <textarea value={obrigacoes} onChange={(e) => setObrigacoes(e.target.value)} required placeholder="Confidencialidade, metas, etc." />
                </div>
                <div className="field full">
                  <label>7 — Outras observações</label>
                  <textarea value={observacoesElab} onChange={(e) => setObservacoesElab(e.target.value)} required />
                </div>
                <div className="field">
                  <label>9 — Prazo de análise</label>
                  <input value={prazoAnalise} onChange={(e) => setPrazoAnalise(e.target.value)} placeholder="O prazo máximo é de 04 dias úteis" />
                  <span className="hint">O prazo máximo de atendimento é de 04 dias úteis</span>
                </div>
              </>
            )}

            {/* ── Análise de contrato ── */}
            {tipo === 'analise_contrato' && (
              <>
                <div className="field full" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <label style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Dados para análise</label>
                </div>
                <div className="field">
                  <label>Parte 1 (Empresa do Grupo)</label>
                  <select value={parte1} onChange={(e) => setParte1(e.target.value)} required>
                    <option value="">Selecione…</option>
                    {EMPRESAS.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Prazo de análise</label>
                  <input type="date" value={prazoAnaliseData} onChange={(e) => setPrazoAnaliseData(e.target.value)} />
                  <span className="hint">O prazo máximo de atendimento é de 04 dias úteis</span>
                </div>
                <div className="field full">
                  <label>Observações</label>
                  <textarea value={observacoesAnalise} onChange={(e) => setObservacoesAnalise(e.target.value)} placeholder="Observações sobre a análise…" />
                </div>
              </>
            )}

            {/* ── Tarefa / Consultoria ── */}
            {(tipo === 'tarefa' || tipo === 'consultoria') && (
              <>
                <div className="field full" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <label style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                    {tipo === 'tarefa' ? 'Descrição da tarefa' : 'Dúvida / Consulta'}
                  </label>
                </div>
                <div className="field full">
                  <label>Título</label>
                  <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required placeholder={tipo === 'tarefa' ? 'Ex.: Registrar marca no INPI' : 'Ex.: Dúvida sobre cláusula de exclusividade'} />
                </div>
                <div className="field full">
                  <label>{tipo === 'tarefa' ? 'Descreva a tarefa para o time' : 'Descreva sua dúvida ou consulta'}</label>
                  <textarea
                    value={descricaoTarefa}
                    onChange={(e) => setDescricaoTarefa(e.target.value)}
                    required
                    placeholder="Descreva com detalhes…"
                    style={{ minHeight: 140 }}
                  />
                </div>
              </>
            )}

            {/* Contrato relacionado (opcional) */}
            <div className="field">
              <label>Contrato relacionado (ID, opcional)</label>
              <input value={contratoRelacionadoId} onChange={(e) => setContratoRelacionadoId(e.target.value)} placeholder="ID do contrato no sistema" />
            </div>
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar solicitação'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
