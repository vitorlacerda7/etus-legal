import type { Timestamp } from 'firebase/firestore'

/* ── Roles ── */
export type Role = 'juridico_lider' | 'juridico_analista' | 'solicitante'

export const ROLE_LABELS: Record<Role, string> = {
  juridico_lider: 'Líder Jurídico',
  juridico_analista: 'Analista Jurídico',
  solicitante: 'Solicitante',
}

/* ── User ── */
export interface UserProfile {
  uid: string
  email: string
  name: string
  role: Role
  empresa?: string
  createdAt?: Timestamp
}

/* ── Empresas do Grupo (conforme formulários reais) ── */
export const EMPRESAS = [
  'ETUS Media Holding Ltda.',
  'Plusdin Tecnologia e Informação Ltda.',
  'BRAZ Comunicação Ltda.',
  'Evolution Foundation Ltda.',
  'ETUS Digital LLC (Brius)',
  'E3J Serviços Ltda.',
  'Outra',
] as const
export type Empresa = (typeof EMPRESAS)[number]

/* ── Áreas da empresa (conforme Espaço Seguro) ── */
export const AREAS_EMPRESA = [
  'Aquisição/Retenção',
  'Brius',
  'Comercial',
  'Comunidade',
  'Criativo',
  'Conteúdo',
  'Diretoria',
  'Financeiro',
  'Gente',
  'Infraestrutura',
  'Jurídico',
  'Produto',
  'Tecnologia',
  'Outro',
] as const

/* ── Contratos ── */
export type ContratoTipo =
  | 'prestacao_servico'
  | 'nda'
  | 'trabalho'
  | 'societario'
  | 'locacao'
  | 'influenciador'
  | 'fornecedor'
  | 'outro'

export const CONTRATO_TIPO_LABELS: Record<ContratoTipo, string> = {
  prestacao_servico: 'Prestação de Serviço',
  nda: 'NDA',
  trabalho: 'Trabalho',
  societario: 'Societário',
  locacao: 'Locação',
  influenciador: 'Influenciador',
  fornecedor: 'Fornecedor',
  outro: 'Outro',
}

export type ContratoStatus =
  | 'rascunho'
  | 'em_analise'
  | 'aprovado'
  | 'assinado'
  | 'vigente'
  | 'vencido'
  | 'rescindido'

export const CONTRATO_STATUS_LABELS: Record<ContratoStatus, string> = {
  rascunho: 'Rascunho',
  em_analise: 'Em Análise',
  aprovado: 'Aprovado',
  assinado: 'Assinado',
  vigente: 'Vigente',
  vencido: 'Vencido',
  rescindido: 'Rescindido',
}

export interface ContratoAnexo {
  nome: string
  path: string
  size: number
  uploadedAt: Timestamp
  versao: number
}

export interface Contrato {
  id: string
  empresa: string
  tipo: ContratoTipo
  parteContratadaNome: string
  parteContratadaDocumento: string
  valorTotal: number
  vigenciaInicio: string
  vigenciaFim: string
  clausulasRelevantes: string
  tags: string[]
  status: ContratoStatus
  criadoPorUid: string
  criadoEm: Timestamp
  anexos: ContratoAnexo[]
  observacoes?: string
}

/* ── Processos Judiciais ── */
export type ProcessoArea = 'civel' | 'trabalhista' | 'tributaria' | 'consumidor'

export const PROCESSO_AREA_LABELS: Record<ProcessoArea, string> = {
  civel: 'Cível',
  trabalhista: 'Trabalhista',
  tributaria: 'Tributária',
  consumidor: 'Consumidor',
}

export type ProcessoStatus =
  | 'em_andamento'
  | 'sentenca_favoravel'
  | 'sentenca_desfavoravel'
  | 'recurso'
  | 'transito_julgado'
  | 'arquivado'

export const PROCESSO_STATUS_LABELS: Record<ProcessoStatus, string> = {
  em_andamento: 'Em Andamento',
  sentenca_favoravel: 'Sentença Favorável',
  sentenca_desfavoravel: 'Sentença Desfavorável',
  recurso: 'Recurso',
  transito_julgado: 'Trânsito em Julgado',
  arquivado: 'Arquivado',
}

export interface Movimentacao {
  data: string
  tipo: string
  descricao: string
  anexoPath?: string
}

export interface Processo {
  id: string
  numeroCnj: string
  vara: string
  comarca: string
  area: ProcessoArea
  empresa: string
  autorNome: string
  reuNome: string
  status: ProcessoStatus
  valorCausa: number
  valorProvisionado: number
  advogadoResponsavelUid: string
  advogadoResponsavelNome?: string
  criadoEm: Timestamp
  movimentacoes: Movimentacao[]
}

/* ── Demandas / Solicitações (baseadas nos Google Forms reais) ── */
export type DemandaTipo =
  | 'elaboracao_contrato'
  | 'analise_contrato'
  | 'tarefa'
  | 'consultoria'

export const DEMANDA_TIPO_LABELS: Record<DemandaTipo, string> = {
  elaboracao_contrato: 'Elaboração de Contrato',
  analise_contrato: 'Análise de Contrato',
  tarefa: 'Realização de Tarefa',
  consultoria: 'Consultoria / Dúvida Jurídica',
}

export type DemandaUrgencia = 'baixa' | 'media' | 'alta'

export const DEMANDA_URGENCIA_LABELS: Record<DemandaUrgencia, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
}

export const SLA_DIAS: Record<DemandaUrgencia, number> = {
  alta: 2,
  media: 5,
  baixa: 10,
}

export type DemandaStatus = 'aberta' | 'em_analise' | 'aguardando_solicitante' | 'concluida' | 'arquivada'

export const DEMANDA_STATUS_LABELS: Record<DemandaStatus, string> = {
  aberta: 'Aberta',
  em_analise: 'Em Análise',
  aguardando_solicitante: 'Aguardando Solicitante',
  concluida: 'Concluída',
  arquivada: 'Arquivada',
}

export interface Comentario {
  autorUid: string
  autorNome: string
  texto: string
  criadoEm: Timestamp
}

export interface Demanda {
  id: string
  titulo: string
  tipo: DemandaTipo
  descricao: string
  urgencia: DemandaUrgencia
  solicitanteUid: string
  solicitanteNome: string
  solicitanteTime: string
  analistaAtribuidoUid?: string
  analistaAtribuidoNome?: string
  contratoRelacionadoId?: string
  status: DemandaStatus
  criadoEm: Timestamp
  concluidoEm?: Timestamp
  comentarios: Comentario[]
  // Campos específicos de Elaboração de Contrato
  parte1?: string
  parte2Descricao?: string
  objetoContrato?: string
  valorContrato?: string
  formaPagamento?: string
  prazoPagamento?: string
  reajusteValor?: string
  obrigacoes?: string
  prazoAnalise?: string
  // Campos específicos de Análise de Contrato
  observacoesAnalise?: string
}

/* ── Espaço Seguro (Canal de Compliance) ── */
export const ESPACO_SEGURO_TIPOS = [
  'Agressão física',
  'Agressão verbal',
  'Ambiente ruim para trabalhar',
  'Assédio moral',
  'Assédio sexual',
  'Brincadeira fora de hora',
  'Concorrência',
  'Conflito de Interesses',
  'Corrupção',
  'Discriminação',
  'Dúvidas em relação ao Programa de Compliance',
  'Falsificação de documentos',
  'Fraude',
  'LGBTQIAfobia',
  'Machismo',
  'Pirataria',
  'Quebra de sigilo de informações',
  'Racismo',
  'Suborno',
  'Violação do Código de Ética e Comportamento',
  'Informações ou sugestões',
  'Outro',
] as const

export type EspacoSeguroStatus = 'pendente' | 'em_apuracao' | 'encerrado'

export const ESPACO_SEGURO_STATUS_LABELS: Record<EspacoSeguroStatus, string> = {
  pendente: 'Pendente',
  em_apuracao: 'Em Apuração',
  encerrado: 'Encerrado',
}

export interface EspacoSeguroRelato {
  id: string
  nomeRelator?: string
  ocorreuComQuem: string
  tipoOcorrencia: string
  sabeData: string
  dataOcorrencia?: string
  parteDoDia?: string
  areaEmpresa: string
  nomePraticante: string
  testemunhas: string
  descricao: string
  informacoesAdicionais?: string
  status: EspacoSeguroStatus
  criadoEm: Timestamp
  respostaCompliance?: string
}

/* ── LGPD / Compliance ── */
export type IncidenteTipo = 'vazamento' | 'requisicao_titular' | 'acesso_indevido' | 'outro'

export const INCIDENTE_TIPO_LABELS: Record<IncidenteTipo, string> = {
  vazamento: 'Vazamento',
  requisicao_titular: 'Requisição de Titular',
  acesso_indevido: 'Acesso Indevido',
  outro: 'Outro',
}

export type IncidenteStatus = 'aberto' | 'em_tratamento' | 'encerrado'

export const INCIDENTE_STATUS_LABELS: Record<IncidenteStatus, string> = {
  aberto: 'Aberto',
  em_tratamento: 'Em Tratamento',
  encerrado: 'Encerrado',
}

export interface IncidenteLgpd {
  id: string
  data: string
  tipo: IncidenteTipo
  descricao: string
  dadosEnvolvidos: string
  acaoTomada: string
  status: IncidenteStatus
  criadoEm: Timestamp
}

export type BaseLegal =
  | 'consentimento'
  | 'legitimo_interesse'
  | 'contrato'
  | 'obrigacao_legal'
  | 'protecao_vida'
  | 'exercicio_direitos'

export const BASE_LEGAL_LABELS: Record<BaseLegal, string> = {
  consentimento: 'Consentimento',
  legitimo_interesse: 'Legítimo Interesse',
  contrato: 'Execução de Contrato',
  obrigacao_legal: 'Obrigação Legal',
  protecao_vida: 'Proteção da Vida',
  exercicio_direitos: 'Exercício Regular de Direitos',
}

export interface InventarioDados {
  id: string
  sistema: string
  finalidade: string
  baseLegal: BaseLegal
  prazoRetencao: string
  responsavelUid: string
  responsavelNome?: string
}

export interface TemplateLgpd {
  id: string
  titulo: string
  corpoMarkdown: string
  atualizadoEm: Timestamp
}
