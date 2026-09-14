import React, { useState, useEffect } from 'react';
import { buscarOrdensServico } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import type { OrdemServico } from '../types';

export const Dashboard: React.FC = () => {
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

  // CÁLCULOS FINANCEIROS TRANSPARENTES
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
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-400 font-medium">Carregando dados da bancada...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Na Bancada</span>
          <h3 className="text-2xl font-black text-white mt-2">{osNaBancada}</h3>
          <p className="text-[11px] text-zinc-500 mt-1">Serviços em andamento</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Faturamento / Lucro Real</span>
          <h3 className="text-2xl font-black text-white mt-2">R$ {faturamentoBruto.toFixed(2)}</h3>
          <span className={`text-[11px] font-semibold block mt-1 ${lucroLiquidoReal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            Lucro Real: R$ {lucroLiquidoReal.toFixed(2)} (Custos: R$ {custosTotais.toFixed(2)})
          </span>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Aparelhos Prontos</span>
          <h3 className="text-2xl font-black text-white mt-2">{aparelhosProntos}</h3>
          <p className="text-[11px] text-zinc-500 mt-1">Aguardando retirada</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Total de OS</span>
            <h3 className="text-2xl font-black text-blue-400 mt-2">{listaOrdens.length}</h3>
          </div>
          <button
            onClick={carregarOrdens}
            className="p-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition"
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-white">Ordens de Serviço em Andamento</h3>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Buscar cliente, modelo, OS..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-500"
            />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="AGUARDANDO_AVALIACAO">Aguardando Avaliação</option>
              <option value="EM_ANALISE">Em Análise</option>
              <option value="AGUARDANDO_PECA">Aguardando Peça</option>
              <option value="EM_MANUTENCAO">Em Manutenção</option>
              <option value="PRONTO">Pronto</option>
              <option value="ENTREGUE">Entregue</option>
            </select>
          </div>
        </div>

        {ordensFiltradas.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <h3 className="text-sm font-bold text-zinc-300">Nenhuma Ordem Encontrada</h3>
            <p className="text-xs text-zinc-500">Cadastre uma nova OS para começar a monitorar a bancada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase border-b border-zinc-800 font-semibold">
                <tr>
                  <th className="p-4">Nº OS</th>
                  <th className="p-4">Cliente / Contato</th>
                  <th className="p-4">Aparelho / Modelo</th>
                  <th className="p-4">Defeito Relatado</th>
                  <th className="p-4">Status Bancada</th>
                  <th className="p-4 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {ordensFiltradas.map((os) => (
                  <tr key={os.id_os} className="hover:bg-zinc-800/30 transition">
                    <td className="p-4 font-mono font-bold text-blue-400">{os.numero_os}</td>
                    <td className="p-4 font-bold text-white">{os.cliente?.nome}</td>
                    <td className="p-4 font-medium text-zinc-200">{os.aparelho?.modelo}</td>
                    <td className="p-4 max-w-xs truncate text-zinc-400">{os.defeitoRelatado}</td>
                    {/* STATUS SOMENTE LEITURA */}
                    <td className="p-4">
                      <StatusBadge status={os.status_os} />
                    </td>
                    <td className="p-4 text-right font-bold text-white">
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