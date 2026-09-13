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
  | 'ENTREGUE';

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

export interface ItemOrcamentoInput {
  idRegra?: string;
  custoPeca?: number;
  freteReal?: number;
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

export interface OrdemServico {
  id_os: string;
  numero_os: string;
  status_os: StatusOS;
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