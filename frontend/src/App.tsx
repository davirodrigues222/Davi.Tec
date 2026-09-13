import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { NovaOS } from './pages/NovaOS';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'nova-os'>('dashboard');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' ? <Dashboard /> : <NovaOS />}
    </Layout>
  );
}