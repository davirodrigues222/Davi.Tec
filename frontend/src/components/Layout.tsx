import React, { useState, useEffect } from 'react';

interface Props {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'relatorios' | 'historico' | 'configuracoes' | 'nova-os' | 'garantia-retorno' | 'cadastros';
  setActiveTab: (tab: 'dashboard' | 'relatorios' | 'historico' | 'configuracoes' | 'nova-os' | 'garantia-retorno' | 'cadastros') => void;
}

export const Layout: React.FC<Props> = ({ children, activeTab, setActiveTab }) => {
  const [nomeLoja, setNomeLoja] = useState<string>('Davi.tec');
  const [subtitulo, setSubtitulo] = useState<string>('Gestão Técnica Especializada');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [temaVisual, setTemaVisual] = useState<'dark' | 'midnight' | 'light'>('dark');

  const carregarConfigs = () => {
    const saved = localStorage.getItem('sig_apple_configs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.nomeLoja) setNomeLoja(parsed.nomeLoja);
        if (parsed.subtitulo) setSubtitulo(parsed.subtitulo);
        if (parsed.logoUrl) setLogoUrl(parsed.logoUrl);
        if (parsed.temaVisual) setTemaVisual(parsed.temaVisual);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    carregarConfigs();
    window.addEventListener('storage_configs_updated', carregarConfigs);
    return () => window.removeEventListener('storage_configs_updated', carregarConfigs);
  }, []);

  const temasEstilos = {
    dark: {
      appBg: 'bg-[#090a0f] text-zinc-100',
      sidebar: 'bg-[#0e1017] border-zinc-800/60',
      header: 'bg-[#0e1017]/80 backdrop-blur-md border-zinc-800/60 text-zinc-100',
      navHover: 'hover:bg-zinc-800/40 hover:text-white text-zinc-300',
      activeTab: 'bg-blue-600/15 text-blue-400 font-bold border-l-4 border-blue-600 rounded-r-xl rounded-l-none',
    },
    midnight: {
      appBg: 'bg-slate-950 text-slate-100',
      sidebar: 'bg-slate-900 border-slate-800/60',
      header: 'bg-slate-900/80 backdrop-blur-md border-slate-800/60 text-slate-100',
      navHover: 'hover:bg-slate-800/40 hover:text-white text-slate-300',
      activeTab: 'bg-blue-600/15 text-blue-400 font-bold border-l-4 border-blue-600 rounded-r-xl rounded-l-none',
    },
    light: {
      appBg: 'bg-gray-100 text-gray-900',
      sidebar: 'bg-white border-gray-200 shadow-sm',
      header: 'bg-white/80 backdrop-blur-md border-gray-200 text-gray-900',
      navHover: 'hover:bg-gray-100 hover:text-gray-900 text-gray-700',
      activeTab: 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600 rounded-r-xl rounded-l-none',
    },
  };

  const estiloAtual = temasEstilos[temaVisual] || temasEstilos.dark;

  return (
    <div className={`min-h-screen flex print:bg-white print:text-black transition-colors duration-300 ${estiloAtual.appBg}`}>
      {/* Sidebar Corporativa com Nomes Maiores e Destacados */}
      <aside className={`w-96 min-w-[24rem] border-r flex flex-col print:hidden transition-colors duration-300 ${estiloAtual.sidebar}`}>
        
        {/* Bloco da Marca */}
        <div className="p-8 border-b border-zinc-800/40">
          <div className="flex items-center space-x-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-14 h-14 object-contain rounded-xl bg-zinc-950 p-1.5 border border-zinc-800" />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-600/20 text-lg tracking-wider">
                DT
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-extrabold text-base truncate tracking-tight leading-snug text-white">{nomeLoja}</h1>
              <p className="text-xs text-zinc-400 truncate mt-1 font-medium">{subtitulo}</p>
            </div>
          </div>
        </div>

        {/* Navegação com Tipografia Grande (text-sm / text-base) */}
        <nav className="flex-1 p-6 space-y-2.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center px-6 py-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'dashboard' ? estiloAtual.activeTab : estiloAtual.navHover
            }`}
          >
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('relatorios')}
            className={`w-full flex items-center px-6 py-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'relatorios' ? estiloAtual.activeTab : estiloAtual.navHover
            }`}
          >
            <span>Análises & Relatórios</span>
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            className={`w-full flex items-center px-6 py-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'historico' ? estiloAtual.activeTab : estiloAtual.navHover
            }`}
          >
            <span>Histórico de Serviços</span>
          </button>

          <button
            onClick={() => setActiveTab('nova-os')}
            className={`w-full flex items-center px-6 py-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'nova-os' ? estiloAtual.activeTab : estiloAtual.navHover
            }`}
          >
            <span>Nova Ordem de Serviço</span>
          </button>

          <button
            onClick={() => setActiveTab('garantia-retorno')}
            className={`w-full flex items-center px-6 py-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'garantia-retorno' ? estiloAtual.activeTab : estiloAtual.navHover
            }`}
          >
            <span>Garantia / Retorno</span>
          </button>

          <button
            onClick={() => setActiveTab('cadastros')}
            className={`w-full flex items-center px-6 py-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'cadastros' ? estiloAtual.activeTab : estiloAtual.navHover
            }`}
          >
            <span>Cadastros</span>
          </button>

          <button
            onClick={() => setActiveTab('configuracoes')}
            className={`w-full flex items-center px-6 py-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'configuracoes' ? estiloAtual.activeTab : estiloAtual.navHover
            }`}
          >
            <span>Configurações</span>
          </button>
        </nav>
      </aside>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className={`h-16 border-b flex items-center justify-between px-8 print:hidden transition-colors duration-300 ${estiloAtual.header}`}>
          <div className="flex items-center space-x-2 text-xs text-zinc-400">
            <span>{nomeLoja}</span>
            <span className="text-zinc-600">/</span>
            <span className="font-bold text-white capitalize">{activeTab.replace('-', ' ')}</span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto print:p-0">{children}</main>
      </div>
    </div>
  );
};