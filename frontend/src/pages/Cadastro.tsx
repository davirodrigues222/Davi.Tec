import React, { useState, useEffect } from 'react';

export const Cadastros: React.FC = () => {
  const [servicos, setServicos] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  
  const [novoServicoNome, setNovoServicoNome] = useState('');
  const [novoServicoPreco, setNovoServicoPreco] = useState('');
  
  const [novoFornNome, setNovoFornNome] = useState('');
  const [novoFornContato, setNovoFornContato] = useState('');

  const [novoCliNome, setNovoCliNome] = useState('');
  const [novoCliWhatsapp, setNovoCliWhatsapp] = useState('');
  const [novoCliCpfCnpj, setNovoCliCpfCnpj] = useState('');
  const [novoCliEmail, setNovoCliEmail] = useState('');

  const [carregando, setCarregando] = useState(false);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const resServ = await fetch('http://localhost:3000/v1/cadastros/servicos');
      const dataServ = await resServ.json();
      if (dataServ.sucesso) setServicos(dataServ.data);

      const resForn = await fetch('http://localhost:3000/v1/cadastros/fornecedores');
      const dataForn = await resForn.json();
      if (dataForn.sucesso) setFornecedores(dataForn.data);

      const resCli = await fetch('http://localhost:3000/v1/clientes');
      const dataCli = await resCli.json();
      if (dataCli.sucesso) setClientes(dataCli.data);
    } catch (e) {
      console.error("Erro ao buscar cadastros:", e);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleSalvarServico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoServicoNome.trim()) return;

    try {
      const res = await fetch('http://localhost:3000/v1/cadastros/servicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoServicoNome,
          precoSugerido: novoServicoPreco === '' ? 0 : Number(novoServicoPreco),
        }),
      });
      const data = await res.json();
      if (data.sucesso) {
        setNovoServicoNome('');
        setNovoServicoPreco('');
        carregarDados();
      }
    } catch (err) {
      console.error("Erro ao cadastrar serviço:", err);
    }
  };

  const handleSalvarFornecedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoFornNome.trim()) return;

    try {
      const res = await fetch('http://localhost:3000/v1/cadastros/fornecedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoFornNome,
          contato: novoFornContato,
        }),
      });
      const data = await res.json();
      if (data.sucesso) {
        setNovoFornNome('');
        setNovoFornContato('');
        carregarDados();
      }
    } catch (err) {
      console.error("Erro ao cadastrar fornecedor:", err);
    }
  };

  const handleSalvarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCliNome.trim()) return;

    try {
      const res = await fetch('http://localhost:3000/v1/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoCliNome,
          whatsapp: novoCliWhatsapp,
          cpfCnpj: novoCliCpfCnpj,
          email: novoCliEmail,
        }),
      });
      const data = await res.json();
      if (data.sucesso) {
        setNovoCliNome('');
        setNovoCliWhatsapp('');
        setNovoCliCpfCnpj('');
        setNovoCliEmail('');
        carregarDados();
      }
    } catch (err) {
      console.error("Erro ao cadastrar cliente:", err);
    }
  };

  const handleExcluirCliente = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este cliente?")) return;
    try {
      const res = await fetch(`http://localhost:3000/v1/clientes/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.sucesso) {
        carregarDados();
      } else {
        alert("Erro ao excluir cliente.");
      }
    } catch (err) {
      console.error("Erro ao excluir cliente:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-xs">
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-bold text-white">Central de Cadastros</h2>
        <p className="text-zinc-400 mt-0.5">Gerencie os serviços, fornecedores e clientes cadastrados no sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* SEÇÃO 1: SERVIÇOS */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4 flex flex-col">
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
            <span>🔧</span>
            <h3>Serviços</h3>
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
              placeholder="Preço Sugerido (R$)"
              value={novoServicoPreco}
              onChange={(e) => setNovoServicoPreco(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-emerald-400 font-bold outline-none focus:border-blue-500"
            />
            <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition">
              + Adicionar Serviço
            </button>
          </form>

          <div className="flex-1 overflow-y-auto max-h-56 divide-y divide-zinc-800/50 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
            {carregando ? (
              <p className="text-center text-zinc-500 py-4">Carregando...</p>
            ) : servicos.length === 0 ? (
              <p className="text-center text-zinc-500 py-4">Nenhum serviço.</p>
            ) : (
              servicos.map((s) => (
                <div key={s.id_servico} className="py-2.5 px-2 flex justify-between items-center">
                  <span className="text-white font-medium">{s.nome}</span>
                  <span className="text-emerald-400 font-bold">R$ {Number(s.preco_sugerido || 0).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SEÇÃO 2: FORNECEDORES */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4 flex flex-col">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <span>📦</span>
            <h3>Fornecedores</h3>
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
            <button type="submit" className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition">
              + Adicionar Fornecedor
            </button>
          </form>

          <div className="flex-1 overflow-y-auto max-h-56 divide-y divide-zinc-800/50 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
            {carregando ? (
              <p className="text-center text-zinc-500 py-4">Carregando...</p>
            ) : fornecedores.length === 0 ? (
              <p className="text-center text-zinc-500 py-4">Nenhum fornecedor.</p>
            ) : (
              fornecedores.map((f) => (
                <div key={f.id_fornecedor} className="py-2.5 px-2 flex justify-between items-center">
                  <span className="text-white font-medium">{f.nome}</span>
                  <span className="text-zinc-400">{f.contato || '-'}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SEÇÃO 3: CLIENTES */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4 flex flex-col">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <span>👤</span>
            <h3>Clientes</h3>
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
            <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition">
              + Cadastrar Cliente
            </button>
          </form>

          <div className="flex-1 overflow-y-auto max-h-56 divide-y divide-zinc-800/50 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
            {carregando ? (
              <p className="text-center text-zinc-500 py-4">Carregando...</p>
            ) : clientes.length === 0 ? (
              <p className="text-center text-zinc-500 py-4">Nenhum cliente.</p>
            ) : (
              clientes.map((c) => (
                <div key={c.id_cliente} className="py-2.5 px-2 flex justify-between items-center hover:bg-zinc-900/30 rounded-lg">
                  <div>
                    <span className="text-white font-medium block">{c.nome}</span>
                    <span className="text-[10px] text-zinc-500">{c.whatsapp || 'Sem WhatsApp'}</span>
                  </div>
                  <button
                    onClick={() => handleExcluirCliente(c.id_cliente)}
                    className="p-1 text-red-400 hover:bg-red-500/20 rounded-md transition"
                    title="Excluir cliente"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};