import express, { type Request, type Response } from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

declare const process: any;

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool(process.env.DATABASE_URL!);

interface RegistroGarantia {
  houveGarantia?: boolean;
  custoPecaGarantia?: number;
  prejuizoTotalGarantia?: number;
  [key: string]: any;
}

const formatarDataLocal = (dataStr: string | undefined) => {
  if (!dataStr) return null;
  if (dataStr.length === 10) {
    return new Date(`${dataStr}T12:00:00`);
  }
  return new Date(dataStr);
};

// 1. CÁLCULO DE ORÇAMENTO TRANSPARENTE
app.post("/v1/orcamentos/calcular", async (req: Request, res: Response) => {
  try {
    const { itens, descontoGeral } = req.body;
    let subtotalServicos = 0;
    let totalCustoPecas = 0;
    let totalFrete = 0;

    const itensCalculados = [];

    if (Array.isArray(itens)) {
      for (const item of itens) {
        const { idRegra, custoPeca = 0, freteReal = 0 } = item;
        let subtotalItem = 0;

        if (idRegra) {
          const [rows]: any = await pool.query(
            "SELECT * FROM regras_precificacao WHERE id_regra = ?",
            [idRegra]
          );
          if (rows.length > 0) {
            const regra = rows[0];
            if (regra.categoria === "FORMULA_PECA") {
              const mult = parseFloat(regra.multiplicador_peca) || 2;
              const mo = parseFloat(regra.mao_de_obra_padrao) || 50;
              const custos = parseFloat(regra.custos_adicionais_padrao) || 0;
              subtotalItem = custoPeca * mult + mo + freteReal + custos;
            } else {
              subtotalItem = parseFloat(regra.preco_fixo_venda) || 100;
            }
          }
        } else {
          subtotalItem = custoPeca * 2 + freteReal;
        }

        totalCustoPecas += Number(custoPeca);
        totalFrete += Number(freteReal);
        subtotalServicos += subtotalItem;

        itensCalculados.push({
          idRegra,
          subtotalItem,
          lucroEstimadoItem: subtotalItem - (custoPeca + freteReal),
        });
      }
    }

    const valorDesconto = Number(descontoGeral?.valor) || 0;
    const valorTotalOrcamento = Math.max(0, subtotalServicos - valorDesconto);
    const lucroTotalEstimado = valorTotalOrcamento - (totalCustoPecas + totalFrete);

    return res.json({
      sucesso: true,
      data: {
        itensCalculados,
        resumoFinanceiro: {
          subtotalServicos,
          descontoGeralAplicado: valorDesconto,
          valorTotalOrcamento,
          lucroTotalEstimadoInterno: lucroTotalEstimado,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// 2. ABERTURA DE ORDEM DE SERVIÇO (PERSISTÊNCIA DINÂMICA DE CUSTOS)
app.post("/v1/ordens-servico", async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const {
      cliente,
      aparelho,
      defeitoRelatado,
      diagnostico,
      servicoRealizado,
      pecasUtilizadas,
      observacoes,
      dataAbertura,
      dataPrevistaEntrega,
      checklistEntrada,
      orcamentoCalculado,
    } = req.body;

    let clienteId = cliente?.idCliente;
    if (!clienteId || typeof clienteId !== "string" || clienteId.trim() === "") {
      clienteId = uuidv4();
      const cpfCnpjValido = cliente?.cpfCnpj?.trim() ? cliente.cpfCnpj.trim() : null;
      const emailValido = cliente?.email?.trim() ? cliente.email.trim() : null;

      await connection.query(
        "INSERT INTO clientes (id_cliente, nome, cpf_cnpj, whatsapp, email) VALUES (?, ?, ?, ?, ?)",
        [
          clienteId,
          cliente?.nome || "Cliente não informado",
          cpfCnpjValido,
          cliente?.whatsapp || "",
          emailValido,
        ]
      );
    }

    const aparelhoId = uuidv4();
    await connection.query(
      "INSERT INTO aparelhos_cliente (id_aparelho, id_cliente, modelo, imei_1, senha_desbloqueio) VALUES (?, ?, ?, ?, ?)",
      [
        aparelhoId,
        clienteId,
        aparelho?.modelo || "Não especificado",
        aparelho?.imei1 || "",
        aparelho?.senhaDesbloqueio || "",
      ]
    );

    const osId = uuidv4();
    const numeroOsGerado = `OS-${Date.now().toString().slice(-6)}`;
    
    // Captura dos custos reais preenchidos
    const numPeca = Number(orcamentoCalculado?.custoPeca) || 0;
    const numFrete = Number(orcamentoCalculado?.freteReal) || 0;
    const desconto = Number(orcamentoCalculado?.descontoGeralAplicado) || 0;
    const valorTotal = Number(orcamentoCalculado?.valorTotalOrcamento) || 0;
    const subtotal = Number(orcamentoCalculado?.subtotalServicos) || (valorTotal + desconto);
    
    // Lucro Real = Valor Cobrado - (Custo Peça + Frete)
    const lucroReal = valorTotal - (numPeca + numFrete);
    const fornecedorPeca = orcamentoCalculado?.fornecedorPeca || null;

    const dataFinalAbertura = formatarDataLocal(dataAbertura) || new Date();

    const historicoInicial = [
      {
        id: uuidv4(),
        data: new Date().toISOString(),
        descricao: "Ordem de Serviço criada no sistema.",
        autor: "Técnico",
      },
    ];

    await connection.query(
      `INSERT INTO ordens_servico 
       (id_os, numero_os, id_cliente, id_aparelho, status_os, defeito_relatado, checklist_entrada, subtotal_servicos, desconto_valor, valor_total, lucro_estimado_total, custo_peca, frete_real, fornecedor_peca, data_abertura, historico_json) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        osId,
        numeroOsGerado,
        clienteId,
        aparelhoId,
        "AGUARDANDO_AVALIACAO",
        defeitoRelatado || "Defeito não informado",
        JSON.stringify(checklistEntrada || {}),
        subtotal,
        desconto,
        valorTotal,
        lucroReal,
        numPeca,
        numFrete,
        fornecedorPeca,
        dataFinalAbertura,
        JSON.stringify(historicoInicial),
      ]
    );

    await connection.commit();
    console.log(`✅ OS Criada: ${numeroOsGerado} | Cobrado: R$ ${valorTotal} | Peça: R$ ${numPeca} | Frete: R$ ${numFrete} | Lucro: R$ ${lucroReal}`);
    return res.status(201).json({
      sucesso: true,
      data: { idOs: osId, numeroOs: numeroOsGerado },
    });
  } catch (err: any) {
    await connection.rollback();
    console.error("❌ Erro ao criar OS:", err.message);
    return res.status(500).json({ sucesso: false, erro: err.message });
  } finally {
    connection.release();
  }
});

// 3. LISTAGEM DE ORDENS DE SERVIÇO
app.get("/v1/ordens-servico", async (_req: Request, res: Response) => {
  try {
    const [columnsResult]: any = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ordens_servico'
    `);
    const colunasExistentes = new Set(
      columnsResult.map((c: any) => c.COLUMN_NAME.toLowerCase())
    );

    const selectGarantia = colunasExistentes.has('garantia_json') ? 'os.garantia_json AS garantiaJson' : 'NULL AS garantiaJson';
    const selectHistorico = colunasExistentes.has('historico_json') ? 'os.historico_json AS historicoJson' : 'NULL AS historicoJson';
    const selectChecklist = colunasExistentes.has('checklist_entrada') ? 'os.checklist_entrada AS checklistEntrada' : 'NULL AS checklistEntrada';
    const selectCusto = colunasExistentes.has('custo_peca') ? 'os.custo_peca AS custoPeca' : '0 AS custoPeca';
    const selectFrete = colunasExistentes.has('frete_real') ? 'os.frete_real AS freteReal' : '0 AS freteReal';
    const selectFornecedor = colunasExistentes.has('fornecedor_peca') ? 'os.fornecedor_peca AS fornecedorPeca' : 'NULL AS fornecedorPeca';
    const selectDiag = colunasExistentes.has('diagnostico_tecnico') ? 'os.diagnostico_tecnico AS diagnostico' : 'NULL AS diagnostico';
    const selectServico = colunasExistentes.has('servico_realizado') ? 'os.servico_realizado AS servicoRealizado' : 'NULL AS servicoRealizado';
    const selectPecas = colunasExistentes.has('pecas_utilizadas') ? 'os.pecas_utilizadas AS pecasUtilizadas' : 'NULL AS pecasUtilizadas';
    const selectObs = colunasExistentes.has('observacoes_internas') ? 'os.observacoes_internas AS observacoes' : 'NULL AS observacoes';
    const selectPrevista = colunasExistentes.has('data_prevista_entrega') ? 'os.data_prevista_entrega AS dataPrevistaEntrega' : 'NULL AS dataPrevistaEntrega';
    const selectConclusao = colunasExistentes.has('data_conclusao') ? 'os.data_conclusao AS dataConclusao' : 'NULL AS dataConclusao';

    const [rows]: any = await pool.query(`
      SELECT 
        os.id_os, os.numero_os, os.status_os, os.defeito_relatado AS defeitoRelatado,
        os.subtotal_servicos AS subtotalServicos, os.desconto_valor AS descontoValor,
        os.valor_total AS valorTotal, os.lucro_estimado_total AS lucroEstimadoTotal,
        os.data_abertura,
        ${selectGarantia}, ${selectHistorico}, ${selectChecklist},
        ${selectCusto}, ${selectFrete}, ${selectFornecedor},
        ${selectDiag}, ${selectServico}, ${selectPecas}, ${selectObs},
        ${selectPrevista}, ${selectConclusao},
        c.nome AS clienteNome, c.cpf_cnpj AS clienteCpfCnpj, c.whatsapp AS clienteWhatsapp, c.email AS clienteEmail,
        a.modelo AS aparelhoModelo, a.imei_1 AS aparelhoImei1, a.senha_desbloqueio AS aparelhoSenhaDesbloqueio
      FROM ordens_servico os
      LEFT JOIN clientes c ON os.id_cliente = c.id_cliente
      LEFT JOIN aparelhos_cliente a ON os.id_aparelho = a.id_aparelho
      ORDER BY os.data_abertura DESC
    `);

    const ordensFormatadas = rows.map((row: any) => {
      let garantia: RegistroGarantia = { houveGarantia: false };
      if (row.garantiaJson) {
        try {
          garantia = typeof row.garantiaJson === "string"
            ? JSON.parse(row.garantiaJson || "{}")
            : row.garantiaJson;
        } catch {
          garantia = { houveGarantia: false };
        }
      }

      let checklist = {};
      if (row.checklistEntrada) {
        try {
          checklist = typeof row.checklistEntrada === "string"
            ? JSON.parse(row.checklistEntrada || "{}")
            : row.checklistEntrada;
        } catch {
          checklist = {};
        }
      }

      let historico = [];
      if (row.historicoJson) {
        try {
          historico = typeof row.historicoJson === "string"
            ? JSON.parse(row.historicoJson || "[]")
            : row.historicoJson;
        } catch {
          historico = [];
        }
      }

      const numPeca = Number(row.custoPeca || 0);
      const numFrete = Number(row.freteReal || 0);
      const valorTotalCobrado = Number(row.valorTotal || 0);
      const custoGarantia = Number(garantia?.custoPecaGarantia || garantia?.prejuizoTotalGarantia || 0);
      
      // Recálculo garantido do Lucro Real
      const lucroRealRecalculado = valorTotalCobrado - (numPeca + numFrete + custoGarantia);

      return {
        id_os: row.id_os,
        numero_os: row.numero_os,
        status_os: row.status_os || "AGUARDANDO_AVALIACAO",
        defeitoRelatado: row.defeitoRelatado || "",
        diagnostico: row.diagnostico || "",
        servicoRealizado: row.servicoRealizado || "",
        pecasUtilizadas: row.pecasUtilizadas || "",
        observacoes: row.observacoes || "",
        checklistEntrada: checklist,
        data_abertura: row.data_abertura,
        data_prevista_entrega: row.dataPrevistaEntrega || null,
        data_conclusao: row.dataConclusao || null,
        garantia: garantia,
        historico: historico,
        cliente: {
          nome: row.clienteNome || "Cliente sem nome",
          cpfCnpj: row.clienteCpfCnpj || "",
          whatsapp: row.clienteWhatsapp || "",
          email: row.clienteEmail || "",
        },
        aparelho: {
          modelo: row.aparelhoModelo || "Não especificado",
          imei1: row.aparelhoImei1 || "",
          senhaDesbloqueio: row.aparelhoSenhaDesbloqueio || "",
        },
        orcamentoCalculado: {
          subtotalServicos: Number(row.subtotalServicos || 0),
          descontoGeralAplicado: Number(row.descontoValor || 0),
          valorTotalOrcamento: valorTotalCobrado,
          lucroTotalEstimadoInterno: lucroRealRecalculado,
          custoPeca: numPeca,
          freteReal: numFrete,
          fornecedorPeca: row.fornecedorPeca || "",
        },
      };
    });

    return res.json({ sucesso: true, data: ordensFormatadas });
  } catch (err: any) {
    console.error("❌ Erro ao listar OS:", err.message);
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// 4. ATUALIZAR STATUS
app.patch("/v1/ordens-servico/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status_os } = req.body;
    await pool.query("UPDATE ordens_servico SET status_os = ? WHERE id_os = ?", [
      status_os,
      id,
    ]);
    return res.json({ sucesso: true, mensagem: "Status atualizado!" });
  } catch (err: any) {
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// 5. REGISTRAR RETORNO DE GARANTIA E RECALCULAR LUCRO
app.patch("/v1/ordens-servico/:id/garantia", async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { garantia, novaOcorrencia } = req.body;

    const [rows]: any = await connection.query(
      "SELECT * FROM ordens_servico WHERE id_os = ?",
      [id]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ sucesso: false, erro: "OS não encontrada" });
    }

    const os = rows[0];
    let historicoAtual = [];
    try {
      historicoAtual = typeof os.historico_json === "string"
        ? JSON.parse(os.historico_json || "[]")
        : os.historico_json || [];
    } catch {
      historicoAtual = [];
    }

    if (novaOcorrencia) {
      historicoAtual.push({
        id: uuidv4(),
        data: new Date().toISOString(),
        ...novaOcorrencia,
      });
    }

    const custoPecaGarantia = Number(garantia?.custoPecaGarantia || 0);
    const custoPecaOriginal = Number(os.custo_peca || 0);
    const freteOriginal = Number(os.frete_real || 0);
    const valorCobrado = Number(os.valor_total || 0);

    const novoLucroReal = valorCobrado - (custoPecaOriginal + freteOriginal + custoPecaGarantia);

    await connection.query(
      "UPDATE ordens_servico SET garantia_json = ?, historico_json = ?, lucro_estimado_total = ? WHERE id_os = ?",
      [JSON.stringify(garantia), JSON.stringify(historicoAtual), novoLucroReal, id]
    );

    await connection.commit();
    return res.json({ sucesso: true, mensagem: "Garantia e lucro recalculados com sucesso!" });
  } catch (err: any) {
    await connection.rollback();
    return res.status(500).json({ sucesso: false, erro: err.message });
  } finally {
    connection.release();
  }
});

// 6. EXCLUIR ORDEM DE SERVIÇO
app.delete("/v1/ordens-servico/:id", async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    await connection.query("DELETE FROM ordens_servico WHERE id_os = ?", [id]);
    await connection.commit();
    return res.json({ sucesso: true, mensagem: "Ordem de Serviço excluída!" });
  } catch (err: any) {
    await connection.rollback();
    return res.status(500).json({ sucesso: false, erro: err.message });
  } finally {
    connection.release();
  }
});

// 7. EDITAR ORDEM DE SERVIÇO COMPLETA E RECALCULAR CUSTOS/LUCRO DINAMICAMENTE
app.put("/v1/ordens-servico/:id", async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const {
      cliente,
      aparelho,
      defeitoRelatado,
      status_os,
      data_abertura,
      orcamentoCalculado,
      garantia,
      modificacoesLog,
    } = req.body;

    const [rows]: any = await connection.query(
      `SELECT os.*, c.id_cliente, a.id_aparelho 
       FROM ordens_servico os 
       JOIN clientes c ON os.id_cliente = c.id_cliente 
       JOIN aparelhos_cliente a ON os.id_aparelho = a.id_aparelho 
       WHERE os.id_os = ?`,
      [id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ sucesso: false, erro: "OS não encontrada." });
    }

    const osAntiga = rows[0];

    await connection.query(
      "UPDATE clientes SET nome = ?, cpf_cnpj = ?, whatsapp = ?, email = ? WHERE id_cliente = ?",
      [
        cliente?.nome || osAntiga.nome,
        cliente?.cpfCnpj || null,
        cliente?.whatsapp || "",
        cliente?.email || null,
        osAntiga.id_cliente,
      ]
    );

    await connection.query(
      "UPDATE aparelhos_cliente SET modelo = ?, imei_1 = ?, senha_desbloqueio = ? WHERE id_aparelho = ?",
      [
        aparelho?.modelo || osAntiga.modelo,
        aparelho?.imei1 || "",
        aparelho?.senhaDesbloqueio || "",
        osAntiga.id_aparelho,
      ]
    );

    let historico = [];
    try {
      historico = typeof osAntiga.historico_json === "string" 
        ? JSON.parse(osAntiga.historico_json || "[]") 
        : osAntiga.historico_json || [];
    } catch {
      historico = [];
    }

    if (Array.isArray(modificacoesLog) && modificacoesLog.length > 0) {
      modificacoesLog.forEach((logText: string) => {
        historico.push({
          id: uuidv4(),
          data: new Date().toISOString(),
          descricao: `Edição: ${logText}`,
          autor: "Técnico / Sistema",
        });
      });
    }

    const numPeca = Number(orcamentoCalculado?.custoPeca) ?? Number(osAntiga.custo_peca || 0);
    const numFrete = Number(orcamentoCalculado?.freteReal) ?? Number(osAntiga.frete_real || 0);
    const desconto = Number(orcamentoCalculado?.descontoGeralAplicado) ?? Number(osAntiga.desconto_valor || 0);
    const valorTotal = Number(orcamentoCalculado?.valorTotalOrcamento) ?? Number(osAntiga.valor_total || 0);
    const subtotal = valorTotal + desconto;
    
    let custoGarantia = 0;
    const garantiaTyped = garantia as RegistroGarantia;
    if (garantiaTyped) {
      custoGarantia = Number(garantiaTyped.custoPecaGarantia || garantiaTyped.prejuizoTotalGarantia || 0);
    }

    // Recálculo dinâmico transparente na edição
    const lucroRealAjustado = valorTotal - (numPeca + numFrete + custoGarantia);
    const dataAberturaAjustada = formatarDataLocal(data_abertura) || osAntiga.data_abertura;

    await connection.query(
      `UPDATE ordens_servico SET 
        status_os = ?,
        defeito_relatado = ?,
        subtotal_servicos = ?,
        desconto_valor = ?,
        valor_total = ?,
        lucro_estimado_total = ?,
        custo_peca = ?,
        frete_real = ?,
        fornecedor_peca = ?,
        data_abertura = ?,
        garantia_json = ?,
        historico_json = ?
       WHERE id_os = ?`,
      [
        status_os || osAntiga.status_os,
        defeitoRelatado || osAntiga.defeito_relatado,
        subtotal,
        desconto,
        valorTotal,
        lucroRealAjustado,
        numPeca,
        numFrete,
        orcamentoCalculado?.fornecedorPeca || osAntiga.fornecedor_peca,
        dataAberturaAjustada,
        garantia ? JSON.stringify(garantia) : osAntiga.garantia_json,
        JSON.stringify(historico),
        id,
      ]
    );

    await connection.commit();
    return res.json({ sucesso: true, mensagem: "OS e indicadores recalculados!" });
  } catch (err: any) {
    await connection.rollback();
    return res.status(500).json({ sucesso: false, erro: err.message });
  } finally {
    connection.release();
  }
});

const PORT = (typeof process !== "undefined" && process.env && process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`🚀 Backend SIG-Apple rodando na porta ${PORT}`));