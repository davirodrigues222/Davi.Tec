import React, { useState, useEffect } from 'react';

interface Props {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'nova-os';
  setActiveTab: (tab: 'dashboard' | 'nova-os') => void;
}

export const Layout: React.FC<Props> = ({ children, activeTab, setActiveTab }) => {
  const [nomeLoja, setNomeLoja] = useState<string>('Sampaio Cell');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('sig_apple_nome_loja');
    if (savedName) {
      setNomeLoja(savedName);
    }
  }, []);

  const handleSaveNome = (novoNome: string) => {
    setNomeLoja(novoNome);
    localStorage.setItem('sig_apple_nome_loja', novoNome);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex print:bg-white print:text-black">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col print:hidden">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
              
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-base text-white truncate leading-tight">{nomeLoja}</h1>
              <p className="text-xs text-zinc-400">Gestão Técnica iPhone</p>
            </div>
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                defaultValue={nomeLoja}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveNome(e.currentTarget.value);
                }}
                onBlur={(e) => handleSaveNome(e.currentTarget.value)}
                autoFocus
                className="w-full bg-zinc-950 border border-blue-500 text-xs text-white rounded p-1.5 outline-none"
              />
              <span className="text-[10px] text-zinc-500 block">Pressione Enter para salvar</span>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-[11px] text-blue-400 hover:text-blue-300 transition flex items-center space-x-1 mt-1"
            >
              <span>⚙️ Alterar nome da loja</span>
            </button>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('nova-os')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
              activeTab === 'nova-os'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Nova Ordem de Serviço</span>
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-800 text-xs text-zinc-500 text-center">
          Servidor: <span className="text-emerald-400 font-mono">http://localhost:3000</span>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-8 print:hidden">
          <div className="flex items-center space-x-2 text-sm text-zinc-400">
            <span>{nomeLoja}</span>
            <span>/</span>
            <span className="text-white capitalize">{activeTab.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-zinc-400 font-medium">API Conectada</span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto print:p-0">{children}</main>
      </div>
    </div>
  );
};