import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export const Cadastros: React.FC = () => {
  const [servicos, setServicos] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados dos inputs rápidos
  const [inputServico, setInputServico] = useState('');
  const [inputFornecedor, setInputFornecedor] = useState('');
  const [inputCliente, setInputCliente] = useState('');

  // Modais de Criação / Edição
  const [modalServico, setModalServico] = useState<{ id?: string; nome: string; preco: string } | null>(null);
  const [modalFornecedor, setModalFornecedor] = useState<{ id?: string; nome: string; contato: string } | null>(null);
  const [modalCliente, setModalCliente] = useState<{ id?: string; nome: string; whatsapp: string; cpfCnpj: string } | null>(null);

  const [salvando, setSalvando] = useState(false);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const { data: dataServ } = await supabase.from('cad_servicos').select('*').order('nome', { ascending: true });
      if (dataServ) setServicos(dataServ);

      const { data: dataForn } = await supabase.from('cad_fornecedores').select('*').order('nome', { ascending: true });
      if (dataForn) setFornecedores(dataForn);

      const { data: dataCli } = await supabase.from('clientes').select('*').order('nome', { ascending: true });
      if (dataCli) setClientes(dataCli);
    } catch (err) {
      console.error('Erro ao carregar cadastros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // ================= AÇÕES: SERVIÇOS =================
  const handleAbrirCriarServico = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setModalServico({ nome: inputServico.trim(), preco: '' });
  };

  const handleSalvarServico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalServico || !modalServico.nome.trim()) return;

    setSalvando(true);
    try {
      const precoNum = Number(modalServico.preco) || 0;
      if (modalServico.id) {
        // Atualizar
        await supabase
          .from('cad_servicos')
          .update({
            nome: modalServico.nome.trim(),
            preco_sugerido: precoNum,
          })
          .eq('id_servico', modalServico.id);
      } else {
        // Inserir Novo
        const { data: { user } } = await supabase.auth.getUser();
        const novoId = crypto.randomUUID ? crypto.randomUUID() : 'srv_' + Math.random().toString(36).substring(2);
        await supabase.from('cad_servicos').insert([
          {
            id_servico: novoId,
            nome: modalServico.nome.trim(),
            preco_sugerido: precoNum,
            user_id: user?.id,
          },
        ]);
      }
      setModalServico(null);
      setInputServico('');
      await carregarDados();
    } catch (err: any) {
      alert(`Erro ao salvar serviço: ${err.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirServico = async (id: string, nome: string) => {
    if (!window.confirm(`Deseja realmente excluir o serviço "${nome}"?`)) return;
    try {
      await supabase.from('cad_servicos').delete().eq('id_servico', id);
      await carregarDados();
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  // ================= AÇÕES: FORNECEDORES =================
  const handleAbrirCriarFornecedor = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setModalFornecedor({ nome: inputFornecedor.trim(), contato: '' });
  };

  const handleSalvarFornecedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalFornecedor || !modalFornecedor.nome.trim()) return;

    setSalvando(true);
    try {
      if (modalFornecedor.id) {
        // Atualizar
        await supabase
          .from('cad_fornecedores')
          .update({
            nome: modalFornecedor.nome.trim(),
            contato: modalFornecedor.contato.trim(),
          })
          .eq('id_fornecedor', modalFornecedor.id);
      } else {
        // Inserir Novo
        const { data: { user } } = await supabase.auth.getUser();
        const novoId = crypto.randomUUID ? crypto.randomUUID() : 'forn_' + Math.random().toString(36).substring(2);
        await supabase.from('cad_fornecedores').insert([
          {
            id_fornecedor: novoId,
            nome: modalFornecedor.nome.trim(),
            contato: modalFornecedor.contato.trim(),
            user_id: user?.id,
          },
        ]);
      }
      setModalFornecedor(null);
      setInputFornecedor('');
      await carregarDados();
    } catch (err: any) {
      alert(`Erro ao salvar fornecedor: ${err.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirFornecedor = async (id: string, nome: string) => {
    if (!window.confirm(`Deseja realmente excluir o fornecedor "${nome}"?`)) return;
    try {
      await supabase.from('cad_fornecedores').delete().eq('id_fornecedor', id);
      await carregarDados();
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  // ================= AÇÕES: CLIENTES =================
  const handleAbrirCriarCliente = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setModalCliente({ nome: inputCliente.trim(), whatsapp: '', cpfCnpj: '' });
  };

  const handleSalvarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalCliente || !modalCliente.nome.trim()) return;

    setSalvando(true);
    try {
      if (modalCliente.id) {
        // Atualizar
        await supabase
          .from('clientes')
          .update({
            nome: modalCliente.nome.trim(),
            whatsapp: modalCliente.whatsapp.trim(),
            cpf_cnpj: modalCliente.cpfCnpj.trim() || null,
          })
          .eq('id_cliente', modalCliente.id);
      } else {
        // Inserir Novo
        const { data: { user } } = await supabase.auth.getUser();
        const novoId = crypto.randomUUID ? crypto.randomUUID() : 'cli_' + Math.random().toString(36).substring(2);
        await supabase.from('clientes').insert([
          {
            id_cliente: novoId,
            nome: modalCliente.nome.trim(),
            whatsapp: modalCliente.whatsapp.trim(),
            cpf_cnpj: modalCliente.cpfCnpj.trim() || null,
            user_id: user?.id,
          },
        ]);
      }
      setModalCliente(null);
      setInputCliente('');
      await carregarDados();
    } catch (err: any) {
      alert(`Erro ao salvar cliente: ${err.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirCliente = async (id: string, nome: string) => {
    if (!window.confirm(`Deseja realmente excluir o cliente "${nome}"?`)) return;
    try {
      await supabase.from('clientes').delete().eq('id_cliente', id);
      await carregarDados();
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <div className="w-9 h-9 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs text-zinc-400 font-semibold tracking-wider uppercase">
          Carregando central de cadastros...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto font-sans pb-12">
      {/* ================= CABEÇALHO (FIGMA) ================= */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Central de cadastros
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Gerencie serviços, fornecedores e clientes utilizados no atendimento.
        </p>
      </div>

      {/* ================= GRADE COM AS 3 COLUNAS DO FIGMA ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ================= COLUNA 1: SERVIÇOS ================= */}
        <div className="bg-[#0c101a] border border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
              <div className="flex items-center space-x-2.5">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                </svg>
                <h3 className="text-sm font-bold text-white">Serviços</h3>
              </div>
              <span className="text-xs text-zinc-400 font-medium">{servicos.length} registros</span>
            </div>

            {/* Input + Botão + */}
            <form onSubmit={handleAbrirCriarServico} className="flex items-center space-x-2 mt-4">
              <input
                type="text"
                value={inputServico}
                onChange={(e) => setInputServico(e.target.value)}
                placeholder="Novo serviço..."
                className="flex-1 px-3.5 py-2.5 bg-[#080c14] border border-zinc-800/80 rounded-xl text-xs text-white placeholder-zinc-400 outline-none focus:border-blue-500 transition"
              />
              <button
                type="submit"
                title="Adicionar serviço"
                className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center shrink-0 transition shadow-md shadow-blue-600/20"
              >
                <span className="text-lg leading-none">+</span>
              </button>
            </form>

            {/* Lista */}
            <div className="divide-y divide-zinc-800/40 mt-4 max-h-[520px] overflow-y-auto pr-1">
              {servicos.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-8">Nenhum serviço cadastrado.</p>
              ) : (
                servicos.map((s) => {
                  const id = s.id_servico || s.id;
                  const preco = Number(s.preco_sugerido || s.preco || 0);

                  return (
                    <div key={id} className="py-3 flex items-center justify-between hover:bg-zinc-800/20 px-2 rounded-xl transition">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-white truncate">{s.nome}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          R$ {preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          onClick={() => setModalServico({ id, nome: s.nome, preco: String(preco) })}
                          title="Editar"
                          className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleExcluirServico(id, s.nome)}
                          title="Excluir"
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ================= COLUNA 2: FORNECEDORES ================= */}
        <div className="bg-[#0c101a] border border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
              <div className="flex items-center space-x-2.5">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-sm font-bold text-white">Fornecedores</h3>
              </div>
              <span className="text-xs text-zinc-400 font-medium">{fornecedores.length} registros</span>
            </div>

            {/* Input + Botão + */}
            <form onSubmit={handleAbrirCriarFornecedor} className="flex items-center space-x-2 mt-4">
              <input
                type="text"
                value={inputFornecedor}
                onChange={(e) => setInputFornecedor(e.target.value)}
                placeholder="Novo fornecedor..."
                className="flex-1 px-3.5 py-2.5 bg-[#080c14] border border-zinc-800/80 rounded-xl text-xs text-white placeholder-zinc-400 outline-none focus:border-blue-500 transition"
              />
              <button
                type="submit"
                title="Adicionar fornecedor"
                className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center shrink-0 transition shadow-md shadow-blue-600/20"
              >
                <span className="text-lg leading-none">+</span>
              </button>
            </form>

            {/* Lista */}
            <div className="divide-y divide-zinc-800/40 mt-4 max-h-[520px] overflow-y-auto pr-1">
              {fornecedores.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-8">Nenhum fornecedor cadastrado.</p>
              ) : (
                fornecedores.map((f) => {
                  const id = f.id_fornecedor || f.id;

                  return (
                    <div key={id} className="py-3 flex items-center justify-between hover:bg-zinc-800/20 px-2 rounded-xl transition">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-white truncate">{f.nome}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                          {f.contato || 'Sem contato'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          onClick={() => setModalFornecedor({ id, nome: f.nome, contato: f.contato || '' })}
                          title="Editar"
                          className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleExcluirFornecedor(id, f.nome)}
                          title="Excluir"
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ================= COLUNA 3: CLIENTES ================= */}
        <div className="bg-[#0c101a] border border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
              <div className="flex items-center space-x-2.5">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="text-sm font-bold text-white">Clientes</h3>
              </div>
              <span className="text-xs text-zinc-400 font-medium">{clientes.length} registros</span>
            </div>

            {/* Input + Botão + */}
            <form onSubmit={handleAbrirCriarCliente} className="flex items-center space-x-2 mt-4">
              <input
                type="text"
                value={inputCliente}
                onChange={(e) => setInputCliente(e.target.value)}
                placeholder="Novo cliente..."
                className="flex-1 px-3.5 py-2.5 bg-[#080c14] border border-zinc-800/80 rounded-xl text-xs text-white placeholder-zinc-400 outline-none focus:border-blue-500 transition"
              />
              <button
                type="submit"
                title="Adicionar cliente"
                className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center shrink-0 transition shadow-md shadow-blue-600/20"
              >
                <span className="text-lg leading-none">+</span>
              </button>
            </form>

            {/* Lista */}
            <div className="divide-y divide-zinc-800/40 mt-4 max-h-[520px] overflow-y-auto pr-1">
              {clientes.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-8">Nenhum cliente cadastrado.</p>
              ) : (
                clientes.map((c) => {
                  const id = c.id_cliente || c.id;

                  return (
                    <div key={id} className="py-3 flex items-center justify-between hover:bg-zinc-800/20 px-2 rounded-xl transition">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-white truncate">{c.nome}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                          {c.whatsapp || c.telefone || 'Sem WhatsApp'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          onClick={() =>
                            setModalCliente({
                              id,
                              nome: c.nome,
                              whatsapp: c.whatsapp || c.telefone || '',
                              cpfCnpj: c.cpf_cnpj || c.cpf || '',
                            })
                          }
                          title="Editar"
                          className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleExcluirCliente(id, c.nome)}
                          title="Excluir"
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL: SERVIÇO ================= */}
      {modalServico && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {modalServico.id ? 'Editar Serviço' : 'Novo Serviço'}
            </h3>

            <form onSubmit={handleSalvarServico} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  NOME DO SERVIÇO *
                </label>
                <input
                  type="text"
                  required
                  value={modalServico.nome}
                  onChange={(e) => setModalServico({ ...modalServico, nome: e.target.value })}
                  placeholder="Ex.: Troca de tela"
                  className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  PREÇO SUGERIDO (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={modalServico.preco}
                  onChange={(e) => setModalServico({ ...modalServico, preco: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => setModalServico(null)}
                  className="px-4 py-2 bg-[#080c14] border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition"
                >
                  {salvando ? 'Salvando...' : 'Salvar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: FORNECEDOR ================= */}
      {modalFornecedor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {modalFornecedor.id ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </h3>

            <form onSubmit={handleSalvarFornecedor} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  NOME DO FORNECEDOR *
                </label>
                <input
                  type="text"
                  required
                  value={modalFornecedor.nome}
                  onChange={(e) => setModalFornecedor({ ...modalFornecedor, nome: e.target.value })}
                  placeholder="Ex.: Distribuidora Central"
                  className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  CONTATO / TELEFONE
                </label>
                <input
                  type="text"
                  value={modalFornecedor.contato}
                  onChange={(e) => setModalFornecedor({ ...modalFornecedor, contato: e.target.value })}
                  placeholder="Ex.: (85) 99999-9999 ou nome do vendedor"
                  className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => setModalFornecedor(null)}
                  className="px-4 py-2 bg-[#080c14] border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition"
                >
                  {salvando ? 'Salvando...' : 'Salvar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CLIENTE ================= */}
      {modalCliente && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {modalCliente.id ? 'Editar Cliente' : 'Novo Cliente'}
            </h3>

            <form onSubmit={handleSalvarCliente} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  NOME DO CLIENTE *
                </label>
                <input
                  type="text"
                  required
                  value={modalCliente.nome}
                  onChange={(e) => setModalCliente({ ...modalCliente, nome: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  WHATSAPP *
                </label>
                <input
                  type="text"
                  required
                  value={modalCliente.whatsapp}
                  onChange={(e) => setModalCliente({ ...modalCliente, whatsapp: e.target.value })}
                  placeholder="(85) 99999-9999"
                  className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  CPF OU CNPJ
                </label>
                <input
                  type="text"
                  value={modalCliente.cpfCnpj}
                  onChange={(e) => setModalCliente({ ...modalCliente, cpfCnpj: e.target.value })}
                  placeholder="Opcional"
                  className="w-full px-3.5 py-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => setModalCliente(null)}
                  className="px-4 py-2 bg-[#080c14] border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition"
                >
                  {salvando ? 'Salvando...' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};