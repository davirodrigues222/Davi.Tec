import React, { useState, useEffect } from 'react';
import { buscarOrdensServico, excluirOrdemServico, editarOrdemServico } from '../services/api';
import type { OrdemServico, StatusOS } from '../types';

interface DadosLojaConfig {
  nomeLoja: string;
  subtitulo: string;
  telefone: string;
  cnpjCpf: string;
  endereco?: string;
}

export const HistoricoServicos: React.FC = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  
  // Dados da loja carregados das configurações
  const [dadosLoja, setDadosLoja] = useState<DadosLojaConfig>({
    nomeLoja: "Sampaio Cell",
    subtitulo: "Assistência Técnica & Microeletrônica Especializada",
    telefone: "(85) 99999-9999",
    cnpjCpf: "",
    endereco: "Fortaleza - Ceará",
  });

  useEffect(() => {
    const configSalva =
      localStorage.getItem("configuracoes_loja") ||
      localStorage.getItem("dados_loja") ||
      localStorage.getItem("configuracoes");

    if (configSalva) {
      try {
        const parsed = JSON.parse(configSalva);
        setDadosLoja({
          nomeLoja: parsed.nomeLoja || parsed.nome || "Sampaio Cell",
          subtitulo:
            parsed.subtitulo ||
            parsed.especialidade ||
            "Assistência Técnica & Microeletrônica Especializada",
          telefone: parsed.telefone || parsed.whatsapp || "(85) 99999-9999",
          cnpjCpf: parsed.cnpjCpf || parsed.cnpj || parsed.cpf || "",
          endereco: parsed.endereco || "Fortaleza - Ceará",
        });
      } catch (e) {
        console.error("Erro ao carregar configurações da loja:", e);
      }
    }
  }, []);

  // Modais de Controle
  const [osSelecionada, setOsSelecionada] = useState<OrdemServico | null>(null);
  const [osParaEditar, setOsParaEditar] = useState<OrdemServico | null>(null);
  const [osParaExcluir, setOsParaExcluir] = useState<OrdemServico | null>(null);
  const [osParaImprimir, setOsParaImprimir] = useState<OrdemServico | null>(null);

  const [excluindo, setExcluindo] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [abaModal, setAbaModal] = useState<'detalhes' | 'checklist' | 'historico'>('detalhes');

  // Estados dos campos de edição
  const [editNome, setEditNome] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editModelo, setEditModelo] = useState('');
  const [editImei, setEditImei] = useState('');
  const [editSenha, setEditSenha] = useState('');
  const [editStatus, setEditStatus] = useState<StatusOS>('AGUARDANDO_AVALIACAO');
  const [editDefeito, setEditDefeito] = useState('');
  const [editDiagnostico, setEditDiagnostico] = useState('');
  const [editServico, setEditServico] = useState('');
  const [editPecas, setEditPecas] = useState('');
  const [editObservacoes, setEditObservacoes] = useState('');
  const [editCustoPeca, setEditCustoPeca] = useState<number | ''>('');
  const [editFrete, setEditFrete] = useState<number | ''>('');
  const [editFornecedor, setEditFornecedor] = useState('');
  const [editDesconto, setEditDesconto] = useState<number | ''>('');
  const [editValorTotal, setEditValorTotal] = useState<number | ''>('');
  const [editDataAbertura, setEditDataAbertura] = useState('');
  const [editDataConclusao, setEditDataConclusao] = useState('');

  const carregarHistorico = async () => {
    setLoading(true);
    try {
      const data = await buscarOrdensServico();
      setOrdens(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
      setOrdens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarHistorico();
  }, []);

  const handleImprimir = (os: OrdemServico) => {
    setOsParaImprimir(os);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const abrirEdicao = (os: OrdemServico) => {
    setOsParaEditar(os);
    setEditNome(os.cliente?.nome || '');
    setEditWhatsapp(os.cliente?.whatsapp || '');
    setEditModelo(os.aparelho?.modelo || '');
    setEditImei(os.aparelho?.imei1 || '');
    setEditSenha(os.aparelho?.senhaDesbloqueio || '');
    setEditStatus(os.status_os);
    setEditDefeito(os.defeitoRelatado || '');
    setEditDiagnostico(os.diagnostico || '');
    setEditServico(os.servicoRealizado || '');
    setEditPecas(os.pecasUtilizadas || '');
    setEditObservacoes(os.observacoes || '');

    const custo = os.orcamentoCalculado?.custoPeca;
    setEditCustoPeca(custo !== undefined && custo !== null ? custo : '');

    const frete = os.orcamentoCalculado?.freteReal;
    setEditFrete(frete !== undefined && frete !== null ? frete : '');

    setEditFornecedor(os.orcamentoCalculado?.fornecedorPeca || '');

    const desc = os.orcamentoCalculado?.descontoGeralAplicado;
    setEditDesconto(desc !== undefined && desc !== null ? desc : '');

    const total = os.orcamentoCalculado?.valorTotalOrcamento;
    setEditValorTotal(total !== undefined && total !== null ? total : '');

    setEditDataAbertura(
      os.data_abertura ? new Date(os.data_abertura).toISOString().substring(0, 10) : ''
    );
    setEditDataConclusao(
      os.data_conclusao ? new Date(os.data_conclusao).toISOString().substring(0, 10) : ''
    );
  };

  const handleSalvarEdicao = async () => {
    if (!osParaEditar) return;
    setSalvandoEdicao(true);
    try {
      const logs: string[] = [];

      const numValorTotal = editValorTotal === '' ? 0 : Number(editValorTotal);
      const numCustoPeca = editCustoPeca === '' ? 0 : Number(editCustoPeca);
      const numFrete = editFrete === '' ? 0 : Number(editFrete);
      const numDesconto = editDesconto === '' ? 0 : Number(editDesconto);

      if (numValorTotal !== osParaEditar.orcamentoCalculado?.valorTotalOrcamento) {
        logs.push(`Valor alterado de R$ ${osParaEditar.orcamentoCalculado?.valorTotalOrcamento} para R$ ${numValorTotal}`);
      }
      if (numCustoPeca !== osParaEditar.orcamentoCalculado?.custoPeca) {
        logs.push(`Custo alterado de R$ ${osParaEditar.orcamentoCalculado?.custoPeca} para R$ ${numCustoPeca}`);
      }
      if (numFrete !== osParaEditar.orcamentoCalculado?.freteReal) {
        logs.push(`Frete alterado de R$ ${osParaEditar.orcamentoCalculado?.freteReal} para R$ ${numFrete}`);
      }

      const custoGarantia = Number(osParaEditar.garantia?.custoPecaGarantia || osParaEditar.garantia?.prejuizoTotalGarantia || 0);
      const lucroCalculado = numValorTotal - (numCustoPeca + numFrete + custoGarantia);

      await editarOrdemServico(osParaEditar.id_os, {
        cliente: { ...osParaEditar.cliente, nome: editNome, whatsapp: editWhatsapp },
        aparelho: { modelo: editModelo, imei1: editImei, senhaDesbloqueio: editSenha },
        status_os: editStatus,
        defeitoRelatado: editDefeito,
        diagnostico: editDiagnostico,
        servicoRealizado: editServico,
        pecasUtilizadas: editPecas,
        observacoes: editObservacoes,
        data_abertura: editDataAbertura || undefined,
        data_conclusao: editDataConclusao || undefined,
        orcamentoCalculado: {
          subtotalServicos: numValorTotal + numDesconto,
          descontoGeralAplicado: numDesconto,
          valorTotalOrcamento: numValorTotal,
          lucroTotalEstimadoInterno: lucroCalculado,
          custoPeca: numCustoPeca,
          freteReal: numFrete,
          fornecedorPeca: editFornecedor,
        },
        modificacoesLog: logs,
      });

      setOsParaEditar(null);
      // Se estivesse visualizando os detalhes da OS editada, fecha o modal para atualizar a tela
      if (osSelecionada?.id_os === osParaEditar.id_os) {
        setOsSelecionada(null);
      }
      await carregarHistorico();
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar a Ordem de Serviço.");
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const handleConfirmarExclusao = async () => {
    if (!osParaExcluir) return;
    setExcluindo(true);
    try {
      await excluirOrdemServico(osParaExcluir.id_os);
      setOrdens((prev) => prev.filter((os) => os.id_os !== osParaExcluir.id_os));
      setOsParaExcluir(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir Ordem de Serviço.');
    } finally {
      setExcluindo(false);
    }
  };

  const ordensFiltradas = ordens.filter((os) => {
    if (!os) return false;
    const termo = termoBusca.toLowerCase();
    const numeroOs = os.numero_os ? os.numero_os.toLowerCase() : '';
    const nomeCliente = os.cliente?.nome ? os.cliente.nome.toLowerCase() : '';
    const modeloAparelho = os.aparelho?.modelo ? os.aparelho.modelo.toLowerCase() : '';

    return numeroOs.includes(termo) || nomeCliente.includes(termo) || modeloAparelho.includes(termo);
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-white">Histórico Geral de Serviços</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Consulta detalhada, relatórios de consertos e gerenciamento de registros.</p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Buscar cliente, modelo, IMEI ou OS..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-500 w-72"
          />
          <button
            onClick={carregarHistorico}
            className="p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl text-xs transition"
            title="Atualizar lista"
          >
            🔄
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 print:hidden">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : ordensFiltradas.length === 0 ? (
        <div className="p-16 text-center space-y-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl print:hidden">
          <h3 className="text-sm font-bold text-zinc-300">Nenhuma Ordem Encontrada</h3>
          <p className="text-xs text-zinc-500">Não existem ordens de serviço salvas para o filtro pesquisado.</p>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden print:hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase border-b border-zinc-800 font-semibold">
                <tr>
                  <th className="p-4">Nº OS</th>
                  <th className="p-4">Data Abertura</th>
                  <th className="p-4">Cliente / Contato</th>
                  <th className="p-4">Aparelho / Modelo</th>
                  <th className="p-4">Defeito Relatado</th>
                  <th className="p-4 text-right">Valor Cobrado</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {ordensFiltradas.map((os) => (
                  <tr key={os.id_os} className="hover:bg-zinc-800/30 transition">
                    <td className="p-4 font-mono font-bold text-blue-400">{os.numero_os}</td>
                    <td className="p-4 text-zinc-400">
                      {os.data_abertura ? new Date(os.data_abertura).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-4 font-bold text-white">
                      {os.cliente?.nome}
                      <span className="block text-[10px] text-zinc-500 font-normal">{os.cliente?.whatsapp || '-'}</span>
                    </td>
                    <td className="p-4 font-medium text-zinc-200">{os.aparelho?.modelo}</td>
                    <td className="p-4 max-w-xs truncate text-zinc-400">{os.defeitoRelatado}</td>
                    <td className="p-4 text-right font-bold text-white">
                      R$ {(os.orcamentoCalculado?.valorTotalOrcamento || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Apenas Detalhes e Excluir visíveis na coluna de ações */}
                        <button
                          onClick={() => {
                            setOsSelecionada(os);
                            setAbaModal('detalhes');
                          }}
                          className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold transition"
                        >
                          👁️ Detalhes
                        </button>

                        <button
                          onClick={() => setOsParaExcluir(os)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold transition"
                          title="Excluir Ordem de Serviço"
                        >
                          🗑️ Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DETALHES COMPLETO DA OS */}
      {osSelecionada && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            
            {/* CABEÇALHO DO MODAL DETALHES COM BOTÕES DE AÇÃO (EDITAR E IMPRIMIR) */}
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Ordem de Serviço</span>
                  <span className="font-mono text-blue-400">#{osSelecionada.numero_os}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-normal">
                    {osSelecionada.status_os?.replace('_', ' ')}
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {osSelecionada.cliente?.nome} — {osSelecionada.aparelho?.modelo}
                </p>
              </div>

              {/* Ações Internas da OS */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => abrirEdicao(osSelecionada)}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                >
                  <span>✏️</span>
                  <span>Editar OS</span>
                </button>

                <button
                  onClick={() => handleImprimir(osSelecionada)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center space-x-1 shadow-md"
                >
                  <span>🖨️</span>
                  <span>Imprimir / Salvar PDF</span>
                </button>

                <button
                  onClick={() => setOsSelecionada(null)}
                  className="text-zinc-400 hover:text-white text-base font-bold pl-2"
                  title="Fechar"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* ABAS DE NAVEGAÇÃO DO MODAL */}
            <div className="flex border-b border-zinc-800 bg-zinc-950/50 text-xs">
              <button
                onClick={() => setAbaModal('detalhes')}
                className={`px-4 py-2.5 font-bold transition border-b-2 ${
                  abaModal === 'detalhes' ? 'border-blue-500 text-blue-400 bg-zinc-900/50' : 'border-transparent text-zinc-400'
                }`}
              >
                Informações & Orçamento
              </button>
              <button
                onClick={() => setAbaModal('checklist')}
                className={`px-4 py-2.5 font-bold transition border-b-2 ${
                  abaModal === 'checklist' ? 'border-blue-500 text-blue-400 bg-zinc-900/50' : 'border-transparent text-zinc-400'
                }`}
              >
                Checklist de Entrada
              </button>
              <button
                onClick={() => setAbaModal('historico')}
                className={`px-4 py-2.5 font-bold transition border-b-2 ${
                  abaModal === 'historico' ? 'border-blue-500 text-blue-400 bg-zinc-900/50' : 'border-transparent text-zinc-400'
                }`}
              >
                Linha do Tempo & Logs
              </button>
            </div>

            {/* CORPO DO MODAL */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {abaModal === 'detalhes' && (
                <div className="space-y-4 text-xs">
                  
                  {/* Datas e Status */}
                  <div className="grid grid-cols-3 gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <div>
                      <span className="text-zinc-500 block uppercase text-[10px] font-bold">Data de Abertura</span>
                      <p className="font-semibold text-zinc-200">
                        {osSelecionada.data_abertura ? new Date(osSelecionada.data_abertura).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase text-[10px] font-bold">Previsão Entrega</span>
                      <p className="font-semibold text-zinc-200">
                        {osSelecionada.data_prevista_entrega ? new Date(osSelecionada.data_prevista_entrega).toLocaleDateString('pt-BR') : 'Não informada'}
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase text-[10px] font-bold">Data de Conclusão</span>
                      <p className="font-semibold text-zinc-200">
                        {osSelecionada.data_conclusao ? new Date(osSelecionada.data_conclusao).toLocaleDateString('pt-BR') : 'Em andamento'}
                      </p>
                    </div>
                  </div>

                  {/* Dados do Cliente e Aparelho */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <div className="space-y-1">
                      <span className="text-blue-400 block uppercase text-[10px] font-bold">👤 Informações do Cliente</span>
                      <p className="font-bold text-white text-sm">{osSelecionada.cliente?.nome}</p>
                      <p className="text-zinc-400"><strong>WhatsApp:</strong> {osSelecionada.cliente?.whatsapp || 'Não informado'}</p>
                      <p className="text-zinc-400"><strong>CPF/CNPJ:</strong> {osSelecionada.cliente?.cpfCnpj || 'Não informado'}</p>
                      <p className="text-zinc-400"><strong>E-mail:</strong> {osSelecionada.cliente?.email || 'Não informado'}</p>
                    </div>

                    <div className="space-y-1 border-t md:border-t-0 md:border-l border-zinc-800 pt-3 md:pt-0 md:pl-4">
                      <span className="text-blue-400 block uppercase text-[10px] font-bold">📱 Informações do Aparelho</span>
                      <p className="font-bold text-white text-sm">{osSelecionada.aparelho?.modelo}</p>
                      <p className="text-zinc-400"><strong>IMEI / N° Série:</strong> {osSelecionada.aparelho?.imei1 || 'Não informado'}</p>
                      <p className="text-zinc-400"><strong>Senha do Aparelho:</strong> {osSelecionada.aparelho?.senhaDesbloqueio || 'Sem senha'}</p>
                    </div>
                  </div>

                  {/* Problema, Diagnóstico e Serviço Realizado */}
                  <div className="space-y-3 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <div>
                      <span className="text-zinc-500 block uppercase text-[10px] font-bold">Defeito Relatado pelo Cliente</span>
                      <p className="text-zinc-200 mt-1 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">{osSelecionada.defeitoRelatado}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase text-[10px] font-bold">Diagnóstico Técnico</span>
                      <p className="text-zinc-200 mt-1 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                        {osSelecionada.diagnostico || 'Aguardando diagnóstico em bancada.'}
                      </p>
                    </div>
                    {osSelecionada.servicoRealizado && (
                      <div>
                        <span className="text-zinc-500 block uppercase text-[10px] font-bold">Serviço Realizado</span>
                        <p className="text-zinc-200 mt-1 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">{osSelecionada.servicoRealizado}</p>
                      </div>
                    )}
                    {osSelecionada.observacoes && (
                      <div>
                        <span className="text-zinc-500 block uppercase text-[10px] font-bold">Observações Gerais</span>
                        <p className="text-zinc-400 mt-1 italic">{osSelecionada.observacoes}</p>
                      </div>
                    )}
                  </div>

                  {/* Detalhamento Peças e Custos */}
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                    <span className="text-zinc-400 font-bold uppercase text-[10px] block border-b border-zinc-800/80 pb-2">
                      📦 Custos de Entrada, Peças & Fornecedor (Uso Interno)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                        <span className="text-zinc-500 block text-[10px]">Custo Peça</span>
                        <p className="font-bold text-rose-400 text-sm">
                          R$ {(osSelecionada.orcamentoCalculado?.custoPeca || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                        <span className="text-zinc-500 block text-[10px]">Frete Real</span>
                        <p className="font-bold text-amber-400 text-sm">
                          R$ {(osSelecionada.orcamentoCalculado?.freteReal || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                        <span className="text-zinc-500 block text-[10px]">Fornecedor</span>
                        <p className="font-bold text-blue-400 text-sm truncate">
                          {osSelecionada.orcamentoCalculado?.fornecedorPeca || 'Não informado'}
                        </p>
                      </div>
                      <div className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                        <span className="text-zinc-500 block text-[10px]">Desconto</span>
                        <p className="font-bold text-zinc-300 text-sm">
                          R$ {(osSelecionada.orcamentoCalculado?.descontoGeralAplicado || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lucro e Valor Cobrado Final */}
                  <div className="p-4 bg-zinc-950 border border-emerald-500/30 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="text-emerald-400 font-bold uppercase text-[10px] block">Lucro Líquido Real</span>
                      <p className="text-xl font-extrabold text-emerald-400">
                        R$ {(osSelecionada.orcamentoCalculado?.lucroTotalEstimadoInterno || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-500 text-[10px] block uppercase font-bold">Valor Total Cobrado</span>
                      <p className="text-2xl font-black text-white">
                        R$ {(osSelecionada.orcamentoCalculado?.valorTotalOrcamento || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {abaModal === 'checklist' && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {osSelecionada.checklistEntrada ? (
                    Object.entries(osSelecionada.checklistEntrada).map(([item, status]) => (
                      <div key={item} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg flex justify-between items-center">
                        <span className="capitalize font-medium text-zinc-300">{item.replace(/([A-Z])/g, " $1")}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          status === 'OK' ? 'bg-emerald-500/20 text-emerald-400' :
                          status === 'DEFEITO' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500 col-span-2 text-center py-4">Sem checklist registrado.</p>
                  )}
                </div>
              )}

              {abaModal === 'historico' && (
                <div className="space-y-3 text-xs">
                  <h4 className="font-bold text-white uppercase text-[10px]">Linha do Tempo de Ocorrências e Edições</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {osSelecionada.historico && osSelecionada.historico.length > 0 ? (
                      osSelecionada.historico.map((item) => (
                        <div key={item.id} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
                          <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                            <span>{new Date(item.data).toLocaleString('pt-BR')}</span>
                            <span className="text-blue-400 font-bold">{item.autor || 'Sistema'}</span>
                          </div>
                          <p className="text-zinc-300">{item.descricao}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-500 text-center py-4">Nenhuma ocorrência salva.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIÇÃO */}
      {osParaEditar && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">
                Editar Ordem de Serviço <span className="text-blue-400 font-mono">#{osParaEditar.numero_os}</span>
              </h3>
              <button onClick={() => setOsParaEditar(null)} className="text-zinc-400 hover:text-white text-xs font-bold">✕</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 block mb-1">Nome do Cliente</label>
                  <input
                    type="text"
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Modelo Aparelho</label>
                  <input
                    type="text"
                    value={editModelo}
                    onChange={(e) => setEditModelo(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">IMEI</label>
                  <input
                    type="text"
                    value={editImei}
                    onChange={(e) => setEditImei(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Status OS</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as StatusOS)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
                  >
                    <option value="AGUARDANDO_AVALIACAO">Aguardando Avaliação</option>
                    <option value="EM_ANALISE">Em Análise</option>
                    <option value="AGUARDANDO_PECA">Aguardando Peça</option>
                    <option value="EM_MANUTENCAO">Em Manutenção</option>
                    <option value="PRONTO">Pronto</option>
                    <option value="ENTREGUE">Entregue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 block mb-1">Data Abertura</label>
                  <input
                    type="date"
                    value={editDataAbertura}
                    onChange={(e) => setEditDataAbertura(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Data Conclusão</label>
                  <input
                    type="date"
                    value={editDataConclusao}
                    onChange={(e) => setEditDataConclusao(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Defeito Relatado</label>
                <textarea
                  rows={2}
                  value={editDefeito}
                  onChange={(e) => setEditDefeito(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-zinc-800">
                <div>
                  <label className="text-zinc-400 block mb-1">Custo Peça (R$)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={editCustoPeca}
                    onChange={(e) => setEditCustoPeca(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Frete Real (R$)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={editFrete}
                    onChange={(e) => setEditFrete(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Fornecedor</label>
                  <input
                    type="text"
                    value={editFornecedor}
                    onChange={(e) => setEditFornecedor(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Valor Cobrado Total (R$)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={editValorTotal}
                    onChange={(e) => setEditValorTotal(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-emerald-400 font-bold outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end space-x-2">
              <button
                onClick={() => setOsParaEditar(null)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarEdicao}
                disabled={salvandoEdicao}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition"
              >
                {salvandoEdicao ? 'Salvando...' : '💾 Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXCLUSÃO COM CONFIRMAÇÃO */}
      {osParaExcluir && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3 text-red-400">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-bold text-white">Excluir Ordem de Serviço?</h3>
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed">
              Você está prestes a apagar permanentemente a Ordem de Serviço <strong className="text-blue-400 font-mono">#{osParaExcluir.numero_os}</strong> do cliente <strong className="text-white">{osParaExcluir.cliente?.nome}</strong>. Esta ação não poderá ser desfeita.
            </p>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setOsParaExcluir(null)}
                disabled={excluindo}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarExclusao}
                disabled={excluindo}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
              >
                {excluindo ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE DE IMPRESSÃO HISTÓRICO - DINÂMICO COM CENTRAL DE CONFIGURAÇÕES */}
      {osParaImprimir && (
        <div className="hidden print:block text-slate-900 font-sans p-2 bg-white leading-tight">
          <div className="border-b-2 border-slate-900 pb-3 mb-3 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                {dadosLoja.nomeLoja}
              </h1>
              <p className="text-[10px] text-slate-600 font-semibold">
                {dadosLoja.subtitulo}
              </p>
              <div className="text-[9px] text-slate-600 mt-1 space-y-0.5">
                <p>📍 {dadosLoja.endereco} {dadosLoja.telefone && `| 📞 WhatsApp: ${dadosLoja.telefone}`}</p>
                {dadosLoja.cnpjCpf && <p>📄 CNPJ/CPF: {dadosLoja.cnpjCpf}</p>}
              </div>
            </div>

            <div className="text-right border-l border-slate-300 pl-4">
              <div className="bg-slate-100 px-3 py-1 rounded border border-slate-300">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Ordem de Serviço</span>
                <span className="text-base font-black font-mono text-blue-900">#{osParaImprimir.numero_os}</span>
              </div>
              <div className="text-[9px] text-slate-600 mt-1 space-y-0.5">
                <p><strong>Entrada:</strong> {osParaImprimir.data_abertura ? new Date(osParaImprimir.data_abertura).toLocaleDateString("pt-BR") : '-'}</p>
                {osParaImprimir.data_prevista_entrega && (
                  <p><strong>Previsão:</strong> {new Date(osParaImprimir.data_prevista_entrega).toLocaleDateString("pt-BR")}</p>
                )}
                <p><strong>Status:</strong> {osParaImprimir.status_os?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="border border-slate-300 rounded p-2 bg-slate-50/50">
              <h3 className="text-[10px] font-bold uppercase text-slate-700 border-b border-slate-200 pb-1 mb-1.5">
                👤 Dados do Cliente
              </h3>
              <div className="text-[10px] space-y-1">
                <p><span className="text-slate-500">Nome:</span> <strong>{osParaImprimir.cliente?.nome}</strong></p>
                <p><span className="text-slate-500">WhatsApp:</span> {osParaImprimir.cliente?.whatsapp || "Não informado"}</p>
                <p><span className="text-slate-500">CPF/CNPJ:</span> {osParaImprimir.cliente?.cpfCnpj || "Não informado"}</p>
                <p><span className="text-slate-500">E-mail:</span> {osParaImprimir.cliente?.email || "Não informado"}</p>
              </div>
            </div>

            <div className="border border-slate-300 rounded p-2 bg-slate-50/50">
              <h3 className="text-[10px] font-bold uppercase text-slate-700 border-b border-slate-200 pb-1 mb-1.5">
                📱 Dados do Aparelho
              </h3>
              <div className="text-[10px] space-y-1">
                <p><span className="text-slate-500">Modelo:</span> <strong>{osParaImprimir.aparelho?.modelo}</strong></p>
                <p><span className="text-slate-500">IMEI / N° Série:</span> {osParaImprimir.aparelho?.imei1 || "Não informado"}</p>
                <p><span className="text-slate-500">Senha do Aparelho:</span> {osParaImprimir.aparelho?.senhaDesbloqueio || "Sem senha"}</p>
              </div>
            </div>
          </div>

          <div className="border border-slate-300 rounded p-2 mb-3">
            <h3 className="text-[10px] font-bold uppercase text-slate-700 border-b border-slate-200 pb-1 mb-1.5">
              📋 Descrição do Problema & Diagnóstico Técnico
            </h3>
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div>
                <span className="text-slate-500 font-semibold block text-[9px]">DEFEITO RELATADO PELO CLIENTE:</span>
                <p className="bg-slate-100 p-1.5 rounded border border-slate-200 mt-0.5 text-slate-800">
                  {osParaImprimir.defeitoRelatado || "Sem descrição"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[9px]">DIAGNÓSTICO INICIAL / OBSERVAÇÕES:</span>
                <p className="bg-slate-100 p-1.5 rounded border border-slate-200 mt-0.5 text-slate-800">
                  {osParaImprimir.diagnostico || osParaImprimir.observacoes || "Aparelho recebido para análise técnica e testes de bancada."}
                </p>
              </div>
            </div>
          </div>

          {osParaImprimir.checklistEntrada && (
            <div className="border border-slate-300 rounded p-2 mb-3">
              <h3 className="text-[10px] font-bold uppercase text-slate-700 border-b border-slate-200 pb-1 mb-1.5">
                ✔️ Checklist de Entrada do Equipamento
              </h3>
              <div className="grid grid-cols-4 gap-1.5 text-[9px]">
                {Object.entries(osParaImprimir.checklistEntrada).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50">
                    <span className="capitalize text-slate-600">{key.replace(/([A-Z])/g, " $1")}</span>
                    <span className={`font-bold px-1 rounded text-[8px] ${
                      value === "OK" ? "bg-emerald-100 text-emerald-800" :
                      value === "DEFEITO" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border border-slate-300 rounded overflow-hidden mb-3">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-300 text-[9px]">
                <tr>
                  <th className="p-1.5">Descrição dos Serviços / Peças</th>
                  <th className="p-1.5 text-right">Qtd</th>
                  <th className="p-1.5 text-right">Valor Estimado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-1.5 font-medium">Serviço de Manutenção / Avaliação Técnica ({osParaImprimir.aparelho?.modelo})</td>
                  <td className="p-1.5 text-right">1</td>
                  <td className="p-1.5 text-right font-bold">
                    R$ {(osParaImprimir.orcamentoCalculado?.valorTotalOrcamento || 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="bg-slate-50 p-2 border-t border-slate-300 flex justify-between items-center text-[10px]">
              <div className="text-[9px] text-slate-500">
                <p>Forma de Pagamento: A combinar no ato da entrega</p>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">VALOR TOTAL DO ORÇAMENTO</span>
                <span className="text-base font-black text-slate-900">
                  R$ {(osParaImprimir.orcamentoCalculado?.valorTotalOrcamento || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="border border-slate-300 rounded p-2 mb-3 bg-slate-50/50">
            <h3 className="text-[9px] font-bold uppercase text-slate-800 border-b border-slate-200 pb-0.5 mb-1">
              📜 Termos e Condições de Garantia & Prestação de Serviço
            </h3>
            <ol className="list-decimal list-inside text-[8px] text-slate-700 space-y-0.5 leading-tight text-justify">
              <li><strong>Prazo de Garantia:</strong> A garantia cobre o período legal de 90 (noventa) dias a contar da data de entrega do aparelho, restrita exclusivamente às peças substituídas ou aos serviços efetuados especificados nesta Ordem de Serviço.</li>
              <li><strong>Perda de Garantia:</strong> A garantia será sumariamente cancelada em caso de selo de garantia violado, danos físicos (telas trincadas ou quebradas), oxidação/contato com líquidos, intervenção por terceiros não autorizados ou uso inadequado do equipamento.</li>
              <li><strong>Aparelhos Molhados ou Oxidados:</strong> Equipamentos que deram entrada com histórico de contato com líquidos podem apresentar falhas posteriores imprevisíveis durante ou após a manutenção. A assistência não se responsabiliza por vícios ocultos decorrentes de oxidação prévia.</li>
              <li><strong>Retirada do Equipamento:</strong> Equipamentos não retirados em até 90 (noventa) dias após a notificação de conclusão estarão sujeitos a cobrança de taxa de permanência ou descarte conforme o Artigo 1.275 do Código Civil Brasileiro.</li>
              <li><strong>Backup de Dados:</strong> A assistência técnica NÃO se responsabiliza por perdas de dados, fotos ou arquivos gravados no aparelho. É de responsabilidade do cliente a realização de backup prévio antes do envio à manutenção.</li>
            </ol>
          </div>

          <div className="pt-4 border-t border-slate-300 text-[9px]">
            <p className="text-[8px] text-slate-500 text-center mb-6">
              Declaro estar de acordo com a descrição dos serviços, valores estipulados e termos de garantia citados acima.
            </p>
            <div className="grid grid-cols-2 gap-12 text-center">
              <div>
                <div className="border-t border-slate-900 pt-1 font-bold text-slate-800">
                  {osParaImprimir.cliente?.nome}
                </div>
                <span className="text-[8px] text-slate-500 block">Assinatura do Cliente</span>
              </div>
              <div>
                <div className="border-t border-slate-900 pt-1 font-bold text-slate-800">
                  {dadosLoja.nomeLoja} — Técnico Responsável
                </div>
                <span className="text-[8px] text-slate-500 block">Assinatura / Carimbo do Técnico</span>
              </div>
            </div>
            <div className="mt-4 text-center text-[8px] text-slate-400 border-t border-slate-200 pt-1">
              Documento emitido eletronicamente em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};