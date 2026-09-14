import React, { useState, useEffect } from "react";
import type {
  ChecklistEntrada,
  StatusChecklist,
  ClientePayload,
  AparelhoPayload,
  OrcamentoCalculadoResult,
} from "../types";
import { criarOrdemServico } from "../services/api";

const initialChecklist: ChecklistEntrada = {
  tela: "OK",
  faceId: "OK",
  bateria: "OK",
  cameraTraseira: "OK",
  cameraFrontal: "OK",
  carga: "OK",
  audio: "OK",
  wifi: "OK",
};

interface DadosLojaConfig {
  nomeLoja: string;
  subtitulo: string;
  telefone: string;
  cnpjCpf: string;
  endereco?: string;
}

export const NovaOS: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [sucessoOS, setSucessoOS] = useState<{
    id: string;
    numero: string;
    clienteNome: string;
    aparelhoModelo: string;
    defeito: string;
    valorTotal: number;
    subtotal: number;
    desconto: number;
    dataAbertura: string;
    dataPrevista?: string;
    possuiGarantia: boolean;
  } | null>(null);

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

  const [cliente, setCliente] = useState<ClientePayload>({
    nome: "",
    cpfCnpj: "",
    whatsapp: "",
    email: "",
  });

  const [aparelho, setAparelho] = useState<AparelhoPayload>({
    modelo: "",
    imei1: "",
    senhaDesbloqueio: "",
  });

  // Estado para controlar se a OS possui garantia (Padrão: true)
  const [possuiGarantia, setPossuiGarantia] = useState<boolean>(true);

  const [defeitoRelatado, setDefeitoRelatado] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [servicoRealizado, setServicoRealizado] = useState("");
  const [pecasUtilizadas, setPecasUtilizadas] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [dataAbertura, setDataAbertura] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [dataPrevista, setDataPrevista] = useState<string>("");

  const [custoPeca, setCustoPeca] = useState<string>("");
  const [freteReal, setFreteReal] = useState<string>("");
  const [fornecedorPeca, setFornecedorPeca] = useState("");
  const [desconto, setDesconto] = useState<string>("");
  const [valorFinalCobrado, setValorFinalCobrado] = useState<string>("");
  const [editadoManualmente, setEditadoManualmente] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistEntrada>(initialChecklist);

  useEffect(() => {
    if (!editadoManualmente) {
      const pecaNum = custoPeca === "" ? 0 : Number(custoPeca);
      const freteNum = freteReal === "" ? 0 : Number(freteReal);
      const descNum = desconto === "" ? 0 : Number(desconto);

      const subtotalEstimado = pecaNum > 0 ? pecaNum * 2 + freteNum : 35;
      const finalCalculado = Math.max(0, subtotalEstimado - descNum);
      setValorFinalCobrado(finalCalculado === 0 ? "" : String(finalCalculado));
    }
  }, [custoPeca, freteReal, desconto, editadoManualmente]);

  const updateChecklist = (field: keyof ChecklistEntrada, status: StatusChecklist) => {
    setChecklist((prev) => ({ ...prev, [field]: status }));
  };

  const handleNextStep = () => {
    if (step === 1 && !cliente.nome.trim()) {
      alert("Informe ao menos o Nome Completo do cliente para prosseguir.");
      return;
    }
    if (step === 2 && !aparelho.modelo.trim()) {
      alert("Informe o Modelo do Aparelho para prosseguir.");
      return;
    }
    setStep((s) => (s + 1) as any);
  };

  const handleSubmitFinal = async () => {
    if (!cliente.nome.trim()) {
      alert("Por favor, informe o Nome do Cliente.");
      setStep(1);
      return;
    }

    if (!aparelho.modelo.trim()) {
      alert("Por favor, informe o Modelo do Aparelho.");
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      const numPeca = custoPeca === "" ? 0 : Number(custoPeca);
      const numFrete = freteReal === "" ? 0 : Number(freteReal);
      const numDesconto = desconto === "" ? 0 : Number(desconto);
      const numValorFinal = valorFinalCobrado === "" ? 0 : Number(valorFinalCobrado);

      const subtotalCalculado = numValorFinal + numDesconto;
      const lucroEstimadoCalculado = numValorFinal - (numPeca + numFrete);

      const orcamentoPayload: OrcamentoCalculadoResult = {
        subtotalServicos: subtotalCalculado,
        descontoGeralAplicado: numDesconto,
        valorTotalOrcamento: numValorFinal,
        lucroTotalEstimadoInterno: lucroEstimadoCalculado,
        custoPeca: numPeca,
        freteReal: numFrete,
        fornecedorPeca: fornecedorPeca.trim(),
      };

      const resOS = await criarOrdemServico({
        cliente,
        aparelho,
        possuiGarantia, // <-- Envia flag para o backend
        defeitoRelatado: defeitoRelatado.trim() || "Análise Geral",
        diagnostico,
        servicoRealizado,
        pecasUtilizadas,
        observacoes,
        dataAbertura,
        dataPrevistaEntrega: dataPrevista || undefined,
        checklistEntrada: checklist,
        orcamentoCalculado: orcamentoPayload,
      } as any);

      setSucessoOS({
        id: resOS.idOs,
        numero: resOS.numeroOs,
        clienteNome: cliente.nome,
        aparelhoModelo: aparelho.modelo,
        defeito: defeitoRelatado || "Análise Geral",
        subtotal: subtotalCalculado,
        desconto: numDesconto,
        valorTotal: numValorFinal,
        dataAbertura,
        dataPrevista,
        possuiGarantia,
      });
    } catch (err: any) {
      alert(err.message || "Erro ao gravar Ordem de Serviço.");
    } finally {
      setLoading(false);
    }
  };

  const handleImprimirComprovante = () => {
    if (possuiGarantia === false) {
      alert("Este serviço foi cadastrado sem cobertura de garantia. A impressão do comprovante/termo de garantia está desativada.");
      return;
    }
    window.print();
  };

  if (sucessoOS) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl print:hidden">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">Ordem de Serviço Gerada!</h2>
            <p className="text-sm text-zinc-400 mt-1">
              A OS <span className="font-mono font-bold text-blue-400">#{sucessoOS.numero}</span> foi gravada com sucesso!
            </p>
            <div className="mt-2">
              {sucessoOS.possuiGarantia ? (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs rounded-full font-bold">
                  ✓ Serviço com Garantia Ativa (90 dias)
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs rounded-full font-bold">
                  ⚠️ Serviço sem Garantia (Impressão e Retornos desativados)
                </span>
              )}
            </div>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-left space-y-2 max-w-lg mx-auto">
            <div className="flex justify-between">
              <span className="text-zinc-500">Cliente:</span>
              <span className="font-bold text-white">{sucessoOS.clienteNome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Aparelho:</span>
              <span className="font-bold text-white">{sucessoOS.aparelhoModelo}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-800/60 pt-2">
              <span className="text-zinc-500">Valor Cobrado:</span>
              <span className="font-bold text-emerald-400 text-sm">
                R$ {sucessoOS.valorTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-md mx-auto">
            <button
              onClick={handleImprimirComprovante}
              disabled={!sucessoOS.possuiGarantia}
              className={`py-3 px-4 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-2 ${
                sucessoOS.possuiGarantia
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
              }`}
            >
              <span>🖨️ Imprimir / Salvar PDF</span>
            </button>

            <button
              onClick={() => {
                setSucessoOS(null);
                setCliente({ nome: "", cpfCnpj: "", whatsapp: "", email: "" });
                setAparelho({ modelo: "", imei1: "", senhaDesbloqueio: "" });
                setPossuiGarantia(true);
                setDefeitoRelatado("");
                setDiagnostico("");
                setServicoRealizado("");
                setPecasUtilizadas("");
                setObservacoes("");
                setChecklist(initialChecklist);
                setEditadoManualmente(false);
                setCustoPeca("");
                setFreteReal("");
                setFornecedorPeca("");
                setDesconto("");
                setValorFinalCobrado("");
                setStep(1);
              }}
              className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs transition"
            >
              + Nova Ordem de Serviço
            </button>
          </div>
        </div>

        {/* TEMPLATE DE IMPRESSÃO */}
        {sucessoOS.possuiGarantia && (
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
                  <span className="text-base font-black font-mono text-blue-900">#{sucessoOS.numero}</span>
                </div>
                <div className="text-[9px] text-slate-600 mt-1 space-y-0.5">
                  <p><strong>Entrada:</strong> {new Date(sucessoOS.dataAbertura).toLocaleDateString("pt-BR")}</p>
                  {sucessoOS.dataPrevista && (
                    <p><strong>Previsão:</strong> {new Date(sucessoOS.dataPrevista).toLocaleDateString("pt-BR")}</p>
                  )}
                  <p><strong>Status:</strong> AGUARDANDO AVALIAÇÃO</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="border border-slate-300 rounded p-2 bg-slate-50/50">
                <h3 className="text-[10px] font-bold uppercase text-slate-700 border-b border-slate-200 pb-1 mb-1.5">
                  👤 Dados do Cliente
                </h3>
                <div className="text-[10px] space-y-1">
                  <p><span className="text-slate-500">Nome:</span> <strong>{sucessoOS.clienteNome}</strong></p>
                  <p><span className="text-slate-500">WhatsApp:</span> {cliente.whatsapp || "Não informado"}</p>
                  <p><span className="text-slate-500">CPF/CNPJ:</span> {cliente.cpfCnpj || "Não informado"}</p>
                  <p><span className="text-slate-500">E-mail:</span> {cliente.email || "Não informado"}</p>
                </div>
              </div>

              <div className="border border-slate-300 rounded p-2 bg-slate-50/50">
                <h3 className="text-[10px] font-bold uppercase text-slate-700 border-b border-slate-200 pb-1 mb-1.5">
                  📱 Dados do Aparelho
                </h3>
                <div className="text-[10px] space-y-1">
                  <p><span className="text-slate-500">Modelo:</span> <strong>{sucessoOS.aparelhoModelo}</strong></p>
                  <p><span className="text-slate-500">IMEI / N° Série:</span> {aparelho.imei1 || "Não informado"}</p>
                  <p><span className="text-slate-500">Senha do Aparelho:</span> {aparelho.senhaDesbloqueio || "Sem senha"}</p>
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
                    {sucessoOS.defeito}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[9px]">DIAGNÓSTICO INICIAL / OBSERVAÇÕES:</span>
                  <p className="bg-slate-100 p-1.5 rounded border border-slate-200 mt-0.5 text-slate-800">
                    {diagnostico || observacoes || "Aparelho recebido para análise técnica e testes de bancada."}
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-slate-300 rounded p-2 mb-3">
              <h3 className="text-[10px] font-bold uppercase text-slate-700 border-b border-slate-200 pb-1 mb-1.5">
                ✔️ Checklist de Entrada do Equipamento
              </h3>
              <div className="grid grid-cols-4 gap-1.5 text-[9px]">
                {Object.entries(checklist).map(([key, value]) => (
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
                    <td className="p-1.5 font-medium">Serviço de Manutenção / Avaliação Técnica ({sucessoOS.aparelhoModelo})</td>
                    <td className="p-1.5 text-right">1</td>
                    <td className="p-1.5 text-right font-bold">R$ {sucessoOS.subtotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="bg-slate-50 p-2 border-t border-slate-300 flex justify-between items-center text-[10px]">
                <div className="text-[9px] text-slate-500">
                  {sucessoOS.desconto > 0 && <p>Desconto Concedido: <strong>R$ {sucessoOS.desconto.toFixed(2)}</strong></p>}
                  <p>Forma de Pagamento: A combinar no ato da entrega</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">VALOR TOTAL DO ORÇAMENTO</span>
                  <span className="text-base font-black text-slate-900">R$ {sucessoOS.valorTotal.toFixed(2)}</span>
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
                    {sucessoOS.clienteNome}
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
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        {[
          { num: 1, label: "Dados do Cliente" },
          { num: 2, label: "Aparelho & Orçamento" },
          { num: 3, label: "Checklist de Entrada" },
        ].map((s) => (
          <div
            key={s.num}
            className={`flex items-center space-x-3 ${step === s.num ? "text-blue-500" : "text-zinc-500"}`}
          >
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step === s.num
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {s.num}
            </span>
            <span className="font-medium text-sm hidden sm:inline">
              {s.label}
            </span>
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

            {/* SELETOR DE GARANTIA */}
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-white block uppercase tracking-wider">
                  Cobertura de Garantia para este Atendimento
                </label>
                <span className="text-[11px] text-zinc-400">
                  {possuiGarantia ? "Garantia de 90 dias ativa (Gera certificado e permite retornos)." : "Serviço sem garantia (Não gera certificado nem permite retornos)."}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setPossuiGarantia(true)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                    possuiGarantia ? 'bg-emerald-600 text-white shadow' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Com Garantia
                </button>
                <button
                  type="button"
                  onClick={() => setPossuiGarantia(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                    !possuiGarantia ? 'bg-rose-600 text-white shadow' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Sem Garantia
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2 border-b border-zinc-800">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Data de Entrada</label>
                <input
                  type="date"
                  value={dataAbertura}
                  onChange={(e) => setDataAbertura(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Previsão de Entrega (Opcional)</label>
                <input
                  type="date"
                  value={dataPrevista}
                  onChange={(e) => setDataPrevista(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Modelo do Aparelho *</label>
                <input
                  type="text"
                  value={aparelho.modelo}
                  onChange={(e) => setAparelho({ ...aparelho, modelo: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                  placeholder="Ex: iPhone 13, Galaxy S23..."
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
                  placeholder="Ex: 123456 (opcional)"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Defeito Relatado *</label>
              <textarea
                rows={2}
                value={defeitoRelatado}
                onChange={(e) => setDefeitoRelatado(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                placeholder="Descreva o problema informado..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Diagnóstico Inicial</label>
                <input
                  type="text"
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
                  placeholder="Ex: Placa em curto / Tela trincada"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Observações Internas</label>
                <input
                  type="text"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500"
                  placeholder="Ex: Marca de queda na tampa traseira"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Custo da Peça (R$)</label>
                <input
                  type="number"
                  placeholder="0,00"
                  value={custoPeca}
                  onChange={(e) => setCustoPeca(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Frete Real (R$)</label>
                <input
                  type="number"
                  placeholder="0,00"
                  value={freteReal}
                  onChange={(e) => setFreteReal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Fornecedor (Uso Interno)</label>
                <input
                  type="text"
                  value={fornecedorPeca}
                  onChange={(e) => setFornecedorPeca(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                  placeholder="Ex: iParts, Mercado Livre..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Desconto Geral (R$)</label>
                <input
                  type="number"
                  placeholder="0,00"
                  value={desconto}
                  onChange={(e) => setDesconto(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-zinc-950 border border-emerald-500/40 rounded-xl flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                  Valor Final Cobrado (R$)
                </label>
                <span className="text-xs text-zinc-500">
                  {editadoManualmente ? "✏️ Valor ajustado" : "⚡ Valor sugerido"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-emerald-400">R$</span>
                <input
                  type="number"
                  placeholder="0,00"
                  value={valorFinalCobrado}
                  onChange={(e) => {
                    setValorFinalCobrado(e.target.value);
                    setEditadoManualmente(true);
                  }}
                  className="w-36 bg-zinc-900 border border-emerald-500/50 rounded-lg p-2 text-xl font-extrabold text-emerald-400 text-right outline-none"
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
                      {itemKey.replace(/([A-Z])/g, " $1")}
                    </span>
                    <div className="flex space-x-1">
                      {(["OK", "DEFEITO", "NAO_TESTADO"] as StatusChecklist[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => updateChecklist(itemKey, st)}
                          className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                            currentStatus === st
                              ? st === "OK"
                                ? "bg-emerald-600 text-white"
                                : st === "DEFEITO"
                                  ? "bg-rose-600 text-white"
                                  : "bg-amber-600 text-white"
                              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                          }`}
                        >
                          {st === "NAO_TESTADO" ? "N/A" : st}
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
          ) : (
            <div />
          )}

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
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition"
            >
              {loading ? "Salvando..." : "Finalizar e Abrir OS"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};