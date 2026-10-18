import React, { useState, useEffect, useMemo } from 'react';
import { buscarOrdensServico, registrarGarantiaOS } from '../services/api';
import type { OrdemServico } from '../types';

export const GarantiaRetorno: React.FC = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [osSelecionada, setOsSelecionada] = useState<OrdemServico | null>(null);

  // Campos do Formulário de Garantia
  const [defeitoApresentado, setDefeitoApresentado] = useState('');
  const [pecaSubstituida, setPecaSubstituida] = useState('');
  const [custoPeca, setCustoPeca] = useState<number | ''>('');
  const [fretePeca, setFretePeca] = useState<number | ''>('');
  const [salvando, setSalvando] = useState(false);

  const carregarOrdens = async () => {
    setLoading(true);
    try {
      const data = await buscarOrdensServico();
      setOrdens(Array.isArray(data) ? data : []);
      // Seleciona a primeira ordem elegível como padrão ao abrir
      if (Array.isArray(data) && data.length > 0 && !osSelecionada) {
        const primeiraElegivel = data.find((os) => os.status_os === 'ENTREGUE' || os.status_os === 'PRONTO');
        if (primeiraElegivel) setOsSelecionada(primeiraElegivel);
      }
    } catch (err) {
      console.error('Erro ao carregar ordens para garantia:', err);
      setOrdens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarOrdens();
  }, []);

  // Regra de Elegibilidade da Garantia (Cobertura ativa e até 90 dias)
  const checarElegibilidade = (os: OrdemServico): { elegivel: boolean; motivo?: string } => {
    if (os.possuiGarantia === false) {
      return { elegivel: false, motivo: 'Serviço cadastrado sem cobertura de garantia.' };
    }
    if (os.data_abertura) {
      const dias = Math.floor(
        (new Date().getTime() - new Date(os.data_abertura).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (dias > 90) {
        return { elegivel: false, motivo: `Garantia expirada há ${dias} dias (limite de 90 dias).` };
      }
    }
    return { elegivel: true };
  };

  // Filtragem da Lista de Ordens
  const ordensFiltradas = useMemo(() => {
    return ordens.filter((os) => {
      const termo = termoBusca.toLowerCase().trim();
      const numOs = (os.numero_os || '').toLowerCase();
      const cli = (os.cliente?.nome || '').toLowerCase();
      const apr = (os.aparelho?.modelo || '').toLowerCase();

      return !termo || numOs.includes(termo) || cli.includes(termo) || apr.includes(termo);
    });
  }, [ordens, termoBusca]);

  // Submissão do Retorno de Garantia
  const handleRegistrarRetorno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osSelecionada) return;

    if (!defeitoApresentado.trim()) {
      alert('Por favor, informe o defeito apresentado no retorno.');
      return;
    }

    setSalvando(true);
    try {
      const numCustoPeca = Number(custoPeca) || 0;
      const numFretePeca = Number(fretePeca) || 0;
      const prejuizoTotal = numCustoPeca + numFretePeca;

      await registrarGarantiaOS(
        osSelecionada.id_os,
        {
          houveGarantia: true,
          dataRetorno: new Date().toISOString(),
          defeitoConstatadoGarantia: defeitoApresentado.trim(),
          pecaSubstituidaGarantia: pecaSubstituida.trim(),
          custoPecaGarantia: numCustoPeca,
          freteGarantia: numFretePeca,
          prejuizoTotalGarantia: prejuizoTotal,
        },
        `Retorno em Garantia: ${defeitoApresentado} (Peça: ${pecaSubstituida || 'N/A'} | Custo: R$ ${numCustoPeca.toFixed(2)} | Frete: R$ ${numFretePeca.toFixed(2)})`
      );

      alert('Retorno de garantia registrado com sucesso! O valor foi debitado no cálculo do lucro real.');
      setDefeitoApresentado('');
      setPecaSubstituida('');
      setCustoPeca('');
      setFretePeca('');
      await carregarOrdens();
    } catch (err: any) {
      console.error('Erro ao registrar garantia:', err);
      alert(`Falha ao registrar garantia: ${err.message || 'Erro inesperado.'}`);
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <div className="w-9 h-9 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs text-zinc-400 font-semibold tracking-wider uppercase">
          Carregando controle de garantias...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto font-sans pb-12">
      {/* ================= CABEÇALHO (FIGMA) ================= */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Garantias e retornos
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Registre retornos dentro do prazo e acompanhe o impacto financeiro.
        </p>
      </div>

      {/* ================= GRADE PRINCIPAL (2 COLUNAS DO FIGMA) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA: SELECIONAR ORDEM CONCLUÍDA */}
        <div className="lg:col-span-4 bg-[#0c101a] border border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-sm">
          <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            SELECIONAR ORDEM CONCLUÍDA
          </span>

          {/* Campo de Busca com Lupa */}
          <div className="relative">
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
              placeholder="Buscar ordem ou cliente..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#080c14] border border-zinc-800/80 rounded-xl text-xs text-white placeholder-zinc-400 outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Lista de Ordens Elegíveis */}
          <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
            {ordensFiltradas.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-8">Nenhuma ordem encontrada.</p>
            ) : (
              ordensFiltradas.map((os) => {
                const { elegivel } = checarElegibilidade(os);
                const isSelected = osSelecionada?.id_os === os.id_os;

                return (
                  <div
                    key={os.id_os}
                    onClick={() => setOsSelecionada(os)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-600/10 shadow-sm'
                        : 'border-zinc-800/80 bg-[#080c14] hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-blue-400 text-xs">
                        {os.numero_os}
                      </span>
                      <span
                        className={`text-[11px] font-semibold ${
                          elegivel ? 'text-emerald-400' : 'text-zinc-400'
                        }`}
                      >
                        {elegivel ? 'Elegível' : 'Inelegível'}
                      </span>
                    </div>

                    <p className="font-bold text-xs text-white truncate">
                      {os.cliente?.nome || 'Cliente Balcão'}
                    </p>

                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {os.aparelho?.modelo || 'Smartphone'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: FORMULÁRIO DO FIGMA */}
        <div className="lg:col-span-8 bg-[#0c101a] border border-zinc-800/80 rounded-2xl p-6 shadow-sm">
          {osSelecionada ? (
            <form onSubmit={handleRegistrarRetorno} className="space-y-5">
              {/* Linha Topo: Ordem Selecionada e Status */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
                <div>
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    ORDEM SELECIONADA
                  </span>
                  <h3 className="text-base font-extrabold text-white font-mono mt-0.5">
                    {osSelecionada.numero_os}
                  </h3>
                </div>

                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {osSelecionada.status_os === 'ENTREGUE' ? 'Entregue' : osSelecionada.status_os}
                  </span>
                </div>
              </div>

              {/* Card Resumo do Atendimento */}
              <div className="p-4 bg-[#080c14] border border-zinc-800/80 rounded-xl space-y-1">
                <p className="text-sm font-bold text-white">
                  {osSelecionada.cliente?.nome} · {osSelecionada.aparelho?.modelo}
                </p>
                <p className="text-xs text-zinc-400">
                  Serviço original: <span className="text-zinc-300 font-medium">{osSelecionada.servicoRealizado || osSelecionada.defeitoRelatado || 'Manutenção geral'}</span>
                </p>
              </div>

              {/* Defeito Apresentado no Retorno */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  DEFEITO APRESENTADO NO RETORNO *
                </label>
                <textarea
                  rows={4}
                  required
                  value={defeitoApresentado}
                  onChange={(e) => setDefeitoApresentado(e.target.value)}
                  placeholder="Descreva o problema relatado nesta volta..."
                  className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800/80 rounded-xl text-xs text-white placeholder-zinc-400 outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Peça Substituída na Garantia */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  PEÇA SUBSTITUÍDA NA GARANTIA
                </label>
                <input
                  type="text"
                  value={pecaSubstituida}
                  onChange={(e) => setPecaSubstituida(e.target.value)}
                  placeholder="Ex.: frontal OLED, bateria, conector"
                  className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800/80 rounded-xl text-xs text-white placeholder-zinc-400 outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Custos (Custo da Peça + Frete da Peça) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    CUSTO DA PEÇA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={custoPeca}
                    onChange={(e) => setCustoPeca(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="R$ 0,00"
                    className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800/80 rounded-xl text-xs text-white font-medium outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    FRETE DA PEÇA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={fretePeca}
                    onChange={(e) => setFretePeca(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="R$ 0,00"
                    className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800/80 rounded-xl text-xs text-white font-medium outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Botão Registrar Retorno */}
              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-600/20 flex items-center space-x-2"
                >
                  {salvando ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <span>Registrar retorno</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-16 text-center space-y-2">
              <p className="text-sm font-bold text-zinc-300">Nenhuma ordem selecionada</p>
              <p className="text-xs text-zinc-400">
                Selecione uma ordem concluída na lista ao lado para registrar o retorno em garantia.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};