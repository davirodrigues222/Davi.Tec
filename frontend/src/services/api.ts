import type { 
  ClientePayload, 
  AparelhoPayload, 
  ChecklistEntrada, 
  ItemOrcamentoInput, 
  OrcamentoCalculadoResult, 
  OrdemServico,
  StatusOS
} from '../types';

const API_BASE_URL = 'http://localhost:3000/v1';

export async function calcularOrcamento(
  itens: ItemOrcamentoInput[],
  descontoGeral: { valor: number } = { valor: 0 }
): Promise<OrcamentoCalculadoResult> {
  const response = await fetch(`${API_BASE_URL}/orcamentos/calcular`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itens, descontoGeral }),
  });
  const json = await response.json();
  if (!response.ok || !json.sucesso) {
    throw new Error(json.erro || 'Falha ao calcular orçamento');
  }
  return json.data.resumoFinanceiro;
}

export async function criarOrdemServico(payload: {
  cliente: ClientePayload;
  aparelho: AparelhoPayload;
  defeitoRelatado: string;
  checklistEntrada: ChecklistEntrada;
  orcamentoCalculado: OrcamentoCalculadoResult;
}): Promise<{ idOs: string; numeroOs: string }> {
  const response = await fetch(`${API_BASE_URL}/ordens-servico`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await response.json();
  if (!response.ok || !json.sucesso) {
    throw new Error(json.erro || 'Falha ao salvar Ordem de Serviço');
  }
  return json.data;
}

export async function buscarOrdensServico(): Promise<OrdemServico[]> {
  const response = await fetch(`${API_BASE_URL}/ordens-servico`);
  const json = await response.json();
  if (!response.ok || !json.sucesso) {
    throw new Error(json.erro || 'Falha ao buscar Ordens de Serviço');
  }
  return json.data;
}

export async function atualizarStatusOS(id_os: string, status_os: StatusOS): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/ordens-servico/${id_os}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status_os }),
  });
  const json = await response.json();
  if (!response.ok || !json.sucesso) {
    throw new Error(json.erro || 'Falha ao atualizar status');
  }
}