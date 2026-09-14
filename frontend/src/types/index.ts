export type StatusChecklist = 'OK' | 'DEFEITO' | 'NAO_TESTADO';

export interface ChecklistEntrada {
  tela: StatusChecklist;
  faceId: StatusChecklist;
  bateria: StatusChecklist;
  cameraTraseira: StatusChecklist;
  cameraFrontal: StatusChecklist;
  carga: StatusChecklist;
  audio: StatusChecklist;
  wifi: StatusChecklist;
}

export type StatusOS =
  | 'AGUARDANDO_AVALIACAO'
  | 'EM_ANALISE'
  | 'AGUARDANDO_PECA'
  | 'EM_MANUTENCAO'
  | 'PRONTO'
  | 'ENTREGUE'
  | 'CANCELADO';

export interface ClientePayload {
  idCliente?: string;
  nome: string;
  cpfCnpj?: string;
  whatsapp?: string;
  email?: string;
}

export interface AparelhoPayload {
  modelo: string;
  imei1?: string;
  senhaDesbloqueio?: string;
}

export interface OrcamentoCalculadoResult {
  subtotalServicos: number;
  descontoGeralAplicado: number;
  valorTotalOrcamento: number;
  lucroTotalEstimadoInterno: number;
  custoPeca?: number;
  freteReal?: number;
  fornecedorPeca?: string;
}

export interface RegistroGarantia {
  houveGarantia: boolean;
  dataRetorno?: string;
  defeitoConstatadoGarantia?: string;
  pecaSubstituidaGarantia?: string;
  custoPecaGarantia?: number;
  cobertoPelaAssistência?: boolean;
  prejuizoTotalGarantia?: number;
}

// Interface completa da Ordem de Serviço
export interface OrdemServico {
  id_os: string;
  numero_os: string;
  status_os: StatusOS;
  possuiGarantia?: boolean; // <-- Flag de controle de garantia
  defeitoRelatado: string;
  diagnostico?: string;
  servicoRealizado?: string;
  pecasUtilizadas?: string;
  observacoes?: string;
  checklistEntrada?: ChecklistEntrada;
  data_abertura?: string;
  data_prevista_entrega?: string;
  data_conclusao?: string;
  garantia?: RegistroGarantia;
  historico?: Array<{ id: string; data: string; descricao: string; autor?: string }>;
  cliente: ClientePayload;
  aparelho: AparelhoPayload;
  orcamentoCalculado: OrcamentoCalculadoResult;
}

// Interface para a criação de OS (Payload enviado ao backend)
export interface CriarOrdemServicoPayload {
  cliente: ClientePayload;
  aparelho: AparelhoPayload;
  possuiGarantia?: boolean; // <-- Permite enviar a escolha ao backend
  defeitoRelatado: string;
  diagnostico?: string;
  servicoRealizado?: string;
  pecasUtilizadas?: string;
  observacoes?: string;
  dataAbertura?: string;
  dataPrevistaEntrega?: string;
  checklistEntrada?: ChecklistEntrada;
  orcamentoCalculado: OrcamentoCalculadoResult;
}