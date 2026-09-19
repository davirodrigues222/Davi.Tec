import React, { useState, useEffect } from 'react';

interface Props {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'relatorios' | 'historico' | 'configuracoes' | 'nova-os' | 'garantia-retorno' | 'cadastros';
  setActiveTab: (tab: 'dashboard' | 'relatorios' | 'historico' | 'configuracoes' | 'nova-os' | 'garantia-retorno' | 'cadastros') => void;
}

export const Layout: React.FC<Props> = ({ children, activeTab, setActiveTab }) => {
  const [nomeLoja, setNomeLoja] = useState<string>('Sampaio Cell');
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
      appBg: 'bg-zinc-950 text-zinc-100',
      sidebar: 'bg-zinc-900 border-zinc-800',
      header: 'bg-zinc-900 border-zinc-800 text-zinc-100',
      navHover: 'hover:bg-zinc-800/60 hover:text-white text-zinc-400',
      activeTab: 'bg-blue-600 text-white shadow-md shadow-blue-600/20',
    },
    midnight: {
      appBg: 'bg-slate-950 text-slate-100',
      sidebar: 'bg-slate-900 border-slate-800',
      header: 'bg-slate-900 border-slate-800 text-slate-100',
      navHover: 'hover:bg-slate-800/60 hover:text-white text-slate-400',
      activeTab: 'bg-blue-600 text-white shadow-md shadow-blue-600/20',
    },
    light: {
      appBg: 'bg-gray-100 text-gray-900',
      sidebar: 'bg-white border-gray-200 shadow-sm',
      header: 'bg-white border-gray-200 text-gray-900',
      navHover: 'hover:bg-gray-100 hover:text-gray-900 text-gray-600',
      activeTab: 'bg-blue-600 text-white shadow-md shadow-blue-600/20',
    },
  };

  const estiloAtual = temasEstilos[temaVisual] || temasEstilos.dark;

  return (
    <div className={`min-h-screen flex print:bg-white print:text-black transition-colors duration-300 ${estiloAtual.appBg}`}>
      {/* Sidebar com largura aumentada para w-80 */}
      <aside className={`w-80 border-r flex flex-col print:hidden transition-colors duration-300 ${estiloAtual.sidebar}`}>
        <div className="p-6 border-b border-inherit">
          <div className="flex items-center space-x-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded-lg bg-zinc-950 p-1 border border-zinc-800" />
            ) : (
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30 text-base">
                SC
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-base truncate leading-tight">{nomeLoja}</h1>
              <p className="text-[11px] opacity-70 truncate">{subtitulo}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'dashboard' ? estiloAtual.activeTab : estiloAtual.navHover
            }`}
          >
            <span className="text-sm">📊</span>
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('relatorios')}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'relatorios' ? estiloAtual.activeTab : estiloAtual.navHover
            }`}
          >
            <span className="text-sm">📈</span>
            <span>Análises & Relatórios</span>
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'historico' ? estiloAtual.activeTab : estiloAtual.navHover
            }`}
          >
            <span className="text-sm">📋</span>
            <span>Histórico de Serviços</span>
          </button>

          <button
            onClick={() => setActiveTab('nova-os')}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'nova-os' ? estiloAtual.activeTab : estiloAtual.navHover
            }`}
          >
            <span className="text-sm">➕</span>
            <span>Nova Ordem de Serviço</span>
          </button>

          <button
            onClick={() => setActiveTab('garantia-retorno')}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'garantia-retorno' ? estiloAtual.activeTab : estiloAtual.navHover
            }`}
          >
            <span className="text-sm">⚠️</span>
            <span>Garantia / Retorno</span>
          </button>

          <button
            onClick={() => setActiveTab('cadastros')}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'cadastros' ? estiloAtual.activeTab : estiloAtual.navHover
            }`}
          >
            <span className="text-sm">📁</span>
            <span>Cadastros</span>
          </button>

          <button
            onClick={() => setActiveTab('configuracoes')}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'configuracoes' ? estiloAtual.activeTab : estiloAtual.navHover
            }`}
          >
            <span className="text-sm">⚙️</span>
            <span>Configurações</span>
          </button>
        </nav>

        <div className="p-4 border-t border-inherit text-xs opacity-60 text-center">
          Servidor: <span className="text-emerald-500 font-mono">http://localhost:3000</span>
        </div>
      </aside>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className={`h-16 border-b flex items-center justify-between px-8 print:hidden transition-colors duration-300 ${estiloAtual.header}`}>
          <div className="flex items-center space-x-2 text-xs opacity-70">
            <span>{nomeLoja}</span>
            <span>/</span>
            <span className="font-bold capitalize">{activeTab.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-medium opacity-80">API Conectada</span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto print:p-0">{children}</main>
      </div>
    </div>
  );
};