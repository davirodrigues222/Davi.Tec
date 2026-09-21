import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

declare const process: any;

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do Cliente Supabase para o Backend
const supabaseUrl = process.env.SUPABASE_URL || 'https://mlgkdyeujcglwlfdirin.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_HGJD0kFeVf03Gm-4vft8uQ_b4R4Om9P';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== ROTAS DE CADASTROS E SERVIÇOS ====================

app.get("/v1/cadastros/servicos", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from("cad_servicos").select("*").order("nome", { ascending: true });
    if (error) throw error;
    return res.json({ sucesso: true, data });
  } catch (err: any) {
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

app.post("/v1/cadastros/servicos", async (req: Request, res: Response) => {
  try {
    const { nome, precoSugerido } = req.body;
    const { data, error } = await supabase.from("cad_servicos").insert([
      { nome, preco_sugerido: Number(precoSugerido) || 0 }
    ]).select();
    if (error) throw error;
    return res.status(201).json({ sucesso: true, data: data[0] });
  } catch (err: any) {
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

app.get("/v1/cadastros/fornecedores", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from("cad_fornecedores").select("*").order("nome", { ascending: true });
    if (error) throw error;
    return res.json({ sucesso: true, data });
  } catch (err: any) {
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

app.post("/v1/cadastros/fornecedores", async (req: Request, res: Response) => {
  try {
    const { nome, contato } = req.body;
    const { data, error } = await supabase.from("cad_fornecedores").insert([
      { nome, contato: contato || "" }
    ]).select();
    if (error) throw error;
    return res.status(201).json({ sucesso: true, data: data[0] });
  } catch (err: any) {
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// ==================== ROTAS DE ORÇAMENTOS E CÁLCULO COM DESCONTO ====================

app.post("/v1/orcamentos/calcular", async (req: Request, res: Response) => {
  try {
    const { itens, descontoGeral } = req.body;
    let subtotalServicos = 0;
    let totalCustoPecas = 0;
    let totalFrete = 0;
    const itensCalculados = [];

    if (Array.isArray(itens)) {
      for (const item of itens) {
        const { custoPeca = 0, freteReal = 0, precoFixo = 100 } = item;
        const subtotalItem = Number(precoFixo) || (Number(custoPeca) * 2 + Number(freteReal));

        totalCustoPecas += Number(custoPeca);
        totalFrete += Number(freteReal);
        subtotalServicos += subtotalItem;

        itensCalculados.push({
          subtotalItem,
          lucroEstimadoItem: subtotalItem - (Number(custoPeca) + Number(freteReal)),
        });
      }
    }

    // Lógica robusta para suportar Desconto em Valor Fixo (R$) ou Percentual (%)
    const valorDescontoInformado = Number(descontoGeral?.valor) || 0;
    const tipoDesconto = descontoGeral?.tipo === 'PERCENTUAL' ? 'PERCENTUAL' : 'VALOR';

    let valorDescontoCalculado = 0;
    if (tipoDesconto === 'PERCENTUAL') {
      valorDescontoCalculado = (subtotalServicos * valorDescontoInformado) / 100;
    } else {
      valorDescontoCalculado = valorDescontoInformado;
    }

    const valorTotalOrcamento = Math.max(0, subtotalServicos - valorDescontoCalculado);
    const lucroTotalEstimado = valorTotalOrcamento - (totalCustoPecas + totalFrete);

    return res.json({
      sucesso: true,
      data: {
        itensCalculados,
        resumoFinanceiro: {
          subtotalServicos,
          tipoDesconto,
          descontoGeralAplicado: valorDescontoCalculado,
          valorTotalOrcamento,
          lucroTotalEstimadoInterno: lucroTotalEstimado,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// ==================== ROTAS DE ORDENS DE SERVIÇO ====================

app.post("/v1/ordens-servico", async (req: Request, res: Response) => {
  try {
    const {
      cliente,
      aparelho,
      defeitoRelatado,
      orcamentoCalculado,
      formaPagamento,
      parcelas,
      valorLiquido,
    } = req.body;

    if (!formaPagamento) {
      return res.status(400).json({ sucesso: false, erro: "A forma de pagamento é obrigatória." });
    }

    const numeroOsGerado = `OS-${Date.now().toString().slice(-6)}`;
    const numPeca = Number(orcamentoCalculado?.custoPeca) || 0;
    const numFrete = Number(orcamentoCalculado?.freteReal) || 0;
    const desconto = Number(orcamentoCalculado?.descontoGeralAplicado) || 0;
    const tipoDesconto = orcamentoCalculado?.tipoDesconto || 'VALOR';
    const valorTotal = Number(orcamentoCalculado?.valorTotalOrcamento) || 0;
    const subtotal = Number(orcamentoCalculado?.subtotalServicos) || valorTotal;
    
    const numValorLiquido = valorLiquido !== undefined && valorLiquido !== null 
      ? Number(valorLiquido) 
      : valorTotal;
    const lucroReal = numValorLiquido - (numPeca + numFrete);

    const { data, error } = await supabase.from("ordens_servico").insert([
      {
        numero_os: numeroOsGerado,
        cliente_nome: cliente?.nome || "Cliente não informado",
        cliente_whatsapp: cliente?.whatsapp || "",
        aparelho_modelo: aparelho?.modelo || "Não especificado",
        defeito_relatado: defeitoRelatado || "Defeito não informado",
        subtotal_servicos: subtotal,
        tipo_desconto: tipoDesconto,
        desconto_valor: desconto,
        valor_total: valorTotal,
        lucro_estimado_total: lucroReal,
        custo_peca: numPeca,
        frete_real: numFrete,
        fornecedor_peca: orcamentoCalculado?.fornecedorPeca || null,
        forma_pagamento: formaPagamento,
        parcelas: Number(parcelas) || 1,
        valor_liquido: numValorLiquido,
      }
    ]).select();

    if (error) throw error;

    return res.status(201).json({
      sucesso: true,
      data: { idOs: data[0]?.id_os, numeroOs: numeroOsGerado },
    });
  } catch (err: any) {
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

app.get("/v1/ordens-servico", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("ordens_servico")
      .select("*")
      .order("data_abertura", { ascending: false });

    if (error) throw error;

    const ordensFormatadas = data.map((row: any) => ({
      id_os: row.id_os,
      numero_os: row.numero_os,
      status_os: row.status_os || "AGUARDANDO_AVALIACAO",
      defeitoRelatado: row.defeito_relatado || "",
      data_abertura: row.data_abertura,
      formaPagamento: row.forma_pagamento || "PIX",
      parcelas: Number(row.parcelas || 1),
      valorLiquido: Number(row.valor_liquido || row.valor_total),
      cliente: {
        nome: row.cliente_nome || "Cliente",
        whatsapp: row.cliente_whatsapp || "",
      },
      aparelho: {
        modelo: row.aparelho_modelo || "Não especificado",
      },
      orcamentoCalculado: {
        subtotalServicos: Number(row.subtotal_servicos || 0),
        tipoDesconto: row.tipo_desconto || 'VALOR',
        descontoGeralAplicado: Number(row.desconto_valor || 0),
        valorTotalOrcamento: Number(row.valor_total || 0),
        lucroTotalEstimadoInterno: Number(row.lucro_estimado_total || 0),
        custoPeca: Number(row.custo_peca || 0),
        frete_real: Number(row.frete_real || 0),
        fornecedorPeca: row.fornecedor_peca || "",
      },
    }));

    return res.json({ sucesso: true, data: ordensFormatadas });
  } catch (err: any) {
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

app.delete("/v1/ordens-servico/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("ordens_servico").delete().eq("id_os", id);
    if (error) throw error;
    return res.json({ sucesso: true, mensagem: "Ordem de Serviço excluída com sucesso!" });
  } catch (err: any) {
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend conectado ao Supabase rodando na porta ${PORT}`);
});