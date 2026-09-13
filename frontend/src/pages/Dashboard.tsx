import React, { useEffect, useState } from 'react';
import { StatCard } from '../components/StarCard';
import { StatusBadge } from '../components/StatusBadge';
import { CertidaoGarantia } from '../components/CertidaoGarantia';
import { buscarOrdensServico, atualizarStatusOS } from '../services/api';
import type { OrdemServico } from '../types';

export const Dashboard: React.FC = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOS, setSelectedOS] = useState<OrdemServico | null>(null);

  const carregarOrdens = async () => {
    setLoading(true);
    try {
      const data = await buscarOrdensServico();
      setOrdens(data);
    } catch (error) {
      console.error('Erro ao buscar OS:', error);
      setOrdens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarOrdens();
  }, []);

  const totalEmAberto = ordens.filter(
    (os) => os.status_os !== 'ENTREGUE' && os.status_os !== 'CANCELADO'
  ).length;

  const faturamentoEstimado = ordens.reduce(
    (acc, os) => acc + (os.orcamentoCalculado?.valorTotalOrcamento || 0),
    0
  );

  const aparelhosProntos = ordens.filter((os) => os.status_os === 'PRONTO').length;

  return (
    <>
      <div className="space-y-8 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="OS em Aberto"
            value={totalEmAberto}
            subtext="Em andamento ou análise"
            accentColor="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <StatCard
            title="Faturamento Estimado"
            value={`R$ ${faturamentoEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            subtext="Soma das OS no banco MySQL"
            accentColor="emerald"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Aparelhos Prontos"
            value={aparelhosProntos}
            subtext="Aguardando retirada"
            accentColor="purple"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            }
          />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white">Ordens de Serviço Recentes</h2>
              <p className="text-xs text-zinc-400">Dados síncronos com a base MySQL</p>
            </div>
            <button
              onClick={carregarOrdens}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition"
            >
              Atualizar Tabela
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-zinc-500 text-sm">Carregando ordens de serviço...</div>
            ) : ordens.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-sm">
                <p className="text-base font-medium text-zinc-400">Nenhuma Ordem de Serviço cadastrada.</p>
                <p className="text-xs mt-1">Abra uma nova OS para iniciar as atividades.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="bg-zinc-950/50 text-xs uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-4 px-6">Nº OS</th>
                    <th className="py-4 px-6">Cliente</th>
                    <th className="py-4 px-6">Modelo</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Valor Total</th>
                    <th className="py-4 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {ordens.map((os) => (
                    <tr key={os.id_os} className="hover:bg-zinc-800/30 transition">
                      <td className="py-4 px-6 font-mono font-medium text-blue-400">{os.numero_os}</td>
                      <td className="py-4 px-6 font-medium text-white">{os.cliente?.nome}</td>
                      <td className="py-4 px-6">{os.aparelho?.modelo}</td>
                      <td className="py-4 px-6">
                        <StatusBadge
                          status={os.status_os}
                          onChangeStatus={async (novoStatus) => {
                            try {
                              await atualizarStatusOS(os.id_os, novoStatus);
                              carregarOrdens();
                            } catch (err) {
                              alert('Erro ao atualizar status');
                            }
                          }}
                        />
                      </td>
                      <td className="py-4 px-6 font-semibold text-white">
                        R$ {os.orcamentoCalculado?.valorTotalOrcamento ? os.orcamentoCalculado.valorTotalOrcamento.toFixed(2) : '0.00'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedOS(os)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition border border-zinc-700"
                        >
                          Certidão / Imprimir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {selectedOS && <CertidaoGarantia os={selectedOS} onClose={() => setSelectedOS(null)} />}
    </>
  );
};