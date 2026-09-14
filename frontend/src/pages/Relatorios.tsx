import React, { useState, useEffect, useMemo } from 'react';
import { buscarOrdensServico } from '../services/api';
import type { OrdemServico } from '../types';

export const Relatorios: React.FC = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('ESTE_MES');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');

  useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      try {
        const data = await buscarOrdensServico();
        setOrdens(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erro ao buscar relatórios:', err);
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  // FILTRAGEM DE DATAS RIGOROSA
  const ordensFiltradas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    return ordens.filter((os) => {
      if (!os.data_abertura) return false;
      const dataOS = new Date(os.data_abertura);

      if (filtroPeriodo === 'HOJE') {
        const inicioHoje = new Date();
        inicioHoje.setHours(0, 0, 0, 0);
        return dataOS >= inicioHoje && dataOS <= hoje;
      }

      if (filtroPeriodo === 'ULTIMOS_7_DIAS') {
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
        seteDiasAtras.setHours(0, 0, 0, 0);
        return dataOS >= seteDiasAtras && dataOS <= hoje;
      }

      if (filtroPeriodo === 'ESTE_MES') {
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        return dataOS >= inicioMes && dataOS <= hoje;
      }

      if (filtroPeriodo === 'MES_ANTERIOR') {
        const inicioMesAnt = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const fimMesAnt = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59);
        return dataOS >= inicioMesAnt && dataOS <= fimMesAnt;
      }

      if (filtroPeriodo === 'ULTIMOS_3_MESES') {
        const tresMesesAtras = new Date();
        tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
        tresMesesAtras.setHours(0, 0, 0, 0);
        return dataOS >= tresMesesAtras && dataOS <= hoje;
      }

      if (filtroPeriodo === 'ESTE_ANO') {
        const inicioAno = new Date(hoje.getFullYear(), 0, 1);
        return dataOS >= inicioAno && dataOS <= hoje;
      }

      if (filtroPeriodo === 'CUSTOM') {
        if (!dataInicio || !dataFim) return true;
        const dIni = new Date(`${dataInicio}T00:00:00`);
        const dFim = new Date(`${dataFim}T23:59:59`);
        return dataOS >= dIni && dataOS <= dFim;
      }

      return true;
    });
  }, [ordens, filtroPeriodo, dataInicio, dataFim]);

  // CÁLCULOS RIGOROSOS DE RELATÓRIO
  const faturamentoTotal = ordensFiltradas.reduce((acc, os) => acc + (os.orcamentoCalculado?.valorTotalOrcamento || 0), 0);
  
  const custosPecas = ordensFiltradas.reduce((acc, os) => acc + (os.orcamentoCalculado?.custoPeca || 0), 0);
  const custosFrete = ordensFiltradas.reduce((acc, os) => acc + (os.orcamentoCalculado?.freteReal || 0), 0);
  
  const ordensComGarantia = ordensFiltradas.filter(os => os.garantia?.houveGarantia);
  const custosGarantia = ordensComGarantia.reduce((acc, os) => acc + (os.garantia?.custoPecaGarantia || os.garantia?.prejuizoTotalGarantia || 0), 0);

  const custosTotais = custosPecas + custosFrete + custosGarantia;
  const lucroLiquidoReal = faturamentoTotal - custosTotais;

  const ticketMedio = ordensFiltradas.length > 0 ? faturamentoTotal / ordensFiltradas.length : 0;
  const ordensComPrejuizo = ordensFiltradas.filter(os => {
    const cobrado = os.orcamentoCalculado?.valorTotalOrcamento || 0;
    const custoOs = (os.orcamentoCalculado?.custoPeca || 0) + (os.orcamentoCalculado?.freteReal || 0) + (os.garantia?.custoPecaGarantia || 0);
    return (cobrado - custoOs) < 0;
  });

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Análise Financeira & Relatórios</h2>
          <p className="text-xs text-zinc-400">Auditoria real de custos, lucros e faturamento da assistência.</p>
        </div>

        {/* CONTROLE DE FILTROS DE DATA */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none"
          >
            <option value="HOJE">Hoje</option>
            <option value="ULTIMOS_7_DIAS">Últimos 7 dias</option>
            <option value="ESTE_MES">Este mês</option>
            <option value="MES_ANTERIOR">Mês anterior</option>
            <option value="ULTIMOS_3_MESES">Últimos 3 meses</option>
            <option value="ESTE_ANO">Este ano</option>
            <option value="CUSTOM">Período personalizado</option>
          </select>

          {filtroPeriodo === 'CUSTOM' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
              />
              <span className="text-zinc-500 text-xs">até</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* CARDS METRICAS GERAIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Faturamento Total</span>
              <h3 className="text-2xl font-black text-white mt-2">R$ {faturamentoTotal.toFixed(2)}</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Soma de valores cobrados</p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Custos Operacionais</span>
              <h3 className="text-2xl font-black text-rose-400 mt-2">R$ {custosTotais.toFixed(2)}</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Peças + Fretes + Garantia</p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Lucro Real Líquido</span>
              <h3 className={`text-2xl font-black mt-2 ${lucroLiquidoReal >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                R$ {lucroLiquidoReal.toFixed(2)}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1">Faturamento − Custos</p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ticket Médio</span>
              <h3 className="text-2xl font-black text-blue-400 mt-2">R$ {ticketMedio.toFixed(2)}</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Por ordem de serviço</p>
            </div>
          </div>

          {/* AUDITORIA DE GARANTIAS & PREJUÍZOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Custos de Garantia / Retorno</h4>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Total de OS em Garantia:</span>
                <span className="text-xs font-bold text-amber-400">{ordensComGarantia.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Custo Adicional em Garantias:</span>
                <span className="text-xs font-bold text-rose-400">R$ {custosGarantia.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Serviços com Prejuízo</h4>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Quantidade de OS no Vermelho:</span>
                <span className="text-xs font-bold text-rose-400">{ordensComPrejuizo.length}</span>
              </div>
              <p className="text-[11px] text-zinc-500">Serviços onde o custo da peça/frete superou o valor final cobrado.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};