import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export const Cadastros: React.FC = () => {
  const [servicos, setServicos] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  
  // Estados para Serviço (Cadastro / Edição)
  const [editandoServicoId, setEditandoServicoId] = useState<string | null>(null);
  const [novoServicoNome, setNovoServicoNome] = useState('');
  const [novoServicoPreco, setNovoServicoPreco] = useState('');
  
  // Estados para Fornecedor (Cadastro / Edição)
  const [editandoFornId, setEditandoFornId] = useState<string | null>(null);
  const [novoFornNome, setNovoFornNome] = useState('');
  const [novoFornContato, setNovoFornContato] = useState('');

  // Estados para Cliente (Cadastro / Edição)
  const [editandoCliId, setEditandoCliId] = useState<string | null>(null);
  const [novoCliNome, setNovoCliNome] = useState('');
  const [novoCliWhatsapp, setNovoCliWhatsapp] = useState('');
  const [novoCliCpfCnpj, setNovoCliCpfCnpj] = useState('');
  const [novoCliEmail, setNovoCliEmail] = useState('');

  const [carregando, setCarregando] = useState(false);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const { data: dataServ, error: errServ } = await supabase.from('cad_servicos').select('*').order('nome', { ascending: true });
      if (!errServ && dataServ) setServicos(dataServ);

      const { data: dataForn, error: errForn } = await supabase.from('cad_fornecedores').select('*').order('nome', { ascending: true });
      if (!errForn && dataForn) setFornecedores(dataForn);

      const { data: dataCli, error: errCli } = await supabase.from('clientes').select('*').order('nome', { ascending: true });
      if (!errCli && dataCli) setClientes(dataCli);
    } catch (e) {
      console.error("Erro ao buscar cadastros no Supabase:", e);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // --- SERVIÇOS ---
  const handleSalvarServico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoServicoNome.trim()) return;

    try {
      if (editandoServicoId) {
        // Atualizar
        const { error } = await supabase.from('cad_servicos').update({
          nome: novoServicoNome,
          preco_sugerido: novoServicoPreco === '' ? 0 : Number(novoServicoPreco),
        }).eq('id_servico', editandoServicoId);

        if (!error) {
          setEditandoServicoId(null);
          setNovoServicoNome('');
          setNovoServicoPreco('');
          carregarDados();
        } else {
          alert("Erro ao atualizar serviço: " + error.message);
        }
      } else {
        // Inserir Novo
        const novoId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
        const { error } = await supabase.from('cad_servicos').insert([{
          id_servico: novoId,
          nome: novoServicoNome,
          preco_sugerido: novoServicoPreco === '' ? 0 : Number(novoServicoPreco),
        }]);

        if (!error) {
          setNovoServicoNome('');
          setNovoServicoPreco('');
          carregarDados();
        } else {
          alert("Erro ao cadastrar serviço: " + error.message);
        }
      }
    } catch (err) {
      console.error("Erro ao salvar serviço:", err);
    }
  };

  const iniciarEdicaoServico = (s: any) => {
    setEditandoServicoId(s.id_servico || s.id);
    setNovoServicoNome(s.nome || '');
    setNovoServicoPreco(s.preco_sugerido !== undefined ? s.preco_sugerido : (s.preco || ''));
  };

  const cancelarEdicaoServico = () => {
    setEditandoServicoId(null);
    setNovoServicoNome('');
    setNovoServicoPreco('');
  };

  const handleExcluirServico = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este serviço?")) return;
    try {
      const { error } = await supabase.from('cad_servicos').delete().eq('id_servico', id);
      if (!error) carregarDados();
      else alert("Erro ao excluir serviço: " + error.message);
    } catch (err) {
      console.error("Erro ao excluir serviço:", err);
    }
  };


  // --- FORNECEDORES ---
  const handleSalvarFornecedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoFornNome.trim()) return;

    try {
      if (editandoFornId) {
        // Atualizar
        const { error } = await supabase.from('cad_fornecedores').update({
          nome: novoFornNome,
          contato: novoFornContato,
        }).eq('id_fornecedor', editandoFornId);

        if (!error) {
          setEditandoFornId(null);
          setNovoFornNome('');
          setNovoFornContato('');
          carregarDados();
        } else {
          alert("Erro ao atualizar fornecedor: " + error.message);
        }
      } else {
        // Inserir Novo
        const novoId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
        const { error } = await supabase.from('cad_fornecedores').insert([{
          id_fornecedor: novoId,
          nome: novoFornNome,
          contato: novoFornContato,
        }]);

        if (!error) {
          setNovoFornNome('');
          setNovoFornContato('');
          carregarDados();
        } else {
          alert("Erro ao cadastrar fornecedor: " + error.message);
        }
      }
    } catch (err) {
      console.error("Erro ao salvar fornecedor:", err);
    }
  };

  const iniciarEdicaoFornecedor = (f: any) => {
    setEditandoFornId(f.id_fornecedor || f.id);
    setNovoFornNome(f.nome || '');
    setNovoFornContato(f.contato || '');
  };

  const cancelarEdicaoFornecedor = () => {
    setEditandoFornId(null);
    setNovoFornNome('');
    setNovoFornContato('');
  };

  const handleExcluirFornecedor = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este fornecedor?")) return;
    try {
      const { error } = await supabase.from('cad_fornecedores').delete().eq('id_fornecedor', id);
      if (!error) carregarDados();
      else alert("Erro ao excluir fornecedor: " + error.message);
    } catch (err) {
      console.error("Erro ao excluir fornecedor:", err);
    }
  };


  // --- CLIENTES ---
  const handleSalvarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCliNome.trim()) return;

    try {
      if (editandoCliId) {
        // Atualizar
        const { error } = await supabase.from('clientes').update({
          nome: novoCliNome,
          whatsapp: novoCliWhatsapp,
          cpf_cnpj: novoCliCpfCnpj || null,
          email: novoCliEmail || null,
        }).eq('id_cliente', editandoCliId);

        if (!error) {
          setEditandoCliId(null);
          setNovoCliNome('');
          setNovoCliWhatsapp('');
          setNovoCliCpfCnpj('');
          setNovoCliEmail('');
          carregarDados();
        } else {
          alert("Erro ao atualizar cliente: " + error.message);
        }
      } else {
        // Inserir Novo
        const novoId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
        const { error } = await supabase.from('clientes').insert([{
          id_cliente: novoId,
          nome: novoCliNome,
          whatsapp: novoCliWhatsapp,
          cpf_cnpj: novoCliCpfCnpj || null,
          email: novoCliEmail || null,
        }]);

        if (!error) {
          setNovoCliNome('');
          setNovoCliWhatsapp('');
          setNovoCliCpfCnpj('');
          setNovoCliEmail('');
          carregarDados();
        } else {
          alert("Erro ao cadastrar cliente: " + error.message);
        }
      }
    } catch (err) {
      console.error("Erro ao salvar cliente:", err);
    }
  };

  const iniciarEdicaoCliente = (c: any) => {
    setEditandoCliId(c.id_cliente || c.id);
    setNovoCliNome(c.nome || '');
    setNovoCliWhatsapp(c.whatsapp || c.telefone || '');
    setNovoCliCpfCnpj(c.cpf_cnpj || c.cpf || '');
    setNovoCliEmail(c.email || '');
  };

  const cancelarEdicaoCliente = () => {
    setEditandoCliId(null);
    setNovoCliNome('');
    setNovoCliWhatsapp('');
    setNovoCliCpfCnpj('');
    setNovoCliEmail('');
  };

  const handleExcluirCliente = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este cliente?")) return;
    try {
      const { error } = await supabase.from('clientes').delete().eq('id_cliente', id);
      if (!error) carregarDados();
      else alert("Erro ao excluir cliente: " + error.message);
    } catch (err) {
      console.error("Erro ao excluir cliente:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-xs">
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-bold text-white">Central de Cadastros</h2>
        <p className="text-zinc-400 mt-0.5">Gerencie, edite ou exclua os serviços, fornecedores e clientes cadastrados no sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* SEÇÃO 1: SERVIÇOS */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4 flex flex-col">
          <div className="flex items-center justify-between text-blue-400 font-bold text-sm">
            <div className="flex items-center space-x-2">
              <span>🔧</span>
              <h3>Serviços {editandoServicoId && <span className="text-amber-400 font-normal">(Editando)</span>}</h3>
            </div>
            {editandoServicoId && (
              <button onClick={cancelarEdicaoServico} className="text-[10px] text-zinc-400 hover:text-white underline">
                Cancelar Edição
              </button>
            )}
          </div>

          <form onSubmit={handleSalvarServico} className="space-y-2.5 bg-zinc-950 p-3.5 border border-zinc-800 rounded-xl">
            <input
              type="text"
              placeholder="Nome do Serviço..."
              value={novoServicoNome}
              onChange={(e) => setNovoServicoNome(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-blue-500"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Preço Sugerido (R$)"
              value={novoServicoPreco}
              onChange={(e) => setNovoServicoPreco(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-emerald-400 font-bold outline-none focus:border-blue-500"
            />
            <button type="submit" className={`w-full py-2 font-bold rounded-xl transition text-white ${editandoServicoId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
              {editandoServicoId ? '💾 Salvar Alterações' : '+ Adicionar Serviço'}
            </button>
          </form>

          <div className="flex-1 overflow-y-auto max-h-56 divide-y divide-zinc-800/50 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
            {carregando ? (
              <p className="text-center text-zinc-500 py-4">Carregando...</p>
            ) : servicos.length === 0 ? (
              <p className="text-center text-zinc-500 py-4">Nenhum serviço.</p>
            ) : (
              servicos.map((s) => (
                <div key={s.id_servico || s.id} className="py-2.5 px-2 flex justify-between items-center hover:bg-zinc-900/30 rounded-lg">
                  <div>
                    <span className="text-white font-medium block">{s.nome}</span>
                    <span className="text-emerald-400 font-bold">R$ {Number(s.preco_sugerido || s.preco || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => iniciarEdicaoServico(s)}
                      className="p-1 text-blue-400 hover:bg-blue-500/20 rounded-md transition"
                      title="Editar serviço"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleExcluirServico(s.id_servico || s.id)}
                      className="p-1 text-red-400 hover:bg-red-500/20 rounded-md transition"
                      title="Excluir serviço"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SEÇÃO 2: FORNECEDORES */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4 flex flex-col">
          <div className="flex items-center justify-between text-amber-400 font-bold text-sm">
            <div className="flex items-center space-x-2">
              <span>📦</span>
              <h3>Fornecedores {editandoFornId && <span className="text-amber-400 font-normal">(Editando)</span>}</h3>
            </div>
            {editandoFornId && (
              <button onClick={cancelarEdicaoFornecedor} className="text-[10px] text-zinc-400 hover:text-white underline">
                Cancelar Edição
              </button>
            )}
          </div>

          <form onSubmit={handleSalvarFornecedor} className="space-y-2.5 bg-zinc-950 p-3.5 border border-zinc-800 rounded-xl">
            <input
              type="text"
              placeholder="Nome do Fornecedor..."
              value={novoFornNome}
              onChange={(e) => setNovoFornNome(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-amber-500"
            />
            <input
              type="text"
              placeholder="Contato / WhatsApp"
              value={novoFornContato}
              onChange={(e) => setNovoFornContato(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-amber-500"
            />
            <button type="submit" className={`w-full py-2 font-bold rounded-xl transition text-white ${editandoFornId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-amber-600 hover:bg-amber-500'}`}>
              {editandoFornId ? '💾 Salvar Alterações' : '+ Adicionar Fornecedor'}
            </button>
          </form>

          <div className="flex-1 overflow-y-auto max-h-56 divide-y divide-zinc-800/50 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
            {carregando ? (
              <p className="text-center text-zinc-500 py-4">Carregando...</p>
            ) : fornecedores.length === 0 ? (
              <p className="text-center text-zinc-500 py-4">Nenhum fornecedor.</p>
            ) : (
              fornecedores.map((f) => (
                <div key={f.id_fornecedor || f.id} className="py-2.5 px-2 flex justify-between items-center hover:bg-zinc-900/30 rounded-lg">
                  <div>
                    <span className="text-white font-medium block">{f.nome}</span>
                    <span className="text-zinc-400 text-[10px]">{f.contato || 'Sem contato'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => iniciarEdicaoFornecedor(f)}
                      className="p-1 text-blue-400 hover:bg-blue-500/20 rounded-md transition"
                      title="Editar fornecedor"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleExcluirFornecedor(f.id_fornecedor || f.id)}
                      className="p-1 text-red-400 hover:bg-red-500/20 rounded-md transition"
                      title="Excluir fornecedor"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SEÇÃO 3: CLIENTES */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4 flex flex-col">
          <div className="flex items-center justify-between text-emerald-400 font-bold text-sm">
            <div className="flex items-center space-x-2">
              <span>👤</span>
              <h3>Clientes {editandoCliId && <span className="text-amber-400 font-normal">(Editando)</span>}</h3>
            </div>
            {editandoCliId && (
              <button onClick={cancelarEdicaoCliente} className="text-[10px] text-zinc-400 hover:text-white underline">
                Cancelar Edição
              </button>
            )}
          </div>

          <form onSubmit={handleSalvarCliente} className="space-y-2.5 bg-zinc-950 p-3.5 border border-zinc-800 rounded-xl">
            <input
              type="text"
              placeholder="Nome Completo..."
              value={novoCliNome}
              onChange={(e) => setNovoCliNome(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="WhatsApp..."
              value={novoCliWhatsapp}
              onChange={(e) => setNovoCliWhatsapp(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="CPF / CNPJ (Opcional)..."
              value={novoCliCpfCnpj}
              onChange={(e) => setNovoCliCpfCnpj(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
            />
            <button type="submit" className={`w-full py-2 font-bold rounded-xl transition text-white ${editandoCliId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
              {editandoCliId ? '💾 Salvar Alterações' : '+ Cadastrar Cliente'}
            </button>
          </form>

          <div className="flex-1 overflow-y-auto max-h-56 divide-y divide-zinc-800/50 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
            {carregando ? (
              <p className="text-center text-zinc-500 py-4">Carregando...</p>
            ) : clientes.length === 0 ? (
              <p className="text-center text-zinc-500 py-4">Nenhum cliente.</p>
            ) : (
              clientes.map((c) => (
                <div key={c.id_cliente || c.id} className="py-2.5 px-2 flex justify-between items-center hover:bg-zinc-900/30 rounded-lg">
                  <div>
                    <span className="text-white font-medium block">{c.nome}</span>
                    <span className="text-[10px] text-zinc-500">{c.whatsapp || 'Sem WhatsApp'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => iniciarEdicaoCliente(c)}
                      className="p-1 text-blue-400 hover:bg-blue-500/20 rounded-md transition"
                      title="Editar cliente"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleExcluirCliente(c.id_cliente || c.id)}
                      className="p-1 text-red-400 hover:bg-red-500/20 rounded-md transition"
                      title="Excluir cliente"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};