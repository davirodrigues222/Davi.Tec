import React, { useState, useEffect } from "react";
import { criarOrdemServico } from "../services/api";
import { supabase } from "../services/supabaseClient";

export const NovaOS: React.FC = () => {
  const [listaClientes, setListaClientes] = useState<any[]>([]);
  const [listaFornecedores, setListaFornecedores] = useState<any[]>([]);
  const [listaServicos, setListaServicos] = useState<any[]>([]);

  // Configurações da Loja puxadas do localStorage
  const [configLoja, setConfigLoja] = useState({
    nomeLoja: "Sampaio Cell",
    subtitulo: "Gestão Técnica Especializada",
    cnpj: "",
    telefone: "",
    endereco: "",
  });

  const modelosPopulares = [
    "iPhone 11", "iPhone 12", "iPhone 13", "iPhone 14", "iPhone 15", "iPhone 16",
    "Samsung Galaxy A14", "Samsung Galaxy A15", "Samsung Galaxy A34", "Samsung Galaxy A54", "Samsung Galaxy S23", "Samsung Galaxy S24",
    "Redmi 12", "Redmi 13C", "Redmi Note 12", "Redmi Note 13", "POCO X5", "POCO X6",
    "Moto G14", "Moto G24", "Moto G54", "Moto Edge 40"
  ];

  const [sugestoesAparelho, setSugestoesAparelho] = useState<string[]>([]);

  const [idClienteSelecionado, setIdClienteSelecionado] = useState("");
  const [nomeCliente, setNomeCliente] = useState("");
  const [whatsappCliente, setWhatsappCliente] = useState("");
  const [cpfCnpjCliente, setCpfCnpjCliente] = useState("");
  const [emailCliente, setEmailCliente] = useState("");

  const [modeloAparelho, setModeloAparelho] = useState("");
  const [imeiAparelho, setImeiAparelho] = useState("");
  const [senhaAparelho, setSenhaAparelho] = useState("");
  const [defeitoRelatado, setDefeitoRelatado] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [custoPeca, setCustoPeca] = useState<number | "">("");
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [parcelas, setParcelas] = useState<number>(1);
  const [valorLiquido, setValorLiquido] = useState<number | "">("");

  const [freteReal, setFreteReal] = useState<number | "">("");
  const [fornecedorPeca, setFornecedorPeca] = useState("");
  const [descontoGeral, setDescontoGeral] = useState<number | "">("");
  const [tipoDesconto, setTipoDesconto] = useState<"VALOR" | "PERCENTUAL">("VALOR");
  const [valorTotalOrcamento, setValorTotalOrcamento] = useState<number | "">("");
  const [servicoSelecionadoId, setServicoSelecionadoId] = useState("");

  const [possuiGarantia, setPossuiGarantia] = useState<boolean>(true);

  const [dataAbertura, setDataAbertura] = useState(
    new Date().toISOString().substring(0, 10),
  );
  const [dataPrevista, setDataPrevista] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Estado para controlar a tela de sucesso pós-cadastro
  const [osCriadaSucesso, setOsCriadaSucesso] = useState<{ idOs: string; numeroOs: string; dadosCompletos?: any } | null>(null);

  useEffect(() => {
    const carregarDadosIniciais = async () => {
      try {
        const savedConfigs = localStorage.getItem('sig_apple_configs');
        if (savedConfigs) {
          const parsed = JSON.parse(savedConfigs);
          setConfigLoja({
            nomeLoja: parsed.nomeLoja || "Sampaio Cell",
            subtitulo: parsed.subtitulo || "Gestão Técnica Especializada",
            cnpj: parsed.cnpj || "00.000.000/0001-00",
            telefone: parsed.telefone || "(85) 99999-9999",
            endereco: parsed.endereco || "Fortaleza, CE",
          });
        }

        const { data: dataCli } = await supabase.from('clientes').select('*');
        if (dataCli) setListaClientes(dataCli);

        const { data: dataForn } = await supabase.from('cad_fornecedores').select('*');
        if (dataForn) setListaFornecedores(dataForn);

        const { data: dataServ } = await supabase.from('cad_servicos').select('*');
        if (dataServ) setListaServicos(dataServ);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      }
    };
    carregarDadosIniciais();
  }, []);

  const handleSelecionarCliente = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setIdClienteSelecionado(id);
    const cli = listaClientes.find((c) => c.id_cliente === id || c.id === id);
    if (cli) {
      setNomeCliente(cli.nome || "");
      setWhatsappCliente(cli.whatsapp || cli.telefone || "");
      setCpfCnpjCliente(cli.cpf_cnpj || cli.cpf || "");
      setEmailCliente(cli.email || "");
    } else {
      setNomeCliente("");
      setWhatsappCliente("");
      setCpfCnpjCliente("");
      setEmailCliente("");
    }
  };

  const handleSelecionarServico = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setServicoSelecionadoId(id);
    const serv = listaServicos.find((s) => s.id_servico === id || s.id === id);
    if (serv) {
      setDefeitoRelatado(serv.nome);
      if (serv.preco_sugerido || serv.preco) {
        setValorTotalOrcamento(Number(serv.preco_sugerido || serv.preco));
      }
    }
  };

  const handleDigitarModelo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const texto = e.target.value;
    setModeloAparelho(texto);

    if (texto.trim().length === 0) {
      setSugestoesAparelho([]);
      return;
    }

    const filtrados = modelosPopulares.filter((m) =>
      m.toLowerCase().includes(texto.toLowerCase())
    );
    setSugestoesAparelho(filtrados);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCliente.trim() || !modeloAparelho.trim()) {
      alert("Preencha ao menos o Nome do Cliente e o Modelo do Aparelho.");
      return;
    }

    if (valorTotalOrcamento === "" || Number(valorTotalOrcamento) <= 0) {
      alert("Por favor, preencha o Valor Bruto (R$) do orçamento antes de salvar.");
      return;
    }

    setCarregando(true);

    try {
      const numValorBruto = Number(valorTotalOrcamento);
      const numDescontoInfo = descontoGeral === "" ? 0 : Number(descontoGeral);
      
      let descontoCalculado = 0;
      if (tipoDesconto === "PERCENTUAL") {
        descontoCalculado = (numValorBruto * numDescontoInfo) / 100;
      } else {
        descontoCalculado = numDescontoInfo;
      }

      const valorFinalComDesconto = Math.max(0, numValorBruto - descontoCalculado);

      // Define o valor líquido para cartão de crédito (até 3x) ou débito
      let liquidoFinal = valorFinalComDesconto;
      if (formaPagamento === "Cartão de Crédito" && parcelas <= 3 && valorLiquido !== "") {
        liquidoFinal = Number(valorLiquido);
      } else if (formaPagamento === "Cartão de Débito" && valorLiquido !== "") {
        liquidoFinal = Number(valorLiquido);
      }

      const payload = {
        cliente: {
          idCliente: idClienteSelecionado || undefined,
          nome: nomeCliente,
          whatsapp: whatsappCliente,
          cpfCnpj: cpfCnpjCliente,
          email: emailCliente,
        },
        aparelho: {
          modelo: modeloAparelho,
          imei1: imeiAparelho,
          senhaDesbloqueio: senhaAparelho,
        },
        defeitoRelatado,
        diagnostico,
        observacoes,
        dataAbertura,
        dataPrevistaEntrega: dataPrevista || null,
        checklistEntrada: {},
        possuiGarantia,
        formaPagamento,
        parcelas: formaPagamento === "Cartão de Crédito" ? parcelas : 1,
        valorLiquido: liquidoFinal,
        orcamentoCalculado: {
          custoPeca: custoPeca === "" ? 0 : Number(custoPeca),
          freteReal: freteReal === "" ? 0 : Number(freteReal),
          fornecedorPeca,
          tipoDesconto,
          descontoGeralAplicado: descontoCalculado,
          valorTotalOrcamento: valorFinalComDesconto,
          subtotalServicos: numValorBruto,
          lucroTotalEstimadoInterno: liquidoFinal - ((custoPeca === "" ? 0 : Number(custoPeca)) + (freteReal === "" ? 0 : Number(freteReal))),
        },
      };

      const resposta: any = await criarOrdemServico(payload as any);

      if (resposta && resposta.numeroOs) {
        setOsCriadaSucesso({
          idOs: resposta.idOs,
          numeroOs: resposta.numeroOs,
          dadosCompletos: {
            numero_os: resposta.numeroOs,
            data_abertura: dataAbertura,
            data_prevista: dataPrevista,
            possuiGarantia,
            cliente: { nome: nomeCliente, whatsapp: whatsappCliente, cpfCnpj: cpfCnpjCliente, email: emailCliente },
            aparelho: { modelo: modeloAparelho, imei1: imeiAparelho, senhaDesbloqueio: senhaAparelho },
            defeitoRelatado,
            diagnostico,
            observacoes,
            formaPagamento,
            parcelas: formaPagamento === "Cartão de Crédito" ? parcelas : 1,
            orcamentoCalculado: { valorTotalOrcamento: valorFinalComDesconto }
          }
        });
      } else {
        alert("Erro ao criar OS.");
      }
    } catch (err: any) {
      alert(err.message || "Erro de conexão com o Supabase.");
    } finally {
      setCarregando(false);
    }
  };

  const limparFormulario = () => {
    setNomeCliente("");
    setWhatsappCliente("");
    setCpfCnpjCliente("");
    setEmailCliente("");
    setModeloAparelho("");
    setImeiAparelho("");
    setSenhaAparelho("");
    setDefeitoRelatado("");
    setDiagnostico("");
    setObservacoes("");
    setCustoPeca("");
    setFreteReal("");
    setFornecedorPeca("");
    setDescontoGeral("");
    setValorTotalOrcamento("");
    setFormaPagamento("PIX");
    setParcelas(1);
    setValorLiquido("");
    setOsCriadaSucesso(null);
  };

  const handleImprimirComprovante = () => {
    window.print();
  };

  // Se a OS foi criada com sucesso, exibe a tela de confirmação limpa
  if (osCriadaSucesso) {
    const os = osCriadaSucesso.dadosCompletos;
    return (
      <div className="max-w-2xl mx-auto py-16 px-8 bg-zinc-900/80 border border-zinc-800 rounded-3xl text-center space-y-6 shadow-2xl backdrop-blur-md">
        
        {/* Símbolo de Verificação */}
        <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg shadow-emerald-500/10">
          ✓
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight">Ordem de Serviço Cadastrada</h2>
          <p className="text-sm text-zinc-400">
            A Ordem de Serviço <strong className="text-blue-400 font-mono">#{osCriadaSucesso.numeroOs}</strong> foi gerada e salva com sucesso no sistema.
          </p>
        </div>

        {/* Duas Opções em Baixo */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={limparFormulario}
            className="w-full sm:w-auto px-6 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition text-xs shadow-md"
          >
            + Fazer uma Nova Ordem de Serviço
          </button>

          <button
            onClick={handleImprimirComprovante}
            className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition text-xs shadow-lg shadow-blue-600/30"
          >
            🖨️ Imprimir Ordem de Serviço
          </button>
        </div>

        {/* --------------------------------------------------------- */}
        {/* FOLHA DE IMPRESSÃO PROFISSIONAL (SEM CHECKLIST) */}
        {/* --------------------------------------------------------- */}
        {os && (
          <div className="hidden print:block text-slate-900 font-sans p-6 bg-white leading-relaxed text-left max-w-[210mm] mx-auto text-[11px]">
            
            {/* CABEÇALHO DA LOJA */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">{configLoja.nomeLoja}</h1>
                <p className="text-xs text-slate-600 font-semibold">{configLoja.subtitulo}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  CNPJ: {configLoja.cnpj || "Não configurado"} | Tel: {configLoja.telefone || "Não configurado"} | End: {configLoja.endereco || "Não configurado"}
                </p>
              </div>
              <div className="text-right border-l-2 border-slate-300 pl-4">
                <div className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-300">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Ordem de Serviço</span>
                  <span className="text-lg font-black font-mono text-blue-900">#{os.numero_os}</span>
                </div>
                <div className="text-[10px] text-slate-600 mt-2 space-y-0.5">
                  <p><strong>Abertura:</strong> {new Date(os.data_abertura).toLocaleDateString("pt-BR")}</p>
                  {os.data_prevista && <p><strong>Previsão:</strong> {new Date(os.data_prevista).toLocaleDateString("pt-BR")}</p>}
                </div>
              </div>
            </div>

            {/* DADOS DO CLIENTE E APARELHO */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50">
                <h3 className="font-bold uppercase text-slate-700 border-b border-slate-200 pb-1 mb-2 text-xs">👤 Dados do Cliente</h3>
                <p><strong>Nome:</strong> {os.cliente?.nome}</p>
                <p><strong>WhatsApp:</strong> {os.cliente?.whatsapp || "Não informado"}</p>
                <p><strong>CPF/CNPJ:</strong> {os.cliente?.cpfCnpj || "Não informado"}</p>
              </div>
              <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50">
                <h3 className="font-bold uppercase text-slate-700 border-b border-slate-200 pb-1 mb-2 text-xs">📱 Dados do Aparelho</h3>
                <p><strong>Modelo:</strong> {os.aparelho?.modelo}</p>
                <p><strong>IMEI / S/N:</strong> {os.aparelho?.imei1 || "Não informado"}</p>
                <p><strong>Senha:</strong> {os.aparelho?.senhaDesbloqueio || "Não informada"}</p>
              </div>
            </div>

            {/* DEFEITO E DIAGNÓSTICO */}
            <div className="border border-slate-300 rounded-lg p-3 mb-4 bg-slate-50/50">
              <h3 className="font-bold uppercase text-slate-700 border-b border-slate-200 pb-1 mb-1.5 text-xs">📋 Relato & Diagnóstico Técnico</h3>
              <p className="mb-1"><strong>Defeito Relatado:</strong> {os.defeitoRelatado}</p>
              {os.diagnostico && <p><strong>Diagnóstico Técnico:</strong> {os.diagnostico}</p>}
            </div>

            {/* VALORES E PAGAMENTO */}
            <div className="border border-slate-300 rounded-lg p-3 mb-4 flex justify-between items-center bg-slate-100 font-bold">
              <div>
                <span>Forma de Pagamento: {os.formaPagamento} {os.formaPagamento === "Cartão de Crédito" ? `(${os.parcelas}x)` : ''}</span>
              </div>
              <div className="text-sm text-blue-900">
                Valor Total: R$ {(os.orcamentoCalculado?.valorTotalOrcamento || 0).toFixed(2)}
              </div>
            </div>

            {/* CLÁUSULAS TÉCNICAS E TERMOS DE GARANTIA */}
            <div className="border border-slate-400 rounded-lg p-3 mb-6 bg-white text-[9px] text-slate-700 leading-tight space-y-1.5">
              <h3 className="font-bold uppercase text-slate-900 border-b border-slate-300 pb-1 text-[10px]">
                ⚖️ Termos de Garantia, Riscos e Condições de Serviço
              </h3>
              <p>
                <strong>1. Prazo e Cobertura de Garantia:</strong> A garantia legal é de 90 (noventa) dias corridos (conforme CDC) cobrindo exclusivamente a peça substituída e/ou o serviço técnico executado nesta ordem de serviço.
              </p>
              <p>
                <strong>2. Exclusão de Garantia:</strong> A garantia perde total validade em casos de: mau uso, quedas, impactos, infiltração de líquidos ou umidade, oxidação posterior, rompimento/violação de selos de garantia da loja, ou tentativa de reparo por terceiros ou pelo próprio cliente.
              </p>
              <p>
                <strong>3. Aparelhos "Mortos" ou com Falha em Placa (Microeletrônica):</strong> Aparelhos que dão entrada sem ligar, desligando sozinhos ou com histórico de danos por líquidos possuem riscos inerentes de agravamento irreversível de falhas devido à degradação prévia de componentes internos, isentando a assistência de responsabilidade por danos preexistentes.
              </p>
              <p>
                <strong>4. Prazo Limite de Retirada:</strong> O cliente tem o prazo máximo de 90 dias para retirar o equipamento após a conclusão do serviço. Aparelhos não retirados estarão sujeitos a cobrança de taxas de guarda ou encaminhados para descarte conforme legislação vigente.
              </p>
            </div>

            {/* ASSINATURAS */}
            <div className="grid grid-cols-2 gap-8 pt-6 mt-6 border-t border-slate-300 text-center">
              <div>
                <div className="border-b border-slate-400 pb-8 mb-1"></div>
                <p className="font-bold text-slate-700">{configLoja.nomeLoja}</p>
                <p className="text-[10px] text-slate-500">Assinatura do Técnico / Responsável</p>
              </div>
              <div>
                <div className="border-b border-slate-400 pb-8 mb-1"></div>
                <p className="font-bold text-slate-700">{os.cliente?.nome}</p>
                <p className="text-[10px] text-slate-500">Assinatura do Cliente</p>
              </div>
            </div>

            {/* RODAPÉ DISCRETO DO SISTEMA */}
            <div className="text-center text-[9px] text-slate-400 mt-8 pt-2 border-t border-slate-200">
              Documento gerado por Davi.tec — Gestão Técnica Especializada
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto space-y-8 pb-12">
      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Nova Ordem de Serviço</h2>
          <p className="text-sm text-zinc-400 mt-1">Cadastre um novo atendimento integrando clientes e serviços salvos com rapidez no balcão.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* CARD SUPERIOR: SELETOR DE GARANTIA EM DESTAQUE */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl backdrop-blur-md">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              Cobertura de Garantia para este Atendimento
            </h3>
            <p className="text-xs text-zinc-400">Serviços sem garantia ocultam botões de impressão e bloqueiam emissão de termos legais.</p>
          </div>
          <div className="flex items-center space-x-2 bg-zinc-950 p-2 border border-zinc-800 rounded-2xl shadow-inner">
            <button
              type="button"
              onClick={() => setPossuiGarantia(true)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${possuiGarantia ? "bg-emerald-600 text-white shadow-emerald-900/40" : "text-zinc-400 hover:text-white"}`}
            >
              ✓ Com Garantia
            </button>
            <button
              type="button"
              onClick={() => setPossuiGarantia(false)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${!possuiGarantia ? "bg-amber-600 text-white shadow-amber-900/40" : "text-zinc-400 hover:text-white"}`}
            >
              ✕ Sem Garantia
            </button>
          </div>
        </div>

        {/* BLOCO 1 E BLOCO 2: CLIENTE & APARELHO EM GRID LADO A LADO ESPAÇOSO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* BLOCO 1: DADOS DO CLIENTE */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-3xl space-y-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center space-x-3 border-b border-zinc-800/80 pb-4">
                <span className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">1</span>
                <h3 className="text-base font-bold text-white tracking-wide">Dados do Cliente</h3>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Selecionar Cliente Cadastrado</label>
                <select
                  value={idClienteSelecionado}
                  onChange={handleSelecionarCliente}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                >
                  <option value="">Ou selecione da base de cadastros...</option>
                  {listaClientes.map((c) => (
                    <option key={c.id_cliente || c.id} value={c.id_cliente || c.id}>
                      {c.nome} — {c.whatsapp || c.telefone || "Sem WhatsApp"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo do cliente..."
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(85) 99999-9999"
                    value={whatsappCliente}
                    onChange={(e) => setWhatsappCliente(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">CPF / CNPJ</label>
                  <input
                    type="text"
                    placeholder="Opcional..."
                    value={cpfCnpjCliente}
                    onChange={(e) => setCpfCnpjCliente(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BLOCO 2: APARELHO & DATAS */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-3xl space-y-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center space-x-3 border-b border-zinc-800/80 pb-4">
                <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs">2</span>
                <h3 className="text-base font-bold text-white tracking-wide">Aparelho & Datas</h3>
              </div>

              <div className="relative space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Modelo do Aparelho *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: iPhone 13, Samsung S22..."
                  value={modeloAparelho}
                  onChange={handleDigitarModelo}
                  onBlur={() => setSugestoesAparelho([])}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                />
                {sugestoesAparelho.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-zinc-800">
                    {sugestoesAparelho.map((modelo, index) => (
                      <button
                        key={index}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setModeloAparelho(modelo);
                          setSugestoesAparelho([]);
                        }}
                        className="w-full text-left px-4 py-3 text-zinc-200 hover:bg-blue-600/35 transition text-xs font-medium"
                      >
                        {modelo}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">IMEI / Nº de Série</label>
                  <input
                    type="text"
                    placeholder="Opcional..."
                    value={imeiAparelho}
                    onChange={(e) => setImeiAparelho(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Senha de Desbloqueio</label>
                  <input
                    type="text"
                    placeholder="PIN / Padrão..."
                    value={senhaAparelho}
                    onChange={(e) => setSenhaAparelho(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Data de Abertura</label>
                  <input
                    type="date"
                    value={dataAbertura}
                    onChange={(e) => setDataAbertura(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Previsão de Entrega</label>
                  <input
                    type="date"
                    value={dataPrevista}
                    onChange={(e) => setDataPrevista(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* BLOCO 3: SERVIÇO, DIAGNÓSTICO & CUSTOS */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-3xl space-y-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center space-x-3 border-b border-zinc-800/80 pb-4">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">3</span>
            <h3 className="text-base font-bold text-white tracking-wide">Serviço, Diagnóstico & Custos</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Serviço Padrão (Opcional)</label>
              <select
                value={servicoSelecionadoId}
                onChange={handleSelecionarServico}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
              >
                <option value="">Selecione da base de serviços...</option>
                {listaServicos.map((s) => (
                  <option key={s.id_servico || s.id} value={s.id_servico || s.id}>
                    {s.nome} (R$ {Number(s.preco_sugerido || s.preco || 0).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Defeito Relatado / Descrição do Serviço *</label>
              <input
                type="text"
                required
                placeholder="Ex: Troca de Tela Frontal..."
                value={defeitoRelatado}
                onChange={(e) => setDefeitoRelatado(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Diagnóstico Técnico</label>
              <input
                type="text"
                placeholder="Ex: Display quebrado sem imagem..."
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Observações Internas</label>
              <input
                type="text"
                placeholder="Ex: Aparelho sem gaveta de chip..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* GRID DE CUSTOS E PAGAMENTO */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-zinc-800/80">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Custo Peça (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={custoPeca}
                onChange={(e) => setCustoPeca(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-blue-500 transition-all shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Frete Real (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={freteReal}
                onChange={(e) => setFreteReal(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-blue-500 transition-all shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Fornecedor</label>
              <select
                value={fornecedorPeca}
                onChange={(e) => setFornecedorPeca(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-blue-500 transition-all shadow-inner"
              >
                <option value="">Selecione...</option>
                {listaFornecedores.map((f) => (
                  <option key={f.id_fornecedor || f.id} value={f.nome}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-rose-400 uppercase tracking-wider block">Tipo Desc.</label>
              <select
                value={tipoDesconto}
                onChange={(e) => setTipoDesconto(e.target.value as any)}
                className="w-full bg-zinc-950/80 border border-rose-500/40 rounded-2xl p-3.5 text-xs text-rose-400 font-bold outline-none shadow-inner"
              >
                <option value="VALOR">Valor (R$)</option>
                <option value="PERCENTUAL">Porc (%)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-rose-400 uppercase tracking-wider block">Desconto</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={descontoGeral}
                onChange={(e) => setDescontoGeral(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-zinc-950/80 border border-rose-500/40 rounded-2xl p-3.5 text-xs text-rose-400 font-bold outline-none shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Valor Bruto *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={valorTotalOrcamento}
                onChange={(e) => setValorTotalOrcamento(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-zinc-950/80 border border-emerald-500/50 rounded-2xl p-3.5 text-xs text-emerald-400 font-bold outline-none shadow-inner"
              />
            </div>
          </div>

          {/* LINHA DE PAGAMENTO (FORMA DE PAGAMENTO, PARCELAS E VALOR LÍQUIDO) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80">
            <div className="space-y-2">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Forma de Pagamento *</label>
              <select
                value={formaPagamento}
                onChange={(e) => {
                  setFormaPagamento(e.target.value);
                  if (e.target.value !== "Cartão de Crédito") {
                    setParcelas(1);
                  }
                  if (e.target.value !== "Cartão de Crédito" && e.target.value !== "Cartão de Débito") {
                    setValorLiquido("");
                  }
                }}
                className="w-full bg-zinc-950/80 border border-amber-500/50 rounded-2xl p-3.5 text-xs text-amber-400 font-bold outline-none shadow-inner"
              >
                <option value="PIX">PIX</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
              </select>
            </div>

            {formaPagamento === "Cartão de Crédito" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-blue-400 uppercase tracking-wider block">Quantidade de Parcelas</label>
                <select
                  value={parcelas}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    setParcelas(p);
                    if (p > 3) setValorLiquido("");
                  }}
                  className="w-full bg-zinc-950/80 border border-blue-500/50 rounded-2xl p-3.5 text-xs text-blue-400 font-bold outline-none shadow-inner"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num}x {num <= 3 ? "(Sem Juros)" : "(Juros Clientes)"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formaPagamento === "Cartão de Débito" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-purple-400 uppercase tracking-wider block">Valor Líquido Recebido (Débito)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: Valor líquido na maquininha..."
                  value={valorLiquido}
                  onChange={(e) => setValorLiquido(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-zinc-950/80 border border-purple-500/50 rounded-2xl p-3.5 text-xs text-purple-400 font-bold outline-none shadow-inner"
                />
              </div>
            )}

            {formaPagamento === "Cartão de Crédito" && parcelas <= 3 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-purple-400 uppercase tracking-wider block">Valor Líquido Recebido (Crédito)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: Valor líquido na maquininha..."
                  value={valorLiquido}
                  onChange={(e) => setValorLiquido(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-zinc-950/80 border border-purple-500/50 rounded-2xl p-3.5 text-xs text-purple-400 font-bold outline-none shadow-inner"
                />
              </div>
            )}
          </div>
        </div>

        {/* BOTÃO SALVAR EM DESTAQUE */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={carregando}
            className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-600/30 flex items-center space-x-3 text-sm active:scale-95"
          >
            {carregando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Cadastrando...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Salvar e Gerar Ordem de Serviço</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};