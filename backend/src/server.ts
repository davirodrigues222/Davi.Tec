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

// ==================== ROTAS DE CADASTROS ====================

app.get("/v1/cadastros/servicos", async (_req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query("SELECT * FROM cad_servicos ORDER BY nome ASC");
    return res.json({ sucesso: true, data: rows });
  } catch (err: any) {
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

app.post("/v1/cadastros/servicos", async (req: Request, res: Response) => {
  try {
    const { nome, precoSugerido } = req.body;
    const id = uuidv4();
    await pool.query(
      "INSERT INTO cad_servicos (id_servico, nome, preco_sugerido) VALUES (?, ?, ?)",
      [id, nome, Number(precoSugerido) || 0]
    );
    return res.status(201).json({ sucesso: true, data: { id, nome } });
  } catch (err: any) {
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

app.get("/v1/cadastros/fornecedores", async (_req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query("SELECT * FROM cad_fornecedores ORDER BY nome ASC");
    return res.json({ sucesso: true, data: rows });
  } catch (err: any) {
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

app.post("/v1/cadastros/fornecedores", async (req: Request, res: Response) => {
  try {
    const { nome, contato } = req.body;
    const id = uuidv4();
    await pool.query(
      "INSERT INTO cad_fornecedores (id_fornecedor, nome, contato) VALUES (?, ?, ?)",
      [id, nome, contato || ""]
    );
    return res.status(201).json({ sucesso: true, data: { id, nome } });
  } catch (err: any) {
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// Rotas de Clientes
app.get("/v1/clientes", async (_req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query("SELECT * FROM clientes ORDER BY nome ASC");
    return res.json({ sucesso: true, data: rows });
  } catch (err: any) {
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

app.post("/v1/clientes", async (req: Request, res: Response) => {
  try {
    const { nome, cpfCnpj, whatsapp, email } = req.body;
    const id = uuidv4();
    await pool.query(
      "INSERT INTO clientes (id_cliente, nome, cpf_cnpj, whatsapp, email) VALUES (?, ?, ?, ?, ?)",
      [id, nome || "Cliente", cpfCnpj || null, whatsapp || "", email || null]
    );
    return res.status(201).json({ sucesso: true, data: { id, nome } });
  } catch (err: any) {
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// ==================== ROTAS DE ORÇAMENTOS E OS ====================

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

app.post("/v1/ordens-servico", async (req: Request, res: Response) => {
  const connection = await pool.getConnection(); 
  try {
    await connection.beginTransaction();
    const {
      cliente,
      aparelho,
      defeitoRelatado,
      dataAbertura,
      checklistEntrada,
      orcamentoCalculado,
      possuiGarantia,
      formaPagamento,
      parcelas,
      valorLiquido,
    } = req.body;

    if (!formaPagamento) {
      return res.status(400).json({ sucesso: false, erro: "A forma de pagamento é obrigatória." });
    }

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
    
    const numPeca = Number(orcamentoCalculado?.custoPeca) || 0;
    const numFrete = Number(orcamentoCalculado?.freteReal) || 0;
    const desconto = Number(orcamentoCalculado?.descontoGeralAplicado) || 0;
    const valorTotal = Number(orcamentoCalculado?.valorTotalOrcamento) || 0;
    const subtotal = Number(orcamentoCalculado?.subtotalServicos) || (valorTotal + desconto);
    
    // Lucro real recalculado considerando o valor líquido que realmente entrou no caixa
    const numParcelas = Number(parcelas) || 1;
    const numValorLiquido = valorLiquido !== "" && valorLiquido !== undefined && valorLiquido !== null 
      ? Number(valorLiquido) 
      : valorTotal;

    const lucroReal = numValorLiquido - (numPeca + numFrete);
    const fornecedorPeca = orcamentoCalculado?.fornecedorPeca || null;

    const dataFinalAbertura = formatarDataLocal(dataAbertura) || new Date();
    const statusGarantiaDb = possuiGarantia === false ? 0 : 1;

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
       (id_os, numero_os, id_cliente, id_aparelho, status_os, defeito_relatado, checklist_entrada, subtotal_servicos, desconto_valor, valor_total, lucro_estimado_total, custo_peca, frete_real, fornecedor_peca, data_abertura, possui_garantia, historico_json, forma_pagamento, parcelas, valor_liquido) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        statusGarantiaDb,
        JSON.stringify(historicoInicial),
        formaPagamento,
        numParcelas,
        numValorLiquido,
      ]
    );

    await connection.commit();
    return res.status(201).json({
      sucesso: true,
      data: { idOs: osId, numeroOs: numeroOsGerado },
    });
  } catch (err: any) {
    await connection.rollback();
    return res.status(500).json({ sucesso: false, erro: err.message });
  } finally {
    connection.release();
  }
});

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
    const selectPossuiGarantia = colunasExistentes.has('possui_garantia') ? 'os.possui_garantia AS possuiGarantiaDb' : '1 AS possuiGarantiaDb';
    const selectFormaPagamento = colunasExistentes.has('forma_pagamento') ? 'os.forma_pagamento AS formaPagamento' : "'PIX' AS formaPagamento";
    const selectParcelas = colunasExistentes.has('parcelas') ? 'os.parcelas AS parcelas' : '1 AS parcelas';
    const selectValorLiquido = colunasExistentes.has('valor_liquido') ? 'os.valor_liquido AS valorLiquido' : 'os.valor_total AS valorLiquido';

    const [rows]: any = await pool.query(`
      SELECT 
        os.id_os, os.numero_os, os.status_os, os.defeito_relatado AS defeitoRelatado,
        os.subtotal_servicos AS subtotalServicos, os.desconto_valor AS descontoValor,
        os.valor_total AS valorTotal, os.lucro_estimado_total AS lucroEstimadoTotal,
        os.data_abertura,
        ${selectPossuiGarantia},
        ${selectGarantia}, ${selectHistorico}, ${selectChecklist},
        ${selectCusto}, ${selectFrete}, ${selectFornecedor},
        ${selectFormaPagamento}, ${selectParcelas}, ${selectValorLiquido},
        c.nome AS clienteNome, c.cpf_cnpj AS clienteCpfCnpj, c.whatsapp AS clienteWhatsapp, c.email AS clienteEmail,
        a.modelo AS aparelhoModelo, a.imei_1 AS aparelhoImei1, a.senha_desbloqueio AS aparelhoSenhaDesbloqueio
      FROM ordens_servico os
      LEFT JOIN clientes c ON os.id_cliente = c.id_cliente
      LEFT JOIN aparelhos_cliente a ON os.id_aparelho = a.id_aparelho
      ORDER BY os.data_abertura DESC
    `);

    const ordensFormatadas = rows.map((row: any) => {
      let garantia = { houveGarantia: false };
      if (row.garantiaJson) {
        try {
          garantia = typeof row.garantiaJson === "string" ? JSON.parse(row.garantiaJson) : row.garantiaJson;
        } catch {
          garantia = { houveGarantia: false };
        }
      }

      let checklist = {};
      if (row.checklistEntrada) {
        try {
          checklist = typeof row.checklistEntrada === "string" ? JSON.parse(row.checklistEntrada) : row.checklistEntrada;
        } catch {
          checklist = {};
        }
      }

      let historico = [];
      if (row.historicoJson) {
        try {
          historico = typeof row.historicoJson === "string" ? JSON.parse(row.historicoJson) : row.historicoJson;
        } catch {
          historico = [];
        }
      }

      const numPeca = Number(row.custoPeca || 0);
      const numFrete = Number(row.freteReal || 0);
      const valorTotalCobrado = Number(row.valorTotal || 0);
      const valorLiqRecebido = Number(row.valorLiquido || valorTotalCobrado);
      const custoGarantia = Number((garantia as any)?.custoPecaGarantia || (garantia as any)?.prejuizoTotalGarantia || 0);
      
      // O lucro real baseia-se no valor líquido efetivo que entrou no caixa
      const lucroRealRecalculado = valorLiqRecebido - (numPeca + numFrete + custoGarantia);
      const possuiGarantiaFlag = row.possuiGarantiaDb !== 0 && row.possuiGarantiaDb !== false;

      return {
        id_os: row.id_os,
        numero_os: row.numero_os,
        status_os: row.status_os || "AGUARDANDO_AVALIACAO",
        defeitoRelatado: row.defeitoRelatado || "",
        checklistEntrada: checklist,
        data_abertura: row.data_abertura,
        garantia: garantia,
        possuiGarantia: possuiGarantiaFlag,
        historico: historico,
        formaPagamento: row.formaPagamento || "PIX",
        parcelas: Number(row.parcelas || 1),
        valorLiquido: valorLiqRecebido,
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
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// ==================== ROTA DE EDIÇÃO DE ORDEM DE SERVIÇO ====================
app.put("/v1/ordens-servico/:id", async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const {
      cliente,
      aparelho,
      status_os,
      defeitoRelatado,
      forma_pagamento,
      parcelas,
      valor_liquido,
      orcamentoCalculado,
    } = req.body;

    const numPeca = Number(orcamentoCalculado?.custoPeca) || 0;
    const numFrete = Number(orcamentoCalculado?.freteReal) || 0;
    const valorTotal = Number(orcamentoCalculado?.valorTotalOrcamento) || 0;
    const subtotal = Number(orcamentoCalculado?.subtotalServicos) || valorTotal;
    const desconto = Number(orcamentoCalculado?.descontoGeralAplicado) || 0;
    const valLiqUpdate = valor_liquido !== undefined && valor_liquido !== null ? Number(valor_liquido) : valorTotal;
    const lucroReal = valLiqUpdate - (numPeca + numFrete);
    const fornecedorPeca = orcamentoCalculado?.fornecedorPeca || null;

    const [osRows]: any = await connection.query(
      "SELECT id_cliente, id_aparelho FROM ordens_servico WHERE id_os = ?",
      [id]
    );

    if (osRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ sucesso: false, erro: "Ordem de serviço não encontrada." });
    }

    const { id_cliente, id_aparelho } = osRows[0];

    await connection.query(
      `UPDATE ordens_servico SET 
        status_os = ?, 
        defeito_relatado = ?, 
        forma_pagamento = COALESCE(?, forma_pagamento),
        parcelas = COALESCE(?, parcelas),
        valor_liquido = COALESCE(?, valor_liquido),
        subtotal_servicos = ?, 
        desconto_valor = ?, 
        valor_total = ?, 
        lucro_estimado_total = ?, 
        custo_peca = ?, 
        frete_real = ?, 
        fornecedor_peca = ? 
       WHERE id_os = ?`,
      [
        status_os || "AGUARDANDO_AVALIACAO",
        defeitoRelatado || "",
        forma_pagamento || null,
        parcelas || null,
        valLiqUpdate,
        subtotal,
        desconto,
        valorTotal,
        lucroReal,
        numPeca,
        numFrete,
        fornecedorPeca,
        id,
      ]
    );

    if (id_cliente && cliente) {
      await connection.query(
        "UPDATE clientes SET nome = ?, whatsapp = ? WHERE id_cliente = ?",
        [cliente.nome || "Cliente", cliente.whatsapp || "", id_cliente]
      );
    }

    if (id_aparelho && aparelho) {
      await connection.query(
        "UPDATE aparelhos_cliente SET modelo = ?, imei_1 = ?, senha_desbloqueio = ? WHERE id_aparelho = ?",
        [aparelho.modelo || "Modelo", aparelho.imei1 || "", aparelho.senhaDesbloqueio || "", id_aparelho]
      );
    }

    await connection.commit();
    return res.json({ sucesso: true, mensagem: "Ordem de Serviço atualizada com sucesso!" });
  } catch (err: any) {
    await connection.rollback();
    return res.status(500).json({ sucesso: false, erro: err.message });
  } finally {
    connection.release();
  }
});

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

app.delete("/v1/clientes/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM clientes WHERE id_cliente = ?", [id]);
    return res.json({ sucesso: true, mensagem: "Cliente excluído com sucesso!" });
  } catch (err: any) {
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Backend rodando na porta ${PORT}`));