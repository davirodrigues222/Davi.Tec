// backend/src/server.ts
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Conexão com o Pool do MySQL
const pool = mysql.createPool(process.env.DATABASE_URL!);

// -----------------------------------------------------------------------------
// 1. ROTA DE CÁLCULO DE ORÇAMENTO
// -----------------------------------------------------------------------------
app.post('/v1/orcamentos/calcular', async (req: Request, res: Response) => {
  try {
    const { itens, descontoGeral } = req.body;
    let subtotalServicos = 0;
    let lucroTotalEstimado = 0;

    const itensCalculados = [];

    if (Array.isArray(itens)) {
      for (const item of itens) {
        const { idRegra, custoPeca = 0, freteReal = 20 } = item;

        const [rows]: any = await pool.query(
          'SELECT * FROM regras_precificacao WHERE id_regra = ?',
          [idRegra]
        );
        
        if (rows.length === 0) continue;

        const regra = rows[0];
        let subtotalItem = 0;
        let lucroEstimadoItem = 0;

        if (regra.categoria === 'FORMULA_PECA') {
          const mult = parseFloat(regra.multiplicador_peca);
          const mo = parseFloat(regra.mao_de_obra_padrao);
          const custos = parseFloat(regra.custos_adicionais_padrao);

          subtotalItem = (custoPeca * mult) + mo + freteReal + custos;
          const custoRealOperacional = custoPeca + freteReal + custos;
          lucroEstimadoItem = subtotalItem - custoRealOperacional;
        } else {
          subtotalItem = parseFloat(regra.preco_fixo_venda);
          lucroEstimadoItem = subtotalItem * 0.6;
        }

        subtotalServicos += subtotalItem;
        lucroTotalEstimado += lucroEstimadoItem;

        itensCalculados.push({
          idRegra,
          nomeServico: regra.nome_servico,
          subtotalItem,
          lucroEstimadoItem,
        });
      }
    }

    const valorDesconto = descontoGeral?.valor || 0;
    const valorTotalOrcamento = Math.max(0, subtotalServicos - valorDesconto);
    lucroTotalEstimado = Math.max(0, lucroTotalEstimado - valorDesconto);

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

// -----------------------------------------------------------------------------
// 2. ROTA DE ABERTURA DE ORDEM DE SERVIÇO (SALVAR NO MYSQL)
// -----------------------------------------------------------------------------
app.post('/v1/ordens-servico', async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { cliente, aparelho, defeitoRelatado, checklistEntrada, orcamentoCalculado } = req.body;

    // 1. Tratar e Inserir Cliente (Permitindo campos opcionais como string vazia '')
    let clienteId = cliente.idCliente;
    
    if (!clienteId || typeof clienteId !== 'string' || clienteId.trim() === '') {
      clienteId = uuidv4();
      
      const cpfCnpjValue = cliente.cpfCnpj && cliente.cpfCnpj.trim() !== '' ? cliente.cpfCnpj.trim() : '';
      const whatsappValue = cliente.whatsapp && cliente.whatsapp.trim() !== '' ? cliente.whatsapp.trim() : '';
      const emailValue = cliente.email && cliente.email.trim() !== '' ? cliente.email.trim() : '';

      await connection.query(
        'INSERT INTO clientes (id_cliente, nome, cpf_cnpj, whatsapp, email) VALUES (?, ?, ?, ?, ?)',
        [clienteId, cliente.nome, cpfCnpjValue, whatsappValue, emailValue]
      );
    }

    // 2. Inserir Aparelho
    const aparelhoId = uuidv4();
    const imeiValue = aparelho.imei1 && aparelho.imei1.trim() !== '' ? aparelho.imei1.trim() : '';
    const senhaValue = aparelho.senhaDesbloqueio && aparelho.senhaDesbloqueio.trim() !== '' ? aparelho.senhaDesbloqueio.trim() : '';

    await connection.query(
      'INSERT INTO aparelhos_cliente (id_aparelho, id_cliente, modelo, imei_1, senha_desbloqueio) VALUES (?, ?, ?, ?, ?)',
      [aparelhoId, clienteId, aparelho.modelo, imeiValue, senhaValue]
    );

    // 3. Criar Ordem de Serviço
    const osId = uuidv4();
    const numeroOsGerado = `OS-${Date.now().toString().slice(-6)}`;

    const subtotal = orcamentoCalculado?.subtotalServicos || 0;
    const desconto = orcamentoCalculado?.descontoGeralAplicado || 0;
    const valorTotal = orcamentoCalculado?.valorTotalOrcamento || 0;
    const lucro = orcamentoCalculado?.lucroTotalEstimadoInterno || 0;

    await connection.query(
      `INSERT INTO ordens_servico 
       (id_os, numero_os, id_cliente, id_aparelho, defeito_relatado, checklist_entrada, subtotal_servicos, desconto_valor, valor_total, lucro_estimado_total) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        osId,
        numeroOsGerado,
        clienteId,
        aparelhoId,
        defeitoRelatado,
        JSON.stringify(checklistEntrada || {}),
        subtotal,
        desconto,
        valorTotal,
        lucro,
      ]
    );

    await connection.commit();

    return res.status(201).json({
      sucesso: true,
      data: {
        idOs: osId,
        numeroOs: numeroOsGerado,
        mensagem: 'Ordem de Serviço cadastrada com sucesso!',
      },
    });
  } catch (err: any) {
    await connection.rollback();
    return res.status(500).json({ sucesso: false, erro: err.message });
  } finally {
    connection.release();
  }
});

// -----------------------------------------------------------------------------
// 3. ROTA DE LISTAGEM DE ORDENS DE SERVIÇO (PARA O DASHBOARD)
// -----------------------------------------------------------------------------
app.get('/v1/ordens-servico', async (_req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT 
        os.id_os,
        os.numero_os,
        os.status_os,
        os.defeito_relatado AS defeitoRelatado,
        os.checklist_entrada AS checklistEntrada,
        os.subtotal_servicos AS subtotalServicos,
        os.desconto_valor AS descontoValor,
        os.valor_total AS valorTotal,
        os.lucro_estimado_total AS lucroEstimadoTotal,
        os.data_abertura,
        c.nome AS clienteNome,
        c.cpf_cnpj AS clienteCpfCnpj,
        c.whatsapp AS clienteWhatsapp,
        c.email AS clienteEmail,
        a.modelo AS aparelhoModelo,
        a.imei_1 AS aparelhoImei1,
        a.senha_desbloqueio AS aparelhoSenhaDesbloqueio
      FROM ordens_servico os
      JOIN clientes c ON os.id_cliente = c.id_cliente
      JOIN aparelhos_cliente a ON os.id_aparelho = a.id_aparelho
      ORDER BY os.data_abertura DESC
    `);

    const ordensFormatadas = rows.map((row: any) => ({
      id_os: row.id_os,
      numero_os: row.numero_os,
      status_os: row.status_os,
      defeitoRelatado: row.defeitoRelatado,
      checklistEntrada: typeof row.checklistEntrada === 'string' 
        ? JSON.parse(row.checklistEntrada) 
        : row.checklistEntrada,
      data_abertura: row.data_abertura,
      cliente: {
        nome: row.clienteNome,
        cpfCnpj: row.clienteCpfCnpj || '',
        whatsapp: row.clienteWhatsapp || '',
        email: row.clienteEmail || '',
      },
      aparelho: {
        modelo: row.aparelhoModelo,
        imei1: row.aparelhoImei1 || '',
        senhaDesbloqueio: row.aparelhoSenhaDesbloqueio || '',
      },
      orcamentoCalculado: {
        subtotalServicos: Number(row.subtotalServicos),
        descontoGeralAplicado: Number(row.descontoValor),
        valorTotalOrcamento: Number(row.valorTotal),
        lucroTotalEstimadoInterno: Number(row.lucroEstimadoTotal),
      },
    }));

    return res.json({
      sucesso: true,
      data: ordensFormatadas,
    });
  } catch (err: any) {
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// -----------------------------------------------------------------------------
// 4. ROTA DE ATUALIZAÇÃO DE STATUS DA OS
// -----------------------------------------------------------------------------
app.patch('/v1/ordens-servico/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status_os } = req.body;

    await pool.query(
      'UPDATE ordens_servico SET status_os = ? WHERE id_os = ?',
      [status_os, id]
    );

    return res.json({ sucesso: true, mensagem: 'Status atualizado com sucesso!' });
  } catch (err: any) {
    return res.status(500).json({ sucesso: false, erro: err.message });
  }
});

// -----------------------------------------------------------------------------
// INICIALIZAÇÃO DO SERVIDOR
// -----------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Backend SIG-Apple rodando na porta ${PORT}`));