import React, { useState, useEffect, useMemo } from 'react';
import { buscarOrdensServico } from '../services/api';
import type { OrdemServico } from '../types';

export const Relatorios: React.FC = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('TODOS');
  const [dataInicio] = useState<string>('');
  const [dataFim] = useState<string>('');

  const carregarRelatorios = async () => {
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

  useEffect(() => {
    carregarRelatorios();
  }, []);

  const ordensFiltradas = useMemo(() => {
    if (filtroPeriodo === 'TODOS') return ordens;

    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    return ordens.filter((os: any) => {
      const dataStr = os.data_abertura || os.dataAbertura;
      if (!dataStr) return true;
      const dataOS = new Date(dataStr);

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

  const faturamentoBrutoTotal = ordensFiltradas.reduce((acc, os: any) => {
    return acc + Number(os.orcamentoCalculado?.valorTotalOrcamento || os.valor_total || 0);
  }, 0);

  const faturamentoLiquidoTotal = ordensFiltradas.reduce((acc, os: any) => {
    const valorBruto = Number(os.orcamentoCalculado?.valorTotalOrcamento || os.valor_total || 0);
    const valorLiq = os.valorLiquido !== undefined && os.valorLiquido !== null && os.valorLiquido !== '' 
      ? Number(os.valorLiquido) 
      : valorBruto;
    return acc + valorLiq;
  }, 0);
  
  const custosPecas = ordensFiltradas.reduce((acc, os: any) => acc + Number(os.orcamentoCalculado?.custoPeca || os.custo_peca || 0), 0);
  const custosFrete = ordensFiltradas.reduce((acc, os: any) => acc + Number(os.orcamentoCalculado?.freteReal || os.frete_real || 0), 0);
  
  // CAPTURA UNIVERSAL E BLINDADA DE GARANTIAS (Lê de todas as estruturas possíveis)
  const custosGarantias = ordensFiltradas.reduce((acc, os: any) => {
    const valorGarantia = Number(
      os.orcamentoCalculado?.custoPecaGarantia || 
      os.garantia?.custoPecaGarantia || 
      os.garantia?.custoTotalGarantia || 
      os.custo_peca_garantia || 
      0
    );
    return acc + valorGarantia;
  }, 0);

  const ordensComGarantia = ordensFiltradas.filter((os: any) => {
    const temGarantiaJson = os.possuiGarantiaRegistrada || os.garantia || os.garantia_json;
    const temValorGarantia = Number(os.orcamentoCalculado?.custoPecaGarantia || os.garantia?.custoPecaGarantia || os.custo_peca_garantia || 0) > 0;
    return temGarantiaJson || temValorGarantia;
  });
  
  const totalVoltasGarantia = ordensFiltradas.reduce((acc, os: any) => {
    return acc + Number(os.garantia?.totalVoltas || (os.garantia || os.custo_peca_garantia ? 1 : 0));
  }, 0);

  // Custos Operacionais somam obrigatoriamente Peças + Fretes + Garantias
  const custosTotais = custosPecas + custosFrete + custosGarantias;

  // LUCRO REAL LÍQUIDO = FATURAMENTO LÍQUIDO − CUSTOS TOTAIS
  const lucroLiquidoReal = faturamentoLiquidoTotal - custosTotais;

  const ticketMedio = ordensFiltradas.length > 0 ? faturamentoLiquidoTotal / ordensFiltradas.length : 0;
  
  const ordensComPrejuizo = ordensFiltradas.filter((os: any) => {
    const valorBruto = Number(os.orcamentoCalculado?.valorTotalOrcamento || os.valor_total || 0);
    const cobrado = os.valorLiquido !== undefined && os.valorLiquido !== null && os.valorLiquido !== '' 
      ? Number(os.valorLiquido) 
      : valorBruto;
    const custoPecaOs = Number(os.orcamentoCalculado?.custoPeca || 0);
    const custoFreteOs = Number(os.orcamentoCalculado?.freteReal || 0);
    const custoGarantiaOs = Number(os.orcamentoCalculado?.custoPecaGarantia || 0);
    const custoTotalOs = custoPecaOs + custoFreteOs + custoGarantiaOs;
    return (cobrado - custoTotalOs) < 0;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-400 font-medium tracking-wide">Carregando auditoria financeira...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto text-xs text-zinc-300 pb-12">
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <span className="text-[11px] font-semibold text-zinc-500 tracking-wider uppercase">Davi.tec / Inteligência Financeira</span>
          <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">Análise Financeira & Relatórios</h2>
          <p className="text-xs text-zinc-400 mt-1">Auditoria real de custos, lucros e faturamento líquido da assistência técnica.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 shadow-inner">
            <span className="text-zinc-500 mr-2 text-xs">📅</span>
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 outline-none font-bold cursor-pointer"
            >
              <option value="TODOS" className="bg-zinc-900">Todos os Registros (Geral)</option>
              <option value="HOJE" className="bg-zinc-900">Hoje</option>
              <option value="ULTIMOS_7_DIAS" className="bg-zinc-900">Últimos 7 dias</option>
              <option value="ESTE_MES" className="bg-zinc-900">Este mês</option>
              <option value="MES_ANTERIOR" className="bg-zinc-900">Mês anterior</option>
              <option value="ULTIMOS_3_MESES" className="bg-zinc-900">Últimos 3 meses</option>
              <option value="ESTE_ANO" className="bg-zinc-900">Este ano</option>
              <option value="CUSTOM" className="bg-zinc-900">Período personalizado</option>
            </select>
          </div>

          <button
            onClick={carregarRelatorios}
            className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs transition shadow-sm flex items-center justify-center"
            title="Atualizar dados financeiros"
          >
            🔄
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Faturamento Bruto</span>
            <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs">📊</div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-white tracking-tight">R$ {faturamentoBrutoTotal.toFixed(2)}</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">Soma de {ordensFiltradas.length} OS(s)</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Faturamento Líquido</span>
            <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs">💰</div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-white tracking-tight">R$ {faturamentoLiquidoTotal.toFixed(2)}</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">Com descontos aplicados</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Custos Operacionais</span>
            <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center text-xs">📉</div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-white tracking-tight">R$ {custosTotais.toFixed(2)}</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">Peças + Fretes + Garantias</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-950/40 via-zinc-900/90 to-zinc-900/80 border border-emerald-500/30 rounded-2xl p-5 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Lucro Real Líquido</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs">💎</div>
          </div>
          <div className="mt-3 relative z-10">
            <h3 className={`text-2xl font-black tracking-tight ${lucroLiquidoReal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {lucroLiquidoReal.toFixed(2)}
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">Faturamento − Custos</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Ticket Médio</span>
            <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs">📈</div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-white tracking-tight">R$ {ticketMedio.toFixed(2)}</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">Média por atendimento</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-sm">🛡️</span>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Custos de Garantia / Retorno</h4>
            </div>
            <p className="text-[11px] text-zinc-400">
              Total de OS com retorno / Voltas registadas: <strong className="text-white">{ordensComGarantia.length} OS ({totalVoltasGarantia} voltas)</strong>
            </p>
          </div>
          <div className="text-right">
            {custosGarantias === 0 ? (
              <span className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ✨ Zero Garantias
              </span>
            ) : (
              <span className="text-sm font-black text-rose-400">
                R$ {custosGarantias.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-sm">⚠️</span>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Auditoria de Prejuízos</h4>
            </div>
            <p className="text-[11px] text-zinc-400">
              Serviços onde o custo total superou o valor cobrado.
            </p>
          </div>
          <div className="text-right">
            {ordensComPrejuizo.length === 0 ? (
              <span className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ✨ Excelente (0 Prejuízos)
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {ordensComPrejuizo.length} OS no Vermelho
              </span>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};