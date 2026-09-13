export type StatusOS = 'AGUARDANDO_AVALIACAO' | 'EM_ANALISE' | 'AGUARDANDO_PECA' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO';

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

export interface ClientePayload {
  idCliente?: string;
  nome: string;
  cpfCnpj: string;
  whatsapp: string;
  email: string;
}

export interface AparelhoPayload {
  modelo: string;
  imei1: string;
  senhaDesbloqueio: string;
}

export interface ItemOrcamentoInput {
  idRegra: string;
  custoPeca: number;
  freteReal: number;
}

export interface OrcamentoCalculadoResult {
  subtotalServicos: number;
  descontoGeralAplicado: number;
  valorTotalOrcamento: number;
  lucroTotalEstimadoInterno: number;
}

export interface OrdemServico {
  id_os: string;
  numero_os: string;
  cliente: ClientePayload;
  aparelho: AparelhoPayload;
  status_os: StatusOS;
  defeitoRelatado: string;
  checklistEntrada: ChecklistEntrada;
  orcamentoCalculado: OrcamentoCalculadoResult;
  data_abertura: string;
}