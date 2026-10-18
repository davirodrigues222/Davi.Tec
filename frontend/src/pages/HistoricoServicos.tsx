import React, { useState, useEffect, useMemo } from 'react';
import {
  buscarOrdensServico,
  excluirOrdemServico,
  editarOrdemServico,
} from '../services/api';
import { CertidaoGarantia } from '../components/CertidaoGarantia';
import type { OrdemServico, StatusOS } from '../types';

export const HistoricoServicos: React.FC = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');

  // Modais
  const [osDetalhes, setOsDetalhes] = useState<OrdemServico | null>(null);
  const [abaDetalhes, setAbaDetalhes] = useState<'info' | 'checklist' | 'timeline'>('info');

  const [osEditando, setOsEditando] = useState<OrdemServico | null>(null);
  const [abaEdicao, setAbaEdicao] = useState<'geral' | 'custos' | 'checklist'>('geral');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [osParaExcluir, setOsParaExcluir] = useState<OrdemServico | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const [osImprimir, setOsImprimir] = useState<OrdemServico | null>(null);

  // Estados do Formulário de Edição
  const [editNome, setEditNome] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editCpfCnpj, setEditCpfCnpj] = useState('');
  const [editModelo, setEditModelo] = useState('');
  const [editImei, setEditImei] = useState('');
  const [editSenha, setEditSenha] = useState('');
  const [editDataAbertura, setEditDataAbertura] = useState('');
  const [editStatus, setEditStatus] = useState<StatusOS>('AGUARDANDO_AVALIACAO');
  const [editDefeito, setEditDefeito] = useState('');
  const [editDiagnostico, setEditDiagnostico] = useState('');

  // Custos e Pagamento Edição
  const [editFormaPgto, setEditFormaPgto] = useState('Cartão de crédito');
  const [editParcelas, setEditParcelas] = useState(1);
  const [editValorCobrado, setEditValorCobrado] = useState<number | ''>('');
  const [editValorLiquido, setEditValorLiquido] = useState<number | ''>('');
  const [editCustoPeca, setEditCustoPeca] = useState<number | ''>('');
  const [editFrete, setEditFrete] = useState<number | ''>('');
  const [editTipoDesconto, setEditTipoDesconto] = useState<'VALOR' | 'PERCENTUAL'>('VALOR');
  const [editDesconto, setEditDesconto] = useState<number | ''>('');

  // Checklist de Entrada Edição
  const [editChecklist, setEditChecklist] = useState<Record<string, string>>({
    ligando: 'OK',
    touchScreen: 'OK',
    display: 'OK',
    cameraTraseira: 'OK',
    cameraFrontal: 'OK',
    microfone: 'OK',
    altoFalante: 'OK',
    conectorCarga: 'OK',
    bateria: 'OK',
    wifi: 'OK',
    bluetooth: 'OK',
    botoesLaterais: 'OK',
  });

  const carregarOrdens = async () => {
    setLoading(true);
    try {
      const data = await buscarOrdensServico();
      setOrdens(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar Ordens de Serviço:', err);
      setOrdens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarOrdens();
  }, []);

  // Abrir Modal de Edição
  const abrirEdicao = (os: OrdemServico) => {
    setOsEditando(os);
    setAbaEdicao('geral');
    setEditNome(os.cliente?.nome || '');
    setEditWhatsapp(os.cliente?.whatsapp || '');
    setEditCpfCnpj(os.cliente?.cpfCnpj || '');
    setEditModelo(os.aparelho?.modelo || '');
    setEditImei(os.aparelho?.imei1 || '');
    setEditSenha(os.aparelho?.senhaDesbloqueio || '');
    setEditDataAbertura(
      os.data_abertura ? os.data_abertura.split('T')[0] : new Date().toISOString().split('T')[0]
    );
    setEditStatus(os.status_os || 'AGUARDANDO_AVALIACAO');
    setEditDefeito(os.defeitoRelatado || '');
    setEditDiagnostico(os.diagnostico || '');

    const valorCobrado = Number(os.orcamentoCalculado?.valorTotalOrcamento || (os as any).valor_total || 0);
    const valorLiq = (os as any).valorLiquido !== undefined ? Number((os as any).valorLiquido) : valorCobrado;
    const peca = Number(os.orcamentoCalculado?.custoPeca || (os as any).custo_peca || 0);
    const frete = Number(os.orcamentoCalculado?.freteReal || (os as any).frete_real || 0);
    const desc = Number(os.orcamentoCalculado?.descontoGeralAplicado || (os as any).desconto_valor || 0);

    setEditFormaPgto((os as any).formaPagamento || (os as any).forma_pagamento || 'Cartão de crédito');
    setEditParcelas(Number((os as any).parcelas) || 1);
    setEditValorCobrado(valorCobrado);
    setEditValorLiquido(valorLiq);
    setEditCustoPeca(peca);
    setEditFrete(frete);
    setEditDesconto(desc);
    setEditTipoDesconto(os.orcamentoCalculado?.tipoDesconto || 'VALOR');

    if (os.checklistEntrada && Object.keys(os.checklistEntrada).length > 0) {
      setEditChecklist(os.checklistEntrada);
    } else {
      setEditChecklist({
        ligando: 'OK',
        touchScreen: 'OK',
        display: 'OK',
        cameraTraseira: 'OK',
        cameraFrontal: 'OK',
        microfone: 'OK',
        altoFalante: 'OK',
        conectorCarga: 'OK',
        bateria: 'OK',
        wifi: 'OK',
        bluetooth: 'OK',
        botoesLaterais: 'OK',
      });
    }
  };

  // Salvar Edição
  const handleSalvarEdicao = async () => {
    if (!osEditando) return;
    setSalvandoEdicao(true);
    try {
      const numValorCobrado = Number(editValorCobrado) || 0;
      const numValorLiq = editValorLiquido !== '' ? Number(editValorLiquido) : numValorCobrado;
      const numCustoPeca = Number(editCustoPeca) || 0;
      const numFrete = Number(editFrete) || 0;
      const numDesconto = Number(editDesconto) || 0;

      const lucroEstimado = numValorLiq - (numCustoPeca + numFrete);

      const payload = {
        cliente: {
          nome: editNome,
          whatsapp: editWhatsapp,
          cpfCnpj: editCpfCnpj,
        },
        aparelho: {
          modelo: editModelo,
          imei1: editImei,
          senhaDesbloqueio: editSenha,
        },
        status_os: editStatus,
        defeitoRelatado: editDefeito,
        diagnostico: editDiagnostico,
        dataAbertura: editDataAbertura,
        forma_pagamento: editFormaPgto,
        parcelas: editParcelas,
        valor_liquido: numValorLiq,
        checklistEntrada: editChecklist,
        orcamentoCalculado: {
          valorTotalOrcamento: numValorCobrado,
          subtotalServicos: numValorCobrado + numDesconto,
          descontoGeralAplicado: numDesconto,
          tipoDesconto: editTipoDesconto,
          custoPeca: numCustoPeca,
          freteReal: numFrete,
          lucroTotalEstimadoInterno: lucroEstimado,
        },
      };

      await editarOrdemServico(osEditando.id_os, payload);
      setOsEditando(null);
      if (osDetalhes && osDetalhes.id_os === osEditando.id_os) {
        setOsDetalhes(null);
      }
      await carregarOrdens();
    } catch (err: any) {
      alert(`Erro ao salvar alterações: ${err.message}`);
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // Excluir Ordem de Serviço
  const handleConfirmarExclusao = async () => {
    if (!osParaExcluir) return;
    setExcluindo(true);
    try {
      await excluirOrdemServico(osParaExcluir.id_os);
      setOsParaExcluir(null);
      if (osDetalhes && osDetalhes.id_os === osParaExcluir.id_os) {
        setOsDetalhes(null);
      }
      await carregarOrdens();
    } catch (err: any) {
      alert(`Erro ao excluir ordem: ${err.message}`);
    } finally {
      setExcluindo(false);
    }
  };

  // Filtragem de Ordens
  const ordensFiltradas = useMemo(() => {
    return ordens.filter((os) => {
      const termo = termoBusca.toLowerCase().trim();
      const numOs = (os.numero_os || '').toLowerCase();
      const cli = (os.cliente?.nome || '').toLowerCase();
      const apr = (os.aparelho?.modelo || '').toLowerCase();
      const imei = (os.aparelho?.imei1 || '').toLowerCase();

      const bateBusca =
        !termo ||
        numOs.includes(termo) ||
        cli.includes(termo) ||
        apr.includes(termo) ||
        imei.includes(termo);

      const bateStatus =
        filtroStatus === 'TODOS' || os.status_os === filtroStatus;

      return bateBusca && bateStatus;
    });
  }, [ordens, termoBusca, filtroStatus]);

  // Exportar Relatório CSV
  const exportarCSV = () => {
    if (ordensFiltradas.length === 0) {
      alert('Nenhum registro para exportar.');
      return;
    }

    const cabecalho = 'ORDEM,CLIENTE,WHATSAPP,APARELHO,SERVICO,DATA,STATUS,VALOR\n';
    const linhas = ordensFiltradas
      .map((os) => {
        const num = os.numero_os;
        const cli = `"${(os.cliente?.nome || '').replace(/"/g, '""')}"`;
        const tel = `"${os.cliente?.whatsapp || ''}"`;
        const apr = `"${(os.aparelho?.modelo || '').replace(/"/g, '""')}"`;
        const srv = `"${(os.servicoRealizado || os.defeitoRelatado || '').replace(/"/g, '""')}"`;
        const data = os.data_abertura ? new Date(os.data_abertura).toLocaleDateString('pt-BR') : '';
        const st = os.status_os;
        const val = (os.orcamentoCalculado?.valorTotalOrcamento || (os as any).valor_total || 0).toFixed(2);
        return `${num},${cli},${tel},${apr},${srv},${data},${st},${val}`;
      })
      .join('\n');

    const blob = new Blob([cabecalho + linhas], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ordens_de_servico_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatarDataTabela = (dataIso?: string) => {
    if (!dataIso) return '--';
    const d = new Date(dataIso);
    const dia = d.getDate();
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const mes = meses[d.getMonth()];
    const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dia} ${mes}, ${hora}`;
  };

  const renderStatusBadge = (status: StatusOS) => {
    switch (status) {
      case 'EM_MANUTENCAO':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">
            Em bancada
          </span>
        );
      case 'AGUARDANDO_PECA':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
            Aguardando peça
          </span>
        );
      case 'PRONTO':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            Pronto
          </span>
        );
      case 'EM_ANALISE':
      case 'AGUARDANDO_AVALIACAO':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
            Em diagnóstico
          </span>
        );
      case 'ENTREGUE':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/25">
            Entregue
          </span>
        );
      case 'CANCELADO':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/25">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-300">
            {status}
          </span>
        );
    }
  };

  const labelsChecklist: Record<string, string> = {
    ligando: 'Ligando',
    touchScreen: 'Touch screen',
    display: 'Display',
    cameraTraseira: 'Câmera traseira',
    cameraFrontal: 'Câmera frontal',
    microfone: 'Microfone',
    altoFalante: 'Alto-falante',
    conectorCarga: 'Conector de carga',
    bateria: 'Bateria',
    wifi: 'Wi-Fi',
    bluetooth: 'Bluetooth',
    botoesLaterais: 'Botões laterais',
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <div className="w-9 h-9 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs text-zinc-400 font-semibold tracking-wider uppercase">
          Carregando ordens de serviço...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto font-sans pb-10">
      {/* ================= CABEÇALHO DA PÁGINA (FIGMA) ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ordens de serviço
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Consulte atendimentos, pagamentos e histórico dos aparelhos.
          </p>
        </div>

        {/* Botão Exportar */}
        <div>
          <button
            onClick={exportarCSV}
            className="px-4 py-2.5 bg-[#0c101a] hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 transition flex items-center space-x-2 shadow-sm"
          >
            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* ================= BARRA DE FILTROS E BUSCA ================= */}
      <div className="bg-[#0c101a] border border-zinc-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Campo de Busca */}
        <div className="relative w-full sm:max-w-md">
          <svg
            className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            placeholder="Cliente, modelo, IMEI ou OS"
            className="w-full pl-10 pr-4 py-2.5 bg-[#080c14] border border-zinc-800/80 rounded-xl text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Filtro de Status e Contador */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <div className="relative">
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="bg-[#080c14] border border-zinc-800/80 text-zinc-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none cursor-pointer focus:border-blue-500 transition pr-8"
            >
              <option value="TODOS">Todos os status</option>
              <option value="AGUARDANDO_AVALIACAO">Aguardando Avaliação</option>
              <option value="EM_ANALISE">Em Diagnóstico</option>
              <option value="EM_MANUTENCAO">Em Bancada</option>
              <option value="AGUARDANDO_PECA">Aguardando Peça</option>
              <option value="PRONTO">Pronto para Retirada</option>
              <option value="ENTREGUE">Entregue</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
            <svg
              className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <div className="px-3.5 py-2.5 bg-[#080c14] border border-zinc-800/80 rounded-xl text-xs font-bold text-zinc-400">
            {ordensFiltradas.length} {ordensFiltradas.length === 1 ? 'registro' : 'registros'}
          </div>
        </div>
      </div>

      {/* ================= TABELA DE ORDENS DE SERVIÇO ================= */}
      <div className="bg-[#0c101a] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
        {ordensFiltradas.length === 0 ? (
          <div className="p-20 text-center space-y-2">
            <p className="text-sm font-bold text-zinc-300">Nenhuma ordem de serviço encontrada</p>
            <p className="text-xs text-zinc-400">
              Ajuste os filtros de busca ou crie uma nova ordem de serviço no botão acima.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090d15] text-[10px] text-zinc-400 uppercase tracking-wider border-b border-zinc-800/60 font-bold">
                <tr>
                  <th className="py-3.5 px-5">ORDEM</th>
                  <th className="py-3.5 px-5">CLIENTE</th>
                  <th className="py-3.5 px-5">APARELHO / SERVIÇO</th>
                  <th className="py-3.5 px-5">ENTRADA</th>
                  <th className="py-3.5 px-5 text-center">STATUS</th>
                  <th className="py-3.5 px-5 text-right">VALOR</th>
                  <th className="py-3.5 px-5 text-center">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {ordensFiltradas.map((os) => {
                  const valor = Number(
                    os.orcamentoCalculado?.valorTotalOrcamento || (os as any).valor_total || 0
                  );

                  return (
                    <tr key={os.id_os} className="hover:bg-zinc-800/20 transition">
                      <td className="py-4 px-5 font-bold text-blue-400 font-mono">
                        {os.numero_os}
                      </td>

                      <td className="py-4 px-5">
                        <p className="font-bold text-white text-xs">{os.cliente?.nome || 'Cliente Balcão'}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{os.cliente?.whatsapp || 'Sem telefone'}</p>
                      </td>

                      <td className="py-4 px-5">
                        <p className="font-semibold text-zinc-200 text-xs">
                          {os.aparelho?.modelo || 'Smartphone'}
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[220px]">
                          {os.servicoRealizado || os.defeitoRelatado || 'Manutenção geral'}
                        </p>
                      </td>

                      <td className="py-4 px-5 text-zinc-400 font-medium">
                        {formatarDataTabela(os.data_abertura)}
                      </td>

                      <td className="py-4 px-5 text-center">
                        {renderStatusBadge(os.status_os)}
                      </td>

                      <td className="py-4 px-5 text-right font-extrabold text-white">
                        R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => {
                              setOsDetalhes(os);
                              setAbaDetalhes('info');
                            }}
                            title="Visualizar detalhes da OS"
                            className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => setOsParaExcluir(os)}
                            title="Excluir ordem de serviço"
                            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL: VISUALIZAR DETALHES DA OS (FIGMA) ================= */}
      {osDetalhes && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b0f19] border border-zinc-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
            {/* Topo do Modal */}
            <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-bold text-white">
                    Ordem de serviço <span className="text-blue-400 font-mono">{osDetalhes.numero_os}</span>
                  </h3>
                  {renderStatusBadge(osDetalhes.status_os)}
                </div>
                <p className="text-xs text-zinc-400 mt-1 font-medium">
                  {osDetalhes.cliente?.nome} · {osDetalhes.aparelho?.modelo}
                </p>
              </div>

              {/* Botões do Topo */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    abrirEdicao(osDetalhes);
                    setOsDetalhes(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-amber-600/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span>Editar OS</span>
                </button>

                <button
                  onClick={() => setOsImprimir(osDetalhes)}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Imprimir / PDF</span>
                </button>

                <button
                  onClick={() => setOsDetalhes(null)}
                  className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Abas */}
            <div className="flex border-b border-zinc-800/80 px-6 space-x-8 text-xs font-bold">
              <button
                onClick={() => setAbaDetalhes('info')}
                className={`py-3.5 transition-all border-b-2 ${
                  abaDetalhes === 'info'
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Informações e orçamento
              </button>
              <button
                onClick={() => setAbaDetalhes('checklist')}
                className={`py-3.5 transition-all border-b-2 ${
                  abaDetalhes === 'checklist'
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Checklist de entrada
              </button>
              <button
                onClick={() => setAbaDetalhes('timeline')}
                className={`py-3.5 transition-all border-b-2 ${
                  abaDetalhes === 'timeline'
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Linha do tempo
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5 text-xs">
              {abaDetalhes === 'info' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#0e1320] border border-zinc-800/80 p-4 rounded-xl">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        DATA DE ABERTURA
                      </p>
                      <h4 className="text-sm font-bold text-white mt-1">
                        {osDetalhes.data_abertura ? new Date(osDetalhes.data_abertura).toLocaleDateString('pt-BR') : 'Não informada'}
                      </h4>
                    </div>

                    <div className="bg-[#0e1320] border border-zinc-800/80 p-4 rounded-xl">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        FORMA DE PAGAMENTO
                      </p>
                      <h4 className="text-sm font-bold text-white mt-1">
                        {(osDetalhes as any).formaPagamento || (osDetalhes as any).forma_pagamento || 'Cartão de crédito'} · {(osDetalhes as any).parcelas || 1}x
                      </h4>
                    </div>

                    <div className="bg-[#0e1320] border border-zinc-800/80 p-4 rounded-xl">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        PREVISÃO DE CONCLUSÃO
                      </p>
                      <h4 className="text-sm font-bold text-white mt-1">
                        {osDetalhes.data_conclusao ? new Date(osDetalhes.data_conclusao).toLocaleDateString('pt-BR') : 'Em andamento'}
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#0e1320] border border-zinc-800/80 p-4 rounded-xl">
                      <div className="flex items-center space-x-2 text-zinc-400 mb-2">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-[10px] font-bold uppercase tracking-wider">INFORMAÇÕES DO CLIENTE</span>
                      </div>
                      <p className="text-sm font-bold text-white">{osDetalhes.cliente?.nome}</p>
                      <p className="text-zinc-400 mt-1">WhatsApp: <span className="text-zinc-200">{osDetalhes.cliente?.whatsapp || 'Não informado'}</span></p>
                      <p className="text-zinc-400">CPF/CNPJ: <span className="text-zinc-200">{osDetalhes.cliente?.cpfCnpj || 'Não informado'}</span></p>
                    </div>

                    <div className="bg-[#0e1320] border border-zinc-800/80 p-4 rounded-xl">
                      <div className="flex items-center space-x-2 text-zinc-400 mb-2">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="5" y="2" width="14" height="20" rx="3" ry="3" />
                          <line x1="12" y1="18" x2="12" y2="18.01" />
                        </svg>
                        <span className="text-[10px] font-bold uppercase tracking-wider">INFORMAÇÕES DO APARELHO</span>
                      </div>
                      <p className="text-sm font-bold text-white">{osDetalhes.aparelho?.modelo}</p>
                      <p className="text-zinc-400 mt-1">IMEI / Série: <span className="text-zinc-200">{osDetalhes.aparelho?.imei1 || 'Não informado'}</span></p>
                      <p className="text-zinc-400">Senha: <span className="text-zinc-200">{osDetalhes.aparelho?.senhaDesbloqueio || 'Não informada'}</span></p>
                    </div>
                  </div>

                  <div className="bg-[#0e1320] border border-zinc-800/80 p-5 rounded-xl space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        DEFEITO RELATADO PELO CLIENTE
                      </p>
                      <p className="text-zinc-200 leading-relaxed font-medium">
                        {osDetalhes.defeitoRelatado || 'Nenhum defeito específico relatado.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-800/60">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        DIAGNÓSTICO TÉCNICO
                      </p>
                      <p className="text-zinc-200 leading-relaxed font-medium">
                        {osDetalhes.diagnostico || 'Aguardando diagnóstico técnico da bancada.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-800/60">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        OBSERVAÇÕES INTERNAS
                      </p>
                      <p className="text-zinc-400 leading-relaxed">
                        {osDetalhes.observacoes || 'Sem observações adicionais.'}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {abaDetalhes === 'checklist' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(labelsChecklist).map(([chave, rotulo]) => {
                    const status = osDetalhes.checklistEntrada?.[chave] || 'NÃO TESTADO';
                    const isOk = status === 'OK';
                    const isDefeito = status === 'DEFEITO';
                    return (
                      <div key={chave} className="bg-[#0e1320] border border-zinc-800/80 p-3.5 rounded-xl flex items-center justify-between">
                        <span className="font-medium text-zinc-300">{rotulo}</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isOk
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isDefeito
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {abaDetalhes === 'timeline' && (
                <div className="space-y-4 p-2">
                  <div className="flex items-start space-x-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-bold text-white">Ordem Criada</p>
                      <p className="text-[11px] text-zinc-400">
                        {osDetalhes.data_abertura ? new Date(osDetalhes.data_abertura).toLocaleString('pt-BR') : 'Data não registrada'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-bold text-white">Status Atual</p>
                      <p className="text-[11px] text-zinc-400">Classificado como {osDetalhes.status_os}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé Detalhes */}
            <div className="p-4 border-t border-zinc-800/80 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">
                Acesso e controle protegido
              </span>
              <button
                onClick={() => setOsDetalhes(null)}
                className="px-5 py-2 bg-[#0e1320] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDITAR ORDEM (3 ETAPAS DO FIGMA) ================= */}
      {osEditando && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b0f19] border border-zinc-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
            <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Editar ordem <span className="text-blue-400 font-mono">{osEditando.numero_os}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1 font-medium">
                  {editNome || 'Cliente'} · {editModelo || 'Aparelho'}
                </p>
              </div>
              <button
                onClick={() => setOsEditando(null)}
                className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="flex border-b border-zinc-800/80 px-6 space-x-8 text-xs font-bold">
              <button
                onClick={() => setAbaEdicao('geral')}
                className={`py-3.5 transition-all border-b-2 ${
                  abaEdicao === 'geral'
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                01 Dados gerais e aparelho
              </button>
              <button
                onClick={() => setAbaEdicao('custos')}
                className={`py-3.5 transition-all border-b-2 ${
                  abaEdicao === 'custos'
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                02 Custos e pagamento
              </button>
              <button
                onClick={() => setAbaEdicao('checklist')}
                className={`py-3.5 transition-all border-b-2 ${
                  abaEdicao === 'checklist'
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                03 Checklist de entrada
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4 text-xs">
              {/* ETAPA 1 */}
              {abaEdicao === 'geral' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        NOME DO CLIENTE
                      </label>
                      <input
                        type="text"
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        WHATSAPP
                      </label>
                      <input
                        type="text"
                        value={editWhatsapp}
                        onChange={(e) => setEditWhatsapp(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        CPF / CNPJ
                      </label>
                      <input
                        type="text"
                        value={editCpfCnpj}
                        onChange={(e) => setEditCpfCnpj(e.target.value)}
                        placeholder="Não informado"
                        className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        MODELO DO APARELHO
                      </label>
                      <input
                        type="text"
                        value={editModelo}
                        onChange={(e) => setEditModelo(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        IMEI / NÚMERO DE SÉRIE
                      </label>
                      <input
                        type="text"
                        value={editImei}
                        onChange={(e) => setEditImei(e.target.value)}
                        placeholder="Não informado"
                        className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        SENHA DE DESBLOQUEIO
                      </label>
                      <input
                        type="text"
                        value={editSenha}
                        onChange={(e) => setEditSenha(e.target.value)}
                        placeholder="Não informada"
                        className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        DATA DE ABERTURA
                      </label>
                      <input
                        type="date"
                        value={editDataAbertura}
                        onChange={(e) => setEditDataAbertura(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        STATUS DA OS
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as StatusOS)}
                        className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                      >
                        <option value="AGUARDANDO_AVALIACAO">Aguardando Avaliação</option>
                        <option value="EM_ANALISE">Em Diagnóstico</option>
                        <option value="EM_MANUTENCAO">Em Bancada</option>
                        <option value="AGUARDANDO_PECA">Aguardando Peça</option>
                        <option value="PRONTO">Pronto para Retirada</option>
                        <option value="ENTREGUE">Entregue</option>
                        <option value="CANCELADO">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        DEFEITO RELATADO
                      </label>
                      <textarea
                        rows={3}
                        value={editDefeito}
                        onChange={(e) => setEditDefeito(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        DIAGNÓSTICO TÉCNICO
                      </label>
                      <textarea
                        rows={3}
                        value={editDiagnostico}
                        onChange={(e) => setEditDiagnostico(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ETAPA 2 */}
              {abaEdicao === 'custos' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        FORMA DE PAGAMENTO
                      </label>
                      <select
                        value={editFormaPgto}
                        onChange={(e) => setEditFormaPgto(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                      >
                        <option value="Cartão de crédito">Cartão de crédito</option>
                        <option value="Cartão de débito">Cartão de débito</option>
                        <option value="PIX">PIX</option>
                        <option value="Dinheiro">Dinheiro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        PARCELAS
                      </label>
                      <select
                        value={editParcelas}
                        onChange={(e) => setEditParcelas(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 10, 12].map((p) => (
                          <option key={p} value={p}>
                            {p}x {p === 1 ? '(à vista)' : '(sem juros)'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        VALOR COBRADO
                      </label>
                      <input
                        type="number"
                        value={editValorCobrado}
                        onChange={(e) => setEditValorCobrado(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white font-bold outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        VALOR LÍQUIDO
                      </label>
                      <input
                        type="number"
                        value={editValorLiquido}
                        onChange={(e) => setEditValorLiquido(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-purple-400 font-bold outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        CUSTO DA PEÇA
                      </label>
                      <input
                        type="number"
                        value={editCustoPeca}
                        onChange={(e) => setEditCustoPeca(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        FRETE REAL
                      </label>
                      <input
                        type="number"
                        value={editFrete}
                        onChange={(e) => setEditFrete(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        TIPO DE DESCONTO
                      </label>
                      <select
                        value={editTipoDesconto}
                        onChange={(e) => setEditTipoDesconto(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                      >
                        <option value="VALOR">Valor (R$)</option>
                        <option value="PERCENTUAL">Porcentagem (%)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        DESCONTO
                      </label>
                      <input
                        type="number"
                        value={editDesconto}
                        onChange={(e) => setEditDesconto(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                    Ao alterar pagamento, parcelas ou desconto, confira o valor líquido repassado pela maquineta antes de salvar.
                  </div>
                </div>
              )}

              {/* ETAPA 3 */}
              {abaEdicao === 'checklist' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {Object.entries(labelsChecklist).map(([chave, rotulo]) => (
                    <div key={chave}>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                        {rotulo}
                      </label>
                      <select
                        value={editChecklist[chave] || 'OK'}
                        onChange={(e) =>
                          setEditChecklist({ ...editChecklist, [chave]: e.target.value })
                        }
                        className="w-full px-3.5 py-2 bg-[#080c14] border border-zinc-800 rounded-xl text-white text-xs outline-none focus:border-blue-500"
                      >
                        <option value="OK">OK</option>
                        <option value="DEFEITO">DEFEITO</option>
                        <option value="Com observação">Com observação</option>
                        <option value="NÃO TESTADO">NÃO TESTADO</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-800/80 flex items-center justify-between">
              <button
                onClick={() => setOsEditando(null)}
                className="text-xs font-semibold text-zinc-400 hover:text-white transition"
              >
                Cancelar edição
              </button>

              <button
                onClick={handleSalvarEdicao}
                disabled={salvandoEdicao}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-600/25 flex items-center space-x-1.5"
              >
                {salvandoEdicao ? (
                  <span>Salvando...</span>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Salvar alterações</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EXCLUSÃO ================= */}
      {osParaExcluir && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Excluir Ordem de Serviço?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Tem certeza que deseja excluir a ordem{' '}
              <strong className="text-white font-mono">{osParaExcluir.numero_os}</strong>? Esta ação é irreversível.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                onClick={() => setOsParaExcluir(null)}
                className="px-4 py-2 bg-[#080c14] border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarExclusao}
                disabled={excluindo}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition"
              >
                {excluindo ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= COMPONENTE DE IMPRESSÃO / PDF ================= */}
      {osImprimir && (
        <CertidaoGarantia os={osImprimir} onClose={() => setOsImprimir(null)} />
      )}
    </div>
  );
};