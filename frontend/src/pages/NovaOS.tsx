import React, { useState, useEffect } from 'react';
import type { 
  ChecklistEntrada, 
  StatusChecklist, 
  ClientePayload, 
  AparelhoPayload, 
  OrcamentoCalculadoResult 
} from '../types';
import { calcularOrcamento, criarOrdemServico } from '../services/api';

const initialChecklist: ChecklistEntrada = {
  tela: 'OK',
  faceId: 'OK',
  bateria: 'OK',
  cameraTraseira: 'OK',
  cameraFrontal: 'OK',
  carga: 'OK',
  audio: 'OK',
  wifi: 'OK',
};

export const NovaOS: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [sucessoOS, setSucessoOS] = useState<{ id: string; numero: string } | null>(null);

  const [cliente, setCliente] = useState<ClientePayload>({ 
    nome: '', 
    cpfCnpj: '', 
    whatsapp: '', 
    email: '' 
  });
  
  const [aparelho, setAparelho] = useState<AparelhoPayload>({ 
    modelo: '', 
    imei1: '', 
    senhaDesbloqueio: '' 
  });
  
  const [defeitoRelatado, setDefeitoRelatado] = useState('');
  
  const [custoPeca, setCustoPeca] = useState<number | ''>(200);
  const [freteReal, setFreteReal] = useState<number | ''>(20);
  const [desconto, setDesconto] = useState<number | ''>(0);
  const [valorFinalCobrado, setValorFinalCobrado] = useState<number | ''>(340);
  const [editadoManualmente, setEditadoManualmente] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistEntrada>(initialChecklist);

  const idRegraPadrao = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  useEffect(() => {
    if (!editadoManualmente) {
      const pecaNum = custoPeca === '' ? 0 : custoPeca;
      const freteNum = freteReal === '' ? 0 : freteReal;
      const descNum = desconto === '' ? 0 : desconto;

      const maoDeObraPadrao = 50;
      const custosAdicionaisPadrao = 20;
      const subtotalEstimado = (pecaNum * 2) + maoDeObraPadrao + freteNum + custosAdicionaisPadrao;
      const calculado = Math.max(0, subtotalEstimado - descNum);
      setValorFinalCobrado(calculado);
    }
  }, [custoPeca, freteReal, desconto, editadoManualmente]);

  const updateChecklist = (field: keyof ChecklistEntrada, status: StatusChecklist) => {
    setChecklist((prev) => ({ ...prev, [field]: status }));
  };

  const handleNextStep = () => {
    if (step === 1 && !cliente.nome.trim()) {
      alert('Por favor, informe ao menos o Nome Completo do cliente para continuar.');
      return;
    }
    setStep((s) => (s + 1) as any);
  };

  const handleSubmitFinal = async () => {
    if (!aparelho.modelo.trim()) {
      alert('Por favor, informe o Modelo do Aparelho na Etapa 2.');
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      const numPeca = custoPeca === '' ? 0 : custoPeca;
      const numFrete = freteReal === '' ? 0 : freteReal;
      const numDesconto = desconto === '' ? 0 : desconto;
      const numValorFinal = valorFinalCobrado === '' ? 0 : valorFinalCobrado;

      const resOrcamento: OrcamentoCalculadoResult = await calcularOrcamento(
        [{ idRegra: idRegraPadrao, custoPeca: numPeca, freteReal: numFrete }],
        { valor: numDesconto }
      );

      const orcamentoPersonalizado: OrcamentoCalculadoResult = {
        ...resOrcamento,
        valorTotalOrcamento: numValorFinal,
      };

      const resOS = await criarOrdemServico({
        cliente,
        aparelho,
        defeitoRelatado,
        checklistEntrada: checklist,
        orcamentoCalculado: orcamentoPersonalizado,
      });

      setSucessoOS({ id: resOS.idOs, numero: resOS.numeroOs });
    } catch (err: any) {
      alert(err.message || 'Erro ao processar Ordem de Serviço.');
    } finally {
      setLoading(false);
    }
  };

  if (sucessoOS) {
    return (
      <div className="max-w-xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-white">Ordem de Serviço Gerada!</h2>
        <p className="text-sm text-zinc-400">
          A OS <span className="text-blue-400 font-mono font-bold">#{sucessoOS.numero}</span> foi gravada com sucesso no MySQL.
        </p>
        <button
          onClick={() => {
            setSucessoOS(null);
            setCliente({ nome: '', cpfCnpj: '', whatsapp: '', email: '' });
            setAparelho({ modelo: '', imei1: '', senhaDesbloqueio: '' });
            setDefeitoRelatado('');
            setChecklist(initialChecklist);
            setEditadoManualmente(false);
            setCustoPeca(200);
            setFreteReal(20);
            setDesconto(0);
            setStep(1);
          }}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          Abrir Nova Ordem de Serviço
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        {[
          { num: 1, label: 'Dados do Cliente' },
          { num: 2, label: 'Aparelho & Orçamento' },
          { num: 3, label: 'Checklist de Entrada' },
        ].map((s) => (
          <div key={s.num} className={`flex items-center space-x-3 ${step === s.num ? 'text-blue-500' : 'text-zinc-500'}`}>
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step === s.num ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {s.num}
            </span>
            <span className="font-medium text-sm hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Etapa 1: Dados do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={cliente.nome}
                  onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">CPF ou CNPJ</label>
                <input
                  type="text"
                  value={cliente.cpfCnpj}
                  onChange={(e) => setCliente({ ...cliente, cpfCnpj: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                  placeholder="000.000.000-00 (opcional)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={cliente.whatsapp}
                  onChange={(e) => setCliente({ ...cliente, whatsapp: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                  placeholder="(85) 99999-9999 (opcional)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">E-mail</label>
                <input
                  type="email"
                  value={cliente.email}
                  onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                  placeholder="cliente@email.com (opcional)"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Etapa 2: Aparelho & Estimativa de Custos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Modelo do Aparelho *</label>
                <input
                  type="text"
                  value={aparelho.modelo}
                  onChange={(e) => setAparelho({ ...aparelho, modelo: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                  placeholder="Ex: iPhone 13, Galaxy S23, Redmi Note 12..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">IMEI / Nº de Série</label>
                <input
                  type="text"
                  value={aparelho.imei1}
                  onChange={(e) => setAparelho({ ...aparelho, imei1: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                  placeholder="350000000000000 (opcional)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Senha de Desbloqueio</label>
                <input
                  type="text"
                  value={aparelho.senhaDesbloqueio}
                  onChange={(e) => setAparelho({ ...aparelho, senhaDesbloqueio: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                  placeholder="Ex: 123456 ou Padrão L (opcional)"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Defeito Relatado *</label>
              <textarea
                rows={3}
                value={defeitoRelatado}
                onChange={(e) => setDefeitoRelatado(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                placeholder="Descreva detalhadamente o problema informado..."
              />
            </div>

            <div className="pt-4 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Custo da Peça (R$)</label>
                <input
                  type="number"
                  value={custoPeca}
                  onChange={(e) => setCustoPeca(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Frete Real (R$)</label>
                <input
                  type="number"
                  value={freteReal}
                  onChange={(e) => setFreteReal(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Desconto Geral (R$)</label>
                <input
                  type="number"
                  value={desconto}
                  onChange={(e) => setDesconto(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-zinc-950 border border-emerald-500/40 rounded-xl flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                  Valor Final a Cobrar do Cliente (R$)
                </label>
                <span className="text-xs text-zinc-500">
                  {editadoManualmente ? '✏️ Valor ajustado manualmente' : '⚡ Valor sugerido pela fórmula (Editável)'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-emerald-400">R$</span>
                <input
                  type="number"
                  value={valorFinalCobrado}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setValorFinalCobrado(val);
                    setEditadoManualmente(true);
                  }}
                  className="w-36 bg-zinc-900 border border-emerald-500/50 rounded-lg p-2 text-xl font-extrabold text-emerald-400 text-right outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Etapa 3: Checklist de Entrada Interativo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(checklist).map((key) => {
                const itemKey = key as keyof ChecklistEntrada;
                const currentStatus = checklist[itemKey];

                return (
                  <div key={itemKey} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <span className="text-sm font-medium text-zinc-200 capitalize">
                      {itemKey.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <div className="flex space-x-1">
                      {(['OK', 'DEFEITO', 'NAO_TESTADO'] as StatusChecklist[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => updateChecklist(itemKey, st)}
                          className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                            currentStatus === st
                              ? st === 'OK'
                                ? 'bg-emerald-600 text-white'
                                : st === 'DEFEITO'
                                ? 'bg-rose-600 text-white'
                                : 'bg-amber-600 text-white'
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          }`}
                        >
                          {st === 'NAO_TESTADO' ? 'N/A' : st}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-6 mt-6 border-t border-zinc-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition"
            >
              Voltar
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
            >
              Próximo Passo
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitFinal}
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition flex items-center space-x-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{loading ? 'Calculando & Salvando...' : 'Finalizar e Abrir OS'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};