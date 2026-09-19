import React, { useState, useEffect } from "react";
import { criarOrdemServico } from "../services/api";

export const NovaOS: React.FC = () => {
  const [listaClientes, setListaClientes] = useState<any[]>([]);
  const [listaFornecedores, setListaFornecedores] = useState<any[]>([]);
  const [listaServicos, setListaServicos] = useState<any[]>([]);

  // Lista padrão de aparelhos populares em assistências
  const modelosPopulares = [
    // iPhones
    "iPhone 7", "iPhone 8", "iPhone 8 Plus", "iPhone X", "iPhone XR", "iPhone XS", "iPhone XS Max",
    "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max", "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max", "iPhone 12 Mini",
    "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max", "iPhone 13 Mini", "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
    "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max", "iPhone 16", "iPhone 16 Pro",
    // Samsung
    "Samsung Galaxy A03", "Samsung Galaxy A04", "Samsung Galaxy A05", "Samsung Galaxy A13", "Samsung Galaxy A14", "Samsung Galaxy A15",
    "Samsung Galaxy A32", "Samsung Galaxy A33", "Samsung Galaxy A34", "Samsung Galaxy A53", "Samsung Galaxy A54", "Samsung Galaxy A55",
    "Samsung Galaxy S20", "Samsung Galaxy S21", "Samsung Galaxy S22", "Samsung Galaxy S23", "Samsung Galaxy S24", "Samsung Galaxy S24 Ultra",
    // Xiaomi / Redmi
    "Redmi 9C", "Redmi 10", "Redmi 12", "Redmi 13C", "Redmi Note 10", "Redmi Note 11", "Redmi Note 12", "Redmi Note 13", "POCO X5", "POCO X6",
    // Motorola
    "Moto G13", "Moto G14", "Moto G23", "Moto G24", "Moto G32", "Moto G52", "Moto G53", "Moto G54", "Moto Edge 30", "Moto Edge 40"
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
  const [valorTotalOrcamento, setValorTotalOrcamento] = useState<number | "">("");
  const [servicoSelecionadoId, setServicoSelecionadoId] = useState("");

  const [possuiGarantia, setPossuiGarantia] = useState<boolean>(true);

  const [dataAbertura, setDataAbertura] = useState(
    new Date().toISOString().substring(0, 10),
  );
  const [dataPrevista, setDataPrevista] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sucessoMsg, setSucessoMsg] = useState("");

  const [checklist, setChecklist] = useState({
    tela: "Bom",
    bateria: "Bom",
    carregamento: "Funcionando",
    cameras: "Funcionando",
    audio: "Funcionando",
    botoes: "Funcionando",
  });

  useEffect(() => {
    const carregarDadosCadastrados = async () => {
      try {
        const resCli = await fetch("http://localhost:3000/v1/clientes");
        const dataCli = await resCli.json();
        if (dataCli.sucesso) setListaClientes(dataCli.data);

        const resForn = await fetch("http://localhost:3000/v1/cadastros/fornecedores");
        const dataForn = await resForn.json();
        if (dataForn.sucesso) setListaFornecedores(dataForn.data);

        const resServ = await fetch("http://localhost:3000/v1/cadastros/servicos");
        const dataServ = await resServ.json();
        if (dataServ.sucesso) setListaServicos(dataServ.data);
      } catch (err) {
        console.error("Erro ao buscar cadastros:", err);
      }
    };
    carregarDadosCadastrados();
  }, []);

  const handleSelecionarCliente = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setIdClienteSelecionado(id);
    const cli = listaClientes.find((c) => c.id_cliente === id);
    if (cli) {
      setNomeCliente(cli.nome || "");
      setWhatsappCliente(cli.whatsapp || "");
      setCpfCnpjCliente(cli.cpf_cnpj || "");
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
    const serv = listaServicos.find((s) => s.id_servico === id);
    if (serv) {
      setDefeitoRelatado(serv.nome);
      if (serv.preco_sugerido) {
        setValorTotalOrcamento(Number(serv.preco_sugerido));
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

    setCarregando(true);
    setSucessoMsg("");

    try {
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
        checklistEntrada: checklist,
        possuiGarantia,
        formaPagamento,
        parcelas,
        valorLiquido: formaPagamento === "Cartão de Crédito" && parcelas <= 3 && valorLiquido !== "" ? Number(valorLiquido) : null,
        orcamentoCalculado: {
          custoPeca: custoPeca === "" ? 0 : Number(custoPeca),
          freteReal: freteReal === "" ? 0 : Number(freteReal),
          fornecedorPeca,
          descontoGeralAplicado: descontoGeral === "" ? 0 : Number(descontoGeral),
          valorTotalOrcamento: valorTotalOrcamento === "" ? 0 : Number(valorTotalOrcamento),
          subtotalServicos:
            (valorTotalOrcamento === "" ? 0 : Number(valorTotalOrcamento)) +
            (descontoGeral === "" ? 0 : Number(descontoGeral)),
        },
      };

      const resposta: any = await criarOrdemServico(payload as any);

      if (resposta && resposta.numeroOs) {
        setSucessoMsg(`Ordem de Serviço ${resposta.numeroOs} criada com sucesso!`);
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
      } else {
        alert("Erro ao criar OS.");
      }
    } catch (err: any) {
      alert(err.message || "Erro de conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 text-xs text-zinc-300">
      <div className="border-b border-zinc-800 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Nova Ordem de Serviço</h2>
          <p className="text-zinc-400 mt-0.5">
            Cadastre um novo atendimento integrando clientes e serviços salvos.
          </p>
        </div>
        {sucessoMsg && (
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-xl animate-bounce">
            {sucessoMsg}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SELETOR DE GARANTIA */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">
              Cobertura de Garantia para este Atendimento
            </h3>
            <p className="text-zinc-400">
              Serviços sem garantia ocultam botões de impressão e bloqueiam emissão de termos.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-zinc-950 p-1.5 border border-zinc-800 rounded-xl">
            <button
              type="button"
              onClick={() => setPossuiGarantia(true)}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                possuiGarantia
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Com Garantia
            </button>
            <button
              type="button"
              onClick={() => setPossuiGarantia(false)}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                !possuiGarantia
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sem Garantia
            </button>
          </div>
        </div>

        {/* ETAPA 1: CLIENTE E APARELHO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dados do Cliente */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-blue-400">1. Dados do Cliente</h3>

            <div>
              <label className="text-zinc-400 block mb-1">
                Selecionar Cliente Cadastrado
              </label>
              <select
                value={idClienteSelecionado}
                onChange={handleSelecionarCliente}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
              >
                <option value="">Ou selecione da base de cadastros...</option>
                {listaClientes.map((c) => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    {c.nome} — {c.whatsapp || "Sem WhatsApp"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                placeholder="Nome do cliente..."
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 block mb-1">WhatsApp</label>
                <input
                  type="text"
                  placeholder="(85) 99999-9999"
                  value={whatsappCliente}
                  onChange={(e) => setWhatsappCliente(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">CPF / CNPJ</label>
                <input
                  type="text"
                  placeholder="Opcional..."
                  value={cpfCnpjCliente}
                  onChange={(e) => setCpfCnpjCliente(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Dados do Aparelho */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-amber-400">2. Aparelho & Datas</h3>

            {/* AUTOCOMPLETE DO APARELHO */}
            <div className="relative">
              <label className="text-zinc-400 block mb-1">Modelo do Aparelho *</label>
              <input
                type="text"
                required
                placeholder="Ex: iPhone 13, Samsung S22..."
                value={modeloAparelho}
                onChange={handleDigitarModelo}
                onBlur={() => setTimeout(() => setSugestoesAparelho([]), 200)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
              />

              {sugestoesAparelho.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-zinc-800">
                  {sugestoesAparelho.map((modelo, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setModeloAparelho(modelo);
                        setSugestoesAparelho([]);
                      }}
                      className="w-full text-left px-3 py-2 text-zinc-200 hover:bg-blue-600/30 hover:text-white transition text-xs"
                    >
                      {modelo}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 block mb-1">IMEI / Nº de Série</label>
                <input
                  type="text"
                  placeholder="Opcional..."
                  value={imeiAparelho}
                  onChange={(e) => setImeiAparelho(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Senha de Desbloqueio</label>
                <input
                  type="text"
                  placeholder="PIN / Padrão..."
                  value={senhaAparelho}
                  onChange={(e) => setSenhaAparelho(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 block mb-1">Data de Abertura</label>
                <input
                  type="date"
                  value={dataAbertura}
                  onChange={(e) => setDataAbertura(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Previsão de Entrega</label>
                <input
                  type="date"
                  value={dataPrevista}
                  onChange={(e) => setDataPrevista(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ETAPA 2: SERVIÇO E ORÇAMENTO */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-emerald-400">
            3. Serviço, Diagnóstico & Custos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-zinc-400 block mb-1">Serviço Padrão (Opcional)</label>
              <select
                value={servicoSelecionadoId}
                onChange={handleSelecionarServico}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
              >
                <option value="">Selecione da base de serviços...</option>
                {listaServicos.map((s) => (
                  <option key={s.id_servico} value={s.id_servico}>
                    {s.nome} (Sugerido: R$ {Number(s.preco_sugerido || 0).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-zinc-400 block mb-1">
                Defeito Relatado / Descrição do Serviço *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Troca de Tela Frontal..."
                value={defeitoRelatado}
                onChange={(e) => setDefeitoRelatado(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 block mb-1">Diagnóstico Técnico</label>
              <input
                type="text"
                placeholder="Ex: Display quebrado sem imagem..."
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Observações Internas</label>
              <input
                type="text"
                placeholder="Ex: Aparelho sem gaveta de chip..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Custos e Valores */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pt-2 border-t border-zinc-800">
            <div>
              <label className="text-zinc-400 block mb-1">Custo da Peça (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={custoPeca}
                onChange={(e) =>
                  setCustoPeca(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Frete Real (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={freteReal}
                onChange={(e) =>
                  setFreteReal(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Fornecedor da Peça</label>
              <select
                value={fornecedorPeca}
                onChange={(e) => setFornecedorPeca(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
              >
                <option value="">Selecione o fornecedor...</option>
                {listaFornecedores.map((f) => (
                  <option key={f.id_fornecedor} value={f.nome}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1 font-bold text-amber-400">
                Forma de Pagto *
              </label>
              <select
                value={formaPagamento}
                onChange={(e) => {
                  setFormaPagamento(e.target.value);
                  if (e.target.value !== "Cartão de Crédito") {
                    setParcelas(1);
                    setValorLiquido("");
                  }
                }}
                className="w-full bg-zinc-950 border border-amber-500/50 rounded-xl p-2.5 text-amber-400 font-bold outline-none focus:border-amber-500"
              >
                <option value="PIX">PIX</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
              </select>
            </div>

            {/* SE FOR CARTÃO DE CRÉDITO: Exibe Parcelas */}
            {formaPagamento === "Cartão de Crédito" && (
              <div>
                <label className="text-zinc-400 block mb-1 font-bold text-blue-400">
                  Parcelas
                </label>
                <select
                  value={parcelas}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    setParcelas(p);
                    if (p > 3) setValorLiquido("");
                  }}
                  className="w-full bg-zinc-950 border border-blue-500/50 rounded-xl p-2.5 text-blue-400 font-bold outline-none focus:border-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num}x {num <= 3 ? "(Sem Juros)" : "(Juros Clientes)"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* SE FOR CARTÃO DE CRÉDITO EM ATÉ 3X: Exibe Valor Líquido */}
            {formaPagamento === "Cartão de Crédito" && parcelas <= 3 && (
              <div>
                <label className="text-zinc-400 block mb-1 font-bold text-purple-400">
                  Valor Líquido (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ex: 232.00"
                  value={valorLiquido}
                  onChange={(e) =>
                    setValorLiquido(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full bg-zinc-950 border border-purple-500/50 rounded-xl p-2.5 text-purple-400 font-bold outline-none focus:border-purple-500"
                />
              </div>
            )}

            <div>
              <label className="text-zinc-400 block mb-1 font-bold text-emerald-400">
                Valor Cobrado (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={valorTotalOrcamento}
                onChange={(e) =>
                  setValorTotalOrcamento(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="w-full bg-zinc-950 border border-emerald-500/50 rounded-xl p-2.5 text-emerald-400 font-bold outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={carregando}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center space-x-2"
          >
            {carregando ? (
              <span>Cadastrando...</span>
            ) : (
              <span>💾 Salvar e Gerar Ordem de Serviço</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};