const API_BASE_URL = 'http://localhost:3000/v1';

export async function calcularOrcamento(
  itens: any[],
  descontoGeral: { valor: number } = { valor: 0 }
): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/orcamentos/calcular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens, descontoGeral }),
    });
    const json = await response.json();
    if (response.ok && json.sucesso && json.data?.resumoFinanceiro) {
      return json.data.resumoFinanceiro;
    }
    throw new Error("Falha no cálculo via servidor");
  } catch {
    const custoPeca = Number(itens[0]?.custoPeca) || 0;
    const freteReal = Number(itens[0]?.freteReal) || 0;
    const desconto = Number(descontoGeral?.valor) || 0;
    const subtotalEstimado = custoPeca * 2 + freteReal;
    const valorTotal = Math.max(0, subtotalEstimado - desconto);

    return {
      subtotalServicos: subtotalEstimado,
      descontoGeralAplicado: desconto,
      valorTotalOrcamento: valorTotal,
      lucroTotalEstimadoInterno: valorTotal - (custoPeca + freteReal),
    };
  }
}

export async function criarOrdemServico(payload: {
  cliente: any;
  aparelho: any;
  defeitoRelatado: string;
  diagnostico?: string;
  servicoRealizado?: string;
  pecasUtilizadas?: string;
  observacoes?: string;
  dataAbertura?: string;
  dataPrevistaEntrega?: string;
  checklistEntrada: any;
  orcamentoCalculado: any;
  possuiGarantia?: boolean;
  formaPagamento?: string;
  parcelas?: number;
  valorLiquido?: number | null;
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

export async function editarOrdemServico(id_os: string, payload: any): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/ordens-servico/${id_os}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await response.json();
  if (!response.ok || !json.sucesso) {
    throw new Error(json.erro || 'Falha ao atualizar Ordem de Serviço');
  }
}

export async function buscarOrdensServico(): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/ordens-servico`);
    const json = await response.json();
    if (json && json.sucesso && Array.isArray(json.data)) {
      return json.data;
    }
    if (Array.isArray(json)) {
      return json;
    }
    return [];
  } catch (error) {
    console.error('Erro ao conectar na API:', error);
    return [];
  }
}

export async function atualizarStatusOS(id_os: string, status_os: string): Promise<void> {
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

export async function registrarGarantiaOS(
  id_os: string,
  garantia: any,
  descricaoOcorrencia?: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/ordens-servico/${id_os}/garantia`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      garantia,
      novaOcorrencia: descricaoOcorrencia ? { descricao: descricaoOcorrencia, autor: 'Técnico' } : undefined,
    }),
  });
  const json = await response.json();
  if (!response.ok || !json.sucesso) {
    throw new Error(json.erro || 'Falha ao registrar garantia');
  }
}

export async function excluirOrdemServico(id_os: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/ordens-servico/${id_os}`, {
    method: 'DELETE',
  });
  const json = await response.json();
  if (!response.ok || !json.sucesso) {
    throw new Error(json.erro || 'Falha ao excluir a Ordem de Serviço');
  }
}