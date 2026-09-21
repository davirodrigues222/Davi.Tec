import React, { useState, useEffect } from 'react';
import { buscarOrdensServico } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import type { OrdemServico } from '../types';

interface DashboardProps {
  onNovaOS?: () => void; // Prop opcional para acionar a navegação para Nova OS
}

export const Dashboard: React.FC<DashboardProps> = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');

  const carregarOrdens = async () => {
    setLoading(true);
    try {
      const data = await buscarOrdensServico();
      setOrdens(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar Dashboard:', err);
      setOrdens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarOrdens();
  }, []);

  const listaOrdens = Array.isArray(ordens) ? ordens : [];

  const osNaBancada = listaOrdens.filter((os) =>
    ['AGUARDANDO_AVALIACAO', 'EM_ANALISE', 'EM_MANUTENCAO'].includes(os?.status_os)
  ).length;

  const faturamentoBruto = listaOrdens.reduce(
    (acc, os) => acc + (os?.orcamentoCalculado?.valorTotalOrcamento || 0),
    0
  );

  const custosTotais = listaOrdens.reduce((acc, os) => {
    const peca = os?.orcamentoCalculado?.custoPeca || 0;
    const frete = os?.orcamentoCalculado?.freteReal || 0;
    const custoGarantia = os?.garantia?.custoPecaGarantia || os?.garantia?.prejuizoTotalGarantia || 0;
    return acc + peca + frete + custoGarantia;
  }, 0);

  const lucroLiquidoReal = faturamentoBruto - custosTotais;
  const aparelhosProntos = listaOrdens.filter((os) => os?.status_os === 'PRONTO').length;

  const ordensFiltradas = listaOrdens.filter((os) => {
    if (!os) return false;
    const termo = termoBusca.toLowerCase();
    const numeroOs = os.numero_os ? os.numero_os.toLowerCase() : '';
    const nomeCliente = os.cliente?.nome ? os.cliente.nome.toLowerCase() : '';
    const modeloAparelho = os.aparelho?.modelo ? os.aparelho.modelo.toLowerCase() : '';

    const bateBusca = numeroOs.includes(termo) || nomeCliente.includes(termo) || modeloAparelho.includes(termo);
    const bateStatus = filtroStatus === 'TODOS' || os.status_os === filtroStatus;
    return bateBusca && bateStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-400 font-medium tracking-wide">Carregando métricas da bancada...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12 animate-fade-in">
      
      {/* 1. CABEÇALHO REFINADO DO DASHBOARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/60">
        <div>
          <span className="text-[11px] font-semibold text-zinc-500 tracking-wider uppercase">Davi.tec / Visão Geral</span>
          <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">Painel de Controle</h1>
        </div>
      </div>

      {/* 2. CARDS DE MÉTRICAS (SOFT UI / BORDERLESS COM TIPOGRAFIA HIERÁRQUICA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Na Bancada */}
        <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/30 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-6 transition-all shadow-xl shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Na Bancada</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">
              🛠️
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-white tracking-tight">{osNaBancada}</h3>
            <p className="text-[11px] text-zinc-500 mt-1 font-medium">Aparelhos em execução ativa</p>
          </div>
        </div>

        {/* Card 2: Faturamento & Lucro Real */}
        <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/30 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-6 transition-all shadow-xl shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Faturamento Bruto</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
              📈
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-white tracking-tight">R$ {faturamentoBruto.toFixed(2)}</h3>
            <div className="flex items-center space-x-2 mt-1.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${lucroLiquidoReal >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                Lucro: R$ {lucroLiquidoReal.toFixed(2)}
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">Custos: R$ {custosTotais.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Aparelhos Prontos */}
        <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/30 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-6 transition-all shadow-xl shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Prontos p/ Retirada</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
              📦
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-white tracking-tight">{aparelhosProntos}</h3>
            <p className="text-[11px] text-zinc-500 mt-1 font-medium">Aguardando cliente buscar</p>
          </div>
        </div>

        {/* Card 4: Total de OS */}
        <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/30 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-6 transition-all shadow-xl shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Volume Total</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-sm">
              📋
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-blue-400 tracking-tight">{listaOrdens.length}</h3>
            <p className="text-[11px] text-zinc-500 mt-1 font-medium">Atendimentos registrados</p>
          </div>
        </div>

      </div>

      {/* 4. SEÇÃO DA TABELA DE ORDENS DE SERVIÇO COM BARRA DE FILTROS OTIMIZADA */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
        
        {/* Barra de Ferramentas / Filtros Acima da Tabela */}
        <div className="p-6 border-b border-zinc-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Ordens de Serviço em Andamento</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Monitore o status e gerencie os atendimentos ativos na bancada.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Barra de Busca Mais Longa e Visível */}
            <div className="relative min-w-[280px]">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                🔍
              </span>
              <input
                type="text"
                placeholder="Buscar por cliente, modelo ou nº da OS..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition shadow-inner"
              />
            </div>

            {/* Filtro de Status */}
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-300 outline-none focus:border-blue-500 cursor-pointer font-medium"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="AGUARDANDO_AVALIACAO">Aguardando Avaliação</option>
              <option value="EM_ANALISE">Em Análise</option>
              <option value="AGUARDANDO_PECA">Aguardando Peça</option>
              <option value="EM_MANUTENCAO">Em Manutenção</option>
              <option value="PRONTO">Pronto</option>
              <option value="ENTREGUE">Entregue</option>
            </select>

            {/* Botão de Atualizar em Forma de Ícone de Refresh */}
            <button
              onClick={carregarOrdens}
              className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs transition shadow-sm flex items-center justify-center"
              title="Atualizar dados da bancada"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Tabela com Padding Aumentado (Espaçamento Interno Confortável) */}
        {ordensFiltradas.length === 0 ? (
          <div className="p-20 text-center space-y-3">
            <div className="text-3xl">📂</div>
            <h3 className="text-sm font-bold text-zinc-300">Nenhuma Ordem Encontrada</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">Não há registros correspondentes aos filtros selecionados na bancada atual.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/90 text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 font-bold text-[10px]">
                <tr>
                  <th className="py-4 px-6">Nº OS</th>
                  <th className="py-4 px-6">Cliente</th>
                  <th className="py-4 px-6">Aparelho / Modelo</th>
                  <th className="py-4 px-6">Defeito Relatado</th>
                  <th className="py-4 px-6">Status da Bancada</th>
                  <th className="py-4 px-6 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {ordensFiltradas.map((os) => (
                  <tr key={os.id_os} className="hover:bg-zinc-800/20 transition-colors group">
                    <td className="py-4 px-6 font-mono font-bold text-blue-400">
                      {os.numero_os}
                    </td>
                    <td className="py-4 px-6 font-bold text-white">
                      {os.cliente?.nome}
                      <span className="block text-[10px] text-zinc-500 font-normal mt-0.5">{os.cliente?.whatsapp || 'Sem contato'}</span>
                    </td>
                    <td className="py-4 px-6 font-medium text-zinc-200">
                      {os.aparelho?.modelo}
                    </td>
                    <td className="py-4 px-6 max-w-xs truncate text-zinc-400 font-normal">
                      {os.defeitoRelatado || 'Não especificado'}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={os.status_os} />
                    </td>
                    <td className="py-4 px-6 text-right font-extrabold text-white text-sm">
                      R$ {(os.orcamentoCalculado?.valorTotalOrcamento || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};