import React, { useState, useEffect } from 'react';

export interface ConfiguracoesLoja {
  nomeLoja: string;
  subtitulo: string;
  cnpj: string;
  telefone: string;
  endereco: string;
  logoUrl: string;
  temaVisual: 'dark' | 'light' | 'midnight';
  corDestaque: 'blue' | 'emerald' | 'purple' | 'amber';
  prazoGarantiaDias: number;
}

const defaultConfigs: ConfiguracoesLoja = {
  nomeLoja: 'Sampaio Cell',
  subtitulo: 'Gestão Técnica Especializada',
  cnpj: '',
  telefone: '(85) 99999-9999',
  endereco: 'Fortaleza - CE',
  logoUrl: '/logo-davi-tec.png',
  temaVisual: 'dark',
  corDestaque: 'blue',
  prazoGarantiaDias: 90,
};

export const Configuracoes: React.FC = () => {
  const [config, setConfig] = useState<ConfiguracoesLoja>(defaultConfigs);
  const [activeSubTab, setActiveSubTab] = useState<'geral' | 'aparencia' | 'garantia'>('aparencia');
  const [salvoFeedback, setSalvoFeedback] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sig_apple_configs');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSalvar = () => {
    localStorage.setItem('sig_apple_configs', JSON.stringify(config));
    window.dispatchEvent(new Event('storage_configs_updated'));
    setSalvoFeedback(true);
    setTimeout(() => setSalvoFeedback(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig((prev) => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const isLight = config.temaVisual === 'light';
  const cardStyle = isLight
    ? 'bg-white border-gray-300 text-gray-900 shadow-sm'
    : 'bg-zinc-900 border-zinc-800 text-white';

  const inputStyle = isLight
    ? 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
    : 'bg-zinc-950 border-zinc-800 text-white focus:border-blue-500';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold">Central de Configurações</h1>
        <p className="text-xs opacity-70">Gerencie a identidade visual, dados do estabelecimento e parâmetros do sistema</p>
      </div>

      {/* Categorias */}
      <div className="flex space-x-2 border-b border-inherit pb-3">
        <button
          onClick={() => setActiveSubTab('geral')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeSubTab === 'geral' ? 'bg-blue-600 text-white shadow' : `${cardStyle} opacity-80 hover:opacity-100`
          }`}
        >
          🏬 Dados da Loja
        </button>
        <button
          onClick={() => setActiveSubTab('aparencia')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeSubTab === 'aparencia' ? 'bg-blue-600 text-white shadow' : `${cardStyle} opacity-80 hover:opacity-100`
          }`}
        >
          🎨 Aparência & Temas
        </button>
        <button
          onClick={() => setActiveSubTab('garantia')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeSubTab === 'garantia' ? 'bg-blue-600 text-white shadow' : `${cardStyle} opacity-80 hover:opacity-100`
          }`}
        >
          ⚙️ Parâmetros & Garantia
        </button>
      </div>

      {/* Dados da Loja */}
      {activeSubTab === 'geral' && (
        <div className={`${cardStyle} border rounded-2xl p-6 space-y-4`}>
          <h2 className="text-base font-bold border-b border-inherit pb-2">Informações do Estabelecimento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium opacity-70 mb-1">Nome da Loja</label>
              <input
                type="text"
                value={config.nomeLoja}
                onChange={(e) => setConfig({ ...config, nomeLoja: e.target.value })}
                className={`w-full border rounded-xl p-3 text-xs outline-none ${inputStyle}`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium opacity-70 mb-1">Subtítulo / Especialidade</label>
              <input
                type="text"
                value={config.subtitulo}
                onChange={(e) => setConfig({ ...config, subtitulo: e.target.value })}
                className={`w-full border rounded-xl p-3 text-xs outline-none ${inputStyle}`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium opacity-70 mb-1">Telefone / WhatsApp Comercial</label>
              <input
                type="text"
                value={config.telefone}
                onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
                className={`w-full border rounded-xl p-3 text-xs outline-none ${inputStyle}`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium opacity-70 mb-1">CNPJ / CPF Comercial</label>
              <input
                type="text"
                value={config.cnpj}
                onChange={(e) => setConfig({ ...config, cnpj: e.target.value })}
                className={`w-full border rounded-xl p-3 text-xs outline-none ${inputStyle}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Aparência */}
      {activeSubTab === 'aparencia' && (
        <div className={`${cardStyle} border rounded-2xl p-6 space-y-6`}>
          <div>
            <h2 className="text-base font-bold border-b border-inherit pb-2 mb-4">Logotipo do Sistema</h2>
            <div className="flex items-center space-x-6">
              <div className={`w-24 h-24 border rounded-2xl flex items-center justify-center p-2 overflow-hidden ${inputStyle}`}>
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt="Logo Prev" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs opacity-50">Sem Logo</span>
                )}
              </div>
              <div className="space-y-2">
                <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer inline-block transition">
                  Carregar Nova Imagem
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                <p className="text-[11px] opacity-60">Recomendado: Imagem PNG ou JPG com fundo transparente.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-base font-bold border-b border-inherit pb-2 mb-4">Tema Visual da Aplicação</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'dark', label: 'Modo Escuro (Dark)', bg: 'bg-zinc-950 text-white border-zinc-800' },
                { id: 'midnight', label: 'Modo Meia-Noite (Midnight)', bg: 'bg-slate-950 text-slate-100 border-slate-800' },
                { id: 'light', label: 'Modo Claro (Light)', bg: 'bg-white text-gray-900 border-gray-300 shadow-sm' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setConfig({ ...config, temaVisual: t.id as any })}
                  className={`p-4 rounded-xl border text-xs font-bold text-center transition ${t.bg} ${
                    config.temaVisual === t.id ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Salvar */}
      <div className="flex items-center justify-between pt-4 border-t border-inherit">
        {salvoFeedback ? (
          <span className="text-xs font-bold text-emerald-500">
            ✓ Configurações salvas e aplicadas em todo o sistema!
          </span>
        ) : (
          <span className="text-xs opacity-60">As alterações passam a valer imediatamente após salvar.</span>
        )}
        <button
          onClick={handleSalvar}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl transition shadow-lg shadow-blue-600/25"
        >
          Salvar Configurações
        </button>
      </div>
    </div>
  );
};