import { useState, type FormEvent } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { ESPACO_SEGURO_TIPOS, AREAS_EMPRESA } from '../types'

export default function EspacoSeguro() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [ocorreuCom, setOcorreuCom] = useState('')
  const [tipoOcorrencia, setTipoOcorrencia] = useState('')
  const [sabeData, setSabeData] = useState('')
  const [dataOcorrencia, setDataOcorrencia] = useState('')
  const [parteDoDia, setParteDoDia] = useState('')
  const [areaEmpresa, setAreaEmpresa] = useState('')
  const [nomePraticante, setNomePraticante] = useState('')
  const [testemunhas, setTestemunhas] = useState('')
  const [descricao, setDescricao] = useState('')
  const [informacoesAdicionais, setInformacoesAdicionais] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await addDoc(collection(db, 'espacoSeguro'), {
        nomeRelator: nome || null,
        ocorreuComQuem: ocorreuCom,
        tipoOcorrencia,
        sabeData,
        dataOcorrencia: dataOcorrencia || null,
        parteDoDia: parteDoDia || null,
        areaEmpresa,
        nomePraticante,
        testemunhas,
        descricao,
        informacoesAdicionais: informacoesAdicionais || null,
        status: 'pendente',
        criadoEm: serverTimestamp(),
        respostaCompliance: '',
      })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar relato.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>◈</div>
          <h2 style={{ marginBottom: 12 }}>Relato enviado com sucesso</h2>
          <p className="muted">
            Seu relato foi recebido pelo time de Compliance com total sigilo.
            Agradecemos sua coragem em compartilhar. A situação será apurada com
            o máximo cuidado.
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 24 }}
            onClick={() => {
              setSuccess(false)
              setNome('')
              setOcorreuCom('')
              setTipoOcorrencia('')
              setSabeData('')
              setDataOcorrencia('')
              setParteDoDia('')
              setAreaEmpresa('')
              setNomePraticante('')
              setTestemunhas('')
              setDescricao('')
              setInformacoesAdicionais('')
            }}
          >
            Enviar outro relato
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Espaço Seguro</h1>
          <p>Canal de comunicação direta com o Compliance, com garantia de sigilo.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 700 }}>
        <p style={{ fontSize: 14, color: 'var(--neutral-500)', marginBottom: 20, lineHeight: 1.6 }}>
          Se algo aconteceu, relate para que possa ser verificado e dado o melhor tratamento possível.
          Seu nome é opcional — o sigilo da autoria é garantido.
        </p>

        {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field full">
              <label>Seu nome (não obrigatório)</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Preencha apenas se desejar se identificar" />
            </div>

            <div className="field full">
              <label>A situação ocorreu com quem? *</label>
              <div className="radio-group">
                {['Comigo', 'Com outra(s) pessoa(s)', 'Comigo e com outras pessoas'].map((opt) => (
                  <label key={opt} className={'radio-option' + (ocorreuCom === opt ? ' selected' : '')}>
                    <input type="radio" name="ocorreuCom" value={opt} checked={ocorreuCom === opt} onChange={() => setOcorreuCom(opt)} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div className="field full">
              <label>O que ocorreu? *</label>
              <select value={tipoOcorrencia} onChange={(e) => setTipoOcorrencia(e.target.value)} required>
                <option value="">Selecione…</option>
                {ESPACO_SEGURO_TIPOS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Sabe informar o dia que ocorreu? *</label>
              <div className="radio-group">
                {['Sim', 'Não tenho certeza', 'Problema recorrente'].map((opt) => (
                  <label key={opt} className={'radio-option' + (sabeData === opt ? ' selected' : '')}>
                    <input type="radio" name="sabeData" value={opt} checked={sabeData === opt} onChange={() => setSabeData(opt)} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            {sabeData === 'Sim' && (
              <div className="field">
                <label>Data da ocorrência</label>
                <input type="date" value={dataOcorrencia} onChange={(e) => setDataOcorrencia(e.target.value)} />
              </div>
            )}

            <div className="field">
              <label>Em que parte do dia ocorreu?</label>
              <div className="radio-group">
                {['Manhã', 'Tarde', 'Noite', 'Não tenho certeza', 'Problema recorrente'].map((opt) => (
                  <label key={opt} className={'radio-option' + (parteDoDia === opt ? ' selected' : '')}>
                    <input type="radio" name="parteDoDia" value={opt} checked={parteDoDia === opt} onChange={() => setParteDoDia(opt)} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Em que área da empresa a pessoa trabalha? *</label>
              <select value={areaEmpresa} onChange={(e) => setAreaEmpresa(e.target.value)} required>
                <option value="">Selecione…</option>
                {AREAS_EMPRESA.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div className="field full">
              <label>Nome da(s) pessoa(s) que praticou(aram) o ocorrido *</label>
              <input value={nomePraticante} onChange={(e) => setNomePraticante(e.target.value)} required />
            </div>

            <div className="field full">
              <label>Alguém mais presenciou o ocorrido? Quem? *</label>
              <input value={testemunhas} onChange={(e) => setTestemunhas(e.target.value)} required />
            </div>

            <div className="field full">
              <label>Descrever o ocorrido</label>
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} style={{ minHeight: 140 }} placeholder="Descreva o ocorrido com o máximo de detalhes…" />
            </div>

            <div className="field full">
              <label>Quer acrescentar mais alguma informação?</label>
              <textarea value={informacoesAdicionais} onChange={(e) => setInformacoesAdicionais(e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar relato'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
