import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Relatorios } from './pages/Relatorios';
import { HistoricoServicos } from './pages/HistoricoServicos';
import { Configuracoes } from './pages/Configuracoes';
import { NovaOS } from './pages/NovaOS';
import { GarantiaRetorno } from './pages/Garantiaretorno';
import { Cadastros } from './pages/Cadastro'; // Ajuste './components/Cadastros' se estiver lá

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'relatorios' | 'historico' | 'configuracoes' | 'nova-os' | 'garantia-retorno' | 'cadastros'
  >('dashboard');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'relatorios' && <Relatorios />}
      {activeTab === 'historico' && <HistoricoServicos />}
      {activeTab === 'configuracoes' && <Configuracoes />}
      {activeTab === 'nova-os' && <NovaOS />}
      {activeTab === 'garantia-retorno' && <GarantiaRetorno />}
      {activeTab === 'cadastros' && <Cadastros />}
    </Layout>
  );
}