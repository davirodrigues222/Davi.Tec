import React, { useState, useEffect } from 'react';
import { buscarOrdensServico, registrarGarantiaOS } from '../services/api';
import type { OrdemServico } from '../types';

export const GarantiaRetorno: React.FC = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [osSelecionada, setOsSelecionada] = useState<OrdemServico | null>(null);

  const [defeitoConstatado, setDefeitoConstatado] = useState('');
  const [pecaSubstituida, setPecaSubstituida] = useState('');
  const [custoPecaGarantia, setCustoPecaGarantia] = useState<number | ''>('');
  const [freteGarantia, setFreteGarantia] = useState<number | ''>('');
  const [salvando, setSalvando] = useState(false);

  const carregarOrdens = async () => {
    setLoading(true);
    try {
      const data = await buscarOrdensServico();
      setOrdens(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar ordens para garantia:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarOrdens();
  }, []);

  const validarElegibilidadeGarantia = (os: OrdemServico): { elegivel: boolean; motivo?: string } => {
    // 1. Verificar se possui garantia ativa
    if (os.possuiGarantia === false) {
      return { elegivel: false, motivo: 'Este serviço foi cadastrado sem cobertura de garantia.' };
    }
    // 2. Verificar se está com status ENTREGUE
    if (os.status_os !== 'ENTREGUE') {
      return { elegivel: false, motivo: `Status atual (${os.status_os.replace('_', ' ')}) não permite garantia. Precisa estar ENTREGUE.` };
    }
    // 3. Verificar prazo de 90 dias
    if (!os.data_abertura) return { elegivel: false, motivo: 'Data de abertura não encontrada.' };

    const diasDecorridos = Math.floor((new Date().getTime() - new Date(os.data_abertura).getTime()) / (1000 * 60 * 60 * 24));
    if (diasDecorridos > 90) {
      return { elegivel: false, motivo: `Prazo de garantia expirado (${diasDecorridos} dias desde a abertura. Limite de 90 dias).` };
    }

    return { elegivel: true };
  };

  const ordensFiltradas = ordens.filter((os) => {
    if (!os) return false;
    const termo = termoBusca.toLowerCase();
    return (
      os.numero_os?.toLowerCase().includes(termo) ||
      os.cliente?.nome?.toLowerCase().includes(termo) ||
      os.aparelho?.modelo?.toLowerCase().includes(termo)
    );
  });

  const handleSalvarGarantia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osSelecionada) return;

    const validacao = validarElegibilidadeGarantia(osSelecionada);
    if (!validacao.elegivel) {
      alert(`Não é possível registrar garantia: ${validacao.motivo}`);
      return;
    }

    if (!defeitoConstatado.trim()) {
      alert('Informe o defeito apresentado no retorno de garantia.');
      return;
    }

    setSalvando(true);
    try {
      const cPeca = Number(custoPecaGarantia || 0);
      const cFrete = Number(freteGarantia || 0);
      const prejuizoTotal = cPeca + cFrete;

      await registrarGarantiaOS(
        osSelecionada.id_os,
        {
          houveGarantia: true,
          dataRetorno: new Date().toISOString(),
          defeitoConstatadoGarantia: defeitoConstatado,
          pecaSubstituidaGarantia: pecaSubstituida,
          custoPecaGarantia: cPeca,
          freteGarantia: cFrete, // INCLUÍDO CORRETAMENTE AQUI
          freteRealGarantia: cFrete, // Garantia de compatibilidade
          cobertoPelaAssistência: true,
          prejuizoTotalGarantia: prejuizoTotal,
        },
        `Retorno em Garantia: ${defeitoConstatado} (Peça: ${pecaSubstituida || 'N/A'} | Custo Peça: R$ ${cPeca.toFixed(2)} | Frete: R$ ${cFrete.toFixed(2)})`
      );

      alert('Retorno de garantia registrado com sucesso! O custo total foi lançado e o lucro real recalculado.');
      setOsSelecionada(null);
      setDefeitoConstatado('');
      setPecaSubstituida('');
      setCustoPecaGarantia('');
      setFreteGarantia('');
      carregarOrdens();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar garantia.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-bold text-white">Controle de Garantias & Retornos</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Vincule retornos de aparelhos com garantia ativa (<strong className="text-emerald-400">Entregues</strong> e até <strong className="text-blue-400">90 dias</strong>) e lance os custos de reposição.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 lg:col-span-1">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">1. Selecionar OS Concluída</h3>
          <input
            type="text"
            placeholder="🔍 Buscar OS, Cliente ou Aparelho..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500"
          />

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-xs text-zinc-500 text-center py-6">Carregando ordens...</p>
            ) : ordensFiltradas.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">Nenhuma OS encontrada.</p>
            ) : (
              ordensFiltradas.map((os) => {
                const validacao = validarElegibilidadeGarantia(os);
                const isSelected = osSelecionada?.id_os === os.id_os;

                return (
                  <div
                    key={os.id_os}
                    onClick={() => {
                      if (validacao.elegivel) {
                        setOsSelecionada(os);
                      } else {
                        alert(`OS #${os.numero_os} inelegível para garantia:\n• ${validacao.motivo}`);
                      }
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      !validacao.elegivel
                        ? 'opacity-40 bg-zinc-950 border-zinc-950 cursor-not-allowed'
                        : isSelected
                        ? 'bg-blue-600/10 border-blue-500 text-white'
                        : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono font-bold text-blue-400 text-xs">#{os.numero_os}</span>
                      {validacao.elegivel ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] rounded font-bold">
                          Elegível ✓
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] rounded font-bold" title={validacao.motivo}>
                          {os.possuiGarantia === false ? 'Sem Garantia' : 'Inelegível'}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-xs truncate">{os.cliente?.nome}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{os.aparelho?.modelo}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 lg:col-span-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-zinc-800 pb-3">
            2. Detalhes do Retorno e Custos de Garantia
          </h3>

          {osSelecionada ? (
            <form onSubmit={handleSalvarGarantia} className="space-y-5">
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">OS Selecionada: <strong className="text-blue-400 font-mono">#{osSelecionada.numero_os}</strong></span>
                  <span className="text-emerald-400 font-bold">Status: {osSelecionada.status_os}</span>
                </div>
                <p className="text-white font-bold text-sm">Cliente: {osSelecionada.cliente?.nome} ({osSelecionada.aparelho?.modelo})</p>
                <p className="text-zinc-400">Defeito Original: {osSelecionada.defeitoRelatado}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Defeito Apresentado no Retorno *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva o problema relatado pelo cliente nesta volta em garantia..."
                  value={defeitoConstatado}
                  onChange={(e) => setDefeitoConstatado(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Peça Substituída na Garantia (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Frontal OLED, Bateria, Conector de Carga..."
                  value={pecaSubstituida}
                  onChange={(e) => setPecaSubstituida(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Custo da Peça de Garantia (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={custoPecaGarantia}
                    onChange={(e) => setCustoPecaGarantia(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-rose-400 font-bold outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">Valor pago na nova peça para cobrir a garantia.</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Frete da Peça de Garantia (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={freteGarantia}
                    onChange={(e) => setFreteGarantia(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-amber-400 font-bold outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">Frete adicional pago no envio da peça.</span>
                </div>
              </div>

              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs space-y-1">
                <span className="font-bold text-rose-400 uppercase tracking-wide block">Impacto Financeiro</span>
                <p className="text-zinc-300">
                  O valor total de <strong className="text-white">R$ {Number(Number(custoPecaGarantia || 0) + Number(freteGarantia || 0)).toFixed(2)}</strong> será contabilizado nos custos de garantia e abatido diretamente do lucro líquido desta OS e do Dashboard.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-lg"
                >
                  {salvando ? 'Registrando...' : '⚠️ Registrar Retorno de Garantia'}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-16 text-center space-y-2 border border-dashed border-zinc-800 rounded-xl">
              <span className="text-2xl">👈</span>
              <h4 className="text-sm font-bold text-zinc-300">Selecione uma OS Elegível ao lado</h4>
              <p className="text-xs text-zinc-500">Apenas ordens com garantia ativa, status ENTREGUE e criadas há menos de 90 dias podem ser selecionadas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};